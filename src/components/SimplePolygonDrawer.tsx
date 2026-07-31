import React, { useRef, useState, useEffect, useCallback } from "react";
import Map, { NavigationControl, MapRef, Source, Layer } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import MaplibreDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from "@turf/turf";
import { Check, X, MapPin, AlertCircle, RefreshCcw } from "lucide-react";
import Swal from "sweetalert2";

interface SimplePolygonDrawerProps {
  onSave: (geometry: any) => void;
  onCancel: () => void;
  initialGeometry?: any;
  isDarkMode?: boolean;
  roadGeojson?: any;
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

export default function SimplePolygonDrawer({
  onSave,
  onCancel,
  initialGeometry,
  isDarkMode = false,
  roadGeojson,
  focusTarget
}: SimplePolygonDrawerProps) {
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<any>(null);
  
  // Basin basemap state switcher: streets vs satellite
  const [basemap, setBasemap] = useState<"streets" | "satellite">("streets");
  
  // State for loaded kecamatan features from public folder
  const [kecamatanData, setKecamatanData] = useState<any>(null);

  const [viewState, setViewState] = useState({
    longitude: 120.252,
    latitude: -3.203,
    zoom: 11,
    pitch: 0,
    bearing: 0
  });

  // Load gis_kecamatan.json for auto-focus spatial processing
  useEffect(() => {
    fetch("/gis_kecamatan.json")
      .then(async res => {
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          undefined;
          return null;
        }
        const text = await res.text();
        if (text.trim().startsWith("<")) {
          undefined;
          return null;
        }
        return JSON.parse(text);
      })
      .then(data => {
        if (data) {
          setKecamatanData(data);
        }
      })
      .catch(err => console.error("Error loading gis_kecamatan.json inside SimplePolygonDrawer:", err));
  }, []);

