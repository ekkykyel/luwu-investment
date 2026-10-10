import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { CountUpNumber } from '../common/CountUpNumber';
import { 
  Star, Award, Users, CheckCircle2, ShieldCheck, 
  Sparkles, HeartHandshake, Zap, BarChart3,
  MessageSquareHeart, Smile, FileCheck, DollarSign
} from 'lucide-react';
import { PreLaunchBanner } from '../common/PreLaunchBanner';
import { Badge } from '../common/Badge';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';

interface SkmIndicator {
  key: string;
  label: string;
  score: number;
}

interface SkmHighlights {
  biaya: number;
  perilaku: number;
  produk: number;
}

interface SkmBentoGridProps {
  skmIndicators: SkmIndicator[];
  averageSkm: string;
  totalRespondents?: number;
  highlights?: SkmHighlights;
  predikat?: string;
  onOpenSurveyModal: () => void;
  isDark?: boolean;
}

export const SkmBentoGrid: React.FC<SkmBentoGridProps> = ({
  skmIndicators,
  averageSkm,
  totalRespondents = 0,
  highlights = { biaya: 0, perilaku: 0, produk: 0 },
  predikat,
  onOpenSurveyModal,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true);
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const hasSurveyData = totalRespondents > 0 && parseFloat(averageSkm) > 0;

  const activePredikat = predikat || (
    !hasSurveyData 
      ? t("mppPortal.skmBento.noSurveyData", "Belum Ada Penilaian") 
      : Number(averageSkm) >= 88.31 
        ? t("mppPortal.skmBento.predikatA", "Predikat A • Sangat Baik")
        : Number(averageSkm) >= 76.61
          ? t("mppPortal.skmBento.predikatB", "Predikat B • Baik")
          : Number(averageSkm) >= 65
            ? t("mppPortal.skmBento.predikatC", "Predikat C • Kurang Baik")
            : t("mppPortal.skmBento.predikatD", "Predikat D • Tidak Baik")
  );

  // Distinct vibrant color palette for the 9 Unsur SKM
  const getIndicatorStyle = (key: string) => {
    switch (key) {
      case 'biaya':
        return {
          icon: <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          bar: 'from-emerald-500 via-teal-400 to-emerald-300',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600',
          borderHover: 'hover:border-emerald-500/50'
        };
      case 'perilaku':
        return {
          icon: <Smile className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
          bar: 'from-teal-500 via-cyan-400 to-teal-300',
          textColor: 'text-teal-700 dark:text-teal-400',
          iconBg: 'bg-teal-500/15 border-teal-500/30 text-teal-600',
          borderHover: 'hover:border-teal-500/50'
        };
      case 'produk':
        return {
          icon: <Award className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
          bar: 'from-sky-500 via-blue-400 to-cyan-300',
          textColor: 'text-sky-700 dark:text-sky-400',
          iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-600',
          borderHover: 'hover:border-sky-500/50'
        };
      case 'persyaratan':
        return {
          icon: <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          bar: 'from-emerald-600 via-green-400 to-teal-300',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600',
          borderHover: 'hover:border-emerald-500/50'
        };
      case 'kompetensi':
        return {
          icon: <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          bar: 'from-blue-600 via-sky-400 to-sky-300',
          textColor: 'text-blue-700 dark:text-blue-400',
          iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-600',
          borderHover: 'hover:border-blue-500/50'
        };
      case 'prosedur':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
          bar: 'from-teal-600 via-teal-400 to-emerald-300',
          textColor: 'text-teal-700 dark:text-teal-400',
          iconBg: 'bg-teal-500/15 border-teal-500/30 text-teal-600',
          borderHover: 'hover:border-teal-500/50'
        };
      case 'sarana':
        return {
          icon: <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
          bar: 'from-sky-500 via-blue-400 to-sky-300',
          textColor: 'text-sky-700 dark:text-sky-400',
          iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-600',
          borderHover: 'hover:border-sky-500/50'
        };
      case 'kecepatan':
        return {
          icon: <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          bar: 'from-emerald-500 via-teal-400 to-emerald-300',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600',
          borderHover: 'hover:border-emerald-500/50'
        };
      case 'pengaduan':
        return {
          icon: <MessageSquareHeart className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
          bar: 'from-teal-500 via-emerald-400 to-teal-300',
          textColor: 'text-teal-700 dark:text-teal-400',
          iconBg: 'bg-teal-500/15 border-teal-500/30 text-teal-600',
          borderHover: 'hover:border-teal-500/50'
        };
      default:
        return {
          icon: <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          bar: 'from-emerald-500 to-teal-400',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600',
          borderHover: 'hover:border-emerald-500/50'
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Reusable Pre-Launch Status Banner */}
      <PreLaunchBanner 
        isDark={isDark} 
        dataCount={totalRespondents} 
        context="survey" 
      />

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* CARD 1: Main Score Hero Bento (MD: 5 cols) — Standardized Card Utama (p-5 sm:p-6, rounded-2xl, Layer 1) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className={`md:col-span-5 ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.layer1} relative overflow-hidden flex flex-col justify-between group transition-all`}
        >
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="category"
                tone="primary"
                icon={<Award className="w-3.5 h-3.5 text-emerald-500" />}
              >
                {t("mppPortal.skmBento.permenpanBadge", "PermenPAN-RB No. 14/2017")}
              </Badge>
              <span className={MPP_TYPOGRAPHY.meta}>{t("mppPortal.skmBento.semester", "Semester Berjalan")}</span>
            </div>

            <div>
              <span className={`${MPP_TYPOGRAPHY.eyebrow} block`}>
                {t("mppPortal.skmBento.ikmLabel", "Indeks Kepuasan Masyarakat (IKM)")}
              </span>
              <div className="flex items-baseline gap-2 sm:gap-3 my-2">
                <span className={`text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text tracking-tight font-['Plus_Jakarta_Sans',sans-serif] tabular-nums ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
                }`}>
                  {hasSurveyData ? (
                    <CountUpNumber end={Number(averageSkm) || 0} decimals={2} duration={1200} />
                  ) : (
                    '—'
                  )}
                </span>
                {hasSurveyData && (
                  <span className={`text-base sm:text-lg font-bold font-sans ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>/ 100</span>
                )}
              </div>
              <Badge
                variant="category"
                tone="primary"
                icon={<Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
              >
                {activePredikat}
              </Badge>
            </div>

            <p className={MPP_TYPOGRAPHY.cardBody}>
              {t("mppPortal.skmBento.measuredFrom", "Diukur dari penilaian langsung masyarakat pemohon layanan di instansi Mal Pelayanan Publik Simpurusiang Kab. Luwu.")}
            </p>
          </div>

          <div className="relative z-10 pt-4 sm:pt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs pt-2 border-t border-slate-200/70 dark:border-white/[0.07] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {t("mppPortal.skmBento.totalRespondents", "Total Responden:")}
              </span>
              <strong className="font-sans text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {totalRespondents > 0 ? (
                  <><CountUpNumber end={totalRespondents} /> Responden</>
                ) : (
                  '0 Responden'
                )}
              </strong>
            </div>

            <button
              type="button"
              onClick={onOpenSurveyModal}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-xl transition-all flex items-center justify-between cursor-pointer font-sans"
            >
              <span>{t("mppPortal.skmBento.fillSurveyBtn", "Isi Survei SKM (Khusus Pemohon)")}</span>
              <ShieldCheck className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </motion.div>

        {/* CARD 2: Top Highlights Bento (MD: 7 cols) — Standardized Card Kecil (p-4, rounded-2xl, Layer 1) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Highlight 1: Biaya Rp 0 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingSm} flex flex-col justify-between space-y-3 group hover:border-emerald-500/40 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl ${MPP_CARD_SURFACE.layer2} flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0`}>
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-sans tabular-nums">
                {hasSurveyData && highlights.biaya > 0 ? `${highlights.biaya}%` : '—'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 font-sans">{t("mppPortal.skmBento.highlight1Title", "Biaya & Tarif")}</h4>
              <p className={`${MPP_TYPOGRAPHY.cardBody} mt-1`}>
                {t("mppPortal.skmBento.highlight1Desc", "Transparansi 100% Bebas Pungli & Sesuai Tarif Resmi.")}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#143755] h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={shouldReduceMotion ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{
                  transformOrigin: 'left',
                  width: hasSurveyData ? `${Math.min(Math.max(highlights.biaya, 0), 100)}%` : '0%',
                  willChange: 'transform'
                }}
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full rounded-full origin-left" 
              />
            </div>
          </motion.div>

          {/* Highlight 2: Perilaku Petugas */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className={`${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingSm} flex flex-col justify-between space-y-3 group hover:border-teal-500/40 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl ${MPP_CARD_SURFACE.layer2} flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0`}>
                <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm font-bold text-teal-700 dark:text-teal-400 font-sans tabular-nums">
                {hasSurveyData && highlights.perilaku > 0 ? `${highlights.perilaku}%` : '—'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 font-sans">{t("mppPortal.skmBento.highlight2Title", "Perilaku Petugas")}</h4>
              <p className={`${MPP_TYPOGRAPHY.cardBody} mt-1`}>
                {t("mppPortal.skmBento.highlight2Desc", "Pelayanan Ramah 5S, Sopan, Santun & Profesional.")}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#143755] h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={shouldReduceMotion ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{
                  transformOrigin: 'left',
                  width: hasSurveyData ? `${Math.min(Math.max(highlights.perilaku, 0), 100)}%` : '0%',
                  willChange: 'transform'
                }}
                className="bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-300 h-full rounded-full origin-left" 
              />
            </div>
          </motion.div>

          {/* Highlight 3: Spesifikasi Produk */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingSm} flex flex-col justify-between space-y-3 group hover:border-sky-500/40 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl ${MPP_CARD_SURFACE.layer2} flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0`}>
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm font-bold text-sky-700 dark:text-sky-400 font-sans tabular-nums">
                {hasSurveyData && highlights.produk > 0 ? `${highlights.produk}%` : '—'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 font-sans">{t("mppPortal.skmBento.highlight3Title", "Produk Layanan")}</h4>
              <p className={`${MPP_TYPOGRAPHY.cardBody} mt-1`}>
                {t("mppPortal.skmBento.highlight3Desc", "Kesesuaian Dokumen & Kepastian Hasil Perizinan.")}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#143755] h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={shouldReduceMotion ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{
                  transformOrigin: 'left',
                  width: hasSurveyData ? `${Math.min(Math.max(highlights.produk, 0), 100)}%` : '0%',
                  willChange: 'transform'
                }}
                className="bg-gradient-to-r from-sky-500 via-blue-400 to-sky-300 h-full rounded-full origin-left" 
              />
            </div>
          </motion.div>
        </div>

        {/* CARD 3: 9 Unsur SKM Detailed Grid Bento (Full 12 cols) — Standardized Card Utama (p-5 sm:p-6, rounded-2xl, Layer 1) */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`md:col-span-12 ${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingLg} space-y-5 sm:space-y-6 relative overflow-hidden`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200/80 dark:border-white/[0.07] relative z-10">
            <div>
              <div className={`inline-flex items-center gap-1.5 ${MPP_TYPOGRAPHY.eyebrow}`}>
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {t("mppPortal.skmBento.matrixBadge", "Rincian Skor 9 Unsur SKM PermenPAN-RB")}
              </div>
              <h3 className={`${MPP_TYPOGRAPHY.cardTitle} mt-0.5`}>
                {t("mppPortal.skmBento.matrixTitle", "Matriks Penilaian Mutu Pelayanan Publik")}
              </h3>
            </div>
            
            {/* Scale Indicator — Standardized <Badge variant="category" tone="neutral"> */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Badge variant="category" tone="neutral">
                {t("mppPortal.skmBento.scaleLabel", "Skala Nilai 0 - 100%")}
              </Badge>
            </div>
          </div>

          {/* Grid 9 Sub-Cards — Standardized Sub-Card (p-4, rounded-xl, Layer 2 #143755) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 relative z-10">
            {skmIndicators.map((item, idx) => {
              const style = getIndicatorStyle(item.key);
              return (
                <motion.div
                  key={item.key}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className={`${MPP_CARD_SURFACE.layer2} ${MPP_CARD_SURFACE.radiusSub} ${MPP_CARD_SURFACE.paddingSm} space-y-2.5 ${style.borderHover} transition-all group`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${style.iconBg} border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                        {style.icon}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-sans truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className={`text-xs sm:text-sm font-extrabold ${style.textColor} font-['Plus_Jakarta_Sans',sans-serif] tabular-nums shrink-0`}>
                      {hasSurveyData && item.score > 0 ? `${item.score}%` : '—'}
                    </span>
                  </div>

                  {/* Multi-gradient Animated Progress bar with Axis Reference */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-2.5 rounded-full overflow-hidden relative">
                      {/* Threshold Guide lines at 65%, 76.6%, 88.3% */}
                      <div className="absolute inset-y-0 left-[65%] w-px bg-slate-400/40 dark:bg-slate-500/30 pointer-events-none z-10" />
                      <div className="absolute inset-y-0 left-[76.6%] w-px bg-slate-400/40 dark:bg-slate-500/30 pointer-events-none z-10" />
                      <div className="absolute inset-y-0 left-[88.3%] w-px bg-emerald-500/50 pointer-events-none z-10" />
                      
                      <motion.div
                        initial={shouldReduceMotion ? false : { scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 + idx * 0.04, ease: "easeOut" }}
                        style={{
                          transformOrigin: 'left',
                          width: hasSurveyData ? `${item.score}%` : '0%',
                          willChange: 'transform'
                        }}
                        className={`bg-gradient-to-r ${style.bar} h-full rounded-full relative z-0 origin-left`}
                      />
                    </div>
                    {/* Micro Axis Ticks */}
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 dark:text-slate-500 px-0.5">
                      <span>0</span>
                      <span>50</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">100</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Sumbu Skala Horizontal Penuh (0 - 100) — Standar MPP Badung */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-black/25 relative z-10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Grafik Komparasi Nilai 9 Indikator SKM (Sumbu 0 - 100)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Garis Hijau: Standar Sangat Baik (88.31%)
              </span>
            </div>

            {/* Comprehensive Horizontal Bars with Shared 0-100 Axis */}
            <div className="space-y-2.5 pt-2">
              {skmIndicators.map((ind) => {
                const style = getIndicatorStyle(ind.key);
                return (
                  <div key={ind.key} className="grid grid-cols-12 items-center gap-2 text-xs">
                    <div className="col-span-4 sm:col-span-3 text-slate-700 dark:text-slate-300 font-semibold truncate font-sans">
                      {ind.label}
                    </div>
                    <div className="col-span-6 sm:col-span-8 relative flex items-center">
                      <div className="w-full bg-slate-200/90 dark:bg-slate-800/90 h-3 rounded-full overflow-hidden relative border border-slate-300/40 dark:border-white/5">
                        {/* Background Grid Lines for 20, 40, 60, 80, 100 */}
                        <div className="absolute inset-y-0 left-[20%] w-px bg-slate-300/50 dark:bg-slate-700/80 pointer-events-none" />
                        <div className="absolute inset-y-0 left-[40%] w-px bg-slate-300/50 dark:bg-slate-700/80 pointer-events-none" />
                        <div className="absolute inset-y-0 left-[60%] w-px bg-slate-300/50 dark:bg-slate-700/80 pointer-events-none" />
                        <div className="absolute inset-y-0 left-[80%] w-px bg-slate-300/50 dark:bg-slate-700/80 pointer-events-none" />
                        {/* Target line at 88.31% */}
                        <div className="absolute inset-y-0 left-[88.31%] w-0.5 bg-emerald-500 dark:bg-emerald-400 pointer-events-none z-10 shadow-xs" />

                        <motion.div
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: hasSurveyData ? Math.min(Math.max(ind.score, 0), 100) / 100 : 0 }}
                          viewport={{ once: true }}
                          style={{ transformOrigin: 'left' }}
                          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full w-full bg-gradient-to-r ${style.bar} rounded-full transform-gpu will-change-transform`}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {hasSurveyData && ind.score > 0 ? `${ind.score}%` : '—'}
                    </div>
                  </div>
                );
              })}

              {/* Shared Horizontal Axis 0 - 100 */}
              <div className="grid grid-cols-12 items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/10 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <div className="col-span-4 sm:col-span-3 text-left font-sans font-bold text-slate-700 dark:text-slate-300">
                  Skala Sumbu:
                </div>
                <div className="col-span-6 sm:col-span-8 flex justify-between px-0.5">
                  <span>0</span>
                  <span>20</span>
                  <span>40</span>
                  <span>60</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold">88.3</span>
                  <span className="font-bold text-slate-900 dark:text-white">100</span>
                </div>
                <div className="col-span-2 sm:col-span-1 text-right font-bold text-emerald-500 dark:text-emerald-400">
                  SKOR
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Multi-Colored Mutu Spectrum Bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-sans">
                Spektrum Klasifikasi Mutu Pelayanan (KepmenPAN-RB 14/2017)
              </span>
              <span className="text-[10px] font-bold text-emerald-400 font-sans">
                Skor MPP: {hasSurveyData ? `${averageSkm} / 100 (${activePredikat})` : 'Fase Pra-Peluncuran (Menunggu Ulasan)'}
              </span>
            </div>
            
            {/* Multi-color Spectrum Progress Strip */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800 p-0.5 shadow-inner">
              <div className="h-full rounded-l-full bg-rose-500 transition-all" style={{ width: '25%' }} title="D: 25.00 - 64.99 (Tidak Baik)" />
              <div className="h-full bg-amber-500 transition-all" style={{ width: '25%' }} title="C: 65.00 - 76.60 (Kurang Baik)" />
              <div className="h-full bg-blue-500 transition-all" style={{ width: '25%' }} title="B: 76.61 - 88.30 (Baik)" />
              <div className="h-full rounded-r-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: '25%' }} title="A: 88.31 - 100.00 (Sangat Baik)" />
            </div>

            <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center mt-1.5 font-sans">
              <span className="text-rose-700 dark:text-rose-400">D (25-64.9)</span>
              <span className="text-amber-700 dark:text-amber-400">C (65-76.6)</span>
              <span className="text-blue-700 dark:text-blue-400">B (76.6-88.3)</span>
              <span className="text-emerald-700 dark:text-emerald-400">A (88.3-100) ★</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SkmBentoGrid;
