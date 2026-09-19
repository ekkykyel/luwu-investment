import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  CheckSquare, Square, FileText, Search, Sparkles, 
  Download, Clock, DollarSign, Building2, CheckCircle2, 
  Bot, Send, HelpCircle, ArrowUpRight, ShieldCheck
} from 'lucide-react';

export interface ServiceRequirement {
  id: string;
  title: string;
  category: 'Perizinan Usaha' | 'Kependudukan' | 'Pertanahan' | 'Bangunan' | 'Kesehatan' | 'Perpajakan';
  agency: string;
  loket: string;
  officialCost: string;
  processingTime: string;
  documents: { id: string; name: string; required: boolean; templateName?: string }[];
  steps: string[];
}

const SERVICE_REQUIREMENTS: ServiceRequirement[] = [
  {
    id: 'req-nib',
    title: 'Penerbitan Nomor Induk Berusaha (NIB) OSS-RBA',
    category: 'Perizinan Usaha',
    agency: 'DPMPTSP Kab. Luwu',
    loket: 'Loket 04 - 06',
    officialCost: 'Gratis (Rp 0)',
    processingTime: '15 - 30 Menit (Langsung Terbit)',
    documents: [
      { id: 'doc-1', name: 'Nomor Induk Kependudukan (KTP Pemohon)', required: true },
      { id: 'doc-2', name: 'Nomor Pokok Wajib Pajak (NPWP Valid)', required: true },
      { id: 'doc-3', name: 'Nomor WhatsApp & Email Aktif', required: true },
      { id: 'doc-4', name: 'Data Lokasi Usaha & Titik Koordinat', required: true },
      { id: 'doc-5', name: 'Akta Notaris & SK Kemenkumham (Khusus PT/CV/Koperasi)', required: false, templateName: 'Format Akta Badan.pdf' }
    ],
    steps: [
      'Registrasi akun OSS di E-Kiosk Mandiri atau didampingi petugas front office',
      'Pengisian data usaha, Klasifikasi Baku Lapangan Usaha (KBLI), dan skala modal',
      'Pengecekan otomatis kesesuaian tata ruang (RDTR / PKKPR)',
      'Penerbitan dokumen NIB ber-barcode dan TTE resmi'
    ]
  },
  {
    id: 'req-pbg',
    title: 'Persetujuan Bangunan Gedung (PBG) & SLF',
    category: 'Bangunan',
    agency: 'Dinas PUPR & DPMPTSP',
    loket: 'Loket 05',
    officialCost: 'Sesuai Retribusi Daerah (Simulasi Online)',
    processingTime: '3 - 7 Hari Kerja',
    documents: [
      { id: 'doc-pbg-1', name: 'Bukti Kepemilikan Hak Atas Tanah (SHM / HGB)', required: true },
      { id: 'doc-pbg-2', name: 'Gambar Rencana Arsitektur & Struktur Gedung', required: true },
      { id: 'doc-pbg-3', name: 'KTP & NPWP Pemilik Bangunan', required: true },
      { id: 'doc-pbg-4', name: 'Surat Kesanggupan Menjaga Ketertiban Lingkungan', required: true, templateName: 'Surat_Pernyataan_PBG.docx' },
      { id: 'doc-pbg-5', name: 'Kajian Dokumen Lingkungan (SPPL / UKL-UPL)', required: false }
    ],
    steps: [
      'Pendaftaran melalui portal SIMBG dan asistensi loket PUPR MPP',
      'Verifikasi kelengkapan dokumen teknis arsitektur',
      'Sidang Tim Profesi Ahli (TPA) / Tim Penilai Teknis',
      'Penerbitan SK Persetujuan Bangunan Gedung (PBG)'
    ]
  },
  {
    id: 'req-shm',
    title: 'Pendaftaran Sertifikat Hak Milik (BPN Luwu)',
    category: 'Pertanahan',
    agency: 'Kantor Pertanahan (ATR/BPN)',
    loket: 'Loket 07 - 08',
    officialCost: 'Tarif Resmi PNBP PP No. 128/2015',
    processingTime: '5 - 14 Hari Kerja',
    documents: [
      { id: 'doc-shm-1', name: 'Surat Permohonan Bermaterai Cukup', required: true, templateName: 'Formulir_Permohonan_BPN.pdf' },
      { id: 'doc-shm-2', name: 'Alas Hak Tanah Asli (Girik / Letter C / Akta Jual Beli)', required: true },
      { id: 'doc-shm-3', name: 'Surat Keterangan Riwayat Tanah dari Desa/Kelurahan', required: true },
      { id: 'doc-shm-4', name: 'KTP & Kartu Keluarga Pemilik Lahan', required: true },
      { id: 'doc-shm-5', name: 'Bukti Pembayaran PBB Tahun Berjalan', required: true }
    ],
    steps: [
      'Pemeriksaan awal kelengkapan dokumen di Loket BPN MPP',
      'Pengukuran dan pemetaan bidang tanah oleh petugas kadastral',
      'Pemeriksaan tanah oleh Panitia A / Petugas Konstatasi',
      'Penerbitan dan penyerahan Sertifikat Tanah Elektronik'
    ]
  },
  {
    id: 'req-ktp',
    title: 'Perekaman & Cetak KTP-el / Kartu Identitas Anak',
    category: 'Kependudukan',
    agency: 'Dinas Kependudukan & Catatan Sipil',
    loket: 'Loket 01 - 03',
    officialCost: 'Gratis (Rp 0 Tanpa Pungli)',
    processingTime: '15 - 20 Menit',
    documents: [
      { id: 'doc-ktp-1', name: 'Fotokopi Kartu Keluarga (KK) Terbaru', required: true },
      { id: 'doc-ktp-2', name: 'KTP-el Lama (Jika perpanjangan/rusak)', required: false },
      { id: 'doc-ktp-3', name: 'Surat Keterangan Kehilangan Polsek (Jika hilang)', required: false },
      { id: 'doc-ktp-4', name: 'Akta Kelahiran (Untuk pembuatan KIA anak)', required: false }
    ],
    steps: [
      'Ambil nomor antrean klaster Kependudukan di E-Kiosk',
      'Verifikasi data biometrik iris mata & sidik jari di loket',
      'Proses pencetakan blanko KTP-el instan di mesin cetak MPP',
      'Penyerahan fisik KTP-el dan aktivasi IKD (Identitas Kependudukan Digital)'
    ]
  }
];

