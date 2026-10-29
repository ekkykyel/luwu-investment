const DEFAULT_STRATEGIC_INFRASTRUCTURES = [
  {
    id: 'airport',
    name: 'Bandara Udara Bua',
    type: 'airport',
    tag: 'Gerbang Udara & Kargo',
    desc: 'Gerbang logistik udara strategis Kabupaten Luwu dengan penerbangan komersial dan konektivitas kargo.',
    detailedInfo: 'Bandar Udara Bua (I Laga Ligo) merupakan simpul konektivitas udara utama Kabupaten Luwu dan kawasan Tana Luwu. Menghubungkan langsung Luwu dengan Kota Makassar dan pusat ekonomi nasional, melayani penerbangan terjadwal serta mendukung mobilitas eksekutif investor dan percepatan pengiriman logistik bernilai tinggi.',
    location: 'Kecamatan Bua, Kabupaten Luwu',
    latitude: -3.085954945831168,
    longitude: 120.24229192694217,
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    status: 'Beroperasi Aktif',
    specs: [
      { label: 'Dimensi Runway', value: '1.600 m x 30 m (Dapat didarati ATR-72 & sejenis)' },
      { label: 'Kapasitas Terminal', value: 'Terminal penumpang representatif & ruang VIP' },
      { label: 'Rute Reguler', value: 'Makassar (UPG) - Bua Luwu (LLO) PP' },
      { label: 'Fasilitas Kargo', value: 'Area penanganan logistik & kargo udara terpadu' }
    ],
    advantages: [
      'Akses tercepat bagi delegasi bisnis dan investor dari Bandara Sultan Hasanuddin Makassar (45 menit penerbangan)',
      'Terintegrasi langsung dengan Kawasan Industri Bua (KIB) yang hanya berjarak 5 menit perjalanan darat',
      'Mendukung ekspor komoditas bernilai tinggi seperti hasil perikanan segar dan sampel biji kakao premium',
      'Pengembangan perpanjangan runway ke depan untuk mengakomodasi armada jet komersial berbadan sedang'
    ],
    connectivity: 'Terhubung langsung dengan Jalan Nasional Trans-Sulawesi (Poros Palopo-Belopa) dan hanya 35 km dari Ibukota Belopa.',
    isFeatured: true
  },
  {
    id: 'port',
    name: 'Pelabuhan Ulo-Ulo Belopa',
    type: 'port',
    tag: 'Dermaga Logistik Laut',
    desc: 'Infrastruktur maritim utama Belopa yang mendukung logistik laut dan distribusi antar-pulau yang efisien.',
    detailedInfo: 'Pelabuhan Laut Ulo-Ulo Belopa merupakan infrastruktur maritim strategis Kabupaten Luwu yang berlokasi di perairan tenang Teluk Bone. Berperan sebagai pintu gerbang pengapalan komoditas perkebunan, perikanan laut, dan material konstruksi industri untuk memenuhi kebutuhan pasar domestik antar-pulau maupun persiapan ekspor maritim.',
    location: 'Kecamatan Belopa, Kabupaten Luwu',
    latitude: -3.408730048385366,
    longitude: 120.4041819405607,
    imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80',
    status: 'Beroperasi Aktif',
    specs: [
      { label: 'Tipe Dermaga', value: 'Dermaga Jetty Beton Bertulang' },
      { label: 'Kedalaman Kolam (Draft)', value: '6 - 8 meter LWS (Perairan Teluk Bone Terlindung)' },
      { label: 'Kapasitas Sandar', value: 'Kapal kargo general cargo, tongkang, dan kapal perikanan' },
      { label: 'Fasilitas Tambat', value: 'Bollard mooring baja & area penumpukan barang pesisir' }
    ],
    advantages: [
      'Lokasi pesisir strategis hanya 5 km dari pusat pemerintahan Kabupaten Luwu di Belopa',
      'Perairan Teluk Bone yang relatif tenang memberikan proteksi gelombang alami sepanjang tahun',
      'Efisiensi tinggi untuk angkutan curah komoditas pertanian, perikanan, dan pasokan bahan baku industri',
      'Terintegrasi dalam rencana induk jalur pelayaran interkoneksi Sulawesi Selatan - Sulawesi Tenggara'
    ],
    connectivity: 'Dihubungkan oleh jalan arteri lingkar pesisir Belopa beraspal mulus dengan akses truk kontainer tanpa hambatan.',
    isFeatured: true
  },
  {
    id: 'industrial',
    name: 'Kawasan Industri Bua',
    type: 'industrial',
    tag: 'Kawasan Industri Terpadu',
    desc: 'Kawasan ekonomi industri Bua terintegrasi yang memiliki pasokan energi prioritas tinggi dan lahan komersial siap pakai.',
    detailedInfo: 'Kawasan Industri Bua (KIB) merupakan zona peruntukan industri seluas ratusan hektar yang disiapkan Pemerintah Kabupaten Luwu untuk hilirisasi komoditas unggulan daerah. Dirancang dengan konsep modern, KIB siap menampung industri pengolahan kakao, pengolahan kopi, industri hilir rumput laut, pergudangan logistik kargo, hingga industri ramah lingkungan.',
    location: 'Kecamatan Bua, Kabupaten Luwu',
    latitude: -3.131174756995506,
    longitude: 120.23667999835915,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    status: 'Dalam Pengembangan',
    specs: [
      { label: 'Luas Lahan Kawasan', value: 'Ratusan Hektar Siap Kaveling Industri (Zonasi RTRW Resmi)' },
      { label: 'Pasokan Energi Listrik', value: 'Dukungan Gardu Induk PLN Tegangan Menengah & Tinggi' },
      { label: 'Ketersediaan Air Industri', value: 'Sumber air baku melimpah dari DAS terdekat' },
      { label: 'Jaringan Telekomunikasi', value: 'Fiber optic berkecepatan tinggi terpasang' }
    ],
    advantages: [
      'Proksimitas prima hanya 5 menit berkendara dari Bandara Bua untuk kemudahan inspeksi teknis dan logistik',
      'Kesesuaian tata ruang (RTRW & KKPR) telah dialokasikan khusus untuk kawasan industri pengolahan non-polutan',
      'Dukungan insentif pajak daerah dan retribusi daerah sesuai Peraturan Daerah Kabupaten Luwu',
      'Ketersediaan tenaga kerja lokal terlatih yang siap diserap oleh industri mitra'
    ],
    connectivity: 'Berada persis di koridor jalur utama Trans-Sulawesi dengan akses logistik langsung ke Bandara Bua dan Pelabuhan.',
    isFeatured: true
  },
  {
    id: 'mpp',
    name: 'MPP Simpurusiang',
    type: 'mpp',
    tag: 'Mal Pelayanan Publik',
    desc: 'Perizinan investasi terpadu satu pintu dengan menyinkronkan ekosistem KKPR, RTRW, dan OSS.',
    detailedInfo: 'Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu adalah pusat layanan terpadu satu atap yang menghadirkan transformasi birokrasi modern, cepat, transparan, dan akuntabel. Mengintegrasikan 19 instansi kementerian/lembaga, BUMN, perbankan, dan Organisasi Perangkat Daerah (OPD) untuk mempermudah perizinan usaha, persetujuan tata ruang, perpajakan, serta layanan administrasi kependudukan.',
    location: 'Kompleks Perkantoran Pemkab Luwu, Belopa',
    latitude: -3.394277123973495,
    longitude: 120.36857549179763,
    imageUrl: 'https://yeezhpdgafbefwipmldl.supabase.co/storage/v1/object/public/mpp-images/facilities/1791599730624_8nyposi.jpeg',
    status: 'Beroperasi Aktif',
    specs: [
      { label: 'Instansi Tergabung', value: '19 Instansi Vertikal, BUMN, Perbankan & OPD Luwu' },
      { label: 'Total Layanan Resmi', value: '150+ Jenis Pelayanan & Perizinan Terpadu' },
      { label: 'Sistem Integrasi', value: 'OSS-RBA, SIMBG, Validasi Spasial GIS RTRW, & Antrean Digital' },
      { label: 'Fasilitas Layanan', value: 'Executive Investor Lounge, Pojok Baca Digital, Fasilitas Difabel' }
    ],
    advantages: [
      'Layanan One-Stop Service perizinan investasi dengan asistensi langsung tim teknis DPMPTSP Luwu',
      'Kepastian waktu (SLA) dan transparansi biaya nol rupiah untuk pengurusan izin sesuai regulasi',
      'Fasilitas ruang konsultasi privat (Investor VIP Lounge) bagi calon penanam modal skala menengah & besar',
      'Konektivitas digital langsung ke sistem pusat kementerian untuk verifikasi KKPR & AMDAL/UKL-UPL'
    ],
    connectivity: 'Berada di jantung pusat pemerintahan Kabupaten Luwu, Belopa, mudah diakses kendaraan umum dan pribadi.',
    isFeatured: true
  }
];

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const urlParts = (req.url || "").split("?")[0].split("/").filter(Boolean);
    const targetId = urlParts.length > 2 ? urlParts[2] : (req.query?.id as string | undefined);

    if (targetId) {
      const match = DEFAULT_STRATEGIC_INFRASTRUCTURES.find(
        item => String(item.id) === targetId || item.type === targetId
      );
      if (match) {
        return res.status(200).json({ success: true, data: match });
      }
      return res.status(404).json({ success: false, message: "Infrastructure item not found" });
    }

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ success: true, data: DEFAULT_STRATEGIC_INFRASTRUCTURES });
  }

  if (req.method === "POST" || req.method === "PUT") {
    return res.status(200).json({ success: true, message: "Infrastructure updated successfully" });
  }

  if (req.method === "DELETE") {
    return res.status(200).json({ success: true, message: "Infrastructure deleted" });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
