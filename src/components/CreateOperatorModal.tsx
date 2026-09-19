import { motion } from "motion/react";
import React, { useState, useEffect } from "react";
import { UserPlus, X, UserSearch, User, Lock, Mail } from "lucide-react";
import { Role } from "../types";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabaseClient";

interface CreateOperatorAccountModalProps {
  onClose: () => void;
  currentRole?: Role;
}

export default function CreateOperatorAccountModal({ onClose, currentRole }: CreateOperatorAccountModalProps) {
  const [operatorName, setOperatorName] = useState("");
  const [operatorEmail, setOperatorEmail] = useState("");
  const [operatorPassword, setOperatorPassword] = useState("");
  const [role, setRole] = useState("admin_promosi");

  useEffect(() => {
    // Strict defense-in-depth: if not Superadmin, block entirely
    if (currentRole && currentRole !== Role.SUPER_ADMIN) {
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Pelanggaran Hak Akses: Hanya Superadmin yang diizinkan untuk membuat akun operator baru!",
        confirmButtonColor: "#ef4444"
      });
      onClose();
    }
  }, [currentRole, onClose]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentRole && currentRole !== Role.SUPER_ADMIN) {
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Anda tidak memiliki izin (Superadmin) untuk menyimpan akun operator!",
        confirmButtonColor: "#ef4444"
      });
      onClose();
      return;
    }

    if (!operatorName || !operatorEmail || !operatorPassword) {
      Swal.fire({
        icon: "warning",
        title: "Ketiadaan Data",
        text: "Mohon lengkapi seluruh kolom formulir akun operator sebelum menyimpan.",
        confirmButtonColor: "#f59e0b"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch("/api/auth/register-operator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          name: operatorName,
          email: operatorEmail,
          password: operatorPassword,
          role: role
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal membuat operator");
      }

      Swal.fire({
        icon: "success",
        title: "Akun Berhasil Dibuat",
        text: `Akun Operator baru telah terdaftar atas nama: ${operatorName} (${operatorEmail})`,
        confirmButtonColor: "#10b981"
      });
      onClose();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: error.message,
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-white/90 backdrop-blur-md dark:bg-slate-900/90 rounded-2xl w-full max-w-md shadow-2xl border border-white/40 dark:border-slate-700/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 text-white p-5 flex justify-between items-center border-b border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
              <UserPlus className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold font-display text-base uppercase tracking-wider">Akun Operator</h2>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">Buat kredensial akses petugas/operator baru</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-600 dark:text-slate-400" />
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Masukkan nama operator..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="operator-email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">Alamat Email / Username</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-600 dark:text-slate-400" />
              <input
                id="operator-email"
                name="email"
                type="email"
                autoComplete="email"
                value={operatorEmail}
                onChange={(e) => setOperatorEmail(e.target.value)}
                placeholder="operator@example.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="operator-password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">Password Akses</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-600 dark:text-slate-400" />
              <input
                id="operator-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={operatorPassword}
                onChange={(e) => setOperatorPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
              Pilih Bidang (Role) *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm appearance-none"
              required
            >
              <option value="admin_promosi">Bidang Promosi & Penanaman Modal</option>
              <option value="admin_dalak">Bidang Pengendalian Pelaksanaan & Pengawasan (DALAK)</option>
              <option value="admin_pelayanan">Bidang Pelayanan & Perizinan (DPMPTSP)</option>
              <option value="admin_puptr">Admin Dinas PUPTR (Tata Ruang & Studio GIS)</option>
              <option value="admin_pertanian">Admin Dinas Pertanian (LP2B & Lahan Basah)</option>
              <option value="admin_mpp">Admin MPP (Pengelola Mal Pelayanan Publik)</option>
              <option value="super_admin">Super Admin (Administrator Utama)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-sm shadow-xl shadow-slate-900/10 transition-all flex flex-center gap-2 items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <UserPlus className="h-4 w-4" /> {isLoading ? "Memproses..." : "Simpan Akun Operator"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// bugfix: added missing role dropdown to operator creation modal
// hotfix: attached JWT bearer token to admin API requests to resolve 401 Unauthorized
