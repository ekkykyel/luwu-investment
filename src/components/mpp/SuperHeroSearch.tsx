import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Mic, Command, ArrowRight } from 'lucide-react';

export interface SuperHeroSearchProps {
  onSearchSubmit?: (query: string) => void;
  onOpenCommandPalette: () => void;
  onOpenVoiceAssistant?: () => void;
  onSelectChip?: (chipId: string) => void;
  activePersona?: 'warga' | 'investor' | 'semua';
}

const POPULAR_CHIPS = [
  { id: 'dukcapil', label: 'Dukcapil & KTP-el', category: 'Kependudukan' },
  { id: 'oss', label: 'Izin Usaha NIB OSS', category: 'Perizinan' },
  { id: 'antrean', label: 'Ambil Antrean Online', category: 'Layanan Cepat' },
  { id: 'bpjs', label: 'BPJS Kesehatan', category: 'Kesehatan' },
  { id: 'pajak', label: 'Pajak Daerah & PBB', category: 'Keuangan' },
  { id: 'samsat', label: 'SAMSAT PKB Luwu', category: 'Kepolisian' },
  { id: 'bpn', label: 'Sertipikat Tanah BPN', category: 'Pertanahan' },
  { id: 'imigrasi', label: 'Paspor Imigrasi', category: 'Hukum' },
];

export const SuperHeroSearch: React.FC<SuperHeroSearchProps> = ({
  onSearchSubmit,
  onOpenCommandPalette,
  onOpenVoiceAssistant,
  onSelectChip,
  activePersona = 'warga',
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit && query.trim()) {
      onSearchSubmit(query.trim());
    } else {
      onOpenCommandPalette();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-6 pt-2 pb-6">
      
      {/* 1. Header Kicker Pill with Institutional Accent */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center justify-center text-center px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-2xs"
      >
        <span>Regional GRP Platform</span>
      </motion.div>

      {/* 2. Main Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="space-y-3 max-w-3xl px-2"
      >
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] font-sans">
          <span className="block text-slate-900 dark:text-white">Ekosistem Layanan Publik</span>
          <span className="block bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
            Tanpa Hambatan
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-md sm:max-w-xl mx-auto text-balance leading-relaxed">
          Portal terpadu Regional GRP (Government Resource Planning) untuk 19 instansi pemerintah, BUMN, dan kepolisian. Cepat, transparan, dan ramah untuk seluruh warga Luwu.
        </p>
      </motion.div>

      {/* 3. PROMINENT GOOGLE SEARCH STYLE GLASSMORPHIC BAR */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-2xl px-2 sm:px-0"
      >
        <form
          onSubmit={handleSubmit}
          className={`relative group rounded-3xl p-1.5 sm:p-2 transition-all duration-300 ${
            isFocused
              ? 'bg-white/95 dark:bg-slate-900/95 ring-4 ring-emerald-500/25 border-emerald-500 shadow-2xl shadow-emerald-500/10'
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 pl-3.5 pr-1.5 sm:pl-4 sm:pr-2">
            <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Apa layanan yang Anda butuhkan hari ini di MPP Simpurusiang?"
              className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none truncate py-2 sm:py-2.5"
            />

            {/* Keyboard shortcut hint */}
            <div className="hidden md:flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>

            {/* Voice Assistant Mic Trigger */}
            {onOpenVoiceAssistant && (
              <button
                type="button"
                onClick={onOpenVoiceAssistant}
                title="Pencarian Suara & Asisten AI"
                aria-label="Pencarian Suara"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Search Submit Button */}
            <button
              type="submit"
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
            >
              <span>Cari</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline-block" />
            </button>
          </div>
        </form>
      </motion.div>

      {/* 4. HORIZONTAL SWIPEABLE CHIPS WITH GRADIENT EDGE MASKS */}
      <div className="relative w-full max-w-2xl mx-auto pt-1">
        {/* Left Fade Mask */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50/90 dark:from-slate-950/90 to-transparent z-10 rounded-l-2xl" />
        {/* Right Fade Mask */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-50/90 dark:from-slate-950/90 to-transparent z-10 rounded-r-2xl" />

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1.5 px-3 snap-x touch-pan-x">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Populer:
          </span>
          {POPULAR_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelectChip ? onSelectChip(chip.id) : onOpenCommandPalette()}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white/80 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 shadow-2xs transition-all snap-start shrink-0 cursor-pointer active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperHeroSearch;
