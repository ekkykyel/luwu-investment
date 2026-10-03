import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileCheck2 } from 'lucide-react';
import { InteractiveRequirementStepper, RequirementServiceKey } from './InteractiveRequirementStepper';

export interface PanduanSyaratModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: RequirementServiceKey | string;
  onOpenQueueBooking?: (serviceName?: string, agencyName?: string) => void;
  isDark?: boolean;
}

export const PanduanSyaratModal: React.FC<PanduanSyaratModalProps> = ({
  isOpen,
  onClose,
  service = 'KTP_DUKCAPIL',
  onOpenQueueBooking,
  isDark = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-hidden font-sans"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    Checklist & Persyaratan Layanan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mal Pelayanan Publik Simpurusiang Kab. Luwu
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <InteractiveRequirementStepper 
                initialService={service}
                onOpenQueueBooking={onOpenQueueBooking}
                isDark={isDark}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PanduanSyaratModal;
