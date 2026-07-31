import React, { useState } from "react";
import { useControl } from "react-map-gl/maplibre";
import { createPortal } from "react-dom";
import { IControl, Map as MaplibreMap } from "maplibre-gl";
import { GeoJSONLayer } from "../types.js";
import { Layers, CheckSquare, Square, Loader2, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

interface LayerLegendControlProps {
  spatialLayers: GeoJSONLayer[];
  onToggleLayerVis: (layerId: string) => void;
  onChangeLayerOpacity?: (layerId: string, opacity: number) => void;
  isDarkMode: boolean;
}

export default function LayerLegendControl({ spatialLayers, onToggleLayerVis, onChangeLayerOpacity, isDarkMode }: LayerLegendControlProps) {
  const { t } = useTranslation();
  const [controlContainer, setControlContainer] = useState<HTMLDivElement | null>(null);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);

  useControl(() => {
    class CustomLayerControl implements IControl {
      private _container?: HTMLDivElement;
      
      onAdd(map: MaplibreMap) {
        this._container = document.createElement('div');
        // We use maplibregl-ctrl to make it position correctly in the map layout
        this._container.className = 'maplibregl-ctrl';
        setControlContainer(this._container);
        return this._container;
      }
      
      onRemove() {
        if (this._container?.parentNode) {
          this._container.parentNode.removeChild(this._container);
        }
        setControlContainer(null);
      }
    }
    return new CustomLayerControl();
  }, { position: 'top-left' });

  if (!controlContainer) return null;

  // We allow toggling all 12 critical thematic layers:
  const targetLayers = [
    { id: "layer_desa", name: t("mapControls.villageBorders", "Batas Desa"), color: "text-emerald-500", bg: "bg-emerald-500" },
    { id: "layer_infrastruktur", name: t("mapControls.infraPoints", "Infrastruktur"), color: "text-rose-500", bg: "bg-rose-500" },
    { id: "layer_potensi", name: t("map.investmentPotential", "Potensi Investasi"), color: "text-fuchsia-500", bg: "bg-fuchsia-500" },
    { id: "layer_sawah", name: t("mapControls.layerRicefield", "Pertanian Sawah"), color: "text-green-500", bg: "bg-green-500" },
    { id: "layer_tambak", name: t("mapControls.layerPond", "Perikanan Tambak"), color: "text-sky-500", bg: "bg-sky-500" },
    { id: "layer_mangrove", name: t("mapControls.layerMangrove", "Kawasan Mangrove"), color: "text-teal-500", bg: "bg-teal-500" },
    { id: "layer_lahan_kering_sekunder", name: t("mapControls.layerDrySec", "Lahan Kering Sekunder"), color: "text-amber-500", bg: "bg-amber-500" },
    { id: "layer_lahan_kering_primer", name: t("mapControls.layerDryPrim", "Lahan Kering Primer"), color: "text-amber-700", bg: "bg-amber-700" },
    { id: "layer_zonasi", name: t("map.landUseZoning", "Zonasi Kawasan (RTRW)"), color: "text-purple-500", bg: "bg-purple-500" },
    { id: "layer_flood_risk", name: t("map.floodRisk", "Peta Risiko Banjir"), color: "text-red-500", bg: "bg-red-500" },
    { id: "layer_historical_suitability", name: t("mapControls.historicalLandSuitability", "Kesesuaian Lahan"), color: "text-orange-500", bg: "bg-orange-500" },
    { id: "layer_jalan", name: t("mapControls.roadNetwork", "Jaringan Jalan"), color: "text-amber-400", bg: "bg-amber-400" },
  ];

  const activeCount = targetLayers.filter(t => {
    const l = spatialLayers.find(layer => layer.id === t.id);
    return l && l.isActive;
  }).length;

  return createPortal(
    <div className="mt-36 sm:mt-32 md:mt-32 md:ml-[280px] lg:ml-[350px] z-[55] pointer-events-auto">
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
              <Layers size={17} className={`${isDarkMode ? "text-indigo-400" : "text-indigo-600"} group-hover:rotate-12 transition-transform duration-300`} />
              {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>

            <span className={`font-black text-xs uppercase tracking-wider ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              {t("mapControls.layerThematics", "Layer Tematik")}
            </span>

            {activeCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isDarkMode 
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-400/40" 
                  : "bg-indigo-100 text-indigo-700 border border-indigo-300"
              }`}>
                {activeCount}
              </span>
            )}

            <ChevronRight size={16} className={`transition-transform duration-300 group-hover:translate-x-1 ${
              isDarkMode ? "text-slate-400 group-hover:text-white" : "text-slate-500 group-hover:text-slate-950"
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
            className={`p-4 rounded-2xl shadow-2xl border origin-left transition-all duration-300 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] ${
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
                <Layers size={18} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
                <div>
                  <h3 className={`font-black text-xs uppercase tracking-wider ${
                    isDarkMode ? "text-white" : "text-slate-950"
                  }`}>
                    {t("mapControls.layerThematics", "Layer Tematik")}
                  </h3>
                  <span className={`text-[10px] font-extrabold ${
                    isDarkMode ? "text-indigo-300" : "text-indigo-700"
                  }`}>
                    {activeCount} {t("mapControls.of", "dari")} {targetLayers.length} {t("mapControls.activeLayers", "Layer Aktif")}
                  </span>
                </div>
              </div>

              {/* Collapse button pointing horizontally LEFT */}
              <button
                type="button"
                onClick={() => setIsLayerPanelOpen(false)}
                title={t("mapControls.hideToLeft", "Sembunyikan ke kiri")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all active:scale-95 shadow-sm ${
                  isDarkMode 
                    ? "bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 hover:border-indigo-500/50" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border border-slate-300/80 hover:border-indigo-400"
                }`}
              >
                <ChevronLeft size={16} className="text-indigo-500" />
              </button>
            </div>

            {/* Layer Items List with Ultra High Contrast Typography */}
            <div className="overflow-y-auto custom-scrollbar pr-1.5 max-h-80 space-y-2.5">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    controlContainer
  );
}
