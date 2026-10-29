import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Activity, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';

interface TickerData {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

export function AdminCommodityPrices() {
  const [data, setData] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: settingsData, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'market_ticker_data')
          .single();

        if (error) {
          console.warn(error);
          return;
        }
        if (settingsData && settingsData.setting_value) {
          let parsed = settingsData.setting_value;
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch (e) {}
          }
          if (Array.isArray(parsed)) {
            setData(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'market_ticker_data', 
          setting_value: data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
        
      if (!error) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Disimpan',
          text: 'Data Bursa Komoditas berhasil diperbarui ke database.',
          confirmButtonColor: '#059669'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan',
          text: error.message,
          confirmButtonColor: '#e11d48'
        });
      }
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: e.message || 'Tidak dapat menghubungi database.',
        confirmButtonColor: '#e11d48'
      });
    } finally {
      setSaving(false);
    }
  };

  const addRow = () => {
    setData([...data, {
      symbol: 'LOCAL_BARU',
      shortName: 'Komoditas Baru',
      regularMarketPrice: 0,
      regularMarketChange: 0,
      regularMarketChangePercent: 0
    }]);
  };

  const removeRow = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
  };

  const handleChange = (index: number, field: keyof TickerData, value: string | number) => {
    const newData = [...data];
    const normalizedValue = typeof value === 'number' && Number.isNaN(value) ? 0 : value;
    newData[index] = { ...newData[index], [field]: normalizedValue };
    setData(newData);
  };

  if (loading) {
    return (
      <div className="p-10 text-center bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-slate-800">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Memuat harga komoditas strategis...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Kelola Bursa Harga Komoditas</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Perbarui harga komoditas unggulan Kabupaten Luwu yang tampil secara langsung di portal publik.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-sm"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {/* Android Mobile Card List (md:hidden) */}
      <div className="md:hidden space-y-3">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                Komoditas #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="min-h-[40px] min-w-[40px] px-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                title="Hapus Komoditas"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Komoditas
                </label>
                <input
                  type="text"
                  value={item.shortName}
                  onChange={(e) => handleChange(idx, 'shortName', e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Kode / Simbol
                  </label>
                  <input
                    type="text"
                    value={item.symbol}
                    onChange={(e) => handleChange(idx, 'symbol', e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={item.regularMarketPrice}
                    onChange={(e) => handleChange(idx, 'regularMarketPrice', parseFloat(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono tabular-nums text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Selisih (+/- Rp)
                  </label>
                  <input
                    type="number"
                    value={item.regularMarketChange}
                    onChange={(e) => handleChange(idx, 'regularMarketChange', parseFloat(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono tabular-nums text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Persentase (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.regularMarketChangePercent}
                    onChange={(e) => handleChange(idx, 'regularMarketChangePercent', parseFloat(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono tabular-nums text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="py-10 px-4 text-center text-xs text-slate-600 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
            Belum ada data komoditas di database. Ketuk tombol di bawah untuk menambah data komoditas.
          </div>
        )}
      </div>

      {/* Desktop High-Density Table (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-800 dark:text-slate-200">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs">
            <tr>
              <th className="p-3 font-semibold rounded-tl-xl">ID / Simbol</th>
              <th className="p-3 font-semibold">Nama Komoditas</th>
              <th className="p-3 font-semibold text-right">Harga (Rp)</th>
              <th className="p-3 font-semibold text-right">Perubahan (+/-)</th>
              <th className="p-3 font-semibold text-right">Persentase (%)</th>
              <th className="p-3 font-semibold text-center rounded-tr-xl">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="p-2">
                  <input type="text" value={item.symbol} onChange={(e) => handleChange(idx, 'symbol', e.target.value)} className="w-full p-2 bg-white dark:bg-surface border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2">
                  <input type="text" value={item.shortName} onChange={(e) => handleChange(idx, 'shortName', e.target.value)} className="w-full p-2 bg-white dark:bg-surface border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2">
                  <input type="number" value={item.regularMarketPrice} onChange={(e) => handleChange(idx, 'regularMarketPrice', parseFloat(e.target.value))} className="w-full p-2 text-right bg-white dark:bg-surface border border-slate-200 dark:border-slate-700 rounded-lg font-mono tabular-nums text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2">
                  <input type="number" value={item.regularMarketChange} onChange={(e) => handleChange(idx, 'regularMarketChange', parseFloat(e.target.value))} className="w-full p-2 text-right bg-white dark:bg-surface border border-slate-200 dark:border-slate-700 rounded-lg font-mono tabular-nums text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2">
                  <input type="number" step="0.01" value={item.regularMarketChangePercent} onChange={(e) => handleChange(idx, 'regularMarketChangePercent', parseFloat(e.target.value))} className="w-full p-2 text-right bg-white dark:bg-surface border border-slate-200 dark:border-slate-700 rounded-lg font-mono tabular-nums text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => removeRow(idx)} className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer" title="Hapus Komoditas">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {data.length === 0 && (
          <div className="py-12 text-center text-slate-600 dark:text-slate-400 border border-t-0 border-slate-100 dark:border-slate-800 rounded-b-xl bg-slate-50/50 dark:bg-slate-800/10">
            Belum ada data komoditas. Silakan tambah data baru.
          </div>
        )}
      </div>

      <button
        onClick={addRow}
        className="min-h-[46px] flex items-center justify-center w-full gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Tambah Komoditas Baru</span>
      </button>
    </div>
  );
}
