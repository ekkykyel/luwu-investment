import React, { useState, useEffect } from 'react';
import { RotateCw, X } from 'lucide-react';

export default function OrientationPrompt() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOrientation = (e: MediaQueryListEvent) => {
      setIsPortrait(e.matches);
    };

    const mediaQuery = window.matchMedia("(orientation: portrait)");
    setIsPortrait(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleOrientation);

    return () => mediaQuery.removeEventListener("change", handleOrientation);
  }, []);

  if (!isPortrait || isDismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center relative border border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>
        <RotateCw className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-spin-slow" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-sans">
          Rotasi Layar Disarankan
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-sans">
          Untuk analisis spasial dan verifikasi layer yang lebih akurat, gunakan mode landscape.
        </p>
        <button 
          onClick={() => setIsDismissed(true)}
          className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl text-xs font-sans hover:bg-emerald-700 transition-colors"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
