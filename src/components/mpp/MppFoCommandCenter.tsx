import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Laptop, 
  BellRing, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  ShieldCheck, 
  Radio, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  Footprints, 
  ArrowRight, 
  Send, 
  Filter, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Search, 
  HelpCircle, 
  PhoneCall, 
  Zap, 
  AlertTriangle,
  ArrowUpRight,
  Accessibility,
  Store,
  Baby,
  BookOpen,
  MapPin,
  ChevronLeft,
  X,
  Play,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { MppFloorPlan } from './MppFloorPlan';
import { FoOfficerLoginModal } from './FoOfficerLoginModal';
import { supabase } from '../../lib/supabaseClient';
import { mppService, OFFICIAL_MPP_TENANTS } from '../../services/mppService';
import { MppFoRequest, MppFoRequestStatus, Operator } from '../../types/mpp';

// Web Audio API Hotel Concierge Bell Chime Synthesizer
function playConciergeBellChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    // Chime notes: F#5 (739.99 Hz) -> A#5 (932.33 Hz) -> C#6 (1108.73 Hz) -> F#6 (1479.98 Hz)
    const notes = [
      { freq: 739.99, time: 0.0, dur: 1.2 },
      { freq: 932.33, time: 0.12, dur: 1.2 },
      { freq: 1108.73, time: 0.24, dur: 1.4 },
      { freq: 1479.98, time: 0.38, dur: 1.8 }
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Bell envelope (instant attack, exponential decay)
      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.28, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // Secondary harmonic shimmer
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(2217.46, now + 0.38);
    shimmerGain.gain.setValueAtTime(0.001, now + 0.38);
    shimmerGain.gain.exponentialRampToValueAtTime(0.08, now + 0.40);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.start(now + 0.38);
    shimmerOsc.stop(now + 1.6);

    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    }, 2500);
  } catch (err) {
    console.warn('[FO Audio Chime] Web Audio playback error:', err);
  }
}

interface FloorZoneMapItem {
  id: string;
  sourceKey: string; // matches source_name pattern
  name: string;
  code: string;
  category: 'kiosk' | 'tenant' | 'facility';
  floor?: 1 | 2 | string | number;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: any;
  color: string;
  description: string;
}

