import React, { useState } from 'react';
import { 
  X, 
  Save, 
  FileText, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Printer, 
  Layers, 
  MapPin, 
  Calendar, 
  UserCheck,
  QrCode,
  Plus,
  HelpCircle,
  Briefcase,
  FileCheck2,
  TreePine,
  Check
} from 'lucide-react';
import { SkPkkprDpmptspData, SkPkkprDpmptspDocument } from '../documents/SkPkkprDpmptspDocument';

export interface SmartFormSkPkkprModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: SkPkkprDpmptspData;
  onSave: (updatedData: SkPkkprDpmptspData) => Promise<void>;
  isSubmitting?: boolean;
}

// Opsi Pilihan Terstandar untuk Meminimalisir Kesalahan Admin DPMPTSP
const KECAMATAN_LUWU_OPTIONS = [
  'Belopa',
  'Belopa Utara',
  'Bua',
  'Bua Ponrang',
  'Ponrang',
  'Ponrang Selatan',
  'Larompong',
  'Larompong Selatan',
  'Suli',
  'Suli Barat',
  'Bajo',
  'Bajo Barat',
  'Latimojong',
  'Basse Sangtempe (Bastem)',
  'Basse Sangtempe Utara (Bastem Utara)',
  'Walenrang',
  'Walenrang Timur',
  'Walenrang Utara',
  'Walenrang Barat',
  'Lamasi',
  'Lamasi Timur',
  'Kamanre'
];

const SEKTOR_USAHA_OPTIONS = [
  'Sektor Perindustrian & Manufaktur',
  'Sektor Perdagangan, Hotel & Restoran',
  'Sektor Pertanian, Perkebunan & Peternakan',
  'Sektor Kelautan, Perikanan & Pengolahan Hasil Laut',
  'Sektor Energi & Sumber Daya Mineral (ESDM / Tambang)',
  'Sektor Perhubungan, Transportasi & Logistik',
  'Sektor Pariwisata, Kebudayaan & Ekonomi Kreatif',
  'Sektor Pekerjaan Umum, Perumahan & Infrastruktur',
  'Sektor Kesehatan, Farmasi & Pelayanan Sosial',
  'Sektor Pendidikan & Keagamaan'
];

const SKALA_USAHA_OPTIONS = [
  'Usaha Mikro (Modal Usaha ≤ Rp 1 Miliar)',
  'Usaha Kecil (Modal Usaha > Rp 1 Miliar s.d. Rp 5 Miliar)',
  'Usaha Menengah (Modal Usaha > Rp 5 Miliar s.d. Rp 10 Miliar)',
  'Usaha Besar / PMDN (Modal Usaha > Rp 10 Miliar)',
  'Penanaman Modal Asing (PMA)',
  'Non-Komersial / Proyek Pemerintah / Fasilitas Publik'
];

const STATUS_TANAH_OPTIONS = [
  'Sertipikat Hak Milik (SHM)',
  'Sertipikat Hak Guna Bangunan (HGB)',
  'Sertipikat Hak Guna Usaha (HGU)',
  'Hak Pakai / Tanah Negara',
  'Akta Jual Beli (AJB) / Girik / SKT Desa',
  'Perjanjian Sewa / Kerja Sama Pemanfaatan Lahan'
];

const ZONA_RTRW_OPTIONS = [
  'Kawasan Perumahan / Permukiman Kepadatan Sedang',
  'Kawasan Perumahan / Permukiman Kepadatan Tinggi',
  'Kawasan Perdagangan dan Jasa',
  'Kawasan Industri dan Pergudangan (KIP Bua)',
  'Kawasan Pertanian Tanaman Pangan (LP2B / Pangan Berkelanjutan)',
  'Kawasan Perkebunan dan Hortikultura (Kopi Bastem / Kakao Latimojong)',
  'Kawasan Pariwisata & Ekonomi Kreatif',
  'Kawasan Kehutanan / Hutan Lindung / Hutan Produksi',
  'Kawasan Perikanan Budidaya dan Tangkap',
  'Kawasan Pelayanan Jasa Pemerintahan & Fasilitas Publik',
  'Kawasan Transportasi, Pelabuhan & Hub Logistik Bua'
];

