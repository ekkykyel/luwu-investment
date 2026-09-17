import { motion } from "motion/react";
import { X, Save, Trash2, Edit2, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
  email: string | null;
}

interface ManageOperatorsModalProps {
  onClose: () => void;
}

export default function ManageOperatorsModal({ onClose }: ManageOperatorsModalProps) {
  const [operators, setOperators] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Temporary state for inline edit
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const adminRoles = ['admin_promosi', 'admin_dalak', 'admin_oss', 'admin_data', 'Jabatan Pelaksana'];

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .in('role', adminRoles)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOperators(data || []);
    } catch (err: any) {
      console.error("Error fetching operators:", err.message);
      alert("Gagal mengambil data operator: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const handleEditClick = (op: Profile) => {
    setEditingId(op.id);
    setEditName(op.full_name || "");
    setEditRole(op.role || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName, role: editRole })
        .eq('id', id);

      if (error) throw error;
      
      setEditingId(null);
      await fetchOperators();
    } catch (err: any) {
      console.error("Error updating operator:", err.message);
      alert("Gagal menyimpan perubahan: " + err.message);
    }
  };

  const handleDelete = async (op: Profile) => {
    if (!window.confirm(`PERINGATAN: Anda yakin ingin menghapus akun ${op.full_name || op.email} secara permanen? Aksi ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      // Get JWT token from auth session to send in headers if needed (though backend handles parsing)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch("/api/admin/delete-operator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ user_id: op.id })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || "Gagal menghapus operator");
      }

      alert("Operator berhasil dihapus.");
      await fetchOperators();
    } catch (err: any) {
      console.error("Error deleting operator:", err);
      alert(err.message);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-4xl shadow-2xl relative overflow-hidden"
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-display">
          <ShieldAlert className="text-emerald-500" size={24} />
          Kelola Akun Operator
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama Lengkap</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Bidang (Role)</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-600 dark:text-slate-400">
                    Memuat data operator...
                  </td>
                </tr>
              ) : operators.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-600 dark:text-slate-400">
                    Tidak ada akun operator yang ditemukan.
                  </td>
                </tr>
              ) : (
                operators.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-800/20 transition-colors">
                    {editingId === op.id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:border-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{op.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="admin_promosi">Bidang Promosi & Penanaman Modal</option>
                            <option value="admin_dalak">Bidang Pengendalian Pelaksanaan & Pengawasan (DALAK)</option>
                            <option value="admin_oss">Bidang Penyelenggaraan Pelayanan Perizinan (DPMPTSP)</option>
                            <option value="admin_puptr">Admin Dinas PUPTR (Tata Ruang & Studio GIS)</option>
                            <option value="admin_pertanian">Admin Dinas Pertanian (LP2B & Lahan Basah)</option>
                            <option value="admin_mpp">Admin MPP (Pengelola Mal Pelayanan Publik)</option>
                            <option value="super_admin">Super Admin (Administrator Utama)</option>
                            <option value="admin_data">Bidang Perencanaan, Pengembangan Iklim & Data</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(op.id)}
                              className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors"
                              title="Simpan"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg transition-colors"
                              title="Batal"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {op.full_name || "Tanpa Nama"}
                        </td>
                        <td className="px-4 py-3">{op.email}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {op.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(op)}
                              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(op)}
                              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

// feat: implement superadmin user access management (UAM) panel
// hotfix: attached JWT bearer token to admin API requests to resolve 401 Unauthorized
