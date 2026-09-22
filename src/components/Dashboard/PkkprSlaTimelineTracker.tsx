import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ShieldCheck,
  Wheat,
  Building2,
  Send,
  Download,
  Printer,
  ChevronRight,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  FileCheck2,
  QrCode
} from 'lucide-react';

export interface TimelineCheckpoint {
  id: string;
  stageName: string;
  opdName: string;
  icon: any;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'REJECTED' | 'WAITING' | 'SKIPPED';
  timestamp?: string;
  docNumber?: string;
  notes?: string;
  slaDays: number;
  daysElapsed?: number;
  handlerName?: string;
}

export interface PkkprSlaTimelineData {
  id: string;
  nibNik: string;
  applicantName: string;
  companyName: string;
  sector: string;
  districtName: string;
  villageName: string;
  areaHa: number;
  createdAt: string;
  updatedAt: string;
  statusPkkpr: string;
  pertekPuptrNum?: string;
  catatanTeknisPuptr?: string;
  pertanianStatus?: 'NOT_REQUIRED' | 'FORWARDED' | 'APPROVED' | 'REJECTED';
  beritaAcaraPertanianNum?: string;
  catatanPertanian?: string;
  skPkkprNum?: string;
  isTteSigned?: boolean;
  tteSignedDate?: string;
  skPdfUrl?: string;
}

interface Props {
  data: PkkprSlaTimelineData;
  onDownloadSk?: () => void;
  onPrintSk?: () => void;
  isApplicantView?: boolean;
}

