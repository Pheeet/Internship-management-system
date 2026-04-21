"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { leaveRequestSchema } from "@/schemas/leaveRequest";

export async function submitLeaveRequest(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" };
    }

    let profile = await prisma.studentProfile.findFirst({
      where: { userId: String(user.id) }
    });

    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: {
          userId: String(user.id),
          firstName: "Mock",
          lastName: "Student",
          gender: "ไม่ระบุ",
          dateOfBirth: new Date(),
          phone: "0800000000",
          address: "Mock Address",
          parentPhone: "0800000001",
          educationLevel: "ปริญญาตรี",
          institution: "มหาวิทยาลัยเชียงใหม่",
          major: "Mock Major",
        }
      });
    }

    // Process Form Data
    const rawData = {
      leaveType: formData.get("leaveType"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      reason: formData.get("reason"),
      attachment: formData.get("attachment") as File | null
    };

    // Ignore file if empty
    if (rawData.attachment && rawData.attachment.size === 0) {
      rawData.attachment = null;
    }

    const validatedData = leaveRequestSchema.safeParse(rawData);

    if (!validatedData.success) {
      console.error("Zod Validation Error:", validatedData.error.flatten().fieldErrors);
      return {
        success: false,
        error: "ข้อมูลไม่ถูกต้องกรุณาตรวจสอบข้อผิดพลาด",
        fields: validatedData.error.flatten().fieldErrors
      };
    }

    const data = validatedData.data;

    let attachmentUrl = null;
    let attachmentName = null;

    // Handle File Upload
    if (data.attachment) {
      const uploadDir = path.join(process.cwd(), "storage", "uploads", "leaves");
      fs.mkdirSync(uploadDir, { recursive: true });

      const arrayBuffer = await data.attachment.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const ext = path.extname(data.attachment.name) || "";
      const basename = path.basename(data.attachment.name, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `leave-${user.id}-${Date.now()}-${basename}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Force Synchronous Write to guarantee disk persistence
      fs.writeFileSync(filePath, buffer);

      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/intern";
      attachmentUrl = `${basePath}/api/files/leaves/${fileName}`;
      attachmentName = data.attachment.name;

      console.log("---- STORAGE DEBUG (Leave Request) ----");
      console.log("Saved to storage:", filePath);
      console.log("Returning Proxy URL:", attachmentUrl);
      console.log("---------------------------------------");
    }

    // Save to Database
    await prisma.leaveRequest.create({
      data: {
        profileId: profile.id,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        attachmentUrl,
        attachmentName,
        status: "PENDING"
      }
    });

    // Record Activity Log for Admin visibility
    await prisma.activityLog.create({
      data: {
        action: "SUBMIT_LEAVE",
        actorName: `${profile.firstName} ${profile.lastName}`,
        actorRole: user.role, // "student"
        targetName: `${profile.firstName} ${profile.lastName}`,
        details: `ยื่นใบลา${data.leaveType}: ${data.reason.substring(0, 80)}`,
      }
    });

    revalidatePath("/", "layout");
    revalidatePath("/student");
    revalidatePath("/admin");
    revalidatePath("/admin/leaves");
    revalidatePath("/admin/activities");
    return { success: true, message: "ยื่นใบลาสำเร็จ ระบบได้ส่งคำร้องให้ผู้ดูแลแล้ว" };

  } catch (error: any) {
    console.error("Submit Leave Error:", error);
    return { success: false, error: error?.message || "เกิดข้อผิดพลาดในการส่งคำขอลา" };
  }
}
