/**
 * Spatial Sync Service for Supabase PostGIS
 * Kabupaten Luwu - Dinas PUPTR & Dinas Pertanian
 * 
 * Modul terpadu untuk validasi topologi OGC, sanitasi skema tabel PostGIS,
 * kalkulasi metrik spasial (Turf.js), dan eksekusi UPSERT aman
 * ke database Supabase PostGIS (dengan fallback API proxy backend).
 */

import * as turf from '@turf/turf';
import { supabase, clearLayerDataCache } from '../lib/supabaseClient';
import { normalizePKKPRStatus } from '../types/pkkprWorkflow';

export interface SpatialSyncOptions {
  featureId?: string | number;
  properties?: Record<string, any>;
  userId?: string;
  layerId?: string;
  skipRestProxy?: boolean;
}

export interface SpatialSyncPayload {
  featureId?: string | number;
  geojsonData: any; // GeoJSON Feature or Geometry
  tableName?: string;
  layerId?: string;
  properties?: Record<string, any>;
  userId?: string;
  skipRestProxy?: boolean;
}

export interface SpatialSyncResult {
  success: boolean;
  featureId: string | number;
  tableName: string;
  message: string;
  metrics?: {
    areaHa: number;
    lengthKm: number;
    geomType: string;
  };
  data?: any;
  error?: any;
}

// 11 Tabel Spasial Resmi Kabupaten Luwu dengan metadata skema
export const KNOWN_SPATIAL_TABLES: Record<string, {
  name: string;
  pkType: 'int4' | 'uuid' | 'text';
  category: string;
  defaultNamePrefix: string;
}> = {
  gis_zonasi: { name: 'Pola Ruang RTRW / RDTR', pkType: 'int4', category: 'Tata Ruang', defaultNamePrefix: 'Zona Ruang' },
  gis_sawah: { name: 'Lahan Pertanian & LP2B', pkType: 'int4', category: 'Pertanian', defaultNamePrefix: 'Lahan LP2B' },
  gis_jalan: { name: 'Jaringan Jalan', pkType: 'int4', category: 'Infrastruktur', defaultNamePrefix: 'Ruas Jalan' },
  gis_sungai: { name: 'Hidrologi & Sungai', pkType: 'uuid', category: 'Infrastruktur', defaultNamePrefix: 'Sungai' },
  gis_mangrove: { name: 'Kawasan Mangrove', pkType: 'int4', category: 'Lingkungan', defaultNamePrefix: 'Zona Mangrove' },
  gis_tambak: { name: 'Perikanan Tambak', pkType: 'int4', category: 'Perikanan', defaultNamePrefix: 'Tambak' },
  gis_lahankeringprimer: { name: 'Lahan Kering Primer', pkType: 'int4', category: 'Kehutanan', defaultNamePrefix: 'Hutan Lahan Kering' },
  gis_lahankeringsekunder: { name: 'Lahan Kering Sekunder', pkType: 'int4', category: 'Kehutanan', defaultNamePrefix: 'Lahan Kering Sekunder' },
  gis_infrastruktur: { name: 'Infrastruktur Wilayah', pkType: 'int4', category: 'Infrastruktur', defaultNamePrefix: 'Infrastruktur' },
  gis_pkkpr: { name: 'Kesesuaian Pemanfaatan Ruang (PKKPR)', pkType: 'uuid', category: 'Perizinan', defaultNamePrefix: 'Plotting PKKPR' },
  gis_potensi_investasi: { name: 'Lahan Potensi Investasi Luwu', pkType: 'text', category: 'Investasi', defaultNamePrefix: 'Kawasan Investasi' }
};

/**
 * Daftar Kolom Resmi PostgreSQL yang Ada di Masing-masing Tabel Supabase
 * Ini mencegah error PostgREST: "Could not find the '<column>' column of '<table>' in the schema cache"
 */
