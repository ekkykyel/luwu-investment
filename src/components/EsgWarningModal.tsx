import React, { useState, useEffect } from 'react';
import { ShieldAlert, Scale, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export interface OverrideData {
  documentNumber: string;
  justification: string;
}

interface EsgWarningModalProps {
  isOpen: boolean;
  message?: string;
  onCancel: () => void;
  onConfirm: (overrideData?: OverrideData) => void | Promise<void>;
}

export const EsgWarningModal: React.FC<EsgWarningModalProps> = ({
  isOpen,
  message,
  onCancel,
  onConfirm,
}) => {
  const [viewMode, setViewMode] = useState<'WARNING' | 'AUTHORIZATION'>('WARNING');
  const [documentNumber, setDocumentNumber] = useState('');
  const [justification, setJustification] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setViewMode('WARNING');
      setDocumentNumber('');
      setJustification('');
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuthorizationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber.trim() || !justification.trim()) {
      setValidationError('Nomor Dokumen PKKPR dan Justifikasi Otorisasi wajib diisi untuk audit trail.');
      return;
    }
    setValidationError(null);
    onConfirm({
      documentNumber: documentNumber.trim(),
      justification: justification.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {viewMode === 'WARNING' ? (
          <>
            {/* Icon Header */}
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4 text-amber-500 shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center font-display">
              Peringatan ESG &amp; Tata Ruang
            </h3>

            {/* Message */}
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 leading-relaxed text-balance">
              {message || 'Lokasi proyek terdeteksi berada di dalam Kawasan Lindung Setempat. Menyimpan data ini berisiko melanggar regulasi tata ruang daerah.'}
            </p>

            {/* Audit warning banner */}
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Setiap bentuk pengecualian tata ruang wajib memiliki persetujuan formal dan dicatat ke dalam audit trail database Pemkab Luwu.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 w-full mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="w-full min-h-[48px] py-3.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center text-sm"
              >
                Batal &amp; Revisi Lokasi
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setViewMode('AUTHORIZATION');
                }}
                className="w-full min-h-[48px] py-3.5 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 font-bold rounded-xl transition-all flex items-center justify-center text-sm"
              >
                Legitimasi via Persetujuan Pemkab
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleAuthorizationSubmit} className="space-y-4">
            {/* Header for Authorization */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Otorisasi Khusus &amp; Audit Trail
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Legitimasi Persetujuan Pemkab Luwu
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Silakan lengkapi nomor dokumen persetujuan PKKPR dan justifikasi kewenangan untuk memvalidasi otorisasi lokasi ini.
            </p>

            {validationError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Form Input 1: Nomor Dokumen PKKPR / Dasar Hukum */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nomor Dokumen PKKPR / Dasar Hukum <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={documentNumber}
                onChange={(e) => {
                  setDocumentNumber(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Contoh: 503/042/PKKPR/DPMPTSP/2026"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Form Input 2: Justifikasi Otorisasi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Justifikasi Otorisasi <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={justification}
                onChange={(e) => {
                  setJustification(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Jelaskan pertimbangan kewenangan, diskresi, atau regulasi daerah yang melandasi legitimasi lokasi proyek..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full min-h-[48px] py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Otorisasi &amp; Simpan Proyek
              </button>

              <button
                type="button"
                onClick={() => setViewMode('WARNING')}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Peringatan
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default EsgWarningModal;
