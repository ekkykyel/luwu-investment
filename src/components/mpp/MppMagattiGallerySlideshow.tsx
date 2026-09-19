import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Maximize2, X, 
  Sparkles, Building2, Eye, Layers, Image as ImageIcon, MapPin, Check,
  Info, ShieldCheck, Heart, Accessibility, Monitor, Compass, Sparkle,
  SlidersHorizontal, CheckCircle2
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
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [progress, setProgress] = useState(0);

  // Touch handlers for Android and mobile swipe
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

    const handleUpdate = () => {
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
    setProgress(0);
  }, [activePhotosCount]);

  const prevSlide = useCallback(() => {
    if (activePhotosCount <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + activePhotosCount) % activePhotosCount);
    setProgress(0);
  }, [activePhotosCount]);

  // Auto Play Timer & Progress Bar
  useEffect(() => {
    if (!settings.autoPlay || isPaused || activePhotosCount <= 1) return;

    const intervalTime = settings.intervalMs || 5000;
    const stepMs = 50;
    const progressIncrement = (stepMs / intervalTime) * 100;

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + progressIncrement;
      });
    }, stepMs);

    return () => clearInterval(progressTimer);
  }, [settings.autoPlay, settings.intervalMs, isPaused, activePhotosCount, nextSlide]);

  // Touch gesture listeners for Android mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      nextSlide(); // Swipe Left
    } else if (diff < -45) {
      prevSlide(); // Swipe Right
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation when in fullscreen or focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, nextSlide, prevSlide]);

  if (activePhotosCount === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Tampak Depan':
        return <Building2 size={13} className="text-emerald-400" />;
      case 'Ruang Loket':
        return <Layers size={13} className="text-sky-400" />;
      case 'Lobby & Konsierge':
        return <Sparkles size={13} className="text-amber-400" />;
      case 'Fasilitas Digital':
        return <Monitor size={13} className="text-purple-400" />;
      case 'Lounge VIP':
        return <ShieldCheck size={13} className="text-yellow-400" />;
      case 'Ruang Ramah Anak':
        return <Heart size={13} className="text-rose-400" />;
      case 'Fasilitas Inklusi':
        return <Accessibility size={13} className="text-teal-400" />;
      default:
        return <ImageIcon size={13} className="text-emerald-400" />;
    }
  };

  // Animation variants
  const getVariants = () => {
    switch (settings.animationType) {
      case 'slide3d':
        return {
          initial: (dir: number) => ({
            opacity: 0,
            x: dir > 0 ? 250 : -250,
            scale: 0.95,
          }),
          animate: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
          },
          exit: (dir: number) => ({
            opacity: 0,
            x: dir > 0 ? -250 : 250,
            scale: 0.95,
            transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
          })
        };
      case 'blurFade':
        return {
          initial: { opacity: 0, filter: 'blur(12px)', scale: 1.04 },
          animate: { opacity: 1, filter: 'blur(0px)', scale: 1, transition: { duration: 0.8, ease: 'easeOut' } },
          exit: { opacity: 0, filter: 'blur(12px)', scale: 0.96, transition: { duration: 0.6, ease: 'easeIn' } }
        };
      case 'fadeZoom':
        return {
          initial: { opacity: 0, scale: 0.92 },
          animate: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
          exit: { opacity: 0, scale: 1.06, transition: { duration: 0.5, ease: 'easeIn' } }
        };
      case 'kenburns':
      default:
        return {
          initial: { opacity: 0, scale: 1.12 },
          animate: { opacity: 1, scale: 1, transition: { duration: 1.1, ease: [0.25, 1, 0.5, 1] } },
          exit: { opacity: 0, scale: 1.04, transition: { duration: 0.7, ease: 'easeInOut' } }
        };
    }
  };

  const variants = getVariants();

  return (
    <div className={`relative w-full select-none font-sans ${className}`}>
      {/* ========================================================================= */}
      {/* MAIN GRAND CINEMATIC SLIDESHOW SHOWCASE (CLEAN, IMMERSIVE & ELEGANT)      */}
      {/* ========================================================================= */}
      <div 
        className="relative w-full h-[500px] xs:h-[530px] sm:h-[560px] md:h-[600px] lg:h-[640px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/10 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Photo Canvas */}
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
                loading="eager"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Pure Cinematic Vignette - Foto Ruangan & Gedung 100% Bersih & Tampak Megah */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-slate-950/30 pointer-events-none" />
          <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay pointer-events-none" />
        </div>

        {/* Minimalist Top Right Micro Action Pill Cluster */}
        <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20 pointer-events-auto">
          <div className="flex items-center gap-1 p-1 rounded-full bg-slate-950/60 hover:bg-slate-950/85 backdrop-blur-xl border border-white/15 shadow-xl transition-all">
            {/* Room Features Toggle */}
            <button
              type="button"
              onClick={() => setShowRoomDetails(!showRoomDetails)}
              className={`p-2 rounded-full transition-all shadow-xs active:scale-90 cursor-pointer ${
                showRoomDetails
                  ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/15'
              }`}
              title="Informasi Spesifikasi Ruangan"
              aria-label="Informasi Spesifikasi Ruangan"
            >
              <Info size={14} />
            </button>

            {/* Pause / Play */}
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/15 transition-all shadow-xs active:scale-90 cursor-pointer"
              title={isPaused ? "Lanjutkan Slideshow" : "Jeda Slideshow"}
              aria-label={isPaused ? "Lanjutkan Slideshow" : "Jeda Slideshow"}
            >
              {isPaused ? <Play size={14} className="text-emerald-400" /> : <Pause size={14} />}
            </button>

            {/* Fullscreen HD Inspection */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/15 transition-all shadow-xs active:scale-90 cursor-pointer"
              title="Lihat Foto Layar Penuh HD"
              aria-label="Lihat Foto Layar Penuh HD"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Floating Room Specifications Panel (Expandable on tap or click) */}
        <AnimatePresence>
          {showRoomDetails && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-3.5 right-3.5 z-30 p-4 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-emerald-500/30 shadow-2xl text-white max-w-lg"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Spesifikasi Fasilitas Ruangan</h4>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowRoomDetails(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <MapPin size={12} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">Lokasi:</span>
                  <span>{currentPhoto.location || 'MPP Simpurusiang Belopa'}</span>
                </div>

                {currentPhoto.features && currentPhoto.features.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Fasilitas Tersedia:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPhoto.features.map((feat, fIdx) => (
                        <span key={fIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium">
                          <CheckCircle2 size={10} className="text-emerald-400" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left / Right Arrow Navigation Buttons */}
        {activePhotosCount > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-slate-950/70 backdrop-blur-md text-white hover:bg-emerald-600 hover:text-white border border-white/15 transition-all shadow-xl opacity-85 sm:opacity-0 group-hover:opacity-100 active:scale-90 cursor-pointer"
              aria-label="Foto Ruangan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-slate-950/70 backdrop-blur-md text-white hover:bg-emerald-600 hover:text-white border border-white/15 transition-all shadow-xl opacity-85 sm:opacity-0 group-hover:opacity-100 active:scale-90 cursor-pointer"
              aria-label="Foto Ruangan Selanjutnya"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* ========================================================================= */}
        {/* REFINED FLOATING CAPTION ISLAND WITH NEON GLOW PAGINATION DOTS            */}
        {/* ========================================================================= */}
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-20 pointer-events-auto">
          <div className="bg-slate-950/85 backdrop-blur-2xl border border-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] space-y-1.5 sm:space-y-2">
            
            {/* Top Row: Location Tag & Glow Pagination Indicators */}
            <div className="flex items-center justify-between gap-3">
              {/* Location Tag */}
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <MapPin size={12} className="text-emerald-400 shrink-0" />
                <span className="text-slate-200 font-medium text-[11px] sm:text-xs">
                  {currentPhoto.location || 'MPP Simpurusiang Belopa'}
                </span>
              </div>

              {/* Glowing Pagination Dots & Slide Counter */}
              {activePhotosCount > 1 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {photos.map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setDirection(idx > currentIndex ? 1 : -1);
                          setCurrentIndex(idx);
                          setProgress(0);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === currentIndex
                            ? 'w-6 sm:w-8 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.95)]'
                            : 'w-1.5 sm:w-2 bg-white/25 hover:bg-white/50'
                        }`}
                        aria-label={`Ke foto ruangan ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400/90 pl-1 font-semibold">
                    {String(currentIndex + 1).padStart(2, '0')}/{String(activePhotosCount).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Photo Title with Emerald Accent Dot */}
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-white leading-snug font-sans drop-shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span className="truncate">{currentPhoto.title}</span>
            </h3>

            {/* Short Refined Caption */}
            {settings.showCaption && currentPhoto.caption && (
              <p className="text-xs sm:text-sm text-slate-300/95 leading-relaxed font-normal line-clamp-2">
                {currentPhoto.caption}
              </p>
            )}

            {/* Auto-Play Progress Bar at bottom */}
            {settings.autoPlay && !isPaused && (
              <div className="w-full bg-white/10 h-0.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-75 ease-linear shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FULLSCREEN CINEMATIC HD LIGHTBOX WITH ROOM VIEWER                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFullscreen && (
          <div className="fixed inset-0 z-[999999] bg-slate-950/98 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none">
            {/* Lightbox Top Header */}
            <div className="flex items-center justify-between z-10 pb-2 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {getCategoryIcon(currentPhoto.category)}
                  <span>{currentPhoto.category}</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Foto {currentIndex + 1} dari {activePhotosCount}
                </span>
                {currentPhoto.location && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-300">
                    <MapPin size={12} className="text-emerald-400" />
                    <span>{currentPhoto.location}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2.5 rounded-full bg-slate-800/80 hover:bg-rose-500 text-white transition-all shadow-lg cursor-pointer"
                title="Tutup Layar Penuh (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lightbox Image Center */}
            <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 my-auto overflow-hidden">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.title}
                className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />

              {activePhotosCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="absolute left-2 sm:left-6 p-3.5 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white border border-white/20 transition-all shadow-xl cursor-pointer"
                    aria-label="Foto Sebelumnya"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-6 p-3.5 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white border border-white/20 transition-all shadow-xl cursor-pointer"
                    aria-label="Foto Selanjutnya"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Bottom Info & Thumbnail Strip */}
            <div className="max-w-4xl mx-auto w-full text-center space-y-3 z-10 pt-2 border-t border-white/10">
              <div>
                <h4 className="text-base sm:text-xl font-bold text-white font-sans">
                  {currentPhoto.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed mt-1 line-clamp-2">
                  {currentPhoto.caption}
                </p>
              </div>

              {/* Room Thumbnails for Quick Hop */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setDirection(idx > currentIndex ? 1 : -1);
                      setCurrentIndex(idx);
                    }}
                    className={`relative w-14 h-10 sm:w-18 sm:h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      idx === currentIndex ? 'border-emerald-400 scale-108 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
