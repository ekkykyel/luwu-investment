import { requestSmartFullscreen } from "../utils/fullscreen.js";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Globe, Check, Shield } from "lucide-react";
import { isMobileOrAndroidDevice } from "../hooks/useDeviceAutomation.js";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { i18n, t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || "id");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const languages = [
    { code: "id", label: "Bahasa Indonesia", short: "ID", flag: "🇮🇩" },
    { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
    { code: "zh", label: "中文 (Chinese)", short: "中文", flag: "🇨🇳" },
  ];

  const handleLanguageSelect = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    // Dispatch custom event so other active components (e.g., Map, auto-translated elements) update immediately
    window.dispatchEvent(new Event("languagechange"));
  };

  const handleEnterPortal = () => {
    if (isMobileOrAndroidDevice()) {
      try {
        if (!document.fullscreenElement) {
          const elem = document.documentElement as any;
          requestSmartFullscreen();
        }
      } catch (e) {}
    }

    try {
      sessionStorage.setItem("luwu_splash_seen", "true");
    } catch (e) {}
    setIsTransitioning(true);
    // Delay slightly for exit animation to play smoothly
    setTimeout(() => {
      onComplete();
    }, 700);
  };

  return (
    <AnimatePresence>
      {!isTransitioning && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08, filter: "blur(15px)" }}
          transition={{ duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="fixed inset-0 z-[100] w-full h-full min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-y-auto text-white font-sans select-none"
        >
          {/* Kinetic Glowing Ambient Auras - highly vibrant and premium */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.18),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.15),transparent_50%)]" />
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.08),transparent_65%)] blur-[80px]" />

          {/* Futuristic grid background with subtle animation */}
          <div 
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: "4rem 4rem"
            }}
          />

          {/* Top subtle elegant brand header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex items-center gap-2 text-[10px] sm:text-xs tracking-[0.3em] text-emerald-400 font-mono uppercase z-10"
          >
            <Shield className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Official Investor Gateway</span>
          </motion.div>

          {/* Main Cinematic Card Container */}
          <div className="relative flex flex-col items-center text-center max-w-2xl z-10 my-auto w-full px-4">
            
            {/* Logo Wrapper inside interactive 3D style floating ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 70,
                damping: 15,
                delay: 0.1
              }}
              className="relative mb-10 group"
            >
              {/* Dual glowing halo ring with rotating effect */}
              <motion.div 
                className="absolute -inset-4 rounded-full bg-gradient-to-tr from-emerald-500 via-yellow-400 to-cyan-500 opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-700"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Outer orbit circle line */}
              <div className="absolute -inset-1.5 rounded-full border border-dashed border-emerald-500/30 animate-[spin_40s_linear_infinite]" />

              {/* Main solid glass container */}
              <div className="relative w-32 h-32 rounded-full bg-slate-950/80 backdrop-blur-xl border-2 border-emerald-500/30 p-6 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.25)] transition-all duration-500 group-hover:border-emerald-400 group-hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]">
                <motion.img
                  src="https://i.ibb.co.com/KxKKb5d8/transparant.png"
                  alt="Logo Kabupaten Luwu"
                  className="w-20 h-20 object-contain filter drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  animate={{ 
                    y: [0, -4, 0],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            {/* Welcoming Display Typography */}
            <motion.div
              key={`welcome-${selectedLang}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <h2 className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-emerald-400 font-mono">
                {t("splash.welcome", "Selamat Datang di Portal")}
              </h2>
              
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent filter drop-shadow-[0_2px_15px_rgba(16,185,129,0.2)]">
                {t("splash.title", "Smart Investment Kabupaten Luwu")}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-sans leading-relaxed pt-1 opacity-90">
                {t("splash.subtitle", "Gerbang Investasi Digital yang Cepat, Transparan, dan Terintegrasi secara Spasial.")}
              </p>
            </motion.div>

            {/* Premium Language Selector Section */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-10 w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl relative"
            >
              {/* Highlight bar top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              
              <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3.5 flex items-center justify-center gap-1.5 font-mono">
                <Globe className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                <span>{t("splash.selectLanguage", "Pilih Bahasa Keberangkatan")}</span>
              </h3>

              <div className="grid grid-cols-3 gap-2.5">
                {languages.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-white"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/50 hover:text-slate-200"
                      }`}
                    >
                      {/* Flag Indicator */}
                      <span className="text-xl mb-1 filter drop-shadow-md select-none">{lang.flag}</span>
                      
                      {/* Language Label */}
                      <span className="text-[10px] font-bold tracking-wider uppercase font-mono">{lang.short}</span>

                      {/* Small Active Checkmark */}
                      {isSelected && (
                        <motion.div 
                          layoutId="activeIndicator"
                          className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-0.5 rounded-full border border-slate-950"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Glowing CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative mt-10 w-full max-w-xs group"
            >
              {/* Outer Sonar Glowing Ring for majestic depth */}
              <motion.div
                className="absolute inset-[-4px] rounded-full bg-emerald-500/20 blur-sm"
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.6, 0.1, 0.6],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <button
                onClick={handleEnterPortal}
                className="relative w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-full shadow-[0_0_30px_rgba(16,185,129,0.45)] flex items-center justify-center gap-3 transition-all duration-300 uppercase tracking-widest text-xs sm:text-sm cursor-pointer border border-emerald-400/30 hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] active:scale-95"
              >
                <span>{t("splash.btnEnter", "Masuk ke Portal")}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </button>
            </motion.div>

            {/* Dynamic Animated Localized Tagline */}
            <div className="h-10 mt-8 flex items-center justify-center overflow-hidden w-full">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`tagline-${selectedLang}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 0.75, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="text-xs sm:text-sm tracking-[0.2em] font-mono text-emerald-300 uppercase font-bold filter drop-shadow-[0_0_8px_rgba(110,231,183,0.2)]"
                >
                  {t("splash.tagline", "Ayo Berinvestasi ke Kabupaten Luwu")}
                </motion.p>
              </AnimatePresence>
            </div>

          </div>

          {/* Elegant Government Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="flex flex-col items-center gap-1.5 text-[9px] tracking-[0.25em] text-slate-400 uppercase font-mono text-center z-10"
          >
            <span>{t("splash.experienceDesc", "Sistem informasi spasial interaktif multi-bahasa terpadu Pemerintah Kabupaten Luwu")}</span>
            <span className="text-emerald-500/70 font-semibold mt-1">PEMERINTAH KABUPATEN LUWU © 2026</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// hotfix: force splash screen to fixed full-viewport overlay
