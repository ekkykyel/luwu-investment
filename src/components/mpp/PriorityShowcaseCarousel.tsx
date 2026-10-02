import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Accessibility, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Armchair, 
  Baby, 
  HeartHandshake, 
  ShieldCheck, 
  ExternalLink,
  Laptop
} from 'lucide-react';

export interface PriorityShowcaseCarouselProps {
  onOpenAccessibilityPanel?: () => void;
  onOpenVipInvestor?: () => void;
  isDark?: boolean;
}

const SHOWCASE_ITEMS = [
  {
    id: 'vip-investor',
    type: 'vip',
    title: 'VIP Investor Fast-Track Desk',
    kicker: 'Investasi & Penanaman Modal',
    description: 'Layanan asistensi personal satu pintu untuk penanam modal korporasi dan UMKM skala menengah ke atas dengan pendampingan langsung Liaison Officer DPMPTSP.',
    badge: 'Prioritas Bisnis',
    badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    features: ['Pendampingan OSS-RBA', 'Konsultasi Tata Ruang RDTR', 'Fasilitasi Insentif Pajak Daerah'],
    actionLabel: 'Hubungi Liaison Officer',
    isVip: true,
  },
  {
    id: 'ramah-disabilitas',
    type: 'inklusif',
    title: 'Jalur Fast-Track Ramah Disabilitas',
    kicker: 'Pelayanan Inklusif',
    description: 'Penyandang disabilitas, lansia >60 tahun, dan ibu hamil langsung mendapatkan nomor antrean khusus tanpa perlu menunggu antrean reguler.',
    badge: 'Prioritas Inklusi',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    icon: Accessibility,
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800',
    features: ['Kursi Roda & Jalur Landai', 'Petugas Pendamping Bahasa Isyarat', 'Kiosk Khusus Layar Rendah'],
    actionLabel: 'Buka Menu Inklusif',
    isVip: false,
  },
  {
    id: 'executive-lounge',
    type: 'vip',
    title: 'Executive Lounge & Business Corner',
    kicker: 'Fasilitas Unggulan',
    description: 'Ruang tunggu eksklusif berpenyejuk udara sentral dengan koneksi internet cepat, stasiun pengisian daya gawai, dan sajian kopi Luwu.',
    badge: 'Kenyamanan Eksekutif',
    badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30',
    icon: Armchair,
    image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
    features: ['Wi-Fi Orbit Berkecepatan Tinggi', 'Layar Monitor Progres Berkas', 'Bilik Konsultasi Privat'],
    actionLabel: 'Lihat Denah Lounge',
    isVip: true,
  },
  {
    id: 'laktasi-anak',
    type: 'inklusif',
    title: 'Ruang Laktasi & Arena Bermain Ramah Anak',
    kicker: 'Fasilitas Keluarga',
    description: 'Bilik privat higienis untuk ibu menyusui serta arena bermain anak edukatif yang diawasi agar orang tua dapat mengurus berkas dengan tenang.',
    badge: 'Ramah Keluarga',
    badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    icon: Baby,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800',
    features: ['Sterilizer & Kulkas ASI', 'Mainan Edukasi Standar SNI', 'Sofa Laktasi Ergonomis'],
    actionLabel: 'Panduan Fasilitas Anak',
    isVip: false,
  },
];

export const PriorityShowcaseCarousel: React.FC<PriorityShowcaseCarouselProps> = ({
  onOpenAccessibilityPanel,
  onOpenVipInvestor,
  isDark = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full space-y-4">
      {/* Header bar with controls */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Fasilitas Prioritas & Layanan Inklusif</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            Aksesibilitas & Fasilitasi Cepat
          </h2>
        </div>

        {/* Carousel Arrow Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
            aria-label="Geser ke kiri"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
            aria-label="Geser ke kanan"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Swipeable Cards Container */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none no-scrollbar pb-3 pt-1 px-1 touch-pan-x"
        >
          {SHOWCASE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="w-[300px] sm:w-[360px] shrink-0 snap-start rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-200/40 dark:shadow-none hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Image Banner Header */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  {/* Floating Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border ${item.badgeColor}`}>
                      <Icon className="w-3 h-3" />
                      {item.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                      {item.kicker}
                    </div>
                    <h3 className="text-base font-extrabold leading-snug line-clamp-1 font-sans">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {item.description}
                  </p>

                  {/* Feature Checklist Tags */}
                  <div className="space-y-1.5 pt-1">
                    {item.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action CTA Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.isVip && onOpenVipInvestor) {
                          onOpenVipInvestor();
                        } else if (onOpenAccessibilityPanel) {
                          onOpenAccessibilityPanel();
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white dark:hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <span>{item.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PriorityShowcaseCarousel;
