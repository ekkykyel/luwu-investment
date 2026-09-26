import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  X, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Compass, 
  Send, 
  History,
  Lock
} from 'lucide-react';
import Swal from 'sweetalert2';
import { recordSpatialOverride, getSpatialOverrides, SpatialOverrideRecord } from '../../utils/spatialOverridesService';

interface ConflictResolutionToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicantName: string;
  companyName: string;
  nibNik: string;
  districtName: string;
  villageName: string;
  detectedConflictType?: 'LP2B_OVERLAP' | 'LAHAN_BASAH' | 'SEPADAN_SUNGAI' | 'KAWASAN_HUTAN' | 'MANGROVE' | 'TAMBAK' | 'LAINNYA';
  detectedOverlapSqm?: number;
  detectedOverlapHa?: number;
  existingBapNumber?: string;
  onOverrideSuccess?: (justification: string, bapNum?: string) => void;
}

export const ConflictResolutionToolModal: React.FC<ConflictResolutionToolModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  applicantName,
  companyName,
  nibNik,
  districtName,
  villageName,
  detectedConflictType = 'LP2B_OVERLAP',
  detectedOverlapSqm = 12500,
  detectedOverlapHa = 1.25,
  existingBapNumber = '',
  onOverrideSuccess
}) => {
  const [conflictType, setConflictType] = useState<SpatialOverrideRecord['conflict_type']>(detectedConflictType);
  const [overlapSqm, setOverlapSqm] = useState<number>(detectedOverlapSqm);
  const [overlapHa, setOverlapHa] = useState<number>(detectedOverlapHa);
  const [bapReferenceNo, setBapReferenceNo] = useState<string>(existingBapNumber || `BA/DISTAN/2026/${Math.floor(100 + Math.random() * 900)}`);
  const [justification, setJustification] = useState<string>(
    `Berdasarkan pertimbangan teknis tata ruang dan Berita Acara Alih Fungsi Lahan Dinas Pertanian, lokasi seluas ${detectedOverlapHa} Ha berada pada zona pengembangan budi daya terpadu dengan kewajiban pemohon memenuhi Koefisien Daerah Hijau (KDH) min. 30%.`
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [overrideHistory, setOverrideHistory] = useState<SpatialOverrideRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Sync state on modal open
  useEffect(() => {
    if (isOpen && applicationId) {
      setConflictType(detectedConflictType);
      setOverlapSqm(detectedOverlapSqm);
      setOverlapHa(detectedOverlapHa);
      if (existingBapNumber) setBapReferenceNo(existingBapNumber);
      
      // Load history
      setIsLoadingHistory(true);
      getSpatialOverrides(applicationId)
        .then(history => setOverrideHistory(history))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [isOpen, applicationId, detectedConflictType, detectedOverlapSqm, detectedOverlapHa, existingBapNumber]);

  if (!isOpen) return null;

  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Justification Wajib Diisi',
        text: 'Harap berikan alasan tertulis dan pertimbangan teknis keputusan override.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordSpatialOverride({
        pkkpr_id: applicationId,
        conflict_type: conflictType,
        overlap_area_sqm: overlapSqm,
        overlap_area_ha: overlapHa,
        justification: justification.trim(),
        bap_reference_no: bapReferenceNo.trim(),
        overridden_by_name: 'Admin Dinas PUPTR / Kepala Dinas'
      });

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Spatial Conflict Override Berhasil Ditentukan! 🛡️',
          text: `Diskresi teknis dicatat resmi di database Supabase (spatial_overrides) dengan Nomor BAP: ${bapReferenceNo}`,
          confirmButtonColor: '#10b981'
        });

        if (onOverrideSuccess) {
          onOverrideSuccess(justification.trim(), bapReferenceNo.trim());
        }
        onClose();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Override',
        text: err.message || 'Terjadi kesalahan sistem saat mencatat override spasial.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <ShieldAlert className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  Conflict Resolution Tool (Spatial Override)
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-amber-400 text-slate-950">
                  RLS Protected
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium">
                Pencatatan Diskresi Teknis &amp; Berita Acara Pertimbangan Spasial (`spatial_overrides`)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100">
          {/* Target Application Info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {companyName} ({applicantName})
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                NIB/NIK: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{nibNik}</strong> | Lokasi: Kec. {districtName}, Desa {villageName}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold shrink-0">
              ID: {applicationId}
            </div>
          </div>

          {/* Form Entry */}
          <form onSubmit={handleSubmitOverride} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Conflict Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  Kategori Konflik Layer Spasial
                </label>
                <select
                  value={conflictType}
                  onChange={(e) => setConflictType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="LP2B_OVERLAP">🌾 Sawah LP2B / Lahan Pertanian</option>
                  <option value="LAHAN_BASAH">🌊 Lahan Basah / Irigasi Teknis</option>
                  <option value="KAWASAN_HUTAN">🌲 Kawasan Hutan / Hutan Lindung</option>
                  <option value="MANGROVE">🌿 Kawasan Mangrove &amp; Pesisir</option>
                  <option value="TAMBAK">🐟 Kawasan Tambak &amp; Budidaya Air</option>
                  <option value="SEPADAN_SUNGAI">🏞️ Sempadan Sungai / Danau</option>
                  <option value="LAINNYA">⚠️ Konflik Tata Ruang Lainnya</option>
                </select>
              </div>

              {/* BAP Reference Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  Nomor BAP / Rekomendasi Teknis
                </label>
                <input
                  type="text"
                  required
                  value={bapReferenceNo}
                  onChange={(e) => setBapReferenceNo(e.target.value)}
                  placeholder="Contoh: BA/DISTAN/2026/089"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Area Turf.js Display */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <div className="font-extrabold text-amber-800 dark:text-amber-300">
                    Turf.js Calculated Overlap Area
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Luas area irisan fisik yang disetujui untuk di-override.
                  </div>
                </div>
              </div>
              <div className="text-right font-mono shrink-0">
                <div className="text-sm font-black text-amber-700 dark:text-amber-300">
                  {overlapHa} Ha
                </div>
                <div className="text-[10px] text-slate-500">
                  ({overlapSqm.toLocaleString('id-ID')} m²)
                </div>
              </div>
            </div>

            {/* Written Justification */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Alasan &amp; Pertimbangan Teknis Keputusan (Justification)
                </span>
                <span className="text-[10px] text-rose-500 font-bold">*Wajib Diisi</span>
              </label>
              <textarea
                rows={4}
                required
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Tuliskan pertimbangan teknis dasar hukum keputusan override (misal: Sesuai BAP Dinas Pertanian No. BA/DISTAN/2026/089 dengan kewajiban penyediaan lahan pengganti LP2B)..."
                className="w-full p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-sans leading-relaxed focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Simpan &amp; Otorisasi Override Spasial (BAP Verified)</span>
              </button>
            </div>
          </form>

          {/* Override History Logs */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              Jejak Audit Spatial Overrides (`spatial_overrides`)
            </h4>

            {isLoadingHistory ? (
              <div className="text-[11px] text-slate-500 py-2 text-center">Memuat riwayat audit...</div>
            ) : overrideHistory.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center">
                Belum ada rekaman override spasial untuk permohonan ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {overrideHistory.map((rec, idx) => (
                  <div key={rec.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                        [{rec.conflict_type}] • BAP: {rec.bap_reference_no || '-'}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {rec.created_at ? new Date(rec.created_at).toLocaleString('id-ID') : 'Baru Saja'}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11.5px] leading-snug">
                      {rec.justification}
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                      <span>Oleh: <strong>{rec.overridden_by_name || 'Admin'}</strong></span>
                      <span>• Area: <strong>{rec.overlap_area_ha || 0} Ha</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
