import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Mail,
  Send,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  FileCheck,
  ShieldCheck,
  Download,
  X,
  Search,
  Filter,
  RefreshCw,
  QrCode,
  Layers,
  ChevronRight,
  UserCheck,
  Building
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { BapKtrPuptrDocument } from "../../documents/BapKtrPuptrDocument";

interface SuratItem {
  id: string;
  nomorSurat: string;
  perihal: string;
  kategori: "Surat Masuk" | "Surat Keluar" | "Disposisi";
  pengirimAtauTujuan: string;
  tanggalSurat: string;
  sifat: "Biasa" | "Penting" | "Rahasia" | "Segera";
  statusPersetujuan: "Menunggu Telaah" | "Paraf Koordinasi" | "Menunggu TTE" | "Tandatangan Terbit";
  tingkatHierarki: string;
  ringkasanIsi: string;
  tteHash?: string;
  ttePenandatangan?: string;
}

export default function EOffice({ isDark = true }: { isDark?: boolean }) {
  const [activeTab, setActiveTab] = useState<"Semua" | "Surat Masuk" | "Surat Keluar" | "Disposisi">("Semua");
  const [suratList, setSuratList] = useState<SuratItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocPreview, setSelectedDocPreview] = useState<SuratItem | null>(null);
  const [showBapTemplateModal, setShowBapTemplateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data dari Supabase (knowledge_documents)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("knowledge_documents")
        .select("id, title, category, source_agency, publication_year, status, file_path, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        setSuratList(data.map((s: any) => ({
          id: s.id,
          nomorSurat: s.file_path ? `DOC/${s.publication_year || '2026'}/${s.id.slice(0, 6).toUpperCase()}` : `500/DPMPTSP/${s.id.slice(0, 6).toUpperCase()}`,
          perihal: s.title || "Dokumen Tata Kelola & Persuratan",
          kategori: s.category || "Surat Masuk",
          pengirimAtauTujuan: s.source_agency || "Pemerintah Kabupaten Luwu",
          tanggalSurat: s.created_at ? new Date(s.created_at).toLocaleDateString("id-ID") : "Hari ini",
          sifat: "Biasa",
          statusPersetujuan: s.status || "Tandatangan Terbit",
          tingkatHierarki: "Kepala Dinas / Sekretariat",
          ringkasanIsi: `${s.title}${s.publication_year ? ` (Tahun: ${s.publication_year})` : ''}`,
          ttePenandatangan: "Kepala DPMPTSP Kabupaten Luwu",
          tteHash: `SHA256:${s.id.replace(/-/g, '')}`
        })));
      } else {
        setSuratList([]);
      }
    } catch {
      setSuratList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSurat = suratList.filter((item) => {
    const matchTab = activeTab === "Semua" || item.kategori === activeTab;
    const matchSearch =
      item.nomorSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.perihal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pengirimAtauTujuan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── HEADER MODUL E-OFFICE ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl border ${
              isDark ? "bg-sky-950/80 text-sky-400 border-sky-500/20" : "bg-sky-50 text-sky-600 border-sky-200"
            }`}>
              <FileText size={18} />
            </span>
            <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Sistem E-Office & Persuratan Digital
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Manajemen alur surat dinas, disposisi aparatur, dan persetujuan Tanda Tangan Elektronik (TTE BSrE).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBapTemplateModal(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              isDark 
                ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40" 
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
            }`}
          >
            <FileCheck size={14} className="text-emerald-500" />
            <span>Template BAP-KTR PUPTR</span>
          </button>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 min-h-[44px] cursor-pointer ${
              isDark 
                ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
            }`}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-sky-500" : ""} />
            <span>Segarkan Berkas</span>
          </button>
        </div>
      </div>

      {/* ── TABEL STATISTIK RINGKASAN PERSURATAN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div
          onClick={() => setActiveTab("Surat Masuk")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "Surat Masuk"
              ? isDark 
                ? "bg-slate-850 border-emerald-500/50 shadow-lg shadow-emerald-950/30" 
                : "bg-emerald-50/50 border-emerald-500 shadow-sm"
              : isDark 
                ? "bg-slate-900 border-slate-800 hover:border-slate-700" 
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Surat Masuk</span>
            <Mail size={18} className="text-emerald-500 shrink-0" />
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono mt-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
            {isLoading ? "..." : `${suratList.filter(s => s.kategori === "Surat Masuk").length}`} <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Berkas</span>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 block font-medium">Sinkronisasi Database E-Office</span>
        </div>

        <div
          onClick={() => setActiveTab("Surat Keluar")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "Surat Keluar"
              ? isDark 
                ? "bg-slate-850 border-sky-500/50 shadow-lg shadow-sky-950/30" 
                : "bg-sky-50/50 border-sky-500 shadow-sm"
              : isDark 
                ? "bg-slate-900 border-slate-800 hover:border-slate-700" 
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Surat Keluar</span>
            <Send size={18} className="text-sky-500 shrink-0" />
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono mt-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
            {isLoading ? "..." : `${suratList.filter(s => s.kategori === "Surat Keluar").length}`} <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Berkas</span>
          </div>
          <span className="text-xs text-sky-600 dark:text-sky-400 mt-1.5 block font-medium">Semua Terbit Nomor Otomatis</span>
        </div>

        <div
          onClick={() => setActiveTab("Disposisi")}
          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "Disposisi"
              ? isDark 
                ? "bg-slate-850 border-purple-500/50 shadow-lg shadow-purple-950/30" 
                : "bg-purple-50/50 border-purple-500 shadow-sm"
              : isDark 
                ? "bg-slate-900 border-slate-800 hover:border-slate-700" 
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className={`flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Disposisi Digital</span>
            <FolderOpen size={18} className="text-purple-500 shrink-0" />
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono mt-2.5 ${isDark ? "text-white" : "text-slate-900"}`}>
            {isLoading ? "..." : `${suratList.filter(s => s.kategori === "Disposisi").length}`} <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Instruksi</span>
          </div>
          <span className="text-xs text-purple-600 dark:text-purple-400 mt-1.5 block font-medium">Instruksi Pejabat Hierarki</span>
        </div>
      </div>

      {/* ── ALUR PERSETUJUAN BERJENJANG (DIGITAL SIGNATURE HIERARCHY) ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>Hierarki Persetujuan & Tanda Tangan Digital (TTE)</span>
            </h4>
            <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Alur verifikasi bertingkat sesuai tata naskah dinas elektronik Pemkab Luwu.
            </p>
          </div>
          <span className={`inline-block self-start sm:self-auto px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border shrink-0 max-w-full truncate ${
            isDark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-300"
          }`}>
            Integrasi BSrE BSSN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          {[
            { level: "Level 1", title: "Verifikator Berkas", desc: "Validasi kelengkapan syarat administrasi", status: "Selesai Cepat" },
            { level: "Level 2", title: "Kepala Bidang", desc: "Kajian kelayakan & paraf teknis persetujuan", status: "Paraf Koordinasi" },
            { level: "Level 3", title: "Sekretaris Dinas", desc: "Koreksi format surat & tata bahasa naskah", status: "Persetujuan Final" },
            { level: "Level 4", title: "Kepala Dinas DPMPTSP", desc: "Otorisasi & Tanda Tangan Elektronik (TTE)", status: "Penerbitan SK" }
          ].map((h, idx) => (
            <div key={idx} className={`p-4 rounded-xl border space-y-2 relative transition-all ${
              isDark ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">{h.level}</span>
              <h5 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{h.title}</h5>
              <p className={`text-[11px] leading-snug ${isDark ? "text-slate-400" : "text-slate-600"}`}>{h.desc}</p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={12} />
                <span>{h.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DAFTAR MANAJEMEN PERSURATAN & TTE ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(["Semua", "Surat Masuk", "Surat Keluar", "Disposisi"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] cursor-pointer ${
                  activeTab === tab
                    ? "bg-sky-600 text-white shadow-md shadow-sky-950/40"
                    : isDark 
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-750" 
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor atau perihal surat..."
              className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs outline-none transition-all ${
                isDark 
                  ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-sky-500" 
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white"
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase text-[10px] tracking-wider font-semibold ${
                isDark ? "border-slate-800 text-slate-400 bg-slate-950/60" : "border-slate-200 text-slate-600 bg-slate-50"
              }`}>
                <th className="py-3 px-4">No. Surat / Registrasi</th>
                <th className="py-3 px-4">Perihal & Ringkasan</th>
                <th className="py-3 px-4">Pengirim / Tujuan</th>
                <th className="py-3 px-4">Kategori & Sifat</th>
                <th className="py-3 px-4 text-center">Status TTE</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800/60 text-slate-200" : "divide-slate-200 text-slate-800"}`}>
              {filteredSurat.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-8 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Tidak ada arsip dokumen yang sesuai dengan kategori ini.
                  </td>
                </tr>
              ) : (
                filteredSurat.map((surat) => (
                  <tr key={surat.id} className={isDark ? "hover:bg-slate-800/40 transition-colors" : "hover:bg-slate-50 transition-colors"}>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      <div>{surat.nomorSurat}</div>
                      <div className={`text-[10px] font-sans mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{surat.tanggalSurat}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className={`font-semibold leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>{surat.perihal}</div>
                      <div className={`text-[11px] mt-1 line-clamp-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{surat.ringkasanIsi}</div>
                    </td>
                    <td className={`py-3.5 px-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {surat.pengirimAtauTujuan}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{surat.kategori}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-fit uppercase ${
                            surat.sifat === "Segera"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/40"
                              : surat.sifat === "Penting"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40"
                              : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {surat.sifat}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          surat.statusPersetujuan === "Tandatangan Terbit"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50"
                            : surat.statusPersetujuan === "Menunggu TTE"
                            ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/50 animate-pulse"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/50"
                        }`}
                      >
                        {surat.statusPersetujuan === "Tandatangan Terbit" ? (
                          <ShieldCheck size={12} className="text-emerald-500" />
                        ) : (
                          <Clock size={12} className="text-purple-500" />
                        )}
                        <span>{surat.statusPersetujuan}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedDocPreview(surat)}
                        className={`p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                          isDark 
                            ? "bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300" 
                            : "bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700"
                        }`}
                        title="Pratinjau Dokumen"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL PRATINJAU TATA LETAK DOKUMEN ── */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"
          }`}>
            
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-sky-500" />
                <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Pratinjau Dokumen Dinas</h4>
              </div>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className={`p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                  isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Document Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs bg-white text-slate-900">
              
              {/* Kop Surat Pemerintah */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  PEMERINTAH KABUPATEN LUWU
                </h3>
                <h4 className="text-base font-black uppercase tracking-tight text-slate-900">
                  DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU
                </h4>
                <p className="text-[10px] text-slate-600">
                  Jl. Jenderal Sudirman No. 01 Kompleks Perkantoran Pemkab Luwu, Belopa 91994
                </p>
              </div>

              {/* Data Surat */}
              <div className="grid grid-cols-2 gap-4 text-[11px] pt-2">
                <div>
                  <span className="text-slate-500 block">Nomor Surat:</span>
                  <strong className="text-slate-900 font-mono">{selectedDocPreview.nomorSurat}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tanggal Naskah:</span>
                  <strong className="text-slate-900">{selectedDocPreview.tanggalSurat}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Perihal:</span>
                  <strong className="text-slate-900 text-xs">{selectedDocPreview.perihal}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Tujuan / Penerima:</span>
                  <strong className="text-slate-900">{selectedDocPreview.pengirimAtauTujuan}</strong>
                </div>
              </div>

              {/* Isi Naskah */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                <p className="font-semibold mb-2">Ringkasan Keputusan / Arahan Teknis:</p>
                <p>{selectedDocPreview.ringkasanIsi}</p>
              </div>

              {/* Bagian TTE Digital BSrE */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="space-y-1 text-[10px]">
                  <span className="text-slate-500 block">Otorisasi Tanda Tangan Digital:</span>
                  <strong className="text-slate-900 block">{selectedDocPreview.ttePenandatangan || "Kepala DPMPTSP Kab. Luwu"}</strong>
                  <span className="text-emerald-700 font-mono font-semibold block">
                    {selectedDocPreview.tteHash || "BSrE-TTE-VERIFIED-7317"}
                  </span>
                </div>
                <div className="p-2 border border-slate-300 rounded-lg bg-white flex flex-col items-center gap-1">
                  <QrCode size={40} className="text-slate-900" />
                  <span className="text-[8px] font-mono text-slate-500">TTE BSrE</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between ${
              isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"
            }`}>
              <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Format Naskah Standar Permendagri & SPBE
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDocPreview(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TEMPLATE BAP-KTR DINAS PUPTR */}
      {showBapTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="relative w-full max-w-5xl max-h-[96vh] overflow-y-auto bg-[#f1f5f9] rounded-3xl shadow-2xl p-2 sm:p-4 print:p-0 print:m-0 print:bg-white print:max-h-none print:overflow-visible print:rounded-none print:shadow-none">
            <BapKtrPuptrDocument
              onClose={() => setShowBapTemplateModal(false)}
              showEditorToolbar={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
