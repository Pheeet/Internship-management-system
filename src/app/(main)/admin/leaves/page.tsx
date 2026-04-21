import prisma from "@/lib/prisma";
import LeavesClient from "./LeavesClient";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLeavesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  // Fetch all Leave Requests descending by date
  const leaveRequestsList = await prisma.leaveRequest.findMany({
    include: {
      profile: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="w-full h-full bg-[#f8f9fa] min-h-[90vh]">
      <LeavesClient leaveRequests={leaveRequestsList} />
    </div>
  );
}
