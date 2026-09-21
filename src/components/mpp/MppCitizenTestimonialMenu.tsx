import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Star, MessageSquare, Send, CheckCircle2, 
  Sparkles, User, Building2, Eye, ShieldCheck, HeartHandshake,
  Clock, ThumbsUp, RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { submitMppTestimonial, getMppTestimonials, MppTestimonial } from '../../services/mppFeedbackService';

interface MppCitizenTestimonialMenuProps {
  userType?: 'masyarakat' | 'investor';
  defaultName?: string;
  defaultCompany?: string;
  defaultAgency?: string;
  isDarkMode?: boolean;
  onSubmitted?: (testimonial: MppTestimonial) => void;
}

const COMMON_SERVICES = [
  "Disdukcapil - Cetak KTP-el & Kartu Keluarga",
  "Dinas PUPTR - Persetujuan Bangunan Gedung (PBG)",
  "DPMPTSP - Penerbitan NIB & Izin Berusaha OSS",
  "BPN / ATR - Balik Nama Sertifikat & SKPT",
  "BPJS Kesehatan - Pendaftaran & Cetak Kartu",
  "Bapenda - Pembayaran PBB-P2 & Konsultasi Pajak",
  "SAMSAT Belopa - Pajak Kendaraan & Pengesahan STNK",
  "Bank Sulselbar - Layanan Kas & Pembayaran Retribusi",
  "Konsultasi Investasi & Tata Ruang Luwu"
];

// Helper to sanitize name (never show admin names for citizen / investor)
const sanitizeTestimonialName = (raw?: string, userType: 'masyarakat' | 'investor' = 'masyarakat') => {
  if (!raw) return '';
  const isAdmin = /admin|dinas|puptr|pertanian|lp2b|dalak|promosi|oss|mpp|bidang|superadmin|operator|administrator/i.test(raw);
  if (isAdmin) {
    return userType === 'investor' ? 'Investor Luwu' : 'Masyarakat Luwu';
  }
  return raw;
};

