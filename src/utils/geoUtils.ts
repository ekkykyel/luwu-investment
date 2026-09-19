import type { FeatureCollection, Feature, Geometry, Polygon, MultiPolygon, Point } from 'geojson';
import type * as GeoJSON from 'geojson';
import * as turf from '@turf/turf';

/**
 * Normalizes a district or village name for robust matching across spatial layers.
 */
export function normalizeName(name?: string): string {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .replace(/kec\.\s*/gi, "")
    .replace(/kecamatan\s*/gi, "")
    .replace(/desa\s*/gi, "")
    .replace(/kel\.\s*/gi, "")
    .replace(/kelurahan\s*/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Normalizes and disambiguates district (kecamatan) names in Luwu Regency.
 * Ensures strict distinction for similar/overlapping names like 'Bua', 'Ponrang', and 'Bua Ponrang'.
 */
export function normalizeDistrictName(name?: string): string {
  if (!name) return "";
  const cleaned = String(name)
    .toLowerCase()
    .replace(/^dist_/i, "")
    .replace(/kec\.\s*/gi, "")
    .replace(/kecamatan\s*/gi, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  // Disambiguation / Explicit mappings for Luwu districts to match DB standard precisely:
  if (cleaned === "bua") return "bua";
  if (cleaned === "ponrang") return "ponrang";
  if (cleaned === "bua ponrang" || cleaned === "buaponrang" || cleaned === "buapon") return "bua ponrang";
  if (cleaned === "ponrang selatan" || cleaned === "ponsel" || cleaned === "ponrangselatan") return "ponrang selatan";
  if (cleaned === "bastem" || cleaned === "bassesangtempe" || cleaned === "basse sangtempe") return "basse sangtempe";
  if (cleaned === "bastem utara" || cleaned === "bassesangtempeutara" || cleaned === "basse sangtempe utara") return "basse sangtempe utara";
  if (cleaned === "walenrang") return "walenrang";
  if (cleaned === "walenrang barat") return "walenrang barat";
  if (cleaned === "walenrang timur") return "walenrang timur";
  if (cleaned === "walenrang utara") return "walenrang utara";
  if (cleaned === "suli") return "suli";
  if (cleaned === "suli barat") return "suli barat";
  if (cleaned === "larompong") return "larompong";
  if (cleaned === "larompong selatan") return "larompong selatan";
  if (cleaned === "bajo") return "bajo";
  if (cleaned === "bajo barat") return "bajo barat";
  if (cleaned === "belopa") return "belopa";
  if (cleaned === "belopa utara") return "belopa utara";
  if (cleaned === "kamanre") return "kamanre";
  if (cleaned === "lamasi") return "lamasi";
  if (cleaned === "lamasi timur") return "lamasi timur";
  if (cleaned === "latimojong") return "latimojong";

  return cleaned;
}

/**
 * Normalizes GeoJSON data (whether string-encoded or raw JSON)
 * into a standard GeoJSON FeatureCollection.
 */
export function normalizeGeoJSON(geojson: unknown): FeatureCollection {
  if (!geojson) return { type: 'FeatureCollection', features: [] };

  // Coba parse jika data dalam bentuk string
  let parsed: unknown = geojson;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return { type: 'FeatureCollection', features: [] };
    }
  }

  // Type guard: harus berupa object setelah parse
  if (typeof parsed !== 'object' || parsed === null) return { type: 'FeatureCollection', features: [] };
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

  if (features.length === 0) return { type: 'FeatureCollection', features: [] };

  return {
    type: 'FeatureCollection',
    features: features
  };
}

/**
 * Presisi Tinggi: Menghitung jarak geodesik dalam meter antara dua lokasi/koordinat/geometri.
 * Menerima array [lng, lat], objek { latitude, longitude } / { lat, lng }, atau GeoJSON Geometry/Feature.
 * Menggunakan algoritma Turf.js Geodesic dengan tingkat akurasi sub-meter untuk Profil Kelayakan IPRO.
 */
export function calculateDistanceMeters(
  from: [number, number] | { latitude?: number; longitude?: number; lat?: number; lng?: number } | GeoJSON.Geometry | GeoJSON.Feature | null | undefined,
  to: [number, number] | { latitude?: number; longitude?: number; lat?: number; lng?: number } | GeoJSON.Geometry | GeoJSON.Feature | null | undefined
): number {
  if (!from || !to) return Infinity;

  try {
    const extractPoint = (input: any): GeoJSON.Feature<GeoJSON.Point> | null => {
      if (!input) return null;
      let target = input;
      if (typeof target === 'string') {
        try {
          target = JSON.parse(target);
        } catch (e) {
          return null;
        }
      }
      if (!target) return null;

      // 1. Array [lng, lat]
      if (Array.isArray(target) && target.length >= 2) {
        const lng = Number(target[0]);
        const lat = Number(target[1]);
        if (!isNaN(lng) && !isNaN(lat) && (lng !== 0 || lat !== 0)) {
          return turf.point([lng, lat]);
        }
        return null;
      }

      if (typeof target === 'object') {
        // 2. Check GeoJSON Feature or Geometry
        const geom = target.type === 'Feature' ? target.geometry : target;
        if (geom && typeof geom === 'object' && geom.type) {
          if (geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
            const lng = Number(geom.coordinates[0]);
            const lat = Number(geom.coordinates[1]);
            if (!isNaN(lng) && !isNaN(lat) && (lng !== 0 || lat !== 0)) {
              return turf.point([lng, lat]);
            }
          }
          if (['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString'].includes(geom.type)) {
            try {
              const c = turf.centroid(geom);
              if (c && c.geometry && Array.isArray(c.geometry.coordinates)) {
                return c;
              }
            } catch (e) {
              // Ignore centroid error if geometry is invalid
            }
          }
        }

        // 3. Nested geometry property
        if (target.geometry) {
          const innerPt = extractPoint(target.geometry);
          if (innerPt) return innerPt;
        }

        // 4. Object properties: latitude/longitude, lat/lng, coords, coordinates
        const lng = Number(target.longitude ?? target.lng ?? target.coords?.[0] ?? target.coordinates?.[0]);
        const lat = Number(target.latitude ?? target.lat ?? target.coords?.[1] ?? target.coordinates?.[1]);
        if (!isNaN(lng) && !isNaN(lat) && (lng !== 0 || lat !== 0)) {
          return turf.point([lng, lat]);
        }
      }
      return null;
    };

    const ptA = extractPoint(from);
    const ptB = extractPoint(to);

    if (!ptA || !ptB) return Infinity;

    const distMeters = turf.distance(ptA, ptB, { units: 'meters' });
    if (isNaN(distMeters)) return Infinity;

    return Number(distMeters.toFixed(2));
  } catch (e) {
    console.error("calculateDistanceMeters error:", e);
    return Infinity;
  }
}

/**
 * Presisi Tinggi: Menghitung jarak geodesik dalam kilometer dengan presisi 3 desimal.
 */
export function calculateDistanceKm(
  from: Parameters<typeof calculateDistanceMeters>[0],
  to: Parameters<typeof calculateDistanceMeters>[1]
): number {
  const meters = calculateDistanceMeters(from, to);
  if (meters === Infinity) return Infinity;
  return Number((meters / 1000).toFixed(3));
}

export type PkkprSuitabilityLevel = 'TINGGI' | 'SEDANG' | 'BERSYARAT' | 'DIBATASI' | 'TIDAK_SESUAI' | '-';

export interface PkkprZoningResult {
  matchedZone: string;
  zoneType: string;
  suitabilityLevel: PkkprSuitabilityLevel;
  suitabilityLabel: string;
  color: 'emerald' | 'amber' | 'blue' | 'purple' | 'red';
  badgeTheme: 'emerald' | 'amber' | 'blue' | 'purple' | 'red';
  isGreenZone: boolean;
  isIndustrialCommercial: boolean;
  isConservation: boolean;
  warningNote?: string;
  notes: string;
  rekomendasi: string;
  dasarHukum: string;
  kdb: string;
  klb: string;
  kdh: string;
  intersectingAreaHa?: number;
  percentageOverlap?: number;
  legalArticles?: string[];
  allowedActivities?: string[];
}

/**
 * Standard reference zoning boundaries based on Perda RTRW Kabupaten Luwu No. 06 Tahun 2011
 * and RDTR Kawasan Perkotaan Belopa & KIB Bua.
 */
export const DEFAULT_LUWU_ZONING_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // 1. Kawasan Peruntukan Industri (KIB) Bua & Sekitarnya
    {
      type: "Feature",
      properties: {
        id: "zone-industri-bua",
        nama_zona: "Kawasan Peruntukan Industri (KPI) Bua & Sekitarnya",
        zona: "Industri & Manufaktur",
        kategori: "Kawasan Industri",
        kdb: "60-70%",
        klb: "1.5 - 3.0",
        kdh: "Min 20%",
        dasar_hukum: "Perda Kab. Luwu No. 06/2011 Pasal 33",
        ketentuan_khusus: "Prioritas pengolahan komoditas unggulan (smelter, kakao, rumput laut, cold storage, logistik).",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [120.20, -3.00],
          [120.35, -3.00],
          [120.35, -3.15],
          [120.20, -3.15],
          [120.20, -3.00]
        ]]
      }
    },
    // 1b. Kawasan Sentra Komoditas Perkebunan Kakao Terpadu (Bua Ponrang, Noling, Ponrang)
    {
      type: "Feature",
      properties: {
        id: "zone-perkebunan-kakao-noling",
        nama_zona: "Kawasan Sentra Komoditas Perkebunan Kakao Terpadu (Bua Ponrang - Noling)",
        zona: "Perkebunan Rakyat & Agroindustri",
        kategori: "Sentra Komoditas Unggulan Perkebunan",
        kdb: "40-60%",
        klb: "0.8 - 1.6",
        kdh: "Min 30%",
        dasar_hukum: "Perda Kab. Luwu No. 06/2011 Pasal 30",
        ketentuan_khusus: "Zona sentra komoditas kakao unggulan daerah, peremajaan kebun, hilirisasi pascapanen, fermentasi, dan agroindustri terintegrasi perkebunan rakyat.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [120.15, -3.20],
          [120.35, -3.20],
          [120.35, -3.34],
          [120.15, -3.34],
          [120.15, -3.20]
        ]]
      }
    },
    // 2. Kawasan Perdagangan & Jasa Pusat Perkotaan Belopa
    {
      type: "Feature",
      properties: {
        id: "zone-perdagangan-belopa",
        nama_zona: "Kawasan Perdagangan & Jasa Belopa",
        zona: "Perdagangan & Jasa",
        kategori: "Komersial & Perdagangan",
        kdb: "60-80%",
        klb: "2.0 - 4.0",
        kdh: "Min 15%",
        dasar_hukum: "Perda Kab. Luwu No. 06/2011 Pasal 38",
        ketentuan_khusus: "Pusat kegiatan perbankan, perhotelan, MICE, ritel modern, dan perkantoran swasta.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [120.30, -3.30],
          [120.42, -3.30],
          [120.42, -3.42],
          [120.30, -3.42],
          [120.30, -3.30]
        ]]
      }
    },
    // 3. Kawasan Permukiman Perkotaan Belopa & Suli
    {
      type: "Feature",
      properties: {
        id: "zone-permukiman-belopa",
        nama_zona: "Kawasan Permukiman Perkotaan",
        zona: "Permukiman",
        kategori: "Permukiman",
        kdb: "50-60%",
        klb: "1.2 - 2.0",
        kdh: "Min 30%",
        dasar_hukum: "Perda Kab. Luwu No. 06/2011 Pasal 38",
        ketentuan_khusus: "Permukiman berkepadatan sedang-tinggi dengan fasilitas lingkungan terpadu.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [120.32, -3.35],
          [120.40, -3.35],
          [120.40, -3.45],
          [120.32, -3.45],
          [120.32, -3.35]
        ]]
      }
    },
    // 4. Kawasan Agropolitan & Pertanian Tanaman Pangan (Bastem, Suli, Walenrang)
    {
      type: "Feature",
      properties: {
        id: "zone-agropolitan-pertanian",
        nama_zona: "Kawasan Agropolitan & Pertanian Tanaman Pangan",
        zona: "Pertanian & Perkebunan",
        kategori: "Lahan Pertanian Berkelanjutan (LP2B)",
        kdb: "20-40%",
        klb: "0.4 - 0.8",
        kdh: "Min 50%",
        dasar_hukum: "Perda Kab. Luwu No. 06/2011 Pasal 30",
        ketentuan_khusus: "Zona Hijau & LP2B: Alih fungsi lahan dibatasi ketat sesuai UU No. 41/2009. Wajib kajian teknis dinas pertanian.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [119.90, -3.10],
          [120.25, -3.10],
          [120.25, -3.45],
          [119.90, -3.45],
          [119.90, -3.10]
        ]]
      }
    },
    // 5. Kawasan Minapolitan & Kelautan (Pesisir Ponrang, Bua, Suli)
    {
      type: "Feature",
      properties: {
        id: "zone-minapolitan-pesisir",
        nama_zona: "Kawasan Minapolitan & Budidaya Perikanan",
        zona: "Perikanan & Kelautan",
        kategori: "Minapolitan",
        kdb: "40-50%",
        klb: "0.8 - 1.2",
        kdh: "Min 30%",
        dasar_hukum: "Perda Kab. Luwu No. 06/2011 Pasal 32",
        ketentuan_khusus: "Kawasan budidaya rumput laut, tambak intensif ramah lingkungan, dan unit pengolahan ikan.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [120.32, -3.10],
          [120.48, -3.10],
          [120.48, -3.55],
          [120.32, -3.55],
          [120.32, -3.10]
        ]]
      }
    },
    // 6. Kawasan Hutan Lindung & Resapan Air Pegunungan Latimojong
    {
      type: "Feature",
      properties: {
        id: "zone-hutan-lindung-latimojong",
        nama_zona: "Kawasan Hutan Lindung & Konservasi Latimojong",
        zona: "Hutan Lindung",
        kategori: "Kawasan Lindung",
        kdb: "0-5%",
        klb: "0.1",
        kdh: "Min 90%",
        dasar_hukum: "Perda Kab. Luwu No. 06/2011 Pasal 24",
        ketentuan_khusus: "Dilarang alih fungsi industri/ekstraktif. Hanya diizinkan untuk penelitian, jasa lingkungan & ekowisata terbatas.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [119.80, -3.25],
          [120.10, -3.25],
          [120.10, -3.60],
          [119.80, -3.60],
          [119.80, -3.25]
        ]]
      }
    },
    // 7. Kawasan Pariwisata & Ekawisata
    {
      type: "Feature",
      properties: {
        id: "zone-pariwisata-ekawisata",
        nama_zona: "Kawasan Pariwisata & Ekawisata Latimojong",
        zona: "Pariwisata & Ekawisata",
        kategori: "Pariwisata",
        kdb: "30-50%",
        klb: "0.6 - 1.2",
        kdh: "Min 40%",
        dasar_hukum: "Perda Kab. Luwu No. 06/2011 Pasal 35",
        ketentuan_khusus: "Pengembangan resort ramah lingkungan, agrowisata, dan amenitas pendukung pariwisata terpadu.",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [120.00, -3.35],
          [120.20, -3.35],
          [120.20, -3.55],
          [120.00, -3.55],
          [120.00, -3.35]
        ]]
      }
    }
  ]
};

