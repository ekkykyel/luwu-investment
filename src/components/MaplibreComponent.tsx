import { motion, AnimatePresence } from "motion/react";
import React, { useState, useCallback, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

// Helper to guarantee a FeatureCollection for MapLibre
function forceFeatureCollection(data: any): GeoJSON.FeatureCollection {
  if (!data) return { type: "FeatureCollection", features: [] };
  
  // If it's a string from RPC, parse it
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch(e) {
      return { type: "FeatureCollection", features: [] };
    }
  }

  if (Array.isArray(data)) {
    return { type: "FeatureCollection", features: data };
  }
  
  if (data.type === "FeatureCollection") {
    return { type: "FeatureCollection", features: data.features || [] };
  }
  
  if (data.type === "Feature") {
    return { type: "FeatureCollection", features: [data] };
  }
  
  return { type: "FeatureCollection", features: [] };
}

import { useTranslation } from "react-i18next";
import { normalizeGeoJSON, normalizeDistrictName, normalizeName } from "../utils/geoUtils";
import { spatialWorkerClient } from "../utils/spatialWorkerClient";
import { BoundingBox } from "../utils/spatialPartitionEngine";
import Map, { Source, Layer, Marker, Popup, NavigationControl, MapRef } from "react-map-gl/maplibre";
import { InvestmentDetailModal } from "./InvestmentDetailModal";
import { lazyWithRetry } from "../utils/lazyWithRetry";
const SpatialBufferAiModal = lazyWithRetry(() => import("./SpatialBufferAiModal"));
import HoverTooltip from "./HoverTooltip";
import AutoTranslatedText from "./AutoTranslatedText";

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
import { District, Investment, GeoJSONLayer, SektorInvestasi, Village, Role } from "../types";
import { Compass, Home, Plus, Minus, MapPin, Loader2, HelpCircle, LocateFixed, Info, X, Layers, Settings, Eye, EyeOff, Box, Crop, Trash2, Ruler, Fish, Tractor, Pickaxe, Factory, Tent, Sparkles, ChevronDown, Maximize, Globe, RefreshCw } from "lucide-react";
import MapLegend from "./MapLegend";
import LayerLegendControl from "./LayerLegendControl";
import MapCrosshair from "./MapCrosshair";
import MapLiveCoordinates from "./MapLiveCoordinates";
import DrawControl from "./DrawControl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { formatNumber, formatRupiahSingkat } from "../lib/formatters";
import { supabase } from "../lib/supabaseClient";
import { useMapState } from "../hooks/useMapState";

const tooltipCache: Record<string, any> = {};
const LUWU_BBOX: [[number, number], [number, number]] = [[119.85, -3.70], [120.65, -2.45]];