const DOKUMEN_LINGKUNGAN_OPTIONS = [
  'Surat Pernyataan Kesanggupan Pengelolaan dan Pemantauan Lingkungan Hidup (SPPL)',
  'Dokumen Upaya Pengelolaan Lingkungan & Pemantauan Lingkungan (UKL-UPL)',
  'Dokumen Analisis Mengenai Dampak Lingkungan Hidup (AMDAL)',
  'Bebas Dokumen Lingkungan Khusus (Izin Skala Mikro)'
];

const KETINGGIAN_BANGUNAN_OPTIONS = [
  'Maksimal 1 Lantai (≤ 5 Meter)',
  'Maksimal 2 Lantai (≤ 9 Meter)',
  'Maksimal 3 Lantai (≤ 13 Meter)',
  'Maksimal 4 Lantai (≤ 17 Meter)',
  'Sesuai Standar Bangunan Industri / Fasilitas Khusus'
];

const FUNGSI_BANGUNAN_OPTIONS = [
  'Bangunan Gedung Komersial / Perdagangan & Jasa',
  'Bangunan Gedung Industri & Pergudangan',
  'Bangunan Gedung Perumahan / Permukiman',
  'Bangunan Gedung Fasilitas Umum & Sosial',
  'Bangunan Pengolahan Tani & Hasil Laut',
  'Infrastruktur Perhubungan & Logistik Hub'
];

const PANGKAT_GOLONGAN_OPTIONS = [
  'Pembina Utama Muda (IV/c)',
  'Pembina Tingkat I (IV/b)',
  'Pembina (IV/a)',
  'Penata Tingkat I (III/d)'
];

const PRESET_KEWAJIBAN_LIST = [
  'Mematuhi seluruh ketentuan persyaratan teknis bangunan gedung dan tata ruang sesuai Perda RTRW Kab. Luwu No. 3 Tahun 2024;',
  'Mengurus dokumen perizinan lingkungan lanjutan (AMDAL/UKL-UPL/SPPL) dan Persetujuan Bangunan Gedung (PBG);',
  'Penyediaan fasilitas parkir internal dan area bongkar muat di luar badan jalan (RTIJ);',
  'Penyediaan kolam retensi / biopori resapan air hujan minimal 20% dari luas lahan;',
  'Wajib menyediakan Ruang Terbuka Hijau (RTH) minimal 20% dari total luas persil;',
  'Wajib menjaga jarak bebas samping dan belakang bangunan minimal 2 meter dari batas persil;',
  'Pemasangan instalasi pengolahan air limbah (IPAL) terkontrol sebelum dibuang ke saluran kota;',
  'Menyediakan sarana aksesibilitas bagi penyandang disabilitas dan jalur evakuasi bencana;',
  'Tidak memindahtangankan dokumen SK PKKPR ini kepada pihak lain tanpa persetujuan tertulis dari Pemkab Luwu.'
];

