import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
import InternshipsClient from "./InternshipsClient";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminInternshipsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  // 1. Fetch Aggregations specifically for "Internships/Applications" scope
  const allApplications = await prisma.internshipDetails.count();
  
  const pendingCount = await prisma.internshipDetails.count({
    where: {
      internshipStatus: { in: ["PENDING", "รอดำเนินการเอกสาร", "Pending Review", "รอตรวจสอบ", "รออนุมัติ"] }
    }
  });

  const approvedCount = await prisma.internshipDetails.count({
    where: {
      internshipStatus: { in: ["ACTIVE", "กำลังฝึกงาน", "Approved", "อนุมัติแล้ว", "ฝึกงานเสร็จสิ้น", "COMPLETED"] }
    }
  });

  // 2. Fetch Master Applications Directives
  const applicationsList = await prisma.internshipDetails.findMany({
    include: {
      profile: {
        include: {
          user: true,
          files: true // Preloading attachment entities for Document Drawer Verification
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // 3. Fetch Admins for Supervisor suggestions
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    include: { profile: true }
  });

  return (
    <div className="w-full h-full bg-[#f8f9fa] min-h-[90vh]">
      <InternshipsClient 
         stats={{ pendingCount, approvedCount, totalCount: allApplications }}
         applications={applicationsList}
         admins={admins}
      />
    </div>
  );
}
