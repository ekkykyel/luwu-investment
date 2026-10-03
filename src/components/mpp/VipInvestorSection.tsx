import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Crown, CheckCircle2, ArrowRight, MessageCircle, 
  Layers, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VipInvestorSectionProps {
  className?: string;
  isDark?: boolean;
}

export const VipInvestorSection: React.FC<VipInvestorSectionProps> = ({
  className
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');
  const navigate = useNavigate();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    sector: 'Pertanian & Perkebunan Kakao/Kopi',
    estimatedCapex: 'Rp 5 Miliar - Rp 25 Miliar',
    preferredDate: '',
    preferredTime: '10:00 WITA',
    notes: ''
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitted(true);
    setTimeout(() => {
      setIsBookingModalOpen(false);
      setBookingSubmitted(false);
      setBookingData({
        name: '',
        company: '',
        email: '',
        phone: '',
        sector: 'Pertanian & Perkebunan Kakao/Kopi',
        estimatedCapex: 'Rp 5 Miliar - Rp 25 Miliar',
        preferredDate: '',
        preferredTime: '10:00 WITA',
        notes: ''
      });
    }, 2200);
  };

  return (
    <section 
      id="investor-desk"
      className={className || "w-full max-w-7xl mx-auto px-0 py-6 sm:py-10 space-y-5 sm:space-y-6 text-slate-900 dark:text-slate-100 scroll-mt-28"}
    >
      {/* 1. Standardized Section Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 font-sans inline-flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            Layanan Fast-Track Investor
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans text-center">
          VIP Investor{" "}
          <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Fast-Track Concierge
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-center leading-relaxed px-2">
          Fasilitasi khusus dan pendampingan end-to-end untuk investor, penanaman modal, dan perizinan proyek strategis di Kabupaten Luwu.
        </p>
      </div>

      {/* 2. Executive Card Container - Theme-Adaptive Light & Dark Mode */}
      <div className="w-full relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-none rounded-3xl p-6 sm:p-8 transition-colors duration-300 overflow-hidden space-y-5 sm:space-y-6 h-full flex flex-col justify-between font-sans">
        {/* Subtle Background Accent (Glow/Shimmer) */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge Group */}
        <div className="flex items-center justify-between gap-2 flex-wrap font-sans">
          <span className="px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60 flex items-center gap-1.5 font-sans">
            <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Executive Fast-Track Concierge
          </span>
          <span className="text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60 px-2.5 py-1 rounded-full flex items-center gap-1 font-sans">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Pendampingan Personal DPMPTSP
          </span>
        </div>

        {/* 3. Typography & Highlight Features */}
        <div className="space-y-2 font-sans">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight font-sans">
            <span className="text-slate-900 dark:text-white font-extrabold">VIP Investor </span>
            <span className="text-amber-600 dark:text-amber-400 font-extrabold">
              Karpet Merah Perizinan
            </span>
          </h2>

          {/* Highlight Features */}
          <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium border-y border-slate-200/80 dark:border-slate-800 py-4 my-2 font-sans">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Layanan karpet merah terpadu di Lounge VIP Lantai 2 Gedung MPP Simpurusiang (PMDN & PMA).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Asistensi regulasi satu pintu & validasi kesesuaian tata ruang spasial (KKPR) instan.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Konsultasi insentif fiskal daerah langsung dengan Kepala Dinas & Tim Teknis DPMPTSP Kabupaten Luwu.</span>
            </li>
          </ul>
        </div>

        {/* 4. Button Action Hierarchy (Primary vs Secondary) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-sans">
          {/* Primary Button (Booking VIP Desk) */}
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer font-sans"
          >
            <span>Booking VIP Desk</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>

          {/* Secondary Button (WhatsApp Fast-Track) */}
          <a
            href="https://wa.me/6281234567890?text=Halo%20Tim%20VIP%20Investor%20MPP%20Luwu,%20saya%20ingin%20konsultasi%20penanaman%20modal"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] font-sans"
          >
            <MessageCircle className="w-4.5 h-4.5" />
            <span>WhatsApp Fast-Track Concierge</span>
          </a>
        </div>

        {/* 5. Sub-Card Fitur (KKPR Spasial) */}
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-5 mt-6 font-sans space-y-2">
          <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm">
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-amber-700 dark:text-amber-400 font-bold">Kesesuaian Tata Ruang (PKKPR Spasial)</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
            Pengecekan instan zonasi peruntukan ruang berbasis Peta GIS RTRW dan RDTR Kabupaten Luwu untuk percepatan penerbitan NIB & PBG.
          </p>
          <button
            type="button"
            onClick={() => navigate('/peta-spasial')}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer font-sans text-xs sm:text-sm pt-1"
          >
            <span>Buka Peta Spasial GIS &rarr;</span>
          </button>
        </div>
      </div>

      {/* Booking VIP Desk Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsBookingModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] shadow-2xl space-y-4 relative flex flex-col overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 font-mono">
                  EXECUTIVE FAST-TRACK INVESTOR DESK
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
                  Formulir Booking VIP Investor Concierge
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Jadwalkan konsultasi prioritas tatap muka dengan Tim Teknis & Kepala Dinas DPMPTSP Kab. Luwu.
                </p>
              </div>

              {bookingSubmitted ? (
                <div className="p-6 text-center space-y-3 my-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 font-sans">
                    Permohonan Konsultasi Berhasil Terkirim!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Tim Fast-Track VIP Concierge DPMPTSP Luwu akan menghubungi Anda melalui WhatsApp/Email dalam 1x24 jam kerja untuk konfirmasi jadwal.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Nama Lengkap Investor / Perwakilan
                    </label>
                    <input 
                      type="text"
                      required
                      value={bookingData.name}
                      onChange={(e) => setBookingData(p => ({ ...p, name: e.target.value }))}
                      placeholder={isEn ? "e.g., John Doe" : isZh ? "例如：张伟 / 投资代表" : "Contoh: Budi Santoso"}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Nama Perusahaan / PT
                      </label>
                      <input 
                        type="text"
                        required
                        value={bookingData.company}
                        onChange={(e) => setBookingData(p => ({ ...p, company: e.target.value }))}
                        placeholder={isEn ? "e.g. Luwu Agro Global Ltd" : isZh ? "如：鲁乌农产品实业有限公司" : "PT Luwu Cocoa Industry"}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Nomor WhatsApp Aktif
                      </label>
                      <input 
                        type="tel"
                        required
                        value={bookingData.phone}
                        onChange={(e) => setBookingData(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+62 812-3456-7890"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Sektor Rencana Investasi
                    </label>
                    <select
                      value={bookingData.sector}
                      onChange={(e) => setBookingData(p => ({ ...p, sector: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Pertanian & Perkebunan Kakao/Kopi">Pertanian & Perkebunan Kakao/Kopi</option>
                      <option value="Energi Terbarukan (PLTA/PLTMH)">Energi Terbarukan (PLTA/PLTMH)</option>
                      <option value="Perikanan & Kelautan">Perikanan & Kelautan</option>
                      <option value="Pariwisata & Perhotelan">Pariwisata & Perhotelan</option>
                      <option value="Pertambangan & Olahan Mineral">Pertambangan & Olahan Mineral</option>
                      <option value="Properti & Infrastruktur">Properti & Infrastruktur</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Pilih Tanggal Pertemuan
                      </label>
                      <input 
                        type="date"
                        required
                        value={bookingData.preferredDate}
                        onChange={(e) => setBookingData(p => ({ ...p, preferredDate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Pilih Jam Konsultasi
                      </label>
                      <select
                        value={bookingData.preferredTime}
                        onChange={(e) => setBookingData(p => ({ ...p, preferredTime: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option>09:00 WITA</option>
                        <option>10:00 WITA</option>
                        <option>11:00 WITA</option>
                        <option>14:00 WITA</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer mt-2"
                  >
                    Kirim Permohonan Konsultasi VIP
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default VipInvestorSection;
