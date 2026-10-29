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
  'Kawasan Peruntukan Industri dan Pergudangan',
  'Kawasan Pertanian Tanaman Pangan (LP2B / Pangan Berkelanjutan)',
  'Kawasan Perkebunan dan Hortikultura',
  'Kawasan Pariwisata & Ekonomi Kreatif',
  'Kawasan Kehutanan / Hutan Lindung / Hutan Produksi',
  'Kawasan Perikanan Budidaya dan Tangkap',
  'Kawasan Pelayanan Jasa Pemerintahan & Fasilitas Publik',
  'Kawasan Transportasi dan Pelabuhan'
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

  const inputCls =
    'w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-base sm:text-xs';

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 pt-2.5 pb-3.5 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 shrink-0 space-y-2.5">
          <div className="w-10 h-1.5 rounded-full bg-slate-500/50 mx-auto sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-emerald-300 truncate">
                  Formulir Penerbitan SK PKKPR · OSS-RBA Luwu
                </div>
                <h2 className="text-sm sm:text-lg font-extrabold text-white truncate">
                  Smart Form SK Izin PKKPR DPMPTSP
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Form vs Preview Switch */}
              <div className="hidden sm:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'form' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Editor Form</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'preview' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau SK</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup form SK PKKPR"
                className="min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Segmented Control: Form vs Preview */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700 sm:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'form' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Editor Form</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'preview' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>Pratinjau SK</span>
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/50">
          {activeTab === 'preview' ? (
            <div className="w-full overflow-x-auto py-2 sm:py-4">
              <div className="min-w-[780px] flex justify-center">
                <SkPkkprDpmptspDocument data={formData} showControlBar={false} />
              </div>
            </div>
          ) : (
            <form id="smart-sk-pkkpr-form" onSubmit={handleSubmit} className="space-y-5 max-w-5xl mx-auto">
              {/* Form Section Navigation Tabs: Horizontal Scroll on Android */}
              <div className="flex items-center sm:justify-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-3 -mx-1 px-1">
                <button
                  type="button"
                  onClick={() => setFormSection('identitas')}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    formSection === 'identitas'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>1. Nomor SK &amp; Pemohon</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('referensi')}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    formSection === 'referensi'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>2. Referensi BAP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('spasial')}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    formSection === 'spasial'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>3. Spasial &amp; Intensitas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('pejabat')}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    formSection === 'pejabat'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>4. Pejabat &amp; TTE</span>
                </button>
              </div>

              {/* SECTION 1: NOMOR SK & IDENTITAS PEMOHON */}
              {formSection === 'identitas' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        Nomor SK Izin PKKPR Resmi
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nomorSkPkkpr}
                        onChange={e => handleChange('nomorSkPkkpr', e.target.value)}
                        className={`${inputCls} font-mono font-bold tabular-nums`}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Tanggal Ditetapkan SK</label>
                      <input
                        type="text"
                        value={formData.tanggalDitetapkan}
                        onChange={e => handleChange('tanggalDitetapkan', e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Jenis Permohonan (Diktum SK)</label>
                      <select
                        value={formData.jenisPermohonan}
                        onChange={e => handleChange('jenisPermohonan', e.target.value as any)}
                        className={`${inputCls} font-bold cursor-pointer`}
                      >
                        <option value="Berusaha">Berusaha (Komersial / OSS-RBA)</option>
                        <option value="Non-Berusaha">Non-Berusaha (Sosial / Keagamaan / Rumah Tinggal)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Skala Usaha / Klasifikasi Investasi</label>
                      <select
                        value={formData.skalaUsaha || ''}
                        onChange={e => handleChange('skalaUsaha', e.target.value)}
                        className={`${inputCls} cursor-pointer`}
                      >
                        <option value="">-- Pilih Skala Usaha Investor --</option>
                        {SKALA_USAHA_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Nama Perusahaan / Perorangan</label>
                      <input
                        type="text"
                        value={formData.namaPerusahaan}
                        onChange={e => handleChange('namaPerusahaan', e.target.value)}
                        className={`${inputCls} font-bold`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">NIB OSS / NIK Pemohon</label>
                      <input
                        type="text"
                        value={formData.nibOss}
                        onChange={e => handleChange('nibOss', e.target.value)}
                        className={`${inputCls} font-mono tabular-nums`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Nama Pemohon / Penanggung Jawab</label>
                      <input
                        type="text"
                        value={formData.namaPemohon}
                        onChange={e => handleChange('namaPemohon', e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Sektor Usaha OSS-RBA</label>
                      <select
                        value={formData.sektorUsaha}
                        onChange={e => handleChange('sektorUsaha', e.target.value)}
                        className={`${inputCls} cursor-pointer`}
                      >
                        {SEKTOR_USAHA_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Kode KBLI 5-Digit</label>
                      <input
                        type="text"
                        value={formData.kbliCode}
                        onChange={e => handleChange('kbliCode', e.target.value)}
                        className={`${inputCls} font-mono tabular-nums`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Kewajiban Dokumen Lingkungan</label>
                      <select
                        value={formData.dokumenLingkungan || ''}
                        onChange={e => handleChange('dokumenLingkungan', e.target.value)}
                        className={`${inputCls} font-semibold cursor-pointer`}
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
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Referensi Konsideran Rujukan OPD Teknis &amp; Forum Penataan Ruang</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nomor BAP PUPTR (Dinas PUPTR)</label>
                        <input
                          type="text"
                          value={formData.nomorBapPuptr}
                          onChange={e => handleChange('nomorBapPuptr', e.target.value)}
                          className={`${inputCls} font-mono font-bold tabular-nums`}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Tanggal BAP PUPTR</label>
                        <input
                          type="text"
                          value={formData.tanggalBapPuptr}
                          onChange={e => handleChange('tanggalBapPuptr', e.target.value)}
                          className={inputCls}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nomor BAP Pertanian (LP2B) - Opsional</label>
                        <input
                          type="text"
                          value={formData.nomorBapPertanian || ''}
                          onChange={e => handleChange('nomorBapPertanian', e.target.value)}
                          placeholder="Kosongkan jika bukan lahan pertanian LP2B"
                          className={`${inputCls} font-mono tabular-nums`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Tanggal BAP Pertanian</label>
                        <input
                          type="text"
                          value={formData.tanggalBapPertanian || ''}
                          onChange={e => handleChange('tanggalBapPertanian', e.target.value)}
                          className={inputCls}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nomor Rekomendasi Forum Penataan Ruang (FPR)</label>
                        <input
                          type="text"
                          value={formData.nomorRekomendasiFpr || ''}
                          onChange={e => handleChange('nomorRekomendasiFpr', e.target.value)}
                          placeholder="503/FPR-LUWU/2026 (Opsional)"
                          className={`${inputCls} font-mono tabular-nums`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Tanggal Rekomendasi FPR</label>
                        <input
                          type="text"
                          value={formData.tanggalRekomendasiFpr || ''}
                          onChange={e => handleChange('tanggalRekomendasiFpr', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: SPASIAL, LAHAN & INTENSITAS */}
              {formSection === 'spasial' && (
                <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Lokasi / Alamat Kegiatan</label>
                      <input
                        type="text"
                        value={formData.lokasiKegiatan}
                        onChange={e => handleChange('lokasiKegiatan', e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Kecamatan (22 Kecamatan Kab. Luwu)</label>
                      <select
                        value={formData.kecamatan}
                        onChange={e => handleChange('kecamatan', e.target.value)}
                        className={`${inputCls} font-bold cursor-pointer`}
                      >
                        {KECAMATAN_LUWU_OPTIONS.map((kec, i) => (
                          <option key={i} value={kec}>{kec}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Desa / Kelurahan</label>
                      <input
                        type="text"
                        value={formData.desaKelurahan}
                        onChange={e => handleChange('desaKelurahan', e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Rencana Pola Ruang Perda RTRW 2024-2044</label>
                      <select
                        value={formData.zonaRtrw}
                        onChange={e => handleChange('zonaRtrw', e.target.value)}
                        className={`${inputCls} font-bold cursor-pointer`}
                      >
                        {ZONA_RTRW_OPTIONS.map((z, i) => (
                          <option key={i} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Status Kepemilikan Lahan / Hak Tanah</label>
                      <select
                        value={formData.statusKepemilikanTanah}
                        onChange={e => handleChange('statusKepemilikanTanah', e.target.value)}
                        className={`${inputCls} cursor-pointer`}
                      >
                        {STATUS_TANAH_OPTIONS.map((st, i) => (
                          <option key={i} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Fungsi Bangunan Gedung</label>
                      <select
                        value={formData.fungsiBangunan}
                        onChange={e => handleChange('fungsiBangunan', e.target.value)}
                        className={`${inputCls} cursor-pointer`}
                      >
                        {FUNGSI_BANGUNAN_OPTIONS.map((f, i) => (
                          <option key={i} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Luas Lahan Permohonan Awal</label>
                      <input
                        type="text"
                        value={formData.luasLahanPermohonan}
                        onChange={e => handleChange('luasLahanPermohonan', e.target.value)}
                        className={`${inputCls} tabular-nums`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Luas Lahan Disetujui (Rekomendasi Teknis)</label>
                      <input
                        type="text"
                        value={formData.luasLahanDisetujui}
                        onChange={e => handleChange('luasLahanDisetujui', e.target.value)}
                        className={`${inputCls} font-bold text-emerald-700 dark:text-emerald-400 tabular-nums`}
                      />
                    </div>
                  </div>

                  {/* Intensitas Ruang & Bangunan */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-teal-500 shrink-0" />
                        <span>Parameter Intensitas Pemanfaatan Ruang (Diktum KEDUA)</span>
                      </h4>
                      <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono">Batas Maksimum Bangunan</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">KDB (%)</label>
                        <input
                          type="text"
                          value={formData.koefisienDasarBangunan}
                          onChange={e => handleChange('koefisienDasarBangunan', e.target.value)}
                          placeholder="60%"
                          className={`${inputCls} font-bold tabular-nums`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">KLB</label>
                        <input
                          type="text"
                          value={formData.koefisienLantaiBangunan}
                          onChange={e => handleChange('koefisienLantaiBangunan', e.target.value)}
                          placeholder="2.4"
                          className={`${inputCls} font-bold tabular-nums`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">KDH (%)</label>
                        <input
                          type="text"
                          value={formData.koefisienDaerahHijau}
                          onChange={e => handleChange('koefisienDaerahHijau', e.target.value)}
                          placeholder="20%"
                          className={`${inputCls} font-bold tabular-nums`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">GSB / GSS</label>
                        <input
                          type="text"
                          value={formData.garisSempadanBangunan}
                          onChange={e => handleChange('garisSempadanBangunan', e.target.value)}
                          placeholder="15 meter"
                          className={`${inputCls} font-bold tabular-nums`}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 space-y-1">
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">Ketinggian Bangunan</label>
                        <select
                          value={formData.ketinggianMaksimalBangunan || 'Maksimal 2 Lantai (≤ 9 Meter)'}
                          onChange={e => handleChange('ketinggianMaksimalBangunan', e.target.value)}
                          className={`${inputCls} font-bold cursor-pointer`}
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                        <span>Kewajiban &amp; Persyaratan Teknis Pemegang PKKPR (Diktum KETIGA)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => addRequirement()}
                        className="min-h-[40px] text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-300 dark:border-teal-500/40 px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>Tambah Kewajiban</span>
                      </button>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold block">
                        Rekomendasi Poin Hukum Kunci (Pilih untuk menambahkan):
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
                              className={`min-h-[38px] text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors text-left flex items-center gap-1.5 ${
                                isAlreadyAdded
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-pointer'
                              }`}
                            >
                              {isAlreadyAdded ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Plus className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
                              <span className="line-clamp-1 max-w-[260px]">{preset}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {formData.ketentuanPersyaratanTeknis?.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 text-center text-xs text-teal-600 dark:text-teal-400 font-mono font-bold tabular-nums shrink-0">{idx + 1}.</span>
                          <input
                            type="text"
                            value={req}
                            onChange={e => handleRequirementChange(idx, e.target.value)}
                            className="flex-1 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeRequirement(idx)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-rose-500 hover:text-rose-400 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0 cursor-pointer"
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
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <span>Pejabat Penandatangan SK (Kepala DPMPTSP Kab. Luwu)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nama Kepala Dinas</label>
                        <input
                          type="text"
                          value={formData.kadisNama}
                          onChange={e => handleChange('kadisNama', e.target.value)}
                          className={`${inputCls} font-bold`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">NIP Kepala Dinas</label>
                        <input
                          type="text"
                          value={formData.kadisNip}
                          onChange={e => handleChange('kadisNip', e.target.value)}
                          className={`${inputCls} font-mono tabular-nums`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Pangkat / Golongan Kadis</label>
                        <select
                          value={formData.kadisPangkatGolongan}
                          onChange={e => handleChange('kadisPangkatGolongan', e.target.value)}
                          className={`${inputCls} cursor-pointer`}
                        >
                          {PANGKAT_GOLONGAN_OPTIONS.map((pg, i) => (
                            <option key={i} value={pg}>{pg}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Masa Berlaku SK PKKPR (Diktum KEEMPAT)</label>
                        <select
                          value={formData.masaBerlakuTahun}
                          onChange={e => handleChange('masaBerlakuTahun', parseInt(e.target.value) || 3)}
                          className={`${inputCls} font-bold cursor-pointer`}
                        >
                          <option value={3}>3 (Tiga) Tahun - Standar OSS-RBA &amp; RTRW</option>
                          <option value={5}>5 (Lima) Tahun - Kegiatan Non-Berusaha</option>
                          <option value={10}>10 (Sepuluh) Tahun - Proyek Strategis Daerah</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Sertifikasi &amp; Tanda Tangan Elektronik BSrE BSSN</label>
                        <div className="p-4 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/30 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <QrCode className="w-7 h-7 text-teal-600 dark:text-teal-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">Tandatangani Elektronik (TTE Sah BSrE)</div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                Menyematkan Kode QR Verifikasi BSrE resmi pada Blok Pengesahan Kepala DPMPTSP
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 p-1">
                            <input
                              type="checkbox"
                              checked={Boolean(formData.isTteSigned)}
                              onChange={e => handleChange('isTteSigned', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Sticky Bottom Action Footer */}
        <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'preview' ? 'form' : 'preview')}
              className="hidden sm:inline-flex min-h-[40px] px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-500/30 rounded-xl font-bold text-xs items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>{activeTab === 'preview' ? 'Kembali ke Form' : 'Cek Pratinjau SK'}</span>
            </button>

            <button
              type="submit"
              form="smart-sk-pkkpr-form"
              onClick={activeTab === 'preview' ? () => onSave(formData) : undefined}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[40px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Terbitkan SK'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
