import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Star,
  Laptop,
  Accessibility,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  HeartHandshake,
  Calendar,
  ChevronRight,
  ChevronLeft,
  FileText,
  Sparkles,
  Building2,
  Info,
  Phone,
  Layers,
  ArrowRight,
  Maximize2
} from 'lucide-react';

export interface ServiceDetailItem {
  id: string;
  category: string;
  title: string;
  badge: string;
  badgeClass?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconContainerClass?: string;
  image: string;
  description: string;
  gallery?: string[];
  location?: string;
  sla?: string;
  cost?: string;
  targetCriteria?: string[];
  facilities?: string[];
  requirements?: string[];
  workflow?: { step: number; title: string; desc: string }[];
  contactOfficer?: { name: string; role: string; phone: string };
  regulations?: string;
}

// Data spesifikasi komprehensif berstandar PermenPAN-RB & ISO Pelayanan Publik
export const DETAILED_SERVICE_SPECS: Record<string, any> = {
  'layanan-prioritas': {
    title_en: 'Priority & Fast-Track Services',
    title_zh: 'VIP 绿色通道与优先政务服务',
    badge_en: 'Fast-Track & VIP',
    badge_zh: 'VIP 绿色通道',
    description_en: 'Fast-track service and dedicated assistance for investors, the elderly, pregnant women, and persons with disabilities.',
    description_zh: '面向投资者、长者、孕妇及残障人士的绿色通道与专人一对一政务服务。',
    gallery: [
      'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=1200',
    ],
    location: 'Lantai 1 - Sayap Timur, Executive VIP Lounge & Loket Fast-Track MPP Simpurusiang',
    location_en: '1st Floor - East Wing, Executive VIP Lounge & Fast-Track Counter, Simpurusiang MPP',
    location_zh: '1 楼东翼，Simpurusiang 政务大厅 Executive VIP 贵宾室与 Fast-Track 快捷窗口',
    sla: '10 - 20 Menit (Bypass Antrean Reguler)',
    sla_en: '10 - 20 Minutes (Regular Queue Bypass)',
    sla_zh: '10 - 20 分钟（跳过普通排队直达）',
    cost: 'Rp 0,- (Gratis Resmi Pemkab Luwu)',
    cost_en: 'IDR 0 (Free Official Service by Luwu Regency)',
    cost_zh: '0 印尼盾（鲁乌县政府官方法定免费）',
    regulations: 'SK Bupati Luwu No. 188.45/DPMPTSP/2024 tentang Standar Pelayanan Fast-Track',
    regulations_en: 'Decree of Luwu Regent No. 188.45/DPMPTSP/2024 on Fast-Track Service Standards',
    regulations_zh: '鲁乌县长令第 188.45/DPMPTSP/2024 号《快捷通道政务服务标准》',
    targetCriteria: [
      'Investor Penanaman Modal (PMA/PMDN) skala menengah hingga besar di Kabupaten Luwu',
      'Pelaku usaha percepatan izin strategis (PBG Gedung Usaha, KKPR, OSS-RBA Berisiko Tinggi)',
      'Kelompok Rentan: Lansia (usia ≥ 60 tahun), Ibu Hamil, serta Ibu Menyusui dengan Balita',
      'Delegasi Kedinasan / Kunjungan Kerja Antar-Lembaga Pemerintah & BUMN'
    ],
    targetCriteria_en: [
      'Foreign & Domestic Capital Investors (PMA/PMDN) of medium to large scale in Luwu Regency',
      'Businesses accelerating strategic permits (Commercial PBG, Spatial KKPR, High-Risk OSS-RBA)',
      'Vulnerable Groups: Elderly (age ≥ 60), Pregnant Women, and Nursing Mothers with Toddlers',
      'Official Delegations / Inter-Agency Work Visits from Government & State Enterprises'
    ],
    targetCriteria_zh: [
      '鲁乌县辖区内的中大型内外资投资商 (PMA/PMDN)',
      '办理重大战略许可的企事业单位（商业建筑 PBG 许可证、空间规划 KKPR、高风险 OSS-RBA）',
      '脆弱与特别照顾群体：长者（≥ 60 岁）、孕妇及携婴幼儿母婴',
      '跨政府机关与国有企业 (BUMN) 的官方考察调研代表团'
    ],
    facilities: [
      'Executive VIP Investor Lounge ber-AC dengan sofa ergonomis & meja konsultasi privat',
      'Pendampingan khusus Liaison Officer (LO) One-on-One dari kedatangan hingga selesai',
      'Jalur Loket Bypass prioritas tanpa perlu menunggu di ruang tunggu umum',
      'Koneksi Internet Wi-Fi Dedicated Gigabit berkecepatan tinggi & charging station',
      'Complimentary refreshment (kopi Robusta Luwu, teh hangat, dan air mineral gratis)',
      'Akses langsung ke ruang rapat mediasi perizinan terpadu lintas OPD teknis'
    ],
    facilities_en: [
      'Air-conditioned Executive VIP Investor Lounge with ergonomic seating & private consultation desks',
      'One-on-One dedicated Liaison Officer (LO) guidance from arrival to completion',
      'Priority bypass counter lane without waiting in the general lobby',
      'High-speed dedicated Gigabit Wi-Fi connectivity & mobile device charging stations',
      'Complimentary refreshments (premium Luwu Robusta coffee, warm tea, and bottled water)',
      'Direct access to the integrated cross-departmental licensing mediation conference room'
    ],
    facilities_zh: [
      '配备人体工学沙发与私密洽谈桌的 VIP 投资人专属空调休息室',
      '联络官 (LO) 专人全程一对一陪同，从抵达到办理完毕',
      '专属优先快捷通道，无需在公共候诊大厅排队等候',
      '高速独享吉比特 (Gigabit) Wi-Fi 无线网络与设备充电站',
      '免费提供精选鲁乌罗布斯塔高山咖啡、热茶及矿泉水茶点',
      '直通跨部门技术会审与许可协调联合会议室'
    ],
    requirements: [
      'Kartu Tanda Penduduk (KTP-el) Pemohon / Kuasa Direksi yang sah',
      'Nomor Induk Berusaha (NIB) atau Bukti Rencana Investasi (bagi investor)',
      'Identitas pendukung khusus (bagi lansia / ibu hamil prioritas non-investasi)'
    ],
    requirements_en: [
      'Original e-KTP of Applicant / Valid Board of Directors Power of Attorney',
      'Business Identification Number (NIB) or Investment Plan Document (for investors)',
      'Special supporting ID (for elderly / pregnant women non-investment priority access)'
    ],
    requirements_zh: [
      '申请人电子身份证 (e-KTP) 原件或法定董事授权委托书',
      '企业统一社会信用代码 (NIB) 或项目投资计划意向书（投资者适用）',
      '特定群体身份证明（非投资类的长者、孕妇优先通道适用）'
    ],
    workflow: [
      { step: 1, title: 'Penyambutan di Front Office', desc: 'Petugas keamanan & resepsionis mengarahkan langsung ke Executive VIP Lounge.' },
      { step: 2, title: 'Pendampingan Personal LO', desc: 'Liaison Officer memvalidasi berkas dan mendampingi entri data perizinan.' },
      { step: 3, title: 'Pemrosesan Paralel Lintas OPD', desc: 'Verifikasi teknis dilakukan serentak tanpa pemohon berpindah-pindah loket.' },
      { step: 4, title: 'Penyerahan Dokumen & Pengawalan', desc: 'Dokumen perizinan diserahkan dalam map resmi eksklusif MPP Simpurusiang.' }
    ],
    workflow_en: [
      { step: 1, title: 'Front Office Reception', desc: 'Security officers & receptionists guide you directly to the Executive VIP Lounge.' },
      { step: 2, title: 'Personal LO Escort', desc: 'The Liaison Officer validates documents and assists with licensing data entry.' },
      { step: 3, title: 'Cross-Agency Parallel Processing', desc: 'Technical verification is executed simultaneously without moving between counters.' },
      { step: 4, title: 'Document Handover & Escort', desc: 'Official permit documents are delivered in an exclusive Simpurusiang MPP folder.' }
    ],
    workflow_zh: [
      { step: 1, title: '前台礼宾接待', desc: '安保与前台接待人员引导直达 Executive VIP 贵宾室。' },
      { step: 2, title: '联络官一对一服务', desc: '专属 LO 联络官协助整理材料并完成系统数据录入。' },
      { step: 3, title: '跨部门多轨并行审批', desc: '各部门技术审查同步展开，申请人无需跑多个窗口。' },
      { step: 4, title: '颁发文书礼宾送离', desc: '官方行政许可文书盛于 MPP Simpurusiang 专属封套中颁发。' }
    ],
    contactOfficer: {
      name: 'Tim Helpdesk Investasi Prioritas',
      role: 'Koordinator Gerai Fast-Track DPMPTSP Luwu',
      phone: '0811-4200-9999'
    },
    contactOfficer_en: {
      name: 'Priority Investment Helpdesk Team',
      role: 'Fast-Track Counter Coordinator DPMPTSP Luwu',
      phone: '0811-4200-9999'
    },
    contactOfficer_zh: {
      name: '重点投资项目服务团队',
      role: '鲁乌县 DPMPTSP 快捷窗口协调官',
      phone: '0811-4200-9999'
    }
  },

  'layanan-mandiri': {
    title_en: 'Digital Self-Service (E-Kiosk & ADM)',
    title_zh: '自助智慧政务 (E-Kiosk & ADM 终端)',
    badge_en: 'Self-Service Kiosk',
    badge_zh: '自助服务终端',
    description_en: 'Self-printing facilities for civil registry documents (e-KTP, KK, KIA) and licensing without counter queues.',
    description_zh: '人口户籍文书（e-KTP、户口簿、儿童卡）及企业许可的现场自助即时打印设施，免去窗口排队。',
    gallery: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200'
    ],
    location: 'Lobi Utama MPP Simpurusiang (Central E-Kiosk & ADM Station)',
    location_en: 'Main Lobby of Simpurusiang MPP (Central E-Kiosk & ADM Station)',
    location_zh: 'Simpurusiang 政务大厅中央大楼（中央 E-Kiosk 与 ADM 自助终端站）',
    sla: '3 - 7 Menit (Cetak Instan Mandiri)',
    sla_en: '3 - 7 Minutes (Instant Self-Service Printing)',
    sla_zh: '3 - 7 分钟（自助即时打印出件）',
    cost: 'Rp 0,- (Bebas Biaya Retribusi)',
    cost_en: 'IDR 0 (Free of Retribution Fees)',
    cost_zh: '0 印尼盾（免收任何行政规费）',
    regulations: 'Permendagri No. 109/2019 tentang Penerbitan Adminduk & Digitalisasi Layanan',
    regulations_en: 'Ministry of Home Affairs Reg No. 109/2019 on Civil Reg Issuance & Service Digitization',
    regulations_zh: '印尼内政部长令 2019 年第 109 号《人口登记电子化与数字政务规范》',
    targetCriteria: [
      'Masyarakat umum yang membutuhkan kecepatan cetak dokumen adminduk tanpa antre loket',
      'Pelaku UMKM mikro yang ingin melakukan pendaftaran NIB mandiri lewat portal OSS',
      'Warga pemegang KTP digital (IKD) yang ingin melakukan verifikasi biometrik mandiri',
      'Pemohon yang ingin mengambil nomor antrean digital terintegrasi sebelum waktu buka loket'
    ],
    targetCriteria_en: [
      'General public requiring instant civil registry printing without waiting in counter queues',
      'Micro-MSME operators wishing to register NIB self-service via the OSS portal',
      'Digital ID (IKD) holders performing self-service biometric verification',
      'Applicants issuing integrated digital queue tickets prior to counter opening hours'
    ],
    targetCriteria_zh: [
      '需要快速打印人口户籍文书且无需窗口排队的社会公众',
      '希望通过 OSS 系统自主申请企业 NIB 的微型小微企业主',
      '已开通数字身份证 (IKD) 需进行自助人脸生物识别核验的居民',
      '希望在窗口开放前提前获取综合数字排号票的办事人员'
    ],
    facilities: [
      '4 Unit Anjungan Dukcapil Mandiri (ADM) dengan sensor biometrik sidik jari & retina',
      '3 Terminal Komputer E-Kiosk Layar Sentuh 32 inch responsif berprosesor tinggi',
      'High-speed document scanner & laser printer khusus kertas sekuritas adminduk',
      'Pencetak Kartu Identitas Anak (KIA) dan KTP-el otomatis dengan waktu cetak < 90 detik',
      'Petugas IT Floater ramah yang selalu siaga di area kiosk untuk membimbing masyarakat',
      'Panduan visual infografis langkah demi langkah di setiap stasiun kerja'
    ],
    facilities_en: [
      '4 Independent Civil Registry Kiosks (ADM) with fingerprint & retina biometric sensors',
      '3 High-performance 32-inch responsive touch screen E-Kiosk computer terminals',
      'High-speed document scanner & laser printer with specialized security paper',
      'Automated Child ID Card (KIA) & e-KTP printers with print time < 90 seconds',
      'Friendly IT Floater staff on standby in the kiosk zone to assist citizens',
      'Step-by-step visual infographic guides at every workstation'
    ],
    facilities_zh: [
      '4 台配有指纹与虹膜生物特征识别的民政自助服务一体机 (ADM)',
      '3 台 32 英寸高灵敏度工业级触摸屏 E-Kiosk 自助服务终端',
      '带防伪安全纸张的高速文档扫描仪与激光双面打印机',
      '全自动儿童身份证 (KIA) 及 e-KTP 制作终端（单张耗时 < 90秒）',
      '在自助服务区随时巡视并指导群众操作的 IT 技术服务专员',
      '各自助操作台附带图文并茂的直观指引图解'
    ],
    requirements: [
      'Nomor Induk Kependudukan (NIK) dan Nomor Kartu Keluarga (KK)',
      'PIN aktivasi IKD / Nomor WhatsApp aktif untuk verifikasi kode OTP',
      'KTP-el lama (jika ingin mencetak penggantian KTP-el yang rusak)'
    ],
    requirements_en: [
      'National Identity Number (NIK) and Family Card Number (KK)',
      'IKD Activation PIN / Active WhatsApp Number for OTP Code Verification',
      'Old e-KTP (if printing a replacement for a damaged card)'
    ],
    requirements_zh: [
      '国民身分识别码 (NIK) 及户口簿编号 (KK)',
      '数字身份证 (IKD) 激活 PIN 码 / 接收 OTP 验证码的有效 WhatsApp',
      '旧电子身份证 (e-KTP) 原件（仅限损坏换领时需出示）'
    ],
    workflow: [
      { step: 1, title: 'Sentuh Layar & Scan Identitas', desc: 'Pindai barcode pada ponsel atau letakkan sidik jari pada mesin ADM.' },
      { step: 2, title: 'Pilih Dokumen yang Diinginkan', desc: 'Pilih opsi cetak KK, KIA, Akta Lahir, atau perizinan mandiri NIB.' },
      { step: 3, title: 'Verifikasi Kode OTP / Biometrik', desc: 'Sistem mencocokkan data langsung dengan database server pusat secara aman.' },
      { step: 4, title: 'Ambil Dokumen Fisik', desc: 'Dokumen dicetak instan dan siap digunakan dengan legalitas tanda tangan elektronik (TTE).' }
    ],
    workflow_en: [
      { step: 1, title: 'Touch Screen & Scan Identity', desc: 'Scan mobile barcode or place fingerprint on the ADM terminal scanner.' },
      { step: 2, title: 'Select Required Document', desc: 'Choose printing options for Family Card, Child ID, Birth Certificate, or NIB.' },
      { step: 3, title: 'OTP / Biometric Verification', desc: 'System safely verifies data directly against the central server database.' },
      { step: 4, title: 'Retrieve Physical Document', desc: 'Document prints instantly, complete with valid Electronic Signature (TTE).' }
    ],
    workflow_zh: [
      { step: 1, title: '触摸屏幕与扫码识别', desc: '扫描手机二维码或在 ADM 自助终端上放置指纹感应。' },
      { step: 2, title: '选择所需办理文书', desc: '点击选择打印户口簿、儿童卡、出生证明或 NIB 营业执照。' },
      { step: 3, title: '验证 OTP 码与生物特征', desc: '系统实时连接中央数据库完成安全身份数据校验。' },
      { step: 4, title: '即时打印领取文书', desc: '文书现场自动打印，附带官方法定电子签名 (TTE) 效力。' }
    ],
    contactOfficer: {
      name: 'Tim Pendamping Kiosk Mandiri',
      role: 'Divisi Teknologi Informasi MPP Luwu',
      phone: '0811-4200-8888'
    },
    contactOfficer_en: {
      name: 'Self-Service Kiosk Support Team',
      role: 'IT Division of Simpurusiang MPP Luwu',
      phone: '0811-4200-8888'
    },
    contactOfficer_zh: {
      name: '自助终端运维保障团队',
      role: '鲁乌政务大厅信息技术处',
      phone: '0811-4200-8888'
    }
  },

  'layanan-disabilitas': {
    title_en: 'Disability & Inclusive Services',
    title_zh: '无障碍与包容性政务服务',
    badge_en: 'Inclusive Access',
    badge_zh: '无障碍包容',
    description_en: 'Disability-friendly facilities equipped with tactile paving, wheelchairs, low counters, and sign language interpreters.',
    description_zh: '配有无障碍盲道、轮椅、低位服务窗口及专业手语翻译员的全方位无障碍设施。',
    gallery: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200'
    ],
    location: 'Lobi Selatan (Pintu Masuk Akses Khusus Difabel) & Loket Khusus Inklusif 01',
    location_en: 'South Lobby (Accessible Entrance for Disabled) & Inclusive Counter 01',
    location_zh: '南大门礼宾通道（残障无障碍专用入口）与 01 号包容性专席',
    sla: '10 - 25 Menit (Pendampingan Penuh)',
    sla_en: '10 - 25 Minutes (Full Escort Support)',
    sla_zh: '10 - 25 分钟（专人全程一对一陪同）',
    cost: 'Rp 0,- (100% Gratis & Ramah Difabel)',
    cost_en: 'IDR 0 (100% Free & Disability Friendly)',
    cost_zh: '0 印尼盾（100% 完全免费且无障碍）',
    regulations: 'PermenPAN-RB No. 9/2021 tentang Pedoman Pelayanan Ramah Kaum Rentan & Disabilitas',
    regulations_en: 'Ministerial Reg PAN-RB No. 9/2021 on Guidelines for Services to Vulnerable Groups',
    regulations_zh: '印尼国家机构改革与行政赋能部长令 2021 年第 9 号《弱势群体与残障人士无障碍服务指南》',
    targetCriteria: [
      'Penyandang disabilitas fisik (pengguna kursi roda, tongkat penyangga, kruk)',
      'Penyandang disabilitas sensorik netra (tunanetra low-vision maupun total)',
      'Penyandang disabilitas sensorik rungu/wicara (tuli dan bisu)',
      'Penyandang disabilitas intelektual & mental yang membutuhkan pendampingan sabar',
      'Lansia rentan dengan penurunan fungsi motorik'
    ],
    targetCriteria_en: [
      'Persons with physical disabilities (wheelchair users, crutch/cane users)',
      'Persons with visual impairments (low-vision and total blindness)',
      'Persons with hearing and speech impairments (deaf and mute)',
      'Persons with intellectual & mental disabilities requiring compassionate assistance',
      'Vulnerable seniors experiencing motor function decline'
    ],
    targetCriteria_zh: [
      '肢体残障人士（轮椅使用者、手杖与拐杖使用者）',
      '视力障碍人士（低视力及完全失明人士）',
      '听力及语言障碍人士（听障与语障群体）',
      '需要耐心引导协助的智力与精神障碍特殊群体',
      '行动不便的高龄脆弱长者'
    ],
    facilities: [
      'Jalur Pemandu (Tactile Paving / Guiding Block) berstandar dari drop-off ke loket',
      'Ramp landai dengan kemiringan 7° standar Permen PUPR dilengkapi pegangan tangan (handrail)',
      'Armada kursi roda manual & elektrik yang standby gratis di pintu masuk',
      'Loket Inklusif bertinggi rendah (75 cm) dengan ruang kaki lapang untuk kursi roda',
      'Petugas bersertifikasi Juru Bahasa Isyarat (JBI) untuk komunikasi ramah rungu-wicara',
      'Formulir & SOP layanan berhuruf Braille serta sistem antrean audio suara jernih',
      'Toilet khusus disabilitas berstandar internasional dengan tombol darurat (SOS Button)'
    ],
    facilities_en: [
      'Standard Tactile Paving (Guiding Blocks) continuous from drop-off to counter',
      'Standard 7° gentle sloping access ramp with handrails per PUPR Ministry norms',
      'Fleet of manual & electric wheelchairs standby free at the main entrance',
      'Low-height Inclusive Counter (75 cm) with spacious legroom for wheelchairs',
      'Certified Sign Language Interpreter (JBI) officers for deaf & mute communication',
      'Braille forms & SOPs, plus clear acoustic voice-guided queue system',
      'International standard accessible toilet with emergency SOS call button'
    ],
    facilities_zh: [
      '从车辆下客区贯通至服务窗口的盲道 (Tactile Paving)',
      '符合国家公共工程部标准的 7° 缓坡无障碍通道及双侧安全扶手',
      '入口处常备免费使用的手动与电动轮椅车队',
      '低位无障碍窗口 (75 cm)，为轮椅使用者留出充裕腿部空间',
      '持有专业证书的手语翻译员 (JBI) 协助听障语障人士沟通',
      '盲文版办事指南与申请表，以及高清晰度语音叫号提示系统',
      '符合国际标准的无障碍独立卫生间，配备紧急求助 (SOS) 按钮'
    ],
    requirements: [
      'KTP-el atau Kartu Penyandang Disabilitas (jika memiliki)',
      'Dokumen permohonan layanan dasar yang hendak diurus',
      'Surat kuasa khusus jika dikuasakan kepada pendamping resmi keluarga'
    ],
    requirements_en: [
      'e-KTP or Disability Identification Card (if available)',
      'Basic application documents corresponding to requested service',
      'Special power of attorney if handled by an official family caregiver'
    ],
    requirements_zh: [
      '电子身份证 (e-KTP) 或残疾人证（如有）',
      '所申请基础政务事项所需的相符材料',
      '若由直系家属陪同代理办，需提供授权委托书'
    ],
    workflow: [
      { step: 1, title: 'Penjemputan di Drop-Off', desc: 'Petugas LO Inklusif menyambut di pintu masuk dengan penyediaan kursi roda.' },
      { step: 2, title: 'Pengawalan ke Loket Khusus', desc: 'Pemohon diarahkan melalui jalur khusus tanpa perlu naik tangga.' },
      { step: 3, title: 'Pelayanan dengan Juru Bahasa Isyarat / Audio', desc: 'Proses konsultasi dan verifikasi dokumen berlangsung santai dan inklusif.' },
      { step: 4, title: 'Pengantaran Kembali', desc: 'Petugas memastikan dokumen diterima pemohon dan mengantar kembali hingga ke kendaraan.' }
    ],
    workflow_en: [
      { step: 1, title: 'Drop-Off Welcome', desc: 'Inclusive LO officers greet citizens at the entrance with wheelchair support.' },
      { step: 2, title: 'Escort to Inclusive Counter', desc: 'Applicants are guided through step-free barrier-free paths.' },
      { step: 3, title: 'Sign Language / Audio Service', desc: 'Consultation and document verification occur in a peaceful, inclusive setting.' },
      { step: 4, title: 'Return Escort', desc: 'Officers verify document delivery and safely escort citizen back to vehicle.' }
    ],
    workflow_zh: [
      { step: 1, title: '下客区礼宾迎接', desc: '无障碍专线礼宾员在入口处迎接并提供轮椅协助。' },
      { step: 2, title: '无障碍通道全程护送', desc: '引导办事群众通过无台阶专用盲道与无障通道直达窗口。' },
      { step: 3, title: '手语与语音无障碍办理', desc: '手语翻译员与专席人员提供耐心细致的材料核验与沟通。' },
      { step: 4, title: '文书送达与护送乘车', desc: '确认文书送达本人后，礼宾员护送至车旁协助安全离场。' }
    ],
    contactOfficer: {
      name: 'Tim Satgas Layanan Inklusif',
      role: 'Unit Respon Kaum Rentan MPP Simpurusiang',
      phone: '0811-4200-7777'
    },
    contactOfficer_en: {
      name: 'Inclusive Services Response Taskforce',
      role: 'Vulnerable Groups Unit of Simpurusiang MPP',
      phone: '0811-4200-7777'
    },
    contactOfficer_zh: {
      name: '无障碍包容性服务特别保障组',
      role: '鲁乌政务大厅弱势群体响应中心',
      phone: '0811-4200-7777'
    }
  }
};

