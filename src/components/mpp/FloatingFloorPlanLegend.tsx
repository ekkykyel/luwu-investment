import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Layers, 
  Users, 
  Building2, 
  Receipt, 
  ShieldCheck, 
  Landmark, 
  Accessibility, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Info,
  Sparkles,
  RotateCcw,
  Lock
} from 'lucide-react';

export type MppSectorFilter =
  | 'all'
  | 'kependudukan'
  | 'perizinan'
  | 'perpajakan'
  | 'bpjs_sosial'
  | 'perbankan_bumn'
  | 'fasilitas_inklusif'
  | 'area_staf';

export interface SectorDefinition {
  id: MppSectorFilter;
  labelKey: string;
  defaultLabel: string;
  subLabelKey?: string;
  subLabelDefault?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  ringClass: string;
  bgActiveClass: string;
  badgeText: string;
}

export const SECTOR_ACCENT_COLORS: Record<MppSectorFilter, string> = {
  all: '#0284c7',
  kependudukan: '#0284c7',
  perizinan: '#7c3aed',
  perpajakan: '#d97706',
  bpjs_sosial: '#0f766e',
  perbankan_bumn: '#1e40af',
  fasilitas_inklusif: '#0891b2',
  area_staf: '#64748b'
};

/**
 * Checks if a specific booth/node belongs to the selected sector filter.
 */
export function isNodeInSector(
  nodeId: string,
  nodeName: string,
  nodeCategory: string = 'counter',
  sector: MppSectorFilter
): boolean {
  if (!sector || sector === 'all') return true;
  const id = (nodeId || '').toLowerCase();
  const name = (nodeName || '').toLowerCase();

  switch (sector) {
    case 'kependudukan':
      return (
        id.startsWith('dukcapil') ||
        id.includes('dukcapil') ||
        name.includes('dukcapil') ||
        name.includes('ktp') ||
        name.includes('kartu keluarga') ||
        name.includes('nik') ||
        name.includes('akta')
      );

    case 'perizinan':
      return (
        id.startsWith('dpmptsp') ||
        id.includes('dpmptsp') ||
        id === 'puptr' ||
        id.includes('puptr') ||
        id === 'bpn' ||
        id.includes('bpn') ||
        id.includes('tim_teknis') ||
        name.includes('dpmptsp') ||
        name.includes('nib') ||
        name.includes('oss') ||
        name.includes('investasi') ||
        name.includes('tata ruang') ||
        name.includes('pbg') ||
        name.includes('pertanahan') ||
        name.includes('izin')
      );

    case 'perpajakan':
      return (
        id === 'bapenda' ||
        id.includes('bapenda') ||
        id === 'kpp_pratama' ||
        id.includes('kpp') ||
        id === 'samsat' ||
        id.includes('samsat') ||
        name.includes('bapenda') ||
        name.includes('pajak') ||
        name.includes('pbb') ||
        name.includes('pkb') ||
        name.includes('stnk') ||
        name.includes('pratama')
      );

    case 'bpjs_sosial':
      return (
        id.startsWith('bpjs') ||
        id.includes('bpjs') ||
        id === 'dinsos' ||
        id.includes('dinsos') ||
        id === 'nakertrans' ||
        id.includes('nakertrans') ||
        id.includes('disnakertrans') ||
        name.includes('bpjs') ||
        name.includes('jkn') ||
        name.includes('ketenagakerjaan') ||
        name.includes('sosial') ||
        name.includes('bansos') ||
        name.includes('dtks') ||
        name.includes('ak-1') ||
        name.includes('tenaga kerja')
      );

    case 'perbankan_bumn':
      return (
        id === 'sulselbar' ||
        id.includes('sulselbar') ||
        id === 'taspen' ||
        id.includes('taspen') ||
        id === 'pdam' ||
        id.includes('pdam') ||
        id === 'imigrasi' ||
        id.includes('imigrasi') ||
        id === 'kejari' ||
        id.includes('kejari') ||
        id === 'has' ||
        id.includes('has') ||
        id === 'nervis' ||
        id.includes('nervis') ||
        id === 'dekranasda' ||
        id.includes('dekranasda') ||
        id === 'kominfo' ||
        id.includes('kominfo') ||
        id === 'perikanan' ||
        id.includes('perikanan') ||
        name.includes('bank') ||
        name.includes('sulselbar') ||
        name.includes('taspen') ||
        name.includes('pdam') ||
        name.includes('paspor') ||
        name.includes('imigrasi') ||
        name.includes('kejaksaan') ||
        name.includes('kejari') ||
        name.includes('kemenag') ||
        name.includes('halal') ||
        name.includes('hukum') ||
        name.includes('kominfo') ||
        name.includes('spbe') ||
        name.includes('perikanan') ||
        name.includes('nelayan') ||
        name.includes('umkm') ||
        name.includes('dekranasda')
      );

    case 'fasilitas_inklusif':
      // Exclude staff-only restricted areas
      if (
        nodeCategory === 'area_terbatas' ||
        id === 'gudang' ||
        id === 'gudang_2' ||
        id === 'dukcapil_server' ||
        id.includes('server') ||
        id.includes('gudang')
      ) {
        return false;
      }
      return (
        nodeCategory === 'facility' ||
        nodeCategory === 'disability' ||
        id.includes('disabilitas') ||
        id.includes('laktasi') ||
        id.includes('perawatan') ||
        id.includes('anak') ||
        id.includes('mushalla') ||
        id.includes('baca') ||
        id.includes('toilet') ||
        id.includes('front_office') ||
        id.includes('mandiri') ||
        id.includes('kiosk') ||
        id.includes('smoking') ||
        id.includes('istirahat') ||
        id.includes('rapat') ||
        id.includes('lobby') ||
        id.includes('masuk') ||
        id.includes('pos_keamanan') ||
        id.includes('tangga') ||
        name.includes('disabilitas') ||
        name.includes('inklusif') ||
        name.includes('laktasi') ||
        name.includes('anak') ||
        name.includes('mushalla') ||
        name.includes('baca') ||
        name.includes('toilet') ||
        name.includes('front office') ||
        name.includes('resepsionis') ||
        name.includes('e-kiosk') ||
        name.includes('pos jaga') ||
        name.includes('tangga') ||
        name.includes('pintu')
      );

    case 'area_staf':
      return (
        nodeCategory === 'area_terbatas' ||
        id === 'gudang' ||
        id === 'gudang_2' ||
        id === 'dukcapil_server' ||
        id.includes('server') ||
        id.includes('gudang') ||
        name.includes('server') ||
        name.includes('gudang')
      );

    default:
      return true;
  }
}

