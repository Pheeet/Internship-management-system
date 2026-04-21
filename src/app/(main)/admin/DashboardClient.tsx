"use client";

import { useState, useEffect } from "react";
import { FileText, Briefcase, CalendarX2, Eye, CheckCircle2, FileEdit, XCircle, UserPlus, ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale('th');

export default function DashboardClient({ stats, recentSubmissions, activeInterns, leaveRequests, activities, adminName }: any) {
  const [activeCard, setActiveCard] = useState<"pending" | "active">("pending");
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-extrabold text-[#4A1D96] tracking-tight">Welcome back, {adminName}</h1>
        <p className="text-gray-500 font-medium mt-1">วันนี้มี <span className="font-bold text-[#4A1D96]">{stats.pendingApplicationsCount}</span> รายการที่รอการตรวจสอบความถูกต้อง</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Apps */}
        <button 
          onClick={() => setActiveCard("pending")}
          className={`bg-white rounded-2xl shadow-sm p-6 relative overflow-hidden text-left transition-all hover:shadow-md ${activeCard === "pending" ? 'border-2 border-[#10B981]' : 'border border-gray-100'}`}
        >
          <span className="flex justify-between items-start mb-6">
            <span className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-[#10B981]">
              <FileText className="w-6 h-6 fill-current opacity-80" />
            </span>
            <span className="text-[40px] font-black text-[#10B981] leading-none">{stats.pendingApplicationsCount}</span>
          </span>
          <span className="block font-bold text-gray-900 text-lg">คำร้องขอรอตรวจสอบ</span>
          <span className="block text-gray-400 text-sm font-medium mt-0.5">(Pending Applications)</span>
          {activeCard === "pending" && <span className="absolute left-0 bottom-0 w-full h-1.5 bg-[#10B981]"></span>}
        </button>

        {/* Active Interns */}
        <button 
          onClick={() => setActiveCard("active")}
          className={`bg-white rounded-2xl shadow-sm p-6 relative overflow-hidden text-left transition-all hover:shadow-md ${activeCard === "active" ? 'border-2 border-blue-500' : 'border border-gray-100'}`}
        >
          <span className="flex justify-between items-start mb-6">
            <span className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500">
              <Briefcase className="w-6 h-6 fill-current opacity-80" />
            </span>
            <span className="text-[40px] font-black text-blue-500 leading-none">{stats.activeInternsCount}</span>
          </span>
          <span className="block font-bold text-gray-900 text-lg">นักศึกษาที่กำลังฝึกงาน</span>
          <span className="block text-gray-400 text-sm font-medium mt-0.5">(Active Interns)</span>
          {activeCard === "active" && <span className="absolute left-0 bottom-0 w-full h-1.5 bg-blue-500"></span>}
        </button>

        {/* Urgent Leaves */}
        <Link 
          href="/admin/leaves"
          className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
        >
          <span className="flex justify-between items-start mb-6">
            <span className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 border border-red-100">
              <CalendarX2 className="w-6 h-6" />
            </span>
            <span className="flex flex-col items-end">
              <span className="text-[40px] font-black text-red-500 leading-none mb-1">{stats.urgentLeaveCount}</span>
              <span className="bg-red-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">Urgent</span>
            </span>
          </span>
          <span>
            <span className="block font-bold text-gray-900 text-lg">ใบลาด่วนที่รออนุมัติ</span>
            <span className="block text-gray-400 text-sm font-medium mt-0.5">(Urgent Leave Requests)</span>
          </span>
        </Link>
      </div>

      {/* Main Grid: Data Table + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (Table) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col items-start gap-4 p-6">
          <div className="flex justify-between items-center w-full mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-6 rounded-full ${activeCard === 'pending' ? 'bg-[#10B981]' : 'bg-blue-500'}`}></div>
              <h2 className="text-[19px] font-bold text-gray-900">
                {activeCard === 'pending' ? "คำร้องขอรอการตรวจสอบ" : "นักศึกษาที่กำลังฝึกงาน"}
              </h2>
            </div>
            <Link 
              href="/admin/internships" 
              className="text-sm font-bold text-[#E84E1B] hover:text-[#c43f14] flex items-center gap-1"
            >
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-gray-100 pb-2">
                  <th style={{ width: '25%' }} className="py-4 px-2 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">STUDENT NAME</th>
                  <th style={{ width: '17%' }} className="py-4 px-2 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">MAJOR</th>
                  <th style={{ width: '30%' }} className="py-4 px-2 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">POSITION / DEPARTMENT</th>
                  <th style={{ width: '12%' }} className="py-4 px-2 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">DATE SUBMITTED</th>
                  <th style={{ width: '10%' }} className="py-4 px-2 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const currentData = activeCard === 'pending' ? recentSubmissions : activeInterns;
                  
                  if (!currentData || currentData.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-gray-400 font-medium">ยังไม่มีข้อมูลในส่วนนี้</td>
                      </tr>
                    );
                  }

                  return currentData.map((item: any) => {
                    const initials = `${item.profile.firstName?.charAt(0) || ''}${item.profile.lastName?.charAt(0) || ''}`.toUpperCase();
                    
                    const viewLink = `/admin/internships?id=${item.id}`;

                    return (
                      <tr key={item.id} className="border-b border-gray-50 overflow-hidden hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-orange-100 text-[#E84E1B] font-bold rounded-full flex items-center justify-center shrink-0">
                              {item.profile.profilePictureUrl ? (
                                <img src={item.profile.profilePictureUrl} className="w-full h-full rounded-full object-cover" />
                              ) : initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-gray-900 truncate">{item.profile.firstName} {item.profile.lastName}</span>
                              <span className="text-[11px] text-gray-500 mt-0.5 truncate">{item.profile.user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 truncate align-middle px-2">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-900 truncate">{item.profile.major}</span>
                          </div>
                        </td>
                        <td className="py-4 overflow-hidden px-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-gray-900 truncate">{item.position}</span>
                            <span className="text-[11px] text-gray-400 mt-0.5 truncate">{item.departmentUnit}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 px-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-gray-600 text-[13px] truncate">
                              {hasMounted ? dayjs(item.createdAt).fromNow() : "..."}
                            </span>
                            <span className="font-medium text-gray-400 text-[11px] truncate">
                              {hasMounted ? dayjs(item.createdAt).format('DD MMM YYYY') : "..."}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <Link href={viewLink} className="w-full flex items-center justify-center gap-2 bg-[#d1fae5] hover:bg-[#bbf7d0] text-[#059669] font-bold py-2.5 px-3 rounded-lg transition-colors">
                            <span className="text-xs">View</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (Timeline) */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#4A1D96]/10 text-[#4A1D96] rounded-lg">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                </div>
                <h2 className="text-[19px] font-bold text-gray-900">ประวัติกิจกรรมล่าสุด</h2>
              </div>
              <button className="flex items-center gap-1.5 bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors text-[12px]">
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            <div className="flex flex-col pl-4 gap-6 relative">
              {/* Connecting line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gray-100 z-0"></div>

              {activities && activities.length > 0 ? (
                activities.map((act: any) => {
                  const actionLabel: Record<string, string> = {
                    "SUBMIT_DOC": "ส่งคำร้องขอฝึกงาน",
                    "REJECT_DOC": "ตีกลับเอกสาร",
                    "RE_UPLOAD_DOC": "อัปโหลดเอกสารใหม่",
                    "APPROVE_DOC": "อนุมัติเอกสาร",
                    "APPROVE_LEAVE": "อนุมัติใบลา",
                    "SUBMIT_LEAVE": "ยื่นใบลา",
                    "UPDATE_INFO": "แก้ไขข้อมูลนักศึกษา",
                    "DELETE_DOC": "ลบเอกสาร",
                  };

                  const label = actionLabel[act.action] ?? act.action;

                  let Icon = CheckCircle2;
                  let bg = "bg-gray-400"; // Default Gray
                  let type = "check";

                  // Red actions (Reject/Delete)
                  if (["REJECT_DOC", "DELETE_DOC"].includes(act.action) || act.color === "red") {
                    Icon = XCircle;
                    bg = "bg-red-500";
                    type = "cross";
                  }
                  // Green actions (Approve/Submit/Re-upload)
                  else if (["SUBMIT_DOC", "APPROVE_DOC", "APPROVE_LEAVE", "SUBMIT_LEAVE", "RE_UPLOAD_DOC"].includes(act.action) || act.color === "green") {
                    Icon = CheckCircle2;
                    bg = "bg-green-500";
                    type = "check";
                  }
                  // Orange actions (Update)
                  else if (act.action === "UPDATE_INFO" || act.color === "yellow" || act.color === "orange") {
                    Icon = FileEdit;
                    bg = "bg-orange-500";
                    type = "pencil";
                  }

                  return (
                    <div key={act.id} className="relative z-10 flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${bg} text-white`}>
                        {type === 'check' && <CheckCircle2 className="w-4 h-4 fill-white text-transparent" />}
                        {type === 'cross' && <XCircle className="w-4 h-4 fill-white text-transparent" />}
                        {type === 'pencil' && <FileEdit className="w-4 h-4 fill-white text-transparent" />}
                      </div>
                      <div className="flex flex-col mt-0.5">
                        {/* 1. Action Label (Thai) */}
                        <p className={`text-sm font-bold ${type === 'cross' ? 'text-red-600' :
                          type === 'pencil' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                          {act.title || label}
                        </p>

                        {/* 2. Actor -> Target (Description) */}
                        <span className="text-xs font-medium text-gray-500 mt-0.5">{act.description}</span>

                        {/* 3. Relative time */}
                        <span className="text-[10px] text-gray-400 mt-1">
                          {hasMounted ? dayjs(act.date).fromNow() : "..."}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-gray-400 py-10 text-center">ยังไม่มีกิจกรรมล่าสุด</div>
              )}
            </div>
          </div>

          <button className="w-full mt-8 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors">
            View all activity logs
          </button>
        </div>

      </div>
    </div>
  );
}
