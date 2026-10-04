import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Accessibility, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  Armchair, 
  Baby, 
  ExternalLink 
} from 'lucide-react';

export interface PriorityShowcaseCarouselProps {
  onOpenAccessibilityPanel?: () => void;
  onOpenVipInvestor?: () => void;
  isDark?: boolean;
}

const SHOWCASE_ITEMS = [
  {
    id: 'vip-investor',
    type: 'vip',
    title: 'Fasilitasi Penanaman Modal & Investasi',
    kicker: 'Layanan Eksekutif',
    description: 'Layanan asistensi personal satu pintu untuk penanam modal korporasi dan UMKM skala menengah ke atas dengan pendampingan langsung Liaison Officer DPMPTSP.',
    badge: 'Prioritas Investasi',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    icon: Briefcase,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    features: ['Pendampingan OSS-RBA', 'Konsultasi Tata Ruang RDTR', 'Fasilitasi Insentif Pajak Daerah'],
    actionLabel: 'Hubungi Liaison Officer',
    isVip: true,
  },
  {
    id: 'ramah-disabilitas',
    type: 'inklusif',
    title: 'Jalur Fast-Track Ramah Disabilitas',
    kicker: 'Pelayanan Inklusif',
    description: 'Penyandang disabilitas, lansia >60 tahun, dan ibu hamil langsung mendapatkan nomor antrean khusus tanpa perlu menunggu antrean reguler.',
    badge: 'Prioritas Inklusi',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    icon: Accessibility,
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800',
    features: ['Kursi Roda & Jalur Landai', 'Petugas Pendamping Bahasa Isyarat', 'Kiosk Khusus Layar Rendah'],
    actionLabel: 'Buka Menu Inklusif',
    isVip: false,
  },
  {
    id: 'executive-lounge',
    type: 'vip',
    title: 'Executive Lounge & Business Corner',
    kicker: 'Fasilitas Unggulan',
    description: 'Ruang tunggu eksklusif berpenyejuk udara sentral dengan koneksi internet cepat, stasiun pengisian daya gawai, dan sajian kopi Luwu.',
    badge: 'Fasilitas Eksekutif',
    badgeColor: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    icon: Armchair,
    image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
    features: ['Wi-Fi Orbit Berkecepatan Tinggi', 'Layar Monitor Progres Berkas', 'Bilik Konsultasi Privat'],
    actionLabel: 'Lihat Denah Lounge',
    isVip: true,
  },
  {
    id: 'laktasi-anak',
    type: 'inklusif',
    title: 'Ruang Laktasi & Arena Bermain Ramah Anak',
    kicker: 'Fasilitas Keluarga',
    description: 'Bilik privat higienis untuk ibu menyusui serta arena bermain anak edukatif yang diawasi agar orang tua dapat mengurus berkas dengan tenang.',
    badge: 'Fasilitas Keluarga',
    badgeColor: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    icon: Baby,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800',
    features: ['Sterilizer & Kulkas ASI', 'Mainan Edukasi Standar SNI', 'Sofa Laktasi Ergonomis'],
    actionLabel: 'Panduan Fasilitas Anak',
    isVip: false,
  },
];

export const PriorityShowcaseCarousel: React.FC<PriorityShowcaseCarouselProps> = ({
  onOpenAccessibilityPanel,
  onOpenVipInvestor,
  isDark = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

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
      className="w-full space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header bar with controls */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Fasilitas Prioritas & Layanan Inklusif</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            Aksesibilitas & Fasilitasi Cepat
          </h2>
        </div>

        {/* Carousel Arrow Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Geser ke kiri"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-md active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Geser ke kanan"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-md active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Swipeable Cards Container with native snap & smooth sliding */}
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className={`w-[85vw] max-w-[340px] sm:w-[380px] shrink-0 snap-center sm:snap-start rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 active:scale-[0.98] flex flex-col justify-between overflow-hidden group select-none ${
                  isCurrent
                    ? 'border-emerald-500/70 dark:border-emerald-500/60 shadow-xl shadow-emerald-900/5 dark:shadow-emerald-950/20 ring-1 ring-emerald-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-xl hover:border-emerald-500/50'
                }`}
              >
                {/* Image Banner Header: Enhanced height on mobile & desktop */}
                <div className="relative h-60 sm:h-64 md:h-72 w-full overflow-hidden bg-slate-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  {/* Floating Badge */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border ${item.badgeColor}`}>
                      <Icon className="w-3 h-3" />
                      {item.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                    <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-0.5">
                      {item.kicker}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold leading-snug line-clamp-2 min-h-[2.8rem] sm:min-h-[3.2rem] font-sans">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
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

                  {/* Action CTA Button */}
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
                      className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white dark:hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white"
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
