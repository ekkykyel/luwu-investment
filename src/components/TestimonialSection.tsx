import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Quote, BadgeCheck, ShieldCheck, Award, Sparkles, Building2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase, handleSupabaseError } from '../lib/supabaseClient.js';

export default function TestimonialSection({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Helper to deduplicate testimonials by company/author + message
    const deduplicateTestimonials = (list: any[]) => {
      const seen = new Set<string>();
      const result: any[] = [];
      for (const item of list) {
        const author = (item.company_name || item.investor_name || item.nama || '').trim().toLowerCase();
        const msg = (item.message || item.teks || item.content || '').trim().toLowerCase();
        const key = `${author}::${msg}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(item);
        }
      }
      return result;
    };

    const fetchTestimonials = async () => {
      try {
        const apiRes = await fetch('/api/testimonials', {
          headers: { 'Accept': 'application/json' }
        }).catch(() => null);

        if (apiRes && apiRes.ok) {
          const apiData = await apiRes.json().catch(() => null);
          if (Array.isArray(apiData) && apiData.length > 0) {
            if (isMounted) {
              setTestimonials(deduplicateTestimonials(apiData));
              setIsLoading(false);
            }
            return;
          }
        }

        const { data, error } = await supabase
          .from('investor_testimonials')
          .select('*')
          .eq('is_verified', true)
          .order('created_at', { ascending: false });

        if (error) {
          await handleSupabaseError(error);
          if (isMounted) setTestimonials([]);
        } else if (isMounted) {
          setTestimonials(Array.isArray(data) ? deduplicateTestimonials(data) : []);
        }
      } catch (err: any) {
        console.warn("Notice loading testimonials, using safe empty array fallback:", err?.message || err);
        if (isMounted) {
          setTestimonials([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTestimonials();

    // Listen to real-time feedback submissions across tabs/components
    const handleFeedbackUpdate = () => {
      fetchTestimonials();
    };
    window.addEventListener('mpp_feedback_updated', handleFeedbackUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('mpp_feedback_updated', handleFeedbackUpdate);
    };
  }, []);

  return (
    <div className={`w-full py-12 sm:py-16 lg:py-20 border-t ${isDark ? 'bg-[#040812] border-slate-800/80' : 'bg-slate-50/80 border-slate-200/80'}`}>
      <div className="container max-w-6xl mx-auto px-3 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 border ${isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            <Award className="w-3.5 h-3.5" /> {t('testimonials.tag', 'Sertifikasi & Testimoni Investor')}
          </span>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('testimonials.title', 'Kisah Sukses Investor')}
          </h2>
          <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('testimonials.subtitle', 'Bukti nyata komitmen Kabupaten Luwu dalam memberikan kepastian spasial dan kemudahan investasi.')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-xs font-semibold">{t('testimonials.loading', 'Verifikasi data testimoni investor...')}</p>
          </div>
        ) : testimonials.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`max-w-2xl mx-auto rounded-3xl border p-6 sm:p-8 text-center relative overflow-hidden backdrop-blur-md ${
              isDark 
                ? 'bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950/90 border-slate-800 shadow-2xl shadow-black/60' 
                : 'bg-gradient-to-b from-white via-slate-50/80 to-slate-100/60 border-slate-200/90 shadow-xl shadow-slate-200/50'
            }`}
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-500" />
            
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h3 className={`text-base sm:text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Portal Verifikasi Testimoni Investor Resmi
            </h3>
            
            <p className={`text-xs sm:text-sm max-w-lg mx-auto mb-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Setiap laporan dan masukan pelaku usaha disaring secara ketat melalui verifikasi NIB & KBLI resmi DPMPTSP Kabupaten Luwu demi menjamin transparansi data publik.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              STATUS: SISTEM AUDIT NIB & OSS AKTIF
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <motion.div 
                key={item.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 sm:p-7 rounded-2xl relative ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border flex flex-col justify-between`}
              >
                <Quote className={`absolute top-5 right-5 w-7 h-7 opacity-15 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <p className={`text-xs sm:text-sm italic mb-5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{item.message}"</p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.investor_name || item.company_name}</h4>
                    {item.is_verified && (
                      <div className="flex items-center text-blue-600 dark:text-blue-400 text-[11px] gap-1 font-semibold" title={t('testimonial.verified', 'Terverifikasi')}>
                        <BadgeCheck size={14} />
                        <span>{t('testimonial.verified', 'Terverifikasi')}</span>
                      </div>
                    )}
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-medium mt-0.5`}>{item.sector}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}