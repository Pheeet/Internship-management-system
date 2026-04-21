"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginWithCredentials } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("กรุณากรอก Email และ Password");
      return;
    }

    startTransition(async () => {
      const res = await loginWithCredentials(email.trim(), password);
      if (!res.success) {
        setError(res.error || "เกิดข้อผิดพลาด");
        return;
      }
      // Redirect based on role
      router.replace(res.user?.role === "admin" ? "/admin" : "/student");
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-purple-50/30 px-4">
      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-[0_4px_40px_rgba(0,0,0,0.06)]">

        {/* Logo */}
        <div className="mb-2 flex justify-center">
          <img
            src="/intern/logo.png"
            alt="CMU Internship Logo"
            className="h-16 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-bold text-gray-900 tracking-tight">
          Internship Management System
        </h1>
        <p className="mt-1 mb-8 text-center text-sm text-gray-400">
          เข้าสู่ระบบด้วยบัญชี CMU ของคุณ
        </p>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4L12 13L2 4" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@cmu.ac.th"
                autoComplete="email"
                disabled={isPending}
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-400/20 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isPending}
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-11 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-400/20 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isPending}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#5e2b97] py-3 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#4a2179] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* CMU Entra ID Button (placeholder) */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 py-3 text-[15px] font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:border-gray-300 active:scale-[0.98]"
        >
          <img src="/intern/CMUlogo.png" alt="CMU Logo" className="h-5 w-auto object-contain" />
          Login with CMU Entra ID
        </button>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-400">
          ระบบนี้สำหรับนักศึกษาและบุคลากร มหาวิทยาลัยเชียงใหม่ เท่านั้น
        </p>
      </div>
    </div>
  );
}
