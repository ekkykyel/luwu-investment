import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  HardHat,
  Building2,
  MapPin,
  FileText,
  Zap,
  BadgePercent,
  ShieldCheck,
  HeartHandshake,
  Layers,
  Globe,
  Calculator,
  Droplets,
  Sparkles,
  X,
  Clock,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  ArrowRight,
  LayoutGrid,
  SquareSquare
} from 'lucide-react';

export interface WorkflowItem {
  id: string;
  category: string;
  icon: any;
  title: string;
  title_en: string;
  title_zh: string;
  agency: string;
  agency_en: string;
  agency_zh: string;
  desc: string;
  desc_en: string;
  desc_zh: string;
  loket: string;
  sla: string;
  sla_en: string;
  sla_zh: string;
  badge: string;
  badge_en: string;
  badge_zh: string;
  portalUrl?: string;
  steps: {
    no: number;
    title: string;
    title_en: string;
    title_zh: string;
    desc: string;
    desc_en: string;
    desc_zh: string;
  }[];
  requirements: {
    id: string;
    en: string;
    zh: string;
  }[];
}

interface MppServicesWorkflowCarouselProps {
  currentLang?: string; // 'id' | 'en' | 'zh'
  isDark?: boolean;
  onOpenDetail?: (item: WorkflowItem) => void;
}

