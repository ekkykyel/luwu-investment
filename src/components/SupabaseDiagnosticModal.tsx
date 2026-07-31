import { motion } from "motion/react";
import React, { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle, Database, Loader2, Copy, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCheck?: () => void; // Callback to refresh app data when connection succeeds
}

export const SupabaseDiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  onSuccessCheck
}) => {
  const [status, setStatus] = useState<"idle" | "checking" | "success" | "failed">("idle");
  const [result, setResult] = useState<{
    success: boolean;
    configured: boolean;
    url: string;
    hasKey: boolean;
    latencyMs?: number;
    error: string | null;
    message?: string;
  } | null>(null);
  
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const runConnectionCheck = async () => {
    setStatus("checking");
    setResult(null);
    try {
      const response = await fetch("/api/db-test-connection");
      const data = await response.json();
      
      if (data.success) {
        setStatus("success");
        if (onSuccessCheck) {
          onSuccessCheck();
        }
      } else {
        setStatus("failed");
      }
      setResult(data);
    } catch (err: any) {
      setStatus("failed");
      setResult({
        success: false,
        configured: true,
        url: "Unknown",
        hasKey: false,
        error: `Gagal mengirim request ke backend: ${err.message || String(err)}`
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      runConnectionCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    if (!result) return;
    const report = `=== DIAGNOSTIK KONEKSI SUPABASE ===
Waktu: ${new Date().toLocaleString("id-ID")}
Hasil: ${result.success ? "SUKSES" : "GAGAL"}
Terbaca Konfigurasi: ${result.configured ? "Ya" : "Tidak (Placeholder)"}
Supabase URL: ${result.url}
Key Terdeteksi: ${result.hasKey ? "Ya" : "Tidak"}
Latency: ${result.latencyMs ? `${result.latencyMs}ms` : "N/A"}
Detail Error: ${result.error || "Tidak Ada Error"}
Pesan: ${result.message || "N/A"}
====================================`;
    
    navigator.clipboard.writeText(report);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-700/60 rounded-3xl shadow-3xl text-slate-100 flex flex-col">
        
        {/* Neon glow effect top */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          status === "checking" ? "bg-blue-500 animate-pulse" :
          status === "success" ? "bg-emerald-500" : "bg-rose-500"
        }`} />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              status === "checking" ? "bg-blue-500/15 text-blue-400 animate-spin" :
              status === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
            }`}>
              {status === "checking" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Database className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">
                Diagnostik Database Cloud
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pemeriksaan koneksi Supabase & Vercel Real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-xl transition-all"
            title="Tutup Diagnostik"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          
          {/* Main Overlay Banner status indicator */}
          <div className={`p-4 rounded-2xl border ${
            status === "checking" 
              ? "bg-blue-950/40 border-blue-500/30 text-blue-200" 
              : status === "success"
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                : "bg-rose-950/40 border-rose-500/30 text-rose-100"
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {status === "checking" && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
                {status === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                {status === "failed" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold font-mono tracking-widest uppercase opacity-75">
                  Hasil Pengujian Koneksi
                </span>
                <h4 className="font-bold text-sm text-white mt-1">
                  {status === "checking" && "Sedang Menghubungi Supabase..."}
                  {status === "success" && "Koneksi Berhasil Map Sesuai Target!"}
                  {status === "failed" && "Gagal Menyambungkan Data Sesi"}
                </h4>
                <p className="text-xs mt-1.5 opacity-90 leading-relaxed">
                  {status === "checking" && "Mengirim kueri ping ke Supabase PostgreSQL untuk memvalidasi ketersediaan jaringan dan kecocokan API Security Key."}
                  {status === "success" && "Aplikasi full-stack berhasil terhubung ke server database global. Modul geospasial telah divalidasi aman."}
                  {status === "failed" && "Koneksi terputus ke Supabase. Environment variables di panel Vercel belum membaca konfigurasi database secara benar."}
                </p>
              </div>
            </div>
          </div>

          {/* Connection variables specification details */}
          <div className="bg-slate-950/50 rounded-2xl border border-slate-850 p-4 space-y-3.5">
            <h5 className="text-xs font-bold text-slate-300 font-mono tracking-wide uppercase">
              Rincian Lingkungan Sistem (Host / Env)
            </h5>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Database Engine:</span>
                <span className="font-semibold text-slate-200">Supabase PostgreSQL (PostGIS)</span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Endpoint URL (Domain):</span>
                <span className="font-mono text-slate-300 text-[11px] max-w-[200px] truncate" title={result?.url}>
                  {result?.url && result.url !== "https://placeholder.supabase.co" 
                    ? result.url.replace("https://", "").split(".")[0] + ".supabase.co"
                    : "Belum Dikonfigurasi (Placeholder ID)"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Konfigurasi URL:</span>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  result?.url && result.url !== "https://placeholder.supabase.co"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  {result?.url && result.url !== "https://placeholder.supabase.co" ? "REAL DB ACTIVE" : "PLACEHOLDER / KOSONG"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Service API Security Key:</span>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  result?.hasKey ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}>
                  {result?.hasKey ? "TERPAKANG (PRESENT)" : "KOSONG (MISSING)"}
                </span>
              </div>

              {result?.latencyMs !== undefined && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Kecepatan Respons (Latency):</span>
                  <span className="font-bold text-slate-300 font-mono">{result.latencyMs}ms</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message Details Overlay Block */}
          {status === "failed" && result?.error && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> DETAIL GANGGUAN DETEKSI KONEKSI
              </span>
              <div className="p-3.5 bg-rose-950/30 border border-rose-500/20 rounded-2xl font-mono text-[11px] text-rose-300 leading-relaxed overflow-x-auto select-all max-h-40 whitespace-pre-wrap">
                {result.error}
              </div>
              <div className="p-3 bg-slate-950/40 rounded-xl text-xs text-slate-400 border border-slate-850/60 leading-relaxed">
                💡 <span className="font-semibold text-slate-300">Rekomendasi Pemulihan Vercel:</span> Masuk ke Dashboard Vercel Proyek, buka bagian <span className="font-mono font-bold text-slate-300">Settings &gt; Environment Variables</span>. Tambahkan key bernama <span className="font-mono text-yellow-400 font-bold">SUPABASE_URL</span> dan <span className="font-mono text-yellow-400 font-bold">SUPABASE_SERVICE_ROLE_KEY</span> dengan nilai yang valid dari dashboard Supabase Anda, lalu lakukan <span className="font-bold text-slate-300">Redeploy</span>.
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-xs text-emerald-400 leading-relaxed">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <span>Semua data spasial Luwu berhasil diunduh dan disinkronkan secara real-time ke memori server. Peta spasial aktif sepenuhnya.</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-950/40 border-t border-slate-800/85 flex flex-wrap gap-3 items-center justify-between">
          <button
            onClick={copyToClipboard}
            disabled={!result}
            type="button"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-colors flex items-center gap-2 select-none disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            {showCopySuccess ? "Salin Sukses!" : "Salin Log Diagnostik"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={runConnectionCheck}
              disabled={status === "checking"}
              type="button"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status === "checking" ? "animate-spin" : ""}`} />
              Tes Ulang Koneksi
            </button>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};
