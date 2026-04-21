"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/lib/auth";

/**
 * หน้าแรก / ตัวสลับทาง (Root Redirect Handler)
 * -----------------------------------------------
 * ทำหน้าที่เป็น "นายสถานี" เช็คสถานะล็อกอิน แล้วเตะไปหน้าที่เหมาะสม:
 *   - ยังไม่ล็อกอิน     → /intern/login
 *   - นักศึกษา (student) → /intern/profile
 *   - แอดมิน (admin)    → /intern/admin
 */
export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "redirecting">("checking");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    getCurrentUser().then((user) => {
      // เพิ่ม delay เล็กน้อย เพื่อให้ UX ไม่กระโดดเร็วเกิน
      timer = setTimeout(() => {
        setStatus("redirecting");

        if (!user) {
          router.replace("/login");
        } else if (user.role === "student") {
          router.replace("/profile"); // Note: profile is the route for student in this context, or maybe /student
        } else if (user.role === "admin") {
          router.replace("/admin");
        }
      }, 800);
    });

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-6">
      {/* Spinner */}
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-header"></div>
      </div>

      {/* Status Text */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-medium text-gray-700">
          {status === "checking" ? "กำลังตรวจสอบสิทธิ์การเข้าถึง..." : "กำลังนำทาง..."}
        </p>
        <p className="text-sm text-gray-400">Internship Management System</p>
      </div>
    </main>
  );
}
