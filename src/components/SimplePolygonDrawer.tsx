import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Map, { NavigationControl, MapRef, Source, Layer } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import MaplibreDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from "@turf/turf";
import { Check, X, MapPin, AlertCircle, RefreshCcw, AlertTriangle, Layers, Eye, EyeOff, ShieldAlert, Sparkles, Crop, Compass, Info } from "lucide-react";
import Swal from "sweetalert2";
import { supabase, safeFetchLayerData } from "../lib/supabaseClient";
import { DEFAULT_LUWU_ZONING_GEOJSON } from "../utils/geoUtils";

interface SimplePolygonDrawerProps {
  onSave: (
    geometry: any,
    esgAnalysis?: {
      esgRiskStatus: 'CLEAR' | 'HIGH_RISK_INTERSECTION';
      intersectedZoneName?: string;
      category?: string;
      detail?: string;
    }
  ) => void;
  onCancel: () => void;
  initialGeometry?: any;
  isDarkMode?: boolean;
  roadGeojson?: any;
  zoningGeojson?: any;
  sawahGeojson?: any;
  tambakGeojson?: any;
  mangroveGeojson?: any;
  focusTarget?: {
    districtId?: string;
    districtName?: string;
    districtCoords?: [number, number];
    districtGeojson?: any;
    villageId?: string;
    villageName?: string;
    villageCoords?: [number, number];
    villageGeojson?: any;
  };
}

// Unified version-agnostic Turf difference helper
function safeDifference(feat1: any, feat2: any): any {
  if (!feat1 || !feat2) return null;
  try {
    const poly1 = feat1.type === "Feature" ? feat1 : turf.feature(feat1.geometry || feat1);
    const poly2 = feat2.type === "Feature" ? feat2 : turf.feature(feat2.geometry || feat2);
    
    if ((turf as any).difference) {
      try {
        return (turf as any).difference(turf.featureCollection([poly1, poly2]));
      } catch (e) {
        return (turf as any).difference(poly1, poly2);
      }
    }
  } catch (err) {
    console.warn("safeDifference calculation error:", err);
  }
  return null;
}

