import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Star, Award, Users, CheckCircle2, ShieldCheck, 
  Sparkles, HeartHandshake, Zap, BarChart3,
  MessageSquareHeart, Smile, FileCheck, DollarSign
} from 'lucide-react';

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
  isDark = false,
}) => {
  const { t } = useTranslation();

  const activePredikat = predikat || (
    totalRespondents === 0 
      ? t("mppPortal.skmBento.noSurveyData", "Belum Ada Responden") 
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
          bar: 'from-blue-600 via-indigo-400 to-sky-300',
          textColor: 'text-blue-700 dark:text-blue-400',
          iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-600',
          borderHover: 'hover:border-blue-500/50'
        };
      case 'prosedur':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
          bar: 'from-violet-600 via-purple-400 to-indigo-300',
          textColor: 'text-violet-700 dark:text-violet-400',
          iconBg: 'bg-violet-500/15 border-violet-500/30 text-violet-600',
          borderHover: 'hover:border-violet-500/50'
        };
      case 'sarana':
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          bar: 'from-amber-500 via-orange-400 to-yellow-300',
          textColor: 'text-amber-700 dark:text-amber-400',
          iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-600',
          borderHover: 'hover:border-amber-500/50'
        };
      case 'kecepatan':
        return {
          icon: <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
          bar: 'from-orange-500 via-rose-400 to-amber-300',
          textColor: 'text-orange-700 dark:text-orange-400',
          iconBg: 'bg-orange-500/15 border-orange-500/30 text-orange-600',
          borderHover: 'hover:border-orange-500/50'
        };
      case 'pengaduan':
        return {
          icon: <MessageSquareHeart className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          bar: 'from-rose-500 via-pink-400 to-rose-300',
          textColor: 'text-rose-700 dark:text-rose-400',
          iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-600',
          borderHover: 'hover:border-rose-500/50'
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* CARD 1: Hero Scoreboard Bento (MD: 5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`md:col-span-5 rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden flex flex-col justify-between group transition-all ${
            isDark
              ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-emerald-500/30 text-white'
              : 'bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/40 border-emerald-200/90 text-slate-900 shadow-xl shadow-emerald-500/5'
          }`}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/25 transition-all duration-700" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider font-sans ${
                isDark
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800'
              }`}>
                <Award className="w-3.5 h-3.5 text-emerald-500" /> {t("mppPortal.skmBento.permenpanBadge", "PermenPAN-RB No. 14/2017")}
              </span>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t("mppPortal.skmBento.semester", "Semester Berjalan")}</span>
            </div>

            <div>
              <span className={`text-xs font-bold uppercase tracking-widest block font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t("mppPortal.skmBento.ikmLabel", "Indeks Kepuasan Masyarakat (IKM)")}
              </span>
              <div className="flex items-baseline gap-2 sm:gap-3 my-2">
                <span className={`text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text tracking-tight font-sans ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
                }`}>
                  {averageSkm}
                </span>
                <span className={`text-base sm:text-lg font-bold font-sans ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>/ 100</span>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{activePredikat}</span>
              </div>
            </div>

            <p className={`text-xs leading-relaxed pt-1 ${isDark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
              {t("mppPortal.skmBento.measuredFrom", "Diukur dari penilaian langsung masyarakat pemohon layanan di instansi Mal Pelayanan Publik Simpurusiang Kab. Luwu.")}
            </p>
          </div>

          <div className="relative z-10 pt-4 sm:pt-6 space-y-3">
            <div className={`flex flex-wrap items-center justify-between gap-1 text-xs pt-2 border-t ${
              isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-slate-200'
            }`}>
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {t("mppPortal.skmBento.totalRespondents", "Total Responden:")}
              </span>
              <strong className={`font-mono text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {totalRespondents > 0 ? `${totalRespondents.toLocaleString('id-ID')} Responden` : t("mppPortal.skmBento.noDataShort", "0 Data")}
              </strong>
            </div>

            <button
              type="button"
              onClick={onOpenSurveyModal}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-2xl transition-all flex items-center justify-between cursor-pointer font-sans shadow-lg shadow-emerald-600/25"
            >
              <span>{t("mppPortal.skmBento.fillSurveyBtn", "Isi Survei SKM (Khusus Pemohon)")}</span>
              <ShieldCheck className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </motion.div>

        {/* CARD 2: Top Highlights Bento (MD: 7 cols) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Highlight 1: Biaya Rp 0 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md sm:shadow-lg flex flex-col justify-between space-y-2.5 sm:space-y-3 group hover:border-emerald-500/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">{highlights.biaya}%</span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-sans">{t("mppPortal.skmBento.highlight1Title", "Biaya & Tarif")}</h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-snug font-medium">
                {t("mppPortal.skmBento.highlight1Desc", "Transparansi 100% Bebas Pungli & Sesuai Tarif Resmi.")}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(Math.max(highlights.biaya, 0), 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full rounded-full" 
              />
            </div>
          </motion.div>

          {/* Highlight 2: Perilaku Petugas */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md sm:shadow-lg flex flex-col justify-between space-y-2.5 sm:space-y-3 group hover:border-teal-500/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-xs">
                <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-400 font-mono">{highlights.perilaku}%</span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-sans">{t("mppPortal.skmBento.highlight2Title", "Perilaku Petugas")}</h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-snug font-medium">
                {t("mppPortal.skmBento.highlight2Desc", "Pelayanan Ramah 5S, Sopan, Santun & Profesional.")}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(Math.max(highlights.perilaku, 0), 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-300 h-full rounded-full" 
              />
            </div>
          </motion.div>

          {/* Highlight 3: Spesifikasi Produk */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md sm:shadow-lg flex flex-col justify-between space-y-2.5 sm:space-y-3 group hover:border-sky-500/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-xs">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-sky-700 dark:text-sky-400 font-mono">{highlights.produk}%</span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-sans">{t("mppPortal.skmBento.highlight3Title", "Produk Layanan")}</h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-snug font-medium">
                {t("mppPortal.skmBento.highlight3Desc", "Kesesuaian Dokumen & Kepastian Hasil Perizinan.")}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(Math.max(highlights.produk, 0), 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-sky-500 via-blue-400 to-indigo-300 h-full rounded-full" 
              />
            </div>
          </motion.div>

          {/* Guarantee Banner (Sm: span 3) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="sm:col-span-3 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-sans">
                  {t("mppPortal.skmBento.commitmentTitle", "Komitmen Transparansi Layanan Pemkab Luwu")}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  {t("mppPortal.skmBento.commitmentDesc", "Seluruh masukan warga diawasi langsung oleh Inspektorat & DPMPTSP Kab. Luwu.")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("mppPortal.skmBento.pungliFree", "100% Bebas Pungli")}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-800 dark:text-blue-300 bg-blue-500/15 px-2.5 py-1 rounded-lg border border-blue-500/30">
                <HeartHandshake className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("mppPortal.skmBento.responsiveFriendly", "Responsif & Ramah")}
              </span>
            </div>
          </motion.div>

        </div>

        {/* CARD 3: 9 Unsur SKM Detailed Grid Bento (Full 12 cols) with Vibrant Animated Charts */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="md:col-span-12 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl space-y-5 sm:space-y-7 relative overflow-hidden"
        >
          {/* Subtle Ambient Background Flare */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200/80 dark:border-slate-800 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {t("mppPortal.skmBento.matrixBadge", "Rincian Skor 9 Unsur SKM PermenPAN-RB")}
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans mt-0.5">
                {t("mppPortal.skmBento.matrixTitle", "Matriks Penilaian Mutu Pelayanan Publik")}
              </h3>
            </div>
            
            {/* Colorful Scale Indicator */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg font-mono border border-slate-200/80 dark:border-slate-700/80">
                {t("mppPortal.skmBento.scaleLabel", "Skala Nilai 0 - 100%")}
              </span>
            </div>
          </div>

          {/* Grid 9 Cards (Vibrant, high-contrast, animated bars) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 relative z-10">
            {skmIndicators.map((item, idx) => {
              const style = getIndicatorStyle(item.key);
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.04 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className={`bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/60 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-2.5 ${style.borderHover} transition-all group shadow-xs`}
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
                    <span className={`text-xs sm:text-sm font-extrabold ${style.textColor} font-mono shrink-0`}>
                      {item.score}%
                    </span>
                  </div>

                  {/* Multi-gradient Animated Progress bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.1 + idx * 0.05, ease: "easeOut" }}
                      className={`bg-gradient-to-r ${style.bar} h-full rounded-full`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Interactive Multi-Colored Mutu Spectrum Bar */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-sans">
                Spektrum Klasifikasi Mutu Pelayanan (KepmenPAN-RB 14/2017)
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                Skor MPP Saat Ini: {averageSkm} / 100 ({activePredikat})
              </span>
            </div>
            
            {/* Multi-color Spectrum Progress Strip */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800 p-0.5 shadow-inner">
              <div className="h-full rounded-l-full bg-rose-500 transition-all" style={{ width: '25%' }} title="D: 25.00 - 64.99 (Tidak Baik)" />
              <div className="h-full bg-amber-500 transition-all" style={{ width: '25%' }} title="C: 65.00 - 76.60 (Kurang Baik)" />
              <div className="h-full bg-blue-500 transition-all" style={{ width: '25%' }} title="B: 76.61 - 88.30 (Baik)" />
              <div className="h-full rounded-r-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: '25%' }} title="A: 88.31 - 100.00 (Sangat Baik)" />
            </div>

            <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center mt-1.5 font-mono">
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
