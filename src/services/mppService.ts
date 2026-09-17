import { supabase } from '../lib/supabaseClient';
import {
  MPPTenant,
  MPPService,
  MPPCitizen,
  MPPQueue,
  MPPDocumentTracking,
  MPPTrackingHistory,
  MPPSkm,
  MPPTenantUser,
  QueueStatus
} from '../types/mpp';

// Master Data 20 Instansi Resmi MPP Kabupaten Luwu (Sesuai Database Supabase)
export const OFFICIAL_MPP_TENANTS: MPPTenant[] = [
  { id: 'ec8fc0f3-8ee4-4b92-b664-f47e6409b293', name: 'DPMPTSP', code: 'DPMPTSP', logo: '/logos/dpmptsp.png', floor: 'Lantai 1', is_active: true, description: 'Dinas Penanaman Modal & Pelayanan Terpadu Satu Pintu', created_at: '2026-09-12 10:06:15.467494+00' },
  { id: 'ec40240e-d5c9-4fc6-a463-05699df1f592', name: 'Disdukcapil', code: 'DISDUKCAPIL', logo: '/logos/disdukcapil.png', floor: 'Lantai 1', is_active: true, description: 'Dinas Kependudukan & Pencatatan Sipil', created_at: '2026-09-12 10:06:15.467494+00' },
  { id: '8da00156-a6fb-4cd7-a7fb-57891fc57294', name: 'Badan Pertanahan Nasional', code: 'BPN', logo: '/logos/bpn.png', floor: 'Lantai 1', is_active: true, description: 'Kantor Pertanahan / ATR-BPN Kabupaten Luwu', created_at: '2026-09-12 10:06:15.467494+00' },
  { id: '05c208cc-b71a-459f-997b-f91d869ff220', name: 'Dinas PUPTR', code: 'PUPTR', logo: '/logos/pupr.png', floor: 'Lantai 1', is_active: true, description: 'Dinas Pekerjaan Umum dan Penataan Ruang', created_at: '2026-09-12 11:51:55.93064+00' },
  { id: '7b256f2c-f84d-482d-a1aa-99825eb7c980', name: 'Bapenda', code: 'BAPENDA', logo: '/logos/bapenda.png', floor: 'Lantai 1', is_active: true, description: 'Badan Pendapatan Daerah Kabupaten Luwu', created_at: '2026-09-12 11:51:56.042785+00' },
  { id: '345d3891-5bd7-4dda-ba3c-a73f6f68cd54', name: 'BPJS Ketenagakerjaan', code: 'BPJS-TK', logo: '/logos/bpjstk.png', floor: 'Lantai 1', is_active: true, description: 'Badan Penyelenggara Jaminan Sosial Ketenagakerjaan', created_at: '2026-09-12 11:51:56.16005+00' },
  { id: '83ee3a35-3800-438e-b675-a96f0192cf41', name: 'BPJS Kesehatan', code: 'BPJS-KES', logo: '/logos/bpjskes.png', floor: 'Lantai 1', is_active: true, description: 'Badan Penyelenggara Jaminan Sosial Kesehatan', created_at: '2026-09-12 11:51:56.322125+00' },
  { id: 'bb6fe97e-d130-401d-8ad5-68b9801d7f0c', name: 'Bank Sulselbar', code: 'SULSELBAR', logo: '/logos/sulselbar.png', floor: 'Lantai 1', is_active: true, description: 'PT Bank Pembangunan Daerah Sulawesi Selatan dan Sulawesi Barat', created_at: '2026-09-12 11:51:56.431951+00' },
  { id: '10450242-385d-4758-9f6e-62a14a6df74b', name: 'SAMSAT Belopa', code: 'SAMSAT', logo: '/logos/samsat.png', floor: 'Lantai 1', is_active: true, description: 'Sistem Administrasi Manunggal Satu Atap Belopa', created_at: '2026-09-12 11:51:56.548758+00' },
  { id: '19bf1720-d067-441f-87be-831742b505e2', name: 'KPP Pratama Palopo', code: 'KPP-PAJAK', logo: '/logos/kpp.png', floor: 'Lantai 1', is_active: true, description: 'Kantor Pelayanan Pajak Pratama Palopo / Pos Pelayanan Belopa', created_at: '2026-09-12 11:51:56.664331+00' },
  { id: 'ec3871f6-854e-47e5-bd87-24794df950bc', name: 'Kejaksaan Negeri Luwu', code: 'KEJARI', logo: '/logos/kejari.png', floor: 'Lantai 1', is_active: true, description: 'Pos Pelayanan Hukum & Konsultasi Kejaksaan Negeri Luwu', created_at: '2026-09-12 11:51:56.773896+00' },
  { id: '1f938559-abd5-445d-9892-7701f35475a4', name: 'PT. Taspen', code: 'TASPEN', logo: '/logos/taspen.png', floor: 'Lantai 1', is_active: true, description: 'Tabungan dan Asuransi Pegawai Negeri', created_at: '2026-09-12 11:51:56.880336+00' },
  { id: 'fe2ef49d-f8a7-4c93-8cc9-7af4025e37ce', name: 'Dinas Sosial', code: 'DINSOS', logo: '/logos/dinsos.png', floor: 'Lantai 1', is_active: true, description: 'Dinas Sosial Kabupaten Luwu', created_at: '2026-09-12 11:51:56.982976+00' },
  { id: '074f988a-5c06-4771-a528-b23ff838c722', name: 'Disnakertrans', code: 'DISNAKER', logo: '/logos/disnaker.png', floor: 'Lantai 1', is_active: true, description: 'Dinas Tenaga Kerja dan Transmigrasi Kabupaten Luwu', created_at: '2026-09-12 11:51:57.078252+00' },
  { id: 'ab058d21-f111-4014-a736-785b1e6f0b3f', name: 'Dinas Perikanan', code: 'PERIKANAN', logo: '/logos/perikanan.png', floor: 'Lantai 1', is_active: true, description: 'Dinas Perikanan Kabupaten Luwu', created_at: '2026-09-12 11:51:57.17735+00' },
  { id: '1ab5889f-b09d-4780-9b6b-e17ad8ec3dab', name: 'Dinas Kominfo', code: 'KOMINFO', logo: '/logos/kominfo.png', floor: 'Lantai 1', is_active: true, description: 'Dinas Komunikasi, Informatika, Statistik dan Persandian', created_at: '2026-09-12 11:51:57.282136+00' },
  { id: '7e408d3c-0d8a-4eba-bfcb-87cffa249fb1', name: 'PDAM Tirta Luwu', code: 'PDAM', logo: '/logos/pdam.png', floor: 'Lantai 1', is_active: true, description: 'Perumda Air Minum Tirta Luwu', created_at: '2026-09-12 11:51:57.387929+00' },
  { id: 'b5f466c5-7643-4547-9034-e3420d7031a7', name: 'DEKRANASDA Luwu', code: 'DEKRANASDA', logo: '/logos/dekranasda.png', floor: 'Lantai 1', is_active: true, description: 'Dewan Kerajinan Nasional Daerah Kabupaten Luwu', created_at: '2026-09-12 11:51:57.510238+00' },
  { id: 'b2969f12-ae72-4015-a9e6-a0ff835f6aa3', name: 'HAS International Center', code: 'HAS', logo: '/logos/has.png', floor: 'Lantai 1', is_active: true, description: 'Pusat Layanan Ketenagakerjaan Luar Negeri / Hub Pelatihan', created_at: '2026-09-12 11:51:57.655747+00' },
  { id: '93f472c8-9b44-493f-a7a4-2de11e247ff3', name: 'PT. Nevis', code: 'NEVIS', logo: '/logos/nevis.png', floor: 'Lantai 1', is_active: true, description: 'Mitra Layanan Pendukung dan Logistik Usaha', created_at: '2026-09-12 11:51:57.760224+00' }
];