export const MppServicesWorkflowCarousel: React.FC<MppServicesWorkflowCarouselProps> = ({
  currentLang = 'id',
  isDark = false,
  onOpenDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeModalItem, setActiveModalItem] = useState<WorkflowItem | null>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper for multi-language string resolution
  const lang = (currentLang || 'id').toLowerCase();
  const getLangStr = (idStr: string, enStr?: string, zhStr?: string) => {
    if (lang.startsWith('en') && enStr) return enStr;
    if (lang.startsWith('zh') && zhStr) return zhStr;
    return idStr;
  };

  // Complete List of All MPP Simpurusiang Tenant Workflows
  const workflowData: WorkflowItem[] = [
    {
      id: 'pbg',
      category: 'perizinan',
      icon: HardHat,
      title: 'Persetujuan Bangunan Gedung (PBG & SLF)',
      title_en: 'Building Approval (PBG & Certificate of Fitness)',
      title_zh: '建筑许可 (PBG & 合格证书 SLF)',
      agency: 'Dinas PUPTR Kab. Luwu',
      agency_en: 'PUPTR Public Works Housing Dept',
      agency_zh: '公共工程与国土规划局',
      desc: 'Prosedur pengajuan dokumen Persetujuan Bangunan Gedung (PBG) dan Sertifikat Laik Fungsi (SLF) melalui SIMBG terintegrasi.',
      desc_en: 'PBG and Functionality Certificate (SLF) submission procedure integrated with SIMBG portal.',
      desc_zh: '通过集成SIMBG系统申请建筑批准书(PBG)和建筑合格证书(SLF)流程。',
      loket: 'Loket 04 - PUPTR',
      sla: '3 - 5 Hari Kerja',
      sla_en: '3 - 5 Working Days',
      sla_zh: '3 - 5 个工作日',
      badge: 'PUPTR & Tata Ruang',
      badge_en: 'Building & Spatial',
      badge_zh: '建筑与空间',
      portalUrl: 'https://simbg.pu.go.id',
      steps: [
        {
          no: 1,
          title: 'Registrasi SIMBG',
          title_en: 'SIMBG Registration',
          title_zh: 'SIMBG 账户注册',
          desc: 'Pendaftaran akun & input data teknis bangunan di portal SIMBG.',
          desc_en: 'Account registration and technical building data entry on SIMBG portal.',
          desc_zh: '在SIMBG门户网站注册账户并输入建筑技术数据。',
        },
        {
          no: 2,
          title: 'Verifikasi PUPTR',
          title_en: 'PUPTR Verification',
          title_zh: 'PUPTR 审核',
          desc: 'Verifikasi kelengkapan dokumen administratif & spasial oleh Tim Teknis Dinas PUPTR.',
          desc_en: 'Verification of administrative & spatial technical documents by PUPTR team.',
          desc_zh: 'PUPTR技术团队审核行政与空间文件的完整性。',
        },
        {
          no: 3,
          title: 'Sidang Konsultasi',
          title_en: 'Technical Consultation',
          title_zh: '技术咨询会议',
          desc: 'Sidang konsultasi teknis bersama Tim Profesi Ahli (TPA) / Tim Teknis Bangunan.',
          desc_en: 'Technical consultation session with the Professional Expert Team (TPA).',
          desc_zh: '与专业专家团队 (TPA) 进行技术咨询会议。',
        },
        {
          no: 4,
          title: 'Penerbitan PBG & SLF',
          title_en: 'Issuance of PBG & SLF',
          title_zh: '颁发 PBG & SLF',
          desc: 'Pembayaran retribusi daerah & penerbitan dokumen resmi PBG / SLF digital.',
          desc_en: 'Local levy payment and issuance of digital official PBG / SLF document.',
          desc_zh: '缴纳地方税费并颁发数字官方 PBG / SLF 文件。',
        },
      ],
      requirements: [
        { id: 'KTP & NPWP Pemohon', en: 'Applicant ID & Tax ID', zh: '申请人身份证与税号' },
        { id: 'Sertifikat Tanah / Bukti Kepemilikan Lahan', en: 'Land Title Certificate', zh: '土地所有权证书' },
        { id: 'Gambar Rencana Teknis Bangunan (Arsitektur & Struktur)', en: 'Technical Architectural & Structural Drawings', zh: '建筑与结构技术图纸' },
        { id: 'Dokumen Lingkungan (SPPL / UKL-UPL)', en: 'Environmental Impact Assessment (SPPL/UKL-UPL)', zh: '环境影响评估文件' },
      ],
    },
    {
      id: 'mpp',
      category: 'mpp',
      icon: Building2,
      title: 'Alur Layanan Kunjungan Mal Pelayanan Publik',
      title_en: 'MPP Main Visitor Service Workflow',
      title_zh: '公共服务大厅主要到访服务流程',
      agency: 'Gedung Utama MPP Simpurusiang',
      agency_en: 'MPP Simpurusiang Main Building',
      agency_zh: '辛普鲁西亚公共服务大厅主楼',
      desc: 'Prosedur kedatangan warga mulai dari mesin antrean pintar, helptdesk konsierge, hingga penyelesaian di loket gerai.',
      desc_en: 'Visitor arrival procedure from smart queue kiosk, concierge helpdesk, to counter service completion.',
      desc_zh: '从智能取号机、咨询台到窗口办理完成的到访流程。',
      loket: 'Lobby Utama MPP',
      sla: '10 - 20 Menit',
      sla_en: '10 - 20 Minutes',
      sla_zh: '10 - 20 分钟',
      badge: 'Layanan Terpadu',
      badge_en: 'Integrated Hub',
      badge_zh: '综合服务中心',
      steps: [
        {
          no: 1,
          title: 'Pengambilan Nomor Antrean',
          title_en: 'Take Queue Ticket',
          title_zh: '取号领票',
          desc: 'Ambil nomor antrean di Kios Anjungan Mandiri atau via aplikasi e-Antrean MPP.',
          desc_en: 'Get queue ticket at self-service kiosk or via MPP e-Queue mobile app.',
          desc_zh: '在自助机或通过 MPP 电子排队 App 取号。',
        },
        {
          no: 2,
          title: 'Konsierge & Skrining',
          title_en: 'Concierge Screening',
          title_zh: '分流与咨询',
          desc: 'Pemeriksaan berkas awal oleh Duta Pelayanan MPP untuk kelancaran transaksi.',
          desc_en: 'Initial document check by MPP Service Ambassadors.',
          desc_zh: '服务大使进行初步文件核对。',
        },
        {
          no: 3,
          title: 'Pelayanan di Loket Tenant',
          title_en: 'Service at Counter',
          title_zh: '窗口办理',
          desc: 'Proses verifikasi, wawancara, pemfotoan, atau pencetakan dokumen di gerai instansi.',
          desc_en: 'Verification, interview, photo capture, or document printing at agency counter.',
          desc_zh: '在机构窗口进行核对、面试、拍照或打印文件。',
        },
        {
          no: 4,
          title: 'Pengisian SKM / Feedback',
          title_en: 'Satisfaction Survey (SKM)',
          title_zh: '满意度测评',
          desc: 'Pengisian Indeks Kepuasan Masyarakat (SKM) via layar sentuh digital.',
          desc_en: 'Fill out Community Satisfaction Survey (SKM) via digital touch display.',
          desc_zh: '通过数字触摸屏填写公众满意度调查。',
        },
      ],
      requirements: [
        { id: 'KTP-el Asli Pemohon', en: 'Original National ID Card', zh: '申请人身份证原件' },
        { id: 'Nomor Antrean Online / Kios', en: 'Online or Kiosk Queue Ticket', zh: '线上或自助机排队号' },
        { id: 'Kelengkapan Berkas Sesuai Layanan', en: 'Required Service Documents', zh: '按服务要求的完整文件' },
      ],
    },
    {
      id: 'pkkpr',
      category: 'perizinan',
      icon: MapPin,
      title: 'Sistem PKKPR & Kesesuaian Tata Ruang',
      title_en: 'PKKPR & Spatial Conformity System',
      title_zh: 'PKKPR 空间规划符合性审批系统',
      agency: 'Dinas PUPTR & DPMPTSP Kab. Luwu',
      agency_en: 'PUPTR & Investment Dept',
      agency_zh: '公共工程与投资促进局',
      desc: 'Pengurusan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) untuk kegiatan berusaha dan non-berusaha.',
      desc_en: 'Conformity approval for spatial utilization activities (PKKPR) for business & non-business.',
      desc_zh: '办理商业和非商业活动的空间利用符合性批准书(PKKPR)。',
      loket: 'Loket 05 - Tata Ruang',
      sla: '3 - 7 Hari Kerja',
      sla_en: '3 - 7 Working Days',
      sla_zh: '3 - 7 个工作日',
      badge: 'Tata Ruang GISTARU',
      badge_en: 'GISTARU Spatial',
      badge_zh: 'GISTARU 空间规划',
      portalUrl: 'https://gistaru.atrbpn.go.id',
      steps: [
        {
          no: 1,
          title: 'Pengajuan Koordinat Lokasi',
          title_en: 'Coordinates Submission',
          title_zh: '提交地理坐标',
          desc: 'Input koordinat polygon lokasi lahan dan rencana kegiatan di portal OSS-RBA.',
          desc_en: 'Input land polygon coordinates and planned business activity in OSS-RBA.',
          desc_zh: '在 OSS-RBA 提交土地多边形坐标及规划活动。',
        },
        {
          no: 2,
          title: 'Kajian Kajian Spasial GIS',
          title_en: 'GIS Spatial Assessment',
          title_zh: 'GIS 空间评估',
          desc: 'Analisis tumpang tindih kawasan hutan, RTRW Kab. Luwu, dan LSD oleh Penata Ruang.',
          desc_en: 'Overlay spatial analysis against RTRW, forest zones, and protected paddy fields.',
          desc_zh: '对林区、空间规划(RTRW)和保护农田进行GIS叠置分析。',
        },
        {
          no: 3,
          title: 'Penerbitan Dokumen PKKPR',
          title_en: 'Issuance of PKKPR Document',
          title_zh: '颁发 PKKPR 文件',
          desc: 'Penerbitan persetujuan atau rekomendasi teknis tata ruang resmi.',
          desc_en: 'Issuance of official spatial technical approval or recommendation.',
          desc_zh: '颁发官方空间技术批准书或建议书。',
        },
      ],
      requirements: [
        { id: 'Koordinat Polygon Lahan (Shapefile / KML / Lat-Long)', en: 'Site Polygon Coordinates (Shapefile/KML)', zh: '地块多边形坐标文件' },
        { id: 'Rencana Tapak / Master Plan Usaha', en: 'Site Plan / Business Master Plan', zh: '项目总平面规划图' },
        { id: 'Bukti Penguasaan Tanah Asli', en: 'Proof of Land Ownership', zh: '土地产权证明原件' },
      ],
    },
    {
      id: 'dukcapil',
      category: 'dukcapil',
      icon: FileText,
      title: 'Pencetakan KTP-el & Kartu Keluarga Baru',
      title_en: 'e-ID Card (KTP-el) & Family Card Printing',
      title_zh: '电子身份证 (KTP-el) 与户口簿打印',
      agency: 'Disdukcapil Kab. Luwu',
      agency_en: 'Population Civil Registration Dept',
      agency_zh: '民政与人口登记局',
      desc: 'Perekaman biometric KTP-el baru, pencetakan KTP rusak/hilang, serta pembaruan elemen data Kartu Keluarga.',
      desc_en: 'Biometric recording, e-ID card re-issuance, and family card data update.',
      desc_zh: '电子身份证生物识别录入、遗失补办及户口簿信息更新。',
      loket: 'Loket 01 - 03 (Disdukcapil)',
      sla: '10 - 15 Menit',
      sla_en: '10 - 15 Minutes',
      sla_zh: '10 - 15 分钟',
      badge: 'Disdukcapil Prima',
      badge_en: 'Civil Registry',
      badge_zh: '民政登记',
      steps: [
        {
          no: 1,
          title: 'Verifikasi Berkas Kependudukan',
          title_en: 'Population Record Check',
          title_zh: '核对人口档案',
          desc: 'Petugas memeriksa NIK dan kelengkapan berkas fisik di sistem SIAK Terpusat.',
          desc_en: 'Officer verifies NIK and physical document completeness in Central SIAK.',
          desc_zh: '工作人员在中央 SIAK 系统核对身份证号与纸质文件。',
        },
        {
          no: 2,
          title: 'Perekaman Biometrik / Foto',
          title_en: 'Biometric & Photo Capture',
          title_zh: '生物识别与拍照',
          desc: 'Pengambilan foto, iris mata, sidik jari, dan tanda tangan digital (khusus pemohon baru).',
          desc_en: 'Facial photo, iris, fingerprint, and digital signature capture for new applicants.',
          desc_zh: '采集人脸、虹膜、指纹与电子签名（初次办理）。',
        },
        {
          no: 3,
          title: 'Pencetakan Langsung (Print on Site)',
          title_en: 'On-site Printing',
          title_zh: '现场即时打印',
          desc: 'KTP-el atau KK baru dicetak langsung dalam hitungan menit tanpa dipungut biaya.',
          desc_en: 'New e-ID card or Family Card printed on site in minutes for free.',
          desc_zh: '数分钟内现场即时免费打印身份证或户口簿。',
        },
      ],
      requirements: [
        { id: 'Surat Kehilangan dari Kepolisian (jika KTP Hilang)', en: 'Police Loss Report (if lost)', zh: '报案遗失证明（如遗失）' },
        { id: 'Kartu Keluarga (KK) Asli Terbaru', en: 'Original Latest Family Card', zh: '最新户口簿原件' },
        { id: 'KTP Lama yang Rusak (jika Penggantian)', en: 'Old Damaged ID Card (if replacement)', zh: '损坏的原身份证（如损坏换领）' },
      ],
    },
    {
      id: 'nib-oss',
      category: 'perizinan',
      icon: Zap,
      title: 'Perizinan Berusaha NIB (OSS-RBA Integrasi)',
      title_en: 'Business Identification Number (NIB OSS-RBA)',
      title_zh: '企业注册编号 (NIB OSS-RBA 许可)',
      agency: 'DPMPTSP Kab. Luwu',
      agency_en: 'DPMPTSP Investment Service',
      agency_zh: '投资与一站式服务局',
      desc: 'Penerbitan Nomor Induk Berusaha (NIB) untuk skala UMKM, Usaha Mikro Kecil, hingga PMA/PMDN.',
      desc_en: 'Issuance of Business ID (NIB) for MSMEs, small businesses, to foreign investments.',
      desc_zh: '为微中小企业及国内外投资企业颁发企业登记号 (NIB)。',
      loket: 'Loket 06 - DPMPTSP',
      sla: '15 Menit',
      sla_en: '15 Minutes',
      sla_zh: '15 分钟',
      badge: 'OSS-RBA Nasional',
      badge_en: 'National OSS-RBA',
      badge_zh: '国家 OSS-RBA 许可',
      portalUrl: 'https://oss.go.id',
      steps: [
        {
          no: 1,
          title: 'Aktivasi Hak Akses OSS',
          title_en: 'OSS Account Activation',
          title_zh: 'OSS 账号激活',
          desc: 'Input NIK/NPWP penanggung jawab usaha dan verifikasi nomor WhatsApp/email.',
          desc_en: 'Input manager NIK/Tax ID and verify WhatsApp/email.',
          desc_zh: '输入负责人身份证号/税号并验证手机号/邮箱。',
        },
        {
          no: 2,
          title: 'Pilihan Kode KBLI Usaha',
          title_en: 'Select KBLI Code',
          title_zh: '选择 KBLI 行业代码',
          desc: 'Pemilihan Klasifikasi Baku Lapangan Usaha Indonesia (KBLI 2020) sesuai bidang usaha.',
          desc_en: 'Select Indonesian Standard Industrial Classification (KBLI 2020) code.',
          desc_zh: '选择符合业务范围的印尼标准行业分类 (KBLI 2020) 代码。',
        },
        {
          no: 3,
          title: 'Cetak NIB & Sertifikat Standar',
          title_en: 'Print NIB Certificate',
          title_zh: '打印 NIB 企业证书',
          desc: 'NIB langsung terbit dengan QR Code resmi Kementerian Investasi / BKPM.',
          desc_en: 'NIB automatically generated with official Ministry QR Code.',
          desc_zh: '实时生成附带投资部官方二维码的 NIB 证书。',
        },
      ],
      requirements: [
        { id: 'KTP & NPWP Penanggung Jawab', en: 'Person-in-Charge ID & Tax ID', zh: '负责人身份证与税号' },
        { id: 'Nomor WhatsApp & Email Aktif', en: 'Active WhatsApp & Email', zh: '有效的 WhatsApp 与电子邮箱' },
        { id: 'Rincian Modal Usaha & Luas Lahan', en: 'Capital Details & Land Size', zh: '资本细节与用地面积' },
      ],
    },
    {
      id: 'pbb-p2',
      category: 'perpajakan',
      icon: BadgePercent,
      title: 'Pembayaran & Mutasi PBB-P2 / Pajak Daerah',
      title_en: 'Land Tax (PBB-P2) Payment & Mutation',
      title_zh: '不动产税 (PBB-P2) 缴纳与变更',
      agency: 'Bapenda Kab. Luwu & Bank Sulselbar',
      agency_en: 'Regional Revenue Board & Bank Sulselbar',
      agency_zh: '地方税务局与苏塞尔巴银行',
      desc: 'Layanan konsultasi SPPT PBB-P2, pemecahan objek pajak, mutasi nama pemilik, dan pembayaran digital.',
      desc_en: 'PBB-P2 tax bill consultation, land plot splitting, owner name mutation, and digital payment.',
      desc_zh: '不动产税 (PBB-P2) 咨询、土地分割、户 me 变更及线上缴费。',
      loket: 'Loket 07 - Bapenda',
      sla: '8 - 10 Menit',
      sla_en: '8 - 10 Minutes',
      sla_zh: '8 - 10 分钟',
      badge: 'Bapenda Luwu',
      badge_en: 'Revenue Agency',
      badge_zh: '地方税务局',
      steps: [
        {
          no: 1,
          title: 'Pengecekan NOP Tax Record',
          title_en: 'Tax Object NOP Check',
          title_zh: '查验税收编号 NOP',
          desc: 'Input Nomor Objek Pajak (NOP) pada sistem e-PBB Bapenda Kab. Luwu.',
          desc_en: 'Input Tax Object Number (NOP) into Bapenda e-PBB database.',
          desc_zh: '在地方税务局 e-PBB 系统中输入税收编号 (NOP)。',
        },
        {
          no: 2,
          title: 'Cetak SPPT / Akta Mutasi',
          title_en: 'Print SPPT / Deed Mutation',
          title_zh: '打印税单/变更凭证',
          desc: 'Penerbitan lembar SPPT PBB-P2 baru atau pembaruan nama pemilik tanah.',
          desc_en: 'Issuance of new PBB tax bill or updated land ownership title name.',
          desc_zh: '开具新的 PBB 税单或更新土地所有权人姓名。',
        },
        {
          no: 3,
          title: 'Pembayaran QRIS / Loket Bank',
          title_en: 'QRIS / Bank Payment',
          title_zh: 'QRIS 扫码或银行窗口缴费',
          desc: 'Pembayaran non-tunai via QRIS Bank Sulselbar atau kasir teller di tempat.',
          desc_en: 'Cashless payment via Bank Sulselbar QRIS or on-site teller.',
          desc_zh: '通过 Bank Sulselbar QRIS 扫码或现场柜台无现金缴费。',
        },
      ],
      requirements: [
        { id: 'SPPT PBB Tahun Sebelumnya / NOP', en: 'Previous Year PBB Bill / NOP', zh: '往年 PBB 税单或 NOP 编号' },
        { id: 'FC Sertifikat Tanah / Akta Jual Beli (AJB)', en: 'Copy of Land Certificate / Sales Deed', zh: '土地证复印件或买卖契约' },
        { id: 'KTP Pemilik Baru / Pemohon', en: 'New Owner ID Card', zh: '新业主的身份证原件' },
      ],
    },
    {
      id: 'sim-skck',
      category: 'kepolisian',
      icon: ShieldCheck,
      title: 'Perpanjangan SIM A/C & Penerbitan SKCK Online',
      title_en: 'Driver License Extension & SKCK Police Clearance',
      title_zh: '驾驶证 (SIM A/C) 展期与无犯罪记录证明 (SKCK)',
      agency: 'Polres Luwu & Satpas Polantas',
      agency_en: 'Luwu Police Dept & Traffic Division',
      agency_zh: '鲁乌县警察局与交通管理处',
      desc: 'Layanan perpanjangan SIM A dan SIM C, pemeriksaan kesehatan & psikologi, serta pembuatan SKCK.',
      desc_en: 'Driver license (SIM A/C) renewal, health & psychological test, and SKCK police record.',
      desc_zh: '驾驶证 (SIM A/C) 换证、体检心理测试及无犯罪记录证明 (SKCK)。',
      loket: 'Loket 11 - 13 (Polres Luwu)',
      sla: '15 - 20 Menit',
      sla_en: '15 - 20 Minutes',
      sla_zh: '15 - 20 分钟',
      badge: 'Polres Luwu Presisi',
      badge_en: 'Police Services',
      badge_zh: '警察局公共服务',
      steps: [
        {
          no: 1,
          title: 'Tes Kesehatan & Psikologi SIM',
          title_en: 'Medical & Psychology Test',
          title_zh: '体检与心理测试',
          desc: 'Pemeriksaan kesehatan fisik dan uji psikologi di ruang khusus Polres MPP.',
          desc_en: 'Physical health and psychological evaluation in MPP police room.',
          desc_zh: '在 MPP 警务室进行身体检查与心理评估。',
        },
        {
          no: 2,
          title: 'Verifikasi Berkas SIM / SKCK',
          title_en: 'Document Verification',
          title_zh: '文件审核',
          desc: 'Pemeriksaan kelengkapan SIM lama, KTP, dan bukti registrasi online.',
          desc_en: 'Verification of existing driver license, ID, and online registration.',
          desc_zh: '核对原驾驶证、身份证及线上登记凭证。',
        },
        {
          no: 3,
          title: 'Pencetakan Kartu SIM / SKCK',
          title_en: 'SIM Card / SKCK Printing',
          title_zh: '打印驾驶证/SKCK 证明',
          desc: 'Pengambilan foto kartu SIM baru dan penyerahan SKCK berstempel resmi.',
          desc_en: 'New SIM photo capture and hand-over of official stamped SKCK.',
          desc_zh: '采集新驾驶证照片并领取盖章的无犯罪记录证明。',
        },
      ],
      requirements: [
        { id: 'SIM Lama yang Masih Berlaku (untuk Perpanjangan)', en: 'Existing Valid Driver License', zh: '原有效驾驶证（用于换证）' },
        { id: 'KTP-el Asli & Fotokopi', en: 'Original National ID & Copy', zh: '身份证原件与复印件' },
        { id: 'Surat Hasil Tes Kesehatan & Psikologi', en: 'Medical & Psychology Test Result', zh: '体检与心理测试合格单' },
      ],
    },
    {
      id: 'bpjs-kes',
      category: 'sosial',
      icon: HeartHandshake,
      title: 'BPJS Kesehatan & Ketenagakerjaan Terpadu',
      title_en: 'BPJS Healthcare & Employment Insurance',
      title_zh: 'BPJS 医疗与社会劳工保险服务',
      agency: 'BPJS Kesehatan & BPJS Ketenagakerjaan',
      agency_en: 'BPJS Health & Social Security Agency',
      agency_zh: '印尼国家医疗与社会劳工保险局',
      desc: 'Pendaftaran peserta baru, mutasi faskes, pendaftaran JKN PBI APBD, dan pencairan klaim JHT.',
      desc_en: 'New participant registration, primary clinic change, and JHT claim consultation.',
      desc_zh: '新参保登记、诊所变更及 JHT 养老金理财咨询。',
      loket: 'Loket 09 - BPJS',
      sla: '10 - 12 Menit',
      sla_en: '10 - 12 Minutes',
      sla_zh: '10 - 12 分钟',
      badge: 'Jaminan Sosial',
      badge_en: 'Social Security',
      badge_zh: '社会保障',
      steps: [
        {
          no: 1,
          title: 'Pengajuan Data Peserta',
          title_en: 'Participant Data Entry',
          title_zh: '提交参保人信息',
          desc: 'Input Kartu Keluarga dan penentuan kelas kepesertaan / faskes tingkat pertama.',
          desc_en: 'Input Family Card number and select membership class or primary clinic.',
          desc_zh: '输入户口簿信息并选择参保级别或首诊诊所。',
        },
        {
          no: 2,
          title: 'Penetapan Autodebit / PBI',
          title_en: 'Autodebit / Subsidy Setup',
          title_zh: '设置自动扣款或政府补贴',
          desc: 'Pendaftaran nomor rekening autodebit atau penerbitan rekomendasi PBI APBD.',
          desc_en: 'Register bank autodebit account or APBD local government subsidy.',
          desc_zh: '绑定银行卡自动扣款或办理地方财政补贴 (PBI)。',
        },
        {
          no: 3,
          title: 'Cetak Kartu Digital / Fisik',
          title_en: 'Print Digital Card',
          title_zh: '打印数字/实体医保卡',
          desc: 'Aktivasi akun Mobile JKN dan cetak Kartu Indonesia Sehat (KIS).',
          desc_en: 'Mobile JKN app activation and KIS health card printing.',
          desc_zh: '激活 Mobile JKN 手机端并打印医保卡。',
        },
      ],
      requirements: [
        { id: 'Kartu Keluarga (KK) & KTP-el Asli', en: 'Original Family Card & ID', zh: '户口簿与身份证原件' },
        { id: 'Buku Rekening Bank (untuk Autodebit)', en: 'Bank Passbook (for Autodebit)', zh: '银行存折（用于自动扣款）' },
        { id: 'Surat Keterangan Tidak Mampu (khusus PBI APBD)', en: 'Low-Income Certificate (for Subsidy)', zh: '低收入证明（仅限政府补贴）' },
      ],
    },
    {
      id: 'bpn-sertifikat',
      category: 'pertanahan',
      icon: Layers,
      title: 'Layanan Pertanahan & Pengecekan Sertifikat BPN',
      title_en: 'BPN Land Services & Title Verification',
      title_zh: '国家土地局 (BPN) 产权核查与地税服务',
      agency: 'Kantor Pertanahan (BPN) Kab. Luwu',
      agency_en: 'BPN National Land Agency Luwu',
      agency_zh: '鲁乌县国家土地局',
      desc: 'Pengecekan keabsahan sertifikat tanah, peralihan hak / balik nama, pendaftaran Hak Tanggungan (HT).',
      desc_en: 'Land title validity verification, title transfer name change, and mortgage registration.',
      desc_zh: '土地产权真实性核查、过户更名及抵押权登记。',
      loket: 'Loket 14 - BPN',
      sla: '15 Menit',
      sla_en: '15 Minutes',
      sla_zh: '15 分钟',
      badge: 'BPN RI Pertanahan',
      badge_en: 'Land Office RI',
      badge_zh: '印尼国家土地局',
      steps: [
        {
          no: 1,
          title: 'Pemeriksaan Fisik Sertifikat',
          title_en: 'Title Certificate Inspection',
          title_zh: '土地证原件核验',
          desc: 'Petugas BPN memverifikasi nomor sertifikat pada buku tanah digital.',
          desc_en: 'BPN officer verifies certificate number against digital land book.',
          desc_zh: 'BPN 工作人员在数字土地簿中核对产权证编号。',
        },
        {
          no: 2,
          title: 'Validasi Pajak PBB & BPHTB',
          title_en: 'PBB & BPHTB Tax Validation',
          title_zh: 'PBB 与 BPHTB 契税验证',
          desc: 'Pemeriksaan bukti pelunasan BPHTB dan PBB-P2 tahun berjalan.',
          desc_en: 'Verification of BPHTB property tax and current PBB bill payment receipt.',
          desc_zh: '核验契税 (BPHTB) 与当年 PBB 完税凭证。',
        },
        {
          no: 3,
          title: 'Penerbitan Surat Keterangan BPN',
          title_en: 'Issuance of BPN Certificate',
          title_zh: '开具 BPN 土地证明文件',
          desc: 'Penerbitan Surat Keterangan Pendaftaran Tanah (SKPT) atau tanda terima berkas.',
          desc_en: 'Issuance of Land Registration Certificate (SKPT) or official submission receipt.',
          desc_zh: '开具土地登记证明 (SKPT) 或官方收件回执。',
        },
      ],
      requirements: [
        { id: 'Sertifikat Tanah Asli (SHM / HGB)', en: 'Original Land Certificate (SHM/HGB)', zh: '土地产权证原件 (SHM/HGB)' },
        { id: 'KTP-el & NPWP Pemohon', en: 'Applicant ID Card & Tax ID', zh: '申请人身份证与税号' },
        { id: 'Bukti Pelunasan PBB-P2 & BPHTB', en: 'PBB & BPHTB Payment Receipts', zh: 'PBB 与契税 BPHTB 缴费凭证' },
      ],
    },
    {
      id: 'imigrasi-paspor',
      category: 'keimigrasian',
      icon: Globe,
      title: 'Layanan Paspor & Informasi Keimigrasian',
      title_en: 'Passport Services & Immigration Desk',
      title_zh: '护照办理与出入境移民咨询',
      agency: 'Kantor Imigrasi Kelas II Palopo / Luwu',
      agency_en: 'Immigration Office Palopo / Luwu',
      agency_zh: '帕洛波/鲁乌二级移民局',
      desc: 'Pengurusan perpanjangan paspor RI, konsultasi paspor baru via M-Paspor, serta izin tinggal WNA.',
      desc_en: 'Indonesian passport renewal, M-Paspor app consultation, and stay permits for foreigners.',
      desc_zh: '印尼护照展期补办、M-Paspor 手机端咨询及外籍人员居留许可。',
      loket: 'Loket 15 - Imigrasi',
      sla: '15 Menit',
      sla_en: '15 Minutes',
      sla_zh: '15 分钟',
      badge: 'Imigrasi RI',
      badge_en: 'Immigration RI',
      badge_zh: '印尼出入境移民局',
      steps: [
        {
          no: 1,
          title: 'Pemeriksaan Berkas M-Paspor',
          title_en: 'M-Paspor Check',
          title_zh: 'M-Paspor 预约核对',
          desc: 'Pemeriksaan barcode pendaftaran online pada aplikasi M-Paspor.',
          desc_en: 'Verification of M-Paspor mobile application barcode registration.',
          desc_zh: '核对 M-Paspor 手机应用中的在线预约条形码。',
        },
        {
          no: 2,
          title: 'Wawancara & Biometrik Paspor',
          title_en: 'Interview & Biometrics',
          title_zh: '面谈与护照生物识别',
          desc: 'Proses pemfotoan wajah, pengambilan sidik jari, dan wawancara tujuan perjalanan.',
          desc_en: 'Facial photo capture, fingerprints, and travel purpose interview.',
          desc_zh: '采集人脸照片、指纹及出行目的面谈。',
        },
        {
          no: 3,
          title: 'Pembayaran Kode Billing MPN',
          title_en: 'MPN Billing Payment',
          title_zh: 'MPN 缴费代码支付',
          desc: 'Pembayaran biaya paspor via ATM / Mobile Banking seluruh bank nasional.',
          desc_en: 'Passport fee payment via ATM or Mobile Banking across national banks.',
          desc_zh: '通过全印尼各银行 ATM 或手机银行缴纳护照规费。',
        },
      ],
      requirements: [
        { id: 'E-KTP & Kartu Keluarga Asli', en: 'Original National ID & Family Card', zh: '身份证与户口簿原件' },
        { id: 'Akte Kelahiran / Ijazah / Buku Nikah', en: 'Birth Certificate / Diploma / Marriage Book', zh: '出生证明/毕业证/结婚证原件' },
        { id: 'Paspor Lama (khusus Perpanjangan)', en: 'Old Passport (for Renewal)', zh: '旧护照原件（仅限换发）' },
      ],
    },
    {
      id: 'pajak-npwp',
      category: 'perpajakan',
      icon: Calculator,
      title: 'Pembuatan NPWP & Konsultasi SPT Tahunan',
      title_en: 'Tax ID (NPWP) Creation & Tax Return Consultation',
      title_zh: '税号 (NPWP) 办理与年度所得税 (SPT) 申报咨询',
      agency: 'KPP Pratama Palopo / KP2KP Belopa',
      agency_en: 'Tax Office KPP Pratama & KP2KP Belopa',
      agency_zh: '国家税务局 KPP Pratama & Belopa 办税处',
      desc: 'Pendaftaran NIK menjadi NPWP (Coretax System), e-Filing SPT Tahunan Orang Pribadi dan Badan Usaha.',
      desc_en: 'Registration of NIK as Tax ID (Coretax System), e-Filing annual income tax returns.',
      desc_zh: '将身份证号 (NIK) 整合为税号 (NPWP) 以及个人/企业年度所得税申报。',
      loket: 'Loket 08 - Pajak Pratama',
      sla: '10 Menit',
      sla_en: '10 Minutes',
      sla_zh: '10 分钟',
      badge: 'DJP Kemenkeu RI',
      badge_en: 'Tax Office RI',
      badge_zh: '印尼财政部税务总局',
      steps: [
        {
          no: 1,
          title: 'Padankan NIK - NPWP',
          title_en: 'NIK - NPWP Matching',
          title_zh: 'NIK 身份证与税号匹配',
          desc: 'Aktivasi NIK sebagai NPWP pada portal resmi DJP Online Coretax.',
          desc_en: 'Activate NIK as Tax ID on DJP Online Coretax portal.',
          desc_zh: '在税务局 DJP Online Coretax 门户将身份证号激活为税号。',
        },
        {
          no: 2,
          title: 'Konsultasi e-Filing SPT',
          title_en: 'e-Filing Tax Return',
          title_zh: 'e-Filing 网上报税指导',
          desc: 'Pendampingan input bukti potong 1721-A1 / A2 dan penyampaian SPT Tahunan.',
          desc_en: 'Assistance in entering tax withholding slips and annual tax submission.',
          desc_zh: '协助录入扣缴凭单并完成年度所得税申报。',
        },
      ],
      requirements: [
        { id: 'KTP-el & Kartu Keluarga Asli', en: 'Original ID Card & Family Card', zh: '身份证与户口簿原件' },
        { id: 'Bukti Potong Pajak 1721-A1 / A2 (jika Pegawai)', en: 'Tax Withholding Form 1721-A1/A2 (if employee)', zh: '雇主扣缴凭单 1721-A1/A2（如有）' },
        { id: 'Email & Nomor HP Aktif', en: 'Active Email & Phone Number', zh: '有效的电子邮箱与手机号' },
      ],
    },
    {
      id: 'pdam-air',
      category: 'bumd',
      icon: Droplets,
      title: 'Pasang Baru & Pembayaran PDAM Tirta Luwu',
      title_en: 'PDAM Water Connection & Monthly Payments',
      title_zh: 'PDAM 自来水新户报装与每月水费缴纳',
      agency: 'PDAM Tirta Luwu & BUMD',
      agency_en: 'PDAM Tirta Luwu Water Company',
      agency_zh: 'Tirta Luwu 地方自来水公司',
      desc: 'Pendaftaran sambungan baru air bersih, laporan gangguan pipa, dan pembayaran rekening air bulanan.',
      desc_en: 'New clean water supply connection, pipe leak reporting, and bill payment.',
      desc_zh: '自来水新户报装、水管故障报修及每月水费缴纳。',
      loket: 'Loket 16 - PDAM',
      sla: '10 Menit',
      sla_en: '10 Minutes',
      sla_zh: '10 分钟',
      badge: 'BUMD Kab. Luwu',
      badge_en: 'Luwu Enterprise',
      badge_zh: '鲁乌县国有企业',
      steps: [
        {
          no: 1,
          title: 'Pengisian Formulir Sambungan',
          title_en: 'Water Application Form',
          title_zh: '填写自来水报装申请表',
          desc: 'Input alamat rumah/usaha dan penetapan kelompok tarif air.',
          desc_en: 'Input household address and determine water tariff group.',
          desc_zh: '输入房屋/营业地址并确定水费计价类别。',
        },
        {
          no: 2,
          title: 'Jadwal Survei Lapangan',
          title_en: 'Field Survey Schedule',
          title_zh: '安排现场勘测时间',
          desc: 'Penetapan jadwal teknisi untuk pengukuran jarak pipa utama ke meteran.',
          desc_en: 'Scheduling technicians for pipe distance measurement from main supply.',
          desc_zh: '安排技术人员测量主水管至水表的距离。',
        },
      ],
      requirements: [
        { id: 'KTP Pemohon & Denah Lokasi Rumah', en: 'Applicant ID & House Location Map', zh: '申请人身份证与房屋位置简图' },
        { id: 'Nomor Pelanggan Tetangga Terdekat', en: 'Nearest Neighbor Customer Number', zh: '邻居的自来水用户编号' },
      ],
    },
  ];

  // Category Tabs
  const categories = [
    { id: 'all', label: getLangStr('Semua Gerai (12)', 'All Tenants (12)', '所有窗口 (12)') },
    { id: 'perizinan', label: getLangStr('Perizinan & PUPTR', 'Permits & Spatial', '许可与规划') },
    { id: 'dukcapil', label: getLangStr('Kependudukan', 'Civil Registry', '民政户籍') },
    { id: 'perpajakan', label: getLangStr('Pajak & Bapenda', 'Tax & Revenue', '税务与财政') },
    { id: 'kepolisian', label: getLangStr('Polres & SIM', 'Police & Driver License', '警察与驾照') },
    { id: 'sosial', label: getLangStr('BPJS & Sosial', 'BPJS Social Security', '社保与医保') },
    { id: 'pertanahan', label: getLangStr('Pertanahan BPN', 'Land Office BPN', '国土局') },
    { id: 'keimigrasian', label: getLangStr('Imigrasi Paspor', 'Immigration & Passport', '出入境护照') },
    { id: 'bumd', label: getLangStr('BUMD & PDAM', 'Public Enterprise', '国企与自来水') },
  ];

  // Filtered workflows based on search and category
  const filteredWorkflows = useMemo(() => {
    return workflowData.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = getLangStr(item.title, item.title_en, item.title_zh).toLowerCase();
      const agency = getLangStr(item.agency, item.agency_en, item.agency_zh).toLowerCase();
      const desc = getLangStr(item.desc, item.desc_en, item.desc_zh).toLowerCase();
      const loket = item.loket.toLowerCase();
      return title.includes(q) || agency.includes(q) || desc.includes(q) || loket.includes(q);
    });
  }, [searchQuery, activeCategory, currentLang]);

  // Handle scroll buttons for touch slider
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="w-full font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Search Form Bar (Tombol Pencarian Tenant & Gerai) */}
      <div className="w-full max-w-3xl mx-auto mb-6 px-2">
        <div className="p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-emerald-950/20 backdrop-blur-xl flex flex-col sm:flex-row items-center gap-2">
          {/* Search Input Box */}
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getLangStr(
                'Cari gerai, tenant, atau jenis alur pelayanan (PBG, KTP, NIB, SIM, BPJS, Pajak, Paspor)...',
                'Search tenant, office or service workflow (PBG, ID card, SIM, Tax, Passport)...',
                '搜索各机构窗口及服务流程 (PBG, 身份证, 驾照, 税务, 护照)...'
              )}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/80 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle Button */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end shrink-0 px-2 sm:px-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {filteredWorkflows.length} {getLangStr('Alur Layanan', 'Workflows', '项服务流程')}
            </span>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setViewMode('carousel')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'carousel'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={getLangStr('Mode Slide Horizontal', 'Slide View', '滑动模式')}
              >
                <SquareSquare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={getLangStr('Mode Grid Kategori', 'Grid View', '网格模式')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Filter Horizontal Scroll */}
      <div className="w-full overflow-x-auto no-scrollbar mb-6 px-2 sm:px-4">
        <div className="flex items-center justify-center min-w-max gap-2 mx-auto">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`min-h-[38px] px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 scale-105'
                    : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workflows Container (Carousel Slide or Grid) */}
      {filteredWorkflows.length === 0 ? (
        <div className="py-12 text-center bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 max-w-md mx-auto">
          <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            {getLangStr('Gerai atau alur layanan tidak ditemukan', 'No tenant or workflow found', '未找到相关窗口或服务流程')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {getLangStr(`Tidak ada hasil untuk "${searchQuery}"`, `No result for "${searchQuery}"`, `无 "${searchQuery}" 相关的结果`)}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md"
          >
            {getLangStr('Reset Pencarian', 'Reset Search', '重置搜索')}
          </button>
        </div>
      ) : viewMode === 'carousel' ? (
        /* CAROUSEL SLIDE MODE (Android Touch-Snap Slider) */
        <div className="relative group/carousel px-2 sm:px-6">
          {/* Scroll Buttons for Desktop */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xl items-center justify-center hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xl items-center justify-center hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Touch Snap Carousel Container */}
          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 no-scrollbar px-1"
          >
            {filteredWorkflows.map((wf) => {
              const IconComp = wf.icon;
              const title = getLangStr(wf.title, wf.title_en, wf.title_zh);
              const agency = getLangStr(wf.agency, wf.agency_en, wf.agency_zh);
              const badge = getLangStr(wf.badge, wf.badge_en, wf.badge_zh);
              const sla = getLangStr(wf.sla, wf.sla_en, wf.sla_zh);

              return (
                <motion.div
                  key={wf.id}
                  whileHover={{ y: -6, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setActiveModalItem(wf);
                    if (onOpenDetail) onOpenDetail(wf);
                  }}
                  className="snap-center shrink-0 w-[85vw] sm:w-[320px] md:w-[360px] bg-gradient-to-b from-white/95 via-white/90 to-slate-50/90 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-950/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl shadow-slate-950/5 dark:shadow-emerald-950/20 p-6 flex flex-col justify-between cursor-pointer hover:border-emerald-500/80 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 group relative overflow-hidden"
                >
                  <div>
                    {/* Top Header Card */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {badge}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                        {wf.loket}
                      </span>
                    </div>

                    {/* Big Aesthetic Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform shadow-inner mx-auto">
                      <IconComp size={40} className="stroke-[1.8]" />
                    </div>

                    {/* Title & Agency */}
                    <span className="text-xs text-slate-400 block text-center mb-1">
                      {getLangStr('Alur Pelayanan ResmI', 'Official Workflow', '官方服务流程')}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-sans group-hover:text-emerald-500 transition-colors text-center leading-snug mb-2">
                      {title}
                    </h3>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center mb-4">
                      {agency}
                    </p>
                  </div>

                  {/* Card Footer Info */}
                  <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" /> {sla}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500">
                      <span>{getLangStr('Lihat Alur & Syarat', 'View Workflow', '查看流程与条件')}</span>
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shadow-sm">
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Touch Slide Indication Bar for Android */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-emerald-500 animate-pulse" />
              {getLangStr('Geser ke samping untuk jenis alur lainnya', 'Swipe horizontally to view more workflows', '横向滑动查看更多服务流程')}
            </span>
          </div>
        </div>
      ) : (
        /* GRID MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2 sm:px-4">
          {filteredWorkflows.map((wf) => {
            const IconComp = wf.icon;
            const title = getLangStr(wf.title, wf.title_en, wf.title_zh);
            const agency = getLangStr(wf.agency, wf.agency_en, wf.agency_zh);
            const badge = getLangStr(wf.badge, wf.badge_en, wf.badge_zh);
            const sla = getLangStr(wf.sla, wf.sla_en, wf.sla_zh);

            return (
              <motion.div
                key={wf.id}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setActiveModalItem(wf);
                  if (onOpenDetail) onOpenDetail(wf);
                }}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 flex flex-col justify-between cursor-pointer hover:border-emerald-500/80 shadow-lg hover:shadow-2xl transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {badge}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {wf.loket}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-500 transition-colors">
                        {title}
                      </h3>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {agency}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="text-slate-500 text-[11px]">SLA: {sla}</span>
                  <span className="flex items-center gap-1">
                    {getLangStr('Detail Alur', 'View Steps', '详细步骤')}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* DETAIL WORKFLOW MODAL FOR SELECTED SERVICE */}
      <AnimatePresence>
        {activeModalItem && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
            onClick={() => setActiveModalItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white shadow-emerald-950/40'
                  : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Bar dengan Android Drag Bar */}
              <div className="relative pt-3 pb-4 px-6 border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md">
                {/* Drag Handle Bar */}
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 sm:hidden" />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      {React.createElement(activeModalItem.icon, { className: 'w-6 h-6' })}
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {getLangStr(activeModalItem.badge, activeModalItem.badge_en, activeModalItem.badge_zh)}
                      </span>
                      <h2 className="text-base sm:text-lg font-extrabold tracking-tight mt-1">
                        {getLangStr(activeModalItem.title, activeModalItem.title_en, activeModalItem.title_zh)}
                      </h2>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {getLangStr(activeModalItem.agency, activeModalItem.agency_en, activeModalItem.agency_zh)} • {activeModalItem.loket}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveModalItem(null)}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  {getLangStr(activeModalItem.desc, activeModalItem.desc_en, activeModalItem.desc_zh)}
                </p>

                {/* Step-by-Step Procedure Timeline */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {getLangStr('Tahapan Prosedur Alur Pelayanan', 'Service Procedure Timeline', '服务流程步骤线')}
                  </h3>

                  <div className="space-y-3">
                    {activeModalItem.steps.map((st) => (
                      <div
                        key={st.no}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3.5 shadow-sm"
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                          {st.no}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-1">
                            {getLangStr(st.title, st.title_en, st.title_zh)}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {getLangStr(st.desc, st.desc_en, st.desc_zh)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    {getLangStr('Persyaratan Ringkas', 'Required Documents', '所需简要材料')}
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                    {activeModalItem.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{getLangStr(req.id, req.en, req.zh)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  SLA: {getLangStr(activeModalItem.sla, activeModalItem.sla_en, activeModalItem.sla_zh)}
                </span>

                {activeModalItem.portalUrl ? (
                  <a
                    href={activeModalItem.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>{getLangStr('Buka Portal Terkait', 'Open Related Portal', '打开相关门户')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveModalItem(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold cursor-pointer"
                  >
                    {getLangStr('Tutup Panduan', 'Close Guide', '关闭指南')}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
