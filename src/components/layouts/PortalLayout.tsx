import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Search, 
  Sparkles, 
  Accessibility, 
  HelpCircle, 
  Phone, 
  MessageSquare, 
  ChevronUp, 
  X, 
  Headphones, 
  Ticket, 
  ShieldAlert,
  Moon,
  Sun,
  Globe,
  ArrowLeft
} from 'lucide-react';

export interface PortalLayoutProps {
  children: React.ReactNode;
  
  /** Dynamic page title for the header */
  title?: string;
  /** Optional subtitle or breadcrumb text */
  subtitle?: string;
  /** Whether to show a back navigation button */
  showBackButton?: boolean;
  /** Custom handler for back navigation (defaults to window.history.back) */
  onBack?: () => void;
  
  /** Dark mode state */
  isDark?: boolean;
  /** Dark mode toggle callback */
  onToggleTheme?: () => void;
  /** Active language code ('id' | 'en') */
  currentLang?: string;
  /** Language toggle callback */
  onToggleLanguage?: () => void;
  
  /** Active user persona */
  activePersona?: 'warga' | 'investor' | 'semua';
  /** Persona switch callback */
  onPersonaChange?: (persona: 'warga' | 'investor' | 'semua') => void;
  
  /** Quick action callbacks */
  onOpenCommandPalette?: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenAccessibilityPanel?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenQueueBooking?: () => void;
  
  /** Custom action slot on the right side of header */
  rightActions?: React.ReactNode;
  /** Custom styling classes for outer wrapper */
  className?: string;
  /** Whether to hide the top header entirely */
  hideHeader?: boolean;
  /** Whether to hide the floating action button */
  hideFab?: boolean;
}

/**
 * Master Shell PortalLayout Component
 * Single Source of Truth for desktop & responsive portal pages of MPP Simpurusiang.
 * 
 * Features:
 * 1. Sticky top header with glassmorphism (backdrop-blur-md bg-white/75 border-b border-slate-100)
 * 2. Dynamic title rendering and optional back navigation
 * 3. Centralized content wrapper (max-w-7xl mx-auto px-4 md:px-8 pb-24 md:pb-8)
 * 4. Fixed Floating Action Button (FAB) for Helpdesk/Support with mobile bottom bar clearance
 */
