-- =========================================================================
-- MIGRATION: Investment Readiness Pillars & Spatial RDTR Zones
-- Database: Supabase PostgreSQL (Single Source of Truth)
-- Standar: Kementerian Investasi / BKPM RI & Pemkab Luwu (Perda RTRW 1/2024)
-- =========================================================================

-- 1. Table: investment_readiness_pillars
CREATE TABLE IF NOT EXISTS investment_readiness_pillars (
  id                      UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar_id               TEXT        UNIQUE NOT NULL,
  number                  TEXT        NOT NULL,
  badge                   TEXT        NOT NULL,
  short_label             TEXT        NOT NULL,
  title                   TEXT        NOT NULL,
  subtitle                TEXT        NOT NULL,
  accent_color            TEXT        NOT NULL,
  accent_bg               TEXT        NOT NULL,
  score                   TEXT        NOT NULL,
  readiness_rating        TEXT        NOT NULL,
  tagline                 TEXT        NOT NULL,
  blueprint_standard      TEXT        NOT NULL,
  luwu_readiness_status   TEXT        NOT NULL,
  key_metrics             JSONB       DEFAULT '[]'::jsonb,
  strategic_points        JSONB       DEFAULT '[]'::jsonb,
  primary_action_label    TEXT        NOT NULL,
  secondary_action_label  TEXT,
  urutan                  INT         DEFAULT 0,
  is_active               BOOLEAN     DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: spatial_rdtr_zones
CREATE TABLE IF NOT EXISTS spatial_rdtr_zones (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL,
  status      TEXT        NOT NULL,
  color       TEXT        NOT NULL,
  urutan      INT         DEFAULT 0,
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS)
ALTER TABLE investment_readiness_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_rdtr_zones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'investment_readiness_pillars' AND policyname = 'Allow public read on investment_readiness_pillars'
  ) THEN
    CREATE POLICY "Allow public read on investment_readiness_pillars" ON investment_readiness_pillars FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spatial_rdtr_zones' AND policyname = 'Allow public read on spatial_rdtr_zones'
  ) THEN
    CREATE POLICY "Allow public read on spatial_rdtr_zones" ON spatial_rdtr_zones FOR SELECT USING (true);
  END IF;
END $$;

