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

interface SkmBentoGridProps {
  skmIndicators: SkmIndicator[];
  averageSkm: string;
  onOpenSurveyModal: () => void;
  isDark?: boolean;
}

export const SkmBentoGrid: React.FC<SkmBentoGridProps> = ({
  skmIndicators,
  averageSkm,
  onOpenSurveyModal,
  isDark = false,
}) => {
  const { t } = useTranslation();

  // Icon mapping for 9 Unsur SKM
  const getIndicatorIcon = (key: string) => {
    switch (key) {
      case 'biaya': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'perilaku': return <Smile className="w-4 h-4 text-emerald-500" />;
      case 'produk': return <Award className="w-4 h-4 text-teal-500" />;
      case 'persyaratan': return <FileCheck className="w-4 h-4 text-emerald-500" />;
      case 'kompetensi': return <Users className="w-4 h-4 text-blue-500" />;
      case 'prosedur': return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
      case 'sarana': return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'kecepatan': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'pengaduan': return <MessageSquareHeart className="w-4 h-4 text-rose-500" />;
      default: return <Star className="w-4 h-4 text-emerald-500" />;
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
          className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/25 transition-all duration-700" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider font-sans">
                <Award className="w-3.5 h-3.5 text-emerald-400" /> {t("mppPortal.skmBento.permenpanBadge", "PermenPAN-RB No. 14/2017")}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">{t("mppPortal.skmBento.semester", "Semester Berjalan")}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-widest block font-sans">
                {t("mppPortal.skmBento.ikmLabel", "Indeks Kepuasan Masyarakat (IKM)")}
              </span>
              <div className="flex items-baseline gap-2 sm:gap-3 my-2">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 tracking-tight font-sans">
                  {averageSkm}
                </span>
                <span className="text-base sm:text-lg font-bold text-emerald-400 font-sans">/ 100</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t("mppPortal.skmBento.predikat", "Predikat A • Sangat Baik")}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {t("mppPortal.skmBento.measuredFrom", "Diukur dari penilaian langsung masyarakat pemohon layanan di 21 instansi Mal Pelayanan Publik Simpurusiang Kab. Luwu.")}
            </p>
          </div>

          <div className="relative z-10 pt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" /> {t("mppPortal.skmBento.totalRespondents", "Total Responden:")}
              </span>
              <strong className="text-white font-mono text-sm">{t("mppPortal.skmBento.respondentsCount", "12.076 Warga")}</strong>
            </div>

            <button
              type="button"
              disabled
              className="w-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl transition-all flex items-center justify-between cursor-not-allowed font-sans"
            >
              <span>{t("mppPortal.skmBento.fillSurveyBtn", "Isi Survei (Khusus Pemegang Tiket)")}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* CARD 2: Top Highlights Bento (MD: 7 cols) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Highlight 1: Biaya Rp 0 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-3 group hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">95.6%</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">{t("mppPortal.skmBento.highlight1Title", "Biaya & Tarif")}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {t("mppPortal.skmBento.highlight1Desc", "Transparansi 100% Bebas Pungli & Sesuai Tarif Resmi.")}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '95.6%' }} />
            </div>
          </motion.div>

          {/* Highlight 2: Perilaku Petugas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-3 group hover:border-teal-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
                <Smile className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">93.4%</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">{t("mppPortal.skmBento.highlight2Title", "Perilaku Petugas")}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {t("mppPortal.skmBento.highlight2Desc", "Pelayanan Ramah 5S, Sopan, Santun & Profesional.")}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: '93.4%' }} />
            </div>
          </motion.div>

          {/* Highlight 3: Spesifikasi Produk */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-3 group hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">92.1%</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">{t("mppPortal.skmBento.highlight3Title", "Produk Layanan")}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {t("mppPortal.skmBento.highlight3Desc", "Kesesuaian Dokumen & Kepastian Hasil Perizinan.")}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '92.1%' }} />
            </div>
          </motion.div>

          {/* Guarantee Banner (Sm: span 3) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="sm:col-span-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                  {t("mppPortal.skmBento.commitmentTitle", "Komitmen Transparansi Layanan Pemkab Luwu")}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("mppPortal.skmBento.commitmentDesc", "Seluruh masukan warga diawasi langsung oleh Inspektorat & DPMPTSP Kab. Luwu.")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("mppPortal.skmBento.pungliFree", "100% Bebas Pungli")}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-500/20">
                <HeartHandshake className="w-3.5 h-3.5" /> {t("mppPortal.skmBento.responsiveFriendly", "Responsif & Ramah")}
              </span>
            </div>
          </motion.div>

        </div>

        {/* CARD 3: 9 Unsur SKM Detailed Grid Bento (Full 12 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:col-span-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-sans">
                <BarChart3 className="w-4 h-4" /> {t("mppPortal.skmBento.matrixBadge", "Rincian Skor 9 Unsur SKM PermenPAN-RB")}
              </div>
              <h3 className="text-base sm:text-lg font-medium tracking-tight text-slate-900 dark:text-white font-sans mt-1">
                {t("mppPortal.skmBento.matrixTitle", "Matriks Penilaian Mutu Pelayanan Publik")}
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-mono self-start sm:self-center">
              {t("mppPortal.skmBento.scaleLabel", "Skala Nilai 0 - 100%")}
            </span>
          </div>

          {/* Grid 9 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {skmIndicators.map((item) => (
              <div
                key={item.key}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-4 space-y-3 hover:border-emerald-500/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {getIndicatorIcon(item.key)}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {item.score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};