export interface MapComponentProps {
  networkRouteGeoJSON?: any;
  proximityLineString?: any;
  currentRole?: Role;
  districts?: District[];
  villages?: Village[];
  investments?: Investment[];
  spatialLayers?: GeoJSONLayer[];
  infrastructure?: any[];
  selectedDistrictId?: string | null;
  setSelectedDistrictId?: (id: string | null) => void;
  selectedVillageId?: string | null;
  setSelectedVillageId?: (id: string | null) => void;
  selectedInvestmentId?: string | null;
  setSelectedInvestmentId?: (id: string | null) => void;
  heatmapMetric?: "count" | "value" | "density" | "road_density" | "none";
  heatmapOpacity?: number;
  choroplethMetric?: "value" | "density" | "infrastructure" | "suitability" | "none";
  activeChoroplethFilter?: string | null;
  onToggleChoroplethFilter?: (color: string | null) => void;
  onEditInvestment?: (inv: Investment) => void;
  isDigitizing?: boolean;
  digitizedPoints?: [number, number][];
  setDigitizedPoints?: (pts: [number, number][]) => void;
  enableDrawControl?: boolean;
  onDrawComplete?: (geoJson: any) => void;
  mapMode?: "osm" | "light" | "dark" | "satellite" | "google_satellite" | "google_street";
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
  activeWorkspace?: string;
  isTourHudVisible?: boolean;
  setIsTourHudVisible?: (visible: boolean) => void;
  isTemporalGisActive?: boolean;
  showInfrastructure?: boolean;
  isAiPanelOpen?: boolean;
  proximityBufferGeoJSON?: any;
  isPrintPreviewActive?: boolean;
  onOpenSuitabilityModal?: () => void;
  printScale?: number;
  printOrientation?: "portrait" | "landscape";
  isLayerPanelOpen?: boolean;
  setIsLayerPanelOpen?: (open: boolean) => void;
  isLeftSidebarOpen?: boolean;
  customGeoJson?: any;
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
        (f.features || []).forEach((child: any) => {
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
  setLayerVisibility?: (layerId: string, isVisible: boolean) => void;
  hasSource?: (sourceId: string) => boolean;
  resizeMap?: () => void;
  fitBounds?: (bounds: any, options?: any) => void;
}

const MaplibreComponent = React.memo(forwardRef<MapComponentRef, MapComponentProps>((props, ref) => {
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

  // TILE-BASED RENDERING & SPATIAL PARTITIONING STATE
  const [viewportBbox, setViewportBbox] = useState<BoundingBox | null>(null);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(9.5);
  const [partitionedZonasiGeoJSON, setPartitionedZonasiGeoJSON] = useState<any>(null);
  const [partitionedDesaGeoJSON, setPartitionedDesaGeoJSON] = useState<any>(null);
  const [partitionedDynamicLayers, setPartitionedDynamicLayers] = useState<Record<string, any>>({});

  const updateViewportBounds = useCallback(() => {
    if (!mapRef.current) return;
    try {
      const map = mapRef.current.getMap();
      if (!map) return;
      const bounds = map.getBounds();
      if (bounds) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        setViewportBbox([sw.lng, sw.lat, ne.lng, ne.lat]);
        setCurrentMapZoom(map.getZoom());
      }
    } catch (e) {
      // fallback
    }
  }, []);

  const [selectedZoneFeature, setSelectedZoneFeature] = useState<{
    geometry: any;
    properties: any;
    id?: string;
    name?: string;
    lngLat?: [number, number];
  } | null>(null);

  // Measurement tool state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measureDistance, setMeasureDistance] = useState<number>(0);

  // Force sync state for database synchronization
  const [isForceSyncing, setIsForceSyncing] = useState(false);

  const handleForceSync = useCallback(async () => {
    if (isForceSyncing) return;
    setIsForceSyncing(true);
    try {
      if (props.onRefreshData) {
        await props.onRefreshData();
      }
    } catch (err) {
      console.error("Force sync database failed:", err);
    } finally {
      setTimeout(() => setIsForceSyncing(false), 800);
    }
  }, [isForceSyncing, props.onRefreshData]);

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
    fitBounds: (bounds: [number, number, number, number] | [[number, number], [number, number]], options?: any) => {
      if (mapRef.current) {
        try {
          const mapInstance = (mapRef.current as any).getMap ? (mapRef.current as any).getMap() : mapRef.current;
          mapInstance.fitBounds(bounds, {
            padding: 50,
            duration: 1500,
            essential: true,
            maxZoom: 15,
            ...options
          });
        } catch (e) {
          try {
            mapRef.current.fitBounds(bounds as any, {
              padding: 50,
              duration: 1500,
              essential: true,
              maxZoom: 15,
              ...options
            });
          } catch (err) {
            undefined;
          }
        }
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
    toggle3D: () => {
      handleToggle3D();
    },
    resetView: () => {
      handleResetView();
    },
    toggleMeasure: () => {
      setIsMeasuring(!isMeasuring);
      if (isMeasuring) {
        setMeasurePoints([]);
        setMeasureDistance(0);
      }
    },
    setLayerVisibility: (layerId: string, isVisible: boolean) => {
      try {
        const map = mapRef.current?.getMap();
        if (!map) return;
        const candidateLayerIds = [
          layerId,
          `spatial-layer-fill-${layerId}`,
          `spatial-layer-stroke-${layerId}`,
          `spatial-layer-point-${layerId}`,
          layerId === 'layer_zonasi' || layerId === 'layer_land_use_zoning' ? 'layer-zonasi' : '',
          layerId === 'layer_zonasi' || layerId === 'layer_land_use_zoning' ? 'layer-zonasi-outline' : '',
          layerId === 'layer_rbi' ? 'layer-rbi-admin' : '',
          layerId === 'layer_rbi' ? 'layer-rbi-roads' : '',
          layerId === 'layer_jalan' ? 'layer-jalan' : '',
          layerId === 'layer_jalan' ? 'layer-jalan-glow' : '',
          layerId === 'layer_desa' ? 'layer-batas-desa' : '',
          layerId === 'layer_desa' ? 'layer-batas-desa-glow' : '',
          layerId === 'layer_kecamatan' ? 'kecamatan-layer' : '',
          layerId === 'layer_kecamatan' ? 'kecamatan-border' : '',
        ].filter(Boolean);

        candidateLayerIds.forEach(targetId => {
          if (map.getLayer(targetId)) {
            try {
              const mapLayer = map.getLayer(targetId);
              const layerType = mapLayer.type;
              const opacityProp = layerType === 'fill' ? 'fill-opacity' :
                                layerType === 'line' ? 'line-opacity' :
                                layerType === 'circle' ? 'circle-opacity' :
                                layerType === 'symbol' ? 'text-opacity' :
                                layerType === 'raster' ? 'raster-opacity' : null;

              if (opacityProp) {
                // Enable 400ms smooth opacity transition
                map.setPaintProperty(targetId, `${opacityProp}-transition` as any, { duration: 400, delay: 0 });

                if (isVisible) {
                  map.setLayoutProperty(targetId, 'visibility', 'visible');
                  const targetOpacity = opacityProp === 'fill-opacity' ? 0.5 : opacityProp === 'line-opacity' ? 0.85 : 1.0;
                  map.setPaintProperty(targetId, opacityProp, targetOpacity);
                } else {
                  map.setPaintProperty(targetId, opacityProp, 0);
                  setTimeout(() => {
                    try {
                      if (map.getLayer(targetId) && map.getPaintProperty(targetId, opacityProp) === 0) {
                        map.setLayoutProperty(targetId, 'visibility', 'none');
                      }
                    } catch (e) {}
                  }, 420);
                }
              } else {
                map.setLayoutProperty(targetId, 'visibility', isVisible ? 'visible' : 'none');
              }
            } catch (e) {
              // Ignore if property transition fails
            }
          }
        });
      } catch (e) {
        undefined;
      }
    },
    hasSource: (sourceId: string) => {
      try {
        const map = mapRef.current?.getMap();
        if (!map) return false;
        return !!(map.getSource(sourceId) || map.getSource(`spatial-source-${sourceId}`));
      } catch (e) {
        return false;
      }
    }
  }), [isMeasuring]);

  // Smart Modal States
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [activeInvestmentData, setActiveInvestmentData] = useState<any>(null);

  // Active selected investment & dynamic sector coloring for Ripple Pulse Beacon
  const getCoordinates = useCallback((inv: any): [number, number] | null => {
    if (!inv) return null;
    let lng = Number(inv.longitude);
    let lat = Number(inv.latitude);
    if ((isNaN(lng) || isNaN(lat) || (lng === 0 && lat === 0)) && inv.geometry?.coordinates) {
      if (Array.isArray(inv.geometry.coordinates) && inv.geometry.coordinates.length >= 2) {
        lng = Number(inv.geometry.coordinates[0]);
        lat = Number(inv.geometry.coordinates[1]);
      }
    }
    if (!isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0) {
      return [lng, lat];
    }
    return null;
  }, []);

  const selectedInvestment = useMemo(() => {
    if (!props.selectedInvestmentId || !props.investments) return null;
    return props.investments.find(i => String(i.id) === String(props.selectedInvestmentId)) || null;
  }, [props.selectedInvestmentId, props.investments]);

  const selectedInvestments = useMemo(() => {
    if (!props.selectedInvestmentId || !props.investments || props.investments.length === 0) return [];
    const targetIds = String(props.selectedInvestmentId)
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    if (targetIds.length === 0) return [];
    
    const matches = props.investments.filter(i => 
      targetIds.includes(String(i.id).toLowerCase()) ||
      targetIds.includes(String(i.name).toLowerCase())
    );
    if (matches.length > 0) return matches;

    const single = props.investments.find(i => 
      String(i.id) === String(props.selectedInvestmentId) ||
      String(i.name).toLowerCase() === String(props.selectedInvestmentId).toLowerCase()
    );
    return single ? [single] : [];
  }, [props.selectedInvestmentId, props.investments]);

  const selectedInvestmentDistrictName = useMemo(() => {
    if (!selectedInvestment || !props.districts) return "";
    const found = props.districts.find(d => d.id === selectedInvestment.districtId);
    return found?.name || "";
  }, [selectedInvestment, props.districts]);

  const getSectorThemeColor = useCallback((sector?: string) => {
    const sec = (sector || "").toLowerCase();
    if (sec.includes("kelautan") || sec.includes("perikanan")) return { primary: "#0284c7", glow: "rgba(2, 132, 199, 0.45)", bg: "bg-sky-500", text: "text-sky-400", border: "border-sky-400" };
    if (sec.includes("pertanian")) return { primary: "#059669", glow: "rgba(16, 185, 129, 0.45)", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-400" };
    if (sec.includes("tambang") || sec.includes("pertambangan")) return { primary: "#d97706", glow: "rgba(245, 158, 11, 0.45)", bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-400" };
    if (sec.includes("dagang") || sec.includes("perdagangan") || sec.includes("industri")) return { primary: "#7c3aed", glow: "rgba(139, 92, 246, 0.45)", bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-400" };
    if (sec.includes("wisata") || sec.includes("pariwisata")) return { primary: "#db2777", glow: "rgba(236, 72, 153, 0.45)", bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-400" };
    return { primary: "#059669", glow: "rgba(16, 185, 129, 0.45)", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-400" };
  }, []);

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

  // Cache for district polygons, road clipping, and spatial layer queries
  const districtPolygonCacheRef = useRef<Record<string, any>>({});
  const roadsDistrictCacheRef = useRef<Record<string, any>>({});
  const roadsBboxesRef = useRef<Array<[number, number, number, number] | null>>([]);
  const spatialLayersDistrictCacheRef = useRef<Record<string, any>>({});
  const desaDistrictCacheRef = useRef<Record<string, any>>({});
  const prevRoadsFeaturesRef = useRef<any>(null);

  // Extract Kecamatan GeoJSON directly so other layer toggles don't invalidate district polygon reference
  const kecLayerGeoJSON = useMemo(() => {
    return props.spatialLayers.find(l => l.id === "layer_kecamatan")?.geojson;
  }, [props.spatialLayers.find(l => l.id === "layer_kecamatan")?.geojson]);

  const getSelectedDistrictPolygon = useCallback(() => {
    if (!props.selectedDistrictId) return null;
    const cacheKey = String(props.selectedDistrictId);
    if (districtPolygonCacheRef.current[cacheKey]) {
      return districtPolygonCacheRef.current[cacheKey];
    }

    const sDistId = String(props.selectedDistrictId).toLowerCase().trim();
    const districtObj = props.districts.find(d => String(d.id).toLowerCase().trim() === sDistId);
    const dName = districtObj ? districtObj.name.toLowerCase().trim() : "";

    let geojson = districtObj?.geojson || null;

    if (!geojson && kecLayerGeoJSON) {
      const features = Array.isArray(kecLayerGeoJSON) 
        ? kecLayerGeoJSON 
        : (kecLayerGeoJSON.type === "FeatureCollection" ? (kecLayerGeoJSON.features || []) : [kecLayerGeoJSON]);
      
      const match = features.find((feat: any) => {
        const p = feat.properties || {};
        const fId = String(p.id || p.districtId || p.district_id || p.id_kecamatan || "").toLowerCase().trim();
        if (fId && fId === sDistId) return true;
        
        const featName = String(p.KECAMATAN || p.kecamatan || p.name || p.Name || p.WADMKC || "").toLowerCase().trim();
        const cleanKec = featName.replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
        
        if (dName && (cleanKec === dName || cleanKec.includes(dName) || dName.includes(cleanKec))) return true;
        return false;
      });
      if (match) geojson = match;
    }

    if (geojson) {
      districtPolygonCacheRef.current[cacheKey] = geojson;
    }
    return geojson;
  }, [props.selectedDistrictId, props.districts, kecLayerGeoJSON]);

  // Helper to extract the precise polygon for clipping (selected village or falling back to selected district) kawan!
  const getSelectedClipPolygon = useCallback(() => {
    let clipPolygon: any = null;

    if (props.selectedVillageId) {
      const layer = props.spatialLayers.find(l => l.id === "layer_desa");
      if (layer && layer.geojson) {
        const normalized = normalizeGeoJSON(layer.geojson);
        if (normalized && normalized.features && normalized.features.length > 0) {
          const sVilId = String(props.selectedVillageId).toLowerCase().trim();
          const vilObj = props.villages?.find(v => String(v.id).toLowerCase().trim() === sVilId || String(v.code).toLowerCase().trim() === sVilId || normalizeName(v.name) === normalizeName(sVilId));
          const vName = vilObj ? vilObj.name.toLowerCase().trim() : "";

          clipPolygon = normalized.features.find((f: any) => {
            const p = f.properties || {};
            const fId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || "").toLowerCase().trim();
            if (fId && fId === sVilId) return true;
            const fName = String(p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "").toLowerCase().trim();
            if (vName && (fName === vName || normalizeName(fName) === normalizeName(vName) || fName.includes(vName) || vName.includes(fName))) return true;
            return false;
          });
        }
      }
    }

    if (!clipPolygon && props.selectedDistrictId) {
      clipPolygon = getSelectedDistrictPolygon();
    }

    if (clipPolygon && clipPolygon.type === 'FeatureCollection' && clipPolygon.features && clipPolygon.features.length > 0) {
      clipPolygon = clipPolygon.features[0];
    }

    return clipPolygon;
  }, [props.selectedDistrictId, props.selectedVillageId, props.spatialLayers, props.villages, getSelectedDistrictPolygon]);

  const desaLayerObj = useMemo(() => {
    return props.spatialLayers.find(l => l.id === "layer_desa");
  }, [props.spatialLayers]);

  const desaGeoJSON = useMemo(() => {
    if (!desaLayerObj || !desaLayerObj.geojson) return null;
    const cacheKey = `${desaLayerObj.geojson.features?.length || 0}_${props.selectedDistrictId || 'all'}_${props.selectedVillageId || 'all'}`;
    if (desaDistrictCacheRef.current[cacheKey]) {
      return desaDistrictCacheRef.current[cacheKey];
    }

    let normalized = normalizeGeoJSON(desaLayerObj.geojson);
    if (!normalized || !normalized.type) return null;

    let activeDistrictId = props.selectedDistrictId;

    // Find districtId of the selected village if no districtId is selected yet
    if (!activeDistrictId && props.selectedVillageId) {
      const sVilId = String(props.selectedVillageId).toLowerCase().trim();
      const vilObj = props.villages?.find(v => String(v.id).toLowerCase().trim() === sVilId || String(v.code).toLowerCase().trim() === sVilId);
      if (vilObj) {
        activeDistrictId = vilObj.districtId;
      }
    }

    let featuresToUse = normalized.features || [];

    // Filter by district boundary if district is selected or inferred
    if (activeDistrictId && featuresToUse.length > 0) {
      const distId = String(activeDistrictId).toLowerCase().trim();
      const districtObj = props.districts?.find(d => String(d.id).toLowerCase().trim() === distId);
      const distName = districtObj ? districtObj.name.toLowerCase().trim() : "";

      featuresToUse = featuresToUse.filter((f: any) => {
        const p = f.properties || {};
        const fDistId = String(p.districtId || p.district_id || p.id_kecamatan || "").toLowerCase().trim();
        const fKec = String(p.kecamatan || p.KECAMATAN || p.WADMKC || "").toLowerCase().trim();
        const cleanKec = fKec.replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
        
        if (fDistId && (fDistId === distId || fDistId === `dist_${distName.replace(/\s+/g, '_')}`)) return true;
        if (distName && (cleanKec === distName || distName.includes(cleanKec) || cleanKec.includes(distName))) return true;

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
    }

    // Toggle _isSelected on the chosen village and isolate if village is selected
    if (props.selectedVillageId && featuresToUse.length > 0) {
      const sVilId = String(props.selectedVillageId).toLowerCase().trim();
      const vilObj = props.villages?.find(v => String(v.id).toLowerCase().trim() === sVilId || String(v.code).toLowerCase().trim() === sVilId || normalizeName(v.name) === normalizeName(sVilId));
      const vName = vilObj ? vilObj.name.toLowerCase().trim() : "";

      featuresToUse = featuresToUse.filter((f: any) => {
        const p = f.properties || {};
        const fId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || "").toLowerCase().trim();
        const fName = String(p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "").toLowerCase().trim();
        
        const isMatch = (fId && fId === sVilId) || 
                        (vName && (fName === vName || normalizeName(fName) === normalizeName(vName) || fName.includes(vName) || vName.includes(fName)));
                        
        return isMatch;
      }).map((f: any) => ({
        ...f,
        properties: {
          ...f.properties,
          _isSelected: true
        }
      }));
    }

    const res = {
      ...normalized,
      features: featuresToUse
    };
    desaDistrictCacheRef.current[cacheKey] = res;
    return res;
  }, [desaLayerObj, props.selectedDistrictId, props.selectedVillageId, props.districts, props.villages, getSelectedDistrictPolygon]);

  const isDesaLayerActive = desaLayerObj?.isActive !== false;

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

        let luasRaw = matchedVillage?.areaHa || propsData.LUAS || propsData.luas || propsData.Shape_Area || propsData.SHAPE_Area || propsData.areaHa || 0;
        let pop = matchedVillage?.population || propsData.population || propsData.Jum_Pdd || propsData.jum_pdd || 0;

        let luasNum = parseFloat(String(luasRaw).replace(/[^0-9.,-]/g, '').replace(',', '.'));
        let luas = !isNaN(luasNum) ? `${luasNum.toFixed(2)} Ha` : (luasRaw ? `${luasRaw} Ha` : 'N/A');

        const html = `
          <div style="padding: 14px 16px; font-family: inherit; font-size: 12px; border-radius: 16px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(16px); color: #f8fafc; border: 1px solid rgba(16, 185, 129, 0.4); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.15); min-width: 200px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; gap: 6px; color: #ffffff;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #10b981;"></span>
              🏡 ${name}
            </div>
            ${rawKecName ? `<div style="color: #94a3b8; margin-bottom: 4px; display: flex; justify-content: space-between;"><span>Kecamatan:</span> <span style="color: #e2e8f0; font-weight: 500;">${rawKecName}</span></div>` : ''}
            <div style="color: #94a3b8; margin-bottom: 4px; display: flex; justify-content: space-between;"><span>Luas Wilayah:</span> <span style="color: #34d399; font-weight: 700; font-family: monospace;">${luas}</span></div>
            ${pop > 0 ? `<div style="color: #94a3b8; display: flex; justify-content: space-between;"><span>Penduduk:</span> <span style="color: #38bdf8; font-weight: 700; font-family: monospace;">${pop.toLocaleString("id-ID")} Jiwa</span></div>` : ''}
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
  const isScaleControlAddedRef = useRef(false);

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
    const controller = new AbortController();
    let isMounted = true;

    const loadRoads = async () => {
      try {
        let res = await fetch('/api/gis_jalan', { signal: controller.signal });
        if (!res || !res.ok) {
          res = await fetch('/gis_jalan.json', { signal: controller.signal });
        }
        if (!res || !res.ok) {
          if (isMounted) setRoadsGeoJSON({ type: "FeatureCollection", features: [] });
          return;
        }
        const _ctype = res.headers.get("content-type");
        if (_ctype && !_ctype.includes("application/json")) throw new Error("Not JSON");
        const data = await res.json();
        if (!isMounted) return;
        if (data && data.features) {
          let flatFeatures: any[] = [];
          (Array.isArray(data.features) ? data.features : []).forEach((f: any) => {
            if (f?.type === "FeatureCollection" && f.features) {
               flatFeatures.push(...(Array.isArray(f.features) ? f.features : []));
            } else if (f) {
               flatFeatures.push(f);
            }
          });
          
          const filtered = flatFeatures.filter((f: any) => f.geometry !== null);
          const normalizedGeoJSON = { type: "FeatureCollection" as const, features: filtered };
          setRoadsGeoJSON(normalizedGeoJSON);
          try {
            pathFinderRef.current = new PathFinder(normalizedGeoJSON);
            (window as any).luwuPathFinder = pathFinderRef.current;
            (window as any).luwuRoads = normalizedGeoJSON;
          } catch (e) {
            // PathFinder initialization fallback
          }
        } else {
          setRoadsGeoJSON({ type: "FeatureCollection", features: [] });
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        console.error("Gagal memuat /api/gis_jalan:", err);
        if (isMounted) setRoadsGeoJSON({ type: "FeatureCollection", features: [] });
      }
    };

    loadRoads();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Sync road data from props if available
  useEffect(() => {
    if (roadsGeoJSON && roadsGeoJSON.features && roadsGeoJSON.features.length > 0) return;
    const propRoads = props.spatialLayers.find(l => l.id === "layer_jalan")?.geojson;
    if (propRoads && propRoads.features && propRoads.features.length > 0) {
      setRoadsGeoJSON(propRoads);
    }
  }, [props.spatialLayers, roadsGeoJSON]);

  // 1. TILE-BASED PARTITIONING & PROGRESSIVE VIEWPORT FILTERING FOR ZONASI (RTRW)
  const isZonasiActive = useMemo(() => {
    return props.spatialLayers.some(l => 
      (l.id === "layer_zonasi" || 
       l.id === "layer_land_use_zoning" || 
       l.id === "gis_zonasi" || 
       l.id === "Zonasi Pemanfaatan Lahan") && 
      l.isActive
    );
  }, [props.spatialLayers]);

  // Guarded zonasi data loading - only fetched on-demand when zonasi layer is actually activated
  useEffect(() => {
    if (!isZonasiActive) return;

    // If zonasi is already loaded in local state or props.spatialLayers, do not re-fetch
    if (zonasiGeoJSON && zonasiGeoJSON.features && zonasiGeoJSON.features.length > 0) return;
    const dbZonasi = props.spatialLayers.find(l => 
      (l.id === "layer_zonasi" || l.id === "layer_land_use_zoning") && 
      l.geojson?.features && l.geojson.features.length > 0
    );
    if (dbZonasi) {
      setZonasiGeoJSON(dbZonasi.geojson);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;
    fetch('/gis_zonasi.json', { signal: controller.signal })
      .then(async res => {
        if (!res || !res.ok) {
          return { type: "FeatureCollection", features: [] };
        }
        const _ctype = res.headers.get("content-type");
        if (_ctype && !_ctype.includes("application/json")) throw new Error("Not JSON");
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        if (data && (data.type === "FeatureCollection" || data.type === "Feature")) {
          setZonasiGeoJSON(data);
        } else {
          setZonasiGeoJSON({ type: "FeatureCollection", features: [] });
        }
      })
      .catch(err => {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          return;
        }
        if (isMounted) {
          setZonasiGeoJSON({ type: "FeatureCollection", features: [] });
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isZonasiActive, zonasiGeoJSON, props.spatialLayers]);

  const finalZonasiGeoJSON = useMemo(() => {
    let raw: any = null;
    if (zonasiGeoJSON && zonasiGeoJSON.features && zonasiGeoJSON.features.length > 0) {
      raw = zonasiGeoJSON;
    } else {
      const dbLayer1 = props.spatialLayers.find(l => l.id === "layer_zonasi");
      if (dbLayer1?.geojson && dbLayer1.geojson.features && dbLayer1.geojson.features.length > 0) {
        raw = dbLayer1.geojson;
      } else {
        const dbLayer2 = props.spatialLayers.find(l => l.id === "layer_land_use_zoning");
        if (dbLayer2?.geojson && dbLayer2.geojson.features && dbLayer2.geojson.features.length > 0) {
          raw = dbLayer2.geojson;
        }
      }
    }
    
    if (!raw || !raw.features || raw.features.length === 0) {
      return zonasiGeoJSON || { type: "FeatureCollection", features: [] };
    }

    // Clip zonasi if district or village is selected
    if (props.selectedDistrictId || props.selectedVillageId) {
      let clipPoly = getSelectedClipPolygon();
      if (clipPoly && clipPoly.geometry && clipPoly.geometry.coordinates) {
        try {
          const clipBbox = turf.bbox(clipPoly);
          const filtered = raw.features.filter((feat: any) => {
            if (!feat.geometry || !feat.geometry.coordinates) return false;
            try {
              const featBbox = turf.bbox(feat);
              if (
                featBbox[2] < clipBbox[0] ||
                featBbox[0] > clipBbox[2] ||
                featBbox[3] < clipBbox[1] ||
                featBbox[1] > clipBbox[3]
              ) {
                return false;
              }
              return (turf as any).booleanIntersects(feat, clipPoly);
            } catch {
              return false;
            }
          });
          return {
            type: "FeatureCollection" as const,
            features: filtered
          };
        } catch (e) {
          return raw;
        }
      }
    }

    return raw;
  }, [zonasiGeoJSON, props.spatialLayers, props.selectedDistrictId, props.selectedVillageId, getSelectedClipPolygon]);

  useEffect(() => {
    if (!isZonasiActive) {
      setPartitionedZonasiGeoJSON(null);
      spatialWorkerClient.clearLayer('layer_zonasi');
      return;
    }

    if (!finalZonasiGeoJSON?.features || finalZonasiGeoJSON.features.length === 0) {
      setPartitionedZonasiGeoJSON({ type: "FeatureCollection", features: [] });
      return;
    }

    let isCancelled = false;

    // Macro view (full kabupaten view) -> render complete dataset
    if (!viewportBbox || currentMapZoom <= 9.5) {
      requestAnimationFrame(() => {
        if (!isCancelled) setPartitionedZonasiGeoJSON(finalZonasiGeoJSON);
      });
      spatialWorkerClient.indexLayer('layer_zonasi', finalZonasiGeoJSON).catch(() => {});
      return;
    }

    // Zoomed in -> Query only features intersecting viewport (+25% margin buffer)
    spatialWorkerClient.indexLayer('layer_zonasi', finalZonasiGeoJSON).then(() => {
      if (isCancelled) return;
      spatialWorkerClient.queryViewport('layer_zonasi', viewportBbox, {
        zoomLevel: currentMapZoom,
        marginRatio: 0.25,
        fallbackGeoJSON: finalZonasiGeoJSON
      }).then(filtered => {
        if (!isCancelled) {
          requestAnimationFrame(() => {
            if (!isCancelled) setPartitionedZonasiGeoJSON(filtered);
          });
        }
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [isZonasiActive, finalZonasiGeoJSON, viewportBbox, currentMapZoom]);

  // 2. TILE-BASED PARTITIONING FOR VILLAGES (DESA)
  const isDesaActive = useMemo(() => {
    return props.spatialLayers.find(l => l.id === "layer_desa")?.isActive !== false;
  }, [props.spatialLayers]);

  useEffect(() => {
    if (!isDesaActive || !desaGeoJSON || !desaGeoJSON.features || desaGeoJSON.features.length === 0) {
      setPartitionedDesaGeoJSON(null);
      spatialWorkerClient.clearLayer('layer_desa');
      return;
    }

    // When already focused on a single village or single district, desaGeoJSON is already minimal
    if (props.selectedVillageId || props.selectedDistrictId || !viewportBbox || currentMapZoom <= 9.5) {
      setPartitionedDesaGeoJSON(desaGeoJSON);
      return;
    }

    let isCancelled = false;
    spatialWorkerClient.indexLayer('layer_desa', desaGeoJSON).then(() => {
      if (isCancelled) return;
      spatialWorkerClient.queryViewport('layer_desa', viewportBbox, {
        zoomLevel: currentMapZoom,
        marginRatio: 0.3,
        fallbackGeoJSON: desaGeoJSON
      }).then(filtered => {
        if (!isCancelled) {
          requestAnimationFrame(() => {
            if (!isCancelled) setPartitionedDesaGeoJSON(filtered);
          });
        }
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [isDesaActive, desaGeoJSON, viewportBbox, currentMapZoom, props.selectedVillageId, props.selectedDistrictId]);

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

    // Direct synchronization for zoning layers in case MapLibre state gets out of sync with smooth fade transitions
    try {
      const isZonasiActive = props.spatialLayers.some(l => 
        (l.id === "layer_zonasi" || 
         l.id === "layer_land_use_zoning" || 
         l.id === "gis_zonasi" || 
         l.id === "Zonasi Pemanfaatan Lahan") && 
        l.isActive
      );

      const smoothSyncLayer = (layerId: string, isVisible: boolean, opacityProp: string, targetOpacityVal: number) => {
        if (!map.getLayer(layerId)) return;
        try {
          map.setPaintProperty(layerId, `${opacityProp}-transition` as any, { duration: 400, delay: 0 });
          if (isVisible) {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            map.setPaintProperty(layerId, opacityProp, targetOpacityVal);
          } else {
            map.setPaintProperty(layerId, opacityProp, 0);
            setTimeout(() => {
              try {
                if (map.getLayer(layerId) && map.getPaintProperty(layerId, opacityProp) === 0) {
                  map.setLayoutProperty(layerId, 'visibility', 'none');
                }
              } catch (e) {}
            }, 420);
          }
        } catch (e) {}
      };

      smoothSyncLayer('layer-zonasi', isZonasiActive, 'fill-opacity', 0.5);
      smoothSyncLayer('layer-zonasi-outline', isZonasiActive, 'line-opacity', 0.9);

      const isRbiActive = props.spatialLayers.some(l => l.id === "layer_rbi" && l.isActive);
      smoothSyncLayer('layer-rbi-admin', isRbiActive, 'line-opacity', 0.8);
      smoothSyncLayer('layer-rbi-roads', isRbiActive, 'line-opacity', 0.85);
    } catch (e) {
      // ignore
    }
  }, [props.spatialLayers, roadsGeoJSON, isMapLoaded]);

  const findDistrictForFeature = useCallback((feature: any) => {
    if (feature.properties?.id) {
      const found = props.districts.find(d => d.id === feature.properties.id);
      if (found) return found;
    }
    const featName = feature.properties?.KECAMATAN || feature.properties?.name || "";
    const normalizedFeatName = normalizeDistrictName(featName);
    return props.districts.find(d => normalizeDistrictName(d.name) === normalizedFeatName);
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

  // --- Smooth Cinematic Camera Transitions for Districts and Villages kawan ---
  const prevSelectedDistrictIdRef = useRef<string | null>(props.selectedDistrictId);
  const prevSelectedVillageIdRef = useRef<string | null>(props.selectedVillageId);
  const prevLayersRef = useRef<any[]>(props.spatialLayers || []);

  useEffect(() => {
    const mapInstance = mapRef.current?.getMap ? mapRef.current.getMap() : mapRef.current;
    if (mapInstance && isMapLoaded) {
      const sDistId = props.selectedDistrictId;
      const prevDistId = prevSelectedDistrictIdRef.current;
      
      if (sDistId !== prevDistId) {
        if (sDistId) {
          const sDistIdStr = String(sDistId);
          const district = props.districts.find(d => {
            const dId = String(d.id).toLowerCase();
            const targetId = sDistIdStr.toLowerCase();
            return dId === targetId || 
                   dId.replace(/^dist_/i, "") === targetId.replace(/^dist_/i, "") ||
                   normalizeDistrictName(d.name) === normalizeDistrictName(sDistIdStr);
          });
          if (district) {
            setCameraTargetNotice({ name: district.name, type: "Kecamatan" });
            const timer = setTimeout(() => setCameraTargetNotice(null), 2800);

            let geojson = district.geojson || (district.polygon ? { type: "Feature", geometry: district.polygon, properties: district } : null);
            if (!geojson) {
              const kecLayer = props.spatialLayers.find(l => l.id === "layer_kecamatan");
              if (kecLayer && kecLayer.geojson) {
                const features = Array.isArray(kecLayer.geojson) ? kecLayer.geojson : (kecLayer.geojson.type === "FeatureCollection" ? (kecLayer.geojson.features || []) : [kecLayer.geojson]);
                const match = features.find((feat: any) => {
                  const featName = feat.properties?.KECAMATAN || feat.properties?.name || feat.properties?.WADMKC || "";
                  return normalizeDistrictName(featName) === normalizeDistrictName(district.name);
                });
                if (match) {
                  geojson = match;
                }
              }
            }

            if (geojson) {
              try {
                const bbox = turf.bbox(geojson);
                mapInstance.fitBounds(bbox as [number, number, number, number], {
                  padding: { top: 75, bottom: 75, left: 75, right: 75 },
                  duration: 1800,
                  maxZoom: 13.5,
                  pitch: 24,
                  bearing: 0,
                  essential: true
                });
              } catch (e) {
                if (district.coordinates && district.coordinates.length >= 2) {
                  mapInstance.flyTo({
                    center: [district.coordinates[1], district.coordinates[0]],
                    zoom: 11.8,
                    pitch: 24,
                    bearing: 0,
                    duration: 1800,
                    speed: 1.1,
                    curve: 1.45,
                    essential: true
                  });
                }
              }
            } else if (district.coordinates && district.coordinates.length >= 2) {
              mapInstance.flyTo({
                center: [district.coordinates[1], district.coordinates[0]],
                zoom: 11.8,
                pitch: 24,
                bearing: 0,
                duration: 1800,
                speed: 1.1,
                curve: 1.45,
                essential: true
              });
            }
            prevSelectedDistrictIdRef.current = sDistId;
            return () => clearTimeout(timer);
          }
        } else if (prevDistId !== null) {
          setCameraTargetNotice({ name: "Seluruh Kabupaten Luwu", type: "Perspektif Makro" });
          const timer = setTimeout(() => setCameraTargetNotice(null), 2400);

          mapInstance.flyTo({
            center: [120.25, -3.15],
            zoom: 9.5,
            pitch: 0,
            bearing: 0,
            duration: 1600,
            speed: 1.2,
            curve: 1.4,
            essential: true
          });
          prevSelectedDistrictIdRef.current = null;
          return () => clearTimeout(timer);
        }
      }
      prevSelectedDistrictIdRef.current = sDistId;
    }
  }, [props.selectedDistrictId, props.districts, props.spatialLayers, isMapLoaded]);

  useEffect(() => {
    const mapInstance = mapRef.current?.getMap ? mapRef.current.getMap() : mapRef.current;
    if (mapInstance && isMapLoaded) {
      const sVilId = props.selectedVillageId;
      const prevVilId = prevSelectedVillageIdRef.current;

      if (sVilId !== prevVilId) {
        if (sVilId) {
          const sVilIdStr = String(sVilId);
          const village = props.villages.find(v => {
            const vId = String(v.id).toLowerCase();
            const targetId = sVilIdStr.toLowerCase();
            return vId === targetId || 
                   vId.replace(/^vil_/i, "") === targetId.replace(/^vil_/i, "") ||
                   normalizeName(v.name) === normalizeName(sVilIdStr) ||
                   normalizeName(v.name) === normalizeName(sVilIdStr.replace(/^vil_/i, ""));
          });
          
          let geojson = village?.geojson || (village?.polygon ? { type: "Feature", geometry: village.polygon, properties: village } : null);
          if (!geojson) {
            const desaLayer = props.spatialLayers.find(l => l.id === "layer_desa" || l.id === "layer_zonasi");
            if (desaLayer && desaLayer.geojson) {
              const features = Array.isArray(desaLayer.geojson) ? desaLayer.geojson : (desaLayer.geojson.type === "FeatureCollection" ? (desaLayer.geojson.features || []) : [desaLayer.geojson]);
              const match = features.find((feat: any) => {
                const p = feat.properties || {};
                const fId = String(p.id || p.ID_DESA || feat.id || p.KodeBPS || "");
                if (fId && fId === sVilIdStr) return true;
                const fName = p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "";
                return village && normalizeName(fName) === normalizeName(village.name);
              });
              if (match) geojson = match;
            }
          }

          const vilName = village?.name || "Desa";
          setCameraTargetNotice({ name: vilName, type: "Desa / Kelurahan" });
          const timer = setTimeout(() => setCameraTargetNotice(null), 2800);

          if (geojson) {
            try {
              const bbox = turf.bbox(geojson);
              mapInstance.fitBounds(bbox as [number, number, number, number], {
                padding: { top: 85, bottom: 85, left: 85, right: 85 },
                duration: 1800,
                maxZoom: 15.5,
                pitch: 24,
                bearing: 0,
                essential: true
              });
            } catch (e) {
              try {
                const cent = turf.centroid(geojson);
                if (cent?.geometry?.coordinates) {
                  mapInstance.flyTo({
                    center: [cent.geometry.coordinates[0], cent.geometry.coordinates[1]],
                    zoom: 14,
                    pitch: 24,
                    duration: 1800,
                    essential: true
                  });
                }
              } catch (err){}
            }
          } else if (village?.coordinates && village.coordinates.length >= 2) {
            mapInstance.flyTo({
              center: [village.coordinates[1], village.coordinates[0]],
              zoom: 14,
              pitch: 24,
              duration: 1800,
              essential: true
            });
          }

          prevSelectedVillageIdRef.current = sVilId;
          return () => clearTimeout(timer);
        } else if (prevVilId !== null) {
          prevSelectedVillageIdRef.current = null;
        }
      }
      prevSelectedVillageIdRef.current = sVilId;
    }
  }, [props.selectedVillageId, props.villages, props.spatialLayers, isMapLoaded]);

  // Smooth camera zoom/fly to layers when they are toggled ON kawan!
  useEffect(() => {
    const mapInstance = mapRef.current?.getMap ? mapRef.current.getMap() : mapRef.current;
    if (!mapInstance || !isMapLoaded || !props.spatialLayers) return;

    props.spatialLayers.forEach(layer => {
      const prevLayer = prevLayersRef.current?.find(l => l.id === layer.id);
      const wasActive = prevLayer ? prevLayer.isActive : false;
      const isActive = layer.isActive;

      if (isActive && !wasActive) {
        // Layer was just toggled ON!
        if (layer.id === "layer_kecamatan" || layer.id === "layer_desa") {
          setCameraTargetNotice({ name: layer.name, type: "Layer Diaktifkan" });
          const timer = setTimeout(() => setCameraTargetNotice(null), 2400);
          mapInstance.fitBounds(LUWU_BBOX, {
            padding: 50,
            duration: 1500,
            essential: true
          });
        } else if (layer.id === "layer_potensi") {
          setCameraTargetNotice({ name: "Potensi Investasi", type: "Layer Diaktifkan" });
          const timer = setTimeout(() => setCameraTargetNotice(null), 2400);
          
          const filteredInvestments = props.investments;
          if (filteredInvestments.length > 0) {
            try {
              const features = filteredInvestments.map(i => turf.point([i.longitude, i.latitude]));
              const bbox = turf.bbox(turf.featureCollection(features));
              mapInstance.fitBounds(bbox as [number, number, number, number], {
                padding: 80,
                duration: 1600,
                maxZoom: 13.5,
                essential: true
              });
            } catch (e) {
              mapInstance.flyTo({
                center: [120.25, -3.15],
                zoom: 9.5,
                duration: 1500,
                essential: true
              });
            }
          }
        } else if (layer.geojson && layer.geojson.features && layer.geojson.features.length > 0) {
          // General thematic layers fit bounds kawan!
          setCameraTargetNotice({ name: layer.name, type: "Layer Diaktifkan" });
          const timer = setTimeout(() => setCameraTargetNotice(null), 2400);
          try {
            const bbox = turf.bbox(layer.geojson);
            mapInstance.fitBounds(bbox as [number, number, number, number], {
              padding: 60,
              duration: 1600,
              maxZoom: 13,
              essential: true
            });
          } catch (e) {}
        }
      }
    });

    prevLayersRef.current = props.spatialLayers;
  }, [props.spatialLayers, isMapLoaded, props.investments]);

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

  // Filter Jaringan Jalan Berdasarkan Kecamatan / Desa Terpilih Kawan!
  const displayRoadsGeoJSON = useMemo(() => {
    if (!roadsGeoJSON || !roadsGeoJSON.features || roadsGeoJSON.features.length === 0) return null;
    if (!props.selectedDistrictId && !props.selectedVillageId) return roadsGeoJSON;

    const cacheKey = `${props.selectedDistrictId || 'none'}_${props.selectedVillageId || 'none'}`;
    if (roadsDistrictCacheRef.current[cacheKey]) {
      return roadsDistrictCacheRef.current[cacheKey];
    }

    // Precalculate bboxes for road features once when roads data arrives
    if (roadsGeoJSON.features !== prevRoadsFeaturesRef.current) {
      prevRoadsFeaturesRef.current = roadsGeoJSON.features;
      roadsDistrictCacheRef.current = {};
      roadsBboxesRef.current = roadsGeoJSON.features.map((f: any) => {
        try {
          if (f.geometry && f.geometry.coordinates && f.geometry.coordinates.length > 0) {
            return turf.bbox(f) as [number, number, number, number];
          }
        } catch {
          // ignore
        }
        return null;
      });
    }

    let clipPolygon: any = null;

    // 1. If a village is selected, try to get the village polygon first
    if (props.selectedVillageId) {
      const layer = props.spatialLayers.find(l => l.id === "layer_desa");
      if (layer && layer.geojson) {
        const normalized = normalizeGeoJSON(layer.geojson);
        if (normalized && normalized.features && normalized.features.length > 0) {
          const sVilId = String(props.selectedVillageId).toLowerCase().trim();
          const vilObj = props.villages?.find(v => String(v.id).toLowerCase().trim() === sVilId);
          const vName = vilObj ? vilObj.name.toLowerCase().trim() : "";

          clipPolygon = normalized.features.find((f: any) => {
            const p = f.properties || {};
            const fId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || "").toLowerCase().trim();
            if (fId && fId === sVilId) return true;
            const fName = String(p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "").toLowerCase().trim();
            if (vName && (fName === vName || fName.includes(vName) || vName.includes(fName))) return true;
            return false;
          });
        }
      }
    }

    // 2. Fallback: If no village is selected, or we couldn't find the village polygon, use the subdistrict polygon
    if (!clipPolygon) {
      clipPolygon = getSelectedDistrictPolygon();
    }

    if (!clipPolygon) return roadsGeoJSON;

    // Normalize clipPolygon geometry if it's a FeatureCollection
    if (clipPolygon.type === 'FeatureCollection' && clipPolygon.features && clipPolygon.features.length > 0) {
      clipPolygon = clipPolygon.features[0];
    }
    if (!clipPolygon.geometry || !clipPolygon.geometry.coordinates) return roadsGeoJSON;

    try {
      const clipBbox = turf.bbox(clipPolygon);
      const bboxes = roadsBboxesRef.current;

      const clippedFeatures: any[] = [];

      roadsGeoJSON.features.forEach((roadFeat: any, idx: number) => {
        if (!roadFeat.geometry || !roadFeat.geometry.coordinates || roadFeat.geometry.coordinates.length === 0) return;
        const roadBbox = bboxes[idx];
        if (!roadBbox) return;

        // Ultra-fast BBox rejection (sub-millisecond)
        if (roadBbox[0] > clipBbox[2] || roadBbox[2] < clipBbox[0] ||
            roadBbox[1] > clipBbox[3] || roadBbox[3] < clipBbox[1]) {
          return;
        }

        try {
          // Check if the road actually intersects or is within the polygon
          if (turf.booleanIntersects(roadFeat, clipPolygon)) {
            // Attempt exact geometric clipping using turf.intersect
            let intersected: any = null;
            try {
              intersected = turf.intersect(turf.featureCollection([roadFeat, clipPolygon])) || turf.intersect(roadFeat, clipPolygon);
            } catch {
              try {
                intersected = turf.intersect(roadFeat, clipPolygon);
              } catch {
                // ignore
              }
            }

            if (intersected && intersected.geometry && 
                (intersected.geometry.type === 'LineString' || intersected.geometry.type === 'MultiLineString')) {
              clippedFeatures.push({
                ...roadFeat,
                geometry: intersected.geometry
              });
            } else {
              // Fallback to keeping the entire road feature
              clippedFeatures.push(roadFeat);
            }
          }
        } catch (e) {
          // Fallback to booleanIntersects in case of error
          try {
            if (turf.booleanIntersects(roadFeat, clipPolygon)) {
              clippedFeatures.push(roadFeat);
            }
          } catch {
            // ignore
          }
        }
      });

      const res = {
        type: "FeatureCollection",
        features: clippedFeatures
      };
      roadsDistrictCacheRef.current[cacheKey] = res;
      return res;
    } catch (e) {
      return roadsGeoJSON;
    }
  }, [roadsGeoJSON, props.selectedDistrictId, props.selectedVillageId, props.districts, props.villages, props.spatialLayers, getSelectedDistrictPolygon]);


  // Filter Layer Kustom (seperti layer tambak, mangrove, dan potensi) Berdasarkan Wilayah Terpilih Kawan!
  const dynamicSpatialLayersGeoJSON = useMemo(() => {
    const result: Record<string, any> = {};
    props.spatialLayers.forEach(layer => {
      // Skip sistem layer yang sudah ditangani khusus
      if (["layer_kecamatan", "layer_jalan", "layer_zonasi", "layer_desa"].includes(layer.id)) return;
      if (!layer.isActive || !layer.geojson) return;
      
      const cacheKey = `${layer.id}_${layer.geojson.features?.length || 0}_${props.selectedDistrictId || 'all'}_${props.selectedVillageId || 'all'}`;
      if (spatialLayersDistrictCacheRef.current[cacheKey]) {
        result[layer.id] = spatialLayersDistrictCacheRef.current[cacheKey];
        return;
      }

      let normalized = normalizeGeoJSON(layer.geojson);
      if (!normalized || !normalized.type) return;

      // Clip logic jika ada wilayah terpilih kawan!
      const clipPolygon = getSelectedClipPolygon();
      if (clipPolygon && normalized.type === "FeatureCollection" && normalized.features) {
         try {
            const clipBbox = turf.bbox(clipPolygon);
            const filteredFeatures = normalized.features.filter((feat: any) => {
               if (!feat.geometry || !feat.geometry.coordinates || feat.geometry.coordinates.length === 0) return false;
               try {
                 // Fast bounding box pre-filter kawan!
                 const featBbox = turf.bbox(feat);
                 if (featBbox[0] > clipBbox[2] || featBbox[2] < clipBbox[0] ||
                     featBbox[1] > clipBbox[3] || featBbox[3] < clipBbox[1]) {
                    return false;
                 }
                 // Akurat: Cek interseksi spasial kawan!
                 return turf.booleanIntersects(feat, clipPolygon);
               } catch (e) {
                 return false;
               }
            });
            normalized = { ...normalized, features: filteredFeatures };
         } catch (e) {
            undefined;
         }
      }

      spatialLayersDistrictCacheRef.current[cacheKey] = normalized;
      result[layer.id] = normalized;
    });
    return result;
  }, [props.spatialLayers, props.selectedDistrictId, props.selectedVillageId, props.districts, props.villages, getSelectedClipPolygon]);

  // 3. TILE-BASED PARTITIONING FOR HEAVY DYNAMIC SPATIAL LAYERS (RBI, SAWAH, TAMBAK, ETC.)
  useEffect(() => {
    const activeLayers = props.spatialLayers.filter(l => 
      l.isActive && 
      !["layer_kecamatan", "layer_jalan", "layer_zonasi", "layer_desa"].includes(l.id)
    );

    // Free memory for inactive layers
    props.spatialLayers.forEach(l => {
      if (!l.isActive) {
        spatialWorkerClient.clearLayer(l.id);
      }
    });

    const activeHeavy = activeLayers.filter(l => {
      const geo = dynamicSpatialLayersGeoJSON[l.id];
      return geo?.features && geo.features.length > 80;
    });

    if (activeHeavy.length === 0 || !viewportBbox || currentMapZoom <= 9.5) {
      setPartitionedDynamicLayers({});
      return;
    }

    let isCancelled = false;
    const promises = activeHeavy.map(async (layer) => {
      const geo = dynamicSpatialLayersGeoJSON[layer.id];
      if (!geo) return null;
      await spatialWorkerClient.indexLayer(layer.id, geo);
      const filtered = await spatialWorkerClient.queryViewport(layer.id, viewportBbox, {
        zoomLevel: currentMapZoom,
        marginRatio: 0.25,
        fallbackGeoJSON: geo
      });
      return { id: layer.id, geojson: filtered };
    });

    Promise.all(promises).then(results => {
      if (isCancelled) return;
      const mapObj: Record<string, any> = {};
      results.forEach(res => {
        if (res) mapObj[res.id] = res.geojson;
      });
      requestAnimationFrame(() => {
        if (!isCancelled) setPartitionedDynamicLayers(mapObj);
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [props.spatialLayers, dynamicSpatialLayersGeoJSON, viewportBbox, currentMapZoom]);

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

  // Mobile viewport and device detection for WebGL performance optimization
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || ('ontouchstart' in window);
  }, []);

  // Check if any zoning, land use, or thematic spatial layer is currently active
  const isZoningOrThematicActive = useMemo(() => {
    return props.spatialLayers.some(l => 
      (l.id === "layer_zonasi" || 
       l.id === "layer_land_use_zoning" || 
       l.id === "gis_zonasi" || 
       l.id === "Zonasi Pemanfaatan Lahan" ||
       l.id === "layer_sawah" ||
       l.id === "layer_tambak" ||
       l.id === "layer_mangrove" ||
       l.id === "layer_lahan_kering_sekunder" ||
       l.id === "layer_lahan_kering_primer" ||
       l.id === "layer_flood_risk" ||
       l.id === "layer_landslide_risk" ||
       l.id === "layer_historical_suitability" ||
       l.id.startsWith("gis_") ||
       (l.category !== "Kecamatan" && l.category !== "Desa" && l.category !== "Jalan")) && 
      l.isActive
    );
  }, [props.spatialLayers]);

  // SIKAP Luwu Territorial Layer Masking: Inverted Polygon bounding Kabupaten Luwu
  // Ensures all zoning and spatial layers outside Luwu territorial jurisdiction are not rendered,
  // substantially accelerating MapLibre WebGL performance and GPU memory efficiency on mobile devices.
  const luwuTerritoryMaskGeoJSON = useMemo(() => {
    const kecLayer = props.spatialLayers.find(l => l.id === "layer_kecamatan");
    if (!kecLayer || !kecLayer.geojson) return null;
    return generateMapMask(kecLayer.geojson);
  }, [props.spatialLayers]);

  // cartography mask geometry (Inverted Polygon) untuk clipping area basemap saat cetak
  // (generateMapMask dipanggil di dalam ini atau di atas)
  const cartographyMaskGeoJSON = useMemo(() => {
    if (!props.isCartographyMode && !props.selectedVillageId && !props.selectedDistrictId) return null;
    let activeGeoJSON: any = null;

    if (props.selectedVillageId) {
       const sVilId = String(props.selectedVillageId);
       const v = props.villages?.find(v => String(v.id) === sVilId || normalizeName(v.name) === normalizeName(sVilId));
       if (v?.geojson) activeGeoJSON = v.geojson;
       else if (v?.polygon) activeGeoJSON = { type: "Feature", geometry: v.polygon, properties: v };
       
       if (!activeGeoJSON) {
           const desaLayer = props.spatialLayers.find(l => l.id === "layer_desa" || l.id === "layer_zonasi");
           if (desaLayer && desaLayer.geojson && desaLayer.geojson.features) {
               const feat = desaLayer.geojson.features.find((f: any) => {
                   const p = f.properties || {};
                   const featId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || "");
                   if (featId && featId === sVilId) return true;
                   const featName = p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "";
                   return v && normalizeName(featName) === normalizeName(v.name);
               });
               if (feat) activeGeoJSON = feat;
           }
       }
    } else if (props.selectedDistrictId) {
       const sDistId = String(props.selectedDistrictId);
       const d = props.districts?.find(d => String(d.id) === sDistId || normalizeDistrictName(d.name) === normalizeDistrictName(sDistId));
       
       const kecLayer = props.spatialLayers.find(l => l.id === "layer_kecamatan");
       if (kecLayer && kecLayer.geojson && kecLayer.geojson.features) {
           const feats = kecLayer.geojson.features.filter((f: any) => {
              const district = findDistrictForFeature(f);
              return district && (String(district.id) === sDistId || normalizeDistrictName(district.name) === normalizeDistrictName(sDistId));
           });
           if (feats.length > 0) {
               activeGeoJSON = { type: "FeatureCollection", features: feats };
           }
       }
       
       if (!activeGeoJSON && d?.geojson) {
           activeGeoJSON = d.geojson;
       } else if (!activeGeoJSON && d?.polygon) {
           activeGeoJSON = { type: "Feature", geometry: d.polygon, properties: d };
       }
    }

    if (!activeGeoJSON) {
       return null;
    }

    return generateMapMask(activeGeoJSON);
  }, [props.isCartographyMode, props.selectedDistrictId, props.selectedVillageId, props.districts, props.villages, props.spatialLayers, findDistrictForFeature]);

  // Compile spatial source data from database-tied spatial layers
  const districtsGeoJSON = useMemo(() => {
    const kecLayer = props.spatialLayers.find(l => l.id === "layer_kecamatan");
    if (!kecLayer || !kecLayer.geojson) return null;

    const geo = kecLayer.geojson;
    const features = Array.isArray(geo) ? geo : (geo.type === "FeatureCollection" ? (geo.features || []) : [geo]);

    let filteredFeatures = features;
    if (props.selectedDistrictId) {
      const sDistId = String(props.selectedDistrictId).toLowerCase().trim();
      const districtObj = props.districts?.find(d => String(d.id).toLowerCase().trim() === sDistId || normalizeDistrictName(d.name) === normalizeDistrictName(sDistId));
      const distName = districtObj ? districtObj.name.toLowerCase().trim() : "";

      filteredFeatures = features.filter((feat: any) => {
        const district = findDistrictForFeature(feat);
        if (district) {
          return String(district.id).toLowerCase().trim() === sDistId || normalizeDistrictName(district.name) === normalizeDistrictName(sDistId);
        }
        const featName = String(feat.properties?.KECAMATAN || feat.properties?.name || feat.properties?.WADMKC || "").toLowerCase().trim();
        return distName && (featName === distName || normalizeDistrictName(featName) === normalizeDistrictName(distName) || featName.includes(distName) || distName.includes(featName));
      });
    } else if (props.selectedVillageId) {
      const sVilId = String(props.selectedVillageId).toLowerCase().trim();
      const vilObj = props.villages?.find(v => String(v.id).toLowerCase().trim() === sVilId || String(v.code).toLowerCase().trim() === sVilId || normalizeName(v.name) === normalizeName(sVilId));
      if (vilObj && vilObj.districtId) {
        const pDistId = String(vilObj.districtId).toLowerCase().trim();
        filteredFeatures = features.filter((feat: any) => {
          const district = findDistrictForFeature(feat);
          return district && (String(district.id).toLowerCase().trim() === pDistId || normalizeDistrictName(district.name) === normalizeDistrictName(pDistId));
        });
      }
    }

    const processedFeatures = filteredFeatures.map((feat: any, idx: number) => {
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
  }, [props.spatialLayers, props.districts, props.villages, props.choroplethMetric, props.selectedDistrictId, props.selectedVillageId, findDistrictForFeature, getMetricValue]);

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

  // Memoized GeoJSON for interactive digitizer to prevent layer re-render on map move
  const digitizingGeoJSON = useMemo(() => {
    if (!props.isDigitizing || props.digitizedPoints.length === 0) return null;
    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: props.digitizedPoints
      },
      properties: {}
    };
  }, [props.isDigitizing, props.digitizedPoints]);

  // Memoized GeoJSON for distance measurement to prevent layer re-render on map move
  const measurementGeoJSON = useMemo(() => {
    if (!isMeasuring || measurePoints.length <= 1) return null;
    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: measurePoints
      },
      properties: {}
    };
  }, [isMeasuring, measurePoints]);

  const dynamicInteractiveLayerIds = useMemo(() => {
    const ids = [
      "layer-zonasi",
      "layer-rbi-admin",
      "layer-rbi-roads",
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
        id.includes("investasi") ||
        id.includes("zonasi") ||
        id.includes("land_use") ||
        id.includes("kecamatan")
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
    if (desaFeature && desaFeature.properties) {
      if (event.originalEvent) {
        event.originalEvent.stopPropagation();
      }
      const p = desaFeature.properties;
      const vName = String(p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "").trim();
      const rawKec = String(p.KECAMATAN || p.kecamatan || p.WADMKC || "").trim();
      const cleanKec = rawKec.replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
      
      let resolvedDistrictId = String(p.districtId || p.district_id || p.id_kecamatan || "");
      const matchedDistrict = props.districts.find(d => 
        String(d.id) === resolvedDistrictId ||
        normalizeDistrictName(d.name) === normalizeDistrictName(cleanKec)
      );
      
      if (matchedDistrict) {
        resolvedDistrictId = String(matchedDistrict.id);
      } else {
        resolvedDistrictId = resolvedDistrictId || String(p.districtId || p.district_id || p.id_kecamatan || (cleanKec ? `dist_${cleanKec.toLowerCase().replace(/\s+/g, "_")}` : ""));
      }

      let resolvedVillageId = String(p.id || p.ID_DESA || desaFeature.id || p.KodeBPS || "");
      const matchedVillage = props.villages?.find(v => 
        String(v.id) === resolvedVillageId ||
        String(v.code) === resolvedVillageId ||
        (v.name && vName && v.name.toLowerCase().trim() === vName.toLowerCase().trim() && String(v.districtId) === resolvedDistrictId)
      );

      if (matchedVillage) {
        resolvedVillageId = String(matchedVillage.id);
      } else {
        resolvedVillageId = resolvedVillageId || String(p.id || p.ID_DESA || desaFeature.id || p.KodeBPS || (vName ? `vil_${vName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : ""));
      }

      if (resolvedDistrictId && props.setSelectedDistrictId) {
        props.setSelectedDistrictId(resolvedDistrictId);
      }
      if (resolvedVillageId && props.setSelectedVillageId) {
        props.setSelectedVillageId(resolvedVillageId);
      }
      
      setSelectedZoneFeature({
        geometry: desaFeature.geometry,
        properties: desaFeature.properties,
        id: String(desaFeature.id || vName),
        name: `Desa ${vName || 'Wilayah Desa'}`,
        lngLat: [event.lngLat.lng, event.lngLat.lat]
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
      const kName = district?.name || dtFeature.properties._name || dtFeature.properties.KECAMATAN || 'Kecamatan';
      setSelectedZoneFeature({
        geometry: dtFeature.geometry,
        properties: dtFeature.properties,
        id: String(dId),
        name: `Kecamatan ${kName}`,
        lngLat: [event.lngLat.lng, event.lngLat.lat]
      });
      return;
    }

    // Clicked a thematic zonasi or spatial polygon/line zone (e.g. Pertanian LP2B, Hutan Lindung, Sawah, Sungai, Jalan, dll.)
    const zoneFeature = features.find((f: any) => 
      f.layer.id === "layer-zonasi" ||
      f.layer.id === "layer-jalan" ||
      f.layer.id === "layer-sungai" ||
      f.layer.id.includes("zonasi") ||
      f.layer.id.includes("land_use") ||
      f.layer.id.startsWith("spatial-layer-fill-") ||
      f.layer.id.startsWith("spatial-layer-line-") ||
      f.layer.id.startsWith("spatial-layer-stroke-") ||
      f.layer.id.startsWith("spatial-layer-point-")
    );

    if (zoneFeature && zoneFeature.properties) {
      if (event.originalEvent && typeof event.originalEvent.stopPropagation === 'function') {
        event.originalEvent.stopPropagation();
      }

      let zoneName = zoneFeature.properties.keterangan || 
                     zoneFeature.properties.rpluwu2009 || 
                     zoneFeature.properties.NAMOBJ || 
                     zoneFeature.properties.Nama_Ruas ||
                     zoneFeature.properties.nama_potensi ||
                     zoneFeature.properties.nama || 
                     zoneFeature.properties.name || 
                     '';

      const lid = zoneFeature.layer.id;
      if (!zoneName || zoneName === 'Area Spasial') {
        if (lid.includes('hutan_primer')) zoneName = 'Kawasan Hutan Lahan Kering Primer';
        else if (lid.includes('hutan_sekunder') || lid.includes('lahan_kering_sekunder')) zoneName = 'Kawasan Hutan Lahan Kering Sekunder';
        else if (lid.includes('sawah')) zoneName = 'Lahan Pertanian Basah / Sawah Irigasi (LP2B)';
        else if (lid.includes('mangrove')) zoneName = 'Kawasan Konservasi Hutan Mangrove';
        else if (lid.includes('tambak')) zoneName = 'Kawasan Perikanan Budidaya Tambak';
        else if (lid.includes('sungai')) zoneName = 'Sempadan Sungai & Badan Air';
        else if (lid.includes('jalan')) zoneName = 'Jaringan Jalan & Aksesibilitas';
        else zoneName = 'Zonasi Spasial Wilayah';
      }

      setSelectedZoneFeature({
        geometry: zoneFeature.geometry,
        properties: zoneFeature.properties,
        id: String(zoneFeature.id || zoneName),
        name: zoneName,
        lngLat: [event.lngLat.lng, event.lngLat.lat]
      });

      return;
    }

    // Clicked map background - clear active polygon selection
    setSelectedZoneFeature(null);
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
            "esri-light": {
              type: "raster" as const,
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              ],
              tileSize: 256,
              maxzoom: 16,
              attribution: 'Tiles © Esri'
            }
          },
          layers: [
            {
              id: "esri-light-layer",
              type: "raster" as const,
              source: "esri-light"
            }
          ]
        };
      case "satellite":
        return {
          version: 8,
          sources: {
            "esri-satellite": {
              type: "raster" as const,
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              ],
              tileSize: 256,
              maxzoom: 19,
              minzoom: 0,
              attribution: 'Tiles © Esri'
            }
          },
          layers: [
            {
              id: "esri-satellite-layer",
              type: "raster" as const,
              source: "esri-satellite"
            }
          ]
        };
      case "dark":
        return {
          version: 8,
          sources: {
            "esri-dark": {
              type: "raster" as const,
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              ],
              tileSize: 256,
              maxzoom: 16,
              minzoom: 0,
              attribution: 'Tiles © Esri'
            }
          },
          layers: [
            {
              id: "esri-dark-layer",
              type: "raster" as const,
              source: "esri-dark"
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
              tileSize: 256,
              maxzoom: 20,
              minzoom: 0,
              attribution: '© Google Hybrid'
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
              tileSize: 256,
              maxzoom: 20,
              minzoom: 0,
              attribution: '© Google Maps'
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
            "osm-tiles": {
              type: "raster" as const,
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
              ],
              tileSize: 256,
              maxzoom: 19,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: "osm-tiles-layer",
              type: "raster" as const,
              source: "osm-tiles"
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

  const handleZoomToFitLuwu = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (mapRef.current) {
      mapRef.current.fitBounds(LUWU_BBOX, {
        padding: 40,
        duration: 1500,
        maxZoom: 12
      });
    }
  };

  const handleResetView = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (mapRef.current) {
      let bbox: [number, number, number, number] = [119.85, -3.70, 120.65, -2.45];
      
      // Calculate exact bounding box if district spatial layer is available and a district/village is selected
      if ((props.selectedDistrictId || props.selectedVillageId) && districtsGeoJSON && districtsGeoJSON.features && districtsGeoJSON.features.length > 0) {
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
    <div className="w-full h-full relative z-0 touch-action-pan-y" style={{ touchAction: 'pan-y' }} id="map-parent-container">
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

      {/* Floating Zoom to Fit & Force Sync Controls (Top Right) */}
      <div className="absolute right-3 sm:right-4 top-[110px] z-[70] flex items-center gap-2 font-sans select-none pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300">
        {(props.activeWorkspace === "INVESTOR" || !props.activeWorkspace) && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleForceSync}
            disabled={isForceSyncing}
            className={`flex items-center gap-2 px-3 h-10 rounded-2xl bg-slate-900/90 text-emerald-400 backdrop-blur-xl border border-emerald-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:bg-emerald-950/90 hover:border-emerald-400 transition-all duration-200 cursor-pointer ${
              isForceSyncing ? "opacity-80 cursor-wait ring-2 ring-emerald-500/50" : "hover:scale-105"
            }`}
            title="Force Sync: Sinkronisasi ulang data terbaru dari database Supabase"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-400 ${isForceSyncing ? "animate-spin text-emerald-300" : ""}`} />
            <span className="text-xs font-bold tracking-wide font-mono hidden sm:inline">
              {isForceSyncing ? "Syncing..." : "Force Sync"}
            </span>
          </motion.button>
        )}

        <button
          onClick={handleZoomToFitLuwu}
          className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:bg-emerald-500/15 dark:hover:bg-emerald-400/15 text-slate-800 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90 hover:scale-110 transition-all duration-200 cursor-pointer"
          title="Reset Kamera ke Wilayah Luwu"
        >
          <Maximize className="h-5 w-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Modern Custom Zoom Controls */}
      <div className="absolute right-3 sm:right-4 top-[160px] md:top-auto md:bottom-28 z-[45] flex flex-col gap-2 font-sans select-none pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300">
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

      {/* Unified Floating Basemap & Tactical Map Bar (Fully responsive on Mobile/Android & Desktop) */}
      <div className="flex absolute bottom-[68px] md:bottom-3.5 left-1/2 -translate-x-1/2 z-[40] font-sans select-none items-center pointer-events-none w-auto max-w-[98vw] md:max-w-[95%] px-1">
        <div className="pointer-events-auto bg-slate-900/90 dark:bg-slate-900/95 text-white backdrop-blur-2xl border border-slate-700/80 shadow-[0_8px_32px_rgba(0,0,0,0.55)] rounded-2xl p-1 sm:p-1.5 flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full custom-scrollbar scrollbar-none ring-1 ring-white/10">
          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 shrink-0">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-slate-300 whitespace-nowrap">
              {t('mapControls.baseMap')}
            </span>
          </div>
          <div className="flex bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/60 shrink-0">
            {[
              { id: "osm", label: "OSM", tooltip: t('mapControls.osmTooltip', 'Peta kaya Point of Interest (POI)') },
              { id: "light", label: "Minimalis", tooltip: t('mapControls.minAdminTooltip', 'Peta bersih Esri Light Gray') },
              { id: "dark", label: "Gelap", tooltip: t('mapControls.darkTooltip', 'Peta Basemap Gelap') },
              { id: "satellite", label: "Satelit", tooltip: t('mapControls.satelliteTooltip', 'Citra Satelit Esri') }
            ].map(item => (
              <button
                key={item.id}
                title={item.tooltip}
                onClick={() => setLocalMapMode(item.id as any)}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  localMapMode === item.id
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-700/80 shrink-0" />

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleToggle3D}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer active:scale-95 whitespace-nowrap ${
                viewState.pitch > 20 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle 2D/3D View"
            >
              <Box className="h-3.5 w-3.5" />
              <span>3D</span>
            </button>
            <button
              onClick={handleResetView}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
              title={t('map.reset_view', 'Reset View')}
            >
              <Home className="h-3.5 w-3.5 text-emerald-400" />
              <span>Reset</span>
            </button>

            {(props.activeWorkspace === "INVESTOR" || !props.activeWorkspace) && (
              <>
                <div className="h-4 w-[1px] bg-slate-700/80 shrink-0" />
                <button
                  onClick={handleForceSync}
                  disabled={isForceSyncing}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    isForceSyncing
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 animate-pulse"
                      : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60"
                  }`}
                  title="Force Sync: Sinkronisasi Ulang Data Database Supabase"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isForceSyncing ? "animate-spin" : ""}`} />
                  <span>{isForceSyncing ? "Syncing..." : "Force Sync"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Smooth Style Switch Backdrop Overlay */}
      <AnimatePresence>
        {isStyleSwitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0 z-[1050] bg-slate-950/40 pointer-events-none flex items-center justify-center"
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 text-white border border-emerald-500/30 shadow-2xl">
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
                <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              ) : (
                <Compass className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
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
        pixelRatio={typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1}
        onMove={(evt) => updateViewState(evt.viewState as any)}
        onMoveEnd={updateViewportBounds}
        style={{ width: "100%", height: "100%", outline: "none" }}
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
            map.on('moveend', updateViewportBounds);
            map.on('zoomend', updateViewportBounds);
            updateViewportBounds();
          } catch (e) {
            // ignore
          }
          try {
            if (map && !isNavControlAddedRef.current) {
              // Note: Repositioned to top-right to avoid overlapping custom glassmorphism bottom-right zoom controls
              map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
              isNavControlAddedRef.current = true;
            }
          } catch (e) {
            undefined;
          }

          try {
            if (map && !isScaleControlAddedRef.current) {
              const scaleControl = new maplibregl.ScaleControl({
                maxWidth: 100,
                unit: 'metric' // Wajib metrik untuk standar Indonesia (m / km)
              });
              map.addControl(scaleControl, 'bottom-left');
              isScaleControlAddedRef.current = true;
            }
          } catch (e) {
            undefined;
          }
          
          // EVENT MOUSEMOVE UNTUK MENENTUKAN KURSOR POINTER (TANPA HOVER TOOLTIP MELAYANG)
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
                    f.layer.id === 'layer-rbi-admin' ||
                    f.layer.id === 'layer-rbi-roads' ||
                    f.layer.id === 'investments-layer' ||
                    f.layer.id === 'investments-layer-symbol' ||
                    f.layer.id === 'investments-layer-halo' ||
                    f.layer.id === 'investments-polygon-layer' ||
                    f.layer.id === 'investments-polygon-layer-line' ||
                    f.layer.id.startsWith('spatial-layer-')
                  );

                  if (target) {
                      map.getCanvas().style.cursor = 'pointer';
                  } else {
                      map.getCanvas().style.cursor = '';
                  }
                } catch(e) {}
              }, 40);
          });

        }}
        onError={(e) => {
          // Gracefully handle harmless tile abort cancellations during quick pan/zoom
          const errStatus = (e as any)?.error?.status;
          const errMsg = (e as any)?.error?.message || "";
          if (errStatus === 0 || errMsg.includes("abort") || errMsg.includes("ERR_ABORTED")) {
            return;
          }
        }}
      >
        {/* 0. Cartography Clipping Mask (Inverted Polygon) shifted to end for safe beforeId evaluation */}

        {/* 1. Kecamatan Polygons (Source & Layers tied directly kawan!) */}
        {districtsGeoJSON && (
          <Source id="kecamatan-source" type="geojson" data={forceFeatureCollection(districtsGeoJSON) as any} generateId={true} tolerance={0.3} buffer={64} maxzoom={14} cluster={false}>
            <Layer
              id="kecamatan-layer"
              type="fill"
              layout={{
                visibility: 'visible'
              }}
              paint={{
                "fill-color": ["get", "_color"],
                "fill-opacity": (props.spatialLayers.find(l => l.id === "layer_kecamatan")?.isActive !== false) ? ["get", "_opacity"] : 0,
                "fill-opacity-transition": { duration: 400, delay: 0 }
              }}
            />
            {/* Glow / Casing Layer for Selected Kecamatan */}
            <Layer
              id="layer-batas-kecamatan-glow"
              type="line"
              layout={{
                visibility: 'visible',
                "line-join": "round",
                "line-cap": "round"
              }}
              paint={{
                "line-color": "#f59e0b",
                "line-width": [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  12,
                  0
                ],
                "line-opacity": (props.spatialLayers.find(l => l.id === "layer_kecamatan")?.isActive !== false) ? [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  0.35,
                  0
                ] : 0,
                "line-opacity-transition": { duration: 400, delay: 0 },
                "line-blur": 3
              }}
            />
            <Layer
              id="layer-batas-kecamatan-garis"
              type="line"
              layout={{
                visibility: 'visible',
                "line-join": "round",
                "line-cap": "round"
              }}
              paint={{
                "line-color": [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  "#f59e0b",
                  "#10b981"
                ],
                "line-width": [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  5.0,
                  2.5
                ],
                "line-opacity": (props.spatialLayers.find(l => l.id === "layer_kecamatan")?.isActive !== false) ? 0.9 : 0,
                "line-opacity-transition": { duration: 400, delay: 0 },
                "line-dasharray": [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  ["literal", [1, 0]],
                  ["literal", [3, 2]]
                ]
              }}
            />
            <Layer
              id="labels-kecamatan"
              type="symbol"
              layout={{
                visibility: 'visible',
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
                "text-opacity": (props.spatialLayers.find(l => l.id === "layer_kecamatan")?.isActive !== false && !isDesaLayerActive) ? [
                  "step", ["zoom"],
                  0, 8,
                  1
                ] : 0,
                "text-opacity-transition": { duration: 400, delay: 0 }
              }}
            />
          </Source>
        )}

        {/* Village Boundaries (Batas Admin Desa) Custom Overlay */}
        {desaGeoJSON && (
          <Source id="desa-data" type="geojson" data={forceFeatureCollection(partitionedDesaGeoJSON || desaGeoJSON) as any} generateId={true} tolerance={0.3} buffer={64} maxzoom={14} cluster={false}>
            {/* Glow / Casing Layer for Selected Desa */}
            <Layer
              id="layer-batas-desa-glow"
              type="line"
              layout={{
                visibility: 'visible',
                "line-join": "round",
                "line-cap": "round"
              }}
              paint={{
                "line-color": "#f59e0b",
                "line-width": [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  12,
                  0
                ],
                "line-opacity": isDesaLayerActive ? [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  0.35,
                  0
                ] : 0,
                "line-opacity-transition": { duration: 400, delay: 0 },
                "line-blur": 3
              }}
            />
            <Layer
              id="spatial-layer-line-layer_desa"
              type="line"
              layout={{
                visibility: 'visible',
                "line-join": "round",
                "line-cap": "round"
              }}
              paint={{
                "line-color": [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  "#f59e0b",
                  props.isDarkMode ? "#06b6d4" : "#10b981"
                ],
                "line-width": [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  5.0,
                  2.5
                ],
                "line-opacity": isDesaLayerActive ? 0.9 : 0,
                "line-opacity-transition": { duration: 400, delay: 0 },
                "line-dasharray": [
                  "case",
                  ["boolean", ["get", "_isSelected"], false],
                  ["literal", [1, 0]],
                  ["literal", [2, 2]]
                ]
              }}
            />
            <Layer
              id="spatial-layer-fill-layer_desa"
              type="fill"
              layout={{
                visibility: 'visible'
              }}
              paint={{
                "fill-color": "rgba(0, 0, 0, 0)",
                "fill-opacity": 0,
                "fill-opacity-transition": { duration: 400, delay: 0 }
              }}
            />
            <Layer
              id="labels-desa"
              type="symbol"
              layout={{
                visibility: 'visible',
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
                "text-opacity": isDesaLayerActive ? [
                  "step", ["zoom"],
                  0, 9,
                  1
                ] : 0,
                "text-opacity-transition": { duration: 400, delay: 0 }
              }}
            />
          </Source>
        )}

        {/* 1.1 Zonasi Polygons (Kawasan RTRW) - Mapbox Vector Tile (MVT) */}
        <Source
          id="rtrw-tiles"
          type="vector"
          tiles={[`${typeof window !== 'undefined' ? (import.meta.env.VITE_API_URL || window.location.origin) : ''}/api/tiles/rtrw/{z}/{x}/{y}.pbf`]}
          minzoom={isMobile ? 8 : 5}
          maxzoom={14}
        >
          <Layer
            id="layer-zonasi"
            type="fill"
            source-layer="rtrw"
            layout={{
              visibility: 'visible'
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
                const isZActive = props.spatialLayers.some(l => 
                  (l.id === "layer_zonasi" || 
                   l.id === "layer_land_use_zoning" || 
                   l.id === "gis_zonasi" || 
                   l.id === "Zonasi Pemanfaatan Lahan") && 
                  l.isActive
                );
                if (!isZActive) return 0;
                const zLayer = props.spatialLayers.find(l => 
                  l.id === "layer_zonasi" || 
                  l.id === "layer_land_use_zoning" || 
                  l.id === "gis_zonasi" || 
                  l.id === "Zonasi Pemanfaatan Lahan"
                );
                if (zLayer && typeof zLayer.opacity === 'number' && !isNaN(zLayer.opacity)) {
                  return Math.min(Math.max(zLayer.opacity, 0.4), 0.6);
                }
                return 0.50;
              })(),
              'fill-opacity-transition': { duration: 400, delay: 0 },
              'fill-outline-color': '#ffffff'
            }}
          />
          <Layer
            id="layer-zonasi-outline"
            type="line"
            source-layer="rtrw"
            layout={{
              visibility: 'visible'
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
              'line-opacity': props.spatialLayers.some(l => 
                (l.id === "layer_zonasi" || 
                 l.id === "layer_land_use_zoning" || 
                 l.id === "gis_zonasi" || 
                 l.id === "Zonasi Pemanfaatan Lahan") && 
                l.isActive
              ) ? 0.9 : 0,
              'line-opacity-transition': { duration: 400, delay: 0 }
            }}
          />
        </Source>

        {/* 1.1B Peta Rupa Bumi Indonesia (RBI) - Mapbox Vector Tile (MVT) */}
        <Source
          id="rbi-tiles"
          type="vector"
          tiles={[`${typeof window !== 'undefined' ? (import.meta.env.VITE_API_URL || window.location.origin) : ''}/api/tiles/rbi/{z}/{x}/{y}.pbf`]}
          minzoom={5}
          maxzoom={14}
        >
          <Layer
            id="layer-rbi-admin"
            type="line"
            source-layer="rbi_admin"
            layout={{
              visibility: 'visible'
            }}
            paint={{
              'line-color': '#0ea5e9',
              'line-width': 1.5,
              'line-dasharray': [3, 2],
              'line-opacity': props.spatialLayers.some(l => l.id === "layer_rbi" && l.isActive) ? 0.8 : 0,
              'line-opacity-transition': { duration: 400, delay: 0 }
            }}
          />
          <Layer
            id="layer-rbi-roads"
            type="line"
            source-layer="rbi_jalan"
            layout={{
              visibility: 'visible',
              'line-join': 'round',
              'line-cap': 'round'
            }}
            paint={{
              'line-color': '#f59e0b',
              'line-width': 2,
              'line-opacity': props.spatialLayers.some(l => l.id === "layer_rbi" && l.isActive) ? 0.85 : 0,
              'line-opacity-transition': { duration: 400, delay: 0 }
            }}
          />
        </Source>

        {/* 1.2 Jalan Lines */}
        {displayRoadsGeoJSON && props.heatmapMetric !== "road_density" && (
          <Source id="source-jalan" type="geojson" data={forceFeatureCollection(displayRoadsGeoJSON) as any} generateId={true} tolerance={0.3} buffer={64} maxzoom={14} cluster={false} lineMetrics={true}>
            <Layer
              id="layer-jalan"
              type="line"
              layout={{
                visibility: 'visible',
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#eab308',
                'line-width': 3,
                'line-opacity': (props.spatialLayers.find(l => l.id === "layer_jalan")?.isActive !== false) ? 0.85 : 0,
                'line-opacity-transition': { duration: 400, delay: 0 }
              }}
            />
          </Source>
        )}

        {/* 1.2B Jalan Lines (Heatmap Highlighted) */}
        {highlightedRoadsGeoJSON && props.heatmapMetric === "road_density" && (
          <Source id="source-jalan-heatmap" type="geojson" data={forceFeatureCollection(highlightedRoadsGeoJSON) as any} generateId={true} tolerance={0.3} buffer={64} maxzoom={14} cluster={false}>
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
          <Source id="source-visual-route" type="geojson" data={forceFeatureCollection(visualRouteGeoJSON) as any} generateId={true}>
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
        {(() => {
          // BATCHING THEMATIC OVERLAYS: Combine standard thematic layers into a single Source
          const excludedIds = ["layer_kecamatan", "layer_jalan", "layer_zonasi", "layer_land_use_zoning", "layer_desa", "layer_potensi"];
          const thematicLayers = props.spatialLayers.filter(l => !excludedIds.includes(l.id));
          const customLayers = props.spatialLayers.filter(l => l.id === "layer_potensi");

          const batchedFeatures: any[] = [];
          thematicLayers.forEach(layer => {
            const normalized = partitionedDynamicLayers[layer.id] || dynamicSpatialLayersGeoJSON[layer.id];
            if (normalized && normalized.type === "FeatureCollection" && normalized.features) {
              normalized.features.forEach((feat: any) => {
                batchedFeatures.push({
                  ...feat,
                  properties: {
                    ...feat.properties,
                    __batch_layer_id: layer.id
                  }
                });
              });
            } else if (normalized && normalized.type === "Feature") {
                batchedFeatures.push({
                  ...normalized,
                  properties: {
                    ...normalized.properties,
                    __batch_layer_id: layer.id
                  }
                });
            }
          });

          const batchedSourceData = {
            type: "FeatureCollection",
            features: batchedFeatures
          };

          return (
            <>
              {thematicLayers.length > 0 && batchedFeatures.length > 0 && (
                <Source id="batched-thematic-source" type="geojson" data={batchedSourceData as any} generateId={true} tolerance={0.3} buffer={64} maxzoom={14} cluster={false}>
                  {thematicLayers.map(layer => {
                    const targetOpacity = typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 0.50;
                    const isAct = layer.isActive;
                    return (
                      <React.Fragment key={`batch-${layer.id}`}>
                        {/* Polygon Fill */}
                        <Layer
                          id={`spatial-layer-fill-${layer.id}`}
                          type="fill"
                          filter={['all', ['==', ['get', '__batch_layer_id'], layer.id], ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]]}
                          paint={{
                            "fill-color": layer.color || "#3b82f6",
                            "fill-opacity": isAct ? Math.min(Math.max(targetOpacity, 0.4), 0.6) : 0,
                            "fill-opacity-transition": { duration: 400, delay: 0 },
                            "fill-outline-color": layer.color || "#1e3a8a",
                          }}
                        />
                        {/* Polygon/LineString Stroke */}
                        <Layer
                          id={`spatial-layer-stroke-${layer.id}`}
                          type="line"
                          filter={['all', ['==', ['get', '__batch_layer_id'], layer.id], ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon'], ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']]]}
                          paint={{
                            "line-color": layer.color || "#10b981",
                            "line-width": layer.lineWidth || 2.5,
                            "line-opacity": isAct ? (typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 0.9) : 0,
                            "line-opacity-transition": { duration: 400, delay: 0 },
                          }}
                        />
                        {/* Point Circle */}
                        <Layer
                          id={`spatial-layer-point-${layer.id}`}
                          type="circle"
                          filter={['all', ['==', ['get', '__batch_layer_id'], layer.id], ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]]}
                          paint={{
                            "circle-color": layer.color || "#10b981",
                            "circle-radius": layer.id === "layer_infrastruktur" ? 8 : 6,
                            "circle-opacity": isAct ? (typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1) : 0,
                            "circle-opacity-transition": { duration: 400, delay: 0 },
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "#ffffff",
                            "circle-stroke-opacity": isAct ? (typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1) : 0,
                            "circle-stroke-opacity-transition": { duration: 400, delay: 0 },
                          }}
                        />
                      </React.Fragment>
                    );
                  })}
                </Source>
              )}

              {/* Render custom layers individually (like layer_potensi) */}
              {customLayers.map(layer => {
                const normalized = partitionedDynamicLayers[layer.id] || dynamicSpatialLayersGeoJSON[layer.id];
                if (!normalized || !normalized.type) return null;
                const targetOpacity = typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 0.50;
                const isAct = layer.isActive;
                return (
                  <Source key={`source-${layer.id}`} id={`spatial-source-${layer.id}`} type="geojson" data={forceFeatureCollection(normalized) as any} generateId={true} tolerance={0.3} buffer={64} maxzoom={14} cluster={false}>
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
                        "fill-opacity": isAct ? Math.min(Math.max(targetOpacity, 0.4), 0.6) : 0,
                        "fill-opacity-transition": { duration: 400, delay: 0 },
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
                        "line-opacity": isAct ? (typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 0.9) : 0,
                        "line-opacity-transition": { duration: 400, delay: 0 },
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
                        "circle-opacity": isAct ? (typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1) : 0,
                        "circle-opacity-transition": { duration: 400, delay: 0 },
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#ffffff",
                        "circle-stroke-opacity": isAct ? (typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1) : 0,
                        "circle-stroke-opacity-transition": { duration: 400, delay: 0 },
                      }}
                    />
                  </Source>
                );
              })}
            </>
          );
        })()}

        {/* SIKAP LUWU TERRITORIAL LAYER MASKING SYSTEM (ACCELERATES MOBILE WEBGL RENDERING & MASKS NON-LUWU ZONING) */}
        {luwuTerritoryMaskGeoJSON && (
          <Source id="luwu-zoning-mask-source" type="geojson" data={forceFeatureCollection(luwuTerritoryMaskGeoJSON) as any} generateId={true} tolerance={isMobile ? 0.6 : 0.35}>
            <Layer
              id="luwu-zoning-mask-layer"
              type="fill"
              beforeId="layer-batas-kecamatan-glow"
              layout={{
                visibility: 'visible'
              }}
              paint={{
                "fill-color": props.isDarkMode ? "#020617" : (props.mapMode && props.mapMode.includes("satellite") ? "#020617" : "#0f172a"),
                "fill-opacity": (isZoningOrThematicActive || props.isCartographyMode)
                  ? (props.isCartographyMode ? 1.0 : (props.isDarkMode ? 0.82 : (props.mapMode && props.mapMode.includes("satellite") ? 0.72 : 0.45)))
                  : 0,
                "fill-opacity-transition": { duration: 400, delay: 0 },
                "fill-outline-color": props.isDarkMode ? "#1e293b" : "#64748b"
              }}
            />
          </Source>
        )}

        {/* 3. Native Heatmap Layer */}
        {props.heatmapMetric !== "none" && investmentsGeoJSON && (
          <Source id="investments-heat-source" type="geojson" data={forceFeatureCollection(investmentsGeoJSON) as any} generateId={true}>
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
        {props.isDigitizing && digitizingGeoJSON && (
          <Source
            id="digitizing-line-source"
            type="geojson"
            data={forceFeatureCollection(digitizingGeoJSON) as any}
            generateId={true}
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
            {measurementGeoJSON && (
              <Source
                id="measurement-line-source"
                type="geojson"
                data={forceFeatureCollection(measurementGeoJSON) as any}
                generateId={true}
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

        {/* 5.2 ACTIVE SELECTED INVESTMENT COORDINATE RIPPLE PULSE BEACON */}
        {selectedInvestments.map((inv) => {
          const coords = getCoordinates(inv);
          if (!coords) return null;
          const [lng, lat] = coords;
          const theme = getSectorThemeColor(inv.sector);
          const districtName = props.districts?.find(d => d.id === inv.districtId)?.name || "";

          return (
            <Marker
              key={`selected-beacon-${inv.id}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <div 
                className="relative flex items-center justify-center pointer-events-auto group cursor-pointer" 
                onClick={() => {
                  setDetailModalInvestmentId(inv.id);
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: [lng, lat],
                      zoom: 15,
                      pitch: 35,
                      speed: 1.2,
                      curve: 1.4,
                      essential: true
                    });
                  }
                }}
              >
                {/* Sonar Radar Wave 1 (Wave 1: immediate expansion via ripplePulseExpand) */}
                <div 
                  className="absolute w-32 h-32 rounded-full pointer-events-none animate-ripple-pulse-1"
                  style={{
                    backgroundColor: theme.glow,
                    border: `2px solid ${theme.primary}`
                  }}
                />
                {/* Sonar Radar Wave 2 (Wave 2: +0.7s delayed wave via ripplePulseExpand) */}
                <div 
                  className="absolute w-32 h-32 rounded-full pointer-events-none animate-ripple-pulse-2"
                  style={{
                    backgroundColor: theme.glow,
                    border: `2px solid ${theme.primary}`
                  }}
                />
                {/* Sonar Radar Wave 3 (Wave 3: +1.4s delayed wave via ripplePulseExpand) */}
                <div 
                  className="absolute w-32 h-32 rounded-full pointer-events-none animate-ripple-pulse-3"
                  style={{
                    backgroundColor: theme.glow,
                    border: `2px solid ${theme.primary}`
                  }}
                />

