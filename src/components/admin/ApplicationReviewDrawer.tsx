"use client";

import { Fragment, useState, useTransition, useEffect } from "react";
import { Dialog, Transition, Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Listbox, ListboxButton, ListboxOptions, ListboxOption } from "@headlessui/react";
import { X, ZoomIn, ZoomOut, CheckCircle2, XCircle, FileText, Edit2, Save, RotateCcw, ChevronDown, Check, ExternalLink } from "lucide-react";
import { updateInternshipStatus, updateStudentAndInternshipInfo } from "@/actions/admin";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminInternshipSchema, type AdminInternshipFormValues } from "@/lib/schemas/admin-internship.schema";
import dayjs from "dayjs";

// Helper Component for Searchable Select (Combobox)
function AdminSearchableSelect({ options, value, onChange, placeholder, freeText, error }: any) {
  const [query, setQuery] = useState('');

  const filteredOptions = query === ''
    ? options
    : options.filter((option: string) => option.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox value={value} onChange={onChange}>
      <div className="relative w-full">
        <div className="relative">
          <ComboboxInput
            className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition-all pr-10 ${error ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 bg-white focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]'
              }`}
            displayValue={(item: string) => item}
            onChange={(event) => {
              setQuery(event.target.value);
              if (freeText) onChange(event.target.value);
            }}
            placeholder={placeholder}
            autoComplete="off"
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </ComboboxButton>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-[0_4px_20px_rgb(0,0,0,0.1)] ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 && query !== '' ? (
              freeText ? (
                <ComboboxOption value={query} className="relative cursor-pointer select-none py-2 px-4 text-gray-700 bg-gray-50 hover:bg-gray-100">
                  ใช้ค่าที่ระบุ: "{query}"
                </ComboboxOption>
              ) : (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-500 italic">
                  ไม่พบรายชื่อในระบบ...
                </div>
              )
            ) : (
              filteredOptions.map((option: string) => (
                <ComboboxOption
                  key={option}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-orange-50 text-[#F26522]' : 'text-gray-900'}`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {option}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#F26522]">
                          <Check className="h-4 w-4 stroke-[3px]" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  );
}

// Helper Component for Custom Listbox
function AdminCustomListbox({ options, value, onChange, placeholder, error }: any) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative w-full">
        <ListboxButton
          className={`w-full text-left rounded-md border px-3 py-2.5 text-sm outline-none transition-all pr-10 ${error ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 bg-white focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]'
            }`}
        >
          <span className={`block truncate ${!value ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
            {value || placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-[0_4px_20px_rgb(0,0,0,0.1)] ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((option: string) => (
              <ListboxOption
                key={option}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-orange-50 text-[#F26522]' : 'text-gray-900'}`
                }
                value={option}
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                      {option}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#F26522]">
                        <Check className="h-4 w-4 stroke-[3px]" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}

interface ApplicationReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  internship: any | null;
  admins?: any[];
}

