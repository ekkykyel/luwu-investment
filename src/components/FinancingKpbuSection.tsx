import React from "react";
import { useTranslation } from "react-i18next";
import {
  Coins,
  ShieldCheck,
  Building,
  TrendingUp,
  Award,
  Sparkles,
  ExternalLink,
  ArrowRight,
  FileText,
  Percent,
  CheckCircle2,
} from "lucide-react";

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
      title: t("landingInvest.financing.spamTitle", "SPAM Regional & Distribusi Air Bersih KIB"),
      sector: t("landingInvest.financing.sectorWater", "Air Minum & Utilitas Industri"),
      scheme: t("landingInvest.financing.spamScheme", "Skema: KPBU - User Charge / Availability Payment"),
      estCapex: "Rp 185 Miliar",
      status: "Tahap Penyiapan / Pra-Studi Kelayakan (OBC)",
      desc: t("landingInvest.financing.spamDesc", "Pembangunan jaringan intake dan instalasi pengolahan air bersih Sungai Suso untuk menyuplai Kawasan Industri Bua dan pemukiman sekitar."),
      support: t("landingInvest.financing.spamSupport", "Dukungan Kelayakan VGF & PDF Kementerian Keuangan"),
    },
    {
      title: t("landingInvest.financing.coldChainTitle", "Pergudangan Modern & Cold Chain Pelabuhan Ulo-Ulo"),
      sector: t("landingInvest.financing.sectorLogistics", "Logistik & Maritim"),
      scheme: t("landingInvest.financing.coldChainScheme", "Skema: KPBU Bangun-Guna-Serah (BGS / BOT)"),
      estCapex: "Rp 120 Miliar",
      status: "Peluang Terbuka Kemitraan Swasta (IPRO)",
      desc: t("landingInvest.financing.coldChainDesc", "Fasilitas cold storage kapasitas 1.500 ton untuk komoditas perikanan Teluk Bone dan logistik hasil perkebunan kakao/kopi Luwu."),
      support: t("landingInvest.financing.coldChainSupport", "Penjaminan Infrastruktur PT PII & Fasilitasi Lahan HPL"),
    },
    {
      title: t("landingInvest.financing.cargoTitle", "Pusat Logistik Berikat & Terminal Kargo Bandara Bua"),
      sector: t("landingInvest.financing.sectorAviation", "Aviasi & Multimoda"),
      scheme: t("landingInvest.financing.cargoScheme", "Skema: Kemitraan Swasta - BUMD Luwu"),
      estCapex: "Rp 95 Miliar",
      status: "Kajian Kelayakan Teknis (FS Tersedia)",
      desc: t("landingInvest.financing.cargoDesc", "Terminal kargo udara dan hub transit distribusi komoditas bernilai tinggi ke wilayah timur dan barat Indonesia."),
      support: t("landingInvest.financing.cargoSupport", "Keringanan Pajak Daerah PBB-P2 5 Tahun Pertama"),
    },
  ];

  const fiscalIncentives = [
    {
      badge: "Perda Luwu No. 2/2021",
      title: t("landingInvest.financing.pbgTitle", "Pembebasan Retribusi PBG"),
      value: t("landingInvest.financing.pbgReduction", "s/d 50% Pengurangan"),
      desc: t("landingInvest.financing.pbgDesc", "Keringanan biaya persetujuan bangunan gedung untuk pabrik pengolahan hilirisasi dan fasilitas industri baru."),
    },
    {
      badge: "Insentif Pajak Daerah",
      title: t("landingInvest.financing.pbbTitle", "Keringanan PBB-P2 Konstruksi"),
      value: t("landingInvest.financing.pbbPeriod", "Masa Keringanan 5 Th"),
      desc: t("landingInvest.financing.pbbDesc", "Tarif pajak bumi dan bangunan nol persen atau terdiskon selama masa konstruksi fisik berlangsung."),
    },
    {
      badge: "Kementerian Keuangan",
      title: t("landingInvest.financing.taxHolidayTitle", "Fasilitas Tax Holiday & Allowance"),
      value: t("landingInvest.financing.taxHolidayRate", "Hingga 100% PPh Badan"),
      desc: t("landingInvest.financing.taxHolidayDesc", "Fasilitas usulan penanaman modal pionir dan hilirisasi strategis ke BKPM RI dan Direktorat Jenderal Pajak."),
    },
  ];

  return (
    <div
      id="skema-pembiayaan-kpbu"
      className={`mt-10 p-5 sm:p-7 md:p-9 rounded-3xl border relative overflow-hidden transition-all duration-300 backdrop-blur-2xl ${
        isDark
          ? "bg-surface/90 border-slate-800 text-white shadow-xl shadow-black/50"
          : "bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-100"
      }`}
    >
      {/* Top Gold/Emerald Accent Rail */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-500" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 mb-2">
            <Coins size={13} className="text-amber-500" />
            <span>Pilar 4 • Financing Ready</span>
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            {t("landingInvest.financing.title", "Skema Pembiayaan Kreatif & Peluang KPBU Kabupaten Luwu")}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mt-1">
            {t("landingInvest.financing.subtitle", "Membuka akses pembiayaan campuran (Blended Finance), Kerja Sama Pemerintah dan Badan Usaha (KPBU), serta paket insentif pajak daerah bagi proyek-proyek strategis.")}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenIncentiveModal}
          className="self-start md:self-end px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Sparkles size={14} />
          <span>{t("landingInvest.financing.btnCalculator", "Kalkulator Insentif Fiskal")}</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 3 KPBU Priority Projects Grid */}
      <div className="mb-8">
        <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Building size={14} className="text-emerald-500" />
          <span>{t("landingInvest.financing.pipelineTitle", "DAFTAR PIPELINE PROYEK KPBU POTENSIAL:")}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpbuProjects.map((p, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all hover:border-emerald-500/50 ${
                isDark ? "bg-base/70 border-slate-800" : "bg-slate-50 border-slate-200/90 shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {p.sector}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {p.estCapex}
                  </span>
                </div>

                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                  {p.title}
                </h5>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  {p.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Skema: <span className="font-semibold text-slate-800 dark:text-slate-200">{p.scheme}</span>
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium flex items-start gap-1">
                  <CheckCircle2 size={11} className="shrink-0 mt-0.5 text-emerald-500" />
                  <span>{p.support}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Fiscal Incentive Pillars */}
      <div>
        <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Award size={14} className="text-amber-500" />
          <span>{t("landingInvest.financing.incentivesTitle", "FASILITAS & INSENTIF INVESTASI DAERAH:")}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fiscalIncentives.map((inc, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${
                isDark ? "bg-base/50 border-slate-800" : "bg-slate-50/70 border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {inc.badge}
                </span>
                <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                  {inc.value}
                </span>
              </div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                {inc.title}
              </h5>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {inc.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