const MPP_ZONES: FloorZoneMapItem[] = [
  // Front Kiosks & Lobby
  { id: 'kiosk-1', sourceKey: 'Kiosk 1', name: 'Kiosk 1 (Lobby Utama)', code: 'KSK-01', category: 'kiosk', floor: 1, x: 22, y: 78, w: 14, h: 14, icon: Laptop, color: '#3b82f6', description: 'Mesin Kiosk Layanan Mandiri & Pendaftaran Antrean Pintu Masuk' },
  { id: 'kiosk-2', sourceKey: 'Kiosk 2', name: 'Kiosk 2 (Sayap Timur)', code: 'KSK-02', category: 'kiosk', floor: 1, x: 42, y: 78, w: 14, h: 14, icon: Laptop, color: '#3b82f6', description: 'Mesin Kiosk Cetak KTP & Identitas Digital Sayap Kanan' },
  { id: 'kiosk-3', sourceKey: 'Kiosk 3', name: 'Kiosk 3 (Fast-Track Inklusi)', code: 'KSK-03', category: 'kiosk', floor: 1, x: 62, y: 78, w: 14, h: 14, icon: Accessibility, color: '#06b6d4', description: 'Kiosk Khusus Lansia, Ibu Hamil & Penyandang Disabilitas' },

  // Front Office Concierge Desk
  { id: 'fo-desk-1', sourceKey: 'Front Office Desk 1', name: 'Meja Resepsionis FO 1', code: 'FO-01', category: 'facility', floor: 1, x: 6, y: 74, w: 13, h: 18, icon: UserCheck, color: '#6366f1', description: 'Meja Utama Resepsionis & Petugas Pengarah Layanan' },
  { id: 'fo-desk-2', sourceKey: 'Front Office Desk 2', name: 'Meja Concierge FO 2', code: 'FO-02', category: 'facility', floor: 1, x: 80, y: 74, w: 14, h: 18, icon: ShieldCheck, color: '#6366f1', description: 'Meja Konsultasi Cepat & Informasi Perizinan Investor' },

  // Tenant Gerai Pemda & Instansi Terpadu (Fasilitas Pendukung)
  { id: 'gerai-disdukcapil', sourceKey: 'Disdukcapil', name: 'Gerai Disdukcapil (01-04)', code: 'DISDUKCAPIL', category: 'tenant', floor: 1, x: 6, y: 12, w: 26, h: 26, icon: Building2, color: '#10b981', description: 'Layanan KTP-el, Kartu Keluarga, Akta & Pindah Datang' },
  { id: 'gerai-dpmptsp', sourceKey: 'DPMPTSP', name: 'Gerai DPMPTSP (05-08)', code: 'DPMPTSP', category: 'tenant', floor: 1, x: 35, y: 12, w: 28, h: 26, icon: Building2, color: '#059669', description: 'Penerbitan NIB OSS, PBG, Izin Lingkungan & Asistensi VIP' },
  { id: 'gerai-bpn', sourceKey: 'Badan Pertanahan', name: 'Gerai ATR / BPN (09-11)', code: 'BPN', category: 'tenant', floor: 1, x: 66, y: 12, w: 28, h: 26, icon: Building2, color: '#d97706', description: 'Pendaftaran Sertifikat Tanah, Balik Nama & Pengecekan' },

  { id: 'gerai-bapenda', sourceKey: 'Bapenda', name: 'Gerai Bapenda (12-14)', code: 'BAPENDA', category: 'tenant', floor: 1, x: 6, y: 42, w: 26, h: 24, icon: Building2, color: '#f59e0b', description: 'Pembayaran PBB-P2, BPHTB & Validasi Pajak Daerah' },
  { id: 'gerai-bank-sulselbar', sourceKey: 'Bank Sulselbar', name: 'Gerai Bank Sulselbar & Kasir', code: 'SULSELBAR', category: 'tenant', floor: 1, x: 35, y: 42, w: 28, h: 24, icon: Store, color: '#2563eb', description: 'Loket Pembayaran Retribusi & Layanan Kas Bank' },
  { id: 'gerai-samsat', sourceKey: 'SAMSAT', name: 'Gerai SAMSAT Belopa', code: 'SAMSAT', category: 'tenant', floor: 1, x: 66, y: 42, w: 28, h: 24, icon: Building2, color: '#8b5cf6', description: 'Pembayaran Pajak Kendaraan Bermotor & SWDKLLJ' },

  // Mitra BUMD & Instansi Vertikal (Fasilitas Pendukung)
  { id: 'gerai-bpjs-kes', sourceKey: 'BPJS Kesehatan', name: 'Gerai BPJS Kesehatan', code: 'BPJS-KES', category: 'tenant', floor: 1, x: 6, y: 14, w: 28, h: 28, icon: Building2, color: '#0ea5e9', description: 'Pendaftaran JKN-KIS, Perubahan Faskes & Skrining' },
  { id: 'gerai-bpjs-tk', sourceKey: 'BPJS Ketenagakerjaan', name: 'Gerai BPJS Ketenagakerjaan', code: 'BPJS-TK', category: 'tenant', floor: 1, x: 36, y: 14, w: 28, h: 28, icon: Building2, color: '#10b981', description: 'Klaim JHT, JKK, JKM & Pendaftaran BPU' },
  { id: 'gerai-kejari', sourceKey: 'Kejaksaan', name: 'Pos Pelayanan Hukum Kejari', code: 'KEJARI', category: 'tenant', floor: 1, x: 66, y: 14, w: 28, h: 28, icon: Building2, color: '#ef4444', description: 'Konsultasi Hukum Perdata & Pengambilan Tilang' },

  { id: 'gerai-pupr', sourceKey: 'PUPTR', name: 'Gerai Dinas PUPTR Luwu', code: 'PUPTR', category: 'tenant', floor: 1, x: 6, y: 46, w: 28, h: 28, icon: Building2, color: '#eab308', description: 'Rekomendasi Tata Ruang & Validasi KRK' },
  { id: 'gerai-pdam', sourceKey: 'PDAM', name: 'Gerai PDAM Tirta Luwu', code: 'PDAM', category: 'tenant', floor: 1, x: 36, y: 46, w: 28, h: 28, icon: Building2, color: '#3b82f6', description: 'Pemasangan Baru & Pembayaran Tagihan Air Bersih' },
  { id: 'gerai-taspen', sourceKey: 'Taspen', name: 'Gerai PT. Taspen & Dinsos', code: 'TASPEN', category: 'tenant', floor: 1, x: 66, y: 46, w: 28, h: 28, icon: Building2, color: '#8b5cf6', description: 'Klaim Pensiun ASN & Layanan Kesejahteraan Sosial' },
];

