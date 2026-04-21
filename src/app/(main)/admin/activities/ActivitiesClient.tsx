"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Download, Search, Calendar as CalendarIcon, Filter, Clock, ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import { getActivities } from "@/actions/admin";
import { getCurrentSemesterRange } from "@/config/semester";

export default function ActivitiesClient() {
  const [hasMounted, setHasMounted] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const TAKE = 20;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showActionFilter, setShowActionFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(event.target as Node)) {
        setShowActionFilter(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDateFilter(false);
      }
    }
    document.body.addEventListener("mousedown", handleClickOutside);
    return () => document.body.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Logic
  const fetchLogs = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    let startDate, endDate;
    if (dateFilter === "today") {
      startDate = dayjs().startOf("day").toDate();
      endDate = dayjs().endOf("day").toDate();
    } else if (dateFilter === "last7") {
      startDate = dayjs().subtract(7, "day").startOf("day").toDate();
      endDate = dayjs().endOf("day").toDate();
    } else if (dateFilter === "month") {
      startDate = dayjs().startOf("month").toDate();
      endDate = dayjs().endOf("month").toDate();
    }

    const { success, data, total: totalCount } = await getActivities({
      searchQuery: debouncedSearch,
      actionType: selectedAction === "all" ? "ALL" : selectedAction,
      startDate,
      endDate,
      skip: isLoadMore ? (page * TAKE) : 0,
      take: TAKE,
    });

    if (success) {
      if (isLoadMore) {
        setLogs(prev => [...prev, ...data]);
      } else {
        setLogs(data);
        setTotal(totalCount || 0);
      }
    }

    setLoading(false);
    setLoadingMore(false);
  }, [debouncedSearch, selectedAction, dateFilter, page]);

  // Initial and Filter Fetch
  useEffect(() => {
    setPage(0);
    fetchLogs(false);
  }, [debouncedSearch, selectedAction, dateFilter, fetchLogs]);

  // Load More Fetch
  useEffect(() => {
    if (page > 0) {
      fetchLogs(true);
    }
  }, [page, fetchLogs]);

  // Export CSV
  const handleExport = () => {
    if (logs.length === 0) return;

    // Prepare headers
    const headers = ["Timestamp", "ActionType", "Actor", "Target", "Details"];
    const rows = logs.map(log => [
      dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      log.action,
      `"${log.actorName}"`,
      `"${log.targetName}"`,
      `"${log.details || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity_logs_${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getActionColor = (action: string) => {
    if (action === "ASSIGN_ADMIN") return "bg-violet-500 border-violet-200 outline-violet-100";
    if (action === "REVOKE_ADMIN") return "bg-orange-500 border-orange-200 outline-orange-100";
    if (action.includes("APPROVE") || action.includes("SUBMIT") || action === "RE_UPLOAD_DOC") return "bg-green-500 border-green-200 outline-green-100";
    if (action.includes("REJECT") || action.includes("DELETE")) return "bg-red-500 border-red-200 outline-red-100";
    if (action.includes("UPDATE")) return "bg-yellow-500 border-yellow-200 outline-yellow-100";
    if (action === "EXPORT") return "bg-teal-500 border-teal-200 outline-teal-100";
    return "bg-teal-500 border-teal-200 outline-teal-100";
  };

  const actionLabels: Record<string, { label: string; english: string }> = {
    "SUBMIT_DOC":    { label: "ส่งคำร้องขอฝึกงาน",    english: "Submitted Application" },
    "REJECT_DOC":    { label: "เอกสารตีกลับ",          english: "Rejected Document" },
    "APPROVE_DOC":   { label: "อนุมัติเอกสาร",         english: "Approved Document" },
    "DELETE_DOC":    { label: "ลบเอกสาร",              english: "Deleted Document" },
    "RE_UPLOAD_DOC": { label: "อัปโหลดเอกสารใหม่",    english: "Re-uploaded Document" },
    "SUBMIT_LEAVE":  { label: "ยื่นใบลา",              english: "Submitted Leave" },
    "APPROVE_LEAVE": { label: "อนุมัติใบลา",           english: "Approved Leave" },
    "REJECT_LEAVE":  { label: "ไม่อนุมัติใบลา",        english: "Rejected Leave" },
    "UPDATE_INFO":   { label: "แก้ไขข้อมูลนักศึกษา",  english: "Updated Info" },
    "EXPORT":        { label: "นำออกข้อมูล",           english: "Exported Data" },
    "ASSIGN_ADMIN":  { label: "เพิ่มสิทธิ์ Admin",     english: "Assigned Admin Role" },
    "REVOKE_ADMIN":  { label: "ถอดสิทธิ์ Admin",       english: "Revoked Admin Role" },
  };

  const formatActionName = (action: string) => {
    const item = actionLabels[action];
    if (item) {
      return `${item.label} (${item.english})`;
    }
    return action;
  };

  const actionLabelMapping: Record<string, string> = {
    all: "All Action Types",
    ...Object.keys(actionLabels).reduce((acc: any, key) => {
      acc[key] = actionLabels[key].label;
      return acc;
    }, {})
  };

  // Derive filtered logs for immediate display / safety
  const filteredLogs = logs.filter(log => 
    selectedAction === 'all' || log.action === selectedAction
  );

  const dateLabelMapping: Record<string, string> = {
    all: 'All Time',
    today: 'Today',
    last7: 'Last 7 Days',
    month: 'This Month'
  };

  const filteredByDate = filteredLogs.filter(log => {
    const logDate = new Date(log.createdAt);
    const now = new Date();
    if (dateFilter === 'today') {
      return logDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'last7') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return logDate >= d;
    } else if (dateFilter === 'month') {
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2d3748] tracking-tight">System Activity Logs</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Audit trail mapping all extensive administrative actions</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row items-center gap-4 w-full">

        {/* Search */}
        <div className="relative w-full lg:w-96 flex-shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student or admin name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-gray-800"
          />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full">
          {/* Action Select */}
          <div className="relative w-full sm:w-auto flex-grow max-w-[300px]" ref={actionRef}>
            <button
              onClick={() => setShowActionFilter(!showActionFilter)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all h-[44px]"
            >
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{selectedAction === 'all' ? 'All Action Types' : actionLabelMapping[selectedAction]}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-auto shrink-0" />
            </button>
            {showActionFilter && (
              <div className="absolute left-0 top-full mt-1 w-full min-w-[240px] bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                {['all', 'APPROVE_DOC', 'REJECT_DOC', 'APPROVE_LEAVE', 'REJECT_LEAVE', 'UPDATE_INFO', 'DELETE_DOC', 'SUBMIT_DOC', 'ASSIGN_ADMIN', 'REVOKE_ADMIN'].map((val) => (
                  <button
                    key={val}
                    onClick={() => { setSelectedAction(val); setShowActionFilter(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${selectedAction === val ? 'bg-purple-50 text-[#4A1D96]' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {val === 'all' ? 'All Action Types' : actionLabelMapping[val]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div className="relative w-full sm:w-auto flex-grow max-w-[250px]" ref={dateRef}>
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none text-[#E84E1B] font-extrabold bg-orange-50 hover:bg-orange-100/50 transition-all h-[44px]"
            >
              <CalendarIcon className="w-4 h-4 text-[#E84E1B] shrink-0" />
              <span className="truncate">{dateLabelMapping[dateFilter]}</span>
              <ChevronDown className="w-4 h-4 text-[#E84E1B] ml-auto shrink-0" />
            </button>
            {showDateFilter && (
              <div className="absolute right-0 top-full mt-1 w-full min-w-[200px] bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'last7', label: 'Last 7 Days' },
                  { value: 'month', label: 'This Month' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setDateFilter(opt.value); setShowDateFilter(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${dateFilter === opt.value ? 'bg-orange-50 text-[#E84E1B]' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#E84E1B] text-white px-5 py-2.5 rounded-xl font-extrabold hover:bg-[#d44315] hover:shadow-lg transition-all focus:ring-4 focus:ring-orange-100 outline-none h-[44px] whitespace-nowrap ml-auto lg:ml-0"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Timeline Wrapper */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-10 min-h-[500px]">
        {loading ? (
          <div className="w-full py-20 flex justify-center text-gray-400 font-medium">Loading logs...</div>
        ) : filteredByDate.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-gray-400 font-medium text-center">
            <Clock className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-lg">No activities recorded matching criteria.</p>
            <p className="text-sm mt-1">Try adjusting your filters or date presets.</p>
          </div>
        ) : (
          <div className="relative border-l-[3px] border-gray-100 ml-4 sm:ml-8 mt-4 space-y-10 pb-10">
            {filteredByDate.map((log: any, index: number) => {
              const dotColorClass = getActionColor(log.action);
              const actionTitle = formatActionName(log.action);
              const isReject = log.action.includes("REJECT");

              return (
                <div key={log.id} className="relative pl-8 sm:pl-12 group transition-all">

                  {/* Solid Dot Timeline Marker */}
                  <div className={`absolute -left-[10.5px] top-1.5 w-5 h-5 rounded-full border-4 border-white outline outline-4 ${dotColorClass} z-10 transition-transform group-hover:scale-110`} />

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-8">
                    <h3 className="text-[15px] font-extrabold text-gray-900 tracking-tight">
                      {actionTitle} <span className="font-medium text-gray-500 mx-1">for</span> <span className="text-purple-700">{log.targetName}</span>
                    </h3>
                    <time className="text-[13px] font-bold text-gray-400 shrink-0">
                      {hasMounted ? dayjs(log.createdAt).format("MMM DD, YYYY • HH:mm:ss") : "Loading..."}
                    </time>
                  </div>

                  <p className="text-sm font-medium text-gray-500 mt-1">
                    Action executed by <span className="text-[#E84E1B] font-bold">{log.actorName}</span>
                    {log.actorRole && (
                      <span className="text-gray-400 font-medium ml-1">
                        ({log.actorRole.charAt(0).toUpperCase() + log.actorRole.slice(1).toLowerCase()})
                      </span>
                    )}
                  </p>

                  {/* Rejection Note Bubble */}
                  {isReject && log.details && (
                    <div className="mt-4 bg-red-50/50 border border-red-100 rounded-xl p-4 relative">
                      {/* Small carets pointing top */}
                      <div className="absolute -top-2 left-6 w-4 h-4 bg-red-50/50 border-t border-l border-red-100 rotate-45"></div>
                      <p className="text-sm font-medium text-red-700 z-10 relative">
                        <span className="font-bold flex items-center gap-1.5 mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          Rejection Reason
                        </span>
                        {log.details}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Load More */}
        {filteredByDate.length > 0 && logs.length < total && (
          <div className="w-full flex justify-center mt-6 border-t border-gray-100 pt-8">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loadingMore}
              className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-extrabold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            >
              {loadingMore ? "Loading Logs..." : `Load More Activities (${logs.length} of ${total})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
