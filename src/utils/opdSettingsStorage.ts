export interface OpdAdminProfile {
  fullName: string;
  nip: string;
  position: string; // Jabatan from dropdown
  email?: string;
  phone?: string;
}

export interface OpdKepalaDinas {
  fullName: string; // Nama Lengkap & Gelar (e.g., IR. IKHSAN AS'AD, S.T., M.Si.)
  pangkatGolongan: string; // e.g., Pembina Utama Muda (IV/c)
  nip: string; // e.g., 19710815 199803 1 007
  officialTitle: string; // e.g., Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu
  tteStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  qrSpecimenUrl?: string;
  stampUrl?: string;
}

export interface OpdSecondarySignatory {
  fullName: string;
  pangkatGolongan: string;
  nip: string;
  officialTitle: string;
}

export interface OpdProfile {
  opdKey: 'puptr' | 'pertanian' | 'dpmptsp';
  officialName: string; // e.g. Dinas Pekerjaan Umum dan Penataan Ruang
  shortName: string; // e.g. Dinas PUPTR
  address: string;
  phone: string;
  email: string;
  website: string;
  skFormat: string; // e.g. 503/PERTEK-PUPTR/LUWU/{year}/{seq}
  tembusanDefault: string[];
  kopSuratUrl?: string; // Data URL (Base64) or Image URL for Kop Surat
}

export interface OpdFullSettings {
  opd: OpdProfile;
  admin: OpdAdminProfile;
  kepalaDinas: OpdKepalaDinas;
  kabidSignatory?: OpdSecondarySignatory;
  updatedAt: string;
}

export const DEFAULT_OPD_SETTINGS: Record<'puptr' | 'pertanian' | 'dpmptsp', OpdFullSettings> = {
  puptr: {
    opd: {
      opdKey: 'puptr',
      officialName: 'Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu',
      shortName: 'Dinas PUPTR',
      address: 'Jl. Jendral Sudirman No. 01, Kompleks Perkantoran Pemkab Luwu, Belopa',
      phone: '(0471) 3312011 / 0812-4100-8899',
      email: 'puptr@luwukab.go.id',
      website: 'https://puptr.luwukab.go.id',
      skFormat: '503/PERTEK-PUPTR/LUWU/{year}/{seq}',
      tembusanDefault: [
        'Bupati Luwu (sebagai laporan)',
        'Kepala DPMPTSP Kabupaten Luwu',
        'Kepala Kantor Pertanahan / BPN Kabupaten Luwu',
        'Pertinggal / Arsip Bidang Tata Ruang'
      ]
    },
    admin: {
      fullName: 'Ahmad Fauzi, S.T.',
      nip: '19850612 201001 1 012',
      position: 'Penata Kadaster & Spasial Ahli Muda',
      email: 'fauzi.puptr@luwukab.go.id',
      phone: '0813-5566-7788'
    },
    kepalaDinas: {
      fullName: 'IR. IKHSAN AS\'AD, S.T., M.Si.',
      pangkatGolongan: 'Pembina Utama Muda (IV/c)',
      nip: '19710815 199803 1 007',
      officialTitle: 'Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu',
      tteStatus: 'ACTIVE',
    },
    kabidSignatory: {
      fullName: 'IR. H. IRWANTO, S.T., M.T.',
      pangkatGolongan: 'Pembina (IV/a)',
      nip: '19780412 200502 1 003',
      officialTitle: 'Kepala Bidang Tata Ruang & Geospasial'
    },
    updatedAt: new Date().toISOString()
  },

  pertanian: {
    opd: {
      opdKey: 'pertanian',
      officialName: 'Dinas Pertanian Kabupaten Luwu',
      shortName: 'Dinas Pertanian',
      address: 'Jl. Pahlawan No. 45, Kompleks Perkantoran Pemkab Luwu, Belopa',
      phone: '(0471) 3312044 / 0821-9988-1122',
      email: 'pertanian@luwukab.go.id',
      website: 'https://pertanian.luwukab.go.id',
      skFormat: '520/BA-LP2B/DISTAN-LW/{year}/{seq}',
      tembusanDefault: [
        'Bupati Luwu (sebagai laporan)',
        'Kepala Dinas PUPTR Kabupaten Luwu',
        'Kepala DPMPTSP Kabupaten Luwu',
        'Pertinggal / Arsip LP2B'
      ]
    },
    admin: {
      fullName: 'Drh. Nurhidayah, M.P.',
      nip: '19880315 201202 2 005',
      position: 'Analis Ketahanan Pangan & LP2B Ahli Muda',
      email: 'nurhidayah.pertanian@luwukab.go.id',
      phone: '0852-4433-2211'
    },
    kepalaDinas: {
      fullName: 'IR. H. JUMADI, M.Si.',
      pangkatGolongan: 'Pembina Utama Muda (IV/c)',
      nip: '19710324 199603 1 002',
      officialTitle: 'Kepala Dinas Pertanian Kabupaten Luwu',
      tteStatus: 'ACTIVE',
    },
    kabidSignatory: {
      fullName: 'H. SYAMSUL BAHRI, S.P., M.Si.',
      pangkatGolongan: 'Pembina (IV/a)',
      nip: '19750918 200212 1 004',
      officialTitle: 'Kepala Bidang Prasarana, Sarana & LP2B'
    },
    updatedAt: new Date().toISOString()
  },

  dpmptsp: {
    opd: {
      opdKey: 'dpmptsp',
      officialName: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu Kabupaten Luwu',
      shortName: 'DPMPTSP',
      address: 'Jl. Jendral Sudirman No. 02, Kompleks Perkantoran Pemkab Luwu, Belopa',
      phone: '(0471) 3312099 / 0811-4200-9999',
      email: 'dpmptspluwu@gmail.com',
      website: 'https://dpmptsp.luwukab.go.id',
      skFormat: '503/SK-PKKPR/DPMPTSP-LW/{year}/{seq}',
      tembusanDefault: [
        'Bupati Luwu (sebagai laporan)',
        'Kepala Dinas PUPTR Kabupaten Luwu',
        'Kepala Dinas Pertanian Kabupaten Luwu',
        'Kepala Kantor Pertanahan / BPN Kabupaten Luwu',
        'Pelaku Usaha / Pemohon'
      ]
    },
    admin: {
      fullName: 'Rahmat Hidayat, S.Sos., M.AP.',
      nip: '19820719 200801 1 009',
      position: 'Kepala Bidang Penyelenggaraan Pelayanan Perizinan',
      email: 'dpmptspluwu@gmail.com',
      phone: '0812-4200-9999'
    },
    kepalaDinas: {
      fullName: 'H. MUHAMMAD RUDI, S.E., M.Si.',
      pangkatGolongan: 'Pembina Utama Muda (IV/c)',
      nip: '19691120 199403 1 005',
      officialTitle: 'Kepala Dinas Penanaman Modal dan PTSP Kabupaten Luwu',
      tteStatus: 'ACTIVE',
    },
    kabidSignatory: {
      fullName: 'ANDI MUHAMMAD HASAN, S.STP., M.Si.',
      pangkatGolongan: 'Pembina (IV/a)',
      nip: '19810504 200012 1 002',
      officialTitle: 'Kepala Bidang Penyelenggaraan Perizinan & Non Perizinan'
    },
    updatedAt: new Date().toISOString()
  }
};

