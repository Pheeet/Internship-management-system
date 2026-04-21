import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
import DashboardClient from "./DashboardClient";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  // 1. Fetch Aggregations
  const pendingApplicationsCount = await prisma.internshipDetails.count({
    where: {
      internshipStatus: { in: ["PENDING", "รอดำเนินการเอกสาร", "รออนุมัติ"] }
    }
  });

  const activeInternsCount = await prisma.internshipDetails.count({
    where: {
      internshipStatus: { in: ["ACTIVE", "กำลังฝึกงาน"] }
    }
  });

  const urgentLeaveCount = await prisma.leaveRequest.count({
    where: {
      status: "PENDING"
    }
  });

  // 2. Fetch Recent Submissions (Students applying to internships)
  const recentSubmissions = await prisma.internshipDetails.findMany({
    where: {
      internshipStatus: { in: ["PENDING", "รอดำเนินการเอกสาร", "รออนุมัติ"] }
    },
    include: {
      profile: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // 2.1 Fetch Active Interns
  const activeInterns = await prisma.internshipDetails.findMany({
    where: {
      internshipStatus: { in: ["ACTIVE", "กำลังฝึกงาน"] }
    },
    include: {
      profile: {
        include: {
          user: true
        }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 5
  });

  // 2.2 Fetch Pending Leave Requests
  const pendingLeaveRequests = await prisma.leaveRequest.findMany({
    where: {
      status: "PENDING"
    },
    include: {
      profile: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // 3. Fetch real Activity Logs from the database
  const recentActivityLogs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const activities = recentActivityLogs.map(log => {
    let color = "green";
    let title = log.action;

    if (log.action === "APPROVE_DOC") { color = "green"; title = "อนุมัติเอกสารฝึกงาน"; }
    else if (log.action === "REJECT_DOC") { color = "red"; title = "ตีกลับเอกสารฝึกงาน"; }
    else if (log.action === "APPROVE_LEAVE") { color = "green"; title = "อนุมัติใบลา"; }
    else if (log.action === "REJECT_LEAVE") { color = "red"; title = "ไม่อนุมัติใบลา"; }
    else if (log.action === "UPDATE_INFO") { color = "yellow"; title = "แก้ไขข้อมูล"; }
    else if (log.action === "EXPORT") { color = "yellow"; title = "นำออกข้อมูล"; }
    else if (log.action === "DELETE_DOC") { color = "red"; title = "ลบเอกสาร"; }
    else if (log.action === "RE_UPLOAD_DOC") { color = "green"; title = "อัปโหลดเอกสารใหม่"; }
    else if (log.action === "SUBMIT_DOC") { color = "green"; title = "ส่งคำร้องขอฝึกงาน"; }

    return {
      id: log.id,
      type: log.action,
      title,
      description: `${log.actorName} → ${log.targetName}`,
      date: log.createdAt,
      color
    };
  });

  return (
    <DashboardClient
      stats={{ pendingApplicationsCount, activeInternsCount, urgentLeaveCount }}
      recentSubmissions={recentSubmissions}
      activeInterns={activeInterns}
      leaveRequests={pendingLeaveRequests}
      activities={activities}
      adminName={user.name || "Admin"}
    />
  );
}
