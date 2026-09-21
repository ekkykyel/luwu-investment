import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LuwuLogo } from "./LuwuLogo";
import { useTranslation } from "react-i18next";

const loadingMessages = [
  "loading.spatial_intelligence",
  "loading.ecosystem_sync",
  "loading.zoning_data",
  "loading.tematik_map"
];

const fallbackMessages: Record<string, string> = {
  "loading.spatial_intelligence": "Menyiapkan Sistem Intelijen Spasial Luwu...",
  "loading.ecosystem_sync": "Sinkronisasi Data Ekosistem Investasi...",
  "loading.zoning_data": "Memuat Struktur Batas Wilayah & Tata Ruang...",
  "loading.tematik_map": "Inisialisasi Portal Cerdas..."
};

export default function LoadingScreen() {
  const { t } = useTranslation();
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const currentKey = loadingMessages[msgIdx];
  const translatedMessage = t(currentKey, fallbackMessages[currentKey]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 select-none overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center justify-center text-center p-6 max-w-md w-full">
        {/* Animated Rings and Logo */}
        <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
          {/* Ripple rings */}
          <motion.div
            className="absolute inset-0 rounded-full border border-emerald-500/20"
            animate={{ scale: [1, 1.4, 1.8], opacity: [0.6, 0.2, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-emerald-400/10"
            animate={{ scale: [1, 1.2, 1.5], opacity: [0.4, 0.1, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 0.8 }}
          />

          {/* Rotating Outer Ring */}
          <motion.div 
            className="absolute -inset-3 rounded-full border-2 border-dashed border-emerald-500/40"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          />

          {/* Central Logo with breathing animation */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="z-10 bg-slate-900/80 p-4 rounded-full border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)] backdrop-blur-sm"
          >
            <LuwuLogo size="lg" className="brightness-110 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
          </motion.div>
        </div>

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <h2 className="text-2xl font-black text-slate-100 tracking-wider font-sans bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 drop-shadow-sm">
            InvestLuwu Hub
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 tracking-widest uppercase font-mono mt-1">
            Sistem Informasi Spasial & Komparatif
          </p>
        </motion.div>

        {/* Dynamic Sophisticated Message */}
        <div className="h-6 overflow-hidden relative w-full mb-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400/90 tracking-wide font-sans text-center px-4 animate-pulse"
            >
              {translatedMessage}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-900 shadow-inner relative">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            animate={{ 
              left: ["-100%", "100%"]
            }}
            style={{ position: 'absolute', width: '100%' }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
