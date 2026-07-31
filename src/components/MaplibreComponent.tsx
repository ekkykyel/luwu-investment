import { motion, AnimatePresence } from "motion/react";
import React, { useState, useCallback, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { normalizeGeoJSON } from "../utils/geoUtils.js";
import Map, { Source, Layer, Marker, Popup, NavigationControl, ScaleControl, MapRef } from "react-map-gl/maplibre";
import { InvestmentDetailModal } from "./InvestmentDetailModal.js";
import SpatialBufferAiModal from "./SpatialBufferAiModal.js";
import HoverTooltip from "./HoverTooltip.js";
import AutoTranslatedText from "./AutoTranslatedText.js";

const ICON_DICT: Record<string, string> = {
  // Infrastruktur
  'polisi': '👮', 'pasar': '🛒', 'rumah sakit': '🏥', 'kantor': '🏢',
  // Sektor Utama
  'pertanian': '🚜', 
  'perikanan': '🐟', 
  'kelautan': '🐟',
  'pariwisata': '🏖️', 
  'industri': '🏭',
  'perindustrian': '🏭',
  'pertambangan': '⛏️',
  'perdagangan': '🛒',
  'peternakan': '🐄',
  'jasa': '💼',
  // Sub-Sektor
  'jagung': '🌽', 'padi': '🌾', 'sawit': '🌴', 'rumput laut': '🌿',
};

function getIconForData(subSector: string, sector: string, category: string): string {
  const s = (subSector || "").toLowerCase();
  const sec = (sector || "").toLowerCase();
  const cat = (category || "").toLowerCase();
  
  const searchValues = [s, sec, cat].filter(Boolean);
  
  // Exact matches
  for (const v of searchValues) {
    if (ICON_DICT[v]) return ICON_DICT[v];
  }
  
  // Partial matches
  for (const v of searchValues) {
    for (const key of Object.keys(ICON_DICT)) {
      if (v.includes(key)) return ICON_DICT[key];
    }
  }
  
  return '📍';
}
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import * as turf from "@turf/turf";
import PathFinder from "geojson-path-finder";
import { District, Investment, GeoJSONLayer, SektorInvestasi, Village, Role } from "../types.js";
import { Compass, Home, Plus, Minus, MapPin, Loader2, HelpCircle, LocateFixed, Info, X, Layers, Settings, Eye, EyeOff, Box, Crop, Trash2, Ruler, Fish, Tractor, Pickaxe, Factory, Tent, Sparkles } from "lucide-react";
import MapLegend from "./MapLegend.js";
import LayerLegendControl from "./LayerLegendControl.js";
import MapCrosshair from "./MapCrosshair.js";
import MapLiveCoordinates from "./MapLiveCoordinates.js";
import DrawControl from "./DrawControl.js";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { formatNumber, formatRupiahSingkat } from "../lib/formatters.js";
import { supabase } from "../lib/supabaseClient.js";
import { useMapState } from "../hooks/useMapState.js";

const tooltipCache: Record<string, any> = {};

export interface MapComponentProps {
  networkRouteGeoJSON?: any;
  proximityLineString?: any;
  currentRole?: Role;
  districts: District[];
  villages: Village[];
  investments: Investment[];
  spatialLayers: GeoJSONLayer[];
  infrastructure: any[];
  selectedDistrictId: string | null;
  setSelectedDistrictId: (id: string | null) => void;
  selectedVillageId: string | null;
  setSelectedVillageId?: (id: string | null) => void;
  selectedInvestmentId: string | null;
  setSelectedInvestmentId: (id: string | null) => void;
  heatmapMetric: "count" | "value" | "density" | "road_density" | "none";
  heatmapOpacity?: number;
  choroplethMetric: "value" | "density" | "infrastructure" | "suitability" | "none";
  activeChoroplethFilter?: string | null;
  onToggleChoroplethFilter?: (color: string | null) => void;
  onEditInvestment?: (inv: Investment) => void;
  isDigitizing: boolean;
  digitizedPoints: [number, number][];
  setDigitizedPoints: (pts: [number, number][]) => void;
  enableDrawControl?: boolean;
  onDrawComplete?: (geoJson: any) => void;
  mapMode: "osm" | "light" | "dark" | "satellite" | "google_satellite" | "google_street";
  activeCategories?: string[];
  onToggleCategory?: (cat: string) => void;
  showLegend?: boolean;
  isCartographyMode?: boolean;
  onToggleSectorFilter?: (sector: string) => void;
  onToggleLayerVis?: (layerId: string) => void;
  onChangeLayerOpacity?: (layerId: string, opacity: number) => void;
  onChangeLayerColor?: (layerId: string, color: string) => void;
  onReorderSpatialLayers?: (layers: GeoJSONLayer[]) => void;
  onRefreshData?: () => void;
  focusCoordinate?: { lat: number; lng: number; ts: number } | null;
  showRightDashboard?: boolean;
  isDarkMode?: boolean;
  isTourHudVisible?: boolean;
  setIsTourHudVisible?: (visible: boolean) => void;
  isTemporalGisActive?: boolean;
  showInfrastructure?: boolean;
  isAiPanelOpen?: boolean;
  proximityBufferGeoJSON?: any;
  isPrintPreviewActive?: boolean;
  printScale?: number;
  printOrientation?: "portrait" | "landscape";
}

const SECTOR_COLORS: Record<string, string> = {
  "Potensi Sektor Kelautan dan Perikanan": "#0ea5e9", // Light Blue
  "Kelautan dan Perikanan": "#0ea5e9", // Alternative spelling
  "Potensi Sektor Pertanian": "#22c55e", // Green
  "Pertanian": "#22c55e", 
  "Potensi Sektor Pertambangan": "#f59e0b", // Amber/Orange
  "Pertambangan": "#f59e0b",
  "Potensi Sektor Perindustrian": "#8b5cf6", // Purple
  "Perindustrian": "#8b5cf6",
  "Potensi Sektor Pariwisata": "#ec4899", // Pink
  "Pariwisata": "#ec4899",
};

export function getSectorColor(sector?: string) {
  if (!sector) return '#475569'; // Default gray
  for (const [key, color] of Object.entries(SECTOR_COLORS)) {
    if (sector.includes(key) || key.includes(sector)) return color;
  }
  return '#475569';
}

export function getSectorIcon(sector?: string) {
  if (!sector) return MapPin;
  if (sector.includes("Kelautan") || sector.includes("Perikanan")) return Fish;
  if (sector.includes("Pertanian") || sector.includes("Perkebunan")) return Tractor;
  if (sector.includes("Pertambangan") || sector.includes("Galian")) return Pickaxe;
  if (sector.includes("Perdagangan") || sector.includes("Perindustrian")) return Factory;
  if (sector.includes("Pariwisata") || sector.includes("Hotel")) return Tent;
  return MapPin;
}

export function kalkulasiAksesTerdekat(lokasiGeom: any, dataJaringanJalan: any) {
    let titikFokus: any;


    if (lokasiGeom.geometry.type === 'Polygon' || lokasiGeom.geometry.type === 'MultiPolygon') {
        titikFokus = turf.centroid(lokasiGeom);
    } else if (lokasiGeom.geometry.type === 'Point') {
        titikFokus = lokasiGeom;
    } else {
        return null; 
    }

    let titikGatewayFinal: any = null;
    let jarakTerkecil = Infinity;

    turf.featureEach(dataJaringanJalan, function (segmenJalan) {
        if (segmenJalan.geometry && (segmenJalan.geometry.type === 'LineString' || segmenJalan.geometry.type === 'MultiLineString')) {
            let kandidatGateway = turf.nearestPointOnLine(segmenJalan as any, titikFokus, {units: 'meters'});
            if (kandidatGateway.properties.dist < jarakTerkecil) {
                jarakTerkecil = kandidatGateway.properties.dist;
                titikGatewayFinal = kandidatGateway;
            }
        }
    });

    if (titikGatewayFinal) {
        return {
            titikAsal: titikFokus,
            titikGateway: titikGatewayFinal,
            jarakMeter: jarakTerkecil
        };
} else {
        return null;
    }
}

/**
 * Creates an inverted polygon mask (world-sized polygon with holes cut out in the shape of the provided feature)
 * to visually clip the satellite basemap to a specific administrative boundary when printing to PDF.
 */
export function generateMapMask(feature: any) {
  if (!feature) return null;

  try {
    const rings: any[][] = [];

    const processGeometry = (geom: any) => {
      if (!geom) return;
      if (geom.type === "Polygon") {
        geom.coordinates.forEach((ring: any) => {
          rings.push(ring);
        });
      } else if (geom.type === "MultiPolygon") {
        geom.coordinates.forEach((polygonCoords: any) => {
          polygonCoords.forEach((ring: any) => {
            rings.push(ring);
          });
        });
      }
    };

    const processFeature = (f: any) => {
      if (!f) return;
      if (f.type === "FeatureCollection") {
        f.features.forEach((child: any) => {
          processFeature(child);
        });
      } else if (f.type === "Feature") {
        processGeometry(f.geometry);
      } else {
        processGeometry(f);
      }
    };

    processFeature(feature);

    if (rings.length === 0) {
      undefined;
      return null;
    }

    // World bounds in Mercator limits for a robust visual mask
    const worldRing = [
      [-180, -85],
      [-180, 85],
      [180, 85],
      [180, -85],
      [-180, -85]
    ];

    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [worldRing, ...rings]
      }
    };
  } catch (err) {
    console.error("Mask generation failed", err);
    return null;
  }
}

