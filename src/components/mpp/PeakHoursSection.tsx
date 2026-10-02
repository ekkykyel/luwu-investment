import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export interface HourlyItem {
  time: string;
  density: 'rendah' | 'sedang' | 'tinggi' | 'istirahat';
  percentage: number;
  status: string;
}

interface PeakHoursSectionProps {
  className?: string;
  isDark?: boolean;
}

export const PeakHoursSection: React.FC<PeakHoursSectionProps> = ({ 
  className 
}) => {
  const { t } = useTranslation();

  // Data Jam Kepadatan Operasional MPP Simpurusiang
  const hourlyData: HourlyItem[] = [
    { time: '08:00', density: 'rendah', percentage: 25, status: 'Sepi (Lancar)' },
    { time: '09:00', density: 'sedang', percentage: 55, status: 'Sedang' },
    { time: '10:00', density: 'tinggi', percentage: 90, status: 'Puncak Ramai' },
    { time: '11:00', density: 'tinggi', percentage: 85, status: 'Ramai' },
    { time: '12:00', density: 'istirahat', percentage: 0, status: 'Jam Istirahat (Tutup)' },
    { time: '13:00', density: 'sedang', percentage: 60, status: 'Sedang' },
    { time: '14:00', density: 'sedang', percentage: 45, status: 'Sedang' },
    { time: '15:00', density: 'rendah', percentage: 20, status: 'Sepi (Lancar)' },
  ];

  return (
    <section 
      id="jam-ramai"
      className={className || "w-full max-w-xl mx-auto px-4 pt-8 pb-6 space-y-5 text-slate-900 dark:text-slate-100 scroll-mt-28"}
    >
      {/* 1. Header Title & Subtitle */}
      <div className="space-y-1.5">
        <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
          <span>🕒</span> Peta Jam Ramai vs Sepi Kunjungan
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          {t(
            "mppPortal.operationalHeatmap.mapSubtitle", 
            "Pilihlah jam berkunjung di rentang hijau/sepi agar transaksi perizinan dan dokumen Anda selesai lebih nyaman tanpa antre."
          )}
        </p>
      </div>

      {/* 2. Smart Recommendation Banner (Callout Box) */}
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs sm:text-sm shadow-xs">
        <span className="text-base select-none shrink-0 leading-none mt-0.5" aria-hidden="true">💡</span>
        <div className="text-slate-800 dark:text-slate-200 leading-relaxed">
          <strong className="font-extrabold text-slate-900 dark:text-emerald-300">Rekomendasi Waktu Berkunjung:</strong>{' '}
          Waktu terbaik untuk pelayanan cepat tanpa antrean adalah pukul{' '}
          <strong className="font-extrabold text-emerald-700 dark:text-emerald-400">08:00–09:00</strong> atau{' '}
          <strong className="font-extrabold text-emerald-700 dark:text-emerald-400">14:00–15:00</strong>.{' '}
          Puncak keramaian terjadi pukul{' '}
          <strong className="font-extrabold text-rose-600 dark:text-rose-400">10:00–11:30</strong>.
        </div>
      </div>

      {/* 3. Legenda Status (Legend Badges) */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold pt-1 pb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          <span>🟢</span>
          <span className="text-emerald-700 dark:text-emerald-400">Sepi (&lt; 30%)</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          <span>🟡</span>
          <span className="text-amber-700 dark:text-amber-400">Sedang (30% - 70%)</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          <span>🔴</span>
          <span className="text-rose-700 dark:text-rose-400">Ramai (&gt; 70%)</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          <span>🔒</span>
          <span className="text-slate-500">Istirahat</span>
        </span>
      </div>

      {/* 4. Hourly Card Grid (Reduced Visual Noise) */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {hourlyData.map((item, idx) => {
          const isBreak = item.time === '12:00' || item.status.includes('Istirahat') || item.density === 'istirahat';
          const isQuiet = item.percentage < 30;
          const isMedium = item.percentage >= 30 && item.percentage <= 70;

          // Kasus Khusus Jam Istirahat (12:00)
          if (isBreak) {
            return (
              <motion.div
                key={item.time}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 0.65, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="p-3.5 rounded-2xl opacity-65 bg-slate-100/80 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2 relative overflow-hidden transition-all select-none"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{item.time}</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tutup</span>
                </div>

                {/* Progress bar netral bernilai 0% */}
                <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden my-1">
                  <div className="w-0 h-full" />
                </div>

                <div className="text-xs font-bold flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span>🔒</span>
                  <span>Jam Istirahat (Tutup)</span>
                </div>
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
            ? 'text-emerald-700 dark:text-emerald-400'
            : isMedium
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-rose-700 dark:text-rose-400';

          const statusIcon = isQuiet ? '🟢' : isMedium ? '🟡' : '🔴';
          const statusLabel = isQuiet
            ? 'Sepi (Lancar)'
            : isMedium
              ? 'Sedang'
              : item.percentage >= 90
                ? 'Puncak Ramai'
                : 'Ramai';

          return (
            <motion.div
              key={item.time}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-2 relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
            >
              {/* Header Kartu (Jam & Persentase) */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-900 dark:text-white font-extrabold">{item.time}</span>
                <span className={`text-xs sm:text-sm font-extrabold ${textColor}`}>
                  {item.percentage}%
                </span>
              </div>

              {/* Progress Bar Track & Fill Dinamis */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden my-1">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 + idx * 0.04, ease: "easeOut" }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>

              {/* Status Text Label */}
              <div className={`text-xs font-bold flex items-center gap-1 ${textColor}`}>
                <span>{statusIcon}</span>
                <span>{statusLabel}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PeakHoursSection;
