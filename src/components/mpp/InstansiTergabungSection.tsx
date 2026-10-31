import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft, Building2, ArrowRight } from 'lucide-react';
import { LOCALIZED_AGENCIES } from '../../data/mppAgenciesData';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';
import { AgencyLogo } from '../common/AgencyLogo';

export interface TenantData {
  id?: string | number;
  name: string;
  fullName?: string;
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

export const InstansiTergabungSection: React.FC<InstansiTergabungSectionProps> = ({
  tenants: propTenants,
  onSelectTenant,
  onViewAll,
  className = '',
  id = 'instansi'
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n?.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  // Format data instansi with short name for card display and full name for details
  const formattedTenants: TenantData[] = (propTenants && propTenants.length > 0 ? propTenants : LOCALIZED_AGENCIES).map((item: any, idx: number) => {
    const shortName = item.namaSingkat || item.short_name || item.code || item.nama || item.name || 'Instansi MPP';
    const fullName = item.namaResmi || item.full_name || item.fullName || item.name || item.nama || shortName;
    const rawLoket = String(item.loket || '').trim();
    const geraiNum = String(idx + 1).padStart(2, '0');
    const formattedLoket = !rawLoket
      ? `Gerai ${geraiNum}`
      : /gerai|loket/i.test(rawLoket)
        ? rawLoket
        : `Gerai ${geraiNum} · ${rawLoket}`;

    return {
      id: item.id || idx,
      name: shortName,
      fullName: fullName,
      description: item.description || item.layanan || item.deskripsi || 'Layanan publik dan perizinan terpadu',
      logo: item.logo || '',
      category: item.category || item.kategori || 'Instansi Terpadu',
      loket: formattedLoket,
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

  const shouldReduceMotion = useReducedMotion();
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentPage((prev) => (prev + 1) % Math.max(1, totalPages));
  }, [totalPages]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentPage((prev) => (prev - 1 + totalPages) % Math.max(1, totalPages));
  }, [totalPages]);

  const handleManualAction = (action: () => void) => {
    setIsPaused(true);
    action();
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 4000);
  };

  // Smooth Auto-scroll Marquee (3.5s interval) with auto-pause & resume
  useEffect(() => {
    if (isPaused || shouldReduceMotion || totalPages <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, shouldReduceMotion, totalPages, handleNext]);

  const handleMouseEnter = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    setIsPaused(false);
  };

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const diff = touchStartXRef.current - e.changedTouches[0].clientX;
      if (diff > 45) {
        handleNext();
      } else if (diff < -45) {
        handlePrev();
      }
      touchStartXRef.current = null;
    }
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  // Sliced items for current visible page
  const startIndex = currentPage * itemsPerPage;
  const visibleTenants = formattedTenants.slice(startIndex, startIndex + itemsPerPage);

