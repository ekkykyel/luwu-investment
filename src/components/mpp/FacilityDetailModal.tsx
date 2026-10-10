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
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-surface/60 backdrop-blur-sm overflow-y-auto font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative w-full max-w-3xl bg-white dark:bg-surface rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 max-h-[92dvh] md:max-h-[85dvh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header Foto Full-Bleed (Ditinggikan untuk Tampilan Android & Mobile Responsif) */}
          <div 
            onClick={() => onOpenFullscreenImage?.(facility.image, facility.name)}
            className="relative w-full overflow-hidden rounded-t-2xl md:rounded-t-3xl h-72 xs:h-80 sm:h-88 md:h-96 bg-base cursor-pointer group/modalimg shrink-0"
            title="Klik untuk melihat foto fasilitas dalam ukuran penuh"
          >
            <img
              src={facility.image}
              alt={facility.name}
              className="w-full h-full object-cover object-center group-hover/modalimg:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/30 pointer-events-none" />
            
            {/* Badge Tag Kiri Atas */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-emerald-300 text-xs font-black shadow-lg border border-white/20">
              <IconComponent className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
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
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-slate-700/80"
                aria-label="Lihat foto fasilitas ukuran penuh"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Foto Penuh</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/90 hover:bg-rose-600 text-white shadow-lg cursor-pointer active:scale-95 transition-all border border-slate-700/80"
                aria-label="Tutup"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Tag Lokasi Overlay Bawah Foto */}
            <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/85 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 shadow-lg">
              <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{facility.subtitle}</span>
              </p>
            </div>
          </div>

          {/* 2. Konten Teks & Informasi di Bawah Foto (Diberi Padding p-4 sm:p-6) */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <span className="inline-block px-3 py-1 bg-emerald-500/15 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black rounded-xl border border-emerald-500/30 tracking-wide uppercase mb-2 font-mono shadow-2xs">
                {facility.mppName || 'MPP Simpurusiang Kab. Luwu'}
              </span>
              
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {facility.name}
              </h3>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2.5 text-justify font-medium">
                {facility.description}
              </p>
            </div>

            {/* Kelengkapan Standar & Sarana */}
            {facility.features && facility.features.length > 0 && (
              <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Kelengkapan & Sarana Fasilitas</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {facility.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-slate-100/90 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 font-semibold shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-semibold leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Sticky Action Footer */}
          <div className="p-3.5 sm:p-4 bg-slate-100/90 dark:bg-surface/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-full sm:w-auto min-w-[150px] py-3 px-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black rounded-2xl transition-all text-center text-xs sm:text-sm shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Tutup Detail Fasilitas</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default FacilityDetailModal;
