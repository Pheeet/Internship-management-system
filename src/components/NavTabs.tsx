"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, type AuthUser } from "@/lib/auth";

interface NavTab {
  label: string;
  href: string;
}

const studentTabs: NavTab[] = [
  { label: "Dashboard", href: "/student" },
  { label: "Profile", href: "/profile" },
  { label: "Internship", href: "/internship" },
];

const adminTabs: NavTab[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Internships", href: "/admin/internships" },
  { label: "Leaves Requests", href: "/admin/leaves" },
  { label: "Activity Logs", href: "/admin/activities" },
  { label: "Management", href: "/admin/management" },
];

interface NavTabsProps {
  isAdminTheme?: boolean;
}

export default function NavTabs({ isAdminTheme = false }: NavTabsProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  if (!user) return null;

  const tabs = user.role === "student" ? studentTabs : adminTabs;

  return (
    <nav className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = (() => {
          if (tab.href === '/admin') {
            return pathname === '/admin' || pathname === '/admin/';
          }
          if (tab.href === '/student') {
            return pathname === '/student' || pathname === '/student/';
          }
          return pathname.startsWith(tab.href);
        })();

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200
              ${isActive
                ? (isAdminTheme ? "bg-white/20 text-white" : "bg-black/10 text-gray-900")
                : (isAdminTheme 
                    ? "text-white/70 hover:text-white hover:bg-white/10" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-black/5")
              }
            `}
          >
            {tab.label}
            {isActive && (
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${isAdminTheme ? "bg-white" : "bg-gray-900"}`} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
