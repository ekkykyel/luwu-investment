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
  Globe
} from 'lucide-react';

export interface PortalLayoutProps {
  children: React.ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
  currentLang?: string;
  onToggleLanguage?: () => void;
  activePersona?: 'warga' | 'investor' | 'semua';
  onPersonaChange?: (persona: 'warga' | 'investor' | 'semua') => void;
  onOpenCommandPalette?: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenAccessibilityPanel?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenQueueBooking?: () => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
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
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      setShowScrollTop(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      
      {/* Background Ambient Radial Mesh for Material Design 3 Depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[90vw] max-w-[1200px] h-[550px] bg-gradient-to-b from-emerald-500/12 via-teal-500/8 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[30%] -left-32 w-[450px] h-[450px] bg-gradient-to-br from-blue-500/8 via-cyan-500/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[60%] -right-32 w-[500px] h-[500px] bg-gradient-to-bl from-teal-500/8 via-emerald-500/5 to-transparent blur-3xl rounded-full" />
      </div>

      {/* 1. STICKY GLASSMORPHIC SUPER-HEADER (Material 3 Surface Elevation) */}
      <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-sm shadow-slate-900/5'
          : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          
          {/* Brand Identity Lockup */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative group cursor-pointer" onClick={scrollToTop}>
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

          {/* Center: Persona Pill Segmented Buttons (Material Design 3 Segmented Buttons) */}
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

            {/* AI Assistant Quick Pill */}
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

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 sm:space-y-16">
        {children}
      </main>

      {/* 3. MATERIAL DESIGN 3 GLOBAL FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col gap-2 min-w-[220px]"
            >
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pusat Bantuan & Kontak Cepat
              </div>

              {/* Action 1: Antrean Booking */}
              {onOpenQueueBooking && (
                <button
                  type="button"
                  onClick={() => {
                    setIsFabOpen(false);
                    onOpenQueueBooking();
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white">Ambil Antrean</div>
                    <div className="text-[10px] text-slate-400 font-normal">Tiket layanan tanpa antre</div>
                  </div>
                </button>
              )}

              {/* Action 2: AI Konsultasi */}
              {onOpenAiAssistant && (
                <button
                  type="button"
                  onClick={() => {
                    setIsFabOpen(false);
                    onOpenAiAssistant();
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white">AI Konsultasi Izin</div>
                    <div className="text-[10px] text-slate-400 font-normal">Cek syarat & berkas instan</div>
                  </div>
                </button>
              )}

              {/* Action 3: Pengaduan SP4N-LAPOR */}
              <a
                href="#pengaduan"
                onClick={() => setIsFabOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">Pengaduan WBS</div>
                  <div className="text-[10px] text-slate-400 font-normal">SP4N-LAPOR! & Pungli</div>
                </div>
              </a>

              {/* Action 4: WhatsApp Hotline */}
              <a
                href="https://wa.me/628114211119"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsFabOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">WhatsApp Helpdesk</div>
                  <div className="text-[10px] text-slate-400 font-normal">0811-4211-119</div>
                </div>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {/* Back to top mini pill */}
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={scrollToTop}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Kembali ke atas"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          )}

          {/* Main FAB Trigger */}
          <button
            type="button"
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-center text-white transition-all transform active:scale-90 cursor-pointer ${
              isFabOpen
                ? 'bg-slate-800 dark:bg-slate-700 rotate-90 shadow-slate-900/30'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 hover:scale-105'
            }`}
            title="Pusat Bantuan & Kontak Cepat"
            aria-label="Toggle Helpdesk Floating Menu"
          >
            {isFabOpen ? <X className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;
