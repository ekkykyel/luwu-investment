import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Search, FileText, CheckCircle2, Clock, AlertCircle, 
  ArrowRight, ShieldCheck, Download, Printer, User, Building2, 
  Sparkles, QrCode, BadgeCheck, FileCheck, Copy, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface TrackingRecord {
  regNumber: string;
  applicantName: string;
  serviceType: string;
  agency: string;
  submittedAt: string;
  estimatedCompletion: string;
  currentStep: number; // 1 to 5
  statusText: string;
  isCompleted: boolean;
  tteSigned: boolean;
  notes: string;
}

export function SmartDocumentTracker({ isDark = false }: { isDark?: boolean }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<TrackingRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { 
      num: 1, 
      title: isEn ? 'Application Submission' : isZh ? '提交申请材料' : 'Pengajuan Berkas', 
      desc: isEn ? 'Registration & upload of requirements' : isZh ? '在线登记并上传所需前置文件' : 'Pendaftaran & unggah syarat' 
    },
    { 
      num: 2, 
      title: isEn ? 'Document Verification' : isZh ? '资料合规审查' : 'Verifikasi Dokumen', 
      desc: isEn ? 'Completeness & validity examination' : isZh ? '审核前置材料的完整性与有效性' : 'Pemeriksaan kelengkapan berkas' 
    },
    { 
      num: 3, 
      title: isEn ? 'Technical Review' : isZh ? '技术评估与核验' : 'Kajian Teknis', 
      desc: isEn ? 'Field inspection / OPD technical validation' : isZh ? '现场勘察或部门联合技术评估' : 'Validasi lapangan / OPD teknis' 
    },
    { 
      num: 4, 
      title: isEn ? 'Electronic Signature (TTE)' : isZh ? '电子公文签章 (TTE)' : 'Tanda Tangan Elektronik', 
      desc: isEn ? 'BSrE Certified Digital Signature' : isZh ? 'BSrE 国家权威认证电子印章' : 'TTE BSrE Kepala Dinas' 
    },
    { 
      num: 5, 
      title: isEn ? 'Document Issued' : isZh ? '证照正式颁发' : 'Dokumen Terbit', 
      desc: isEn ? 'Ready to download or collect at MPP' : isZh ? '可在线下载或到大厅领取纸质件' : 'Siap diunduh / diambil di MPP' 
    }
  ];

  const fetchTracking = async (query: string) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const qClean = query.trim().toUpperCase();

      // Cek apakah pencarian merujuk ke Berita Acara PKKPR PUPTR / Pemohon Ermon Ambing
      if (
        qClean.includes('120') || 
        qClean.includes('FPR') || 
        qClean.includes('PKKPR') || 
        qClean.includes('ERMON') || 
        qClean.includes('PONGSAMELUNG') || 
        qClean.includes('LAMASI') || 
        qClean.includes('GEREJA')
      ) {
        setSearchResult({
          regNumber: '120/BA-FPR/NB/IX/2026',
          applicantName: 'ERMON AMBING',
          serviceType: 'Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Non Berusaha',
          agency: 'Dinas Pekerjaan Umum & Tata Ruang / DPMPTSP',
          submittedAt: '08 September 2026',
          estimatedCompletion: '08 September 2026',
          currentStep: 4,
          statusText: 'Rekomendasi Teknis FPR Selesai (TTE Kepala Dinas)',
          isCompleted: true,
          tteSigned: true,
          notes: 'Rekomendasi Forum Penataan Ruang disetujui (KDB Max 60-80%, GSB Min 7m, SHM No. 488). Berita Acara resmi telah ditransmisikan ke DPMPTSP sebagai landasan cetak izin PKKPR final.'
        });
        setIsLoading(false);
        return;
      }

      let { data, error } = await supabase
        .from('mpp_document_tracking')
        .select(`
          *,
          queue:mpp_queues(
            *,
            citizen:mpp_citizens(*),
            service:mpp_services(*),
            tenant:mpp_tenants(*)
          )
        `)
        .eq('tracking_code', query)
        .maybeSingle();
        
      if (!data) {
        // Coba cari berdasarkan ticket_code pada mpp_queues
        const { data: queueData, error: qErr } = await supabase
          .from('mpp_queues')
          .select(`
            id,
            ticket_code,
            status,
            created_at,
            citizen:mpp_citizens(*),
            service:mpp_services(*),
            tenant:mpp_tenants(*),
            tracking:mpp_document_tracking(*)
          `)
          .ilike('ticket_code', query)
          .maybeSingle();

        if (queueData) {
          const trkList = Array.isArray(queueData.tracking) ? queueData.tracking : [];
          const firstTrk = trkList.length > 0 ? trkList[0] : null;
          data = {
            id: firstTrk?.id || queueData.id,
            tracking_code: firstTrk?.tracking_code || queueData.ticket_code,
            current_status: firstTrk?.current_status || (
              queueData.status === 'selesai' ? (isEn ? 'Completed at Counter' : isZh ? '窗口业务办理完成' : 'Selesai Dilayani di Loket') :
              queueData.status === 'dipanggil' ? (isEn ? 'Called to Counter' : isZh ? '已叫号待办理' : 'Dipanggil di Loket Pelayanan') :
              queueData.status === 'dilayani' ? (isEn ? 'Being Served' : isZh ? '正在窗口办理中' : 'Sedang Dilayani di Loket') :
              (isEn ? 'Waiting in Queue' : isZh ? '排队等候中' : 'Menunggu Antrean Loket')
            ),
            created_at: firstTrk?.created_at || queueData.created_at,
            queue: queueData
          };
        }
      }

      if (!data) {
        setSearchResult(null);
        return;
      }

      // Map DB schema to TrackingRecord UI schema
      const q = data.queue || {};
      const serviceName = q.service?.service_name || (isEn ? 'Integrated Public Service' : isZh ? '综合政务服务' : 'Pelayanan Terpadu');
      const agencyName = q.tenant?.name || 'MPP Luwu';
      const citizenName = q.citizen?.full_name || (isEn ? 'Applicant' : isZh ? '申请人' : 'Pemohon MPP');
      
      let step = 1;
      let statusText = data.current_status || (isEn ? 'Application Received' : isZh ? '材料已接收' : 'Berkas Diterima');
      let isCompleted = false;
      let tteSigned = false;

      if (statusText.toLowerCase().includes('selesai') || statusText.toLowerCase().includes('terbit') || statusText.toLowerCase().includes('complet')) {
        step = 5;
        isCompleted = true;
        tteSigned = true;
      } else if (statusText.toLowerCase().includes('tte') || statusText.toLowerCase().includes('tanda tangan') || statusText.toLowerCase().includes('sign')) {
        step = 4;
      } else if (statusText.toLowerCase().includes('teknis') || statusText.toLowerCase().includes('kajian') || statusText.toLowerCase().includes('review')) {
        step = 3;
      } else if (statusText.toLowerCase().includes('verifikasi') || statusText.toLowerCase().includes('verif')) {
        step = 2;
      }

      setSearchResult({
        regNumber: data.tracking_code,
        applicantName: citizenName,
        serviceType: serviceName,
        agency: agencyName,
        submittedAt: new Date(data.created_at).toLocaleString(isEn ? 'en-US' : isZh ? 'zh-CN' : 'id-ID', { timeZone: 'Asia/Makassar' }) + ' WITA',
        estimatedCompletion: isEn ? 'In progress' : isZh ? '正常办理中' : 'Sedang dalam proses',
        currentStep: step,
        statusText: statusText,
        isCompleted: isCompleted,
        tteSigned: tteSigned,
        notes: data.notes || (isEn ? 'Document is currently being processed by the verification team.' : isZh ? '文件正由各窗口审核人员依法依规办理中。' : 'Dokumen sedang diproses oleh petugas verifikator.')
      });

    } catch (err) {
      console.error('Error fetching tracking:', err);
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryTrim = searchQuery.trim().toUpperCase();
    if (!queryTrim) return;
    fetchTracking(queryTrim);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      {/* Search Header Bar */}
      <div className={`p-6 sm:p-8 rounded-3xl border mb-6 transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-emerald-500/20 shadow-xl shadow-black/40' 
          : 'bg-white border-slate-200/90 shadow-xl shadow-slate-200/50'
      }`}>
        <div className="max-w-3xl mx-auto text-center space-y-2.5 mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-xs font-bold font-mono">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>{isEn ? 'INTEGRATED DOCUMENT & PERMIT TRACKER' : isZh ? '综合政务与行政审批全程追踪' : 'PELACAK DOKUMEN & PERIZINAN TERPADU'}</span>
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight font-sans text-slate-900 dark:text-white leading-snug">
            {isEn ? 'Smart Document & Permit Waybill Tracker' : isZh ? '智能政务审批进度与单据在线查询' : 'Smart Document & Permit Waybill Tracker'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto font-normal">
            {isEn ? 'Track business licensing, civil registry, land certificates, or building permits transparently in real-time.' : isZh ? '实时透明追踪企业营业许可、户籍户政、土地确权及建筑许可审批进展。' : 'Lacak progres berkas permohonan izin usaha, kependudukan, sertifikat tanah, atau PBG secara transparan secara real-time.'}
          </p>
        </div>

        {/* Search Input with 44px+ touch targets and responsive layout */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? "e.g., TRK-123456" : isZh ? "输入单号 (例: TRK-123456)" : "Masukkan Nomor Resi (Contoh: TRK-123456)"}
              className={`w-full pl-10 pr-4 py-3 min-h-[48px] rounded-2xl border text-xs sm:text-sm font-semibold outline-none transition-all font-sans ${
                isDark 
                  ? 'bg-slate-800/80 border-slate-700 focus:border-emerald-500 text-white placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>{isEn ? 'Track' : isZh ? '查询' : 'Lacak'}</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* Tracking Format Helper & Quick Demo Chips */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mt-3.5 sm:mt-4 text-[11px] sm:text-xs text-slate-500">
          <span>{isEn ? 'Format / Sample:' : isZh ? '单号格式 / 示例:' : 'Format / Contoh Pencarian:'}</span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('120/BA-FPR/NB/IX/2026');
              fetchTracking('120/BA-FPR/NB/IX/2026');
            }}
            className="px-2.5 py-0.5 rounded-lg border font-mono font-bold text-[10px] sm:text-[11px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            <span>120/BA-FPR/NB/IX/2026 (PKKPR Gereja Lamasi)</span>
          </button>
          <span className="px-2 py-0.5 rounded-md border font-mono font-bold text-[10px] sm:text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700">
            TRK-XXXXXXXX
          </span>
          <span className="text-slate-400 text-[10px] sm:text-[11px]">{isEn ? '(On your ticket receipt)' : isZh ? '(见排队小票)' : '(Tercetak pada struk tiket antrean)'}</span>
        </div>
      </div>

      {/* TRACKING RESULT CARD */}
      <AnimatePresence mode="wait">
        {hasSearched && !searchResult && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`p-8 rounded-3xl border text-center ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}
          >
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{isEn ? 'Tracking Record Not Found' : isZh ? '未查询到相关单据信息' : 'Data Tidak Ditemukan'}</h4>
            <p className="text-sm text-slate-500 mt-1">{isEn ? 'Please verify that your E-Tracking or Queue code is entered correctly.' : isZh ? '请仔细核对您输入的查询代码或排队小票编号。' : 'Pastikan kode E-Lacak yang Anda masukkan sudah benar.'}</p>
          </motion.div>
        )}

        {searchResult && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 sm:p-8 rounded-3xl border ${
              isDark 
                ? 'bg-slate-900/90 border-emerald-500/20 shadow-xl' 
                : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
            }`}
          >
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    {searchResult.regNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(searchResult.regNumber)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    title={isEn ? "Copy Registration Number" : isZh ? "复制编号" : "Salin Nomor Registrasi"}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copied && <span className="text-[10px] text-emerald-500 font-bold">{isEn ? 'Copied!' : isZh ? '已复制！' : 'Tersalin!'}</span>}
                </div>
                <h4 className="text-base sm:text-lg font-bold font-sans text-slate-900 dark:text-white">
                  {searchResult.serviceType}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEn ? 'Applicant:' : isZh ? '申请人:' : 'Pemohon:'} <strong>{searchResult.applicantName}</strong> • {isEn ? 'Agency:' : isZh ? '经办单位:' : 'Instansi:'} <strong>{searchResult.agency}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {searchResult.tteSigned && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    <BadgeCheck className="w-4 h-4 text-emerald-500" />
                    <span>{isEn ? 'BSrE Certified TTE' : isZh ? 'BSrE 电子签章已认证' : 'TTE BSrE Terverifikasi'}</span>
                  </div>
                )}
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  searchResult.isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {searchResult.statusText}
                </span>
              </div>
            </div>

            {/* Stepper Timeline Visual */}
            <div className="py-8">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                {steps.map((step) => {
                  const isPassed = step.num <= searchResult.currentStep;
                  const isCurrent = step.num === searchResult.currentStep;

                  return (
                    <div key={step.num} className="flex flex-col items-center text-center relative z-10">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-sm mb-2 transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : isDark
                            ? 'bg-slate-800 text-slate-500 border border-slate-700'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                      </div>

                      <h5 className={`text-xs font-bold ${
                        isCurrent 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : isPassed ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                      }`}>
                        {step.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Card Notes & Actions */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white block mb-0.5">{isEn ? 'Official Officer Notes:' : isZh ? '办理人员工作备注:' : 'Catatan Petugas Verifikator:'}</strong>
                {searchResult.notes}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                {(searchResult.regNumber.includes('FPR') || searchResult.serviceType.includes('PKKPR') || searchResult.agency.includes('PUPTR')) && (
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-pkkpr-recommendation'));
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Buka BA Rekomendasi PUPTR (4 Hal)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Print Status' : isZh ? '打印办理凭证' : 'Cetak Status'}</span>
                </button>

                {searchResult.isCompleted && (
                  <button
                    type="button"
                    onClick={() => alert(`Mengunduh dokumen digital resmi: ${searchResult.regNumber}.pdf`)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Download Digital Certificate' : isZh ? '下载电子审批公文' : 'Unduh Dokumen SK Digital'}</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
