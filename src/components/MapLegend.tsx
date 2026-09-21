import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import * as turf from "@turf/turf";
import { useTranslation } from "react-i18next";
import { GeoJSONLayer, Investment, SektorInvestasi } from "../types";
import { LuwuLogo } from "./LuwuLogo";
import AutoTranslatedText from "./AutoTranslatedText";
import { 
  Layers, ChevronDown, ChevronUp, MapPin, 
  Sparkles, ShieldAlert, Zap, Globe, Flame, 
  Compass, Eye, EyeOff, HelpCircle, Info, Copy, Check, FileJson, Search,
  GripVertical, List, Activity, Loader2, Sliders
} from "lucide-react";

interface MapLegendProps {
  spatialLayers: GeoJSONLayer[];
  heatmapMetric: "count" | "value" | "density" | "road_density" | "none";
  choroplethMetric: "value" | "density" | "infrastructure" | "none";
  activeChoroplethFilter?: string | null;
  onToggleChoroplethFilter?: (color: string | null) => void;
  activeCategories?: string[];
  onToggleCategory?: (category: string) => void;
  investments: Investment[];
  isOpenDefault?: boolean;
  onToggleSectorFilter?: (sector: string) => void;
  onToggleLayerVis?: (layerId: string) => void;
  onChangeLayerOpacity?: (layerId: string, opacity: number) => void;
  onChangeLayerColor?: (layerId: string, color: string) => void;
  onReorderSpatialLayers?: (layers: GeoJSONLayer[]) => void;
  isDarkMode?: boolean;
}

