import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { CountUpNumber } from '../common/CountUpNumber';
import { 
  Star, Award, Users, CheckCircle2, ShieldCheck, 
  Sparkles, Zap, BarChart3,
  MessageSquareHeart, Smile, FileCheck, DollarSign
} from 'lucide-react';
import { PreLaunchBanner } from '../common/PreLaunchBanner';
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
        ? t("mppPortal.skmBento.predikatA", "Predikat A · Sangat Baik")
        : Number(averageSkm) >= 76.61
          ? t("mppPortal.skmBento.predikatB", "Predikat B · Baik")
          : Number(averageSkm) >= 65
            ? t("mppPortal.skmBento.predikatC", "Predikat C · Kurang Baik")
            : t("mppPortal.skmBento.predikatD", "Predikat D · Tidak Baik")
  );

  // Cohesive Zamrud Luwu & Emas Sawerigading palette for the 9 SKM elements
  const getIndicatorIcon = (key: string) => {
    switch (key) {
      case 'biaya': return <DollarSign className="w-4 h-4" />;
      case 'perilaku': return <Smile className="w-4 h-4" />;
      case 'produk': return <Award className="w-4 h-4" />;
      case 'persyaratan': return <FileCheck className="w-4 h-4" />;
      case 'kompetensi': return <Users className="w-4 h-4" />;
      case 'prosedur': return <CheckCircle2 className="w-4 h-4" />;
      case 'sarana': return <Sparkles className="w-4 h-4" />;
      case 'kecepatan': return <Zap className="w-4 h-4" />;
      case 'pengaduan': return <MessageSquareHeart className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <PreLaunchBanner 
        isDark={isDark} 
        dataCount={totalRespondents} 
        context="survey" 
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* CARD 1: Main Score Hero Bento (MD: 5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className={`md:col-span-5 ${MPP_CARD_SURFACE.default} ${MPP_CARD_SURFACE.paddingLg} relative overflow-hidden flex flex-col justify-between`}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A24B]/70 to-transparent" />
          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#855A14] dark:text-[#E2C475]">
                {t("mppPortal.skmBento.permenpanBadge", "PermenPAN-RB No. 14/2017")}
              </span>
              <span>· {t("mppPortal.skmBento.semester", "Semester Berjalan")}</span>
            </div>

            <div>
              <span className={`${MPP_TYPOGRAPHY.eyebrow} block`}>
                {t("mppPortal.skmBento.ikmLabel", "Indeks Kepuasan Masyarakat (IKM)")}
              </span>
              <div className="flex items-baseline gap-2.5 my-2">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-mono tabular-nums text-[#0F6B4F] dark:text-emerald-300">
                  {hasSurveyData ? (
                    <CountUpNumber end={Number(averageSkm) || 0} decimals={2} duration={1200} />
                  ) : (
                    '—'
                  )}
                </span>
                {hasSurveyData && (
                  <span className="text-base sm:text-lg font-bold font-mono text-slate-500 dark:text-slate-400">/ 100</span>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F6B4F] dark:text-[#E2C475]">
                <Award className="w-4 h-4 shrink-0" />
                <span>{activePredikat}</span>
              </div>
            </div>

            <p className={MPP_TYPOGRAPHY.cardBody}>
              {t("mppPortal.skmBento.measuredFrom", "Diukur dari penilaian langsung masyarakat pemohon layanan di Mal Pelayanan Publik Simpurusiang Kabupaten Luwu.")}
            </p>
          </div>

          <div className="relative z-10 pt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs pt-3 border-t border-[#E5DFD3] dark:border-white/[0.08] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-[#0F6B4F] dark:text-emerald-400 shrink-0" /> {t("mppPortal.skmBento.totalRespondents", "Total Responden Terverifikasi:")}
              </span>
              <strong className="font-mono text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
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
              className="w-full min-h-[46px] bg-[#0F6B4F] hover:bg-[#0B543E] dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-xl transition-all flex items-center justify-between cursor-pointer font-sans"
            >
              <span>{t("mppPortal.skmBento.fillSurveyBtn", "Isi Survei SKM (Khusus Pemohon)")}</span>
              <ShieldCheck className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </motion.div>

        {/* CARD 2: 3 Key Pillar Highlights (MD: 7 cols) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {[
            {
              key: 'biaya',
              title: t("mppPortal.skmBento.highlight1Title", "Biaya & Tarif"),
              desc: t("mppPortal.skmBento.highlight1Desc", "Transparansi 100% bebas pungli & sesuai tarif resmi daerah."),
              score: highlights.biaya,
              icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />,
            },
            {
              key: 'perilaku',
              title: t("mppPortal.skmBento.highlight2Title", "Perilaku Petugas"),
              desc: t("mppPortal.skmBento.highlight2Desc", "Pelayanan ramah 5S, sopan, santun, dan profesional."),
              score: highlights.perilaku,
              icon: <Smile className="w-4 h-4 sm:w-5 sm:h-5" />,
            },
            {
              key: 'produk',
              title: t("mppPortal.skmBento.highlight3Title", "Produk Layanan"),
              desc: t("mppPortal.skmBento.highlight3Desc", "Kesesuaian dokumen & kepastian waktu penerbitan izin."),
              score: highlights.produk,
              icon: <Award className="w-4 h-4 sm:w-5 sm:h-5" />,
            },
          ].map((hl, idx) => (
            <motion.div
              key={hl.key}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 * (idx + 1) }}
              className={`${MPP_CARD_SURFACE.default} ${MPP_CARD_SURFACE.paddingSm} flex flex-col justify-between space-y-3 hover:border-[#0F6B4F]/40 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#FAF8F3] dark:bg-[#132E48] border border-[#E5DFD3] dark:border-white/[0.08] flex items-center justify-center text-[#0F6B4F] dark:text-emerald-400 shrink-0">
                  {hl.icon}
                </div>
                <span className="text-sm font-bold text-[#0F6B4F] dark:text-emerald-300 font-mono tabular-nums">
                  {hasSurveyData && hl.score > 0 ? `${hl.score}%` : '—'}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 font-sans">{hl.title}</h4>
                <p className={`${MPP_TYPOGRAPHY.cardBody} mt-1`}>
                  {hl.desc}
                </p>
              </div>
              <div className="w-full bg-[#EFECE3] dark:bg-[#132E48] h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={shouldReduceMotion ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{
                    transformOrigin: 'left',
                    width: hasSurveyData ? `${Math.min(Math.max(hl.score, 0), 100)}%` : '0%',
                  }}
                  className="bg-gradient-to-r from-[#0F6B4F] to-[#249672] dark:from-emerald-500 dark:to-[#E2C475] h-full rounded-full origin-left" 
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CARD 3: Single Unified 9-Unsur SKM Matrix (No Duplicate Redundant Chart Below) */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className={`md:col-span-12 ${MPP_CARD_SURFACE.default} ${MPP_CARD_SURFACE.paddingLg} space-y-5 relative overflow-hidden`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E5DFD3] dark:border-white/[0.08]">
            <div>
              <div className={`inline-flex items-center gap-1.5 ${MPP_TYPOGRAPHY.eyebrow}`}>
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                <span>{t("mppPortal.skmBento.matrixBadge", "Rincian Skor 9 Unsur SKM PermenPAN-RB")}</span>
              </div>
              <h3 className={`${MPP_TYPOGRAPHY.cardTitle} mt-0.5`}>
                {t("mppPortal.skmBento.matrixTitle", "Matriks Penilaian Mutu Pelayanan Publik")}
              </h3>
            </div>
            
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Garis Standar Sangat Baik: <strong className="text-[#0F6B4F] dark:text-emerald-400">88.31%</strong>
            </div>
          </div>

          {/* Unified 9-Element Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {skmIndicators.map((item, idx) => (
              <div
                key={item.key}
                className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#132E48] border border-[#E5DFD3] dark:border-white/[0.07] space-y-2.5 hover:border-[#0F6B4F]/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#0F6B4F]/10 dark:bg-emerald-500/15 text-[#0F6B4F] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      {getIndicatorIcon(item.key)}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-sans truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0F6B4F] dark:text-emerald-300 font-mono tabular-nums shrink-0">
                    {hasSurveyData && item.score > 0 ? `${item.score}%` : '—'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-[#E5DFD3] dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                    <div className="absolute inset-y-0 left-[88.31%] w-0.5 bg-[#C9A24B] pointer-events-none z-10" />
                    <motion.div
                      initial={shouldReduceMotion ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.75, delay: 0.05 + idx * 0.03, ease: "easeOut" }}
                      style={{
                        transformOrigin: 'left',
                        width: hasSurveyData ? `${Math.min(Math.max(item.score, 0), 100)}%` : '0%',
                      }}
                      className="bg-gradient-to-r from-[#0F6B4F] to-[#249672] dark:from-emerald-500 dark:to-teal-300 h-full rounded-full origin-left"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    <span>0</span>
                    <span>88.3</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Classification Reference Footer */}
          <div className="pt-4 border-t border-[#E5DFD3] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold">
              Klasifikasi Mutu KepmenPAN-RB 14/2017:
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
              <span className="text-rose-700 dark:text-rose-400">D: 25–64.9</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 dark:text-amber-400">C: 65–76.6</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-700 dark:text-sky-400">B: 76.6–88.3</span>
              <span aria-hidden="true">·</span>
              <span className="font-bold text-[#0F6B4F] dark:text-emerald-400">A: 88.31–100 (Sangat Baik)</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SkmBentoGrid;
