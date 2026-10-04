import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Building2, FileText, User, CheckCircle2, Search, ArrowRight, 
  Loader2, Ticket, AlertCircle, Check, Accessibility, ShieldCheck, 
  MapPin, Eye, EyeOff, Lock, Smartphone, Printer, Copy, Sparkles,
  Calendar, Clock
} from 'lucide-react';
import { supabase, safeFetchLayerData } from '../../lib/supabaseClient';
import { MPPTenant, MPPService, MPPCitizen } from '../../types/mpp';
import { KioskAudioEngine } from './MppKioskAudioAnnouncer';

export interface PendaftaranAntreanModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  initialAgency?: string;
  initialService?: string;
  onSuccess?: (ticket: any) => void;
}

export const PendaftaranAntreanModal: React.FC<PendaftaranAntreanModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = false,
  initialAgency,
  initialService,
  onSuccess
}) => {
  const [step, setStep] = useState<number>(1);
  const [tenants, setTenants] = useState<MPPTenant[]>([]);
  const [services, setServices] = useState<MPPService[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<MPPTenant | null>(null);
  const [selectedService, setSelectedService] = useState<MPPService | null>(null);

  // Form Fields
  const [nik, setNik] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [occupation, setOccupation] = useState('Wiraswasta / Pelaku Usaha');
  const [isPriorityLane, setIsPriorityLane] = useState(false);
  const [queueDate, setQueueDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<'pagi' | 'siang'>('pagi');

  // GIS Regional Selection
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedDesa, setSelectedDesa] = useState('');
  const [loadingKecamatan, setLoadingKecamatan] = useState(false);
  const [loadingDesa, setLoadingDesa] = useState(false);

  // Status & Validation
  const [isSearchingNik, setIsSearchingNik] = useState(false);
  const [nikVerifiedNotice, setNikVerifiedNotice] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [issuedTicket, setIssuedTicket] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Helpers
  const isNikValid = (val: string) => /^\d{16}$/.test(val);
  const isPhoneValid = (val: string) => {
    if (!val) return false;
    const clean = val.replace(/[^\d+]/g, '');
    const norm = clean.startsWith('+62') ? '0' + clean.slice(3) : clean.startsWith('62') ? '0' + clean.slice(2) : clean;
    return /^08[1-9][0-9]{7,11}$/.test(norm);
  };
  const isNameValid = (val: string) => !!val && val.trim().length >= 3;

  // Load Tenants & GIS upon open + Escape key handler
  useEffect(() => {
    if (isOpen) {
      fetchTenants();
      fetchKecamatan();
      checkActiveUser();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
      resetForm();
    }
  }, [isOpen, onClose]);

  const checkActiveUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const meta = user.user_metadata || {};
        const autoNik = profile?.nik || meta.nik || '';
        const autoName = profile?.full_name || meta.full_name || '';
        const autoPhone = profile?.phone || profile?.no_whatsapp || meta.phone || '';

        if (autoNik) setNik(autoNik);
        if (autoName) setFullName(autoName);
        if (autoPhone) setPhoneNumber(autoPhone);
      }
    } catch (e) {
      console.warn('[PendaftaranAntreanModal] Active user check note:', e);
    }
  };

  const fetchTenants = async () => {
    try {
      const { data } = await supabase
        .from('mpp_tenants')
        .select('*')
        .order('name');
      if (data && data.length > 0) {
        setTenants(data as MPPTenant[]);
        if (initialAgency) {
          const matched = data.find((t: any) => t.name.toLowerCase().includes(initialAgency.toLowerCase()));
          if (matched) {
            setSelectedTenant(matched as MPPTenant);
            fetchServices(matched.id);
            setStep(2);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };

  const fetchServices = async (tenantId: string) => {
    try {
      const { data } = await supabase
        .from('mpp_services')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('service_name');
      if (data) {
        setServices(data as MPPService[]);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchKecamatan = async () => {
    setLoadingKecamatan(true);
    try {
      const data = await safeFetchLayerData('gis_kecamatan');
      if (data) {
        const list = (data.type === 'FeatureCollection' ? data.features : Array.isArray(data) ? data : [])
          .map((f: any) => ({
            id: f.id || f.properties?.id,
            name: f.properties?.nama_kecamatan || f.properties?.name || f.name || 'Kecamatan'
          }));
        setKecamatanList(list);
      }
    } catch (e) {
      console.warn('Error loading kecamatan:', e);
    } finally {
      setLoadingKecamatan(false);
    }
  };

  const fetchDesa = async (kecName: string) => {
    setLoadingDesa(true);
    try {
      const data = await safeFetchLayerData('gis_desa');
      if (data) {
        const list = (data.type === 'FeatureCollection' ? data.features : Array.isArray(data) ? data : [])
          .filter((f: any) => {
            const kProp = f.properties?.kecamatan || f.properties?.wadmkc || '';
            return !kecName || kProp.toLowerCase() === kecName.toLowerCase();
          })
          .map((f: any) => ({
            id: f.id || f.properties?.id,
            name: f.properties?.nama_desa || f.properties?.name || f.name || 'Desa'
          }));
        setDesaList(list);
      }
    } catch (e) {
      console.warn('Error loading desa:', e);
    } finally {
      setLoadingDesa(false);
    }
  };

  const handleNikSearch = async (targetNik?: string) => {
    const searchNik = targetNik || nik;
    if (searchNik.length !== 16) return;
    setIsSearchingNik(true);
    setSubmitError(null);
    try {
      const { data } = await supabase
        .from('mpp_citizens')
        .select('*')
        .eq('nik', searchNik)
        .maybeSingle();

      if (data) {
        setFullName(data.full_name || data.nama_lengkap || '');
        setPhoneNumber(data.phone_number || data.no_hp || '');
        setGender((data.gender || data.jenis_kelamin || 'Laki-laki') as 'Laki-laki' | 'Perempuan');
        setOccupation(data.occupation || data.pekerjaan || 'Wiraswasta / Pelaku Usaha');
        if (data.kecamatan) {
          setSelectedKecamatan(data.kecamatan);
          fetchDesa(data.kecamatan);
        }
        if (data.desa) setSelectedDesa(data.desa);
        setNikVerifiedNotice(`Data warga terverifikasi otomatis: ${data.full_name || data.nama_lengkap}`);
      } else {
        setNikVerifiedNotice(null);
      }
    } catch (err) {
      console.warn('NIK search note:', err);
    } finally {
      setIsSearchingNik(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedTenant(null);
    setSelectedService(null);
    setNik('');
    setFullName('');
    setPhoneNumber('');
    setPassword('');
    setShowPassword(false);
    setFormErrors({});
    setTouched({});
    setSubmitError(null);
    setNikVerifiedNotice(null);
    setIssuedTicket(null);
  };

  // Form submission with atomic Triple-Table DB Sync
  const handleSubmitRegistration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTenant || !selectedService) {
      setSubmitError('Pilih instansi dan layanan terlebih dahulu.');
      return;
    }

    const errors: { [key: string]: string } = {};
    if (!isNikValid(nik)) errors.nik = 'NIK harus tepat 16 digit angka';
    if (!isNameValid(fullName)) errors.fullName = 'Nama lengkap minimal 3 karakter';
    if (!isPhoneValid(phoneNumber)) errors.phoneNumber = 'Nomor WhatsApp harus diawali 08/628 (10-14 digit)';
    if (password && password.length < 6) errors.password = 'Kata sandi minimal 6 karakter jika diisi';

    setTouched({ nik: true, fullName: true, phoneNumber: true, password: true });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitError('Mohon periksa format isian form yang ditandai merah.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

      // Panggilan ke API Backend Atomic Triple-Table DB Sync (/api/mpp/register-citizen)
      const res = await fetch('/api/mpp/register-citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik,
          nama_lengkap: fullName.trim(),
          no_hp: cleanPhone || null,
          password: password.trim() || undefined,
          jenis_kelamin: gender,
          pekerjaan: occupation,
          tenant_id: selectedTenant.id,
          service_id: selectedService.id,
          agency_name: selectedTenant.name,
          service_name: selectedService.service_name,
          queue_date: queueDate,
          session: session,
          is_priority: isPriorityLane,
          kecamatan: selectedKecamatan || null,
          desa: selectedDesa || null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memproses registrasi antrean.');
      }

      const verifiedUserId = data.activeUserId || `cit-${nik}`;
      const verifiedNik = data.citizenNik || nik;
      const verifiedName = data.citizenName || fullName.trim();
      const ticketObj = data.queue || data.ticket;

      // 3. Session Hydration
      sessionStorage.setItem('activeUserId', verifiedUserId);
      sessionStorage.setItem('citizenNik', verifiedNik);
      sessionStorage.setItem('citizenName', verifiedName);
      sessionStorage.setItem('luwu_user_role', 'citizen');
      localStorage.setItem('luwu_user_role', 'masyarakat');
      localStorage.setItem('luwu_user_nik', verifiedNik);
      localStorage.setItem('luwu_user_name', verifiedName);

      setIssuedTicket({
        ...ticketObj,
        tenant_name: selectedTenant.name,
        service_name: selectedService.service_name,
        applicant_name: verifiedName,
        applicant_nik: verifiedNik,
        session_label: session === 'pagi' ? 'Sesi Pagi (08:00 - 12:00 WITA)' : 'Sesi Siang (13:00 - 15:30 WITA)'
      });

      setStep(4);
      if (onSuccess) onSuccess(ticketObj);

      // Play audio announcement
      try {
        KioskAudioEngine.playSuccessSound();
      } catch (err) {
        // audio chime non-fatal
      }
    } catch (err: any) {
      console.error('[PendaftaranAntreanModal] Submit error:', err);
      setSubmitError(err.message || 'Terjadi gangguan koneksi ke server. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicket = () => {
    if (issuedTicket?.ticket_code) {
      navigator.clipboard.writeText(issuedTicket.ticket_code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[85dvh] border ${
          isDarkMode 
            ? 'border-white/10 text-white' 
            : 'border-slate-200 text-slate-900'
        }`}
      >
        {/* HEADER MODAL */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
                Layanan Mandiri MPP Simpurusiang
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Pendaftaran Antrean Digital
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEPPER PROGRESS */}
        <div className="shrink-0 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-white/5 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              step >= 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              1
            </span>
            <span className={step >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>Gerai</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              step >= 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              2
            </span>
            <span className={step >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>Layanan</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              step >= 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              3
            </span>
            <span className={step >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>Identitas</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              step === 4 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              4
            </span>
            <span className={step === 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>Tiket</span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: PILIH GERAI */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" /> Pilih Gerai / Instansi Tujuan
                </h3>
                <span className="text-[11px] text-slate-400">Total {tenants.length} Gerai</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {tenants.map((tItem) => (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={() => {
                      setSelectedTenant(tItem);
                      fetchServices(tItem.id);
                      setStep(2);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group hover:border-emerald-500 cursor-pointer ${
                      selectedTenant?.id === tItem.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDarkMode ? 'border-white/10 bg-slate-800/40' : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono">
                        {tItem.code || 'GERAI'} • {tItem.floor || 'Lantai 1'}
                      </div>
                      <div className="text-sm font-bold mt-0.5 line-clamp-1">{tItem.name}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PILIH LAYANAN */}
          {step === 2 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                &larr; Ganti Gerai / Instansi
              </button>
              <div>
                <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">
                  {selectedTenant?.code} • {selectedTenant?.floor}
                </span>
                <h3 className="font-extrabold text-base sm:text-lg">
                  Layanan di {selectedTenant?.name}
                </h3>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {services.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                    Belum ada data sub-layanan spesifik. Anda dapat langsung memilih layanan umum.
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedService({ id: 'srv-general', tenant_id: selectedTenant!.id, service_name: 'Pelayanan Umum Terpadu' } as any);
                        setStep(3);
                      }}
                      className="mt-3 block mx-auto px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
                    >
                      Pilih Pelayanan Umum Terpadu
                    </button>
                  </div>
                ) : (
                  services.map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => {
                        setSelectedService(srv);
                        setStep(3);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group hover:border-emerald-500 cursor-pointer ${
                        selectedService?.id === srv.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : isDarkMode ? 'border-white/10 bg-slate-800/40' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {srv.service_name}
                        </div>
                        {srv.estimated_time_minutes && (
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Estimasi: {srv.estimated_time_minutes} Menit
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 3: FORM REGISTRASI IDENTITAS & KATA SANDI */}
          {step === 3 && (
            <form onSubmit={handleSubmitRegistration} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                &larr; Ganti Layanan ({selectedService?.service_name})
              </button>

              {nikVerifiedNotice && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{nikVerifiedNotice}</span>
                </div>
              )}

              {/* Grid NIK & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* NIK Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      NIK Pemohon (16 Digit) <span className="text-rose-500">*</span>
                    </label>
                    {isNikValid(nik) && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Valid
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      value={nik}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setNik(val);
                        if (val.length === 16) handleNikSearch(val);
                      }}
                      placeholder="16 digit NIK e-KTP"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none transition-all ${
                        formErrors.nik
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-500'
                          : isNikValid(nik)
                          ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-500'
                          : isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                    {isSearchingNik && (
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {formErrors.nik && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.nik}</p>
                  )}
                </div>

                {/* WhatsApp Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                    </label>
                    {isPhoneValid(phoneNumber) && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> WA Valid
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+]/g, ''))}
                    placeholder="Contoh: 081234567890"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none transition-all ${
                      formErrors.phoneNumber
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500'
                        : isPhoneValid(phoneNumber)
                        ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-500'
                        : isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.phoneNumber}</p>
                  )}
                </div>
              </div>

              {/* FIELD MANDAT: BUAT KATA SANDI (UNTUK LOGIN BERIKUTNYA) */}
              <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-sans">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    BUAT KATA SANDI (UNTUK LOGIN BERIKUTNYA)
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Opsional / Rekomendasi
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter (Opsional / Rekomendasi)"
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm focus:outline-none transition-all ${
                      formErrors.password
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500'
                        : isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Kata sandi ini digunakan jika Anda ingin masuk tanpa kode OTP WA di kunjungan berikutnya.
                </p>
                {formErrors.password && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.password}</p>
                )}
              </div>

              {/* Nama Lengkap Sesuai KTP */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap pemohon"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                    formErrors.fullName
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500'
                      : isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-300 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* Gender & Pekerjaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm cursor-pointer ${
                      isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Pekerjaan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm cursor-pointer ${
                      isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Wiraswasta / Pelaku Usaha">Wiraswasta / Pelaku Usaha</option>
                    <option value="PNS / TNI / POLRI">PNS / TNI / POLRI</option>
                    <option value="Pegawai BUMN / Swasta">Pegawai BUMN / Swasta</option>
                    <option value="Petani / Pekebun / Nelayan">Petani / Pekebun / Nelayan</option>
                    <option value="Pelajar / Mahasiswa">Pelajar / Mahasiswa</option>
                    <option value="Tenaga Medis / Kesehatan">Tenaga Medis / Kesehatan</option>
                    <option value="Guru / Dosen / Pendidik">Guru / Dosen / Pendidik</option>
                    <option value="Ibu Rumah Tangga">Ibu Rumah Tangga</option>
                    <option value="Lainnya / Belum Bekerja">Lainnya / Belum Bekerja</option>
                  </select>
                </div>
              </div>

              {/* Tanggal & Sesi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Kedatangan
                  </label>
                  <input
                    type="date"
                    value={queueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setQueueDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                      isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Sesi Kedatangan
                  </label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value as any)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm cursor-pointer ${
                      isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="pagi">Sesi Pagi (08:00 - 12:00 WITA)</option>
                    <option value="siang">Sesi Siang (13:00 - 15:30 WITA)</option>
                  </select>
                </div>
              </div>

              {/* Jalur Layanan Prioritas Khusus */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                isPriorityLane
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : isDarkMode ? 'border-white/10 bg-slate-800/40' : 'border-slate-200 bg-slate-50/50'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Accessibility className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Jalur Prioritas Khusus</div>
                      <div className="text-[11px] text-slate-400">
                        Untuk penyandang disabilitas, lansia (60+), ibu hamil, & balita
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPriorityLane}
                    onChange={(e) => setIsPriorityLane(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded-md accent-emerald-500"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke 3 Tabel...</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>Terbitkan Tiket Antrean</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: TIKET ANTREAN BERHASIL DITERBITKAN */}
          {step === 4 && issuedTicket && (
            <div className="space-y-4 animate-in fade-in duration-300 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">
                  Registrasi Sukses & Sinkron 3 Tabel
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-0.5">
                  Tiket Antrean Resmi Diterbitkan
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Data telah tersinkronkan ke mpp_citizens, profiles, dan mpp_queues.
                </p>
              </div>

              {/* CARD TIKET E-PASS */}
              <div className={`p-6 rounded-3xl border text-left space-y-4 shadow-xl ${
                isDarkMode ? 'bg-slate-800/80 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Nomor Antrean</span>
                    <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {issuedTicket.ticket_code}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Urutan Nomor</span>
                    <div className="text-2xl font-black font-mono">
                      #{issuedTicket.queue_number}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Instansi / Loket:</span>
                    <span className="font-bold">{issuedTicket.tenant_name || selectedTenant?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Layanan:</span>
                    <span className="font-bold">{issuedTicket.service_name || selectedService?.service_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Pemohon:</span>
                    <span className="font-bold">{issuedTicket.applicant_name || fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NIK Pemohon:</span>
                    <span className="font-mono font-bold">{issuedTicket.applicant_nik || nik}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <span>Status: <strong>MENUNGGU PANGGILAN</strong></span>
                  <span>{issuedTicket.session_label || 'Sesi Pagi'}</span>
                </div>
              </div>

              {/* Actions: Copy & Print */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyTicket}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{isCopied ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Tiket</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PendaftaranAntreanModal;
