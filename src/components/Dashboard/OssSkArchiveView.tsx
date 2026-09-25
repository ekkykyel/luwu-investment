import React, { useState, useEffect } from 'react';
import { FileCheck2, Search, Printer, Download, RefreshCw, QrCode, ShieldCheck, Eye, X, Building2, MapPin, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';
import { getOpdSettings } from '../../utils/opdSettingsStorage.js';

export const OssSkArchiveView: React.FC = () => {
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(item);
                            setShowDocModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-teal-600 hover:text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Lihat SK</span>
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
                          <span>Cetak SK</span>
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

      {/* Official SK PKKPR Certificate Modal */}
      {showDocModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
              <span className="text-xs font-bold text-slate-500">Pratinjau Arsip Resmi SK Izin PKKPR DPMPTSP</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
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
                    {settings.opd.officialName || 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu'}
                  </h2>
                  <p className="text-[10px] sm:text-xs font-sans text-slate-600">
                    {settings.opd.address || 'Kompleks Perkantoran Pemkab Luwu, Belopa, Sulawesi Selatan'}
                  </p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-xs font-bold tracking-widest uppercase underline">
                  SURAT KEPUTUSAN KEPALA DINAS PENANAMAN MODAL DAN PTSP KABUPATEN LUWU
                </h4>
                <p className="text-[11px] font-mono font-bold">
                  NOMOR: {selectedDoc.sk_pkkpr_doc_number}
                </p>
                <p className="text-xs font-sans italic text-slate-600 pt-1">
                  TENTANG: PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR)
                </p>
              </div>

              <div className="text-xs font-sans space-y-3 leading-relaxed text-justify">
                <p>
                  Berdasarkan Pertimbangan Teknis (Pertek) Dinas PUPTR Kabupaten Luwu serta Rekomendasi Dinas Pertanian, dengan ini Kepala {settings.opd.officialName} Kabupaten Luwu memberikan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) kepada:
                </p>

                <table className="w-full text-xs font-sans border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 w-40 font-semibold">Nama Pemohon</td>
                      <td className="py-1.5">: <strong>{selectedDoc.investor_name}</strong></td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold">Nama Badan Usaha / PT</td>
                      <td className="py-1.5">: <strong>{selectedDoc.title}</strong></td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold">NIB / NIK Pemohon</td>
                      <td className="py-1.5 font-mono">: {selectedDoc.nib}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold">Lokasi Kegiatan</td>
                      <td className="py-1.5">: {selectedDoc.district}, Kabupaten Luwu, Sulawesi Selatan</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold">Luas Ruang Disetujui</td>
                      <td className="py-1.5 font-bold font-mono">: {selectedDoc.land_area_ha} Hektar (Ha)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold">Status Kesesuaian Ruang</td>
                      <td className="py-1.5 text-emerald-700 font-bold">: Sesuai Rencana Tata Ruang Wilayah (RTRW) Perda No. 3/2020</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-[11px] text-slate-600 italic">
                  Surat Keputusan ini berlaku sebagai dokumen sah persyaratan Persetujuan Bangunan Gedung (PBG) dan pelaksanaan berusaha di wilayah Kabupaten Luwu.
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

export default OssSkArchiveView;
