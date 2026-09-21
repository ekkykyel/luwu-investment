import React, { useState } from 'react';
import { 
  ArrowRight, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Building2, 
  TrendingUp, 
  Database, 
  FileCheck2, 
  Activity, 
  UserCheck, 
  ShieldCheck,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabase';

export interface TicketData {
  id: string;
  company_name: string;
  investor_name: string;
  potensi_name: string;
  nilai_investasi: number;
  status: string;
  catatan_admin?: string;
  created_at: string;
  current_bidang?: string;
}

interface EstafetHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketData | null;
  currentRole: string; // 'admin_promosi' | 'admin_data' | 'admin_oss' | 'admin_dalak' | 'superadmin'
  onSuccess: () => void;
}

export const BIDANG_STAGES = [
  {
    id: 'admin_promosi',
    key: 'Promosi',
    name: '1. Bidang Promosi & Penanaman Modal',
    shortName: 'Bidang Promosi',
    statusTag: 'Menunggu Verifikasi',
    nextStatus: 'Kajian Data & Spasial',
    nextRole: 'admin_data',
    nextRoleName: 'Bidang Perencanaan & Data',
    icon: TrendingUp,
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    instruction: 'Lakukan verifikasi profil investor dan dokumen LoI, lalu estafetkan ke Bidang Data untuk kajian spasial.'
  },
  {
    id: 'admin_data',
    key: 'Data',
    name: '2. Bidang Perencanaan, Iklim & Data',
    shortName: 'Bidang Data',
    statusTag: 'Kajian Data & Spasial',
    nextStatus: 'Verifikasi OSS & PKKPR',
    nextRole: 'admin_oss',
    nextRoleName: 'Bidang Pelayanan Perizinan (OSS)',
    icon: Database,
    color: 'blue',
    badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    instruction: 'Analisis ketersediaan komoditas, LP2B, dan RTRW, lalu serahkan ke Bidang OSS untuk proses perizinan.'
  },
  {
    id: 'admin_oss',
    key: 'OSS',
    name: '3. Bidang Pelayanan Perizinan (OSS)',
    shortName: 'Bidang OSS',
    statusTag: 'Verifikasi OSS & PKKPR',
    nextStatus: 'Pengawasan DALAK & LKPM',
    nextRole: 'admin_dalak',
    nextRoleName: 'Bidang Pengendalian & Pengawasan (DALAK)',
    icon: FileCheck2,
    color: 'indigo',
    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
    instruction: 'Proses penerbitan NIB & integrasi PKKPR, kemudian limpahkan ke Bidang DALAK untuk pengawasan konstruksi.'
  },
  {
    id: 'admin_dalak',
    key: 'DALAK',
    name: '4. Bidang Pengendalian & Pengawasan (DALAK)',
    shortName: 'Bidang DALAK',
    statusTag: 'Pengawasan DALAK & LKPM',
    nextStatus: 'Izin Terbit / Realisasi',
    nextRole: 'selesai',
    nextRoleName: 'Izin Terbit & Realisasi Berhasil',
    icon: Activity,
    color: 'amber',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    instruction: 'Lakukan monitoring lapangan, asistensi LKPM, dan finalisasi realisasi nilai investasi daerah.'
  }
];

