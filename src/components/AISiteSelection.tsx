import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Search, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Factory, 
  ArrowRight, 
  RotateCcw, 
  Copy, 
  Check, 
  Building2, 
  Mountain, 
  Anchor, 
  Compass,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SiteRecommendation {
  districtName: string;
  score: number;
  reasoning: string;
}

// Preset skenario investasi strategis di Kabupaten Luwu
const PRESET_SCENARIOS = [
  {
    id: 'smelter',
    label: '🏭 Smelter & Industri Pengolahan',
    criteria: 'Saya membutuhkan lahan 50-100 hektar dengan topografi datar (<8%) untuk kawasan industri manufaktur/pengolahan mineral. Memerlukan kedekatan ke pelabuhan laut logistik, akses jalan nasional Trans Sulawesi, dan kapasitas jaringan listrik PLN tegangan tinggi.'
  },
  {
    id: 'kakao',
    label: '🍫 Agroindustri Kakao & Hilirisasi Kopi',
    criteria: 'Kebutuhan lahan 15-30 hektar untuk pabrik hilirisasi produk perkebunan (biji kakao fermentasi dan kopi arabika/robusta). Membutuhkan akses jalan kabupaten yang memadai, dekat dengan sentra perkebunan rakyat, dan pasokan air baku bersih.'
  },
  {
    id: 'fishery',
    label: '🐟 Cold Storage & Perikanan Pesisir',
    criteria: 'Lahan 3-5 hektar di kawasan pesisir Teluk Bone untuk fasilitas integrated cold storage dan pengolahan hasil laut/tambak bandeng & udang vaname. Dekat dengan pelabuhan pendaratan ikan, akses jalan poros, dan kontinuitas listrik.'
  },
  {
    id: 'logistics',
    label: '📦 Sentra Logistik & Pergudangan',
    criteria: 'Lahan seluas 10-20 hektar untuk sentra pergudangan distribusi kargo regional dan depo kontainer. Wajib memiliki akses cepat ke Bandara I Laga Ligo Bua dan Pelabuhan Tanjung Ringgit serta bebas hambatan truk kontainer.'
  },
  {
    id: 'ebt',
    label: '⚡ Pembangkit Energi EBT / PLTMH',
    criteria: 'Lokasi potensial untuk pengembangan Pembangkit Listrik Tenaga Mikrohidro (PLTMH) atau biomassa, dekat dengan aliran sungai Daerah Aliran Sungai (DAS) Luwu dengan debit stabil dan dekat jalur transmisi interkoneksi PLN.'
  }
];

// Parameter penapisan cepat yang dapat ditambahkan ke prompt
const QUICK_TAGS = [
  'Akses Pelabuhan Tanjung Ringgit',
  'Dekat Bandara I Laga Ligo Bua',
  'Topografi Datar (<8%)',
  'Zonasi Industri RTRW',
  'Akses Air Baku Sungai',
  'Dekat Gardu Induk (GI) PLN'
];

