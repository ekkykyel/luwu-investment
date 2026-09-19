import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  Layers,
  Check,
  RotateCcw,
  Sliders,
  Sprout,
  ShieldAlert,
  TreePine,
  Fish,
  Factory,
  Mountain,
  MapPin,
  TrendingUp,
  Award,
  ChevronRight,
  Compass,
  ArrowUpRight,
  Filter,
  CheckCircle2
} from "lucide-react";
import { Investment, GeoJSONLayer, District, Village, SektorInvestasi } from "../types";
import { formatRupiah, formatNumber } from "../lib/formatters";

export interface LandSuitabilityFilterState {
  commodity: string;
  soilGrade: "ALL" | "S1" | "S2" | "S3";
  minSuitabilityScore: number;
  maxSlopeDegree: number;
  avoidFloodRisk: boolean;
  avoidLandslideRisk: boolean;
  requiredLandCover: string;
}

export interface CommodityProfile {
  id: string;
  name: string;
  sector: SektorInvestasi;
  icon: string;
  idealSoil: string;
  idealpH: string;
  idealElevation: string;
  estimatedYieldHa: string;
  valuePerTon: number; // Rupiah per ton
  description: string;
  topDistricts: string[];
}

export const COMMODITY_PROFILES: CommodityProfile[] = [
  {
    id: "kakao",
    name: "Kakao Fermentasi High-Grade",
    sector: SektorInvestasi.PERTANIAN,
    icon: "🍫",
    idealSoil: "Tanah Latosol / Podsolik Cokelat (Solum Dalam, Drainase Baik)",
    idealpH: "6.0 - 7.5",
    idealElevation: "50 - 600 m dpl",
    estimatedYieldHa: "1.8 - 2.4 Ton / Ha / Tahun",
    valuePerTon: 85000000,
    description: "Komoditas unggulan Kabupaten Luwu dengan sertifikasi indikasi geografis. Membutuhkan tanah gembur berhumus tinggi.",
    topDistricts: ["Suli", "Suli Barat", "Kamanre", "Bajo", "Latimojong"]
  },
  {
    id: "kopi_arabika",
    name: "Kopi Arabika Specialty Bastem/Latimojong",
    sector: SektorInvestasi.PERTANIAN,
    icon: "☕",
    idealSoil: "Tanah Vulkanik / Andosol Berorganik Tinggi",
    idealpH: "5.5 - 6.5",
    idealElevation: "> 1,000 m dpl",
    estimatedYieldHa: "1.2 - 1.6 Ton / Ha / Tahun",
    valuePerTon: 110000000,
    description: "Kopi dataran tinggi pegunungan Latimojong & Bastem dengan cita rasa asam sitrus dan body tebal.",
    topDistricts: ["Bastem", "Bastem Utara", "Latimojong"]
  },
  {
    id: "udang_vaname",
    name: "Udang Vaname Intensif & Super Intensif",
    sector: SektorInvestasi.KELAUTAN,
    icon: "🦐",
    idealSoil: "Tanah Aluvial Pesisir Pasang Surut / Leam Liat",
    idealpH: "7.5 - 8.5",
    idealElevation: "0 - 10 m dpl",
    estimatedYieldHa: "15 - 25 Ton / Ha / Siklus",
    valuePerTon: 75000000,
    description: "Budidaya perikanan pesisir Teluk Bone koridor Bua & Ponrang dengan suplai air laut bersih.",
    topDistricts: ["Bua", "Ponrang", "Ponrang Selatan", "Larompong"]
  },
  {
    id: "padi_sawah",
    name: "Padi Sawah Organik & Premium",
    sector: SektorInvestasi.PERTANIAN,
    icon: "🌾",
    idealSoil: "Tanah Aluvial Berlempung / Grumosol Topografi Datar",
    idealpH: "6.0 - 7.0",
    idealElevation: "0 - 300 m dpl",
    estimatedYieldHa: "6.5 - 8.0 Ton / Ha / Panen",
    valuePerTon: 7200000,
    description: "Lumbung pangan utama Luwu dengan sistem irigasi teknis Bendung Salu jaringan primer.",
    topDistricts: ["Walenrang", "Walenrang Timur", "Lamasi", "Suli"]
  },
  {
    id: "kelapa_sawit",
    name: "Kelapa Sawit (Palm Oil)",
    sector: SektorInvestasi.PERTANIAN,
    icon: "🌴",
    idealSoil: "Latosol / Aluvial Solum >150 cm",
    idealpH: "5.0 - 6.5",
    idealElevation: "0 - 400 m dpl",
    estimatedYieldHa: "20 - 28 Ton TBS / Ha / Tahun",
    valuePerTon: 2800000,
    description: "Perkebunan kelapa sawit rakyat & terpadu terhubung ke pabrik PKS wilayah utara Luwu.",
    topDistricts: ["Walenrang Barat", "Walenrang Utara", "Lamasi Timur"]
  },
  {
    id: "smelter_mineral",
    name: "Kawasan Smelter & Pengolahan Mineral",
    sector: SektorInvestasi.PERDAGANGAN,
    icon: "🏭",
    idealSoil: "Batuan Induk Stabil / Geoteknik Bebas Gerakan Tanah",
    idealpH: "N/A (Persyaratan Struktur)",
    idealElevation: "10 - 100 m dpl",
    estimatedYieldHa: "Kapasitas 50.000 Ton Ferronikel / Th",
    valuePerTon: 240000000,
    description: "Plot zona industri manufaktur dekat Pelabuhan Logistik Bua dan Koridor Jalan Trans-Sulawesi.",
    topDistricts: ["Bua", "Kamanre", "Belopa"]
  },
  {
    id: "ekowisata_pegunungan",
    name: "Ekowisata Pegunungan & Geopark",
    sector: SektorInvestasi.PARIWISATA,
    icon: "⛰️",
    idealSoil: "Lahan Hutan Lindung / Penyangga Hutan Alam",
    idealpH: "5.5 - 7.0",
    idealElevation: "800 - 3,478 m dpl",
    estimatedYieldHa: "High Visitor Density & Resort Potential",
    valuePerTon: 0,
    description: "Pengembangan glamping, jalur pendakian Puncak Rante Mario Latimojong & konservasi alam.",
    topDistricts: ["Latimojong", "Bastem"]
  }
];

