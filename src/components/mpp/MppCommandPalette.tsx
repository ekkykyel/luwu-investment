import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Building2,
  Ticket,
  FileCheck2,
  Layers,
  SearchCheck,
  Sparkles,
  MapPin,
  Mic,
  Star,
  MessageSquareWarning,
  ArrowRight,
  Command,
  X,
  User,
  Briefcase,
  Globe,
  Clock,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  FileText
} from 'lucide-react';

export interface MppCommandItem {
  id: string;
  title: string;
  description?: string;
  category: 'instansi' | 'layanan' | 'aksi' | 'navigasi' | 'persona';
  categoryLabel: string;
  icon: React.ElementType;
  keywords?: string[];
  action: () => void;
  badge?: string;
}

interface MppCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activePersona: 'warga' | 'investor' | 'semua';
  onSelectPersona: (persona: 'warga' | 'investor' | 'semua') => void;
  onOpenQueueBooking: () => void;
  onOpenRequirements: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenAgenciesCatalog: () => void;
  onOpenServicesCatalog: () => void;
}

export const MppCommandPalette: React.FC<MppCommandPaletteProps> = ({
  isOpen,
  onClose,
  isDark,
  activePersona,
  onSelectPersona,
  onOpenQueueBooking,
  onOpenRequirements,
  onOpenVoiceAssistant,
  onOpenAgenciesCatalog,
  onOpenServicesCatalog,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global Keyboard shortcuts: Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const scrollToSection = (sectionId: string) => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Static indexed catalog of MPP Simpurusiang
  const allCommands = useMemo<MppCommandItem[]>(() => [
    // --- AKSI UTAMA & FITUR CEPAT ---
    {
      id: 'action-queue',
      title: 'Ambil Nomor Antrean Online',
      description: 'Dapatkan nomor tiket antrean digital & estimasi waktu layanan',
      category: 'aksi',
      categoryLabel: 'Aksi Cepat',
      icon: Ticket,
      badge: 'Online',
      keywords: ['antrean', 'tiket', 'booking', 'nomor', 'loket', 'daftar antrian'],
      action: () => {
        onClose();
        setTimeout(onOpenQueueBooking, 150);
      }
    },
    {
      id: 'action-voice',
      title: 'Tanya Suara Asisten MPP (Voice AI)',
      description: 'Konsultasi syarat & panduan perizinan dengan suara pintar berbahasa Indonesia',
      category: 'aksi',
      categoryLabel: 'Aksi Cepat',
      icon: Mic,
      badge: 'AI Smart',
      keywords: ['suara', 'tanya suara', 'mic', 'mikrofon', 'asisten', 'ai', 'bicara', 'audio'],
      action: () => {
        onClose();
        window.dispatchEvent(new CustomEvent('open-mpp-voice-assistant'));
        if (onOpenVoiceAssistant) setTimeout(onOpenVoiceAssistant, 150);
      }
    },
    {
      id: 'action-tracking',
      title: 'Lacak Status Berkas & Resi Izin',
      description: 'Cek progres permohonan izin dengan nomor resi/tracking code',
      category: 'aksi',
      categoryLabel: 'Aksi Cepat',
      icon: SearchCheck,
      keywords: ['lacak', 'tracking', 'resi', 'status', 'cek berkas', 'progres'],
      action: () => scrollToSection('tracking-berkas')
    },
    {
      id: 'action-requirements',
      title: 'Cek Persyaratan & Checklist Dokumen',
      description: 'Panduan syarat resmi KTP, PBG, Paspor, SKCK, dan izin usaha',
      category: 'aksi',
      categoryLabel: 'Aksi Cepat',
      icon: FileCheck2,
      keywords: ['syarat', 'checklist', 'dokumen', 'berkas', 'ktp', 'pbg', 'persyaratan'],
      action: () => {
        onClose();
        setTimeout(onOpenRequirements, 150);
      }
    },
    {
      id: 'action-3d-plan',
      title: 'Buka Denah 3D & Navigasi Loket',
      description: 'Peta lantai interaktif ruang tunggu, bilik instansi, dan fasilitas disabilitas',
      category: 'aksi',
      categoryLabel: 'Aksi Cepat',
      icon: Layers,
      keywords: ['denah', '3d', 'lantai', 'ruang', 'lokasi loket', 'peta ruangan'],
      action: () => scrollToSection('denah-interaktif')
    },
    {
      id: 'action-vip-investor',
      title: 'VIP Investor Desk & Fasilitasi Investasi',
      description: 'Layanan asistensi khusus penanaman modal dan Liaison Officer DPMPTSP',
      category: 'aksi',
      categoryLabel: 'Aksi Cepat',
      icon: Sparkles,
      badge: 'VIP EoDB',
      keywords: ['investor', 'vip', 'penanaman modal', 'liaison officer', 'investasi', 'bisnis', 'eodb'],
      action: () => scrollToSection('investor-vip')
    },
    {
      id: 'action-pkkpr-recommendation',
      title: 'Rekomendasi Teknis PKKPR (Dinas PUPTR)',
      description: 'Berita Acara Forum Penataan Ruang No. 120/BA-FPR/NB/IX/2026 sebagai landasan cetak izin OSS',
      category: 'aksi',
      categoryLabel: 'Aksi Cepat',
      icon: FileText,
      badge: 'PUPTR · OSS',
      keywords: ['pkkpr', 'rekomendasi teknis', 'puptr', 'fpr', 'tata ruang', 'oss', 'kesesuaian ruang', 'ermon ambing', 'lamasi', '120/ba-fpr', 'izin tata ruang', 'berita acara'],
      action: () => {
        onClose();
        window.dispatchEvent(new CustomEvent('open-pkkpr-recommendation'));
      }
    },

    // --- PERSONA SWITCHER MODES ---
    {
      id: 'persona-warga',
      title: 'Beralih ke: Mode Masyarakat (Citizen)',
      description: 'Prioritas antrean online, layanan kependudukan, syarat dokumen, dan pengaduan',
      category: 'persona',
      categoryLabel: 'Mode Tampilan',
      icon: User,
      badge: activePersona === 'warga' ? 'Aktif Saat Ini' : 'Pilih Mode',
      keywords: ['mode warga', 'masyarakat', 'publik', 'citizen', 'ganti persona', 'warga'],
      action: () => {
        onSelectPersona('warga');
        onClose();
      }
    },
    {
      id: 'persona-investor',
      title: 'Beralih ke: Mode Investor & Pelaku Usaha',
      description: 'Prioritas perizinan berusaha OSS-RBA, peta tata ruang RDTR, insentif & VIP Desk',
      category: 'persona',
      categoryLabel: 'Mode Tampilan',
      icon: Briefcase,
      badge: activePersona === 'investor' ? 'Aktif Saat Ini' : 'Pilih Mode',
      keywords: ['mode investor', 'bisnis', 'investasi', 'perusahaan', 'usaha', 'oss', 'rdtr'],
      action: () => {
        onSelectPersona('investor');
        onClose();
      }
    },
    {
      id: 'persona-semua',
      title: 'Beralih ke: Mode Semua Layanan (Ekosistem Lengkap)',
      description: 'Menampilkan seluruh seksi publik, bisnis, regulasi, dan galeri secara komprehensif',
      category: 'persona',
      categoryLabel: 'Mode Tampilan',
      icon: Globe,
      badge: activePersona === 'semua' ? 'Aktif Saat Ini' : 'Pilih Mode',
      keywords: ['mode semua', 'lengkap', 'semua layanan', 'ekosistem', 'full', 'all'],
      action: () => {
        onSelectPersona('semua');
        onClose();
      }
    },

    // --- INSTANSI TERGABUNG (19 INSTANSI) ---
    {
      id: 'instansi-disdukcapil',
      title: 'Dinas Kependudukan & Pencatatan Sipil (Disdukcapil)',
      description: 'KTP-el, Kartu Keluarga, Akta Kelahiran, Pindah Datang, Identitas Kependudukan Digital (IKD)',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 01',
      keywords: ['disdukcapil', 'dukcapil', 'ktp', 'kk', 'akta', 'ikd', 'nik', 'kependudukan'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-dpmptsp',
      title: 'Dinas Penanaman Modal & PTSP (DPMPTSP)',
      description: 'Izin Usaha Berbasis Risiko OSS-RBA, PBG (Persetujuan Bangunan Gedung), Reklame, SIP Dokter',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 02',
      keywords: ['dpmptsp', 'ptsp', 'izin', 'nib', 'oss', 'pbg', 'imb', 'penanaman modal'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-atrbpn',
      title: 'Kantor Pertanahan Kab. Luwu (ATR/BPN)',
      description: 'Pengecekan Sertipikat, Balik Nama, SKPT, Peralihan Hak, Informasi Tata Ruang Tanah',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 03',
      keywords: ['atrbpn', 'bpn', 'tanah', 'sertifikat', 'agraria', 'pertanahan', 'roya'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-samsat',
      title: 'SAMSAT Belopa (Bapenda Sulsel & Ditlantas)',
      description: 'Pembayaran PKB (Pajak Kendaraan Bermotor), SWDKLLJ, Pengesahan STNK Tahunan',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 04',
      keywords: ['samsat', 'pajak kendaraan', 'stnk', 'pkb', 'motor', 'mobil', 'plat'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-bpjs-kes',
      title: 'BPJS Kesehatan Kantor Cabang Luwu',
      description: 'Pendaftaran Peserta JKN-KIS, Perubahan Faskes, Mutasi Segmen, Reaktivasi Kepesertaan',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 05',
      keywords: ['bpjs kesehatan', 'jkn', 'kis', 'faskes', 'kartu indonesia sehat', 'kesehatan'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-bpjs-ket',
      title: 'BPJS Ketenagakerjaan (BPJSTK)',
      description: 'Klaim JHT, JKK, JKM, Pendaftaran Pekerja BPU (Bukan Penerima Upah), Cek Saldo Salinan',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 06',
      keywords: ['bpjs ketenagakerjaan', 'jht', 'jkk', 'jkm', 'pekerja', 'bpu', 'jamsostek'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-imigrasi',
      title: 'Kantor Imigrasi (Layanan Paspor)',
      description: 'Permohonan Paspor Baru Elektronik/Biasa, Penggantian Paspor Habis Masa Berlaku',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 07',
      keywords: ['imigrasi', 'paspor', 'passport', 'm-paspor', 'luar negeri', 'visa'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-polres',
      title: 'Polres Luwu (SKCK & Sentra Layanan)',
      description: 'Penerbitan Surat Keterangan Catatan Kepolisian (SKCK) Baru & Perpanjangan, Laporan Kehilangan',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 08',
      keywords: ['polres', 'polisi', 'skck', 'surat catatan kepolisian', 'laporan kehilangan'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-pajak',
      title: 'KPP Pratama Palopo (KP2KP Belopa)',
      description: 'Pembuatan NPWP Pribadi/Badan, Cetak Ulang NPWP, Pelaporan SPT Tahunan, EFIN',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 09',
      keywords: ['pajak', 'npwp', 'efin', 'spt', 'kpp', 'djp', 'faktur'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-kemenag',
      title: 'Kementerian Agama (Kemenag Luwu)',
      description: 'Pendaftaran Nikah Luar Balai, Rekomendasi Paspor Umrah/Haji, Sertifikasi Halal Gratis (SEHATI)',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 10',
      keywords: ['kemenag', 'nikah', 'haji', 'umrah', 'halal', 'sertifikat halal', 'agama'],
      action: () => scrollToSection('instansi')
    },
    {
      id: 'instansi-bank',
      title: 'Bank Sulselbar & Loket Kas Daerah',
      description: 'Pembayaran Retribusi Daerah, Pajak Bumi & Bangunan (PBB), Setoran Kas Negara, Pembukaan Rekening',
      category: 'instansi',
      categoryLabel: 'Instansi Tergabung',
      icon: Building2,
      badge: 'Gerai 11',
      keywords: ['bank', 'bank sulselbar', 'bayar retribusi', 'pbb', 'kasda', 'teller'],
      action: () => scrollToSection('instansi')
    },

    // --- LAYANAN POPULER ---
    {
      id: 'layanan-ktp',
      title: 'Perekaman & Cetak KTP-el / IKD',
      description: 'Layanan administrasi kartu tanda penduduk bagi pemula atau penggantian rusak/hilang',
      category: 'layanan',
      categoryLabel: 'Layanan Populer',
      icon: FileCheck2,
      keywords: ['ktp', 'ktp elektronik', 'perekaman', 'identitas kependudukan digital', 'ikd'],
      action: () => {
        onClose();
        setTimeout(onOpenServicesCatalog, 150);
      }
    },
    {
      id: 'layanan-pbg',
      title: 'Persetujuan Bangunan Gedung (PBG & SLF)',
      description: 'Pengganti IMB untuk izin mendirikan bangunan hunian, usaha, dan gedung bertingkat',
      category: 'layanan',
      categoryLabel: 'Layanan Populer',
      icon: FileCheck2,
      keywords: ['pbg', 'imb', 'slf', 'bangunan', 'gedung', 'arsitektur', 'retribusi bangunan'],
      action: () => {
        onClose();
        setTimeout(onOpenServicesCatalog, 150);
      }
    },
    {
      id: 'layanan-nib',
      title: 'Nomor Induk Berusaha (NIB OSS-RBA)',
      description: 'Legalitas usaha resmi satu pintu untuk UMKM perorangan maupun PT/CV',
      category: 'layanan',
      categoryLabel: 'Layanan Populer',
      icon: FileCheck2,
      keywords: ['nib', 'oss', 'izin usaha', 'umkm', 'legalitas', 'kbli'],
      action: () => {
        onClose();
        setTimeout(onOpenServicesCatalog, 150);
      }
    },
    {
      id: 'layanan-paspor',
      title: 'Penerbitan Paspor RI Baru & Penggantian',
      description: 'Pengurusan dokumen paspor dinas, wisata, dan umrah/haji tanpa keluar daerah',
      category: 'layanan',
      categoryLabel: 'Layanan Populer',
      icon: FileCheck2,
      keywords: ['paspor', 'passport', 'm-paspor', 'imigrasi', 'keluar negeri'],
      action: () => {
        onClose();
        setTimeout(onOpenServicesCatalog, 150);
      }
    },
    {
      id: 'layanan-skck',
      title: 'Penerbitan Surat Catatan Kepolisian (SKCK)',
      description: 'Syarat pemberkasan CPNS, BUMN, kelengkapan kerja swasta, dan pendaftaran sekolah',
      category: 'layanan',
      categoryLabel: 'Layanan Populer',
      icon: FileCheck2,
      keywords: ['skck', 'polisi', 'catatan kepolisian', 'lamaran kerja', 'cpns'],
      action: () => {
        onClose();
        setTimeout(onOpenServicesCatalog, 150);
      }
    },

    // --- NAVIGASI SEKSI HALAMAN ---
    {
      id: 'nav-motto',
      title: 'Motto Pelayanan (MAGATTI) & Galeri Gedung',
      description: 'Nilai inti pelayanan Murah, Gampang, Cepat, Tepat, dan Inovatif serta foto ruang MPP',
      category: 'navigasi',
      categoryLabel: 'Navigasi Seksi',
      icon: BookOpen,
      keywords: ['magatti', 'motto', 'galeri', 'gedung', 'slideshow', 'arsitektur'],
      action: () => scrollToSection('motto-pelayanan')
    },
    {
      id: 'nav-heatmap',
      title: 'Jam Kunjungan & Heatmap Keramaian',
      description: 'Pantau jam sibuk vs jam santai operasional MPP Simpurusiang setiap hari kerja',
      category: 'navigasi',
      categoryLabel: 'Navigasi Seksi',
      icon: Clock,
      keywords: ['jam', 'jam kerja', 'heatmap', 'ramai', 'sepi', 'operasional', 'jadwal'],
      action: () => scrollToSection('operasional-heatmap')
    },
    {
      id: 'nav-fasilitas',
      title: 'Fasilitas Publik & Ramah Disabilitas',
      description: 'Ruang laktasi, pojok baca digital, arena bermain anak, kursi roda, jalur pemandu',
      category: 'navigasi',
      categoryLabel: 'Navigasi Seksi',
      icon: ShieldCheck,
      keywords: ['fasilitas', 'disabilitas', 'laktasi', 'anak', 'kursi roda', 'toilet difabel'],
      action: () => scrollToSection('fasilitas')
    },
    {
      id: 'nav-umkm',
      title: 'Galeri & Pojok UMKM Binaan Luwu',
      description: 'Kopi Latimojong, olahan sagu, kerajinan lokal, dan produk khas Luwu',
      category: 'navigasi',
      categoryLabel: 'Navigasi Seksi',
      icon: Building2,
      keywords: ['umkm', 'kopi', 'produk lokal', 'sagu', 'kerajinan', 'gerai oleh-oleh'],
      action: () => scrollToSection('umkm')
    },
    {
      id: 'nav-survey',
      title: 'Survei Kepuasan Masyarakat (SKM Elektronik)',
      description: 'Penilaian mutu pelayanan publik 9 unsur sesuai standar PermenPAN-RB No. 14/2017',
      category: 'navigasi',
      categoryLabel: 'Navigasi Seksi',
      icon: Star,
      keywords: ['skm', 'survei', 'kepuasan', 'nilai layanan', 'ulasan', 'rating'],
      action: () => scrollToSection('survey')
    },
    {
      id: 'nav-pengaduan',
      title: 'Kanal Pengaduan Resmi & SP4N-LAPOR!',
      description: 'Layanan aspirasi pengaduan online masyarakat berintegritas dan bebas pungli',
      category: 'navigasi',
      categoryLabel: 'Navigasi Seksi',
      icon: MessageSquareWarning,
      keywords: ['pengaduan', 'lapor', 'aspirasi', 'keluhan', 'sp4n', 'pungli', 'helpdesk'],
      action: () => scrollToSection('pengaduan')
    },
    {
      id: 'nav-gis',
      title: 'Peta Spasial & Potensi Investasi WebGIS Luwu',
      description: 'Peta geospasial tematik batas wilayah, jaringan infrastruktur, dan potensi komoditas',
      category: 'navigasi',
      categoryLabel: 'Navigasi Seksi',
      icon: MapPin,
      keywords: ['peta', 'gis', 'webgis', 'spasial', 'potensi', 'infrastruktur', 'investasi'],
      action: () => scrollToSection('peta-spasial')
    }
  ], [activePersona, onSelectPersona, onOpenQueueBooking, onOpenRequirements, onOpenVoiceAssistant, onOpenAgenciesCatalog, onOpenServicesCatalog]);

  // Filtering by search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Prioritas default berdasarkan persona yang sedang aktif
      if (activePersona === 'warga') {
        return allCommands.filter(c => 
          c.category === 'aksi' || 
          c.category === 'persona' || 
          c.id === 'instansi-disdukcapil' || 
          c.id === 'layanan-ktp' || 
          c.id === 'layanan-pbg' ||
          c.id === 'nav-heatmap'
        );
      }
      if (activePersona === 'investor') {
        return allCommands.filter(c => 
          c.id === 'action-vip-investor' ||
          c.id === 'action-requirements' ||
          c.id === 'instansi-dpmptsp' ||
          c.id === 'instansi-atrbpn' ||
          c.id === 'layanan-nib' ||
          c.id === 'nav-gis' ||
          c.category === 'persona' ||
          c.category === 'aksi'
        );
      }
      return allCommands.slice(0, 10);
    }

    const cleanQuery = query.toLowerCase().trim();
    return allCommands.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(cleanQuery);
      const descMatch = item.description?.toLowerCase().includes(cleanQuery);
      const categoryMatch = item.categoryLabel.toLowerCase().includes(cleanQuery);
      const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(cleanQuery));
      return titleMatch || descMatch || categoryMatch || keywordMatch;
    });
  }, [allCommands, query, activePersona]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Keyboard navigation inside list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  // Ensure selected item is scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border backdrop-blur-2xl flex flex-col max-h-[80vh] ${
              isDark
                ? "bg-slate-900/95 border-emerald-500/30 text-white shadow-emerald-950/50"
                : "bg-white/95 border-emerald-500/25 text-slate-900 shadow-slate-900/20"
            }`}
          >
            {/* Header: Search Input & Shortcut Badge */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Search className="w-5 h-5" />
              </div>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ketik instansi, jenis izin, antrean, atau denah..."
                  className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none pr-8"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <kbd className="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-xs">
                  Esc
                </kbd>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Filter Tag Suggestions */}
            {!query && (
              <div className="px-3.5 sm:px-4 py-2 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200/50 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Saran:
                </span>
                {[
                  { label: '🎫 Antrean', q: 'antrean' },
                  { label: '🪪 KTP & IKD', q: 'ktp' },
                  { label: '🏢 Disdukcapil', q: 'disdukcapil' },
                  { label: '📑 Syarat Izin', q: 'syarat' },
                  { label: '💼 VIP Investor', q: 'investor' },
                  { label: '🗺️ Denah 3D', q: 'denah' },
                  { label: '🔍 Lacak Berkas', q: 'lacak' },
                ].map((s) => (
                  <button
                    key={s.q}
                    type="button"
                    onClick={() => setQuery(s.q)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800/80 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0 border border-transparent hover:border-emerald-500/30"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Result List */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-100 dark:divide-white/5"
            >
              {filteredCommands.length === 0 ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Tidak ada hasil untuk "{query}"
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
                    Coba kata kunci lain seperti nama instansi (Disdukcapil, BPJS, Samsat) atau layanan (KTP, NIB, Paspor, Antrean).
                  </p>
                </div>
              ) : (
                filteredCommands.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      data-index={index}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`p-3 sm:p-3.5 rounded-2xl cursor-pointer transition-all flex items-center gap-3.5 group select-none ${
                        isSelected
                          ? "bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100"
                          : "hover:bg-slate-100/60 dark:hover:bg-slate-800/50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                          isSelected
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:scale-105"
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 line-clamp-1 leading-snug">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-white/5">
                          {item.categoryLabel}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected
                              ? "text-emerald-500 translate-x-1"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: Keyboard Help & Status */}
            <div className="p-3 bg-slate-50/90 dark:bg-slate-950/80 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-sans">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9.5px]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9.5px]">↓</kbd>
                  <span className="hidden sm:inline ml-0.5">Navigasi</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9.5px]">↵</kbd>
                  <span className="hidden sm:inline ml-0.5">Pilih</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {filteredCommands.length} Opsi Tersedia
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default MppCommandPalette;
