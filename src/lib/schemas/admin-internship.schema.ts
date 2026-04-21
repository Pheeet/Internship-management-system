import { z } from "zod";

export const adminInternshipSchema = z.object({
  // Personal Info
  title: z.string().min(1, "คำนำหน้าจำเป็น"),
  firstName: z.string().min(1, "ชื่อจำเป็น"),
  lastName: z.string().min(1, "นามสกุลจำเป็น"),
  gender: z.string().min(1, "เพศจำเป็น"),
  dateOfBirth: z.coerce.date(),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(10, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  address: z.string().min(1, "ที่อยู่จำเป็น"),
  parentPhone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(10, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  
  // Education
  educationLevel: z.string().min(1, "ระดับการศึกษาจำเป็น"),
  institution: z.string().min(1, "สถาบันจำเป็น"),
  faculty: z.string().optional(),
  major: z.string().min(1, "สาขาจำเป็น"),
  coopAdvisorName: z.string().optional(),
  advisorPhone: z.string().optional(),

  // Internship Details
  position: z.string().min(1, "ตำแหน่งงานจำเป็น"),
  departmentUnit: z.string().min(1, "หน่วยงานจำเป็น"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  supervisorName: z.string().min(1, "ชื่อผู้ดูแลจำเป็น"),
  additionalDetails: z.string().optional(),
});

export type AdminInternshipFormValues = z.infer<typeof adminInternshipSchema>;
