import React, { useState } from 'react';
import { 
  TrendingUp, 
  Database, 
  FileCheck2, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck, 
  Layers, 
  Send,
  X,
  ChevronRight,
  Zap,
  Building2,
  MapPin,
  Sparkles,
  FileSpreadsheet,
  Gauge,
  Compass,
  Droplets,
  Sprout,
  Wheat
} from 'lucide-react';

interface FourBidangSyncWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export const FourBidangSyncWorkflowModal: React.FC<FourBidangSyncWorkflowModalProps> = ({
  isOpen,
  onClose,
  userRole = 'admin_promosi'
}) => {
  const [selectedPhase, setSelectedPhase] = useState<number>(1);

  if (!isOpen) return null;

  const normRole = (userRole || '').toLowerCase();
  const isPuptr = normRole.includes('puptr') || normRole.includes('gis') || normRole.includes('tata_ruang');
  const isPertanian = normRole.includes('pertanian') || normRole.includes('lp2b');

  // DPMPTSP Phases
  const dpmptspPhases = [
    {
      id: 1,
      role: 'admin_promosi',
      title: 'Fase 1: Inisiasi & Promosi Investasi',
      bidang: 'Bidang Promosi & Penanaman Modal',
      officer: 'Siti Rahma, S.STP (Admin Promosi)',
      sla: '1 - 2 Hari Kerja',
      color: 'emerald',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      icon: TrendingUp,
      status: 'TERVERIFIKASI',
      statusColor: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
      inputs: [
        'Inquiry Minat Investor (Katalog IPRO / Sektor Unggulan)',
        'Formulir Letter of Intent (LoI) Digital',
        'Data Profil Perusahaan & Estimasi Kapital'
      ],
      actions: [
        'Penerbitan Single Investor ID (CRM Tracking Code)',
        'Verifikasi Keabsahan Formulir LoI & NIB',
        'Fasilitasi Sesi Consultation & VIP Investor Concierge',
        'Eskalasi Otomatis Berkas ke Bidang Data'
      ],
      outputs: [
        'Dokumen Registrasi LOI Terverifikasi',
        'Jadwal Tentatif Site Visit & Field Survey',
        'Tiket Handover Lintas Bidang #INV-2026'
      ],
      kpi: 'SLA Respon < 24 Jam'
    },
    {
      id: 2,
      role: 'admin_data',
      title: 'Fase 2: Validasi Data, Supply Chain & Spasial',
      bidang: 'Bidang Perencanaan, Iklim & Data',
      officer: 'Ahmad Fauzi, S.T. (Admin Data & GIS)',
      sla: '2 - 3 Hari Kerja',
      color: 'blue',
      bgGradient: 'from-blue-500/10 to-cyan-500/5',
      borderColor: 'border-blue-500/30',
      badgeBg: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      icon: Database,
      status: 'DALAM PROSES',
      statusColor: 'text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400',
      inputs: [
        'Kebutuhan Lahan Proyek (Luas & Koordinat)',
        'Kebutuhan Bahan Baku / Neraca Komoditas (Nikel/Kakao/Kopi/Rumput Laut)',
        'Kebutuhan Tenaga Kerja & Infrastruktur Air/Listrik'
      ],
      actions: [
        'Analisis Overlay Pola Ruang RTRW & LP2B (GIS Studio)',
        'Penyusunan Matriks Supply Chain & Radius Bahan Baku',
        'Generasi Laporan Feasibility & Profil Investasi Daerah',
        'Eskalasi Pra-Validasi Spasial ke Bidang OSS'
      ],
      outputs: [
        'Peta Buffer Fitur Spasial & Polygon Rekomendasi',
        'Kajian Kelayakan Pasokan Komoditas Lokal',
        'Dossier Pra-Syarat Perizinan Spasial'
      ],
      kpi: 'SLA Kajian Spasial < 48 Jam'
    },
    {
      id: 3,
      role: 'admin_oss',
      title: 'Fase 3: Pemrosesan Perizinan & OSS-RBA',
      bidang: 'Bidang Pelayanan Perizinan (OSS)',
      officer: 'Budi Santoso, S.H. (Admin OSS)',
      sla: '3 - 5 Hari Kerja',
      color: 'indigo',
      bgGradient: 'from-indigo-500/10 to-purple-500/5',
      borderColor: 'border-indigo-500/30',
      badgeBg: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
      icon: FileCheck2,
      status: 'MENUNGGU ESKALASI',
      statusColor: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400',
      inputs: [
        'Persyaratan NIB OSS-RBA Berdasar KBLI 2020',
        'Poligon Geospasial Lahan Terverifikasi (KML/GeoJSON)',
        'Surat Pertimbangan Teknis (Pertek PUPTR / Pertanian)'
      ],
      actions: [
        'Validasi Kesesuaian KBLI Risiko Tinggi/Menengah',
        'Integrasi Terbitan PKKPR (Sistem Informasi GARTARU PUPTR)',
        'Verifikasi Rekomendasi LP2B (Dinas Pertanian)',
        'Penerbitan Sertifikat Standar / PB-UMKU'
      ],
      outputs: [
        'NIB OSS-RBA Resmi Terbit',
        'SK Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)',
        'Izin Operasional / Sertifikat Standar Komersial'
      ],
      kpi: 'SLA Perizinan OSS < 5 Hari'
    },
    {
      id: 4,
      role: 'admin_dalak',
      title: 'Fase 4: Pengawasan, Konstruksi & Debottlenecking',
      bidang: 'Bidang Pengendalian & Pengawasan (DALAK)',
      officer: 'Drs. Herman Luwu (Admin DALAK)',
      sla: 'Triwulanan & Real-Time',
      color: 'amber',
      bgGradient: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/30',
      badgeBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
      icon: Activity,
      status: 'DIJADWALKAN',
      statusColor: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
      inputs: [
        'Komitmen Target Nilai Investasi (PMA/PMDN)',
        'Laporan Kegiatan Penanaman Modal (LKPM)',
        'Isu / Laporan Hambatan Ground Check Lapangan'
      ],
      actions: [
        'Penyusunan Jadwal Pengawasan Lapangan Terpadu',
        'Fasilitasi Mediasi Konflik Lahan & Hambatan Perizinan Teknis',
        'Verifikasi Realisasi Fisik & Keuangan LKPM',
        'Pelaporan Capaian Investasi ke Kepala Dinas & Bupati'
      ],
      outputs: [
        'Berita Acara Pemeriksaan (BAP) Lapangan',
        'Sertifikat Verifikasi LKPM Triwulanan',
        'Laporan Realisasi Investasi Daerah (PMA/PMDN)'
      ],
      kpi: 'Kepatuhan LKPM 100%'
    }
  ];

  // Dinas PUPTR 4 Bidang Blueprint
  const puptrPhases = [
    {
      id: 1,
      role: 'puptr_tataruang',
      title: 'Tahap 1: Penataan Ruang & Studio GIS',
      bidang: 'Bidang Penataan Ruang dan Bina Konstruksi',
      officer: 'Tim Studio GIS & Zoning Inspector PUPTR',
      sla: '1 - 2 Hari Kerja',
      color: 'indigo',
      bgGradient: 'from-indigo-500/10 to-blue-500/5',
      borderColor: 'border-indigo-500/30',
      badgeBg: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
      icon: Compass,
      status: 'AUDIT SPASIAL',
      statusColor: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400',
      inputs: [
        'Koordinat Poligon Permohonan (WGS84 / UTM 51S)',
        'Layer Digital RTRW No. 3/2024 & Peta RDTR Luwu',
        'Data Batas Administrasi Desa, Kecamatan & Persil SHM'
      ],
      actions: [
        'Overlay Spasial Visual Studio GIS terhadap Pola Ruang',
        'Audit Topologi: Zero Self-Intersection & Buffer Sempadan',
        'Pemeriksaan Status Kesesuaian Kegiatan Pemanfaatan Ruang',
        'Penerbitan Rekomendasi Zonasi Pola Ruang'
      ],
      outputs: [
        'Peta Delineasi Pertimbangan Teknis Tata Ruang',
        'Tabel Koordinat Patok Batas Geodesi (DMS & DD)',
        'Draft Lembar Spasial Pertimbangan Teknis'
      ],
      kpi: 'Akurasi Spasial 100% (SRID 32751)'
    },
    {
      id: 2,
      role: 'puptr_binamarga',
      title: 'Tahap 2: Kajian Aksesibilitas Bina Marga',
      bidang: 'Bidang Bina Marga',
      officer: 'Tim Teknis Aksesibilitas Jalan Daerah PUPTR',
      sla: '1 Hari Kerja',
      color: 'blue',
      bgGradient: 'from-blue-500/10 to-cyan-500/5',
      borderColor: 'border-blue-500/30',
      badgeBg: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      icon: Building2,
      status: 'KAJIAN AKSES',
      statusColor: 'text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400',
      inputs: [
        'Peta Jaringan Jalan Kabupaten / Provinsi / Nasional',
        'Titik Akses Keluar-Masuk (In-Out Trase)',
        'Estimasi Beban Muatan Kendaraan Angkutan Proyek'
      ],
      actions: [
        'Verifikasi Batas Garis Sempadan Jalan (GSJ / Rumija / Ruwasja)',
        'Kajian Kelayakan Radius Tikung dan Keselamatan Lalu Lintas',
        'Pemeriksaan Jarak Aman Persil dari Jembatan dan Gorong-gorong',
        'Penetapan Syarat Teknis Akses Masuk Kendaraan'
      ],
      outputs: [
        'Rekomendasi Teknis Aksesibilitas & Rumija',
        'Penetapan Batas Garis Sempadan Bangunan (GSB Jalan)',
        'Catatan Rekomendasi Bina Marga'
      ],
      kpi: 'SLA Kajian Rumija < 24 Jam'
    },
    {
      id: 3,
      role: 'puptr_sda',
      title: 'Tahap 3: Kajian Sempadan SDA & Hidrologi',
      bidang: 'Bidang Sumber Daya Air (SDA)',
      officer: 'Tim Teknis Irigasi & Sempadan Sungai PUPTR',
      sla: '1 Hari Kerja',
      color: 'cyan',
      bgGradient: 'from-cyan-500/10 to-teal-500/5',
      borderColor: 'border-cyan-500/30',
      badgeBg: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
      icon: Droplets,
      status: 'KAJIAN HIDROLOGI',
      statusColor: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-400',
      inputs: [
        'Peta Jaringan Sungai, Kanal, dan Saluran Irigasi Teknis',
        'Peta Batas Sempadan Pantai dan Daerah Tangkapan Air (DTA)',
        'Rencana Pelepasan Air Limbah / Drainase Kawasan'
      ],
      actions: [
        'Pemeriksaan Jarak Buffer Sempadan Sungai (10m - 100m)',
        'Verifikasi Perlindungan Saluran Irigasi Pertanian',
        'Kajian Retensi Air & Pencegahan Resiko Banjir / Genangan',
        'Penetapan Syarat Sempadan Air pada Dokumen Pertek'
      ],
      outputs: [
        'Rekomendasi Batas Sempadan Sungai & Saluran Air',
        'Klausul Larangan Menutup Saluran Irigasi Teknis',
        'Peta Buffer Fitur Sempadan SDA'
      ],
      kpi: 'Perlindungan Jaringan Irigasi 100%'
    },
    {
      id: 4,
      role: 'puptr_ciptakarya',
      title: 'Tahap 4: Cipta Karya & Pengesahan Pertek',
      bidang: 'Bidang Cipta Karya & Tim Penilai Teknis (TPT)',
      officer: 'Kepala Dinas PUPTR & Tim Profesi Ahli / TPT',
      sla: '1 Hari Kerja',
      color: 'emerald',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      icon: ShieldCheck,
      status: 'FINALISASI PERTEK',
      statusColor: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
      inputs: [
        'Kompilasi Rekomendasi Tata Ruang, Bina Marga & SDA',
        'Rencana Intensitas Bangunan (KDB, KLB, KDH, GSB)',
        'Surat Permohonan PKKPR Terdaftar'
      ],
      actions: [
        'Penetapan Koefisien Tata Bangunan (KDB Maks 70%, KLB 2.8, RTH 15%)',
        'Penyusunan Berita Acara Pertimbangan Teknis (BAP-KTR) Resmi',
        'Penyematan QR-Code TTE Digital Kepala Dinas PUPTR',
        'Eskalasi Dokumen Pertek ke Meja Cetak SK PKKPR DPMPTSP'
      ],
      outputs: [
        'Berita Acara Pertimbangan Teknis (Pertek) PUPTR Resmi',
        'Peta Lampiran WebGIS Beresolusi Tinggi',
        'Dokumen Siap TTE BSRE & Diteruskan ke DPMPTSP'
      ],
      kpi: 'Penerbitan Pertek < 3 Hari Total'
    }
  ];

  // Dinas Pertanian 4 Bidang Blueprint
  const pertanianPhases = [
    {
      id: 1,
      role: 'pertanian_psp',
      title: 'Tahap 1: Verifikasi Lahan LP2B (PSP)',
      bidang: 'Bidang Prasarana, Sarana dan Perlindungan Lahan',
      officer: 'Tim Audit Spasial LP2B & Lahan Pertanian',
      sla: '1 - 2 Hari Kerja',
      color: 'emerald',
      bgGradient: 'from-emerald-500/10 to-green-500/5',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      icon: Database,
      status: 'AUDIT LP2B',
      statusColor: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
      inputs: [
        'Koordinat Poligon Permohonan (GeoJSON / KML)',
        'Peta Lahan Pertanian Pangan Berkelanjutan (LP2B)',
        'Peta Lahan Sawah Dilindungi (LSD) Kementerian ATR/BPN'
      ],
      actions: [
        'Analisis Tumpangsusun Spasial Terhadap Zona LP2B',
        'Penghitungan Luas Lahan Terpotong / Bersinggungan (m² / Ha)',
        'Pemeriksaan Jaringan Irigasi Tersier & Saluran Primer',
        'Klasifikasi Tingkat Perlindungan (LP2B Aktif / Non-LP2B)'
      ],
      outputs: [
        'Peta Delineasi Tumpang Tindih LP2B',
        'Kalkulasi Luas Persil Terdampak Alih Fungsi',
        'Draft Lembar Spasial Pertanian'
      ],
      kpi: 'Presisi Spasial LP2B 100%'
    },
    {
      id: 2,
      role: 'pertanian_pangan',
      title: 'Tahap 2: Evaluasi Tanaman Pangan & Horti',
      bidang: 'Bidang Tanaman Pangan & Hortikultura',
      officer: 'Tim Evaluasi Produksi & Ketahanan Pangan',
      sla: '1 Hari Kerja',
      color: 'amber',
      bgGradient: 'from-amber-500/10 to-yellow-500/5',
      borderColor: 'border-amber-500/30',
      badgeBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
      icon: Wheat,
      status: 'EVALUASI PRODUKSI',
      statusColor: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400',
      inputs: [
        'Data Riwayat Hasil Panen Padi / Jagung di Persil Lokasi',
        'Tingkat Kesuburan Tanah dan Indeks Pertanaman (IP)',
        'Kebutuhan Pangan Wilayah Kecamatan Setempat'
      ],
      actions: [
        'Penetapan Kelas Indeks Pertanaman (IP100 / IP200 / IP300)',
        'Estimasi Penurunan Tonase Produksi Gabah per Tahun',
        'Evaluasi Dampak Alih Fungsi Terhadap Ketahanan Pangan Luwu',
        'Pemberian Rekomendasi Kelayakan Teknis Agraria'
      ],
      outputs: [
        'Analisis Neraca Produksi Pangan Daerah',
        'Penetapan Rekomendasi Alih Fungsi / Penolakan',
        'Catatan Teknis Bidang Tanaman Pangan'
      ],
      kpi: 'SLA Kajian Pangan < 24 Jam'
    },
    {
      id: 3,
      role: 'pertanian_perkebunan',
      title: 'Tahap 3: Kesesuaian Komoditas Perkebunan',
      bidang: 'Bidang Perkebunan',
      officer: 'Tim Teknis Komoditas Unggulan Perkebunan',
      sla: '1 Hari Kerja',
      color: 'teal',
      bgGradient: 'from-teal-500/10 to-emerald-500/5',
      borderColor: 'border-teal-500/30',
      badgeBg: 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
      icon: Sprout,
      status: 'KAJIAN PERKEBUNAN',
      statusColor: 'text-teal-600 bg-teal-100 dark:bg-teal-950/60 dark:text-teal-400',
      inputs: [
        'Data Komoditas Eksisting (Kakao, Kopi, Kelapa Sawit, Cengkeh)',
        'Peta Agroklimatologi dan Kesesuaian Lahan Perkebunan',
        'Rencana Jenis Pemanfaatan Lahan Baru oleh Investor'
      ],
      actions: [
        'Verifikasi Apakah Lokasi Berada di Kawasan Sentra Kakao / Kopi',
        'Pemeriksaan Dampak Terhadap Perkebunan Rakyat Sekitar',
        'Kajian Perlindungan Tanaman Perkebunan Unggulan Daerah',
        'Penyusunan Pertimbangan Teknis Sektor Perkebunan'
      ],
      outputs: [
        'Rekomendasi Kesesuaian Agroklimat & Tanaman Perkebunan',
        'Klausul Mitigasi Dampak Perkebunan Rakyat',
        'Catatan Rekomendasi Bidang Perkebunan'
      ],
      kpi: 'Perlindungan Sentra Perkebunan Luwu'
    },
    {
      id: 4,
      role: 'pertanian_penyuluhan',
      title: 'Tahap 4: Penyuluhan, Kompensasi & BAP',
      bidang: 'Bidang Penyuluhan & Perlindungan Usaha Pertanian',
      officer: 'Kepala Dinas Pertanian & Tim Teknis BAP',
      sla: '1 Hari Kerja',
      color: 'green',
      bgGradient: 'from-green-500/10 to-emerald-500/5',
      borderColor: 'border-green-500/30',
      badgeBg: 'bg-green-500/20 text-green-700 dark:text-green-300',
      icon: FileCheck2,
      status: 'PENERBITAN BAP',
      statusColor: 'text-green-600 bg-green-100 dark:bg-green-950/60 dark:text-green-400',
      inputs: [
        'Surat Pernyataan Kesanggupan Lahan Pengganti LP2B',
        'Hasil Kajian Bidang PSP, Tanaman Pangan & Perkebunan',
        'Data Pemohon & NIB Usaha Terdaftar'
      ],
      actions: [
        'Verifikasi Lokasi & Luasan Lahan Pengganti (Rasio 1:1 atau 1:3)',
        'Penyusunan Berita Acara Rekomendasi Pelepasan LP2B (BAP Pertanian)',
        'Penyematan QR-Code TTE Digital Kepala Dinas Pertanian',
        'Eskalasi Dokumen BAP Pertanian ke Dinas PUPTR untuk BAP-PKKPR'
      ],
      outputs: [
        'Berita Acara Rekomendasi Alih Fungsi LP2B (BAP) Resmi',
        'Lampiran Peta Tumpangsusun & Koordinat Batas',
        'Dokumen Resmi Terverifikasi Siap Teruskan ke PUPTR'
      ],
      kpi: 'Penerbitan BAP < 3 Hari Total'
    }
  ];

  const phases = isPuptr ? puptrPhases : isPertanian ? pertanianPhases : dpmptspPhases;
  const currentPhase = phases.find(p => p.id === selectedPhase) || phases[0];

  const modalTitle = isPuptr 
    ? 'Sinkronisasi Alur 4 Bidang Dinas PUPTR Kabupaten Luwu'
    : isPertanian 
      ? 'Sinkronisasi Alur 4 Bidang Dinas Pertanian Kabupaten Luwu'
      : 'Sinkronisasi Alur Proses Bisnis Empat Admin Bidang DPMPTSP Luwu';

  const modalBadge = isPuptr 
    ? 'Blueprint Sistem Pertimbangan Teknis Tata Ruang PUPTR'
    : isPertanian 
      ? 'Blueprint Sistem Perlindungan Lahan LP2B Pertanian'
      : 'Blueprint Sistem Perizinan Terpadu DPMPTSP';

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        
        {/* Header Modal */}
        <div className={`px-4 pt-2.5 pb-4 sm:p-6 text-white border-b border-slate-800 shrink-0 ${
          isPuptr 
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900' 
            : isPertanian 
              ? 'bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900' 
              : 'bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900'
        }`}>
          <div className="w-10 h-1.5 rounded-full bg-slate-500/50 mx-auto mb-2.5 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2.5 sm:p-3 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-amber-300 shrink-0">
                <Layers className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-emerald-300">
                  <span className="truncate">{modalBadge}</span>
                  <span className="hidden sm:inline text-slate-400" aria-hidden="true">·</span>
                  <span className="hidden sm:inline text-slate-400 font-mono">Standar Tupoksi Pemkab Luwu</span>
                </div>
                <h2 className="text-sm sm:text-xl font-extrabold text-white tracking-tight mt-0.5 leading-snug line-clamp-2">
                  {modalTitle}
                </h2>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={onClose}
              aria-label="Tutup modal blueprint"
              className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">

          {/* Top Key Performance Metric Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 truncate">Target SLA</p>
                <p className="text-xs sm:text-base font-extrabold text-emerald-950 dark:text-emerald-100 tabular-nums truncate">{isPuptr ? '3 - 5 Hari' : isPertanian ? '3 - 4 Hari' : '6 - 10 Hari'}</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 truncate">Integrasi</p>
                <p className="text-xs sm:text-base font-extrabold text-blue-950 dark:text-blue-100 truncate">PostGIS Terpadu</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 truncate">Keabsahan</p>
                <p className="text-xs sm:text-base font-extrabold text-indigo-950 dark:text-indigo-100 truncate">TTE Digital BSrE</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-purple-600 text-white shrink-0">
                <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-purple-800 dark:text-purple-300 truncate">Transparansi</p>
                <p className="text-xs sm:text-base font-extrabold text-purple-950 dark:text-purple-100 tabular-nums truncate">100% Real-Time</p>
              </div>
            </div>
          </div>

          {/* Interactive Stepper Pipeline */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 px-1">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Alur Estafet 4 Tahapan Bidang</span>
              </h3>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Geser dan pilih fase untuk rincian tugas</span>
            </div>

            <div className="flex md:grid md:grid-cols-4 gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-1 px-1 pb-1">
              {phases.map((phase) => {
                const IconComp = phase.icon;
                const isSelected = selectedPhase === phase.id;

                return (
                  <button
                    type="button"
                    key={phase.id}
                    onClick={() => setSelectedPhase(phase.id)}
                    className={`w-[245px] sm:w-[270px] md:w-auto shrink-0 snap-start relative p-3.5 sm:p-4 rounded-xl text-left transition-colors border cursor-pointer ${
                      isSelected 
                        ? 'bg-white dark:bg-surface border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' 
                        : 'bg-white/60 dark:bg-surface/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold mb-2">
                      <span className="text-slate-600 dark:text-slate-300 tabular-nums">{phase.sla}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 truncate">{phase.status}</span>
                    </div>

                    <div className="flex items-center gap-2.5 mt-1">
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{phase.title.split(':')[1] || phase.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{phase.bidang.split('&')[0]}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Phase Deep Dive Details */}
          <div className={`p-4 sm:p-6 rounded-2xl border bg-gradient-to-br ${currentPhase.bgGradient} ${currentPhase.borderColor} space-y-4 sm:space-y-6 transition-colors`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-3.5 sm:pb-4">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-600 text-white shrink-0">
                  <currentPhase.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {currentPhase.bidang}
                    </span>
                    <span className="text-slate-400" aria-hidden="true">·</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      PIC: {currentPhase.officer}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 leading-snug">
                    {currentPhase.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Target SLA:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{currentPhase.sla}</span>
              </div>
            </div>

            {/* Three Columns: Input, Action, Output */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Input Data */}
              <div className="bg-white dark:bg-surface/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500 shrink-0" /> Input Data / Dokumen Masuk
                </h4>
                <ul className="space-y-2">
                  {currentPhase.inputs.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action & Logic */}
              <div className="bg-white dark:bg-surface/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500 shrink-0" /> Aksi &amp; Tugas Tim Teknis
                </h4>
                <ul className="space-y-2">
                  {currentPhase.actions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Output & Handover */}
              <div className="bg-white dark:bg-surface/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-500 shrink-0" /> Output &amp; Eskalasi Hasil
                </h4>
                <ul className="space-y-2">
                  {currentPhase.outputs.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <ArrowRight className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>
        </div>

        {/* Sticky Bottom Action Footer */}
        <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:px-6 sm:py-4 bg-slate-900 border-t border-slate-800 text-white shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <span className="text-[11px] sm:text-xs text-slate-300 hidden sm:inline">
            Dokumen blueprint ini mengacu pada SOP dan Tugas Pokok &amp; Fungsi OPD Pemerintah Kabupaten Luwu.
          </span>
          <button 
            type="button"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-[40px] px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors cursor-pointer text-xs whitespace-nowrap"
          >
            Tutup Blueprint
          </button>
        </div>

      </div>
    </div>
  );
};

export default FourBidangSyncWorkflowModal;
