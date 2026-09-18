import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Clock, User, Phone, Mail, Building2, 
  Sparkles, CheckCircle2, MessageSquare, ShieldCheck, 
  ArrowRight, DollarSign, FileText, Check
} from 'lucide-react';
import { Investment } from '../types';
import { formatRupiahSingkat } from '../lib/formatters';

interface FastTrackConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvestment?: Investment | null;
  isDark?: boolean;
}

export function FastTrackConsultationModal({
  isOpen,
  onClose,
  selectedInvestment,
  isDark = true,
}: FastTrackConsultationModalProps) {
  const [formData, setFormData] = useState({
    investorName: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    sector: selectedInvestment?.sector || 'PERTANIAN',
    capexRange: selectedInvestment?.investmentValue 
      ? formatRupiahSingkat(selectedInvestment.investmentValue)
      : 'Rp 10 Miliar - Rp 50 Miliar',
    consultationMode: 'daring' as 'daring' | 'tatap_muka',
    preferredDate: '',
    preferredTime: '10:00 WITA',
    agendaNotes: selectedInvestment 
      ? `Konsultasi minat investasi proyek: ${selectedInvestment.name} (Kec. ${selectedInvestment.districtId || 'Kab. Luwu'})`
      : 'Konsultasi insentif fiskal daerah dan kesesuaian tata ruang (PKKPR)',
  });

  const [registrationCode, setRegistrationCode] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `VIP-LUWU-${dateStr}-${randomSuffix}`;
    setRegistrationCode(code);
    setIsSubmitted(true);
  };

  const handleWhatsAppRedirect = () => {
    const message = encodeURIComponent(
      `Halo Front Office DPMPTSP Kabupaten Luwu,\n\n` +
      `Saya ingin konfirmasi jadwal Fast-Track Konsultasi VIP Investasi:\n` +
      `• No. Registrasi: *${registrationCode}*\n` +
      `• Nama Investor: *${formData.investorName}*\n` +
      `• Perusahaan: *${formData.companyName || '-'}*\n` +
      `• Sektor Minat: *${formData.sector}*\n` +
      `• Estimasi Nilai: *${formData.capexRange}*\n` +
      `• Moda: *${formData.consultationMode === 'daring' ? 'Daring (Zoom / GMeet)' : 'Tatap Muka di MPP Belopa'}*\n` +
      `• Tanggal & Waktu: *${formData.preferredDate || 'Segera'} pk ${formData.preferredTime}*\n` +
      `• Catatan Agenda: *${formData.agendaNotes}*\n\n` +
      `Mohon konfirmasi kesiapan Liaison Officer / Tim Teknis DPMPTSP. Terima kasih.`
    );
    window.open(`https://wa.me/6281242100000?text=${message}`, '_blank');
  };

  const handleCopyCode = () => {
    if (registrationCode) {
      navigator.clipboard.writeText(registrationCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 120, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 120, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border overflow-hidden my-0 sm:my-auto max-h-[92vh] flex flex-col ${
          isDark 
            ? 'bg-[#0b1324] border-slate-700/80 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Modal */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-sans">
                  Investor Fast-Track Consultation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  VIP DPMPTSP
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Booking konsultasi langsung dengan Tim Teknis & Front Office DPMPTSP Luwu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {isSubmitted ? (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400">
                  Registrasi Konsultasi VIP Berhasil!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  Nomor registrasi instan Anda telah diterbitkan. Tim Liaison Officer DPMPTSP Luwu siap mendampingi proses investasi Anda.
                </p>
              </div>

              {/* e-Tiket Card */}
              <div className={`w-full max-w-md p-4 rounded-2xl border text-left space-y-3 ${
                isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                  <span className="text-xs text-slate-400">Nomor Registrasi VIP</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-500 text-sm">{registrationCode}</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs transition"
                      title="Salin Kode"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Investor</span>
                    <span className="font-semibold text-slate-200">{formData.investorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Perusahaan</span>
                    <span className="font-semibold text-slate-200">{formData.companyName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sektor Minat</span>
                    <span className="font-semibold text-slate-200">{formData.sector}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Moda Konsultasi</span>
                    <span className="font-semibold text-emerald-400">
                      {formData.consultationMode === 'daring' ? 'Daring (Zoom/GMeet)' : 'Tatap Muka MPP Belopa'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-md flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleWhatsAppRedirect}
                  className="flex-1 min-h-[44px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim ke WhatsApp DPMPTSP</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Highlight Proyek Terpilih (Jika Ada) */}
              {selectedInvestment && (
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="text-xs min-w-0">
                    <span className="font-bold block truncate">Fokus Minat: {selectedInvestment.name}</span>
                    <span className="text-slate-400 text-[11px]">Kecamatan {selectedInvestment.districtId || 'Kab. Luwu'} • Est. Nilai: {formatRupiahSingkat(selectedInvestment.investmentValue)}</span>
                  </div>
                </div>
              )}

              {/* Baris 1: Nama & Perusahaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Calon Investor / Penanggung Jawab *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ir. Hendra Saputra"
                      value={formData.investorName}
                      onChange={(e) => setFormData({ ...formData, investorName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perusahaan / Institusi
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="PT / CV / Firma Investasi"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Baris 2: Kontak WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp Aktif *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="0812xxxxxxx"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email Resmi *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="investor@company.co.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Baris 3: Sektor & Rentang Rencana CAPEX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sektor Prioritas
                  </label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="PERTANIAN">Pertanian & Perkebunan (Kakao, Kopi, Kelapa Sawit)</option>
                    <option value="PERIKANAN">Perikanan & Kelautan (Rumput Laut, Bandeng)</option>
                    <option value="INDUSTRI">Industri Pengolahan & Manufaktur Hilirisasi</option>
                    <option value="PERTAMBANGAN">Pertambangan & Smelter Mineral</option>
                    <option value="PARIWISATA">Pariwisata Alam & Ekowisata</option>
                    <option value="JASA">Energi Terbarukan, Infrastruktur & Jasa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimasi Rencana Investasi (CAPEX)
                  </label>
                  <select
                    value={formData.capexRange}
                    onChange={(e) => setFormData({ ...formData, capexRange: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="Rp 1 Miliar - Rp 5 Miliar">Rp 1 Miliar - Rp 5 Miliar (Usaha Kecil/Menengah)</option>
                    <option value="Rp 5 Miliar - Rp 25 Miliar">Rp 5 Miliar - Rp 25 Miliar</option>
                    <option value="Rp 25 Miliar - Rp 100 Miliar">Rp 25 Miliar - Rp 100 Miliar (Menengah Besar)</option>
                    <option value="Diatas Rp 100 Miliar">&gt; Rp 100 Miliar (Kategori Strategis / Mega Proyek)</option>
                  </select>
                </div>
              </div>

              {/* Baris 4: Moda Konsultasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilihan Moda Konsultasi
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, consultationMode: 'daring' })}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.consultationMode === 'daring'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>💻 Video Conference Daring</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, consultationMode: 'tatap_muka' })}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.consultationMode === 'tatap_muka'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>🏢 Tatap Muka di MPP Belopa</span>
                  </button>
                </div>
              </div>

              {/* Baris 5: Jadwal Pilihan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rencana Tanggal Konsultasi
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Waktu Konsultasi (WITA)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      value={formData.preferredTime}
                      onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="09:00 WITA">09:00 WITA (Sesi Pagi I)</option>
                      <option value="10:30 WITA">10:30 WITA (Sesi Pagi II)</option>
                      <option value="13:30 WITA">13:30 WITA (Sesi Siang I)</option>
                      <option value="15:00 WITA">15:00 WITA (Sesi Siang II)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Catatan Agenda */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pokok Bahasan / Kebutuhan Data
                </label>
                <textarea
                  rows={2}
                  value={formData.agendaNotes}
                  onChange={(e) => setFormData({ ...formData, agendaNotes: e.target.value })}
                  placeholder="Sebutkan hal khusus yang ingin dikonsultasikan (misal: syarat PKKPR, skema insentif daerah, ketersediaan lahan, dll)..."
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-105 text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Kirim Registrasi Konsultasi VIP & Dapatkan Nomor Registrasi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
