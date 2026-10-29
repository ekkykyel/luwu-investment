import { SektorInvestasi } from "../types";

export const OSS_CAPEX_VARIABLES: Record<SektorInvestasi, { id: string; label: string }[]> = {
  [SektorInvestasi.PERTANIAN]: [
    { id: "capex_lahan", label: "Harga Pematangan Tanah / Pengadaan Lahan" },
    { id: "capex_gedung", label: "Nilai Gedung / Fasilitas Pendukung" },
    { id: "capex_mesin", label: "Mesin & Peralatan Pertanian" },
    { id: "capex_instalasi", label: "Instalasi & Sarana Prasarana" },
    { id: "capex_naker_konstruksi", label: "Biaya Tenaga Kerja (Tahap Konstruksi)" },
    { id: "capex_perizinan", label: "Perizinan & Pra-Operasi" },
    { id: "capex_modal_kerja", label: "Modal Kerja (Biaya Operasional 3 Bulan)" },
  ],
  [SektorInvestasi.KELAUTAN]: [
    { id: "capex_lahan", label: "Pengadaan Lahan / Kolam Tambak" },
    { id: "capex_gedung", label: "Nilai Bangunan / Gudang Penyimpanan" },
    { id: "capex_mesin", label: "Mesin & Peralatan (Pompa, Kincir, Kapal)" },
    { id: "capex_instalasi", label: "Instalasi Jaringan & Sarana Prasarana" },
    { id: "capex_perizinan", label: "Perizinan & Pra-Operasi" },
    { id: "capex_modal_kerja", label: "Modal Kerja (Biaya Operasional 3 Bulan)" },
  ],
  [SektorInvestasi.PARIWISATA]: [
    { id: "capex_lahan", label: "Pembebasan Lahan / Sewa Lahan" },
    { id: "capex_gedung", label: "Konstruksi Bangunan Utama (Hotel/Resort/Fasilitas)" },
    { id: "capex_interior", label: "Interior & Eksterior (Lansekap, Dekorasi)" },
    { id: "capex_peralatan", label: "Peralatan & Furniture (Genset, AC, dll)" },
    { id: "capex_perizinan", label: "Biaya Perizinan & Konsultan" },
    { id: "capex_modal_kerja", label: "Modal Kerja (Biaya Operasional 3 Bulan)" },
  ],
  [SektorInvestasi.PERTAMBANGAN]: [
    { id: "capex_lahan", label: "Pembebasan / Kompensasi Lahan" },
    { id: "capex_eksplorasi", label: "Eksplorasi & Studi Kelayakan" },
    { id: "capex_alat_berat", label: "Alat Berat & Kendaraan Tambang" },
    { id: "capex_fasilitas", label: "Konstruksi Fasilitas Pengolahan" },
    { id: "capex_infrastruktur", label: "Infrastruktur Jalan & Jembatan" },
    { id: "capex_modal_kerja", label: "Modal Kerja (Biaya Operasional 3 Bulan)" },
  ],
  [SektorInvestasi.PERDAGANGAN]: [
    { id: "capex_lahan", label: "Pengadaan Lahan Industri" },
    { id: "capex_pabrik", label: "Konstruksi Pabrik / Gudang" },
    { id: "capex_mesin", label: "Mesin Produksi & Otomasi" },
    { id: "capex_logistik", label: "Kendaraan Logistik (Armada Pengiriman)" },
    { id: "capex_it", label: "Lisensi & Sistem IT (ERP Odoo dll)" },
    { id: "capex_modal_kerja", label: "Modal Kerja (Biaya Operasional 3 Bulan)" },
  ],
};

export const OSS_OPEX_VARIABLES: Record<SektorInvestasi, { id: string; label: string }[]> = {
  [SektorInvestasi.PERTANIAN]: [
    { id: "opex_bibit", label: "Biaya Bibit / Benih" },
    { id: "opex_pupuk", label: "Pupuk & Pestisida / Bahan Habis Pakai" },
    { id: "opex_naker", label: "Tenaga Kerja (Operasional)" },
    { id: "opex_perawatan", label: "Perawatan Mesin & Gedung" },
    { id: "opex_utilitas", label: "Biaya Utilitas (Air, Listrik)" },
    { id: "opex_pemasaran", label: "Biaya Pemasaran & Distribusi" },
  ],
  [SektorInvestasi.KELAUTAN]: [
    { id: "opex_bibit", label: "Benur / Bibit" },
    { id: "opex_pakan", label: "Pakan (Pellet) / Vitamin" },
    { id: "opex_naker", label: "Tenaga Kerja (Operasional)" },
    { id: "opex_energi", label: "Biaya Energi & Bahan Bakar" },
    { id: "opex_pemeliharaan", label: "Pemeliharaan Peralatan & Jaring" },
    { id: "opex_logistik", label: "Biaya Pasca Panen & Logistik" },
  ],
  [SektorInvestasi.PARIWISATA]: [
    { id: "opex_naker", label: "Gaji Karyawan" },
    { id: "opex_utilitas", label: "Biaya Utilitas (Listrik, Air, Internet)" },
    { id: "opex_maintenance", label: "Maintenance & Cleaning" },
    { id: "opex_pemasaran", label: "Biaya Pemasaran & Promosi" },
    { id: "opex_konsumsi", label: "Biaya Konsumsi & Bahan Baku (F&B)" },
  ],
  [SektorInvestasi.PERTAMBANGAN]: [
    { id: "opex_naker", label: "Gaji Tenaga Kerja Tambang" },
    { id: "opex_bbm", label: "Bahan Bakar Minyak (BBM Alat Berat)" },
    { id: "opex_peledakan", label: "Biaya Peledakan / Bahan Habis Pakai" },
    { id: "opex_perawatan", label: "Perawatan Alat Berat & Pabrik" },
    { id: "opex_reklamasi", label: "Biaya Rehabilitasi Lingkungan / Reklamasi" },
  ],
  [SektorInvestasi.PERDAGANGAN]: [
    { id: "opex_bahan_baku", label: "Bahan Baku Produksi" },
    { id: "opex_naker", label: "Gaji Karyawan & Buruh" },
    { id: "opex_utilitas", label: "Biaya Utilitas Pabrik (Listrik, Air, Gas)" },
    { id: "opex_kemasan", label: "Biaya Kemasan (Packaging)" },
    { id: "opex_logistik", label: "Biaya Distribusi & Logistik" },
  ],
};
