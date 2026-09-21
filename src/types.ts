/**
 * Shared Type Definitions for Smart Investment Spatial Platform Luwu
 */

export enum Role {
  SUPER_ADMIN = "Super Admin",
  OPERATOR = "Operator",
  ADMIN_DALAK = "Admin Dalak",
  ADMIN_OSS = "Admin OSS",
  ADMIN_PROMOSI = "Admin Promosi",
  ADMIN_DATA = "Admin Data",
  ADMIN_MPP = "Admin MPP",
  ADMIN_PUPTR = "Admin PUPTR",
  ADMIN_PERTANIAN = "Admin Pertanian",
  INVESTOR = "Investor",
  PUBLIC_USER = "Public User"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export enum SektorInvestasi {
  KELAUTAN = "Kelautan dan Perikanan",
  PERTANIAN = "Pertanian",
  PERTAMBANGAN = "Pertambangan",
  PERDAGANGAN = "Perindustrian", // Reusing this key to avoid breaking codebase
  PARIWISATA = "Pariwisata"
}

export interface District {
  id: string;
  name: string;
  rawName?: string;
  areaHa: number; // area in Hectares
  population: number;
  density: number; // people per sq km
  villageCount: number;
  primarySectors: SektorInvestasi[];
  totalInvestmentValue: number; // in IDR
  infrastructureScore: number; // 1-10
  coordinates: [number, number]; // [lat, lng] center
  geojson?: any; // Stores GeoJSON boundaries
  polygon?: any;
  description: string;
  hasRealGeojson?: boolean;
}

export interface Village {
  id: string;
  code?: string;
  districtId: string;
  district_id?: string;
  districtName?: string;
  kecamatan?: string;
  id_kecamatan?: string | number;
  name: string;
  areaHa: number;
  population: number;
  density: number;
  commodities: string[];
  zoneStatus: "Kawasan Budidaya" | "Kawasan Lindung" | "Hutan Produksi" | "Kawasan Industri" | "Sempadan Pantai" | "Kawasan Binaan";
  investmentPotential: string;
  coordinates: [number, number];
  geojson?: any;
  polygon?: any;
}

export interface Investment {
  id: string;
  name: string;
  locationName?: string;
  sector: SektorInvestasi;
  subSector?: string;
  districtId: string;
  villageId: string;
  latitude: number;
  longitude: number;
  areaHa: number;
  investmentValue: number; // in IDR (million/billion/trillion)
  npv?: number; // Net Present Value
  landStatus: "Sertifikat Hak Milik" | "HGU" | "HPL" | "Adat / Ulayat" | "Negara Bebas";
  photoUrl: string;
  photoUrls?: string[];
  photo_url?: string;
  url_foto_lokasi?: string;
  galeri_foto?: string[];
  gallery?: string[];
  photo_urls?: string[];
  proposalFileName?: string;
  contactPic: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  smartData?: any;
  description?: string;
  polaRuang?: string;
  suitabilityScore?: number; // Calculated on spatial analysis
  spatialSync?: {
    distToPortKm?: number;
    distToRoadKm?: number;
    kecamatanMatch?: string;
    villageMatch?: string;
    unlockedAt?: string;
  };
  geometry?: any; // GeoJSON Geometry for point, line, or polygon
  status?: "Draft" | "Review" | "Published" | "Archived";
  financials?: any[];

  // ESG Compliance & Audit Trail Properties
  esgEnvironmentalRisk?: string;
  esg_environmental_risk?: string;
  intersectedLayerId?: string;
  intersected_layer_id?: string;
  isSpatialOverride?: boolean;
  is_spatial_override?: boolean;
  overrideDocumentRef?: string;
  override_document_ref?: string;
  overrideJustification?: string;
  override_justification?: string;
  overrideByUser?: string;
  override_by_user?: string;
  komitmenTenagaLokal?: number;
  komitmen_tenaga_lokal?: number | string;
  komitmenTenagaAsing?: number;
  komitmen_tenaga_asing?: number | string;
  tenagaKerja?: number;
  tenaga_kerja?: number | string;
  tenagaLokal?: number;
  tenaga_lokal?: number | string;
  tkl?: number;
  tka?: number;
  legalOverride?: {
    documentNumber?: string;
    justification?: string;
    byUser?: string;
    documentRef?: string;
  };
}

export interface InvestmentPotency extends Investment {
  esgEnvironmentalRisk?: string;
  esg_environmental_risk?: string;
  intersectedLayerId?: string;
  intersected_layer_id?: string;
  isSpatialOverride?: boolean;
  is_spatial_override?: boolean;
  overrideDocumentRef?: string;
  override_document_ref?: string;
  overrideJustification?: string;
  override_justification?: string;
  overrideByUser?: string;
  override_by_user?: string;
  komitmenTenagaLokal?: number;
  komitmen_tenaga_lokal?: number | string;
  tenagaKerja?: number;
  tenaga_kerja?: number | string;
  tenagaLokal?: number;
  tenaga_lokal?: number | string;
}

export interface GeoJSONLayer {
  id: string;
  name: string;
  category: "Kecamatan" | "Desa" | "Infrastruktur" | "Kawasan Industri" | "Pariwisata" | "Kelautan" | "Pertanian" | "Pertambangan" | "Jalan" | "Anotasi" | "Persetujuan PKKPR" | "Peruntukan Lahan" | "Batas Administrasi" | "Infrastruktur & Jalan" | "Pola Ruang" | string;
  geojson: any; // Raw GeoJSON object
  uploadedAt?: string;
  isActive: boolean;
  opacity: number;
  color: string;
  lineWidth: number;
  fillOpacity?: number;
  isLoading?: boolean;
  isLazy?: boolean;
  featuresCount?: number;
  type?: "Polygon" | "MultiPolygon" | "LineString" | "Point" | "Mixed";
  fillColor?: string;
  lineColor?: string;
}

export interface InfrastructurePoint {
  id: string;
  name: string;
  type: "Port" | "Airport" | "National Road" | "Power Plant" | "Telecommunication Tower";
  latitude: number;
  longitude: number;
}

export interface SpatialAnalysisCriteria {
  minAreaHa?: number;
  maxDistanceToPortKm?: number;
  maxDistanceToRoadKm?: number;
  sectors?: SektorInvestasi[];
  landStatus?: string[];
  minInvestmentValue?: number;
}

export interface MapSnapshot {
  id: string;
  url: string;
  timestamp: number;
}

export interface SmartRecommendation {
  districtId: string;
  suitabilityScore: number; // 0 - 100
  title: string;
  content: string; // Explaining why this matches
  recommendSectors: SektorInvestasi[];
}

export interface GisZonasi {
  id: string;
  styleurl?: string;
  fill_opacity?: number;
  stroke_opacity?: number;
  stroke?: string;
  stroke_width?: number;
  keterangan?: string;
  rpluwu2009?: string;
  geom?: any; // PostGIS geometry or GeoJSON representation
}

export interface SpatialHistory {
  id: string;
  user: string;
  timestamp: string;
  layerId: string;
  layerName: string;
  actionType: "CREATE" | "UPDATE" | "DELETE" | "ROLLBACK";
  oldProps?: any;
  newProps?: any;
}

export interface KnowledgeDocument {
  id: string;
  filename: string;
  uploadedAt: string;
  size: number;
  extractedText: string;
}


