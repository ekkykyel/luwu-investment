import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { TECHNICAL_LAYERS_CONFIG, LayerMetadata } from '../../hooks/useTechnicalSpatialLayers';

interface TechnicalMapLayerControlProps {
  activeStates: Record<string, boolean>;
  loadingLayers: Record<string, boolean>;
  layerStats: Record<string, { count: number; loaded: boolean }>;
  toggleLayer: (layerId: string) => void;
  setAllLayers: (active: boolean) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export default function TechnicalMapLayerControl({
  activeStates,
  loadingLayers,
  layerStats,
  toggleLayer,
  setAllLayers,
  className = '',
  defaultExpanded = true
}: TechnicalMapLayerControlProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  // Group layers by category
  const categories: Array<{
    title: string;
    description: string;
    layers: LayerMetadata[];
  }> = [
    {
      title: 'ADMINISTRASI',
      description: 'Batas wilayah administratif Kabupaten Luwu',
      layers: TECHNICAL_LAYERS_CONFIG.filter(l => l.category === 'Administrasi')
    },
    {
      title: 'LINGKUNGAN',
      description: 'Sawah beririgasi, tambak perikanan & mangrove pesisir',
      layers: TECHNICAL_LAYERS_CONFIG.filter(l => l.category === 'Lingkungan')
    },
    {
      title: 'KEHUTANAN & LAINNYA',
      description: 'Hutan lahan kering primer/sekunder & zonasi pola ruang',
      layers: TECHNICAL_LAYERS_CONFIG.filter(l => l.category === 'Kehutanan & Tata Ruang' || l.category === 'Infrastruktur & Jalan')
    }
  ];

  const totalActive = Object.values(activeStates).filter(Boolean).length;

  return (
    <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300 text-xs ${className}`}>
      {/* Header bar */}
      <div 
        onClick={() => setIsExpanded(p => !p)}
        className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span>MASTER LAYER SPASIAL</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {totalActive}/{TECHNICAL_LAYERS_CONFIG.length} Aktif
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Polygon kawasan hutan primer, sekunder, sawah &amp; zonasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded layer options */}
      {isExpanded && (
        <div className="p-3 space-y-4 max-h-[380px] overflow-y-auto">
          {/* Quick toggle action bar */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Tampilan Layer</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAllLayers(true)}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
              >
                Aktifkan Semua
              </button>
              <button
                type="button"
                onClick={() => setAllLayers(false)}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Sembunyikan
              </button>
            </div>
          </div>

          {/* Categories */}
          {categories.map((cat) => (
            <div key={cat.title} className="space-y-1.5">
              <div className="px-1 flex items-center justify-between">
                <span className="text-[9.5px] font-mono font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                  {cat.title}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {cat.layers.filter(l => activeStates[l.id]).length}/{cat.layers.length}
                </span>
              </div>

              <div className="space-y-1">
                {cat.layers.map((layer) => {
                  const isActive = !!activeStates[layer.id];
                  const isLoading = !!loadingLayers[layer.id];
                  const stat = layerStats[layer.id];

                  return (
                    <div
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition cursor-pointer select-none ${
                        isActive
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-800/80 text-slate-900 dark:text-white'
                          : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Styled Checkbox */}
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition border ${
                            isActive
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* Color dot */}
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/40"
                          style={{ backgroundColor: layer.color }}
                        />

                        {/* Layer title */}
                        <span className="font-medium truncate text-[11px]">
                          {layer.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                        ) : (
                          stat && stat.count > 0 && (
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {stat.count} Poligon
                            </span>
                          )
                        )}
                        <div className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                          {isActive ? <Eye className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <EyeOff className="w-3 h-3 opacity-40" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
