import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertOctagon, HeartHandshake, CheckCircle2, X, ExternalLink, Scale, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AntiCorruptionBannerProps {
  isDark?: boolean;
  className?: string;
  variant?: 'full' | 'compact' | 'footer';
}

export function AntiCorruptionBanner({ isDark = false, className = '', variant = 'full' }: AntiCorruptionBannerProps) {
  const { t } = useTranslation();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  return (
    <>
      <div 
        className={`w-full relative rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden ${
          isDark 
            ? 'bg-slate-900/95 border-rose-500/30 shadow-xl shadow-rose-950/20' 
            : 'bg-white border-rose-200 shadow-lg shadow-rose-500/5'
        } ${className}`}
      >
        {/* Top Header Badge */}
        <div className={`px-4 sm:px-6 py-2.5 sm:py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'bg-rose-950/30 border-rose-500/20' : 'bg-rose-50/70 border-rose-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 font-sans">
              Zona Integritas Bebas Korupsi (WBK / WBBM)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDetailModalOpen(true)}
            className="text-[10.5px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Maklumat Integritas</span>
            <ExternalLink className="w-3 h-3 text-rose-500" />
          </button>
        </div>

        {/* The 4 Emblem Interactive Grid */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 items-center justify-center">
            {/* 1. NO KORUPSI */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className={`p-3 sm:p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-rose-500/40' : 'bg-slate-50/80 border-slate-200/80 hover:border-rose-300'
              }`}
            >
              <div className="relative mb-2 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">N</span>
                <div className="relative mx-1">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-rose-600 flex items-center justify-center shadow-md">
                    <span className="text-white text-lg sm:text-xl">✋</span>
                  </div>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-widest font-sans">
                KORUPSI
              </span>
              <span className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                Tolak Semua Praktik
              </span>
            </motion.div>

            {/* 2. STOP GRATIFIKASI */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className={`p-3 sm:p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-rose-500/40' : 'bg-slate-50/80 border-slate-200/80 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">ST</span>
                <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center">
                  <span className="text-white text-xs">✋</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">P</span>
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wider font-sans">
                GRATIFIKASI
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight line-clamp-2">
                Dilarang Memberi & Menerima
              </span>
            </motion.div>

            {/* 3. STOP PUNGLI */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className={`p-3 sm:p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-rose-500/40' : 'bg-slate-50/80 border-slate-200/80 hover:border-rose-300'
              }`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-600 text-white flex flex-col items-center justify-center shadow-md mb-2 p-1">
                <span className="text-xs">✋</span>
                <span className="text-[8px] font-black tracking-tighter leading-none">STOP</span>
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wider font-sans">
                STOP PUNGLI
              </span>
              <span className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                Biaya Nol / Resmi Bank
              </span>
            </motion.div>

            {/* 4. BERANI JUJUR HEBAT! */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className={`p-3 sm:p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-rose-500/40' : 'bg-slate-50/80 border-slate-200/80 hover:border-rose-300'
              }`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-700 text-white flex flex-col items-center justify-center shadow-md mb-2 p-1 font-serif italic text-center">
                <span className="text-[7.5px] font-black leading-tight tracking-wider">BERANI</span>
                <span className="text-[10px] font-black leading-tight">JUJUR</span>
                <span className="text-[7.5px] font-black leading-tight tracking-wider">HEBAT!</span>
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wider font-sans">
                INTEGRITAS
              </span>
              <span className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                Budaya Anti-Korupsi
              </span>
            </motion.div>
          </div>

          {/* Subtext Banner */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-rose-600 dark:text-rose-400">Pemberitahuan Resmi:</strong> Seluruh pelayanan di Mal Pelayanan Publik (MPP) Simpurusiang tidak dipungut biaya selain tarif retribusi resmi yang disetor langsung melalui kas daerah / Bank BPD Sulselbar.
            </p>
            <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
              PERPRES NO. 87/2016
            </span>
          </div>
        </div>
      </div>

      {/* Modal Maklumat Integritas & Anti Pungli */}
      <AnimatePresence>
        {isDetailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl rounded-3xl border shadow-2xl p-6 sm:p-8 relative ${
                isDark ? 'bg-slate-900 border-rose-500/40 text-white' : 'bg-white border-rose-200 text-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 block font-mono">
                    PEMERINTAH KABUPATEN LUWU • DPMPTSP
                  </span>
                  <h3 className="text-lg sm:text-xl font-black font-sans">
                    Komitmen Zona Integritas & Pelayanan Bersih
                  </h3>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <strong className="text-rose-700 dark:text-rose-300 block mb-1">
                    🛑 Larangan Keras Gratifikasi & Pungutan Liar:
                  </strong>
                  <p>
                    Petugas dilarang meminta atau menerima uang, hadiah, bingkisan, atau fasilitas apapun dari pemohon layanan. Masyarakat dan investor dihimbau untuk tidak memberikan imbalan dalam bentuk apapun.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block mb-1">Kanal Pengaduan Resmi:</strong>
                    <p className="text-xs">Laporkan setiap indikasi pungli atau gratifikasi melalui SP4N-LAPOR! atau Call Center Inspektorat Kab. Luwu.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block mb-1">Perlindungan Pelapor:</strong>
                    <p className="text-xs">Kerahasiaan identitas pelapor (*Whistleblower*) dijamin penuh oleh Undang-Undang Perlindungan Saksi dan Korban.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Tutup Informasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