export const TABLE_COLUMN_WHITELISTS: Record<string, string[]> = {
  gis_sawah: ['id', 'name', 'description', 'styleurl', 'fill_opacity', 'fill', 'stroke_opacity', 'stroke', 'geom'],
  gis_zonasi: ['id', 'styleurl', 'fill_opacity', 'stroke_opacity', 'stroke', 'stroke_width', 'keterangan', 'rpluwu2009', 'geom'],
  gis_jalan: ['id', 'urt', 'kode_jalan', 'no_ruas', 'nama_ruas', 'nama', 'panjang', 'panjang_km', 'lebar', 'fungsi', 'status', 'permukaan', 'kondisi', 'penanganan', 'tahun', 'kecamatan', 'keterangan', 'geom'],
  gis_sungai: ['id', 'nama_sungai', 'ordo_sungai', 'lebar_sempadan', 'geom', 'created_at'],
  gis_mangrove: ['id', 'name', 'description', 'styleurl', 'fill_opacity', 'fill', 'stroke_opacity', 'stroke', 'geom'],
  gis_tambak: ['id', 'name', 'description', 'styleurl', 'fill_opacity', 'fill', 'stroke_opacity', 'stroke', 'icon_scale', 'icon_offset', 'icon_offset_units', 'icon', 'geom'],
  gis_lahankeringprimer: ['id', 'name', 'description', 'styleurl', 'fill_opacity', 'fill', 'stroke_opacity', 'stroke', 'geom'],
  gis_lahankeringsekunder: ['id', 'name', 'description', 'styleurl', 'fill_opacity', 'fill', 'stroke_opacity', 'stroke', 'geom'],
  gis_infrastruktur: ['id', 'geom', 'nama_infrastruktur', 'kategori', 'keterangan_singkat', 'status', 'updated_at', 'created_at'],
  gis_pkkpr: ['id', 'user_id', 'jenis_permohonan', 'nama_permohonan', 'nib_oss', 'nama_badan_usaha', 'nama_pemohon', 'nik_pemohon', 'no_whatsapp', 'sektor', 'kecamatan', 'desa_kelurahan', 'luas_m2', 'luas_ha', 'geom', 'geometry_json', 'status_pkkpr', 'catatan_teknis', 'updated_at', 'created_at'],
  gis_potensi_investasi: ['id', 'geom', 'nama_potensi', 'slug', 'sektor_utama', 'sub_sektor', 'deskripsi_singkat', 'luas_lahan', 'kesesuaian_rtrw', 'status_pkkpr', 'updated_at']
};

/**
 * Normalisasi Primary Key agar kompatibel 100% dengan tipe data tabel Supabase
 * (int4 untuk gis_jalan, gis_sawah, gis_zonasi, gis_mangrove, gis_tambak, dll.)
 */
