import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Shield, Compass, Home } from 'lucide-react';
import { LuwuLogo } from '../components/LuwuLogo';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import ApplicantTrackingDashboard from '../components/Dashboard/ApplicantTrackingDashboard';

export const PkkprTrackingView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialReg = searchParams.get('reg') || searchParams.get('nomor') || searchParams.get('id') || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-base text-slate-900 dark:text-white transition-colors">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-base/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <LuwuLogo className="w-8 h-8" />
              <div className="hidden sm:block">
                <div className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase font-display">
                  InvestLuwu • Portal Pelacakan
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  DPMPTSP &amp; Dinas PUPTR Kab. Luwu
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/investor-dashboard')}
              className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold transition hover:bg-teal-100 dark:hover:bg-teal-900/50 cursor-pointer hidden md:flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Portal Investor</span>
            </button>
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="py-6 sm:py-8">
        <ApplicantTrackingDashboard 
          initialTrackingNumber={initialReg} 
          onNavigateToForm={() => navigate('/investor-dashboard')}
        />
      </main>
    </div>
  );
};

export default PkkprTrackingView;
