"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { adminInternshipSchema } from "@/lib/schemas/admin-internship.schema";
import type { AdminInternshipFormValues } from "@/lib/schemas/admin-internship.schema";

export async function updateInternshipStatus(
  internshipId: string, 
  fileUpdates: { id: string; status: string; rejectReason?: string | null }[]
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized access. Admin role required.");
    }

    const { updatedInternship, adminName } = await prisma.$transaction(async (tx) => {
      // 1. Update individual file statuses
      for (const file of fileUpdates) {
        await tx.fileAttachment.update({
          where: { id: file.id },
          data: {
            status: file.status,
            rejectReason: file.status === "REJECTED" ? file.rejectReason : null
          }
        });
      }

      // 2. Re-fetch ALL files for this internship to calculate correct overall status
      const internshipRecord = await tx.internshipDetails.findUnique({
        where: { id: internshipId },
        include: { profile: { include: { files: true } } }
      });
      const allFiles = internshipRecord?.profile?.files ?? [];

      const anyRejected = allFiles.some(f => f.status === "REJECTED");
      const allApproved = allFiles.length > 0 && allFiles.every(f => f.status === "APPROVED");

      let calculatedStatus = "Reviewing";
      if (anyRejected) {
        calculatedStatus = "Rejected";
      } else if (allApproved) {
        calculatedStatus = "Approved";
      }

      // 3. Aggregate rejection reasons from ALL rejected files
      const aggregatedReason = allFiles
        .filter(f => f.status === "REJECTED")
        .map(f => f.rejectReason)
        .filter(Boolean)
        .join(", ");

      // 4. Update InternshipDetails record
      const updated = await tx.internshipDetails.update({
        where: { id: internshipId },
        data: {
          internshipStatus: calculatedStatus,
          rejectReason: anyRejected ? aggregatedReason : null
        },
        include: { profile: true }
      });

      // 5. Get admin info for logging
      const adminProfile = await tx.studentProfile.findFirst({ where: { userId: user.id } });
      const name = adminProfile
        ? `${adminProfile.firstName} ${adminProfile.lastName}`
        : user.name || user.email || "Admin";

      return { updatedInternship: updated, adminName: name };
    });

    const studentName = `${updatedInternship.profile.firstName} ${updatedInternship.profile.lastName}`;
    const isApprove = updatedInternship.internshipStatus === "Approved";

    // Record Activity Log
    await prisma.activityLog.create({
      data: {
        action: isApprove ? "APPROVE_DOC" : "REJECT_DOC",
        actorName: adminName,
        actorRole: user.role, // "admin"
        targetName: studentName,
        details: updatedInternship.rejectReason || (isApprove ? `อนุมัติเอกสารฝึกงานของ ${studentName}` : `ตีกลับเอกสารฝึกงานของ ${studentName}`),
      }
    });

    revalidatePath("/admin/internships");
    revalidatePath("/admin");
    revalidatePath("/admin/activities");
    revalidatePath("/student");
    revalidatePath("/", "layout");

    return { 
      success: true, 
      message: `Internship status transitioned to ${updatedInternship.internshipStatus}.`,
      data: updatedInternship 
    };

  } catch (error) {
    console.error("[updateInternshipStatus] Error:", error);
    return { success: false, error: "Failed to update internship status." };
  }
}

export async function updateLeaveStatus(leaveId: string, status: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized access. Admin role required.");
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: status },
      include: { profile: true }
    });

    // Determine admin display name
    const adminProfile = await prisma.studentProfile.findFirst({ where: { userId: user.id } });
    const adminName = adminProfile
      ? `${adminProfile.firstName} ${adminProfile.lastName}`
      : user.name || user.email || "Admin";

    const studentName = `${updatedLeave.profile.firstName} ${updatedLeave.profile.lastName}`;
    const isApprove = status === "Approved";

    // Record Activity Log
    await prisma.activityLog.create({
      data: {
        action: isApprove ? "APPROVE_LEAVE" : "REJECT_LEAVE",
        actorName: adminName,
        actorRole: user.role, // "admin"
        targetName: studentName,
        details: isApprove ? `อนุมัติใบลาของ ${studentName}` : `ไม่อนุมัติใบลาของ ${studentName}`,
      }
    });

    revalidatePath("/admin/leaves");
    revalidatePath("/admin");
    revalidatePath("/admin/activities");

    return { 
      success: true, 
      message: `Leave Request status permanently transitioned to ${status}.`,
      data: updatedLeave 
    };

  } catch (error) {
    console.error("[updateLeaveStatus] Error:", error);
    return { success: false, error: "Failed to update leave request status." };
  }
}

