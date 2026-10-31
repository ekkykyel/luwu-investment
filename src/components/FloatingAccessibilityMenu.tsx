import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Accessibility, Contrast, Eye, Type, Plus, Minus, RotateCcw, X, Check, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface FloatingAccessibilityMenuProps {
  isDark?: boolean;
}

type FontScaleStep = 0 | 1 | 2 | 3;

const FONT_SCALE_CONFIG: Record<
  FontScaleStep,
  { percent: number; rootPx: string; labelId: string; labelEn: string; shortTag: string }
> = {
  0: { percent: 100, rootPx: '16px', labelId: 'Standar', labelEn: 'Default', shortTag: 'A' },
  1: { percent: 115, rootPx: '18.4px', labelId: 'Besar', labelEn: 'Large', shortTag: 'A+' },
  2: { percent: 130, rootPx: '20.8px', labelId: 'Ekstra', labelEn: 'Extra', shortTag: 'A++' },
  3: { percent: 145, rootPx: '23.2px', labelId: 'Maksimal', labelEn: 'Max', shortTag: 'A+++' },
};

const STORAGE_KEYS = {
  highContrast: 'luwu_landing_a11y_hc',
  grayscale: 'luwu_landing_a11y_gray',
  fontStep: 'luwu_landing_a11y_font_step',
} as const;

