import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import ProfileDropdown from "@/components/ProfileDropdown";
import NavTabs from "@/components/NavTabs";
import { Search, Bell, Settings } from "lucide-react";

export default async function DynamicHeader() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    return (
      <header className="flex w-full items-center justify-between bg-gradient-to-r from-[#4A1D96] to-[#E84E1B] px-8 py-3 shadow-md text-white border-b-0 h-[60px]">
        {/* Left: Logo & Title (Clickable → Dashboard) */}
        <div className="flex items-center gap-10">
          <Link href="/admin" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="/intern/logo.png"
              alt="CMU Internship Logo"
              className="h-10 w-auto object-contain drop-shadow-md brightness-0 invert"
            />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
              Internship Management System
            </h1>
          </Link>

          {/* Navigation Tabs */}
          <NavTabs isAdminTheme={true} />
        </div>

        {/* Right: Controls & User Profile Menu */}
        <div className="flex items-center gap-6">
           <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
             <input 
               type="text" 
               placeholder="ค้นหารายชื่อ..." 
               className="bg-white/10 hover:bg-white/20 focus:bg-white/20 transition-colors border border-white/20 text-white text-sm rounded-full pl-10 pr-4 py-1.5 outline-none placeholder:text-white/60 w-64"
             />
           </div>
           
           <div className="flex items-center gap-4 text-white/90">
             <button className="hover:text-white transition-colors relative">
               <Bell className="w-5 h-5 fill-current" />
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#E84E1B]"></span>
             </button>
             <button className="hover:text-white transition-colors">
               <Settings className="w-5 h-5 fill-current" />
             </button>
           </div>
           
           <div className="w-px h-8 bg-white/20 mx-1"></div>

           <ProfileDropdown isAdminTheme={true} />
        </div>
      </header>
    );
  }

  // Fallback / Student Header (Existing Style)
  return (
      <header className="flex w-full items-center justify-between bg-gradient-to-r from-white from-20% via-header via-60% to-header px-8 py-3 shadow-sm border-b border-gray-100 h-[60px]">
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
          <NavTabs isAdminTheme={false} />
        </div>
        <ProfileDropdown isAdminTheme={false} />
      </header>
  );
}
