import React, { useState, useRef, useEffect, useMemo } from 'react';
import Map, { MapRef, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import shp from 'shpjs';
import JSZip from 'jszip';
import { kml } from '@tmcw/togeojson';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  MapPin, 
  Layers, 
  RefreshCw, 
  Sparkles,
  AlertTriangle,
  Database,
  Radio,
  Eye,
  FileCheck,
  Compass,
  Maximize2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { batchSyncSpatialDataToSupabase } from '../../services/spatialSyncService';
import { clearLayerDataCache } from '../../lib/supabaseClient';

interface SpatialImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (importedFeatures: any[], layerTarget: string, mode: 'REPLACE' | 'APPEND', bbox?: [number, number, number, number] | null) => void;
  defaultLayerId?: string;
  activeLayerId?: string;
}

// Batas Geografis Kabupaten Luwu (WGS84 EPSG:4326)
const LUWU_BBOX_BOUNDS = {
  minLng: 119.4,
  maxLng: 120.9,
  minLat: -3.9,
  maxLat: -2.3
};

/**
 * Helper extractor untuk mengekstrak ExtendedData, SimpleData, Data, dan tabel HTML description dari KML
 */
function enrichKmlProperties(kmlDom: Document, geojson: GeoJSON.FeatureCollection) {
  const placemarks = kmlDom.getElementsByTagName('Placemark');
  
  for (let i = 0; i < placemarks.length && i < geojson.features.length; i++) {
    const pm = placemarks[i];
    const nameElem = pm.getElementsByTagName('name')[0];
    const descElem = pm.getElementsByTagName('description')[0];
    const name = nameElem ? nameElem.textContent?.trim() : undefined;
    const desc = descElem ? descElem.textContent?.trim() : undefined;
    
    const extProps: Record<string, any> = {};
    
    // 1. Ekstrak tag <SimpleData name="...">
    const simpleDataList = pm.getElementsByTagName('SimpleData');
    for (let j = 0; j < simpleDataList.length; j++) {
      const sd = simpleDataList[j];
      const attrName = sd.getAttribute('name');
      if (attrName && sd.textContent) {
        extProps[attrName] = sd.textContent.trim();
      }
    }

    // 2. Ekstrak tag <Data name="...">
    const dataList = pm.getElementsByTagName('Data');
    for (let j = 0; j < dataList.length; j++) {
      const d = dataList[j];
      const attrName = d.getAttribute('name');
      const valElem = d.getElementsByTagName('value')[0];
      const val = valElem ? valElem.textContent?.trim() : d.textContent?.trim();
      if (attrName && val) {
        extProps[attrName] = val;
      }
    }

    // 3. Ekstrak tabel HTML di dalam <description> jika ada (Google Earth export style)
    if (desc && desc.includes('<table')) {
      try {
        const parser = new DOMParser();
        const tableDoc = parser.parseFromString(desc, 'text/html');
        const rows = tableDoc.querySelectorAll('tr');
        rows.forEach(r => {
          const tds = r.querySelectorAll('td, th');
          if (tds.length >= 2) {
            const k = tds[0].textContent?.trim();
            const v = tds[1].textContent?.trim();
            if (k && v) extProps[k] = v;
          }
        });
      } catch {}
    }

    if (geojson.features[i]) {
      const existing = geojson.features[i].properties || {};
      const finalName = extProps.nama || extProps.Name || extProps.nama_ruas || extProps.NAMA || extProps.NAMOBJ || name || existing.name || `Fitur Spasial #${i + 1}`;
      const finalDesc = extProps.keterangan || extProps.Description || extProps.deskripsi || desc || existing.description || '';
      const finalKec = extProps.kecamatan || extProps.KECAMATAN || extProps.WADMKC || existing.kecamatan || '';
      const finalDesa = extProps.desa || extProps.DESA || extProps.WADMKD || existing.desa || '';

      geojson.features[i].properties = {
        ...existing,
        ...extProps,
        nama: finalName,
        name: finalName,
        nama_ruas: extProps.nama_ruas || finalName,
        keterangan: finalDesc,
        description: finalDesc,
        kecamatan: finalKec,
        desa: finalDesa,
        desa_kelurahan: finalDesa,
        luas_ha: extProps.luas_ha || extProps.LUAS_HA || extProps.Luas || existing.luas_ha || undefined,
        panjang_km: extProps.panjang_km || extProps.PANJANG_KM || extProps.Panjang || existing.panjang_km || undefined
      };
    }
  }
}