  // Handle spatial flyTo auto-focus when focusTarget or loaded kecamatan boundaries changes
  useEffect(() => {
    if (!focusTarget || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    let center: [number, number] | null = null;
    
    // A. Priority: Passed village or district coords
    const getCorrectedCenter = (coords?: [number, number]): [number, number] | null => {
        if (!coords || !Array.isArray(coords) || coords.length < 2) return null;
        let [c1, c2] = coords;
        if (typeof c1 !== "number" || typeof c2 !== "number" || (c1 === 0 && c2 === 0)) return null;
        
        // Defensive: Luwu Area (approx Lng: 120, Lat: -3)
        if (Math.abs(c1) < 10 && Math.abs(c2) > 100) {
           return [c2, c1];
        } else {
           return [c1, c2];
        }
    };

    center = getCorrectedCenter(focusTarget.villageCoords) || getCorrectedCenter(focusTarget.districtCoords);

    // B. Fallback to boundary matching if coords are missing
    if (!center) {
       // Priority 1: Use direct GeoJSON if provided in focusTarget
       const geoJsonToUse = focusTarget.villageGeojson || focusTarget.districtGeojson;
       
       if (geoJsonToUse) {
         try {
           const centerOfMass = turf.centerOfMass(geoJsonToUse);
           if (centerOfMass && centerOfMass.geometry && centerOfMass.geometry.coordinates) {
             center = [centerOfMass.geometry.coordinates[0], centerOfMass.geometry.coordinates[1]];
           }
         } catch(err) {
           console.error("Error computing centerOfMass of target focusTarget geojson:", err);
         }
       }

       // Priority 2: Use kecamatanData (the original fallback)
       if (!center && kecamatanData && kecamatanData.features && focusTarget.districtId) {
         const matchedFeature = kecamatanData.features.find((f: any) => {
           const rawName = f.properties?.KECAMATAN || f.properties?.kecamatan || f.properties?.NAME || "";
           const cleanName = rawName
             .toLowerCase()
             .replace(/kec\.\s*/i, "")
             .trim()
             .replace(/\s+/g, "_");
           const idFromName = `dist_${cleanName}`;
           return idFromName === focusTarget.districtId.toLowerCase() || 
                  rawName.toLowerCase().includes(focusTarget.districtName?.toLowerCase() || "___INVALID___");
         });
   
         if (matchedFeature) {
           try {
             const centerOfMass = turf.centerOfMass(matchedFeature);
             if (centerOfMass && centerOfMass.geometry && centerOfMass.geometry.coordinates) {
               center = [centerOfMass.geometry.coordinates[0], centerOfMass.geometry.coordinates[1]];
             }
           } catch (err) {
             console.error("Error computing centerOfMass of target kecamatan features:", err);
           }
         }
       }
    }

    if (center) {
      const targetName = focusTarget.villageName || focusTarget.districtName || "Lokasi tidak diketahui";
      undefined; // center is [lng, lat]
      map.flyTo({
        center: center,
        zoom: focusTarget.villageId ? 14 : 12,
        essential: true,
        duration: 2500
      });
    }
  }, [focusTarget, kecamatanData]);

  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  const handleDrawEvent = useCallback((evt: any) => {
    undefined;
    if (!drawRef.current) return;
    const data = drawRef.current.getAll();
    
    if (data.features.length === 0) {
      setIsOutOfBounds(false);
      return;
    }

    const drawnGeom = data.features[0].geometry;
    
    if (focusTarget?.villageGeojson) {
      try {
        const villageFeature = turf.feature(focusTarget.villageGeojson.geometry || focusTarget.villageGeojson);
        const drawnFeature = turf.feature(drawnGeom as any);
        
        let isWithin = false;
        if (drawnGeom.type === "Point") {
          isWithin = turf.booleanPointInPolygon(drawnFeature as any, villageFeature as any);
        } else if (drawnGeom.type === "Polygon") {
          isWithin = turf.booleanWithin(drawnFeature, villageFeature);
        } else {
          // Fallback just to be safe
          isWithin = turf.booleanWithin(drawnFeature, villageFeature);
        }

        setIsOutOfBounds(!isWithin);
        
        if (!isWithin) {
          Swal.fire({
            icon: 'error',
            title: 'KENDALA AKURASI SPASIAL',
            text: 'Lokasi objek yang Anda gambar keluar dari batas wilayah Desa yang dipilih! Silakan sesuaikan kembali gambar Anda di dalam batas garis pedoman.',
            confirmButtonColor: '#e11d48'
          });
          
          // Optionally redraw MaplibreDraw polygon stroke color
          // We can't easily do it without heavy customization of themes, so we stick to Alert & disable Save.
        }
      } catch (err) {
        undefined;
      }
    }
  }, [focusTarget]);

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
          delete style.paint['line-dasharray']; // Fix maplibre layer crash by completely removing dasharray from draw theme
        }
        return style;
      })
    });
    
    map.addControl(draw, "top-left");
    drawRef.current = draw;

    // Listeners for draw.create and draw.update to fetch geometries
    map.on("draw.create", handleDrawEvent);
    map.on("draw.update", handleDrawEvent);

    if (initialGeometry && initialGeometry.coordinates && initialGeometry.coordinates.length > 0) {
      try {
        const feature = {
          type: "Feature" as any,
          properties: {},
          geometry: initialGeometry
        };
        draw.add(feature);
        
        // Auto fit bounds
        const bbox = turf.bbox(feature);
        map.fitBounds(
          [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
          { padding: 50, maxZoom: 16 }
        );
        // Switch mode to simple_select if there is already a geometry
        draw.changeMode("simple_select");
      } catch(err) {
        console.error("Gagal load initial geometry", err);
      }
    } else {
      // Start drawing immediately
      // MapboxDraw needs a slight delay for the map to fully render before setting mode
      setTimeout(() => {
        try {
          if (drawRef.current) {
            drawRef.current.changeMode("draw_polygon");
          }
        } catch(e) {}
      }, 500);
    }
  }, [initialGeometry]);

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
    
    // Only take the first polygon
    const polygonFeature = data.features[0];
    const geom = polygonFeature.geometry;
    
    // Basic validation
    if (geom.type !== "Polygon") {
        Swal.fire('Format Salah', 'Geometry yang digambar harus berupa Polygon.', 'error');
        return;
    }

    // Coordinate Inversion check: GeoJSON WGS 84 is strictly [longitude, latitude]
    if (geom.coordinates && Array.isArray(geom.coordinates)) {
      const validatedCoordinates = geom.coordinates.map((ring: any[]) => {
        return ring.map((coord: any[]) => {
          let lng = Number(coord[0]);
          let lat = Number(coord[1]);
          // Defensive swap: if lat is larger than 100 or positive/longitude ranges, correct them
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
    
    onSave(geom);
  };

  const handleReset = () => {
    if (drawRef.current) {
       drawRef.current.deleteAll();
       drawRef.current.changeMode("draw_polygon");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800 text-white px-6 py-4 border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg font-display tracking-wide flex items-center gap-2">
              DIGITISASI AREA INVESTASI
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500 text-white tracking-widest uppercase">
                DRAW MODE
              </span>
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Silakan klik pada peta untuk membuat titik polygon lahan.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition"
          >
            <RefreshCcw className="h-4 w-4" /> Reset Gambar
          </button>
          
          <button
            onClick={handleSave}
            disabled={isOutOfBounds}
            className={`flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-bold shadow transition ${
              isOutOfBounds 
                ? "bg-slate-700 text-slate-500 cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            <Check className="h-4 w-4" /> Simpan Polygon
          </button>
          
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600/20 text-rose-500 hover:bg-rose-600/30 rounded-lg text-sm font-semibold transition"
            title="Batal"
          >
            <X className="h-4 w-4" /> TUTUP
          </button>
        </div>
      </div>

      {/* Map Content Wrapper which has explicit height style */}
      <div className="flex-1 relative bg-slate-950" style={{ height: "70vh" }}>
        {/* Basemap Switcher Floating Button Control */}
        <div className="absolute top-4 right-14 z-[10] bg-slate-900/95 backdrop-blur border border-white/10 p-1 rounded-xl flex items-center gap-1 shadow-2xl">
          <button
            type="button"
            onClick={() => setBasemap("streets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              basemap === "streets"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Mode Jalan (OSM)
          </button>
          <button
            type="button"
            onClick={() => setBasemap("satellite")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              basemap === "satellite"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Mode Satelit
          </button>
        </div>

        <Map
          ref={mapRef}
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          transformRequest={(url) => {
            if (url.includes('cartocdn.com') || url.includes('openstreetmap.org') || url.includes('google') || url.includes('arcgisonline.com')) {
              return {
                url,
                headers: {}
              };
            }
            return { url };
          }}
          mapStyle={
            basemap === "streets"
              ? {
                  version: 8,
                  sources: {
                    "osm-tiles": {
                      type: "raster",
                      tiles: ["https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png"],
                      tileSize: 256,
                      attribution: "© OpenStreetMap contributors © CARTO"
                    }
                  },
                  layers: [
                    {
                      id: "osm-tiles-layer",
                      type: "raster",
                      source: "osm-tiles",
                      minzoom: 0,
                      maxzoom: 19
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
                      attribution: "© Esri | OpenStreetMap contributors"
                    }
                  },
                  layers: [
                    {
                      id: "esri-satellite-layer",
                      type: "raster",
                      source: "esri-satellite",
                      minzoom: 0,
                      maxzoom: 19
                    }
                  ]
                }
          }
          mapLib={maplibregl}
          onLoad={onMapLoad}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />
          
          {focusTarget?.villageGeojson && (
            <Source id="village-source" type="geojson" data={focusTarget.villageGeojson}>
              <Layer
                id="village-layer-fill"
                type="fill"
                paint={{
                  "fill-color": "#f59e0b",
                  "fill-opacity": 0.1
                }}
              />
              <Layer
                id="village-layer-stroke"
                type="line"
                paint={{
                  "line-color": "#f59e0b",
                  "line-dasharray": [2, 2],
                  "line-width": 2
                }}
              />
            </Source>
          )}

          {roadGeojson && roadGeojson.features && roadGeojson.features.length > 0 && (
             <Source id="road-source" type="geojson" data={roadGeojson}>
                <Layer 
                  id="road-layer"
                  type="line"
                  paint={{
                     "line-color": "#dc2626",
                     "line-width": 1.5,
                     "line-opacity": 0.6
                  }}
                />
             </Source>
          )}
        </Map>
        
        {/* HUD Instructions */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/30 dark:border-slate-600/30 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 pointer-events-none">
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-xs text-white">
                <div className="h-4 w-4 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px]">1</div>
                Klik untuk tambah titik
             </div>
             <div className="flex items-center gap-2 text-xs text-white">
                <div className="h-4 w-4 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px]">2</div>
                Klik titik pertama (atau Enter) untuk selesai
             </div>
          </div>
          {isOutOfBounds && (
             <div className="mt-2 bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded border border-rose-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
               <AlertCircle className="w-3 h-3" /> Area berada di luar pembatas desa!
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
