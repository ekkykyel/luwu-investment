import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
export const DETAILED_SERVICE_SPECS: Record<string, Partial<ServiceDetailItem>> = {
  'layanan-prioritas': {
    gallery: [
      'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=1200',
    ],
    location: 'Lantai 1 - Sayap Timur, Executive VIP Lounge & Loket Fast-Track MPP Simpurusiang',
    sla: '10 - 20 Menit (Bypass Antrean Reguler)',
    cost: 'Rp 0,- (Gratis Resmi Pemkab Luwu)',
    regulations: 'SK Bupati Luwu No. 188.45/DPMPTSP/2024 tentang Standar Pelayanan Fast-Track',
    targetCriteria: [
      'Investor Penanaman Modal (PMA/PMDN) skala menengah hingga besar di Kabupaten Luwu',
      'Pelaku usaha percepatan izin strategis (PBG Gedung Usaha, KKPR, OSS-RBA Berisiko Tinggi)',
      'Kelompok Rentan: Lansia (usia ≥ 60 tahun), Ibu Hamil, serta Ibu Menyusui dengan Balita',
      'Delegasi Kedinasan / Kunjungan Kerja Antar-Lembaga Pemerintah & BUMN'
    ],
    facilities: [
      'Executive VIP Investor Lounge ber-AC dengan sofa ergonomis & meja konsultasi privat',
      'Pendampingan khusus Liaison Officer (LO) One-on-One dari kedatangan hingga selesai',
      'Jalur Loket Bypass prioritas tanpa perlu menunggu di ruang tunggu umum',
      'Koneksi Internet Wi-Fi Dedicated Gigabit berkecepatan tinggi & charging station',
      'Complimentary refreshment (kopi Robusta Luwu, teh hangat, dan air mineral gratis)',
      'Akses langsung ke ruang rapat mediasi perizinan terpadu lintas OPD teknis'
    ],
    requirements: [
      'Kartu Tanda Penduduk (KTP-el) Pemohon / Kuasa Direksi yang sah',
      'Nomor Induk Berusaha (NIB) atau Bukti Rencana Investasi (bagi investor)',
      'Identitas pendukung khusus (bagi lansia / ibu hamil prioritas non-investasi)'
    ],
    workflow: [
      { step: 1, title: 'Penyambutan di Front Office', desc: 'Petugas keamanan & resepsionis mengarahkan langsung ke Executive VIP Lounge.' },
      { step: 2, title: 'Pendampingan Personal LO', desc: 'Liaison Officer memvalidasi berkas dan mendampingi entri data perizinan.' },
      { step: 3, title: 'Pemrosesan Paralel Lintas OPD', desc: 'Verifikasi teknis dilakukan serentak tanpa pemohon berpindah-pindah loket.' },
      { step: 4, title: 'Penyerahan Dokumen & Pengawalan', desc: 'Dokumen perizinan diserahkan dalam map resmi eksklusif MPP Simpurusiang.' }
    ],
    contactOfficer: {
      name: 'Tim Helpdesk Investasi Prioritas',
      role: 'Koordinator Gerai Fast-Track DPMPTSP Luwu',
      phone: '0811-4200-9999'
    }
  },

  'layanan-mandiri': {
    gallery: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200'
    ],
    location: 'Lobi Utama MPP Simpurusiang (Central E-Kiosk & ADM Station)',
    sla: '3 - 7 Menit (Cetak Instan Mandiri)',
    cost: 'Rp 0,- (Bebas Biaya Retribusi)',
    regulations: 'Permendagri No. 109/2019 tentang Penerbitan Adminduk & Digitalisasi Layanan',
    targetCriteria: [
      'Masyarakat umum yang membutuhkan kecepatan cetak dokumen adminduk tanpa antre loket',
      'Pelaku UMKM mikro yang ingin melakukan pendaftaran NIB mandiri lewat portal OSS',
      'Warga pemegang KTP digital (IKD) yang ingin melakukan verifikasi biometrik mandiri',
      'Pemohon yang ingin mengambil nomor antrean digital terintegrasi sebelum waktu buka loket'
    ],
    facilities: [
      '4 Unit Anjungan Dukcapil Mandiri (ADM) dengan sensor biometrik sidik jari & retina',
      '3 Terminal Komputer E-Kiosk Layar Sentuh 32 inch responsif berprosesor tinggi',
      'High-speed document scanner & laser printer khusus kertas sekuritas adminduk',
      'Pencetak Kartu Identitas Anak (KIA) dan KTP-el otomatis dengan waktu cetak < 90 detik',
      'Petugas IT Floater ramah yang selalu siaga di area kiosk untuk membimbing masyarakat',
      'Panduan visual infografis langkah demi langkah di setiap stasiun kerja'
    ],
    requirements: [
      'Nomor Induk Kependudukan (NIK) dan Nomor Kartu Keluarga (KK)',
      'PIN aktivasi IKD / Nomor WhatsApp aktif untuk verifikasi kode OTP',
      'KTP-el lama (jika ingin mencetak penggantian KTP-el yang rusak)'
    ],
    workflow: [
      { step: 1, title: 'Sentuh Layar & Scan Identitas', desc: 'Pindai barcode pada ponsel atau letakkan sidik jari pada mesin ADM.' },
      { step: 2, title: 'Pilih Dokumen yang Diinginkan', desc: 'Pilih opsi cetak KK, KIA, Akta Lahir, atau perizinan mandiri NIB.' },
      { step: 3, title: 'Verifikasi Kode OTP / Biometrik', desc: 'Sistem mencocokkan data langsung dengan database server pusat secara aman.' },
      { step: 4, title: 'Ambil Dokumen Fisik', desc: 'Dokumen dicetak instan dan siap digunakan dengan legalitas tanda tangan elektronik (TTE).' }
    ],
    contactOfficer: {
      name: 'Tim Pendamping Kiosk Mandiri',
      role: 'Divisi Teknologi Informasi MPP Luwu',
      phone: '0811-4200-8888'
    }
  },

  'layanan-disabilitas': {
    gallery: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200'
    ],
    location: 'Lobi Selatan (Pintu Masuk Akses Khusus Difabel) & Loket Khusus Inklusif 01',
    sla: '10 - 25 Menit (Pendampingan Penuh)',
    cost: 'Rp 0,- (100% Gratis & Ramah Difabel)',
    regulations: 'PermenPAN-RB No. 9/2021 tentang Pedoman Pelayanan Ramah Kaum Rentan & Disabilitas',
    targetCriteria: [
      'Penyandang disabilitas fisik (pengguna kursi roda, tongkat penyangga, kruk)',
      'Penyandang disabilitas sensorik netra (tunanetra low-vision maupun total)',
      'Penyandang disabilitas sensorik rungu/wicara (tuli dan bisu)',
      'Penyandang disabilitas intelektual & mental yang membutuhkan pendampingan sabar',
      'Lansia rentan dengan penurunan fungsi motorik'
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
    requirements: [
      'KTP-el atau Kartu Penyandang Disabilitas (jika memiliki)',
      'Dokumen permohonan layanan dasar yang hendak diurus',
      'Surat kuasa khusus jika dikuasakan kepada pendamping resmi keluarga'
    ],
    workflow: [
      { step: 1, title: 'Penjemputan di Drop-Off', desc: 'Petugas LO Inklusif menyambut di pintu masuk dengan penyediaan kursi roda.' },
      { step: 2, title: 'Pengawalan ke Loket Khusus', desc: 'Pemohon diarahkan melalui jalur khusus tanpa perlu naik tangga.' },
      { step: 3, title: 'Pelayanan dengan Juru Bahasa Isyarat / Audio', desc: 'Proses konsultasi dan verifikasi dokumen berlangsung santai dan inklusif.' },
      { step: 4, title: 'Pengantaran Kembali', desc: 'Petugas memastikan dokumen diterima pemohon dan mengantar kembali hingga ke kendaraan.' }
    ],
    contactOfficer: {
      name: 'Tim Satgas Layanan Inklusif',
      role: 'Unit Respon Kaum Rentan MPP Simpurusiang',
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
  const [activeTab, setActiveTab] = useState<'specs' | 'gallery' | 'workflow'>('specs');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);

  if (!isOpen || !service) return null;

  // Gabungkan data dasar dan data spesifikasi lengkap
  const specData = DETAILED_SERVICE_SPECS[service.id] || {};
  const gallery = specData.gallery && specData.gallery.length > 0 ? specData.gallery : [service.image];
  const location = specData.location || 'MPP Simpurusiang Kabupaten Luwu, Jl. Jend. Sudirman, Belopa';
  const sla = specData.sla || '15 - 30 Menit';
  const cost = specData.cost || 'Rp 0,- (Gratis Resmi)';
  const regulations = specData.regulations || 'Standar Pelayanan Publik MPP Simpurusiang Kab. Luwu';
  const targetCriteria = specData.targetCriteria || [
    'Masyarakat umum Kabupaten Luwu pemegang KTP/KK resmi',
    'Pelaku usaha & investor yang mengajukan permohonan berizin'
  ];
  const facilities = specData.facilities || [
    'Ruang tunggu bersih ber-AC dengan tempat duduk ergonomis',
    'Sistem antrean digital terintegrasi dengan layar monitor informasi',
    'Akses Wi-Fi gratis dan charging station'
  ];
  const requirements = specData.requirements || [
    'KTP-el Asli Pemohon / Identitas Diri yang berlaku',
    'Dokumen permohonan sesuai gerai OPD yang dituju'
  ];
  const workflow = specData.workflow || [
    { step: 1, title: 'Registrasi di Lobi', desc: 'Ambil nomor antrean atau registrasi online.' },
    { step: 2, title: 'Menuju Loket Terpadu', desc: 'Dipanggil sesuai nomor antrean untuk verifikasi.' },
    { step: 3, title: 'Penyelesaian Dokumen', desc: 'Penerbitan dokumen resmi pelayanan.' }
  ];
  const contactOfficer = specData.contactOfficer || {
    name: 'Helpdesk Layanan MPP Simpurusiang',
    role: 'Pusat Informasi & Pengaduan',
    phone: '0811-4200-9999'
  };

  const IconComponent = service.icon || Star;

  return (
    <AnimatePresence>
      <div 
        id="mpp-service-detail-backdrop"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-md bg-slate-950/70"
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
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white font-sans"
        >
          {/* Header Bar dengan Tombol Tutup Presisi */}
          <div className="relative z-10 px-5 sm:px-7 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${service.iconContainerClass || 'bg-emerald-500/10 dark:bg-emerald-500/20'}`}>
                <IconComponent className={`w-5 h-5 ${service.iconColor || 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Dokumentasi & Spesifikasi Resmi
                </span>
                <h2 id="service-detail-title" className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {service.title}
                </h2>
              </div>
            </div>

            <button
              id="close-service-detail-modal-btn"
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup jendela spesifikasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Konten Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 p-5 sm:p-7 space-y-6">
            {/* Hero Showcase: Dokumentasi Foto HD & Keterangan Lokasi */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-lg bg-slate-950 group">
              <div 
                className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden cursor-pointer"
                onClick={() => setIsPhotoPreviewOpen(true)}
                title="Klik untuk memperbesar dokumentasi foto"
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

                {/* Badges di Kiri Atas */}
                <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-2 z-10">
                  <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-[11px] font-semibold shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>MPP Simpurusiang Certified</span>
                  </div>
                  <span className={`text-[11px] font-bold tracking-wide uppercase px-3 py-1.5 rounded-full border shadow-sm ${service.badgeClass || 'bg-white/90 text-slate-900 border-white/30'}`}>
                    {service.badge}
                  </span>
                </div>

                {/* Tombol Perbesar Foto di Kanan Atas */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhotoPreviewOpen(true);
                  }}
                  className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-md transition-all cursor-pointer hover:scale-105"
                  title="Lihat foto resolusi tinggi"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Perbesar HD</span>
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
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 shadow-md"
                      aria-label="Foto sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoIndex(prev => (prev < gallery.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 shadow-md"
                      aria-label="Foto berikutnya"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Overlay Keterangan di Atas Foto */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white pointer-events-none">
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {location}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-200 max-w-xl line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  {/* Indikator Jumlah Foto */}
                  {gallery.length > 1 && (
                    <div className="text-[11px] text-slate-300 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/10 self-start sm:self-auto">
                      Foto {selectedPhotoIndex + 1} dari {gallery.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnails Bar (Bila ada lebih dari 1 foto dokumentasi) */}
              {gallery.length > 1 && (
                <div className="p-3 bg-slate-900/95 border-t border-white/10 flex items-center gap-2.5 overflow-x-auto scrollbar-none">
                  {gallery.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
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
                    Standar SLA
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
                    Biaya / Tarif
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
                    Zona Layanan
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
                { id: 'specs', label: 'Spesifikasi & Kriteria', icon: Info },
                { id: 'workflow', label: 'Alur & SOP Pelayanan', icon: Layers },
                { id: 'gallery', label: 'Kelengkapan Sarpras', icon: Sparkles }
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
                      <h4>Kriteria Sasaran Pemohon</h4>
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
                      <h4>Persyaratan Dokumen</h4>
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
                      Dasar Hukum: <span className="font-medium text-slate-700 dark:text-slate-300">{regulations}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'workflow' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      Alur Tahapan Pelayanan Terpadu
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
                    Spesifikasi Fasilitas & Sarana Prasarana
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
                    Bantuan Langsung / Liaison Officer (LO)
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {contactOfficer.name} ({contactOfficer.role})
                  </div>
                </div>
              </div>

              <a
                href={`https://wa.me/6281142009999?text=${encodeURIComponent(`Halo Helpdesk MPP Simpurusiang, saya ingin bertanya mengenai spesifikasi dan syarat ${service.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-bold transition-colors flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <span>Konsultasi WA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Footer Aksi Presisi: Daftar Antrean atau Kembali */}
          <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3.5">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Sudah memahami spesifikasi? Lanjutkan untuk mengambil nomor antrean resmi.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <button
                id="book-queue-from-detail-modal-btn"
                type="button"
                onClick={() => {
                  if (onBookQueue) {
                    onBookQueue(service.title);
                  }
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group font-['Plus_Jakarta_Sans',sans-serif]"
              >
                <Calendar className="w-4 h-4 text-slate-950" />
                <span>Daftar Antrean Layanan Ini</span>
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
                    <span>{service.title}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Foto {selectedPhotoIndex + 1} dari {gallery.length}
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
                  alt={`${service.title} - Foto ${selectedPhotoIndex + 1}`}
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
