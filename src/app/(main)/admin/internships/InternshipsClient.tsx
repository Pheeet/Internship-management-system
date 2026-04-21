"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Eye, CheckCircle2, ClipboardList, Users, ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import ApplicationReviewDrawer from "@/components/admin/ApplicationReviewDrawer";

export default function InternshipsClient({ stats, applications, admins }: any) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInternship, setSelectedInternship] = useState<any | null>(null);
  
  // Pagination Constant
  const ITEMS_PER_PAGE = 8;
  
  // Filter and Sort State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  // Refined filtering and sorting logic
  const filteredApps = applications
    .filter((app: any) => {
      // 1. Expanded Search Logic
      const q = searchQuery.toLowerCase();
      const matchesSearch = (
        app.profile.firstName?.toLowerCase().includes(q) ||
        app.profile.lastName?.toLowerCase().includes(q) ||
        app.position?.toLowerCase().includes(q) ||
        app.departmentUnit?.toLowerCase().includes(q) ||
        app.profile.major?.toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter === "ALL") return true;
      
      const status = app.internshipStatus;
      const isApproved = ["Approved", "กำลังฝึกงาน", "ACTIVE", "อนุมัติแล้ว"].includes(status);
      const isRejected = ["Rejected", "เอกสารไม่ครบ"].includes(status);
      const isPending = !isApproved && !isRejected;

      if (statusFilter === "APPROVED") return isApproved;
      if (statusFilter === "REJECTED") return isRejected;
      if (statusFilter === "PENDING") return isPending;

      return true;
    })
    .sort((a: any, b: any) => {
      // 3. Sorting
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE);
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadge = (status: string) => {
    if (["Approved", "กำลังฝึกงาน", "ACTIVE", "อนุมัติแล้ว"].includes(status)) {
       return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d1fae5] text-[#059669] rounded-full text-[11px] font-extrabold"><div className="w-1.5 h-1.5 rounded-full bg-[#059669]"></div> Approved</span>;
    }
    if (["Rejected", "เอกสารไม่ครบ"].includes(status)) {
       return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 rounded-full text-[11px] font-extrabold"><div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> Rejected</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100/80 text-orange-600 rounded-full text-[11px] font-extrabold"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Pending Review</span>;
  };

  return (
    <>
      <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col gap-6">

        {/* Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Pending */}
           <button 
             onClick={() => { setStatusFilter("PENDING"); setCurrentPage(1); }}
             className={`bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center w-full transition-all hover:shadow-md text-left ${statusFilter === 'PENDING' ? 'border-2 border-orange-500' : 'border border-gray-100'}`}
           >
              <span className="flex flex-col">
                <p className="font-semibold text-gray-700">ใบสมัครที่รอการอนุมัติ</p>
                <p className="text-xs text-gray-400 mb-2">Pending Applications</p>
                <span className="text-[40px] font-black text-gray-900 leading-none">{stats.pendingCount}</span>
              </span>
              <span className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-orange-500" strokeWidth={2.5}/>
              </span>
           </button>

           {/* Approved */}
           <button 
             onClick={() => { setStatusFilter("APPROVED"); setCurrentPage(1); }}
             className={`bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center w-full transition-all hover:shadow-md text-left ${statusFilter === 'APPROVED' ? 'border-2 border-green-500' : 'border border-gray-100'}`}
           >
              <span className="flex flex-col">
                <p className="font-semibold text-gray-700">อนุมัติแล้ว</p>
                <p className="text-xs text-gray-400 mb-2">Approved</p>
                <span className="text-[40px] font-black text-gray-900 leading-none">{stats.approvedCount}</span>
              </span>
              <span className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center shrink-0 text-green-500">
                <CheckCircle2 fill="currentColor" stroke="white" className="w-8 h-8" strokeWidth={1} />
              </span>
           </button>

           {/* Total */}
           <button 
             onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
             className={`bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center w-full transition-all hover:shadow-md text-left ${statusFilter === 'ALL' ? 'border-2 border-purple-600' : 'border border-gray-100'}`}
           >
              <span className="flex flex-col">
                <p className="font-semibold text-gray-700">รวมทั้งหมด</p>
                <p className="text-xs text-gray-400 mb-2">Total</p>
                <span className="text-[40px] font-black text-gray-900 leading-none">{stats.totalCount}</span>
              </span>
              <span className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-7 h-7 text-purple-600" />
              </span>
           </button>
        </div>

        {/* Master Table Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full min-h-[500px]">
           {/* Table Header Controls */}
           <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
               <h2 className="text-[20px] font-extrabold text-gray-900">Recent Internship Applications</h2>
               <p className="text-sm text-gray-500 font-medium">Manage and review student internship submissions</p>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, position, major..." 
                    className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-[#4A1D96] focus:ring-1 focus:ring-[#4A1D96] outline-none transition-all w-72 text-gray-800 h-[42px]"
                  />
                </div>
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setShowSort(!showSort)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all h-[42px] min-w-[140px]"
                  >
                    <span>{sortBy === 'newest' ? 'Newest first' : 'Oldest first'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                  {showSort && (
                    <div className="absolute right-0 top-full mt-1 w-[160px] bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                      {['newest', 'oldest'].map((val) => (
                        <button
                          key={val}
                          onClick={() => { 
                            setSortBy(val as "newest" | "oldest"); 
                            setCurrentPage(1); 
                            setShowSort(false); 
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${sortBy === val ? 'bg-purple-50 text-[#4A1D96]' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {val === 'newest' ? 'Newest first' : 'Oldest first'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
             </div>
           </div>

           {/* Table */}
           <div className="w-full overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-100 bg-white">
                   <th className="py-4 px-6 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Student Name</th>
                   <th className="py-4 px-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Major</th>
                   <th className="py-4 px-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Applied Company</th>
                   <th className="py-4 px-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Date</th>
                   <th className="py-4 px-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
                   <th className="py-4 px-6 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider text-center">Action</th>
                 </tr>
               </thead>
               <tbody>
                  {paginatedApps.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-500 font-medium">No applications found.</td></tr>
                  ) : paginatedApps.map((app: any, idx: number) => {
                    const profile = app.profile;
                    const initials = profile.firstName.substring(0, 1) + profile.lastName.substring(0, 1);
                    
                    // Assign semi-random badge backgrounds for initials to match the colorful UI representation
                    const bgColors = ["bg-blue-100 text-blue-600", "bg-pink-100 text-pink-600", "bg-indigo-100 text-indigo-600", "bg-teal-100 text-teal-600"];
                    const badgeColor = bgColors[idx % bgColors.length];

                    return (
                      <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group">
                        <td className="py-4 px-6">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">
                               {profile.profilePictureUrl ? (
                                 <img 
                                   src={profile.profilePictureUrl} 
                                   alt={profile.firstName}
                                   className="w-full h-full object-cover"
                                   onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                 />
                               ) : (
                                 <span>{initials}</span>
                               )}
                             </div>
                             <div className="flex flex-col">
                               <span className="font-extrabold text-[#2d3748]">{profile.firstName} {profile.lastName}</span>
                               <span className="text-xs font-medium text-gray-400 mt-0.5">{profile.userId}</span>
                             </div>
                           </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-600">{profile.major || "N/A"}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-[13.5px] font-extrabold text-[#2d3748]">{app.departmentUnit}</span>
                            <span className="text-xs font-medium text-gray-400 mt-0.5">{app.position}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-600">
                            {hasMounted ? dayjs(app.createdAt).format('MMM DD, YYYY') : "Loading..."}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(app.internshipStatus)}
                        </td>
                        <td className="py-4 px-6 text-center">
                           <button 
                             onClick={() => setSelectedInternship(app)}
                             className="w-10 h-10 rounded-full flex items-center justify-center mx-auto text-gray-400 hover:text-[#4A1D96] hover:bg-purple-50 transition-all outline-none focus:ring-2 focus:ring-[#4A1D96]"
                           >
                             <Eye className="w-5 h-5 stroke-[2.5px]" />
                           </button>
                        </td>
                      </tr>
                    )
                  })}
               </tbody>
             </table>
           </div>

           {/* Table Footer / Pagination */}
           {totalPages > 1 && (
             <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm mt-auto bg-white">
               <span className="text-gray-500 font-medium pl-2">
                 Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredApps.length)} of {filteredApps.length} entries
               </span>
               <div className="flex items-center gap-1">
                 <button 
                   onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                   className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 font-bold hover:bg-gray-50 mr-1 disabled:opacity-50" 
                   disabled={currentPage === 1}
                 >
                   Previous
                 </button>
                 <div className="flex items-center gap-1">
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                     <button 
                       key={p}
                       onClick={() => setCurrentPage(p)}
                       className={`w-8 h-8 rounded-lg font-extrabold flex items-center justify-center shadow-sm transition-all ${currentPage === p ? 'bg-[#E84E1B] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                     >
                       {p}
                     </button>
                   ))}
                 </div>
                 <button 
                   onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                   className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 font-bold hover:bg-gray-50 ml-1 disabled:opacity-50"
                   disabled={currentPage === totalPages}
                 >
                   Next
                 </button>
               </div>
             </div>
           )}
        </div>

      </div>

      <ApplicationReviewDrawer 
        isOpen={selectedInternship !== null} 
        onClose={() => setSelectedInternship(null)} 
        internship={selectedInternship} 
        admins={admins}
      />
    </>
  );
}
