import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillSnapshots() {
  console.log("Starting backfill for internship snapshots...");

  const internships = await prisma.internshipDetails.findMany({
    where: {
      snapshotTitle: null, // Only backfill those missing snapshots
    },
    include: {
      profile: true,
    },
  });

  console.log(`Found ${internships.length} internships to backfill.`);

  for (const internship of internships) {
    const { profile } = internship;
    if (!profile) {
      console.warn(`No profile found for internship ${internship.id}, skipping.`);
      continue;
    }

    await prisma.internshipDetails.update({
      where: { id: internship.id },
      data: {
        snapshotTitle: profile.title,
        snapshotFirstName: profile.firstName,
        snapshotLastName: profile.lastName,
        snapshotPhone: profile.phone,
        snapshotAddress: profile.address,
        snapshotDOB: profile.dateOfBirth,
        snapshotProfilePic: profile.profilePictureUrl,
      },
    });

    console.log(`Backfilled snapshot for student: ${profile.firstName} ${profile.lastName}`);
  }

  console.log("Backfill complete!");
}

backfillSnapshots()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
