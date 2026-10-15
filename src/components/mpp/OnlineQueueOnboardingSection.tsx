import React from 'react';
import { Smartphone, Clock, ShieldCheck, Ticket, ArrowRight, QrCode, Signal, Wifi, BatteryMedium } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';

export interface OnlineQueueOnboardingSectionProps {
  isDark?: boolean;
  className?: string;
  onOpenBooking?: () => void;
}

export const OnlineQueueOnboardingSection: React.FC<OnlineQueueOnboardingSectionProps> = ({
  isDark: propIsDark,
  className,
  onOpenBooking
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const isDark = propIsDark ?? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  const handleBooking = () => {
    if (onOpenBooking) {
      onOpenBooking();
      return;
    }
    // Fallback: look for queue booking modal or trigger button
    const btn = document.getElementById('trigger-antrean-modal') as HTMLElement;
    if (btn) {
      btn.click();
    }
  };

  return (
    <section 
      id="antrean-online" 
      className={className || "w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24 space-y-5 text-slate-900 dark:text-slate-100 scroll-mt-36 sm:scroll-mt-40"}
    >
      {/* 2. HERO CARD CONTAINER — Standardized Layer 1 Surface (rounded-2xl, p-5 sm:p-6) */}
      <div className={`relative ${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer1} overflow-hidden space-y-6`}>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT COLUMN: Header, Features, and Booking CTA */}
          <div className="lg:col-span-7 space-y-5">
            {/* Top Eyebrow Indicator (Zero-Pill) */}
            <div className="flex justify-start">
              <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-flex items-center gap-1.5`}>
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {t('online_queue.badge', 'Antrean Online Resmi')}
              </span>
            </div>

            {/* Typography */}
            <div className="space-y-2 text-left">
              <h2 className={MPP_TYPOGRAPHY.sectionTitle}>
                {t('online_queue.title', 'Solusi Mudah Mendaftar Antrean MPP Simpurusiang')}
              </h2>
              <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} text-left`}>
                {t('online_queue.desc', 'Dapatkan nomor antrean secara online sebelum berkunjung untuk pelayanan yang presisi, cepat, dan transparan.')}
              </p>
            </div>

            {/* Key Advantages: 2 Feature Cards — Standardized Small Card (p-4, rounded-2xl, Layer 2 #143755) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Feature Card 1 */}
              <div className={`${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer2} flex items-start gap-3.5`}>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 font-sans">
                    {t('online_queue.feature1_title', 'Tanpa Antre Manual')}
                  </h4>
                  <p className={`${MPP_TYPOGRAPHY.cardBody} mt-0.5`}>
                    {t('online_queue.feature1_desc', 'Ambil nomor tiket dari rumah dan pantau estimasi waktu panggilan.')}
                  </p>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className={`${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer2} flex items-start gap-3.5`}>
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 font-sans">
                    {t('online_queue.feature2_title', 'Kepastian Layanan')}
                  </h4>
                  <p className={`${MPP_TYPOGRAPHY.cardBody} mt-0.5`}>
                    {t('online_queue.feature2_desc', 'Terhubung langsung dengan 21 loket instansi resmi Kabupaten Luwu.')}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONABLE PRIMARY CTA BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleBooking}
                className="w-full sm:w-auto min-w-[280px] py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-black/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>{t('online_queue.cta_btn', 'Ambil Antrean Online Sekarang ➔').replace('➔', '').trim()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: 📱 Mockup HP "Pelayanan Magatti" — Calm Floating Animation (±7px, 5s, ease-in-out) */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [-7, 7, -7] }}
              transition={{
                duration: 5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror"
              }}
              className="relative flex items-center justify-center py-2 sm:py-4 select-none w-full max-w-[290px]"
            >
              {/* Ambient Glow behind Phone */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-blue-500/20 rounded-[48px] blur-2xl pointer-events-none opacity-60 dark:opacity-40" />

              {/* Smartphone Frame (Titanium Style) */}
              <div className="relative w-full rounded-[40px] p-3.5 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[5px] border-slate-700/80 dark:border-slate-700 shadow-2xl shadow-black/25 dark:shadow-black/60 ring-1 ring-white/10">
                
                {/* Dynamic Island / Speaker Pill */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-base rounded-full flex items-center justify-end px-2 z-20 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/60 animate-pulse" />
                </div>

                {/* Phone Screen Display */}
                <div className="relative rounded-[28px] overflow-hidden bg-slate-900 border border-slate-800/80 pt-6 pb-4 px-3.5 space-y-3 font-sans text-white">
                  {/* Top Status Bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                    <span>09:30 WITA</span>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Signal className="w-3 h-3" />
                      <Wifi className="w-3 h-3" />
                      <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>

                  {/* Screen App Bar Header */}
                  <div className="text-center pt-1 pb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono">
                      {t("mppPortal.antrean.mockup.mppTitle", "MPP SIMPURUSIANG")}
                    </span>
                    <div className="text-[11px] font-bold text-slate-200">
                      {t("mppPortal.motto.magatti", "Pelayanan Magatti")}
                    </div>
                  </div>

                  {/* Digital Ticket Card inside Phone */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 space-y-2.5 shadow-lg shadow-black/25">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">
                        {t("mppPortal.antrean.mockup.ticketLabel", "Tiket Antrean Digital")}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {t("mppPortal.antrean.mockup.activeStatus", "AKTIF")}
                      </span>
                    </div>

                    <div className="text-center py-1">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {t("mppPortal.antrean.mockup.counterName", "Loket DPMPTSP")}
                      </div>
                      <div className="text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                        A-042
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-400 mt-1">
                        {t("mppPortal.antrean.mockup.estimation", "Estimasi: 09:30 WITA")}
                      </div>
                    </div>

                    {/* QR Code graphic */}
                    <div className="p-2 rounded-xl bg-white flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-slate-900" />
                    </div>
                  </div>

                  {/* Bottom Phone Action Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleBooking}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{t("mppPortal.antrean.mockup.takeNumber", "Ambil Nomor Online")}</span>
                    </button>
                  </div>

                  {/* Bottom Home Indicator Bar */}
                  <div className="pt-1 flex justify-center">
                    <div className="w-24 h-1 rounded-full bg-slate-700" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default OnlineQueueOnboardingSection;