                {/* Direct ripplePulseExpand Outer Wave for high-contrast active radar effect */}
                <div 
                  className="absolute w-28 h-28 rounded-full pointer-events-none animate-ripple-pulse-expand"
                  style={{
                    border: `1.5px dashed ${theme.primary}`,
                    boxShadow: `0 0 16px ${theme.glow}`
                  }}
                />

                {/* Ambient Radiant Glow Aura */}
                <div 
                  className="absolute w-16 h-16 rounded-full blur-md opacity-75 animate-pulse pointer-events-none"
                  style={{
                    backgroundColor: theme.primary
                  }}
                />

                {/* Crosshair Scanner Target Rings */}
                <div 
                  className="absolute w-12 h-12 rounded-full border border-white/60 dark:border-slate-900/60 pointer-events-none animate-spin" 
                  style={{ animationDuration: '8s' }} 
                />

                {/* Central Glowing Core Jewel Pin */}
                <div 
                  className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-950 border-2 shadow-2xl flex items-center justify-center transition-all duration-300 transform group-hover:scale-125 animate-beacon-glow"
                  style={{
                    borderColor: theme.primary,
                    boxShadow: `0 0 24px ${theme.primary}, inset 0 0 10px ${theme.glow}`
                  }}
                >
                  <span className="text-lg select-none leading-none drop-shadow-md">
                    {getIconForData(inv.subSector || '', inv.sector || '', '')}
                  </span>
                  <div 
                    className="absolute -bottom-1 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                    style={{ backgroundColor: theme.primary }}
                  />
                </div>

