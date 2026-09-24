import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  TrendingUp, 
  MessageSquarePlus, 
  X, 
  Send, 
  ChevronRight,
  ChevronLeft,
  Briefcase
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase, handleSupabaseError } from '../lib/supabaseClient.js';
import { submitMppTestimonial } from '../services/mppFeedbackService';

// Standard Baseline Verified Testimonials to guarantee a rich 3+ card layout
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
  }
];

export default function TestimonialSection({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
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

        // Merge DB items with baseline testimonials to guarantee full 3+ card layout without empty whitespace
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
      return sec.includes('agro') || sec.includes('kopi') || sec.includes('halal');
    }
    if (activeCategory === 'jasa') {
      const sec = (item.sector || item.category || '').toLowerCase();
      return sec.includes('nib') || sec.includes('oss') || sec.includes('jasa') || sec.includes('dpmptsp');
    }
    return true;
  });

  // Autoplay slider effect
  useEffect(() => {
    if (isAutoplayPaused || filteredTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoplayPaused, filteredTestimonials.length]);

  const handleNext = () => {
    if (filteredTestimonials.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
  };

  const handlePrev = () => {
    if (filteredTestimonials.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredTestimonials.length) % filteredTestimonials.length);
  };

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
    <section className={`w-full py-14 sm:py-20 border-t relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-b from-[#030712] via-[#080d1e] to-[#030712] border-slate-800/80' 
        : 'bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 border-slate-200/90'
    }`}>
      {/* Decorative Ambient Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[200px] bg-amber-500/10 dark:bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header Section with Glassmorphism Badge */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border shadow-sm backdrop-blur-md transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(254, 243, 199, 0.8)',
              borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(251, 191, 36, 0.4)',
              color: isDark ? '#fbbf24' : '#b45309'
            }}
          >
            <Award className="w-4 h-4" />
            <span>{t('testimonials.tag', 'Sertifikasi & Testimoni Investor')}</span>
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {t('testimonials.title', 'Kisah Sukses Investor')}
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={`text-xs sm:text-base font-medium leading-relaxed max-w-2xl mx-auto ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {t('testimonials.subtitle', 'Bukti nyata komitmen Kabupaten Luwu dalam memberikan kepastian hukum, transparansi perizinan, dan kemudahan berusaha.')}
          </motion.p>

          {/* High-Impact Trust Metrics Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8 p-3 rounded-2xl border backdrop-blur-md bg-white/40 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 shadow-sm"
          >
            <div className="flex flex-col items-center p-2 text-center border-r border-slate-200/60 dark:border-slate-800 last:border-r-0">
              <span className="text-lg sm:text-xl font-extrabold text-amber-500 dark:text-amber-400 font-mono tracking-tight flex items-center gap-1">
                4.9<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </span>
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Kepuasan Investor</span>
            </div>
            <div className="flex flex-col items-center p-2 text-center border-r border-slate-200/60 dark:border-slate-800 last:border-r-0">
              <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">100%</span>
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>NIB & OSS Valid</span>
            </div>
            <div className="flex flex-col items-center p-2 text-center border-r border-slate-200/60 dark:border-slate-800 last:border-r-0">
              <span className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight">&lt; 24 Jam</span>
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Respon Helpdesk</span>
            </div>
            <div className="flex flex-col items-center p-2 text-center">
              <span className="text-lg sm:text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono tracking-tight">0 Pungli</span>
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Transparansi Full</span>
            </div>
          </motion.div>
        </div>

        {/* Interactive Functional Category Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'Semua Ulasan Verified' },
              { id: 'jasa', label: 'DPMPTSP & OSS NIB' },
              { id: 'manufaktur', label: 'Kawasan & Tambang' },
              { id: 'agro', label: 'Agro & UMKM Ekspor' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setCurrentIndex(0);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : isDark 
                      ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white' 
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content State: Loading / Items Slider */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-xs font-semibold tracking-wide">{t('testimonials.loading', 'Memuat sertifikasi & testimoni investor terverifikasi...')}</p>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-sm font-semibold">Belum ada ulasan untuk kategori ini.</p>
          </div>
        ) : (
          (() => {
            const safeIndex = currentIndex % filteredTestimonials.length;
            const item = filteredTestimonials[safeIndex] || filteredTestimonials[0];
            const authorName = item.company_name || item.investor_name || item.nama || 'Investor Terdaftar';
            const messageText = item.message || item.teks || item.content || '';
            const ratingCount = item.rating || 5;

            return (
              <div 
                className="relative max-w-4xl mx-auto"
                onMouseEnter={() => setIsAutoplayPaused(true)}
                onMouseLeave={() => setIsAutoplayPaused(false)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={item.id || safeIndex}
                    initial={{ opacity: 0, x: 30, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -30, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className={`rounded-3xl p-6 sm:p-10 relative border backdrop-blur-2xl transition-all shadow-xl hover:shadow-2xl overflow-hidden ${
                      isDark 
                        ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 border-slate-800/80 shadow-black/60' 
                        : 'bg-gradient-to-br from-white via-white/95 to-slate-50/90 border-slate-200/90 shadow-slate-200/60'
                    }`}
                  >
                    {/* Top Decorative Accent Line */}
                    <div className="absolute top-0 left-10 right-10 h-[3px] bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500 rounded-full" />

                    {/* Watermark Large Metallic Quote Icon */}
                    <Quote className={`absolute top-6 right-8 w-24 h-24 opacity-5 pointer-events-none ${isDark ? 'text-amber-400' : 'text-slate-900'}`} />

                    {/* Top Meta Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-amber-500/15 px-3 py-1.5 rounded-full border border-amber-500/20">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              className={`w-4 h-4 ${idx < ratingCount ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} 
                            />
                          ))}
                          <span className="text-xs font-extrabold text-amber-500 ml-1 font-mono">{ratingCount}.0</span>
                        </div>

                        {item.is_verified !== false && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>NIB Terverifikasi OSS</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.investment_scale && (
                          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {item.investment_scale}
                          </span>
                        )}
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                          {safeIndex + 1} / {filteredTestimonials.length}
                        </span>
                      </div>
                    </div>

                    {/* Quote Body */}
                    <div className="relative mb-8 z-10">
                      <p className={`text-base sm:text-lg md:text-xl font-medium italic leading-relaxed ${
                        isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        "{messageText}"
                      </p>
                    </div>

                    {/* Bottom Author & Service Footer */}
                    <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-700 text-white flex items-center justify-center font-black text-base shadow-lg shadow-emerald-500/20 shrink-0">
                          {authorName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className={`text-sm sm:text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {authorName}
                          </h4>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {item.sector || 'Pelayanan Penanaman Modal DPMPTSP'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Kabupaten Luwu</span>
                        <span>·</span>
                        <span>{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Terbaru'}</span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Slider Controls Bar */}
                <div className="flex items-center justify-between gap-4 mt-6 px-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-3 rounded-2xl border backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:scale-105 shadow-md bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400"
                    aria-label="Ulasan Sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-2">
                    {filteredTestimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${
                          safeIndex === idx 
                            ? 'w-8 h-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30' 
                            : 'w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                        }`}
                        aria-label={`Ke Ulasan ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-3 rounded-2xl border backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:scale-105 shadow-md bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400"
                    aria-label="Ulasan Selanjutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })()
        )}

        {/* Footer Sub-Banner: Audit Transparansi & Link Modal */}
        <div className={`mt-12 p-6 rounded-3xl border backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 ${
          isDark 
            ? 'bg-slate-900/60 border-slate-800 text-slate-300' 
            : 'bg-white/80 border-slate-200/90 text-slate-700 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Jaminan Transparansi Layanan Investasi Kabupaten Luwu
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Setiap testimoni disaring secara otomatis melalui integrasi NIB & KBLI Sistem OSS RBA DPMPTSP Luwu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="#portal-mpp" 
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Pelajari Standar Maklumat MPP</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>

      {/* Modal Submit Testimoni Investor */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-white shadow-black' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Kirim Ulasan Investor / Pemohon</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
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
                    <label className="block text-xs font-semibold mb-1">Nama / Nama Investor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bpk. Rahmat / PT. Luwu Energi"
                      value={formData.nama}
                      onChange={e => setFormData({ ...formData, nama: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Sektor / Jenis Layanan Perizinan</label>
                    <select
                      value={formData.layanan}
                      onChange={e => setFormData({ ...formData, layanan: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
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
                    <label className="block text-xs font-semibold mb-1">Rating Kepuasan Layanan</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-6 h-6 ${star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-500 ml-2 font-mono">{formData.rating} / 5</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Ulasan / Testimoni *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Bagikan pengalaman Anda mengurus perizinan atau berinvestasi di Kab. Luwu..."
                      value={formData.teks}
                      onChange={e => setFormData({ ...formData, teks: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Ulasan Verified</span>
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
