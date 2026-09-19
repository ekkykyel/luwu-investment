import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient.js';

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
        alert("Data Bursa Komoditas berhasil disimpan ke Cloud DB.");
      } else {
        alert("Gagal menyimpan data: " + error.message);
      }
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const addRow = () => {
    setData([...data, {
      symbol: 'LOCAL_BARU',
      shortName: 'KOMODITAS BARU',
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
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  if (loading) return <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Kelola Bursa Market
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Perbarui harga komoditas strategis yang tampil di running text halaman depan.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-800 dark:text-slate-200">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200">
            <tr>
              <th className="p-3 font-semibold rounded-tl-lg">ID / Simbol</th>
              <th className="p-3 font-semibold">Nama Komoditas</th>
              <th className="p-3 font-semibold">Harga (Rp)</th>
              <th className="p-3 font-semibold">Perubahan Harga (+/-)</th>
              <th className="p-3 font-semibold">Persentase (%)</th>
              <th className="p-3 font-semibold rounded-tr-lg">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="p-2">
                  <input type="text" value={item.symbol} onChange={(e) => handleChange(idx, 'symbol', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2">
                  <input type="text" value={item.shortName} onChange={(e) => handleChange(idx, 'shortName', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2">
                  <input type="number" value={item.regularMarketPrice} onChange={(e) => handleChange(idx, 'regularMarketPrice', parseFloat(e.target.value))} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2">
                  <input type="number" value={item.regularMarketChange} onChange={(e) => handleChange(idx, 'regularMarketChange', parseFloat(e.target.value))} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2">
                  <input type="number" value={item.regularMarketChangePercent} onChange={(e) => handleChange(idx, 'regularMarketChangePercent', parseFloat(e.target.value))} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => removeRow(idx)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Hapus Komoditas">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {data.length === 0 && (
          <div className="py-12 text-center text-slate-600 dark:text-slate-400 border border-t-0 border-slate-100 dark:border-slate-800 rounded-b-lg bg-slate-50/50 dark:bg-slate-800/10">
            Belum ada data komoditas. Silakan tambah data baru.
          </div>
        )}
      </div>

      <button
        onClick={addRow}
        className="mt-4 flex items-center justify-center w-full gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl font-medium transition-all"
      >
        <Plus className="w-4 h-4" />
        Tambah Komoditas Baru
      </button>

    </div>
  );
}
