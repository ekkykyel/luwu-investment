import JSZip from 'jszip';
import { kml } from '@tmcw/togeojson';
import * as turf from '@turf/turf';
import type { FeatureCollection, Feature, Geometry, Polygon, MultiPolygon } from 'geojson';

export interface ParsedKmzResult {
  fileName: string;
  fileSize: number;
  featureCollection: FeatureCollection;
  primaryPolygon: Feature<Polygon | MultiPolygon> | null;
  totalAreaHa: number;
  placemarkCount: number;
  applicantNib?: string;
  extractedNames: string[];
}

/**
 * Sanitizes and heals GeoJSON geometries (auto-closes rings, removes NaN coordinates)
 */
function sanitizeAndHealGeometry(geom: Geometry | null | undefined): Geometry | null {
  if (!geom || !geom.type) return null;

  try {
    if (geom.type === 'Polygon') {
      const rings = (geom as Polygon).coordinates;
      const cleanRings: number[][][] = [];

      for (const ring of rings) {
        if (!Array.isArray(ring) || ring.length < 3) continue;

        // Filter valid [lng, lat] numbers
        const cleanRing = ring.filter(pt => Array.isArray(pt) && pt.length >= 2 && isFinite(pt[0]) && isFinite(pt[1]));
        if (cleanRing.length < 3) continue;

        // Auto-close ring if first != last
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

    if (geom.type === 'MultiPolygon') {
      const polys = (geom as MultiPolygon).coordinates;
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

    if (geom.type === 'LineString') {
      const pts = (geom as any).coordinates.filter((pt: any) => Array.isArray(pt) && pt.length >= 2 && isFinite(pt[0]) && isFinite(pt[1]));
      if (pts.length < 2) return null;
      return { type: 'LineString', coordinates: pts };
    }

    if (geom.type === 'Point') {
      const pt = (geom as any).coordinates;
      if (!Array.isArray(pt) || pt.length < 2 || !isFinite(pt[0]) || !isFinite(pt[1])) return null;
      return { type: 'Point', coordinates: [pt[0], pt[1]] };
    }

    return geom;
  } catch {
    return null;
  }
}

/**
 * Extracts rich metadata (ExtendedData, SimpleData, and HTML table descriptions) into properties
 */
function enrichKmlProperties(kmlDom: Document, geojson: FeatureCollection) {
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

    // 3. Ekstrak tabel HTML di dalam <description> jika ada
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
        name: finalName,
        nama: finalName,
        description: finalDesc,
        keterangan: finalDesc,
        kecamatan: finalKec,
        desa: finalDesa
      };
    }
  }
}

/**
 * Converts KML Document XML string into a standard GeoJSON FeatureCollection
 */
export function parseKmlStringToGeoJSON(kmlString: string): FeatureCollection {
  if (!kmlString || typeof kmlString !== 'string' || !kmlString.trim()) {
    throw new Error('Data KML kosong atau tidak terbaca.');
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlString, 'text/xml');
  
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('Struktur XML KML tidak valid atau rusak.');
  }

  const converted = kml(xmlDoc) as FeatureCollection;
  enrichKmlProperties(xmlDoc, converted);

  // Sanitize all geometries
  const cleanFeatures: Feature[] = [];
  if (converted && Array.isArray(converted.features)) {
    for (const feat of converted.features) {
      if (feat && feat.geometry) {
        const healedGeom = sanitizeAndHealGeometry(feat.geometry);
        if (healedGeom) {
          cleanFeatures.push({
            ...feat,
            geometry: healedGeom
          });
        }
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: cleanFeatures
  };
}

/**
 * Main bulletproof parser pipeline for .kml or .kmz files
 */
export async function parseKmlKmzFile(file: File): Promise<ParsedKmzResult> {
  if (!file) {
    throw new Error('Berkas spasial tidak ditemukan.');
  }

  const isKmz = file.name.toLowerCase().endsWith('.kmz');
  let kmlText = '';

  if (isKmz) {
    // Unzip KMZ file asynchronously using JSZip
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Search for .kml entry inside zip
    const kmlFiles = Object.keys(zip.files).filter(f => /.*\.kml$/i.test(f) && !zip.files[f].dir);
    if (kmlFiles.length === 0) {
      throw new Error('Berkas .kmz tidak memuat file KML (.kml) yang valid di dalamnya.');
    }

    const primaryKmlName = kmlFiles.find(f => f.toLowerCase() === 'doc.kml') || kmlFiles[0];
    const kmlEntry = zip.files[primaryKmlName];
    if (!kmlEntry) {
      throw new Error('Gagal mengekstrak berkas KML dari arsip KMZ.');
    }

    kmlText = await kmlEntry.async('text');
  } else {
    // Read plain .kml text
    kmlText = await file.text();
  }

  const fc = parseKmlStringToGeoJSON(kmlText);
  
  if (!fc.features || fc.features.length === 0) {
    throw new Error('Tidak ditemukan koordinat poligon atau fitur spasial valid dalam berkas KML/KMZ.');
  }

  // Find primary polygon or multi-polygon
  const polygonFeature = fc.features.find(
    f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
  ) as Feature<Polygon | MultiPolygon> | undefined;

  // Calculate high-precision geodesic area using Turf.js
  let totalAreaHa = 0;
  if (polygonFeature && polygonFeature.geometry) {
    try {
      const areaSqM = turf.area(polygonFeature);
      if (isFinite(areaSqM) && areaSqM > 0) {
        totalAreaHa = Number((areaSqM / 10000).toFixed(4));
      }
    } catch {
      totalAreaHa = 0;
    }
  }

  const extractedNames = fc.features.map(f => f.properties?.name || 'Fitur Spasial').filter(Boolean);

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
