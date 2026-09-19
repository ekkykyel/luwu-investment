import React, { useState, useEffect } from "react";
import { Check, Loader2, RefreshCw, AlertCircle, MapPin, Eye } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabaseClient";

interface DraftItem {
  id: string;
  name: string;
  type: string;
  category: string;
  status: string;
  collection: "potensi_investasi" | "infrastruktur" | "gis_potensi_investasi" | "gis_infrastruktur" | string;
  raw: any;
}

interface ModerationPanelProps {
  currentRole: string;
  isDarkMode: boolean;
  onRefreshMap: () => void;
}

export default function ModerationPanel({ currentRole, isDarkMode, onRefreshMap }: ModerationPanelProps) {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Strictly bypass Express API middleman and query the live Ground-Truth directly from Supabase
      const { data: potData, error: potError } = await supabase
        .from('gis_potensi_investasi')
        .select('*');

      if (potError) throw potError;

      if (potData) {
        undefined;
      }

      const { data: infraData, error: infraError } = await supabase
        .from('gis_infrastruktur')
        .select('*');

      if (infraError) throw infraError;

      if (infraData) {
        undefined;
      }

      const newDrafts: DraftItem[] = [];

      if (potData) {
        potData.forEach((row: any) => {
          const st = String(row.status || row.status_publikasi || 'Draft').toLowerCase();
          const stPub = String(row.status_publikasi || '').toLowerCase();
          if (st !== 'published' && st !== 'approved' && stPub !== 'published') {
            newDrafts.push({
              id: row.id,
              name: row.nama_potensi || 'Tanpa Nama',
              type: 'Spatial Polygon',
              category: row.sektor_utama || 'Potensi',
              status: row.status || row.status_publikasi || 'Draft',
              collection: 'gis_potensi_investasi',
              raw: row
            });
          }
        });
      }

      if (infraData) {
        infraData.forEach((row: any) => {
          const st = String(row.status || row.status_publikasi || 'Draft').toLowerCase();
          const stPub = String(row.status_publikasi || '').toLowerCase();
          if (st !== 'published' && st !== 'approved' && stPub !== 'published') {
            newDrafts.push({
              id: row.id,
              name: row.name || row.nama_infrastruktur || 'Tanpa Infrastruktur',
              type: 'Point',
              category: row.type || row.kategori || 'Infrastruktur',
              status: row.status || row.status_publikasi || 'Draft',
              collection: 'gis_infrastruktur',
              raw: row
            });
          }
        });
      }

      setDrafts(newDrafts);
    } catch (err: any) {
      console.error("Gagal memuat draf langsung dari Supabase:", err);
      setError(err.message || "Terjadi kesalahan internal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleApprove = async (id: string, collection: string) => {
    const confirm = await Swal.fire({
      title: "Konfirmasi Publikasi",
      text: "Apakah Anda yakin ingin mempublikasikan data draf ini secara langsung ke publik?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Publish!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
    });

    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({
        title: "Memproses...",
        text: "Sedang mengubah status menjadi Published dan mengupdate peta",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const token = localStorage.getItem("luwu_session_token");
      const targetId = (collection.includes('infra') || collection === 'infrastruktur') && typeof id === 'string' && !isNaN(Number(id))
        ? parseInt(id, 10)
        : id;

      let apiSuccess = false;

      // Ensure we map collection strings properly for backend API
      const apiCollection = (collection === 'gis_potensi_investasi' || collection === 'potensi_investasi')
        ? 'gis_potensi_investasi' 
        : 'gis_infrastruktur';

      try {
        undefined;
        
        // 1. Post to Express endpoint (this bypasses client-side RLS with the backend service role kawan!)
        const res = await fetch("/api/moderation/approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ 
            id: targetId, 
            collection: apiCollection, 
            status: 'Published' 
          }),
        });

        if (res.ok) {
          const apiRes = await res.json();
          if (apiRes.success) {
            apiSuccess = true;
            undefined;
            // Aggressive frontend state pruning immediately inside success block
            setDrafts((prevList) => prevList.filter(item => String(item.id) !== String(id) && String(item.id) !== String(targetId)));
          }
        } else {
          const errDetail = await res.json().catch(() => ({}));
          undefined;
        }
      } catch (apiErr) {
        undefined;
      }

      // 2. Direct Update as Fallback (in case server is not running full stack or error occurred)
      if (!apiSuccess) {
        undefined;
        
        const { data: updateData, error: dbError } = await supabase
          .from(apiCollection)
          .update({ 
            status: 'Published', 
            status_publikasi: 'Published',
            updated_at: new Date().toISOString()
          })
          .eq('id', targetId)
          .select();

        if (dbError) {
          console.error("SUPABASE UPDATE ERROR DI MODERASI PANEL:", dbError.message, dbError.details);
          throw new Error(`Gagal Update DB: ${dbError.message}`);
        }

        if (!updateData || updateData.length === 0) {
          throw new Error(
            "Gagal melakukan update di database: Record tidak ditemukan atau RLS (Row Level Security) membatasi hak akses UPDATE Anda untuk tabel ini."
          );
        }

        // Update investments table as well if it represents a potensi_investasi
        if (collection === 'gis_potensi_investasi' || collection === 'potensi_investasi') {
          const { data: invData, error: invErr } = await supabase
            .from('investments')
            .update({ 
              status: 'Published', 
              status_publikasi: 'Published',
              updated_at: new Date().toISOString()
            })
            .eq('id', targetId)
            .select();

          if (invErr) {
            undefined;
          }
        }

        // Aggressive frontend state pruning inside fallback success block
        setDrafts((prevList) => prevList.filter(item => String(item.id) !== String(id) && String(item.id) !== String(targetId)));
      }

      // 3. Double-verify local state and filter out target items to be bulletproof
      setDrafts((prevList) => prevList.filter(item => String(item.id) !== String(id) && String(item.id) !== String(targetId)));

      await Swal.fire({
        icon: "success",
        title: "Diterbitkan!",
        text: "Data spasial berhasil dipublish!",
        timer: 1500,
        showConfirmButton: false,
      });

      // 4. Trigger map layer refresh
      if (onRefreshMap) {
        onRefreshMap();
      }

    } catch (err: any) {
      console.error("Gagal melakukan publish data:", err);
      Swal.fire({
        title: "Gagal",
        text: err.message || "Gagal mempublish data. Periksa koneksi.",
        icon: "error"
      });
    }
  };

  return (
    <div className="p-4 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 font-sans flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 text-amber-500" /> Moderasi data ({drafts.length})
        </h3>
        <button
          onClick={fetchDrafts}
          className="p-1 text-slate-600 dark:text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="Segarkan data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith("luwu_") && key !== "luwu_session_token") localStorage.removeItem(key);
            });
            Swal.fire("Cache Dibersihkan", "Semua data draf lokal telah dihapus.", "success");
            fetchDrafts();
          }}
          className="p-1 ml-2 text-rose-700 dark:text-rose-400 hover:text-white rounded hover:bg-rose-900 transition-colors border border-rose-900/50"
          title="Hapus Semua Draf Lokal"
        >
          <AlertCircle className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-2" />
          <p className="text-xs text-slate-600 dark:text-slate-400">Memuat data draf...</p>
        </div>
      ) : error ? (
        <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-2 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Gagal Pengambilan Data</div>
            <div className="opacity-80">{error}</div>
          </div>
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center mb-2 text-slate-600 dark:text-slate-400">
            <Check className="h-5 w-5 text-emerald-500" />
          </div>
          <h4 className="text-xs font-bold text-slate-300 mb-1">Semua Bersih</h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Keren! Tidak ada data spasial berstatus Draf / usulan baru yang menunggu persetujuan.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar min-h-0">
          {drafts.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex flex-col gap-2.5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${isDarkMode ? "bg-slate-900/40 border-slate-700/50 hover:border-slate-600" : "bg-white/60 border-white/40 shadow-sm hover:border-slate-300"}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    {item.collection === "infrastruktur" ? (
                      <span className="flex items-center gap-0.5 text-indigo-700 dark:text-indigo-400 font-sans font-semibold">
                        <MapPin className="h-3 w-3" /> Infra
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-sans font-semibold">
                        🗺️ Potensi
                      </span>
                    )}
                    <span>• {item.category}</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">
                  {item.status}
                </span>
              </div>

              {item.raw?.properties?.district && (
                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-sans italic bg-slate-950/20 p-1.5 rounded">
                  Area: {item.raw.properties.district}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(item.id, item.collection)}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-sans text-[10px] uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow"
                >
                  <Check className="h-3 w-3" /> Approve / Publish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
