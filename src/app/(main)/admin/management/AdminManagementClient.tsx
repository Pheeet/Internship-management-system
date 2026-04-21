"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Search, ShieldCheck, ShieldOff, UserX, UserCheck, Loader2, Crown, AlertCircle, CheckCircle2, X } from "lucide-react";
import { searchUsers, updateUserRole, getCurrentAdmins } from "@/actions/user";

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  profile: { firstName: string; lastName: string; profilePictureUrl: string | null } | null;
}

interface AdminManagementClientProps {
  currentUserId: string;
  initialAdmins: UserRecord[];
}

function Avatar({ user, size = "md" }: { user: UserRecord; size?: "sm" | "md" }) {
  const name = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user.name || user.email;
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const src = user.profile?.profilePictureUrl;
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  return src ? (
    <img src={src} alt={name} className={`${cls} rounded-full object-cover border-2 border-white shadow`} />
  ) : (
    <div className={`${cls} rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow`}>
      {initials}
    </div>
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-semibold text-sm animate-in slide-in-from-bottom-4 ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}

export default function AdminManagementClient({ currentUserId, initialAdmins }: AdminManagementClientProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [admins, setAdmins] = useState<UserRecord[]>(initialAdmins);
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => setToast({ msg, type });

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchUsers(query);
      setSearchResults((res.data as UserRecord[]) || []);
      setIsSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const refreshAdmins = useCallback(async () => {
    const res = await getCurrentAdmins();
    if (res.success) setAdmins((res.data as UserRecord[]) || []);
  }, []);

  const handleAssignAdmin = (user: UserRecord) => {
    setLoadingId(user.id);
    startTransition(async () => {
      const res = await updateUserRole(user.id, "ADMIN");
      if (res.success) {
        showToast(`${user.email} ได้รับสิทธิ์ Admin แล้ว`, "success");
        await refreshAdmins();
        setQuery("");
        setSearchResults([]);
      } else {
        showToast(res.error || "เกิดข้อผิดพลาด", "error");
      }
      setLoadingId(null);
    });
  };

  const handleRevokeAdmin = (user: UserRecord) => {
    setLoadingId(user.id);
    startTransition(async () => {
      const res = await updateUserRole(user.id, "STUDENT");
      if (res.success) {
        showToast(`ถอดสิทธิ์ Admin ของ ${user.email} แล้ว`, "success");
        await refreshAdmins();
      } else {
        showToast(res.error || "เกิดข้อผิดพลาด", "error");
      }
      setLoadingId(null);
    });
  };

  const displayName = (u: UserRecord) =>
    u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.name || "—";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-violet-100 rounded-2xl text-violet-700">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการสิทธิ์ผู้ดูแลระบบ — มีผล Real-time</p>
        </div>
      </div>

      {/* Search & Assign */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2 mb-1">
          <UserCheck className="w-5 h-5 text-violet-600" />
          <h2 className="text-base font-black text-gray-800">เพิ่ม Admin ใหม่</h2>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            id="user-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาด้วยอีเมล หรือชื่อ..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400 animate-spin" />
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="flex flex-col gap-2 border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
            {searchResults.map((u) => {
              const isAlreadyAdmin = u.role === "ADMIN";
              const isSelf = u.id === currentUserId;
              return (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar user={u} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{displayName(u)}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAlreadyAdmin && (
                      <span className="text-xs font-black bg-violet-100 text-violet-700 px-3 py-1 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Admin
                      </span>
                    )}
                    {!isAlreadyAdmin && !isSelf && (
                      <button
                        onClick={() => handleAssignAdmin(u)}
                        disabled={loadingId === u.id || isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 text-white text-xs font-black rounded-full hover:bg-violet-700 transition-all disabled:opacity-50 active:scale-95 shadow-sm shadow-violet-200"
                      >
                        {loadingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        Assign Admin
                      </button>
                    )}
                    {isSelf && (
                      <span className="text-xs font-bold text-gray-400 italic">คุณเอง</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {query.trim() && !isSearching && searchResults.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4 font-medium">ไม่พบผู้ใช้ที่ตรงกับ "{query}"</p>
        )}
      </div>

      {/* Current Admins Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-gray-800">Admin ทั้งหมด</h2>
          </div>
          <span className="text-xs font-black bg-violet-100 text-violet-700 px-3 py-1 rounded-full">{admins.length} คน</span>
        </div>

        {admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-3">
            <ShieldOff className="w-12 h-12" />
            <p className="font-semibold text-gray-400">ยังไม่มี Admin</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {admins.map((admin) => {
              const isSelf = admin.id === currentUserId;
              return (
                <div key={admin.id} className={`flex items-center justify-between px-6 py-4 transition-colors ${isSelf ? "bg-violet-50/40" : "hover:bg-gray-50/50"}`}>
                  <div className="flex items-center gap-4">
                    <Avatar user={admin} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">{displayName(admin)}</p>
                        {isSelf && (
                          <span className="text-[10px] font-black bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full uppercase tracking-wider">คุณ</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{admin.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400 hidden sm:block">
                      เพิ่มเมื่อ {new Date(admin.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    </p>
                    {isSelf ? (
                      <span className="text-xs font-bold text-gray-300 italic px-4 py-1.5">ไม่สามารถถอดสิทธิ์ตัวเองได้</span>
                    ) : (
                      <button
                        onClick={() => handleRevokeAdmin(admin)}
                        disabled={loadingId === admin.id || isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-600 text-xs font-black rounded-full hover:bg-red-100 border border-red-100 transition-all disabled:opacity-50 active:scale-95"
                      >
                        {loadingId === admin.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                        Revoke Admin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
