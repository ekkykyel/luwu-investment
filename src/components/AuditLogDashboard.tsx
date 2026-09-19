import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Database, ChevronDown, ChevronRight, User, Hash, Activity, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface AuditLog {
  id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  table_name: string;
  record_id: string;
  user_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
}

export const AuditLogDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAutoRefresh) {
      intervalId = setInterval(() => {
        fetchLogs();
      }, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoRefresh]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        
        .limit(100);

      if (error) {
        console.error("Error fetching audit logs:", error);
      } else if (data) {
        setLogs(data);
      }
    } catch (err) {
      console.error("Fetch logs failed", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "INSERT":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30";
      case "UPDATE":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30";
      case "DELETE":
        return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30";
    }
  };

  const parseJson = (data: any) => {
    if (!data) return "null";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 font-sans flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Sistem Tracking Audit Operator
          </h3>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
            Riwayat log sistem untuk entri data spasial dan modifikasi investasi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              isAutoRefresh
                ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                : "bg-slate-50 text-slate-600 dark:text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefresh ? "animate-spin" : ""}`} />
            {isAutoRefresh ? "Auto-Refresh: ON (30s)" : "Auto-Refresh: OFF"}
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {loading ? "Memuat..." : "Segarkan Log"}
          </button>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Waktu Eksekusi</th>
                <th className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Aksi</th>
                <th className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Target Tabel</th>
                <th className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">Operator ID</th>
                <th className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/20">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-600 dark:text-slate-400 italic">
                    Belum ada riwayat aktivitas modifikasi sistem.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold border text-[10px] uppercase tracking-wide inline-flex items-center justify-center ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-mono text-[10px]">
                          <Database className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          {log.table_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                          <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          <span className="truncate w-24 block" title={log.user_id}>
                            {log.user_id ? log.user_id : "System/Internal"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 rounded-md transition-colors"
                        >
                          {expandedId === log.id ? "Minimize" : "View"}
                          {expandedId === log.id ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-slate-50/50 dark:bg-slate-900/60">
                        <td colSpan={5} className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 shadow-[inset_0_4px_6px_-4px_rgba(0,0,0,0.1)]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.action !== "INSERT" && (
                             <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-0">
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-1.5 block">
                                  Previous State (old_data)
                                </span>
                                <pre className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 font-mono p-2.5 rounded-lg overflow-x-auto border border-rose-100 dark:border-rose-900/30 flex-1">
                                  {parseJson(log.old_data)}
                                </pre>
                              </div>
                            )}
                            {log.action !== "DELETE" && (
                              <div className={`bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-0 ${log.action === 'INSERT' ? 'md:col-span-2' : ''}`}>
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-1.5 block">
                                  New State (new_data)
                                </span>
                                <pre className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-mono p-2.5 rounded-lg overflow-x-auto border border-emerald-100 dark:border-emerald-900/30 flex-1">
                                  {parseJson(log.new_data)}
                                </pre>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 inline-flex px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                            <Hash className="w-3 h-3" />
                            Record ID: <span className="font-bold text-slate-800 dark:text-slate-200">{log.record_id}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDashboard;
