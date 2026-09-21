import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [photos, setPhotos] = useState<MagattiPhotoItem[]>([]);
  const [settings, setSettings] = useState<MagattiSlideshowSettings>(getStoredMagattiSettings());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [progress, setProgress] = useState(0);

  // Localize photos dynamically based on language
  const displayPhotos = useMemo(() => {
    return photos.map(photo => {
      if (photo.id === 'magatti-1') {
        return {
          ...photo,
          title: isEn ? 'Front Entrance View of Simpurusiang MPP Building' : isZh ? '辛普鲁西亚公共服务中心大楼正门外观' : photo.title,
          caption: isEn ? 'Main facade of the Simpurusiang Public Service Mall in Pahlawan Street, Belopa, combining modern architecture with local heritage.' : isZh ? '位于贝洛帕 Pahlawan 路的鲁乌县辛普鲁西亚公共服务中心大楼主立面，展现现代建筑特色与地方智慧的融合。' : photo.caption,
          category: isEn ? 'Front Exterior' : isZh ? '大楼外观' : photo.category,
          location: isEn ? 'Pahlawan St. No. 1, Belopa' : isZh ? '贝洛帕 Pahlawan 路1号' : photo.location,
          features: isEn ? ['Spacious Parking', 'Green Park', 'Barrier-Free Entrance', '24/7 Security Post'] : isZh ? ['宽敞停车位', '绿化公园', '无障碍入口', '24小时安保哨所'] : photo.features
        };
      }
      if (photo.id === 'magatti-2') {
        return {
          ...photo,
          title: isEn ? 'One-Stop Integrated Service Counter Hall' : isZh ? '一站式综合服务窗口大厅' : photo.title,
          caption: isEn ? 'Integrated counter hall housing 26 institutional booths with ergonomic spatial design and multi-language automated queue callers.' : isZh ? '整合 26 个部门服务窗口的大厅，配备人体工程学空间布局与多语言自动叫号系统。' : photo.caption,
          category: isEn ? 'Counter Hall' : isZh ? '服务窗口' : photo.category,
          location: isEn ? 'Floor 1 • Main Hall' : isZh ? '1 楼 • 主大厅' : photo.location,
          features: isEn ? ['26 Department Booths', 'Digital Display Monitors', 'Ergonomic Waiting Seats', 'Central Air Conditioning'] : isZh ? ['26 个部门服务窗口', '数字显示监控屏', '人体工程学等候座椅', '全空调环境'] : photo.features
        };
      }
      if (photo.id === 'magatti-3') {
        return {
          ...photo,
          title: isEn ? 'Main Lobby & Digital Concierge Assistant' : isZh ? '主大厅与数字助理礼宾台' : photo.title,
          caption: isEn ? 'Citizen reception lobby featuring friendly front-desk staff, AI voice assistant Ta\', and real-time interactive service analytics displays.' : isZh ? '市民接待大厅配备亲和的前台工作人员、AI 语音助手 Ta\' 以及实时服务统计互动大屏。' : photo.caption,
          category: isEn ? 'Lobby & Concierge' : isZh ? '大厅与礼宾' : photo.category,
          location: isEn ? 'Floor 1 • Entrance Foyer' : isZh ? '1 楼 • 入口门厅' : photo.location,
          features: isEn ? ['Concierge Desk', 'Satisfaction Index Touch Screen', 'Free High-Speed Wi-Fi', 'Transparent Fee Schedule'] : isZh ? ['礼宾咨询台', '满意度指数触控屏', '免费高速 Wi-Fi', '透明服务收费标准'] : photo.features
        };
      }
      if (photo.id === 'magatti-4') {
        return {
          ...photo,
          title: isEn ? 'Self-Service Kiosk & Document Printing Station' : isZh ? '自助服务终端与文件打印机' : photo.title,
          caption: isEn ? 'Self-service station allowing citizens to print e-KTPs, MSME NIBs, verify files, and renew documents independently without queuing.' : isZh ? '市民自助设施，可自主打印电子身份证、微型企业 NIB、验证文件及办理延期，无需排队。' : photo.caption,
          category: isEn ? 'Digital Facilities' : isZh ? '数字设施' : photo.category,
          location: isEn ? 'Floor 1 • Left Wing' : isZh ? '1 楼 • 左翼' : photo.location,
          features: isEn ? ['e-KTP Printer Machine', 'OSS NIB Kiosk', 'QR Code Document Scanner', 'Audio Guidance Instructions'] : isZh ? ['电子身份证 (KTP-el) 打印机', 'OSS NIB 自助终端', '二维码文件扫描', '语音引导指引'] : photo.features
        };
      }
      if (photo.id === 'magatti-5') {
        return {
          ...photo,
          title: isEn ? 'VIP Fast-Track Investor Lounge' : isZh ? 'VIP 投资者绿色通道服务休息室' : photo.title,
          caption: isEn ? 'Exclusive consultation room for investors, business owners, and capital providers with direct guidance from Luwu DPMPTSP Account Officers.' : isZh ? '专为投资者、企业家和招商引资人员提供的独家咨询室，由鲁乌 DPMPTSP 客户经理全程陪同。' : photo.caption,
          category: isEn ? 'VIP Lounge' : isZh ? 'VIP 贵宾室' : photo.category,
          location: isEn ? 'Floor 2 • East Wing' : isZh ? '2 楼 • 东翼' : photo.location,
          features: isEn ? ['Private Business Consultation', 'Conference & Presentation Setup', 'Luwu Specialty Coffee Corner', 'Gigabit Connectivity'] : isZh ? ['私密商业咨询', '会议与演示设施', '鲁乌特色咖啡角', '千兆网络连接'] : photo.features
        };
      }
      if (photo.id === 'magatti-6') {
        return {
          ...photo,
          title: isEn ? 'Kids Play Zone & Nursing Room' : isZh ? '儿童乐园与母婴室设施' : photo.title,
          caption: isEn ? 'Safe and hygienic interactive play area for kids, plus a private nursing room offering comfort for breastfeeding mothers.' : isZh ? '安全卫生的儿童互动游乐区，以及为哺乳期母亲准备的舒适私密母婴室。' : photo.caption,
          category: isEn ? 'Kids Room' : isZh ? '儿童乐园' : photo.category,
          location: isEn ? 'Floor 1 • West Wing' : isZh ? '1 楼 • 西翼' : photo.location,
          features: isEn ? ['Educational Toys', 'Private Lactation Sofa', 'Sterilizer & Sink', 'Soft Foam Flooring'] : isZh ? ['儿童益智玩具', '私密哺乳沙发', '消毒器与洗手池', '软泡沫安全地板'] : photo.features
        };
      }
      if (photo.id === 'magatti-7') {
        return {
          ...photo,
          title: isEn ? 'Tactile Guiding Blocks & Disability Accessibility Facilities' : isZh ? '盲道触觉地砖与无障碍设施' : photo.title,
          caption: isEn ? 'Full accessibility standards for visitors with disabilities and elderly guests, including tactile paths, complimentary wheelchairs, and low counters.' : isZh ? '为残障人士与老年人提供的无障碍标准，包含盲道地砖、免费轮椅及无障碍低矮窗口。' : photo.caption,
          category: isEn ? 'Inclusion Facilities' : isZh ? '无障碍设施' : photo.category,
          location: isEn ? 'All Corridors & Access Doors' : isZh ? '全楼层走廊与通道' : photo.location,
          features: isEn ? ['Medical Grade Wheelchairs', 'Tactile Guiding Path for Visually Impaired', 'PU Standard Access Ramp', 'Accessible Restroom'] : isZh ? ['医用标准轮椅', '盲人导向盲道', '标准坡度无障碍坡道', '无障碍专用卫生间'] : photo.features
        };
      }
      return photo;
    });
  }, [photos, isEn, isZh]);

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

  const currentPhoto = displayPhotos[currentIndex] || displayPhotos[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Tampak Depan':
      case 'Front Exterior':
      case '大楼外观':
        return <Building2 size={13} className="text-emerald-400" />;
      case 'Ruang Loket':
      case 'Counter Hall':
      case '服务窗口':
        return <Layers size={13} className="text-sky-400" />;
      case 'Lobby & Konsierge':
      case 'Lobby & Concierge':
      case '大厅与礼宾':
        return <Sparkles size={13} className="text-amber-400" />;
      case 'Fasilitas Digital':
      case 'Digital Facilities':
      case '数字设施':
        return <Monitor size={13} className="text-purple-400" />;
      case 'Lounge VIP':
      case 'VIP Lounge':
      case 'VIP 贵宾室':
        return <ShieldCheck size={13} className="text-yellow-400" />;
      case 'Ruang Ramah Anak':
      case 'Kids Room':
      case '儿童乐园':
        return <Heart size={13} className="text-rose-400" />;
      case 'Fasilitas Inklusi':
      case 'Inclusion Facilities':
      case '无障碍设施':
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
        className="relative w-full h-[440px] xs:h-[480px] sm:h-[540px] md:h-[600px] lg:h-[640px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/10 group"
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
              title={isEn ? "Room Specification Info" : isZh ? "房间设施规格与标准" : "Informasi Spesifikasi Ruangan"}
              aria-label={isEn ? "Room Specification Info" : isZh ? "房间设施规格与标准" : "Informasi Spesifikasi Ruangan"}
            >
              <Info size={14} />
            </button>

            {/* Pause / Play */}
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/15 transition-all shadow-xs active:scale-90 cursor-pointer"
              title={isPaused 
                ? (isEn ? "Resume Slideshow" : isZh ? "播放幻灯片" : "Lanjutkan Slideshow") 
                : (isEn ? "Pause Slideshow" : isZh ? "暂停幻灯片" : "Jeda Slideshow")}
              aria-label={isPaused 
                ? (isEn ? "Resume Slideshow" : isZh ? "播放幻灯片" : "Lanjutkan Slideshow") 
                : (isEn ? "Pause Slideshow" : isZh ? "暂停幻灯片" : "Jeda Slideshow")}
            >
              {isPaused ? <Play size={14} className="text-emerald-400" /> : <Pause size={14} />}
            </button>

            {/* Fullscreen HD Inspection */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/15 transition-all shadow-xs active:scale-90 cursor-pointer"
              title={isEn ? "Full Screen HD View" : isZh ? "全屏高清照片查看" : "Lihat Foto Layar Penuh HD"}
              aria-label={isEn ? "Full Screen HD View" : isZh ? "全屏高清照片查看" : "Lihat Foto Layar Penuh HD"}
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    {isEn ? "Room Facility Specifications" : isZh ? "房间设施规格与标准" : "Spesifikasi Fasilitas Ruangan"}
                  </h4>
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
                  <span className="font-semibold text-white">{isEn ? "Location:" : isZh ? "位置:" : "Lokasi:"}</span>
                  <span>{currentPhoto.location || 'MPP Simpurusiang Belopa'}</span>
                </div>

                {currentPhoto.features && currentPhoto.features.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5">{isEn ? "Available Facilities:" : isZh ? "可用设施:" : "Fasilitas Tersedia:"}</div>
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
              aria-label={isEn ? "Previous Photo" : isZh ? "上一张照片" : "Foto Ruangan Sebelumnya"}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-slate-950/70 backdrop-blur-md text-white hover:bg-emerald-600 hover:text-white border border-white/15 transition-all shadow-xl opacity-85 sm:opacity-0 group-hover:opacity-100 active:scale-90 cursor-pointer"
              aria-label={isEn ? "Next Photo" : isZh ? "下一张照片" : "Foto Ruangan Selanjutnya"}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* ========================================================================= */}
        {/* REFINED FLOATING CAPTION ISLAND WITH NEON GLOW PAGINATION DOTS            */}
        {/* ========================================================================= */}
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-20 pointer-events-auto">
          <div className={`backdrop-blur-2xl border rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-2xl space-y-1.5 sm:space-y-2 transition-all ${
            isDark
              ? 'bg-slate-950/85 border-white/15 text-white shadow-[0_12px_40px_rgba(0,0,0,0.6)]'
              : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-xl shadow-slate-900/10'
          }`}>
            
            {/* Top Row: Location Tag & Glow Pagination Indicators */}
            <div className="flex items-center justify-between gap-3">
              {/* Location Tag */}
              <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-xs">
                <MapPin size={12} className="text-emerald-500 shrink-0" />
                <span className={`font-semibold text-[11px] sm:text-xs ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  {currentPhoto.location || 'MPP Simpurusiang Belopa'}
                </span>
              </div>

              {/* Glowing Pagination Dots & Slide Counter */}
              {activePhotosCount > 1 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {displayPhotos.map((p, idx) => (
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
                            ? 'w-6 sm:w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.95)]'
                            : isDark ? 'w-1.5 sm:w-2 bg-white/25 hover:bg-white/50' : 'w-1.5 sm:w-2 bg-slate-300 hover:bg-slate-400'
                        }`}
                        aria-label={`Go to photo ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-mono pl-1 font-bold ${
                    isDark ? 'text-slate-400/90' : 'text-slate-600'
                  }`}>
                    {String(currentIndex + 1).padStart(2, '0')}/{String(activePhotosCount).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Photo Title with Emerald Accent Dot */}
            <h3 className={`text-[13px] sm:text-base md:text-lg font-bold leading-snug font-sans flex items-start gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span className="line-clamp-2 sm:line-clamp-1">{currentPhoto.title}</span>
            </h3>

            {/* Short Refined Caption */}
            {settings.showCaption && currentPhoto.caption && (
              <p className={`text-xs sm:text-sm leading-relaxed font-normal line-clamp-2 ${
                isDark ? 'text-slate-300/95' : 'text-slate-700 font-medium'
              }`}>
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
                  {isEn ? `Photo ${currentIndex + 1} of ${activePhotosCount}` : isZh ? `第 ${currentIndex + 1} 张，共 ${activePhotosCount} 张` : `Foto ${currentIndex + 1} dari ${activePhotosCount}`}
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
                title={isEn ? "Close Full Screen (Esc)" : isZh ? "关闭全屏 (Esc)" : "Tutup Layar Penuh (Esc)"}
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
                    aria-label={isEn ? "Previous Photo" : isZh ? "上一张照片" : "Foto Sebelumnya"}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-6 p-3.5 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white border border-white/20 transition-all shadow-xl cursor-pointer"
                    aria-label={isEn ? "Next Photo" : isZh ? "下一张照片" : "Foto Selanjutnya"}
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
                {displayPhotos.map((p, idx) => (
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
