import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileCheck2,
  Wheat,
  Sprout,
  Save,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Compass,
  FileText,
  UserCheck,
  ShieldAlert,
  Layers,
  Sparkles,
  Camera,
  RefreshCw,
  Landmark,
  Building,
  Info
} from "lucide-react";
import { BapLp2bDocumentData, DEFAULT_BAP_LP2B_DATA } from "../documents/BapLp2bPertanianDocument";
import { getEffectiveMapImageUrl } from "../../utils/luwuGisMapGenerator";
import { getOpdSettings, saveOpdSettings } from "../../utils/opdSettingsStorage";
import { supabase } from "../../lib/supabaseClient";
import Swal from "sweetalert2";

export interface SmartFormPertanianModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: BapLp2bDocumentData;
  mapSnapshot?: string | null;
  onSaveData: (updatedData: BapLp2bDocumentData) => void | Promise<void>;
  onOpenFullBapPreview: (data: BapLp2bDocumentData) => void;
  onCaptureLatestSnapshot?: () => void;
}

export function SmartFormPertanianModal({
  isOpen,
  onClose,
  initialData,
  mapSnapshot,
  onSaveData,
  onOpenFullBapPreview,
  onCaptureLatestSnapshot
}: SmartFormPertanianModalProps) {
  const [formData, setFormData] = useState<BapLp2bDocumentData>(() => ({
    ...DEFAULT_BAP_LP2B_DATA,
    ...(initialData || {}),
    ...(mapSnapshot ? { petaImageUrl: mapSnapshot } : {})
  }));

  const [activeTab, setActiveTab] = useState<"pemohon" | "agraria" | "kompensasi" | "pejabat" | "geospasial">("pemohon");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Track document identifier to prevent form state clobbering on parent re-renders
  const currentDocKey = `${(initialData as any)?.id || ''}_${initialData?.nomorSurat || ''}`;
  const prevDocKeyRef = useRef(currentDocKey);

  useEffect(() => {
    if (currentDocKey !== prevDocKeyRef.current) {
      prevDocKeyRef.current = currentDocKey;
      setFormData({
        ...DEFAULT_BAP_LP2B_DATA,
        ...(initialData || {}),
        ...(mapSnapshot ? { petaImageUrl: mapSnapshot } : {})
      });
    } else if (mapSnapshot && mapSnapshot !== formData.petaImageUrl) {
      setFormData(prev => ({ ...prev, petaImageUrl: mapSnapshot }));
    }
  }, [currentDocKey, initialData, mapSnapshot]);

  if (!isOpen) return null;

  const handleGenerateDocNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = String(Math.floor(100 + Math.random() * 900));
    const isBerusaha = formData.jenisPermohonan === "Berusaha";
    const prefix = isBerusaha ? "BA-LP2B" : "BA-LP2B-NB";
    const skrPrefix = isBerusaha ? "SKR-LP2B" : "SKR-LP2B-NB";
    
    setFormData(prev => ({
      ...prev,
      nomorSurat: `520.1/${randomNum}/${prefix}/DISTAN-LW/${year}`,
      nomorSuratRekomendasi: `520.1/${randomNum}/${skrPrefix}/DISTAN-LW/${year}`
    }));
  };

  const handleSaveAndApply = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      // 1. Simpan ke Local Storage multi-key untuk kontinuitas offline & persistence
      localStorage.setItem("BAP_LP2B_SETTINGS_PERSIST", JSON.stringify(formData));
      if (formData.nomorSurat) {
        localStorage.setItem(`BAP_LP2B_${formData.nomorSurat}`, JSON.stringify(formData));
      }
      if (initialData?.nomorSurat && initialData.nomorSurat !== formData.nomorSurat) {
        localStorage.setItem(`BAP_LP2B_${initialData.nomorSurat}`, JSON.stringify(formData));
      }
      const targetAppId = formData.id || (initialData as any)?.id;
      if (targetAppId) {
        localStorage.setItem(`BAP_LP2B_${targetAppId}`, JSON.stringify(formData));
      }

      // 2. Sinkronkan Pengaturan OPD Dinas Pertanian
      try {
        const currentOpd = getOpdSettings("pertanian");
        saveOpdSettings("pertanian", {
          ...currentOpd,
          kepalaDinas: {
            ...currentOpd.kepalaDinas,
            fullName: formData.kadisNama,
            nip: formData.kadisNip,
            pangkatGolongan: formData.kadisPangkat,
            officialTitle: formData.kadisJabatan
          },
          kabidSignatory: {
            fullName: formData.kabidNama,
            nip: formData.kabidNip,
            pangkatGolongan: formData.kabidJabatan,
            officialTitle: formData.kabidJabatan
          }
        });
      } catch (opdErr) {
        console.warn("OPD settings sync warning:", opdErr);
      }

      // 3. Background non-blocking sync ke Supabase opd_settings
      if (supabase) {
        (async () => {
          try {
            await supabase.from("opd_settings").upsert(
              {
                opd_key: "pertanian",
                data_bap_lp2b: formData,
                updated_at: new Date().toISOString()
              },
              { onConflict: "opd_key" }
            );
          } catch (sbErr) {
            console.log("Background opd_settings sync note:", sbErr);
          }
        })();
      }

      // 4. Trigger Parent Callback untuk update optimis database permohonan
      if (onSaveData) {
        await onSaveData(formData);
      }

      setSaveSuccessMsg("Data Smart Form & BAP-LP2B berhasil disinkronkan ke Database!");

      // 5. Tampilkan Notifikasi Cepat & Tutup Modal Tanpa Menunggu Lama
      Swal.fire({
        icon: "success",
        title: "Formulir Berhasil Disimpan & Diterapkan! 🌾",
        html: `
          <div class="text-left text-xs space-y-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 font-sans">
            <div class="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
              <span class="font-bold text-slate-700 dark:text-emerald-200">No. Berita Acara (BA):</span>
              <code class="font-mono text-emerald-700 dark:text-emerald-300 font-bold text-xs bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg">${formData.nomorSurat}</code>
            </div>
            <div class="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
              <span class="font-bold text-slate-700 dark:text-emerald-200">No. Surat Rekomendasi (SR):</span>
              <code class="font-mono text-emerald-700 dark:text-emerald-300 font-bold text-xs bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg">${formData.nomorSuratRekomendasi}</code>
            </div>
            <div class="text-slate-700 dark:text-slate-300">
              <p><strong>Pemohon:</strong> ${formData.namaPemohon || "-"} (${formData.namaPerusahaan || "Perseorangan"})</p>
              <p><strong>Kewajiban Pengganti:</strong> ${formData.luasWajibLahanPenggantiHa || formData.luasLahanDisetujui || formData.luasLahanPermohonan} Ha (Rasio ${formData.rasioLahanPengganti})</p>
            </div>
            <p class="text-[11px] text-emerald-800 dark:text-emerald-300 pt-1 border-t border-emerald-200 dark:border-emerald-800 font-medium">
              ✅ Rekomendasi teknis alih fungsi LP2B tersimpan ke Database dan tersinkronisasi ke Dashboard Pertanian.
            </p>
          </div>
        `,
        confirmButtonColor: "#059669",
        confirmButtonText: "Kembali ke Dashboard",
        timer: 1500,
        timerProgressBar: true
      });

      // 6. Tutup modal secara otomatis
      onClose();

    } catch (err: any) {
      console.error("Error saving Smart Form:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan Data",
        text: err?.message || "Terjadi kesalahan saat menyimpan formulir rekomendasi teknis ke database.",
        confirmButtonColor: "#ef4444"
      });
      setSaveSuccessMsg("Error: Gagal menyimpan data (" + (err?.message || "Koneksi terputus") + ")");
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Header Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between border-b border-emerald-700/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-emerald-300 shadow-inner">
                <Wheat size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    Smart Form Pertanian &amp; LP2B
                  </span>
                  <span className="text-[11px] font-mono text-emerald-300">
                    {formData.nomorSurat}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Formulir Rekomendasi Teknis Alih Fungsi Lahan Pertanian (LP2B)
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateDocNumber}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
                title="Generate Nomor Dokumen Baru"
              >
                <Sparkles size={14} className="text-amber-300" />
                <span className="hidden sm:inline">No. Dokumen Otomatis</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("pemohon")}
              className={`px-4 py-2.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "pemohon"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900"
              }`}
            >
              <FileText size={15} />
              <span>1. Data Pemohon &amp; Persil</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("agraria")}
              className={`px-4 py-2.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "agraria"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900"
              }`}
            >
              <Sprout size={15} />
              <span>2. Audit Agraria &amp; LP2B</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("kompensasi")}
              className={`px-4 py-2.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "kompensasi"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900"
              }`}
            >
              <ShieldAlert size={15} />
              <span>3. Lahan Pengganti &amp; Syarat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pejabat")}
              className={`px-4 py-2.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "pejabat"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900"
              }`}
            >
              <UserCheck size={15} />
              <span>4. Pejabat &amp; Keputusan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("geospasial")}
              className={`px-4 py-2.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "geospasial"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900"
              }`}
            >
              <Compass size={15} />
              <span>5. Peta &amp; Koordinat</span>
            </button>
          </div>

          {/* Alert Success / Error Banner */}
          {saveSuccessMsg && (
            <div className="mx-6 mt-3 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Modal Tab Content Form Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 dark:text-slate-100 font-sans">
            {/* TAB 1: IDENTITAS PEMOHON & PERSIL */}
            {activeTab === "pemohon" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                    <Building size={16} className="text-emerald-600" />
                    <span>Identitas Pemohon &amp; Legalitas Persil Tanah</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Jenis Permohonan:</span>
                    <select
                      value={formData.jenisPermohonan || "Berusaha"}
                      onChange={(e) => {
                        const val = e.target.value as "Berusaha" | "Non-Berusaha";
                        setFormData(prev => ({
                          ...prev,
                          jenisPermohonan: val,
                          nomorSurat: val === "Non-Berusaha"
                            ? prev.nomorSurat.replace("BA-LP2B", "BA-LP2B-NB")
                            : prev.nomorSurat.replace("BA-LP2B-NB", "BA-LP2B")
                        }));
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                    >
                      <option value="Berusaha">Berusaha (OSS-RBA)</option>
                      <option value="Non-Berusaha">Non-Berusaha (Rumah Ibadah/Fasos)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {formData.jenisPermohonan === "Non-Berusaha" ? "NIK Pemohon (16-Digit):" : "NIB / NIK Pemohon:"}
                    </label>
                    <input
                      type="text"
                      value={formData.nibNik}
                      onChange={(e) => setFormData({ ...formData, nibNik: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Pemohon / Penanggung Jawab:</label>
                    <input
                      type="text"
                      value={formData.namaPemohon}
                      onChange={(e) => setFormData({ ...formData, namaPemohon: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {formData.jenisPermohonan === "Non-Berusaha" ? "Nama Lembaga / Panitia:" : "Nama Perusahaan / Badan Usaha:"}
                    </label>
                    <input
                      type="text"
                      value={formData.namaPerusahaan}
                      onChange={(e) => setFormData({ ...formData, namaPerusahaan: e.target.value, namaLembagaOrganisasi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Pemohon / Domisili:</label>
                    <input
                      type="text"
                      value={formData.alamatPemohon}
                      onChange={(e) => setFormData({ ...formData, alamatPemohon: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sektor Usaha &amp; KBLI:</label>
                    <input
                      type="text"
                      value={formData.sektorUsaha}
                      onChange={(e) => setFormData({ ...formData, sektorUsaha: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kecamatan:</label>
                    <input
                      type="text"
                      value={formData.kecamatan}
                      onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Desa / Kelurahan:</label>
                    <input
                      type="text"
                      value={formData.desaKelurahan}
                      onChange={(e) => setFormData({ ...formData, desaKelurahan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Luas Lahan Permohonan:</label>
                    <input
                      type="text"
                      value={formData.luasLahanPermohonan}
                      onChange={(e) => setFormData({ ...formData, luasLahanPermohonan: e.target.value, luasLahanDisetujui: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-emerald-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lokasi Rinci Pembangunan / Investasi:</label>
                    <input
                      type="text"
                      value={formData.lokasiInvestasi}
                      onChange={(e) => setFormData({ ...formData, lokasiInvestasi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bukti Penguasaan Hak Atas Tanah:</label>
                    <select
                      value={formData.buktiHakTanah}
                      onChange={(e) => setFormData({ ...formData, buktiHakTanah: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    >
                      <option value="Sertipikat Hak Milik (SHM)">Sertipikat Hak Milik (SHM)</option>
                      <option value="Sertipikat Hak Guna Bangunan (SHGB)">Sertipikat Hak Guna Bangunan (SHGB)</option>
                      <option value="Sertipikat Hak Pakai (SHP)">Sertipikat Hak Pakai (SHP)</option>
                      <option value="Sertipikat Hak Guna Usaha (SHGU)">Sertipikat Hak Guna Usaha (SHGU)</option>
                      <option value="Surat Keterangan Tanah (SKT) / Penguasaan Fisik">Surat Keterangan Tanah (SKT) / Garapan</option>
                      <option value="Akta Jual Beli (AJB) / Akta Hibah Notaris">Akta Jual Beli (AJB) / Akta Hibah</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AUDIT AGRARIA & STATUS LP2B */}
            {activeTab === "agraria" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                    <Sprout size={16} className="text-emerald-600" />
                    <span>Audit Teknis Agraria, Indeks Pertanaman &amp; Jaringan Irigasi</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Klasifikasi &amp; Tipologi Lahan Eksisting:</label>
                    <select
                      value={formData.klasifikasiLahan}
                      onChange={(e) => setFormData({ ...formData, klasifikasiLahan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
                    >
                      <option value="Lahan Pertanian Basah / Sawah Irigasi Teknis">Lahan Pertanian Basah / Sawah Irigasi Teknis</option>
                      <option value="Lahan Pertanian Basah / Sawah Irigasi Semi Teknis">Lahan Pertanian Basah / Sawah Irigasi Semi Teknis</option>
                      <option value="Lahan Pertanian Basah / Sawah Tadah Hujan">Lahan Pertanian Basah / Sawah Tadah Hujan</option>
                      <option value="Lahan Sawah Cadangan LP2B Potensial">Lahan Sawah Cadangan LP2B Potensial</option>
                      <option value="Lahan Pertanian Kering / Kebun Campuran (Kakao, Cengkeh, Kopi, Kelapa)">Lahan Pertanian Kering / Kebun Campuran (Kakao, Cengkeh, Kopi, Kelapa)</option>
                      <option value="Lahan Perkebunan Rakyat / Kelapa Sawit">Lahan Perkebunan Rakyat / Kelapa Sawit</option>
                      <option value="Lahan Tambak / Budidaya Perikanan Darat">Lahan Tambak / Budidaya Perikanan Darat</option>
                      <option value="Bukan Lahan Pertanian / Pekarangan Permukiman">Bukan Lahan Pertanian / Pekarangan Permukiman</option>
                      <option value="Lahan Kering Bukan Pertanian / Semak Belukar">Lahan Kering Bukan Pertanian / Semak Belukar</option>
                      {!["Lahan Pertanian Basah / Sawah Irigasi Teknis", "Lahan Pertanian Basah / Sawah Irigasi Semi Teknis", "Lahan Pertanian Basah / Sawah Tadah Hujan", "Lahan Sawah Cadangan LP2B Potensial", "Lahan Pertanian Kering / Kebun Campuran (Kakao, Cengkeh, Kopi, Kelapa)", "Lahan Perkebunan Rakyat / Kelapa Sawit", "Lahan Tambak / Budidaya Perikanan Darat", "Bukan Lahan Pertanian / Pekarangan Permukiman", "Lahan Kering Bukan Pertanian / Semak Belukar"].includes(formData.klasifikasiLahan) && (
                        <option value={formData.klasifikasiLahan}>{formData.klasifikasiLahan} (Kustom)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Indeks Pertanaman (IP) / Produktivitas:</label>
                    <select
                      value={formData.indeksPertanaman}
                      onChange={(e) => setFormData({ ...formData, indeksPertanaman: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
                    >
                      <option value="Kelas I (Indeks Pertanaman IP300 / Panen Padi 3x Setahun)">Kelas I (IP300 - 3 Kali Tanam)</option>
                      <option value="Kelas II (Indeks Pertanaman IP200 / Produksi Padi-Palawija)">Kelas II (IP200 - 2 Kali Tanam)</option>
                      <option value="Kelas III (Indeks Pertanaman IP100 / Panen Padi 1x Setahun)">Kelas III (IP100 - 1 Kali Tanam)</option>
                      <option value="Non-Padi / Tanaman Tahunan dan Hortikultura Perkebunan">Non-Padi / Tanaman Tahunan &amp; Hortikultura</option>
                      <option value="IP 0 (Lahan Bera / Non-Produktif / Pekarangan)">IP 0 (Lahan Bera / Non-Produktif)</option>
                      {!["Kelas I (Indeks Pertanaman IP300 / Panen Padi 3x Setahun)", "Kelas II (Indeks Pertanaman IP200 / Produksi Padi-Palawija)", "Kelas III (Indeks Pertanaman IP100 / Panen Padi 1x Setahun)", "Non-Padi / Tanaman Tahunan dan Hortikultura Perkebunan", "IP 0 (Lahan Bera / Non-Produktif / Pekarangan)"].includes(formData.indeksPertanaman) && (
                        <option value={formData.indeksPertanaman}>{formData.indeksPertanaman} (Kustom)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Kawasan LP2B:</label>
                    <select
                      value={formData.statusLp2b}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setFormData({ 
                          ...formData, 
                          statusLp2b: val,
                          keteranganLp2b: val === "NON_LP2B" 
                            ? "LOKASI BERADA DILUAR ZONA LP2B (NON-LP2B) - Bebas dari Perlindungan LP2B"
                            : `LOKASI BERSINGGUNGAN DENGAN ZONA LP2B (${formData.tumpangTindihLp2bPersen}%)`
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="LP2B_AKTIF">LP2B AKTIF (Kawasan Pertanian Pangan Utama)</option>
                      <option value="LP2B_CADANGAN">LP2B CADANGAN</option>
                      <option value="NON_LP2B">NON-LP2B (Bukan Lahan Pangan Berkelanjutan)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kondisi Ketersediaan Saluran Irigasi:</label>
                    <input
                      type="text"
                      value={formData.kondisiIrigasi}
                      onChange={(e) => setFormData({ ...formData, kondisiIrigasi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      placeholder="e.g. Tersedia Saluran Irigasi Sekunder & Tersier Berfungsi Baik"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Persentase Tumpang Tindih LP2B (%):</label>
                    <input
                      type="number"
                      value={formData.tumpangTindihLp2bPersen}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        setFormData({
                          ...formData,
                          tumpangTindihLp2bPersen: pct,
                          keteranganLp2b: pct > 0 
                            ? `LOKASI BERSINGGUNGAN DENGAN ZONA LP2B SEBESAR ${pct}% (${formData.luasTumpangTindihHa} Ha)`
                            : "LOKASI BERADA DILUAR ZONA LP2B (NON-LP2B)"
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Keterangan Resmi Audit LP2B:</label>
                    <textarea
                      rows={2}
                      value={formData.keteranganLp2b}
                      onChange={(e) => setFormData({ ...formData, keteranganLp2b: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LAHAN PENGGANTI & SYARAT */}
            {activeTab === "kompensasi" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert size={16} className="text-emerald-600" />
                    <span>Kewajiban Lahan Pengganti &amp; Syarat Pertimbangan Teknis</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rasio Kompensasi Lahan Pengganti:</label>
                    <select
                      value={formData.rasioLahanPengganti}
                      onChange={(e) => setFormData({ ...formData, rasioLahanPengganti: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
                    >
                      <option value="1:1 (Setara Luasan Bersinggungan LP2B)">1:1 (Setara Luas Bersinggungan LP2B)</option>
                      <option value="1:2 (Luas Pengganti 2x Lipat - Sawah Beririgasi Teknis)">1:2 (Dua Kali Lipat untuk Sawah Beririgasi Teknis)</option>
                      <option value="1:3 (Luas Pengganti 3x Lipat - Kawasan Inti Pangan Prioritas)">1:3 (Tiga Kali Lipat untuk Sawah Utama IP300)</option>
                      <option value="Nihil (Bebas Kewajiban Lahan Pengganti / Lahan Non-LP2B)">Nihil (Bebas Kewajiban Lahan Pengganti)</option>
                      <option value="Kompensasi Cetak Sawah Baru di Luwu (Rasio 1:1)">Kompensasi Cetak Sawah Baru di Luwu (Rasio 1:1)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Luas Wajib Pengganti (Hektar):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.luasWajibLahanPenggantiHa}
                      onChange={(e) => setFormData({ ...formData, luasWajibLahanPenggantiHa: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lokasi Usulan Lahan Pengganti:</label>
                    <select
                      value={formData.lokasiUsulanLahanPengganti}
                      onChange={(e) => setFormData({ ...formData, lokasiUsulanLahanPengganti: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer font-medium"
                    >
                      <option value="Kecamatan Bua / Kecamatan Ponrang, Kabupaten Luwu">Kecamatan Bua / Kecamatan Ponrang, Kabupaten Luwu</option>
                      <option value="Kecamatan Walenrang / Kecamatan Lamasi (Walmas), Kabupaten Luwu">Kecamatan Walenrang / Kecamatan Lamasi (Walmas), Kabupaten Luwu</option>
                      <option value="Kecamatan Belopa / Belopa Utara, Kabupaten Luwu">Kecamatan Belopa / Belopa Utara, Kabupaten Luwu</option>
                      <option value="Kecamatan Bajo / Bajo Barat, Kabupaten Luwu">Kecamatan Bajo / Bajo Barat, Kabupaten Luwu</option>
                      <option value="Kecamatan Suli / Suli Barat, Kabupaten Luwu">Kecamatan Suli / Suli Barat, Kabupaten Luwu</option>
                      <option value="Kecamatan Kamanre / Ponrang Selatan, Kabupaten Luwu">Kecamatan Kamanre / Ponrang Selatan, Kabupaten Luwu</option>
                      <option value="Kecamatan Larompong / Larompong Selatan, Kabupaten Luwu">Kecamatan Larompong / Larompong Selatan, Kabupaten Luwu</option>
                      <option value="- (Nihil / Bebas Kewajiban)">- (Nihil / Bebas Kewajiban)</option>
                      <option value="- (Tidak Bersedia Menyediakan Lahan Pengganti)">- (Tidak Bersedia Menyediakan Lahan Pengganti)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Butir-Butir Catatan &amp; Syarat Pertimbangan Teknis Pertanian:
                    </label>
                    {formData.catatanRekomendasiTeknis.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 text-right font-bold text-slate-400">{idx + 1}.</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...formData.catatanRekomendasiTeknis];
                            updated[idx] = e.target.value;
                            setFormData({ ...formData, catatanRekomendasiTeknis: updated });
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PEJABAT & KEPUTUSAN */}
            {activeTab === "pejabat" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck size={16} className="text-emerald-600" />
                    <span>Keputusan Rekomendasi &amp; Pejabat Penandatangan</span>
                  </h3>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-2">
                  <label className="block font-bold text-emerald-950 dark:text-emerald-200 text-xs">
                    STATUS KEPUTUSAN REKOMENDASI PERTANIAN (BAP-LP2B):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, statusKeputusan: "APPROVED" })}
                      className={`p-2.5 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-2 ${
                        formData.statusKeputusan === "APPROVED"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <CheckCircle2 size={16} />
                      <span>DISETUJUI (APPROVED)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, statusKeputusan: "APPROVED_WITH_CONDITIONS" })}
                      className={`p-2.5 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-2 ${
                        formData.statusKeputusan === "APPROVED_WITH_CONDITIONS"
                          ? "bg-amber-600 text-white border-amber-600 shadow-md"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <AlertCircle size={16} />
                      <span>DISETUJUI BERSYARAT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        statusKeputusan: "REJECTED",
                        nomorSurat: formData.nomorSurat.replace("BA-LP2B", "BA-TOLAK-LP2B"),
                        rejectionReason: formData.rejectionReason || "Lahan permohonan bersinggungan 100% dengan Zona Inti Lahan Pertanian Pangan Berkelanjutan (LP2B) Aktif Beririgasi Teknis Kelas I (IP300) yang dilindungi secara mutlak oleh UU No. 41/2009 dan Perda Perlindungan LP2B Kabupaten Luwu serta berpotensi memutus saluran irigasi primer pengairan persawahan masyarakat."
                      })}
                      className={`p-2.5 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-2 ${
                        formData.statusKeputusan === "REJECTED"
                          ? "bg-rose-600 text-white border-rose-600 shadow-md"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <X size={16} />
                      <span>DITOLAK (REJECTED)</span>
                    </button>
                  </div>

                  {formData.statusKeputusan === "REJECTED" && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-red-800 dark:text-red-300 font-bold text-[11px] uppercase">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle size={14} className="text-red-600" />
                          <span>Alasan &amp; Dasar Pertimbangan Penolakan BAP-LP2B</span>
                        </span>
                        <span className="text-[10px] text-red-600 font-normal">Wajib Diisi untuk Dokumen BAP Penolakan</span>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold text-[10px] mb-1">Pilih Alasan Standar Penolakan LP2B:</label>
                        <select
                          value={formData.rejectionReason || ""}
                          onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-lg text-red-900 dark:text-red-200 font-semibold cursor-pointer text-xs"
                        >
                          <option value="Lahan permohonan bersinggungan 100% dengan Zona Inti Lahan Pertanian Pangan Berkelanjutan (LP2B) Aktif Beririgasi Teknis Kelas I (IP300) yang dilindungi secara mutlak oleh UU No. 41/2009 dan Perda Perlindungan LP2B Kabupaten Luwu serta berpotensi memutus saluran irigasi primer pengairan persawahan masyarakat.">
                            1. Sawah Irigasi Teknis Primer Mutlak (IP300) &amp; Memutus Jaringan Irigasi
                          </option>
                          <option value="Pemohon tidak bersedia memenuhi kewajiban kompensasi penyediaan lahan pengganti LP2B seluas rasio yang diwajibkan peraturan perundang-undangan (Rasio 1:1 hingga 1:3).">
                            2. Tidak Memenuhi Kewajiban Kompensasi Lahan Pengganti
                          </option>
                          <option value="Rencana alih fungsi lahan mengancam kedaulatan pangan wilayah dan berada pada daerah resapan air pertanian kritis Kabupaten Luwu.">
                            3. Mengancam Kedaulatan Pangan &amp; Resapan Air Kritis
                          </option>
                          <option value="Lokasi permohonan berada dalam sengketa kepemilikan agraria dan tidak memiliki bukti hak atas tanah yang sah.">
                            4. Sengketa Kepemilikan Lahan / Legalitas Tidak Sah
                          </option>
                          {formData.rejectionReason && ![
                            "Lahan permohonan bersinggungan 100% dengan Zona Inti Lahan Pertanian Pangan Berkelanjutan (LP2B) Aktif Beririgasi Teknis Kelas I (IP300) yang dilindungi secara mutlak oleh UU No. 41/2009 dan Perda Perlindungan LP2B Kabupaten Luwu serta berpotensi memutus saluran irigasi primer pengairan persawahan masyarakat.",
                            "Pemohon tidak bersedia memenuhi kewajiban kompensasi penyediaan lahan pengganti LP2B seluas rasio yang diwajibkan peraturan perundang-undangan (Rasio 1:1 hingga 1:3).",
                            "Rencana alih fungsi lahan mengancam kedaulatan pangan wilayah dan berada pada daerah resapan air pertanian kritis Kabupaten Luwu.",
                            "Lokasi permohonan berada dalam sengketa kepemilikan agraria dan tidak memiliki bukti hak atas tanah yang sah."
                          ].includes(formData.rejectionReason) && (
                            <option value={formData.rejectionReason}>{formData.rejectionReason} (Kustom)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold text-[10px] mb-1">Rincian Narasi Alasan Penolakan (Dapat Diedit):</label>
                        <textarea
                          rows={2}
                          value={formData.rejectionReason || ""}
                          onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                          placeholder="Tuliskan uraian pertimbangan teknis penolakan rekomendasi alih fungsi LP2B..."
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-lg text-red-900 dark:text-red-200 text-xs font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-2">
                  {/* Kadis */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <span className="font-extrabold text-emerald-800 dark:text-emerald-400 block border-b pb-1">
                      1. Kepala Dinas Pertanian
                    </span>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Nama Lengkap &amp; Gelar:</label>
                      <input
                        type="text"
                        value={formData.kadisNama}
                        onChange={(e) => setFormData({ ...formData, kadisNama: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">NIP Kepala Dinas:</label>
                      <input
                        type="text"
                        value={formData.kadisNip}
                        onChange={(e) => setFormData({ ...formData, kadisNip: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Pangkat / Golongan:</label>
                      <input
                        type="text"
                        value={formData.kadisPangkat}
                        onChange={(e) => setFormData({ ...formData, kadisPangkat: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Kabid LP2B */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <span className="font-extrabold text-emerald-800 dark:text-emerald-400 block border-b pb-1">
                      2. Kepala Bidang LP2B
                    </span>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Nama Lengkap &amp; Gelar:</label>
                      <input
                        type="text"
                        value={formData.kabidNama}
                        onChange={(e) => setFormData({ ...formData, kabidNama: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">NIP Kabid:</label>
                      <input
                        type="text"
                        value={formData.kabidNip}
                        onChange={(e) => setFormData({ ...formData, kabidNip: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Jabatan Resmi:</label>
                      <input
                        type="text"
                        value={formData.kabidJabatan}
                        onChange={(e) => setFormData({ ...formData, kabidJabatan: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Kasi / Analis Spasial */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <span className="font-extrabold text-emerald-800 dark:text-emerald-400 block border-b pb-1">
                      3. Analis Spasial Lahan &amp; Irigasi
                    </span>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Nama Analis GIS:</label>
                      <input
                        type="text"
                        value={formData.analisGisNama || ""}
                        onChange={(e) => setFormData({ ...formData, analisGisNama: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">NIP Analis:</label>
                      <input
                        type="text"
                        value={formData.analisGisNip || ""}
                        onChange={(e) => setFormData({ ...formData, analisGisNip: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Kepala Seksi Lahan &amp; Irigasi:</label>
                      <input
                        type="text"
                        value={formData.kasiNama || ""}
                        onChange={(e) => setFormData({ ...formData, kasiNama: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PETA & KOORDINAT */}
            {activeTab === "geospasial" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass size={16} className="text-emerald-600" />
                    <span>Snapshot Peta Delineasi Spasial &amp; Daftar Titik Koordinat</span>
                  </h3>

                  {onCaptureLatestSnapshot && (
                    <button
                      type="button"
                      onClick={onCaptureLatestSnapshot}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Camera size={14} />
                      <span>Ambil Snapshot Peta Baru</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Map Snapshot Preview */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Pratinjau Snapshot Peta Geospasial LP2B:
                    </span>
                    <div className="h-64 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-950 relative shadow-inner flex items-center justify-center">
                      <img
                        src={getEffectiveMapImageUrl(formData.petaImageUrl, mapSnapshot, {
                          desa: formData.desaKelurahan,
                          kecamatan: formData.kecamatan,
                          pemohon: formData.namaPemohon,
                          perusahaan: formData.namaPerusahaan,
                          luas: formData.luasLahanDisetujui,
                          tipeDoc: 'LP2B',
                          nomorSurat: formData.nomorSurat,
                          koordinatPoligon: formData.koordinatPoligon,
                          statusLp2b: formData.statusLp2b
                        })}
                        alt="Snapshot Peta Pertanian"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Right: Polygon Points Summary */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Titik Koordinat Poligon WGS84 UTM Zone 51S ({formData.koordinatPoligon.length} Titik):
                    </span>
                    <div className="h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50 dark:bg-slate-950 space-y-1.5">
                      {formData.koordinatPoligon.map((pt, idx) => (
                        <div key={idx} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] flex items-center justify-between">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{pt.pointName}</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">{pt.latitudeDms}</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">{pt.longitudeDms}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenFullBapPreview(formData)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 shadow transition cursor-pointer"
              >
                <FileCheck2 size={16} />
                <span>Lihat Naskah BAP Lengkap (4 Hal)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAndApply}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSaving ? "Menyimpan Data..." : "Terapkan & Simpan ke DB"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default SmartFormPertanianModal;
