import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Headphones, 
  X, 
  Ticket, 
  Sparkles, 
  ShieldAlert, 
  Phone, 
  ChevronUp, 
  Mic 
} from 'lucide-react';

export interface GlobalHelpdeskFabProps {
  onOpenQueueBooking?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const GlobalHelpdeskFab: React.FC<GlobalHelpdeskFabProps> = ({
  onOpenQueueBooking,
  onOpenAiAssistant,
  onOpenVoiceAssistant,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col items-end gap-3 pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="p-3 bg-white/95 dark:bg-surface/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col gap-2 min-w-[220px]"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isEn ? 'Help Center & Fast Contacts' : isZh ? '帮助中心与快捷联系' : 'Pusat Bantuan & Kontak Cepat'}
            </div>

            {/* Action 1: Antrean Booking */}
            {onOpenQueueBooking && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenQueueBooking();
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">{isEn ? 'Get Queue Ticket' : isZh ? '取号排队' : 'Ambil Antrean'}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{isEn ? 'Digital ticket without waiting' : isZh ? '免排队电子排队票' : 'Tiket layanan tanpa antre'}</div>
                </div>
              </button>
            )}

            {/* Action 2: AI Konsultasi */}
            {onOpenAiAssistant && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAiAssistant();
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">{t('assistant.quick_ask', isEn ? 'AI Permit Consultation' : isZh ? 'AI 许可咨询' : 'AI Konsultasi Izin')}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{isEn ? 'Instant requirement check' : isZh ? '即时查询审批条件' : 'Cek syarat & berkas instan'}</div>
                </div>
              </button>
            )}

            {/* Action 3: Suara Voice AI */}
            {onOpenVoiceAssistant && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenVoiceAssistant();
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">{isEn ? 'AI Voice Assistant' : isZh ? 'AI 语音助手' : 'Asisten Suara AI'}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{isEn ? 'Voice Q&A' : isZh ? '语音问答交互' : 'Tanya jawab suara'}</div>
                </div>
              </button>
            )}

            {/* Action 4: Pengaduan SP4N-LAPOR */}
            <a
              href="#pengaduan"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white">Pengaduan WBS</div>
                <div className="text-[10px] text-slate-400 font-normal">SP4N-LAPOR! & Pungli</div>
              </div>
            </a>

            {/* Action 5: WhatsApp Hotline */}
            <a
              href="https://wa.me/628114211119"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white">WhatsApp Helpdesk</div>
                <div className="text-[10px] text-slate-400 font-normal">0811-4211-119</div>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {/* Back to top button */}
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={scrollToTop}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-95"
            title="Kembali ke atas"
            aria-label="Kembali ke atas"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}

        {/* Main FAB Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-center text-white transition-all transform active:scale-90 cursor-pointer ${
            isOpen
              ? 'bg-slate-800 dark:bg-slate-700 rotate-90 shadow-slate-900/30'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-black/25 hover:scale-105'
          }`}
          title="Pusat Bantuan & Kontak Cepat"
          aria-label="Toggle Helpdesk Floating Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
};

export default GlobalHelpdeskFab;
