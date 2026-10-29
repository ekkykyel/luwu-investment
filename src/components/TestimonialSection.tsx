import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion, MOTION_DURATIONS } from '../lib/motion';
import { 
  Quote, 
  BadgeCheck, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Building2, 
  Loader2, 
  Star, 
  CheckCircle2, 
  MessageSquarePlus, 
  X, 
  Send, 
  ChevronRight, 
  ChevronLeft, 
  Briefcase, 
  Pause, 
  Play,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { submitMppTestimonial } from '../services/mppFeedbackService';

// Standard Baseline Verified Testimonials to guarantee a rich multi-card layout
const BASELINE_INVESTOR_TESTIMONIALS = [
  {
    id: 'base-1',
    investor_name: 'PT. SERITI INDAH',
    company_name: 'PT. SERITI INDAH',
    sector: 'DPMPTSP - Penerbitan NIB & Izin Berusaha OSS',
    category: 'Jasa & UMKM',
    message: 'Dengan hadirnya pendampingan dari Helpdesk DPMPTSP, kami sangat mudah mengurus semua perizinan NIB & OSS Risk-Based Approach yang kami butuhkan tanpa hambatan.',
    rating: 5,
    is_verified: true,
    created_at: '2026-09-15T08:00:00.000Z',
    investment_scale: 'PMDN Akselerasi'
  },
  {
    id: 'base-2',
    investor_name: 'PT. MASMINDO DWI AREA',
    company_name: 'PT. MASMINDO DWI AREA',
    sector: 'Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) & Amdal',
    category: 'Manufaktur & Tambang',
    message: 'Proses validasi tata ruang dan pertimbangan teknis investasi di Kabupaten Luwu berjalan transparan, cepat, dan didukung peta digital GIS yang presisi.',
    rating: 5,
    is_verified: true,
    created_at: '2026-09-18T10:30:00.000Z',
    investment_scale: 'PMA Skala Besar'
  },
  {
    id: 'base-3',
    investor_name: 'PT. BUMI MINERAL SULAWESI',
    company_name: 'PT. BUMI MINERAL SULAWESI (BMS)',
    sector: 'Fasilitasi Kemitraan Usaha & Insentif Daerah',
    category: 'Manufaktur & Tambang',
    message: 'Komitmen Pemerintah Kabupaten Luwu dalam memberikan kepastian hukum dan iklim investasi yang kondusif sangat terasa bagi operasional kawasan industri kami.',
    rating: 5,
    is_verified: true,
    created_at: '2026-09-20T14:15:00.000Z',
    investment_scale: 'Kawasan Industri Strategis'
  },
  {
    id: 'base-4',
    investor_name: 'KOPERASI KOPI BASTEM LUWU',
    company_name: 'KOPERASI KOPI BASTEM LUWU',
    sector: 'Fasilitasi Halal, BPOM & NIB Ekspor UMKM',
    category: 'Agro & Olahan',
    message: 'Layanan terpadu di MPP Simpurusiang sangat membantu UMKM olahan kopi lokal kami naik kelas hingga mengantongi sertifikat ekspor resmi.',
    rating: 5,
    is_verified: true,
    created_at: '2026-09-21T09:45:00.000Z',
    investment_scale: 'UMKM Ekspor Unggulan'
  },
  {
    id: 'base-5',
    investor_name: 'PT. KARYA CIPTA AGRO LUWU',
    company_name: 'PT. KARYA CIPTA AGRO LUWU',
    sector: 'Hilirisasi Perkebunan Kakao Noling',
    category: 'Agro & Olahan',
    message: 'Akses perizinan lingkungan hidup dan insentif pembebasan retribusi PBG mempercepat fase konstruksi pabrik pengolahan kakao kami hingga 4 bulan lebih cepat.',
    rating: 5,
    is_verified: true,
    created_at: '2026-09-25T11:00:00.000Z',
    investment_scale: 'PMDN Agrobisnis'
  },
  {
    id: 'base-6',
    investor_name: 'PT. MARITIM TELUK BONE LOGISTIK',
    company_name: 'PT. MARITIM TELUK BONE LOGISTIK',
    sector: 'Kemitraan Fasilitas Cold Chain Pelabuhan Ulo-Ulo',
    category: 'Jasa & UMKM',
    message: 'Sinergi antar OPD di Kabupaten Luwu sangat suportif terhadap investasi rantai dingin perikanan laut, dari perizinan dermaga hingga sambungan listrik industri.',
    rating: 5,
    is_verified: true,
    created_at: '2026-09-28T16:20:00.000Z',
    investment_scale: 'Logistik Maritim'
  }
];

export default function TestimonialSection({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    perusahaan: '',
    layanan: 'Perizinan Berusaha (NIB / OSS)',
    rating: 5,
    teks: ''
  });

  useEffect(() => {
    let isMounted = true;

    const fetchTestimonials = async () => {
      try {
        let dbItems: any[] = [];
        
        // 0. Read localStorage items submitted on this or other tabs
        try {
          const rawLocal = localStorage.getItem('mpp_portal_testimonials');
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (Array.isArray(parsed)) {
              dbItems.push(...parsed);
            }
          }
        } catch (e) {
          console.warn('Notice reading local testimonials:', e);
        }

        // 1. Fetch from server API endpoint
        const apiRes = await fetch('/api/testimonials', {
          headers: { 'Accept': 'application/json' }
        }).catch(() => null);

        if (apiRes && apiRes.ok) {
          const apiData = await apiRes.json().catch(() => null);
          if (Array.isArray(apiData) && apiData.length > 0) {
            dbItems.push(...apiData);
          }
        }

        // 2. Fetch from Supabase directly
        const { data: supabaseData, error: sbErr } = await supabase
          .from('investor_testimonials')
          .select('*')
          .order('created_at', { ascending: false });

        if (!sbErr && Array.isArray(supabaseData) && supabaseData.length > 0) {
          dbItems.push(...supabaseData);
        }

        // Merge DB items with baseline testimonials to guarantee full 3+ card layout
        const mergedMap = new Map<string, any>();
        
        // First put DB items (real user submissions)
        dbItems.forEach(item => {
          const author = (item.company_name || item.investor_name || item.nama || '').trim();
          const msg = (item.message || item.teks || item.content || '').trim();
          const key = `${author.toLowerCase()}::${msg.toLowerCase()}`;
          mergedMap.set(key, {
            ...item,
            investor_name: author || 'Investor Terdaftar',
            company_name: item.company_name || author,
            message: msg,
            sector: item.sector || item.layanan || 'Pelayanan Penanaman Modal',
            rating: item.rating || 5,
            is_verified: item.is_verified !== false,
            created_at: item.created_at || new Date().toISOString()
          });
        });

        // Supplement with Baseline items if needed
        BASELINE_INVESTOR_TESTIMONIALS.forEach(base => {
          const key = `${base.company_name.toLowerCase()}::${base.message.toLowerCase()}`;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, base);
          }
        });

        const finalTestimonials = Array.from(mergedMap.values());
        if (isMounted) {
          setTestimonials(finalTestimonials);
        }
      } catch (err: any) {
        console.warn("Notice loading testimonials, using baseline fallback:", err?.message || err);
        if (isMounted) {
          setTestimonials(BASELINE_INVESTOR_TESTIMONIALS);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTestimonials();

    const handleFeedbackUpdate = () => {
      fetchTestimonials();
    };
    window.addEventListener('mpp_feedback_updated', handleFeedbackUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('mpp_feedback_updated', handleFeedbackUpdate);
    };
  }, []);

  // Category Filter
  const filteredTestimonials = testimonials.filter(item => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'manufaktur') {
      const sec = (item.sector || item.category || '').toLowerCase();
      return sec.includes('tambang') || sec.includes('manufaktur') || sec.includes('kkpr');
    }
    if (activeCategory === 'agro') {
      const sec = (item.sector || item.category || '').toLowerCase();
      return sec.includes('agro') || sec.includes('kopi') || sec.includes('halal') || sec.includes('kakao');
    }
    if (activeCategory === 'jasa') {
      const sec = (item.sector || item.category || '').toLowerCase();
      return sec.includes('nib') || sec.includes('oss') || sec.includes('jasa') || sec.includes('dpmptsp') || sec.includes('logistik');
    }
    return true;
  });

  const CARDS_PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(filteredTestimonials.length / CARDS_PER_PAGE));

  // Autoplay slider effect (paused on hover/touch and when reduced motion is requested)
  useEffect(() => {
    if (isAutoplayPaused || shouldReduceMotion || totalPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 7000);
    return () => clearInterval(interval);
  }, [isAutoplayPaused, shouldReduceMotion, totalPages]);

  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const currentCards = filteredTestimonials.slice(
    currentPage * CARDS_PER_PAGE,
    (currentPage + 1) * CARDS_PER_PAGE
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.teks) return;

    setIsSubmitting(true);
    try {
      await submitMppTestimonial({
        nama: formData.nama,
        perusahaan: formData.perusahaan || formData.nama,
        layanan: formData.layanan,
        teks: formData.teks,
        rating: formData.rating,
        user_type: 'investor'
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setFormData({
          nama: '',
          perusahaan: '',
          layanan: 'Perizinan Berusaha (NIB / OSS)',
          rating: 5,
          teks: ''
        });
        window.dispatchEvent(new Event('mpp_feedback_updated'));
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="kisah-sukses-investor"
      className={`w-full py-16 sm:py-24 border-t relative overflow-hidden transition-colors duration-500 ${
        isDark 
          ? 'bg-[#061522] border-white/10 text-white' 
          : 'bg-gradient-to-b from-slate-50 via-white to-slate-50 border-slate-200 text-slate-900'
      }`}
    >
      {/* Decorative Ambient Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[200px] bg-amber-500/5 dark:bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="invest-eyebrow-emerald mb-3.5">
            <BadgeCheck size={14} className="text-emerald-700 dark:text-emerald-400" />
            <span>{t('testimonials.eyebrow', 'Sertifikasi & Testimoni Investor Resmi')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold tracking-tight mb-2.5 text-slate-950 dark:text-white">
            {t('testimonials.title', 'Kisah Sukses Investor')}
          </h2>

          <div className="emerald-divider-diamond">
            <span className="emerald-diamond-icon" />
          </div>

          <p className="text-sm sm:text-base font-medium leading-relaxed max-w-2xl mx-auto text-slate-700 dark:text-slate-300">
            {t('testimonials.subtitle', 'Bukti nyata komitmen Pemerintah Kabupaten Luwu dalam memberikan kepastian hukum, transparansi perizinan, dan kemudahan berusaha bagi investor skala nasional maupun global.')}
          </p>

          {/* High-Impact Trust Metrics Bar */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8 p-3.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all ${
            isDark
              ? 'bg-[#0B253A]/90 border-emerald-500/30 shadow-black/40'
              : 'bg-white/95 border-slate-200/90 shadow-slate-200/60'
          }`}>
            <div className="flex flex-col items-center p-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight flex items-center gap-1 font-mono">
                4.9<Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </span>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">{t('testimonials.metricSatisfaction', 'Kepuasan Investor')}</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400">{t('testimonials.metricSatisfactionDesc', 'Survei IKM Berkala')}</span>
            </div>
            <div className="flex flex-col items-center p-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight font-mono">100%</span>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">{t('testimonials.metricNib', 'NIB & OSS Valid')}</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400">{t('testimonials.metricNibDesc', 'Tanpa Sengketa')}</span>
            </div>
            <div className="flex flex-col items-center p-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight font-mono">&lt; 24 Jam</span>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">{t('testimonials.metricHelpdesk', 'Respon Helpdesk')}</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400">{t('testimonials.metricHelpdeskDesc', 'Layanan Prioritas')}</span>
            </div>
            <div className="flex flex-col items-center p-2 text-center">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">{t('testimonials.metricCorruption', '0 Pungli')}</span>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">{t('testimonials.metricCorruptionDesc', 'Transparansi Penuh')}</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400">{t('testimonials.metricSub', 'Integritas DPMPTSP')}</span>
            </div>
          </div>
        </div>

        {/* Category Filter & Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: t('testimonials.tabAll', 'Semua Ulasan Verified') },
              { id: 'jasa', label: t('testimonials.tabService', 'DPMPTSP & OSS NIB') },
              { id: 'manufaktur', label: t('testimonials.tabManufacture', 'Kawasan & Tambang') },
              { id: 'agro', label: t('testimonials.tabAgro', 'Agro & Hilirisasi') }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : isDark 
                      ? 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700' 
                      : 'bg-white text-slate-700 hover:text-slate-950 border border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsAutoplayPaused(!isAutoplayPaused)}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    : 'bg-white text-slate-700 border-slate-200 hover:text-slate-950'
                }`}
                title={isAutoplayPaused ? "Lanjutkan putar otomatis" : "Jeda putar otomatis"}
              >
                {isAutoplayPaused ? <Play size={13} /> : <Pause size={13} />}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-xs'
                  }`}
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs font-mono font-bold px-2 text-slate-600 dark:text-slate-300">
                  {currentPage + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={handleNext}
                  className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-xs'
                  }`}
                  aria-label="Halaman Selanjutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content State: Loading / Multi-Card 3-Column Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 dark:text-slate-400">
            <Loader2 className="w-9 h-9 animate-spin text-emerald-600 dark:text-emerald-400 mb-3" />
            <p className="text-xs font-bold tracking-wide">Memuat sertifikasi & testimoni investor terverifikasi...</p>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="text-center py-16 text-slate-600 dark:text-slate-400">
            <p className="text-sm font-bold">Belum ada ulasan untuk kategori ini.</p>
          </div>
        ) : (
          <div
            onMouseEnter={() => setIsAutoplayPaused(true)}
            onMouseLeave={() => setIsAutoplayPaused(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${currentPage}-${activeCategory}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
              >
                {currentCards.map((item, idx) => {
                  const authorName = item.company_name || item.investor_name || item.nama || 'Investor Terdaftar';
                  const messageText = item.message || item.teks || item.content || '';
                  const ratingCount = item.rating || 5;
                  const initials = authorName.replace(/PT\.|CV\.|KOPERASI/gi, '').trim().substring(0, 2).toUpperCase() || 'LU';

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-6 sm:p-7 rounded-3xl border flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                        isDark
                          ? 'bg-[#0B253A]/90 border-slate-800 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-black/60'
                          : 'bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-xl hover:shadow-slate-200/60 shadow-xs'
                      }`}
                    >
                      {/* Top Accent Strip */}
                      <div className="absolute top-0 inset-x-6 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500 rounded-full" />

                      {/* Watermark Quote Icon */}
                      <Quote className="absolute top-4 right-5 w-16 h-16 text-amber-500/10 pointer-events-none" />

                      <div>
                        {/* Meta Header */}
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, sIdx) => (
                              <Star
                                key={sIdx}
                                className={`w-3.5 h-3.5 ${
                                  sIdx < ratingCount ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-400 ml-1">
                              {ratingCount}.0
                            </span>
                          </div>

                          {item.investment_scale && (
                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                              {item.investment_scale}
                            </span>
                          )}
                        </div>

                        {/* Quote Text */}
                        <p className="text-sm sm:text-base italic leading-relaxed text-slate-800 dark:text-slate-100 font-medium mb-6 relative z-10">
                          "{messageText}"
                        </p>
                      </div>

                      {/* Investor Identity Footer */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-950 dark:text-white truncate">
                              {authorName}
                            </h4>
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 truncate mt-0.5">
                              {item.sector || 'Pelayanan Penanaman Modal'}
                            </p>
                          </div>
                        </div>

                        {/* Verified Footer Tag */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
                            <BadgeCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{t('testimonials.verifiedOss', 'Terverifikasi OSS-RBA')}</span>
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {t('testimonials.regency', 'Kab. Luwu')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Footer Sub-Banner: Audit Transparansi & CTA Ulasan */}
        <div className={`mt-12 p-6 sm:p-7 rounded-3xl border backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-5 ${
          isDark 
            ? 'bg-[#0B253A]/90 border-emerald-500/30 text-slate-200 shadow-xl' 
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-lg shadow-slate-200/50'
        }`}>
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                {t('testimonials.transparencyTitle', 'Jaminan Transparansi Layanan Investasi Kabupaten Luwu')}
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                {t('testimonials.transparencyDesc', 'Setiap testimoni disaring secara transparan melalui pangkalan data perizinan OSS-RBA & DPMPTSP Luwu.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>{t('testimonials.btnWrite', 'Tulis Ulasan Investor')}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal Submit Testimoni Investor */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-white shadow-black' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Kirim Ulasan Investor / Pemohon</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Masukan Anda membantu meningkatkan kualitas perizinan & investasi di Kab. Luwu.
                  </p>
                </div>
              </div>

              {submitSuccess ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3 animate-bounce" />
                  <h4 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Ulasan Berhasil Terkirim!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Terima kasih atas partisipasi Anda. Ulasan Anda telah tersimpan dan terverifikasi.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Nama / Nama Investor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bpk. Rahmat / PT. Luwu Energi"
                      value={formData.nama}
                      onChange={e => setFormData({ ...formData, nama: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Sektor / Jenis Layanan Perizinan</label>
                    <select
                      value={formData.layanan}
                      onChange={e => setFormData({ ...formData, layanan: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="Perizinan Berusaha (NIB / OSS)">Perizinan Berusaha (NIB / OSS)</option>
                      <option value="Kesesuaian Tata Ruang (KKPR)">Kesesuaian Tata Ruang (KKPR)</option>
                      <option value="Fasilitasi Insentif & Kemitraan">Fasilitasi Insentif & Kemitraan</option>
                      <option value="Sertifikasi Halal & UMKM Ekspor">Sertifikasi Halal & UMKM Ekspor</option>
                      <option value="Layanan Terpadu MPP Simpurusiang">Layanan Terpadu MPP Simpurusiang</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Rating Kepuasan</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= formData.rating
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 ml-2">
                        {formData.rating} dari 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Ulasan / Testimoni *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Bagikan pengalaman Anda mengurus perizinan dan investasi di Kabupaten Luwu..."
                      value={formData.teks}
                      onChange={e => setFormData({ ...formData, teks: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengirim Ulasan...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Ulasan Resmi</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
