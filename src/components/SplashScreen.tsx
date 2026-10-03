import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64.js";
import { requestSmartFullscreen } from "../utils/fullscreen";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles, Shield, Compass } from "lucide-react";
import { isMobileOrAndroidDevice } from "../hooks/useDeviceAutomation";

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
    { code: "id", label: "Indonesia", short: "ID", flag: "🇮🇩" },
    { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
    { code: "zh", label: "中文", short: "中文", flag: "🇨🇳" },
  ];

  const handleLanguageSelect = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    window.dispatchEvent(new Event("languagechange"));
  };

  const handleEnterPortal = () => {
    try {
      sessionStorage.setItem("luwu_splash_seen", "true");
    } catch (e) {}

    // Pemicu Fullscreen otomatis saat masuk dari Splash Screen untuk Android / Smartphone
    if (isMobileOrAndroidDevice()) {
      requestSmartFullscreen().catch(() => {});
    }

    setIsTransitioning(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  return (
    <AnimatePresence>
      {!isTransitioning && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(12px)" }}
          transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="fixed inset-0 z-[100] w-full h-full min-h-[100dvh] bg-slate-950 flex flex-col justify-between py-4 sm:py-6 px-4 text-white font-sans select-none overflow-hidden"
        >
          {/* Kinetic Ambient Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.22),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.18),transparent_55%)] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.09),transparent_70%)] blur-[60px] pointer-events-none" />

          {/* Background Technical Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(99, 102, 241, 0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(99, 102, 241, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: "3rem 3rem"
            }}
          />

          {/* 1. TOP HEADER: BADGE */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="flex items-center justify-center gap-2 pt-1 relative z-10"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-xs font-mono tracking-widest uppercase shadow-sm shadow-emerald-950">
              <Shield className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Official Government Gateway</span>
            </div>
          </motion.div>

          {/* 2. MAIN CENTERPIECE: LOGO, TITLE, LANGUAGE, CTA */}
          <div className="relative flex flex-col items-center text-center max-w-md mx-auto w-full my-auto z-10 px-2">
            
            {/* Elevated Hologram Logo Ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 16,
                delay: 0.15
              }}
              className="relative mb-4 sm:mb-5 group cursor-pointer"
              onClick={handleEnterPortal}
            >
              {/* Dual rotating halo aura */}
              <motion.div 
                className="absolute -inset-3 rounded-full bg-gradient-to-tr from-emerald-500 via-amber-400 to-teal-400 opacity-40 blur-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Outer dashed orbit circle */}
              <div className="absolute -inset-1 rounded-full border border-dashed border-emerald-400/40 animate-[spin_30s_linear_infinite]" />

              {/* Main solid emblem container */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900/90 backdrop-blur-xl border-2 border-emerald-400/40 p-4 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-300">
                <motion.img
                  src={LUWU_LOGO_BASE64}
                  alt="Logo Resmi Kabupaten Luwu"
                  className="w-16 h-16 sm:w-18 sm:h-18 object-contain filter drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            {/* Typography Section */}
            <motion.div
              key={`welcome-${selectedLang}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-1.5 mb-4 sm:mb-5"
            >
              <div className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-400 font-mono">
                <Compass className="w-3 h-3" />
                <span>{t("splash.welcome", "Selamat Datang di Portal")}</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(16,185,129,0.25)] leading-tight">
                {t("splash.title", "Smart Investment Kabupaten Luwu")}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto font-sans leading-relaxed pt-0.5 opacity-90">
                {t("splash.subtitle", "Gerbang Investasi Digital yang Cepat, Transparan, dan Terintegrasi secara Spasial.")}
              </p>
            </motion.div>

            {/* SLEEK GLASS SEGMENTED LANGUAGE PILLS */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-full max-w-xs mb-5 sm:mb-6"
            >
              <div className="p-1 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 grid grid-cols-3 gap-1 shadow-lg shadow-black/40">
                {languages.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`relative py-2 px-1 rounded-xl transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-b from-emerald-500/30 to-emerald-600/20 border border-emerald-400/80 text-white shadow-sm"
                          : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                    >
                      <span className="text-base sm:text-lg mb-0.5 select-none leading-none">{lang.flag}</span>
                      <span className="text-[10px] font-bold tracking-wider font-mono uppercase">{lang.short}</span>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* ERGONOMIC 48PX PULSE CTA BUTTON */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative w-full max-w-xs group"
            >
              {/* Subtle Pulsing Radar Aura */}
              <motion.div
                className="absolute -inset-1 rounded-full bg-emerald-500/25 blur-md"
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.7, 0.2, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <button
                onClick={handleEnterPortal}
                className="relative w-full min-h-[48px] sm:min-h-[50px] py-3 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold rounded-full shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2.5 transition-all duration-300 uppercase tracking-widest text-xs sm:text-sm cursor-pointer border border-emerald-300/40 active:scale-95 hover:shadow-[0_0_35px_rgba(16,185,129,0.6)]"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{t("splash.btnEnter", "Masuk ke Portal")}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>

            {/* DYNAMIC SHIMMER TAGLINE */}
            <div className="h-7 mt-3 flex items-center justify-center overflow-hidden w-full">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`tagline-${selectedLang}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 0.85, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-[11px] sm:text-xs tracking-[0.2em] font-mono text-emerald-300 uppercase font-bold filter drop-shadow-[0_0_6px_rgba(110,231,183,0.25)]"
                >
                  ✦ {t("splash.tagline", "Ayo Berinvestasi ke Kabupaten Luwu")} ✦
                </motion.p>
              </AnimatePresence>
            </div>

          </div>

          {/* 3. BOTTOM FOOTER: COMPACT GOVERNMENT SIGNATURE */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col items-center gap-0.5 text-[9px] sm:text-[10px] tracking-[0.2em] text-slate-400 uppercase font-mono text-center z-10 pb-1"
          >
            <span>{t("splash.experienceDesc", "Sistem Informasi Geospasial Investasi Daerah")}</span>
            <span className="text-emerald-400/80 font-bold">PEMERINTAH KABUPATEN LUWU © 2026</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// hotfix: force splash screen to fixed full-viewport overlay
