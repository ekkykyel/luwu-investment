import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  ShieldCheck, Clock, Award, CheckCircle2, Zap, 
  FileCheck, AlertTriangle, ArrowRight, Sparkles, 
  Building2, Scale, HeartHandshake, Eye, Info, FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AntiCorruptionBanner } from './AntiCorruptionBanner';
import { Badge, type BadgeTone } from '../common/Badge';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';
import { MaklumatModal } from './MaklumatModal';

interface SlaItem {
  id: string;
  category: 'perizinan' | 'kependudukan' | 'perpajakan' | 'agraria' | 'kesehatan' | 'kepolisian';
  serviceName: string;
  agencyName: string;
  targetSla: string;
  targetMinutes: number;
  actualAvgMinutes: number;
  cost: string;
  productType: string;
  complianceRate: number; // percentage
  status: 'optimal' | 'fast' | 'warning';
}

const SLA_DATA: SlaItem[] = [
  {
    id: 'nib-oss',
    category: 'perizinan',
    serviceName: 'Penerbitan NIB Usaha (OSS RBA Risiko Rendah)',
    agencyName: 'DPMPTSP KAB. LUWU',
    targetSla: 'Maks. 15 Menit',
    targetMinutes: 15,
    actualAvgMinutes: 11,
    cost: 'Rp 0,- (Gratis Bebas Retribusi)',
    productType: '📄 Nomor Induk Berusaha (NIB) Resmi BKPM RI',
    complianceRate: 99.4,
    status: 'fast'
  },
  {
    id: 'ktp-el',
    category: 'kependudukan',
    serviceName: 'Pencetakan & Penggantian KTP-el / KIA',
    agencyName: 'DISDUKCAPIL KAB. LUWU',
    targetSla: 'Maks. 30 Menit (Siap Cetak)',
    targetMinutes: 30,
    actualAvgMinutes: 18,
    cost: 'Rp 0,- (Gratis Bebas Retribusi)',
    productType: '🪪 KTP Elektronik / KIA Berchip Aktif',
    complianceRate: 98.6,
    status: 'optimal'
  },
  {
    id: 'akta-kelahiran',
    category: 'kependudukan',
    serviceName: 'Penerbitan Akta Kelahiran & Kartu Keluarga Baru',
    agencyName: 'DISDUKCAPIL KAB. LUWU',
    targetSla: 'Maks. 45 Menit',
    targetMinutes: 45,
    actualAvgMinutes: 28,
    cost: 'Rp 0,- (Gratis Bebas Retribusi)',
    productType: '📜 Akta Kelahiran Tanda Tangan Elektronik (TTE) & KK',
    complianceRate: 97.9,
    status: 'optimal'
  },
  {
    id: 'pbg-simbg',
    category: 'perizinan',
    serviceName: 'Persetujuan Bangunan Gedung (PBG SIMBG Teknis)',
    agencyName: 'DINAS PUPTR & DPMPTSP',
    targetSla: 'Maks. 3 Hari Kerja',
    targetMinutes: 1440,
    actualAvgMinutes: 960,
    cost: 'Sesuai Perda Retribusi Bangunan',
    productType: '🏛️ Sertifikat PBG Definitif & Dokumen Teknis',
    complianceRate: 96.8,
    status: 'optimal'
  },
  {
    id: 'pbb-bphtb',
    category: 'perpajakan',
    serviceName: 'Validasi Pajak BPHTB & Mutasi SPPT PBB-P2',
    agencyName: 'BAPENDA KAB. LUWU',
    targetSla: 'Maks. 20 Menit',
    targetMinutes: 20,
    actualAvgMinutes: 14,
    cost: 'Rp 0,- (Gratis Administrasi Validasi)',
    productType: '📑 Lembar SSPD BPHTB Tervalidasi Bank Sulselbar',
    complianceRate: 99.1,
    status: 'fast'
  },
  {
    id: 'sertifikat-roya',
    category: 'agraria',
    serviceName: 'Penghapusan Hak Tanggungan (Roya) Elektronik',
    agencyName: 'KANTOR PERTANAHAN / BPN LUWU',
    targetSla: 'Maks. 1 Hari Kerja',
    targetMinutes: 480,
    actualAvgMinutes: 320,
    cost: 'Sesuai PNBP PP 128/2015 (Rp 50.000)',
    productType: '📑 Sertifikat Tanah Bersih Bebas Tanggungan',
    complianceRate: 97.4,
    status: 'optimal'
  },
  {
    id: 'bpjs-mutasi',
    category: 'kesehatan',
    serviceName: 'Perubahan Faskes & Penambahan Anggota BPJS',
    agencyName: 'BPJS KESEHATAN KAB. LUWU',
    targetSla: 'Maks. 15 Menit',
    targetMinutes: 15,
    actualAvgMinutes: 9,
    cost: 'Rp 0,- (Gratis Tanpa Biaya)',
    productType: '💳 Kartu Indonesia Sehat (KIS) Digital Aktif',
    complianceRate: 99.7,
    status: 'fast'
  },
  {
    id: 'skck-polres',
    category: 'kepolisian',
    serviceName: 'Penerbitan & Perpanjangan SKCK',
    agencyName: 'POLRES LUWU',
    targetSla: 'Maks. 20 Menit',
    targetMinutes: 20,
    actualAvgMinutes: 14,
    cost: 'Sesuai PP 76/2020 (Rp 30.000,-)',
    productType: '📄 Lembar SKCK Resmi Berhologram',
    complianceRate: 98.5,
    status: 'optimal'
  },
  {
    id: 'pkb-samsat',
    category: 'perpajakan',
    serviceName: 'Pembayaran Pajak Kendaraan Bermotor (PKB)',
    agencyName: 'SAMSAT KAB. LUWU',
    targetSla: 'Maks. 15 Menit',
    targetMinutes: 15,
    actualAvgMinutes: 10,
    cost: 'Sesuai Nilai Pajak Kendaraan',
    productType: '🧾 Pengesahan STNK & Cetak SKPD',
    complianceRate: 99.2,
    status: 'fast'
  }
];