function sanitizeAndHealGeometry(geometry: GeoJSON.Geometry | null | undefined): GeoJSON.Geometry | null {
  if (!geometry || !geometry.type || !('coordinates' in geometry)) return null;

  try {
    if (geometry.type === 'Polygon') {
      const rings = (geometry as GeoJSON.Polygon).coordinates;
      const cleanRings: number[][][] = [];

      for (const ring of rings) {
        if (!Array.isArray(ring) || ring.length < 3) continue;

        const cleanRing = ring.filter(pt => Array.isArray(pt) && pt.length >= 2 && isFinite(pt[0]) && isFinite(pt[1]));
        if (cleanRing.length < 3) continue;

        const first = cleanRing[0];
        const last = cleanRing[cleanRing.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          cleanRing.push([first[0], first[1]]);
        }

        if (cleanRing.length >= 4) {
          cleanRings.push(cleanRing);
        }
      }

      if (cleanRings.length === 0) return null;
      return { type: 'Polygon', coordinates: cleanRings };
    }

    if (geometry.type === 'MultiPolygon') {
      const polys = (geometry as GeoJSON.MultiPolygon).coordinates;
      const cleanPolys: number[][][][] = [];

      for (const poly of polys) {
        const cleanRings: number[][][] = [];
        for (const ring of poly) {
          if (!Array.isArray(ring) || ring.length < 3) continue;
          const cleanRing = ring.filter(pt => Array.isArray(pt) && pt.length >= 2 && isFinite(pt[0]) && isFinite(pt[1]));
          if (cleanRing.length < 3) continue;

          const first = cleanRing[0];
          const last = cleanRing[cleanRing.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            cleanRing.push([first[0], first[1]]);
          }

          if (cleanRing.length >= 4) {
            cleanRings.push(cleanRing);
          }
        }
        if (cleanRings.length > 0) {
          cleanPolys.push(cleanRings);
        }
      }

      if (cleanPolys.length === 0) return null;
      return { type: 'MultiPolygon', coordinates: cleanPolys };
    }

    if (geometry.type === 'LineString') {
      const pts = (geometry as GeoJSON.LineString).coordinates.filter(pt => Array.isArray(pt) && pt.length >= 2 && isFinite(pt[0]) && isFinite(pt[1]));
      if (pts.length < 2) return null;
      return { type: 'LineString', coordinates: pts };
    }

    if (geometry.type === 'Point') {
      const pt = (geometry as GeoJSON.Point).coordinates;
      if (!Array.isArray(pt) || pt.length < 2 || !isFinite(pt[0]) || !isFinite(pt[1])) return null;
      return { type: 'Point', coordinates: [pt[0], pt[1]] };
    }

    return geometry;
  } catch {
    return null;
  }
}

