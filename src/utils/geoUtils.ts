import type { FeatureCollection } from 'geojson';
import type * as GeoJSON from 'geojson';

/**
 * Normalizes GeoJSON data (whether string-encoded or raw JSON)
 * into a standard GeoJSON FeatureCollection.
 */
export function normalizeGeoJSON(
  geojson: unknown
): FeatureCollection | null {
  if (!geojson) return null;

  // Coba parse jika data dalam bentuk string
  let parsed: unknown = geojson;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  // Type guard: harus berupa object setelah parse
  if (typeof parsed !== 'object' || parsed === null) return null;
  const g = parsed as Record<string, unknown>;

  // Recursive function to extract all valid features
  const features: GeoJSON.Feature[] = [];
  
  const extractFeatures = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    if (obj.type === 'Feature') {
      features.push(obj);
    } else if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
      obj.features.forEach(extractFeatures);
    } else if (Array.isArray(obj)) {
      obj.forEach(extractFeatures);
    } else if (obj.coordinates && typeof obj.type === 'string') {
       // Convert raw geometry to Feature
       features.push({
         type: 'Feature',
         geometry: obj,
         properties: {}
       });
    } else if (Array.isArray(obj.features)) {
       obj.features.forEach(extractFeatures);
    }
  };

  extractFeatures(g);

  if (features.length === 0) return null;

  return {
    type: 'FeatureCollection',
    features: features
  };
}
