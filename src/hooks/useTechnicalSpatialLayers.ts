import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GeoJSONLayer } from '../types';
import { safeFetchLayerData } from '../lib/supabaseClient';

// In-memory cache for static GeoJSON layers across components
const globalGeoJsonCache: Record<string, any> = {};
const pendingFetches: Record<string, Promise<any>> = {};

export interface LayerMetadata {
  id: string;
  name: string;
  category: 'Administrasi' | 'Lingkungan' | 'Kehutanan & Tata Ruang' | 'Infrastruktur & Jalan';
  url: string;
  color: string;
  lineWidth: number;
  opacity: number;
  defaultActive: boolean;
  featureCountHint?: number;
}

export const TECHNICAL_LAYERS_CONFIG: LayerMetadata[] = [
  // ADMINISTRASI
  {
    id: 'layer_kecamatan',
    name: 'Layer Kecamatan',
    category: 'Administrasi',
    url: '/api/spatial/gis_kecamatan',
    color: '#64748b',
    lineWidth: 1.5,
    opacity: 0.35,
    defaultActive: true,
    featureCountHint: 22
  },
  {
    id: 'layer_desa',
    name: 'Batas Admin Desa',
    category: 'Administrasi',
    url: '/api/spatial/gis_desa',
    color: '#10b981',
    lineWidth: 1,
    opacity: 0.45,
    defaultActive: true,
    featureCountHint: 227
  },
  // LINGKUNGAN
  {
    id: 'layer_sawah',
    name: 'Layer Sawah (LP2B)',
    category: 'Lingkungan',
    url: '/api/spatial/gis_sawah',
    color: '#22c55e',
    lineWidth: 1.5,
    opacity: 0.65,
    defaultActive: true,
    featureCountHint: 144
  },
  {
    id: 'layer_tambak',
    name: 'Layer Tambak',
    category: 'Lingkungan',
    url: '/api/spatial/gis_tambak',
    color: '#0ea5e9',
    lineWidth: 1.5,
    opacity: 0.65,
    defaultActive: true,
    featureCountHint: 50
  },
  {
    id: 'layer_mangrove',
    name: 'Layer Mangrove',
    category: 'Lingkungan',
    url: '/api/spatial/gis_mangrove',
    color: '#14b8a6',
    lineWidth: 1.5,
    opacity: 0.65,
    defaultActive: true,
    featureCountHint: 87
  },
  // KEHUTANAN & TATA RUANG
  {
    id: 'layer_lahan_kering_sekunder',
    name: 'Layer Lahan Kering Sekunder',
    category: 'Kehutanan & Tata Ruang',
    url: '/api/spatial/gis_lahankeringsekunder',
    color: '#f59e0b',
    lineWidth: 1.5,
    opacity: 0.65,
    defaultActive: true,
    featureCountHint: 89
  },
  {
    id: 'layer_lahan_kering_primer',
    name: 'Layer Lahan Kering Primer',
    category: 'Kehutanan & Tata Ruang',
    url: '/api/spatial/gis_lahankeringprimer',
    color: '#b45309',
    lineWidth: 1.5,
    opacity: 0.65,
    defaultActive: true,
    featureCountHint: 33
  },
  {
    id: 'layer_zonasi',
    name: 'Zonasi Kawasan (RTRW & Hutan Lindung)',
    category: 'Kehutanan & Tata Ruang',
    url: '/api/spatial/gis_zonasi',
    color: '#8b5cf6',
    lineWidth: 1.5,
    opacity: 0.65,
    defaultActive: true
  },
  // INFRASTRUKTUR & JALAN
  {
    id: 'layer_jalan',
    name: 'Jaringan Jalan Utama',
    category: 'Infrastruktur & Jalan',
    url: '/api/spatial/gis_jalan',
    color: '#eab308',
    lineWidth: 2,
    opacity: 0.85,
    defaultActive: true
  }
];

// Helper untuk membersihkan cache memori useTechnicalSpatialLayers
export function clearTechnicalSpatialCache(layerId?: string) {
  if (layerId) {
    delete globalGeoJsonCache[layerId];
    delete pendingFetches[layerId];
  } else {
    Object.keys(globalGeoJsonCache).forEach(k => delete globalGeoJsonCache[k]);
    Object.keys(pendingFetches).forEach(k => delete pendingFetches[k]);
  }
}