export default function AISiteSelection() {
  const { t, i18n } = useTranslation();
  const [criteria, setCriteria] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<SiteRecommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!criteria.trim()) {
      setError(t('site_selection_empty', 'Silakan masukkan kriteria atau pilih preset skenario investasi di atas.'));
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
        throw new Error('Gagal menganalisis kriteria spasial. Silakan coba lagi.');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!criteria.includes(tag)) {
      setCriteria((prev) => (prev ? `${prev}. Wajib mempertimbangkan ${tag}` : `Wajib mempertimbangkan ${tag}`));
    }
  };

  const handleCopyReasoning = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="w-full space-y-6">
      {/* ========================================================================= */}
      {/* HEADER SECTION: SDSS LUXURY BANNER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 border border-blue-800/40 shadow-xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 blur-3xl rounded-full -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>SPATIAL DECISION SUPPORT SYSTEM (SDSS)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              {t('ai_site_selection', 'Rekomendasi Lokasi Berbasis AI')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t(
                'ai_site_selection_desc',
                'Pencocokan lokasi investasi presisi di 22 Kecamatan Kabupaten Luwu melalui analisis multi-kriteria berbasis data spasial RTRW, topografi, dan kedekatan infrastruktur strategis.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>22 Kecamatan Terkoneksi</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>RTRW Perda 6/2011</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN BALANCED SYMMETRICAL LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: CRITERIA FORM & SCENARIO PRESETS (5 COLS)                   */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-500" />
                <span>Parameter & Kriteria Proyek</span>
              </h3>
              {criteria && (
                <button
                  type="button"
                  onClick={() => setCriteria('')}
                  className="text-[11px] text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Hapus kriteria"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            {/* Quick Scenario Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Pilih Skenario Proyek Siap Pakai (Preset):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => {
                      setCriteria(scenario.criteria);
                      setError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition-all text-left cursor-pointer"
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Deskripsi Spesifik Kebutuhan Lahan & Utilitas:
              </label>
              <div className="relative">
                <textarea
                  value={criteria}
                  onChange={(e) => {
                    setCriteria(e.target.value);
                    if (error) setError(null);
                  }}
                  rows={4}
                  placeholder={t(
                    'site_selection_placeholder',
                    'Contoh: Butuh lahan 50-100 hektar dengan kontur datar untuk pembangunan kawasan industri. Harus dekat dengan akses pelabuhan laut logistik dan memiliki pasokan listrik tegangan tinggi.'
                  )}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 px-1">
                <span>Gunakan bahasa Indonesia, Inggris, atau Mandarin</span>
                <span>{criteria.length} karakter</span>
              </div>
            </div>

            {/* Quick Priority Tags */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                + Tambah Kriteria Tambahan Cepat:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-start gap-2.5 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            {/* Action Submit Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memindai Geospasial 22 Kecamatan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>{t('find_location', 'Temukan Lokasi Strategis')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: SPATIAL INTELLIGENCE DASHBOARD OR RESULTS (7 COLS)        */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-4">
          <AnimatePresence mode="wait">
            {/* STATE 1: LOADING SPATIAL RADAR ANIMATION */}
            {isAnalyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="rounded-3xl bg-white dark:bg-slate-900/90 border border-blue-500/30 p-8 shadow-xl flex flex-col items-center justify-center text-center min-h-[380px] space-y-6"
              >
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-dashed border-blue-400 animate-spin" />
                  <div className="absolute inset-4 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Compass className="w-8 h-8 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Menghitung Kesesuaian Spasial Multi-Kriteria
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sistem sedang memproses penapisan izin ruang RTRW Perda No. 6/2011, kedekatan logistik Pelabuhan & Bandara, serta kesiapan utilitas di seluruh kecamatan...
                  </p>
                </div>

                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Analisis Algoritma GIS</span>
                    <span className="text-blue-500 font-mono animate-pulse">Memproses...</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-[shimmer_2s_infinite]" style={{ width: '85%' }} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATE 2: RESULTS AVAILABLE */}
            {results && !isAnalyzing && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                {/* Result Header Bar */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {t('top_recommendations', 'Rekomendasi Lokasi Teratas')}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResults(null);
                      setCriteria('');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ubah Kriteria</span>
                  </button>
                </div>

                {/* Recommendations Cards */}
                <div className="space-y-3.5">
                  {results.map((rec, idx) => {
                    const isTop = idx === 0;
                    const scoreColor =
                      rec.score >= 90
                        ? 'text-emerald-500 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                        : rec.score >= 80
                        ? 'text-blue-500 dark:text-blue-400 border-blue-500/30 bg-blue-500/10'
                        : 'text-amber-500 dark:text-amber-400 border-amber-500/30 bg-amber-500/10';

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`rounded-2xl p-5 border transition-all duration-300 shadow-sm ${
                          isTop
                            ? 'bg-white dark:bg-slate-900 border-blue-500/40 shadow-blue-500/5 ring-1 ring-blue-500/20'
                            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                                isTop
                                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              #{idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-black text-slate-900 dark:text-white">
                                  Kecamatan {rec.districtName}
                                </h4>
                                {isTop && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                                    Paling Sesuai
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-blue-500" />
                                <span>Wilayah Kabupaten Luwu</span>
                              </span>
                            </div>
                          </div>

                          {/* Score Gauge */}
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">
                              Skor Kesesuaian
                            </span>
                            <span className={`text-xl font-black font-mono px-2.5 py-0.5 rounded-lg border ${scoreColor}`}>
                              {rec.score}%
                            </span>
                          </div>
                        </div>

                        {/* Reasoning Text */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                          <p>{rec.reasoning}</p>
                          <div className="flex items-center justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyReasoning(rec.reasoning, idx)}
                              className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-blue-500 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Salin analisis ini"
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500 font-semibold">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Analisis</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STATE 3: INITIAL IDLE OVERVIEW (SYMMETRICAL KNOWLEDGE BASE MATRIX) */}
            {results === null && !isAnalyzing && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>4 Pilar Evaluasi Geospasial Kabupaten Luwu</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Kecerdasan buatan menyaring database geospasial resmi Pemkab Luwu secara komprehensif.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    Sistem Aktif
                  </span>
                </div>

                {/* 2x2 Symmetrical Grid of Spatial Criteria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      1. Kesesuaian Pola Ruang (RTRW)
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Penapisan zonasi kawasan budidaya (industri, perkebunan, permukiman) terbebas dari sengketa kawasan lindung/hutan konservasi sesuai Perda No. 6/2011.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Mountain className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      2. Topografi & Elevasi GIS
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Evaluasi kemiringan kontur tanah (datar 0–8%, landai 8–15%, perbukitan) untuk efisiensi biaya cut-and-fill serta keamanan geologi konstruksi.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Anchor className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      3. Koridor Logistik Multimoda
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Kalkulasi kedekatan akses ke Pelabuhan Tanjung Ringgit, Bandara I Laga Ligo Bua, dan jalur arteri Trans Sulawesi untuk efisiensi rantai pasok.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      4. Utilitas & Tenaga Kerja
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Penilaian ketersediaan pasokan listrik Gardu Induk (GI) PLN, air baku aliran sungai DAS Luwu, dan demografi serapan tenaga kerja lokal kecamatan.
                    </p>
                  </div>
                </div>

                {/* Instruction Callout */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-900 dark:text-blue-200">
                    <strong className="font-semibold">Langkah Mudah:</strong> Pilih salah satu preset skenario di panel sebelah kiri atau tuliskan kriteria unik proyek Anda, lalu klik tombol <span className="underline">Temukan Lokasi Strategis</span>.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
