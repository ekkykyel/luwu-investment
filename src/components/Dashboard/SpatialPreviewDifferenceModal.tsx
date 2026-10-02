import React, { useState, useMemo } from 'react';
import {
  X,
  Layers,
  CheckCircle2,
  Lock,
  Sparkles,
  Wheat,
  ShieldAlert,
  ArrowRight,
  MapPin,
  FileCheck2,
  AlertTriangle,
  Compass,
  Check
} from 'lucide-react';
import { extractCoordsFromGeometry, getEffectiveMapImageUrl } from '../../utils/luwuGisMapGenerator';
import MapComponent from '../MaplibreComponent';

export interface SpatialPreviewDifferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: {
    id: string;
    nibNik: string;
    applicantName: string;
    companyName: string;
    districtName: string;
    villageName: string;
    areaHa: number;
    existingCrop?: string;
    puptrForwardedNotes?: string;
    geometry?: any;
  } | null;
  diffMetrics: {
    success: boolean;
    cleanGeometry: any;
    cutAreaM2: number;
    originalAreaM2: number;
    remainingAreaM2: number;
    intersectedLayersCount: number;
    is100PercentCut?: boolean;
    layerBreakdown?: {
      lp2bCutM2: number;
      mangroveCutM2: number;
      lahanBasahCutM2: number;
      tambakCutM2: number;
    };
  };
  districts: any[];
  villages: any[];
  spatialLayers: any[];
  isSpatialValidated: boolean;
  setIsSpatialValidated: (val: boolean) => void;
  onProceedToSmartForm: () => void;
}

