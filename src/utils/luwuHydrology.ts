/**
 * LUWU REGENCY HYDROLOGY & RIVER BASIN (DAS) DATA MODULE
 * Source: RPJPD Kabupaten Luwu 2025-2045 (Document Section: Hydrology, River Basins & Water Resources)
 * 
 * Logic Rules:
 * 1. For a given investment potential location, identify its Kecamatan (District).
 * 2. Return the designated River Basin (DAS) and River Name for raw water availability.
 * 3. If a Kecamatan does not have a directly listed DAS in RPJPD, automatically fall back 
 *    to the nearest neighboring Kecamatan in Luwu Regency with an active DAS table entry.
 */

export interface LuwuDistrictRiverData {
  kecamatanKey: string;
  kecamatanName: string;
  dasName: string;
  riverName: string;
  hasDirectDas: boolean;
  neighborFallbackKecamatan?: string;
  intakeCoordinates: [number, number]; // [lng, lat]
  debitCapacity: string;
  usageSuitability: string;
  rpjpdTableRef: string;
}

export const LUWU_DISTRICT_HYDROLOGY: Record<string, LuwuDistrictRiverData> = {
  "bajo_barat": {
    kecamatanKey: "bajo_barat",
    kecamatanName: "Bajo Barat",
    dasName: "DAS Suso",
    riverName: "Sungai Suso",
    hasDirectDas: true,
    intakeCoordinates: [120.280000, -3.320000],
    debitCapacity: "1.650 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Sangat Cocok untuk Air Baku Industri, Smelter, Cold Storage & Irigasi Teknis",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "bajo": {
    kecamatanKey: "bajo",
    kecamatanName: "Bajo",
    dasName: "DAS Suso & DAS Suli",
    riverName: "Sungai Suso & Sungai Suli",
    hasDirectDas: true,
    intakeCoordinates: [120.320000, -3.340000],
    debitCapacity: "1.450 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Pengolahan Komoditas Pertanian, Agrowisata & PDAM",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "suli": {
    kecamatanKey: "suli",
    kecamatanName: "Suli",
    dasName: "DAS Suli",
    riverName: "Sungai Suli",
    hasDirectDas: true,
    intakeCoordinates: [120.350000, -3.420000],
    debitCapacity: "1.280 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Kawasan Minapolitan, Industri Perikanan & Utilitas Pabrik",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "suli_barat": {
    kecamatanKey: "suli_barat",
    kecamatanName: "Suli Barat",
    dasName: "DAS Suli",
    riverName: "Sungai Suli",
    hasDirectDas: true,
    intakeCoordinates: [120.310000, -3.410000],
    debitCapacity: "1.120 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Perkebunan Cengkeh, Perikanan Darat & Utilitas Industri",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "belopa": {
    kecamatanKey: "belopa",
    kecamatanName: "Belopa",
    dasName: "DAS Seppong & DAS Suli",
    riverName: "Sungai Seppong & Sungai Suli",
    hasDirectDas: true,
    intakeCoordinates: [120.360000, -3.380000],
    debitCapacity: "1.350 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Perkotaan, Pelabuhan Ulo-Ulo, Pergudangan & Industri Sentral",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "belopa_utara": {
    kecamatanKey: "belopa_utara",
    kecamatanName: "Belopa Utara",
    dasName: "DAS Seppong",
    riverName: "Sungai Seppong",
    hasDirectDas: true,
    intakeCoordinates: [120.370000, -3.360000],
    debitCapacity: "980 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Tambak Rumput Laut, Cold Storage & Pemukiman",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "kamanre": {
    kecamatanKey: "kamanre",
    kecamatanName: "Kamanre",
    dasName: "DAS Kamanre",
    riverName: "Sungai Kamanre",
    hasDirectDas: true,
    intakeCoordinates: [120.340000, -3.370000],
    debitCapacity: "850 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Sentra Pengolahan Kakao & Pertanian",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "ponrang": {
    kecamatanKey: "ponrang",
    kecamatanName: "Ponrang",
    dasName: "DAS Paremang",
    riverName: "Sungai Paremang",
    hasDirectDas: true,
    intakeCoordinates: [120.290000, -3.220000],
    debitCapacity: "1.520 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Industri Pengolahan Pangan, Kakao & Cold Storage Perikanan",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "ponrang_selatan": {
    kecamatanKey: "ponrang_selatan",
    kecamatanName: "Ponrang Selatan",
    dasName: "DAS Paremang",
    riverName: "Sungai Paremang",
    hasDirectDas: true,
    intakeCoordinates: [120.310000, -3.250000],
    debitCapacity: "1.380 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Sentra Perikanan Budidaya & Industri Komoditas",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "bupon": {
    kecamatanKey: "bupon",
    kecamatanName: "Bupon (Bua Ponrang)",
    dasName: "DAS Noling",
    riverName: "Sungai Noling",
    hasDirectDas: true,
    intakeCoordinates: [120.250000, -3.190000],
    debitCapacity: "1.180 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Perkebunan Kakao, Kelapa Sawit & Agrowisata",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "bua": {
    kecamatanKey: "bua",
    kecamatanName: "Bua",
    dasName: "DAS Bua",
    riverName: "Sungai Bua",
    hasDirectDas: true,
    intakeCoordinates: [120.220000, -3.090000],
    debitCapacity: "1.850 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Kawasan Industri Bua (KIBUA), Bandara Lagaligo & Logistik Pelabuhan",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "walenrang": {
    kecamatanKey: "walenrang",
    kecamatanName: "Walenrang",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: true,
    intakeCoordinates: [120.180000, -2.970000],
    debitCapacity: "2.100 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Sentra Padi Walmas, Agroindustri & Jaringan Irigasi Teknis",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "walenrang_timur": {
    kecamatanKey: "walenrang_timur",
    kecamatanName: "Walenrang Timur",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: true,
    intakeCoordinates: [120.220000, -2.960000],
    debitCapacity: "1.920 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Pertanian Padi, Tambak Udang/Ikan & Domestik",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "walenrang_utara": {
    kecamatanKey: "walenrang_utara",
    kecamatanName: "Walenrang Utara",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: false,
    neighborFallbackKecamatan: "Walenrang & Lamasi",
    intakeCoordinates: [120.190000, -2.930000],
    debitCapacity: "1.750 Liter/detik (Air Baku Kualitas Kelas II - Suplesi DAS Lamasi)",
    usageSuitability: "Air Baku Pertanian Lahan Basah & Agroindustri Koridor Walmas",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi - Suplesi Kecamatan Tetangga)"
  },
  "walenrang_barat": {
    kecamatanKey: "walenrang_barat",
    kecamatanName: "Walenrang Barat",
    dasName: "DAS Makawa",
    riverName: "Sungai Makawa",
    hasDirectDas: true,
    intakeCoordinates: [120.120000, -2.980000],
    debitCapacity: "1.400 Liter/detik (Air Baku Kualitas Kelas I/II - Mikrohidro/PLTMH)",
    usageSuitability: "Air Baku Pegunungan jernih, Potensi Mikrohidro & Holtikultura Hulu",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "lamasi": {
    kecamatanKey: "lamasi",
    kecamatanName: "Lamasi",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: true,
    intakeCoordinates: [120.170000, -2.910000],
    debitCapacity: "2.250 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Utama Lumbung Pangan Walmas & Industri Pengolahan Beras",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "lamasi_timur": {
    kecamatanKey: "lamasi_timur",
    kecamatanName: "Lamasi Timur",
    dasName: "DAS Lamasi",
    riverName: "Sungai Lamasi",
    hasDirectDas: true,
    intakeCoordinates: [120.230000, -2.900000],
    debitCapacity: "1.800 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Budidaya Perikanan, Irigasi Teknis & Domestik",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "larompong": {
    kecamatanKey: "larompong",
    kecamatanName: "Larompong",
    dasName: "DAS Larompong",
    riverName: "Sungai Larompong",
    hasDirectDas: true,
    intakeCoordinates: [120.330000, -3.510000],
    debitCapacity: "1.320 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Perkebunan Cengkeh, Kakao & Utilitas Pabrik Pengolahan",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "larompong_selatan": {
    kecamatanKey: "larompong_selatan",
    kecamatanName: "Larompong Selatan",
    dasName: "DAS Larompong",
    riverName: "Sungai Larompong",
    hasDirectDas: true,
    intakeCoordinates: [120.310000, -3.560000],
    debitCapacity: "1.150 Liter/detik (Air Baku Kualitas Kelas II)",
    usageSuitability: "Air Baku Wilayah Perbatasan Selatan, Cengkeh & Peternakan",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "latimojong": {
    kecamatanKey: "latimojong",
    kecamatanName: "Latimojong",
    dasName: "DAS Saluwo & DAS Suso",
    riverName: "Sungai Kadundung (Hulu DAS Suso)",
    hasDirectDas: true,
    intakeCoordinates: [120.070000, -3.330000],
    debitCapacity: "2.400 Liter/detik (Air Baku Kualitas Kelas I - Murni Pegunungan)",
    usageSuitability: "Air Baku Hulu Murni, Industri Ekstraktif Tambang/Smelter & PLTMH",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)"
  },
  "bastem": {
    kecamatanKey: "bastem",
    kecamatanName: "Bastem (Bassesangtempe)",
    dasName: "DAS Suso",
    riverName: "Hulu Sungai Suso & Saluwo",
    hasDirectDas: false,
    neighborFallbackKecamatan: "Latimojong & Bajo Barat",
    intakeCoordinates: [120.080000, -3.280000],
    debitCapacity: "1.900 Liter/detik (Air Baku Pegunungan - Suplesi Hulu Latimojong/Bajo Barat)",
    usageSuitability: "Air Baku Pengolahan Kopi Organik, Agrowisata & Pembangkit Listrik PLTMH",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi - Suplesi Hulu Kecamatan Tetangga)"
  },
  "bastem_utara": {
    kecamatanKey: "bastem_utara",
    kecamatanName: "Bastem Utara (Bassesangtempe Utara)",
    dasName: "DAS Makawa & DAS Bua",
    riverName: "Hulu Sungai Makawa & Sungai Bua",
    hasDirectDas: false,
    neighborFallbackKecamatan: "Walenrang Barat & Bua",
    intakeCoordinates: [120.100000, -3.050000],
    debitCapacity: "1.600 Liter/detik (Air Baku Pegunungan - Suplesi Walenrang Barat/Bua)",
    usageSuitability: "Air Baku Holtikultura Tinggi, Kopi Arabika & Konservasi Hulu DAS",
    rpjpdTableRef: "Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi - Suplesi Hulu Kecamatan Tetangga)"
  }
};

const KECAMATAN_ALIAS_MAP: Record<string, string> = {
  // Bupon / Bua Ponrang / Noling
  "bupon": "bupon",
  "buaponrang": "bupon",
  "bua ponrang": "bupon",
  "noling": "bupon",

  // Bajo Barat & Bajo
  "bajobarat": "bajo_barat",
  "bajo barat": "bajo_barat",
  "bajo": "bajo",

  // Suli & Suli Barat
  "suli": "suli",
  "sulibarat": "suli_barat",
  "suli barat": "suli_barat",

  // Belopa & Belopa Utara
  "belopa": "belopa",
  "seppong": "belopa",
  "belopautara": "belopa_utara",
  "belopa utara": "belopa_utara",

  // Kamanre
  "kamanre": "kamanre",

  // Ponrang & Ponrang Selatan
  "ponrang": "ponrang",
  "paremang": "ponrang",
  "ponrangselatan": "ponrang_selatan",
  "ponrang selatan": "ponrang_selatan",

  // Bua
  "bua": "bua",

  // Walenrang series
  "walenrang": "walenrang",
  "walenrangtimur": "walenrang_timur",
  "walenrang timur": "walenrang_timur",
  "walenrangutara": "walenrang_utara",
  "walenrang utara": "walenrang_utara",
  "walenrangbarat": "walenrang_barat",
  "walenrang barat": "walenrang_barat",
  "makawa": "walenrang_barat",

  // Lamasi series
  "lamasi": "lamasi",
  "lamasitimur": "lamasi_timur",
  "lamasi timur": "lamasi_timur",

  // Larompong series
  "larompong": "larompong",
  "larompongselatan": "larompong_selatan",
  "larompong selatan": "larompong_selatan",

  // Latimojong
  "latimojong": "latimojong",
  "kadundung": "latimojong",
  "saluwo": "latimojong",

  // Bastem series
  "bastem": "bastem",
  "bassesangtempe": "bastem",
  "bastemutara": "bastem_utara",
  "bastem utara": "bastem_utara",
  "bassesangtempeutara": "bastem_utara",
  "bassesangtempe utara": "bastem_utara"
};

/**
 * Normalizes input text for fuzzy matching kecamatan names.
 */
function normalizeDistrictName(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/kecamatan|kabupaten|luwu/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Calculates straight-line distance in kilometers between two coordinates.
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Retrieves river/DAS hydrology info by Kecamatan Name, District ID, or Potential Name.
 * Uses exact alias mapping, string inclusion, and falls back gracefully to geographic nearest Kecamatan if not matched.
 */
export function getHydrologyByDistrictName(
  districtNameQuery?: string,
  lat?: number,
  lng?: number,
  potensiNameQuery?: string
): LuwuDistrictRiverData {
  const normalizedQuery = normalizeDistrictName(districtNameQuery || "");
  const normalizedPotensi = normalizeDistrictName(potensiNameQuery || "");
  const combinedText = `${normalizedQuery} ${normalizedPotensi}`;

  // 1. Direct Alias Lookup
  for (const [alias, targetKey] of Object.entries(KECAMATAN_ALIAS_MAP)) {
    const normAlias = normalizeDistrictName(alias);
    if (
      normalizedQuery === normAlias ||
      normalizedQuery.includes(normAlias) ||
      combinedText.includes(normAlias)
    ) {
      if (LUWU_DISTRICT_HYDROLOGY[targetKey]) {
        return LUWU_DISTRICT_HYDROLOGY[targetKey];
      }
    }
  }

  // 2. Exact or partial key match in LUWU_DISTRICT_HYDROLOGY
  if (normalizedQuery) {
    for (const key of Object.keys(LUWU_DISTRICT_HYDROLOGY)) {
      const data = LUWU_DISTRICT_HYDROLOGY[key];
      const normKey = normalizeDistrictName(key);
      const normName = normalizeDistrictName(data.kecamatanName);

      if (
        normKey === normalizedQuery ||
        normName === normalizedQuery ||
        normalizedQuery.includes(normKey) ||
        normalizedQuery.includes(normName)
      ) {
        return data;
      }
    }
  }

  // 3. Match against potential name string keywords (e.g., "Sentra Kakao Noling" -> "noling")
  if (normalizedPotensi) {
    for (const [alias, targetKey] of Object.entries(KECAMATAN_ALIAS_MAP)) {
      const normAlias = normalizeDistrictName(alias);
      if (normalizedPotensi.includes(normAlias)) {
        if (LUWU_DISTRICT_HYDROLOGY[targetKey]) {
          return LUWU_DISTRICT_HYDROLOGY[targetKey];
        }
      }
    }
  }

  // 4. Geographic coordinate fallback if valid coordinates provided
  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
    return getHydrologyByCoordinates(lat, lng);
  }

  // 5. Default fallback: Bajo Barat (Central Luwu DAS Suso)
  return LUWU_DISTRICT_HYDROLOGY["bajo_barat"];
}

/**
 * Retrieves river/DAS hydrology info by Geographic Coordinates [lat, lng].
 * Finds the nearest Kecamatan among Luwu's 22 districts.
 */
export function getHydrologyByCoordinates(lat: number, lng: number): LuwuDistrictRiverData {
  let nearestData: LuwuDistrictRiverData = LUWU_DISTRICT_HYDROLOGY["bajo_barat"];
  let minDistance = Infinity;

  for (const key of Object.keys(LUWU_DISTRICT_HYDROLOGY)) {
    const data = LUWU_DISTRICT_HYDROLOGY[key];
    const [intakeLng, intakeLat] = data.intakeCoordinates;
    const dist = calculateDistanceKm(lat, lng, intakeLat, intakeLng);

    if (dist < minDistance) {
      minDistance = dist;
      nearestData = data;
    }
  }

  return nearestData;
}
