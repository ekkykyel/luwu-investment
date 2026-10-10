import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Briefcase, CheckCircle2, ArrowRight, MessageCircle, 
  Layers, X, Building2, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';

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

  useEffect(() => {
    if (isBookingModalOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsBookingModalOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isBookingModalOpen]);

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
      className={className || "w-full max-w-7xl mx-auto px-0 py-0 space-y-5 sm:space-y-6 text-slate-900 dark:text-slate-100 scroll-mt-36 sm:scroll-mt-40"}
    >
      {/* 1. Standardized Section Header (Zero-Pill Eyebrow) */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-1">
          <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-flex items-center gap-1.5`}>
            <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {t('vipInvestor.fastTrackBadge', 'EKSEKUTIF DESK FASILITASI INVESTASI')}
          </span>
        </div>
        <h2 className={`${MPP_TYPOGRAPHY.sectionTitle} text-center`}>
          {isEn ? "Executive Desk " : isZh ? "高管特设通道 " : "Eksekutif Desk "}
          <span className="text-emerald-700 dark:text-emerald-400">
            {isEn ? "Investment Facilitation" : isZh ? "投资与促进" : "Penanaman Modal"}
          </span>
        </h2>
        <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto text-center px-2`}>
          {t('vipInvestor.subtitle', 'Layanan pendampingan satu pintu di Ruang Eksekutif Lantai 2 Gedung MPP Simpurusiang untuk investor penanaman modal dalam negeri (PMDN) dan asing (PMA). Dapatkan asistensi regulasi satu pintu, validasi tata ruang spasial, serta insentif fiskal daerah langsung dengan Kepala Dinas dan Tim Teknis DPMPTSP.')}
        </p>
      </div>

      {/* 2. Executive Card Container — Standardized Main Card (rounded-2xl, p-5 sm:p-6, Layer 1 #0F2D4A) */}
      <div className={`w-full relative ${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingLg} transition-colors duration-300 overflow-hidden space-y-4 sm:space-y-5 h-full flex flex-col justify-between font-sans`}>
        {/* Header Badge Group */}
        <div className="flex items-center justify-between gap-2 flex-wrap font-sans">
          <Badge variant="category" tone="neutral" icon={<Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}>
            {isEn ? "DPMPTSP Executive Support" : isZh ? "投资局高管特别服务" : "Fasilitasi Eksekutif DPMPTSP"}
          </Badge>
          <Badge variant="status" tone="success" pulse>
            {isEn ? "Personal Liaison Officer Assistance" : isZh ? "专属投资联络官协助服务" : "Pendampingan Personal Liaison Officer"}
          </Badge>
        </div>

        {/* 3. Typography & Highlight Features */}
        <div className="space-y-2 font-sans">
          <h3 className={MPP_TYPOGRAPHY.cardTitle}>
            <span className="text-slate-900 dark:text-slate-50 font-extrabold">{isEn ? "Priority " : isZh ? "优先 " : "Fasilitasi Prioritas "}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
              {isEn ? "Business Licensing" : isZh ? "商业许可便利化" : "Perizinan Berusaha"}
            </span>
          </h3>

          {/* Highlight Features */}
          <ul className={`space-y-3 ${MPP_TYPOGRAPHY.cardBody} border-y border-slate-200/80 dark:border-white/[0.07] py-4 my-2 font-sans`}>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                {isEn ? "Integrated one-stop concierge service at Floor 2 Executive Room, Simpurusiang MPP Building (PMDN & PMA)." : isZh ? "位于 Simpurusiang 政务服务大楼 2 楼行政高管专室的一站式礼宾协助服务（适用于内外资）。" : "Layanan pendampingan terpadu satu pintu di Ruang Eksekutif Lantai 2 Gedung MPP Simpurusiang (PMDN & PMA)."}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                {t('vipInvestor.pillar1Desc', 'Pengecekan instan zonasi peruntukan ruang berbasis Peta GIS RTRW Kabupaten Luwu.')}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                {t('vipInvestor.pillar2Desc', 'Pendampingan insentif pembebasan/keringanan pajak daerah dan kemudahan izin usaha.')}
              </span>
            </li>
          </ul>
        </div>

        {/* 4. Button Action Hierarchy (Primary vs Secondary) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-sans">
          {/* Primary Button */}
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer font-sans"
          >
            <span>{t('vipInvestor.bookVipBtn', 'Jadwalkan Konsultasi Eksekutif')}</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>

          {/* Secondary Button */}
          <a
            href="https://wa.me/6281234567890?text=Halo%20Tim%20Fasilitasi%20Investasi%20MPP%20Luwu,%20saya%20ingin%20konsultasi%20penanaman%20modal"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 px-5 bg-slate-100 dark:bg-[#143755] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.07] font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-sans"
          >
            <MessageCircle className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('vipInvestor.contactWhatsapp', 'Hubungi Fasilitasi WhatsApp')}</span>
          </a>
        </div>

        {/* 5. Sub-Card Fitur (KKPR Spasial) — Standardized Small Card (p-4, rounded-2xl, Layer 2 #143755) */}
        <div className={`${MPP_CARD_SURFACE.layer2} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingSm} mt-2 font-sans space-y-2`}>
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-50 font-bold text-sm">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">{t('vipInvestor.pillar1Title', 'Kesesuaian Tata Ruang (PKKPR Spasial)')}</span>
          </div>
          <p className={MPP_TYPOGRAPHY.cardBody}>
            {isEn 
              ? "Instant spatial land-use zoning verification based on Luwu Regency Spatial GIS Map for accelerated NIB & PBG approval." 
              : isZh 
              ? "基于鲁乌县 GIS 空间地图的用地规划与分区实时速查，极大缩短企业 NIB 执照与建筑许可审批周期。" 
              : "Pengecekan instan zonasi peruntukan ruang berbasis Peta GIS RTRW dan RDTR Kabupaten Luwu untuk percepatan penerbitan NIB & PBG."}
          </p>
          <button
            type="button"
            onClick={() => navigate('/peta-spasial')}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer font-sans text-xs sm:text-sm pt-1"
          >
            <span>{t('vipInvestor.pillar1Action', 'Buka Peta Spasial GIS')} &rarr;</span>
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-surface/60 backdrop-blur-sm overflow-y-auto font-sans"
            onClick={() => setIsBookingModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[85dvh]"
            >
              {/* Sticky Header with Close Button */}
              <div className="shrink-0 flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-surface/95 backdrop-blur-md">
                <div className="space-y-1 pr-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
                    EKSEKUTIF DESK FASILITASI INVESTASI
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans leading-tight">
                    Formulir Konsultasi Fasilitasi Investasi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Jadwalkan konsultasi prioritas tatap muka dengan Tim Teknis & Kepala Dinas DPMPTSP Kab. Luwu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer shrink-0"
                  aria-label="Tutup formulir"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-4">
                {bookingSubmitted ? (
                  <div className="p-6 text-center space-y-3 my-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 font-sans">
                      Permohonan Konsultasi Berhasil Terkirim!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Tim Fasilitasi Investasi DPMPTSP Luwu akan menghubungi Anda melalui WhatsApp/Email dalam 1x24 jam kerja untuk konfirmasi jadwal.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all duration-200"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all duration-200"
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all duration-200"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Pertanian & Perkebunan Kakao/Kopi">Pertanian & Perkebunan Kakao/Kopi</option>
                        <option value="Energi Terbarukan (PLTA/PLTMH)">Energi Terbarukan (PLTA/PLTMH)</option>
                        <option value="Perikanan & Kelautan">Perikanan & Kelautan</option>
                        <option value="Pariwisata & Perhotelan">Pariwisata & Perhotelan</option>
                        <option value="Pertambangan & Olahan Mineral">Pertambangan & Olahan Mineral</option>
                        <option value="Properti & Infrastruktur">Properti & Infrastruktur</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Pilih Tanggal Pertemuan
                        </label>
                        <input 
                          type="date"
                          required
                          value={bookingData.preferredDate}
                          onChange={(e) => setBookingData(p => ({ ...p, preferredDate: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Pilih Jam Konsultasi
                        </label>
                        <select
                          value={bookingData.preferredTime}
                          onChange={(e) => setBookingData(p => ({ ...p, preferredTime: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer mt-2"
                    >
                      Kirim Permohonan Konsultasi Eksekutif
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default VipInvestorSection;
