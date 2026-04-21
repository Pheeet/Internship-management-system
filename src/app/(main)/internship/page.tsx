import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import InternshipForm from "./InternshipForm";
import { redirect } from "next/navigation";

export default async function InternshipPage() {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    redirect("/login");
  }
  // Explicit narrowing — redirect() throws but TypeScript may not infer `never` in all configs
  const currentUser = user!;

  // Fetch both profile and related internship details
  const profile = await prisma.studentProfile.findFirst({
    where: { userId: String(currentUser.id) },
    include: {
      internship: true,
      files: true,
      user: { select: { email: true } }, // pull email directly from DB
    }
  });

  // If no profile or essential data is missing, force them to personal info
  if (!profile || !profile.firstName || profile.firstName === "ไม่ระบุ") {
    redirect("/profile");
  }

  // Automatic Backfill: If internship exists but snapshotTitle is NULL (old data), 
  // capture current profile data into snapshots.
  let currentInternship = profile.internship;
  if (currentInternship && !currentInternship.snapshotTitle) {
    currentInternship = await prisma.internshipDetails.update({
      where: { id: currentInternship.id },
      data: {
        snapshotTitle: profile.title,
        snapshotFirstName: profile.firstName,
        snapshotLastName: profile.lastName,
        snapshotPhone: profile.phone,
        snapshotGender: profile.gender,
        snapshotProfilePic: profile.profilePictureUrl,
        snapshotAddress: profile.address,
        snapshotDOB: profile.dateOfBirth,
        snapshotParentPhone: profile.parentPhone,
      }
    });
  }

  // Fetch all admins for the Supervisor dropdown
  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN" },
    include: { profile: true }
  });

  const admins = adminUsers.map(admin => {
    return {
      id: admin.id,
      name: admin.profile?.firstName && admin.profile?.lastName 
        ? `${admin.profile.title || ''} ${admin.profile.firstName} ${admin.profile.lastName}`.trim() 
        : admin.email
    };
  });

  // Lock form fields once any status has been set after first submission.
  // Exception: Allow editing (unlock) when status is "Rejected" so student can resubmit.
  const status = profile.internship?.internshipStatus;
  const isLocked = status && status !== "Rejected";

  return (
    <InternshipForm 
      initialProfile={profile} 
      initialInternship={currentInternship} 
      files={profile.files}
      admins={admins}
      isLocked={isLocked}
      internshipStatus={profile.internship?.internshipStatus || null}
      userEmail={profile.user?.email ?? currentUser.email}
    />
  );
}
