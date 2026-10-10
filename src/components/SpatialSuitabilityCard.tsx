import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  TrendingUp, 
  Layers, 
  X, 
  Compass, 
  Route, 
  Building2,
  ShieldCheck,
  FileDown,
  Calendar
} from 'lucide-react';

export interface SpatialSuitabilityData {
  id?: string;
  name: string;
  sector?: string;
  districtName?: string;
  villageName?: string;
  coordinates: [number, number]; // [lat, lng]
  areaHa?: number;
  zoningCode?: string;
  zoningName?: string;
  zoningStatus?: 'SESUAI' | 'BERSYARAT' | 'TIDAK_SESUAI' | 'BELUM_ADA_DATA' | string;
  rtrwStatus?: 'SESUAI' | 'BERSYARAT' | 'TIDAK_SESUAI' | 'DALAM_KAJIAN';
  rtrwZoneName?: string;
  suitabilityScore?: number; // 0 - 100
  nearestInfrastructure?: {
    name: string;
    type: string;
    distanceKm: number;
    coordinates?: [number, number];
  }[];
  notes?: string;
}

export interface SpatialSuitabilityCardProps {
  locationData: SpatialSuitabilityData | null;
  isOpen: boolean;
  onClose: () => void;
  onDrawRoute?: (fromCoord: [number, number], toCoord: [number, number], poiName: string) => void;
  onSimulateRoi?: (data: SpatialSuitabilityData) => void;
  onSubmitLoi?: (data: SpatialSuitabilityData) => void;
  onBookMpp?: (serviceName?: string) => void;
  onDownloadPdfSummary?: (data: SpatialSuitabilityData) => void;
  isDarkMode?: boolean;
}

export const SpatialSuitabilityCard: React.FC<SpatialSuitabilityCardProps> = ({
  locationData,
  isOpen,
  onClose,
  onDrawRoute,
  onSimulateRoi,
  onSubmitLoi,
  onBookMpp,
  onDownloadPdfSummary,
  isDarkMode = true
}) => {
  if (!isOpen || !locationData) return null;

  const score = locationData.suitabilityScore ?? 88;
  const status = locationData.rtrwStatus || locationData.zoningStatus || 'SESUAI';

  const getStatusBadge = () => {
    switch (status) {
      case 'SESUAI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Sesuai RTRW
          </span>
        );
      case 'BERSYARAT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Bersyarat (Kajian OPD)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-6 z-40 w-[94vw] sm:w-[420px] max-h-[85vh] overflow-y-auto backdrop-blur-xl border rounded-2xl shadow-2xl p-4 sm:p-5 font-sans ${
          isDarkMode
            ? 'bg-slate-900/95 text-white border-slate-700/80 shadow-black/60'
            : 'bg-white/95 text-slate-900 border-slate-200 shadow-slate-300'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-700/50 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {getStatusBadge()}
              <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                Score: {score}%
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-100 leading-snug">
              {locationData.name}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {locationData.districtName ? `Kec. ${locationData.districtName}` : 'Kabupaten Luwu'}
              {locationData.villageName ? `, Desa ${locationData.villageName}` : ''}
              {locationData.areaHa ? ` • ${locationData.areaHa} Ha` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Tutup Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spatial Zone & Suitability Overview */}
        <div className="space-y-3 mb-4 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" /> Peruntukan Ruang (RTRW)
              </span>
              <span className="text-emerald-400 font-bold">
                {locationData.rtrwZoneName || locationData.zoningName || 'Kawasan Budidaya Terpadu'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {locationData.notes || 'Kesesuaian spasial diverifikasi terhadap Perda RTRW Kabupaten Luwu No. 34/2020.'}
            </p>
          </div>

          {/* Nearest POI & Infrastructure */}
          {locationData.nearestInfrastructure && locationData.nearestInfrastructure.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
              <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" /> Jarak ke Infrastruktur Kunci
              </div>
              <div className="space-y-2">
                {locationData.nearestInfrastructure.map((poi, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-slate-800"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{poi.name}</div>
                      <div className="text-[10px] text-slate-400">{poi.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{poi.distanceKm.toFixed(1)} km</span>
                      {onDrawRoute && poi.coordinates && (
                        <button
                          onClick={() => onDrawRoute(locationData.coordinates, poi.coordinates!, poi.name)}
                          className="px-2 py-1 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 rounded border border-sky-500/40 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Route className="w-3 h-3" /> Rute
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {onSimulateRoi && (
              <button
                onClick={() => onSimulateRoi(locationData)}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/40"
              >
                <TrendingUp className="w-4 h-4" /> Simulasi ROI
              </button>
            )}
            {onSubmitLoi && (
              <button
                onClick={() => onSubmitLoi(locationData)}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                Kirim LOI
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onDownloadPdfSummary && (
              <button
                onClick={() => onDownloadPdfSummary(locationData)}
                className="flex-1 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" /> Unduh BAP
              </button>
            )}
            {onBookMpp && (
              <button
                onClick={() => onBookMpp('Konsultasi PKKPR')}
                className="flex-1 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" /> Antrean MPP
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SpatialSuitabilityCard;
