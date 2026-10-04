import React, { useState, useEffect } from 'react';
import { 
  User, Briefcase, ArrowRight, Accessibility, 
  Clock, X, Touchpad, Sun, Moon
} from 'lucide-react';

export interface KiosMandiriSectionProps {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  onSelectLane?: (lane: 'citizen' | 'investor') => void;
  onClose?: () => void;
  initialTimer?: number;
}

export const KiosMandiriSection: React.FC<KiosMandiriSectionProps> = ({
  className,
  showHeader = true,
  showFooter = true,
  onSelectLane,
  onClose,
  initialTimer = 71
}) => {
  const [sessionTimer, setSessionTimer] = useState(initialTimer);
  const [isAccessible, setIsAccessible] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('mpp_kiosk_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Inactivity / Session countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTimer((prev) => {
        if (prev <= 1) {
          return initialTimer;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialTimer]);

  const handleLaneClick = (lane: 'citizen' | 'investor') => {
    // Reset timer on touch
    setSessionTimer(initialTimer);
    if (onSelectLane) {
      onSelectLane(lane);
    }
  };

  return (
    <div className={`w-full min-h-screen font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300 ${
      isAccessible ? 'text-lg' : ''
    } ${
      theme === 'dark'
        ? 'dark bg-[#060D1A] text-white'
        : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. TOP NAVBAR & SAFETY HEADER */}
      {showHeader && (
        <header className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur-md border-b flex items-center justify-between gap-2 sticky top-0 z-50 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
        }`}>
          {/* Left Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <img 
              src="/logo-luwu.png" 
              alt="Logo Kabupaten Luwu"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo-192.png';
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0" 
            />
            <div className="hidden sm:block truncate">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
                Kios Mandiri
              </p>
              <p className={`text-[10px] font-bold truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                MPP Simpurusiang
              </p>
            </div>
          </div>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const next = theme === 'dark' ? 'light' : 'dark';
                setTheme(next);
                try {
                  localStorage.setItem('mpp_kiosk_theme', next);
                } catch (e) {
                  console.warn('Could not save theme:', e);
                }
              }}
              className={`p-1.5 sm:p-2 w-8 h-8 sm:w-auto sm:h-auto rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
              }`}
              title={theme === 'dark' ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-700" />}
            </button>

            {/* Accessibility Pill */}
            <button 
              type="button"
              onClick={() => setIsAccessible(!isAccessible)}
              className={`p-1.5 sm:p-2 w-8 h-8 sm:w-auto sm:h-auto rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-center ${
                isAccessible 
                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                  : theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Mode Aksesibilitas"
            >
              <Accessibility className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Session Timer Pill */}
            <div className={`px-2 sm:px-2.5 py-1 border rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1 ${
              theme === 'dark'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}>
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{sessionTimer}s</span>
            </div>

            {/* Exit Button */}
            {onClose && (
              <button 
                type="button"
                onClick={onClose}
                className={`p-1.5 sm:p-2 w-8 h-8 sm:w-auto sm:h-auto rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white'
                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white'
                }`}
                title="Tutup Kios"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </header>
      )}

      {/* 2. HERO WELCOME & TOUCH INSTRUCTION BANNER */}
      <main className={className || "w-full max-w-5xl mx-auto px-2 sm:px-4 pt-4 sm:pt-8 md:pt-10 pb-32 sm:pb-40 space-y-6 sm:space-y-8 text-center"}>
        <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          {/* Prominent Animated Touch Prompt CTA Banner */}
          <div className={`inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm md:text-base font-mono font-black shadow-xl tracking-wider uppercase transition-all duration-300 animate-pulse border-2 cursor-pointer active:scale-95 ${
            theme === 'dark'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
              : 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
          }`}>
            <div className="p-1 sm:p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
              <Touchpad className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <span className="font-extrabold tracking-wide text-[11px] xs:text-xs sm:text-sm md:text-base">✦ SENTUH LAYAR UNTUK MEMULAI LAYANAN ✦</span>
          </div>

          {/* Welcome Title & Subtitle */}
          <div>
            <h1 className={`text-3xl sm:text-5xl font-black tracking-tight leading-tight font-sans ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500">Layanan Mandiri</span>
            </h1>
            <p className={`text-xs sm:text-sm md:text-base leading-relaxed mt-2 max-w-xl mx-auto font-medium ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Silakan tentukan jalur layanan Anda untuk mendapatkan prioritas dan antrean yang tepat.
            </p>
          </div>
        </div>

        {/* 3. INTERACTIVE SERVICE ROUTE CARDS (DUAL-TERMINAL AIRPORT M-KIOSK GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
          {/* Terminal A: Jalur Umum (Warga / Masyarakat) */}
          <div
            onClick={() => handleLaneClick('citizen')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleLaneClick('citizen');
              }
            }}
            className={`group relative p-5 sm:p-8 rounded-3xl backdrop-blur-xl border-2 transition-all duration-300 flex flex-col justify-between space-y-5 sm:space-y-6 overflow-hidden cursor-pointer active:scale-[0.98] text-left shadow-[0_0_50px_-12px_rgba(16,185,129,0.35)] hover:shadow-[0_0_65px_-8px_rgba(16,185,129,0.5)] ${
              theme === 'dark'
                ? 'bg-slate-900/95 border-emerald-500/40 hover:border-emerald-400 text-white'
                : 'bg-white border-slate-200/90 hover:border-emerald-500 text-slate-900 shadow-xl'
            }`}
          >
            {/* Background Subtle Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all pointer-events-none" />

            <div className="space-y-3 sm:space-y-4 relative z-10">
              {/* Card Header & Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className={`p-3 sm:p-4 rounded-2xl border shadow-inner flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                }`}>
                  <User className="w-7 h-7 sm:w-10 sm:h-10 stroke-[2.5]" />
                </div>
                <span className={`px-3 sm:px-4 py-1 sm:py-1.5 font-mono font-extrabold text-[11px] sm:text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-sm border ${
                  theme === 'dark'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}>
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>🟢 TERMINAL A</span>
                </span>
              </div>

              {/* Card Content */}
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-[11px] sm:text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Jalur Umum
                </p>
                <h3 className={`text-2xl sm:text-4xl font-black tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Warga / Masyarakat
                </h3>
                <p className={`text-xs sm:text-sm md:text-base leading-relaxed pt-1 font-normal ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Pengurusan KTP-el, Kartu Keluarga, Akta Kelahiran, Pajak PBB, Samsat, BPJS, dan Surat Rekomendasi.
                </p>
              </div>
            </div>

            {/* Touch-Optimized Large Full Width Action Button */}
            <div className="w-full h-12 sm:h-16 px-5 sm:px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all duration-150 text-white font-black text-xs sm:text-base rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-950/30 cursor-pointer relative z-10">
              <span>Masuk Jalur Warga</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-2" />
            </div>
          </div>

          {/* Terminal B: Jalur Bisnis & Investasi (Pebisnis / Investor) */}
          <div
            onClick={() => handleLaneClick('investor')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleLaneClick('investor');
              }
            }}
            className={`group relative p-5 sm:p-8 rounded-3xl backdrop-blur-xl border-2 transition-all duration-300 flex flex-col justify-between space-y-5 sm:space-y-6 overflow-hidden cursor-pointer active:scale-[0.98] text-left shadow-[0_0_50px_-12px_rgba(245,158,11,0.35)] hover:shadow-[0_0_65px_-8px_rgba(245,158,11,0.5)] ${
              theme === 'dark'
                ? 'bg-slate-900/95 border-amber-500/40 hover:border-amber-400 text-white'
                : 'bg-white border-slate-200/90 hover:border-amber-500 text-slate-900 shadow-xl'
            }`}
          >
            {/* Background Subtle Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all pointer-events-none" />

            <div className="space-y-3 sm:space-y-4 relative z-10">
              {/* Card Header & Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className={`p-3 sm:p-4 rounded-2xl border shadow-inner flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-amber-100 border-amber-300 text-amber-800'
                }`}>
                  <Briefcase className="w-7 h-7 sm:w-10 sm:h-10 stroke-[2.5]" />
                </div>
                <span className={`px-3 sm:px-4 py-1 sm:py-1.5 font-mono font-extrabold text-[11px] sm:text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-sm border ${
                  theme === 'dark'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}>
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span>🟧 TERMINAL B</span>
                </span>
              </div>

              {/* Card Content */}
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-[11px] sm:text-xs font-mono font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Jalur Bisnis & Investasi
                </p>
                <h3 className={`text-2xl sm:text-4xl font-black tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Pebisnis / Investor
                </h3>
                <p className={`text-xs sm:text-sm md:text-base leading-relaxed pt-1 font-normal ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Penerbitan NIB OSS-RBA, Kesesuaian Tata Ruang (KKPR), Persetujuan Bangunan Gedung (PBG), dan Konsultasi Insentif Investasi.
                </p>
              </div>
            </div>

            {/* Touch-Optimized Large Full Width Action Button */}
            <div className="w-full h-12 sm:h-16 px-5 sm:px-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 active:scale-95 transition-all duration-150 text-white font-black text-xs sm:text-base rounded-2xl flex items-center justify-between shadow-lg shadow-amber-950/30 cursor-pointer relative z-10">
              <span>Masuk Investor Corner</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-2" />
            </div>
          </div>
        </div>

        {/* 4. SLEEK FOOTER BANNER */}
        {showFooter && (
          <footer className={`pt-6 sm:pt-8 border-t text-center space-y-1 ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <p className={`text-[11px] sm:text-xs font-semibold font-mono ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              DPMPTSP KABUPATEN LUWU © 2026
            </p>
            <p className={`text-[9px] sm:text-[10px] ${
              theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Sistem Pelayanan Kios Mandiri Terpadu MPP Simpurusiang
            </p>
          </footer>
        )}
      </main>
    </div>
  );
};

export default KiosMandiriSection;
