import Link from "next/link";
import ProfileDropdown from "@/components/ProfileDropdown";
import NavTabs from "@/components/NavTabs";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getRequiredOnboardingPath } from "@/lib/onboarding";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const headersList = await headers();
  const pathname = headersList.get("x-current-path") || "";

  // 1. Onboarding Gatekeeper for Students
  if (user && user.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
       where: { userId: user.id },
       include: { internship: true }
    });

    const targetPath = getRequiredOnboardingPath(profile, pathname);
    if (targetPath) {
      redirect(targetPath);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="flex w-full items-center justify-between bg-gradient-to-r from-white from-20% via-header via-60% to-header px-8 py-3 shadow-sm border-b border-gray-100">
        {/* Left: Logo & Title (Clickable → Dashboard) */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="/intern/logo.png"
              alt="CMU Internship Logo"
              className="h-10 w-auto object-contain drop-shadow-md"
            />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Internship Management System
            </h1>
          </Link>

          {/* Navigation Tabs */}
          <NavTabs />
        </div>

        {/* Right: User Profile Menu */}
        <ProfileDropdown />
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full bg-[#f8f9fa] pb-12">
        {children}
      </main>
    </div>
  );
}
