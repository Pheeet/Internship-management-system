import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";

export default async function StudentProfilePage() {
  const user = await getCurrentUser();
  
  if (!user || !user.id) {
    redirect("/login");
  }

  try {
    // Fetch true user profile from DB explicitly using string cast for safety
    const profile = await prisma.studentProfile.findFirst({
      where: { userId: String(user.id) },
    });

    return <ProfileForm initialData={profile} email={user.email} />;
  } catch (error) {
    console.error("Failed to fetch student profile:", error);
    return <ProfileForm initialData={null} email={user.email} />;
  }
}

