import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { X, Building2, FileText, User, CheckCircle2, Search, ArrowRight, Loader2, Ticket, AlertCircle, Check, Accessibility, HeartHandshake, ShieldCheck, MapPin, Eye, EyeOff, Lock, Printer, Volume2, Copy } from 'lucide-react';
import { supabase, safeFetchLayerData } from '../lib/supabaseClient';
import { MPPTenant, MPPService, MPPCitizen } from '../types/mpp';
import { getPreciseServicesForAgency } from '../data/mppAgenciesData';
import { getMasyarakatDummyEmail, checkFieldUniqueness } from '../services/authService';
import { printMppQueueTicket, MppTicketData } from '../utils/mppTicketPrinter';
import { speakCallingAnnouncement, triggerVibration, playAirportChime } from '../utils/airportAudioAlert';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onSuccess?: (queue: any) => void;
}

export default function MppQueueRegistrationModal({ isOpen, onClose, isDarkMode, onSuccess }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [tenants, setTenants] = useState<MPPTenant[]>([]);
  const [services, setServices] = useState<MPPService[]>([]);
  
  const [selectedTenant, setSelectedTenant] = useState<MPPTenant | null>(null);
  const [selectedService, setSelectedService] = useState<MPPService | null>(null);
  
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [nik, setNik] = useState('');
  const [isPriorityLane, setIsPriorityLane] = useState(false);
  const [priorityType, setPriorityType] = useState<'disabilitas' | 'lansia' | 'ibu_hamil' | 'balita'>('disabilitas');
  const [citizen, setCitizen] = useState<Partial<MPPCitizen>>({
    gender: 'Laki-laki',
    occupation: 'Wiraswasta / Pelaku Usaha'
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSearchingNik, setIsSearchingNik] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  // GIS Data States for Kecamatan & Desa
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [selectedKecamatanId, setSelectedKecamatanId] = useState<string>('');
  const [selectedKecamatanName, setSelectedKecamatanName] = useState<string>('');
  const [selectedDesaName, setSelectedDesaName] = useState<string>('');
  const [loadingKecamatan, setLoadingKecamatan] = useState(false);
  const [loadingDesa, setLoadingDesa] = useState(false);

  // Form validation states
  const [formErrors, setFormErrors] = useState<{
    nik?: string;
    full_name?: string;
    phone_number?: string;
    password?: string;
  }>({});
  const [touched, setTouched] = useState<{
    nik?: boolean;
    full_name?: boolean;
    phone_number?: boolean;
    password?: boolean;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nikFoundMessage, setNikFoundMessage] = useState<string | null>(null);

  // Validation regex helpers
  const isNikValid = (val: string) => /^\d{16}$/.test(val);
  const isPhoneValid = (val: string) => {
    if (!val) return false;
    const clean = val.replace(/[^\d+]/g, '');
    const norm = clean.startsWith('+62') ? '0' + clean.slice(3) : clean.startsWith('62') ? '0' + clean.slice(2) : clean;
    return /^08[1-9][0-9]{7,11}$/.test(norm);
  };
  const isNameValid = (val: string) => !!val && val.trim().length >= 3;

  useEffect(() => {
    if (isOpen) {
      const verifySessionAndInit = async () => {
        // Cek sesi login aktif atau izinkan pendaftaran langsung mandiri
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setActiveUserId(user.id);
        }
        fetchTenants();
        fetchKecamatan();
        resetForm();

        // Auto-hydrate form fields from user's profiles record jika ada
        if (user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            const meta = user.user_metadata || {};
            const nikVal = profile?.nik || meta.nik || '';
            if (nikVal) setNik(nikVal);

            const fullNameVal = profile?.full_name || profile?.company_name || meta.full_name || meta.company_name || '';
            const phoneVal = profile?.no_whatsapp || profile?.whatsapp || profile?.phone || meta.no_whatsapp || meta.phone || '';
            const kecVal = profile?.kecamatan || meta.kecamatan || '';
            const desaVal = profile?.desa || meta.desa || '';

            setCitizen(prev => ({
              ...prev,
              full_name: fullNameVal || prev.full_name,
              phone_number: phoneVal || prev.phone_number,
              kecamatan: kecVal || prev.kecamatan,
              desa: desaVal || prev.desa
            }));
            if (kecVal) setSelectedKecamatanName(kecVal);
            if (desaVal) setSelectedDesaName(desaVal);
          } catch (e) {
            console.warn('Hydration profile error:', e);
          }
        }
      };
      verifySessionAndInit();
    }
  }, [isOpen]);

  const fetchKecamatan = async () => {
    setLoadingKecamatan(true);
    try {
      const data = await safeFetchLayerData('gis_kecamatan');
      if (data) {
        const dataArray = (data && data.type === 'FeatureCollection') ? data.features : (Array.isArray(data) ? data : []);
        const processed = dataArray.map((f: any) => {
          const p = f.properties || f;
          const rawKec = p.kecamatan || p.KECAMATAN || p.nama_kecamatan || p.name || "";
          const cleanKec = String(rawKec).replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
          const kId = String(p.id !== undefined && p.id !== null ? p.id : (p.id_kecamatan || p.ID_KEC || p.districtId || cleanKec));
          return { id: kId, name: cleanKec, raw: p };
        });
        const sorted = [...processed].sort((a, b) => a.name.localeCompare(b.name));
        setKecamatanList(sorted);
      }
    } catch (err) {
      console.error('Error fetching gis_kecamatan:', err);
    } finally {
      setLoadingKecamatan(false);
    }
  };

  useEffect(() => {
    if (!selectedKecamatanId && !selectedKecamatanName) {
      setDesaList([]);
      return;
    }
    const fetchDesa = async () => {
      setLoadingDesa(true);
      try {
        const data = await safeFetchLayerData('gis_desa');
        if (data) {
          const dataArray = (data && data.type === 'FeatureCollection') ? data.features : (Array.isArray(data) ? data : []);
          const processed = dataArray.map((f: any) => {
            const p = f.properties || f;
            const vName = p.nama_desa || p.Nama_Desa || p.DESA || p.desa || p.name || p.NAME || "";
            const kId = String(p.id_kecamatan !== undefined && p.id_kecamatan !== null ? p.id_kecamatan : (p.districtId || p.district_id || p.kecamatan_id || ""));
            const kName = (p.kecamatan || p.KECAMATAN || p.districtName || "").replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
            return {
              id: String(p.id || p.ID_DESA || f.id || vName),
              name: vName,
              districtId: kId,
              districtName: kName
            };
          });

          const currentKecName = selectedKecamatanName.toLowerCase();
          const filtered = processed.filter((d: any) => {
            if (selectedKecamatanId && String(d.districtId) === String(selectedKecamatanId)) return true;
            if (d.districtName && d.districtName.toLowerCase() === currentKecName) return true;
            return false;
          });

          const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
          setDesaList(sorted);
        }
      } catch (err) {
        console.error('Error fetching gis_desa:', err);
      } finally {
        setLoadingDesa(false);
      }
    };
    fetchDesa();
  }, [selectedKecamatanId, selectedKecamatanName]);

  const resetForm = () => {
    setStep(1);
    setSelectedTenant(null);
    setSelectedService(null);
    setNik('');
    setSelectedKecamatanId('');
    setSelectedKecamatanName('');
    setSelectedDesaName('');
    setCitizen({
      gender: 'Laki-laki',
      occupation: 'Wiraswasta / Pelaku Usaha'
    });
    setFormErrors({});
    setTouched({});
    setSubmitError(null);
    setNikFoundMessage(null);
    setTicketResult(null);
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('mpp_tenants')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (data) setTenants(data);
    } catch (error) {
      console.error('Error fetching tenants', error);
    }
  };

  const fetchServices = async (tenantId: string) => {
    try {
      const currentTenant = tenants.find(t => t.id === tenantId) || selectedTenant;
      const tenantName = currentTenant?.name || '';

      const { data, error } = await supabase.from('mpp_services').select('*').eq('tenant_id', tenantId).order('service_name');
      if (data && data.length > 0) {
        const isMismatched = data.some(s => {
          const sName = (s.service_name || s.name || '').toLowerCase();
          const tName = tenantName.toLowerCase();
          if (tName.includes('dpmptsp') && (sName.includes('sertifikat hak milik') || sName.includes('pertanahan'))) return true;
          if (tName.includes('disdukcapil') && sName.includes('sertifikat hak milik')) return true;
          return false;
        });

        if (!isMismatched) {
          setServices(data);
          return;
        }
      }

      const precise = getPreciseServicesForAgency(tenantName || tenantId, tenantId);
      setServices(precise as MPPService[]);
    } catch (error) {
      console.error('Error fetching services', error);
      const currentTenant = tenants.find(t => t.id === tenantId) || selectedTenant;
      const tenantName = currentTenant?.name || '';
      const precise = getPreciseServicesForAgency(tenantName || tenantId, tenantId);
      setServices(precise as MPPService[]);
    }
  };

  const handleTenantSelect = (tenant: MPPTenant) => {
    setSelectedTenant(tenant);
    fetchServices(tenant.id);
    setStep(2);
  };

  const handleServiceSelect = (service: MPPService) => {
    setSelectedService(service);
    setStep(3);
  };

  const handleNikSearch = async (targetNik?: string) => {
    const searchNik = targetNik || nik;
    if (searchNik.length !== 16) return;
    setIsSearchingNik(true);
    setSubmitError(null);
    try {
      const { data, error } = await supabase.from('mpp_citizens').select('*').eq('nik', searchNik).maybeSingle();
      if (data) {
        setCitizen({
          ...data,
          occupation: data.pekerjaan || data.occupation || 'Wiraswasta / Pelaku Usaha',
          gender: data.jenis_kelamin || data.gender || 'Laki-laki',
          kecamatan: data.kecamatan || '',
          desa: data.desa || ''
        });
        if (data.kecamatan) {
          setSelectedKecamatanName(data.kecamatan);
        }
        if (data.desa) {
          setSelectedDesaName(data.desa);
        }
        setNikFoundMessage(`Data warga terverifikasi: ${data.full_name}`);
      } else {
        // Not found, just keep the NIK but allow manual entry
        setCitizen(prev => ({ ...prev, nik: searchNik }));
        setNikFoundMessage(null);
      }
    } catch (error) {
      console.error('Error checking NIK', error);
      setCitizen(prev => ({ ...prev, nik: searchNik }));
    } finally {
      setIsSearchingNik(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTenant || !selectedService) return;
    
    // Validate all fields
    const currentNik = citizen.nik || nik;
    const currentName = citizen.full_name || '';
    const currentPhone = citizen.phone_number || '';

    const errors: typeof formErrors = {};
    if (!isNikValid(currentNik)) {
      errors.nik = 'NIK harus tepat 16 digit angka sesuai KTP';
    }
    if (!isNameValid(currentName)) {
      errors.full_name = 'Nama lengkap minimal 3 karakter';
    }
    if (!isPhoneValid(currentPhone)) {
      errors.phone_number = 'Nomor HP/WA harus diawali 08 atau 628 (10-14 digit)';
    }
    if (!password || password.length < 6) {
      errors.password = 'Kata sandi akun wajib diisi minimal 6 karakter';
    }

    setTouched({ nik: true, full_name: true, phone_number: true, password: true });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitError('Mohon periksa kembali isian form yang belum sesuai format.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const verifiedNik = currentNik;
      const verifiedName = currentName.trim();
      const cleanPhone = currentPhone.replace(/[^\d+]/g, '');
      const today = new Date().toISOString().split('T')[0];

      // 1. Daftarkan akun ke Supabase Auth via strategi dummy email (<nik>@warga.simpurusiang.go.id)
      const dummyEmail = getMasyarakatDummyEmail(verifiedNik);
      try {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: dummyEmail,
          password: password.trim(),
          options: {
            data: {
              nik: verifiedNik,
              full_name: verifiedName.toUpperCase(),
              role: 'masyarakat',
              whatsapp: cleanPhone || '',
              no_whatsapp: cleanPhone || '',
              kecamatan: selectedKecamatanName || citizen.kecamatan || '',
              desa: selectedDesaName || citizen.desa || ''
            }
          }
        });

        if (authErr && !authErr.message.includes('already registered')) {
          console.warn('[MppQueueRegistrationModal] Supabase signUp note:', authErr.message);
        }

        if (authData?.session?.access_token) {
          try {
            await supabase.auth.setSession({
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token
            });
          } catch (e) {}
        }
      } catch (authCatch) {
        console.warn('[MppQueueRegistrationModal] Auth catch:', authCatch);
      }

      const { data: { user } } = await supabase.auth.getUser();
      const verifiedUserId = user?.id || `cit-${verifiedNik}`;

      // Pengecekan NIK & Nomor WhatsApp Unik: Mencegah pendaftaran ganda jika NIK atau Nomor WhatsApp sudah memiliki antrean aktif hari ini
      const uniqueCheck = await checkFieldUniqueness({
        nik: currentNik,
        whatsapp: cleanPhone,
        queue_date: today,
        context: 'queue'
      });

      if (!uniqueCheck.isUnique && uniqueCheck.conflicts.active_queue) {
        setSubmitError(
          uniqueCheck.message || `NIK (${currentNik}) atau Nomor WhatsApp (${cleanPhone}) sudah memiliki antrean aktif hari ini. Pendaftaran antrean online hanya dapat dilakukan 1 kali. Masukkan NIK dan Nomor WhatsApp yang lain, atau selesaikan antrean Anda yang aktif.`
        );
        setIsSubmitting(false);
        return;
      }

      // Triple-Table DB Sync via /api/mpp/register-citizen (mpp_citizens, profiles, mpp_queues)
      const regRes = await fetch('/api/mpp/register-citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik: verifiedNik,
          nama_lengkap: verifiedName,
          no_hp: cleanPhone || null,
          jenis_kelamin: citizen.gender || 'Laki-laki',
          pekerjaan: citizen.occupation || 'Wiraswasta / Pelaku Usaha',
          password: password.trim() || undefined,
          tenant_id: selectedTenant.id,
          service_id: selectedService.id,
          agency_name: selectedTenant.name,
          service_name: selectedService.service_name,
          queue_date: today,
          session: 'pagi',
          is_priority: isPriorityLane,
          kecamatan: selectedKecamatanName || citizen.kecamatan || null,
          desa: selectedDesaName || citizen.desa || null,
          address: citizen.address || null
        })
      });

      let newQueue: any = null;
      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData.success) {
          newQueue = regData.data?.queue || regData.queue || regData.ticket;
        }
      }

      // Direct fallback to Supabase table if API proxy was unavailable
      if (!newQueue) {
        // Upsert citizen
        await supabase.from('mpp_citizens').upsert({
          nik: verifiedNik,
          nama_lengkap: verifiedName,
          full_name: verifiedName,
          no_hp: cleanPhone || null,
          phone_number: cleanPhone || null,
          jenis_kelamin: citizen.gender || 'Laki-laki',
          gender: citizen.gender || 'Laki-laki',
          pekerjaan: citizen.occupation || 'Wiraswasta / Pelaku Usaha',
          occupation: citizen.occupation || 'Wiraswasta / Pelaku Usaha',
          kecamatan: selectedKecamatanName || citizen.kecamatan || null,
          desa: selectedDesaName || citizen.desa || null,
          address: citizen.address || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'nik' });

        // Upsert profile
        await supabase.from('profiles').upsert({
          id: verifiedUserId,
          nik: verifiedNik,
          full_name: verifiedName,
          phone: cleanPhone || null,
          role: 'citizen',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        const { data: lastQueue } = await supabase
          .from('mpp_queues')
          .select('queue_number')
          .eq('tenant_id', selectedTenant.id)
          .eq('queue_date', today)
          .order('queue_number', { ascending: false })
          .limit(1);

        const nextNum = (lastQueue && lastQueue.length > 0 && lastQueue[0].queue_number) ? lastQueue[0].queue_number + 1 : 1;
        const paddedNum = String(nextNum).padStart(3, '0');
        const tenantCode = (selectedTenant.code || 'MPP').toUpperCase();
        const ticketCode = isPriorityLane ? `P-${paddedNum}-${tenantCode}` : `${paddedNum}-${tenantCode}`;

        const { data: directQ, error: directErr } = await supabase
          .from('mpp_queues')
          .insert({
            user_id: verifiedUserId,
            tenant_id: selectedTenant.id,
            service_id: selectedService.id,
            citizen_nik: verifiedNik,
            queue_date: today,
            queue_number: nextNum,
            ticket_code: ticketCode,
            status: 'menunggu',
            session: 'pagi',
            call_count: 0
          })
          .select('*, tenant:mpp_tenants(*), service:mpp_services(*)')
          .single();

        if (directErr) throw directErr;
        newQueue = directQ;
      }

      // Session Hydration
      sessionStorage.setItem('activeUserId', verifiedUserId);
      sessionStorage.setItem('citizenNik', verifiedNik);
      sessionStorage.setItem('citizenName', verifiedName);
      sessionStorage.setItem('luwu_user_role', 'citizen');
      localStorage.setItem('luwu_user_role', 'masyarakat');
      localStorage.setItem('luwu_user_nik', verifiedNik);
      localStorage.setItem('luwu_user_name', verifiedName);

      const ticketCode = newQueue.ticket_code;
      const paddedNum = String(newQueue.queue_number).padStart(3, '0');

      // Automatically create matching tracking document in Supabase
      try {
        const { data: trkData } = await supabase.from('mpp_document_tracking').insert({
          queue_id: newQueue.id,
          tracking_code: ticketCode,
          current_status: isPriorityLane 
            ? 'Pendaftaran Berkas Jalur Prioritas Khusus Diterima di Loket'
            : 'Pendaftaran Berkas Diterima di Loket'
        }).select().single();

        if (trkData?.id) {
          await supabase.from('mpp_tracking_history').insert({
            tracking_id: trkData.id,
            status_description: isPriorityLane
              ? `Pengambilan tiket PRIORITAS nomor ${paddedNum} di Loket ${selectedTenant.name} (Asistensi Siap)`
              : `Pengambilan tiket antrean nomor ${paddedNum} di Loket ${selectedTenant.name}`,
            updated_by: user.id
          });
        }
      } catch (trackInitErr) {
        console.warn('Silent tracking init error:', trackInitErr);
      }

      const activeTicketRecord: MppTicketData = {
        id: newQueue.id,
        number: ticketCode,
        ticket_code: ticketCode,
        queue_number: paddedNum,
        counter: selectedTenant?.loket || 'Loket Pelayanan',
        counter_name: selectedTenant?.loket || 'Loket Pelayanan',
        agency: selectedTenant?.name || 'MPP Simpurusiang',
        agency_name: selectedTenant?.name || 'MPP Simpurusiang',
        instansi_name: selectedTenant?.name || 'MPP Simpurusiang',
        service: selectedService?.service_name || 'Pelayanan Terpadu',
        service_name: selectedService?.service_name || 'Pelayanan Terpadu',
        date: today,
        session: 'Sesi Pelayanan MPP',
        name: citizen.full_name || verifiedName,
        nama_pemohon: citizen.full_name || verifiedName,
        citizen_name: citizen.full_name || verifiedName,
        nik: verifiedNik,
        is_priority: isPriorityLane,
        priority_type: isPriorityLane ? priorityType : undefined
      };

      try {
        sessionStorage.setItem('mpp_active_ticket', JSON.stringify(activeTicketRecord));
        localStorage.setItem('mpp_active_ticket', JSON.stringify(activeTicketRecord));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mpp_ticket_updated', { detail: activeTicketRecord }));
        }
      } catch (storageErr) {
        console.warn('Storage write error for active ticket:', storageErr);
      }

      setTicketResult(activeTicketRecord);
      setStep(4);
    } catch (error: any) {
      console.error('Error submitting queue', error);
      setSubmitError(error?.message || 'Terjadi kesalahan saat memproses antrian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t("bookingModal.modalTitle", "Ambil Antrian MPP")}</h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t("bookingModal.modalSubtitle", "Portal Layanan Publik Terpadu")}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              if (ticketResult && onSuccess) {
                onSuccess(ticketResult);
              } else {
                onClose();
              }
            }} 
            className="p-2 rounded-xl hover:bg-slate-500/10 transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          {/* Stepper */}
          {step < 4 && (
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>
              {[1, 2, 3].map((s) => (
                <div key={s} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= s ? 'bg-indigo-600 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400')
                }`}>
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* STEP 1: Pilih Gerai */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                {t("bookingModal.step1Title", "Pilih Gerai / Instansi")}
              </h3>
              {tenants.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                  {t("bookingModal.loadingTenants", "Memuat data gerai...")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tenants.map(tenant => (
                    <button
                      key={tenant.id}
                      onClick={() => handleTenantSelect(tenant)}
                      className={`p-4 rounded-xl border text-left transition-all hover:border-indigo-500 hover:shadow-md ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="font-semibold">{tenant.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{t("bookingModal.tenantCode", "Kode")}: {tenant.code}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Pilih Layanan */}
          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-xs text-indigo-500 hover:underline mb-2 block">&larr; {t("bookingModal.backToTenants", "Kembali ke pilihan gerai")}</button>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                {t("bookingModal.step2Title", "Pilih Layanan di")} {selectedTenant?.name}
              </h3>
              {services.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {t("bookingModal.noServices", "Belum ada layanan yang didaftarkan untuk gerai ini.")}
                </div>
              ) : (
                <div className="space-y-2">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className={`w-full p-4 rounded-xl border text-left transition-all hover:border-indigo-500 flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-white'}`}
                    >
                      <div>
                        <div className="font-semibold">{service.service_name}</div>
                        {service.is_long_process && <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">{t("bookingModal.needsTracking", "Butuh Tracking / E-LACAK")}</span>}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Identitas (Tell Us Once) */}
          {step === 3 && (
            <div className="space-y-4">
               <button onClick={() => setStep(2)} className="text-xs text-indigo-500 hover:underline mb-2 block cursor-pointer">&larr; {t("bookingModal.backToServices", "Kembali ke pilihan layanan")}</button>
               <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                {t("bookingModal.step3Title", "Data Pemohon Antrean")}
              </h3>

              {/* Notifikasi Verifikasi Otomatis */}
              {nikFoundMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{nikFoundMessage}</span>
                </div>
              )}
              
              <div className="space-y-4">
                {/* NIK Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t("bookingModal.nikLabel", "Nomor Induk Kependudukan (NIK)")} <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {isSearchingNik ? (
                        <span className="text-[10px] text-indigo-500 flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> {t("bookingModal.checkingDb", "Cek database...")}
                        </span>
                      ) : isNikValid(nik) ? (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> {t("bookingModal.valid16Digits", "16 Digit Valid")}
                        </span>
                      ) : (
                        <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                          nik.length > 0 ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' : 'text-slate-400'
                        }`}>
                          {nik.length}/16
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      maxLength={16}
                      value={nik}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setNik(raw);
                        setCitizen(prev => ({ ...prev, nik: raw }));
                        setTouched(prev => ({ ...prev, nik: true }));

                        if (raw.length === 0) {
                          setFormErrors(prev => ({ ...prev, nik: t("bookingModal.nikRequired", "NIK wajib diisi sesuai KTP") }));
                        } else if (raw.length < 16) {
                          setFormErrors(prev => ({ ...prev, nik: `${t("bookingModal.nik16Digits", "NIK harus 16 digit angka")} (${raw.length}/16)` }));
                        } else {
                          setFormErrors(prev => ({ ...prev, nik: undefined }));
                          handleNikSearch(raw);
                        }
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, nik: true }))}
                      className={`flex-1 px-4 py-2 rounded-xl border font-mono text-sm focus:outline-none transition-all ${
                        touched.nik && formErrors.nik
                          ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500 bg-rose-50/20'
                          : isNikValid(nik)
                          ? 'border-emerald-400 dark:border-emerald-600 focus:ring-2 focus:ring-emerald-500'
                          : isDarkMode ? 'bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500' : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500'
                      }`}
                      placeholder={t("bookingModal.nikPlaceholder", "Masukkan 16 digit NIK")}
                    />
                    <button 
                      type="button"
                      onClick={() => handleNikSearch()}
                      disabled={nik.length !== 16 || isSearchingNik}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer text-xs sm:text-sm"
                    >
                      {isSearchingNik ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      {t("bookingModal.checkNikBtn", "Cek NIK")}
                    </button>
                  </div>
                  {touched.nik && formErrors.nik ? (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.nik}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">
                      {nik.startsWith('7317') ? t("bookingModal.luwuRegionDetected", "📍 Wilayah Kabupaten Luwu (7317)") : t("bookingModal.nikHelperText", "Masukkan 16 digit NIK. Sistem Tell Us Once akan mengisi data otomatis jika sudah pernah terdaftar.")}
                    </p>
                  )}
                </div>

                {/* Form fields */}
                <div className={`space-y-3 transition-opacity duration-300 ${(nik.length > 0) ? 'opacity-100' : 'opacity-60'}`}>
                  {/* Nama Lengkap */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
                      </label>
                      {isNameValid(citizen.full_name || '') && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Valid
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={citizen.full_name || ''}
                      disabled={!!nikFoundMessage}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCitizen(prev => ({ ...prev, full_name: val }));
                        setTouched(prev => ({ ...prev, full_name: true }));
                        if (!val.trim()) {
                          setFormErrors(prev => ({ ...prev, full_name: 'Nama lengkap wajib diisi sesuai KTP' }));
                        } else if (val.trim().length < 3) {
                          setFormErrors(prev => ({ ...prev, full_name: 'Nama lengkap minimal 3 karakter' }));
                        } else {
                          setFormErrors(prev => ({ ...prev, full_name: undefined }));
                        }
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, full_name: true }))}
                      placeholder="Contoh: Andi Muhammad Fadli"
                      className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                        !!nikFoundMessage ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed border-dashed' : ''
                      } ${
                        touched.full_name && formErrors.full_name
                          ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500 bg-rose-50/20'
                          : isNameValid(citizen.full_name || '')
                          ? 'border-emerald-400 dark:border-emerald-600 focus:ring-2 focus:ring-emerald-500'
                          : isDarkMode ? 'bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500' : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500'
                      }`}
                    />
                    {touched.full_name && formErrors.full_name && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.full_name}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp, Gender, Pekerjaan */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                        </label>
                        {isPhoneValid(citizen.phone_number || '') && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> WA Valid
                          </span>
                        )}
                      </div>
                      <input 
                        type="tel"
                        inputMode="tel"
                        value={citizen.phone_number || ''}
                        disabled={!!nikFoundMessage}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d+]/g, '');
                          if (val.indexOf('+') > 0) val = val.replace(/\+/g, '');
                          setCitizen(prev => ({ ...prev, phone_number: val }));
                          setTouched(prev => ({ ...prev, phone_number: true }));

                          if (!val.trim()) {
                            setFormErrors(prev => ({ ...prev, phone_number: 'Nomor WhatsApp wajib diisi' }));
                          } else if (!isPhoneValid(val)) {
                            setFormErrors(prev => ({ ...prev, phone_number: 'Gunakan awalan 08 / 628 (10-14 digit)' }));
                          } else {
                            setFormErrors(prev => ({ ...prev, phone_number: undefined }));
                          }
                        }}
                        onBlur={async () => {
                          setTouched(prev => ({ ...prev, phone_number: true }));
                          const val = citizen.phone_number || '';
                          const clean = val.replace(/[^\d+]/g, '');
                          if (clean.length >= 10) {
                            const res = await checkFieldUniqueness({ whatsapp: clean, context: 'queue' });
                            if (res.conflicts.active_queue) {
                              setFormErrors(prev => ({ ...prev, phone_number: 'Nomor WhatsApp ini sudah memiliki antrean aktif hari ini.' }));
                              setSubmitError('Nomor WhatsApp ini sudah terdaftar dan memiliki antrean aktif hari ini. Pendaftaran antrean online hanya diperkenankan 1 kali per hari.');
                            }
                          }
                        }}
                        placeholder="Contoh: 081234567890"
                        className={`w-full px-4 py-2 rounded-xl border text-sm font-mono focus:outline-none transition-all ${
                          !!nikFoundMessage ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed border-dashed' : ''
                        } ${
                          touched.phone_number && formErrors.phone_number
                            ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500 bg-rose-50/20'
                            : isPhoneValid(citizen.phone_number || '')
                            ? 'border-emerald-400 dark:border-emerald-600 focus:ring-2 focus:ring-emerald-500'
                            : isDarkMode ? 'bg-slate-800 border-slate-700 focus:ring-2 focus:ring-indigo-500' : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500'
                        }`}
                      />
                      {touched.phone_number && formErrors.phone_number ? (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.phone_number}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Awalan 08/628</p>
                      )}
                    </div>

                    {/* KATA SANDI AKUN WARGA (UNTUK LOGIN PORTAL & PKKPR) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Kata Sandi Akun Warga <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          Wajib (Min. 6 Karakter)
                        </span>
                      </div>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (formErrors.password) {
                              setFormErrors(prev => ({ ...prev, password: undefined }));
                            }
                          }}
                          placeholder="Minimal 6 karakter kata sandi akun"
                          className={`w-full px-4 py-2 pr-10 rounded-xl border text-sm font-sans focus:outline-none transition-all ${
                            formErrors.password
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-500'
                              : isDarkMode ? 'bg-slate-800 border-slate-700 focus:ring-2 focus:ring-emerald-500' : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500'
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
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Kata sandi ini digunakan untuk masuk resmi dengan NIK Anda pada Portal Warga & pengajuan izin PKKPR.
                      </p>
                      {touched.password && formErrors.password && (
                        <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.password}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Jenis Kelamin <span className="text-rose-500">*</span>
                      </label>
                      <select 
                        value={citizen.gender || citizen.jenis_kelamin || 'Laki-laki'}
                        onChange={(e) => setCitizen(prev => ({ ...prev, gender: e.target.value as 'Laki-laki' | 'Perempuan', jenis_kelamin: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}
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
                        value={citizen.occupation || citizen.pekerjaan || 'Wiraswasta / Pelaku Usaha'}
                        onChange={(e) => setCitizen(prev => ({ ...prev, occupation: e.target.value, pekerjaan: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}
                      >
                        <option value="PNS / TNI / POLRI">PNS / TNI / POLRI</option>
                        <option value="Pegawai BUMN / Swasta">Pegawai BUMN / Swasta</option>
                        <option value="Wiraswasta / Pelaku Usaha">Wiraswasta / Pelaku Usaha</option>
                        <option value="Petani / Pekebun / Nelayan">Petani / Pekebun / Nelayan</option>
                        <option value="Pelajar / Mahasiswa">Pelajar / Mahasiswa</option>
                        <option value="Tenaga Medis / Kesehatan">Tenaga Medis / Kesehatan</option>
                        <option value="Guru / Dosen / Pendidik">Guru / Dosen / Pendidik</option>
                        <option value="Ibu Rumah Tangga">Ibu Rumah Tangga</option>
                        <option value="Lainnya / Belum Bekerja">Lainnya / Belum Bekerja</option>
                      </select>
                    </div>

                    {/* Kecamatan (Linked to gis_kecamatan) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Kecamatan (Domisili)
                        </label>
                        {loadingKecamatan && (
                          <span className="text-[10px] text-indigo-500 flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Memuat...
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <select
                          value={selectedKecamatanName || citizen.kecamatan || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedKecamatanName(val);
                            const matchedKec = kecamatanList.find(k => k.name.toLowerCase() === val.toLowerCase());
                            setSelectedKecamatanId(matchedKec ? String(matchedKec.id) : '');
                            setSelectedDesaName('');
                            setCitizen(prev => ({ ...prev, kecamatan: val, desa: '' }));
                          }}
                          className={`w-full px-4 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}
                        >
                          <option value="">-- Pilih Kecamatan --</option>
                          {kecamatanList.map((kec) => (
                            <option key={kec.id || kec.name} value={kec.name}>
                              {kec.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Desa / Kelurahan (Linked to gis_desa) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Desa / Kelurahan
                        </label>
                        {loadingDesa && (
                          <span className="text-[10px] text-indigo-500 flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Memuat...
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <select
                          value={selectedDesaName || citizen.desa || ''}
                          disabled={!selectedKecamatanName && !citizen.kecamatan}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedDesaName(val);
                            setCitizen(prev => ({ ...prev, desa: val }));
                          }}
                          className={`w-full px-4 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}
                        >
                          <option value="">
                            {selectedKecamatanName || citizen.kecamatan ? '-- Pilih Desa / Kelurahan --' : '-- Pilih Kecamatan Terlebih Dahulu --'}
                          </option>
                          {desaList.map((desa) => (
                            <option key={desa.id || desa.name} value={desa.name}>
                              {desa.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Kategori Antrean: Reguler vs Jalur Prioritas Khusus */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isPriorityLane 
                      ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' 
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl shrink-0 ${isPriorityLane ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          <Accessibility className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            Jalur Layanan Prioritas Khusus
                            {isPriorityLane && <span className="bg-emerald-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">Aktif</span>}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Khusus Disabilitas, Lansia (≥60 thn), Ibu Hamil/Menyusui, dan Pembawa Balita
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={isPriorityLane} 
                          onChange={(e) => setIsPriorityLane(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {isPriorityLane && (
                      <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'disabilitas', label: 'Disabilitas' },
                          { id: 'lansia', label: 'Lansia (60+)' },
                          { id: 'ibu_hamil', label: 'Ibu Hamil' },
                          { id: 'balita', label: 'Membawa Balita' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPriorityType(item.id as any)}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all text-center ${
                              priorityType === item.id
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Banner jika ada kegagalan submit */}
                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/25"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menyimpan ke Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Ambil Nomor Antrian Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success / Ticket */}
          {step === 4 && ticketResult && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Pendaftaran Antrean Berhasil!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nomor antrean resmi diterbitkan oleh sistem MPP Simpurusiang.
                </p>
              </div>
              
              <div className={`max-w-sm mx-auto p-5 rounded-2xl border-2 border-dashed transition-all ${
                isDarkMode ? 'border-slate-700 bg-slate-800/80 text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
              }`}>
                {isPriorityLane && (
                  <div className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                    <Accessibility className="w-3.5 h-3.5" />
                    Jalur Prioritas Khusus ({priorityType.toUpperCase()})
                  </div>
                )}
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  {ticketResult.agency || selectedTenant?.name}
                </div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                  {ticketResult.counter || selectedTenant?.loket || 'Loket Pelayanan'}
                </div>

                <div className={`text-4xl sm:text-5xl font-black tracking-tight my-2 font-mono ${
                  isPriorityLane ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  {ticketResult.ticket_code.split('-').pop()}
                </div>
                <div className="text-xs font-mono font-bold bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-lg inline-block border border-black/5 dark:border-white/10">
                  {ticketResult.ticket_code}
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-left space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Pemohon:</span>
                    <b className="font-semibold">{ticketResult.name || citizen.full_name}</b>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Layanan:</span>
                    <b className="font-semibold text-right max-w-[200px] truncate">{ticketResult.service || selectedService?.service_name}</b>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Tanggal:</span>
                    <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {isPriorityLane && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 text-center">
                      ⭐ Petugas siaga menyambut & mendampingi langsung di loket.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Cetak Tiket, Uji Suara Panggilan, Selesai */}
              <div className="pt-2 flex flex-col gap-2.5 max-w-sm mx-auto">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => printMppQueueTicket(ticketResult)}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    <span>Cetak Tiket (Thermal/PDF)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isTestingVoice}
                    onClick={async () => {
                      setIsTestingVoice(true);
                      triggerVibration();
                      try {
                        await playAirportChime();
                        await speakCallingAnnouncement(
                          ticketResult.ticket_code,
                          ticketResult.counter || selectedTenant?.loket || 'Loket 1',
                          ticketResult.agency || selectedTenant?.name
                        );
                      } finally {
                        setIsTestingVoice(false);
                      }
                    }}
                    className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Volume2 className={`w-4 h-4 ${isTestingVoice ? 'animate-pulse text-amber-500' : ''}`} />
                    <span>{isTestingVoice ? 'Memutar Suara...' : 'Uji Panggilan Loket'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(ticketResult.ticket_code);
                      setIsCodeCopied(true);
                      setTimeout(() => setIsCodeCopied(false), 2000);
                    }}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    {isCodeCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Kode Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode Antrean</span>
                      </>
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      if (onSuccess) {
                        onSuccess(ticketResult);
                      } else {
                        onClose();
                      }
                    }}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Kembali ke Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
