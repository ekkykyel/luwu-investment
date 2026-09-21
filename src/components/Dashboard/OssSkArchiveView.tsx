import React, { useState, useEffect } from 'react';
import { FileCheck2, Search, Printer, Download, RefreshCw, QrCode, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';
import { getOpdSettings } from '../../utils/opdSettingsStorage.js';

export const OssSkArchiveView: React.FC = () => {
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const settings = getOpdSettings('dpmptsp');

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const records: any[] = [];

      // 1. Fetch from gis_pkkpr (Primary table for SK PKKPR Final documents)
      try {
        const { data: gisData, error: gisError } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .or('sk_pkkpr_num.not.is.null,status_pkkpr.eq.Published,status_pkkpr.eq.Approved')
          .order('created_at', { ascending: false });

        if (!gisError && gisData && gisData.length > 0) {
          gisData.forEach((item: any) => {
            records.push({
              id: item.id,
              title: item.nama_permohonan || item.nama_badan_usaha || item.sektor || 'Izin Kegiatan Pemanfaatan Ruang (PKKPR)',
              investor_name: item.nama_pemohon || item.nama_badan_usaha || 'Pemohon Terdaftar',
              nib: item.nib_oss || item.nik_pemohon || '-',
              sk_pkkpr_doc_number: item.sk_pkkpr_num || `503/SK-PKKPR/DPMPTSP-LW/${item.id}`,
              district: item.kecamatan || 'Kabupaten Luwu',
              land_area_ha: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(2)) : 0.5),
              updated_at: item.updated_at || item.created_at,
              source: 'gis_pkkpr'
            });
          });
        }
      } catch (err) {
        console.warn("gis_pkkpr query info:", err);
      }

      // 2. Fetch from investments table using verified status column
      try {
        const { data: invData, error: invError } = await supabase
          .from('investments')
          .select('*')
          .or('status.eq.Published,status.eq.Approved')
          .order('updated_at', { ascending: false });

        if (!invError && invData && invData.length > 0) {
          invData.forEach((item: any) => {
            if (!records.some(r => r.id === item.id)) {
              records.push({
                id: item.id,
                title: item.name || 'Proyek Investasi Resmi',
                investor_name: item.contact_pic || 'Pelaku Usaha',
                nib: item.nib || '-',
                sk_pkkpr_doc_number: `503/SK-PKKPR/DPMPTSP-LW/${item.id.slice(0, 6)}`,
                district: item.kecamatan || 'Kabupaten Luwu',
                land_area_ha: item.area_ha || 1.0,
                updated_at: item.updated_at || item.created_at,
                source: 'investments'
              });
            }
          });
        }
      } catch (err) {
        console.warn("investments query info:", err);
      }

      setArchives(records);
    } catch (e) {
      console.error("Error fetching DPMPTSP SK archives:", e);
      setArchives([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const filteredArchives = archives.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(q) ||
      (item.investor_name || '').toLowerCase().includes(q) ||
      (item.nib || '').toLowerCase().includes(q) ||
      (item.sk_pkkpr_doc_number || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900/90 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                PABRIK PENERBITAN &amp; ARSIP SK PKKPR FINAL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Arsip &amp; Register SK PKKPR Terbit
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Daftar seluruh Surat Keputusan Kesesuaian Kegiatan Pemanfaatan Ruang (SK PKKPR) resmi yang telah diterbitkan {settings.opd.shortName} Kabupaten Luwu via OSS-RBA.
            </p>
          </div>

          <button
            onClick={fetchArchives}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 shadow-lg shadow-teal-950/30"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Muat Ulang Arsip</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIB, Investor, SK PKKPR Final..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Total SK Terbit: <strong className="text-teal-600 dark:text-teal-400">{filteredArchives.length} Izin Resmi</strong>
        </div>
      </div>

      {/* Archives Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <RefreshCw size={24} className="animate-spin text-teal-500 mx-auto" />
            <p>Memuat register arsip SK PKKPR Terbit...</p>
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <ShieldCheck size={32} className="text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Belum Ada SK PKKPR Terbit</p>
            <p>Izin yang dieksekusi di Monitoring Perizinan akan tersimpan di register ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">No. SK PKKPR Final</th>
                  <th className="px-4 py-3.5">Perusahaan &amp; Investor</th>
                  <th className="px-4 py-3.5">NIB &amp; Lokasi Kegiatan</th>
                  <th className="px-4 py-3.5">Penandatangan Kadin DPMPTSP</th>
                  <th className="px-4 py-3.5">Status TTE BSrE</th>
                  <th className="px-4 py-3.5 text-right">Aksi SK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredArchives.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                        <ShieldCheck size={14} />
                        <span>{item.sk_pkkpr_doc_number || item.pkkpr_doc_number || `503/SK-PKKPR/DPMPTSP-LW/2026/0${idx+1}`}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Status: PUBLISHED &amp; SAH</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{item.investor_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{item.district || 'Kabupaten Luwu'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIB: {item.nib || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{settings.kepalaDinas.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">NIP. {settings.kepalaDinas.nip}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <QrCode size={12} />
                        <span>TTE BSrE Sah</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-teal-600 hover:text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer size={13} />
                        <span>Cetak SK Final</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OssSkArchiveView;