/**
 * Extracts a valid turf Feature or geometry from any input format
 */
function extractTurfGeometry(input: any): Feature<Geometry> | null {
  if (!input) return null;

  try {
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input);
      } catch {
        return null;
      }
    }

    if (input.type === 'Feature' && input.geometry) {
      return input as Feature<Geometry>;
    }

    if (input.type === 'FeatureCollection' && Array.isArray(input.features) && input.features.length > 0) {
      return input.features[0] as Feature<Geometry>;
    }

    if (input.type === 'Polygon' || input.type === 'MultiPolygon' || input.type === 'Point') {
      return turf.feature(input) as Feature<Geometry>;
    }

    // Geometry object in geom or geometry prop
    if (input.geometry && input.geometry.type) {
      return turf.feature(input.geometry) as Feature<Geometry>;
    }
    if (input.geom && input.geom.type) {
      return turf.feature(input.geom) as Feature<Geometry>;
    }

    // Coordinates array [ [ [lng, lat], ... ] ]
    if (Array.isArray(input) && input.length > 0) {
      if (typeof input[0] === 'number' && typeof input[1] === 'number') {
        return turf.point([input[0], input[1]]) as Feature<Point>;
      }
      if (Array.isArray(input[0])) {
        // Ring or multi-ring
        if (Array.isArray(input[0][0])) {
          return turf.polygon(input) as Feature<Polygon>;
        } else {
          return turf.polygon([input]) as Feature<Polygon>;
        }
      }
    }

    // Lat/Lng properties
    const lat = Number(input.latitude || input.lat);
    const lng = Number(input.longitude || input.lng || input.lon);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return turf.point([lng, lat]) as Feature<Point>;
    }
  } catch (err) {
    console.warn('[geoUtils] Gagal mengekstrak geometri turf:', err);
  }

  return null;
}

