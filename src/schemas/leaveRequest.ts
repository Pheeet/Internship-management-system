import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const leaveRequestSchema = z.object({
  leaveType: z.enum(["ลาป่วย", "ลากิจ"], {
    required_error: "กรุณาระบุประเภทการลา",
  }),
  startDate: z.coerce.date({
    required_error: "กรุณาระบุวันที่เริ่มต้นลา",
    invalid_type_error: "รูปแบบวันที่ไม่ถูกต้อง",
  }),
  endDate: z.coerce.date({
    required_error: "กรุณาระบุวันที่สิ้นสุดการลา",
    invalid_type_error: "รูปแบบวันที่ไม่ถูกต้อง",
  }),
  reason: z.string().min(1, { message: "กรุณาระบุเหตุผลการลา" }),
  
  // File validation for formData
  attachment: z.any()
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
      message: "ขนาดไฟล์ต้องไม่เกิน 5MB",
    })
}).refine(data => data.startDate <= data.endDate, {
  message: "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น",
  path: ["endDate"]
});
