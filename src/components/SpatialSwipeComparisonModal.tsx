import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  Wheat,
  MapPin,
  Compass,
  ArrowLeftRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sliders,
  ShieldCheck,
  Building2,
  Check
} from "lucide-react";
import { GeoJSONLayer, Investment, District } from "../types";
import { booleanPointInPolygon, point as turfPoint, centroid } from "@turf/turf";

interface SpatialSwipeComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  spatialLayers?: GeoJSONLayer[];
  investments?: Investment[];
  districts?: District[];
  isDark?: boolean;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
}

// Luwu Regency Center
const DEFAULT_CENTER: [number, number] = [120.35, -3.25];
const DEFAULT_ZOOM = 10;

export default function SpatialSwipeComparisonModal({
  isOpen,
  onClose,
  spatialLayers = [],
  investments = [],
  districts = [],
  isDark = true,
  initialCenter,
  initialZoom = DEFAULT_ZOOM,
}: SpatialSwipeComparisonModalProps) {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage (0 - 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [leftBasemap, setLeftBasemap] = useState<"google" | "esri">("google");
  const [rightLayerFilter, setRightLayerFilter] = useState<"ALL" | "LP2B" | "RTRW" | "FOREST" | "INVESTMENTS">("ALL");
  const [isInverted, setIsInverted] = useState<boolean>(false); // Swap left and right

  // Click Inspector State
  const [inspectedPoint, setInspectedPoint] = useState<{
    lng: number;
    lat: number;
    lp2bMatch: boolean;
    layerMatches: string[];
    nearestInvestment?: Investment;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftMapContainerRef = useRef<HTMLDivElement | null>(null);
  const rightMapContainerRef = useRef<HTMLDivElement | null>(null);
  
  const leftMapRef = useRef<maplibregl.Map | null>(null);
  const rightMapRef = useRef<maplibregl.Map | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Basemap style builders
  const getBasemapStyle = useCallback((type: "google" | "esri") => {
    if (type === "google") {
      return {
        version: 8 as const,
        sources: {
          "google-sat": {
            type: "raster" as const,
            tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
            tileSize: 256,
            maxzoom: 20,
            attribution: "© Google Earth Imagery",
          },
        },
        layers: [
          {
            id: "google-sat-layer",
            type: "raster" as const,
            source: "google-sat",
          },
        ],
      };
    }
    return {
      version: 8 as const,
      sources: {
        "esri-sat": {
          type: "raster" as const,
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          maxzoom: 19,
          attribution: "© Esri World Imagery",
        },
      },
      layers: [
        {
          id: "esri-sat-layer",
          type: "raster" as const,
          source: "esri-sat",
        },
      ],
    };
  }, []);

  // Filter spatial layers for the right thematic map
  const activeRightLayers = useMemo(() => {
    return spatialLayers.filter((layer) => {
      const name = (layer.name || "").toLowerCase();
      const code = ((layer as any).code || "").toLowerCase();
      const cat = (layer.category || "").toLowerCase();

      if (rightLayerFilter === "ALL") return true;
      if (rightLayerFilter === "LP2B") {
        return name.includes("lp2b") || name.includes("sawah") || name.includes("pertanian") || code.includes("lp2b") || cat.includes("lp2b");
      }
      if (rightLayerFilter === "RTRW") {
        return name.includes("rtrw") || name.includes("pola ruang") || name.includes("zonasi") || cat.includes("rtrw") || cat.includes("pola_ruang");
      }
      if (rightLayerFilter === "FOREST") {
        return name.includes("hutan") || name.includes("kphp") || name.includes("lindung") || name.includes("konservasi") || cat.includes("forest");
      }
      return true;
    });
  }, [spatialLayers, rightLayerFilter]);

  // Dragging logic for the swipe curtain divider
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(pct);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Click Inspector: test point intersection against active layers
  const handleMapClick = useCallback((lng: number, lat: number) => {
    const pt = turfPoint([lng, lat]);
    const matches: string[] = [];
    let isLp2b = false;

    activeRightLayers.forEach((layer) => {
      const rawGeo = layer.geojson || (layer as any).data;
      if (!rawGeo) return;
      try {
        const data = typeof rawGeo === "string" ? JSON.parse(rawGeo) : rawGeo;
        const features = data.features || (data.type === "Feature" ? [data] : []);
        for (const feat of features) {
          if (feat.geometry && (feat.geometry.type === "Polygon" || feat.geometry.type === "MultiPolygon")) {
            if (booleanPointInPolygon(pt, feat)) {
              matches.push(layer.name);
              const lName = (layer.name || "").toLowerCase();
              if (lName.includes("lp2b") || lName.includes("sawah")) {
                isLp2b = true;
              }
              break;
            }
          }
        }
      } catch (err) {
        // silent fail on parse error
      }
    });

    // Find nearest investment
    let nearestInv: Investment | undefined;
    let minDistance = Infinity;
    investments.forEach((inv) => {
      const invLng = Number((inv as any).longitude ?? (inv as any).lng ?? 0);
      const invLat = Number((inv as any).latitude ?? (inv as any).lat ?? 0);
      if (invLng && invLat) {
        const d = Math.hypot(invLng - lng, invLat - lat);
        if (d < minDistance) {
          minDistance = d;
          nearestInv = inv;
        }
      }
    });

    setInspectedPoint({
      lng: Number(lng.toFixed(6)),
      lat: Number(lat.toFixed(6)),
      lp2bMatch: isLp2b,
      layerMatches: matches,
      nearestInvestment: minDistance < 0.1 ? nearestInv : undefined, // within ~10km
    });
  }, [activeRightLayers, investments]);

  // Initialize dual MapLibre maps
  useEffect(() => {
    if (!isOpen || !leftMapContainerRef.current || !rightMapContainerRef.current) return;

    const centerCoord: [number, number] = initialCenter || DEFAULT_CENTER;

    // 1. Initialize Left Map (Base: Satellite)
    const mapA = new maplibregl.Map({
      container: leftMapContainerRef.current,
      style: getBasemapStyle(leftBasemap) as any,
      center: centerCoord,
      zoom: initialZoom,
      attributionControl: false,
    });

    // 2. Initialize Right Map (Overlay: Thematic Vector & Pola Ruang)
    const mapB = new maplibregl.Map({
      container: rightMapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-light": {
            type: "raster",
            tiles: [
              isDark 
                ? "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
                : "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
            ],
            tileSize: 256,
            attribution: "© CARTO / OpenStreetMap",
          },
        },
        layers: [
          {
            id: "carto-bg-layer",
            type: "raster",
            source: "carto-light",
          },
        ],
      } as any,
      center: centerCoord,
      zoom: initialZoom,
      attributionControl: false,
      interactive: false, // Interactions are captured by mapA and synchronized to mapB
    });

    // Map Sync: mapA controls mapB
    mapA.on("move", () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      mapB.jumpTo({
        center: mapA.getCenter(),
        zoom: mapA.getZoom(),
        bearing: mapA.getBearing(),
        pitch: mapA.getPitch(),
      });
      isSyncingRef.current = false;
    });

    // Handle map click
    mapA.on("click", (e) => {
      handleMapClick(e.lngLat.lng, e.lngLat.lat);
    });

    // Load layers on mapB once loaded
    mapB.on("load", () => {
      // Add spatial layers to mapB
      activeRightLayers.forEach((layer, idx) => {
        const rawGeo = layer.geojson || (layer as any).data;
        if (!rawGeo) return;
        const srcId = `swipe-src-${layer.id || idx}`;
        const fillLayerId = `swipe-fill-${layer.id || idx}`;
        const lineLayerId = `swipe-line-${layer.id || idx}`;

        try {
          const geojson = typeof rawGeo === "string" ? JSON.parse(rawGeo) : rawGeo;
          
          if (!mapB.getSource(srcId)) {
            mapB.addSource(srcId, {
              type: "geojson",
              data: geojson,
            });

            // Assign color based on layer type
            let color = layer.color || "#10b981";
            const lname = (layer.name || "").toLowerCase();
            if (lname.includes("lp2b") || lname.includes("sawah")) color = "#16a34a"; // Green for LP2B
            else if (lname.includes("rtrw") || lname.includes("pola ruang")) color = "#f59e0b"; // Amber for RTRW
            else if (lname.includes("hutan") || lname.includes("kphp")) color = "#059669"; // Emerald for forest
            else if (lname.includes("sungai") || lname.includes("air")) color = "#06b6d4"; // Cyan for water

            mapB.addLayer({
              id: fillLayerId,
              type: "fill",
              source: srcId,
              paint: {
                "fill-color": color,
                "fill-opacity": 0.55,
              },
            });

            mapB.addLayer({
              id: lineLayerId,
              type: "line",
              source: srcId,
              paint: {
                "line-color": color,
                "line-width": 1.5,
                "line-opacity": 0.9,
              },
            });
          }
        } catch (e) {
          // ignore corrupted layer
        }
      });

      // Add real investment points to mapB
      if (investments.length > 0) {
        const invFeatures = investments
          .filter((inv) => {
            const lng = Number((inv as any).longitude ?? (inv as any).lng ?? 0);
            const lat = Number((inv as any).latitude ?? (inv as any).lat ?? 0);
            return !isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0;
          })
          .map((inv) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [
                Number((inv as any).longitude ?? (inv as any).lng),
                Number((inv as any).latitude ?? (inv as any).lat),
              ],
            },
            properties: {
              id: inv.id,
              name: (inv as any).name || (inv as any).title || "Proyek Investasi",
              sektor: (inv as any).sektor || (inv as any).sector || "Investasi",
            },
          }));

        if (invFeatures.length > 0 && !mapB.getSource("swipe-investments")) {
          mapB.addSource("swipe-investments", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: invFeatures,
            },
          });

          mapB.addLayer({
            id: "swipe-investments-glow",
            type: "circle",
            source: "swipe-investments",
            paint: {
              "circle-radius": 8,
              "circle-color": "#f59e0b",
              "circle-opacity": 0.35,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });

          mapB.addLayer({
            id: "swipe-investments-point",
            type: "circle",
            source: "swipe-investments",
            paint: {
              "circle-radius": 5,
              "circle-color": "#ea580c",
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#ffffff",
            },
          });
        }
      }
    });

    leftMapRef.current = mapA;
    rightMapRef.current = mapB;

    return () => {
      try {
        mapA.remove();
        mapB.remove();
      } catch (e) {
        // cleanup safety
      }
      leftMapRef.current = null;
      rightMapRef.current = null;
    };
  }, [isOpen, leftBasemap, getBasemapStyle, isDark, initialCenter, initialZoom, handleMapClick, activeRightLayers, investments]);

  // Update Left Basemap dynamically
  useEffect(() => {
    if (leftMapRef.current) {
      leftMapRef.current.setStyle(getBasemapStyle(leftBasemap) as any);
    }
  }, [leftBasemap, getBasemapStyle]);

  // Handle Zoom In / Out controls
  const handleZoomIn = () => {
    if (leftMapRef.current) leftMapRef.current.zoomIn({ duration: 300 });
  };
  const handleZoomOut = () => {
    if (leftMapRef.current) leftMapRef.current.zoomOut({ duration: 300 });
  };
  const handleResetNorth = () => {
    if (leftMapRef.current) leftMapRef.current.resetNorthPitch({ duration: 500 });
  };

  if (!isOpen) return null;

  // Visual clipping calculation
  const leftClip = isInverted ? `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` : undefined;
  const rightClip = isInverted 
    ? undefined 
    : `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 select-none">
      <div 
        ref={containerRef}
        className={`relative w-full h-full max-w-[1920px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl flex flex-col ${
          isFullscreen ? "max-h-full" : "max-h-[96vh]"
        } bg-slate-900`}
      >
        {/* ── TOP HEADER / TOOLBAR HUD ── */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/60 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                  Mode Tirai Spasial (Swipe Comparison)
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Verifikasi Lapangan
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Bandingkan kondisi faktual citra satelit dengan batas yuridis Pola Ruang & LP2B Luwu
              </p>
            </div>
          </div>

          {/* Quick Presets & Controls */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Presets */}
            <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setSliderPos(25)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sliderPos === 25 ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
                title="Dominan Pola Ruang / LP2B"
              >
                25%
              </button>
              <button
                onClick={() => setSliderPos(50)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sliderPos === 50 ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
                title="Bagi Dua Seimbang (50:50)"
              >
                50% (Tengah)
              </button>
              <button
                onClick={() => setSliderPos(75)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sliderPos === 75 ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
                title="Dominan Citra Satelit"
              >
                75%
              </button>
            </div>

            {/* Invert Sides */}
            <button
              onClick={() => setIsInverted((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Tukar Sisi Kiri & Kanan"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Tukar Sisi</span>
            </button>

            {/* Right Layer Thematic Filter */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700">
              <Wheat className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={rightLayerFilter}
                onChange={(e) => setRightLayerFilter(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-800 text-white">Semua Layer Spasial</option>
                <option value="LP2B" className="bg-slate-800 text-white">Khusus LP2B & Sawah</option>
                <option value="RTRW" className="bg-slate-800 text-white">Pola Ruang RTRW</option>
                <option value="FOREST" className="bg-slate-800 text-white">Kawasan Hutan (KPHP)</option>
              </select>
            </div>

            {/* Basemap Satellite Selector */}
            <select
              value={leftBasemap}
              onChange={(e) => setLeftBasemap(e.target.value as any)}
              className="bg-slate-800 text-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="google">Google Earth Satelit</option>
              <option value="esri">Esri World Imagery</option>
            </select>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title={isFullscreen ? "Kecilkan Layar" : "Layar Penuh"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition-colors"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── MAP CONTAINER VIEWPORT ── */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {/* MAP A (BASE SATELLITE) */}
          <div
            ref={leftMapContainerRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ clipPath: leftClip }}
          />

          {/* MAP B (THEMATIC RTRW & LP2B) */}
          <div
            ref={rightMapContainerRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ clipPath: rightClip }}
          />

          {/* ── DRAGGABLE DIVIDER CURTAIN ── */}
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-auto"
            style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
          >
            {/* Vertical Line */}
            <div className="w-[3px] h-full bg-gradient-to-b from-emerald-400 via-teal-300 to-cyan-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />

            {/* Circular Drag Handle */}
            <div
              onPointerDown={handlePointerDown}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-[1.5px] w-10 h-10 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center cursor-ew-resize transition-transform duration-150 ${
                isDragging ? "scale-125 bg-emerald-950 border-white" : "hover:scale-110"
              }`}
              title="Geser Tirai Kiri / Kanan"
            >
              <div className="flex items-center gap-0.5 text-emerald-300 font-bold text-xs">
                <span>◀</span>
                <span className="text-[10px] opacity-75">|</span>
                <span>▶</span>
              </div>

              {/* Percentage Badge */}
              <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-slate-900/90 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 shadow-lg pointer-events-none whitespace-nowrap">
                {Math.round(sliderPos)}%
              </div>
            </div>
          </div>

          {/* ── LEFT & RIGHT HUD BADGES ── */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-white shadow-xl flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-semibold tracking-wide">
                {isInverted ? "Kiri: Pola Ruang & LP2B" : "Kiri: Citra Satelit Lapangan"}
              </span>
            </div>
            <span className="text-[10px] text-slate-300 bg-slate-950/60 backdrop-blur-sm px-2 py-0.5 rounded-lg w-max">
              {isInverted ? "Batas Yuridis Resmi" : (leftBasemap === "google" ? "Google Earth High-Res" : "Esri World Imagery")}
            </span>
          </div>

          <div className="absolute top-4 right-4 z-10 pointer-events-none flex flex-col items-end gap-1">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-white shadow-xl flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide">
                {isInverted ? "Kanan: Citra Satelit Lapangan" : "Kanan: Pola Ruang & LP2B"}
              </span>
            </div>
            <span className="text-[10px] text-slate-300 bg-slate-950/60 backdrop-blur-sm px-2 py-0.5 rounded-lg w-max">
              {activeRightLayers.length} Layer Terintegrasi
            </span>
          </div>

          {/* ── MAP NAVIGATION CONTROLS (ZOOM / NORTH) ── */}
          <div className="absolute right-4 bottom-6 z-10 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetNorth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
              title="Arahkan ke Utara"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>

          {/* ── CLICK INSPECTOR CARD ── */}
          <AnimatePresence>
            {inspectedPoint && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute left-4 bottom-6 z-10 max-w-sm w-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3.5 text-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs tracking-wide">Hasil Inspeksi Titik</span>
                  </div>
                  <button
                    onClick={() => setInspectedPoint(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Koordinat:</span>
                    <span className="font-mono text-[11px] text-emerald-300">
                      {inspectedPoint.lat}, {inspectedPoint.lng}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Status LP2B:</span>
                    {inspectedPoint.lp2bMatch ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" /> Masuk LP2B / LSD
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> Non-LP2B (Bebas)
                      </span>
                    )}
                  </div>

                  {inspectedPoint.layerMatches.length > 0 && (
                    <div className="pt-1">
                      <span className="text-slate-400 text-[11px] block mb-1">Layer Beririsan:</span>
                      <div className="flex flex-wrap gap-1">
                        {inspectedPoint.layerMatches.map((layerName, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {layerName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {inspectedPoint.nearestInvestment && (
                    <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Proyek Terdekat:</span>
                      <span className="font-medium text-amber-300 truncate max-w-[150px]">
                        {(inspectedPoint.nearestInvestment as any).name || (inspectedPoint.nearestInvestment as any).title}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── HELPER HINT ── */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden sm:block">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[10px] text-slate-300 shadow">
              💡 Klik di peta untuk menginspeksi titik koordinat & zonasi LP2B
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
