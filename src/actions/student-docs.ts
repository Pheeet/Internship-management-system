"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

export async function uploadDocumentAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" };
    }

    const file = formData.get("file") as File;
    const fileId = formData.get("fileId") as string; // Specific FileAttachment ID

    if (!file || file.size === 0) {
      return { success: false, error: "กรุณาเลือกไฟล์ที่ต้องการอัปโหลด" };
    }

    const profile = await prisma.studentProfile.findFirst({
      where: { userId: String(user.id) }
    });

    if (!profile) {
      return { success: false, error: "ไม่พบข้อมูลโปรไฟล์" };
    }

    // 1. Process File Upload
    const uploadDir = path.join(process.cwd(), "storage", "uploads", "attachments");
    fs.mkdirSync(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name) || "";
    const basename = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${user.id}-${fileId || 'new'}-${Date.now()}-${basename}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Force Synchronous Write to guarantee disk persistence
    fs.writeFileSync(filePath, buffer);

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/intern";
    const fileUrl = `${basePath}/api/files/attachments/${fileName}`;

    console.log("---- STORAGE DEBUG (Student Doc) ----");
    console.log("Saved to storage:", filePath);
    console.log("Returning Proxy URL:", fileUrl);
    console.log("-------------------------------------");

    // 2. Update Database
    if (fileId) {
      // Update existing file record (with security check for profileId)
      await prisma.fileAttachment.update({
        where: {
          id: fileId,
          profileId: profile.id
        },
        data: {
          fileName: file.name,
          fileUrl: fileUrl,
          fileType: file.type,
          fileSize: file.size,
          status: "PENDING",
          rejectReason: null
        }
      });
    } else {
      // Create new if no ID provided
      await prisma.fileAttachment.create({
        data: {
          profileId: profile.id,
          fileName: file.name,
          fileUrl: fileUrl,
          fileType: file.type,
          fileSize: file.size,
          status: "PENDING"
        }
      });
    }

    // 3. Activity Log
    await prisma.activityLog.create({
      data: {
        action: "RE_UPLOAD_DOC",
        actorName: `${profile.firstName} ${profile.lastName}`,
        targetName: `${profile.firstName} ${profile.lastName}`,
        details: `อัปโหลดเอกสารใหม่โคลนทับไฟล์เดิม: ${file.name}ที่`,
      }
    });

    revalidatePath("/", "layout");
    revalidatePath("/student");
    revalidatePath("/admin");
    return { success: true, message: "อัปโหลดเอกสารสำเร็จ" };

  } catch (error: any) {
    console.error("Upload Document Error:", error);
    return { success: false, error: error?.message || "เกิดข้อผิดพลาดจากระบบ" };
  }
}

export async function deleteDocumentAction(fileId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" };

    const profile = await prisma.studentProfile.findFirst({
      where: { userId: String(user.id) }
    });
    if (!profile) return { success: false, error: "ไม่พบข้อมูลโปรไฟล์" };

    // Security: Only delete if this file belongs to the current user's profile
    const file = await prisma.fileAttachment.findFirst({
      where: { id: fileId, profileId: profile.id }
    });
    if (!file) return { success: false, error: "ไม่พบเอกสารหรือไม่มีสิทธิ์ลบ" };

    await prisma.fileAttachment.delete({ where: { id: fileId } });

    await prisma.activityLog.create({
      data: {
        action: "DELETE_DOC",
        actorName: `${profile.firstName} ${profile.lastName}`,
        targetName: `${profile.firstName} ${profile.lastName}`,
        details: `ลบเอกสาร: ${file.fileName}`,
      }
    });

    revalidatePath("/", "layout");
    revalidatePath("/student");
    revalidatePath("/internship");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Document Error:", error);
    return { success: false, error: error?.message || "เกิดข้อผิดพลาดจากระบบ" };
  }
}
