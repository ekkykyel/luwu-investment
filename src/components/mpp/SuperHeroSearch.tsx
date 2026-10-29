import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useInView } from 'motion/react';
import { Search, Mic, Command, ArrowRight, MapPin, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { FALLBACK_HERO_IMAGE, handleImageError, getSafeImageUrl } from '../../utils/imageFallbacks';
import { ResponsiveHeroPicture } from '../common/ResponsiveHeroPicture';

export interface SuperHeroSearchProps {
  onSearchSubmit?: (query: string) => void;
  onOpenCommandPalette: () => void;
  onOpenVoiceAssistant?: () => void;
  onSelectChip?: (chipId: string) => void;
  activePersona?: 'warga' | 'investor' | 'semua';
  previewMode?: 'after' | 'before';
  bannerUrl?: string;
  isDark?: boolean;
}

const HERO_TAGLINES = [
  { full: "PEMKAB LUWU · MPP DIGITAL SIMPURUSIANG", mobile: "MPP DIGITAL SIMPURUSIANG" },
  { full: "PELAYANAN PUBLIK & PERIZINAN SATU PINTU", mobile: "PELAYANAN TERPADU SATU PINTU" },
  { full: "MELAYANI DENGAN HATI · CEPAT & TRANSPARAN", mobile: "LAYANAN CEPAT & TRANSPARAN" },
  { full: "ANTREAN DIGITAL & PELACAKAN BERKAS REAL-TIME", mobile: "ANTREAN & LACAK REAL-TIME" },
];

const DEFAULT_MPP_HERO_SLIDES = [
  {
    url: FALLBACK_HERO_IMAGE,
    alt: "Gedung Pusat Pelayanan Terpadu Satu Pintu MPP Simpurusiang Luwu",
  }
];

export const SuperHeroSearch: React.FC<SuperHeroSearchProps> = ({
  onSearchSubmit,
  onOpenCommandPalette,
  onOpenVoiceAssistant,
  onSelectChip,
  bannerUrl,
}) => {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { margin: "200px" });
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isCompactMobile, setIsCompactMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [activeTaglineIndex, setActiveTaglineIndex] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState<Array<{ url: string; alt: string }>>(() => {
    try {
      if (bannerUrl && !bannerUrl.includes('unsplash.com')) {
        return [{ url: bannerUrl, alt: "Foto Banner Hero Section MPP Simpurusiang" }];
      }
      if (typeof window !== 'undefined') {
        const localProf = localStorage.getItem("mpp_portal_profile");
        if (localProf) {
          const parsed = JSON.parse(localProf);
          if (parsed?.banner_url && !parsed.banner_url.includes('unsplash.com')) {
            return [{ url: parsed.banner_url, alt: "Gedung & Pelayanan MPP Simpurusiang Kab. Luwu" }];
          }
        }
      }
    } catch (e) {}
    return DEFAULT_MPP_HERO_SLIDES;
  });
  const shouldReduceMotion = useReducedMotion();

  const [isTabActive, setIsTabActive] = useState(true);
  const [isCarouselIdleReady, setIsCarouselIdleReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsCompactMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleVis = () => {
      setIsTabActive(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const idleCallback = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 1500));
    const handle = idleCallback(() => {
      setIsCarouselIdleReady(true);
      if (heroSlides.length > 1) {
        const secondary = heroSlides[1];
        if (secondary?.url) {
          const img = new Image();
          img.decoding = 'async';
          img.src = getSafeImageUrl(secondary.url, FALLBACK_HERO_IMAGE);
        }
      }
    });
    return () => {
      if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, [heroSlides]);

  useEffect(() => {
    if (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim().length > 0 && !bannerUrl.includes('unsplash.com')) {
      setHeroSlides([{
        url: bannerUrl,
        alt: "Foto Banner Hero Section MPP Simpurusiang"
      }]);
    }
  }, [bannerUrl]);

  useEffect(() => {
    let isMounted = true;

    async function loadDynamicHeroImages() {
      try {
        const res = await fetch("/api/site-settings?keys=mpp_portal_profile,mpp_hero_images,hero_image_url,hero_slider_images");
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const mppProfile = list.find((i: any) => i.setting_key === 'mpp_portal_profile');
            const mppHero = list.find((i: any) => i.setting_key === 'mpp_hero_images');
            const singleHero = list.find((i: any) => i.setting_key === 'hero_image_url');
            const heroSlider = list.find((i: any) => i.setting_key === 'hero_slider_images');

            let parsedUrls: string[] = [];

            if (mppProfile?.setting_value) {
              try {
                const parsed = typeof mppProfile.setting_value === 'string' ? JSON.parse(mppProfile.setting_value) : mppProfile.setting_value;
                const uploadedBanner = parsed?.banner_url || parsed?.hero_image;
                if (uploadedBanner && typeof uploadedBanner === 'string' && uploadedBanner.trim().length > 0 && !uploadedBanner.includes('unsplash.com')) {
                  parsedUrls = [uploadedBanner];
                }
              } catch (e) {}
            }

            if (parsedUrls.length === 0 && mppHero?.setting_value) {
              try {
                const parsed = typeof mppHero.setting_value === 'string' ? JSON.parse(mppHero.setting_value) : mppHero.setting_value;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  parsedUrls = parsed;
                } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
                  parsedUrls = [parsed];
                }
              } catch (e) {}
            }

            if (parsedUrls.length === 0 && singleHero?.setting_value) {
              const val = singleHero.setting_value;
              if (typeof val === 'string' && val.trim().length > 0 && !val.includes('placeholder')) {
                parsedUrls = [val];
              }
            }

            if (parsedUrls.length === 0 && heroSlider?.setting_value) {
              try {
                const parsed = typeof heroSlider.setting_value === 'string' ? JSON.parse(heroSlider.setting_value) : heroSlider.setting_value;
                if (Array.isArray(parsed)) parsedUrls = parsed;
              } catch (e) {}
            }

            const safeUrls = parsedUrls
              .filter(u => u && typeof u === 'string' && u.trim().length > 0 && !u.includes('unsplash.com') && !u.includes('placeholder'))
              .map((u, i) => ({
                url: u,
                alt: `Gedung & Pelayanan MPP Simpurusiang Kab. Luwu (Foto ${i + 1})`
              }));

            if (isMounted && safeUrls.length > 0) {
              setHeroSlides(safeUrls);
              return;
            }
          }
        }

        const { data } = await supabase
          .from("site_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["mpp_portal_profile", "mpp_hero_images", "hero_image_url", "hero_slider_images"]);

        if (data && data.length > 0 && isMounted) {
          const mppProfile = data.find((d: any) => d.setting_key === "mpp_portal_profile");
          if (mppProfile?.setting_value) {
            try {
              const parsed = typeof mppProfile.setting_value === 'string' ? JSON.parse(mppProfile.setting_value) : mppProfile.setting_value;
              const banner = parsed?.banner_url || parsed?.hero_image;
              if (banner && typeof banner === 'string' && !banner.includes('unsplash.com')) {
                setHeroSlides([{
                  url: banner,
                  alt: "MPP Simpurusiang Kab. Luwu"
                }]);
                return;
              }
            } catch (e) {}
          }

          const item = data.find((d: any) => d.setting_key === "mpp_hero_images") ||
                       data.find((d: any) => d.setting_key === "hero_image_url") ||
                       data.find((d: any) => d.setting_key === "hero_slider_images");
          if (item?.setting_value) {
            try {
              const urls = typeof item.setting_value === 'string' ? JSON.parse(item.setting_value) : item.setting_value;
              const listArr = Array.isArray(urls) ? urls : [urls];
              const safeUrls = listArr
                .filter((u: string) => u && typeof u === 'string' && u.trim().length > 0 && !u.includes('unsplash.com') && !u.includes('placeholder'))
                .map((u: string, i: number) => ({
                  url: u,
                  alt: `MPP Simpurusiang Kab. Luwu (${i + 1})`
                }));
              if (safeUrls.length > 0) {
                setHeroSlides(safeUrls);
                return;
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn("Notice loading dynamic hero image:", err);
      }
    }

    loadDynamicHeroImages();

    const handleSettingsUpdated = (e?: any) => {
      const banner = e?.detail?.banner_url || e?.detail?.hero_image;
      if (banner && typeof banner === 'string' && !banner.includes('unsplash.com')) {
        setHeroSlides([{
          url: banner,
          alt: "Foto Banner Hero Section MPP Simpurusiang"
        }]);
      }
      loadDynamicHeroImages();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mpp_portal_profile' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.banner_url && !parsed.banner_url.includes('unsplash.com')) {
            setHeroSlides([{
              url: parsed.banner_url,
              alt: "Foto Banner Hero Section MPP Simpurusiang"
            }]);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('hero_settings_updated', handleSettingsUpdated);
    window.addEventListener('mpp_portal_profile_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('hero_settings_updated', handleSettingsUpdated);
      window.removeEventListener('mpp_portal_profile_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Rotate tagline gently (and slide if multiple hero images uploaded)
  useEffect(() => {
    if (shouldReduceMotion || !isInView || !isTabActive) return;
    const timer = setInterval(() => {
      setActiveTaglineIndex((prev) => (prev + 1) % HERO_TAGLINES.length);
      if (isCarouselIdleReady && heroSlides.length > 1) {
        setActiveSlideIndex((prev) => (prev + 1) % heroSlides.length);
      }
    }, 4800);
    return () => clearInterval(timer);
  }, [shouldReduceMotion, isInView, isTabActive, isCarouselIdleReady, heroSlides.length]);

  const PRIMARY_CHIPS = [
    {
      id: 'dukcapil',
      label: t('hero.chip_dukcapil', 'Dukcapil & KTP-el'),
      mobileLabel: t('mppPortal.search.chipDukcapil', 'Dukcapil & KTP'),
    },
    {
      id: 'oss',
      label: t('hero.chip_nib', 'Izin Usaha NIB OSS'),
      mobileLabel: t('mppPortal.quickActions.izinOssShort', 'Izin OSS'),
    },
    {
      id: 'antrean',
      label: t('hero.chip_queue', 'Ambil Antrean Online'),
      mobileLabel: t('mppPortal.quickActions.antreanShort', 'Antrean'),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit && query.trim()) {
      onSearchSubmit(query.trim());
    } else {
      onOpenCommandPalette();
    }
  };

  const fullTitle = t('hero.title', 'Ekosistem Layanan Publik Tanpa Hambatan');
  const isDefaultIdTitle = fullTitle === 'Ekosistem Layanan Publik Tanpa Hambatan';

  const placeholderText = isCompactMobile
    ? t('hero.mppSearchPlaceholderShort', 'Cari layanan, izin, atau instansi...')
    : t('hero.search_placeholder', 'Cari layanan, izin, instansi, atau dokumen...');

  return (
    <div ref={heroRef} className="w-full max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 pt-2 pb-2 sm:pt-4 sm:pb-4 relative z-10 hero-photo-card-container">
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* OPSI A: MODERN SPLIT-EDITORIAL CIVIC HERO (12-COL ASYMMETRIC ARCHITECTURE)    */}
      {/* Left 7 Cols: High-Contrast Editorial Command & Omni-Search                    */}
      {/* Right 5 Cols: Unobstructed Proportional 1280×775 Gedung MPP Showcase          */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-center">
        
        {/* 1. LEFT COLUMN (7 Cols): EDITORIAL HEADLINE, OMNI-SEARCH & QUICK FILTERS */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3.5 sm:space-y-4">
          
          {/* Sulapa Eppa Institutional Kicker */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="inline-flex items-center justify-center lg:justify-start gap-2.5 max-w-full"
          >
            <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B] shrink-0" />
            <AnimatePresence mode="wait">
              <motion.span
                key={activeTaglineIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-[10px] sm:text-xs font-sans font-bold tracking-[0.15em] uppercase text-[#855A14] dark:text-[#E2C475] truncate"
              >
                <span className="sm:hidden">{HERO_TAGLINES[activeTaglineIndex].mobile}</span>
                <span className="hidden sm:inline">{HERO_TAGLINES[activeTaglineIndex].full}</span>
              </motion.span>
            </AnimatePresence>
            <span aria-hidden="true" className="lg:hidden w-1.5 h-1.5 rotate-45 bg-[#C9A24B] shrink-0" />
          </motion.div>

          {/* Editorial Display Headline (WCAG AAA Contrast on Warm Alabaster & Nocturnal Slate) */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[28px] xs:text-[31px] sm:text-4xl md:text-[44px] lg:text-[46px] xl:text-[52px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.13] text-balance font-sans max-w-2xl"
          >
            {isDefaultIdTitle ? (
              <>
                Ekosistem Layanan Publik{" "}
                <span className="font-serif-display italic font-semibold tracking-normal text-[#0F6B4F] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#F6E2A8] dark:via-[#E5C878] dark:to-[#6EE7B7] pr-1">
                  Tanpa Hambatan
                </span>
              </>
            ) : (
              fullTitle
            )}
          </motion.h1>

          {/* Civic Subtitle & Unboxed Official Address */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center lg:items-start gap-1.5 max-w-xl"
          >
            <p className="text-xs xs:text-[13px] sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed text-balance">
              {t(
                'hero.subtitle',
                'Portal Pelayanan Publik Terpadu Kabupaten Luwu — integrasi perizinan, kependudukan, dan layanan lintas instansi dalam satu atap.'
              )}
            </p>
            <div className="inline-flex items-center justify-center lg:justify-start gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#0F6B4F] dark:text-emerald-400 shrink-0" />
              <span className="sm:hidden truncate">
                {t('hero.mppLocationShort', 'Jl. Simpurusiang No. 45 · Belopa, Luwu')}
              </span>
              <span className="hidden sm:inline">
                {t('mppPortal.profile.address', 'Jl. Simpurusiang No. 45, Senga, Kec. Belopa, Kab. Luwu, Sulawesi Selatan 91994')}
              </span>
            </div>
          </motion.div>

          {/* Elevated Omni-Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="w-full max-w-2xl pt-1"
          >
            <form
              onSubmit={handleSubmit}
              className={`relative flex items-center w-full rounded-2xl sm:rounded-full border transition-all duration-200 ${
                isFocused
                  ? 'bg-white dark:bg-[#0D253E] border-[#0F6B4F] dark:border-emerald-400 ring-2 ring-[#0F6B4F]/20 dark:ring-emerald-400/30 shadow-[0_14px_34px_-10px_rgba(15,107,79,0.20)] dark:shadow-[0_18px_42px_rgba(0,0,0,0.65)]'
                  : 'bg-white dark:bg-[#0B2035] border-[#DCD4C4] dark:border-white/[0.14] hover:border-[#0F6B4F]/50 dark:hover:border-emerald-400/40 shadow-[0_12px_30px_-12px_rgba(24,24,27,0.10)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.55)]'
              }`}
            >
              <div className="pl-4 sm:pl-5 text-[#0F6B4F] dark:text-emerald-400 shrink-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholderText}
                className="w-full min-w-0 py-3.5 sm:py-4 px-3 sm:px-3.5 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 text-xs sm:text-sm font-medium font-sans truncate text-ellipsis focus:outline-none"
              />

              <div className="pr-1.5 sm:pr-2 flex items-center gap-1 sm:gap-1.5 shrink-0">
                {onOpenVoiceAssistant && (
                  <button
                    type="button"
                    onClick={onOpenVoiceAssistant}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-[#0F6B4F] dark:hover:text-emerald-300 hover:bg-[#F3EFE6] dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Bicara dengan Asisten Suara"
                    aria-label="Bicara dengan Asisten Suara"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F5F2EA] dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 text-[11px] font-mono border border-[#E2DACB] dark:border-white/10 hover:bg-[#EAE4D7] dark:hover:bg-white/15 transition-colors cursor-pointer"
                  title="Pintasan Pencarian Cepat (Ctrl+K)"
                >
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </button>
                <button
                  type="submit"
                  className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl sm:rounded-full bg-[#0F6B4F] hover:bg-[#0B543E] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  aria-label="Cari layanan"
                >
                  <span className="hidden sm:inline">Cari</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>

          {/* Popular Interactive Filter Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="w-full flex items-center justify-center lg:justify-start gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 touch-pan-x"
          >
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap shrink-0 pr-0.5">
              {t('hero.popular', 'Paling Dicari:')}
            </span>
            {PRIMARY_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onSelectChip?.(chip.id)}
                className="min-h-[28px] sm:min-h-[34px] p-1 px-2.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-[#F2EFE7] hover:bg-[#0F6B4F]/10 dark:bg-[#0D2338] dark:hover:bg-emerald-500/15 text-slate-700 hover:text-[#0F6B4F] dark:text-slate-200 dark:hover:text-emerald-300 border border-[#DFD8C8] hover:border-[#0F6B4F]/35 dark:border-white/[0.10] dark:hover:border-emerald-400/40 text-[11px] sm:text-xs font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="sm:hidden">{chip.mobileLabel}</span>
                <span className="hidden sm:inline">{chip.label}</span>
              </button>
            ))}
          </motion.div>
        </div>

        {/* 2. RIGHT COLUMN (5 Cols): UNOBSTRUCTED PROPORTIONAL ARCHITECTURAL SHOWCASE (1280×775 = 1.65:1) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="lg:col-span-5 w-full relative group p-1 sm:p-0 hero-photo-card-wrapper"
        >
          {/* Subtle Spatial Depth Ambient Glow (Dark Mode) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 rounded-[32px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-[#E2C475]/25 blur-xl opacity-60 dark:opacity-75 group-hover:opacity-100 transition-opacity duration-700 -z-10"
          />

          <div className="hero-photo-card mpp-card relative w-full aspect-[16/10] sm:aspect-[1280/775] rounded-[16px] sm:rounded-[26px] overflow-hidden border border-[#D8CEBC] dark:border-[#C9A24B]/35 shadow-[0_20px_44px_-16px_rgba(15,35,45,0.18)] dark:shadow-[0_24px_52px_-16px_rgba(0,0,0,0.85)] bg-[#0A2236] p-1">
            
            {/* Sulapa Eppa Inner Gold Hairline Frame */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E2C475]/85 to-transparent z-30" />
            <div aria-hidden="true" className="hidden sm:block pointer-events-none absolute inset-2.5 rounded-[18px] border border-white/25 dark:border-[#E2C475]/15 z-20" />

            {/* Live Operational Status Floating Pill */}
            <div className="mpp-badge operational-badge absolute top-2 sm:top-4 left-2 sm:left-4 z-30 flex items-center gap-1.5 sm:gap-2 p-1 px-2.5 sm:px-3 sm:py-1.5 rounded-full bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-md border border-white/20 dark:border-emerald-500/30 text-white shadow-lg pointer-events-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold font-sans tracking-wide text-emerald-200">
                Layanan Beroperasi Normal
              </span>
            </div>

            {/* Full Uncropped Architectural Photograph */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              {heroSlides.map((slide, idx) => {
                const isSlideActive = idx === (activeSlideIndex % heroSlides.length);
                if (idx === 0) {
                  return (
                    <div
                      key={slide.url || idx}
                      className={`absolute inset-0 w-full h-full transition-all duration-700 group-hover:scale-[1.025] ${
                        isSlideActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                    >
                      <ResponsiveHeroPicture
                        heroKey="mpp"
                        alt={slide.alt}
                        priority={true}
                        objectPositionClass="object-center"
                        customSrc={slide.url.startsWith('http') ? slide.url : undefined}
                      />
                    </div>
                  );
                }
                if (!isCarouselIdleReady && !isSlideActive) return null;
                return (
                  <img
                    key={slide.url || idx}
                    src={getSafeImageUrl(slide.url, FALLBACK_HERO_IMAGE)}
                    alt={slide.alt}
                    onError={(e) => handleImageError(e, 'hero')}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-[1.025] ${
                      isSlideActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                    loading="lazy"
                    decoding="async"
                  />
                );
              })}

              {/* Ultra-Subtle Bottom-Edge Gradient ONLY for Caption Legibility (85% of Building & Sky 100% Pure & Bright) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#061826]/85 via-[#061826]/35 to-transparent z-10"
              />
            </div>

            {/* Quiet Architectural Caption & Optional Slide Controls */}
            <div className="absolute inset-x-3.5 sm:inset-x-5 bottom-3 sm:bottom-4 z-20 flex items-center justify-between gap-2 text-white">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-[#E2C475] shrink-0" />
                <span className="text-[11px] sm:text-xs font-medium tracking-wide text-white/95 truncate drop-shadow-xs">
                  Gedung MPP Simpurusiang · Belopa
                </span>
              </div>

              {heroSlides.length > 1 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                    aria-label="Foto sebelumnya"
                    className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/65 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono tabular-nums text-white/90 px-1">
                    {(activeSlideIndex % heroSlides.length) + 1}/{heroSlides.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSlideIndex((prev) => (prev + 1) % heroSlides.length)}
                    aria-label="Foto berikutnya"
                    className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/65 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SuperHeroSearch;
