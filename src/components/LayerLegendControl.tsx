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
  setIsLayerPanelOpen: parentSetIsLayerPanelOpen
}: LayerLegendControlProps) {
  const { t } = useTranslation();
  const [controlContainer, setControlContainer] = useState<HTMLDivElement | null>(null);
  const [localIsLayerPanelOpen, setLocalIsLayerPanelOpen] = useState(false);
  
  const isLayerPanelOpen = parentIsLayerPanelOpen !== undefined ? parentIsLayerPanelOpen : localIsLayerPanelOpen;
  const setIsLayerPanelOpen = parentSetIsLayerPanelOpen !== undefined ? parentSetIsLayerPanelOpen : setLocalIsLayerPanelOpen;

  const [activeTab, setActiveTab] = useState<"controls" | "layers" | "symbology">("controls");
  const [isSymbologyModalOpen, setIsSymbologyModalOpen] = useState(false);

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
    <div className="m-2 sm:m-3 mt-20 md:mt-24 z-[55] pointer-events-auto">
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
                ? "bg-slate-900/95 border-slate-700/90 text-white shadow-black/80 backdrop-blur-xl hover:border-indigo-500/80 hover:bg-slate-800" 
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
                {isFilterActive ? `Fokus: ${selectedDistrictObj?.name || "Wilayah"}` : "Kontrol Peta & Layer"}
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
            className={`p-4 rounded-2xl shadow-2xl border origin-left transition-all duration-300 w-84 sm:w-96 max-w-[calc(100vw-2.5rem)] ${
              isDarkMode 
                ? "bg-slate-900/95 border-slate-700/90 text-white shadow-black/90 backdrop-blur-xl" 
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
                    Kontrol Peta &amp; Layer GIS
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

            {/* 3 Tab Switcher: Kontrol Peta | Layer Tematik | Simbologi */}
            <div className={`grid grid-cols-3 gap-1 rounded-xl p-1 mb-3 border ${
              isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab("controls")}
                className={`py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === "controls"
                    ? isDarkMode
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Filter size={12} />
                <span>Kontrol Peta</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("layers")}
                className={`py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === "layers"
                    ? isDarkMode
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers size={12} />
                <span>Layer ({activeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("symbology")}
                className={`py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === "symbology"
                    ? isDarkMode
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Palette size={12} />
                <span>Legenda</span>
              </button>
            </div>

            {/* TAB 1: KONTROL PETA (BASE MAP & FOKUS/CLIP WILAYAH) */}
            {activeTab === "controls" && (
              <div className="space-y-3.5 max-h-85 overflow-y-auto custom-scrollbar pr-1">
                {/* Base Map Selection */}
                {setMapMode && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Tipe Basemap Peta
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {basemapOptions.map((opt) => {
                        const isSelected = mapMode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setMapMode(opt.id)}
                            className={`flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                                : isDarkMode
                                ? "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/80"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span>{opt.icon}</span>
                              <span className="text-[11px]">{opt.name}</span>
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              isSelected
                                ? "bg-indigo-800 text-indigo-200"
                                : isDarkMode
                                ? "bg-slate-900 text-slate-400"
                                : "bg-slate-200 text-slate-600"
                            }`}>
                              {opt.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Region Focus & Spatial Clip Intersect */}
                {setSelectedDistrictId && (
                  <div className={`p-3 rounded-xl border space-y-2.5 ${
                    isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-slate-50/90 border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Scissors size={12} className="text-emerald-500" />
                        <span>Fokus &amp; Clip Intersect Wilayah</span>
                      </span>

                      {isFilterActive && (
                        <button
                          type="button"
                          onClick={handleResetFilter}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                          title="Reset filter dan tampilkan seluruh Kabupaten Luwu"
                        >
                          <RefreshCw size={10} />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Pilih kecamatan dan desa untuk memotong (intersect/clip) layer spasial &amp; memfokuskan kamera peta secara otomatis:
                    </p>

                    {/* District Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        1. Pilih Kecamatan:
                      </label>
                      <select
                        value={selectedDistrictId || ""}
                        onChange={(e) => handleSelectDistrict(e.target.value)}
                        className={`w-full text-xs font-semibold rounded-xl p-2 border outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer ${
                          isDarkMode
                            ? "bg-slate-900 border-slate-700 text-white"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      >
                        <option value="">Semua Kecamatan (Kabupaten Luwu)</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            Kecamatan {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Village Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        2. Pilih Desa / Kelurahan:
                      </label>
                      <select
                        disabled={!selectedDistrictId}
                        value={selectedVillageId || ""}
                        onChange={(e) => handleSelectVillage(e.target.value)}
                        className={`w-full text-xs font-semibold rounded-xl p-2 border outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                          !selectedDistrictId
                            ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400"
                            : isDarkMode
                            ? "bg-slate-900 border-slate-700 text-white cursor-pointer"
                            : "bg-white border-slate-300 text-slate-900 cursor-pointer"
                        }`}
                      >
                        <option value="">
                          {selectedDistrictId ? `Semua Desa di Kec. ${selectedDistrictObj?.name || ""}` : "Pilih Kecamatan Dahulu"}
                        </option>
                        {availableVillages.map((v) => (
                          <option key={v.id} value={v.id}>
                            Desa {v.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Active Filter Summary Banner */}
                    {isFilterActive && (
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] text-emerald-600 dark:text-emerald-400 space-y-0.5">
                        <div className="font-bold flex items-center gap-1">
                          <span>✓ Analisa Terpotong Pada:</span>
                          <span>Kec. {selectedDistrictObj?.name}</span>
                          {selectedVillageObj && <span>- Desa {selectedVillageObj.name}</span>}
                        </div>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400">
                          Layer wilayah kecamatan/desa, sawah, mangrove, tambak, jalan, dan zonasi telah di-clip secara presisi ke wilayah ini.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* DEDICATED POTENSI INVESTASI TOGGLE CONTROL */}
                {(() => {
                  const potLayer = spatialLayers.find(l => l.id === "layer_potensi");
                  const isPotensiActive = potLayer ? potLayer.isActive : false;
                  return (
                    <div className={`p-3 rounded-xl border space-y-2.5 transition-all duration-200 ${
                      isDarkMode 
                        ? "bg-slate-950/90 border-slate-800/80 shadow-md" 
                        : "bg-slate-50/95 border-slate-200/90 shadow-sm"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="text-sm">📍</span>
                          <span>Layer Potensi Investasi</span>
                        </span>
                        <span className={`text-[9px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-all duration-200 ${
                          isPotensiActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-200/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/50"
                        }`}>
                          {isPotensiActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>

                      <div 
                        onClick={() => onToggleLayerVis("layer_potensi")}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 group ${
                          isPotensiActive
                            ? (isDarkMode 
                                ? "bg-emerald-950/35 border-emerald-500/60 shadow-inner hover:bg-emerald-950/50" 
                                : "bg-emerald-50/80 border-emerald-300/80 shadow-sm hover:bg-emerald-50")
                            : (isDarkMode 
                                ? "bg-slate-900/85 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700" 
                                : "bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300")
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3.5 h-3.5 rounded-full shrink-0 transition-all duration-300 ${
                            isPotensiActive 
                              ? "bg-fuchsia-500 ring-4 ring-fuchsia-500/20 scale-110" 
                              : "bg-slate-400/60 dark:bg-slate-600 opacity-50 group-hover:opacity-75"
                          }`} />
                          <div className="flex flex-col">
                            <span className={`text-xs font-black transition-colors ${
                              isPotensiActive 
                                ? (isDarkMode ? "text-white" : "text-slate-950") 
                                : (isDarkMode ? "text-slate-300 group-hover:text-white" : "text-slate-700 group-hover:text-slate-950")
                            }`}>
                              Tampilkan Titik &amp; Poligon Potensi
                            </span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                              Layer Spasial Potensi Investasi Daerah
                            </span>
                          </div>
                        </div>

                        {/* Interactive Slide Toggle Button */}
                        <div className="shrink-0 flex items-center pr-0.5">
                          <div
                            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ease-in-out ${
                              isPotensiActive 
                                ? "bg-emerald-600" 
                                : (isDarkMode ? "bg-slate-700 group-hover:bg-slate-600" : "bg-slate-300 group-hover:bg-slate-400")
                            }`}
                          >
                            <motion.div
                              transition={{ type: "spring", stiffness: 600, damping: 35 }}
                              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md"
                              animate={{ x: isPotensiActive ? 16 : 0 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 2: LAYER TEMATIK & OPASITAS */}
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
                <div className="overflow-y-auto custom-scrollbar pr-1.5 max-h-80 space-y-2">
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
                              ? "bg-slate-950/80 border-slate-700/80 text-slate-100 shadow-inner" 
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

                            {/* Preset Buttons */}
                            <div className="grid grid-cols-4 gap-1 pt-0.5">
                              {[0.25, 0.5, 0.75, 1.0].map((preset) => {
                                const currentOpacity = layer.opacity !== undefined ? layer.opacity : 0.65;
                                const isSelected = Math.abs(currentOpacity - preset) < 0.05;
                                return (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => onChangeLayerOpacity(target.id, preset)}
                                    className={`py-1 text-[9px] font-mono font-black rounded-lg transition-all active:scale-95 cursor-pointer text-center ${
                                      isSelected
                                        ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50"
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

                <div className="overflow-y-auto custom-scrollbar pr-1 max-h-80 space-y-2">
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
                            ? "bg-slate-950/70 border-slate-800 hover:border-slate-700"
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
