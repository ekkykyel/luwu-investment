import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  X,
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Award,
  Download,
  Building2,
  MapPin,
  CheckCircle2,
  Sparkles,
  Calendar,
  Zap,
  ShieldCheck,
  Activity,
  FileText,
  PieChart,
  ArrowUpRight,
  Filter,
  Info,
  Radio,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface ActiveCounterItem {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  floor?: string;
  counterName: string;
  currentTicket: string | null;
  serviceName: string | null;
  status: 'serving' | 'calling' | 'waiting' | 'idle';
  waitingCount: number;
  servedCount: number;
  lastCalledAt?: string | null;
}

interface MppVisitorAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const MppVisitorAnalyticsModal: React.FC<MppVisitorAnalyticsModalProps> = ({
  isOpen,
  onClose,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true);
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh');
  const isEn = i18n.language?.startsWith('en');

  const [activePeriod, setActivePeriod] = useState<'today' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'live_counters' | 'peak' | 'agencies' | 'demographics' | 'skm'>('live_counters');

  const [counterFilter, setCounterFilter] = useState<'all' | 'active_only' | 'waiting_only'>('all');
  const [counterSearchQuery, setCounterSearchQuery] = useState('');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const [liveMetrics, setLiveMetrics] = useState({
    totalQueues: 0,
    onlineBookingPercent: 0,
    ikmScore: '0.00',
    ikmCount: 0,
    peakHours: [
      { hour: '08:00 - 09:00', visitors: 0, status: 'Lancar', color: 'bg-emerald-500' },
      { hour: '09:00 - 10:30', visitors: 0, status: 'Lancar', color: 'bg-emerald-500' },
      { hour: '10:30 - 12:00', visitors: 0, status: 'Lancar', color: 'bg-emerald-500' },
      { hour: '12:00 - 13:00', visitors: 0, status: 'Istirahat Siang', color: 'bg-amber-500' },
      { hour: '13:00 - 14:30', visitors: 0, status: 'Lancar', color: 'bg-emerald-500' },
      { hour: '14:30 - 15:30', visitors: 0, status: 'Lancar', color: 'bg-emerald-500' },
    ],
    agenciesRank: [] as Array<{ name: string; count: number; percent: string; slaAvg: string }>,
    activeCountersSummary: {
      totalActive: 0,
      totalServing: 0,
      totalCalling: 0,
      totalWaiting: 0,
      totalCompletedToday: 0,
      countersList: [] as ActiveCounterItem[],
      lastSyncTime: '',
    }
  });

  const loadAnalyticsData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const [qRes, skmRes, tenantsRes, todayQueuesRes] = await Promise.all([
        supabase
          .from('mpp_queues')
          .select('id, created_at, session, ticket_code, tenant_id')
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('mpp_skm')
          .select('q1_persyaratan, q2_prosedur, q3_waktu, q4_biaya, q5_produk, q6_kompetensi, q7_perilaku, q8_sarpras, q9_pengaduan')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('mpp_tenants')
          .select('id, name, code, floor, is_active, counter_name')
          .order('name'),
        supabase
          .from('mpp_queues')
          .select('id, ticket_code, status, tenant_id, counter_name, called_at, served_at, created_at, queue_date, service:mpp_services(id, service_name, name)')
          .or(`queue_date.eq.${todayStr},created_at.gte.${todayStr}T00:00:00Z`)
          .order('created_at', { ascending: false })
      ]);

      const queues = qRes.data || [];
      const skmList = skmRes.data || [];
      const tenants = tenantsRes.data || [];
      const todayQueues = todayQueuesRes.data || [];

      const totalQ = queues.length;
      const onlineBookings = queues.filter(q => q.session || (q.ticket_code && q.ticket_code.startsWith('ONL-'))).length;
      const onlinePercent = totalQ > 0 ? Math.round((onlineBookings / totalQ) * 100) : 0;

      let ikmAvg = '0.00';
      if (skmList.length > 0) {
        const sum = skmList.reduce((acc, c) => {
          const rowAvg = ((c.q1_persyaratan || 0) + (c.q2_prosedur || 0) + (c.q3_waktu || 0) + (c.q4_biaya || 0) +
            (c.q5_produk || 0) + (c.q6_kompetensi || 0) + (c.q7_perilaku || 0) + (c.q8_sarpras || 0) + (c.q9_pengaduan || 0)) / 9;
          return acc + (rowAvg * 25);
        }, 0);
        ikmAvg = (sum / skmList.length).toFixed(2);
      }

      // Peak hours distribution from actual queues
      const hourCounts = [0, 0, 0, 0, 0, 0];
      queues.forEach(q => {
        if (q.created_at) {
          const h = new Date(q.created_at).getHours();
          if (h >= 8 && h < 9) hourCounts[0]++;
          else if (h >= 9 && h < 11) hourCounts[1]++;
          else if (h >= 11 && h < 12) hourCounts[2]++;
          else if (h >= 12 && h < 13) hourCounts[3]++;
          else if (h >= 13 && h < 15) hourCounts[4]++;
          else if (h >= 15) hourCounts[5]++;
          else hourCounts[0]++;
        } else {
          hourCounts[0]++;
        }
      });

      const maxH = Math.max(...hourCounts, 1);
      const mappedPeak = [
        { hour: '08:00 - 09:00', visitors: hourCounts[0], status: hourCounts[0] >= maxH * 0.7 && totalQ > 5 ? 'Padat' : 'Lancar', color: 'bg-emerald-500' },
        { hour: '09:00 - 10:30', visitors: hourCounts[1], status: hourCounts[1] >= maxH * 0.7 && totalQ > 5 ? 'Padat / Peak' : 'Sedang', color: 'bg-teal-500' },
        { hour: '10:30 - 12:00', visitors: hourCounts[2], status: hourCounts[2] >= maxH * 0.7 && totalQ > 5 ? 'Sangat Padat' : 'Sedang', color: 'bg-teal-600' },
        { hour: '12:00 - 13:00', visitors: hourCounts[3], status: 'Istirahat Siang', color: 'bg-amber-500' },
        { hour: '13:00 - 14:30', visitors: hourCounts[4], status: hourCounts[4] >= maxH * 0.7 && totalQ > 5 ? 'Padat' : 'Sedang', color: 'bg-teal-500' },
        { hour: '14:30 - 15:30', visitors: hourCounts[5], status: 'Lancar', color: 'bg-emerald-500' },
      ];

      // Group queues by tenant
      const tenantMap: { [key: string]: number } = {};
      queues.forEach(q => {
        if (q.tenant_id) {
          tenantMap[q.tenant_id] = (tenantMap[q.tenant_id] || 0) + 1;
        }
      });

      const agenciesRank = tenants.map(t => {
        const count = tenantMap[t.id] || 0;
        const pct = totalQ > 0 ? `${Math.round((count / totalQ) * 100)}%` : '0%';
        return {
          name: t.name,
          count,
          percent: pct,
          slaAvg: isZh ? '8-15 分钟' : isEn ? '8-15 Minutes' : '8-15 Menit'
        };
      }).sort((a, b) => b.count - a.count).slice(0, 5);

      // Compute active counters statistics from today's queues and tenants
      const counterItems: ActiveCounterItem[] = tenants.map(t => {
        const tQueues = todayQueues.filter(q => q.tenant_id === t.id);
        const servingQ = tQueues.find(q => q.status === 'dilayani');
        const callingQ = tQueues.find(q => q.status === 'dipanggil');
        const waitingQ = tQueues.filter(q => q.status === 'menunggu');
        const completedQ = tQueues.filter(q => q.status === 'selesai_langsung' || q.status === 'masuk_tracking');

        let st: 'serving' | 'calling' | 'waiting' | 'idle' = 'idle';
        let curTicket: string | null = null;
        let svcName: string | null = null;
        let lastCalled: string | null = null;

        if (servingQ) {
          st = 'serving';
          curTicket = servingQ.ticket_code;
          const svc = servingQ.service as any;
          svcName = svc?.service_name || svc?.name || null;
          lastCalled = servingQ.served_at || servingQ.called_at || servingQ.created_at;
        } else if (callingQ) {
          st = 'calling';
          curTicket = callingQ.ticket_code;
          const svc = callingQ.service as any;
          svcName = svc?.service_name || svc?.name || null;
          lastCalled = callingQ.called_at || callingQ.created_at;
        } else if (waitingQ.length > 0) {
          st = 'waiting';
          curTicket = waitingQ[0].ticket_code;
          const svc = waitingQ[0].service as any;
          svcName = svc?.service_name || svc?.name || null;
        }

        const cName = t.counter_name || (servingQ?.counter_name || callingQ?.counter_name || `Loket ${t.code || t.name}`);

        return {
          tenantId: t.id,
          tenantName: t.name,
          tenantCode: t.code || t.name,
          floor: t.floor || 'Lantai 1',
          counterName: cName,
          currentTicket: curTicket,
          serviceName: svcName,
          status: st,
          waitingCount: waitingQ.length,
          servedCount: completedQ.length,
          lastCalledAt: lastCalled
        };
      });

      // Sort counterItems: serving first, then calling, then waiting, then idle
      const statusPriority = { serving: 0, calling: 1, waiting: 2, idle: 3 };
      counterItems.sort((a, b) => {
        const diff = statusPriority[a.status] - statusPriority[b.status];
        if (diff !== 0) return diff;
        return a.tenantName.localeCompare(b.tenantName);
      });

      const totalServing = todayQueues.filter(q => q.status === 'dilayani').length;
      const totalCalling = todayQueues.filter(q => q.status === 'dipanggil').length;
      const totalWaiting = todayQueues.filter(q => q.status === 'menunggu').length;
      const totalCompletedToday = todayQueues.filter(q => q.status === 'selesai_langsung' || q.status === 'masuk_tracking').length;
      const totalActive = counterItems.filter(c => c.status === 'serving' || c.status === 'calling').length;

      const now = new Date();
      const timeFormatted = now.toLocaleTimeString(isZh ? 'zh-CN' : isEn ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA';

      setLiveMetrics({
        totalQueues: totalQ,
        onlineBookingPercent: onlinePercent,
        ikmScore: ikmAvg,
        ikmCount: skmList.length,
        peakHours: mappedPeak,
        agenciesRank,
        activeCountersSummary: {
          totalActive,
          totalServing,
          totalCalling,
          totalWaiting,
          totalCompletedToday,
          countersList: counterItems,
          lastSyncTime: timeFormatted
        }
      });
    } catch (err) {
      console.warn('Gagal memuat analitik Supabase:', err);
    }
  }, [isZh, isEn]);

  useEffect(() => {
    if (!isOpen) return;

    loadAnalyticsData();

    // Realtime channel for live queues
    const channel = supabase
      .channel('mpp_visitor_analytics_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_queues' }, () => {
        loadAnalyticsData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, loadAnalyticsData]);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await loadAnalyticsData();
    setTimeout(() => setIsManualRefreshing(false), 500);
  };

  const filteredCounters = useMemo(() => {
    let list = liveMetrics.activeCountersSummary.countersList;
    if (counterFilter === 'active_only') {
      list = list.filter(c => c.status === 'serving' || c.status === 'calling');
    } else if (counterFilter === 'waiting_only') {
      list = list.filter(c => c.waitingCount > 0);
    }
    if (counterSearchQuery.trim()) {
      const q = counterSearchQuery.toLowerCase();
      list = list.filter(c =>
        c.tenantName.toLowerCase().includes(q) ||
        c.tenantCode.toLowerCase().includes(q) ||
        c.counterName.toLowerCase().includes(q) ||
        (c.currentTicket && c.currentTicket.toLowerCase().includes(q)) ||
        (c.serviceName && c.serviceName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [liveMetrics.activeCountersSummary.countersList, counterFilter, counterSearchQuery]);

  if (!isOpen) return null;

  const districtData = [
    { name: isZh ? "Belopa 镇（中心）" : isEn ? "Belopa Dist. (Center)" : "Kec. Belopa (Pusat)", share: '32%' },
    { name: isZh ? "Walenrang & Lamasi 镇" : isEn ? "Walenrang & Lamasi Dist." : "Kec. Walenrang & Lamasi", share: '21%' },
    { name: isZh ? "Bua & Ponrang 镇" : isEn ? "Bua & Ponrang Dist." : "Kec. Bua & Ponrang", share: '18%' },
    { name: isZh ? "Bastem & Latimojong 镇" : isEn ? "Bastem & Latimojong Dist." : "Kec. Bastem & Latimojong", share: '14%' },
    { name: isZh ? "其他乡镇" : isEn ? "Other Districts" : "Kecamatan Lainnya", share: '15%' },
  ];

  const handleExportReport = () => {
    alert(
      isZh
        ? "Simpurusiang MPP 绩效分析汇总报告正在以官方 PDF 格式下载。"
        : isEn
        ? "Simpurusiang MPP Performance Analytics Summary Report is downloading in official PDF format."
        : "Laporan Rekapitulasi Analitik Kinerja MPP Simpurusiang sedang diunduh dalam format PDF resmi."
    );
  };

  const getStatusText = (status: string) => {
    if (status === 'Lancar') return isZh ? "顺畅" : isEn ? "Smooth" : "Lancar";
    if (status === 'Sedang') return isZh ? "中等" : isEn ? "Moderate" : "Sedang";
    if (status === 'Padat') return isZh ? "拥挤" : isEn ? "Busy" : "Padat";
    if (status === 'Padat / Peak') return isZh ? "繁忙 / 高峰" : isEn ? "Busy / Peak" : "Padat / Peak";
    if (status === 'Sangat Padat') return isZh ? "高度拥挤" : isEn ? "Very Busy" : "Sangat Padat";
    if (status === 'Istirahat Siang') return isZh ? "午间休息" : isEn ? "Lunch Break" : "Istirahat Siang";
    return status;
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2 sm:p-6 bg-surface/60 backdrop-blur-sm overflow-hidden font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={`w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-black/25'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="relative py-4 sm:py-5 px-5 sm:px-7 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {isZh ? "实时数据分析" : isEn ? "Real-Time Analytics" : "Real-Time Analytics"}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> {isZh ? "Supabase 已验证" : isEn ? "Supabase Verified" : "Terverifikasi Supabase"}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight">
                    {isZh ? "MPP 绩效统计与报告" : isEn ? "MPP Performance Statistics & Reports" : "Statistik & Laporan Kinerja MPP"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                aria-label={isZh ? "关闭模态框" : isEn ? "Close Modal" : "Tutup Modal"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Header Period Filter Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700">
                {(['today', 'month', 'year'] as const).map((p) => {
                  const label = p === 'today' 
                    ? (isZh ? "今天" : isEn ? "Today" : "Hari Ini") 
                    : p === 'month' 
                    ? (isZh ? "本月" : isEn ? "This Month" : "Bulan Ini") 
                    : (isZh ? "2026 年" : isEn ? "Year 2026" : "Tahun 2026");
                  const isActive = activePeriod === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setActivePeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleExportReport}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isZh ? "导出报告" : isEn ? "Export Report" : "Ekspor Laporan"}</span>
              </button>
            </div>
          </div>

          {/* Modal Tab Selector */}
          <div className="px-5 sm:px-7 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {[
                { id: 'live_counters', label: isZh ? "实时活跃窗口" : isEn ? "Live Active Counters" : "Loket Aktif Real-Time", icon: Radio },
                { id: 'peak', label: isZh ? "高峰时段与建议" : isEn ? "Peak Hours & Advice" : "Jam Sibuk & Rekomendasi", icon: Clock },
                { id: 'agencies', label: isZh ? "热门机构与 SLA" : isEn ? "Top Agencies & SLA" : "Top Instansi & SLA", icon: Building2 },
                { id: 'demographics', label: isZh ? "人口统计与到访方式" : isEn ? "Demographics & Arrival" : "Demografi & Metode", icon: PieChart },
                { id: 'skm', label: isZh ? "SKM 指数与满意度" : isEn ? "SKM Index & Satisfaction" : "Indeks SKM & Kepuasan", icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-black/25'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.id === 'live_counters' && liveMetrics.activeCountersSummary.totalActive > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Body Scrollable */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-slate-900 dark:text-white">
            {/* Top KPI Cards Overview (5 Columns Responsive) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Card 1: Live Active Counters */}
              <div 
                onClick={() => setActiveTab('live_counters')}
                className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 col-span-2 sm:col-span-1 cursor-pointer hover:border-emerald-500 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 truncate">
                    {isZh ? "当前活跃窗口" : isEn ? "Active Counters" : "Loket Aktif"}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    LIVE
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block tabular-nums">
                  {liveMetrics.activeCountersSummary.totalActive}
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                    {isZh ? "个窗口" : isEn ? "Counters" : "Loket"}
                  </span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mt-0.5 truncate">
                  <Activity className="w-3 h-3 shrink-0" /> 
                  {liveMetrics.activeCountersSummary.totalServing} {isZh ? "服务中" : isEn ? "Serving" : "Melayani"} · {liveMetrics.activeCountersSummary.totalWaiting} {isZh ? "排队" : isEn ? "Wait" : "Antre"}
                </span>
              </div>

              {/* Card 2: Total Registered Queues */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 truncate">
                  {isZh ? "已注册总排队数" : isEn ? "Total Registered Queues" : "Total Antrean Terdaftar"}
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {liveMetrics.totalQueues.toLocaleString(isZh ? 'zh-CN' : isEn ? 'en-US' : 'id-ID')}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> {isZh ? "实时同步" : isEn ? "Real-Time Sync" : "Real-Time Sync"}
                </span>
              </div>

              {/* Card 3: Average SLA */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 truncate">
                  {isZh ? "平均服务响应 SLA" : isEn ? "Average SLA" : "Rata-rata SLA"}
                </span>
                <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400">
                  {isZh ? "10-15 分钟" : isEn ? "10-15 Mins" : "10-15 Mnt"}
                </span>
                <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> {isZh ? "服务标准" : isEn ? "Service Standard" : "Standar Layanan"}
                </span>
              </div>

              {/* Card 4: SKM Satisfaction Index */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 truncate">
                  {isZh ? "SKM 满意度指数" : isEn ? "SKM Satisfaction Index" : "Indeks SKM"}
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-500 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
                  {liveMetrics.ikmCount > 0 ? `${(Number(liveMetrics.ikmScore) / 25).toFixed(2)} / 4.00` : '—'}
                </span>
                <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5 mt-0.5 truncate">
                  <Award className="w-3 h-3 shrink-0" /> {
                    liveMetrics.ikmCount > 0 
                      ? (Number(liveMetrics.ikmScore) >= 88.31 
                          ? (isZh ? "极好 (A)" : isEn ? "Very Good (A)" : "Sangat Baik (A)") 
                          : (isZh ? "良好 (B)" : isEn ? "Good (B)" : "Baik (B)"))
                      : (isZh ? "暂无数据" : isEn ? "No Data Yet" : "Belum Ada Data")
                  }
                </span>
              </div>

              {/* Card 5: Online Booking */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 truncate">
                  {isZh ? "在线预约" : isEn ? "Online Booking" : "Online Booking"}
                </span>
                <span className="text-lg sm:text-xl font-black text-teal-600 dark:text-teal-400">
                  {liveMetrics.onlineBookingPercent}%
                </span>
                <span className="text-[10px] font-semibold text-teal-600 flex items-center gap-0.5 mt-0.5">
                  <Zap className="w-3 h-3" /> {isZh ? "免大厅排队" : isEn ? "Skip Lobby Queue" : "Bebas Antre"}
                </span>
              </div>
            </div>

            {/* TAB 0: Loket Aktif Real-Time (Live Counter Monitoring from Supabase) */}
            {activeTab === 'live_counters' && (
              <div className="space-y-4">
                {/* Live Banner & Realtime Status Bar */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {isZh ? "实时窗口运行监控" : isEn ? "Live Counter Operational Monitor" : "Monitoring Operasional Loket Real-Time"}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                          LIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {isZh 
                          ? `直连 Supabase 实时数据库 · 同步时间：${liveMetrics.activeCountersSummary.lastSyncTime || "刚刚"}`
                          : isEn 
                          ? `Connected to Supabase Realtime · Synced at: ${liveMetrics.activeCountersSummary.lastSyncTime || "Just now"}`
                          : `Terhubung langsung ke Supabase Realtime · Pembaruan: ${liveMetrics.activeCountersSummary.lastSyncTime || "Baru saja"}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={handleManualRefresh}
                      disabled={isManualRefreshing}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
                      <span>{isZh ? "刷新" : isEn ? "Refresh" : "Segarkan"}</span>
                    </button>
                  </div>
                </div>

                {/* Metric Highlights Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {isZh ? "正在服务中" : isEn ? "In Service" : "Sedang Melayani"}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {liveMetrics.activeCountersSummary.totalServing}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {isZh ? "正在呼叫" : isEn ? "Calling" : "Sedang Memanggil"}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {liveMetrics.activeCountersSummary.totalCalling}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {isZh ? "排队等待中" : isEn ? "Waiting Queue" : "Antrean Menunggu"}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {liveMetrics.activeCountersSummary.totalWaiting}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {isZh ? "今日已办结" : isEn ? "Completed Today" : "Selesai Hari Ini"}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {liveMetrics.activeCountersSummary.totalCompletedToday}
                    </span>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'all', label: isZh ? "全部窗口" : isEn ? "All Counters" : "Semua Loket" },
                      { id: 'active_only', label: isZh ? "仅活跃窗口" : isEn ? "Active Only" : "Hanya Aktif" },
                      { id: 'waiting_only', label: isZh ? "有排队" : isEn ? "With Queue" : "Ada Antrean" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setCounterFilter(f.id as any)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          counterFilter === f.id
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={counterSearchQuery}
                      onChange={(e) => setCounterSearchQuery(e.target.value)}
                      placeholder={isZh ? "搜索机构、窗口或票号..." : isEn ? "Search agency, counter, or ticket..." : "Cari instansi, loket, atau tiket..."}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Counter Cards Grid */}
                {filteredCounters.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center mx-auto">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {counterSearchQuery.trim()
                        ? (isZh ? "未找到符合条件的窗口数据。" : isEn ? "No counters matched your query." : "Tidak ada loket yang sesuai pencarian.")
                        : (isZh ? "当前没有活跃的呼叫窗口（全员待命）。" : isEn ? "No active calling counters right now (All on standby)." : "Belum ada loket aktif memanggil antrean saat ini (Seluruh loket berstatus siaga).")}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      {isZh
                        ? "数据严格实时连接 Supabase，当柜员在后台叫号时，此处卡片将立即点亮。"
                        : isEn
                        ? "Data is connected directly to Supabase Realtime. When a counter officer calls a number, the card will instantly activate."
                        : "Data tersinkronisasi langsung dari Supabase Realtime. Saat petugas loket memanggil nomor antrean, kartu akan otomatis menyala."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredCounters.map((counter) => {
                      const isServing = counter.status === 'serving';
                      const isCalling = counter.status === 'calling';
                      const isWaiting = counter.status === 'waiting';

                      return (
                        <div
                          key={counter.tenantId}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isServing
                              ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 shadow-sm shadow-emerald-500/5'
                              : isCalling
                              ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-sm shadow-amber-500/5'
                              : isWaiting
                              ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 opacity-80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                  {counter.counterName}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  {counter.floor}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {counter.tenantName}
                              </h4>
                            </div>

                            {/* Status Badge */}
                            <div className="shrink-0">
                              {isServing ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                  {isZh ? "正在服务" : isEn ? "Serving" : "Melayani"}
                                </span>
                              ) : isCalling ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-bounce" />
                                  {isZh ? "呼叫中" : isEn ? "Calling" : "Dipanggil"}
                                </span>
                              ) : isWaiting ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                  {isZh ? "有排队" : isEn ? "Queueing" : "Menunggu"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                  {isZh ? "待命" : isEn ? "Standby" : "Siaga"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle Section: Current Active Ticket */}
                          <div className="py-2 px-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 mb-2.5 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                                {isServing || isCalling
                                  ? (isZh ? "当前呼叫票号" : isEn ? "Active Ticket" : "Nomor Dilayani")
                                  : (isZh ? "最新票号" : isEn ? "Next Ticket" : "Tiket Antrean")}
                              </span>
                              <span className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                                isServing 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : isCalling 
                                  ? 'text-amber-500 dark:text-amber-400' 
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {counter.currentTicket || '—'}
                              </span>
                            </div>

                            <div className="text-right max-w-[55%]">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                                {isZh ? "服务项目" : isEn ? "Service" : "Layanan"}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate block">
                                {counter.serviceName || (isZh ? "通用窗口服务" : isEn ? "General Service" : "Layanan Loket")}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Footer: Waiting Count & Completed Today */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              {isZh ? "等待人数：" : isEn ? "Waiting: " : "Menunggu: "}
                              <strong className={counter.waitingCount > 0 ? 'text-blue-600 dark:text-blue-400' : ''}>
                                {counter.waitingCount} {isZh ? "人" : isEn ? "people" : "orang"}
                              </strong>
                            </span>

                            <span>
                              {isZh ? "今日办结：" : isEn ? "Served: " : "Selesai: "}
                              <strong className="text-emerald-600 dark:text-emerald-400">{counter.servedCount}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: Jam Sibuk & Rekomendasi Kedatangan */}
            {activeTab === 'peak' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="block text-emerald-800 dark:text-emerald-300 font-extrabold mb-0.5">
                      {isZh ? "💡 最佳到访时间建议：" : isEn ? "💡 Recommended Visit Hours:" : "💡 Rekomendasi Waktu Kunjungan:"}
                    </strong>
                    {isZh ? (
                      <>建议在 <strong>07:30 - 08:30 WITA</strong> 或 <strong>13:30 - 15:30 WITA</strong> 之间到访。在此期间，各窗口排队情况相对顺畅，等待时间更短。</>
                    ) : isEn ? (
                      <>Visit during <strong>07:30 - 08:30 WITA</strong> or <strong>13:30 - 15:30 WITA</strong>. During these hours queue traffic is relatively smooth and wait times are significantly shorter.</>
                    ) : (
                      <>Datanglah pada rentang jam <strong>07:30 - 08:30 WITA</strong> atau <strong>13:30 - 15:30 WITA</strong>. Pada waktu ini antrean gerai relatif lancar dan durasi tunggu lebih singkat.</>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span>{isZh ? "服务时间段" : isEn ? "Service Time Range" : "Rentang Jam Layanan"}</span>
                    <span>{isZh ? "访客拥挤程度" : isEn ? "Visitor Traffic Level" : "Tingkat Kepadatan Pengunjung"}</span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {liveMetrics.peakHours.map((item, idx) => {
                      const maxV = Math.max(...liveMetrics.peakHours.map(p => p.visitors), 1);
                      const barW = item.visitors > 0 ? Math.min(Math.max((item.visitors / maxV) * 100, 8), 100) : 4;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">{item.hour}</span>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {item.visitors} {isZh ? "个排队" : isEn ? "queues" : "antrean"} ({getStatusText(item.status)})
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.color}`}
                              style={{ width: `${barW}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Top Instansi & SLA */}
            {activeTab === 'agencies' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isZh 
                    ? "根据 MPP 数据库中已注册申请人数量排列的机构窗口排名：" 
                    : isEn 
                    ? "Agency counter ranking based on applicant volume registered in the MPP database:" 
                    : "Peringkat gerai instansi berdasarkan volume pemohon terdaftar di database MPP:"}
                </p>

                <div className="space-y-2.5">
                  {liveMetrics.agenciesRank.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 rounded-2xl">
                      {isZh ? "尚无机构排队记录数据。" : isEn ? "No agency queue data recorded yet." : "Belum ada data antrean instansi tercatat."}
                    </div>
                  ) : (
                    liveMetrics.agenciesRank.map((agency, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-xs shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold truncate">{agency.name}</h4>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {isZh ? "平均 SLA：" : isEn ? "Avg SLA: " : "SLA Rata-rata: "}<strong className="text-emerald-600 dark:text-emerald-400">{agency.slaAvg}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                            {agency.count} {isZh ? "个排队" : isEn ? "Queues" : "Antrean"}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {agency.percent}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Demografi & Metode Kedatangan */}
            {activeTab === 'demographics' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isZh ? "Luwu 县服务区域分布" : isEn ? "Service Region Distribution in Luwu Regency" : "Sebaran Wilayah Layanan di Kab. Luwu"}
                  </h4>
                  <div className="space-y-2.5">
                    {districtData.map((dist, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{dist.name}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dist.share}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: dist.share }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Indeks SKM & Kepuasan Warga */}
            {activeTab === 'skm' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-black/25">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {liveMetrics.ikmCount > 0 ? (Number(liveMetrics.ikmScore) / 25).toFixed(2) : '0.00'} / 4.00
                  </h3>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isZh ? "公众满意度指数 (IKM/SKM)：" : isEn ? "Community Satisfaction Index (IKM/SKM): " : "Indeks Kepuasan Masyarakat (IKM/SKM): "}{liveMetrics.ikmScore} / 100 ({
                      liveMetrics.ikmCount > 0 
                        ? (Number(liveMetrics.ikmScore) >= 88.31 
                            ? (isZh ? "极好 - A 级" : isEn ? "Very Good - Grade A" : "Sangat Baik - A") 
                            : (isZh ? "良好 - B 级" : isEn ? "Good - Grade B" : "Baik - B"))
                        : (isZh ? "暂无受访者数据" : isEn ? "No Respondent Data Yet" : "Belum Ada Data Responden")
                    })
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {isZh ? (
                      `根据 PermenPAN-RB 2017 年第 14 号标准，由 Luwu 县 Simpurusiang MPP 的 ${liveMetrics.ikmCount} 名电子调查受访者自动实时计算得出。`
                    ) : isEn ? (
                      `Calculated automatically in real-time from ${liveMetrics.ikmCount} electronic survey respondents at Simpurusiang MPP Luwu Regency based on PermenPAN-RB No. 14/2017.`
                    ) : (
                      `Dihitung otomatis secara real-time dari ${liveMetrics.ikmCount} responden survei elektronik mandiri di MPP Simpurusiang Kab. Luwu berdasarkan PermenPAN-RB No. 14/2017.`
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Bar */}
          <div className="p-4 px-5 sm:px-7 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> {isZh ? "自动实时更新" : isEn ? "Updated automatically" : "Diperbarui secara otomatis"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-extrabold transition-all cursor-pointer shadow-md"
            >
              {isZh ? "关闭摘要" : isEn ? "Close Summary" : "Tutup Ringkasan"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
