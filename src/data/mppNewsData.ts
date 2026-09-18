export interface MppNewsItem {
  id: string;
  judul: string;
  judul_en?: string;
  judul_zh?: string;
  kategori: 'Giat Kegiatan MPP' | 'Berita Daerah' | 'Berita Nasional' | 'Berita Internasional' | 'Tips & Edukasi';
  kategoriKey?: string;
  penulis: string;
  tanggal: string;
  image: string;
  ringkasan: string;
  ringkasan_en?: string;
  ringkasan_zh?: string;
  isiLengkap: string;
  isiLengkap_en?: string;
  isiLengkap_zh?: string;
  isPinned?: boolean;
  status: 'published' | 'draft';
  viewsCount?: number;
}

export const INITIAL_MPP_NEWS: MppNewsItem[] = [
  {
    id: 'news-1',
    judul: 'Bupati Luwu Resmikan Integrasi 26 Gerai Layanan Publik Terpadu di MPP Simpurusiang',
    judul_en: 'Regent of Luwu Inaugurates Integration of 26 Public Service Counters at MPP Simpurusiang',
    judul_zh: '鲁乌县长主持辛普鲁西亚公共服务大厅26个综合窗口集成仪式',
    kategori: 'Giat Kegiatan MPP',
    penulis: 'Humas Pemkab Luwu',
    tanggal: '16 September 2026',
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    ringkasan: 'Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu resmi mengintegrasikan 26 instansi pemerintah, BUMN, BUMD, dan Kepolisian untuk memberikan pelayanan cepat dan transparan.',
    ringkasan_en: 'MPP Simpurusiang Luwu Regency officially integrates 26 government agencies, SOEs, and police to provide fast and transparent public services.',
    ringkasan_zh: '鲁乌县辛普鲁西亚公共服务大厅正式整合26个政府机构、国企及警察局，提供快速透明的服务。',
    isiLengkap: `Pemerintah Kabupaten Luwu menggelar peresmian peningkatan fasilitas dan integrasi penuh 26 gerai instansi di Mal Pelayanan Publik (MPP) Simpurusiang Belopa. 

Dalam sambutannya, Bupati Luwu menegaskan bahwa hadirnya MPP Simpurusiang merupakan wujud nyata komitmen pemerintah daerah dalam menghadirkan pelayanan publik yang cepat, mudah, terjangkau, nyaman, dan bebas dari praktik pungutan liar.

"Dengan terintegrasinya 26 instansi vertikal, BUMN, BUMD, serta OPD teknis Pemkab Luwu di satu atap, masyarakat Luwu kini cukup datang ke satu lokasi untuk mengurus berbagai dokumen mulai dari KTP, NIB Usaha, Pajak PBB, SIM, hingga Paspor," ujar Bupati Luwu.

Fasilitas baru di MPP Simpurusiang juga dilengkapi dengan Kios Anjungan Mandiri (Kiosk Digital), Jalur Pemandu Taktil & Kursi Roda Otomatis untuk disabilitas, Serta Layanan Konsierge Ramah Anak.`,
    isPinned: true,
    status: 'published',
    viewsCount: 1420,
  },
  {
    id: 'news-2',
    judul: 'DPMPTSP Kabupaten Luwu Raih Predikat Pelayanan Prima KemenPAN-RB 2026',
    judul_en: 'Luwu Investment Dept Receives Excellent Public Service Award from KemenPAN-RB 2026',
    judul_zh: '鲁乌县投资与一站式服务局荣获2026年国家公共服务优秀奖',
    kategori: 'Berita Daerah',
    penulis: 'Redaksi Luwu Terkini',
    tanggal: '12 September 2026',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    ringkasan: 'Dinas Penanaman Modal dan PTSP Kab. Luwu berhasil meraih nilai Indeks Pelayanan Publik (IPP) tertinggi dengan predikat A (Pelayanan Prima) dari Kementerian PAN-RB.',
    ringkasan_en: 'Luwu Investment Dept achieves the highest Public Service Index (IPP) with grade A (Excellent) from the Ministry of PAN-RB.',
    ringkasan_zh: '鲁乌县投资局荣获国家行政与官僚改革部颁发的最高公共服务指数A级评价。',
    isiLengkap: `Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi (KemenPAN-RB) mengumumkan hasil Evaluasi Kinerja Pelayanan Publik (EKPP) tahun 2026. DPMPTSP Kabupaten Luwu yang menaungi MPP Simpurusiang dianugerahi penghargaan Predikat A (Pelayanan Prima).

Penilaian ini didasarkan pada 6 indikator utama: Kebijakan Pelayanan, Profesionalisme SDM, Sarana Prasarana Inklusif, Sistem Informasi Pelayanan Publik Digital, Konsultasi & Pengaduan, serta Inovasi Layanan.

Kepala DPMPTSP Kab. Luwu menyampaikan apresiasi setinggi-tingginya kepada seluruh petugas gerai dan masyarakat Luwu atas partisipasi aktif dalam memberikan ulasan dan evaluasi berkala via Indeks Kepuasan Masyarakat (SKM).`,
    isPinned: false,
    status: 'published',
    viewsCount: 890,
  },
  {
    id: 'news-3',
    judul: 'Pemerintah Pusat Percepat Akselerasi Integrasi Layanan Publik Digital & OSS-RBA',
    judul_en: 'Central Government Accelerates Digital Public Service Integration and OSS-RBA',
    judul_zh: '中央政府加快推进数字化公共服务与OSS-RBA系统整合',
    kategori: 'Berita Nasional',
    penulis: 'Biro Pers & Informasi Nasional',
    tanggal: '08 September 2026',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    ringkasan: 'Kementerian Investasi / BKPM mendorong perluasan Mal Pelayanan Publik Digital (MPPD) terintegrasi untuk mempercepat penerbitan izin usaha UMKM di seluruh daerah.',
    ringkasan_en: 'Ministry of Investment pushes for expanding Digital MPP to accelerate MSME business permit issuance across all regions.',
    ringkasan_zh: '印尼投资部推动扩大数字公共服务大厅应用，加速各地微中小企业许可颁发。',
    isiLengkap: `Kementerian Investasi / BKPM bersama KemenPAN-RB terus mendorong transformasi digital pelayanan perizinan di Indonesia melalui integrasi penuh OSS-RBA dan Mal Pelayanan Publik (MPP) di seluruh kabupaten/kota.

Kabupaten Luwu menjadi salah satu pilot project percontohan di Sulawesi Selatan yang telah mengintegrasikan pemetaan spasial lahan (GISTARU), izin kesesuaian ruang (PKKPR), dan sertifikat PBG langsung dengan portal OSS-RBA Nasional.

Langkah ini diharapkan mampu memangkas waktu pengurusan izin investasi dari mingguan menjadi harian.`,
    isPinned: false,
    status: 'published',
    viewsCount: 1105,
  },
  {
    id: 'news-4',
    judul: 'Tips Pengurusan NIB UMKM dan Cetak KTP-el Tanpa Antre di MPP Simpurusiang',
    judul_en: 'Tips for Fast MSME Permit & ID Card Printing Without Queues at MPP Simpurusiang',
    judul_zh: '在辛普鲁西亚公共服务大厅无需排队快速办理中小企业NIB与身份证指南',
    kategori: 'Tips & Edukasi',
    penulis: 'Tim Konsierge Digital MPP',
    tanggal: '04 September 2026',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    ringkasan: 'Simak panduan praktis memanfaatkan fitur e-Antrean Online dan Kios Anjungan Mandiri untuk mengurus dokumen publik dalam hitungan menit.',
    ringkasan_en: 'Learn practical tips using Online e-Queue and Self-Service Kiosks to complete public documents in minutes.',
    ringkasan_zh: '了解使用线上排队与自助服务机在数分钟内办结公共文件的实用技巧。',
    isiLengkap: `Bagi warga Kabupaten Luwu yang ingin mengurus KTP-el, NIB Usaha, atau Pembayaran PBB, kini tidak perlu ragu tertahan antrean panjang. Berikut tips praktis dari Tim MPP Simpurusiang:

1. **Gunakan e-Antrean Online**: Ambil tiket antrean dari rumah via Portal MPP Simpurusiang untuk mendapatkan estimasi jam kedatangan yang pasti.
2. **Siapkan Berkas Fisik & Digital**: Pastikan KTP, Kartu Keluarga, dan NPWP sudah dalam bentuk foto/PDF di ponsel Anda.
3. **Manfaatkan Anjungan Mandiri (Kios Digital)**: Untuk pencetakan ulang KTP rusak atau NIB UMKM Risiko Rendah, gunakan Kios Mandiri di Lobby Utama MPP tanpa perlu masuk ke ruang loket.
4. **Layanan Inklusif**: Warga lansia, ibu hamil, dan penyandang disabilitas dapat langsung menuju Loket Prioritas 01 tanpa perlu mengambil antrean reguler.`,
    isPinned: false,
    status: 'published',
    viewsCount: 2310,
  },
  {
    id: 'news-5',
    judul: 'Studi Banding Smart City & Digital Hub Pelayanan Publik Tingkat Regional',
    judul_en: 'Regional Smart City & Digital Public Service Hub Benchmarking Study',
    judul_zh: '区域智慧城市与数字公共服务中心考察交流',
    kategori: 'Berita Internasional',
    penulis: 'Tim Hub Internasional',
    tanggal: '28 Agustus 2026',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    ringkasan: 'Inovasi arsitektur pelayanan publik digital MPP Simpurusiang menjadi referensi model pelayanan publik ramah investor di kawasan ASEAN.',
    ringkasan_en: 'MPP Simpurusiang digital public service architecture becomes a model reference for investor-friendly services in ASEAN.',
    ringkasan_zh: '辛普鲁西亚公共服务大厅数字架构成为东盟区域亲商型公共服务的参考典范。',
    isiLengkap: `Pengembangan konsep Mal Pelayanan Publik (MPP) digital dengan dukungan pemetaan spasial PostGIS dan asisten suara AI AI Ta' mendapatkan apresiasi positif dari para pemerhati tata kelola pemerintahan berbasis digital.

Penerapan standar ISO Pelayanan Publik dan kepastian waktu penyelesaian (SLA) transparan menjadikan MPP Simpurusiang Kabupaten Luwu sebagai percontohan nasional dalam kemudahan berusaha (Ease of Doing Business).`,
    isPinned: false,
    status: 'published',
    viewsCount: 670,
  },
];

