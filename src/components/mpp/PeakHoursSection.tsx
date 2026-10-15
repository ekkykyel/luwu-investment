import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Clock, Lightbulb, Info } from 'lucide-react';
import { CrowdStatusBadge, CrowdStatusType } from './CrowdStatusBadge';

export { CrowdStatusBadge };
export type { CrowdStatusType };

export interface HourlyItem {
  time: string;
  density: 'rendah' | 'sedang' | 'tinggi' | 'istirahat';
  percentage: number;
  status: string;
  statusType: CrowdStatusType;
}

export interface PeakHoursSectionProps {
  className?: string;
  isDark?: boolean;
}

/**
 * PeakHoursSection Component
 * Peta Jam Ramai vs Sepi Kunjungan with Semantic SVG Crowd Density Badges.
 */
export const PeakHoursSection: React.FC<PeakHoursSectionProps> = ({ 
  className = '',
  isDark = false 
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // Data Jam Kepadatan Operasional MPP Simpurusiang
  const hourlyData: HourlyItem[] = [
    { time: '08:00', density: 'rendah', percentage: 25, status: t('radar.status_smooth', 'Sepi (Lancar)'), statusType: 'sepi' },
    { time: '09:00', density: 'sedang', percentage: 55, status: t('radar.status_moderate', 'Sedang'), statusType: 'sedang' },
    { time: '10:00', density: 'tinggi', percentage: 90, status: t('radar.status_peak', 'Puncak Ramai'), statusType: 'puncak' },
    { time: '11:00', density: 'tinggi', percentage: 85, status: t('radar.status_busy', 'Ramai'), statusType: 'ramai' },
    { time: '12:00', density: 'istirahat', percentage: 0, status: t('radar.status_closed_break', 'Jam Istirahat (Tutup)'), statusType: 'istirahat' },
    { time: '13:00', density: 'sedang', percentage: 60, status: t('radar.status_moderate', 'Sedang'), statusType: 'sedang' },
    { time: '14:00', density: 'sedang', percentage: 45, status: t('radar.status_moderate', 'Sedang'), statusType: 'sedang' },
    { time: '15:00', density: 'rendah', percentage: 20, status: t('radar.status_smooth', 'Sepi (Lancar)'), statusType: 'sepi' },
  ];

  return (
    <section 
      id="jam-ramai"
      className={className || "w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24 space-y-5 text-slate-900 dark:text-slate-100 scroll-mt-36 sm:scroll-mt-40"}
    >
      {/* 1. Header Title & Subtitle */}
      <div className="space-y-1.5 text-left">
        <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2.5 text-slate-900 dark:text-white font-sans">
          <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t('radar.title', 'Peta Jam Ramai vs Sepi Kunjungan')}</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          {t(
            "mppPortal.operationalHeatmap.mapSubtitle", 
            "Pilihlah jam berkunjung di rentang hijau/sepi agar transaksi perizinan dan dokumen Anda selesai lebih nyaman tanpa antre."
          )}
        </p>
      </div>

      {/* 2. Smart Recommendation Banner (Callout Box) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs sm:text-sm shadow-xs text-left">
        <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-slate-800 dark:text-slate-200 leading-relaxed">
          <strong className="font-extrabold text-slate-900 dark:text-emerald-300">
            {t('radar.recom_title', 'Rekomendasi Waktu Berkunjung')}:
          </strong>{' '}
          {t(
            'radar.recom_text',
            'Waktu terbaik untuk pelayanan cepat tanpa antrean adalah pukul 08:00–09:00 atau 14:00–15:00. Puncak keramaian terjadi pukul 10:00–11:30.'
          )}
        </div>
      </div>

      {/* 3. Legenda Status Berbasis SVG Semantic Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
          <CrowdStatusBadge status="sepi" label={t('radar.legend_low', 'Sepi (< 30%)')} />
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
          <CrowdStatusBadge status="sedang" label={t('radar.legend_moderate', 'Sedang (30% - 70%)')} />
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
          <CrowdStatusBadge status="ramai" label={t('radar.legend_busy', 'Ramai (> 70%)')} />
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
          <CrowdStatusBadge status="istirahat" label={t('radar.legend_break', 'Istirahat')} />
        </div>
      </div>

      {/* 4. Hourly Card Grid with Semantic SVG Badges & Flexbox Alignment */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {hourlyData.map((item, idx) => {
          const isBreak = item.statusType === 'istirahat';
          const isQuiet = item.statusType === 'sepi';
          const isMedium = item.statusType === 'sedang';

          // Kasus Khusus Jam Istirahat (12:00)
          if (isBreak) {
            return (
              <motion.div
                key={item.time}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 0.75, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-2 relative overflow-hidden transition-all select-none text-left"
              >
                {/* Header Kartu (Jam & Status Tutup) */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{item.time}</span>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('radar.status_closed_badge', 'TUTUP')}
                  </span>
                </div>

                {/* Progress bar netral bernilai 0% */}
                <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden my-1">
                  <div className="w-0 h-full" />
                </div>

                {/* Semantic SVG Status Row */}
                <CrowdStatusBadge 
                  status="istirahat" 
                  label={item.status} 
                />
              </motion.div>
            );
          }

          // Item Jam Reguler
          const barColor = isQuiet
            ? 'bg-emerald-500'
            : isMedium
              ? 'bg-amber-500'
              : 'bg-rose-500';

          const textColor = isQuiet
            ? 'text-emerald-600 dark:text-emerald-400'
            : isMedium
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-rose-600 dark:text-rose-400';

          return (
            <motion.div
              key={item.time}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2 relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md text-left"
            >
              {/* Header Kartu (Jam & Persentase Kepadatan) */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-900 dark:text-white font-extrabold">{item.time}</span>
                <span className={`text-xs sm:text-sm font-black font-mono ${textColor}`}>
                  {item.percentage}%
                </span>
              </div>

              {/* Progress Bar Track & Fill Dinamis with GPU scaleX */}
              <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden my-1">
                <motion.div 
                  initial={shouldReduceMotion ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 + idx * 0.04, ease: "easeOut" }}
                  style={{
                    transformOrigin: 'left',
                    width: `${item.percentage}%`,
                    willChange: 'transform'
                  }}
                  className={`h-full rounded-full origin-left ${barColor}`}
                />
              </div>

              {/* Semantic SVG Status Row with Flexbox Alignment */}
              <CrowdStatusBadge 
                status={item.statusType} 
                label={item.status} 
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PeakHoursSection;
