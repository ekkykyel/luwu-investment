import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, CheckCircle2, Clock, Star, 
  Download, Filter, Calendar, Building2, FileText, ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export function MppAdminReport({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const [stats, setStats] = useState({
    totalQueues: 0,
    avgRating: 0,
    totalSkm: 0,
    completedDocs: 0
  });

  const [skmData, setSkmData] = useState<any[]>([]);
  const [tenantStats, setTenantStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

  useEffect(() => {
    fetchReportData();

    // Realtime channel for live reports
    const channel = supabase
      .channel('mpp_admin_reports_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_queues' }, () => {
        fetchReportData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_skm' }, () => {
        fetchReportData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_document_tracking' }, () => {
        fetchReportData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch Queues
      const { data: queues } = await supabase.from('mpp_queues').select('*, tenant:mpp_tenants(name)');
      
      // Fetch SKM
      const { data: skm } = await supabase.from('mpp_skm').select('*');

      // Fetch Tracking
      const { data: tracking } = await supabase.from('mpp_document_tracking').select('*');

      // Process Stats
      const totalQ = queues?.length || 0;
      const totalS = skm?.length || 0;
      
      let avgR = 0;
      if (skm && skm.length > 0) {
        const ratings = skm.map(s => {
          if (typeof s.rating === 'number') return s.rating;
          if (s.rating === 'very_satisfied') return 5;
          if (s.rating === 'satisfied') return 4;
          if (s.rating === 'neutral') return 3;
          if (s.rating === 'dissatisfied') return 2;
          const parsed = parseFloat(s.rating);
          return isNaN(parsed) ? 5 : parsed;
        });
        avgR = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      }

      const completed = tracking?.filter(t => t.current_status?.toLowerCase().includes('selesai')).length || 0;

      setStats({
        totalQueues: totalQ,
        avgRating: avgR,
        totalSkm: totalS,
        completedDocs: completed
      });

      // Process Tenant Stats for Chart
      const tStats: Record<string, number> = {};
      queues?.forEach(q => {
        const tName = q.tenant?.name || 'Lainnya';
        tStats[tName] = (tStats[tName] || 0) + 1;
      });
      const chartData = Object.keys(tStats).map(k => ({ name: k, total: tStats[k] }));
      setTenantStats(chartData.sort((a,b) => b.total - a.total).slice(0, 6)); // Top 6

      // Process SKM rating dist for pie
      const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      skm?.forEach(s => {
        const rVal = typeof s.rating === 'number' ? s.rating : 
          (s.rating === 'very_satisfied' ? 5 :
           s.rating === 'satisfied' ? 4 :
           s.rating === 'neutral' ? 3 :
           s.rating === 'dissatisfied' ? 2 : (parseInt(s.rating, 10) || 5));

        if (rVal >= 5) ratingDist[5]++;
        else if (rVal === 4) ratingDist[4]++;
        else if (rVal === 3) ratingDist[3]++;
        else if (rVal === 2) ratingDist[2]++;
        else ratingDist[1]++;
      });
      
      setSkmData([
        { name: 'Sangat Puas (Bintang 5)', value: ratingDist[5] },
        { name: 'Puas (Bintang 4)', value: ratingDist[4] },
        { name: 'Cukup (Bintang 3)', value: ratingDist[3] },
        { name: 'Kurang Puas', value: ratingDist[2] + ratingDist[1] }
      ]);

    } catch (err) {
      console.error('Error fetching admin report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Antrean Terlayani', value: stats.totalQueues, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Indeks Kepuasan (SKM)', value: stats.avgRating.toFixed(1) + ' / 5.0', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Responden Survei', value: stats.totalSkm, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Dokumen Selesai (E-Lacak)', value: stats.completedDocs, icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className={`w-full min-h-screen p-6 sm:p-8 font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-sans">Dashboard Eksekutif MPP</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Laporan Real-time Pelayanan Terpadu & Indeks Kepuasan Masyarakat (SKM)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-900 hover:bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}>
            <Calendar className="w-4 h-4" /> Bulan Ini
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors">
            <Download className="w-4 h-4" /> Ekspor PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                <TrendingUp className="w-3 h-3" /> +12%
              </div>
            </div>
            <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{card.title}</h3>
            <div className="text-3xl font-black font-sans">{isLoading ? '-' : card.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart - Top Tenants */}
        <div className={`col-span-1 lg:col-span-2 p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg font-sans">Volume Pelayanan per Gerai (Top 6)</h3>
            <Building2 className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenantStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                <RechartsTooltip 
                  cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                  {tenantStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - SKM Rating */}
        <div className={`col-span-1 p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg font-sans">Distribusi Rating SKM</h3>
            <Star className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={skmData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {skmData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black">{stats.avgRating.toFixed(1)}</span>
              <span className={`text-[10px] uppercase tracking-wider font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Skor Rata-Rata</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {skmData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <div className="text-xs font-semibold">{item.name}</div>
                <div className={`text-xs ml-auto font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
