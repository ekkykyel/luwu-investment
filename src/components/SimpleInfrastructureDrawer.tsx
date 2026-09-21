import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import Map, { NavigationControl, MapRef, Source, Layer } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import MaplibreDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { 
  X, Check, MapPin, Hospital, Plane, Ship, Shield, Building2, Home, Landmark, ShoppingCart, Store, School, Users, AlertCircle, Sparkles
} from "lucide-react";
import Swal from "sweetalert2";

interface SimpleInfrastructureDrawerProps {
  onClose: () => void;
  onSaveSuccess?: () => void;
  isDarkMode?: boolean;
  onSave?: (geometry: any) => void;
  infrastructure?: any[];
}

const INFRA_CATEGORIES = [
  { name: "Rumah Sakit", icon: "Hospital" },
  { name: "Bandara", icon: "Plane" },
  { name: "Pelabuhan", icon: "Ship" },
  { name: "Kantor Polisi", icon: "Shield" },
  { name: "Kantor Camat", icon: "Building2" },
  { name: "Kantor Desa", icon: "Home" },
  { name: "Perkantoran Daerah", icon: "Landmark" },
  { name: "Pusat Perdagangan", icon: "ShoppingCart" },
  { name: "Toko / Swalayan", icon: "Store" },
  { name: "Sarana Pendidikan", icon: "School" },
  { name: "Fasilitas Umum", icon: "Users" },
  { name: "Lainnya", icon: "MapPin" }
];

