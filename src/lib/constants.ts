import { SektorInvestasi } from "../types";

export const SECTOR_COLORS: Record<SektorInvestasi, string> = {
  [SektorInvestasi.KELAUTAN]: "#06b6d4", // cyan
  [SektorInvestasi.PERTANIAN]: "#10b981", // emerald
  [SektorInvestasi.PERTAMBANGAN]: "#f59e0b", // amber
  [SektorInvestasi.PERDAGANGAN]: "#6366f1", // indigo
  [SektorInvestasi.PARIWISATA]: "#f43f5e" // rose
};

export const SECTOR_MULTIPLIERS: Record<SektorInvestasi, { yield: number; risk: string; factor: number }> = {
  [SektorInvestasi.KELAUTAN]: { yield: 14.8, risk: "Medium-Low", factor: 1.12 },
  [SektorInvestasi.PERTANIAN]: { yield: 11.2, risk: "Low", factor: 1.05 },
  [SektorInvestasi.PERTAMBANGAN]: { yield: 22.4, risk: "High", factor: 1.25 },
  [SektorInvestasi.PERDAGANGAN]: { yield: 13.5, risk: "Medium", factor: 1.08 },
  [SektorInvestasi.PARIWISATA]: { yield: 16.2, risk: "Medium-High", factor: 1.15 }
};

// 🏛️ Master Infrastructure Nodes & PostGIS Georeference Anchors for Kabupaten Luwu (Single Source of Truth)
export const LUWU_INFRASTRUCTURE_NODES = {
  BANDARA_BUA: {
    lat: -3.086338,
    lng: 120.241323,
    coordinates: [120.241323, -3.086338] as [number, number],
    name: "Bandara I La Galigo Bua",
    code: "BUA",
    type: "Bandar Udara Komersial",
  },
  PELABUHAN_BELOPA: {
    lat: -3.386062,
    lng: 120.397935,
    coordinates: [120.397935, -3.386062] as [number, number],
    name: "Pelabuhan Ulo-Ulo Belopa",
    code: "PLO",
    type: "Pelabuhan Logistik Laut",
  },
  TRANS_SULAWESI: {
    lat: -3.385000,
    lng: 120.360000,
    coordinates: [120.360000, -3.385000] as [number, number],
    name: "Jalan Poros Trans-Sulawesi",
    code: "JAS",
    type: "Jaringan Jalan Nasional",
  },
  PLN_SUBSTATION: {
    lat: -3.391244,
    lng: 120.358512,
    coordinates: [120.358512, -3.391244] as [number, number],
    name: "Gardu Induk PLN 150kV Belopa",
    code: "PLN",
    type: "Infrastruktur Energi Listrik",
  },
  WATER_BASIN: {
    lat: -3.320000,
    lng: 120.280000,
    coordinates: [120.280000, -3.320000] as [number, number],
    name: "Sumber Air Baku DAS Suso & Suli",
    code: "SDA",
    type: "Infrastruktur Hidrologi & Air Bersih",
  },
  GOV_CENTER: {
    lat: -3.394829,
    lng: 120.365479,
    coordinates: [120.365479, -3.394829] as [number, number],
    name: "Pusat Pemkab & DPMPTSP Belopa",
    code: "GOV",
    type: "Pusat Layanan Terpadu Daerah",
  },
};

/**
 * Single Source of Truth Haversine Distance Calculation (KM)
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

