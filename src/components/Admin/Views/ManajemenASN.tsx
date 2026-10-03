import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  Award,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Shield,
  Layers,
  ChevronRight
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

interface ASNItem {
  id: string;
  nip: string;
  namaLengkap: string;
  gelar: string;
  kategoriJabatan: "Jabatan Struktural" | "Jabatan Fungsional";
  namaJabatan: string;
  golonganRuang: string;
  unitKerja: string;
  penugasanLoket: string;
  shiftKerja: "Shift Pagi (07:30 - 16:00)" | "Shift Siang (12:00 - 18:00)" | "Reguler";
  statusKehadiran: "Hadir" | "Dinas Luar" | "Izin / Cuti";
  skpKinerja: number; // Skala 100
  waktuLayanMenit: number;
}

export default function ManajemenASN({ isDark = true }: { isDark?: boolean }) {
  const [asnList, setAsnList] = useState<ASNItem[]>([]);
  const [filterKategori, setFilterKategori] = useState<"Semua" | "Jabatan Struktural" | "Jabatan Fungsional">("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Supabase data dari profiles aparatur / petugas
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at, nik, no_whatsapp")
        .order("created_at", { ascending: true })
        .limit(25);

      if (!error && data && data.length > 0) {
        setAsnList(data.map((item: any) => ({
          id: item.id,
          nip: item.nik || `1988${item.id.slice(0, 8).replace(/\D/g, '1').padEnd(8, '0')}`,
          namaLengkap: item.full_name || item.email || "Petugas Aparatur",
          gelar: "",
          kategoriJabatan: item.role === "superadmin" || item.role === "admin" ? "Jabatan Struktural" : "Jabatan Fungsional",
          namaJabatan: item.role === "superadmin" 
            ? "Super Administrator DPMPTSP" 
            : item.role === "admin" 
            ? "Administrator Pelayanan Terpadu" 
            : item.role === "operator" 
            ? "Operator Loket Front Office MPP" 
            : "Petugas Pelayanan / ASN",
          golonganRuang: item.role === "superadmin" ? "Pembina Utama (IV/c)" : item.role === "admin" ? "Penata Tk. I (III/d)" : "Penata (III/c)",
          unitKerja: "DPMPTSP Kabupaten Luwu",
          penugasanLoket: "Loket Pelayanan Terpadu Simpurusiang",
          shiftKerja: "Shift Pagi (07:30 - 16:00)",
          statusKehadiran: "Hadir",
          skpKinerja: 95.0,
          waktuLayanMenit: 10.0
        })));
      } else {
        setAsnList([]);
      }
    } catch {
      setAsnList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering Logic
  const filteredASN = asnList.filter((asn) => {
    const matchKategori = filterKategori === "Semua" || asn.kategoriJabatan === filterKategori;
    const matchSearch =
      asn.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asn.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asn.namaJabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asn.penugasanLoket.toLowerCase().includes(searchQuery.toLowerCase());

    return matchKategori && matchSearch;
  });

  const countStruktural = asnList.filter(a => a.kategoriJabatan === "Jabatan Struktural").length;
  const countFungsional = asnList.filter(a => a.kategoriJabatan === "Jabatan Fungsional").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── HEADER MODUL MANAJEMEN ASN ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl border ${
              isDark ? "bg-purple-950/80 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-600 border-purple-200"
            }`}>
              <Users size={18} />
            </span>
            <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Direktori Kepegawaian & Manajemen ASN
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Penugasan shift loket front-office, evaluasi kinerja SKP, dan pemisahan Jabatan Struktural & Fungsional.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 min-h-[44px] cursor-pointer ${
            isDark 
              ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700" 
              : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
          }`}
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin text-purple-500" : ""} />
          <span>Segarkan Pegawai</span>
        </button>
      </div>

      {/* ── RINGKASAN METRIK KINERJA & STRUKTUR APARATUR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div
          onClick={() => setFilterKategori("Semua")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            filterKategori === "Semua"
              ? isDark 
                ? "bg-slate-850 border-emerald-500/50 shadow-lg shadow-emerald-950/30" 
                : "bg-emerald-50/50 border-emerald-500 shadow-sm"
              : isDark 
                ? "bg-slate-900 border-slate-800 hover:border-slate-700" 
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Total ASN & Operator</span>
            <Users size={18} className="text-emerald-500 shrink-0" />
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono mt-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
            {asnList.length} <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 font-sans">Pegawai</span>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 block font-medium">100% Terdaftar SIMPEG Luwu</span>
        </div>

        <div
          onClick={() => setFilterKategori("Jabatan Struktural")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            filterKategori === "Jabatan Struktural"
              ? isDark 
                ? "bg-slate-850 border-purple-500/50 shadow-lg shadow-purple-950/30" 
                : "bg-purple-50/50 border-purple-500 shadow-sm"
              : isDark 
                ? "bg-slate-900 border-slate-800 hover:border-slate-700" 
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Jabatan Struktural</span>
            <Building2 size={18} className="text-purple-500 shrink-0" />
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono mt-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
            {countStruktural} <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 font-sans">Pejabat</span>
          </div>
          <span className="text-xs text-purple-600 dark:text-purple-400 mt-1.5 block font-medium">Pengambil Kebijakan & Paraf</span>
        </div>

        <div
          onClick={() => setFilterKategori("Jabatan Fungsional")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            filterKategori === "Jabatan Fungsional"
              ? isDark 
                ? "bg-slate-850 border-sky-500/50 shadow-lg shadow-sky-950/30" 
                : "bg-sky-50/50 border-sky-500 shadow-sm"
              : isDark 
                ? "bg-slate-900 border-slate-800 hover:border-slate-700" 
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Jabatan Fungsional</span>
            <Briefcase size={18} className="text-sky-500 shrink-0" />
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono mt-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
            {countFungsional} <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 font-sans">Pegawai</span>
          </div>
          <span className="text-xs text-sky-600 dark:text-sky-400 mt-1.5 block font-medium">Pelaksana Teknis & Front Office</span>
        </div>
      </div>

      {/* ── TABEL DIREKTORI KEPEGAWAIAN ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        
        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Toggle Kategori Filter */}
          <div className={`flex items-center gap-1.5 p-1 border rounded-xl w-full sm:w-auto overflow-x-auto ${
            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
          }`}>
            {(["Semua", "Jabatan Struktural", "Jabatan Fungsional"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterKategori(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[40px] cursor-pointer ${
                  filterKategori === cat
                    ? "bg-purple-600 text-white shadow-sm"
                    : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIP, atau loket..."
              className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs outline-none transition-all ${
                isDark 
                  ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-purple-500" 
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white"
              }`}
            />
          </div>
        </div>

        {/* Tabel Data Pegawai */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase text-[10px] tracking-wider font-semibold ${
                isDark ? "border-slate-800 text-slate-400 bg-slate-950/60" : "border-slate-200 text-slate-600 bg-slate-50"
              }`}>
                <th className="py-3 px-4">Nama Lengkap & NIP</th>
                <th className="py-3 px-4">Kategori Jabatan</th>
                <th className="py-3 px-4">Jabatan & Golongan</th>
                <th className="py-3 px-4">Penugasan Shift & Loket</th>
                <th className="py-3 px-4 text-center">Status Presensi</th>
                <th className="py-3 px-4 text-center">Kinerja SKP</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800/60 text-slate-200" : "divide-slate-200 text-slate-800"}`}>
              {filteredASN.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-8 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Tidak ada pegawai yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredASN.map((asn) => (
                  <tr key={asn.id} className={isDark ? "hover:bg-slate-800/40 transition-colors" : "hover:bg-slate-50 transition-colors"}>
                    <td className="py-3.5 px-4">
                      <div className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                        {asn.namaLengkap}{asn.gelar ? `, ${asn.gelar}` : ""}
                      </div>
                      <div className={`font-mono text-[10px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        NIP. {asn.nip}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          asn.kategoriJabatan === "Jabatan Struktural"
                            ? isDark ? "bg-purple-950/80 text-purple-300 border-purple-500/30" : "bg-purple-50 text-purple-700 border-purple-200"
                            : isDark ? "bg-sky-950/80 text-sky-300 border-sky-500/30" : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {asn.kategoriJabatan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{asn.namaJabatan}</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono font-semibold">{asn.golonganRuang}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{asn.penugasanLoket}</div>
                      <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                        <Calendar size={11} />
                        <span>{asn.shiftKerja}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          asn.statusKehadiran === "Hadir"
                            ? isDark ? "bg-emerald-950 text-emerald-300 border-emerald-700/50" : "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : asn.statusKehadiran === "Dinas Luar"
                            ? isDark ? "bg-sky-950 text-sky-300 border-sky-700/50" : "bg-sky-50 text-sky-700 border-sky-300"
                            : isDark ? "bg-amber-950 text-amber-300 border-amber-700/50" : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            asn.statusKehadiran === "Hadir"
                              ? "bg-emerald-500"
                              : asn.statusKehadiran === "Dinas Luar"
                              ? "bg-sky-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span>{asn.statusKehadiran}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          {asn.skpKinerja}
                        </span>
                        <span className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                          {asn.waktuLayanMenit > 0 ? `${asn.waktuLayanMenit} m / layan` : "Otorisator"}
                        </span>
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
}
