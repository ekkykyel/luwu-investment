import React, { useState } from "react";
import {
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
  Sparkles,
  Award,
  Activity,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

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
  shortLabel: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  score: string;
  readinessRating: string;
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
      badge: t("readiness.p1Badge", "Tata Ruang Digital"),
      shortLabel: "Tata Ruang",
      title: t("readiness.p1Title", "Spatial Ready"),
      subtitle: t("readiness.p1Subtitle", "Integrasi RDTR Digital, OSS & Kesesuaian Ruang (KKPR)"),
      icon: Layers,
      accentColor: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-500/10 border-emerald-500/30",
      score: t("readiness.p1Score", "98%"),
      readinessRating: t("readiness.p1Rating", "Tingkat Kesiapan A1 • Clean & Clear"),
      tagline: t("readiness.p1Tagline", "Kepastian plot koordinat investasi 0% sengketa dengan sinkronisasi PostGIS & GISTARU."),
      blueprintStandard: t("readiness.p1Standard", "Integrasi RDTR Digital OSS-RBA, Percepatan Konfirmasi KKPR & Kepastian Zonasi"),
      luwuReadinessStatus: t("readiness.p1Status", "100% Valid Spasial (Perda RTRW No. 1/2024 & Modul Digital KKPR)"),
      keyMetrics: [
        { label: t("readiness.p1m1Label", "Validasi Spasial"), value: t("readiness.p1m1Value", "Real-Time"), desc: t("readiness.p1m1Desc", "Sinkronisasi otomatis layer RTRW 22 kecamatan") },
        { label: t("readiness.p1m2Label", "SLA Konfirmasi KKPR"), value: t("readiness.p1m2Value", "3 - 5 Hari"), desc: t("readiness.p1m2Desc", "Pemeriksaan teknis PUPR terintegrasi DPMPTSP") },
        { label: t("readiness.p1m3Label", "Luas Lahan Terpetakan"), value: t("readiness.p1m3Value", "3.000+ Ha"), desc: t("readiness.p1m3Desc", "Polygon terverifikasi Clean & Clear") },
      ],
      strategicPoints: [
        {
          title: t("readiness.p1sp1Title", "Peta RDTR Digital Terintegrasi"),
          desc: t("readiness.p1sp1Desc", "Plotting koordinat investasi langsung terhubung layer zonasi KIB (Kawasan Industri Bua), agropolitan, dan pariwisata."),
          standard: t("readiness.p1sp1Std", "OSS-RBA Digital GISTARU"),
        },
        {
          title: t("readiness.p1sp2Title", "Sertifikasi KKPR Bebas Sengketa"),
          desc: t("readiness.p1sp2Desc", "Alur perizinan tata ruang terverifikasi langsung via sistem GIS tanpa tumpang tindih kawasan hutan lindung."),
          standard: t("readiness.p1sp2Std", "PP No. 21/2021"),
        },
        {
          title: t("readiness.p1sp3Title", "Katalog Spasial IPRO Presisi"),
          desc: t("readiness.p1sp3Desc", "Setiap paket investasi dilengkapi polygon WGS84 resmi, status kepemilikan SHM/HPL, dan buffer infrastruktur."),
          standard: t("readiness.p1sp3Std", "Standar BKPM RI"),
        },
      ],
      primaryActionLabel: t("readiness.p1Action1", "Cek Kesesuaian Lahan (RTRW)"),
      secondaryActionLabel: t("readiness.p1Action2", "Buka Peta Spasial GIS"),
      onPrimaryClick: onOpenRtrwModal,
      onSecondaryClick: onOpenSpatialMap,
    },
    {
      id: "infrastructure",
      number: "02",
      badge: t("readiness.p2Badge", "Konektivitas & Utilitas"),
      shortLabel: "Infrastruktur",
      title: t("readiness.p2Title", "Infrastructure Ready"),
      subtitle: t("readiness.p2Subtitle", "Konektivitas Multimoda, Energi Hijau & Kawasan Industri"),
      icon: Building,
      accentColor: "text-amber-600 dark:text-amber-400",
      accentBg: "bg-amber-500/10 border-amber-500/30",
      score: t("readiness.p2Score", "96%"),
      readinessRating: t("readiness.p2Rating", "Tingkat Kesiapan A1 • Koridor Terkoneksi"),
      tagline: t("readiness.p2Tagline", "Akses logistik darat, laut, dan udara terhubung langsung koridor Trans-Sulawesi."),
      blueprintStandard: t("readiness.p2Standard", "Akses Jalan Arteri, Dermaga Pelabuhan, Runway Bandara, Utilitas Listrik & Air Bersih"),
      luwuReadinessStatus: t("readiness.p2Status", "Terkoneksi Penuh (Bandara Bua, Pelabuhan Ulo-Ulo, PLTA Bakaru Grid)"),
      keyMetrics: [
        { label: t("readiness.p2m1Label", "Runway Bandara Bua"), value: t("readiness.p2m1Value", "1.660 m"), desc: t("readiness.p2m1Desc", "Siap melayani penerbangan kargo & eksekutif ATR-72") },
        { label: t("readiness.p2m2Label", "Pelabuhan Ulo-Ulo"), value: t("readiness.p2m2Value", "5.000 DWT"), desc: t("readiness.p2m2Desc", "Dermaga curah dan peti kemas Teluk Bone") },
        { label: t("readiness.p2m3Label", "Kapasitas Listrik Grid"), value: t("readiness.p2m3Value", "Surplus 150MW"), desc: t("readiness.p2m3Desc", "Interkoneksi transmisi PLN Sulselrabar") },
      ],
      strategicPoints: [
        {
          title: t("readiness.p2sp1Title", "Kawasan Industri Terpadu Bua (KIB)"),
          desc: t("readiness.p2sp1Desc", "Zonasi industri seluas 1.000 Ha tepat di samping Bandara Bua dengan akses pelabuhan langsung 15 menit."),
          standard: t("readiness.p2sp1Std", "Masterplan Kawasan Strategis"),
        },
        {
          title: t("readiness.p2sp2Title", "Koridor Logistik Jalan Nasional"),
          desc: t("readiness.p2sp2Desc", "Jaringan jalan arteri Trans-Sulawesi menghubungkan Makassar - Palopo - Morowali tanpa hambatan tonase berat."),
          standard: t("readiness.p2sp2Std", "Standar Muatan Sumbu Terberat"),
        },
        {
          title: t("readiness.p2sp3Title", "Jaminan Utilitas Serat Optik & Air Baku"),
          desc: t("readiness.p2sp3Desc", "Ketersediaan debit air DAS Poringan & Sungai Suso dengan backbone internet serat optik 1 Gbps."),
          standard: t("readiness.p2sp3Std", "Standar Infrastruktur Kemenperin"),
        },
      ],
      primaryActionLabel: t("readiness.p2Action1", "Lihat Fasilitas Infrastruktur"),
      secondaryActionLabel: t("readiness.p2Action2", "Katalog Proyek Siap Tawar"),
      onPrimaryClick: onScrollToPotensi,
      onSecondaryClick: onScrollToPotensi,
    },
    {
      id: "industry",
      number: "03",
      badge: t("readiness.p3Badge", "Hilirisasi Komoditas"),
      shortLabel: "Hilirisasi",
      title: t("readiness.p3Title", "Industry Ready"),
      subtitle: t("readiness.p3Subtitle", "Hilirisasi Kakao, Kopi, Nikel & Ekosistem Perintis"),
      icon: TrendingUp,
      accentColor: "text-teal-600 dark:text-teal-400",
      accentBg: "bg-teal-500/10 border-teal-500/30",
      score: t("readiness.p3Score", "94%"),
      readinessRating: t("readiness.p3Rating", "Tingkat Kesiapan A2 • Ekosistem Terpadu"),
      tagline: t("readiness.p3Tagline", "Transformasi komoditas mentah menjadi produk hilir bernilai tambah tinggi di Kabupaten Luwu."),
      blueprintStandard: t("readiness.p3Standard", "Kawasan Hilirisasi Terpadu, Anchor Investor, Klaster Komoditas Unggulan Daerah"),
      luwuReadinessStatus: t("readiness.p3Status", "Sentra Hilirisasi Noling & Koridor Smelter Terpadu"),
      keyMetrics: [
        { label: t("readiness.p3m1Label", "Produksi Kakao"), value: t("readiness.p3m1Value", "24.500 Ton/Th"), desc: t("readiness.p3m1Desc", "Bahan baku biji fermentasi kualitas ekspor") },
        { label: t("readiness.p3m2Label", "Produksi Kopi Latimojong"), value: t("readiness.p3m2Value", "4.200 Ton/Th"), desc: t("readiness.p3m2Desc", "Spesialti Arabika & Robusta pegunungan") },
        { label: t("readiness.p3m3Label", "Potensi Nilai Tambah"), value: t("readiness.p3m3Value", "+340%"), desc: t("readiness.p3m3Desc", "Multiplier ekonomi hilirisasi pengolahan lokal") },
      ],
      strategicPoints: [
        {
          title: t("readiness.p3sp1Title", "Hilirisasi Sentra Kakao Noling"),
          desc: t("readiness.p3sp1Desc", "Fasilitas pengolahan pasta, cocoa butter, dan bubuk cokelat premium untuk rantai pasok industri makanan global."),
          standard: t("readiness.p3sp1Std", "Program Prioritas Hilirisasi Nasional"),
        },
        {
          title: t("readiness.p3sp2Title", "Klaster Industri Pengolahan Rumput Laut & Ikan"),
          desc: t("readiness.p3sp2Desc", "Garis pantai 122 km menghasilkan Gracilaria & Bandeng unggulan siap olah cold-storage modern."),
          standard: t("readiness.p3sp2Std", "Blue Economy Framework"),
        },
        {
          title: t("readiness.p3sp3Title", "Ketersediaan Anchor Investor & Rantai Pasok"),
          desc: t("readiness.p3sp3Desc", "Keberadaan industri manufaktur pionir yang menjamin kepastian serapan bahan baku dan pasar ekspor."),
          standard: t("readiness.p3sp3Std", "Industrial Ecosystem Ready"),
        },
      ],
      primaryActionLabel: t("readiness.p3Action1", "Eksplorasi Proyek Hilirisasi"),
      secondaryActionLabel: t("readiness.p3Action2", "Konsultasi Sektor Industri"),
      onPrimaryClick: onScrollToPotensi,
      onSecondaryClick: onScrollToRoadmap,
    },
    {
      id: "financing",
      number: "04",
      badge: t("readiness.p4Badge", "Skema Pembiayaan & Insentif"),
      shortLabel: "Fiskal",
      title: t("readiness.p4Title", "Financing Ready"),
      subtitle: t("readiness.p4Subtitle", "Peluang KPBU, Blended Finance & Insentif Fiskal Perda"),
      icon: Coins,
      accentColor: "text-yellow-600 dark:text-yellow-400",
      accentBg: "bg-yellow-500/10 border-yellow-500/30",
      score: t("readiness.p4Score", "95%"),
      readinessRating: t("readiness.p4Rating", "Tingkat Kesiapan A1 • Regulasi Terbit"),
      tagline: t("readiness.p4Tagline", "Kombinasi insentif fiskal daerah dan kemudahan kemitraan pembiayaan publik-swasta."),
      blueprintStandard: t("readiness.p4Standard", "Skema KPBU (Kerjasama Pemerintah & Badan Usaha), Blended Finance, Fasilitas Tax Holiday"),
      luwuReadinessStatus: t("readiness.p4Status", "Perda Insentif Penanaman Modal & Fasilitasi Fiskal PBG/PBB-P2"),
      keyMetrics: [
        { label: t("readiness.p4m1Label", "Insentif PBG Daerah"), value: t("readiness.p4m1Value", "Hingga 50%"), desc: t("readiness.p4m1Desc", "Pembebasan retribusi izin gedung industri baru") },
        { label: t("readiness.p4m2Label", "Pengurangan PBB-P2"), value: t("readiness.p4m2Value", "s/d 5 Tahun"), desc: t("readiness.p4m2Desc", "Masa keringanan pajak selama fase konstruksi") },
        { label: t("readiness.p4m3Label", "Skema KPBU Terbuka"), value: t("readiness.p4m3Value", "Infrastruktur"), desc: t("readiness.p4m3Desc", "Proyek air minum, dermaga & logistik pergudangan") },
      ],
      strategicPoints: [
        {
          title: t("readiness.p4sp1Title", "Kalkulator Insentif Fiskal & Simulasi ROI"),
          desc: t("readiness.p4sp1Desc", "Perhitungan interaktif penghematan biaya modal (Capex/Opex) sesuai Perda Luwu dan PP No. 24/2019."),
          standard: t("readiness.p4sp1Std", "Smart Fiscal Estimator"),
        },
        {
          title: t("readiness.p4sp2Title", "Peluang KPBU Infrastruktur Strategis"),
          desc: t("readiness.p4sp2Desc", "Dukungan penyiapan proyek (PDF) dan penjaminan kelayakan pembiayaan untuk investor institusional."),
          standard: t("readiness.p4sp2Std", "Perpres No. 38/2015 KPBU"),
        },
        {
          title: t("readiness.p4sp3Title", "Fasilitasi Blended Finance & Perbankan Daerah"),
          desc: t("readiness.p4sp3Desc", "Kemitraan sindikasi Bank Sulselbar dan lembaga pembiayaan nasional untuk proyek strategis daerah."),
          standard: t("readiness.p4sp3Std", "OJK Sustainable Finance"),
        },
      ],
      primaryActionLabel: t("readiness.p4Action1", "Hitung Insentif Fiskal & ROI"),
      secondaryActionLabel: t("readiness.p4Action2", "Simulasi Finansial"),
      onPrimaryClick: onOpenIncentiveModal,
      onSecondaryClick: onScrollToCalculator,
    },
    {
      id: "environment",
      number: "05",
      badge: t("readiness.p5Badge", "Standar ESG & Amdal"),
      shortLabel: "Lingkungan",
      title: t("readiness.p5Title", "Environment Ready"),
      subtitle: t("readiness.p5Subtitle", "Percepatan Izin Lingkungan AMDAL, UKL-UPL & Keberlanjutan"),
      icon: Leaf,
      accentColor: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-500/10 border-emerald-500/30",
      score: t("readiness.p5Score", "100%"),
      readinessRating: t("readiness.p5Rating", "Tingkat Kesiapan A1 • Fast-Track Digital"),
      tagline: t("readiness.p5Tagline", "Kajian dampak lingkungan cepat dan transparan melalui integrasi digital AMDALNET."),
      blueprintStandard: t("readiness.p5Standard", "Percepatan Persetujuan Lingkungan, Standar Emisi Terkendali, Kepatuhan Ekologi Rendah Karbon"),
      luwuReadinessStatus: t("readiness.p5Status", "Asistensi Digital DLH Luwu (AMDALNET Terpadu SLA < 15 Hari Kerja)"),
      keyMetrics: [
        { label: t("readiness.p5m1Label", "SLA SPPL Otomatis"), value: t("readiness.p5m1Value", "Instan (< 1 Jam)"), desc: t("readiness.p5m1Desc", "Penerbitan via OSS-RBA untuk risiko rendah/menengah") },
        { label: t("readiness.p5m2Label", "SLA Rekomendasi UKL-UPL"), value: t("readiness.p5m2Value", "10 - 14 Hari"), desc: t("readiness.p5m2Desc", "Verifikasi dokumen lingkungan oleh tim teknis DLH") },
        { label: t("readiness.p5m3Label", "Komitmen Hijau Luwu"), value: t("readiness.p5m3Value", "Standar ESG"), desc: t("readiness.p5m3Desc", "Perlindungan tutupan hutan lindung & hulu DAS") },
      ],
      strategicPoints: [
        {
          title: t("readiness.p5sp1Title", "Percepatan Izin Lingkungan (Fast-Track AMDALNET)"),
          desc: t("readiness.p5sp1Desc", "Dinas Lingkungan Hidup Kab. Luwu menyediakan desk asistensi penyusunan formulir UKL-UPL satu pintu."),
          standard: t("readiness.p5sp1Std", "PP No. 22/2021"),
        },
        {
          title: t("readiness.p5sp2Title", "Buffer Proteksi Bencana & Tata Air Spasial"),
          desc: t("readiness.p5sp2Desc", "Pengecekan otomatis risiko banjir dan longsor memastikan lokasi pabrik bebas dari ancaman hidrologis."),
          standard: t("readiness.p5sp2Std", "Kajian Spasial Kebencanaan BPBD"),
        },
        {
          title: t("readiness.p5sp3Title", "Standar Investasi Hijau & Sirkular"),
          desc: t("readiness.p5sp3Desc", "Dukungan penuh untuk pemanfaatan limbah biomassa kelapa sawit dan kulit kakao sebagai energi terbarukan."),
          standard: t("readiness.p5sp3Std", "Green Investment Taxonomy"),
        },
      ],
      primaryActionLabel: t("readiness.p5Action1", "Pelajari Roadmap Perizinan DLH"),
      secondaryActionLabel: t("readiness.p5Action2", "Persetujuan Lingkungan"),
      onPrimaryClick: onScrollToRoadmap,
      onSecondaryClick: onScrollToRoadmap,
    },
    {
      id: "local_economy",
      number: "06",
      badge: t("readiness.p6Badge", "Kemitraan UMKM & Naker"),
      shortLabel: "Kemitraan",
      title: t("readiness.p6Title", "Local Economy Ready"),
      subtitle: t("readiness.p6Subtitle", "Kemitraan Wajib UMKM Daerah & Kesiapan SDM Bersertifikat"),
      icon: Users,
      accentColor: "text-sky-600 dark:text-sky-400",
      accentBg: "bg-sky-500/10 border-sky-500/30",
      score: t("readiness.p6Score", "92%"),
      readinessRating: t("readiness.p6Rating", "Tingkat Kesiapan A2 • Kemitraan Aktif"),
      tagline: t("readiness.p6Tagline", "Mempertemukan investor skala besar dengan rantai pasok pengusaha dan tenaga kerja lokal Luwu."),
      blueprintStandard: t("readiness.p6Standard", "Business Matching Investor - UMKM, Sertifikasi Keterampilan Lokal, Kemitraan Rantai Pasok"),
      luwuReadinessStatus: t("readiness.p6Status", "Direktori UMKM Terverifikasi MPP & Komitmen Penyerapan Naker Lokal 70%+"),
      keyMetrics: [
        { label: t("readiness.p6m1Label", "UMKM Binaan Terdaftar"), value: t("readiness.p6m1Value", "1.200+ Unit"), desc: t("readiness.p6m1Desc", "Sektor agribisnis, katering, logistik & suplier lokal") },
        { label: t("readiness.p6m2Label", "Sertifikasi BLK Luwu"), value: t("readiness.p6m2Value", "Siap Kerja"), desc: t("readiness.p6m2Desc", "Pelatihan las industri, alat berat, dan pengolahan hasil tani") },
        { label: t("readiness.p6m3Label", "Insentif Kemitraan"), value: t("readiness.p6m3Value", "Prioritas"), desc: t("readiness.p6m3Desc", "Kemudahan perizinan bagi investor bermitra dengan UMKM lokal") },
      ],
      strategicPoints: [
        {
          title: t("readiness.p6sp1Title", "Fasilitasi Business Matching Terjadwal"),
          desc: t("readiness.p6sp1Desc", "DPMPTSP Luwu secara aktif mengorkestrasi forum kemitraan antara pengusaha besar dan UMKM daerah."),
          standard: t("readiness.p6sp1Std", "Perpres No. 10/2021 tentang PM"),
        },
        {
          title: t("readiness.p6sp2Title", "Direktori Pemasok Daerah Terverifikasi"),
          desc: t("readiness.p6sp2Desc", "Akses langsung profil pengusaha lokal penyedia bahan baku, transportasi logistik, dan jasa konstruksi."),
          standard: t("readiness.p6sp2Std", "Database UMKM MPP Simpurusiang"),
        },
        {
          title: t("readiness.p6sp3Title", "Perlindungan & Peningkatan Nilai Tambah Daerah"),
          desc: t("readiness.p6sp3Desc", "Investasi yang masuk dipastikan memicu pertumbuhan ekonomi inklusif bagi masyarakat Kabupaten Luwu."),
          standard: t("readiness.p6sp3Std", "Inklusivitas Ekonomi BKPM"),
        },
      ],
      primaryActionLabel: t("readiness.p6Action1", "Lihat Direktori Kemitraan UMKM"),
      secondaryActionLabel: t("readiness.p6Action2", "Data Tenaga Kerja Lokal"),
      onPrimaryClick: onScrollToUmkm,
      onSecondaryClick: onScrollToPotensi,
    },
  ];

  const currentPillar = pillars.find((p) => p.id === activePillar) || pillars[0];
  const CurrentIcon = currentPillar.icon;

  return (
    <section
      id="readiness-section"
      className={`py-12 sm:py-16 md:py-20 border-t relative overflow-hidden transition-colors duration-500 ${
        isDark ? "bg-[#061826] border-white/10" : "bg-gradient-to-b from-slate-50 via-white to-slate-50 border-slate-200"
      }`}
    >
      {/* Decorative ambient radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[250px] bg-teal-500/5 dark:bg-teal-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="container max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Elevated Terverifikasi Resmi Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-[.1em] mb-1">
              {t("readiness.eyebrow", "Blueprint & Pilar Kesiapan • Standar Kementerian Investasi / BKPM RI")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("readiness.title", "Investment Readiness")}
            </h2>
          </div>
          {/* Badge pindah ke sini — jauh lebih visible */}
          <div className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex-shrink-0 self-start sm:self-auto">
            <ShieldCheck size={16} className="text-emerald-500" />
            <div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[.06em]">
                {t("readiness.officialVerified", "Terverifikasi Resmi")}
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400">
                Data sumber DPMPTSP Luwu
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: horizontal tabs | Mobile: scroll horizontal */}
        <div className="overflow-x-auto pb-1 mb-8 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
          <div className="flex gap-1.5 min-w-max md:min-w-0 md:flex-wrap">
            {pillars.map((pilar) => {
              const Icon = pilar.icon;
              const isActive = activePillar === pilar.id;
              return (
                <button
                  key={pilar.id}
                  type="button"
                  onClick={() => setActivePillar(pilar.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[44px] flex-shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-[0_2px_8px_rgba(16,185,129,.3)]"
                      : isDark
                        ? "bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  }`}
                >
                  <Icon size={15} />
                  {/* Label singkat untuk mobile */}
                  <span className="hidden sm:inline">{pilar.title}</span>
                  <span className="sm:hidden">{pilar.shortLabel}</span>
                  {/* Skor kesiapan sebagai badge kecil */}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isDark
                          ? "bg-slate-700 text-slate-300"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {pilar.score}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Showcase Panel for the Active Pillar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPillar.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`p-2.5 sm:p-7 md:p-9 rounded-2xl border relative overflow-hidden backdrop-blur-2xl shadow-xl transition-all duration-300 ${
              isDark
                ? "bg-[#0D253A]/95 border-white/10 shadow-black/60"
                : "bg-white/95 border-slate-200 shadow-xl shadow-slate-200/50"
            }`}
          >
            {/* Top Volumetric Glow Bar */}
            <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
              {/* Left Column: Pillar Identity & Strategic Highlights (7 cols) */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2 sm:mb-2.5">
                    <span className="text-[11px] sm:text-xs font-mono font-black px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-100/90 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                      PILAR {currentPillar.number} • {currentPillar.badge}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Activity size={12} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{currentPillar.readinessRating}</span>
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight mb-1 sm:mb-1.5 flex items-center gap-2 sm:gap-3">
                    <span>{currentPillar.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base font-extrabold text-emerald-800 dark:text-emerald-400 mb-2 sm:mb-2.5">
                    {currentPillar.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {currentPillar.tagline}
                  </p>
                </div>

                {/* Status Kesiapan Luwu vs Standar Kementerian */}
                <div
                  className={`p-2.5 sm:p-4.5 rounded-xl sm:rounded-2xl border space-y-2.5 sm:space-y-3 ${
                    isDark
                      ? "bg-[#081827]/80 border-slate-800"
                      : "bg-slate-50/90 border-slate-200/90"
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <span className="font-black text-slate-950 dark:text-white mr-1 sm:mr-1.5">
                        {t("readiness.statusLabel", "Status Kesiapan Luwu:")}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {currentPillar.luwuReadinessStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950/80 flex items-center justify-center shrink-0 mt-0.5 text-sky-700 dark:text-sky-400">
                      <Award size={13} className="stroke-[2.5]" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <span className="font-black text-slate-950 dark:text-white mr-1 sm:mr-1.5">
                        {t("readiness.standardLabel", "Acuan Blueprint Kementerian:")}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {currentPillar.blueprintStandard}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Strategic Key Deliverables Grid */}
                <div className="space-y-2.5 sm:space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-black text-slate-950 dark:text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{t("readiness.featuresTitle", "Fitur & Solusi Kesiapan Terintegrasi:")}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {currentPillar.strategicPoints.map((pt, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border flex flex-col justify-between transition-all ${
                          isDark
                            ? "bg-[#091D2E]/90 border-slate-800 hover:border-slate-700"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md shadow-xs"
                        }`}
                      >
                        <div>
                          <span className="inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2 border border-slate-200 dark:border-slate-700">
                            {pt.standard}
                          </span>
                          <h5 className="text-xs font-black text-slate-950 dark:text-white mb-1 sm:mb-1.5 leading-snug">
                            {pt.title}
                          </h5>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
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
                      className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 group"
                    >
                      <span>{currentPillar.primaryActionLabel}</span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                  {currentPillar.secondaryActionLabel && (
                    <button
                      type="button"
                      onClick={currentPillar.onSecondaryClick}
                      className={`px-4.5 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        isDark
                          ? "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:text-white"
                          : "bg-slate-100/90 hover:bg-slate-200 text-slate-900 border-slate-200 font-bold"
                      }`}
                    >
                      <span>{currentPillar.secondaryActionLabel}</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Key Quantitative Readiness Indicators (5 cols) */}
              <div className="lg:col-span-5 space-y-2.5 sm:space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                    <CurrentIcon size={15} className={currentPillar.accentColor} />
                    <span>{t("readiness.quantitativeIndicator", "Indikator Kuantitatif Kesiapan")}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                    Standar BKPM RI
                  </span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {currentPillar.keyMetrics.map((met, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                        isDark
                          ? "bg-[#091D2E]/80 border-slate-800 hover:border-slate-700"
                          : "bg-slate-50/90 border-slate-200/90 hover:bg-white hover:border-slate-300 hover:shadow-md shadow-xs"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                          {met.label}
                        </span>
                        <span className="text-lg sm:text-xl font-mono font-black text-slate-950 dark:text-white">
                          {met.value}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug font-medium">
                        {met.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Regional Integration Card */}
                <div
                  className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                    isDark
                      ? "bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border-emerald-500/30 text-slate-200"
                      : "bg-gradient-to-br from-emerald-50 to-teal-50/70 border-emerald-200 text-slate-800 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-black text-slate-950 dark:text-white">
                      {t("readiness.legalTitle", "Jaminan Kepastian Hukum & Perizinan")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-2.5">
                    {t("readiness.legalDesc", "Sistem InvestLuwu menghubungkan seluruh perizinan dan tata ruang langsung dengan DPMPTSP Kabupaten Luwu, Dinas PUPR, DLH, dan Kementerian Investasi RI / BKPM melalui Online Single Submission (OSS).")}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-1 border-t border-emerald-500/20 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">DPMPTSP Luwu</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Dinas PUPR</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">DLH Luwu</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">OSS-RBA BKPM</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