export async function getActivities({
  searchQuery = "",
  actionType = "ALL",
  startDate,
  endDate,
  skip = 0,
  take = 20,
}: {
  searchQuery?: string;
  actionType?: string;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const whereClause: any = {};

    if (searchQuery) {
      whereClause.OR = [
        { actorName: { contains: searchQuery, mode: "insensitive" } },
        { targetName: { contains: searchQuery, mode: "insensitive" } },
        { details: { contains: searchQuery, mode: "insensitive" } }
      ];
    }

    if (actionType && actionType !== "ALL") {
      switch(actionType) {
        // Legacy mapped keys (kept for backwards compat)
        case "APPROVED_DOC": whereClause.action = "APPROVE_DOC"; break;
        case "REJECTED_DOC": whereClause.action = "REJECT_DOC"; break;
        case "APPROVED_LEAVE": whereClause.action = "APPROVE_LEAVE"; break;
        case "REJECTED_LEAVE": whereClause.action = "REJECT_LEAVE"; break;
        case "UPDATED_INFO": whereClause.action = "UPDATE_INFO"; break;
        case "EXPORTED_DATA": whereClause.action = "EXPORT"; break;
        // Direct action type keys (used by ActivitiesClient filter)
        default: whereClause.action = actionType; break;
      }
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.activityLog.count({ where: whereClause })
    ]);

    return { success: true, data: logs, total };
  } catch (error) {
    console.error("[getActivities] Error:", error);
    return { success: false, error: "Failed to fetch activities" };
  }
}

export async function updateStudentAndInternshipInfo(
  profileId: string,
  internshipId: string,
  data: AdminInternshipFormValues
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized access. Admin role required.");
    }

    // Validate data with Zod (as double check on server)
    const validatedData = adminInternshipSchema.parse(data);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Student Profile
      const updatedProfile = await tx.studentProfile.update({
        where: { id: profileId },
        data: {
          title: validatedData.title,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          gender: validatedData.gender,
          dateOfBirth: validatedData.dateOfBirth,
          phone: validatedData.phone,
          address: validatedData.address,
          parentPhone: validatedData.parentPhone,
          educationLevel: validatedData.educationLevel,
          institution: validatedData.institution,
          faculty: validatedData.faculty,
          major: validatedData.major,
          coopAdvisorName: validatedData.coopAdvisorName,
          advisorPhone: validatedData.advisorPhone,
        },
      });

      // 2. Update Internship Details
      const updatedInternship = await tx.internshipDetails.update({
        where: { id: internshipId },
        data: {
          position: validatedData.position,
          departmentUnit: validatedData.departmentUnit,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          supervisorName: validatedData.supervisorName,
          additionalDetails: validatedData.additionalDetails,
        },
      });

      return { updatedProfile, updatedInternship };
    });

    // Record Activity Log
    const adminProfile = await prisma.studentProfile.findFirst({ where: { userId: user.id } });
    const adminName = adminProfile
      ? `${adminProfile.firstName} ${adminProfile.lastName}`
      : user.name || user.email || "Admin";

    const studentName = `${result.updatedProfile.firstName} ${result.updatedProfile.lastName}`;

    await prisma.activityLog.create({
      data: {
        action: "UPDATE_INFO",
        actorName: adminName,
        actorRole: user.role, // "admin"
        targetName: studentName,
        details: `แก้ไขข้อมูลของนักศึกษา: ${studentName}`,
      }
    });

    revalidatePath("/admin/internships");
    revalidatePath("/admin");
    revalidatePath("/admin/activities");

    return { 
      success: true, 
      message: "Data updated successfully.",
      data: result 
    };

  } catch (error) {
    console.error("[updateStudentAndInternshipInfo] Error:", error);
    return { success: false, error: "Failed to update information." };
  }
}

