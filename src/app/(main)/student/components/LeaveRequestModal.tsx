"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, CalendarIcon, UploadCloud, Leaf } from 'lucide-react';
import { submitLeaveRequest } from '@/actions/leave';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

interface LeaveRequestModalProps {
  isOpen: boolean;
  closeModal: () => void;
}

export default function LeaveRequestModal({ isOpen, closeModal }: LeaveRequestModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  
  // Combobox State
  const leaveTypes = ["ลาป่วย", "ลากิจ"];
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState(leaveTypes[0]);
  
  // File State
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const filteredTypes = query === ''
      ? leaveTypes
      : leaveTypes.filter((t) => t.toLowerCase().includes(query.toLowerCase()));

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave" || e.type === "drop") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      alert("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }
    setFile(f);
  };

  const formAction = async (formData: FormData) => {
    setIsPending(true);
    setMessage(null);
    
    formData.append("leaveType", selectedType);
    if (file) {
      formData.append("attachment", file);
    }

    const res = await submitLeaveRequest(null, formData);
    
    if (res?.success === false) {
       console.warn("Validation or Server Error:", JSON.stringify(res.fields || res.error, null, 2));
       setMessage({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
       setIsPending(false);
    } else if (res?.success) {
       setMessage({ type: "success", text: res.message || "ส่งคำขอสำเร็จ" });
       // Close modal properly after short delay
       setTimeout(() => {
          closeModal();
          setIsPending(false);
          setMessage(null);
          setFile(null);
       }, 2000);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => { if(!isPending) closeModal(); }}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">
                
                {/* Close Button */}
                <button onClick={closeModal} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50" disabled={isPending}>
                  <X className="w-5 h-5" />
                </button>

                <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <span className="p-2 bg-orange-100 text-primary rounded-lg shadow-sm">
                    <CalendarIcon className="w-5 h-5" />
                  </span>
                  ยื่นใบลา
                </Dialog.Title>

                {message && (
                  <div className={`p-3 rounded-md mb-4 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {message.text}
                  </div>
                )}

                <form action={formAction} className="flex flex-col gap-5">
                  {/* Combobox Leave Type */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      ประเภทการลา<span className="text-red-500">*</span>
                    </label>
                    <Combobox value={selectedType} onChange={setSelectedType}>
                      <div className="relative w-full">
                        <ComboboxInput
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          displayValue={(item: string) => item}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        </ComboboxButton>
                        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                          {filteredTypes.map((type) => (
                            <ComboboxOption
                              key={type}
                              value={type}
                              className={({ focus }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-orange-50 text-primary' : 'text-gray-900'}`}
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{type}</span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                      <CheckIcon className="h-4 w-4 stroke-[3px]" />
                                    </span>
                                  )}
                                </>
                              )}
                            </ComboboxOption>
                          ))}
                        </ComboboxOptions>
                      </div>
                    </Combobox>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-800">จากวันที่<span className="text-red-500">*</span></label>
                      <input type="date" name="startDate" required className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-800">ถึงวันที่<span className="text-red-500">*</span></label>
                      <input type="date" name="endDate" required className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-800">เหตุผล<span className="text-red-500">*</span></label>
                    <textarea name="reason" rows={3} required placeholder="กรุณาระบุเหตุผล..." className="w-full resize-none rounded-md border border-gray-200 p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>

                  {/* File Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-800">แนบไฟล์หลักฐาน (ถ้ามี)</label>
                    <div 
                      className={`w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors relative ${dragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:bg-gray-50"} cursor-pointer`}
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    >
                      {file ? (
                        <div className="flex flex-col items-center gap-1 z-10 w-full px-4 relative">
                          <p className="text-sm font-medium text-gray-700 truncate w-full text-center">{file.name}</p>
                          <p className="text-xs text-green-600 flex items-center gap-1"><CheckIcon className="w-3 h-3"/> แนบไฟล์แล้ว</p>
                          <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="absolute -top-1 right-2 text-red-500 font-bold hover:text-red-700 z-20 tooltip" title="ลบไฟล์">×</button>
                        </div>
                      ) : (
                        <>
                           <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                           <span className="text-xs text-gray-500"><span className="font-semibold text-gray-700">คลิก</span> หรือลากไฟล์มาวาง</span>
                           <span className="text-[10px] text-gray-400">(Max 5MB)</span>
                        </>
                      )}
                      
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) handleFileSelected(e.target.files[0]);
                      }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-2">
                    <button type="button" onClick={closeModal} disabled={isPending} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50">
                      ยกเลิก
                    </button>
                    <button type="submit" disabled={isPending} className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-md shadow-sm hover:bg-[#d9561c] transition-colors disabled:opacity-50 shadow-orange-500/20">
                      {isPending ? "กำลังบันทึก..." : "ส่งคำขอ"}
                    </button>
                  </div>

                </form>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
