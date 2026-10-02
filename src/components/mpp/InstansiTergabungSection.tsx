import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Building2, ArrowRight } from 'lucide-react';
import { LOCALIZED_AGENCIES } from '../../data/mppAgenciesData';

export interface TenantData {
  id?: string | number;
  name: string;
  description: string;
  logo: string;
  rawItem?: any;
}

export interface InstansiTergabungSectionProps {
  tenants?: any[];
  onSelectTenant?: (tenant: any) => void;
  onViewAll?: () => void;
  className?: string;
  id?: string;
}

const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='24' fill='%2310b981' fill-opacity='0.15'/%3E%3Cpath d='M60 30L35 48V90H85V48L60 30Z' stroke='%23059669' stroke-width='6' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E";

export const InstansiTergabungSection: React.FC<InstansiTergabungSectionProps> = ({
  tenants: propTenants,
  onSelectTenant,
  onViewAll,
  className = '',
  id = 'instansi'
}) => {
  // Format data instansi
  const formattedTenants: TenantData[] = (propTenants && propTenants.length > 0 ? propTenants : LOCALIZED_AGENCIES).map((item: any, idx: number) => {
    return {
      id: item.id || idx,
      name: item.name || item.nama || 'Instansi MPP',
      description: item.description || item.layanan || item.deskripsi || 'Layanan publik dan perizinan terpadu',
      logo: item.logo || '/logos/dpmptsp.png',
      rawItem: item
    };
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Auto-slide setiap 5 detik jika tidak di-hover / disentuh
  useEffect(() => {
    if (isPaused || formattedTenants.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % formattedTenants.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, formattedTenants.length]);

  const currentTenant = formattedTenants[currentIndex] || formattedTenants[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % formattedTenants.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + formattedTenants.length) % formattedTenants.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  // Dots slice window agar tidak overflow saat ada 19 instansi (maksimal 7 dots)
  const maxVisibleDots = 7;
  const totalCount = formattedTenants.length;
  let startDot = Math.max(0, currentIndex - Math.floor(maxVisibleDots / 2));
  let endDot = startDot + maxVisibleDots;
  if (endDot > totalCount) {
    endDot = totalCount;
    startDot = Math.max(0, endDot - maxVisibleDots);
  }
  const visibleDotsIndices = Array.from({ length: endDot - startDot }, (_, i) => startDot + i);

  return (
    <section 
      id={id} 
      className={className || "relative w-full max-w-xl mx-auto px-4 pt-8 pb-28 space-y-6 text-slate-900 dark:text-slate-100 scroll-mt-28"}
    >
      {/* Subtle Dot-Grid Texture Accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.03] dark:opacity-[0.05] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* 2. SECTION HEADER WITH STANDARDIZED DUAL-TONE PATTERN */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
            Gerai Pelayanan Terpadu
          </span>
        </div>
        <div className="inline-block relative pb-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans text-center">
            Instansi Tergabung{" "}
            <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
              Layanan Prima
            </span>
          </h2>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-500 rounded-full"></span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-center leading-relaxed">
          Berbagai Instansi Pemerintah, BUMN/BUMD, dan Swasta yang siap memberikan pelayanan prima di MPP Simpurusiang Kabupaten Luwu.
        </p>
      </div>

      {/* 3. REDESIGNED TENANT CARD (KARTU INSTANSI) */}
      <div 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col items-center text-center overflow-hidden"
      >
        {/* Status Badge (Pojok Kanan Atas Kartu) */}
        <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Aktif
        </div>

        {/* Carousel Prev/Next Buttons (Subtle On Mobile/Desktop) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Instansi Sebelumnya"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-all cursor-pointer shadow-xs z-10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Instansi Berikutnya"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-all cursor-pointer shadow-xs z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Logo Container (Wadah Logo Clean & Glassmorphism) */}
        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 flex items-center justify-center p-3 shadow-inner mt-2">
          <img 
            src={currentTenant.logo} 
            alt={currentTenant.name} 
            className="max-h-full max-w-full object-contain"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_LOGO;
            }}
          />
        </div>

        {/* Tenant Details */}
        <div className="space-y-1 px-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">
            {currentTenant.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug max-w-[250px] mx-auto line-clamp-2">
            {currentTenant.description}
          </p>
        </div>

        {/* Card Action Button (Tombol Masuk Detail) */}
        <button 
          type="button"
          onClick={() => onSelectTenant?.(currentTenant.rawItem || currentTenant)}
          className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
        >
          <span>Lihat Layanan</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4. CAROUSEL PAGINATION INDICATOR */}
      <div className="flex justify-center items-center gap-1.5 pt-1">
        {visibleDotsIndices.map((idx) => {
          const isActive = idx === currentIndex;
          return isActive ? (
            <span 
              key={idx} 
              className="w-6 h-2 bg-emerald-600 rounded-full transition-all"
            />
          ) : (
            <span 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="w-2 h-2 bg-slate-200 dark:bg-slate-800 rounded-full transition-all cursor-pointer hover:bg-slate-300"
            />
          );
        })}
      </div>

      {/* 5. PRIMARY BOTTOM ACTION BUTTON */}
      <div className="pt-2">
        <button 
          type="button"
          onClick={onViewAll}
          className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Building2 className="w-4 h-4" />
          <span>Lihat Semua Instansi & Layanan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default InstansiTergabungSection;
