import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Compass, 
  TrendingUp, 
  MapPin, 
  UserCheck, 
  AlertTriangle, 
  Zap, 
  Briefcase, 
  Layers, 
  ChevronRight, 
  Sparkles, 
  Search, 
  Filter,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

interface PipelineProject {
  code: string;
  investor: string;
  sektor: string;
  nilai: string;
  currentStage: number;
  statusText: string;
  updatedAt: string;
}

interface WorkflowStage {
  id: string;
  stageNumber: number;
  bidangName: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  icon: React.ElementType;
  sla: string;
  progressPercent: number;
  description: string;
  actions: string[];
  outputs: string[];
  kpi: string;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 'stage_1',
    stageNumber: 1,
    bidangName: '1. Bidang Promosi & Penanaman Modal',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-500/5',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    icon: Compass,
    sla: '1 - 2 Hari Kerja',
    progressPercent: 25,
    description: 'Inbound Lead Facilitation: Menerima pengajuan Letter of Intent (LOI) minat investasi, melakukan kurasi awal profil investor, dan menjadwalkan konsultasi VIP Matchmaking.',
    actions: [
      'Verifikasi identitas dan profil perusahaan pemohon minat',
      'Penerbitan Kode Dossier Investor Unik (INV-2026-XXX)',
      'Penjadwalan Sesi Konsultasi VIP Matchmaking (Tatap Muka / Online)',
      'Eskalasi Otomatis Tiket Dossier ke Bidang Perencanaan & Data'
    ],
    outputs: ['Tiket Minat Terverifikasi', 'Profil Kebutuhan Proyek', 'Jadwal Matchmaking'],
    kpi: 'SLA Respon < 24 Jam & Konversi LOI ke Pre-Kajian > 85%'
  },
  {
    id: 'stage_2',
    stageNumber: 2,
    bidangName: '2. Bidang Perencanaan, Iklim & Data',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-500/5',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    icon: TrendingUp,
    sla: '2 - 3 Hari Kerja',
    progressPercent: 50,
    description: 'Feasibility & Spatial Supply Chain: Menyusun kajian kelayakan ketersediaan pasokan komoditas, integrasi peta GIS potensial lahan, dan analisis dampak insentif.',
    actions: [
      'Overlay koordinat lokasi terhadap Peta Neraca Komoditas Luwu',
      'Penyusunan Paket Feasibility Study & Analisis Supply Chain',
      'Rekomendasi 2-3 alternatif tapak lahan potensial siap pakai',
      'Penetapan estimasi nilai insentif penanaman modal daerah'
    ],
    outputs: ['Dossier Feasibility Study', 'Rekomendasi Tapak Lahan', 'Kajian Supply Chain'],
    kpi: 'Akurasi Neraca Komoditas 99% & Rekomendasi Lahan Bebas Konflik'
  },
  {
    id: 'stage_3',
    stageNumber: 3,
    bidangName: '3. Bidang Pelayanan Perizinan (OSS)',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    borderColor: 'border-indigo-500',
    bgColor: 'bg-indigo-500/5',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    icon: ShieldCheck,
    sla: '3 - 5 Hari Kerja',
    progressPercent: 75,
    description: 'Legal & Spatial Clearance: Pengawalan pemrosesan NIB berbasis risiko via OSS-RBA, pemicu Pre-check Spasial PKKPR (PUPTR) & LP2B (Pertanian), hingga SKI Terbit.',
    actions: [
      'Penerbitan / Fasilitasi NIB Berbasis Risiko via OSS-RBA',
      'Pemicuan Otomatis Pre-check PKKPR ke Studio GIS Dinas PUPTR',
      'Pre-check Proteksi Lahan Pertanian Berkelanjutan (LP2B)',
      'Penerbitan SK Kesesuaian Tata Ruang & Lisensi Perizinan'
    ],
    outputs: ['NIB OSS-RBA Valid', 'SK PKKPR / Kesesuaian Ruang', 'Sertifikat Standar / PB-UMKU'],
    kpi: 'SLA Perizinan 100% Tepat Waktu & Zero Tumpang Tindih Ruang'
  },
  {
    id: 'stage_4',
    stageNumber: 4,
    bidangName: '4. Bidang Pengendalian & Pengawasan (DALAK)',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    borderColor: 'border-amber-500',
    bgColor: 'bg-amber-500/5',
    textColor: 'text-amber-600 dark:text-amber-400',
    icon: Briefcase,
    sla: 'Berkelanjutan / Real-Time',
    progressPercent: 100,
    description: 'Groundbreaking & Debottlenecking: Pendampingan tahap konstruksi/operasional, fasilitasi penyelesaian kendala lapangan, serta verifikasi pelaporan LKPM.',
    actions: [
      'Pendampingan Groundbreaking & Pengawalan Fisik Lapangan',
      'Aktivasi Sistem Early Warning Debottlenecking Kendala',
      'Bimbingan Teknis & Pelaporan LKPM Triwulanan Investor',
      'Pencatatan Realisasi Angka Nilai Investasi Daerah (PMDN/PMA)'
    ],
    outputs: ['Laporan Verifikasi LKPM', 'Berita Acara Debottlenecking', 'Status Operasional Komersial'],
    kpi: 'Realisasi Investasi Capai Target & Tingkat Kepuasan Investor > 95%'
  }
];

