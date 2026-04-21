import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    redirect("/login");
  }

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: String(user.id) },
    include: {
      internship: true,
      files: true,
      user: true,
      leaveRequests: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    }
  });

  if (!profile || !profile.firstName || profile.firstName === "ไม่ระบุ") {
    redirect("/profile");
  }

  const recentActivities = await prisma.activityLog.findMany({
    where: { targetName: `${profile.firstName} ${profile.lastName}` },
    orderBy: { createdAt: 'desc' },
    take: 4
  });

  console.log("Activities count:", recentActivities.length);
  console.log("Profile name:", `${profile.firstName} ${profile.lastName}`);

  return (
    <DashboardClient profile={profile} recentActivities={recentActivities} />
  );
}
