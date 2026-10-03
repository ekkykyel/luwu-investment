import React from 'react';
import { motion } from 'framer-motion';

export interface MobileLayoutProps {
  children?: React.ReactNode;
  
  // Header Props
  /** Title text or custom React element */
  title?: React.ReactNode;
  /** Title prefix for dual-tone title (e.g. "Pelayanan Publik") */
  titlePrefix?: string;
  /** Title accent for dual-tone title (e.g. "MPP Simpurusiang") */
  titleAccent?: string;
  /** Badge kicker text (e.g. "PEMKAB LUWU • MPP DIGITAL SIMPURUSIANG") */
  badgeText?: string;
  /** Subtitle or kicker text under title */
  subtitle?: string;
  /** Custom action elements on the right of the sticky header */
  headerActions?: React.ReactNode;
  /** Optional back button click handler */
  onBack?: () => void;
  /** Custom logo or icon on the left of header */
  headerLogo?: React.ReactNode;
  /** Whether to show status badge (e.g. "Aktif" pulse pill) */
  statusBadge?: React.ReactNode;
  /** Whether to show top sticky header (defaults to true) */
  showHeader?: boolean;
  
  // Navigation Props
  /** Whether to hide bottom navigation bar */
  hideBottomNav?: boolean;
  /** Currently active nav tab ID ('beranda' | 'layanan' | 'antrean' | 'instansi' | custom) */
  activeNavTab?: string;
  /** Callback when bottom nav tab is clicked */
  onNavTabChange?: (tab: string) => void;
  /** Custom bottom nav bar override */
  customBottomNav?: React.ReactNode;
  
  // Styling Props
  /** Custom class names for main content area */
  mainClassName?: string;
  /** Custom class names for outer container */
  containerClassName?: string;
  /** Extra utility class name */
  className?: string;
  /** Whether dark mode is active */
  isDark?: boolean;
}