export function resolveFeatureId(rawId: any, tableName: string, fallbackProps?: Record<string, any>): string | number {
  const tableConfig = KNOWN_SPATIAL_TABLES[tableName];
  const pkType = tableConfig?.pkType || (tableName === 'gis_sungai' ? 'uuid' : (['gis_pkkpr', 'gis_potensi_investasi'].includes(tableName) ? 'text' : 'int4'));

  // Prioritaskan ID kanonik dari properti jika rawId adalah string acak / UUID
  const candidateId = rawId ?? fallbackProps?.original_id ?? fallbackProps?.id ?? fallbackProps?._id;

  if (pkType === 'int4') {
    if (typeof candidateId === 'number' && candidateId > 0 && candidateId <= 2147483647) {
      return candidateId;
    }
    const str = String(candidateId || '').trim();
    const parsedDirect = parseInt(str, 10);
    if (!isNaN(parsedDirect) && parsedDirect > 0 && parsedDirect <= 2147483647 && String(parsedDirect) === str) {
      return parsedDirect;
    }
    // Extract numeric suffix if id is like "gis_sawah_27" or "layer_sawah_27" or "feat_27"
    if (/^(gis_|layer_|feat_)/.test(str)) {
      const digitsOnly = str.replace(/\D+/g, '');
      if (digitsOnly) {
        const parsedDigits = parseInt(digitsOnly, 10);
        if (!isNaN(parsedDigits) && parsedDigits > 0 && parsedDigits <= 2147483647) {
          return parsedDigits;
        }
      }
    }

    // Jika candidateId adalah UUID (dari MapboxDraw), cek apakah fallbackProps menyimpan ID integer asli
    if (fallbackProps) {
      const pId = fallbackProps.original_id ?? fallbackProps.id ?? fallbackProps._id;
      if (pId !== undefined && pId !== null && pId !== candidateId) {
        if (typeof pId === 'number' && pId > 0 && pId <= 2147483647) {
          return pId;
        }
        const pNum = parseInt(String(pId).trim(), 10);
        if (!isNaN(pNum) && pNum > 0 && pNum <= 2147483647 && String(pNum) === String(pId).trim()) {
          return pNum;
        }
      }
    }

    // Generate positive int32 murni HANYA untuk poligon baru yang belum pernah disimpan
    return Math.abs(Math.floor(Date.now() % 2000000000) + Math.floor(Math.random() * 1000));
  }
  
  if (pkType === 'uuid' || tableName === 'gis_sungai' || tableName === 'gis_pkkpr') {
    const str = String(candidateId || '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    if (isUuid) return str;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  return candidateId ? String(candidateId) : `feat_${Date.now()}`;
}

/**
 * Validasi struktur GeoJSON dan ekstraksi metrik analitik luas & panjang via Turf.js
 */
export function normalizeSpatialFeature(rawFeature: any, extraProps: Record<string, any> = {}): any {
  if (!rawFeature) {
    throw new Error('Data geometri GeoJSON kosong atau tidak terdefinisi.');
  }

  let feature: any = rawFeature;
  if (!rawFeature.type || rawFeature.type !== 'Feature') {
    if (rawFeature.type && ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString', 'Point', 'MultiPoint'].includes(rawFeature.type)) {
      feature = {
        type: 'Feature',
        geometry: rawFeature,
        properties: { ...extraProps }
      };
    } else if (rawFeature.geometry) {
      feature = {
        type: 'Feature',
        geometry: rawFeature.geometry,
        properties: { ...rawFeature.properties, ...extraProps }
      };
    } else {
      throw new Error('Format objek bukan GeoJSON Feature atau Geometry yang valid.');
    }
  }

  if (!feature.geometry || !feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) {
    throw new Error('Struktur geometri tidak memiliki koordinat array yang valid.');
  }

  let areaHa = 0;
  let lengthKm = 0;
  const geomType = feature.geometry.type;

  try {
    if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      const areaSqM = turf.area(feature);
      areaHa = Number((areaSqM / 10000).toFixed(4));
      lengthKm = Number(turf.length(feature, { units: 'kilometers' }).toFixed(3));
    } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
      lengthKm = Number(turf.length(feature, { units: 'kilometers' }).toFixed(3));
    }
  } catch (err) {
    console.warn('[spatialSyncService] Peringatan kalkulasi metrik Turf.js:', err);
  }

  // Prioritaskan ID kanonik asli (properties.id / properties.original_id) sebelum menggunakan feature.id MapboxDraw
  const canonicalId = 
    extraProps.original_id ??
    extraProps.id ??
    feature.properties?.original_id ??
    feature.properties?.id ??
    (feature.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(feature.id)) ? feature.id : undefined) ??
    feature.id ??
    `feat_${Date.now()}`;

  const cleanProperties = {
    ...feature.properties,
    ...extraProps,
    id: canonicalId,
    original_id: canonicalId,
    luas_ha: areaHa > 0 ? areaHa : (feature.properties?.luas_ha || 0),
    panjang_km: lengthKm > 0 ? lengthKm : (feature.properties?.panjang_km || 0),
    geom_type: geomType,
    updated_at: new Date().toISOString()
  };

  return {
    ...feature,
    id: canonicalId,
    properties: cleanProperties,
    metrics: { areaHa, lengthKm, geomType }
  };
}

