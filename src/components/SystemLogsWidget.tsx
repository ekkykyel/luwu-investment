import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Server, Activity, Clock } from "lucide-react";

interface SystemLog {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
}

export const SystemLogsWidget: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    
    // Auto refresh every 5 minutes (to catch the cron ping)
    const intervalId = setInterval(fetchLogs, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/system-logs");
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-500" />
            Server Health & Traffic
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            Memonitor ping Keep-Alive (Cron) untuk mencegah Supabase cold start.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
        >
          <Activity className={`w-3.5 h-3.5 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "Syncing..." : "Sync"}
        </button>
      </div>

      <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Waktu (Ping)</th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Tipe Event</th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/20">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500 italic text-[10px]">
                    Belum ada log server/ping yang terekam di database.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[10px] font-mono">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        {format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-bold border text-[9px] uppercase tracking-wide inline-flex items-center justify-center bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800 dark:text-slate-300 text-[10px] truncate max-w-xs">
                        {log.description}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
