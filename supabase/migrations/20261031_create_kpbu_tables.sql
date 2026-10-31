-- =============================================
-- KPBU Projects Table
-- =============================================
CREATE TABLE kpbu_projects (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_proyek     TEXT        NOT NULL,
  sektor          TEXT        NOT NULL,
  sektor_icon     TEXT,
  estimasi_capex  BIGINT      NOT NULL,
  estimasi_capex_label TEXT   NOT NULL,
  skema           TEXT,
  status_tahap    TEXT,
  status_ipro     TEXT,
  fasilitas       TEXT[]      DEFAULT '{}',
  urutan          INT         DEFAULT 0,
  is_active       BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Investment Incentives Table  
-- =============================================
CREATE TABLE investment_incentives (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  regulasi      TEXT,
  kategori      TEXT,
  nilai_display TEXT        NOT NULL,
  satuan        TEXT        NOT NULL,
  nama_insentif TEXT        NOT NULL,
  deskripsi     TEXT,
  sumber        TEXT,
  urutan        INT         DEFAULT 0,
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- KPBU Config (badge, partners, dll)
-- =============================================
CREATE TABLE kpbu_config (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key     TEXT UNIQUE NOT NULL,
  value   TEXT,
  value_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEED DATA — Nilai dari UI yang sekarang
-- =============================================
INSERT INTO kpbu_projects 
  (nama_proyek, sektor, estimasi_capex, estimasi_capex_label, 
   skema, status_tahap, fasilitas, urutan)
VALUES
  (
    'SPAM Regional & Distribusi Air Bersih KIB',
    'Air Minum & Utilitas Industri',
    185000000000,
    'Rp 185 Miliar',
    'KPBU - User Charge / Availability Payment',
    'Tahap Penyiapan OBC',
    ARRAY['Dukungan Kelayakan VGF & PDF Kementerian Keuangan'],
    1
  ),
  (
    'Pergudangan Modern & Cold Chain Pelabuhan Ulo-Ulo',
    'Logistik & Maritim',
    120000000000,
    'Rp 120 Miliar',
    'KPBU Bangun-Guna-Serah (BGS / BOT)',
    'IPRO Siap Tawar',
    ARRAY['Penjaminan Infrastruktur PT PII & Fasilitas Lahan HPL'],
    2
  ),
  (
    'Pusat Logistik Berikat & Terminal Kargo Bandara Bua',
    'Aviasi & Multimoda',
    95000000000,
    'Rp 95 Miliar',
    'Kemitraan Swasta - BUMD Luwu',
    'FS Tersedia',
    ARRAY['Keringanan Pajak Daerah PBB-P2 5 Tahun Pertama'],
    3
  );

INSERT INTO investment_incentives
  (regulasi, kategori, nilai_display, satuan, 
   nama_insentif, deskripsi, sumber, urutan)
VALUES
  (
    'Perda Luwu No. 2/2021',
    'Insentif Pajak Daerah',
    '50%', 'PENGURANGAN',
    'Pembebasan Retribusi PBG',
    'Keringanan biaya persetujuan bangunan gedung untuk pabrik pengolahan hilirisasi dan fasilitas industri baru.',
    'Regulasi & Fasilitasi Resmi',
    1
  ),
  (
    'Insentif Pajak Daerah',
    'Insentif Pajak Daerah',
    '5 Th', 'MASA BEBAS PAJAK',
    'Keringanan PBB-P2 Konstruksi',
    'Tarif pajak bumi dan bangunan nol persen atau terdiskon selama masa konstruksi fisik fasilitas berlangsung.',
    'Regulasi & Fasilitasi Resmi',
    2
  ),
  (
    'Kementerian Keuangan RI',
    'Fasilitas Nasional',
    '100%', 'PPH BADAN',
    'Fasilitas Tax Holiday & Allowance',
    'Fasilitasi usulan penanaman modal pionir dan hilirisasi strategis ke BKPM RI dan Direktorat Jenderal Pajak.',
    'Kementerian Keuangan RI',
    3
  );

INSERT INTO kpbu_config (key, value, value_json) VALUES
  ('pipeline_badge_count', '3', NULL),
  ('pipeline_badge_label', 'PROYEK STRATEGIS TERBUKA', NULL),
  (
    'institutional_partners',
    NULL,
    '[
      {"nama": "Kementerian Keuangan RI", "peran": "Fasilitas VGF & PDF"},
      {"nama": "PT Penjaminan Infrastruktur Indonesia (PII)", "peran": "Penjaminan Risiko Proyek"},
      {"nama": "PT SMI (Persero)", "peran": "Pembiayaan Pembangunan"},
      {"nama": "LKPP", "peran": "Standarisasi Pengadaan Badan Usaha"},
      {"nama": "Bank Sulselbar", "peran": "Sindikasi Finansial Daerah"}
    ]'::jsonb
  );