interface MppServiceDetailModalProps {
  isOpen: boolean;
  service: ServiceDetailItem | null;
  onClose: () => void;
  onBookQueue?: (serviceTitle: string) => void;
  isDark?: boolean;
}

export const MppServiceDetailModal: React.FC<MppServiceDetailModalProps> = ({
  isOpen,
  service,
  onClose,
  onBookQueue,
  isDark = false,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [activeTab, setActiveTab] = useState<'specs' | 'gallery' | 'workflow'>('specs');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);

  if (!isOpen || !service) return null;

  // Gabungkan data dasar dan data spesifikasi lengkap
  const specData = DETAILED_SERVICE_SPECS[service.id] || {};
  const gallery = specData.gallery && specData.gallery.length > 0 ? specData.gallery : [service.image];
  
  const defaultLocation = isEn
    ? 'Luwu Regency Simpurusiang MPP, Jl. Jend. Sudirman, Belopa'
    : isZh
      ? '鲁乌县 Simpurusiang 政务大厅，Belopa 市 Jend. Sudirman 路'
      : 'MPP Simpurusiang Kabupaten Luwu, Jl. Jend. Sudirman, Belopa';

  const defaultSla = isEn ? '15 - 30 Mins' : isZh ? '15 - 30 分钟' : '15 - 30 Menit';
  const defaultCost = isEn ? 'IDR 0 (Free Official Service)' : isZh ? '0 印尼盾（官方法定免费）' : 'Rp 0,- (Gratis Resmi)';
  const defaultRegulations = isEn
    ? 'Simpurusiang MPP Public Service Standard Luwu Regency'
    : isZh
      ? '鲁乌县 Simpurusiang 政务中心公共服务标准'
      : 'Standar Pelayanan Publik MPP Simpurusiang Kab. Luwu';

  const defaultTargetCriteria = isEn ? [
    'General public of Luwu Regency holding official ID/Family Card',
    'Business actors & investors applying for official licensing'
  ] : isZh ? [
    '持有法定身份证件/户口簿的鲁乌县辖区居民',
    '申请官方经营许可的企业主与投资者'
  ] : [
    'Masyarakat umum Kabupaten Luwu pemegang KTP/KK resmi',
    'Pelaku usaha & investor yang mengajukan permohonan berizin'
  ];

  const defaultFacilities = isEn ? [
    'Clean air-conditioned waiting room with ergonomic seating',
    'Integrated digital queueing system with information displays',
    'Free Wi-Fi access and charging stations'
  ] : isZh ? [
    '整洁舒适的空调候诊等候区与人体工学座椅',
    '集成大屏信息显示屏的数字排号系统',
    '免费 Wi-Fi 无线网络与手机充电站'
  ] : [
    'Ruang tunggu bersih ber-AC dengan tempat duduk ergonomis',
    'Sistem antrean digital terintegrasi dengan layar monitor informasi',
    'Akses Wi-Fi gratis dan charging station'
  ];

  const defaultRequirements = isEn ? [
    'Original e-KTP / Valid Personal Identity Card',
    'Application documents corresponding to target counter'
  ] : isZh ? [
    '申请人原版电子身份证 (e-KTP) / 有效身份证明',
    '符合对应办理窗口要求的申请材料'
  ] : [
    'KTP-el Asli Pemohon / Identitas Diri yang berlaku',
    'Dokumen permohonan sesuai gerai OPD yang dituju'
  ];

  const defaultWorkflow = isEn ? [
    { step: 1, title: 'Lobby Registration', desc: 'Get ticket number or register online.' },
    { step: 2, title: 'Proceed to Integrated Counter', desc: 'Called according to ticket number for document verification.' },
    { step: 3, title: 'Document Completion', desc: 'Issuance of official service documents.' }
  ] : isZh ? [
    { step: 1, title: '大厅登记取号', desc: '在自助终端或在线获取排号票。' },
    { step: 2, title: '前往综合窗口', desc: '按叫号顺序前往窗口核验材料。' },
    { step: 3, title: '办理完成出证', desc: '核发官方法定政务服务文书。' }
  ] : [
    { step: 1, title: 'Registrasi di Lobi', desc: 'Ambil nomor antrean atau registrasi online.' },
    { step: 2, title: 'Menuju Loket Terpadu', desc: 'Dipanggil sesuai nomor antrean untuk verifikasi.' },
    { step: 3, title: 'Penyelesaian Dokumen', desc: 'Penerbitan dokumen resmi pelayanan.' }
  ];

  const defaultContactOfficer = isEn ? {
    name: 'Simpurusiang MPP Service Helpdesk',
    role: 'Information & Grievance Center',
    phone: '0811-4200-9999'
  } : isZh ? {
    name: 'Simpurusiang 政务服务咨询台',
    role: '信息咨询与诉求回应中心',
    phone: '0811-4200-9999'
  } : {
    name: 'Helpdesk Layanan MPP Simpurusiang',
    role: 'Pusat Informasi & Pengaduan',
    phone: '0811-4200-9999'
  };

  const serviceTitle = (isEn ? specData.title_en : isZh ? specData.title_zh : null) || service.title;
  const serviceBadge = (isEn ? specData.badge_en : isZh ? specData.badge_zh : null) || service.badge;
  const serviceDescription = (isEn ? specData.description_en : isZh ? specData.description_zh : null) || service.description;

  const location = (isEn ? specData.location_en : isZh ? specData.location_zh : specData.location) || defaultLocation;
  const sla = (isEn ? specData.sla_en : isZh ? specData.sla_zh : specData.sla) || defaultSla;
  const cost = (isEn ? specData.cost_en : isZh ? specData.cost_zh : specData.cost) || defaultCost;
  const regulations = (isEn ? specData.regulations_en : isZh ? specData.regulations_zh : specData.regulations) || defaultRegulations;
  const targetCriteria = (isEn ? specData.targetCriteria_en : isZh ? specData.targetCriteria_zh : specData.targetCriteria) || defaultTargetCriteria;
  const facilities = (isEn ? specData.facilities_en : isZh ? specData.facilities_zh : specData.facilities) || defaultFacilities;
  const requirements = (isEn ? specData.requirements_en : isZh ? specData.requirements_zh : specData.requirements) || defaultRequirements;
  const workflow = (isEn ? specData.workflow_en : isZh ? specData.workflow_zh : specData.workflow) || defaultWorkflow;
  const contactOfficer = (isEn ? specData.contactOfficer_en : isZh ? specData.contactOfficer_zh : specData.contactOfficer) || defaultContactOfficer;

  const IconComponent = service.icon || Star;

  return (
    <AnimatePresence>
      <div 
        id="mpp-service-detail-backdrop"
        className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-md bg-slate-950/70 font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          id="mpp-service-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-detail-title"
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative w-full h-full sm:h-auto max-w-4xl max-h-full sm:max-h-[92vh] bg-white dark:bg-slate-900 border-0 sm:border border-slate-200/80 dark:border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white font-sans"
        >
          {/* Header Bar dengan Tombol Tutup Presisi */}
          <div className="relative z-10 px-5 sm:px-7 py-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] sm:pt-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${service.iconContainerClass || 'bg-emerald-500/10 dark:bg-emerald-500/20'}`}>
                <IconComponent className={`w-5 h-5 ${service.iconColor || 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("mppPortal.serviceDetail.headerBadge", "Dokumentasi & Spesifikasi Resmi")}
                </span>
                <h2 id="service-detail-title" className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {serviceTitle}
                </h2>
              </div>
            </div>

            <button
              id="close-service-detail-modal-btn"
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label={t("mppPortal.serviceDetail.closeBtn", "Tutup")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Konten Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 p-4 sm:p-7 space-y-6">
            {/* Hero Showcase: Dokumentasi Foto HD & Keterangan Lokasi (Lebih Luas & Elegan) */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-xl bg-slate-950 group">
              <div 
                className="relative h-72 sm:h-80 md:h-96 w-full overflow-hidden cursor-pointer"
                onClick={() => setIsPhotoPreviewOpen(true)}
                title={t("mppPortal.serviceDetail.clickToEnlarge", "Klik untuk memperbesar foto")}
              >
                <img
                  src={gallery[selectedPhotoIndex] || service.image}
                  alt={`${service.title} - Foto ${selectedPhotoIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = service.image;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

                {/* Badges di Kiri Atas */}
                <div className="absolute top-3 sm:top-3.5 left-3 sm:left-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2 z-10">
                  <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-white/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-white text-[10px] sm:text-[11px] font-semibold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MPP Simpurusiang Certified</span>
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-bold tracking-wide uppercase px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-sm ${service.badgeClass || 'bg-white/90 text-slate-900 border-white/30'}`}>
                    {serviceBadge}
                  </span>
                </div>

                {/* Tombol Perbesar Foto di Kanan Atas */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhotoPreviewOpen(true);
                  }}
                  className="absolute top-3 sm:top-3.5 right-3 sm:right-3.5 z-20 flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-900 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md transition-all cursor-pointer hover:scale-105"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t("mppPortal.serviceDetail.enlargeHd", "Perbesar HD")}</span>
                </button>

                {/* Tombol Navigasi Kiri & Kanan di atas Foto */}
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoIndex(prev => (prev > 0 ? prev - 1 : gallery.length - 1));
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 shadow-md"
                      aria-label="Foto sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoIndex(prev => (prev < gallery.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 shadow-md"
                      aria-label="Foto berikutnya"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}

                {/* Overlay Keterangan di Atas Foto */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 text-white pointer-events-none">
                  <div className="space-y-1">
                    <p className="text-[11px] sm:text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {location}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-200 max-w-xl line-clamp-2 leading-relaxed">
                      {serviceDescription}
                    </p>
                  </div>

                  {/* Indikator Jumlah Foto */}
                  {gallery.length > 1 && (
                    <div className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-300 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/10 self-start sm:self-auto shrink-0">
                      {selectedPhotoIndex + 1} / {gallery.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnails Bar (Bila ada lebih dari 1 foto dokumentasi) */}
              {gallery.length > 1 && (
                <div className="p-2.5 sm:p-3 bg-slate-900/95 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {gallery.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                        selectedPhotoIndex === idx
                          ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/30'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photoUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Metrics Bar: SLA, Biaya, Regulasi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    {t("mppPortal.serviceDetail.slaLabel", "Standar SLA")}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {sla}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    {t("mppPortal.serviceDetail.costLabel", "Biaya / Tarif")}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {cost}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    {t("mppPortal.serviceDetail.zoneLabel", "Zona Layanan")}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                    MPP Simpurusiang
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Interaktif */}
            <div className="flex border-b border-slate-200 dark:border-white/10 gap-2">
              {[
                { id: 'specs', label: t("mppPortal.serviceDetail.tabSpecs", "Spesifikasi & Kriteria"), icon: Info },
                { id: 'workflow', label: t("mppPortal.serviceDetail.tabWorkflow", "Alur & SOP Pelayanan"), icon: Layers },
                { id: 'gallery', label: t("mppPortal.serviceDetail.tabSarpras", "Kelengkapan Sarpras"), icon: Sparkles }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Konten Berdasarkan Tab Aktif */}
            <div className="space-y-5 pt-1">
              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Kriteria Penerima / Sasaran Layanan */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                      <Users className="w-4 h-4" />
                      <h4>{t("mppPortal.serviceDetail.targetCriteriaTitle", "Kriteria Sasaran Pemohon")}</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {targetCriteria.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Persyaratan Dokumen yang Wajib Dibawa */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm">
                      <FileText className="w-4 h-4" />
                      <h4>{t("mppPortal.serviceDetail.requirementsTitle", "Persyaratan Dokumen")}</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/10">
                      {t("mppPortal.serviceDetail.legalBase", "Dasar Hukum:")} <span className="font-medium text-slate-700 dark:text-slate-300">{regulations}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'workflow' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      {t("mppPortal.serviceDetail.workflowTitle", "Alur Tahapan Pelayanan Terpadu")}
                    </h4>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      SLA: {sla}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {workflow.map((step) => (
                      <div
                        key={step.step}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-white/10 flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                          {step.step}
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {step.title}
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {t("mppPortal.serviceDetail.facilitiesTitle", "Spesifikasi Fasilitas & Sarana Prasarana")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {facilities.map((fac, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-white/10 flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{fac}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Kontak Pendamping Khusus */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {t("mppPortal.serviceDetail.loTitle", "Bantuan Langsung / Liaison Officer (LO)")}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {contactOfficer.name} ({contactOfficer.role})
                  </div>
                </div>
              </div>

              <a
                href={`https://wa.me/6281142009999?text=${encodeURIComponent(
                  isEn
                    ? `Hello MPP Simpurusiang Helpdesk, I would like to inquire about specifications and requirements for ${serviceTitle}`
                    : isZh
                      ? `您好，MPP Simpurusiang 咨询台，我想咨询关于 ${serviceTitle} 的办理规格与要求`
                      : `Halo Helpdesk MPP Simpurusiang, saya ingin bertanya mengenai spesifikasi dan syarat ${serviceTitle}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-bold transition-colors flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <span>{t("mppPortal.serviceDetail.consultationWa", "Konsultasi WA")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Footer Aksi Presisi: Daftar Antrean atau Kembali */}
          <div className="p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-6 border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              {t("mppPortal.serviceDetail.understandNotice", "Sudah memahami spesifikasi? Lanjutkan untuk mengambil nomor antrean resmi.")}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {t("mppPortal.serviceDetail.closeBtn", "Tutup")}
              </button>

              <button
                id="book-queue-from-detail-modal-btn"
                type="button"
                onClick={() => {
                  if (onBookQueue) {
                    onBookQueue(serviceTitle);
                  }
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group font-['Plus_Jakarta_Sans',sans-serif]"
              >
                <Calendar className="w-4 h-4 text-slate-950" />
                <span>{t("mppPortal.serviceDetail.bookQueueBtn", "Daftar Antrean")}</span>
                <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Fullscreen HD Photo Lightbox */}
        <AnimatePresence>
          {isPhotoPreviewOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
              onClick={() => setIsPhotoPreviewOpen(false)}
            >
              {/* Top Bar Lightbox */}
              <div className="flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
                <div className="text-white">
                  <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>{serviceTitle}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {isEn
                        ? `Photo ${selectedPhotoIndex + 1} of ${gallery.length}`
                        : isZh
                          ? `照片 ${selectedPhotoIndex + 1} / ${gallery.length}`
                          : `Foto ${selectedPhotoIndex + 1} dari ${gallery.length}`}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {location}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPhotoPreviewOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Tutup preview foto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Image in Lightbox */}
              <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4" onClick={(e) => e.stopPropagation()}>
                {gallery.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIndex(prev => (prev > 0 ? prev - 1 : gallery.length - 1))}
                    className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg"
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                <motion.img
                  key={selectedPhotoIndex}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  src={gallery[selectedPhotoIndex] || service.image}
                  alt={`${serviceTitle} - Foto ${selectedPhotoIndex + 1}`}
                  className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10"
                />

                {gallery.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIndex(prev => (prev < gallery.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg"
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnails Strip in Lightbox */}
              {gallery.length > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10" onClick={(e) => e.stopPropagation()}>
                  {gallery.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedPhotoIndex === idx
                          ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/50'
                          : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
