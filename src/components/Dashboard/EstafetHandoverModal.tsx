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
import { supabase } from '../../lib/supabaseClient';

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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="px-4 pt-2.5 pb-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-500/50 mx-auto mb-2.5 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold tracking-wide text-emerald-300 truncate">
                  Formulir Estafet Lintas Bidang
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">
                  Pengalihan Pendampingan Investor
                </h3>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              aria-label="Tutup modal estafet"
              className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">

          {/* Ticket Summary Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2.5">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Nama Perusahaan / Investor</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white break-words">{ticket.company_name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{ticket.investor_name} · Proyek: {ticket.potensi_name}</p>
              </div>
              <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70 dark:border-slate-700/60 shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Rencana Nilai Investasi</span>
                <div className="text-sm sm:text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ticket.nilai_investasi)}
                </div>
              </div>
            </div>
          </div>

          {/* Handover Direction Visual Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            
            {/* Sender Bidang */}
            <div className="flex-1 p-3 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 sm:text-center flex sm:block items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block sm:mb-1">Pengirim</span>
              <div className="flex items-center sm:justify-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <currentStage.icon className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{currentStage.shortName}</span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center self-center shrink-0">
              <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
            </div>

            {/* Target Bidang */}
            <div className="flex-1 p-3 rounded-xl bg-white dark:bg-surface border border-emerald-500/40 sm:text-center flex sm:block items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 sm:block sm:mb-1">Penerima Estafet</span>
              <div className="flex items-center sm:justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {targetStage ? <targetStage.icon className="w-4 h-4 text-emerald-500 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                <span>{targetStage ? targetStage.shortName : 'Selesai & Realisasi'}</span>
              </div>
            </div>

          </div>

          {/* Target Bidang Selector (Override default sequence if needed) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" /> Pilih Tujuan Estafet Pendampingan
            </label>
            <select
              value={selectedTargetRole || currentStage.nextRole}
              onChange={(e) => setSelectedTargetRole(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-base border border-slate-300 dark:border-slate-700 font-semibold text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="admin_data">2. Bidang Perencanaan, Iklim &amp; Data (Analisis Spasial RTRW &amp; LP2B)</option>
              <option value="admin_oss">3. Bidang Pelayanan Perizinan (Proses NIB &amp; PKKPR OSS-RBA)</option>
              <option value="admin_dalak">4. Bidang Pengendalian &amp; Pengawasan (Ground Check &amp; LKPM DALAK)</option>
              <option value="selesai">Realisasi Selesai / Izin Terbit (Tutup Tiket Pendampingan)</option>
            </select>
          </div>

          {/* Handover Instruction / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" /> Catatan Estafet &amp; Arahan Lapangan (Wajib)
            </label>
            <textarea
              value={catatanHandover}
              onChange={(e) => setCatatanHandover(e.target.value)}
              rows={3}
              placeholder="Contoh: Berkas LoI telah divalidasi. Mohon Bidang Data melakukan overlay spasial kesesuaian lahan RTRW..."
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-base border border-slate-300 dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface shrink-0 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecuteEstafet}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[40px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {isSubmitting ? (
              <span>Mengirimkan Estafet...</span>
            ) : (
              <>
                <Send className="w-4 h-4 shrink-0" />
                <span>Kirim Estafet Pendampingan</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EstafetHandoverModal;
