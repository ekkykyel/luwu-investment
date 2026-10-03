import React, { useState, useEffect } from 'react';
import { 
  User, Briefcase, ArrowRight, Accessibility, 
  Clock, X, Touchpad
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
    <div className={`w-full min-h-screen bg-slate-950 font-sans selection:bg-emerald-500 selection:text-white ${isAccessible ? 'text-lg' : ''}`}>
      {/* 1. TOP NAVBAR & SAFETY HEADER */}
      {showHeader && (
        <header className="w-full px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-2 sticky top-0 z-50 text-white">
          {/* Left Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src="/logo-luwu.png" 
              alt="Logo Kabupaten Luwu"
              onError={(e) => {
                // Fallback if logo-luwu.png fails
                (e.currentTarget as HTMLImageElement).src = '/logo-192.png';
              }}
              className="w-7 h-7 object-contain shrink-0" 
            />
            <div className="truncate">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400 truncate">
                Kios Mandiri
              </p>
              <p className="text-[10px] font-bold text-slate-400 truncate">
                MPP Simpurusiang
              </p>
            </div>
          </div>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Accessibility Pill */}
            <button 
              type="button"
              onClick={() => setIsAccessible(!isAccessible)}
              className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                isAccessible 
                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Mode Aksesibilitas"
            >
              <Accessibility className="w-4 h-4" />
            </button>

            {/* Session Timer Pill */}
            <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-black flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{sessionTimer}s</span>
            </div>

            {/* Exit Button */}
            {onClose && (
              <button 
                type="button"
                onClick={onClose}
                className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                title="Tutup Kios"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>
      )}

      {/* 2. HERO WELCOME & TOUCH INSTRUCTION BANNER */}
      <main className={className || "w-full max-w-5xl mx-auto px-4 pt-28 sm:pt-32 pb-24 space-y-8 text-slate-100 text-center"}>
        <div className="space-y-3 max-w-2xl mx-auto">
          {/* Animated Touch Prompt Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/15 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-mono font-extrabold shadow-sm animate-pulse">
            <Touchpad className="w-4 h-4 text-emerald-400" />
            <span>✦ SENTUH LAYAR UNTUK MEMULAI LAYANAN</span>
          </div>

          {/* Welcome Title & Subtitle */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight font-sans">
              Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">Layanan Mandiri</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed mt-2 max-w-xl mx-auto font-medium">
              Silakan tentukan jalur layanan Anda untuk mendapatkan prioritas dan antrean yang tepat.
            </p>
          </div>
        </div>

        {/* 3. INTERACTIVE SERVICE ROUTE CARDS (DUAL-TERMINAL AIRPORT M-KIOSK GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
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
            className="group relative p-6 sm:p-8 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-emerald-500/40 hover:border-emerald-400 shadow-2xl shadow-emerald-950/50 transition-all duration-300 flex flex-col justify-between space-y-6 overflow-hidden cursor-pointer active:scale-[0.98] text-left"
          >
            {/* Background Subtle Glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl group-hover:bg-emerald-500/25 transition-all pointer-events-none" />

            <div className="space-y-4">
              {/* Card Header & Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-inner">
                  <User className="w-7 h-7" />
                </div>
                <span className="px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-extrabold text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>🟢 TERMINAL A</span>
                </span>
              </div>

              {/* Card Content */}
              <div className="space-y-1.5">
                <p className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-widest">
                  Jalur Umum
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Warga / Masyarakat
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
                  Pengurusan KTP-el, Kartu Keluarga, Akta Kelahiran, Pajak PBB, Samsat, BPJS, dan Surat Rekomendasi.
                </p>
              </div>
            </div>

            {/* Touch-Optimized Large Full Width Action Button */}
            <div className="w-full h-14 sm:h-16 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base rounded-2xl flex items-center justify-between transition-all active:scale-95 shadow-lg shadow-emerald-950/40 cursor-pointer">
              <span>Masuk Jalur Warga</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
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
            className="group relative p-6 sm:p-8 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-amber-500/40 hover:border-amber-400 shadow-2xl shadow-amber-950/50 transition-all duration-300 flex flex-col justify-between space-y-6 overflow-hidden cursor-pointer active:scale-[0.98] text-left"
          >
            {/* Background Subtle Glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl group-hover:bg-amber-500/25 transition-all pointer-events-none" />

            <div className="space-y-4">
              {/* Card Header & Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
                  <Briefcase className="w-7 h-7" />
                </div>
                <span className="px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-extrabold text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>🟧 TERMINAL B</span>
                </span>
              </div>

              {/* Card Content */}
              <div className="space-y-1.5">
                <p className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest">
                  Jalur Bisnis & Investasi
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Pebisnis / Investor
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
                  Penerbitan NIB OSS-RBA, Kesesuaian Tata Ruang (KKPR), Persetujuan Bangunan Gedung (PBG), dan Konsultasi Insentif Investasi.
                </p>
              </div>
            </div>

            {/* Touch-Optimized Large Full Width Action Button */}
            <div className="w-full h-14 sm:h-16 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-extrabold text-sm sm:text-base rounded-2xl flex items-center justify-between transition-all active:scale-95 shadow-lg shadow-amber-950/40 cursor-pointer">
              <span>Masuk Investor Corner</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
            </div>
          </div>
        </div>

        {/* 4. SLEEK FOOTER BANNER */}
        {showFooter && (
          <footer className="pt-8 border-t border-slate-800 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-400 font-mono">
              DPMPTSP KABUPATEN LUWU © 2026
            </p>
            <p className="text-[10px] text-slate-600">
              Sistem Pelayanan Kios Mandiri Terpadu MPP Simpurusiang
            </p>
          </footer>
        )}
      </main>
    </div>
  );
};

export default KiosMandiriSection;
