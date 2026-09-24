import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  ExternalLink, 
  Ban, 
  ShieldAlert, 
  HandCoins, 
  Award, 
  Radio, 
  PhoneCall, 
  FileText, 
  Lock, 
  Eye, 
  ChevronRight, 
  ChevronLeft,
  Megaphone,
  Pause,
  Play
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AntiCorruptionBannerProps {
  isDark?: boolean;
  className?: string;
  variant?: 'full' | 'compact' | 'footer';
  autoCycleInterval?: number; // ms, default 5500
}

interface CommitmentSlide {
  id: string;
  title: string;
  sub: string;
  badge: string;
  tag: string;
  law: string;
  penalty: string;
  desc: string;
  audience: 'officer' | 'citizen' | 'general';
  gradient: string;
  borderGlow: string;
  shadow: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AntiCorruptionBanner({ 
  isDark = false, 
  className = '', 
  variant = 'full',
  autoCycleInterval = 5500 
}: AntiCorruptionBannerProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isWbsModalOpen, setIsWbsModalOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<CommitmentSlide | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);

  const slides: CommitmentSlide[] = [
    {
      id: 'no-korupsi',
      title: isEn ? 'NO CORRUPTION (Zero Tolerance)' : isZh ? '坚决杜绝贪腐 (零容忍)' : 'NO KORUPSI (Zero Tolerance)',
      sub: isEn ? 'Strict Ethical Commitment for All Officers' : isZh ? '公职人员严格履职廉洁承诺' : 'Komitmen Sumpah Jabatan & Pakta Integritas ASN',
      badge: 'UU TIPIKOR & DISIPLIN ASN',
      tag: 'PENYELENGGARA LAYANAN',
      law: 'UU No. 31/1999 jo. UU No. 20/2001 & UU No. 20/2023 (ASN)',
      penalty: 'Pidana penjara seumur hidup atau 4–20 tahun, denda hingga Rp 1 Miliar, serta Pemberhentian Tidak Dengan Hormat (Pemecatan ASN).',
      desc: 'Seluruh aparatur dan petugas loket MPP Simpurusiang terikat pakta integritas menolak segala bentuk kompromi, suap, dan intervensi ilegal.',
      audience: 'officer',
      gradient: 'from-rose-600 via-rose-700 to-red-800',
      borderGlow: 'border-rose-500/40',
      shadow: 'shadow-rose-600/30',
      icon: ShieldAlert,
    },
    {
      id: 'stop-gratifikasi',
      title: isEn ? 'STOP GRATIFIKASI (Tolak - Catat - Laporkan)' : isZh ? '严禁礼品馈赠与红包 (拒收登记)' : 'STOP GRATIFIKASI (Tolak • Catat • Lapor)',
      sub: isEn ? 'No Gifts, Tips, Meals, or Vouchers' : isZh ? '严禁收取任何形式的礼金红包与消费' : 'Dilarang Memberi & Menerima Uang Tips / Bingkisan',
      badge: 'UPG INSPEKTORAT LUWU',
      tag: 'LOKET PELAYANAN',
      law: 'Pasal 12B UU No. 20/2001 & Perbup Pengendalian Gratifikasi Luwu',
      penalty: 'Pemberian hadiah dalam bentuk apa pun wajib ditolak. Jika tidak dapat ditolak, wajib dilaporkan ke UPG dalam 30 hari kerja.',
      desc: 'Bahkan secangkir kopi atau rokok dari pemohon merupakan pelanggaran kode etik pelayanan. Pelayanan prima adalah kewajiban aparatur.',
      audience: 'officer',
      gradient: 'from-amber-500 via-orange-600 to-amber-700',
      borderGlow: 'border-amber-500/40',
      shadow: 'shadow-amber-600/30',
      icon: HandCoins,
    },
    {
      id: 'stop-pungli',
      title: isEn ? 'BEBAS PUNGLI: Tarif Resmi Rp 0,-' : isZh ? '严禁违规收费: 法定规费公开透明' : 'BEBAS PUNGLI: Tarif Resmi Rp 0,-',
      sub: isEn ? 'All Licensing is 100% Free (Official Bank Only)' : isZh ? '政务与审批一律免费 (法定规费银行专户)' : 'Semua Layanan Izin & Adminduk Tanpa Biaya Tambahan',
      badge: 'SATGAS SABER PUNGLI',
      tag: 'HAK PEMOHON & INVESTOR',
      law: 'Perpres No. 87/2016 tentang Satgas Sapu Bersih Pungutan Liar',
      penalty: 'Operasi Tangkap Tangan (OTT) dan jeratan pidana pemerasan dalam jabatan (Pasal 368 & 423 KUHP).',
      desc: 'Tidak ada transaksi tunai di meja loket. Seluruh retribusi resmi disetor langsung via Bank BPD Sulselbar dengan bukti bayar kas daerah sah.',
      audience: 'citizen',
      gradient: 'from-rose-600 via-red-600 to-rose-900',
      borderGlow: 'border-rose-500/40',
      shadow: 'shadow-rose-700/30',
      icon: Ban,
    },
    {
      id: 'cctv-audit',
      title: isEn ? 'PENGAWASAN AKTIF: CCTV 24/7 & Mystery Shopper' : isZh ? '动态监督: 24/7高清音视频监控与暗访' : 'PENGAWASAN AKTIF: CCTV 24/7 & Mystery Shopper',
      sub: isEn ? 'Continuous Compliance Audit & Direct Surveillance' : isZh ? '全天候合规抽查与服务质量实时监管' : 'Seluruh Interaksi Loket Diawasi Tim Kepatuhan',
      badge: 'MONITORING INSPEKTORAT',
      tag: 'PENGAWASAN SISTEM',
      law: 'PermenPAN-RB No. 90/2021 tentang Pembangunan Zona Integritas',
      penalty: 'Pemeriksaan berkala hasil rekaman kamera & audio loket oleh Tim Investigasi Khusus Pemkab Luwu.',
      desc: 'Setiap gerai dan loket terhubung ke pusat monitoring audio-visual untuk memastikan standar pelayanan prima tanpa penyimpangan.',
      audience: 'general',
      gradient: 'from-sky-600 via-blue-700 to-indigo-800',
      borderGlow: 'border-sky-500/40',
      shadow: 'shadow-sky-600/30',
      icon: Eye,
    },
    {
      id: 'wbs-lapor',
      title: isEn ? 'WBS & SP4N-LAPOR!: Perlindungan Saksi 100%' : isZh ? '保密举报专线: 依法保障举报人安全' : 'WBS & SP4N-LAPOR!: Perlindungan Saksi 100%',
      sub: isEn ? 'Encrypted Whistleblowing & Fast-Track Investigation' : isZh ? '端到端加密举报 • 快速启动专案核查' : 'Laporkan Pungli / Calo Secara Rahasia & Terenkripsi',
      badge: 'PERLINDUNGAN SAKSI LPSK',
      tag: 'SALURAN PENGADUAN RAHASIA',
      law: 'UU No. 13/2006 jo. UU No. 31/2014 (LPSK) & PermenPAN-RB No. 90/2021',
      penalty: 'Laporan dugaan pungli/gratifikasi langsung ditindaklanjuti dengan kerahasiaan identitas pelapor yang dijamin penuh undang-undang.',
      desc: 'Masyarakat dan aparatur dapat melaporkan pelanggaran secara anonim tanpa rasa takut terhadap intimidasi atau diskriminasi pelayanan.',
      audience: 'citizen',
      gradient: 'from-emerald-600 via-teal-700 to-emerald-900',
      borderGlow: 'border-emerald-500/40',
      shadow: 'shadow-emerald-700/30',
      icon: Award,
    },
  ];

