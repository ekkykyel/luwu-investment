import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Maximize2, X, 
  Sparkles, Building2, Eye, Layers, Image as ImageIcon, MapPin, Check
} from 'lucide-react';
import { 
  MagattiPhotoItem, 
  MagattiSlideshowSettings, 
  getStoredMagattiPhotos, 
  getStoredMagattiSettings 
} from '../../data/mppMagattiGalleryData';

interface MppMagattiGallerySlideshowProps {
  className?: string;
  isDark?: boolean;
}

export const MppMagattiGallerySlideshow: React.FC<MppMagattiGallerySlideshowProps> = ({
  className = '',
  isDark = true
}) => {
  const [photos, setPhotos] = useState<MagattiPhotoItem[]>([]);
  const [settings, setSettings] = useState<MagattiSlideshowSettings>(getStoredMagattiSettings());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Swipe gesture touch references for Android
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Load photos & settings
  const loadData = useCallback(() => {
    const rawPhotos = getStoredMagattiPhotos();
    const active = rawPhotos.filter(p => p.isActive).sort((a, b) => a.order - b.order);
    setPhotos(active.length > 0 ? active : rawPhotos);
    setSettings(getStoredMagattiSettings());
  }, []);

  useEffect(() => {
    loadData();

    const handleUpdate = (e: any) => {
      loadData();
    };

    window.addEventListener('mpp_magatti_gallery_updated', handleUpdate);
    return () => window.removeEventListener('mpp_magatti_gallery_updated', handleUpdate);
  }, [loadData]);

  const activePhotosCount = photos.length;

  const nextSlide = useCallback(() => {
    if (activePhotosCount <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % activePhotosCount);
  }, [activePhotosCount]);

  const prevSlide = useCallback(() => {
    if (activePhotosCount <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + activePhotosCount) % activePhotosCount);
  }, [activePhotosCount]);

  // Auto Play Timer
  useEffect(() => {
    if (!settings.autoPlay || isPaused || activePhotosCount <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, settings.intervalMs || 5000);

    return () => clearInterval(timer);
  }, [settings.autoPlay, settings.intervalMs, isPaused, activePhotosCount, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      nextSlide(); // Swipe Left
    } else if (diff < -40) {
      prevSlide(); // Swipe Right
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (activePhotosCount === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  // Animation variants configuration based on admin settings
  const getVariants = () => {
    switch (settings.animationType) {
      case 'slide3d':
        return {
          initial: (dir: number) => ({
            opacity: 0,
            x: dir > 0 ? 300 : -300,
            scale: 0.92,
            rotateY: dir > 0 ? 15 : -15
          }),
          animate: {
            opacity: 1,
            x: 0,
            scale: 1,
            rotateY: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
          },
          exit: (dir: number) => ({
            opacity: 0,
            x: dir > 0 ? -300 : 300,
            scale: 0.92,
            rotateY: dir > 0 ? -15 : 15,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
          })
        };
      case 'blurFade':
        return {
          initial: { opacity: 0, filter: 'blur(16px)', scale: 1.05 },
          animate: { opacity: 1, filter: 'blur(0px)', scale: 1, transition: { duration: 0.9, ease: 'easeOut' } },
          exit: { opacity: 0, filter: 'blur(16px)', scale: 0.95, transition: { duration: 0.7, ease: 'easeIn' } }
        };
      case 'fadeZoom':
        return {
          initial: { opacity: 0, scale: 0.88 },
          animate: { opacity: 1, scale: 1, transition: { duration: 0.75, ease: 'easeOut' } },
          exit: { opacity: 0, scale: 1.1, transition: { duration: 0.6, ease: 'easeIn' } }
        };
      case 'kenburns':
      default:
        return {
          initial: { opacity: 0, scale: 1.15 },
          animate: { opacity: 1, scale: 1, transition: { duration: 1.2, ease: [0.25, 1, 0.5, 1] } },
          exit: { opacity: 0, scale: 1.05, transition: { duration: 0.8, ease: 'easeInOut' } }
        };
    }
  };

  const variants = getVariants();

  return (
    <div 
      className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/30 dark:border-white/10 group select-none font-sans ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Slideshow Canvas */}
      <div className="absolute inset-0 bg-slate-950 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPhoto.id}
            custom={direction}
            variants={variants as any}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/40 pointer-events-none" />
        <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay pointer-events-none" />
      </div>

      {/* Top Header Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Category Badge */}
          <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] sm:text-xs font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shadow-lg flex items-center gap-1.5">
            <Building2 size={12} className="text-emerald-400" />
            <span>{currentPhoto.category}</span>
          </span>

          {/* Counter Badge */}
          <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] sm:text-xs font-bold text-slate-300 border border-white/10 shadow-lg font-mono">
            {currentIndex + 1} / {activePhotosCount}
          </span>
        </div>

        {/* Actions (Pause/Play & Fullscreen) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-full bg-slate-950/80 backdrop-blur-md text-white/80 hover:text-white hover:bg-emerald-500/80 border border-white/10 transition-all shadow-lg active:scale-90"
            title={isPaused ? "Lanjutkan Slideshow" : "Jeda Slideshow"}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>

          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2 rounded-full bg-slate-950/80 backdrop-blur-md text-white/80 hover:text-white hover:bg-emerald-500/80 border border-white/10 transition-all shadow-lg active:scale-90"
            title="Lihat Foto Layar Penuh"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Left / Right Arrow Navigation Buttons */}
      {activePhotosCount > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-slate-950/70 backdrop-blur-md text-white hover:bg-emerald-500 hover:text-white border border-white/15 transition-all shadow-xl opacity-80 sm:opacity-0 group-hover:opacity-100 active:scale-90"
            aria-label="Foto Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-slate-950/70 backdrop-blur-md text-white hover:bg-emerald-500 hover:text-white border border-white/15 transition-all shadow-xl opacity-80 sm:opacity-0 group-hover:opacity-100 active:scale-90"
            aria-label="Foto Selanjutnya"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* Bottom Glassmorphic Caption Bar */}
      <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-auto">
        <div className="max-w-3xl space-y-2">
          {/* Tagline Motto Magatti Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles size={12} className="text-emerald-400" />
            <span>Pelayanan Magatti • Murah, Gampang, Cepat, Tepat, Inovatif</span>
          </div>

          {/* Photo Title */}
          <h3 className="text-base sm:text-xl md:text-2xl font-extrabold text-white leading-tight font-sans drop-shadow-md">
            {currentPhoto.title}
          </h3>

          {/* Caption */}
          {settings.showCaption && currentPhoto.caption && (
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-medium line-clamp-2 drop-shadow">
              {currentPhoto.caption}
            </p>
          )}

          {/* Progress Indicators */}
          {activePhotosCount > 1 && (
            <div className="flex items-center gap-1.5 pt-2">
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-8 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Ke foto ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal Fullscreen */}
      <AnimatePresence>
        {isFullscreen && (
          <div className="fixed inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 overflow-hidden select-none">
            {/* Lightbox Top Header */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  {currentPhoto.category}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Foto {currentIndex + 1} dari {activePhotosCount}
                </span>
              </div>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-3 rounded-full bg-slate-800/80 hover:bg-rose-500 text-white transition-all shadow-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lightbox Image Center */}
            <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 my-auto">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.title}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />

              {activePhotosCount > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 sm:left-6 p-4 rounded-full bg-slate-900/80 hover:bg-emerald-500 text-white border border-white/20 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-6 p-4 rounded-full bg-slate-900/80 hover:bg-emerald-500 text-white border border-white/20 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Bottom Info */}
            <div className="max-w-3xl mx-auto text-center space-y-1.5 z-10">
              <h4 className="text-lg sm:text-2xl font-extrabold text-white">
                {currentPhoto.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {currentPhoto.caption}
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
