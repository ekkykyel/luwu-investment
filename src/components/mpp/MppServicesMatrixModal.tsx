import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Zap,
  Building2,
  HeartHandshake,
  BadgePercent,
  Layers,
  ArrowRight,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';

interface MppServicesMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRequirement?: (serviceName: string) => void;
  isDark?: boolean;
}

export const MppServicesMatrixModal: React.FC<MppServicesMatrixModalProps> = ({
  isOpen,
  onClose,
  onSelectRequirement,
  isDark = false,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Real Luwu MPP Public Services Catalog
  const allServices = useMemo(() => {
    if (isEn) {
      return [
        {
          id: 'ktp-el',
          title: 'e-KTP & Family Card Printing',
          category: 'dukcapil',
          agency: 'Luwu Population & Civil Registry Dept',
          loket: 'Counters 01 - 03',
          sla: '10 Mins',
          cost: 'IDR 0 (Free)',
          badge: 'Top Priority',
          badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          description: 'Re-printing damaged/lost e-KTP, issuing new Family Cards, and updating civil registration data.',
          requirements: ['Old KTP / Police Loss Report', 'Original Family Card', 'Form F1.01'],
          isSelfService: true,
          isDisabilityFriendly: true,
        },
        {
          id: 'nib-oss',
          title: 'NIB Business License (OSS-RBA)',
          category: 'perizinan',
          agency: 'Luwu Investment & Licensing Dept (DPMPTSP)',
          loket: 'Counters 04 - 06',
          sla: '15 Mins',
          cost: 'IDR 0 (Free)',
          badge: 'Investment',
          badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
          description: 'Issuance of Business Identification Number (NIB) for MSMEs & Low, Medium, High Risk Investors.',
          requirements: ['Manager KTP', 'Active Tax ID (NPWP)', 'Business Email & WhatsApp'],
          isSelfService: true,
          isDisabilityFriendly: true,
        },
        {
          id: 'pbb-p2',
          title: 'PBB-P2 Tax Payment & Mutation',
          category: 'perpajakan',
          agency: 'Bapenda Luwu & Bank Sulselbar',
          loket: 'Counters 07 - 08',
          sla: '8 Mins',
          cost: 'Per Tax Bill',
          badge: 'Revenue',
          badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          description: 'PBB-P2 tax bill printing, title mutation/split for land and building objects, and arrears consolidation.',
          requirements: ['Last Year PBB Bill', 'Land Title Copy / Proof', 'Applicant KTP'],
          isSelfService: true,
          isDisabilityFriendly: false,
        },
        {
          id: 'bpjs-kes',
          title: 'BPJS Healthcare Enrollment & Mutation',
          category: 'sosial',
          agency: 'BPJS Healthcare Luwu Branch',
          loket: 'Counters 09 - 10',
          sla: '12 Mins',
          cost: 'IDR 0 (Monthly Premium)',
          badge: 'Social Service',
          badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
          description: 'New participant registration for PBPU/Mandatory & Government PBI, first-level clinic changes, and card printing.',
          requirements: ['Original Family Card', 'All Family e-KTP', 'Bank Account Book'],
          isSelfService: false,
          isDisabilityFriendly: true,
        },
        {
          id: 'sim-skck',
          title: "Driver's License Renewal & Police Record (SKCK)",
          category: 'kepolisian',
          agency: 'Luwu Police & Samsat',
          loket: 'Counters 11 - 13',
          sla: '20 Mins',
          cost: 'Official PNBP Tariff',
          badge: 'Police Desk',
          badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
          description: "Renewal of Driver's License A & C, SKCK certificate issuance for job applications or education.",
          requirements: ['Old Driver License (Valid)', 'Original & Copy KTP', 'Health & Psych Test Letter'],
          isSelfService: false,
          isDisabilityFriendly: true,
        },
        {
          id: 'bpn-sertifikat',
          title: 'Land Services (PTSL & Title Check)',
          category: 'pertanahan',
          agency: 'National Land Agency (BPN) Luwu',
          loket: 'Counters 14 - 15',
          sla: '15 Mins',
          cost: 'BPN PNBP Tariff',
          badge: 'Land Office',
          badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
          description: 'Verification of land certificate validity, title transfer registration, and PTSL program consultation.',
          requirements: ['Original Land Certificate', 'Applicant KTP & NPWP', 'Paid PBB Bill'],
          isSelfService: false,
          isDisabilityFriendly: false,
        },
        {
          id: 'disabilitas-inklusif',
          title: 'Disability & Elderly Support',
          category: 'disabilitas',
          agency: 'MPP Inclusive Concierge Team',
          loket: 'Inclusive Counter 01',
          sla: '5 Mins Response',
          cost: 'IDR 0 (Free)',
          badge: 'Disability Friendly',
          badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          description: 'Automatic wheelchair provision, sign language interpretation for deaf citizens, and tactile guiding paths.',
          requirements: ['No special requirements', 'Simply report to front officer or priority queue'],
          isSelfService: false,
          isDisabilityFriendly: true,
        },
        {
          id: 'pdam-pasang',
          title: 'PDAM Water Connection & Bill Payment',
          category: 'bumd',
          agency: 'PDAM Tirta Luwu',
          loket: 'Counter 16',
          sla: '10 Mins',
          cost: 'Per Connection Rate',
          badge: 'Local State Owned',
          badgeColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
          description: 'New clean water household connection requests, monthly bill payment, and network complaints.',
          requirements: ['Applicant KTP', 'House Location Map', 'Active Phone Number'],
          isSelfService: true,
          isDisabilityFriendly: true,
        },
      ];
    }

    if (isZh) {
      return [
        {
          id: 'ktp-el',
          title: '电子身份证 (e-KTP) 与户口簿打印',
          category: 'dukcapil',
          agency: '鲁乌县民政局 (Disdukcapil)',
          loket: '01 - 03 号窗口',
          sla: '10 分钟',
          cost: '0 印尼盾 (免费)',
          badge: '核心优先',
          badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          description: '损坏/遗失补办身份证、新户口簿核发及户籍信息变更。',
          requirements: ['旧身份证 / 警察局遗失证明', '户口簿原件', 'F1.01 申请表'],
          isSelfService: true,
          isDisabilityFriendly: true,
        },
        {
          id: 'nib-oss',
          title: 'NIB 商业许可 (OSS-RBA)',
          category: 'perizinan',
          agency: '鲁乌县投资许可局 (DPMPTSP)',
          loket: '04 - 06 号窗口',
          sla: '15 分钟',
          cost: '0 印尼盾 (免费)',
          badge: '招商投资',
          badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
          description: '面向微中小企业及高中低风险投资者的企业统一商业登记证 (NIB) 核发。',
          requirements: ['负责人身份证', '有效税号 (NPWP)', '企业邮箱与 WhatsApp'],
          isSelfService: true,
          isDisabilityFriendly: true,
        },
        {
          id: 'pbb-p2',
          title: '房产税 (PBB-P2) 缴纳与变更',
          category: 'perpajakan',
          agency: '鲁乌县税务局与 Sulselbar 银行',
          loket: '07 - 08 号窗口',
          sla: '8 分钟',
          cost: '按税单金额',
          badge: '地方税收',
          badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          description: '房产税单打印、土地房屋产权人更名/分割及历史欠税清理。',
          requirements: ['上年度房产税单', '土地证复印件/产权证明', '申请人身份证'],
          isSelfService: true,
          isDisabilityFriendly: false,
        },
        {
          id: 'bpjs-kes',
          title: '国民医保 (BPJS) 新增与变更',
          category: 'sosial',
          agency: 'BPJS 医疗保险鲁乌分局',
          loket: '09 - 10 号窗口',
          sla: '12 分钟',
          cost: '0 印尼盾 (按月缴费)',
          badge: '社会保障',
          badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
          description: '自费与政府补贴医保参保登记、首诊医院变更及医保卡打印。',
          requirements: ['户口簿原件', '全家电子身份证件', '银行存折/账号'],
          isSelfService: false,
          isDisabilityFriendly: true,
        },
        {
          id: 'sim-skck',
          title: '驾照 (SIM) 期满换证与无犯罪记录 (SKCK)',
          category: 'kepolisian',
          agency: '鲁乌县警署 (Polres) 与 Samsat',
          loket: '11 - 13 号窗口',
          sla: '20 分钟',
          cost: '官方法定规费',
          badge: '警务服务',
          badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
          description: 'A/C 驾照期满换证、求职或求学无犯罪记录证明 (SKCK) 开具。',
          requirements: ['原驾驶证件', '身份证原件及复印件', '体检与心理测试证明'],
          isSelfService: false,
          isDisabilityFriendly: true,
        },
        {
          id: 'bpn-sertifikat',
          title: '土地产权服务 (PTSL 查册与确权)',
          category: 'pertanahan',
          agency: '鲁乌县国土资源局 (BPN)',
          loket: '14 - 15 号窗口',
          sla: '15 分钟',
          cost: '法定国土规费',
          badge: '国土房管',
          badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
          description: '土地证真伪查验、过户登记及系统确权 (PTSL) 政策咨询。',
          requirements: ['土地产权证原件', '申请人身份证与税号', '已完税房产税单'],
          isSelfService: false,
          isDisabilityFriendly: false,
        },
        {
          id: 'disabilitas-inklusif',
          title: '无障碍助残与长者专席',
          category: 'disabilitas',
          agency: '政务大厅无障碍礼宾服务队',
          loket: '无障碍绿色通道 01 窗口',
          sla: '5 分钟内响应',
          cost: '0 印尼盾 (免费)',
          badge: '无障碍友好',
          badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          description: '电动轮椅免费提供、手语翻译员全程协助及盲道无障碍导引。',
          requirements: ['无特殊门槛', '只需在入口处联系引导员即可'],
          isSelfService: false,
          isDisabilityFriendly: true,
        },
        {
          id: 'pdam-pasang',
          title: '自来水 (PDAM) 新装与水费缴纳',
          category: 'bumd',
          agency: '鲁乌县 Tirta 自来水公司',
          loket: '16 号窗口',
          sla: '10 分钟',
          cost: '按接驳标准',
          badge: '国企水务',
          badgeColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
          description: '居民自来水新报装申请、水费缴纳及管网报修投诉。',
          requirements: ['申请人身份证', '房屋位置示意图', '有效联系电话'],
          isSelfService: true,
          isDisabilityFriendly: true,
        },
      ];
    }

    return [
      {
        id: 'ktp-el',
        title: 'Pencetakan KTP-el & Kartu Keluarga',
        category: 'dukcapil',
        agency: 'Disdukcapil Kab. Luwu',
        loket: 'Loket 01 - 03',
        sla: '10 Menit',
        cost: 'Rp 0,- (Gratis)',
        badge: 'Prioritas Utama',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        description: 'Pencetakan ulang KTP-el rusak/hilang, penerbitan Kartu Keluarga baru, dan pembaruan data kependudukan.',
        requirements: ['KTP Lama / Surat Kehilangan Polres', 'Kartu Keluarga Asli', 'Formulir F1.01'],
        isSelfService: true,
        isDisabilityFriendly: true,
      },
      {
        id: 'nib-oss',
        title: 'Perizinan Berusaha NIB (OSS-RBA)',
        category: 'perizinan',
        agency: 'DPMPTSP Kab. Luwu',
        loket: 'Loket 04 - 06',
        sla: '15 Menit',
        cost: 'Rp 0,- (Gratis)',
        badge: 'Investasi',
        badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
        description: 'Penerbitan Nomor Induk Berusaha (NIB) untuk UMKM & Investor Usaha Risiko Rendah, Menengah, hingga Tinggi.',
        requirements: ['KTP Penanggung Jawab', 'NPWP Aktif', 'Email & Nomor WhatsApp Usaha'],
        isSelfService: true,
        isDisabilityFriendly: true,
      },
      {
        id: 'pbb-p2',
        title: 'Pembayaran & Mutasi PBB-P2',
        category: 'perpajakan',
        agency: 'Bapenda Kab. Luwu & Bank Sulselbar',
        loket: 'Loket 07 - 08',
        sla: '8 Menit',
        cost: 'Sesuai Tagihan PBB',
        badge: 'Pendapatan',
        badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        description: 'Cetak SPPT PBB-P2, pemecahan/mutasi nama objek pajak tanah dan bangunan, serta konsolidasi tunggakan.',
        requirements: ['SPPT PBB Tahun Lalu', 'FC Sertifikat Tanah / Bukti Kepemilikan', 'KTP Pemohon'],
        isSelfService: true,
        isDisabilityFriendly: false,
      },
      {
        id: 'bpjs-kes',
        title: 'Pendaftaran & Mutasi BPJS Kesehatan',
        category: 'sosial',
        agency: 'BPJS Kesehatan Cabang Luwu',
        loket: 'Loket 09 - 10',
        sla: '12 Menit',
        cost: 'Rp 0,- (Iuran Bulanan)',
        badge: 'Layanan Sosial',
        badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
        description: 'Pendaftaran peserta baru PBPU/Mandiri & PBI APBD Pemkab Luwu, perubahan faskes tingkat pertama, dan cetak kartu.',
        requirements: ['Kartu Keluarga Asli', 'KTP-el Seluruh Anggota Keluarga', 'Buku Rekening Bank'],
        isSelfService: false,
        isDisabilityFriendly: true,
      },
      {
        id: 'sim-skck',
        title: 'Perpanjangan SIM A/C & Penerbitan SKCK',
        category: 'kepolisian',
        agency: 'Polres Luwu & Samsat',
        loket: 'Loket 11 - 13',
        sla: '20 Menit',
        cost: 'Sesuai PNBP Resmi',
        badge: 'Kepolisian',
        badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
        description: 'Perpanjangan SIM A dan SIM C online/offline, penerbitan SKCK untuk melamar pekerjaan atau melanjutkan pendidikan.',
        requirements: ['SIM Lama (Masih Berlaku)', 'KTP Asli & FC', 'Surat Kesehatan & Psikologi'],
        isSelfService: false,
        isDisabilityFriendly: true,
      },
      {
        id: 'bpn-sertifikat',
        title: 'Layanan Pertanahan (PTSL & Pengecekan)',
        category: 'pertanahan',
        agency: 'Kantor Pertanahan (BPN) Kab. Luwu',
        loket: 'Loket 14 - 15',
        sla: '15 Menit',
        cost: 'Sesuai Tarif PNBP BPN',
        badge: 'Pertanahan',
        badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
        description: 'Pengecekan keabsahan sertifikat tanah, pendaftaran balik nama, dan konsultasi program PTSL.',
        requirements: ['Sertifikat Tanah Asli', 'KTP & NPWP Pemohon', 'SPPT PBB Lunas'],
        isSelfService: false,
        isDisabilityFriendly: false,
      },
      {
        id: 'disabilitas-inklusif',
        title: 'Pendampingan Khusus Disabilitas & Lansia',
        category: 'disabilitas',
        agency: 'Tim Konsierge Ramah Inklusif MPP',
        loket: 'Loket Prioritas Inklusif 01',
        sla: '5 Menit Respon',
        cost: 'Rp 0,- (Gratis)',
        badge: 'Ramah Disabilitas',
        badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        description: 'Penyediaan kursi roda otomatis, pendamping bahasa isyarat untuk warga tuli, dan jalur pemandu taktil.',
        requirements: ['Tidak ada persyaratan khusus', 'Cukup melapor ke Petugas Depan / Antrean Khusus'],
        isSelfService: false,
        isDisabilityFriendly: true,
      },
      {
        id: 'pdam-pasang',
        title: 'Pasang Baru & Pembayaran Tagihan PDAM',
        category: 'bumd',
        agency: 'PDAM Tirta Luwu',
        loket: 'Loket 16',
        sla: '10 Menit',
        cost: 'Sesuai Tarif Sambungan',
        badge: 'BUMD Luwu',
        badgeColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
        description: 'Permohonan sambungan baru air bersih rumah tangga, pembayaran tagihan bulanan, dan keluhan jaringan.',
        requirements: ['KTP Pemohon', 'Denah Lokasi Rumah', 'Nomor HP Aktif'],
        isSelfService: true,
        isDisabilityFriendly: true,
      },
    ];
  }, [isEn, isZh]);

  const categories = useMemo(() => [
    { id: 'all', label: t("mppPortal.matrixModal.catAll", "Semua Layanan (8)"), icon: Layers },
    { id: 'dukcapil', label: t("mppPortal.matrixModal.catDukcapil", "Kependudukan"), icon: FileText },
    { id: 'perizinan', label: t("mppPortal.matrixModal.catPerizinan", "Perizinan Usaha"), icon: Zap },
    { id: 'perpajakan', label: t("mppPortal.matrixModal.catPerpajakan", "Pajak & Bapenda"), icon: BadgePercent },
    { id: 'sosial', label: t("mppPortal.matrixModal.catSosial", "BPJS & Sosial"), icon: HeartHandshake },
    { id: 'kepolisian', label: t("mppPortal.matrixModal.catKepolisian", "Polres & SIM"), icon: ShieldCheck },
    { id: 'disabilitas', label: t("mppPortal.matrixModal.catDisabilitas", "Inklusif Disabilitas"), icon: Sparkles },
  ], [t]);

  const filteredServices = useMemo(() => {
    return allServices.filter((srv) => {
      // Category filter
      if (activeCategory !== 'all' && srv.category !== activeCategory) {
        return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        srv.title.toLowerCase().includes(q) ||
        srv.agency.toLowerCase().includes(q) ||
        srv.description.toLowerCase().includes(q) ||
        srv.loket.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-emerald-950/40'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar dengan Handle Drag Android */}
          <div className="relative pt-3 pb-4 px-5 sm:px-7 border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md">
            {/* Handle Drag Android */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Smart Service Finder 360°
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {t("mppPortal.matrixModal.standard", "Standar Pelayanan Publik Pemkab Luwu")}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight">
                    {t("mppPortal.matrixModal.title", "Katalog & Matriks Layanan Publik MPP")}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instant Search Box */}
            <div className="relative mt-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("mppPortal.matrixModal.searchPlaceholder", "Cari jenis layanan (contoh: KTP, NIB, PBB, SIM, BPJS, Paspor)...")}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs Carousel (Horizontal Scroll with Touch Snap) */}
          <div className="px-5 sm:px-7 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Main Content Grid */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-4">
            {filteredServices.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t("mppPortal.matrixModal.noServices", "Layanan tidak ditemukan untuk kata kunci")} "{searchQuery}"
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
                >
                  {t("mppPortal.matrixModal.resetFilter", "Reset Filter")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map((srv) => (
                  <motion.div
                    key={srv.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${srv.badgeColor}`}>
                          {srv.badge}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-500" />
                          {srv.loket}
                        </span>
                      </div>

                      {/* Title & Agency */}
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {srv.title}
                      </h3>
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                        {srv.agency}
                      </p>

                      {/* Short Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                        {srv.description}
                      </p>

                      {/* Key Requirements Checklist */}
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 mb-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          {t("mppPortal.matrixModal.shortReqs", "PERSYARATAN RINGKAS:")}
                        </span>
                        {srv.requirements.map((req, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" /> SLA: {srv.sla}
                        </span>
                        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                          {srv.cost}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onSelectRequirement) {
                            onSelectRequirement(srv.title);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <span>{t("mppPortal.matrixModal.checkReqBtn", "Cek Persyaratan")}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Bottom Footer */}
          <div className="p-4 px-5 sm:px-7 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" /> {t("mppPortal.matrixModal.footerTag", "Semua Layanan Bebas Pungli & Transparan")}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-extrabold transition-all cursor-pointer shadow-md"
            >
              {t("mppPortal.matrixModal.closeBtn", "Tutup Katalog")}
            </button>
          </div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
};
