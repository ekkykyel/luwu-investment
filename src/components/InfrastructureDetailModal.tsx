import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Sparkles,
  Building,
  Plane,
  Anchor,
  Compass,
  FileText,
  Copy,
  Check,
  Edit3
} from 'lucide-react';
import { InfrastructureItem, getInfrastructureIcon } from '../data/infrastructureData';

export interface InfrastructureDetailModalProps {
  isOpen: boolean;
  facility: InfrastructureItem | null;
  onClose: () => void;
  onViewOnMap?: (facility: InfrastructureItem) => void;
  onEdit?: (facility: InfrastructureItem) => void;
  canEdit?: boolean;
  isDark?: boolean;
}

export const InfrastructureDetailModal: React.FC<InfrastructureDetailModalProps> = ({
  isOpen,
  facility,
  onClose,
  onViewOnMap,
  onEdit,
  canEdit = false,
  isDark = true
}) => {
  const [copiedCoords, setCopiedCoords] = React.useState(false);

  if (!isOpen || !facility) return null;

  const IconComp = getInfrastructureIcon(facility.type);

  const handleCopyCoords = () => {
    const text = `${facility.latitude.toFixed(6)}, ${facility.longitude.toFixed(6)}`;
    navigator.clipboard?.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleViewMap = () => {
    if (onViewOnMap) {
      onViewOnMap(facility);
    } else {
      // Default navigation to map workspace
      window.location.href = `/spatial-map?lat=${facility.latitude}&lng=${facility.longitude}&zoom=15&target=${encodeURIComponent(facility.name)}`;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-[calc(100vw-20px)] sm:w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border transition-all ${
            isDark 
              ? 'bg-slate-900 text-white border-slate-700/80 shadow-black/80' 
              : 'bg-[#F4F0E6] text-slate-900 border-[#E2DACB] shadow-2xl'
          }`}
        >
          {/* HEADER */}
          <div className={`p-3.5 sm:p-5 flex items-center justify-between border-b shrink-0 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-[#FAF7F0] border-[#E2DACB]'
          }`}>
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                facility.type === 'airport' 
                  ? isDark ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 'bg-[#F4F0E6] text-amber-700 border border-[#E2DACB]'
                  : facility.type === 'port'
                  ? isDark ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30' : 'bg-[#F4F0E6] text-teal-700 border border-[#E2DACB]'
                  : facility.type === 'mpp'
                  ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#F4F0E6] text-emerald-700 border border-[#E2DACB]'
                  : isDark ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-[#F4F0E6] text-indigo-700 border border-[#E2DACB]'
              }`}>
                <IconComp size={22} className="shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                    facility.status === 'Beroperasi Aktif' || facility.status === 'Published'
                      ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#F4F0E6] text-emerald-800 border-[#E2DACB]'
                      : isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-[#F4F0E6] text-amber-800 border-[#E2DACB]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      facility.status === 'Beroperasi Aktif' || facility.status === 'Published' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`} />
                    {facility.status}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-[#F4F0E6] text-slate-700 border-[#E2DACB]'
                  }`}>
                    {facility.tag}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-extrabold tracking-tight truncate mt-1">
                  {facility.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(facility)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                      : 'bg-[#F4F0E6] hover:bg-[#ECE5D6] text-emerald-700 border-[#E2DACB]'
                  }`}
                  title="Edit Data Infrastruktur"
                >
                  <Edit3 size={15} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl border transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700' 
                    : 'bg-[#F4F0E6] hover:bg-[#ECE5D6] text-slate-700 hover:text-slate-900 border-[#E2DACB]'
                }`}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
            {/* PHOTO HERO SECTION */}
            <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden shadow-lg border border-white/10 group">
              <img
                src={facility.imageUrl}
                alt={facility.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 right-3 sm:right-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold mb-1">
                    <MapPin size={13} className="shrink-0" />
                    <span className="truncate">{facility.location}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-snug drop-shadow-md">
                    {facility.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-[10px] font-mono text-white border border-white/20 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  title="Salin Koordinat Spasial"
                >
                  {copiedCoords ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span className="hidden sm:inline">{facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}</span>
                  <span className="sm:hidden">{copiedCoords ? 'Tersalin' : 'GPS'}</span>
                </button>
              </div>
            </div>

            {/* OVERVIEW & DETAILED INFO */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border ${
              isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-[#FAF7F0] border-[#E2DACB]'
            }`}>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
                <FileText size={15} />
                <span>Deskripsi & Fungsi Strategis</span>
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {facility.detailedInfo || facility.desc}
              </p>
            </div>

            {/* TECHNICAL SPECIFICATIONS GRID */}
            {facility.specs && facility.specs.length > 0 && (
              <div>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                  <Compass size={15} />
                  <span>Spesifikasi & Kapasitas Teknis</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {facility.specs.map((spec, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between ${
                        isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-[#FAF7F0] border-[#E2DACB] shadow-2xs'
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-mono tracking-wider font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {spec.label}
                      </span>
                      <span className={`text-xs sm:text-sm font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STRATEGIC ADVANTAGES */}
            {facility.advantages && facility.advantages.length > 0 && (
              <div>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2 text-amber-700 dark:text-amber-500">
                  <Sparkles size={15} />
                  <span>Keunggulan & Manfaat bagi Investor</span>
                </h4>
                <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-[#FAF7F0] border-[#E2DACB]'
                }`}>
                  {facility.advantages.map((adv, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                        {adv}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONNECTIVITY & ACCESS */}
            {facility.connectivity && (
              <div className={`p-3 sm:p-4 rounded-xl border flex items-center gap-3 ${
                isDark ? 'bg-blue-950/20 border-blue-500/20 text-blue-300' : 'bg-[#FAF7F0] border-[#E2DACB] text-slate-800'
              }`}>
                <Navigation size={18} className="text-blue-600 dark:text-blue-500 shrink-0" />
                <div className="text-xs sm:text-sm">
                  <span className="font-bold mr-1">Aksesibilitas Wilayah:</span>
                  <span>{facility.connectivity}</span>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className={`p-3 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#FAF7F0] border-[#E2DACB]'
          }`}>
            <div className={`text-[11px] font-mono text-center sm:text-left ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>
              Basis Data Spasial Resmi Pemerintah Kabupaten Luwu
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-[#F4F0E6] hover:bg-[#ECE5D6] text-slate-700 border-[#E2DACB]'
                }`}
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleViewMap}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <MapPin size={14} className="animate-pulse" />
                <span>Lihat di Peta Spasial</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default InfrastructureDetailModal;
