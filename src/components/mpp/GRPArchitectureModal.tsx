import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  Database, 
  Server, 
  ShieldCheck, 
  Layers, 
  X, 
  Radio, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

interface GRPArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const GRPArchitectureModal: React.FC<GRPArchitectureModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true
}) => {
  if (!isOpen) return null;

  const pipelineSteps = [
    {
      title: 'Frontend Spasial (InvestLuwu & MPP)',
      desc: 'MapLibre GL JS + PWA UI yang terisolasi client-side, terintegrasi sensor GPS & touch-responsive.',
      icon: Radio,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      title: 'Real-time WebSocket & PostGIS Engine',
      desc: 'Sinkronisasi spasial live via Supabase PostgreSQL, menghitung routing terpendek & overlay RTRW.',
      icon: Database,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
    },
    {
      title: 'Katalog Layanan & Radar Antrean MPP',
      desc: 'Pemanggilan antrean multi-loket dengan text-to-speech otomatis dan pelacakan SLA pelayanan publik.',
      icon: Activity,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      title: 'Analitik Eksekutif & Smart Audit Trail',
      desc: 'Dashboard pemantauan perizinan PKKPR, investasi daerah, dan rekap kepuasan masyarakat (SKM).',
      icon: Cpu,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border p-5 sm:p-8 font-sans shadow-2xl ${
            isDarkMode 
              ? 'bg-slate-900/95 border-slate-700/80 text-white' 
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-200'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
                <Network className="w-3.5 h-3.5" /> Arsitektur Sistem GRP Spasial
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight">
                Government Resource Planning & Real-Time Spasial
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Topologi integrasi portal investasi digital dan Mal Pelayanan Publik Kabupaten Luwu.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pipeline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {pipelineSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`p-2.5 rounded-xl border ${step.color}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    MODULE 0{idx + 1}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base mb-1 text-slate-100">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Database Specs & Zero Dummy Guarantee */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-200 mb-0.5">
                Integritas Data Sesuai Standar Pemkab Luwu
              </div>
              <p className="text-emerald-300/90 leading-relaxed text-[11px]">
                Sistem beroperasi di atas PostgreSQL PostGIS Supabase dengan zero mock data policy, enkripsi role-based (RLS), dan audit log otomatis untuk setiap transaksi izin serta pendaftaran antrean.
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end pt-5 mt-6 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-colors"
            >
              Tutup Ringkasan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GRPArchitectureModal;