export function MppFoCommandCenter() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<MppFoRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'active' | 'pending' | 'responding' | 'resolved' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<FloorZoneMapItem | null>(null);

  // Theme Mode State ('dark' | 'light') with LocalStorage Persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('mpp_fo_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('mpp_fo_theme', nextTheme);
    } catch {}
  };

  // Audio Control State
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioLoopRunning, setIsAudioLoopRunning] = useState<boolean>(false);
  const audioIntervalRef = useRef<any>(null);

  const navigate = useNavigate();

  // Active FO Officer Session & Login Gate State
  const [foSession, setFoSession] = useState<{ id?: string; name?: string; email?: string; role?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('mpp_fo_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(!foSession);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // Logout Handler (Custom Modal confirmation for 100% iframe compatibility)
  const handleLogoutFo = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    try {
      localStorage.removeItem('mpp_fo_session');
      sessionStorage.removeItem('mpp_fo_session');
      localStorage.removeItem('mpp_active_fo_user');
      sessionStorage.clear();
    } catch (err) {
      console.warn('[FO Logout] Error clearing storage:', err);
    }
    setFoSession(null);
    setIsLogoutModalOpen(false);
    setIsLoginModalOpen(true);
    navigate('/mpp', { replace: true });
  };

  // Operators & Active Operator State
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [isSubscribingRealtime, setIsSubscribingRealtime] = useState<boolean>(false);

  // Live Current Time
  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock WITA updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Makassar',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' WITA'
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch FO Requests & Operators from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqData, opData] = await Promise.all([
        mppService.getFoRequests('all'),
        mppService.getFoOperators()
      ]);
      setRequests(reqData || []);
      setOperators(opData || []);
      if (opData && opData.length > 0 && !selectedOperatorId) {
        setSelectedOperatorId(opData[0].id);
      }
    } catch (err) {
      console.error('[FO Dashboard] Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOperatorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Supabase Realtime Subscription Setup (CRITICAL REQUIREMENT)
  useEffect(() => {
    setIsSubscribingRealtime(true);
    console.log('[FO Dashboard] Initializing Supabase Realtime channel for mpp_fo_requests...');

    const foChannel = supabase
      .channel('mpp-fo-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mpp_fo_requests'
        },
        (payload: any) => {
          console.log('[FO Realtime Event]:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as MppFoRequest;
            setRequests((prev) => {
              if (prev.some((r) => r.id === newRecord.id)) return prev;
              return [...prev, newRecord];
            });

            // Trigger immediate alert chime when new pending request arrives
            if (newRecord.status === 'pending' && !isMuted) {
              playConciergeBellChime();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as MppFoRequest;
            setRequests((prev) =>
              prev.map((r) => (r.id === updatedRecord.id ? { ...r, ...updatedRecord } : r))
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old.id;
            setRequests((prev) => prev.filter((r) => r.id !== oldId));
          }
        }
      )
      .subscribe((status) => {
        console.log('[FO Realtime Subscription Status]:', status);
        if (status === 'SUBSCRIBED') {
          setIsSubscribingRealtime(true);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[FO Dashboard] Cleaning up Supabase Realtime channel...');
      supabase.removeChannel(foChannel);
      setIsSubscribingRealtime(false);
    };
  }, [isMuted]);

  // Count pending & responding requests
  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status === 'pending');
  }, [requests]);

  const respondingRequests = useMemo(() => {
    return requests.filter((r) => r.status === 'responding');
  }, [requests]);

  const resolvedToday = useMemo(() => {
    return requests.filter((r) => r.status === 'resolved');
  }, [requests]);

  // Audio Alarm Loop Controller:
  // "Jika ada data masuk dengan status = 'pending', aktifkan Audio API bawaan browser.
  // Mainkan suara ini secara looping (jeda 5 detik) selama masih ada antrean berstatus pending."
  useEffect(() => {
    if (pendingRequests.length > 0 && !isMuted) {
      setIsAudioLoopRunning(true);
      // Play immediately
      playConciergeBellChime();

      // Loop every 5 seconds
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = setInterval(() => {
        playConciergeBellChime();
      }, 5000);
    } else {
      setIsAudioLoopRunning(false);
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    };
  }, [pendingRequests.length, isMuted]);

  // Action Button Handlers
  const handleRespondOtw = async (reqId: string) => {
    try {
      const res = await mppService.updateFoRequestStatus({
        id: reqId,
        status: 'responding',
        operatorId: selectedOperatorId
      });
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === reqId ? { ...r, status: 'responding' } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update status to responding:', err);
    }
  };

  const handleResolve = async (reqId: string) => {
    try {
      const nowIso = new Date().toISOString();
      const res = await mppService.updateFoRequestStatus({
        id: reqId,
        status: 'resolved',
        operatorId: selectedOperatorId
      });
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === reqId
              ? {
                  ...r,
                  status: 'resolved',
                  resolved_at: nowIso,
                  resolved_by: selectedOperatorId
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Failed to resolve request:', err);
    }
  };

  // Helper to test sound chime manually
  const handleTestSound = () => {
    playConciergeBellChime();
  };

  // Status mapping for Floor Plan Node
  const getZoneStatus = (zone: FloorZoneMapItem): {
    status: 'pending' | 'responding' | 'idle';
    activeCount: number;
    requestList: MppFoRequest[];
  } => {
    const matched = requests.filter((r) => {
      const sName = (r.source_name || '').toLowerCase();
      const sType = (r.source_type || '').toLowerCase();
      const zKey = zone.sourceKey.toLowerCase();
      const zCode = zone.code.toLowerCase();
      const zName = zone.name.toLowerCase();

      const isKioskType = sType === 'kiosk' || sType === 'layanan_mandiri';
      return (
        sName.includes(zKey) ||
        sName.includes(zCode) ||
        sName.includes(zName) ||
        (zone.category === 'kiosk' && isKioskType && sName.includes(zone.code.toLowerCase()))
      );
    });

    const pending = matched.filter((r) => r.status === 'pending');
    const responding = matched.filter((r) => r.status === 'responding');

    if (pending.length > 0) {
      return { status: 'pending', activeCount: pending.length, requestList: pending };
    }
    if (responding.length > 0) {
      return { status: 'responding', activeCount: responding.length, requestList: responding };
    }
    return { status: 'idle', activeCount: 0, requestList: [] };
  };

  // Filtered requests for Action Queue
  const filteredRequests = useMemo(() => {
    return requests
      .filter((req) => {
        if (activeFilter === 'active') {
          return req.status === 'pending' || req.status === 'responding';
        }
        if (activeFilter === 'pending') return req.status === 'pending';
        if (activeFilter === 'responding') return req.status === 'responding';
        if (activeFilter === 'resolved') return req.status === 'resolved';
        return true;
      })
      .filter((req) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (req.source_name || '').toLowerCase().includes(q) ||
          (req.notes || '').toLowerCase().includes(q) ||
          (req.status || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Pending first, then oldest to newest requested_at (FIFO priority)
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime();
      });
  }, [requests, activeFilter, searchQuery]);

  // Current floor zones (All services on Fasilitas Pendukung)
  const currentFloorZones = MPP_ZONES;

  // Active operator display
  const activeOperator = operators.find((o) => o.id === selectedOperatorId) || {
    id: 'fo-default',
    full_name: 'Khadijah, S.Sos (Resepsionis Utama FO)',
    email: 'fo1@mpp.luwukab.go.id',
    role: 'front_office'
  };

  // Auth Guard: Lock screen if no active FO session
  if (!foSession) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`max-w-md w-full text-center space-y-5 p-8 rounded-3xl border shadow-2xl backdrop-blur-md ${
          theme === 'dark' ? 'bg-slate-900/90 border-slate-800 shadow-rose-950/20' : 'bg-white border-slate-200 shadow-slate-300'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-display tracking-tight mb-2">Otentikasi Petugas FO Diperlukan</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Akses ke Command Center Front Office & Live Floorplan Simpurusiang terbatas bagi Petugas FO resmi. Silakan verifikasi email & PIN Anda.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white transition-all shadow-lg shadow-rose-950/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Verifikasi PIN & Masuk Ke Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/mpp')}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-300 dark:border-slate-800"
            >
              Kembali ke Portal MPP
            </button>
          </div>
        </div>

        <FoOfficerLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => {
            if (!foSession) {
              navigate('/mpp');
            } else {
              setIsLoginModalOpen(false);
            }
          }}
          onSuccess={(sess) => {
            setFoSession(sess);
            setIsLoginModalOpen(false);
          }}
          isDarkMode={theme === 'dark'}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200 selection:bg-rose-500 selection:text-white`}>
      {/* ───────────────────────────────────────────────────────── */}
      {/* TOP COMMAND BAR (HOTEL CONCIERGE & RECEPTION HEADER)     */}
      {/* ───────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'} border-b backdrop-blur-md px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-colors duration-200`}>
        {/* Left Branding */}
        <div className="flex items-center gap-3.5">
          <div className="relative p-2.5 bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 rounded-2xl shadow-lg shadow-rose-900/40 text-white flex items-center justify-center">
            <BellRing className="w-6 h-6 animate-pulse text-amber-200" />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
                  {pendingRequests.length}
                </span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-display font-black text-lg md:text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight flex items-center gap-2`}>
                Command Center Front Office (FO)
              </h1>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50' : 'bg-rose-100 text-rose-700 border border-rose-300'
              }`}>
                Live Reception
              </span>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'} flex items-center gap-2`}>
              <span>MPP Simpurusiang Luwu</span>
              <span>•</span>
              <span className="font-mono text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                {currentTime || '08:00:00 WITA'}
              </span>
            </p>
          </div>
        </div>

        {/* Center Quick Stats */}
        <div className={`hidden md:flex items-center gap-2 p-1.5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-300 shadow-inner'}`}>
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${theme === 'dark' ? 'bg-rose-950/40 border-rose-800/60' : 'bg-rose-50 border-rose-200'}`}>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Menunggu:</span>
            <span className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>{pendingRequests.length}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${theme === 'dark' ? 'bg-amber-950/40 border-amber-800/60' : 'bg-amber-50 border-amber-200'}`}>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>OTW:</span>
            <span className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>{respondingRequests.length}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${theme === 'dark' ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Selesai:</span>
            <span className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{resolvedToday.length}</span>
          </div>
        </div>

        {/* Right Controls (Theme Switcher, Audio, Operator, Refresh) */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Theme Mode Toggle Button (Light / Dark) */}
          <button
            id="btn-toggle-fo-theme"
            onClick={toggleTheme}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border shadow-sm ${
              theme === 'dark'
                ? 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700 hover:text-amber-200'
                : 'bg-white hover:bg-slate-100 text-indigo-700 border-slate-300 hover:text-indigo-900 shadow-slate-200'
            }`}
            title={theme === 'dark' ? 'Beralih ke Tema Terang (Light Mode)' : 'Beralih ke Tema Gelap (Dark Mode)'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Tema Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Tema Gelap</span>
              </>
            )}
          </button>

          {/* Audio Chime Mute / Sound Test */}
          <div className={`flex items-center border rounded-xl p-1 ${theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
            <button
              id="btn-toggle-alarm-sound"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isMuted
                  ? (theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-500 hover:text-slate-800')
                  : 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
              }`}
              title={isMuted ? 'Aktifkan Suara Alarm Panggilan' : 'Bisukan Suara Alarm'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Alarm Aktif'}</span>
            </button>

            <button
              id="btn-test-chime"
              onClick={handleTestSound}
              className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                theme === 'dark'
                  ? 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'
              }`}
              title="Uji Bunyi Bel Hotel Concierge (Web Audio)"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Uji Suara</span>
            </button>
          </div>

          {/* Active Operator Switcher */}
          <div className={`hidden lg:flex items-center gap-2 border px-3 py-1.5 rounded-xl ${theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
            <UserCheck className="w-4 h-4 text-indigo-500" />
            <div className="text-left">
              <span className={`text-[10px] block uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Petugas Login:</span>
              <select
                id="select-fo-operator"
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
              >
                {operators.map((op) => (
                  <option key={op.id} value={op.id} className={theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>
                    {op.full_name} ({op.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Manual Refresh */}
          <button
            id="btn-refresh-fo-data"
            onClick={loadData}
            className={`p-2.5 rounded-xl transition-all border active:scale-95 ${
              theme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300 shadow-sm'
            }`}
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {/* Tombol Keluar (Logout) */}
          <button
            id="btn-logout-fo-session"
            type="button"
            onClick={handleLogoutFo}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/30 border border-rose-500 active:scale-95 cursor-pointer z-50 relative"
            title="Keluar dari Command Center FO"
            aria-label="Keluar dari Command Center FO"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold">Keluar</span>
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────── */}
      {/* REALTIME AUDIO ALARM BANNER (When Pending Requests Exist) */}
      {/* ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 px-4 py-2.5 text-white flex items-center justify-between border-b border-rose-500/50 shadow-inner overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg animate-bounce">
                <BellRing className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider bg-rose-950/60 px-2 py-0.5 rounded text-rose-200 mr-2">
                  ⚠️ PANGGILAN DARURAT/BANTUAN AKTIF
                </span>
                <span className="text-xs md:text-sm font-bold">
                  Ada {pendingRequests.length} pemohon/loket membutuhkan kehadiran petugas Front Office!
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 hidden sm:inline">
                Alarm berdering setiap 5 detik
              </span>
              <button
                onClick={() => handleRespondOtw(pendingRequests[0].id)}
                className="px-3.5 py-1.5 bg-white text-rose-800 hover:bg-rose-50 rounded-xl font-bold text-xs uppercase tracking-wider shadow transition-all active:scale-95"
              >
                Tanggapi Pertama (OTW)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────── */}
      {/* MAIN SPLIT-SCREEN LAYOUT                                  */}
      {/* ───────────────────────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden">
        {/* ======================================================= */}
        {/* PANEL KIRI: LIVE FLOOR PLAN (DENAH INTERAKTIF)          */}
        {/* ======================================================= */}
        <section className={`xl:col-span-7 border-r flex flex-col p-2 sm:p-3 lg:p-4 overflow-y-auto transition-colors duration-200 ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* MppFloorPlan Component with Realtime Database Synchronization & Theme Prop */}
          <div className="flex-1 flex flex-col min-h-[580px]">
            <MppFloorPlan
              isDark={theme === 'dark'}
              viewBox="0 0 1200 800"
              externalRequests={requests}
              selectedId={selectedZone?.code || selectedZone?.id}
              onSelectElement={(item) => {
                const matched = MPP_ZONES.find(
                  z => z.code === item.code || z.id === item.id || z.name.toLowerCase().includes(item.name.toLowerCase())
                );
                if (matched) {
                  setSelectedZone(matched);
                } else {
                  setSelectedZone({
                    id: item.id,
                    sourceKey: item.name,
                    name: item.name,
                    code: item.code,
                    category: item.type === 'tenant' ? 'tenant' : 'facility',
                    floor: 1,
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    icon: item.type === 'tenant' ? Building2 : Laptop,
                    color: '#6366f1',
                    description: item.description || ''
                  });
                }
              }}
            />
          </div>

          {/* Selected Zone Detail Drawer / Card */}
          {selectedZone && (
            <div className={`mt-4 p-4 rounded-2xl border animate-fade-in flex items-start justify-between gap-4 transition-colors ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-md'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  theme === 'dark' ? 'bg-indigo-950/60 border-indigo-800 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}>
                  <selectedZone.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedZone.name}</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200 font-bold'
                    }`}>
                      {selectedZone.code} • Denah Utama (Fasilitas Pendukung)
                    </span>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                    {selectedZone.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedZone(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* ======================================================= */}
        {/* PANEL KANAN: ACTION QUEUE (ANTREAN PANGGILAN BANTUAN)   */}
        {/* ======================================================= */}
        <section className={`xl:col-span-5 flex flex-col p-4 lg:p-6 overflow-hidden transition-colors duration-200 ${
          theme === 'dark' ? 'bg-slate-900/60' : 'bg-white border-l border-slate-200'
        }`}>
          {/* Header Action Queue */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-rose-500" />
                <h2 className={`font-bold text-base md:text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Action Queue (Antrean Bantuan)</h2>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                Urutan panggilan bantuan masuk dari terlama ke terbaru (FIFO)
              </p>
            </div>

            {/* Total Active Badge */}
            <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold border ${
              theme === 'dark'
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-rose-100 border-rose-300 text-rose-800'
            }`}>
              {filteredRequests.length} Permintaan
            </span>
          </div>

          {/* Search & Filter Tabs */}
          <div className="space-y-2.5 mb-4">
            {/* Search Input */}
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi, gerai, atau catatan..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all border focus:ring-2 focus:ring-rose-500 ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 font-medium'
                }`}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'active', label: 'Semua Aktif' },
                { id: 'pending', label: 'Menunggu' },
                { id: 'responding', label: 'Petugas OTW' },
                { id: 'resolved', label: 'Selesai' },
                { id: 'all', label: 'Semua Data' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFilter === tab.id
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                      : theme === 'dark'
                      ? 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List (Scrollable Area) */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-rose-500" />
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Menghubungkan ke Supabase Realtime...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className={`py-16 text-center space-y-3 border-2 border-dashed rounded-2xl p-6 ${
                theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-300 bg-slate-50/50'
              }`}>
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                }`}>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>Tidak Ada Antrean Bantuan</h4>
                <p className={`text-xs max-w-xs mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Semua kiosk dan gerai dalam kondisi aman dan terlayani dengan baik.
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isResponding = req.status === 'responding';
                const isResolved = req.status === 'resolved';

                const reqDate = new Date(req.requested_at);
                const timeAgoMin = Math.max(0, Math.floor((Date.now() - reqDate.getTime()) / 60000));

                let cardBg = theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm';
                let statusBadge = (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {req.status}
                  </span>
                );

                if (isPending) {
                  cardBg = theme === 'dark'
                    ? 'bg-rose-950/40 border-rose-600/70 shadow-lg shadow-rose-950/40 text-slate-100'
                    : 'bg-rose-50/90 border-rose-300 shadow-md shadow-rose-100 text-slate-900';
                  statusBadge = (
                    <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold animate-pulse flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      MENUNGGU PETUGAS
                    </span>
                  );
                } else if (isResponding) {
                  cardBg = theme === 'dark'
                    ? 'bg-amber-950/30 border-amber-600/60 shadow-lg shadow-amber-950/30 text-slate-100'
                    : 'bg-amber-50/90 border-amber-300 shadow-md shadow-amber-100 text-slate-900';
                  statusBadge = (
                    <span className="px-2.5 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      PETUGAS MENUJU LOKASI (OTW)
                    </span>
                  );
                } else if (isResolved) {
                  cardBg = theme === 'dark'
                    ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75 text-slate-200'
                    : 'bg-emerald-50/70 border-emerald-200 opacity-90 text-slate-800';
                  statusBadge = (
                    <span className="px-2.5 py-0.5 bg-emerald-700 text-emerald-100 rounded text-[10px] font-bold">
                      SELESAI
                    </span>
                  );
                }

                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-2xl border transition-all ${cardBg}`}
                  >
                    {/* Top Row: Source Name + Status + Time */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${
                          isPending
                            ? (theme === 'dark' ? 'bg-rose-900/60 text-rose-300' : 'bg-rose-100 text-rose-700')
                            : isResponding
                            ? (theme === 'dark' ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-100 text-amber-700')
                            : (theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                        }`}>
                          {req.source_type === 'layanan_mandiri' || req.source_type === 'kiosk' ? (
                            <Laptop className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <span>{req.source_name}</span>
                          </h4>
                          <span className={`text-[10px] capitalize font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Sumber: {req.source_type === 'layanan_mandiri' ? 'Kiosk Mandiri' : req.source_type === 'gerai_tenant' ? 'Gerai Instansi' : req.source_type}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {statusBadge}
                        <span className={`text-[10px] font-mono block mt-1 flex items-center justify-end gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                          <Clock className="w-3 h-3 opacity-70" />
                          {timeAgoMin < 1 ? 'Baru saja' : `${timeAgoMin}m yang lalu`}
                        </span>
                      </div>
                    </div>

                    {/* Request Notes / Problem Description */}
                    {req.notes && (
                      <div className={`my-2.5 p-2.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                        theme === 'dark'
                          ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700 shadow-2xs font-medium'
                      }`}>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{req.notes}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className={`pt-2 border-t flex items-center justify-end gap-2 ${theme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'}`}>
                      {isPending && (
                        <button
                          id={`btn-otw-${req.id}`}
                          onClick={() => handleRespondOtw(req.id)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-900/40 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-200" />
                          <span>Tanggapi (OTW)</span>
                        </button>
                      )}

                      {(isPending || isResponding) && (
                        <button
                          id={`btn-resolve-${req.id}`}
                          onClick={() => handleResolve(req.id)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-900/40 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selesai</span>
                        </button>
                      )}

                      {isResolved && (
                        <div className="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>
                            Ditangani oleh {activeOperator.full_name.split(' ')[0]} ({new Date(req.resolved_at || '').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Custom Logout Confirmation Modal (100% iframe compatible) */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full rounded-3xl p-6 border shadow-2xl ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white shadow-rose-950/20' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-4 text-rose-500">
                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg">Konfirmasi Keluar (Logout)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Command Center Front Office MPP</p>
                </div>
              </div>

              <p className="text-sm mb-6 text-slate-600 dark:text-slate-300 font-medium">
                Apakah Anda yakin ingin keluar dari sesi Command Center Front Office? Sesi akses Anda akan diakhiri secara aman.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Ya, Keluar Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FO Officer Auth Modal Gate */}
      <FoOfficerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          if (!foSession) {
            navigate('/mpp');
          } else {
            setIsLoginModalOpen(false);
          }
        }}
        onSuccess={(sess) => {
          setFoSession(sess);
          setIsLoginModalOpen(false);
        }}
        isDarkMode={theme === 'dark'}
      />
    </div>
  );
}
export default MppFoCommandCenter;
