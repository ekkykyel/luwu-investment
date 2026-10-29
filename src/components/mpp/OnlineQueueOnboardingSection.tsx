import React from 'react';
import { Clock, ShieldCheck, Ticket, ArrowRight, QrCode, Building2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';

export interface OnlineQueueOnboardingSectionProps {
  isDark?: boolean;
  className?: string;
  onOpenBooking?: () => void;
  agencyCount?: number;
}

export const OnlineQueueOnboardingSection: React.FC<OnlineQueueOnboardingSectionProps> = ({
  className,
  onOpenBooking,
  agencyCount = 20,
}) => {
  const { t } = useTranslation();

  const handleBooking = () => {
    if (onOpenBooking) {
      onOpenBooking();
      return;
    }
    const btn = document.getElementById('trigger-antrean-modal') as HTMLElement;
    if (btn) {
      btn.click();
    }
  };

  return (
    <section 
      id="antrean-online" 
      className={className || "w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 space-y-5 text-slate-900 dark:text-slate-100 scroll-mt-36 sm:scroll-mt-40"}
    >
      {/* ARCHITECTURAL DIGITAL BOARDING-PASS CONTAINER — Aligned max-w-7xl */}
      <div className={`relative ${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.default} overflow-hidden`}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A24B]/75 to-transparent" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT COLUMN: Header, Features, and Booking CTA */}
          <div className="lg:col-span-7 space-y-5">
            {/* Sulapa Eppa Eyebrow Indicator */}
            <div className="flex justify-start">
              <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-flex items-center gap-2`}>
                <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B]" />
                <span>{t('online_queue.badge', 'Antrean Online Resmi')}</span>
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

            {/* Key Advantages: 2 Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className={`${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusSub} bg-[#FAF8F3] dark:bg-[#132E48] border border-[#E5DFD3] dark:border-white/[0.08] flex items-start gap-3.5`}>
                <div className="p-2.5 rounded-xl bg-[#0F6B4F]/10 text-[#0F6B4F] dark:text-emerald-400 shrink-0">
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

              <div className={`${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusSub} bg-[#FAF8F3] dark:bg-[#132E48] border border-[#E5DFD3] dark:border-white/[0.08] flex items-start gap-3.5`}>
                <div className="p-2.5 rounded-xl bg-[#C9A24B]/15 text-[#855A14] dark:text-[#E2C475] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 font-sans">
                    {t('online_queue.feature2_title', 'Kepastian Layanan')}
                  </h4>
                  <p className={`${MPP_TYPOGRAPHY.cardBody} mt-0.5`}>
                    Terhubung langsung dengan {agencyCount} gerai instansi resmi di MPP Kabupaten Luwu.
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONABLE PRIMARY CTA BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleBooking}
                className="w-full sm:w-auto min-w-[260px] min-h-[48px] py-3.5 px-6 bg-[#0F6B4F] hover:bg-[#0B543E] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>{t('online_queue.cta_btn', 'Ambil Antrean Online Sekarang').replace('➔', '').trim()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Modern Architectural E-Ticket Pass (Clean & Elevated in Light & Dark Mode) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-[#DFD6C5] dark:border-[#C9A24B]/30 bg-white dark:bg-[#091C2E] shadow-[0_18px_42px_-16px_rgba(15,40,30,0.16)] dark:shadow-[0_22px_48px_-14px_rgba(0,0,0,0.65)]">
              
              {/* Top Royal Zamrud Ticket Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-[#0C5A41] to-[#0F6B4F] dark:from-[#0C2D48] dark:to-[#123E5E] text-white flex items-center justify-between border-b border-white/15">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#E2C475]" />
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#F5DFA0]">
                      {t("mppPortal.antrean.mockup.mppTitle", "MPP SIMPURUSIANG")}
                    </div>
                    <div className="text-xs font-semibold text-white/95">
                      {t("mppPortal.motto.magatti", "E-Tiket Pelayanan Terpadu")}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E2C475]" />
                  <span>Resmi</span>
                </span>
              </div>

              {/* Ticket Body with Perforated Divider */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Contoh Format Nomor Tiket
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white mt-0.5">
                      MPP-001
                    </div>
                    <div className="text-xs font-medium text-[#0F6B4F] dark:text-emerald-400 mt-1">
                      {t("mppPortal.antrean.mockup.counterName", "Gerai Pelayanan Terpadu · Lantai 1")}
                    </div>
                  </div>

                  {/* Clean QR Verification Box */}
                  <div className="p-2.5 rounded-xl bg-[#FAF8F3] dark:bg-white border border-[#E5DFD3] shrink-0 flex flex-col items-center">
                    <QrCode className="w-14 h-14 text-slate-900" />
                  </div>
                </div>

                {/* Perforated Boarding-Pass Hairline */}
                <div className="border-t border-dashed border-[#D8D0C0] dark:border-white/15 pt-3.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Zona Waktu Layanan</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">08.00 – 15.30 WITA</span>
                </div>

                <button
                  type="button"
                  onClick={handleBooking}
                  className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-[#FAF8F3] hover:bg-[#0F6B4F] dark:bg-[#132E48] dark:hover:bg-emerald-600 text-[#0F6B4F] hover:text-white dark:text-emerald-300 dark:hover:text-white border border-[#DFD6C5] dark:border-white/10 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{t("mppPortal.antrean.mockup.takeNumber", "Daftar Nomor Tiket Sekarang")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default OnlineQueueOnboardingSection;