/**
 * Format objek baris database yang STRICT hanya memuat kolom yang diakui tabel PostGIS tujuan.
 * Menghilangkan kolom yang tidak ada seperti 'luas_ha' di tabel gis_sawah / gis_zonasi.
 */
export function formatRowForSpatialTable(
  tableName: string,
  feature: any,
  extraProps: Record<string, any> = {}
): Record<string, any> {
  const allowedCols = TABLE_COLUMN_WHITELISTS[tableName];
  const props = { ...feature.properties, ...extraProps };
  const candidateId = extraProps.featureId || extraProps.id || extraProps.original_id || props.original_id || props.id || feature.id;
  const finalId = resolveFeatureId(candidateId, tableName, props);
  const geom = feature.geometry || feature.geom;

  let areaHa = props.luas_ha || 0;
  let lengthKm = props.panjang_km || 0;
  if (!areaHa && geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
    try { areaHa = Number((turf.area(feature) / 10000).toFixed(4)); } catch {}
  }
  if (!lengthKm && geom && (geom.type === 'LineString' || geom.type === 'MultiLineString')) {
    try { lengthKm = Number(turf.length(feature, { units: 'kilometers' }).toFixed(3)); } catch {}
  }

  // Sanitasi nilai opacity: untuk gis_zonasi harus integer murni (0..100)
  const isZonasi = tableName === 'gis_zonasi';
  const fillOp = typeof props.fill_opacity === 'number' 
    ? (isZonasi ? Math.round(props.fill_opacity <= 1 ? props.fill_opacity * 100 : props.fill_opacity) : props.fill_opacity)
    : (isZonasi ? 45 : 0.45);
  const strokeOp = typeof props.stroke_opacity === 'number'
    ? (isZonasi ? Math.round(props.stroke_opacity <= 1 ? props.stroke_opacity * 100 : props.stroke_opacity) : props.stroke_opacity)
    : (isZonasi ? 100 : 1);

  // Sanitasi luas_lahan: untuk gis_potensi_investasi harus numeric (angka murni)
  const rawLuas = props.luas_lahan !== undefined ? props.luas_lahan : areaHa;
  const numericLuas = typeof rawLuas === 'number' 
    ? rawLuas 
    : (parseFloat(String(rawLuas || '0').replace(/[^\d.-]/g, '')) || areaHa || 0);

  const candidateValues: Record<string, any> = {
    id: finalId,
    geom: geom,
    name: props.name || props.nama_ruas || props.nama_sungai || props.nama_infrastruktur || props.nama_potensi || props.nama || `Fitur Spasial #${finalId}`,
    nama: props.nama || props.name || `Fitur Spasial #${finalId}`,
    nama_ruas: props.nama_ruas || props.name || `Ruas #${finalId}`,
    nama_sungai: props.nama_sungai || props.name || `Sungai #${finalId}`,
    nama_infrastruktur: props.nama_infrastruktur || props.name || `Infrastruktur #${finalId}`,
    nama_potensi: props.nama_potensi || props.name || `Potensi #${finalId}`,
    nama_pemohon: props.nama_pemohon || props.name || 'Pemohon PUPTR',
    nama_permohonan: props.nama_permohonan || props.name || 'Permohonan Tata Ruang',
    jenis_permohonan: props.jenis_permohonan || 'PKKPR Berusaha',
    description: props.description || (areaHa > 0 ? `Luas: ${areaHa} Ha. ${props.keterangan || ''}` : (props.keterangan || '')),
    keterangan: props.keterangan || props.catatan || (props.description ? String(props.description) : ''),
    keterangan_singkat: props.keterangan || props.keterangan_singkat || '',
    rpluwu2009: props.rpluwu2009 || props.kategori || props.sektor || 'Pola Ruang',
    sektor: props.sektor || 'Tata Ruang',
    sektor_utama: props.sektor || 'Tata Ruang',
    kategori: props.kategori || 'Zona Ruang',
    luas_ha: areaHa,
    luas_m2: Math.round(areaHa * 10000),
    luas_lahan: tableName === 'gis_potensi_investasi' ? numericLuas : `${areaHa} Ha`,
    panjang_km: lengthKm,
    panjang: lengthKm,
    kecamatan: props.kecamatan || '',
    desa: props.desa || '',
    desa_kelurahan: props.desa || '',
    status: props.status || 'Aktif',
    status_pkkpr: props.status_pkkpr ? normalizePKKPRStatus(props.status_pkkpr) : 'TERBIT',
    fill_opacity: fillOp,
    stroke_opacity: strokeOp,
    fill: props.fill || '#10b981',
    stroke: props.stroke || '#059669',
    stroke_width: typeof props.stroke_width === 'number' ? Math.round(props.stroke_width) : 2,
    styleurl: props.styleurl || '#stylePUPTR',
    ordo_sungai: props.ordo_sungai || 'Ordo 1',
    lebar_sempadan: props.lebar_sempadan || 15,
    updated_at: new Date().toISOString(),
    created_at: props.created_at || new Date().toISOString()
  };

  if (!allowedCols) {
    return {
      id: finalId,
      name: candidateValues.name,
      geom: geom,
      updated_at: candidateValues.updated_at
    };
  }

  // Filter HANYA kolom yang sah dan ada pada tabel
  const cleanRow: Record<string, any> = {};
  for (const col of allowedCols) {
    if (candidateValues[col] !== undefined) {
      cleanRow[col] = candidateValues[col];
    }
  }

  if (allowedCols.includes('geom') && !cleanRow.geom) {
    cleanRow.geom = geom;
  }
  if (allowedCols.includes('id') && cleanRow.id === undefined) {
    cleanRow.id = finalId;
  }

  return cleanRow;
}