export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  onBack,
  isDark = false,
  onToggleTheme,
  currentLang = 'id',
  onToggleLanguage,
  activePersona = 'warga',
  onPersonaChange,
  onOpenCommandPalette,
  onOpenVoiceAssistant,
  onOpenAccessibilityPanel,
  onOpenAiAssistant,
  onOpenQueueBooking,
  rightActions,
  className = '',
  hideHeader = false,
  hideFab = false,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      setShowScrollTop(scrollY > 350);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300 ${className}`}>
      
      {/* Background Ambient Radial Mesh for Material Design 3 Depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[90vw] max-w-[1200px] h-[550px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[35%] -left-32 w-[450px] h-[450px] bg-gradient-to-br from-blue-500/8 via-cyan-500/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[65%] -right-32 w-[500px] h-[500px] bg-gradient-to-bl from-teal-500/8 via-emerald-500/5 to-transparent blur-3xl rounded-full" />
      </div>

      {/* 1. STICKY TOP GLASSMORPHISM HEADER */}
      {!hideHeader && (
        <header 
          className={`sticky top-0 z-50 backdrop-blur-md bg-white/75 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800/80 transition-all duration-300 ${
            isScrolled ? 'shadow-sm shadow-slate-900/5' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
            
            {/* Left: Brand Identity or Back Button + Dynamic Page Title */}
            <div className="flex items-center gap-3 min-w-0">
              {showBackButton && (
                <button
                  type="button"
                  onClick={handleBackNavigation}
                  aria-label="Kembali ke halaman sebelumnya"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {title ? (
                // Dynamic Page Title View
                <div className="flex flex-col min-w-0">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate font-sans">
                    {title}
                  </h1>
                  {subtitle && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                      {subtitle}
                    </span>
                  )}
                </div>
              ) : (
                // Default Brand Logo & Name View
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="relative group cursor-pointer shrink-0" 
                    onClick={scrollToTop}
                    title="Kembali ke Beranda MPP Simpurusiang"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-500 dark:to-teal-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                      MPP
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none font-sans">
                        MPP Simpurusiang
                      </span>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                        SUPER APP
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                      Pemerintah Kabupaten Luwu
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Center: Persona Pill Segmented Buttons (Desktop MD3) */}
            {onPersonaChange && (
              <div className="hidden lg:flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/50 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => onPersonaChange('warga')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePersona === 'warga'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Warga & Umum
                </button>
                <button
                  type="button"
                  onClick={() => onPersonaChange('investor')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePersona === 'investor'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Investor & Usaha
                </button>
                <button
                  type="button"
                  onClick={() => onPersonaChange('semua')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePersona === 'semua'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semua Layanan
                </button>
              </div>
            )}

            {/* Right Action Cluster */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {rightActions}

              {/* Quick Command Trigger Button */}
              {onOpenCommandPalette && (
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
                  title="Pencarian Cepat Layanan (Ctrl+K)"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cari Layanan</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-600">
                    Ctrl K
                  </kbd>
                </button>
              )}

              {/* Accessibility Tool Button */}
              {onOpenAccessibilityPanel && (
                <button
                  type="button"
                  onClick={onOpenAccessibilityPanel}
                  className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Mode Ramah Inklusif & Disabilitas"
                  aria-label="Mode Ramah Inklusif"
                >
                  <Accessibility className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                </button>
              )}

              {/* Language Toggle */}
              {onToggleLanguage && (
                <button
                  type="button"
                  onClick={onToggleLanguage}
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 uppercase"
                  title="Ganti Bahasa"
                >
                  <Globe className="w-4 h-4 mr-1 text-slate-500" />
                  {currentLang}
                </button>
              )}

              {/* Dark Mode Toggle */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
                >
                  {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
                </button>
              )}

              {/* AI Assistant Quick Button */}
              {onOpenAiAssistant && (
                <button
                  type="button"
                  onClick={onOpenAiAssistant}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Asisten AI</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* 2. CENTRALIZED MAIN CONTENT WRAPPER */}
      {/* Notice pb-24 on mobile prevents content hiding behind bottom navigation or FAB; lg:pb-8 on desktop */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8 pt-4 sm:pt-6">
        {children}
      </main>

      {/* 3. MATERIAL DESIGN 3 SUPPORT FLOATING ACTION BUTTON (FAB) */}
      {!hideFab && (
        <div 
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto"
        >
          {/* Back to top scroll button (Sub-FAB) */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={scrollToTop}
                aria-label="Kembali ke atas"
                title="Scroll ke Atas"
                className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-90 cursor-pointer"
              >
                <ChevronUp className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Quick Helpdesk Popup Menu */}
          <AnimatePresence>
            {isFabOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col gap-2 min-w-[240px] max-w-[90vw]"
              >
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Asisten MPP & Helpdesk
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFabOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                    aria-label="Tutup menu helpdesk"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Action 1: Antrean Booking */}
                {onOpenQueueBooking && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFabOpen(false);
                      onOpenQueueBooking();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Ticket className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Ambil Antrean Online</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Pilih loket & dapatkan tiket QR</div>
                    </div>
                  </button>
                )}

                {/* Action 2: Asisten AI */}
                {onOpenAiAssistant && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFabOpen(false);
                      onOpenAiAssistant();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Konsultasi AI Simpurusiang</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Panduan syarat izin & regulasi</div>
                    </div>
                  </button>
                )}

                {/* Action 3: Hotline Call Center DPMPTSP Luwu */}
                <a
                  href="tel:0471321001"
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Call Center Pelayanan</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">(0471) 321001 • Hari & Jam Kerja</div>
                  </div>
                </a>

                {/* Action 4: Pengaduan Resmi SP4N-LAPOR! */}
                <a
                  href="https://www.lapor.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Kanal SP4N LAPOR!</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Pengaduan pelayanan publik resmi</div>
                  </div>
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary Main Support FAB Toggle */}
          <button
            type="button"
            onClick={() => setIsFabOpen(prev => !prev)}
            aria-label={isFabOpen ? "Tutup bantuan" : "Buka pusat bantuan dan helpdesk MPP"}
            className={`flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm text-white shadow-xl transition-all cursor-pointer active:scale-95 ${
              isFabOpen
                ? 'bg-slate-800 dark:bg-slate-700 shadow-slate-900/20'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
            }`}
          >
            {isFabOpen ? (
              <>
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Tutup</span>
              </>
            ) : (
              <>
                <Headphones className="w-5 h-5 animate-pulse" />
                <span>Bantuan MPP</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PortalLayout;