const LOCAL_STORAGE_KEY = 'mpp_news_data_v1';
const BROADCAST_CHANNEL_NAME = 'mpp_news_sync_channel';

// Setup BroadcastChannel for cross-tab real-time sync
let newsBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    newsBroadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    newsBroadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'MPP_NEWS_SYNC' && Array.isArray(event.data?.payload)) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(event.data.payload));
          window.dispatchEvent(new CustomEvent('mpp_news_updated', { detail: event.data.payload }));
        } catch (e) {}
      }
    };
  } catch (e) {
    console.warn('[BroadcastChannel] Initialization notice:', e);
  }
}

export function getStoredMppNews(): MppNewsItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let items: MppNewsItem[] = [];

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        items = parsed;
      }
    }

    if (items.length === 0) {
      items = [...INITIAL_MPP_NEWS];
    }

    // Normalize each item to ensure status and required fields are guaranteed
    items = items.map(item => ({
      ...item,
      id: String(item.id || `news-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
      judul: item.judul || (item as any).title || "Berita MPP Luwu",
      ringkasan: item.ringkasan || (item as any).content || "Informasi pelayanan publik MPP Simpurusiang.",
      isiLengkap: item.isiLengkap || (item as any).content || item.ringkasan || "Informasi pelayanan publik MPP Simpurusiang.",
      image: item.image || (item as any).photo || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      kategori: item.kategori || (item as any).category || "Giat Kegiatan MPP",
      penulis: item.penulis || "Admin MPP Luwu",
      tanggal: item.tanggal || (item as any).date || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      status: item.status || "published"
    }));

    // Sinkronisasi otomatis data berita yang dibuat dari Halaman Admin MPP (key: mpp_portal_news)
    const rawPortalNews = localStorage.getItem("mpp_portal_news");
    if (rawPortalNews) {
      try {
        const portalNewsArr = JSON.parse(rawPortalNews);
        if (Array.isArray(portalNewsArr) && portalNewsArr.length > 0) {
          let hasNewImports = false;
          for (const legacy of portalNewsArr) {
            const titleToMatch = legacy.title || legacy.judul;
            if (titleToMatch && !items.some(n => n.id === legacy.id || n.judul === titleToMatch)) {
              const convertedItem: MppNewsItem = {
                id: legacy.id ? String(legacy.id) : `news-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                judul: legacy.title || legacy.judul || "Berita MPP Luwu",
                ringkasan: legacy.content ? (legacy.content.length > 180 ? legacy.content.slice(0, 180) + "..." : legacy.content) : "Informasi pelayanan publik MPP Simpurusiang.",
                isiLengkap: legacy.content || legacy.isiLengkap || "Informasi pelayanan publik MPP Simpurusiang.",
                image: legacy.photo || legacy.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
                kategori: legacy.category === "Pemerintahan" || legacy.category === "Pengumuman" ? "Berita Daerah" : legacy.category === "Kegiatan" ? "Giat Kegiatan MPP" : (legacy.category as any || "Giat Kegiatan MPP"),
                penulis: legacy.penulis || "Admin MPP Luwu",
                tanggal: legacy.date || legacy.tanggal || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
                status: "published",
                isPinned: false,
                viewsCount: 10
              };
              items.unshift(convertedItem);
              hasNewImports = true;
            }
          }

          if (hasNewImports) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
          }
        }
      } catch (err) {
        console.warn("Error parsing legacy mpp_portal_news:", err);
      }
    }

    return items;
  } catch (err) {
    console.warn('Failed to read mpp news from localStorage:', err);
    return INITIAL_MPP_NEWS;
  }
}

