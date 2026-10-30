import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  X,
  Search,
  MapPin,
  Building2,
  ChevronRight,
  ShieldCheck,
  Compass,
  Sparkles,
  Layers
} from 'lucide-react';
import { District, Village, Investment } from '../../types';

interface DistrictsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  districts?: District[];
  villages?: Village[];
  investments?: Investment[];
  onSelectDistrict?: (districtId: string) => void;
  formatRupiah?: (val: number) => string;
}

export const DistrictsDirectoryModal: React.FC<DistrictsDirectoryModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  districts = [],
  villages = [],
  investments = [],
  onSelectDistrict,
  formatRupiah = (val) => `Rp ${val.toLocaleString('id-ID')}`,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'with_investments'>('all');

  // Relate districts with investments count and villages
  const enrichedDistricts = useMemo(() => {
    return districts.map((district) => {
      const distName = (district.name || '').toLowerCase().trim();
      const distId = String(district.id || '').trim().toLowerCase();
      const cleanDistName = distName.replace(/^(kecamatan|kec\.)\s*/i, '').trim();

      const relatedInvestments = investments.filter((inv) => {
        if (!inv) return false;
        const invTitle = String(inv.name || (inv as any).title || '').toLowerCase();
        // Doktrin Zero Dummy: abaikan data dummy/blacklist Pammanu Car Wash
        if (invTitle.includes('pammanu car wash') || invTitle.includes('dummy')) {
          return false;
        }

        const invDistId = String(
          inv.districtId ||
          (inv as any).district_id ||
          (inv as any).id_kecamatan ||
          ''
        ).trim().toLowerCase();

        if (invDistId && distId) {
          if (invDistId === distId) return true;
          if (invDistId.replace(/^dist_/, '') === distId.replace(/^dist_/, '')) return true;
        }

        const invKec = String(
          (inv as any).kecamatan ||
          (inv as any).districtName ||
          ''
        ).toLowerCase().trim();

        if (invKec && cleanDistName) {
          const cleanInvKec = invKec.replace(/^(kecamatan|kec\.)\s*/i, '').trim();
          if (cleanInvKec && (cleanInvKec === cleanDistName || cleanInvKec === distName)) {
            return true;
          }
        }

        return false;
      });

      const relatedVillages = villages.filter((v) => {
        if (!v) return false;
        const vDistId = String(v.districtId || v.district_id || (v as any).id_kecamatan || '').trim().toLowerCase();
        if (vDistId && distId) {
          if (vDistId === distId) return true;
          if (vDistId.replace(/^dist_/, '') === distId.replace(/^dist_/, '')) return true;
        }
        const vDistName = String(v.districtName || v.kecamatan || '').toLowerCase().trim();
        if (vDistName && cleanDistName) {
          const cleanVDist = vDistName.replace(/^(kecamatan|kec\.)\s*/i, '').trim();
          if (cleanVDist && (cleanVDist === cleanDistName || cleanVDist === distName)) return true;
        }
        return false;
      });

      return {
        ...district,
        projectCount: relatedInvestments.length,
        projects: relatedInvestments,
        calculatedVillageCount: relatedVillages.length > 0 ? relatedVillages.length : (district.villageCount || 0),
      };
    });
  }, [districts, investments, villages]);

  const filteredDistricts = useMemo(() => {
    return enrichedDistricts.filter((dist) => {
      const matchSearch =
        dist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dist.description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedFilter === 'with_investments') {
        return matchSearch && dist.projectCount > 0;
      }
      return matchSearch;
    });
  }, [enrichedDistricts, searchQuery, selectedFilter]);

  const totalProjects = useMemo(() => {
    return enrichedDistricts.reduce((sum, d) => sum + d.projectCount, 0);
  }, [enrichedDistricts]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-md transition-opacity font-sans"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={`w-[calc(100vw-20px)] sm:w-full h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[90vh] max-w-5xl rounded-2xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-black/80'
              : 'bg-[#FAF8F3] border-[#E5DFD3] text-slate-900 shadow-slate-900/10'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div
            className={`p-3 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
              isDark
                ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-slate-800'
                : 'bg-gradient-to-r from-emerald-50/90 via-[#FAF8F3] to-teal-50/50 border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 shrink-0">
                <Globe size={22} className="sm:w-6 sm:h-6 drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Batas Administrasi Wilayah Luwu
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg font-black tracking-tight truncate leading-tight">
                  Direktori & Profil Geospasial 22 Kecamatan Luwu
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
              title="Tutup Modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Metrics Bar & Search Box */}
          <div className="p-2.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kecamatan (contoh: Belopa, Bua, Larompong)..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Semua ({enrichedDistricts.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('with_investments')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === 'with_investments'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Ada Proyek ({enrichedDistricts.filter((d) => d.projectCount > 0).length})
              </button>
            </div>
          </div>

          {/* District Grid Content */}
          <div className="p-2.5 sm:p-5 overflow-y-auto flex-1 scrollbar-thin">
            {filteredDistricts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Globe className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Kecamatan tidak ditemukan
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Coba kata kunci lain atau pilih filter &quot;Semua&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredDistricts.map((district) => (
                  <div
                    key={district.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between hover:border-emerald-500/60 ${
                      isDark
                        ? 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800/90'
                        : 'bg-slate-50/90 border-slate-200/90 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Name & Project Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm sm:text-base tracking-tight truncate leading-snug">
                            {district.name}
                          </h4>
                          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                            ID: {district.id}
                          </span>
                        </div>
                        {district.projectCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap shrink-0">
                            {district.projectCount} Proyek IPRO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/50 border border-transparent whitespace-nowrap shrink-0">
                            Belum Ada Proyek
                          </span>
                        )}
                      </div>

                      {/* District Metrics */}
                      <div className="grid grid-cols-2 gap-2 my-2.5 text-[11px]">
                        <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-slate-500 block text-[9.5px]">Desa / Kelurahan</span>
                          <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {district.calculatedVillageCount || district.villageCount || '10+'} Desa
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-slate-500 block text-[9.5px]">Luas Wilayah</span>
                          <span className="font-bold font-mono">
                            {district.areaHa ? `${district.areaHa.toLocaleString('id-ID')} Ha` : 'Terpetakan'}
                          </span>
                        </div>
                      </div>

                      {/* Active Project Names (if any) */}
                      {district.projects && district.projects.length > 0 && (
                        <div className="mb-3 space-y-1">
                          <span className="text-[9.5px] uppercase font-bold tracking-wider text-slate-500 block">
                            Potensi Terverifikasi:
                          </span>
                          {district.projects.map((p) => (
                            <div
                              key={p.id}
                              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 truncate flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectDistrict) {
                          onSelectDistrict(district.id);
                        }
                        onClose();
                      }}
                      className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Compass size={14} />
                      <span>Eksplorasi di Peta Spasial</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div
            className={`p-2.5 sm:p-4 border-t flex items-center justify-between text-xs shrink-0 ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[11px]">
                Data batas administrasi & koordinat tersinkronisasi PostGIS Pemerintah Kabupaten Luwu
              </span>
            </div>
            <span className="font-mono font-bold hidden sm:inline text-[11px]">
              Total {enrichedDistricts.length} Kecamatan Terdata
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DistrictsDirectoryModal;
