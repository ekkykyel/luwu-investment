import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Building2,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AgencyLogo } from '../common/AgencyLogo';

function checkMppOperatingHours(): boolean {
  try {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wita = new Date(utc + (3600000 * 8)); // WITA UTC+8
    const day = wita.getDay(); // 0 Sun, 1 Mon, 5 Fri, 6 Sat
    const hours = wita.getHours();
    const minutes = wita.getMinutes();
    const timeNum = hours + (minutes / 60);

    // Senin - Kamis: 07:30 - 16:00 WITA
    if (day >= 1 && day <= 4) {
      return timeNum >= 7.5 && timeNum < 16.0;
    }
    // Jumat: 07:30 - 16:30 WITA
    if (day === 5) {
      return timeNum >= 7.5 && timeNum < 16.5;
    }
    return false;
  } catch (e) {
    return true;
  }
}

interface MppAgenciesCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencies: any[];
  onSelectAgency: (agency: any) => void;
  isDark?: boolean;
}

export const MppAgenciesCatalogModal: React.FC<MppAgenciesCatalogModalProps> = ({
  isOpen,
  onClose,
  agencies = [],
  onSelectAgency,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true);
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    if (selectedCategory && tabButtonRefs.current[selectedCategory]) {
      tabButtonRefs.current[selectedCategory]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedCategory]);

  const isMppOpenNow = checkMppOperatingHours();

  // Categorize agencies automatically with robust categoryId assignment
  const categorizedAgencies = useMemo(() => {
    return (agencies || []).map((ag) => {
      const catLower = String(ag.kategori || ag.kategori_en || ag.kategori_zh || '').toLowerCase();
      const nameLower = String(ag.nama || '').toLowerCase();

      let mainCategory = 'opd';

      if (
        catLower.includes('bumn') || catLower.includes('bumd') || catLower.includes('bank') || catLower.includes('perbankan') ||
        nameLower.includes('bank') || nameLower.includes('bpjs') || nameLower.includes('pdam') || nameLower.includes('taspen') || nameLower.includes('pos')
      ) {
        mainCategory = 'bumn';
      } else if (
        catLower.includes('kementerian') || catLower.includes('lembaga') || catLower.includes('vertikal') ||
        nameLower.includes('bpn') || nameLower.includes('kpp') || nameLower.includes('kemenag') || nameLower.includes('imigrasi') || nameLower.includes('atr')
      ) {
        mainCategory = 'vertikal';
      } else if (
        catLower.includes('kepolisian') || catLower.includes('hukum') || catLower.includes('polisi') ||
        nameLower.includes('polres') || nameLower.includes('samsat') || nameLower.includes('kejaksaan') || nameLower.includes('pengadilan')
      ) {
        mainCategory = 'hukum';
      } else {
        mainCategory = 'opd';
      }

      let displayCategory = ag.kategori;
      if (mainCategory === 'opd') {
        displayCategory = isEn ? 'Regional (OPD)' : isZh ? '政府职能局 (OPD)' : 'OPD Pemkab';
      } else if (mainCategory === 'vertikal') {
        displayCategory = isEn ? 'State Agencies' : isZh ? '部委与垂直机构' : 'Kementerian / Lembaga';
      } else if (mainCategory === 'bumn') {
        displayCategory = isEn ? 'SOE / Bank' : isZh ? '国企/银行' : 'BUMN / BUMD / Bank';
      } else if (mainCategory === 'hukum') {
        displayCategory = isEn ? 'Police & Law' : isZh ? '公安与司法' : 'Kepolisian & Hukum';
      }

      return {
        ...ag,
        categoryId: mainCategory,
        calculatedCategory: displayCategory,
      };
    });
  }, [agencies, isEn, isZh]);

  const categoriesList = useMemo(() => {
    const counts = {
      all: categorizedAgencies.length,
      opd: categorizedAgencies.filter(a => a.categoryId === 'opd').length,
      vertikal: categorizedAgencies.filter(a => a.categoryId === 'vertikal').length,
      bumn: categorizedAgencies.filter(a => a.categoryId === 'bumn').length,
      hukum: categorizedAgencies.filter(a => a.categoryId === 'hukum').length,
    };

    return [
      { id: 'all', label: isEn ? 'All Agencies' : isZh ? '全部机构' : 'Semua Instansi', count: counts.all },
      { id: 'opd', label: isEn ? 'Luwu OPD' : isZh ? 'OPD 县局' : 'OPD Pemkab', count: counts.opd },
      { id: 'vertikal', label: isEn ? 'Ministries' : isZh ? '部委与垂直' : 'Kementerian / Lembaga', count: counts.vertikal },
      { id: 'bumn', label: isEn ? 'SOE & Banks' : isZh ? '国企/银行' : 'BUMN / Bank', count: counts.bumn },
      { id: 'hukum', label: isEn ? 'Police & Law' : isZh ? '公安与司法' : 'Kepolisian & Hukum', count: counts.hukum },
    ];
  }, [categorizedAgencies, isEn, isZh]);

  const totalServicesCount = useMemo(() => {
    return (agencies || []).reduce((acc, a) => {
      if (Array.isArray(a.layananList) && a.layananList.length > 0) {
        return acc + a.layananList.length;
      }
      return acc + (a.layanan ? 1 : 1);
    }, 0);
  }, [agencies]);

  const filteredAgencies = useMemo(() => {
    return categorizedAgencies.filter((ag) => {
      if (selectedCategory !== 'all') {
        if (ag.categoryId !== selectedCategory) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = (ag.nama || '').toLowerCase().includes(q);
      const matchFullName = (ag.fullName || ag.namaResmi || '').toLowerCase().includes(q);
      const matchServices = (ag.layanan || '').toLowerCase().includes(q);
      const matchLoket = (ag.loket || '').toLowerCase().includes(q);
      const matchLayananList = Array.isArray(ag.layananList) && ag.layananList.some((s: string) => String(s).toLowerCase().includes(q));
      return matchName || matchFullName || matchServices || matchLoket || matchLayananList;
    });
  }, [categorizedAgencies, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className={`relative w-full max-w-4xl bg-[#FAF7F0] dark:bg-[#0F2942] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[88dvh] border ${
            isDark
              ? 'border-slate-800 text-white shadow-black/40'
              : 'border-[#E2DACB] text-slate-900 shadow-slate-300/30'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar — High-contrast title and clean layout */}
          <div className="relative py-3.5 sm:py-4 px-4 sm:px-6 border-b border-[#E2DACB] dark:border-white/10 shrink-0 bg-[#F4F0E6] dark:bg-[#0F2942]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {isEn ? 'Official Directory' : isZh ? '官方机构名录' : 'Direktori Resmi'}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {isEn ? 'MPP Simpurusiang Integrated' : isZh ? '辛普鲁西亚政务中心一体化' : 'Terintegrasi MPP Simpurusiang'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    {isEn ? 'Integrated Agencies & Public Service Booths' : isZh ? '已入驻部门机构与公共服务窗口' : 'Instansi & Layanan Publik Tergabung'}
                  </h2>
                </div>
              </div>

              {/* Close Button: Touch target >= 44px */}
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI Stat Bar (Requirement E: single line, short labels, big number inline with small unit, "Buka") */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#E2DACB] dark:border-white/10">
              {/* Instansi */}
              <div className="px-2.5 py-1.5 rounded-xl bg-[#F4F0E6] dark:bg-slate-800/90 border border-[#E2DACB] dark:border-slate-700/80 flex items-center justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                    {isEn ? 'Agencies' : isZh ? '机构' : 'Instansi'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none">{categorizedAgencies.length}</span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{isEn ? 'Gerai' : isZh ? '个' : 'Gerai'}</span>
                </div>
              </div>

              {/* Layanan */}
              <div className="px-2.5 py-1.5 rounded-xl bg-[#F4F0E6] dark:bg-slate-800/90 border border-[#E2DACB] dark:border-slate-700/80 flex items-center justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                    {isEn ? 'Services' : isZh ? '事项' : 'Layanan'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none">{totalServicesCount > 0 ? `${totalServicesCount}+` : '84+'}</span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{isEn ? 'Jenis' : isZh ? '项' : 'Jenis'}</span>
                </div>
              </div>

              {/* Status */}
              <div className="px-2.5 py-1.5 rounded-xl bg-[#F4F0E6] dark:bg-slate-800/90 border border-[#E2DACB] dark:border-slate-700/80 flex items-center justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                    {isEn ? 'Status' : isZh ? '状态' : 'Status'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <span className={`w-1.5 h-1.5 rounded-full ${isMppOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className={`text-xs sm:text-sm font-black ${isMppOpenNow ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {isMppOpenNow ? (isEn ? 'Open' : isZh ? '开放' : 'Buka') : (isEn ? 'Closed' : isZh ? '关闭' : 'Tutup')}
                  </span>
                </div>
              </div>
            </div>

            {/* Search Input (Short placeholder) */}
            <div className="relative mt-2.5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari instansi atau layanan"
                className="w-full pl-10 pr-10 py-2 rounded-xl bg-[#FAF7F0] dark:bg-slate-800 border border-[#E2DACB] dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                  aria-label="Hapus Pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Chips Bar: Edge fades + Auto-scroll */}
          <div className="relative border-b border-[#E2DACB] dark:border-white/10 shrink-0 bg-[#F4F0E6] dark:bg-slate-800/60">
            <div className="pointer-events-none absolute left-0 inset-y-0 w-6 bg-gradient-to-r from-slate-100 dark:from-slate-800 to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 inset-y-0 w-6 bg-gradient-to-l from-slate-100 dark:from-slate-800 to-transparent z-10" />
            
            <div ref={tabsContainerRef} className="px-4 sm:px-6 py-2 overflow-x-auto no-scrollbar scroll-smooth">
              <div className="flex items-center gap-2 min-w-max">
                {categoriesList.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      ref={(el) => { tabButtonRefs.current[cat.id] = el; }}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm font-black'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Main Content Area (Requirement E: body padding p-4 / 16px) */}
          <div className="p-4 overflow-y-auto space-y-3">
            {filteredAgencies.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {isEn ? `No agencies found for "${searchQuery}"` : `Tidak ditemukan instansi dengan kata kunci "${searchQuery}"`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredAgencies.map((agency, idx) => {
                  const isOpd = agency.categoryId === 'opd';
                  const isVertikal = agency.categoryId === 'vertikal';
                  const isBumn = agency.categoryId === 'bumn';

                  const badgeClass = isOpd
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                    : isVertikal
                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                    : isBumn
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';

                  const shortName = agency.namaSingkat || agency.short_name || agency.nama || 'Instansi MPP';

                  return (
                    <motion.div
                      key={agency.nama || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: Math.min(0.2, idx * 0.02) }}
                      className="p-3 rounded-2xl bg-[#F4F0E6] dark:bg-slate-800/60 border border-[#E2DACB] dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden"
                    >
                      <div>
                        {/* Card Header: Logo 56px + Category & Loket + Short Name */}
                        <div className="flex items-start gap-3 mb-2">
                          <AgencyLogo
                            name={shortName}
                            logo={agency.logo}
                            size="list"
                            rounded="xl"
                            className="shrink-0 group-hover:scale-105 transition-transform"
                          />

                          <div className="min-w-0 flex-1">
                            {/* Badges on own line with min-w-0 / truncate to prevent any overflow */}
                            <div className="flex items-center gap-1.5 flex-wrap mb-1 min-w-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeClass} truncate max-w-[150px]`}>
                                {agency.calculatedCategory}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                                <MapPin className="w-3 h-3 text-emerald-500" />
                                {agency.loket || 'Lantai 1'}
                              </span>
                            </div>

                            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {shortName}
                            </h3>
                          </div>
                        </div>

                        {/* Services Summary */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-2">
                          {agency.layanan}
                        </p>

                        {/* Service Chips Highlight */}
                        {Array.isArray(agency.layananList) && agency.layananList.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {agency.layananList.slice(0, 2).map((sItem: string, sIdx: number) => (
                              <span
                                key={sIdx}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 truncate max-w-[170px]"
                              >
                                {sItem}
                              </span>
                            ))}
                            {agency.layananList.length > 2 && (
                              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 self-center">
                                +{agency.layananList.length - 2} lainnya
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">Senin–Kamis 07.30–16.00 · Jumat 07.30–16.30 WITA</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectAgency(agency);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                        >
                          <span>{isEn ? 'Details' : 'Detail'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer Bar */}
          <div className="p-3.5 px-4 sm:px-6 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200/90 dark:border-white/10 shrink-0 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Layanan Terintegrasi Satu Pintu Pemkab Luwu</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-extrabold transition-all cursor-pointer shadow-sm shrink-0"
            >
              {isEn ? 'Close' : 'Tutup'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MppAgenciesCatalogModal;
