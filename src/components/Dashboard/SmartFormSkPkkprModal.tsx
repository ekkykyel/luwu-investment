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
  QrCode
} from 'lucide-react';
import { SkPkkprDpmptspData, SkPkkprDpmptspDocument } from '../documents/SkPkkprDpmptspDocument';

export interface SmartFormSkPkkprModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: SkPkkprDpmptspData;
  onSave: (updatedData: SkPkkprDpmptspData) => Promise<void>;
  isSubmitting?: boolean;
}

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

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      ketentuanPersyaratanTeknis: [
        ...(prev.ketentuanPersyaratanTeknis || []),
        'Ketentuan teknis tambahan sesuai Perda RTRW Kabupaten Luwu.'
      ]
    }));
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
                Kustomisasi Naskah SK, Konsideran, Diktum Memutuskan &amp; Parameter Teknis
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
                  2. Referensi Berita Acara (BAP)
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
                  3. Spasial &amp; Intensitas Ruang
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
                  4. Pejabat &amp; TTE Digital
                </button>
              </div>

              {/* SECTION 1: NOMOR SK & IDENTITAS PEMOHON */}
              {formSection === 'identitas' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Nomor SK Izin PKKPR Official</label>
                      <input
                        type="text"
                        value={formData.nomorSkPkkpr}
                        onChange={e => handleChange('nomorSkPkkpr', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-teal-300 font-mono font-bold focus:border-teal-500 outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Tanggal Ditetapkan SK</label>
                      <input
                        type="text"
                        value={formData.tanggalDitetapkan}
                        onChange={e => handleChange('tanggalDitetapkan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Jenis Permohonan</label>
                      <select
                        value={formData.jenisPermohonan}
                        onChange={e => handleChange('jenisPermohonan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      >
                        <option value="Berusaha">Berusaha (Komersial / OSS-RBA)</option>
                        <option value="Non-Berusaha">Non-Berusaha (Sosial / Keagamaan / Rumah Tinggal)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Nama Perusahaan / Perorangan</label>
                      <input
                        type="text"
                        value={formData.namaPerusahaan}
                        onChange={e => handleChange('namaPerusahaan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">NIB OSS / NIK Pemohon</label>
                      <input
                        type="text"
                        value={formData.nibOss}
                        onChange={e => handleChange('nibOss', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Nama Pemohon / Penanggung Jawab</label>
                      <input
                        type="text"
                        value={formData.namaPemohon}
                        onChange={e => handleChange('namaPemohon', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Sektor Usaha</label>
                      <input
                        type="text"
                        value={formData.sektorUsaha}
                        onChange={e => handleChange('sektorUsaha', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Kode KBLI</label>
                      <input
                        type="text"
                        value={formData.kbliCode}
                        onChange={e => handleChange('kbliCode', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:border-teal-500 outline-none"
                      />
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
                      Referensi Konsideran Rujukan OPD Teknis
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Nomor BAP Pertanian (LP2B) - Opsional</label>
                        <input
                          type="text"
                          value={formData.nomorBapPertanian || ''}
                          onChange={e => handleChange('nomorBapPertanian', e.target.value)}
                          placeholder="Kosongkan jika bukan lahan pertanian"
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
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: SPASIAL & INTENSITAS BANGUNAN */}
              {formSection === 'spasial' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Lokasi / Alamat Kegiatan</label>
                      <input
                        type="text"
                        value={formData.lokasiKegiatan}
                        onChange={e => handleChange('lokasiKegiatan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Desa / Kelurahan</label>
                      <input
                        type="text"
                        value={formData.desaKelurahan}
                        onChange={e => handleChange('desaKelurahan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Kecamatan</label>
                      <input
                        type="text"
                        value={formData.kecamatan}
                        onChange={e => handleChange('kecamatan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Rencana Pola Ruang RTRW</label>
                      <input
                        type="text"
                        value={formData.zonaRtrw}
                        onChange={e => handleChange('zonaRtrw', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-teal-300 font-bold focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Luas Lahan Permohonan</label>
                      <input
                        type="text"
                        value={formData.luasLahanPermohonan}
                        onChange={e => handleChange('luasLahanPermohonan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Luas Lahan Disetujui</label>
                      <input
                        type="text"
                        value={formData.luasLahanDisetujui}
                        onChange={e => handleChange('luasLahanDisetujui', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-bold focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Intensitas Ruang */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-400" />
                      Parameter Intensitas Pemanfaatan Ruang (Diktum KEDUA)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400">KDB (%)</label>
                        <input
                          type="text"
                          value={formData.koefisienDasarBangunan}
                          onChange={e => handleChange('koefisienDasarBangunan', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400">KLB</label>
                        <input
                          type="text"
                          value={formData.koefisienLantaiBangunan}
                          onChange={e => handleChange('koefisienLantaiBangunan', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400">KDH (%)</label>
                        <input
                          type="text"
                          value={formData.koefisienDaerahHijau}
                          onChange={e => handleChange('koefisienDaerahHijau', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400">GSB / GSS</label>
                        <input
                          type="text"
                          value={formData.garisSempadanBangunan}
                          onChange={e => handleChange('garisSempadanBangunan', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Requirements list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        Kewajiban &amp; Persyaratan Teknis (Diktum KETIGA)
                      </label>
                      <button
                        type="button"
                        onClick={addRequirement}
                        className="text-[11px] text-teal-400 hover:underline font-bold"
                      >
                        + Tambah Poin Kewajiban
                      </button>
                    </div>
                    {formData.ketentuanPersyaratanTeknis?.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={req}
                          onChange={e => handleRequirementChange(idx, e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeRequirement(idx)}
                          className="p-2 text-rose-400 hover:text-rose-300 bg-slate-900 hover:bg-slate-800 rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: PEJABAT PENANDATANGAN & TTE DIGITAL */}
              {formSection === 'pejabat' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <h4 className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Pejabat Penandatangan SK (Kepala DPMPTSP)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Nama Kepala Dinas</label>
                        <input
                          type="text"
                          value={formData.kadisNama}
                          onChange={e => handleChange('kadisNama', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:border-teal-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">NIP Kepala Dinas</label>
                        <input
                          type="text"
                          value={formData.kadisNip}
                          onChange={e => handleChange('kadisNip', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:border-teal-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Pangkat / Golongan</label>
                        <input
                          type="text"
                          value={formData.kadisPangkatGolongan}
                          onChange={e => handleChange('kadisPangkatGolongan', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-teal-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Status TTE / Sertifikasi BSRE</label>
                        <div className="flex items-center gap-3 pt-2">
                          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(formData.isTteSigned)}
                              onChange={e => handleChange('isTteSigned', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                            />
                            Tandatangani Elektronik (TTE Sah BSRE)
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
