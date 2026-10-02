import React from 'react';
import { motion } from 'framer-motion';

export interface MobileLayoutProps {
  children: React.ReactNode;
  /** Header title or custom header component */
  title?: React.ReactNode;
  /** Subtitle or kicker text under title */
  subtitle?: string;
  /** Action elements on the right of the sticky header */
  headerActions?: React.ReactNode;
  /** Optional back button click handler */
  onBack?: () => void;
  /** Custom extra class names for main content area */
  mainClassName?: string;
  /** Custom class names for outer container */
  containerClassName?: string;
  /** Whether dark mode is active */
  isDark?: boolean;
}

/**
 * MobileLayout Component
 * Provides a production-grade layout wrapper optimized for Android and Mobile Web viewports.
 * Features:
 * - Sticky Top Header (z-40, solid/backdrop-blur background, crisp border)
 * - Main Scrollable Content Area with mandatory pb-32 bottom padding (prevents bottom nav bar occlusion)
 * - Flexbox layout architecture replacing fragile absolute positioning for badges & titles
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  onBack,
  mainClassName = '',
  containerClassName = '',
  isDark = false,
}) => {
  return (
    <div className={`min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white ${containerClassName}`}>
      {/* 1. Responsive Sticky Top Header (z-40, solid/backdrop-blur) */}
      {(title || headerActions || onBack) && (
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
            {/* Left Zone: Back Button & Title Lockup */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {onBack && (
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
              )}

              {title && (
                <div className="flex flex-col min-w-0 truncate">
                  <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate tracking-tight font-sans">
                    {title}
                  </div>
                  {subtitle && (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {subtitle}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right Zone: Header Action Controls */}
            {headerActions && (
              <div className="flex items-center gap-2 shrink-0">
                {headerActions}
              </div>
            )}
          </div>
        </header>
      )}

      {/* 2. Main Scrollable Content Area with mandatory pb-32 bottom padding for Android */}
      <main className={`flex-1 w-full max-w-7xl mx-auto px-1.5 sm:px-4 lg:px-8 pt-3 sm:pt-6 pb-32 sm:pb-36 space-y-5 sm:space-y-6 ${mainClassName}`}>
        {children}
      </main>
    </div>
  );
};

/**
 * FlexBadgeGroup Component
 * Fluid Flexbox container replacing absolute badge positioning.
 * Guarantees badges and status pills wrap naturally on narrow Android screens.
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
      {/* Flexbox Header Section (Replaces Absolute Positioning) */}
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

      {/* Main Body */}
      <div className="flex-1 w-full space-y-3">
        {children}
      </div>
    </motion.div>
  );
};

export default MobileLayout;