export default function MapLegend({
  spatialLayers,
  heatmapMetric,
  choroplethMetric,
  activeChoroplethFilter,
  onToggleChoroplethFilter,
  activeCategories = ["Pertanian", "Kelautan", "Pertambangan", "Pariwisata", "Perdagangan"],
  onToggleCategory,
  investments,
  isOpenDefault = true,
  onToggleSectorFilter,
  onToggleLayerVis,
  onChangeLayerOpacity,
  onChangeLayerColor,
  onReorderSpatialLayers,
  isDarkMode = true
 }: MapLegendProps) {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(isOpenDefault);
  const [legendTab, setLegendTab] = useState<"aktif" | "daftar">("aktif");
  const [isInteractiveMode, setIsInteractiveMode] = useState(true);
  const [layerSortBy, setLayerSortBy] = useState<"name" | "date" | "category" | "manual">("name");
  const [layerSearchQuery, setLayerSearchQuery] = useState("");
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [selectedMetadataLayer, setSelectedMetadataLayer] = useState<GeoJSONLayer | null>(null);
  const [copiedLayerId, setCopiedLayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"attributes" | "raw" | "chart">("attributes");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Sorted spatial layers list based on selected option
  const sortedSpatialLayers = [...spatialLayers].sort((a, b) => {
    if (layerSortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (layerSortBy === "category") {
      return a.category.localeCompare(b.category);
    } else if (layerSortBy === "date") {
      const dateA = new Date(a.uploadedAt || 0).getTime();
      const dateB = new Date(b.uploadedAt || 0).getTime();
      return dateB - dateA; // Newer uploads first
    }
    return 0;
  });

  const displayedSpatialLayers = sortedSpatialLayers.filter((layer) => 
    layer.isActive && layer.name.toLowerCase().includes(layerSearchQuery.toLowerCase())
  );

  // Filter out active custom Uploaded spatial layers
  const activeCustomLayers = spatialLayers.filter(l => l.isActive);

  // Group investments by sector to count visible ones
  const filteredInvestments = investments.filter(inv => {
    if (activeCategories && !activeCategories.includes(inv.sector)) return false;
    
    return true;
  });

  const getSectorCount = (sector: SektorInvestasi) => {
    return investments.filter(inv => inv.sector === sector).length;
  };

  const getVisibleSectorCount = (sector: SektorInvestasi) => {
    if (!activeCategories.includes(sector)) return 0;
    // If the sector is deactivated (not matching the filter), visible count is 0
    
    return investments.filter(inv => inv.sector === sector).length;
  };

  const handleSectorClick = (sector: string) => {
    if (!isInteractiveMode || !onToggleCategory) return;
    onToggleCategory(sector);
  };

  const handleChoroplethCategoryClick = (color: string) => {
    if (!isInteractiveMode || !onToggleChoroplethFilter) return;
    if (activeChoroplethFilter === color) {
      onToggleChoroplethFilter(null);
    } else {
      onToggleChoroplethFilter(color);
    }
  };

  const handleCopyGeoJSON = (layer: GeoJSONLayer) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(layer.geojson, null, 2)).catch((err) => {
        console.error("Gagal menyalin GeoJSON:", err);
      });
      setCopiedLayerId(layer.id);
      setTimeout(() => {
        setCopiedLayerId(null);
      }, 2000);
    } catch (err) {
      console.error("Gagal menyalin GeoJSON:", err);
    }
  };

  const getLayerDetails = (layer: GeoJSONLayer) => {
    let featureCount = 0;
    if (layer.geojson?.type === "FeatureCollection") {
      featureCount = layer.geojson.features?.length || 0;
    } else if (layer.geojson?.type === "Feature") {
      featureCount = 1;
    } else if (layer.geojson) {
      featureCount = 1;
    }

    let geomType = "Polygon";
    if (layer.geojson) {
      const types = new Set<string>();
      if (layer.geojson.type === "FeatureCollection") {
        layer.geojson.features?.forEach((f: any) => {
          if (f?.geometry?.type) types.add(f.geometry.type);
        });
      } else if (layer.geojson.geometry?.type) {
        types.add(layer.geojson.geometry.type);
      }
      if (types.size > 0) {
        geomType = Array.from(types)[0];
      }
    }

    // Dynamic description based on layer ID and category
    let description = "Layer spasial dinamis format GeoJSON kustom.";
    const nameLower = layer.name.toLowerCase();
    
    if (layer.id === "layer_kecamatan") {
      description = "Batas administratif resmi kecamatan di Kabupaten Luwu.";
    } else if (layer.id === "layer_desa") {
      description = "Batas administratif kelurahan/desa Kabupaten Luwu.";
    } else if (layer.id === "layer_jalan") {
      description = "Jalur transportasi darat strategis penghubung sentra logistik.";
    } else if (layer.id === "layer_potensi") {
      description = "Delineasi spasial zona wilayah prospektif investasi.";
    } else if (layer.id === "layer_sawah") {
      description = "Lahan Sawah Dilindungi (LSD) untuk menjaga ketahanan pangan.";
    } else if (layer.id === "layer_mangrove") {
      description = "Kawasan ekosistem hutan mangrove pelindung abrasi pesisir.";
    } else if (layer.id === "layer_flood_risk") {
      description = "Zona risiko genangan banjir berdasarkan topografi wilayah.";
    } else if (layer.id === "layer_landslide_risk") {
      description = "Wilayah kerentanan tinggi gerakan tanah di lereng pegunungan.";
    } else if (layer.id === "layer_land_use_zoning") {
      description = "Rencana Tata Ruang Wilayah (RTRW) peruntukan ruang Luwu.";
    } else if (nameLower.includes("sawah") || nameLower.includes("padi")) {
      description = "Lahan sawah aktif dan kawasan pertanian pangan berkelanjutan.";
    } else if (nameLower.includes("hutan") || nameLower.includes("lindung")) {
      description = "Kawasan konservasi hutan lindung penyangga ekologi Kabupaten Luwu.";
    } else if (nameLower.includes("tambak") || nameLower.includes("kolam")) {
      description = "Sentra budidaya perikanan air payau dan darat.";
    } else if (nameLower.includes("jalan") || nameLower.includes("arteri")) {
      description = "Jaringan infrastruktur transportasi darat regional.";
    } else if (layer.category === "Infrastruktur") {
      description = "Simpul prasarana penunjang aktivitas ekonomi utama.";
    } else if (layer.category === "Kelautan") {
      description = "Zona maritim potensial untuk sektor kelautan dan perikanan.";
    } else if (layer.category === "Pertanian") {
      description = "Area pengembangan budidaya komoditas pertanian unggulan.";
    } else if (layer.category === "Pertambangan") {
      description = "Delineasi wilayah potensi mineral dan komoditas tambang.";
    } else if (layer.category === "Pariwisata") {
      description = "Destinasi wisata alam, budaya, atau bahari Kabupaten Luwu.";
    }

    return { featureCount, geomType, description };
  };

  return (
    <>
      <div 
        id="map-legend-panel"
        className={`absolute bottom-[90px] md:bottom-[24px] left-4 md:left-[352px] z-[40] w-[290px] sm:w-[325px] max-w-[330px] transition-all duration-300 ease-in-out font-['Plus_Jakarta_Sans',sans-serif] backdrop-blur-md border border-white/40 dark:border-slate-700/50 border-t-[3px] shadow-2xl rounded-2xl ${
          isDarkMode 
            ? "bg-slate-900/80 border-t-emerald-500 text-white" 
            : "bg-white/80 border-t-indigo-500 text-slate-950"
        }`}
      >
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-white/10 cursor-pointer selection:bg-transparent transition-all hover:bg-black/5 dark:hover:bg-white/5"
      >
        <div className="flex items-center gap-2.5">
          <LuwuLogo size="sm" />
          <div className="flex flex-col">
            <span className={`text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wide font-['Plus_Jakarta_Sans',sans-serif] leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {t("mapControls.spatialLegendTitle", "Legenda Peta Spasial")}
            </span>
            <span className={`text-[8.5px] sm:text-[9px] font-['Plus_Jakarta_Sans',sans-serif] font-medium leading-tight tracking-normal ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-indigo-600 font-semibold"}`}>
              {t("mapControls.luwuRegency", "Kabupaten Luwu")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {activeCustomLayers.length > 0 && (
            <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-mono font-black animate-pulse border ${
              isDarkMode 
                ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-400" 
                : "bg-emerald-50 text-emerald-700 border-emerald-300"
            }`}>
              {activeCustomLayers.length} Layer
            </span>
          )}
          <button className="text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-4.5 w-4.5" />
            ) : (
              <ChevronUp className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Tab Switcher */}
          <div className={`flex px-3 pt-3 pb-2 shrink-0 border-b gap-1.5 transition-colors ${
            isDarkMode ? "border-white/10 bg-slate-950/40" : "border-slate-200/60 bg-slate-50/40"
          }`}>
            <button
              type="button"
              onClick={() => setLegendTab("aktif")}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black font-sans transition-all duration-200 flex items-center justify-center gap-1.5 border cursor-pointer select-none ${
                legendTab === "aktif"
                  ? isDarkMode
                    ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-400 shadow-md shadow-emerald-500/5"
                    : "bg-indigo-50 border-indigo-250 text-indigo-700 shadow-sm"
                  : isDarkMode
                    ? "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    : "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-850 hover:bg-black/5"
              }`}
            >
              <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-700 dark:text-emerald-400" />
              {t("mapControls.activeLegend", "Legenda Aktif")}
            </button>
            <button
              type="button"
              onClick={() => setLegendTab("daftar")}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black font-sans transition-all duration-200 flex items-center justify-center gap-1.5 border cursor-pointer select-none ${
                legendTab === "daftar"
                  ? isDarkMode
                    ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-400 shadow-md shadow-emerald-500/5"
                    : "bg-indigo-50 border-indigo-250 text-indigo-700 shadow-sm"
                  : isDarkMode
                    ? "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    : "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-850 hover:bg-black/5"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              {t("mapControls.manageLayers", "Kelola Layer")}
            </button>
          </div>

          {/* Conditional search bar only under the managing layers tab */}
          {legendTab === "daftar" && (
            <div className={`px-4 pt-4 pb-2 border-b shrink-0 transition-colors ${
              isDarkMode ? "border-white/10 bg-slate-950/80" : "border-slate-200 bg-slate-50/50"
            }`}>
              <div className={`flex items-center border rounded-lg px-2.5 py-2 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 transition-colors ${
                isDarkMode ? "bg-slate-950/90 border-white/10 hover:border-white/20" : "bg-white border-slate-250 hover:border-slate-350 shadow-sm"
              }`}>
                <Search className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder={t("mapControls.searchCustomLayer", "Cari nama layer kustom...")}
                  value={layerSearchQuery}
                  onChange={(e) => setLayerSearchQuery(e.target.value)}
                  className={`bg-transparent border-none outline-none text-xs w-full ml-2 font-mono placeholder:text-slate-600 dark:placeholder:text-slate-400 font-medium ${
                    isDarkMode ? "text-slate-100" : "text-slate-850"
                  }`}
                />
              </div>
            </div>
          )}
          
          <div className="p-4 max-h-[350px] md:max-h-[440px] overflow-y-auto custom-scrollbar flex flex-col gap-5 text-sm">
            {legendTab === "daftar" ? (
              <>
                {/* Section 1: Tematik Choropleth */}
                {choroplethMetric !== "none" && (
                  <div className="flex flex-col gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-indigo-950"}`}>
                      <Layers className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      Klasifikasi Wilayah (Choropleth)
                    </span>
                    <div className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
                      isDarkMode ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50 border-slate-205 shadow-sm"
                    }`}>
                      <div className="flex flex-col gap-1.5">
                        <span className={`text-[11px] uppercase font-bold tracking-wide ${isDarkMode ? "text-emerald-450" : "text-indigo-900"}`}>
                          {choroplethMetric === "value" && "PDRB / Nilai Investasi"}
                          {choroplethMetric === "density" && "Kepadatan Penduduk"}
                          {choroplethMetric === "infrastructure" && "Skor Infrastruktur Wilayah"}
                        </span>
                        <div className="flex">
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                            isDarkMode ? "text-slate-600 dark:text-slate-400 bg-slate-900 border-white/5" : "text-slate-800 dark:text-slate-200 bg-white border-slate-250 shadow-xs"
                          }`}>
                            METRIK: {choroplethMetric.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Legend items list according to getColor logic */}
                      <div className="flex flex-col gap-1.5 mt-1 font-mono text-[11px] select-none">
                        {(() => {
                          const categories = {
                            value: [
                              { color: "#1e3a8a", label: "Sangat Tinggi (> Rp 500 Miliar)" },
                              { color: "#3b82f6", label: "Tinggi (Rp 300M - Rp 500M)" },
                              { color: "#60a5fa", label: "Sedang (Rp 150M - Rp 300M)" },
                              { color: "#bfdbfe", label: "Rendah (≤ Rp 150 Miliar)" },
                            ],
                            density: [
                              { color: "#9f1239", label: "Sangat Padat (> 500 Jiwa/km²)" },
                              { color: "#f43f5e", label: "Padat (200 - 500 Jiwa/km²)" },
                              { color: "#fda4af", label: "Sedang (100 - 200 Jiwa/km²)" },
                              { color: "#ffe4e6", label: "Rendah (≤ 100 Jiwa/km²)" },
                            ],
                            infrastructure: [
                              { color: "#14532d", label: "Sangat Baik (Skor ≥ 8 / 10)" },
                              { color: "#22c55e", label: "Kondisi Baik (Skor 6 - 7 / 10)" },
                              { color: "#86efac", label: "Cukup Kondusif (Skor 4 - 5 / 10)" },
                              { color: "#dcfce7", label: "Perlu Peningkatan (Skor < 4 / 10)" },
                            ]
                          };
                          const items = categories[choroplethMetric as keyof typeof categories] || [];
                          return items.map((item, idx) => {
                            const isVisible = !activeChoroplethFilter || activeChoroplethFilter === item.color;
                            return (
                              <div
                                key={idx}
                                onClick={() => handleChoroplethCategoryClick(item.color)}
                                className={`flex items-center gap-3 p-1.5 rounded-lg border transition-all ${
                                  isInteractiveMode
                                    ? "cursor-pointer hover:scale-[1.02] active:scale-95"
                                    : ""
                                } ${
                                  isVisible
                                    ? isDarkMode
                                      ? "border-slate-800 bg-slate-900/50 shadow-sm"
                                      : "border-slate-200 bg-white shadow-xs"
                                    : isDarkMode
                                      ? "border-transparent opacity-40 grayscale-[40%]"
                                      : "border-transparent opacity-40 grayscale-[40%]"
                                } ${
                                  isInteractiveMode && activeChoroplethFilter === item.color
                                    ? isDarkMode
                                      ? "ring-1 ring-emerald-500/30 bg-emerald-500/10"
                                      : "ring-1 ring-emerald-500/20 bg-emerald-50"
                                    : ""
                                }`}
                                title={isInteractiveMode ? "Klik untuk memfilter area ini di peta!" : ""}
                              >
                                <span className="h-4 w-5 rounded-md border shrink-0 shadow-sm relative flex items-center justify-center" style={{ backgroundColor: item.color, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                  {activeChoroplethFilter === item.color && (
                                    <span className="absolute inline-flex h-full w-full rounded-md bg-inherit animate-ping opacity-60"></span>
                                  )}
                                </span>
                                <span className={isVisible ? (isDarkMode ? "text-slate-200 font-medium" : "text-slate-800 font-bold") : (isDarkMode ? "text-slate-600 dark:text-slate-400 font-medium" : "text-slate-600 dark:text-slate-400 font-semibold")}>
                                  {item.label}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Heatmap Overlay */}
                {heatmapMetric !== "none" && (
                  <div className="flex flex-col gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5 ${
                      isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-655"
                    }`}>
                      <Flame className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
                      Dinamika Heatmap Konsentrasi
                    </span>
                    <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                      isDarkMode ? "bg-slate-950/60 border-slate-800/80 text-white" : "bg-slate-50 border-slate-205 text-slate-850 shadow-sm"
                    }`}>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className={`font-bold tracking-wide ${isDarkMode ? "text-amber-700 dark:text-amber-400" : "text-amber-700"}`}>
                          Aura Kepadatan:
                        </span>
                        <span className="font-mono text-[10px] leading-tight opacity-90 font-semibold">
                          {heatmapMetric === "value" ? "Nilai Investasi" : heatmapMetric === "density" ? "Kepadatan Penduduk" : heatmapMetric === "road_density" ? "Kepadatan Jaringan Jalan" : "Jumlah Rencana Proyek"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1">
                        <div className={`h-2.5 w-full rounded-full bg-gradient-to-r from-transparent via-orange-500 to-red-600 border ${
                          isDarkMode ? "border-white/10" : "border-slate-300"
                        }`}></div>
                        <span className={`text-[9px] shrink-0 font-mono ${isDarkMode ? "text-slate-450" : "text-slate-600 font-extrabold"}`}>Tinggi</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Sector Markers */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5 ${
                      isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-655"
                    }`}>
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      Lokasi Titik Sektoral
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsInteractiveMode(!isInteractiveMode)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-md transition-all select-none border whitespace-nowrap cursor-pointer font-bold ${
                        isInteractiveMode 
                          ? isDarkMode 
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-350 hover:bg-emerald-500/30 shadow-md" 
                            : "bg-emerald-50 border-emerald-355 text-emerald-700 hover:bg-emerald-100/80 shadow-xs" 
                          : isDarkMode 
                            ? "bg-slate-950/85 border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-950" 
                            : "bg-slate-100 border-slate-250 text-slate-550 hover:bg-slate-200"
                      }`}
                      title="Aktifkan klik pada sektor untuk memfilter peta"
                    >
                      INTERAKTIF: {isInteractiveMode ? "MENGALIR" : "MATI"}
                    </button>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
                    isDarkMode ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50 border-slate-205 text-slate-850 shadow-sm"
                  }`}>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className={isDarkMode ? "text-slate-450" : "text-slate-600"}>Filter Kategori Aktif:</span>
                      <span className={`font-black border px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] ${
                        isDarkMode ? "text-white bg-slate-900 border-white/10" : "text-slate-900 bg-white border-slate-250 shadow-xs"
                      }`}>
                        {activeCategories.length === 5 ? "SEMUA SEKTOR" : `${activeCategories.length} SEKTOR`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mt-1 select-none">
                      {[
                        { key: SektorInvestasi.PERTANIAN, name: "Pertanian", color: "bg-green-600", textName: "Pertanian" },
                        { key: SektorInvestasi.KELAUTAN, name: "Kelautan", color: "bg-cyan-500", textName: "Kelautan" },
                        { key: SektorInvestasi.PERTAMBANGAN, name: "Pertambangan", color: "bg-amber-600", textName: "Tambang" },
                        { key: SektorInvestasi.PARIWISATA, name: "Pariwisata", color: "bg-rose-500", textName: "Wisata" },
                        { key: SektorInvestasi.PERDAGANGAN, name: "Perdagangan", color: "bg-indigo-600", textName: "Dagang" }
                      ].map((sec) => {
                        const isVisibleOnMap = activeCategories.includes(sec.key);
                        const visibleCount = getVisibleSectorCount(sec.key);
                        const totalCount = getSectorCount(sec.key);

                        return (
                          <div
                            key={sec.key}
                            onClick={() => handleSectorClick(sec.key)}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                              isInteractiveMode 
                                ? "cursor-pointer hover:scale-[1.02] active:scale-95"
                                : ""
                            } ${
                              isVisibleOnMap 
                                ? isDarkMode 
                                  ? "border-slate-800 bg-slate-900 text-white shadow-sm" 
                                  : "border-slate-200 bg-white text-slate-900 shadow-xs" 
                                : isDarkMode 
                                  ? "border-transparent text-slate-600 dark:text-slate-400 opacity-40 grayscale-[40%]" 
                                  : "border-transparent text-slate-600 dark:text-slate-400 opacity-40 grayscale-[40%]"
                            } ${
                              isInteractiveMode && isVisibleOnMap
                                ? isDarkMode 
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/25" 
                                  : "bg-emerald-50 border-emerald-355 text-emerald-800 font-bold ring-1 ring-emerald-500/10"
                                : ""
                            }`}
                            title={`${sec.name}: ${visibleCount}/${totalCount} Titik Terlihat. ${
                              isInteractiveMode ? "Klik untuk memfilter!" : ""
                            }`}
                          >
                            <span className={`h-3.5 w-3.5 rounded-full ${sec.color} border-2 border-white/60 dark:border-slate-950/60 shrink-0 relative flex items-center justify-center shadow-sm`}>
                              {isVisibleOnMap && (
                                <span className="absolute inline-flex h-full w-full rounded-full bg-inherit animate-ping opacity-70"></span>
                              )}
                            </span>
                            <span className="text-[10px] sm:text-[11px] leading-tight font-semibold flex-1 truncate">
                              {sec.textName} 
                              <span className={`text-[8.5px] ml-1 font-bold ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                                ({visibleCount})
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {isInteractiveMode && (
                      <div className={`text-[9px] border-t pt-2 mt-1 leading-tight flex items-center justify-center gap-1.5 ${
                        isDarkMode ? "text-slate-600 dark:text-slate-400 border-white/5" : "text-slate-550 border-slate-200"
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-semibold">Tip: Klik sektor untuk filter instan di peta!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Batas Administratif */}
                <div className="flex flex-col gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5 ${
                    isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-655"
                  }`}>
                    <Compass className="h-4 w-4 text-emerald-500" />
                    Batas Administratif
                  </span>
                  <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                    isDarkMode ? "bg-slate-950/60 border-slate-800/80 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-mono select-none pointer-events-none">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-1 border-t-2 border-solid shadow-xs shrink-0" style={{ borderColor: "#1D4ED8" }} />
                        <span className={isDarkMode ? "text-slate-200 font-medium" : "text-slate-705 font-bold"}>Batas Kecamatan</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono select-none pointer-events-none">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-1 border-t cursor-pointer border-dashed shrink-0" style={{ borderColor: "#94a3b8" }} />
                        <span className={isDarkMode ? "text-slate-200 font-medium" : "text-slate-705 font-bold"}>Batas Desa (Klik Wilayah)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Dynamic Custom Spatial GIS Layers with Toggles & Opacity sliders */}
                {spatialLayers.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between col-span-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5 ${
                        isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-650"
                      }`}>
                        <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                        Layer GIS Kustom (GeoJSON)
                      </span>
                      <div className="flex items-center gap-1.5 select-none">
                        <span className={`text-[9px] font-mono font-bold ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>Urut:</span>
                        <select
                          value={layerSortBy}
                          onChange={(e) => setLayerSortBy(e.target.value as any)}
                          className={`text-[9px] font-mono font-bold border rounded-md px-2 py-1 outline-none cursor-pointer transition-all ${
                            isDarkMode 
                              ? "bg-slate-950 border-white/10 text-slate-200 hover:bg-slate-900 focus:border-emerald-500" 
                              : "bg-white border-slate-250 text-slate-800 hover:bg-slate-50 focus:border-emerald-600 shadow-xs"
                          }`}
                        >
                          <option value="name">Nama</option>
                          <option value="date">Tgl Unggah</option>
                          <option value="category">Kategori</option>
                          <option value="manual">Manual Stack Order</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-xl border flex flex-col gap-3.5 max-h-[250px] overflow-y-auto custom-scrollbar ${
                      isDarkMode ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50 border-slate-205 shadow-sm"
                    }`}>
                      {displayedSpatialLayers.length === 0 ? (
                        <div className="text-center py-5 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                          Tidak ada atribut data spasial kustom atau hasil pencarian nihil.
                        </div>
                      ) : (
                        Object.entries(
                          displayedSpatialLayers.reduce((acc, layer) => {
                            const cat = layer.category || "Uncategorized";
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(layer);
                            return acc;
                          }, {} as Record<string, GeoJSONLayer[]>)
                        ).map(([category, layersInCategory]) => (
                          <div key={category} className={`flex flex-col gap-2 border rounded-lg p-2.5 shrink-0 ${
                            isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white shadow-xs"
                          }`}>
                            <div 
                              className="flex items-center justify-between cursor-pointer group px-1"
                              onClick={() => setCollapsedCategories(prev => ({...prev, [category]: !prev[category]}))}
                            >
                              <span className={`text-[10px] font-black uppercase tracking-wider ${
                                isDarkMode ? "text-slate-600 dark:text-slate-400 group-hover:text-slate-205" : "text-slate-800 dark:text-slate-200 group-hover:text-slate-950 font-bold"
                              }`}>{category} ({layersInCategory.length})</span>
                              {collapsedCategories[category] ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 group-hover:text-slate-600 dark:hover:text-slate-400" />
                              ) : (
                                <ChevronUp className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 group-hover:text-slate-600 dark:hover:text-slate-400" />
                              )}
                            </div>
                            
                            {!collapsedCategories[category] && (
                              <div className="flex flex-col gap-2 pl-0.5 pt-1">
                                {layersInCategory.map((l, idx) => (
                                <div 
                                  key={`${l.id}-${idx}`} 
                                  draggable={layerSearchQuery.length === 0}
                                  onDragStart={(e) => {
                                    if (layerSearchQuery.length > 0) return;
                                    setDraggedLayerId(l.id);
                                    e.dataTransfer.effectAllowed = "move";
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (layerSearchQuery.length === 0) setDragOverLayerId(l.id);
                                  }}
                                  onDragLeave={() => {
                                    setDragOverLayerId(null);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedLayerId(null);
                                    setDragOverLayerId(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    if (draggedLayerId && draggedLayerId !== l.id && onReorderSpatialLayers) {
                                       const oldIdx = spatialLayers.findIndex(x => x.id === draggedLayerId);
                                       const newIdx = spatialLayers.findIndex(x => x.id === l.id);
                                       if (oldIdx !== -1 && newIdx !== -1) {
                                         const newLayers = [...spatialLayers];
                                         const [movedLayer] = newLayers.splice(oldIdx, 1);
                                         newLayers.splice(newIdx, 0, movedLayer);
                                         onReorderSpatialLayers(newLayers);
                                         setLayerSortBy("manual"); 
                                       }
                                    }
                                    setDraggedLayerId(null);
                                    setDragOverLayerId(null);
                                  }}
                                  className={`flex flex-col gap-2 p-2 rounded-lg border transition-all ${layerSearchQuery.length === 0 ? 'cursor-grab active:cursor-grabbing' : ''} ${
                                    dragOverLayerId === l.id 
                                      ? "border-emerald-500 bg-emerald-500/10" 
                                      : l.isActive 
                                        ? isDarkMode 
                                          ? "bg-slate-900/80 border-slate-750 text-white shadow-sm" 
                                          : "bg-slate-50/60 border-slate-250 text-slate-900 shadow-xs"
                                        : "bg-transparent border-transparent text-slate-600 dark:text-slate-400 opacity-60"
                                  }`}
                                >
                                  {/* Top Row: Color swatch + Layer metadata + Info + Hide/Show action buttons */}
                                  <div className="flex items-center justify-between gap-2.5 min-w-0 pointer-events-auto">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      {layerSearchQuery.length === 0 && (
                                        <div 
                                          className="text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing p-0.5 shrink-0 flex items-center justify-center"
                                          title="Tarik untuk mengurutkan layer spasial"
                                        >
                                          <GripVertical className="h-3 w-3" />
                                        </div>
                                      )}
                                      <input
                                        type="color"
                                        value={l.color || "#3b82f6"}
                                        disabled={!l.isActive}
                                        onChange={(e) => onChangeLayerColor?.(l.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`h-6 w-6 rounded-md border bg-transparent p-0.5 cursor-pointer shrink-0 transition-transform active:scale-95 hover:border-emerald-500 focus:outline-none ${
                                          isDarkMode ? "border-white/20 bg-slate-950" : "border-slate-300 bg-white"
                                        } ${!l.isActive ? "opacity-35 pointer-events-none" : ""}`}
                                        title="Ubah Warna Layer"
                                      />
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className={`text-[11px] whitespace-normal break-words leading-tight font-bold ${
                                            l.isActive 
                                              ? isDarkMode ? "text-slate-100" : "text-slate-900 font-black" 
                                              : "text-slate-600 dark:text-slate-400 line-through"
                                          }`} title={l.name}>
                                            <AutoTranslatedText text={l.name} inline />
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedMetadataLayer(l);
                                              setActiveTab("attributes"); 
                                            }}
                                            className={`p-1 rounded-md transition-all cursor-pointer inline-flex items-center justify-center shrink-0 focus:outline-none ${
                                              isDarkMode ? "hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-blue-400" : "hover:bg-slate-200 text-slate-600 dark:text-slate-400 hover:text-blue-600"
                                            }`}
                                            title="Atribut spasial & Detail layer"
                                          >
                                            <Info className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                        <span className={`text-[8.5px] uppercase font-mono tracking-wide leading-none mt-1 font-extrabold ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                                          {l.category}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => onToggleLayerVis?.(l.id)}
                                        disabled={l.isLoading}
                                        className={`p-1.5 rounded-md transition-all cursor-pointer shrink-0 ${
                                          isDarkMode ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-200 text-slate-800 dark:text-slate-200 shadow-xs"
                                        } ${
                                          l.isActive 
                                            ? isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600" 
                                            : "text-slate-450"
                                        } ${l.isLoading ? "opacity-75 cursor-wait" : ""}`}
                                        title={l.isLoading ? "Memuat data spasial..." : (l.isActive ? "Sembunyikan layer" : "Tampilkan layer")}
                                      >
                                        {l.isLoading ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                        ) : l.isActive ? (
                                          <Eye className="h-4 w-4" />
                                        ) : (
                                          <EyeOff className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Bottom Row: Opacity Slider (Only shown when layer is visible) */}
                                  {l.isActive && (
                                    <div className={`flex flex-col gap-1.5 border-t pt-2 mt-1.5 p-2 rounded-xl border ${
                                      isDarkMode 
                                        ? "border-slate-800 bg-slate-950/80 text-slate-100" 
                                        : "border-slate-300 bg-slate-100/90 text-slate-900 shadow-2xs"
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                          <Sliders size={11} className={isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"} />
                                          <span className={`text-[9px] font-black uppercase tracking-wider ${
                                            isDarkMode ? "text-slate-200" : "text-slate-900"
                                          }`}>
                                            Opasitas:
                                          </span>
                                        </div>
                                        <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                                          isDarkMode 
                                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30" 
                                            : "bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold"
                                        }`}>
                                          {Math.round((l.opacity !== undefined ? l.opacity : 1.0) * 100)}%
                                        </span>
                                      </div>

                                      <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={l.opacity !== undefined ? l.opacity : 1.0}
                                        onChange={(e) => onChangeLayerOpacity?.(l.id, parseFloat(e.target.value))}
                                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none ${
                                          isDarkMode ? "bg-slate-800" : "bg-slate-250"
                                        }`}
                                      />

                                      {/* Preset Buttons */}
                                      <div className="grid grid-cols-4 gap-1 pt-0.5">
                                        {[0.25, 0.5, 0.75, 1.0].map((preset) => {
                                          const currentOpacity = l.opacity !== undefined ? l.opacity : 1.0;
                                          const isSelected = Math.abs(currentOpacity - preset) < 0.05;
                                          return (
                                            <button
                                              key={preset}
                                              type="button"
                                              onClick={() => onChangeLayerOpacity?.(l.id, preset)}
                                              className={`py-0.5 text-[8.5px] font-mono font-black rounded transition-all active:scale-95 cursor-pointer text-center ${
                                                isSelected
                                                  ? "bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400/50"
                                                  : isDarkMode
                                                  ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80"
                                                  : "bg-white hover:bg-slate-200 text-slate-900 border border-slate-300 shadow-2xs font-extrabold"
                                              }`}
                                            >
                                              {preset * 100}%
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Section 5: Standard Infrastructure Icons */}
                <div className="flex flex-col gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5 ${
                    isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-655"
                  }`}>
                    <Compass className="h-4 w-4 text-emerald-500" />
                    Hub / Simpul Infrastruktur
                  </span>
                  <div className={`p-3.5 rounded-xl border grid grid-cols-2 gap-2.5 text-[11px] font-mono ${
                    isDarkMode ? "bg-slate-950/60 border-slate-800/80 text-slate-300" : "bg-slate-50 border-slate-205 text-slate-800 dark:text-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 shadow-xs border border-white/5 dark:bg-slate-950/40">
                      <span className="h-6 w-6 rounded-md bg-blue-700 flex items-center justify-center text-xs text-white shrink-0 shadow-sm">⚓</span>
                      <span className={`text-[10px] sm:text-[11px] leading-tight font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-800 font-bold"}`}>Pelabuhan Laut</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 shadow-xs border border-white/5 dark:bg-slate-950/40">
                      <span className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs text-white shrink-0 shadow-sm">✈️</span>
                      <span className={`text-[10px] sm:text-[11px] leading-tight font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-800 font-bold"}`}>Bandara Udara</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 shadow-xs border border-white/5 dark:bg-slate-950/40">
                      <span className="h-6 w-6 rounded-md bg-zinc-800 flex items-center justify-center text-xs text-white shrink-0 shadow-sm font-semibold">🛣️</span>
                      <span className={`text-[10px] sm:text-[11px] leading-tight font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-800 font-bold"}`}>Jalan Nasional</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 shadow-xs border border-white/5 dark:bg-slate-950/40">
                      <span className="h-6 w-6 rounded-md bg-yellow-600 flex items-center justify-center text-xs text-white shrink-0 shadow-sm">⚡</span>
                      <span className={`text-[10px] sm:text-[11px] leading-tight font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-800 font-bold"}`}>Pembangkit Listrik</span>
                    </div>
                  </div>
                </div>

                {/* Footer instruction tips */}
                <div className={`flex items-center gap-2 text-[10px] p-2.5 rounded-xl border font-mono leading-relaxed text-center justify-center ${
                  isDarkMode ? "text-slate-350 bg-slate-950 border-slate-800" : "text-slate-800 dark:text-slate-200 bg-slate-100 border-slate-200 shadow-xs"
                }`}>
                  <HelpCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="font-semibold">Klik pada wilayah kecamatan, batas desa, atau pin sektoral untuk detail informasi spasial.</span>
                </div>
              </>
            ) : (
              <>
                {/* Legenda Aktif (Dinamis) Tab */}
                {(() => {
                  const activeCustomLayers = spatialLayers.filter(l => l.isActive);
                  const isChoroplethActive = choroplethMetric !== "none";
                  const isHeatmapActive = heatmapMetric !== "none";
                  const hasAnySectors = activeCategories && activeCategories.length > 0;
                  
                  const isAnyLayerActive = isChoroplethActive || isHeatmapActive || hasAnySectors || activeCustomLayers.length > 0;

                  if (!isAnyLayerActive) {
                    return (
                      <div className="flex flex-col items-center justify-center py-10 text-center px-4 animate-in fade-in duration-200">
                        <div className={`p-3.5 rounded-full mb-3 border ${
                          isDarkMode 
                            ? "bg-slate-950/40 border-slate-800 text-slate-600 dark:text-slate-400" 
                            : "bg-slate-50 border-slate-200 text-slate-600 dark:text-slate-400 shadow-inner"
                        }`}>
                          <Layers className="h-6 w-6 shrink-0" />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
                          Belum Ada Layer Aktif
                        </span>
                        <p className={`text-xs leading-relaxed font-sans font-semibold mt-1.5 max-w-[220px] mx-auto ${
                          isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"
                        }`}>
                          Silakan masuk ke tab <strong className="text-emerald-500 dark:text-emerald-400 font-extrabold uppercase">"Kelola Layer"</strong> untuk mengaktifkan layer spasial pada peta.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                      <div className={`text-xs font-mono font-bold leading-none tracking-wide pb-1 border-b flex items-center justify-between ${
                        isDarkMode ? "text-slate-200 border-white/10" : "text-slate-800 border-slate-300"
                      }`}>
                        <span>REPRESENTASI DATA AKTIF</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded ${isDarkMode ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" : "text-indigo-700 bg-indigo-50"}`}>
                          {activeCustomLayers.length + (isChoroplethActive ? 1 : 0) + (isHeatmapActive ? 1 : 0) + (hasAnySectors ? 1 : 0)} KOMPONEN
                        </span>
                      </div>

                      {/* 1. Tematik Choropleth */}
                      {isChoroplethActive && (
                        <div className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
                          isDarkMode ? "bg-slate-950/60 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
                        }`}>
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-12 h-10 shrink-0 rounded-lg overflow-hidden border flex flex-col shadow-inner" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)" }}>
                              <div className="flex-1" style={{
                                background: choroplethMetric === "value" 
                                  ? "linear-gradient(to right, #bfdbfe, #60a5fa, #3b82f6, #1e3a8a)"
                                  : choroplethMetric === "density"
                                    ? "linear-gradient(to right, #ffe4e6, #fda4af, #f43f5e, #9f1239)"
                                    : "linear-gradient(to right, #dcfce7, #86efac, #22c55e, #14532d)"
                              }} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-[11px] font-black uppercase tracking-wider leading-tight truncate ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
                                Klasifikasi Choropleth
                              </span>
                              <span className="text-[9px] font-mono text-indigo-700 dark:text-indigo-400 font-extrabold uppercase mt-0.5">
                                Kategori: {
                                  choroplethMetric === "value" ? "Nilai Investasi" :
                                  choroplethMetric === "density" ? "Kepadatan Penduduk" :
                                  "Skor Infrastruktur"
                                }
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 font-mono text-[10px] mt-1 pl-1">
                            {(() => {
                              const categories = {
                                value: [
                                  { color: "#1e3a8a", label: "Sangat Tinggi (> Rp 500 Miliar)" },
                                  { color: "#3b82f6", label: "Tinggi (Rp 300M - Rp 500M)" },
                                  { color: "#60a5fa", label: "Sedang (Rp 150M - Rp 300M)" },
                                  { color: "#bfdbfe", label: "Rendah (≤ Rp 150 Miliar)" },
                                ],
                                density: [
                                  { color: "#9f1239", label: "Sangat Padat (> 500 Jiwa/km²)" },
                                  { color: "#f43f5e", label: "Padat (200 - 500 Jiwa/km²)" },
                                  { color: "#fda4af", label: "Sedang (100 - 200 Jiwa/km²)" },
                                  { color: "#ffe4e6", label: "Rendah (≤ 100 Jiwa/km²)" },
                                ],
                                infrastructure: [
                                  { color: "#14532d", label: "Sangat Baik (Skor ≥ 8 / 10)" },
                                  { color: "#22c55e", label: "Kondisi Baik (Skor 6 - 7 / 10)" },
                                  { color: "#86efac", label: "Cukup Kondusif (Skor 4 - 5 / 10)" },
                                  { color: "#dcfce7", label: "Perlu Peningkatan (Skor < 4)" },
                                ]
                              };
                              const items = categories[choroplethMetric as keyof typeof categories] || [];
                              return items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="h-3.5 w-4.5 rounded-sm shrink-0 border" style={{ backgroundColor: item.color, borderColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                                  <span className={isDarkMode ? "text-slate-300 font-medium" : "text-slate-800 dark:text-slate-200 font-semibold"}>{item.label}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* 2. Heatmap Overlay */}
                      {isHeatmapActive && (
                        <div className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                          isDarkMode ? "bg-slate-950/60 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
                        }`}>
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-12 h-10 shrink-0 rounded-lg overflow-hidden border bg-gradient-to-r from-transparent via-orange-500 to-red-600 shadow-inner" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)" }} />
                            <div className="flex flex-col min-w-0">
                              <span className={`text-[11px] font-black uppercase tracking-wider leading-tight truncate ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
                                Heatmap Densitas
                              </span>
                              <span className="text-[9px] font-mono text-amber-700 dark:text-amber-400 font-extrabold uppercase mt-0.5">
                                Kepadatan: {
                                  heatmapMetric === "value" ? "Nilai Investasi" :
                                  heatmapMetric === "density" ? "Penduduk" :
                                  heatmapMetric === "road_density" ? "Jaringan Jalan" :
                                  "Rencana Proyek"
                                }
                              </span>
                            </div>
                          </div>
                          <p className={`text-[10px] leading-relaxed font-mono ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>
                            Mengukur konsentrasi sebaran spasial regional secara dinamis dengan visualisasi gradasi radiasi spektrum warna.
                          </p>
                        </div>
                      )}

                      {/* 3. Sector Markers */}
                      {hasAnySectors && (
                        <div className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
                          isDarkMode ? "bg-slate-950/60 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
                        }`}>
                          <span className={`text-[10px] font-black uppercase tracking-widest font-mono text-emerald-450`}>
                            Sektor Investasi Aktif ({activeCategories.length})
                          </span>
                          
                          <div className="flex flex-col gap-2 mt-1">
                            {[
                              { key: SektorInvestasi.PERTANIAN, name: t("mapControls.sectorAgriculture", "Sektor Pertanian"), color: "bg-green-600", desc: t("mapControls.sectorDescAgriculture", "Sentra perkebunan, hortikultura, dan pertanian pangan Luwu.") },
                              { key: SektorInvestasi.KELAUTAN, name: t("mapControls.marineFisheries", "Sektor Kelautan dan Perikanan"), color: "bg-cyan-500", desc: t("mapControls.sectorDescMarine", "Kawasan budidaya pesisir, rumput laut, dan perikanan tangkap.") },
                              { key: SektorInvestasi.PERTAMBANGAN, name: t("mapControls.mining", "Sektor Pertambangan"), color: "bg-amber-600", desc: t("mapControls.sectorDescMining", "Kandungan mineral bumi, batuan, dan komoditas tambang pegunungan.") },
                              { key: SektorInvestasi.PARIWISATA, name: t("mapControls.tourism", "Sektor Pariwisata"), color: "bg-rose-500", desc: t("mapControls.sectorDescTourism", "Destinasi wisata alam pegunungan Latimojong dan pesisir pantai.") },
                              { key: SektorInvestasi.PERDAGANGAN, name: t("mapControls.industry", "Sektor Perindustrian & Dagang"), color: "bg-indigo-600", desc: t("mapControls.sectorDescIndustry", "Pusat aktivitas perdagangan, pabrik pengolahan, dan jasa umum.") }
                            ].filter(sec => activeCategories.includes(sec.key)).map((sec) => {
                              const visibleCount = getVisibleSectorCount(sec.key);
                              return (
                                <div key={sec.key} className={`flex items-start gap-2.5 p-2 rounded-lg border ${
                                  isDarkMode ? "bg-slate-900/60 border-slate-800/40" : "bg-slate-50 border-slate-200"
                                }`}>
                                  <span className={`h-3 w-3 rounded-full mt-1 ${sec.color} border-2 border-white/50 shrink-0 relative flex items-center justify-center`}>
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-inherit animate-ping opacity-60" />
                                  </span>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className={`text-[11px] font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                                      {sec.name} <span className="text-[9px] font-mono text-emerald-500">({visibleCount} {t("mapControls.points", "Titik")})</span>
                                    </span>
                                    <p className={`text-[10px] leading-tight font-mono mt-0.5 ${isDarkMode ? "text-slate-450" : "text-slate-605"}`}>
                                      {sec.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. Active Custom/GIS layers */}
                      {activeCustomLayers.map((l) => {
                        const details = getLayerDetails(l);
                        return (
                          <div key={l.id} className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
                            isDarkMode ? "bg-slate-950/60 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
                          }`}>
                            <div className="flex items-start gap-3 min-w-0">
                              {/* Custom symbol representations based on actual layer style and geometry */}
                              <div className="w-12 h-10 shrink-0 rounded-lg border flex items-center justify-center bg-slate-900/40 border-slate-800/80 shadow-inner">
                                {details.geomType.includes("Polygon") ? (
                                  <div className="w-7 h-5 rounded border-2 shadow-xs" style={{ 
                                    backgroundColor: l.color, 
                                    borderColor: l.color,
                                    opacity: typeof l.opacity === 'number' && !isNaN(l.opacity) ? l.opacity : 1.0,
                                    background: `rgba(${parseInt(l.color.slice(1,3), 16) || 59}, ${parseInt(l.color.slice(3,5), 16) || 130}, ${parseInt(l.color.slice(5,7), 16) || 246}, 0.3)`
                                  }} />
                                ) : details.geomType.includes("Line") || details.geomType.includes("Route") ? (
                                  <div className="w-8 h-1 rounded-full shadow-xs" style={{ 
                                    backgroundColor: l.color, 
                                    opacity: typeof l.opacity === 'number' && !isNaN(l.opacity) ? l.opacity : 1.0,
                                    boxShadow: `0 0 4px ${l.color}`
                                  }} />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/80 shadow-xs relative flex items-center justify-center" style={{ 
                                    backgroundColor: l.color, 
                                    opacity: typeof l.opacity === 'number' && !isNaN(l.opacity) ? l.opacity : 1.0
                                  }}>
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-inherit animate-ping opacity-30" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className={`text-[11px] font-black leading-snug truncate ${isDarkMode ? "text-slate-100" : "text-slate-900"}`} title={l.name}>
                                  <AutoTranslatedText text={l.name} inline />
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[8.5px] font-mono leading-none">
                                  <span className={`px-1.5 py-0.5 rounded uppercase font-black tracking-wider ${
                                    isDarkMode ? "bg-slate-900 text-slate-600 dark:text-slate-400 border border-white/5" : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}>
                                    {details.geomType}
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-400 font-semibold">
                                    Transparansi: {Math.round((l.opacity !== undefined ? l.opacity : 1.0) * 100)}%
                                  </span>
                                  {details.featureCount > 0 && (
                                    <span className="text-emerald-500 font-bold">
                                      • {details.featureCount} Fitur
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className={`text-[10.5px] leading-relaxed font-mono ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-605"}`}>
                              <AutoTranslatedText text={details.description} />
                            </div>
                          </div>
                        );
                      })}

                      {/* Dynamic instruction tips for active components */}
                      <div className={`flex items-center gap-2 text-[10px] p-2.5 rounded-xl border font-mono leading-relaxed text-center justify-center ${
                        isDarkMode ? "text-slate-350 bg-slate-950 border-slate-800" : "text-slate-705 bg-slate-100 border-slate-200 shadow-xs"
                      }`}>
                        <HelpCircle className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold">{t('mapControls.componentsTip', 'Simbol legenda di atas mewakili komponen spasial yang sedang digambar pada peta saat ini.')}</span>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Detail Metadata Modal */}
    {selectedMetadataLayer && (() => {
      const layer = selectedMetadataLayer;
      
      let featureCount = 0;
      if (layer.geojson?.type === "FeatureCollection") {
        featureCount = layer.geojson.features?.length || 0;
      } else if (layer.geojson?.type === "Feature") {
        featureCount = 1;
      } else if (layer.geojson) {
        featureCount = 1;
      }

      const geometryTypes = new Set<string>();
      const geomTypeDistribution: Record<string, number> = {};

      if (layer.geojson?.type === "FeatureCollection") {
        layer.geojson.features?.forEach((f: any) => {
          if (f?.geometry?.type) {
            geometryTypes.add(f.geometry.type);
            geomTypeDistribution[f.geometry.type] = (geomTypeDistribution[f.geometry.type] || 0) + 1;
          }
        });
      } else if (layer.geojson?.geometry?.type) {
        geometryTypes.add(layer.geojson.geometry.type);
        geomTypeDistribution[layer.geojson.geometry.type] = 1;
      } else if (layer.geojson?.type) {
        geometryTypes.add(layer.geojson.type);
        if (layer.geojson.type !== "FeatureCollection" && layer.geojson.type !== "Feature") {
           geomTypeDistribution[layer.geojson.type] = 1;
        }
      }
      const geoTypesString = Array.from(geometryTypes).join(", ") || "Unknown/Custom";
      const chartData = Object.entries(geomTypeDistribution).map(([name, count]) => ({ name, count }));


      let availableProperties: string[] = [];
      let firstFeatureProps: Record<string, any> = {};
      if (layer.geojson?.type === "FeatureCollection" && layer.geojson.features?.[0]?.properties) {
        firstFeatureProps = layer.geojson.features[0].properties;
        availableProperties = Object.keys(firstFeatureProps);
      } else if (layer.geojson?.properties) {
        firstFeatureProps = layer.geojson.properties;
        availableProperties = Object.keys(firstFeatureProps);
      }

      let totalAreaHa = 0;
      let totalLengthKm = 0;
      let densityFeaturesPerHa = 0;

      if (layer.geojson) {
        try {
          const rawAreaSqm = turf.area(layer.geojson as any);
          totalAreaHa = Number((rawAreaSqm / 10000).toFixed(2));
          totalLengthKm = turf.length(layer.geojson as any, { units: 'kilometers' });
          if (totalAreaHa > 0) {
            densityFeaturesPerHa = featureCount / totalAreaHa;
          }
        } catch (e) {
          console.error("Turf calculate error", e);
        }
      }

      return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-lg md:max-w-xl overflow-hidden flex flex-col max-h-[90vh] border ${
            isDarkMode 
              ? "bg-slate-900 border-slate-700/80 text-white" 
              : "bg-white border-slate-200 text-slate-800"
          }`}>
            {/* Modal Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDarkMode ? "bg-slate-950/90 border-slate-700/70" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-2.5">
                <FileJson className="h-5 w-5 text-emerald-500" />
                <div className="flex flex-col">
                  <h3 className={`text-sm font-bold font-display uppercase tracking-wider ${
                    isDarkMode ? "text-slate-100" : "text-slate-900"
                  }`}>
                    Metadata Spasial Layer
                  </h3>
                  <p className={`text-[10px] font-mono ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                    ID: {layer.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMetadataLayer(null);
                  setActiveTab("attributes");
                }}
                className={`p-1.5 rounded-lg transition-colors text-[10px] font-bold px-3 cursor-pointer ${
                  isDarkMode 
                    ? "text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700" 
                    : "text-slate-800 dark:text-slate-200 hover:text-slate-950 bg-slate-200 hover:bg-slate-300"
                }`}
              >
                Tutup [×]
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5 custom-scrollbar text-xs">
              {/* Layer Name Banner */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                isDarkMode ? "bg-slate-950/40 border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex flex-col">
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{t('mapLegend.layerName', 'Nama Layer')}</span>
                  <span className={`text-sm font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}><AutoTranslatedText text={layer.name} inline /></span>
                </div>
                <span 
                  className={`text-xs font-mono px-2 py-1 rounded border uppercase ${
                    isDarkMode 
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold" 
                      : "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold"
                  }`}
                >
                  <AutoTranslatedText text={layer.category} inline />
                </span>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border flex flex-col gap-1.5 font-mono ${
                  isDarkMode ? "bg-slate-950/25 border-white/10" : "bg-slate-50/50 border-slate-300"
                }`}>
                  <span className={`text-xs uppercase font-extrabold text-left ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{t('mapLegend.fileInfo', 'Informasi File')}</span>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>{t('mapLegend.uploadDate', 'Tgl Unggah:')}</span>
                    <span className={`font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                      {layer.uploadedAt ? new Date(layer.uploadedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>{t('mapLegend.totalFeatures', 'Total Fitur:')}</span>
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      isDarkMode ? "text-slate-100 bg-white/10" : "text-slate-900 bg-slate-100 border border-slate-300"
                    }`}>
                      {featureCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>{t('mapLegend.mapStatus', 'Status Peta:')}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                      layer.isActive 
                        ? isDarkMode ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold" 
                        : "bg-slate-800 text-slate-300"
                    }`}>
                      {layer.isActive ? t('mapLegend.displayed', 'Ditampilkan') : t('mapLegend.hidden', 'Disembunyikan')}
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border flex flex-col gap-1.5 font-mono ${
                  isDarkMode ? "bg-slate-950/20 border-white/10" : "bg-slate-50/50 border-slate-300"
                }`}>
                  <span className={`text-xs uppercase font-extrabold text-left ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{t('mapLegend.visualStyle', 'Gaya Visual')}</span>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>{t('mapLegend.strokeColor', 'Warna Garis:')}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full border border-white/25" style={{ backgroundColor: layer.color }}></span>
                      <span className={`font-mono font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{layer.color}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>{t('mapLegend.strokeWidth', 'Lebar Garis:')}</span>
                    <span className={`font-mono font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{layer.lineWidth || 2} px</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>{t('mapLegend.opacity', 'Opasitas:')}</span>
                    <span className={`font-mono font-black ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
                      {Math.round((layer.opacity !== undefined ? layer.opacity : 1.0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Geometry Info */}
              <div className={`p-3 rounded-lg border flex flex-col gap-1.5 shadow-inner ${
                isDarkMode ? "bg-slate-950/20 border-emerald-500/10" : "bg-emerald-50/15 border-emerald-300"
              }`}>
                <span className={`text-[9px] uppercase font-mono font-bold border-b pb-1 mb-1 ${
                  isDarkMode ? "text-slate-600 dark:text-slate-400 border-emerald-500/10" : "text-emerald-800 border-emerald-300/40"
                }`}>{t('mapLegend.spatialStats', 'Statistik & Analisis Spasial (Turf.js)')}</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className={isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-606 font-medium"}>{t('mapLegend.totalArea', 'Total Luasan:')}</span>
                      <span className={`font-mono font-bold ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-700"}`}>{totalAreaHa.toFixed(2)} Ha</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 font-medium"}>{t('mapLegend.totalLength', 'Total Panjang/Keliling:')}</span>
                      <span className={`font-mono font-bold ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-700"}`}>{totalLengthKm.toFixed(2)} KM</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className={isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 font-medium"}>{t('mapLegend.featureDensity', 'Kepadatan (Feature/Ha):')}</span>
                      <span className={`font-mono font-bold ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-700"}`}>{densityFeaturesPerHa.toLocaleString("id-ID", {maximumFractionDigits: 4})}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 font-medium"}>{t('mapLegend.majorGeometry', 'Geometri Mayor:')}</span>
                      <span className={`font-mono font-bold text-[10px] truncate max-w-[100px] text-right ${isDarkMode ? "text-emerald-405" : "text-emerald-705"}`} title={geoTypesString}>{geoTypesString}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Inspection Tabs */}
              <div className="flex flex-col gap-2 flex-1">
                <div className={`flex border-b gap-1.5 ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("attributes")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-t-md transition-colors cursor-pointer ${
                      activeTab === "attributes" 
                        ? isDarkMode 
                          ? "bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-500 border-b-2" 
                          : "bg-slate-100 text-emerald-700 border-emerald-600 border-b-2 font-bold" 
                        : isDarkMode ? "text-slate-600 dark:text-slate-400 hover:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {t('mapLegend.attributeSchema', 'Skema Atribut')} ({availableProperties.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("raw")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-t-md transition-colors cursor-pointer ${
                      activeTab === "raw" 
                        ? isDarkMode 
                          ? "bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-500 border-b-2" 
                          : "bg-slate-100 text-emerald-700 border-emerald-600 border-b-2 font-bold" 
                        : isDarkMode ? "text-slate-600 dark:text-slate-400 hover:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Raw JSON Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("chart")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-t-md transition-colors cursor-pointer ${
                      activeTab === "chart" 
                        ? isDarkMode 
                          ? "bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-500 border-b-2" 
                          : "bg-slate-100 text-emerald-700 border-emerald-600 border-b-2 font-bold" 
                        : isDarkMode ? "text-slate-600 dark:text-slate-400 hover:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {t('mapLegend.featureDistribution', 'Sebaran Fitur')}
                  </button>
                </div>

                <div className={`p-3 rounded-lg border min-h-[140px] max-h-[220px] overflow-y-auto custom-scrollbar flex-1 ${
                  isDarkMode ? "bg-slate-950 border-white/5 text-slate-205" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}>
                  {activeTab === "attributes" ? (
                    <div className="flex flex-col gap-2.5">
                      <p className={`text-[10px] ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-505 font-medium"}`}>
                        {t('mapLegend.attributeIntro', 'Berikut adalah daftar properti dari fitur pertama di GeoJSON ini (digunakan dalam filter GIS):')}
                      </p>
                      {availableProperties.length === 0 ? (
                        <div className="italic text-center py-4 text-slate-600 dark:text-slate-400">{t('mapLegend.noAttributes', 'Tidak ada atribut data (properties kosong)')}</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-1.5">
                          {Object.entries(firstFeatureProps).map(([key, val]) => (
                            <div key={key} className={`flex items-start justify-between py-1 border-b font-mono text-[10.5px] ${
                              isDarkMode ? "border-white/5" : "border-slate-200"
                            }`}>
                              <span className={`font-semibold truncate max-w-[150px] ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`} title={key}>{key}</span>
                              <span className={`truncate max-w-[250px] ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 font-medium"}`} title={typeof val === "object" ? JSON.stringify(val) : String(val)}>
                                {typeof val === "object" ? JSON.stringify(val) : String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : activeTab === "chart" ? (
                    <div className="w-full flex flex-col gap-2 h-full min-h-[160px]">
                      <p className={`text-[10px] ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400 font-medium"}`}>Distribusi tipe fitur geometri dalam layer spasial ini:</p>
                      {chartData.length === 0 ? (
                        <div className="italic text-center py-4 flex-1 flex items-center justify-center text-slate-600 dark:text-slate-400">Data chart tidak tersedia</div>
                      ) : (
                        <div className="flex-1 h-[120px] min-h-[120px] w-full mt-2">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip cursor={{fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}} contentStyle={{backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#cbd5e1', fontSize: '11px', borderRadius: '6px', color: isDarkMode ? '#f8fafc' : '#1e293b' }} itemStyle={{ color: isDarkMode ? '#34d399' : '#059669', fontWeight: 'bold' }} />
                              <Bar dataKey="count" name="Jumlah Fitur" fill={isDarkMode ? "#34d399" : "#059669"} radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-full flex flex-col">
                      <div className={`text-[10px] mb-1 flex justify-between items-center selection:bg-transparent ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-550 font-bold"}`}>
                        <span>subset GeoJSON (fitur pertama) untuk kinerja optimal</span>
                        <button
                          type="button"
                          onClick={() => handleCopyGeoJSON(layer)}
                          className={`font-mono text-[9px] px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                            isDarkMode 
                              ? "bg-slate-800 hover:bg-slate-700 text-white" 
                              : "bg-slate-205 hover:bg-slate-300 text-slate-800 border border-slate-300 shadow-sm"
                          }`}
                        >
                          {copiedLayerId === layer.id ? (
                            <>
                              <Check className="h-2.5 w-2.5 text-emerald-700 dark:text-emerald-400" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-2.5 w-2.5" />
                              <span>Salin Semua</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className={`text-[9.5px] font-mono p-2 rounded border overflow-x-auto whitespace-pre overflow-y-auto custom-scrollbar h-[150px] ${
                        isDarkMode ? "text-slate-300 bg-slate-950 border-white/5" : "text-slate-800 bg-white border-slate-200 shadow-inner"
                      }`}>
                        {JSON.stringify(
                          { 
                            type: layer.geojson?.type, 
                            featuresCount: featureCount, 
                            featuresSubset: layer.geojson?.features ? layer.geojson.features.slice(0, 1) : layer.geojson 
                          }, 
                          null, 
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`px-5 py-3.5 border-t flex items-center justify-end gap-2 text-xs ${
              isDarkMode ? "bg-slate-950/80 border-slate-800/80" : "bg-slate-50 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => {
                  setSelectedMetadataLayer(null);
                  setActiveTab("attributes");
                }}
                className={`px-4 py-2 rounded font-semibold transition-all shadow hover:shadow-md cursor-pointer ${
                  isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                }`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      );
    })()}
  </>
  );
}

// ui polish: resolve recharts 0x0 dimension warnings
