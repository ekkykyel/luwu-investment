import React, { useState, useMemo } from 'react';
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
  category: string;
  agency: string;
  loket: string;
  officialCost: string;
  processingTime: string;
  documents: { id: string; name: string; required: boolean; templateName?: string }[];
  steps: string[];
}

export function SmartRequirementAssistant({ isDark = false }: { isDark?: boolean }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const serviceRequirements: ServiceRequirement[] = useMemo(() => {
    if (isEn) {
      return [
        {
          id: 'req-nib',
          title: 'NIB Business License Issuance (OSS-RBA)',
          category: 'Business Licensing',
          agency: 'Luwu Investment & Licensing Dept (DPMPTSP)',
          loket: 'Counters 04 - 06',
          officialCost: 'Free (IDR 0)',
          processingTime: '15 - 30 Mins (Instant Issue)',
          documents: [
            { id: 'doc-1', name: 'National Identity Number (Applicant KTP)', required: true },
            { id: 'doc-2', name: 'Valid Taxpayer Identification (NPWP)', required: true },
            { id: 'doc-3', name: 'Active WhatsApp Number & Email', required: true },
            { id: 'doc-4', name: 'Business Location Data & Coordinates', required: true },
            { id: 'doc-5', name: 'Notarial Deed & Legal Approval (For PT/CV/Coop)', required: false, templateName: 'Entity Deed Format.pdf' }
          ],
          steps: [
            'Register OSS account at E-Kiosk or with front office assistance',
            'Fill business data, KBLI activity classification, and capital scale',
            'Automated spatial zoning check (RDTR / PKKPR)',
            'Issuance of official barcode-stamped NIB document'
          ]
        },
        {
          id: 'req-pbg',
          title: 'Building Approval (PBG) & Function Certificate (SLF)',
          category: 'Building & Architecture',
          agency: 'PUPR Dept & Licensing Dept',
          loket: 'Counter 05',
          officialCost: 'Per Local Regulation (Online Simulation)',
          processingTime: '3 - 7 Working Days',
          documents: [
            { id: 'doc-pbg-1', name: 'Land Title Certificate (SHM / HGB)', required: true },
            { id: 'doc-pbg-2', name: 'Architectural & Structural Engineering Drawings', required: true },
            { id: 'doc-pbg-3', name: 'Building Owner KTP & NPWP', required: true },
            { id: 'doc-pbg-4', name: 'Statement of Environmental Order Compliance', required: true, templateName: 'PBG_Declaration.docx' },
            { id: 'doc-pbg-5', name: 'Environmental Document Study (SPPL / UKL-UPL)', required: false }
          ],
          steps: [
            'Registration via SIMBG portal & assistance at MPP PUPR desk',
            'Technical architectural document completeness verification',
            'Expert Team Professional (TPA) / Technical Assessor Hearing',
            'Issuance of official Building Approval Decree (PBG)'
          ]
        },
        {
          id: 'req-shm',
          title: 'Freehold Land Certificate Registration (BPN Luwu)',
          category: 'Land & Property',
          agency: 'National Land Agency (ATR/BPN)',
          loket: 'Counters 07 - 08',
          officialCost: 'Official Government Fee (PP No. 128/2015)',
          processingTime: '5 - 14 Working Days',
          documents: [
            { id: 'doc-shm-1', name: 'Stamped Application Form', required: true, templateName: 'BPN_Application_Form.pdf' },
            { id: 'doc-shm-2', name: 'Original Land Title Document (Girik / Letter C / Deed)', required: true },
            { id: 'doc-shm-3', name: 'Village / Sub-district Land History Certificate', required: true },
            { id: 'doc-shm-4', name: 'Land Owner KTP & Family Card', required: true },
            { id: 'doc-shm-5', name: 'Current Year Paid Property Tax (PBB) Bill', required: true }
          ],
          steps: [
            'Initial document completeness check at MPP BPN counter',
            'Land parcel measurement and mapping by cadastral officers',
            'Land examination by Committee A / Inspection Officer',
            'Issuance and delivery of Electronic Land Certificate'
          ]
        },
        {
          id: 'req-ktp',
          title: 'e-KTP Recording & Printing / Child Identity Card',
          category: 'Civil Registration',
          agency: 'Population & Civil Registry Dept',
          loket: 'Counters 01 - 03',
          officialCost: 'Free (IDR 0 No Illegal Fees)',
          processingTime: '15 - 20 Mins',
          documents: [
            { id: 'doc-ktp-1', name: 'Copy of Latest Family Card (KK)', required: true },
            { id: 'doc-ktp-2', name: 'Old e-KTP (If renewal or damaged)', required: false },
            { id: 'doc-ktp-3', name: 'Police Loss Certificate (If lost)', required: false },
            { id: 'doc-ktp-4', name: 'Birth Certificate (For Child Identity Card KIA)', required: false }
          ],
          steps: [
            'Take Civil Cluster queue number at E-Kiosk',
            'Verify biometric iris scan & fingerprint data at counter',
            'Instant e-KTP card printing on MPP print engine',
            'Physical e-KTP handover and Digital ID (IKD) activation'
          ]
        }
      ];
    }

    if (isZh) {
      return [
        {
          id: 'req-nib',
          title: 'NIB 商业登记证核发 (OSS-RBA)',
          category: '企业许可',
          agency: '鲁乌县投资许可局 (DPMPTSP)',
          loket: '04 - 06 号窗口',
          officialCost: '免费 (0 印尼盾)',
          processingTime: '15 - 30 分钟 (即时出证)',
          documents: [
            { id: 'doc-1', name: '申请人公民身份证号 (KTP)', required: true },
            { id: 'doc-2', name: '有效纳税人识别号 (NPWP)', required: true },
            { id: 'doc-3', name: '有效 WhatsApp 号码与邮箱', required: true },
            { id: 'doc-4', name: '经营场所地址与地理坐标', required: true },
            { id: 'doc-5', name: '公司章程公证书及司法部批复 (公司/合作社)', required: false, templateName: '法人章程模板.pdf' }
          ],
          steps: [
            '在自助终端或窗口人员协助下注册 OSS 账号',
            '填写企业信息、行业分类 (KBLI) 及资本规模',
            '系统自动核对国土空间规划 (RDTR / PKKPR)',
            '核发带电子签名与二维码的官方 NIB 证书'
          ]
        },
        {
          id: 'req-pbg',
          title: '建筑物批准书 (PBG) 与合格证 (SLF)',
          category: '工程建设',
          agency: '公共工程局 (PUPR) 与许可局',
          loket: '05 号窗口',
          officialCost: '按地方规费标准 (在线模拟)',
          processingTime: '3 - 7 个工作日',
          documents: [
            { id: 'doc-pbg-1', name: '土地产权证明 (SHM / HGB)', required: true },
            { id: 'doc-pbg-2', name: '建筑与结构工程设计图纸', required: true },
            { id: 'doc-pbg-3', name: '业主身份证与税号 (KTP & NPWP)', required: true },
            { id: 'doc-pbg-4', name: '维护环境秩序承诺书', required: true, templateName: 'PBG_申请承诺书.docx' },
            { id: 'doc-pbg-5', name: '环境评估文件 (SPPL / UKL-UPL)', required: false }
          ],
          steps: [
            '通过 SIMBG 门户网站申报并在政务大厅窗口复核',
            '工程建筑技术图纸完整性审查',
            '专家委员会 (TPA) / 技术评估小组评审',
            '核发官方建筑物批准书 (PBG) 批复'
          ]
        },
        {
          id: 'req-shm',
          title: '私有土地产权证 (SHM) 登记',
          category: '不动产/土地',
          agency: '鲁乌县国土资源局 (ATR/BPN)',
          loket: '07 - 08 号窗口',
          officialCost: '国家法定规费 (PP No. 128/2015)',
          processingTime: '5 - 14 个工作日',
          documents: [
            { id: 'doc-shm-1', name: '已贴印花税的申请表', required: true, templateName: '国土局申请表.pdf' },
            { id: 'doc-shm-2', name: '土地原始权属证明 (地契/买卖契约)', required: true },
            { id: 'doc-shm-3', name: '村委/镇公所出具的土地沿革证明', required: true },
            { id: 'doc-shm-4', name: '土地所有人身份证与户口簿', required: true },
            { id: 'doc-shm-5', name: '当年度房产税 (PBB) 完税凭证', required: true }
          ],
          steps: [
            '在政务大厅国土窗口进行初审与材料核对',
            '测绘人员现场进行土地界址测量与地籍绘图',
            '检查委员会 (Panitia A) 现场现场勘验',
            '核发并颁发电子土地产权证书'
          ]
        },
        {
          id: 'req-ktp',
          title: '电子身份证 (e-KTP) 采集打印/儿童身份证',
          category: '户籍民政',
          agency: '民政与人口登记局 (Disdukcapil)',
          loket: '01 - 03 号窗口',
          sla: '15 - 20 分钟',
          officialCost: '免费 (0 印尼盾 无乱收费)',
          processingTime: '15 - 20 分钟',
          documents: [
            { id: 'doc-ktp-1', name: '最新户口簿 (KK) 复印件', required: true },
            { id: 'doc-ktp-2', name: '旧身份证 (若换领或损坏)', required: false },
            { id: 'doc-ktp-3', name: '派出所报案证明 (若遗失)', required: false },
            { id: 'doc-ktp-4', name: '出生医学证明 (办理儿童身份证 KIA)', required: false }
          ],
          steps: [
            '在自助机抽取民政业务排号',
            '窗口进行虹膜与指纹生物识别信息采集',
            '大厅现场制卡机即时打印 e-KTP 实体卡',
            '领取身份证并现场激活数字身份 (IKD)'
          ]
        }
      ];
    }

    return [
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
  }, [isEn, isZh]);

  const [selectedReqId, setSelectedReqId] = useState<string>('req-nib');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const selectedReq = useMemo(() => {
    return serviceRequirements.find(r => r.id === selectedReqId) || serviceRequirements[0];
  }, [serviceRequirements, selectedReqId]);

  const toggleDocCheck = (docId: string) => {
    setCheckedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const filteredRequirements = serviceRequirements.filter(r => 
    r.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.agency.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const totalDocs = selectedReq.documents.length;
  const readyDocs = selectedReq.documents.filter(d => checkedDocs[d.id]).length;

  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    const query = aiQuestion.trim();
    if (!query) {
      window.dispatchEvent(new CustomEvent('open-mpp-ai-modal', { detail: `Syarat dan alur layanan ${selectedReq.title}` }));
      return;
    }
    
    // Open full interactive Asisten Digital Ta' modal with the user's question
    window.dispatchEvent(new CustomEvent('open-mpp-ai-modal', { detail: query }));
    setAiQuestion('');
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
              onClick={() => setSelectedReqId(req.id)}
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
          <div className={`p-5 rounded-3xl border shadow-xl space-y-3 transition-all ${
            isDark 
              ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-emerald-500/30 text-white' 
              : 'bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30 border-emerald-200 text-slate-900 shadow-emerald-500/5'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-xs font-bold font-sans ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <Bot className="w-4 h-4 text-emerald-500" />
                <span>Asisten Digital Ta'</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  24/7 AI
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-mpp-ai-modal', { detail: `Halo Asisten Digital Ta', saya ingin berkonsultasi mengenai syarat ${selectedReq.title}` }))}
                className="text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Konsultasi Langsung</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>

            <form onSubmit={handleAskAi} className="relative">
              <input 
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={t("mppPortal.smartRequirement.aiPlaceholder", "Tanyakan syarat khusus (contoh: Apakah syarat NIB untuk usaha resto butuh izin edar?)...")}
                className={`w-full pr-10 pl-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-inner'
                }`}
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
                <div className="text-[11px] text-emerald-600 dark:text-emerald-300 flex items-center gap-2 animate-pulse font-medium">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("mppPortal.smartRequirement.askingAi", "Menganalisis Syarat...")}</span>
                </div>
              )}
              {aiAnswer && !isAiLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    isDark
                      ? 'bg-slate-800/80 border-emerald-500/30 text-slate-200'
                      : 'bg-emerald-50/90 border-emerald-200 text-slate-800 font-medium'
                  }`}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t("mppPortal.smartRequirement.requiredDocsTitle", "DAFTAR DOKUMEN YANG WAJIB DISIAPKAN:")}</span>
              </h4>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono shrink-0">
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
                    className={`min-h-[48px] p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.98] ${
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
                            <Download className="w-3 h-3 shrink-0" /> {t("mppPortal.smartRequirement.downloadTemplate", "Unduh Draf Formulir / Template")} ({doc.templateName})
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 font-sans ${
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

