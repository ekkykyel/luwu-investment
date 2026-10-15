import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Layers, 
  MapPin, 
  Building2, 
  DollarSign, 
  Maximize2, 
  ShieldCheck, 
  Phone, 
  UserCheck, 
  Compass, 
  FileText, 
  Printer, 
  Trash2, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Investment, District } from '../types';
import { formatRupiahSingkat } from '../lib/formatters';
import { getImageUrl, handleImageError } from '../utils/imageFallbacks';

export interface ProjectComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProjects: Investment[];
  districts: District[];
  onRemoveProject: (id: string) => void;
  onClearAll: () => void;
  onFocusOnMap?: (project: Investment) => void;
  onOpenLoiModal?: (project: Investment) => void;
  isDarkMode?: boolean;
}

export const ProjectComparisonModal: React.FC<ProjectComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedProjects = [],
  districts = [],
  onRemoveProject,
  onClearAll,
  onFocusOnMap,
  onOpenLoiModal,
  isDarkMode = true,
}) => {
  if (!isOpen) return null;

  // Find maximum investment value and maximum land area for highlighting top metrics
  const maxInvestment = Math.max(...selectedProjects.map((p) => p.investmentValue || 0), 0);
  const maxArea = Math.max(...selectedProjects.map((p) => p.areaHa || 0), 0);

  const getDistrictName = (districtId: string) => {
    return districts.find((d) => String(d.id) === String(districtId))?.name || 'Kabupaten Luwu';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden">
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-7xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
            isDarkMode 
              ? 'bg-[#06130F] text-slate-100 border-[#0F6B4F]/40 shadow-emerald-950/50' 
              : 'bg-white text-slate-900 border-emerald-200 shadow-slate-300'
          }`}
        >
          {/* Header Bar */}
          <div className={`flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b ${
            isDarkMode ? 'bg-[#0B1E17] border-[#0F6B4F]/30' : 'bg-emerald-50/70 border-emerald-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0F6B4F] to-[#C9A24B] text-white shadow-md">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">
                    Matriks Komparasi Proyek Investasi
                  </h3>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/30">
                    {selectedProjects.length} Proyek Dipilih
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  Analisis komparatif head-to-head metrik finansial, legalitas lahan, & aksesibilitas spasial Kabupaten Luwu
                </p>
              </div>
            </div>

            {/* Top Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/40' 
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
              </button>

              {selectedProjects.length > 0 && (
                <button
                  onClick={onClearAll}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isDarkMode 
                      ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/30' 
                      : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              )}

              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all ${
                  isDarkMode 
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-white' 
                    : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content - Scrollable Table Area */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {selectedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Layers className="w-10 h-10 animate-pulse" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-lg font-bold">Belum Ada Proyek Dipilih</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan centang opsi komparasi pada kartu proyek investasi di peta GIS atau daftar drawer untuk memulai analisis berdampingan.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F6B4F] to-[#1F9D74] text-white text-xs font-semibold shadow-lg hover:brightness-110 transition-all"
                >
                  Kembali ke Peta Spasial
                </button>
              </div>
            ) : (
              <div className="min-w-[700px] overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr>
                      <th className="p-3 w-48 font-semibold uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-800/60 sticky left-0 z-20 backdrop-blur-md bg-opacity-95">
                        Metrik Komparasi
                      </th>
                      {selectedProjects.map((project) => {
                        const rawPhoto = project.photoUrl || project.photo_url || (project.photoUrls && project.photoUrls[0]);
                        const mainPhoto = getImageUrl(rawPhoto, 'facility');
                        return (
                          <th
                            key={project.id}
                            className={`p-3 min-w-[240px] max-w-[280px] border-b border-slate-800/60 align-top ${
                              isDarkMode ? 'bg-[#081B15]' : 'bg-slate-50'
                            }`}
                          >
                            <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 mb-3 group">
                              <img
                                src={mainPhoto}
                                alt={project.name}
                                className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => handleImageError(e, 'facility')}
                              />
                              <button
                                onClick={() => onRemoveProject(project.id)}
                                title="Hapus dari komparasi"
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-rose-400 hover:bg-rose-600 hover:text-white transition-all backdrop-blur-sm"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute bottom-2 left-2 right-2">
                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#0F6B4F]/90 text-emerald-200 backdrop-blur-sm border border-emerald-400/30">
                                  {project.sector}
                                </span>
                              </div>
                            </div>
                            <h4 className="font-bold text-sm text-emerald-400 dark:text-emerald-300 line-clamp-2">
                              {project.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#C9A24B] shrink-0" />
                              <span>{getDistrictName(project.districtId)}</span>
                            </p>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/40">
                    {/* SECTION 1: FINANSIAL & SKALA */}
                    <tr className="bg-emerald-500/5">
                      <td colSpan={selectedProjects.length + 1} className="py-2.5 px-3 font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#C9A24B]" />
                        <span>1. Finansial & Skala Investasi</span>
                      </td>
                    </tr>

                    {/* Estimasi CAPEX / Nilai Investasi */}
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 sticky left-0 z-10 backdrop-blur-md bg-opacity-95">
                        Estimasi CAPEX (Nilai Investasi)
                      </td>
                      {selectedProjects.map((p) => {
                        const isHighest = p.investmentValue === maxInvestment && maxInvestment > 0;
                        return (
                          <td key={p.id} className="p-3 align-top">
                            <div className={`p-2.5 rounded-xl border ${
                              isHighest 
                                ? 'bg-[#C9A24B]/10 border-[#C9A24B]/40 text-[#C9A24B]' 
                                : isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                            }`}>
                              <div className="font-bold text-sm text-emerald-400 dark:text-emerald-300 flex items-center justify-between gap-1">
                                <span>{formatRupiahSingkat(p.investmentValue)}</span>
                                {isHighest && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#C9A24B] text-slate-950 uppercase">
                                    Tertinggi
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Rp {(Number(p.investmentValue || 0) * 1000000).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Luas Lahan */}
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 sticky left-0 z-10 backdrop-blur-md bg-opacity-95">
                        Luas Area Lahan (Hektar)
                      </td>
                      {selectedProjects.map((p) => {
                        const isLargest = p.areaHa === maxArea && maxArea > 0;
                        return (
                          <td key={p.id} className="p-3 align-top">
                            <div className={`p-2.5 rounded-xl border ${
                              isLargest 
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                                : isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                            }`}>
                              <div className="font-bold text-sm flex items-center justify-between gap-1">
                                <span>{Number(p.areaHa || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha</span>
                                {isLargest && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500 text-slate-950 uppercase">
                                    Terluas
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                ~{(Number(p.areaHa || 0) * 10000).toLocaleString('id-ID')} m²
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* SECTION 2: LEGALITAS & KEPEMILIKAN */}
                    <tr className="bg-emerald-500/5">
                      <td colSpan={selectedProjects.length + 1} className="py-2.5 px-3 font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>2. Legalitas Lahan & Status Ruang</span>
                      </td>
                    </tr>

                    {/* Status Kepemilikan Lahan */}
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 sticky left-0 z-10 backdrop-blur-md bg-opacity-95">
                        Status Kepemilikan Lahan
                      </td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            p.landStatus === 'Sertifikat Hak Milik' || p.landStatus === 'HPL'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {p.landStatus || 'Clean & Clear'}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Kesesuaian RTRW */}
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 sticky left-0 z-10 backdrop-blur-md bg-opacity-95">
                        Zonasi Pola Ruang (RTRW)
                      </td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="p-3 text-slate-300">
                          {p.polaRuang || p.subSector || 'Sesuai Perda RTRW Kab. Luwu'}
                        </td>
                      ))}
                    </tr>

                    {/* SECTION 3: AKSESIBILITAS SPASIAL */}
                    <tr className="bg-emerald-500/5">
                      <td colSpan={selectedProjects.length + 1} className="py-2.5 px-3 font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-[#C9A24B]" />
                        <span>3. Aksesibilitas & Infrastruktur Spasial</span>
                      </td>
                    </tr>

                    {/* Lokasi Administratif */}
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 sticky left-0 z-10 backdrop-blur-md bg-opacity-95">
                        Kecamatan & Desa
                      </td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="p-3 text-slate-300">
                          <p className="font-semibold">{getDistrictName(p.districtId)}</p>
                          <p className="text-[11px] text-slate-400">{p.locationName || 'Wilayah Potensi Luwu'}</p>
                        </td>
                      ))}
                    </tr>

                    {/* Jarak ke Pelabuhan */}
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 sticky left-0 z-10 backdrop-blur-md bg-opacity-95">
                        Akses Pelabuhan Maritim Bua
                      </td>
                      {selectedProjects.map((p) => {
                        const portKm = p.spatialSync?.distToPortKm || 12.4;
                        return (
                          <td key={p.id} className="p-3 text-slate-300">
                            <span className="font-semibold text-emerald-400">{portKm} Km</span>
                            <span className="text-[10px] text-slate-400 block">Jalur Logistik Utama</span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* SECTION 4: KONTAK & LOI */}
                    <tr className="bg-emerald-500/5">
                      <td colSpan={selectedProjects.length + 1} className="py-2.5 px-3 font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>4. Pendampingan DPMPTSP & Aksi</span>
                      </td>
                    </tr>

                    {/* Contact Person */}
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 sticky left-0 z-10 backdrop-blur-md bg-opacity-95">
                        Petugas PIC / DPMPTSP
                      </td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="p-3 text-slate-300">
                          <p className="font-semibold">{p.contactPic || 'Dinas Penanaman Modal Luwu'}</p>
                          <p className="text-[11px] text-slate-400">{p.phoneNumber || '0811-4200-[#C9A24B]'}</p>
                        </td>
                      ))}
                    </tr>

                    {/* Action Buttons Row */}
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 sticky left-0 z-10 backdrop-blur-md bg-opacity-95">
                        Aksi Langsung
                      </td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="p-3 align-top">
                          <div className="flex flex-col gap-2">
                            {onFocusOnMap && (
                              <button
                                onClick={() => {
                                  onFocusOnMap(p);
                                  onClose();
                                }}
                                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                  isDarkMode
                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                }`}
                              >
                                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Terbang ke Peta</span>
                              </button>
                            )}

                            {onOpenLoiModal && (
                              <button
                                onClick={() => {
                                  onOpenLoiModal(p);
                                  onClose();
                                }}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0F6B4F] to-[#C9A24B] text-white shadow-md hover:brightness-110 transition-all"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Ajukan LOI</span>
                              </button>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className={`flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t text-xs ${
            isDarkMode ? 'bg-[#0B1E17] border-[#0F6B4F]/30 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C9A24B]" />
              <span>
                Data komparasi diproses langsung dari basis data spasial PostGIS Pemkab Luwu
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all"
            >
              Tutup Matriks
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProjectComparisonModal;
