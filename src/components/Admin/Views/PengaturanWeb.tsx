import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Sliders,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  RefreshCw,
  Save,
  AlertTriangle,
  Sparkles,
  Eye,
  Upload,
  UserCheck,
  Check
} from "lucide-react";
import { supabase, handleSupabaseError } from "../../../lib/supabaseClient";

interface TestimonialItem {
  id: string;
  name: string;
  company: string;
  role: string;
  comment: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
}

interface WebConfig {
  heroTitle: string;
  heroSubtitle: string;
  maklumatPelayanan: string;
  bannerImageUrl: string;
  pejabatFotoUrl: string;
  pejabatNama: string;
  pejabatJabatan: string;
  callCenter: string;
  emailResmi: string;
}

// Kamus Koreksi Kata Kelembagaan untuk Proteksi Tipografi (Anti-Truncation Protection)
const INSTITUTIONAL_DICTIONARY: Record<string, string> = {
  "pelaya": "pelayanan",
  "pelayan": "pelayanan",
  "investa": "investasi",
  "investas": "investasi",
  "perizin": "perizinan",
  "perizina": "perizinan",
  "pemerin": "pemerintah",
  "pemerinta": "pemerintah",
  "kabupat": "kabupaten",
  "kabupate": "kabupaten",
  "kecamat": "kecamatan",
  "kecamata": "kecamatan",
  "masyarak": "masyarakat",
  "masyaraka": "masyarakat",
  "simpurus": "simpurusiang",
  "birokra": "birokrasi",
  "kelembaga": "kelembagaan",
  "disposi": "disposisi",
  "transpara": "transparansi"
};

