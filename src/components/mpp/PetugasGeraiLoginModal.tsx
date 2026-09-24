import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Smartphone,
  ChevronDown,
  UserCheck,
  Users,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MPPTenant } from '../../types/mpp';

interface PetugasGeraiLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tenant: MPPTenant, operatorData: { name: string; email: string; role: string; counterName?: string; userId?: string }) => void;
  isDarkMode?: boolean;
}

interface AssignedOperator {
  id: string;
  user_id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: string;
  pin?: string;
  counter_name?: string;
}

export const PetugasGeraiLoginModal: React.FC<PetugasGeraiLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isDarkMode = false
}) => {
  const [tenants, setTenants] = useState<MPPTenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [selectedCounter, setSelectedCounter] = useState<string>('Loket 1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [availableOperators, setAvailableOperators] = useState<AssignedOperator[]>([]);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<{ tenantUserId: string; officerName: string; activeCounter: string; finalRole: string } | null>(null);

  const handleForceLogin = async () => {
    if (!conflictInfo) return;
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const targetTenant = tenants.find(t => t.id === selectedTenantId);
    if (!targetTenant) {
      setIsLoading(false);
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      // Panggil API session start dengan force = true
      const sessRes = await fetch('/api/mpp/tenant-users/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_user_id: conflictInfo.tenantUserId,
          counter_name: selectedCounter,
          officer_name: conflictInfo.officerName,
          force: true
        })
      });
      const sessData = await sessRes.json();
      if (!sessData.success) {
        throw new Error(sessData.error || 'Gagal meregistrasi sesi loket aktif.');
      }

      // Berhasil, buat session payload dan panggil onSuccess
      const activeSessions = JSON.parse(localStorage.getItem('mpp_active_counter_sessions') || '{}');
      activeSessions[cleanEmail] = {
        userId: conflictInfo.tenantUserId,
        operatorName: conflictInfo.officerName,
        tenantId: targetTenant.id,
        counterName: selectedCounter,
        timestamp: Date.now()
      };
      localStorage.setItem('mpp_active_counter_sessions', JSON.stringify(activeSessions));

      const sessionPayload = {
        tenantId: targetTenant.id,
        tenantName: targetTenant.name,
        tenantCode: targetTenant.code,
        floor: targetTenant.floor || 'Lantai 1',
        name: conflictInfo.officerName,
        operatorName: conflictInfo.officerName,
        email: cleanEmail,
        role: conflictInfo.finalRole,
        counterName: selectedCounter,
        userId: conflictInfo.tenantUserId,
        authType: 'Paksa Masuk (Teller Override)',
        loggedInAt: new Date().toISOString()
      };

      localStorage.setItem('mpp_tenant_operator_session', JSON.stringify(sessionPayload));
      setSuccessMessage(`Berhasil memindahkan sesi! Mengarahkan ke ${selectedCounter} (${targetTenant.name})...`);

      setTimeout(() => {
        setIsLoading(false);
        onSuccess(targetTenant, {
          name: conflictInfo.officerName,
          email: cleanEmail,
          role: conflictInfo.finalRole,
          counterName: selectedCounter,
          userId: conflictInfo.tenantUserId
        });
        setConflictInfo(null);
      }, 500);
    } catch (err: any) {
      console.error('Error forced login operator:', err);
      setErrorMessage(`Gagal memindahkan sesi: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Fetch active tenants from Supabase & load synced PINs
  useEffect(() => {
    if (!isOpen) return;

    const fetchTenants = async () => {
      try {
        const { data, error } = await supabase
          .from('mpp_tenants')
          .select('*')
          .order('name');

        const localPins = JSON.parse(localStorage.getItem('mpp_tenant_pins') || '{}');

        if (!error && data && data.length > 0) {
          const mergedTenants = data.map(t => ({
            ...t,
            officer_pin: t.officer_pin || (t as any).pin || localPins[t.id] || localPins[t.code] || ""
          }));
          setTenants(mergedTenants);
          if (!selectedTenantId) {
            setSelectedTenantId(mergedTenants[0].id);
          }
        } else {
          // Fallback static list of Luwu MPP tenants if offline/empty
          const defaultTenants: MPPTenant[] = [
            { id: '1', name: 'DPMPTSP Kab. Luwu', code: 'DPMPTSP', floor: 'Lantai 1', is_active: true, officer_pin: 'Dpmptsp123!' },
            { id: '2', name: 'Dinas Kependudukan & Pencatatan Sipil', code: 'DISDUKCAPIL', floor: 'Lantai 1', is_active: true, officer_pin: 'Capil123!' },
            { id: '3', name: 'Badan Pendapatan Daerah (BAPENDA)', code: 'BAPENDA', floor: 'Lantai 1', is_active: true, officer_pin: 'Bapenda123!' },
            { id: '4', name: 'SAMSAT Luwu (Bapenda Sulsel)', code: 'SAMSAT', floor: 'Lantai 1', is_active: true, officer_pin: 'Samsat123!' },
            { id: '5', name: 'Kementerian Agama Kab. Luwu', code: 'KEMENAG', floor: 'Lantai 2', is_active: true, officer_pin: 'Kemenag123!' },
            { id: '6', name: 'BPJS Kesehatan Kantor Cabang Luwu', code: 'BPJS-KES', floor: 'Lantai 2', is_active: true, officer_pin: 'Bpjskes123!' },
            { id: '7', name: 'BPJS Ketenagakerjaan Luwu', code: 'BPJS-TK', floor: 'Lantai 2', is_active: true, officer_pin: 'Bpjstk123!' },
            { id: '8', name: 'Badan Pertanahan Nasional (ATR/BPN)', code: 'BPN', floor: 'Lantai 1', is_active: true, officer_pin: 'BPN2026@' },
            { id: '9', name: 'Polres Luwu (SKCK & SIM Corner)', code: 'POLRES', floor: 'Lantai 1', is_active: true, officer_pin: 'Polres123!' },
            { id: '10', name: 'Kejaksaan Negeri Luwu', code: 'KEJARI', floor: 'Lantai 2', is_active: true, officer_pin: 'Kejari123!' },
            { id: '11', name: 'Bank Sulselbar Cabang Belopa', code: 'SULSELBAR', floor: 'Lantai 1', is_active: true, officer_pin: 'Bank123!' }
          ];
          setTenants(defaultTenants);
          setSelectedTenantId(defaultTenants[0].id);
        }
      } catch (err) {
        console.error('Error fetching tenants for login modal:', err);
      }
    };

    fetchTenants();
  }, [isOpen]);

  // Load operators affiliated with the selected tenant from Supabase mpp_tenant_users + profiles + localStorage
  useEffect(() => {
    if (!selectedTenantId) return;

    const loadTenantOperators = async () => {
      const chosenTenant = tenants.find(t => t.id === selectedTenantId);
      const localOps = JSON.parse(localStorage.getItem('mpp_portal_operators') || '[]');
      const localOpPins = JSON.parse(localStorage.getItem('mpp_operator_pins') || '{}');

      // 1. Ambil dari localStorage yang match tenant
      const matchedLocalOps = localOps.filter((op: any) => 
        op.tenant_id === selectedTenantId || 
        op.tenant === chosenTenant?.name || 
        op.tenant_code === chosenTenant?.code ||
        op.tenant === chosenTenant?.code
      ).map((op: any) => ({
        id: op.id,
        user_id: op.user_id || op.id,
        tenant_id: selectedTenantId,
        name: op.name,
        email: op.email,
        role: op.role,
        pin: op.pin || localOpPins[op.email?.toLowerCase()] || localOpPins[op.user_id] || ''
      }));

      // 2. Query ke Supabase tabel mpp_tenant_users
      try {
        const { data: tuData } = await supabase
          .from('mpp_tenant_users')
          .select('id, user_id, tenant_id, role, counter_name')
          .eq('tenant_id', selectedTenantId);

        if (tuData && tuData.length > 0) {
          const userIds = tuData.map(tu => tu.user_id);
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);

          const profMap = new globalThis.Map((profs || []).map(p => [p.id, p]));
          const dbOps: AssignedOperator[] = tuData.map(tu => {
            const prof = profMap.get(tu.user_id);
            const opEmail = prof?.email || '';
            return {
              id: tu.id,
              user_id: tu.user_id,
              tenant_id: tu.tenant_id,
              name: prof?.full_name || 'Petugas Gerai',
              email: opEmail,
              role: tu.role || 'staff',
              counter_name: (tu as any).counter_name || 'Loket 1',
              pin: localOpPins[opEmail.toLowerCase()] || localOpPins[tu.user_id] || ''
            };
          });

          // Gabungkan deduplikasi
          const combined = [...dbOps];
          matchedLocalOps.forEach(lo => {
            if (!combined.some(c => c.email.toLowerCase() === lo.email.toLowerCase())) {
              combined.push(lo);
            }
          });

          setAvailableOperators(combined);
          if (combined.length > 0) {
            setEmail(combined[0].email);
            if (combined[0].counter_name) {
              setSelectedCounter(combined[0].counter_name);
            }
          } else if (chosenTenant) {
            setEmail(`petugas.${chosenTenant.code.toLowerCase()}@luwukab.go.id`);
          }
          return;
        }
      } catch (err) {
        console.warn('Could not query mpp_tenant_users:', err);
      }

      setAvailableOperators(matchedLocalOps);
      if (matchedLocalOps.length > 0) {
        setEmail(matchedLocalOps[0].email);
      } else if (chosenTenant) {
        setEmail(`petugas.${chosenTenant.code.toLowerCase()}@luwukab.go.id`);
      }
    };

    loadTenantOperators();
  }, [selectedTenantId, tenants]);

  if (!isOpen) return null;

  const handleSelectTenant = (tId: string) => {
    setSelectedTenantId(tId);
    setErrorMessage('');
  };

  const handleSelectOperatorChip = (op: AssignedOperator) => {
    setEmail(op.email);
    setErrorMessage('');
  };

  const handleQuickDemo = () => {
    const chosen = tenants.find(t => t.id === selectedTenantId) || tenants[0];
    if (chosen) {
      setSelectedTenantId(chosen.id);
      if (availableOperators.length > 0) {
        setEmail(availableOperators[0].email);
        setPassword(availableOperators[0].pin || 'BPN2026@');
      } else {
        setEmail(`petugas.${chosen.code.toLowerCase()}@luwukab.go.id`);
        setPassword(chosen.officer_pin || 'Operator123!');
      }
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedTenantId) {
      setErrorMessage('Harap pilih instansi / gerai loket Anda.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Harap masukkan email akun dan kata sandi / PIN loket.');
      return;
    }

    const targetTenant = tenants.find(t => t.id === selectedTenantId);
    if (!targetTenant) {
      setErrorMessage('Data instansi tidak ditemukan.');
      return;
    }

    setIsLoading(true);

    try {
      // Dapatkan PIN Operasional Gerai (Metode A)
      const localTenantPins = JSON.parse(localStorage.getItem('mpp_tenant_pins') || '{}');
      const tenantPin = 
        targetTenant.officer_pin || 
        (targetTenant as any).pin || 
        localTenantPins[targetTenant.id] || 
        localTenantPins[targetTenant.code] || 
        '';

      // Dapatkan data operator terdaftar untuk gerai ini (Metode B)
      const localOps = JSON.parse(localStorage.getItem('mpp_portal_operators') || '[]');
      const localOpPins = JSON.parse(localStorage.getItem('mpp_operator_pins') || '{}');

      // Periksa apakah operator ini terdaftar di gerai terpilih
      let matchedOperator = availableOperators.find(o => o.email.toLowerCase() === cleanEmail);
      if (!matchedOperator) {
        matchedOperator = localOps.find((op: any) => 
          op.email?.toLowerCase() === cleanEmail && 
          (op.tenant_id === targetTenant.id || op.tenant === targetTenant.name || op.tenant_code === targetTenant.code)
        );
      }

      // Jika belum ketemu di memori lokal, coba query ke Supabase
      if (!matchedOperator) {
        try {
          const { data: dbProf } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (dbProf) {
            const { data: dbTu } = await supabase
              .from('mpp_tenant_users')
              .select('id, user_id, tenant_id, role')
              .eq('user_id', dbProf.id)
              .eq('tenant_id', targetTenant.id)
              .maybeSingle();

            if (dbTu) {
              matchedOperator = {
                id: dbTu.id,
                user_id: dbProf.id,
                tenant_id: targetTenant.id,
                name: dbProf.full_name,
                email: dbProf.email,
                role: dbTu.role || 'staff',
                pin: localOpPins[cleanEmail] || localOpPins[dbProf.id] || ''
              };
            } else {
              // Pengguna terdaftar di profiles tapi tidak dihubungkan ke tenant ini
              // Cek apakah terdaftar di tenant lain
              const { data: otherTu } = await supabase
                .from('mpp_tenant_users')
                .select('id, tenant_id')
                .eq('user_id', dbProf.id)
                .maybeSingle();

              if (otherTu && otherTu.tenant_id !== targetTenant.id) {
                const otherTenant = tenants.find(t => t.id === otherTu.tenant_id);
                setErrorMessage(
                  `Akun ${cleanEmail} terdaftar pada gerai "${otherTenant?.name || 'Lain'}", bukan pada gerai "${targetTenant.name}". Harap pilih gerai yang sesuai.`
                );
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (dbErr) {
          console.warn('Error verifying operator against Supabase:', dbErr);
        }
      }

      // 1. KONDISI A: Login Menggunakan PIN Operasional Gerai (Metode A)
      const isTenantPinMatch = Boolean(tenantPin && cleanPassword === tenantPin);

      // 2. KONDISI B: Login Menggunakan PIN Akun Operator (Metode B)
      const operatorPin = matchedOperator?.pin || localOpPins[cleanEmail] || (matchedOperator?.user_id ? localOpPins[matchedOperator.user_id] : '');
      const isOperatorPinMatch = Boolean(operatorPin && cleanPassword === operatorPin);

      // 3. KONDISI C: Demo Credentials
      const isDemoMatch = 
        cleanPassword === 'Operator123!' || 
        cleanPassword === 'Petugas123!' || 
        cleanPassword === '123456';

      let isSuccess = false;
      let finalOperatorName = '';
      let finalRole = 'operator_gerai';
      let authType = '';

      if (isOperatorPinMatch && matchedOperator) {
        // Berhasil autentikasi Akun Operator
        isSuccess = true;
        authType = 'Akun Operator Personal (mpp_tenant_users)';
        finalOperatorName = matchedOperator.name;
        finalRole = matchedOperator.role === 'admin' ? 'supervisor_gerai' : 'operator_gerai';
      } else if (isTenantPinMatch) {
        // Berhasil autentikasi PIN Gerai
        isSuccess = true;
        authType = 'PIN Operasional Gerai (mpp_tenants)';
        finalOperatorName = matchedOperator?.name || `Petugas Loket ${targetTenant.name} (${targetTenant.code})`;
        finalRole = matchedOperator?.role === 'admin' ? 'supervisor_gerai' : 'operator_gerai';
      } else if (isDemoMatch) {
        // Mode Demo
        isSuccess = true;
        authType = 'Akses Pengujian Demo';
        finalOperatorName = matchedOperator?.name || `Petugas Uji ${targetTenant.code}`;
        finalRole = 'operator_gerai';
      } else {
        // Coba login via Supabase Auth
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword
          });

          if (!authErr && authData?.user) {
            isSuccess = true;
            authType = 'Supabase Cloud Auth';
            finalOperatorName = authData.user.user_metadata?.full_name || matchedOperator?.name || `Petugas ${targetTenant.code}`;
            finalRole = matchedOperator?.role === 'admin' ? 'supervisor_gerai' : 'operator_gerai';
          }
        } catch {
          // Ignore
        }
      }

      if (isSuccess) {
        // Enforce unique session per user (check active session on other counters)
        const activeSessions = JSON.parse(localStorage.getItem('mpp_active_counter_sessions') || '{}');
        const existingSession = activeSessions[cleanEmail];
        if (existingSession && existingSession.counterName !== selectedCounter && (Date.now() - (existingSession.timestamp || 0) < 8 * 3600 * 1000)) {
          console.info(`Mengalihkan sesi aktif petugas dari ${existingSession.counterName} ke ${selectedCounter}`);
        }

        // PENTING: Lakukan pencatatan sesi aktif secara server-authoritative di database
        if (matchedOperator && matchedOperator.id) {
          try {
            const sessRes = await fetch('/api/mpp/tenant-users/session/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenant_user_id: matchedOperator.id,
                counter_name: selectedCounter,
                officer_name: finalOperatorName,
                force: false
              })
            });
            const sessData = await sessRes.json();
            
            if (sessData.active_conflict) {
              // Terdeteksi konflik sesi aktif di loket lain
              setErrorMessage('');
              setIsLoading(false);
              setConflictInfo({
                tenantUserId: matchedOperator.id,
                officerName: finalOperatorName,
                activeCounter: sessData.data?.counter_name || 'loket lain',
                finalRole: finalRole
              });
              setShowConflictConfirm(true);
              return;
            } else if (!sessData.success) {
              throw new Error(sessData.error || 'Gagal mendaftarkan sesi di server.');
            }
          } catch (sessErr: any) {
            console.warn('Gagal memverifikasi sesi loket aktif di server:', sessErr.message);
            // Tetap izinkan masuk jika offline / local fallback
          }
        }

        activeSessions[cleanEmail] = {
          userId: matchedOperator?.user_id || matchedOperator?.id || cleanEmail,
          operatorName: finalOperatorName,
          tenantId: targetTenant.id,
          counterName: selectedCounter,
          timestamp: Date.now()
        };
        localStorage.setItem('mpp_active_counter_sessions', JSON.stringify(activeSessions));

        const sessionPayload = {
          tenantId: targetTenant.id,
          tenantName: targetTenant.name,
          tenantCode: targetTenant.code,
          floor: targetTenant.floor || 'Lantai 1',
          name: finalOperatorName,
          operatorName: finalOperatorName,
          email: cleanEmail,
          role: finalRole,
          counterName: selectedCounter,
          userId: matchedOperator?.user_id || matchedOperator?.id || cleanEmail,
          authType: authType,
          loggedInAt: new Date().toISOString()
        };

        localStorage.setItem('mpp_tenant_operator_session', JSON.stringify(sessionPayload));
        setSuccessMessage(`Autentikasi berhasil (${authType})! Mengarahkan ke ${selectedCounter} (${targetTenant.name})...`);

        setTimeout(() => {
          setIsLoading(false);
          onSuccess(targetTenant, {
            name: finalOperatorName,
            email: cleanEmail,
            role: finalRole,
            counterName: selectedCounter,
            userId: matchedOperator?.user_id || matchedOperator?.id || cleanEmail
          });
        }, 500);
        return;
      }

      // Gagal
      setErrorMessage(
        `Kredensial tidak cocok. Periksa kembali email atau kata sandi/PIN Anda. Anda dapat menggunakan PIN Operasional Gerai atau PIN Operator Personal yang telah dikonfigurasi di portal admin.`
      );
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error logging in operator:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat verifikasi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden transition-all ${
          isDarkMode 
            ? 'bg-slate-900 text-white border-slate-800' 
            : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Android Top Handle bar (Mobile visual indicator) */}
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-3 flex items-start justify-between border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  Loket Gerai MPP
                </span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Android Ready
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-0.5 tracking-tight">
                Login Petugas Gerai
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Masuk menggunakan akun petugas terdaftar pada gerai loket Anda untuk melayani antrean masyarakat & investor secara real-time.
          </p>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-bold leading-relaxed">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* 1. Pilih Instansi / Gerai */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Instansi / Gerai Loket <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleSelectTenant(e.target.value)}
                  className={`w-full min-h-[48px] pl-3.5 pr-10 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border outline-none appearance-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {t.name} ({t.code}) - {t.floor || 'Lantai 1'}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Tampilkan Petugas Terdaftar di Gerai Ini jika ada */}
              {availableOperators.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-indigo-400" />
                    Pilih Cepat Petugas Terdaftar di Gerai Ini:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableOperators.map(op => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => handleSelectOperatorChip(op)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl font-medium border flex items-center gap-1 transition-all cursor-pointer ${
                          email.toLowerCase() === op.email.toLowerCase()
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        <UserCheck className="w-3 h-3 text-indigo-500" />
                        <span>{op.name}</span>
                        <span className="text-[9px] uppercase px-1 rounded bg-black/10 dark:bg-white/10">{op.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Loket Pelayanan Multi-Counter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Nama Loket Aktif (Multi-Counter) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-indigo-500 font-mono font-bold">Model Teller Bank</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCounter}
                  onChange={(e) => setSelectedCounter(e.target.value)}
                  className={`w-full min-h-[46px] pl-3.5 pr-10 py-2 rounded-2xl text-xs sm:text-sm font-bold border outline-none appearance-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-amber-400 focus:border-indigo-500' 
                      : 'bg-amber-500/5 border-amber-500/30 text-amber-800 focus:border-indigo-500'
                  }`}
                >
                  <option value="Loket 1">🏷️ Loket 1 (Layanan Reguler)</option>
                  <option value="Loket 2">🏷️ Loket 2 (Layanan Reguler)</option>
                  <option value="Loket 3">🏷️ Loket 3 (Layanan Berkas/Konsultasi)</option>
                  <option value="Loket 4">🏷️ Loket 4 (Layanan Pengambilan)</option>
                  <option value="Loket Prioritas">♿ Loket Prioritas (Lansia / Disabilitas / Ibu Hamil)</option>
                  <option value="Loket VIP Investor">🏢 Loket VIP Investor (DPMPTSP Corner)</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 3. Email Dinas / NIP */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Dinas / Akun Petugas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@luwukab.go.id"
                  className={`w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
            </div>

            {/* 3. Kata Sandi / PIN Petugas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kata Sandi / PIN Petugas <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 italic">
                  Dikelola di Manajemen Operator
                </span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi / PIN Anda"
                  className={`w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-2xl text-xs sm:text-sm border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Helper Button */}
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Gunakan Kredensial Uji Coba</span>
              </button>
              <span className="text-[10px] text-slate-400 font-mono">BPN: BPN2026@</span>
            </div>

            {/* Submit Button (Android min 48px touch target) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[50px] mt-3 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk ke Dashboard Loket</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Android Device Compatibility Note */}
          <div className="pt-3 border-t border-inherit text-center">
            <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dioptimalkan khusus layar Android, Tablet Loket, & Panggilan Suara Bel Bandara</span>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY: KONFIRMASI KONFLIK SESI AKTIF (TELLER MODEL LOCK) */}
      {showConflictConfirm && conflictInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-black">Sesi Loket Aktif</h4>
                <p className="text-[10px] text-slate-400">Model Teller Multi-Loket MPP</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Akun petugas <span className="font-semibold text-slate-700 dark:text-slate-200">{conflictInfo.officerName}</span> terdeteksi sedang melayani aktif di <span className="font-semibold text-amber-500">{conflictInfo.activeCounter}</span>.
              <br /><br />
              Sesuai kebijakan Teller Bank, akun petugas tidak diperbolehkan digunakan bersamaan pada beberapa loket aktif. Apakah Anda ingin mengakhiri sesi lama tersebut dan memindahkan pelayanan aktif Anda ke <span className="font-semibold text-indigo-500">{selectedCounter}</span>?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConflictConfirm(false);
                  setConflictInfo(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'}`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowConflictConfirm(false);
                  await handleForceLogin();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 cursor-pointer transition-all active:scale-[0.98]"
              >
                Ya, Paksa Masuk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetugasGeraiLoginModal;
