import * as turf from '@turf/turf';
import type { Feature, Geometry, Polygon, MultiPolygon, Point, FeatureCollection } from 'geojson';
import { supabase, safeFetchLayerData } from '../lib/supabaseClient';
import { normalizeGeoJSON } from './geoUtils';
import { getKecamatanLabel, getDesaLabel, getKecamatanId, getDesaId } from './gisHelpers';

export interface SpatialOverlapResult {
  kecamatan_id?: string | number;
  nama_kecamatan?: string;
  desa_id?: string | number;
  nama_desa?: string;
  persentase_overlap?: number;
  [key: string]: any;
}

export interface SpatialAdminDetection {
  success: boolean;
  kecamatanName: string;
  kecamatanRaw: string;
  kecamatanId: string;
  desaName: string;
  desaRaw: string;
  desaId: string;
  desaListForKecamatan: any[];
  isLocked: boolean;
  source: 'postgis_rpc' | 'gis_desa' | 'gis_kecamatan' | 'intersection' | 'nearest' | 'none';
  message: string;
  detectedPoint?: [number, number];
  overlapPercentage?: number;
  multiOverlapList?: SpatialOverlapResult[];
}

// In-memory cache for GIS boundary layers
let cachedKecamatanFC: FeatureCollection | null = null;
let cachedDesaFC: FeatureCollection | null = null;
let isPreloading = false;

/**
 * Preloads both Kecamatan and Desa GIS boundary layers in background
 */
export async function preloadAdministrativeLayers(): Promise<{
  kecamatan: FeatureCollection;
  desa: FeatureCollection;
}> {
  if (cachedKecamatanFC && cachedDesaFC) {
    return { kecamatan: cachedKecamatanFC, desa: cachedDesaFC };
  }

  if (isPreloading) {
    // Wait for in-flight preloading
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (cachedKecamatanFC && cachedDesaFC) {
      return { kecamatan: cachedKecamatanFC, desa: cachedDesaFC };
    }
  }

  isPreloading = true;
  try {
    const [kecData, desaData] = await Promise.all([
      safeFetchLayerData('gis_kecamatan'),
      safeFetchLayerData('gis_desa')
    ]);

    cachedKecamatanFC = normalizeGeoJSON(kecData);
    cachedDesaFC = normalizeGeoJSON(desaData);

    return {
      kecamatan: cachedKecamatanFC,
      desa: cachedDesaFC
    };
  } catch (err) {
    console.warn('[spatialLookup] Failed to preload layers from Supabase, attempting static fetch:', err);
    try {
      const [kecRes, desaRes] = await Promise.all([
        fetch('/gis_kecamatan.json'),
        fetch('/gis_desa.json')
      ]);
      if (kecRes.ok) cachedKecamatanFC = await kecRes.json();
      if (desaRes.ok) cachedDesaFC = await desaRes.json();
    } catch (staticErr) {
      console.error('[spatialLookup] Static fallback also failed:', staticErr);
    }
    return {
      kecamatan: cachedKecamatanFC || { type: 'FeatureCollection', features: [] },
      desa: cachedDesaFC || { type: 'FeatureCollection', features: [] }
    };
  } finally {
    isPreloading = false;
  }
}

/**
 * Clean and normalize district (Kecamatan) name strings
 */
export function cleanKecamatanName(name?: string): string {
  if (!name) return "";
  return String(name)
    .replace(/^kec\.?\s*/i, "")
    .replace(/^kecamatan\s*/i, "")
    .trim();
}

/**
 * Clean and normalize village (Desa/Kelurahan) name strings
 */
export function cleanDesaName(name?: string): string {
  if (!name) return "";
  return String(name)
    .replace(/^desa\s*/i, "")
    .replace(/^kel\.?\s*/i, "")
    .replace(/^kelurahan\s*/i, "")
    .trim();
}

/**
 * Detects Kecamatan and Desa from a spatial polygon or coordinate.
 * Uses topological point-in-polygon, centroid, vertex sampling, and polygon intersection.
 */
