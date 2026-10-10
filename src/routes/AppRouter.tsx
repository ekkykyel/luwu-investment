import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { useProfile } from '../hooks/useProfile';
import { useData } from '../contexts/DataContext';
import { Role } from '../types';
import { Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { lazyWithRetry } from '../utils/lazyWithRetry';

// ============================================================================
// LAZY-LOADED PAGE VIEWS WITH AUTO-RETRY & EXPONENTIAL BACKOFF
// ============================================================================

// --- PUBLIC & LANDING ---
const LandingPage = lazyWithRetry(() => import('../components/LandingPage'));
const SpatialMapWorkspace = lazyWithRetry(() => import('../views/SpatialMapWorkspace'));

// --- AUTHENTICATION ---
const InvestorLogin = lazyWithRetry(() => import('../components/Auth/InvestorLogin'));
const InvestorRegistrationForm = lazyWithRetry(() => import('../components/Auth/InvestorRegistrationForm'));
const GerbangOperatorLogin = lazyWithRetry(() => import('../components/Auth/GerbangOperatorLogin'));

// --- CITIZEN / MASYARAKAT ---
const MasyarakatDashboard = lazyWithRetry(() => import('../components/Dashboard/MasyarakatDashboard'));

// --- INVESTOR PORTAL & TRACKING ---
const InvestorPortalDashboard = lazyWithRetry(() => import('../components/Dashboard/InvestorPortalDashboard'));
const PkkprTrackingView = lazyWithRetry(() => import('../views/PkkprTrackingView'));
const PkkprVerificationPage = lazyWithRetry(() => import('../pages/PkkprVerificationPage'));

// --- OPD & GOVERNMENT ADMIN WORKSPACES ---
const AdminPortalDashboard = lazyWithRetry(() => import('../components/Dashboard/AdminPortalDashboard'));
const AdminLayout = lazyWithRetry(() => import('../components/Admin/AdminLayout'));

// --- MPP & FRONT OFFICE ---
const PortalMPP = lazyWithRetry(() => import('../components/PortalMPP'));
const MppFoCommandCenter = lazyWithRetry(() => import('../components/mpp/MppFoCommandCenter'));

// --- SYSTEM & DIAGNOSTICS ---
const DebugDbPage = lazyWithRetry(() => import('../components/DebugDbPage'));

// ============================================================================
// 403 FORBIDDEN FALLBACK VIEW
// ============================================================================
const Forbidden403View: React.FC = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-base flex flex-col items-center justify-center text-center p-6 text-slate-900 dark:text-white font-sans">
    <Shield className="h-16 w-16 text-rose-500 mb-6 mx-auto animate-pulse" />
    <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white mb-2">403 Forbidden</h1>
    <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md">Anda tidak memiliki izin (roles) yang cukup untuk mengakses halaman ini.</p>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => window.location.replace("/")}
      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm tracking-wider uppercase transition-colors text-white"
    >
      Kembali ke Beranda
    </motion.button>
  </div>
);

// ============================================================================
// ADMIN ROUTE DISPATCHER (ROUTES TO MPP ADMIN OR OPD DASHBOARD)
// ============================================================================
const AdminRouteDispatcher: React.FC = () => {
  const location = useLocation();
  const { profile: activeProfile } = useProfile();
  const rawStoredRole = (typeof window !== 'undefined' ? localStorage.getItem('luwu_user_role') || '' : '').toLowerCase();
  const storedEmail = (typeof window !== 'undefined' ? localStorage.getItem('luwu_user_email') || '' : '').toLowerCase();
  const profileRole = (activeProfile?.role || '').toLowerCase();
  const profileEmail = (activeProfile?.email || '').toLowerCase();

  const isMpp = 
    profileRole.includes('mpp') || 
    rawStoredRole.includes('mpp') ||
    profileEmail.includes('mpp') ||
    storedEmail.includes('mpp') ||
    profileEmail === 'nilambintangselatan@gmail.com' ||
    storedEmail === 'nilambintangselatan@gmail.com' ||
    location.pathname.startsWith('/admin/beranda') ||
    location.pathname.startsWith('/admin/atur-antrean') ||
    location.pathname.startsWith('/admin/laporan-mpp') ||
    location.pathname.startsWith('/admin/loket-pelayanan') ||
    location.pathname.startsWith('/admin/tata-ruang-investasi') ||
    location.pathname.startsWith('/admin/e-office') ||
    location.pathname.startsWith('/admin/manajemen-asn') ||
    location.pathname.startsWith('/admin/kelola-portal') ||
    location.pathname.startsWith('/admin/pengaturan-web') ||
    location.pathname.startsWith('/mpp/admin');

  if (isMpp) {
    return <AdminLayout />;
  }

  return <AdminPortalDashboard />;
};

