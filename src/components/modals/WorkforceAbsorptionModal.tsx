import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  TrendingUp,
  Percent,
  FileCheck
} from 'lucide-react';
import { Investment } from '../../types';

interface WorkforceAbsorptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  investments?: Investment[];
  totalLabor?: number;
  onOpenIncentiveCalculator?: () => void;
}

export const WorkforceAbsorptionModal: React.FC<WorkforceAbsorptionModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  investments = [],
  totalLabor = 0,
  onOpenIncentiveCalculator,
}) => {
  // Simulator State
  const [simTotalWorkers, setSimTotalWorkers] = useState<number>(50);
  const [simLocalWorkers, setSimLocalWorkers] = useState<number>(35);

  const localRatio = useMemo(() => {
    if (!simTotalWorkers || simTotalWorkers <= 0) return 0;
    return Math.min(100, Math.round((simLocalWorkers / simTotalWorkers) * 100));
  }, [simTotalWorkers, simLocalWorkers]);

  const isEligibleIncentive = localRatio >= 60;

  // Real investment data with labor breakdown
  const laborData = useMemo(() => {
    return investments.map((inv) => {
      const rawLabor =
        (inv as any).komitmenTenagaLokal ??
        (inv as any).komitmen_tenaga_lokal ??
        inv.tenagaKerja ??
        (inv as any).tenaga_kerja ??
        (inv as any).tenagaLokal ??
        (inv as any).tkl ??
        0;
      const count = typeof rawLabor === 'number' ? rawLabor : parseFloat(String(rawLabor).replace(/[^0-9.]/g, '')) || 0;
      return {
        ...inv,
        laborCount: count,
      };
    });
  }, [investments]);

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
          className={`w-[calc(100vw-20px)] sm:w-full h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[90vh] max-w-4xl rounded-2xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
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
                ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-slate-800'
                : 'bg-[#F4F0E6] border-[#E2DACB]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 shrink-0">
                <Users size={22} className="sm:w-6 sm:h-6 drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-[#FAF7F0] dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-[#E2DACB] dark:border-emerald-500/30">
                    Perda Luwu No. 06/2011 & Perbup No. 42/2021
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg font-black tracking-tight truncate leading-tight">
                  Transparansi Serapan Tenaga Kerja & Kebijakan Insentif Daerah
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

          {/* Main Body */}
          <div className="p-2.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 scrollbar-thin">
            {/* Executive Highlights Card */}
            <div
              className={`p-3.5 sm:p-5 rounded-2xl border ${
                isDark
                  ? 'bg-gradient-to-r from-emerald-950/40 via-slate-800/60 to-teal-950/30 border-emerald-500/30'
                  : 'bg-[#F4F0E6] border-[#E2DACB]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500 block mb-1">
                    Total Komitmen Tenaga Kerja Terverifikasi
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 flex items-baseline gap-2">
                    <span>{totalLabor.toLocaleString('id-ID')}</span>
                    <span className="text-sm font-sans text-slate-500 font-bold">Jiwa Terdata</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F0] dark:bg-slate-900/70 border border-[#E2DACB] dark:border-emerald-500/30 text-xs space-y-1 sm:max-w-md">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <Award size={15} />
                    <span>Ketentuan Tarif Insentif 35%–50%:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Pemberian pengurangan retribusi Persetujuan Bangunan Gedung (PBG) dan keringanan sewa tanah Pemkab Luwu berlaku bagi usaha investasi yang menyerap sekurang-kurangnya <strong>60% Tenaga Kerja Daerah (TKD)</strong> ber-KTP Kabupaten Luwu.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Mini Eligibility Simulator */}
            <div
              className={`p-3.5 sm:p-5 rounded-2xl border ${
                isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-[#F4F0E6] border-[#E2DACB]'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Simulasi Cepat Kelayakan Insentif Tenaga Kerja Lokal (TKD)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Estimasi Total Tenaga Kerja Proyek (Jiwa):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={simTotalWorkers}
                    onChange={(e) => setSimTotalWorkers(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-[#E2DACB] dark:border-slate-700 bg-[#FAF7F0] dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Rencana Penyerapan Pekerja KTP Luwu (Jiwa):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={simTotalWorkers}
                    value={simLocalWorkers}
                    onChange={(e) => setSimLocalWorkers(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border border-[#E2DACB] dark:border-slate-700 bg-[#FAF7F0] dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Result Indicator */}
              <div
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isEligibleIncentive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isEligibleIncentive ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-black">
                      Rasio Tenaga Kerja Lokal: {localRatio}% {isEligibleIncentive ? '• ELIGIBLE INSENTIF' : '• DI BAWAH SYARAT PERDA (60%)'}
                    </div>
                    <div className="text-[10.5px] opacity-90 leading-tight">
                      {isEligibleIncentive
                        ? 'Proyek Anda berhak mengajukan keringanan retribusi PBG & sewa aset hingga 35% di DPMPTSP Luwu.'
                        : 'Tingkatkan komitmen serapan tenaga kerja ber-KTP Luwu hingga minimal 60% untuk memperoleh fasilitas insentif fiskal.'}
                    </div>
                  </div>
                </div>

                {onOpenIncentiveCalculator && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenIncentiveCalculator();
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-sm"
                  >
                    <span>Kalkulator Lengkap</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* List of Real Investments from DB */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <FileCheck size={15} />
                <span>Rincian Serapan Tenaga Kerja per Titik Investasi (Database Live):</span>
              </h4>

              {laborData.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Belum ada data proyek terdaftar di database.
                </div>
              ) : (
                <div className="space-y-2">
                  {laborData.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl border border-[#E2DACB] dark:border-slate-800 bg-[#F4F0E6] dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold truncate">{inv.name}</div>
                        <div className="text-[10.5px] text-slate-500">{inv.sector || 'Sektor Potensial'}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 block text-sm">
                          {inv.laborCount > 0 ? `${inv.laborCount} Jiwa` : 'Dalam Pre-FS'}
                        </span>
                        <span className={`text-[9.5px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600 font-extrabold'}`}>Komitmen TKL</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div
            className={`p-2.5 sm:p-4 border-t flex items-center justify-between text-xs shrink-0 ${
              isDark ? 'border-slate-800 text-slate-400' : 'bg-[#F4F0E6] border-[#E2DACB] text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[11px]">
                Data ketenagakerjaan terintegrasi dengan verifikasi Dinas Tenaga Kerja & Transmigrasi Kab. Luwu
              </span>
            </div>
            <span className="font-mono font-bold hidden sm:inline text-[11px]">
              TKL/TKA Valid
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WorkforceAbsorptionModal;
