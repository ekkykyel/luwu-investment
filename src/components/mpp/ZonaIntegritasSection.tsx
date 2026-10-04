import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
 * 
 * Layout Directives:
 * 1. Global Container: `w-full max-w-5xl mx-auto px-4 md:px-8` with `flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 items-center lg:items-start`
 * 2. Left Column: Touch-friendly large buttons (`min-h-[56px]`, `rounded-xl`, `active:scale-95`) + Informational Alert Banner (`bg-red-600 text-white font-bold p-5 rounded-2xl`)
 * 3. Right Column: Material 3 Carousel Card (`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:p-8`)
 * 4. Mobile Clearance: `mb-28 lg:mb-0` on the right column to clear fixed Android Bottom App Bar
 */
export const ZonaIntegritasSection: React.FC<ZonaIntegritasSectionProps> = ({ 
  className = '',
  isDark = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isWbsModalOpen, setIsWbsModalOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<IntegritySlide | null>(null);

  const slides: IntegritySlide[] = [
    {
      id: 'no-korupsi',
      title: 'No Korupsi, Suap, & Pungli',
      sub: 'Komitmen Sumpah Jabatan & Pakta Integritas ASN',
      badge: 'UU Tipikor & Disiplin ASN',
      tag: 'PENYELENGGARA LAYANAN • ZERO TOLERANCE',
      law: 'UU No. 31/1999 jo. UU No. 20/2001 & UU No. 20/2023',
      penalty: 'Pidana penjara seumur hidup atau 4–20 tahun, denda hingga Rp 1 Miliar, serta Pemberhentian Tidak Dengan Hormat (Pemecatan ASN).',
      desc: 'Seluruh aparatur dan petugas loket MPP Simpurusiang terikat pakta integritas menolak segala bentuk kompromi, suap, gratifikasi, dan intervensi ilegal.',
    },
    {
      id: 'stop-gratifikasi',
      title: 'Stop Gratifikasi: Tolak • Catat • Lapor',
      sub: 'Dilarang Memberi & Menerima Uang Tips / Hadiah',
      badge: 'UPG Inspektorat Luwu',
      tag: 'LOKET PELAYANAN • ZERO GRATIFIKASI',
      law: 'Pasal 12B UU No. 20/2001 & Perbup Luwu Pengendalian Gratifikasi',
      penalty: 'Pemberian hadiah dalam bentuk apa pun wajib ditolak. Jika tidak dapat ditolak, wajib dilaporkan ke UPG dalam 30 hari kerja.',
      desc: 'Bahkan secangkir kopi atau rokok dari pemohon merupakan pelanggaran kode etik pelayanan. Pelayanan prima adalah kewajiban aparatur.',
    },
    {
      id: 'stop-pungli',
      title: 'Bebas Pungli: Tarif Resmi Rp 0,-',
      sub: 'Semua Layanan Izin & Adminduk Tanpa Biaya Tambahan',
      badge: 'Satgas Saber Pungli',
      tag: 'HAK PEMOHON & INVESTOR',
      law: 'Perpres No. 87/2016 tentang Satgas Sapu Bersih Pungutan Liar',
      penalty: 'Operasi Tangkap Tangan (OTT) dan jeratan pidana pemerasan dalam jabatan (Pasal 368 & 423 KUHP).',
      desc: 'Tidak ada transaksi tunai di meja loket. Seluruh retribusi resmi disetor langsung via Bank BPD Sulselbar dengan bukti bayar kas daerah yang sah.',
    },
    {
      id: 'cctv-audit',
      title: 'Pengawasan Aktif: CCTV 24/7 & Mystery Shopper',
      sub: 'Seluruh Interaksi Loket Diawasi Tim Kepatuhan',
      badge: 'Monitoring Inspektorat',
      tag: 'PENGAWASAN SISTEM TERTUTUP',
      law: 'PermenPAN-RB No. 90/2021 tentang Pembangunan Zona Integritas',
      penalty: 'Pemeriksaan berkala hasil rekaman kamera & audio loket oleh Tim Investigasi Khusus Pemkab Luwu.',
      desc: 'Setiap gerai dan loket terhubung ke pusat monitoring audio-visual untuk memastikan standar pelayanan prima tanpa penyimpangan.',
    },
    {
      id: 'wbs-lapor',
      title: 'WBS & SP4N-LAPOR!: Perlindungan Saksi 100%',
      sub: 'Laporkan Pungli / Calo Secara Rahasia & Terenkripsi',
      badge: 'Perlindungan Saksi LPSK',
      tag: 'SALURAN PENGADUAN RAHASIA',
      law: 'UU No. 13/2006 jo. UU No. 31/2014 & PermenPAN-RB No. 90/2021',
      penalty: 'Laporan dugaan pungli/gratifikasi langsung ditindaklanjuti dengan kerahasiaan identitas pelapor yang dijamin penuh undang-undang.',
      desc: 'Masyarakat dan aparatur dapat melaporkan pelanggaran secara anonim tanpa rasa takut terhadap intimidasi atau diskriminasi pelayanan.',
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
      className={`w-full mx-auto scroll-mt-28 ${
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
            {/* Header Badge (Top-Aligned with Right Card) */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800/60 font-sans shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>Zona Integritas WBK / WBBM</span>
              </span>
            </div>

            {/* Heading & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight font-sans tracking-tight">
                Zona Integritas{' '}
                <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                  Bebas Pungli
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium font-sans leading-relaxed">
                Pencegahan gratifikasi, akuntabilitas pelayanan publik, dan transparansi penuh tanpa biaya tambahan yang tidak resmi. Seluruh aparatur berkomitmen mewujudkan Wilayah Bebas dari Korupsi di Kabupaten Luwu.
              </p>
            </div>
          </div>

          {/* Action Blocks Stack */}
          <div className="flex flex-col gap-3 pt-1 w-full">
            
            {/* Action Block 1: Touch-friendly large button (No truncate, whitespace-normal) */}
            <button
              type="button"
              onClick={() => setIsWbsModalOpen(true)}
              className="w-full min-h-[52px] sm:min-h-[56px] px-4 sm:px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/25 transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer select-none whitespace-normal leading-tight text-center"
            >
              <Megaphone className="w-5 h-5 shrink-0" />
              <span className="whitespace-normal leading-tight">Lapor WBS / Whistleblowing System</span>
            </button>

            {/* Action Block 2: Hotline WA (No truncate, whitespace-normal) */}
            <a
              href="https://wa.me/6281142011?text=Halo%20Satgas%20Saber%20Pungli%20Inspektorat%20Luwu,%20saya%20ingin%20melaporkan%20indikasi%20pelanggaran%20layanan%20di%20MPP"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[52px] sm:min-h-[56px] px-4 sm:px-6 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 font-bold text-xs sm:text-sm transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer select-none whitespace-normal leading-tight text-center"
            >
              <PhoneCall className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="whitespace-normal leading-tight">Saber Pungli WA Hotline</span>
            </a>

            {/* Action Block 3: Informational Alert Banner with consistent p-4 sm:p-5 padding */}
            <div 
              role="alert"
              className="w-full bg-red-600 text-white font-bold p-4 sm:p-5 rounded-2xl shadow-sm text-left flex items-start gap-3.5"
            >
              <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
                <div className="uppercase tracking-wider font-black text-amber-200 text-[11px] sm:text-xs font-sans">
                  Maklumat Bebas Pungutan Liar
                </div>
                <p className="font-bold text-white leading-snug">
                  Rp 0,- (GRATIS) KECUALI RETRIBUSI RESMI BANK BPD SULSELBAR • PETUGAS DILARANG MENERIMA UANG CASH
                </p>
                <p className="text-[11px] font-normal text-white/90 leading-relaxed">
                  Seluruh pembayaran retribusi daerah yang sah wajib melalui QRIS resmi atau loket Bank BPD Sulselbar dengan bukti setoran kas daerah.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 3. RIGHT COLUMN (CAROUSEL CARD - h-full for perfect symmetry) */}
        <div className="w-full h-full flex flex-col justify-between">
          
          {/* Material Design 3 Card Aesthetics: h-full flex flex-col justify-between */}
          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between border-l-4 border-l-red-500 font-sans transition-all duration-300 space-y-4">
            
            {/* Kicker Badge Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans border border-slate-200/80 dark:border-slate-700/80">
                <Shield className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{currentSlide.badge}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Slide {currentIndex + 1} dari {totalSlides}
              </span>
            </div>

            {/* Sub-Header & Isi Pakta */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400 font-sans">
                {currentSlide.tag}
              </h3>
              <h4 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight leading-snug">
                {currentSlide.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans font-normal">
                {currentSlide.desc}
              </p>
            </div>

            {/* Sub-note on Law */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">Regulasi Acuan: </strong>
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
                <span>Rincian Sanksi Hukum &rarr;</span>
              </button>
            </div>

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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans"
            onClick={() => setSelectedPillar(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg my-auto max-h-[85vh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl border border-rose-500/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl p-5 sm:p-7 relative font-sans flex flex-col overflow-y-auto"
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
                    📜 Landasan Hukum & Regulasi:
                  </strong>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {selectedPillar.law}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <strong className="block text-rose-700 dark:text-rose-400 mb-1 font-bold">
                    ⚠️ Sanksi Tegas & Konsekuensi Hukum:
                  </strong>
                  <p className="leading-relaxed">
                    {selectedPillar.penalty}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-bold">
                    🛡️ Penerapan di MPP Simpurusiang:
                  </strong>
                  <p className="leading-relaxed">
                    {selectedPillar.desc}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Inspektorat Daerah Kabupaten Luwu
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPillar(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Tutup
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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsWbsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl border border-rose-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl p-5 sm:p-7 relative font-sans"
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
                    WHISTLEBLOWING SYSTEM (WBS)
                  </span>
                  <h3 className="text-base sm:text-lg font-black leading-tight">
                    Lapor Pungli / Gratifikasi Anonim
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <strong className="text-rose-700 dark:text-rose-300 block mb-1">
                    🛡️ Perlindungan Identitas Pelapor:
                  </strong>
                  <p className="text-[11px] leading-relaxed">
                    Informasi laporan diteruskan secara aman dan terenkripsi langsung ke Tim Khusus Satgas Saber Pungli & Inspektorat Kabupaten Luwu. Identitas pelapor dilindungi penuh oleh UU LPSK.
                  </p>
                </div>

                <div className="space-y-2">
                  <a
                    href="https://wa.me/6281142011?text=Halo%20Inspektorat%20Luwu,%20saya%20ingin%20melaporkan%20indikasi%20pungli/gratifikasi%20pada%20loket%20MPP:%20[Nama%20Instansi/Loket]%20pada%20tanggal%20[Tanggal]"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-between font-bold transition-all shadow-md shadow-emerald-700/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-4 h-4" />
                      <div className="text-left">
                        <span className="block text-xs">WhatsApp Satgas Saber Pungli Luwu</span>
                        <span className="text-[10px] opacity-90 font-mono font-normal">Respon Cepat Tim Investigasi</span>
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
                        <span className="block text-xs">Portal SP4N-LAPOR! Nasional</span>
                        <span className="text-[10px] opacity-75 font-mono font-normal">Sistem Pengaduan Pelayanan Publik Nasional</span>
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
                  Tutup
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
