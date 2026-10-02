import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Building2, ArrowRight, Sparkles } from 'lucide-react';
import { LOCALIZED_AGENCIES } from '../../data/mppAgenciesData';

export interface TenantData {
  id?: string | number;
  name: string;
  description: string;
  logo: string;
  category?: string;
  loket?: string;
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
      category: item.category || item.kategori || 'Instansi Terpadu',
      loket: item.loket || `Gerai ${idx + 1}`,
      rawItem: item
    };
  });

  // Responsive items per view: 1 on mobile (<768px), 2 on tablet (768-1024px), 3 on desktop (>=1024px)
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }
    return 3;
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Handle dynamic screen resizing
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newCount = 1;
      if (width >= 1024) newCount = 3;
      else if (width >= 768) newCount = 2;
      
      setItemsPerPage((prev) => {
        if (prev !== newCount) {
          setCurrentPage(0); // Reset page on layout shift to prevent out of bounds
        }
        return newCount;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(formattedTenants.length / itemsPerPage);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentPage((prev) => (prev + 1) % Math.max(1, totalPages));
  }, [totalPages]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentPage((prev) => (prev - 1 + totalPages) % Math.max(1, totalPages));
  }, [totalPages]);

  // Auto-slide setiap 3.5 detik jika tidak di-pause
  useEffect(() => {
    if (isPaused || totalPages <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, totalPages, handleNext]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  // Sliced items for current visible page
  const startIndex = currentPage * itemsPerPage;
  const visibleTenants = formattedTenants.slice(startIndex, startIndex + itemsPerPage);

  // Animation variants for smooth horizontal sliding
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <section 
      id={id} 
      className={className || "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24 space-y-8 text-slate-900 dark:text-slate-100 scroll-mt-28"}
    >
      {/* 1. SECTION HEADER (STANDARDIZED TYPOGRAPHY & DUAL TONE) */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <div className="flex justify-center mb-2">
          <span className="px-3.5 py-1 rounded-full text-[11px] font-sans font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
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
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-emerald-500 rounded-full"></span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-center leading-relaxed">
          {formattedTenants.length} Instansi Pemerintah, BUMN/BUMD, dan Lembaga Pelayanan Publik terintegrasi melayani masyarakat dan investor di MPP Simpurusiang Kabupaten Luwu.
        </p>
      </div>

      {/* 2. CAROUSEL WRAPPER WITH NAVIGATION ARROWS */}
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Left Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Halaman Instansi Sebelumnya"
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Navigation Right Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Halaman Instansi Berikutnya"
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Animated Multi-Card Grid Container */}
        <div className="overflow-hidden px-1 py-2">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch"
            >
              {visibleTenants.map((tenant, idx) => (
                <div
                  key={tenant.id || idx}
                  className="relative p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between items-center text-center overflow-hidden group min-h-[300px]"
                >
                  {/* Top Glowing Accent Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-teal-500/0 group-hover:via-emerald-500 transition-all duration-500" />

                  {/* Active Status Badge Top Right */}
                  <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Loket Aktif
                  </div>

                  {/* Loket Number Tag Top Left */}
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      {tenant.loket}
                    </span>
                  </div>

                  {/* Logo Container with Smooth Micro-Interaction */}
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 flex items-center justify-center p-3.5 shadow-inner mt-4 group-hover:scale-105 group-hover:border-emerald-500/40 transition-all duration-300">
                    <img 
                      src={tenant.logo} 
                      alt={tenant.name} 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_LOGO;
                      }}
                    />
                  </div>

                  {/* Tenant Details */}
                  <div className="space-y-2 px-2 my-4 w-full">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {tenant.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {tenant.description}
                    </p>
                  </div>

                  {/* Card Action Button */}
                  <button 
                    type="button"
                    onClick={() => onSelectTenant?.(tenant.rawItem || tenant)}
                    className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer shadow-2xs group-hover:bg-emerald-600 group-hover:text-white"
                  >
                    <span>Buka Layanan Instansi</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. PAGINATION DOTS INDICATOR */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const isActive = idx === currentPage;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDirection(idx > currentPage ? 1 : -1);
                  setCurrentPage(idx);
                }}
                aria-label={`Buka halaman ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'w-8 bg-emerald-600 dark:bg-emerald-400 shadow-xs' 
                    : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* 4. PRIMARY BOTTOM ACTION BUTTON */}
      <div className="pt-2 max-w-md mx-auto">
        <button 
          type="button"
          onClick={onViewAll}
          className="w-full min-h-[48px] py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer group"
        >
          <Building2 className="w-4 h-4" />
          <span>Lihat Semua {formattedTenants.length} Instansi & Direktori Layanan</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default InstansiTergabungSection;