export const SmartFormSkPkkprModal: React.FC<SmartFormSkPkkprModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<SkPkkprDpmptspData>(initialData);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [formSection, setFormSection] = useState<'identitas' | 'referensi' | 'spasial' | 'pejabat'>('identitas');

  if (!isOpen) return null;

  const handleChange = (field: keyof SkPkkprDpmptspData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRequirementChange = (index: number, text: string) => {
    const updated = [...(formData.ketentuanPersyaratanTeknis || [])];
    updated[index] = text;
    setFormData(prev => ({ ...prev, ketentuanPersyaratanTeknis: updated }));
  };

  const addRequirement = (textToAdd?: string) => {
    const defaultText = textToAdd || 'Ketentuan teknis tambahan sesuai Perda RTRW Kabupaten Luwu.';
    setFormData(prev => {
      const current = prev.ketentuanPersyaratanTeknis || [];
      if (current.includes(defaultText)) return prev;
      return {
        ...prev,
        ketentuanPersyaratanTeknis: [...current, defaultText]
      };
    });
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ketentuanPersyaratanTeknis: (prev.ketentuanPersyaratanTeknis || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Smart Form SK Izin PKKPR DPMPTSP
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                  OSS-RBA LUWU
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kustomisasi Naskah SK, Konsideran, Diktum Memutuskian &amp; Parameter Hukum Produk Tetap
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Form vs Preview */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'form' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Editor Form
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'preview' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Pratinjau Dokumen SK
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-950/50">
          {activeTab === 'preview' ? (
            <div className="w-full flex justify-center py-4">
              <SkPkkprDpmptspDocument data={formData} showControlBar={false} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
              {/* Form Section Navigation Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-800 pb-4">
                <button
                  type="button"
                  onClick={() => setFormSection('identitas')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    formSection === 'identitas'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                      : 'text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  1. Nomor SK &amp; Pemohon
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('referensi')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    formSection === 'referensi'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                      : 'text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  2. Referensi BAP &amp; Rekomendasi
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('spasial')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    formSection === 'spasial'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                      : 'text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  3. Spasial, Lahan &amp; Intensitas
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('pejabat')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    formSection === 'pejabat'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                      : 'text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  4. Pejabat, Masa Berlaku &amp; TTE
                </button>
              </div>

              {/* SECTION 1: NOMOR SK & IDENTITAS PEMOHON */}
              {formSection === 'identitas' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nomor SK */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        Nomor SK Izin PKKPR Official
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nomorSkPkkpr}
                        onChange={e => handleChange('nomorSkPkkpr', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-teal-300 font-mono font-bold focus:border-teal-500 outline-none"
                        required
                      />
                    </div>

                    {/* Tanggal Ditetapkan */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Tanggal Ditetapkan SK</label>
                      <input
                        type="text"
                        value={formData.tanggalDitetapkan}
                        onChange={e => handleChange('tanggalDitetapkan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    {/* Jenis Permohonan */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Jenis Permohonan (Diktum SK)</label>
                      <select
                        value={formData.jenisPermohonan}
                        onChange={e => handleChange('jenisPermohonan', e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-teal-300 font-bold focus:border-teal-500 outline-none cursor-pointer"
                      >
                        <option value="Berusaha">Berusaha (Komersial / OSS-RBA)</option>
                        <option value="Non-Berusaha">Non-Berusaha (Sosial / Keagamaan / Rumah Tinggal)</option>
                      </select>
                    </div>

                    {/* Skala Usaha Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Skala Usaha / Klasifikasi Investasi ✨</label>
                      <select
                        value={formData.skalaUsaha || ''}
                        onChange={e => handleChange('skalaUsaha', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none cursor-pointer"
                      >
                        <option value="">-- Pilih Skala Usaha Investor --</option>
                        {SKALA_USAHA_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Nama Perusahaan */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Nama Perusahaan / Perorangan</label>
                      <input
                        type="text"
                        value={formData.namaPerusahaan}
                        onChange={e => handleChange('namaPerusahaan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:border-teal-500 outline-none"
                      />
                    </div>

                    {/* NIB / NIK */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">NIB OSS / NIK Pemohon</label>
                      <input
                        type="text"
                        value={formData.nibOss}
                        onChange={e => handleChange('nibOss', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:border-teal-500 outline-none"
                      />
                    </div>

                    {/* Nama Pemohon */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Nama Pemohon / Penanggung Jawab</label>
                      <input
                        type="text"
                        value={formData.namaPemohon}
                        onChange={e => handleChange('namaPemohon', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    {/* Sektor Usaha Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Sektor Usaha OSS-RBA (Dropdown) ✨</label>
                      <select
                        value={formData.sektorUsaha}
                        onChange={e => handleChange('sektorUsaha', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none cursor-pointer"
                      >
                        {SEKTOR_USAHA_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Kode KBLI */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Kode KBLI 5-Digit</label>
                      <input
                        type="text"
                        value={formData.kbliCode}
                        onChange={e => handleChange('kbliCode', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:border-teal-500 outline-none"
                      />
                    </div>

                    {/* Dokumen Lingkungan Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Kewajiban Dokumen Lingkungan (Dropdown) ✨</label>
                      <select
                        value={formData.dokumenLingkungan || ''}
                        onChange={e => handleChange('dokumenLingkungan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 font-bold focus:border-teal-500 outline-none cursor-pointer"
                      >
                        <option value="">-- Pilih Dokumen Lingkungan Wajib --</option>
                        {DOKUMEN_LINGKUNGAN_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: REFERENSI BERITA ACARA (BAP PUPTR & PERTANIAN) */}
              {formSection === 'referensi' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-500/30 space-y-4">
                    <h4 className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Referensi Konsideran Rujukan OPD Teknis &amp; Forum Penataan Ruang
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* BAP PUPTR */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Nomor BAP PUPTR (Dinas PUPTR)</label>
                        <input
                          type="text"
                          value={formData.nomorBapPuptr}
                          onChange={e => handleChange('nomorBapPuptr', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-teal-300 font-mono font-bold focus:border-teal-500 outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Tanggal BAP PUPTR</label>
                        <input
                          type="text"
                          value={formData.tanggalBapPuptr}
                          onChange={e => handleChange('tanggalBapPuptr', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                        />
                      </div>

                      {/* BAP Pertanian */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Nomor BAP Pertanian (LP2B) - Opsional</label>
                        <input
                          type="text"
                          value={formData.nomorBapPertanian || ''}
                          onChange={e => handleChange('nomorBapPertanian', e.target.value)}
                          placeholder="Kosongkan jika bukan lahan pertanian LP2B"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono focus:border-teal-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Tanggal BAP Pertanian</label>
                        <input
                          type="text"
                          value={formData.tanggalBapPertanian || ''}
                          onChange={e => handleChange('tanggalBapPertanian', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                        />
                      </div>

                      {/* Rekomendasi FPR */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Nomor Rekomendasi Forum Penataan Ruang (FPR) ✨</label>
                        <input
                          type="text"
                          value={formData.nomorRekomendasiFpr || ''}
                          onChange={e => handleChange('nomorRekomendasiFpr', e.target.value)}
                          placeholder="503/FPR-LUWU/2026 (Opsional)"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:border-teal-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Tanggal Rekomendasi FPR ✨</label>
                        <input
                          type="text"
                          value={formData.tanggalRekomendasiFpr || ''}
                          onChange={e => handleChange('tanggalRekomendasiFpr', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: SPASIAL, LAHAN & INTENSITAS */}
              {formSection === 'spasial' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Alamat */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Lokasi / Alamat Kegiatan</label>
                      <input
                        type="text"
                        value={formData.lokasiKegiatan}
                        onChange={e => handleChange('lokasiKegiatan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    {/* Kecamatan Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Kecamatan (22 Kecamatan Kab. Luwu) ✨</label>
                      <select
                        value={formData.kecamatan}
                        onChange={e => handleChange('kecamatan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-teal-300 font-bold focus:border-teal-500 outline-none cursor-pointer"
                      >
                        {KECAMATAN_LUWU_OPTIONS.map((kec, i) => (
                          <option key={i} value={kec}>{kec}</option>
                        ))}
                      </select>
                    </div>

                    {/* Desa / Kelurahan */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Desa / Kelurahan</label>
                      <input
                        type="text"
                        value={formData.desaKelurahan}
                        onChange={e => handleChange('desaKelurahan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    {/* Zona RTRW Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Rencana Pola Ruang Perda RTRW 2024-2044 ✨</label>
                      <select
                        value={formData.zonaRtrw}
                        onChange={e => handleChange('zonaRtrw', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-teal-300 font-bold focus:border-teal-500 outline-none cursor-pointer"
                      >
                        {ZONA_RTRW_OPTIONS.map((z, i) => (
                          <option key={i} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Kepemilikan Lahan Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Status Kepemilikan Lahan / Hak Tanah ✨</label>
                      <select
                        value={formData.statusKepemilikanTanah}
                        onChange={e => handleChange('statusKepemilikanTanah', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none cursor-pointer"
                      >
                        {STATUS_TANAH_OPTIONS.map((st, i) => (
                          <option key={i} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    {/* Fungsi Bangunan Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Fungsi Bangunan Gedung ✨</label>
                      <select
                        value={formData.fungsiBangunan}
                        onChange={e => handleChange('fungsiBangunan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none cursor-pointer"
                      >
                        {FUNGSI_BANGUNAN_OPTIONS.map((f, i) => (
                          <option key={i} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* Luas Permohonan */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Luas Lahan Permohonan Awal</label>
                      <input
                        type="text"
                        value={formData.luasLahanPermohonan}
                        onChange={e => handleChange('luasLahanPermohonan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    {/* Luas Disetujui */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Luas Lahan Disetujui (Rekomendasi Teknis)</label>
                      <input
                        type="text"
                        value={formData.luasLahanDisetujui}
                        onChange={e => handleChange('luasLahanDisetujui', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-bold focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Intensitas Ruang & Bangunan */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-teal-400" />
                        Parameter Intensitas Pemanfaatan Ruang (Diktum KEDUA)
                      </span>
                      <span className="text-[10px] text-teal-400/80 font-mono">Batas Maksimum Bangunan</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 font-bold">KDB (%)</label>
                        <input
                          type="text"
                          value={formData.koefisienDasarBangunan}
                          onChange={e => handleChange('koefisienDasarBangunan', e.target.value)}
                          placeholder="60%"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-bold focus:border-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-bold">KLB</label>
                        <input
                          type="text"
                          value={formData.koefisienLantaiBangunan}
                          onChange={e => handleChange('koefisienLantaiBangunan', e.target.value)}
                          placeholder="2.4"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-bold focus:border-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-bold">KDH (%)</label>
                        <input
                          type="text"
                          value={formData.koefisienDaerahHijau}
                          onChange={e => handleChange('koefisienDaerahHijau', e.target.value)}
                          placeholder="20%"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-bold focus:border-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-bold">GSB / GSS</label>
                        <input
                          type="text"
                          value={formData.garisSempadanBangunan}
                          onChange={e => handleChange('garisSempadanBangunan', e.target.value)}
                          placeholder="15 meter"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-bold focus:border-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-bold">Ketinggian Bangunan ✨</label>
                        <select
                          value={formData.ketinggianMaksimalBangunan || 'Maksimal 2 Lantai (≤ 9 Meter)'}
                          onChange={e => handleChange('ketinggianMaksimalBangunan', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-teal-300 font-bold focus:border-teal-500 outline-none cursor-pointer"
                        >
                          {KETINGGIAN_BANGUNAN_OPTIONS.map((k, i) => (
                            <option key={i} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Requirements list & Quick Presets */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        Kewajiban &amp; Persyaratan Teknis Pemegang PKKPR (Diktum KETIGA)
                      </label>
                      <button
                        type="button"
                        onClick={() => addRequirement()}
                        className="text-xs text-teal-300 bg-teal-950 hover:bg-teal-900 border border-teal-500/40 px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Kewajiban
                      </button>
                    </div>

                    {/* Preset Pills untuk Penambahan Cepat */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[11px] text-slate-400 font-bold block">
                        💡 Rekomendasi Poin Hukum Kunci (Klik untuk Menambahkan Langsung):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_KEWAJIBAN_LIST.map((preset, idx) => {
                          const isAlreadyAdded = formData.ketentuanPersyaratanTeknis?.includes(preset);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => addRequirement(preset)}
                              disabled={isAlreadyAdded}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left flex items-center gap-1 ${
                                isAlreadyAdded
                                  ? 'bg-slate-800 text-slate-500 border-slate-800 opacity-60 cursor-not-allowed'
                                  : 'bg-slate-800 hover:bg-teal-950 text-slate-300 hover:text-teal-300 border-slate-700 hover:border-teal-500'
                              }`}
                            >
                              {isAlreadyAdded ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Plus className="w-3 h-3 text-teal-400 shrink-0" />}
                              <span className="line-clamp-1 max-w-[280px]">{preset}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* List Items */}
                    <div className="space-y-2 pt-1">
                      {formData.ketentuanPersyaratanTeknis?.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 text-center text-xs text-teal-400 font-mono font-bold shrink-0">{idx + 1}.</span>
                          <input
                            type="text"
                            value={req}
                            onChange={e => handleRequirementChange(idx, e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeRequirement(idx)}
                            className="p-2 text-rose-400 hover:text-rose-300 bg-slate-900 hover:bg-slate-800 rounded-xl transition shrink-0"
                            title="Hapus Poin"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: PEJABAT PENANDATANGAN & TTE DIGITAL */}
              {formSection === 'pejabat' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h4 className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Pejabat Penandatangan SK (Kepala DPMPTSP Kab. Luwu)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nama Kadis */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Nama Kepala Dinas</label>
                        <input
                          type="text"
                          value={formData.kadisNama}
                          onChange={e => handleChange('kadisNama', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:border-teal-500 outline-none"
                        />
                      </div>

                      {/* NIP Kadis */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">NIP Kepala Dinas</label>
                        <input
                          type="text"
                          value={formData.kadisNip}
                          onChange={e => handleChange('kadisNip', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:border-teal-500 outline-none"
                        />
                      </div>

                      {/* Pangkat Dropdown */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Pangkat / Golongan Kadis (Dropdown) ✨</label>
                        <select
                          value={formData.kadisPangkatGolongan}
                          onChange={e => handleChange('kadisPangkatGolongan', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none cursor-pointer"
                        >
                          {PANGKAT_GOLONGAN_OPTIONS.map((pg, i) => (
                            <option key={i} value={pg}>{pg}</option>
                          ))}
                        </select>
                      </div>

                      {/* Masa Berlaku Dropdown */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Masa Berlaku SK PKKPR (Diktum KEEMPAT) ✨</label>
                        <select
                          value={formData.masaBerlakuTahun}
                          onChange={e => handleChange('masaBerlakuTahun', parseInt(e.target.value) || 3)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-teal-300 font-bold focus:border-teal-500 outline-none cursor-pointer"
                        >
                          <option value={3}>3 (Tiga) Tahun - Standar OSS-RBA & RTRW</option>
                          <option value={5}>5 (Lima) Tahun - Ketentuan Khusus Kegiatan Non-Berusaha</option>
                          <option value={10}>10 (Sepuluh) Tahun - Proyek Strategis Daerah</option>
                        </select>
                      </div>

                      {/* Status TTE */}
                      <div className="md:col-span-2 space-y-1 pt-2">
                        <label className="text-xs font-bold text-slate-300">Sertifikasi &amp; Tanda Tangan Elektronik BSRE BSSN</label>
                        <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <QrCode className="w-8 h-8 text-teal-400 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-white">Tandatangani Elektronik (TTE Sah BSRE)</div>
                              <div className="text-[11px] text-slate-400">
                                Menyematkan Kode QR Verifikasi BSRE resmi pada Blok Pengesahan Kepala DPMPTSP
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(formData.isTteSigned)}
                              onChange={e => handleChange('isTteSigned', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-bold text-xs transition"
                >
                  Batal
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl font-bold text-xs flex items-center gap-2 transition"
                  >
                    <Eye className="w-4 h-4" />
                    Cek Pratinjau SK
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Simpan & Diterbitkan...' : 'Simpan & Terbitkan SK PKKPR'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
