import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Clock, Award, CheckCircle2, Zap, 
  FileCheck, AlertTriangle, ArrowRight, Sparkles, 
  Building2, Scale, HeartHandshake, Eye, Info,
  AlertCircle, PhoneCall, ExternalLink, X, FileText, Megaphone
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AntiCorruptionBanner } from './AntiCorruptionBanner';

interface SlaItem {
  id: string;
  category: 'perizinan' | 'kependudukan' | 'perpajakan' | 'agraria' | 'kesehatan';
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
    agencyName: 'DPMPTSP Kab. Luwu',
    targetSla: 'Maks. 15 Menit',
    targetMinutes: 15,
    actualAvgMinutes: 11,
    cost: 'Rp 0,- (Gratis Bebas Retribusi)',
    productType: 'Nomor Induk Berusaha (NIB) Resmi BKPM RI',
    complianceRate: 99.4,
    status: 'fast'
  },
  {
    id: 'ktp-el',
    category: 'kependudukan',
    serviceName: 'Pencetakan & Penggantian KTP-el / KIA',
    agencyName: 'Disdukcapil Kab. Luwu',
    targetSla: 'Maks. 30 Menit (Siap Cetak)',
    targetMinutes: 30,
    actualAvgMinutes: 18,
    cost: 'Rp 0,- (Gratis Bebas Retribusi)',
    productType: 'KTP Elektronik / KIA Berchip Aktif',
    complianceRate: 98.6,
    status: 'optimal'
  },
  {
    id: 'akta-kelahiran',
    category: 'kependudukan',
    serviceName: 'Penerbitan Akta Kelahiran & Kartu Keluarga Baru',
    agencyName: 'Disdukcapil Kab. Luwu',
    targetSla: 'Maks. 45 Menit',
    targetMinutes: 45,
    actualAvgMinutes: 28,
    cost: 'Rp 0,- (Gratis Bebas Retribusi)',
    productType: 'Akta Kelahiran Tanda Tangan Elektronik (TTE) & KK',
    complianceRate: 97.9,
    status: 'optimal'
  },
  {
    id: 'pbg-simbg',
    category: 'perizinan',
    serviceName: 'Persetujuan Bangunan Gedung (PBG SIMBG Teknis)',
    agencyName: 'Dinas PUPTR & DPMPTSP',
    targetSla: 'Maks. 3 Hari Kerja',
    targetMinutes: 1440,
    actualAvgMinutes: 960,
    cost: 'Sesuai Perda Retribusi Bangunan',
    productType: 'Sertifikat PBG Definitif & Dokumen Teknis',
    complianceRate: 96.8,
    status: 'optimal'
  },
  {
    id: 'pbb-bphtb',
    category: 'perpajakan',
    serviceName: 'Validasi Pajak BPHTB & Mutasi SPPT PBB-P2',
    agencyName: 'Bapenda Kab. Luwu',
    targetSla: 'Maks. 20 Menit',
    targetMinutes: 20,
    actualAvgMinutes: 14,
    cost: 'Rp 0,- (Gratis Administrasi Validasi)',
    productType: 'Lembar SSPD BPHTB Tervalidasi Bank Sulselbar',
    complianceRate: 99.1,
    status: 'fast'
  },
  {
    id: 'sertifikat-roya',
    category: 'agraria',
    serviceName: 'Penghapusan Hak Tanggungan (Roya) Elektronik',
    agencyName: 'Kantor Pertanahan / BPN Luwu',
    targetSla: 'Maks. 1 Hari Kerja',
    targetMinutes: 480,
    actualAvgMinutes: 320,
    cost: 'Sesuai PNBP PP 128/2015 (Rp 50.000)',
    productType: 'Sertifikat Tanah Bersih Bebas Tanggungan',
    complianceRate: 97.4,
    status: 'optimal'
  },
  {
    id: 'bpjs-mutasi',
    category: 'kesehatan',
    serviceName: 'Perubahan Faskes & Penambahan Anggota BPJS',
    agencyName: 'BPJS Kesehatan Kantor Cabang Luwu',
    targetSla: 'Maks. 15 Menit',
    targetMinutes: 15,
    actualAvgMinutes: 9,
    cost: 'Rp 0,- (Gratis Tanpa Biaya)',
    productType: 'Kartu Indonesia Sehat (KIS) Digital Aktif',
    complianceRate: 99.7,
    status: 'fast'
  }
];