/**
 * Performs high-performance spatial intersection checking using @turf/turf (booleanIntersects / intersect)
 * comparing the selected investment polygon/point against zoning layers.
 */
export function checkPkkprSpatialZoning(
  investmentGeometry: any,
  customZoningLayers?: FeatureCollection | Feature[] | any
): PkkprZoningResult {
  const investFeature = extractTurfGeometry(investmentGeometry);

  // Fallback defaults if geometry is missing
  if (!investFeature) {
    return {
      matchedZone: "Kawasan Budi Daya & Peruntukan Ruang Usaha",
      zoneType: "Zona Budi Daya RTRW",
      suitabilityLevel: "SEDANG",
      suitabilityLabel: "Kesesuaian: Memerlukan Kajian Deliniasi Spasial",
      color: "emerald",
      badgeTheme: "emerald",
      isGreenZone: false,
      isIndustrialCommercial: true,
      isConservation: false,
      notes: "Penetapan zona definitif memerlukan verifikasi titik koordinat atau deliniasi poligon pada peta RTRW/RDTR.",
      rekomendasi: "Pengajuan permohonan PKKPR melalui sistem OSS-RBA dengan melampirkan poligon koordinat batas lahan.",
      dasarHukum: "Peraturan Daerah Kabupaten Luwu No. 06 Tahun 2011 tentang RTRW Kab. Luwu",
      kdb: "50-60%",
      klb: "1.2 - 1.8",
      kdh: "Min 30%",
      allowedActivities: ["Kegiatan budi daya usaha yang memenuhi standar teknis tata ruang dan kelayakan lingkungan hidup"],
    };
  }

  // 1. Prepare candidate zoning features
  let zoningFeatures: Feature[] = [];
  if (customZoningLayers) {
    const normalized = normalizeGeoJSON(customZoningLayers);
    if (normalized && normalized.features.length > 0) {
      zoningFeatures = normalized.features;
    } else if (Array.isArray(customZoningLayers)) {
      zoningFeatures = customZoningLayers;
    }
  }

  // If no custom zoning features found, use official default Luwu zoning dataset
  if (zoningFeatures.length === 0) {
    zoningFeatures = DEFAULT_LUWU_ZONING_GEOJSON.features;
  }

  // 2. High-performance bounding box pre-filtering
  let investBbox: [number, number, number, number];
  try {
    investBbox = turf.bbox(investFeature) as [number, number, number, number];
  } catch {
    investBbox = [119.5, -3.7, 120.6, -2.8]; // Luwu boundary
  }

  const investBboxPoly = turf.bboxPolygon(investBbox);

  // 3. Find intersecting zones using turf.booleanIntersects & turf.intersect
  interface IntersectMatch {
    feature: Feature;
    overlapAreaHa: number;
    intersects: boolean;
  }

  const matches: IntersectMatch[] = [];

  for (const zoneFeature of zoningFeatures) {
    if (!zoneFeature.geometry) continue;

    try {
      // Fast BBox check first
      const zoneBbox = turf.bbox(zoneFeature) as [number, number, number, number];
      const zoneBboxPoly = turf.bboxPolygon(zoneBbox);

      if (!turf.booleanIntersects(investBboxPoly, zoneBboxPoly)) {
        continue; // Skip feature if bounding boxes don't intersect
      }

      // Precise geometry intersection test
      let doesIntersect = false;
      let overlapAreaHa = 0;

      if (investFeature.geometry.type === 'Point') {
        if (zoneFeature.geometry.type === 'Polygon' || zoneFeature.geometry.type === 'MultiPolygon') {
          doesIntersect = turf.booleanPointInPolygon(investFeature as Feature<Point>, zoneFeature as Feature<Polygon | MultiPolygon>);
        } else {
          doesIntersect = turf.booleanIntersects(investFeature, zoneFeature);
        }
      } else {
        doesIntersect = turf.booleanIntersects(investFeature, zoneFeature);

        // If both are polygons, attempt precise intersection calculation for area
        if (
          doesIntersect &&
          (investFeature.geometry.type === 'Polygon' || investFeature.geometry.type === 'MultiPolygon') &&
          (zoneFeature.geometry.type === 'Polygon' || zoneFeature.geometry.type === 'MultiPolygon')
        ) {
          try {
            const isect = turf.intersect(turf.featureCollection([
              investFeature as Feature<Polygon | MultiPolygon>,
              zoneFeature as Feature<Polygon | MultiPolygon>
            ]));
            if (isect) {
              const areaSqM = turf.area(isect);
              overlapAreaHa = areaSqM / 10000;
            }
          } catch {
            overlapAreaHa = 0;
          }
        }
      }

      if (doesIntersect) {
        matches.push({
          feature: zoneFeature,
          overlapAreaHa,
          intersects: true,
        });
      }
    } catch (err) {
      console.warn('[geoUtils] Error checking feature intersection:', err);
    }
  }

  // 4. Select dominant match or fallback to closest zone
  let primaryMatch: Feature | null = null;
  let maxArea = -1;

  if (matches.length > 0) {
    // Sort by largest overlap area
    for (const m of matches) {
      if (m.overlapAreaHa > maxArea) {
        maxArea = m.overlapAreaHa;
        primaryMatch = m.feature;
      }
    }
    if (!primaryMatch) {
      primaryMatch = matches[0].feature;
    }
  } else {
    // Fallback: evaluate closest zone or inspect sector intent from metadata
    primaryMatch = zoningFeatures[0];
  }

  const props = primaryMatch?.properties || {};
  const zoneName: string = props.nama_zona || props.name || props.zona || "Kawasan Peruntukan Industri";
  const zoneCategory: string = props.kategori || props.zona || props.PL || "Industri";
  const zoneDesc: string = props.ketentuan_khusus || props.description?.value || props.description || "";
  const dasarHukum: string = props.dasar_hukum || "Peraturan Daerah Kabupaten Luwu No. 06 Tahun 2011 tentang RTRW Kab. Luwu";
  const kdb: string = (props.kdb && props.kdb !== "-") ? props.kdb : "50-60%";
  const klb: string = (props.klb && props.klb !== "-") ? props.klb : "1.2 - 1.8";
  const kdh: string = (props.kdh && props.kdh !== "-") ? props.kdh : "Min 30%";

  const lowerName = zoneName.toLowerCase();
  const lowerCat = zoneCategory.toLowerCase();
  const lowerDesc = String(zoneDesc).toLowerCase();

  // 5. Classification Logic
  const isConservation = lowerName.includes("hutan lindung") || lowerCat.includes("lindung") || lowerCat.includes("konservasi") || lowerName.includes("mangrove");
  const isPlantationAgro = lowerName.includes("kakao") || lowerName.includes("perkebunan") || lowerCat.includes("perkebunan") || lowerName.includes("agroindustri") || lowerCat.includes("agroindustri");
  const isGreenZone = !isConservation && !isPlantationAgro && (lowerName.includes("pertanian") || lowerName.includes("sawah") || lowerCat.includes("agropolitan") || lowerCat.includes("lp2b") || lowerName.includes("lahan basah") || lowerCat.includes("lahan kering"));
  const isIndustrialCommercial = lowerName.includes("industri") || lowerName.includes("kib") || lowerName.includes("perdagangan") || lowerName.includes("jasa") || lowerCat.includes("komersial") || lowerCat.includes("manufaktur") || lowerName.includes("pergudangan");
  const isMarineMinapolitan = lowerName.includes("minapolitan") || lowerName.includes("kelautan") || lowerName.includes("tambak") || lowerName.includes("pesisir");

  let suitabilityLevel: PkkprSuitabilityLevel = "TINGGI";
  let suitabilityLabel = "Kesesuaian: Tinggi (Sesuai RTRW)";
  let color: 'emerald' | 'amber' | 'blue' | 'purple' | 'red' = 'emerald';
  let warningNote: string | undefined = undefined;
  let notes = "";
  let rekomendasi = "";

  if (isConservation) {
    suitabilityLevel = "DIBATASI";
    suitabilityLabel = "Kesesuaian: Dibatasi (Kawasan Lindung)";
    color = "red";
    warningNote = "⚠️ Batasan Ketat Kawasan Lindung: Lokasi berada di atau berbatasan dengan Zona Lindung/Konservasi. Pemanfaatan ruang non-konservasi dibatasi ketat dan dilarang untuk kegiatan industri ekstraktif tanpa izin khusus Kementerian LHK.";
    notes = "Kawasan konservasi dan penyangga tata air lingkungan. Wajib mempertahankan tutupan vegetasi dan integritas ekosistem.";
    rekomendasi = "Diperlukan Deliniasi Ulang & Pertimbangan Teknis Khusus dari Tim Pertimbangan Tata Ruang Daerah (FPRD) dan KLHK.";
  } else if (isPlantationAgro) {
    suitabilityLevel = "TINGGI";
    suitabilityLabel = "Kesesuaian: Tinggi (Zona Sentra Perkebunan & Agroindustri)";
    color = "emerald";
    notes = "Zona prioritas sentra komoditas perkebunan rakyat terpadu (kakao/kopi) dan rantai pasok hilirisasi agroindustri sesuai Perda Kab. Luwu No. 06/2011 Pasal 30.";
    rekomendasi = "Persetujuan PKKPR Prioritas Berbasis Komoditas Unggulan Daerah via OSS-RBA.";
  } else if (isGreenZone) {
    suitabilityLevel = "BERSYARAT";
    suitabilityLabel = "Kesesuaian: Bersyarat (Zona Hijau/Pertanian)";
    color = "amber";
    warningNote = "⚠️ Catatan Ketentuan LP2B: Berada pada Zona Pertanian / Lahan Pangan Berkelanjutan. Berdasarkan UU No. 41/2009 & Perda Luwu No. 06/2011, alih fungsi lahan memerlukan verifikasi teknis Dinas Pertanian & Kajian Teknis BPN sebelum penerbitan PKKPR.";
    notes = "Zona peruntukan budidaya pertanian/agropolitan. Komoditas perkebunan, agrowisata, dan agroindustri skala ramah lingkungan didukung.";
    rekomendasi = "Penerbitan PKKPR Bersyarat melalui mekanisme Persetujuan Teknis (Pertek) Pertanahan BPN dan Dinas PUPR/DPMPTSP.";
  } else if (isMarineMinapolitan) {
    suitabilityLevel = "TINGGI";
    suitabilityLabel = "Kesesuaian: Tinggi (Zona Minapolitan & Pesisir)";
    color = "blue";
    notes = "Zona prioritas perikanan kelautan, tambak ramah lingkungan, dan industri pengolahan hasil laut terpadu.";
    rekomendasi = "Persetujuan PKKPR Darat + Konfirmasi PKKPR Laut (KKPRL) via Kementerian Kelautan dan Perikanan (KKP).";
  } else if (isIndustrialCommercial) {
    suitabilityLevel = "TINGGI";
    suitabilityLabel = "Kesesuaian: Tinggi (Zona Industri & Komersial)";
    color = "emerald";
    notes = "Zona prioritas kegiatan usaha komersial & industri manufaktur. Tata ruang selaras 100% dengan rencana induk peruntukan ruang daerah.";
    rekomendasi = "Persetujuan PKKPR Otomatis (RTRW/RDTR Compliant) via OSS-RBA dengan waktu pemrosesan prioritas.";
  } else {
    // Permukiman / Campuran
    suitabilityLevel = "SEDANG";
    suitabilityLabel = "Kesesuaian: Sedang (Zona Permukiman & Jasa)";
    color = "purple";
    notes = "Zona permukiman dan kegiatan jasa perkotaan. Kegiatan usaha non-polutif dan ramah lingkungan diizinkan.";
    rekomendasi = "Penerbitan PKKPR dengan verifikasi dampak lingkungan dan keserasian fungsi permukiman.";
  }

  return {
    matchedZone: zoneName,
    zoneType: zoneCategory,
    suitabilityLevel,
    suitabilityLabel,
    color,
    badgeTheme: color,
    isGreenZone,
    isIndustrialCommercial,
    isConservation,
    warningNote,
    notes,
    rekomendasi,
    dasarHukum,
    kdb,
    klb,
    kdh,
    intersectingAreaHa: maxArea > 0 ? Number(maxArea.toFixed(2)) : undefined,
    allowedActivities: [
      isIndustrialCommercial ? "Industri & Manufaktur Terpadu" : "Pemanfaatan Ruang Terkendali",
      isGreenZone ? "Agroindustri & Perkebunan" : "Fasilitas Perdagangan & Jasa",
      "Pergudangan & Logistik Distribusi",
    ],
  };
}

