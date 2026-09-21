import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Radio, RefreshCw, Clock, Users, Building2, 
  ArrowRight, Search, CheckCircle2, AlertCircle, Volume2,
  Sparkles, Filter, ChevronRight, Maximize, Minimize,
  Play, Pause, ArrowUpDown, Megaphone
} from 'lucide-react';
import { MPPTenant } from '../../types/mpp';
import { KioskLang, KioskTheme } from '../MppAirportKioskModal';
import { KioskAudioEngine } from './MppKioskAudioAnnouncer';
import { supabase } from '../../lib/supabaseClient';
import { playQueueCallingSound } from '../../services/queueAudioAnnouncer';

interface MppAirportFidsBoardProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: MPPTenant[];
  onSelectTenant?: (tenant: MPPTenant) => void;
  lang: KioskLang;
  theme: KioskTheme;
}

const FIDS_I18N = {
  id: {
    fids_badge: 'FLIGHT INFORMATION DISPLAY SYSTEM (FIDS)',
    fids_title: 'PAPAN JADWAL & STATUS LOKET MPP',
    fids_subtitle: 'Status antrean dan ketersediaan gerai pelayanan publik secara langsung',
    terminal_all: 'Semua Gerai',
    terminal_a: 'Terminal A (Warga)',
    terminal_b: 'Terminal B (Investor VIP)',
    col_gate: 'LOKET / GATE',
    col_agency: 'INSTANSI / GERAI',
    col_service: 'LAYANAN UTAMA',
    col_status: 'STATUS LOKET',
    col_serving: 'SEDANG DILAYANI',
    col_waiting: 'ANTREAN',
    col_action: 'AKSI',
    status_open: 'LOKET DIBUKA',
    status_serving: 'SEDANG MELAYANI',
    status_boarding: 'PANGGILAN TIKET',
    status_break: 'ISTIRAHAT / STERILISASI',
    btn_select: 'Pilih Gerai',
    search_placeholder: 'Cari nama instansi atau nomor loket...',
    live_badge: 'LIVE REAL-TIME',
    auto_refresh: 'Sinkronisasi Otomatis',
    total_counters: 'Total Loket Aktif',
    close_btn: 'Tutup Papan FIDS',
    auto_scroll_on: 'Auto-Scroll: AKTIF',
    auto_scroll_off: 'Auto-Scroll: PAUSE'
  },
  en: {
    fids_badge: 'FLIGHT INFORMATION DISPLAY SYSTEM (FIDS)',
    fids_title: 'MPP SERVICE SCHEDULE & COUNTER BOARD',
    fids_subtitle: 'Real-time queue tracking and public service counter availability',
    terminal_all: 'All Counters',
    terminal_a: 'Terminal A (Citizens)',
    terminal_b: 'Terminal B (VIP Investors)',
    col_gate: 'GATE / COUNTER',
    col_agency: 'AGENCY / TENANT',
    col_service: 'PRIMARY SERVICE',
    col_status: 'STATUS',
    col_serving: 'NOW SERVING',
    col_waiting: 'WAITING',
    col_action: 'ACTION',
    status_open: 'COUNTER OPEN',
    status_serving: 'NOW SERVING',
    status_boarding: 'BOARDING CALL',
    status_break: 'REST / STERILIZING',
    btn_select: 'Select Counter',
    search_placeholder: 'Search agency name or gate number...',
    live_badge: 'LIVE REAL-TIME',
    auto_refresh: 'Auto Syncing',
    total_counters: 'Total Active Counters',
    close_btn: 'Close FIDS Board',
    auto_scroll_on: 'Auto-Scroll: ACTIVE',
    auto_scroll_off: 'Auto-Scroll: PAUSED'
  },
  zh: {
    fids_badge: '航班信息显示系统 (FIDS 风格)',
    fids_title: '政务服务大厅窗口时刻与状态大屏',
    fids_subtitle: '实时掌握入驻机构窗口办理进度与排队情况',
    terminal_all: '全部窗口',
    terminal_a: 'A 航站楼（居民）',
    terminal_b: 'B 航站楼（企业 VIP）',
    col_gate: '办理窗口',
    col_agency: '入驻单位',
    col_service: '主要办理事项',
    col_status: '窗口状态',
    col_serving: '当前呼叫',
    col_waiting: '等候人数',
    col_action: '操作',
    status_open: '窗口开启',
    status_serving: '正在办理',
    status_boarding: '号票呼叫中',
    status_break: '午间休息 / 整理',
    btn_select: '选取此窗口',
    search_placeholder: '搜索机构名称或窗口编号...',
    live_badge: '实时在线',
    auto_refresh: '自动同步',
    total_counters: '活跃窗口总数',
    close_btn: '关闭时刻大屏',
    auto_scroll_on: '自动滚动: 开启',
    auto_scroll_off: '自动滚动: 暂停'
  }
};

