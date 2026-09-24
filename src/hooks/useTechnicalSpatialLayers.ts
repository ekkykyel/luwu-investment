import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GeoJSONLayer } from '../types';

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
    url: '/gis_kecamatan.json',
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
    url: '/gis_desa.json',
    color: '#10b981',
    lineWidth: 1,
    opacity: 0.45,
    defaultActive: false,
    featureCountHint: 227
  },
  // LINGKUNGAN
  {
    id: 'layer_sawah',
    name: 'Layer Sawah',
    category: 'Lingkungan',
    url: '/gis_sawah.json',
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
    url: '/gis_tambak.json',
    color: '#0ea5e9',
    lineWidth: 1.5,
    opacity: 0.65,
    defaultActive: false,
    featureCountHint: 50
  },
  {
    id: 'layer_mangrove',
    name: 'Layer Mangrove',
    category: 'Lingkungan',
    url: '/gis_mangrove.json',
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
    url: '/gis_lahankeringsekunder.json',
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
    url: '/gis_lahankeringprimer.json',
    color: '#b45309',
    lineWidth: 1.5,
    opacity: 0.65,
    defaultActive: true,
    featureCountHint: 33
  },
  {
    id: 'layer_zonasi',
    name: 'Zonasi Kawasan (RTRW)',
    category: 'Kehutanan & Tata Ruang',
    url: '/gis_zonasi.json',
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
    url: '/api/gis_jalan',
    color: '#eab308',
    lineWidth: 2,
    opacity: 0.85,
    defaultActive: true
  }
];

async function fetchGeoJsonLayer(url: string, id: string): Promise<any> {
  if (globalGeoJsonCache[id]) {
    return globalGeoJsonCache[id];
  }
  if (pendingFetches[id]) {
    return pendingFetches[id];
  }

  const fetchPromise = (async () => {
    try {
      let res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok && id === 'layer_jalan') {
        // Fallback to static if /api/gis_jalan fails
        res = await fetch('/gis_jalan.json', { credentials: 'same-origin' });
      }
      if (!res.ok) {
        console.warn(`[useTechnicalSpatialLayers] Failed to fetch ${url}: status ${res.status}`);
        return { type: 'FeatureCollection', features: [] };
      }
      const _ctype = res.headers.get("content-type");
      if (_ctype && !_ctype.includes("application/json")) throw new Error("Not JSON");
      const data = await res.json();
      if (data && (data.type === 'FeatureCollection' || Array.isArray(data.features))) {
        globalGeoJsonCache[id] = data;
        return data;
      }
      return { type: 'FeatureCollection', features: [] };
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
    config: TECHNICAL_LAYERS_CONFIG
  };
}