-- 4. Seed Data: 6 Investment Readiness Pillars (SSOT)
INSERT INTO investment_readiness_pillars (
  pillar_id, number, badge, short_label, title, subtitle,
  accent_color, accent_bg, score, readiness_rating, tagline,
  blueprint_standard, luwu_readiness_status,
  key_metrics, strategic_points,
  primary_action_label, secondary_action_label, urutan, is_active
) VALUES
(
  'spatial',
  '01',
  'Tata Ruang Digital',
  'Tata Ruang',
  'Spatial Ready',
  'Integrasi RDTR Digital, OSS & Kesesuaian Ruang (KKPR)',
  'text-emerald-600 dark:text-emerald-400',
  'bg-emerald-500/10 border-emerald-500/30',
  '98%',
  'Tingkat Kesiapan A1 • Clean & Clear',
  'Kepastian plot koordinat investasi 0% sengketa dengan sinkronisasi PostGIS & GISTARU.',
  'Integrasi RDTR Digital OSS-RBA, Percepatan Konfirmasi KKPR & Kepastian Zonasi',
  '100% Valid Spasial (Perda RTRW No. 1/2024 & Modul Digital KKPR)',
  '[
    {"label": "Validasi Spasial", "value": "Real-Time", "desc": "Sinkronisasi otomatis layer RTRW 22 kecamatan"},
    {"label": "SLA Konfirmasi KKPR", "value": "3 - 5 Hari", "desc": "Pemeriksaan teknis PUPR terintegrasi DPMPTSP"},
    {"label": "Luas Lahan Terpetakan", "value": "3.000+ Ha", "desc": "Polygon terverifikasi Clean & Clear"}
  ]'::jsonb,
  '[
    {"title": "Peta RDTR Digital Terintegrasi", "desc": "Plotting koordinat investasi langsung terhubung layer zonasi KIB (Kawasan Industri Bua), agropolitan, dan pariwisata.", "standard": "OSS-RBA Digital GISTARU"},
    {"title": "Sertifikasi KKPR Bebas Sengketa", "desc": "Alur perizinan tata ruang terverifikasi langsung via sistem GIS tanpa tumpang tindih kawasan hutan lindung.", "standard": "PP No. 21/2021"},
    {"title": "Katalog Spasial IPRO Presisi", "desc": "Setiap paket investasi dilengkapi polygon WGS84 resmi, status kepemilikan SHM/HPL, dan buffer infrastruktur.", "standard": "Standar BKPM RI"}
  ]'::jsonb,
  'Cek Kesesuaian Lahan (RTRW)',
  'Buka Peta Spasial GIS',
  1,
  true
),
(
  'infrastructure',
  '02',
  'Konektivitas Multimoda',
  'Infrastruktur',
  'Infrastructure Ready',
  'Akses Tol, Pelabuhan Ulo-Ulo, Bandara Bua & Jaringan Energi',
  'text-sky-600 dark:text-sky-400',
  'bg-sky-500/10 border-sky-500/30',
  '96%',
  'Tingkat Kesiapan A1 • Multimoda Siap',
  'Dukungan logistik laut, udara, dan darat terkoneksi langsung ke sentra produksi.',
  'Konektivitas Pelabuhan Pengumpan Regional, Bandara Domestik, Jaringan Listrik & Air Bersih',
  'Terkoneksi Pelabuhan Ulo-Ulo, Bandara Bua & Gardu PLN 150kV',
  '[
    {"label": "Kapasitas Pelabuhan Ulo-Ulo", "value": "10.000 DWT", "desc": "Dermaga kargo curah & peti kemas regional"},
    {"label": "Runway Bandara Bua", "value": "2.250 m", "desc": "Siap operasional kargo udara & penerbangan direct"},
    {"label": "Keandalan Pasokan Listrik", "value": "Surplus 45 MW", "desc": "Interkoneksi Gardu Induk 150kV Belopa & Bua"}
  ]'::jsonb,
  '[
    {"title": "Pelabuhan Kargo Ulo-Ulo", "desc": "Gerbang ekspor langsung hasil bumi dan olahan tambang/industri tanpa transit panjang ke Makassar.", "standard": "Tol Laut Nasional"},
    {"title": "Bandara Bua Kargo Udara", "desc": "Fasilitasi ekspor komoditas bernilai tinggi (seafood segar, vanili, kopi premium) via jalur udara cepat.", "standard": "Kemenhub RI"},
    {"title": "SPAM Kawasan Industri Bua", "desc": "Pasokan air baku industri stabil dengan kapasitas intake terdedikasi untuk kebutuhan pabrik pengolahan.", "standard": "PUPR Cipta Karya"}
  ]'::jsonb,
  'Katalog Logistik & Transportasi',
  'Peta Rute Jaringan Energi',
  2,
  true
),
(
  'industry',
  '03',
  'Kawasan Hilirisasi',
  'Industri & Bahan Baku',
  'Industry Ready',
  'Kawasan Industri Bua (KIB), Ketersediaan Lahan & Rantai Pasok',
  'text-teal-600 dark:text-teal-400',
  'bg-teal-500/10 border-teal-500/30',
  '94%',
  'Tingkat Kesiapan A • Klaster Strategis',
  'Ekosistem hilirisasi kakao, rumput laut, kopi, cengkeh, dan pengolahan nikel rendah emisi.',
  'Klaster Kawasan Industri Terencana, Jaminan Pasokan Bahan Baku & Izin Lingkungan Terpadu',
  'Masterplan KIB 1.000 Ha & Sentra Industri Kakao/Rumput Laut',
  '[
    {"label": "Luas Kawasan Industri (KIB)", "value": "1.000 Ha", "desc": "Zona industri manufaktur, smelter & agroindustri"},
    {"label": "Produksi Kakao Tahunan", "value": "32.000+ Ton", "desc": "Bahan baku hilirisasi cokelat premium & butter"},
    {"label": "Potensi Rumput Laut", "value": "85.000+ Ton", "desc": "Komoditas Eucheuma Cottonii siap olah karaginan"}
  ]'::jsonb,
  '[
    {"title": "Klaster Smelter Rendah Karbon", "desc": "Kawasan pengolahan mineral terintegrasi green energy hidro dan surya di koridor Bua-Kamanre.", "standard": "Hilirisasi Nasional"},
    {"title": "Sentra Industri Kakao Terpadu", "desc": "Pabrik pengolahan biji kakao menjadi cocoa butter dan liquor berorientasi ekspor Eropa dan Asia Pasifik.", "standard": "SNI & HACCP Ready"},
    {"title": "Pengolahan Modern Rumput Laut", "desc": "Pabrik alkali treated carrageenan (ATC) di pesisir Belopa untuk mendukung industri farmasi dan makanan.", "standard": "Marine Food Grade"}
  ]'::jsonb,
  'Eksplorasi Potensi Komoditas',
  'Profil Kawasan Industri (KIB)',
  3,
  true
),
(
  'financing',
  '04',
  'Insentif & Skema Fiskal',
  'Pembiayaan & Insentif',
  'Financing Ready',
  'Paket Insentif Fiskal Daerah, Tax Holiday & Skema KPBU',
  'text-amber-600 dark:text-amber-400',
  'bg-amber-500/10 border-amber-500/30',
  '95%',
  'Tingkat Kesiapan A1 • Fiskal Menarik',
  'Kepastian insentif pajak daerah, pengurangan retribusi PBG, dan fasilitasi Tax Holiday Kemenkeu.',
  'Peraturan Daerah Pemberian Insentif, Fasilitas Non-Fiskal & Pipeline KPBU Terstruktur',
  'Perda Insentif No. 2/2021 & Pipeline Proyek KPBU Aktif',
  '[
    {"label": "Pengurangan PBG Industri", "value": "Hingga 50%", "desc": "Sesuai Perda Kabupaten Luwu No. 2/2021"},
    {"label": "Masa Keringanan PBB-P2", "value": "s.d 5 Tahun", "desc": "Insentif khusus periode konstruksi fasilitas baru"},
    {"label": "Pipeline Proyek KPBU", "value": "3 Proyek", "desc": "SPAM KIB, Cold Chain Ulo-Ulo & Kargo Bua"}
  ]'::jsonb,
  '[
    {"title": "Simulasi Insentif Fiskal Interaktif", "desc": "Kalkulator instan untuk mengestimasi penghematan biaya PBG, PBB-P2, dan fasilitasi perizinan terpadu.", "standard": "Perda No. 2/2021"},
    {"title": "Fasilitasi Tax Holiday & Allowance", "desc": "Pendampingan VIP pengajuan fasilitas keringanan PPh Badan ke Kementerian Investasi / BKPM RI.", "standard": "PMK Kemenkeu RI"},
    {"title": "Skema KPBU & Blended Finance", "desc": "Peluang kerja sama pemerintah-swasta dengan penjaminan PT PII dan dukungan kelayakan VGF Kemenkeu.", "standard": "Perpres No. 38/2015"}
  ]'::jsonb,
  'Buka Kalkulator Insentif Fiskal',
  'Konsultasi Meja KPBU',
  4,
  true
),
(
  'environment',
  '05',
  'Keberlanjutan & AMDAL',
  'Lingkungan & ESG',
  'Environment Ready',
  'AMDAL Terverifikasi, KLHS RTRW & Bebas Kawasan Konservasi',
  'text-emerald-700 dark:text-emerald-300',
  'bg-emerald-600/10 border-emerald-600/30',
  '100%',
  'Tingkat Kesiapan A1 • ESG Compliant',
  'Jaminan kepatuhan lingkungan hidup, bebas risiko deforestasi hutan lindung, dan standar ESG global.',
  'Kajian Lingkungan Hidup Strategis (KLHS), Daya Dukung & Daya Tampung Lingkungan Hidup (D3TLH)',
  'Kajian Lingkungan Hidup Strategis (KLHS) & Zero Sengketa Hutan Lindung',
  '[
    {"label": "Kesesuaian KLHS RTRW", "value": "100% Valid", "desc": "Dokumen KLHS disetujui KLHK RI"},
    {"label": "Bebas Kawasan Lindung", "value": "0% Sengketa", "desc": "Clear overlay peta kawasan hutan lindung BPKH"},
    {"label": "Indeks Kualitas Udara (AQI)", "value": "Baik (AQI < 25)", "desc": "Standar baku mutu lingkungan sangat terjaga"}
  ]'::jsonb,
  '[
    {"title": "Sinkronisasi Peta Kawasan Hutan", "desc": "Overlay otomatis polygon izin usaha terhadap SK MenLHK tentang Kawasan Hutan dan Konservasi Perairan.", "standard": "KLHK RI & BPKH"},
    {"title": "Percepatan Persetujuan Lingkungan", "desc": "Layanan klinik AMDAL, UKL-UPL, dan SPPL terintegrasi langsung dengan Dinas Lingkungan Hidup Luwu.", "standard": "PP No. 22/2021"},
    {"title": "Komitmen Green Industry & Dekarbonisasi", "desc": "Ketersediaan sertifikasi energi hijau (REC PLN) dari pembangkit listrik tenaga hidro mikro di Luwu.", "standard": "ISO 14001 & ESG"}
  ]'::jsonb,
  'Kajian Lingkungan & KLHS',
  'Unduh Pedoman AMDAL',
  5,
  true
),
(
  'local_economy',
  '06',
  'Kemitraan & Tenaga Kerja',
  'Tenaga Kerja & UMKM',
  'Local Economy Ready',
  'Kemitraan UMKM Lokal, Balai Latihan Kerja & Stabilitas Sosial',
  'text-indigo-600 dark:text-indigo-400',
  'bg-indigo-500/10 border-indigo-500/30',
  '92%',
  'Tingkat Kesiapan A • Kolaboratif',
  'Ekosistem rantai pasok lokal yang harmonis, ketersediaan tenaga kerja muda, dan kemitraan UMKM binaan.',
  'Kewajiban Kemitraan Usaha Besar & UMKM Lokal (Perpres 10/2021), Pusat Pelatihan Vokasi Daerah',
  'Katalog Kemitraan UMKM Terverifikasi & Balai Latihan Kerja Daerah',
  '[
    {"label": "Usia Produktif Angkatan Kerja", "value": "68,4%", "desc": "Demografi angkatan kerja muda siap latih"},
    {"label": "UMKM Mitra Terkurasi", "value": "1.250+ Unit", "desc": "Database UMKM pemasok dan sub-kontraktor lokal"},
    {"label": "Balai Latihan Kerja (BLK)", "value": "Terakreditasi", "desc": "Kejuruan teknik las, kelistrikan & agroindustri"}
  ]'::jsonb,
  '[
    {"title": "Katalog Kemitraan Rantai Pasok UMKM", "desc": "Mempertemukan investor skala besar dengan koperasi dan UMKM lokal untuk katering, logistik, dan bahan baku.", "standard": "Permen BKPM No. 1/2022"},
    {"title": "Custom Training Vokasi Siap Kerja", "desc": "Pemerintah daerah memfasilitasi kurikulum pelatihan vokasi BLK sesuai kebutuhan spesifik industri investor.", "standard": "Disnakertrans Luwu"},
    {"title": "Fasilitasi Iklim Usaha Kondusif", "desc": "Forum komunikasi ketenagakerjaan tripartit aktif menjaga stabilitas operasional industri jangka panjang.", "standard": "Pemkab Luwu"}
  ]'::jsonb,
  'Katalog Kemitraan UMKM',
  'Data Ketenagakerjaan Daerah',
  6,
  true
)
ON CONFLICT (pillar_id) DO UPDATE SET
  number = EXCLUDED.number,
  badge = EXCLUDED.badge,
  short_label = EXCLUDED.short_label,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  accent_color = EXCLUDED.accent_color,
  accent_bg = EXCLUDED.accent_bg,
  score = EXCLUDED.score,
  readiness_rating = EXCLUDED.readiness_rating,
  tagline = EXCLUDED.tagline,
  blueprint_standard = EXCLUDED.blueprint_standard,
  luwu_readiness_status = EXCLUDED.luwu_readiness_status,
  key_metrics = EXCLUDED.key_metrics,
  strategic_points = EXCLUDED.strategic_points,
  primary_action_label = EXCLUDED.primary_action_label,
  secondary_action_label = EXCLUDED.secondary_action_label,
  urutan = EXCLUDED.urutan,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 5. Seed Data: 4 Spatial RDTR Zones (SSOT)
