import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'motion/react';
import { 
  Accessibility, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  Armchair, 
  Baby, 
  ExternalLink,
  ShieldCheck 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface PriorityShowcaseCarouselProps {
  onOpenAccessibilityPanel?: () => void;
  onOpenVipInvestor?: () => void;
  isDark?: boolean;
  previewMode?: 'after' | 'before';
}

export const PriorityShowcaseCarousel: React.FC<PriorityShowcaseCarouselProps> = ({
  onOpenAccessibilityPanel,
  onOpenVipInvestor,
  isDark = false,
  previewMode = 'after',
}) => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15 });
  const shouldReduceMotion = useReducedMotion();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const isLegacyDark = previewMode === 'before';

  const SHOWCASE_ITEMS = [
    {
      id: 'vip-investor',
      type: 'vip',
      title: t('access.card1_title', 'Fasilitasi Penanaman Modal & Investasi'),
      kicker: t('access.card1_kicker', 'Layanan Eksekutif'),
      description: t('access.card1_desc', 'Layanan asistensi personal satu pintu untuk penanam modal korporasi dan UMKM skala menengah ke atas dengan pendampingan langsung Liaison Officer DPMPTSP.'),
      badge: t('access.card1_badge', 'PRIORITAS INVESTASI'),
      badgeColor: isLegacyDark
        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        : 'bg-[#143755]/90 text-emerald-400 border-white/10',
      icon: Briefcase,
      image: '/assets/images/default-facility.svg',
      features: [
        t('access.card1_bullet1', 'Pendampingan OSS-RBA'),
        t('access.card1_bullet2', 'Konsultasi Tata Ruang RDTR'),
        t('access.card1_bullet3', 'Fasilitasi Insentif Pajak Daerah')
      ],
      actionLabel: t('access.card1_cta', 'Hubungi Liaison Officer ↗'),
      isVip: true,
    },
    {
      id: 'ramah-disabilitas',
      type: 'inklusif',
      title: t('access.card2_title', 'Jalur Fast-Track Ramah Disabilitas'),
      kicker: t('access.card2_kicker', 'Pelayanan Inklusif'),
      description: t('access.card2_desc', 'Penyandang disabilitas, lansia >60 tahun, dan ibu hamil langsung mendapatkan nomor antrean khusus tanpa perlu menunggu antrean reguler.'),
      badge: t('access.card2_badge', 'PRIORITAS INKLUSI'),
      badgeColor: isLegacyDark
        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        : 'bg-[#143755]/90 text-emerald-400 border-white/10',
      icon: Accessibility,
      image: '/assets/images/default-facility.svg',
      features: [
        t('access.card2_bullet1', 'Kursi Roda & Jalur Landai'),
        t('access.card2_bullet2', 'Petugas Pendamping Bahasa Isyarat'),
        t('access.card2_bullet3', 'Kios Khusus Layar Rendah')
      ],
      actionLabel: t('access.card2_cta', 'Buka Menu Inklusif ↗'),
      isVip: false,
    },
    {
      id: 'executive-lounge',
      type: 'vip',
      title: t('access.card3_title', 'Executive Lounge & Business Corner'),
      kicker: t('access.card3_kicker', 'Fasilitas Unggulan'),
      description: t('access.card3_desc', 'Ruang tunggu eksklusif berpenyejuk udara sentral dengan koneksi internet cepat, stasiun pengisian daya gawai, dan sajian kopi Luwu.'),
      badge: t('access.card3_badge', 'FASILITAS EKSEKUTIF'),
      badgeColor: isLegacyDark
        ? 'bg-slate-800/80 text-slate-300 border-slate-700/80'
        : 'bg-[#143755]/90 text-slate-200 border-white/10',
      icon: Armchair,
      image: '/assets/images/default-facility.svg',
      features: [
        t('access.card3_bullet1', 'Wi-Fi Orbit Berkecepatan Tinggi'),
        t('access.card3_bullet2', 'Layar Monitor Progres Berkas'),
        t('access.card3_bullet3', 'Bilik Konsultasi Privat')
      ],
      actionLabel: t('access.card3_cta', 'Lihat Denah Lounge ↗'),
      isVip: true,
    },
    {
      id: 'laktasi-anak',
      type: 'inklusif',
      title: t('access.card4_title', 'Ruang Laktasi & Arena Bermain Ramah Anak'),
      kicker: t('access.card4_kicker', 'Fasilitas Keluarga'),
      description: t('access.card4_desc', 'Bilik privat higienis untuk ibu menyusui serta arena bermain anak edukatif yang diawasi agar orang tua dapat mengurus berkas dengan tenang.'),
      badge: t('access.card4_badge', 'FASILITAS KELUARGA'),
      badgeColor: isLegacyDark
        ? 'bg-slate-800/80 text-slate-300 border-slate-700/80'
        : 'bg-[#143755]/90 text-slate-200 border-white/10',
      icon: Baby,
      image: '/assets/images/default-facility.svg',
      features: [
        t('access.card4_bullet1', 'Sterilizer & Kulkas ASI'),
        t('access.card4_bullet2', 'Mainan Edukasi Standar SNI'),
        t('access.card4_bullet3', 'Sofa Laktasi Ergonomis')
      ],
      actionLabel: t('access.card4_cta', 'Panduan Fasilitas Anak ↗'),
      isVip: false,
    },
  ];

  // Smooth scroll and state sync handler without entire viewport hijacking
  const scrollToCard = useCallback((index: number) => {
    // Loop around gracefully
    const targetIndex = (index + SHOWCASE_ITEMS.length) % SHOWCASE_ITEMS.length;
    setActiveIndex(targetIndex);
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.children[targetIndex] as HTMLElement;
      if (card) {
        // Calculate the target scroll position relative to the container itself, preventing page-level scroll hijacking
        const targetScrollLeft = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
        container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }
    }
  }, []);

  const handleNext = useCallback(() => {
    scrollToCard(activeIndex + 1);
  }, [activeIndex, scrollToCard]);

  const handlePrev = useCallback(() => {
    scrollToCard(activeIndex - 1);
  }, [activeIndex, scrollToCard]);

  // Auto-play timer (3.5 detik) with pause-on-hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.children[0]?.clientWidth || 300;
      const calculatedIndex = Math.round(scrollLeft / (cardWidth + 16));
      if (calculatedIndex >= 0 && calculatedIndex < SHOWCASE_ITEMS.length && calculatedIndex !== activeIndex) {
        setActiveIndex(calculatedIndex);
      }
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  return (
    <section 
      ref={sectionRef}
      className="w-full space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header bar with controls */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1 text-left min-w-0">
          <div
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap shrink-0 ${
              isLegacyDark
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/60'
                : 'bg-emerald-50 dark:bg-[#0F2D4A] text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-white/[0.08]'
            }`}
          >
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">{t('access.tag_badge', 'FASILITAS PRIORITAS & INKLUSIF')}</span>
          </div>
          <h2 className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-sans truncate">
            {t('access.section_title', 'Aksesibilitas & Fasilitasi Cepat')}
          </h2>
        </div>

        {/* Carousel Arrow Navigation — Layer 1 (#0F2D4A) -> hover Layer 2 (#143755) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Geser ke kiri"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isLegacyDark
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 shadow-2xs hover:shadow-md'
                : 'bg-white dark:bg-[#0F2D4A] hover:bg-slate-100 dark:hover:bg-[#143755] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Geser ke kanan"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              isLegacyDark
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 shadow-2xs hover:shadow-md'
                : 'bg-white dark:bg-[#0F2D4A] hover:bg-slate-100 dark:hover:bg-[#143755] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Swipeable Cards Container — Layer 1 (#0F2D4A) Card + Layer 2 (#143755) Inner Elements */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none no-scrollbar pb-3 pt-1 px-1 touch-pan-x"
        >
          {SHOWCASE_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isCurrent = activeIndex === idx;

            return (
              <motion.div
                key={item.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                animate={inView || shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ 
                  duration: 0.5, 
                  delay: shouldReduceMotion ? 0 : idx * 0.1, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className={`w-[85vw] max-w-[340px] sm:w-[380px] shrink-0 snap-center sm:snap-start rounded-3xl border transition-all duration-300 active:scale-[0.98] flex flex-col justify-between overflow-hidden group select-none text-left ${
                  isLegacyDark
                    ? `bg-white dark:bg-surface ${
                        isCurrent
                          ? 'border-emerald-500/70 dark:border-emerald-500/60 shadow-xl shadow-black/25 dark:shadow-black/25 ring-1 ring-emerald-500/20'
                          : 'border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-xl hover:border-emerald-500/50'
                      }`
                    : `bg-white dark:bg-[#0F2D4A] ${
                        isCurrent
                          ? 'border-slate-300 dark:border-white/[0.15] shadow-md dark:shadow-none'
                          : 'border-slate-200/90 dark:border-white/[0.07] shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-white/[0.14]'
                      }`
                }`}
              >
                {/* Image Banner Header: Enhanced height on mobile & desktop */}
                <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-[#143755]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    loading="lazy"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${
                      isLegacyDark
                        ? 'from-slate-950 via-slate-950/40 to-transparent'
                        : 'from-[#0F2D4A] via-[#0F2D4A]/45 to-transparent'
                    }`}
                  />
                  
                  {/* Floating Badge — Layer 2 (#143755) */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border whitespace-nowrap shrink-0 ${item.badgeColor}`}>
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{item.badge}</span>
                    </span>
                  </div>

                  <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                    <div
                      className={`text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${
                        isLegacyDark ? 'text-emerald-300' : 'text-emerald-400'
                      }`}
                    >
                      {item.kicker}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold leading-snug line-clamp-2 min-h-[2.8rem] sm:min-h-[3.2rem] font-sans text-slate-50">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {item.description}
                  </p>

                  {/* Feature Checklist Tags */}
                  <div className="space-y-1.5 pt-1">
                    {item.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action CTA Button — Layer 2 (#143755) inside Layer 1 (#0F2D4A) */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.isVip && onOpenVipInvestor) {
                          onOpenVipInvestor();
                        } else if (onOpenAccessibilityPanel) {
                          onOpenAccessibilityPanel();
                        }
                      }}
                      className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                        isLegacyDark
                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white dark:hover:text-white text-slate-800 dark:text-slate-200 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white'
                          : 'bg-slate-100 dark:bg-[#143755] hover:bg-emerald-600 dark:hover:bg-[#1A4366] text-slate-800 dark:text-slate-100 hover:text-white border border-slate-200/80 dark:border-white/[0.07]'
                      }`}
                    >
                      <span>{item.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dot Indicators (Mobile & Desktop) */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {SHOWCASE_ITEMS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => scrollToCard(idx)}
            aria-label={`Lihat slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === idx 
                ? 'w-7 bg-emerald-600 dark:bg-emerald-400 shadow-xs' 
                : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default PriorityShowcaseCarousel;
