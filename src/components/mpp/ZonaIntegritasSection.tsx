import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  Megaphone, 
  ChevronLeft, 
  ChevronRight, 
  PhoneCall, 
  X, 
  ExternalLink, 
  ShieldAlert, 
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';

export interface IntegritySlide {
  id: string;
  title: string;
  sub: string;
  badge: string;
  tag: string;
  law: string;
  penalty: string;
  desc: string;
}

export interface ZonaIntegritasSectionProps {
  className?: string;
  isDark?: boolean;
}

/**
 * ZonaIntegritasSection Component
 * Refactored for Symmetrical Desktop Illusion and Native Android App-Like Mobile Experience.
 */
const SoftIconPulse: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      animate={{ opacity: [1, 0.82, 1] }}
      transition={{
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ZonaIntegritasSection: React.FC<ZonaIntegritasSectionProps> = ({ 
  className = '',
  isDark = false
}) => {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isWbsModalOpen, setIsWbsModalOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<IntegritySlide | null>(null);

  const slides: IntegritySlide[] = [
    {
      id: 'no-korupsi',
      title: isEn ? "No Corruption, Bribery, & Extortion" : isZh ? "坚决杜绝腐败、贿赂与索贿" : "No Korupsi, Suap, & Pungli",
      sub: isEn ? "ASN Oath of Office & Integrity Pact Commitment" : isZh ? "公务员就职誓言与廉洁协议承诺" : "Komitmen Sumpah Jabatan & Pakta Integritas ASN",
      badge: isEn ? "Anti-Corruption Law & ASN Discipline" : isZh ? "反腐败法与公务员纪律条例" : "UU Tipikor & Disiplin ASN",
      tag: isEn ? "SERVICE PROVIDERS • ZERO TOLERANCE" : isZh ? "服务提供者 • 零容忍" : "PENYELENGGARA LAYANAN • ZERO TOLERANCE",
      law: 'UU No. 31/1999 jo. UU No. 20/2001 & UU No. 20/2023',
      penalty: isEn ? "Life imprisonment or 4–20 years, fines up to IDR 1 Billion, and Dishonorable Discharge (Dismissal of ASN)." : isZh ? "处终身监禁或4至20年有期徒刑，最高10亿印尼盾罚款，并予以开除公职（开除公务员）。" : "Pidana penjara seumur hidup atau 4–20 tahun, denda hingga Rp 1 Miliar, serta Pemberhentian Tidak Dengan Hormat (Pemecatan ASN).",
      desc: isEn ? "All officers and counter staff at MPP Simpurusiang are bound by an integrity pact to reject any compromise, bribe, gratification, and illegal intervention." : isZh ? "Simpurusiang一站式服务大厅的所有公务人员及窗口工作人员均签署了廉洁承诺书，坚决拒绝任何形式的妥协、贿赂、礼品及非法干预。" : "Seluruh aparatur dan petugas loket MPP Simpurusiang terikat pakta integritas menolak segala bentuk kompromi, suap, gratifikasi, dan intervensi ilegal.",
    },
    {
      id: 'stop-gratifikasi',
      title: isEn ? "Stop Gratification: Reject • Record • Report" : isZh ? "拒绝收受回扣：拒收 • 登记 • 上报" : "Stop Gratifikasi: Tolak • Catat • Lapor",
      sub: isEn ? "Strictly Forbidden to Give & Receive Tips / Gifts" : isZh ? "严禁给付与收受小费 / 礼品" : "Dilarang Memberi & Menerima Uang Tips / Hadiah",
      badge: isEn ? "UPG Luwu Inspectorate" : isZh ? "鲁乌县监察局举报中心" : "UPG Inspektorat Luwu",
      tag: isEn ? "SERVICE COUNTERS • ZERO GRATIFICATION" : isZh ? "窗口服务 • 零礼品" : "LOKET PELAYANAN • ZERO GRATIFIKASI",
      law: 'Pasal 12B UU No. 20/2001 & Perbup Luwu Pengendalian Gratifikasi',
      penalty: isEn ? "Any form of gift giving must be rejected. If it cannot be rejected, it must be reported to the UPG within 30 working days." : isZh ? "任何形式的礼品赠送均须拒收。如无法拒收，须在30个工作日内向地方监察局汇报登记。" : "Pemberian hadiah dalam bentuk apa pun wajib ditolak. Jika tidak dapat ditolak, wajib dilaporkan ke UPG dalam 30 hari kerja.",
      desc: isEn ? "Even a cup of coffee or a cigarette from applicants constitutes a service code of conduct violation. Excellent service is the duty of the state apparatus." : isZh ? "即使是申请人提供的一杯咖啡或一支烟，也属于违反服务行为准则的行为。提供优质高效的服务是国家公职人员的法定职责。" : "Bahkan secangkir kopi atau rokok dari pemohon merupakan pelanggaran kode etik pelayanan. Pelayanan prima adalah kewajiban aparatur.",
    },
    {
      id: 'stop-pungli',
      title: isEn ? "No Illegal Fees: Official Rate IDR 0,-" : isZh ? "无乱收费：官方费率 0 印尼盾" : "Bebas Pungli: Tarif Resmi Rp 0,-",
      sub: isEn ? "All Licensing & Administration Services Free of Charge" : isZh ? "所有许可审批与行政政务服务均无附加费用" : "Semua Layanan Izin & Adminduk Tanpa Biaya Tambahan",
      badge: isEn ? "Saber Pungli Task Force" : isZh ? "扫除乱收费工作组" : "Satgas Saber Pungli",
      tag: isEn ? "RIGHTS OF APPLICANTS & INVESTORS" : isZh ? "申请人与投资者的合法权益" : "HAK PEMOHON & INVESTOR",
      law: 'Perpres No. 87/2016 tentang Satgas Sapu Bersih Pungutan Liar',
      penalty: isEn ? "Sting Operations (OTT) and criminal charges for extortion in office (Article 368 & 423 of the Criminal Code)." : isZh ? "实施现场拘捕行动 (OTT)，并对滥用职权索贿进行刑事起诉（《刑法》第368条及第423条）。" : "Operasi Tangkap Tangan (OTT) dan jeratan pidana pemerasan dalam jabatan (Pasal 368 & 423 KUHP).",
      desc: isEn ? "No cash transactions at service counters. All official retribution fees are deposited directly via Bank BPD Sulselbar with official receipts." : isZh ? "服务窗口不进行任何现金交易。所有法定行政规费均通过Sulselbar银行直接缴纳，并开具官方财政收据。" : "Tidak ada transaksi tunai di meja loket. Seluruh retribusi resmi disetor langsung via Bank BPD Sulselbar dengan bukti bayar kas daerah yang sah.",
    },
    {
      id: 'cctv-audit',
      title: isEn ? "Active Oversight: 24/7 CCTV & Mystery Shopper" : isZh ? "实时监管：24/7 监控与神秘顾客审计" : "Pengawasan Aktif: CCTV 24/7 & Mystery Shopper",
      sub: isEn ? "All Counter Interactions Supervised by Compliance Team" : isZh ? "所有服务窗口交互全流程受合规团队监管" : "Seluruh Interaksi Loket Diawasi Tim Kepatuhan",
      badge: isEn ? "Inspectorate Monitoring" : isZh ? "地方监察局实时督导" : "Monitoring Inspektorat",
      tag: isEn ? "CLOSED SYSTEM SUPERVISION" : isZh ? "闭环系统监管" : "PENGAWASAN SISTEM TERTUTUP",
      law: 'PermenPAN-RB No. 90/2021 tentang Pembangunan Zona Integritas',
      penalty: isEn ? "Periodic examination of window camera & audio records by the Luwu Special Investigation Team." : isZh ? "鲁乌县特别调查组定期调取并审查窗口的音视频监控录像。" : "Pemeriksaan berkala hasil rekaman kamera & audio loket oleh Tim Investigasi Khusus Pemkab Luwu.",
      desc: isEn ? "Every counter and desk is linked to the audio-visual monitoring center to ensure excellent service standards without deviation." : isZh ? "每个办事窗口和卡位均接入音视频监控中心，以确保无偏差地执行优质高效服务标准。" : "Setiap gerai dan loket terhubung ke pusat monitoring audio-visual untuk memastikan standar pelayanan prima tanpa penyimpangan.",
    },
    {
      id: 'wbs-lapor',
      title: isEn ? "WBS & SP4N-LAPOR!: 100% Whistleblower Protection" : isZh ? "举报平台 (WBS)：100% 保护举报人隐私" : "WBS & SP4N-LAPOR!: Perlindungan Saksi 100%",
      sub: isEn ? "Report Extortion / Brokers Confidentially & Encrypted" : isZh ? "机密且加密地举报索贿乱收费 / 中介黄牛" : "Laporkan Pungli / Calo Secara Rahasia & Terenkripsi",
      badge: isEn ? "LPSK Witness Protection" : isZh ? "证人保护机构 (LPSK) 提供全面保护" : "Perlindungan Saksi LPSK",
      tag: isEn ? "CONFIDENTIAL COMPLAINT CHANNEL" : isZh ? "机密申诉举报渠道" : "SALURAN PENGADUAN RAHASIA",
      law: 'UU No. 13/2006 jo. UU No. 31/2014 & PermenPAN-RB No. 90/2021',
      penalty: isEn ? "Reports of extortion/bribery are immediately followed up with full whistleblower confidentiality guaranteed by law." : isZh ? "对涉嫌索贿乱收费/受贿的举报进行立即立案查处，法律确保举报人身份信息的绝对保密。" : "Laporan dugaan pungli/gratifikasi langsung ditindaklanjuti dengan kerahasiaan identitas pelapor yang dijamin penuh undang-undang.",
      desc: isEn ? "The public and state apparatus can report violations anonymously without fear of intimidation or service discrimination." : isZh ? "社会公众和公职人员均可匿名举报违规行为，无须担心受到任何报复、威胁或服务歧视。" : "Masyarakat dan aparatur dapat melaporkan pelanggaran secara anonim tanpa rasa takut terhadap intimidasi atau diskriminasi pelayanan.",
    },
  ];

  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex] || slides[0];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <section 
      id="zona-integritas"
      className={`w-full mx-auto scroll-mt-36 sm:scroll-mt-40 ${
        className.includes('max-w-') ? '' : 'max-w-5xl'
      } ${
        className.includes('px-') ? '' : 'px-4 sm:px-6 lg:px-8'
      } ${
        className.includes('pt-') ? '' : 'pt-6'
      } ${
        className.includes('pb-') ? '' : 'pb-24 sm:pb-12'
      } ${className}`}
    >
      {/* 1. GLOBAL CONTAINER: DESKTOP SYMMETRY & MOBILE STACKING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch gap-6 lg:gap-8 w-full">
        
        {/* 2. LEFT COLUMN (TEXT & ACTIONS - h-full for perfect symmetry) */}
        <div className="w-full h-full flex flex-col justify-between space-y-4 text-left">
          
          <div className="space-y-3">
            {/* Header Eyebrow (Zero-Pill Top-Aligned with Right Card) */}
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 font-sans inline-flex items-center gap-1.5">
                <SoftIconPulse>
                  <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                </SoftIconPulse>
                <span>{isEn ? "Integrity Zone WBK / WBBM" : isZh ? "廉洁防腐示范特区 (WBK/WBBM)" : "Zona Integritas WBK / WBBM"}</span>
              </span>
            </div>

            {/* Heading & Description */}
            <div className="space-y-2">
              <h2 className={MPP_TYPOGRAPHY.sectionTitle}>
                {isEn ? "Integrity " : isZh ? "廉政建设 " : "Zona Integritas "}
                <span className="text-rose-600 dark:text-rose-400">
                  {isEn ? "Zone" : isZh ? "示范特区" : "Bebas Pungli"}
                </span>
              </h2>
              <p className={MPP_TYPOGRAPHY.cardBody}>
                {isEn 
                  ? "Prevention of bribery, public service accountability, and full transparency without unofficial fees. All personnel are committed to achieving a corruption-free region in Luwu." 
                  : isZh 
                  ? "预防贪腐、对政务服务严格问责并实现全流程收费透明，绝无非官方规费。所有公职人员均致力于在鲁乌县打造廉洁政府。" 
                  : "Pencegahan gratifikasi, akuntabilitas pelayanan publik, dan transparansi penuh tanpa biaya tambahan yang tidak resmi. Seluruh aparatur berkomitmen mewujudkan Wilayah Bebas dari Korupsi di Kabupaten Luwu."}
              </p>
            </div>
          </div>

          {/* Action Blocks Stack */}
          <div className="flex flex-col gap-3 pt-1 w-full">
            
            {/* Action Block 1: Touch-friendly large button (No truncate, whitespace-normal) */}
            <button
              type="button"
              onClick={() => setIsWbsModalOpen(true)}
              className="w-full min-h-[52px] sm:min-h-[56px] px-4 sm:px-6 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:text-red-200 dark:border-red-500/30 dark:hover:border-red-500/50 font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer select-none whitespace-normal leading-tight text-center"
            >
              <SoftIconPulse>
                <Megaphone className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
              </SoftIconPulse>
              <span className="whitespace-normal leading-tight">
                {isEn ? "Report via WBS (Whistleblowing System)" : isZh ? "通过内部举报系统 (WBS) 匿名举报" : "Lapor WBS / Whistleblowing System"}
              </span>
            </button>

            {/* Action Block 2: Hotline WA (No truncate, whitespace-normal) */}
            <a
              href="https://wa.me/6281142011?text=Halo%20Satgas%20Saber%20Pungli%20Inspektorat%20Luwu,%20saya%20ingin%20melaporkan%20indikasi%20pelanggaran%20layanan%20di%20MPP"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[52px] sm:min-h-[56px] px-4 sm:px-6 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800 font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer select-none whitespace-normal leading-tight text-center"
            >
              <SoftIconPulse>
                <PhoneCall className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              </SoftIconPulse>
              <span className="whitespace-normal leading-tight">{isEn ? "Saber Pungli WhatsApp Hotline" : isZh ? "扫除乱收费官方举报热线 (WhatsApp)" : "Saber Pungli WA Hotline"}</span>
            </a>

            {/* Action Block 3: Informational Alert Banner with consistent p-4 sm:p-5 padding */}
            <div 
              role="alert"
              className="w-full bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-4 sm:p-5 rounded-2xl shadow-xs text-left flex items-start gap-3.5"
            >
              <SoftIconPulse className="shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </SoftIconPulse>
              <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
                <div className="uppercase tracking-wider font-extrabold text-red-700 dark:text-red-400 text-[11px] sm:text-xs font-sans">
                  {isEn ? "Declaration of Extortion-Free Services" : isZh ? "杜绝一切乱收费及红包公告声明" : "Maklumat Bebas Pungutan Liar"}
                </div>
                <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {isEn 
                    ? "IDR 0,- (FREE) EXCEPT FOR OFFICIAL RETRIBUTION PAID TO BANK BPD SULSELBAR • OFFICERS ARE FORBIDDEN TO RECEIVE CASH" 
                    : isZh 
                    ? "所有服务均为 0 额外费用（免费），除在国家指定 BPD 银行交纳的官方规费外 • 工作人员严禁私自收受现金红包" 
                    : "Rp 0,- (GRATIS) KECUALI RETRIBUSI RESMI BANK BPD SULSELBAR • PETUGAS DILARANG MENERIMA UANG CASH"}
                </p>
                <p className="text-[11px] font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isEn 
                    ? "All official local retribution fees must be paid through official QRIS or Bank BPD Sulselbar counters with official treasury payment slips." 
                    : isZh 
                    ? "所有合法的本地政务规费必须通过官方统一 QRIS 或印尼国家 BPD 银行窗口缴纳，并获得官方金库缴纳收据。" 
                    : "Seluruh pembayaran retribusi daerah yang sah wajib melalui QRIS resmi atau loket Bank BPD Sulselbar dengan bukti setoran kas daerah."}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 3. RIGHT COLUMN (CAROUSEL CARD - h-full for perfect symmetry) */}
        <div className="w-full h-full flex flex-col justify-between">
          
          {/* Standardized Main Card (rounded-2xl, p-5 sm:p-6, Layer 1 #0F2D4A) */}
          <div className={`w-full h-full ${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingLg} flex flex-col justify-between border-l-4 border-l-rose-500 font-sans transition-all duration-300 space-y-4`}>
            
            {/* Kicker Badge Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge variant="category" tone="danger" icon={<Shield className="w-3.5 h-3.5" />}>
                {currentSlide.badge}
              </Badge>
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {isEn ? `Slide ${currentIndex + 1} of ${totalSlides}` : isZh ? `第 ${currentIndex + 1} / ${totalSlides} 页` : `Slide ${currentIndex + 1} dari ${totalSlides}`}
              </span>
            </div>

            {/* Animated Content for Active Slide */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ willChange: 'transform, opacity' }}
                className="space-y-4 flex-1 flex flex-col justify-between"
              >
                {/* Sub-Header & Isi Pakta */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 font-sans">
                    {currentSlide.tag}
                  </h3>
                  <h4 className={MPP_TYPOGRAPHY.cardTitle}>
                    {currentSlide.title}
                  </h4>
                  <p className={MPP_TYPOGRAPHY.cardBody}>
                    {currentSlide.desc}
                  </p>
                </div>

                {/* Sub-note on Law — Standardized Small Card (p-4, rounded-2xl, Layer 2 #143755) */}
                <div className={`${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer2} flex items-start gap-2.5`}>
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <strong className="text-slate-700 dark:text-slate-200 font-semibold">{t('zonaIntegritas.regulations')}: </strong>
                    {currentSlide.law}
                  </div>
                </div>

                {/* Footer Kartu & Link Rincian Sanksi */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 font-sans">
                  <span className="text-xs font-mono font-medium text-slate-400 truncate max-w-[180px]">
                    {currentSlide.law.split('&')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPillar(currentSlide)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 inline-flex items-center gap-1 cursor-pointer transition-colors font-sans hover:underline"
                  >
                    <span>{t('zonaIntegritas.detailsBtn')}</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigasi Slider Controls dengan mb-4 safe margin */}
            <div className="flex items-center justify-between pt-3 mb-1 border-t border-slate-100 dark:border-slate-800/60 font-sans">
              <div className="flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Buka slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentIndex === idx 
                        ? 'w-6 bg-red-600 dark:bg-red-500' 
                        : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Slide sebelumnya"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Slide berikutnya"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Modal Detail Sanksi Hukum */}
      <AnimatePresence>
        {selectedPillar && (
          <div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 bg-surface/60 backdrop-blur-sm overflow-y-auto font-sans"
            onClick={() => setSelectedPillar(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg my-auto max-h-[85vh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl border border-rose-500/30 bg-white dark:bg-surface text-slate-900 dark:text-white shadow-2xl p-5 sm:p-7 relative font-sans flex flex-col overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setSelectedPillar(null)}
                aria-label="Tutup rincian sanksi"
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    {selectedPillar.badge}
                  </span>
                  <h3 className="text-base sm:text-lg font-black leading-tight">
                    {selectedPillar.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-bold">
                    {isEn ? "📜 Legal Basis & Regulations:" : isZh ? "📜 法律依据与规章制度：" : "📜 Landasan Hukum & Regulasi:"}
                  </strong>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {selectedPillar.law}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <strong className="block text-rose-700 dark:text-rose-400 mb-1 font-bold">
                    {isEn ? "⚠️ Strict Penalties & Legal Consequences:" : isZh ? "⚠️ 严厉处罚与法律后果：" : "⚠️ Sanksi Tegas & Konsekuensi Hukum:"}
                  </strong>
                  <p className="leading-relaxed">
                    {selectedPillar.penalty}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-bold">
                    {isEn ? "🛡️ Implementation at MPP Simpurusiang:" : isZh ? "🛡️ Simpurusiang 政务服务大厅执行标准：" : "🛡️ Penerapan di MPP Simpurusiang:"}
                  </strong>
                  <p className="leading-relaxed">
                    {selectedPillar.desc}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {isEn ? "Luwu Regency Regional Inspectorate" : isZh ? "鲁乌县地方监察局监督" : "Inspektorat Daerah Kabupaten Luwu"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPillar(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  {isEn ? "Close" : isZh ? "关闭" : "Tutup"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Whistleblowing System (WBS) Cepat */}
      <AnimatePresence>
        {isWbsModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-base/80 backdrop-blur-md"
            onClick={() => setIsWbsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl border border-rose-500/40 bg-white dark:bg-surface text-slate-900 dark:text-white shadow-2xl p-5 sm:p-7 relative font-sans"
            >
              <button
                type="button"
                onClick={() => setIsWbsModalOpen(false)}
                aria-label="Tutup form WBS"
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    {isEn ? "WHISTLEBLOWING SYSTEM (WBS)" : isZh ? "内部举报系统 (WBS)" : "WHISTLEBLOWING SYSTEM (WBS)"}
                  </span>
                  <h3 className="text-base sm:text-lg font-black leading-tight">
                    {isEn ? "Anonymous Exploitation / Extortion Report" : isZh ? "匿名举报索贿乱收费/受贿行为" : "Lapor Pungli / Gratifikasi Anonim"}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <strong className="text-rose-700 dark:text-rose-300 block mb-1">
                    {isEn ? "🛡️ Whistleblower Identity Protection:" : isZh ? "🛡️ 举报人身份绝对保密安全：" : "🛡️ Perlindungan Identitas Pelapor:"}
                  </strong>
                  <p className="text-[11px] leading-relaxed">
                    {isEn 
                      ? "Report information is securely and confidentially forwarded directly to the Special Task Force and Inspectorate of Luwu Regency. The identity of the whistleblower is fully protected by law." 
                      : isZh 
                      ? "您的举报信息将通过高强度安全加密，直接发送至扫除乱收费专责小组与鲁乌县地方监察局。法律百分之百确保举报人的隐私安全与合法权益。" 
                      : "Informasi laporan diteruskan secara aman dan terenkripsi langsung ke Tim Khusus Satgas Saber Pungli & Inspektorat Kabupaten Luwu. Identitas pelapor dilindungi penuh oleh UU LPSK."}
                  </p>
                </div>

                <div className="space-y-2">
                  <a
                    href="https://wa.me/6281142011?text=Halo%20Inspektorat%20Luwu,%20saya%20ingin%20melaporkan%20indikasi%20pungli/gratifikasi%20pada%20loket%20MPP:%20[Nama%20Instansi/Loket]%20pada%20tanggal%20[Tanggal]"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-between font-bold transition-all shadow-md shadow-black/25"
                  >
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-4 h-4" />
                      <div className="text-left">
                        <span className="block text-xs">{isEn ? "Saber Pungli Luwu WhatsApp" : isZh ? "鲁乌县扫除乱收费 WhatsApp 窗口" : "WhatsApp Satgas Saber Pungli Luwu"}</span>
                        <span className="text-[10px] opacity-90 font-mono font-normal">{isEn ? "Fast Investigation Response" : isZh ? "调查组快速核查响应" : "Respon Cepat Tim Investigasi"}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </a>

                  <a
                    href="https://www.lapor.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-between font-bold transition-all border border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-rose-400" />
                      <div className="text-left">
                        <span className="block text-xs">{isEn ? "National SP4N-LAPOR! Portal" : isZh ? "国家 SP4N-LAPOR! 公共服务申诉平台" : "Portal SP4N-LAPOR! Nasional"}</span>
                        <span className="text-[10px] opacity-75 font-mono font-normal">{isEn ? "National Public Service Complaint System" : isZh ? "印尼国家统一公共服务申诉体系" : "Sistem Pengaduan Pelayanan Publik Nasional"}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsWbsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  {isEn ? "Close" : isZh ? "关闭" : "Tutup"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ZonaIntegritasSection;
