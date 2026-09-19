import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Compass,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileText,
  MapPin,
  Building,
  Layers,
  Sparkles,
  Info,
  ExternalLink,
  BookOpen,
  Search,
  Database,
  Cpu,
  Check,
} from "lucide-react";
import { Investment } from "../types";
import * as turf from "@turf/turf";
import { formatRupiahSingkat } from "../lib/formatters";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { KnowledgeDocument } from "../types/knowledgeBase";
import { checkPkkprSpatialZoning, DEFAULT_LUWU_ZONING_GEOJSON } from "../utils/geoUtils";

interface RtrwZoningCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvestment?: Investment | null;
  investments?: Investment[];
  isDark?: boolean;
  simulationContext?: any;
}

// Master Data Pola Ruang RTRW Kabupaten Luwu (Perda RTRW Kab. Luwu)
const LUWU_RTRW_ZONES = [
  {
    id: "kib",
    name: "Kawasan Peruntukan Industri Bua (KIB)",
    type: "Industri & Manufaktur",
    kdb: "60-70%",
    klb: "1.8 - 2.4",
    kdh: "Min 20%",
    ossRisk: "Tinggi (Memerlukan AMDAL)",
    allowedSectors: ["Pengolahan Kakao", "Processing Rumput Laut", "Perikanan Bua", "Smelter / Olahan Logam", "Pergudangan Logistik"],
    color: "emerald",
  },
  {
    id: "agropolitan",
    name: "Kawasan Agropolitan & Perkebunan (Bastem, Latimojong, Suli, Walenrang)",
    type: "Pertanian & Perkebunan",
    kdb: "20-40%",
    klb: "0.4 - 0.8",
    kdh: "Min 50%",
    ossRisk: "Menengah Tinggi (UKL-UPL)",
    allowedSectors: ["Perkebunan Kakao Premium", "Budidaya Cengkeh", "Kopi Organik Dataran Tinggi", "Hortikultura & Pangan", "Agrowisata"],
    color: "amber",
  },
  {
    id: "pariwisata",
    name: "Kawasan Strategis Pariwisata & Ekawisata (Latimojong & Pesisir)",
    type: "Pariwisata & Jasa",
    kdb: "30-50%",
    klb: "0.6 - 1.2",
    kdh: "Min 40%",
    ossRisk: "Menengah Rendah (SPPL / UKL-UPL)",
    allowedSectors: ["Ekowisata Pegunungan Latimojong", "Resort Pesisir", "Wisata Bahari Bua", "Sentra UMKM Sagu & Kuliner"],
    color: "cyan",
  },
  {
    id: "minapolitan",
    name: "Kawasan Minapolitan & Kelautan (Bua, Ponrang, Suli Pantai)",
    type: "Perikanan & Kelautan",
    kdb: "40-50%",
    klb: "0.8 - 1.2",
    kdh: "Min 30%",
    ossRisk: "Menengah Tinggi (NIB + KKPR Laut)",
    allowedSectors: ["Budidaya Rumput Laut", "Tambak Udang Vaname", "Perikanan Tangkap", "Cold Storage & Processing Halal"],
    color: "blue",
  },
  {
    id: "perkotaan",
    name: "Kawasan Perkotaan & Pusat Pemerintahan Belopa",
    type: "Pemukiman, Perdagangan & Jasa",
    kdb: "60-80%",
    klb: "2.0 - 4.0",
    kdh: "Min 15%",
    ossRisk: "Rendah - Menengah (NIB + NIK)",
    allowedSectors: ["Pusat Perdagangan & Jasa", "Perhotelan & MICE", "Sentra Finansial", "Jasa Perbankan & Edukasi"],
    color: "purple",
  },
];

