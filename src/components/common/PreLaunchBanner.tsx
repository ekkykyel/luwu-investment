import React from 'react';
import { Database } from 'lucide-react';

interface PreLaunchBannerProps {
  isDark?: boolean;
  dataCount?: number;
  context?: string;
  className?: string;
}

/**
 * Honest State Banner conforming to Zero Dummy Policy
 */
export const PreLaunchBanner: React.FC<PreLaunchBannerProps> = ({
  isDark = true,
  dataCount = 0,
  context = 'invest-luwu',
  className = ''
}) => {
  if (dataCount && dataCount > 0) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-xs font-sans transition-all ${
        isDark
          ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      } ${className}`}
    >
      <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 animate-pulse" />
      <div className="flex-1 leading-snug">
        <span className="font-bold tracking-wide">Live Data Sync: </span>
        <span className="opacity-90">
          {context === 'survey'
            ? 'Hasil survei SKM diperbarui otomatis dari masukan masyarakat di loket MPP.'
            : context === 'invest-luwu'
            ? 'Menghubungkan langsung ke repositori PostGIS & Supabase DPMPTSP Luwu.'
            : 'Terhubung ke server antrean MPP & basis data layanan Kabupaten Luwu.'}
        </span>
      </div>
    </div>
  );
};

export default PreLaunchBanner;
