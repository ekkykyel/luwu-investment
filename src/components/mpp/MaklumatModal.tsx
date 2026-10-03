import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { X, Quote, ShieldCheck, CheckCircle2, Award, Clock, Scale } from 'lucide-react';

interface MaklumatModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const MaklumatModal: React.FC<MaklumatModalProps> = ({
  isOpen,
  onClose,
  isDark = false
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-slate-950/80 backdrop-blur-md p-3 overflow-hidden font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="w-full max-h-[85vh] sm:max-w-xl bg-white dark:bg-slate-900 rounded-3xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 shadow-2xl transition-all duration-300 border border-slate-200/80 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle Indicator */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

          {/* Header Container */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full shrink-0 font-mono">
                DPMPTSP Kab. Luwu
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                {isEn ? 'Service Charter' : isZh ? '政务履职公开承诺' : 'Maklumat Pelayanan'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Tutup maklumat pelayanan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body & Maklumat Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24 sm:pb-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {/* Status & SLA Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-800 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                {isEn 
                  ? 'SLA Compliance Rate: 98.4% (Law No. 25/2009)' 
                  : isZh 
                    ? 'SLA达标履约率: 98.4% (第25/2009号法案)' 
                    : 'Tingkat Kepatuhan SLA: 98.4% (UU No. 25/2009)'}
              </span>
            </div>

            {/* Official Pledge Quote Card */}
            <div className="relative bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
              <Quote className="absolute right-3 bottom-3 w-16 h-16 text-emerald-500/10 dark:text-emerald-400/10 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isEn ? 'OFFICIAL DECLARATION PLEDGE' : isZh ? '法定公开承诺正文' : 'PERNYATAAN MAKLUMAT RESMI'}</span>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-slate-800 dark:text-slate-200 italic leading-relaxed font-serif tracking-wide">
                  {isEn 
                    ? '"Herewith, we the leadership and all personnel of Mal Pelayanan Publik (MPP) Simpurusiang Luwu Regency solemnly pledge and state our capability to deliver public services in strict compliance with established Standards, ensuring transparency, integrity, and time certainty. If we fail to fulfill this promise, we are fully prepared to accept sanctions in accordance with applicable laws."'
                    : isZh
                    ? '“在此，鲁乌县辛普鲁西亚公共服务大厅领导班子与全体工作人员庄严承诺：严格依照法定服务标准开展各项政务与行政审批，恪守廉洁底线，确保办事便捷、流程透明、时效确定。若未履行政诺，愿依法依规接受严格惩戒。”'
                    : '"Dengan ini, kami pimpinan dan segenap aparatur Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu berjanji dan menyatakan sanggup menyelenggarakan pelayanan sesuai Standar Pelayanan yang telah ditetapkan, memberikan kemudahan, transparansi, serta kepastian waktu, dan apabila kami tidak menepati janji ini, kami siap menerima sanksi sesuai dengan peraturan perundang-undangan yang berlaku."'}
                </p>
              </div>
            </div>

            {/* 3 Pilar Komitmen Layanan */}
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {isEn ? '1. Zero-Fee Transparency' : isZh ? '1. 规范零规费与价格透明' : '1. Anti-Pungli & Nol Biaya Ilegal'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {isEn ? 'All core administrative permits are Rp 0,- (Free). Retributions are handled solely via official bank tellers or QRIS.' : isZh ? '基础行政审批均为零收费（免费）。法定税费一律由银行窗口或官方QRIS收缴。' : 'Seluruh proses perizinan dasar berbiaya Rp 0,- (Gratis). Pembayaran retribusi resmi hanya melalui loket kas bank atau kanal QRIS.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {isEn ? '2. Strict SLA Completion' : isZh ? '2. 时限超期兜底保障 (SLA)' : '2. Jaminan Batas Waktu (SLA)'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {isEn ? 'Complete applications exceeding SLA receive prioritized handling and free document home-delivery.' : isZh ? '如申报材料齐全但超时未办结，申请人将享受专班特快通道及批件免费寄送到家补偿。' : 'Apabila permohonan lengkap melampaui batas SLA, pemohon berhak mendapatkan prioritas penyelesaian khusus.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {isEn ? '3. Inclusive & Non-Discriminatory' : isZh ? '3. 无障碍包容性无差别服务' : '3. Layanan Inklusif & Ramah Difabel'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {isEn ? 'Special assistance, low counters, and wheelchair access for persons with disabilities and seniors.' : isZh ? '为残障人士、长者及孕妇提供低位窗口、盲道指引及免排队直通帮办服务。' : 'Penyandang disabilitas, lansia, dan ibu hamil mendapatkan fasilitas loket meja rendah serta asistensi langsung.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:mt-4 z-20">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all text-sm text-center cursor-pointer active:scale-98"
            >
              {isEn ? 'I Understand / Close' : isZh ? '我已了解并关闭' : 'Saya Mengerti / Tutup'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default MaklumatModal;
