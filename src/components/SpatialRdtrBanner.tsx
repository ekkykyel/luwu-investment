import React from "react";
import {
  Map,
  Layers,
  Compass,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Building,
  Sparkles,
  ArrowRight,
  Maximize2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface SpatialRdtrBannerProps {
  isDark?: boolean;
  onOpenRtrwModal?: () => void;
  onOpenSpatialMap?: () => void;
}

export default function SpatialRdtrBanner({
  isDark = true,
  onOpenRtrwModal,
  onOpenSpatialMap,
}: SpatialRdtrBannerProps) {
  const { t } = useTranslation();

  const zones = [
    {
      code: "KIB",
      name: t("spatialBanner.zones.kibName", "Kawasan Industri Bua"),
      type: t("spatialBanner.zones.kibType", "Zona Industri Manufaktur & Smelter"),
      status: t("spatialBanner.zones.kibStatus", "RDTR Digital Aktif (OSS-RBA)"),
      color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    },
    {
      code: "AGR",
      name: t("spatialBanner.zones.agrName", "Koridor Agropolitan Noling - Suli"),
      type: t("spatialBanner.zones.agrType", "Zona Hilirisasi Pertanian & Kakao"),
      status: t("spatialBanner.zones.agrStatus", "Kesesuaian Ruang Terverifikasi"),
      color: "border-teal-500/50 bg-teal-500/10 text-teal-400",
    },
    {
      code: "MAR",
      name: t("spatialBanner.zones.marName", "Kawasan Maritim & Pelabuhan Ulo-Ulo"),
      type: t("spatialBanner.zones.marType", "Zona Logistik, Cold Chain & Perikanan"),
      status: t("spatialBanner.zones.marStatus", "Integrasi RZWP-3-K & RTRW Luwu"),
      color: "border-sky-500/50 bg-sky-500/10 text-sky-400",
    },
    {
      code: "EKO",
      name: t("spatialBanner.zones.ekoName", "Ekowisata Pegunungan Latimojong"),
      type: t("spatialBanner.zones.ekoType", "Zona Pariwisata Hijau & Perkebunan Kopi"),
      status: t("spatialBanner.zones.ekoStatus", "Bebas Kawasan Lindung Rentan"),
      color: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    },
  ];

  return (
    <div
      className={`p-2.5 sm:p-6 rounded-2xl sm:rounded-3xl border mb-6 sm:mb-8 relative overflow-hidden backdrop-blur-2xl transition-all ${
        isDark
          ? "bg-gradient-to-r from-emerald-950/40 via-surface/90 to-sky-950/30 border-slate-800 shadow-xl shadow-black/40"
          : "bg-gradient-to-r from-emerald-50/90 via-white to-sky-50/80 border-slate-200/90 shadow-md shadow-slate-100"
      }`}
    >
      {/* Top Border Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <Layers size={11} className="text-emerald-500" />
              <span>{t("spatialBanner.eyebrow", "Spatial Ready • Integrasi RDTR Digital")}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {t("spatialBanner.regulation", "Perda Kab. Luwu No. 1/2024 & GISTARU")}
            </span>
          </div>

          <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {t("spatialBanner.title", "Peta Digital RDTR Terintegrasi & Validasi Kesesuaian Ruang (KKPR)")}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t("spatialBanner.subtitle", "Seluruh titik peluang investasi di bawah ini telah terverifikasi secara spasial dengan RTRW Kabupaten Luwu. Anda dapat memverifikasi peruntukan zona, garis sempadan, dan status kepemilikan lahan secara instan.")}
          </p>

          {/* 4 Mini Zone Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {zones.map((z, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-left ${
                  isDark ? "bg-base/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {z.code}
                  </span>
                  <CheckCircle2 size={11} className="text-emerald-500" />
                </div>
                <div className="text-[10.5px] font-bold text-slate-900 dark:text-white line-clamp-1">
                  {z.name}
                </div>
                <div className="text-[9px] text-slate-600 dark:text-slate-400 font-medium line-clamp-1">
                  {z.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenRtrwModal}
            className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <ShieldCheck size={14} />
            <span>{t("spatialBanner.btnValidate", "Validasi Lahan (RTRW/KKPR)")}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSpatialMap}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all ${
              isDark
                ? "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700"
                : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs"
            }`}
          >
            <Maximize2 size={13} />
            <span>{t("spatialBanner.btnFullMap", "Buka Peta Spasial Penuh")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
