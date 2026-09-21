import React, { useState } from 'react';
import { 
  TrendingUp, 
  Database, 
  FileCheck2, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck, 
  Layers, 
  Send,
  X,
  ChevronRight,
  Zap,
  Building2,
  MapPin,
  Sparkles,
  FileSpreadsheet,
  Gauge
} from 'lucide-react';

interface FourBidangSyncWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FourBidangSyncWorkflowModal: React.FC<FourBidangSyncWorkflowModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [activeSimulation, setActiveSimulation] = useState<string>('INV-2026-089');

  if (!isOpen) return null;

  const phases = [
    {
      id: 1,
      role: 'admin_promosi',
      title: 'Fase 1: Inisiasi & Promosi Investasi',
      bidang: 'Bidang Promosi & Penanaman Modal',
      officer: 'Siti Rahma, S.STP (Admin Promosi)',
      sla: '1 - 2 Hari Kerja',
      color: 'emerald',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      icon: TrendingUp,
      status: 'SELESAI',
      statusColor: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
      inputs: [
        'Inquiry Minat Investor (Katalog IPRO / Sektor Unggulan)',
        'Formulir Letter of Intent (LoI) Digital',
        'Data Profil Perusahaan & Estimasi Kapital'
      ],
      actions: [
        'Penerbitan Single Investor ID (CRM Tracking Code)',
        'Verifikasi Keabsahan Formulir LoI',
        'Fasilitasi Sesi Consultation & VIP Investor Concierge',
        'Eskalasi Otomatis Berkas ke Bidang Data'
      ],
      outputs: [
        'Dokumen Registrasi LOI Terverifikasi',
        'Jadwal Tentatif Site Visit & Field Survey',
        'Tiket Handover Lintas Bidang #INV-2026-089'
      ],
      kpi: 'SLA Respon < 24 Jam'
    },
    {
      id: 2,
      role: 'admin_data',
      title: 'Fase 2: Validasi Data, Supply Chain & Spasial',
      bidang: 'Bidang Perencanaan, Iklim & Data',
      officer: 'Ahmad Fauzi, S.T. (Admin Data & GIS)',
      sla: '2 - 3 Hari Kerja',
      color: 'blue',
      bgGradient: 'from-blue-500/10 to-cyan-500/5',
      borderColor: 'border-blue-500/30',
      badgeBg: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      icon: Database,
      status: 'DALAM PROSES',
      statusColor: 'text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 animate-pulse',
      inputs: [
        'Kebutuhan Lahan Proyek (Luas & Koordinat)',
        'Kebutuhan Bahan Baku / Neraca Komoditas (Nikel/Kakao/Kopi/Rumput Laut)',
        'Kebutuhan Tenaga Kerja & Infrastruktur Air/Listrik'
      ],
      actions: [
        'Analisis Overlay Pola Ruang RTRW & LP2B (GIS Studio)',
        'Penyusunan Matriks Supply Chain & Radius Bahan Baku',
        'Generasi Laporan Feasibility & Profil Investasi Daerah',
        'Eskalasi Pra-Validasi Spasial ke Bidang OSS'
      ],
      outputs: [
        'Peta Buffer Fitur Spasial & Polygon Rekomendasi',
        'Kajian Kelayakan Pasokan Komoditas Lokal',
        'Dossier Pra-Syarat Perizinan Spasial'
      ],
      kpi: 'SLA Kajian Spasial < 48 Jam'
    },
    {
      id: 3,
      role: 'admin_oss',
      title: 'Fase 3: Pemrosesan Perizinan & OSS-RBA',
      bidang: 'Bidang Pelayanan Perizinan (OSS)',
      officer: 'Budi Santoso, S.H. (Admin OSS)',
      sla: '3 - 5 Hari Kerja',
      color: 'indigo',
      bgGradient: 'from-indigo-500/10 to-purple-500/5',
      borderColor: 'border-indigo-500/30',
      badgeBg: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
      icon: FileCheck2,
      status: 'MENUNGGU ESKALASI',
      statusColor: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400',
      inputs: [
        'Persyaratan NIB OSS-RBA Berdasar KBLI 2020',
        'Poligon Geospasial Lahan Terverifikasi (KML/GeoJSON)',
        'Surat Pertimbangan Teknis (Pertek PUPTR / Pertanian)'
      ],
      actions: [
        'Validasi Kesesuaian KBLI Risiko Tinggi/Menengah',
        'Integrasi Terbitan PKKPR (Sistem Informasi GARTARU PUPTR)',
        'Verifikasi Rekomendasi LP2B (Dinas Pertanian)',
        'Penerbitan Sertifikat Standar / PB-UMKU'
      ],
      outputs: [
        'NIB OSS-RBA Resmi Terbit',
        'SK Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)',
        'Izin Operasional / Sertifikat Standar Komersial'
      ],
      kpi: 'SLA Perizinan OSS < 5 Hari'
    },
    {
      id: 4,
      role: 'admin_dalak',
      title: 'Fase 4: Pengawasan, Konstruksi & Debottlenecking',
      bidang: 'Bidang Pengendalian & Pengawasan (DALAK)',
      officer: 'Drs. Herman Luwu (Admin DALAK)',
      sla: 'Triwulanan & Real-Time',
      color: 'amber',
      bgGradient: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/30',
      badgeBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
      icon: Activity,
      status: 'DIJADWALKAN',
      statusColor: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
      inputs: [
        'Komitmen Target Nilai Investasi (PMA/PMDN)',
        'Laporan Kegiatan Penanaman Modal (LKPM)',
        'Isu / Laporan Hambatan Ground Check Lapangan'
      ],
      actions: [
        'Penyusunan Jadwal Pengawasan Lapangan Terpadu',
        'Fasilitasi Mediasi Konflik Lahan & Hambatan Perizinan Teknis',
        'Verifikasi Realisasi Fisik & Keuangan LKPM',
        'Pelaporan Capaian Investasi ke Kepala Dinas & Bupati'
      ],
      outputs: [
        'Berita Acara Pemeriksaan (BAP) Lapangan',
        'Sertifikat Verifikasi LKPM Triwulanan',
        'Laporan Realisasi Investasi Daerah (PMA/PMDN)'
      ],
      kpi: 'Kepatuhan LKPM 100%'
    }
  ];

  const currentPhase = phases.find(p => p.id === selectedPhase) || phases[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 shadow-lg">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500 text-slate-950">
                  Blue Print Sistem DPMPTSP
                </span>
                <span className="text-xs text-slate-400 font-mono">v2.4 Synchronized</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
                Sinkronisasi Alur Proses Bisnis Empat Admin Bidang DPMPTSP Luwu
              </h2>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* Top Key Performance Metric Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Total Target SLA</p>
                <p className="text-lg font-black text-emerald-950 dark:text-emerald-100">6 - 10 Hari Kerja</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500 text-white">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Kecepatan Integrasi</p>
                <p className="text-lg font-black text-blue-950 dark:text-blue-100">+300% Lebih Cepat</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Single Dossier ID</p>
                <p className="text-lg font-black text-indigo-950 dark:text-indigo-100">Luwu Investor CRM</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500 text-white">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider">Transparansi Progres</p>
                <p className="text-lg font-black text-purple-950 dark:text-purple-100">100% Real-Time</p>
              </div>
            </div>
          </div>

          {/* Interactive Stepper Pipeline */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" /> Alur Pendampingan Investor (4 Tahapan Berkelanjutan)
              </h3>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Klik tiap fase untuk melihat rincian tugas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
              {phases.map((phase) => {
                const IconComp = phase.icon;
                const isSelected = selectedPhase === phase.id;

                return (
                  <button
                    key={phase.id}
                    onClick={() => setSelectedPhase(phase.id)}
                    className={`relative p-4 rounded-xl text-left transition-all border ${
                      isSelected 
                        ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${phase.badgeBg}`}>
                        {phase.sla}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${phase.statusColor}`}>
                        {phase.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mt-2">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{phase.title.split(':')[1]}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{phase.bidang.split('&')[0]}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Phase Deep Dive Details */}
          <div className={`p-6 rounded-2xl border bg-gradient-to-br ${currentPhase.bgGradient} ${currentPhase.borderColor} space-y-6 transition-all`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg">
                  <currentPhase.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                      {currentPhase.bidang}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Penanggung Jawab: {currentPhase.officer}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {currentPhase.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-right">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Target Kinerja SLA</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{currentPhase.sla}</span>
                </div>
              </div>
            </div>

            {/* Three Columns: Input, Action, Output */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Input Data */}
              <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" /> Input Data / Dokumen Masuk
                </h4>
                <ul className="space-y-2">
                  {currentPhase.inputs.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action & Logic */}
              <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Aksi & Tugas Admin Bidang
                </h4>
                <ul className="space-y-2">
                  {currentPhase.actions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Output & Handover */}
              <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-500" /> Output & Pemicu Handover
                </h4>
                <ul className="space-y-2">
                  {currentPhase.outputs.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <ArrowRight className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

          {/* Simulation & Real-time Live Pipeline Case */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Contoh Simulasi Progres Investor Real-Time (#INV-2026-089)
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-slate-950">
                Status: On-Track (Fase 2 Active)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama Perusahaan</span>
                <span className="text-sm font-bold text-white">PT Luwu Cocoa Industry</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nilai Rencana Investasi</span>
                <span className="text-sm font-bold text-emerald-400">Rp 120,5 Miliar (PMDN)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Lokasi Target</span>
                <span className="text-sm font-bold text-white">Kecamatan Bua & Ponrang</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-xs text-emerald-200 flex items-center justify-between">
              <span><strong>Catatan Handover Lintas Bidang:</strong> Admin Promosi telah melimpahkan berkas ke Admin Data. Hasil overlay spasial menunjukkan lahan bebas konflik LP2B dan siap untuk pemrosesan PKKPR di Bidang OSS.</span>
              <button 
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors ml-4 flex-shrink-0"
              >
                Tutup Blueprint
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default FourBidangSyncWorkflowModal;
