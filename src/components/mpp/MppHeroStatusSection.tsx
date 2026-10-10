import React, { useState, useEffect } from 'react';
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
  officeAddress?: string;
}

export const MppHeroStatusSection: React.FC<MppHeroStatusSectionProps> = ({
  isDark: propIsDark,
  className,
  onOpenMaklumat,
  onNavigateLocation,
  officeAddress
}) => {
  const { t, i18n } = useTranslation();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>(() => {
    if (officeAddress && typeof officeAddress === 'string' && officeAddress.trim()) {
      return officeAddress.trim();
    }
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem("mpp_portal_profile");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed?.mpp_address && typeof parsed.mpp_address === 'string' && parsed.mpp_address.trim()) {
            return parsed.mpp_address.trim();
          }
        }
      } catch (e) {}
    }
    return '';
  });

  useEffect(() => {
    if (officeAddress && typeof officeAddress === 'string' && officeAddress.trim()) {
      setCurrentAddress(officeAddress.trim());
    }
  }, [officeAddress]);

  useEffect(() => {
    const fetchProfileSettings = async () => {
      try {
        const res = await fetch('/api/site-settings?keys=mpp_portal_profile');
        if (res.ok) {
          const list = await res.json();
          const item = Array.isArray(list) ? list.find((i: any) => i.setting_key === 'mpp_portal_profile') : null;
          if (item?.setting_value) {
            const parsed = typeof item.setting_value === 'string' ? JSON.parse(item.setting_value) : item.setting_value;
            if (parsed?.mpp_address && typeof parsed.mpp_address === 'string' && parsed.mpp_address.trim()) {
              setCurrentAddress(parsed.mpp_address.trim());
            }
          }
        }
      } catch (e) {}
    };

    fetchProfileSettings();

    const handleProfileUpdate = (e: any) => {
      const addr = e?.detail?.mpp_address;
      if (addr && typeof addr === 'string' && addr.trim()) {
        setCurrentAddress(addr.trim());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mpp_portal_profile' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.mpp_address && typeof parsed.mpp_address === 'string' && parsed.mpp_address.trim()) {
            setCurrentAddress(parsed.mpp_address.trim());
          }
        } catch (err) {}
      }
    };

    window.addEventListener('mpp_portal_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('mpp_portal_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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
      className={className || "w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24 space-y-5 text-slate-900 dark:text-slate-100 scroll-mt-36 sm:scroll-mt-40"}
    >
      {/* 2. MAIN HERO HEADER & REAL-TIME BADGE */}
      <div className="space-y-2">
        {/* Top Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 rounded-full text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse"></span>
          </span>
          {t("mppPortal.operationalHeatmap.statusHeader", "Status Real-Time MPP Simpurusiang")}
        </div>

        {/* Title (Judul Utama) */}
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          {currentLang === 'en' ? 'Luwu Public Services' : currentLang === 'zh' ? '鲁乌县公共政务服务' : 'Pelayanan Publik Luwu'} <br />
          <span className="text-emerald-600 dark:text-emerald-400">
            {currentLang === 'en' ? 'Open, Transparent & Zero Extortion' : currentLang === 'zh' ? '阳光透明 · 零规费乱收费' : 'Terbuka & Bebas Pungli'}
          </span>
        </h1>

        {/* Subtitle (Font sans-serif halus) */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 font-medium">
          {t(
            "mppPortal.operationalHeatmap.statusDesc",
            "Pusat Pelayanan Terpadu Satu Pintu Kabupaten Luwu. 26 Instansi Terpadu, BUMN & OPD siap melayani perizinan Anda secara ramah, cepat, dan transparan."
          )}
        </p>
      </div>

      {/* 3. UNIFIED OPERATIONAL & STATUS CARD (Gantikan 3 kotak terpisah) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface border border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-black/25 space-y-4 mt-4 backdrop-blur-md">
        {/* Top Row: Operational Status Banner (Beroperasi Aktif) */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-xs">
              <Sun className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                {t("mppPortal.operationalHeatmap.operatingActive", "BEROPERASI AKTIF")}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                {t("mppPortal.operationalHeatmap.operatingDesc", "26 Gerai Buka • Pelayanan Terpadu")}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 bg-white dark:bg-surface text-emerald-700 dark:text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/30 shadow-xs shrink-0">
            {currentLang === 'en' ? 'Open Today' : currentLang === 'zh' ? '今日开放' : 'Buka Hari Ini'}
          </span>
        </div>

        {/* Middle & Bottom Details (Jam & Lokasi Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          {/* Item Jam Operasional */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-white">
                {currentLang === 'en' ? 'Service Hours' : currentLang === 'zh' ? '服务时间' : 'Jam Layanan'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-medium">
                Senin - Kamis: 07:30 - 16:00 WITA<br />
                Jumat: 07:30 - 16:30 WITA
              </p>
            </div>
          </div>

          {/* Item Lokasi Gedung */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10">
            <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-white">
                {currentLang === 'en' ? 'Building Location' : currentLang === 'zh' ? '大楼位置' : 'Lokasi Gedung'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-medium">
                Gedung MPP Simpurusiang<br />
                {currentAddress || 'Jl. Simpurusiang No. 45, Senga, Kec. Belopa, Kab. Luwu, Sulawesi Selatan 91994'}
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
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 dark:shadow-black/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {currentLang === 'en' ? 'Check Charter & SLA' : currentLang === 'zh' ? '查看承诺与 SLA' : 'Cek Maklumat & SLA'}
            </span>
          </button>

          {/* Tombol 2: Petunjuk Arah / Navigasi Lokasi */}
          <button
            type="button"
            onClick={handleNavigateLocation}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 shadow-xs"
          >
            <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              {currentLang === 'en' ? 'Directions' : currentLang === 'zh' ? '获取路线' : 'Petunjuk Arah'}
            </span>
          </button>
        </div>
      </div>

      {/* Modal Dialog Petunjuk Arah & Google Maps */}
      <AnimatePresence>
        {showLocationDialog && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto font-sans"
            onClick={() => setShowLocationDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-surface rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[85dvh] border border-white/10"
            >
              <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-surface/95 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {currentLang === 'en' ? 'Simpurusiang MPP Location' : currentLang === 'zh' ? 'Simpurusiang 政务大厅位置' : 'Lokasi MPP Simpurusiang'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {currentLang === 'en' ? 'Luwu Regency, South Sulawesi' : currentLang === 'zh' ? '南苏拉威西省鲁乌县' : 'Kabupaten Luwu, Sulawesi Selatan'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationDialog(false)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-300">
                <p className="font-semibold text-white">
                  📍 {currentLang === 'en' ? 'Official Address:' : currentLang === 'zh' ? '📍 官方地址:' : '📍 Alamat Resmi:'}
                </p>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/10">
                  <p className="font-medium text-white">
                    {currentLang === 'en' ? 'Simpurusiang Public Service Mall (MPP) Building' : currentLang === 'zh' ? 'Simpurusiang 公共服务大厅 (MPP)' : 'Gedung Mal Pelayanan Publik (MPP) Simpurusiang'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {currentAddress || 'Jl. Simpurusiang No. 45, Senga, Kec. Belopa, Kabupaten Luwu, Sulawesi Selatan 91994'}
                  </p>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-slate-400 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    {currentLang === 'en' 
                      ? 'Spacious motorcycle & car parking, wheelchair ramp access, and air-conditioned waiting lounge available.' 
                      : currentLang === 'zh' 
                      ? '配备大型机动车与摩托车停车场、无障碍轮椅通道及全空调候办大厅。' 
                      : 'Tersedia fasilitas parkir roda 2 & roda 4 luas, ramp kursi roda, dan ruang tunggu ber-AC.'}
                  </span>
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
                    className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border border-white/10"
                  >
                    {currentLang === 'en' ? 'Floor Plan' : currentLang === 'zh' ? '大楼平面图' : 'Denah Gedung'}
                  </button>
                  <button
                    type="button"
                    onClick={openGoogleMaps}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-black/25 flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>{currentLang === 'en' ? 'Google Maps' : currentLang === 'zh' ? '谷歌地图' : 'Buka Google Maps'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MppHeroStatusSection;
