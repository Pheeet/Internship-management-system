import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

export const baseInternshipFormSchema = z.object({
  // 1. Personal Information
  title: z.string().min(1, { message: "กรุณาระบุคำนำหน้าชื่อ" }),
  firstName: z.string().min(1, { message: "กรุณาระบุชื่อจริง" }),
  lastName: z.string().min(1, { message: "กรุณาระบุนามสกุล" }),
  gender: z.string().min(1, { message: "กรุณาระบุเพศ" }),
  dateOfBirth: z.coerce.date({
    required_error: "กรุณาระบุวันเกิด",
    invalid_type_error: "รูปแบบวันที่ไม่ถูกต้อง",
  }),
  phone: z.string().min(9, { message: "กรุณาระบุเบอร์โทรศัพท์ให้ครบถ้วน" }),
  email: z.string()
    .min(1, { message: "กรุณาระบุอีเมล" })
    .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" })
    .refine((val) => val.endsWith("@cmu.ac.th"), {
      message: "กรุณาใช้อีเมลของมหาวิทยาลัยเชียงใหม่ (@cmu.ac.th) เท่านั้น",
    }),
  address: z.string().min(1, { message: "กรุณาระบุที่อยู่ปัจจุบัน" }),
  parentPhone: z.string().min(9, { message: "กรุณาระบุเบอร์โทรศัพท์ผู้ปกครองให้ครบถ้วน" }),

  // 2. Educational Background
  educationLevel: z.string().min(1, { message: "กรุณาระบุระดับการศึกษา" }),
  institution: z.string().min(1, { message: "กรุณาระบุสถาบันการศึกษา" }),
  faculty: z.string().optional(),
  major: z.string().min(1, { message: "กรุณาระบุสาขาวิชา/แขนง" }),
  coopAdvisorName: z.string().optional(),
  advisorPhone: z.string().optional(),

  // 3. Internship Details
  internshipStatus: z.enum([
    "รอดำเนินการเอกสาร",
    "เอกสารสมบูรณ์",
    "กำลังฝึกงาน",
    "เสร็จสิ้นการฝึกงาน",
    "ยกเลิกการฝึกงาน"
  ], { required_error: "กรุณาระบุสถานะฝึกงาน" }),
  position: z.string().min(1, { message: "กรุณาระบุตำแหน่งที่ฝึกงาน" }),
  startDate: z.coerce.date({
    required_error: "กรุณาระบุวันที่เริ่มต้นฝึกงาน",
    invalid_type_error: "รูปแบบวันที่ไม่ถูกต้อง",
  }),
  endDate: z.coerce.date({
    required_error: "กรุณาระบุวันที่สิ้นสุดการฝึกงาน",
    invalid_type_error: "รูปแบบวันที่ไม่ถูกต้อง",
  }),
  departmentUnit: z.string().min(1, { message: "กรุณาระบุแผนก/หน่วยงาน" }),
  supervisorName: z.string().min(1, { message: "กรุณาระบุชื่อหัวหน้างาน" }),
  additionalDetails: z.string().optional(),

  // 4. Media & Attachments
  profilePictureUrl: z.string()
    .min(1, { message: "กรุณาแนบรูปถ่ายชุดนักศึกษา (ถ่ายไว้ไม่เกิน 6 เดือน)" }),
  
  // Validation for an array of browser File objects (Frontend)
  // Note: if validating API payload on the backend, you might validate file metadata objects instead
  attachments: z.array(z.any())
    .max(5, { message: "สามารถแนบไฟล์ได้สูงสุด 5 ไฟล์" })
    .refine(
      (files) => files.every((file) => file?.size <= MAX_FILE_SIZE),
      { message: "ขนาดไฟล์แต่ละไฟล์ต้องไม่เกิน 5MB" }
    )
    .refine(
      (files) => files.every((file) => ACCEPTED_FILE_TYPES.includes(file?.type)),
      { message: "ไฟล์แนบต้องเป็นนามสกุล PDF, PNG หรือ JPG เท่านั้น" }
    )
    .optional(),
});

export const internshipFormSchema = baseInternshipFormSchema.refine((data) => data.endDate > data.startDate, {
  message: "วันที่สิ้นสุดการฝึกงาน ต้องมาหลังจากวันที่เริ่มต้น",
  path: ["endDate"], // Error will clearly show under the endDate field
});

// Infer the Typescript type from the schema
export type InternshipFormValues = z.infer<typeof internshipFormSchema>;