export const EstafetHandoverModal: React.FC<EstafetHandoverModalProps> = ({
  isOpen,
  onClose,
  ticket,
  currentRole,
  onSuccess
}) => {
  const [catatanHandover, setCatatanHandover] = useState('');
  const [selectedTargetRole, setSelectedTargetRole] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !ticket) return null;

  // Determine current stage based on status or role
  let currentStageIndex = 0;
  if (ticket.status === 'Kajian Data & Spasial' || currentRole === 'admin_data') {
    currentStageIndex = 1;
  } else if (ticket.status === 'Verifikasi OSS & PKKPR' || currentRole === 'admin_oss') {
    currentStageIndex = 2;
  } else if (ticket.status === 'Pengawasan DALAK & LKPM' || currentRole === 'admin_dalak') {
    currentStageIndex = 3;
  }

  const currentStage = BIDANG_STAGES[currentStageIndex] || BIDANG_STAGES[0];
  const defaultNextStage = BIDANG_STAGES[currentStageIndex + 1] || null;

  const targetStage = BIDANG_STAGES.find(s => s.id === (selectedTargetRole || currentStage.nextRole)) || defaultNextStage;

  const handleExecuteEstafet = async () => {
    if (!ticket) return;

    if (!catatanHandover.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Catatan Handover Diperlukan',
        text: 'Mohon berikan catatan ringkas atau arahan pendampingan untuk admin bidang selanjutnya.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const nextStatusName = targetStage ? targetStage.statusTag : 'Izin Terbit / Realisasi';
      const updatedCatatan = `${ticket.catatan_admin || ''}\n[ESTAFET ${new Date().toLocaleDateString('id-ID')} - ${currentStage.shortName} ➔ ${targetStage ? targetStage.shortName : 'Selesai'}]: ${catatanHandover.trim()}`.trim();

      // 1. Update investment_interests in Supabase
      const { error: updateErr } = await supabase
        .from('investment_interests')
        .update({
          status: nextStatusName,
          catatan_admin: updatedCatatan,
          last_status_updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (updateErr) throw updateErr;

      // 2. Trigger Cross-OPD Notification for target bidang admin
      try {
        await fetch('/api/mpp/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient_role: targetStage ? targetStage.id : 'superadmin',
            title: `🔄 Estafet Pendampingan Investor: ${ticket.company_name}`,
            message: `Berkas investasi #${ticket.id.substring(0, 8)} telah diestafetkan oleh ${currentStage.shortName} ke ${targetStage ? targetStage.shortName : 'Realisasi'}. Catatan: "${catatanHandover}"`,
            type: 'LOI_ESTAFET',
            reference_id: ticket.id
          })
        });
      } catch (e) {
        console.warn('Cross notification notification warning:', e);
      }

      Swal.fire({
        icon: 'success',
        title: 'Estafet Berhasil Dilimpahkan!',
        html: `Berkas minat investasi <b>${ticket.company_name}</b> telah resmi dialihkan ke <b>${targetStage ? targetStage.name : 'Tahap Realisasi Selesai'}</b>.`,
        confirmButtonColor: '#10b981'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error executing estafet:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengestafetkan Berkas',
        text: err?.message || 'Terjadi kesalahan sistem saat pemindahan status.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-slate-950">
                Formulir Estafet Lintas Bidang
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Pengalihan Pendampingan Investor
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">

          {/* Ticket Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Nama Perusahaan / Investor</span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{ticket.company_name}</h4>
                <p className="text-xs text-slate-500 font-medium">{ticket.investor_name} • Proyek: {ticket.potensi_name}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Rencana Nilai Investasi</span>
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ticket.nilai_investasi)}
                </div>
              </div>
            </div>
          </div>

          {/* Handover Direction Visual Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
            
            {/* Sender Bidang */}
            <div className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 block mb-1">Bidang Pengirim (Posisi Sekarang)</span>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <currentStage.icon className="w-4 h-4 text-emerald-500" />
                <span>{currentStage.shortName}</span>
              </div>
            </div>

            <div className="p-2 rounded-full bg-emerald-500 text-slate-950 flex-shrink-0 animate-pulse">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Target Bidang */}
            <div className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/40 text-center shadow-md">
              <span className="text-[9px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400 block mb-1">Bidang Penerima Estafet</span>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                {targetStage ? <targetStage.icon className="w-4 h-4 text-emerald-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                <span>{targetStage ? targetStage.shortName : 'Selesai & Realisasi'}</span>
              </div>
            </div>

          </div>

          {/* Target Bidang Selector (Override default sequence if needed) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-500" /> Pilih Tujuan Estafet Pendampingan
            </label>
            <select
              value={selectedTargetRole || currentStage.nextRole}
              onChange={(e) => setSelectedTargetRole(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="admin_data">2. Bidang Perencanaan, Iklim & Data (Analisis Spasial RTRW & LP2B)</option>
              <option value="admin_oss">3. Bidang Pelayanan Perizinan (Proses NIB & PKKPR OSS-RBA)</option>
              <option value="admin_dalak">4. Bidang Pengendalian & Pengawasan (Ground Check & LKPM DALAK)</option>
              <option value="selesai">✅ Realisasi Selesai / Izin Terbit (Tutup Tiket Pendampingan)</option>
            </select>
          </div>

          {/* Handover Instruction / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-500" /> Catatan Estafet & Catatan Lapangan (Wajib)
            </label>
            <textarea
              value={catatanHandover}
              onChange={(e) => setCatatanHandover(e.target.value)}
              rows={3}
              placeholder="Contoh: Berkas LoI telah divalidasi. Mohon Bidang Data melakukan overlay spasial kesesuaian lahan RTRW di Kecamatan Bua..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleExecuteEstafet}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Mengirimkan Estafet...</>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Kirim Estafet Pendampingan
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EstafetHandoverModal;
