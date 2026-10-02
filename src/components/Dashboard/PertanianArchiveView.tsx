import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Search, 
  Printer, 
  Download, 
  RefreshCw, 
  FileText, 
  Eye, 
  X, 
  QrCode,
  Sprout,
  Wheat,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getOpdSettings } from '../../utils/opdSettingsStorage.js';
import { BapLp2bPertanianDocument, convertAppToBapLp2bData } from '../documents/BapLp2bPertanianDocument';

export const PertanianArchiveView: React.FC = () => {
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const settings = getOpdSettings('pertanian');

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const records: any[] = [];

      // 1. Fetch from pkkpr_permohonan (SSOT for workflow)
      try {
        const { data: permData, error: permError } = await supabase
          .from('pkkpr_permohonan')
          .select('*')
          .or('berita_acara_pertanian_num.not.is.null,status_permohonan.eq.PERTEK_PERTANIAN,status_permohonan.eq.PROSES_OSS,status_permohonan.eq.IZIN_TERBIT')
          .order('created_at', { ascending: false });

        if (!permError && permData && permData.length > 0) {
          permData.forEach((item: any) => {
            records.push({
              ...item,
              id: item.id,
              title: item.nama_kegiatan || item.nama_permohonan || 'Kesesuaian Lahan Pertanian (LP2B)',
              investor_name: item.pemohon_name || item.nama_pemohon || 'Pemohon Terdaftar',
              nama_pemohon: item.pemohon_name || item.nama_pemohon || 'Pemohon Terdaftar',
              nama_perusahaan: item.nama_perusahaan || item.nama_badan_usaha || item.pemohon_name || 'Pelaku Usaha',
              nib: item.nomor_permohonan || item.nik_pemohon || item.nib_pemohon || item.nib_oss || '-',
              berita_acara_doc_num: item.berita_acara_pertanian_num || `520/BA-LP2B/DISTAN-LW/${item.id}`,
              nomorSurat: item.berita_acara_pertanian_num || `520/BA-LP2B/DISTAN-LW/${item.id}`,
              district: item.kecamatan_name || item.kecamatan || 'Kabupaten Luwu',
              kecamatan: item.kecamatan_name || item.kecamatan || 'Kabupaten Luwu',
              desa_kelurahan: item.desa_kelurahan || item.village_name || '-',
              land_area_ha: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(2)) : 0.5),
              updated_at: item.updated_at || item.created_at,
              source: 'pkkpr_permohonan'
            });
          });
        }
      } catch (err) {
        console.warn("pkkpr_permohonan query info in Pertanian archive:", err);
      }

      // 2. Fetch from gis_pkkpr (Primary table for BAP Pertanian documents)
      try {
        const { data: gisData, error: gisError } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .or('berita_acara_pertanian_num.not.is.null,status_pkkpr.eq.Approved_Pertanian,status_pkkpr.eq.Approved,status_pkkpr.eq.Published')
          .order('created_at', { ascending: false });

        if (!gisError && gisData && gisData.length > 0) {
          gisData.forEach((item: any) => {
            if (!records.some(r => r.id === item.id)) {
              records.push({
                ...item,
                id: item.id,
                title: item.nama_permohonan || item.nama_badan_usaha || item.sektor || 'Kesesuaian Lahan Pertanian (LP2B)',
                investor_name: item.nama_pemohon || item.nama_badan_usaha || 'Pemohon Terdaftar',
                nama_pemohon: item.nama_pemohon || item.nama_badan_usaha || 'Pemohon Terdaftar',
                nama_perusahaan: item.nama_badan_usaha || item.nama_pemohon || 'Pelaku Usaha',
                nib: item.nib_oss || item.nik_pemohon || '-',
                berita_acara_doc_num: item.berita_acara_pertanian_num || `520/BA-LP2B/DISTAN-LW/${item.id}`,
                nomorSurat: item.berita_acara_pertanian_num || `520/BA-LP2B/DISTAN-LW/${item.id}`,
                district: item.kecamatan || 'Kabupaten Luwu',
                kecamatan: item.kecamatan || 'Kabupaten Luwu',
                desa_kelurahan: item.desa_kelurahan || '-',
                land_area_ha: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(2)) : 0.5),
                updated_at: item.updated_at || item.created_at,
                source: 'gis_pkkpr'
              });
            }
          });
        }
      } catch (err) {
        console.warn("gis_pkkpr query info:", err);
      }

      // 3. Fetch from investments table using verified existing columns
      try {
        const { data: invData, error: invError } = await supabase
          .from('investments')
          .select('*')
          .or('berita_acara_num.not.is.null,pertanian_status.eq.BA_TERBIT,pertanian_status.eq.Approved,status.eq.Approved_Pertanian,status.eq.Published')
          .order('updated_at', { ascending: false });

        if (!invError && invData && invData.length > 0) {
          invData.forEach((item: any) => {
            if (!records.some(r => r.id === item.id)) {
              records.push({
                ...item,
                id: item.id,
                title: item.name || 'Proyek Pertanian Terdaftar',
                investor_name: item.contact_pic || 'Pelaku Usaha',
                nama_pemohon: item.contact_pic || 'Pelaku Usaha',
                nama_perusahaan: item.company || item.name || 'Pelaku Usaha',
                nib: item.nib || '-',
                berita_acara_doc_num: item.berita_acara_num || `520/BA-LP2B/DISTAN-LW/${item.id.slice(0, 6)}`,
                nomorSurat: item.berita_acara_num || `520/BA-LP2B/DISTAN-LW/${item.id.slice(0, 6)}`,
                district: item.kecamatan || 'Kabupaten Luwu',
                kecamatan: item.kecamatan || 'Kabupaten Luwu',
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
      console.error("Error fetching Pertanian archives:", e);
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
      (item.berita_acara_doc_num || '').toLowerCase().includes(q) ||
      (item.district || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/90 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                ARSIP BERITA ACARA LAHAN PERTANIAN (LP2B)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Arsip &amp; Riwayat BAP Dinas Pertanian
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Daftar seluruh Berita Acara Evaluasi Lahan Pertanian Pangan Berkelanjutan (BAP LP2B) resmi yang diterbitkan {settings.opd.shortName} Kabupaten Luwu.
            </p>
          </div>

          <button
            onClick={fetchArchives}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 shadow-lg shadow-emerald-950/30"
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
            placeholder="Cari NIB, Pemohon, No. BAP Pertanian..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Total BAP Terbit: <strong className="text-emerald-600 dark:text-emerald-400">{filteredArchives.length} Berkas</strong>
        </div>
      </div>

      {/* Archives Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <RefreshCw size={24} className="animate-spin text-emerald-500 mx-auto" />
            <p>Memuat database arsip BAP Pertanian...</p>
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <FileText size={32} className="text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Berita Acara BAP Terbit</p>
            <p>Dokumen yang disetujui di Rekomendasi Lahan Pertanian akan diarsipkan di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">No. BAP / NIB</th>
                  <th className="px-4 py-3.5">Pemohon &amp; Komoditas</th>
                  <th className="px-4 py-3.5">Kawasan &amp; Luas Lahan</th>
                  <th className="px-4 py-3.5">Penandatangan Kadin</th>
                  <th className="px-4 py-3.5">Tanggal BAP</th>
                  <th className="px-4 py-3.5 text-right">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredArchives.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {item.berita_acara_doc_num || `520/BA-LP2B/DISTAN-LW/2026/0${idx+1}`}
                      </div>
                      <div className="text-[10px] text-slate-400">NIB: {item.nib || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{item.investor_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{item.district || 'Kec. Bua Ponrang'}</div>
                      <div className="text-[10px] text-slate-400">{item.land_area_ha || 1.5} Ha (LP2B Intersect)</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{settings.kepalaDinas.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">NIP. {settings.kepalaDinas.nip}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '2026-09-20'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(item);
                            setShowDocModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Lihat BAP</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(item);
                            setShowDocModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Printer size={13} />
                          <span>Cetak BAP</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official BAP LP2B Dinas Pertanian Complete Document Viewer Modal */}
      {showDocModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-300 dark:border-slate-800 w-full max-w-5xl max-h-[96vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4">
            
            {/* Top Bar Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Dokumen Resmi Berita Acara Rekomendasi Alih Fungsi Lahan (BAP-LP2B)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Nomor: {selectedDoc.berita_acara_doc_num || '520/BA-LP2B/DISTAN-LW/2026'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Multi-Sheet BAP LP2B Document Rendered with Map, Coordinates & TTE Signatures */}
            <div className="w-full">
              <BapLp2bPertanianDocument
                initialData={convertAppToBapLp2bData(selectedDoc, settings)}
                onClose={() => setShowDocModal(false)}
                showEditorToolbar={true}
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PertanianArchiveView;