export default function SimplePolygonDrawer({
  onSave,
  onCancel,
  initialGeometry,
  isDarkMode = false,
  roadGeojson,
  zoningGeojson,
  sawahGeojson,
  tambakGeojson,
  mangroveGeojson,
  focusTarget
}: SimplePolygonDrawerProps) {
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<any>(null);
  
  // Basemap switcher state: streets vs satellite
  const [basemap, setBasemap] = useState<"streets" | "satellite">("satellite");
  
  // Layer visibility controls
  const [showInvertedMask, setShowInvertedMask] = useState<boolean>(true);
  const [showZoningLayer, setShowZoningLayer] = useState<boolean>(true);
  const [showSawahLayer, setShowSawahLayer] = useState<boolean>(true);
  const [showTambakLayer, setShowTambakLayer] = useState<boolean>(true);
  const [showMangroveLayer, setShowMangroveLayer] = useState<boolean>(true);

  // Administrative GIS datasets loaded from public folder if not passed as props
  const [kecamatanData, setKecamatanData] = useState<any>(null);
  const [desaData, setDesaData] = useState<any>(null);
  const [sawahDataState, setSawahDataState] = useState<any>(sawahGeojson || null);
  const [tambakDataState, setTambakDataState] = useState<any>(tambakGeojson || null);
  const [mangroveDataState, setMangroveDataState] = useState<any>(mangroveGeojson || null);

  // State for Turf.js live ESG intersection radar
  const [intersectedProtectedZones, setIntersectedProtectedZones] = useState<{
    isProtected: boolean;
    zoneName: string;
    category: string;
    detail: string;
  } | null>(null);

  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  const [viewState, setViewState] = useState({
    longitude: 120.252,
    latitude: -3.203,
    zoom: 11,
    pitch: 0,
    bearing: 0
  });

  const [zoningDataState, setZoningDataState] = useState<any>(null);

  // Effective zoning dataset
  const activeZoningData = useMemo(() => {
    if (zoningGeojson && zoningGeojson.features && Array.isArray(zoningGeojson.features) && zoningGeojson.features.length > 0) {
      return zoningGeojson;
    }
    if (zoningDataState && zoningDataState.features && Array.isArray(zoningDataState.features) && zoningDataState.features.length > 0) {
      return zoningDataState;
    }
    return null;
  }, [zoningGeojson, zoningDataState]);

  // Load administrative & thematic GIS datasets from public directory
  useEffect(() => {
    if (!zoningGeojson) {
      safeFetchLayerData("gis_zonasi").then((data) => {
        if (data) {
          const dataArray = (data && data.type === 'FeatureCollection') ? data.features : data;
          const features = dataArray.map((f: any) => ({
            type: "Feature",
            geometry: f.geometry || null,
            properties: f.properties || f
          }));
          setZoningDataState({ type: "FeatureCollection", features });
        }
      });
    }

    // 1. Kecamatan GeoJSON
    fetch("/gis_kecamatan.json")
      .then(async res => {
        if (!res || !res.ok) return null;
        return JSON.parse(await res.text());
      })
      .then(data => data && setKecamatanData(data))
      .catch(err => console.error("Error loading gis_kecamatan.json:", err));

    // 2. Desa GeoJSON
    fetch("/gis_desa.json")
      .then(async res => {
        if (!res || !res.ok) return null;
        return JSON.parse(await res.text());
      })
      .then(data => data && setDesaData(data))
      .catch(err => console.error("Error loading gis_desa.json:", err));

    // 3. Sawah GeoJSON (if not supplied via props)
    if (!sawahGeojson) {
      fetch("/gis_sawah.json")
        .then(async res => {
          if (!res || !res.ok) return null;
          return JSON.parse(await res.text());
        })
        .then(data => data && setSawahDataState(data))
        .catch(err => console.error("Error loading gis_sawah.json:", err));
    }

    // 4. Tambak GeoJSON (if not supplied via props)
    if (!tambakGeojson) {
      fetch("/gis_tambak.json")
        .then(async res => {
          if (!res || !res.ok) return null;
          return JSON.parse(await res.text());
        })
        .then(data => data && setTambakDataState(data))
        .catch(err => console.error("Error loading gis_tambak.json:", err));
    }

    // 5. Mangrove GeoJSON (if not supplied via props)
    if (!mangroveGeojson) {
      fetch("/gis_mangrove.json")
        .then(async res => {
          if (!res || !res.ok) return null;
          return JSON.parse(await res.text());
        })
        .then(data => data && setMangroveDataState(data))
        .catch(err => console.error("Error loading gis_mangrove.json:", err));
    }
  }, [sawahGeojson, tambakGeojson, mangroveGeojson]);

  const [fetchedBoundaryGeojson, setFetchedBoundaryGeojson] = useState<any>(null);

  // ─── DYNAMIC SUPABASE FETCH FOR BOUNDARY CLIPPING ───
  useEffect(() => {
    let isMounted = true;
    const fetchBoundary = async () => {
      // 1. Try to fetch Village Boundary
      if (focusTarget?.villageId || focusTarget?.villageName) {
        if (!focusTarget.villageGeojson) {
          const data = await safeFetchLayerData("gis_desa");
          if (data && isMounted) {
            const features = data.type === 'FeatureCollection' ? data.features : data;
            const match = features.find((f: any) => 
              String(f.properties?.ID_DESA || f.properties?.id) === String(focusTarget.villageId) ||
              (f.properties?.DESA || f.properties?.desa || f.properties?.NAME || "").toLowerCase().includes((focusTarget.villageName || "___INVALID___").toLowerCase())
            );
            if (match) {
              setFetchedBoundaryGeojson({ type: "Feature", geometry: match.geometry || match.geom, properties: match.properties });
              return;
            }
          }
        }
      }
      
      // 2. Fallback to fetch District Boundary
      if (focusTarget?.districtId || focusTarget?.districtName) {
        if (!focusTarget.districtGeojson) {
          const data = await safeFetchLayerData("gis_kecamatan");
          if (data && isMounted) {
            const features = data.type === 'FeatureCollection' ? data.features : data;
            const match = features.find((f: any) => 
              String(f.properties?.ID_KEC || f.properties?.id) === String(focusTarget.districtId) ||
              (f.properties?.KECAMATAN || f.properties?.kecamatan || f.properties?.NAME || "").toLowerCase().includes((focusTarget.districtName || "___INVALID___").toLowerCase())
            );
            if (match) {
              setFetchedBoundaryGeojson({ type: "Feature", geometry: match.geometry || match.geom, properties: match.properties });
              return;
            }
          }
        }
      }
    };
    fetchBoundary();
    return () => { isMounted = false; };
  }, [focusTarget?.villageId, focusTarget?.villageName, focusTarget?.districtId, focusTarget?.districtName]);

  // ─── ACTIVE ADMINISTRATIVE BOUNDARY EXTRACTION ───
  const activeBoundaryFeature = useMemo(() => {
    // Priority 0: Dynamically fetched boundary from Supabase
    if (fetchedBoundaryGeojson) {
      return fetchedBoundaryGeojson;
    }

    // Priority 1: Direct Village GeoJSON from focusTarget
    if (focusTarget?.villageGeojson) {
      return focusTarget.villageGeojson.type === "Feature"
        ? focusTarget.villageGeojson
        : turf.feature(focusTarget.villageGeojson.geometry || focusTarget.villageGeojson);
    }

    // Priority 2: Match Village from loaded desaData
    if (desaData && desaData.features && focusTarget?.villageId) {
      const match = desaData.features.find((f: any) => {
        const name = (f.properties?.DESA || f.properties?.desa || f.properties?.NAME || "").toLowerCase();
        const id = (f.properties?.ID_DESA || f.properties?.id || "").toLowerCase();
        return id === focusTarget.villageId.toLowerCase() ||
               name.includes(focusTarget.villageName?.toLowerCase() || "___INVALID___");
      });
      if (match) return match;
    }

    // Priority 3: Direct District GeoJSON from focusTarget
    if (focusTarget?.districtGeojson) {
      return focusTarget.districtGeojson.type === "Feature"
        ? focusTarget.districtGeojson
        : turf.feature(focusTarget.districtGeojson.geometry || focusTarget.districtGeojson);
    }

    // Priority 4: Match District from loaded kecamatanData
    if (kecamatanData && kecamatanData.features && focusTarget?.districtId) {
      const match = kecamatanData.features.find((f: any) => {
        const rawName = f.properties?.KECAMATAN || f.properties?.kecamatan || f.properties?.NAME || "";
        const cleanName = rawName.toLowerCase().replace(/kec\.\s*/i, "").trim().replace(/\s+/g, "_");
        const idFromName = `dist_${cleanName}`;
        return idFromName === String(focusTarget.districtId || "").toLowerCase() ||
               rawName.toLowerCase().includes(String(focusTarget.districtName || "").toLowerCase() || "___INVALID___");
      });
      if (match) return match;
    }

    return null;
  }, [focusTarget, desaData, kecamatanData]);

  // ─── INVERTED MASKING PROTOCOL (THE CLIPPING EFFECT) ───
  const invertedMaskGeojson = useMemo(() => {
    if (!activeBoundaryFeature) return null;
    try {
      // Massive outer box polygon covering South Sulawesi / Luwu Region
      const outerBoxPolygon = turf.polygon([[
        [110.0, -12.0],
        [130.0, -12.0],
        [130.0, 5.0],
        [110.0, 5.0],
        [110.0, -12.0]
      ]]);

      return safeDifference(outerBoxPolygon, activeBoundaryFeature);
    } catch (err) {
      console.warn("Failed to generate inverted mask GeoJSON:", err);
      return null;
    }
  }, [activeBoundaryFeature]);

  // ─── AUTO FLY-TO CONTEXT LOGIC ───
  const triggerAutoFlyTo = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    // 1. Priority A: Initial Geometry fitBounds
    if (initialGeometry && initialGeometry.coordinates && initialGeometry.coordinates.length > 0) {
      try {
        const feature = { type: "Feature" as const, properties: {}, geometry: initialGeometry };
        const bbox = turf.bbox(feature);
        if (bbox && !bbox.some(isNaN)) {
          map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
            padding: 60,
            maxZoom: 16,
            duration: 1500
          });
          return;
        }
      } catch (e) {
        console.warn("Initial geometry bbox error:", e);
      }
    }

    // 2. Priority B: Use active boundary feature fitBounds
    if (activeBoundaryFeature) {
      try {
        const bbox = turf.bbox(activeBoundaryFeature);
        if (bbox && bbox.length === 4 && !bbox.some(isNaN)) {
          map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
            padding: 70,
            maxZoom: focusTarget?.villageId ? 15 : 13,
            duration: 2000
          });
          return;
        }
      } catch (err) {
        console.warn("Error fitting bounds to activeBoundaryFeature:", err);
      }
    }

    // 3. Priority C: Use coordinates center
    const getCorrectedCenter = (coords?: [number, number]): [number, number] | null => {
      if (!coords || !Array.isArray(coords) || coords.length < 2) return null;
      let [c1, c2] = coords;
      if (typeof c1 !== "number" || typeof c2 !== "number" || (c1 === 0 && c2 === 0)) return null;
      if (Math.abs(c1) < 10 && Math.abs(c2) > 100) return [c2, c1];
      return [c1, c2];
    };

    const center = getCorrectedCenter(focusTarget?.villageCoords) || getCorrectedCenter(focusTarget?.districtCoords);
    if (center) {
      map.flyTo({
        center,
        zoom: focusTarget?.villageId ? 14 : 12,
        essential: true,
        duration: 2000
      });
    }
  }, [focusTarget, initialGeometry, activeBoundaryFeature]);

  // Trigger auto flyTo when map or boundary context ready with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerAutoFlyTo();
    }, 400); // 400ms debounce to prevent tile cancellation spam during quick re-renders
    return () => clearTimeout(timer);
  }, [triggerAutoFlyTo]);

  // ─── LIVE ESG RADAR & BOUNDARY ENFORCEMENT ───
  const handleDrawEvent = useCallback((evt: any) => {
    if (!drawRef.current) return;
    const data = drawRef.current.getAll();
    
    if (!data || data.features.length === 0) {
      setIsOutOfBounds(false);
      setIntersectedProtectedZones(null);
      return;
    }

    const drawnFeature = data.features[0];
    const drawnGeom = drawnFeature.geometry;
    
    // 1. Strict Administrative Boundary Enforcement
    if (activeBoundaryFeature) {
      try {
        let isWithin = false;
        if (drawnGeom.type === "Point") {
          isWithin = turf.booleanPointInPolygon(drawnFeature as any, activeBoundaryFeature as any);
        } else {
          isWithin = turf.booleanWithin(drawnFeature as any, activeBoundaryFeature as any);
        }

        setIsOutOfBounds(!isWithin);
        if (!isWithin) {
          Swal.fire({
            icon: 'warning',
            title: 'MELAMPAUI BATAS WILAYAH',
            text: 'Area digitasi melampaui batas administrasi desa terpilih. Harap posisikan poligon di dalam batas wilayah.',
            confirmButtonColor: '#e11d48',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4500
          });
        }
      } catch (err) {
        console.warn("Boundary enforcement check error:", err);
      }
    }

    // 2. Live ESG Radar - Turf.js Zoning Intersection Check
    let foundWarning: { isProtected: boolean; zoneName: string; category: string; detail: string } | null = null;

    if (activeZoningData && activeZoningData.features && (drawnGeom.type === "Polygon" || drawnGeom.type === "MultiPolygon")) {
      for (const zoneFeature of activeZoningData.features) {
        try {
          const intersects = turf.booleanIntersects(drawnFeature as any, zoneFeature as any);
          if (intersects) {
            const props = zoneFeature.properties || {};
            const kat = (props.kategori || props.zona || props.nama_zona || "").toLowerCase();
            const isLindung = kat.includes("lindung") || kat.includes("konservasi") || kat.includes("hutan lindung");
            
            if (isLindung) {
              foundWarning = {
                isProtected: true,
                zoneName: props.nama_zona || props.zona || "Kawasan Hutan Lindung & Konservasi",
                category: props.kategori || "Hutan Lindung & Konservasi",
                detail: props.ketentuan_khusus || "Dilarang alih fungsi ekstraktif/industri tanpa SK PKKPR khusus."
              };
              break;
            } else if (!foundWarning && (kat.includes("pertanian") || kat.includes("lp2b") || kat.includes("hijau"))) {
              foundWarning = {
                isProtected: false,
                zoneName: props.nama_zona || props.zona || "Zona LP2B / Pertanian",
                category: props.kategori || "Lahan Pertanian Berkelanjutan (LP2B)",
                detail: props.ketentuan_khusus || "Wajib memenuhi syarat alih fungsi lahan LP2B."
              };
            }
          }
        } catch (err) {
          console.warn("Turf zoning intersection check error:", err);
        }
      }
    }

    setIntersectedProtectedZones(foundWarning);
  }, [activeBoundaryFeature, activeZoningData]);

  useEffect(() => {
    return () => {
      const map = mapRef.current?.getMap();
      if (map) {
        map.off("draw.create", handleDrawEvent);
        map.off("draw.update", handleDrawEvent);
        map.off("draw.delete", handleDrawEvent);
      }
    };
  }, [handleDrawEvent]);

  const onMapLoad = useCallback((e: any) => {
    const map = e.target;
    
    // Inisialisasi MaplibreDraw (Polygon Mode)
    const draw = new MaplibreDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: "draw_polygon",
      styles: ((MaplibreDraw as any).lib?.theme || []).map((style: any) => {
        if (style.paint && style.paint['line-dasharray']) {
          delete style.paint['line-dasharray'];
        }
        return style;
      })
    });
    
    map.addControl(draw, "top-left");
    drawRef.current = draw;

    // Listeners for draw events
    map.on("draw.create", handleDrawEvent);
    map.on("draw.update", handleDrawEvent);
    map.on("draw.delete", handleDrawEvent);

    if (initialGeometry && initialGeometry.coordinates && initialGeometry.coordinates.length > 0) {
      try {
        const feature = {
          type: "Feature" as any,
          properties: {},
          geometry: initialGeometry
        };
        draw.add(feature);
        
        const bbox = turf.bbox(feature);
        if (bbox && !bbox.some(isNaN)) {
          map.fitBounds(
            [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
            { padding: 60, maxZoom: 16 }
          );
        }
        draw.changeMode("simple_select");
      } catch(err) {
        console.error("Gagal load initial geometry", err);
      }
    } else {
      triggerAutoFlyTo();
      setTimeout(() => {
        try {
          if (drawRef.current) {
            drawRef.current.changeMode("draw_polygon");
          }
        } catch(e) {}
      }, 400);
    }
  }, [initialGeometry, triggerAutoFlyTo, handleDrawEvent]);

  const handleSave = () => {
    if (!drawRef.current) return;
    
    const data = drawRef.current.getAll();
    if (data.features.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Poligon Kosong',
        text: 'Silakan gambar area potensi investasi terlebih dahulu pada peta.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }
    
    const polygonFeature = data.features[0];
    const geom = polygonFeature.geometry;
    
    if (geom.type !== "Polygon") {
      Swal.fire('Format Salah', 'Geometry yang digambar harus berupa Polygon.', 'error');
      return;
    }

    if (geom.coordinates && Array.isArray(geom.coordinates)) {
      const validatedCoordinates = geom.coordinates.map((ring: any[]) => {
        return ring.map((coord: any[]) => {
          let lng = Number(coord[0]);
          let lat = Number(coord[1]);
          if (Math.abs(lat) > 50 && Math.abs(lng) < 10) {
             const tmp = lng;
             lng = lat;
             lat = tmp;
          }
          return [lng, lat];
        });
      });
      geom.coordinates = validatedCoordinates;
    }

    const esgAnalysis = intersectedProtectedZones?.isProtected ? {
      esgRiskStatus: 'HIGH_RISK_INTERSECTION' as const,
      intersectedZoneName: intersectedProtectedZones.zoneName,
      category: intersectedProtectedZones.category,
      detail: intersectedProtectedZones.detail
    } : {
      esgRiskStatus: 'CLEAR' as const
    };
    
    onSave(geom, esgAnalysis);
  };

  const handleReset = () => {
    if (drawRef.current) {
       drawRef.current.deleteAll();
       drawRef.current.changeMode("draw_polygon");
       setIsOutOfBounds(false);
       setIntersectedProtectedZones(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900 shadow-2xl overflow-hidden animate-fadeIn">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-slate-800 text-white px-6 py-3 border-b border-white/10 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Crop className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg font-display tracking-wide flex items-center gap-2 text-white">
              DIGITISASI AREA INVESTASI
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500 text-white tracking-widest uppercase shadow-sm">
                SMART STUDIO
              </span>
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              {focusTarget?.villageName ? (
                <>Fokus Wilayah Terkliping: <strong className="text-emerald-300">Desa {focusTarget.villageName}</strong>, Kec. {focusTarget.districtName || '-'}</>
              ) : focusTarget?.districtName ? (
                <>Fokus Wilayah Terkliping: <strong className="text-emerald-300">Kec. {focusTarget.districtName}</strong></>
              ) : (
                "Sistem Kliping Otomatis Aktif - Klik peta untuk membuat pola lahan."
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Reset
          </button>
          
          <button
            onClick={handleSave}
            disabled={isOutOfBounds}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold shadow transition ${
              isOutOfBounds 
                ? "bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
            }`}
          >
            <Check className="h-4 w-4" /> SIMPAN POLYGON
          </button>
          
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
            title="Batal"
          >
            <X className="h-4 w-4" /> TUTUP
          </button>
        </div>
      </div>

      {/* Map Canvas Wrapper */}
      <div className="flex-1 relative bg-slate-950">
        {/* ── IN-MAP WARNING TOAST (ESG RADAR DETECTED PROTECTED ZONE) ── */}
        {intersectedProtectedZones?.isProtected && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[30] w-[94%] max-w-2xl bg-amber-500/95 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl border-2 border-amber-300 backdrop-blur-md flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-950 text-amber-400 shrink-0 shadow">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[10px] tracking-wider uppercase bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                    ESG WARNING
                  </span>
                  <span className="text-xs font-extrabold text-slate-950 underline">
                    {intersectedProtectedZones.zoneName}
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight mt-1 text-slate-950">
                  ⚠️ Poligon menabrak Kawasan Lindung. Legitimasi (SK PKKPR) akan dibutuhkan saat menyimpan data.
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900/20 text-slate-950 border border-slate-900/30 shrink-0">
              LIVE ESG RADAR
            </div>
          </div>
        )}

        {/* Floating Controls: Clipping Mask & Thematic Overlay Switchers */}
        <div className="absolute top-4 right-14 z-[25] bg-slate-900/95 backdrop-blur border border-white/10 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xl flex-wrap max-w-2xl">
          {/* Mask Toggle */}
          <button
            type="button"
            onClick={() => setShowInvertedMask(!showInvertedMask)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              showInvertedMask
                ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title="Sembunyikan/Tampilkan Masker Kliping Luar Wilayah"
          >
            <Crop className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kliping Masker</span>
          </button>

          <div className="h-4 w-[1px] bg-white/20" />

          {/* Zonasi Pemanfaatan Lahan */}
          <button
            type="button"
            onClick={() => setShowZoningLayer(!showZoningLayer)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              showZoningLayer
                ? "bg-purple-600/30 text-purple-300 border-purple-500/50"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title="Toggle Overlay Zonasi Tata Ruang"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Zonasi Pemanfaatan Lahan</span>
          </button>

          {/* Sawah */}
          <button
            type="button"
            onClick={() => setShowSawahLayer(!showSawahLayer)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              showSawahLayer
                ? "bg-lime-600/30 text-lime-300 border-lime-500/50"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title="Toggle Contextual Lahan Sawah"
          >
            <span className="w-2 h-2 rounded-full bg-lime-400 inline-block" />
            <span>Sawah</span>
          </button>

          {/* Tambak */}
          <button
            type="button"
            onClick={() => setShowTambakLayer(!showTambakLayer)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              showTambakLayer
                ? "bg-cyan-600/30 text-cyan-300 border-cyan-500/50"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title="Toggle Contextual Lahan Tambak"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span>Tambak</span>
          </button>

          {/* Mangrove */}
          <button
            type="button"
            onClick={() => setShowMangroveLayer(!showMangroveLayer)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              showMangroveLayer
                ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title="Toggle Contextual Lahan Mangrove"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Mangrove</span>
          </button>

          <div className="h-4 w-[1px] bg-white/20" />

          {/* Basemap Switcher */}
          <button
            type="button"
            onClick={() => setBasemap("streets")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              basemap === "streets"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Peta
          </button>
          <button
            type="button"
            onClick={() => setBasemap("satellite")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              basemap === "satellite"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Satelit
          </button>
        </div>

        <Map
          ref={mapRef}
          {...viewState}
          maxZoom={22}
          minZoom={5}
          onMove={(e) => setViewState(e.viewState)}
          transformRequest={(url) => {
            if (url.includes('cartocdn.com') || url.includes('openstreetmap.org') || url.includes('google') || url.includes('arcgisonline.com')) {
              return { url, headers: {} };
            }
            return { url };
          }}
          mapStyle={
            basemap === "streets"
              ? {
                  version: 8,
                  sources: {
                    "esri-light": {
                      type: "raster",
                      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"],
                      tileSize: 256,
                      attribution: "Tiles © Esri"
                    }
                  },
                  layers: [
                    {
                      id: "esri-light-layer",
                      type: "raster",
                      source: "esri-light",
                      minzoom: 0,
                      maxzoom: 22
                    }
                  ]
                }
              : {
                  version: 8,
                  sources: {
                    "esri-satellite": {
                      type: "raster",
                      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                      tileSize: 256,
                      attribution: "Tiles © Esri"
                    }
                  },
                  layers: [
                    {
                      id: "esri-satellite-layer",
                      type: "raster",
                      source: "esri-satellite",
                      minzoom: 0,
                      maxzoom: 22
                    }
                  ]
                }
          }
          mapLib={maplibregl}
          onLoad={onMapLoad}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />
          
          {/* ── 1. CONTEXTUAL THEMATIC LAYERS (VISIBLE INSIDE UNMASKED HOLE) ── */}
          
          {/* Layer 1: Zonasi Kawasan (RTRW / Perda 06/2011) */}
          {showZoningLayer && activeZoningData && (
            <Source id="zoning-source" type="geojson" data={activeZoningData}>
              <Layer
                id="zoning-layer-fill"
                type="fill"
                paint={{
                  "fill-color": [
                    "match",
                    ['coalesce', ['get', 'KATEGORI'], ['get', 'kategori'], ['get', 'Kategori'], ['get', 'NAMOBJ'], ['get', 'nama_zona'], ['get', 'zona'], ''],
                    "Kawasan Lindung", "#ef4444",
                    "Lahan Pertanian Berkelanjutan (LP2B)", "#f59e0b",
                    "Kawasan Perkebunan", "#84cc16",
                    "Kawasan Industri", "#3b82f6",
                    "Komersial & Perdagangan", "#8b5cf6",
                    "Kawasan Permukiman", "#a855f7",
                    "Permukiman", "#0ea5e9",
                    "Kawasan Perdagangan dan Jasa", "#ec4899",
                    "Kawasan Hutan Lindung", "#166534",
                    "Kawasan Hutan Produksi", "#15803d",
                    "Sempadan Pantai", "#0ea5e9",
                    "Sempadan Sungai", "#0284c7",
                    /* default */ "#10b981"
                  ],
                  "fill-opacity": 0.25
                }}
              />
              <Layer
                id="zoning-layer-stroke"
                type="line"
                paint={{
                  "line-color": [
                    "match",
                    ['coalesce', ['get', 'KATEGORI'], ['get', 'kategori'], ['get', 'Kategori'], ['get', 'NAMOBJ'], ['get', 'nama_zona'], ['get', 'zona'], ''],
                    "Kawasan Lindung", "#dc2626",
                    "Lahan Pertanian Berkelanjutan (LP2B)", "#d97706",
                    "Kawasan Perkebunan", "#65a30d",
                    "Kawasan Industri", "#2563eb",
                    "Komersial & Perdagangan", "#7c3aed",
                    "Kawasan Permukiman", "#9333ea",
                    "Permukiman", "#0284c7",
                    "Kawasan Perdagangan dan Jasa", "#db2777",
                    "Kawasan Hutan Lindung", "#14532d",
                    "Kawasan Hutan Produksi", "#166534",
                    "Sempadan Pantai", "#0284c7",
                    "Sempadan Sungai", "#0369a1",
                    /* default */ "#059669"
                  ],
                  "line-width": 1.2,
                  "line-opacity": 0.8
                }}
              />
            </Source>
          )}

          {/* Layer 2: Lahan Sawah */}
          {showSawahLayer && sawahDataState && (
            <Source id="sawah-source" type="geojson" data={sawahDataState}>
              <Layer
                id="sawah-layer-fill"
                type="fill"
                paint={{
                  "fill-color": "#84cc16",
                  "fill-opacity": 0.3
                }}
              />
              <Layer
                id="sawah-layer-stroke"
                type="line"
                paint={{
                  "line-color": "#65a30d",
                  "line-width": 1.2,
                  "line-opacity": 0.8
                }}
              />
            </Source>
          )}

          {/* Layer 3: Lahan Tambak */}
          {showTambakLayer && tambakDataState && (
            <Source id="tambak-source" type="geojson" data={tambakDataState}>
              <Layer
                id="tambak-layer-fill"
                type="fill"
                paint={{
                  "fill-color": "#06b6d4",
                  "fill-opacity": 0.3
                }}
              />
              <Layer
                id="tambak-layer-stroke"
                type="line"
                paint={{
                  "line-color": "#0891b2",
                  "line-width": 1.2,
                  "line-opacity": 0.8
                }}
              />
            </Source>
          )}

          {/* Layer 4: Lahan Mangrove */}
          {showMangroveLayer && mangroveDataState && (
            <Source id="mangrove-source" type="geojson" data={mangroveDataState}>
              <Layer
                id="mangrove-layer-fill"
                type="fill"
                paint={{
                  "fill-color": "#059669",
                  "fill-opacity": 0.35
                }}
              />
              <Layer
                id="mangrove-layer-stroke"
                type="line"
                paint={{
                  "line-color": "#047857",
                  "line-width": 1.5,
                  "line-opacity": 0.9
                }}
              />
            </Source>
          )}

          {/* Road Network Layer */}
          {roadGeojson && roadGeojson.features && roadGeojson.features.length > 0 && (
             <Source id="road-source" type="geojson" data={roadGeojson}>
                <Layer 
                  id="road-layer"
                  type="line"
                  paint={{
                     "line-color": "#ef4444",
                     "line-width": 1.5,
                     "line-opacity": 0.6
                  }}
                />
             </Source>
          )}

          {/* ── 2. INVERTED MASKING PROTOCOL (THE CLIPPING MASK) ── */}
          {showInvertedMask && invertedMaskGeojson && (
            <Source id="inverted-mask-source" type="geojson" data={invertedMaskGeojson}>
              <Layer
                id="inverted-mask-fill"
                type="fill"
                paint={{
                  "fill-color": isDarkMode ? "#020617" : "#090d16",
                  "fill-opacity": 0.82
                }}
              />
            </Source>
          )}

          {/* ── 3. ACTIVE BOUNDARY HIGHLIGHT STROKE ── */}
          {activeBoundaryFeature && (
            <Source id="active-boundary-source" type="geojson" data={activeBoundaryFeature}>
              <Layer
                id="active-boundary-stroke"
                type="line"
                paint={{
                  "line-color": "#10b981",
                  "line-width": 2.5,
                  "line-dasharray": [3, 2]
                }}
              />
            </Source>
          )}
        </Map>
        
        {/* HUD Instructions & Boundary Status */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-lg border border-slate-700/80 px-5 py-3 rounded-2xl shadow-2xl flex flex-col items-center gap-1.5 pointer-events-none text-white z-[15]">
          <div className="flex items-center gap-5 text-xs font-medium">
             <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">1</div>
                Klik peta di dalam zona terkliping untuk memasang titik
             </div>
             <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">2</div>
                Klik titik awal untuk menutup poligon
             </div>
          </div>
          {isOutOfBounds && (
             <div className="mt-1 bg-rose-500/20 text-rose-300 px-3 py-1 rounded-lg border border-rose-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
               <AlertCircle className="w-3.5 h-3.5" /> Area digitasi melampaui batas administrasi desa terpilih!
             </div>
          )}
        </div>
      </div>
    </div>
  );
}