INSERT INTO spatial_rdtr_zones (code, name, type, status, color, urutan, is_active)
VALUES
  (
    'KIB',
    'Kawasan Industri Bua',
    'Zona Industri Manufaktur & Smelter',
    'RDTR Digital Aktif (OSS-RBA)',
    'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    1,
    true
  ),
  (
    'AGR',
    'Koridor Agropolitan Noling - Suli',
    'Zona Hilirisasi Pertanian & Kakao',
    'Kesesuaian Ruang Terverifikasi',
    'border-teal-500/50 bg-teal-500/10 text-teal-400',
    2,
    true
  ),
  (
    'MAR',
    'Kawasan Maritim & Pelabuhan Ulo-Ulo',
    'Zona Logistik, Cold Chain & Perikanan',
    'Integrasi RZWP-3-K & RTRW Luwu',
    'border-sky-500/50 bg-sky-500/10 text-sky-400',
    3,
    true
  ),
  (
    'EKO',
    'Ekowisata Pegunungan Latimojong',
    'Zona Pariwisata Hijau & Perkebunan Kopi',
    'Bebas Kawasan Lindung Rentan',
    'border-amber-500/50 bg-amber-500/10 text-amber-400',
    4,
    true
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  color = EXCLUDED.color,
  urutan = EXCLUDED.urutan,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
