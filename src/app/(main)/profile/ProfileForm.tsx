"use client";

import { useState } from "react";
import { saveProfileInfo } from "@/actions/profile";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface ProfileFormProps {
  initialData?: {
    title?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: Date;
    phone?: string;
    address?: string;
    parentPhone?: string;
    profilePictureUrl?: string | null;
  } | null;
  email?: string;
}

export default function ProfileForm({ initialData, email }: ProfileFormProps) {
  const [profileImage, setProfileImage] = useState<string | null>(initialData?.profilePictureUrl || null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const handleReset = () => {
    setProfileImage(initialData?.profilePictureUrl || null);
    setMessage(null);
  };

  const formAction = async (formData: FormData) => {
    setIsPending(true);
    setMessage(null);
    const result = await saveProfileInfo(null, formData);
    if (result?.success === false) {
      // Build a more descriptive error message if field errors exist
      let errorDetail = result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      if (result.fields) {
        const fieldErrors = Object.values(result.fields).flat();
        if (fieldErrors.length > 0) {
          errorDetail = `ข้อมูลไม่ถูกต้อง: ${fieldErrors.join(", ")}`;
        }
      }

      setMessage({ type: "error", text: errorDetail });
      setIsPending(false);

      // Scroll to top to see error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // If it's a success, it will redirect from the server, so no need to set message or setIsPending(false)
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 w-full h-full animate-fade-in animate-duration-[400ms]">
      <div className="flex flex-col gap-6">
        
        {/* Header Title */}
        <div className="mb-2">
          <h1 className="text-[28px] font-bold text-[#3B0764] tracking-tight">ข้อมูลส่วนตัวนักศึกษา</h1>
          <p className="text-gray-500 mt-1 text-[15px]">
            กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วนและถูกต้องเพื่อใช้ในการสมัครฝึกงาน
          </p>
        </div>

        {error === "incomplete" && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-orange-700 shadow-sm animate-pulse">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="font-bold">กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนเพื่อดำเนินการต่อ (Please complete required information to proceed)</span>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-md text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

        {/* Main Card */}
        <form
          action={formAction}
          onReset={handleReset}
          className="bg-white rounded-xl shadow-sm p-8 flex flex-col gap-6"
        >
          {/* Top Section: Photo and Initial Fields */}
          <div className="flex flex-col md:flex-row gap-10">
            {/* Left Column - Photo Upload */}
            <div className="md:w-1/3 flex flex-col items-center">
              <div className="w-full max-w-xs">
                <label
                  htmlFor="profilePhoto"
                  className="flex flex-col items-center justify-center w-full h-[280px] rounded-xl border-2 border-dashed border-gray-300 bg-[#F9FAFB] cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-contain rounded-lg p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center px-8">
                      <svg
                        className="w-12 h-12 text-[#9CA3AF] mb-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M4 7h4l2-3h4l2 3h4v13H4V7zm6 3l-1.5 5h7L14 10h-4z" opacity="0.3" />
                        <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM9.88 5h4.24l1.83 2H20v12H4V7h4.05l1.83-2zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z" />
                        <circle cx="15.5" cy="8.5" r="1.5" />
                      </svg>
                      <span className="text-sm text-[#6B7280] leading-relaxed">
                        รูปถ่ายในชุดนักศึกษาที่ถ่ายไว้
                        <br />
                        ระยะเวลาไม่เกิน 3 ถึง 6 เดือน
                      </span>
                    </div>
                  )}
                  <input
                    id="profilePhoto"
                    name="profilePhoto"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="text-xs text-[#9CA3AF] mt-3 text-center">
                  ไฟล์ที่รองรับ: JPG, PNG (สูงสุด 5MB)
                </p>
              </div>
            </div>

            {/* Right Column - Top Form Details */}
            <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5 content-start">
              {/* Row 1: Prefix, First Name, Last Name */}
              <div className="md:col-span-4 flex flex-col md:flex-row gap-x-6 gap-y-5">
                {/* Prefix */}
                <div className="md:w-1/4">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    คำนำหน้าชื่อ
                  </label>
                  <div className="relative">
                    <select 
                      name="title" 
                      defaultValue={initialData?.title || ""} 
                      required
                      className="w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]"
                    >
                      <option value="">เลือกคำนำห...</option>
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* First Name */}
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-2 whitespace-nowrap">
                    ชื่อ (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={initialData?.firstName || ""}
                    required
                    placeholder="กรอกชื่อจริง"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] placeholder-gray-400"
                  />
                </div>

                {/* Last Name */}
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    นามสกุล (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={initialData?.lastName || ""}
                    required
                    placeholder="กรอกนามสกุล"
                    className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  เพศ
                </label>
                <div className="relative">
                  <select 
                    name="gender" 
                    defaultValue={initialData?.gender || ""}
                    required
                    className="w-full appearance-none rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]"
                  >
                    <option value="">เลือกเพศ</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* DOB */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  วันเกิด
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  defaultValue={initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : ""}
                  required
                  className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] text-gray-600"
                />
              </div>

              {/* Email (Full width in right column) */}
              <div className="md:col-span-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  อีเมลมหาวิทยาลัย
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={email || ""}
                    readOnly
                    className="w-full rounded-md border border-gray-200 bg-[#F9FAFB] px-4 py-2.5 text-sm text-gray-500 outline-none cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-green-600">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  ยืนยันผ่าน @cmu.ac.th แล้ว
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section: Full-Width Fields */}
          <div className="flex flex-col gap-y-5 w-full mt-2">
            {/* Phone Number */}
            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                name="phone"
                required
                defaultValue={initialData?.phone || ""}
                placeholder="08X-XXX-XXXX"
                className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] placeholder-gray-400"
              />
            </div>

            {/* Parent Phone */}
            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                เบอร์โทรศัพท์ผู้ปกครอง (ฉุกเฉิน)
              </label>
              <input
                type="tel"
                name="parentPhone"
                required
                defaultValue={initialData?.parentPhone || ""}
                placeholder="08X-XXX-XXXX"
                className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] placeholder-gray-400"
              />
            </div>

            {/* Address */}
            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                ที่อยู่ที่สามารถติดต่อได้
              </label>
              <textarea
                name="address"
                required
                defaultValue={initialData?.address || ""}
                rows={3}
                placeholder="ระบุเลขที่บ้าน ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด และรหัสไปรษณีย์"
                className="w-full resize-none rounded-md border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] placeholder-gray-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-4 mt-2">
              <button
                type="reset"
                disabled={isPending}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                ยกเลิกการแก้ไข
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 text-sm font-semibold text-white bg-[#F26522] rounded-md shadow-sm hover:bg-[#E05512] transition-colors"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
