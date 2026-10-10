import React from 'react';
import { 
  Smartphone, 
  Armchair, 
  Volume2, 
  FileCheck, 
  Award, 
  Smile, 
  ShieldCheck
} from 'lucide-react';

interface AlurPelayananDiagramProps {
  isDark?: boolean;
}

export const AlurPelayananDiagram: React.FC<AlurPelayananDiagramProps> = ({
  isDark = true
}) => {
  const steps = [
    {
      num: '01',
      title: 'Ambil Antrean',
      desc: 'Daftar online via portal atau mandiri di Kios KTP Elektronik.',
      icon: Smartphone,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/15 border-sky-500/30'
    },
    {
      num: '02',
      title: 'Ruang Tunggu',
      desc: 'Pantau status tiket di layar FIDS interaktif & radar audio live.',
      icon: Armchair,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 border-indigo-500/30'
    },
    {
      num: '03',
      title: 'Pemanggilan',
      desc: 'Notifikasi suara otomatis dan nomor loket tampil di layar display.',
      icon: Volume2,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
    },
    {
      num: '04',
      title: 'Layanan Loket',
      desc: 'Verifikasi berkas & konsultasi langsung dengan petugas instansi.',
      icon: FileCheck,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    },
    {
      num: '05',
      title: 'Penerbitan Produk',
      desc: 'Dokumen izin / administrasi diterbitkan dengan TTE & barcode resmi.',
      icon: Award,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/15 border-purple-500/30'
    },
    {
      num: '06',
      title: 'Survei Kepuasan',
      desc: 'Berikan rating & ulasan (SKM) untuk evaluasi standar pelayanan.',
      icon: Smile,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30'
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
      {/* Header with Clear Section / Page Indicator */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b pb-4 ${
        isDark ? 'border-slate-700/50' : 'border-slate-200'
      }`}>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> HALAMAN: ALUR TERPADU PEMOHON
          </div>
          <h3 className={`font-bold text-lg sm:text-xl font-display ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Alur Terpadu Pelayanan Pemohon di MPP Luwu
          </h3>
        </div>
        <div className={`text-xs font-mono font-semibold ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          One Stop Service (OSS) Luwu
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`relative p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-800/40 border-slate-700/60 hover:border-sky-500/40'
                : 'bg-slate-50/90 border-slate-200/90 hover:border-sky-500/50 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  isDark ? 'text-slate-300 bg-slate-700/60' : 'text-slate-800 bg-slate-200'
                }`}>
                  {step.num}
                </span>
                <div className={`p-2 rounded-xl border ${step.color}`}>
                  <step.icon className="w-4 h-4" />
                </div>
              </div>
              <h4 className={`font-bold text-xs sm:text-sm mb-1 leading-snug ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                {step.title}
              </h4>
              <p className={`text-[11px] leading-snug ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlurPelayananDiagram;
