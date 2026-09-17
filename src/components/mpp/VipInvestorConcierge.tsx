import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, Sparkles, MapPin, DollarSign, ShieldCheck, 
  Calendar, Clock, User, Phone, Mail, FileText, 
  CheckCircle2, ArrowRight, ExternalLink, MessageCircle, 
  Layers, Compass, TrendingUp, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function VipInvestorConcierge({ isDark = false }: { isDark?: boolean }) {
  const { t } = useTranslation();
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
    }, 2500);
  };

  const vipPillars = [
    {
      title: t("mppPortal.vipInvestor.pillar1Title", "Kesesuaian Tata Ruang (PKKPR Spasial)"),
      desc: t("mppPortal.vipInvestor.pillar1Desc", "Pengecekan instan zonasi peruntukan ruang berbasis Peta GIS RTRW Kabupaten Luwu."),
      icon: Layers,
      actionText: t("mppPortal.vipInvestor.pillar1Action", "Buka Peta Spasial GIS"),
      onAction: () => navigate('/peta-spasial')
    },
    {
      title: t("mppPortal.vipInvestor.pillar2Title", "Fasilitasi Insentif & Tax Allowance"),
      desc: t("mppPortal.vipInvestor.pillar2Desc", "Pendampingan insentif pembebasan/keringanan pajak daerah dan kemudahan izin usaha."),
      icon: DollarSign,
      actionText: t("mppPortal.vipInvestor.pillar2Action", "Konsultasi Insentif"),
      onAction: () => setIsBookingModalOpen(true)
    },
    {
      title: t("mppPortal.vipInvestor.pillar3Title", "Pendampingan End-to-End OSS-RBA"),
      desc: t("mppPortal.vipInvestor.pillar3Desc", "Asistensi personal pemenuhan komitmen izin lingkungan (Amdal/UKL-UPL) & PBG."),
      icon: ShieldCheck,
      actionText: t("mppPortal.vipInvestor.pillar3Action", "Booking VIP Desk"),
      onAction: () => setIsBookingModalOpen(true)
    }
  ];

  return (
    <div className="w-full">
      {/* Banner / Hero VIP Lounge */}
      <div className={`p-4 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border mb-6 relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/30 shadow-2xl' 
          : 'bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 border-emerald-200/80 shadow-xl shadow-emerald-500/5'
      }`}>
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
          <div className="space-y-2.5 sm:space-y-3 text-center lg:text-left max-w-2xl w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-xs font-extrabold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{t("mppPortal.vipInvestor.fastTrackBadge", "EXECUTIVE FAST-TRACK INVESTOR DESK")}</span>
            </div>
            
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium tracking-tight font-sans text-slate-900 dark:text-white leading-snug break-words">
              {t("mppPortal.vipInvestor.title", "VIP Investor Concierge & Fast-Track Service")}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t("mppPortal.vipInvestor.subtitle", "Layanan karpet merah terpadu di Lantai 2 Gedung MPP Simpurusiang untuk investor penanaman modal dalam negeri (PMDN) dan asing (PMA). Dapatkan asistensi regulasi satu pintu, validasi tata ruang spasial, serta insentif fiskal daerah langsung dengan Kepala Dinas dan Tim Teknis DPMPTSP.")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-2 w-full">
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <span>{t("mppPortal.vipInvestor.bookVipBtn", "Booking Konsultasi VIP Desk")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://wa.me/6281234567890?text=Halo%20Tim%20VIP%20Investor%20MPP%20Luwu,%20saya%20ingin%20konsultasi%20penanaman%20modal"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 font-sans"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>{t("mppPortal.vipInvestor.contactWhatsapp", "Hubungi Fast-Track WhatsApp")}</span>
              </a>
            </div>
          </div>

          {/* Pillars Feature Cards */}
          <div className="grid grid-cols-1 gap-3 w-full lg:w-80 shrink-0">
            {vipPillars.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                      {p.title}
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {p.desc}
                  </p>
                  <button
                    type="button"
                    onClick={p.onAction}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                  >
                    <span>{p.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 font-sans">
                  {t("mppPortal.vipInvestor.fastTrackBadge", "EXECUTIVE FAST-TRACK INVESTOR DESK")}
                </span>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white font-sans">
                  {t("mppPortal.vipInvestor.modalTitle", "Formulir Booking VIP Investor Concierge")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("mppPortal.vipInvestor.modalDesc", "Jadwalkan konsultasi prioritas tatap muka dengan Tim Teknis & Kepala Dinas DPMPTSP Kab. Luwu.")}
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
                      {t("mppPortal.vipInvestor.fullName", "Nama Lengkap Investor / Perwakilan")}
                    </label>
                    <input 
                      type="text"
                      required
                      value={bookingData.name}
                      onChange={(e) => setBookingData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        {t("mppPortal.vipInvestor.companyName", "Nama Perusahaan / PT / Investor")}
                      </label>
                      <input 
                        type="text"
                        required
                        value={bookingData.company}
                        onChange={(e) => setBookingData(p => ({ ...p, company: e.target.value }))}
                        placeholder="PT Luwu Cocoa Industry"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        {t("mppPortal.vipInvestor.phone", "Nomor WhatsApp / HP Aktif")}
                      </label>
                      <input 
                        type="tel"
                        required
                        value={bookingData.phone}
                        onChange={(e) => setBookingData(p => ({ ...p, phone: e.target.value }))}
                        placeholder="081234567890"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      {t("mppPortal.vipInvestor.sector", "Sektor Rencana Investasi")}
                    </label>
                    <select
                      value={bookingData.sector}
                      onChange={(e) => setBookingData(p => ({ ...p, sector: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Pertanian & Perkebunan Kakao/Kopi</option>
                      <option>Energi Terbarukan (PLTA/PLTMH)</option>
                      <option>Perikanan & Kelautan</option>
                      <option>Pariwisata & Perhotelan</option>
                      <option>Pertambangan & Olahan Mineral</option>
                      <option>Properti & Infrastruktur</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        {t("mppPortal.vipInvestor.preferredDate", "Pilih Tanggal Pertemuan")}
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
                        {t("mppPortal.vipInvestor.preferredTime", "Pilih Jam Konsultasi")}
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
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer mt-2 font-sans"
                  >
                    {t("mppPortal.vipInvestor.submitBtn", "Kirim Permohonan Konsultasi VIP")}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
