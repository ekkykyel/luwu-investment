import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Ticket,
  Clock,
  FileCheck2,
  Layers,
  SearchCheck,
  Sparkles,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Compass
} from 'lucide-react';

interface MppQuickJumpDockProps {
  onOpenCommandPalette: () => void;
  activePersona: 'warga' | 'investor' | 'semua';
}

export const MppQuickJumpDock: React.FC<MppQuickJumpDockProps> = ({
  onOpenCommandPalette,
  activePersona,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll position to highlight active dock icon
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      setShowScrollTop(window.scrollY > 400);

      const sectionIds = [
        'antrean-online',
        'operasional-heatmap',
        'syarat-dokumen',
        'denah-interaktif',
        'tracking-berkas',
        'investor-vip',
      ];

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    {
      id: 'command',
      label: 'Cari Cepat (Ctrl+K)',
      icon: Search,
      action: onOpenCommandPalette,
      isSpecial: true,
    },
    {
      id: 'antrean-online',
      label: 'Antrean Online',
      icon: Ticket,
      action: () => scrollToSection('antrean-online'),
    },
    {
      id: 'operasional-heatmap',
      label: 'Jam & SLA',
      icon: Clock,
      action: () => scrollToSection('operasional-heatmap'),
    },
    {
      id: 'syarat-dokumen',
      label: 'Syarat Izin & AI',
      icon: FileCheck2,
      action: () => scrollToSection('syarat-dokumen'),
    },
    {
      id: 'denah-interaktif',
      label: 'Denah 3D Loket',
      icon: Layers,
      action: () => scrollToSection('denah-interaktif'),
    },
    {
      id: 'tracking-berkas',
      label: 'Lacak Berkas',
      icon: SearchCheck,
      action: () => scrollToSection('tracking-berkas'),
    },
    {
      id: 'investor-vip',
      label: 'VIP Investor Desk',
      icon: Sparkles,
      action: () => scrollToSection('investor-vip'),
      highlight: activePersona === 'investor',
    },
  ];

  return (
    <div className="hidden xl:flex fixed left-4 2xl:left-6 top-1/2 -translate-y-1/2 z-30 flex-col items-center">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.8 }}
        className="relative flex flex-col items-center"
      >
        {/* Toggle Minimize/Expand Pill */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-1.5 p-1 rounded-full bg-slate-200/80 dark:bg-slate-800/90 text-slate-500 hover:text-emerald-500 transition-colors shadow-sm cursor-pointer"
          title={isCollapsed ? "Buka Quick Jump Dock" : "Ciutkan Dock"}
          aria-label="Toggle Quick Jump Dock"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-emerald-500/25 shadow-xl shadow-slate-900/10 dark:shadow-emerald-950/40 rounded-full p-1.5 flex flex-col items-center gap-1.5"
            >
              {/* Top Accent Dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse my-0.5"></div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      onClick={item.action}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                        item.isSpecial
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:scale-110 hover:bg-emerald-400'
                          : isActive
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 scale-105'
                          : item.highlight
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                      aria-label={item.label}
                    >
                      <Icon className="w-4 h-4" />
                      {isActive && (
                        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3 rounded-r-full bg-emerald-500" />
                      )}
                    </button>

                    {/* Tooltip to the Right */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white text-[11px] font-bold font-sans tracking-wide whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all z-50 border border-slate-700/50">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900/95 dark:border-r-slate-800/95" />
                    </div>
                  </div>
                );
              })}

              {/* Scroll To Top Button */}
              {showScrollTop && (
                <>
                  <div className="w-5 h-[1px] bg-slate-200 dark:bg-white/10 my-0.5"></div>
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title="Kembali ke atas"
                      aria-label="Kembali ke atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Ke Atas
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
export default MppQuickJumpDock;