export const FloatingAccessibilityMenu: React.FC<FloatingAccessibilityMenuProps> = ({ isDark = false }) => {
  const { i18n } = useTranslation();
  const isEn = (i18n.language || 'id').toLowerCase().startsWith('en');

  const [isOpen, setIsOpen] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.highContrast) === 'true';
  });

  const [isGrayscale, setIsGrayscale] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.grayscale) === 'true';
  });

  const [fontStep, setFontStep] = useState<FontScaleStep>(() => {
    if (typeof window === 'undefined') return 0;
    const raw = Number(localStorage.getItem(STORAGE_KEYS.fontStep));
    if (raw === 1 || raw === 2 || raw === 3) return raw;
    return 0;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);

  // Sync High Contrast & Font Scaling to <html> while Landing Page is mounted,
  // and cleanly restore on unmount so 3D GIS Map WebGL canvases remain unaffected.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const htmlEl = document.documentElement;

    if (isHighContrast) {
      htmlEl.classList.add('landing-high-contrast');
    } else {
      htmlEl.classList.remove('landing-high-contrast');
    }

    const scaleCfg = FONT_SCALE_CONFIG[fontStep];
    if (fontStep > 0) {
      htmlEl.style.fontSize = scaleCfg.rootPx;
      htmlEl.setAttribute('data-landing-font-scale', String(scaleCfg.percent));
    } else {
      htmlEl.style.fontSize = '';
      htmlEl.removeAttribute('data-landing-font-scale');
    }

    try {
      localStorage.setItem(STORAGE_KEYS.highContrast, String(isHighContrast));
      localStorage.setItem(STORAGE_KEYS.grayscale, String(isGrayscale));
      localStorage.setItem(STORAGE_KEYS.fontStep, String(fontStep));
    } catch {
      // Ignore storage quota errors in restricted browsing modes
    }
  }, [isHighContrast, isGrayscale, fontStep]);

  useEffect(() => {
    return () => {
      if (typeof document === 'undefined') return;
      const htmlEl = document.documentElement;
      htmlEl.classList.remove('landing-high-contrast');
      htmlEl.style.fontSize = '';
      htmlEl.removeAttribute('data-landing-font-scale');
    };
  }, []);

  // Dismiss on Escape or outside click/tap
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerBtnRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeFeaturesCount =
    (isHighContrast ? 1 : 0) + (isGrayscale ? 1 : 0) + (fontStep > 0 ? 1 : 0);

  const handleDecreaseFont = () => {
    setFontStep((prev) => (prev > 0 ? ((prev - 1) as FontScaleStep) : 0));
  };

  const handleIncreaseFont = () => {
    setFontStep((prev) => (prev < 3 ? ((prev + 1) as FontScaleStep) : 3));
  };

  const handleResetAll = () => {
    setIsHighContrast(false);
    setIsGrayscale(false);
    setFontStep(0);
  };

  const currentScale = FONT_SCALE_CONFIG[fontStep];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* GPU-Composited Non-Interactive Monochrome Overlay (Preserves position:fixed across all browsers) */}
      {isGrayscale && (
        <div
          aria-hidden="true"
          className="a11y-monochrome-backdrop keep-original-color pointer-events-none fixed inset-0 z-[9980]"
        />
      )}

      <div
        ref={containerRef}
        className="keep-original-color fixed left-3.5 bottom-[78px] md:left-6 md:bottom-8 z-[9990] font-sans"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="landing-a11y-dialog"
              role="dialog"
              aria-modal="false"
              aria-labelledby="landing-a11y-title"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`keep-original-color absolute bottom-full left-0 mb-3 w-[calc(100vw-28px)] max-w-[344px] sm:w-[356px] rounded-2xl border shadow-2xl overflow-hidden ${
                isHighContrast
                  ? 'bg-black text-white border-2 border-yellow-400'
                  : isDark
                    ? 'bg-[#0B2136]/98 text-slate-100 border-white/15 backdrop-blur-xl'
                    : 'bg-[#F4F0E6]/98 text-[#10261E] border-[#E2DACB] backdrop-blur-xl'
              }`}
            >
              {/* Panel Header */}
              <div
                className={`keep-original-color flex items-center justify-between gap-3 px-4 py-3.5 border-b ${
                  isHighContrast
                    ? 'border-yellow-400/70 bg-black'
                    : isDark
                      ? 'border-white/10 bg-[#08192B]'
                      : 'border-[#E2DACB] bg-[#FAF7F0]/90'
                }`}
              >
                <div className="keep-original-color flex items-center gap-2.5 min-w-0">
                  <span
                    className={`keep-original-color w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isHighContrast
                        ? 'bg-yellow-400 text-black border-yellow-300'
                        : isDark
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-600/20'
                    }`}
                  >
                    <Accessibility className="w-5 h-5" />
                  </span>
                  <div className="keep-original-color min-w-0">
                    <h2
                      id="landing-a11y-title"
                      className={`text-sm font-extrabold tracking-tight truncate ${
                        isHighContrast ? 'text-yellow-300' : isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {isEn ? 'Inclusive Accessibility' : 'Menu Aksesibilitas'}
                    </h2>
                    <p
                      className={`text-xs truncate ${
                        isHighContrast ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {isEn ? 'Compliant with Law No. 8/2016' : 'Standar Inklusif UU No. 8/2016'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={isEn ? 'Close accessibility menu' : 'Tutup menu aksesibilitas'}
                  className={`keep-original-color w-10 h-10 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isHighContrast
                      ? 'border border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                      : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-white/10'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-[#E2DACB]/60'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Controls Body */}
              <div className="keep-original-color p-4 space-y-3">
                {/* 1. High Contrast Mode Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isHighContrast}
                  onClick={() => setIsHighContrast((prev) => !prev)}
                  className={`keep-original-color w-full min-h-[56px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isHighContrast
                      ? 'bg-yellow-400 text-black border-2 border-yellow-300 font-bold'
                      : isDark
                        ? 'bg-[#102A44] hover:bg-[#153454] border-white/10 text-slate-100'
                        : 'bg-[#FAF7F0] hover:bg-[#ECE5D6] border-[#E2DACB] text-slate-900'
                  }`}
                >
                  <div className="keep-original-color flex items-center gap-3 min-w-0">
                    <span
                      className={`keep-original-color w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isHighContrast
                          ? 'bg-black text-yellow-300'
                          : isDark
                            ? 'bg-amber-400/15 text-amber-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                      }`}
                    >
                      <Contrast className="w-4 h-4" />
                    </span>
                    <div className="keep-original-color min-w-0">
                      <div className="text-xs sm:text-sm font-bold leading-snug">
                        {isEn ? 'High Contrast Mode' : 'Mode Kontras Tinggi'}
                      </div>
                      <div
                        className={`text-xs leading-snug truncate ${
                          isHighContrast ? 'text-black/85 font-semibold' : isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {isEn ? 'Sharp yellow-on-black AAA contrast' : 'Kontras tajam ramah low-vision'}
                      </div>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className={`keep-original-color w-11 h-6 rounded-full p-0.5 flex items-center shrink-0 transition-colors ${
                      isHighContrast
                        ? 'bg-black justify-end'
                        : isDark
                          ? 'bg-slate-700 justify-start'
                          : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span
                      className={`keep-original-color w-5 h-5 rounded-full flex items-center justify-center shadow-xs ${
                        isHighContrast ? 'bg-yellow-400 text-black' : 'bg-white text-transparent'
                      }`}
                    >
                      {isHighContrast && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </span>
                </button>

                {/* 2. Grayscale / Monochrome Mode Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isGrayscale}
                  onClick={() => setIsGrayscale((prev) => !prev)}
                  className={`keep-original-color w-full min-h-[56px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isGrayscale
                      ? isHighContrast
                        ? 'bg-white text-black border-2 border-yellow-300 font-bold'
                        : isDark
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-white'
                          : 'bg-slate-900 text-white border-slate-800'
                      : isHighContrast
                        ? 'bg-black text-yellow-300 border border-yellow-400/80 hover:bg-zinc-900'
                        : isDark
                          ? 'bg-[#102A44] hover:bg-[#153454] border-white/10 text-slate-100'
                          : 'bg-[#FAF7F0] hover:bg-[#ECE5D6] border-[#E2DACB] text-slate-900'
                  }`}
                >
                  <div className="keep-original-color flex items-center gap-3 min-w-0">
                    <span
                      className={`keep-original-color w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isGrayscale
                          ? 'bg-white/20 text-current'
                          : isHighContrast
                            ? 'bg-zinc-900 text-yellow-300 border border-yellow-400/50'
                            : isDark
                              ? 'bg-slate-700/80 text-slate-200'
                              : 'bg-[#F4F0E6] text-slate-700 border border-[#E2DACB]'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                    </span>
                    <div className="keep-original-color min-w-0">
                      <div className="text-xs sm:text-sm font-bold leading-snug">
                        {isEn ? 'Grayscale / Monochrome' : 'Mode Monokrom (Hitam Putih)'}
                      </div>
                      <div
                        className={`text-xs leading-snug truncate ${
                          isGrayscale
                            ? 'opacity-90'
                            : isHighContrast
                              ? 'text-white'
                              : isDark
                                ? 'text-slate-300'
                                : 'text-slate-600'
                        }`}
                      >
                        {isEn ? 'Color-blind friendly grayscale view' : 'Ramah buta warna & minim distraksi'}
                      </div>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className={`keep-original-color w-11 h-6 rounded-full p-0.5 flex items-center shrink-0 transition-colors ${
                      isGrayscale
                        ? 'bg-emerald-500 justify-end'
                        : isHighContrast
                          ? 'bg-zinc-800 border border-yellow-400/60 justify-start'
                          : isDark
                            ? 'bg-slate-700 justify-start'
                            : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="keep-original-color w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xs">
                      {isGrayscale && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </span>
                </button>

                {/* 3. Font Size Scaling Controls */}
                <div
                  className={`keep-original-color p-3 rounded-xl border ${
                    isHighContrast
                      ? 'bg-black border-yellow-400/80 text-white'
                      : isDark
                        ? 'bg-[#102A44] border-white/10 text-slate-100'
                        : 'bg-[#FAF7F0] border-[#E2DACB] text-slate-900'
                  }`}
                >
                  <div className="keep-original-color flex items-center justify-between gap-2 mb-2.5">
                    <div className="keep-original-color flex items-center gap-2">
                      <Type
                        className={`w-4 h-4 ${
                          isHighContrast ? 'text-yellow-300' : isDark ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-bold">
                        {isEn ? 'Text Magnification' : 'Perbesar Ukuran Teks'}
                      </span>
                    </div>
                    <span
                      className={`keep-original-color text-xs font-mono font-bold tabular-nums px-2 py-0.5 rounded-md ${
                        isHighContrast
                          ? 'bg-yellow-400 text-black'
                          : isDark
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-600/20'
                      }`}
                    >
                      {currentScale.percent}%
                    </span>
                  </div>

                  {/* Stepper Controls (- / +) */}
                  <div className="keep-original-color flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={handleDecreaseFont}
                      disabled={fontStep === 0}
                      aria-label={isEn ? 'Decrease font size' : 'Perkecil ukuran teks'}
                      className={`keep-original-color min-h-[44px] min-w-[48px] px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        isHighContrast
                          ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                          : isDark
                            ? 'bg-[#0B2136] hover:bg-white/10 border-white/15 text-white'
                            : 'bg-[#F4F0E6] hover:bg-[#E2DACB]/70 border-[#E2DACB] text-slate-800'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                      <span>A-</span>
                    </button>

                    <div
                      className={`keep-original-color flex-1 min-h-[44px] rounded-xl border flex flex-col items-center justify-center px-2 ${
                        isHighContrast
                          ? 'border-yellow-400/50 bg-zinc-950 text-yellow-300'
                          : isDark
                            ? 'border-white/10 bg-[#08192B] text-slate-200'
                            : 'border-[#E2DACB] bg-[#F4F0E6] text-slate-800'
                      }`}
                    >
                      <span className="text-xs font-extrabold leading-tight">
                        {isEn ? currentScale.labelEn : currentScale.labelId}
                      </span>
                      <span className="text-xs opacity-75 font-mono tabular-nums leading-tight">
                        {currentScale.percent}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleIncreaseFont}
                      disabled={fontStep === 3}
                      aria-label={isEn ? 'Increase font size' : 'Perbesar ukuran teks'}
                      className={`keep-original-color min-h-[44px] min-w-[48px] px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        isHighContrast
                          ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                          : isDark
                            ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/40 text-white'
                            : 'bg-[#0F6B4F] hover:bg-[#0B533D] border-[#0F6B4F] text-white'
                      }`}
                    >
                      <span>A+</span>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Direct Preset Steps */}
                  <div className="keep-original-color grid grid-cols-4 gap-1.5">
                    {([0, 1, 2, 3] as FontScaleStep[]).map((step) => {
                      const item = FONT_SCALE_CONFIG[step];
                      const active = fontStep === step;
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setFontStep(step)}
                          className={`keep-original-color min-h-[38px] rounded-lg border text-xs font-bold tabular-nums transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                            active
                              ? isHighContrast
                                ? 'bg-yellow-400 text-black border-yellow-300'
                                : 'bg-emerald-600 text-white border-emerald-500'
                              : isHighContrast
                                ? 'bg-black text-yellow-300 border-yellow-400/60 hover:bg-zinc-900'
                                : isDark
                                  ? 'bg-[#0B2136] text-slate-300 border-white/10 hover:text-white'
                                  : 'bg-[#F4F0E6] text-slate-700 border-[#E2DACB] hover:bg-[#E2DACB]/70'
                          }`}
                        >
                          {item.percent}%
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={handleResetAll}
                  disabled={activeFeaturesCount === 0}
                  className={`keep-original-color w-full min-h-[44px] px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isHighContrast
                      ? 'bg-black text-yellow-300 border-yellow-400 hover:bg-yellow-400 hover:text-black'
                      : isDark
                        ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/12 text-slate-200'
                        : 'bg-[#FAF7F0] hover:bg-[#E2DACB]/70 border-[#E2DACB] text-slate-800'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Reset to Default Display' : 'Atur Ulang ke Tampilan Standar'}</span>
                </button>
              </div>

              {/* UU No. 8/2016 Compliance Footer */}
              <div
                className={`keep-original-color px-4 py-2.5 border-t flex items-center gap-2 text-xs ${
                  isHighContrast
                    ? 'border-yellow-400/70 bg-black text-yellow-300'
                    : isDark
                      ? 'border-white/10 bg-[#08192B] text-slate-300'
                      : 'border-[#E2DACB] bg-[#FAF7F0]/85 text-slate-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate font-medium">
                  {isEn
                    ? 'UU No. 8/2016 • Inclusive Public Service'
                    : 'Kepatuhan UU RI No. 8/2016 • Layanan Inklusif'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Accessibility Trigger Button */}
        <button
          ref={triggerBtnRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="landing-a11y-dialog"
          aria-label={
            isEn
              ? 'Open inclusive accessibility menu (Law No. 8/2016)'
              : 'Buka menu aksesibilitas inklusif (UU No. 8/2016)'
          }
          title={
            isEn
              ? 'Inclusive Accessibility (High Contrast, Grayscale, Text Size)'
              : 'Aksesibilitas Inklusif (Kontras Tinggi, Monokrom, Ukuran Teks)'
          }
          className={`keep-original-color relative min-w-[48px] min-h-[48px] h-12 px-3.5 sm:px-4 rounded-full border shadow-lg flex items-center justify-center gap-2 font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
            isHighContrast
              ? 'bg-yellow-400 text-black border-2 border-white shadow-black/60'
              : activeFeaturesCount > 0
                ? 'bg-[#0F6B4F] hover:bg-[#0B533D] text-white border-emerald-300/60 shadow-emerald-950/35'
                : isDark
                  ? 'bg-[#0D2740]/95 hover:bg-[#133455] text-white border-white/20 shadow-black/45 backdrop-blur-md'
                  : 'bg-[#F4F0E6]/95 hover:bg-[#ECE5D6] text-[#10261E] border-[#E2DACB] shadow-slate-900/12 backdrop-blur-md'
          }`}
        >
          <Accessibility
            className={`w-5 h-5 shrink-0 ${
              isHighContrast
                ? 'text-black'
                : activeFeaturesCount > 0
                  ? 'text-white'
                  : isDark
                    ? 'text-emerald-400'
                    : 'text-[#0F6B4F]'
            }`}
          />
          <span className="hidden sm:inline whitespace-nowrap">
            {isEn ? 'Accessibility' : 'Aksesibilitas'}
          </span>

          {activeFeaturesCount > 0 && (
            <span
              className={`keep-original-color min-w-[20px] h-5 px-1.5 rounded-full text-xs font-extrabold tabular-nums flex items-center justify-center ${
                isHighContrast ? 'bg-black text-yellow-300' : 'bg-white text-[#0F6B4F]'
              }`}
            >
              {activeFeaturesCount}
            </span>
          )}
        </button>
      </div>
    </>,
    document.body
  );
};

export default FloatingAccessibilityMenu;
