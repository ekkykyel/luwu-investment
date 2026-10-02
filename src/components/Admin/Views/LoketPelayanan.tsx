import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  FileText,
  BadgeCheck,
  Timer,
  ChevronRight,
  Layers
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

interface AntreanItem {
  id: string;
  nomorAntrean: string;
  namaPemohon: string;
  instansiTujuan: string;
  jenisLayanan: string;
  waktuPanggil: string;
  status: "Menunggu" | "Sedang Dilayani" | "Selesai" | "Selesai Langsung" | "Dipanggil" | "Proses Dokumen";
  petugasLoket: string;
  slaMinutes: number;
}

interface PBGDocItem {
  id: string;
  nomorRegistrasi: string;
  namaPemilik: string;
  fungsiBangunan: string;
  lokasiBangunan: string;
  tahap: string;
  tanggalMasuk: string;
  hariProses: number;
  slaStatus: "aman" | "waspada" | "kritis";
  catatanTeknis: string;
}

const INITIAL_ANTREAN: AntreanItem[] = [];
const INITIAL_PBG: PBGDocItem[] = [];

export default function LoketPelayanan({ isDark = true }: { isDark?: boolean }) {
  const [antreanList, setAntreanList] = useState<AntreanItem[]>(INITIAL_ANTREAN);
  const [pbgList, setPbgList] = useState<PBGDocItem[]>(INITIAL_PBG);
  const [searchPBG, setSearchPBG] = useState("");
  const [filterTahap, setFilterTahap] = useState<string>("Semua");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString("id-ID"));
  const [skmMetrics, setSkmMetrics] = useState({ avgScore: 0, totalSurvei: 0 });

  // Fetch dari Supabase / Sinkronisasi Data Realtime
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch antrean live dari tabel mpp_queues di Supabase
      const { data: antreanData, error: antreanErr } = await supabase
        .from("mpp_queues")
        .select(`
          id,
          ticket_code,
          citizen_nik,
          tenant_id,
          service_id,
          status,
          session,
          created_at,
          mpp_tenants ( name, floor ),
          mpp_services ( service_name ),
          mpp_citizens ( full_name )
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!antreanErr && antreanData && antreanData.length > 0) {
        setAntreanList(antreanData.map((item: any) => {
          const tenant = Array.isArray(item.mpp_tenants) ? item.mpp_tenants[0] : item.mpp_tenants;
          const service = Array.isArray(item.mpp_services) ? item.mpp_services[0] : item.mpp_services;
          const citizen = Array.isArray(item.mpp_citizens) ? item.mpp_citizens[0] : item.mpp_citizens;
          return {
            id: item.id,
            nomorAntrean: item.ticket_code || "A-001",
            namaPemohon: citizen?.full_name || item.citizen_nik || "Warga Pemohon",
            instansiTujuan: tenant?.name || "DPMPTSP Kab. Luwu",
            jenisLayanan: service?.service_name || "Layanan Terpadu",
            waktuPanggil: item.created_at ? new Date(item.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) + " WITA" : "09:00 WITA",
            status: item.status === 'selesai_langsung' ? 'Selesai Langsung' : item.status === 'dipanggil' ? 'Dipanggil' : item.status === 'dilayani' ? 'Sedang Dilayani' : item.status === 'masuk_tracking' ? 'Proses Dokumen' : 'Menunggu',
            petugasLoket: tenant?.floor || "Loket Utama MPP",
            slaMinutes: 15
          };
        }));
      } else {
        setAntreanList([]);
      }

      // 2. Fetch tracking dokumen live dari tabel mpp_document_tracking di Supabase
      const { data: pbgData, error: pbgErr } = await supabase
        .from("mpp_document_tracking")
        .select(`
          id,
          tracking_code,
          current_status,
          created_at,
          updated_at,
          mpp_queues (
            ticket_code,
            citizen_nik,
            mpp_tenants ( name ),
            mpp_services ( service_name ),
            mpp_citizens ( full_name )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!pbgErr && pbgData && pbgData.length > 0) {
        setPbgList(pbgData.map((p: any) => {
          const q = Array.isArray(p.mpp_queues) ? p.mpp_queues[0] : p.mpp_queues;
          const tenant = q?.mpp_tenants ? (Array.isArray(q.mpp_tenants) ? q.mpp_tenants[0] : q.mpp_tenants) : null;
          const service = q?.mpp_services ? (Array.isArray(q.mpp_services) ? q.mpp_services[0] : q.mpp_services) : null;
          const citizen = q?.mpp_citizens ? (Array.isArray(q.mpp_citizens) ? q.mpp_citizens[0] : q.mpp_citizens) : null;
          
          const createdDate = p.created_at ? new Date(p.created_at) : new Date();
          const daysDiff = Math.max(1, Math.round((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24)));
          
          return {
            id: p.id,
            nomorRegistrasi: p.tracking_code || `TRK-${p.id.slice(0, 8)}`,
            namaPemilik: citizen?.full_name || q?.citizen_nik || "Pemohon Berkas",
            fungsiBangunan: service?.service_name || "Layanan Terpadu",
            lokasiBangunan: tenant?.name || "Kabupaten Luwu",
            tahap: p.current_status || "Verifikasi Berkas",
            tanggalMasuk: p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID") : "Hari ini",
            hariProses: daysDiff,
            slaStatus: daysDiff <= 3 ? "aman" : daysDiff <= 6 ? "waspada" : "kritis",
            catatanTeknis: `Dokumen permohonan berada dalam status: ${p.current_status || 'Verifikasi Berkas'}.`
          };
        }));
      } else {
        setPbgList([]);
      }

      // 3. Fetch data SKM
      const { data: skmData } = await supabase
        .from("mpp_skm")
        .select("rating");
      
      if (skmData && skmData.length > 0) {
        const total = skmData.reduce((acc, cur) => acc + (Number(cur.rating) || 0), 0);
        setSkmMetrics({
          avgScore: Number((total / skmData.length).toFixed(1)),
          totalSurvei: skmData.length
        });
      } else {
        setSkmMetrics({ avgScore: 0, totalSurvei: 0 });
      }

      setLastRefreshed(new Date().toLocaleTimeString("id-ID"));
    } catch {
      setAntreanList([]);
      setPbgList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter PBG Data
  const filteredPBG = pbgList.filter((item) => {
    const matchSearch =
      item.nomorRegistrasi.toLowerCase().includes(searchPBG.toLowerCase()) ||
      item.namaPemilik.toLowerCase().includes(searchPBG.toLowerCase()) ||
      item.fungsiBangunan.toLowerCase().includes(searchPBG.toLowerCase()) ||
      item.lokasiBangunan.toLowerCase().includes(searchPBG.toLowerCase());

    const matchTahap = filterTahap === "Semua" || item.tahap === filterTahap;

    return matchSearch && matchTahap;
  });

  // Calculate live stats
  const completedQueues = antreanList.filter(a => a.status === "Selesai" || a.status === "Selesai Langsung").length;
  const activeQueues = antreanList.filter(a => a.status === "Sedang Dilayani" || a.status === "Dipanggil").length;
  const waitingQueues = antreanList.filter(a => a.status === "Menunggu").length;
  const totalQueues = antreanList.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── HEADER MODUL & TOMBOL REFRESH ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl border ${
              isDark ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}>
              <Building2 size={18} />
            </span>
            <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Manajemen Loket Pelayanan & PBG
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Monitoring operasional antrean harian dan alur dokumen Persetujuan Bangunan Gedung (PBG) MPP Simpurusiang.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[11px] hidden sm:inline ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Pembaruan Terakhir: <strong className={isDark ? "text-slate-200" : "text-slate-700"}>{lastRefreshed} WITA</strong>
          </span>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 min-h-[44px] cursor-pointer ${
              isDark 
                ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
            }`}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-emerald-500" : ""} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* ── 1. DASHBOARD ANALITIK EFEKTIVITAS PELAYANAN PERIZINAN (DATA RIIL) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            <Activity size={14} className="text-emerald-500" />
            <span>Efektivitas Pelayanan Perizinan</span>
          </h4>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Standar Pelayanan Prima SPBE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Antrean Dalam Proses</span>
              <Timer size={18} className="text-emerald-500" />
            </div>
            <div className="mt-3">
              <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                {activeQueues} <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Pemohon</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-semibold">
                <CheckCircle2 size={13} />
                <span>{waitingQueues} menunggu antrean</span>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Antrean Selesai Dilayani</span>
              <Clock size={18} className="text-sky-500" />
            </div>
            <div className="mt-3">
              <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                {completedQueues} <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Selesai</span>
              </div>
              <div className="text-xs text-sky-600 dark:text-sky-400 mt-1.5 font-semibold">
                Dari total {totalQueues} permohonan aktif
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Berkas Tracking Terdaftar</span>
              <FileCheck size={18} className="text-amber-500" />
            </div>
            <div className="mt-3">
              <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                {pbgList.length} <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Dokumen</span>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-semibold">
                Alur SIMBG & Perizinan Terpadu
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Indeks Kepuasan Masyarakat</span>
              <Sparkles size={18} className="text-purple-500" />
            </div>
            <div className="mt-3">
              <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                {skmMetrics.avgScore > 0 ? `${skmMetrics.avgScore} / 5.0` : "Belum Ada"}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1.5 font-semibold">
                {skmMetrics.totalSurvei > 0 ? `Berdasarkan ${skmMetrics.totalSurvei} responden` : "Survei Kepuasan Masyarakat"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. TABEL DATA ANTREAN LOKET HARIAN ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <Users size={16} className="text-emerald-500" />
              <span>Daftar Antrean Loket Pelayanan Terpadu Hari Ini</span>
            </h4>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Pemantauan alur panggil dan penyelesaian layanan per loket instansi.
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full border text-xs font-bold w-fit ${
            isDark ? "bg-emerald-950 text-emerald-400 border-emerald-800/40" : "bg-emerald-50 text-emerald-700 border-emerald-300"
          }`}>
            {antreanList.length} Antrean Aktif
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase text-[10px] tracking-wider font-semibold ${
                isDark ? "border-slate-800 text-slate-400 bg-slate-950/60" : "border-slate-200 text-slate-600 bg-slate-50"
              }`}>
                <th className="py-3 px-4">No. Antrean</th>
                <th className="py-3 px-4">Nama Pemohon</th>
                <th className="py-3 px-4">Instansi Tujuan</th>
                <th className="py-3 px-4">Jenis Layanan</th>
                <th className="py-3 px-4">Waktu Panggil</th>
                <th className="py-3 px-4">Petugas & Loket</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800/60 text-slate-200" : "divide-slate-200 text-slate-800"}`}>
              {antreanList.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`py-8 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Belum ada antrean terdaftar di loket hari ini.
                  </td>
                </tr>
              ) : (
                antreanList.map((item) => (
                  <tr key={item.id} className={isDark ? "hover:bg-slate-800/40 transition-colors" : "hover:bg-slate-50 transition-colors"}>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {item.nomorAntrean}
                    </td>
                    <td className={`py-3.5 px-4 font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {item.namaPemohon}
                    </td>
                    <td className={`py-3.5 px-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {item.instansiTujuan}
                    </td>
                    <td className={`py-3.5 px-4 max-w-xs truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {item.jenisLayanan}
                    </td>
                    <td className={`py-3.5 px-4 font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {item.waktuPanggil}
                    </td>
                    <td className={`py-3.5 px-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {item.petugasLoket}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === "Sedang Dilayani"
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30 animate-pulse"
                            : item.status === "Selesai" || item.status === "Selesai Langsung"
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. PANEL KHUSUS: PEMANTAUAN ALUR DOKUMEN PERSETUJUAN BANGUNAN GEDUNG (PBG) ── */}
      <div className={`p-4 sm:p-6 rounded-2xl border space-y-5 transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`p-2 rounded-xl border ${
                isDark ? "bg-sky-950/80 text-sky-400 border-sky-500/20" : "bg-sky-50 text-sky-600 border-sky-200"
              }`}>
                <FileCheck size={18} />
              </span>
              <h4 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Panel Khusus: Alur Dokumen Persetujuan Bangunan Gedung (PBG)
              </h4>
            </div>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Pelacakan terperinci proses administrasi teknis SIMBG dengan indikator Service Level Agreement (SLA).
            </p>
          </div>

          {/* SLA Legend Indicator */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/40" : "bg-emerald-50 text-emerald-700 border-emerald-300"
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Hijau: Sesuai SLA (&le; 3 Hari)</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              isDark ? "bg-amber-950/80 text-amber-300 border-amber-800/40" : "bg-amber-50 text-amber-700 border-amber-300"
            }`}>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Kuning: Menjelang Batas (4-6 Hari)</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              isDark ? "bg-rose-950/80 text-rose-300 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-300"
            }`}>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Merah: Melampaui SLA (&gt; 7 Hari)</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
            <input
              type="text"
              value={searchPBG}
              onChange={(e) => setSearchPBG(e.target.value)}
              placeholder="Cari Nomor Registrasi PBG, Nama Pemilik, atau Layanan..."
              className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-xs outline-none transition-all ${
                isDark 
                  ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500" 
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
              }`}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={15} className={`shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
            <select
              value={filterTahap}
              onChange={(e) => setFilterTahap(e.target.value)}
              className={`w-full sm:w-auto px-3 py-2.5 border text-xs rounded-xl outline-none min-h-[44px] ${
                isDark 
                  ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500" 
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
              }`}
            >
              <option value="Semua">Semua Tahap Alur PBG</option>
              <option value="Verifikasi Berkas">Verifikasi Berkas</option>
              <option value="Tinjauan Teknis">Tinjauan Teknis</option>
              <option value="Menunggu Tanda Tangan">Menunggu Tanda Tangan</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>

        {/* Tabel Alur PBG */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase text-[10px] tracking-wider font-semibold ${
                isDark ? "border-slate-800 text-slate-400 bg-slate-950/60" : "border-slate-200 text-slate-600 bg-slate-50"
              }`}>
                <th className="py-3 px-4">No. Registrasi Tracking</th>
                <th className="py-3 px-4">Nama Pemohon / Pemilik</th>
                <th className="py-3 px-4">Layanan & Instansi</th>
                <th className="py-3 px-4">Tahapan Alur Dokumen</th>
                <th className="py-3 px-4 text-center">Durasi & SLA</th>
                <th className="py-3 px-4">Catatan Telaah Teknis</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800/60 text-slate-200" : "divide-slate-200 text-slate-800"}`}>
              {filteredPBG.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-8 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Tidak ada data permohonan dokumen yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredPBG.map((doc) => (
                  <tr key={doc.id} className={isDark ? "hover:bg-slate-850/50 transition-colors" : "hover:bg-slate-50 transition-colors"}>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {doc.nomorRegistrasi}
                    </td>
                    <td className={`py-3.5 px-4 font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {doc.namaPemilik}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{doc.fungsiBangunan}</div>
                      <div className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{doc.lokasiBangunan}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          doc.tahap === "Verifikasi Berkas"
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/40"
                            : doc.tahap === "Tinjauan Teknis"
                            ? "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800/40"
                            : doc.tahap === "Menunggu Tanda Tangan"
                            ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/40"
                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/40"
                        }`}
                      >
                        {doc.tahap === "Selesai" ? <BadgeCheck size={12} /> : <Layers size={12} />}
                        <span>{doc.tahap}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            doc.slaStatus === "aman"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50"
                              : doc.slaStatus === "waspada"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/50"
                              : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/50"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              doc.slaStatus === "aman"
                                ? "bg-emerald-500"
                                : doc.slaStatus === "waspada"
                                ? "bg-amber-500"
                                : "bg-rose-500 animate-ping"
                            }`}
                          />
                          <span>{doc.hariProses} Hari</span>
                        </span>
                        <span className={`text-[9px] uppercase tracking-tight ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          Masuk: {doc.tanggalMasuk}
                        </span>
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 text-[11px] max-w-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {doc.catatanTeknis}
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
}