export const PkkprSlaTimelineTracker: React.FC<Props> = ({
  data,
  onDownloadSk,
  onPrintSk,
  isApplicantView = false
}) => {
  const createdDate = new Date(data.createdAt || Date.now());
  const now = new Date();
  const totalDays = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Derive stage checkpoints
  const isPertanianRequired = data.pertanianStatus && data.pertanianStatus !== 'NOT_REQUIRED';
  const isPertanianRejected = data.pertanianStatus === 'REJECTED';
  const isPuptrRejected = data.statusPkkpr === 'Requires Revision' || data.statusPkkpr === 'Rejected' || data.statusPkkpr === 'Rejected_PUPTR';
  const isPuptrApproved = Boolean(data.pertekPuptrNum || data.statusPkkpr === 'Approved' || data.statusPkkpr === 'Approved_PUPTR' || data.statusPkkpr === 'Published' || data.skPkkprNum);
  const isSkIssued = Boolean(data.skPkkprNum || data.statusPkkpr === 'Published');

  const checkpoints: TimelineCheckpoint[] = [
    {
      id: 'step-1',
      stageName: '1. Pengajuan Permohonan PKKPR & Poligon Spasial',
      opdName: 'Pemohon / Pelaku Usaha',
      icon: User,
      status: 'COMPLETED',
      timestamp: data.createdAt,
      docNumber: data.id,
      notes: `Permohonan resmi terdaftar dengan NIB/NIK ${data.nibNik} seluas ${data.areaHa} Ha di Kec. ${data.districtName}, Desa ${data.villageName}.`,
      slaDays: 1,
      daysElapsed: 1,
      handlerName: data.applicantName
    },
    {
      id: 'step-2',
      stageName: '2. Verifikasi Teknis Tata Ruang & Analisis Poligon',
      opdName: 'Dinas PUPTR Kab. Luwu',
      icon: ShieldCheck,
      status: isPuptrRejected
        ? 'REJECTED'
        : isPuptrApproved
        ? 'COMPLETED'
        : data.pertanianStatus === 'FORWARDED'
        ? 'IN_PROGRESS'
        : 'IN_PROGRESS',
      timestamp: isPuptrApproved || isPuptrRejected ? data.updatedAt : undefined,
      docNumber: data.pertekPuptrNum,
      notes: isPuptrRejected
        ? (data.catatanTeknisPuptr || 'Permohonan dikembalikan ke pemohon untuk revisi batas/dokumen.')
        : isPuptrApproved
        ? `Pertimbangan teknis tata ruang disetujui (Pertek No. ${data.pertekPuptrNum || '-'}). ${data.catatanTeknisPuptr || ''}`
        : 'Sedang dalam penelaahan peta rencana tata ruang (RTRW/RDTR) dan deliniasi batas.',
      slaDays: 10,
      daysElapsed: isPuptrApproved ? Math.min(totalDays, 5) : totalDays,
      handlerName: 'Tim Ahli Tata Ruang PUPTR'
    },
    {
      id: 'step-3',
      stageName: '3. Telaah Pertimbangan Lahan Pertanian (LP2B)',
      opdName: 'Dinas Pertanian Kab. Luwu',
      icon: Wheat,
      status: !isPertanianRequired
        ? 'SKIPPED'
        : isPertanianRejected
        ? 'REJECTED'
        : data.pertanianStatus === 'APPROVED' || data.beritaAcaraPertanianNum
        ? 'COMPLETED'
        : 'IN_PROGRESS',
      timestamp: data.beritaAcaraPertanianNum ? data.updatedAt : undefined,
      docNumber: data.beritaAcaraPertanianNum,
      notes: !isPertanianRequired
        ? 'Tidak bersinggungan dengan Lahan Pertanian Pangan Berkelanjutan (LP2B). Tahapan dilewati sesuai SOP.'
        : isPertanianRejected
        ? (data.catatanPertanian || 'Ditolak: Lokasi berada pada sawah irigasi teknis aktif/kawasan lindung LP2B mutlak.')
        : data.beritaAcaraPertanianNum
        ? `Rekomendasi teknis disetujui dengan Berita Acara No. ${data.beritaAcaraPertanianNum}.`
        : 'Sedang dalam verifikasi lapangan & overlay data geospasial LP2B oleh Dinas Pertanian.',
      slaDays: 7,
      daysElapsed: isPertanianRequired ? (data.beritaAcaraPertanianNum ? 3 : totalDays) : 0,
      handlerName: 'Tim Verifikasi Lahan LP2B'
    },
    {
      id: 'step-4',
      stageName: '4. Penerbitan & Pengesahan TTE SK Izin PKKPR',
      opdName: 'DPMPTSP Kab. Luwu (Bidang Perizinan / OSS)',
      icon: Building2,
      status: isPuptrRejected || isPertanianRejected
        ? 'WAITING'
        : isSkIssued
        ? 'COMPLETED'
        : isPuptrApproved
        ? 'IN_PROGRESS'
        : 'WAITING',
      timestamp: isSkIssued ? data.updatedAt : undefined,
      docNumber: data.skPkkprNum,
      notes: isSkIssued
        ? `Surat Keputusan Izin PKKPR No. ${data.skPkkprNum} telah disahkan secara elektronik (TTE Sah) oleh Kepala DPMPTSP Kab. Luwu.`
        : isPuptrApproved
        ? 'Menunggu finalisasi pencetakan dan TTE oleh Admin Perizinan DPMPTSP berdasarkan Pertek PUPTR.'
        : 'Menunggu penyelesaian rekomendasi teknis dari Dinas PUPTR.',
      slaDays: 3,
      daysElapsed: isSkIssued ? 2 : 0,
      handlerName: 'Kepala DPMPTSP Kab. Luwu'
    },
    {
      id: 'step-5',
      stageName: '5. Penyerahan Dokumen Izin ke Pemohon (Syarat PBG)',
      opdName: 'Dashboard Pemohon & Portal Terpadu',
      icon: FileCheck2,
      status: isSkIssued ? 'COMPLETED' : 'WAITING',
      timestamp: isSkIssued ? data.updatedAt : undefined,
      notes: isSkIssued
        ? 'Dokumen SK PKKPR resmi telah aktif dan siap diunduh/dicetak pemohon sebagai syarat utama pengurusan PBG (Persetujuan Bangunan Gedung).'
        : 'Dokumen akan tersedia otomatis di dashboard pemohon setelah disahkan DPMPTSP.',
      slaDays: 1,
      daysElapsed: isSkIssued ? 1 : 0
    }
  ];

  // Calculate Overall SLA Status
  const maxSlaDays = 20;
  let slaStatusBadge = {
    label: 'ON TRACK (Sesuai Standar Pelayanan)',
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
  };

  if (totalDays > maxSlaDays) {
    slaStatusBadge = {
      label: `OVERDUE (Melebihi SLA ${totalDays - maxSlaDays} Hari)`,
      color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
    };
  } else if (totalDays >= maxSlaDays - 4) {
    slaStatusBadge = {
      label: 'WARNING (Mendekati Batas SLA)',
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
    };
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-6">
      {/* Header Info & SLA Argometer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {data.id}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              • {data.sector || 'Sektor Usaha'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            {data.companyName} ({data.applicantName})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span>Kec. {data.districtName}, Desa {data.villageName} • Luas: {data.areaHa} Ha</span>
          </p>
        </div>

        {/* SLA Argometer Box */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 sm:text-right shrink-0 space-y-1.5">
          <div className="flex sm:justify-end items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Argometer Waktu: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{totalDays} Hari</strong> / Max {maxSlaDays} Hari
            </span>
          </div>
          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${slaStatusBadge.color}`}>
              {slaStatusBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* REJECTION / RETURN BANNER IF ANY */}
      {(isPuptrRejected || isPertanianRejected) && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 space-y-2">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              {isPertanianRejected
                ? 'Permohonan Ditolak oleh Dinas Pertanian (Kendala LP2B)'
                : 'Permohonan Dikembalikan ke Pemohon untuk Perbaikan / Revisi'}
            </span>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            <strong>Catatan Resmi Penolakan / Revisi:</strong>{' '}
            {data.catatanTeknisPuptr || data.catatanPertanian || 'Silakan sesuaikan koordinat poligon atau lengkapi berkas persyaratan.'}
          </p>
          {data.beritaAcaraPertanianNum && (
            <p className="text-[11px] font-mono text-rose-800 dark:text-rose-300">
              Nomor Dokumen BAP Terkait: <strong>{data.beritaAcaraPertanianNum}</strong>
            </p>
          )}
        </div>
      )}

      {/* ISSUED & READY TO DOWNLOAD BANNER */}
      {isSkIssued && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-500 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>SK Izin PKKPR Resmi Terbit (TTE Sah)</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold">
                    TTE Verified
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                  No. SK: <strong>{data.skPkkprNum}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onDownloadSk && (
                <button
                  type="button"
                  onClick={onDownloadSk}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh SK PDF (Syarat PBG)</span>
                </button>
              )}
              {onPrintSk && (
                <button
                  type="button"
                  onClick={onPrintSk}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-transparent font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20 leading-relaxed">
            💡 <strong>Panduan Pemohon:</strong> Dokumen SK PKKPR ini telah memuat Tanda Tangan Elektronik (TTE) resmi Kepala DPMPTSP Luwu beserta QR-Code verifikasi. Dokumen ini sah digunakan sebagai prasyarat wajib untuk pengurusan <strong>Persetujuan Bangunan Gedung (PBG)</strong> di Dinas PUPTR.
          </p>
        </div>
      )}

      {/* Step-by-Step Vertical Timeline */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Alur Tahapan Proses Bisnis &amp; Rekapitulasi Waktu (SLA Timeline)
        </h4>

        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {checkpoints.map((cp, idx) => {
            const isCompleted = cp.status === 'COMPLETED';
            const isInProgress = cp.status === 'IN_PROGRESS';
            const isRejected = cp.status === 'REJECTED';
            const isSkipped = cp.status === 'SKIPPED';
            const Icon = cp.icon;

            return (
              <div key={cp.id} className="relative group">
                {/* Step Circle Icon */}
                <div
                  className={`absolute -left-[30px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : isRejected
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/30'
                      : isInProgress
                      ? 'bg-amber-500 border-amber-500 text-white animate-pulse shadow-md shadow-amber-500/30'
                      : isSkipped
                      ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isRejected ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : isInProgress ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Step Content Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                      : isInProgress
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 ring-1 ring-amber-500/20'
                      : isRejected
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                      : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {cp.stageName}
                    </h5>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        SLA Maks: {cp.slaDays} Hari
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isInProgress
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : isSkipped
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {isCompleted
                          ? 'Selesai ✓'
                          : isInProgress
                          ? 'Sedang Diproses ⏳'
                          : isRejected
                          ? 'Ditolak / Dikembalikan ⛔'
                          : isSkipped
                          ? 'Dilewati'
                          : 'Menunggu Antrean'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span><strong>Penanggung Jawab:</strong> {cp.opdName}</span>
                    {cp.docNumber && (
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        <strong>No. Dokumen:</strong> {cp.docNumber}
                      </span>
                    )}
                    {cp.timestamp && (
                      <span><strong>Waktu:</strong> {new Date(cp.timestamp).toLocaleString('id-ID')}</span>
                    )}
                  </div>

                  {cp.notes && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {cp.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