const getPrimaryServiceForTenant = (tenantName: string): string => {
  const name = (tenantName || '').toLowerCase();
  if (name.includes('dpmptsp') || name.includes('penanaman modal')) return 'Penerbitan NIB OSS-RBA, PBG, SLF & PKKPR';
  if (name.includes('bpn') || name.includes('pertanahan')) return 'Sertifikat SHM, PTSL & HT Elektronik';
  if (name.includes('dukcapil')) return 'KTP-el, KK, KIA, Akta & Aktivasi IKD';
  if (name.includes('bapenda') || name.includes('pajak daerah')) return 'PBB-P2, BPHTB & Validasi NPWPD';
  if (name.includes('sulselbar')) return 'Pembayaran Pemda, Rekening & KUR';
  if (name.includes('samsat')) return 'PKB Tahunan, STNK & Mutasi Ranmor';
  if (name.includes('bpjs kesehatan')) return 'Pendaftaran BPJS & Perubahan Faskes';
  if (name.includes('bpjs ketenagakerjaan')) return 'Klaim JHT, JP, JKK & JKM';
  if (name.includes('pupr') || name.includes('puptr')) return 'KRK & Rekomendasi Kesesuaian Tata Ruang';
  if (name.includes('kpp') || name.includes('pajak pratama')) return 'NPWP, Laporan SPT & Konsultasi Pajak';
  if (name.includes('kejaksaan')) return 'Pelayanan Hukum & Konsultasi Gratis';
  if (name.includes('taspen')) return 'Pengurusan Pensiun ASN & THT';
  if (name.includes('sosial')) return 'KIS, DTKS & Penanganan Bansos';
  if (name.includes('nakertrans') || name.includes('tenaga kerja')) return 'Kartu Kuning AK-1 & Pengaduan';
  if (name.includes('perikanan')) return 'Pas Kecil & NIB Usaha Nelayan';
  if (name.includes('kominfo')) return 'Informasi PPID & Layanan SP4N-Lapor';
  if (name.includes('pdam') || name.includes('tirta')) return 'Permohonan Pasang Baru & Cek Tagihan';
  if (name.includes('dekranasda')) return 'Galeri Produk UMKM & Pendampingan';
  if (name.includes('investasi')) return 'Pendampingan Konsultasi VIP Investor';
  return 'Layanan Perizinan & Administrasi Publik';
};

