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
      <main className={className || "w-full max-w-xl mx-auto px-4 pt-6 pb-24 space-y-6 text-slate-100"}>
        <div className="space-y-3">
          {/* Animated Touch Prompt Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-extrabold shadow-sm animate-pulse">
            <Touchpad className="w-4 h-4" />
            <span>Sentuh Layar Untuk Memulai Layanan</span>
          </div>

          {/* Welcome Title & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Layanan Mandiri</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-1.5">
              Silakan tentukan jalur layanan Anda untuk mendapatkan prioritas dan antrean yang tepat.
            </p>
          </div>
        </div>

        {/* 3. INTERACTIVE SERVICE ROUTE CARDS (FULL-CARD TOUCH TARGET) */}
        <div className="space-y-4">
          {/* Card 1: Jalur Umum (Warga / Masyarakat) */}
          <div
            onClick={() => handleLaneClick('citizen')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleLaneClick('citizen');
              }
            }}
            className="group relative p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400 shadow-xl transition-all duration-300 space-y-4 overflow-hidden cursor-pointer active:scale-[0.99]"
          >
            {/* Background Subtle Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

            {/* Card Header & Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <User className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider rounded-full">
                Terminal A
              </span>
            </div>

            {/* Card Content */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Jalur Umum
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Warga / Masyarakat
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Pengurusan KTP-el, Kartu Keluarga, Akta Kelahiran, Pajak PBB, Samsat, BPJS, dan Surat Rekomendasi.
              </p>
            </div>

            {/* Full Width Action Button (Bottom) */}
            <div className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-between transition-all group-hover:shadow-lg group-hover:shadow-emerald-900/40">
              <span>Masuk Jalur Warga</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 2: Jalur Bisnis & Investasi (Pusat Investor) */}
          <div
            onClick={() => handleLaneClick('investor')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleLaneClick('investor');
              }
            }}
            className="group relative p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 shadow-xl transition-all duration-300 space-y-4 overflow-hidden cursor-pointer active:scale-[0.99]"
          >
            {/* Background Subtle Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

            {/* Card Header & Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider rounded-full">
                Terminal B
              </span>
            </div>

            {/* Card Content */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Jalur Bisnis & Investasi
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Pebisnis / Investor
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Penerbitan NIB OSS-RBA, Kesesuaian Tata Ruang (KKPR), Persetujuan Bangunan Gedung (PBG), dan Konsultasi Insentif Investasi.
              </p>
            </div>

            {/* Full Width Action Button (Bottom) */}
            <div className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-between transition-all group-hover:shadow-lg group-hover:shadow-amber-900/40">
              <span>Masuk Investor Corner</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* 4. SLEEK FOOTER BANNER */}
        {showFooter && (
          <footer className="pt-6 border-t border-slate-800 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-400">
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