/**
 * Robust Utility Function: syncSpatialDataToSupabase
 */
export async function syncSpatialDataToSupabase(
  arg1: string | SpatialSyncPayload,
  arg2?: any,
  arg3?: SpatialSyncOptions
): Promise<SpatialSyncResult> {
  let tableName: string = 'gis_zonasi';
  let geojsonData: any = null;
  let featureId: string | number | undefined;
  let properties: Record<string, any> = {};
  let userId: string = 'Operator PUPTR';
  let layerId: string | undefined;
  let skipRestProxy = false;

  if (typeof arg1 === 'string') {
    tableName = arg1;
    geojsonData = arg2;
    if (arg3) {
      featureId = arg3.featureId;
      properties = arg3.properties || {};
      userId = arg3.userId || userId;
      layerId = arg3.layerId;
      skipRestProxy = Boolean(arg3.skipRestProxy);
    }
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    tableName = arg1.tableName || tableName;
    geojsonData = arg1.geojsonData;
    featureId = arg1.featureId;
    properties = arg1.properties || {};
    userId = arg1.userId || userId;
    layerId = arg1.layerId;
    skipRestProxy = Boolean(arg1.skipRestProxy);
  }

  console.log(`[spatialSyncService] 🚀 Memulai sinkronisasi spasial ke tabel PostGIS: "${tableName}"...`);

  try {
    if (!geojsonData) {
      const err = new Error(`Data geometri GeoJSON kosong untuk tabel "${tableName}".`);
      console.error(`[spatialSyncService] ❌ ${err.message}`);
      return {
        success: false,
        featureId: featureId || 'N/A',
        tableName,
        message: err.message,
        error: err
      };
    }

    // 1. Normalisasi dan kalkulasi metrik GeoJSON OGC
    const normalizedFeature = normalizeSpatialFeature(geojsonData, properties);
    const resolvedId = resolveFeatureId(featureId || normalizedFeature.id, tableName);
    normalizedFeature.id = resolvedId;

    const { areaHa, lengthKm, geomType } = normalizedFeature.metrics;

    // 2. Pemetaan kolom spesifik dengan Whitelist Skema Tabel PostGIS
    const dbRowPayload = formatRowForSpatialTable(tableName, normalizedFeature, properties);

    console.log(`[spatialSyncService] 📦 Payload upsert terformat untuk "${tableName}" [ID: ${resolvedId}]:`, Object.keys(dbRowPayload));

    // 3. Eksekusi UPSERT ke database Supabase
    let saveSuccess = false;
    let finalError: any = null;
    let returnedData: any = null;

    // Jalur A: Direct Supabase Client
    try {
      const { data, error } = await supabase
        .from(tableName)
        .upsert(dbRowPayload, { onConflict: 'id' })
        .select();

      if (error) {
        finalError = new Error(`Supabase Error: ${error.message}`);
        console.warn(`[spatialSyncService] Direct client upsert warning:`, error.message);
      } else if (!data || data.length === 0) {
        // KRITIS: Mencegah False-Positive saat RLS memblokir update (0 rows affected)
        finalError = new Error(`Gagal memperbarui database! Akses ditolak RLS atau ID ${resolvedId} tidak ditemukan di database.`);
        console.warn(`[spatialSyncService] Direct client upsert returned 0 rows affected (RLS blocked).`);
      } else {
        saveSuccess = true;
        returnedData = data[0];
      }
    } catch (clientErr: any) {
      finalError = clientErr;
    }

    // Jalur B: Backend API Proxy (service role bypass jika RLS / schema cache menolak)
    if (!saveSuccess) {
      console.log(`[spatialSyncService] 🔄 Mengalihkan ke backend proxy service role (/api/spatial-tables/${tableName}/upsert)...`);
      try {
        const proxyRes = await fetch(`/api/spatial-tables/${tableName}/upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: [dbRowPayload] })
        });
        const proxyJson = await proxyRes.json();
        if (proxyRes.ok && proxyJson.success && proxyJson.data && proxyJson.data.length > 0) {
          saveSuccess = true;
          finalError = null;
          returnedData = proxyJson.data[0];
        } else {
          finalError = new Error(proxyJson.error || `Gagal memperbarui database via server proxy! Akses ditolak RLS atau 0 baris terpengaruh.`);
        }
      } catch (proxyEx: any) {
        finalError = proxyEx;
      }
    }

    if (!saveSuccess) {
      throw finalError || new Error(`Gagal memperbarui database! Akses ditolak RLS atau ID ${resolvedId} tidak ditemukan di database.`);
    }

    // 4. Bersihkan Cache Memori Lokal
    clearLayerDataCache(tableName);
    if (layerId) {
      clearLayerDataCache(layerId);
    }

    // 5. Sinkronisasi REST Backend Layers Cache (Non-blocking)
    if (!skipRestProxy) {
      const targetLayerId = layerId || tableName;
      fetch(`/api/spatial-layers/${targetLayerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetLayerId,
          user: userId,
          geojson: {
            type: 'FeatureCollection',
            features: [normalizedFeature]
          }
        })
      }).catch(err => {
        console.warn(`[spatialSyncService] REST proxy sync warning (non-blocking):`, err.message);
      });
    }

    console.log(`[spatialSyncService] ✅ Berhasil meng-upsert geometri ke "${tableName}" [ID: ${resolvedId}]`);

    return {
      success: true,
      featureId: resolvedId,
      tableName,
      message: `Geometri [${geomType}] berhasil disimpan dan disinkronkan ke tabel "${tableName}" (${areaHa > 0 ? `${areaHa} Ha` : `${lengthKm} km`}).`,
      metrics: { areaHa, lengthKm, geomType },
      data: returnedData || dbRowPayload
    };

  } catch (err: any) {
    console.error(`[spatialSyncService] 💥 Fatal Exception pada syncSpatialDataToSupabase ("${tableName}"):`, err);
    return {
      success: false,
      featureId: featureId || 'N/A',
      tableName,
      message: err.message || 'Terjadi kesalahan sistem saat menyimpan data spasial ke Supabase.',
      error: err
    };
  }
}

