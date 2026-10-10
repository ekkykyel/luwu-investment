import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft, Building2, ArrowRight, Play, Pause } from 'lucide-react';
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

  // Format data instansi (Single Source of Truth dari Supabase / fallback terstruktur)
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

  const totalItems = formattedTenants.length;

  // Responsive items per view: 1 on mobile (<768px), 2 on tablet (768-1023px), 3 on desktop (>=1024px)
  const [itemsPerView, setItemsPerView] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }
    return 3;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isManualPause, setIsManualPause] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Handle dynamic screen resizing cleanly via matchMedia
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      const nextCount = width >= 1024 ? 3 : width >= 768 ? 2 : 1;
      setItemsPerView(nextCount);
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView, { passive: true });
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, totalItems - itemsPerView);
  const canSlide = maxIndex > 0;
  const clampedIndex = Math.min(activeIndex, maxIndex);

  const handleNext = useCallback(() => {
    if (!canSlide) return;
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [canSlide, maxIndex]);

  const handlePrev = useCallback(() => {
    if (!canSlide) return;
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [canSlide, maxIndex]);

  // Lightweight Auto-Slide (every 3.8 seconds, pauses on hover/touch or manual pause)
  useEffect(() => {
    if (isPaused || isManualPause || shouldReduceMotion || !canSlide) return;
    const timer = setInterval(handleNext, 3800);
    return () => clearInterval(timer);
  }, [isPaused, isManualPause, shouldReduceMotion, canSlide, handleNext]);

  // Touch Swipe Handlers for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const diff = touchStartXRef.current - e.changedTouches[0].clientX;
      if (diff > 40) {
        handleNext();
      } else if (diff < -40) {
        handlePrev();
      }
      touchStartXRef.current = null;
    }
    setIsPaused(false);
  };

  const translatePercentage = -(clampedIndex * (100 / itemsPerView));

  return (
    <section
      id={id}
      className={className || "w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24 space-y-8 text-slate-900 dark:text-slate-100 scroll-mt-36 sm:scroll-mt-40"}
    >
      {/* 1. SECTION HEADER */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-block`}>
          {isEn ? 'Integrated Service Counters' : isZh ? '综合政务大厅与窗口' : 'Gerai Pelayanan Terpadu'}
        </span>
        <h2 className={`${MPP_TYPOGRAPHY.sectionTitle} text-center`}>
          {isEn ? 'Participating ' : isZh ? '入驻服务机构 ' : 'Instansi Tergabung '}
          <span className="text-emerald-700 dark:text-emerald-400">
            {isEn ? 'Agencies & Institutions' : isZh ? '与卓越政务服务' : 'Layanan Prima'}
          </span>
        </h2>
        <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto text-center`}>
          {formattedTenants.length}{' '}
          {isEn
            ? 'Integrated Government Agencies, State Enterprises, and Public Institutions serving citizens and investors at Simpurusiang MPP, Luwu Regency.'
            : isZh
            ? '家入驻政府部门、国有企业及公共服务机构在鲁乌县 Simpurusiang 政务大厅为市民和投资者提供服务。'
            : 'Instansi Pemerintah, BUMN/BUMD, dan Lembaga Pelayanan Publik terintegrasi melayani masyarakat dan investor di MPP Simpurusiang Kabupaten Luwu.'}
        </p>
      </div>

      {/* 2. LIGHTWEIGHT GPU-ACCELERATED CAROUSEL TRACK */}
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
          aria-label="Instansi Sebelumnya"
          className="absolute -left-2 sm:-left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/95 dark:bg-[#0F2D4A]/95 backdrop-blur-md border border-slate-200/90 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 hover:scale-105 flex items-center justify-center transition-all shadow-md dark:shadow-lg active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Navigation Right Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Instansi Berikutnya"
          className="absolute -right-2 sm:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/95 dark:bg-[#0F2D4A]/95 backdrop-blur-md border border-slate-200/90 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 hover:scale-105 flex items-center justify-center transition-all shadow-md dark:shadow-lg active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Viewport Mask */}
        <div className="overflow-hidden -mx-2.5 lg:-mx-3 px-1 py-3">
          <div
            style={{
              transform: `translate3d(${translatePercentage}%, 0, 0)`,
              transition: shouldReduceMotion
                ? 'none'
                : 'transform 520ms cubic-bezier(0.25, 1, 0.5, 1)'
            }}
            className="flex items-stretch w-full will-change-transform"
          >
            {formattedTenants.map((tenant, idx) => (
              <div
                key={tenant.id || idx}
                style={{
                  flex: `0 0 ${100 / itemsPerView}%`,
                  maxWidth: `${100 / itemsPerView}%`
                }}
                className="px-2.5 lg:px-3 box-border flex"
              >
                <div
                  onClick={() => onSelectTenant?.(tenant.rawItem || tenant)}
                  className={`w-full relative ${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer1} hover:border-emerald-500/50 dark:hover:border-emerald-400/35 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between items-center text-center overflow-hidden group min-h-[300px] sm:min-h-[315px] cursor-pointer`}
                >
                  {/* Subtle Top Ambient Highlight */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/[0.04] dark:from-emerald-400/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Top Bar: Loket Tag & Active Counter Status */}
                  <div className="w-full flex items-center justify-between gap-2 mb-3 relative z-10">
                    <Badge variant="category" tone="neutral">
                      {tenant.loket}
                    </Badge>
                    <Badge variant="status" tone="primary">
                      {isEn ? 'Active Counter' : isZh ? '活跃窗口' : 'Loket Aktif'}
                    </Badge>
                  </div>

                  {/* Theme-Adaptive Logo Pedestal (Follows Light/Dark Theme Surface Tokens) */}
                  <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl ${MPP_CARD_SURFACE.layer2} ring-1 ring-slate-900/[0.03] dark:ring-white/[0.05] shadow-sm flex items-center justify-center p-3 mt-1 group-hover:scale-105 group-hover:shadow-md group-hover:border-emerald-500/40 transition-all duration-300 overflow-hidden relative z-10`}>
                    <img
                      src={getImageUrl(tenant.logo, 'agency')}
                      alt={tenant.name}
                      loading="lazy"
                      className={`max-h-full max-w-full object-contain transition-transform duration-300 dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.14)] ${getAgencyLogoScaleClass(tenant.name)}`}
                      onError={(e) => handleImageError(e, 'agency')}
                    />
                  </div>

                  {/* Tenant Details */}
                  <div className="space-y-1.5 px-1 my-4 w-full relative z-10">
                    <h3 className={`${MPP_TYPOGRAPHY.cardTitle} line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors`}>
                      {tenant.name}
                    </h3>
                    <p className={`${MPP_TYPOGRAPHY.cardBody} line-clamp-2`}>
                      {tenant.description}
                    </p>
                  </div>

                  {/* Card Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTenant?.(tenant.rawItem || tenant);
                    }}
                    className={`w-full min-h-[42px] py-2.5 px-4 ${MPP_CARD_SURFACE.layer2} text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.99] cursor-pointer group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-600 dark:group-hover:text-white group-hover:border-emerald-500 relative z-10`}
                  >
                    <span>{isEn ? 'Open Agency Services' : isZh ? '查看机构服务' : 'Buka Layanan Instansi'}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MODERN INTERACTIVE PROGRESS & CONTROL BAR */}
      {canSlide && (
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-1">
          {/* Play / Pause Auto-Slide Toggle */}
          <button
            type="button"
            onClick={() => setIsManualPause((prev) => !prev)}
            aria-label={isManualPause ? 'Putar Otomatis Slide' : 'Jeda Slide'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#0F2D4A] border border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            {isManualPause ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isEn ? 'Auto-Slide Off' : isZh ? '已暂停轮播' : 'Slide Dijeda'}</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>{isEn ? 'Auto-Slide' : isZh ? '自动轮播中' : 'Bergeser Otomatis'}</span>
              </>
            )}
          </button>

          {/* Compact Segmented Dots Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100/80 dark:bg-[#0F2D4A]/80 border border-slate-200/80 dark:border-white/10">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => {
              const isCurrent = idx === clampedIndex;
              const tenant = formattedTenants[idx];
              return (
                <button
                  key={tenant?.id || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  title={tenant?.name || `Slide ${idx + 1}`}
                  aria-label={`Tampilkan ${tenant?.name || `Slide ${idx + 1}`}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'w-7 bg-emerald-600 dark:bg-emerald-400'
                      : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                  }`}
                />
              );
            })}
          </div>

          {/* Numeric Counter */}
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 tabular-nums">
            {String(clampedIndex + 1).padStart(2, '0')} / {String(maxIndex + 1).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* 4. PRIMARY BOTTOM ACTION BUTTON */}
      <div className="pt-2 max-w-md mx-auto">
        <button
          type="button"
          onClick={onViewAll}
          className="w-full min-h-[48px] py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer group"
        >
          <Building2 className="w-4 h-4" />
          <span>
            {isEn
              ? `View All ${formattedTenants.length} Agencies & Service Directory`
              : isZh
              ? `查看全部 ${formattedTenants.length} 家机构与服务目录`
              : `Lihat Semua ${formattedTenants.length} Instansi & Direktori Layanan`}
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default InstansiTergabungSection;
