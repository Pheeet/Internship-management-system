"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, FileText, UploadCloud, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { uploadDocumentAction } from '@/actions/student-docs';

interface DocumentManagementModalProps {
  isOpen: boolean;
  closeModal: () => void;
  document: {
    id: string; // FileAttachment ID
    fileName: string;
    fileUrl: string;
    status: string;
    rejectReason?: string | null;
  };
}

export default function DocumentManagementModal({ isOpen, closeModal, document }: DocumentManagementModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isBlobLoading, setIsBlobLoading] = useState(false);

  // Reset state when modal closes or document changes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setMessage(null);
      setIsPending(false);
      // Revoke blob URL on close
      setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    }
  }, [isOpen, document]);

  // Fetch file as Blob to bypass browser PDF plugin interceptors (e.g. Brave)
  useEffect(() => {
    if (!isOpen || !document.fileUrl) return;

    let cancelled = false;
    setIsBlobLoading(true);
    setBlobUrl(null);

    fetch(document.fileUrl)
      .then(res => res.blob())
      .then(blob => {
        if (!cancelled) {
          setBlobUrl(URL.createObjectURL(blob));
          setIsBlobLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setIsBlobLoading(false); });

    return () => { cancelled = true; };
  }, [isOpen, document.fileUrl]);

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
      alert("ไฟล์คอนต้องมีขนาดไม่เกิน 5MB");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsPending(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileId", document.id); // Identifying specific record to replace

    const res = await uploadDocumentAction(formData);

    if (res.success) {
      setMessage({ type: "success", text: res.message || "อัปโหลดสำเร็จ" });
      setTimeout(() => {
        closeModal();
      }, 1500);
    } else {
      setMessage({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
      setIsPending(false);
    }
  };

  const isRejected = document.status === "REJECTED";

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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-6xl h-[90vh] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all relative flex flex-col">
                
                {/* Close Button */}
                <button onClick={closeModal} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50" disabled={isPending}>
                  <X className="w-6 h-6" />
                </button>

                <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-purple-100 text-[#5e2b97] rounded-xl shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  Manage: {document.fileName}
                </Dialog.Title>

                {message && (
                  <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                    {message.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>}
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
                  
                  {/* Left Side: Preview & Info */}
                  <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
                    
                    {/* Rejection Alert */}
                    {isRejected && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 text-orange-700 font-bold mb-2 uppercase tracking-wider text-xs">
                          <AlertCircle className="w-4 h-4" />
                          Action Required: Rejection Reason
                        </div>
                        <p className="text-gray-700 text-sm italic border-l-4 border-orange-300 pl-3 py-1 bg-white/50 rounded-r-md">
                          "{document.rejectReason || 'โปรดตรวจสอบความถูกต้องของไฟล์อีกครั้ง'}"
                        </p>
                      </div>
                    )}

                    {/* Current File Preview */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                       <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Eye className="w-4 h-4" /> Current Preview
                       </h4>
                       <div className="flex-1 min-h-0 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden relative shadow-inner">
                          {document.fileUrl ? (
                            isBlobLoading ? (
                              <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                                <svg className="animate-spin w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span className="text-sm font-medium">กำลังโหลดเอกสาร...</span>
                              </div>
                            ) : blobUrl ? (
                              <iframe src={blobUrl} className="w-full h-full border-0" title="File Preview" />
                            ) : (
                              <div className="flex flex-col items-center gap-3 p-8 text-center">
                                <FileText className="w-10 h-10 text-gray-300" />
                                <p className="text-sm font-medium text-gray-500">ไม่สามารถโหลดเอกสารได้</p>
                                <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#F26522] underline">เปิดในแท็บใหม่</a>
                              </div>
                            )
                          ) : (
                            <div className="text-center p-8">
                              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-400 text-sm font-medium">No file uploaded yet</p>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>

                  {/* Right Side: Upload Zone */}
                  <div className="flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col gap-2">
                       <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <UploadCloud className="w-4 h-4" /> Replace with New File
                       </h4>
                       <div 
                         className={`flex-1 min-h-[280px] rounded-2xl border-4 border-dashed transition-all relative flex flex-col items-center justify-center gap-4 ${
                           dragActive ? "border-[#F26522] bg-orange-50/50" : "border-gray-100 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-200"
                         } cursor-pointer group`}
                         onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                       >
                          {!file ? (
                            <>
                              <div className="bg-white p-5 rounded-2xl shadow-md text-gray-400 group-hover:text-[#F26522] group-hover:scale-110 transition-all">
                                <UploadCloud className="w-12 h-12" />
                              </div>
                              <div className="text-center px-6">
                                <p className="text-lg font-bold text-gray-700">Drag & drop your file here</p>
                                <p className="text-sm text-gray-500 mt-1">or <span className="text-[#F26522] underline font-bold">browse files</span> on your computer</p>
                                <p className="text-xs text-gray-400 mt-4 font-medium uppercase tracking-widest">Supported: PDF, PNG, JPG (Max 5MB)</p>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-center p-8 w-full animate-fade-in">
                              <div className="bg-green-100 p-5 rounded-2xl shadow-sm text-green-600 mb-4">
                                <FileText className="w-12 h-12" />
                              </div>
                              <p className="text-lg font-bold text-gray-800 truncate w-full max-w-xs">{file.name}</p>
                              <p className="text-sm text-green-600 font-bold mt-1 flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Ready to replace
                              </p>
                              <button 
                                type="button" 
                                onClick={(e) => { e.preventDefault(); setFile(null); }} 
                                className="mt-6 text-sm font-bold text-red-500 hover:underline px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                Remove and select another
                              </button>
                            </div>
                          )}
                          <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" disabled={isPending} onChange={(e) => {
                            if (e.target.files && e.target.files[0]) handleFileSelected(e.target.files[0]);
                          }} />
                       </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                       <button
                         onClick={handleUpload}
                         disabled={!file || isPending}
                         className="w-full py-4 rounded-xl bg-[#F26522] text-white font-bold text-lg shadow-lg shadow-orange-500/20 hover:bg-[#d9561c] hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                       >
                         {isPending ? "Uploading document..." : "Upload New File"}
                       </button>
                       <button
                         onClick={closeModal}
                         disabled={isPending}
                         className="w-full py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                       >
                         Cancel
                       </button>
                    </div>
                  </div>

                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