async function fetchGeoJsonLayer(urlOrTable: string, id: string): Promise<any> {
  if (globalGeoJsonCache[id]) {
    return globalGeoJsonCache[id];
  }
  if (pendingFetches[id]) {
    return pendingFetches[id];
  }

  const tableName = urlOrTable.replace('/api/spatial/', '').replace('/api/spatial-layers/', '').replace(/^\//, '');

  const fetchPromise = (async () => {
    try {
      const data = await safeFetchLayerData(tableName);
      if (data && (data.type === 'FeatureCollection' || Array.isArray(data.features))) {
        if (data.features && data.features.length > 0) {
          globalGeoJsonCache[id] = data;
          return data;
        }
      }
      return data || { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn(`[useTechnicalSpatialLayers] Fetch error for ${id}:`, err);
      return { type: 'FeatureCollection', features: [] };
    } finally {
      delete pendingFetches[id];
    }
  })();

  pendingFetches[id] = fetchPromise;
  return fetchPromise;
}

export function useTechnicalSpatialLayers(initialOverrides?: Record<string, boolean>) {
  // Layer active states map
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    TECHNICAL_LAYERS_CONFIG.forEach(cfg => {
      if (initialOverrides && typeof initialOverrides[cfg.id] === 'boolean') {
        initial[cfg.id] = initialOverrides[cfg.id];
      } else {
        initial[cfg.id] = cfg.defaultActive;
      }
    });
    return initial;
  });

  // Layer opacity states map
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    TECHNICAL_LAYERS_CONFIG.forEach(cfg => {
      initial[cfg.id] = cfg.opacity !== undefined ? cfg.opacity : 0.65;
    });
    return initial;
  });

  // Layer loaded GeoJSON data map
  const [geoJsonData, setGeoJsonData] = useState<Record<string, any>>(() => {
    // Fill from cache if already available
    const initial: Record<string, any> = {};
    TECHNICAL_LAYERS_CONFIG.forEach(cfg => {
      if (globalGeoJsonCache[cfg.id]) {
        initial[cfg.id] = globalGeoJsonCache[cfg.id];
      }
    });
    return initial;
  });

  const [loadingLayers, setLoadingLayers] = useState<Record<string, boolean>>({});
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch GeoJSON for any active layer that hasn't been loaded yet
  const loadLayerData = useCallback(async (cfg: LayerMetadata) => {
    if (globalGeoJsonCache[cfg.id]) {
      setGeoJsonData(prev => ({ ...prev, [cfg.id]: globalGeoJsonCache[cfg.id] }));
      return;
    }

    setLoadingLayers(prev => ({ ...prev, [cfg.id]: true }));
    try {
      const data = await fetchGeoJsonLayer(cfg.url, cfg.id);
      if (isMountedRef.current) {
        setGeoJsonData(prev => ({ ...prev, [cfg.id]: data }));
      }
    } catch (e) {
      console.warn(`Error loading layer ${cfg.id}:`, e);
    } finally {
      if (isMountedRef.current) {
        setLoadingLayers(prev => ({ ...prev, [cfg.id]: false }));
      }
    }
  }, []);

  // Effect to automatically load active layers
  useEffect(() => {
    TECHNICAL_LAYERS_CONFIG.forEach(cfg => {
      if (activeStates[cfg.id] && !geoJsonData[cfg.id]) {
        loadLayerData(cfg);
      }
    });
  }, [activeStates, geoJsonData, loadLayerData]);

  // Listen to spatial_layer_updated events to clear memory cache & reload active layers in real time
  useEffect(() => {
    const handleUpdate = (e: any) => {
      const updatedTable = e.detail?.tableName;
      const targetCfg = TECHNICAL_LAYERS_CONFIG.find(c => 
        (updatedTable && c.url.includes(updatedTable)) || 
        c.id === e.detail?.layerId || 
        (updatedTable && c.id.replace('layer_', '') === updatedTable.replace('gis_', ''))
      );
      if (targetCfg) {
        clearTechnicalSpatialCache(targetCfg.id);
        if (activeStates[targetCfg.id]) {
          loadLayerData(targetCfg);
        }
      } else {
        clearTechnicalSpatialCache();
        TECHNICAL_LAYERS_CONFIG.forEach(cfg => {
          if (activeStates[cfg.id]) {
            loadLayerData(cfg);
          }
        });
      }
    };

    window.addEventListener('spatial_layer_updated', handleUpdate);
    return () => window.removeEventListener('spatial_layer_updated', handleUpdate);
  }, [activeStates, loadLayerData]);

  // Toggle specific layer
  const toggleLayer = useCallback((layerId: string) => {
    setActiveStates(prev => {
      const nextActive = !prev[layerId];
      if (nextActive && !geoJsonData[layerId]) {
        const cfg = TECHNICAL_LAYERS_CONFIG.find(c => c.id === layerId);
        if (cfg) {
          loadLayerData(cfg);
        }
      }
      return { ...prev, [layerId]: nextActive };
    });
  }, [geoJsonData, loadLayerData]);

  const setLayerActive = useCallback((layerId: string, active: boolean) => {
    setActiveStates(prev => {
      if (active && !geoJsonData[layerId]) {
        const cfg = TECHNICAL_LAYERS_CONFIG.find(c => c.id === layerId);
        if (cfg) {
          loadLayerData(cfg);
        }
      }
      return { ...prev, [layerId]: active };
    });
  }, [geoJsonData, loadLayerData]);

  const setAllLayers = useCallback((active: boolean) => {
    setActiveStates(() => {
      const updated: Record<string, boolean> = {};
      TECHNICAL_LAYERS_CONFIG.forEach(cfg => {
        updated[cfg.id] = active;
        if (active && !geoJsonData[cfg.id]) {
          loadLayerData(cfg);
        }
      });
      return updated;
    });
  }, [geoJsonData, loadLayerData]);

  // Set layer opacity handler
  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayerOpacities(prev => ({
      ...prev,
      [layerId]: opacity
    }));
  }, []);

  // Transform into GeoJSONLayer array expected by MaplibreComponent
  const spatialLayers: GeoJSONLayer[] = useMemo(() => {
    return TECHNICAL_LAYERS_CONFIG.map(cfg => {
      const isActive = !!activeStates[cfg.id];
      const geojson = geoJsonData[cfg.id] || { type: 'FeatureCollection', features: [] };
      const isLoading = !!loadingLayers[cfg.id];
      const opacity = layerOpacities[cfg.id] !== undefined ? layerOpacities[cfg.id] : cfg.opacity;

      // Map category to allowed enum string
      let cat: any = 'Lainnya';
      if (cfg.id === 'layer_kecamatan') cat = 'Kecamatan';
      else if (cfg.id === 'layer_desa') cat = 'Desa';
      else if (cfg.id === 'layer_sawah') cat = 'Pertanian';
      else if (cfg.id === 'layer_tambak') cat = 'Kelautan';
      else if (cfg.id === 'layer_jalan') cat = 'Jalan';

      return {
        id: cfg.id,
        name: cfg.name,
        category: cat,
        geojson,
        uploadedAt: new Date().toISOString(),
        isActive,
        opacity,
        color: cfg.color,
        lineWidth: cfg.lineWidth,
        isLoading
      };
    });
  }, [activeStates, geoJsonData, loadingLayers, layerOpacities]);

  // Compute counts of loaded features for diagnostic tooltips
  const layerStats = useMemo(() => {
    const stats: Record<string, { count: number; loaded: boolean }> = {};
    TECHNICAL_LAYERS_CONFIG.forEach(cfg => {
      const data = geoJsonData[cfg.id];
      const count = Array.isArray(data?.features) ? data.features.length : (cfg.featureCountHint || 0);
      stats[cfg.id] = {
        count,
        loaded: !!data
      };
    });
    return stats;
  }, [geoJsonData]);

  // Clear cache or update specific layer GeoJSON dynamically
  const clearCache = useCallback((layerId?: string) => {
    if (layerId) {
      delete globalGeoJsonCache[layerId];
      setGeoJsonData(prev => {
        const next = { ...prev };
        delete next[layerId];
        return next;
      });
    } else {
      Object.keys(globalGeoJsonCache).forEach(k => delete globalGeoJsonCache[k]);
      setGeoJsonData({});
    }
  }, []);

  const setLayerGeoJson = useCallback((layerId: string, geojson: any) => {
    globalGeoJsonCache[layerId] = geojson;
    setGeoJsonData(prev => ({
      ...prev,
      [layerId]: geojson
    }));
  }, []);

  return {
    spatialLayers,
    activeStates,
    layerOpacities,
    loadingLayers,
    layerStats,
    toggleLayer,
    setLayerActive,
    setLayerOpacity,
    onChangeLayerOpacity: setLayerOpacity,
    setAllLayers,
    clearCache,
    setLayerGeoJson,
    config: TECHNICAL_LAYERS_CONFIG
  };
}
