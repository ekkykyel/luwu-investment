import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, 
  Square, 
  ChevronRight, 
  ChevronLeft, 
  FileCheck2, 
  Sparkles, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  desc: string;
  required: boolean;
  checked: boolean;
}

export interface RequirementStage {
  id: number;
  title: string;
  badge: string;
  description: string;
  items: StepItem[];
}

const STAGES: RequirementStage[] = [
  {
    id: 1,
    title: 'Data Pemohon & Legalitas Awal',
    badge: 'Tahap 1 dari 4',
    description: 'Dokumen identitas dasar pemilik usaha perseorangan atau badan hukum.',
    items: [
      { id: '1-1', label: 'KTP-el Pemilik / Direktur Utama', desc: 'Scan e-KTP jelas tanpa crop sudut dokumen', required: true, checked: false },
      { id: '1-2', label: 'NPWP Aktif (Pribadi / Badan Usaha)', desc: 'Validasi status KSWP DJP Online aktif', required: true, checked: false },
      { id: '1-3', label: 'Nomor WhatsApp & Email Perusahaan', desc: 'Digunakan untuk verifikasi OTP akun OSS-RBA', required: true, checked: false },
      { id: '1-4', label: 'Akta Pendirian & SK Kemenkumham (Khusus PT/CV)', desc: 'Opsional untuk usaha perseorangan mikro', required: false, checked: false },
    ],
  },
  {
    id: 2,
    title: 'Penentuan KBLI & Tingkat Risiko',
    badge: 'Tahap 2 dari 4',
    description: 'Klasifikasi Baku Lapangan Usaha Indonesia (KBLI 2020) sesuai skala investasi.',
    items: [
      { id: '2-1', label: 'Pemilihan 5 Digit Kode KBLI 2020', desc: 'Konsultasi gratis tersedia di gerai DPMPTSP Loket 03', required: true, checked: false },
      { id: '2-2', label: 'Estimasi Modal Usaha & Luas Lahan', desc: 'Menentukan kategori UMK (<5M) atau Non-UMK (>5M)', required: true, checked: false },
      { id: '2-3', label: 'Pernyataan Mandiri K3L & Standar Usaha', desc: 'Pakta integritas kepatuhan regulasi teknis daerah', required: true, checked: false },
    ],
  },
  {
    id: 3,
    title: 'Tata Ruang (KKPPR) & Lingkungan',
    badge: 'Tahap 3 dari 4',
    description: 'Kesesuaian tata ruang RTRW Kabupaten Luwu dan komitmen perlindungan lingkungan.',
    items: [
      { id: '3-1', label: 'Konfirmasi Poligon Koordinat Geospasial', desc: 'Titik koordinat poligon lokasi usaha di peta GIS Luwu', required: true, checked: false },
      { id: '3-2', label: 'Pernyataan Mandiri SPPL Lingkungan Hidup', desc: 'Untuk kegiatan usaha risiko rendah & menengah rendah', required: true, checked: false },
      { id: '3-3', label: 'Persetujuan Teknis Dinas Terkait (Jika Ada)', desc: 'Rekomendasi teknis khusus komoditas tertentu', required: false, checked: false },
    ],
  },
  {
    id: 4,
    title: 'Penerbitan NIB & Sertifikat Standar',
    badge: 'Tahap 4 dari 4',
    description: 'Pencetakan NIB digital ber-QR Code resmi Kementerian Investasi/BKPM RI.',
    items: [
      { id: '4-1', label: 'Review Draft Dokumen NIB Elektronik', desc: 'Pengecekan kesesuaian data sebelum enkripsi BSrE', required: true, checked: false },
      { id: '4-2', label: 'Unduh Dokumen NIB dengan QR Code TTE', desc: 'Dapat dicetak mandiri di Anjungan Mandiri Kiosk MPP', required: true, checked: false },
    ],
  },
];

export const InteractiveRequirementStepper: React.FC = () => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stages, setStages] = useState<RequirementStage[]>(STAGES);

  const currentStage = stages[currentStageIndex];

  // Toggle item check
  const toggleItem = (itemId: string) => {
    setStages(prev => prev.map((stage, sIdx) => {
      if (sIdx !== currentStageIndex) return stage;
      return {
        ...stage,
        items: stage.items.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it),
      };
    }));
  };

  // Calculate overall progress across all stages
  const allItems = stages.flatMap(s => s.items);
  const checkedCount = allItems.filter(it => it.checked).length;
  const progressPercent = Math.round((checkedCount / allItems.length) * 100);

  return (
    <section id="syarat-dokumen" className="w-full space-y-6 scroll-mt-28">
      
      {/* Header with Title & Overall Progress */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300/60 dark:border-teal-700/60">
            <FileCheck2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Interactive Progressive Stepper</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            Panduan Syarat Izin NIB OSS-RBA
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Centang kelengkapan berkas Anda secara bertahap untuk memastikan tidak ada dokumen yang tertinggal.
          </p>
        </div>

        {/* Global Progress Bar Pill */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm flex items-center justify-center">
            {progressPercent}%
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">Kelengkapan Berkas</div>
            <div className="text-[11px] text-slate-400">{checkedCount} dari {allItems.length} dokumen siap</div>
          </div>
        </div>
      </div>

      {/* 2. PROGRESSIVE STEPPER NAV TABS (Material 3 Stepper Pattern) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stages.map((stage, idx) => {
          const isActive = idx === currentStageIndex;
          const isDone = stage.items.every(it => it.checked);
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setCurrentStageIndex(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                  : isDone
                  ? 'bg-white dark:bg-slate-900 border-emerald-500/30 text-emerald-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  Langkah 0{idx + 1}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                )}
              </div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1 font-sans">
                {stage.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE STEP CHECKLIST CARD */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {currentStage.badge}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-sans">
              {currentStage.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentStage.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">
              {currentStage.items.filter(it => it.checked).length} / {currentStage.items.length} Selesai
            </span>
          </div>
        </div>

        {/* Interactive Checkbox Items */}
        <div className="space-y-3">
          {currentStage.items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                item.checked
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 shadow-2xs'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
              >
                {item.checked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs sm:text-sm font-bold font-sans ${
                    item.checked ? 'text-emerald-950 dark:text-emerald-200 line-through opacity-80' : 'text-slate-900 dark:text-white'
                  }`}>
                    {item.label}
                  </span>
                  {item.required ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                      Wajib
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Opsional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stepper Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setCurrentStageIndex(prev => Math.max(0, prev - 1))}
            disabled={currentStageIndex === 0}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          {currentStageIndex < stages.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStageIndex(prev => Math.min(stages.length - 1, prev + 1))}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
            >
              <span>Lanjut Tahap Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <a
              href="https://oss.go.id"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
            >
              <span>Buka Portal OSS-RBA</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default InteractiveRequirementStepper;
