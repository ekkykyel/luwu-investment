import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Compass,
  Layers,
  Building,
  TrendingUp,
  Coins,
  Leaf,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  MapPin,
  Cpu,
  FileText,
  Percent,
  Sparkles,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface InvestmentReadinessPillarsProps {
  isDark?: boolean;
  onOpenRtrwModal?: () => void;
  onOpenIncentiveModal?: () => void;
  onOpenSpatialMap?: () => void;
  onScrollToPotensi?: () => void;
  onScrollToRoadmap?: () => void;
  onScrollToCalculator?: () => void;
  onScrollToUmkm?: () => void;
}

export type PillarId =
  | "spatial"
  | "infrastructure"
  | "industry"
  | "financing"
  | "environment"
  | "local_economy";

interface PillarItem {
  id: PillarId;
  number: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  tagline: string;
  blueprintStandard: string;
  luwuReadinessStatus: string;
  keyMetrics: { label: string; value: string; desc: string }[];
  strategicPoints: { title: string; desc: string; standard: string }[];
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function InvestmentReadinessPillars({
  isDark = true,
  onOpenRtrwModal,
  onOpenIncentiveModal,
  onOpenSpatialMap,
  onScrollToPotensi,
  onScrollToRoadmap,
  onScrollToCalculator,
  onScrollToUmkm,
}: InvestmentReadinessPillarsProps) {
  const { t } = useTranslation();
  const [activePillar, setActivePillar] = useState<PillarId>("spatial");

  const pillars: PillarItem[] = [
    {
      id: "spatial",
      number: "01",
      badge: "Tata Ruang Digital",
      title: t("landingInvest.pillars.spatialReady", "Spatial Ready"),
      subtitle: "Integrasi RDTR Digital, OSS & Kesesuaian Ruang (KKPR)",
      icon: Layers,
      accentColor: "text-emerald-500 dark:text-emerald-400",
      accentBg: "bg-emerald-500/10 border-emerald-500/30",
      tagline: t("landingInvest.spatial.tagline", "Kepastian plot koordinat investasi 0% sengketa dengan sinkronisasi PostGIS & GISTARU."),
      blueprintStandard: t("landingInvest.spatial.blueprintStandard", "Acuan Blueprint Kementerian: Integrasi RDTR Digital OSS-RBA, Percepatan Konfirmasi KKPR & Kepastian Zonasi"),
      luwuReadinessStatus: t("landingInvest.spatial.readinessStatus", "Status Kesiapan Luwu: 100% Valid Spasial (Perda RTRW No. 1/2024 & Modul Digital KKPR)"),
      keyMetrics: [
        { label: t("landingInvest.spatial.metricSpatialValidation", "Validasi Spasial"), value: "Real-Time", desc: t("landingInvest.spatial.metricSpatialValidationDesc", "Sinkronisasi otomatis layer RTRW 22 kecamatan") },
        { label: t("landingInvest.spatial.metricKkprSla", "SLA Konfirmasi KKPR"), value: "3 - 5 Hari", desc: t("landingInvest.spatial.metricKkprSlaDesc", "Pemeriksaan teknis PUPR terintegrasi DPMPTSP") },
        { label: t("landingInvest.spatial.metricMappedArea", "Luas Lahan Terpetakan"), value: "3.000+ Ha", desc: t("landingInvest.spatial.metricMappedAreaDesc", "Polygon terverifikasi Clean & Clear") },
      ],
      strategicPoints: [
        {
          title: "Peta RDTR Digital Terintegrasi",
          desc: "Plotting koordinat investasi langsung terhubung layer zonasi KIB (Kawasan Industri Bua), agropolitan, dan pariwisata.",
          standard: "OSS-RBA Digital GISTARU",
        },
        {
          title: "Sertifikasi KKPR Bebas Sengketa",
          desc: "Alur perizinan tata ruang terverifikasi langsung via sistem GIS tanpa tumpang tindih kawasan hutan lindung.",
          standard: "PP No. 21/2021",
        },
        {
          title: "Katalog Spasial IPRO Presisi",
          desc: "Setiap paket investasi dilengkapi polygon WGS84 resmi, status kepemilikan SHM/HPL, dan buffer infrastruktur.",
          standard: "Standar BKPM RI",
        },
      ],
      primaryActionLabel: t("landingInvest.spatial.checkConformityKkpr", "Cek Kesesuaian Lahan (KKPR)"),
      secondaryActionLabel: t("landingInvest.spatial.openGisSpatialMap", "Buka Peta Spasial GIS"),
      onPrimaryClick: onOpenRtrwModal,
      onSecondaryClick: onOpenSpatialMap,
    },
    {
      id: "infrastructure",
      number: "02",
      badge: "Konektivitas & Utilitas",
      title: t("landingInvest.pillars.infrastructureReady", "Infrastructure Ready"),
      subtitle: "Konektivitas Multimoda, Energi Hijau & Kawasan Industri",
      icon: Building,
      accentColor: "text-amber-500 dark:text-amber-400",
      accentBg: "bg-amber-500/10 border-amber-500/30",
      tagline: "Akses logistik darat, laut, dan udara terhubung langsung koridor Trans-Sulawesi.",
      blueprintStandard: "Akses Jalan Arteri, Dermaga Pelabuhan, Runway Bandara, Utilitas Listrik & Air Bersih",
      luwuReadinessStatus: "Terkoneksi Penuh (Bandara Bua, Pelabuhan Ulo-Ulo, PLTA Bakaru Grid)",
      keyMetrics: [
        { label: "Runway Bandara Bua", value: "1.660 m", desc: "Siap melayani penerbangan kargo & eksekutif ATR-72" },
        { label: "Pelabuhan Ulo-Ulo", value: "5.000 DWT", desc: "Dermaga curah dan peti kemas Teluk Bone" },
        { label: "Kapasitas Listrik Grid", value: "Surplus 150MW", desc: "Interkoneksi transmisi PLN Sulselrabar" },
      ],
      strategicPoints: [
        {
          title: "Kawasan Industri Terpadu Bua (KIB)",
          desc: "Zonasi industri seluas 1.000 Ha tepat di samping Bandara Bua dengan akses pelabuhan langsung 15 menit.",
          standard: "Masterplan Kawasan Strategis",
        },
        {
          title: "Koridor Logistik Jalan Nasional",
          desc: "Jaringan jalan arteri Trans-Sulawesi menghubungkan Makassar - Palopo - Morowali tanpa hambatan tonase berat.",
          standard: "Standar Muatan Sumbu Terberat",
        },
        {
          title: "Jaminan Utilitas Serat Optik & Air Baku",
          desc: "Ketersediaan debit air DAS Poringan & Sungai Suso dengan backbone internet serat optik 1 Gbps.",
          standard: "Standar Infrastruktur Kemenperin",
        },
      ],
      primaryActionLabel: "Lihat Fasilitas Infrastruktur",
      secondaryActionLabel: "Katalog Proyek Siap Tawar",
      onPrimaryClick: onScrollToPotensi,
      onSecondaryClick: onScrollToPotensi,
    },
    {
      id: "industry",
      number: "03",
      badge: "Hilirisasi Komoditas",
      title: t("landingInvest.pillars.industryReady", "Industry Ready"),
      subtitle: "Hilirisasi Kakao, Kopi, Nikel & Ekosistem Perintis",
      icon: TrendingUp,
      accentColor: "text-emerald-600 dark:text-emerald-300",
      accentBg: "bg-emerald-600/10 border-emerald-600/30",
      tagline: "Transformasi komoditas mentah menjadi produk hilir bernilai tambah tinggi di Kabupaten Luwu.",
      blueprintStandard: "Kawasan Hilirisasi Terpadu, Anchor Investor, Klaster Komoditas Unggulan Daerah",
      luwuReadinessStatus: "Sentra Hilirisasi Noling & Koridor Smelter Smelting Terpadu",
      keyMetrics: [
        { label: "Produksi Kakao", value: "24.500 Ton/Th", desc: "Bahan baku biji fermentasi kualitas ekspor" },
        { label: "Produksi Kopi Latimojong", value: "4.200 Ton/Th", desc: "Spesialti Arabika & Robusta pegunungan" },
        { label: "Potensi Nilai Tambah", value: "+340%", desc: "Multiplier ekonomi hilirisasi pengolahan lokal" },
      ],
      strategicPoints: [
        {
          title: "Hilirisasi Sentra Kakao Noling",
          desc: "Fasilitas pengolahan pasta, cocoa butter, dan bubuk cokelat premium untuk rantai pasok industri makanan global.",
          standard: "Program Prioritas Hilirisasi Nasional",
        },
        {
          title: "Klaster Industri Pengolahan Rumput Laut & Ikan",
          desc: "Garis pantai 122 km menghasilkan Gracilaria & Bandeng unggulan siap olah cold-storage modern.",
          standard: "Blue Economy Framework",
        },
        {
          title: "Ketersediaan Anchor Investor & Rantai Pasok",
          desc: "Keberadaan industri manufaktur pionir yang menjamin kepastian serapan bahan baku dan pasar ekspor.",
          standard: "Industrial Ecosystem Ready",
        },
      ],
      primaryActionLabel: "Eksplorasi Proyek Hilirisasi",
      secondaryActionLabel: "Konsultasi Sektor Industri",
      onPrimaryClick: onScrollToPotensi,
      onSecondaryClick: onScrollToRoadmap,
    },
    {
      id: "financing",
      number: "04",
      badge: "Skema Pembiayaan & Insentif",
      title: t("landingInvest.pillars.financingReady", "Financing Ready"),
      subtitle: "Peluang KPBU, Blended Finance & Insentif Fiskal Perda",
      icon: Coins,
      accentColor: "text-yellow-600 dark:text-yellow-400",
      accentBg: "bg-yellow-500/10 border-yellow-500/30",
      tagline: "Kombinasi insentif fiskal daerah dan kemudahan kemitraan pembiayaan publik-swasta.",
      blueprintStandard: "Skema KPBU (Kerjasama Pemerintah & Badan Usaha), Blended Finance, Fasilitas Tax Holiday",
      luwuReadinessStatus: "Perda Insentif Penanaman Modal & Fasilitasi Fiskal PBG/PBB-P2",
      keyMetrics: [
        { label: "Insentif PBG Daerah", value: "Hingga 50%", desc: "Pembebasan retribusi izin gedung industri baru" },
        { label: "Pengurangan PBB-P2", value: "s/d 5 Tahun", desc: "Masa keringanan pajak selama fase konstruksi" },
        { label: "Skema KPBU Terbuka", value: "Infrastruktur", desc: "Proyek air minum, dermaga & logistik pergudangan" },
      ],
      strategicPoints: [
        {
          title: "Kalkulator Insentif Fiskal & Simulasi ROI",
          desc: "Perhitungan interaktif penghematan biaya modal (Capex/Opex) sesuai Perda Luwu dan PP No. 24/2019.",
          standard: "Smart Fiscal Estimator",
        },
        {
          title: "Peluang KPBU Infrastruktur Strategis",
          desc: "Dukungan penyiapan proyek (PDF) dan penjaminan kelayakan pembiayaan untuk investor institusional.",
          standard: "Perpres No. 38/2015 KPBU",
        },
        {
          title: "Fasilitasi Blended Finance & Perbankan Daerah",
          desc: "Kemitraan sindikasi Bank Sulselbar dan lembaga pembiayaan nasional untuk proyek strategis daerah.",
          standard: "OJK Sustainable Finance",
        },
      ],
      primaryActionLabel: "Hitung Insentif Fiskal & ROI",
      secondaryActionLabel: "Simulasi Finansial",
      onPrimaryClick: onOpenIncentiveModal,
      onSecondaryClick: onScrollToCalculator,
    },
    {
      id: "environment",
      number: "05",
      badge: "Standar ESG & Amdal",
      title: t("landingInvest.pillars.environmentReady", "Environment Ready"),
      subtitle: "Percepatan Izin Lingkungan AMDAL, UKL-UPL & Keberlanjutan",
      icon: Leaf,
      accentColor: "text-emerald-500 dark:text-emerald-400",
      accentBg: "bg-emerald-500/10 border-emerald-500/30",
      tagline: "Kajian dampak lingkungan cepat dan transparan melalui integrasi digital AMDALNET.",
      blueprintStandard: "Percepatan Persetujuan Lingkungan, Standar Emisi Terkendali, Kepatuhan Ekologi Rendah Karbon",
      luwuReadinessStatus: "Asistensi Digital DLH Luwu (AMDALNET Terpadu SLA < 15 Hari Kerja)",
      keyMetrics: [
        { label: "SLA SPPL Otomatis", value: "Instan (< 1 Jam)", desc: "Penerbitan via OSS-RBA untuk risiko rendah/menengah" },
        { label: "SLA Rekomendasi UKL-UPL", value: "10 - 14 Hari", desc: "Verifikasi dokumen lingkungan oleh tim teknis DLH" },
        { label: "Komitmen Hijau Luwu", value: "Standar ESG", desc: "Perlindungan tutupan hutan lindung & hulu DAS" },
      ],
      strategicPoints: [
        {
          title: "Percepatan Izin Lingkungan (Fast-Track AMDALNET)",
          desc: "Dinas Lingkungan Hidup Kab. Luwu menyediakan desk asistensi penyusunan formulir UKL-UPL satu pintu.",
          standard: "PP No. 22/2021",
        },
        {
          title: "Buffer Proteksi Bencana & Tata Air Spasial",
          desc: "Pengecekan otomatis risiko banjir dan longsor memastikan lokasi pabrik bebas dari ancaman hidrologis.",
          standard: "Kajian Spasial Kebencanaan BPBD",
        },
        {
          title: "Standar Investasi Hijau & Sirkular",
          desc: "Dukungan penuh untuk pemanfaatan limbah biomassa kelapa sawit dan kulit kakao sebagai energi terbarukan.",
          standard: "Green Investment Taxonomy",
        },
      ],
      primaryActionLabel: "Pelajari Roadmap Perizinan DLH",
      secondaryActionLabel: "Persetujuan Lingkungan",
      onPrimaryClick: onScrollToRoadmap,
      onSecondaryClick: onScrollToRoadmap,
    },
    {
      id: "local_economy",
      number: "06",
      badge: "Kemitraan UMKM & Naker",
      title: t("landingInvest.pillars.localEconomyReady", "Local Economy Ready"),
      subtitle: "Kemitraan Wajib UMKM Daerah & Kesiapan SDM Bersertifikat",
      icon: Users,
      accentColor: "text-sky-500 dark:text-sky-400",
      accentBg: "bg-sky-500/10 border-sky-500/30",
      tagline: "Mempertemukan investor skala besar dengan rantai pasok pengusaha dan tenaga kerja lokal Luwu.",
      blueprintStandard: "Business Matching Investor - UMKM, Sertifikasi Keterampilan Lokal, Kemitraan Rantai Pasok",
      luwuReadinessStatus: "Direktori UMKM Terverifikasi MPP & Komitmen Penyerapan Naker Lokal 70%+",
      keyMetrics: [
        { label: "UMKM Binaan Terdaftar", value: "1.200+ Unit", desc: "Sektor agribisnis, katering, logistik & suplier lokal" },
        { label: "Sertifikasi BLK Luwu", value: "Siap Kerja", desc: "Pelatihan las industri, alat berat, dan pengolahan hasil tani" },
        { label: "Insentif Kemitraan", value: "Prioritas", desc: "Kemudahan perizinan bagi investor bermitra dengan UMKM lokal" },
      ],
      strategicPoints: [
        {
          title: "Fasilitasi Business Matching Terjadwal",
          desc: "DPMPTSP Luwu secara aktif mengorkestrasi forum kemitraan antara pengusaha besar dan UMKM daerah.",
          standard: "Perpres No. 10/2021 tentang Bidang Usaha Penanaman Modal",
        },
        {
          title: "Direktori Pemasok Daerah Terverifikasi",
          desc: "Akses langsung profil pengusaha lokal penyedia bahan baku, transportasi logistik, dan jasa konstruksi.",
          standard: "Database UMKM MPP Simpurusiang",
        },
        {
          title: "Perlindungan & Peningkatan Nilai Tambah Daerah",
          desc: "Investasi yang masuk dipastikan memicu pertumbuhan ekonomi inklusif bagi masyarakat Kabupaten Luwu.",
          standard: "Inklusivitas Ekonomi Kementerian Investasi",
        },
      ],
      primaryActionLabel: "Lihat Direktori Kemitraan UMKM",
      secondaryActionLabel: "Data Tenaga Kerja Lokal",
      onPrimaryClick: onScrollToUmkm,
      onSecondaryClick: onScrollToPotensi,
    },
  ];

  const currentPillar = pillars.find((p) => p.id === activePillar) || pillars[0];
  const CurrentIcon = currentPillar.icon;

  return (
    <section
      id="readiness-pillars-section"
      className={`scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-16 md:py-20 border-t relative overflow-hidden transition-colors duration-500 ${
        isDark ? "bg-[#061522] border-white/10" : "bg-slate-50 border-slate-200"
      }`}
    >
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[300px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3.5 border backdrop-blur-md shadow-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Blueprint Kementerian Investasi / BKPM RI</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 text-balance">
            {t("landingInvest.pillars.mainTitle", "6 Pilar Kesiapan Investasi Daerah (Investment Readiness)")}
          </h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 rounded-full mb-4 mx-auto" />
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
            {t("landingInvest.pillars.subtitle", "Transformasi Kabupaten Luwu menjadi platform investasi terintegrasi kelas satu, menjamin kepastian hukum, kelayakan teknis, dan keberlanjutan ekosistem usaha.")}
          </p>
        </div>

        {/* 6 Pillars Interactive Navigation Tabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-8">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const isActive = pillar.id === activePillar;

            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActivePillar(pillar.id)}
                className={`group relative p-3 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                  isActive
                    ? isDark
                      ? "bg-surface/95 border-emerald-500/70 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40"
                      : "bg-white border-emerald-500 shadow-md shadow-emerald-100 ring-1 ring-emerald-400"
                    : isDark
                    ? "bg-base/60 border-slate-800/80 hover:bg-surface/80 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                    : "bg-white/80 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs"
                }`}
              >
                {/* Active Indicator Top Line */}
                {isActive && (
                  <motion.div
                    layoutId="activePillarTabLine"
                    className="absolute top-0 inset-x-3 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-200/60 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {pillar.number}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                </div>

                <div>
                  <h3
                    className={`text-xs sm:text-sm font-bold tracking-tight mb-0.5 transition-colors ${
                      isActive
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-[10px] line-clamp-1 text-slate-500 dark:text-slate-400 font-medium">
                    {pillar.badge}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Showcase Panel for the Active Pillar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPillar.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`p-5 sm:p-7 md:p-9 rounded-3xl border relative overflow-hidden backdrop-blur-2xl shadow-xl ${
              isDark
                ? "bg-surface/90 border-slate-800/90 shadow-black/60"
                : "bg-white border-slate-200/90 shadow-slate-200/60"
            }`}
          >
            {/* Top Volumetric Glow */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Pillar Identity & Strategic Highlights (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {currentPillar.id === "spatial"
                        ? t("landingInvest.spatial.pilar01Badge", `PILAR ${currentPillar.number} • ${currentPillar.badge}`)
                        : `PILAR ${currentPillar.number} • ${currentPillar.badge}`}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Blueprint Kementerian Investasi RI
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5 flex items-center gap-3">
                    <span>{currentPillar.title}</span>
                  </h3>
                  <p className="text-sm sm:text-base font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                    {currentPillar.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {currentPillar.tagline}
                  </p>
                </div>

                {/* Status Kesiapan Luwu vs Standar Kementerian */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDark ? "bg-base/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">
                        Status Kesiapan Luwu:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {currentPillar.luwuReadinessStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Award size={16} className="text-sky-500 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">
                        Acuan Blueprint Kementerian:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {currentPillar.blueprintStandard}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Strategic Key Deliverables Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={13} className="text-emerald-500" />
                    <span>{t("landingInvest.spatial.solutionsTitle", "FITUR & SOLUSI KESIAPAN TERINTEGRASI:")}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {currentPillar.strategicPoints.map((pt, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                          isDark
                            ? "bg-surface/60 border-slate-800/80 hover:border-slate-700"
                            : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                        }`}
                      >
                        <div>
                          <span className="inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-2">
                            {pt.standard}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                            {pt.title}
                          </h5>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            {pt.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons for the active pillar */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {currentPillar.primaryActionLabel && (
                    <button
                      type="button"
                      onClick={currentPillar.onPrimaryClick}
                      className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <span>{currentPillar.primaryActionLabel}</span>
                      <ArrowRight size={15} />
                    </button>
                  )}
                  {currentPillar.secondaryActionLabel && (
                    <button
                      type="button"
                      onClick={currentPillar.onSecondaryClick}
                      className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        isDark
                          ? "bg-slate-800/70 hover:bg-slate-800 text-slate-200 border-slate-700"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                      }`}
                    >
                      <span>{currentPillar.secondaryActionLabel}</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Key Quantitative Readiness Indicators (5 cols) */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CurrentIcon size={14} className={currentPillar.accentColor} />
                    <span>{t("landingInvest.spatial.quantitativeIndicators", "INDIKATOR KUANTITATIF KESIAPAN")}</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    TERVERIFIKASI
                  </span>
                </div>

                <div className="space-y-3">
                  {currentPillar.keyMetrics.map((met, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDark
                          ? "bg-base/70 border-slate-800 hover:border-slate-700"
                          : "bg-slate-50/90 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {met.label}
                        </span>
                        <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white">
                          {met.value}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {met.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Regional Integration Card */}
                <div className={`p-4 rounded-2xl border ${
                  isDark
                    ? "bg-gradient-to-br from-emerald-950/30 to-teal-950/20 border-emerald-500/30"
                    : "bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border-emerald-200"
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {t("landingInvest.spatial.businessCertaintyTitle", "Jaminan Kepastian Berusaha")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t("landingInvest.spatial.businessCertaintyDesc", "Sistem InvestLuwu menghubungkan seluruh perizinan dan tata ruang langsung dengan DPMPTSP Kabupaten Luwu, Dinas PUPR, DLH, dan Kementerian Investasi RI / BKPM melalui Online Single Submission (OSS).")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
