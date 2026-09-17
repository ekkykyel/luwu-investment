import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Quote, BadgeCheck, MessageSquareOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase, handleSupabaseError } from '../lib/supabaseClient.js';

export default function TestimonialSection({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTestimonials = async () => {
      try {
        // Try server API first as it uses backend service role and caching (immune to client JWT expiration)
        const apiRes = await fetch('/api/testimonials', {
          headers: { 'Accept': 'application/json' }
        }).catch(() => null);

        if (apiRes && apiRes.ok) {
          const apiData = await apiRes.json().catch(() => null);
          if (Array.isArray(apiData) && apiData.length > 0) {
            if (isMounted) {
              setTestimonials(apiData);
              setIsLoading(false);
            }
            return;
          }
        }

        // Direct Supabase query fallback
        const { data, error } = await supabase
          .from('investor_testimonials')
          .select('*')
          .eq('is_verified', true)
          .order('created_at', { ascending: false });

        if (error) {
          await handleSupabaseError(error);
          if (isMounted) setTestimonials([]);
        } else if (isMounted) {
          setTestimonials(Array.isArray(data) ? data : []);
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

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={`w-full py-16 sm:py-24 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
      <div className="container max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className={`text-3xl font-bold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('testimonials.title', 'Kisah Sukses Investor')}</h2>
          <p className={`text-sm ${isDark ? 'text-slate-600 dark:text-slate-400' : 'text-slate-600'}`}>{t('testimonials.subtitle', 'Tanggapan dan cerita sukses dari pelaku usaha di Kabupaten Luwu')}</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm font-medium">{t('testimonials.loading', 'Memuat data testimoni...')}</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-slate-600 dark:text-slate-400 border border-slate-800 border-dashed rounded-2xl max-w-lg mx-auto">
            <MessageSquareOff className="w-10 h-10 mb-3 stroke-1 text-slate-600" />
            <p className="text-sm font-medium text-center">{t('testimonials.emptyState', 'Belum ada data testimoni terverifikasi yang tersedia.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((item, i) => (
              <motion.div 
                key={item.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-2xl relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} border`}
              >
                <Quote className={`absolute top-6 right-6 w-8 h-8 opacity-10 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <p className={`text-sm italic mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800 dark:text-slate-200'}`}>"{item.message}"</p>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.investor_name || item.company_name}</h4>
                    {item.is_verified && (
                      <div className="flex items-center text-blue-700 dark:text-blue-400 text-xs gap-1" title={t('testimonial.verified', 'Terverifikasi')}>
                        <BadgeCheck size={14} />
                        <span className="hidden sm:inline-block">{t('testimonial.verified', 'Terverifikasi')}</span>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-medium mt-1`}>{item.sector}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}