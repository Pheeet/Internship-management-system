"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { baseInternshipFormSchema } from "@/schemas/internshipForm";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// สร้าง schema เฉพาะส่วนที่แก้ไขในหน้านี้
const profileSchema = baseInternshipFormSchema.pick({
  title: true,
  firstName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  phone: true,
  address: true,
  parentPhone: true,
});

export async function saveProfileInfo(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อนทำการแก้ไข" };
    }

    // 1. Process File Upload (Profile Picture)
    let profilePictureUrl: string | undefined = undefined;
    const file = formData.get("profilePhoto") as File | null;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // ดึงนามสกุลไฟล์
      const ext = path.extname(file.name) || ".jpg";
      const fileName = `${user.id}-${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), "storage", "uploads", "profile");

      fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);

      // Force Synchronous Write to guarantee disk persistence before sending URL back
      fs.writeFileSync(filePath, buffer);

      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/intern";
      const fileUrl = `${basePath}/api/files/profile/${fileName}`;

      console.log("---- STORAGE DEBUG (Profile) ----");
      console.log("Saved to storage:", filePath);
      console.log("Returning Proxy URL:", fileUrl);
      console.log("---------------------------------");

      profilePictureUrl = fileUrl;
    }

    // 2. Validate Data
    const rawData = {
      title: formData.get("title"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      gender: formData.get("gender"),
      dateOfBirth: formData.get("dateOfBirth"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      parentPhone: formData.get("parentPhone"),
    };

    const validatedData = profileSchema.safeParse(rawData);

    if (!validatedData.success) {
      console.error("Zod Validation Error:", validatedData.error.flatten().fieldErrors);
      return {
        success: false,
        error: "ข้อมูลไม่ถูกต้องกรุณาตรวจสอบ",
        fields: validatedData.error.flatten().fieldErrors
      };
    }

    // 3. Upsert into Prisma DB
    const updatePayload: any = {
      ...validatedData.data,
    };
    if (profilePictureUrl) {
      updatePayload.profilePictureUrl = profilePictureUrl;
    }

    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: updatePayload,
      create: {
        userId: user.id,
        ...validatedData.data,
        educationLevel: "ไม่ระบุ", // Default fallback values since they're required in DB but not on this form
        institution: "ไม่ระบุ",
        major: "ไม่ระบุ",
        ...(profilePictureUrl ? { profilePictureUrl } : {}),
      },
    });

    revalidatePath("/", "layout");
  } catch (error: any) {
    console.error("CRITICAL ERROR in saveProfileInfo:", error);
    return { success: false, error: error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล (Save Error)" };
  }

  // Redirect must be called outside of try-catch block
  redirect("/internship");
}
