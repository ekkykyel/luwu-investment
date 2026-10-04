import React from 'react';
import { Smartphone, Clock, ShieldCheck, Ticket, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
      className={className || "w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24 space-y-5 text-slate-900 dark:text-slate-100 scroll-mt-28"}
    >
      {/* 2. HERO CARD CONTAINER WITH ACCENT GRADIENT */}
      <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-emerald-200/60 dark:border-emerald-800/50 shadow-md overflow-hidden space-y-5">
        
        {/* Top Badge Indicator */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 text-[11px] font-black uppercase tracking-wider rounded-full">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {t('online_queue.badge', 'Antrean Online Resmi')}
          </span>
        </div>

        {/* 3. TYPOGRAPHY & VISUAL FEATURE GRID */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('online_queue.title', 'Solusi Mudah Mendaftar Antrean MPP Simpurusiang')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed text-justify">
            {t('online_queue.desc', 'Dapatkan nomor antrean secara online sebelum berkunjung untuk pelayanan yang presisi, cepat, dan transparan.')}
          </p>
        </div>

        {/* Key Advantages: 2 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Feature Card 1 */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {t('online_queue.feature1_title', 'Tanpa Antre Manual')}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 text-justify">
                {t('online_queue.feature1_desc', 'Ambil nomor tiket dari rumah dan pantau estimasi waktu panggilan.')}
              </p>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {t('online_queue.feature2_title', 'Kepastian Layanan')}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 text-justify">
                {t('online_queue.feature2_desc', 'Terhubung langsung dengan 21 loket instansi resmi Kabupaten Luwu.')}
              </p>
            </div>
          </div>
        </div>

        {/* 4. ACTIONABLE PRIMARY CTA BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleBooking}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>{t('online_queue.cta_btn', 'Ambil Antrean Online Sekarang ➔').replace('➔', '').trim()}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default OnlineQueueOnboardingSection;
