import React, { useState, useMemo } from "react";
import { useControl } from "react-map-gl/maplibre";
import { createPortal } from "react-dom";
import { IControl, Map as MaplibreMap } from "maplibre-gl";
import { GeoJSONLayer, District, Village } from "../types";
import { 
  Layers, CheckSquare, Square, Loader2, ChevronDown, ChevronUp, 
  ChevronRight, ChevronLeft, Sliders, Palette, Maximize2, Info, Eye, ExternalLink,
  MapPin, Compass, Globe, Filter, Scissors, RefreshCw, Sparkles, Moon, Sun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { SpatialSymbologyModal, MASTER_SYMBOLOGY_DEFINITIONS } from "./SpatialSymbologyModal";
import { useSpatialThemeTokens } from "../hooks/useSpatialThemeTokens";

interface LayerLegendControlProps {
  spatialLayers: GeoJSONLayer[];
  onToggleLayerVis: (layerId: string) => void;
  onChangeLayerOpacity?: (layerId: string, opacity: number) => void;
  onOpenSuitabilityModal?: () => void;
  isDarkMode: boolean;
  districts?: District[];
  villages?: Village[];
  selectedDistrictId?: string | null;
  setSelectedDistrictId?: (id: string | null) => void;
  selectedVillageId?: string | null;
  setSelectedVillageId?: (id: string | null) => void;
  mapMode?: string;
  setMapMode?: (mode: any) => void;
  isLayerPanelOpen?: boolean;
  setIsLayerPanelOpen?: (open: boolean) => void;
  isLeftSidebarOpen?: boolean;
}

export default function LayerLegendControl({ 
  spatialLayers, 
  onToggleLayerVis, 
  onChangeLayerOpacity, 
  onOpenSuitabilityModal, 
  isDarkMode,
  districts = [],
  villages = [],
  selectedDistrictId,
  setSelectedDistrictId,
  selectedVillageId,
  setSelectedVillageId,
  mapMode = "satellite",
  setMapMode,
  isLayerPanelOpen: parentIsLayerPanelOpen,
  setIsLayerPanelOpen: parentSetIsLayerPanelOpen,
  isLeftSidebarOpen = false
}: LayerLegendControlProps) {
  const { t } = useTranslation();
  const [controlContainer, setControlContainer] = useState<HTMLDivElement | null>(null);
  const [localIsLayerPanelOpen, setLocalIsLayerPanelOpen] = useState(false);
  const { isDark, text, border, bg } = useSpatialThemeTokens(isDarkMode);
  
  const isLayerPanelOpen = parentIsLayerPanelOpen !== undefined ? parentIsLayerPanelOpen : localIsLayerPanelOpen;
  const setIsLayerPanelOpen = parentSetIsLayerPanelOpen !== undefined ? parentSetIsLayerPanelOpen : setLocalIsLayerPanelOpen;

  const [activeTab, setActiveTab] = useState<"layers" | "symbology">("layers");
  const [isSymbologyModalOpen, setIsSymbologyModalOpen] = useState(false);

  // Auto-switch to "layers" tab when opened via top navbar "Layer Tematik" button
  React.useEffect(() => {
    if (parentIsLayerPanelOpen) {
      setActiveTab("layers");
    }
  }, [parentIsLayerPanelOpen]);

  useControl<any>(() => {
    class CustomLayerControl implements IControl {
      private _container?: HTMLDivElement;
      
      onAdd(map: MaplibreMap) {
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl';
        const el = this._container;
        setTimeout(() => setControlContainer(el), 0);
        return this._container;
      }
      
      onRemove() {
        if (this._container?.parentNode) {
          this._container.parentNode.removeChild(this._container);
        }
        setTimeout(() => setControlContainer(null), 0);
      }
    }
    return new CustomLayerControl();
  }, { position: 'top-left' });

  // Compute set of active layer IDs
  const activeLayerIdSet = useMemo(() => {
    const s = new Set<string>();
    spatialLayers.forEach(l => {
      if (l.isActive) s.add(l.id);
    });
    // Layer kecamatan and jalan default to active if not explicitly false
    const kec = spatialLayers.find(l => l.id === "layer_kecamatan");
    if (!kec || kec.isActive !== false) s.add("layer_kecamatan");
    const jalan = spatialLayers.find(l => l.id === "layer_jalan");
    if (!jalan || jalan.isActive !== false) s.add("layer_jalan");
    return s;
  }, [spatialLayers]);

  // Active symbology items based on active layers
  const activeSymbologyItems = useMemo(() => {
    return MASTER_SYMBOLOGY_DEFINITIONS.filter(item => activeLayerIdSet.has(item.layerId));
  }, [activeLayerIdSet]);

  // Available villages for currently selected district
  const availableVillages = useMemo(() => {
    if (!selectedDistrictId) return [];
    return villages.filter(v => v.districtId === selectedDistrictId || String(v.districtId).toLowerCase() === String(selectedDistrictId).toLowerCase());
  }, [villages, selectedDistrictId]);

  // Selected district object
  const selectedDistrictObj = useMemo(() => {
    if (!selectedDistrictId) return null;
    return districts.find(d => d.id === selectedDistrictId || String(d.id).toLowerCase() === String(selectedDistrictId).toLowerCase());
  }, [districts, selectedDistrictId]);

  // Selected village object
  const selectedVillageObj = useMemo(() => {
    if (!selectedVillageId) return null;
    return villages.find(v => v.id === selectedVillageId || String(v.id).toLowerCase() === String(selectedVillageId).toLowerCase());
  }, [villages, selectedVillageId]);

  // Handle District Selection with auto-reset village
  const handleSelectDistrict = (distId: string) => {
    if (!setSelectedDistrictId) return;
    if (!distId) {
      setSelectedDistrictId(null);
      if (setSelectedVillageId) setSelectedVillageId(null);
    } else {
      setSelectedDistrictId(distId);
      if (setSelectedVillageId) setSelectedVillageId(null);
    }
  };

  // Handle Village Selection
  const handleSelectVillage = (vilId: string) => {
    if (!setSelectedVillageId) return;
    setSelectedVillageId(vilId ? vilId : null);
  };

  // Reset entire spatial clipping filter
  const handleResetFilter = () => {
    if (setSelectedDistrictId) setSelectedDistrictId(null);
    if (setSelectedVillageId) setSelectedVillageId(null);
  };

  if (!controlContainer) return null;

  // We allow toggling all 14 critical thematic layers:
  const targetLayers = [
    { id: "layer_jalan", name: t("mapControls.roadNetwork", "Jaringan Jalan Utama"), color: "text-amber-500", bg: "bg-amber-400" },
    { id: "layer_desa", name: t("mapControls.villageBorders", "Batas Desa / Kelurahan"), color: "text-emerald-500", bg: "bg-emerald-500" },
    { id: "layer_kecamatan", name: t("mapControls.subdistrictBorders", "Batas Kecamatan"), color: "text-slate-400", bg: "bg-slate-400" },
    { id: "layer_sawah", name: t("mapControls.layerRicefield", "Pertanian Sawah (LP2B)"), color: "text-green-500", bg: "bg-green-500" },
    { id: "layer_tambak", name: t("mapControls.layerPond", "Perikanan Tambak"), color: "text-sky-500", bg: "bg-sky-500" },
    { id: "layer_mangrove", name: t("mapControls.layerMangrove", "Kawasan Mangrove"), color: "text-teal-500", bg: "bg-teal-500" },
    { id: "layer_lahan_kering_sekunder", name: t("mapControls.layerDrySec", "Lahan Kering Sekunder"), color: "text-amber-500", bg: "bg-amber-500" },
    { id: "layer_lahan_kering_primer", name: t("mapControls.layerDryPrim", "Lahan Kering Primer"), color: "text-amber-700", bg: "bg-amber-700" },
    { id: "layer_zonasi", name: t("map.landUseZoning", "Zonasi RTRW Kab. Luwu"), color: "text-purple-500", bg: "bg-purple-500" },
    { id: "layer_flood_risk", name: t("map.floodRisk", "Peta Risiko Banjir"), color: "text-blue-500", bg: "bg-blue-500" },
    { id: "layer_landslide_risk", name: t("map.landslideRisk", "Peta Risiko Longsor"), color: "text-red-500", bg: "bg-red-500" },
    { id: "layer_historical_suitability", name: t("mapControls.historicalLandSuitability", "Kesesuaian Lahan Komoditas"), color: "text-orange-500", bg: "bg-orange-500" },
    { id: "layer_infrastruktur", name: t("mapControls.infraPoints", "Titik Infrastruktur"), color: "text-rose-500", bg: "bg-rose-500" },
    { id: "layer_potensi", name: t("map.investmentPotential", "Potensi Investasi Daerah"), color: "text-fuchsia-500", bg: "bg-fuchsia-500" },
  ];

  const activeCount = targetLayers.filter(t => {
    const l = spatialLayers.find(layer => layer.id === t.id);
    return l && l.isActive;
  }).length;

  const isFilterActive = Boolean(selectedDistrictId || selectedVillageId);

  const basemapOptions = [
    { id: "satellite", name: "Satelit ESRI", icon: "🛰️", badge: "Citra HD" },
    { id: "light", name: "Light Minimal", icon: "☀️", badge: "Clean" },
    { id: "google_street", name: "Google Maps", icon: "🗺️", badge: "Jalan" },
    { id: "dark", name: "Dark Command", icon: "🌙", badge: "Malam" },
  ];

  return createPortal(
    <div className={`m-2 sm:m-3 ${
      !isLayerPanelOpen 
        ? "mt-[175px] sm:mt-[165px] md:mt-38" 
        : "mt-[175px] sm:mt-[165px] md:mt-24"
    } ${
      isLeftSidebarOpen ? "md:ml-[288px] lg:ml-[352px]" : "md:ml-2 lg:ml-3"
    } transition-[margin] duration-300 ease-in-out z-[55] pointer-events-auto`}>
      <AnimatePresence mode="wait">
        {!isLayerPanelOpen ? (
          /* Collapsed State: Compact horizontal tab/button collapsing to the left */
          <motion.button
            key="collapsed-btn"
            initial={{ opacity: 0, x: -25, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -25, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setIsLayerPanelOpen(true)}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-2xl border transition-all duration-300 hover:scale-105 active:scale-95 group ${
              isDarkMode 
                ? "bg-surface/95 border-slate-700/90 text-white shadow-black/80 backdrop-blur-xl hover:border-indigo-500/80 hover:bg-slate-800" 
                : "bg-white/95 border-slate-300 text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur-xl hover:border-indigo-500 hover:bg-slate-50"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Compass size={17} className={`${isDarkMode ? "text-indigo-400" : "text-indigo-600"} group-hover:rotate-45 transition-transform duration-300`} />
              {isFilterActive && (
                <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 animate-pulse" />
              )}
            </div>

            <div className="flex flex-col items-start text-left">
              <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs uppercase tracking-wider ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                {isFilterActive ? `Fokus: ${selectedDistrictObj?.name || "Wilayah"}` : "Layer Tematik & Peta"}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                {activeCount} Layer Aktif {isFilterActive ? "• Clip Aktif ✂️" : ""}
              </span>
            </div>

            <ChevronRight size={16} className={`transition-transform duration-300 group-hover:translate-x-1 ${
              isDarkMode ? "text-slate-400 group-hover:text-white" : "text-slate-600 group-hover:text-slate-950"
            }`} />
          </motion.button>
        ) : (
          /* Expanded State: Expands out horizontally from the left */
          <motion.div
            key="expanded-panel"
            initial={{ opacity: 0, x: -35, scaleX: 0.85 }}
            animate={{ opacity: 1, x: 0, scaleX: 1 }}
            exit={{ opacity: 0, x: -35, scaleX: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`p-4 rounded-2xl shadow-2xl border origin-left transition-all duration-300 w-84 sm:w-96 max-w-[calc(100vw-2.5rem)] md:max-w-[390px] max-h-[calc(100dvh-210px)] md:max-h-[calc(100vh-130px)] flex flex-col ${
              isDarkMode 
                ? "bg-surface/95 border-slate-700/90 text-white shadow-black/90 backdrop-blur-xl" 
                : "bg-white/95 border-slate-300/90 text-slate-900 shadow-2xl shadow-slate-900/15 backdrop-blur-xl"
            }`}
          >
            {/* Header with Horizontal Collapse Trigger (ChevronLeft) */}
            <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
              isDarkMode ? "border-slate-800" : "border-slate-200"
            }`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Compass size={18} />
                </div>
                <div>
                  <h3 className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs uppercase tracking-wider ${
                    isDarkMode ? "text-white" : "text-slate-950"
                  }`}>
                    Layer Tematik &amp; Simbologi GIS
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-extrabold ${
                      isDarkMode ? "text-indigo-300" : "text-indigo-700"
                    }`}>
                      {activeCount} Layer Aktif
                    </span>
                    {isFilterActive && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/30">
                        Clip Aktif ✂️
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Fullscreen Symbology Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setIsSymbologyModalOpen(true)}
                  title="Buka Panduan Kode Warna & Simbologi Lengkap (Modal)"
                  className={`p-1.5 rounded-xl border text-[10px] font-extrabold transition-all active:scale-95 shadow-sm ${
                    isDarkMode
                      ? "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/40"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                  }`}
                >
                  <Palette size={15} />
                </button>

                {/* Collapse button pointing horizontally LEFT */}
                <button
                  type="button"
                  onClick={() => setIsLayerPanelOpen(false)}
                  title={t("mapControls.hideToLeft", "Sembunyikan")}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-extrabold transition-all active:scale-95 shadow-sm ${
                    isDarkMode 
                      ? "bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 hover:border-indigo-500/50" 
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border border-slate-300/80 hover:border-indigo-400"
                  }`}
                >
                  <ChevronLeft size={16} className="text-indigo-500" />
                </button>
              </div>
            </div>

            {/* 2 Tab Switcher: Layer Tematik | Simbologi & Legenda */}
            <div className={`grid grid-cols-2 gap-1 rounded-xl p-1 mb-3 border ${
              isDarkMode ? "bg-base/70 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab("layers")}
                className={`py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "layers"
                    ? isDarkMode
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers size={13} />
                <span>Layer Tematik ({activeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("symbology")}
                className={`py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "symbology"
                    ? isDarkMode
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Palette size={13} />
                <span>Simbologi &amp; Legenda</span>
              </button>
            </div>

            {/* TAB 1: LAYER TEMATIK & OPASITAS */}
            {activeTab === "layers" && (
              <>
                {/* Quick Interactive Soil Quality & Land Suitability Filter Button */}
                {onOpenSuitabilityModal && (
                  <button
                    type="button"
                    onClick={onOpenSuitabilityModal}
                    className="w-full mb-3 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-mono text-[10px] font-bold transition-all shadow-sm flex items-center justify-between group cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm">🌱</span>
                      <span>Filter Kesesuaian Lahan Komoditas</span>
                    </span>
                    <Sliders className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                )}

                {/* Layer Items List */}
                <div className="overflow-y-auto custom-scrollbar pr-1.5 max-h-[calc(100dvh-320px)] md:max-h-80 space-y-2">
                  {targetLayers.map(target => {
                    const layer = spatialLayers.find(l => l.id === target.id);
                    const isActive = layer ? layer.isActive : false;

                    return (
                      <div
                        key={target.id}
                        className={`flex flex-col gap-1.5 p-2 rounded-xl transition-all border ${
                          isActive
                            ? (isDarkMode 
                                ? "bg-slate-800/80 border-slate-700/90 shadow-sm" 
                                : "bg-slate-50 border-slate-200/90 shadow-sm")
                            : (isDarkMode 
                                ? "border-transparent hover:bg-slate-800/40" 
                                : "border-transparent hover:bg-slate-100/60")
                        } ${!layer ? "opacity-40" : ""}`}
                      >
                        {/* Toggle Trigger Row */}
                        <div
                          onClick={() => layer && onToggleLayerVis(target.id)}
                          className={`flex items-center justify-between group/btn transition-all select-none ${
                            !layer ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-1">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${target.bg} ${
                              isActive 
                                ? "ring-2 ring-indigo-500/50 scale-110" 
                                : "opacity-40"
                            }`} />
                            <span className={`text-[11px] truncate transition-colors ${
                              isDarkMode 
                                ? (isActive ? "text-white font-black" : "text-slate-200 font-bold group-hover/btn:text-white") 
                                : (isActive ? "text-slate-950 font-black" : "text-slate-800 font-bold group-hover/btn:text-slate-950")
                            }`}>
                              {target.name}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center">
                            {layer?.isLoading ? (
                              <Loader2 size={13} className="animate-spin text-indigo-500" />
                            ) : (
                              <div
                                className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 ${
                                  isActive 
                                    ? "bg-indigo-600" 
                                    : (isDarkMode ? "bg-slate-700" : "bg-slate-300")
                                }`}
                              >
                                <motion.div
                                  transition={{ type: "spring", stiffness: 600, damping: 35 }}
                                  className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-md"
                                  animate={{ x: isActive ? 15 : 0 }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Transparansi Slider & Preset Quick Buttons */}
                        {isActive && layer && onChangeLayerOpacity && (
                          <div className={`flex flex-col gap-2 p-2.5 rounded-xl mt-1.5 transition-all border ${
                            isDarkMode 
                              ? "bg-base/80 border-slate-700/80 text-slate-100 shadow-inner" 
                              : "bg-slate-100/90 border border-slate-300 text-slate-900 shadow-sm"
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Sliders size={13} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
                                <span className={`text-[10px] font-black uppercase tracking-wider ${
                                  isDarkMode ? "text-slate-200" : "text-slate-900"
                                }`}>
                                  {t("mapControls.layerOpacity", "Opasitas Layer:")}
                                </span>
                              </div>
                              <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-md shadow-xs ${
                                isDarkMode 
                                  ? "bg-indigo-950/90 text-indigo-300 border border-indigo-500/40" 
                                  : "bg-indigo-100 text-indigo-950 border border-indigo-300 font-extrabold"
                              }`}>
                                {Math.round((layer.opacity !== undefined ? layer.opacity : 0.65) * 100)}%
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.05"
                                value={layer.opacity !== undefined ? layer.opacity : 0.65}
                                onChange={(e) => onChangeLayerOpacity(target.id, parseFloat(e.target.value))}
                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-indigo-600 ${
                                  isDarkMode ? "bg-slate-800" : "bg-slate-250"
                                }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* TAB 3: KODE WARNA & SIMBOLOGI AKTIF */}
            {activeTab === "symbology" && (
              <div className="flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/40 text-[10px]">
                  <span className="font-bold text-slate-400">
                    Simbologi Layer Aktif ({activeSymbologyItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSymbologyModalOpen(true)}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    <span>Detail Lengkap</span>
                    <ExternalLink size={11} />
                  </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar pr-1 max-h-[calc(100dvh-320px)] md:max-h-80 space-y-2">
                  {activeSymbologyItems.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      <p className="mb-2">Tidak ada layer tematik yang aktif saat ini.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("layers")}
                        className="text-indigo-400 underline font-bold"
                      >
                        Buka tab Layer untuk mengaktifkan
                      </button>
                    </div>
                  ) : (
                    activeSymbologyItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded-xl border flex items-start gap-2.5 transition-all ${
                          isDarkMode
                            ? "bg-base/70 border-slate-800 hover:border-slate-700"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Swatch */}
                        <div className="shrink-0 mt-0.5">
                          {item.geometryType === "polygon" && (
                            <div
                              className="w-5 h-5 rounded-md shadow-xs border"
                              style={{
                                backgroundColor: item.color,
                                borderColor: item.strokeColor || "#ffffff",
                                borderWidth: "1.5px"
                              }}
                            />
                          )}
                          {item.geometryType === "line" && (
                            <div className="w-5 h-5 flex items-center justify-center">
                              <div
                                className="w-full h-1 rounded-full shadow-xs"
                                style={{ backgroundColor: item.color }}
                              />
                            </div>
                          )}
                          {item.geometryType === "point" && (
                            <div
                              className="w-4 h-4 rounded-full shadow-xs border flex items-center justify-center text-[9px]"
                              style={{
                                backgroundColor: item.color,
                                borderColor: "#ffffff",
                                borderWidth: "1px"
                              }}
                            >
                              📍
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-[11px] font-black truncate ${
                              isDarkMode ? "text-white" : "text-slate-900"
                            }`}>
                              {item.name}
                            </h4>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">
                              {item.geometryType}
                            </span>
                          </div>
                          <p className={`text-[10px] line-clamp-2 leading-relaxed mt-0.5 ${
                            isDarkMode ? "text-slate-300" : "text-slate-600"
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Symbology Full Guide Modal */}
      <SpatialSymbologyModal
        isOpen={isSymbologyModalOpen}
        onClose={() => setIsSymbologyModalOpen(false)}
        spatialLayers={spatialLayers}
        isDarkMode={isDarkMode}
      />
    </div>,
    controlContainer
  );
}