export function MppMaklumatSlaRadar({ isDark = false }: { isDark?: boolean }) {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [isMaklumatExpanded, setIsMaklumatExpanded] = useState<boolean>(false);
  const [isMaklumatModalOpen, setIsMaklumatModalOpen] = useState<boolean>(false);

  const localizedSlaData = SLA_DATA.map(item => {
    if (isEn) {
      if (item.id === 'nib-oss') {
        return { ...item, serviceName: 'Business Identification Number (OSS RBA Low Risk)', targetSla: 'Max. 15 Mins', cost: 'IDR 0 (Free of Charge)', productType: '📄 Official NIB BKPM RI' };
      }
      if (item.id === 'ktp-el') {
        return { ...item, serviceName: 'e-KTP / Child ID Card Printing & Replacement', targetSla: 'Max. 30 Mins (Ready to Print)', cost: 'IDR 0 (Free)', productType: '🪪 e-KTP / KIA Card with Active Chip' };
      }
      if (item.id === 'akta-kelahiran') {
        return { ...item, serviceName: 'Birth Certificate & New Family Card Issuance', targetSla: 'Max. 45 Mins', cost: 'IDR 0 (Free)', productType: '📜 Digitally Signed Birth Certificate & KK' };
      }
      if (item.id === 'pbg-simbg') {
        return { ...item, serviceName: 'Building Approval (PBG SIMBG Technical)', targetSla: 'Max. 3 Work Days', cost: 'According to Building Retribution Bylaw', productType: '🏛️ Definitive PBG Certificate & Tech Specs' };
      }
      if (item.id === 'pbb-bphtb') {
        return { ...item, serviceName: 'BPHTB Tax Validation & PBB Mutation', targetSla: 'Max. 20 Mins', cost: 'IDR 0 (Free Admin)', productType: '📑 Validated BPHTB SSPD Bank Sulselbar' };
      }
      if (item.id === 'sertifikat-roya') {
        return { ...item, serviceName: 'Electronic Mortgage Discharge (Roya)', targetSla: 'Max. 1 Work Day', cost: 'Official PNBP PP 128/2015 (Rp 50,000)', productType: '📑 Clean Land Title Certificate' };
      }
      if (item.id === 'bpjs-mutasi') {
        return { ...item, serviceName: 'Healthcare Facility Change & BPJS Member Addition', targetSla: 'Max. 15 Mins', cost: 'IDR 0 (Free)', productType: '💳 Active Digital Healthy Indonesia Card' };
      }
      if (item.id === 'skck-polres') {
        return { ...item, serviceName: 'SKCK Police Clearance Certificate Issuance & Renewal', targetSla: 'Max. 20 Mins', cost: 'Per PP 76/2020 (IDR 30,000)', productType: '📄 Official Holographic SKCK Certificate' };
      }
      if (item.id === 'pkb-samsat') {
        return { ...item, serviceName: 'Motor Vehicle Tax Payment (PKB SAMSAT)', targetSla: 'Max. 15 Mins', cost: 'According to Vehicle Tax Assessment', productType: '🧾 STNK Validation & Printed SKPD Tax Receipt' };
      }
    } else if (isZh) {
      if (item.id === 'nib-oss') {
        return { ...item, serviceName: '低风险商业登记证 (OSS RBA NIB) 核发', targetSla: '最多 15 分钟', cost: '0 印尼盾（完全免费）', productType: '📄 印尼投资协调委员会 (BKPM) 官方 NIB' };
      }
      if (item.id === 'ktp-el') {
        return { ...item, serviceName: '电子身份证 (e-KTP) / 儿童卡 (KIA) 打印与更换', targetSla: '最多 30 分钟', cost: '0 印尼盾（完全免费）', productType: '🪪 带芯片电子身份证 / 儿童身份证' };
      }
      if (item.id === 'akta-kelahiran') {
        return { ...item, serviceName: '出生证明与新户口簿 (KK) 核发', targetSla: '最多 45 分钟', cost: '0 印尼盾（完全免费）', productType: '📜 电子签名 (TTE) 出生证明及户口簿' };
      }
      if (item.id === 'pbg-simbg') {
        return { ...item, serviceName: '建筑物批准 (PBG SIMBG 技术审查)', targetSla: '最多 3 个工作日', cost: '依据地方建筑规费条例', productType: '🏛️ 法定 PBG 证书及技术规范文件' };
      }
      if (item.id === 'pbb-bphtb') {
        return { ...item, serviceName: '契税 (BPHTB) 验证与房产税 (PBB) 变更', targetSla: '最多 20 分钟', cost: '0 印尼盾（免费行政验证）', productType: '📑 Sulselbar 银行验证 BPHTB 凭单' };
      }
      if (item.id === 'sertifikat-roya') {
        return { ...item, serviceName: '电子抵押权注销 (Roya)', targetSla: '最多 1 个工作日', cost: '官方规费 50,000 印尼盾', productType: '📑 无抵押负担土地产权证书' };
      }
      if (item.id === 'bpjs-mutasi') {
        return { ...item, serviceName: '医保 (BPJS) 定点变更与家庭成员新增', targetSla: '最多 15 分钟', cost: '0 印尼盾（完全免费）', productType: '💳 激活状态电子健康卡 (KIS)' };
      }
      if (item.id === 'skck-polres') {
        return { ...item, serviceName: '无犯罪记录证明 (SKCK) 新办与延期', targetSla: '最多 20 分钟', cost: '依据第76/2020号条例 (30,000印尼盾)', productType: '📄 带全息防伪官方 SKCK 证明' };
      }
      if (item.id === 'pkb-samsat') {
        return { ...item, serviceName: '机动车车辆税 (PKB SAMSAT) 缴纳与审验', targetSla: '最多 15 分钟', cost: '依据机动车应纳税额', productType: '🧾 行驶证审验与完税证明 (SKPD)' };
      }
    }
    return item;
  });

  const filteredSla = activeCategory === 'semua'
    ? localizedSlaData
    : localizedSlaData.filter(item => item.category === activeCategory);

  const avgCompliance = (localizedSlaData.reduce((acc, curr) => acc + curr.complianceRate, 0) / localizedSlaData.length).toFixed(1);

  return (
    <section 
      id="maklumat-pelayanan-sla"
      className="w-full max-w-6xl mx-auto py-10 sm:py-14 px-3 sm:px-6 lg:px-8 relative scroll-mt-36 sm:scroll-mt-40"
    >
      {/* Header Section — Standardized Zero-Pill Eyebrow & Typography */}
      <div className="w-full max-w-3xl mx-auto text-center mb-8 sm:mb-12">
        <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-block mb-2`}>
          {isEn ? 'Public Service Standards (Law No. 25/2009)' : isZh ? '法定公共服务标准体系 (第25/2009号法案)' : 'Standar Birokrasi Pelayanan Publik (UU No. 25/2009)'}
        </span>
        <h2 className={MPP_TYPOGRAPHY.sectionTitle}>
          {isEn ? 'Service Charter & ' : isZh ? '政务服务公开承诺与 ' : 'Maklumat Pelayanan & '}
          <span className="text-emerald-700 dark:text-emerald-500">
            {isEn ? 'Real-Time SLA Radar' : isZh ? '实时服务时效 (SLA) 雷达' : 'SLA Radar Waktu Nyata'}
          </span>
        </h2>
        <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} mt-2.5 max-w-2xl mx-auto`}>
          {isEn 
            ? 'Integrity pledge of Luwu Regency: guaranteed processing time limits, zero illicit fee enforcement, and complete service transparency.'
            : isZh
            ? '鲁乌县政府廉洁与效能公开承诺：保障审批办结时限、执行法定零规费制度、全面实现阳光透明服务。'
            : 'Komitmen integritas birokrasi Pemerintah Kabupaten Luwu: jaminan transparansi waktu pelayanan (SLA), kepastian biaya nol pungli, dan kepatuhan standar pelayanan publik.'}
        </p>
      </div>

      {/* Centered Vertical Stack for Maklumat & Zona Integritas (Top-to-Bottom) */}
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8 mb-12">
        {/* Top Card: Official Government Pledge Card (Maklumat Pelayanan Publik) — Standardized Card Utama (p-5 sm:p-6, rounded-2xl, Layer 1) */}
        <div className={`${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer1} relative overflow-hidden w-full`}>
          <div className="relative z-10 w-full h-full flex flex-col justify-between">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200/80 dark:border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${MPP_CARD_SURFACE.layer2} flex items-center justify-center shrink-0`}>
                  <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1">
                    HALAMAN: MAKLUMAT PELAYANAN PUBLIK
                  </span>
                  <h3 className={`${MPP_TYPOGRAPHY.cardTitle} mt-0.5 text-slate-900 dark:text-white`}>
                    {isEn ? 'Public Service Delivery Charter' : isZh ? '公共政务综合服务履职公开承诺书' : 'Maklumat Penyelenggaraan Pelayanan Publik'}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="category"
                  tone="primary"
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                >
                  SLA: {avgCompliance}%
                </Badge>
                <button
                  type="button"
                  onClick={() => setIsMaklumatModalOpen(true)}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Charter' : isZh ? '公报' : 'Piagam'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMaklumatExpanded(!isMaklumatExpanded)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold ${MPP_CARD_SURFACE.layer2} text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5`}
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>{isMaklumatExpanded ? (isEn ? 'Collapse' : isZh ? '收起' : 'Ringkas') : (isEn ? 'Details' : isZh ? '详情' : 'Rincian')}</span>
                </button>
              </div>
            </div>

            {/* Official Pledge Text — Intentional Formal Charter Serif Typography (Layer 2 Sub-box) */}
            <div className="pt-4 sm:pt-5 space-y-3 flex-1 flex flex-col justify-between">
              <div className="relative">
                <blockquote 
                  className={`text-xs sm:text-sm md:text-base italic font-serif leading-relaxed font-extrabold px-4 py-4 sm:px-6 sm:py-5 rounded-xl text-justify mx-auto w-full border shadow-sm ${
                    isDark 
                      ? 'bg-[#143755] border-white/10 text-slate-100' 
                      : 'bg-emerald-50/90 border-emerald-300/80 text-slate-900 shadow-md'
                  }`}
                  style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                >
                  <span className="text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 font-serif leading-none mr-1 select-none font-bold">“</span>
                  {isEn 
                    ? 'Herewith, we the leadership and all personnel of Mal Pelayanan Publik (MPP) Simpurusiang Luwu Regency solemnly pledge and state our capability to deliver services in strict compliance with established Standards, ensuring ease, transparency, and time certainty. If we fail to fulfill this promise, we are fully prepared to accept sanctions in accordance with applicable laws.'
                    : isZh
                    ? '在此，鲁乌县辛普鲁西亚公共服务大厅领导班子与全体工作人员庄严承诺：严格依照法定服务标准开展各项政务与行政审批，确保办事便捷、流程透明、时效确定。若未履行政诺，愿依法依规接受严格惩戒。'
                    : 'Dengan ini, kami pimpinan dan segenap aparatur Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu berjanji dan menyatakan sanggup menyelenggarakan pelayanan sesuai Standar Pelayanan yang telah ditetapkan, memberikan kemudahan, transparansi, serta kepastian waktu, dan apabila kami tidak menepati janji ini, kami siap menerima sanksi sesuai dengan peraturan perundang-undangan yang berlaku.'}
                  <span className="text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 font-serif leading-none ml-1 select-none font-bold">”</span>
                </blockquote>
              </div>

              <AnimatePresence>
                {isMaklumatExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <strong className="text-emerald-700 dark:text-emerald-300 block mb-1">
                          {isEn ? '1. Zero-Fee Transparency' : isZh ? '1. 规范零规费与价格透明' : '1. Anti-Pungli & Transparansi Biaya'}
                        </strong>
                        <p className="text-[11px] leading-relaxed">
                          {isEn ? 'All core permits are Rp 0,- (Free). Official tax & non-tax revenues are processed solely via bank counters or verified QRIS/VA channels.' : isZh ? '基础行政审批均为零收费（免费）。法定税费一律由银行窗口 or 官方QRIS/虚拟账户收缴。' : 'Seluruh proses perizinan dasar berbiaya Rp 0,- (Gratis). Pembayaran retribusi/PNBP resmi hanya melalui loket kas bank atau kanal QRIS/VA resmi.'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                        <strong className="text-teal-700 dark:text-teal-300 block mb-1">
                          {isEn ? '2. SLA Time Guarantee' : isZh ? '2. 时限超期兜底保障 (SLA)' : '2. Jaminan Batas Waktu (SLA)'}
                        </strong>
                        <p className="text-[11px] leading-relaxed">
                          {isEn ? 'If complete applications exceed the SLA deadline, the applicant receives priority resolution and document home-delivery compensation.' : isZh ? '如申报材料齐全但超时未办结，申请人将享受专班特快通道及纸质批件免费寄送到家补偿。' : 'Apabila permohonan yang berkasnya lengkap melampaui batas SLA, pemohon berhak mendapatkan prioritas penyelesaian khusus dan kompensasi pengantaran dokumen ke rumah.'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <strong className="text-blue-700 dark:text-blue-300 block mb-1">
                          {isEn ? '3. Inclusive & Barrier-Free' : isZh ? '3. 无障碍包容性无差别服务' : '3. Layanan Inklusif & Bebas Diskriminasi'}
                        </strong>
                        <p className="text-[11px] leading-relaxed">
                          {isEn ? 'Persons with disabilities, seniors 60+, and pregnant mothers are granted dedicated counters, tactile tracks, and direct assistance.' : isZh ? '为残障人士、60岁以上长者及孕妇提供低位窗口、盲道指引及免排队直通帮办服务。' : 'Penyandang disabilitas, lansia di atas 60 tahun, dan ibu hamil mendapatkan fasilitas loket meja rendah, jalur pemandu, serta asistensi petugas tanpa antrean umum.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>{isEn ? 'Signed by: Head of DPMPTSP Luwu Regency' : isZh ? '签署人：印尼鲁乌县投资与一站式服务局局长' : 'Tertanda: Kepala Dinas PMPTSP Kabupaten Luwu'}</span>
                      <span>{isEn ? 'Updated according to Regent of Luwu Service Standards Decree' : isZh ? '依据鲁乌县长公共服务标准令定期更新' : 'Diperbarui secara berkala sesuai SK Bupati Luwu Standar Pelayanan'}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom Card: Spanduk & Komitmen Zona Integritas */}
        <div className="w-full">
          <AntiCorruptionBanner 
            isDark={isDark} 
            className="w-full max-w-none px-0 pt-0 pb-0 shadow-none border-none bg-transparent"
          />
        </div>
      </div>

      {/* 2. SLA Radar (Standar Waktu Nyata Matrix) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>{isEn ? 'Service Speed & SLA Radar (Real-Time)' : isZh ? '服务时效与精准度雷达 (SLA)' : 'Radar Kecepatan & Ketepatan Waktu Pelayanan (SLA)'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn ? 'Comparison of official Service Standard (SP) targets vs real daily average completion times' : isZh ? '官方法定服务标准时限与实际日均办结耗时对照' : 'Perbandingan target Standar Pelayanan (SP) resmi vs realisasi rata-rata waktu penyelesaian harian'}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x snap-x snap-mandatory">
            {[
              { id: 'semua', label: isEn ? 'All (9)' : isZh ? '全部 (9)' : 'Semua Layanan (9)' },
              { id: 'perizinan', label: isEn ? 'Business' : isZh ? '企业许可' : 'Perizinan Usaha' },
              { id: 'kependudukan', label: isEn ? 'Civil Reg' : isZh ? '户籍民政' : 'Kependudukan' },
              { id: 'perpajakan', label: isEn ? 'Tax & SAMSAT' : isZh ? '财税交警' : 'Perpajakan & SAMSAT' },
              { id: 'agraria', label: isEn ? 'Agrarian' : isZh ? '土地' : 'Agraria / BPN' },
              { id: 'kesehatan', label: isEn ? 'Health' : isZh ? '医疗' : 'Kesehatan / BPJS' },
              { id: 'kepolisian', label: isEn ? 'Police (SKCK)' : isZh ? '警务 (SKCK)' : 'Polres (SKCK)' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap snap-start cursor-pointer active:scale-95 ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* SLA Grid Cards — Standardized Card Utama (p-5 sm:p-6, rounded-2xl, Layer 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSla.map((item, idx) => {
            const categoryThemes: Record<string, { tone: BadgeTone; bar: string }> = {
              perizinan: {
                tone: 'info',
                bar: 'from-sky-400 via-blue-500 to-blue-600',
              },
              kependudukan: {
                tone: 'primary',
                bar: 'from-emerald-400 to-emerald-500',
              },
              perpajakan: {
                tone: 'success',
                bar: 'from-teal-500 via-emerald-500 to-teal-600',
              },
              agraria: {
                tone: 'success',
                bar: 'from-teal-400 via-teal-500 to-emerald-500',
              },
              kesehatan: {
                tone: 'primary',
                bar: 'from-emerald-500 via-teal-500 to-emerald-600',
              },
              kepolisian: {
                tone: 'info',
                bar: 'from-blue-500 via-sky-500 to-blue-600',
              },
            };

            const theme = categoryThemes[item.category] || categoryThemes.perizinan;

            return (
              <motion.div
                key={item.id}
                layout={!shouldReduceMotion}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.35, delay: idx * 0.04, ease: "easeOut" }}
                whileHover={shouldReduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
                style={{ willChange: 'transform' }}
                className={`${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingLg} transition-all duration-200 hover:border-emerald-500/40 dark:hover:border-white/[0.14] flex flex-col justify-between relative group`}
              >
                <div className="space-y-3">
                  {/* Top Tags — Standardized <Badge variant="category"> */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="category" tone={theme.tone}>
                      {item.agencyName}
                    </Badge>
                    <span className={`${MPP_TYPOGRAPHY.meta} font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0`}>
                      <span>⚡</span>
                      <span>{item.complianceRate}% On-Time</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className={`${MPP_TYPOGRAPHY.cardTitle} min-h-[2.5rem] flex items-center`}>
                    {item.serviceName}
                  </h4>

                  {/* Output / Metadata */}
                  <p className={`${MPP_TYPOGRAPHY.cardBody} flex items-center gap-1.5`}>
                    <span className="truncate">{item.productType}</span>
                  </p>

                  {/* SLA Target vs Actual Visualizer — Layer 2 (#143755) */}
                  <div className={`p-3.5 ${MPP_CARD_SURFACE.radiusSub} ${MPP_CARD_SURFACE.layer2} space-y-2.5 mt-2`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        {t('sla.target_label', isEn ? 'Target SLA:' : isZh ? 'SLA 目标:' : 'Target SLA:')}
                      </span>
                      <strong className="text-slate-900 dark:text-white font-mono font-extrabold">
                        {item.targetSla}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-semibold">
                        <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {t('sla.realization_label', isEn ? 'Average Realization:' : isZh ? '平均实际耗时:' : 'Realisasi Rata-rata:')}
                      </span>
                      <span className="font-mono font-extrabold text-emerald-800 dark:text-emerald-300">
                        {item.actualAvgMinutes >= 480 
                          ? `${(item.actualAvgMinutes / 480).toFixed(1)} ${isEn ? 'Work Days' : isZh ? '个工作日' : 'Hari Kerja'}` 
                          : `${item.actualAvgMinutes} ${isEn ? 'Minutes' : isZh ? '分钟' : 'Menit'}`}
                      </span>
                    </div>

                    {/* Progress Bar with GPU ScaleX */}
                    <div className="w-full bg-slate-200 dark:bg-[#0A2238] h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={shouldReduceMotion ? false : { scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 + idx * 0.04, ease: "easeOut" }}
                        style={{
                          transformOrigin: 'left',
                          width: `${Math.min(100, Math.round((item.actualAvgMinutes / item.targetMinutes) * 100))}%`,
                          willChange: 'transform'
                        }}
                        className={`bg-gradient-to-r ${theme.bar} h-full rounded-full origin-left`}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Area Cleanup */}
                <div className="border-t border-slate-200/80 dark:border-white/[0.07] mt-4 pt-4 flex justify-between items-center text-xs">
                  <span className={`${MPP_TYPOGRAPHY.meta} text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[62%]`}>
                    {item.cost}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('layanan') || document.getElementById('instansi');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="font-extrabold text-emerald-800 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors shrink-0 px-1 py-0.5 active:scale-95 group/btn"
                  >
                    <span className="whitespace-nowrap">{t('sla.check_req', isEn ? 'Check Requirements ➔' : isZh ? '查看申请条件 ➔' : 'Cek Syarat ➔')}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <MaklumatModal 
        isOpen={isMaklumatModalOpen} 
        onClose={() => setIsMaklumatModalOpen(false)} 
        isDark={isDark} 
      />
    </section>
  );
}
