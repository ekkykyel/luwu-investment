import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Printer,
  Download,
  Loader2,
  X,
  FileText,
  MapPin,
  CheckCircle2,
  Building2,
  TrendingUp,
  ShieldCheck,
  Globe,
  Navigation,
} from "lucide-react";
import jsPDF from "jspdf";
import Swal from "sweetalert2";
import { Investment, District } from "../types";
import { formatRupiahSingkat, formatNumber } from "../lib/formatters";
import { SECTOR_COLORS, LUWU_INFRASTRUCTURE_NODES, calculateHaversineDistanceKm } from "../lib/constants";
import { useTranslation } from "react-i18next";
import { LUWU_LOGO_BASE64 } from "../lib/logoBase64";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "../lib/html2canvasShim";

export interface IproPitchDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  district?: District | null;
  isDarkMode?: boolean;
}

export default function IproPitchDeckModal({
  isOpen,
  onClose,
  investment,
  district,
  isDarkMode = false,
}: IproPitchDeckModalProps) {
  useTranslation();
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen || !investment) return null;

  // 1. Precise Supabase Financials Extraction (Single Source of Truth — Zero Dummy)
  const finObj = (investment as any).financials?.[0] || (investment as any).financials || {};
  const capex = Number(
    finObj.capex ??
      investment.investmentValue ??
      (investment as any).nilaiInvestasi ??
      (investment as any).nilai_investasi ??
      (investment as any).total_investment ??
      0
  ) || 0;
  const opex = Number(finObj.opex ?? (investment as any).opex ?? 0) || 0;
  const revenue = Number(
    finObj.revenue_projection ??
      finObj.revenue ??
      (investment as any).revenue ??
      0
  ) || 0;
  const irr = Number(
    finObj.irr ??
      (investment as any).irr ??
      investment.smartData?.irr ??
      0
  ) || 0;
  const bep = Number(
    finObj.payback_period ??
      finObj.bep_years ??
      (investment as any).bepYears ??
      (investment as any).paybackPeriod ??
      0
  ) || 0;
  const npv = Number(
    finObj.npv ??
      (investment as any).npvValue ??
      investment.npv ??
      0
  ) || 0;

  // 2. Spatial & Geographic Information (Honest Fallback)
  const sectorColor = SECTOR_COLORS[investment.sector] || "#10b981";
  const districtName =
    district?.name ||
    investment.districtId ||
    (investment as any).kecamatan ||
    (investment as any).locations?.[0]?.kecamatan ||
    "Kabupaten Luwu";
  const villageName =
    (investment as any).villageId ||
    (investment as any).desa ||
    (investment as any).locations?.[0]?.desa ||
    "-";
  const areaHa =
    Number(
      investment.areaHa ??
        (investment as any).luas_lahan ??
        (investment as any).gis_potensi_investasi?.[0]?.luas_lahan ??
        0
    ) || 0;
  const landStatus =
    investment.landStatus ||
    (investment as any).status_kepemilikan ||
    (investment as any).legalities?.[0]?.status_lahan ||
    "Menunggu Verifikasi Lahan";
  const polaRuang =
    investment.polaRuang ||
    (investment as any).pola_ruang ||
    (investment as any).gis_potensi_investasi?.[0]?.pola_ruang ||
    "Menunggu Verifikasi RTRW";
  const suitabilityScore =
    Number(investment.suitabilityScore ?? (investment as any).investment_scores?.[0]?.skor_total ?? 0) || 0;
  const laborLocalPercent =
    Number(investment.komitmenTenagaLokal ?? (investment as any).komitmen_tenaga_lokal ?? 0) || 0;

  const rawLat = Number(investment.latitude ?? (investment as any).geometries?.[0]?.latitude ?? 0);
  const rawLng = Number(investment.longitude ?? (investment as any).geometries?.[0]?.longitude ?? 0);
  const hasValidCoords = Boolean(rawLat && rawLng && !isNaN(rawLat) && !isNaN(rawLng));

  // 3. Dynamic Real Geodesic Distance Matrix to Master Luwu Hubs (computed ONLY when real coordinates exist)
  const distAirportBua = hasValidCoords
    ? calculateHaversineDistanceKm(rawLat, rawLng, LUWU_INFRASTRUCTURE_NODES.BANDARA_BUA.lat, LUWU_INFRASTRUCTURE_NODES.BANDARA_BUA.lng)
    : null;
  const distPortBelopa = hasValidCoords
    ? calculateHaversineDistanceKm(rawLat, rawLng, LUWU_INFRASTRUCTURE_NODES.PELABUHAN_BELOPA.lat, LUWU_INFRASTRUCTURE_NODES.PELABUHAN_BELOPA.lng)
    : null;
  const distTransSulawesi = hasValidCoords
    ? calculateHaversineDistanceKm(rawLat, rawLng, LUWU_INFRASTRUCTURE_NODES.TRANS_SULAWESI.lat, LUWU_INFRASTRUCTURE_NODES.TRANS_SULAWESI.lng)
    : null;
  const distPlnSubstation = hasValidCoords
    ? calculateHaversineDistanceKm(rawLat, rawLng, LUWU_INFRASTRUCTURE_NODES.PLN_SUBSTATION.lat, LUWU_INFRASTRUCTURE_NODES.PLN_SUBSTATION.lng)
    : null;
  const distWaterBasin = hasValidCoords
    ? calculateHaversineDistanceKm(rawLat, rawLng, LUWU_INFRASTRUCTURE_NODES.WATER_BASIN.lat, LUWU_INFRASTRUCTURE_NODES.WATER_BASIN.lng)
    : null;

  // 4. Contact & Identification
  const docId = `IPRO-LUWU-${String(investment.id || "REG").substring(0, 8).toUpperCase()}`;
  const issuedDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const picName =
    investment.contactPic ||
    (investment as any).locations?.[0]?.pic_kontak ||
    "Dinas PMPTSP Kabupaten Luwu";
  const picPhone =
    investment.phoneNumber ||
    (investment as any).locations?.[0]?.telepon ||
    "(0471) 321001";
  const ossRiskLevel =
    capex > 10000000000
      ? "Tinggi / Wajib AMDAL"
      : capex > 0
      ? "Menengah / UKL-UPL"
      : "Menunggu Nilai CAPEX";

  // 5. Direct Android-First Offscreen A4 PDF Export (jsPDF + safeHtml2Canvas)
  const handleExportPdf = async () => {
    if (!printContainerRef.current || isExportingPdf) return;
    setIsExportingPdf(true);

    const offscreenHost = document.createElement("div");
    offscreenHost.style.position = "fixed";
    offscreenHost.style.top = "-9999px";
    offscreenHost.style.left = "-9999px";
    offscreenHost.style.width = "794px";
    offscreenHost.style.backgroundColor = "#ffffff";
    offscreenHost.style.color = "#0f172a";
    offscreenHost.style.padding = "32px 36px";
    offscreenHost.style.boxSizing = "border-box";
    offscreenHost.style.zIndex = "-1000";
    offscreenHost.style.pointerEvents = "none";

    try {
      const clonedSheet = printContainerRef.current.cloneNode(true) as HTMLElement;
      clonedSheet.style.maxHeight = "none";
      clonedSheet.style.overflow = "visible";
      clonedSheet.style.padding = "0";
      clonedSheet.style.width = "100%";
      clonedSheet.style.backgroundColor = "#ffffff";
      offscreenHost.appendChild(clonedSheet);
      document.body.appendChild(offscreenHost);

      await waitForDomAndIdle(offscreenHost, 3000);
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }

      const canvas = await pdfRenderQueue.enqueue(() =>
        safeHtml2Canvas(offscreenHost, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1024,
        })
      );

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfPageWidth = 210;
      const pdfPageHeight = 297;
      const renderedHeightMm = (canvas.height * pdfPageWidth) / canvas.width;

      if (renderedHeightMm <= pdfPageHeight) {
        pdf.addImage(imgData, "JPEG", 0, 0, pdfPageWidth, renderedHeightMm, undefined, "FAST");
      } else {
        let heightLeft = renderedHeightMm;
        let position = 0;
        pdf.addImage(imgData, "JPEG", 0, position, pdfPageWidth, renderedHeightMm, undefined, "FAST");
        heightLeft -= pdfPageHeight;
        while (heightLeft > 4) {
          position = heightLeft - renderedHeightMm;
          pdf.addPage("a4", "portrait");
          pdf.addImage(imgData, "JPEG", 0, position, pdfPageWidth, renderedHeightMm, undefined, "FAST");
          heightLeft -= pdfPageHeight;
        }
      }

      const safeTitle = (investment.name || "Potensi_Investasi")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 48);
      pdf.save(`Profil_Investasi_IPRO_${safeTitle}_Kab_Luwu.pdf`);
    } catch (err) {
      console.error("[IproPitchDeckModal] Gagal mengekspor PDF:", err);
      Swal.fire({
        title: "Gagal Mengekspor PDF",
        text: "Terjadi kendala saat menyusun dokumen PDF A4. Silakan coba kembali.",
        icon: "error",
        confirmButtonColor: "#10b981",
      });
    } finally {
      if (document.body.contains(offscreenHost)) {
        document.body.removeChild(offscreenHost);
      }
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10005] flex flex-col items-center justify-center p-2.5 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-hidden font-sans pt-[max(10px,env(safe-area-inset-top))] pb-[max(10px,env(safe-area-inset-bottom))]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[calc(100vw-20px)] sm:w-full max-w-4xl bg-[#FAF7F0] text-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E2DACB] max-h-[92vh] sm:max-h-[88vh] flex flex-col transition-all"
      >
        {/* ── TOP ACTION BAR (Android-First Touch Targets) ── */}
        <div
          className={`print:hidden p-2.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between border-b shrink-0 ${
            isDarkMode
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-[#F4F0E6] text-slate-900 border-[#E2DACB]"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-1">
            <div
              className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${
                isDarkMode
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-[#FAF7F0] text-emerald-700 border border-[#E2DACB]"
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold font-sans truncate">
                Profil Investasi &amp; Dossier IPRO
              </h2>
              <span
                className={`text-[10px] sm:text-xs font-mono truncate block ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                DPMPTSP Kab. Luwu · {docId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer min-h-[42px]"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              ) : (
                <Download className="w-4 h-4 shrink-0" />
              )}
              <span>
                {isExportingPdf ? (
                  "Menyusun PDF..."
                ) : (
                  <>
                    <span className="hidden sm:inline">Unduh Laporan PDF (A4)</span>
                    <span className="sm:hidden">Unduh PDF</span>
                  </>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              title="Cetak via Printer Desktop"
              className={`hidden sm:flex p-2.5 rounded-xl border transition-all min-w-[42px] min-h-[42px] items-center justify-center cursor-pointer ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60"
                  : "bg-[#FAF7F0] hover:bg-[#ECE5D6] text-slate-700 border-[#E2DACB]"
              }`}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Dossier IPRO"
              className={`p-2 sm:p-2.5 rounded-xl border transition-all min-w-[42px] min-h-[42px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center cursor-pointer active:scale-95 ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60"
                  : "bg-[#FAF7F0] hover:bg-[#ECE5D6] text-slate-600 hover:text-slate-900 border-[#E2DACB]"
              }`}
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ── OFFICIAL PEMKAB LUWU A4 DOSSIER SHEET ── */}
        <div
          ref={printContainerRef}
          className="p-3.5 sm:p-8 space-y-4 sm:space-y-5 bg-[#FAF7F0] text-slate-900 print:bg-white print:p-0 print:space-y-4 print:text-black font-sans relative flex-1 overflow-y-auto"
        >
          {/* KOP SURAT RESMI PEMERINTAH KABUPATEN LUWU */}
          <div className="border-b-[3px] border-double border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F4F0E6] border border-[#E2DACB] flex items-center justify-center p-1.5 shrink-0">
                <img
                  src={LUWU_LOGO_BASE64}
                  alt="Logo Pemerintah Kabupaten Luwu"
                  className="w-11 h-11 sm:w-12 sm:h-12 object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                  Pemerintah Kabupaten Luwu
                </span>
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase leading-snug">
                  Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu
                </h1>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  Jl. Jenderal Sudirman No. 1 Kompleks Perkantoran Pemkab Luwu, Belopa 91994 · dpmptsp@luwukab.go.id
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-[#F4F0E6] p-2.5 rounded-xl border border-[#E2DACB] shrink-0 min-w-[175px]">
              <span className="text-[10px] font-extrabold text-emerald-700 block">
                PROFIL PROYEK SIAP TAWAR (IPRO)
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5">{docId}</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                Terbit: {issuedDate}
              </span>
            </div>
          </div>

          {/* PROJECT TITLE & SECTOR BANNER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F0E6] border border-[#E2DACB] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-extrabold" style={{ color: sectorColor }}>
                  {investment.sector}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Desa/Kel. {villageName}, Kec. {districtName}</span>
                </span>
                {suitabilityScore > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-emerald-700">
                      Skor Kelayakan: {suitabilityScore}%
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-sans tracking-tight leading-snug">
                {investment.name}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed text-justify max-w-prose">
                {investment.description ||
                  "Profil peluang investasi daerah terdata pada Sistem Informasi Geospasial Pelayanan Investasi DPMPTSP Kabupaten Luwu."}
              </p>
            </div>
            <div className="md:text-right border-t md:border-t-0 md:border-l border-[#E2DACB] pt-3 md:pt-0 md:pl-5 shrink-0 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Nilai Investasi (CAPEX)
              </span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums tracking-tight text-emerald-700 block mt-0.5">
                {capex > 0 ? formatRupiahSingkat(capex) : "Belum Diinput"}
              </span>
              <div className="text-xs text-slate-600 font-mono mt-1">
                <span>{areaHa > 0 ? `${formatNumber(areaHa)} Ha` : "Luas Belum Terukur"}</span>
                <span aria-hidden="true"> · </span>
                <span className="text-blue-700 font-sans font-semibold">{landStatus}</span>
              </div>
            </div>
          </div>

          {/* 3-GRID SUMMARY: FINANCIALS, SPATIAL, & LEGAL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. FINANCIAL FEASIBILITY */}
            <div className="p-4 rounded-2xl bg-[#F4F0E6] border border-[#E2DACB] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E2DACB] pb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <h3 className="text-xs font-extrabold text-slate-900 font-sans">
                  Kelayakan Finansial
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">IRR Proyeksi:</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-700">
                    {irr > 0 ? `${irr}% / thn` : "Menunggu FS"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Payback (BEP):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">
                    {bep > 0 ? `${bep} Tahun` : "Menunggu FS"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Net Present Value:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">
                    {npv !== 0 ? formatRupiahSingkat(npv) : "Menunggu FS"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Proyeksi Revenue:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">
                    {revenue > 0 ? formatRupiahSingkat(revenue) : "Menunggu FS"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 gap-2">
                  <span className="text-slate-600 font-medium">Estimasi OPEX:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">
                    {opex > 0 ? formatRupiahSingkat(opex) : "Menunggu FS"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. SPATIAL & LOGISTICS CONNECTIVITY */}
            <div className="p-4 rounded-2xl bg-[#F4F0E6] border border-[#E2DACB] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E2DACB] pb-2">
                <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="text-xs font-extrabold text-slate-900 font-sans">
                  Aksesibilitas Geospasial
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Bandara I La Galigo Bua:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">
                    {distAirportBua !== null ? `± ${distAirportBua} km` : "Belum Terpetakan"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Pelabuhan Belopa:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">
                    {distPortBelopa !== null ? `± ${distPortBelopa} km` : "Belum Terpetakan"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Jalan Trans-Sulawesi:</span>
                  <span className="font-mono tabular-nums font-bold text-blue-700">
                    {distTransSulawesi !== null ? `± ${distTransSulawesi} km` : "Belum Terpetakan"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Gardu Induk PLN 150kV:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">
                    {distPlnSubstation !== null ? `± ${distPlnSubstation} km` : "Belum Terpetakan"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 gap-2">
                  <span className="text-slate-600 font-medium">DAS Suso &amp; Suli:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">
                    {distWaterBasin !== null ? `± ${distWaterBasin} km` : "Belum Terpetakan"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. LEGAL & REGULATORY READINESS */}
            <div className="p-4 rounded-2xl bg-[#F4F0E6] border border-[#E2DACB] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E2DACB] pb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <h3 className="text-xs font-extrabold text-slate-900 font-sans">
                  Kepastian Regulasi &amp; Tata Ruang
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Pola Ruang RTRW:</span>
                  <span className="font-semibold text-emerald-700 truncate max-w-[140px] text-right" title={polaRuang}>
                    {polaRuang}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Klasifikasi Risiko OSS:</span>
                  <span className="font-mono font-bold text-slate-800 text-right">
                    {ossRiskLevel}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Status Lahan:</span>
                  <span className="font-semibold text-indigo-700 truncate max-w-[140px] text-right" title={landStatus}>
                    {landStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-[#E2DACB]/60 gap-2">
                  <span className="text-slate-600 font-medium">Komitmen Naker Lokal:</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-700">
                    {laborLocalPercent > 0 ? `${laborLocalPercent} Jiwa / TKL` : "Sesuai Perda Luwu"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 gap-2">
                  <span className="text-slate-600 font-medium">Skema Kemitraan:</span>
                  <span className="font-mono font-bold text-slate-800">PMA / PMDN / KPBU</span>
                </div>
              </div>
            </div>
          </div>

          {/* SPATIAL COORDINATES & STRATEGIC CONTACT */}
          <div className="p-4 rounded-2xl border border-[#E2DACB] bg-[#F4F0E6] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 font-sans mb-1 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Georeferensi Titik Spasial PostGIS</span>
              </h4>
              <p className="font-mono tabular-nums text-slate-800 bg-[#FAF7F0] border border-[#E2DACB] px-2.5 py-1 rounded-lg w-fit">
                {hasValidCoords ? (
                  <>
                    Lat: <strong className="text-slate-900">{rawLat.toFixed(5)}</strong> · Long:{" "}
                    <strong className="text-slate-900">{rawLng.toFixed(5)}</strong>
                  </>
                ) : (
                  <span className="text-slate-500">Koordinat titik proyek belum terpetakan di PostGIS</span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Datum Geodetik WGS 84 terintegrasi pada basis data spasial Pemerintah Kabupaten Luwu.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 font-sans mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Meja Layanan Investasi &amp; Kontak Resmi</span>
              </h4>
              <p className="text-slate-800">
                <strong className="text-slate-900">{picName}</strong> · Kompleks Perkantoran Pemkab Luwu, Belopa
              </p>
              <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
                Hotline: {picPhone} · Pos-el: dpmptsp@luwukab.go.id
              </p>
            </div>
          </div>

          {/* FOOTER VERIFIKASI RESMI */}
          <div className="pt-3 border-t border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">
                Diterbitkan resmi melalui Sistem Informasi Geospasial Pelayanan Investasi DPMPTSP Kabupaten Luwu.
              </span>
            </div>
            <span className="font-mono font-bold text-slate-700 shrink-0">
              Sumber Data: Supabase PostGIS Kab. Luwu
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