export const JABATAN_OPTIONS_BY_OPD: Record<'puptr' | 'pertanian' | 'dpmptsp', string[]> = {
  puptr: [
    'Kepala Bidang Tata Ruang & Geospasial',
    'Penata Kadaster & Spasial Ahli Muda',
    'Fungsional Penata Ruang Ahli Pertama',
    'Pengawas Tata Ruang & Bangunan',
    'Analis Bangunan Gedung & Permukiman',
    'Operator GIS Spasial & Verifikator Geometris',
    'Staf Administrasi Rekomendasi Tata Ruang'
  ],
  pertanian: [
    'Kepala Bidang Prasarana, Sarana & LP2B',
    'Kepala Bidang Tanaman Pangan & Hortikultura',
    'Analis Ketahanan Pangan & LP2B Ahli Muda',
    'Verifikator Alih Fungsi Lahan Pertanian',
    'Fungsional Penyuluh Pertanian Ahli',
    'Operator GIS Agraria & Sawah Irigasi',
    'Staf Administrasi Berita Acara Pertanian'
  ],
  dpmptsp: [
    'Kepala Bidang Penyelenggaraan Pelayanan Perizinan',
    'Kepala Bidang Penanaman Modal & Promosi',
    'Kepala Bidang Pengendalian & Pelaksanaan Investment',
    'Penata Perizinan Ahli Muda',
    'Verifikator Berkas & Syarat Administrasi OSS',
    'Petugas Front Office / Customer Service MPP',
    'Operator Sistem Perizinan Berusaha (OSS-RBA)'
  ]
};

export const PANGKAT_GOLONGAN_OPTIONS = [
  'Pembina Utama (IV/e)',
  'Pembina Utama Madya (IV/d)',
  'Pembina Utama Muda (IV/c)',
  'Pembina Tingkat I (IV/b)',
  'Pembina (IV/a)',
  'Penata Tingkat I (III/d)',
  'Penata (III/c)',
  'Penata Muda Tingkat I (III/b)',
  'Penata Muda (III/a)'
];

export const getOpdSettings = (opdKey: 'puptr' | 'pertanian' | 'dpmptsp'): OpdFullSettings => {
  try {
    const key = `luwu_opd_settings_${opdKey}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_OPD_SETTINGS[opdKey],
        ...parsed,
        opd: { ...DEFAULT_OPD_SETTINGS[opdKey].opd, ...(parsed.opd || {}) },
        admin: { ...DEFAULT_OPD_SETTINGS[opdKey].admin, ...(parsed.admin || {}) },
        kepalaDinas: { ...DEFAULT_OPD_SETTINGS[opdKey].kepalaDinas, ...(parsed.kepalaDinas || {}) },
        kabidSignatory: { ...DEFAULT_OPD_SETTINGS[opdKey].kabidSignatory, ...(parsed.kabidSignatory || {}) }
      };
    }
  } catch (e) {
    console.warn(`Error loading OPD settings for ${opdKey}:`, e);
  }
  return DEFAULT_OPD_SETTINGS[opdKey];
};

export const saveOpdSettings = (opdKey: 'puptr' | 'pertanian' | 'dpmptsp', settings: OpdFullSettings) => {
  try {
    const key = `luwu_opd_settings_${opdKey}`;
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('luwu_opd_settings_updated', { detail: { opdKey, settings: payload } }));
  } catch (e) {
    console.error(`Error saving OPD settings for ${opdKey}:`, e);
  }
};
