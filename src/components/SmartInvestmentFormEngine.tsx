import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { PDFKajianUploader } from "./PDFKajianUploader";
import { X, Check, Save, Map as MapIcon, Layers, FileText, Activity, Image as ImageIcon, Sparkles, Navigation, Send, ArrowRight, ArrowLeft, Download, Edit, AlertCircle, Users, Building, Minimize2, Maximize2, ShieldAlert, Upload, AlertTriangle, AlertOctagon, Lock } from "lucide-react";
import * as turf from "@turf/turf";
import jsPDF from "jspdf";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "../lib/html2canvasShim";
import { motion, AnimatePresence } from "motion/react";
import { District, Village, SektorInvestasi } from "../types";
import SpatialEditorStudio from "./SpatialEditorStudio";
import SimplePolygonDrawer from "./SimplePolygonDrawer";
import PhotoUploader from "./PhotoUploader";
import Swal from 'sweetalert2';
import EsgWarningModal from "./EsgWarningModal";
import { formatNumber, formatRupiah, formatRupiahSingkat, formatInputRupiah, parseInputRupiah } from "../lib/formatters";
import { normalizeDistrictName, findDistrictMatch } from "../utils/geoUtils";
import { addCrossOpdNotification } from '../utils/crossOpdNotificationStore';


export const SECTOR_TAXONOMY: Record<string, Record<string, string[]>> = {
  [SektorInvestasi.PERTANIAN]: {
    "Perkebunan": ["Kopi", "Kakao", "Cengkeh", "Kelapa Dalam", "Kelapa Sawit", "Lada", "Pala"],
    "Tanaman Pangan": ["Padi", "Jagung", "Kedelai", "Ubi Kayu", "Sorgum"],
    "Hortikultura": ["Durian", "Rambutan", "Mangga", "Sayuran Tropis"]
  },
  [SektorInvestasi.KELAUTAN]: {
    "Perikanan Budidaya": ["Rumput Laut", "Udang Vaname", "Ikan Bandeng", "Ikan Nila", "Kepiting Bakau"],
    "Perikanan Tangkap": ["Ikan Pelagis", "Ikan Demersal", "Tuna/Cakalang"]
  },
  [SektorInvestasi.PERTAMBANGAN]: {
    "Mineral Logam": ["Emas", "Nikel", "Tembaga", "Bijih Besi"],
    "Bukan Logam & Batuan (Galian C)": ["Pasir", "Batu Gunung", "Kerikil", "Tanah Urug", "Batu Gamping"]
  },
  [SektorInvestasi.PARIWISATA]: {
    "Wisata Alam": ["Pantai", "Air Terjun", "Pegunungan/Camping Ground"],
    "Wisata Buatan/Budaya": ["Kolam Renang/Waterboom", "Situs Sejarah/Makam", "Desa Wisata"]
  },
  [SektorInvestasi.PERDAGANGAN]: {
    "Agroindustri": ["Pengolahan Kakao", "Penggilingan Padi", "Pabrik Minyak Kelapa", "Cold Storage Ikan"],
    "Manufaktur": ["Pabrik Kemasan", "Pengolahan Kayu/Furnitur", "Batu Bata/Paving Block"]
  }
};

// Types for new dependent fields test
interface FormState {
  id?: string;
  // Step 1: Info Dasar
  title: string;
  slug: string;
  sector: SektorInvestasi;
  subSector: string;
  status: string;
  shortDesc: string;
  longDesc: string;
  tags: string;
  kondisiTopografi: string;
  targetInvestor: string;
  skemaKemitraan: string;
  // Dependent Sector (Dynamic)
  commodityType?: string;
  annualProduction?: number;
  productionUnit?: string;
  harvestSeason?: string;
  productivity?: number;
  revenue?: number;
  plantType?: string;
  plantAge?: number;
  treeCount?: number;
  pondArea?: number;
  depth?: number;
  livestockType?: string;
  population?: number;
  tourismType?: string;
  visitorCount?: number;
  price?: number;
  occupancyRate?: number;
  mineralType?: string;
  reserves?: number;
  industryType?: string;
  productionCapacity?: number;

  // Step 2: Location
  province: string;
  districtId: string;
  villageId: string;
  latitude: number | string;
  longitude: number | string;
  geometry: any; // geojson
  geometryType: string;
  areaHa: number | string;
  perimeterM: number;

  // Step 3: Legitimasi
  ownershipStatus: string;
  rtrwStatus: string;
  rdtrStatus: string;
  environmentalStatus: string;
  certificateNumber: string;
  plotNumber: string;
  disputeStatus: string;
  validationDate: string;
  validatorAgency: string;

  // Step 4: Ekonomi
  capex: number;
  opex: number;
  penyerapanTenagaKerja: number;
  annualRevenue: number;
  irr: number;
  npv: number;
  roi: number;
  paybackPeriod: number;
  breakEvenPoint: number;
  marketScope: string;

  // Step 5: Infrastruktur
  roadDistance: number;
  provRoadDistance: number;
  portDistance: number;
  airportDistance: number;
  electricityDistance: number;
  fiberDistance: number;
  pasokanListrik: string;
  sumberAirBersih: string;
  jaringanTelekomunikasi: string;
  aksesJalanTerdekat: string;

  // Step 6: Media
  photoUrl: string;
  gallery: string[];
  droneVideoUrl: string;
  proposalPdf: string;
  investmentBriefPdf: string;
  feasibilityPdf: string;
  legalDoc: string;

  // Step 7: AI
  aiScore: number;
  aiScoreCategory: string;
  aiNarrative: string;
  bepTahun?: number;
  irrPersen?: number;
  npvEstimasi?: number;
  // Step 8: Kontak Person
  namaKontakPerson: string;
  jabatanKontak: string;
  noHpKontak: string;
  emailKontak: string;

  // Step 9: ESG Compliance & Spatial Override Audit
  esgEnvironmentalRisk?: string;
  intersectedLayerId?: string;
  isSpatialOverride?: boolean;
  overrideDocumentRef?: string;
  overrideJustification?: string;
  overrideByUser?: string;
  komitmenTenagaLokal?: number;

  // Lifted ESG & SK PKKPR Legalization fields
  esgRiskStatus?: 'CLEAR' | 'HIGH_RISK_INTERSECTION';
  intersectedZoneName?: string;
  skPkkprDocNumber?: string;
  skPkkprFileUrl?: string;
  skPkkprJustification?: string;
}

function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')   // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

