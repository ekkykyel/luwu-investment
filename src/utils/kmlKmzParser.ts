import JSZip from 'jszip';
import type { FeatureCollection, Feature, Geometry, Polygon, Point } from 'geojson';

export interface ParsedKmzResult {
  fileName: string;
  fileSize: number;
  featureCollection: FeatureCollection;
  primaryPolygon: Feature<Polygon> | null;
  totalAreaHa: number;
  placemarkCount: number;
  applicantNib?: string;
  extractedNames: string[];
}

/**
 * Parses a coordinate string from KML into GeoJSON [lng, lat] coordinate tuples.
 * KML format: "120.20,-3.10,0 120.25,-3.10,0 120.25,-3.15,0 120.20,-3.10,0"
 */
function parseKmlCoordinates(coordStr: string): [number, number][] {
  if (!coordStr) return [];
  const coords: [number, number][] = [];
  
  // Split by whitespace, newline, or tab
  const rawPairs = coordStr.trim().split(/\s+/);
  
  for (const rawPair of rawPairs) {
    if (!rawPair) continue;
    const parts = rawPair.split(',');
    if (parts.length >= 2) {
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (!isNaN(lng) && !isNaN(lat)) {
        coords.push([lng, lat]);
      }
    }
  }

  // Ensure polygon ring is closed if needed
  if (coords.length >= 3) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push([first[0], first[1]]);
    }
  }

  return coords;
}

/**
 * Converts KML Document XML string into a standard GeoJSON FeatureCollection
 */
export function parseKmlStringToGeoJSON(kmlString: string): FeatureCollection {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlString, 'text/xml');
  const features: Feature[] = [];

  const placemarks = xmlDoc.getElementsByTagName('Placemark');

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const nameEl = pm.getElementsByTagName('name')[0];
    const descEl = pm.getElementsByTagName('description')[0];
    const name = nameEl?.textContent || `Placemark ${i + 1}`;
    const description = descEl?.textContent || '';

    // Check for Polygon
    const polygons = pm.getElementsByTagName('Polygon');
    if (polygons.length > 0) {
      for (let p = 0; p < polygons.length; p++) {
        const poly = polygons[p];
        const outerRing = poly.getElementsByTagName('outerBoundaryIs')[0] || poly;
        const coordsEl = outerRing.getElementsByTagName('coordinates')[0];
        
        if (coordsEl?.textContent) {
          const ringCoords = parseKmlCoordinates(coordsEl.textContent);
          if (ringCoords.length >= 4) {
            features.push({
              type: 'Feature',
              properties: {
                name,
                description,
                type: 'KML Polygon',
                parsedAt: new Date().toISOString()
              },
              geometry: {
                type: 'Polygon',
                coordinates: [ringCoords]
              }
            });
          }
        }
      }
      continue;
    }

    // Check for Point
    const points = pm.getElementsByTagName('Point');
    if (points.length > 0) {
      const point = points[0];
      const coordsEl = point.getElementsByTagName('coordinates')[0];
      if (coordsEl?.textContent) {
        const ptCoords = parseKmlCoordinates(coordsEl.textContent);
        if (ptCoords.length > 0) {
          features.push({
            type: 'Feature',
            properties: {
              name,
              description,
              type: 'KML Point',
              parsedAt: new Date().toISOString()
            },
            geometry: {
              type: 'Point',
              coordinates: ptCoords[0]
            }
          });
        }
      }
    }
  }

  // Fallback if no Placemark tags were found, search root coordinates directly
  if (features.length === 0) {
    const allCoords = xmlDoc.getElementsByTagName('coordinates');
    for (let c = 0; c < allCoords.length; c++) {
      const rawText = allCoords[c].textContent || '';
      const ringCoords = parseKmlCoordinates(rawText);
      if (ringCoords.length >= 4) {
        features.push({
          type: 'Feature',
          properties: {
            name: `Polygon Boundary ${c + 1}`,
            type: 'Extracted Polygon'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [ringCoords]
          }
        });
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Main parser pipeline for .kml or .kmz files
 */
export async function parseKmlKmzFile(file: File): Promise<ParsedKmzResult> {
  const isKmz = file.name.toLowerCase().endsWith('.kmz');
  let kmlText = '';

  if (isKmz) {
    // Unzip KMZ file using JSZip
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Search for .kml entry inside zip
    let kmlFileInZip = zip.file(/doc\.kml$/i)[0];
    if (!kmlFileInZip) {
      kmlFileInZip = zip.file(/\.kml$/i)[0];
    }

    if (!kmlFileInZip) {
      throw new Error("Berkas .kmz tidak memiliki berkas .kml valid di dalamnya.");
    }

    kmlText = await kmlFileInZip.async('string');
  } else {
    // Read plain .kml text
    kmlText = await file.text();
  }

  const fc = parseKmlStringToGeoJSON(kmlText);
  
  if (!fc.features || fc.features.length === 0) {
    throw new Error("Tidak ditemukan koordinat poligon/titik spasial dalam berkas KML/KMZ.");
  }

  // Find primary polygon
  const polygonFeature = fc.features.find(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') as Feature<Polygon> | undefined;

  // Calculate area if polygon exists
  let totalAreaHa = 0;
  if (polygonFeature && polygonFeature.geometry) {
    try {
      // Approximate geodesic area calculation or simplified bounding polygon area
      const ring = polygonFeature.geometry.coordinates[0];
      if (ring && ring.length >= 3) {
        // Shoelace formula in degrees converted to approximate hectares
        let areaSqDeg = 0;
        for (let i = 0; i < ring.length - 1; i++) {
          const p1 = ring[i];
          const p2 = ring[i + 1];
          areaSqDeg += (p1[0] * p2[1]) - (p2[0] * p1[1]);
        }
        areaSqDeg = Math.abs(areaSqDeg) / 2;
        // 1 deg lat/lng at equator ~ 111.32 km -> 1 deg^2 ~ 1.23e10 m^2 = 1.23e6 Ha
        totalAreaHa = Number((areaSqDeg * 1239500).toFixed(2));
      }
    } catch {
      totalAreaHa = 0;
    }
  }

  const extractedNames = fc.features.map(f => f.properties?.name || 'Unnamed').filter(Boolean);

  return {
    fileName: file.name,
    fileSize: file.size,
    featureCollection: fc,
    primaryPolygon: polygonFeature || null,
    totalAreaHa,
    placemarkCount: fc.features.length,
    extractedNames
  };
}