export const SpatialPreviewDifferenceModal: React.FC<SpatialPreviewDifferenceModalProps> = ({
  isOpen,
  onClose,
  app,
  diffMetrics,
  districts,
  villages,
  spatialLayers,
  isSpatialValidated,
  setIsSpatialValidated,
  onProceedToSmartForm
}) => {
  if (!isOpen || !app) return null;

  const originalAreaM2 = diffMetrics.originalAreaM2 || Math.round((app.areaHa || 0.5) * 10000);
  const cutAreaM2 = diffMetrics.cutAreaM2 || 0;
  const remainingAreaM2 = diffMetrics.remainingAreaM2 || originalAreaM2;

  const originalAreaHa = (originalAreaM2 / 10000).toFixed(4);
  const cutAreaHa = (cutAreaM2 / 10000).toFixed(4);
  const remainingAreaHa = (remainingAreaM2 / 10000).toFixed(4);

  // Construct investment item with dual-layer preview geometry for MapComponent
  const previewInvestment = useMemo(() => {
    return {
      id: `PREVIEW_${app.id}`,
      title: app.companyName,
      company_name: app.companyName,
      applicant_name: app.applicantName,
      nib: app.nibNik,
      sector: 'LP2B_EVALUATION',
      status: 'Review',
      latitude: -2.978,
      longitude: 120.306,
      geometry: diffMetrics.cleanGeometry || app.geometry,
      geometry_json: diffMetrics.cleanGeometry || app.geometry,
      district_id: app.districtName,
      village_id: app.villageName,
      investment_value: 0,
      area_size: Number(remainingAreaHa)
    };
  }, [app, diffMetrics, remainingAreaHa]);

  // Generate vector SVG snapshot URL for vector fallback
  const mapSvgUrl = useMemo(() => {
    return getEffectiveMapImageUrl(null, null, {
      desa: app.villageName,
      kecamatan: app.districtName,
      pemohon: app.applicantName,
      perusahaan: app.companyName,
      luas: `${remainingAreaHa} Ha (${remainingAreaM2.toLocaleString('id-ID')} m²)`,
      tipeDoc: 'LP2B',
      nomorSurat: `PREVIEW-SPASIAL-PERTANIAN-#${app.id.slice(0, 6)}`,
      geometry: diffMetrics.cleanGeometry || app.geometry
    });
  }, [app, diffMetrics, remainingAreaHa, remainingAreaM2]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border-b border-emerald-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono">
                  TURF.JS SPATIAL DIFFERENCE ENGINE
                </span>
                <span className="text-xs font-mono text-slate-400">NIB: {app.nibNik}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Evaluasi Spasial Pemotongan Geometri Lahan (Before - After)
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Screen (Left: Multi-Layer Map, Right: Calculation Panel) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Multi-Layer Visual Comparison Canvas (8 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-500" />
                <span>Peta Komparasi Multi-Layer (Overlay Difference)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {diffMetrics.intersectedLayersCount > 0
                  ? `⚡ Interseksi: ${diffMetrics.intersectedLayersCount} Lapisan Terdeteksi`
                  : '✓ Lahan Bersih Tanpa Irisan LP2B'}
              </span>
            </div>

            {/* Interactive Map Component Container */}
            <div className="relative w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-800 bg-slate-950 shadow-inner">
              <MapComponent
                key={`preview_map_${app.id}`}
                districts={districts}
                villages={villages}
                investments={previewInvestment ? [previewInvestment as any] : []}
                spatialLayers={spatialLayers}
                onToggleLayerVis={() => {}}
                onChangeLayerOpacity={() => {}}
                infrastructure={[]}
                selectedDistrictId={null}
                setSelectedDistrictId={() => {}}
                selectedVillageId={null}
                setSelectedVillageId={() => {}}
                selectedInvestmentId={previewInvestment.id}
                setSelectedInvestmentId={() => {}}
                heatmapMetric="none"
                choroplethMetric="none"
                isDigitizing={false}
                digitizedPoints={[]}
                setDigitizedPoints={() => {}}
                mapMode="satellite"
              />

              {/* Vector Static Overlay Fallback Badge in Corner */}
              <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-xl z-10 hidden sm:block max-w-[140px]">
                <img
                  src={mapSvgUrl}
                  alt="Snapshot Vektor"
                  className="w-full h-16 object-contain rounded-lg bg-slate-950 border border-slate-800"
                />
                <span className="text-[9px] text-emerald-400 font-mono block text-center mt-1">
                  Vektor Kartografi
                </span>
              </div>

              {/* Stacked Legend Overlay on Bottom Left of Map */}
              <div className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 shadow-2xl z-10 space-y-1.5 font-sans text-[11px] text-white">
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-400 block border-b border-slate-800 pb-1">
                  LEGENDA PREVIEW GEOMETRI:
                </span>
                
                {/* Layer 1: Before / Original */}
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border-2 border-dashed border-amber-400 bg-amber-500/20 shrink-0"></span>
                  <span><strong>1. Poligon Asli Pemohon</strong> ({originalAreaHa} Ha)</span>
                </div>

                {/* Layer 2: LP2B Conflict Zone */}
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border border-emerald-500 bg-emerald-600/40 shrink-0"></span>
                  <span><strong>2. Zona Sawah LP2B (Terpotong)</strong> (-{cutAreaHa} Ha)</span>
                </div>

                {/* Layer 3: Clean Residual Area (Approved) */}
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border-2 border-sky-400 bg-sky-500/60 shrink-0"></span>
                  <span className="text-sky-300 font-extrabold"><strong>3. Poligon Sisa Bersih (Disetujui)</strong> ({remainingAreaHa} Ha)</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              ℹ️ Poligon biru merepresentasikan luas efektif sisa lahan bersih setelah memotong area LP2B/Sawah Irigasi Aktif sesuai UU 41/2009.
            </p>
          </div>

          {/* Right Panel: Calculation Panel & Confirmation Safety Lock (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>PEMOHON:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{app.applicantName}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>PERUSAHAAN:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{app.companyName}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>LOKASI:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Kec. {app.districtName}, Desa {app.villageName}</span>
                </div>
              </div>

              {/* 100% Cut Warning Banner */}
              {(diffMetrics.is100PercentCut || remainingAreaM2 <= 0) && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500 rounded-2xl flex items-start gap-3 shadow-md animate-pulse">
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-rose-700 dark:text-rose-300 tracking-wide">
                      LAHAN TERPOTONG 100% OLEH KAWASAN RESTRIKSI
                    </h4>
                    <p className="text-[11px] text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                      Seluruh delineasi lokasi usaha berada di dalam kawasan dilindungi (LP2B / Mangrove / Lahan Basah / Tambak). Persetujuan alih fungsi dilarang. Silakan pilih opsi <strong>Minta Revisi</strong> atau <strong>Tolak</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* 3 Real-time Metrics Cards */}
              <div className="space-y-2.5 font-sans">
                {/* Metric 1: Original Area */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 tracking-wider block">
                      1. Luas Asli Pemohon (Awal)
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Batas awal sebelum alih fungsi
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-amber-700 dark:text-amber-300 font-mono block">
                      {originalAreaHa} Ha
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {originalAreaM2.toLocaleString('id-ID')} m²
                    </span>
                  </div>
                </div>

                {/* Metric 2: Cut Area */}
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-300 tracking-wider block">
                      2. Luas Terpotong LP2B / Sawah
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Kawasan dilindungi UU 41/2009
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-rose-700 dark:text-rose-300 font-mono block">
                      -{cutAreaHa} Ha
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      -{cutAreaM2.toLocaleString('id-ID')} m²
                    </span>
                  </div>
                </div>

                {/* Metric 3: Clean Residual Area (Final) */}
                <div className="p-4 bg-emerald-500/15 border-2 border-emerald-500 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider block">
                      3. Luas Sisa Bersih (Disetujui)
                    </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      Hasil akhir untuk dokumen BAP
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-300 font-mono block">
                      {remainingAreaHa} Ha
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {remainingAreaM2.toLocaleString('id-ID')} m²
                    </span>
                  </div>
                </div>
              </div>

              {/* Safety Lock Checkbox */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500/80 rounded-2xl space-y-2.5 font-sans shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpatialValidated}
                    onChange={(e) => setIsSpatialValidated(e.target.checked)}
                    className="mt-1 w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-wide block">
                      KONFIRMASI VALIDASI GEOMETRI ALIH FUNGSI LAHAN
                    </span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                      Saya telah memvalidasi batas alih fungsi lahan dan menyetujui geometri baru.
                    </p>
                  </div>
                </label>

                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Status Interlock:</span>
                  {isSpatialValidated ? (
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> VERIFIKASI SAH
                    </span>
                  ) : (
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> TERKUNCI (BUTUH CENTANG)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal / Tutup
              </button>

              <button
                type="button"
                disabled={!isSpatialValidated || diffMetrics.is100PercentCut || remainingAreaM2 <= 0}
                onClick={() => {
                  onProceedToSmartForm();
                  onClose();
                }}
                className={`px-5 py-2.5 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isSpatialValidated && !diffMetrics.is100PercentCut && remainingAreaM2 > 0
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Lanjutkan ke Smart Form LP2B &amp; Terbitkan BAP 🚀</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