/**
 * Batch Sync Function: batchSyncSpatialDataToSupabase
 * Mengunggah sekumpulan fitur spasial secara masal ke PostGIS Supabase dengan safe chunking
 */
export async function batchSyncSpatialDataToSupabase(
  tableName: string,
  features: any[],
  options?: {
    mode?: 'REPLACE' | 'APPEND';
    layerId?: string;
    onProgress?: (pct: number, processed: number, total: number) => void;
  }
): Promise<{
  success: boolean;
  count: number;
  message: string;
  errors?: string[];
}> {
  const mode = options?.mode || 'APPEND';
  const layerId = options?.layerId || tableName;
  const onProgress = options?.onProgress;

  if (!features || !Array.isArray(features) || features.length === 0) {
    return {
      success: false,
      count: 0,
      message: 'Tidak ada fitur spasial yang valid untuk diunggah.'
    };
  }

  console.log(`[spatialSyncService] 🚀 Memulai Batch Sync (${mode}) ${features.length} fitur ke "${tableName}"...`);

  try {
    // 1. Jika mode REPLACE: Hapus seluruh data lama di tabel target terlebih dahulu
    if (mode === 'REPLACE') {
      console.log(`[spatialSyncService] 🗑️ Mode REPLACE: Mengosongkan seluruh data lama pada tabel "${tableName}"...`);
      const tableConfig = KNOWN_SPATIAL_TABLES[tableName];
      const pkType = tableConfig?.pkType || (tableName === 'gis_sungai' ? 'uuid' : 'int4');

      try {
        if (pkType === 'int4') {
          await supabase.from(tableName).delete().neq('id', -999999);
        } else if (pkType === 'uuid') {
          await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } else {
          await supabase.from(tableName).delete().neq('id', '___nonexistent___');
        }
      } catch (delErr: any) {
        console.warn(`[spatialSyncService] Direct delete warning on REPLACE:`, delErr);
      }

      // Bersihkan juga cache lokal browser
      try {
        localStorage.removeItem(`luwu_spatial_layer_${layerId}`);
        localStorage.removeItem(`luwu_spatial_layer_${tableName}`);
      } catch {}
    }

    // 2. Format dan sanitasi setiap fitur sesuai whitelist kolom PostgreSQL PostGIS
    const formattedRows: Record<string, any>[] = [];
    const baseIdOffset = Date.now() % 100000000;

    for (let idx = 0; idx < features.length; idx++) {
      const rawFeat = features[idx];
      const normFeat = normalizeSpatialFeature(rawFeat, rawFeat.properties || {});
      
      // Jika APPEND atau fitur baru tanpa ID kanonik, pastikan ID unik bertahap
      if (mode === 'APPEND' && !normFeat.properties.id) {
        normFeat.id = baseIdOffset + idx + 1;
        normFeat.properties.id = normFeat.id;
      }

      const row = formatRowForSpatialTable(tableName, normFeat, normFeat.properties);
      if (row && row.geom) {
        formattedRows.push(row);
      }
    }

    if (formattedRows.length === 0) {
      throw new Error('Tidak ada baris dengan geometri valid yang berhasil diformat.');
    }

    // 3. Batch Chunking sekuensial (50 baris per iterasi untuk stabilitas PostgREST)
    const CHUNK_SIZE = 50;
    const totalChunks = Math.ceil(formattedRows.length / CHUNK_SIZE);
    let successfullyInserted = 0;
    const errors: string[] = [];

    for (let c = 0; c < totalChunks; c++) {
      const chunk = formattedRows.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
      let chunkSuccess = false;

      // Jalur A: Direct Supabase Client Upsert / Insert
      try {
        const { data, error } = await supabase
          .from(tableName)
          .upsert(chunk, { onConflict: 'id' })
          .select('id');

        if (!error && data && data.length > 0) {
          chunkSuccess = true;
          successfullyInserted += data.length;
        } else if (error) {
          console.warn(`[spatialSyncService] Direct batch chunk ${c + 1} warning:`, error.message);
        }
      } catch (clientErr: any) {
        console.warn(`[spatialSyncService] Direct batch chunk ${c + 1} exception:`, clientErr);
      }

      // Jalur B: Backend API Service Role Proxy Fallback
      if (!chunkSuccess) {
        try {
          const proxyRes = await fetch(`/api/spatial-tables/${tableName}/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: chunk })
          });
          if (proxyRes.ok) {
            const proxyJson = await proxyRes.json();
            if (proxyJson.success && proxyJson.data) {
              chunkSuccess = true;
              successfullyInserted += proxyJson.data.length || chunk.length;
            }
          }
        } catch (proxyErr: any) {
          console.warn(`[spatialSyncService] Proxy batch chunk ${c + 1} exception:`, proxyErr);
        }
      }

      if (!chunkSuccess) {
        errors.push(`Chunk ${c + 1}/${totalChunks} gagal diunggah.`);
      }

      // Laporkan progress ke callback UI
      const processedCount = Math.min((c + 1) * CHUNK_SIZE, formattedRows.length);
      const progressPct = Math.round((processedCount / formattedRows.length) * 100);
      if (onProgress) {
        onProgress(progressPct, processedCount, formattedRows.length);
      }
    }

    // 4. Bersihkan Cache Memori & Cache Server Backend
    clearLayerDataCache(tableName);
    if (layerId) clearLayerDataCache(layerId);

    try {
      fetch(`/api/spatial/purge-cache?table=${encodeURIComponent(tableName)}`, {
        method: 'POST'
      }).catch(() => {});
    } catch {}

    console.log(`[spatialSyncService] ✅ Selesai Batch Sync: ${successfullyInserted}/${formattedRows.length} berhasil di-insert.`);

    return {
      success: successfullyInserted > 0,
      count: successfullyInserted,
      message: `Berhasil mengimpor ${successfullyInserted} dari ${formattedRows.length} fitur spasial ke "${tableName}".`,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (err: any) {
    console.error(`[spatialSyncService] 💥 Fatal Exception pada batchSyncSpatialDataToSupabase:`, err);
    return {
      success: false,
      count: 0,
      message: err?.message || 'Terjadi kesalahan sistem saat mengeksekusi Batch Sync.',
      errors: [err?.message || 'Unknown error']
    };
  }
}

/**
 * Fungsi utilitas untuk menghapus fitur spasial dari tabel Supabase
 */
export async function deleteSpatialDataFromSupabase(
  featureId: string | number,
  tableName: string = 'gis_zonasi'
): Promise<{ success: boolean; message: string }> {
  try {
    const resolvedId = resolveFeatureId(featureId, tableName);
    console.log(`[spatialSyncService] 🗑️ Menghapus fitur ${resolvedId} dari ${tableName}...`);

    let deleted = false;

    // Jalur 1: Backend service role proxy
    try {
      const proxyRes = await fetch(`/api/spatial-tables/${tableName}/delete/${encodeURIComponent(String(resolvedId))}`, {
        method: 'DELETE'
      });
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.success) deleted = true;
      }
    } catch (proxyErr) {
      console.warn(`[spatialSyncService] Proxy delete warning:`, proxyErr);
    }

    // Jalur 2: Direct Supabase Client
    if (!deleted) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', resolvedId);

      if (error) {
        console.warn(`[spatialSyncService] Direct delete warning:`, error.message);
      }
    }

    clearLayerDataCache(tableName);
    return { success: true, message: `Fitur ${resolvedId} berhasil dihapus dari tabel ${tableName}.` };
  } catch (err: any) {
    console.error(`[spatialSyncService] ❌ Gagal menghapus fitur spasial:`, err);
    return { success: false, message: err.message || 'Gagal menghapus fitur spasial.' };
  }
}

/**
 * Utilitas untuk membersihkan baris duplikat di PostGIS
 */
export async function cleanupDuplicateSpatialFeatures(
  tableName: string,
  featureName: string,
  keepId?: string | number
): Promise<{ success: boolean; kept?: any; deleted?: any[] }> {
  try {
    const res = await fetch(`/api/spatial-tables/${tableName}/cleanup-duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: featureName, keepId })
    });
    if (res.ok) {
      return await res.json();
    }
    return { success: false };
  } catch (e) {
    return { success: false };
  }
}
