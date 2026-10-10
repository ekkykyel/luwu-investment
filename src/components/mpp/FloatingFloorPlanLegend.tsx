import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Building2, 
  Users, 
  CreditCard, 
  Landmark, 
  Shield, 
  Coffee,
  Accessibility,
  X,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export type MppSectorFilter = 
  | 'all' 
  | 'perizinan' 
  | 'kependudukan' 
  | 'perpajakan' 
  | 'perbankan' 
  | 'kepolisian' 
  | 'fasilitas'
  | 'fasilitas_inklusif';

export const SECTOR_ACCENT_COLORS: Record<string, string> = {
  all: '#10b981',
  perizinan: '#3b82f6',
  kependudukan: '#06b6d4',
  perpajakan: '#f59e0b',
  perbankan: '#8b5cf6',
  kepolisian: '#ef4444',
  fasilitas: '#10b981',
  fasilitas_inklusif: '#10b981'
};

export function isNodeInSector(nodeId: string, nodeLabel: string, nodeType: string, sector: MppSectorFilter): boolean {
  if (sector === 'all') return true;

  const idLower = String(nodeId || '').toLowerCase();
  const labelLower = String(nodeLabel || '').toLowerCase();

  if (sector === 'fasilitas' || sector === 'fasilitas_inklusif') {
    return nodeType === 'facility' || idLower.includes('mushalla') || idLower.includes('toilet') || idLower.includes('baca') || idLower.includes('anak') || idLower.includes('laktasi') || idLower.includes('kursi_roda') || idLower.includes('disabilitas') || idLower.includes('prioritas');
  }

  if (sector === 'perizinan') {
    return labelLower.includes('dpmptsp') || labelLower.includes('pupr') || labelLower.includes('lingkungan') || labelLower.includes('oss') || labelLower.includes('izin');
  }

  if (sector === 'kependudukan') {
    return labelLower.includes('dukcapil') || labelLower.includes('ktp') || labelLower.includes('kk') || labelLower.includes('capil');
  }

  if (sector === 'perpajakan') {
    return labelLower.includes('pajak') || labelLower.includes('bapenda') || labelLower.includes('kpp') || labelLower.includes('samsat');
  }

  if (sector === 'perbankan') {
    return labelLower.includes('bank') || labelLower.includes('sulselbar') || labelLower.includes('bri') || labelLower.includes('bni') || labelLower.includes('atm');
  }

  if (sector === 'kepolisian') {
    return labelLower.includes('polres') || labelLower.includes('sim') || labelLower.includes('skck') || labelLower.includes('polri');
  }

  return true;
}

interface FloatingFloorPlanLegendProps {
  activeSector: MppSectorFilter;
  onSelectSector: (sector: MppSectorFilter) => void;
  isDark?: boolean;
  position?: 'bottom-left' | 'top-right' | 'bottom-right';
  totalMatchingCount?: number;
}