/**
 * Standardized Master MobileLayout Component
 * Single Source of Truth for Android & Mobile Web Layouts in Luwu Investment App.
 *
 * Features:
 * - Responsive Sticky Header with Back Button, Logo, Title, and Action Slots
 * - Hero/Badge Kicker Section with Dual-Tone Title
 * - Main Scrollable Content Area with Safe-Area Clearance
 * - Accessible Fixed Bottom Navigation Bar (4-Tab GovTech Pattern with CTA Emphasis)
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  titlePrefix = "Pelayanan Publik",
  titleAccent = "MPP Simpurusiang",
  badgeText = "PEMKAB LUWU • MPP DIGITAL SIMPURUSIANG",
  subtitle = "Pusat pelayanan terpadu satu pintu Kabupaten Luwu yang cepat, transparan, dan terintegrasi.",
  headerActions,
  onBack,
  headerLogo,
  statusBadge,
  showHeader = true,
  hideBottomNav = false,
  activeNavTab = "beranda",
  onNavTabChange,
  customBottomNav,
  mainClassName = '',
  containerClassName = '',
  className = '',
}) => {
  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white ${containerClassName} ${className}`}>
      
      {/* 1. STICKY TOP HEADER */}
      {showHeader && (
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
            {/* Left Zone: Back Button / Logo / Header Title */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Kembali"
                  className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : (
                headerLogo || (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-extrabold text-xs shadow-xs shrink-0">
                    MPP
                  </div>
                )
              )}

              {title ? (
                <div className="flex flex-col min-w-0 truncate">
                  <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate tracking-tight font-sans">
                    {title}
                  </div>
                  {subtitle && (
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {subtitle}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col min-w-0 truncate">
                  <h1 className="text-sm font-extrabold text-slate-900 dark:text-white leading-none font-sans truncate">
                    MPP Simpurusiang
                  </h1>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-sans truncate">
                    Regional GRP Platform • Pemkab Luwu
                  </span>
                </div>
              )}
            </div>

            {/* Right Zone: Header Action Controls / Status Badge */}
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              {statusBadge || (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Aktif
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <main className={`relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+128px)] space-y-6 block ${mainClassName}`}>
        {/* HERO / BADGE FLOW LAYOUT */}
        {(titlePrefix || badgeText) && !title && (
          <div className="flex flex-col items-start gap-2.5 w-full bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {badgeText && (
              <div className="flex flex-wrap gap-1.5 items-center w-full">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] xs:text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 font-sans whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                  {badgeText.includes('•') ? (
                    <>
                      <span>{badgeText.split('•')[0].trim()}</span>
                      <span className="opacity-50 text-[8px]">•</span>
                      <span className="truncate">{badgeText.split('•')[1].trim()}</span>
                    </>
                  ) : (
                    badgeText
                  )}
                </span>
              </div>
            )}

            {/* DUAL-TONE GRADIENT TITLE */}
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight mt-1 font-sans">
              {titlePrefix}{" "}
              <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
                {titleAccent}
              </span>
            </h2>

            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed font-sans">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </main>

      {/* 3. FIXED BOTTOM NAVIGATION BAR */}
      {!hideBottomNav && (
        customBottomNav || (
          <nav 
            aria-label="Navigasi utama mobile"
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg pb-[calc(env(safe-area-inset-bottom,0px)+8px)] md:hidden"
          >
            <button
              type="button"
              onClick={() => onNavTabChange && onNavTabChange('beranda')}
              aria-current={activeNavTab === 'beranda' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] xs:text-xs font-bold font-sans cursor-pointer transition-all active:scale-95 ${
                activeNavTab === 'beranda'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Beranda</span>
            </button>

            <button
              type="button"
              onClick={() => onNavTabChange && onNavTabChange('layanan')}
              aria-current={activeNavTab === 'layanan' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] xs:text-xs font-bold font-sans cursor-pointer transition-all active:scale-95 ${
                activeNavTab === 'layanan'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Layanan</span>
            </button>

            <button
              type="button"
              onClick={() => onNavTabChange && onNavTabChange('antrean')}
              aria-current={activeNavTab === 'antrean' ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 text-[11.5px] xs:text-[12.5px] font-extrabold font-sans cursor-pointer transition-all active:scale-95 text-emerald-600 dark:text-emerald-400 tracking-tight"
            >
              <div className="p-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Antrean</span>
            </button>

            <button
              type="button"
              onClick={() => onNavTabChange && onNavTabChange('instansi')}
              aria-current={activeNavTab === 'instansi' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] xs:text-xs font-bold font-sans cursor-pointer transition-all active:scale-95 ${
                activeNavTab === 'instansi'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Instansi</span>
            </button>
          </nav>
        )
      )}
    </div>
  );
};

/**
 * FlexBadgeGroup Component
 * Fluid Flexbox container replacing absolute badge positioning.
 */
export interface FlexBadgeGroupProps {
  children: React.ReactNode;
  className?: string;
  justify?: 'start' | 'center' | 'between' | 'end';
}

export const FlexBadgeGroup: React.FC<FlexBadgeGroupProps> = ({
  children,
  className = '',
  justify = 'between',
}) => {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    between: 'justify-between',
    end: 'justify-end',
  };

  return (
    <div className={`w-full flex items-center flex-wrap gap-2 ${justifyClasses[justify]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * MobileCard Component
 * High-performance mobile card container using flexbox structure.
 */
export interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  badgeGroup?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  isDark?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className = '',
  badgeGroup,
  title,
  subtitle,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`w-full relative p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none space-y-4 flex flex-col justify-between transition-all ${className}`}
    >
      {(badgeGroup || title) && (
        <div className="space-y-2.5">
          {badgeGroup && (
            <FlexBadgeGroup justify="between">
              {badgeGroup}
            </FlexBadgeGroup>
          )}

          {title && (
            <div className="space-y-1">
              <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans leading-snug">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 w-full space-y-3">
        {children}
      </div>
    </motion.div>
  );
};

export default MobileLayout;