  const totalSlides = slides.length;

  const scrollToSlide = useCallback((index: number) => {
    if (scrollContainerRef.current) {
      isProgrammaticScrollRef.current = true;
      const container = scrollContainerRef.current;
      const targetChild = container.children[index] as HTMLElement;
      if (targetChild) {
        targetChild.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    }
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = (prev + 1) % totalSlides;
      scrollToSlide(next);
      return next;
    });
  }, [totalSlides, scrollToSlide]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = (prev - 1 + totalSlides) % totalSlides;
      scrollToSlide(next);
      return next;
    });
  }, [totalSlides, scrollToSlide]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    scrollToSlide(index);
  };

  // Synchronize manual swipe on Android scroll container
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex >= 0 && newIndex < totalSlides && newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  // Auto-cycling timer effect with pause-on-hover/touch
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, autoCycleInterval);
    return () => clearInterval(interval);
  }, [isPaused, autoCycleInterval, nextSlide]);

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <>
      <div 
        className={`wbk-wbbm-container w-full relative rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden ${
          isDark 
            ? 'bg-slate-900/95 border-rose-500/30 shadow-2xl shadow-rose-950/25' 
            : 'bg-white border-rose-200/90 shadow-xl shadow-rose-500/5'
        } ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Animated Cycle Progress Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-slate-200 dark:bg-slate-800 overflow-hidden z-20">
          <motion.div 
            key={currentIndex + (isPaused ? '-paused' : '-running')}
            initial={{ width: '0%' }}
            animate={{ width: isPaused ? '100%' : '100%' }}
            transition={{ 
              duration: isPaused ? 0 : autoCycleInterval / 1000, 
              ease: 'linear' 
            }}
            className={`h-full bg-gradient-to-r ${currentSlide.gradient}`}
          />
        </div>

        {/* Compact Header Bar Optimized for Android Viewport */}
        <div className={`px-3 sm:px-5 py-2.5 sm:py-3 border-b flex items-center justify-between gap-2 relative z-10 ${
          isDark ? 'bg-rose-950/30 border-rose-500/20' : 'bg-rose-50/80 border-rose-100'
        }`}>
          {/* Live Radar Pill */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
            </span>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[10px] sm:text-xs font-black tracking-wider text-rose-600 dark:text-rose-400 font-sans uppercase truncate">
                {isEn ? 'INTEGRITY ZONE (WBK/WBBM)' : 'ZONA INTEGRITAS WBK / WBBM'}
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 shrink-0">
                <Radio className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
                MONITORING
              </span>
            </div>
          </div>

          {/* Controls & Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Auto-cycle pause/play toggle */}
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 min-w-[28px] min-h-[28px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-[10px]"
              title={isPaused ? "Lanjutkan Putaran Otomatis" : "Jeda Putaran"}
              aria-label="Toggle Auto Cycle"
            >
              {isPaused ? <Play size={12} className="text-emerald-500" /> : <Pause size={12} />}
            </button>

            {/* Pakta Maklumat modal trigger */}
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(true)}
              className="min-h-[28px] px-2 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer rounded-lg bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 active:scale-95"
            >
              <FileText className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="hidden sm:inline">{isEn ? 'Charter' : 'Maklumat'}</span>
            </button>

            {/* Lapor WBS Modal trigger */}
            <button
              type="button"
              onClick={() => setIsWbsModalOpen(true)}
              className="min-h-[28px] px-2.5 text-[10px] sm:text-[11px] font-extrabold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 flex items-center gap-1 transition-all cursor-pointer rounded-lg shadow-xs active:scale-95 shrink-0"
            >
              <Megaphone className="w-3 h-3 shrink-0" />
              <span>{isEn ? 'WBS' : 'Lapor WBS'}</span>
            </button>
          </div>
        </div>

        {/* ── RESPONSIVE HORIZONTAL SLIDER BODY (ANDROID OPTIMIZED WITH FLEXBOX & SNAP-X) ── */}
        <div className="p-3 sm:p-4 relative">
          {/* Flexbox Snap Track - Smooth Android Touch Navigation with No Truncation */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex flex-row overflow-x-auto snap-x snap-mandatory scroll-smooth w-full no-scrollbar touch-pan-x gap-3 pb-1"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none', 
              WebkitOverflowScrolling: 'touch' 
            }}
          >
            {slides.map((slide) => {
              const IconComp = slide.icon;
              return (
                <div
                  key={slide.id}
                  onClick={() => setSelectedPillar(slide)}
                  className={`snap-center snap-always shrink-0 w-full min-w-full p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative group overflow-hidden ${
                    isDark 
                      ? 'bg-slate-800/80 border-slate-700/80 hover:border-rose-500/50 hover:bg-slate-800' 
                      : 'bg-slate-50/95 border-slate-200/90 hover:border-rose-400 hover:bg-white'
                  } shadow-xs flex flex-col justify-between`}
                >
                  {/* Left accent color bar */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b ${slide.gradient}`} />

                  <div className="pl-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                    <div className="flex items-start gap-3 w-full min-w-0">
                      {/* Icon Shield Pill */}
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${slide.gradient} text-white flex items-center justify-center shadow-md ${slide.shadow} border border-white/20 shrink-0 group-hover:scale-105 transition-transform`}>
                        <IconComp className="w-6 h-6" />
                      </div>

                      {/* Content Column with Flexbox to avoid any text cutoff */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            {slide.badge}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                            {slide.tag}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight font-sans leading-snug break-words">
                          {slide.title}
                        </h4>

                        <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-normal leading-relaxed break-words">
                          {slide.desc}
                        </p>
                      </div>
                    </div>

                    {/* Legal Penalty Box on Desktop / Tap Badge on Mobile */}
                    <div className="w-full sm:w-auto shrink-0 flex items-center justify-between sm:flex-col sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/10">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[200px] sm:max-w-none">
                        {slide.law.split('&')[0]}
                      </span>
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 group-hover:text-rose-500 shrink-0">
                        <span>Rincian Sanksi</span>
                        <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slider Pagination Controls & Progress Dots */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
            {/* Prev/Next Touch Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevSlide}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 dark:border-white/10"
                title="Slide Sebelumnya"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 dark:border-white/10"
                title="Slide Berikutnya"
                aria-label="Next Slide"
              >
                <ChevronRight size={14} />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 ml-1">
                {currentIndex + 1}/{totalSlides}
              </span>
            </div>

            {/* Interactive Carousel Pill Indicators */}
            <div className="flex items-center gap-1.5">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx 
                      ? 'w-6 bg-rose-600 dark:bg-rose-500 shadow-xs' 
                      : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                  title={s.title}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Quick Hotline direct link */}
            <a
              href="https://wa.me/6281142011?text=Halo%20Satgas%20Saber%20Pungli%20Inspektorat%20Luwu,%20saya%20ingin%20melaporkan%20indikasi%20pelanggaran%20layanan%20di%20MPP"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <PhoneCall size={11} />
              <span>Saber Pungli WA</span>
            </a>
          </div>
        </div>

        {/* Ultra-Slim Live Assurance Marquee Ribbon */}
        <div className="bg-rose-600 text-white py-1 px-2.5 overflow-hidden text-[9px] sm:text-[10px] font-mono font-bold tracking-wider flex items-center justify-between border-t border-rose-500">
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-rose-400 font-sans font-extrabold uppercase">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            <span>PERINGATAN</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap w-full pl-2">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="inline-block"
            >
              PELAYANAN DI MPP SIMPURUSIANG RP 0,- (GRATIS) KECUALI RETRIBUSI RESMI BANK BPD SULSELBAR • PETUGAS DILARANG MENERIMA UANG, HADIAH, ATAU GRATIFIKASI (PASAL 12B UU TIPIKOR) • LAPORKAN INDIKASI PUNGLI KE HOTLINE SATGAS SABER PUNGLI 0811-420-11 •&nbsp;
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal Detail Instrumen & Sanksi Hukum (Ketika Slide Diklik) */}
      <AnimatePresence>
        {selectedPillar && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md"
            onClick={() => setSelectedPillar(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-3xl border shadow-2xl p-5 sm:p-7 relative ${
                isDark ? 'bg-slate-900 border-rose-500/40 text-white' : 'bg-white border-rose-200 text-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedPillar(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedPillar.gradient} text-white flex items-center justify-center shadow-md ${selectedPillar.shadow} shrink-0`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    {selectedPillar.badge}
                  </span>
                  <h3 className="text-base sm:text-lg font-black font-sans leading-tight">
                    {selectedPillar.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-bold">
                    📜 Landasan Hukum & Regulasi:
                  </strong>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {selectedPillar.law}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <strong className="block text-rose-700 dark:text-rose-400 mb-1 font-bold">
                    ⚠️ Sanksi Tegas & Konsekuensi Hukum:
                  </strong>
                  <p className="leading-relaxed">
                    {selectedPillar.penalty}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-bold">
                    🛡️ Penerapan di MPP Simpurusiang:
                  </strong>
                  <p className="leading-relaxed">
                    {selectedPillar.desc}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Inspektorat Kabupaten Luwu
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPillar(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Maklumat Integritas & Pakta Pelayanan */}
      <AnimatePresence>
        {isDetailModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
            onClick={() => setIsDetailModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl rounded-3xl border shadow-2xl p-5 sm:p-7 relative ${
                isDark ? 'bg-slate-900 border-rose-500/40 text-white' : 'bg-white border-rose-200 text-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 block font-mono">
                    PEMERINTAH KABUPATEN LUWU • DPMPTSP
                  </span>
                  <h3 className="text-base sm:text-xl font-black font-sans">
                    Maklumat Pelayanan & Pakta Integritas Bersama
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <strong className="text-rose-700 dark:text-rose-300 block mb-1 font-bold">
                    🛑 Maklumat Pelayanan Publik (Keputusan Bupati Luwu):
                  </strong>
                  <p className="italic text-xs leading-relaxed">
                    "Dengan ini, kami pimpinan dan seluruh aparatur penyelenggara pelayanan publik di Mal Pelayanan Publik (MPP) Simpurusiang menyatakan sanggup menyelenggarakan pelayanan sesuai standar pelayanan yang telah ditetapkan, memberikan pelayanan dengan penuh integritas tanpa korupsi, kolusi, nepotisme, serta siap menerima sanksi sesuai ketentuan perundang-undangan apabila tidak menepati janji ini."
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block mb-1 text-xs">Kanal Pengaduan Resmi:</strong>
                    <p className="text-[11px]">Laporkan setiap indikasi pungli atau gratifikasi melalui SP4N-LAPOR! atau Call Center Inspektorat Kab. Luwu.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block mb-1 text-xs">Perlindungan Pelapor:</strong>
                    <p className="text-[11px]">Kerahasiaan identitas pelapor (Whistleblower) dijamin penuh oleh Undang-Undang Perlindungan Saksi dan Korban (LPSK).</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block mb-1 text-xs">Sanksi Pelanggaran Disiplin ASN:</strong>
                  <p className="text-[11px]">Setiap aparat yang terbukti melakukan pungli akan langsung dinonaktifkan dari loket pelayanan publik dan diproses sanksi berat sesuai PP No. 94/2021.</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  SK Penetapan WBK No. 188.45/DPMPTSP/2024
                </span>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Tutup Maklumat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Whistleblowing System (WBS) Cepat */}
      <AnimatePresence>
        {isWbsModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
            onClick={() => setIsWbsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-3xl border shadow-2xl p-5 sm:p-7 relative ${
                isDark ? 'bg-slate-900 border-rose-500/40 text-white' : 'bg-white border-rose-200 text-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsWbsModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    WHISTLEBLOWING SYSTEM (WBS)
                  </span>
                  <h3 className="text-base sm:text-lg font-black font-sans leading-tight">
                    Lapor Pungli / Gratifikasi Anonim
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <strong className="text-rose-700 dark:text-rose-300 block mb-1">
                    🛡️ Perlindungan Identitas Pelapor:
                  </strong>
                  <p className="text-[11px] leading-relaxed">
                    Informasi laporan diteruskan secara aman dan terenkripsi langsung ke Tim Khusus Inspektorat Kabupaten Luwu.
                  </p>
                </div>

                <div className="space-y-2">
                  <a
                    href="https://wa.me/6281142011?text=Halo%20Inspektorat%20Luwu,%20saya%20ingin%20melaporkan%20indikasi%20pungli/gratifikasi%20pada%20loket%20MPP:%20[Nama%20Instansi/Loket]%20pada%20tanggal%20[Tanggal]"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-between font-bold transition-all shadow-md shadow-emerald-700/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-4 h-4" />
                      <div className="text-left">
                        <span className="block text-xs">WhatsApp Satgas Saber Pungli Luwu</span>
                        <span className="text-[10px] opacity-90 font-mono font-normal">Respon Cepat Inspektorat Daerah</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </a>

                  <a
                    href="https://www.lapor.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-between font-bold transition-all border border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-rose-400" />
                      <div className="text-left">
                        <span className="block text-xs">Portal SP4N-LAPOR! Nasional</span>
                        <span className="text-[10px] opacity-75 font-mono font-normal">Sistem Pengaduan Pelayanan Publik Nasional</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsWbsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Kembali
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
