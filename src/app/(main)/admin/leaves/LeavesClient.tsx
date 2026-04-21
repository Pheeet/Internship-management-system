"use client";

import { useState, useEffect } from "react";
import { Download, Search, FileText, FileX } from "lucide-react";
import dayjs from "dayjs";
import LeaveProofModal from "@/components/admin/LeaveProofModal";
import { updateLeaveStatus } from "@/actions/admin";

export default function LeavesClient({ leaveRequests }: { leaveRequests: any[] }) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProof, setSelectedProof] = useState<any | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Derive duration helper
  const getDuration = (start: Date, end: Date) => {
    const diff = dayjs(end).diff(dayjs(start), 'day') + 1;
    return diff;
  };

  const handleStatusChange = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      await updateLeaveStatus(id, status);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter basic logic
  const filteredLeaves = leaveRequests.filter((leave: any) => {
    const matchesSearch = `${leave.profile.firstName} ${leave.profile.lastName} ${leave.reason}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col gap-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Leave Request Management</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Review and manage student absence requests</p>
          </div>
          <button className="flex items-center gap-2 bg-[#E84E1B] text-white px-5 py-2.5 rounded-xl font-extrabold hover:bg-[#d44315] hover:shadow-lg transition-all focus:ring-4 focus:ring-orange-100 outline-none">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* Filters Top Bar */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row items-center gap-4 justify-between w-full">
           
           <div className="relative w-full lg:w-96">
             <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search student name, ID or reason..." 
               className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-[#E84E1B] focus:ring-1 focus:ring-[#E84E1B] outline-none transition-all text-gray-800"
             />
           </div>

           <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
             {/* No additional filters for now as per simplified UI */}
           </div>
        </div>

        {/* Master Table Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full min-h-[500px]">
           <div className="w-full overflow-x-auto border-b border-gray-100 pb-2">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-100">
                   <th className="py-5 px-6 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest whitespace-nowrap">Student Name</th>
                   <th className="py-5 px-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest whitespace-nowrap">Leave Type</th>
                   <th className="py-5 px-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest whitespace-nowrap">Dates</th>
                   <th className="py-5 px-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest whitespace-nowrap">Reason</th>
                   <th className="py-5 px-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">Proof</th>
                   <th className="py-5 px-6 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                 </tr>
               </thead>
               <tbody>
                  {filteredLeaves.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center text-gray-400 font-medium text-lg">No leave requests found.</td></tr>
                  ) : filteredLeaves.map((leave: any, idx: number) => {
                    const profile = leave.profile;
                    const initials = profile.firstName.substring(0, 1) + profile.lastName.substring(0, 1);
                    
                    const isSick = leave.leaveType === "ลาป่วย" || leave.leaveType.toLowerCase().includes("sick");
                    const typeBg = isSick ? "bg-blue-100/70 text-blue-600" : "bg-[#f3e8ff] text-[#9333ea]";
                    const typeEng = isSick ? "Sick Leave" : "Personal Leave";

                    const durationDays = getDuration(leave.startDate, leave.endDate);

                    return (
                      <tr key={leave.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors group">
                        {/* Student Name */}
                        <td className="py-5 px-6 whitespace-nowrap">
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
                               <span className="font-extrabold text-gray-900">{profile.firstName} {profile.lastName}</span>
                               <span className="text-xs font-bold text-gray-400 mt-0.5">ID: {profile.userId}</span>
                             </div>
                           </div>
                        </td>

                        {/* Leave Type */}
                        <td className="py-5 px-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-extrabold ${typeBg}`}>
                            {typeEng}
                          </span>
                        </td>

                        {/* Dates */}
                        <td className="py-5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-gray-700">
                              {hasMounted ? `${dayjs(leave.startDate).format('MMM DD')} - ${dayjs(leave.endDate).format('MMM DD, YYYY')}` : "Loading..."}
                            </span>
                            <span className="text-[10px] font-extrabold text-gray-400 mt-0.5 tracking-wide uppercase">
                              {durationDays} DAY{durationDays > 1 ? 'S' : ''} TOTAL
                            </span>
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="py-5 px-4">
                          <span className="text-[13px] font-medium text-gray-500 w-[180px] block truncate" title={leave.reason}>
                            {leave.reason || "No explicit reason provided"}
                          </span>
                        </td>

                        {/* Proof */}
                        <td className="py-5 px-4 text-center whitespace-nowrap w-[80px]">
                          {leave.attachmentUrl || leave.attachmentName ? (
                             <button onClick={() => setSelectedProof(leave)} className="mx-auto w-8 h-8 flex items-center justify-center text-[#E84E1B] hover:bg-orange-50 rounded-lg transition-colors outline-none">
                               <FileText className="w-5 h-5" />
                             </button>
                          ) : (
                             // Mocking empty proofs with the gray slashed icon
                             <div className="mx-auto w-8 h-8 flex items-center justify-center text-gray-300">
                               <FileX className="w-5 h-5" />
                             </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-5 px-6 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              {leave.status === "PENDING" && (
                                <>
                                  <button 
                                    onClick={() => handleStatusChange(leave.id, "Rejected")}
                                    disabled={processingId === leave.id}
                                    className="px-4 py-2 font-extrabold text-[13px] text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(leave.id, "Approved")}
                                    disabled={processingId === leave.id}
                                    className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-[13px] rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                  >
                                    {processingId === leave.id ? "Processing..." : "Approve"}
                                  </button>
                                </>
                              )}
                              {leave.status === "Approved" && (
                                <span className="bg-green-100 text-[#059669] text-[11px] px-3 py-1.5 rounded-full font-extrabold flex items-center gap-1.5 shadow-sm">
                                  <div className="w-1 h-1 rounded-full bg-[#059669]"></div>
                                  Approved
                                </span>
                              )}
                              {leave.status === "Rejected" && (
                                <span className="bg-red-100 text-red-600 text-[11px] px-3 py-1.5 rounded-full font-extrabold flex items-center gap-1.5 shadow-sm">
                                  <div className="w-1 h-1 rounded-full bg-red-600"></div>
                                  Rejected
                                </span>
                              )}
                            </div>
                        </td>
                      </tr>
                    )
                  })}
               </tbody>
             </table>
           </div>

           {/* Table Footer / Pagination */}
           <div className="p-4 flex items-center justify-between text-sm mt-auto bg-white">
             <span className="text-gray-500 font-medium pl-2">Showing 1 to {filteredLeaves.length} of {leaveRequests.length} requests</span>
             <div className="flex items-center gap-1">
               <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30" disabled>
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
               </button>
               <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
               </button>
             </div>
           </div>
        </div>

      </div>

      <LeaveProofModal 
        isOpen={selectedProof !== null} 
        onClose={() => setSelectedProof(null)} 
        leaveReq={selectedProof} 
      />
    </>
  );
}
