import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Swal from 'sweetalert2';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Key, 
  Send, 
  ShieldCheck, 
  UserPlus, 
  Phone, 
  CreditCard, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  Smartphone,
  Building,
  UserCheck
} from 'lucide-react';

export interface CitizenRecord {
  nik: string;
  nama?: string;
  no_hp?: string;
  source?: string;
  last_active?: string;
  password_hash?: string;
  created_at?: string;
  role?: string;
  nib?: string;
  perusahaan?: string;
}

export const AdminUserManagement: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = false }) => {
  const [citizens, setCitizens] = useState<CitizenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'WARGA' | 'INVESTOR'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'GUEST' | 'HYBRID' | 'KIOSK'>('ALL');
  
  const [isResetting, setIsSendingReset] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<string | null>(null);

  // New Citizen Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNik, setNewNik] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'WARGA' | 'INVESTOR'>('WARGA');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Load citizens list from database and API
  const fetchCitizens = async () => {
    setLoading(true);
    try {
      // 1. Try backend API endpoint
      const res = await fetch('/api/admin/citizens');
      if (res.ok) {
        const data = await res.json();
        if (data?.citizens) {
          setCitizens(data.citizens);
          setLoading(false);
          return;
        }
      }

      // 2. Direct Supabase Fallback
      const { data, error } = await supabase
        .from('mpp_citizens')
        .select('*')
        .order('last_active', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Supabase fetch mpp_citizens note:', error);
      }
      setCitizens(data || []);
    } catch (err) {
      console.error('Error fetching citizens:', err);
      setCitizens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizens();
  }, []);

  // Filter logic
  const filteredCitizens = useMemo(() => {
    return citizens.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = 
        !q ||
        (c.nik && c.nik.toLowerCase().includes(q)) ||
        (c.nama && c.nama.toLowerCase().includes(q)) ||
        (c.no_hp && c.no_hp.toLowerCase().includes(q)) ||
        (c.nib && c.nib.toLowerCase().includes(q));

      const isInvestor = c.role === 'INVESTOR' || c.source?.includes('INVESTOR') || Boolean(c.nib);
      const matchRole = 
        roleFilter === 'ALL' ||
        (roleFilter === 'INVESTOR' && isInvestor) ||
        (roleFilter === 'WARGA' && !isInvestor);

      const matchSource = 
        sourceFilter === 'ALL' ||
        (sourceFilter === 'GUEST' && c.source === 'ONLINE_GUEST') ||
        (sourceFilter === 'HYBRID' && c.source === 'ONLINE_HYBRID') ||
        (sourceFilter === 'KIOSK' && c.source?.includes('KIOSK'));

      return matchSearch && matchRole && matchSource;
    });
  }, [citizens, searchQuery, roleFilter, sourceFilter]);

  // Handle Helpdesk Password Reset
  const handleResetPassword = async (user: CitizenRecord) => {
    const confirm = await Swal.fire({
      title: 'Reset Password Sementara?',
      html: `
        <div class="text-left text-xs space-y-2 p-2.5 bg-slate-100 rounded-lg">
          <p><strong>Nama:</strong> ${user.nama || 'Warga Pemohon'}</p>
          <p><strong>NIK/NIB:</strong> ${user.nik}</p>
          <p><strong>Nomor WA:</strong> ${user.no_hp || '-'}</p>
        </div>
        <p class="text-xs text-slate-500 mt-2">Sistem akan membuatkan password sementara 6-karakter dan mengirimkan notifikasi resmi via WhatsApp.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Reset & Kirim WA',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981'
    });

    if (!confirm.isConfirmed) return;

    setIsSendingReset(user.nik);
    try {
      const res = await fetch('/api/admin/reset-citizen-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik: user.nik,
          phone: user.no_hp || '',
          name: user.nama || ''
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mereset password.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Password Sementara Terbuat!',
        html: `
          <div class="text-left space-y-3 text-xs">
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p class="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">Kata Sandi Sementara</p>
              <p class="text-xl font-mono text-emerald-700 font-extrabold">${data.tempPassword}</p>
            </div>
            <p><strong>Pengguna:</strong> ${user.nama || 'Warga Pemohon'}</p>
            <p><strong>NIK:</strong> <span class="font-mono">${user.nik}</span></p>
            <p><strong>Nomor WA:</strong> <span class="font-mono">${data.phone}</span></p>
            <div class="p-2 bg-slate-100 rounded text-[11px] text-slate-600">
              Notifikasi kata sandi sementara telah dikirimkan ke WhatsApp pemohon.
            </div>
          </div>
        `,
        confirmButtonColor: '#10b981'
      });

      fetchCitizens();
    } catch (err: any) {
      console.error(err);
      Swal.fire('Gagal Reset Password', err.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setIsSendingReset(null);
    }
  };

  // Handle Send OTP WhatsApp directly to counter user
  const handleSendOtpWa = async (user: CitizenRecord) => {
    setIsSendingOtp(user.nik);
    try {
      const res = await fetch('/api/admin/send-citizen-otp-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik: user.nik,
          phone: user.no_hp || '',
          name: user.nama || ''
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirimkan Kode OTP.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Kode OTP WA Terkirim!',
        html: `
          <div class="text-left space-y-3 text-xs">
            <div class="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <p class="text-[10px] text-cyan-800 uppercase font-bold tracking-wider">Kode OTP Instant Kios/Loket</p>
              <p class="text-2xl font-mono text-cyan-700 font-extrabold tracking-widest">${data.otpCode}</p>
            </div>
            <p><strong>Pemohon:</strong> ${user.nama || 'Warga'}</p>
            <p><strong>Nomor WA:</strong> <span class="font-mono">${data.phone}</span></p>
            <p class="text-[11px] text-slate-500">Kode OTP 4-digit ini telah dikirim ke WhatsApp pemohon untuk verifikasi langsung di loket.</p>
          </div>
        `,
        confirmButtonColor: '#0ea5e9'
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire('Gagal Kirim OTP', err.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setIsSendingOtp(null);
    }
  };

  // Add / Register new citizen manually at Helpdesk
  const handleCreateCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newNik.length !== 16) {
      Swal.fire('NIK Tidak Valid', 'NIK harus tepat 16 digit angka.', 'warning');
      return;
    }

    setIsSavingUser(true);
    try {
      const { error } = await supabase.from('mpp_citizens').upsert({
        nik: newNik.trim(),
        nama: newNama.trim() || 'Warga Pemohon',
        no_hp: newPhone.trim() || '-',
        source: 'HELPDESK_REGISTER',
        last_active: new Date().toISOString()
      }, { onConflict: 'nik' });

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Pengguna Berhasil Terdaftar!',
        text: `Data warga dengan NIK ${newNik} berhasil didaftarkan di sistem Helpdesk MPP.`,
        confirmButtonColor: '#10b981'
      });

      setIsModalOpen(false);
      setNewNik('');
      setNewNama('');
      setNewPhone('');
      fetchCitizens();
    } catch (err: any) {
      console.error(err);
      Swal.fire('Gagal Pendaftaran', err.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  return (
    <div className={`p-4 sm:p-6 rounded-3xl border shadow-lg space-y-6 ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Manajemen Pengguna & Reset Password Helpdesk MPP
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola data pemohon terdaftar (Warga & Investor), atur reset kata sandi sementara, dan pemicuan OTP WA resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchCitizens()}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Registrasi Warga Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIK, NIB, Nama, WA..."
            className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs border outline-none font-mono ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        {/* Filter Role */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${
              roleFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('WARGA')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${
              roleFilter === 'WARGA' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Warga
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('INVESTOR')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${
              roleFilter === 'INVESTOR' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Investor
          </button>
        </div>

        {/* Filter Source */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setSourceFilter('ALL')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${
              sourceFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Semua Sumber
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('GUEST')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${
              sourceFilter === 'GUEST' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Guest
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('HYBRID')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${
              sourceFilter === 'HYBRID' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Hybrid
          </button>
        </div>
      </div>

      {/* Datatable */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className={`uppercase text-[10px] font-mono tracking-wider font-extrabold ${
            isDarkMode ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}>
            <tr>
              <th className="p-3">NIK / NIB</th>
              <th className="p-3">Nama Pemohon</th>
              <th className="p-3">No. WhatsApp</th>
              <th className="p-3">Role / Tipe</th>
              <th className="p-3">Koneksi Terakhir</th>
              <th className="p-3 text-center">Aksi Helpdesk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <span>Memuat daftar pengguna terdaftar...</span>
                </td>
              </tr>
            ) : filteredCitizens.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <span>Tidak ada data pengguna yang cocok dengan kriteria pencarian.</span>
                </td>
              </tr>
            ) : (
              filteredCitizens.map((user) => {
                const isInvestor = user.role === 'INVESTOR' || user.source?.includes('INVESTOR') || Boolean(user.nib);
                return (
                  <tr key={user.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {user.nik}
                      {user.nib && <div className="text-[10px] text-slate-400 font-sans">NIB: {user.nib}</div>}
                    </td>

                    <td className="p-3 font-semibold">
                      {user.nama || 'Warga Pemohon'}
                      {user.perusahaan && <div className="text-[10px] text-slate-400">{user.perusahaan}</div>}
                    </td>

                    <td className="p-3 font-mono">
                      {user.no_hp || '-'}
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isInvestor 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isInvestor ? <Building className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {isInvestor ? 'Investor / Corporate' : 'Warga (Masyarakat)'}
                      </span>
                    </td>

                    <td className="p-3 text-[11px] text-slate-400 font-mono">
                      {user.last_active ? new Date(user.last_active).toLocaleString('id-ID') : '-'}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => handleResetPassword(user)}
                          disabled={isResetting === user.nik}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Generate & Kirim Password Sementara via WA"
                        >
                          {isResetting === user.nik ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Key className="w-3.5 h-3.5" />
                          )}
                          <span>Pass Sementara</span>
                        </button>

                        {/* Send OTP WA Button */}
                        <button
                          type="button"
                          onClick={() => handleSendOtpWa(user)}
                          disabled={isSendingOtp === user.nik}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Kirim Kode OTP Instant WA"
                        >
                          {isSendingOtp === user.nik ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>OTP WA</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registration New Citizen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-500" />
              <span>Registrasi Pengguna Loket Helpdesk</span>
            </h3>

            <form onSubmit={handleCreateCitizen} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">NIK 16-Digit Pemohon <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  maxLength={16}
                  value={newNik}
                  onChange={(e) => setNewNik(e.target.value.replace(/\D/g, ''))}
                  placeholder="7317010101900001"
                  required
                  className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Nama Lengkap Pemohon</label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Andi Muhammad"
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Nomor WhatsApp Aktif</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="0812xxxxxxxx"
                  className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser || newNik.length !== 16}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingUser ? 'Menyimpan...' : 'Simpan Data Warga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