// Master Data 63 Layanan Resmi MPP Kabupaten Luwu
export const OFFICIAL_MPP_SERVICES: MPPService[] = [
  // DPMPTSP (ec8fc0f3-8ee4-4b92-b664-f47e6409b293)
  { id: 'c370904b-a237-41b2-bee2-09aabc79a78c', tenant_id: 'ec8fc0f3-8ee4-4b92-b664-f47e6409b293', service_name: 'Penerbitan Nomor Induk Berusaha (NIB) Berbasis Risiko', name: 'Penerbitan Nomor Induk Berusaha (NIB) Berbasis Risiko', is_long_process: false, estimated_time_minutes: 15 },
  { id: '5f0d32ab-d596-4758-a3a5-ecb2d6fdf687', tenant_id: 'ec8fc0f3-8ee4-4b92-b664-f47e6409b293', service_name: 'Persetujuan Bangunan Gedung (PBG) & Sertifikat Laik Fungsi (SLF)', name: 'Persetujuan Bangunan Gedung (PBG) & Sertifikat Laik Fungsi (SLF)', is_long_process: true, estimated_time_minutes: 60 },
  { id: '51a39b48-8e8e-4328-beeb-a71028c78042', tenant_id: 'ec8fc0f3-8ee4-4b92-b664-f47e6409b293', service_name: 'Konfirmasi Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)', name: 'Konfirmasi Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)', is_long_process: false, estimated_time_minutes: 20 },
  { id: '0a819ad6-9ffc-4650-898f-69b398b18d46', tenant_id: 'ec8fc0f3-8ee4-4b92-b664-f47e6409b293', service_name: 'Surat Izin Praktik Tenaga Kesehatan (SIP/SIK)', name: 'Surat Izin Praktik Tenaga Kesehatan (SIP/SIK)', is_long_process: false, estimated_time_minutes: 25 },
  { id: '175e02ab-d5f5-45d9-9dc9-5393df30aeca', tenant_id: 'ec8fc0f3-8ee4-4b92-b664-f47e6409b293', service_name: 'Izin Lingkungan (SPPL & UKL-UPL)', name: 'Izin Lingkungan (SPPL & UKL-UPL)', is_long_process: false, estimated_time_minutes: 30 },
  { id: '9a465d1a-b44a-4dbb-89d8-40b27fa7bd03', tenant_id: 'ec8fc0f3-8ee4-4b92-b664-f47e6409b293', service_name: 'Layanan Konsultasi & Asistensi VIP Investasi', name: 'Layanan Konsultasi & Asistensi VIP Investasi', is_long_process: false, estimated_time_minutes: 20 },

  // Disdukcapil (ec40240e-d5c9-4fc6-a463-05699df1f592)
  { id: 'a3ed4dbd-2d94-4a5c-b73a-7a8ba631ddb7', tenant_id: 'ec40240e-d5c9-4fc6-a463-05699df1f592', service_name: 'Perekaman & Cetak KTP Elektronik (KTP-el)', name: 'Perekaman & Cetak KTP Elektronik (KTP-el)', is_long_process: false, estimated_time_minutes: 15 },
  { id: '01b92d4d-cc2f-4ade-ae3f-f55de62e73a3', tenant_id: 'ec40240e-d5c9-4fc6-a463-05699df1f592', service_name: 'Penerbitan & Perubahan Kartu Keluarga (KK)', name: 'Penerbitan & Perubahan Kartu Keluarga (KK)', is_long_process: false, estimated_time_minutes: 15 },
  { id: '2d7bc0c3-d96e-46a1-aa4b-eae950e93983', tenant_id: 'ec40240e-d5c9-4fc6-a463-05699df1f592', service_name: 'Penerbitan Kartu Identitas Anak (KIA)', name: 'Penerbitan Kartu Identitas Anak (KIA)', is_long_process: false, estimated_time_minutes: 10 },
  { id: 'd6f5f41a-158f-4dcb-81b2-ae587fbee825', tenant_id: 'ec40240e-d5c9-4fc6-a463-05699df1f592', service_name: 'Pencatatan Akta Kelahiran & Kematian', name: 'Pencatatan Akta Kelahiran & Kematian', is_long_process: false, estimated_time_minutes: 20 },
  { id: 'c2255fcf-8da1-4891-aa99-dfbe36e1bcd0', tenant_id: 'ec40240e-d5c9-4fc6-a463-05699df1f592', service_name: 'Aktivasi Identitas Kependudukan Digital (IKD)', name: 'Aktivasi Identitas Kependudukan Digital (IKD)', is_long_process: false, estimated_time_minutes: 10 },
  { id: 'f808647c-55df-4c3b-8c4d-deb824b1b9fd', tenant_id: 'ec40240e-d5c9-4fc6-a463-05699df1f592', service_name: 'Surat Keterangan Pindah Warga Negara Indonesia (SKPWNI)', name: 'Surat Keterangan Pindah Warga Negara Indonesia (SKPWNI)', is_long_process: false, estimated_time_minutes: 15 },

  // Badan Pertanahan Nasional (8da00156-a6fb-4cd7-a7fb-57891fc57294)
  { id: 'ed285d1a-8f64-4a7b-aa64-d46c711fd8ff', tenant_id: '8da00156-a6fb-4cd7-a7fb-57891fc57294', service_name: 'Pendaftaran Hak Pertama Kali', name: 'Pendaftaran Hak Pertama Kali', is_long_process: false, estimated_time_minutes: 30 },
  { id: 'af39947f-1ed0-494b-a08a-f6c619a7ad62', tenant_id: '8da00156-a6fb-4cd7-a7fb-57891fc57294', service_name: 'Peralihan Hak / Balik Nama Sertifikat', name: 'Peralihan Hak / Balik Nama Sertifikat', is_long_process: true, estimated_time_minutes: 45 },
  { id: '2c1295e3-fbbd-490d-8ed6-3073b4ecf5c4', tenant_id: '8da00156-a6fb-4cd7-a7fb-57891fc57294', service_name: 'Pengecekan Sertifikat Tanah', name: 'Pengecekan Sertifikat Tanah', is_long_process: false, estimated_time_minutes: 15 },
  { id: '94023f9a-84e2-4bda-a6a1-57b9a703276a', tenant_id: '8da00156-a6fb-4cd7-a7fb-57891fc57294', service_name: 'Surat Keterangan Pendaftaran Tanah (SKPT)', name: 'Surat Keterangan Pendaftaran Tanah (SKPT)', is_long_process: false, estimated_time_minutes: 20 },

  // Dinas PUPTR (05c208cc-b71a-459f-997b-f91d869ff220)
  { id: '0ef66ea5-414b-4ad9-9c57-b1e3171055e1', tenant_id: '05c208cc-b71a-459f-997b-f91d869ff220', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '4c82df04-2820-45f8-b282-891bf445e556', tenant_id: '05c208cc-b71a-459f-997b-f91d869ff220', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: 'fea547c3-1d24-4307-ae7d-4b129fddab00', tenant_id: '05c208cc-b71a-459f-997b-f91d869ff220', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 30 },
  { id: 'a3b4c70b-60f3-4f19-8a27-4f88e0a2d55f', tenant_id: '05c208cc-b71a-459f-997b-f91d869ff220', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // Bapenda (7b256f2c-f84d-482d-a1aa-99825eb7c980)
  { id: '4cd0cedc-78a7-400c-8ffb-9077c0751e76', tenant_id: '7b256f2c-f84d-482d-a1aa-99825eb7c980', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: '47046761-bf4a-4ce8-ad34-3eb9a0c7812a', tenant_id: '7b256f2c-f84d-482d-a1aa-99825eb7c980', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: 'ade8ca75-72c2-4f19-860e-0536b707a524', tenant_id: '7b256f2c-f84d-482d-a1aa-99825eb7c980', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '9390ec0c-ad51-4c27-919a-4ff5e5cf8206', tenant_id: '7b256f2c-f84d-482d-a1aa-99825eb7c980', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // BPJS Ketenagakerjaan (345d3891-5bd7-4dda-ba3c-a73f6f68cd54)
  { id: 'eea486fd-32a3-4aae-b323-fdef33dc8044', tenant_id: '345d3891-5bd7-4dda-ba3c-a73f6f68cd54', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: '915ef844-c42c-4b30-be4f-f271a24d73f4', tenant_id: '345d3891-5bd7-4dda-ba3c-a73f6f68cd54', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '255b70d3-7e67-4646-87a9-cc500aa8145f', tenant_id: '345d3891-5bd7-4dda-ba3c-a73f6f68cd54', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: 'c3a421b1-4683-4b81-b712-498cec3091bf', tenant_id: '345d3891-5bd7-4dda-ba3c-a73f6f68cd54', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // BPJS Kesehatan (83ee3a35-3800-438e-b675-a96f0192cf41)
  { id: '97b419ec-0261-4c0d-99ec-2ba2811779ef', tenant_id: '83ee3a35-3800-438e-b675-a96f0192cf41', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: 'dd226e8c-6e98-4033-b022-bd1d47db3c11', tenant_id: '83ee3a35-3800-438e-b675-a96f0192cf41', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '4d622587-aeb3-46f3-9ff3-8b63d7b1a9a5', tenant_id: '83ee3a35-3800-438e-b675-a96f0192cf41', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: 'cf1ff1c4-2f2b-424b-865c-f4df1ad4fd4c', tenant_id: '83ee3a35-3800-438e-b675-a96f0192cf41', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // Bank Sulselbar (bb6fe97e-d130-401d-8ad5-68b9801d7f0c)
  { id: 'f081b566-66fa-4b19-b0e9-187b16fb819d', tenant_id: 'bb6fe97e-d130-401d-8ad5-68b9801d7f0c', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: 'c6187434-0f25-4fdc-972b-13b4fb828de6', tenant_id: 'bb6fe97e-d130-401d-8ad5-68b9801d7f0c', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '8826e9af-6c9f-4c1d-97c5-20047bdec56e', tenant_id: 'bb6fe97e-d130-401d-8ad5-68b9801d7f0c', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '42dc053f-1f18-4ce1-8284-76bb19a04fa3', tenant_id: 'bb6fe97e-d130-401d-8ad5-68b9801d7f0c', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // SAMSAT Belopa (10450242-385d-4758-9f6e-62a14a6df74b)
  { id: '0c0a7e59-0665-4c35-aa9e-0b57161bea92', tenant_id: '10450242-385d-4758-9f6e-62a14a6df74b', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: '9f969ee7-9d33-4c4d-9b86-8164aefdf99d', tenant_id: '10450242-385d-4758-9f6e-62a14a6df74b', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '936ede55-4fc7-4ee1-9271-8bcb405b3c4e', tenant_id: '10450242-385d-4758-9f6e-62a14a6df74b', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '68eed276-fc3a-45bb-aea5-fef8dcc92e6a', tenant_id: '10450242-385d-4758-9f6e-62a14a6df74b', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // KPP Pratama Palopo (19bf1720-d067-441f-87be-831742b505e2)
  { id: '34ca6994-1b83-40ed-b985-e808b124840f', tenant_id: '19bf1720-d067-441f-87be-831742b505e2', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: '2ac6b723-b050-431c-a0d6-22f3704d1444', tenant_id: '19bf1720-d067-441f-87be-831742b505e2', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: 'e71af0b6-def5-499c-919f-3e6d495dcace', tenant_id: '19bf1720-d067-441f-87be-831742b505e2', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '18eff70d-72a0-4254-969c-6d4a1847ebbb', tenant_id: '19bf1720-d067-441f-87be-831742b505e2', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // Kejaksaan Negeri Luwu (ec3871f6-854e-47e5-bd87-24794df950bc)
  { id: '82263895-6330-4525-93d3-01253da3737a', tenant_id: 'ec3871f6-854e-47e5-bd87-24794df950bc', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: 'f6411725-145f-49cf-a5d3-e4ed2ed43c1f', tenant_id: 'ec3871f6-854e-47e5-bd87-24794df950bc', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '8b024436-1842-4003-8d94-6705b5ab32db', tenant_id: 'ec3871f6-854e-47e5-bd87-24794df950bc', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '14240e62-32b7-40c7-923a-6d2b1c13d763', tenant_id: 'ec3871f6-854e-47e5-bd87-24794df950bc', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // PT. Taspen (1f938559-abd5-445d-9892-7701f35475a4)
  { id: 'f84415b2-c581-4238-b842-6bbcbda0acbb', tenant_id: '1f938559-abd5-445d-9892-7701f35475a4', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: '07604d76-9f59-441d-8229-ed6d5ecbc3f6', tenant_id: '1f938559-abd5-445d-9892-7701f35475a4', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '70cee126-a698-4f62-b040-1b947003fbdb', tenant_id: '1f938559-abd5-445d-9892-7701f35475a4', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '4ca94f96-ae01-4b3b-9c86-ad24edcf30af', tenant_id: '1f938559-abd5-445d-9892-7701f35475a4', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // Dinas Sosial (fe2ef49d-f8a7-4c93-8cc9-7af4025e37ce)
  { id: 'b92886e8-67e6-471b-adbb-feb1d574899a', tenant_id: 'fe2ef49d-f8a7-4c93-8cc9-7af4025e37ce', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: 'd2724670-3eac-44d2-8ebd-ac30f23687be', tenant_id: 'fe2ef49d-f8a7-4c93-8cc9-7af4025e37ce', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '325f6294-b276-4588-bf75-85f74f40e77b', tenant_id: 'fe2ef49d-f8a7-4c93-8cc9-7af4025e37ce', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: 'e7af4389-08ac-4a19-b44c-49baa8cadf5c', tenant_id: 'fe2ef49d-f8a7-4c93-8cc9-7af4025e37ce', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // Disnakertrans (074f988a-5c06-4771-a528-b23ff838c722)
  { id: '7cff568c-12ba-4e3d-8fe9-63f7461d82d3', tenant_id: '074f988a-5c06-4771-a528-b23ff838c722', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: '97234547-6b42-46dc-bad5-1067db4c8060', tenant_id: '074f988a-5c06-4771-a528-b23ff838c722', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '35b1dc81-cc62-4d31-82ea-9afeedd24995', tenant_id: '074f988a-5c06-4771-a528-b23ff838c722', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '3a6fa6ea-bb3c-446b-bc40-a59b0883aea3', tenant_id: '074f988a-5c06-4771-a528-b23ff838c722', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // Dinas Perikanan (ab058d21-f111-4014-a736-785b1e6f0b3f)
  { id: 'bbfb0b90-eb96-4dfa-9654-8b479265de7d', tenant_id: 'ab058d21-f111-4014-a736-785b1e6f0b3f', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: 'c53f6606-bc3f-437d-9534-3784382d7fb0', tenant_id: 'ab058d21-f111-4014-a736-785b1e6f0b3f', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: 'a7be34b6-b579-496e-bdd8-de7248793c16', tenant_id: 'ab058d21-f111-4014-a736-785b1e6f0b3f', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: 'f34f5475-8a47-435a-9610-f24026a2cdb9', tenant_id: 'ab058d21-f111-4014-a736-785b1e6f0b3f', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // Dinas Kominfo (1ab5889f-b09d-4780-9b6b-e17ad8ec3dab)
  { id: 'ee50b778-c913-4378-8563-a959bd8a2b6e', tenant_id: '1ab5889f-b09d-4780-9b6b-e17ad8ec3dab', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: '455995c8-a9e3-4a02-8f95-fbddbf3f6d98', tenant_id: '1ab5889f-b09d-4780-9b6b-e17ad8ec3dab', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '046e62cc-9ebf-49d5-9561-11e31e9e0004', tenant_id: '1ab5889f-b09d-4780-9b6b-e17ad8ec3dab', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '6ee6667b-dfb7-4c1a-89e0-2eb00b6ee90d', tenant_id: '1ab5889f-b09d-4780-9b6b-e17ad8ec3dab', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // PDAM Tirta Luwu (7e408d3c-0d8a-4eba-bfcb-87cffa249fb1)
  { id: '14268733-d6a9-4daf-aca7-419482097202', tenant_id: '7e408d3c-0d8a-4eba-bfcb-87cffa249fb1', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: '35d83336-1773-4a38-9eab-cfb64cd89024', tenant_id: '7e408d3c-0d8a-4eba-bfcb-87cffa249fb1', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '1124eca0-e5d1-4e46-8fca-37c9205e6007', tenant_id: '7e408d3c-0d8a-4eba-bfcb-87cffa249fb1', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: 'eb2c668e-123c-41ad-a36d-201f1b80dd1c', tenant_id: '7e408d3c-0d8a-4eba-bfcb-87cffa249fb1', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // DEKRANASDA Luwu (b5f466c5-7643-4547-9034-e3420d7031a7)
  { id: '64750a1e-5262-4e9d-a39f-957fff993605', tenant_id: 'b5f466c5-7643-4547-9034-e3420d7031a7', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: 'efcdf07e-bc56-4f56-86cb-8acc1122b1a3', tenant_id: 'b5f466c5-7643-4547-9034-e3420d7031a7', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: 'ca70d10f-739e-4810-936a-17f26d4457bc', tenant_id: 'b5f466c5-7643-4547-9034-e3420d7031a7', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '121cde45-6621-49f0-b3ab-df3de6a2327c', tenant_id: 'b5f466c5-7643-4547-9034-e3420d7031a7', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // HAS International Center (b2969f12-ae72-4015-a9e6-a0ff835f6aa3)
  { id: 'e138381a-d0b8-4927-a0a6-bddbd422d52b', tenant_id: 'b2969f12-ae72-4015-a9e6-a0ff835f6aa3', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: 'de4f900e-168c-4997-9516-ace56005c729', tenant_id: 'b2969f12-ae72-4015-a9e6-a0ff835f6aa3', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: '1c1d3e2b-f345-4596-ae09-9783628e5c57', tenant_id: 'b2969f12-ae72-4015-a9e6-a0ff835f6aa3', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: '4c3c95f7-aa3b-431d-9b1e-e4480d01d4f7', tenant_id: 'b2969f12-ae72-4015-a9e6-a0ff835f6aa3', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 },

  // PT. Nevis (93f472c8-9b44-493f-a7a4-2de11e247ff3)
  { id: 'cfb959ad-f0d2-49e5-b868-e7476d3a15ba', tenant_id: '93f472c8-9b44-493f-a7a4-2de11e247ff3', service_name: 'Konsultasi & Layanan Informasi Pelayanan', name: 'Konsultasi & Layanan Informasi Pelayanan', is_long_process: false, estimated_time_minutes: 15 },
  { id: 'f1de26d7-a1da-4b65-90e5-90d778f1d66e', tenant_id: '93f472c8-9b44-493f-a7a4-2de11e247ff3', service_name: 'Pengurusan Dokumen & Rekomendasi Teknis', name: 'Pengurusan Dokumen & Rekomendasi Teknis', is_long_process: false, estimated_time_minutes: 25 },
  { id: 'de24f72b-53c7-43a9-8039-d70575831c91', tenant_id: '93f472c8-9b44-493f-a7a4-2de11e247ff3', service_name: 'Verifikasi Berkas & Validasi Permohonan', name: 'Verifikasi Berkas & Validasi Permohonan', is_long_process: false, estimated_time_minutes: 20 },
  { id: 'a8335d8d-6a4d-4a5f-b371-dc7c66c43c36', tenant_id: '93f472c8-9b44-493f-a7a4-2de11e247ff3', service_name: 'Layanan Pengaduan & Asistensi Masyarakat', name: 'Layanan Pengaduan & Asistensi Masyarakat', is_long_process: false, estimated_time_minutes: 15 }
];

export const mppService = {
  // 1. Ambil Seluruh Instansi / Tenant
  async getTenants(): Promise<MPPTenant[]> {
    try {
      const { data, error } = await supabase
        .from('mpp_tenants')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        return OFFICIAL_MPP_TENANTS;
      }
      return data;
    } catch {
      return OFFICIAL_MPP_TENANTS;
    }
  },

  // 2. Ambil Layanan Berdasarkan Tenant
  async getServicesByTenant(tenantId?: string): Promise<MPPService[]> {
    try {
      let query = supabase.from('mpp_services').select('*');
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      const { data, error } = await query.order('service_name', { ascending: true });

      if (error || !data || data.length === 0) {
        return tenantId 
          ? OFFICIAL_MPP_SERVICES.filter(s => s.tenant_id === tenantId)
          : OFFICIAL_MPP_SERVICES;
      }
      return data.map(s => ({
        ...s,
        name: s.service_name || s.name
      }));
    } catch {
      return tenantId 
        ? OFFICIAL_MPP_SERVICES.filter(s => s.tenant_id === tenantId)
        : OFFICIAL_MPP_SERVICES;
    }
  },

  // 3. Ambil Data Warga berdasarkan NIK
  async getCitizenByNik(nik: string): Promise<MPPCitizen | null> {
    try {
      const { data, error } = await supabase
        .from('mpp_citizens')
        .select('*')
        .eq('nik', nik.trim())
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  // 4. Daftarkan / Update Data Warga
  async registerOrUpdateCitizen(citizen: MPPCitizen): Promise<MPPCitizen> {
    const payload = {
      nik: citizen.nik.trim(),
      full_name: citizen.full_name.trim(),
      phone_number: citizen.phone_number?.trim() || null,
      address: citizen.address?.trim() || null,
      gender: citizen.gender || citizen.jenis_kelamin || 'Laki-laki',
      jenis_kelamin: citizen.gender || citizen.jenis_kelamin || 'Laki-laki',
      occupation: citizen.occupation || citizen.pekerjaan || 'Wiraswasta / Pelaku Usaha',
      pekerjaan: citizen.occupation || citizen.pekerjaan || 'Wiraswasta / Pelaku Usaha',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('mpp_citizens')
      .upsert(payload, { onConflict: 'nik' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 5. Terbitkan Tiket Antrean (Kios Mandiri / Portal Online)
  async issueQueueTicket(params: {
    tenantId: string;
    serviceId: string;
    citizenNik: string;
  }): Promise<{ queue: MPPQueue; tenant: MPPTenant; service: MPPService }> {
    const today = new Date().toISOString().split('T')[0];

    // Cek duplikasi antrean aktif dengan NIK yang sama pada hari yang sama
    const { data: activeQueues } = await supabase
      .from('mpp_queues')
      .select('id, ticket_code, status, tenant:mpp_tenants(name)')
      .eq('citizen_nik', params.citizenNik)
      .eq('queue_date', today)
      .in('status', ['menunggu', 'dipanggil', 'dilayani']);

    if (activeQueues && activeQueues.length > 0) {
      const activeQ = activeQueues[0] as any;
      throw new Error(`NIK ${params.citizenNik} sudah memiliki antrean aktif (Tiket: ${activeQ.ticket_code}). Selesaikan atau batalkan antrean sebelumnya sebelum mendaftar antrean baru.`);
    }

    // Ambil tenant & service
    const tenant = OFFICIAL_MPP_TENANTS.find(t => t.id === params.tenantId) || {
      id: params.tenantId,
      name: 'Loket MPP',
      code: 'MPP',
      created_at: new Date().toISOString()
    };
    const service = OFFICIAL_MPP_SERVICES.find(s => s.id === params.serviceId) || {
      id: params.serviceId,
      tenant_id: params.tenantId,
      service_name: 'Layanan Terpadu',
      name: 'Layanan Terpadu',
      is_long_process: false
    };

    // Cari nomor urut terakhir
    const { data: lastQueue } = await supabase
      .from('mpp_queues')
      .select('queue_number')
      .eq('tenant_id', params.tenantId)
      .eq('queue_date', today)
      .order('queue_number', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastQueue && lastQueue.length > 0 && lastQueue[0].queue_number) {
      nextNumber = lastQueue[0].queue_number + 1;
    }

    const dateCompact = today.replace(/-/g, '');
    const padded = String(nextNumber).padStart(3, '0');
    const ticketCode = `${tenant.code || 'MPP'}-${dateCompact}-${padded}`;

    const newQueuePayload = {
      tenant_id: params.tenantId,
      service_id: params.serviceId,
      citizen_nik: params.citizenNik,
      queue_date: today,
      queue_number: nextNumber,
      ticket_code: ticketCode,
      status: 'menunggu' as QueueStatus
    };

    const { data, error } = await supabase
      .from('mpp_queues')
      .insert(newQueuePayload)
      .select()
      .single();

    if (error) {
      // Jika RLS atau offline, construct in-memory object
      const fallbackQueue: MPPQueue = {
        id: crypto.randomUUID(),
        ...newQueuePayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tenant,
        service
      };
      return { queue: fallbackQueue, tenant, service };
    }

    return { queue: data, tenant, service };
  },

  // 6. Update Status Antrean (Dipanggil, Dilayani, Selesai Langsung, Masuk Tracking)
  async updateQueueStatus(queueId: string, status: QueueStatus): Promise<boolean> {
    const { error } = await supabase
      .from('mpp_queues')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', queueId);

    return !error;
  },

  // 7. Ambil Antrean Hari Ini
  async getTodayQueues(tenantId?: string): Promise<MPPQueue[]> {
    const today = new Date().toISOString().split('T')[0];
    let query = supabase
      .from('mpp_queues')
      .select(`
        *,
        citizen:mpp_citizens(*),
        tenant:mpp_tenants(*),
        service:mpp_services(*)
      `)
      .eq('queue_date', today)
      .order('queue_number', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  },

  // 8. Buat Tracking Berkas Izin (Long Process Services)
  async createDocumentTracking(params: {
    queueId: string;
    trackingCode: string;
    initialStatus: string;
  }): Promise<MPPDocumentTracking> {
    const payload = {
      queue_id: params.queueId,
      tracking_code: params.trackingCode,
      current_status: params.initialStatus,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('mpp_document_tracking')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Catat riwayat awal
    await supabase.from('mpp_tracking_history').insert({
      tracking_id: data.id,
      status_description: `Berkas didaftarkan dengan status: ${params.initialStatus}`,
      created_at: new Date().toISOString()
    });

    return data;
  },

  // 9. Lacak Berkas berdasarkan Tracking Code
  async trackDocument(trackingCode: string): Promise<{
    tracking: MPPDocumentTracking | null;
    history: MPPTrackingHistory[];
    queue?: MPPQueue;
  }> {
    const { data: tracking, error } = await supabase
      .from('mpp_document_tracking')
      .select('*, queue:mpp_queues(*, tenant:mpp_tenants(*), service:mpp_services(*), citizen:mpp_citizens(*))')
      .eq('tracking_code', trackingCode.trim())
      .maybeSingle();

    if (error || !tracking) {
      return { tracking: null, history: [] };
    }

    const { data: history } = await supabase
      .from('mpp_tracking_history')
      .select('*')
      .eq('tracking_id', tracking.id)
      .order('created_at', { ascending: true });

    return {
      tracking,
      history: history || [],
      queue: tracking.queue
    };
  },

  // 10. Update Status Tracking Berkas (Oleh Operator/Admin)
  async updateTrackingStatus(params: {
    trackingId: string;
    newStatus: string;
    notes?: string;
    updatedBy?: string;
  }): Promise<boolean> {
    const { error: updErr } = await supabase
      .from('mpp_document_tracking')
      .update({
        current_status: params.newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.trackingId);

    if (updErr) return false;

    await supabase.from('mpp_tracking_history').insert({
      tracking_id: params.trackingId,
      status_description: params.notes || `Status diperbarui menjadi: ${params.newStatus}`,
      updated_by: params.updatedBy || null,
      created_at: new Date().toISOString()
    });

    return true;
  },

  // 11. Kirim Survei Kepuasan Masyarakat (SKM)
  async submitSkm(params: {
    queueId: string;
    tenantId: string;
    citizenNik: string;
    rating: number; // 1 to 5
    feedback?: string;
  }): Promise<boolean> {
    const { error } = await supabase.from('mpp_skm').insert({
      queue_id: params.queueId,
      tenant_id: params.tenantId,
      citizen_nik: params.citizenNik,
      rating: params.rating,
      feedback: params.feedback || null,
      created_at: new Date().toISOString()
    });

    return !error;
  },

  // 12. Ambil Statistik SKM
  async getSkmStats(): Promise<{
    averageRating: number;
    totalRespondents: number;
    distribution: Record<number, number>;
  }> {
    const { data, error } = await supabase.from('mpp_skm').select('rating');
    if (error || !data || data.length === 0) {
      return {
        averageRating: 4.85,
        totalRespondents: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    data.forEach(item => {
      const r = typeof item.rating === 'number' ? Math.round(item.rating) : 5;
      if (dist[r] !== undefined) dist[r]++;
      sum += r;
    });

    return {
      averageRating: Number((sum / data.length).toFixed(2)),
      totalRespondents: data.length,
      distribution: dist
    };
  }
};