/**
 * Fetch latest news from backend API so newly created news on Admin (e.g. desktop)
 * is immediately available on mobile/Android devices and across all browsers.
 */
export async function syncMppNewsWithServer(): Promise<MppNewsItem[]> {
  try {
    const res = await fetch('/api/mpp-news');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const serverNews: MppNewsItem[] = await res.json();
    if (Array.isArray(serverNews) && serverNews.length > 0) {
      // Normalize items
      const normalized = serverNews.map(item => ({
        ...item,
        id: String(item.id || `news-${Date.now()}`),
        judul: item.judul || (item as any).title || "Berita MPP Luwu",
        ringkasan: item.ringkasan || (item as any).content || "Informasi pelayanan publik MPP Simpurusiang.",
        isiLengkap: item.isiLengkap || (item as any).content || item.ringkasan || "Informasi pelayanan publik MPP Simpurusiang.",
        image: item.image || (item as any).photo || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
        kategori: item.kategori || (item as any).category || "Giat Kegiatan MPP",
        penulis: item.penulis || "Admin MPP Luwu",
        tanggal: item.tanggal || (item as any).date || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        status: item.status || "published"
      }));

      // Cache locally
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
      
      // Dispatch update events for React state listeners
      window.dispatchEvent(new CustomEvent('mpp_news_updated', { detail: normalized }));
      if (newsBroadcastChannel) {
        try {
          newsBroadcastChannel.postMessage({ type: 'MPP_NEWS_SYNC', payload: normalized });
        } catch (e) {}
      }
      return normalized;
    }
  } catch (err) {
    console.warn('[syncMppNewsWithServer] Failed to sync with server:', err);
  }
  return getStoredMppNews();
}

export function saveMppNews(newsList: MppNewsItem[]): void {
  try {
    // 1. Instant local persistence
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newsList));
    // Jaga kompatibilitas dengan key mpp_portal_news
    const legacyFormat = newsList.map(n => ({
      id: n.id,
      title: n.judul,
      content: n.isiLengkap || n.ringkasan,
      photo: n.image,
      category: n.kategori,
      date: n.tanggal
    }));
    localStorage.setItem("mpp_portal_news", JSON.stringify(legacyFormat));

    // 2. Dispatch event for same-tab React components
    window.dispatchEvent(new CustomEvent('mpp_news_updated', { detail: newsList }));

    // 3. Broadcast to all open tabs/windows
    if (newsBroadcastChannel) {
      try {
        newsBroadcastChannel.postMessage({ type: 'MPP_NEWS_SYNC', payload: newsList });
      } catch (e) {}
    }

    // 4. Send to backend server & Supabase so Android phones and other devices see it
    fetch('/api/mpp-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsList)
    }).catch(err => console.warn('[saveMppNews] Server persistence notice:', err));
  } catch (err) {
    console.error('Failed to save mpp news to localStorage:', err);
  }
}
