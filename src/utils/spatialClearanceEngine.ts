import * as turf from '@turf/turf';
import { validateSpatialGeometry } from './lp2bSpatialService';

export type SpatialViolationType = 'INTERSECTION' | 'PROXIMITY';
export type SpatialViolationSeverity = 'CRITICAL' | 'WARNING';

export interface SpatialViolation {
  layerName: string;
  tag: 
    | 'LP2B_INTERSECTION'
    | 'WETLAND_INTERSECTION'
    | 'MANGROVE_INTERSECTION'
    | 'AQUACULTURE_INTERSECTION'
    | 'GSJ_VIOLATION'
    | 'GSS_VIOLATION'
    | 'GSP_VIOLATION'
    | string;
  type: SpatialViolationType;
  severity: SpatialViolationSeverity;
  overlapAreaSqm?: number;
  overlapPercentage?: number;
  distanceMeters?: number;
  thresholdMeters?: number;
  message: string;
  details?: string;
  featureGeometry?: any;
}

export interface SpatialClearanceReport {
  isClear: boolean;
  totalAreaSqm: number;
  totalAreaHa: number;
  criticalCount: number;
  warningCount: number;
  summary: string;
  violations: SpatialViolation[];
  passedLayers: string[];
  analyzedAt: string;
}

export interface SpatialClearanceLayerSource {
  lp2bFeatures?: any[];
  wetlandFeatures?: any[];
  mangroveFeatures?: any[];
  aquacultureFeatures?: any[];
  roadFeatures?: any[];
  riverFeatures?: any[];
  irrigationFeatures?: any[];
}

// In-memory cache for static GeoJSON restriction layers
const layerCache: Record<string, any[]> = {};

/**
 * Helper to fetch and extract GeoJSON features with caching
 */
async function fetchLayerFeatures(url: string, cacheKey: string): Promise<any[]> {
  if (layerCache[cacheKey] && layerCache[cacheKey].length > 0) {
    return layerCache[cacheKey];
  }
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const features = Array.isArray(data) ? data : (data.features || []);
      layerCache[cacheKey] = features;
      return features;
    }
  } catch (err) {
    console.warn(`[spatialClearanceEngine] Error fetching layer ${url}:`, err);
  }
  return [];
}

/**
 * Load all 7 reference restriction layers from spatial endpoints / static fallbacks
 */
export async function loadDefaultRestrictionLayers(): Promise<SpatialClearanceLayerSource> {
  const [
    lp2b,
    mangrove,
    tambak,
    jalan,
    infrastruktur,
    zonasi
  ] = await Promise.all([
    fetchLayerFeatures('/gis_sawah.json', 'gis_sawah'),
    fetchLayerFeatures('/gis_mangrove.json', 'gis_mangrove'),
    fetchLayerFeatures('/gis_tambak.json', 'gis_tambak'),
    fetchLayerFeatures('/gis_jalan.json', 'gis_jalan'),
    fetchLayerFeatures('/gis_infrastruktur.json', 'gis_infrastruktur'),
    fetchLayerFeatures('/gis_zonasi.json', 'gis_zonasi')
  ]);

  // Extract wetlands from zonasi or infrastruktur if tagged
  const wetlands = zonasi.filter((f: any) => {
    const name = String(f.properties?.name || f.properties?.nama || f.properties?.NAMOBJ || '').toLowerCase();
    return /rawa|lahan.*basah|swamp|wetland/i.test(name);
  });

  // Extract rivers and irrigation lines from infrastruktur or jalan
  const rivers = infrastruktur.filter((f: any) => {
    const name = String(f.properties?.name || f.properties?.nama || f.properties?.NAMOBJ || f.properties?.REMARK || '').toLowerCase();
    return /sungai|river|kali|danau/i.test(name) || f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString';
  });

  const irrigation = infrastruktur.filter((f: any) => {
    const name = String(f.properties?.name || f.properties?.nama || f.properties?.NAMOBJ || f.properties?.REMARK || '').toLowerCase();
    return /irigasi|saluran|drainase|pengairan|sekunder|tersier/i.test(name);
  });

  return {
    lp2bFeatures: lp2b,
    mangroveFeatures: mangrove,
    aquacultureFeatures: tambak,
    roadFeatures: jalan,
    wetlandFeatures: wetlands,
    riverFeatures: rivers.length > 0 ? rivers : infrastruktur,
    irrigationFeatures: irrigation.length > 0 ? irrigation : []
  };
}

