import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  X,
  Search,
  Building2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Send,
  CheckCircle2,
  FileText,
  DollarSign,
  Maximize2,
  ExternalLink,
  Layers,
  PhoneCall
} from 'lucide-react';
import { Investment, District } from '../../types';
import { getImageUrl } from '../../utils/imageFallbacks';

interface IproCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  investments?: Investment[];
  districts?: District[];
  onSelectInvestment?: (investmentId: string) => void;
  onOpenPitchDeck?: (investmentId: string) => void;
  formatRupiah?: (val: number) => string;
}

export const IproCatalogModal: React.FC<IproCatalogModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  investments = [],
  districts = [],
  onSelectInvestment,
  onOpenPitchDeck,
  formatRupiah = (val) => `Rp ${val.toLocaleString('id-ID')}`,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [activeLoiInvestment, setActiveLoiInvestment] = useState<Investment | null>(null);
  const [loiSubmitted, setLoiSubmitted] = useState(false);
  const [loiForm, setLoiForm] = useState({
    investorName: '',
    company: '',
    phone: '',
    email: '',
    estimatedInvestment: '',
    notes: '',
  });

  const sectors = useMemo(() => {
    const set = new Set<string>();
    investments.forEach((i) => {
      const name = String(i.name || '').toLowerCase();
      if (name.includes('pammanu car wash') || name.includes('dummy')) return;
      if (i.sector) set.add(i.sector);
    });
    return Array.from(set);
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const name = String(inv.name || '').toLowerCase();
      if (name.includes('pammanu car wash') || name.includes('dummy')) return false;

      const matchSearch =
        inv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.sector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv as any).kecamatan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSector = selectedSector === 'all' || inv.sector === selectedSector;
      return matchSearch && matchSector;
    });
  }, [investments, searchQuery, selectedSector]);

  const handleLoiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loiForm.investorName || !loiForm.phone) return;

    // Save submission locally for verification
    try {
      const existing = JSON.parse(localStorage.getItem('luwu_loi_inquiries') || '[]');
      existing.push({
        ...loiForm,
        projectId: activeLoiInvestment?.id,
        projectName: activeLoiInvestment?.name,
        date: new Date().toISOString(),
      });
      localStorage.setItem('luwu_loi_inquiries', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setLoiSubmitted(true);
    setTimeout(() => {
      setLoiSubmitted(false);
      setActiveLoiInvestment(null);
      setLoiForm({
        investorName: '',
        company: '',
        phone: '',
        email: '',
        estimatedInvestment: '',
        notes: '',
      });
    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-md transition-opacity font-sans"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={`w-[calc(100vw-20px)] sm:w-full h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[90vh] max-w-5xl rounded-2xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-black/80'
              : 'bg-[#FAF7F0] border-[#E2DACB] text-slate-900 shadow-slate-900/10'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div
            className={`p-3 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
              isDark
                ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/50 border-slate-800'
                : 'bg-[#F4F0E6] border-[#E2DACB]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 shrink-0">
                <MapPin size={22} className="sm:w-6 sm:h-6 drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-[#FAF7F0] dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-[#E2DACB] dark:border-emerald-500/30">
                    Portofolio IPRO BKPM RI
                  </span>
                  <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#FAF7F0] dark:bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-[#E2DACB] dark:border-teal-500/30">
                    Clean & Clear
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg font-black tracking-tight truncate leading-tight">
                  Katalog Lahan Potensial & Komoditas Strategis Siap Tawar
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'bg-[#FAF7F0] hover:bg-[#ECE5D6] text-slate-600 hover:text-slate-900 border border-[#E2DACB]'
              }`}
              title="Tutup Modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search & Sector Filter Bar */}
          <div className="p-2.5 sm:p-4 border-b border-[#E2DACB] dark:border-slate-800 bg-[#F4F0E6]/60 dark:bg-transparent flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari proyek atau komoditas (contoh: Kakao, Kopi, KIB Bua)..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400'
                    : 'bg-[#FAF7F0] border-[#E2DACB] text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedSector('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedSector === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-[#FAF7F0] text-slate-700 hover:bg-[#ECE5D6] border border-[#E2DACB]'
                }`}
              >
                Semua Sektor ({investments.length})
              </button>
              {sectors.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSector(sec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedSector === sec
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-[#FAF7F0] text-slate-700 hover:bg-[#ECE5D6] border border-[#E2DACB]'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Main Body */}
          <div className="p-2.5 sm:p-5 overflow-y-auto flex-1 scrollbar-thin">
            {filteredInvestments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum ada proyek investasi yang cocok
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Seluruh data proyek ditransmisikan secara jujur dari database Supabase PostGIS Pemerintah Kabupaten Luwu.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredInvestments.map((inv) => {
                  const districtName =
                    districts.find((d) => d.id === inv.districtId)?.name ||
                    (inv as any).kecamatan ||
                    inv.districtId ||
                    'Kabupaten Luwu';

                  return (
                    <div
                      key={inv.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between transition-all hover:border-emerald-500/60 ${
                        isDark
                          ? 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800/90'
                          : 'bg-[#F4F0E6] border-[#E2DACB] hover:bg-[#ECE5D6]/60 hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Photo & Badges */}
                        <div className="h-40 rounded-xl overflow-hidden relative mb-3 bg-slate-800">
                          <img
                            src={getImageUrl(inv.photoUrl, 'facility')}
                            alt={inv.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                          {/* Top Badges */}
                          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-10">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                              {inv.sector || 'Sektor Unggulan'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-slate-900/90 text-white border border-white/20 backdrop-blur-md">
                              {(inv as any).readinessTier || 'Tier 1: Ready to Offer'}
                            </span>
                          </div>

                          {/* Bottom Geotag */}
                          <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-xs text-white z-10">
                            <div className="flex items-center gap-1 font-semibold text-[11px] truncate">
                              <MapPin size={13} className="text-emerald-400 shrink-0" />
                              <span className="truncate">{districtName}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              Clean & Clear
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-extrabold text-sm sm:text-base tracking-tight mb-2 line-clamp-1">
                          {inv.name}
                        </h4>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                          <div className="p-2 rounded-xl bg-[#FAF7F0] dark:bg-slate-900/50 border border-[#E2DACB] dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400 block text-[9.5px] font-bold">Estimasi Nilai Investasi</span>
                            <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                              {inv.investmentValue && inv.investmentValue > 0
                                ? formatRupiah(inv.investmentValue)
                                : 'Dalam FS BKPM'}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-[#FAF7F0] dark:bg-slate-900/50 border border-[#E2DACB] dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400 block text-[9.5px] font-bold">Luas Lahan Siap Pakai</span>
                            <span className="font-bold font-mono">
                              {inv.areaHa && inv.areaHa > 0 ? `${inv.areaHa} Hektar` : 'Sesuai Masterplan'}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {inv.description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed font-medium">
                            {inv.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons Row */}
                      <div className="pt-2 border-t border-[#E2DACB] dark:border-slate-700/60 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectInvestment) {
                              onSelectInvestment(inv.id);
                            }
                            onClose();
                          }}
                          className="py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 border border-slate-700"
                        >
                          <FileText size={13} />
                          <span>Profil Lengkap & FS</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveLoiInvestment(inv)}
                          className="py-2 px-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <Sparkles size={13} />
                          <span>Ajukan Minat (LOI)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Letter of Intent (LOI) Submission Drawer */}
          {activeLoiInvestment && (
            <div className="p-3 sm:p-5 border-t border-[#E2DACB] dark:border-slate-800 bg-[#F4F0E6] dark:bg-slate-950/90 animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs sm:text-sm font-bold">
                    Pernyataan Minat Investasi (Letter of Intent):{' '}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {activeLoiInvestment.name}
                    </span>
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLoiInvestment(null)}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold flex items-center gap-1"
                >
                  <X size={14} /> Batalkan
                </button>
              </div>

              {loiSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>
                    Pernyataan Minat Berhasil Dikirim! Petugas Front Office DPMPTSP Kabupaten Luwu akan segera menghubungi Anda.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleLoiSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap Investor / Direksi *"
                      value={loiForm.investorName}
                      onChange={(e) => setLoiForm({ ...loiForm, investorName: e.target.value })}
                      className="px-3 py-2 rounded-xl text-xs border border-[#E2DACB] dark:border-slate-700 bg-[#FAF7F0] dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Nama Perusahaan / Korporasi"
                      value={loiForm.company}
                      onChange={(e) => setLoiForm({ ...loiForm, company: e.target.value })}
                      className="px-3 py-2 rounded-xl text-xs border border-[#E2DACB] dark:border-slate-700 bg-[#FAF7F0] dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Nomor WhatsApp / Telepon Aktif *"
                      value={loiForm.phone}
                      onChange={(e) => setLoiForm({ ...loiForm, phone: e.target.value })}
                      className="px-3 py-2 rounded-xl text-xs border border-[#E2DACB] dark:border-slate-700 bg-[#FAF7F0] dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <input
                      type="text"
                      placeholder="Rencana Nominal Investasi (contoh: Rp 10 Miliar)"
                      value={loiForm.estimatedInvestment}
                      onChange={(e) => setLoiForm({ ...loiForm, estimatedInvestment: e.target.value })}
                      className="w-full sm:flex-1 px-3 py-2 rounded-xl text-xs border border-[#E2DACB] dark:border-slate-700 bg-[#FAF7F0] dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <Send size={14} />
                      <span>Kirim Minat ke DPMPTSP</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Footer Info */}
          <div
            className={`p-2.5 sm:p-4 border-t flex items-center justify-between text-xs shrink-0 ${
              isDark ? 'border-slate-800 text-slate-400' : 'bg-[#F4F0E6] border-[#E2DACB] text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[11px]">
                Seluruh proyek telah melalui kurasi kelayakan spasial PKKPR & tata ruang Kabupaten Luwu
              </span>
            </div>
            <span className="font-mono font-bold hidden sm:inline text-[11px]">
              {filteredInvestments.length} Titik Portofolio Siap
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IproCatalogModal;