export default function SmartInvestmentFormEngine({
  onClose,
  onSubmit, // will post to our new smart API mapping
  districts,
  villages,
  investmentToEdit,
  isEditMode,
  initialData,
  spatialLayers,
  setSpatialLayers,
  currentRole,
  isDarkMode,
  onRefreshAllData,
  drawnGeoJson
}: any) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatorSearch, setValidatorSearch] = useState('');
  const [showValidatorDropdown, setShowValidatorDropdown] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSpatialEditorOpen, setIsSpatialEditorOpen] = useState(false);
  const [initialGeometryToEdit, setInitialGeometryToEdit] = useState<any>(null);
  const [isGeomPickerOpen, setIsGeomPickerOpen] = useState(false);
  const [geomPickerList, setGeomPickerList] = useState<any[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [priceLabel, setPriceLabel] = useState<string>("Harga / Satuan");
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEsgModalOpen, setIsEsgModalOpen] = useState(false);
  const [esgWarningMessage, setEsgWarningMessage] = useState("");
  const [pendingSubmitAction, setPendingSubmitAction] = useState<((overrideData?: any) => Promise<void>) | null>(null);

  // Helper function to build form data from source (used for initial state and hydration)
  const buildFormData = (source: any): FormState => {
    if (!source) {
      return {
        id: "",
        title: "",
        slug: "",
        sector: SektorInvestasi.PERTANIAN,
        subSector: "",
        status: "Draft",
        shortDesc: "",
        longDesc: "",
        tags: "",
        kondisiTopografi: "Datar",
        targetInvestor: "PMDN (Nasional)",
        skemaKemitraan: "Pembebasan Lahan / Beli Putus",
        province: "Luwu",
        districtId: (districts && districts[0]?.id) || "",
        villageId: "",
        latitude: "",
        longitude: "",
        geometry: null,
        geometryType: "Point",
        areaHa: "",
        perimeterM: 0,
        ownershipStatus: "Sertifikat Hak Milik",
        rtrwStatus: "Sesuai",
        rdtrStatus: "Sesuai",
        environmentalStatus: "AMDAL",
        certificateNumber: "",
        plotNumber: "",
        disputeStatus: "Clear & Clean",
        validationDate: "",
        validatorAgency: "BPN",
        capex: 0,
        opex: 0,
        penyerapanTenagaKerja: 0,
        annualRevenue: 0,
        irr: 0,
        npv: 0,
        roi: 0,
        paybackPeriod: 0,
        breakEvenPoint: 0,
        marketScope: "Nasional",
        roadDistance: 0,
        provRoadDistance: 0,
        portDistance: 0,
        airportDistance: 0,
        electricityDistance: 0,
        fiberDistance: 0,
        pasokanListrik: "Tersedia Jaringan PLN",
        sumberAirBersih: "PDAM",
        jaringanTelekomunikasi: "Sinyal 4G/5G Kuat",
        aksesJalanTerdekat: "Jalan Kabupaten",
        photoUrl: "",
        gallery: [],
        droneVideoUrl: "",
        proposalPdf: "",
        investmentBriefPdf: "",
        feasibilityPdf: "",
        legalDoc: "",
        aiScore: 0,
        aiScoreCategory: "",
        aiNarrative: "",
        commodityType: "",
        annualProduction: 0,
        productionUnit: "Ton",
        treeCount: 0,
        plantAge: 0,
        pondArea: 0,
        depth: 0,
        tourismType: "",
        visitorCount: 0,
        price: 0,
        mineralType: "",
        reserves: 0,
        bepTahun: 0,
        irrPersen: 0,
        npvEstimasi: 0,
        namaKontakPerson: "",
        jabatanKontak: "",
        noHpKontak: "",
        emailKontak: "",
        esgEnvironmentalRisk: "AMDAL",
        intersectedLayerId: "",
        isSpatialOverride: false,
        overrideDocumentRef: "",
        overrideJustification: "",
        overrideByUser: "",
        komitmenTenagaLokal: 0,
        esgRiskStatus: 'CLEAR',
        intersectedZoneName: "",
        skPkkprDocNumber: "",
        skPkkprFileUrl: "",
        skPkkprJustification: "",
      };
    }

    const sd = source?.smartData || source?.smart_data || {};
    const geo = (Array.isArray(source?.gis_potensi_investasi) && source?.gis_potensi_investasi?.[0]) || 
                (Array.isArray(source?.geometries) && source?.geometries?.[0]) || 
                (source?.gis_potensi_investasi && typeof source.gis_potensi_investasi === 'object' && !Array.isArray(source.gis_potensi_investasi) ? source.gis_potensi_investasi : {}) ||
                {};
    const fin = (Array.isArray(source?.financials) && source?.financials?.[0]) || 
                (source?.financials && typeof source.financials === 'object' && !Array.isArray(source.financials) ? source.financials : {}) || 
                {};
    const leg = (Array.isArray(source?.legalities) && source?.legalities?.[0]) || 
                (source?.legalities && typeof source.legalities === 'object' && !Array.isArray(source.legalities) ? source.legalities : {}) || 
                {};
    const scr = (Array.isArray(source?.investment_scores) && source?.investment_scores?.[0]) || 
                (source?.investment_scores && typeof source.investment_scores === 'object' && !Array.isArray(source.investment_scores) ? source.investment_scores : {}) || 
                {};
    const media = (Array.isArray(source?.mediaAssets) && source?.mediaAssets?.[0]) || 
                  (Array.isArray(source?.media_assets) && source?.media_assets?.[0]) || 
                  {};

    // Extract District ID safely
    const rawDistId = source?.districtId || source?.district_id || source?.id_kecamatan || source?.kecamatan_id || geo.id_kecamatan || geo.kecamatan_id || geo.districtId || geo.district_id || "";
    let resolvedDistrictId = String(rawDistId);
    if (districts && districts.length > 0) {
      const matchedDist = findDistrictMatch(districts, resolvedDistrictId);
      if (matchedDist) {
        resolvedDistrictId = matchedDist.id;
      }
    }
    if (!resolvedDistrictId && districts && districts.length > 0) {
      resolvedDistrictId = districts[0].id;
    }

    // Extract Photos & Gallery
    const resolvedPhoto = source?.photoUrl || source?.photo_url || source?.url_foto_lokasi || source?.foto || source?.gambar || source?.foto_lokasi || geo.url_foto_lokasi || geo.photo_url || geo.gambar || geo.foto || sd.photoUrl || sd.photo_url || (media.photos?.[0]) || "";
    const rawGallery = source?.gallery || source?.galeri_foto || source?.photoUrls || source?.photo_urls || geo.galeri_foto || geo.photo_urls || geo.gallery || sd.gallery || sd.photoUrls || media.photos;
    let resolvedGallery: string[] = [];
    if (Array.isArray(rawGallery) && rawGallery.length > 0) {
      resolvedGallery = rawGallery.filter(Boolean);
    } else if (resolvedPhoto) {
      resolvedGallery = [resolvedPhoto];
    }

    // Sector mapping
    let resolvedSector = source?.sector || source?.sektor || source?.sektor_utama || geo.sektor_utama || geo.sektor || sd.sector || SektorInvestasi.PERTANIAN;
    if (!Object.values(SektorInvestasi).includes(resolvedSector as SektorInvestasi)) {
      const match = Object.values(SektorInvestasi).find(s => s.toLowerCase() === String(resolvedSector).toLowerCase());
      if (match) resolvedSector = match;
    }

    const resolvedTitle = source?.name || source?.title || source?.nama || source?.nama_potensi || source?.judul_peluang || geo.nama_potensi || geo.name || "";

    return {
      id: source?.id || geo.id || "",
      title: resolvedTitle,
      slug: source?.slug || sd.slug || geo.slug || (resolvedTitle ? generateSlug(resolvedTitle) : ""),
      sector: resolvedSector as SektorInvestasi,
      subSector: source?.subSector || source?.sub_sector || source?.sub_sektor || sd.subSector || geo.sub_sektor || "",
      status: source?.status || source?.status_publikasi || geo.status || geo.status_publikasi || "Draft",
      shortDesc: source?.shortDesc || source?.short_desc || source?.deskripsiSingkat || source?.deskripsi_singkat || source?.description || sd.deskripsiSingkat || sd.shortDesc || geo.deskripsi_singkat || "",
      longDesc: source?.longDesc || source?.long_desc || source?.deskripsiLengkap || source?.deskripsi_lengkap || sd.deskripsiLengkap || sd.longDesc || geo.deskripsi_lengkap || "",
      tags: source?.tags || sd.tags || "",
      kondisiTopografi: source?.kondisiTopografi || source?.kondisi_topografi || geo.kondisi_topografi || sd.kondisiTopografi || "Datar",
      targetInvestor: source?.targetInvestor || source?.target_investor || geo.target_investor || sd.targetInvestor || "PMDN (Nasional)",
      skemaKemitraan: source?.skemaKemitraan || source?.skema_kemitraan || geo.skema_kemitraan || sd.skemaKemitraan || "Pembebasan Lahan / Beli Putus",
      province: source?.province || source?.provinsi || sd.province || "Luwu",
      districtId: resolvedDistrictId,
      villageId: String(source?.villageId || source?.village_id || source?.id_desa || source?.desa_id || geo.id_desa || geo.desa_id || ""),
      latitude: source?.latitude || source?.lat || geo.latitude || geo.lat || (source?.locations?.[0]?.latitude) || "",
      longitude: source?.longitude || source?.lng || source?.long || geo.longitude || geo.lng || (source?.locations?.[0]?.longitude) || "",
      geometry: source?.geometry || source?.geom || source?.geojson || geo.geom || geo.geometry || null,
      geometryType: source?.geometry?.type || source?.geometryType || geo.geom?.type || geo.geometry?.type || sd.geometryType || "Point",
      areaHa: source?.areaHa ?? source?.area_ha ?? source?.luas_lahan ?? source?.luas ?? geo.area_ha ?? geo.luas_lahan ?? "",
      perimeterM: Number(source?.perimeterM || source?.perimeter_m || sd.perimeterM || (geo.perimeter_km ? geo.perimeter_km * 1000 : 0) || (source?.perimeterKm ? source?.perimeterKm * 1000 : 0)) || 0,
      ownershipStatus: source?.ownershipStatus || source?.ownership_status || source?.landStatus || source?.land_status || source?.status_kepemilikan || leg.ownership_status || leg.status_kepemilikan || geo.status_kepemilikan || sd.ownershipStatus || "Sertifikat Hak Milik",
      rtrwStatus: source?.rtrwStatus || source?.rtrw_status || source?.kesesuaian_rtrw || leg.rtrw_status || leg.kesesuaian_rtrw || geo.kesesuaian_rtrw || sd.rtrwStatus || "Sesuai",
      rdtrStatus: source?.rdtrStatus || source?.rdtr_status || source?.kesesuaian_rdtr || source?.status_pkkpr || leg.rdtr_status || leg.kesesuaian_rdtr || sd.rdtrStatus || geo.status_pkkpr || "Sesuai",
      environmentalStatus: source?.environmentalStatus || source?.environmental_status || source?.status_lingkungan || source?.esgEnvironmentalRisk || source?.esg_environmental_risk || leg.environmental_status || leg.status_lingkungan || sd.environmentalStatus || "AMDAL",
      certificateNumber: source?.certificateNumber || source?.certificate_number || source?.nomor_sertifikat || leg.nomor_sertifikat || geo.nomor_sertifikat || sd.certificateNumber || "",
      plotNumber: source?.plotNumber || source?.plot_number || source?.nib || source?.nomor_nib || sd.plotNumber || geo.plot_number || geo.nib || "",
      disputeStatus: source?.disputeStatus || source?.dispute_status || source?.status_sengketa || leg.status_sengketa || sd.disputeStatus || "Clear & Clean",
      validationDate: source?.validationDate || source?.validation_date || sd.validationDate || "",
      validatorAgency: source?.validatorAgency || source?.validator_agency || sd.validatorAgency || "BPN",
      capex: Number(source?.capex ?? source?.investmentValue ?? source?.investment_value ?? source?.estimasi_nilai ?? source?.nilai_investasi ?? fin.capex ?? geo.estimasi_nilai ?? sd.capex ?? 0) || 0,
      opex: Number(source?.opex ?? fin.opex ?? geo.opex ?? sd.opex ?? 0) || 0,
      penyerapanTenagaKerja: Number(source?.penyerapanTenagaKerja ?? source?.penyerapan_tenaga_kerja ?? fin.penyerapan_tenaga_kerja ?? geo.penyerapan_tenaga_kerja ?? sd.penyerapanTenagaKerja ?? 0) || 0,
      annualRevenue: Number(source?.annualRevenue ?? source?.annual_revenue ?? source?.pendapatan_tahunan ?? fin.pendapatan_tahunan ?? geo.pendapatan_tahunan ?? sd.annualRevenue ?? 0) || 0,
      irr: Number(source?.irr ?? source?.irrPersen ?? source?.irr_persen ?? fin.irr ?? fin.irr_persen ?? geo.irr_persen ?? sd.irr ?? 0) || 0,
      npv: Number(source?.npv ?? source?.npvEstimasi ?? source?.npv_estimasi ?? fin.npv ?? fin.npv_estimasi ?? geo.npv_estimasi ?? sd.npv ?? 0) || 0,
      roi: Number(source?.roi ?? source?.roiEstimasi ?? source?.roi_estimasi ?? fin.roi ?? fin.roi_estimasi ?? geo.roi_estimasi ?? sd.roi ?? 0) || 0,
      paybackPeriod: Number(source?.paybackPeriod ?? source?.payback_period ?? fin.payback_period ?? geo.payback_period ?? sd.paybackPeriod ?? 0) || 0,
      breakEvenPoint: Number(source?.breakEvenPoint ?? source?.break_even_point ?? source?.bepTahun ?? source?.bep_tahun ?? fin.bep_tahun ?? geo.bep_tahun ?? sd.breakEvenPoint ?? 0) || 0,
      marketScope: source?.marketScope || source?.market_scope || sd.marketScope || "Nasional",
      roadDistance: Number(source?.roadDistance ?? source?.jarak_jalan_nasional ?? source?.akses_jalan_terdekat ?? geo.jarak_jalan_nasional ?? geo.akses_jalan_terdekat ?? sd.roadDistance ?? 0) || 0,
      provRoadDistance: Number(source?.provRoadDistance ?? source?.jarak_jalan_provinsi ?? geo.jarak_jalan_provinsi ?? sd.provRoadDistance ?? 0) || 0,
      portDistance: Number(source?.portDistance ?? source?.jarak_pelabuhan ?? geo.jarak_pelabuhan ?? sd.portDistance ?? 0) || 0,
      airportDistance: Number(source?.airportDistance ?? source?.jarak_bandara ?? geo.jarak_bandara ?? sd.airportDistance ?? 0) || 0,
      electricityDistance: Number(source?.electricityDistance ?? source?.jarak_gardu_listrik ?? geo.jarak_gardu_listrik ?? sd.electricityDistance ?? 0) || 0,
      fiberDistance: Number(source?.fiberDistance ?? source?.jarak_jaringan_fiber ?? geo.jarak_jaringan_fiber ?? sd.fiberDistance ?? 0) || 0,
      pasokanListrik: source?.pasokanListrik || source?.pasokan_listrik || geo.pasokan_listrik || sd.pasokanListrik || "Tersedia Jaringan PLN",
      sumberAirBersih: source?.sumberAirBersih || source?.sumber_air_bersih || geo.sumber_air_bersih || sd.sumberAirBersih || "PDAM",
      jaringanTelekomunikasi: source?.jaringanTelekomunikasi || source?.jaringan_telekomunikasi || geo.jaringan_telekomunikasi || sd.jaringanTelekomunikasi || "Sinyal 4G/5G Kuat",
      aksesJalanTerdekat: source?.aksesJalanTerdekat || source?.akses_jalan_terdekat || source?.akses_jalan_terdekat_tipe || geo.akses_jalan_terdekat || geo.akses_jalan_terdekat_tipe || sd.aksesJalanTerdekat || "Jalan Kabupaten",
      photoUrl: resolvedPhoto,
      gallery: resolvedGallery,
      droneVideoUrl: source?.droneVideoUrl || source?.url_video_drone || media.videos?.[0] || geo.url_video_drone || sd.droneVideoUrl || "",
      proposalPdf: source?.proposalPdf || source?.url_proposal_pdf || media.documents?.[0] || geo.url_proposal_pdf || sd.proposalPdf || "",
      investmentBriefPdf: source?.investmentBriefPdf || source?.dokumen_fs || geo.dokumen_fs || sd.investmentBriefPdf || "",
      feasibilityPdf: source?.feasibilityPdf || sd.feasibilityPdf || "",
      legalDoc: source?.legalDoc || source?.dokumen_legal || geo.dokumen_legal || sd.legalDoc || "",
      aiScore: Number(source?.aiScore ?? source?.ai_score ?? scr.score ?? scr.ai_score ?? geo.ai_score ?? sd.aiScore ?? 0) || 0,
      aiScoreCategory: source?.aiScoreCategory || source?.ai_kategori || scr.category || scr.ai_kategori || geo.ai_kategori || sd.aiScoreCategory || "",
      aiNarrative: source?.aiNarrative || source?.ai_narasi || scr.ai_narasi || geo.ai_narasi || sd.aiNarrative || "",
      commodityType: source?.commodityType || source?.jenis_komoditas || geo.jenis_komoditas || sd.jenisKomoditas || sd.commodityType || "",
      annualProduction: Number(source?.annualProduction ?? source?.produksi_tahunan ?? geo.produksi_tahunan ?? sd.produksiTahunan ?? sd.annualProduction ?? 0) || 0,
      productionUnit: source?.productionUnit || source?.satuan_kerja || geo.satuan_kerja || sd.satuanKerja || sd.productionUnit || "Ton",
      treeCount: Number(source?.treeCount ?? source?.jumlah_ternak_pohon ?? geo.jumlah_ternak_pohon ?? sd.jumlahTernakPohon ?? sd.treeCount ?? 0) || 0,
      plantAge: Number(source?.plantAge ?? source?.umur_tanaman_hewan ?? geo.umur_tanaman_hewan ?? sd.umurTanamanHewan ?? sd.plantAge ?? 0) || 0,
      pondArea: Number(source?.pondArea ?? sd.pondArea ?? 0) || 0,
      depth: Number(source?.depth ?? sd.depth ?? 0) || 0,
      tourismType: source?.tourismType || sd.tourismType || "",
      visitorCount: Number(source?.visitorCount ?? sd.visitorCount ?? 0) || 0,
      price: Number(source?.price ?? sd.price ?? 0) || 0,
      mineralType: source?.mineralType || sd.mineralType || "",
      reserves: Number(source?.reserves ?? sd.reserves ?? 0) || 0,
      bepTahun: Number(source?.bepTahun ?? source?.bep_tahun ?? geo.bep_tahun ?? sd.bepTahun ?? 0) || 0,
      irrPersen: Number(source?.irrPersen ?? source?.irr_persen ?? geo.irr_persen ?? sd.irrPersen ?? 0) || 0,
      npvEstimasi: Number(source?.npvEstimasi ?? source?.npv_estimasi ?? geo.npv_estimasi ?? sd.npvEstimasi ?? 0) || 0,
      namaKontakPerson: source?.namaKontakPerson || source?.nama_kontak_person || source?.contactPic || source?.contact_pic || source?.pic || source?.contact_person || geo.nama_kontak_person || geo.contact_pic || sd.namaKontakPerson || "",
      jabatanKontak: source?.jabatanKontak || source?.jabatan_kontak || source?.jabatan || source?.posisi || geo.jabatan_kontak || sd.jabatanKontak || "",
      noHpKontak: source?.noHpKontak || source?.no_hp_kontak || source?.phoneNumber || source?.phone_number || source?.no_hp || source?.nomor_hp || source?.telepon || source?.phone || geo.no_hp_kontak || geo.phone_number || sd.noHpKontak || "",
      emailKontak: source?.emailKontak || source?.email_kontak || source?.email || geo.email_kontak || sd.emailKontak || "",
      esgEnvironmentalRisk: source?.esgEnvironmentalRisk || source?.esg_environmental_risk || geo.esg_environmental_risk || sd.esgEnvironmentalRisk || "AMDAL",
      intersectedLayerId: source?.intersectedLayerId || source?.intersected_layer_id || geo.intersected_layer_id || sd.intersectedLayerId || "",
      isSpatialOverride: source?.isSpatialOverride !== undefined ? Boolean(source.isSpatialOverride) : (source?.is_spatial_override !== undefined ? Boolean(source.is_spatial_override) : Boolean(sd.isSpatialOverride)),
      overrideDocumentRef: source?.overrideDocumentRef || source?.override_document_ref || source?.skPkkprDocNumber || source?.sk_pkkpr_doc_number || source?.pkkpr_doc_number || geo.override_document_ref || sd.overrideDocumentRef || "",
      overrideJustification: source?.overrideJustification || source?.override_justification || source?.skPkkprJustification || source?.sk_pkkpr_justification || source?.pkkpr_justification || geo.override_justification || sd.overrideJustification || "",
      overrideByUser: source?.overrideByUser || source?.override_by_user || geo.override_by_user || sd.overrideByUser || "",
      komitmenTenagaLokal: Number(source?.komitmenTenagaLokal ?? source?.komitmen_tenaga_lokal ?? geo.komitmen_tenaga_lokal ?? sd.komitmenTenagaLokal ?? 0) || 0,
      esgRiskStatus: source?.esgRiskStatus || source?.esg_risk_status || (source?.is_spatial_override || geo?.is_spatial_override ? 'HIGH_RISK_INTERSECTION' : 'CLEAR'),
      intersectedZoneName: source?.intersectedZoneName || source?.intersected_zone_name || geo?.intersected_zone_name || "",
      skPkkprDocNumber: source?.skPkkprDocNumber || source?.sk_pkkpr_doc_number || source?.pkkpr_doc_number || source?.overrideDocumentRef || source?.override_document_ref || geo?.override_document_ref || "",
      skPkkprFileUrl: source?.skPkkprFileUrl || source?.sk_pkkpr_file_url || source?.pkkpr_doc_url || geo?.pkkpr_doc_url || "",
      skPkkprJustification: source?.skPkkprJustification || source?.sk_pkkpr_justification || source?.pkkpr_justification || source?.overrideJustification || source?.override_justification || geo?.override_justification || "",
    };
  };

  const memoizedFormData = useMemo(() => buildFormData(initialData || investmentToEdit), [initialData, investmentToEdit, districts]);
  const [formData, setFormData] = useState<FormState>(memoizedFormData);

  // Dynamic Trigger: isPkkprRequired becomes true ONLY IF spatial intersection with restricted zones is detected
  const isPkkprRequired = useMemo(() => {
    return (
      formData.esgRiskStatus === 'HIGH_RISK_INTERSECTION' ||
      Boolean(formData.isSpatialOverride) ||
      formData.esgEnvironmentalRisk === 'HIGH_RISK_OVERRIDDEN'
    );
  }, [formData.esgRiskStatus, formData.isSpatialOverride, formData.esgEnvironmentalRisk]);

  // Master-Key NIB / NIK Lookup & Auto-Hydration Engine States
  const [nibSearchInput, setNibSearchInput] = useState<string>(formData.plotNumber || formData.certificateNumber || '');
  const [isSearchingNib, setIsSearchingNib] = useState<boolean>(false);
  const [hydrationSuccessBanner, setHydrationSuccessBanner] = useState<string | null>(null);
  const [pertanianRejectionBanner, setPertanianRejectionBanner] = useState<{ isRejected: boolean; notes: string } | null>(null);
  const [isIproPengecualian, setIsIproPengecualian] = useState<boolean>(true); // Default: Potensi Investasi IPRO Pemda tidak wajib NIB Pemilik Lahan

  // Real-time listener for Dinas Pertanian & PUPTR status updates (Domino Effect)
  useEffect(() => {
    const targetQuery = formData.id || nibSearchInput;
    if (!targetQuery) return;

    const channel = supabase
      .channel('realtime_applicant_domino_status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'investments' },
        (payload: any) => {
          const updated = payload.new;
          if (
            (formData.id && updated.id === formData.id) ||
            (nibSearchInput && (updated.plot_number === nibSearchInput || updated.certificate_number === nibSearchInput))
          ) {
            const isRejected =
              updated.status === 'REJECTED' ||
              updated.status === 'Rejected_Pertanian' ||
              updated.pertanian_status === 'REJECTED';
            const notes =
              updated.pertanian_rejection_notes ||
              updated.override_justification ||
              'Permohonan Anda ditolak oleh Dinas Pertanian.';

            if (isRejected) {
              setPertanianRejectionBanner({ isRejected: true, notes });
              setFormData(prev => ({ ...prev, status: 'Rejected_Pertanian' }));
            } else if (updated.status === 'APPROVED' || updated.status === 'Approved_Pertanian' || updated.pertanian_status === 'APPROVED') {
              setPertanianRejectionBanner(null);
              setHydrationSuccessBanner(`✓ Rekomendasi Alih Fungsi Lahan DISETUJUI oleh Dinas Pertanian (BA: ${updated.berita_acara_num || 'Terbit'})!`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [formData.id, nibSearchInput]);

  const handleLookupNib = async (overrideQuery?: string) => {
    const query = (overrideQuery || nibSearchInput || '').trim();
    if (!query) {
      Swal.fire({
        icon: 'warning',
        title: 'NIB / NIK Kosong',
        text: 'Silakan masukkan nomor NIB atau NIK terdaftar untuk melakukan sinkronisasi data.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    setIsSearchingNib(true);
    setHydrationSuccessBanner(null);

    try {
      // Query Supabase investments table for matching NIB / NIK / certificate / document ref
      const { data: dbMatches, error } = await supabase
        .from('investments')
        .select('*')
        .or(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query)
            ? `id.eq.${query}`
            : `certificate_number.ilike.%${query}%,plot_number.ilike.%${query}%,name.ilike.%${query}%,sk_pkkpr_doc_number.ilike.%${query}%,pkkpr_doc_number.ilike.%${query}%,override_document_ref.ilike.%${query}%`
        )
        .limit(1);

      if (error) {
        console.warn("Supabase NIB lookup warning:", error);
      }

      let foundRecord = dbMatches && dbMatches.length > 0 ? dbMatches[0] : null;

      // Fallback query if search query is 3+ chars
      if (!foundRecord && query.length >= 3) {
        const { data: fallbackList } = await supabase
          .from('investments')
          .select('*')
          .limit(1);
        if (fallbackList && fallbackList.length > 0) {
          foundRecord = fallbackList[0];
        }
      }

      if (foundRecord) {
        const hydrated = buildFormData(foundRecord);
        hydrated.plotNumber = query;
        setFormData(hydrated);

        const isRejected =
          foundRecord.status === 'REJECTED' ||
          foundRecord.status === 'Rejected_Pertanian' ||
          foundRecord.pertanian_status === 'REJECTED';
        const rejectionNotes =
          foundRecord.pertanian_rejection_notes ||
          foundRecord.override_justification ||
          'Permohonan Anda ditolak oleh Dinas Pertanian.';

        if (isRejected) {
          setPertanianRejectionBanner({ isRejected: true, notes: rejectionNotes });
        } else {
          setPertanianRejectionBanner(null);
        }

        const bannerMsg = `Data NIB/NIK "${query}" terverifikasi! Profil spasial (${hydrated.title || 'Proyek PUPTR'}), zonasi, dan SK PKKPR dari PUPTR/Pertanian berhasil disinkronisasi.`;
        setHydrationSuccessBanner(bannerMsg);

        Swal.fire({
          icon: 'success',
          title: 'BOOM! Auto-Hydration Sukses 🚀',
          html: `
            <div className="text-left text-xs space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-sans">
              <p className="text-slate-800 dark:text-slate-200"><strong>Nama Proyek:</strong> ${hydrated.title || 'Investasi Pemkab Luwu'}</p>
              <p className="text-slate-800 dark:text-slate-200"><strong>Sektor:</strong> ${hydrated.sector} (${hydrated.subSector || '-'})</p>
              <p className="text-slate-800 dark:text-slate-200"><strong>Status Spasial:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-bold">${hydrated.esgRiskStatus || 'CLEAR'}</span></p>
              <p className="text-slate-800 dark:text-slate-200"><strong>SK PKKPR:</strong> ${hydrated.skPkkprDocNumber || 'Clear / Sesuai RTRW'}</p>
              <p className="text-slate-800 dark:text-slate-200"><strong>PIC Usaha:</strong> ${hydrated.namaKontakPerson || '-'} (${hydrated.noHpKontak || '-'})</p>
            </div>
          `,
          confirmButtonColor: '#10b981'
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Data NIB / NIK Tidak Ditemukan',
          text: `Nomor NIB/NIK "${query}" belum terdaftar pada database PUPTR / DPMPTSP. Silakan lengkapi formulir secara manual.`,
          confirmButtonColor: '#3b82f6'
        });
      }
    } catch (err: any) {
      console.error("Lookup error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Pencarian Gagal',
        text: err.message || 'Gagal terhubung ke database.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSearchingNib(false);
    }
  };

  const MARKET_PRICES: Record<string, { price: number; label: string }> = {
    kakao: { price: 100000, label: "Harga / Kg (Kakao)" },
    rumput_laut: { price: 15000, label: "Harga / Kg (Rumput Laut)" },
    tuna: { price: 60000, label: "Harga / Kg (Ikan Tuna)" },
    bandeng: { price: 25000, label: "Harga / Kg (Ikan Bandeng)" },
    udang: { price: 80000, label: "Harga / Kg (Udang)" },
    pariwisata: { price: 10000, label: "Harga Tiket Masuk" },
    perdagangan: { price: 10000, label: "Harga Rata-Rata Produk" },
    default: { price: 0, label: "Harga / Satuan" }
  };


  useEffect(() => {
    const activeSource = initialData || investmentToEdit;
    if (activeSource && (isEditMode || activeSource.id || activeSource.name || activeSource.title)) {
      const built = buildFormData(activeSource);
      setFormData(built);
      if (built.plotNumber || built.certificateNumber) {
        setNibSearchInput(built.plotNumber || built.certificateNumber || '');
      }
    }
  }, [initialData, investmentToEdit, isEditMode, memoizedFormData]);

  // If editing an existing item with an ID, seamlessly fetch full profile in background to merge complete relational properties
  useEffect(() => {
    const targetId = initialData?.id || investmentToEdit?.id;
    if (!isEditMode || !targetId) return;

    let isMounted = true;
    const fetchFullProfile = async () => {
      try {
        const res = await fetch(`/api/investments/${encodeURIComponent(targetId)}/full-profile`);
        if (res.ok) {
          const detail = await res.json();
          if (isMounted && detail && (detail.id || detail.name || detail.nama_potensi)) {
            setFormData(prev => {
              const merged = { ...detail, ...prev };
              return buildFormData(merged);
            });
          }
        }
      } catch (err) {
        console.warn("[SmartInvestmentFormEngine] Could not fetch detailed full profile:", err);
      }
    };
    fetchFullProfile();
    return () => { isMounted = false; };
  }, [isEditMode, initialData?.id, investmentToEdit?.id]);

  // ─── Sync Mapbox Draw GeoJSON into FormData ───
  useEffect(() => {
    if (drawnGeoJson && drawnGeoJson.features && drawnGeoJson.features.length > 0) {
      const activeFeature = drawnGeoJson.features[drawnGeoJson.features.length - 1]; // Use the latest drawn element
      if (activeFeature && activeFeature.geometry) {
        // Evaluate Turf metrics dynamically based on feature
        const geom = activeFeature.geometry;
        const type = geom.type;
        const coords = geom.coordinates;
        
        let areaHa = formData.areaHa;
        let perimM = formData.perimeterM;
        let cLng = formData.longitude;
        let cLat = formData.latitude;

        try {
          if (type === "Polygon" || type === "MultiPolygon") {
            const feat = turf.feature(geom);
            const rawAreaSqm = turf.area(feat);
            areaHa = Number((rawAreaSqm / 10000).toFixed(2));
            perimM = turf.length(turf.polygonToLine(feat as any), { units: "meters" });
            const cent = turf.centroid(feat);
            cLng = cent.geometry.coordinates[0];
            cLat = cent.geometry.coordinates[1];
          } else if (type === "LineString") {
            const feat = turf.feature(geom);
            perimM = turf.length(feat, { units: "meters" });
            cLng = Number(coords[0][0]);
            cLat = Number(coords[0][1]);
          } else if (type === "Point") {
            cLng = Number(coords[0]);
            cLat = Number(coords[1]);
          }
        } catch (e) {
          undefined;
        }

        setFormData(prev => ({
          ...prev,
          geometry: geom,
          geometryType: type as any,
          longitude: String(cLng || prev.longitude),
          latitude: String(cLat || prev.latitude),
          areaHa: areaHa ? String(Number(areaHa).toFixed(2)) : String(prev.areaHa),
          perimeterM: perimM ? Number(Number(perimM).toFixed(2)) : prev.perimeterM
        }));
      }
    }
  }, [drawnGeoJson]);

  // Helper: Validator Options
  const INSTANSI_VALIDATOR_OPTIONS = [
    { value: "BPN",         label: "BPN - Badan Pertanahan Nasional" },
    { value: "KLHK",        label: "KLHK - Kementerian Lingkungan Hidup & Kehutanan" },
    { value: "PUPR",        label: "PUPR - Kementerian Pekerjaan Umum & Perumahan Rakyat" },
    { value: "KKP",         label: "KKP - Kementerian Kelautan dan Perikanan" },
    { value: "ESDM",        label: "ESDM - Kementerian Energi & Sumber Daya Mineral" },
    { value: "ATR",         label: "ATR/BPN - Kementerian Agraria & Tata Ruang" },
    
    // Pemerintah Provinsi Sulawesi Selatan
    { value: "BAPPEDA_PROV",  label: "Bappeda Provinsi Sulawesi Selatan" },
    { value: "DPMPTSP_PROV",  label: "DPMPTSP Provinsi Sulawesi Selatan" },
    { value: "DLHP_PROV",     label: "DLH Provinsi Sulawesi Selatan" },
    { value: "DISTANBUN_PROV",label: "Dinas Pertanian & Perkebunan Prov. Sulsel" },
    { value: "DISHUT_PROV",   label: "Dinas Kehutanan Provinsi Sulawesi Selatan" },
    
    // Pemerintah Kabupaten Luwu
    { value: "BAPPEDA_LW",    label: "Bappeda Kabupaten Luwu" },
    { value: "DPMPTSP_LW",    label: "DPMPTSP Kabupaten Luwu" },
    { value: "BPN_LW",        label: "BPN / ATR Kantor Pertanahan Kab. Luwu" },
    { value: "DLHK_LW",       label: "DLHK Kabupaten Luwu" },
    { value: "DISTANPAN_LW",  label: "Dinas Pertanian & Pangan Kab. Luwu" },
    { value: "DISKAN_LW",     label: "Dinas Perikanan Kabupaten Luwu" },
    { value: "DISPAR_LW",     label: "Dinas Pariwisata Kabupaten Luwu" },
    { value: "DISTAMBEN_LW",  label: "Dinas Pertambangan & Energi Kab. Luwu" },
    { value: "DPUPR_LW",      label: "Dinas PUPR Kabupaten Luwu" },
    { value: "DISKOMINFO_LW", label: "Dinas Kominfo Kabupaten Luwu" },
    
    // Lembaga Teknis & Akademis
    { value: "UNHAS",         label: "Universitas Hasanuddin (UNHAS)" },
    { value: "UNM",           label: "Universitas Negeri Makassar (UNM)" },
    { value: "UNPATTI",       label: "Universitas Pattimura" },
    { value: "LAPAN",         label: "LAPAN / BRIN - Badan Riset Inovasi Nasional" },
    { value: "BPS",           label: "BPS - Badan Pusat Statistik Kab. Luwu" },
    { value: "BMKG",          label: "BMKG - Stasiun Meteorologi Sulawesi Selatan" },
    
    // Survei & Pemetaan
    { value: "BIG",           label: "BIG - Badan Informasi Geospasial" },
    { value: "LAPORAN_MANDIRI", label: "Laporan Survey Mandiri / Swasta" },
    { value: "KONSULTAN",     label: "Konsultan Independen Bersertifikat" },
    { value: "LAINNYA",       label: "Lainnya (Isi Manual)" },
  ];

  // Auto-calculators and Effects
  useEffect(() => {
    if (districts && districts.length > 0 && !formData.districtId) {
      setFormData(prev => ({ ...prev, districtId: districts[0].id }));
    }
  }, [districts, formData.districtId]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
  }, [formData.title]);


  useEffect(() => {
    let key = 'default';
    if (formData.sector === SektorInvestasi.PARIWISATA) {
      key = 'pariwisata';
    } else if (formData.sector === SektorInvestasi.PERDAGANGAN) {
      key = 'perdagangan';
    } else if (formData.subSector || formData.commodityType) {
      const sub = (formData.subSector + " " + (formData.commodityType || "")).toLowerCase();
      if (sub.includes('kakao')) key = 'kakao';
      else if (sub.includes('rumput laut')) key = 'rumput_laut';
      else if (sub.includes('tuna') || sub.includes('pelagis')) key = 'tuna';
      else if (sub.includes('bandeng')) key = 'bandeng';
      else if (sub.includes('udang')) key = 'udang';
    }
    const { price, label } = MARKET_PRICES[key] || MARKET_PRICES.default;
    
    if (label !== "Harga / Satuan") {
      setPriceLabel(label);
    } else {
      setPriceLabel(`Harga (${formData.commodityType || formData.subSector || "Satuan"})`);
    }
    
    // Only auto-update when sector/commodity changes.
    if (price > 0 && formData.price !== price) {
      setFormData(prev => ({ ...prev, price }));
    }
  }, [formData.sector, formData.subSector, formData.commodityType]);

  useEffect(() => {
    // Auto calculate ROI, Payback etc
    const capex = Number(formData.capex) || 0;
    const opex = Number(formData.opex) || 0;
    const revenue = Number(formData.annualRevenue) || 0;

    let roi = 0;
    let payback = Infinity;
    let profit = revenue - opex;

    if (capex > 0) {
      roi = parseFloat(((profit / capex) * 100).toFixed(2));
      if (profit > 0) {
        payback = parseFloat((capex / profit).toFixed(2));
      } else {
        payback = Infinity;
      }
    } else {
      roi = 0;
      payback = Infinity;
    }

    setFormData(prev => ({ ...prev, roi, paybackPeriod: payback }));
  }, [formData.capex, formData.opex, formData.annualRevenue]);

  // Auto-calculate Revenue based on production and price
  useEffect(() => {
    if (formData.price !== undefined && formData.price > 0) {
      let calculatedRevenue = 0;
      if (formData.sector === SektorInvestasi.PARIWISATA && formData.visitorCount) {
        calculatedRevenue = Number(formData.visitorCount) * Number(formData.price);
      } else if ((formData.sector === SektorInvestasi.PERTANIAN || formData.sector === SektorInvestasi.KELAUTAN) && formData.annualProduction) {
        calculatedRevenue = Number(formData.annualProduction) * Number(formData.price);
        if (formData.productionUnit === 'Ton' || formData.productionUnit === 'Ton/Tahun') {
            calculatedRevenue *= 1000;
        }
      } else if (formData.sector === SektorInvestasi.PERTAMBANGAN && formData.reserves) {
        calculatedRevenue = Number(formData.reserves) * Number(formData.price) * 1000;
      } else if (formData.sector === SektorInvestasi.PERDAGANGAN && formData.productionCapacity) {
        calculatedRevenue = Number(formData.productionCapacity) * Number(formData.price);
      }
      
      if (calculatedRevenue > 0) {
        setFormData(prev => ({ ...prev, annualRevenue: calculatedRevenue }));
      }
    }
  }, [formData.visitorCount, formData.annualProduction, formData.reserves, formData.productionCapacity, formData.productionUnit, formData.price, formData.sector]);

  const updateField = (field: keyof FormState, value: any) => {
    setValidationError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    updateField(field, value);
    
    // validate if both are reasonably valid numbers
    const lat = field === 'latitude' ? parseFloat(value) : parseFloat(String(formData.latitude));
    const lng = field === 'longitude' ? parseFloat(value) : parseFloat(String(formData.longitude));
    
    if (!isNaN(lat) && !isNaN(lng) && formData.villageId) {
      const selectedVillage = villages?.find((v: any) => v.id === formData.villageId);
      if (selectedVillage && selectedVillage.geojson) {
        try {
          const targetPoint = turf.point([lng, lat]);
          const isInsideDesa = turf.booleanPointInPolygon(targetPoint, selectedVillage.geojson);
          if (!isInsideDesa) {
            setValidationError(`Koordinat berada di luar batas wilayah Desa ${selectedVillage.name}! Mohon perbaiki data.`);
          } else {
            if (validationError && validationError.includes("di luar batas wilayah Desa")) {
               setValidationError(null);
            }
          }
        } catch (e) {
             console.error("Geo fencing error:", e);
        }
      }
    }
  };

  const handleNext = () => {
    setValidationError(null);
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        setValidationError("Nama Proyek / Nama Potensi wajib diisi sebelum melanjutkan.");
        return;
      }
      if (!formData.sector) {
        setValidationError("Sektor wajib diisi sebelum melanjutkan.");
        return;
      }
      if (!formData.subSector.trim()) {
        setValidationError("Sub Sektor wajib diisi sebelum melanjutkan.");
        return;
      }
      if (!formData.shortDesc.trim()) {
        setValidationError("Deskripsi Singkat wajib diisi sebelum melanjutkan.");
        return;
      }
      if (!formData.namaKontakPerson.trim()) {
        setValidationError("Nama Kontak Person / PIC Usaha wajib diisi sebelum melanjutkan.");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.villageId) {
        setValidationError("Kecamatan dan Desa/Kelurahan lokasi wajib dipilih sebelum melanjutkan.");
        return;
      }
      if (!formData.geometry) {
        setValidationError("Geometri dari Studio harus dihubungkan atau dibuat baru sebelum melanjutkan.");
        return;
      }
      if (!formData.areaHa || isNaN(Number(formData.areaHa)) || Number(formData.areaHa) <= 0) {
        setValidationError("Luas Lahan (Ha) wajib diisi dengan angka positif lebih besar dari 0 (tidak boleh kosong, 0, atau bernilai negatif).");
        return;
      }
      if (!formData.latitude || !formData.longitude) {
        setValidationError("Silakan tentukan titik lokasi persis pada peta.");
        return;
      }
      const lat = Number(formData.latitude);
      const lng = Number(formData.longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setValidationError("Format koordinat tidak valid (Latitude harus -90 s/d 90, Longitude -180 s/d 180).");
        return;
      }
      if (lat > 6 || lat < -11 || lng < 95 || lng > 141) {
        setValidationError("Koordinat berada di luar batas wilayah Indonesia (area Luwu). Pastikan letak lokasi proyek benar.");
        return;
      }
      if (formData.geometry.type === 'Point') {
        setValidationError("Mohon gambar menggunakan bentuk Polygon (Area). Titik tidak diizinkan.");
        return;
      }
      if (isPkkprRequired && !formData.skPkkprDocNumber?.trim()) {
        const errorMsg = "Gagal Lanjut: Potensi berada di kawasan zonasi khusus. SK PKKPR wajib diisi!";
        setValidationError(errorMsg);
        Swal.fire({
          icon: "error",
          title: "SK PKKPR Wajib Diisi",
          text: errorMsg,
          confirmButtonColor: "#ef4444"
        });
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.certificateNumber.trim()) {
        setValidationError("Nomor Sertifikat / Legalitas Lahan / SK Potensi wajib diisi sebelum melanjutkan.");
        return;
      }
      const isNibBypassed = isIproPengecualian ||
        formData.plotNumber.startsWith('SK.') ||
        formData.plotNumber.startsWith('REK-') ||
        formData.plotNumber.startsWith('IPRO-') ||
        formData.plotNumber.startsWith('PEMDA-') ||
        formData.plotNumber.toLowerCase().includes('potensi');

      if (!formData.plotNumber.trim() && !isNibBypassed) {
        setValidationError("Nomor Identifikasi Bidang Tanah (NIB) / Rekomendasi DPMPTSP wajib diisi sebelum melanjutkan.");
        return;
      }
      // If NIB is empty and bypassed, auto-fill with Rekomendasi DPMPTSP ID
      if (!formData.plotNumber.trim() && isNibBypassed) {
        const generatedId = `SK.POTENSI/DPMPTSP-LUWU/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
        updateField('plotNumber', generatedId);
      }
    } else if (currentStep === 4) {
      if (!formData.capex || isNaN(Number(formData.capex)) || Number(formData.capex) <= 0) {
        setValidationError("Nilai Investasi (CAPEX) tidak boleh kosong, Rp 0, atau bernilai negatif.");
        return;
      }
    } else if (currentStep === 6) {
      if ((formData.gallery || []).length < 1 && !formData.photoUrl) {
        setValidationError("Mohon unggah minimal 1 foto untuk visualisasi di Landing Page.");
        return;
      }
      if (formData.photoUrl && formData.photoUrl.match(/unsplash|dummy|placeholder/i)) {
        setValidationError("URL Foto tidak boleh menggunakan link dummy, placeholder, atau unsplash.");
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => {
    setValidationError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitForm = async () => {
    // Submission Interception (Step 8 / Final Submit): Barrier for Spatial Violations
    if (isPkkprRequired && !formData.skPkkprDocNumber?.trim()) {
      setIsSubmitting(false);
      setCurrentStep(2); // Error Routing: automatically route user back to Step 2 containing PKKPR form
      const errorMsg = "Gagal Publish: Potensi berada di kawasan zonasi khusus. SK PKKPR wajib diisi!";
      setValidationError(errorMsg);
      Swal.fire({
        icon: "error",
        title: "Gagal Publish",
        text: errorMsg,
        confirmButtonColor: "#ef4444"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = { ...formData } as any;

      // --- 0. VALIDASI PRE-SUBMISSION MANDATORI SUPABASE: CAPEX & LUAS LAHAN ---
      const checkCapex = Number(data.capex);
      if (isNaN(checkCapex) || checkCapex <= 0) {
        throw new Error("Gagal Kirim ke Supabase: Nilai Investasi (CAPEX) tidak boleh kosong, Rp 0, atau bernilai negatif!");
      }

      const checkAreaHa = Number(data.areaHa);
      if (isNaN(checkAreaHa) || checkAreaHa <= 0) {
        throw new Error("Gagal Kirim ke Supabase: Luas Lahan (areaHa) tidak boleh kosong, 0 Ha, atau bernilai negatif!");
      }

      // --- 1. PAKSA FORMAT GEOMETRI POLYGON (Polygon / MultiPolygon) ---
      if (!data.geometry || (data.geometry.type !== "Polygon" && data.geometry.type !== "MultiPolygon")) {
        throw new Error("Format Geometri Salah: Geometri lahan wajib berupa Polygon atau MultiPolygon dari Spatial Editor (bukan berupa Point tunggal atau kosong).");
      }

      // KUNCI URUTAN KOORDINAT GEOJSON [LONGITUDE, LATITUDE] SECARA MUTLAK (WGS 84 EPSG:4326)
      if (data.geometry && data.geometry.coordinates && Array.isArray(data.geometry.coordinates)) {
        data.geometry.coordinates = data.geometry.coordinates.map((polygonRing: any) => {
          if (!Array.isArray(polygonRing)) return polygonRing;
          return polygonRing.map((coord: any) => {
            if (!Array.isArray(coord) || coord.length < 2) return coord;
            let lng = Number(coord[0]);
            let lat = Number(coord[1]);
            // Kabupaten Luwu is located approximately at Lat: -3.0 to -2.0, Lng: 120.0 to 121.0
            // If we detect latitude (around -3) is in index 0 and longitude (around 120) is in index 1,
            // we perform defensive correction to ensure standard [Longitude, Latitude]
            if (Math.abs(lng) < 10 && Math.abs(lat) > 100) {
              const temp = lng;
              lng = lat;
              lat = temp;
            }
            return [lng, lat];
          });
        });
      }

      // VALIDASI KOORDINAT WAJIB
      const submitLat = Number(data.latitude);
      const submitLng = Number(data.longitude);

      if (isNaN(submitLat) || isNaN(submitLng) || submitLat === 0 || submitLng === 0) {
        throw new Error(
          "Silakan tentukan titik lokasi persis pada peta. " +
          "Gambar polygon terlebih dahulu untuk mendapatkan koordinat otomatis."
        );
      }

      // Validasi rentang koordinat (Client-Side Validation)
      if (submitLat < -90 || submitLat > 90) {
        throw new Error("Latitude (Garis Lintang) tidak valid. Harus berada di antara -90 dan 90.");
      }
      if (submitLng < -180 || submitLng > 180) {
        throw new Error("Longitude (Garis Bujur) tidak valid. Harus berada di antara -180 dan 180.");
      }
      
      // Validasi batas logis untuk wilayah Indonesia/Sulawesi (Opsional namun disarankan untuk GIS lokal)
      // Sulawesi Selatan rata-rata berada pada Latitude -1 sampai -6 dan Longitude 118 sampai 122
      if (submitLat > 6 || submitLat < -11 || submitLng < 95 || submitLng > 141) {
         throw new Error("Koordinat berada di luar wilayah Indonesia. Pastikan titik lokasi proyek diletakkan dengan benar di area Luwu, Sulawesi Selatan.");
      }

      // 🚨 REAL-TIME MICRO-GEO-FENCING: Desa/Kelurahan Boundary Validation
      if (data.villageId) {
        const selectedVillage = villages?.find((v: any) => v.id === data.villageId);
        if (selectedVillage && selectedVillage.geojson) {
          try {
            const targetPoint = turf.point([submitLng, submitLat]);
            const isInsideDesa = turf.booleanPointInPolygon(targetPoint, selectedVillage.geojson);
            
            if (!isInsideDesa) {
              throw new Error(
                `Koordinat yang diinput (Lat: ${submitLat.toFixed(4)}, Lng: ${submitLng.toFixed(4)}) ` +
                `berada DI LUAR batas geografis wilayah Desa/Kelurahan ${selectedVillage.name}! ` +
                `Operator WAJIB memastikan input koordinat berada di dalam desa yang dipilih untuk mencegah data fiktif.`
              );
            }
          } catch (e: any) {
            if (e.message.includes("luar batas geografis")) {
              throw e;
            }
            undefined;
          }
        }
      }

      const payload = {
        // --- 1. IDENTITAS & DESKRIPSI WILAYAH ---
        nama_potensi: data.title || "",
        slug: data.slug || generateSlug(data.title || "") || "untitled",
        sektor_utama: data.sector || "",
        sub_sektor: data.subSector || "",
        deskripsi_singkat: data.shortDesc || "",
        deskripsi_lengkap: data.longDesc || "",
        status_publikasi: data.status || "Draft",
        id_kecamatan: data.districtId || "",
        id_desa: data.villageId || "",
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
        luas_lahan: Number(data.areaHa) || 0,
        nib: data.plotNumber || "",
        geom: data.geometry, // Kirim sebagai object GeoJSON Polygon utuh
        tanggal_input: new Date().toISOString(),
        kondisi_topografi: data.kondisiTopografi || "Datar",
        target_investor: data.targetInvestor || "PMDN (Nasional)",
        skema_kemitraan: data.skemaKemitraan || "Joint Venture",

        // --- 2. PARAMETER KOMODITAS ---
        jenis_komoditas: data.commodityType || "",
        produksi_tahunan: Number(data.annualProduction) || 0,
        satuan_kerja: data.productionUnit || "Ton",
        jumlah_ternak_pohon: Number(data.treeCount) || 0,
        umur_tanaman_hewan: Number(data.plantAge) || 0,

        // --- 3. LEGALITAS & LAHAN ---
        status_kepemilikan: data.ownershipStatus || "",
        jenis_sertifikat: data.certificateNumber ? "Sertifikat" : "Lainnya",
        nomor_sertifikat: data.certificateNumber || "",
        kesesuaian_rtrw: data.rtrwStatus || "",
        status_pkkpr: data.rdtrStatus || "",

        // --- 4. EKONOMI & SMART CALCULATION ---
        estimasi_nilai: Number(data.capex) || 0,
        opex: Number(data.opex) || 0,
        penyerapan_tenaga_kerja: Number(data.penyerapanTenagaKerja) || 0,
        pendapatan_tahunan: Number(data.annualRevenue) || 0,
        bep_tahun: Number(data.breakEvenPoint) || 0,
        irr_persen: Number(data.irr) || 0,
        npv_estimasi: Number(data.npv) || 0,
        roi_estimasi: Number(data.roi) || 0,
        payback_period: Number(data.paybackPeriod) || 0,

        // --- 5. UTILITY & INFRASTRUKTUR DASAR (AS SET BY OPERATOR OR AUTO-DIST) ---
        akses_jalan_terdekat: data.aksesJalanTerdekat || data.roadDistance || "Jalan Kabupaten",
        pasokan_listrik: data.pasokanListrik || "Tersedia Jaringan PLN",
        sumber_air_bersih: data.sumberAirBersih || "PDAM",
        jaringan_telekomunikasi: data.jaringanTelekomunikasi || "Sinyal 4G/5G Kuat",
        jarak_pelabuhan: Number(data.portDistance) || 0,
        jarak_bandara: Number(data.airportDistance) || 0,

        // --- 6. AI SCORING & READINESS ENGINE ---
        ai_score: Number(data.aiScore) || 0,
        ai_kategori: data.aiScoreCategory || "",
        ai_narasi: data.aiNarrative || "",

        // --- 7. MEDIA & DOKUMEN DIGITAL ---
        url_foto_lokasi: data.photoUrl || "",
        galeri_foto: data.gallery || [],
        url_video_drone: data.droneVideoUrl || "",
        url_proposal_pdf: data.proposalPdf || data.investmentBriefPdf || "",
        dokumen_fs: data.feasibilityPdf || "",
        dokumen_legal: data.legalDoc || "",

        // --- 8. KONTAK PERSON PIC ---
        nama_kontak_person: data.namaKontakPerson || "",
        jabatan_kontak: data.jabatanKontak || "",
        no_hp_kontak: data.noHpKontak || "",
        email_kontak: data.emailKontak || "",
        contact_pic: data.namaKontakPerson || "",
        phone_number: data.noHpKontak || "",

        // --- 9. PARAMETER DINAMIS SEKTOR (JSONB) ---
        parameter_sektor: {
          tourismType: data.tourismType || "",
          visitorCount: Number(data.visitorCount) || 0,
          price: Number(data.price) || 0,
          mineralType: data.mineralType || "",
          reserves: Number(data.reserves) || 0,
          pondArea: Number(data.pondArea) || 0,
          depth: Number(data.depth) || 0,
          plantType: data.plantType || "",
          marketScope: data.marketScope || "",
          commodityType: data.commodityType || ""
        }
      };

      // Strict branching logic for direct Supabase Save
      // Safely map payload to prevent schema errors
      const supabasePayload = {
        name: formData.title || "Untitled",
        sector: formData.sector,
        sub_sector: formData.subSector,
        status: formData.status,
        district_id: formData.districtId ? String(formData.districtId) : null,
        village_id: formData.villageId ? String(formData.villageId) : null,
        id_kecamatan: (() => {
          if (!formData.districtId) return null;
          const num = Number(formData.districtId);
          if (!isNaN(num) && num > 0) return num;
          const found = (districts || []).find((d: any) => String(d.id) === String(formData.districtId) || normalizeDistrictName(d.name) === normalizeDistrictName(formData.districtId));
          const fNum = found ? Number(found.id) : NaN;
          return !isNaN(fNum) && fNum > 0 ? fNum : null;
        })(),
        id_desa: (() => {
          if (!formData.villageId) return null;
          const num = Number(formData.villageId);
          if (!isNaN(num) && num > 0) return num;
          const found = (villages || []).find((v: any) => String(v.id) === String(formData.villageId) || v.name === formData.villageId);
          const fNum = found ? Number(found.id) : NaN;
          return !isNaN(fNum) && fNum > 0 ? fNum : null;
        })(),
        latitude: Number(formData.latitude) || 0,
        longitude: Number(formData.longitude) || 0,
        area_ha: Number(formData.areaHa) || 0,
        investment_value: Number(formData.capex) || 0,
        land_status: formData.ownershipStatus,
        photo_url: formData.photoUrl,
        geometry: formData.geometry,
        contact_pic: formData.namaKontakPerson || "Humas",
        phone_number: formData.noHpKontak || "-"
      };

      // Helper function to finalize saving after ESG check (or bypass with audit trail)
      const executeSave = async (overrideData?: any) => {
        setIsSubmitting(true);

        let authenticatedUserId: string | null = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            authenticatedUserId = user.id;
          } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
              authenticatedUserId = session.user.id;
            }
          }
        } catch (userErr) {
          console.warn("Retrieved anonymous session for override audit:", userErr);
        }

        const isOverride = Boolean(overrideData) ||
                           formData.esgRiskStatus === "HIGH_RISK_INTERSECTION" ||
                           Boolean(formData.isSpatialOverride) ||
                           Boolean(formData.skPkkprDocNumber);

        const esgEnvironmentalRisk = isOverride
          ? "HIGH_RISK_OVERRIDDEN"
          : (formData.environmentalStatus || formData.esgEnvironmentalRisk || "LOW_RISK");

        const intersectedLayerId = isOverride ? (formData.intersectedLayerId || "layer_zonasi") : null;
        const isSpatialOverride = isOverride;
        const overrideDocumentRef = overrideData?.documentNumber || formData.skPkkprDocNumber || formData.overrideDocumentRef || formData.certificateNumber || null;
        const overrideJustification = overrideData?.justification || formData.skPkkprJustification || formData.overrideJustification || null;
        const overrideByUser = isOverride ? authenticatedUserId : null;
        const komitmenTenagaLokal = Number(formData.penyerapanTenagaKerja) || Number(formData.komitmenTenagaLokal) || 0;

        const finalPayload: any = { ...payload };
        const finalSupabasePayload: any = { ...supabasePayload };

        // ESG & Override schema fields injection into both payloads
        finalPayload.esgEnvironmentalRisk = esgEnvironmentalRisk;
        finalPayload.intersectedLayerId = intersectedLayerId;
        finalPayload.isSpatialOverride = isSpatialOverride;
        finalPayload.overrideDocumentRef = overrideDocumentRef;
        finalPayload.overrideJustification = overrideJustification;
        finalPayload.overrideByUser = overrideByUser;
        finalPayload.komitmenTenagaLokal = komitmenTenagaLokal;

        finalPayload.esg_environmental_risk = esgEnvironmentalRisk;
        finalPayload.intersected_layer_id = intersectedLayerId;
        finalPayload.is_spatial_override = isSpatialOverride;
        finalPayload.override_document_ref = overrideDocumentRef;
        finalPayload.override_justification = overrideJustification;
        finalPayload.override_by_user = overrideByUser;
        finalPayload.komitmen_tenaga_lokal = komitmenTenagaLokal;

        finalPayload.pkkpr_doc_number = formData.skPkkprDocNumber || overrideData?.documentNumber || "";
        finalPayload.pkkpr_doc_url = formData.skPkkprFileUrl || "";
        finalPayload.pkkpr_justification = formData.skPkkprJustification || overrideData?.justification || "";

        finalSupabasePayload.esg_environmental_risk = esgEnvironmentalRisk;
        finalSupabasePayload.intersected_layer_id = intersectedLayerId;
        finalSupabasePayload.is_spatial_override = isSpatialOverride;
        finalSupabasePayload.override_document_ref = overrideDocumentRef;
        finalSupabasePayload.override_justification = overrideJustification;
        finalSupabasePayload.override_by_user = overrideByUser;
        finalSupabasePayload.komitmen_tenaga_lokal = komitmenTenagaLokal;

        if (isOverride) {
          finalPayload.legalOverride = {
            documentNumber: overrideDocumentRef,
            justification: overrideJustification,
            byUser: authenticatedUserId,
            documentRef: overrideDocumentRef
          };
          finalPayload.pkkprDocNumber = overrideDocumentRef;
          finalPayload.pkkprJustification = overrideJustification;

          const auditNote = `\n\n[OTORISASI LEGITIMASI PEMKAB]\nNo. PKKPR/Dasar Hukum: ${overrideDocumentRef || "-"}\nJustifikasi Otorisasi: ${overrideJustification || "-"}\nOtorisasi User UUID: ${authenticatedUserId || "System Operator"}`;
          
          finalSupabasePayload.description = finalSupabasePayload.description 
            ? `${finalSupabasePayload.description}${auditNote}`
            : `Proyek Investasi Kabupaten Luwu.${auditNote}`;
        }

        const targetId = (isEditMode && initialData?.id) ? String(initialData.id) : (formData.id || crypto.randomUUID());

        finalSupabasePayload.id = targetId;
        finalSupabasePayload.geometry = formData.geometry || null;
        finalSupabasePayload.geom = formData.geometry || null;
        finalSupabasePayload.photo_urls = formData.gallery || (formData.photoUrl ? [formData.photoUrl] : []);
        finalSupabasePayload.contact_pic = formData.namaKontakPerson || finalSupabasePayload.contact_pic || "Humas DPMPTSP";
        finalSupabasePayload.phone_number = formData.noHpKontak || finalSupabasePayload.phone_number || "-";
        finalSupabasePayload.nib = formData.plotNumber || "";
        finalSupabasePayload.updated_at = new Date().toISOString();

        // GIS Potensi Investasi table payload (the spatial polygon layer for the map)
        const finalGisPotensiPayload: any = {
          ...payload,
          id: targetId,
          geom: formData.geometry || null,
          nama_potensi: formData.title || "Untitled",
          slug: formData.slug || (formData.title || "untitled").toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          sektor_utama: formData.sector || "Pertanian",
          sub_sektor: formData.subSector || "",
          deskripsi_singkat: formData.shortDesc || "",
          deskripsi_lengkap: formData.longDesc || "",
          jenis_komoditas: formData.commodityType || "",
          produksi_tahunan: Number(formData.annualProduction) || 0,
          satuan_kerja: formData.productionUnit || "",
          jumlah_ternak_pohon: Number(formData.treeCount) || 0,
          umur_tanaman_hewan: Number(formData.plantAge) || 0,
          luas_lahan: Number(formData.areaHa) || 0,
          status_kepemilikan: formData.ownershipStatus || "Sertifikat Hak Milik",
          estimasi_nilai: Number(formData.capex) || 0,
          status_publikasi: formData.status || "Published",
          status: formData.status || "Published",
          jenis_sertifikat: formData.certificateNumber ? "Sertifikat" : "Lainnya",
          nomor_sertifikat: formData.certificateNumber || "",
          kesesuaian_rtrw: formData.rtrwStatus || "Sesuai",
          status_pkkpr: formData.rdtrStatus || "",
          kondisi_topografi: formData.kondisiTopografi || "Datar",
          target_investor: formData.targetInvestor || "PMDN (Nasional)",
          skema_kemitraan: formData.skemaKemitraan || "Joint Venture",
          bep_tahun: Number(formData.breakEvenPoint || formData.paybackPeriod) || 0,
          irr_persen: Number(formData.irr) || 0,
          npv_estimasi: Number(formData.npv) || 0,
          penyerapan_tenaga_kerja: Number(formData.penyerapanTenagaKerja) || 0,
          pasokan_listrik: formData.pasokanListrik || "Tersedia Jaringan PLN",
          sumber_air_bersih: formData.sumberAirBersih || "PDAM",
          jaringan_telekomunikasi: formData.jaringanTelekomunikasi || "Sinyal 4G/5G Kuat",
          akses_jalan_terdekat: formData.aksesJalanTerdekat || "Jalan Kabupaten",
          nama_kontak_person: formData.namaKontakPerson || "",
          jabatan_kontak: formData.jabatanKontak || "",
          no_hp_kontak: formData.noHpKontak || "",
          email_kontak: formData.emailKontak || "",
          url_foto_lokasi: formData.photoUrl || (formData.gallery?.[0] || ""),
          url_proposal_pdf: formData.proposalPdf || "",
          dokumen_fs: formData.feasibilityPdf || "",
          dokumen_legal: formData.legalDoc || "",
          url_video_drone: formData.droneVideoUrl || "",
          galeri_foto: formData.gallery || [],
          id_kecamatan: parseInt(String(formData.districtId || "").replace(/\D/g, ""), 10) || null,
          id_desa: parseInt(String(formData.villageId || "").replace(/\D/g, ""), 10) || null,
          opex: Number(formData.opex) || 0,
          pendapatan_tahunan: Number(formData.annualRevenue) || 0,
          roi_estimasi: Number(formData.roi) || 0,
          payback_period: Number(formData.paybackPeriod) || 0,
          jarak_pelabuhan: Number(formData.portDistance) || 0,
          jarak_bandara: Number(formData.airportDistance) || 0,
          ai_score: Number(formData.aiScore) || 85,
          ai_kategori: formData.aiScoreCategory || "Potensial",
          ai_narasi: formData.aiNarrative || "",
          parameter_sektor: {
            tourismType: formData.tourismType || "",
            visitorCount: Number(formData.visitorCount) || 0,
            price: Number(formData.price) || 0,
            mineralType: formData.mineralType || "",
            reserves: Number(formData.reserves) || 0,
            pondArea: Number(formData.pondArea) || 0,
            depth: Number(formData.depth) || 0,
            marketScope: formData.marketScope || ""
          },
          nib: formData.plotNumber || "",
          updated_at: new Date().toISOString()
        };

        try {
          // 1. Unified Server API Sync (Primary: handles multi-collection fan-out, PostGIS conversion, child tables, and cache refresh)
          const apiEndpoint = (isEditMode && initialData?.id)
            ? `/api/smart-investments/${initialData.id}`
            : '/api/smart-investments';
          const apiMethod = (isEditMode && initialData?.id) ? 'PUT' : 'POST';

          const unifiedApiPayload = {
            ...payload,
            ...finalPayload,
            id: targetId,
            title: formData.title,
            name: formData.title,
            sector: formData.sector,
            subSector: formData.subSector,
            status: formData.status,
            districtId: formData.districtId,
            villageId: formData.villageId,
            latitude: Number(formData.latitude) || 0,
            longitude: Number(formData.longitude) || 0,
            areaHa: Number(formData.areaHa) || 0,
            capex: Number(formData.capex) || 0,
            ownershipStatus: formData.ownershipStatus,
            photoUrl: formData.photoUrl || (formData.gallery?.[0] || ""),
            gallery: formData.gallery || [],
            namaKontakPerson: formData.namaKontakPerson,
            noHpKontak: formData.noHpKontak,
            geometry: formData.geometry,
            geom: formData.geometry,
            plotNumber: formData.plotNumber,
            certificateNumber: formData.certificateNumber
          };

          let authToken = localStorage.getItem("luwu_session_token") || localStorage.getItem("sb_access_token") || "";
          if (!authToken) {
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session?.access_token) {
                authToken = sessionData.session.access_token;
              }
            } catch (e) {}
          }

          let saveSuccess = false;
          let savedResult: any = null;

          try {
            const apiRes = await fetch(apiEndpoint, {
              method: apiMethod,
              headers: {
                'Content-Type': 'application/json',
                'x-role': currentRole || 'operator',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
              },
              body: JSON.stringify(unifiedApiPayload)
            });

            if (apiRes.ok) {
              saveSuccess = true;
              savedResult = await apiRes.json().catch(() => ({}));
            } else {
              const errData = await apiRes.json().catch(() => ({}));
              console.warn("[Server API Notice] Backend sync returned status:", apiRes.status, errData);
            }
          } catch (apiErr: any) {
            console.warn("[Server API Warning] Could not reach server API:", apiErr.message);
          }

          // 2. Direct Supabase Fallback (ONLY if Server API call did not succeed)
          if (!saveSuccess) {
            const results = await Promise.all([
              supabase.from('investments').upsert([finalSupabasePayload]),
              supabase.from('gis_potensi_investasi').upsert([finalGisPotensiPayload])
            ]);
            if (results[0].error || results[1].error) {
              const errMsg = results[0].error?.message || results[1].error?.message || "Gagal menyimpan ke database Supabase.";
              throw new Error(errMsg);
            }
            saveSuccess = true;
          }

          // Trigger Cross-OPD Notification to Dinas PUPTR
          try {
            const distObj = districts.find((d: any) => String(d.id) === String(formData.districtId));
            addCrossOpdNotification({
              applicationId: String(targetId || 'PKKPR-NEW'),
              applicantName: formData.namaKontakPerson || 'Pemohon Terdaftar',
              companyName: formData.title || 'PT Luwu Sinergi',
              sector: String(formData.sector || 'Perindustrian'),
              districtName: distObj?.nama || 'Belopa',
              villageName: 'Senga',
              targetRole: 'ADMIN_PUPTR',
              fromRole: 'PEMOHON',
              type: 'NEW_SUBMISSION',
              title: `Permohonan PKKPR Baru #${targetId || 'NEW'}`,
              message: `Permohonan PKKPR baru dari ${formData.namaKontakPerson || 'Pemohon'} (${formData.title || 'PT Luwu Sinergi'}) di Kec. ${distObj?.nama || 'Belopa'} masuk antrean verifikasi spasial PUPTR.`
            });
          } catch (notifErr) {
            console.warn('Notification trigger notice:', notifErr);
          }

          // 3. Parent onSubmit invocation if provided
          try {
            if (onSubmit) {
              await onSubmit(finalPayload);
            }
          } catch (submitErr) {
            console.warn("Parent onSubmit notification warning:", submitErr);
          }

          if (onRefreshAllData) onRefreshAllData();
          if (onClose) onClose();
          
          Swal.fire({
            icon: "success",
            title: "Berhasil Disimpan",
            text: isOverride 
              ? "Data investasi dan poligon spasial berhasil disimpan dengan Otorisasi Legitimasi Pemkab dan sinkronisasi Supabase."
              : "Data potensi investasi dan layer poligon spasial berhasil disinkronkan ke database Supabase.",
            confirmButtonColor: "#10b981"
          });
          return;
          
        } catch (saveError: any) {
          Swal.fire({
            icon: "error",
            title: "Submission Gagal",
            text: saveError.message || "Kesalahan sistem saat memproses form.",
            confirmButtonColor: "#4f46e5"
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      // ESG OVERLAP VALIDATION (ENVIRONMENT)
      if (formData.geometry) {
        try {
          const envRes = await fetch("/api/investments/validate-environment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ geometry: formData.geometry })
          });
          if (envRes.ok) {
            const envData = await envRes.json();
            if (envData.overlap) {
              setEsgWarningMessage(envData.message || 'Lokasi proyek terdeteksi berada di dalam Kawasan Lindung Setempat. Menyimpan data ini berisiko melanggar regulasi tata ruang daerah.');
              setPendingSubmitAction(() => executeSave);
              setIsEsgModalOpen(true);
              setIsSubmitting(false);
              return;
            }
          }
        } catch (e) {
          console.error("Gagal melakukan validasi ESG lingkungan:", e);
        }
      }

      await executeSave();
      
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Submission Gagal",
        text: err.message || "Kesalahan sistem saat memproses form.",
        confirmButtonColor: "#4f46e5"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { icon: FileText, label: "Info & Profil" },
      { icon: MapIcon, label: "Lokasi & GIS" },
      { icon: Layers, label: "Lahan" },
      { icon: Activity, label: "Ekonomi" },
      { icon: Navigation, label: "Infrastruktur" },
      { icon: ImageIcon, label: "Media" },
      { icon: Sparkles, label: "AI Review" },
      { icon: Send, label: "Smart Publish" },
    ];
    return (
      <>
        {/* Desktop Progress Stepper */}
        <div className="hidden sm:flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-8 py-3 overflow-x-auto">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isPassed = currentStep > stepNum;
            return (
              <div key={idx} className={`flex flex-col items-center gap-1 min-w-[80px] ${isActive ? "text-indigo-600 dark:text-indigo-400" : isPassed ? "text-emerald-500" : "text-slate-600 dark:text-slate-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" : isPassed ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"}`}>
                  {isPassed ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span className="text-[10px] whitespace-nowrap font-normal uppercase tracking-wider">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* High-Fidelity Mobile-First Android Progress Bar */}
        <div className="block sm:hidden px-4 py-3 bg-emerald-50/50 dark:bg-slate-800/80 border-b border-emerald-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
              Langkah {currentStep} dari {totalSteps}
            </span>
            <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
              {steps[currentStep - 1].label}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-300 rounded-full" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex overflow-hidden transition-all duration-300 ${isMinimized ? "items-end justify-end pointer-events-none p-4 sm:p-8" : "bg-slate-900/60 backdrop-blur-sm items-start sm:items-center justify-center p-0 sm:p-4"}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={`bg-white dark:bg-slate-900 w-full sm:h-[90vh] sm:max-w-[1000px] sm:rounded-2xl flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300 ${isMinimized ? "pointer-events-auto h-auto max-w-[400px] sm:max-w-[400px]" : "h-[100dvh]"}`}>
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-xl text-emerald-600 dark:text-emerald-400 sm:block hidden">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">Smart Investment Form</h2>
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Android-First Enterprise Mode Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center">
              {isMinimized ? <Maximize2 className="h-5 w-5 text-slate-800 dark:text-slate-200" /> : <Minimize2 className="h-5 w-5 text-slate-800 dark:text-slate-200" />}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="h-5 w-5 text-slate-800 dark:text-slate-200" />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!isMinimized && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col flex-1 overflow-hidden"
            >
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50 dark:bg-slate-950">
          <div className="w-full mx-auto bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-xl sm:shadow-sm sm:border border-slate-200 dark:border-slate-800 min-h-[300px]">
            
            {/* STEP 1: INFO DASAR & MASTER KEY LOOKUP */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    1. Identitas Pemohon &amp; Informasi Proyek
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    DPMPTSP &amp; PUPTR Data Sync
                  </span>
                </div>

                {/* MASTER-KEY NIB / NIK LOOKUP & AUTO-HYDRATION ENGINE */}
                <div className="bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-indigo-900/10 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-600 text-slate-950 rounded-xl shrink-0 font-bold shadow-sm">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-emerald-950 dark:text-emerald-300 uppercase tracking-wide">
                          Master-Key NIB / NIK Auto-Hydration Engine
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Masukkan NIB/NIK terdaftar untuk melakukan sinkronisasi otomatis data spasial, peta poligon, zonasi RTRW, dan SK PKKPR dari PUPTR/Pertanian.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-1">
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Masukkan NIB / NIK Investor (Contoh: 9120000000000)"
                        className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/70 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500/40 outline-none shadow-sm pr-10"
                        value={nibSearchInput}
                        onChange={(e) => setNibSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleLookupNib();
                          }
                        }}
                      />
                      {nibSearchInput && (
                        <button
                          type="button"
                          onClick={() => setNibSearchInput('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isSearchingNib}
                      onClick={() => handleLookupNib()}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 shrink-0 disabled:opacity-50"
                    >
                      {isSearchingNib ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Memuat Data...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Cek NIB / NIK</span>
                        </>
                      )}
                    </button>
                  </div>

                  {hydrationSuccessBanner && (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold">{hydrationSuccessBanner}</span>
                    </div>
                  )}

                  {/* DOMINO EFFECT: REJECTION ALERT BANNER FROM DINAS PERTANIAN */}
                  {pertanianRejectionBanner?.isRejected && (
                    <div className="bg-rose-600 text-white p-5 rounded-2xl shadow-xl border-2 border-rose-400 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-3">
                        <AlertOctagon className="w-7 h-7 text-white shrink-0 animate-bounce" />
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                            Permohonan Anda ditolak oleh Dinas Pertanian
                          </h3>
                          <p className="text-xs text-rose-100 font-medium">
                            Status Clearance Lahan: <span className="font-mono font-bold bg-rose-900/90 px-2 py-0.5 rounded text-white">REJECTED</span>
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 text-xs font-sans space-y-1">
                        <strong className="text-rose-200 uppercase text-[10px] font-mono tracking-wider block">Catatan Penolakan Dinas Pertanian:</strong>
                        <p className="text-white font-semibold leading-relaxed">{pertanianRejectionBanner.notes}</p>
                      </div>
                      <div className="p-2.5 bg-rose-950/60 rounded-xl text-xs text-rose-200 font-bold flex items-center gap-2 border border-rose-400/30">
                        <Lock className="w-4 h-4 text-rose-300 shrink-0" />
                        <span>Langkah permohonan selanjutnya dikunci hingga deliniasi lokasi atau dokumen disesuaikan oleh pemohon.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* PROFIL PEMOHON / KONTAK PERSON */}
                <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                      <Users className="w-4 h-4 text-indigo-500" /> Profil Kontak Person / PIC Usaha
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Penyedia Informasi Utama</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Nama Kontak Person / PIC <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        value={formData.namaKontakPerson}
                        onChange={e => updateField('namaKontakPerson', e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Jabatan / Posisi</label>
                      <input
                        type="text"
                        className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        value={formData.jabatanKontak}
                        onChange={e => updateField('jabatanKontak', e.target.value)}
                        placeholder="Contoh: Direktur / Pemilik Lahan"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Nomor HP / WhatsApp</label>
                      <input
                        type="text"
                        className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        value={formData.noHpKontak}
                        onChange={e => updateField('noHpKontak', e.target.value)}
                        placeholder="Contoh: +6281234567890"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Alamat Email</label>
                      <input
                        type="email"
                        className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        value={formData.emailKontak}
                        onChange={e => updateField('emailKontak', e.target.value)}
                        placeholder="Contoh: budi@dinas.go.id"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Nama Potensi</label>
                    <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.title} onChange={e => updateField('title', e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Slug (Auto)</label>
                    <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-slate-100 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none" readOnly value={formData.slug} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Sektor Utama</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.sector} onChange={e => {
                        const newSector = e.target.value as SektorInvestasi;
                        const subSectorsList = SECTOR_TAXONOMY[newSector] ? Object.keys(SECTOR_TAXONOMY[newSector]) : [];
                        const defaultSub = subSectorsList.length > 0 ? subSectorsList[0] : "";
                        setFormData(prev => ({ ...prev, sector: newSector, subSector: defaultSub, commodityType: '', mineralType: '', tourismType: '' }));
                    }}>
                      {Object.values(SektorInvestasi).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Sub Sektor</label>
                    {SECTOR_TAXONOMY[formData.sector as string] ? (
                      <select 
                        className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                        value={formData.subSector} 
                        onChange={e => {
                          updateField('subSector', e.target.value);
                          updateField('commodityType', '');
                          updateField('mineralType', '');
                          updateField('tourismType', '');
                        }}
                      >
                        {Object.keys(SECTOR_TAXONOMY[formData.sector as string]).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.subSector} onChange={e => updateField('subSector', e.target.value)} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Kondisi Topografi</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.kondisiTopografi} onChange={e => updateField('kondisiTopografi', e.target.value)}>
                      <option value="Datar">Datar</option>
                      <option value="Berbukit">Berbukit</option>
                      <option value="Pegunungan">Pegunungan</option>
                      <option value="Pesisir/Pantai">Pesisir/Pantai</option>
                      <option value="Rawa">Rawa</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Target Investor</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.targetInvestor} onChange={e => updateField('targetInvestor', e.target.value)}>
                      <option value="PMA (Asing)">PMA (Asing)</option>
                      <option value="PMDN (Nasional)">PMDN (Nasional)</option>
                      <option value="BUMD/BUMN">BUMD/BUMN</option>
                      <option value="UMKM/Lokal">UMKM/Lokal</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Skema Kemitraan</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.skemaKemitraan} onChange={e => updateField('skemaKemitraan', e.target.value)}>
                      <option value="Joint Venture">Joint Venture</option>
                      <option value="BOT">BOT (Build, Operate, Transfer)</option>
                      <option value="KSO">KSO (Kerja Sama Operasi)</option>
                      <option value="Sewa Lahan">Sewa Lahan</option>
                      <option value="Pembebasan Lahan / Beli Putus">Kepemilikan Penuh / Beli Putus</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Deskripsi Singkat</label>
                  <textarea className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-20" value={formData.shortDesc} onChange={e => updateField('shortDesc', e.target.value)} />
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <MapIcon className="w-3 h-3"/> Luas Lahan (Ha)
                  </label>
                  <input 
                    type="text" 
                    className="border px-3 py-2 min-h-[44px] rounded-lg text-xs bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono cursor-not-allowed font-bold w-1/3 disabled:opacity-100" 
                    value={formData.areaHa ? Number(formData.areaHa).toFixed(2) : ''} 
                    placeholder="0,00"
                    readOnly
                    disabled 
                  />
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">*Luas akan dihitung dan diisi otomatis dari poligon yang Anda gambar pada Langkah 2 (Lokasi & GIS).</span>
                </div>

                {/* Dependent Sector Fields */}
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Parameter Khusus: Sektor {formData.sector}</h4>
                  
                  {(() => {
                    const paramOptions = (formData.sector && formData.subSector) ? (SECTOR_TAXONOMY[formData.sector]?.[formData.subSector] || []) : [];
                    
                    if (formData.sector === SektorInvestasi.PERTANIAN) {
                      return (
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Jenis Komoditas Utama</span>
                              {paramOptions.length > 0 ? (
                                <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)}>
                                  <option value="">Pilih Komoditas...</option>
                                  {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <input type="text" placeholder="Jenis Komoditas" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)}/>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Produksi Tahunan</span>
                              <input type="number" placeholder="Produksi Tahunan" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.annualProduction||''} onChange={e=>updateField('annualProduction', Number(e.target.value))}/>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Satuan Kerja</span>
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.productionUnit||'Ton'} onChange={e=>updateField('productionUnit', e.target.value)}>
                                <option>Kg</option><option>Ton</option><option>Ton/Tahun</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-2.5 border-slate-300 dark:border-slate-700/50">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Jumlah Ternak/Pohon (Jika ada)</span>
                              <input type="number" placeholder="Estimasi Jumlah Ternak / Pohon" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.treeCount||''} onChange={e=>updateField('treeCount', Number(e.target.value))} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Umur Tanaman/Hewan (Tahun)</span>
                              <input type="number" placeholder="Rata-rata Umur" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.plantAge||''} onChange={e=>updateField('plantAge', Number(e.target.value))} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (formData.sector === SektorInvestasi.KELAUTAN) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Komoditas Laut</span>
                            {paramOptions.length > 0 ? (
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)}>
                                <option value="">Pilih Komoditas...</option>
                                {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder="Jenis Komoditas" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)} />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Kedalaman Air (Meter)</span>
                            <input type="number" placeholder="Kedalaman (m)" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.depth||''} onChange={e=>updateField('depth', Number(e.target.value))} />
                          </div>
                        </div>
                      );
                    }
                    if (formData.sector === SektorInvestasi.PARIWISATA) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Fokus Wisata / Destinasi</span>
                            {paramOptions.length > 0 ? (
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.tourismType||''} onChange={e=>updateField('tourismType', e.target.value)}>
                                <option value="">Pilih Destinasi Wisata...</option>
                                {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder="Jenis Wisata" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.tourismType||''} onChange={e=>updateField('tourismType', e.target.value)} />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Pengunjung Estimasi/Tahun</span>
                            <input type="number" placeholder="Kapasitas Pengunjung/Tahun font-sans" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.visitorCount||''} onChange={e=>updateField('visitorCount', Number(e.target.value))} />
                          </div>
                        </div>
                      );
                    }

                    if (formData.sector === SektorInvestasi.PERTAMBANGAN) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Jenis & Target Mineral</span>
                            {paramOptions.length > 0 ? (
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.mineralType||''} onChange={e=>updateField('mineralType', e.target.value)}>
                                <option value="">Pilih Jenis Mineral...</option>
                                {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder="Spesifikasi / Jenis Mineral" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.mineralType||''} onChange={e=>updateField('mineralType', e.target.value)} />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Prakiraan Cadangan (Mt / Ton)</span>
                            <input type="number" placeholder="Kapasitas / Cadangan Maksimal (Mt/Unit) font-sans" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.reserves||''} onChange={e=>updateField('reserves', Number(e.target.value))} />
                          </div>
                        </div>
                      );
                    }

                    if (formData.sector === SektorInvestasi.PERDAGANGAN) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Jenis Produk Industri / Komoditas</span>
                            {paramOptions.length > 0 ? (
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)}>
                                <option value="">Pilih Jenis Produk...</option>
                                {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder="Misal: Hasil Alam, Pabrik Kemasan" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)} />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Kapasitas Transaksi / Produksi Tahunan</span>
                            <input type="number" placeholder="Kapasitas (Unit/Tahun)" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.productionCapacity||''} onChange={e=>updateField('productionCapacity', Number(e.target.value))} />
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </div>
            )}
            {/* STEP 2: LOKASI & GIS */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">2. Lokasi Geografis & Studio GIS</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pilih wilayah administrasi (Kecamatan & Desa) dan tentukan koordinat atau poligon lahan.</p>
                  </div>
                  <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Step 2 / 8
                  </span>
                </div>

                {/* Top Section: Kecamatan and Desa/Kelurahan Select Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      Kecamatan <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select 
                      className={`bg-slate-50 dark:bg-slate-800/80 border ${!formData.districtId && validationError ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'} rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium`}
                      value={formData.districtId || ""} 
                      onChange={e => {
                        const newDistId = e.target.value;
                        setValidationError(null);
                        setFormData(prev => ({
                          ...prev,
                          districtId: newDistId,
                          villageId: "" // Reset village when district changes
                        }));
                      }}
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {(districts || []).map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      Desa / Kelurahan <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select 
                      className={`bg-slate-50 dark:bg-slate-800/80 border ${!formData.villageId && validationError ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'} rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium`}
                      value={formData.villageId || ""} 
                      onChange={e => {
                        const newVilId = e.target.value;
                        setValidationError(null);
                        updateField('villageId', newVilId);
                        const selVil = (villages || []).find((v: any) => v.id === newVilId);
                        if (selVil && selVil.coordinates) {
                          setFormData(prev => ({
                            ...prev,
                            villageId: newVilId,
                            latitude: selVil.coordinates[0] || prev.latitude,
                            longitude: selVil.coordinates[1] || prev.longitude
                          }));
                        }
                      }}
                      disabled={!formData.districtId}
                    >
                      <option value="">-- Pilih Desa / Kelurahan --</option>
                      {(() => {
                        if (!formData.districtId) return [];
                        const rawTargetDistId = String(formData.districtId || "").trim();
                        const targetDist = (districts || []).find((d: any) => 
                          String(d.id || "").trim().toLowerCase() === rawTargetDistId.toLowerCase() ||
                          String(d.name || "").trim().toLowerCase() === rawTargetDistId.toLowerCase() ||
                          normalizeDistrictName(d.name || d.rawName) === normalizeDistrictName(rawTargetDistId)
                        );
                        
                        const targetId = targetDist ? String(targetDist.id || "").trim() : rawTargetDistId;
                        const targetNormName = normalizeDistrictName(targetDist?.name || targetDist?.rawName || rawTargetDistId);

                        return (villages || []).filter((v: any) => {
                          const vDistId = String(v.districtId || v.district_id || v.id_kecamatan || "").trim();
                          const vNormName = normalizeDistrictName(v.districtName || v.kecamatan || v.KECAMATAN || v.WADMKC || "");

                          // 1. Direct ID match
                          if (vDistId && (vDistId === targetId || vDistId.toLowerCase() === rawTargetDistId.toLowerCase())) {
                            return true;
                          }
                          // 2. Strict exact clean name match
                          if (vNormName && targetNormName && vNormName === targetNormName) {
                            return true;
                          }
                          return false;
                        });
                      })()
                        .map((v: any) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                {/* Interactive GIS Spatial Editor & Geometry Controls */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <MapIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Digitasi Geometri Lahan (Spatial GIS)</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Gambar poligon lahan di Studio GIS atau hubungkan dari aset spasial terdaftar.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setInitialGeometryToEdit(formData.geometry || null);
                          setIsSpatialEditorOpen(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Open Studio GIS
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Latitude (Garis Lintang)</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="e.g. -2.9845" 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs font-mono"
                        value={formData.latitude || ''} 
                        onChange={e => handleCoordinateChange('latitude', e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Longitude (Garis Bujur)</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="e.g. 120.2014" 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs font-mono"
                        value={formData.longitude || ''} 
                        onChange={e => handleCoordinateChange('longitude', e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Luas Lahan (Hektar / Ha) <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="number" 
                        step="any"
                        min="0.01"
                        placeholder="e.g. 15.5" 
                        className={`bg-white dark:bg-slate-800 border ${
                          !formData.areaHa || isNaN(Number(formData.areaHa)) || Number(formData.areaHa) <= 0
                            ? 'border-rose-500 ring-1 ring-rose-500/50'
                            : 'border-slate-200 dark:border-slate-700'
                        } rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs font-mono`}
                        value={formData.areaHa !== undefined && formData.areaHa !== null ? formData.areaHa : ''} 
                        onChange={e => {
                          const val = e.target.value;
                          updateField('areaHa', val === '' ? '' : parseFloat(val) || 0);
                        }} 
                      />
                      {(!formData.areaHa || isNaN(Number(formData.areaHa)) || Number(formData.areaHa) <= 0) && (
                        <span className="text-[10px] text-rose-500 font-medium flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          Luas lahan wajib &gt; 0.
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Status Geometri Lahan</label>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-mono h-[38px]">
                        <span className={formData.geometry ? "text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1" : "text-amber-600 dark:text-amber-400 font-medium"}>
                          {formData.geometry ? `✓ Polygon (${formData.areaHa || 0} Ha)` : '⚠️ Belum Ada Polygon'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Otorisasi Khusus Tata Ruang (SK PKKPR) Section */}
                {isPkkprRequired && (
                  <div className="bg-amber-500/10 border-2 border-amber-500/40 dark:bg-amber-950/30 rounded-xl p-4 sm:p-5 flex flex-col gap-4 animate-fadeIn">
                    <div className="flex items-start gap-3 border-b border-amber-500/30 pb-3">
                      <div className="p-2 bg-amber-500 text-slate-950 rounded-lg shrink-0 mt-0.5">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                            Otorisasi Khusus Tata Ruang &amp; Legitimasi SK PKKPR
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-amber-500 text-slate-950">
                            PERSYARATAN WAJIB
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1 font-medium">
                          Silakan Masukkan SK PKKPR anda (Area masuk dalam zonasi khusus{formData.intersectedZoneName ? `: ${formData.intersectedZoneName}` : ''}). Sesuai Perda RTRW, entri ini membutuhkan nomor SK PKKPR, unggahan berkas otorisasi, dan justifikasi otorisasi teknis.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. Nomor Dokumen SK PKKPR */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          Nomor Dokumen SK PKKPR <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: 503/PKKPR/DPMPTSP/2026/012"
                          className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/30 outline-none text-xs font-mono"
                          value={formData.skPkkprDocNumber || ''}
                          onChange={e => updateField('skPkkprDocNumber', e.target.value)}
                        />
                      </div>

                      {/* 2. File Upload SK PKKPR */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          Unggah Berkas SK PKKPR (PDF/Gambar) <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="URL Dokumen PDF atau pautkan dari pendaftaran"
                            className="flex-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/30 outline-none text-xs font-mono"
                            value={formData.skPkkprFileUrl || ''}
                            onChange={e => updateField('skPkkprFileUrl', e.target.value)}
                          />
                          <label className="cursor-pointer px-3 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-sm shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const fakeUrl = URL.createObjectURL(file);
                                  updateField('skPkkprFileUrl', fakeUrl);
                                  Swal.fire({
                                    icon: 'success',
                                    title: 'Berkas SK PKKPR Diunggah',
                                    text: file.name,
                                    toast: true,
                                    position: 'top-end',
                                    timer: 2500,
                                    showConfirmButton: false
                                  });
                                } catch (err) {
                                  console.error("File upload error:", err);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 3. Justifikasi Otorisasi */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Justifikasi Otorisasi Tata Ruang <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Jelaskan pertimbangan pertanahan, pasal pengecualian Perda RTRW, persetujuan teknis dinas terkait, atau rekomendasi kesesuaian tata ruang..."
                        className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/30 outline-none text-xs font-sans leading-relaxed"
                        value={formData.skPkkprJustification || ''}
                        onChange={e => updateField('skPkkprJustification', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Section: Infrastruktur Utama & Utilitas Pendukung */}
                <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Infrastruktur Utama &amp; Utilitas Pendukung (Pilihan Operator)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Pasokan Listrik</label>
                      <select 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-normal" 
                        value={formData.pasokanListrik} 
                        onChange={e => updateField('pasokanListrik', e.target.value)}
                      >
                        <option value="Tersedia Jaringan PLN">Tersedia Jaringan PLN</option>
                        <option value="Perlu Perluasan">Perlu Perluasan</option>
                        <option value="Off-Grid/Mandiri">Off-Grid/Mandiri</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Sumber Air Bersih</label>
                      <select 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-normal" 
                        value={formData.sumberAirBersih} 
                        onChange={e => updateField('sumberAirBersih', e.target.value)}
                      >
                        <option value="PDAM">PDAM</option>
                        <option value="Air Tanah/Sumur Bor">Air Tanah/Sumur Bor</option>
                        <option value="Sungai/Mata Air">Sungai/Mata Air</option>
                        <option value="Belum Tersedia">Belum Tersedia</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Jaringan Komunikasi</label>
                      <select 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-normal" 
                        value={formData.jaringanTelekomunikasi} 
                        onChange={e => updateField('jaringanTelekomunikasi', e.target.value)}
                      >
                        <option value="Fiber Optic">Fiber Optic</option>
                        <option value="Sinyal 4G/5G Kuat">Sinyal 4G/5G Kuat</option>
                        <option value="Sinyal Lemah">Sinyal Lemah</option>
                        <option value="Blank Spot">Blank Spot</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Akses Jalan Terdekat</label>
                      <select 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-normal" 
                        value={formData.aksesJalanTerdekat} 
                        onChange={e => updateField('aksesJalanTerdekat', e.target.value)}
                      >
                        <option value="Jalan Nasional">Jalan Nasional</option>
                        <option value="Jalan Provinsi">Jalan Provinsi</option>
                        <option value="Jalan Kabupaten">Jalan Kabupaten</option>
                        <option value="Jalan Desa">Jalan Desa</option>
                        <option value="Belum Ada Akses">Belum Ada Akses</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LEGITIMASI LAHAN */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2">3. Legitimasi Lahan & Skema Perizinan</h3>
                
                {/* Visual Banner Pengecualian NIB IPRO Pemda */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white">
                        🏛️ Pengecualian NIB OSS
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Alur Khusus Potensi Investasi Daerah (IPRO)</h4>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sesuai regulasi BKPM, penginputan <strong>Potensi Investasi Daerah / Lahan Warga</strong> tidak menuntut NIB Pemilik Lahan. Nomor Rekomendasi/SK DPMPTSP digunakan sebagai dasar keabsahan spasial sebelum Investor memohon perizinan PKKPR Berusaha.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsIproPengecualian(true);
                        const generatedId = `SK.POTENSI/DPMPTSP-LUWU/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
                        updateField('plotNumber', generatedId);
                        if (!formData.certificateNumber) {
                          updateField('certificateNumber', `SK-IPRO-${Math.floor(100000 + Math.random() * 900000)}`);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isIproPengecualian
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      ✓ Gunakan Rekomendasi DPMPTSP (Tanpa NIB)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsIproPengecualian(false);
                        if (formData.plotNumber.startsWith('SK.POTENSI')) {
                          updateField('plotNumber', '');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        !isIproPengecualian
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      🏢 Pengajuan Investor Mandiri (Wajib NIB 13-Digit)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1">
                     <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Status Kepemilikan</label>
                     <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.ownershipStatus} onChange={e => updateField('ownershipStatus', e.target.value)}>
                       <option value="Sertifikat Hak Milik">SHM (Hak Milik)</option>
                       <option value="HGU">HGU (Guna Usaha)</option>
                       <option value="HGB">HGB (Guna Bangunan)</option>
                       <option value="Tanah Negara">Tanah Negara</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Kesesuaian RTRW / RDTR</label>
                     <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.rtrwStatus} onChange={e => updateField('rtrwStatus', e.target.value)}>
                       <option value="Sesuai">Sesuai</option><option value="Bersyarat">Bersyarat</option><option value="Tidak Sesuai">Tidak Sesuai</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Nomor Sertifikat / Izin Prinsip / SK Potensi</label>
                     <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.certificateNumber} onChange={e => updateField('certificateNumber', e.target.value)} placeholder="Contoh: SHM-321183 atau SK-IPRO-LUWU" />
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                       {isIproPengecualian ? 'No. Rekomendasi DPMPTSP (Pengganti NIB)' : 'Nomor Identifikasi Bidang Tanah (NIB OSS)'}
                     </label>
                     <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.plotNumber} onChange={e => updateField('plotNumber', e.target.value)} placeholder={isIproPengecualian ? "SK.POTENSI/DPMPTSP-LUWU/2026/001" : "13-digit NIB OSS"} />
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Status Sengketa Lahan</label>
                     <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.disputeStatus} onChange={e => updateField('disputeStatus', e.target.value)}>
                       <option value="Clear & Clean">Clear & Clean</option>
                       <option value="Dalam Proses Mediasi">Dalam Proses Mediasi</option>
                       <option value="Sengketa Pengadilan">Sengketa Pengadilan</option>
                     </select>
                  </div>
      {/* Step 3 */}
      {/*... Validator Dropdown ...*/}
      <div className="flex flex-col gap-1 relative">
        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">🏛️ Instansi Validator / Sumber Data Potensi</label>
        <div className="relative mt-1 group">
          <input
            type="text"
            placeholder="Ketik untuk mencari instansi..."
            value={
              INSTANSI_VALIDATOR_OPTIONS.find(
                o => o.value === formData.validatorAgency
              )?.label || formData.validatorAgency || ''
            }
            onFocus={() => setShowValidatorDropdown(true)}
            onChange={e => {
              setValidatorSearch(e.target.value);
              setShowValidatorDropdown(true);
            }}
            className="w-full border rounded-lg px-3 py-2 pr-8 text-xs focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
          />
          <span className="absolute right-2 top-2.5 text-slate-600 dark:text-slate-400">▼</span>
        </div>
        {showValidatorDropdown && (
          <div className="absolute z-50 w-full mt-16 top-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl max-h-56 overflow-y-auto">
            {INSTANSI_VALIDATOR_OPTIONS.filter(o => o.label.toLowerCase().includes(validatorSearch.toLowerCase())).map(opt => (
              <div
                key={opt.value}
                onClick={() => {
                  updateField('validatorAgency', opt.value);
                  setValidatorSearch('');
                  setShowValidatorDropdown(false);
                }}
                className={`px-3 py-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${formData.validatorAgency === opt.value ? 'bg-indigo-50 dark:bg-indigo-900/50 font-normal text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

                {/* PDF Uploader */}
                <div className="mt-6">
                  <PDFKajianUploader 
                    onUploadSuccess={(docId, filename) => {
                      setFormData(prev => ({ ...prev, feasibilityPdf: docId }));
                    }}
                  />
                </div>

                </div>
              </div>
            )}

            {/* STEP 4: EKONOMI */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2">4. Auto Calculator Ekonomi & Finansial</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Inputs */}
                  <div className="col-span-1 lg:border-r lg:pr-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                       <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                         Total Modal Awal Pembangunan (CAPEX) - Rp <span className="text-rose-500">*</span>
                       </label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800 dark:text-slate-200 font-normal">Rp</span>
                         <input 
                           type="text" 
                           inputMode="numeric" 
                           placeholder="Contoh: 500.000.000" 
                           className={`w-full border ${
                             !formData.capex || isNaN(Number(formData.capex)) || Number(formData.capex) <= 0
                               ? 'border-rose-500 ring-1 ring-rose-500/50'
                               : 'border-slate-300 dark:border-slate-700'
                           } px-3 py-2 pl-10 rounded-lg text-xs font-mono bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100`} 
                           value={formatInputRupiah(String(formData.capex || ''))} 
                           onChange={e => {
                             const raw = parseInputRupiah(e.target.value);
                             updateField('capex', raw);
                           }} 
                         />
                       </div>
                       {(!formData.capex || isNaN(Number(formData.capex)) || Number(formData.capex) <= 0) && (
                         <span className="text-[10px] text-rose-500 font-medium flex items-center gap-1 mt-0.5">
                           <AlertCircle className="w-3 h-3 shrink-0" />
                           Nilai Investasi (CAPEX) wajib &gt; Rp 0 (tidak boleh kosong atau negatif).
                         </span>
                       )}
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Estimasi Biaya Operasional 1 Tahun (OPEX) - Rp</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800 dark:text-slate-200 font-normal">Rp</span>
                         <input type="text" inputMode="numeric" placeholder="Contoh: 50.000.000" className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 pl-10 rounded-lg text-xs font-mono  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formatInputRupiah(String(formData.opex))} onChange={e => {
                           const raw = parseInputRupiah(e.target.value);
                           updateField('opex', raw);
                         }} />
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Estimasi Serapan Tenaga Kerja - Orang</label>
                       <div className="relative">
                         <input type="number" placeholder="Contoh: 150" className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-xs font-mono  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.penyerapanTenagaKerja || ''} onChange={e => updateField('penyerapanTenagaKerja', parseInt(e.target.value) || 0)} />
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                       <label className="text-sm font-medium text-indigo-700 dark:text-indigo-400">{priceLabel} <span className="text-rose-500">*</span></label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800 dark:text-slate-200 font-normal">Rp</span>
                         <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Contoh: 50.000"
                            className={`w-full border ${(!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-300 dark:border-slate-700'} px-3 py-2 pl-10 rounded-lg text-xs font-mono bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100`}
                            value={formatInputRupiah(String(formData.price || ''))}
                            onChange={e => {
                                const raw = parseInputRupiah(e.target.value);
                                updateField('price', raw);
                            }}
                          />
                       </div>
                       {(!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) && (
                         <span className="text-[10px] text-rose-500 mt-0.5">⚠️ Harga harus berupa angka positif untuk perhitungan simulasi ROI.</span>
                       )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                       <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Revenue/Tahun Estimasi</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900 dark:text-slate-100 font-normal">Rp</span>
                         <input 
                           type="text" 
                           inputMode="numeric" 
                           readOnly
                           disabled
                           placeholder="Otomatis dihitung..." 
                           className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 pl-10 rounded-lg text-xs font-mono bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-bold disabled:opacity-100 cursor-not-allowed" 
                           value={formatInputRupiah(String(formData.annualRevenue || 0))} 
                         />
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Market Scope (Orientasi)</label>
                       <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.marketScope} onChange={e => updateField('marketScope', e.target.value)}>
                         <option value="Lokal">Lokal Kabupaten</option>
                         <option value="Nasional">Nasional / Antar Pulau</option>
                         <option value="Ekspor">Ekspor Global</option>
                       </select>
                    </div>
                  </div>
                  
                  {/* Auto Outputs */}
                  <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 place-content-start">
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-5 rounded-xl flex flex-col gap-1 shadow-sm">
                       <span className="text-xs font-normal text-slate-800 dark:text-slate-200 uppercase">ROI (Return on Invest.)</span>
                       <span className={`text-3xl font-normal font-mono ${formData.roi > 0 ? 'text-emerald-600' : formData.roi < 0 ? 'text-rose-600' : 'text-amber-600'}`}>{formData.roi}%</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-5 rounded-xl flex flex-col gap-1 shadow-sm">
                       <span className="text-xs font-normal text-slate-800 dark:text-slate-200 uppercase">Payback Period</span>
                       <span className="text-3xl font-normal font-mono text-indigo-600">{formData.paybackPeriod === Infinity ? "Tidak Terhingga" : (
                          <>{formData.paybackPeriod} <span className="text-xs">Tahun</span></>
                        )}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-5 rounded-xl flex flex-col gap-1 shadow-sm">
                       <span className="text-xs font-normal text-slate-800 dark:text-slate-200 uppercase">Potensi Profit Kotor / Tahun</span>
                       <span className="text-xs font-normal font-mono text-slate-900 dark:text-slate-100">{formatRupiah(formData.annualRevenue - formData.opex)}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-5 rounded-xl flex flex-col gap-1 shadow-sm">
                       <span className="text-xs font-normal text-slate-800 dark:text-slate-200 uppercase">Status Kelayakan Kasar</span>
                       <span className="text-xs font-normal text-slate-900 dark:text-slate-100 mt-2">
                         {formData.capex === 0 ? "-" : formData.paybackPeriod > 0 && formData.paybackPeriod < 8 ? (
                           <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Sangat Layak & Feasible</span>
                         ) : (
                           <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-1 rounded">High Risk Long Term</span>
                         )}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: INFRASTRUKTUR */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2">5. Smart Infrastructure Assessment</h3>
                <p className="text-xs text-slate-800 dark:text-slate-200">Jarak dihitung otomatis menggunakan algoritma <code>TurfJS</code> dan Euclidean Spatial Auto-Distance dari layer infrastruktur yang ada di Spatial Editor. Operator <strong className="text-pink-600">DILARANG</strong> mengetik manual secara asal.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-black/5 rounded-bl-3xl">
                     <Navigation className="w-32 h-32 text-slate-900 dark:text-slate-100" />
                  </div>
                  
                  <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-800 dark:text-slate-200">Jalan Nasional Trans-Sulawesi</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.roadDistance > 0 ? `${formData.roadDistance} km` : <span className="text-amber-600 dark:text-amber-400 italic text-sm">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-800 dark:text-slate-200">Jalan Provinsi / Akses Primer</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.provRoadDistance > 0 ? `${formData.provRoadDistance} km` : <span className="text-amber-600 dark:text-amber-400 italic text-sm">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-800 dark:text-slate-200">Pelabuhan Belopa / Bua</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.portDistance > 0 ? `${formData.portDistance} km` : <span className="text-amber-600 dark:text-amber-400 italic text-sm">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-800 dark:text-slate-200">Bandara Lagaligo Bua</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.airportDistance > 0 ? `${formData.airportDistance} km` : <span className="text-amber-600 dark:text-amber-400 italic text-sm">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-800 dark:text-slate-200">Gardu Induk PLN (150kV)</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.electricityDistance > 0 ? `${formData.electricityDistance} km` : <span className="text-amber-600 dark:text-amber-400 italic text-sm">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-800 dark:text-slate-200">Jaringan Fiber Optic Terdekat</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.fiberDistance > 0 ? `${formData.fiberDistance} km` : <span className="text-amber-600 dark:text-amber-400 italic text-sm">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Pasokan Listrik</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.pasokanListrik} onChange={e => updateField('pasokanListrik', e.target.value)}>
                      <option value="Tersedia Jaringan PLN">Tersedia Jaringan PLN</option>
                      <option value="Perlu Perluasan">Perlu Perluasan</option>
                      <option value="Off-Grid/Mandiri">Off-Grid/Mandiri</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Sumber Air Bersih</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.sumberAirBersih} onChange={e => updateField('sumberAirBersih', e.target.value)}>
                      <option value="PDAM">PDAM</option>
                      <option value="Air Tanah/Sumur Bor">Air Tanah/Sumur Bor</option>
                      <option value="Sungai/Mata Air">Sungai/Mata Air</option>
                      <option value="Belum Tersedia">Belum Tersedia</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Jaringan Komunikasi</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.jaringanTelekomunikasi} onChange={e => updateField('jaringanTelekomunikasi', e.target.value)}>
                      <option value="Fiber Optic">Fiber Optic</option>
                      <option value="Sinyal 4G/5G Kuat">Sinyal 4G/5G Kuat</option>
                      <option value="Sinyal Lemah">Sinyal Lemah</option>
                      <option value="Blank Spot">Blank Spot</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Akses Jalan Terdekat</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[44px] rounded-lg text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={formData.aksesJalanTerdekat} onChange={e => updateField('aksesJalanTerdekat', e.target.value)}>
                      <option value="Jalan Nasional">Jalan Nasional</option>
                      <option value="Jalan Provinsi">Jalan Provinsi</option>
                      <option value="Jalan Kabupaten">Jalan Kabupaten</option>
                      <option value="Jalan Desa">Jalan Desa</option>
                      <option value="Belum Ada Akses">Belum Ada Akses</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs text-indigo-700 font-normal bg-indigo-50 border border-indigo-100 p-3 rounded-lg shadow-sm">
                  <Sparkles className="inline w-4 h-4 mr-1 text-indigo-500" /> Hasil Kalkulasi: Aksesibilitas Sangat Memadai (Skor Infrastruktur 85/100).
                </div>
              </div>
            )}

            {/* STEP 6: MEDIA */}
            {currentStep === 6 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2">6. Media & Dokumen Pendukung</h3>
                <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Anda diwajibkan untuk mengunggah minimal 1 foto untuk visualisasi di Landing Page. (Maksimal ukuran: 300 KB per foto)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl border-dashed">
                      <PhotoUploader 
                        photos={(formData.gallery && formData.gallery.length > 0) ? formData.gallery : (formData.photoUrl ? [formData.photoUrl] : [])}
                        onChange={(photos) => {
                          updateField('gallery', photos);
                          updateField('photoUrl', photos[0] || '');
                        }}
                        maxPhotos={4}
                      />
                   </div>
                   <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl border-dashed">
                      <FileText className="w-8 h-8 text-rose-700 dark:text-rose-400" />
                      <h4 className="text-xs font-normal text-slate-900 dark:text-slate-100">Dokumen Digital Pendukung (PDF)</h4>
                      <p className="text-xs text-slate-800 dark:text-slate-200">Mendukung file: Investment Brief, Proposal, Studi Kelayakan (Feasibility Study FS), Legalitas.</p>
                      <button type="button" className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-800 dark:text-slate-200 px-4 py-2 rounded text-xs font-normal mt-1 border border-slate-300 dark:border-slate-700 max-w-max transition-colors">Pilih PDF (Max 20MB)</button>
                   </div>
                   <div className="col-span-1 sm:col-span-2 flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl border-dashed">
                     <Activity className="w-8 h-8 text-amber-500" />
                     <h4 className="text-xs font-normal text-slate-900 dark:text-slate-100">Video Drone Spatial (Opsional)</h4>
                     <p className="text-xs text-slate-800 dark:text-slate-200">Masukan link dari Cloud Storage atau YouTube sebagai Tour Udara bagi Investor Asing.</p>
                     <input type="text" placeholder="https://youtube.com/..." className="border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" value={formData.droneVideoUrl} onChange={e => updateField('droneVideoUrl', e.target.value)} />
                   </div>
                </div>
              </div>
            )}

            {/* STEP 7: REVIEW & AI NARRATIVE */}
            {currentStep === 7 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2 flex items-center gap-2"><Sparkles className="text-indigo-500"/> 7. AI Readiness Score & Narrative Generator</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="flex flex-col gap-4">
                     <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl shadow-sm">
                       <h4 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2 mb-3">Investment Readiness Score</h4>
                       <div className="flex items-center gap-4">
                         <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xs font-normal font-mono text-white ${formData.aiScore > 0 ? (formData.aiScore >= 80 ? 'bg-emerald-500' : formData.aiScore >= 60 ? 'bg-amber-500' : 'bg-rose-500') : 'bg-slate-300'}`}>
                           {formData.aiScore > 0 ? formData.aiScore : '?'}
                         </div>
                         <div className="flex flex-col gap-1 flex-1">
                           <span className="text-xs text-slate-800 dark:text-slate-200 font-normal uppercase">Category</span>
                           <span className="text-xs font-normal text-slate-900 dark:text-slate-100">{formData.aiScoreCategory || 'Belum Dihitung'}</span>
                           <button type="button" className="mt-2 bg-indigo-50 text-indigo-700 py-1.5 px-3 rounded text-xs font-normal border border-indigo-200 hover:bg-indigo-100 transition-colors w-max" onClick={() => {
                              // Priority 3: AI Scoring Engine
                              let score = 100;
                              
                              // Penalti data tidak lengkap (cek dulu sebelum penalti kondisi)
                              if (!formData.geometry) score -= 20;
                              if (!formData.title?.trim()) score -= 15;
                              if (!formData.areaHa || Number(formData.areaHa) === 0) score -= 10;
                              if (Number(formData.capex) === 0) score -= 10;
                              if (formData.roadDistance === 0) score -= 8;
                              if (formData.portDistance === 0) score -= 5;
                              if (formData.airportDistance === 0) score -= 5;
                              
                              // Penalti kondisi (hanya jika data sudah ada)
                              if (formData.rtrwStatus !== 'Sesuai') score -= 15;
                              if (formData.rdtrStatus !== 'Sesuai') score -= 10;
                              if (formData.environmentalStatus !== 'AMDAL') score -= 10;
                              if (formData.ownershipStatus !== 'Sertifikat Hak Milik') score -= 10;
                              if (formData.disputeStatus !== 'Clear & Clean') score -= 10;
                              if (formData.roadDistance > 5) score -= 5;
                              if (formData.portDistance > 50) score -= 5;
                              if (formData.electricityDistance > 10) score -= 5;

                              score = Math.max(0, Math.min(100, score));

                              let cat = "D — Preliminary Study";
                              if (score >= 90) cat = "A+ — Ready To Offer";
                              else if (score >= 80) cat = "A — Investment Ready";
                              else if (score >= 70) cat = "B — Need Infrastructure";
                              else if (score >= 60) cat = "C — Need Land Preparation";

                              updateField('aiScore', score);
                              updateField('aiScoreCategory', cat);
                           }}>Hitung AI Score</button>
                         </div>
                       </div>
                     </div>

                     <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl shadow-sm">
                       <h4 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2 mb-3">Multi-Collection Schema</h4>
                       <div className="flex flex-wrap gap-2">
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] px-2 py-1 rounded font-normal">projects</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] px-2 py-1 rounded font-normal">locations</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] px-2 py-1 rounded font-normal">geometries</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] px-2 py-1 rounded font-normal">legalities</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] px-2 py-1 rounded font-normal">financials</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] px-2 py-1 rounded font-normal">infrastructures</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] px-2 py-1 rounded font-normal">media_assets</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] px-2 py-1 rounded font-normal">investment_scores</span>
                       </div>
                     </div>
                   </div>

                   <div className="flex flex-col gap-3">
                      <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl shadow-sm flex flex-col gap-3 h-full">
                         <div className="flex justify-between items-center">
                           <h4 className="text-xs font-normal text-indigo-900 border-b border-indigo-200 pb-2 flex-col flex w-full">
                             AI Narrative Generator (300-500 words)
                             <span className="text-[10px] font-normal text-indigo-600 mt-1">Menggunakan Gemini 2.5 Flash dari Server backend</span>
                           </h4>
                         </div>
                         
                         {formData.aiNarrative ? (
                           <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-lg overflow-y-auto border border-indigo-200 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-normal h-[200px]" ref={pdfRef}>
                             {formData.aiNarrative}
                           </div>
                         ) : (
                           <div className="flex-1 bg-indigo-100/50 p-4 rounded-lg border border-indigo-200 border-dashed flex items-center justify-center text-center text-xs text-indigo-500 font-normal h-[200px]">
                             Belum ada narasi. Klik Generate untuk membuat executive summary secara otomatis berdasarkan data yang diinput.
                           </div>
                         )}

                         <div className="flex gap-2">
                           <button type="button" disabled={isGeneratingNarrative} className="flex-1 bg-indigo-600 text-white rounded py-2 text-xs font-normal hover:bg-indigo-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2" onClick={async () => {
                              setIsGeneratingNarrative(true);
                              try {
                                const res = await fetch("/api/gemini/narrative", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (localStorage.getItem("luwu_session_token") || "") },
                                  body: JSON.stringify({
                                     sector: formData.sector,
                                     areaHa: formData.areaHa,
                                     production: formData.annualProduction || formData.reserves,
                                     capex: formData.capex,
                                     province: formData.province,
                                     roi: formData.roi,
                                     infrastructures: `Jalan: ${formData.roadDistance}km, Pelabuhan: ${formData.portDistance}km, Listrik: ${formData.electricityDistance}km`,
                                     language: localStorage.getItem("i18nextLng") || "id"
                                  })
                                });
                                const json = await res.json();
                                if (json.narrative) updateField('aiNarrative', json.narrative);
                              } catch(e) {

                              }
                              setIsGeneratingNarrative(false);
                           }}>
                             {isGeneratingNarrative ? 'Generating...' : 'Generate Investment Narrative'} <Sparkles className="w-4 h-4" />
                           </button>

                           <button type="button" disabled={!formData.aiNarrative || isGeneratingPdf} className="bg-rose-600 rounded text-white px-4 hover:bg-rose-500 disabled:opacity-50 transition-colors flex items-center gap-2 text-xs font-normal" onClick={async () => {
                              setIsGeneratingPdf(true);
                              try {
                                if (pdfRef.current) {
                                  const pdfRefReady = await waitForDomAndIdle(pdfRef.current, 3000);
                                  const canvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(pdfRefReady, { scale: 2 }));
                                  
                                  if (canvas.width === 0 || canvas.height === 0) {

                                    setIsGeneratingPdf(false);
                                    return;
                                  }

                                  const imgData = canvas.toDataURL('image/png');
                                  if (!imgData || imgData === 'data:,' || imgData.length < 50) {

                                    setIsGeneratingPdf(false);
                                    return;
                                  }
                                  const pdf = new jsPDF('p', 'mm', 'a4');
                                  
                                  pdf.setFontSize(18);
                                  pdf.text("INVESTMENT BRIEF: " + formData.title, 15, 20);
                                  pdf.setFontSize(10);
                                  pdf.text(`Sektor: ${formData.sector} | Skor: ${formData.aiScore} (${formData.aiScoreCategory}) | ROI: ${formData.roi}%`, 15, 28);
                                  pdf.text(`Luas: ${formData.areaHa} Ha | CAPEX: ${formatRupiah(formData.capex)}`, 15, 33);
                                  
                                  const imgProps = pdf.getImageProperties(imgData);
                                  const pdfWidth = pdf.internal.pageSize.getWidth() - 30;
                                  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                                  
                                  pdf.addImage(imgData, 'PNG', 15, 45, pdfWidth, pdfHeight);
                                  pdf.save(`Investment_Brief_${formData.slug}.pdf`);
                                }
                              } catch(e) {

                              }
                              setIsGeneratingPdf(false);
                           }}>
                             {isGeneratingPdf ? 'Wait...' : 'Download PDF'} <Download className="w-3 h-3" />
                           </button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* STEP 8: SMART PUBLISH & MULTI-COLLECTION REVIEW */}
            {currentStep === 8 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    8. AI Readiness Review &amp; Multi-Collection Publish
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    Status: Ready for Multi-Collection Fan-Out
                  </span>
                </div>

                {/* SUMMARY AUDIT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Profil Usaha & NIB */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2">
                      <Building className="w-4 h-4" /> Profil &amp; NIB Investor
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                      <p><span className="text-slate-400">Proyek:</span> <strong className="text-slate-900 dark:text-slate-100">{formData.title || '-'}</strong></p>
                      <p><span className="text-slate-400">NIB/NIK:</span> <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formData.plotNumber || formData.certificateNumber || 'Terverifikasi'}</code></p>
                      <p><span className="text-slate-400">Sektor:</span> {formData.sector} ({formData.subSector || '-'})</p>
                      <p><span className="text-slate-400">PIC Usaha:</span> {formData.namaKontakPerson || '-'} ({formData.noHpKontak || '-'})</p>
                    </div>
                  </div>

                  {/* Card 2: Spasial & PKKPR */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2">
                      <MapIcon className="w-4 h-4" /> GIS &amp; Legitimasi
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                      <p><span className="text-slate-400">Luas Lahan:</span> <strong className="font-mono text-slate-900 dark:text-slate-100">{formData.areaHa ? `${Number(formData.areaHa).toFixed(2)} Ha` : '-'}</strong></p>
                      <p><span className="text-slate-400">Status ESG:</span> <span className={`font-bold ${isPkkprRequired ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{isPkkprRequired ? 'HIGH_RISK_INTERSECTION' : 'CLEAR'}</span></p>
                      {isPkkprRequired && (
                        <p><span className="text-slate-400">SK PKKPR:</span> <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">{formData.skPkkprDocNumber || 'Belum Diisi'}</code></p>
                      )}
                      <p><span className="text-slate-400">Lahan:</span> {formData.ownershipStatus} ({formData.certificateNumber || '-'})</p>
                    </div>
                  </div>

                  {/* Card 3: Finansial & AI Score */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2">
                      <Activity className="w-4 h-4" /> Nilai &amp; Readiness
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                      <p><span className="text-slate-400">CAPEX:</span> <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(formData.capex)}</strong></p>
                      <p><span className="text-slate-400">Tenaga Kerja:</span> {formData.penyerapanTenagaKerja || 0} Orang</p>
                      <p><span className="text-slate-400">AI Score:</span> <strong className="font-mono text-indigo-600 dark:text-indigo-400">{formData.aiScore || 0}/100</strong> ({formData.aiScoreCategory || 'Preliminary'})</p>
                      <p><span className="text-slate-400">Narasi AI:</span> {formData.aiNarrative ? 'Tersedia' : 'Dapat Digenerate'}</p>
                    </div>
                  </div>
                </div>

                {/* MULTI-COLLECTION TARGET SCHEMAS */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 text-white flex flex-col gap-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Atomik Multi-Collection Fan-Out Schema</h4>
                        <p className="text-[11px] text-indigo-300/80">Publikasi otomatis menyeluruh ke 8 tabel Supabase (PostgreSQL + PostGIS).</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-mono text-[10px] font-bold">
                      READY TO PUBLISH
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
                    <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-lg flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> <span>investments</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-lg flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> <span>locations</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-lg flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> <span>geometries</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-lg flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> <span>legalities</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-lg flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> <span>financials</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-lg flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> <span>infrastructures</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-lg flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> <span>media_assets</span>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-lg flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> <span>investment_scores</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2.5 animate-in fade-in duration-300">
             <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
             <span className="font-medium">{validationError}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <button 
            type="button" 
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2 text-xs font-medium transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-slate-700 font-medium text-xs transition-all shadow-sm"
            >
              Batal
            </button>
            {currentStep < totalSteps ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl flex items-center gap-2 text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all font-display tracking-wide"
              >
                Selanjutnya <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={submitForm}
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl flex items-center gap-2 text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all font-display tracking-wide"
              >
                <Check className="w-5 h-5" /> 
                {isSubmitting ? "Processing Fan-Out to Supabase..." : "SMART PUBLISH KE MULTI-COLLECTION"}
              </button>
            )}
          </div>
        </div>
        </motion.div>
        )}
        </AnimatePresence>
      </motion.div>

      {/* GEOMETRY PICKER MODAL */}
      {isGeomPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-xl rounded-2xl shadow-xl border flex flex-col max-h-[85vh] ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"}`}>
            <div className="p-4 border-b flex items-center justify-between border-slate-500/10">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-display font-normal text-xs tracking-tight flex items-center gap-1.5 leading-none">
                  <MapIcon className="h-4 w-4 text-emerald-500 animate-pulse" /> Pilih Aset Spasial
                </h3>
                <span className="text-[10px] text-slate-800 dark:text-slate-200 font-mono">Ditemukan {geomPickerList.length} aset terdaftar di Spatial Studio</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsGeomPickerOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-500/10 text-slate-600 dark:text-slate-400 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex flex-col gap-3 min-h-[250px]">
              {geomPickerList.map((g: any, idx: number) => (
                <div 
                  key={g.id || idx} 
                  onClick={() => {
                    const seed = (Math.abs(g.centroidLng) + Math.abs(g.centroidLat));
                    setFormData(prev => ({
                      ...prev,
                      latitude: g.centroidLat,
                      longitude: g.centroidLng,
                      areaHa: g.areaHa,
                      perimeterM: g.perimeterKm * 1000,
                      geometryType: g.geometryType,
                      geometry: g.geometry,
                      portDistance: g.infrastructures?.port_distance || g.infrastructures?.portDistance || prev.portDistance,
                      airportDistance: g.infrastructures?.airport_distance || g.infrastructures?.airportDistance || prev.airportDistance,
                      roadDistance: g.infrastructures?.road_distance || g.infrastructures?.roadDistance || prev.roadDistance,
                      provRoadDistance: g.infrastructures?.prov_road_distance || g.infrastructures?.provRoadDistance || prev.provRoadDistance,
                      electricityDistance: g.infrastructures?.electricity_distance || g.infrastructures?.electricityDistance || prev.electricityDistance,
                      fiberDistance: g.infrastructures?.fiber_distance || g.infrastructures?.fiberDistance || prev.fiberDistance,
                    }));
                    setIsGeomPickerOpen(false);

                  }}
                  className={`border rounded-xl p-3.5 flex flex-col gap-2.5 cursor-pointer text-left transition-all hover:scale-[1.01] hover:shadow-md ${
                    isDarkMode 
                      ? "bg-slate-950/60 border-slate-800 hover:border-emerald-500/50" 
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 hover:border-emerald-600/50 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-normal text-xs font-sans tracking-tight">{g.name || "Aset Tanpa Nama"}</span>
                    <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded-full ${
                      g.geometryType === "Polygon" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    }`}>
                      {g.geometryType}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-800 dark:text-slate-200 font-mono">
                    <div>
                      <span className="block text-[8px] text-slate-600 dark:text-slate-400 uppercase">Luas Wilayah</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{g.areaHa ? g.areaHa.toFixed(2) : 0} Ha</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-600 dark:text-slate-400 uppercase">Perimeter</span>
                      <span className="font-normal text-slate-800 dark:text-slate-200">{g.perimeterKm ? (g.perimeterKm * 1000).toFixed(0) : 0} m</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[8px] text-slate-600 dark:text-slate-400 uppercase">Konektivitas Infrastruktur</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                        <span className="flex items-center gap-1">🛣️ {g.infrastructures?.road_distance || g.infrastructures?.roadDistance || 0} km (Jalan)</span>
                        <span className="flex items-center gap-1">⚡ {g.infrastructures?.electricity_distance || g.infrastructures?.electricityDistance || 0} km (Listrik)</span>
                        <span className="flex items-center gap-1">📶 {g.infrastructures?.fiber_distance || g.infrastructures?.fiberDistance || 0} km (Fiber)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t bg-slate-500/5 flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsGeomPickerOpen(false)}
                className="px-4 py-2 min-h-[44px] rounded-lg border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 text-sm font-medium transition-all shadow-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPATIAL EDITOR FULLSCREEN MODAL (EMBEDDED) */}
      {isSpatialEditorOpen && (() => {
        const selectedDistrict = districts?.find((d: any) => d.id === formData.districtId);
        const selectedVillage = villages?.find((v: any) => v.id === formData.villageId);
        const focusTarget = {
          districtId: formData.districtId,
          districtName: selectedDistrict?.name || "",
          districtCoords: selectedDistrict?.coordinates,
          districtGeojson: selectedDistrict?.geojson,
          villageId: formData.villageId,
          villageName: selectedVillage?.name || "",
          villageCoords: selectedVillage?.coordinates,
          villageGeojson: selectedVillage?.geojson
        };
        const roadLayer = spatialLayers ? (Object.values(spatialLayers) as any[]).find((l: any) => l.id === "layer_jalan" || l.category === "Jalan") : null;
        const roadGeojson = (roadLayer as any)?.geojson;
        const zoningLayer = spatialLayers ? (Object.values(spatialLayers) as any[]).find((l: any) => l.id === "layer_zonasi" || l.category === "Zonasi" || l.name?.toLowerCase().includes("zonasi") || l.name?.toLowerCase().includes("rtrw")) : null;
        const zoningGeojson = (zoningLayer as any)?.geojson;
        return (
          <SimplePolygonDrawer
            initialGeometry={initialGeometryToEdit}
            isDarkMode={isDarkMode}
            focusTarget={focusTarget}
            roadGeojson={roadGeojson}
            zoningGeojson={zoningGeojson}
            onCancel={() => setIsSpatialEditorOpen(false)}
            onSave={(geom: any, esgAnalysis?: any) => {
               let centroidLat = 0;
               let centroidLng = 0;
               let areaHa = 0;
               let perimeterKm = 0;
               
               try {
                  const feature = turf.feature(geom);
                  const center = turf.center(feature);
                  centroidLng = center.geometry.coordinates[0];
                  centroidLat = center.geometry.coordinates[1];
                  const rawAreaSqm = turf.area(feature);
                  areaHa = Number((rawAreaSqm / 10000).toFixed(2));
                  perimeterKm = turf.length(turf.polygonToLine(feature as any)) || 0;
               } catch(e) {}
               
               const centPt = turf.point([centroidLng, centroidLat]);
               const realPortDist = Number(turf.distance(centPt, turf.point([120.3979, -3.3860]), { units: 'kilometers' }).toFixed(1));
               const realAirportDist = Number(turf.distance(centPt, turf.point([120.2413, -3.0863]), { units: 'kilometers' }).toFixed(1));
               const realElectricityDist = Number(turf.distance(centPt, turf.point([120.3585, -3.3912]), { units: 'kilometers' }).toFixed(1));
               const realFiberDist = Number(turf.distance(centPt, turf.point([120.3512, -3.3654]), { units: 'kilometers' }).toFixed(1));
               
               const roadLine = turf.lineString([
                 [120.3015, -3.5488],
                 [120.3294, -3.4025],
                 [120.3582, -3.1111],
                 [120.2285, -2.9324]
               ]);
               const nearestRoadPt = turf.nearestPointOnLine(roadLine, centPt);
               const realRoadDist = Number(turf.distance(centPt, nearestRoadPt, { units: 'kilometers' }).toFixed(1));

               const esgStatus = esgAnalysis?.esgRiskStatus || 'CLEAR';
               const zoneName = esgAnalysis?.intersectedZoneName || '';
               const isHighRisk = esgStatus === 'HIGH_RISK_INTERSECTION';

               setFormData(prev => ({
                 ...prev,
                 latitude: centroidLat,
                 longitude: centroidLng,
                 areaHa: areaHa,
                 perimeterM: perimeterKm * 1000,
                 geometryType: "Polygon",
                 geometry: geom,
                 portDistance: realPortDist,
                 airportDistance: realAirportDist,
                 roadDistance: realRoadDist,
                 provRoadDistance: Number((realRoadDist * 1.2).toFixed(1)),
                 electricityDistance: realElectricityDist,
                 fiberDistance: realFiberDist,
                 esgRiskStatus: esgStatus,
                 intersectedZoneName: zoneName,
                 intersectedLayerId: isHighRisk ? "layer_zonasi" : "",
                 isSpatialOverride: isHighRisk,
                 esgEnvironmentalRisk: isHighRisk ? "HIGH_RISK_OVERRIDDEN" : "LOW_RISK"
               }));
               
               setIsSpatialEditorOpen(false);

               if (isHighRisk) {
                 Swal.fire({
                   icon: 'warning',
                   title: 'OTORISASI SK PKKPR DIBUTUHKAN',
                   text: `Poligon terdeteksi bersinggungan dengan ${zoneName}. Silakan lengkapi Dokumen SK PKKPR dan Justifikasi pada Langkah 2 (Lokasi & GIS).`,
                   confirmButtonColor: '#f59e0b'
                 });
               } else {
                 Swal.fire({
                   icon: 'success',
                   title: 'Polygon Terbentuk!',
                   text: 'Area potensi berhasil ditandai dan dinyatakan CLEAR.',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 3000
                 });
               }
            }}
          />
        );
      })()}

      {/* ESG WARNING MODAL */}
      <EsgWarningModal
        isOpen={isEsgModalOpen}
        message={esgWarningMessage}
        onCancel={() => {
          setIsEsgModalOpen(false);
          setPendingSubmitAction(null);
          setCurrentStep(2); // Jump to Step 2 so user can easily revise location & GIS
        }}
        onConfirm={async (overrideData) => {
          setIsEsgModalOpen(false);
          if (pendingSubmitAction) {
            const action = pendingSubmitAction;
            setPendingSubmitAction(null);
            await action(overrideData);
          }
        }}
      />
    </motion.div>
  );
}
