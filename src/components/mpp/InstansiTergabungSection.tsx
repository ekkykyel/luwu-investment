import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft, Building2, ArrowRight, Sparkles } from 'lucide-react';
import { LOCALIZED_AGENCIES } from '../../data/mppAgenciesData';
import { Badge } from '../common/Badge';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';
import { getImageUrl, handleImageError, getAgencyLogoScaleClass } from '../../utils/imageFallbacks';

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

const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23059669'/%3E%3Cpath d='M60 26L30 46V94H90V46L60 26Z' stroke='%23ffffff' stroke-width='6' stroke-linejoin='round' fill='%2310b981'/%3E%3Ccircle cx='60' cy='62' r='10' fill='%23ffffff'/%3E%3C/svg%3E";

export const InstansiTergabungSection: React.FC<InstansiTergabungSectionProps> = ({
  tenants: propTenants,
  onSelectTenant,
  onViewAll,
  className = '',
  id = 'instansi'
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

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
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2500);
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

  // Animation variants for smooth horizontal sliding with guaranteed 100% opacity
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 1,
      scale: 1
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 350, damping: 32 },
        opacity: { duration: 0.1 },
        scale: { duration: 0.1 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 350, damping: 32 },
        opacity: { duration: 0.1 }
      }
    })
  };

  return (
    <section 
      id={id} 
      className={className || "w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24 space-y-8 text-slate-900 dark:text-slate-100 scroll-mt-36 sm:scroll-mt-40"}
    >
      {/* 1. SECTION HEADER (STANDARDIZED ZERO-PILL EYEBROW & TYPOGRAPHY) */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-block`}>
          {isEn ? 'Integrated Service Counters' : isZh ? '综合政务大厅与窗口' : 'Gerai Pelayanan Terpadu'}
        </span>
        <h2 className={`${MPP_TYPOGRAPHY.sectionTitle} text-center`}>
          {isEn ? 'Participating ' : isZh ? '入驻服务机构 ' : 'Instansi Tergabung '}
          <span className="text-emerald-700 dark:text-emerald-500">
            {isEn ? 'Agencies & Institutions' : isZh ? '与卓越政务服务' : 'Layanan Prima'}
          </span>
        </h2>
        <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto text-center`}>
          {formattedTenants.length} {isEn ? 'Integrated Government Agencies, State Enterprises, and Public Institutions serving citizens and investors at Simpurusiang MPP, Luwu Regency.' : isZh ? '家入驻政府部门、国有企业及公共服务机构在鲁乌县 Simpurusiang 政务大厅为市民和投资者提供服务。' : 'Instansi Pemerintah, BUMN/BUMD, dan Lembaga Pelayanan Publik terintegrasi melayani masyarakat dan investor di MPP Simpurusiang Kabupaten Luwu.'}
        </p>
      </div>

      {/* 2. CAROUSEL WRAPPER WITH NAVIGATION ARROWS */}
      <div 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Left Button */}
        <button
          type="button"
          onClick={() => handleManualAction(handlePrev)}
          aria-label="Halaman Instansi Sebelumnya"
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-[#0F2D4A] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 flex items-center justify-center transition-all shadow-sm dark:shadow-none active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Navigation Right Button */}
        <button
          type="button"
          onClick={() => handleManualAction(handleNext)}
          aria-label="Halaman Instansi Berikutnya"
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-[#0F2D4A] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 flex items-center justify-center transition-all shadow-sm dark:shadow-none active:scale-95 cursor-pointer"
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
                <motion.div
                  key={tenant.id || idx}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.06, ease: "easeOut" }}
                  whileHover={shouldReduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
                  style={{ willChange: 'transform' }}
                  className={`relative ${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer1} hover:border-emerald-500/40 dark:hover:border-white/[0.14] transition-all duration-200 flex flex-col justify-between items-center text-center overflow-hidden group min-h-[310px] sm:min-h-[320px]`}
                >
                  {/* Top Bar: Loket Number Tag (Category Badge) & Active Status Badge */}
                  <div className="w-full flex items-center justify-between gap-2 mb-3">
                    <Badge variant="category" tone="neutral">
                      {tenant.loket}
                    </Badge>
                    <Badge variant="status" tone="primary">
                      {isEn ? 'Active Counter' : isZh ? '活跃窗口' : 'Loket Aktif'}
                    </Badge>
                  </div>

                  {/* Logo Container — Layer 2 (#143755), enlarged frame for high prominence and clarity */}
                  <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-2xl ${MPP_CARD_SURFACE.layer2} flex items-center justify-center p-2 sm:p-2.5 mt-1 group-hover:scale-105 group-hover:border-emerald-500/40 transition-all duration-200 overflow-hidden shadow-inner`}>
                    <img 
                      src={getImageUrl(tenant.logo, 'agency')} 
                      alt={tenant.name} 
                      className={`max-h-full max-w-full object-contain opacity-100 transition-transform duration-200 ${getAgencyLogoScaleClass(tenant.name)}`}
                      onError={(e) => handleImageError(e, 'agency')}
                    />
                  </div>

                  {/* Tenant Details — Standardized Card Title & Body (text-sm) */}
                  <div className="space-y-1.5 px-1 my-4 w-full">
                    <h3 className={`${MPP_TYPOGRAPHY.cardTitle} line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors`}>
                      {tenant.name}
                    </h3>
                    <p className={`${MPP_TYPOGRAPHY.cardBody} line-clamp-2`}>
                      {tenant.description}
                    </p>
                  </div>

                  {/* Card Action Button — Layer 2 hover to Primary */}
                  <button 
                    type="button"
                    onClick={() => onSelectTenant?.(tenant.rawItem || tenant)}
                    className={`w-full min-h-[42px] py-2.5 px-4 ${MPP_CARD_SURFACE.layer2} hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500`}
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
          className="w-full min-h-[48px] py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-black/25 hover:shadow-black/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer group"
        >
          <Building2 className="w-4 h-4" />
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
