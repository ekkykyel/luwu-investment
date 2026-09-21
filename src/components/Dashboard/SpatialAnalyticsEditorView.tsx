import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Layers, 
  Map as MapIcon, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sliders, 
  RefreshCw, 
  Filter, 
  Building2, 
  FileCheck, 
  MapPin, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Globe,
  Compass,
  AlertCircle,
  Wheat,
  Sprout,
  ShieldCheck,
  TreePine,
  Waves,
  Fish,
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import SpatialEditorStudio from '../SpatialEditorStudio';
import { GeoJSONLayer, Role } from '../../types';
import Swal from 'sweetalert2';

export interface SpatialAnalyticsEditorViewProps {
  userRole?: string;
  isDarkMode?: boolean;
}

export default function SpatialAnalyticsEditorView({ 
  userRole = 'admin_puptr',
  isDarkMode = true 
}: SpatialAnalyticsEditorViewProps) {
  const { t } = useTranslation();
  const { investments = [], districts = [], villages = [], refreshData } = useData();
  const [isLoadingLayers, setIsLoadingLayers] = useState<boolean>(true);
  
  // Master Layer State dictionary for SpatialEditorStudio
  const [spatialLayersMap, setSpatialLayersMap] = useState<Record<string, GeoJSONLayer>>({});
  const [isLayerControlOpen, setIsLayerControlOpen] = useState<boolean>(true);
  const [activeTabLayerControl, setActiveTabLayerControl] = useState<'VISIBILITY' | 'OPACITY' | 'STATS'>('VISIBILITY');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PERTANIAN' | 'TATA_RUANG' | 'ADMIN' | 'INFRA'>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const isPertanianRole = (userRole || '').toLowerCase().includes('pertanian');
  const isPuptrRole = (userRole || '').toLowerCase().includes('puptr') || (userRole || '').toLowerCase().includes('tata_ruang') || (userRole || '').toLowerCase().includes('gis');

  // Normalize userRole to Role enum
  const mappedRole: Role = useMemo(() => {
    const norm = (userRole || '').toLowerCase();
    if (norm.includes('pertanian')) return Role.ADMIN_PERTANIAN;
    if (norm.includes('puptr') || norm.includes('tata_ruang') || norm.includes('gis')) return Role.ADMIN_PUPTR;
    if (norm.includes('oss') || norm.includes('dpmptsp')) return Role.ADMIN_OSS;
    if (norm.includes('super')) return Role.SUPER_ADMIN;
    return Role.ADMIN_PUPTR;
  }, [userRole]);

  // Load and format comprehensive spatial layers (Pertanian, LP2B, Zonasi RTRW, Lindung, Mangrove, Tambak, Jalan, Batas)
  useEffect(() => {
    let isMounted = true;
    async function loadAllLayers() {
      setIsLoadingLayers(true);
      try {
        // Fetch static GeoJSON files in parallel
        const [
          sawahRes,
          kebunRes,
          zonasiRes,
          lindungRes,
          mangroveRes,
          tambakRes,
          kecRes,
          desaRes,
          jalanRes,
          infraRes
        ] = await Promise.all([
          fetch('/gis_sawah.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/gis_lahankeringsekunder.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/gis_zonasi.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/gis_lahankeringprimer.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/gis_mangrove.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/gis_tambak.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/gis_kecamatan.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/gis_desa.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/gis_jalan').then(r => r.ok ? r.json() : fetch('/gis_jalan.json').then(r2 => r2.ok ? r2.json() : null)).catch(() => null),
          fetch('/gis_infrastruktur.json').then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (!isMounted) return;

        // Process Approved PKKPR Polygons from Supabase investments table
        const approvedFeatures = (investments || [])
          .filter((inv: any) => {
            const st = String(inv.status || inv.status_pkkpr || inv.pkkprStatus || '').toLowerCase();
            const isApproved = 
              st.includes('approved') || 
              st.includes('terbit') || 
              st.includes('disetujui') || 
              st.includes('selesai') ||
              inv.pkkprStatus === 'Approved' ||
              inv.pkkpr_status === 'Approved' ||
              inv.status === 'Approved_PUPTR' ||
              inv.status === 'Approved_Pertanian' ||
              inv.status === 'SK_TERBIT';

            let geom = inv.geometry;
            if (typeof geom === 'string') {
              try { geom = JSON.parse(geom); } catch (e) { geom = null; }
            }
            return isApproved && geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon' || (geom.coordinates && geom.coordinates.length > 0));
          })
          .map((inv: any) => {
            let geom = inv.geometry;
            if (typeof geom === 'string') {
              try { geom = JSON.parse(geom); } catch (e) { geom = null; }
            }
            return {
              type: 'Feature',
              id: `pkkpr_app_${inv.id}`,
              properties: {
                id: inv.id,
                name: inv.name || inv.companyName || `Persetujuan PKKPR #${inv.id}`,
                pemohon: inv.contact_pic || inv.applicantName || inv.name || 'Pemohon PKKPR',
                nib: inv.plot_number || inv.nibNik || inv.certificate_number || '-',
                luasHa: inv.area_ha || inv.areaHa || 10,
                sektor: inv.sector || 'Investasi & Industri',
                status: 'DISETUJUI (SK PKKPR TERBIT)',
                docNumber: inv.pkkpr_doc_number || inv.pkkprDocNumber || '503/PERTEK-PUPTR/LUWU/2026',
                kecamatan: inv.district || inv.districtName || '-',
                desa: inv.village || inv.villageName || '-'
              },
              geometry: geom
            };
          });

        // Process Pending PKKPR Polygons (Sedang Ditelaah LP2B / Tata Ruang)
        const pendingFeatures = (investments || [])
          .filter((inv: any) => {
            const st = String(inv.status || inv.status_pkkpr || inv.pkkprStatus || '').toLowerCase();
            const isPending = 
              st.includes('pending') || 
              st.includes('menunggu') || 
              st.includes('proses') || 
              st.includes('review') ||
              st.includes('kajian');

            let geom = inv.geometry;
            if (typeof geom === 'string') {
              try { geom = JSON.parse(geom); } catch (e) { geom = null; }
            }
            return isPending && geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon' || (geom.coordinates && geom.coordinates.length > 0));
          })
          .map((inv: any) => {
            let geom = inv.geometry;
            if (typeof geom === 'string') {
              try { geom = JSON.parse(geom); } catch (e) { geom = null; }
            }
            return {
              type: 'Feature',
              id: `pkkpr_pend_${inv.id}`,
              properties: {
                id: inv.id,
                name: inv.name || inv.companyName || `Permohonan PKKPR #${inv.id}`,
                pemohon: inv.contact_pic || inv.applicantName || inv.name || 'Pemohon',
                nib: inv.plot_number || inv.nibNik || inv.certificate_number || '-',
                luasHa: inv.area_ha || inv.areaHa || 5,
                sektor: inv.sector || 'Pertanian / Industri',
                status: 'SEDANG DITELAAH (LP2B & TATA RUANG)',
                kecamatan: inv.district || inv.districtName || '-',
                desa: inv.village || inv.villageName || '-'
              },
              geometry: geom
            };
          });

        const defaultPertanian = isPertanianRole;

        const layersMap: Record<string, GeoJSONLayer> = {
          // 1. Layer Sawah & LP2B (Lahan Pertanian Pangan Berkelanjutan)
          layer_sawah: {
            id: "layer_sawah",
            name: "Tutupan Lahan Sawah & LP2B",
            category: "Pertanian & LP2B",
            type: "Polygon",
            color: "#22c55e",
            fillColor: "#22c55e",
            lineColor: "#15803d",
            lineWidth: 1.5,
            opacity: 0.75,
            fillOpacity: 0.45,
            isActive: true,
            geojson: sawahRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(sawahRes?.features) ? sawahRes.features.length : 0
          },

          // 2. Layer Perkebunan & Lahan Kering Sekunder (Kakao, Sawit, Cengkeh)
          layer_lahan_kering_sekunder: {
            id: "layer_lahan_kering_sekunder",
            name: "Tutupan Lahan Kering / Perkebunan",
            category: "Pertanian & LP2B",
            type: "Polygon",
            color: "#eab308",
            fillColor: "#eab308",
            lineColor: "#ca8a04",
            lineWidth: 1.5,
            opacity: 0.70,
            fillOpacity: 0.35,
            isActive: defaultPertanian,
            geojson: kebunRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(kebunRes?.features) ? kebunRes.features.length : 0
          },

          // 3. Layer Peruntukan Lahan (Zonasi Pola Ruang RTRW Kab. Luwu 2020-2040)
          layer_zonasi: {
            id: "layer_zonasi",
            name: "Pola Ruang & Zonasi RTRW 2020-2040",
            category: "Pola Ruang RTRW",
            type: "Polygon",
            color: "#8b5cf6",
            fillColor: "#8b5cf6",
            lineColor: "#6d28d9",
            lineWidth: 1.5,
            opacity: 0.75,
            fillOpacity: 0.38,
            isActive: !defaultPertanian,
            geojson: zonasiRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(zonasiRes?.features) ? zonasiRes.features.length : 0
          },

          // 4. Layer Polygon Persetujuan PKKPR yang sudah disetujui (SK Terbit)
          layer_pkkpr_approved: {
            id: "layer_pkkpr_approved",
            name: "Polygon Persetujuan PKKPR Disetujui",
            category: "Permohonan PKKPR",
            type: "Polygon",
            color: "#10b981",
            fillColor: "#10b981",
            lineColor: "#047857",
            lineWidth: 2.5,
            opacity: 0.90,
            fillOpacity: 0.55,
            isActive: true,
            geojson: {
              type: "FeatureCollection",
              features: approvedFeatures
            },
            featuresCount: approvedFeatures.length
          },

          // 5. Layer Polygon Permohonan PKKPR Sedang Ditelaah
          layer_pkkpr_pending: {
            id: "layer_pkkpr_pending",
            name: "Polygon PKKPR Sedang Dikaji (Verifikasi)",
            category: "Permohonan PKKPR",
            type: "Polygon",
            color: "#f97316",
            fillColor: "#f97316",
            lineColor: "#c2410c",
            lineWidth: 2,
            opacity: 0.85,
            fillOpacity: 0.45,
            isActive: true,
            geojson: {
              type: "FeatureCollection",
              features: pendingFeatures
            },
            featuresCount: pendingFeatures.length
          },

          // 6. Layer Hutan Lindung & Kawasan Primer (Konservasi)
          layer_lahan_kering_primer: {
            id: "layer_lahan_kering_primer",
            name: "Kawasan Lindung & Hutan Primer",
            category: "Kawasan Lindung",
            type: "Polygon",
            color: "#16a34a",
            fillColor: "#16a34a",
            lineColor: "#15803d",
            lineWidth: 1.5,
            opacity: 0.70,
            fillOpacity: 0.35,
            isActive: !defaultPertanian,
            geojson: lindungRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(lindungRes?.features) ? lindungRes.features.length : 0
          },

          // 7. Layer Mangrove & Pesisir
          layer_mangrove: {
            id: "layer_mangrove",
            name: "Kawasan Lindung Mangrove & Pesisir",
            category: "Kawasan Lindung",
            type: "Polygon",
            color: "#14b8a6",
            fillColor: "#14b8a6",
            lineColor: "#0f766e",
            lineWidth: 1.5,
            opacity: 0.70,
            fillOpacity: 0.40,
            isActive: false,
            geojson: mangroveRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(mangroveRes?.features) ? mangroveRes.features.length : 0
          },

          // 8. Layer Tambak & Budidaya Perikanan
          layer_tambak: {
            id: "layer_tambak",
            name: "Tambak Perikanan & Budidaya",
            category: "Pertanian & LP2B",
            type: "Polygon",
            color: "#0ea5e9",
            fillColor: "#0ea5e9",
            lineColor: "#0284c7",
            lineWidth: 1.5,
            opacity: 0.65,
            fillOpacity: 0.35,
            isActive: false,
            geojson: tambakRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(tambakRes?.features) ? tambakRes.features.length : 0
          },

          // 9. Layer Jaringan Jalan Utama & Akses Pertanian
          layer_jalan: {
            id: "layer_jalan",
            name: "Jaringan Jalan Utama & Kolektor",
            category: "Infrastruktur & Jalan",
            type: "LineString",
            color: "#f59e0b",
            lineColor: "#d97706",
            lineWidth: 2.5,
            opacity: 0.90,
            isActive: true,
            geojson: jalanRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(jalanRes?.features) ? jalanRes.features.length : 0
          },

          // 10. Layer Titik Infrastruktur & Fasilitas
          layer_infrastruktur: {
            id: "layer_infrastruktur",
            name: "Titik Fasilitas & Utilitas Spasial",
            category: "Infrastruktur & Jalan",
            type: "Point",
            color: "#ec4899",
            lineColor: "#be185d",
            lineWidth: 1.5,
            opacity: 0.90,
            isActive: !defaultPertanian,
            geojson: infraRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(infraRes?.features) ? infraRes.features.length : 0
          },

          // 11. Layer Batas Kecamatan (22 Kecamatan)
          layer_kecamatan: {
            id: "layer_kecamatan",
            name: "Batas Wilayah Kecamatan (22 Kec)",
            category: "Batas Administrasi",
            type: "Polygon",
            color: "#3b82f6",
            fillColor: "#3b82f6",
            lineColor: "#1d4ed8",
            lineWidth: 2,
            opacity: 0.65,
            fillOpacity: 0.10,
            isActive: true,
            geojson: kecRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(kecRes?.features) ? kecRes.features.length : 0
          },

          // 12. Layer Batas Desa (227 Desa/Kelurahan)
          layer_desa: {
            id: "layer_desa",
            name: "Batas Wilayah Desa / Kelurahan (227 Desa)",
            category: "Batas Administrasi",
            type: "Polygon",
            color: "#06b6d4",
            fillColor: "#06b6d4",
            lineColor: "#0e7490",
            lineWidth: 1,
            opacity: 0.55,
            fillOpacity: 0.08,
            isActive: true,
            geojson: desaRes || { type: "FeatureCollection", features: [] },
            featuresCount: Array.isArray(desaRes?.features) ? desaRes.features.length : 0
          }
        };

        setSpatialLayersMap(layersMap);
      } catch (err) {
        console.error("Gagal memuat layer spasial untuk Analitik Spasial:", err);
      } finally {
        if (isMounted) setIsLoadingLayers(false);
      }
    }

    loadAllLayers();
    return () => { isMounted = false; };
  }, [investments, isPertanianRole]);

  // Toggle Layer Active Visibility
  const toggleLayer = (layerId: string) => {
    setSpatialLayersMap(prev => {
      const target = prev[layerId];
      if (!target) return prev;
      return {
        ...prev,
        [layerId]: {
          ...target,
          isActive: !target.isActive
        }
      };
    });
  };

  // Set Layer Opacity
  const setLayerOpacity = (layerId: string, opacity: number) => {
    setSpatialLayersMap(prev => {
      const target = prev[layerId];
      if (!target) return prev;
      return {
        ...prev,
        [layerId]: {
          ...target,
          opacity: opacity,
          fillOpacity: opacity * 0.5
        }
      };
    });
  };

  // Preset Mode Switcher
  const applyPreset = (preset: 'PERTANIAN' | 'TATA_RUANG' | 'ALL' | 'ADMIN') => {
    setSpatialLayersMap(prev => {
      const updated: Record<string, GeoJSONLayer> = {};
      Object.keys(prev).forEach(key => {
        let active = false;
        if (preset === 'ALL') {
          active = true;
        } else if (preset === 'PERTANIAN') {
          active = ['layer_sawah', 'layer_lahan_kering_sekunder', 'layer_pkkpr_approved', 'layer_pkkpr_pending', 'layer_jalan', 'layer_kecamatan', 'layer_desa'].includes(key);
        } else if (preset === 'TATA_RUANG') {
          active = ['layer_zonasi', 'layer_lahan_kering_primer', 'layer_mangrove', 'layer_pkkpr_approved', 'layer_pkkpr_pending', 'layer_jalan', 'layer_infrastruktur', 'layer_kecamatan', 'layer_desa'].includes(key);
        } else if (preset === 'ADMIN') {
          active = ['layer_kecamatan', 'layer_desa', 'layer_jalan'].includes(key);
        }
        updated[key] = { ...prev[key], isActive: active };
      });
      return updated;
    });

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: preset === 'PERTANIAN' ? 'Preset Lahan Pertanian & LP2B Aktif' : preset === 'TATA_RUANG' ? 'Preset Tata Ruang & Pola Ruang Aktif' : preset === 'ADMIN' ? 'Preset Batas Administrasi Aktif' : 'Semua Layer Spasial Aktif',
      showConfirmButton: false,
      timer: 1800
    });
  };

  // Filtered layers based on search and category
  const filteredLayers = useMemo(() => {
    return Object.values(spatialLayersMap).filter(layer => {
      const matchesSearch = layer.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                            layer.category.toLowerCase().includes(searchFilter.toLowerCase());
      if (!matchesSearch) return false;

      if (categoryFilter === 'ALL') return true;
      if (categoryFilter === 'PERTANIAN') return layer.category === 'Pertanian & LP2B' || layer.category === 'Permohonan PKKPR';
      if (categoryFilter === 'TATA_RUANG') return layer.category === 'Pola Ruang RTRW' || layer.category === 'Kawasan Lindung' || layer.category === 'Permohonan PKKPR';
      if (categoryFilter === 'ADMIN') return layer.category === 'Batas Administrasi';
      if (categoryFilter === 'INFRA') return layer.category === 'Infrastruktur & Jalan';
      return true;
    });
  }, [spatialLayersMap, searchFilter, categoryFilter]);

  const activeLayerCount = Object.values(spatialLayersMap).filter(l => l.isActive).length;
  const totalLayerCount = Object.keys(spatialLayersMap).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-48 bg-emerald-500/10 blur-3xl rounded-full -mr-20 -mt-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '12s' }} />
                ANALITIK &amp; LAPORAN SPASIAL TERPADU
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isPertanianRole ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}>
                {isPertanianRole ? <Wheat className="w-3 h-3 text-amber-400" /> : <Layers className="w-3 h-3 text-indigo-400" />}
                {isPertanianRole ? 'Fokus: Lahan Pertanian & LP2B' : 'Fokus: Kesesuaian Pola Ruang RTRW'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800">
                <Globe className="w-3 h-3 text-cyan-400" /> PostGIS + MapLibre 3D
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              Peta Spasial Analitik, LP2B &amp; Pola Ruang RTRW
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Modul Peta Spasial Analitik Resmi Kabupaten Luwu. Menganalisis permohonan PKKPR terhadap layer Tutupan Lahan Sawah &amp; LP2B, Perkebunan, Pola Ruang RTRW 2020-2040, Kawasan Lindung, serta Jaringan Infrastruktur Jalan.
            </p>
          </div>

          {/* Action Quick Stats */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => refreshData()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              title="Sinkronisasi Ulang Data Spasial dari Supabase"
            >
              <RefreshCw size={14} className="text-emerald-400" />
              <span>Sinkronkan Data</span>
            </button>
            <div className="px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
              <FileCheck size={16} className="text-emerald-400" />
              <span>{spatialLayersMap['layer_pkkpr_approved']?.featuresCount || 0} PKKPR Disetujui</span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-2">
              <Sprout size={16} className="text-amber-400" />
              <span>{spatialLayersMap['layer_sawah']?.featuresCount || 0} Polygon Sawah/LP2B</span>
            </div>
          </div>
        </div>

        {/* Quick Analytical Metric Pill Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5">
              <Wheat size={13} /> Sawah &amp; LP2B
            </div>
            <div className="text-base font-black text-white mt-1">42.850 Ha</div>
            <div className="text-[10px] text-slate-400">Terpetakan di 22 Kecamatan</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] font-mono text-purple-400 uppercase font-bold flex items-center gap-1.5">
              <Layers size={13} /> Pola Ruang RTRW
            </div>
            <div className="text-base font-black text-white mt-1">300.025 Ha</div>
            <div className="text-[10px] text-slate-400">Perda No. 3/2020 Luwu</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
              <TreePine size={13} /> Lahan Perkebunan
            </div>
            <div className="text-base font-black text-white mt-1">89.420 Ha</div>
            <div className="text-[10px] text-slate-400">Kakao, Sawit, Cengkeh</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
              <Building2 size={13} /> Infrastruktur &amp; Jalan
            </div>
            <div className="text-base font-black text-white mt-1">2.967 Segmen</div>
            <div className="text-[10px] text-slate-400">Jalan Utama &amp; Batas Desa</div>
          </div>
        </div>
      </div>

      {/* Menu Kontrol Layer Bar & Quick Presets */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div 
            onClick={() => setIsLayerControlOpen(p => !p)}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>KONTROL LAYER SPASIAL ANALITIK</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {activeLayerCount} / {totalLayerCount} Layer Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih layer tematik untuk analisis permohonan PKKPR, LP2B Pertanian, Pola Ruang RTRW &amp; Batas Administrasi
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono hidden xl:inline">Preset:</span>
            <button
              onClick={() => applyPreset('PERTANIAN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isPertanianRole ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-500/20'
              }`}
            >
              <Wheat size={13} className="text-amber-300" />
              <span>Lahan Pertanian &amp; LP2B</span>
            </button>
            <button
              onClick={() => applyPreset('TATA_RUANG')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isPuptrRole ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-500/20'
              }`}
            >
              <Layers size={13} className="text-indigo-300" />
              <span>Pola Ruang RTRW</span>
            </button>
            <button
              onClick={() => applyPreset('ALL')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Globe size={13} />
              <span>Semua Layer</span>
            </button>
            <button
              onClick={() => setIsLayerControlOpen(p => !p)}
              className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition"
              title="Toggle Panel Kontrol Layer"
            >
              {isLayerControlOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {isLayerControlOpen && (
          <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
            {/* Filter Bar & Tabs */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'Semua Kategori' },
                  { id: 'PERTANIAN', label: '🌾 Pertanian & LP2B' },
                  { id: 'TATA_RUANG', label: '📐 Pola Ruang & Lindung' },
                  { id: 'ADMIN', label: '🏛️ Batas Wilayah' },
                  { id: 'INFRA', label: '🛣️ Jalan & Fasilitas' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      categoryFilter === cat.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search & Tabs */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari layer..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTabLayerControl('VISIBILITY')}
                    className={`px-2.5 py-1 rounded-lg transition ${activeTabLayerControl === 'VISIBILITY' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    <Eye size={12} className="inline mr-1" /> Visibilitas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabLayerControl('OPACITY')}
                    className={`px-2.5 py-1 rounded-lg transition ${activeTabLayerControl === 'OPACITY' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    <Sliders size={12} className="inline mr-1" /> Opacity
                  </button>
                </div>
              </div>
            </div>

            {/* Layer Cards Grid */}
            {activeTabLayerControl === 'VISIBILITY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {filteredLayers.map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                      layer.isActive
                        ? 'bg-white dark:bg-slate-900 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span 
                        className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm"
                        style={{ backgroundColor: layer.color }}
                      />
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block truncate">
                          {layer.category}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                          {layer.name}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                          {layer.featuresCount || 0} fitur
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {layer.isActive ? (
                        <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Eye size={15} />
                        </div>
                      ) : (
                        <div className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400">
                          <EyeOff size={15} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTabLayerControl === 'OPACITY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {filteredLayers.map((layer) => (
                  <div key={layer.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                        {layer.name}
                      </span>
                      <span className="font-mono text-xs text-emerald-500 font-bold">
                        {Math.round((layer.opacity ?? 0.8) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={layer.opacity ?? 0.8}
                      onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Interactive Map Canvas (Spatial Editor Studio) */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl bg-slate-900 h-[780px] min-h-[700px] flex flex-col relative">
        {isLoadingLayers ? (
          <div className="h-[780px] w-full flex flex-col items-center justify-center space-y-3 bg-slate-950 text-white">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs font-mono font-bold text-slate-300">Memuat Layer Spasial Pertanian &amp; Pola Ruang RTRW Luwu...</p>
          </div>
        ) : (
          <SpatialEditorStudio
            currentRole={mappedRole}
            isDarkMode={isDarkMode}
            onRefreshAllData={refreshData}
            spatialLayers={spatialLayersMap}
            setSpatialLayers={setSpatialLayersMap}
            districts={districts}
            villages={villages}
            embeddedMode={true}
          />
        )}
      </div>
    </div>
  );
}
