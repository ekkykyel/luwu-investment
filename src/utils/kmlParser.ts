import JSZip from 'jszip';
import type { FeatureCollection, Feature, Geometry, Polygon, MultiPolygon, Point } from 'geojson';
import { parseKmlKmzFile, parseKmlStringToGeoJSON, ParsedKmzResult } from './kmlKmzParser';

export interface ParsedKmlGeoJSONResult {
  success: boolean;
  geometry: Geometry | null;
  featureCollection: FeatureCollection;
  fileName: string;
  totalAreaHa: number;
  placemarkCount: number;
  extractedNames: string[];
  rawKmzResult?: ParsedKmzResult;
}

/**
 * Universal Parser Utility for KML and KMZ files.
 * Extracts GeoJSON Geometry (Polygon, MultiPolygon, Point) and FeatureCollection.
 */
export async function parseKmlOrKmzFile(file: File): Promise<ParsedKmlGeoJSONResult> {
  try {
    const rawResult = await parseKmlKmzFile(file);
    const primaryGeom = rawResult.primaryPolygon?.geometry || 
      (rawResult.featureCollection.features[0]?.geometry as Geometry) || 
      null;

    return {
      success: true,
      geometry: primaryGeom,
      featureCollection: rawResult.featureCollection,
      fileName: rawResult.fileName,
      totalAreaHa: rawResult.totalAreaHa,
      placemarkCount: rawResult.placemarkCount,
      extractedNames: rawResult.extractedNames,
      rawKmzResult: rawResult
    };
  } catch (err: any) {
    console.error('[kmlParser] Error parsing KML/KMZ file:', err);
    return {
      success: false,
      geometry: null,
      featureCollection: { type: 'FeatureCollection', features: [] },
      fileName: file.name,
      totalAreaHa: 0,
      placemarkCount: 0,
      extractedNames: []
    };
  }
}

/**
 * Parses raw KML XML string directly to GeoJSON FeatureCollection
 */
export function extractGeoJSONFromKmlString(kmlString: string): FeatureCollection {
  return parseKmlStringToGeoJSON(kmlString);
}

// Re-export original parser functions for backwards compatibility
export { parseKmlKmzFile, parseKmlStringToGeoJSON };
