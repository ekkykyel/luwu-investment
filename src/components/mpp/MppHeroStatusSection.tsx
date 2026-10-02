import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Sun, Clock, MapPin, FileText, Navigation, 
  CheckCircle2, ExternalLink, ShieldCheck, X
} from 'lucide-react';

export interface MppHeroStatusSectionProps {
  isDark?: boolean;
  className?: string;
  onOpenMaklumat?: () => void;
  onNavigateLocation?: () => void;
}

export const MppHeroStatusSection: React.FC<MppHeroStatusSectionProps> = ({
  isDark: propIsDark,
  className,
  onOpenMaklumat,
  onNavigateLocation
}) => {
  const { t, i18n } = useTranslation();
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // Check dark mode
  const isDark = propIsDark ?? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const currentLang = i18n.language || 'id';

  const handleOpenMaklumat = () => {
    if (onOpenMaklumat) {
      onOpenMaklumat();
      return;
    }
    // Smooth scroll to maklumat or SLA calculator
    const el = document.getElementById('maklumat-pelayanan') || 
               document.getElementById('sla-calculator') || 
               document.getElementById('operasional-heatmap');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavigateLocation = () => {
    if (onNavigateLocation) {
      onNavigateLocation();
      return;
    }
    setShowLocationDialog(true);
  };

  const openGoogleMaps = () => {
    window.open('https://www.google.com/maps/search/?api=1&query=Gedung+MPP+Simpurusiang+Kabupaten+Luwu+Belopa', '_blank', 'noopener,noreferrer');
  };

  return (
    <section 
      id="mpp-hero-status"
      className={className || "w-full max-w-xl mx-auto px-4 pt-8 pb-28 space-y-5 text-slate-900 dark:text-slate-100 scroll-mt-28"}
    >
      {/* 2. MAIN HERO HEADER & REAL-TIME BADGE */}
      <div className="space-y-2">
        {/* Top Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {t("mppPortal.operationalHeatmap.statusHeader", "Status Real-Time MPP Simpurusiang")}
        </div>

        {/* Title (Judul Utama) */}
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Pelayanan Publik Luwu <br />
          <span className="text-emerald-600 dark:text-emerald-400">Terbuka & Bebas Pungli</span>
        </h1>

        {/* Subtitle (Font sans-serif halus) */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
          {t(
            "mppPortal.operationalHeatmap.statusDesc",
            "Pusat Pelayanan Terpadu Satu Pintu Kabupaten Luwu. 21 Instansi Vertikal & OPD siap melayani perizinan Anda secara ramah, cepat, dan transparan."
          )}
        </p>
      </div>

      {/* 3. UNIFIED OPERATIONAL & STATUS CARD (Gantikan 3 kotak terpisah) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 mt-4">
        {/* Top Row: Operational Status Banner (Beroperasi Aktif) */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-xs">
              <Sun className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">
                {t("mppPortal.operationalHeatmap.operatingActive", "BEROPERASI AKTIF")}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {t("mppPortal.operationalHeatmap.operatingDesc", "21 Loket Buka • 12 Operator Duty")}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0">
            {currentLang === 'en' ? 'Open Today' : currentLang === 'zh' ? '今日开放' : 'Buka Hari Ini'}
          </span>
        </div>

        {/* Middle & Bottom Details (Jam & Lokasi Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          {/* Item Jam Operasional (Tanpa font monospace kaku) */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {currentLang === 'en' ? 'Service Hours' : currentLang === 'zh' ? '服务时间' : 'Jam Layanan'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Senin - Kamis: 07:30 - 16:00 WITA<br />
                Jumat: 07:30 - 16:30 WITA
              </p>
            </div>
          </div>

          {/* Item Lokasi Gedung */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {currentLang === 'en' ? 'Building Location' : currentLang === 'zh' ? '大楼位置' : 'Lokasi Gedung'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Gedung MPP Simpurusiang<br />
                Jl. Jendral Sudirman No. 1, Belopa
              </p>
            </div>
          </div>
        </div>

        {/* 4. QUICK ACCESS ACTION SHORTCUTS */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Tombol 1: Cek Maklumat Layanan / Standar SLA */}
          <button
            type="button"
            onClick={handleOpenMaklumat}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">Cek Maklumat & SLA</span>
          </button>

          {/* Tombol 2: Petunjuk Arah / Navigasi Lokasi */}
          <button
            type="button"
            onClick={handleNavigateLocation}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
          >
            <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Petunjuk Arah</span>
          </button>
        </div>
      </div>

      {/* Modal Dialog Petunjuk Arah & Google Maps */}
      <AnimatePresence>
        {showLocationDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lokasi MPP Simpurusiang</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Kabupaten Luwu, Sulawesi Selatan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationDialog(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">
                  📍 Alamat Resmi:
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-white">Gedung Mal Pelayanan Publik (MPP) Simpurusiang</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Jl. Jendral Sudirman No. 1, Senga, Kec. Belopa, Kabupaten Luwu, Sulawesi Selatan 91994
                  </p>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Tersedia fasilitas parkir roda 2 & roda 4 luas, ramp kursi roda, dan ruang tunggu ber-AC.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationDialog(false);
                    const el = document.getElementById('interactive-floorplan') || document.getElementById('denah-gedung');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                >
                  Denah Gedung
                </button>
                <button
                  type="button"
                  onClick={openGoogleMaps}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>Buka Google Maps</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MppHeroStatusSection;
