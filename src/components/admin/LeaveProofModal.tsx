"use client";

import { useState, useEffect, useTransition, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, ZoomIn, ZoomOut, Download, FileText, RotateCw, ImageIcon, Calendar } from "lucide-react";
import dayjs from "dayjs";
import { updateLeaveStatus } from "@/actions/admin";

interface LeaveProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveReq: any | null;
}

export default function LeaveProofModal({ isOpen, onClose, leaveReq }: LeaveProofModalProps) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const [isPending, startTransition] = useTransition();
  const [zoom, setZoom] = useState(100);

  if (!leaveReq) return null;

  const profile = leaveReq.profile;
  const fullName = `${profile?.firstName} ${profile?.lastName}`;
  const fileName = leaveReq.attachmentName || "Medical Certificate.jpg";
  
  // Real URL if uploaded via the logic we created entirely earlier or fallback 
  const fileUrl = leaveReq.attachmentUrl; 

  const handleApprove = () => {
    startTransition(async () => {
      await updateLeaveStatus(leaveReq.id, "Approved");
      onClose();
    });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-4xl flex flex-col">
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                       <FileText className="w-5 h-5 text-[#E84E1B]" />
                     </div>
                     <div className="flex flex-col">
                       <Dialog.Title as="h3" className="text-[17px] font-extrabold leading-6 text-gray-900">
                         {fileName}
                       </Dialog.Title>
                       <p className="text-[13px] text-gray-500 font-medium tracking-wide mt-0.5">
                         Submitted by <span className="text-[#E84E1B] font-bold">{fullName}</span>
                       </p>
                     </div>
                   </div>

                   <div className="flex items-center gap-4">
                     {/* Controls */}
                     <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 text-gray-600 overflow-hidden">
                       <button onClick={()=>setZoom(z => Math.max(z - 10, 50))} className="p-2 hover:bg-gray-200 transition-colors hidden sm:block"><ZoomOut className="w-4 h-4"/></button>
                       <span className="px-3 text-xs font-bold border-x border-gray-200 py-2 hidden sm:block">{zoom}%</span>
                       <button onClick={()=>setZoom(z => Math.min(z + 10, 200))} className="p-2 hover:bg-gray-200 transition-colors hidden sm:block"><ZoomIn className="w-4 h-4"/></button>
                       <button className="p-2 hover:bg-gray-200 transition-colors hidden sm:block border-l border-gray-200"><RotateCw className="w-4 h-4"/></button>
                     </div>
                     <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
                     <button className="hidden sm:flex items-center gap-2 text-sm font-extrabold text-gray-700 hover:text-gray-900 transition-colors">
                       <Download className="w-4 h-4" /> Download
                     </button>
                     <div className="w-px h-6 bg-gray-200"></div>
                     <button
                       type="button"
                       className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100 hover:text-red-600 focus:outline-none transition-colors"
                       onClick={onClose}
                     >
                       <X className="h-5 w-5" aria-hidden="true" />
                     </button>
                   </div>
                </div>

                {/* Viewport content */}
                <div className="w-full bg-[#161f30] flex items-center justify-center p-8 overflow-auto min-h-[500px] relative">
                   <div 
                     className="transition-transform duration-200 ease-out origin-center flex items-center justify-center shadow-lg rounded-sm overflow-hidden bg-white/5"
                     style={{ transform: `scale(${zoom / 100})`, width: 450, height: 450 }}
                   >
                     {fileUrl ? (
                         // If it's a real URL
                         fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                            <img src={fileUrl} alt="Proof" className="w-full h-full object-contain" />
                         ) : (
                            <iframe src={fileUrl} className="w-full h-full bg-white border-0" />
                         )
                     ) : (
                        // Medical Certificate Mockup from image_5744cb.jpg (Textual fallback style for realism since no file url exists initially)
                        <div className="w-full h-full p-6 flex flex-col items-center justify-center bg-gradient-to-br from-[#126b7c] to-[#0d3448] !shadow-2xl">
                           <h1 className="text-3xl font-serif text-white opacity-90 mt-4 tracking-wide shadow-black drop-shadow-md">Medical Certificate</h1>
                           <div className="w-16 h-px bg-white/40 my-6"></div>
                           <div className="space-y-4 text-center opacity-70">
                             <div className="w-64 h-3 bg-white/20 rounded-full mx-auto" />
                             <div className="w-48 h-3 bg-white/20 rounded-full mx-auto" />
                             <div className="w-72 h-3 bg-white/20 rounded-full mx-auto" />
                             <div className="w-56 h-3 bg-white/20 rounded-full mx-auto mt-8" />
                           </div>
                           <div className="flex w-full justify-between mt-auto px-8 mb-4 border-t border-white/20 pt-4">
                             <div className="w-20 h-2 bg-white/30 rounded-full" />
                             <div className="w-20 h-2 bg-white/30 rounded-full" />
                           </div>
                        </div>
                     )}
                   </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white flex items-center justify-between border-t border-gray-100">
                   <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
                     <div className="flex items-center gap-2">
                       <Calendar className="w-4 h-4" />
                       Uploaded: {hasMounted ? dayjs(leaveReq.createdAt).format('MMM DD, YYYY') : "Loading..."}
                     </div>
                     <div className="flex items-center gap-2">
                       <ImageIcon className="w-4 h-4" />
                       {/* Mock size if real doesn't exist */}
                       2.4 MB
                     </div>
                   </div>

                    <button
                      type="button"
                      disabled={isPending || leaveReq.status === "Approved" || leaveReq.status === "Rejected"}
                      className="inline-flex justify-center rounded-xl border-2 border-[#E84E1B] px-5 py-2.5 text-sm font-extrabold text-[#E84E1B] hover:bg-orange-50 focus:outline-none transition-colors disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                      onClick={handleApprove}
                    >
                      {isPending ? "Approving..." : (leaveReq.status === "Approved" ? "Already Approved" : (leaveReq.status === "Rejected" ? "Already Rejected" : "Approve Request"))}
                    </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