export const FloatingFloorPlanLegend: React.FC<FloatingFloorPlanLegendProps> = ({
  activeSector,
  onSelectSector,
  isDark = true,
  position = 'bottom-left',
  totalMatchingCount
}) => {
  const [isOpenDesktop, setIsOpenDesktop] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const sectorOptions: { id: MppSectorFilter; label: string; sublabel: string; icon: any }[] = [
    { id: 'all', label: 'Semua Layanan', sublabel: 'Tampilkan seluruh 46 loket & fasilitas', icon: Layers },
    { id: 'perizinan', label: 'Perizinan & OSS', sublabel: 'DPMPTSP, PUPR, Lingkungan Hidup', icon: Building2 },
    { id: 'kependudukan', label: 'Dukcapil / KTP', sublabel: 'E-KTP, KK, Akta & IKD Digital', icon: Users },
    { id: 'perpajakan', label: 'Pajak & Bapenda', sublabel: 'SAMSAT, PBB, Bapenda & KPP Pajak', icon: CreditCard },
    { id: 'perbankan', label: 'Perbankan & Kas', sublabel: 'Bank Sulselbar, BRI, BNI & ATM', icon: Landmark },
    { id: 'kepolisian', label: 'Polres (SIM/SKCK)', sublabel: 'Layanan SKCK Online & Perpanjang SIM', icon: Shield },
    { id: 'fasilitas', label: 'Fasilitas Umum', sublabel: 'Mushalla, Toilet, Area Tunggu & Cafe', icon: Coffee },
    { id: 'fasilitas_inklusif', label: 'Ramah Disabilitas', sublabel: 'Laktasi, Anjungan ADM & Kursi Roda', icon: Accessibility }
  ];

  const currentSectorObj = sectorOptions.find((s) => s.id === activeSector) || sectorOptions[0];

  return (
    <>
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. DESKTOP VIEW (FLOATING DROPDOWN CARD)                          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div
        className={`hidden sm:block absolute ${
          position === 'bottom-left' ? 'bottom-3 left-3' : 'top-3 right-3'
        } z-30 font-sans`}
      >
        <div
          className={`rounded-2xl border backdrop-blur-xl transition-all shadow-xl ${
            isDark
              ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-black/50'
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
          }`}
        >
          {/* Toggle Button Desktop */}
          <button
            onClick={() => setIsOpenDesktop(!isOpenDesktop)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-2xl w-full justify-between cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filter Sektor:</span>
              <span className="font-bold text-emerald-400 capitalize">
                {currentSectorObj.label}
              </span>
              {totalMatchingCount !== undefined && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {totalMatchingCount}
                </span>
              )}
            </div>
            {isOpenDesktop ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Desktop Dropdown list */}
          <AnimatePresence>
            {isOpenDesktop && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-2 pb-2 pt-1 border-t border-slate-700/40 space-y-1 max-h-[320px] overflow-y-auto"
              >
                {sectorOptions.map((opt) => {
                  const isSelected = activeSector === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onSelectSector(opt.id);
                        setIsOpenDesktop(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                          : isDark
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. MOBILE / ANDROID VIEW (COMPACT TRIGGER PILL & BOTTOM SHEET)     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="sm:hidden absolute bottom-3 left-3 z-30 font-sans pointer-events-auto">
        <div className="flex items-center gap-1.5">
          {/* Compact Mobile Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold shadow-xl backdrop-blur-md border transition-all cursor-pointer active:scale-95 ${
              activeSector !== 'all'
                ? 'bg-emerald-600 text-white border-emerald-300 ring-2 ring-emerald-400/40'
                : 'bg-slate-900/90 text-slate-100 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="max-w-[130px] truncate">
              {activeSector !== 'all' ? currentSectorObj.label : 'Filter Sektor'}
            </span>
            <ChevronUp className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          </button>

          {/* Quick Reset Button on Mobile Pill when Active */}
          {activeSector !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectSector('all')}
              className="p-2 rounded-2xl bg-rose-600 text-white border border-rose-400 shadow-xl active:scale-90 transition-transform cursor-pointer"
              title="Reset Filter Sektor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. ANDROID NATIVE BOTTOM SHEET DRAWER MODAL                        */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-[99999] flex flex-col justify-end font-sans">
            {/* Backdrop Blur Overlay - Tap anywhere to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Bottom Sheet Card Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full bg-[#0A2238] border-t border-slate-700/80 rounded-t-3xl p-4 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100"
            >
              {/* Android Grab Handle Indicator */}
              <div className="w-12 h-1.5 bg-slate-600/80 rounded-full mx-auto mb-3 shrink-0" />

              {/* Drawer Header with PROMINENT X TUTUP BUTTON */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black tracking-tight text-white font-sans">
                        Filter Sektor Pelayanan
                      </h4>
                      {totalMatchingCount !== undefined && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {totalMatchingCount} Loket
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pilih zonasi untuk menyorot loket pada denah
                    </p>
                  </div>
                </div>

                {/* HIGHLY VISIBLE UNMISSABLE CLOSE BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2.5 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 transition-all cursor-pointer active:scale-95 shadow-lg flex items-center justify-center shrink-0"
                  aria-label="Tutup Filter"
                  title="Tutup Menu Filter"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable List of Sector Cards */}
              <div className="overflow-y-auto space-y-2 pr-1 py-1 flex-1 no-scrollbar">
                {sectorOptions.map((opt) => {
                  const isSelected = activeSector === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onSelectSector(opt.id);
                        setIsMobileDrawerOpen(false); // Auto-close drawer on selection so floor plan map is immediately visible!
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-[0.98] ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40'
                          : 'bg-surface/80 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold font-sans text-white">
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {opt.sublabel}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500 text-white text-[10px] font-black shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sticky Footer: Terapkan & Lihat Denah */}
              <div className="pt-3 border-t border-slate-800 shrink-0 mt-2">
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black tracking-wide transition-all shadow-xl shadow-emerald-950/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Terapkan Filter & Lihat Denah Penuh</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingFloorPlanLegend;
