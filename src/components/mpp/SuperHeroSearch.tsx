import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useInView, useScroll, useTransform } from 'motion/react';
import { Search, Mic, Command, ArrowRight, Building2, Sparkles, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TopographicContourOverlay } from '../common/TopographicContourOverlay';
import { supabase } from '../../lib/supabaseClient';
import { FALLBACK_HERO_IMAGE, handleImageError, getSafeImageUrl } from '../../utils/imageFallbacks';

export interface SuperHeroSearchProps {
  onSearchSubmit?: (query: string) => void;
  onOpenCommandPalette: () => void;
  onOpenVoiceAssistant?: () => void;
  onSelectChip?: (chipId: string) => void;
  activePersona?: 'warga' | 'investor' | 'semua';
  previewMode?: 'after' | 'before';
  bannerUrl?: string;
  officeAddress?: string;
  portalProfile?: any;
}

const HERO_TAGLINES = [
  { full: "PEMKAB LUWU • MPP DIGITAL SIMPURUSIANG", mobile: "MPP DIGITAL SIMPURUSIANG" },
  { full: "INTEGRASI 26 INSTANSI & BUMN DALAM SATU ATAP", mobile: "INTEGRASI 26 INSTANSI & BUMN" },
  { full: "MELAYANI DENGAN HATI, CEPAT & TRANSPARAN", mobile: "LAYANAN RAMAH & TRANSPARAN" },
  { full: "SISTEM GRP SPASIAL DENGAN RADAR ANTREAN REAL-TIME", mobile: "RADAR ANTREAN REAL-TIME" },
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
  activePersona = 'warga',
  previewMode = 'after',
  bannerUrl,
  officeAddress,
  portalProfile,
}) => {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { margin: "200px" });
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeTaglineIndex, setActiveTaglineIndex] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [currentAddress, setCurrentAddress] = useState<string>(() => {
    if (officeAddress && typeof officeAddress === 'string' && officeAddress.trim().length > 0) {
      return officeAddress.trim();
    }
    if (portalProfile?.mpp_address && typeof portalProfile.mpp_address === 'string' && portalProfile.mpp_address.trim().length > 0) {
      return portalProfile.mpp_address.trim();
    }
    if (typeof window !== 'undefined') {
      try {
        const localProf = localStorage.getItem("mpp_portal_profile");
        if (localProf) {
          const parsed = JSON.parse(localProf);
          if (parsed?.mpp_address && typeof parsed.mpp_address === 'string' && parsed.mpp_address.trim().length > 0) {
            return parsed.mpp_address.trim();
          }
        }
      } catch (e) {}
    }
    return '';
  });
  const [heroSlides, setHeroSlides] = useState<Array<{ url: string; alt: string }>>(() => {
    // Immediate zero-latency local load of uploaded banner from profile
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

  // Instant sync when bannerUrl or address props change
  useEffect(() => {
    if (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim().length > 0 && !bannerUrl.includes('unsplash.com')) {
      setHeroSlides([{
        url: bannerUrl,
        alt: "Foto Banner Hero Section MPP Simpurusiang"
      }]);
    }
    const addr = officeAddress || portalProfile?.mpp_address;
    if (addr && typeof addr === 'string' && addr.trim().length > 0) {
      setCurrentAddress(addr.trim());
    }
  }, [bannerUrl, officeAddress, portalProfile?.mpp_address]);

  // Load uploaded hero banner / slider images and office address from database (site_settings / mpp_portal_profile)
  useEffect(() => {
    let isMounted = true;

    async function loadDynamicHeroImages() {
      try {
        // Check site_settings via API first (prioritizing mpp_portal_profile banner_url & mpp_address)
        const res = await fetch("/api/site-settings?keys=mpp_portal_profile,mpp_hero_images,hero_image_url,hero_slider_images");
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const mppProfile = list.find((i: any) => i.setting_key === 'mpp_portal_profile');
            const mppHero = list.find((i: any) => i.setting_key === 'mpp_hero_images');
            const singleHero = list.find((i: any) => i.setting_key === 'hero_image_url');
            const heroSlider = list.find((i: any) => i.setting_key === 'hero_slider_images');

            let parsedUrls: string[] = [];

            // 1. TOP PRIORITY: Foto Banner Resmi & Alamat MPP yang diunggah Admin di Profil & Fasilitas MPP
            if (mppProfile?.setting_value) {
              try {
                const parsed = typeof mppProfile.setting_value === 'string' ? JSON.parse(mppProfile.setting_value) : mppProfile.setting_value;
                const uploadedBanner = parsed?.banner_url || parsed?.hero_image;
                if (uploadedBanner && typeof uploadedBanner === 'string' && uploadedBanner.trim().length > 0 && !uploadedBanner.includes('unsplash.com')) {
                  parsedUrls = [uploadedBanner];
                }
                if (parsed?.mpp_address && typeof parsed.mpp_address === 'string' && parsed.mpp_address.trim().length > 0) {
                  setCurrentAddress(parsed.mpp_address.trim());
                }
              } catch (e) {}
            }

            // 2. Second Priority: dedicated mpp_hero_images
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

            // 3. Third Priority: hero_image_url
            if (parsedUrls.length === 0 && singleHero?.setting_value) {
              const val = singleHero.setting_value;
              if (typeof val === 'string' && val.trim().length > 0 && !val.includes('placeholder')) {
                parsedUrls = [val];
              }
            }

            // 4. Fourth Priority: hero_slider_images
            if (parsedUrls.length === 0 && heroSlider?.setting_value) {
              try {
                const parsed = typeof heroSlider.setting_value === 'string' ? JSON.parse(heroSlider.setting_value) : heroSlider.setting_value;
                if (Array.isArray(parsed)) parsedUrls = parsed;
              } catch (e) {}
            }

            // Filter out unsplash, placeholder, empty strings, and map to slides
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

        // Direct Supabase query fallback
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

    // Listen to admin update events in real-time
    const handleSettingsUpdated = (e?: any) => {
      const banner = e?.detail?.banner_url || e?.detail?.hero_image;
      if (banner && typeof banner === 'string' && !banner.includes('unsplash.com')) {
        setHeroSlides([{
          url: banner,
          alt: "Foto Banner Hero Section MPP Simpurusiang"
        }]);
      }
      const addr = e?.detail?.mpp_address;
      if (addr && typeof addr === 'string' && addr.trim().length > 0) {
        setCurrentAddress(addr.trim());
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
          if (parsed?.mpp_address && typeof parsed.mpp_address === 'string' && parsed.mpp_address.trim().length > 0) {
            setCurrentAddress(parsed.mpp_address.trim());
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

  // ─────────────────────────────────────────────────────────────────────────────
  // SMOOTH GPU-ACCELERATED PARALLAX SCROLL SYSTEM
  // ─────────────────────────────────────────────────────────────────────────────
  const { scrollY } = useScroll();
  
  // Background photo scrolls at 20% speed for cinematic 3D depth perception
  const bgY = useTransform(scrollY, [0, 500], [0, 95]);
  
  // Foreground content lifts slightly & fades smoothly as user scrolls down
  const contentY = useTransform(scrollY, [0, 400], [0, -25]);
  const contentOpacity = useTransform(scrollY, [0, 350], [1, 0.88]);

  useEffect(() => {
    if (shouldReduceMotion || !isInView || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveTaglineIndex((prev) => (prev + 1) % HERO_TAGLINES.length);
      setActiveSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [shouldReduceMotion, isInView, heroSlides.length]);

  // Clean, minimal top chips (3 primary quick actions)
  const PRIMARY_CHIPS = [
    { id: 'dukcapil', label: t('hero.chip_dukcapil', 'Dukcapil & KTP-el') },
    { id: 'oss', label: t('hero.chip_nib', 'Izin Usaha NIB OSS') },
    { id: 'antrean', label: t('hero.chip_queue', 'Ambil Antrean Online') },
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

  return (
    <div ref={heroRef} className="w-full max-w-6xl mx-auto pb-2 px-2 sm:px-4 relative z-10">
      
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* EDGE-TO-EDGE IMMERSIVE HERO CANVAS WITH PARALLAX SCROLL & EXOTIC SHINE */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full min-h-[550px] sm:min-h-[615px] lg:min-h-[660px] flex flex-col justify-center rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.04] shadow-xl dark:shadow-2xl bg-white dark:bg-[#071727] group transition-colors duration-300">
        
        {/* Ultra-Soft Inner Photo Boundary Line (Garis Batas Foto di Dalam yang Sangat Tipis & Lembut) */}
        <div className="pointer-events-none absolute inset-[3px] sm:inset-1.5 rounded-[13px] sm:rounded-[20px] border border-white/65 dark:border-white/[0.12] ring-1 ring-inset ring-white/30 dark:ring-white/[0.05] z-30" />

        {/* 1. Background Architecture Showcase Photo (Parallax Shifted via bgY - Pure Full Bleed without Dark Mask) */}
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : bgY }}
          className="absolute inset-0 z-0 overflow-hidden transform-gpu pointer-events-none"
        >
          {heroSlides.map((slide, idx) => (
            <motion.img
              key={slide.url || idx}
              src={getSafeImageUrl(slide.url, FALLBACK_HERO_IMAGE)}
              alt={slide.alt}
              initial={false}
              animate={{
                opacity: idx === (activeSlideIndex % heroSlides.length) ? 1 : 0,
                scale: idx === (activeSlideIndex % heroSlides.length) ? 1.025 : 1.0,
              }}
              transition={{
                opacity: { duration: 0.6, ease: "easeInOut" },
                scale: { duration: 6, ease: "easeOut" }
              }}
              onError={(e) => handleImageError(e, 'hero')}
              style={{ willChange: 'opacity, transform' }}
              className="absolute inset-0 w-full h-full object-cover object-[center_top] origin-top pointer-events-none filter brightness-[0.98] contrast-[1.02]"
              loading={idx === 0 ? "eager" : "lazy"}
            />
          ))}

          {/* Exotic Light Beam Sweep Effect (Shimmering Diagonal Ray) */}
          <motion.div
            animate={
              shouldReduceMotion || !isInView
                ? { opacity: 0 }
                : { x: ['-100%', '200%'] }
            }
            transition={{
              duration: 8,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 5,
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none transform-gpu"
          />

          {/* Pure Luminous White Smooth Vignette & Ultra-Soft White Edge Inset Glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_62%,rgba(255,255,255,0.38)_86%,rgba(255,255,255,0.78)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_64%,rgba(255,255,255,0.22)_88%,rgba(255,255,255,0.48)_100%)] z-10 transition-colors duration-300" />
          <div className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl shadow-[inset_0_0_40px_rgba(255,255,255,0.65)] dark:shadow-[inset_0_0_32px_rgba(255,255,255,0.32)] z-10 transition-shadow duration-300" />

          {/* Smooth Soft White Scrim Overlays — Gradasi Batas Putih Cerah Halus & Alami */}
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/45 dark:from-white/20 via-white/15 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white/55 dark:from-white/25 via-white/20 to-transparent pointer-events-none z-10" />

          {/* Focal Center Scrim for Crisp Typography Readability on Bright/Sky Photos */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_75%_55%_at_50%_46%,rgba(7,23,39,0.38)_0%,rgba(7,23,39,0.14)_62%,transparent_100%)] z-10" />

          {/* Cartographic Topography Contour Overlay */}
          <TopographicContourOverlay opacity={0.12} />
        </motion.div>

        {/* 2. Hero Content Floating DIRECTLY INSIDE Photo Canvas (Parallax Lifted via contentY) */}
        <motion.div
          style={{
            y: shouldReduceMotion ? 0 : contentY,
            opacity: shouldReduceMotion ? 1 : contentOpacity,
          }}
          className="relative z-20 flex-1 flex flex-col items-center justify-center text-center space-y-3.5 sm:space-y-5 md:space-y-6 px-3 sm:px-6 md:px-8 py-8 sm:py-12 md:py-14 max-w-4xl mx-auto transform-gpu w-full"
        >

          {/* Dynamic Cycling Tagline Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#0A2238]/85 dark:bg-slate-950/85 backdrop-blur-xl border border-[#D9B96E]/30 text-[#D9B96E] shadow-lg shadow-black/40 max-w-[95%] sm:max-w-none"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <AnimatePresence mode="wait">
              <motion.span
                key={activeTaglineIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase truncate"
              >
                <span className="sm:hidden">{HERO_TAGLINES[activeTaglineIndex].mobile}</span>
                <span className="hidden sm:inline">{HERO_TAGLINES[activeTaglineIndex].full}</span>
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.18] sm:leading-[1.14] drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] font-display-sora max-w-3xl"
          >
            {isDefaultIdTitle ? (
              <>
                Ekosistem Layanan Publik{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-[#E5C77A] drop-shadow-sm">
                  Tanpa Hambatan
                </span>
              </>
            ) : (
              fullTitle
            )}
          </motion.h1>

          {/* Office Address & Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[11px] sm:text-xs md:text-sm text-slate-200 font-normal max-w-2xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] px-2"
          >
            <span className="block text-[10px] sm:text-xs font-medium text-slate-300/90 mb-0.5 tracking-wide">
              {currentAddress || t('mppPortal.profile.address', 'Jl. Simpurusiang No. 45, Senga, Kec. Belopa, Kab. Luwu, Sulawesi Selatan 91994')}
            </span>
            {t(
              'hero.subtitle',
              'Satu pintu digital terpadu untuk percepatan izin, administrasi kependudukan, dan layanan publik warga & investor Luwu.'
            )}
          </motion.p>

          {/* Search Box Input Floating on Hero (Omni-Capsule with Specular Hairline Glow) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="w-full max-w-2xl pt-1 sm:pt-2"
          >
            <form
              onSubmit={handleSubmit}
              className={`relative flex items-center w-full rounded-2xl sm:rounded-full bg-[#0A2238]/85 dark:bg-[#0A2238]/90 backdrop-blur-2xl border transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.6)] ${
                isFocused
                  ? 'border-emerald-400 ring-2 ring-emerald-400/40 bg-[#0A2238]/95'
                  : 'border-white/20 hover:border-[#D9B96E]/40'
              }`}
            >
              <div className="pl-3.5 sm:pl-5 text-emerald-400 shrink-0">
                <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t('hero.search_placeholder', 'Cari instansi, izin OSS, cetak KTP, SKCK, atau pajak...')}
                className="w-full py-3 sm:py-4 px-2.5 sm:px-4 bg-transparent text-white placeholder-slate-400 text-xs sm:text-sm font-sans focus:outline-none"
              />

              <div className="pr-2 sm:pr-3 flex items-center gap-1.5 shrink-0">
                {onOpenVoiceAssistant && (
                  <button
                    type="button"
                    onClick={onOpenVoiceAssistant}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-emerald-400 hover:bg-white/10 transition-colors"
                    title="Bicara dengan Asisten Suara"
                  >
                    <Mic className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-[11px] font-mono border border-white/10 hover:bg-white/20 transition-colors"
                  title="Pintasan Keyboard"
                >
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="hidden xs:inline">Cari</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>

          {/* Quick Filter Chips (Centered Wrap on Mobile & Desktop with Emerald Micro Dots) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 py-1 px-1"
          >
            <span className="text-[10px] sm:text-xs text-white font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0A2238]/65 backdrop-blur-md border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9B96E] shrink-0" />
              {t('hero.popular', 'Paling Dicari:')}
            </span>
            {PRIMARY_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onSelectChip?.(chip.id)}
                className="px-2.5 sm:px-3 py-1 rounded-full bg-[#0A2238]/80 hover:bg-emerald-500/30 text-white hover:text-emerald-200 border border-white/20 hover:border-emerald-400/50 text-[10px] sm:text-xs font-medium backdrop-blur-md shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                {chip.label}
              </button>
            ))}
          </motion.div>

        </motion.div>
      </div>

    </div>
  );
};

export default SuperHeroSearch;
