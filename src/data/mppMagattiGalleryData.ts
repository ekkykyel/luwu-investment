export interface MagattiPhotoItem {
  id: string;
  title: string;
  caption: string;
  url: string;
  category: 'Tampak Depan' | 'Ruang Loket' | 'Lobby & Konsierge' | 'Fasilitas Digital' | 'Lounge VIP';
  isActive: boolean;
  order: number;
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
    caption: 'Fasad utama Gedung Mal Pelayanan Publik Simpurusiang Kabupaten Luwu di Jalan Pahlawan Belopa.',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Tampak Depan',
    isActive: true,
    order: 1
  },
  {
    id: 'magatti-2',
    title: 'Ruang Loket Pelayanan Terpadu Satu Atap',
    caption: 'Area loket pelayanan 26 gerai instansi terintegrasi dengan sistem pemanggil antrean otomatis.',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Ruang Loket',
    isActive: true,
    order: 2
  },
  {
    id: 'magatti-3',
    title: 'Lobby Utama & Konsierge Asisten Digital',
    caption: 'Lobby penerimaan warga dilengkapi petugas ramah, Kios Digital Mandiri, dan layar statistik live.',
    url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Lobby & Konsierge',
    isActive: true,
    order: 3
  },
  {
    id: 'magatti-4',
    title: 'Anjungan Mandiri & Kiosk Cetak Dokumen',
    caption: 'Fasilitas mandiri warga untuk mencetak KTP-el, NIB UMKM, serta verifikasi berkas secara mandiri.',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Fasilitas Digital',
    isActive: true,
    order: 4
  },
  {
    id: 'magatti-5',
    title: 'Lounge Pelayanan VIP Fast-Track Investor',
    caption: 'Ruang konsultasi khusus investor dan pelaku usaha dengan fasilitas konsultasi privat.',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    category: 'Lounge VIP',
    isActive: true,
    order: 5
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
      return parsed;
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
