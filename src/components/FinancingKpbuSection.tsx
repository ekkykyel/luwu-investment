import React from "react";
import {
  Coins,
  ShieldCheck,
  Building2,
  Award,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Droplets,
  Warehouse,
  Plane,
  BadgePercent,
  Calendar,
  Building,
  MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface FinancingKpbuSectionProps {
  isDark?: boolean;
  onOpenIncentiveModal?: () => void;
  onOpenConsultation?: () => void;
}

export default function FinancingKpbuSection({
  isDark = true,
  onOpenIncentiveModal,
  onOpenConsultation,
}: FinancingKpbuSectionProps) {
  const { t } = useTranslation();

  const kpbuProjects = [
    {
      title: t("kpbu.p1Title", "SPAM Regional & Distribusi Air Bersih KIB"),
      sector: t("kpbu.p1Sector", "Air Minum & Utilitas Industri"),
      icon: Droplets,
      iconColor: "text-sky-500 dark:text-sky-400",
      iconBg: "bg-sky-500/10 border-sky-500/20",
      scheme: t("kpbu.p1Scheme", "KPBU - User Charge / Availability Payment"),
      estCapex: "Rp 185 Miliar",
      status: t("kpbu.p1Status", "Tahap Penyiapan OBC"),
      statusColor: "bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-500/30",
      dotColor: "bg-amber-500",
      desc: t("kpbu.p1Desc", "Pembangunan jaringan intake dan instalasi pengolahan air bersih Sungai Suso untuk menyuplai Kawasan Industri Bua dan pemukiman sekitar."),
      support: t("kpbu.p1Support", "Dukungan Kelayakan VGF & PDF Kementerian Keuangan"),
    },
    {
      title: t("kpbu.p2Title", "Pergudangan Modern & Cold Chain Pelabuhan Ulo-Ulo"),
      sector: t("kpbu.p2Sector", "Logistik & Maritim"),
      icon: Warehouse,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      scheme: t("kpbu.p2Scheme", "KPBU Bangun-Guna-Serah (BGS / BOT)"),
      estCapex: "Rp 120 Miliar",
      status: t("kpbu.p2Status", "IPRO Siap Tawar"),
      statusColor: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30",
      dotColor: "bg-emerald-500",
      desc: t("kpbu.p2Desc", "Fasilitas cold storage kapasitas 1.500 ton untuk komoditas perikanan Teluk Bone dan logistik hasil perkebunan kakao/kopi Luwu."),
      support: t("kpbu.p2Support", "Penjaminan Infrastruktur PT PII & Fasilitasi Lahan HPL"),
    },
    {
      title: t("kpbu.p3Title", "Pusat Logistik Berikat & Terminal Kargo Bandara Bua"),
      sector: t("kpbu.p3Sector", "Aviasi & Multimoda"),
      icon: Plane,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/20",
      scheme: t("kpbu.p3Scheme", "Kemitraan Swasta - BUMD Luwu"),
      estCapex: "Rp 95 Miliar",
      status: t("kpbu.p3Status", "FS Tersedia"),
      statusColor: "bg-teal-100 dark:bg-teal-950/80 text-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-500/30",
      dotColor: "bg-teal-500",
      desc: t("kpbu.p3Desc", "Terminal kargo udara dan hub transit distribusi komoditas bernilai tinggi ke wilayah timur dan barat Indonesia."),
      support: t("kpbu.p3Support", "Keringanan Pajak Daerah PBB-P2 5 Tahun Pertama"),
    },
  ];

  const fiscalIncentives = [
    {
      badge: t("kpbu.f1Badge", "Perda Luwu No. 2/2021"),
      title: t("kpbu.f1Title", "Pembebasan Retribusi PBG"),
      metric: "50%",
      metricUnit: t("kpbu.f1Unit", "Pengurangan"),
      icon: Building,
      accentColor: "from-amber-500 to-orange-500",
      desc: t("kpbu.f1Desc", "Keringanan biaya persetujuan bangunan gedung untuk pabrik pengolahan hilirisasi dan fasilitas industri baru."),
    },
    {
      badge: t("kpbu.f2Badge", "Insentif Pajak Daerah"),
      title: t("kpbu.f2Title", "Keringanan PBB-P2 Konstruksi"),
      metric: "5 Th",
      metricUnit: t("kpbu.f2Unit", "Masa Bebas Pajak"),
      icon: Calendar,
      accentColor: "from-emerald-500 to-teal-500",
      desc: t("kpbu.f2Desc", "Tarif pajak bumi dan bangunan nol persen atau terdiskon selama masa konstruksi fisik fasilitas berlangsung."),
    },
    {
      badge: t("kpbu.f3Badge", "Kementerian Keuangan RI"),
      title: t("kpbu.f3Title", "Fasilitas Tax Holiday & Allowance"),
      metric: "100%",
      metricUnit: t("kpbu.f3Unit", "PPh Badan"),
      icon: BadgePercent,
      accentColor: "from-sky-500 to-blue-500",
      desc: t("kpbu.f3Desc", "Fasilitasi usulan penanaman modal pionir dan hilirisasi strategis ke BKPM RI dan Direktorat Jenderal Pajak."),
    },
  ];

  const institutionalPartners = [
    { name: "Kementerian Keuangan RI", role: "Fasilitas VGF & PDF" },
    { name: "PT Penjaminan Infrastruktur Indonesia (PII)", role: "Penjaminan Risiko Proyek" },
    { name: "PT SMI (Persero)", role: "Pembiayaan Pembangunan" },
    { name: "LKPP", role: "Standarisasi Pengadaan Badan Usaha" },
    { name: "Bank Sulselbar", role: "Sindikasi Finansial Daerah" },
  ];

  return (
    <div
      id="skema-pembiayaan-kpbu"
      className={`mt-10 sm:mt-12 p-2.5 sm:p-7 md:p-9 rounded-2xl sm:rounded-3xl border relative overflow-hidden transition-all duration-300 backdrop-blur-2xl ${
        isDark
          ? "bg-[#0B1E2E]/95 border-white/10 text-white shadow-2xl shadow-black/60"
          : "bg-white/95 border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50"
      }`}
    >
      {/* Top Gold & Emerald Gradient Accent Rail */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-500" />

      {/* Subtle Background Radial Glows */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Executive Presentation */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8 sm:mb-10 relative z-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border backdrop-blur-md shadow-xs bg-amber-100/90 text-amber-950 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-500/30">
            <Coins size={14} className="text-amber-600 dark:text-amber-400" />
            <span>{t("kpbu.eyebrow", "Pilar 4 • Financing Ready")}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            {t("kpbu.title", "Skema Pembiayaan Kreatif & Peluang KPBU Kabupaten Luwu")}
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium max-w-3xl leading-relaxed">
            {t("kpbu.subtitle", "Membuka akses pembiayaan campuran (Blended Finance), Kerja Sama Pemerintah dan Badan Usaha (KPBU), serta paket insentif pajak daerah bagi proyek-proyek infrastruktur dan industri strategis.")}
          </p>
        </div>

        {/* Dual Action Header Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {onOpenConsultation && (
            <button
              type="button"
              onClick={onOpenConsultation}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                isDark
                  ? "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:text-white"
                  : "bg-slate-100/90 hover:bg-slate-200 text-slate-900 border-slate-200"
              }`}
            >
              <MessageSquare size={14} />
              <span>{t("kpbu.btnConsultation", "Konsultasi Meja KPBU")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenIncentiveModal}
            className="px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 group"
          >
            <Sparkles size={14} />
            <span>{t("kpbu.btnCalculator", "Kalkulator Insentif Fiskal")}</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* 1. DAFTAR PIPELINE PROYEK KPBU POTENSIAL */}
      <div className="mb-9 sm:mb-11 relative z-10">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h4 className="text-xs sm:text-sm uppercase tracking-wider font-black text-slate-950 dark:text-white flex items-center gap-2">
            <Building2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t("kpbu.pipelineTitle", "Daftar Pipeline Proyek KPBU Potensial:")}</span>
          </h4>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
            {t("kpbu.pipelineBadge", "3 PROYEK STRATEGIS TERBUKA")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {kpbuProjects.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className={`p-2.5 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                  isDark
                    ? "bg-[#071725]/85 border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/20"
                    : "bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-xl hover:shadow-slate-200/60 shadow-xs"
                }`}
              >
                <div>
                  {/* Top Bar: Sector Badge, Status Dot, & Big CAPEX */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${p.iconBg}`}>
                        <Icon size={14} className={p.iconColor} />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                        {p.sector}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold border shadow-2xs">
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${p.dotColor}`} />
                      <span className={p.statusColor.split(" ")[2]}>{p.status}</span>
                    </div>
                  </div>

                  {/* Prominent Capex Indicator */}
                  <div className="mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                      {t("kpbu.estCapexLabel", "Estimasi Nilai Investasi (CAPEX):")}
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                      {p.estCapex}
                    </span>
                  </div>

                  <h5 className="text-sm font-black text-slate-950 dark:text-white mb-2 leading-snug">
                    {p.title}
                  </h5>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4 font-medium">
                    {p.desc}
                  </p>
                </div>

                <div className="space-y-3 pt-3.5 border-t border-slate-200/80 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t("kpbu.schemeLabel", "Skema:")}</span>{" "}
                    <span className="font-medium">{p.scheme}</span>
                  </div>

                  <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-start gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="leading-tight">{p.support}</span>
                  </div>

                  {/* Project Specific Interactive Consultation CTA */}
                  {onOpenConsultation && (
                    <button
                      type="button"
                      onClick={onOpenConsultation}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                        isDark
                          ? "bg-slate-800/80 hover:bg-emerald-600/20 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40"
                          : "bg-slate-100/90 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      <span>{t("kpbu.btnProjectConsult", "Konsultasi Skema Proyek")}</span>
                      <ArrowUpRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. FASILITAS & INSENTIF INVESTASI DAERAH */}
      <div className="mb-9 sm:mb-11 relative z-10">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h4 className="text-xs sm:text-sm uppercase tracking-wider font-black text-slate-950 dark:text-white flex items-center gap-2">
            <Award size={16} className="text-amber-500" />
            <span>{t("kpbu.fiscalTitle", "Fasilitas & Insentif Investasi Daerah:")}</span>
          </h4>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
            {t("kpbu.fiscalBadge", "REGULASI & FASILITASI RESMI")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {fiscalIncentives.map((inc, idx) => {
            const Icon = inc.icon;
            return (
              <div
                key={idx}
                className={`p-2.5 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                  isDark
                    ? "bg-[#071725]/70 border-slate-800 hover:border-amber-500/40"
                    : "bg-slate-50/80 border-slate-200 hover:bg-white hover:border-amber-400 hover:shadow-lg hover:shadow-slate-200/50 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700">
                      {inc.badge}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Icon size={14} />
                    </div>
                  </div>

                  {/* Big Impactful Metric Display */}
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-mono font-black text-amber-600 dark:text-amber-400">
                      {inc.metric}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {inc.metricUnit}
                    </span>
                  </div>

                  <h5 className="text-sm font-black text-slate-950 dark:text-white mb-1.5 leading-snug">
                    {inc.title}
                  </h5>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {inc.desc}
                  </p>
                </div>

                <div className="pt-3.5 mt-3.5 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onOpenIncentiveModal}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{t("kpbu.fiscalSimulateLink", "Simulasi Penghematan di Kalkulator")}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. INSTITUTIONAL TRUST & GUARANTEE STRIP */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all relative z-10 ${
          isDark
            ? "bg-gradient-to-br from-[#061522] to-[#0A2238] border-emerald-500/30"
            : "bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border-emerald-200 shadow-xs"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">
              {t("kpbu.assuranceTitle", "Ekosistem Penjaminan & Kemitraan Finansial Terverifikasi")}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {t("kpbu.assuranceSubtitle", "Jaminan Kepastian Berinvestasi & Perlindungan Risiko")}
          </span>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-3.5">
          {t("kpbu.assuranceDesc", "Seluruh skema pembiayaan kreatif dan proyek KPBU Kabupaten Luwu disiapkan dengan standar kelayakan ketat (OBC/FBC) serta mendapat dukungan fasilitas penyiapan proyek, penjaminan infrastruktur, dan kemitraan sindikasi perbankan.")}
        </p>

        {/* Institutional Partner Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-emerald-500/20 text-[10px] font-bold">
          {institutionalPartners.map((inst, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-200 shadow-2xs"
            >
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{inst.name}</span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">{inst.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