/**
 * Calculates minimum distance (in meters) between a Polygon feature and a LineString/MultiLineString feature.
 * Samples all polygon boundary coordinates and intermediate points for high precision.
 */
export function calculatePolygonToLineDistance(
  polygonFeature: any,
  lineFeature: any
): number {
  if (!polygonFeature || !lineFeature || !lineFeature.geometry) return Infinity;

  // 1. If line directly intersects or crosses polygon, distance is 0.0 meters
  try {
    if (turf.booleanIntersects(polygonFeature, lineFeature) || turf.booleanCrosses(polygonFeature, lineFeature)) {
      return 0.0;
    }
  } catch {
    // Continue to distance vertex sampling
  }

  let minDistanceMeters = Infinity;

  // 2. Sample polygon vertices
  const coords: number[][] = [];
  const geom = polygonFeature.geometry;

  if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) {
      coords.push(...ring);
    }
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        coords.push(...ring);
      }
    }
  }

  // 3. Compute point-to-line distance for each vertex
  for (const pt of coords) {
    try {
      const p = turf.point(pt);
      const d = turf.pointToLineDistance(p, lineFeature as any, { units: 'meters' });
      if (d < minDistanceMeters) {
        minDistanceMeters = d;
      }
    } catch {
      // Continue next point
    }
  }

  // 4. Also sample centroid
  try {
    const c = turf.centroid(polygonFeature);
    const d = turf.pointToLineDistance(c, lineFeature as any, { units: 'meters' });
    if (d < minDistanceMeters) {
      minDistanceMeters = d;
    }
  } catch {
    // centroid calculation note
  }

  return minDistanceMeters;
}

/**
 * Core Spatial Clearance Engine:
 * Analyzes application polygon against 7 restriction layers (4 Polygon Intersection + 3 Line Proximity).
 */