export const MppCitizenTestimonialMenu: React.FC<MppCitizenTestimonialMenuProps> = ({
  userType = 'masyarakat',
  defaultName = '',
  defaultCompany = '',
  defaultAgency = COMMON_SERVICES[0],
  isDarkMode = false,
  onSubmitted
}) => {
  const initialCleanName = sanitizeTestimonialName(defaultName, userType) || (userType === 'investor' ? 'Investor Terdaftar' : 'Masyarakat Luwu');
  const [nama, setNama] = useState(initialCleanName);
  const [perusahaan, setPerusahaan] = useState(defaultCompany);
  const [layanan, setLayanan] = useState(defaultAgency);
  const [customLayanan, setCustomLayanan] = useState('');
  const [teks, setTeks] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [statusLabel, setStatusLabel] = useState('Sangat Puas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentTestimonials, setRecentTestimonials] = useState<MppTestimonial[]>([]);

  // Sync props when user auth or citizen profile loads asynchronously
  useEffect(() => {
    if (defaultName) {
      const clean = sanitizeTestimonialName(defaultName, userType);
      if (clean && !['masyarakat', 'investor', 'warga'].includes(clean.toLowerCase())) {
        setNama(clean);
      }
    }
  }, [defaultName, userType]);

  useEffect(() => {
    if (defaultCompany) {
      setPerusahaan(defaultCompany);
    }
  }, [defaultCompany]);

  const loadRecent = async () => {
    try {
      const all = await getMppTestimonials();
      setRecentTestimonials(all.slice(0, 4));
    } catch {}
  };

  useEffect(() => {
    loadRecent();
    const handleFeedbackUpdate = () => loadRecent();
    window.addEventListener('mpp_feedback_updated', handleFeedbackUpdate);
    return () => window.removeEventListener('mpp_feedback_updated', handleFeedbackUpdate);
  }, []);

  const activeLayanan = customLayanan.trim() || layanan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teks.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Isi Ulasan Kosong',
        text: 'Mohon tuliskan sepatah dua patah kata ulasan pengalaman Anda.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitMppTestimonial({
        nama: nama.trim() || (userType === 'investor' ? 'Investor Luwu' : 'Masyarakat Luwu'),
        perusahaan: userType === 'investor' ? (perusahaan.trim() || 'Badan Usaha / Investor') : undefined,
        layanan: activeLayanan,
        teks: teks.trim(),
        rating,
        status: statusLabel,
        user_type: userType
      });

      if (onSubmitted) onSubmitted(res.data);
      loadRecent();

      await Swal.fire({
        icon: 'success',
        title: 'Testimoni Berhasil Dikirim!',
        html: `
          <div class="text-left text-xs space-y-2 mt-2">
            <p>Terima kasih, <strong>${res.data.nama}</strong>!</p>
            <p class="text-emerald-600 dark:text-emerald-400 font-bold">Ulasan Anda telah otomatis disinkronkan ke Seksi <strong>TESTIMONI WARGA</strong> di Halaman Portal Utama MPP Simpurusiang.</p>
            <p class="text-slate-500">Masyarakat dan publik kini dapat melihat ulasan pengalaman Anda secara langsung.</p>
          </div>
        `,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Bagus Sekali'
      });

      // Clear form
      setTeks('');
      setCustomLayanan('');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Testimoni',
        text: err?.message || 'Terjadi kesalahan saat menyimpan testimoni.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`rounded-3xl border p-4 sm:p-8 backdrop-blur-md shadow-xl transition-all ${
      isDarkMode ? 'bg-slate-900/70 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Testimoni Pengguna MPP
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {userType === 'investor' ? 'Ulasan Pelaku Usaha & Investor' : 'Ulasan Warga Masyarakat'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            Bagikan Ulasan & Testimoni Pelayanan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Pengalaman Anda sangat berarti bagi peningkatan kualitas layanan MPP Simpurusiang. Testimoni yang Anda kirimkan <strong>otomatis langsung tayang</strong> pada Seksi <strong>TESTIMONI WARGA</strong> di Halaman Depan Portal MPP.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0 font-sans">
          <CheckCircle2 className="w-4 h-4" />
          <span>Sinkronisasi Otomatis ke Portal MPP</span>
        </div>
      </div>

      {/* Main Form & Live Preview Split */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Input Form (lg:col-span-7) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {/* Nama Pengguna */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
              Nama Lengkap Anda
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Muhammad Reski"
              className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {userType === 'investor' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                Nama Perusahaan / Asosiasi Bisnis
              </label>
              <input
                type="text"
                value={perusahaan}
                onChange={(e) => setPerusahaan(e.target.value)}
                placeholder="Contoh: PT. Luwu Agro Sejahtera"
                className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* Instansi & Layanan yang Dialami */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
              Layanan / Loket yang Diulas
            </label>
            <select
              value={layanan}
              onChange={(e) => {
                setLayanan(e.target.value);
                setCustomLayanan('');
              }}
              className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {COMMON_SERVICES.map((srv, idx) => (
                <option key={idx} value={srv}>
                  {srv}
                </option>
              ))}
              <option value="Lainnya">Lainnya (Ketik Manual...)</option>
            </select>

            {layanan === "Lainnya" && (
              <input
                type="text"
                value={customLayanan}
                onChange={(e) => setCustomLayanan(e.target.value)}
                placeholder="Tuliskan nama instansi dan layanan spesifik..."
                className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none mt-2"
              />
            )}
          </div>

          {/* Rating Bintang Interaktif */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                Tingkat Kepuasan (Rating)
              </label>
              <span className="text-xs font-bold text-amber-500 font-mono">
                {rating} dari 5 Bintang
              </span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => {
                        setRating(star);
                        if (star === 5) setStatusLabel('Sangat Puas & Prima');
                        else if (star === 4) setStatusLabel('Puas & Memuaskan');
                        else if (star === 3) setStatusLabel('Cukup Baik');
                        else setStatusLabel('Perlu Peningkatan');
                      }}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2 font-sans">
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Isi Ulasan Testimoni */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
              Isi Testimoni / Cerita Pengalaman Anda
            </label>
            <textarea
              rows={4}
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              placeholder="Ceritakan pengalaman Anda: keramahan petugas, kenyamanan fasilitas, kecepatan waktu proses, atau transparansi layanan tanpa pungutan liar..."
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Tombol Kirim */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[50px] px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold font-sans text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Memproses Publikasi Testimoni...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publikasikan Testimoni ke Portal MPP</span>
              </>
            )}
          </button>
        </form>

        {/* Right Side: Live Card Preview (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-500" />
              Pratinjau Langsung di Portal MPP
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
              Live Preview
            </span>
          </div>

          {/* Card as seen in PortalMPP section: TESTIMONI WARGA */}
          <div className="relative rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center border border-emerald-500/30 bg-slate-900 text-white overflow-hidden group">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Profile Avatar */}
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 mb-3 shadow-inner">
              <User className="w-7 h-7" />
            </div>

            {/* Nama Pemohon */}
            <span className="text-base font-bold text-white uppercase font-sans tracking-wide">
              {nama || 'Nama Anda'}
            </span>

            {/* Perusahaan jika ada */}
            {userType === 'investor' && perusahaan && (
              <span className="text-xs text-slate-400 font-medium block">
                {perusahaan}
              </span>
            )}

            {/* Layanan */}
            <span className="text-xs text-emerald-400 font-semibold mb-2 block mt-1">
              {activeLayanan || 'Pelayanan MPP Simpurusiang'}
            </span>

            {/* Status & Stars */}
            <div className="text-sm font-bold text-white font-sans flex flex-col items-center gap-1">
              <span>{statusLabel}</span>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Teks Ulasan */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic my-4 line-clamp-4">
              "{teks || 'Pengurusan perizinan dan layanan di MPP Simpurusiang sangat cepat, nyaman, dan transparan. Petugas melayani dengan ramah.'}"
            </p>

            {/* Tanggal */}
            <span className="text-[11px] font-semibold text-slate-400 mt-auto pt-2 border-t border-slate-800 w-full">
              Hari Ini • 13 September 2026
            </span>

            {/* Badge Warga / Investor Terverifikasi */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{userType === 'investor' ? 'Investor Terverifikasi' : 'Warga Terverifikasi OTP'}</span>
            </div>
          </div>

          {/* Testimoni Terkini Warga */}
          {recentTestimonials.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                Ulasan Terbaru Lainnya
              </h4>
              <div className="space-y-2">
                {recentTestimonials.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border text-xs ${
                      isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.nama}</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 italic line-clamp-2">
                      "{item.teks}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