export default function SpatialImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  defaultLayerId,
  activeLayerId = 'gis_zonasi'
}: SpatialImportModalProps) {
  const mapPreviewRef = useRef<MapRef>(null);

  const initialTarget = defaultLayerId || activeLayerId;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetLayer, setTargetLayer] = useState<string>(initialTarget);
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseStatusMsg, setParseStatusMsg] = useState<string>('');
  
  // Progress Bar State (0% - 100%)
  const [uploadProgress, setUploadProgress] = useState<{
    pct: number;
    processed: number;
    total: number;
  } | null>(null);

  // Warning for outside Luwu BBox
  const [bboxWarning, setBboxWarning] = useState<string | null>(null);

  // Parsed GeoJSON state
  const [parsedGeoJSON, setParsedGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [metaStats, setMetaStats] = useState<{
    totalFeatures: number;
    polygonCount: number;
    lineCount: number;
    pointCount: number;
    totalAreaHa: number;
    totalLengthKm: number;
    bbox: [number, number, number, number] | null;
  } | null>(null);

  // Map viewstate for mini map preview
  const [previewViewState, setPreviewViewState] = useState({
    longitude: 120.35,
    latitude: -3.25,
    zoom: 9.5
  });

  // Sync targetLayer with activeLayerId prop on open
  useEffect(() => {
    if (isOpen) {
      setTargetLayer(defaultLayerId || activeLayerId || 'gis_zonasi');
    }
  }, [isOpen, defaultLayerId, activeLayerId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setParsedGeoJSON(null);
      setMetaStats(null);
      setIsParsing(false);
      setIsProcessing(false);
      setUploadProgress(null);
      setBboxWarning(null);
      setParseStatusMsg('');
    }
  }, [isOpen]);

  // Fit bounds whenever new GeoJSON is parsed
  useEffect(() => {
    if (parsedGeoJSON && metaStats?.bbox && mapPreviewRef.current) {
      try {
        const [minX, minY, maxX, maxY] = metaStats.bbox;
        if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
          mapPreviewRef.current.fitBounds(
            [[minX, minY], [maxX, maxY]],
            { padding: 35, duration: 1000 }
          );
        }
      } catch (err) {
        console.warn('Preview fit bounds notice:', err);
      }
    }
  }, [parsedGeoJSON, metaStats]);

  if (!isOpen) return null;

  // Process & validate GeoJSON features using Turf.js
  const processAndValidateGeoJSON = (rawGeoJSON: any) => {
    let featureCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };

    if (Array.isArray(rawGeoJSON)) {
      const combined: any[] = [];
      rawGeoJSON.forEach(fc => {
        if (fc?.features) combined.push(...fc.features);
      });
      featureCollection.features = combined;
    } else if (rawGeoJSON.type === 'FeatureCollection' && Array.isArray(rawGeoJSON.features)) {
      featureCollection = rawGeoJSON;
    } else if (rawGeoJSON.type === 'Feature') {
      featureCollection = { type: 'FeatureCollection', features: [rawGeoJSON] };
    } else if (rawGeoJSON.type && rawGeoJSON.coordinates) {
      featureCollection = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: rawGeoJSON, properties: {} }]
      };
    }

    // Filter valid geometries and sanitize
    const cleanFeatures: GeoJSON.Feature[] = [];
    let polyCount = 0;
    let lineCount = 0;
    let ptCount = 0;
    let totalAreaSqM = 0;
    let totalLenKm = 0;

    featureCollection.features.forEach((feat, idx) => {
      if (!feat || !feat.geometry || !feat.geometry.type) return;

      const healedGeom = sanitizeAndHealGeometry(feat.geometry);
      if (!healedGeom) return;

      const gType = healedGeom.type;
      const cleanProps = { 
        ...(feat.properties || {}), 
        id: feat.id || feat.properties?.id || `imp_${Date.now()}_${idx + 1}` 
      };

      try {
        const cleanFeat: GeoJSON.Feature = {
          type: 'Feature',
          id: cleanProps.id,
          geometry: healedGeom,
          properties: cleanProps
        };

        if (gType === 'Polygon' || gType === 'MultiPolygon') {
          polyCount++;
          const area = turf.area(cleanFeat);
          if (isFinite(area)) totalAreaSqM += area;
        } else if (gType === 'LineString' || gType === 'MultiLineString') {
          lineCount++;
          const len = turf.length(cleanFeat, { units: 'kilometers' });
          if (isFinite(len)) totalLenKm += len;
        } else if (gType === 'Point' || gType === 'MultiPoint') {
          ptCount++;
        }

        cleanFeatures.push(cleanFeat);
      } catch (geomErr) {
        console.warn('Geom validation skip:', geomErr);
      }
    });

    const validatedFC: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: cleanFeatures
    };

    let calculatedBbox: [number, number, number, number] | null = null;
    try {
      if (cleanFeatures.length > 0) {
        calculatedBbox = turf.bbox(validatedFC) as [number, number, number, number];
        
        // Cek apakah koordinat berada dalam batas Kabupaten Luwu
        const [bMinX, bMinY, bMaxX, bMaxY] = calculatedBbox;
        if (
          bMinX < LUWU_BBOX_BOUNDS.minLng || 
          bMaxX > LUWU_BBOX_BOUNDS.maxLng || 
          bMinY < LUWU_BBOX_BOUNDS.minLat || 
          bMaxY > LUWU_BBOX_BOUNDS.maxLat
        ) {
          setBboxWarning(`Perhatian: Rentang koordinat [${bMinX.toFixed(2)}, ${bMinY.toFixed(2)}] berada sebagian di luar batas standar Kab. Luwu. Pastikan data berproyeksi WGS84 (EPSG:4326).`);
        } else {
          setBboxWarning(null);
        }
      }
    } catch {}

    setParsedGeoJSON(validatedFC);
    setMetaStats({
      totalFeatures: cleanFeatures.length,
      polygonCount: polyCount,
      lineCount: lineCount,
      pointCount: ptCount,
      totalAreaHa: Number((totalAreaSqM / 10000).toFixed(2)),
      totalLengthKm: Number(totalLenKm.toFixed(2)),
      bbox: calculatedBbox
    });
  };

  // Handle file selection and parsing with JSZip (.kmz) / @tmcw/togeojson (.kml) / shpjs (.zip) / JSON
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setParseStatusMsg('Membaca berkas spasial...');
    setParsedGeoJSON(null);
    setMetaStats(null);
    setBboxWarning(null);

    const fileName = file.name.toLowerCase();

    try {
      // 1. KMZ Parser via JSZip + @tmcw/togeojson
      if (fileName.endsWith('.kmz')) {
        setParseStatusMsg('Mengekstrak arsip KMZ Google Earth...');
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Cari berkas KML di dalam ZIP (mendukung doc.kml atau berkas .kml pertama)
        const kmlFiles = Object.keys(zip.files).filter(f => /.*\.kml$/i.test(f) && !zip.files[f].dir);
        
        if (kmlFiles.length === 0) {
          throw new Error('Berkas KMZ tidak memuat file KML (.kml) yang valid.');
        }

        const primaryKmlName = kmlFiles.find(f => f.toLowerCase() === 'doc.kml') || kmlFiles[0];
        setParseStatusMsg(`Membaca KML: "${primaryKmlName}"...`);
        
        const kmlText = await zip.files[primaryKmlName].async('text');
        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(kmlText, 'text/xml');
        
        // Cek apakah XML valid
        const parseError = kmlDom.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
          throw new Error('Struktur XML KML di dalam KMZ tidak valid atau rusak.');
        }

        const converted = kml(kmlDom) as GeoJSON.FeatureCollection;
        enrichKmlProperties(kmlDom, converted);
        processAndValidateGeoJSON(converted);
      }
      // 2. KML Direct Parser via @tmcw/togeojson & DOMParser
      else if (fileName.endsWith('.kml')) {
        setParseStatusMsg('Mem-parsing dokumen KML...');
        const text = await file.text();
        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(text, 'text/xml');
        
        const parseError = kmlDom.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
          throw new Error('Struktur XML KML tidak valid.');
        }

        const converted = kml(kmlDom) as GeoJSON.FeatureCollection;
        enrichKmlProperties(kmlDom, converted);
        processAndValidateGeoJSON(converted);
      }
      // 3. Shapefile ZIP parser via shpjs
      else if (fileName.endsWith('.zip')) {
        setParseStatusMsg('Mengekstrak Shapefile (.shp + .dbf)...');
        const arrayBuffer = await file.arrayBuffer();
        const parsed = await shp(arrayBuffer);
        processAndValidateGeoJSON(parsed);
      } 
      // 4. GeoJSON / JSON direct parser
      else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
        setParseStatusMsg('Mem-parsing GeoJSON...');
        const text = await file.text();
        const parsed = JSON.parse(text);
        processAndValidateGeoJSON(parsed);
      } else {
        throw new Error('Format berkas tidak didukung. Harap unggah berkas .kmz, .kml, .zip (Shapefile), atau .geojson.');
      }
    } catch (err: any) {
      console.error('File parse error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membaca Berkas Spasial',
        text: err?.message || 'Terjadi kesalahan saat mem-parsing file. Pastikan berkas KMZ/KML valid dan berproyeksi WGS84.',
        confirmButtonColor: '#ef4444'
      });
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
      setParseStatusMsg('');
    }
  };

  // Execute bulk import with REPLACE or APPEND mode using batchSyncSpatialDataToSupabase
  const handleExecuteImport = async () => {
    if (!parsedGeoJSON || parsedGeoJSON.features.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Ada Data Spasial',
        text: 'Silakan pilih berkas KMZ, KML, SHP, atau GeoJSON yang valid terlebih dahulu.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    // Confirmation if REPLACE ALL was selected
    if (importMode === 'REPLACE') {
      const confirmResult = await Swal.fire({
        icon: 'warning',
        title: 'Konfirmasi Timpa Total (REPLACE)?',
        html: `Anda memilih <strong>Timpa Total (Replace All)</strong> pada tabel <code>${targetLayer}</code>.<br/><br/>Seluruh data eksisting pada tabel ini akan <strong>DIHAPUS BERSIH</strong> dan digantikan oleh <strong>${parsedGeoJSON.features.length} fitur baru</strong> dari KMZ/KML.`,
        showCancelButton: true,
        confirmButtonText: 'Ya, Timpa Total Data',
        cancelButtonText: 'Batalkan',
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#64748b'
      });

      if (!confirmResult.isConfirmed) return;
    }

    setIsProcessing(true);
    setUploadProgress({ pct: 0, processed: 0, total: parsedGeoJSON.features.length });

    try {
      // Eksekusi Batch Chunking ke Supabase PostGIS
      const syncResult = await batchSyncSpatialDataToSupabase(
        targetLayer,
        parsedGeoJSON.features,
        {
          mode: importMode,
          layerId: targetLayer,
          onProgress: (pct, processed, total) => {
            setUploadProgress({ pct, processed, total });
          }
        }
      );

      if (!syncResult.success) {
        throw new Error(syncResult.message || 'Gagal mengeksekusi Batch Sync ke Supabase PostGIS.');
      }

      // Bersihkan local cache
      clearLayerDataCache(targetLayer);

      // Trigger Parent Callback to re-render in PuptrSpatialEditorDashboard & fit camera
      if (onImportSuccess) {
        onImportSuccess(parsedGeoJSON.features, targetLayer, importMode, metaStats?.bbox);
      }

      Swal.fire({
        icon: 'success',
        title: 'Impor Spasial Berhasil!',
        html: `Berhasil mendaratkan <strong>${syncResult.count} fitur spasial</strong> ke tabel <code>${targetLayer}</code> dengan metode <strong>${importMode === 'REPLACE' ? 'Timpa Total (Replace)' : 'Tambahkan (Append)'}</strong>.`,
        confirmButtonColor: '#10b981',
        timer: 3500
      });

      onClose();
    } catch (err: any) {
      console.error('Import execution error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Eksekusi Impor PostGIS',
        text: err?.message || 'Terjadi kesalahan saat mengeksekusi Batch Sync ke database Supabase.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#0d121f] border border-slate-800 p-5 md:p-6 shadow-2xl text-white flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 text-amber-400 border border-amber-500/30 shadow-inner">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white flex items-center gap-2">
                <span>Impor Data Spasial Vector (KMZ / KML / SHP)</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
                  Google Earth • QGIS
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Presisi WGS84 (EPSG:4326) • Ekstraksi ExtendedData • Safe Batch Insert
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body (Grid Layout: Form Left, Map Preview Right) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 custom-scrollbar">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* ─── LEFT COLUMN: CONFIGURATION & FILE INPUT (5 Cols) ─── */}
            <div className="lg:col-span-5 space-y-3.5">
              
              {/* Target Layer Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <Layers size={13} className="text-purple-400" />
                  <span>Target Layer Spasial (Tabel PostGIS)</span>
                </label>
                <select
                  value={targetLayer}
                  onChange={(e) => setTargetLayer(e.target.value)}
                  disabled={isProcessing || isParsing}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-purple-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="gis_sawah">gis_sawah (Lahan Pertanian Basah & LP2B)</option>
                  <option value="gis_zonasi">gis_zonasi (Pola Ruang & Zonasi RTRW)</option>
                  <option value="gis_mangrove">gis_mangrove (Hutan Lindung Mangrove & Pesisir)</option>
                  <option value="gis_tambak">gis_tambak (Kawasan Budidaya Tambak)</option>
                  <option value="gis_lahankeringprimer">gis_lahankeringprimer (Hutan Lahan Kering Primer)</option>
                  <option value="gis_lahankeringsekunder">gis_lahankeringsekunder (Lahan Kering Sekunder)</option>
                  <option value="gis_jalan">gis_jalan (Jaringan Jalan PUPTR)</option>
                  <option value="gis_sungai">gis_sungai (Hidrologi & Sungai)</option>
                  <option value="gis_infrastruktur">gis_infrastruktur (Infrastruktur Wilayah)</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <FileText size={13} className="text-amber-400" />
                  <span>Unggah Berkas KMZ / KML / SHP</span>
                </label>
                
                <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-5 text-center space-y-2.5 bg-slate-950/60 hover:bg-slate-950/80 transition-all relative cursor-pointer group">
                  <input
                    type="file"
                    accept=".kmz,.kml,.zip,.geojson,.json"
                    onChange={handleFileChange}
                    disabled={isProcessing || isParsing}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  
                  {isParsing ? (
                    <div className="py-2 space-y-2">
                      <RefreshCw size={26} className="text-amber-400 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-amber-300">{parseStatusMsg || 'Mem-parsing geometri file...'}</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-12 h-12 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          {selectedFile ? selectedFile.name : 'Pilih atau Tarik Berkas KMZ/KML ke Sini'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                          Mendukung .kmz (Google Earth), .kml, .zip (Shapefile), .geojson
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Conflict Resolution Radio Options */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Database size={13} className="text-teal-400" />
                  <span>Opsi Penanganan Data (Database Strategy)</span>
                </div>

                <div className="space-y-2 pt-1">
                  {/* Option B: APPEND */}
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    importMode === 'APPEND'
                      ? 'bg-purple-950/40 border-purple-500/60 text-white'
                      : 'bg-[#111726]/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="import_conflict_mode"
                      checked={importMode === 'APPEND'}
                      onChange={() => setImportMode('APPEND')}
                      disabled={isProcessing}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-purple-300">OPSI B: Tambahkan (Append)</div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Pertahankan data lama di Supabase, sisipkan seluruh poligon dari berkas sebagai data baru.
                      </p>
                    </div>
                  </label>

                  {/* Option A: REPLACE ALL */}
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    importMode === 'REPLACE'
                      ? 'bg-rose-950/40 border-rose-500/60 text-white'
                      : 'bg-[#111726]/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="import_conflict_mode"
                      checked={importMode === 'REPLACE'}
                      onChange={() => setImportMode('REPLACE')}
                      disabled={isProcessing}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-rose-300">OPSI A: Timpa Total (Replace All)</div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Hapus bersih seluruh poligon lama pada tabel ini, lalu gantikan 100% dengan isi berkas KMZ.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Warning box if outside Luwu */}
              {bboxWarning && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px] flex items-start gap-2 font-mono">
                  <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">{bboxWarning}</p>
                </div>
              )}

              {/* Progress Bar during Batch Sync */}
              {uploadProgress && (
                <div className="p-3 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-300">
                    <span>Mendaratkan Batch ke PostGIS...</span>
                    <span>{uploadProgress.pct}% ({uploadProgress.processed}/{uploadProgress.total})</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${uploadProgress.pct}%` }}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* ─── RIGHT COLUMN: STAGING PREVIEW & LIVE MAP (7 Cols) ─── */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              
              {/* Staging Map Canvas Box */}
              <div className="flex-1 min-h-[260px] md:min-h-[300px] rounded-2xl overflow-hidden border border-slate-800 relative bg-slate-950 shadow-inner flex flex-col">
                
                {/* Preview Overlay Badge */}
                <div className="absolute top-2.5 left-2.5 z-10 bg-[#0d121f]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-white flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-yellow-300">
                    STAGING AREA PREVIEW (KMZ/KML)
                  </span>
                </div>

                {/* Map Component */}
                <Map
                  ref={mapPreviewRef}
                  {...previewViewState}
                  onMove={(evt) => setPreviewViewState(evt.viewState)}
                  style={{ width: '100%', height: '100%', minHeight: '260px' }}
                  mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                >
                  <NavigationControl position="bottom-right" showCompass={false} />

                  {/* Render Parsed Staging GeoJSON in Vibrant High-Contrast Neon Yellow / Amber */}
                  {parsedGeoJSON && parsedGeoJSON.features.length > 0 && (
                    <Source id="staging_geojson_source" type="geojson" data={parsedGeoJSON}>
                      {/* Polygon Fill Layer */}
                      <Layer
                        id="staging_polygon_fill"
                        type="fill"
                        filter={['any', ['==', '$type', 'Polygon'], ['==', '$type', 'MultiPolygon']]}
                        paint={{
                          'fill-color': '#facc15',
                          'fill-opacity': 0.35
                        }}
                      />
                      {/* Polygon & Line Outer Glow / Casing */}
                      <Layer
                        id="staging_line_glow"
                        type="line"
                        paint={{
                          'line-color': '#ca8a04',
                          'line-width': 4.5,
                          'line-opacity': 0.6
                        }}
                      />
                      {/* Main Crisp Line */}
                      <Layer
                        id="staging_line_main"
                        type="line"
                        paint={{
                          'line-color': '#fef08a',
                          'line-width': 2.5
                        }}
                      />
                      {/* Point Features */}
                      <Layer
                        id="staging_point_outer"
                        type="circle"
                        filter={['any', ['==', '$type', 'Point'], ['==', '$type', 'MultiPoint']]}
                        paint={{
                          'circle-radius': 7,
                          'circle-color': '#facc15',
                          'circle-stroke-width': 2,
                          'circle-stroke-color': '#ffffff'
                        }}
                      />
                    </Source>
                  )}
                </Map>

                {/* Empty State placeholder if no file loaded */}
                {!parsedGeoJSON && (
                  <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/70 backdrop-blur-xs pointer-events-none">
                    <Compass size={32} className="text-slate-600 mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-slate-300">Peta Staging Belum Memuat Data</p>
                    <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">
                      Unggah berkas KMZ, KML, SHP, atau GeoJSON di sebelah kiri untuk melihat render batas koordinat di sini.
                    </p>
                  </div>
                )}

              </div>

              {/* Meta Stats Breakdown Card */}
              {metaStats ? (
                <div className="p-3 rounded-2xl bg-[#111726] border border-slate-800 space-y-2 text-xs font-mono animate-in fade-in">
                  <div className="flex items-center justify-between text-amber-400 font-bold">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Validasi Geometri Berhasil (WGS84)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-500/30">
                      {metaStats.totalFeatures} Total Fitur
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                      <div className="text-[9px] text-slate-400">Poligon</div>
                      <div className="text-sm font-extrabold text-white">{metaStats.polygonCount}</div>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                      <div className="text-[9px] text-slate-400">Ruas Garis</div>
                      <div className="text-sm font-extrabold text-white">{metaStats.lineCount}</div>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                      <div className="text-[9px] text-slate-400">Titik Point</div>
                      <div className="text-sm font-extrabold text-white">{metaStats.pointCount}</div>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                      <div className="text-[9px] text-slate-400">Luas / Panjang</div>
                      <div className="text-xs font-extrabold text-amber-400 truncate">
                        {metaStats.polygonCount > 0 ? `${metaStats.totalAreaHa} Ha` : `${metaStats.totalLengthKm} km`}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                  <AlertCircle size={14} className="text-slate-500 shrink-0" />
                  <span>Menunggu berkas KMZ/KML diunggah untuk kalkulasi metrik spasial Turf.js...</span>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 shrink-0">
          <div className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1.5 font-mono">
            <Sparkles size={12} className="text-amber-400" />
            <span>KMZ/KML Bulk Parser Engine • WGS84 EPSG:4326</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={isProcessing || isParsing || !parsedGeoJSON || parsedGeoJSON.features.length === 0}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98] ${
                parsedGeoJSON && parsedGeoJSON.features.length > 0
                  ? (importMode === 'REPLACE'
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30')
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-white" />
                  <span>Mendaratkan ke PostGIS...</span>
                </>
              ) : (
                <>
                  <FileCheck size={14} />
                  <span>
                    {importMode === 'REPLACE' 
                      ? `Eksekusi Impor (Timpa Total ${metaStats?.totalFeatures || 0} Fitur)` 
                      : `Eksekusi Impor (Tambahkan ${metaStats?.totalFeatures || 0} Fitur)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
