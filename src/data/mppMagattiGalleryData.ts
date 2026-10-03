export interface MagattiPhotoItem {
  id: string;
  title: string;
  caption: string;
  url: string;
  category: 'Tampak Depan' | 'Ruang Loket' | 'Lobby & Konsierge' | 'Fasilitas Digital' | 'Lounge VIP' | 'Ruang Ramah Anak' | 'Fasilitas Inklusi';
  isActive: boolean;
  order: number;
  location?: string;
  features?: string[];
}

export interface MagattiSlideshowSettings {
  intervalMs: number; // e.g. 5000
  animationType: 'kenburns' | 'fadeZoom' | 'slide3d' | 'blurFade';
  autoPlay: boolean;
  showCaption: boolean;
}

export const DEFAULT_MAGATTI_PHOTOS: MagattiPhotoItem[] = [
  {
    id: 'magatti-1',
    title: 'Gedung Tampak Depan MPP Simpurusiang Belopa',
    caption: 'Fasad utama Gedung Mal Pelayanan Publik Simpurusiang Kabupaten Luwu di Jalan Pahlawan Belopa, mencerminkan identitas arsitektur modern berpadu kearifan lokal.',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Tampak Depan',
    isActive: true,
    order: 1,
    location: 'Jl. Pahlawan No. 1, Belopa',
    features: ['Akses Parkir Luas', 'Taman Hijau', 'Pintu Masuk Ramah Difabel', 'Pos Keamanan 24 Jam']
  },
  {
    id: 'magatti-2',
    title: 'Ruang Loket Pelayanan Terpadu Satu Atap',
    caption: 'Area loket pelayanan 26 gerai instansi terintegrasi dengan tata ruang ergonomis dan sistem pemanggil antrean otomatis multi-bahasa.',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Ruang Loket',
    isActive: true,
    order: 2,
    location: 'Lantai 1 • Hall Utama',
    features: ['26 Gerai Instansi', 'Display Monitor Digital', 'Kursi Tunggu Ergonomis', 'Full AC']
  },
  {
    id: 'magatti-3',
    title: 'Lobby Utama & Konsierge Asisten Digital',
    caption: 'Lobby penerimaan warga dengan petugas front-desk ramah, asisten suara AI Ta\', serta panel layar interaktif statistik pelayanan real-time.',
    url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Lobby & Konsierge',
    isActive: true,
    order: 3,
    location: 'Lantai 1 • Foyer Masuk',
    features: ['Meja Konsierge', 'Layar Sentuh Indeks Kepuasan', 'Free High-Speed WiFi', 'Informasi Tarif Transparan']
  },
  {
    id: 'magatti-4',
    title: 'Anjungan Mandiri & Kiosk Cetak Dokumen',
    caption: 'Fasilitas mandiri warga untuk mencetak KTP-el, NIB UMKM, verifikasi berkas, dan perpanjangan dokumen secara mandiri tanpa perlu antre.',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Fasilitas Digital',
    isActive: true,
    order: 4,
    location: 'Lantai 1 • Sayap Kiri',
    features: ['Mesin Cetak KTP-el', 'Anjungan NIB OSS', 'Scan Berkas QR Code', 'Instruksi Panduan Audio']
  },
  {
    id: 'magatti-5',
    title: 'Lounge Pelayanan VIP Fast-Track Investor',
    caption: 'Ruang konsultasi eksklusif bagi investor, pelaku usaha, dan penanam modal dengan pendampingan langsung oleh Account Officer DPMPTSP Luwu.',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Lounge VIP',
    isActive: true,
    order: 5,
    location: 'Lantai 2 • Sayap Timur',
    features: ['Privat Konsultasi Berusaha', 'Fasilitas Konferensi & Presentasi', 'Layanan Pojok Kopi Khas Luwu', 'Koneksi Gigabit']
  },
  {
    id: 'magatti-6',
    title: 'Ruang Ramah Anak & Fasilitas Laktasi Ibu Menyusui',
    caption: 'Zona bermain interaktif anak yang aman dan higienis serta ruang laktasi privat yang nyaman dan tenang bagi ibu menyusui saat mengurus layanan.',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Ruang Ramah Anak',
    isActive: true,
    order: 6,
    location: 'Lantai 1 • Sayap Barat',
    features: ['Mainan Edukatif Anak', 'Sofa Laktasi Privat', 'Sterilizer & Wastafel', 'Lantai Busa Lembut']
  },
  {
    id: 'magatti-7',
    title: 'Jalur Pemandu Taktil & Fasilitas Inklusi Disabilitas',
    caption: 'Standar aksesibilitas penuh bagi penyandang disabilitas dan lansia meliputi jalur taktil (guiding block), kursi roda gratis, serta loket ramah kursi roda.',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Fasilitas Inklusi',
    isActive: true,
    order: 7,
    location: 'Seluruh Koridor & Pintu Akses',
    features: ['Kursi Roda Standar Medis', 'Jalur Pemandu Tuna Netra', 'Ramp Kemiringan Standar PU', 'Toilet Khusus Difabel']
  }
];

export const DEFAULT_SLIDESHOW_SETTINGS: MagattiSlideshowSettings = {
  intervalMs: 5000,
  animationType: 'kenburns',
  autoPlay: true,
  showCaption: true
};

const PHOTOS_STORAGE_KEY = 'mpp_magatti_photos_v1';
const SETTINGS_STORAGE_KEY = 'mpp_magatti_settings_v1';

export function getStoredMagattiPhotos(): MagattiPhotoItem[] {
  try {
    const raw = localStorage.getItem(PHOTOS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(DEFAULT_MAGATTI_PHOTOS));
      return DEFAULT_MAGATTI_PHOTOS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // If user hasn't added custom ones or some defaults are missing, enrich with default locations/features
      const merged = DEFAULT_MAGATTI_PHOTOS.map(def => {
        const match = parsed.find((p: any) => p.id === def.id);
        if (match) {
          return {
            ...def,
            ...match,
            location: match.location || def.location,
            features: match.features || def.features
          };
        }
        return def;
      });
      // Also keep any custom photos created by admin
      const customOnes = parsed.filter((p: any) => !DEFAULT_MAGATTI_PHOTOS.some(d => d.id === p.id));
      return [...merged, ...customOnes];
    }
    return DEFAULT_MAGATTI_PHOTOS;
  } catch (err) {
    console.warn('Failed to read Magatti photos from localStorage:', err);
    return DEFAULT_MAGATTI_PHOTOS;
  }
}

export function saveMagattiPhotos(photos: MagattiPhotoItem[]): void {
  try {
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos));
    window.dispatchEvent(new CustomEvent('mpp_magatti_gallery_updated', { detail: { photos } }));
  } catch (err) {
    console.error('Failed to save Magatti photos to localStorage:', err);
  }
}

export function getStoredMagattiSettings(): MagattiSlideshowSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SLIDESHOW_SETTINGS));
      return DEFAULT_SLIDESHOW_SETTINGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_SLIDESHOW_SETTINGS;
  }
}

export function saveMagattiSettings(settings: MagattiSlideshowSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('mpp_magatti_gallery_updated', { detail: { settings } }));
  } catch (err) {
    console.error('Failed to save Magatti settings to localStorage:', err);
  }
}
