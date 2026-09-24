import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Loader2, Sparkles, AlertCircle, Building, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SiteRecommendation {
  districtName: string;
  score: number;
  reasoning: string;
}

export default function AISiteSelection() {
  const { t, i18n } = useTranslation();
  const [criteria, setCriteria] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<SiteRecommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!criteria.trim()) {
      setError(t('site_selection_empty', 'Silakan masukkan kriteria lokasi yang Anda butuhkan.'));
      return;
    }
    
    setError(null);
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/gemini/site-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          criteria,
          language: i18n.language 
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menganalisis kriteria. Silakan coba lagi.');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-[#090d16] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[800px]">
      <div className="p-6 border-b border-[#1e293b] bg-gradient-to-r from-[#0f172a] to-[#090d16] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[#3b82f6]" />
              {t('ai_site_selection', 'AI-Driven Site Selection')}
            </h2>
            <p className="text-[#94a3b8] mt-2">
              {t('ai_site_selection_desc', 'Deskripsikan kebutuhan proyek Anda (misal: "Lahan 50ha dekat pelabuhan untuk pabrik es"), dan AI akan mencarikan kecamatan paling strategis di Luwu.')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#e2e8f0]">
              {t('project_criteria', 'Kriteria Proyek & Kebutuhan Lahan')}
            </label>
            <div className="relative">
              <textarea
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder={t('site_selection_placeholder', 'Contoh: Saya membutuhkan lahan seluas 100 hektar dengan topografi datar untuk pembangunan kawasan industri nikel. Harus dekat dengan jalan provinsi dan memiliki akses mudah ke pelabuhan laut.')}
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 text-white placeholder-[#475569] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all resize-none min-h-[120px]"
              />
              <div className="absolute bottom-4 right-4 text-[#475569]">
                <Search className="w-5 h-5" />
              </div>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 p-3 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
            
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#3b82f6]/50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('analyzing', 'Menganalisis Spasial...')}
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  {t('find_location', 'Temukan Lokasi Strategis')}
                </>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {results && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 pt-6 border-t border-[#1e293b]"
              >
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  {t('top_recommendations', 'Rekomendasi Lokasi Teratas')}
                </h3>
                
                <div className="grid gap-4">
                  {results.map((rec, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 relative overflow-hidden group hover:border-[#3b82f6]/50 transition-colors"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3b82f6]/10 to-transparent rounded-bl-full pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#1e293b] flex items-center justify-center text-[#3b82f6] font-bold text-lg">
                            #{idx + 1}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white flex items-center gap-2">
                              {rec.districtName}
                            </h4>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-[#94a3b8]">{t('suitability_score', 'Skor Kelayakan')}</span>
                          <span className={`text-2xl font-black ${
                            rec.score >= 90 ? 'text-emerald-400' :
                            rec.score >= 80 ? 'text-[#3b82f6]' :
                            'text-amber-400'
                          }`}>
                            {rec.score}/100
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-[#cbd5e1] text-sm leading-relaxed mt-4 bg-[#090d16] p-4 rounded-lg border border-[#1e293b]">
                        {rec.reasoning}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
