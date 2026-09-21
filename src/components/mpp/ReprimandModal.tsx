import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldAlert,
  History,
  CheckCheck,
  UserCheck,
  Sparkles,
  Loader2,
  Info,
  Layers,
  User
} from 'lucide-react';
import { MPPTenant, MppReprimand, MPPTenantUser } from '../../types/mpp';
import { mppService } from '../../services/mppService';
import { supabase } from '../../lib/supabaseClient';

interface ReprimandModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: MPPTenant[];
  selectedTenantId?: string | null;
  currentAdminId?: string | null;
  filterByUserId?: string | null;
  filterByCounterName?: string | null;
}

const QUICK_REASONS = [
  'Datang Terlambat',
  'Sering Tinggalkan Gerai',
  'Lambat dalam Pelayanan',
  'Indikasi Praktek Pungli',
  'Tidak Ramah/Sopan',
  'Atribut Tidak Lengkap'
];

export const ReprimandModal: React.FC<ReprimandModalProps> = ({
  isOpen,
  onClose,
  tenants,
  selectedTenantId = null,
  currentAdminId = null,
  filterByUserId = null,
  filterByCounterName = null
}) => {
  const [targetTenantId, setTargetTenantId] = useState<string>(selectedTenantId || '');
  const [tenantOfficers, setTenantOfficers] = useState<MPPTenantUser[]>([]);
  const [isLoadingOfficers, setIsLoadingOfficers] = useState<boolean>(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('all'); // 'all' or officer id
  const [selectedQuickReasons, setSelectedQuickReasons] = useState<string[]>([]);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab: 'form' | 'history'
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [historyList, setHistoryList] = useState<MppReprimand[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (selectedTenantId) {
      setTargetTenantId(selectedTenantId);
    } else if (tenants.length > 0 && !targetTenantId) {
      setTargetTenantId(tenants[0].id);
    }
  }, [selectedTenantId, tenants]);

  // Load tenant officers when targetTenantId changes
  useEffect(() => {
    if (!targetTenantId) {
      setTenantOfficers([]);
      setSelectedOfficerId('all');
      return;
    }

    const loadOfficers = async () => {
      setIsLoadingOfficers(true);
      try {
        const ops = await mppService.getTenantOfficers(targetTenantId);
        setTenantOfficers(ops);
      } catch {
        setTenantOfficers([]);
      } finally {
        setIsLoadingOfficers(false);
      }
    };

    loadOfficers();
  }, [targetTenantId]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setSubmitSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, targetTenantId]);

  // Realtime subscription to track read status updates
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('reprimands_admin_monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mpp_reprimands' },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      let data = await mppService.getReprimands(targetTenantId || undefined);
      if (filterByUserId) {
        data = data.filter(r => !r.target_user_id || r.target_user_id === filterByUserId);
      }
      if (filterByCounterName) {
        data = data.filter(r => {
          if (!r.target_counter_name) return true;
          const rc = r.target_counter_name.toLowerCase().trim();
          const cc = filterByCounterName.toLowerCase().trim();
          return rc === cc || rc === `loket ${cc}` || `loket ${rc}` === cc;
        });
      }
      setHistoryList(data);
    } catch {
      setHistoryList([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const toggleQuickReason = (reason: string) => {
    setSelectedQuickReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTenantId) {
      setErrorMessage('Silakan pilih gerai/instansi tujuan.');
      return;
    }
    if (selectedQuickReasons.length === 0 && !comments.trim()) {
      setErrorMessage('Pilih minimal satu alasan teguran atau tuliskan catatan detail.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const chosenOfficer = tenantOfficers.find(o => o.id === selectedOfficerId || o.user_id === selectedOfficerId);

      const result = await mppService.createReprimand({
        tenant_id: targetTenantId,
        target_user_id: chosenOfficer ? (chosenOfficer.user_id || chosenOfficer.id) : null,
        target_counter_name: chosenOfficer ? chosenOfficer.counter_name || null : null,
        target_officer_name: chosenOfficer ? (chosenOfficer.officer_name || chosenOfficer.username) : null,
        quick_reasons: selectedQuickReasons,
        comments: comments.trim(),
        issued_by: currentAdminId || null
      });

      if (result.success) {
        setSubmitSuccess(true);
        setSelectedQuickReasons([]);
        setComments('');
        fetchHistory();
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveTab('history');
        }, 1200);
      } else {
        setErrorMessage(result.error || 'Gagal mengirim e-Teguran.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await mppService.resolveReprimand(id);
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const targetTenant = tenants.find((t) => t.id === targetTenantId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-rose-900/60 rounded-2xl shadow-2xl shadow-rose-950/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 border-b border-rose-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  e-Teguran Real-time
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  DPMPTSP Kab. Luwu
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Peringatan & Disiplin Petugas Gerai
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-900/80 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'form'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Form Kirim Teguran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Teguran ({historyList.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Alert Feedback */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Teguran berhasil dikirim secara real-time ke layar loket gerai!</span>
                </div>
              )}

              {/* Target Gerai & Target Loket Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Target Gerai */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Gerai / Instansi Tujuan
                  </label>
                  <div className="relative">
                    <select
                      value={targetTenantId}
                      onChange={(e) => setTargetTenantId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  {targetTenant && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                        {targetTenant.floor || 'Lantai 1'}
                      </span>
                      <span className="truncate">{targetTenant.name}</span>
                    </div>
                  )}
                </div>

                {/* Target Loket / Petugas (Multi-Counter Support) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Loket / Petugas Spesifik
                  </label>
                  <div className="relative">
                    <select
                      value={selectedOfficerId}
                      onChange={(e) => setSelectedOfficerId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                    >
                      <option value="all">-- Seluruh Gerai / Semua Loket Aktif --</option>
                      {tenantOfficers.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.counter_name || 'Loket'}: {op.officer_name || op.username || 'Petugas'} ({op.role})
                        </option>
                      ))}
                    </select>
                    <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {tenantOfficers.length > 0 ? (
                      <span className="text-sky-400 font-medium">{tenantOfficers.length} Loket/Petugas terdaftar di gerai ini</span>
                    ) : (
                      <span className="text-slate-500">Teguran akan disiarkan ke seluruh sesi gerai</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Reasons Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Alasan Teguran Cepat (Bisa Pilih Lebih Dari Satu)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_REASONS.map((reason) => {
                    const isSelected = selectedQuickReasons.includes(reason);
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => toggleQuickReason(reason)}
                        className={`p-2 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold shadow-sm shadow-rose-950'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        <span className="truncate pr-1">{reason}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail / Catatan Teguran */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Detail / Catatan Teguran Khusus
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Contoh: Petugas tidak berada di meja sejak pukul 09:30 WITA saat ada 4 antrean warga menunggu, mohon segera ditindaklanjuti..."
                  rows={4}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Notice Hard-Stop */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p>
                  Teguran ini akan memicu <strong>Hard-Stop Warning Dialog</strong> seketika pada layar loket petugas gerai yang bersangkutan dan mewajibkan petugas mengetik nama serta melakukan konfirmasi tanda terima sebelum dapat melanjutkan operasional.
                </p>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-900/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim ke Layar Gerai...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim e-Teguran Resmi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Daftar teguran terkirim ({historyList.length})</span>
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="text-rose-400 hover:underline font-semibold cursor-pointer"
                >
                  Segarkan
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  <span>Memuat riwayat teguran...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Belum ada riwayat teguran untuk gerai ini.
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-white font-bold">
                            {item.tenant_name || 'Gerai MPP'}
                          </strong>
                          {item.tenant_code && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1 rounded">
                              {item.tenant_code}
                            </span>
                          )}
                          {item.target_counter_name && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 rounded">
                              {item.target_counter_name}
                              {item.target_officer_name && ` • ${item.target_officer_name}`}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(item.created_at).toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {item.status === 'sent' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>Terkirim (Belum Dibaca)</span>
                          </span>
                        )}
                        {item.status === 'read' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            <span>Telah Dikonfirmasi</span>
                          </span>
                        )}
                        {item.status === 'resolved' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Selesai</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Reasons Chips */}
                    {item.quick_reasons && item.quick_reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.quick_reasons.map((r, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Comments */}
                    {item.comments && (
                      <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-850 italic">
                        "{item.comments}"
                      </p>
                    )}

                    {/* Acknowledgment metadata */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-[11px]">
                      <div className="text-slate-400">
                        {item.read_by_name ? (
                          <span className="flex items-center gap-1 text-sky-400">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>
                              Dikonfirmasi oleh <strong>{item.read_by_name}</strong>{' '}
                              {item.read_at && `(${new Date(item.read_at).toLocaleTimeString('id-ID')})`}
                            </span>
                          </span>
                        ) : (
                          <span className="text-amber-400/80 italic">Menunggu konfirmasi petugas loket...</span>
                        )}
                      </div>

                      {item.status === 'read' && (
                        <button
                          type="button"
                          onClick={() => handleResolve(item.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          Tandai Selesai
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