                {/* Floating Information Pill Label Above Coordinates */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 px-3.5 py-1.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border shadow-2xl flex items-center gap-2.5 pointer-events-none"
                  style={{
                    borderColor: `${theme.primary}90`,
                    boxShadow: `0 12px 30px -5px rgba(0,0,0,0.6), 0 0 20px ${theme.glow}`
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: theme.primary }} />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-extrabold text-white font-sora truncate max-w-[200px]">
                      {inv.name || 'Potensi Investasi'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium flex items-center gap-1">
                      <span className="text-emerald-400 font-semibold">{inv.sector || 'Investasi'}</span>
                      {districtName && (
                        <>
                          <span className="text-slate-500">•</span>
                          <span>{districtName}</span>
                        </>
                      )}
                    </span>
                  </div>
                </motion.div>
              </div>
            </Marker>
          );
        })}

        {/* 5.5 Investment spatial polygons (from Supabase PostGIS geometry) */}
        {investmentsPolygonsGeoJSON && props.heatmapMetric === "none" && (
          <Source id="investments-polygon-source" type="geojson" data={forceFeatureCollection(investmentsPolygonsGeoJSON) as any} generateId={true} tolerance={0.3} buffer={64} maxzoom={14} cluster={false}>
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
            data={forceFeatureCollection(investmentsGeoJSON) as any}
            cluster={true} // BATCHING & OPTIMIZATION: Use clustering if points are very high
            clusterMaxZoom={14}
            clusterRadius={50}
            generateId={true}
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
          <Source id="infrastructure-source" type="geojson" data={forceFeatureCollection(infrastructureGeoJSON) as any} generateId={true}>
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
          <Source id="source-network-route" type="geojson" data={forceFeatureCollection(props.networkRouteGeoJSON) as any} generateId={true}>
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
          <Source id="source-proximity-line" type="geojson" data={forceFeatureCollection(props.proximityLineString) as any} generateId={true}>
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
          <Source id="source-proximity-buffer" type="geojson" data={forceFeatureCollection(props.proximityBufferGeoJSON) as any} generateId={true}>
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
          <Source id="cartography-mask-source" type="geojson" data={forceFeatureCollection(cartographyMaskGeoJSON) as any} generateId={true} tolerance={0.5}>
            <Layer
              id="cartography-mask-layer"
              type="fill"
              beforeId={maskBeforeId}
              paint={{
                "fill-color": props.isDarkMode ? "#020617" : "#ffffff",
                "fill-opacity": props.isCartographyMode ? 1.0 : 0.72,
                "fill-outline-color": props.isDarkMode ? "#334155" : "#cbd5e1"
              }}
            />
          </Source>
        )}

        {/* HIGHLIGHT ACTIVE POLYGON ZONE (0.8 FILL OPACITY + BOLD LINE-COLOR OUTLINE) */}
        {selectedZoneFeature && selectedZoneFeature.geometry && (
          <Source 
            id="active-selected-zone-source" 
            type="geojson" 
            data={{
              type: "Feature",
              geometry: selectedZoneFeature.geometry,
              properties: selectedZoneFeature.properties || {}
            }}
          >
            <Layer
              id="active-selected-zone-fill"
              type="fill"
              paint={{
                "fill-color": selectedZoneFeature.properties?.stroke || selectedZoneFeature.properties?.color || "#10b981",
                "fill-opacity": 0.80, // High-opacity active clicked state (0.8)
                "fill-opacity-transition": { duration: 250 }
              }}
            />
            <Layer
              id="active-selected-zone-stroke"
              type="line"
              paint={{
                "line-color": "#10b981", // Bold Enterprise Emerald outline
                "line-width": 4.5,       // Bold line-width highlight
                "line-opacity": 1.0,
                "line-opacity-transition": { duration: 250 }
              }}
            />
          </Source>
        )}

        {/* ENTERPRISE EMERALD POPUP FOR SELECTED POLYGON ZONE */}
        {selectedZoneFeature && selectedZoneFeature.lngLat && (
          <Popup
            longitude={selectedZoneFeature.lngLat[0]}
            latitude={selectedZoneFeature.lngLat[1]}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedZoneFeature(null)}
            anchor="bottom"
            offset={[0, -15]}
          >
            <div className="p-4 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-emerald-500/40 shadow-2xl text-slate-100 font-sans min-w-[280px] max-w-[340px]">
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
                  <span className="font-bold text-sm text-slate-100 tracking-wide">
                    {selectedZoneFeature.name || 'Zonasi Spasial'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                {(selectedZoneFeature.properties?.keterangan || selectedZoneFeature.properties?.rpluwu2009) && (
                  <div className="flex flex-col bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Rencana Tata Ruang (RTRW)</span>
                    <span className="font-bold text-slate-100">
                      {selectedZoneFeature.properties?.keterangan || selectedZoneFeature.properties?.rpluwu2009}
                    </span>
                  </div>
                )}
                
                {selectedZoneFeature.properties?.KECAMATAN && (
                  <div className="flex justify-between items-center bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400">Kecamatan:</span>
                    <span className="font-semibold text-slate-200">{selectedZoneFeature.properties.KECAMATAN}</span>
                  </div>
                )}

                {selectedZoneFeature.properties?.FUNGSI && (
                  <div className="flex justify-between items-center bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400">Fungsi Kawasan:</span>
                    <span className="font-semibold text-slate-200">{selectedZoneFeature.properties.FUNGSI}</span>
                  </div>
                )}

                {selectedZoneFeature.properties?.Nama_Ruas && (
                  <div className="flex justify-between items-center bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400">Ruas Jalan:</span>
                    <span className="font-semibold text-slate-200">{selectedZoneFeature.properties.Nama_Ruas}</span>
                  </div>
                )}

                <div className="flex justify-between items-center bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400">Luas / Dimensi:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(() => {
                      const raw = selectedZoneFeature.properties?.Luas || selectedZoneFeature.properties?.LUAS || selectedZoneFeature.properties?.areaHa || selectedZoneFeature.properties?.Shape_Area;
                      if (raw) {
                        const num = parseFloat(String(raw));
                        return !isNaN(num) ? `${num.toFixed(2)} Ha` : `${raw} Ha`;
                      }
                      try {
                        const area = turf.area(selectedZoneFeature as any) / 10000;
                        return area > 0 ? `${area.toFixed(2)} Ha` : '-';
                      } catch(e) {
                        return '-';
                      }
                    })()}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/30">
                  <span className="text-emerald-400/80 font-medium">Status Data:</span>
                  <span className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Layer Terpilih (Sesuai Klik)
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        )}

        {/* 9. Mapbox GL Draw Layer */}
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
            onOpenSuitabilityModal={props.onOpenSuitabilityModal}
            isDarkMode={props.isDarkMode ?? false}
            districts={props.districts}
            villages={props.villages}
            selectedDistrictId={props.selectedDistrictId}
            setSelectedDistrictId={props.setSelectedDistrictId}
            selectedVillageId={props.selectedVillageId}
            setSelectedVillageId={props.setSelectedVillageId}
            mapMode={localMapMode}
            setMapMode={setLocalMapMode}
            isLayerPanelOpen={props.isLayerPanelOpen}
            setIsLayerPanelOpen={props.setIsLayerPanelOpen}
            isLeftSidebarOpen={props.isLeftSidebarOpen}
          />
        )}
      </Map>

      {/* Subtitle animation overlay that triggers on mode/layer change kawan */}
      <AnimatePresence>
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0.1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0 z-[5] pointer-events-none bg-slate-900/5 dark:bg-white/5"
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
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                    {t('mapModal.subtitle', 'INTEGRATED SMART RADAR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSmartModalOpen(false)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
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
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Info className="w-3.5 h-3.5" /> {t('mapModal.profileTitle', 'PROFIL INVESTASI')}
                  </h4>
                  <div className="space-y-4">
                    
                    <div className="p-0 bg-transparent rounded-none border-0 shadow-none">
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-medium tracking-wider">{t('mapModal.sectorDominant', 'SEKTOR DOMINAN')}</span>
                      <div className="font-medium text-sm text-slate-800 dark:text-zinc-200 mt-1">
                        <AutoTranslatedText text={activeInvestmentData.sektor || activeInvestmentData.category || t('mapModal.unclassified', 'Belum Diklasifikasi')} inline />
                      </div>
                    </div>

                    <div className="p-0 bg-transparent rounded-none border-0 shadow-none">
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-medium tracking-wider">{t('mapModal.estValue', 'ESTIMASI KAPASITAS / NILAI')}</span>
                      <div className="font-medium text-sm text-slate-800 dark:text-zinc-200 mt-1">
                        {activeInvestmentData.estimatedValue ? formatRupiahSingkat(activeInvestmentData.estimatedValue) : t('mapModal.noData', 'Data tidak tersedia')}
                      </div>
                    </div>
                    
                    <div className="p-0 bg-transparent rounded-none border-0 shadow-none">
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-medium tracking-wider">{t('mapModal.locationDesc', 'DESKRIPSI LOKASI')}</span>
                      <div className="text-xs text-slate-600 leading-relaxed mt-1">
                        <AutoTranslatedText text={activeInvestmentData.description || t('mapModal.noDetailedDesc', 'Tidak ada deskripsi detail untuk titik tata ruang ini.')} />
                      </div>
                    </div>

                  </div>
                </div>

                <div>
                   <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
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
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-bold ml-1">KM</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Column Right: Turf.js Radar Results */}
              <div>
                 <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                     <Layers className="w-3.5 h-3.5" /> {t('mapModal.radarTitle', 'TURF.JS MULTI-SECTOR RADAR')}
                  </h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed italic">
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
                               <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                                 <AutoTranslatedText text={data.name} inline />
                               </span>
                            </div>
                            <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-zinc-800">
                               <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                 {data.distance === Infinity ? "N/A" : (data.distance / 1000).toFixed(2)}
                               </span>
                               <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">KM</span>
                            </div>
                         </div>
                      ))
                    ) : (
                       <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-zinc-700 rounded-xl text-center">
                          <Box className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('mapModal.radarNoData', 'Radar tidak menemukan infrastruktur di sekitar.')}</p>
                       </div>
                    )}
                  </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-zinc-800/80 px-6 py-3 border-t border-slate-100 dark:border-zinc-700/50 text-[10px] text-slate-600 dark:text-slate-400 font-medium flex justify-between items-center">
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
}));

export default MaplibreComponent;// ux polish: implement mobile bottom sheet for basemap selector
// ui hotfix: enforce mobile z-index hierarchy

// architecture pivot: implement strict mobile-first responsive design

// ux polish: enable native maplibre touch gestures
