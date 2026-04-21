"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { internshipFormSchema } from "@/schemas/internshipForm";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitInternshipApplication(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" };
    }

    let profile = await prisma.studentProfile.findFirst({
      where: { userId: String(user.id) }
    });

    if (!profile) {
      // Create a mock profile for testing purposes if none exists
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

    // 1. Process Form Data
    const rawData = {
      title: formData.get("title"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      gender: formData.get("gender"),
      dateOfBirth: formData.get("dateOfBirth"),
      phone: formData.get("phone"),
      email: user.email || formData.get("email"), // prefer session email — always correct
      address: formData.get("address"),
      parentPhone: formData.get("parentPhone"),

      educationLevel: formData.get("educationLevel"),
      institution: formData.get("institution"),
      faculty: formData.get("faculty") || undefined,
      major: formData.get("major"),
      coopAdvisorName: formData.get("coopAdvisorName") || undefined,
      advisorPhone: formData.get("advisorPhone") || undefined,

      internshipStatus: "รอดำเนินการเอกสาร", // Explicitly hardcode as per new instruction
      position: formData.get("position"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      departmentUnit: formData.get("departmentUnit"),
      supervisorName: formData.get("supervisorName"),
      additionalDetails: formData.get("additionalDetails") || undefined,

      profilePictureUrl: profile.profilePictureUrl || "https://example.com/dummy.jpg", // placeholder for validation
    };

    const validatedData = internshipFormSchema.safeParse(rawData);

    if (!validatedData.success) {
      console.error("Zod Validation Error:", validatedData.error.flatten().fieldErrors);
      return {
        success: false,
        error: "ข้อมูลไม่ถูกต้องกรุณาตรวจสอบข้อผิดพลาด",
        fields: validatedData.error.flatten().fieldErrors
      };
    }

    const data = validatedData.data;

    // Strict Validation for Supervisor matching valid Admins
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      include: { profile: true }
    });

    const validAdminNames = adminUsers.map((admin) => {
      return admin.profile?.firstName && admin.profile?.lastName
        ? `${admin.profile.title || ''} ${admin.profile.firstName} ${admin.profile.lastName}`.trim()
        : admin.email
    });

    if (!validAdminNames.includes(data.supervisorName)) {
      return { success: false, error: "ชื่อหัวหน้างานไม่ถูกต้อง โปรดเลือกจากในระบบที่เป็นผู้ดูแลเท่านั้น" };
    }

    // 2. Handle File Uploads (Attachments)
    const files = formData.getAll("attachments") as File[];
    const uploadedFiles: Array<{ fileName: string, fileType: string, fileSize: number, fileUrl: string }> = [];

    if (files && files.length > 0 && files[0].size > 0) {
      const uploadDir = path.join(process.cwd(), "storage", "uploads", "attachments");
      fs.mkdirSync(uploadDir, { recursive: true });

      for (const file of files) {
        if (file.size === 0) continue;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate safe unique filename
        const ext = path.extname(file.name) || "";
        const basename = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${user.id}-${Date.now()}-${basename}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        // Force Synchronous Write to guarantee disk persistence
        fs.writeFileSync(filePath, buffer);

        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/intern";
        const fileUrl = `${basePath}/api/files/attachments/${fileName}`;

        console.log("---- STORAGE DEBUG (Internship Attachment) ----");
        console.log("Saved to storage:", filePath);
        console.log("Returning Proxy URL:", fileUrl);
        console.log("-----------------------------------------------");

        uploadedFiles.push({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: fileUrl
        });
      }
    }

    // Handle Profile Picture Override if uploaded
    const profilePicUpload = formData.get("profilePicture") as File | null;
    let updatableProfilePicUrl = profile.profilePictureUrl;

    if (profilePicUpload && profilePicUpload.size > 0 && profilePicUpload.name !== "undefined") {
      const uploadDir = path.join(process.cwd(), "storage", "uploads", "profile");
      fs.mkdirSync(uploadDir, { recursive: true });

      const arrayBuffer = await profilePicUpload.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const ext = path.extname(profilePicUpload.name) || "";
      const fileName = `profile-${user.id}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Force Synchronous Write to guarantee disk persistence
      fs.writeFileSync(filePath, buffer);

      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/intern";
      const fileUrl = `${basePath}/api/files/profile/${fileName}`;

      console.log("---- STORAGE DEBUG (Internship Profile) ----");
      console.log("Saved to storage:", filePath);
      console.log("Returning Proxy URL:", fileUrl);
      console.log("--------------------------------------------");

      updatableProfilePicUrl = fileUrl;
    }

    // 3. Update Database 
    // Constrain: Create/Update InternshipDetails AND explicitly set status to "รอดำเนินการเอกสาร"
    await prisma.$transaction(async (tx) => {
      // Update education background and profile picture in StudentProfile
      await tx.studentProfile.update({
        where: { id: profile.id },
        data: {
          educationLevel: data.educationLevel,
          institution: data.institution,
          faculty: data.faculty,
          major: data.major,
          coopAdvisorName: data.coopAdvisorName,
          advisorPhone: data.advisorPhone,
          profilePictureUrl: updatableProfilePicUrl || data.profilePictureUrl
        }
      });

      // Upsert InternshipDetails
      await tx.internshipDetails.upsert({
        where: { profileId: profile.id },
        update: {
          internshipStatus: "รอดำเนินการเอกสาร",
          position: data.position,
          startDate: data.startDate,
          endDate: data.endDate,
          departmentUnit: data.departmentUnit,
          supervisorName: data.supervisorName,
          additionalDetails: data.additionalDetails,
          rejectReason: null,
          // Re-capture snapshot on every resubmit (e.g. after rejection)
          snapshotTitle:      profile.title,
          snapshotFirstName:  profile.firstName,
          snapshotLastName:   profile.lastName,
          snapshotPhone:      profile.phone,
          snapshotGender:     profile.gender,
          snapshotParentPhone: profile.parentPhone,
          snapshotProfilePic: updatableProfilePicUrl ?? profile.profilePictureUrl,
          snapshotAddress:    profile.address,
          snapshotDOB:        profile.dateOfBirth,
        },
        create: {
          profileId: profile.id,
          internshipStatus: "รอดำเนินการเอกสาร",
          position: data.position,
          startDate: data.startDate,
          endDate: data.endDate,
          departmentUnit: data.departmentUnit,
          supervisorName: data.supervisorName,
          additionalDetails: data.additionalDetails,
          rejectReason: null,
          // Capture snapshot at initial submission
          snapshotTitle:      profile.title,
          snapshotFirstName:  profile.firstName,
          snapshotLastName:   profile.lastName,
          snapshotPhone:      profile.phone,
          snapshotGender:     profile.gender,
          snapshotProfilePic: updatableProfilePicUrl ?? profile.profilePictureUrl,
          snapshotAddress:    profile.address,
          snapshotDOB:        profile.dateOfBirth,
          snapshotParentPhone: profile.parentPhone,
        }
      });

      // Save File Attachments — append new files, keep existing ones
      if (uploadedFiles.length > 0) {
        await tx.fileAttachment.createMany({
          data: uploadedFiles.map(f => ({
            profileId: profile.id,
            fileName: f.fileName,
            fileType: f.fileType,
            fileUrl: f.fileUrl,
            fileSize: f.fileSize
          }))
        });
      }
    });

    // 4. Record Activity Log for Admin visibility
    await prisma.activityLog.create({
      data: {
        action: "SUBMIT_DOC",
        actorName: `${profile.firstName} ${profile.lastName}`,
        actorRole: user.role, // "student"
        targetName: `${profile.firstName} ${profile.lastName}`,
        details: `ส่งคำร้องขอฝึกงานที่ ${data.departmentUnit} ตำแหน่ง ${data.position}`,
      }
    });

    revalidatePath("/", "layout");
    revalidatePath("/student");
    revalidatePath("/admin");
  } catch (error: any) {
    console.error("CRITICAL ERROR in submitInternshipApplication:", error);
    return { success: false, error: error?.message || "เกิดข้อผิดพลาดจากระบบ (System Error)" };
  }

  // Redirect must be called outside of try-catch block
  redirect("/student");
}