export function MppMaklumatSlaRadar({ isDark = false }: { isDark?: boolean }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [isMaklumatExpanded, setIsMaklumatExpanded] = useState<boolean>(false);
  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState<boolean>(false);

  const localizedSlaData = SLA_DATA.map(item => {
    if (isEn) {
      if (item.id === 'nib-oss') {
        return { ...item, serviceName: 'Business Identification Number (OSS RBA Low Risk)', targetSla: 'Max. 15 Mins', cost: 'IDR 0 (Free of Charge)', productType: 'Official NIB BKPM RI' };
      }
      if (item.id === 'ktp-el') {
        return { ...item, serviceName: 'e-KTP / Child ID Card Printing & Replacement', targetSla: 'Max. 30 Mins (Ready to Print)', cost: 'IDR 0 (Free)', productType: 'e-KTP / KIA Card with Active Chip' };
      }
      if (item.id === 'akta-kelahiran') {
        return { ...item, serviceName: 'Birth Certificate & New Family Card Issuance', targetSla: 'Max. 45 Mins', cost: 'IDR 0 (Free)', productType: 'Digitally Signed Birth Certificate & KK' };
      }
      if (item.id === 'pbg-simbg') {
        return { ...item, serviceName: 'Building Approval (PBG SIMBG Technical)', targetSla: 'Max. 3 Work Days', cost: 'According to Building Retribution Bylaw', productType: 'Definitive PBG Certificate & Tech Specs' };
      }
      if (item.id === 'pbb-bphtb') {
        return { ...item, serviceName: 'BPHTB Tax Validation & PBB Mutation', targetSla: 'Max. 20 Mins', cost: 'IDR 0 (Free Admin)', productType: 'Validated BPHTB SSPD Bank Sulselbar' };
      }
      if (item.id === 'sertifikat-roya') {
        return { ...item, serviceName: 'Electronic Mortgage Discharge (Roya)', targetSla: 'Max. 1 Work Day', cost: 'Official PNBP PP 128/2015 (Rp 50,000)', productType: 'Clean Land Title Certificate' };
      }
      if (item.id === 'bpjs-mutasi') {
        return { ...item, serviceName: 'Healthcare Facility Change & BPJS Member Addition', targetSla: 'Max. 15 Mins', cost: 'IDR 0 (Free)', productType: 'Active Digital Healthy Indonesia Card' };
      }
    } else if (isZh) {
      if (item.id === 'nib-oss') {
        return { ...item, serviceName: '低风险商业登记证 (OSS RBA NIB) 核发', targetSla: '最多 15 分钟', cost: '0 印尼盾（完全免费）', productType: '印尼投资协调委员会 (BKPM) 官方 NIB' };
      }
      if (item.id === 'ktp-el') {
        return { ...item, serviceName: '电子身份证 (e-KTP) / 儿童卡 (KIA) 打印与更换', targetSla: '最多 30 分钟', cost: '0 印尼盾（完全免费）', productType: '带芯片电子身份证 / 儿童身份证' };
      }
      if (item.id === 'akta-kelahiran') {
        return { ...item, serviceName: '出生证明与新户口簿 (KK) 核发', targetSla: '最多 45 分钟', cost: '0 印尼盾（完全免费）', productType: '电子签名 (TTE) 出生证明及户口簿' };
      }
      if (item.id === 'pbg-simbg') {
        return { ...item, serviceName: '建筑物批准 (PBG SIMBG 技术审查)', targetSla: '最多 3 个工作日', cost: '依据地方建筑规费条例', productType: '法定 PBG 证书及技术规范文件' };
      }
      if (item.id === 'pbb-bphtb') {
        return { ...item, serviceName: '契税 (BPHTB) 验证与房产税 (PBB) 变更', targetSla: '最多 20 分钟', cost: '0 印尼盾（免费行政验证）', productType: 'Sulselbar 银行验证 BPHTB 凭单' };
      }
      if (item.id === 'sertifikat-roya') {
        return { ...item, serviceName: '电子抵押权注销 (Roya)', targetSla: '最多 1 个工作日', cost: '官方规费 50,000 印尼盾', productType: '无抵押负担土地产权证书' };
      }
      if (item.id === 'bpjs-mutasi') {
        return { ...item, serviceName: '医保 (BPJS) 定点变更与家庭成员新增', targetSla: '最多 15 分钟', cost: '0 印尼盾（完全免费）', productType: '激活状态电子健康卡 (KIS)' };
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
      className="w-full max-w-6xl mx-auto py-10 sm:py-14 px-3 sm:px-6 relative scroll-mt-24"
    >
      {/* Header Section */}
      <div className="w-full max-w-3xl mx-auto text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-3 font-sans shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{isEn ? 'Public Service Standards (Law No. 25/2009)' : isZh ? '法定公共服务标准体系 (第25/2009号法案)' : 'Standar Birokrasi Pelayanan Publik (UU No. 25/2009)'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans leading-tight">
          {isEn ? 'Service Charter & ' : isZh ? '政务服务公开承诺与 ' : 'Maklumat Pelayanan & '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
            {isEn ? 'Real-Time SLA Radar' : isZh ? '实时服务时效 (SLA) 雷达' : 'SLA Radar Waktu Nyata'}
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2.5 max-w-2xl mx-auto leading-relaxed">
          {isEn 
            ? 'Integrity pledge of Luwu Regency: guaranteed processing time limits, zero illicit fee enforcement, and complete service transparency.'
            : isZh
            ? '鲁乌县政府廉洁与效能公开承诺：保障审批办结时限、执行法定零规费制度、全面实现阳光透明服务。'
            : 'Komitmen integritas birokrasi Pemerintah Kabupaten Luwu: jaminan transparansi waktu pelayanan (SLA), kepastian biaya nol pungli, dan kepatuhan standar pelayanan publik.'}
        </p>
      </div>

      {/* 1. Official Government Pledge Card (Maklumat Pelayanan Publik) */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all mb-10 relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 border-emerald-500/30 shadow-2xl shadow-emerald-950/30' 
          : 'bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 border-emerald-200/80 shadow-xl shadow-emerald-500/5'
      }`}>
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-500/20">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block font-mono">
                  {isEn ? 'OFFICIAL PLEDGE OF LUWU REGENCY GOVERNMENT' : isZh ? '印尼鲁乌县政府官方政务公开承诺公报' : 'DOKUMEN RESMI PEMERINTAH DAERAH KABUPATEN LUWU'}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-sans">
                  {isEn ? 'Public Service Delivery Charter' : isZh ? '公共政务综合服务履职公开承诺书' : 'Maklumat Penyelenggaraan Pelayanan Publik'}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {isEn ? `SLA Compliance: ${avgCompliance}% Excellent` : isZh ? `SLA达标率: ${avgCompliance}% 优秀` : `Kepatuhan SLA: ${avgCompliance}% Prima`}
              </span>
              <button
                type="button"
                onClick={() => setIsMaklumatExpanded(!isMaklumatExpanded)}
                className="min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-white dark:hover:text-slate-950 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>{isMaklumatExpanded ? (isEn ? 'Collapse' : isZh ? '收起' : 'Ringkas') : (isEn ? 'Read Full Pledge' : isZh ? '查看承诺全文' : 'Baca Teks Lengkap')}</span>
              </button>
            </div>
          </div>

          {/* Official Pledge Text */}
          <div className="pt-5 space-y-3">
            <div className="relative">
              <blockquote className="text-xs sm:text-sm md:text-base font-serif italic text-slate-800 dark:text-slate-100 leading-relaxed bg-white/60 dark:bg-slate-950/60 p-4 sm:p-6 rounded-2xl border border-emerald-500/25 shadow-inner">
                <span className="text-2xl text-emerald-500 dark:text-emerald-400 font-serif leading-none mr-1 select-none">“</span>
                {isEn 
                  ? 'Herewith, we the leadership and all personnel of Mal Pelayanan Publik (MPP) Simpurusiang Luwu Regency solemnly pledge and state our capability to deliver services in strict compliance with established Standards, ensuring ease, transparency, and time certainty. If we fail to fulfill this promise, we are fully prepared to accept sanctions in accordance with applicable laws.'
                  : isZh
                  ? '在此，鲁乌县辛普鲁西亚公共服务大厅领导班子与全体工作人员庄严承诺：严格依照法定服务标准开展各项政务与行政审批，确保办事便捷、流程透明、时效确定。若未履行政诺，愿依法依规接受严格惩戒。'
                  : 'Dengan ini, kami pimpinan dan segenap aparatur Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu berjanji dan menyatakan sanggup menyelenggarakan pelayanan sesuai Standar Pelayanan yang telah ditetapkan, memberikan kemudahan, transparansi, serta kepastian waktu, dan apabila kami tidak menepati janji ini, kami siap menerima sanksi sesuai dengan peraturan perundang-undangan yang berlaku.'}
                <span className="text-2xl text-emerald-500 dark:text-emerald-400 font-serif leading-none ml-1 select-none">”</span>
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
                        {isEn ? 'All core permits are Rp 0,- (Free). Official tax & non-tax revenues are processed solely via bank counters or verified QRIS/VA channels.' : isZh ? '基础行政审批均为零收费（免费）。法定税费一律由银行窗口或官方QRIS/虚拟账户收缴。' : 'Seluruh proses perizinan dasar berbiaya Rp 0,- (Gratis). Pembayaran retribusi/PNBP resmi hanya melalui loket kas bank atau kanal QRIS/VA resmi.'}
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

      {/* Zona Integritas WBK/WBBM Auto-Cycling Responsive Horizontal Slider */}
      <AntiCorruptionBanner isDark={isDark} className="mb-10" />

      {/* Modal Interactive WBK / WBBM */}
      <AnimatePresence>
        {isIntegrityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-2xl p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-white shadow-black' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsIntegrityModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 mb-1">
                    <span>Komitmen Resmi Pemkab Luwu</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight">
                    Zona Integritas WBK & WBBM MPP Simpurusiang
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Wilayah Bebas dari Korupsi (WBK) & Wilayah Birokrasi Bersih dan Melayani (WBBM)
                  </p>
                </div>
              </div>

              {/* 3 Core Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'}`}>
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-2.5 font-bold">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold mb-1">Stop Gratifikasi</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Petugas dilarang keras menerima uang, hadiah, atau imbalan (Pasal 12B UU Tipikor).
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'}`}>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 font-bold">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold mb-1">WBS Online (Anonim)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Sistem Pengaduan Whistleblowing terlindungi 100% untuk kerahasiaan identitas pelapor.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'}`}>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 font-bold">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold mb-1">Saber Pungli WA</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Respon cepat penindakan indikasi pungli via Satgas Saber Pungli Kab. Luwu.
                  </p>
                </div>
              </div>

              {/* Notice Warning */}
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs font-medium mb-6 leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">PERINGATAN RESMI:</strong>
                  Seluruh retribusi layanan MPP Simpurusiang disetor resmi melalui Bank BPD Sulselbar. Jika Anda menemukan indikasi pungli atau permintaan imbalan oleh oknum, segera laporkan melalui saluran WBS!
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <a
                  href="https://www.lapor.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Lapor via WBS Online</span>
                </a>

                <a
                  href="https://wa.me/628114201234?text=Halo%20Satgas%20Saber%20Pungli%20Kabupaten%20Luwu,%20saya%20ingin%20melaporkan%20indikasi%20pungli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-500" />
                  <span>Saber Pungli WA</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsIntegrityModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              { id: 'semua', label: isEn ? 'All' : isZh ? '全部' : 'Semua Layanan' },
              { id: 'perizinan', label: isEn ? 'Business' : isZh ? '企业许可' : 'Perizinan Usaha' },
              { id: 'kependudukan', label: isEn ? 'Civil Reg' : isZh ? '户籍民政' : 'Kependudukan' },
              { id: 'perpajakan', label: isEn ? 'Tax' : isZh ? '财税' : 'Perpajakan' },
              { id: 'agraria', label: isEn ? 'Agrarian' : isZh ? '土地' : 'Agraria / BPN' },
              { id: 'kesehatan', label: isEn ? 'Health' : isZh ? '医疗' : 'Kesehatan' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap snap-start cursor-pointer active:scale-95 ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isDark
                      ? 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* SLA Grid Cards with Staggered Slide-Up and Vibrant Category Styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSla.map((item, idx) => {
            const categoryThemes: Record<string, { badge: string; bar: string; icon: string; borderHover: string }> = {
              perizinan: {
                badge: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30',
                bar: 'from-sky-500 via-blue-500 to-indigo-500',
                icon: 'text-sky-500',
                borderHover: 'hover:border-sky-500/60'
              },
              kependudukan: {
                badge: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
                bar: 'from-emerald-500 via-teal-400 to-emerald-300',
                icon: 'text-emerald-500',
                borderHover: 'hover:border-emerald-500/60'
              },
              perpajakan: {
                badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
                bar: 'from-amber-500 via-orange-400 to-yellow-400',
                icon: 'text-amber-500',
                borderHover: 'hover:border-amber-500/60'
              },
              agraria: {
                badge: 'bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/30',
                bar: 'from-violet-500 via-purple-400 to-indigo-400',
                icon: 'text-violet-500',
                borderHover: 'hover:border-violet-500/60'
              },
              kesehatan: {
                badge: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30',
                bar: 'from-rose-500 via-pink-400 to-rose-300',
                icon: 'text-rose-500',
                borderHover: 'hover:border-rose-500/60'
              },
            };

            const theme = categoryThemes[item.category] || categoryThemes.perizinan;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative group shadow-sm ${theme.borderHover} ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800 shadow-lg' 
                    : 'bg-white border-slate-200/90 shadow-md shadow-slate-200/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border font-mono ${theme.badge}`}>
                      {item.agencyName}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {item.complianceRate}% On-Time
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 font-sans mb-1 leading-snug">
                    {item.serviceName}
                  </h4>

                  <p className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                    <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">{item.productType}</span>
                  </p>
                </div>

                {/* SLA Target vs Actual Visualizer */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {isEn ? 'Target SLA Limit:' : isZh ? '法定时效上限:' : 'Target Batas SLA:'}
                    </span>
                    <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold">
                      {item.targetSla}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {isEn ? 'Avg Realization:' : isZh ? '实际平均耗时:' : 'Realisasi Rata-rata:'}
                    </span>
                    <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                      {item.actualAvgMinutes >= 480 
                        ? `${(item.actualAvgMinutes / 480).toFixed(1)} ${isEn ? 'Work Days' : isZh ? '个工作日' : 'Hari Kerja'}` 
                        : `${item.actualAvgMinutes} ${isEn ? 'Mins' : isZh ? '分钟' : 'Menit'}`}
                    </span>
                  </div>

                  {/* Multi-color Progress bar of SLA performance */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(100, (item.actualAvgMinutes / item.targetMinutes) * 100)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.1 + idx * 0.05, ease: "easeOut" }}
                      className={`bg-gradient-to-r ${theme.bar} h-full rounded-full`}
                    />
                  </div>
                </div>

                {/* Cost & Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] gap-2">
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 truncate">
                    {item.cost}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('layanan') || document.getElementById('instansi');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="font-bold text-slate-800 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors shrink-0 min-h-[34px] px-1 active:scale-95"
                  >
                    <span className="whitespace-nowrap">{isEn ? 'View Requirements' : isZh ? '查看前置条件' : 'Cek Syarat'}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