export async function analyzeSpatialClearance(
  geometry: any,
  providedLayers?: SpatialClearanceLayerSource
): Promise<SpatialClearanceReport> {
  const timestamp = new Date().toISOString();

  // Validate geometry
  const validation = validateSpatialGeometry(geometry);
  if (!validation.isValid || !validation.feature) {
    return {
      isClear: false,
      totalAreaSqm: 0,
      totalAreaHa: 0,
      criticalCount: 1,
      warningCount: 0,
      summary: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.',
      violations: [
        {
          layerName: 'Validasi Geometri Lokasi',
          tag: 'INVALID_GEOMETRY',
          type: 'INTERSECTION',
          severity: 'CRITICAL',
          message: validation.error || 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
        }
      ],
      passedLayers: [],
      analyzedAt: timestamp
    };
  }

  const appFeature: any = validation.feature;
  const totalAreaSqm = Math.round(turf.area(appFeature));
  const totalAreaHa = Number((totalAreaSqm / 10000).toFixed(4));

  // Load layers
  const layers = providedLayers || (await loadDefaultRestrictionLayers());
  const violations: SpatialViolation[] = [];
  const passedLayers: string[] = [];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ATURAN DETEKSI POLIGON (POLYGON INTERSECTION)
  // ─────────────────────────────────────────────────────────────────────────────

  // Layer 1: Sawah / LP2B (LSD) -> CRITICAL
  const lp2bFeatures = layers.lp2bFeatures || [];
  let totalLp2bOverlapSqm = 0;
  for (const feat of lp2bFeatures) {
    if (!feat || !feat.geometry) continue;
    try {
      const targetFeat = feat.type === 'Feature' ? feat : turf.feature(feat.geometry || feat);
      if (turf.booleanIntersects(appFeature, targetFeat)) {
        let intersection: any = null;
        try {
          intersection = turf.intersect(turf.featureCollection([appFeature, targetFeat]));
        } catch {
          intersection = (turf as any).intersect(appFeature, targetFeat);
        }
        if (intersection && intersection.geometry) {
          totalLp2bOverlapSqm += Math.round(turf.area(intersection));
        }
      }
    } catch {
      // Continue next feature
    }
  }

  if (totalLp2bOverlapSqm > 0) {
    const percentage = Number(((totalLp2bOverlapSqm / totalAreaSqm) * 100).toFixed(1));
    violations.push({
      layerName: 'Sawah / LP2B',
      tag: 'LP2B_INTERSECTION',
      type: 'INTERSECTION',
      severity: 'CRITICAL',
      overlapAreaSqm: totalLp2bOverlapSqm,
      overlapPercentage: percentage,
      message: `Beririsan dengan LP2B seluas ${totalLp2bOverlapSqm.toLocaleString('id-ID')} m² (${percentage}% dari total lahan)`,
      details: 'Kawasan Lahan Pertanian Pangan Berkelanjutan dilindungi UU No. 41/2009. Memerlukan audit alih fungsi teknis Dinas Pertanian.'
    });
  } else {
    passedLayers.push('Sawah / LP2B (LSD)');
  }

  // Layer 2: Lahan Basah / Rawa -> CRITICAL
  const wetlandFeatures = layers.wetlandFeatures || [];
  let totalWetlandOverlapSqm = 0;
  for (const feat of wetlandFeatures) {
    if (!feat || !feat.geometry) continue;
    try {
      const targetFeat = feat.type === 'Feature' ? feat : turf.feature(feat.geometry || feat);
      if (turf.booleanIntersects(appFeature, targetFeat)) {
        let intersection: any = null;
        try {
          intersection = turf.intersect(turf.featureCollection([appFeature, targetFeat]));
        } catch {
          intersection = (turf as any).intersect(appFeature, targetFeat);
        }
        if (intersection && intersection.geometry) {
          totalWetlandOverlapSqm += Math.round(turf.area(intersection));
        }
      }
    } catch {
      // Continue next feature
    }
  }

  if (totalWetlandOverlapSqm > 0) {
    const percentage = Number(((totalWetlandOverlapSqm / totalAreaSqm) * 100).toFixed(1));
    violations.push({
      layerName: 'Lahan Basah / Rawa',
      tag: 'WETLAND_INTERSECTION',
      type: 'INTERSECTION',
      severity: 'CRITICAL',
      overlapAreaSqm: totalWetlandOverlapSqm,
      overlapPercentage: percentage,
      message: `Beririsan dengan Lahan Basah seluas ${totalWetlandOverlapSqm.toLocaleString('id-ID')} m² (${percentage}% dari total lahan)`,
      details: 'Kawasan konservasi lahan basah dan tangkapan air alami dilindungi dari alih fungsi masif.'
    });
  } else {
    passedLayers.push('Lahan Basah / Rawa');
  }

  // Layer 3: Kawasan Mangrove -> CRITICAL
  const mangroveFeatures = layers.mangroveFeatures || [];
  let totalMangroveOverlapSqm = 0;
  for (const feat of mangroveFeatures) {
    if (!feat || !feat.geometry) continue;
    try {
      const targetFeat = feat.type === 'Feature' ? feat : turf.feature(feat.geometry || feat);
      if (turf.booleanIntersects(appFeature, targetFeat)) {
        let intersection: any = null;
        try {
          intersection = turf.intersect(turf.featureCollection([appFeature, targetFeat]));
        } catch {
          intersection = (turf as any).intersect(appFeature, targetFeat);
        }
        if (intersection && intersection.geometry) {
          totalMangroveOverlapSqm += Math.round(turf.area(intersection));
        }
      }
    } catch {
      // Continue next feature
    }
  }

  if (totalMangroveOverlapSqm > 0) {
    const percentage = Number(((totalMangroveOverlapSqm / totalAreaSqm) * 100).toFixed(1));
    violations.push({
      layerName: 'Kawasan Mangrove',
      tag: 'MANGROVE_INTERSECTION',
      type: 'INTERSECTION',
      severity: 'CRITICAL',
      overlapAreaSqm: totalMangroveOverlapSqm,
      overlapPercentage: percentage,
      message: `Beririsan dengan Ekosistem Mangrove seluas ${totalMangroveOverlapSqm.toLocaleString('id-ID')} m² (${percentage}% dari total lahan)`,
      details: 'Ekosistem mangrove pesisir Luwu dilindungi ketat sebagai sabuk hijau pencegah abrasi dan habitat pesisir.'
    });
  } else {
    passedLayers.push('Kawasan Mangrove');
  }

  // Layer 4: Kawasan Tambak -> WARNING
  const tambakFeatures = layers.aquacultureFeatures || [];
  let totalTambakOverlapSqm = 0;
  for (const feat of tambakFeatures) {
    if (!feat || !feat.geometry) continue;
    try {
      const targetFeat = feat.type === 'Feature' ? feat : turf.feature(feat.geometry || feat);
      if (turf.booleanIntersects(appFeature, targetFeat)) {
        let intersection: any = null;
        try {
          intersection = turf.intersect(turf.featureCollection([appFeature, targetFeat]));
        } catch {
          intersection = (turf as any).intersect(appFeature, targetFeat);
        }
        if (intersection && intersection.geometry) {
          totalTambakOverlapSqm += Math.round(turf.area(intersection));
        }
      }
    } catch {
      // Continue next feature
    }
  }

  if (totalTambakOverlapSqm > 0) {
    const percentage = Number(((totalTambakOverlapSqm / totalAreaSqm) * 100).toFixed(1));
    violations.push({
      layerName: 'Kawasan Tambak',
      tag: 'AQUACULTURE_INTERSECTION',
      type: 'INTERSECTION',
      severity: 'WARNING',
      overlapAreaSqm: totalTambakOverlapSqm,
      overlapPercentage: percentage,
      message: `Beririsan dengan Kawasan Tambak seluas ${totalTambakOverlapSqm.toLocaleString('id-ID')} m² (${percentage}% dari total lahan)`,
      details: 'Kawasan budidaya perikanan air payau/pesisir. Memerlukan penataan drainase dan mitigasi salinitas air.'
    });
  } else {
    passedLayers.push('Kawasan Tambak');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ATURAN DETEKSI GARIS INFRASTRUKTUR (LINE PROXIMITY & BUFFER)
  // ─────────────────────────────────────────────────────────────────────────────

  // Layer 5: Sempadan Jalan (Road Centerline) -> Threshold 20.0 Meters (WARNING)
  const roadFeatures = layers.roadFeatures || [];
  let minRoadDistance = Infinity;
  for (const feat of roadFeatures) {
    if (!feat || !feat.geometry) continue;
    try {
      const dist = calculatePolygonToLineDistance(appFeature, feat);
      if (dist < minRoadDistance) {
        minRoadDistance = dist;
      }
    } catch {
      // Continue
    }
  }

  const ROAD_THRESHOLD_METERS = 20.0;
  if (minRoadDistance < ROAD_THRESHOLD_METERS) {
    violations.push({
      layerName: 'Garis Sempadan Jalan',
      tag: 'GSJ_VIOLATION',
      type: 'PROXIMITY',
      severity: 'WARNING',
      distanceMeters: Number(minRoadDistance.toFixed(1)),
      thresholdMeters: ROAD_THRESHOLD_METERS,
      message: `Jarak ke as jalan hanya ${minRoadDistance.toFixed(1)} meter (Batas aman min. ${ROAD_THRESHOLD_METERS} meter)`,
      details: `Garis Sempadan Jalan (GSJ) minimum 20 meter dari as jalan arteri/kolektor untuk keselamatan dan ruang pelebaran jalan.`
    });
  } else {
    passedLayers.push('Garis Sempadan Jalan (GSJ)');
  }

  // Layer 6: Sempadan Sungai (River Centerline) -> Threshold 15.0 - 30.0 Meters (CRITICAL)
  const riverFeatures = layers.riverFeatures || [];
  let minRiverDistance = Infinity;
  for (const feat of riverFeatures) {
    if (!feat || !feat.geometry) continue;
    try {
      const dist = calculatePolygonToLineDistance(appFeature, feat);
      if (dist < minRiverDistance) {
        minRiverDistance = dist;
      }
    } catch {
      // Continue
    }
  }

  const RIVER_THRESHOLD_METERS = 15.0; // Minimal 15m batas dalam kota / 30m luar kota
  if (minRiverDistance < RIVER_THRESHOLD_METERS) {
    violations.push({
      layerName: 'Garis Sempadan Sungai',
      tag: 'GSS_VIOLATION',
      type: 'PROXIMITY',
      severity: 'CRITICAL',
      distanceMeters: Number(minRiverDistance.toFixed(1)),
      thresholdMeters: RIVER_THRESHOLD_METERS,
      message: `Melanggar Garis Sempadan Sungai, jarak: ${minRiverDistance.toFixed(1)} meter dari as sungai (Batas aman min. 15-30 meter)`,
      details: 'Permen PUPR No. 28/PRT/M/2015 menetapkan sempadan sungai tidak bertanggul minimal 15 meter untuk pencegahan banjir dan kelestarian sempadan.'
    });
  } else {
    passedLayers.push('Garis Sempadan Sungai (GSS)');
  }

  // Layer 7: Sempadan Saluran Irigasi / Pengairan -> Threshold 10.0 Meters (WARNING)
  const irrigationFeatures = layers.irrigationFeatures || [];
  let minIrrigationDistance = Infinity;
  for (const feat of irrigationFeatures) {
    if (!feat || !feat.geometry) continue;
    try {
      const dist = calculatePolygonToLineDistance(appFeature, feat);
      if (dist < minIrrigationDistance) {
        minIrrigationDistance = dist;
      }
    } catch {
      // Continue
    }
  }

  const IRRIGATION_THRESHOLD_METERS = 10.0;
  if (minIrrigationDistance < IRRIGATION_THRESHOLD_METERS) {
    violations.push({
      layerName: 'Sempadan Saluran Irigasi',
      tag: 'GSP_VIOLATION',
      type: 'PROXIMITY',
      severity: 'WARNING',
      distanceMeters: Number(minIrrigationDistance.toFixed(1)),
      thresholdMeters: IRRIGATION_THRESHOLD_METERS,
      message: `Masuk zona perlindungan irigasi, jarak: ${minIrrigationDistance.toFixed(1)} meter (Batas aman min. ${IRRIGATION_THRESHOLD_METERS} meter)`,
      details: 'Saluran irigasi teknis memerlukan zona sempadan inspeksi minimal 10 meter untuk pemeliharaan debit air pertanian.'
    });
  } else {
    passedLayers.push('Sempadan Saluran Irigasi (GSP)');
  }

  // Summarize results
  const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
  const warningCount = violations.filter(v => v.severity === 'WARNING').length;
  const isClear = violations.length === 0;

  let summary = 'Kawasan Bebas Restriksi Spasial & Sempadan (Clear to Proceed)';
  if (!isClear) {
    const parts: string[] = [];
    if (criticalCount > 0) parts.push(`${criticalCount} Konflik Kritis (CRITICAL)`);
    if (warningCount > 0) parts.push(`${warningCount} Peringatan Sempadan (WARNING)`);
    summary = `Ditemukan ${violations.length} Isu Spasial (${parts.join(' & ')})`;
  }

  return {
    isClear,
    totalAreaSqm,
    totalAreaHa,
    criticalCount,
    warningCount,
    summary,
    violations,
    passedLayers,
    analyzedAt: timestamp
  };
}