export function SmartRequirementAssistant({ isDark = false }: { isDark?: boolean }) {
  const { t } = useTranslation();
  const [selectedReq, setSelectedReq] = useState<ServiceRequirement>(SERVICE_REQUIREMENTS[0]);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const toggleDocCheck = (docId: string) => {
    setCheckedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const filteredRequirements = SERVICE_REQUIREMENTS.filter(r => 
    r.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.agency.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const totalDocs = selectedReq.documents.length;
  const readyDocs = selectedReq.documents.filter(d => checkedDocs[d.id]).length;
  const isAllReady = readyDocs === totalDocs;

  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setIsAiLoading(true);
    setTimeout(() => {
      setAiAnswer(`Berdasarkan regulasi resmi dan standar operasional pelayanan ${selectedReq.agency}, permohonan "${selectedReq.title}" diproses secara transparan. ${aiQuestion.includes('biaya') ? 'Seluruh biaya resmi sesuai perda tanpa retribusi liar.' : 'Pastikan dokumen fisik dibawa saat verifikasi di ' + selectedReq.loket + '.'}`);
      setIsAiLoading(false);
    }, 1200);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-medium tracking-tight font-sans text-slate-900 dark:text-white">
              {t("mppPortal.smartRequirement.title", "Smart Requirement Assistant & Checklist")}
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans">
              {t("mppPortal.smartRequirement.badge", "ASISTEN SYARAT")}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("mppPortal.smartRequirement.subtitle", "Cek kelengkapan berkas dokumen, estimasi biaya resmi, dan lama pengerjaan layanan perizinan & kependudukan")}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t("mppPortal.smartRequirement.searchPlaceholder", "Cari jenis layanan (contoh: NIB, PBG, e-KTP, Sertifikat)...")}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Service Selection Filter Pills */}
      <div className="flex overflow-x-auto flex-nowrap snap-x snap-mandatory gap-2 pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden touch-pan-x">
        {filteredRequirements.map((req) => {
          const isSelected = selectedReq.id === req.id;
          return (
            <button
              key={req.id}
              type="button"
              onClick={() => setSelectedReq(req)}
              className={`min-h-[44px] px-5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer snap-start ${
                isSelected 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105' 
                  : isDark 
                    ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{req.title}</span>
            </button>
          );
        })}
      </div>

      {/* Requirement Inspector & Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Summary Info & SLA Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-['Plus_Jakarta_Sans',sans-serif]">
                {selectedReq.category}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">
                {selectedReq.loket}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-white leading-snug">
              {selectedReq.title}
            </h3>

            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium font-['Plus_Jakarta_Sans',sans-serif]">
                  <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                  {t("mppPortal.smartRequirement.officialCost", "Estimasi Biaya Resmi:")}
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-['Plus_Jakarta_Sans',sans-serif] text-sm">
                  {selectedReq.officialCost}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium font-['Plus_Jakarta_Sans',sans-serif]">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                  {t("mppPortal.smartRequirement.processingSla", "Estimasi Waktu (SLA):")}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm">
                  {selectedReq.processingTime}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium font-['Plus_Jakarta_Sans',sans-serif]">
                  <Building2 className="w-4 h-4 text-teal-500 shrink-0" />
                  {t("mppPortal.smartRequirement.responsibleAgency", "Instansi Penanggung Jawab:")}
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm">
                  {selectedReq.agency}
                </span>
              </div>
            </div>
          </div>

          {/* AI Requirement Assistant Mini Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-sans">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>{t("mppPortal.smartRequirement.aiAssistantTitle", "Tanya AI Asisten Syarat Layanan")}</span>
              </div>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>

            <form onSubmit={handleAskAi} className="relative">
              <input 
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={t("mppPortal.smartRequirement.aiPlaceholder", "Tanyakan syarat khusus (contoh: Apakah syarat NIB untuk usaha resto butuh izin edar?)...")}
                className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isAiLoading}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <AnimatePresence>
              {isAiLoading && (
                <div className="text-[11px] text-emerald-300 flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("mppPortal.smartRequirement.askingAi", "Menganalisis Syarat...")}</span>
                </div>
              )}
              {aiAnswer && !isAiLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-xs text-slate-200 leading-relaxed"
                >
                  {aiAnswer}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Document Checklist & Step-by-Step Procedure (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
          }`}>
            {/* Progress Bar Header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>{t("mppPortal.smartRequirement.requiredDocsTitle", "DAFTAR DOKUMEN YANG WAJIB DISIAPKAN:")}</span>
              </h4>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {t("mppPortal.smartRequirement.docsReadiness", { ready: readyDocs, total: totalDocs, defaultValue: `Kesiapan Dokumen Anda (${readyDocs}/${totalDocs})` })}
              </span>
            </div>

            {/* Document Checklist Items */}
            <div className="space-y-2.5 my-4">
              {selectedReq.documents.map((doc) => {
                const isChecked = checkedDocs[doc.id] || false;
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocCheck(doc.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200' 
                        : isDark 
                          ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-200' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-semibold leading-snug block">
                          {doc.name}
                        </span>
                        {doc.templateName && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                            <Download className="w-3 h-3" /> {t("mppPortal.smartRequirement.downloadTemplate", "Unduh Draf Formulir / Template")} ({doc.templateName})
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                      doc.required 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    }`}>
                      {doc.required ? t("mppPortal.smartRequirement.requiredBadge", "WAJIB") : t("mppPortal.smartRequirement.optionalBadge", "OPSIONAL")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Service Procedure Steps */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans mb-3">
                {t("mppPortal.smartRequirement.stepsTitle", "TAHAPAN PROSEDUR PELAYANAN:")}
              </h4>
              <div className="space-y-2">
                {selectedReq.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