export const MppAirportFidsBoard: React.FC<MppAirportFidsBoardProps> = ({
  isOpen,
  onClose,
  tenants,
  onSelectTenant,
  lang,
  theme
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'a' | 'b'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCallingNotice, setActiveCallingNotice] = useState<{ queueNumber: string; counterName: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [todayQueues, setTodayQueues] = useState<any[]>([]);
  const [tenantServices, setTenantServices] = useState<Record<string, string>>({});

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const t = FIDS_I18N[lang];

  // Fetch data antrean riil dari Supabase untuk hari ini
  const fetchTodayQueues = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('mpp_queues')
        .select('*')
        .eq('queue_date', today);

      if (!error && data) {
        setTodayQueues(data);
      } else {
        setTodayQueues([]);
      }
    } catch (err) {
      console.error('Error fetching today queues for FIDS:', err);
      setTodayQueues([]);
    }
  };

  const fetchTenantServices = async () => {
    try {
      const { data, error } = await supabase
        .from('mpp_services')
        .select('tenant_id, service_name, is_active')
        .eq('is_active', true);
        
      if (!error && data) {
        const serviceMap: Record<string, string> = {};
        data.forEach(srv => {
          if (!serviceMap[srv.tenant_id]) {
            serviceMap[srv.tenant_id] = srv.service_name;
          } else {
            const currentParts = serviceMap[srv.tenant_id].split(', ');
            if (currentParts.length < 2) {
              serviceMap[srv.tenant_id] += `, ${srv.service_name}`;
            } else if (currentParts.length === 2 && !serviceMap[srv.tenant_id].endsWith('...')) {
              serviceMap[srv.tenant_id] += '...';
            }
          }
        });
        setTenantServices(serviceMap);
      }
    } catch (err) {
      console.error('Error fetching services for FIDS:', err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchTenantServices();
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, [isOpen]);

  // Sync state fullscreen dari browser API
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (boardContainerRef.current?.requestFullscreen) {
        boardContainerRef.current.requestFullscreen();
      } else if ((document.documentElement as any).requestFullscreen) {
        (document.documentElement as any).requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 1. Supabase Realtime Listener untuk memantau pendaftaran/perubahan status antrean mpp_queues
  useEffect(() => {
    if (!isOpen) return;

    fetchTodayQueues();

    const channel = supabase.channel('fids_realtime_announcements')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT or UPDATE
          schema: 'public',
          table: 'mpp_queues'
        },
        (payload: any) => {
          fetchTodayQueues();

          const rec = payload.new;
          if (!rec) return;

          // Deteksi status 'calling' atau 'dipanggil'
          if (rec.status === 'calling' || rec.status === 'dipanggil') {
            const queueNum = rec.ticket_code || rec.queue_number || 'A-001';
            const counterName = rec.counter_name || rec.tenant_name || rec.agency_name || 'Loket Pelayanan';

            setActiveCallingNotice({ queueNumber: queueNum, counterName });

            // 2 & 3. Urutan Eksekusi Audio: Chime (/audio/chime.mp3) -> TTS Bahasa Indonesia
            playQueueCallingSound(queueNum, counterName);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Filter tenants
  const filteredTenants = tenants.filter((tenant, idx) => {
    const isTerminalB = tenant.code?.includes('VIP') || tenant.name.toLowerCase().includes('dpmptsp') || tenant.name.toLowerCase().includes('tataruang') || tenant.name.toLowerCase().includes('investasi');
    if (filterMode === 'a' && isTerminalB) return false;
    if (filterMode === 'b' && !isTerminalB) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tenant.name.toLowerCase().includes(q) ||
        tenant.code.toLowerCase().includes(q) ||
        (tenant.floor && tenant.floor.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Smooth Looping Auto-Scroll Engine (Vertikal dari bawah ke atas & loop)
  useEffect(() => {
    if (!isOpen || !isAutoScroll || isHovered) return;

    let animId: number;
    let pauseTimer: NodeJS.Timeout | null = null;
    let isPaused = false;

    const scrollStep = () => {
      const container = scrollContainerRef.current;
      if (!container || isPaused) return;

      // Check if container has reach the bottom
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
        isPaused = true;
        pauseTimer = setTimeout(() => {
          if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
          }
          setTimeout(() => {
            isPaused = false;
            animId = requestAnimationFrame(scrollStep);
          }, 1200);
        }, 3000); // Tahan 3 detik di paling bawah sebelum reset ke paling atas
      } else {
        container.scrollTop += 0.75; // Kecepatan scroll halus (approx 45px/sec pada 60fps)
        animId = requestAnimationFrame(scrollStep);
      }
    };

    animId = requestAnimationFrame(scrollStep);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (pauseTimer) clearTimeout(pauseTimer);
    };
  }, [isOpen, isAutoScroll, isHovered, filteredTenants.length]);

  if (!isOpen) return null;

  return (
    <div ref={boardContainerRef} className={`fixed inset-0 z-[10000] flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'} bg-black/90 backdrop-blur-xl animate-in fade-in duration-200`}>
      <div className={`w-full ${isFullscreen ? 'h-full max-h-none rounded-none border-0' : 'w-[98vw] max-w-[1600px] h-[94vh] rounded-3xl border'} shadow-2xl flex flex-col overflow-hidden transition-all ${
        theme === 'dark'
          ? 'bg-[#050B14] border-amber-500/30 text-white shadow-amber-500/10'
          : 'bg-slate-50 border-slate-300 text-slate-900 shadow-2xl'
      }`}>
        {/* FIDS AIRPORT TOP HEADER */}
        <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 ${
          theme === 'dark' ? 'border-white/10 bg-[#0A1222]' : 'border-slate-300 bg-white'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5 ${
                theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}>
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                {t.fids_badge}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                theme === 'dark' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                {t.live_badge}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black font-mono tracking-tight mt-1 flex items-center gap-2">
              <span>{t.fids_title}</span>
            </h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.fids_subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Tombol Control Auto Scroll */}
            <button
              type="button"
              onClick={() => setIsAutoScroll(prev => !prev)}
              className={`px-3 py-2 rounded-2xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
                isAutoScroll
                  ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
              title={isAutoScroll ? 'Jeda Gulir Otomatis (Pause Auto-Scroll)' : 'Aktifkan Gulir Otomatis Berulang (Start Auto-Scroll Loop)'}
            >
              {isAutoScroll ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="hidden sm:inline">{t.auto_scroll_on}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="hidden sm:inline">{t.auto_scroll_off}</span>
                </>
              )}
            </button>

            {/* Tombol Uji Panggilan Audio (Chime + TTS) */}
            <button
              type="button"
              onClick={() => {
                const callingQ = todayQueues.find(q => q.status === 'calling' || q.status === 'dipanggil');
                const testNum = callingQ?.ticket_code || (callingQ?.queue_number ? `A-${String(callingQ.queue_number).padStart(3, '0')}` : 'A-001');
                const testCounter = callingQ?.counter_name || (filteredTenants[0] ? `Loket ${filteredTenants[0].name}` : 'Loket Pelayanan');
                setActiveCallingNotice({ queueNumber: testNum, counterName: testCounter });
                playQueueCallingSound(testNum, testCounter);
              }}
              className="px-3 py-2 rounded-2xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Uji Pemanggilan Antrean (Audio Chime & Voice TTS)"
            >
              <Volume2 className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Tes Audio</span>
            </button>

            {/* Tombol Pemicu Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`px-3 py-2 rounded-2xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
                isFullscreen
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
              title={isFullscreen ? 'Keluar dari Tampilan Layar Penuh' : 'Aktifkan Mode Monitor Layar Penuh (Fullscreen)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Keluar Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>

            {/* Live Clock Widget */}
            <div className={`px-4 py-1.5 rounded-2xl border flex flex-col items-center justify-center font-mono ${
              theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-slate-100 border-slate-300'
            }`}>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1 font-bold">
                <Clock className="w-3 h-3 text-amber-500" /> WITA
              </div>
              <div className={`text-base sm:text-lg font-black tabular-nums tracking-wider ${
                theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center cursor-pointer transition-colors ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ACTIVE CALLING NOTICE BANNER */}
        {activeCallingNotice && (
          <div className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 flex items-center justify-between gap-3 shadow-lg animate-pulse font-mono shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <Volume2 className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">PANGGILAN LOKET REAL-TIME</span>
                <span className="text-sm sm:text-base font-black text-amber-100">
                  Nomor Antrean <span className="underline decoration-amber-400 underline-offset-4">{activeCallingNotice.queueNumber}</span> ➔ Silakan Menuju <span className="text-white font-bold">{activeCallingNotice.counterName}</span>
                </span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveCallingNotice(null)}
              className="text-amber-300 hover:text-white p-1.5 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          theme === 'dark' ? 'bg-slate-950/60 border-white/5' : 'bg-slate-100/60 border-slate-200'
        }`}>
          {/* Terminal Tabs */}
          <div className={`flex items-center border rounded-xl p-1 text-xs font-bold ${
            theme === 'dark' ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-300'
          }`}>
            <button
              type="button"
              onClick={() => { setFilterMode('all'); KioskAudioEngine.playKeyBeep(); }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.terminal_all}
            </button>
            <button
              type="button"
              onClick={() => { setFilterMode('a'); KioskAudioEngine.playKeyBeep(); }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'a'
                  ? 'bg-emerald-600 text-white font-black shadow'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.terminal_a}
            </button>
            <button
              type="button"
              onClick={() => { setFilterMode('b'); KioskAudioEngine.playKeyBeep(); }}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'b'
                  ? 'bg-amber-600 text-white font-black shadow'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.terminal_b}
            </button>
          </div>

          {/* Search & Auto-Scroll Status Indicator */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isAutoScroll && (
              <span className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                <ArrowUpDown className="w-3 h-3 animate-bounce text-cyan-400" />
                <span>Auto-Looping</span>
              </span>
            )}

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search_placeholder}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs outline-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-white/10 text-white focus:border-amber-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600 shadow-sm'
                }`}
              />
            </div>
          </div>
        </div>

        {/* FIDS BOARD TABLE VIEW WITH SPLIT-FLAP / LED AESTHETICS */}
        <div 
          ref={scrollContainerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
          className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5"
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px] table-fixed">
              <colgroup>
                <col className="w-[12%]" /> {/* LOKET / GATE */}
                <col className="w-[24%]" /> {/* INSTANSI / GERAI */}
                <col className="w-[28%]" /> {/* LAYANAN UTAMA */}
                <col className="w-[14%]" /> {/* STATUS LOKET */}
                <col className="w-[11%]" /> {/* SEDANG DILAYANI */}
                <col className="w-[5%]" />  {/* ANTREAN */}
                <col className="w-[6%]" />  {/* AKSI */}
              </colgroup>
              <thead>
                <tr className={`border-b text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider sticky top-0 z-10 ${
                  theme === 'dark' ? 'border-white/15 text-amber-400 bg-[#070E1B]' : 'border-slate-300 text-amber-800 bg-slate-100'
                }`}>
                  <th className="py-4 px-3 sm:px-4 text-left rounded-l-xl whitespace-nowrap">{t.col_gate}</th>
                  <th className="py-4 px-3 sm:px-4 text-left whitespace-nowrap">{t.col_agency}</th>
                  <th className="py-4 px-3 sm:px-4 text-left whitespace-nowrap">{t.col_service}</th>
                  <th className="py-4 px-3 sm:px-4 text-center whitespace-nowrap">{t.col_status}</th>
                  <th className="py-4 px-3 sm:px-4 text-center whitespace-nowrap">{t.col_serving}</th>
                  <th className="py-4 px-3 sm:px-4 text-center whitespace-nowrap">{t.col_waiting}</th>
                  <th className="py-4 px-3 sm:px-4 text-right rounded-r-xl whitespace-nowrap">{t.col_action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-400">
                      Tidak ada data loket yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant, index) => {
                    // Cari data antrean riil dari database Supabase (mpp_queues)
                    const tenantQueues = todayQueues.filter(q => q.tenant_id === tenant.id || q.tenant_code === tenant.code);
                    const callingQueue = tenantQueues.find(q => q.status === 'calling' || q.status === 'dipanggil');
                    const servingQueue = callingQueue || tenantQueues.find(q => q.status === 'dilayani' || q.status === 'serving');

                    const isBoarding = !!callingQueue;
                    const isResting = (tenant as any).is_open === false || (tenant as any).status === 'tutup';
                    const isServing = !!servingQueue && !isBoarding;

                    const queuePrefix = tenant.code || 'A';
                    const activeNumber = servingQueue
                      ? (servingQueue.ticket_code || `${queuePrefix}-${String(servingQueue.queue_number || 1).padStart(3, '0')}`)
                      : '-';

                    const waitingCount = tenantQueues.filter(q => q.status === 'menunggu').length;
                    const primaryService = tenantServices[tenant.id] || getPrimaryServiceForTenant(tenant.name);

                    return (
                      <tr 
                        key={tenant.id}
                        className={`transition-colors duration-150 align-middle ${
                          theme === 'dark' 
                            ? 'hover:bg-amber-500/10' 
                            : 'hover:bg-slate-100/80'
                        }`}
                      >
                        {/* Gate / Counter Column */}
                        <td className="py-4 sm:py-5 px-3 sm:px-4 text-left align-middle whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-lg font-black text-xs sm:text-sm border tabular-nums font-mono whitespace-nowrap inline-block shadow-sm ${
                            theme === 'dark' 
                              ? 'bg-slate-900 border-amber-500/40 text-amber-300 shadow-amber-500/5' 
                              : 'bg-amber-50 border-amber-400 text-amber-900'
                          }`}>
                            {`LOKET ${String(index + 1).padStart(2, '0')}`}
                          </span>
                        </td>

                        {/* Agency Name */}
                        <td className="py-4 sm:py-5 px-3 sm:px-4 text-left align-middle">
                          <div className="font-sans font-bold text-xs sm:text-sm text-slate-100">{tenant.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">{tenant.floor || 'Lantai 1'}</div>
                        </td>

                        {/* Main Service */}
                        <td className="py-4 sm:py-5 px-3 sm:px-4 text-left align-middle">
                          <span className={`text-xs font-sans font-medium block leading-snug ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          }`} title={primaryService}>
                            {primaryService}
                          </span>
                        </td>

                        {/* Status Loket Badge */}
                        <td className="py-4 sm:py-5 px-3 sm:px-4 text-center align-middle whitespace-nowrap">
                          {isBoarding ? (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500 text-amber-300 text-[10px] font-bold animate-pulse whitespace-nowrap">
                              <Volume2 className="w-3.5 h-3.5" /> {t.status_boarding}
                            </span>
                          ) : isResting ? (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-500/20 border border-slate-500 text-slate-400 text-[10px] font-bold whitespace-nowrap">
                              {t.status_break}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-[10px] font-bold whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {t.status_serving}
                            </span>
                          )}
                        </td>

                        {/* Now Serving Queue Number */}
                        <td className="py-4 sm:py-5 px-3 sm:px-4 text-center align-middle whitespace-nowrap">
                          <span className={`text-sm sm:text-base font-black px-3 py-1 rounded tracking-widest tabular-nums font-mono whitespace-nowrap inline-block ${
                            isBoarding 
                              ? 'bg-amber-500 text-slate-950 font-black animate-bounce shadow-lg shadow-amber-500/20' 
                              : theme === 'dark' ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          }`}>
                            {isResting ? '-' : activeNumber}
                          </span>
                        </td>

                        {/* Waiting Queue Count */}
                        <td className="py-4 sm:py-5 px-3 sm:px-4 text-center align-middle whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums font-mono whitespace-nowrap inline-block ${
                            theme === 'dark' ? 'bg-slate-900 text-slate-300 border border-white/5' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {waitingCount} org
                          </span>
                        </td>

                        {/* Action Select */}
                        <td className="py-4 sm:py-5 px-3 sm:px-4 text-right align-middle whitespace-nowrap">
                          {onSelectTenant ? (
                            <button
                              type="button"
                              onClick={() => {
                                KioskAudioEngine.playSuccessSound();
                                onSelectTenant(tenant);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <span>{t.btn_select}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Airport FIDS Live Marquee Ticker */}
        <div className={`px-4 py-2 border-t border-b flex items-center gap-3 overflow-hidden text-xs font-mono shrink-0 ${
          theme === 'dark' ? 'bg-slate-950 border-white/10 text-amber-300' : 'bg-amber-500 text-slate-950 font-bold'
        }`}>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase shrink-0 text-[10px]">
            <Megaphone className="w-3 h-3 text-amber-400 animate-bounce" /> INFORMASI MPP
          </div>
          {React.createElement(
            'marquee',
            { className: 'whitespace-nowrap tracking-wide font-medium' },
            '📢 SELAMAT DATANG DI MALL PELAYANAN PUBLIK (MPP) SIMPURUSIANG KABUPATEN LUWU • HARAP PERSIAPKAN DOKUMEN PERSYARATAN & KTP-EL SEBELUM MENUJU LOKET • JAM OPERASIONAL: 07.30 - 16.00 WITA • BEBAS PUNGLI & PERSYARATAN ANTREAN RESMI • KONSULTASI VIP INVESTOR TERSEDIA DI TERMINAL B'
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs font-mono shrink-0 ${
          theme === 'dark' ? 'border-white/10 bg-[#070E1B] text-slate-400' : 'border-slate-300 bg-slate-100 text-slate-600'
        }`}>
          <div className="flex items-center gap-4">
            <span>{t.total_counters}: <strong className="text-amber-400">{tenants.length} Loket</strong></span>
            {isAutoScroll && (
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                (Arahkan kursor / sentuh layar untuk jeda scroll)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl border font-bold cursor-pointer transition-colors ${
              theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-300 bg-white hover:bg-slate-200 text-slate-800'
            }`}
          >
            {t.close_btn}
          </button>
        </div>
      </div>
    </div>
  );
};