export async function detectAdministrativeLocation(
  geometryInput: any,
  providedKecamatanList?: any[],
  providedDesaList?: any[]
): Promise<SpatialAdminDetection> {
  const fallbackResult: SpatialAdminDetection = {
    success: false,
    kecamatanName: "",
    kecamatanRaw: "",
    kecamatanId: "",
    desaName: "",
    desaRaw: "",
    desaId: "",
    desaListForKecamatan: [],
    isLocked: false,
    source: "none",
    message: "Lokasi di luar batas administratif Kabupaten Luwu atau tidak ditemukan."
  };

  if (!geometryInput) return fallbackResult;

  // 1. Normalize input into a GeoJSON Feature
  let targetFeature: Feature<Geometry> | null = null;
  if (geometryInput.type === 'Feature') {
    targetFeature = geometryInput;
  } else if (geometryInput.type === 'FeatureCollection' && geometryInput.features?.length > 0) {
    targetFeature = geometryInput.features[0];
  } else if (geometryInput.coordinates && typeof geometryInput.type === 'string') {
    targetFeature = {
      type: 'Feature',
      properties: {},
      geometry: geometryInput
    };
  } else if (Array.isArray(geometryInput) && geometryInput.length >= 2) {
    // Array coordinate [lng, lat]
    targetFeature = turf.point([Number(geometryInput[0]), Number(geometryInput[1])]);
  }

  if (!targetFeature || !targetFeature.geometry) {
    return fallbackResult;
  }

  const parsedGeometry = targetFeature.geometry;

  // ── 1. PRIMARY: DIRECT POSTGIS SUPABASE RPC (detect_wilayah_overlap) ──
  try {
    const { data, error } = await supabase.rpc('detect_wilayah_overlap', {
      user_geojson: parsedGeometry
    });

    if (error) {
      console.error('[Spatial Auto-Detect] Error executing RPC detect_wilayah_overlap:', error.message);
      // Try secondary legacy RPC detect_wilayah_from_geojson if available
      try {
        const { data: rpcRows, error: rpcErr } = await supabase.rpc('detect_wilayah_from_geojson', {
          user_geojson: parsedGeometry
        });
        if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
          const row = rpcRows[0];
          const rpcKec = cleanKecamatanName(row.nama_kecamatan);
          const rpcDesa = cleanDesaName(row.nama_desa);
          if (rpcKec || rpcDesa) {
            return {
              success: true,
              kecamatanName: rpcKec,
              kecamatanRaw: row.nama_kecamatan || "",
              kecamatanId: String(row.kecamatan_id || getKecamatanId(rpcKec) || ""),
              desaName: rpcDesa,
              desaRaw: row.nama_desa || "",
              desaId: String(row.desa_id || getDesaId(rpcDesa) || ""),
              desaListForKecamatan: [],
              isLocked: true,
              source: 'postgis_rpc',
              overlapPercentage: 100,
              message: `Terdeteksi otomatis via Supabase PostGIS RPC (Kec. ${rpcKec}${rpcDesa ? `, Desa ${rpcDesa}` : ''})`
            };
          }
        }
      } catch {}
    } else if (Array.isArray(data)) {
      if (data.length === 0) {
        console.warn('[Spatial Auto-Detect] 0 rows returned: polygon is outside Luwu admin bounds.');
        return {
          success: false,
          kecamatanName: "",
          kecamatanRaw: "",
          kecamatanId: "",
          desaName: "",
          desaRaw: "",
          desaId: "",
          desaListForKecamatan: [],
          isLocked: false,
          source: "postgis_rpc",
          overlapPercentage: 0,
          multiOverlapList: [],
          message: "Lokasi polygon KML berada di luar cakupan wilayah administrative Kabupaten Luwu."
        };
      }

      // Top match with highest percentage overlap
      const topMatch = data[0];
      console.log('[Spatial Auto-Detect] Match found:', topMatch);

      const rawKecName = topMatch.nama_kecamatan || topMatch.kecamatan || String(topMatch.kecamatan_id || "");
      const rawDesaName = topMatch.nama_desa || topMatch.desa || String(topMatch.desa_id || "");
      const cleanKec = cleanKecamatanName(rawKecName);
      const cleanDesa = cleanDesaName(rawDesaName);
      const overlapPct = Number(topMatch.persentase_overlap !== undefined ? topMatch.persentase_overlap : 100);

      // Extract centroid point for map animation if needed
      let detectedPt: [number, number] | undefined = undefined;
      try {
        const c = turf.centroid(targetFeature);
        if (c?.geometry?.coordinates) detectedPt = c.geometry.coordinates as [number, number];
      } catch {}

      // Informative user message
      let message = `Terdeteksi otomatis di Desa ${cleanDesa || rawDesaName}, Kec. ${cleanKec || rawKecName} (Overlap: ${overlapPct.toFixed(1)}%)`;
      if (data.length > 1) {
        const secondary = data.slice(1).map((d: any) => `${cleanDesaName(d.nama_desa || d.desa)} (${Number(d.persentase_overlap || 0).toFixed(1)}%)`).join(', ');
        message += `. Polygon melintasi ${data.length} desa (Utama: Desa ${cleanDesa || rawDesaName} ${overlapPct.toFixed(1)}%, Sekunder: ${secondary})`;
      }

      return {
        success: true,
        kecamatanName: cleanKec,
        kecamatanRaw: rawKecName || `Kecamatan ${cleanKec}`,
        kecamatanId: String(topMatch.kecamatan_id || ""),
        desaName: cleanDesa,
        desaRaw: rawDesaName || `Desa ${cleanDesa}`,
        desaId: String(topMatch.desa_id || ""),
        desaListForKecamatan: [],
        isLocked: true,
        source: "postgis_rpc",
        overlapPercentage: overlapPct,
        multiOverlapList: data,
        detectedPoint: detectedPt,
        message
      };
    }
  } catch (rpcErr: any) {
    console.warn('[Spatial Auto-Detect] PostGIS RPC failed or unavailable, falling back to local topology:', rpcErr);
  }

  // ── 2. SECONDARY / OFFLINE FALLBACK: CLIENT-SIDE TURF.JS TOPOLOGICAL DETECTION ──
  // 2. Prepare test points and polygon feature
  const testPoints: Feature<Point>[] = [];
  let polygonFeature: Feature<Polygon | MultiPolygon> | null = null;

  try {
    if (targetFeature.geometry.type === 'Point') {
      testPoints.push(targetFeature as Feature<Point>);
    } else if (
      targetFeature.geometry.type === 'Polygon' ||
      targetFeature.geometry.type === 'MultiPolygon'
    ) {
      polygonFeature = targetFeature as Feature<Polygon | MultiPolygon>;

      // A. Point on Feature (Guaranteed to be inside polygon boundary)
      try {
        const pof = turf.pointOnFeature(targetFeature);
        if (pof && pof.geometry?.coordinates) testPoints.push(pof);
      } catch (e) {}

      // B. Centroid
      try {
        const c = turf.centroid(targetFeature);
        if (c && c.geometry?.coordinates) testPoints.push(c);
      } catch (e) {}

      // C. Center of Mass
      try {
        const com = turf.centerOfMass(targetFeature);
        if (com && com.geometry?.coordinates) testPoints.push(com);
      } catch (e) {}

      // D. First 3 coordinates of exterior ring
      const geomCoords = targetFeature.geometry.coordinates;
      if (Array.isArray(geomCoords) && geomCoords.length > 0) {
        const ring = targetFeature.geometry.type === 'Polygon'
          ? (geomCoords[0] as number[][])
          : (geomCoords[0]?.[0] as number[][]);

        if (Array.isArray(ring)) {
          for (let i = 0; i < Math.min(3, ring.length); i++) {
            const pt = ring[i];
            if (Array.isArray(pt) && pt.length >= 2) {
              testPoints.push(turf.point([pt[0], pt[1]]));
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[spatialLookup] Error preparing test points:', e);
  }

  if (testPoints.length === 0 && !polygonFeature) {
    return fallbackResult;
  }

  // 3. Ensure layers are loaded
  let desaFC = cachedDesaFC;
  let kecFC = cachedKecamatanFC;

  if (!desaFC || !kecFC || desaFC.features.length === 0 || kecFC.features.length === 0) {
    const preloaded = await preloadAdministrativeLayers();
    desaFC = preloaded.desa;
    kecFC = preloaded.kecamatan;
  }

  // Fallback to provided arrays if needed
  const desaFeatures: Feature[] = (desaFC && desaFC.features && desaFC.features.length > 0)
    ? (desaFC.features as Feature[])
    : (providedDesaList || []).map((d: any) => ({
        type: 'Feature' as const,
        properties: d,
        geometry: d.geometry || d.geom || d.geojson?.geometry || d.geojson
      })).filter((f: any) => f.geometry) as Feature[];

  const kecFeatures: Feature[] = (kecFC && kecFC.features && kecFC.features.length > 0)
    ? (kecFC.features as Feature[])
    : (providedKecamatanList || []).map((k: any) => ({
        type: 'Feature' as const,
        properties: k,
        geometry: k.geometry || k.geom || k.geojson?.geometry || k.geojson
      })).filter((f: any) => f.geometry) as Feature[];

  let matchedDesaFeature: Feature | null = null;
  let matchedKecFeature: Feature | null = null;
  let detectedPointUsed: [number, number] | undefined = undefined;
  let detectionSource: SpatialAdminDetection['source'] = 'none';

  // 4. STEP 1: Search in Desa (Village) layer
  for (const pt of testPoints) {
    for (const df of desaFeatures) {
      if (df.geometry && (df.geometry.type === 'Polygon' || df.geometry.type === 'MultiPolygon')) {
        try {
          if (turf.booleanPointInPolygon(pt, df as Feature<Polygon | MultiPolygon>)) {
            matchedDesaFeature = df;
            detectedPointUsed = pt.geometry.coordinates as [number, number];
            detectionSource = 'gis_desa';
            break;
          }
        } catch (e) {}
      }
    }
    if (matchedDesaFeature) break;
  }

  // If no point match on Desa, try polygon intersection
  if (!matchedDesaFeature && polygonFeature) {
    for (const df of desaFeatures) {
      if (df.geometry && (df.geometry.type === 'Polygon' || df.geometry.type === 'MultiPolygon')) {
        try {
          if (turf.booleanIntersects(polygonFeature, df as Feature<Polygon | MultiPolygon>)) {
            matchedDesaFeature = df;
            detectionSource = 'intersection';
            break;
          }
        } catch (e) {}
      }
    }
  }

  // 5. STEP 2: Search in Kecamatan (District) layer
  for (const pt of testPoints) {
    for (const kf of kecFeatures) {
      if (kf.geometry && (kf.geometry.type === 'Polygon' || kf.geometry.type === 'MultiPolygon')) {
        try {
          if (turf.booleanPointInPolygon(pt, kf as Feature<Polygon | MultiPolygon>)) {
            matchedKecFeature = kf;
            if (!detectedPointUsed) detectedPointUsed = pt.geometry.coordinates as [number, number];
            if (detectionSource === 'none') detectionSource = 'gis_kecamatan';
            break;
          }
        } catch (e) {}
      }
    }
    if (matchedKecFeature) break;
  }

  if (!matchedKecFeature && polygonFeature) {
    for (const kf of kecFeatures) {
      if (kf.geometry && (kf.geometry.type === 'Polygon' || kf.geometry.type === 'MultiPolygon')) {
        try {
          if (turf.booleanIntersects(polygonFeature, kf as Feature<Polygon | MultiPolygon>)) {
            matchedKecFeature = kf;
            if (detectionSource === 'none') detectionSource = 'intersection';
            break;
          }
        } catch (e) {}
      }
    }
  }

  // 6. Extract raw & cleaned properties
  let rawKecName = "";
  let kecId = "";
  let rawDesaName = "";
  let desaId = "";

  if (matchedDesaFeature) {
    const dp = matchedDesaFeature.properties || {};
    rawDesaName = dp.nama_desa || dp.name || dp.desa || dp.NAMA_DESA || "";
    desaId = String(dp.id || dp.ID_DESA || dp.id_desa || "");
    
    // Desa property often contains Kecamatan name (e.g., "Kec. Bua")
    rawKecName = dp.kecamatan || dp.nama_kecamatan || dp.KECAMATAN || "";
    if (dp.id_kecamatan) {
      kecId = String(dp.id_kecamatan);
    }
  }

  if (matchedKecFeature) {
    const kp = matchedKecFeature.properties || {};
    if (!rawKecName) {
      rawKecName = kp.name || kp.kecamatan || kp.nama_kecamatan || kp.KECAMATAN || "";
    }
    if (!kecId) {
      kecId = String(kp.id || kp.id_kecamatan || kp.ID_KEC || "");
    }
  }

  const cleanKec = cleanKecamatanName(rawKecName);
  const cleanDesa = cleanDesaName(rawDesaName);

  if (!cleanKec && !cleanDesa) {
    return fallbackResult;
  }

  // 7. Extract matching village list for this Kecamatan
  let filteredDesaList: any[] = [];
  if (desaFeatures.length > 0 && (cleanKec || kecId)) {
    filteredDesaList = desaFeatures
      .filter((df) => {
        const p = df.properties || {};
        const pKec = cleanKecamatanName(p.kecamatan || p.nama_kecamatan || p.KECAMATAN || "");
        const pKecId = String(p.id_kecamatan || p.ID_KEC || "");
        return (cleanKec && pKec.toLowerCase() === cleanKec.toLowerCase()) || (kecId && pKecId === kecId);
      })
      .map((df) => ({
        id: df.properties?.id || df.properties?.ID_DESA || df.properties?.nama_desa,
        nama_desa: df.properties?.nama_desa || df.properties?.name || df.properties?.desa,
        desa: df.properties?.nama_desa || df.properties?.name || df.properties?.desa,
        name: df.properties?.nama_desa || df.properties?.name || df.properties?.desa,
        id_kecamatan: df.properties?.id_kecamatan,
        kecamatan: df.properties?.kecamatan,
        geom: df.geometry,
        geometry: df.geometry
      }));
  }

  return {
    success: true,
    kecamatanName: cleanKec,
    kecamatanRaw: rawKecName || `Kecamatan ${cleanKec}`,
    kecamatanId: kecId,
    desaName: cleanDesa,
    desaRaw: rawDesaName || `Desa ${cleanDesa}`,
    desaId: desaId,
    desaListForKecamatan: filteredDesaList,
    isLocked: true,
    source: detectionSource,
    detectedPoint: detectedPointUsed,
    message: `Poligon terdeteksi berada di wilayah Kecamatan ${cleanKec}${cleanDesa ? `, Desa/Kelurahan ${cleanDesa}` : ''}. Wilayah dikunci otomatis (read-only) untuk integritas spasial.`
  };
}