function loadMapIcons(map: any) {
  const addIcon = (id: string, color: string, emoji: string) => {
    if (map.hasImage(id)) return;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="${color}" stroke="#FFFFFF" stroke-width="3" opacity="0.95"/>
        <text x="24" y="32" font-family="sans-serif" font-size="20" fill="#FFFFFF" text-anchor="middle">${emoji}</text>
      </svg>
    `;
    const img = new Image();
    img.onload = () => {
      if (!map.hasImage(id)) map.addImage(id, img);
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  };

  addIcon('icon-kesehatan', '#EF4444', '🏥');
  addIcon('icon-pendidikan', '#F59E0B', '🏫');
  addIcon('icon-laut', '#06B6D4', '🚢');
  addIcon('icon-udara', '#3B82F6', '✈️');
  addIcon('icon-umum', '#10B981', '🏢');
  addIcon('icon-kantor', '#8B5CF6', '🏛️');
  addIcon('icon-default', '#64748B', '📍');
  addIcon('icon-keamanan', '#EF4444', '🛡️');
  addIcon('icon-perdagangan', '#F59E0B', '🛒');
}

export interface MapComponentRef {
  clearDraw: () => void;
  flyToCoordinate?: (lng: number, lat: number, zoom?: number) => void;
  getCanvas?: () => HTMLCanvasElement | null;
  getMapInstance?: () => any;
}

const MaplibreComponent = forwardRef<MapComponentRef, MapComponentProps>((props, ref) => {
  const { t } = useTranslation();
  const [detailModalInvestmentId, setDetailModalInvestmentId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedInvestmentForAI, setSelectedInvestmentForAI] = useState<any>(null);
  const [cameraTargetNotice, setCameraTargetNotice] = useState<{ name: string; type: string } | null>(null);
  
  const mapRef = useRef<MapRef>(null);
  const pathFinderRef = useRef<any>(null);
  const [hoverInfo, _setHoverInfo] = useState<{ x: number; y: number; properties: any; type: string } | null>(null);
  const hoverInfoRef = useRef<any>(null);
  const setHoverInfo = useCallback((val: any) => {
    hoverInfoRef.current = val;
    _setHoverInfo(val);
  }, []);
  const [roadsGeoJSON, setRoadsGeoJSON] = useState<any>(null);
  const [zonasiGeoJSON, setZonasiGeoJSON] = useState<any>(null);

  // Measurement tool state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measureDistance, setMeasureDistance] = useState<number>(0);

  useImperativeHandle(ref, () => ({
    getCanvas: () => {
      try {
        return mapRef.current?.getMap().getCanvas() || null;
      } catch (e) {
        return null;
      }
    },
    getMapInstance: () => {
      try {
        return mapRef.current?.getMap() || null;
      } catch (e) {
        return null;
      }
    },
    resizeMap: () => {
      try {
        mapRef.current?.getMap()?.resize();
      } catch (e) {
        undefined;
      }
    },
    setFeatureHoverState: (sourceId: string, featureId: string, hover: boolean) => {
      if (mapRef.current) {
        try {
          if (mapRef.current.getSource(sourceId)) {
            mapRef.current.setFeatureState(
              { source: sourceId, id: featureId },
              { hover: hover }
            );
          }
        } catch (e) {
          undefined;
        }
      }
    },
    flyToCoordinate: (lng: number, lat: number, zoom: number = 14) => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: zoom,
          essential: true,
          duration: 2000
        });
      }
    },
    clearDraw: () => {
      if (drawRef.current) {
        drawRef.current.draw.deleteAll();
        setDrawFeatures({});
      }
    },
    changeDrawMode: (mode: string) => {
      if (drawRef.current) {
        drawRef.current.draw.changeMode(mode);
      }
    },
    trashDraw: () => {
      if (drawRef.current) {
        drawRef.current.draw.trash();
      }
    },
    toggleMeasure: () => {
      setIsMeasuring(!isMeasuring);
      if (isMeasuring) {
        setMeasurePoints([]);
        setMeasureDistance(0);
      }
    }
  }), [isMeasuring]);

  // Smart Modal States
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [activeInvestmentData, setActiveInvestmentData] = useState<any>(null);

  // Draw Control Features
  const drawRef = useRef<any>(null);
  const [drawFeatures, setDrawFeatures] = useState<Record<string, any>>({});

  // Custom theme style override to resolve line-dasharray expression crash on Maplibre rendering
  const drawStyles = useMemo(() => {
    const defaultTheme = (MapboxDraw as any).lib?.theme || [];
    return defaultTheme.map((style: any) => {
      if (style.paint && style.paint['line-dasharray']) {
        const { 'line-dasharray': _, ...restPaint } = style.paint;
        return {
          ...style,
          paint: restPaint
        };
      }
      return style;
    });
  }, []);
  
  const onDrawUpdate = useCallback((e: any) => {
    setDrawFeatures((curr) => {
      const newFeatures = { ...curr };
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      return newFeatures;
    });
  }, []);

  const onDrawDelete = useCallback((e: any) => {
    setDrawFeatures((curr) => {
      const newFeatures = { ...curr };
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      return newFeatures;
    });
  }, []);

  // Pass feature collection up to parent form whenever it changes
  useEffect(() => {
    if (props.onDrawComplete) {
      const features = Object.values(drawFeatures);
      if (features.length > 0) {
        props.onDrawComplete({ type: "FeatureCollection", features });
      } else {
        props.onDrawComplete(null);
      }
    }
  }, [drawFeatures, props.onDrawComplete]);

  const { viewState, updateViewState, resetViewState } = useMapState();

  useEffect(() => {
    if (measurePoints.length > 1) {
      const line = turf.lineString(measurePoints.map(pt => [pt[0], pt[1]]));
      const length = turf.length(line, { units: 'kilometers' });
      setMeasureDistance(length);
    } else {
      setMeasureDistance(0);
    }
  }, [measurePoints]);

  // Re-size MapLibre strictly when layout dimension shifts due to AI panel toggle
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        // Delay slighty to align with CSS transition (300ms) completion
        const timerId = setTimeout(() => {
          map.resize();
        }, 320);
        return () => clearTimeout(timerId);
      }
    }
  }, [props.isAiPanelOpen]);

    const [isAutoFollowEnabled, setIsAutoFollowEnabled] = useState(true);
  const [localMapMode, setLocalMapMode] = useState<"osm" | "light" | "dark" | "satellite" | "google_satellite" | "google_street">(props.mapMode || "osm");
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapTransitionNotification, setMapTransitionNotification] = useState<{ text: string; type: "mode" | "district" } | null>(null);
  const [isStyleSwitching, setIsStyleSwitching] = useState(false);
  const [showBasemapSheet, setShowBasemapSheet] = useState(false);
  const prevMapModeRef = useRef(localMapMode);

  useEffect(() => {
    if (props.isDarkMode !== undefined) {
      setLocalMapMode(props.isDarkMode ? "dark" : "light");
    }
  }, [props.isDarkMode]);

  useEffect(() => {
    if (props.mapMode) {
      setLocalMapMode(props.mapMode);
    }
  }, [props.mapMode]);

  // Efek transisi & notifikasi halus saat berganti mode peta basemap
  useEffect(() => {
    if (prevMapModeRef.current !== localMapMode) {
      setIsStyleSwitching(true);
      const modeNames: Record<string, string> = {
        osm: "OpenStreetMap Vektor Standard",
        light: "Light Minimalist Elegance",
        dark: "Dark Command Vector",
        satellite: "Satelit ESRI High-Res",
        google_satellite: "Google Earth Satelit Citra",
        google_street: "Google Maps Jalan Spasial"
      };
      setMapTransitionNotification({
        text: `Memuat Mode Peta: ${modeNames[localMapMode] || localMapMode}`,
        type: "mode"
      });

      const timer = setTimeout(() => setIsStyleSwitching(false), 550);
      const notifTimer = setTimeout(() => setMapTransitionNotification(null), 2500);

      prevMapModeRef.current = localMapMode;
      return () => {
        clearTimeout(timer);
        clearTimeout(notifTimer);
      };
    }
  }, [localMapMode]);

  // Efek notifikasi halus saat menyaring kecamatan
  useEffect(() => {
    if (props.selectedDistrictId) {
      const district = props.districts.find(d => d.id === props.selectedDistrictId);
      if (district) {
        setMapTransitionNotification({
          text: `Fokus Spasial: Kecamatan ${district.name}`,
          type: "district"
        });
        const timer = setTimeout(() => setMapTransitionNotification(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [props.selectedDistrictId, props.districts]);

  // Filter Jaringan Jalan Berdasarkan Kecamatan Terpilih Kawan!
  
  const getSelectedDistrictPolygon = useCallback(() => {
    if (!props.selectedDistrictId) return null;
    const district = props.districts.find(d => d.id === props.selectedDistrictId);
    if (!district) return null;
    
    let geojson = district.geojson;
    if (!geojson) {
      const kecLayer = props.spatialLayers.find(l => l.id === "layer_kecamatan");
      if (kecLayer && kecLayer.geojson) {
        const features = kecLayer.geojson.type === "FeatureCollection" ? kecLayer.geojson.features : [kecLayer.geojson];
        const match = features.find((feat: any) => {
          const featName = feat.properties?.KECAMATAN || feat.properties?.name || "";
          return normalizeName(featName) === normalizeName(district.name);
        });
        if (match) geojson = match;
      }
    }
    return geojson;
  }, [props.selectedDistrictId, props.districts, props.spatialLayers]);

  const desaLayerObj = useMemo(() => {
    return props.spatialLayers.find(l => l.id === "layer_desa");
  }, [props.spatialLayers]);

  const desaGeoJSON = useMemo(() => {
    if (!desaLayerObj || !desaLayerObj.geojson) return null;
    let normalized = normalizeGeoJSON(desaLayerObj.geojson);
    if (!normalized || !normalized.type) return null;

    if (props.selectedDistrictId && normalized.features && normalized.features.length > 0) {
      const distId = String(props.selectedDistrictId).toLowerCase().trim();
      const districtObj = props.districts?.find(d => String(d.id).toLowerCase().trim() === distId);
      const distName = districtObj ? districtObj.name.toLowerCase().trim() : "";

      const filtered = normalized.features.filter((f: any) => {
        const fDistId = String(f.properties?.districtId || f.properties?.district_id || "").toLowerCase().trim();
        const fKec = String(f.properties?.kecamatan || f.properties?.KECAMATAN || f.properties?.WADMKC || "").toLowerCase().trim();
        
        if (fDistId && (fDistId === distId || fDistId === `dist_${distName.replace(/\s+/g, '_')}`)) return true;
        if (fKec && (fKec === distName || fKec.includes(distName) || distName.includes(fKec))) return true;

        const distPolygon = getSelectedDistrictPolygon();
        if (distPolygon && f.geometry) {
          try {
            return (turf as any).booleanIntersects(f, distPolygon);
          } catch (e) {
            return false;
          }
        }
        return false;
      });

      if (filtered.length > 0) {
        return {
          ...normalized,
          features: filtered
        };
      }
    }

    return normalized;
  }, [desaLayerObj, props.selectedDistrictId, props.districts, getSelectedDistrictPolygon]);

  const isDesaLayerActive = desaLayerObj?.isActive === true || !!props.selectedDistrictId || !!props.selectedVillageId;

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !isMapLoaded) return;

    // Create a new maplibregl.Popup
    // @ts-ignore
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'village-popup'
    });

    const onMouseEnter = (e: any) => {
      map.getCanvas().style.cursor = 'pointer';
      
      const features = e.features;
      if (features && features.length > 0) {
        const propsData = features[0].properties || {};
        const name = propsData.nama_desa || propsData.name || propsData.WADMKD || propsData.NAMOBJ || propsData.nama || propsData.Name || propsData.Nama_Desa || 'Desa';
        const rawKecName = propsData.kecamatan || propsData.WADMKC || propsData.KECAMATAN || '';
        
        const matchedVillage = props.villages?.find(v => v.id === propsData.id || (v.name && v.name.toLowerCase() === name.toLowerCase()));

        let luas = matchedVillage?.areaHa || propsData.LUAS || propsData.luas || propsData.Shape_Area || propsData.SHAPE_Area || propsData.areaHa || 0;
        let pop = matchedVillage?.population || propsData.population || propsData.Jum_Pdd || propsData.jum_pdd || 0;

        if (typeof luas === 'number') luas = `${luas.toFixed(1)} Ha`;
        else if (luas) luas = `${luas} Ha`;
        else luas = 'N/A';

        const html = `
          <div style="padding: 10px; font-family: sans-serif; font-size: 12px; border-radius: 8px; background-color: #1e293b; color: #f8fafc; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            <div style="font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">🏡 ${name}</div>
            ${rawKecName ? `<div style="opacity: 0.8; margin-bottom: 2px;">Kecamatan: ${rawKecName}</div>` : ''}
            <div style="opacity: 0.8; margin-bottom: 2px;">Luas: <span style="font-weight: bold; color: #34d399;">${luas}</span></div>
            ${pop > 0 ? `<div style="opacity: 0.8;">Penduduk: <span style="font-weight: bold; color: #60a5fa;">${pop.toLocaleString("id-ID")} Jiwa</span></div>` : ''}
          </div>
        `;

        popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      }
    };

    const onMouseMove = (e: any) => {
      popup.setLngLat(e.lngLat);
    };

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    };

    map.on('mouseenter', 'spatial-layer-fill-layer_desa', onMouseEnter);
    map.on('mousemove', 'spatial-layer-fill-layer_desa', onMouseMove);
    map.on('mouseleave', 'spatial-layer-fill-layer_desa', onMouseLeave);

    return () => {
      map.off('mouseenter', 'spatial-layer-fill-layer_desa', onMouseEnter);
      map.off('mousemove', 'spatial-layer-fill-layer_desa', onMouseMove);
      map.off('mouseleave', 'spatial-layer-fill-layer_desa', onMouseLeave);
      popup.remove();
    };
  }, [isMapLoaded]);

  const isNavControlAddedRef = useRef(false);

  // Lazy loading state for geospatial layers using browser Intersection Observer kawan
  const [visibleLayerIds, setVisibleLayerIds] = useState<Record<string, boolean>>({});
  const layerBboxesRef = useRef<Record<string, [number, number, number, number]>>({});
  const observerContainerRef = useRef<HTMLDivElement>(null);
  const isUpdatingPositionsRef = useRef<boolean>(false);

  // Compute and cache geographic bounding box (bbox) for spatial layers kawan
  const prevFeaturesCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    props.spatialLayers.forEach(layer => {
      if (layer.id === "layer_kecamatan") return;
      
      const featuresCount = layer.geojson?.features?.length || 0;
      if (layerBboxesRef.current[layer.id] && prevFeaturesCountRef.current[layer.id] === featuresCount) {
        return; // already computed for this state
      }

      let geo = layer.geojson;
      if (layer.id === "layer_jalan" && (!geo || !geo.features || geo.features.length === 0)) {
        geo = roadsGeoJSON;
      }

      if (geo) {
        try {
          let safeGeoJSON = geo;
          if (geo.type === 'FeatureCollection') {
            if (!geo.features || geo.features.length === 0) return;
            const validFeatures = geo.features.filter((f: any) => f.geometry && f.geometry.coordinates);
            if (validFeatures.length === 0) return;
            safeGeoJSON = { ...geo, features: validFeatures };
          } else if (geo.type === 'Feature') {
            if (!geo.geometry || !geo.geometry.coordinates) return;
          } else if (!geo.coordinates) {
             return;
          }

          const bbox = turf.bbox(safeGeoJSON);
          layerBboxesRef.current[layer.id] = bbox as [number, number, number, number];
          prevFeaturesCountRef.current[layer.id] = featuresCount;
        } catch (e) {
          undefined;
        }
      }
    });
  }, [props.spatialLayers, roadsGeoJSON]);

  // Dynamically position screen observer target elements based on their geo bounding box kawan
  const updateObserverPositions = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    props.spatialLayers.forEach(layer => {
      if (layer.id === "layer_kecamatan") return;

      const bbox = layerBboxesRef.current[layer.id];
      if (!bbox) return;

      try {
        const [minLng, minLat, maxLng, maxLat] = bbox;

        const sw = map.project([minLng, minLat]);
        const ne = map.project([maxLng, maxLat]);

        const left = Math.min(sw.x, ne.x);
        const top = Math.min(sw.y, ne.y);
        const right = Math.max(sw.x, ne.x);
        const bottom = Math.max(sw.y, ne.y);

        const width = Math.max(1, right - left);
        const height = Math.max(1, bottom - top);

        const elem = document.getElementById(`observer-target-${layer.id}`);
        if (elem) {
          elem.style.left = `${left}px`;
          elem.style.top = `${top}px`;
          elem.style.width = `${width}px`;
          elem.style.height = `${height}px`;
        }
      } catch (err) {
        // Safe trace for map rendering boundaries kawan
      }
    });
  }, [props.spatialLayers]);

  // URL Parameter Listener for deep-linking (Peluang Emas Luwu -> Map)
  useEffect(() => {
    if (typeof window !== 'undefined' && isMapLoaded) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('id');

      if (urlId) {
        const found = props.investments.find(inv => String(inv.id) === urlId);
        if (found) {
          
          // Hydrate the state for the investment modal
          props.setSelectedInvestmentId(urlId);
          setDetailModalInvestmentId(urlId);
          
          // Trigger smooth map coordinates fly-to animation
          const map = mapRef.current?.getMap();
          if (map) {
             map.flyTo({
               center: [found.longitude || (found as any).lng, found.latitude || (found as any).lat],
               zoom: 14.5,
               speed: 1.2,
               curve: 1.42,
               essential: true
             });
          }

          // Clean up the URL without a framework reload
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: newUrl }, "", newUrl);
        }
      }
    }
  }, [isMapLoaded, props.investments, props.setSelectedInvestmentId]);

  // Set up browser Intersection Observer to observe map bounding boxes of layers kawan
  useEffect(() => {
    const container = observerContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleLayerIds(prev => {
          const updated = { ...prev };
          let changed = false;

          entries.forEach(entry => {
            const id = entry.target.id.replace("observer-target-", "");
            if (prev[id] !== entry.isIntersecting) {
              updated[id] = entry.isIntersecting;
              changed = true;
            }
          });

          return changed ? updated : prev;
        });
      },
      {
        root: container.parentElement, // Use map parent container as context viewport kawan
        threshold: 0
      }
    );

    // Observe each target element
    props.spatialLayers.forEach(layer => {
      if (layer.id === "layer_kecamatan") return;
      const elem = document.getElementById(`observer-target-${layer.id}`);
      if (elem) {
        observer.observe(elem);
      }
    });

    updateObserverPositions();

    return () => {
      observer.disconnect();
    };
  }, [props.spatialLayers, updateObserverPositions]);

  // Add direct map event listeners for high-frequency position updating kawan
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    let throttleTimer: any = null;
    const onMapChange = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateObserverPositions();
        throttleTimer = null;
      }, 16);
    };

    map.on("move", onMapChange);
    map.on("zoom", onMapChange);
    map.on("resize", onMapChange);

    if (map.isStyleLoaded()) {
      updateObserverPositions();
    } else {
      map.once("load", updateObserverPositions);
    }

    return () => {
      map.off("move", onMapChange);
      map.off("zoom", onMapChange);
      map.off("resize", onMapChange);
    };
  }, [updateObserverPositions, props.spatialLayers, roadsGeoJSON]);

  // Guarded road data loading
  useEffect(() => {
    fetch('/api/gis_jalan')
      .then(async res => {
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          undefined;
          return { type: "FeatureCollection", features: [] };
        }
        return res.json();
      })
      .then(data => {
        undefined;
        if (data && data.features) {
          // Fix nested FeatureCollection issue (often an export artifact)
          let flatFeatures: any[] = [];
          data.features.forEach((f: any) => {
            if (f.type === "FeatureCollection" && f.features) {
               flatFeatures.push(...f.features);
            } else {
               flatFeatures.push(f);
            }
          });
          
          const filtered = flatFeatures.filter((f: any) => f.geometry !== null);
          const normalizedGeoJSON = { type: "FeatureCollection" as const, features: filtered };
          setRoadsGeoJSON(normalizedGeoJSON);
          try {
            pathFinderRef.current = new PathFinder(normalizedGeoJSON);
(window as any).luwuPathFinder = pathFinderRef.current;
            (window as any).luwuPathFinder = pathFinderRef.current;
            (window as any).luwuRoads = normalizedGeoJSON;
          } catch (e) {
            undefined;
          }
        } else {
          setRoadsGeoJSON({ type: "FeatureCollection", features: [] });
        }
      })
      .catch(err => {
        console.error("Gagal memuat /api/gis_jalan:", err);
        setRoadsGeoJSON({ type: "FeatureCollection", features: [] });
      });
  }, []);

  // Guarded zonasi data loading
  useEffect(() => {
    fetch('/gis_zonasi.json')
      .then(async res => {
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          undefined;
          return { type: "FeatureCollection", features: [] };
        }
        return res.json();
      })
      .then(data => {
        if (data && (data.type === "FeatureCollection" || data.type === "Feature")) {
          setZonasiGeoJSON(data);
        } else {
          setZonasiGeoJSON({ type: "FeatureCollection", features: [] });
        }
      })
      .catch(err => {
        undefined;
        setZonasiGeoJSON({ type: "FeatureCollection", features: [] });
      });
  }, []);

  const finalZonasiGeoJSON = useMemo(() => {
    if (zonasiGeoJSON && zonasiGeoJSON.features && zonasiGeoJSON.features.length > 0) {
      return zonasiGeoJSON;
    }
    const dbLayer1 = props.spatialLayers.find(l => l.id === "layer_zonasi");
    if (dbLayer1?.geojson && dbLayer1.geojson.features && dbLayer1.geojson.features.length > 0) {
      return dbLayer1.geojson;
    }
    const dbLayer2 = props.spatialLayers.find(l => l.id === "layer_land_use_zoning");
    if (dbLayer2?.geojson && dbLayer2.geojson.features && dbLayer2.geojson.features.length > 0) {
      return dbLayer2.geojson;
    }
    return zonasiGeoJSON || { type: "FeatureCollection", features: [] };
  }, [zonasiGeoJSON, props.spatialLayers]);

  // Sync zoom and fly to coordinate focus changes
  useEffect(() => {
    if (props.focusCoordinate && mapRef.current) {
      mapRef.current.flyTo({
        center: [props.focusCoordinate.lng, props.focusCoordinate.lat],
        zoom: 13,
        speed: 1.2,
        curve: 1.42,
        essential: true
      });
    }
  }, [props.focusCoordinate]);

  // Synchronize layers control visibility direct mapping to map libre styles using setLayoutProperty safely
  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    // Auto-arrange Z-Index so 'layer-jalan' is always on top of all polygons
    try {
      if (map.getLayer('layer-jalan')) {
        map.moveLayer('layer-jalan');
      }
    } catch (e) {
      // ignore
    }

    // Direct synchronization for zoning layers in case MapLibre state gets out of sync
    try {
      const isZonasiActive = props.spatialLayers.some(l => 
        (l.id === "layer_zonasi" || 
         l.id === "layer_land_use_zoning" || 
         l.id === "gis_zonasi" || 
         l.id === "Zonasi Pemanfaatan Lahan") && 
        l.isActive
      );
      const visVal = isZonasiActive ? 'visible' : 'none';
      if (map.getLayer('layer-zonasi')) map.setLayoutProperty('layer-zonasi', 'visibility', visVal);
      if (map.getLayer('layer-zonasi-outline')) map.setLayoutProperty('layer-zonasi-outline', 'visibility', visVal);
    } catch (e) {
      // ignore
    }
  }, [props.spatialLayers, roadsGeoJSON, isMapLoaded]);

  // Normalize names for perfect database correlation
  function normalizeName(name: string) {
    if (!name) return "";
    return name.toLowerCase().replace(/kec\./g, "").replace(/kecamatan/g, "").trim();
  }

  const findDistrictForFeature = useCallback((feature: any) => {
    if (feature.properties?.id) {
      const found = props.districts.find(d => d.id === feature.properties.id);
      if (found) return found;
    }
    const featName = feature.properties?.KECAMATAN || feature.properties?.name || "";
    const normalizedFeatName = normalizeName(featName);
    return props.districts.find(d => normalizeName(d.name) === normalizedFeatName);
  }, [props.districts]);

  const getMetricValue = useCallback((district: any) => {
    if (!district) return 0;
    if (props.choroplethMetric === "value") return district.totalInvestmentValue || 0;
    if (props.choroplethMetric === "density") return district.density || 0;
    if (props.choroplethMetric === "infrastructure") return district.infrastructureScore || 0;
    return 0;
  }, [props.choroplethMetric]);

  const getColor = (value: number, metric: string) => {
    if (metric === "value") {
      if (value > 500000000000) return "#1e3a8a";
      if (value > 300000000000) return "#3b82f6";
      if (value > 150000000000) return "#60a5fa";
      return "#bfdbfe";
    } else if (metric === "density") {
      if (value > 500) return "#9f1239";
      if (value > 200) return "#f43f5e";
      if (value > 100) return "#fda4af";
      return "#ffe4e6";
    } else if (metric === "infrastructure") {
      if (value >= 8) return "#14532d";
      if (value >= 6) return "#22c55e";
      if (value >= 4) return "#86efac";
      return "#dcfce7";
    }
    return "#e2e8f0";
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case "Kelautan": return "#3b82f6";
      case "Pertanian": return "#10b981";
      case "Pertambangan": return "#f59e0b";
      case "Perdagangan": return "#8b5cf6";
      case "Pariwisata": return "#ec4899";
      default: return "#64748b";
    }
  };

  // --- Smooth Cinematic Camera Transitions for Districts kawan ---
  const prevSelectedDistrictIdRef = useRef<string | null>(props.selectedDistrictId);

  useEffect(() => {
    if (mapRef.current && isMapLoaded) {
      if (props.selectedDistrictId) {
        const district = props.districts.find(d => d.id === props.selectedDistrictId);
        if (district) {
          // Trigger floating HUD notification badge
          setCameraTargetNotice({ name: district.name, type: "Kecamatan" });
          const timer = setTimeout(() => setCameraTargetNotice(null), 2800);

          let geojson = district.geojson;
          if (!geojson) {
            const kecLayer = props.spatialLayers.find(l => l.id === "layer_kecamatan");
            if (kecLayer && kecLayer.geojson) {
              const features = kecLayer.geojson.type === "FeatureCollection" ? kecLayer.geojson.features : [kecLayer.geojson];
              const match = features.find((feat: any) => {
                const featName = feat.properties?.KECAMATAN || feat.properties?.name || "";
                return normalizeName(featName) === normalizeName(district.name);
              });
              if (match) {
                geojson = match;
              }
            }
          }

          if (geojson) {
            try {
              const bbox = turf.bbox(geojson);
              mapRef.current.fitBounds(bbox as [number, number, number, number], {
                padding: { top: 75, bottom: 75, left: 75, right: 75 },
                duration: 1800,
                maxZoom: 13.5,
                pitch: 28,
                bearing: 6,
                essential: true
              });
            } catch (e) {
              if (district.coordinates && district.coordinates.length >= 2) {
                mapRef.current.flyTo({
                  center: [district.coordinates[1], district.coordinates[0]],
                  zoom: 11.8,
                  pitch: 28,
                  bearing: 6,
                  duration: 1800,
                  speed: 1.1,
                  curve: 1.45,
                  essential: true
                });
              }
            }
          } else if (district.coordinates && district.coordinates.length >= 2) {
            mapRef.current.flyTo({
              center: [district.coordinates[1], district.coordinates[0]],
              zoom: 11.8,
              pitch: 28,
              bearing: 6,
              duration: 1800,
              speed: 1.1,
              curve: 1.45,
              essential: true
            });
          }

          prevSelectedDistrictIdRef.current = props.selectedDistrictId;
          return () => clearTimeout(timer);
        }
      } else if (prevSelectedDistrictIdRef.current !== null) {
        // Reset to all districts / Luwu regency view ONLY if it was previously set
        setCameraTargetNotice({ name: "Seluruh Kabupaten Luwu", type: "Perspektif Makro" });
        const timer = setTimeout(() => setCameraTargetNotice(null), 2400);

        mapRef.current.flyTo({
          center: [120.25, -3.15],
          zoom: 9.5,
          pitch: 0,
          bearing: 0,
          duration: 1600,
          speed: 1.2,
          curve: 1.4,
          essential: true
        });

        prevSelectedDistrictIdRef.current = props.selectedDistrictId;
        return () => clearTimeout(timer);
      }
      prevSelectedDistrictIdRef.current = props.selectedDistrictId;
    }
  }, [props.selectedDistrictId, props.districts, props.spatialLayers, isMapLoaded]);

  useEffect(() => {
    if (props.selectedVillageId && mapRef.current) {
      const village = props.villages.find(v => v.id === props.selectedVillageId);
      if (village) {
        let geojson = village.geojson;
        if (village.coordinates && village.coordinates.length >= 2) {
          mapRef.current.flyTo({
            center: [village.coordinates[1], village.coordinates[0]],
            zoom: 13, // Village level zoom
            speed: 1.2,
            curve: 1.42,
            essential: true
          });
        }

        // Show popup for village removed
      }
    }
  }, [props.selectedVillageId, props.villages]);

  useEffect(() => {
    if (props.selectedInvestmentId) {
      setDetailModalInvestmentId(props.selectedInvestmentId);
      if (mapRef.current) {
        const inv = props.investments.find(i => i.id === props.selectedInvestmentId);
        if (inv && isAutoFollowEnabled) { mapRef.current.flyTo({
            center: [inv.longitude, inv.latitude],
            zoom: 14.5,
            speed: 1.2,
            curve: 1.42,
            essential: true
          });
        }
      }
    } else {
      setDetailModalInvestmentId(null);
    }
  }, [props.selectedInvestmentId, props.investments]);

  // ANTREAN ANIMASI: Marching ants effect untuk Proximity Line
  const proximityAnimRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!props.proximityLineString || !map) {
      if (proximityAnimRef.current) cancelAnimationFrame(proximityAnimRef.current);
      return;
    }

    const dashArraySequence = [
      [0, 4, 3],
      [0.5, 4, 2.5],
      [1, 4, 2],
      [1.5, 4, 1.5],
      [2, 4, 1],
      [2.5, 4, 0.5],
      [3, 4, 0],
      [0, 0, 3, 4],
      [0.5, 0, 2.5, 4],
      [1, 0, 2, 4],
      [1.5, 0, 1.5, 4],
      [2, 0, 1, 4],
      [2.5, 0, 0.5, 4]
    ];

    let step = 0;

    const animateDashArray = (timestamp: number) => {
      // 50ms per sekwens animasi
      const newStep = Math.floor((timestamp / 50) % dashArraySequence.length);
      
      if (newStep !== step) {
        if (map.getStyle() && map.getLayer('layer-proximity-line')) {
           map.setPaintProperty('layer-proximity-line', 'line-dasharray', dashArraySequence[newStep]);
        }
        step = newStep;
      }
      proximityAnimRef.current = requestAnimationFrame(animateDashArray);
    };

    proximityAnimRef.current = requestAnimationFrame(animateDashArray);

    return () => {
      if (proximityAnimRef.current) {
        cancelAnimationFrame(proximityAnimRef.current);
      }
    };
  }, [props.proximityLineString]);

  // Filter Jaringan Jalan Berdasarkan Kecamatan Terpilih Kawan!
  
  const displayRoadsGeoJSON = useMemo(() => {
    if (!roadsGeoJSON || !roadsGeoJSON.features) return null;
    if (!props.selectedDistrictId) return roadsGeoJSON;
    
    
    
    let distPolygon = getSelectedDistrictPolygon();
    if (!distPolygon) return roadsGeoJSON;
    if (distPolygon.type === 'FeatureCollection' && distPolygon.features && distPolygon.features.length > 0) {
      distPolygon = distPolygon.features[0];
    }
    
    try {


      if (!distPolygon) return roadsGeoJSON;
      if (distPolygon.type === 'FeatureCollection' && (!distPolygon.features || distPolygon.features.length === 0)) return roadsGeoJSON;
      if (distPolygon.type === 'Feature' && (!distPolygon.geometry || !distPolygon.geometry.coordinates)) return roadsGeoJSON;
      
      const distBbox = turf.bbox(distPolygon);
      
      const filteredFeatures = roadsGeoJSON.features.filter((roadFeat: any) => {
        if (!roadFeat.geometry || !roadFeat.geometry.coordinates || roadFeat.geometry.coordinates.length === 0) return false;
        try {
          // Cepat: Cek bounding box dulu kawan!
          const roadBbox = turf.bbox(roadFeat);
          if (roadBbox[0] > distBbox[2] || roadBbox[2] < distBbox[0] ||
              roadBbox[1] > distBbox[3] || roadBbox[3] < distBbox[1]) {
             return false;
          }
          // Akurat: Cek interseksi spasial
          return turf.booleanIntersects(roadFeat, distPolygon);
        } catch (e) {
          return false;
        }
      });
      
      return {
        type: "FeatureCollection",
        features: filteredFeatures
      };
    } catch (e) {
      undefined;
      return roadsGeoJSON;
    }
  }, [roadsGeoJSON, props.selectedDistrictId, props.districts, getSelectedDistrictPolygon]);


  // Filter Layer Kustom (seperti layer tambak) Berdasarkan Kecamatan Terpilih Kawan!
  const dynamicSpatialLayersGeoJSON = useMemo(() => {
    const result: Record<string, any> = {};
    props.spatialLayers.forEach(layer => {
      // Skip sistem layer yang sudah ditangani khusus
      if (["layer_kecamatan", "layer_jalan", "layer_zonasi", "layer_potensi", "layer_desa"].includes(layer.id)) return;
      if (!layer.isActive || !layer.geojson) return;
      
      let normalized = normalizeGeoJSON(layer.geojson);
      if (!normalized || !normalized.type) return;

      // Clip logic jika ada kecamatan yang dipilih
      if (props.selectedDistrictId && normalized.type === "FeatureCollection" && normalized.features) {
         
         
         let distPolygon = getSelectedDistrictPolygon();
         if (distPolygon) {
             if (distPolygon.type === 'FeatureCollection' && distPolygon.features && distPolygon.features.length > 0) {
                 distPolygon = distPolygon.features[0];
             }


             try {
                const distBbox = turf.bbox(distPolygon);
                const filteredFeatures = normalized.features.filter((feat: any) => {
                   if (!feat.geometry || !feat.geometry.coordinates || feat.geometry.coordinates.length === 0) return false;
                   try {
                     // Cepat: Cek bounding box dulu kawan!
                     const featBbox = turf.bbox(feat);
                     if (featBbox[0] > distBbox[2] || featBbox[2] < distBbox[0] ||
                         featBbox[1] > distBbox[3] || featBbox[3] < distBbox[1]) {
                        return false;
                     }
                     // Akurat: Cek interseksi spasial
                     return turf.booleanIntersects(feat, distPolygon);
                   } catch (e) {
                     return false;
                   }
                });
                normalized = { ...normalized, features: filteredFeatures };
             } catch (e) {
                undefined;
             }
         }
      }

      result[layer.id] = normalized;
    });
    return result;
  }, [props.spatialLayers, props.selectedDistrictId, props.districts, getSelectedDistrictPolygon]);

  // Fitur Analisis Visual Peta: Menyorot tracer optimal titik investasi menuju Jaringan Jalan Utama Terdekat
  const visualRouteGeoJSON = useMemo(() => {
    if (!props.selectedInvestmentId || !roadsGeoJSON || !roadsGeoJSON.features || roadsGeoJSON.features.length === 0) {
      return null;
    }
    const inv = props.investments.find(i => String(i.id) === String(props.selectedInvestmentId));
    if (!inv || !inv.latitude || !inv.longitude) {
      return null;
    }

    try {
      const invPt = turf.point([inv.longitude, inv.latitude]);
      const snappedPoint = turf.nearestPointOnLine(roadsGeoJSON, invPt, { units: 'kilometers' });
      
      // Last-mile connection line connecting spatial location to network road
      const lastMileLine = turf.lineString([
        invPt.geometry.coordinates,
        snappedPoint.geometry.coordinates
      ]);
      lastMileLine.properties = { _type: 'last_mile_route' };
      (snappedPoint as any).properties = { _type: 'snapped_node' };

      return {
        type: "FeatureCollection",
        features: [lastMileLine, snappedPoint]
      };
    } catch (e) {
      undefined;
      return null;
    }
  }, [props.selectedInvestmentId, props.investments, roadsGeoJSON]);

  // cartography mask geometry (Inverted Polygon) untuk clipping area basemap saat cetak
  // (generateMapMask dipanggil di dalam ini atau di atas)
  const cartographyMaskGeoJSON = useMemo(() => {
    if (!props.isCartographyMode && !props.selectedVillageId && !props.selectedDistrictId) return null;
    let activeGeoJSON: any = null;

    if (props.selectedVillageId) {
       // Search village in layer_zonasi or similar village layer if available
       // But if fallback is needed, we will just use the village geojson if somehow attached
       const v = props.villages?.find(v => v.id === props.selectedVillageId);
       if (v?.geojson) activeGeoJSON = v.geojson;
       
       if (!activeGeoJSON) {
           const desaLayer = props.spatialLayers.find(l => l.id === "layer_zonasi" || l.id === "layer_desa");
           if (desaLayer && desaLayer.geojson && desaLayer.geojson.features) {
               const feat = desaLayer.geojson.features.find((f: any) => {
                   const featName = f.properties?.WADMKD || f.properties?.NAMOBJ || f.properties?.nama || f.properties?.Name || "";
                   return v && normalizeName(featName) === normalizeName(v.name);
               });
               if (feat) activeGeoJSON = feat;
           }
       }
    } else if (props.selectedDistrictId) {
       const d = props.districts?.find(d => d.id === props.selectedDistrictId);
       // Check if it exists in the layer directly
       const kecLayer = props.spatialLayers.find(l => l.id === "layer_kecamatan");
       if (kecLayer && kecLayer.geojson && kecLayer.geojson.features) {
           const feats = kecLayer.geojson.features.filter((f: any) => {
              const district = findDistrictForFeature(f);
              return district && district.id === props.selectedDistrictId;
           });
           if (feats.length > 0) {
               activeGeoJSON = { type: "FeatureCollection", features: feats };
           }
       }
       // Fallback
       if (!activeGeoJSON && d?.geojson) {
           activeGeoJSON = d.geojson;
       }
    }

    if (!activeGeoJSON) {
       undefined;
       return null;
    }

    return generateMapMask(activeGeoJSON);
  }, [props.isCartographyMode, props.selectedDistrictId, props.selectedVillageId, props.districts, props.villages]);

  // Compile spatial source data from database-tied spatial layers
  const districtsGeoJSON = useMemo(() => {
    const kecLayer = props.spatialLayers.find(l => l.id === "layer_kecamatan");
    if (!kecLayer || !kecLayer.geojson) return null;

    const geo = kecLayer.geojson;
    const features = geo.type === "FeatureCollection" ? geo.features : [geo];

    const processedFeatures = features.map((feat: any, idx: number) => {
      const district = findDistrictForFeature(feat);
      const val = getMetricValue(district);
      const color = props.choroplethMetric !== "none" ? getColor(val, props.choroplethMetric) : (kecLayer.color || "#e2e8f0");
      const opacity = props.selectedDistrictId && district && district.id === props.selectedDistrictId
        ? 0.15
        : (props.choroplethMetric === "none" ? 0.2 : 0.4);

      return {
        ...feat,
        properties: {
          ...feat.properties,
          _districtId: district?.id || null,
          _color: color,
          _opacity: opacity,
          _isSelected: district ? district.id === props.selectedDistrictId : false,
          _name: district?.name || feat.properties?.KECAMATAN || "Kecamatan"
        }
      };
    });

    return {
      type: "FeatureCollection" as const,
      features: processedFeatures
    };
  }, [props.spatialLayers, props.districts, props.choroplethMetric, props.selectedDistrictId, findDistrictForFeature, getMetricValue]);

  // Prepare database active investments for plotting
  const investmentsGeoJSON = useMemo(() => {
    const potLayer = props.spatialLayers?.find((l) => l.id === "layer_potensi");
    if (potLayer && potLayer.isActive === false) return null;

    if (!props.investments || props.investments.length === 0) return null;
    
    // Filter by sector if activeSectorFilter is specified kawan!
    const filteredInvestments = props.investments.filter(inv => {
      if (props.activeCategories && !props.activeCategories.includes(inv.sector)) {
        return false;
      }
      return true;
    });

    return {
      type: "FeatureCollection" as const,
      features: filteredInvestments.map(inv => ({
        type: "Feature" as const,
        id: inv.id,
        geometry: {
          type: "Point" as const,
          coordinates: [inv.longitude, inv.latitude]
        },
        properties: {
          id: inv.id,
          name: inv.name,
          sector: inv.sector,
          investmentValue: inv.investmentValue || 0,
          areaHa: inv.areaHa || 0,
          status: inv.status || "Published",
          iconEmoji: getIconForData((inv as any).subSector, inv.sector, "")
        }
      }))
    };
  }, [props.investments, props.spatialLayers, props.activeCategories]);

  // Ekstrak original geometry (polygon/line) dari potensi investasi untuk rendered layer kawan!
  const investmentsPolygonsGeoJSON = useMemo(() => {
    const potLayer = props.spatialLayers?.find((l) => l.id === "layer_potensi");
    if (potLayer && potLayer.isActive === false) return null;

    if (!props.investments || props.investments.length === 0) return null;
    
    // Filter by sector if activeSectorFilter is specified kawan!
    const filteredInvestments = props.investments.filter(inv => {
      if (props.activeCategories && !props.activeCategories.includes(inv.sector)) {
        return false;
      }
      return true;
    });

    const feats: any[] = [];
    filteredInvestments.forEach(inv => {
      if (inv.geometry && (inv.geometry.type === 'Polygon' || inv.geometry.type === 'MultiPolygon' || inv.geometry.type === 'LineString')) {
         feats.push({
           type: "Feature",
           id: inv.id,
           geometry: inv.geometry,
           properties: {
             id: inv.id,
             name: inv.name,
             sector: inv.sector,
             investmentValue: inv.investmentValue || 0,
             areaHa: inv.areaHa || 0,
             status: inv.status || "Published",
             layerType: 'investment-polygon'
           }
         });
      }
    });

    if (feats.length === 0) return null;

    return {
      type: "FeatureCollection" as const,
      features: feats
    };
  }, [props.investments, props.spatialLayers, props.activeCategories]);

  // Auto-Center Feature: Calculate Bounding Box of Filtered Investments
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    
    // We only want to auto-center if there's no explicitly selected investment/district/village
    if (props.selectedInvestmentId || props.selectedDistrictId || props.selectedVillageId) {
      return;
    }

    const potLayer = props.spatialLayers?.find((l) => l.id === "layer_potensi");
    if (potLayer && potLayer.isActive === false) return; // Don't auto center if the layer is not active

    const filteredInvestments = props.investments.filter(inv => {
      if (props.activeCategories && !props.activeCategories.includes(inv.sector)) {
        return false;
      }
      return true;
    });

    const map = mapRef.current.getMap();
    if (!map) return;

    if (filteredInvestments.length === 0) {
      // Empty State: return to Luwu Regency center view smoothly
      map.flyTo({
        center: [120.2, -3.0],
        zoom: 9,
        duration: 1500,
        essential: true
      });
      return;
    }

    if (filteredInvestments.length === 1) {
      // Single Marker
      const inv = filteredInvestments[0];
      map.flyTo({
        center: [inv.longitude, inv.latitude],
        zoom: 14,
        duration: 1500,
        essential: true
      });
      return;
    }

    // Calculate BBox for multiple markers
    try {
      const features: any[] = [];
      filteredInvestments.forEach(inv => {
        if (inv.geometry && (inv.geometry.type === 'Polygon' || inv.geometry.type === 'MultiPolygon' || inv.geometry.type === 'LineString')) {
           features.push({ type: 'Feature', geometry: inv.geometry });
        }
        // Always include the point just to be safe
        features.push({
           type: 'Feature',
           geometry: { type: 'Point', coordinates: [inv.longitude, inv.latitude] }
        });
      });
      
      const featureCollection = turf.featureCollection(features);
      const bbox = turf.bbox(featureCollection);

      map.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
          duration: 1500,
          essential: true
        }
      );
    } catch (e) {
      undefined;
    }
  }, [props.investments, props.activeCategories, props.spatialLayers, isMapLoaded, props.selectedInvestmentId, props.selectedDistrictId, props.selectedVillageId]);

  // ROAD HEATMAP DENSITY - Menyorot jaringan jalan berdasarkan proksimitas investasi
  const highlightedRoadsGeoJSON = useMemo(() => {
    if (props.heatmapMetric !== "road_density") return null;
    if (!displayRoadsGeoJSON || !displayRoadsGeoJSON.features) return null;
    if (!props.investments || props.investments.length === 0) return displayRoadsGeoJSON;

    try {
      const invPoints = turf.featureCollection(
        props.investments
          .filter(i => i.longitude && i.latitude)
          .map(i => turf.point([i.longitude, i.latitude]))
      );

      const scoredFeatures = displayRoadsGeoJSON.features.map((roadFeat: any) => {
        let score = 0;
        try {
            const roadBbox = turf.bbox(roadFeat);
            const extendedBbox = [roadBbox[0] - 0.05, roadBbox[1] - 0.05, roadBbox[2] + 0.05, roadBbox[3] + 0.05];
            
            const nearbyPoints = invPoints.features.filter((pt: any) => {
                const [lng, lat] = pt.geometry.coordinates;
                return lng >= extendedBbox[0] && lat >= extendedBbox[1] && lng <= extendedBbox[2] && lat <= extendedBbox[3];
            });

            if (nearbyPoints.length > 0) {
               nearbyPoints.forEach((pt: any) => {
                   const dist = turf.pointToLineDistance(pt, roadFeat, { units: 'kilometers' });
                   if (dist <= 2) {
                       score += 1;
                       if (dist <= 0.5) score += 2;
                   }
               });
            }
        } catch(e) {}

        return {
            ...roadFeat,
            properties: {
                ...roadFeat.properties,
                _investment_density: score
            }
        };
      });

      return {
          type: "FeatureCollection" as const,
          features: scoredFeatures
      };
    } catch (e) {
      undefined;
      return displayRoadsGeoJSON;
    }
  }, [props.heatmapMetric, displayRoadsGeoJSON, props.investments]);
  
  // Prepare infrastructure points for plotting
  const infrastructureGeoJSON = useMemo(() => {
    if (!props.showInfrastructure || !props.infrastructure || props.infrastructure.length === 0) return null;
    return {
      type: "FeatureCollection" as const,
      features: props.infrastructure.map((infra, idx) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [infra.longitude || infra.lng, infra.latitude || infra.lat]
        },
        properties: {
          id: infra.id || `infra-node-${idx}`,
          name: infra.name || 'Fasilitas Penunjang',
          type: infra.type || infra.amenity || 'Public Utility',
          iconEmoji: getIconForData("", "", infra.type || infra.amenity || "")
        }
      }))
    };
  }, [props.infrastructure, props.showInfrastructure]);

  // Active investments for markers excluding heatmap view
  const activeMarkers = useMemo(() => {
    const potLayer = props.spatialLayers?.find((l) => l.id === "layer_potensi");
    if (potLayer && potLayer.isActive === false) return [];

    if (props.heatmapMetric !== "none") return [];
    return props.investments.filter(inv => {
      if (props.activeCategories && !props.activeCategories.includes(inv.sector)) return false;
      return true;
    });
  }, [props.investments, props.activeCategories, props.heatmapMetric, props.spatialLayers]);

  const dynamicInteractiveLayerIds = useMemo(() => {
    const ids = [
      "kecamatan-layer", 
      "investments-layer", 
      "investments-layer-symbol",
      "investments-layer-halo",
      "investments-polygon-layer", 
      "investments-polygon-layer-line", 
      "investments-cluster", 
      "investments-cluster-count",
      "investments-cluster-glow",
      "infrastructure-layer",
      "spatial-layer-point-layer_potensi",
      "spatial-layer-fill-layer_potensi",
      "spatial-layer-stroke-layer_potensi"
    ];
    props.spatialLayers.forEach(layer => {
      if (layer.isActive) {
        ids.push(`spatial-layer-fill-${layer.id}`);
        ids.push(`spatial-layer-stroke-${layer.id}`);
        ids.push(`spatial-layer-point-${layer.id}`);
      }
    });
    return ids;
  }, [props.spatialLayers]);

  const lastClickTimestampRef = useRef<number>(0);

  // Click responses
  const handleMapClick = useCallback((event: any) => {
    const now = Date.now();
    if (now - lastClickTimestampRef.current < 250) {
      return;
    }
    lastClickTimestampRef.current = now;

    if (isMeasuring) {
      const { lngLat } = event;
      setMeasurePoints(prev => [...prev, [lngLat.lng, lngLat.lat]]);
      return;
    }

    if (props.isDigitizing) {
      const { lngLat } = event;
      props.setDigitizedPoints([...props.digitizedPoints, [lngLat.lng, lngLat.lat]]);
      return;
    }

    const map = mapRef.current?.getMap();
    if (!map) return;

    // Clear any active tooltip when clicking kawan!
    setHoverInfo(null);

    // Use the geographic lngLat to project to pixel coordinates on the map.
    // This is mathematically immune to High-DPR/DevicePixelRatio offsets on modern Android devices kawan!
    const clickPoint = event.lngLat ? map.project(event.lngLat) : event.point;
    if (!clickPoint) {
      return;
    }

    // Implement adaptive touch-target bounding box padding with generous touch target for mobile Android and Desktop
    const isTouchDevice = typeof window !== 'undefined' && (
      window.matchMedia("(pointer: coarse)").matches ||
      ('ontouchstart' in window) ||
      navigator.maxTouchPoints > 0
    );
    const paddingSize = isTouchDevice ? 72 : 24;
    const width = paddingSize;
    const height = paddingSize;
    const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
      [clickPoint.x - width / 2, clickPoint.y - height / 2],
      [clickPoint.x + width / 2, clickPoint.y + height / 2]
    ];

    const existingLayers = map.getStyle().layers?.map(l => l.id) || [];
    const candidateLayerIds = new Set([
      ...dynamicInteractiveLayerIds,
      ...existingLayers.filter(id =>
        id.startsWith("investments-") ||
        id.startsWith("spatial-layer-") ||
        id.includes("potensi") ||
        id.includes("investasi")
      )
    ]);
    const validLayersToQuery = Array.from(candidateLayerIds).filter(id => existingLayers.includes(id));
    if (validLayersToQuery.length === 0) return;

    // Query features within the padding bounding box (query all interactive layers)
    const rawFeatures = map.queryRenderedFeatures(bbox, { 
       layers: validLayersToQuery
    });

    // PRIORITIZE POTENSI INVESTMENT LAYERS (POLYGON & POINT) OVER BACKGROUND BOUNDARIES:
    const features = [...rawFeatures].sort((a: any, b: any) => {
      const aIsPotensi = a.layer.id.startsWith("investments-") || a.layer.id.includes("layer_potensi");
      const bIsPotensi = b.layer.id.startsWith("investments-") || b.layer.id.includes("layer_potensi");
      if (aIsPotensi && !bIsPotensi) return -1;
      if (!aIsPotensi && bIsPotensi) return 1;

      const aIsIcon = a.layer.id === "investments-layer" || a.layer.id === "investments-layer-symbol" || a.layer.id === "investments-layer-halo";
      const bIsIcon = b.layer.id === "investments-layer" || b.layer.id === "investments-layer-symbol" || b.layer.id === "investments-layer-halo";
      if (aIsIcon && !bIsIcon) return -1;
      if (!aIsIcon && bIsIcon) return 1;

      const aIsPoint = a.geometry?.type === "Point";
      const bIsPoint = b.geometry?.type === "Point";
      if (aIsPoint && !bIsPoint) return -1;
      if (!aIsPoint && bIsPoint) return 1;

      return 0;
    });

    // Clicked an investment cluster
    const clusterFeature = features.find(f => 
      f.layer.id === "investments-cluster" || 
      f.layer.id === "investments-cluster-count" || 
      f.layer.id === "investments-cluster-glow"
    );
    if (clusterFeature) {
      const clusterId = clusterFeature.properties?.cluster_id;
      const source = map.getSource('investments-source') as maplibregl.GeoJSONSource;
      const coords = (clusterFeature.geometry as any).coordinates;
      const center = coords && coords.length === 2 ? coords : [event.lngLat.lng, event.lngLat.lat];
      
      if (source && source.getClusterExpansionZoom && clusterId) {
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({
            center: center as [number, number],
            zoom: zoom,
            duration: 500
          });
        }).catch(() => {});
      } else {
         map.easeTo({
            center: center as [number, number],
            zoom: map.getZoom() + 2,
            duration: 500
         });
      }
      return;
    }

    // Check if clicked any investment layer (Polygon or Point Icon) or spatial layer_potensi
    const invFeature = features.find((f: any) => {
      const lid = f.layer.id;
      if (
        lid === "investments-layer" || 
        lid === "investments-layer-symbol" || 
        lid === "investments-layer-halo" || 
        lid === "investments-polygon-layer" || 
        lid === "investments-polygon-layer-line" ||
        lid === "spatial-layer-point-layer_potensi" ||
        lid === "spatial-layer-fill-layer_potensi" ||
        lid === "spatial-layer-stroke-layer_potensi"
      ) {
        return true;
      }
      if (lid.startsWith("spatial-layer-") && lid.includes("potensi")) {
        return true;
      }
      if (f.properties) {
        if (
          f.properties.nama_potensi ||
          f.properties.sektor_utama ||
          f.properties.investment_id ||
          f.properties.investmentId ||
          f.properties.investmentValue ||
          f.properties.estimasi_nilai
        ) {
          return true;
        }
      }
      return false;
    });

    if (invFeature && invFeature.properties) {
      if (event.originalEvent && typeof event.originalEvent.stopPropagation === 'function') {
        event.originalEvent.stopPropagation();
      }
      const targetId = invFeature.properties.id || 
                       invFeature.properties.investment_id || 
                       invFeature.properties.investmentId || 
                       invFeature.properties.project_id || 
                       invFeature.properties.projectId || 
                       invFeature.properties.nama_potensi ||
                       invFeature.properties.name ||
                       invFeature.properties.title ||
                       invFeature.id;
      
      const strId = targetId ? String(targetId) : (invFeature.properties.nama_potensi || invFeature.properties.name || "potensi");
      const found = props.investments.find(inv => 
        String(inv.id) === strId || 
        String(inv.name).toLowerCase() === strId.toLowerCase() ||
        (inv.name && invFeature.properties.nama_potensi && String(inv.name).toLowerCase() === String(invFeature.properties.nama_potensi).toLowerCase()) ||
        (inv.name && invFeature.properties.name && String(inv.name).toLowerCase() === String(invFeature.properties.name).toLowerCase())
      );
      const finalId = found ? String(found.id) : strId;

      if (props.setSelectedInvestmentId) {
        props.setSelectedInvestmentId(finalId);
      }
      setDetailModalInvestmentId(finalId);
      return;
    }

    // Clicked an infrastructure layer point
    const infraFeature = features.find(f => f.layer.id === "infrastructure-layer");
    if (infraFeature && infraFeature.properties && infraFeature.properties.id) {
      // Show popup for infrastructure removed
      return;
    }

    // Clicked a dynamic village fill polygon
    const desaFeature = features.find(f => f.layer.id === "spatial-layer-fill-layer_desa");
    if (desaFeature && desaFeature.properties && desaFeature.properties.id) {
      if (event.originalEvent) {
        event.originalEvent.stopPropagation();
      }
      const vId = desaFeature.properties.id;
      const dId = desaFeature.properties.districtId;
      if (dId && props.setSelectedDistrictId) props.setSelectedDistrictId(dId);
      if (props.setSelectedVillageId) props.setSelectedVillageId(vId);
      
      setHoverInfo({
        x: clickPoint.x,
        y: clickPoint.y,
        properties: desaFeature.properties,
        type: 'desa'
      });
      return;
    }

    // Clicked a dynamic district fill polygon
    const dtFeature = features.find(f => f.layer.id === "kecamatan-layer");
    if (dtFeature && dtFeature.properties && dtFeature.properties._districtId) {
      if (event.originalEvent) {
        event.originalEvent.stopPropagation();
      }
      const dId = dtFeature.properties._districtId;
      props.setSelectedDistrictId(dId);

      const district = props.districts.find(d => d.id === dId);
      if (district) {
         setHoverInfo({
           x: clickPoint.x,
           y: clickPoint.y,
           properties: dtFeature.properties,
           type: 'kecamatan'
         });
      }
      return;
    }
  }, [props.isDigitizing, props.digitizedPoints, props.setDigitizedPoints, props.districts, props.setSelectedDistrictId, props.setSelectedVillageId, props.setSelectedInvestmentId, isMeasuring, roadsGeoJSON, props.infrastructure, dynamicInteractiveLayerIds, props.investments, setActiveInvestmentData, setIsSmartModalOpen]);

  // Unified Native Click Listener + Android Touch Listener for 100% cross-device tap response kawan!
  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const handleNativeClick = (e: any) => {
      handleMapClick(e);
    };

    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length === 1) {
        touchStartTime = Date.now();
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchDuration = Date.now() - touchStartTime;
      // If tap lasted less than 450ms and moved < 15px, treat as clean tap on Android touchscreen
      if (touchDuration < 450 && e.changedTouches && e.changedTouches.length === 1) {
        const dx = Math.abs(e.changedTouches[0].clientX - touchStartPos.x);
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartPos.y);
        if (dx < 15 && dy < 15) {
          const canvas = map.getCanvas();
          const rect = canvas.getBoundingClientRect();
          const x = e.changedTouches[0].clientX - rect.left;
          const y = e.changedTouches[0].clientY - rect.top;
          const lngLat = map.unproject([x, y]);

          handleMapClick({
            point: { x, y },
            lngLat,
            originalEvent: e
          });
        }
      }
    };

    map.on('click', handleNativeClick);
    const canvas = map.getCanvas();
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      map.off('click', handleNativeClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMapLoaded, handleMapClick]);

  // Configure basemaps matching choices
  const mapStyleObj = useMemo(() => {
    switch (localMapMode) {
      case "light":
        return {
          version: 8,
          sources: {
            "carto-positron": {
              type: "raster" as const,
              tiles: [
                "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: "carto-positron-layer",
              type: "raster" as const,
              source: "carto-positron"
            }
          ]
        };
      case "satellite":
        return {
          version: 8,
          sources: {
            "google-satellite-alt": {
              type: "raster" as const,
              tiles: [
                "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                "https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                "https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: "esri-satellite-layer",
              type: "raster" as const,
              source: "google-satellite-alt"
            }
          ]
        };
      case "dark":
        return {
          version: 8,
          sources: {
            "carto-dark": {
              type: "raster" as const,
              tiles: [
                "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
                "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
                "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: "carto-dark-layer",
              type: "raster" as const,
              source: "carto-dark"
            }
          ]
        };
      case "google_satellite":
        return {
          version: 8,
          sources: {
            "google-satellite": {
              type: "raster" as const,
              tiles: [
                "https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                "https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                "https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: "google-satellite-layer",
              type: "raster" as const,
              source: "google-satellite"
            }
          ]
        };
      case "google_street":
        return {
          version: 8,
          sources: {
            "google-street": {
              type: "raster" as const,
              tiles: [
                "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
                "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
                "https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
                "https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: "google-street-layer",
              type: "raster" as const,
              source: "google-street"
            }
          ]
        };
      case "osm":
      default:
        return {
          version: 8,
          sources: {
            "osm-map": {
              type: "raster" as const,
              tiles: [
                "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              ],
              tileSize: 256,
              maxzoom: 19,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }
          },
          layers: [
            {
              id: "osm-map-layer",
              type: "raster" as const,
              source: "osm-map"
            }
          ]
        };
    }
  }, [localMapMode]);

  const handleToggle3D = () => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;
    
    const currentPitch = map.getPitch();
    
    if (currentPitch < 10) {
        // Transisi ke mode 3D (Miring)
        map.easeTo({ 
            pitch: 60, // Kemiringan kamera
            bearing: 30, // Rotasi peta
            duration: 1200 // Animasi transisi yang halus
        });
    } else {
        // Transisi kembali ke mode 2D (Datar menghadap Utara)
        map.easeTo({ 
            pitch: 0, 
            bearing: 0, 
            duration: 1200 
        });
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut({ duration: 300 });
    }
  };

  const handleResetBearing = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        bearing: 0,
        pitch: 0,
        duration: 800,
        essential: true
      });
    }
  };

  const handleResetView = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (mapRef.current) {
      let bbox: [number, number, number, number] = [119.78, -3.68, 120.65, -2.10];
      
      // Calculate exact bounding box if district spatial layer is available
      if (districtsGeoJSON && districtsGeoJSON.features && districtsGeoJSON.features.length > 0) {
        try {
          const computedBbox = turf.bbox(districtsGeoJSON);
          if (computedBbox && computedBbox.length === 4 && !computedBbox.some(isNaN)) {
            bbox = computedBbox as [number, number, number, number];
          }
        } catch (err) {
          undefined;
        }
      }

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      
      mapRef.current.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        {
          padding: isMobile 
            ? { top: 70, bottom: 80, left: 16, right: 16 }
            : { top: 80, bottom: 80, left: 60, right: 60 },
          pitch: 0,
          bearing: 0,
          duration: 1200,
          essential: true
        }
      );
    }

    resetViewState();
    setDetailModalInvestmentId(null);

    if (props.setSelectedDistrictId) props.setSelectedDistrictId(null);
    if (props.setSelectedInvestmentId) props.setSelectedInvestmentId(null);
    if (props.setSelectedVillageId) props.setSelectedVillageId(null);
  };

  // Determine the correct beforeId logically for MapLibre layer stacking hierarchy
  const maskBeforeId = useMemo(() => {
    // We want the mask UNDER these layers:
    if (districtsGeoJSON) return "kecamatan-layer";
    const zonasiLayer = props.spatialLayers.find(l => l.id === "layer_zonasi");
    if (zonasiLayer?.geojson) return "layer-zonasi";
    const jalanLayer = props.spatialLayers.find(l => l.id === "layer_jalan");
    if (jalanLayer?.geojson && props.heatmapMetric !== "road_density") return "layer-jalan";
    if (jalanLayer?.geojson && props.heatmapMetric === "road_density") return "layer-jalan-heatmap-glow";
    return undefined; // Top if nothing else exists
  }, [districtsGeoJSON, props.spatialLayers, props.heatmapMetric]);

  // Transition key for map mode and active layers count to trigger smooth transition overlay
  const transitionKey = `mode-${localMapMode}-layers-${props.spatialLayers.filter(l => l.isActive).length}`;

  return (
    <div className="w-full h-full relative z-0" id="map-parent-container">
      {/* Floating Camera Transition HUD Notification Banner */}
      <AnimatePresence>
        {cameraTargetNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[300] pointer-events-none"
          >
            <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 font-sans ${
              props.isDarkMode
                ? "bg-slate-950/90 text-white border-emerald-500/40 shadow-emerald-950/70"
                : "bg-white/95 text-slate-900 border-emerald-500/30 shadow-slate-900/15"
            }`}>
              <div className="relative flex h-3 w-3 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-500 dark:text-emerald-400 uppercase leading-none">
                  {t('mapCamera.hudTitle', 'TRANSISI KAMERA SPASIAL 3D')}
                </span>
                <span className="text-xs font-bold font-sans mt-0.5">
                  {t('mapCamera.focus', 'Fokus')} {cameraTargetNotice.type === "Kecamatan" ? t('mapCamera.districtType', 'Kecamatan') : cameraTargetNotice.type === "Perspektif Makro" ? t('mapCamera.macroPerspective', 'Perspektif Makro') : cameraTargetNotice.type}: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{cameraTargetNotice.name === "Seluruh Kabupaten Luwu" ? t('mapCamera.allLuwuRegency', 'Seluruh Kabupaten Luwu') : cameraTargetNotice.name}</strong>
                </span>
              </div>
              <Compass className="h-4 w-4 text-emerald-500 dark:text-emerald-400 animate-spin ml-1 shrink-0" style={{ animationDuration: "6s" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MapCrosshair isDarkMode={props.isDarkMode} />
      <MapLiveCoordinates viewState={viewState} isDarkMode={props.isDarkMode} />

      {/* Real-time A4 Print Frame Overlay */}
      {props.isPrintPreviewActive && (
        <div className="absolute inset-0 z-[500] pointer-events-none flex items-center justify-center bg-slate-950/35 backdrop-blur-[0.5px]">
          <div 
            className="border-2 border-dashed border-emerald-400 bg-transparent relative shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all duration-300"
            style={{
              width: props.printOrientation === "portrait" ? "calc(min(70vw, 70vh) * 0.707)" : "calc(min(70vw, 70vh) * 1.414)",
              height: props.printOrientation === "portrait" ? "calc(min(70vw, 70vh))" : "calc(min(70vw, 70vh) * 1)",
            }}
          >
            {/* Camera / Cartography Style Corner Marks */}
            <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-4 border-l-4 border-emerald-400"></div>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-4 border-r-4 border-emerald-400"></div>
            <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-4 border-l-4 border-emerald-400"></div>
            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-4 border-r-4 border-emerald-400"></div>

            {/* Dynamic visual indicator label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-700/90 text-white font-mono text-[9px] font-extrabold tracking-widest px-3 py-1 rounded-full shadow-lg border border-emerald-400 pointer-events-none uppercase whitespace-nowrap">
              AREA CETAK A4 ({props.printOrientation}) - 1:{props.printScale?.toLocaleString("id-ID")}
            </div>

            {/* Dynamic Center helper lines */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t border-dashed border-emerald-400/20"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] border-l border-dashed border-emerald-400/20"></div>

            {/* Instruction tooltip */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-100 font-sans text-[10px] font-bold tracking-wider px-3.5 py-1.5 rounded-xl shadow-xl border border-white/10 pointer-events-none text-center whitespace-nowrap">
              Geser & Zoom peta di belakang untuk menentukan wilayah cetak
            </div>
          </div>
        </div>
      )}

      {/* Modern Custom Zoom Controls */}
      <div className="absolute right-3 sm:right-4 bottom-32 md:bottom-28 z-[70] flex flex-col gap-2 font-sans select-none pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_32px_rgba(0,0,0,0.25)] rounded-2xl p-1.5 flex flex-col items-center gap-1.5 w-11">
          <button
            onClick={handleZoomIn}
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-emerald-500/15 dark:hover:bg-emerald-400/15 text-slate-800 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90 hover:scale-110 transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md"
            title={t('map.zoom_in', 'Zoom In')}
          >
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-emerald-500/15 dark:hover:bg-emerald-400/15 text-slate-800 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90 hover:scale-110 transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md"
            title={t('map.zoom_out', 'Zoom Out')}
          >
            <Minus className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
          <div className="w-5 h-[1px] bg-slate-200/50 dark:bg-slate-700/50" />
          <button
            onClick={handleResetBearing}
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-emerald-500/15 dark:hover:bg-emerald-400/15 text-slate-800 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90 hover:scale-110 transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md"
            title={t('map.reset_bearing', 'Reset Orientasi Utara (North-Up)')}
          >
            <Compass 
              className="h-4.5 w-4.5 stroke-[2.2] text-emerald-600 dark:text-emerald-400 transition-transform duration-300" 
              style={{ transform: `rotate(${-viewState.bearing}deg)` }}
            />
          </button>
          <button
            onClick={handleResetView}
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 hover:bg-emerald-500/20 dark:hover:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 active:scale-90 hover:scale-110 transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md"
            title={t('map.reset_view', 'Reset View')}
          >
            <Home className="h-4.5 w-4.5 stroke-[2.2]" />
          </button>
        </div>
      </div>
      {/* Floating Basemap Selector kawan */}
      {/* Mobile Basemap Toggle Button */}
      
        <button
          onClick={() => setShowBasemapSheet(!showBasemapSheet)}
          className="md:hidden absolute bottom-[80px] left-4 z-[70] px-3.5 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 pointer-events-auto transition-all duration-300 ease-in-out active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:border-emerald-500/50 text-slate-800 dark:text-emerald-400"
        >
          <Layers className="h-5 w-5" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider">Layer</span>
        </button>

      {/* Main Basemap Container (Bottom Sheet on Mobile, Floating on Desktop) */}
      <div 
        className={`fixed inset-x-0 bottom-24 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-[70] flex flex-col gap-3 md:gap-1.5 font-sans select-none items-center pointer-events-none w-full md:w-auto max-w-full md:max-w-[96vw] transform transition-transform duration-300 md:translate-y-0 ${
          showBasemapSheet ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="pointer-events-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/30 dark:border-slate-600/30 shadow-xl rounded-2xl p-1.5 sm:p-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-max">
          <div className="flex items-center gap-1 px-1 sm:mr-2 shrink-0">
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="text-[11.5px] font-black tracking-wide uppercase text-slate-900 dark:text-white">{t('mapControls.baseMap')}</span>
          </div>
          <div className="flex bg-slate-150/70 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-700/50">
            {[
              { id: "osm", labelShort: "OSM", label: t('mapControls.osmLabel', 'OSM (Publik/Investor)'), tooltip: t('mapControls.osmTooltip', 'Peta kaya Point of Interest (POI)') },
              { id: "light", labelShort: t('mapControls.minAdmin'), label: t('mapControls.minAdmin'), tooltip: t('mapControls.minAdminTooltip', 'Peta bersih Carto Positron') },
              { id: "dark", labelShort: t('mapControls.dark'), label: t('mapControls.dark'), tooltip: t('mapControls.darkTooltip', 'Peta Basemap Gelap') },
              { id: "satellite", labelShort: t('mapControls.satellite', 'Satelit'), label: t('mapControls.satellite', 'Satelit'), tooltip: t('mapControls.satelliteTooltip', 'Citra Satelit Esri') }
            ].map(item => (
              <button
                key={item.id}
                title={item.tooltip}
                onClick={() => setLocalMapMode(item.id as any)}
                className={`px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-[11.5px] font-bold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  localMapMode === item.id
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="inline sm:hidden">{item.labelShort}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="pointer-events-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/30 dark:border-slate-600/30 shadow-xl rounded-2xl w-max ml-auto mr-auto flex divide-x divide-slate-350 dark:divide-slate-705/10 overflow-hidden mb-6 md:mb-0">
           <button
             onClick={handleToggle3D}
             className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer border-0"
             title="Toggle 2D/3D View"
           >
             <Box className="h-4 w-4" /> 
             {t('mapControls.rotation')}
           </button>
           <button
             onClick={() => setIsAutoFollowEnabled(!isAutoFollowEnabled)}
             className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold transition-colors cursor-pointer border-0 ${isAutoFollowEnabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400'}`}
             title={t('mapControls.autoFollow', 'Auto-Follow Selected Project')}
           >
             <LocateFixed className="h-4 w-4" />
             {t('mapControls.autoFollow', 'Auto-Follow')}
           </button>
           <button
             onClick={handleResetView}
             className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer border-0"
             title={t('map.reset_view', 'Reset View')}
           >
             <Home className="h-4 w-4 text-emerald-500" /> 
             {t('mapControls.resetMap')}
           </button>
        </div>
      </div>

      {/* Smooth Style Switch Backdrop Overlay */}
      <AnimatePresence>
        {isStyleSwitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 z-[1050] bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-[4px] pointer-events-none flex items-center justify-center"
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 dark:bg-slate-900/95 text-white backdrop-blur-md border border-white/20 shadow-2xl">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-xs font-bold tracking-wide">{t("map.aligningBasemap", "Menyelaraskan Basemap Spasial...")}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Spatial Nav / Filter Transition Notification Badge */}
      <AnimatePresence>
        {mapTransitionNotification && (
          <motion.div
            initial={{ y: -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-20 md:top-6 left-1/2 -translate-x-1/2 z-[1020] pointer-events-none"
          >
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/85 dark:bg-slate-900/90 text-white backdrop-blur-xl border border-emerald-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              {mapTransitionNotification.type === "district" ? (
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="text-xs font-bold tracking-tight text-emerald-100">{mapTransitionNotification.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invisible HTML target observers corresponding to geographic bounds kawan */}
      <div 
        ref={observerContainerRef} 
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 z-0 select-none" 
        style={{ width: "100%", height: "100%" }}
        aria-hidden="true"
      >
        {props.spatialLayers.map(layer => {
          if (layer.id === "layer_kecamatan") return null;
          return (
            <div
              key={`observer-target-${layer.id}`}
              id={`observer-target-${layer.id}`}
              className="absolute pointer-events-none"
              style={{
                left: 0,
                top: 0,
                width: "1px",
                height: "1px"
              }}
            />
          );
        })}
      </div>

      <Map
        ref={mapRef}
        onClick={handleMapClick}
        // @ts-ignore
        preserveDrawingBuffer={true}
        dragRotate={true}
        touchPitch={true}
        touchZoomRotate={true}

        {...viewState}
        maxPitch={60}
        onMove={(evt) => updateViewState(evt.viewState as any)}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyleObj as any}
        interactiveLayerIds={dynamicInteractiveLayerIds}
        onMouseEnter={(e) => {
          if (e.features && e.features.length > 0) {
            const map = mapRef.current?.getMap();
            if (map) map.getCanvas().style.cursor = 'pointer';
          }
        }}
        onMouseLeave={() => {
          const map = mapRef.current?.getMap();
          if (map) map.getCanvas().style.cursor = '';
        }}
        onLoad={(evt) => {
          const map = evt.target;
          (window as any).globalLuwuMapInstance = map; // Export cleanly for headless PDF rendering system
          setIsMapLoaded(true);
          loadMapIcons(map); // <-- ADDED THIS
          try {
            if (map && !isNavControlAddedRef.current) {
              // Note: Repositioned to top-right to avoid overlapping custom glassmorphism bottom-right zoom controls
              map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
              isNavControlAddedRef.current = true;
            }
          } catch (e) {
            undefined;
          }
          
          // 2 & 3: EVENT MOUSEMOVE UNTUK MENANGKAP ATRIBUT & TOOLTIP KINETIK MAPLIBRE (GLOBAL HANDLER)
          let mouseMoveTimeout: any = null;
          let lastLngLat: maplibregl.LngLat | null = null;

          map.on('mousemove', (e: any) => {
              lastLngLat = e.lngLat;
              if (mouseMoveTimeout) clearTimeout(mouseMoveTimeout);

              mouseMoveTimeout = setTimeout(() => {
                if (!map || !map.getCanvas() || !lastLngLat) return;
                
                try {
                  const features = map.queryRenderedFeatures(map.project(lastLngLat));
                  const target = features.find((f: any) => 
                    f.layer.id === 'layer-jalan' || 
                    f.layer.id === 'layer-zonasi' ||
                    f.layer.id === 'investments-layer' ||
                    f.layer.id === 'investments-layer-symbol' ||
                    f.layer.id === 'investments-layer-halo' ||
                    f.layer.id === 'investments-polygon-layer' ||
                    f.layer.id === 'investments-polygon-layer-line' ||
                    f.layer.id.startsWith('spatial-layer-')
                  );

                  if (target) {
                      map.getCanvas().style.cursor = 'pointer';
                      const props = target.properties || {};
                      
                      let name = props.NAMOBJ || props.nama || props.zona || props.Kawasan || props.name || props.Nama_Desa || props.Name || props.KECAMATAN || 'Area Spasial';
                      
                      if (target.layer.id === 'layer-zonasi') {
                          name = props.keterangan || props.rpluwu2009 || props.zona || 'Zonasi Kawasan';
                      } else if (target.layer.id === 'layer-jalan') {
                          name = props.Nama_Ruas || props.Nama || props.Keterangan || props.REMARK || props.nama || props.name || 'Jalan Utama';
                      }

                      let luas = props.Luas || props.LUAS || props.LuasKM_BPS || props.Luas_GIS || props.SHAPE_Area || props.areaHa || 0;
                      
                      // Extract from KML description if present (stringified JSON or HTML blob)
                      let parsedDesc = "";
                      if (typeof props.description === 'string') {
                          try {
                              const obj = JSON.parse(props.description);
                              parsedDesc = obj.value || obj.text || props.description;
                          } catch (e) {
                              parsedDesc = props.description;
                          }
                      } else if (props.description && typeof props.description === 'object' && props.description.value) {
                          parsedDesc = props.description.value;
                      }

                      if (parsedDesc) {
                          if (parsedDesc.includes('Luas =')) {
                              const match = parsedDesc.match(/Luas = ([0-9.]+)/);
                              if (match && match[1]) luas = parseFloat(match[1]);
                          } else if (parsedDesc.includes('LUAS =')) {
                              const match = parsedDesc.match(/LUAS = ([0-9.]+)/);
                              if (match && match[1]) luas = parseFloat(match[1]);
                          }
                          
                          if (parsedDesc.includes('PL =')) {
                              const match = parsedDesc.match(/PL = ([^<]+)/);
                              if (match && match[1] && name === 'Area Spasial') name = match[1];
                          }
                      }
                      
                      const isLine = target.layer.id === 'layer-jalan' || (target.geometry && target.geometry.type && target.geometry.type.includes('Line'));
                      const isInvestment = target.layer.id === 'investments-layer' || target.layer.id === 'investments-layer-symbol' || target.layer.id === 'investments-layer-halo' || target.layer.id === 'investments-polygon-layer' || target.layer.id === 'investments-polygon-layer-line';
                      const isZonasi = target.layer.id === 'layer-zonasi';

                      if (isInvestment) {
                          setHoverInfo({ x: e.point.x, y: e.point.y, properties: props, type: 'investment' });
                      } else if (isZonasi) {
                          setHoverInfo({ x: e.point.x, y: e.point.y, properties: props, type: 'zonasi' });
                      } else if (isLine) {
                          setHoverInfo({ x: e.point.x, y: e.point.y, properties: props, type: 'line' });
                      } else {
                          setHoverInfo({ x: e.point.x, y: e.point.y, properties: props, type: 'other' });
                      }
                  } else {
                      map.getCanvas().style.cursor = '';
                      const current = hoverInfoRef.current;
                      if (!current || current.type !== 'kecamatan') {
                          setHoverInfo(null);
                      }
                  }
                } catch(e) {}
              }, 200); // Debounce duration 200ms
          });

        }}
      >
        <ScaleControl position="bottom-left" />

        {/* 0. Cartography Clipping Mask (Inverted Polygon) shifted to end for safe beforeId evaluation */}

        {/* 1. Kecamatan Polygons (Source & Layers tied directly kawan!) */}
        {districtsGeoJSON && (
          <Source id="kecamatan-source" type="geojson" data={districtsGeoJSON as any}>
            <Layer
              id="kecamatan-layer"
              type="fill"
              layout={{
                visibility: props.spatialLayers.find(l => l.id === "layer_kecamatan")?.isActive !== false ? 'visible' : 'none'
              }}
              paint={{
                "fill-color": ["get", "_color"],
                "fill-opacity": ["get", "_opacity"]
              }}
            />
            <Layer
              id="layer-batas-kecamatan-garis"
              type="line"
              layout={{
                visibility: props.spatialLayers.find(l => l.id === "layer_kecamatan")?.isActive !== false ? 'visible' : 'none',
                "line-join": "round",
                "line-cap": "round"
              }}
              paint={{
                "line-color": "#10b981",
                "line-width": 2.5,
                "line-opacity": 0.9,
                "line-dasharray": [3, 2]
              }}
            />
            <Layer
              id="labels-kecamatan"
              type="symbol"
              layout={{
                visibility: (props.spatialLayers.find(l => l.id === "layer_kecamatan")?.isActive !== false && !isDesaLayerActive) ? 'visible' : 'none',
                "text-field": ["get", "_name"],
                "text-font": ["Open Sans Bold"],
                "text-size": [
                  "interpolate", ["linear"], ["zoom"],
                  8, 10,
                  14, 16
                ],
                "text-allow-overlap": false,
                "text-ignore-placement": false
              }}
              paint={{
                "text-color": "#000000",
                "text-halo-color": "#ffffff",
                "text-halo-width": 2,
                "text-opacity": [
                  "step", ["zoom"],
                  0, 8,
                  1
                ]
              }}
            />
          </Source>
        )}

        {/* Village Boundaries (Batas Admin Desa) Custom Overlay */}
        {desaGeoJSON && (
          <Source id="desa-data" type="geojson" data={desaGeoJSON as any}>
            <Layer
              id="spatial-layer-line-layer_desa"
              type="line"
              layout={{
                visibility: isDesaLayerActive ? 'visible' : 'none',
                "line-join": "round",
                "line-cap": "round"
              }}
              paint={{
                "line-color": props.isDarkMode ? "#06b6d4" : "#10b981", // cyan for dark mode, emerald for light mode
                "line-width": 2.5,
                "line-opacity": 0.9,
                "line-dasharray": [2, 2]
              }}
            />
            <Layer
              id="spatial-layer-fill-layer_desa"
              type="fill"
              layout={{
                visibility: isDesaLayerActive ? 'visible' : 'none'
              }}
              paint={{
                "fill-color": "rgba(0, 0, 0, 0)",
                "fill-opacity": 0
              }}
            />
            <Layer
              id="labels-desa"
              type="symbol"
              layout={{
                visibility: isDesaLayerActive ? 'visible' : 'none',
                "text-field": [
                  "coalesce", 
                  ["get", "nama_desa"],
                  ["get", "NAMOBJ"],
                  ["get", "WADMKD"],
                  ["get", "Nama_Desa"],
                  ["get", "name"],
                  ["get", "nama"],
                  "Desa"
                ],
                "text-font": ["Open Sans Bold"],
                "text-size": [
                  "interpolate", ["linear"], ["zoom"],
                  9, 10,
                  14, 14
                ],
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                "text-transform": "uppercase"
              }}
              paint={{
                "text-color": "#000000",
                "text-halo-color": "#ffffff",
                "text-halo-width": 2,
                "text-opacity": [
                  "step", ["zoom"],
                  0, 9,
                  1
                ]
              }}
            />
          </Source>
        )}

        {/* 1.1 Zonasi Polygons (Kawasan) */}
        {finalZonasiGeoJSON && finalZonasiGeoJSON.features && finalZonasiGeoJSON.features.length > 0 && (
          <Source id="source-zonasi" type="geojson" data={finalZonasiGeoJSON as any}>
            <Layer
              id="layer-zonasi"
              type="fill"
              layout={{
                visibility: props.spatialLayers.some(l => 
                  (l.id === "layer_zonasi" || 
                   l.id === "layer_land_use_zoning" || 
                   l.id === "gis_zonasi" || 
                   l.id === "Zonasi Pemanfaatan Lahan") && 
                  l.isActive
                ) ? 'visible' : 'none'
              }}
              paint={{
                'fill-color': [
                  'match',
                  ['coalesce', ['get', 'keterangan'], ['get', 'rpluwu2009'], ''],
                  'Hutan Produksi Terbatas', '#22c55e',
                  'Hutan Produksi', '#16a34a',
                  'Hutan Lindung', '#14532d',
                  'Pemukiman Pedesaan', '#fde047',
                  'Pemukiman Perkotaan', '#eab308',
                  'Kawasan Industri', '#64748b',
                  'Pertanian Lahan Basah', '#a3e635',
                  'Pertanian Lahan Kering dan Perkebuna', '#d97706',
                  'Pertanian Lahan Kering dan Perkebunan', '#d97706',
                  'Perikanan', '#0ea5e9',
                  'Kawasan Lindung Setempat', '#059669',
                  // Lowercase/alternate fallbacks for safety
                  'hutan produksi terbatas', '#22c55e',
                  'hutan lindung', '#14532d',
                  'hutan produksi', '#16a34a',
                  'hutan', '#22c55e',
                  'kawasan industri', '#64748b',
                  'industri', '#64748b',
                  'kawasan peruntukan industri', '#64748b',
                  'pemukiman', '#fde047',
                  'permukiman', '#fde047',
                  'pemukiman pedesaan', '#fde047',
                  'pemukiman perkotaan', '#eab308',
                  'kawasan pemukiman', '#fde047',
                  'kawasan permukiman', '#fde047',
                  'sawah', '#a3e635',
                  'sawah irigasi', '#a3e635',
                  'pertanian', '#a3e635',
                  'pertanian lahan basah', '#a3e635',
                  'pertanian lahan kering dan perkebunan', '#d97706',
                  'pertanian lahan kering dan perkebuna', '#d97706',
                  'kawasan pertanian', '#a3e635',
                  'tambak', '#0ea5e9',
                  'perikanan', '#0ea5e9',
                  'budidaya perikanan', '#0ea5e9',
                  'sungai', '#0ea5e9',
                  'badan air', '#0ea5e9',
                  // Default
                  '#94a3b8'
                ],
                'fill-opacity': (() => {
                  const zLayer = props.spatialLayers.find(l => 
                    l.id === "layer_zonasi" || 
                    l.id === "layer_land_use_zoning" || 
                    l.id === "gis_zonasi" || 
                    l.id === "Zonasi Pemanfaatan Lahan"
                  );
                  const baseOpacity = zLayer && typeof zLayer.opacity === 'number' && !isNaN(zLayer.opacity) ? zLayer.opacity : 0.65;
                  return baseOpacity * 0.45;
                })(),
                'fill-outline-color': '#ffffff'
              }}
            />
            <Layer
              id="layer-zonasi-outline"
              type="line"
              layout={{
                visibility: props.spatialLayers.some(l => 
                  (l.id === "layer_zonasi" || 
                   l.id === "layer_land_use_zoning" || 
                   l.id === "gis_zonasi" || 
                   l.id === "Zonasi Pemanfaatan Lahan") && 
                  l.isActive
                ) ? 'visible' : 'none'
              }}
              paint={{
                'line-color': [
                  'match',
                  ['coalesce', ['get', 'keterangan'], ['get', 'rpluwu2009'], ''],
                  'Hutan Produksi Terbatas', '#15803d',
                  'Hutan Produksi', '#14532d',
                  'Hutan Lindung', '#064e3b',
                  'Pemukiman Pedesaan', '#a16207',
                  'Pemukiman Perkotaan', '#854d0e',
                  'Kawasan Industri', '#475569',
                  'Pertanian Lahan Basah', '#4d7c0f',
                  'Pertanian Lahan Kering dan Perkebuna', '#9a3412',
                  'Pertanian Lahan Kering dan Perkebunan', '#9a3412',
                  'Perikanan', '#0369a1',
                  'Kawasan Lindung Setempat', '#047857',
                  // Lowercase fallback
                  'hutan produksi terbatas', '#15803d',
                  'hutan lindung', '#064e3b',
                  'hutan produksi', '#14532d',
                  'hutan', '#15803d',
                  'kawasan industri', '#475569',
                  'industri', '#475569',
                  'kawasan peruntukan industri', '#475569',
                  'pemukiman', '#a16207',
                  'permukiman', '#a16207',
                  'pemukiman pedesaan', '#a16207',
                  'pemukiman perkotaan', '#854d0e',
                  'kawasan pemukiman', '#a16207',
                  'kawasan permukiman', '#a16207',
                  'sawah', '#4d7c0f',
                  'sawah irigasi', '#4d7c0f',
                  'pertanian', '#4d7c0f',
                  'pertanian lahan basah', '#4d7c0f',
                  'pertanian lahan kering dan perkebunan', '#9a3412',
                  'pertanian lahan kering dan perkebuna', '#9a3412',
                  'kawasan pertanian', '#4d7c0f',
                  'tambak', '#0369a1',
                  'perikanan', '#0369a1',
                  'budidaya perikanan', '#0369a1',
                  'sungai', '#0369a1',
                  'badan air', '#0369a1',
                  // Default
                  '#475569'
                ],
                'line-width': 2.5,
                'line-opacity': 0.9
              }}
            />
          </Source>
        )}

        {/* 1.2 Jalan Lines */}
        {displayRoadsGeoJSON && props.heatmapMetric !== "road_density" && (
          <Source id="source-jalan" type="geojson" data={displayRoadsGeoJSON as any}>
            <Layer
              id="layer-jalan"
              type="line"
              layout={{
                visibility: props.spatialLayers.find(l => l.id === "layer_jalan")?.isActive !== false ? 'visible' : 'none',
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#eab308',
                'line-width': 3,
                'line-opacity': 0.85
              }}
            />
          </Source>
        )}

        {/* 1.2B Jalan Lines (Heatmap Highlighted) */}
        {highlightedRoadsGeoJSON && props.heatmapMetric === "road_density" && (
          <Source id="source-jalan-heatmap" type="geojson" data={highlightedRoadsGeoJSON as any}>
            <Layer
              id="layer-jalan-heatmap-glow"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': [
                  'interpolate',
                  ['linear'],
                  ['get', '_investment_density'],
                  0, '#94a3b8',   // slate-400 for low density
                  1, '#f59e0b',   // amber-500
                  3, '#ef4444',   // red-500
                  6, '#9f1239'    // rose-900
                ],
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['get', '_investment_density'],
                  0, 2,
                  1, 4,
                  3, 6,
                  6, 8
                ],
                'line-opacity': [
                  'interpolate',
                  ['linear'],
                  ['get', '_investment_density'],
                  0, 0.4,
                  1, 0.8,
                  3, 1.0,
                  6, 1.0
                ]
              }}
            />
          </Source>
        )}

        {/* ANALISIS VISUAL RUTE SPASIAL (Last-mile Investment to Infrastructure Network) */}
        {visualRouteGeoJSON && (
          <Source id="source-visual-route" type="geojson" data={visualRouteGeoJSON as any}>
             <Layer
                id="layer-visual-route-line"
                type="line"
                filter={['==', '_type', 'last_mile_route']}
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round'
                }}
                paint={{
                  'line-color': '#10b981', // emerald-500
                  'line-width': 4,
                  'line-dasharray': [1, 2]
                }}
             />
             <Layer
               id="layer-visual-route-point"
               type="circle"
               filter={['==', '_type', 'snapped_node']}
               paint={{
                 'circle-radius': 6,
                 'circle-color': '#f59e0b', // amber-500
                 'circle-stroke-width': 3,
                 'circle-stroke-color': '#ffffff'
               }}
             />
          </Source>
        )}

        {/* 2. Dynamic DB Spatial layers overlay */}
        {props.spatialLayers.map((layer) => {
          if (layer.id === "layer_kecamatan") return null;
          if (layer.id === "layer_jalan") return null;
          if (layer.id === "layer_zonasi" || layer.id === "layer_land_use_zoning") return null;
          if (layer.id === "layer_desa") return null;
          if (!layer.isActive) return null;

          const normalized = dynamicSpatialLayersGeoJSON[layer.id];
          if (!normalized || !normalized.type) return null;

          const isLine = (layer.lineWidth && layer.lineWidth > 0);

          return (
            <React.Fragment key={layer.id}>
              <Source id={`spatial-source-${layer.id}`} type="geojson" data={normalized as any}>
                {/* Polygon Fill */}
                <Layer
                  id={`spatial-layer-fill-${layer.id}`}
                  type="fill"
                  filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
                  paint={{
                    "fill-color": layer.id === "layer_potensi" ? [
                      "match",
                      ["get", "sektor_utama"],
                      "Kelautan", "#3b82f6",
                      "Pertanian", "#10b981",
                      "Pertambangan", "#f59e0b",
                      "Perdagangan", "#8b5cf6",
                      "Pariwisata", "#ec4899",
                      layer.color || "#10b981"
                    ] : (layer.color || "#3b82f6"),
                    "fill-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity * 0.35 : 0.35,
                    "fill-opacity-transition": { duration: 300 },
                    "fill-outline-color": layer.color || "#1e3a8a",
                  }}
                />
                {/* Polygon/LineString Stroke */}
                <Layer
                  id={`spatial-layer-stroke-${layer.id}`}
                  type="line"
                  filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon'], ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']]}
                  paint={{
                    "line-color": layer.color || "#10b981", // default to emerald neon if not provided
                    "line-width": layer.lineWidth || 2.5,
                    "line-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 0.9,
                    "line-opacity-transition": { duration: 300 },
                  }}
                />
                {/* Point Circle */}
                <Layer
                  id={`spatial-layer-point-${layer.id}`}
                  type="circle"
                  filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
                  paint={{
                    "circle-color": layer.color || "#10b981",
                    "circle-radius": layer.id === "layer_infrastruktur" ? 8 : 6,
                    "circle-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1,
                    "circle-opacity-transition": { duration: 300 },
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1,
                    "circle-stroke-opacity-transition": { duration: 300 },
                  }}
                />
              </Source>
            </React.Fragment>
          );
        })}

        {/* 3. Native Heatmap Layer */}
        {props.heatmapMetric !== "none" && investmentsGeoJSON && (
          <Source id="investments-heat-source" type="geojson" data={investmentsGeoJSON as any}>
            <Layer
              id="investments-heat"
              type="heatmap"
              paint={{
                "heatmap-weight": [
                  "interpolate",
                  ["linear"],
                  ["get", "investmentValue"],
                  0, 0,
                  1000000000, 1
                ],
                "heatmap-intensity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0, 1,
                  15, 3
                ],
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0, "rgba(33,102,172,0)",
                  0.2, "rgb(103,169,207)",
                  0.4, "rgb(209,229,240)",
                  0.6, "rgb(253,219,199)",
                  0.8, "rgb(239,138,98)",
                  1, "rgb(178,24,43)"
                ],
                "heatmap-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0, 3,
                  15, 23
                ],
                "heatmap-opacity": typeof props.heatmapOpacity === 'number' && !isNaN(props.heatmapOpacity) ? props.heatmapOpacity : 0.68
              }}
            />
          </Source>
        )}

        {/* 4. Digitizer Line visualization */}
        {props.isDigitizing && props.digitizedPoints.length > 0 && (
          <Source
            id="digitizing-line-source"
            type="geojson"
            data={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: props.digitizedPoints
              },
              properties: {}
            }}
          >
            <Layer
              id="digitizing-lines"
              type="line"
              paint={{
                "line-color": "#ec4899",
                "line-width": 3,
                "line-dasharray": [2, 2]
              }}
            />
          </Source>
        )}

        {/* 5. Draw interactive digitized points */}
        {props.isDigitizing && props.digitizedPoints.map((pt, idx) => (
          <Marker
            key={`digit-point-${idx}`}
            longitude={pt[0]}
            latitude={pt[1]}
            anchor="center"
          >
            <div className="w-5 h-5 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-bold text-white font-mono animate-bounce">
              {idx + 1}
            </div>
          </Marker>
        ))}

        {/* 5.1 Measurement line and points */}
        {isMeasuring && measurePoints.length > 0 && (
          <>
            {measurePoints.length > 1 && (
              <Source
                id="measurement-line-source"
                type="geojson"
                data={{
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: measurePoints
                  },
                  properties: {}
                }}
              >
                <Layer
                  id="measurement-lines"
                  type="line"
                  paint={{
                    "line-color": "#3b82f6",
                    "line-width": 3,
                    "line-dasharray": [2, 1]
                  }}
                />
              </Source>
            )}
            {measurePoints.map((pt, idx) => (
              <Marker
                key={`measure-point-${idx}`}
                longitude={pt[0]}
                latitude={pt[1]}
                anchor="center"
              >
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </Marker>
            ))}
          </>
        )}

        {/* 5.5 Investment spatial polygons (from Supabase PostGIS geometry) */}
        {investmentsPolygonsGeoJSON && props.heatmapMetric === "none" && (
          <Source id="investments-polygon-source" type="geojson" data={investmentsPolygonsGeoJSON as any}>
            <Layer
              id="investments-polygon-layer"
              type="fill"
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
              paint={{
                "fill-color": [
                  "match",
                  ["get", "sector"],
                  "Kelautan", "#3b82f6",
                  "Pertanian", "#10b981",
                  "Pertambangan", "#f59e0b",
                  "Perdagangan", "#8b5cf6",
                  "Pariwisata", "#ec4899",
                  "#64748b"
                ],
                "fill-opacity": 0.45,
                "fill-outline-color": "#ffffff"
              }}
            />
            <Layer
              id="investments-polygon-layer-line"
              type="line"
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon'], ['==', ['geometry-type'], 'LineString']]}
              paint={{
                "line-color": [
                  "match",
                  ["get", "sector"],
                  "Kelautan", "#3b82f6",
                  "Pertanian", "#10b981",
                  "Pertambangan", "#f59e0b",
                  "Perdagangan", "#8b5cf6",
                  "Pariwisata", "#ec4899",
                  "#64748b"
                ],
                "line-width": 3,
                "line-opacity": 0.8
              }}
            />
          </Source>
        )}

        {/* 6. General interactive Investment Symbol Layer (Optimized Clustering + Minimalist Circle) */}
        {investmentsGeoJSON && props.heatmapMetric === "none" && (
          <Source 
            id="investments-source" 
            type="geojson" 
            data={investmentsGeoJSON as any}
            cluster={true} // BATCHING & OPTIMIZATION: Use clustering if points are very high
            clusterMaxZoom={14}
            clusterRadius={50}
            clusterProperties={{
              count_kelautan: ['+', ['case', ['==', ['get', 'sector'], 'Kelautan'], 1, 0]],
              count_pertanian: ['+', ['case', ['==', ['get', 'sector'], 'Pertanian'], 1, 0]],
              count_pertambangan: ['+', ['case', ['==', ['get', 'sector'], 'Pertambangan'], 1, 0]],
              count_perdagangan: ['+', ['case', ['==', ['get', 'sector'], 'Perdagangan'], 1, 0]],
              count_pariwisata: ['+', ['case', ['==', ['get', 'sector'], 'Pariwisata'], 1, 0]]
            }}
          >
            {/* Cluster Glow / Halo */}
            <Layer
              id="investments-cluster-glow"
              type="circle"
              filter={['has', 'point_count']}
              paint={{
                'circle-color': [
                  'step',
                  ['get', 'point_count'],
                  '#34d399', // emerald-400
                  10, '#14b8a6', // teal-500
                  50, '#0f172a'  // slate-900
                ],
                'circle-radius': ['step', ['get', 'point_count'], 24, 10, 28, 50, 34],
                'circle-blur': 1.5,
                'circle-opacity': 0.5
              }}
            />
            {/* Cluster Bubble */}
            <Layer
              id="investments-cluster"
              type="circle"
              filter={['has', 'point_count']}
              paint={{
                'circle-color': [
                  'step',
                  ['get', 'point_count'],
                  '#34d399', // emerald-400
                  10, '#14b8a6', // teal-500
                  50, '#0f172a'  // slate-900
                ],
                // Dynamically scale cluster bubble based on point count
                'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26],
                'circle-opacity': 0.95,
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-opacity': 0.8
              }}
            />
            {/* Cluster Text */}
            <Layer
              id="investments-cluster-count"
              type="symbol"
              filter={['has', 'point_count']}
              layout={{
                'text-field': '{point_count_abbreviated}',
                'text-size': 14,
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-anchor': 'center',
                'text-justify': 'center',
                'text-allow-overlap': true
              }}
              paint={{
                'text-color': '#ffffff',
                'text-halo-color': 'rgba(0,0,0,0.5)',
                'text-halo-width': 1
              }}
            />
            {/* Unclustered Marker - Premium Transparent Ring with Halo */}
            <Layer
              id="investments-layer-halo"
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={{
                "circle-color": [
                  "match",
                  ["get", "sector"],
                  "Kelautan", "#3b82f6",
                  "Pertanian", "#10b981",
                  "Pertambangan", "#f59e0b",
                  "Perdagangan", "#8b5cf6",
                  "Pariwisata", "#ec4899",
                  "#475569" // Fallback
                ],
                "circle-radius": 20,
                "circle-blur": 1.2,
                "circle-opacity": 0.45
              }}
            />
            {/* Unclustered Marker Icon Emojis */}
            <Layer
              id="investments-layer-symbol"
              type="symbol"
              filter={['!', ['has', 'point_count']]}
              layout={{
                'text-field': ['get', 'iconEmoji'],
                'text-size': 16,
                'text-allow-overlap': true,
                'text-ignore-placement': true,
                'text-justify': 'center',
                'text-anchor': 'center'
              }}
            />
            <Layer
              id="investments-layer"
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={{
                "circle-color": "rgba(255, 255, 255, 0.2)",
                "circle-radius": 18,
                "circle-stroke-width": 3.5,
                "circle-stroke-color": [
                  "match",
                  ["get", "sector"],
                  "Kelautan", "#3b82f6",
                  "Pertanian", "#10b981",
                  "Pertambangan", "#f59e0b",
                  "Perdagangan", "#8b5cf6",
                  "Pariwisata", "#ec4899",
                  "#475569" // Fallback
                ]
              }}
            />
          </Source>
        )}

        {/* 7. General interactive Infrastructure Symbol Layer */}
        {props.showInfrastructure && infrastructureGeoJSON && (
          <Source id="infrastructure-source" type="geojson" data={infrastructureGeoJSON as any}>
            <Layer
              id="infrastructure-layer-glow"
              type="circle"
              paint={{
                "circle-radius": [
                  "case",
                  ["boolean", ["feature-state", "hover"], false],
                  20,
                  0
                ],
                "circle-color": "#10b981",
                "circle-opacity": 0.6,
                "circle-blur": 0.8
              }}
            />
            <Layer
              id="infrastructure-layer"
              type="symbol"
              layout={{
                "icon-image": [
                  "match",
                  ["get", "type"],
                  "Rumah Sakit", "icon-kesehatan",
                  "Kesehatan", "icon-kesehatan",
                  "Sarana Pendidikan", "icon-pendidikan",
                  "Pendidikan", "icon-pendidikan",
                  "Pelabuhan", "icon-laut",
                  "Bandara", "icon-udara",
                  "Kantor Polisi", "icon-keamanan",
                  "Perkantoran Daerah", "icon-kantor",
                  "Kantor Camat", "icon-kantor",
                  "Kantor Desa", "icon-kantor",
                  "Fasilitas Umum", "icon-umum",
                  "Pusat Perdagangan", "icon-perdagangan",
                  "Toko / Swalayan", "icon-perdagangan",
                  "icon-default"
                ],
                "icon-allow-overlap": false,
                "icon-ignore-placement": false,
                "icon-pitch-alignment": "map",
                "icon-rotation-alignment": "map",
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10, 0.4,
                  15, 0.8
                ]
              }}
              paint={{
                "icon-opacity": 0.95
              }}
            />
          </Source>
        )}

        {/* 8. Unified tooltips on polygon / markers select removed */}

        {/* 7.6 PGROUTING SHORTEST PATH NETWORK ROUTE LAYER */}
        {props.networkRouteGeoJSON && (
          <Source id="source-network-route" type="geojson" data={props.networkRouteGeoJSON as any}>
            {/* Outer Glow / Casing */}
            <Layer
              id="layer-network-route-casing"
              type="line"
              filter={['==', ['get', '_type'], 'network_route_line']}
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#06b6d4', // cyan-500
                'line-width': 8,
                'line-opacity': 0.6,
                'line-blur': 2
              }}
            />
            {/* Main Glowing Line */}
            <Layer
              id="layer-network-route-line"
              type="line"
              filter={['==', ['get', '_type'], 'network_route_line']}
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#10b981', // emerald-500
                'line-width': 4.5
              }}
            />
            {/* Node Start Point Marker */}
            <Layer
              id="layer-network-route-start-node"
              type="circle"
              filter={['==', ['get', '_type'], 'route_node_start']}
              paint={{
                'circle-radius': 7,
                'circle-color': '#3b82f6', // blue-500
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff'
              }}
            />
            {/* Node End Point Marker */}
            <Layer
              id="layer-network-route-end-node"
              type="circle"
              filter={['==', ['get', '_type'], 'route_node_end']}
              paint={{
                'circle-radius': 8,
                'circle-color': '#f59e0b', // amber-500
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff'
              }}
            />
          </Source>
        )}

        {/* 7.5 SPATIAL PROXIMITY LINE (Dashed connecting line) */}
        {props.proximityLineString && (
          <Source id="source-proximity-line" type="geojson" data={props.proximityLineString as any}>
            <Layer
              id="layer-proximity-line"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#10b981', // emerald-500
                'line-width': 3,
                'line-dasharray': [2, 2], // dashed
                'line-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  8, 0,
                  9, 0.8,
                  22, 1
                ]
              }}
            />
          </Source>
        )}

        {/* BONUS: SPATIAL PROXIMITY BUFFER CIRCLE */}
        {props.proximityBufferGeoJSON && (
          <Source id="source-proximity-buffer" type="geojson" data={props.proximityBufferGeoJSON as any}>
            <Layer
              id="layer-proximity-buffer-fill"
              type="fill"
              paint={{
                'fill-color': '#10b981', // emerald-500
                'fill-opacity': 0.15, // elegant, semi-transparent translucent buffer
                'fill-outline-color': '#10b981'
              }}
            />
            <Layer
              id="layer-proximity-buffer-outline"
              type="line"
              paint={{
                'line-color': '#10b981', // emerald-500
                'line-width': 1.5,
                'line-dasharray': [4, 4], // dotted/dashed border
                'line-opacity': 0.7
              }}
            />
          </Source>
        )}

        {/* 0. Cartography Clipping Mask (Inverted Polygon) shifted to end for safe beforeId evaluation */}
        {cartographyMaskGeoJSON && (
          <Source id="cartography-mask-source" type="geojson" data={cartographyMaskGeoJSON as any}>
            <Layer
              id="cartography-mask-layer"
              type="fill"
              beforeId={maskBeforeId}
              paint={{
                "fill-color": "#ffffff",
                "fill-opacity": 1.0,
                "fill-outline-color": "transparent"
              }}
            />
          </Source>
        )}

        {/* 9. Mapbox GL Draw Layer */}
        {hoverInfo && <HoverTooltip hoverInfo={hoverInfo} investments={props.investments} villages={props.villages} />}
        {props.enableDrawControl && (
          <DrawControl
            ref={drawRef}
            position="top-right"
            styles={drawStyles}
            displayControlsDefault={false}
            controls={{
              polygon: false,
              line_string: false,
              point: false,
              trash: true // 2.3 Wire Draw Controls explicitly
            }}
            defaultMode="simple_select"
            onCreate={onDrawUpdate}
            onUpdate={onDrawUpdate}
            onDelete={onDrawDelete}
          />
        )}
      
        {props.onToggleLayerVis && (
          <LayerLegendControl 
            spatialLayers={props.spatialLayers} 
            onToggleLayerVis={props.onToggleLayerVis} 
            onChangeLayerOpacity={props.onChangeLayerOpacity}
            isDarkMode={props.isDarkMode ?? false} 
          />
        )}
      </Map>

      {/* Subtitle animation overlay that triggers on mode/layer change kawan */}
      <AnimatePresence>
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0.15 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 z-[5] pointer-events-none bg-slate-900/10 dark:bg-white/10 backdrop-blur-[1px]"
        />
      </AnimatePresence>

      {/* Floating control of digitizing status indicator */}
      {props.isDigitizing && (
        <div className="absolute top-20 left-4 z-20 px-3.5 py-2 bg-rose-600 border border-rose-500 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-pulse font-sans">
          <span>🛑</span> MODE DIGITASI AKTIF (Sila klik koordinat pada peta)
        </div>
      )}

      {/* Embedded Floating Map Legend wrapper */}
      {props.showLegend && (
        <MapLegend
          spatialLayers={props.spatialLayers}
          heatmapMetric={props.heatmapMetric}
          choroplethMetric={props.choroplethMetric as any}
          activeCategories={props.activeCategories}
          investments={props.investments}
          onToggleCategory={props.onToggleCategory}
          onToggleLayerVis={props.onToggleLayerVis}
          onChangeLayerOpacity={props.onChangeLayerOpacity}
          onChangeLayerColor={props.onChangeLayerColor}
          onReorderSpatialLayers={props.onReorderSpatialLayers}
          isDarkMode={props.isDarkMode}
        />
      )}

      {/* --- SMART INVESTMENT MODAL --- */}
      {isSmartModalOpen && activeInvestmentData && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col font-sans border border-slate-200/50 dark:border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-50 dark:bg-zinc-800 px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-700/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-none">
                    <AutoTranslatedText text={activeInvestmentData.name || t('mapModal.title', 'Lokasi Investasi')} inline />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
                    {t('mapModal.subtitle', 'INTEGRATED SMART RADAR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSmartModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
                title={t('common.close', 'Tutup')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px] overflow-y-auto">
              
              {/* Column Left: Investment Profile */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Info className="w-3.5 h-3.5" /> {t('mapModal.profileTitle', 'PROFIL INVESTASI')}
                  </h4>
                  <div className="space-y-4">
                    
                    <div className="p-0 bg-transparent rounded-none border-0 shadow-none">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-medium tracking-wider">{t('mapModal.sectorDominant', 'SEKTOR DOMINAN')}</span>
                      <div className="font-medium text-sm text-slate-800 dark:text-zinc-200 mt-1">
                        <AutoTranslatedText text={activeInvestmentData.sektor || activeInvestmentData.category || t('mapModal.unclassified', 'Belum Diklasifikasi')} inline />
                      </div>
                    </div>

                    <div className="p-0 bg-transparent rounded-none border-0 shadow-none">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-medium tracking-wider">{t('mapModal.estValue', 'ESTIMASI KAPASITAS / NILAI')}</span>
                      <div className="font-medium text-sm text-slate-800 dark:text-zinc-200 mt-1">
                        {activeInvestmentData.estimatedValue ? formatRupiahSingkat(activeInvestmentData.estimatedValue) : t('mapModal.noData', 'Data tidak tersedia')}
                      </div>
                    </div>
                    
                    <div className="p-0 bg-transparent rounded-none border-0 shadow-none">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-medium tracking-wider">{t('mapModal.locationDesc', 'DESKRIPSI LOKASI')}</span>
                      <div className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-1">
                        <AutoTranslatedText text={activeInvestmentData.description || t('mapModal.noDetailedDesc', 'Tidak ada deskripsi detail untuk titik tata ruang ini.')} />
                      </div>
                    </div>

                  </div>
                </div>

                <div>
                   <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                     LAST-MILE ROAD ACCESS
                   </h4>
                   <div className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: activeInvestmentData.lastMileInfo?.warnaStatus, backgroundColor: `${activeInvestmentData.lastMileInfo?.warnaStatus}0a` }}>
                      <div>
                        <span className="text-[10px] font-bold tracking-wider" style={{ color: activeInvestmentData.lastMileInfo?.warnaStatus }}>{t('mapModal.connectivityStatus', 'STATUS KONEKTIVITAS')}</span>
                        <div className="font-bold text-sm mt-0.5" style={{ color: activeInvestmentData.lastMileInfo?.warnaStatus }}>
                           <AutoTranslatedText text={activeInvestmentData.lastMileInfo?.statusTeks || ""} inline />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold font-mono tracking-tight text-slate-800 dark:text-white">
                           {activeInvestmentData.lastMileInfo?.jarakKM}
                        </span>
                        <span className="text-xs text-slate-500 font-bold ml-1">KM</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Column Right: Turf.js Radar Results */}
              <div>
                 <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                     <Layers className="w-3.5 h-3.5" /> {t('mapModal.radarTitle', 'TURF.JS MULTI-SECTOR RADAR')}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mb-3 leading-relaxed italic">
                    {t('mapModal.radarDesc', 'ℹ️ Jarak dihitung lurus (Euclidean/Air Distance).')}
                  </p>
                  
                  <div className="space-y-2">
                    {activeInvestmentData.radarResults && Object.keys(activeInvestmentData.radarResults).length > 0 ? (
                      Object.entries(activeInvestmentData.radarResults).sort(([,a]: any, [,b]: any) => a.distance - b.distance).map(([type, data]: any) => (
                         <div key={type} className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/60 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors cursor-default">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                                 {t('mapModal.nearestRadius', 'Radius {{type}} Terdekat', { type })}
                               </span>
                               <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[180px]">
                                 <AutoTranslatedText text={data.name} inline />
                               </span>
                            </div>
                            <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-zinc-800">
                               <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                 {data.distance === Infinity ? "N/A" : (data.distance / 1000).toFixed(2)}
                               </span>
                               <span className="text-[9px] font-bold text-slate-400">KM</span>
                            </div>
                         </div>
                      ))
                    ) : (
                       <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-zinc-700 rounded-xl text-center">
                          <Box className="w-8 h-8 text-slate-300 dark:text-zinc-600 mb-2" />
                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{t('mapModal.radarNoData', 'Radar tidak menemukan infrastruktur di sekitar.')}</p>
                       </div>
                    )}
                  </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-zinc-800/80 px-6 py-3 border-t border-slate-100 dark:border-zinc-700/50 text-[10px] text-slate-400 dark:text-zinc-500 font-medium flex justify-between items-center">
              <span>SIMPUL SPASIAL TATA RUANG (GOV-ECOSYSTEM)</span>
              <span>Powered by Turf.js & GeoJSON</span>
            </div>
          </div>
        </div>
      )}
      
      {isAiModalOpen && selectedInvestmentForAI && (
        <SpatialBufferAiModal
          isOpen={isAiModalOpen}
          selectedInvestment={selectedInvestmentForAI as any}
          onClose={() => setIsAiModalOpen(false)}
          districts={props.districts}
          villages={props.villages}
          onFocusCoordinate={() => {}}
          isDarkMode={props.isDarkMode || false}
        />
      )}
    </div>
  );
});

export default MaplibreComponent;// ux polish: implement mobile bottom sheet for basemap selector
// ui hotfix: enforce mobile z-index hierarchy

// architecture pivot: implement strict mobile-first responsive design

// ux polish: enable native maplibre touch gestures