  // Smooth sliding animation
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.99,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 240, damping: 26, mass: 0.75 },
        opacity: { duration: 0.3, ease: 'easeOut' as const },
        scale: { duration: 0.3, ease: 'easeOut' as const },
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.99,
      transition: {
        x: { type: 'spring' as const, stiffness: 240, damping: 26, mass: 0.75 },
        opacity: { duration: 0.2, ease: 'easeIn' as const },
        scale: { duration: 0.2, ease: 'easeIn' as const },
      }
    })
  };

  // Current counter label (e.g. "1 / 20" or "17 / 20" or "1–3 / 20")
  const currentCountDisplay = itemsPerPage === 1 
    ? `${currentPage + 1} / ${formattedTenants.length}`
    : `${Math.min((currentPage + 1) * itemsPerPage, formattedTenants.length)} / ${formattedTenants.length}`;

  const progressPercent = Math.min(100, Math.round(((currentPage + 1) / totalPages) * 100));

  return (
    <section 
      id={id} 
      className={className || "w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20 space-y-7 text-slate-900 dark:text-slate-100 scroll-mt-36 sm:scroll-mt-40"}
    >
      {/* 1. SECTION HEADER (STANDARDIZED ZERO-PILL EYEBROW & SULAPA EPPA ACCENT) */}
      <div className="text-center space-y-2.5 max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B]" aria-hidden="true" />
          <span className={MPP_TYPOGRAPHY.eyebrow}>
            {isEn ? 'Integrated Service Counters' : isZh ? '综合政务大厅与窗口' : 'Gerai Pelayanan Terpadu'}
          </span>
          <span className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B]" aria-hidden="true" />
        </div>
        <h2 className={`${MPP_TYPOGRAPHY.sectionTitle} text-center`}>
          {isEn ? 'Participating ' : isZh ? '入驻服务机构 ' : 'Instansi Tergabung '}
          <span className="font-serif-display italic font-semibold text-[#0F6B4F] dark:text-[#E2C475]">
            {isEn ? 'Agencies & Institutions' : isZh ? '与卓越政务服务' : 'Layanan Prima'}
          </span>
        </h2>
        <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto text-center`}>
          {formattedTenants.length} {isEn ? 'Integrated Government Agencies, State Enterprises, and Public Institutions serving citizens and investors at Simpurusiang MPP, Luwu Regency.' : isZh ? '家入驻政府部门、国有企业及公共服务机构在鲁乌县 Simpurusiang 政务大厅为市民和投资者提供服务。' : 'Instansi Pemerintah, BUMN/BUMD, dan Lembaga Pelayanan Publik terintegrasi melayani masyarakat dan investor di MPP Simpurusiang Kabupaten Luwu.'}
        </p>
      </div>

      {/* 2. CAROUSEL WRAPPER WITH NAVIGATION */}
      <div 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Left Button — Visible on desktop outside of cards; touch devices use swipe & bottom controls */}
        <button
          type="button"
          onClick={() => handleManualAction(handlePrev)}
          aria-label="Halaman Instansi Sebelumnya"
          className="hidden md:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-xl bg-[#F4F0E6] hover:bg-[#ECE5D6] dark:bg-[#0F2D4A] border border-[#E2DACB] dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Navigation Right Button — Visible on desktop outside of cards */}
        <button
          type="button"
          onClick={() => handleManualAction(handleNext)}
          aria-label="Halaman Instansi Berikutnya"
          className="hidden md:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-xl bg-[#F4F0E6] hover:bg-[#ECE5D6] dark:bg-[#0F2D4A] border border-[#E2DACB] dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Animated Multi-Card Grid Container */}
        <div className="overflow-hidden px-1 py-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 items-stretch"
            >
              {visibleTenants.map((tenant, idx) => (
                <motion.div
                  key={tenant.id || idx}
                  whileHover={shouldReduceMotion ? undefined : { y: -4, transition: { duration: 0.18, ease: "easeOut" } }}
                  style={{ willChange: 'transform' }}
                  className={`relative p-4 sm:p-5 ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer1} hover:border-emerald-500/40 dark:hover:border-white/[0.14] transition-all duration-200 flex flex-col justify-between items-center text-center overflow-hidden group min-h-[280px] sm:min-h-[295px]`}
                >
                  {/* Top Metadata Line: Clean unboxed Gerai number & Active Counter status */}
                  <div className="w-full flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-[#E2DACB] dark:border-white/[0.06] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="tracking-wide uppercase text-[#8A6218] dark:text-[#E2C475] font-bold">
                      {tenant.loket}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#0F6B4F] dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F6B4F] dark:bg-emerald-400" aria-hidden="true" />
                      {isEn ? 'Active Counter' : isZh ? '活跃窗口' : 'Loket Aktif'}
                    </span>
                  </div>

                  {/* Standardized Agency Logo (Token --logo-card: 112px, pure white, 1:1, 10% padding) */}
                  <div className="my-1.5 group-hover:scale-105 transition-transform duration-300">
                    <AgencyLogo 
                      name={tenant.name} 
                      logo={tenant.logo} 
                      size="card"
                      rounded="2xl"
                    />
                  </div>

                  {/* Tenant Details — Short name on card, clean typography */}
                  <div className="space-y-1 px-1 my-2.5 w-full">
                    <h3 className={`${MPP_TYPOGRAPHY.cardTitle} line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors`}>
                      {tenant.name}
                    </h3>
                    <p className={`${MPP_TYPOGRAPHY.cardBody} line-clamp-2 text-xs text-slate-500 dark:text-slate-400`}>
                      {tenant.description}
                    </p>
                  </div>

                  {/* Card Action Button */}
                  <button 
                    type="button"
                    onClick={() => onSelectTenant?.(tenant.rawItem || tenant)}
                    className={`w-full min-h-[40px] py-2 px-3 ${MPP_CARD_SURFACE.layer2} hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500`}
                  >
                    <span>{isEn ? 'Open Agency Services' : isZh ? '查看机构服务' : 'Buka Layanan Instansi'}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. PROGRESS BAR & COUNTER INDICATOR (Replacing 20 dots with "17 / 20" + progress line) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-md mx-auto pt-1 px-2">
          {/* Mobile Navigation Arrows (Placed safely below card, zero overlap) */}
          <div className="flex md:hidden items-center gap-2 order-2 sm:order-1">
            <button
              type="button"
              onClick={() => handleManualAction(handlePrev)}
              aria-label="Sebelumnya"
              className="w-10 h-10 rounded-xl bg-[#F4F0E6] hover:bg-[#ECE5D6] dark:bg-[#0F2D4A] border border-[#E2DACB] dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-emerald-600 flex items-center justify-center shadow-xs active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleManualAction(handleNext)}
              aria-label="Selanjutnya"
              className="w-10 h-10 rounded-xl bg-[#F4F0E6] hover:bg-[#ECE5D6] dark:bg-[#0F2D4A] border border-[#E2DACB] dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-emerald-600 flex items-center justify-center shadow-xs active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar & Numerical Counter */}
          <div className="w-full flex items-center gap-3 order-1 sm:order-2">
            <div className="flex-1 bg-[#E2DACB] dark:bg-slate-700/80 h-1.5 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0 select-none">
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentCountDisplay}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRIMARY BOTTOM ACTION BUTTON */}
      <div className="pt-2 max-w-md mx-auto">
        <button 
          type="button"
          onClick={onViewAll}
          className="w-full min-h-[48px] py-3.5 px-6 bg-[#0F6B4F] hover:bg-[#0C5941] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-[0_10px_24px_-8px_rgba(15,107,79,0.45)] border border-[#C9A24B]/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer group"
        >
          <Building2 className="w-4 h-4 text-[#E2C475] dark:text-white" />
          <span>
            {isEn ? `View All ${formattedTenants.length} Agencies & Service Directory` : isZh ? `查看全部 ${formattedTenants.length} 家机构与服务目录` : `Lihat Semua ${formattedTenants.length} Instansi & Direktori Layanan`}
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default InstansiTergabungSection;
