import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  FileCheck2,
  Wheat,
  Building2,
  MapPin,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { LuwuLogo } from '../LuwuLogo';
import { AgrarianQueueItem } from './PertanianLandClearanceDashboard';

export interface BapRekapReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AgrarianQueueItem[];
  statusFilter: string;
}

export const BapRekapReportModal: React.FC<BapRekapReportModalProps> = ({
  isOpen,
  onClose,
  items,
  statusFilter
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const totalAreaHa = items.reduce((acc, curr) => acc + (curr.areaHa || 0), 0);
  const approvedItems = items.filter(i => i.agriStatus === 'Approved');
  const rejectedItems = items.filter(i => i.agriStatus === 'Rejected' || i.agriStatus === 'Requires Revision');

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'No BAP Pertanian',
      'NIB/NIK Pemohon',
      'Nama Pemohon',
      'Nama Perusahaan',
      'Kecamatan',
      'Desa',
      'Tanama/Eksisting',
      'Luas (Ha)',
      'Status BAP',
      'Tanggal Created'
    ];

    const rows = items.map((item, idx) => [
      idx + 1,
      `"${item.pertanianBaNumber || item.beritaAcaraDocNum || '-'}"`,
      `"${item.nibNik}"`,
      `"${item.applicantName}"`,
      `"${item.companyName}"`,
      `"${item.districtName}"`,
      `"${item.villageName}"`,
      `"${item.existingCrop || '-'}"`,
      item.areaHa,
      `"${item.agriStatus === 'Approved' ? 'Disetujui (BA Terbit)' : item.agriStatus === 'Rejected' ? 'Ditolak' : 'Pending Evaluation'}"`,
      `"${item.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `REKAP_BAP_PERTANIAN_LUWU_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-base/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header Control Bar (Hidden when printing) */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white border-b border-emerald-500/30 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono">
                DINAS PERTANIAN KABUPATEN LUWU
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Laporan Rekapitulasi Berita Acara (BAP) Pertek LP2B
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div ref={printContainerRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-slate-900 font-serif print:p-0 print:overflow-visible">
          {/* Official Letterhead Header */}
          <div className="border-b-4 border-double border-black pb-4 text-center relative font-serif">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-20 shrink-0 flex items-center justify-center">
                <LuwuLogo className="w-16 h-20 object-contain" />
              </div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide">PEMERINTAH KABUPATEN LUWU</h3>
                <h2 className="text-lg font-black uppercase tracking-wider">DINAS PERTANIAN</h2>
                <p className="text-xs font-sans text-slate-700">
                  Jalan Jenderal Sudirman No. 01 Belopa, Kabupaten Luwu, Sulawesi Selatan 91994
                </p>
                <p className="text-[10px] font-mono text-slate-600">
                  Website: www.pertanian.luwukab.go.id | Email: pertanian@luwukab.go.id
                </p>
              </div>
            </div>
          </div>

          {/* Title & Period */}
          <div className="text-center font-sans space-y-1">
            <h1 className="text-base font-black uppercase tracking-wide text-slate-900">
              LAPORAN REKAPITULASI BERITA ACARA PERTEK LAHAN PERTANIAN (LP2B)
            </h1>
            <p className="text-xs font-bold text-slate-600">
              Kategori Filter: <span className="uppercase text-emerald-700">{statusFilter === 'APPROVED' ? 'Disetujui (BAP Terbit)' : statusFilter === 'REJECTED' ? 'Dikembalikan ke PUPTR / Ditolak' : 'Seluruh Arsip Evaluasi'}</span> | Per Tanggal: {dateStr}
            </p>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-4 gap-3 font-sans text-xs">
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Permohonan</span>
              <span className="text-lg font-black text-slate-900 font-mono">{items.length} Berkas</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">BAP Disetujui</span>
              <span className="text-lg font-black text-emerald-700 font-mono">{approvedItems.length} Berkas</span>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">BAP Ditolak</span>
              <span className="text-lg font-black text-rose-700 font-mono">{rejectedItems.length} Berkas</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Total Luas Evaluasi</span>
              <span className="text-lg font-black text-amber-800 font-mono">{totalAreaHa.toFixed(2)} Ha</span>
            </div>
          </div>

          {/* Data Table */}
          <table className="w-full border-collapse border border-black font-sans text-[11px] text-left">
            <thead>
              <tr className="bg-slate-200 border-b border-black text-slate-900 font-bold uppercase text-[10px] text-center">
                <th className="border border-black p-2 w-8">No</th>
                <th className="border border-black p-2">Nomor BAP Pertanian</th>
                <th className="border border-black p-2">Pemohon &amp; Perusahaan</th>
                <th className="border border-black p-2">NIB / NIK</th>
                <th className="border border-black p-2">Kecamatan &amp; Desa</th>
                <th className="border border-black p-2 w-20">Luas (Ha)</th>
                <th className="border border-black p-2 w-24">Status BAP</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-black p-4 text-center italic text-slate-500">
                    Belum ada data rekapitulasi untuk filter kategori ini.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-black">
                    <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black p-2 font-mono font-bold text-slate-800">
                      {item.pertanianBaNumber || item.beritaAcaraDocNum || '520.1/BAP/DISTAN/2026'}
                    </td>
                    <td className="border border-black p-2">
                      <div className="font-bold">{item.companyName}</div>
                      <div className="text-[10px] text-slate-600">{item.applicantName}</div>
                    </td>
                    <td className="border border-black p-2 font-mono">{item.nibNik}</td>
                    <td className="border border-black p-2">
                      Kec. {item.districtName}, Desa {item.villageName}
                    </td>
                    <td className="border border-black p-2 font-mono font-bold text-right">{item.areaHa} Ha</td>
                    <td className="border border-black p-2 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                        item.agriStatus === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : item.agriStatus === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.agriStatus === 'Approved' ? 'DISAJIKAN BAP' : item.agriStatus === 'Rejected' ? 'DITOLAK' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Sign-off Official Stamp Block */}
          <div className="pt-6 flex justify-end font-serif">
            <div className="w-72 text-center text-xs space-y-1">
              <div>Belopa, {dateStr}</div>
              <div className="font-bold uppercase">KEPALA DINAS PERTANIAN KABUPATEN LUWU</div>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] font-sans text-slate-400 italic border border-dashed border-slate-300 p-1 rounded">
                  [Tanda Tangan &amp; Stempel Basah/TTE]
                </span>
              </div>
              <div className="font-bold underline uppercase">drh. JUMARDI, M.Si</div>
              <div>NIP. 19720514 199903 1 002</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