// ============================================================================
// PAGE TRANSITION WRAPPER (SMOOTH FADE-IN FOR KEY PUBLIC VIEWS)
// ============================================================================
const PageFadeTransition: React.FC<{ children: React.ReactNode; pageKey: string }> = ({ children, pageKey }) => (
  <motion.div
    key={pageKey}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1], // Cubic bezier for snappy, elegant entrance
    }}
    className="w-full min-h-screen"
  >
    {children}
  </motion.div>
);

// ============================================================================
// APP ROUTER COMPONENT
// ============================================================================
export const AppRouter: React.FC = () => {
  const location = useLocation();
  const { profile: activeProfile, isProfileLoading } = useProfile();
  const { investments, districts, villages, loiCount } = useData();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ================================================================= */}
        {/* 1. PUBLIC & LANDING ROUTES (WITH SMOOTH FADE-IN TRANSITION)       */}
        {/* ================================================================= */}
        <Route path="/" element={<PageFadeTransition pageKey="landing-root"><SpatialMapWorkspace /></PageFadeTransition>} />
        <Route path="/beranda" element={<PageFadeTransition pageKey="landing-beranda"><SpatialMapWorkspace /></PageFadeTransition>} />
        <Route path="/peta" element={<SpatialMapWorkspace />} />
        <Route path="/peta-spasial" element={<SpatialMapWorkspace />} />
        <Route path="/map" element={<SpatialMapWorkspace />} />
        <Route path="/workspace" element={<SpatialMapWorkspace />} />

        {/* ================================================================= */}
        {/* 2. AUTHENTICATION & REGISTRATION ROUTES                          */}
        {/* ================================================================= */}
        <Route path="/login" element={<InvestorLogin />} />
        <Route path="/register" element={<InvestorRegistrationForm />} />
        <Route path="/registrasi" element={<InvestorRegistrationForm />} />
        <Route path="/gerbang-operator-luwu" element={<GerbangOperatorLogin />} />

        {/* ================================================================= */}
        {/* 3. INVESTOR PORTAL & TRACKING ROUTES                              */}
        {/* ================================================================= */}
        <Route path="/investor-dashboard" element={<InvestorPortalDashboard />} />
        <Route path="/investor" element={<InvestorPortalDashboard />} />
        <Route path="/portal-investor" element={<InvestorPortalDashboard />} />
        <Route path="/tracking" element={<PkkprTrackingView />} />
        <Route path="/track" element={<PkkprTrackingView />} />
        <Route path="/pkkpr/track" element={<PkkprTrackingView />} />
        <Route path="/pkkpr-tracking" element={<PkkprTrackingView />} />
        <Route path="/pelacakan-pkkpr" element={<PkkprTrackingView />} />
        <Route path="/verifikasi/pkkpr/:id" element={<PkkprVerificationPage />} />
        <Route path="/verifikasi/:id" element={<PkkprVerificationPage />} />
        <Route path="/verify/:id" element={<PkkprVerificationPage />} />

        {/* ================================================================= */}
        {/* 4. MASYARAKAT / CITIZEN DASHBOARD ROUTES                         */}
        {/* ================================================================= */}
        <Route
          path="/masyarakat-dashboard"
          element={
            <MasyarakatDashboard
              isDarkMode={typeof window !== 'undefined' ? (localStorage.getItem('luwu_theme') === 'dark' || (!localStorage.getItem('luwu_theme') && document.documentElement.classList.contains('dark'))) : false}
              activeProfile={activeProfile || {
                role: 'masyarakat',
                nik: typeof window !== 'undefined' ? localStorage.getItem('luwu_user_nik') || '' : '',
                full_name: typeof window !== 'undefined' ? localStorage.getItem('luwu_user_name') || 'Masyarakat Luwu' : 'Masyarakat Luwu',
                phone: typeof window !== 'undefined' ? localStorage.getItem('luwu_user_phone') || '' : '',
                no_whatsapp: typeof window !== 'undefined' ? localStorage.getItem('luwu_user_phone') || '' : ''
              }}
              districts={districts}
            />
          }
        />
        <Route path="/masyarakat" element={<Navigate to="/masyarakat-dashboard" replace />} />
        <Route path="/portal-masyarakat" element={<Navigate to="/masyarakat-dashboard" replace />} />

        {/* ================================================================= */}
        {/* 5. MPP ADMIN SUB-ROUTES (BERANDA, LOKET, LAPORAN, E-OFFICE, DLL)  */}
        {/* ================================================================= */}
        <Route path="/admin/beranda" element={<AdminLayout />} />
        <Route path="/admin/atur-antrean" element={<AdminLayout />} />
        <Route path="/admin/laporan-mpp" element={<AdminLayout />} />
        <Route path="/admin/loket-pelayanan" element={<AdminLayout />} />
        <Route path="/admin/tata-ruang-investasi" element={<AdminLayout />} />
        <Route path="/admin/e-office" element={<AdminLayout />} />
        <Route path="/admin/manajemen-asn" element={<AdminLayout />} />
        <Route path="/admin/kelola-portal" element={<AdminLayout />} />
        <Route path="/admin/pengaturan-web" element={<AdminLayout />} />
        <Route path="/mpp/admin" element={<AdminLayout />} />
        <Route path="/mpp/admin/*" element={<AdminLayout />} />

        {/* ================================================================= */}
        {/* 6. OPD & GOVERNMENT ADMIN ROUTES (PUPTR, PERTANIAN, OSS, DALAK)   */}
        {/* ================================================================= */}
        <Route path="/dashboard" element={<AdminPortalDashboard />} />
        <Route path="/dashboard/*" element={<AdminPortalDashboard />} />
        <Route path="/admin" element={<AdminRouteDispatcher />} />
        <Route path="/admin/*" element={<AdminRouteDispatcher />} />
        <Route path="/spatial-editor" element={<AdminPortalDashboard defaultTab="puptr_spatial_editor" />} />
        <Route path="/admin/spatial-editor" element={<AdminPortalDashboard defaultTab="puptr_spatial_editor" />} />
        <Route path="/admin/puptr_spatial_editor" element={<AdminPortalDashboard defaultTab="puptr_spatial_editor" />} />
        <Route path="/portal-admin" element={<AdminPortalDashboard />} />
        <Route path="/portal-admin/*" element={<AdminPortalDashboard />} />

        {/* ================================================================= */}
        {/* 7. MPP (MAL PELAYANAN PUBLIK) & FRONT OFFICE (FO) ROUTES          */}
        {/* ================================================================= */}
        <Route path="/mpp" element={<PageFadeTransition pageKey="portal-mpp"><PortalMPP /></PageFadeTransition>} />
        <Route path="/portal-mpp" element={<PageFadeTransition pageKey="portal-mpp-alias"><PortalMPP /></PageFadeTransition>} />
        <Route path="/fo" element={<MppFoCommandCenter />} />
        <Route path="/fo/dashboard" element={<MppFoCommandCenter />} />
        <Route path="/mpp/fo" element={<MppFoCommandCenter />} />
        <Route path="/fo-dashboard" element={<MppFoCommandCenter />} />
        <Route path="/front-office" element={<MppFoCommandCenter />} />

        {/* ================================================================= */}
        {/* 7. UTILITY & DIAGNOSTIC ROUTES                                    */}
        {/* ================================================================= */}
        <Route path="/debug-db" element={<DebugDbPage />} />
        <Route path="/debug" element={<DebugDbPage />} />
        <Route path="/403-forbidden" element={<Forbidden403View />} />

        {/* ================================================================= */}
        {/* 8. WILDCARD FALLBACK                                              */}
        {/* ================================================================= */}
        <Route path="*" element={<SpatialMapWorkspace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