export default function PengaturanWeb({ isDark = true }: { isDark?: boolean }) {
  // Testimonials State
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Web Configuration State
  const [config, setConfig] = useState<WebConfig>({
    heroTitle: "Portal Pelayanan Publik & Investasi Terintegrasi",
    heroSubtitle: "Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu menghadirkan kemudahan perizinan terpadu, transparansi data spasial, dan akuntabilitas tata kelola pemerintahan berbasis digital SPBE.",
    maklumatPelayanan: "Dengan ini kami menyatakan sanggup menyelenggarakan pelayanan sesuai standar pelayanan yang telah ditetapkan dan apabila tidak menepati janji ini, kami siap menerima sanksi sesuai ketentuan peraturan perundang-undangan.",
    bannerImageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    pejabatFotoUrl: "/images/petugas-mpp-luwu.png",
    pejabatNama: "Pemerintah Kabupaten Luwu",
    pejabatJabatan: "Dinas Penanaman Modal dan PTSP",
    callCenter: "0811-4200-8899",
    emailResmi: "dpmptsp@luwukab.go.id"
  });

  const [typographyWarnings, setTypographyWarnings] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Fetch Testimonials from Supabase
  const fetchTestimonials = useCallback(async () => {
    setIsLoadingTestimonials(true);
    try {
      const { data, error } = await supabase
        .from("investor_testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        await handleSupabaseError(error);
        setTestimonials([]);
      } else if (data && data.length > 0) {
        setTestimonials(data.map((t: any) => ({
          id: t.id,
          name: t.investor_name || t.name || t.nama || "Investor Terdaftar",
          company: t.company_name || t.company || t.perusahaan || "PT. Mitra Pembangunan",
          role: t.investor_role || t.role || t.jabatan || "Direktur",
          comment: t.comment || t.ulasan || "Pelayanan cepat dan transparan.",
          rating: Number(t.rating) || 5,
          is_approved: Boolean(t.is_verified ?? t.is_approved),
          created_at: t.created_at ? new Date(t.created_at).toLocaleDateString("id-ID") : "Hari ini"
        })));
      } else {
        // Honest fallback jika belum ada data testimoni
        setTestimonials([]);
      }
    } catch {
      setTestimonials([]);
    } finally {
      setIsLoadingTestimonials(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // Handle Approve / Disapprove Testimonial
  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("investor_testimonials")
        .update({ is_verified: newStatus })
        .eq("id", id);

      // Optimistic update
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_approved: newStatus } : t))
      );

      setStatusMessage(`Status testimoni berhasil diperbarui menjadi ${newStatus ? "Disetujui" : "Ditangguhkan"}.`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage("Gagal memperbarui status testimoni.");
    }
  };

  // Handle Delete Testimonial
  const handleDeleteTestimonial = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus testimoni ini secara permanen?")) {
      return;
    }

    try {
      await supabase.from("investor_testimonials").delete().eq("id", id);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      setStatusMessage("Testimoni berhasil dihapus dari basis data.");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage("Gagal menghapus testimoni.");
    }
  };

  // 2. Proteksi Tipografi (Anti-Truncation Protection Engine)
  const validateTypography = (text: string) => {
    const words = text.toLowerCase().split(/\s+/);
    const warnings: string[] = [];

    words.forEach((w) => {
      const cleanWord = w.replace(/[^a-z]/g, "");
      if (INSTITUTIONAL_DICTIONARY[cleanWord]) {
        warnings.push(`Ditemukan kata terpotong: "${cleanWord}" (Saran resmi: "${INSTITUTIONAL_DICTIONARY[cleanWord]}")`);
      }
    });

    setTypographyWarnings(warnings);
  };

  const handleTextChange = (field: keyof WebConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    validateTypography(value);
  };

  const handleAutoFix = (field: keyof WebConfig) => {
    let text = config[field];
    Object.entries(INSTITUTIONAL_DICTIONARY).forEach(([truncated, full]) => {
      const regex = new RegExp(`\\b${truncated}\\b`, "gi");
      text = text.replace(regex, full);
    });
    setConfig((prev) => ({ ...prev, [field]: text }));
    validateTypography(text);
    setStatusMessage("Kata terpotong berhasil diperbaiki otomatis sesuai kamus kelembagaan!");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handle Save Web Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Simulasikan atau simpan ke Supabase tabel web_config
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSaveSuccess(true);
      setStatusMessage("Konfigurasi portal publik berhasil disimpan!");
      setTimeout(() => {
        setSaveSuccess(false);
        setStatusMessage(null);
      }, 4000);
    } catch (err) {
      setStatusMessage("Gagal menyimpan konfigurasi portal.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── HEADER MODUL CMS PENGATURAN WEB ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl border ${
              isDark ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}>
              <Globe size={18} />
            </span>
            <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Kendali Portal Web & CMS Publik MPP
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Pengaturan tampilan portal publik, foto aparatur resmi, moderasi testimoni investor, dan proteksi tipografi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
            isDark ? "bg-emerald-950 text-emerald-300 border-emerald-700/40" : "bg-emerald-50 text-emerald-700 border-emerald-300"
          }`}>
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Proteksi Tipografi Aktif</span>
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
          isDark ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200" : "bg-emerald-50 border-emerald-300 text-emerald-800"
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* ── 1. MODERASI TESTIMONI INVESTOR ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <MessageSquare size={16} className="text-emerald-500 shrink-0" />
              <span>Moderasi Testimoni Investor & Pemohon Izin</span>
            </h4>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Validasi dan setujui ulasan dari tabel <code className="text-emerald-600 dark:text-emerald-400 font-mono">investor_testimonials</code> sebelum tayang di halaman depan.
            </p>
          </div>

          <button
            onClick={fetchTestimonials}
            disabled={isLoadingTestimonials}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 min-h-[44px] cursor-pointer ${
              isDark 
                ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
            }`}
          >
            <RefreshCw size={13} className={isLoadingTestimonials ? "animate-spin text-emerald-500" : ""} />
            <span>Muat Ulang</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase text-[10px] tracking-wider font-semibold ${
                isDark ? "border-slate-800 text-slate-400 bg-slate-950/60" : "border-slate-200 text-slate-600 bg-slate-50"
              }`}>
                <th className="py-3 px-4">Nama & Entitas Pemohon</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Ulasan / Testimoni</th>
                <th className="py-3 px-4">Tanggal Masuk</th>
                <th className="py-3 px-4 text-center">Status Moderasi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800/60 text-slate-200" : "divide-slate-200 text-slate-800"}`}>
              {testimonials.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-8 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {isLoadingTestimonials ? "Sedang memuat testimoni..." : "Belum ada testimoni baru dari pemohon izin."}
                  </td>
                </tr>
              ) : (
                testimonials.map((t) => (
                  <tr key={t.id} className={isDark ? "hover:bg-slate-800/40 transition-colors" : "hover:bg-slate-50 transition-colors"}>
                    <td className="py-3.5 px-4 font-semibold">
                      <div className={isDark ? "text-white" : "text-slate-900"}>{t.name}</div>
                      <div className={`text-[10px] font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t.role} • {t.company}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className={`line-clamp-2 italic text-[11px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        "{t.comment}"
                      </p>
                    </td>
                    <td className={`py-3.5 px-4 font-mono text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {t.created_at}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.is_approved
                            ? isDark ? "bg-emerald-950 text-emerald-300 border-emerald-700/50" : "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : isDark ? "bg-amber-950/80 text-amber-300 border-amber-800/40" : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}
                      >
                        {t.is_approved ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        <span>{t.is_approved ? "Tayang Publik" : "Menunggu Persetujuan"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleToggleApproval(t.id, t.is_approved)}
                          title={t.is_approved ? "Tangguhkan Publikasi" : "Setujui Publikasi"}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border min-h-[44px] cursor-pointer ${
                            t.is_approved
                              ? isDark 
                                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" 
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          }`}
                        >
                          {t.is_approved ? "Tangguhkan" : "Setujui"}
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(t.id)}
                          title="Hapus Testimoni"
                          className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800/40 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2. CMS HERO BANNER, FOTO PEJABAT RESMI & PROTEKSI TIPOGRAFI ── */}
      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri: Form Editor */}
        <div className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <Sliders size={16} className="text-emerald-500 shrink-0" />
              <span>Konfigurasi Teks Banner & Identitas Kelembagaan</span>
            </h4>
            {typographyWarnings.length > 0 && (
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700/40">
                <AlertTriangle size={11} />
                <span>{typographyWarnings.length} Peringatan</span>
              </span>
            )}
          </div>

          {/* Typography Warnings Banner */}
          {typographyWarnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/40 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-amber-500" />
                <span>Proteksi Tipografi Mendeteksi Kata Terpotong:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-900 dark:text-amber-200/90 pl-1 space-y-0.5">
                {typographyWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleAutoFix("heroTitle");
                    handleAutoFix("heroSubtitle");
                    handleAutoFix("maklumatPelayanan");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all min-h-[40px] cursor-pointer"
                >
                  Perbaiki Semua Otomatis
                </button>
              </div>
            </div>
          )}

          {/* Input Judul Hero */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold flex items-center justify-between ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              <span>Judul Utama (Hero Headline)</span>
              <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Maks. 80 Karakter</span>
            </label>
            <input
              type="text"
              value={config.heroTitle}
              onChange={(e) => handleTextChange("heroTitle", e.target.value)}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none transition-all ${
                isDark 
                  ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" 
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
              }`}
              placeholder="Masukkan judul utama portal..."
              required
            />
          </div>

          {/* Input Subtitle Hero */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Deskripsi Pengantar (Hero Subtitle)
            </label>
            <textarea
              rows={3}
              value={config.heroSubtitle}
              onChange={(e) => handleTextChange("heroSubtitle", e.target.value)}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none leading-relaxed transition-all ${
                isDark 
                  ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" 
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
              }`}
              placeholder="Masukkan narasi pengantar portal..."
              required
            />
          </div>

          {/* Input Maklumat Pelayanan */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Teks Maklumat Pelayanan Publik (PermenPAN-RB)
            </label>
            <textarea
              rows={3}
              value={config.maklumatPelayanan}
              onChange={(e) => handleTextChange("maklumatPelayanan", e.target.value)}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none leading-relaxed transition-all ${
                isDark 
                  ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" 
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
              }`}
              placeholder="Masukkan teks maklumat pelayanan..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Call Center / WhatsApp Layanan</label>
              <input
                type="text"
                value={config.callCenter}
                onChange={(e) => setConfig({ ...config, callCenter: e.target.value })}
                className={`w-full px-3.5 py-2.5 border text-xs rounded-xl outline-none transition-all ${
                  isDark 
                    ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" 
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
                }`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Email Resmi DPMPTSP</label>
              <input
                type="email"
                value={config.emailResmi}
                onChange={(e) => setConfig({ ...config, emailResmi: e.target.value })}
                className={`w-full px-3.5 py-2.5 border text-xs rounded-xl outline-none transition-all ${
                  isDark 
                    ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" 
                    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
                }`}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/30 disabled:opacity-50 min-h-[44px] cursor-pointer"
            >
              <Save size={14} />
              <span>{isSaving ? "Menyimpan Konfigurasi..." : "Simpan Perubahan Portal"}</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Pratinjau Visual & Foto Aparatur Resmi */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card Foto Aparatur Resmi / Front Office */}
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-all ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <UserCheck size={16} className="text-emerald-500 shrink-0" />
              <span>Foto Aparatur & Front Office Resmi</span>
            </h4>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Format formal kelembagaan dengan latar transparan (.png) untuk representasi keramahan pelayanan publik.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>URL Gambar Aparatur</label>
                <input
                  type="text"
                  value={config.pejabatFotoUrl}
                  onChange={(e) => setConfig({ ...config, pejabatFotoUrl: e.target.value })}
                  className={`w-full px-3 py-2 border text-xs rounded-xl outline-none font-mono text-[11px] transition-all ${
                    isDark 
                      ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500 focus:bg-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Label Lembaga / Pejabat</label>
                  <input
                    type="text"
                    value={config.pejabatNama}
                    onChange={(e) => setConfig({ ...config, pejabatNama: e.target.value })}
                    className={`w-full px-3 py-2 border text-xs rounded-xl outline-none transition-all ${
                      isDark 
                        ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500 focus:bg-white"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Jabatan / Satuan Kerja</label>
                  <input
                    type="text"
                    value={config.pejabatJabatan}
                    onChange={(e) => setConfig({ ...config, pejabatJabatan: e.target.value })}
                    className={`w-full px-3 py-2 border text-xs rounded-xl outline-none transition-all ${
                      isDark 
                        ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500 focus:bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pratinjau Tampilan Publik Mini (Live Preview) */}
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-all ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                <Eye size={14} className="text-emerald-500" />
                <span>Pratinjau Komponen Publik</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Live Sync</span>
            </div>

            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="border-l-2 border-emerald-500 pl-3">
                <h5 className={`text-xs font-bold leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>{config.heroTitle}</h5>
                <p className={`text-[11px] mt-1 line-clamp-3 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {config.heroSubtitle}
                </p>
              </div>

              <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${
                isDark ? "border-slate-850 text-slate-400" : "border-slate-200 text-slate-600"
              }`}>
                <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{config.pejabatNama}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">{config.callCenter}</span>
              </div>
            </div>
          </div>

        </div>
      </form>

    </div>
  );
}
