import {
  Armchair,
  Baby,
  Gamepad2,
  Store,
  Moon,
  Laptop,
  BookOpen,
  Accessibility,
  HeartHandshake,
  LucideIcon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getImageUrl } from '../utils/imageFallbacks';

export interface MppFacilityItem {
  id: string;
  dbId?: string;
  key: string;
  name: string;
  shortName: string;
  subtitle: string;
  tag: string;
  description: string;
  floor: string;
  icon: LucideIcon;
  image: string;
  features: string[];
  isStandard?: boolean;
}

export const DEFAULT_OFFICIAL_MPP_FACILITIES: Array<{
  id: string;
  key: string;
  name: string;
  shortName: string;
  subtitle: string;
  tag: string;
  description: string;
  floor: string;
  icon: LucideIcon;
  image: string;
  features: string[];
}> = [
  {
    id: 'lounge',
    key: 'lounge',
    name: 'Executive Lounge & Ruang Tunggu VIP',
    shortName: 'Lounge VIP',
    subtitle: 'Lantai 1 – Hall Utama',
    tag: 'Eksklusif & Nyaman',
    floor: 'Lantai 1',
    description: 'Fasilitas ruang tunggu eksklusif berstandar hotel berbintang di MPP Simpurusiang Kabupaten Luwu. Didesain untuk memberikan relaksasi maksimal bagi pemohon izin, perwakilan korporasi, dan calon investor dengan suasana tenang, penyejuk ruangan sentral, sajian kopi khas pegunungan Luwu, serta stasiun pengisian daya gawai berkecepatan tinggi.',
    icon: Armchair,
    image: '/assets/images/default-facility.svg',
    features: [
      'Sofa Ergonomis & Suasana Tenang',
      'Kopi & Teh Khas Luwu Gratis',
      'Wi-Fi Orbit Cepat & Charging Station',
      'Layar Monitor Progres Antrean Live'
    ]
  },
  {
    id: 'laktasi',
    key: 'laktasi',
    name: 'Ruang Laktasi & Ibu Menyusui',
    shortName: 'Pojok Laktasi',
    subtitle: 'Lantai 1 – Sayap Barat',
    tag: 'Privat & Higienis',
    floor: 'Lantai 1',
    description: 'Fasilitas privat, higienis, dan ramah keluarga di MPP Simpurusiang Kabupaten Luwu. Menyediakan lingkungan yang tenang, aman, dan berhawa sejuk bagi ibu yang sedang menyusui atau memompa ASI saat mengurus layanan publik, dilengkapi wastafel cuci tangan steril, kulkas penyimpanan ASI, serta meja ganti popok khusus.',
    icon: Baby,
    image: '/assets/images/default-facility.svg',
    features: [
      'Bilik Privat Tertutup & Nyaman',
      'Wastafel Cuci Tangan & Sterilisasi',
      'Sofa Menyusui Ergonomis',
      'Meja Ganti Popok Balita Khusus'
    ]
  },
  {
    id: 'kids-corner',
    key: 'kids',
    name: 'Kids Play Zone & Arena Bermain Anak',
    shortName: 'Kids Play Zone',
    subtitle: 'Lantai 1 – Sayap Timur',
    tag: 'Edukasi & Ramah Anak',
    floor: 'Lantai 1',
    description: 'Wahana interaktif ramah anak yang dirancang aman, bersih, dan mendidik. Dilengkapi alas busa anti-benturan berstandar SNI, aneka mainan edukatif kayu, buku bergambar satwa endemik Luwu, serta pengawasan CCTV agar orang tua dapat mengurus perizinan dengan tenang tanpa khawatir sang buah hati rewel.',
    icon: Gamepad2,
    image: '/assets/images/default-facility.svg',
    features: [
      'Matras Busa Anti-Benturan SNI',
      'Mainan Montessori & Balok Kreatif',
      'Buku Cerita Bergambar Edukatif',
      'Area Terpantau CCTV & Aman'
    ]
  },
  {
    id: 'galeri-umkm',
    key: 'galeri',
    name: 'Galeri Promosi UMKM & Produk Unggulan Luwu',
    shortName: 'Galeri UMKM',
    subtitle: 'Lantai 1 – Koridor Promosi',
    tag: 'Ekonomi Kerakyatan',
    floor: 'Lantai 1',
    description: 'Etalase kebanggaan produk lokal unggulan hasil karya pelaku usaha mikro, kecil, dan menengah binaan Kabupaten Luwu. Menampilkan komoditas kopi khas Latimojong & Bastem, kerajinan tenun tradisional, aneka olahan sagu premium, hingga produk panganan kemasan bersertifikat halal dan izin edar resmi P-IRT.',
    icon: Store,
    image: '/assets/images/default-facility.svg',
    features: [
      'Showcase Kopi Arabika Latimojong & Bastem',
      'Kerajinan Tangan & Tenun Khas Luwu',
      'Produk Bersertifikat Halal & P-IRT',
      'Integrasi Pembayaran QRIS Digital'
    ]
  },
  {
    id: 'musholla',
    key: 'musholla',
    name: 'Musholla & Sarana Ibadah Representatif',
    shortName: 'Musholla',
    subtitle: 'Lantai 1 & Lantai 2',
    tag: 'Suci & Nyaman',
    floor: 'Lantai 1 & 2',
    description: 'Ruang ibadah yang luas, bersih, dan hening untuk kenyamanan beribadah para pengunjung serta aparatur pelayanan publik. Dilengkapi tempat wudhu terpisah untuk pria dan wanita dengan sirkulasi air yang lancar, sajadah tebal bersih, mukena/sarung terawat, penyejuk ruangan, serta penunjuk arah kiblat akurat.',
    icon: Moon,
    image: '/assets/images/default-facility.svg',
    features: [
      'Tempat Wudhu Pria & Wanita Terpisah',
      'Sajadah Lembut & Perlengkapan Shalat Bersih',
      'Pendingin Udara & Sirkulasi Hening',
      'Kapasitas Luas & Ramah Akses'
    ]
  },
  {
    id: 'ekiosk',
    key: 'ekiosk',
    name: 'E-Kiosk Antrean & Layanan Mandiri Digital',
    shortName: 'E-Kiosk Mandiri',
    subtitle: 'Lantai 1 – Lobi Depan',
    tag: 'Digital & Mandiri',
    floor: 'Lantai 1',
    description: 'Anjungan digital layar sentuh interaktif untuk pengambilan tiket nomor antrean terintegrasi, pendaftaran online, cetak mandiri bukti tanda terima perizinan, hingga penelusuran status berkas (*tracking status*) melalui pemindaian kode QR secara cepat tanpa perlu antre di loket informasi.',
    icon: Laptop,
    image: '/assets/images/default-facility.svg',
    features: [
      'Cetak Tiket Antrean Barcode Instan',
      'Scanner e-KTP & QR Code Resi Dokumen',
      'Akses Mandiri Portal Perizinan OSS & Sicantik',
      'Antarmuka Layar Sentuh Ramah Pemula'
    ]
  },
  {
    id: 'pojok-baca',
    key: 'baca',
    name: 'Pojok Baca Digital & Ruang Literasi',
    shortName: 'Pojok Baca',
    subtitle: 'Lantai 2 – Mezanin Edukasi',
    tag: 'Literasi & Edukasi',
    floor: 'Lantai 2',
    description: 'Ruang literasi modern hasil kolaborasi dengan Dinas Perpustakaan dan Kearsipan Daerah Kabupaten Luwu. Menyediakan tablet e-library dengan ribuan koleksi buku digital, majalah terbitan berkala pemerintah, buku statistik investasi daerah, serta sudut membaca yang estetik dan tenang.',
    icon: BookOpen,
    image: '/assets/images/default-facility.svg',
    features: [
      'Koleksi E-Book & Jurnal Investasi Digital',
      'Tablet Baca Interaktif Terhubung E-Perpus',
      'Koleksi Buku Sejarah & Potensi Luwu',
      'Meja Baca Santai Berpencahayaan Hangat'
    ]
  },
  {
    id: 'disabilitas',
    key: 'disabilitas',
    name: 'Fasilitas Ramah Disabilitas & Jalur Prioritas',
    shortName: 'Akses Disabilitas',
    subtitle: 'Lantai 1 & 2 – Seluruh Gedung',
    tag: 'Inklusif & Ramah Disabilitas',
    floor: 'Lantai 1 & 2',
    description: 'Dedikasi penuh MPP Simpurusiang dalam mewujudkan pelayanan publik inklusif tanpa diskriminasi. Menyediakan ramp landai berkursi roda, jalur pemandu tuna netra (*guiding block*), toilet khusus difabel dengan pegangan pengaman, kursi roda gratis di pintu masuk, loket meja rendah, serta petugas pendamping khusus.',
    icon: Accessibility,
    image: '/assets/images/default-facility.svg',
    features: [
      'Jalur Pemandu Ubin Tactile (*Guiding Block*)',
      'Ramp Kursi Roda & Pintu Akses Otomatis',
      'Toilet Khusus Disabilitas dengan Handrail',
      'Loket Layanan Meja Rendah Prioritas'
    ]
  },
  {
    id: 'pengaduan',
    key: 'pengaduan',
    name: 'Helpdesk Konsultasi & Meja Pengaduan Terpadu',
    shortName: 'Meja Pengaduan',
    subtitle: 'Lantai 1 – Front Office',
    tag: 'Respon Cepat & Solutif',
    floor: 'Lantai 1',
    description: 'Kanal tatap muka langsung bagi pemohon layanan yang membutuhkan advokasi perizinan, konsultasi regulasi investasi daerah, klarifikasi berkas teknis, maupun penyampaian saran dan aduan pelayanan yang langsung ditindaklanjuti oleh Tim Satgas Pengawasan Internal dan terhubung ke sistem nasional SP4N-LAPOR!.',
    icon: HeartHandshake,
    image: '/assets/images/default-facility.svg',
    features: [
      'Konsultasi Tatap Muka Bebas Biaya',
      'Terhubung Langsung Tim SP4N-LAPOR!',
      'Pendampingan Masalah Teknis OSS RBA',
      'Penanganan Aduan Maksimal 1x24 Jam'
    ]
  }
];

