import React from 'react';
import { 
  Info, 
  FileCheck2, 
  Cpu, 
  Award, 
  Clock, 
  ShieldCheck
} from 'lucide-react';

interface FlowchartLevelLayananProps {
  isDark?: boolean;
}

export const FlowchartLevelLayanan: React.FC<FlowchartLevelLayananProps> = ({
  isDark = true
}) => {
  const levels = [
    {
      level: 'LEVEL 1',
      title: 'Informasi & Screening Awal',
      desc: 'Konsultasi berkas, pengecekan persyaratan dasar, dan pengambilan tiket antrean digital / Kios Mandiri.',
      sla: '5 - 10 Menit',
      icon: Info,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/15 border-sky-500/30'
    },
    {
      level: 'LEVEL 2',
      title: 'Verifikasi & Validasi Dokumen',
      desc: 'Pemeriksaan kelengkapan administrasi oleh petugas FO loket OPD / instansi terkait.',
      sla: '15 - 30 Menit',
      icon: FileCheck2,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    },
    {
      level: 'LEVEL 3',
      title: 'Kajian Teknis & Pertimbangan',
      desc: 'Validasi spasial kesesuaian ruang (PKKPR/RTRW) & rekomendasi teknis oleh tim teknis instansi.',
      sla: '1 - 3 Hari Kerja',
      icon: Cpu,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
    },
    {
      level: 'LEVEL 4',
      title: 'Penerbitan Produk & SK Digital',
      desc: 'Tanda tangan elektronik (TTE) pejabat berwenang dan penerbitan dokumen legal ber-QR Code valid.',
      sla: 'Instan pasca-TTE',
      icon: Award,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/15 border-purple-500/30'
    }
  ];

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-6 transition-all duration-300 ${
        isDark
          ? 'bg-slate-900/60 border-slate-800 text-white'
          : 'bg-white border-slate-200/90 text-slate-900 shadow-xl shadow-slate-200/60'
      }`}
    >
      {/* Section Header with Clear Page/Section Badge Indicator */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b pb-4 ${
        isDark ? 'border-slate-700/50' : 'border-slate-200'
      }`}>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> HALAMAN: SOP LEVEL PELAYANAN MPP
          </div>
          <h3 className={`font-bold text-lg sm:text-xl font-display ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Alur & Tahapan Level Pelayanan MPP Luwu
          </h3>
        </div>
        <div className={`text-xs font-mono font-semibold ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Berdasarkan PermenPAN-RB No. 92/2021
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative">
        {levels.map((item, idx) => (
          <div
            key={idx}
            className={`relative p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-800/50 border-slate-700/60 hover:border-emerald-500/40'
                : 'bg-slate-50/90 border-slate-200/90 hover:border-emerald-500/50 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`font-mono text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md ${
                  isDark ? 'bg-slate-700/60 text-slate-200' : 'bg-slate-200 text-slate-800'
                }`}>
                  {item.level}
                </span>
                <div className={`p-2 rounded-xl border ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
              </div>
              <h4 className={`font-bold text-sm sm:text-base mb-1.5 leading-snug ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                {item.title}
              </h4>
              <p className={`text-xs leading-relaxed mb-4 font-normal ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {item.desc}
              </p>
            </div>

            <div className={`pt-3 border-t flex items-center justify-between text-[11px] ${
              isDark ? 'border-slate-700/50' : 'border-slate-200'
            }`}>
              <span className={`flex items-center gap-1 font-medium ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Target SLA:
              </span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {item.sla}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowchartLevelLayanan;
