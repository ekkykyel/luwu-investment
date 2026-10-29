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
import { supabase } from '../../lib/supabaseClient';

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

      // 1. Fetch from investment_interests (Live incoming investor requests)
      try {
        let tickets: any[] = [];
        const { data: dbTickets, error: ticketErr } = await supabase
          .from('investment_interests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!ticketErr && dbTickets) {
          tickets = dbTickets;
        } else {
          // Fallback to proxy endpoint
          const res = await fetch('/api/investment-interests');
          if (res.ok) {
            tickets = await res.json();
          }
        }

        if (tickets && tickets.length > 0) {
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
        console.warn('Pipeline fetch investment_interests notice:', err);
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
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 p-4 sm:p-8 text-white border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-4xl space-y-3 sm:space-y-4">
          <div className="text-[11px] sm:text-xs font-semibold tracking-wide text-emerald-400">
            SOP Integrasi 4 Bidang DPMPTSP Kabupaten Luwu
          </div>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Arsitektur Sinkronisasi Proses Bisnis &amp; Timeline Pendampingan Investor
          </h1>
          <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
            Menghubungkan 4 Admin Bidang DPMPTSP dalam satu rantai pelayanan terpadu untuk mempercepat kepastian hukum perizinan dan transparansi progres bagi calon investor.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 block font-medium">Target SLA</span>
              <span className="text-sm sm:text-lg font-bold text-emerald-400 tabular-nums">7 - 10 Hari</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 block font-medium">Akselerasi</span>
              <span className="text-sm sm:text-lg font-bold text-cyan-400 tabular-nums">3x Lebih Cepat</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 block font-medium">Integrasi OPD</span>
              <span className="text-sm sm:text-lg font-bold text-indigo-400">PUPTR &amp; Pertanian</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 block font-medium">Transparansi</span>
              <span className="text-sm sm:text-lg font-bold text-amber-400">Real-Time CRM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Visual Timeline Steps (0% - 100%) */}
      <div className="bg-white dark:bg-surface rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Timeline Interaktif Progres 4 Bidang (0% - 100%)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Geser dan pilih tahapan bidang untuk meninjau rincian tugas, keluaran, dan target SLA.
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0">
            Alur Berkas Tunggal Terpadu
          </span>
        </div>

        {/* Step Cards: Horizontal Snap Scroll on Android, 4-Col Grid on Desktop */}
        <div className="flex md:grid md:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-1 px-1 pb-1">
          {WORKFLOW_STAGES.map((stage) => {
            const isSelected = selectedStage === stage.stageNumber;
            const Icon = stage.icon;

            return (
              <button
                type="button"
                key={stage.id}
                onClick={() => setSelectedStage(stage.stageNumber)}
                className={`w-[255px] sm:w-[280px] md:w-auto shrink-0 snap-start text-left cursor-pointer rounded-2xl p-4 transition-all duration-200 relative border flex flex-col justify-between ${
                  isSelected 
                    ? `bg-white dark:bg-surface ${stage.borderColor} shadow-md ring-2 ring-emerald-500/20`
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                    <span className={`${stage.textColor} tabular-nums`}>
                      Tahap {stage.stageNumber} · {stage.progressPercent}%
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3 shrink-0" />
                      {stage.sla}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${stage.bgColor} ${stage.textColor} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {stage.bidangName.split('. ')[1]}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className={`text-[11px] font-semibold ${isSelected ? stage.textColor : 'text-slate-400'}`}>
                    {isSelected ? 'Tahap Aktif Terpilih' : 'Lihat Detail Tugas'}
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-emerald-500' : 'text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Stage View */}
        <div className={`rounded-2xl p-4 sm:p-6 border ${activeStageData.borderColor} ${activeStageData.bgColor} transition-colors space-y-4 sm:space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-3 sm:pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-surface border ${activeStageData.borderColor} shrink-0`}>
                <activeStageData.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${activeStageData.textColor}`} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  SOP Detail Tanggung Jawab &amp; Aksi Operasional
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  {activeStageData.bidangName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">Target SLA:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {activeStageData.sla}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Column 1: Action Items */}
            <div className="bg-white dark:bg-surface rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
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
            <div className="bg-white dark:bg-surface rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-500 shrink-0" />
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
            <div className="bg-white dark:bg-surface rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 md:col-span-2 lg:col-span-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Indikator Kerja Utama (KPI)</span>
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-amber-500/5 p-3 rounded-lg border border-amber-500/20 font-medium">
                {activeStageData.kpi}
              </p>
              <div className="pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Aturan Eskalasi Otomatis:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Jika tidak direspons dalam {activeStageData.sla}, tiket otomatis dieskalasi ke Kepala Dinas DPMPTSP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Project & Dossier Tracker */}
      <div className="bg-white dark:bg-surface rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>Pelacakan Berkas Investor (Dossier Tracker)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pantau posisi terkini berkas minat investasi di antara ke-4 Admin Bidang secara transparan.
            </p>
          </div>

          <div className="relative sm:max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari Kode LoI / Investor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 sm:py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <p className="text-xs">Memuat berkas permohonan investasi dari database...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-surface/30 space-y-2">
            <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Berkas Minat Investasi (LoI)</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Seluruh permohonan minat baru dari investor yang masuk melalui portal LoI akan otomatis muncul dalam alur pipeline 4 Bidang ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Real Projects List: Horizontal Snap on Mobile, Vertical Stack on Desktop */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block tabular-nums">
                Daftar Permohonan Aktif ({projects.length})
              </span>
              <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible no-scrollbar snap-x snap-mandatory pb-1 lg:pb-0">
                {projects.filter(p => 
                  p.investor.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.sektor.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((proj) => (
                  <button
                    type="button"
                    key={proj.code}
                    onClick={() => setActiveProject(proj)}
                    className={`w-[260px] sm:w-[290px] lg:w-full shrink-0 snap-start text-left cursor-pointer rounded-xl p-3.5 sm:p-4 border transition-colors space-y-1.5 ${
                      activeProject?.code === proj.code
                        ? 'bg-slate-900 text-white border-slate-800 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                      <span className="font-bold text-emerald-500">
                        {proj.code}
                      </span>
                      <span className={activeProject?.code === proj.code ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                        Tahap {proj.currentStage}/4
                      </span>
                    </div>
                    <h4 className="text-xs font-bold leading-snug line-clamp-1">{proj.investor}</h4>
                    <div className="text-[11px] opacity-80 space-y-0.5">
                      <p className="truncate">{proj.sektor}</p>
                      <p className="tabular-nums">Komitmen: <span className="font-semibold">{proj.nilai}</span></p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Project Progress & Pipeline Tracker */}
            {activeProject && (
              <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4">
                  <div className="min-w-0">
                    <span className="text-xs font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      {activeProject.code}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white break-words">
                      {activeProject.investor}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs text-slate-400 block">Nilai Komitmen</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      {activeProject.nilai}
                    </span>
                  </div>
                </div>

                {/* Stepper Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Status Progres Pengawalan</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {(activeProject.currentStage / 4) * 100}% Selesai
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(activeProject.currentStage / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stage Progress Nodes */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
                  {WORKFLOW_STAGES.map((s) => {
                    const isPassed = s.stageNumber <= activeProject.currentStage;
                    const isCurrent = s.stageNumber === activeProject.currentStage;

                    return (
                      <div key={s.id} className="text-center space-y-1">
                        <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors tabular-nums ${
                          isCurrent 
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm ring-4 ring-emerald-500/20'
                            : isPassed
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 border-transparent'
                        }`}>
                          {isPassed ? '✓' : s.stageNumber}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 block truncate px-0.5">
                          {s.bidangName.split('Bidang ')[1] || s.bidangName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Current Active Status Card */}
                <div className="p-4 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Posisi Berkas &amp; Tindak Lanjut Terkini
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{activeProject.statusText}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    Terakhir diperbarui: {activeProject.updatedAt} oleh Admin Bidang terkait.
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
