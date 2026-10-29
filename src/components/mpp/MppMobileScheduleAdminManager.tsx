import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Clock,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Users
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface MppMobileSchedule {
  id: string;
  kecamatan: string;
  lokasi: string;
  hari_operasional: string;
  jam_operasional: string;
  layanan_tersedia: string[];
  kuota_harian: number;
  penanggung_jawab?: string | null;
  kontak_petugas?: string | null;
  catatan_warga?: string | null;
  is_active: boolean;
  urutan: number;
  created_at?: string;
  updated_at?: string;
}

export const KECAMATAN_LUWU_RESMI: string[] = [
  'Bajo',
  'Bajo Barat',
  'Bassesangtempe (Bastem)',
  'Bassesangtempe Utara',
  'Belopa',
  'Belopa Utara',
  'Bua',
  'Bua Ponrang (Bupon)',
  'Kamanre',
  'Lamasi',
  'Lamasi Timur',
  'Larompong',
  'Larompong Selatan',
  'Latimojong',
  'Ponrang',
  'Ponrang Selatan',
  'Suli',
  'Suli Barat',
  'Walenrang',
  'Walenrang Barat',
  'Walenrang Timur',
  'Walenrang Utara'
];

export async function fetchMppMobileSchedules(includeInactive = false): Promise<{
  data: MppMobileSchedule[];
  error: string | null;
}> {
  try {
    const res = await fetch(`/api/mpp/mobile-schedules${includeInactive ? '?all=true' : ''}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return { data: json.data as MppMobileSchedule[], error: null };
      }
    }
  } catch {
    // Fallback ke Supabase client langsung
  }

  try {
    let q = supabase
      .from('mpp_mobile_schedules')
      .select('*')
      .order('urutan', { ascending: true })
      .order('kecamatan', { ascending: true });

    if (!includeInactive) {
      q = q.eq('is_active', true);
    }

    const { data, error } = await q;
    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data || []) as MppMobileSchedule[], error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Gagal memuat jadwal layanan keliling dari database.' };
  }
}

interface MppMobileScheduleAdminManagerProps {
  isDark?: boolean;
}

export const MppMobileScheduleAdminManager: React.FC<MppMobileScheduleAdminManagerProps> = ({
  isDark = true
}) => {
  const [schedules, setSchedules] = useState<MppMobileSchedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [form, setForm] = useState({
    kecamatan: 'Latimojong',
    lokasi: '',
    hari_operasional: '',
    jam_operasional: '09.00 - 14.30 WITA',
    layanan_raw: '',
    kuota_harian: 50,
    penanggung_jawab: '',
    kontak_petugas: '',
    catatan_warga: '',
    is_active: true,
    urutan: 1
  });

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const result = await fetchMppMobileSchedules(true);
    setSchedules(result.data);
    if (result.error) {
      setErrorMsg(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      kecamatan: 'Latimojong',
      lokasi: '',
      hari_operasional: '',
      jam_operasional: '09.00 - 14.30 WITA',
      layanan_raw: '',
      kuota_harian: 50,
      penanggung_jawab: '',
      kontak_petugas: '',
      catatan_warga: '',
      is_active: true,
      urutan: schedules.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MppMobileSchedule) => {
    setEditingId(item.id);
    setForm({
      kecamatan: item.kecamatan,
      lokasi: item.lokasi,
      hari_operasional: item.hari_operasional,
      jam_operasional: item.jam_operasional,
      layanan_raw: Array.isArray(item.layanan_tersedia) ? item.layanan_tersedia.join(', ') : '',
      kuota_harian: Number(item.kuota_harian) || 50,
      penanggung_jawab: item.penanggung_jawab || '',
      kontak_petugas: item.kontak_petugas || '',
      catatan_warga: item.catatan_warga || '',
      is_active: item.is_active !== false,
      urutan: Number(item.urutan) || 1
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kecamatan.trim() || !form.lokasi.trim() || !form.hari_operasional.trim()) {
      showNotice('error', 'Kecamatan, titik lokasi, dan hari operasional wajib diisi.');
      return;
    }

    setIsSaving(true);
    const layananArr = form.layanan_raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      kecamatan: form.kecamatan.trim(),
      lokasi: form.lokasi.trim(),
      hari_operasional: form.hari_operasional.trim(),
      jam_operasional: form.jam_operasional.trim(),
      layanan_tersedia: layananArr,
      kuota_harian: Number(form.kuota_harian) || 50,
      penanggung_jawab: form.penanggung_jawab.trim() || null,
      kontak_petugas: form.kontak_petugas.trim() || null,
      catatan_warga: form.catatan_warga.trim() || null,
      is_active: form.is_active,
      urutan: Number(form.urutan) || 0
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('mpp_mobile_schedules')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        showNotice('success', `Jadwal pelayanan keliling Kec. ${payload.kecamatan} berhasil diperbarui.`);
      } else {
        const { error } = await supabase
          .from('mpp_mobile_schedules')
          .insert(payload);
        if (error) throw error;
        showNotice('success', `Jadwal pelayanan keliling Kec. ${payload.kecamatan} berhasil diterbitkan.`);
      }

      setIsModalOpen(false);
      await loadSchedules();
      window.dispatchEvent(new CustomEvent('mpp-mobile-schedules-updated'));
    } catch (err: any) {
      showNotice('error', err?.message || 'Gagal menyimpan jadwal ke Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item: MppMobileSchedule) => {
    try {
      const nextActive = !item.is_active;
      const { error } = await supabase
        .from('mpp_mobile_schedules')
        .update({ is_active: nextActive })
        .eq('id', item.id);
      if (error) throw error;
      showNotice('success', `Jadwal Kec. ${item.kecamatan} ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      await loadSchedules();
      window.dispatchEvent(new CustomEvent('mpp-mobile-schedules-updated'));
    } catch (err: any) {
      showNotice('error', err?.message || 'Gagal mengubah status jadwal.');
    }
  };

  const handleDelete = async (item: MppMobileSchedule) => {
    try {
      const { error } = await supabase
        .from('mpp_mobile_schedules')
        .delete()
        .eq('id', item.id);
      if (error) throw error;
      showNotice('success', `Jadwal Kec. ${item.kecamatan} telah dihapus dari database.`);
      await loadSchedules();
      window.dispatchEvent(new CustomEvent('mpp-mobile-schedules-updated'));
    } catch (err: any) {
      showNotice('error', err?.message || 'Gagal menghapus jadwal.');
    }
  };

  return (
    <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight">
            Jadwal Mobil Pelayanan Keliling & Gerai Hub Kecamatan
          </h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Data pada tabel <code className="font-mono">mpp_mobile_schedules</code> langsung ditampilkan secara aktual pada Portal Publik MPP Simpurusiang.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadSchedules}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal Keliling</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Gagal terhubung ke tabel jadwal layanan keliling: {errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-xs text-slate-500">
          Memuat jadwal layanan keliling dari Supabase...
        </div>
      ) : schedules.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center space-y-2 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <MapPin className="w-7 h-7 text-slate-400 mx-auto" />
          <div className="text-sm font-bold">Belum Ada Jadwal Layanan Keliling</div>
          <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Sesuai prinsip transparansi data, portal publik menampilkan status kosong secara jujur hingga Admin menerbitkan jadwal resmi kunjungan kecamatan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 ${
                isDark
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-slate-50/70 border-slate-200'
              } ${!item.is_active ? 'opacity-65' : ''}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold">
                      Kecamatan {item.kecamatan}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.hari_operasional} · {item.jam_operasional} · Kuota <span className="font-mono tabular-nums">{item.kuota_harian}</span> berkas
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      item.is_active
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-500/10 border-slate-500/30 text-slate-500'
                    }`}
                  >
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                <div className="text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{item.lokasi}</span>
                </div>

                {Array.isArray(item.layanan_tersedia) && item.layanan_tersedia.length > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Layanan: {item.layanan_tersedia.join(' · ')}
                  </div>
                )}

                {(item.penanggung_jawab || item.kontak_petugas) && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 pt-1">
                    {item.penanggung_jawab && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" /> {item.penanggung_jawab}
                      </span>
                    )}
                    {item.kontak_petugas && (
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Phone className="w-3 h-3" /> {item.kontak_petugas}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Ubah Jadwal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-5 sm:p-6 space-y-4 max-h-[90dvh] overflow-y-auto shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-sm sm:text-base font-bold">
                {editingId ? 'Ubah Jadwal Layanan Keliling' : 'Terbitkan Jadwal Layanan Keliling Baru'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Kecamatan Tujuan</label>
                  <select
                    value={form.kecamatan}
                    onChange={(e) => setForm({ ...form, kecamatan: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  >
                    {KECAMATAN_LUWU_RESMI.map(kec => (
                      <option key={kec} value={kec}>{kec}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Kuota Berkas Harian</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={form.kuota_harian}
                    onChange={(e) => setForm({ ...form, kuota_harian: Number(e.target.value) })}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border font-mono tabular-nums bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Titik Lokasi Pelayanan</label>
                <input
                  type="text"
                  required
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  placeholder="Contoh: Aula Kantor Camat Latimojong"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Hari / Tanggal Operasional</label>
                  <input
                    type="text"
                    required
                    value={form.hari_operasional}
                    onChange={(e) => setForm({ ...form, hari_operasional: e.target.value })}
                    placeholder="Contoh: Setiap Selasa / 14 Nov 2026"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Jam Operasional</label>
                  <input
                    type="text"
                    required
                    value={form.jam_operasional}
                    onChange={(e) => setForm({ ...form, jam_operasional: e.target.value })}
                    placeholder="Contoh: 09.00 - 14.30 WITA"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Daftar Layanan Tersedia (pisahkan dengan koma)</label>
                <textarea
                  rows={2}
                  required
                  value={form.layanan_raw}
                  onChange={(e) => setForm({ ...form, layanan_raw: e.target.value })}
                  placeholder="Contoh: Perekaman KTP-el & KIA, Kartu Keluarga, Konsultasi NIB OSS"
                  className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Koordinator / Tim OPD</label>
                  <input
                    type="text"
                    value={form.penanggung_jawab}
                    onChange={(e) => setForm({ ...form, penanggung_jawab: e.target.value })}
                    placeholder="Contoh: Tim Terpadu DPMPTSP & Dukcapil"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Nomor WhatsApp Petugas Lapangan</label>
                  <input
                    type="tel"
                    value={form.kontak_petugas}
                    onChange={(e) => setForm({ ...form, kontak_petugas: e.target.value })}
                    placeholder="Contoh: 628114200999"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border font-mono tabular-nums bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Catatan Persiapan Warga (Opsional)</label>
                <input
                  type="text"
                  value={form.catatan_warga}
                  onChange={(e) => setForm({ ...form, catatan_warga: e.target.value })}
                  placeholder="Contoh: Bawa KTP/KK asli untuk verifikasi biometrik"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="font-semibold">Tampilkan aktif di Portal Publik</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-60"
                  >
                    {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Jadwal'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MppMobileScheduleAdminManager;
