import React from 'react';
import { 
  MapPin, 
  Maximize2, 
  Sparkles, 
  CheckCircle2, 
  Armchair 
} from 'lucide-react';
import { FacilityItem } from './FacilityDetailModal';

export interface FacilityCardProps {
  facility: FacilityItem;
  onSelect?: (facility: FacilityItem) => void;
  onOpenFullscreenImage?: (imageUrl: string, title?: string) => void;
  isDark?: boolean;
}

export function FacilityCard({
  facility,
  onSelect,
  onOpenFullscreenImage,
  isDark = false
}: FacilityCardProps) {
  const IconComponent = facility.icon || Armchair;

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-3">
      {/* Kartu Utama */}
      <div 
        onClick={() => onSelect?.(facility)}
        className="w-full bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 cursor-pointer"
      >
        {/* Foto Full-Bleed (Menempel Sisi Kiri, Atas, Kanan Card) */}
        <div className="relative w-full overflow-hidden rounded-t-2xl aspect-[16/9] sm:aspect-[16/10] bg-base">
          <img
            src={facility.image}
            alt={facility.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Badge Tag Top Left */}
          <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border border-white/20 shadow-lg">
            <IconComponent className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>{facility.tag}</span>
          </div>

          {/* Button Foto Penuh Top Right */}
          {onOpenFullscreenImage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullscreenImage(facility.image, facility.name);
              }}
              className="absolute top-3 right-3 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-slate-700/80 shadow-lg"
              aria-label="Lihat foto penuh"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Foto Penuh</span>
            </button>
          )}

          {/* Title Overlay Bottom Left / Right */}
          <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 shadow-lg">
            <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{facility.subtitle}</span>
            </p>
          </div>
        </div>

        {/* Konten Teks & Informasi di Bawah Foto (Baru Diberi Padding) */}
        <div className="p-4 sm:p-5 md:p-6 space-y-3.5 flex-1 flex flex-col justify-between">
          <div>
            <span className="inline-block px-3 py-1 bg-emerald-500/15 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black rounded-xl border border-emerald-500/30 tracking-wide uppercase mb-2 font-mono shadow-2xs">
              {facility.mppName || 'MPP Simpurusiang Kab. Luwu'}
            </span>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {facility.name}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 font-normal text-justify">
              {facility.description}
            </p>
          </div>

          {/* Kelengkapan Standar & Sarana */}
          {facility.features && facility.features.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-[11px] sm:text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300 font-bold mb-2.5 flex items-center gap-1.5 font-sans">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sarana & Kelengkapan</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {facility.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 text-left font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="break-words">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FacilityCard;