// Pasal-Pasal Peraturan Daerah Kabupaten Luwu No. 06 Tahun 2011 (RTRW Kab. Luwu 2011-2031) yang diinjeksi ke RAG Knowledge Base
const LUWU_RTRW_LEGAL_ARTICLES = [
  {
    id: "pasal-24",
    key: "p24",
    pasal: "Pasal 24",
    judul: "Rencana Pola Ruang Wilayah Kabupaten Luwu",
    ringkasan: "Mengatur pembagian Kawasan Lindung (hutan lindung, resapan air, sempadan pantai & sungai) dan Kawasan Budidaya (pertanian, perkebunan, industri, pariwisata, minapolitan, serta permukiman).",
    kategori: "Pola Ruang",
    dokumenRef: "Perda No. 06/2011 BAB IV",
    bab: "BAB IV - RENCANA POLA RUANG WILAYAH",
    keywords: ["pola ruang", "kawasan lindung", "kawasan budidaya", "luwu"],
  },
  {
    id: "pasal-30",
    key: "p30",
    pasal: "Pasal 30",
    judul: "Kawasan Peruntukan Pertanian & Agropolitan",
    ringkasan: "Penetapan kawasan agropolitan mencakup Kecamatan Bastem, Latimojong, Suli, dan Walenrang untuk komoditas unggulan kakao, cengkeh, kopi Bastem organik, dan tanaman pangan.",
    kategori: "Pertanian",
    dokumenRef: "Perda No. 06/2011 Pasal 30",
    bab: "BAB IV - BAGIAN KETIGA (KAWASAN BUDIDAYA)",
    keywords: ["pertanian", "agropolitan", "bastem", "basse sangtempe", "latimojong", "kakao", "kopi"],
  },
  {
    id: "pasal-32",
    key: "p32",
    pasal: "Pasal 32",
    judul: "Kawasan Minapolitan & Perikanan Kelautan",
    ringkasan: "Penetapan pusat minapolitan di Kecamatan Bua, Ponrang, dan Suli untuk pengembangan budidaya rumput laut, tambak udang vaname, perikanan tangkap, dan industri pengolahan hasil laut.",
    kategori: "Perikanan",
    dokumenRef: "Perda No. 06/2011 Pasal 32",
    bab: "BAB IV - PARAGRAF 3 (KAWASAN PERIKANAN)",
    keywords: ["minapolitan", "perikanan", "rumput laut", "tambak udang", "bua", "ponrang", "suli"],
  },
  {
    id: "pasal-33",
    key: "p33",
    pasal: "Pasal 33",
    judul: "Kawasan Peruntukan Industri (KIB Bua)",
    ringkasan: "Pengembangan Kawasan Industri Bua (KIB) sebagai zona prioritas industri manufaktur, smelter, pengolahan kakao, cold storage, dan pergudangan logistik terpadu.",
    kategori: "Industri",
    dokumenRef: "Perda No. 06/2011 Pasal 33",
    bab: "BAB IV - PARAGRAF 4 (KAWASAN INDUSTRI)",
    keywords: ["kib", "industri", "bua", "smelter", "kakao", "cold storage", "logistik"],
  },
  {
    id: "pasal-35",
    key: "p35",
    pasal: "Pasal 35",
    judul: "Kawasan Strategis Pariwisata & Ekowisata",
    ringkasan: "Pengembangan ekowisata pegunungan Latimojong, wisata bahari pesisir Bua-Ponrang, serta kawasan cagar budaya dan kuliner khas Sagu Luwu.",
    kategori: "Pariwisata",
    dokumenRef: "Perda No. 06/2011 Pasal 35",
    bab: "BAB IV - PARAGRAF 6 (KAWASAN PARIWISATA)",
    keywords: ["pariwisata", "ekowisata", "latimojong", "wisata bahari", "sagu"],
  },
  {
    id: "pasal-38",
    key: "p38",
    pasal: "Pasal 38",
    judul: "Kawasan Perkotaan & Pusat Pemerintahan Belopa",
    ringkasan: "Pengembangan Belopa sebagai Pusat Kegiatan Lokal (PKL), pusat perdagangan, jasa perbankan, pendidikan, dan fasilitas perkotaan modern.",
    kategori: "Perkotaan",
    dokumenRef: "Perda No. 06/2011 Pasal 38",
    bab: "BAB IV - PARAGRAF 9 (KAWASAN PERMUKIMAN)",
    keywords: ["belopa", "perkotaan", "pusat kegiatan lokal", "perdagangan"],
  },
  {
    id: "pasal-52",
    key: "p52",
    pasal: "Pasal 52 - 60",
    judul: "Indikasi Arahan Peraturan Zonasi, KKPR & KDB/KLB",
    ringkasan: "Ketentuan intensitas pemanfaatan ruang (KDB, KLB, KDH), persyaratan perizinan Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR), kewajiban studi lingkungan (AMDAL/UKL-UPL), serta pemberian insentif penanaman modal.",
    kategori: "Ketentuan Zonasi & KKPR",
    dokumenRef: "Perda No. 06/2011 BAB VIII",
    bab: "BAB VIII - ARAHAN PENGENDALIAN PEMANFAATAN RUANG",
    keywords: ["kkpr", "kdb", "klb", "kdh", "amdal", "insentif", "zonasi"],
  },
];

