"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, mockLogout, type AuthUser } from "@/lib/auth";
import { updateAdminName } from "@/actions/auth";
import { Pencil } from "lucide-react";

interface ProfileDropdownProps {
  isAdminTheme?: boolean;
}

export default function ProfileDropdown({ isAdminTheme = false }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    getCurrentUser().then((data) => {
      setUser(data);
      if (data) setNewName(data.name);
    });
  }, []);

  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
  }, [user]);

  async function handleLogout() {
    await mockLogout();
    setIsOpen(false);
    router.replace("/login");
  }

  const handleSaveName = async () => {
    if (!newName.trim() || !user) return;
    setIsSaving(true);
    const result = await updateAdminName(newName.trim());
    if (result.success) {
      setUser(prev => prev ? { ...prev, name: newName.trim() } : prev);
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.name ?? "ผู้ใช้งาน";
  const displayEmail = user?.email ?? "";
  const displayRole = user?.role === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา";

  const fallbackAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Napong&backgroundColor=b6e3f4";
  const profilePicSrc = user?.profilePictureUrl 
    ? `${user.profilePictureUrl}${user.profilePictureUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
    : fallbackAvatar;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 focus:outline-none transition-opacity hover:opacity-90"
      >
        <div className="flex flex-col items-end">
          <span suppressHydrationWarning className={`text-base font-bold ${isAdminTheme ? "text-white" : "text-gray-900"}`}>
            {hasMounted ? displayName : ""}
          </span>
          <span suppressHydrationWarning className={`text-xs font-bold tracking-wide ${isAdminTheme ? "text-orange-200" : "text-[#E84E1B]"}`}>
            {hasMounted ? displayRole : ""}
          </span>
        </div>
        <div className={`h-11 w-11 overflow-hidden rounded-full border-2 shadow-sm ${isAdminTheme ? "border-white/20 bg-purple-200" : "border-gray-100 bg-gray-100"}`}>
          <img
            src={profilePicSrc}
            alt="User Avatar"
            className="h-full w-full object-cover"
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute -right-2 mt-[14px] w-80 rounded-[1.25rem] bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-gray-30 ring-opacity-5 z-50">

          {/* Header */}
          <div className="relative flex items-center gap-4 p-4 z-10 bg-white rounded-t-[1rem]">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-gray-100 shadow-sm">
              <img
                src={profilePicSrc}
                alt="User Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-bold text-gray-900 leading-tight">{displayName}</span>
              <span className="text-sm text-gray-500 mt-1 font-medium">{displayEmail}</span>
            </div>
          </div>

          <div className="my-2 border-t border-gray-100 w-full"></div>

          {/* Links / Edit Name Section (Admins Only) */}
          {user?.role === 'admin' && (
            <>
              <div className="px-2 pb-2">
                {isEditing ? (
                  <div className="flex flex-col gap-2 px-2 py-3">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#E84E1B] outline-none font-medium"
                      placeholder="Enter new name..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSaveName} 
                        disabled={isSaving} 
                        className="flex-1 py-2 text-sm font-bold text-white bg-[#E84E1B] rounded-lg hover:bg-[#d44315] disabled:opacity-50 transition-colors"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button 
                        onClick={() => { setIsEditing(false); setNewName(user?.name || ""); }} 
                        className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-[15.5px] font-bold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 active:scale-[0.98] active:bg-slate-200"
                  >
                    <Pencil className="w-[22px] h-[22px]" />
                    Edit Name
                  </button>
                )}
              </div>
              <div className="w-11/12 mx-auto my-1 border-t border-gray-100"></div>
            </>
          )}

          <div className="p-2">
            <button onClick={handleLogout} className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-[15.5px] font-bold text-[#eb5757] transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] active:bg-red-100">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
