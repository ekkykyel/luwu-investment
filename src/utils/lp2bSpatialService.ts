import * as turf from '@turf/turf';

let cachedSawahGeoJson: any = null;

export interface GeometryValidationResult {
  isValid: boolean;
  error?: string;
  feature?: any;
}

/**
 * Validates whether a spatial polygon geometry is closed, has valid coordinates,
 * and does not contain self-intersections (turf.kinks).
 */
export function validateSpatialGeometry(geometry: any): GeometryValidationResult {
  if (!geometry) {
    return {
      isValid: false,
      error: 'Geometri polygon lokasi usaha tidak boleh kosong.'
    };
  }

  let feat: any = null;
  try {
    let parsedGeom = geometry;
    if (typeof geometry === 'string') {
      try {
        parsedGeom = JSON.parse(geometry);
      } catch {
        return {
          isValid: false,
          error: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
        };
      }
    }

    if (parsedGeom.type === 'Feature') {
      feat = parsedGeom;
    } else if (parsedGeom.type === 'Polygon' || parsedGeom.type === 'MultiPolygon') {
      feat = turf.feature(parsedGeom);
    } else if (parsedGeom.geometry) {
      feat = turf.feature(parsedGeom.geometry);
    } else {
      return {
        isValid: false,
        error: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
      };
    }

    if (!feat || !feat.geometry || !feat.geometry.coordinates || !Array.isArray(feat.geometry.coordinates)) {
      return {
        isValid: false,
        error: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
      };
    }

    // Verify polygon ring closures (first coordinate must match last coordinate)
    if (feat.geometry.type === 'Polygon') {
      for (const ring of feat.geometry.coordinates) {
        if (!Array.isArray(ring) || ring.length < 4) {
          return {
            isValid: false,
            error: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
          };
        }
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (!Array.isArray(first) || !Array.isArray(last) || first[0] !== last[0] || first[1] !== last[1]) {
          return {
            isValid: false,
            error: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
          };
        }
      }
    } else if (feat.geometry.type === 'MultiPolygon') {
      for (const poly of feat.geometry.coordinates) {
        if (!Array.isArray(poly)) continue;
        for (const ring of poly) {
          if (!Array.isArray(ring) || ring.length < 4) {
            return {
              isValid: false,
              error: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
            };
          }
          const first = ring[0];
          const last = ring[ring.length - 1];
          if (!Array.isArray(first) || !Array.isArray(last) || first[0] !== last[0] || first[1] !== last[1]) {
            return {
              isValid: false,
              error: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
            };
          }
        }
      }
    }

    // Check for self-intersections (kinks)
    try {
      const kinks = turf.kinks(feat);
      if (kinks && kinks.features && kinks.features.length > 0) {
        return {
          isValid: false,
          error: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
        };
      }
    } catch (kinkErr) {
      console.warn('[lp2bSpatialService] turf.kinks evaluation note:', kinkErr);
    }

    return {
      isValid: true,
      feature: feat
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: 'Geometri polygon lokasi usaha tidak valid atau berpotongan sendiri.'
    };
  }
}

/**
 * Fetch and cache LP2B / Sawah layer GeoJSON
 */
export async function getLp2bGeoJson(): Promise<any> {
  if (cachedSawahGeoJson && cachedSawahGeoJson.features?.length > 0) {
    return cachedSawahGeoJson;
  }
  try {
    const res = await fetch('/gis_sawah.json');
    if (res.ok) {
      cachedSawahGeoJson = await res.json();
      return cachedSawahGeoJson;
    }
  } catch (e) {
    console.warn('[lp2bSpatialService] Failed to load /gis_sawah.json:', e);
  }
  return null;
}

/**
 * Smart Spatial Bypass: Check if a given application geometry intersects with LP2B (Sawah) layer.
 * Applies a 5-meter buffer zone on LP2B layer features to avoid 'false bypass' on fringe/borderlands.
 * Returns true if intersecting with LP2B (requires Pertanian verification).
 * Returns false if clean / non-LP2B (can bypass directly to PUPTR).
 */
export async function checkLp2bIntersection(
  geometry: any,
  providedLp2bGeojson?: any,
  options?: { bufferMeters?: number }
): Promise<boolean> {
  if (!geometry) return false;

  const validation = validateSpatialGeometry(geometry);
  if (!validation.isValid || !validation.feature) {
    console.warn('[lp2bSpatialService] Geometry validation failed:', validation.error);
    // On invalid geometry, we flag for verification rather than silent bypass
    return true;
  }

  const targetFeature = validation.feature;
  const bufferDistanceMeters = options?.bufferMeters ?? 5; // 5 meters buffer

  try {
    const lp2b = providedLp2bGeojson || (await getLp2bGeoJson());
    if (!lp2b || !lp2b.features || !Array.isArray(lp2b.features) || lp2b.features.length === 0) {
      return false;
    }

    // Check intersection with sawah features (applying 5m buffer)
    for (const feat of lp2b.features) {
      if (!feat || !feat.geometry) continue;
      try {
        let bufferedFeat = feat;
        if (bufferDistanceMeters > 0) {
          try {
            // Buffer in kilometers: 5m = 0.005 km
            const buffered: any = turf.buffer(feat, bufferDistanceMeters / 1000, { units: 'kilometers' });
            if (buffered && buffered.geometry) {
              bufferedFeat = buffered;
            }
          } catch {
            bufferedFeat = feat;
          }
        }
        if (turf.booleanIntersects(targetFeature, bufferedFeat)) {
          return true; // Intersects LP2B with 5m buffer safety!
        }
      } catch {
        // Continue checking other features
      }
    }
    return false; // Clean / Non-LP2B
  } catch (err) {
    console.warn('[lp2bSpatialService] Error checking LP2B intersection:', err);
    return false;
  }
}