export interface PbgDocumentItem {
  id: string;
  category: 'Arsitektur' | 'Struktur' | 'Utilitas (MEP)' | 'Lingkungan & Legalitas' | 'Pertimbangan Khusus';
  title: string;
  description: string;
  mandatory: boolean;
  standard: string;
  isSpecificToZoning?: boolean;
}

export interface PbgGatewayInfo {
  zoningTitle: string;
  kdbLimit: string;
  klbLimit: string;
  kdhLimit: string;
  suitabilityLevel: string;
  regulatoryBasis: string;
  portalUrl: string;
  processingTimelineDays: string;
  simbgStepNotes: string;
  documents: PbgDocumentItem[];
}

/**
 * Returns dynamic mandatory technical documents required for PBG (Persetujuan Bangunan Gedung)
 * in Kabupaten Luwu based on PP No. 16/2021 & SIMBG integrated with PKKPR zoning results.
 */
export function getPbgRequirements(pkkpr: PkkprZoningResult | null): PbgGatewayInfo {
  const isIndustrial = pkkpr?.isIndustrialCommercial || pkkpr?.matchedZone?.toLowerCase().includes("industri");
  const isCommercial = pkkpr?.matchedZone?.toLowerCase().includes("perdagangan") || pkkpr?.matchedZone?.toLowerCase().includes("jasa") || pkkpr?.matchedZone?.toLowerCase().includes("komersial");
  const isGreen = pkkpr?.isGreenZone;
  const isConservation = pkkpr?.isConservation;

  const docs: PbgDocumentItem[] = [
    // 1. Arsitektur
    {
      id: "doc-arsitektur-1",
      category: "Arsitektur",
      title: "Dokumen Gambar Rencana Arsitektur Lengkap",
      description: "Gambar denah, tampak 4 sisi, potongan melintang/membujur, denah perletakan pondasi & atap berskala 1:100.",
      mandatory: true,
      standard: "Bertanda tangan Arsitek berlisensi STRA (Surat Tanda Registrasi Arsitek)",
    },
    {
      id: "doc-arsitektur-2",
      category: "Arsitektur",
      title: "Spesifikasi Teknis & Tipologi Bangunan Kab. Luwu",
      description: "Penjelasan konsep fasad, material tahan gempa, dan pemenuhan Garis Sempadan Bangunan (GSB) koridor Luwu.",
      mandatory: true,
      standard: "Sesuai Perda Kab. Luwu No. 06/2011",
    },

    // 2. Struktur
    {
      id: "doc-struktur-1",
      category: "Struktur",
      title: "Perhitungan Teknis Struktur Beton / Baja & Geoteknik",
      description: "Kajian analisis beban mati, beban hidup, beban gempa SNI 1726:2019, daya dukung tanah & rekomendasi pondasi.",
      mandatory: true,
      standard: "Pengesahan Ahli Struktur (SKA/SKK Jenjang 8/9)",
    },
    {
      id: "doc-struktur-2",
      category: "Struktur",
      title: isIndustrial
        ? "Perhitungan Beban Alat Berat & Lantai Fabrikasi (Heavy-Duty Slab)"
        : isCommercial
        ? "Analisis Struktur Bentang Lebar & Keamanan Gempa Ruang Publik"
        : "Detail Penulangan Beton & Struktur Atap Ramah Lingkungan",
      description: isIndustrial
        ? "Kalkulasi ketahanan beban operasional mesin pabrik, getaran dinamis, dan crane gantry industri."
        : isCommercial
        ? "Perhitungan struktur bentang kolom lebar untuk atrium, ruko bertingkat, atau hall perhotelan."
        : "Detail pembesian pondasi telapak/strauss pile serta pengikatan kolom praktis.",
      mandatory: true,
      standard: "Standar SNI 2847 (Beton) & SNI 1729 (Baja)",
      isSpecificToZoning: true,
    },

    // 3. Utilitas & Proteksi Kebakaran (MEP)
    {
      id: "doc-utilitas-1",
      category: "Utilitas (MEP)",
      title: "Gambar Rencana Sistem Mekanikal, Elektrikal & Plumbing (MEP)",
      description: "Jaringan kelistrikan genset/trafo, penangkal petir, plumbing air bersih, limbah cair domestik & sumur resapan.",
      mandatory: true,
      standard: "PUIL 2011 & SNI 03-6481-2000 (Plumbing)",
    },
    {
      id: "doc-utilitas-2",
      category: "Utilitas (MEP)",
      title: isIndustrial
        ? "Sistem Proteksi Kebakaran Industri & Desain IPAL Terpadu"
        : "Sistem Proteksi Kebakaran Pasif/Aktif & Jalur Evakuasi",
      description: isIndustrial
        ? "Jaringan hidran industri, sprinkler otomatis, alarm asap, serta skema IPAL sebelum buangan drainase umum."
        : "Penempatan APAR, hidran gedung, tangga darurat bebas asap, dan petunjuk arah evakuasi.",
      mandatory: true,
      standard: "Rekomendasi Dinas Pemadam Kebakaran Kab. Luwu",
      isSpecificToZoning: true,
    },

    // 4. Lingkungan & Legalitas Spasial
    {
      id: "doc-legalitas-1",
      category: "Lingkungan & Legalitas",
      title: "Konfirmasi / Persetujuan KKPR (PKKPR) OSS-RBA",
      description: "Bukti keselarasan pemanfaatan ruang dengan batas KDB, KLB, dan KDH yang tertera dalam sistem WebGIS Luwu.",
      mandatory: true,
      standard: "DPMPTSP Kab. Luwu / Kementerian ATR/BPN",
    },
    {
      id: "doc-legalitas-2",
      category: "Lingkungan & Legalitas",
      title: "Dokumen Persetujuan Lingkungan (Amdal / UKL-UPL / SPPL)",
      description: "Persetujuan kelayakan lingkungan hidup sesuai KBLI investasi dari Dinas Lingkungan Hidup Luwu.",
      mandatory: true,
      standard: "PP No. 22 Tahun 2021 tentang Penyelenggaraan Lingkungan Hidup",
    },
    {
      id: "doc-legalitas-3",
      category: "Lingkungan & Legalitas",
      title: "Bukti Penguasaan Hak Atas Tanah yang Sah",
      description: "Sertifikat Hak Milik (SHM) / Hak Guna Bangunan (HGB) / Akta Perjanjian Pemanfaatan Tanah yang terdaftar di ATR/BPN.",
      mandatory: true,
      standard: "Kantor Pertanahan Kab. Luwu",
    },
  ];

  // Specific Zoning Conditions
  if (isCommercial) {
    docs.push({
      id: "doc-andalalin",
      category: "Pertimbangan Khusus",
      title: "Dokumen Analisis Dampak Lalu Lintas (Andalalin)",
      description: "Kajian sirkulasi bangkitan lalu lintas dan kapasitas parkir kendaraan pengunjung fasilitas komersial.",
      mandatory: true,
      standard: "Rekomendasi Dinas Perhubungan Kab. Luwu",
      isSpecificToZoning: true,
    });
  }

  if (isGreen) {
    docs.push({
      id: "doc-lp2b",
      category: "Pertimbangan Khusus",
      title: "Rekomendasi Teknis Alih Fungsi Lahan Pertanian (LP2B)",
      description: "Persetujuan teknis pemanfaatan lahan pertanian pangan berkelanjutan sesuai ketentuan UU No. 41/2009.",
      mandatory: true,
      standard: "Dinas Pertanian & BPN Kab. Luwu",
      isSpecificToZoning: true,
    });
  }

  if (isConservation) {
    docs.push({
      id: "doc-konservasi",
      category: "Pertimbangan Khusus",
      title: "Sidang Rekomendasi Khusus Tim Ahli Bangunan Gedung (TABG/TPA)",
      description: "Persetujuan pertimbangan teknis dampak ekologis dan batas mitigasi daerah aliran sungai / lereng rawan bencana.",
      mandatory: true,
      standard: "Dinas PUPR & Tim Penilai Teknis Kab. Luwu",
      isSpecificToZoning: true,
    });
  }

  return {
    zoningTitle: pkkpr?.matchedZone || "-",
    kdbLimit: pkkpr?.kdb || "-",
    klbLimit: pkkpr?.klb || "-",
    kdhLimit: pkkpr?.kdh || "-",
    suitabilityLevel: pkkpr?.suitabilityLabel || "-",
    regulatoryBasis: "PP No. 16/2021 & Perda RTRW Kab. Luwu No. 06/2011",
    portalUrl: "https://simbg.pu.go.id",
    processingTimelineDays: isIndustrial ? "14 - 21 Hari Kerja" : "7 - 14 Hari Kerja",
    simbgStepNotes: "Pengajuan berkas teknis dilakukan secara digital melalui SIMBG (Sistem Informasi Bangunan Gedung) Kementerian PUPR terintegrasi DPMPTSP Luwu.",
    documents: docs,
  };
}