export function getIconForFacility(name: string): LucideIcon {
  const n = (name || '').toLowerCase();
  if (n.includes('anak') || n.includes('kid') || n.includes('bermain') || n.includes('play')) return Gamepad2;
  if (n.includes('baca') || n.includes('pustaka') || n.includes('buku') || n.includes('literasi')) return BookOpen;
  if (n.includes('laktasi') || n.includes('bayi') || n.includes('ibu') || n.includes('menyusui')) return Baby;
  if (n.includes('disabilitas') || n.includes('prioritas') || n.includes('difabel') || n.includes('kursi')) return Accessibility;
  if (n.includes('ibadah') || n.includes('musholla') || n.includes('shalat') || n.includes('masjid')) return Moon;
  if (n.includes('kiosk') || n.includes('digital') || n.includes('mandiri') || n.includes('antrean')) return Laptop;
  if (n.includes('pengaduan') || n.includes('aduan') || n.includes('helpdesk') || n.includes('konsultasi')) return HeartHandshake;
  if (n.includes('umkm') || n.includes('kemitraan') || n.includes('galeri') || n.includes('produk')) return Store;
  return Armchair;
}

/**
 * Menggabungkan fasilitas dari Database Supabase dengan 9 fasilitas standar resmi MPP.
 * Menjamin 9 fasilitas standar selalu lengkap, dan menampung fasilitas kustom tambahan dari admin.
 */
