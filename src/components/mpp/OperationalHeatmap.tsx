import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Clock, MapPin, Sun, Calendar, AlertCircle, CheckCircle2, 
  ChevronRight, Users, Sparkles, BarChart2, Calculator, 
  QrCode, Download, ShieldCheck, Ticket, FileCheck, Info, ArrowRight, Share2, Layers
} from 'lucide-react';

interface OperationalHeatmapProps {
  isDark?: boolean;
}

export const OperationalHeatmap: React.FC<OperationalHeatmapProps> = ({ isDark = false }) => {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat'>('senin');
  const [selectedServiceSla, setSelectedServiceSla] = useState<string>('nib');
  const [passDownloaded, setPassDownloaded] = useState<boolean>(false);

  // Status operasional saat ini
  const isOperatingHours = true; // 08:00 - 15:30 WITA

  // Data Heatmap Kepadatan Jam
  const hourlyDensity = [
    { time: '08:00', density: 'rendah', percentage: 25, status: t("mppPortal.operationalHeatmap.quietStatus", "Sepi (Lancar)") },
    { time: '09:00', density: 'sedang', percentage: 55, status: t("mppPortal.operationalHeatmap.mediumStatus", "Sedang") },
    { time: '10:00', density: 'tinggi', percentage: 90, status: t("mppPortal.operationalHeatmap.peakStatus", "Puncak Ramai") },
    { time: '11:00', density: 'tinggi', percentage: 85, status: t("mppPortal.operationalHeatmap.busyStatus", "Ramai") },
    { time: '12:00', density: 'istirahat', percentage: 10, status: t("mppPortal.operationalHeatmap.breakStatus", "Jam Istirahat") },
    { time: '13:00', density: 'sedang', percentage: 60, status: t("mppPortal.operationalHeatmap.mediumStatus", "Sedang") },
    { time: '14:00', density: 'sedang', percentage: 45, status: t("mppPortal.operationalHeatmap.mediumStatus", "Sedang") },
    { time: '15:00', density: 'rendah', percentage: 20, status: t("mppPortal.operationalHeatmap.quietStatus", "Sepi (Lancar)") },
  ];

  // Data Katalog SLA & Retribusi
  const slaCatalog: Record<string, { title: string; agency: string; sla: string; fee: string; docs: string; req: string[] }> = {
    nib: {
      title: 'NIB / Perizinan Berusaha OSS RBA',
      agency: 'DPMPTSP Kab. Luwu',
      sla: '15 - 30 Menit (Langsung Terbit)',
      fee: 'Rp 0 (Bebas Retribusi)',
      docs: 'KTP & NPWP Pemohon',
      req: ['e-KTP Pemilik Usaha', 'NPWP Aktif', 'Nomor HP & Email Aktif', 'Detail Alamat Kegiatan Usaha']
    },
    pbg: {
      title: 'Persetujuan Bangunan Gedung (PBG)',
      agency: 'Dinas PUPR & DPMPTSP Kab. Luwu',
      sla: '3 - 5 Hari Kerja (Pasca Verifikasi Teknis)',
      fee: 'Berdasarkan Perda Retribusi Bangunan (Transparan)',
      docs: 'Gambar Arsitektur & Sertifikat Tanah',
      req: ['Sertifikat Hak Milik / Tanah', 'KTP Pemohon', 'Gambar Rencana Bangunan', 'Rekomendasi Tim Ahli Bangunan Gedung (TABG)']
    },
    ktp: {
      title: 'Pencetakan e-KTP / Kartu Keluarga',
      agency: 'Dinas Dukcapil Kab. Luwu',
      sla: '10 - 20 Menit',
      fee: 'Rp 0 (Gratis Sesuai UU)',
      docs: 'Resi Pengurusan / KK Lama',
      req: ['Kartu Keluarga (KK) Asli', 'Surat Keterangan Hilang (jika cetak ulang)', 'e-KTP Lama (jika rusak)']
    },
    paspor: {
      title: 'Pembuatan / Perpanjangan Paspor RI',
      agency: 'Kantor Imigrasi (Loket Vertikal)',
      sla: '3 Hari Kerja (Setelah Wawancara & Foto)',
      fee: 'Sesuai PNBP Resmi Keimigrasian',
      docs: 'KTP, KK, Akta Kelahiran / Ijazah',
      req: ['e-KTP Asli', 'Kartu Keluarga Asli', 'Akta Kelahiran / Buku Nikah / Ijazah', 'Paspor Lama (jika perpanjangan)']
    },
    sawi: {
      title: 'Surat Izin Praktik Tenaga Kesehatan (SIP)',
      agency: 'Dinas Kesehatan & DPMPTSP',
      sla: '1 - 2 Hari Kerja',
      fee: 'Rp 0 (Bebas Biaya)',
      docs: 'STR Aktif & Rekomendasi Organisasi Profesi',
      req: ['Surat Tanda Registrasi (STR) Legalisir', 'Rekomendasi Organisasi Profesi (IDI/PPNI/IBI)', 'Surat Pernyataan Tempat Praktik', 'Pasfoto Berwarna 4x6']
    }
  };

  const activeSla = slaCatalog[selectedServiceSla] || slaCatalog.nib;

  return (
    <div className="w-full space-y-6 sm:space-y-8 my-4 sm:my-8">
      {/* 1. Live Header Operating Status Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/30 p-4 sm:p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5 sm:space-y-3 max-w-2xl w-full">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider font-sans">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping" />
              {t("mppPortal.operationalHeatmap.statusHeader", "Real-Time Status MPP Simpurusiang")}
            </div>
            
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug break-words font-sans">
              {t("mppPortal.operationalHeatmap.statusTitle", "Pelayanan Publik Luwu Terbuka & Bebas Pungli")}
            </h2>
            
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {t("mppPortal.operationalHeatmap.statusDesc", "Pusat Pelayanan Terpadu Satu Pintu Kabupaten Luwu. 21 Instansi Vertikal dan OPD siap melayani perizinan dan dokumen kependudukan Anda secara ramah, cepat, dan transparan.")}
            </p>

            <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>08:00 - 15:30 WITA (Senin - Jumat)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Jl. Jendral Sudirman No. 1, Belopa</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sun className="w-6 h-6 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono block">
                {t("mppPortal.operationalHeatmap.operatingActive", "BEROPERASI AKTIF")}
              </span>
              <span className="text-xs text-slate-300 font-medium mt-0.5 block">
                {t("mppPortal.operationalHeatmap.operatingDesc", "21 Loket Buka • 12 Operator Duty")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Heatmap Density & SLA Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Peak Hours Heatmap (7 Cols) */}
        <div className={`lg:col-span-7 p-5 sm:p-6 rounded-3xl border ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                <BarChart2 className="w-4 h-4" />
                <span>{t("mppPortal.operationalHeatmap.mapTitle", "Peta Jam Ramai vs Sepi Kunjungan")}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t("mppPortal.operationalHeatmap.mapSubtitle", "Pilihlah jam berkunjung di rentang hijau/sepi agar transaksi perizinan dan dokumen Anda selesai lebih nyaman tanpa antre.")}
              </p>
            </div>
          </div>

          {/* Density Bar Visualization */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {hourlyDensity.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 transition-all ${
                  item.density === 'rendah'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                    : item.density === 'sedang'
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-950 dark:text-teal-200'
                      : item.density === 'istirahat'
                        ? 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>{item.time}</span>
                  <span className="text-[10px]">{item.percentage}%</span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      item.density === 'rendah' ? 'bg-emerald-500' : item.density === 'sedang' ? 'bg-teal-500' : item.density === 'istirahat' ? 'bg-slate-400' : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <span className="text-[10px] font-medium line-clamp-1">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SLA & Fee Catalog Inspector (5 Cols) */}
        <div className={`lg:col-span-5 p-5 sm:p-6 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>{t("mppPortal.operationalHeatmap.slaTitle", "Cek Biaya & Estimasi Durasi (SLA)")}</span>
              </h3>
            </div>

            {/* Service Select Pills */}
            <div className="flex overflow-x-auto flex-nowrap snap-x snap-mandatory gap-2 pb-3 scrollbar-hide [&::-webkit-scrollbar]:hidden touch-pan-x">
              {Object.keys(slaCatalog).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedServiceSla(key)}
                  className={`min-h-[44px] px-4.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap uppercase tracking-wider transition-all cursor-pointer snap-start ${
                    selectedServiceSla === key
                      ? 'bg-emerald-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Selected Service SLA Box */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                {activeSla.title}
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5 text-slate-600 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] xs:text-xs">{t("mppPortal.operationalHeatmap.agencyLabel", "Instansi Penanggung Jawab:")}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 xs:text-right">{activeSla.agency}</span>
                </div>

                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5 text-slate-600 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] xs:text-xs">{t("mppPortal.operationalHeatmap.slaLabel", "Estimasi SLA Pengerjaan:")}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono xs:text-right">{activeSla.sla}</span>
                </div>

                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5 text-slate-600 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] xs:text-xs">{t("mppPortal.operationalHeatmap.feeLabel", "Biaya Retribusi Resmi:")}</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400 font-mono xs:text-right">{activeSla.fee}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  {t("mppPortal.operationalHeatmap.docsLabel", "Syarat Wajib Berkas:")}
                </span>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {activeSla.req.map((r, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
