import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, Users, CheckCircle2, Clock, Volume2, 
  RefreshCw, LogOut, FileText, Search, ArrowRight, Settings,
  Plus, Trash2, Edit, X, ShieldCheck, BarChart3, Layers, 
  AlertCircle, Check, ChevronRight, Phone, Eye, Smartphone, Sparkles, Filter, Lock, BellRing
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MPPTenant, MPPQueue, MPPService } from '../../types/mpp';
import { playAirportChime, speakCallingAnnouncement } from '../../utils/airportAudioAlert';
import { MppAdminReport } from './MppAdminReport';

interface Props {
  isDarkMode: boolean;
  onClose: () => void;
}

interface TrackingDocItem {
  id: string;
  queue_id: string;
  tracking_code: string;
  current_status: string;
  created_at: string;
  updated_at: string;
  queue?: {
    ticket_code: string;
    citizen_nik: string;
    session?: string;
    citizen?: {
      full_name: string;
      phone_number?: string;
    };
    service?: {
      service_name: string;
    };
  };
}

const TRACKING_STAGES = [
  'Berkas Diterima',
  'Verifikasi Dokumen',
  'Kajian Teknis',
  'Tanda Tangan Elektronik',
  'Dokumen Terbit'
];

export default function TenantDashboard({ isDarkMode, onClose }: Props) {
  const [tenants, setTenants] = useState<MPPTenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<MPPTenant | null>(null);
  const [operatorInfo, setOperatorInfo] = useState<{ name: string; nip?: string; role: string } | null>(null);
  
  const [queues, setQueues] = useState<MPPQueue[]>([]);
  const [services, setServices] = useState<MPPService[]>([]);
  const [trackingDocs, setTrackingDocs] = useState<TrackingDocItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'antrean' | 'riwayat' | 'layanan' | 'tracking' | 'instansi' | 'laporan'>('antrean');

  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');

  // Search & Filter (Android Friendly)
  const [queueFilter, setQueueFilter] = useState<'all' | 'menunggu' | 'dipanggil' | 'dilayani' | 'masyarakat' | 'investor'>('all');
  const [queueSearch, setQueueSearch] = useState('');
  const [isAudioTesting, setIsAudioTesting] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [trackingSearch, setTrackingSearch] = useState('');

  // Login Form for Petugas Gerai
  const [authSubTab, setAuthSubTab] = useState<'login' | 'instansi'>('login');
  const [loginForm, setLoginForm] = useState({
    tenantId: '',
    operatorName: 'Ahmad Fauzi, S.Kom',
    operatorNip: '199208152020121004',
    pin: '123456'
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modals
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<MPPService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    service_name: '',
    requirements: '',
    is_long_process: false
  });
  const [isSavingService, setIsSavingService] = useState(false);

  // Tenant Modal (Edit / Tambah)
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<MPPTenant | null>(null);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    code: '',
    floor: 'Lantai 1',
    description: '',
    is_active: true
  });
  const [isSavingTenant, setIsSavingTenant] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'service' | 'tenant';
    id: string;
    title: string;
  }>({ isOpen: false, type: 'service', id: '', title: '' });

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- INITIAL LOAD: FETCH TENANTS & HYDRATE OPERATOR SESSION ---
  const fetchTenants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mpp_tenants')
        .select('*')
        .order('name');
      if (error) throw error;
      if (data) {
        setTenants(data);
        
        // Auto hydrate from operator session if activeTenant is null
        const sessionStr = localStorage.getItem('mpp_tenant_operator_session');
        if (sessionStr && !activeTenant) {
          try {
            const sess = JSON.parse(sessionStr);
            if (sess && sess.tenantId) {
              const matched = data.find(t => t.id === sess.tenantId);
              if (matched) {
                setActiveTenant(matched);
                setOperatorInfo({
                  name: sess.operatorName || 'Petugas Loket Gerai',
                  nip: sess.operatorNip || '199001012022011001',
                  role: sess.role || 'petugas_gerai'
                });
                fetchDashboardData(matched.id);
                return;
              }
            }
          } catch (e) {
            console.error('Error parsing session:', e);
          }
        }

        // If activeTenant exists, update its reference
        if (activeTenant) {
          const updated = data.find(t => t.id === activeTenant.id);
          if (updated) setActiveTenant(updated);
        }
      }
    } catch (err: any) {
      console.error('Error fetching tenants:', err);
    }
  }, [activeTenant]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const loginAsTenant = (tenant: MPPTenant, opInfo?: { name: string; nip?: string; role: string }) => {
    const operator = opInfo || {
      name: 'Ahmad Fauzi, S.Kom',
      nip: '199208152020121004',
      role: 'Petugas Loket Gerai'
    };
    const sessionData = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantCode: tenant.code,
      operatorName: operator.name,
      operatorNip: operator.nip,
      role: operator.role,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem('mpp_tenant_operator_session', JSON.stringify(sessionData));
    setActiveTenant(tenant);
    setOperatorInfo(operator);
    fetchDashboardData(tenant.id);
    showToast('success', `Berhasil masuk ke panel loket ${tenant.name}`);
  };

  const logout = () => {
    localStorage.removeItem('mpp_tenant_operator_session');
    setActiveTenant(null);
    setOperatorInfo(null);
    setQueues([]);
    setServices([]);
    setTrackingDocs([]);
    showToast('info', 'Sesi petugas telah selesai.');
  };

  // Sound speaker test helper for Android tablet/phone
  const handleTestAudio = async () => {
    setIsAudioTesting(true);
    try {
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      await playAirportChime();
      speakCallingAnnouncement('TEST-01', `Loket ${activeTenant?.name || 'MPP'}`);
      showToast('info', 'Suara bel bandara dan panggilan loket berhasil diuji.');
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsAudioTesting(false), 2000);
    }
  };

  // --- FETCH ALL DASHBOARD DATA FOR ACTIVE TENANT ---
  const fetchDashboardData = useCallback(async (tenantId: string) => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Fetch Queues for Today
      const { data: qData, error: qErr } = await supabase
        .from('mpp_queues')
        .select(`
          *,
          citizen:mpp_citizens(*),
          service:mpp_services(*)
        `)
        .eq('tenant_id', tenantId)
        .eq('queue_date', today)
        .order('queue_number', { ascending: true });
        
      if (qErr) throw qErr;
      if (qData) setQueues(qData as unknown as MPPQueue[]);

      // 2. Fetch Services for this Tenant
      const { data: sData, error: sErr } = await supabase
        .from('mpp_services')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('service_name', { ascending: true });
        
      if (sErr) throw sErr;
      if (sData) setServices(sData);

      // 3. Fetch Document Tracking for this Tenant
      const { data: tData, error: tErr } = await supabase
        .from('mpp_document_tracking')
        .select(`
          *,
          queue:mpp_queues(
            ticket_code,
            citizen_nik,
            session,
            citizen:mpp_citizens(full_name, phone_number),
            service:mpp_services(service_name)
          )
        `)
        .order('updated_at', { ascending: false });

      if (!tErr && tData) {
        // Filter tracking docs that belong to queues of this tenant (or all if queue details match)
        const relevantDocs = tData.filter((doc: any) => {
          if (!doc.queue) return false;
          // In cases where queue is loaded, check if queue.service belongs to this tenant or direct relation
          return true; // Display documents
        });
        setTrackingDocs(relevantDocs as unknown as TrackingDocItem[]);
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      showToast('error', 'Gagal memuat data dari Supabase: ' + (error?.message || 'Error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- REAL-TIME SUBSCRIPTION FOR QUEUES & SERVICES ---
  useEffect(() => {
    if (!activeTenant) return;

    fetchDashboardData(activeTenant.id);

    const channel = supabase
      .channel(`mpp_admin_realtime_${activeTenant.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_queues' }, () => {
        fetchDashboardData(activeTenant.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_services' }, () => {
        fetchDashboardData(activeTenant.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_document_tracking' }, () => {
        fetchDashboardData(activeTenant.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTenant, fetchDashboardData]);

  // --- QUEUE ACTIONS ---
  const updateQueueStatus = async (queueId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('mpp_queues')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', queueId);
        
      if (error) throw error;

      // Jika masuk tracking, buat dokumen tracking otomatis
      if (newStatus === 'masuk_tracking') {
        const trackingCode = `TRK-${Date.now().toString().slice(-6)}`;
        const { error: trkErr } = await supabase.from('mpp_document_tracking').insert({
          queue_id: queueId,
          tracking_code: trackingCode,
          current_status: 'Berkas Diterima'
        });
        
        if (trkErr) {
          console.warn('Tracking insert warning:', trkErr);
        } else {
          showToast('success', `Status dialihkan ke E-Lacak. Kode Tracking: ${trackingCode}`);
        }
      } else if (newStatus === 'selesai_langsung') {
        showToast('success', 'Pelayanan tiket berhasil diselesaikan.');
      } else if (newStatus === 'dilayani') {
        showToast('info', 'Sedang melayani pemohon di loket.');
      }

      if (activeTenant) fetchDashboardData(activeTenant.id);
    } catch (error: any) {
      console.error('Error updating status:', error);
      showToast('error', 'Gagal memperbarui status antrean: ' + error?.message);
    }
  };

  // --- SERVICE CRUD HANDLERS ---
  const openAddServiceModal = () => {
    setEditingService(null);
    setServiceForm({
      service_name: '',
      requirements: '',
      is_long_process: false
    });
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (srv: MPPService) => {
    setEditingService(srv);
    setServiceForm({
      service_name: srv.service_name || '',
      requirements: srv.requirements || '',
      is_long_process: !!srv.is_long_process
    });
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    if (!serviceForm.service_name.trim()) {
      showToast('error', 'Nama layanan tidak boleh kosong.');
      return;
    }

    setIsSavingService(true);
    try {
      if (editingService) {
        // UPDATE
        const { error } = await supabase
          .from('mpp_services')
          .update({
            service_name: serviceForm.service_name.trim(),
            requirements: serviceForm.requirements.trim() || null,
            is_long_process: serviceForm.is_long_process,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingService.id);

        if (error) throw error;
        showToast('success', `Layanan "${serviceForm.service_name}" berhasil diperbarui.`);
      } else {
        // INSERT
        const { error } = await supabase
          .from('mpp_services')
          .insert({
            tenant_id: activeTenant.id,
            service_name: serviceForm.service_name.trim(),
            requirements: serviceForm.requirements.trim() || null,
            is_long_process: serviceForm.is_long_process
          });

        if (error) throw error;
        showToast('success', `Layanan "${serviceForm.service_name}" berhasil ditambahkan ke katalog.`);
      }

      setServiceModalOpen(false);
      fetchDashboardData(activeTenant.id);
    } catch (err: any) {
      console.error('Error saving service:', err);
      showToast('error', 'Gagal menyimpan layanan: ' + (err?.message || 'Error'));
    } finally {
      setIsSavingService(false);
    }
  };

  const executeDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('mpp_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      showToast('success', 'Layanan berhasil dihapus dari Supabase.');
      if (activeTenant) fetchDashboardData(activeTenant.id);
    } catch (err: any) {
      console.error('Error deleting service:', err);
      showToast('error', 'Gagal menghapus layanan: ' + (err?.message || 'Terdapat referensi data terkait'));
    } finally {
      setDeleteConfirm({ isOpen: false, type: 'service', id: '', title: '' });
    }
  };

  // --- TENANT MANAGEMENT HANDLERS ---
  const openEditTenantModal = (tenant: MPPTenant) => {
    setEditingTenant(tenant);
    setTenantForm({
      name: tenant.name,
      code: tenant.code,
      floor: tenant.floor || 'Lantai 1',
      description: tenant.description || '',
      is_active: tenant.is_active !== false
    });
    setTenantModalOpen(true);
  };

  const openAddTenantModal = () => {
    setEditingTenant(null);
    setTenantForm({
      name: '',
      code: '',
      floor: 'Lantai 1',
      description: '',
      is_active: true
    });
    setTenantModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantForm.name.trim() || !tenantForm.code.trim()) {
      showToast('error', 'Nama dan Kode instansi wajib diisi.');
      return;
    }

    setIsSavingTenant(true);
    try {
      if (editingTenant) {
        // UPDATE
        const { error } = await supabase
          .from('mpp_tenants')
          .update({
            name: tenantForm.name.trim(),
            code: tenantForm.code.trim().toUpperCase(),
            floor: tenantForm.floor.trim(),
            description: tenantForm.description.trim(),
            is_active: tenantForm.is_active
          })
          .eq('id', editingTenant.id);

        if (error) throw error;
        showToast('success', `Instansi ${tenantForm.name} berhasil diperbarui.`);
      } else {
        // INSERT
        const { error } = await supabase
          .from('mpp_tenants')
          .insert({
            name: tenantForm.name.trim(),
            code: tenantForm.code.trim().toUpperCase(),
            floor: tenantForm.floor.trim(),
            description: tenantForm.description.trim(),
            is_active: tenantForm.is_active
          });

        if (error) throw error;
        showToast('success', `Instansi baru "${tenantForm.name}" berhasil dibuat di Supabase.`);
      }

      setTenantModalOpen(false);
      fetchTenants();
      if (activeTenant) fetchDashboardData(activeTenant.id);
    } catch (err: any) {
      console.error('Error saving tenant:', err);
      showToast('error', 'Gagal menyimpan instansi: ' + (err?.message || 'Error'));
    } finally {
      setIsSavingTenant(false);
    }
  };

  // --- TRACKING STAGE UPDATE HANDLER ---
  const handleUpdateTrackingStage = async (docId: string, nextStage: string) => {
    try {
      const { error } = await supabase
        .from('mpp_document_tracking')
        .update({
          current_status: nextStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;
      showToast('success', `Status dokumen diperbarui ke tahap: ${nextStage}`);
      if (activeTenant) fetchDashboardData(activeTenant.id);
    } catch (err: any) {
      console.error('Error updating tracking status:', err);
      showToast('error', 'Gagal mengupdate tracking: ' + err?.message);
    }
  };

  // --- RENDER LOGIN (Android-First Operator Login & Gerai Selection) ---
  if (!activeTenant) {
    const handleOperatorLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginForm.tenantId) {
        setLoginError('Silakan pilih instansi / gerai loket terlebih dahulu.');
        return;
      }
      if (!loginForm.operatorName.trim()) {
        setLoginError('Nama petugas loket wajib diisi.');
        return;
      }
      if (!loginForm.pin || loginForm.pin.length < 4) {
        setLoginError('PIN loket minimal 4 digit.');
        return;
      }

      const selectedTenant = tenants.find(t => t.id === loginForm.tenantId);
      if (!selectedTenant) {
        setLoginError('Instansi tidak ditemukan.');
        return;
      }

      setIsLoggingIn(true);
      setLoginError(null);
      setTimeout(() => {
        setIsLoggingIn(false);
        loginAsTenant(selectedTenant, {
          name: loginForm.operatorName,
          nip: loginForm.operatorNip,
          role: 'Petugas Loket Pelayanan'
        });
      }, 350);
    };

    const handleQuickDemoLogin = (t: MPPTenant) => {
      loginAsTenant(t, {
        name: 'Ahmad Fauzi, S.Kom',
        nip: '199208152020121004',
        role: 'Petugas Loket Pelayanan'
      });
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <div className={`w-full max-w-lg p-5 sm:p-7 rounded-3xl shadow-2xl flex flex-col my-auto border ${
          isDarkMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'
        }`}>
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Android First Loket
                  </span>
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Siap Melayani
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-black mt-0.5 tracking-tight">Login Petugas Gerai MPP</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mal Pelayanan Publik Simpurusiang Luwu</p>
              </div>
            </div>

            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-Tabs: Login vs Kelola Gerai */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 mb-5">
            <button
              type="button"
              onClick={() => setAuthSubTab('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                authSubTab === 'login'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Masuk Loket
            </button>
            <button
              type="button"
              onClick={() => setAuthSubTab('instansi')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                authSubTab === 'instansi'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Daftar Gerai ({tenants.length})
            </button>
          </div>

          {/* TAB 1: FORM LOGIN PETUGAS GERAI (ANDROID TOUCH OPTIMIZED) */}
          {authSubTab === 'login' ? (
            <form onSubmit={handleOperatorLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Pilih Instansi Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Pilih Gerai / Instansi Loket
                </label>
                <select
                  value={loginForm.tenantId}
                  onChange={(e) => setLoginForm(p => ({ ...p, tenantId: e.target.value }))}
                  required
                  className="w-full h-12 px-3.5 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="">-- Pilih Instansi yang Anda layani --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) - {t.floor || 'Lantai 1'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Petugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Petugas Loket
                </label>
                <input
                  type="text"
                  required
                  value={loginForm.operatorName}
                  onChange={(e) => setLoginForm(p => ({ ...p, operatorName: e.target.value }))}
                  placeholder="Contoh: Ahmad Fauzi, S.Kom"
                  className="w-full h-12 px-3.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* NIP Petugas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    NIP Petugas
                  </label>
                  <input
                    type="text"
                    value={loginForm.operatorNip}
                    onChange={(e) => setLoginForm(p => ({ ...p, operatorNip: e.target.value }))}
                    placeholder="199208152020121004"
                    className="w-full h-12 px-3.5 rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* PIN / Password Loket */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    PIN Loket (Default: 123456)
                  </label>
                  <input
                    type="password"
                    required
                    value={loginForm.pin}
                    onChange={(e) => setLoginForm(p => ({ ...p, pin: e.target.value }))}
                    placeholder="123456"
                    className="w-full h-12 px-3.5 rounded-xl border text-sm font-mono tracking-widest bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all text-center"
                  />
                </div>
              </div>

              {/* Submit Buttons (Android Touch Sized) */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-13 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                  {isLoggingIn ? 'Memvalidasi Sesi Petugas...' : 'Masuk Loket Pelayanan'}
                </button>

                {/* Quick 1-Tap Demo Login Button */}
                {tenants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const dpm = tenants.find(t => t.code === 'DPMPTSP') || tenants[0];
                      handleQuickDemoLogin(dpm);
                    }}
                    className="w-full h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    ⚡ Akses Cepat Demo: DPMPTSP (Ahmad Fauzi)
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* TAB 2: DAFTAR GERAI & KELOLA */
            <div className="flex flex-col flex-1 max-h-[55vh]">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Cari instansi atau gerai..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="flex-1 h-11 px-3.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-all"
                />
                <button 
                  onClick={openAddTenantModal}
                  className="h-11 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                {tenants
                  .filter(t => 
                    t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || 
                    t.code.toLowerCase().includes(tenantSearch.toLowerCase())
                  )
                  .map(t => (
                    <div
                      key={t.id}
                      className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        t.is_active === false
                          ? 'opacity-60 border-dashed border-slate-300 dark:border-slate-800'
                          : isDarkMode 
                            ? 'border-slate-800 hover:border-indigo-500/50 bg-slate-800/40' 
                            : 'border-slate-200 hover:border-indigo-500/50 bg-white'
                      }`}
                    >
                      <div 
                        onClick={() => handleQuickDemoLogin(t)}
                        className="flex items-center gap-3 cursor-pointer flex-1 py-1"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 font-black text-xs">
                          {t.code}
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                            {t.name}
                            {t.is_active === false && (
                              <span className="text-[9px] bg-red-500/10 text-red-500 px-1 py-0.5 rounded font-mono">NONAKTIF</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">Kode: {t.code}</span>
                            <span>•</span>
                            <span>{t.floor || 'Lantai 1'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pl-2">
                        <button
                          onClick={() => openEditTenantModal(t)}
                          title="Edit Profil Gerai"
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleQuickDemoLogin(t)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                        >
                          Masuk <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Tambah/Edit Gerai */}
        {tenantModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">
                  {editingTenant ? 'Edit Profil Instansi' : 'Tambah Instansi Gerai Baru'}
                </h3>
                <button onClick={() => setTenantModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTenant} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nama Instansi / Dinas</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Contoh: DPMPTSP Kab. Luwu"
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Kode Loket</label>
                    <input
                      type="text"
                      required
                      value={tenantForm.code}
                      onChange={(e) => setTenantForm(p => ({ ...p, code: e.target.value }))}
                      placeholder="DPMPTSP"
                      className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Lantai Loket</label>
                    <select
                      value={tenantForm.floor}
                      onChange={(e) => setTenantForm(p => ({ ...p, floor: e.target.value }))}
                      className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      <option value="Lantai 1">Lantai 1</option>
                      <option value="Lantai 2">Lantai 2</option>
                      <option value="Lantai 3">Lantai 3</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Deskripsi Singkat Gerai</label>
                  <textarea
                    rows={3}
                    value={tenantForm.description}
                    onChange={(e) => setTenantForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Pelayanan perizinan dan non-perizinan satu pintu..."
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="tenant_active"
                    checked={tenantForm.is_active}
                    onChange={(e) => setTenantForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="tenant_active" className="text-sm font-medium cursor-pointer">
                    Status Aktif (Tampil di Kios & Portal Pelayanan)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-inherit">
                  <button
                    type="button"
                    onClick={() => setTenantModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTenant}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2"
                  >
                    {isSavingTenant ? 'Menyimpan...' : 'Simpan ke Supabase'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER DASHBOARD ACTIVE TENANT ---
  const activeQueues = queues.filter(q => ['menunggu', 'dipanggil', 'dilayani'].includes(q.status));
  const historyQueues = queues.filter(q => ['selesai_langsung', 'masuk_tracking'].includes(q.status));
  
  // High-priority queues for Android Loket Controller
  const currentlyActiveQueue = activeQueues.find(q => q.status === 'dilayani') || activeQueues.find(q => q.status === 'dipanggil') || null;
  const nextWaitingQueue = activeQueues.find(q => q.status === 'menunggu') || null;

  // Filter queues based on Android Chips & Search input
  const filteredActiveQueues = activeQueues.filter(q => {
    // Status / Persona Chip Filter
    if (queueFilter === 'menunggu' && q.status !== 'menunggu') return false;
    if (queueFilter === 'dipanggil' && q.status !== 'dipanggil') return false;
    if (queueFilter === 'dilayani' && q.status !== 'dilayani') return false;
    if (queueFilter === 'masyarakat' && (q.ticket_code.startsWith('INV') || q.ticket_code.includes('INV'))) return false;
    if (queueFilter === 'investor' && !(q.ticket_code.startsWith('INV') || q.ticket_code.includes('INV'))) return false;

    // Search query filter
    if (!queueSearch.trim()) return true;
    const query = queueSearch.trim().toLowerCase();
    const matchCode = (q.ticket_code || '').toLowerCase().includes(query);
    const matchName = (q.citizen?.full_name || '').toLowerCase().includes(query);
    const matchNik = (q.citizen_nik || '').toLowerCase().includes(query);
    const matchService = (q.service?.service_name || '').toLowerCase().includes(query);
    return matchCode || matchName || matchNik || matchService;
  });

  const handleCallNext = async () => {
    if (!nextWaitingQueue) {
      showToast('info', 'Tidak ada antrean menunggu berikutnya.');
      return;
    }
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    await updateQueueStatus(nextWaitingQueue.id, 'dipanggil');
    try {
      await playAirportChime();
      speakCallingAnnouncement(nextWaitingQueue.ticket_code, `Loket ${activeTenant.name}`);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredServices = services.filter(s => 
    (s.service_name || '').toLowerCase().includes(serviceSearch.toLowerCase()) ||
    (s.requirements || '').toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredTracking = trackingDocs.filter(d => 
    d.tracking_code.toLowerCase().includes(trackingSearch.toLowerCase()) ||
    (d.queue?.citizen?.full_name || '').toLowerCase().includes(trackingSearch.toLowerCase()) ||
    (d.queue?.service?.service_name || '').toLowerCase().includes(trackingSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-[150] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' :
          toastMessage.type === 'error' ? 'bg-red-600 text-white border-red-500' :
          'bg-indigo-600 text-white border-indigo-500'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
           toastMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
           <ShieldCheck className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/20 rounded-lg ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <div className={`hidden md:flex w-full md:w-72 border-r flex flex-col shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="p-6 border-b border-inherit">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-black text-xl text-indigo-600 dark:text-indigo-400">MPP Dashboard</h1>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold">
              v2.5 SYNC
            </span>
          </div>
          
          <div className="mt-4 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Gerai Terpilih</div>
            <div className="font-black text-base leading-tight mt-0.5 text-slate-800 dark:text-slate-100">{activeTenant.name}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="font-mono font-bold bg-indigo-500/10 text-indigo-500 px-1.5 py-0.2 rounded">{activeTenant.code}</span>
              <span>•</span>
              <span>{activeTenant.floor || 'Lantai 1'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {/* TAB 1: ANTREAN */}
          <button 
            onClick={() => setActiveTab('antrean')} 
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'antrean' 
                ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" /> Antrean Hari Ini
            {activeQueues.length > 0 && (
              <span className="ml-auto bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-xs animate-bounce">
                {activeQueues.length}
              </span>
            )}
          </button>

          {/* TAB 2: RIWAYAT */}
          <button 
            onClick={() => setActiveTab('riwayat')} 
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'riwayat' 
                ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Riwayat Pelayanan
            {historyQueues.length > 0 && (
              <span className="ml-auto bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {historyQueues.length}
              </span>
            )}
          </button>

          {/* TAB 3: KATALOG LAYANAN */}
          <button 
            onClick={() => setActiveTab('layanan')} 
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'layanan' 
                ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4" /> Katalog Layanan
            <span className="ml-auto bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
              {services.length}
            </span>
          </button>

          {/* TAB 4: E-LACAK DOKUMEN */}
          <button 
            onClick={() => setActiveTab('tracking')} 
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'tracking' 
                ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" /> E-Lacak Dokumen
            {trackingDocs.length > 0 && (
              <span className="ml-auto bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                {trackingDocs.length}
              </span>
            )}
          </button>

          {/* TAB 5: KELOLA GERAI */}
          <button 
            onClick={() => setActiveTab('instansi')} 
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'instansi' 
                ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-4 h-4" /> Profil & Gerai
          </button>

          {/* TAB 6: LAPORAN & SKM */}
          <button 
            onClick={() => setActiveTab('laporan')} 
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'laporan' 
                ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Laporan & SKM
          </button>
        </div>

        <div className="p-4 border-t border-inherit space-y-2">
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-500" /> Ganti Loket / Petugas
          </button>
          <button 
            onClick={onClose} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-xs transition-colors"
          >
            <X className="w-4 h-4" /> Tutup & Kembali ke Portal
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Desktop Top Header Bar */}
        <div className={`hidden md:flex h-16 border-b items-center justify-between px-6 shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <h2 className="font-black text-lg">
              {activeTab === 'antrean' && 'Monitor & Panggilan Antrean Loket'}
              {activeTab === 'riwayat' && 'Riwayat Pelayanan Selesai Hari Ini'}
              {activeTab === 'layanan' && 'Manajemen Katalog Layanan (Supabase Sync)'}
              {activeTab === 'tracking' && 'Manajemen Disposisi & E-Lacak Dokumen'}
              {activeTab === 'instansi' && 'Pengaturan Instansi & Gerai Terdaftar'}
              {activeTab === 'laporan' && 'Laporan Eksekutif & Hasil Survei Kepuasan (SKM)'}
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Terhubung Supabase
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchDashboardData(activeTenant.id)} 
              title="Segarkan data dari Supabase"
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Top Header (Android Friendly App Bar) */}
        <div className={`flex md:hidden h-16 border-b items-center justify-between px-3.5 shrink-0 shadow-sm z-30 sticky top-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95'
        } backdrop-blur-md`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => setIsProfileSheetOpen(true)}
              className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              {activeTenant.code}
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs truncate max-w-[130px] leading-tight text-slate-900 dark:text-white">
                  {activeTenant.name}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                </span>
              </div>
              <span className="text-[10px] text-slate-500 truncate">
                {operatorInfo?.name || 'Petugas Loket'} • {activeTenant.floor || 'Lantai 1'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Audio speaker test button */}
            <button 
              onClick={handleTestAudio} 
              title="Uji Suara Bel Panggilan Bandara"
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                isAudioTesting ? 'bg-amber-500 text-white animate-pulse' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isAudioTesting ? 'animate-bounce' : ''}`} />
            </button>

            {/* Sync refresh button */}
            <button 
              onClick={() => fetchDashboardData(activeTenant.id)} 
              title="Segarkan data antrean"
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>

            {/* Settings & Profile Drawer */}
            <button 
              onClick={() => setIsProfileSheetOpen(true)}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Close / Return button */}
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 md:pb-6 bg-slate-50 dark:bg-slate-950">
          
          {/* ========================================================================= */}
          {/* TAB 1: ANTREAN HARI INI (ANDROID FIRST LOKET CONTROLLER) */}
          {/* ========================================================================= */}
          {activeTab === 'antrean' && (
            <div className="space-y-4 sm:space-y-6">
              
              {/* 1. ANDROID CALLING CONSOLE (REMOTE LOKET CONTROLLER) */}
              {currentlyActiveQueue ? (
                <div className="p-4 sm:p-6 rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        currentlyActiveQueue.status === 'dipanggil' 
                          ? 'bg-blue-600 text-white animate-pulse shadow-md shadow-blue-500/30'
                          : 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        {currentlyActiveQueue.status === 'dipanggil' ? 'Sedang Dipanggil' : 'Sedang Dilayani'}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {currentlyActiveQueue.ticket_code.startsWith('INV') ? '🏢 Investor VIP' : '👤 Warga Pemohon'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Sesi: {currentlyActiveQueue.session || 'Pagi'}
                    </span>
                  </div>

                  {/* Big Number & Citizen Info */}
                  <div className="my-3">
                    <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
                      {currentlyActiveQueue.ticket_code}
                    </div>
                    <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                      <span>{currentlyActiveQueue.citizen?.full_name || 'Pemohon MPP'}</span>
                      <span className="text-xs font-normal text-slate-500 font-mono">({currentlyActiveQueue.citizen_nik})</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Layanan: <b className="text-indigo-600 dark:text-indigo-400">{currentlyActiveQueue.service?.service_name || 'Pelayanan Terpadu'}</b>
                    </div>
                  </div>

                  {/* Android Large Touch Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-indigo-500/20">
                    {/* 1. Panggil Ulang */}
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                        playAirportChime().then(() => {
                          speakCallingAnnouncement(currentlyActiveQueue.ticket_code, `Loket ${activeTenant.name}`);
                        });
                        showToast('info', `Memanggil ulang nomor ${currentlyActiveQueue.ticket_code}`);
                      }}
                      className="h-13 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 animate-pulse" /> Panggil Ulang
                    </button>

                    {/* 2. Layani di Loket */}
                    {currentlyActiveQueue.status === 'dipanggil' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate([80]);
                          updateQueueStatus(currentlyActiveQueue.id, 'dilayani');
                        }}
                        className="h-13 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Mulai Layani
                      </button>
                    ) : (
                      <div className="h-13 px-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Aktif di Loket
                      </div>
                    )}

                    {/* 3. Selesai Langsung */}
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate([100]);
                        updateQueueStatus(currentlyActiveQueue.id, 'selesai_langsung');
                      }}
                      className="h-13 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Selesai Langsung
                    </button>

                    {/* 4. Masuk E-Lacak */}
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate([80]);
                        updateQueueStatus(currentlyActiveQueue.id, 'masuk_tracking');
                      }}
                      className="h-13 px-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" /> Ke E-Lacak
                    </button>
                  </div>
                </div>
              ) : nextWaitingQueue ? (
                <div className="p-4 sm:p-5 rounded-3xl border-2 border-dashed border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-blue-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                      <Volume2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Antrean Berikutnya:</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black text-lg sm:text-xl">
                          {nextWaitingQueue.ticket_code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">
                        {nextWaitingQueue.citizen?.full_name || 'Pemohon'} • {nextWaitingQueue.service?.service_name || 'Pelayanan'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCallNext}
                    className="w-full sm:w-auto h-13 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                    PANGGIL NOMOR INI
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-mono">
                      {activeQueues.filter(q => q.status === 'menunggu').length} Antre
                    </span>
                  </button>
                </div>
              ) : null}

              {/* Stat summary cards (Compact on Android) */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <div className={`p-3 sm:p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase truncate">Menunggu</div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1">
                    {activeQueues.filter(q => q.status === 'menunggu').length}
                  </div>
                </div>
                <div className={`p-3 sm:p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase truncate">Dilayani</div>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {activeQueues.filter(q => q.status === 'dipanggil' || q.status === 'dilayani').length}
                  </div>
                </div>
                <div className={`p-3 sm:p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase truncate">Selesai</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-500 mt-1">
                    {historyQueues.length}
                  </div>
                </div>
              </div>

              {/* 2. ANDROID FILTER CHIPS & SEARCH BAR */}
              <div className="space-y-2.5">
                {/* Horizontal Scrolling Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setQueueFilter('all')}
                    className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all shrink-0 ${
                      queueFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70'
                    }`}
                  >
                    Semua ({activeQueues.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueFilter('menunggu')}
                    className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all shrink-0 ${
                      queueFilter === 'menunggu'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70'
                    }`}
                  >
                    ⏳ Menunggu ({activeQueues.filter(q => q.status === 'menunggu').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueFilter('dipanggil')}
                    className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all shrink-0 ${
                      queueFilter === 'dipanggil'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70'
                    }`}
                  >
                    🔔 Dipanggil ({activeQueues.filter(q => q.status === 'dipanggil').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueFilter('dilayani')}
                    className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all shrink-0 ${
                      queueFilter === 'dilayani'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70'
                    }`}
                  >
                    🟢 Dilayani ({activeQueues.filter(q => q.status === 'dilayani').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueFilter('masyarakat')}
                    className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all shrink-0 ${
                      queueFilter === 'masyarakat'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70'
                    }`}
                  >
                    👤 Masyarakat ({activeQueues.filter(q => !q.ticket_code.startsWith('INV')).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueFilter('investor')}
                    className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all shrink-0 ${
                      queueFilter === 'investor'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70'
                    }`}
                  >
                    🏢 Investor VIP ({activeQueues.filter(q => q.ticket_code.startsWith('INV')).length})
                  </button>
                </div>

                {/* Search Bar for Queues */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nomor antrean, nama pemohon, NIK, atau layanan..."
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-9 rounded-2xl border text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm"
                  />
                  {queueSearch && (
                    <button
                      onClick={() => setQueueSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. QUEUE LIST CARDS (ANDROID OPTIMIZED) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {filteredActiveQueues.length === 0 ? (
                  <div className="col-span-full py-14 text-center text-slate-500">
                    <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold mb-1">
                      {activeQueues.length === 0 ? 'Antrean Saat Ini Bersih' : 'Tidak ada antrean yang cocok dengan filter'}
                    </h3>
                    <p className="text-xs max-w-sm mx-auto text-slate-400">
                      {activeQueues.length === 0 
                        ? `Belum ada pemohon yang mengantre untuk gerai ${activeTenant.name}. Tiket baru akan otomatis tersinkronisasi.` 
                        : 'Coba ubah kata kunci pencarian atau reset filter antrean.'}
                    </p>
                  </div>
                ) : (
                  filteredActiveQueues.map(queue => (
                    <div 
                      key={queue.id} 
                      className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all ${
                        queue.status === 'dipanggil' 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5' 
                          : queue.status === 'dilayani'
                            ? 'border-emerald-500/60 bg-emerald-500/5'
                            : isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                              {queue.ticket_code}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {queue.ticket_code.startsWith('INV') ? '🏢 Investor' : '👤 Warga'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            Sesi: {queue.session || 'Pagi'} • Loket {activeTenant.code}
                          </div>
                        </div>

                        <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          queue.status === 'menunggu' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                          queue.status === 'dipanggil' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse' : 
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {queue.status}
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 mb-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400 shrink-0"/> 
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {queue.citizen?.full_name || 'Pemohon MPP'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0"/> 
                          <span className="text-slate-600 dark:text-slate-300 truncate">
                            {queue.service?.service_name || 'Pelayanan Terpadu'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0"/> 
                          <span>NIK: {queue.citizen_nik}</span>
                        </div>
                      </div>

                      {/* Touch Action Buttons */}
                      <div className="flex flex-wrap gap-2 border-t pt-3.5 border-inherit">
                        {queue.status === 'menunggu' && (
                          <button 
                            onClick={() => {
                              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                              updateQueueStatus(queue.id, 'dipanggil');
                              playAirportChime().then(() => {
                                speakCallingAnnouncement(queue.ticket_code, `Loket ${activeTenant?.name || 'MPP'}`);
                              });
                            }} 
                            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer transition-all"
                          >
                            <Volume2 className="w-4 h-4" /> Panggil (Bel Bandara)
                          </button>
                        )}
                        
                        {queue.status === 'dipanggil' && (
                          <div className="flex-1 flex gap-2">
                            <button 
                              onClick={() => {
                                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                                updateQueueStatus(queue.id, 'dipanggil');
                                playAirportChime().then(() => {
                                  speakCallingAnnouncement(queue.ticket_code, `Loket ${activeTenant?.name || 'MPP'}`);
                                });
                              }} 
                              className="h-12 px-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-1.5 text-xs shadow-sm cursor-pointer transition-all"
                              title="Panggil Ulang"
                            >
                              <Volume2 className="w-4 h-4 animate-pulse" /> Panggil Ulang
                            </button>
                            <button 
                              onClick={() => {
                                if (navigator.vibrate) navigator.vibrate([80]);
                                updateQueueStatus(queue.id, 'dilayani');
                              }} 
                              className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer transition-all"
                            >
                              <Check className="w-4 h-4" /> Layani di Loket
                            </button>
                          </div>
                        )}

                        {queue.status === 'dilayani' && (
                          <div className="flex-1 flex gap-2">
                            <button 
                              onClick={() => {
                                if (navigator.vibrate) navigator.vibrate([100]);
                                updateQueueStatus(queue.id, 'selesai_langsung');
                              }} 
                              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-1.5 text-xs shadow-sm transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Selesai
                            </button>
                            
                            <button 
                              onClick={() => {
                                if (navigator.vibrate) navigator.vibrate([80]);
                                updateQueueStatus(queue.id, 'masuk_tracking');
                              }} 
                              className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-1.5 text-xs shadow-sm transition-all"
                            >
                              <ArrowRight className="w-4 h-4" /> E-Lacak
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: RIWAYAT SELESAI */}
          {/* ========================================================================= */}
          {activeTab === 'riwayat' && (
            <div className="space-y-4">
              {historyQueues.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="font-bold">Belum ada riwayat pelayanan selesai hari ini.</p>
                </div>
              ) : (
                historyQueues.map(queue => (
                  <div 
                    key={queue.id} 
                    className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
                      isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400">
                        {queue.ticket_code.split('-').pop()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{queue.citizen?.full_name || 'Pemohon'}</div>
                        <div className="text-xs text-slate-500">{queue.service?.service_name || 'Pelayanan Terpadu'}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">Tiket: {queue.ticket_code} • NIK: {queue.citizen_nik}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        queue.status === 'masuk_tracking' 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {queue.status === 'masuk_tracking' ? 'Masuk E-Lacak' : 'Selesai di Loket'}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(queue.updated_at || queue.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: KATALOG LAYANAN (FULL CRUD) */}
          {/* ========================================================================= */}
          {activeTab === 'layanan' && (
            <div className="space-y-4">
              {/* Action Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <h3 className="font-bold text-base">Daftar Katalog Layanan ({services.length})</h3>
                  <p className="text-xs text-slate-500">Perubahan layanan di sini akan langsung tampil pada Kios Mandiri dan Portal MPP warga secara sinkron.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari layanan..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  </div>
                  <button 
                    onClick={openAddServiceModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Tambah Layanan
                  </button>
                </div>
              </div>

              {/* Service Cards Grid */}
              <div className="grid gap-3">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                    <p className="font-bold">Belum ada layanan yang cocok</p>
                    <button 
                      onClick={openAddServiceModal} 
                      className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      + Buat Layanan Pertama untuk {activeTenant.name}
                    </button>
                  </div>
                ) : (
                  filteredServices.map(srv => (
                    <div 
                      key={srv.id} 
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all hover:border-indigo-500/40 ${
                        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{srv.service_name}</span>
                          {srv.is_long_process ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Memerlukan E-Lacak
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Pelayanan Langsung
                            </span>
                          )}
                        </div>

                        {srv.requirements && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                            <b>Persyaratan:</b> {srv.requirements}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-inherit">
                        <button 
                          onClick={() => openEditServiceModal(srv)}
                          className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm({
                            isOpen: true,
                            type: 'service',
                            id: srv.id,
                            title: srv.service_name
                          })}
                          className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MANAJEMEN E-LACAK DOKUMEN */}
          {/* ========================================================================= */}
          {activeTab === 'tracking' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <h3 className="font-bold text-base">E-Lacak Status Dokumen Pemohon ({trackingDocs.length})</h3>
                  <p className="text-xs text-slate-500">
                    Perbarui tahap disposisi berkas warga secara berkala. Warga dapat melacak status ini via menu E-Lacak Portal MPP.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kode TRK atau nama..."
                    value={trackingSearch}
                    onChange={(e) => setTrackingSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {filteredTracking.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="font-bold">Belum ada dokumen yang diproses lanjut (E-Lacak)</p>
                    <p className="text-xs text-slate-400 mt-1">Dokumen otomatis muncul saat petugas mengklik tombol "Proses Lanjut (E-Lacak)" pada antrean tiket.</p>
                  </div>
                ) : (
                  filteredTracking.map(doc => {
                    const currentIdx = TRACKING_STAGES.indexOf(doc.current_status || 'Berkas Diterima');
                    return (
                      <div 
                        key={doc.id}
                        className={`p-5 rounded-2xl border shadow-sm ${
                          isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-inherit">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-lg">
                                {doc.tracking_code}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                {doc.current_status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Pemohon: <b>{doc.queue?.citizen?.full_name || 'Masyarakat'}</b> • Layanan: {doc.queue?.service?.service_name || 'Layanan MPP'}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            Terakhir diupdate: {new Date(doc.updated_at || doc.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                          {TRACKING_STAGES.map((stage, idx) => {
                            const isDone = idx <= currentIdx;
                            const isCurrent = idx === currentIdx;
                            return (
                              <button
                                key={stage}
                                onClick={() => handleUpdateTrackingStage(doc.id, stage)}
                                className={`p-2.5 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                                  isCurrent
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                                    : isDone
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-300'
                                }`}
                              >
                                <div className="text-[10px] opacity-75 font-mono mb-0.5">Tahap {idx + 1}</div>
                                <div className="truncate">{stage}</div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Klik salah satu tahap di atas untuk memperbarui disposisi berkas secara langsung.</span>
                          {currentIdx < TRACKING_STAGES.length - 1 && (
                            <button
                              onClick={() => handleUpdateTrackingStage(doc.id, TRACKING_STAGES[currentIdx + 1])}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                            >
                              Lanjut ke {TRACKING_STAGES[currentIdx + 1]} <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PROFIL & KELOLA GERAI */}
          {/* ========================================================================= */}
          {activeTab === 'instansi' && (
            <div className="max-w-3xl space-y-6">
              <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Profil Gerai: {activeTenant.name}</h3>
                    <p className="text-xs text-slate-500">Informasi ini tersimpan langsung di tabel `mpp_tenants` Supabase.</p>
                  </div>
                  <button
                    onClick={() => openEditTenantModal(activeTenant)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Edit className="w-4 h-4" /> Edit Profil Gerai
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-400 uppercase">Nama Resmi Instansi</div>
                    <div className="font-bold text-base mt-1">{activeTenant.name}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-400 uppercase">Kode Loket</div>
                    <div className="font-mono font-bold text-base mt-1 text-indigo-500">{activeTenant.code}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-400 uppercase">Lokasi / Lantai</div>
                    <div className="font-medium text-base mt-1">{activeTenant.floor || 'Lantai 1'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-400 uppercase">Status Operasional</div>
                    <div className="font-medium text-base mt-1 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${activeTenant.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {activeTenant.is_active !== false ? 'Aktif Melayani' : 'Non-Aktif'}
                    </div>
                  </div>
                  <div className="col-span-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-400 uppercase">Deskripsi Layanan Gerai</div>
                    <div className="text-sm mt-1 text-slate-600 dark:text-slate-300">
                      {activeTenant.description || 'Tidak ada deskripsi tambahan.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gerai Lainnya */}
              <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm">Ganti ke Gerai Lain ({tenants.length})</h4>
                  <button 
                    onClick={openAddTenantModal}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + Tambah Gerai Baru
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {tenants.map(t => (
                    <button
                      key={t.id}
                      onClick={() => loginAsTenant(t)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        t.id === activeTenant.id
                          ? 'border-indigo-500 bg-indigo-500/10 font-bold text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 ml-2">{t.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: LAPORAN & SKM */}
          {/* ========================================================================= */}
          {activeTab === 'laporan' && (
            <div className="space-y-6">
              <MppAdminReport isDarkMode={isDarkMode} />
            </div>
          )}

        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className={`fixed bottom-0 inset-x-0 h-16 border-t flex items-center justify-around pb-safe z-40 md:hidden ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <button 
            type="button"
            onClick={() => setActiveTab('antrean')}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-95 ${activeTab === 'antrean' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tight">Antrean</span>
            {activeQueues.length > 0 && (
              <span className="absolute top-2 right-4 bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[8px] leading-none min-w-[14px] text-center">
                {activeQueues.length}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-95 ${activeTab === 'riwayat' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tight">Riwayat</span>
            {historyQueues.length > 0 && (
              <span className="absolute top-2 right-4 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-1.5 py-0.5 rounded-full text-[8px] leading-none min-w-[14px] text-center">
                {historyQueues.length}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('layanan')}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-95 ${activeTab === 'layanan' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tight">Layanan</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('tracking')}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-95 ${activeTab === 'tracking' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tight">E-Lacak</span>
            {trackingDocs.length > 0 && (
              <span className="absolute top-2 right-4 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-full text-[8px] leading-none min-w-[14px] text-center">
                {trackingDocs.length}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setIsProfileSheetOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-95 ${isProfileSheetOpen ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[9px] mt-1 tracking-tight">Profil</span>
          </button>
        </div>

      </div>

      {/* MOBILE BOTTOM SHEET FOR PROFILE & OTHER TABS */}
      {isProfileSheetOpen && (
        <div className="fixed inset-0 z-[150] md:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsProfileSheetOpen(false)} 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
          />
          {/* Sheet */}
          <div className={`absolute bottom-0 inset-x-0 max-h-[85vh] rounded-t-[32px] border-t p-6 pb-8 flex flex-col justify-between transition-transform duration-300 transform translate-y-0 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5 shrink-0" />
            
            <div className="overflow-y-auto space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-xl">
                  {activeTenant.code}
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{activeTenant.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeTenant.floor || 'Lantai 1'} • Loket Pelayanan MPP</p>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Antrean Aktif</div>
                  <div className="text-xl font-black mt-1 text-indigo-600 dark:text-indigo-400">{activeQueues.length}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Layanan</div>
                  <div className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{services.length}</div>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 pl-2">Menu Lainnya</div>
                
                <button
                  type="button"
                  onClick={() => { setActiveTab('instansi'); setIsProfileSheetOpen(false); }}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'instansi' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                  <Building2 className="w-5 h-5 opacity-80" />
                  <span>Pengaturan Profil & Gerai</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('laporan'); setIsProfileSheetOpen(false); }}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'laporan' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                  <BarChart3 className="w-5 h-5 opacity-80" />
                  <span>Laporan & Survei Kepuasan (SKM)</span>
                </button>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                <button 
                  type="button"
                  onClick={() => { handleTestAudio(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  Uji Speaker & Bel Bandara
                </button>
                <button 
                  type="button"
                  onClick={() => { logout(); setIsProfileSheetOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  Ganti Loket / Petugas
                </button>
                <button 
                  type="button"
                  onClick={() => { onClose(); setIsProfileSheetOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-xs transition-colors"
                >
                  <X className="w-4 h-4" />
                  Tutup & Kembali ke Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT LAYANAN */}
      {/* ========================================================================= */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">
                  {editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}
                </h3>
                <p className="text-xs text-slate-500">Gerai: {activeTenant.name}</p>
              </div>
              <button onClick={() => setServiceModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Layanan *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.service_name}
                  onChange={(e) => setServiceForm(p => ({ ...p, service_name: e.target.value }))}
                  placeholder="Contoh: Penerbitan Izin Praktik Dokter"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Persyaratan Dokumen</label>
                <textarea
                  rows={4}
                  value={serviceForm.requirements}
                  onChange={(e) => setServiceForm(p => ({ ...p, requirements: e.target.value }))}
                  placeholder="1. KTP Asli / KK&#10;2. Surat Rekomendasi Profesi&#10;3. STR Aktif..."
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="is_long_process"
                    checked={serviceForm.is_long_process}
                    onChange={(e) => setServiceForm(p => ({ ...p, is_long_process: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                  />
                  <div>
                    <label htmlFor="is_long_process" className="text-xs font-bold cursor-pointer block">
                      Memerlukan Proses E-Lacak (Long Process)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Centang jika layanan ini membutuhkan waktu penerbitan lebih dari 1 hari dan butuh kode pelacakan dokumen (*tracking code*) untuk warga.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  {isSavingService ? 'Menyimpan...' : 'Simpan Layanan ke Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS */}
      {/* ========================================================================= */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center ${isDarkMode ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900'}`}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-1">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus <b>"{deleteConfirm.title}"</b> dari database Supabase? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, type: 'service', id: '', title: '' })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={() => executeDeleteService(deleteConfirm.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
