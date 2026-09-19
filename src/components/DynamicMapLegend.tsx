import React, { useState, useEffect, useMemo } from 'react';
import { Layers, ChevronDown, ChevronUp, MapPin, Navigation, Palette, ExternalLink, Info } from 'lucide-react';
import { GeoJSONLayer } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { SpatialSymbologyModal, MASTER_SYMBOLOGY_DEFINITIONS } from './SpatialSymbologyModal';

interface DynamicMapLegendProps {
  spatialLayers: GeoJSONLayer[];
  isDarkMode: boolean;
}

export const DynamicMapLegend: React.FC<DynamicMapLegendProps> = ({ spatialLayers, isDarkMode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeLayers = spatialLayers.filter(layer => layer.isActive);

  // Set of active layer IDs
  const activeLayerIdSet = useMemo(() => {
    const s = new Set<string>();
    spatialLayers.forEach(l => {
      if (l.isActive) s.add(l.id);
    });
    return s;
  }, [spatialLayers]);

  // Active symbology items
  const activeSymbologyItems = useMemo(() => {
    return MASTER_SYMBOLOGY_DEFINITIONS.filter(item => activeLayerIdSet.has(item.layerId));
  }, [activeLayerIdSet]);

  // Auto-collapse if no layers are active to save space
  useEffect(() => {
    if (activeLayers.length === 0 && !isCollapsed) {
      setIsCollapsed(true);
    } else if (activeLayers.length > 0 && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [activeLayers.length]);

  return (
    <>
      <div className={`absolute bottom-10 right-6 z-40 rounded-2xl shadow-xl border transition-colors duration-300 w-72 sm:w-80 ${isDarkMode ? 'bg-slate-900/95 border-slate-700/70 backdrop-blur-md text-slate-100 shadow-black/50' : 'bg-white/95 border-slate-200/90 backdrop-blur-md text-slate-800 shadow-slate-200/50'}`}>
        {/* Header */}
        <div 
          className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none rounded-t-2xl transition-colors ${isCollapsed ? 'rounded-b-2xl' : ''} ${isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'}`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2.5">
            <Palette className={`w-4.5 h-4.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wide">Legenda & Kode Warna</h3>
              <span className="text-[10px] text-slate-400 font-medium">
                {activeSymbologyItems.length} Simbol Aktif
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              title="Buka panduan lengkap"
              className={`p-1 rounded-lg border text-[10px] ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-indigo-400" 
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-indigo-600"
              }`}
            >
              <ExternalLink size={13} />
            </button>
            <div className={`transition-transform duration-200 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`px-4 pb-3 pt-2 border-t max-h-72 overflow-y-auto custom-scrollbar space-y-2.5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                {activeSymbologyItems.length === 0 ? (
                  <div className="text-xs text-center py-4 text-slate-400 italic">
                    Tidak ada layer tematik aktif pada peta.
                  </div>
                ) : (
                  activeSymbologyItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-2.5 text-xs">
                      {/* Swatch */}
                      <div className="shrink-0 mt-0.5">
                        {item.geometryType === "polygon" && (
                          <div 
                            className="w-4.5 h-4.5 rounded shadow-xs border" 
                            style={{ 
                              backgroundColor: item.color, 
                              borderColor: item.strokeColor || "#ffffff",
                              borderWidth: '1.5px'
                            }} 
                          />
                        )}
                        {item.geometryType === "line" && (
                          <div className="w-5 h-4 flex items-center justify-center">
                            <div className="w-full h-1 rounded-full shadow-xs" style={{ backgroundColor: item.color }} />
                          </div>
                        )}
                        {item.geometryType === "point" && (
                          <div 
                            className="w-4.5 h-4.5 rounded-full border flex items-center justify-center"
                            style={{ backgroundColor: `${item.color}30`, borderColor: item.color }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold truncate text-[11px] ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
                            {item.name}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400 shrink-0 font-semibold ml-1">
                            {item.color}
                          </span>
                        </div>
                        <p className={`text-[10px] leading-snug line-clamp-2 mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {/* Bottom button */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className={`w-full mt-2 py-1.5 px-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    isDarkMode
                      ? "bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700"
                      : "bg-slate-50 hover:bg-slate-100 text-indigo-700 border-slate-200"
                  }`}
                >
                  <Info size={13} />
                  <span>Lihat Seluruh Simbologi GIS</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Symbology Modal */}
      <SpatialSymbologyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        spatialLayers={spatialLayers}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

