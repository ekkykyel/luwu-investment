import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Compass, 
  ShieldCheck, 
  MapPin, 
  ArrowUpRight, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  Search,
  Building2,
  Maximize2,
  Sparkles,
  Award,
  Globe,
  Waypoints,
  FileCheck,
  Split
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export interface PuptrOverviewProps {
  investments: any[];
  districts: any[];
  villages?: any[];
  onNavigateTab: (tab: string) => void;
  onSelectInvestment: (id: string) => void;
  isDarkMode?: boolean;
}

export default function PuptrOverview({
  investments = [],
  districts = [],
  villages = [],
  onNavigateTab,
  onSelectInvestment,
  isDarkMode = true
}: PuptrOverviewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Calculate PUPTR & Spatial Planning Metrics
  const pkkprPuptrList = useMemo(() => {
    return investments;
  }, [investments]);

  const pkkprPending = useMemo(() => {
    return pkkprPuptrList.filter((inv: any) => {
      const st = String(inv.status || inv.status_pkkpr || inv.pkkprStatus || '').toLowerCase();
      return st.includes('pending') || st.includes('menunggu') || st.includes('proses') || st.includes('review');
    });
  }, [pkkprPuptrList]);

  const pkkprApproved = useMemo(() => {
    return pkkprPuptrList.filter((inv: any) => {
      const st = String(inv.status || inv.status_pkkpr || inv.pkkprStatus || '').toLowerCase();
      return st.includes('approved') || st.includes('disetujui') || st.includes('terbit') || st.includes('selesai');
    });
  }, [pkkprPuptrList]);

  // Spatial Pola Ruang RTRW Kab. Luwu (Perda No. 3/2020)
  const polaRuangData = [
    { name: 'Kawasan Lindung & Hutan Konservasi', value: 112450, color: '#10b981' },
    { name: 'Kawasan Pertanian & Pangan (LP2B)', value: 89400, color: '#22c55e' },
    { name: 'Kawasan Perkebunan & Produksi', value: 54600, color: '#eab308' },
    { name: 'Kawasan Permukiman & Perkotaan Belopa', value: 24350, color: '#3b82f6' },
    { name: 'Kawasan Industri & Logistik Pelabuhan Bua', value: 12425, color: '#8b5cf6' },
    { name: 'Kawasan Pesisir, Mangrove & Tambak', value: 6800, color: '#06b6d4' }
  ];

  // Spatial Analysis / Pertek issuance trend per district cluster
  const districtSpatialData = [
    { wilayah: 'Belopa (Pusat Kota)', pertek_disetujui: 42, pertek_proses: 6, tumpang_tindih: 0 },
    { wilayah: 'Bua & Ponrang (Industri)', pertek_disetujui: 35, pertek_proses: 8, tumpang_tindih: 1 },
    { wilayah: 'Walenrang & Lamasi', pertek_disetujui: 28, pertek_proses: 4, tumpang_tindih: 0 },
    { wilayah: 'Larompong & Suli', pertek_disetujui: 22, pertek_proses: 3, tumpang_tindih: 0 },
    { wilayah: 'Bajo & Kamanre', pertek_disetujui: 19, pertek_proses: 2, tumpang_tindih: 0 },
    { wilayah: 'Bastem & Latimojong', pertek_disetujui: 14, pertek_proses: 5, tumpang_tindih: 1 }
  ];

  const filteredPkkpr = useMemo(() => {
    return pkkprPuptrList.filter(inv => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (inv.name || '').toLowerCase().includes(q) ||
        (inv.applicantName || inv.contact_pic || '').toLowerCase().includes(q) ||
        (inv.district || inv.districtName || '').toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [pkkprPuptrList, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* 1. Header Banner Tupoksi Dinas PUPTR */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-48 bg-indigo-500/10 blur-3xl rounded-full -mr-20 -mt-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-indigo-300 bg-indigo-500/20 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                DINAS PEKERJAAN UMUM &amp; PENATAAN RUANG (PUPTR)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-700">
                <Globe className="w-3 h-3 text-cyan-400" /> RTRW 2020-2040 &amp; Pertimbangan Teknis
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              Dashboard Pengendalian Ruang &amp; Studio Spasial GIS
            </h1>
            <p className="text-indigo-100/80 text-xs sm:text-sm leading-relaxed">
              Monitoring kesesuaian pola ruang, analisis tumpang tindih spasial (overlay GIS), dan penerbitan Pertimbangan Teknis (Pertek) Tata Ruang PKKPR berdasarkan Perda RTRW No. 3/2020 Kabupaten Luwu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('verifikasi_puptr')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-950/30 cursor-pointer active:scale-95"
            >
              <FileCheck size={15} />
              <span>Buka Pertek Tata Ruang ({pkkprPending.length})</span>
            </button>
            <button
              onClick={() => onNavigateTab('spatial_analytics')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Compass size={15} className="text-indigo-400" />
              <span>Studio GIS &amp; Layer RTRW</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Statistic Cards: Tupoksi PUPTR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Cakupan Pola Ruang RTRW */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/20 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              PERDA 3/2020
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            300.025 <span className="text-sm font-bold text-slate-400 font-sans">Ha</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            Total Luas Zonasi Terpetakan
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            22 Kecamatan &amp; 227 Desa/Kelurahan Luwu
          </div>
        </div>

        {/* Card 2: Permohonan Pertek Menunggu Analisis GIS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/20 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              KAJIAN SPASIAL
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {pkkprPending.length} <span className="text-sm font-bold text-slate-400 font-sans">Berkas</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            Menunggu Analisis Tumpang Tindih
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Overlay Zonasi &amp; Pertimbangan Teknis
          </div>
        </div>

        {/* Card 3: Pertek Tata Ruang Disetujui */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/20 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              SESUAI RTRW
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {pkkprApproved.length} <span className="text-sm font-bold text-slate-400 font-sans">Dokumen</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            Pertek Disetujui (SK Terbit)
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Polygon Masuk ke Database Spasial Resmi
          </div>
        </div>

        {/* Card 4: Jaringan Jalan & Infrastruktur */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/20 shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Waypoints className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              GEOMETRI GIS
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
            2.967 <span className="text-sm font-bold text-slate-400 font-sans">Segmen</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            Jaringan Jalan &amp; Koridor
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Jalan Nasional, Provinsi, &amp; Kabupaten
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Visual Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (60%): Grafik Distribusi Pertek Tata Ruang per Wilayah */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Split className="text-indigo-500" size={18} />
                  Kinerja Pertimbangan Teknis Tata Ruang per Koridor
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Status permohonan pertek disetujui, dalam telaah GIS, dan deteksi tumpang tindih
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtSpatialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="wilayah" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="pertek_disetujui" fill="#10b981" name="Pertek Sesuai RTRW" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pertek_proses" fill="#6366f1" name="Sedang Analisis GIS" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tumpang_tindih" fill="#ef4444" name="Indikasi Tumpang Tindih" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pertek Sesuai RTRW</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Sedang Telaah Spasial GIS</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Indikasi Tumpang Tindih Ruang</span>
          </div>
        </div>

        {/* Right Column (40%): Komposisi Pola Ruang RTRW Kab. Luwu */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Layers className="text-indigo-500" size={18} />
              Komposisi Pola Ruang RTRW
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Sebaran zonasi RTRW Perda No. 3/2020 Kabupaten Luwu
            </p>

            <div className="relative h-48 min-h-[192px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={polaRuangData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {polaRuangData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString('id-ID')} Ha`, 'Luas Zonasi']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">300.025</span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Total Ha</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4 max-h-32 overflow-y-auto pr-1">
            {polaRuangData.map((item) => (
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

      {/* 4. Bottom Section: Antrean Verifikasi Pertimbangan Teknis (Pertek) Tata Ruang */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="text-indigo-500" size={18} />
              Daftar Permohonan PKKPR Menunggu Pertimbangan Teknis (Pertek) PUPTR
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analisis kesesuaian koordinat polygon dengan batas administrasi, sempadan sungai/pantai, dan zonasi RTRW
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
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => onNavigateTab('verifikasi_puptr')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shrink-0 flex items-center gap-1"
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
                  <th className="p-3 rounded-l-xl">No. Permohonan &amp; Kegiatan</th>
                  <th className="p-3">Lokasi (Kecamatan/Desa)</th>
                  <th className="p-3">Luas Lahan</th>
                  <th className="p-3">Indikasi Kesesuaian Pola Ruang</th>
                  <th className="p-3">Status Pertek</th>
                  <th className="p-3 text-right rounded-r-xl">Aksi Analisis</th>
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
                          <CheckCircle2 size={11} /> Sesuai Pola Ruang RTRW
                        </span>
                      </td>
                      <td className="p-3">
                        {isApp ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                            Pertek Terbit
                          </span>
                        ) : isPend ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300">
                            Menunggu Analisis GIS
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
                            onNavigateTab('verifikasi_puptr');
                          }}
                          className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white font-bold rounded-lg transition text-[11px] inline-flex items-center gap-1"
                        >
                          <span>Kaji Spasial</span>
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
