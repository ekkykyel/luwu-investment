import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  MapPin,
  Mail,
  PhoneCall,
  Home,
  Map,
  Building2,
  BarChart2,
  ChevronRight,
  Database,
  Layers,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { LUWU_LOGO_BASE64 } from '../lib/logoBase64';

export interface FooterProps {
  isDark?: boolean;
  onNavigateSection?: (sectionId: string) => void;
  onNavigatePage?: (path: string) => void;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  isDark = true,
  onNavigateSection,
  onNavigatePage,
  className = ''
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSectionClick = (sectionId: string) => {
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePageClick = (path: string) => {
    if (onNavigatePage) {
      onNavigatePage(path);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      navigate(path);
    }
  };

  return (
    <footer className={`relative w-full bg-slate-900 text-slate-300 border-t border-slate-800 font-sans ${className}`}>
      {/* Subtle Top Accent Glow Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />

      {/* Main Footer Container */}
      <div className="container mx-auto px-6 py-10 sm:py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* COLUMN 1: BRAND & ABOUT (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                <img
                  src={LUWU_LOGO_BASE64}
                  alt="Logo Resmi Kabupaten Luwu"
                  className="w-7 h-7 object-contain drop-shadow-sm"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                  InvestLuwu Hub
                </h3>
                <p className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase font-mono">
                  {t('footer.pemkabLuwu', 'Pemerintah Kabupaten Luwu')}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md font-normal">
              {t(
                'footer.tagline',
                'Pintu Gerbang Integrasi Pelayanan Publik & Kemudahan Berinvestasi Kabupaten Luwu.'
              )}
            </p>

            {/* Address & Contact Info */}
            <div className="space-y-2 pt-2 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Jl. Jendral Sudirman No. 1, Belopa, Kab. Luwu, Sulawesi Selatan 91994
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href="mailto:dpmptsp@luwukab.go.id"
                  className="hover:text-emerald-400 transition-colors"
                >
                  dpmptsp@luwukab.go.id
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>(0471) 321-000 • Call Center 112</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: QUICK LINKS / NAVIGASI (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              {t('footer.navTitle', 'Navigasi Portal')}
            </h4>
            
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionClick('hero-section')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-slate-300 group cursor-pointer text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  <span>{t('nav.home', 'Beranda')}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionClick('potensi-section')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-slate-300 group cursor-pointer text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  <span>{t('nav.potensiRegional', 'Potensi Regional')}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handlePageClick('/mpp')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-slate-300 group cursor-pointer text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  <span>Portal MPP Simpurusiang</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionClick('analytics-section')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-slate-300 group cursor-pointer text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  <span>{t('nav.interactiveDashboard', 'Dashboard Interaktif')}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: TECH STACK & STATUS (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Status & Infrastruktur
            </h4>

            {/* System Status Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Operational / System Online</span>
            </div>

            {/* Tech Badges & Description */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Integrated PostGIS Spatial Engine</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>Supabase Sync</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                Arsitektur geospasial terpusat untuk transparansi perizinan serta kepastian investasi berbasis data spatial real-time.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR (COPYRIGHT & META) */}
      <div className="border-t border-slate-800 bg-slate-950/80">
        <div className="container mx-auto px-6 py-4 max-w-7xl flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          {/* Left Copyright */}
          <p className="text-center md:text-left font-sans">
            {t(
              'footer.copyright',
              '© 2026 Pemerintah Kabupaten Luwu. Hak Cipta Dilindungi Undang-Undang.'
            )}
          </p>

          {/* Right Meta Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-300 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>v2.0.1 (Precision Engine) • Powered by PostGIS & Supabase</span>
          </div>
        </div>
      </div>

      {/* FLOATING "BACK TO TOP" BUTTON */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-full shadow-lg hover:shadow-emerald-900/30 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 group"
        title="Kembali ke atas"
        aria-label="Kembali ke atas"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </footer>
  );
};

export default Footer;