export const InvestorPipelineWorkflowView: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projects, setProjects] = useState<PipelineProject[]>([]);
  const [activeProject, setActiveProject] = useState<PipelineProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRealPipeline = async () => {
    setLoading(true);
    try {
      const items: PipelineProject[] = [];

      // 1. Fetch from loi_tickets (Live incoming investor requests)
      try {
        const { data: tickets, error: ticketErr } = await supabase
          .from('loi_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (!ticketErr && tickets && tickets.length > 0) {
          tickets.forEach((t: any) => {
            const st = String(t.status || '').toLowerCase();
            let currentStage = 1;
            if (st.includes('kajian') || st.includes('data') || st.includes('site visit')) {
              currentStage = 2;
            } else if (st.includes('oss') || st.includes('pkkpr') || st.includes('mediasi')) {
              currentStage = 3;
            } else if (st.includes('terbit') || st.includes('realisasi') || st.includes('selesai') || st.includes('dalak') || st.includes('lkpm')) {
              currentStage = 4;
            }

            const formatVal = t.nilai_investasi
              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.nilai_investasi)
              : 'Belum ditentukan';

            items.push({
              code: `LOI-${String(t.id).slice(0, 8).toUpperCase()}`,
              investor: t.company_name || t.investor_name || 'Pelaku Usaha',
              sektor: t.potensi_name || 'Investasi Umum Kab. Luwu',
              nilai: formatVal,
              currentStage,
              statusText: t.status || 'Menunggu Verifikasi Tahap 1',
              updatedAt: t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : '-'
            });
          });
        }
      } catch (err) {
        console.warn('Pipeline fetch loi_tickets notice:', err);
      }

      // 2. Fetch from investments table if available
      try {
        const { data: invs, error: invErr } = await supabase
          .from('investments')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!invErr && invs && invs.length > 0) {
          invs.forEach((inv: any) => {
            const code = `INV-${String(inv.id).slice(0, 8).toUpperCase()}`;
            if (!items.some(it => it.code === code)) {
              const st = String(inv.status || '').toLowerCase();
              let currentStage = 1;
              if (st.includes('kajian') || st.includes('analisis') || st.includes('data')) {
                currentStage = 2;
              } else if (st.includes('pkkpr') || st.includes('oss') || st.includes('approved_puptr')) {
                currentStage = 3;
              } else if (st.includes('approved') || st.includes('published') || st.includes('terbit') || st.includes('selesai')) {
                currentStage = 4;
              }

              items.push({
                code,
                investor: inv.name || inv.contact_pic || 'Investor Terdaftar',
                sektor: `${inv.sector || 'Sektor Potensial'} (${inv.district || inv.kecamatan || 'Kabupaten Luwu'})`,
                nilai: inv.investmentValue ? `Rp ${(Number(inv.investmentValue) / 1000000000).toFixed(1)} Miliar` : 'Tersedia',
                currentStage,
                statusText: inv.status || 'Dalam Proses Pipeline',
                updatedAt: inv.updated_at ? new Date(inv.updated_at).toLocaleDateString('id-ID') : '-'
              });
            }
          });
        }
      } catch (err) {
        console.warn('Pipeline fetch investments notice:', err);
      }

      setProjects(items);
      if (items.length > 0) {
        setActiveProject(items[0]);
      } else {
        setActiveProject(null);
      }
    } catch (e) {
      console.error('Error fetching real pipeline data:', e);
      setProjects([]);
      setActiveProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealPipeline();
  }, []);

  const activeStageData = WORKFLOW_STAGES.find(s => s.stageNumber === selectedStage) || WORKFLOW_STAGES[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Building2 className="w-96 h-96 text-emerald-400" />
        </div>
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SOP Integrasi 4 Bidang DPMPTSP Kab. Luwu</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Arsitektur Sinkronisasi Proses Bisnis & Timeline Pendampingan Investor
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Menghubungkan secara instan 4 Admin Bidang DPMPTSP dalam satu rantai pasok pelayanan terpadu. Mencegah isolasi informasi (*silo effect*), mempercepat kepastian hukum perizinan, dan memberikan kejelasan progres transparan bagi calon investor.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-xs text-slate-400 block font-medium">Total Target SLA</span>
              <span className="text-lg font-bold text-emerald-400">7 - 10 Hari Kerja</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-xs text-slate-400 block font-medium">Tingkat Akselerasi</span>
              <span className="text-lg font-bold text-cyan-400">3x Lebih Cepat</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-xs text-slate-400 block font-medium">Integrasi OPD</span>
              <span className="text-lg font-bold text-indigo-400">PUPTR & Pertanian</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-xs text-slate-400 block font-medium">Transparansi Progres</span>
              <span className="text-lg font-bold text-amber-400">Real-Time CRM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Visual Timeline Steps (0% - 100%) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-500" />
              <span>Timeline Interaktif Progres 4 Bidang (0% - 100%)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Klik pada tiap tahapan bidang di bawah untuk meninjau rincian tugas, keluaran (*outputs*), dan indikator SLA.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold">
            Status: Single Dossier Pipeline Active
          </span>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {WORKFLOW_STAGES.map((stage) => {
            const isSelected = selectedStage === stage.stageNumber;
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStage(stage.stageNumber)}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 relative border flex flex-col justify-between ${
                  isSelected 
                    ? `bg-white dark:bg-slate-900 ${stage.borderColor} shadow-lg ring-2 ring-emerald-500/20`
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Header Top Badge */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${stage.badgeColor}`}>
                      TAHAP {stage.stageNumber} ({stage.progressPercent}%)
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {stage.sla}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${stage.bgColor} ${stage.textColor} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {stage.bidangName.split('. ')[1]}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Active Indicator */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className={`text-[11px] font-semibold ${isSelected ? stage.textColor : 'text-slate-400'}`}>
                    {isSelected ? 'Tahap Aktif Terpilih' : 'Klik Detail'}
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-emerald-500' : 'text-slate-400'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Stage View Drawer */}
        <div className={`rounded-2xl p-6 border ${activeStageData.borderColor} ${activeStageData.bgColor} transition-all duration-300 space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border ${activeStageData.borderColor} shadow-sm`}>
                <activeStageData.icon className={`w-6 h-6 ${activeStageData.textColor}`} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  SOP Detail Tanggung Jawab & Aksi Operasional
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {activeStageData.bidangName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target SLA:</span>
              <span className="text-xs font-extrabold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm">
                ⏱️ {activeStageData.sla}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Column 1: Action Items */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Daftar Aksi Wajib Admin Bidang</span>
              </h4>
              <ul className="space-y-2">
                {activeStageData.actions.map((act, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Outputs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-500" />
                <span>Keluaran Resmi (Deliverables)</span>
              </h4>
              <ul className="space-y-2">
                {activeStageData.outputs.map((out, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: KPI & Escalation Rule */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 md:col-span-2 lg:col-span-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Indikator Kerja Utama (KPI)</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-500/5 p-3 rounded-lg border border-amber-500/20 font-medium">
                {activeStageData.kpi}
              </p>
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block font-semibold">Aturan Eskalasi Otomatis:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Jika tidak direspon dalam {activeStageData.sla}, tiket otomatis naik ke pimpinan (Kadis DPMPTSP) & terkirim via WhatsApp Alert.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Project Simulation & Dossier Tracker */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" />
              <span>Simulasi Pelacakan Berkas Investor (Dossier Tracker)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pantau posisi terkini berkas minat investasi secara transparan di antara ke-4 Admin Bidang.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode LOI / Investor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <p className="text-xs">Memuat berkas permohonan investasi dari database...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
            <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Berkas Minat Investasi (LoI)</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Seluruh permohonan minat baru dari investor yang masuk melalui portal LoI akan otomatis muncul dalam alur pipeline 4 Bidang ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real Projects List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Daftar Permohonan Investasi Aktif ({projects.length})
              </span>
              {projects.filter(p => 
                p.investor.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sektor.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((proj) => (
                <div
                  key={proj.code}
                  onClick={() => setActiveProject(proj)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 space-y-2 ${
                    activeProject?.code === proj.code
                      ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {proj.code}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                      Tahap {proj.currentStage} dari 4
                    </span>
                  </div>
                  <h4 className="text-xs font-bold leading-snug">{proj.investor}</h4>
                  <div className="text-[11px] opacity-80 space-y-1">
                    <p>📍 {proj.sektor}</p>
                    <p>💰 Komitmen: <span className="font-semibold">{proj.nilai}</span></p>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Project Progress & Pipeline Tracker */}
            {activeProject && (
              <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {activeProject.code}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {activeProject.investor}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">Nilai Komitmen</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {activeProject.nilai}
                    </span>
                  </div>
                </div>

                {/* Stepper Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Status Progres Pengawalan</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {(activeProject.currentStage / 4) * 100}% Selesai
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(activeProject.currentStage / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stage Progress Nodes */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {WORKFLOW_STAGES.map((s) => {
                    const isPassed = s.stageNumber <= activeProject.currentStage;
                    const isCurrent = s.stageNumber === activeProject.currentStage;

                    return (
                      <div key={s.id} className="text-center space-y-1">
                        <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                          isCurrent 
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-md ring-4 ring-emerald-500/20'
                            : isPassed
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 border-transparent'
                        }`}>
                          {isPassed ? '✓' : s.stageNumber}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 block line-clamp-1">
                          {s.bidangName.split('Bidang ')[1] || s.bidangName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Current Active Status Card */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Posisi Berkas & Tindak Lanjut Terkini
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{activeProject.statusText}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Terakhir diperbarui: {activeProject.updatedAt} oleh Admin Bidang Terkait.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestorPipelineWorkflowView;
