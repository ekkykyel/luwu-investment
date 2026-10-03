import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MapPin, 
  Maximize2, 
  Sparkles, 
  CheckCircle2, 
  LucideIcon, 
  Armchair 
} from 'lucide-react';

export interface FacilityItem {
  id: string;
  name: string;
  shortName?: string;
  tag: string;
  subtitle: string;
  description: string;
  image: string;
  icon?: LucideIcon | any;
  features?: string[];
  mppName?: string;
}

export interface FacilityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: FacilityItem | null;
  onOpenFullscreenImage?: (imageUrl: string, title?: string) => void;
  isDark?: boolean;
}

export function FacilityDetailModal({
  isOpen,
  onClose,
  facility,
  onOpenFullscreenImage,
  isDark = false
}: FacilityDetailModalProps) {
  if (!isOpen || !facility) return null;

  const IconComponent = facility.icon || Armchair;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="w-full max-w-3xl mx-auto max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header Foto Full-Bleed (Menempel Sisi Kiri, Atas, Kanan Card) */}
          <div 
            onClick={() => onOpenFullscreenImage?.(facility.image, facility.name)}
            className="relative w-full overflow-hidden rounded-t-2xl aspect-[16/9] sm:aspect-[16/10] bg-slate-950 cursor-pointer group/modalimg shrink-0"
            title="Klik untuk melihat foto fasilitas dalam ukuran penuh"
          >
            <img
              src={facility.image}
              alt={facility.name}
              className="w-full h-full object-cover object-center group-hover/modalimg:scale-105 transition-transform duration-700 ease-out"
            />
            
            {/* Badge Tag Kiri Atas */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-emerald-400 text-xs font-semibold shadow-md border border-white/10">
              <IconComponent className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{facility.tag}</span>
            </div>

            {/* Tombol Perbesar Foto & Tombol Close (X) Kanan Atas */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFullscreenImage?.(facility.image, facility.name);
                }}
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-white/10"
                aria-label="Lihat foto fasilitas ukuran penuh"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Foto Penuh</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-white shadow-md cursor-pointer active:scale-95 transition-all border border-white/10"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tag Lokasi Overlay Bawah Foto */}
            <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/70 backdrop-blur-md text-white p-2.5 rounded-xl border border-white/10">
              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{facility.subtitle}</span>
              </p>
            </div>
          </div>

          {/* 2. Konten Teks & Informasi di Bawah Foto (Diberi Padding p-4 sm:p-6) */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg tracking-wide uppercase mb-2 font-mono">
                {facility.mppName || 'MPP Simpurusiang Kab. Luwu'}
              </span>
              
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {facility.name}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2.5 text-justify">
                {facility.description}
              </p>
            </div>

            {/* Kelengkapan Standar & Sarana */}
            {facility.features && facility.features.length > 0 && (
              <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Kelengkapan & Sarana Fasilitas</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {facility.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-medium leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Sticky Action Footer */}
          <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-w-[140px] py-2.5 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-center text-xs sm:text-sm shadow-md cursor-pointer active:scale-98"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default FacilityDetailModal;