export default function ApplicationReviewDrawer({ isOpen, onClose, internship, admins }: ApplicationReviewDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<string>("info"); // "info" or file-id
  const [hasMounted, setHasMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fileReviews, setFileReviews] = useState<Record<string, { status: string; reason: string }>>({});
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isBlobLoading, setIsBlobLoading] = useState(false);

  // Initialize reviews only when drawer first opens (not on every internship re-render)
  useEffect(() => {
    if (isOpen && internship?.profile?.files && Object.keys(fileReviews).length === 0) {
      const initial: Record<string, { status: string; reason: string }> = {};
      internship.profile.files.forEach((file: any) => {
        initial[file.id] = {
          status: file.status || "PENDING",
          reason: file.rejectReason || ""
        };
      });
      setFileReviews(initial);
    } else if (!isOpen) {
      setFileReviews({});
    }
  }, [isOpen, internship]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch active file as Blob to bypass browser PDF plugin interceptors (e.g. Brave)
  useEffect(() => {
    // Revoke previous blob URL to free memory
    setBlobUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    const fileUrl = internship?.profile?.files?.find((f: any) => f.id === activeTab)?.fileUrl
      ?? internship?.profile?.files?.[0]?.fileUrl;

    if (!fileUrl || activeTab === "info") return;

    let cancelled = false;
    setIsBlobLoading(true);

    fetch(fileUrl)
      .then(res => res.blob())
      .then(blob => {
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setIsBlobLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsBlobLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, internship]);

  const handleClose = () => {
    setFileReviews({});
    onClose();
  };

  // Initialize Form
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AdminInternshipFormValues>({
    resolver: zodResolver(adminInternshipSchema),
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Update form values when internship data changes
  useEffect(() => {
    if (internship) {
      reset({
        title: internship.profile?.title || "",
        firstName: internship.profile?.firstName || "",
        lastName: internship.profile?.lastName || "",
        gender: internship.profile?.gender || "",
        dateOfBirth: internship.profile?.dateOfBirth ? dayjs(internship.profile.dateOfBirth).format("YYYY-MM-DD") : "",
        phone: internship.profile?.phone || "",
        address: internship.profile?.address || "",
        parentPhone: internship.profile?.parentPhone || "",
        educationLevel: internship.profile?.educationLevel || "",
        institution: internship.profile?.institution || "",
        faculty: internship.profile?.faculty || "",
        major: internship.profile?.major || "",
        coopAdvisorName: internship.profile?.coopAdvisorName || "",
        advisorPhone: internship.profile?.advisorPhone || "",
        position: internship.position || "",
        departmentUnit: internship.departmentUnit || "",
        startDate: internship.startDate ? dayjs(internship.startDate).format("YYYY-MM-DD") : "",
        endDate: internship.endDate ? dayjs(internship.endDate).format("YYYY-MM-DD") : "",
        supervisorName: internship.supervisorName || "",
        additionalDetails: internship.additionalDetails || "",
      });
    }
  }, [internship, reset]);

  if (!internship) return null;

  const profile = internship.profile;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "Unknown Student";
  const studentId = profile?.userId || "N/A";
  const major = profile?.major || "N/A";

  const files = profile?.files || [];
  const activeFile = files.find((f: any) => f.id === activeTab) || files[0] || { fileName: "ไม่พบเอกสารแนบ", fileUrl: null };

  const isAllReviewed = files.length > 0 && files.every(f =>
    fileReviews[f.id]?.status === 'APPROVED' || fileReviews[f.id]?.status === 'REJECTED'
  );

  const onSaveInfo: SubmitHandler<AdminInternshipFormValues> = async (data) => {
    if (!profile?.id) return;
    startTransition(async () => {
      const result = await updateStudentAndInternshipInfo(profile.id, internship.id || null, data);
      if (result.success) {
        setIsEditMode(false);
      } else {
        alert(result.error || "Failed to save information");
      }
    });
  };

  const handleSubmitReview = () => {
    if (!internship.id) return;

    const fileUpdates = files.map((f: any) => ({
      id: f.id,
      status: fileReviews[f.id]?.status || "PENDING",
      rejectReason: fileReviews[f.id]?.reason || null
    }));

    startTransition(async () => {
      await updateInternshipStatus(internship.id, fileUpdates);
      onClose();
    });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xl transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden flex items-center justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-6xl h-[96vh] flex flex-col items-center">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transform transition ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full h-full flex flex-col bg-white overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem]">

                <div className="sticky top-0 z-20 px-6 py-5 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center shrink-0 border-2 border-teal-50 overflow-hidden">
                      {profile?.profilePictureUrl ? (
                        <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <Dialog.Title className="text-[20px] font-extrabold text-gray-900 leading-tight">
                        {fullName}
                      </Dialog.Title>
                      <div className="flex items-center gap-2 mt-1 text-sm font-medium text-gray-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                        <span>Student ID: {studentId}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
                        <span>{major}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) reset();
                        setIsEditMode(!isEditMode);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isEditMode
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-teal-50 text-teal-600 hover:bg-teal-100"
                        }`}
                    >
                      {isEditMode ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          ยกเลิกการแก้ไข
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4" />
                          แก้ไขข้อมูล
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors outline-none"
                    >
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Tabs Header */}
                <div className="flex px-6 border-b border-gray-200 bg-white overflow-x-auto hide-scrollbar shrink-0 gap-4">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`py-3 text-[13px] font-extrabold border-b-[3px] whitespace-nowrap transition-colors ${activeTab === "info" ? "border-[#4A1D96] text-[#4A1D96]" : "border-transparent text-gray-400 hover:text-gray-700"
                      }`}
                  >
                    ข้อมูลคำร้อง
                  </button>
                  {files.map((file: any) => (
                    <button
                      key={file.id}
                      onClick={() => setActiveTab(file.id)}
                      className={`py-3 text-[13px] font-extrabold border-b-[3px] whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === file.id ? "border-[#4A1D96] text-[#4A1D96]" : "border-transparent text-gray-400 hover:text-gray-700"
                        }`}
                    >
                      <FileText className="w-4 h-4" />
                      {file.fileName.length > 20 ? file.fileName.substring(0, 20) + "..." : file.fileName}
                    </button>
                  ))}
                </div>

                {/* Drawer Viewport Content */}
                <div className="flex-1 overflow-hidden bg-[#f8f9fc] relative flex flex-col">

                  {activeTab === "info" ? (
                    // Info Tab Content
                    <form onSubmit={handleSubmit(onSaveInfo)} className="w-full h-full overflow-y-auto p-8 flex flex-col items-center gap-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col gap-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                          <h3 className="text-xl font-black text-gray-900">ข้อมูลการขอฝึกงาน</h3>
                          {isEditMode && (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-teal-100 text-teal-700 px-3 py-1 rounded-full">Editing Mode</span>
                          )}
                        </div>

                        <div className="flex flex-col gap-8">
                          {/* Section 1: Personal Info */}
                          <div className="flex justify-between items-center bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
                            <span className="text-[13px] text-gray-500 font-black uppercase tracking-[0.2em]">ข้อมูลส่วนตัวเบื้องต้น</span>
                          </div>

                          {/* Row 1: Personal Info 1 */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">คำนำหน้า<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <Controller
                                  name="title"
                                  control={control}
                                  render={({ field }) => (
                                    <AdminCustomListbox
                                      options={["นาย", "นางสาว", "นาง"]}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="เลือกคำนำหน้า..."
                                      error={errors.title}
                                    />
                                  )}
                                />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.title || "-"}</div>
                              )}
                              {errors.title && <span className="text-[11px] text-red-500 font-bold mt-0.5 ml-1">{errors.title.message}</span>}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">ชื่อ<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input {...register("firstName")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.firstName || "-"}</div>
                              )}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">นามสกุล<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input {...register("lastName")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.lastName || "-"}</div>
                              )}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">เพศ<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <Controller
                                  name="gender"
                                  control={control}
                                  render={({ field }) => (
                                    <AdminCustomListbox
                                      options={["ชาย", "หญิง", "อื่นๆ"]}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="เลือกเพศ..."
                                      error={errors.gender}
                                    />
                                  )}
                                />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.gender || "-"}</div>
                              )}
                              {errors.gender && <span className="text-[11px] text-red-500 font-bold mt-0.5 ml-1">{errors.gender.message}</span>}
                            </div>
                          </div>

                          {/* Row 2: Personal Info 2 */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">สถานะการฝึกงาน</label>
                              <div className="w-full rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm font-black text-orange-600">
                                {internship.internshipStatus || "-"}
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">วันเกิด<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input type="date" {...register("dateOfBirth")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">
                                  {hasMounted && profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('th-TH') : "-"}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">เบอร์โทรศัพท์<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input {...register("phone")} className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${errors.phone ? 'border-red-500 focus:ring-4 focus:ring-red-500/5' : 'border-gray-200 bg-white focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5'}`} />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.phone || "-"}</div>
                              )}
                              {errors.phone && <span className="text-[11px] text-red-500 font-bold mt-0.5 ml-1">{errors.phone.message}</span>}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">อีเมล<span className="text-red-500 ml-0.5">*</span></label>
                              <div className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm text-gray-400 cursor-not-allowed">
                                {profile?.user?.email || "-"}
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Contact Info */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="col-span-1 md:col-span-2 flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">ที่อยู่<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <textarea {...register("address")} rows={2} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all resize-none" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium min-h-[64px]">{profile?.address || "-"}</div>
                              )}
                            </div>
                            <div className="col-span-1 md:col-span-2 flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">เบอร์โทรศัพท์ผู้ปกครอง<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input {...register("parentPhone")} className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${errors.parentPhone ? 'border-red-500 focus:ring-4 focus:ring-red-500/5' : 'border-gray-200 bg-white focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5'}`} />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.parentPhone || "-"}</div>
                              )}
                              {errors.parentPhone && <span className="text-[11px] text-red-500 font-bold mt-0.5 ml-1">{errors.parentPhone.message}</span>}
                            </div>
                          </div>

                          {/* Section 2: Education Info */}
                          <div className="flex justify-between items-center bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
                            <span className="text-[13px] text-gray-500 font-black uppercase tracking-[0.2em]">ข้อมูลการศึกษา</span>
                          </div>

                          {/* Row 4: Education 1 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">ระดับการศึกษา<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <Controller
                                  name="educationLevel"
                                  control={control}
                                  render={({ field }) => (
                                    <AdminCustomListbox
                                      options={["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"]}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="เลือกระดับการศึกษา..."
                                      error={errors.educationLevel}
                                    />
                                  )}
                                />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.educationLevel || "-"}</div>
                              )}
                              {errors.educationLevel && <span className="text-[11px] text-red-500 font-bold mt-0.5 ml-1">{errors.educationLevel.message}</span>}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">สถาบัน<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input {...register("institution")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.institution || "-"}</div>
                              )}
                            </div>
                          </div>

                          {/* Row 5: Education 2 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">คณะ</label>
                              {isEditMode ? (
                                <input {...register("faculty")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.faculty || "-"}</div>
                              )}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">สาขา<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input {...register("major")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.major || "-"}</div>
                              )}
                            </div>
                          </div>

                          {/* Row 6: Advisor */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">ชื่อ-นามสกุล อาจารย์ที่ปรึกษาสหกิจ</label>
                              {isEditMode ? (
                                <input {...register("coopAdvisorName")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.coopAdvisorName || "-"}</div>
                              )}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">เบอร์โทรศัพท์อาจารย์ที่ปรึกษาสหกิจ</label>
                              {isEditMode ? (
                                <input {...register("advisorPhone")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{profile?.advisorPhone || "-"}</div>
                              )}
                            </div>
                          </div>

                          {/* Section 3: Internship Info */}
                          <div className="flex justify-between items-center bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
                            <span className="text-[13px] text-gray-500 font-black uppercase tracking-[0.2em]">รายละเอียดการฝึกงาน</span>
                          </div>

                          {/* Row 7: Position and Unit */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">ตำแหน่งที่ฝึกงาน<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input
                                  {...register("position")}
                                  type="text"
                                  placeholder="ระบุตำแหน่งที่ฝึกงาน..."
                                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${errors.position ? 'border-red-500 focus:ring-4 focus:ring-red-500/5' : 'border-gray-200 bg-white focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5'}`}
                                />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{internship.position || "-"}</div>
                              )}
                              {errors.position && <span className="text-[11px] text-red-500 font-bold mt-0.5 ml-1">{errors.position.message}</span>}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">หน่วยงานที่ไปฝึก<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input
                                  {...register("departmentUnit")}
                                  type="text"
                                  placeholder="ระบุหน่วยงานหรือแผนก..."
                                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${errors.departmentUnit ? 'border-red-500 focus:ring-4 focus:ring-red-500/5' : 'border-gray-200 bg-white focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5'}`}
                                />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{internship.departmentUnit || "-"}</div>
                              )}
                              {errors.departmentUnit && <span className="text-[11px] text-red-500 font-bold mt-0.5 ml-1">{errors.departmentUnit.message}</span>}
                            </div>
                          </div>

                          {/* Row 8: Training Dates */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">วันที่เริ่มฝึกงาน<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input type="date" {...register("startDate")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">
                                  {hasMounted && internship.startDate ? new Date(internship.startDate).toLocaleDateString('th-TH') : "-"}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-[13px] font-bold text-gray-700 ml-1">วันที่สิ้นสุดฝึกงาน<span className="text-red-500 ml-0.5">*</span></label>
                              {isEditMode ? (
                                <input type="date" {...register("endDate")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all" />
                              ) : (
                                <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">
                                  {hasMounted && internship.endDate ? new Date(internship.endDate).toLocaleDateString('th-TH') : "-"}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <label className="text-[13px] font-bold text-gray-700 ml-1">ชื่อ-นามสกุลผู้ดูแล<span className="text-red-500 ml-0.5">*</span></label>
                            {isEditMode ? (
                              <Controller
                                name="supervisorName"
                                control={control}
                                render={({ field }) => (
                                  <AdminSearchableSelect
                                    options={admins ? admins.map((admin: any) => {
                                      const adminProfile = admin.profile;
                                      return adminProfile?.firstName && adminProfile?.lastName
                                        ? `${adminProfile.title || ''} ${adminProfile.firstName} ${adminProfile.lastName}`.trim()
                                        : (admin.name || admin.email);
                                    }) : []}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="พิมพ์ชื่อผู้ดูแลหรือเลือกจากรายชื่อ..."
                                    freeText={true}
                                    error={errors.supervisorName}
                                  />
                                )}
                              />
                            ) : (
                              <div className="w-full rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm text-gray-700 font-medium">{internship.supervisorName || "-"}</div>
                            )}
                            {errors.supervisorName && <span className="text-[11px] text-red-500 font-bold mt-0.5 ml-1">{errors.supervisorName.message}</span>}
                          </div>

                          {/* Row 10: Additional Details */}
                          <div className="flex flex-col gap-3">
                            <label className="text-[13px] font-bold text-gray-700 ml-1">รายละเอียดเพิ่มเติม</label>
                            {isEditMode ? (
                              <textarea {...register("additionalDetails")} rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F26522] focus:ring-4 focus:ring-[#F26522]/5 transition-all resize-none" />
                            ) : (
                              <div className="text-sm font-medium text-gray-700 bg-gray-50/30 p-5 rounded-2xl border border-gray-100 min-h-[120px] leading-relaxed">
                                {internship.additionalDetails || "ไม่มีข้อมูลชี้แจงเพิ่มเติม"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isEditMode && (
                        <button
                          type="submit"
                          disabled={isPending || !isDirty}
                          className="w-full flex items-center justify-center gap-2 py-4 bg-[#F26522] text-white font-black rounded-2xl shadow-lg hover:bg-[#E05512] transition-all disabled:opacity-50 active:scale-[0.98] mt-4"
                        >
                          {isPending ? (
                            "กำลังบันทึกข้อมูล..."
                          ) : (
                            <>
                              <Save className="w-6 h-6" />
                              SAVE CHANGES
                            </>
                          )}
                        </button>
                      )}
                    </form>
                  ) : (
                    // Document Viewer Content
                    <div className="w-full h-full flex flex-col items-center px-6 pt-4 pb-2 overflow-hidden">
                      <div className="w-full flex justify-between items-center mb-3 bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-red-500" />
                          </div>
                          <span className="text-lg font-black text-gray-900">{activeFile.fileName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-gray-100/50 rounded-full p-1 border border-gray-200 overflow-hidden mr-2">
                            <button onClick={() => setZoom(z => Math.max(z - 10, 50))} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-full transition-all"><ZoomOut className="w-5 h-5" /></button>
                            <span className="px-5 text-[13px] font-black text-gray-900">{zoom}%</span>
                            <button onClick={() => setZoom(z => Math.min(z + 10, 200))} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-full transition-all"><ZoomIn className="w-5 h-5" /></button>
                          </div>

                          <div className="flex items-center gap-2 border-r border-gray-200 pr-4 mr-2">
                            <button
                              type="button"
                              onClick={() => setFileReviews(prev => ({ ...prev, [activeFile.id]: { status: 'APPROVED', reason: '' } }))}
                              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[12px] font-black transition-all ${fileReviews[activeFile.id]?.status === 'APPROVED'
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve File
                            </button>
                            <button
                              type="button"
                              onClick={() => setFileReviews(prev => ({ ...prev, [activeFile.id]: { ...prev[activeFile.id], status: 'REJECTED' } }))}
                              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[12px] font-black transition-all ${fileReviews[activeFile.id]?.status === 'REJECTED'
                                ? "bg-red-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                }`}
                            >
                              <XCircle className="w-4 h-4" />
                              Reject File
                            </button>
                          </div>

                          <a
                            href={activeFile.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[12px] font-black rounded-full hover:bg-black transition-all shadow-md active:scale-95"
                          >
                            <ExternalLink className="w-4 h-4" />
                            เปิดดูเต็มจอ (Open)
                          </a>
                        </div>
                      </div>

                      {fileReviews[activeFile.id]?.status === 'REJECTED' && (
                        <div className="w-full px-8 mb-6 shrink-0 animate-in slide-in-from-top-2">
                          <div className="bg-red-50 border border-red-100 rounded-3xl p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-red-700">
                              <XCircle className="w-4 h-4" />
                              <span className="text-[12px] font-black uppercase tracking-wider">ระบุเหตุผลการตีกลับเฉพาะไฟล์นี้ (Reject Reason for this file)</span>
                            </div>
                            <textarea
                              value={fileReviews[activeFile.id]?.reason || ""}
                              onChange={(e) => setFileReviews(prev => ({ ...prev, [activeFile.id]: { ...prev[activeFile.id], reason: e.target.value } }))}
                              placeholder="ตัวอย่าง: ข้อมูลไม่ชัดเจน, ไฟล์อ่านไม่ได้..."
                              className="w-full rounded-2xl border-none bg-white/60 p-4 text-sm outline-none focus:ring-2 focus:ring-red-200 transition-all resize-none font-medium placeholder:text-red-300"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      <div
                        className="w-full flex-1 min-h-0 bg-white shadow-2xl border border-gray-100 rounded-[2rem] relative origin-top transition-transform duration-200 ease-out flex flex-col items-center justify-center overflow-hidden"
                        style={{ transform: `scale(${zoom / 100})` }}
                      >
                        {activeFile.fileUrl ? (
                          isBlobLoading ? (
                            <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                              <svg className="animate-spin w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              <span className="text-sm font-medium">กำลังโหลดเอกสาร...</span>
                            </div>
                          ) : blobUrl ? (
                            <iframe src={blobUrl} className="w-full h-full border-0" title="PDF Document" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400 p-8 text-center">
                              <FileText className="w-10 h-10" />
                              <p className="text-sm font-medium">ไม่สามารถโหลดเอกสารได้</p>
                              <a href={activeFile.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#F26522] underline">เปิดในแท็บใหม่</a>
                            </div>
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                              <FileText className="w-12 h-12 text-gray-200" />
                            </div>
                            <h4 className="text-2xl font-black text-gray-900">No Document File Uploaded</h4>
                            <p className="text-gray-500 font-medium mt-2">This attachment record has no valid file associated.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Drawer Footer Actions */}
                <div className="px-8 py-5 bg-white border-t border-gray-100 shrink-0 flex flex-col gap-4">
                  {/* Status Notice if already final */}
                  {internship.id && (internship.internshipStatus === "Approved" || internship.internshipStatus === "Rejected") && (
                    <div className={`p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-base border ${internship.internshipStatus === "Rejected" ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"
                      }`}>
                      {internship.internshipStatus === "Rejected" ? (
                        <><XCircle className="w-6 h-6" /> This application has been Rejected</>
                      ) : (
                        <><CheckCircle2 className="w-6 h-6" /> This application has been Approved</>
                      )}
                    </div>
                  )}

                  {internship.id && internship.internshipStatus !== "Approved" ? (
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={isPending || !isAllReviewed}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-green-500 text-white font-black text-base rounded-2xl shadow-lg hover:bg-green-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
                    >
                      <CheckCircle2 className="w-5 h-5" stroke="white" />
                      {isPending ? "กำลังบันทึก..." : isAllReviewed ? "บันทึกผลการตรวจ (Submit Review)" : `ตรวจสอบเอกสารให้ครบก่อน (${files.filter((f: any) => fileReviews[f.id]?.status === 'APPROVED' || fileReviews[f.id]?.status === 'REJECTED').length}/${files.length})`}
                    </button>
                  ) : !internship.id && (
                    <div className="text-center py-4">
                      <span className="text-base font-bold text-gray-400 italic">ยังไม่มีคำร้องขอฝึกงานสำหรับนักศึกษารายนี้</span>
                    </div>
                  )}
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
