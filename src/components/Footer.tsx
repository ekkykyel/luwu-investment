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
    <footer className={`relative w-full font-sans transition-colors duration-300 ${
      isDark
        ? 'bg-[#06130F] text-[#B9C4BC] border-t border-[rgba(201,162,75,0.25)]'
        : 'bg-[#FAF7F0] text-[#4A5A52] border-t border-[rgba(160,122,40,0.22)] shadow-sm'
    } ${className}`}>
      {/* Subtle Gold Top Accent Line */}
      <div className={`h-[1px] w-full ${
        isDark
          ? 'bg-gradient-to-r from-transparent via-[rgba(201,162,75,0.40)] to-transparent'
          : 'bg-gradient-to-r from-transparent via-[rgba(160,122,40,0.35)] to-transparent'
      }`} />

      {/* Main Footer Container */}
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* COLUMN 1: BRAND & ABOUT (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center p-1.5 shrink-0 ${
                isDark
                  ? 'bg-[#0B2A20] border border-[rgba(201,162,75,0.30)] shadow-inner'
                  : 'bg-white border border-[rgba(160,122,40,0.25)] shadow-xs'
              }`}>
                <img
                  src={LUWU_LOGO_BASE64}
                  alt="Lambang Resmi Kabupaten Luwu"
                  className="w-8 h-8 object-contain drop-shadow-xs"
                />
              </div>
              <div>
                <h3 className={`font-serif-display font-semibold text-lg sm:text-xl tracking-tight ${
                  isDark ? 'text-[#F6F1E4]' : 'text-[#10261E]'
                }`}>
                  InvestLuwu Hub
                </h3>
                <p className={`text-[11px] font-bold tracking-wider uppercase ${
                  isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
                }`}>
                  {t('footer.pemkabLuwu', 'Pemerintah Kabupaten Luwu')}
                </p>
              </div>
            </div>

            <p className={`text-xs sm:text-sm leading-relaxed max-w-md font-normal ${
              isDark ? 'text-[#B9C4BC]' : 'text-[#4A5A52]'
            }`}>
              {t(
                'footer.tagline',
                'Pintu Gerbang Integrasi Pelayanan Publik & Kemudahan Berinvestasi Kabupaten Luwu.'
              )}
            </p>

            {/* Address & Contact Info */}
            <div className={`space-y-2 pt-2 text-xs ${
              isDark ? 'text-[#B9C4BC]' : 'text-[#4A5A52]'
            }`}>
              <div className="flex items-start gap-2.5">
                <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
                }`} />
                <span className="leading-snug">
                  Jl. Jendral Sudirman No. 1, Belopa, Kab. Luwu, Sulawesi Selatan 91994
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className={`w-4 h-4 shrink-0 ${
                  isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
                }`} />
                <a
                  href="mailto:dpmptsp@luwukab.go.id"
                  className={`transition-colors font-medium ${
                    isDark ? 'hover:text-[#E0BE6A] text-[#F6F1E4]' : 'hover:text-[#0F6B4F] text-[#10261E]'
                  }`}
                >
                  dpmptsp@luwukab.go.id
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <PhoneCall className={`w-4 h-4 shrink-0 ${
                  isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
                }`} />
                <span>(0471) 321-000 • Call Center 112</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: QUICK LINKS / NAVIGASI (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
            }`}>
              {t('footer.navTitle', 'Navigasi Portal')}
            </h4>
            
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionClick('hero-section')}
                  className={`transition-colors flex items-center gap-2 group cursor-pointer text-left ${
                    isDark ? 'text-[#B9C4BC] hover:text-[#F6F1E4]' : 'text-[#4A5A52] hover:text-[#10261E]'
                  }`}
                >
                  <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                    isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
                  }`} />
                  <span>{t('nav.home', 'Beranda')}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionClick('potensi-section')}
                  className={`transition-colors flex items-center gap-2 group cursor-pointer text-left ${
                    isDark ? 'text-[#B9C4BC] hover:text-[#F6F1E4]' : 'text-[#4A5A52] hover:text-[#10261E]'
                  }`}
                >
                  <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                    isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
                  }`} />
                  <span>{t('nav.potensiRegional', 'Peluang Investasi')}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handlePageClick('/mpp')}
                  className={`transition-colors flex items-center gap-2 group cursor-pointer text-left ${
                    isDark ? 'text-[#B9C4BC] hover:text-[#F6F1E4]' : 'text-[#4A5A52] hover:text-[#10261E]'
                  }`}
                >
                  <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                    isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
                  }`} />
                  <span>Portal MPP Simpurusiang</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionClick('analytics-section')}
                  className={`transition-colors flex items-center gap-2 group cursor-pointer text-left ${
                    isDark ? 'text-[#B9C4BC] hover:text-[#F6F1E4]' : 'text-[#4A5A52] hover:text-[#10261E]'
                  }`}
                >
                  <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                    isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
                  }`} />
                  <span>{t('nav.interactiveDashboard', 'Analitik Spasial')}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: SUMBER DATA & KEBIJAKAN (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
            }`}>
              Integritas & Sumber Data
            </h4>

            {/* Official Source Badges */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-medium ${
                  isDark
                    ? 'bg-[#0B2A20] text-[#F6F1E4] border-[rgba(201,162,75,0.30)]'
                    : 'bg-white text-[#10261E] border-[rgba(160,122,40,0.25)]'
                }`}>
                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${
                    isDark ? 'text-[#C9A24B]' : 'text-[#A07A28]'
                  }`} />
                  <span>Data terverifikasi DPMPTSP</span>
                </span>
                <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-medium ${
                  isDark
                    ? 'bg-[#0B2A20] text-[#F6F1E4] border-[rgba(201,162,75,0.30)]'
                    : 'bg-white text-[#10261E] border-[rgba(160,122,40,0.25)]'
                }`}>
                  <Building2 className={`w-3.5 h-3.5 shrink-0 ${
                    isDark ? 'text-[#1F9D74]' : 'text-[#0F6B4F]'
                  }`} />
                  <span>Kesesuaian RTRW & OSS-RBA</span>
                </span>
              </div>
              <p className={`text-xs leading-relaxed font-normal ${
                isDark ? 'text-[#B9C4BC]' : 'text-[#4A5A52]'
              }`}>
                Penyajian potensi investasi resmi berbasis tata ruang wilayah dan regulasi perizinan berusaha satu pintu Pemerintah Kabupaten Luwu.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR (COPYRIGHT & PROVENANCE) */}
      <div className={`border-t ${
        isDark
          ? 'border-[rgba(201,162,75,0.20)] bg-[#08201A] text-[#B9C4BC]'
          : 'border-[rgba(160,122,40,0.18)] bg-[#F3EEDF] text-[#4A5A52]'
      }`}>
        <div className="container mx-auto px-6 py-4 max-w-7xl flex flex-col md:flex-row items-center justify-between text-xs gap-3">
          {/* Left Copyright */}
          <p className="text-center md:text-left font-sans">
            {t(
              'footer.copyright',
              '© 2026 Pemerintah Kabupaten Luwu. Hak Cipta Dilindungi Undang-Undang.'
            )}
          </p>

          {/* Right Provenance Tag */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] border ${
            isDark
              ? 'bg-[#0B2A20] border-[rgba(201,162,75,0.30)] text-[#F6F1E4]'
              : 'bg-white border-[rgba(160,122,40,0.25)] text-[#10261E]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isDark ? 'bg-[#C9A24B]' : 'bg-[#A07A28]'
            }`} />
            <span>Data bersumber dari DPMPTSP, RTRW, dan OSS-RBA</span>
          </div>
        </div>
      </div>

      {/* FLOATING "BACK TO TOP" BUTTON (Max 48px) */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#C9A24B] group ${
          isDark
            ? 'bg-[#0F6B4F] hover:bg-[#1F9D74] text-white'
            : 'bg-[#0F6B4F] hover:bg-[#0B533D] text-white'
        }`}
        title="Kembali ke atas"
        aria-label="Kembali ke atas"
      >
        <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </footer>
  );
};

export default Footer;
