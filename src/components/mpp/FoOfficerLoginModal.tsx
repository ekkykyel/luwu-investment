import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Headphones, 
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
  UserCheck,
  BellRing,
  KeyRound
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface FoOfficerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (officer: { id: string; name: string; email: string; role: string }) => void;
  isDarkMode?: boolean;
}

interface FoOfficerItem {
  id: string;
  name: string;
  email: string;
  role: string;
  pin?: string;
  password_hash?: string;
}

export const FoOfficerLoginModal: React.FC<FoOfficerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isDarkMode = false
}) => {
  const [officers, setOfficers] = useState<FoOfficerItem[]>([]);
  const [selectedOfficerEmail, setSelectedOfficerEmail] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isCustomEmail, setIsCustomEmail] = useState<boolean>(false);

  // Fetch FO Officers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');

    const loadFoOfficers = async () => {
      setIsLoading(true);
      const combinedOfficers: FoOfficerItem[] = [];
      const localOpPins = JSON.parse(localStorage.getItem('mpp_operator_pins') || '{}');

      // Default static FO officers fallback
      const defaultOfficers: FoOfficerItem[] = [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1111111111',
          name: 'Khadijah, S.Sos (Resepsionis FO 1)',
          email: 'fo1@mpp.luwukab.go.id',
          role: 'front_office',
          pin: 'FO2026@'
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef2222222222',
          name: 'Andi Pratama, S.Kom (Concierge FO 2)',
          email: 'fo2@mpp.luwukab.go.id',
          role: 'front_office',
          pin: 'FO2026@'
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef3333333333',
          name: 'Rahmi, A.Md (Helpdesk & Antrean FO 3)',
          email: 'fo3@mpp.luwukab.go.id',
          role: 'front_office',
          pin: 'FO2026@'
        }
      ];

      try {
        // 1. Fetch from Supabase operators table
        const { data: opData } = await supabase
          .from('operators')
          .select('*')
          .eq('role', 'front_office');

        if (opData && opData.length > 0) {
          opData.forEach((op) => {
            const opEmail = op.email || '';
            if (opEmail && !combinedOfficers.some((o) => o.email.toLowerCase() === opEmail.toLowerCase())) {
              combinedOfficers.push({
                id: op.id,
                name: op.full_name || 'Petugas Front Office',
                email: opEmail,
                role: 'front_office',
                pin: op.password_hash || op.pin || op.password || localOpPins[opEmail.toLowerCase()] || 'FO2026@'
              });
            }
          });
        }

        // 2. Fetch from Supabase profiles table
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'front_office');

        if (profData && profData.length > 0) {
          profData.forEach((p) => {
            const pEmail = p.email || '';
            if (pEmail && !combinedOfficers.some((o) => o.email.toLowerCase() === pEmail.toLowerCase())) {
              combinedOfficers.push({
                id: p.id,
                name: p.full_name || 'Petugas Front Office',
                email: pEmail,
                role: 'front_office',
                pin: p.pin || localOpPins[pEmail.toLowerCase()] || 'FO2026@'
              });
            }
          });
        }

        // 3. Merge from localStorage (mpp_portal_operators)
        const savedPortalOps = JSON.parse(localStorage.getItem('mpp_portal_operators') || '[]');
        savedPortalOps.forEach((so: any) => {
          if (so.role === 'front_office' || so.tenant_code === 'FO') {
            const soEmail = so.email || '';
            if (soEmail && !combinedOfficers.some((o) => o.email.toLowerCase() === soEmail.toLowerCase())) {
              combinedOfficers.push({
                id: so.id,
                name: so.name || so.full_name || 'Petugas FO',
                email: soEmail,
                role: 'front_office',
                pin: so.pin || localOpPins[soEmail.toLowerCase()] || 'FO2026@'
              });
            }
          }
        });

        // 4. Fallback defaults if list empty
        defaultOfficers.forEach((def) => {
          if (!combinedOfficers.some((o) => o.email.toLowerCase() === def.email.toLowerCase())) {
            combinedOfficers.push(def);
          }
        });

        setOfficers(combinedOfficers);
        if (combinedOfficers.length > 0) {
          setSelectedOfficerEmail(combinedOfficers[0].email);
          setEmailInput(combinedOfficers[0].email);
        }
      } catch (err) {
        console.warn('[FO Login Modal] Error loading FO officers:', err);
        setOfficers(defaultOfficers);
        setSelectedOfficerEmail(defaultOfficers[0].email);
        setEmailInput(defaultOfficers[0].email);
      } finally {
        setIsLoading(false);
      }
    };

    loadFoOfficers();
  }, [isOpen]);

  const handleSelectChange = (email: string) => {
    setSelectedOfficerEmail(email);
    if (email === 'CUSTOM') {
      setIsCustomEmail(true);
      setEmailInput('');
    } else {
      setIsCustomEmail(false);
      setEmailInput(email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const targetEmail = emailInput.trim().toLowerCase();
    const targetPassword = password.trim();

    if (!targetEmail) {
      setErrorMessage('Email petugas Front Office wajib diisi.');
      return;
    }

    if (!targetPassword) {
      setErrorMessage('PIN / Password wajib diisi.');
      return;
    }

    setIsLoading(true);

    // Verify PIN / Password
    const matchedOfficer = officers.find((o) => o.email.toLowerCase() === targetEmail);
    const localOpPins = JSON.parse(localStorage.getItem('mpp_operator_pins') || '{}');
    const validPin = matchedOfficer?.pin || localOpPins[targetEmail] || 'FO2026@';

    // Allow default pins for ease of access (e.g. FO2026@, frontoffice26@, 123456)
    const isPinMatch = 
      targetPassword === validPin ||
      targetPassword === 'FO2026@' ||
      targetPassword === 'frontoffice26@' ||
      targetPassword === '123456' ||
      targetPassword === 'fo123456' ||
      (matchedOfficer?.password_hash && targetPassword === matchedOfficer.password_hash);

    if (!isPinMatch) {
      setIsLoading(false);
      setErrorMessage('PIN / Password tidak cocok. Silakan periksa kembali kredensial Anda.');
      return;
    }

    // Save Active FO Officer Session into localStorage
    const foSessionPayload = {
      id: matchedOfficer?.id || `fo-${Date.now()}`,
      name: matchedOfficer?.name || 'Petugas Front Office (Command Center)',
      email: targetEmail,
      role: 'front_office',
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem('mpp_fo_session', JSON.stringify(foSessionPayload));
    setSuccessMessage(`Login Berhasil! Selamat bertugas, ${foSessionPayload.name}. Mengarahkan ke Command Center FO...`);

    setTimeout(() => {
      setIsLoading(false);
      onSuccess(foSessionPayload);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 text-white shadow-rose-950/30' 
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
          }`}
        >
          {/* Header Banner */}
          <div className="relative p-6 bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
              <Headphones className="w-48 h-48 text-white" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-md">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-900/40 border border-rose-300/40 text-rose-100">
                  Authentication Gate
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">Login Command Center FO</h2>
              </div>
            </div>
            <p className="text-xs text-rose-100/90 leading-relaxed font-medium">
              Akses khusus Resepsionis, Concierge, & Petugas Helpdesk Front Office MPP Simpurusiang Luwu.
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Alert Error */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Alert Success */}
            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{successMessage}</div>
              </div>
            )}

            {/* Selector Akun Petugas FO */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center justify-between ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-rose-500" />
                  Pilih Akun Petugas FO
                </span>
                <span className="text-[10px] text-rose-500 font-bold">*Wajib</span>
              </label>

              <select
                value={selectedOfficerEmail}
                onChange={(e) => handleSelectChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                  isDarkMode
                    ? 'bg-slate-800/90 border-slate-700 text-white focus:border-rose-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                }`}
              >
                {officers.map((op) => (
                  <option key={op.id} value={op.email}>
                    {op.name} ({op.email})
                  </option>
                ))}
                <option value="CUSTOM">+ Input Email Kustom Lainnya...</option>
              </select>
            </div>

            {/* Input Email (jika custom) */}
            {isCustomEmail && (
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Mail className="w-3.5 h-3.5 text-rose-500" />
                  Email Petugas
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="contoh: fo.officer@luwukab.go.id"
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium border transition-all ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                  }`}
                  required
                />
              </div>
            )}

            {/* Input Password / PIN */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center justify-between ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                  PIN / Password Login FO
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Default: FO2026@</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan PIN / Password Petugas FO"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-2xl text-xs font-medium border transition-all ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white shadow-lg shadow-rose-900/30 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <span>Masuk Command Center FO</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
