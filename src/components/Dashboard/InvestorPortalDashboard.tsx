import { requestSmartFullscreen, exitSmartFullscreen } from "../../utils/fullscreen.js";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OssRoiSimulatorInputs } from "../OssRoiSimulatorInputs.js";
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Calculator, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  Map,
  Compass,
  ArrowUpRight,
  Briefcase,
  Layers,
  Percent,
  CheckCircle2,
  Building2,
  MapPin,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Loader2,
  MessageSquare,
  FileText
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient.js';
import { Investment, SektorInvestasi, District } from '../../types.js';
import { SECTOR_COLORS } from '../../lib/constants.js';
import { formatRupiahSingkat, formatRupiah } from '../../lib/formatters.js';
import { InvestmentDetailModal } from '../InvestmentDetailModal.js';
import NibVerificationForm from '../Auth/NibVerificationForm.js';
import { LuwuLogo } from '../LuwuLogo.js';
import LanguageSwitcher from '../LanguageSwitcher.js';
import LoadingScreen from '../LoadingScreen.js';
import jsPDF from "jspdf";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "../../lib/html2canvasShim.js";

import AISiteSelection from '../AISiteSelection.js';

export default function InvestorPortalDashboard() {
  const navigate = useNavigate();
  useEffect(() => { return () => { exitSmartFullscreen(); }; }, []);

  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'verify' | 'simulation' | 'testimonial' | 'site-selection'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('investor');
  const [error, setError] = useState<string | null>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);

  // States for Financial Simulation
  const [capex, setCapex] = useState<string>('5000000000'); // IDR 5 Billion as default for a professional project
  const [opex, setOpex] = useState<string>('600000000');   // IDR 600 Million
  const [isUsingOSS, setIsUsingOSS] = useState<boolean>(false);
  const [revenue, setRevenue] = useState<string>('1800000000'); // IDR 1.8 Billion
  const [targetPotential, setTargetPotential] = useState<string>('agroindustri_latimojong');
  const [discountRate, setDiscountRate] = useState<string>('10'); // Default 10% Suku Bunga Diskonto
  const [tenor, setTenor] = useState<string>('5'); // Default 5 Tahun Tenor Proyeksi
  const [inflationRate, setInflationRate] = useState<string>('4.5'); // Default 4.5% Laju Inflasi
  const [simRunCount, setSimRunCount] = useState<number>(0); // Trigger to rerun calculations or track clicks
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);

  // States for Testimonial Submission
  const [testiCompany, setTestiCompany] = useState('');
  const [testiSector, setTestiSector] = useState('Agroindustri');
  const [testiMessage, setTestiMessage] = useState('');
  const [isSubmittingTesti, setIsSubmittingTesti] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');

  // Strict Protected Route & Role Validation
  useEffect(() => {
    const loadUserSession = async () => {
      setIsAuthLoading(true);
      try {
        // Restore session manually from cookie or localStorage to bypass iframe restrictions kawan!
        let token = localStorage.getItem("luwu_session_token");
        if (!token) {
          const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
          if (match) token = match[1];
        }
        if (token) {
          await supabase.auth.setSession({ access_token: token, refresh_token: token });
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate("/login");
          return;
        }
        
        // Strict Role Validation
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role) setUserRole(profile.role);
        if (!profile || (profile.role !== 'investor' && profile.role !== 'superadmin' && profile.role !== 'admin_dalak' && profile.role !== 'admin_oss' && profile.role !== 'admin_promosi' && profile.role !== 'operator')) {
          navigate("/403-forbidden");
          return;
        }

        const u = session.user;
        const meta = u.user_metadata || {};
        const name = meta.company_name || meta.full_name || u.email || "Investor Terverifikasi";
        setCompanyName(name);
        setTestiCompany(name);
        setIsAuthLoading(false);
      } catch (err) {
        console.error("Error verifying user session:", err);
        window.location.replace("/login");
      }
    };
    loadUserSession();
  }, []);

  // ROI Flash Effect State & Effect
  const [roiFlash, setRoiFlash] = useState(false);
  const prevRoiRef = useRef<number | null>(null);

  useEffect(() => {
    const numCapex = parseFloat(capex) || 0;
    const numOpex = parseFloat(opex) || 0;
    const numRevenue = parseFloat(revenue) || 0;
    const labaBersih = numRevenue - numOpex;
    const currentRoi = numCapex > 0 ? (labaBersih / numCapex) * 100 : 0;

    if (prevRoiRef.current !== null && Math.abs(prevRoiRef.current - currentRoi) > 0.0001) {
      setRoiFlash(true);
      const timer = setTimeout(() => {
        setRoiFlash(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    prevRoiRef.current = currentRoi;
  }, [capex, opex, revenue]);

  // States for AI Consultation Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invRes, distRes] = await Promise.all([
          fetch('/api/investments'),
          fetch('/api/districts')
        ]);
        
        if (!invRes.ok || !distRes.ok) {
          throw new Error('Failed to fetch data from API');
        }

        const invData = await invRes.json();
        const distData = await distRes.json();

        if (isMounted) {
          setInvestments(invData || []);
          setDistricts(distData || []);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        if (isMounted) {
          setError(err.message || 'Error fetching data');
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const triggerAiAnalysis = async () => {
    setIsAiLoading(true);
    setIsAiModalOpen(true);
    try {
      // Find matching investment name
      const matchingInv = investments.find(inv => inv.id === targetPotential || inv.name.toLowerCase().replace(/\s+/g, '_') === targetPotential);
      const projectName = matchingInv ? matchingInv.name : "Simulasi Mandiri Investor Luwu";
      
      const numCapex = parseFloat(capex) || 0;
      const numOpex = parseFloat(opex) || 0;
      const numRevenue = parseFloat(revenue) || 0;
      const numWacc = parseFloat(discountRate) || 10;
      const numTenor = parseInt(tenor) || 5;
      const numInflation = parseFloat(inflationRate) || 4.5;
      
      const labaBersih = numRevenue - numOpex;
      const roi = numCapex > 0 ? (labaBersih / numCapex) * 100 : 0;
      const bep = labaBersih > 0 ? numCapex / labaBersih : 0;
      
      // We can pre-calculate npv and irr to pass to simulationContext
      let cumulativeDiscountedCF = 0;
      for (let t = 1; t <= numTenor; t++) {
        const inflationFactor = Math.pow(1 + (numInflation / 100), t);
        const cf = (numRevenue - numOpex) * inflationFactor;
        cumulativeDiscountedCF += cf / Math.pow(1 + (numWacc / 100), t);
      }
      const calculatedNpv = cumulativeDiscountedCF - numCapex;
      
      // Simple IRR
      let calculatedIrr = 0;
      if (labaBersih > 0) {
        let low = -0.99;
        let high = 5.0;
        let found = false;
        const calcNPV = (rVal: number) => {
          let sum = 0;
          for (let t = 1; t <= numTenor; t++) {
            const inf = Math.pow(1 + (numInflation / 100), t);
            sum += ((numRevenue - numOpex) * inf) / Math.pow(1 + rVal, t);
          }
          return sum - numCapex;
        };
        const npvLow = calcNPV(low);
        const npvHigh = calcNPV(high);
        if (npvLow * npvHigh < 0) {
          for (let i = 0; i < 60; i++) {
            const mid = (low + high) / 2;
            const npvMid = calcNPV(mid);
            if (Math.abs(npvMid) < 0.01) {
              calculatedIrr = mid * 100;
              found = true;
              break;
            }
            if (npvMid * npvLow < 0) high = mid;
            else low = mid;
          }
          if (!found) calculatedIrr = ((low + high) / 2) * 100;
        } else {
          calculatedIrr = roi > 0 ? roi * 0.9 : 0;
        }
      }

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Berikan analisis kelayakan investasi mendalam dan berikan ulasan komprehensif, rekomendasi mitigasi risiko, serta peluang geospasial spesifik di Kabupaten Luwu kawan.`,
          investmentContext: matchingInv ? {
            name: matchingInv.name,
            sector: matchingInv.sector,
            subSector: matchingInv.subSector || '',
            areaHa: matchingInv.areaHa,
            investmentValue: matchingInv.investmentValue,
            districtId: matchingInv.districtId
          } : undefined,
          simulationContext: {
            name: projectName,
            capex: numCapex,
            opex: numOpex,
            asumsiPendapatan: numRevenue,
            roi: roi,
            bep: bep,
            npv: calculatedNpv,
            irr: calculatedIrr,
            isUsingOSS
          },
          language: 'id'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghubungi AI Server.");
      }

      setAiAnalysisResult(data.text || "AI tidak mengembalikan analisis. Sila hubungi sys-admin.");
    } catch (err: any) {
      console.error("AI Analysis Failed:", err);
      setAiAnalysisResult(`⚠️ Gagal memuat analisis kelayakan AI: ${err.message || 'Koneksi terputus'}.\n\nSilakan pastikan bahwa kunci API Gemini telah terpasang dengan benar di menu Pengaturan / Settings AI Studio.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Compute stats based on loaded investments
  const stats = useMemo(() => {
    if (investments.length === 0) {
      return {
        totalOpportunities: 0,
        totalArea: 0,
        dominantSector: '-',
        avgRoiRange: '-',
        sectorData: [],
        topInvestments: []
      };
    }

    const totalOpportunities = investments.length;
    const totalArea = investments.reduce((sum, inv) => sum + (inv.areaHa || 0), 0);

    // Calculate dominant sector
    const sectorCounts: { [key: string]: number } = {};
    investments.forEach((inv) => {
      const secName = inv.sector || "Lainnya";
      sectorCounts[secName] = (sectorCounts[secName] || 0) + 1;
    });

    let dominantSector = "-";
    let maxCount = 0;
    Object.entries(sectorCounts).forEach(([sec, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantSector = sec;
      }
    });

    // Sector distribution for Pie chart
    const sectorData = Object.entries(sectorCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Find average ROI (or IRR) if available, otherwise estimate based on values
    let totalIrr = 0;
    let countWithIrr = 0;
    investments.forEach((inv: any) => {
      // Find within financials array or smartData
      const finObj = inv.financials?.[0] || {};
      const sdObj = inv.smartData || {};
      const irr = inv.npv !== undefined ? (inv.irr || 0) : (finObj.irr || finObj.irr_persen || sdObj.irr || 0);
      
      if (irr > 0) {
        totalIrr += irr;
        countWithIrr++;
      }
    });

    const avgIrr = countWithIrr > 0 ? totalIrr / countWithIrr : 14.5;
    const avgRoiRange = countWithIrr > 0 
      ? `${Math.max(5, Math.round(avgIrr - 3))}% - ${Math.round(avgIrr + 3)}%`
      : "12% - 18%";

    // Get Top 3 investments sorted by value or area
    const topInvestments = [...investments]
      .sort((a, b) => (b.investmentValue || 0) - (a.investmentValue || 0))
      .slice(0, 3);

    return {
      totalOpportunities,
      totalArea,
      dominantSector,
      avgRoiRange,
      sectorData,
      topInvestments
    };
  }, [investments]);

  const tabs = [
    { id: 'overview', label: t('dashboard.menuOverview', 'Overview'), icon: LayoutDashboard },
    { id: 'site-selection', label: t('dashboard.menuSiteSelection', 'AI Site Selection'), icon: MapPin },
    { id: 'verify', label: t('dashboard.menuVerify', 'NIB Verification'), icon: ShieldCheck },
    { id: 'simulation', label: t('dashboard.menuSimulation', 'Financial Simulation'), icon: Calculator },
    { id: 'testimonial', label: t('dashboard.menuTestimonial', 'Kirim Testimoni'), icon: MessageSquare },
  ];

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-200">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 z-20">
        <div className="flex items-center gap-2">
          <LuwuLogo className="h-8 w-8" />
          <span className="font-bold text-white tracking-tight">Investor Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher isDark={true} />
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white" aria-label="Toggle menu">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:flex items-center gap-3">
            <LuwuLogo className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-tight text-lg leading-tight">Investor</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Portal Luwu</span>
            </div>
          </div>
          
          <div className="flex-1 px-4 py-6 md:py-2 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-emerald-600/10 text-emerald-400 font-medium border border-emerald-500/20 shadow-inner' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={async () => {
                try {
                  if (!document.fullscreenElement) {
                    const elem = document.documentElement as any;
                    requestSmartFullscreen();
                  }
                } catch (err) {}
                await supabase.auth.signOut();
                document.cookie = 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure;';
                localStorage.removeItem("luwu_session_token");
                exitSmartFullscreen();
                navigate('/');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={18} />
              <span className="text-sm">{t('dashboard.logout', 'Keluar')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col">
        {/* Top Navbar */}
        <div className="hidden md:flex justify-between items-center pb-6 mb-2 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Investor Portal</span>
            <span className="text-slate-700">/</span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              {activeTab === 'overview' 
                ? t('dashboard.menuOverview', 'Ringkasan') 
                : activeTab === 'site-selection'
                  ? t('dashboard.menuSiteSelection', 'Rekomendasi Lokasi AI')
                  : activeTab === 'verify' 
                    ? t('dashboard.menuVerify', 'Verifikasi NIB') 
                    : activeTab === 'simulation'
                      ? t('dashboard.menuSimulation', 'Simulasi Finansial')
                      : t('dashboard.menuTestimonial', 'Kirim Testimoni')
              }
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher isDark={true} />
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase">
                IP
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-white leading-none">Investor</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-none">Standard Member</div>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">{t('dashboard.loadingAnalysis', 'Memuat Analisis Portal Investor...')}</p>
          </div>
        ) : error ? (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
              <X size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{t('dashboard.dbErrorTitle', 'Gagal Terhubung ke Database')}</h3>
              <p className="text-sm text-slate-400">{t('dashboard.dbErrorDesc', 'Kami tidak dapat memuat data investasi Kabupaten Luwu saat ini secara jujur. Silakan periksa koneksi Anda.')}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700/50 transition-all"
            >
              {t('dashboard.retry', 'Coba Ulang')}
            </button>
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 md:mt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-2">
                  <span>{t('dashboard.welcomeTitle', 'Selamat Datang di Portal Investor')}</span>
                  <Sparkles size={20} className="text-emerald-400 animate-pulse" />
                </h1>
                <p className="text-slate-400 text-sm">{t('dashboard.welcomeSub', 'Akses layanan, data spasial, dan simulasi kelayakan finansial secara terpadu di Kabupaten Luwu.')}</p>
              </div>
              <div className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl uppercase tracking-wider font-bold">
                {t('dashboard.onlineSyncActive', 'Online Sync Active')}
              </div>
            </div>

            {/* 1. Top Row: Quick Statistic Cards (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-emerald-500/30 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.05)] group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <Briefcase size={20} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white tracking-tight">
                  {stats.totalOpportunities} {t('investor.locations', 'Lokasi')}
                </div>
                <div className="text-sm font-semibold text-slate-300 mt-1">
                  {t('dashboard.totalOpportunities', 'Total Peluang Investasi')}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  {t('dashboard.totalOpportunitiesDesc', 'Peluang investasi terpetakan aktif')}
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-cyan-500/30 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.05)] group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Layers size={20} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white tracking-tight">
                  {stats.totalArea > 0 ? stats.totalArea.toLocaleString('id-ID') : '0'} Ha
                </div>
                <div className="text-sm font-semibold text-slate-300 mt-1">
                  {t('dashboard.totalLandArea', 'Total Luas Lahan')}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  {t('dashboard.totalLandAreaDesc', 'Kumulatif luas wilayah terdata')}
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-rose-500/30 transition-all hover:shadow-[0_0_15px_rgba(244,63,94,0.05)] group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white tracking-tight truncate max-w-full">
                  {stats.dominantSector}
                </div>
                <div className="text-sm font-semibold text-slate-300 mt-1">
                  {t('dashboard.dominantSector', 'Sektor Dominan')}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  {t('dashboard.dominantSectorDesc', 'Sektor potensi kontributor utama')}
                </div>
              </div>

              {/* Card 4 */}
              <div 
                id="rata-rata-roi-card" 
                className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                    <Percent size={20} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white tracking-tight">
                  {stats.avgRoiRange}
                </div>
                <div className="text-sm font-semibold text-slate-300 mt-1">
                  {t('dashboard.avgRoi', 'Rata-rata Estimasi ROI')}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  {t('dashboard.avgRoiDesc', 'Tingkat pengembalian modal rata-rata')}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center gap-2">
                  <span className="text-emerald-400/80">💡</span>
                  <p className="text-[10px] text-slate-400">
                    {t('dashboard.roiBenchmark', 'Benchmark Luwu: ~10% - 12% (Rata-rata sektor)')}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Middle Row: Spatial Highlights & Analytics (2 Columns: 60% / 40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column (60%): Top Rekomendasi Investasi */}
              <div className="lg:col-span-3 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">{t('dashboard.topRecommendations', 'Top Rekomendasi Investasi')}</h3>
                      <p className="text-xs text-slate-400">{t('dashboard.topRecommendationsDesc', 'Proyek strategis teratas berdasarkan nilai komitmen investasi')}</p>
                    </div>
                  </div>

                  {stats.topInvestments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-slate-800 border-dashed rounded-xl">
                      <Building2 className="w-10 h-10 mb-3 stroke-1 text-slate-600" />
                      <p className="text-sm font-medium">{t('dashboard.emptyInvestmentData', 'Belum ada data investasi diinput secara terpadu')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.topInvestments.map((inv) => {
                        const color = SECTOR_COLORS[inv.sector as SektorInvestasi] || "#64748b";
                        return (
                          <div 
                            key={inv.id}
                            className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 hover:border-slate-700 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
                          >
                            <div className="flex items-center gap-4 truncate">
                              <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800 relative">
                                <img 
                                  src={inv.photoUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200"} 
                                  alt={inv.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="truncate">
                                <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors truncate">
                                  {inv.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <span 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: `${color}15`, color: color }}
                                  >
                                    {inv.sector}
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <MapPin size={10} /> {inv.areaHa} Ha
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2">
                              <span className="text-xs font-bold font-mono text-emerald-400">
                                {formatRupiahSingkat(inv.investmentValue)}
                              </span>
                              <button
                                onClick={() => setSelectedInvestmentId(inv.id)}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                              >
                                <span>{t('dashboard.viewDetails', 'Lihat Detail')}</span>
                                <ArrowUpRight size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {stats.topInvestments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-end">
                    <button 
                      onClick={() => {
                        try {
                          if (!document.fullscreenElement) {
                            const elem = document.documentElement as any;
                            requestSmartFullscreen()
                          }
                        } catch (e) {}
                        exitSmartFullscreen();
                        navigate('/?skipSplash=true');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                    >
                      <span>{t('dashboard.exploreMoreMap', 'Eksplor Peta Selengkapnya')}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column (40%): Distribusi Sektor */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{t('dashboard.sectorDistribution', 'Distribusi Sektor')}</h3>
                  <p className="text-xs text-slate-400 mb-6">{t('dashboard.sectorDistributionDesc', 'Persentase sebaran jenis investasi terdata')}</p>

                  {stats.sectorData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                      <div className="w-24 h-24 rounded-full border-2 border-slate-800 border-dashed flex items-center justify-center mb-4">
                        <Percent size={24} className="text-slate-700" />
                      </div>
                      <p className="text-xs text-center px-4">{t('dashboard.emptySectorData', 'Belum ada data sektor investasi diinput.')}</p>
                    </div>
                  ) : (
                    <div className="relative h-48 min-h-[192px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={stats.sectorData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {stats.sectorData.map((entry, index) => {
                              const color = SECTOR_COLORS[entry.name as SektorInvestasi] || "#64748b";
                              return (
                                <Cell key={`cell-${index}`} fill={color} />
                              );
                            })}
                          </Pie>
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              borderColor: '#1e293b', 
                              borderRadius: '12px',
                              color: '#f8fafc',
                              fontSize: '11px',
                              fontFamily: 'sans-serif'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-white">{stats.totalOpportunities}</span>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">{t('dashboard.projects', 'Proyek')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {stats.sectorData.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1 mt-4">
                    {stats.sectorData.map((item) => {
                      const color = SECTOR_COLORS[item.name as SektorInvestasi] || "#64748b";
                      const percentage = ((item.value / stats.totalOpportunities) * 100).toFixed(0);
                      return (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                            <span className="text-slate-300 truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="text-slate-400 font-medium">({item.value})</span>
                            <span className="text-white font-bold">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Bottom Row: Action Center & NIB Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Status Verifikasi NIB */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{t('dashboard.nibStatus', 'Status Verifikasi NIB')}</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">
                    {t('dashboard.nibEmptyState', 'Belum ada NIB yang diajukan untuk diverifikasi secara hukum oleh instansi terkait. Silakan ajukan NIB Anda untuk terhubung ke jaringan investasi Luwu.')}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('verify')}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide border border-slate-700/50 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <span>{t('dashboard.btnGoVerify', 'Buka Form Verifikasi')}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Right Column: Action Center */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{t('dashboard.actionCenter', 'Action Center')}</h3>
                  </div>
                  <p className="text-slate-400 text-sm">{t('dashboard.actionCenterDesc', 'Akses cepat menu navigasi dan analisis cerdas.')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      try {
                        if (!document.fullscreenElement) {
                          const elem = document.documentElement as any;
                          requestSmartFullscreen()
                        }
                      } catch (e) {}
                      exitSmartFullscreen();
                        navigate('/?skipSplash=true');
                    }}
                    className="group p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 rounded-2xl transition-all duration-300 text-left flex items-start justify-between"
                  >
                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Map size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-xs">{t('dashboard.spatialWebGis', 'Peta Spasial (WebGIS)')}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">{t('dashboard.spatialWebGisDesc', 'Eksplor layer tata ruang 3D Luwu.')}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </button>

                  <button 
                    onClick={() => setActiveTab('simulation')}
                    className="group p-4 bg-slate-950 border border-slate-800 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-2xl transition-all duration-300 text-left flex items-start justify-between"
                  >
                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Calculator size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors text-xs">{t('dashboard.startSimulation', 'Mulai Simulasi')}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">{t('dashboard.startSimulationDesc', 'Hitung kelayakan finansial & ROI.')}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'site-selection' ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
            <AISiteSelection />
          </div>
        ) : activeTab === 'verify' ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300">
            <NibVerificationForm isDarkMode={true} />
          </div>
        ) : activeTab === 'simulation' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Page Header (Intelegensi Bisnis) */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 p-6 border border-slate-800/80">
              <div className="absolute top-0 right-0 w-80 h-40 bg-blue-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
              <div className="absolute bottom-0 left-0 w-60 h-30 bg-emerald-500/5 blur-3xl rounded-full -ml-20 -mb-10" />
              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-cyan-400 bg-cyan-400/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-pulse">
                  ✨ POWERED BY AI & SPATIAL LOGIC
                </span>
                <h1 className="text-3xl font-black text-white tracking-tight">{t('business_intelligence', 'Intelegensi Bisnis')}</h1>
                <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
                  {t('business_intel_desc', 'Lakukan simulasi finansial mendalam dan dapatkan rekomendasi strategis melalui Konsultan AI khusus Investasi Luwu.')}
                </p>
              </div>
            </div>

            {/* Financial State Calculations on the Fly */}
            {(() => {
              const numCapex = parseFloat(capex) || 0;
              const numOpex = parseFloat(opex) || 0;
              const numRevenue = parseFloat(revenue) || 0;
              const numWacc = parseFloat(discountRate) || 10;
              const numTenor = parseInt(tenor) || 5;
              const numInflation = parseFloat(inflationRate) || 4.5;

              const labaBersih = numRevenue - numOpex;
              const roiTahunan = numCapex > 0 ? (labaBersih / numCapex) * 100 : 0;
              const roiKumulatif = numCapex > 0 ? ((labaBersih * numTenor) / numCapex) * 100 : 0;

              // Simple Payback
              const paybackSederhana = labaBersih > 0 ? numCapex / labaBersih : -1;

              // Discounted cash flows & payback
              const discountedCF: number[] = [];
              let cumulativeDiscountedCF = 0;
              let paybackDiskonto = -1;

              for (let t = 1; t <= numTenor; t++) {
                const inflationFactor = Math.pow(1 + (numInflation / 100), t);
                const cf = labaBersih * inflationFactor;
                const dcf = cf / Math.pow(1 + (numWacc / 100), t);
                discountedCF.push(dcf);
                
                const prevSum = cumulativeDiscountedCF;
                cumulativeDiscountedCF += dcf;
                
                if (cumulativeDiscountedCF >= numCapex && paybackDiskonto === -1) {
                  const remaining = numCapex - prevSum;
                  const fraction = remaining / dcf;
                  paybackDiskonto = (t - 1) + fraction;
                }
              }

              const npv = cumulativeDiscountedCF - numCapex;

              // IRR Bisection method:
              const calculateNPVForIRR = (r: number, infRate: number) => {
                let sum = 0;
                for (let t = 1; t <= numTenor; t++) {
                  const inflationFactor = Math.pow(1 + (infRate / 100), t);
                  sum += (labaBersih * inflationFactor) / Math.pow(1 + r, t);
                }
                return sum - numCapex;
              };

              let irr = 0;
              if (labaBersih > 0) {
                let low = -0.99;
                let high = 5.0; // up to 500%
                let found = false;
                const npvLow = calculateNPVForIRR(low, numInflation);
                const npvHigh = calculateNPVForIRR(high, numInflation);
                if (npvLow * npvHigh < 0) {
                  for (let i = 0; i < 100; i++) {
                    const mid = (low + high) / 2;
                    const npvMid = calculateNPVForIRR(mid, numInflation);
                    if (Math.abs(npvMid) < 0.0001) {
                      irr = mid * 100;
                      found = true;
                      break;
                    }
                    if (npvMid * npvLow < 0) {
                      high = mid;
                    } else {
                      low = mid;
                    }
                  }
                  if (!found) {
                    irr = ((low + high) / 2) * 100;
                  }
                } else {
                  irr = roiTahunan > 0 ? roiTahunan * 0.9 : 0;
                }
              }

              // Determine project viability status
              let isViable = false;
              let viabilityText = i18n.language?.startsWith("zh")
                ? "不可行 (高风险)"
                : i18n.language?.startsWith("en")
                  ? "Not Feasible (High Risk)"
                  : "Tidak Layak (Risiko Tinggi)";
              let viabilityColorClass = "text-rose-400 bg-rose-500/10 border-rose-500/20";
              if (npv > 0 && irr > numWacc) {
                isViable = true;
                viabilityText = i18n.language?.startsWith("zh")
                  ? "非常可行 (推荐)"
                  : i18n.language?.startsWith("en")
                    ? "Highly Feasible (Recommended)"
                    : "Sangat Layak (Direkomendasikan)";
                viabilityColorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
              } else if (npv > 0) {
                isViable = true;
                viabilityText = i18n.language?.startsWith("zh")
                  ? "基本可行 (需要监测)"
                  : i18n.language?.startsWith("en")
                    ? "Feasible Enough (Needs Monitoring)"
                    : "Cukup Layak (Perlu Pemantauan)";
                viabilityColorClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
              } else if (labaBersih > 0) {
                viabilityText = i18n.language?.startsWith("zh")
                  ? "临界状态 (中等风险)"
                  : i18n.language?.startsWith("en")
                    ? "Marginal (Medium Risk)"
                    : "Marjinal (Risiko Sedang)";
                viabilityColorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
              }

              // Generate sensitivity chart data
              const rates = [2, 6, 10, 14, 18, 22, 26];
              const chartData = rates.map(rate => {
                const rDecimal = rate / 100;
                
                // 1. Baseline NPV
                let npvBaseline = 0;
                for (let t = 1; t <= numTenor; t++) {
                  const infFactor = Math.pow(1 + (numInflation / 100), t);
                  npvBaseline += (labaBersih * infFactor) / Math.pow(1 + rDecimal, t);
                }
                npvBaseline -= numCapex;

                // 2. High Inflation (+5%)
                let npvHighInf = 0;
                for (let t = 1; t <= numTenor; t++) {
                  const infFactor = Math.pow(1 + ((numInflation + 5) / 100), t);
                  npvHighInf += (labaBersih * infFactor) / Math.pow(1 + rDecimal, t);
                }
                npvHighInf -= numCapex;

                // 3. No Inflation
                let npvNoInf = 0;
                for (let t = 1; t <= numTenor; t++) {
                  npvNoInf += labaBersih / Math.pow(1 + rDecimal, t);
                }
                npvNoInf -= numCapex;

                return {
                  rate: `${rate}%`,
                  "Baseline NPV": Math.round(npvBaseline / 1000000), // convert to Millions
                  "Skenario Inflasi +5%": Math.round(npvHighInf / 1000000),
                  "Skenario Tanpa Inflasi": Math.round(npvNoInf / 1000000),
                };
              });

              const handleDownloadPDF = async () => {
                setIsPdfGenerating(true);
                try {
                  const doc = new jsPDF('p', 'mm', 'a4');
                  const pageWidth = doc.internal.pageSize.getWidth();
                  const pageHeight = doc.internal.pageSize.getHeight();

                  // Draw a beautiful emerald header banner
                  doc.setFillColor(16, 185, 129); // Emerald color
                  doc.rect(0, 0, pageWidth, 12, 'F');

                  // Top-left brand
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(10);
                  doc.setTextColor(255, 255, 255);
                  doc.text('INVESTLUWU HUB • PEMKAB LUWU', 15, 8);

                  // Rest of text content below the top banner
                  let currentY = 24;

                  // Main Header Branding
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(18);
                  doc.setTextColor(15, 23, 42); // slate-900
                  doc.text('PROSPEKTUS INVESTASI KABUPATEN LUWU', 15, currentY);

                  currentY += 7;
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(11);
                  doc.setTextColor(71, 85, 105); // slate-600
                  doc.text('Simulasi Cerdas - InvestLuwu Hub 5.0', 15, currentY);

                  // Divider Line
                  currentY += 5;
                  doc.setDrawColor(226, 232, 240); // slate-200
                  doc.setLineWidth(0.5);
                  doc.line(15, currentY, pageWidth - 15, currentY);

                  // Metadata Section
                  currentY += 10;
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(11);
                  doc.setTextColor(15, 23, 42);
                  doc.text('INFORMASI PROPOSAL & SIMULASI', 15, currentY);

                  currentY += 8;
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(10);
                  doc.setTextColor(71, 85, 105);
                  doc.text('Nama Perusahaan / Investor:', 15, currentY);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(15, 23, 42);
                  doc.text(companyName || 'PT. Luwu Maju Sejahtera', 70, currentY);

                  // Get sector/potential name
                  currentY += 6;
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(71, 85, 105);
                  doc.text('Potensi Investasi Target:', 15, currentY);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(15, 23, 42);
                  const matchedInv = investments.find(inv => inv.id === targetPotential || inv.name.toLowerCase().replace(/\s+/g, '_') === targetPotential);
                  const targetNameText = matchedInv ? `${matchedInv.name} (${matchedInv.sector})` : 'Agroindustri Kopi Latimojong';
                  doc.text(targetNameText, 70, currentY);

                  // Inputs and Timestamp
                  currentY += 6;
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(71, 85, 105);
                  doc.text('Tanggal Pembuatan:', 15, currentY);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(15, 23, 42);
                  doc.text(new Date().toLocaleString('id-ID'), 70, currentY);

                  // Let's add simulation parameter values
                  currentY += 10;
                  doc.setFillColor(248, 250, 252); // slate-50
                  doc.roundedRect(15, currentY, pageWidth - 30, 28, 3, 3, 'F');

                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(9);
                  doc.setTextColor(71, 85, 105);
                  doc.text('ASUMSI & PARAMETER SIMULASI:', 20, currentY + 6);

                  doc.setFont('helvetica', 'normal');
                  doc.text(`CAPEX: Rp ${formatRupiah(numCapex)}`, 20, currentY + 12);
                  doc.text(`OPEX per Tahun: Rp ${formatRupiah(numOpex)}`, 20, currentY + 18);
                  doc.text(`Pendapatan Tahunan: Rp ${formatRupiah(numRevenue)}`, 20, currentY + 24);

                  doc.text(`Suku Bunga Diskonto (WACC): ${discountRate}%`, 115, currentY + 12);
                  doc.text(`Tenor Proyeksi: ${tenor} Tahun`, 115, currentY + 18);
                  doc.text(`Laju Inflasi Tahunan: ${inflationRate}%`, 115, currentY + 24);

                  // Now capture and embed the financial results grid
                  currentY += 34;

                  const resultsElement = document.getElementById('financial-simulator-results-export');
                  if (resultsElement) {
                    const resultsElementReady = await waitForDomAndIdle(resultsElement, 3000);
                    const canvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(resultsElementReady, {
                      scale: 2,
                      useCORS: true,
                      backgroundColor: '#090d16',
                    }));
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = pageWidth - 30; // Margin 15 on each side
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    
                    doc.addImage(imgData, 'PNG', 15, currentY, imgWidth, imgHeight);
                  }

                  // Footer
                  doc.setFont('helvetica', 'italic');
                  doc.setFontSize(8);
                  doc.setTextColor(148, 163, 184); // slate-400
                  doc.text(
                    'Dokumen ini dihasilkan secara otomatis oleh Konsultan AI InvestLuwu. Untuk validasi tata ruang, hubungi DPMPTSP Kabupaten Luwu.',
                    pageWidth / 2,
                    pageHeight - 12,
                    { align: 'center' }
                  );

                  doc.save('Proposal_Investasi_Luwu.pdf');

                  Swal.fire({
                    title: 'Proposal Berhasil Diunduh!',
                    text: 'Prospektus investasi PDF siap dibagikan.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#0f172a',
                    color: '#f8fafc',
                  });
                } catch (err) {
                  console.error('Failed to generate PDF:', err);
                  Swal.fire({
                    title: 'Gagal Mengunduh Proposal',
                    text: 'Terjadi kesalahan saat memproses ekspor PDF.',
                    icon: 'error',
                    background: '#0f172a',
                    color: '#f8fafc',
                  });
                } finally {
                  setIsPdfGenerating(false);
                }
              };

              return (
                <div className="space-y-8">
                  {/* 2. Form Section (Simulator Return on Investment) */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide">{t('roi_simulator', 'Simulator Return on Investment')}</h3>
                      <p className="text-xs text-slate-400 mt-1">{t('roi_simulator_desc', 'Sesuaikan nilai investasi dan asumsi makro untuk memprediksi profitabilitas secara real-time.')}</p>
                    </div>

                    {/* Target Potensi Investasi (Full Width Select) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        {t('target_investment', 'Target Potensi Investasi')}
                      </label>
                      <select
                        value={targetPotential}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetPotential(val);
                          const matched = investments.find(inv => inv.id === val || inv.name.toLowerCase().replace(/\s+/g, '_') === val);
                          if (matched) {
                            setCapex("");
                            setOpex("");
                            setRevenue(String(Math.round((matched.investmentValue || 5000000000) * 0.35)));
                          }
                        }}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-white text-sm focus:outline-none transition-colors font-semibold"
                      >
                        <option value="agroindustri_latimojong">Agroindustri Kopi Latimojong (Default Simulasi)</option>
                        {investments.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.sector}) - {formatRupiahSingkat(inv.investmentValue || 0)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Main Inputs (3 Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start w-full border border-slate-800 bg-slate-900/40 rounded-xl p-4">
                      <div className="md:col-span-2">
                        <OssRoiSimulatorInputs
                            sector={investments.find(inv => inv.id === targetPotential || inv.name.toLowerCase().replace(/\s+/g, '_') === targetPotential)?.sector || null}
                            capital={capex}
                            setCapital={setCapex}
                            opex={opex}
                            setOpex={setOpex}
                            isDark={true}
                            textMuted="text-slate-500"
                            inputBg="bg-slate-950 text-white border-slate-800 focus:border-cyan-500/50"
                            useDetailed={isUsingOSS}
                            setUseDetailed={setIsUsingOSS}
                        />
                      </div>

                      {/* Revenue Input */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t('est_revenue', 'Estimasi Pendapatan Tahunan')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono font-bold">Rp</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={revenue}
                            onFocus={(e) => {
                              e.target.select();
                              setRevenue("");
                            }}
                            onChange={(e) => setRevenue(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-white text-sm focus:outline-none transition-colors font-mono font-bold"
                            placeholder="e.g. 1800000000"
                          />
                        </div>
                        <p className="text-[10px] text-emerald-400/80 font-mono tracking-tight pl-1">
                          {formatRupiah(numRevenue)} {numRevenue > 0 ? `(${formatRupiahSingkat(numRevenue)})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Advanced Parameters (3 Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 items-start w-full border border-slate-800 bg-slate-900/40 rounded-xl p-4 mt-6">
                      {/* WACC */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t('discount_rate', 'Suku Bunga Diskonto / WACC (%)')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={discountRate}
                            onFocus={(e) => {
                              e.target.select();
                              setDiscountRate("");
                            }}
                            onChange={(e) => setDiscountRate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-white text-sm focus:outline-none transition-colors font-mono font-bold"
                            placeholder="10"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono font-bold">%</span>
                        </div>
                      </div>

                      {/* Tenor */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t('tenor', 'Tenor Proyeksi Investasi (Tahun)')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={tenor}
                            onFocus={(e) => {
                              e.target.select();
                              setTenor("");
                            }}
                            onChange={(e) => setTenor(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-white text-sm focus:outline-none transition-colors font-mono font-bold"
                            placeholder="5"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono font-bold">Thn</span>
                        </div>
                      </div>

                      {/* Inflation */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t('inflation_rate', 'Laju Inflasi Tahunan (%)')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={inflationRate}
                            onFocus={(e) => {
                              e.target.select();
                              setInflationRate("");
                            }}
                            onChange={(e) => setInflationRate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-white text-sm focus:outline-none transition-colors font-mono font-bold"
                            placeholder="4.5"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono font-bold">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button Container */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSimRunCount(p => p + 1);
                          Swal.fire({
                            title: t('dashboard.calculationSuccess', 'Kalkulasi Selesai!'),
                            text: t('dashboard.calculationSuccessText', 'Hasil simulasi finansial dan grafik sensitivitas NPV telah diperbarui.'),
                            icon: 'success',
                            toast: true,
                            position: 'top-end',
                            timer: 3000,
                            showConfirmButton: false,
                            background: '#0f172a',
                            color: '#f8fafc',
                          });
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm w-full"
                      >
                        <Calculator size={18} className="text-white shrink-0" />
                        <span>{t('dashboard.calculateViabilityBtn', 'Hitung Prediksi Kelayakan')}</span>
                      </button>

                      <button
                        type="button"
                        disabled={simRunCount === 0 || isPdfGenerating}
                        onClick={handleDownloadPDF}
                        className={`flex-1 font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-sm border ${
                          simRunCount === 0 
                            ? 'border-slate-800 text-slate-500 bg-slate-900/20 cursor-not-allowed opacity-50' 
                            : 'border-emerald-500/80 hover:border-emerald-400 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        }`}
                      >
                        {isPdfGenerating ? (
                          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                        ) : (
                          <FileText size={18} className={simRunCount === 0 ? "text-slate-500 shrink-0" : "text-emerald-400 shrink-0"} />
                        )}
                        <span>{isPdfGenerating ? t('dashboard.generatingPdf', 'Membuat Proposal...') : t('dashboard.downloadProposalBtn', '📄 Download Proposal Investasi (PDF)')}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Results Grid (6 Metric Cards) */}
                  <div id="financial-simulator-results-export" className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-6 rounded-3xl border border-slate-800">
                    {/* Card 1: Estimasi ROI */}
                    <div 
                      id="rata-rata-roi-card"
                      className={`relative rounded-3xl border p-6 group transition-all duration-300 ${
                        roiFlash 
                          ? 'bg-emerald-500/20 border-emerald-500/50 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform duration-300">
                          <Percent size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full">
                          Return
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-white font-mono tracking-tight">
                          {roiTahunan.toFixed(2)}%
                        </div>
                        <div className="text-sm font-bold text-slate-200">
                          {t('financial.roiAnnual', 'ROI Tahunan (Rata-rata)')}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-400">{t('financial.roiCumulativeDynamic', 'ROI Kumulatif ({{years}} Thn)', { years: numTenor })}:</span>
                        <span className="font-mono font-bold text-cyan-400">{roiKumulatif.toFixed(1)}%</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                        <span className="text-emerald-400/80">💡</span>
                        <p className="text-xs text-slate-400">
                          {t('dashboard.roiBenchmark', 'Benchmark Luwu: ~10% - 12% (Rata-rata sektor)')}
                        </p>
                      </div>
                      {/* Tooltip (appears on card hover) */}
                      <div className="absolute opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 bg-slate-800 text-xs text-slate-300 p-2.5 rounded-xl shadow-2xl border border-slate-700 z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap">
                        {i18n.language?.startsWith("zh") ? "公式：(年净利润 / 总资本支出) × 100%" : i18n.language?.startsWith("en") ? "Formula: (Annual Net Profit / Total CAPEX) × 100%" : "Rumus: (Laba Bersih Tahunan / Total Nilai CAPEX) × 100%"}
                      </div>
                    </div>

                    {/* Card 2: Periode Pengembalian (BEP) */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-6 group transition-all duration-300 hover:border-slate-700">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                          <Briefcase size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-full">
                          Payback
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-white font-mono tracking-tight">
                          {paybackSederhana > 0 ? `${paybackSederhana.toFixed(1)} ${t('roiSimulator.years', 'Tahun')}` : 'N/A'}
                        </div>
                        <div className="text-sm font-bold text-slate-200">
                          {t('financial.paybackSimple', 'Payback Sederhana')}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-400">{t('financial.paybackDiscountedDynamic', 'Payback Diskonto ({{rate}}%)', { rate: numWacc })}:</span>
                        <span className="font-mono font-bold text-indigo-400">
                          {paybackDiskonto > 0 ? `${paybackDiskonto.toFixed(1)} ${t('roiSimulator.years', 'Tahun')}` : i18n.language?.startsWith("zh") ? "不回收 / > 期限" : i18n.language?.startsWith("en") ? "N/A / > Tenor" : "N/A / > Tenor"}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Laba Bersih Tahunan */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-6 group transition-all duration-300 hover:border-slate-700">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform duration-300">
                          <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                          EBITDA
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight truncate">
                          {formatRupiah(labaBersih)}
                        </div>
                        <div className="text-sm font-bold text-slate-200">
                          {t('roiSimulator.netProfit', 'Laba Bersih Tahunan')}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-400">{i18n.language?.startsWith("zh") ? "总预计收益:" : i18n.language?.startsWith("en") ? "Total Projected Receipts:" : "Total Proyeksi Penerimaan:"}</span>
                        <span className="font-mono font-bold text-emerald-400">{formatRupiahSingkat(labaBersih * numTenor)}</span>
                      </div>
                    </div>

                    {/* Card 4: Kelayakan */}
                    <div className={`relative overflow-hidden rounded-3xl border p-6 group transition-all duration-300 ${isViable ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-rose-500/20 bg-rose-950/10'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${isViable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} group-hover:scale-105 transition-transform duration-300`}>
                          <ShieldCheck size={20} />
                        </div>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isViable ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                          Status
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-xl sm:text-2xl font-black font-sans tracking-tight ${isViable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {viabilityText}
                        </div>
                        <div className="text-sm font-bold text-slate-200">
                          Kelayakan Proyek
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-xs text-slate-400">
                        <span>Berdasarkan kriteria standar finansial & geospasial DPMPTSP Luwu.</span>
                      </div>
                    </div>

                    {/* Card 5: Net Present Value (NPV) */}
                    <div className={`relative overflow-hidden rounded-3xl border p-6 group transition-all duration-300 ${npv > 0 ? 'border-emerald-500/20 bg-slate-900/40 hover:border-emerald-500/40' : 'border-rose-500/20 bg-slate-900/40 hover:border-rose-500/40'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${npv > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          <Sparkles size={20} />
                        </div>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${npv > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                          NPV
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight truncate ${npv > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {npv > 0 ? '+' : ''}{formatRupiah(npv)}
                        </div>
                        <div className="text-sm font-bold text-slate-200">
                          {t('financial.npvTitle', 'Net Present Value (NPV)')}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-400">{i18n.language?.startsWith("zh") ? "可行性阈值 (NPV > 0)：" : i18n.language?.startsWith("en") ? "Feasibility Threshold (NPV > 0):" : "Threshold Kelayakan (NPV > 0):"}</span>
                        <span className={`font-mono font-bold ${npv > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {npv > 0 
                            ? (i18n.language?.startsWith("zh") ? "符合 / 可行" : i18n.language?.startsWith("en") ? "Feasible" : "Sesuai / Layak")
                            : (i18n.language?.startsWith("zh") ? "不符合" : i18n.language?.startsWith("en") ? "Less Feasible" : "Kurang Layak")
                          }
                        </span>
                      </div>
                    </div>

                    {/* Card 6: Internal Rate of Return (IRR) */}
                    <div className={`relative overflow-hidden rounded-3xl border p-6 group transition-all duration-300 ${irr > numWacc ? 'border-emerald-500/20 bg-slate-900/40 hover:border-emerald-500/40' : 'border-rose-500/20 bg-slate-900/40 hover:border-rose-500/40'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${irr > numWacc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          <Layers size={20} />
                        </div>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${irr > numWacc ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                          IRR
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-3xl font-black font-mono tracking-tight truncate ${irr > numWacc ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {irr.toFixed(2)}%
                        </div>
                        <div className="text-sm font-bold text-slate-200">
                          Internal Rate of Return (IRR)
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-400">{i18n.language?.startsWith("zh") ? `资金成本 / WACC (${numWacc}%)：` : i18n.language?.startsWith("en") ? `Cost of Capital / WACC (${numWacc}%):` : `Biaya Modal / WACC (${numWacc}%):`}</span>
                        <span className={`font-mono font-bold ${irr > numWacc ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {irr > numWacc 
                            ? (i18n.language?.startsWith("zh") ? "IRR > WACC (可行)" : i18n.language?.startsWith("en") ? "IRR > WACC (Feasible)" : "IRR > WACC (Layak)")
                            : (i18n.language?.startsWith("zh") ? "IRR < WACC (有风险)" : i18n.language?.startsWith("en") ? "IRR < WACC (Risky)" : "IRR < WACC (Berisiko)")
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Chart Section: Visualisasi Analisis Sensitivitas NPV */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        {i18n.language?.startsWith("zh") ? "NPV 敏感性分析可视化" : i18n.language?.startsWith("en") ? "NPV Sensitivity Analysis Visualization" : "Visualisasi Analisis Sensitivitas NPV"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {i18n.language?.startsWith("zh") 
                          ? "三种宏观经济情景下，基于 WACC (贴现率) 波动的 NPV 趋势。" 
                          : i18n.language?.startsWith("en") 
                            ? "NPV movement based on WACC (discount rate) fluctuations under three macroeconomic scenarios." 
                            : "Pergerakan NPV berdasarkan fluktuasi WACC (Suku Bunga Diskonto) di bawah tiga skenario makroekonomi."}
                      </p>
                    </div>

                    <div className="h-80 min-h-[320px] w-full font-mono text-xs relative">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                        >
                          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="rate" 
                            stroke="#64748b" 
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            tickLine={false}
                            label={{ value: i18n.language?.startsWith("zh") ? 'NPV (百万印尼盾)' : i18n.language?.startsWith("en") ? 'NPV (Million Rp)' : 'NPV (Juta Rp)', angle: -90, position: 'insideLeft', fill: '#64748b', style: { textAnchor: 'middle' } }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#020617", borderColor: "rgba(16, 185, 129, 0.3)", borderRadius: "12px" }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                            itemStyle={{ color: '#f8fafc' }}
                          />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                          <ReferenceLine 
                            y={0} 
                            stroke="#ef4444" 
                            strokeWidth={1.5}
                            strokeDasharray="4 4" 
                            label={{ value: i18n.language?.startsWith("zh") ? '可行性阈值 (NPV=0)' : i18n.language?.startsWith("en") ? 'Feasibility Threshold (NPV=0)' : 'Ambang Kelayakan (NPV=0)', fill: '#f43f5e', position: 'top', fontSize: 10 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Baseline NPV" 
                            name={i18n.language?.startsWith("zh") ? "基线 NPV" : i18n.language?.startsWith("en") ? "Baseline NPV" : "Baseline NPV"}
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Skenario Inflasi +5%" 
                            name={i18n.language?.startsWith("zh") ? "高通胀情景 (+5%)" : i18n.language?.startsWith("en") ? "Inflation Scenario (+5%)" : "Skenario Inflasi +5%"}
                            stroke="#ef4444" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 3 }} 
                            activeDot={{ r: 5 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Skenario Tanpa Inflasi" 
                            name={i18n.language?.startsWith("zh") ? "无通胀情景" : i18n.language?.startsWith("en") ? "No Inflation Scenario" : "Skenario Tanpa Inflasi"}
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ r: 3 }} 
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Interpretasi Sensitivitas Finansial */}
                    <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {i18n.language?.startsWith("zh") ? "财务敏感性分析解读" : i18n.language?.startsWith("en") ? "Financial Sensitivity Interpretation" : "Interpretasi Sensitivitas Finansial"}
                      </h4>
                      <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                        <p>
                          {i18n.language?.startsWith("zh") 
                            ? "横轴表示 WACC / 贴现率从 2% 到 26% 的变化。红色虚线表示 NPV = 0 的边界。如果情景曲线位于此边界上方，则该项目被认为在财务上是可行的。通胀 +5% 情景模拟了未来的成本增加，而无通胀情景则代表完全稳定的市场条件。" 
                            : i18n.language?.startsWith("en") 
                              ? "The horizontal axis shows variations in WACC / Discount Rate from 2% to 26%. The red dashed line marks the NPV = 0 threshold. If a scenario line is above this threshold, the project is financially feasible. The Inflation +5% Scenario simulates future cost increases, while the No Inflation Scenario represents stable market conditions." 
                              : "Sumbu horizontal menunjukkan variasi WACC / Suku Bunga Diskonto dari 2% hingga 26%. Garis putus-putus merah menandakan batas NPV = 0. Jika garis skenario berada di atas batas ini, proyek dinilai layak secara finansial. Skenario Inflasi +5% menyimulasikan peningkatan biaya di masa mendatang, sedangkan Skenario Tanpa Inflasi mewakili kondisi pasar yang sepenuhnya stabil."
                          }
                        </p>
                        <p className="text-[11px] text-cyan-400/90 font-semibold">
                          {i18n.language?.startsWith("zh") 
                            ? "💡 敏感性分析：NPV 曲线越平缓，项目对贴现率冲击的抵御能力就越强。如果 Luwu 的实际贴现率低于 NPV=0 的交点，您的投资就是安全的。" 
                            : i18n.language?.startsWith("en") 
                              ? "💡 Sensitivity Analysis: The flatter the NPV curve, the more resilient the project is to discount rate shocks. If Luwu's actual WACC remains below the NPV=0 intersection point, your investment is secure." 
                              : "💡 Analisis Sensitivitas: Semakin landai kurva NPV, semakin resilien proyek terhadap guncangan suku bunga diskonto. Jika nilai WACC aktual Luwu berada di bawah titik persimpangan NPV=0, maka investasi Anda dijamin aman."
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 6. Footer Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="button"
                      onClick={triggerAiAnalysis}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide uppercase"
                    >
                      <Sparkles size={16} className="text-cyan-300 animate-pulse" />
                      <span>{i18n.language?.startsWith("zh") ? "请求 AI 可行性分析 ✨" : i18n.language?.startsWith("en") ? "REQUEST AI FEASIBILITY ANALYSIS ✨" : "MINTA ANALISIS KELAYAKAN AI ✨"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="flex-1 border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-bold py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide uppercase"
                    >
                      <Map size={16} className="text-emerald-400" />
                      <span>{i18n.language?.startsWith("zh") ? "卢乌潜力分析 🗺️" : i18n.language?.startsWith("en") ? "LUWU POTENTIAL ANALYSIS 🗺️" : "ANALISIS POTENSI LUWU 🗺️"}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{t('submit_testimonial', 'Kirim Testimoni')}</h1>
              <p className="text-slate-400 text-sm">{t('testimonial_desc', 'Sampaikan cerita sukses atau tanggapan Anda mengenai ekosistem investasi di Kabupaten Luwu.')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column (Form) */}
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!companyName.trim() || !testiMessage.trim()) {
                    Swal.fire({
                      title: t('dashboard.testiErrorTitle', 'Gagal'),
                      text: t('dashboard.testiErrorFields', 'Harap isi semua kolom form.'),
                      icon: 'error',
                      background: '#0f172a',
                      color: '#f8fafc',
                      confirmButtonColor: '#10b981'
                    });
                    return;
                  }
                  
                  setIsSubmittingTesti(true);
                  try {
                    const { data, error } = await supabase
                      .from('investor_testimonials')
                      .insert([
                        {
                          company_name: companyName,
                          sector: testiSector,
                          message: testiMessage,
                          is_verified: false,
                          created_at: new Date().toISOString()
                        }
                      ]);

                    if (error) throw error;
                    
                    Swal.fire({
                      title: t('dashboard.testiSuccessTitle', 'Berhasil!'),
                      text: t('dashboard.testiSuccessText', 'Testimoni berhasil dikirim dan menunggu verifikasi oleh tim administrator DPMPTSP Luwu.'),
                      icon: 'success',
                      background: '#0f172a',
                      color: '#f8fafc',
                      confirmButtonColor: '#10b981'
                    });

                    setTestiMessage('');
                    setTestiSector('Agroindustri');
                  } catch (err: any) {
                    console.error("Error submitting testimonial:", err);
                    Swal.fire({
                      title: t('dashboard.testiErrorTitle', 'Gagal'),
                      text: err.message || t('dashboard.testiErrorSubmit', 'Terjadi kesalahan saat mengirim testimoni.'),
                      icon: 'error',
                      background: '#0f172a',
                      color: '#f8fafc',
                      confirmButtonColor: '#10b981'
                    });
                  } finally {
                    setIsSubmittingTesti(false);
                  }
                }}
                className="lg:col-span-3 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5"
              >
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">{t('investor_feedback', 'Umpan Balik Investor')}</h3>
                  <p className="text-xs text-slate-400">{t('investor_feedback_desc', 'Pesan Anda akan ditampilkan di Landing Page utama setelah proses peninjauan.')}</p>
                </div>
 
                {/* Company Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {t('company_name', 'Nama Perusahaan / Investor')}
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={companyName}
                    disabled
                    className="w-full bg-slate-800/50 border border-slate-800 rounded-xl p-3 text-slate-400 cursor-not-allowed opacity-80 focus:ring-0 text-xs"
                    placeholder="PT. Luwu Maju Sejahtera"
                  />
                </div>

                {/* Sector Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {t('potential_sector', 'Sektor Potensi')}
                  </label>
                  <select
                    value={testiSector}
                    onChange={(e) => setTestiSector(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl text-white text-sm focus:outline-none transition-colors"
                  >
                    <option value="Agroindustri">{t('sector.agroindustri', 'Agroindustri')}</option>
                    <option value="Pariwisata">{t('sector.pariwisata', 'Pariwisata')}</option>
                    <option value="Energi">{t('sector.energi', 'Energi')}</option>
                    <option value="Perikanan">{t('sector.perikanan', 'Perikanan')}</option>
                    <option value="Infrastruktur">{t('sector.infrastruktur', 'Infrastruktur')}</option>
                    <option value="Pertambangan">{t('sector.pertambangan', 'Pertambangan')}</option>
                    <option value="Jasa">{t('sector.jasa', 'Jasa')}</option>
                    <option value="Lainnya">{t('sector.lainnya', 'Lainnya')}</option>
                  </select>
                </div>

                {/* Testimonial message */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {t('your_message', 'Pesan / Tanggapan Anda')}
                  </label>
                  <textarea
                    value={testiMessage}
                    onChange={(e) => setTestiMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl text-white text-sm focus:outline-none transition-colors"
                    placeholder={t('dashboard.testiMessagePlaceholder', 'Ceritakan kesan Anda terhadap layanan penanaman modal Kabupaten Luwu...')}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTesti}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingTesti ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t('dashboard.testiSubmitting', 'Mengirim...')}</span>
                    </>
                  ) : (
                    <span>{t('btn_send_testimonial', 'Kirim Testimoni')}</span>
                  )}
                </button>
              </form>

              {/* Right Column (Info) */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">{t('verification_flow', 'Alur Verifikasi Testimoni')}</h3>
                  <p className="text-xs text-slate-400">{t('flow_desc', 'Bagaimana Pemkab Luwu menjaga kredibilitas portal.')}</p>
                </div>

                <div className="space-y-4 text-xs text-slate-300">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{t('step_1', '1. Pengisian Form')}</h4>
                      <p className="leading-relaxed text-slate-400 text-[11px]">{t('step_1_desc', 'Investor menyampaikan data kepuasan investasi di portal ini.')}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{t('step_2', '2. Verifikasi Admin')}</h4>
                      <p className="leading-relaxed text-slate-400 text-[11px]">{t('step_2_desc', 'Tim administrator DPMPTSP Luwu meninjau kelayakan konten untuk mencegah spam.')}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{t('step_3', '3. Publikasi Otomatis')}</h4>
                      <p className="leading-relaxed text-slate-400 text-[11px]">{t('step_3_desc', 'Jika disetujui, testimoni Anda akan langsung terbit secara dinamis di Landing Page utama.')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-white">⭐ {t('positive_feedback', 'Umpan Balik Positif')}</p>
                  <p className="leading-relaxed text-slate-400 text-[11px]">
                    {t('positive_feedback_desc', 'Tanggapan Anda sangat membantu kami dalam terus melakukan perbaikan infrastruktur spasial dan regulasi perizinan demi iklim investasi Luwu yang lebih baik.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Investment Detail Modal */}
      <AnimatePresence>
        {selectedInvestmentId && (
          <InvestmentDetailModal
            investmentId={selectedInvestmentId}
            onClose={() => setSelectedInvestmentId(null)}
            onOpenAiConsultant={(inv) => {
              // handle consultant redirection/trigger if needed
            }}
            isDarkMode={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ui polish: executive premium fin-tech polish
// ui polish: resolve recharts 0x0 dimension warnings