export interface FloatingFloorPlanLegendProps {
  activeSector: MppSectorFilter;
  onSelectSector: (sector: MppSectorFilter) => void;
  position?: 'bottom-left' | 'bottom-right' | 'toolbar';
  className?: string;
  isDark?: boolean;
  totalMatchingCount?: number;
  initialCollapsed?: boolean;
  isOpenControlled?: boolean;
  onToggleControlled?: (nextOpen: boolean) => void;
}

export const FloatingFloorPlanLegend: React.FC<FloatingFloorPlanLegendProps> = ({
  activeSector,
  onSelectSector,
  position = 'bottom-left',
  className = '',
  isDark = true,
  totalMatchingCount,
  initialCollapsed = false,
  isOpenControlled,
  onToggleControlled
}) => {
  const { t } = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(!initialCollapsed);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const setIsOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const val = typeof next === 'function' ? next(isOpen) : next;
    if (onToggleControlled) {
      onToggleControlled(val);
    } else {
      setInternalIsOpen(val);
    }
  };
  const [activeTab, setActiveTab] = useState<'sectors' | 'status'>('sectors');

  const sectors: SectorDefinition[] = [
    {
      id: 'all',
      labelKey: 'legend.all',
      defaultLabel: 'Semua',
      subLabelKey: 'legend.allSub',
      subLabelDefault: 'Seluruh Layanan & Fasilitas',
      icon: Layers,
      accentColor: '#10b981',
      ringClass: 'ring-emerald-500',
      bgActiveClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60',
      badgeText: 'All'
    },
    {
      id: 'kependudukan',
      labelKey: 'legend.kependudukan',
      defaultLabel: 'Kependudukan',
      subLabelKey: 'legend.kependudukanSub',
      subLabelDefault: 'Dukcapil (KTP-el, KK, Akta)',
      icon: Users,
      accentColor: '#10b981',
      ringClass: 'ring-emerald-500',
      bgActiveClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60',
      badgeText: 'Dukcapil'
    },
    {
      id: 'perizinan',
      labelKey: 'legend.perizinan',
      defaultLabel: 'Perizinan & OSS',
      subLabelKey: 'legend.perizinanSub',
      subLabelDefault: 'DPMPTSP, NIB & Tata Ruang',
      icon: Building2,
      accentColor: '#06b6d4',
      ringClass: 'ring-cyan-500',
      bgActiveClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60',
      badgeText: 'OSS RBA'
    },
    {
      id: 'perpajakan',
      labelKey: 'legend.perpajakan',
      defaultLabel: 'Pajak & SAMSAT',
      subLabelKey: 'legend.perpajakanSub',
      subLabelDefault: 'Bapenda, KPP Pratama, Samsat',
      icon: Receipt,
      accentColor: '#f59e0b',
      ringClass: 'ring-amber-500',
      bgActiveClass: 'bg-amber-500/20 text-amber-300 border-amber-500/60',
      badgeText: 'Pajak'
    },
    {
      id: 'bpjs_sosial',
      labelKey: 'legend.bpjs_sosial',
      defaultLabel: 'BPJS & Sosial',
      subLabelKey: 'legend.bpjs_sosialSub',
      subLabelDefault: 'BPJS Kes/TK, Dinsos, Nakertrans',
      icon: ShieldCheck,
      accentColor: '#3b82f6',
      ringClass: 'ring-blue-500',
      bgActiveClass: 'bg-blue-500/20 text-blue-300 border-blue-500/60',
      badgeText: 'Sosial'
    },
    {
      id: 'perbankan_bumn',
      labelKey: 'legend.perbankan_bumn',
      defaultLabel: 'Perbankan & BUMN',
      subLabelKey: 'legend.perbankan_bumnSub',
      subLabelDefault: 'Sulselbar, Taspen, BPN, PDAM',
      icon: Landmark,
      accentColor: '#8b5cf6',
      ringClass: 'ring-purple-500',
      bgActiveClass: 'bg-purple-500/20 text-purple-300 border-purple-500/60',
      badgeText: 'BUMN/BUMD'
    },
    {
      id: 'fasilitas_inklusif',
      labelKey: 'legend.fasilitas_inklusif',
      defaultLabel: 'Fasilitas & Inklusif',
      subLabelKey: 'legend.fasilitas_inklusifSub',
      subLabelDefault: 'Disabilitas, Laktasi, Mushalla',
      icon: Accessibility,
      accentColor: '#ec4899',
      ringClass: 'ring-pink-500',
      bgActiveClass: 'bg-pink-500/20 text-pink-300 border-pink-500/60',
      badgeText: 'Inklusif'
    },
    {
      id: 'area_staf',
      labelKey: 'legend.area_staf',
      defaultLabel: 'Area Staf',
      subLabelKey: 'legend.area_stafSub',
      subLabelDefault: 'Ruang Server & Gudang (Khusus Petugas)',
      icon: Lock,
      accentColor: '#64748b',
      ringClass: 'ring-slate-500',
      bgActiveClass: 'bg-slate-500/20 text-slate-300 border-slate-500/60',
      badgeText: 'Staf'
    }
  ];

  const statusIndicators = [
    {
      colorClass: 'bg-emerald-500 status-beacon-green',
      glowColor: '#10b981',
      title: t('legend.greenTitle', 'Lancar (Fast)'),
      volume: t('legend.greenDesc', '< 5 Antrean'),
      desc: 'Waktu tunggu minimal, loket siap melayani'
    },
    {
      colorClass: 'bg-amber-500 status-beacon-amber',
      glowColor: '#f59e0b',
      title: t('legend.amberTitle', 'Sedang (Medium)'),
      volume: t('legend.amberDesc', '5 - 15 Antrean'),
      desc: 'Pelayanan berlangsung stabil dan tertib'
    },
    {
      colorClass: 'bg-rose-500 status-beacon-red',
      glowColor: '#ef4444',
      title: t('legend.redTitle', 'Padat (Busy)'),
      volume: t('legend.redDesc', '> 15 Antrean'),
      desc: 'Volume antrean tinggi, disarankan e-tiket'
    },
    {
      colorClass: 'bg-slate-400 dark:bg-slate-600',
      glowColor: '#94a3b8',
      title: t('legend.grayTitle', 'Tutup (Closed)'),
      volume: t('legend.grayDesc', 'Loket Nonaktif'),
      desc: 'Sedang istirahat atau jadwal tutup'
    }
  ];

  const isToolbar = position === 'toolbar';
  const posClass = isToolbar
    ? 'relative inline-block'
    : position === 'bottom-right'
    ? 'absolute bottom-3 right-3 md:bottom-5 md:right-5'
    : 'absolute bottom-3 left-3 md:bottom-5 md:left-5';

  const hasActiveSector = activeSector !== 'all';
  const currentSectorObj = sectors.find(s => s.id === activeSector);

  return (
    <div className={`${posClass} z-30 max-w-[calc(100vw-24px)] pointer-events-auto ${className}`}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOGGLE BUTTON (IN TOOLBAR OR COMPACT COLLAPSED PILL)         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(!isOpen || isToolbar) && (
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`h-12 min-h-[48px] flex items-center gap-2 px-4 rounded-2xl backdrop-blur-md border shadow-md transition-all cursor-pointer active:scale-95 group select-none text-xs font-bold ${
            isDark
              ? (isOpen
                  ? 'bg-slate-900/95 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/95 text-white border-slate-700/80 hover:border-emerald-500/80 hover:bg-slate-800')
              : (isOpen
                  ? 'bg-white/95 text-slate-800 border-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_2px_8px_rgba(15,23,42,0.10)]'
                  : 'bg-white/85 text-slate-800 border-slate-200 hover:border-emerald-500/80 hover:bg-slate-50 shadow-[0_2px_8px_rgba(15,23,42,0.10)]')
          }`}
          title={t('legend.expand', 'Buka Filter & Legenda Denah')}
          aria-label={t('legend.mobileToggle', 'Filter & Legenda')}
          aria-expanded={isOpen}
        >
          <div className="relative flex items-center justify-center">
            <Filter className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            {hasActiveSector && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="tracking-tight whitespace-nowrap">
            {t('legend.mobileToggle', 'Filter & Legenda')}
          </span>

          {hasActiveSector && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              {currentSectorObj ? t(currentSectorObj.labelKey, currentSectorObj.defaultLabel) : activeSector}
            </span>
          )}

          <ChevronUp className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
        </button>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. EXPANDED GLASSMORPHIC LEGEND & SECTOR FILTER PANEL         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className={`${
          isToolbar
            ? 'absolute bottom-full mb-2 left-0'
            : 'mb-2'
        } w-[calc(100vw-32px)] sm:w-[360px] md:w-[390px] max-h-[70vh] sm:max-h-[72vh] flex flex-col backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 z-50 ${
          isDark
            ? 'bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-700/80 shadow-2xl'
            : 'bg-white/90 text-slate-800 border border-slate-200 shadow-[0_2px_8px_rgba(15,23,42,0.10)]'
        }`}>
          {/* Header Bar */}
          <div className={`px-3.5 py-3 border-b flex items-center justify-between gap-2 select-none relative z-50 ${
            isDark ? 'border-slate-800/80 bg-slate-900/90 text-slate-100' : 'border-slate-200/80 bg-white/95 text-slate-900'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold tracking-tight flex items-center gap-1.5 truncate">
                  <span>{t('legend.title', 'Legenda & Filter Sektor')}</span>
                  {hasActiveSector && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      ON
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {t('legend.subtitle', 'Status antrean real-time & zonasi sektor')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {hasActiveSector && (
                <button
                  type="button"
                  onClick={() => onSelectSector('all')}
                  className={`h-10 px-2.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-slate-700/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                  }`}
                  title={t('legend.resetFilter', 'Tampilkan Semua Sektor')}
                >
                  <RotateCcw className="w-3 h-3 text-emerald-500" />
                  <span className="hidden sm:inline">{t('legend.resetFilter', 'Reset')}</span>
                </button>
              )}

              <button
                type="button"
                id="fp-legend-close-button"
                onClick={() => setIsOpen(false)}
                className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl transition-colors flex items-center justify-center cursor-pointer active:scale-90 relative z-50 ${
                  isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
                title={t('legend.collapse', 'Tutup')}
                aria-label="Tutup Filter & Legenda"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs: Sektor Pelayanan vs Status Antrean */}
          <div className={`grid grid-cols-2 p-1.5 border-b text-[11px] font-bold gap-1 select-none ${
            isDark ? 'bg-slate-950/60 border-slate-800/60' : 'bg-slate-50/90 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab('sectors')}
              className={`py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'sectors'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50')
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{t('legend.sectorsTitle', 'Filter Sektor')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'status'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50')
              }`}
            >
              <Info className="w-3 h-3" />
              <span>{t('legend.statusTitle', 'Status Antrean')}</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-3 overflow-y-auto space-y-3 overscroll-contain">
            {/* ───────────────────────────────────────────────────────── */}
            {/* TAB 1: INTERACTIVE SECTOR FILTER TOGGLES                  */}
            {/* ───────────────────────────────────────────────────────── */}
            {activeTab === 'sectors' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>Pilih sektor untuk menyorot loket terkait:</span>
                  {typeof totalMatchingCount === 'number' && (
                    <span className="text-emerald-400 font-mono font-bold">
                      {totalMatchingCount} Loket
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {sectors.map((sec) => {
                    const Icon = sec.icon;
                    const isSelected = activeSector === sec.id;
                    const label = t(sec.labelKey, sec.defaultLabel);

                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => onSelectSector(sec.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer select-none group relative overflow-hidden ${
                          isSelected
                            ? `${sec.bgActiveClass} shadow-md`
                            : (isDark
                                ? 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/50 text-slate-300 hover:text-white'
                                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700 hover:text-slate-950')
                        }`}
                      >
                        {/* Active Accent Bar Indicator */}
                        {isSelected && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ backgroundColor: sec.accentColor }}
                          />
                        )}

                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isSelected
                              ? (isDark ? 'bg-slate-900/60 shadow-xs' : 'bg-white shadow-xs')
                              : (isDark ? 'bg-slate-900/50 border border-slate-700/50' : 'bg-white border border-slate-200')
                          }`}
                          style={{ color: sec.accentColor }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold truncate leading-tight">
                              {label}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono block truncate">
                            {sec.badgeText}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasActiveSector && (
                  <div className={`mt-2.5 p-2 rounded-xl border flex items-center justify-between text-[11px] ${
                    isDark ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <span className="text-[10px]">
                      {t('legend.activeHighlight', { count: totalMatchingCount || 'semua' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectSector('all')}
                      className="text-[10px] text-emerald-500 hover:text-emerald-600 font-bold underline cursor-pointer"
                    >
                      {t('legend.resetFilter', 'Tampilkan Semua')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ───────────────────────────────────────────────────────── */}
            {/* TAB 2: REAL-TIME STATUS COLOR GUIDE (LEGEND)              */}
            {/* ───────────────────────────────────────────────────────── */}
            {activeTab === 'status' && (
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-semibold px-0.5">
                  Warna beacon pada sudut kanan atas kartu gerai:
                </div>

                <div className="space-y-1.5">
                  {statusIndicators.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-start gap-2.5 ${
                        isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="relative pt-0.5 shrink-0">
                        <div className={`w-3.5 h-3.5 rounded-full ${item.colorClass}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            {item.title}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                            isDark ? 'bg-slate-900/80 border-slate-700/60 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                          }`}>
                            {item.volume}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`mt-2 p-2 rounded-xl border text-[10px] text-slate-400 flex items-center gap-1.5 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Sinkronisasi data antrean otomatis setiap detik melalui Supabase realtime.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingFloorPlanLegend;