export function mergeFacilitiesWithDb(dbFacilities: any[], t: any): MppFacilityItem[] {
  // Map of standard facilities with i18n
  const standardMap = new Map<string, MppFacilityItem>();

  DEFAULT_OFFICIAL_MPP_FACILITIES.forEach(fac => {
    const rawFeatures = t(`mppPortal.facilitiesData.${fac.key}.features`, { returnObjects: true });
    const features = Array.isArray(rawFeatures) ? (rawFeatures as string[]) : fac.features;

    const translatedName = t(`mppPortal.facilitiesData.${fac.key}.name`);
    const translatedShortName = t(`mppPortal.facilitiesData.${fac.key}.shortName`);
    const translatedSubtitle = t(`mppPortal.facilitiesData.${fac.key}.subtitle`);
    const translatedTag = t(`mppPortal.facilitiesData.${fac.key}.tag`);
    const translatedDesc = t(`mppPortal.facilitiesData.${fac.key}.desc`);

    standardMap.set(fac.id, {
      ...fac,
      name: translatedName && !translatedName.startsWith('mppPortal.') ? translatedName : fac.name,
      shortName: translatedShortName && !translatedShortName.startsWith('mppPortal.') ? translatedShortName : fac.shortName,
      subtitle: translatedSubtitle && !translatedSubtitle.startsWith('mppPortal.') ? translatedSubtitle : fac.subtitle,
      tag: translatedTag && !translatedTag.startsWith('mppPortal.') ? translatedTag : fac.tag,
      description: translatedDesc && !translatedDesc.startsWith('mppPortal.') ? translatedDesc : fac.description,
      features,
      isStandard: true
    });
  });

  if (!dbFacilities || dbFacilities.length === 0) {
    return Array.from(standardMap.values());
  }

  // Helper to detect genuine uploaded images (excluding unsplash, placeholders)
  const isCustomUploadedImage = (url?: string | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (
      trimmed.includes('unsplash.com') ||
      trimmed.includes('via.placeholder') ||
      trimmed.includes('picsum.photos') ||
      trimmed.includes('placeholder')
    ) {
      return false;
    }
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('data:image');
  };

  // Sort DB facilities: rows with real custom uploaded photos and latest updates first!
  const sortedDb = [...dbFacilities].sort((a, b) => {
    const aImg = a.image_url || a.photo;
    const bImg = b.image_url || b.photo;
    const aHasCustom = isCustomUploadedImage(aImg) ? 1 : 0;
    const bHasCustom = isCustomUploadedImage(bImg) ? 1 : 0;
    if (aHasCustom !== bHasCustom) return bHasCustom - aHasCustom;
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });

  // Update standard items with DB data if matched, or collect custom ones
  const result: MppFacilityItem[] = [];
  const processedStandardIds = new Set<string>();
  const processedCustomNames = new Set<string>();

  sortedDb.forEach((df: any) => {
    const nameLower = (df.name || '').toLowerCase().trim();
    
    // Find if this corresponds to a standard facility
    let matchedStandardId: string | null = null;
    if (nameLower.includes('lounge') || nameLower.includes('vip') || nameLower.includes('tunggu')) {
      matchedStandardId = 'lounge';
    } else if (nameLower.includes('laktasi') || nameLower.includes('menyusui')) {
      matchedStandardId = 'laktasi';
    } else if (nameLower.includes('anak') || nameLower.includes('kids') || nameLower.includes('play')) {
      matchedStandardId = 'kids-corner';
    } else if (nameLower.includes('umkm') || nameLower.includes('galeri')) {
      matchedStandardId = 'galeri-umkm';
    } else if (nameLower.includes('musholla') || nameLower.includes('ibadah')) {
      matchedStandardId = 'musholla';
    } else if (nameLower.includes('kiosk') || nameLower.includes('mandiri')) {
      matchedStandardId = 'ekiosk';
    } else if (nameLower.includes('baca') || nameLower.includes('literasi') || nameLower.includes('pustaka')) {
      matchedStandardId = 'pojok-baca';
    } else if (nameLower.includes('disabilitas') || nameLower.includes('difabel') || nameLower.includes('prioritas') || nameLower.includes('inklusi')) {
      matchedStandardId = 'disabilitas';
    } else if (nameLower.includes('pengaduan') || nameLower.includes('helpdesk') || nameLower.includes('aduan') || nameLower.includes('konsultasi')) {
      matchedStandardId = 'pengaduan';
    }

    if (matchedStandardId && standardMap.has(matchedStandardId)) {
      const rawImg = df.image_url || df.photo;
      const hasDbImage = isCustomUploadedImage(rawImg);

      if (!processedStandardIds.has(matchedStandardId)) {
        const base = standardMap.get(matchedStandardId)!;
        processedStandardIds.add(matchedStandardId);

        const activeImage = hasDbImage ? getImageUrl(rawImg, 'facility') : base.image;

        result.push({
          ...base,
          id: base.id, // Keep canonical identifier (e.g. 'lounge', 'pojok-baca') for reliable state & selection
          dbId: String(df.id || base.id),
          name: df.name || base.name,
          shortName: df.name && df.name.length > 20 ? df.name.slice(0, 20) + '...' : (df.name || base.shortName),
          floor: df.floor || base.floor,
          subtitle: df.floor ? `${df.floor} – MPP Simpurusiang` : base.subtitle,
          description: df.description || base.description,
          image: activeImage,
        });
      } else if (hasDbImage) {
        // Upgrade existing standard item if a newer/better uploaded image is found
        const existingItem = result.find(r => r.id === matchedStandardId);
        if (existingItem && !isCustomUploadedImage(existingItem.image)) {
          existingItem.image = getImageUrl(rawImg, 'facility');
          if (df.id) existingItem.dbId = String(df.id);
          if (df.description) existingItem.description = df.description;
          if (df.floor) existingItem.floor = df.floor;
        }
      }
    } else if (df.name && df.name.trim().length > 0) {
      // Custom facility added by admin
      if (!processedCustomNames.has(nameLower)) {
        processedCustomNames.add(nameLower);

        const rawCustomImg = df.image_url || df.photo;
        const hasDbImage = isCustomUploadedImage(rawCustomImg);
        const activeImage = hasDbImage ? getImageUrl(rawCustomImg, 'facility') : '/assets/images/default-facility.svg';

        result.push({
          id: String(df.id),
          dbId: String(df.id),
          key: `custom_${df.id}`,
          name: df.name || 'Fasilitas MPP',
          shortName: df.name && df.name.length > 20 ? df.name.slice(0, 20) + '...' : df.name || 'Fasilitas',
          subtitle: df.floor || 'Lantai 1',
          tag: df.floor || 'Fasilitas Tambahan',
          floor: df.floor || 'Lantai 1',
          description: df.description || 'Fasilitas penunjang kenyamanan terpadu di Gedung Mal Pelayanan Publik Simpurusiang Luwu.',
          icon: getIconForFacility(df.name),
          image: activeImage,
          features: [
            'Aksesibilitas Prima & Ramah Semua Kalangan',
            'Kebersihan dan Kenyamanan Berstandar Nasional',
            'Terhubung Sistem Operasional MPP Simpurusiang'
          ],
          isStandard: false
        });
      }
    }
  });

  // Append any standard facilities that were not in DB so the 9 baseline facilities are always present!
  DEFAULT_OFFICIAL_MPP_FACILITIES.forEach(fac => {
    if (!processedStandardIds.has(fac.id)) {
      result.push(standardMap.get(fac.id)!);
    }
  });

  return result;
}

