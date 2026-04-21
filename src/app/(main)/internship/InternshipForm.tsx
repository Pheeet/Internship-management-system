"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon, AlertCircle } from 'lucide-react';
import { useSearchParams } from "next/navigation";
import { submitInternshipApplication } from "@/actions/internship";
import { uploadDocumentAction, deleteDocumentAction } from "@/actions/student-docs";

function SearchableSelect({ name, options, defaultValue, disabled, placeholder, freeText }: any) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(defaultValue || '')

  const filteredOptions = query === ''
      ? options
      : options.filter((option: string) => option.toLowerCase().includes(query.toLowerCase()))

  return (
    <Combobox value={selected} onChange={(val) => setSelected(val)} disabled={disabled}>
      <div className="relative w-full">
        <input type="hidden" name={name} value={selected} />
        <ComboboxInput
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed pr-10"
          displayValue={(item: string) => item}
          onChange={(event) => {
             setQuery(event.target.value);
             if (freeText) setSelected(event.target.value);
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>
        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-[0_4px_20px_rgb(0,0,0,0.1)] ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredOptions.length === 0 && query !== '' ? (
            freeText ? (
              <ComboboxOption value={query} className="relative cursor-pointer select-none py-2 px-4 text-gray-700 bg-gray-50 hover:bg-gray-100">
                ใช้ค่าที่ระบุ: "{query}"
              </ComboboxOption>
            ) : (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-500">
                ไม่พบข้อมูล
              </div>
            )
          ) : (
            filteredOptions.map((option: string) => (
              <ComboboxOption
                key={option}
                className={({ focus }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-orange-50 text-[#F26522]' : 'text-gray-900'}`
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
                        <CheckIcon className="h-4 w-4 stroke-[3px]" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  )
}

function CustomListbox({ name, options, defaultValue, disabled, placeholder }: any) {
  const [selected, setSelected] = useState(defaultValue || '')
  return (
    <Listbox value={selected} onChange={setSelected} disabled={disabled}>
      <div className="relative w-full">
        {/* hidden input so FormData works */}
        {selected && <input type="hidden" name={name} value={selected} />}
        {!selected && <input type="hidden" name={name} value="" />}
        
        <ListboxButton
          className="w-full text-left rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed pr-10"
        >
          <span className={`block truncate ${!selected ? 'text-gray-500' : 'text-gray-900'}`}>
            {selected || placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </ListboxButton>
        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-[0_4px_20px_rgb(0,0,0,0.1)] ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {options.map((option: string) => (
            <ListboxOption
              key={option}
              className={({ focus }) =>
                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-orange-50 text-[#F26522]' : 'text-gray-900'}`
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
                      <CheckIcon className="h-4 w-4 stroke-[3px]" aria-hidden="true" />
                    </span>
                  ) : null}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}

// Utility formatting date safely
function formatDateString(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export default function InternshipForm({ initialProfile, initialInternship, files: dbFiles, admins, isLocked, internshipStatus, userEmail }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    initialInternship?.snapshotProfilePic ?? initialProfile?.profilePictureUrl ?? null
  );

  // Edit modal state for replacing a specific document
  const [editingFile, setEditingFile] = useState<{ id: string; fileName: string } | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPending, setEditPending] = useState(false);
  const [localDbFiles, setLocalDbFiles] = useState<any[]>(dbFiles || []);

  const isReturned = internshipStatus === "Rejected";

  // Use snapshot values (captured at submission time) when the form is locked.
  // Falls back to live profile data for the first submission (before snapshot exists).
  const snap = initialInternship;
  const displayTitle       = isReturned ? initialProfile?.title        : (snap?.snapshotTitle       ?? initialProfile?.title);
  const displayFirstName   = isReturned ? initialProfile?.firstName    : (snap?.snapshotFirstName   ?? initialProfile?.firstName);
  const displayLastName    = isReturned ? initialProfile?.lastName     : (snap?.snapshotLastName    ?? initialProfile?.lastName);
  const displayPhone       = isReturned ? initialProfile?.phone        : (snap?.snapshotPhone       ?? initialProfile?.phone);
  const displayGender      = isReturned ? initialProfile?.gender       : (snap?.snapshotGender      ?? initialProfile?.gender);
  const displayAddress     = isReturned ? initialProfile?.address      : (snap?.snapshotAddress     ?? initialProfile?.address);
  const displayDOB         = isReturned ? initialProfile?.dateOfBirth  : (snap?.snapshotDOB         ?? initialProfile?.dateOfBirth);
  const displayProfilePic  = isReturned ? initialProfile?.profilePictureUrl : (snap?.snapshotProfilePic ?? initialProfile?.profilePictureUrl);
  const displayParentPhone = isReturned ? initialProfile?.parentPhone  : (snap?.snapshotParentPhone ?? initialProfile?.parentPhone);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    // Check max size and max count (5)
    let validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (selectedFiles.length + validFiles.length > 5) {
      validFiles = validFiles.slice(0, 5 - selectedFiles.length);
      alert("สามารถเลือกไฟล์ได้สูงสุดรวม 5 ไฟล์เท่านั้น");
    }
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const formAction = async (formData: FormData) => {
    if (isLocked) return;
    setIsPending(true);
    setMessage(null);

    // Append standard files to formData explicitly from React state
    selectedFiles.forEach((file) => {
      formData.append("attachments", file);
    });

    if (profilePicFile) {
      formData.append("profilePicture", profilePicFile);
    }

    // Make sure personal info gets submitted even though it's disabled:
    // So we need to re-append disabled fields or omit them in action. 
    // Actually our action expects them, but since they are disabled the browser won't submit their values.
    // So we dynamically append them:
    formData.append("title", initialProfile.title || "");
    formData.append("firstName", initialProfile.firstName || "");
    formData.append("lastName", initialProfile.lastName || "");
    formData.append("gender", initialProfile.gender || "");
    formData.append("dateOfBirth", initialProfile.dateOfBirth ? new Date(initialProfile.dateOfBirth).toISOString() : "");
    formData.append("phone", initialProfile.phone || "");
    formData.append("email", userEmail || initialProfile?.email || "");
    formData.append("address", initialProfile.address || "");
    formData.append("parentPhone", initialProfile.parentPhone || "");

    const res = await submitInternshipApplication(null, formData);
    
    if (res?.success === false) {
       console.warn("Validation or Server Error:", JSON.stringify(res.fields || res.error, null, 2));
       
       // Build a more descriptive error message if field errors exist
       let errorDetail = res.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
       if (res.fields) {
         const fieldErrors = Object.values(res.fields).flat();
         if (fieldErrors.length > 0) {
           errorDetail = `ข้อมูลไม่ถูกต้อง: ${fieldErrors.join(", ")}`;
         }
       }

       setMessage({ type: "error", text: errorDetail });
       setIsPending(false);
       
       // Scroll to top to see error message
       window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 w-full animate-fade-in animate-duration-[400ms]">
      <div className="flex flex-col gap-6">

        {/* Lock Overlay if active */}
        {isLocked && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
               <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
               <div>
                 <p className="font-bold">ข้อมูลถูกล็อคแล้ว</p>
                 <p className="text-sm">คุณได้ทำการส่งฟอร์มข้อมูลสหกิจศึกษาไปแล้ว ไม่สามารถแก้ไขข้อมูลได้</p>
               </div>
            </div>
          </div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ฟอร์มนักศึกษาฝึกงาน</h1>
        </div>

        {error === "incomplete" && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-orange-700 shadow-sm animate-pulse">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="font-bold">กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนเพื่อดำเนินการต่อ (Please complete internship details to proceed)</span>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-md text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

        <form action={formAction} className="bg-white rounded-xl shadow-sm p-10 flex flex-col gap-8 w-full">

          {/* Profile Upload Interactive Display */}
          <div className="flex flex-col items-center">
             <label htmlFor="profilePictureInput" className={`w-32 h-40 md:w-40 md:h-52 rounded-xl border-2 border-dashed ${isLocked ? "border-gray-200" : "border-primary/50 hover:border-primary hover:bg-orange-50 cursor-pointer"} flex items-center justify-center overflow-hidden relative transition-colors`}>
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center gap-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    <span className="text-xs font-semibold">อัปโหลดรูปโปรไฟล์</span>
                  </div>
                )}
                {!isLocked && <input type="file" id="profilePictureInput" name="profilePictureFile" accept="image/*" className="hidden" onChange={handleProfilePicChange} />}
             </label>
             <p className="text-sm text-[#F26522] mt-3">รูปถ่ายในชุดเครื่องแบบนักศึกษาถ่ายไว้ระยะเวลาไม่เกิน 3 ถึง 6 เดือน*</p>
          </div>

          <div className="flex justify-between items-center bg-gray-50 p-4 border border-gray-100 rounded-lg">
             <span className="text-sm text-gray-600 font-medium">ข้อมูลส่วนตัวเบื้องต้น</span>
             {!isLocked && (
               <Link href="/profile" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                 แก้ไขข้อมูลส่วนตัว
               </Link>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-6">

             {/* Row 1 */}
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">คำนำหน้า<span className="text-red-500">*</span></label>
                <input type="text" value={displayTitle || ""} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">ชื่อ<span className="text-red-500">*</span></label>
                <input type="text" value={displayFirstName || ""} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">นามสกุล<span className="text-red-500">*</span></label>
                <input type="text" value={displayLastName || ""} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">เพศ<span className="text-red-500">*</span></label>
                <input type="text" value={displayGender || ""} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
             </div>

             {/* Row 2 */}
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">สถานะการฝึกงาน<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="internshipStatus" 
                  value="รอดำเนินการเอกสาร" 
                  readOnly 
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none cursor-not-allowed font-medium text-orange-600" 
                />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">วันเกิด<span className="text-red-500">*</span></label>
                <input type="date" value={formatDateString(displayDOB)} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">เบอร์โทรศัพท์<span className="text-red-500">*</span></label>
                <input type="text" value={displayPhone || ""} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">อีเมล<span className="text-red-500">*</span></label>
                <input type="text" value={userEmail || ""} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
             </div>

             {/* Row 3 */}
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">ที่อยู่<span className="text-red-500">*</span></label>
                <input type="text" value={displayAddress || ""} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
             </div>
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">เบอร์โทรศัพท์ผู้ปกครอง<span className="text-red-500">*</span></label>
                <input type="text" value={displayParentPhone || ""} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
             </div>

             {/* Row 4 */}
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2 mt-4">
                <label className="text-sm font-semibold text-gray-800">ระดับการศึกษา<span className="text-red-500">*</span></label>
                <CustomListbox
                   name="educationLevel"
                   options={["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"]}
                   defaultValue={initialProfile?.educationLevel === "ไม่ระบุ" ? "" : initialProfile?.educationLevel}
                   disabled={isLocked}
                   placeholder="เลือกระดับการศึกษา..."
                />
             </div>
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2 mt-4">
                <label className="text-sm font-semibold text-gray-800">สถาบัน<span className="text-red-500">*</span></label>
                <input type="text" name="institution" defaultValue={initialProfile?.institution === "ไม่ระบุ" ? "" : initialProfile?.institution} disabled={isLocked} required className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
             </div>

             {/* Row 5 */}
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">คณะ</label>
                <input type="text" name="faculty" defaultValue={initialProfile?.faculty || ""} disabled={isLocked} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
             </div>
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">สาขา<span className="text-red-500">*</span></label>
                <input type="text" name="major" defaultValue={initialProfile?.major === "ไม่ระบุ" ? "" : initialProfile?.major} disabled={isLocked} required className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
             </div>

             {/* Row 6 */}
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">ชื่อ-นามสกุล อาจารย์ที่ปรึกษาสหกิจ</label>
                <input type="text" name="coopAdvisorName" defaultValue={initialProfile?.coopAdvisorName || ""} disabled={isLocked} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
             </div>
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">เบอร์โทรศัพท์อาจารย์ที่ปรึกษาสหกิจ</label>
                <input type="text" name="advisorPhone" defaultValue={initialProfile?.advisorPhone || ""} disabled={isLocked} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
             </div>

             {/* Row 7 */}
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2 mt-4">
                <label className="text-sm font-semibold text-gray-800">ตำแหน่งที่ฝึกงาน<span className="text-red-500">*</span></label>
                <SearchableSelect 
                  name="position"
                  options={[
                    "Frontend Developer",
                    "Backend Developer",
                    "Full Stack Developer",
                    "Mobile Developer (iOS/Android)",
                    "Software Tester / QA Engineer",
                    "Data Scientist / Data Analyst",
                    "DevOps / System Engineer",
                    "UX/UI Designer",
                    "อื่นๆ (โปรดระบุ)"
                  ]}
                  defaultValue={initialInternship?.position || ""}
                  disabled={isLocked}
                  placeholder="ค้นหาหรือพิมพ์ตำแหน่ง..."
                  freeText={true}
                />
             </div>
             <div className="flex flex-col gap-2 mt-4">
                <label className="text-sm font-semibold text-gray-800">วันที่เริ่มฝึกงาน<span className="text-red-500">*</span></label>
                <input type="date" name="startDate" defaultValue={formatDateString(initialInternship?.startDate)} required disabled={isLocked} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
             </div>
             <div className="flex flex-col gap-2 mt-4">
                <label className="text-sm font-semibold text-gray-800">วันที่สิ้นสุดฝึกงาน<span className="text-red-500">*</span></label>
                <input type="date" name="endDate" defaultValue={formatDateString(initialInternship?.endDate)} required disabled={isLocked} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
             </div>

             {/* Row 8 */}
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">หน่วยงานที่ไปฝึก<span className="text-red-500">*</span></label>
                <SearchableSelect 
                  name="departmentUnit"
                  options={[
                    "แผนกเทคโนโลยีสารสนเทศ (IT)", 
                    "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)", 
                    "หน่วยงานดิจิทัลและนวัตกรรม", 
                    "ฝ่ายประกันคุณภาพซอฟต์แวร์ (QA/Tester)",
                    "ทีมออกแบบและประสบการณ์ผู้ใช้ (UX/UI)",
                    "แผนกวิจัยและพัฒนา (R&D)"
                  ]}
                  defaultValue={initialInternship?.departmentUnit || ""}
                  disabled={isLocked}
                  placeholder="ค้นหาหรือพิมพ์ชื่อแผนก..."
                  freeText={true}
                />
             </div>
             <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-800">ชื่อ-นามสกุลผู้ดูแล<span className="text-red-500">*</span></label>
                <SearchableSelect 
                  name="supervisorName"
                  options={admins ? admins.map((a: any) => a.name) : []}
                  defaultValue={initialInternship?.supervisorName || ""}
                  disabled={isLocked}
                  placeholder="ค้นหาชื่อผู้ดูแล..."
                  freeText={false}
                />
             </div>

             {/* Row 9 */}
             <div className="col-span-1 md:col-span-4 flex flex-col gap-2 mt-4">
                <label className="text-sm font-semibold text-gray-800">รายละเอียดเพิ่มเติม</label>
                <textarea name="additionalDetails" defaultValue={initialInternship?.additionalDetails || ""} disabled={isLocked} rows={4} className="w-full resize-none rounded-md border border-gray-200 bg-white p-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
             </div>

             {/* Drag and Drop */}
             <div className="col-span-1 md:col-span-4 flex flex-col gap-2 mt-4 mb-2">
                <label className="text-sm font-semibold text-gray-800">
                  ไฟล์เอกสาร (รองรับไฟล์ PDF/PNG/JPG สูงสุด 5 ไฟล์ ไฟล์ไม่เกิน 5 MB ต่อไฟล์) (เหลืออัปได้ {5 - (selectedFiles.length + (dbFiles ? dbFiles.length : 0))} ไฟล์)
                </label>
                
                {/* Existing DB files */}
                {localDbFiles && localDbFiles.length > 0 && (
                  <div className="flex flex-col gap-2 mb-2">
                    {localDbFiles.map((file: any, i: number) => (
                      <div key={file.id || i} className="flex justify-between items-center text-sm p-3 bg-green-50 border border-green-100 rounded-md gap-2">
                        <span className="text-green-700 underline truncate flex-1">
                          {file.fileName} ✅ (อัปโหลดแล้ว)
                        </span>
                        {isReturned && (
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Edit Button */}
                            <button
                              type="button"
                              title="แก้ไขเอกสาร"
                              onClick={() => { setEditingFile({ id: file.id, fileName: file.fileName }); setEditFile(null); }}
                              className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            {/* Delete Button */}
                            <button
                              type="button"
                              title="ลบเอกสาร"
                              onClick={async () => {
                                if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบเอกสาร "${file.fileName}"?`)) return;
                                const res = await deleteDocumentAction(file.id);
                                if (res.success) {
                                  setLocalDbFiles(prev => prev.filter(f => f.id !== file.id));
                                } else {
                                  alert(res.error || "เกิดข้อผิดพลาดในการลบ");
                                }
                              }}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Local Files selected */}
                {selectedFiles.length > 0 && !isLocked && (
                  <div className="flex flex-col gap-2 mb-2">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <span className="text-gray-700 truncate">{f.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 px-2 font-bold">×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div 
                  className={`w-full h-32 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors cursor-pointer relative overflow-hidden ${dragActive ? "border-primary bg-primary/5" : "border-gray-300 bg-[#F9FAFB]"} ${isLocked ? "pointer-events-none opacity-50" : "hover:bg-gray-100"}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <span className="text-sm text-gray-500 pointer-events-none">Drag & Drop your file or <span className="underline">Browse</span></span>
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} disabled={isLocked} />
                </div>
             </div>

          </div>

          {!isLocked ? (
            <div className="flex justify-end mt-4">
               <button type="submit" disabled={isPending} className="px-10 py-3 text-sm font-bold text-white bg-[#F26522] rounded-md shadow-sm hover:bg-[#E05512] active:scale-[0.98] transition-all disabled:opacity-50">
                  {isPending ? "กำลังบันทึก..." : "บันทึก"}
               </button>
            </div>
          ) : null}

        </form>
      </div>

      {/* Edit Document Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">แก้ไขเอกสาร</h3>
              <button
                type="button"
                onClick={() => { setEditingFile(null); setEditFile(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p className="text-sm text-gray-500">
              กำลังแทนที่ไฟล์: <span className="font-semibold text-gray-700">{editingFile.fileName}</span>
            </p>

            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${editFile ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${editFile ? "text-green-500" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span className="text-sm font-medium text-gray-600">
                {editFile ? editFile.name : "คลิกเพื่อเลือกไฟล์ใหม่"}
              </span>
              <span className="text-xs text-gray-400">PDF, PNG, JPG ไม่เกิน 5MB</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    if (e.target.files[0].size > 5 * 1024 * 1024) {
                      alert("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
                      return;
                    }
                    setEditFile(e.target.files[0]);
                  }
                }}
              />
            </label>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setEditingFile(null); setEditFile(null); }}
                className="px-5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!editFile || editPending}
                onClick={async () => {
                  if (!editFile || !editingFile) return;
                  setEditPending(true);
                  const fd = new FormData();
                  fd.append("file", editFile);
                  fd.append("fileId", editingFile.id);
                  const res = await uploadDocumentAction(fd);
                  setEditPending(false);
                  if (res.success) {
                    setLocalDbFiles(prev => prev.map(f =>
                      f.id === editingFile.id ? { ...f, fileName: editFile.name } : f
                    ));
                    setEditingFile(null);
                    setEditFile(null);
                  } else {
                    alert(res.error || "เกิดข้อผิดพลาดในการอัปโหลด");
                  }
                }}
                className="px-5 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors"
              >
                {editPending ? "กำลังอัปโหลด..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