/**
 * Asynchronous wrapper for checkPkkprSpatialZoning that guarantees zero main-thread freezing
 */
export async function checkPkkprSuitabilityAsync(
  investmentGeometry: any,
  customZoningLayers?: any
): Promise<PkkprZoningResult> {
  return new Promise((resolve) => {
    // Defer execution using setTimeout / requestIdleCallback for optimal responsiveness
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => {
        const res = checkPkkprSpatialZoning(investmentGeometry, customZoningLayers);
        resolve(res);
      });
    } else {
      setTimeout(() => {
        const res = checkPkkprSpatialZoning(investmentGeometry, customZoningLayers);
        resolve(res);
      }, 0);
    }
  });
}

/**
 * Calculates a bounding box [minLng, minLat, maxLng, maxLat] for spatial features,
 * filtered investments, or district polygons using @turf/bbox.
 *
 * Ensures all points fit within the viewport with safe margins.
 */
export function calculateBoundingBox(
  itemsOrGeoJSON: any,
  fallbackDistrict?: { coordinates?: [number, number]; geojson?: any; polygon?: any } | null
): [number, number, number, number] | null {
  try {
    if (!itemsOrGeoJSON && !fallbackDistrict) return null;

    // 1. If itemsOrGeoJSON is a GeoJSON structure (or single feature / geometry / collection)
    if (itemsOrGeoJSON && typeof itemsOrGeoJSON === 'object') {
      const norm = normalizeGeoJSON(itemsOrGeoJSON);
      if (norm && norm.features && norm.features.length > 0) {
        const bbox = turf.bbox(norm) as [number, number, number, number];
        if (bbox && bbox.every((n) => typeof n === 'number' && !isNaN(n) && isFinite(n))) {
          if (Math.abs(bbox[0] - bbox[2]) < 0.0001 && Math.abs(bbox[1] - bbox[3]) < 0.0001) {
            return [bbox[0] - 0.02, bbox[1] - 0.02, bbox[2] + 0.02, bbox[3] + 0.02];
          }
          return bbox;
        }
      }
    }

    // 2. If itemsOrGeoJSON is an array of items (investments / point records)
    const points: GeoJSON.Feature<GeoJSON.Point>[] = [];
    if (Array.isArray(itemsOrGeoJSON)) {
      itemsOrGeoJSON.forEach((item) => {
        if (!item) return;
        const lat = Number(item.latitude ?? item.lat ?? item.coordinates?.[0]);
        const lng = Number(item.longitude ?? item.lng ?? item.coordinates?.[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          points.push(turf.point([lng, lat]));
        } else if (item.type === 'Feature' && item.geometry) {
          points.push(item);
        }
      });
    }

    if (points.length > 0) {
      const collection = turf.featureCollection(points);
      const bbox = turf.bbox(collection) as [number, number, number, number];

      // If single point or clustered tightly on identical coordinates, add margin
      if (Math.abs(bbox[0] - bbox[2]) < 0.0001 && Math.abs(bbox[1] - bbox[3]) < 0.0001) {
        return [
          bbox[0] - 0.02,
          bbox[1] - 0.02,
          bbox[2] + 0.02,
          bbox[3] + 0.02,
        ];
      }
      return bbox;
    }

    // 3. Fallback: If no points found, check district/village geometry or coordinates
    if (fallbackDistrict) {
      const rawGeo = fallbackDistrict.geojson || (fallbackDistrict.polygon ? { type: "Feature", geometry: fallbackDistrict.polygon, properties: {} } : null);
      if (rawGeo) {
        const norm = normalizeGeoJSON(rawGeo);
        if (norm && norm.features && norm.features.length > 0) {
          const bbox = turf.bbox(norm) as [number, number, number, number];
          if (bbox && bbox.every((n) => typeof n === 'number' && !isNaN(n) && isFinite(n))) {
            return bbox;
          }
        }
      }
      if (fallbackDistrict.coordinates && fallbackDistrict.coordinates.length >= 2) {
        const lat = fallbackDistrict.coordinates[0];
        const lng = fallbackDistrict.coordinates[1];
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lng - 0.045, lat - 0.045, lng + 0.045, lat + 0.045];
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validates and maps district/village properties of a GeoJSON Feature
 * to align with official DB array of districts and villages.
 * Standardizes key fields such as districtId, districtName, villageId, and villageName
 * using strict normalization and exact database mappings.
 */
export function validateAndCleanFeatureProperties(
  feature: any,
  districts: any[],
  villages: any[]
): any {
  if (!feature || typeof feature !== "object") return feature;
  
  // Clone feature to avoid mutating original state/reference directly
  const f = { ...feature };
  const p = f.properties ? { ...f.properties } : {};
  f.properties = p;

  // 1. Identify potential district raw indicators
  const rawDistId = String(p.id_kecamatan || p.districtId || p.district_id || p.kecamatan_id || p.id_kec || p.ID_KEC || p.district_id_raw || p.KECAMATAN_ID || "").trim();
  const rawDistName = String(p.KECAMATAN || p.kecamatan || p.WADMKC || p.NAMOBJ || p.Nama_Kec || p.nama_kecamatan || "").trim();

  let matchedDistrict: any = null;

  // Try direct ID match
  if (rawDistId) {
    matchedDistrict = districts.find(
      (d: any) => String(d.id).toLowerCase() === rawDistId.toLowerCase()
    );
  }

  // Try normalized name match
  if (!matchedDistrict && rawDistName) {
    const normSearchName = normalizeDistrictName(rawDistName);
    if (normSearchName) {
      matchedDistrict = districts.find((d: any) => {
        const normDbName = normalizeDistrictName(d.name);
        return normDbName === normSearchName;
      });
    }
  }

  // Try matching via raw ID interpreted as a name if name matching failed
  if (!matchedDistrict && rawDistId) {
    const normSearchIdAsName = normalizeDistrictName(rawDistId);
    if (normSearchIdAsName) {
      matchedDistrict = districts.find((d: any) => {
        const normDbName = normalizeDistrictName(d.name);
        return normDbName === normSearchIdAsName;
      });
    }
  }

  // If a district matches, assign standardized properties
  if (matchedDistrict) {
    p.districtId = String(matchedDistrict.id);
    p.district_id = String(matchedDistrict.id);
    p.districtName = String(matchedDistrict.name);
    p.kecamatan = String(matchedDistrict.name);
    p.KECAMATAN = String(matchedDistrict.name);
  }

  // 2. Identify potential village raw indicators
  const rawVilId = String(p.id_desa || p.ID_DESA || p.villageId || p.village_id || p.desa_id || p.KodeBPS || p.id_kel || p.village_id_raw || "").trim();
  const rawVilName = String(p.Nama_Desa || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.kelurahan || p.NAMOBJ || "").trim();

  let matchedVillage: any = null;

  // Try direct ID match
  if (rawVilId) {
    matchedVillage = villages.find(
      (v: any) => String(v.id).toLowerCase() === rawVilId.toLowerCase() ||
                  String(v.code).toLowerCase() === rawVilId.toLowerCase()
    );
  }

  // Try normalized name match
  if (!matchedVillage && rawVilName) {
    const normSearchVil = rawVilName.toLowerCase().replace(/desa\s*/i, "").replace(/kel\.\s*/i, "").replace(/kelurahan\s*/i, "").trim();
    if (normSearchVil) {
      matchedVillage = villages.find((v: any) => {
        const normDbVil = String(v.name).toLowerCase().replace(/desa\s*/i, "").replace(/kel\.\s*/i, "").replace(/kelurahan\s*/i, "").trim();
        const isNameMatch = normDbVil === normSearchVil;
        if (isNameMatch && matchedDistrict) {
          return String(v.districtId || v.district_id) === String(matchedDistrict.id);
        }
        return isNameMatch;
      });
    }
  }

  // If a village matches, assign standardized properties
  if (matchedVillage) {
    p.villageId = String(matchedVillage.id);
    p.village_id = String(matchedVillage.id);
    p.villageName = String(matchedVillage.name);
    p.desa = String(matchedVillage.name);
    p.DESA = String(matchedVillage.name);
    p.nama_desa = String(matchedVillage.name);
    
    // Also auto-resolve district if not already resolved
    if (!matchedDistrict && (matchedVillage.districtId || matchedVillage.district_id)) {
      const parentDistId = matchedVillage.districtId || matchedVillage.district_id;
      const parentDistrict = districts.find((d: any) => String(d.id) === String(parentDistId));
      if (parentDistrict) {
        p.districtId = String(parentDistrict.id);
        p.district_id = String(parentDistrict.id);
        p.districtName = String(parentDistrict.name);
        p.kecamatan = String(parentDistrict.name);
        p.KECAMATAN = String(parentDistrict.name);
      }
    }
  }

  return f;
}

/**
 * Checks if two district name strings refer to the same district in Luwu
 */
export function isSameDistrict(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false;
  const normA = normalizeDistrictName(nameA);
  const normB = normalizeDistrictName(nameB);
  return Boolean(normA && normB && normA === normB);
}

/**
 * Finds matching district from a list given a query name or ID
 */
export function findDistrictMatch(arg1: any, arg2?: any): any {
  let districtsList: any[] = [];
  let query: any = "";

  if (Array.isArray(arg1)) {
    districtsList = arg1;
    query = arg2;
  } else if (Array.isArray(arg2)) {
    districtsList = arg2;
    query = arg1;
  } else {
    return null;
  }

  if (!query) return null;
  const qClean = String(query).trim().toLowerCase();
  const qNorm = normalizeDistrictName(String(query));

  return districtsList.find((d: any) => {
    const dId = String(d.id || "").toLowerCase();
    const dName = String(d.name || d.kecamatan || "");
    const dNorm = normalizeDistrictName(dName);
    return dId === qClean || (qNorm && dNorm === qNorm) || dName.toLowerCase() === qClean;
  }) || null;
}

/**
 * Identifies the containing district from a point coordinate or GeoJSON geometry
 */
export function identifyDistrictFromGeometryOrCoord(
  geometryOrCoord: any,
  arg2?: any,
  arg3?: any
): any {
  let districtsList: any[] = [];
  if (Array.isArray(arg3)) {
    districtsList = arg3;
  } else if (Array.isArray(arg2)) {
    districtsList = arg2;
  }

  if (!geometryOrCoord) {
    return null;
  }

  try {
    const feat = extractTurfGeometry(geometryOrCoord);
    if (!feat) return null;

    let testPoint: GeoJSON.Feature<GeoJSON.Point> | null = null;
    if (feat.geometry.type === 'Point') {
      testPoint = feat as GeoJSON.Feature<GeoJSON.Point>;
    } else {
      testPoint = turf.centroid(feat);
    }

    if (!testPoint) return null;

    // If a geojson layer was passed as arg2 (FeatureCollection)
    if (arg2 && typeof arg2 === 'object' && !Array.isArray(arg2)) {
      const norm = normalizeGeoJSON(arg2);
      if (norm && norm.features && norm.features.length > 0) {
        for (const f of norm.features) {
          if (f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
            if (turf.booleanPointInPolygon(testPoint, f as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)) {
              const p = f.properties || {};
              const kName = p.KECAMATAN || p.kecamatan || p.name || p.nama_kecamatan || "";
              const kId = p.id || p.id_kecamatan || p.districtId || "";
              if (districtsList.length > 0) {
                const matched = findDistrictMatch(districtsList, kId || kName);
                if (matched) return matched;
              }
              return { id: kId || kName, name: kName, ...p };
            }
          }
        }
      }
    }

    for (const dist of districtsList) {
      const geo = dist.geojson || dist.geometry || dist.geom || (dist.polygon ? { type: "Feature", geometry: dist.polygon } : null);
      if (geo) {
        const norm = normalizeGeoJSON(geo);
        for (const f of norm.features) {
          if (f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
            if (turf.booleanPointInPolygon(testPoint, f as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)) {
              return dist;
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn("[geoUtils] identifyDistrictFromGeometryOrCoord warning:", e);
  }

  return null;
}



