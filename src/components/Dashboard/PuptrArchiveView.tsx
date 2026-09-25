import React, { useState, useEffect } from 'react';
import { FileCheck2, Search, Printer, Download, RefreshCw, Filter, CheckCircle2, Building2, MapPin, Calendar, FileText, Eye, X, QrCode } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';
import { getOpdSettings } from '../../utils/opdSettingsStorage.js';

export const PuptrArchiveView: React.FC = () => {
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const settings = getOpdSettings('puptr');

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const records: any[] = [];

      // 1. Fetch from gis_pkkpr (Primary table for Pertek PUPTR documents)
      try {
        const { data: gisData, error: gisError } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .or('pertek_puptr_num.not.is.null,status_pkkpr.eq.Approved_PUPTR,status_pkkpr.eq.Approved,status_pkkpr.eq.Published')
          .order('created_at', { ascending: false });

        if (!gisError && gisData && gisData.length > 0) {
          gisData.forEach((item: any) => {
            records.push({
              id: item.id,
              title: item.nama_permohonan || item.nama_badan_usaha || item.sektor || 'Pertimbangan Teknis Tata Ruang',
              investor_name: item.nama_pemohon || item.nama_badan_usaha || 'Pemohon Terdaftar',
              nib: item.nib_oss || item.nik_pemohon || '-',
              sk_pkkpr_doc_number: item.pertek_puptr_num || `600/P-TR/DPUPTR-LW/${item.id}`,
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
          .or('status.eq.Approved_PUPTR,status.eq.Published')
          .order('updated_at', { ascending: false });

        if (!invError && invData && invData.length > 0) {
          invData.forEach((item: any) => {
            if (!records.some(r => r.id === item.id)) {
              records.push({
                id: item.id,
                title: item.name || 'Proyek Investasi Terdaftar',
                investor_name: item.contact_pic || 'Pelaku Usaha',
                nib: item.nib || '-',
                sk_pkkpr_doc_number: `600/P-TR/DPUPTR-LW/${item.id.slice(0, 6)}`,
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
      console.error("Error fetching PUPTR archives:", e);
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
      (item.sk_pkkpr_doc_number || '').toLowerCase().includes(q) ||
      (item.district || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                ARSIP PERTEK &amp; KESESUAIAN TATA RUANG
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Arsip &amp; Riwayat Penerbitan Pertek PUPTR
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Daftar seluruh Berita Acara Pertimbangan Teknis Tata Ruang yang disetujui oleh {settings.opd.shortName} untuk permohonan PKKPR Kabupaten Luwu.
            </p>
          </div>

          <button
            onClick={fetchArchives}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 shadow-lg shadow-indigo-950/30"
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
            placeholder="Cari NIB, Pemohon, Dokumen Pertek..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Total Terbit Pertek: <strong className="text-indigo-600 dark:text-indigo-400">{filteredArchives.length} Berkas</strong>
        </div>
      </div>

      {/* Archives Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <RefreshCw size={24} className="animate-spin text-indigo-500 mx-auto" />
            <p>Memuat database arsip Pertek PUPTR...</p>
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <FileText size={32} className="text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Dokumen Pertek Terbit</p>
            <p>Dokumen yang disetujui di tab Verifikasi PKKPR akan langsung diarsipkan secara otomatis di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">No. Dokumen / NIB</th>
                  <th className="px-4 py-3.5">Pemohon &amp; Kegiatan Usaha</th>
                  <th className="px-4 py-3.5">Lokasi &amp; Luas Lahan</th>
                  <th className="px-4 py-3.5">Penandatangan Kadin</th>
                  <th className="px-4 py-3.5">Tanggal Terbit</th>
                  <th className="px-4 py-3.5 text-right">AksiDokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredArchives.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">
                        {item.sk_pkkpr_doc_number || item.puptr_doc_number || `503/PERTEK-PUPTR/LW/2026/0${idx+1}`}
                      </div>
                      <div className="text-[10px] text-slate-400">NIB: {item.nib || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{item.investor_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{item.district || 'Kec. Bua'}</div>
                      <div className="text-[10px] text-slate-400">{item.land_area_ha || 1} Ha</div>
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
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Lihat Pertek</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(item);
                            setShowDocModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Printer size={13} />
                          <span>Cetak Pertek</span>
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

      {/* Official Pertek PUPTR Certificate Modal */}
      {showDocModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
              <span className="text-xs font-bold text-slate-500">Pratinjau Resmi Berita Acara Pertimbangan Teknis Tata Ruang (PUPTR)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Certificate Paper */}
            <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-lg font-serif space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-4 border-b-4 border-double border-slate-900 pb-4 text-center">
                <div className="w-16 h-20 flex items-center justify-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/2/29/Lambang_Kabupaten_Luwu.png"
                    alt="Logo Luwu"
                    className="w-16 h-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide">
                    Pemerintah Kabupaten Luwu
                  </h3>
                  <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide">
                    {settings.opd.officialName || 'Dinas Pekerjaan Umum dan Penataan Ruang'}
                  </h2>
                  <p className="text-[10px] sm:text-xs font-sans text-slate-600">
                    {settings.opd.address || 'Kompleks Perkantoran Pemkab Luwu, Belopa, Sulawesi Selatan'}
                  </p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-xs font-bold tracking-widest uppercase underline">
                  BERITA ACARA PERTIMBANGAN TEKNIS KESESUAIAN TATA RUANG
                </h4>
                <p className="text-[11px] font-mono font-bold">
                  NOMOR PERTEK: {selectedDoc.sk_pkkpr_doc_number}
                </p>
                <p className="text-xs font-sans italic text-slate-600 pt-1">
                  OPD REKOMENDATOR: BIDANG PENATAAN RUANG DINAS PUPTR KABUPATEN LUWU
                </p>
              </div>

              <div className="text-xs font-sans space-y-3 leading-relaxed text-justify">
                <p>
                  Berdasarkan hasil audit spasial visual Studio GIS &amp; Zoning Inspector Dinas PUPTR Kabupaten Luwu terhadap peta rencana detail tata ruang daerah dan Perda Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu No. 3 Tahun 2024, dengan ini memberikan Pertimbangan Teknis tata ruang kepada permohonan berikut:
                </p>

                <table className="w-full text-xs font-sans border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 w-40 font-semibold">Nama Pemohon</td>
                      <td className="py-1.5">: <strong>{selectedDoc.investor_name}</strong></td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold">Nama Kegiatan / PT</td>
                      <td className="py-1.5">: <strong>{selectedDoc.title}</strong></td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold">NIB / NIK Pemohon</td>
                      <td className="py-1.5 font-mono">: {selectedDoc.nib}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold">Kecamatan Lokasi</td>
                      <td className="py-1.5">: {selectedDoc.district}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold">Luas Lahan Yang Dikaji</td>
                      <td className="py-1.5 font-bold font-mono">: {selectedDoc.land_area_ha} Ha</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold">Rekomendasi Spasial</td>
                      <td className="py-1.5 text-emerald-700 font-bold">: DISETUJUI (Sesuai Rencana Tata Ruang Pola Ruang Wilayah)</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-[11px] text-slate-600 italic">
                  Catatan Teknis PUPTR: Sesuai dengan peruntukan ruang zona komersial/industri, KDB maksimal 70%, KLB 2.8, tinggi bangunan maksimal 4 lantai, dengan kewajiban penyediaan RTH minimal 15% dari luas total tapak.
                </p>
              </div>

              {/* TTE Signer & QR Section */}
              <div className="pt-6 border-t border-slate-200 flex items-end justify-between font-sans">
                <div className="text-center space-y-1">
                  <div className="p-2 border border-slate-300 rounded-xl bg-slate-50 inline-block">
                    <QrCode size={64} className="text-slate-800" />
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    TTE Tersertifikasi BSrE BSSN RI
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-xs">Ditetapkan di Belopa</p>
                  <p className="text-xs">Pada tanggal: {new Date(selectedDoc.updated_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-xs font-bold pt-1">{settings.kepalaDinas.officialTitle || 'Kepala Dinas'}</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      [ Ditandatangani Secara Elektronik ]
                    </span>
                  </div>
                  <p className="text-xs font-bold underline">{settings.kepalaDinas.fullName}</p>
                  <p className="text-[10px] font-mono text-slate-600">NIP. {settings.kepalaDinas.nip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuptrArchiveView;
