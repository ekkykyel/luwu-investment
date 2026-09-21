import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BellRing, 
  HelpCircle, 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  UserCheck, 
  Laptop, 
  Building2, 
  Printer, 
  Accessibility, 
  FileQuestion,
  Headphones
} from 'lucide-react';
import { mppService } from '../../services/mppService';
import { MppFoSourceType } from '../../types/mpp';

interface MppFoHelpTriggerButtonProps {
  sourceType: MppFoSourceType | 'layanan_mandiri' | 'gerai_tenant' | 'kiosk' | 'tenant' | 'general' | 'inklusi' | 'lobby';
  sourceName: string; // e.g. "Kiosk 1 (Lobby Utama)", "Gerai Disdukcapil (Loket 01)"
  className?: string;
  variant?: 'floating' | 'button' | 'compact' | 'emergency';
  onSuccess?: () => void;
}

const COMMON_ISSUES = [
  { id: 'kertas_habis', label: 'Kertas / Printer Habis / Macet', icon: Printer },
  { id: 'bantuan_disabilitas', label: 'Pendampingan Disabilitas / Lansia', icon: Accessibility },
  { id: 'bantuan_nik', label: 'Warga Mengalami Kendala NIK / Berkas', icon: FileQuestion },
  { id: 'kendala_sistem', label: 'Kendala Sistem / Jaringan Layanan', icon: Laptop },
  { id: 'konsultasi_khusus', label: 'Butuh Kehadiran Petugas FO / Konsultasi', icon: Headphones },
];

export function MppFoHelpTriggerButton({
  sourceType,
  sourceName,
  className = '',
  variant = 'button',
  onSuccess
}: MppFoHelpTriggerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const issueText = COMMON_ISSUES.find(i => i.id === selectedIssue)?.label;
    const finalNotes = [issueText, customNotes.trim()].filter(Boolean).join(' - ') || 'Permintaan Bantuan Cepat';

    try {
      const res = await mppService.createFoRequest({
        sourceType,
        sourceName,
        notes: finalNotes
      });

      if (res.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setIsSuccess(false);
          setIsOpen(false);
          setSelectedIssue('');
          setCustomNotes('');
        }, 3000);
      } else {
        setErrorMsg(res.error || 'Gagal mengirim sinyal bantuan');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* TRIGGER BUTTON BASED ON VARIANT */}
      {variant === 'emergency' && (
        <motion.button
          id="btn-emergency-fo-help"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/30 border border-rose-400/40 transition-all ${className}`}
        >
          <BellRing className="w-4 h-4 animate-bounce text-amber-200" />
          <span>Panggil Bantuan FO</span>
        </motion.button>
      )}

      {variant === 'floating' && (
        <motion.button
          id="btn-floating-fo-help"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-full shadow-2xl shadow-rose-900/50 border-2 border-rose-400/50 backdrop-blur-md transition-all ${className}`}
        >
          <BellRing className="w-5 h-5 animate-pulse text-amber-200" />
          <span>Panggil Front Office</span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
          </span>
        </motion.button>
      )}

      {variant === 'compact' && (
        <button
          id="btn-compact-fo-help"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 rounded-lg text-xs font-semibold transition-all ${className}`}
        >
          <BellRing className="w-3.5 h-3.5 text-rose-500" />
          <span>Bantuan FO</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          id="btn-standard-fo-help"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-95 ${className}`}
        >
          <BellRing className="w-4 h-4 text-amber-200 animate-pulse" />
          <span>Panggil Bantuan FO</span>
        </button>
      )}

      {/* POPUP MODAL DIALOG */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* MODAL HEADER */}
              <div className="px-6 py-5 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                    <BellRing className="w-6 h-6 text-amber-200 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Panggil Bantuan Petugas FO</h3>
                    <p className="text-xs text-rose-100 mt-0.5">
                      Lokasi: <span className="font-semibold text-white underline">{sourceName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="p-6">
                {isSuccess ? (
                  <div className="py-8 text-center space-y-3 animate-fade-in">
                    <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Panggilan Terkirim!</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                      Sinyal bantuan telah berdering di Command Center Front Office. Petugas resepsionis segera menuju lokasi Anda.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        Pilih Kategori Bantuan:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {COMMON_ISSUES.map((issue) => {
                          const Icon = issue.icon;
                          const isSel = selectedIssue === issue.id;
                          return (
                            <button
                              key={issue.id}
                              type="button"
                              onClick={() => setSelectedIssue(isSel ? '' : issue.id)}
                              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all text-xs ${
                                isSel
                                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200 font-bold shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSel ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                              <span className="leading-snug">{issue.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Catatan Tambahan (Opsional):
                      </label>
                      <textarea
                        rows={2}
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        placeholder="Contoh: Pemohon lansia butuh dipandu ke gerai BPN..."
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                      />
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Mengirim...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Kirim Sinyal Panggilan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
export default MppFoHelpTriggerButton;
