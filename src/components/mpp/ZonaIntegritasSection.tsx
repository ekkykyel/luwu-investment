import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Megaphone, ChevronLeft, ChevronRight, 
  PhoneCall, X, ExternalLink, ShieldAlert, Shield
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

interface ZonaIntegritasSectionProps {
  className?: string;
  isDark?: boolean;
}

export const ZonaIntegritasSection: React.FC<ZonaIntegritasSectionProps> = ({ 
  className 
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
      className={className || "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-28"}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* KOLOM KIRI (INFO & ACTION HUB - lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Badge Top */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800/60 font-sans">
              <ShieldCheck className="w-4 h-4" /> Zona Integritas WBK / WBBM
            </span>
          </div>

          {/* Judul Dual-Tone */}
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 leading-tight font-sans">
            Zona Integritas <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">Bebas Pungli</span>
          </h2>

          {/* Deskripsi Singkat */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 font-medium font-sans">
            Pencegahan gratifikasi, akuntabilitas pelayanan publik, dan transparansi penuh tanpa biaya tambahan yang tidak resmi.
          </p>

          {/* Action Buttons Stack (WBS & Saber Pungli WA) */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 mt-6 font-sans">
            <button
              type="button"
              onClick={() => setIsWbsModalOpen(true)}
              className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20 transition-all font-sans cursor-pointer active:scale-95"
            >
              <Megaphone className="w-5 h-5" />
              <span>Lapor WBS / Whistleblowing System</span>
            </button>
            <a
              href="https://wa.me/6281142011?text=Halo%20Satgas%20Saber%20Pungli%20Inspektorat%20Luwu,%20saya%20ingin%20melaporkan%20indikasi%20pelanggaran%20layanan%20di%20MPP"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 font-bold transition-all font-sans"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Saber Pungli WA Hotline</span>
            </a>
          </div>

          {/* Banner Jaminan Retribusi Rp 0,- */}
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-xs sm:text-sm text-center shadow-sm font-sans">
            <p>Rp 0,- (GRATIS) KECUALI RETRIBUSI RESMI BANK BPD SULSELBAR • PETUGAS DILARANG MENERIMA UANG CASH</p>
          </div>
        </div>

        {/* KOLOM KANAN (PAKTA INTEGRITAS CARD & SLIDER CONTROL - lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 relative border-l-4 border-l-red-500 font-sans">
            {/* Tag Sub-Judul Kartu */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans">
                <Shield className="w-4 h-4 text-red-500" />
                <span>{currentSlide.badge}</span>
              </span>
            </div>

            {/* Sub-Header & Isi Pakta */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400 font-sans">
                {currentSlide.tag}
              </h3>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-sans">
                {currentSlide.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans font-normal">
                {currentSlide.desc}
              </p>
            </div>

            {/* Footer Kartu & Link Rincian Sanksi */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 font-sans">
              <span className="text-xs font-mono text-slate-400">
                {currentSlide.law.split('&')[0]}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPillar(currentSlide)}
                className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 inline-flex items-center gap-1 cursor-pointer font-sans"
              >
                <span>Rincian Sanksi Hukum &rarr;</span>
              </button>
            </div>
          </div>

          {/* Integrasi Navigasi Slider di Bawah Kartu */}
          <div className="flex items-center justify-between pt-2 px-1 font-sans">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Slide sebelumnya"
                className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 min-w-[40px] text-center">
                {currentIndex + 1} / {totalSlides}
              </span>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Slide berikutnya"
                className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Detail Sanksi Hukum */}
      <AnimatePresence>
        {selectedPillar && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setSelectedPillar(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl border border-rose-500/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl p-5 sm:p-7 relative"
            >
              <button
                type="button"
                onClick={() => setSelectedPillar(null)}
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
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-bold">
                    📜 Landasan Hukum & Regulasi:
                  </strong>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {selectedPillar.law}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <strong className="block text-rose-700 dark:text-rose-400 mb-1 font-bold">
                    ⚠️ Sanksi Tegas & Konsekuensi Hukum:
                  </strong>
                  <p className="leading-relaxed">
                    {selectedPillar.penalty}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
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
              className="w-full max-w-lg rounded-3xl border border-rose-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl p-5 sm:p-7 relative"
            >
              <button
                type="button"
                onClick={() => setIsWbsModalOpen(false)}
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

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
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
                    className="w-full p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-between font-bold transition-all shadow-md shadow-emerald-700/20"
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
                    className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-between font-bold transition-all border border-white/10"
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
