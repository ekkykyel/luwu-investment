import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Berapa biaya pengurusan dokumen dan perizinan di MPP Simpurusiang?',
    answer: 'Seluruh pelayanan dasar di MPP Simpurusiang (perekaman KTP-el, Kartu Keluarga, NIB OSS-RBA perseorangan, dan konsultasi) adalah 100% GRATIS (Rp 0). Biaya resmi hanya berlaku untuk retribusi daerah atau PNBP sah yang diatur oleh undang-undang (seperti pajak kendaraan di SAMSAT, perpanjangan SIM/SKCK, paspor, atau BPHTB), dan seluruh transaksi wajib non-tunai melalui QRIS/EDC Bank.',
    category: 'Biaya & Tarif',
  },
  {
    id: 'faq-2',
    question: 'Apakah nomor antrean bisa diambil secara online sebelum datang ke lokasi?',
    answer: 'Ya, Anda dapat mengambil nomor antrean online secara mandiri melalui tombol "Ambil Antrean" di portal ini atau melalui WhatsApp Gateway MPP. Sistem akan memberikan estimasi jam kedatangan sehingga Anda tidak perlu menunggu lama di ruang tunggu.',
    category: 'Antrean',
  },
  {
    id: 'faq-3',
    question: 'Bagaimana alur pendaftaran NIB bagi pelaku UMKM di Kabupaten Luwu?',
    answer: 'Pelaku UMKM cukup membawa e-KTP dan NPWP (jika ada) ke loket DPMPTSP atau anjungan Kios Mandiri. Petugas kami akan memandu proses pendaftaran melalui sistem OSS-RBA hingga NIB ber-QR Code selesai dicetak dalam waktu kurang dari 15 menit.',
    category: 'Perizinan',
  },
  {
    id: 'faq-4',
    question: 'Apa saja fasilitas pendukung bagi lansia, ibu hamil, dan penyandang disabilitas?',
    answer: 'MPP Simpurusiang memiliki jalur pemandu (guiding blocks), ramp kursi roda, lift ramah disabilitas, kursi roda gratis, loket fast-track tanpa antre, ruang laktasi privat, toilet ramah disabilitas, dan pendampingan petugas terlatih bahasa isyarat.',
    category: 'Aksesibilitas',
  },
  {
    id: 'faq-5',
    question: 'Bagaimana cara melacak berkas permohonan izin yang sedang diproses teknis?',
    answer: 'Masukkan nomor resi atau nomor pendaftaran Anda pada fitur "Lacak Berkas/Resi" di portal ini. Sistem akan menampilkan status real-time, nama verifikator teknis, serta estimasi tanggal penerbitan SK izin.',
    category: 'Tracking',
  },
];

export interface FaqAccordionProps {
  isDark?: boolean;
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ isDark = true }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n?.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleItem = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  return (
    <section id="faq" className="w-full max-w-4xl mx-auto space-y-6 scroll-mt-36 sm:scroll-mt-40">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-sans font-bold uppercase tracking-wider border ${
          isDark 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isEn ? 'Service Q&A Center' : isZh ? '政务常见问答中心' : 'Tanya Jawab Seputar Layanan'}</span>
        </div>
        <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-sans mt-1 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {t('faq.title', isEn ? 'FREQUENTLY ASKED QUESTIONS (FAQ)' : isZh ? '常见问题解答 (FAQ)' : 'Pertanyaan Sering Diajukan (FAQ)')}
        </h2>
        <p className={`text-xs sm:text-sm font-medium max-w-2xl mx-auto leading-relaxed mt-1.5 mb-3 ${
          isDark ? 'text-slate-300' : 'text-slate-600'
        }`}>
          Temukan jawaban cepat atas pertanyaan seputar jam kerja, biaya resmi, dan fasilitas di MPP Simpurusiang.
        </p>
      </div>

      {/* Accordion List (Only one item open at a time) */}
      <div className="space-y-3">
        {FAQ_DATA.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? isDark
                    ? 'bg-surface/95 border-emerald-500/50 shadow-lg shadow-black/40 ring-1 ring-emerald-500/30'
                    : 'bg-white border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                  : isDark
                    ? 'bg-surface/80 border-slate-800 hover:border-slate-700 text-slate-100'
                    : 'bg-white/80 border-slate-200/80 hover:border-slate-300 text-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-mono transition-colors ${
                    isOpen
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isDark
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    ?
                  </span>
                  <span className={`text-xs sm:text-sm font-extrabold font-sans ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.question}
                  </span>
                </div>

                <div className={`p-1.5 rounded-xl transition-transform duration-300 shrink-0 ${
                  isOpen 
                    ? isDark ? 'rotate-180 bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'rotate-180 bg-emerald-50 text-emerald-600' 
                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className={`px-5 pb-5 pt-1 text-xs leading-relaxed font-medium border-t mt-1 text-justify ${
                      isDark ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-100'
                    }`}>
                      <div className={`p-3.5 sm:p-4 rounded-2xl text-justify border ${
                        isDark 
                          ? 'bg-slate-900/80 border-slate-800 text-slate-200' 
                          : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`}>
                        {item.answer}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FaqAccordion;
