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
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm overflow-y-auto font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className={`relative w-full max-w-xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[85dvh] border ${
            isDark
              ? 'bg-[#0A2238] border-slate-800 text-slate-100'
              : 'bg-white border-slate-300 text-slate-900'
          }`}
          style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle Indicator */}
          <div className={`w-12 h-1.5 rounded-full mx-auto my-2.5 sm:hidden shrink-0 ${
            isDark ? 'bg-slate-700' : 'bg-slate-300'
          }`} />

          {/* Header Container */}
          <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 backdrop-blur-md ${
            isDark ? 'bg-[#0A2238]/95 border-slate-800' : 'bg-white/95 border-slate-200'
          }`}>
            <div className="flex flex-col min-w-0">
              <span className={`text-[10px] font-bold font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full w-fit mb-1 border ${
                isDark 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' 
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                HALAMAN: MODAL PIAGAM MAKLUMAT PELAYANAN
              </span>
              <h3 
                className="text-base sm:text-lg font-extrabold truncate"
                style={{ color: isDark ? '#ffffff' : '#0f172a' }}
              >
                {isEn ? 'Service Delivery Charter' : isZh ? '政务履职公开承诺' : 'Maklumat Pelayanan Publik'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
                isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
              aria-label="Tutup maklumat pelayanan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body & Maklumat Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24 sm:pb-6 scrollbar-thin">
            {/* Status & SLA Indicator */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border mb-3 ${
              isDark 
                ? 'bg-blue-950/60 text-blue-300 border-blue-800' 
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span style={{ color: isDark ? '#93c5fd' : '#1e3a8a' }}>
                {isEn 
                  ? 'SLA Compliance Rate: 98.4% (Law No. 25/2009)' 
                  : isZh 
                    ? 'SLA达标履约率: 98.4% (第25/2009号法案)' 
                    : 'Tingkat Kepatuhan SLA: 98.4% (UU No. 25/2009)'}
              </span>
            </div>

            {/* Official Pledge Quote Card */}
            <div className={`relative p-5 rounded-2xl border shadow-sm overflow-hidden ${
              isDark
                ? 'bg-slate-800/80 border-slate-700/80'
                : 'bg-emerald-50/90 border-emerald-300/80 shadow-md'
            }`}>
              <Quote className={`absolute right-3 bottom-3 w-16 h-16 pointer-events-none ${
                isDark ? 'text-emerald-400/10' : 'text-emerald-600/10'
              }`} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2 font-mono text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isEn ? 'OFFICIAL DECLARATION PLEDGE' : isZh ? '法定公开承诺正文' : 'PERNYATAAN MAKLUMAT RESMI'}</span>
                </div>
                <p 
                  className="text-xs sm:text-sm md:text-base font-extrabold italic leading-relaxed font-serif tracking-wide"
                  style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                >
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
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                    {isEn ? '1. Zero-Fee Transparency' : isZh ? '1. 规范零规费与价格透明' : '1. Anti-Pungli & Nol Biaya Ilegal'}
                  </h4>
                  <p className="text-[11px] sm:text-xs font-medium mt-0.5 leading-relaxed" style={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                    {isEn ? 'All core administrative permits are Rp 0,- (Free). Retributions are handled solely via official bank tellers or QRIS.' : isZh ? '基础行政审批均为零收费（免费）。法定税费一律由银行窗口或官方QRIS收缴。' : 'Seluruh proses perizinan dasar berbiaya Rp 0,- (Gratis). Pembayaran retribusi resmi hanya melalui loket kas bank atau kanal QRIS.'}
                  </p>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                    {isEn ? '2. Strict SLA Completion' : isZh ? '2. 时限超期兜底保障 (SLA)' : '2. Jaminan Batas Waktu (SLA)'}
                  </h4>
                  <p className="text-[11px] sm:text-xs font-medium mt-0.5 leading-relaxed" style={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                    {isEn ? 'Complete applications exceeding SLA receive prioritized handling and free document home-delivery.' : isZh ? '如申报材料齐全但超时未办结，申请人将享受专班特快通道及批件免费寄送到家补偿。' : 'Apabila permohonan lengkap melampaui batas SLA, pemohon berhak mendapatkan prioritas penyelesaian khusus.'}
                  </p>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                    {isEn ? '3. Inclusive & Non-Discriminatory' : isZh ? '3. 无障碍包容性无差别服务' : '3. Layanan Inklusif & Ramah Difabel'}
                  </h4>
                  <p className="text-[11px] sm:text-xs font-medium mt-0.5 leading-relaxed" style={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                    {isEn ? 'Special assistance, low counters, and wheelchair access for persons with disabilities and seniors.' : isZh ? '为残障人士、长者及孕妇提供低位窗口、盲道指引及免排队直通帮办服务。' : 'Penyandang disabilitas, lansia, dan ibu hamil mendapatkan fasilitas loket meja rendah serta asistensi langsung.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className={`p-4 border-t shrink-0 sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:mt-4 z-20 ${
            isDark ? 'bg-[#0A2238]/95 border-slate-800' : 'bg-white/95 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm text-center cursor-pointer active:scale-98"
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
