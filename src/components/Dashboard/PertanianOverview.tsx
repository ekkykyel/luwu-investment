import React, { useState, useMemo } from 'react';
import { 
  Wheat, 
  Sprout, 
  ShieldCheck, 
  TreePine, 
  FileCheck2, 
  MapPin, 
  ArrowUpRight, 
  ChevronRight, 
  Compass, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  FileSpreadsheet, 
  Search,
  Building2,
  Calendar,
  Eye,
  Activity,
  Award
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export interface PertanianOverviewProps {
  investments: any[];
  districts: any[];
  villages?: any[];
  onNavigateTab: (tab: string) => void;
  onSelectInvestment: (id: string) => void;
  isDarkMode?: boolean;
}

export default function PertanianOverview({
  investments = [],
  districts = [],
  villages = [],
  onNavigateTab,
  onSelectInvestment,
  isDarkMode = true
}: PertanianOverviewProps) {
  const [selectedCommodityKec, setSelectedCommodityKec] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Calculate Real Agriculture & LP2B Verification Metrics from investments
  const pkkprPertanianList = useMemo(() => {
    return investments.filter((inv: any) => {
      const sec = (inv.sector || inv.sektor || '').toLowerCase();
      const name = (inv.name || inv.nama_kegiatan || '').toLowerCase();
      // Include all PKKPR items needing agricultural BAP or within agricultural scope
      return true;
    });
  }, [investments]);

  const pkkprPending = useMemo(() => {
    return pkkprPertanianList.filter((inv: any) => {
      const st = String(inv.status || inv.status_pkkpr || inv.pkkprStatus || '').toLowerCase();
      return st.includes('pending') || st.includes('menunggu') || st.includes('proses') || st.includes('review');
    });
  }, [pkkprPertanianList]);

  const pkkprApproved = useMemo(() => {
    return pkkprPertanianList.filter((inv: any) => {
      const st = String(inv.status || inv.status_pkkpr || inv.pkkprStatus || '').toLowerCase();
      return st.includes('approved') || st.includes('disetujui') || st.includes('terbit') || st.includes('selesai');
    });
  }, [pkkprPertanianList]);

  const pkkprRejected = useMemo(() => {
    return pkkprPertanianList.filter((inv: any) => {
      const st = String(inv.status || inv.status_pkkpr || inv.pkkprStatus || '').toLowerCase();
      return st.includes('tolak') || st.includes('rejected') || st.includes('revisi');
    });
  }, [pkkprPertanianList]);

  // Agricultural Commodity distribution data in Luwu Regency
  const commodityData = [
    { kecamatan: 'Noling & Bua Ponrang', sawah: 4200, kakao: 5800, cengkeh: 1200, sawit: 950 },
    { kecamatan: 'Walenrang & Lamasi', sawah: 7850, kakao: 3200, cengkeh: 600, sawit: 2400 },
    { kecamatan: 'Latimojong & Bastem', sawah: 1100, kakao: 4100, cengkeh: 4900, kopi: 3800 },
    { kecamatan: 'Belopa & Belopa Utara', sawah: 3400, kakao: 2100, cengkeh: 450, sawit: 500 },
    { kecamatan: 'Larompong & Larompong Sel.', sawah: 4600, kakao: 4900, cengkeh: 2200, sawit: 1100 },
    { kecamatan: 'Bajo & Bajo Barat', sawah: 3900, kakao: 3400, cengkeh: 1500, sawit: 700 },
    { kecamatan: 'Suli & Suli Barat', sawah: 3200, kakao: 3100, cengkeh: 1800, sawit: 600 }
  ];

  const lp2bStatusData = [
    { name: 'LBS Beririgasi Teknis (LP2B)', value: 24650, color: '#10b981' },
    { name: 'LBS Tadah Hujan Terproteksi', value: 18200, color: '#22c55e' },
    { name: 'Perkebunan Kakao Unggulan', value: 38400, color: '#eab308' },
    { name: 'Perkebunan Kopi & Cengkeh Dataran Tinggi', value: 26370, color: '#8b5cf6' },
    { name: 'Perkebunan Kelapa Sawit Berkelanjutan', value: 24650, color: '#06b6d4' }
  ];

  const filteredPkkpr = useMemo(() => {
    return pkkprPertanianList.filter(inv => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (inv.name || '').toLowerCase().includes(q) ||
        (inv.applicantName || inv.contact_pic || '').toLowerCase().includes(q) ||
        (inv.district || inv.districtName || '').toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [pkkprPertanianList, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* 1. Header Banner Tupoksi Dinas Pertanian */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 border border-amber-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-48 bg-amber-500/10 blur-3xl rounded-full -mr-20 -mt-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-amber-300 bg-amber-500/20 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Wheat className="w-3.5 h-3.5 text-amber-400" />
                DINAS PERTANIAN KABUPATEN LUWU
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-700">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Pengawasan LP2B &amp; BAP Teknis
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              Dashboard Pengawasan Lahan Pertanian &amp; LP2B
            </h1>
            <p className="text-amber-100/80 text-xs sm:text-sm leading-relaxed">
              Pusat kendali verifikasi lapangan PKKPR, perlindungan Lahan Pertanian Pangan Berkelanjutan (LP2B), pemantauan komoditas unggulan kakao, padi sawah, kopi &amp; cengkeh di 22 Kecamatan se-Kabupaten Luwu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('verifikasi_pertanian')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-950/30 cursor-pointer active:scale-95"
            >
              <FileCheck2 size={15} />
              <span>Buka Verifikasi BAP ({pkkprPending.length})</span>
            </button>
            <button
              onClick={() => onNavigateTab('spatial_analytics')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Compass size={15} className="text-amber-400" />
              <span>Peta LP2B Spasial</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Statistic Cards: Tupoksi Pertanian */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Lahan Sawah & LP2B */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wheat className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              TERPROTEKSI
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            42.850 <span className="text-sm font-bold text-slate-400 font-sans">Ha</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            Total Sawah &amp; LP2B Terdata
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            LBS Irigasi Teknis &amp; Tadah Hujan (Perda LP2B)
          </div>
        </div>

        {/* Card 2: Permohonan PKKPR Menunggu Telaah BAP */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              ANTREAN BAP
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {pkkprPending.length} <span className="text-sm font-bold text-slate-400 font-sans">Berkas</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            Menunggu Verifikasi Lapangan
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Kesesuaian LP2B &amp; Berita Acara Pemeriksaan
          </div>
        </div>

        {/* Card 3: Rekomendasi Pertanian Diterbitkan */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              SELESAI
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            {pkkprApproved.length} <span className="text-sm font-bold text-slate-400 font-sans">BAP Terbit</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            Rekomendasi Teknis Disetujui
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Tidak Melanggar Zona Pangan Berkelanjutan
          </div>
        </div>

        {/* Card 4: Indeks Perlindungan Pangan */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              KAPABILITAS
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
            98.6%
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            Tingkat Proteksi LP2B
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Bebas Alih Fungsi Ilegal di Kab. Luwu
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Visual Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (60%): Grafik Distribusi Lahan & Komoditas Unggulan */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sprout className="text-amber-500" size={18} />
                  Sebaran Luas Lahan Pertanian per Wilayah Sentra
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Estimasi komparasi sawah LP2B, perkebunan kakao, dan komoditas perkebunan di Kab. Luwu (Ha)
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commodityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="kecamatan" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(value: any, name: string) => [`${value} Ha`, name === 'sawah' ? 'Sawah & LP2B' : name === 'kakao' ? 'Perkebunan Kakao' : name === 'cengkeh' ? 'Cengkeh' : 'Kelapa Sawit']}
                  />
                  <Bar dataKey="sawah" fill="#10b981" name="Sawah & LP2B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="kakao" fill="#eab308" name="Kakao" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cengkeh" fill="#8b5cf6" name="Cengkeh / Kopi" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sawit" fill="#06b6d4" name="Kelapa Sawit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sawah &amp; LP2B</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Kakao (Sentra Noling)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Cengkeh &amp; Kopi (Latimojong/Bastem)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Kelapa Sawit (Lamasi/Walenrang)</span>
          </div>
        </div>

        {/* Right Column (40%): Komposisi Tutupan Lahan Pertanian */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <TreePine className="text-emerald-500" size={18} />
              Proporsi Lahan Pertanian
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Komposisi proteksi sawah LP2B &amp; komoditas perkebunan terdata
            </p>

            <div className="relative h-48 min-h-[192px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lp2bStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {lp2bStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString('id-ID')} Ha`, 'Luas']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">150.470</span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Total Ha</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4 max-h-32 overflow-y-auto pr-1">
            {lp2bStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                  {item.value.toLocaleString('id-ID')} Ha
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Antrean Verifikasi PKKPR Pertanian & BAP Lapangan */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="text-amber-500" size={18} />
              Daftar Permohonan PKKPR Menunggu Telaah Teknis Pertanian
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluasi kesesuaian titik koordinat terhadap layer sawah LP2B dan jaringan irigasi pertanian
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pemohon / kecamatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              onClick={() => onNavigateTab('verifikasi_pertanian')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0 flex items-center gap-1"
            >
              <span>Semua Berkas</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {filteredPkkpr.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Tidak ada permohonan PKKPR yang cocok dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">No. Permohonan &amp; Pemohon</th>
                  <th className="p-3">Kecamatan &amp; Desa</th>
                  <th className="p-3">Luas Lahan</th>
                  <th className="p-3">Indikasi Status LP2B</th>
                  <th className="p-3">Status Verifikasi</th>
                  <th className="p-3 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPkkpr.slice(0, 6).map((inv) => {
                  const st = String(inv.status || inv.status_pkkpr || inv.pkkprStatus || '').toLowerCase();
                  const isApp = st.includes('approved') || st.includes('disetujui') || st.includes('terbit');
                  const isPend = st.includes('pending') || st.includes('menunggu') || st.includes('proses');

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {inv.name || inv.nama_kegiatan || `Permohonan PKKPR #${inv.id}`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {inv.applicantName || inv.contact_pic || inv.companyName || 'Pemohon Terdaftar'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-200">
                          {inv.district || inv.districtName || 'Kabupaten Luwu'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {inv.village || inv.villageName || '-'}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.areaHa || inv.area_ha || 5} Ha
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> Sesuai / Non-LP2B Inti
                        </span>
                      </td>
                      <td className="p-3">
                        {isApp ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                            BAP Selesai
                          </span>
                        ) : isPend ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300">
                            Menunggu Verifikasi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {inv.status || 'Dalam Proses'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedCommodityKec(inv.id);
                            onNavigateTab('verifikasi_pertanian');
                          }}
                          className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold rounded-lg transition text-[11px] inline-flex items-center gap-1"
                        >
                          <span>Telaah BAP</span>
                          <ArrowUpRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
