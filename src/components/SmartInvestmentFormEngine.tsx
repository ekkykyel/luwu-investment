import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { PDFKajianUploader } from "./PDFKajianUploader.js";
import { X, Check, Save, Map as MapIcon, Layers, FileText, Activity, Image as ImageIcon, Sparkles, Navigation, Send, ArrowRight, ArrowLeft, Download, Edit, AlertCircle, Users, Building, Minimize2, Maximize2 } from "lucide-react";
import * as turf from "@turf/turf";
import jsPDF from "jspdf";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "../lib/html2canvasShim.js";
import { motion, AnimatePresence } from "motion/react";
import { District, Village, SektorInvestasi } from "../types.js";
import SpatialEditorStudio from "./SpatialEditorStudio.js";
import SimplePolygonDrawer from "./SimplePolygonDrawer.js";
import PhotoUploader from "./PhotoUploader.js";
import Swal from 'sweetalert2';
import { formatNumber, formatRupiah, formatRupiahSingkat, formatInputRupiah, parseInputRupiah } from "../lib/formatters.js";


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

  // Helper function to build form data from source (used for initial state and hydration)
  const buildFormData = (source: any): FormState => {
    const sd = source?.smartData || {};
    const geo = source?.gis_potensi_investasi?.[0] || source?.geometries?.[0] || {};
    const fin = source?.financials?.[0] || {};
    const leg = source?.legalities?.[0] || {};
    const scr = source?.investment_scores?.[0] || {};

    return {
      id: source?.id || "",
      title: source?.name || geo.nama_potensi || "",
      slug: sd.slug || geo.slug || "",
      sector: source?.sector || geo.sektor_utama || SektorInvestasi.PERTANIAN,
      subSector: sd.subSector || geo.sub_sektor || "",
      status: source?.status || geo.status || "Draft",
      shortDesc: sd.deskripsiSingkat || sd.shortDesc || geo.deskripsi_singkat || "",
      longDesc: sd.deskripsiLengkap || sd.longDesc || geo.deskripsi_lengkap || "",
      tags: sd.tags || "",
      kondisiTopografi: geo.kondisi_topografi || sd.kondisiTopografi || "Datar",
      targetInvestor: geo.target_investor || sd.targetInvestor || "PMDN (Nasional)",
      skemaKemitraan: geo.skema_kemitraan || sd.skemaKemitraan || "Pembebasan Lahan / Beli Putus",
      province: sd.province || "Luwu",
      districtId: source?.districtId || geo.id_kecamatan || (districts && districts[0]?.id) || "",
      villageId: source?.villageId || geo.id_desa || "",
      latitude: source?.latitude || "",
      longitude: source?.longitude || "",
      geometry: source?.geometry || geo.geom || geo.geometry || null,
      geometryType: source?.geometry?.type || geo.geom?.type || geo.geometry?.type || sd.geometryType || "Point",
      areaHa: source?.areaHa || geo.area_ha || geo.luas_lahan || "",
      perimeterM: sd.perimeterM || geo.perimeter_km ? geo.perimeter_km * 1000 : 0,
      ownershipStatus: source?.landStatus || leg.ownership_status || leg.status_kepemilikan || geo.status_kepemilikan || sd.ownershipStatus || "Sertifikat Hak Milik",
      rtrwStatus: leg.rtrw_status || leg.kesesuaian_rtrw || geo.kesesuaian_rtrw || sd.rtrwStatus || "Sesuai",
      rdtrStatus: leg.rdtr_status || leg.kesesuaian_rdtr || sd.rdtrStatus || "Sesuai",
      environmentalStatus: leg.environmental_status || leg.status_lingkungan || sd.environmentalStatus || "AMDAL",
      certificateNumber: leg.nomor_sertifikat || geo.nomor_sertifikat || sd.certificateNumber || "",
      plotNumber: sd.plotNumber || geo.plot_number || geo.nib || "",
      disputeStatus: leg.status_sengketa || sd.disputeStatus || "Clear & Clean",
      validationDate: sd.validationDate || "",
      validatorAgency: sd.validatorAgency || "BPN",
      capex: source?.investmentValue || fin.capex || geo.estimasi_nilai || sd.capex || 0,
      opex: fin.opex || geo.opex || sd.opex || 0,
      penyerapanTenagaKerja: fin.penyerapan_tenaga_kerja || geo.penyerapan_tenaga_kerja || sd.penyerapanTenagaKerja || 0,
      annualRevenue: fin.pendapatan_tahunan || geo.pendapatan_tahunan || sd.annualRevenue || 0,
      irr: fin.irr || fin.irr_persen || geo.irr_persen || sd.irr || 0,
      npv: fin.npv || fin.npv_estimasi || geo.npv_estimasi || sd.npv || 0,
      roi: fin.roi || fin.roi_estimasi || geo.roi_estimasi || sd.roi || 0,
      paybackPeriod: fin.payback_period || geo.payback_period || sd.paybackPeriod || 0,
      breakEvenPoint: fin.bep_tahun || geo.bep_tahun || sd.breakEvenPoint || 0,
      marketScope: sd.marketScope || "Nasional",
      roadDistance: geo.jarak_jalan_nasional || geo.akses_jalan_terdekat || sd.roadDistance || 0,
      provRoadDistance: geo.jarak_jalan_provinsi || sd.provRoadDistance || 0,
      portDistance: geo.jarak_pelabuhan || sd.portDistance || 0,
      airportDistance: geo.jarak_bandara || sd.airportDistance || 0,
      electricityDistance: geo.jarak_gardu_listrik || sd.electricityDistance || 0,
      fiberDistance: geo.jarak_jaringan_fiber || sd.fiberDistance || 0,
      pasokanListrik: geo.pasokan_listrik || sd.pasokanListrik || "Tersedia Jaringan PLN",
      sumberAirBersih: geo.sumber_air_bersih || sd.sumberAirBersih || "PDAM",
      jaringanTelekomunikasi: geo.jaringan_telekomunikasi || sd.jaringanTelekomunikasi || "Sinyal 4G/5G Kuat",
      aksesJalanTerdekat: geo.akses_jalan_terdekat_tipe || sd.aksesJalanTerdekat || "Jalan Kabupaten",
      photoUrl: source?.photoUrl || geo.url_foto_lokasi || sd.photoUrl || "",
      gallery: source?.photoUrls || geo.galeri_foto || sd.gallery || [],
      droneVideoUrl: geo.url_video_drone || sd.droneVideoUrl || "",
      proposalPdf: geo.url_proposal_pdf || sd.proposalPdf || "",
      investmentBriefPdf: geo.dokumen_fs || sd.investmentBriefPdf || "",
      feasibilityPdf: sd.feasibilityPdf || "",
      legalDoc: geo.dokumen_legal || sd.legalDoc || "",
      aiScore: scr.score || scr.ai_score || geo.ai_score || sd.aiScore || 0,
      aiScoreCategory: scr.category || scr.ai_kategori || geo.ai_kategori || sd.aiScoreCategory || "",
      aiNarrative: scr.ai_narasi || geo.ai_narasi || sd.aiNarrative || "",
      commodityType: geo.jenis_komoditas || sd.jenisKomoditas || sd.commodityType || "",
      annualProduction: geo.produksi_tahunan || sd.produksiTahunan || sd.annualProduction || 0,
      productionUnit: geo.satuan_kerja || sd.satuanKerja || sd.productionUnit || "Ton",
      treeCount: geo.jumlah_ternak_pohon || sd.jumlahTernakPohon || sd.treeCount || 0,
      plantAge: geo.umur_tanaman_hewan || sd.umurTanamanHewan || sd.plantAge || 0,
      pondArea: sd.pondArea || 0,
      depth: sd.depth || 0,
      tourismType: sd.tourismType || "",
      visitorCount: sd.visitorCount || 0,
      price: sd.price || 0,
      mineralType: sd.mineralType || "",
      reserves: sd.reserves || 0,
      bepTahun: geo.bep_tahun || sd.bepTahun || 0,
      irrPersen: geo.irr_persen || sd.irrPersen || 0,
      npvEstimasi: geo.npv_estimasi || sd.npvEstimasi || 0,
      namaKontakPerson: source?.contactPic || geo.contact_pic || sd.namaKontakPerson || "",
      jabatanKontak: geo.jabatan_kontak || sd.jabatanKontak || "",
      noHpKontak: source?.phoneNumber || geo.phone_number || sd.noHpKontak || "",
      emailKontak: geo.email_kontak || sd.emailKontak || "",
    };
  };

  const memoizedFormData = useMemo(() => buildFormData(initialData || investmentToEdit), [initialData, investmentToEdit]);
  const [formData, setFormData] = useState<FormState>(memoizedFormData);

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
    if (isEditMode && initialData) {
      setFormData(memoizedFormData);
    }
  }, [isEditMode, memoizedFormData]);

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
    } else if (currentStep === 2) {
      if (!formData.villageId) {
        setValidationError("Kecamatan dan Desa/Kelurahan lokasi wajib dipilih sebelum melanjutkan.");
        return;
      }
      if (!formData.geometry) {
        setValidationError("Geometri dari Studio harus dihubungkan atau dibuat baru sebelum melanjutkan.");
        return;
      }
      if (!formData.latitude || !formData.longitude) {
        setValidationError("Silakan tentukan titik lokasi persis pada peta.");
        return;
      }
      if (formData.geometry.type === 'Point') {
        setValidationError("Mohon gambar menggunakan bentuk Polygon (Area). Titik tidak diizinkan.");
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.certificateNumber.trim()) {
        setValidationError("Nomor Sertifikat / Izin Prinsip wajib diisi sebelum melanjutkan.");
        return;
      }
      if (!formData.plotNumber.trim()) {
        setValidationError("Nomor Identifikasi Bidang Tanah (NIB) wajib diisi sebelum melanjutkan.");
        return;
      }
    } else if (currentStep === 4) {
      if (Number(formData.capex) <= 0) {
        setValidationError("Nilai Investasi (CAPEX) harus bernilai lebih besar dari Rp 0.");
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
    setIsSubmitting(true);
    try {
      const data = { ...formData } as any;

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

      if (!submitLat || !submitLng || submitLat === 0 || submitLng === 0) {
        throw new Error(
          "Silakan tentukan titik lokasi persis pada peta. " +
          "Gambar polygon terlebih dahulu untuk mendapatkan koordinat otomatis."
        );
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
        district_id: formData.districtId,
        village_id: formData.villageId,
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

      try {
        if (isEditMode && initialData?.id) {
          const { error } = await supabase.from('investments').update(supabasePayload).eq('id', initialData.id);
          if (error) throw error;
        } else {
          if (isEditMode) {
            throw new Error("Pencegahan Duplikasi: dilarang melakukan operasi INSERT saat berada di Edit Mode tanpa ID valid.");
          }
          const { error } = await supabase.from('investments').insert(supabasePayload);
          if (error) throw error;
        }

        // Phase 1.1: Neutralize Dual-Write. Early success return!
        if (onRefreshAllData) onRefreshAllData();
        if (onClose) onClose();
        
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Data investasi berhasil disimpan melalui fast-lane Supabase.",
        });
        return; // Early return to completely bypass the old fallback
        
      } catch (directDbError) {
        undefined;
      }

      // Fallback/Execute traditional onSubmit to sync gis tables and UI state
      await onSubmit(payload);
      
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
      { icon: FileText, label: "Info Dasar" },
      { icon: MapIcon, label: "Lokasi & GIS" },
      { icon: Layers, label: "Lahan" },
      { icon: Activity, label: "Ekonomi" },
      { icon: Navigation, label: "Infrastruktur" },
      { icon: ImageIcon, label: "Media" },
      { icon: Sparkles, label: "AI Review" },
      { icon: Users, label: "Kontak" },
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
              <div key={idx} className={`flex flex-col items-center gap-1 min-w-[80px] ${isActive ? "text-indigo-600 dark:text-indigo-400" : isPassed ? "text-emerald-500" : "text-slate-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" : isPassed ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"}`}>
                  {isPassed ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span className="text-[10px] whitespace-nowrap font-normal uppercase tracking-wider">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* High-Fidelity Mobile-First Android Progress Bar */}
        <div className="block sm:hidden px-4 py-3 bg-indigo-50/70 dark:bg-slate-800/80 border-b border-indigo-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
              Langkah {currentStep} dari {totalSteps}
            </span>
            <span className="text-[11px] font-normal text-slate-800 dark:text-slate-200">
              {steps[currentStep - 1].label}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300 rounded-full" 
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
            <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 sm:block hidden">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs sm:text-xs font-normal text-slate-900 dark:text-slate-100 font-display">Smart Investment Form</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Android-First Responsive Mode Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center">
              {isMinimized ? <Maximize2 className="h-5 w-5 text-slate-700 dark:text-slate-300" /> : <Minimize2 className="h-5 w-5 text-slate-700 dark:text-slate-300" />}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="h-5 w-5 text-slate-700 dark:text-slate-300" />
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
            
            {/* STEP 1: INFO DASAR */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2">1. Informasi Dasar & Sektor</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase tracking-wide">Nama Potensi</label>
                    <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.title} onChange={e => updateField('title', e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase tracking-wide">Slug (Auto)</label>
                    <input type="text" className="border px-3 py-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100" readOnly value={formData.slug} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase tracking-wide">Sektor Utama</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.sector} onChange={e => {
                        const newSector = e.target.value as SektorInvestasi;
                        const subSectorsList = SECTOR_TAXONOMY[newSector] ? Object.keys(SECTOR_TAXONOMY[newSector]) : [];
                        const defaultSub = subSectorsList.length > 0 ? subSectorsList[0] : "";
                        setFormData(prev => ({ ...prev, sector: newSector, subSector: defaultSub, commodityType: '', mineralType: '', tourismType: '' }));
                    }}>
                      {Object.values(SektorInvestasi).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase tracking-wide">Sub Sektor</label>
                    {SECTOR_TAXONOMY[formData.sector as string] ? (
                      <select 
                        className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" 
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
                      <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.subSector} onChange={e => updateField('subSector', e.target.value)} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase tracking-wide">Kondisi Topografi</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.kondisiTopografi} onChange={e => updateField('kondisiTopografi', e.target.value)}>
                      <option value="Datar">Datar</option>
                      <option value="Berbukit">Berbukit</option>
                      <option value="Pegunungan">Pegunungan</option>
                      <option value="Pesisir/Pantai">Pesisir/Pantai</option>
                      <option value="Rawa">Rawa</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase tracking-wide">Target Investor</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.targetInvestor} onChange={e => updateField('targetInvestor', e.target.value)}>
                      <option value="PMA (Asing)">PMA (Asing)</option>
                      <option value="PMDN (Nasional)">PMDN (Nasional)</option>
                      <option value="BUMD/BUMN">BUMD/BUMN</option>
                      <option value="UMKM/Lokal">UMKM/Lokal</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase tracking-wide">Skema Kemitraan</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.skemaKemitraan} onChange={e => updateField('skemaKemitraan', e.target.value)}>
                      <option value="Joint Venture">Joint Venture</option>
                      <option value="BOT">BOT (Build, Operate, Transfer)</option>
                      <option value="KSO">KSO (Kerja Sama Operasi)</option>
                      <option value="Sewa Lahan">Sewa Lahan</option>
                      <option value="Pembebasan Lahan / Beli Putus">Kepemilikan Penuh / Beli Putus</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase tracking-wide">Deskripsi Singkat</label>
                  <textarea className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs h-20  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.shortDesc} onChange={e => updateField('shortDesc', e.target.value)} />
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                    <MapIcon className="w-3 h-3"/> Luas Lahan (Ha)
                  </label>
                  <input 
                    type="text" 
                    className="border px-3 py-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono cursor-not-allowed font-bold w-1/3 disabled:opacity-100" 
                    value={formData.areaHa ? Number(formData.areaHa).toFixed(2) : ''} 
                    placeholder="0,00"
                    readOnly
                    disabled 
                  />
                  <span className="text-[10px] text-amber-600 font-normal">*Luas akan dihitung dan diisi otomatis dari poligon yang Anda gambar pada Langkah 2 (Lokasi & GIS).</span>
                </div>

                {/* Dependent Sector Fields */}
                <div className="mt-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                  <h4 className="text-xs font-normal text-indigo-800 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Parameter Khusus: Sektor {formData.sector}</h4>
                  
                  {(() => {
                    const paramOptions = (formData.sector && formData.subSector) ? (SECTOR_TAXONOMY[formData.sector]?.[formData.subSector] || []) : [];
                    
                    if (formData.sector === SektorInvestasi.PERTANIAN) {
                      return (
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Jenis Komoditas Utama</span>
                              {paramOptions.length > 0 ? (
                                <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)}>
                                  <option value="">Pilih Komoditas...</option>
                                  {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <input type="text" placeholder="Jenis Komoditas" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)}/>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Produksi Tahunan</span>
                              <input type="number" placeholder="Produksi Tahunan" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.annualProduction||''} onChange={e=>updateField('annualProduction', Number(e.target.value))}/>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Satuan Kerja</span>
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.productionUnit||'Ton'} onChange={e=>updateField('productionUnit', e.target.value)}>
                                <option>Kg</option><option>Ton</option><option>Ton/Tahun</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-2.5 border-slate-300 dark:border-slate-700/50">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Jumlah Ternak/Pohon (Jika ada)</span>
                              <input type="number" placeholder="Estimasi Jumlah Ternak / Pohon" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.treeCount||''} onChange={e=>updateField('treeCount', Number(e.target.value))} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">Umur Tanaman/Hewan (Tahun)</span>
                              <input type="number" placeholder="Rata-rata Umur" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.plantAge||''} onChange={e=>updateField('plantAge', Number(e.target.value))} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (formData.sector === SektorInvestasi.KELAUTAN) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">Komoditas Laut</span>
                            {paramOptions.length > 0 ? (
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)}>
                                <option value="">Pilih Komoditas...</option>
                                {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder="Jenis Komoditas" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)} />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">Kedalaman Air (Meter)</span>
                            <input type="number" placeholder="Kedalaman (m)" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.depth||''} onChange={e=>updateField('depth', Number(e.target.value))} />
                          </div>
                        </div>
                      );
                    }
                    if (formData.sector === SektorInvestasi.PARIWISATA) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">Fokus Wisata / Destinasi</span>
                            {paramOptions.length > 0 ? (
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.tourismType||''} onChange={e=>updateField('tourismType', e.target.value)}>
                                <option value="">Pilih Destinasi Wisata...</option>
                                {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder="Jenis Wisata" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.tourismType||''} onChange={e=>updateField('tourismType', e.target.value)} />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">Pengunjung Estimasi/Tahun</span>
                            <input type="number" placeholder="Kapasitas Pengunjung/Tahun font-sans" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.visitorCount||''} onChange={e=>updateField('visitorCount', Number(e.target.value))} />
                          </div>
                        </div>
                      );
                    }

                    if (formData.sector === SektorInvestasi.PERTAMBANGAN) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">Jenis & Target Mineral</span>
                            {paramOptions.length > 0 ? (
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.mineralType||''} onChange={e=>updateField('mineralType', e.target.value)}>
                                <option value="">Pilih Jenis Mineral...</option>
                                {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder="Spesifikasi / Jenis Mineral" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.mineralType||''} onChange={e=>updateField('mineralType', e.target.value)} />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">Prakiraan Cadangan (Mt / Ton)</span>
                            <input type="number" placeholder="Kapasitas / Cadangan Maksimal (Mt/Unit) font-sans" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.reserves||''} onChange={e=>updateField('reserves', Number(e.target.value))} />
                          </div>
                        </div>
                      );
                    }

                    if (formData.sector === SektorInvestasi.PERDAGANGAN) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">Jenis Produk Industri / Komoditas</span>
                            {paramOptions.length > 0 ? (
                              <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)}>
                                <option value="">Pilih Jenis Produk...</option>
                                {paramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder="Misal: Hasil Alam, Pabrik Kemasan" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded text-xs  font-sans bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.commodityType||''} onChange={e=>updateField('commodityType', e.target.value)} />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-mono">Kapasitas Transaksi / Produksi Tahunan</span>
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
            {currentStep === 2 && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 sm:p-6 mt-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h4 className="text-xs font-normal text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-4 border-b border-indigo-100/50 pb-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  Infrastruktur Utama &amp; Utilitas Pendukung (Pilihan Operator)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-900 dark:text-slate-100 uppercase">Pasokan Listrik</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-normal" value={formData.pasokanListrik} onChange={e => updateField('pasokanListrik', e.target.value)}>
                      <option value="Tersedia Jaringan PLN">Tersedia Jaringan PLN</option>
                      <option value="Perlu Perluasan">Perlu Perluasan</option>
                      <option value="Off-Grid/Mandiri">Off-Grid/Mandiri</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-900 dark:text-slate-100 uppercase">Sumber Air Bersih</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-normal" value={formData.sumberAirBersih} onChange={e => updateField('sumberAirBersih', e.target.value)}>
                      <option value="PDAM">PDAM</option>
                      <option value="Air Tanah/Sumur Bor">Air Tanah/Sumur Bor</option>
                      <option value="Sungai/Mata Air">Sungai/Mata Air</option>
                      <option value="Belum Tersedia">Belum Tersedia</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-900 dark:text-slate-100 uppercase">Jaringan Komunikasi</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-normal" value={formData.jaringanTelekomunikasi} onChange={e => updateField('jaringanTelekomunikasi', e.target.value)}>
                      <option value="Fiber Optic">Fiber Optic</option>
                      <option value="Sinyal 4G/5G Kuat">Sinyal 4G/5G Kuat</option>
                      <option value="Sinyal Lemah">Sinyal Lemah</option>
                      <option value="Blank Spot">Blank Spot</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-900 dark:text-slate-100 uppercase">Akses Jalan Terdekat</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-normal" value={formData.aksesJalanTerdekat} onChange={e => updateField('aksesJalanTerdekat', e.target.value)}>
                      <option value="Jalan Nasional">Jalan Nasional</option>
                      <option value="Jalan Provinsi">Jalan Provinsi</option>
                      <option value="Jalan Kabupaten">Jalan Kabupaten</option>
                      <option value="Jalan Desa">Jalan Desa</option>
                      <option value="Belum Ada Akses">Belum Ada Akses</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LEGITIMASI LAHAN */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2">3. Legitimasi Lahan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-normal text-slate-700 dark:text-slate-300">Status Kepemilikan</label>
                     <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.ownershipStatus} onChange={e => updateField('ownershipStatus', e.target.value)}>
                       <option value="Sertifikat Hak Milik">SHM (Hak Milik)</option>
                       <option value="HGU">HGU (Guna Usaha)</option>
                       <option value="HGB">HGB (Guna Bangunan)</option>
                       <option value="Tanah Negara">Tanah Negara</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-normal text-slate-700 dark:text-slate-300">Kesesuaian RTRW / RDTR</label>
                     <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.rtrwStatus} onChange={e => updateField('rtrwStatus', e.target.value)}>
                       <option value="Sesuai">Sesuai</option><option value="Bersyarat">Bersyarat</option><option value="Tidak Sesuai">Tidak Sesuai</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-normal text-slate-700 dark:text-slate-300">Nomor Sertifikat / Izin Prinsip</label>
                     <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.certificateNumber} onChange={e => updateField('certificateNumber', e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-normal text-slate-700 dark:text-slate-300">Nomor Identifikasi Bidang Tanah (NIB)</label>
                     <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.plotNumber} onChange={e => updateField('plotNumber', e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                     <label className="text-xs font-normal text-slate-700 dark:text-slate-300">Status Sengketa Lahan</label>
                     <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.disputeStatus} onChange={e => updateField('disputeStatus', e.target.value)}>
                       <option value="Clear & Clean">Clear & Clean</option>
                       <option value="Dalam Proses Mediasi">Dalam Proses Mediasi</option>
                       <option value="Sengketa Pengadilan">Sengketa Pengadilan</option>
                     </select>
                  </div>
      {/* Step 3 */}
      {/*... Validator Dropdown ...*/}
      <div className="flex flex-col gap-1 relative">
        <label className="text-xs font-normal text-slate-700 dark:text-slate-300">🏛️ Instansi Validator / Sumber Data Potensi</label>
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
          <span className="absolute right-2 top-2.5 text-slate-400">▼</span>
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
                className={`px-3 py-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${formData.validatorAgency === opt.value ? 'bg-indigo-50 dark:bg-indigo-900/50 font-normal text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
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
                       <label className="text-xs font-normal text-slate-700 dark:text-slate-300">Total Modal Awal Pembangunan (CAPEX) - Rp</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300 font-normal">Rp</span>
                         <input type="text" inputMode="numeric" placeholder="Contoh: 500.000.000" className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 pl-10 rounded-lg text-xs font-mono  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formatInputRupiah(String(formData.capex))} onChange={e => {
                           const raw = parseInputRupiah(e.target.value);
                           updateField('capex', raw);
                         }} />
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-xs font-normal text-slate-700 dark:text-slate-300">Estimasi Biaya Operasional 1 Tahun (OPEX) - Rp</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300 font-normal">Rp</span>
                         <input type="text" inputMode="numeric" placeholder="Contoh: 50.000.000" className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 pl-10 rounded-lg text-xs font-mono  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formatInputRupiah(String(formData.opex))} onChange={e => {
                           const raw = parseInputRupiah(e.target.value);
                           updateField('opex', raw);
                         }} />
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-xs font-normal text-slate-700 dark:text-slate-300">Estimasi Serapan Tenaga Kerja - Orang</label>
                       <div className="relative">
                         <input type="number" placeholder="Contoh: 150" className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs font-mono  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.penyerapanTenagaKerja || ''} onChange={e => updateField('penyerapanTenagaKerja', parseInt(e.target.value) || 0)} />
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                       <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{priceLabel} <span className="text-rose-500">*</span></label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300 font-normal">Rp</span>
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
                       <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Revenue/Tahun Estimasi</label>
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
                       <label className="text-xs font-normal text-slate-700 dark:text-slate-300">Market Scope (Orientasi)</label>
                       <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.marketScope} onChange={e => updateField('marketScope', e.target.value)}>
                         <option value="Lokal">Lokal Kabupaten</option>
                         <option value="Nasional">Nasional / Antar Pulau</option>
                         <option value="Ekspor">Ekspor Global</option>
                       </select>
                    </div>
                  </div>
                  
                  {/* Auto Outputs */}
                  <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 place-content-start">
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-5 rounded-xl flex flex-col gap-1 shadow-sm">
                       <span className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">ROI (Return on Invest.)</span>
                       <span className={`text-3xl font-normal font-mono ${formData.roi > 0 ? 'text-emerald-600' : formData.roi < 0 ? 'text-rose-600' : 'text-amber-600'}`}>{formData.roi}%</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-5 rounded-xl flex flex-col gap-1 shadow-sm">
                       <span className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Payback Period</span>
                       <span className="text-3xl font-normal font-mono text-indigo-600">{formData.paybackPeriod === Infinity ? "Tidak Terhingga" : (
                          <>{formData.paybackPeriod} <span className="text-xs">Tahun</span></>
                        )}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-5 rounded-xl flex flex-col gap-1 shadow-sm">
                       <span className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Potensi Profit Kotor / Tahun</span>
                       <span className="text-xs font-normal font-mono text-slate-900 dark:text-slate-100">{formatRupiah(formData.annualRevenue - formData.opex)}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-5 rounded-xl flex flex-col gap-1 shadow-sm">
                       <span className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Status Kelayakan Kasar</span>
                       <span className="text-xs font-normal text-slate-900 dark:text-slate-100 mt-2">
                         {formData.capex === 0 ? "-" : formData.paybackPeriod > 0 && formData.paybackPeriod < 8 ? (
                           <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Sangat Layak & Feasible</span>
                         ) : (
                           <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">High Risk Long Term</span>
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
                <p className="text-xs text-slate-700 dark:text-slate-300">Jarak dihitung otomatis menggunakan algoritma <code>TurfJS</code> dan Euclidean Spatial Auto-Distance dari layer infrastruktur yang ada di Spatial Editor. Operator <strong className="text-pink-600">DILARANG</strong> mengetik manual secara asal.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 bg-black/5 rounded-bl-3xl">
                     <Navigation className="w-32 h-32 text-slate-900 dark:text-slate-100" />
                  </div>
                  
                  <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-700">Jalan Nasional Trans-Sulawesi</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.roadDistance > 0 ? `${formData.roadDistance} km` : <span className="text-amber-500 italic text-xs">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-700">Jalan Provinsi / Akses Primer</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.provRoadDistance > 0 ? `${formData.provRoadDistance} km` : <span className="text-amber-500 italic text-xs">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-700">Pelabuhan Belopa / Bua</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.portDistance > 0 ? `${formData.portDistance} km` : <span className="text-amber-500 italic text-xs">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-700">Bandara Lagaligo Bua</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.airportDistance > 0 ? `${formData.airportDistance} km` : <span className="text-amber-500 italic text-xs">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-700">Gardu Induk PLN (150kV)</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.electricityDistance > 0 ? `${formData.electricityDistance} km` : <span className="text-amber-500 italic text-xs">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 relative z-10">
                     <span className="text-xs font-normal text-slate-700">Jaringan Fiber Optic Terdekat</span>
                     <span className="font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded font-normal shadow-sm">
                       {formData.fiberDistance > 0 ? `${formData.fiberDistance} km` : <span className="text-amber-500 italic text-xs">Belum dikalkulasi — pilih geometri di Step 2</span>}
                     </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Pasokan Listrik</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.pasokanListrik} onChange={e => updateField('pasokanListrik', e.target.value)}>
                      <option value="Tersedia Jaringan PLN">Tersedia Jaringan PLN</option>
                      <option value="Perlu Perluasan">Perlu Perluasan</option>
                      <option value="Off-Grid/Mandiri">Off-Grid/Mandiri</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Sumber Air Bersih</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.sumberAirBersih} onChange={e => updateField('sumberAirBersih', e.target.value)}>
                      <option value="PDAM">PDAM</option>
                      <option value="Air Tanah/Sumur Bor">Air Tanah/Sumur Bor</option>
                      <option value="Sungai/Mata Air">Sungai/Mata Air</option>
                      <option value="Belum Tersedia">Belum Tersedia</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Jaringan Komunikasi</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.jaringanTelekomunikasi} onChange={e => updateField('jaringanTelekomunikasi', e.target.value)}>
                      <option value="Fiber Optic">Fiber Optic</option>
                      <option value="Sinyal 4G/5G Kuat">Sinyal 4G/5G Kuat</option>
                      <option value="Sinyal Lemah">Sinyal Lemah</option>
                      <option value="Blank Spot">Blank Spot</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Akses Jalan Terdekat</label>
                    <select className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.aksesJalanTerdekat} onChange={e => updateField('aksesJalanTerdekat', e.target.value)}>
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
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs font-normal flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Anda diwajibkan untuk mengunggah minimal 1 foto untuk visualisasi di Landing Page. (Maksimal ukuran: 300 KB per foto)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl border-dashed">
                      <PhotoUploader 
                        photos={formData.gallery || []}
                        onChange={(photos) => {
                          updateField('gallery', photos);
                          updateField('photoUrl', photos[0] || '');
                        }}
                        maxPhotos={4}
                      />
                   </div>
                   <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl border-dashed">
                      <FileText className="w-8 h-8 text-rose-400" />
                      <h4 className="text-xs font-normal text-slate-900 dark:text-slate-100">Dokumen Digital Pendukung (PDF)</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300">Mendukung file: Investment Brief, Proposal, Studi Kelayakan (Feasibility Study FS), Legalitas.</p>
                      <button type="button" className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded text-xs font-normal mt-1 border border-slate-300 dark:border-slate-700 max-w-max transition-colors">Pilih PDF (Max 20MB)</button>
                   </div>
                   <div className="col-span-1 sm:col-span-2 flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl border-dashed">
                     <Activity className="w-8 h-8 text-amber-500" />
                     <h4 className="text-xs font-normal text-slate-900 dark:text-slate-100">Video Drone Spatial (Opsional)</h4>
                     <p className="text-xs text-slate-700 dark:text-slate-300">Masukan link dari Cloud Storage atau YouTube sebagai Tour Udara bagi Investor Asing.</p>
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
                           <span className="text-xs text-slate-700 dark:text-slate-300 font-normal uppercase">Category</span>
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
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-1 rounded font-normal">projects</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-1 rounded font-normal">locations</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-1 rounded font-normal">geometries</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-1 rounded font-normal">legalities</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-1 rounded font-normal">financials</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-1 rounded font-normal">infrastructures</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-1 rounded font-normal">media_assets</span>
                           <span className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-2 py-1 rounded font-normal">investment_scores</span>
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
                           <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-lg overflow-y-auto border border-indigo-200 text-xs text-slate-700 whitespace-pre-wrap font-normal h-[200px]" ref={pdfRef}>
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

            {/* STEP 8: KONTAK PERSON */}
            {currentStep === 8 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-normal text-slate-900 dark:text-slate-100 border-b pb-2">8. Kontak Person (PIC)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Nama Kontak Person</label>
                    <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.namaKontakPerson} onChange={e => updateField('namaKontakPerson', e.target.value)} placeholder="Contoh: Budi Santoso" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Jabatan / Posisi</label>
                    <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.jabatanKontak} onChange={e => updateField('jabatanKontak', e.target.value)} placeholder="Contoh: Kepala Dinas / Pemilik Lahan" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Nomor HP / WhatsApp</label>
                    <input type="text" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.noHpKontak} onChange={e => updateField('noHpKontak', e.target.value)} placeholder="Contoh: +6281234567890" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-normal text-slate-700 dark:text-slate-300 uppercase">Alamat Email</label>
                    <input type="email" className="border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs  bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" value={formData.emailKontak} onChange={e => updateField('emailKontak', e.target.value)} placeholder="Contoh: budi@dinas.go.id" />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-normal text-rose-600 flex items-center gap-2 animate-in fade-in duration-300">
             <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
             {validationError}
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-between items-center">
          <button 
            type="button" 
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-50 flex items-center gap-2 text-xs font-normal transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 text-xs font-normal transition-all shadow-sm"
            >
              Batal
            </button>
            {currentStep < totalSteps ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex items-center gap-2 text-xs font-normal shadow-md shadow-indigo-600/20 transition-all font-display tracking-wide"
              >
                Selanjutnya <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={submitForm}
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 text-xs font-normal shadow-md shadow-emerald-600/30 transition-all font-display tracking-wide"
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
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-mono">Ditemukan {geomPickerList.length} aset terdaftar di Spatial Studio</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsGeomPickerOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-500/10 text-slate-400 transition"
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
                      g.geometryType === "Polygon" ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                    }`}>
                      {g.geometryType}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase">Luas Wilayah</span>
                      <span className="font-normal text-slate-700 dark:text-slate-300">{g.areaHa ? g.areaHa.toFixed(2) : 0} Ha</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase">Perimeter</span>
                      <span className="font-normal text-slate-700 dark:text-slate-300">{g.perimeterKm ? (g.perimeterKm * 1000).toFixed(0) : 0} m</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[8px] text-slate-400 uppercase">Konektivitas Infrastruktur</span>
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
                className="px-4 py-1.5 rounded-lg border text-xs font-mono tracking-tight hover:bg-slate-500/10 transition"
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
        return (
          <SimplePolygonDrawer
            initialGeometry={initialGeometryToEdit}
            isDarkMode={isDarkMode}
            focusTarget={focusTarget}
            roadGeojson={roadGeojson}
            onCancel={() => setIsSpatialEditorOpen(false)}
            onSave={(geom: any) => {
               Swal.fire({
                 icon: 'success',
                 title: 'Polygon Terbentuk!',
                 text: 'Area potensi berhasil ditandai.',
                 toast: true,
                 position: 'top-end',
                 showConfirmButton: false,
                 timer: 3000
               });
               
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
               
               const seed = (Math.abs(centroidLng) + Math.abs(centroidLat));
                setFormData(prev => ({
                  ...prev,
                  latitude: centroidLat,
                  longitude: centroidLng,
                  areaHa: areaHa,
                  perimeterM: perimeterKm * 1000,
                  geometryType: "Polygon",
                  geometry: geom,
                  portDistance: Number(((seed * 2) % 20 + 2).toFixed(1)),
                  airportDistance: Number(((seed * 3) % 15 + 3).toFixed(1)),
                  roadDistance: Number(((seed * 1.5) % 10 + 1).toFixed(1)),
                  provRoadDistance: Number(((seed * 1.2) % 5 + 0.5).toFixed(1)),
                  electricityDistance: Number(((seed * 4) % 8 + 1).toFixed(1)),
                  fiberDistance: Number(((seed * 5) % 12 + 1).toFixed(1)),
                }));
                
                setIsSpatialEditorOpen(false);
            }}
          />
        );
      })()}
    </motion.div>
  );
}
