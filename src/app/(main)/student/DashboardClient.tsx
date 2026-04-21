"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { CheckCircle2, Hourglass, Lock, FileText, Download, Upload, Phone, Mail, LogOut, ArrowRight, CalendarIcon, AlertCircle, Clock } from "lucide-react";
import LeaveRequestModal from "./components/LeaveRequestModal";
import DocumentManagementModal from "./components/DocumentManagementModal";

export default function DashboardClient({ profile, recentActivities = [] }: { profile: any, recentActivities?: any[] }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [isDocModalOpen, setDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  useEffect(() => {
    setHasMounted(true);

    // Re-render every minute to update relative times (e.g. "5 minutes ago")
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenDocModal = (file: any) => {
    setSelectedDoc(file);
    setDocModalOpen(true);
  };

  const actionLabel: Record<string, string> = {
    'SUBMIT_DOC': 'ส่งเอกสารฝึกงาน',
    'RE_UPLOAD_DOC': 'อัปโหลดเอกสารใหม่',
    'DELETE_DOC': 'ลบเอกสาร',
    'APPROVE_DOC': 'อนุมัติเอกสาร',
    'REJECT_DOC': 'ตีกลับเอกสาร',
    'SUBMIT_LEAVE': 'ยื่นใบลา',
    'APPROVE_LEAVE': 'อนุมัติใบลา',
    'REJECT_LEAVE': 'ไม่อนุมัติใบลา',
    'UPDATE_INFO': 'แก้ไขข้อมูล',
  };

  const status = profile?.internship?.internshipStatus || "ไม่มีข้อมูล";

  // Phase logic: Show stepper if no internship OR status is one of the preparatory/review steps
  const documentPhaseStatuses = ["รอดำเนินการเอกสาร", "เอกสารสมบูรณ์", "รออนุมัติ", "PENDING", "Rejected", "REJECTED", "ตีกลับ", "ตีกลับ / รอแก้ไข"];
  const isDocumentPhase = !profile?.internship || documentPhaseStatuses.includes(status);

  // Calculate Progress if active
  let totalDays = 90;
  let daysCompleted = 0;
  let progressPercent = 0;

  if (!isDocumentPhase && profile?.internship?.startDate && profile?.internship?.endDate) {
    const start = new Date(profile.internship.startDate);
    const end = new Date(profile.internship.endDate);
    const now = new Date();
    totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    daysCompleted = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysCompleted < 0) daysCompleted = 0;
    if (daysCompleted > totalDays) daysCompleted = totalDays;
    progressPercent = Math.round((daysCompleted / totalDays) * 100);
  }

  // Derived statuses for Timeline
  const isProfileComplete = profile?.firstName && profile?.firstName !== "ไม่ระบุ";
  const isRejected = status === "Rejected" || status === "REJECTED" || status === "ตีกลับ" || status === "ตีกลับ / รอแก้ไข";
  const isAdminReview = (status === "รอดำเนินการเอกสาร" || status === "PENDING" || status === "รออนุมัติ") && !isRejected;
  const isFinalApproval = status === "เอกสารสมบูรณ์" || status === "กำลังฝึกงาน";

  const rejectedFiles = profile.files?.filter((f: any) => f.status === 'REJECTED') || [];

  return (
    <div className="w-full min-h-screen bg-[#F5F7F9]">

      <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-6 font-sans">

        {/* Dynamic Hero Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[#5e2b97]">Welcome back, {profile.firstName || 'Student'}</h1>
              <p className="text-gray-500 mt-2">Here is the latest status of your internship progress.</p>
            </div>
            <Link href="/internship" className="px-6 py-3 bg-[#F26522] hover:bg-[#d9561c] text-white font-semibold rounded-lg shadow-sm shadow-orange-500/20 flex items-center gap-2 transition-all">
              <FileText className="w-5 h-5" />
              View Internship Form
            </Link>
          </div>

          {isDocumentPhase ? (
            <div className="mt-4 flex flex-col items-center max-w-4xl mx-auto w-full px-12">
              <div className="relative flex justify-between w-full z-10 text-center">

                {/* Line connecting steps */}
                <div className="absolute top-6 left-10 right-10 h-[2px] bg-gray-200 -z-10"></div>

                {/* Step 1 */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] border-white ring-2 ${isProfileComplete ? 'bg-[#10B981] ring-[#10B981]' : 'bg-gray-200 ring-gray-200'} text-white`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isProfileComplete ? 'text-[#10B981]' : 'text-gray-500'}`}>Profile Completion</p>
                    <p className="text-sm text-gray-500">{isProfileComplete ? 'Completed' : 'Pending'}</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] border-white ring-2 ${isRejected ? 'bg-red-500 ring-red-500' : (isAdminReview ? 'bg-[#F59E0B] ring-[#F59E0B]' : (isFinalApproval ? 'bg-[#10B981] ring-[#10B981]' : 'bg-gray-200 ring-gray-200'))} text-white`}>
                    {isRejected ? <AlertCircle className="w-6 h-6" /> : <Hourglass className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`font-semibold ${isRejected ? 'text-red-500' : (isAdminReview ? 'text-[#F59E0B]' : (isFinalApproval ? 'text-[#10B981]' : 'text-gray-500'))}`}>
                      {isRejected ? 'Action Required' : 'Admin Review'}
                    </p>
                    <p className="text-sm text-gray-500 font-bold">
                      {isRejected ? 'ถูกตีกลับ' : (isAdminReview ? 'Pending Review' : (isFinalApproval ? 'Approved' : 'Waiting'))}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] border-white ring-2 ${isFinalApproval ? 'bg-[#F26522] ring-[#F26522]' : 'bg-gray-200 ring-gray-200'} text-white`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isFinalApproval ? 'text-[#F26522]' : 'text-gray-500'}`}>Final Approval</p>
                    <p className="text-sm text-gray-500">{isFinalApproval ? 'Unlocked' : 'Locked'}</p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-[#f8f9fa] rounded-xl p-6 border border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Internship Status: <span className="text-[#F26522] uppercase tracking-wide">{status}</span></p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">{daysCompleted} of {totalDays} days completed</h2>
                </div>
                <p className="text-sm font-bold text-[#5e2b97]">{totalDays - daysCompleted} Days Left</p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3.5 relative overflow-hidden">
                <div className="bg-[#F26522] h-3.5 rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${progressPercent}%` }}></div>
              </div>

              <div className="flex justify-end">
                <span className="text-xs font-bold text-gray-700">{progressPercent}% Progress</span>
              </div>
            </div>
          )}
        </div>

        {/* Rejection Alert Banner */}
        {status === "Rejected" && (
          <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 flex items-start gap-4">
            <div className="bg-red-500 p-2 rounded-xl text-white">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-700">คำร้องของคุณถูกตีกลับ (Action Required)</h3>
              <div className="mt-2 flex flex-col gap-1.5">
                <p className="text-red-600 font-bold text-sm">โปรดแก้ไขเอกสารดังต่อไปนี้:</p>
                <ul className="list-disc list-inside text-red-600 text-sm font-medium space-y-1">
                  {rejectedFiles.length > 0 ? (
                    rejectedFiles.map((f: any) => (
                      <li key={f.id} className="leading-relaxed">
                        <span className="font-black">{f.fileName}</span> : {f.rejectReason || 'ข้อมูลไม่ถูกต้อง'}
                      </li>
                    ))
                  ) : (
                    <li>{profile.internship?.rejectReason || "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง โปรดตรวจสอบและแก้ไขอีกครั้ง"}</li>
                  )}
                </ul>
              </div>
              <div className="mt-5 flex gap-3">
                <Link href="/internship" className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200 flex items-center gap-2 active:scale-95">
                  แก้ไขข้อมูล / ส่งรอบใหม่ <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-purple-50 rounded-lg text-[#5e2b97]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Personal Info</h3>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">FULL NAME</p>
                <p className="font-semibold text-gray-900">{profile.firstName} {profile.lastName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">EMAIL ADDRESS</p>
                <p className="font-semibold text-gray-900">{profile.user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">PHONE NUMBER</p>
                <p className="font-semibold text-gray-900">{profile.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">EMERGENCY CALL</p>
                <p className="font-semibold text-red-600">{profile.parentPhone || '+66 89-876-5432'} (Parent)</p>
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-lg text-[#5e2b97]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg>
                </div>
                <h3 className="font-bold text-lg text-gray-900">Education</h3>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">FACULTY</p>
                <p className="font-semibold text-gray-900">{profile.faculty || 'Engineering'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">MAJOR</p>
                <p className="font-semibold text-gray-900">{profile.major || 'Computer Engineering'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">BACHELOR DEGREE</p>
                <p className="font-semibold text-[#5e2b97]">B.S. (3rd Year)</p>
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-purple-50 rounded-lg text-[#5e2b97]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Required Documents</h3>
            </div>

            <div className="flex flex-col gap-3">
              {profile.files && profile.files.length > 0 ? (
                profile.files.map((file: any) => {
                  const displayStatus = file.status || "PENDING";

                  let statusStyles = "";
                  let StatusIcon = null;
                  let labelColor = "text-gray-800";
                  let statusText = "";

                  if (displayStatus === "APPROVED") {
                    statusStyles = "bg-green-50/50 border-green-100 hover:bg-green-100/50";
                    StatusIcon = <CheckCircle2 className="w-5 h-5 text-[#10B981]" />;
                    statusText = "Approved";
                  } else if (displayStatus === "PENDING") {
                    statusStyles = "bg-blue-50/50 border-blue-100 hover:bg-blue-100/50";
                    StatusIcon = <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
                    statusText = "Waiting for review";
                  } else if (displayStatus === "REJECTED") {
                    statusStyles = "bg-red-50/50 border-red-200 hover:bg-red-100/50";
                    StatusIcon = <AlertCircle className="w-5 h-5 text-red-500" />;
                    statusText = "Action required";
                    labelColor = "text-red-700";
                  }

                  const isLocked = displayStatus === "APPROVED";

                  return (
                    <div
                      key={file.id}
                      onClick={() => !isLocked && handleOpenDocModal(file)}
                      className={`group flex justify-between items-center border-[2px] rounded-lg p-3 transition-all ${
                        isLocked
                          ? "cursor-not-allowed opacity-80"
                          : "cursor-pointer hover:shadow-sm"
                      } ${statusStyles}`}
                      title={isLocked ? "ไฟล์นี้ได้รับการอนุมัติแล้ว ไม่สามารถเปลี่ยนแปลงได้" : ""}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${displayStatus === 'REJECTED' ? 'bg-red-500' : (displayStatus === 'PENDING' ? 'bg-blue-500' : 'bg-[#10B981]')} p-1.5 rounded-md text-white ${!isLocked ? 'transition-transform group-hover:scale-110' : ''}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold truncate max-w-[120px] lg:max-w-[200px] ${labelColor}`}>{file.fileName}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {isLocked ? "✓ อนุมัติแล้ว" : statusText}
                          </span>
                        </div>
                      </div>
                      {StatusIcon}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FileText className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm font-bold">ไม่มีเอกสารที่อัปโหลด</p>
                  <Link href="/internship" className="mt-4 px-4 py-2 bg-[#F26522] text-white text-xs font-bold rounded-lg hover:bg-[#d9561c] transition-all flex items-center gap-2 shadow-sm shadow-orange-500/20">
                    Go to Internship Form <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Internship Detail */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-purple-50 rounded-lg text-[#5e2b97]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Internship Detail</h3>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">POSITION</p>
                <p className="font-semibold text-gray-900">{profile.internship?.position || "Software Engineer Intern"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">DEPARTMENT</p>
                <p className="font-semibold text-gray-900">{profile.internship?.departmentUnit || "Tech Solutions Co., Ltd."}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1 uppercase text-left">Internship Period</p>
                <div className="font-semibold text-gray-900 text-left">
                  {profile.internship?.startDate
                    ? dayjs(profile.internship.startDate).format("DD/MM/YYYY")
                    : 'N/A'
                  } - {profile.internship?.endDate
                    ? dayjs(profile.internship.endDate).format("DD/MM/YYYY")
                    : 'N/A'
                  }
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">SUPERVISOR</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{profile.internship?.supervisorName || "Dr. Jane Doe"}</p>
                  <div className="flex items-center gap-2 text-[#F26522]">
                    <button className="hover:bg-orange-50 p-1.5 rounded bg-orange-50/50 tooltip" title="Call"><Phone className="w-4 h-4" /></button>
                    <button className="hover:bg-orange-50 p-1.5 rounded bg-orange-50/50 tooltip" title="Email"><Mail className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions (Submit Leave) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="text-[#5e2b97]">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M11 2v9h-3.5L12 19l4.5-8H13V2h-2z" /></svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">Quick Actions</h3>
            </div>

            <button
              onClick={() => (status === "กำลังฝึกงาน" || status === "Approved" || status === "เอกสารสมบูรณ์") && setLeaveModalOpen(true)}
              disabled={!(status === "กำลังฝึกงาน" || status === "Approved" || status === "เอกสารสมบูรณ์")}
              title={!(status === "กำลังฝึกงาน" || status === "Approved" || status === "เอกสารสมบูรณ์") ? 'กรุณารอให้คำร้องฝึกงานได้รับการอนุมัติก่อน' : ''}
              className={`flex-1 rounded-xl border border-orange-200 bg-orange-50/50 transition-all flex flex-col items-center justify-center p-6 group group-active:scale-95 duration-200 ${!(status === "กำลังฝึกงาน" || status === "Approved" || status === "เอกสารสมบูรณ์")
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-orange-50/80 hover:border-orange-300 hover:shadow-sm cursor-pointer'
                }`}
            >
              <div className="bg-white p-3 rounded-xl shadow-sm text-[#F26522] group-hover:scale-110 transition-transform mb-4">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-[#F26522]">ยื่นใบลา</h4>
              <p className="text-xs font-semibold text-orange-400 mt-1 uppercase tracking-wider">Submit Leave Request</p>
            </button>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg text-[#5e2b97]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Recent Activity</h3>
            </div>
            <div className="flex flex-col gap-4">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.map(act => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${act.action.includes('REJECT') ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="text-sm font-bold text-gray-800 leading-tight flex items-center gap-1.5 flex-wrap">
                        {actionLabel[act.action] || act.action}
                        {act.actorRole && (
                          <span className="text-xs font-medium text-gray-500 lowercase">
                            by {act.actorRole.toLowerCase()}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                        {hasMounted ? dayjs(act.createdAt).format('D MMM YYYY • HH:mm') : "Loading..."}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-2 text-center text-gray-400 text-sm font-medium italic">
                  No recent activities recorded.
                </div>
              )}
            </div>
          </div>

        </div>

        <LeaveRequestModal isOpen={isLeaveModalOpen} closeModal={() => setLeaveModalOpen(false)} />
        {selectedDoc && (
          <DocumentManagementModal
            isOpen={isDocModalOpen}
            closeModal={() => {
              setDocModalOpen(false);
            }}
            document={selectedDoc}
          />
        )}
      </div>
    </div>
  );
}