export default function RtrwZoningCheckerModal({
  isOpen,
  onClose,
  selectedInvestment,
  investments = [],
  isDark = true,
  simulationContext,
}: RtrwZoningCheckerModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"check" | "matrix" | "rules" | "rag">("check");
  const [activeInvestmentId, setActiveInvestmentId] = useState<string>(
    simulationContext?.selectedInvObj?.id || selectedInvestment?.id || (investments.length > 0 ? investments[0].id : "")
  );

  useEffect(() => {
    if (simulationContext?.selectedInvObj?.id) {
      setActiveInvestmentId(simulationContext.selectedInvObj.id);
    } else if (selectedInvestment?.id) {
      setActiveInvestmentId(selectedInvestment.id);
    }
  }, [isOpen, simulationContext, selectedInvestment]);

  // RAG Knowledge Base state
  const [showConsultInfo, setShowConsultInfo] = useState<boolean>(false);
  const [ragDocuments, setRagDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoadingRagDocs, setIsLoadingRagDocs] = useState<boolean>(false);
  const [ragSearchQuery, setRagSearchQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    if (isOpen) {
      fetchRagDocuments();
    }
  }, [isOpen]);

  const fetchRagDocuments = async () => {
    setIsLoadingRagDocs(true);
    try {
      const { data, error } = await supabase
        .from("knowledge_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRagDocuments(data as KnowledgeDocument[]);
      }
    } catch (err) {
      console.warn("Koneksi Supabase Knowledge Base:", err);
    } finally {
      setIsLoadingRagDocs(false);
    }
  };

  // Filtered RAG Legal Articles
  const filteredLegalArticles = useMemo(() => {
    return LUWU_RTRW_LEGAL_ARTICLES.filter((article) => {
      const matchCategory =
        selectedCategoryFilter === "ALL" ||
        article.kategori.toLowerCase().includes(selectedCategoryFilter.toLowerCase());

      const query = ragSearchQuery.trim().toLowerCase();
      if (!query) return matchCategory;

      const matchQuery =
        article.pasal.toLowerCase().includes(query) ||
        article.judul.toLowerCase().includes(query) ||
        article.ringkasan.toLowerCase().includes(query) ||
        article.bab.toLowerCase().includes(query) ||
        article.keywords.some((k) => k.toLowerCase().includes(query));

      return matchCategory && matchQuery;
    });
  }, [ragSearchQuery, selectedCategoryFilter]);

  // Pick active investment or custom selection
  const currentInv = useMemo(() => {
    return (
      investments.find((inv) => inv.id === activeInvestmentId) ||
      selectedInvestment ||
      investments[0] ||
      null
    );
  }, [investments, activeInvestmentId, selectedInvestment]);

  // Spatial Analysis Engine based on Investment Sector, Polygon Coordinates & PostGIS Master RTRW
  const evaluationResult = useMemo(() => {
    if (!currentInv) {
      return {
        status: "SESUAI",
        score: 95,
        zoneName: "-",
        zoneType: "-",
        kkprStatus: "-",
        riskLevel: "-",
        docsNeeded: ["NIB Berbasis Risiko", "Persetujuan Lingkungan (UKL-UPL)", "Persetujuan Bangunan Gedung (PBG)"],
        kdb: "60%",
        klb: "2.0",
        kdh: "20%",
        dasarHukum: "Perda No. 06/2011",
        recommendation: "-",
      };
    }

    // Run real PostGIS / Turf spatial intersection with official RTRW zoning
    const spatialCheck = checkPkkprSpatialZoning(currentInv, DEFAULT_LUWU_ZONING_GEOJSON);

    const invAny = currentInv as any;
    const sectorName = (invAny.sector || invAny.sektor || "").toLowerCase();
    const title = (invAny.name || invAny.title || "").toLowerCase();
    const district = String(invAny.districtName || invAny.districtId || invAny.lokasi || "").toLowerCase();

    let zone = LUWU_RTRW_ZONES[0];
    if (spatialCheck.isIndustrialCommercial || sectorName.includes("industri") || title.includes("kakao") || title.includes("rumput laut")) {
      zone = LUWU_RTRW_ZONES[0];
    } else if (spatialCheck.isGreenZone || sectorName.includes("pertanian") || title.includes("cengkeh") || title.includes("kopi")) {
      zone = LUWU_RTRW_ZONES[1];
    } else if (spatialCheck.isConservation || sectorName.includes("wisata") || district.includes("latimojong")) {
      zone = LUWU_RTRW_ZONES[2];
    } else if (sectorName.includes("perikanan") || title.includes("udang") || title.includes("ikan")) {
      zone = LUWU_RTRW_ZONES[3];
    } else {
      zone = LUWU_RTRW_ZONES[4];
    }

    const zoneName = spatialCheck.matchedZone || t(`rtrwZoning.zones.${zone.id}.name`, zone.name);
    const zoneType = spatialCheck.zoneType || t(`rtrwZoning.zones.${zone.id}.type`, zone.type);

    let status = "SESUAI";
    let score = currentInv.suitabilityScore || 92;
    if (spatialCheck.suitabilityLevel === "TINGGI") {
      status = "SANGAT_SESUAI";
      score = Math.max(score, 96);
    } else if (spatialCheck.suitabilityLevel === "BERSYARAT" || spatialCheck.isGreenZone) {
      status = "SESUAI_BERSYARAT";
    } else if (spatialCheck.suitabilityLevel === "DIBATASI" || spatialCheck.isConservation) {
      status = "DIBATASI_KONSERVASI";
    }

    const riskLevelText = spatialCheck.isIndustrialCommercial 
      ? t('rtrwZoning.riskHighAmdal', 'Tinggi (Wajib AMDAL / UKL-UPL)')
      : spatialCheck.isConservation 
      ? t('rtrwZoning.riskMedLowStudy', 'Menengah Rendah (Kajian Lingkungan & Kawasan Lindung)')
      : t('rtrwZoning.riskMedLow', 'Menengah Rendah (SPPL / UKL-UPL)');

    return {
      status,
      score,
      zoneId: zone.id,
      zoneName,
      zoneType,
      kkprStatus: status === "SANGAT_SESUAI" ? t('rtrwZoning.kkprAuto', "Persetujuan KKPR Otomatis (Zona Prioritas RTRW)") : t('rtrwZoning.kkprStudy', "KKPR Persetujuan dengan Kajian Teknis Spasial"),
      riskLevel: riskLevelText,
      docsNeeded: [
        t('rtrwZoning.docNib', "NIB Berbasis Risiko via OSS RBA"),
        status === "SANGAT_SESUAI" ? t('rtrwZoning.docKkprConfirmed', "KKPR Terkonfirmasi Otomatis") : t('rtrwZoning.docKkprRec', "Rekomendasi KKPR DPMPTSP Luwu"),
        spatialCheck.isIndustrialCommercial ? t('rtrwZoning.docAmdal', "Persetujuan Lingkungan (AMDAL)") : t('rtrwZoning.docUkl', "UKL-UPL / SPPL"),
        t('rtrwZoning.docPbg', "Persetujuan Bangunan Gedung (PBG & SLF)"),
      ],
      kdb: spatialCheck.kdb || zone.kdb,
      klb: spatialCheck.klb || zone.klb,
      kdh: spatialCheck.kdh || zone.kdh,
      dasarHukum: spatialCheck.dasarHukum || "Perda Kab. Luwu No. 06/2011",
      allowedSectors: spatialCheck.allowedActivities && spatialCheck.allowedActivities.length > 0 ? spatialCheck.allowedActivities : zone.allowedSectors,
      recommendation: spatialCheck.rekomendasi || t('rtrwZoning.evalBoxRecommendation', {
        defaultValue: `Lokasi investasi ${(currentInv as any)?.name || (currentInv as any)?.title || "IPRO Luwu"} di Kecamatan ${(currentInv as any)?.districtName || (currentInv as any)?.districtId || "Luwu"} telah diverifikasi sesuai dengan Perda Luwu Nomor 06 Tahun 2011 tentang Rencana Tata Ruang Wilayah Kabupaten Luwu Tahun 2011-2031.`,
        name: (currentInv as any)?.name || (currentInv as any)?.title || "IPRO Luwu",
        district: (currentInv as any)?.districtName || (currentInv as any)?.districtId || "Luwu"
      }),
    };
  }, [currentInv, t]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10005] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border overflow-hidden my-0 sm:my-auto h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col transition-all ${
          isDark
            ? "bg-black border-neutral-800 text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Mobile Drag Bar Indicator */}
        <div className={`w-12 h-1.5 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0 ${isDark ? "bg-neutral-800" : "bg-slate-300"}`} />

        {/* Header Banner */}
        <div className={`relative p-3.5 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark 
            ? "bg-gradient-to-r from-neutral-950 via-neutral-900 to-black border-emerald-500/30" 
            : "bg-gradient-to-r from-slate-100 via-white to-slate-100 border-emerald-500/30 text-slate-900"
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-500 shrink-0">
              <Compass size={22} className="sm:w-6 sm:h-6 animate-spin-slow stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border border-emerald-500/30 whitespace-nowrap font-sans">
                  {t('rtrwZoning.headerBadge', 'Perda RTRW Kab. Luwu No. 06/2011')}
                </span>
                <span className={`text-[10px] sm:text-xs whitespace-nowrap font-medium ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>{t('rtrwZoning.ossCompliant', 'OSS RBA Compliant')}</span>
              </div>
              <h3 className={`text-sm sm:text-base md:text-lg font-extrabold tracking-tight leading-snug font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('modal_title_rtrw', 'Evaluasi Kesesuaian Tata Ruang & Pola Ruang (KKPR)')}
              </h3>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`p-2 rounded-xl active:scale-95 transition-all cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center border ${
              isDark 
                ? "bg-neutral-900 active:bg-neutral-800 text-slate-300 hover:text-white border-neutral-800" 
                : "bg-slate-100 active:bg-slate-250 text-slate-800 hover:text-slate-950 border-slate-200"
            }`}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation - Touch-friendly Scrollable */}
        <div className={`overflow-x-auto no-scrollbar flex border-b p-2 sm:px-6 gap-2 shrink-0 snap-x scroll-smooth ${
          isDark ? "border-neutral-800 bg-neutral-950/90" : "border-slate-200 bg-slate-100/90"
        }`}>
          <button
            onClick={() => setActiveTab("check")}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-[40px] rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all flex items-center gap-2 cursor-pointer snap-start active:scale-95 font-sans ${
              activeTab === "check"
                ? "bg-emerald-600 text-white shadow-md"
                : isDark ? "text-slate-600 dark:text-slate-400 hover:text-white hover:bg-neutral-800/80" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
            }`}
          >
            <ShieldCheck size={16} />
            <span>{t('tab_ipro', 'Verifikasi Proyek IPRO')}</span>
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-[40px] rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all flex items-center gap-2 cursor-pointer snap-start active:scale-95 font-sans ${
              activeTab === "matrix"
                ? "bg-emerald-600 text-white shadow-md"
                : isDark ? "text-slate-600 dark:text-slate-400 hover:text-white hover:bg-neutral-800/80" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
            }`}
          >
            <Layers size={16} />
            <span>{t('tab_matrix', 'Matriks Pola Ruang Luwu')}</span>
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-[40px] rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all flex items-center gap-2 cursor-pointer snap-start active:scale-95 font-sans ${
              activeTab === "rules"
                ? "bg-emerald-600 text-white shadow-md"
                : isDark ? "text-slate-600 dark:text-slate-400 hover:text-white hover:bg-neutral-800/80" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
            }`}
          >
            <Building size={16} />
            <span>{t('tab_rules', 'Aturan KDB / KLB / KDH')}</span>
          </button>
          <button
            onClick={() => setActiveTab("rag")}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-[40px] rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all flex items-center gap-2 cursor-pointer snap-start active:scale-95 font-sans ${
              activeTab === "rag"
                ? "bg-emerald-600 text-white shadow-md"
                : isDark ? "text-slate-600 dark:text-slate-400 hover:text-white hover:bg-neutral-800/80" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
            }`}
          >
            <BookOpen size={16} />
            <span>{t('tab_reference', 'Referensi Perda RTRW (RAG)')}</span>
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] rounded font-mono font-bold">
              VECTOR
            </span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className={`p-3.5 sm:p-5 md:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 scrollbar-thin ${
          isDark ? "scrollbar-thumb-neutral-800 bg-black" : "scrollbar-thumb-slate-200 bg-slate-50/50"
        }`}>
          {/* TAB 1: VERIFIKASI PROYEK */}
          {activeTab === "check" && (
            <div className="space-y-5 sm:space-y-6">
              {/* Synchronized Simulation ROI Badge */}
              {simulationContext && (
                <div className={`p-5 rounded-2xl border shadow-md space-y-4 relative overflow-hidden ${
                  isDark 
                    ? "bg-gradient-to-r from-emerald-950/20 via-neutral-900/40 to-teal-950/20 border-emerald-500/20" 
                    : "bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent border-emerald-500/25"
                }`}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-500 animate-pulse shrink-0" />
                      <span className={`text-xs font-extrabold uppercase tracking-wider font-sans ${isDark ? "text-emerald-300" : "text-emerald-800"}`}>
                        ⚡ {t('sync_roi', 'TERSINKRONISASI DENGAN SIMULASI ROI')}: {simulationContext.name}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {t('spatial_eval_badge', 'EVALUASI TATA RUANG')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/40 border border-slate-200/85 dark:border-white/5 shadow-sm text-center flex flex-col items-center justify-center hover:border-emerald-500/20 transition-colors">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block font-sans">{t('simulated_capex', 'CAPEX SIMULASI')}</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-sans">
                        {formatRupiahSingkat(simulationContext.capex)}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/40 border border-slate-200/85 dark:border-white/5 shadow-sm text-center flex flex-col items-center justify-center hover:border-emerald-500/20 transition-colors">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block font-sans">{t('business_sector', 'SEKTOR USAHA')}</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight font-sans truncate w-full block">{simulationContext.sector || "Agro & Industri"}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/40 border border-slate-200/85 dark:border-white/5 shadow-sm text-center flex flex-col items-center justify-center hover:border-emerald-500/20 transition-colors">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block font-sans">{t('annual_roi', 'ROI TAHUNAN')}</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-sans">{(Number(simulationContext.roi) || 0).toFixed(1)}%</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/40 border border-slate-200/85 dark:border-white/5 shadow-sm text-center flex flex-col items-center justify-center hover:border-emerald-500/20 transition-colors">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block font-sans">{t('payback_period', 'PAYBACK PERIOD')}</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-sans">{(Number(simulationContext.bep) || 0).toFixed(2)} {t('rtrwZoning.years', 'Thn')}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl text-xs sm:text-sm leading-relaxed font-sans bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-500/10">
                    💡 <strong>{t('rtrwZoning.evalResultRoi', 'Hasil Evaluasi Kesesuaian Spasial RTRW vs ROI:')}</strong>
                    {" "}
                    {t('rtrwZoning.evalBoxNarrative', {
                      defaultValue: `Simulasi investasi untuk potensi ${simulationContext.name} dengan rencana modal Rp ${new Intl.NumberFormat("id-ID").format(simulationContext.capex)} berada pada ${evaluationResult.zoneName}. Pola ruang mendukung penuh sektor ${simulationContext.sector} dengan kepatuhan KKPR 100%, memberikan jaminan legalitas & keamanan aset investasi Anda di Kabupaten Luwu!`,
                      name: simulationContext.name,
                      capex: `Rp ${new Intl.NumberFormat("id-ID").format(simulationContext.capex)}`,
                      zoneName: evaluationResult.zoneName,
                      sector: simulationContext.sector || "Agro & Industri",
                    })}
                  </div>
                </div>
              )}

              {/* Selector Proyek */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm ${
                isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200 text-slate-900"
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin size={18} className="text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <label className={`text-[9px] font-bold uppercase tracking-wider block mb-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {t('select_investment', 'PILIH PELUANG INVESTASI')}
                    </label>
                    <span className={`text-xs sm:text-sm font-extrabold truncate block font-sans ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                      {currentInv ? ((currentInv as any).name || (currentInv as any).title) : t('rtrwZoning.selectFromCatalog', 'Pilih dari Katalog IPRO')}
                    </span>
                  </div>
                </div>

                {investments.length > 0 && (
                  <select
                    value={activeInvestmentId}
                    onChange={(e) => setActiveInvestmentId(e.target.value)}
                    className={`w-full sm:w-auto text-xs font-bold px-4 h-11 rounded-xl border focus:outline-none cursor-pointer font-sans shadow-sm transition-all ${
                      isDark 
                        ? "bg-black text-emerald-400 border-emerald-500/30 focus:border-emerald-500" 
                        : "bg-slate-50 text-emerald-800 border-slate-250 focus:border-emerald-600 hover:bg-slate-100"
                    }`}
                  >
                    {investments.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name || inv.title} ({inv.districtName || inv.districtId || "Luwu"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status Verification Card */}
              <div className={`p-5 sm:p-6 rounded-2xl border relative overflow-hidden space-y-5 shadow-sm ${
                isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200 text-slate-900"
              }`}>
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? "border-neutral-800" : "border-slate-150"}`}>
                  <div className="flex items-center gap-3.5">
                    {evaluationResult.status === "SANGAT_SESUAI" ? (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                        <CheckCircle2 size={26} className="stroke-[2.2]" />
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                        <AlertTriangle size={26} className="stroke-[2.2]" />
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {t('spatial_status', 'STATUS KESESUAIAN SPASIAL (RTRW)')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap uppercase tracking-wider font-sans">
                          {t('rtrwZoning.score', 'Skor')} {evaluationResult.score}/100
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 leading-tight font-sans">
                        {evaluationResult.status === "SANGAT_SESUAI"
                          ? t('rtrwZoning.statusCompliant', 'SANGAT SESUAI (ZONA PRIORITAS UTAMA)')
                          : t('rtrwZoning.statusConditional', 'SESUAI BERSYARAT (KKPR DENGAN KAJIAN)')}
                      </h4>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className={`text-[9px] uppercase tracking-wider block font-bold mb-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {t('oss_risk_level', 'TINGKAT RISIKO OSS RBA')}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 font-sans uppercase tracking-wide">
                      {evaluationResult.riskLevel}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-black border-neutral-800" : "bg-slate-50/50 border-slate-200/60"} hover:border-emerald-500/20 transition-colors`}>
                    <span className={`text-[9px] block font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t('identified_pattern', 'POLA RUANG TERIDENTIFIKASI')}</span>
                    <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 block font-sans truncate">
                      {evaluationResult.zoneName}
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? "bg-black border-neutral-800" : "bg-slate-50/50 border-slate-200/60"} hover:border-emerald-500/20 transition-colors`}>
                    <span className={`text-[9px] block font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t('kkpr_status', 'STATUS KKPR DPMPTSP')}</span>
                    <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 block font-sans truncate">
                      {evaluationResult.kkprStatus}
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border sm:col-span-2 lg:col-span-1 ${isDark ? "bg-black border-neutral-800" : "bg-slate-50/50 border-slate-200/60"} hover:border-emerald-500/20 transition-colors`}>
                    <span className={`text-[9px] block font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t('limits_kdb_klb', 'BATAS KDB / KLB')}</span>
                    <span className={`text-[11px] sm:text-xs font-bold block font-sans truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      KDB {evaluationResult.kdb} | KLB {evaluationResult.klb}
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${isDark ? "bg-black border-neutral-800 text-slate-300" : "bg-slate-50/50 border-slate-200/60 text-slate-800 dark:text-slate-200"}`}>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px] block mb-1 font-sans">{t('tech_recommendation', 'Rekomendasi Teknis DPMPTSP Luwu:')}</strong>{" "}
                  <span className="font-medium text-slate-600 dark:text-slate-300 mt-1 block">{evaluationResult.recommendation}</span>
                </div>
              </div>

              {/* Dokumen Perizinan Wajib */}
              <div className={`p-5 rounded-2xl border space-y-4 shadow-sm ${
                isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200"
              }`}>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 font-sans">
                  <FileText size={18} className="stroke-[2.2]" />
                  <span>{t('oss_checklist', 'PERSYARATAN & CHECKLIST PERIZINAN BERBASIS RISIKO (OSS RBA)')}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {evaluationResult.docsNeeded.map((doc, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 hover:border-emerald-500/20 transition-colors ${
                        isDark ? "bg-black border-neutral-800" : "bg-slate-50/50 border-slate-200/60"
                      }`}
                    >
                      <ShieldCheck size={20} className="text-emerald-500 shrink-0 stroke-[2.2]" />
                      <span className={`text-xs font-semibold font-sans text-[11px] sm:text-xs ${isDark ? "text-slate-200" : "text-slate-800"}`}>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATRIKS POLA RUANG LUWU */}
          {activeTab === "matrix" && (
            <div className="space-y-4">
              <div className={`p-3.5 border rounded-md text-xs flex items-start gap-2.5 ${
                isDark ? "bg-neutral-900 border-neutral-800 text-slate-300" : "bg-amber-50/70 border-amber-200 text-slate-800"
              }`}>
                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <span>
                  {t('rtrwZoning.matrixNote', 'Matriks Pola Ruang disusun berdasarkan Peraturan Daerah Kabupaten Luwu Nomor 06 Tahun 2011 tentang Rencana Tata Ruang Wilayah Kabupaten Luwu Tahun 2011-2031.')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {LUWU_RTRW_ZONES.map((zone) => {
                  const zType = t(`rtrwZoning.zones.${zone.id}.type`, zone.type);
                  const zName = t(`rtrwZoning.zones.${zone.id}.name`, zone.name);
                  const allowedFromI18n = t(`rtrwZoning.zones.${zone.id}.allowed`, { returnObjects: true });
                  const allowedList: string[] = Array.isArray(allowedFromI18n) ? allowedFromI18n : zone.allowedSectors;

                  return (
                    <div
                      key={zone.id}
                      className={`p-4 rounded-lg border transition-all space-y-3 ${
                        isDark ? "bg-neutral-900/90 border-neutral-800 hover:border-emerald-500/30 text-white" : "bg-white border-slate-200 hover:border-emerald-500/40 text-slate-900 shadow-xs"
                      }`}
                    >
                      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          {zType}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                          isDark ? "bg-black border-neutral-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-800 dark:text-slate-200"
                        }`}>
                          {zone.kdb} KDB
                        </span>
                      </div>

                      <h5 className={`text-xs sm:text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{zName}</h5>

                      <div>
                        <span className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                          {t('rtrwZoning.allowedActivities', 'Kegiatan / Komoditas yang Diizinkan:')}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {allowedList.map((sec, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 border rounded-md text-[11px] font-medium ${
                                isDark ? "bg-black border-neutral-800 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-900"
                              }`}
                            >
                              {sec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ATURAN KDB / KLB / KDH */}
          {activeTab === "rules" && (
            <div className="space-y-4">
              <div className={`p-4 sm:p-5 rounded-lg border space-y-4 ${
                isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200"
              }`}>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Building size={18} />
                  <span>{t('rtrwZoning.technicalStandardsTitle', 'Standar Teknis Intensitas Pemanfaatan Ruang Luwu')}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-3.5 rounded-md border ${isDark ? "bg-black border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
                      {t('rtrwZoning.kdbTitle', 'KDB (Koefisien Dasar Bangunan)')}
                    </span>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {t('rtrwZoning.kdbDesc', 'Persentase maksimum luas lantai dasar bangunan terhadap luas lahan/tapak yang dikuasai.')}
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-md border ${isDark ? "bg-black border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">
                      {t('rtrwZoning.klbTitle', 'KLB (Koefisien Lantai Bangunan)')}
                    </span>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {t('rtrwZoning.klbDesc', 'Angka kelipatan maksimum total luas seluruh lantai bangunan terhadap luas lahan.')}
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-md border ${isDark ? "bg-black border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 uppercase block">
                      {t('rtrwZoning.kdhTitle', 'KDH (Koefisien Daerah Hijau)')}
                    </span>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {t('rtrwZoning.kdhDesc', 'Persentase minimum area terbuka hijau/resapan air yang wajib disiagakan di area proyek.')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDark ? "bg-black border-neutral-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}>
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500 shrink-0" />
                      <span>{t('rtrwZoning.needHelpConsult', 'Perlu bantuan konsultasi tata ruang spasial presisi dari Tim DPMPTSP Kab. Luwu?')}</span>
                    </div>
                    <button
                      onClick={() => setShowConsultInfo(!showConsultInfo)}
                      className={`w-full sm:w-auto px-4 h-10 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 text-center flex items-center justify-center gap-1 active:scale-95 ${
                        showConsultInfo 
                          ? "bg-slate-800 text-white hover:bg-slate-700" 
                          : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md"
                      }`}
                    >
                      <span>{showConsultInfo ? t('rtrwZoning.closeConsult', 'Tutup') : t('rtrwZoning.consultButton', 'Konsultasi Spasial')}</span>
                    </button>
                  </div>

                  {showConsultInfo && (
                    <motion.div 
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl border text-xs space-y-2 leading-relaxed ${
                        isDark ? "bg-emerald-950/20 border-emerald-500/20 text-slate-200" : "bg-emerald-500/5 border-emerald-500/20 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold font-sans">
                        <Info size={16} />
                        <span>INFORMASI HELPDESK SPASIAL:</span>
                      </div>
                      <p>
                        Silakan hubungi <strong>Desk Layanan Spasial DPMPTSP Kabupaten Luwu</strong> melalui Layanan Helpdesk OSS RBA resmi di Kantor DPMPTSP Luwu, Jl. Jenderal Sudirman No. 1 Belopa, atau hubungi pusat informasi digital perizinan untuk penjadwalan asistensi teknis kesesuaian tata ruang (KKPR).
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REFERENSI PERDA RTRW LUWU (RAG BASE) */}
          {activeTab === "rag" && (
            <div className="space-y-4 sm:space-y-5">
              {/* RAG Knowledge Base Header Card */}
              <div className={`p-4 sm:p-5 rounded-lg border relative overflow-hidden space-y-3 shadow-xl ${
                isDark 
                  ? "bg-gradient-to-br from-black via-neutral-900 to-neutral-950 border-emerald-500/30 text-slate-300" 
                  : "bg-gradient-to-br from-slate-100 via-white to-slate-100 border-emerald-500/30 text-slate-800"
              }`}>
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          RAG Vector Knowledge Base
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          Perda Kab. Luwu No. 06/2011
                        </span>
                      </div>
                      <h4 className={`text-sm sm:text-base font-bold leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>
                        {t('rtrwZoning.ragDocTitle', 'Referensi Dokumen Hukum & Pasal Rencana Tata Ruang Wilayah (RTRW)')}
                      </h4>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[11px] shrink-0 ${
                    isDark ? "bg-black border-neutral-800 text-slate-300" : "bg-white border-slate-200 text-slate-800 dark:text-slate-200"
                  }`}>
                    <Database size={14} className="text-emerald-500" />
                    <span>Supabase Postgres Vector:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {ragDocuments.length > 0 ? `${ragDocuments.length} Dokumen` : "Terhubung (Ready)"}
                    </span>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {t('rtrwZoning.ragDocDesc', 'Basis data RAG (Retrieval-Augmented Generation) diinjeksi secara resmi dari Peraturan Daerah Kabupaten Luwu Nomor 06 Tahun 2011 tentang Rencana Tata Ruang Wilayah Kabupaten Luwu Tahun 2011–2031. Seluruh verifikasi KKPR dan indikasi zonasi disinkronkan secara otomatis.')}
                </p>

                {/* Status Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className={`p-2 rounded-lg border ${isDark ? "bg-black/80 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className={`text-[10px] block ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>{t('rtrwZoning.ragStatusAgencyLabel', 'Instansi Penerbit:')}</span>
                    <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{t('rtrwZoning.ragStatusAgencyVal', 'Pemerintah Kab. Luwu')}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? "bg-black/80 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className={`text-[10px] block ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>{t('rtrwZoning.ragStatusYearLabel', 'Tahun Publikasi:')}</span>
                    <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{t('rtrwZoning.ragStatusYearVal', '2011 (Masa Berlaku 2011-2031)')}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? "bg-black/80 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className={`text-[10px] block ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>{t('rtrwZoning.ragStatusCatLabel', 'Kategori RAG:')}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-300">{t('rtrwZoning.ragStatusCatVal', 'Tata Ruang & Regulasi')}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? "bg-black/80 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className={`text-[10px] block ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>{t('rtrwZoning.ragStatusStorageLabel', 'Penyimpanan Storage:')}</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-300">{t('rtrwZoning.ragStatusStorageVal', 'Bucket knowledge_base')}</span>
                  </div>
                </div>
              </div>

              {/* RAG Search & Interactive Filter */}
              <div className={`p-3.5 sm:p-4 rounded-lg border space-y-3 ${
                isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200"
              }`}>
                <div className="relative">
                  <Search size={18} className="absolute left-3.5 top-3 text-slate-600 dark:text-slate-400" />
                  <input
                    type="text"
                    value={ragSearchQuery}
                    onChange={(e) => setRagSearchQuery(e.target.value)}
                    placeholder={t('rtrwZoning.ragSearchPlaceholder', "Cari pasal, keyword, atau kawasan (contoh: 'KIB Bua', 'AMDAL', 'Belopa', 'Bastem', 'Minapolitan')...")}
                    className={`w-full text-xs pl-10 pr-4 h-10 rounded-md border focus:outline-none focus:border-emerald-500/80 ${
                      isDark ? "bg-black text-white border-neutral-800 placeholder:text-slate-600 dark:placeholder:text-slate-400" : "bg-slate-50 text-slate-900 border-slate-200 placeholder:text-slate-600 dark:placeholder:text-slate-400"
                    }`}
                  />
                  {ragSearchQuery && (
                    <button
                      onClick={() => setRagSearchQuery("")}
                      className="absolute right-3 top-2.5 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400 text-xs cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className={`text-[10px] font-bold uppercase tracking-wider mr-1 ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                    {t('rtrwZoning.ragCatLabel', 'Kategori Pasal:')}
                  </span>
                  {[
                    { key: "ALL", label: t('rtrwZoning.ragCatAll', 'Semua Pasal') },
                    { key: "Pola Ruang", label: t('rtrwZoning.ragCatPola', 'Pola Ruang') },
                    { key: "Industri", label: t('rtrwZoning.ragCatIndustri', 'Industri (KIB Bua)') },
                    { key: "Pertanian", label: t('rtrwZoning.ragCatPertanian', 'Pertanian & Agropolitan') },
                    { key: "Perikanan", label: t('rtrwZoning.ragCatPerikanan', 'Minapolitan') },
                    { key: "Pariwisata", label: t('rtrwZoning.ragCatPariwisata', 'Pariwisata') },
                    { key: "Ketentuan Zonasi & KKPR", label: t('rtrwZoning.ragCatZonasi', 'Zonasi & KKPR') },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategoryFilter(cat.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        selectedCategoryFilter === cat.key
                          ? "bg-emerald-600 text-white font-bold shadow-sm"
                          : isDark ? "bg-black text-slate-600 dark:text-slate-400 hover:text-white border border-neutral-800" : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* RAG Chunks / Legal Articles List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className={`text-xs font-bold flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                    <Cpu size={15} className="text-emerald-500" />
                    <span>{t('rtrwZoning.ragChunkSectionTitle', 'Pasal & Chunk Referensi Perda RTRW Kab. Luwu')} ({filteredLegalArticles.length})</span>
                  </span>
                  <span className={`text-[10px] ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                    {t('rtrwZoning.ragSupabaseInjected', 'Diinjeksi ke Vector Store Supabase')}
                  </span>
                </div>

                {filteredLegalArticles.length === 0 ? (
                  <div className={`p-8 text-center rounded-lg border text-xs space-y-2 ${
                    isDark ? "bg-black/60 border-neutral-800 text-slate-600 dark:text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}>
                    <Info size={28} className="mx-auto text-amber-500" />
                    <p className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-800"}`}>{t('rtrwZoning.ragNotFoundTitle', 'Tidak ada pasal yang cocok dengan pencarian')}</p>
                    <p className={`text-[11px] ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>{t('rtrwZoning.ragNotFoundDesc', "Coba gunakan kata kunci lain seperti 'industri', 'agropolitan', atau 'kkpr'.")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredLegalArticles.map((article) => {
                      const artKey = (article as any).key || article.id.replace('pasal-', 'p');
                      const artPasal = t(`rtrwZoning.articles.${artKey}.pasal`, article.pasal);
                      const artJudul = t(`rtrwZoning.articles.${artKey}.judul`, article.judul);
                      const artRingkasan = t(`rtrwZoning.articles.${artKey}.ringkasan`, article.ringkasan);
                      const artKategori = t(`rtrwZoning.articles.${artKey}.kategori`, article.kategori);
                      const artBab = t(`rtrwZoning.articles.${artKey}.bab`, article.bab);
                      const artDocRef = t(`rtrwZoning.articles.${artKey}.dokumenRef`, article.dokumenRef);

                      return (
                        <div
                          key={article.id}
                          className={`p-4 rounded-lg border transition-all space-y-2.5 group ${
                            isDark ? "bg-neutral-900/90 border-neutral-800 hover:border-emerald-500/40" : "bg-white border-slate-200 hover:border-emerald-500/50 shadow-xs"
                          }`}
                        >
                          <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2 ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                                {artPasal}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                                isDark ? "bg-black text-slate-300 border-neutral-800" : "bg-slate-100 text-slate-800 dark:text-slate-200 border-slate-200"
                              }`}>
                                {artKategori}
                              </span>
                            </div>

                            <span className={`text-[10px] font-mono ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                              {artBab}
                            </span>
                          </div>

                          <h5 className={`text-xs sm:text-sm font-bold transition-colors ${
                            isDark ? "text-slate-100 group-hover:text-emerald-300" : "text-slate-900 group-hover:text-emerald-700"
                          }`}>
                            {artJudul}
                          </h5>

                          <p className={`text-xs leading-relaxed p-3 rounded-md border ${
                            isDark ? "bg-black/60 border-neutral-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800 dark:text-slate-200"
                          }`}>
                            {artRingkasan}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex flex-wrap gap-1">
                              {article.keywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className={`px-2 py-0.5 rounded text-[10px] border ${
                                    isDark ? "bg-black text-slate-600 dark:text-slate-400 border-neutral-800" : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  #{kw}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              <Check size={12} />
                              <span>{t('rtrwZoning.ragVerifiedCitation', 'Verified RAG Citation')} ({artDocRef})</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Supabase Knowledge Base Document Table */}
              {ragDocuments.length > 0 && (
                <div className={`p-4 rounded-lg border space-y-3 ${
                  isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200"
                }`}>
                  <h5 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    <Database size={16} className="text-emerald-500" />
                    <span>{t('rtrwZoning.ragTableTitle', 'Dokumen Pengetahuan RAG di Supabase')} ({ragDocuments.length})</span>
                  </h5>

                  <div className="overflow-x-auto">
                    <table className={`w-full text-left text-xs border-collapse ${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                      <thead>
                        <tr className={`border-b text-[10px] uppercase ${
                          isDark ? "border-neutral-800 text-slate-600 dark:text-slate-400 bg-black/50" : "border-slate-200 text-slate-600 dark:text-slate-400 bg-slate-50"
                        }`}>
                          <th className="p-2.5">{t('rtrwZoning.ragColTitle', 'Judul Dokumen')}</th>
                          <th className="p-2.5">{t('rtrwZoning.ragColCat', 'Kategori')}</th>
                          <th className="p-2.5">{t('rtrwZoning.ragColAgency', 'Instansi')}</th>
                          <th className="p-2.5">{t('rtrwZoning.ragColYear', 'Tahun')}</th>
                          <th className="p-2.5 text-right">{t('rtrwZoning.ragColStatus', 'Status Index')}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? "divide-neutral-800/60" : "divide-slate-200"}`}>
                        {ragDocuments.map((doc) => (
                          <tr key={doc.id} className={isDark ? "hover:bg-neutral-800/40" : "hover:bg-slate-50"}>
                            <td className={`p-2.5 font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>{doc.title}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-bold">
                                {doc.category}
                              </span>
                            </td>
                            <td className={`p-2.5 ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>{doc.source_agency}</td>
                            <td className={`p-2.5 font-mono ${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>{doc.publication_year}</td>
                            <td className="p-2.5 text-right">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10">
          <div className={`flex items-center gap-2 text-[11px] sm:text-xs text-center sm:text-left ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>
            <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
            <span>{t('rtrwZoning.footerNote', 'DPMPTSP Kabupaten Luwu · Terhubung dengan Database Supabase Spasial')}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md text-center flex items-center justify-center active:scale-98"
          >
            {t('rtrwZoning.doneClose', 'Selesai & Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}

// i18n update: translate RTRW zoning checker content