/**
 * Menyinkronkan dan menanam (seed) 9 Fasilitas Standar Resmi MPP ke tabel mpp_facilities di Supabase jika kosong atau berkurang.
 * Dilengkapi dengan logging diagnostik eksplisit & deteksi Row-Level Security (RLS).
 */
export async function syncOrSeedMppFacilitiesToSupabase(): Promise<{ success: boolean; count: number; message?: string }> {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('mpp_facilities')
      .select('id, name');

    if (fetchErr) {
      const isRlsError = fetchErr.code === '42501' || fetchErr.message?.toLowerCase().includes('row-level security') || fetchErr.message?.toLowerCase().includes('permission denied');
      console.error("[MPP Facilities Sync] Error accessing mpp_facilities table:", {
        code: fetchErr.code,
        message: fetchErr.message,
        details: fetchErr.details,
        hint: fetchErr.hint,
        isRlsBlocked: isRlsError,
        actionRequired: isRlsError ? "Run 20260918_mpp_facilities_rls.sql migration in Supabase SQL Editor" : "Check Supabase table existence"
      });
      return { success: false, count: 0, message: fetchErr.message };
    }

    const existingNames = new Set((existing || []).map((e: any) => (e.name || '').toLowerCase().trim()));
    const toInsert: any[] = [];

    DEFAULT_OFFICIAL_MPP_FACILITIES.forEach(fac => {
      const exists = Array.from(existingNames).some(name => 
        name.includes(fac.key) || 
        name.includes(fac.shortName.toLowerCase()) || 
        fac.name.toLowerCase().includes(name)
      );

      if (!exists) {
        toInsert.push({
          name: fac.name,
          floor: fac.floor,
          description: fac.description,
          image_url: fac.image
        });
      }
    });

    if (toInsert.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('mpp_facilities')
        .insert(toInsert)
        .select();

      if (insertErr) {
        const isRlsError = insertErr.code === '42501' || insertErr.message?.toLowerCase().includes('row-level security') || insertErr.message?.toLowerCase().includes('permission denied');
        console.error("[MPP Facilities Sync] Insert operation failed:", {
          code: insertErr.code,
          message: insertErr.message,
          details: insertErr.details,
          hint: insertErr.hint,
          isRlsBlocked: isRlsError,
          itemsCount: toInsert.length
        });
        return { success: false, count: 0, message: insertErr.message };
      }

      console.info(`[MPP Facilities Sync] Successfully seeded ${inserted?.length || toInsert.length} official facilities to Supabase.`);
      return { success: true, count: inserted?.length || toInsert.length };
    }

    console.info("[MPP Facilities Sync] All 9 standard facilities are already present in Supabase.");
    return { success: true, count: 0, message: "Semua 9 fasilitas standar telah lengkap di database." };
  } catch (err: any) {
    console.error("[MPP Facilities Sync] Unexpected exception during facilities sync:", err);
    return { success: false, count: 0, message: err?.message || "Unknown error" };
  }
}