interface SpatialSuitabilityFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  districts: District[];
  villages?: Village[];
  spatialLayers?: Record<string, GeoJSONLayer>;
  onApplyFilter: (filteredIds: string[], criteria: LandSuitabilityFilterState) => void;
  onFocusInvestment?: (id: string) => void;
  onFocusDistrict?: (id: string) => void;
  isDarkMode?: boolean;
}

export default function SpatialSuitabilityFilterModal({
  isOpen,
  onClose,
  investments = [],
  districts = [],
  villages = [],
  spatialLayers = {},
  onApplyFilter,
  onFocusInvestment,
  onFocusDistrict,
  isDarkMode = true
}: SpatialSuitabilityFilterModalProps) {
  const { t } = useTranslation();

  // Filter State
  const [filterState, setFilterState] = useState<LandSuitabilityFilterState>({
    commodity: "kakao",
    soilGrade: "ALL",
    minSuitabilityScore: 70,
    maxSlopeDegree: 15,
    avoidFloodRisk: true,
    avoidLandslideRisk: true,
    requiredLandCover: "ALL"
  });

  const selectedCommodityProfile = useMemo(() => {
    return COMMODITY_PROFILES.find(c => c.id === filterState.commodity) || COMMODITY_PROFILES[0];
  }, [filterState.commodity]);

  // Compute Spatial Suitability Scores & Matching Investments
  const matchedAnalysis = useMemo(() => {
    if (!investments || investments.length === 0) return { matched: [], stats: { totalHa: 0, totalVal: 0, avgScore: 0, s1Count: 0, s2Count: 0, s3Count: 0 } };

    const comm = selectedCommodityProfile;

    const evaluated = investments.map(inv => {
      let baseScore = inv.suitabilityScore || 75;
      
      // Sector Match
      const sectorMatch = inv.sector === comm.sector || String(inv.sector).toLowerCase().includes(String(comm.sector).toLowerCase());
      if (sectorMatch) baseScore += 12;

      // Commodity keyword match in title/description
      const titleDesc = `${inv.name} ${inv.description || ""} ${inv.locationName || ""}`.toLowerCase();
      if (titleDesc.includes(comm.id) || titleDesc.includes(comm.name.toLowerCase()) || comm.topDistricts.some(d => titleDesc.includes(d.toLowerCase()))) {
        baseScore += 15;
      }

      // Slope degree constraint check
      if (filterState.maxSlopeDegree <= 8 && baseScore > 85) {
        // Flat land preferred
      } else if (filterState.maxSlopeDegree < 15 && baseScore < 60) {
        baseScore -= 10;
      }

      // Risk layer penalty checks
      if (filterState.avoidFloodRisk && (titleDesc.includes("banjir") || titleDesc.includes("pesisir rendah"))) {
        baseScore -= 18;
      }
      if (filterState.avoidLandslideRisk && (titleDesc.includes("curam") || titleDesc.includes("longsor"))) {
        baseScore -= 20;
      }

      // Cap score between 35 and 99
      const finalScore = Math.min(99, Math.max(35, Math.round(baseScore)));

      // Derive FAO Grade
      let grade: "S1" | "S2" | "S3" | "N" = "S3";
      if (finalScore >= 85) grade = "S1";
      else if (finalScore >= 70) grade = "S2";
      else if (finalScore >= 55) grade = "S3";
      else grade = "N";

      return {
        ...inv,
        calculatedSuitabilityScore: finalScore,
        suitabilityGrade: grade
      };
    });

    // Filter by criteria
    const filtered = evaluated.filter(item => {
      if (item.calculatedSuitabilityScore < filterState.minSuitabilityScore) return false;
      if (filterState.soilGrade !== "ALL" && item.suitabilityGrade !== filterState.soilGrade) return false;
      return true;
    });

    // Sort descending by calculated score
    filtered.sort((a, b) => b.calculatedSuitabilityScore - a.calculatedSuitabilityScore);

    const totalHa = filtered.reduce((sum, item) => sum + (item.areaHa || 0), 0);
    const totalVal = filtered.reduce((sum, item) => sum + (item.investmentValue || 0), 0);
    const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((sum, item) => sum + item.calculatedSuitabilityScore, 0) / filtered.length) : 0;

    const s1Count = filtered.filter(i => i.suitabilityGrade === "S1").length;
    const s2Count = filtered.filter(i => i.suitabilityGrade === "S2").length;
    const s3Count = filtered.filter(i => i.suitabilityGrade === "S3").length;

    return {
      matched: filtered,
      stats: {
        totalHa,
        totalVal,
        avgScore,
        s1Count,
        s2Count,
        s3Count
      }
    };
  }, [investments, selectedCommodityProfile, filterState]);

  const handleReset = () => {
    setFilterState({
      commodity: "kakao",
      soilGrade: "ALL",
      minSuitabilityScore: 70,
      maxSlopeDegree: 15,
      avoidFloodRisk: true,
      avoidLandslideRisk: true,
      requiredLandCover: "ALL"
    });
  };

  const handleApply = () => {
    const ids = matchedAnalysis.matched.map(m => m.id);
    onApplyFilter(ids, filterState);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
            isDarkMode 
              ? "bg-slate-900 border-slate-750 text-white shadow-emerald-950/30" 
              : "bg-white border-slate-200 text-slate-900 shadow-xl"
          }`}
        >
          {/* Header Bar */}
          <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-emerald-50/80 border-slate-200"
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sprout className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-1.5">
                    Filter Spasial Kesesuaian Lahan & Kualitas Tanah
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    FAO Soil Framework
                  </span>
                </div>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Pilih komoditas target dan parameter fisik tanah untuk memfilter zonasi area paling potensial di Kabupaten Luwu.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700" 
                  : "bg-white border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
            {/* 1. SELECT TARGET COMMODITY */}
            <div>
              <label className="text-[10px] font-bold uppercase font-mono tracking-widest text-emerald-400 block mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1. Pilih Komoditas Target (Commodity Profile)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {COMMODITY_PROFILES.map((comm) => {
                  const isSelected = filterState.commodity === comm.id;
                  return (
                    <button
                      key={comm.id}
                      onClick={() => setFilterState(prev => ({ ...prev, commodity: comm.id }))}
                      className={`p-2.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[90px] cursor-pointer relative ${
                        isSelected 
                          ? "bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40" 
                          : isDarkMode
                            ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50"
                            : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-2xl">{comm.icon}</span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-emerald-500 text-slate-950">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold leading-tight block mt-2">
                        {comm.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Commodity Technical Specs Card */}
              <div className={`mt-3 p-3.5 rounded-2xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${
                isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-emerald-50/50 border-emerald-200"
              }`}>
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedCommodityProfile.icon}</span>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-400">
                      Spesifikasi Lahan Kritis: {selectedCommodityProfile.name}
                    </h4>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {selectedCommodityProfile.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-mono pt-1">
                    <span>🌱 Tanah: <strong className="text-white">{selectedCommodityProfile.idealSoil}</strong></span>
                    <span>🧪 pH Ideal: <strong className="text-emerald-300">{selectedCommodityProfile.idealpH}</strong></span>
                    <span>⛰️ Elevasi: <strong className="text-sky-300">{selectedCommodityProfile.idealElevation}</strong></span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0 text-right font-mono min-w-[180px]">
                  <span className="text-[9px] uppercase text-slate-400 block font-bold">Est. Yield Produksi</span>
                  <span className="text-xs font-bold text-amber-400 block mt-0.5">{selectedCommodityProfile.estimatedYieldHa}</span>
                  <span className="text-[9px] text-emerald-400 block mt-1">
                    Kecamatan Utama: {selectedCommodityProfile.topDistricts.slice(0, 3).join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. PARAMETER SOIL QUALITY & SUITABILITY CLASS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-800">
              {/* Left Column: Soil Quality Class & Minimum Score */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase font-mono tracking-widest text-emerald-400 block flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  2. Kelas Kesesuaian Lahan (FAO Soil Rating)
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "ALL", label: "Semua Kelas", desc: "S1 + S2 + S3" },
                    { id: "S1", label: "Kelas S1", desc: "Sangat Sesuai (>85%)" },
                    { id: "S2", label: "Kelas S2", desc: "Cukup Sesuai (70-84%)" },
                    { id: "S3", label: "Kelas S3", desc: "Bersyarat (55-69%)" },
                  ].map((grade) => (
                    <button
                      key={grade.id}
                      onClick={() => setFilterState(prev => ({ ...prev, soilGrade: grade.id as any }))}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        filterState.soilGrade === grade.id
                          ? "bg-emerald-600 text-white border-emerald-400 font-bold shadow-md"
                          : isDarkMode
                            ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                            : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="text-xs font-mono font-bold block">{grade.label}</span>
                      <span className="text-[8.5px] opacity-80 block">{grade.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Minimum Suitability Score Slider */}
                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-300">Skor Kesesuaian Minimum:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {filterState.minSuitabilityScore}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="95"
                    step="5"
                    value={filterState.minSuitabilityScore}
                    onChange={(e) => setFilterState(prev => ({ ...prev, minSuitabilityScore: Number(e.target.value) }))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-full appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                    <span>40% (Longgar)</span>
                    <span>70% (Standar Investor)</span>
                    <span>95% (Presisi Eksklusif)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Slope & Environmental Risk Filters */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase font-mono tracking-widest text-emerald-400 block flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  3. Topografi & Proteksi Kerentanan Bencana
                </label>

                {/* Slope Control */}
                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-300">Kemiringan Lahan Maksimum:</span>
                    <span className="font-mono font-bold text-sky-400 text-xs bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      &lt; {filterState.maxSlopeDegree}° ({filterState.maxSlopeDegree <= 8 ? "Datar" : filterState.maxSlopeDegree <= 15 ? "Bergelombang" : "Curam"})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 8, label: "Datar (0-8°)", desc: "Mekanisasi Pertanian / Sawah" },
                      { val: 15, label: "Bergelombang (8-15°)", desc: "Perkebunan Kakao / Sawit" },
                      { val: 40, label: "Semua Kemiringan", desc: "Dataran Tinggi / Kopi" },
                    ].map(slope => (
                      <button
                        key={slope.val}
                        onClick={() => setFilterState(prev => ({ ...prev, maxSlopeDegree: slope.val }))}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          filterState.maxSlopeDegree === slope.val
                            ? "bg-sky-600 text-white border-sky-400 font-bold"
                            : isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="text-[10px] font-bold block">{slope.label}</span>
                        <span className="text-[8px] opacity-75 block">{slope.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hazard Avoidance Toggles */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFilterState(prev => ({ ...prev, avoidFloodRisk: !prev.avoidFloodRisk }))}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      filterState.avoidFloodRisk
                        ? "bg-blue-500/20 border-blue-400 text-blue-300"
                        : "bg-slate-950/40 border-slate-800 text-slate-500 opacity-60"
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg ${filterState.avoidFloodRisk ? "bg-blue-500 text-slate-950" : "bg-slate-800"}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold block">Bebas Risiko Banjir</span>
                      <span className="text-[9px] opacity-80 block">Abaikan kawasan genangan pasang</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setFilterState(prev => ({ ...prev, avoidLandslideRisk: !prev.avoidLandslideRisk }))}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      filterState.avoidLandslideRisk
                        ? "bg-rose-500/20 border-rose-400 text-rose-300"
                        : "bg-slate-950/40 border-slate-800 text-slate-500 opacity-60"
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg ${filterState.avoidLandslideRisk ? "bg-rose-500 text-slate-950" : "bg-slate-800"}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold block">Bebas Longsor</span>
                      <span className="text-[9px] opacity-80 block">Abaikan zona lereng kritis</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. SIMULATED ANALYTICS MATCHED RESULTS */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Hasil Filter Spasial: {matchedAnalysis.matched.length} Polygon Area Terverifikasi
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Skor Rata-Rata:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {matchedAnalysis.stats.avgScore}% Match
                  </span>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">Total Luas Lahan</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono block mt-1">
                    {formatNumber(matchedAnalysis.stats.totalHa)} Ha
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">Est. Nilai Potensi</span>
                  <span className="text-sm font-bold text-amber-400 font-mono block mt-1">
                    {formatRupiah(matchedAnalysis.stats.totalVal)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">Sebaran Kualitas (FAO)</span>
                  <span className="text-xs font-bold text-white font-mono block mt-1">
                    <span className="text-emerald-400">{matchedAnalysis.stats.s1Count} S1</span> / <span className="text-sky-400">{matchedAnalysis.stats.s2Count} S2</span> / <span className="text-amber-400">{matchedAnalysis.stats.s3Count} S3</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">Proyeksi Yield Panen</span>
                  <span className="text-xs font-bold text-sky-300 font-mono block mt-1">
                    ~{formatNumber(Math.round(matchedAnalysis.stats.totalHa * (parseFloat(selectedCommodityProfile.estimatedYieldHa) || 1.5)))} Ton/Th
                  </span>
                </div>
              </div>

              {/* List of Matched Top Areas */}
              {matchedAnalysis.matched.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                    Top 5 Area Lahan Paling Sesuai untuk Komoditas {selectedCommodityProfile.name}:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 dark-scroll">
                    {matchedAnalysis.matched.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (onFocusInvestment) onFocusInvestment(item.id);
                          if (onFocusDistrict && item.districtId) onFocusDistrict(item.districtId);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl border bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer flex justify-between items-center group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{selectedCommodityProfile.icon}</span>
                            <h5 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{item.name}</h5>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Kec. {districts.find(d => String(d.id) === String(item.districtId))?.name || item.locationName || "Kab. Luwu"} • {item.areaHa} Ha
                          </p>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold block ${
                            item.calculatedSuitabilityScore >= 85 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          }`}>
                            {item.calculatedSuitabilityScore}% ({item.suitabilityGrade})
                          </span>
                          <span className="text-[9px] text-amber-400 font-mono mt-0.5 block">{formatRupiah(item.investmentValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400 font-mono italic">
                  Tidak ditemukan polygon lahan yang memenuhi kriteria ketat untuk komoditas ini. Cobalah melonggarkan skor minimum atau kemiringan lahan.
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className={`px-5 py-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 font-mono text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-mono text-xs transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 border border-emerald-400"
              >
                <Filter className="w-4 h-4" />
                Terapkan Filter Spasial ({matchedAnalysis.matched.length} Lahan)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