export default function SimpleInfrastructureDrawer({
  onClose,
  onSaveSuccess,
  isDarkMode = false,
  onSave,
  infrastructure = []
}: SimpleInfrastructureDrawerProps) {
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<any>(null);

  // Form States
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Fasilitas Umum");
  const [description, setDescription] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Legend State
  const [activeCategories, setActiveCategories] = useState<string[]>(
    INFRA_CATEGORIES.map(c => c.name)
  );

  const [viewState, setViewState] = useState({
    longitude: 120.252,
    latitude: -3.203,
    zoom: 11,
    pitch: 0,
    bearing: 0
  });

  const [roadsGeoJSON, setRoadsGeoJSON] = useState<any>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    fetch("/gis_jalan.json", { signal: controller.signal, credentials: 'same-origin' })
      .then(async (res) => {
        if (!res || !res.ok) {
          return { type: "FeatureCollection", features: [] };
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data && data.features) {
          setRoadsGeoJSON(data);
        }
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          return;
        }
        console.error("Gagal memuat /api/gis_jalan di SimpleInfrastructureDrawer:", err);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const selectedCategoryObj = useMemo(() => {
    return INFRA_CATEGORIES.find((c) => c.name === category) || INFRA_CATEGORIES[INFRA_CATEGORIES.length - 1];
  }, [category]);

  const infrastructureGeoJSON = useMemo(() => {
    if (!infrastructure || infrastructure.length === 0) return null;
    
    // Filter by active categories
    const filtered = infrastructure.filter(infra => activeCategories.includes(infra.type || infra.kategori));

    return {
      type: "FeatureCollection",
      features: filtered.map(infra => ({
        type: "Feature",
        geometry: infra.geometry || {
          type: "Point",
          coordinates: [infra.longitude || 0, infra.latitude || 0]
        },
        properties: {
          id: infra.id,
          name: infra.name || infra.nama_infrastruktur,
          type: infra.type || infra.kategori,
          icon: infra.icon || "MapPin"
        }
      }))
    };
  }, [infrastructure, activeCategories]);

  const renderIcon = (iconName: string, className = "h-4 w-4") => {
    switch (iconName) {
      case "Hospital": return <Hospital className={className} />;
      case "Plane": return <Plane className={className} />;
      case "Ship": return <Ship className={className} />;
      case "Shield": return <Shield className={className} />;
      case "Building2": return <Building2 className={className} />;
      case "Home": return <Home className={className} />;
      case "Landmark": return <Landmark className={className} />;
      case "ShoppingCart": return <ShoppingCart className={className} />;
      case "Store": return <Store className={className} />;
      case "School": return <School className={className} />;
      case "Users": return <Users className={className} />;
      default: return <MapPin className={className} />;
    }
  };

  // Sync draw events and update coord state (keeps only latest point feature)
  const handleDrawEvent = useCallback(() => {
    if (!drawRef.current) return;
    const data = drawRef.current.getAll();
    const pointFeatures = data.features.filter((f: any) => f.geometry && f.geometry.type === "Point");
    if (pointFeatures.length > 0) {
      const latest = pointFeatures[pointFeatures.length - 1];
      if (pointFeatures.length > 1) {
        const idsToRemove = pointFeatures.slice(0, -1).map((f: any) => f.id);
        drawRef.current.delete(idsToRemove);
      }
      setCoordinates(latest.geometry.coordinates as [number, number]);
    } else {
      setCoordinates(null);
      setTimeout(() => {
        try {
          if (drawRef.current) {
            drawRef.current.changeMode("draw_point");
          }
        } catch (e) {}
      }, 100);
    }
  }, []);

  const onMapLoad = useCallback((e: any) => {
    const map = e.target;

    // Inisialisasi MaplibreDraw untuk pembuatan titik tunggal (Point Mode Enforcer)
    const draw = new MaplibreDraw({
      displayControlsDefault: false,
      controls: {
        point: true,
        trash: true
      },
      defaultMode: "draw_point",
      styles: ((MaplibreDraw as any).lib?.theme || []).map((style: any) => {
        if (style.paint && style.paint['line-dasharray']) {
          delete style.paint['line-dasharray']; // Fix maplibre layer crash by completely removing dasharray from draw theme
        }
        return style;
      })
    });

    map.addControl(draw, "top-left");
    drawRef.current = draw;

    // Pasang listeners draw.create, draw.update, dan draw.delete untuk update koordinat
    map.on("draw.create", handleDrawEvent);
    map.on("draw.update", handleDrawEvent);
    map.on("draw.delete", handleDrawEvent);

    // Auto set to draw_point mode on load delay
    setTimeout(() => {
      try {
        draw.changeMode("draw_point");
      } catch (err) {}
    }, 500);
  }, [handleDrawEvent]);

  const handleSave = async () => {
    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nama Wajib Diisi',
        text: 'Silakan isi nama infrastruktur terlebih dahulu.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    if (!drawRef.current) {
      Swal.fire({
        icon: 'error',
        title: 'Peta Belum Siap',
        text: 'Sistem gambar atau kanvas peta belum terinisialisasi sempurna.',
      });
      return;
    }

    const drawData = drawRef.current.getAll();
    if (!drawData || !drawData.features || drawData.features.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Lokasi Belum Ditentukan',
        text: 'Silakan gunakan alat pembuat titik di peta untuk menaruh lokasi infrastruktur.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    // Pastikan geometri berupa "Point" secara valid
    const pointFeature = drawData.features.find((f: any) => f.geometry && f.geometry.type === "Point");
    if (!pointFeature) {
      Swal.fire({
        icon: 'error',
        title: 'Format Geometri Salah',
        text: 'Hanya diizinkan membuat titik (Point), dilarang menggunakan Polygon atau jenis geometri lainnya.',
      });
      return;
    }

    const geomCoordinates = pointFeature.geometry.coordinates;

    setIsSaving(true);
    try {
      // Panggil callback onSave jika didefinisikan
      if (onSave) {
        onSave(pointFeature.geometry);
      }

      const res = await fetch("/api/infrastruktur", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nama_infrastruktur: name.trim(),
          kategori: category,
          keterangan_singkat: description.trim(),
          coordinates: geomCoordinates,
          icon: selectedCategoryObj.icon
        })
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Disimpan!',
          text: `Infrastruktur "${name}" berhasil ditambahkan ke database.`,
          timer: 2000,
          showConfirmButton: false,
        });
        if (onSaveSuccess) onSaveSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        Swal.fire('Gagal!', `Terjadi kesalahan saat menyimpan: ${err.error || "Gagal menyimpan ke database."}`, 'error');
      }
    } catch(err: any) {
      Swal.fire('Error!', `Gagal menghubungi server: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col md:flex-row bg-slate-900 shadow-2xl">
      {/* Sidebar Form */}
      <div className={`w-full md:w-96 flex flex-col max-h-full border-b md:border-b-0 md:border-r ${isDarkMode ? "bg-slate-950 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-inherit bg-indigo-600 text-white shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="font-bold font-display tracking-wider text-base flex items-center gap-2">
              TAMBAH INFRASTRUKTUR
            </h2>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-[11px] text-white/90 mt-1">
            Isi formulir dan gunakan tools peta untuk menempatkan titik infrastruktur baru pendukung investasi.
          </p>
        </div>

        {/* Sidebar Form Content */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          
          {/* Coordinates State Box */}
          <div className={`p-4 rounded-xl border flex flex-col gap-1.5 transition-all ${coordinates ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : "bg-indigo-500/5 border-indigo-500/20 text-slate-600 dark:text-slate-400"}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <MapPin className={`h-4 w-4 ${coordinates ? "text-emerald-700 dark:text-emerald-400" : "text-indigo-700 dark:text-indigo-400 animate-pulse"}`} />
              <span>Titik Koordinat Lokasi</span>
            </div>
            {coordinates ? (
              <div className="font-mono text-xs flex flex-col gap-0.5 text-slate-800 dark:text-slate-200">
                <span>Longitude: <strong className="text-emerald-700 dark:text-emerald-400">{coordinates[0].toFixed(6)}</strong></span>
                <span>Latitude: <strong className="text-emerald-700 dark:text-emerald-400">{coordinates[1].toFixed(6)}</strong></span>
              </div>
            ) : (
              <p className="text-xs italic text-slate-600 dark:text-slate-400">
                Silakan gunakan alat pembuat titik di kiri atas peta/klik langsung untuk menentukan koordinat.
              </p>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Nama Aset Infrastruktur</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Puskesmas Belopa, Pelabuhan Bua..."
              className={`w-full rounded-xl px-4.5 py-2.5 text-sm border focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              Kategori
              {renderIcon(selectedCategoryObj.icon, "h-4 w-4 text-indigo-500")}
            </label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={`w-full rounded-xl px-4.5 py-2.5 text-sm border focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
            >
              {INFRA_CATEGORIES.map((cat, idx) => (
                <option key={`cat-${idx}`} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Keterangan Singkat / Informasi Pendukung</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Jelaskan kapasitas layanan, fasilitas pendukung, atau kondisi saat ini..."
              className={`w-full rounded-xl px-4.5 py-2.5 text-sm border focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none transition-all ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
            />
          </div>

        </div>

        {/* Action Buttons Footer inside Sidebar */}
        <div className="p-5 border-t border-inherit flex gap-2">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl border transition cursor-pointer ${isDarkMode ? "border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-900 hover:text-white" : "border-slate-300 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-800 dark:hover:text-slate-200"}`}
          >
            Batal
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <div className="h-4.5 w-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Check className="h-4 w-4" /> Simpan Data
              </>
            )}
          </button>
        </div>

      </div>

      {/* Map Division - Wrapper dengan explicit style height 70vh */}
      <div className="flex-1 relative bg-slate-950" style={{ height: "70vh" }}>
        <Map
          ref={mapRef}
          initialViewState={viewState}
          transformRequest={(url) => {
            if (url.includes('cartocdn.com') || url.includes('openstreetmap.org') || url.includes('google') || url.includes('arcgisonline.com')) {
              return {
                url,
                headers: {}
              };
            }
            return { url };
          }}
          mapStyle={{
            version: 8,
            sources: {
              "esri-dark": {
                type: "raster",
                tiles: [
                  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                ],
                tileSize: 256,
                attribution: "Tiles © Esri"
              }
            },
            layers: [
              {
                id: "esri-dark-layer",
                type: "raster",
                source: "esri-dark"
              }
            ]
          }}
          mapLib={maplibregl as any}
          onLoad={onMapLoad}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />

          {roadsGeoJSON && (
            <Source id="source-jalan" type="geojson" data={roadsGeoJSON as any}>
              <Layer
                id="layer-jalan"
                type="line"
                layout={{
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
          
          {infrastructureGeoJSON && (
            <Source id="existing-infra-source" type="geojson" data={infrastructureGeoJSON as any}>
              <Layer
                id="existing-infra-layer"
                type="circle"
                paint={{
                  "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    10, 5,
                    15, 8
                  ] as any,
                  "circle-color": "#6366f1",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff"
                }}
              />
            </Source>
          )}
        </Map>

        {/* Interactive Infrastructure Legend */}
        <div className={`absolute bottom-6 right-6 w-64 max-h-[60vh] overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3 rounded-xl shadow-xl backdrop-blur-md border transition-all duration-300 z-[200] ${
          isDarkMode ? "bg-slate-900/80 border-slate-700/50" : "bg-white/80 border-white/40"
        }`}>
          <div className="flex items-center justify-between border-b pb-2 mb-1 border-slate-500/20">
            <h4 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              Legenda Infrastruktur
            </h4>
            <Sparkles className={`h-4 w-4 ${isDarkMode ? "text-indigo-700 dark:text-indigo-400" : "text-indigo-600"}`} />
          </div>
          
          <div className="flex flex-col gap-2">
            {INFRA_CATEGORIES.map((cat, idx) => {
              const isActive = activeCategories.includes(cat.name);
              return (
                <label key={idx} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg border transition-colors ${
                      isActive 
                        ? (isDarkMode ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-700 dark:text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600")
                        : (isDarkMode ? "bg-slate-800/50 border-slate-700 text-slate-600 dark:text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600 dark:text-slate-400")
                    }`}>
                      {renderIcon(cat.icon, "h-3.5 w-3.5")}
                    </span>
                    <span className={`text-[11px] font-semibold transition-colors ${
                      isActive 
                        ? (isDarkMode ? "text-slate-200" : "text-slate-800")
                        : (isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400")
                    }`}>
                      {cat.name}
                    </span>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <div className="relative inline-flex items-center h-4 w-7 cursor-pointer rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: isActive ? '#6366f1' : (isDarkMode ? '#334155' : '#cbd5e1') }}>
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={isActive}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setActiveCategories([...activeCategories, cat.name]);
                        } else {
                          setActiveCategories(activeCategories.filter(c => c !== cat.name));
                        }
                      }}
                    />
                    <span className={`inline-block h-3 w-3 rounded-full bg-white transform transition-transform duration-200 ease-in-out shadow-sm ${isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Banner Instruksi */}
        <div className="absolute top-4 left-6 right-6 md:left-1/2 md:right-auto md:-translate-x-1/2 pointer-events-none bg-slate-900/90 backdrop-blur border border-white/10 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <Sparkles className="h-4 w-4 text-indigo-700 dark:text-indigo-400 animate-pulse" />
          <p className="text-xs text-slate-300 font-sans tracking-wide">
            Silakan <strong className="text-indigo-700 dark:text-indigo-400 font-bold">Klik ikon Point di kiri atas peta</strong> lalu tempatkan pin lokasi infrastruktur baru Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
