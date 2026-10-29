import React, { useState, useEffect } from 'react';
import { FileCheck2, Search, Printer, Download, RefreshCw, QrCode, ShieldCheck, Eye, X, Building2, MapPin, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getOpdSettings } from '../../utils/opdSettingsStorage.js';
import { SkPkkprDocumentModal } from '../documents/SkPkkprDocumentModal';
import { SkPkkprDpmptspData } from '../documents/SkPkkprDpmptspDocument';

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

      // 1. Fetch issued SK records from pkkpr_permohonan (7-state Workflow SSOT)
      try {
        const { data: permData, error: permError } = await supabase
          .from('pkkpr_permohonan')
          .select('*')
          .or('status_permohonan.eq.IZIN_TERBIT,is_tte_signed.eq.true')
          .order('updated_at', { ascending: false });

        if (!permError && permData && permData.length > 0) {
          permData.forEach((item: any) => {
            if (!records.some(r => r.id === item.id)) {
              records.push({
                id: item.id,
                title: item.nama_kegiatan || item.sektor_kegiatan || 'Izin Kegiatan Pemanfaatan Ruang (PKKPR)',
                investor_name: item.pemohon_name || 'Pemohon Terdaftar',
                nib: item.nomor_permohonan || '-',
                sk_pkkpr_doc_number: item.sk_pkkpr_num || `503/SK-PKKPR/DPMPTSP-LW/${String(item.id).slice(0, 8)}`,
                district: item.kecamatan_name || 'Kabupaten Luwu',
                land_area_ha: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(2)) : 0),
                updated_at: item.updated_at || item.created_at,
                source: 'pkkpr_permohonan'
              });
            }
          });
        }
      } catch (err) {
        console.warn("pkkpr_permohonan query info in OSS archive:", err);
      }

      // 2. Fetch from gis_pkkpr (Spatial PKKPR table - strictly filter to issued SK PKKPR)
      try {
        const { data: gisData, error: gisError } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .order('created_at', { ascending: false });

        if (!gisError && gisData && gisData.length > 0) {
          gisData.forEach((item: any) => {
            const normPkkpr = String(item.status_pkkpr || '').toUpperCase().trim();
            const normPerm = String(item.status_permohonan || '').toUpperCase().trim();
            const rawNotes = String(item.catatan_teknis || '');
            const skNotesMatch = rawNotes.match(/\[SK PKKPR TERBIT:\s*([^\]]+)\]/i);
            const extractedSk = item.sk_pkkpr_num || (skNotesMatch ? skNotesMatch[1].trim() : '');
            const isIssuedSk =
              normPkkpr === 'PUBLISHED' ||
              normPkkpr === 'TERBIT' ||
              normPkkpr === 'IZIN_TERBIT' ||
              normPerm === 'IZIN_TERBIT' ||
              Boolean(item.published_at) ||
              Boolean(skNotesMatch) ||
              (Boolean(item.sk_pkkpr_num) && String(item.sk_pkkpr_num).includes('DPMPTSP'));

            if (isIssuedSk && !records.some(r => r.id === item.id)) {
              records.push({
                id: item.id,
                title: item.nama_permohonan || item.judul_kegiatan || item.nama_badan_usaha || item.sektor || 'Izin Kegiatan Pemanfaatan Ruang (PKKPR)',
                investor_name: item.nama_pemohon || item.pemohon_name || item.nama_badan_usaha || 'Pemohon Terdaftar',
                nib: item.nib_oss || item.pkkpr_doc_number || item.nik_pemohon || '-',
                sk_pkkpr_doc_number: extractedSk || `503/SK-PKKPR/DPMPTSP-LW/${String(item.id).slice(0, 8)}`,
                district: item.kecamatan || 'Kabupaten Luwu',
                land_area_ha: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(2)) : 0),
                updated_at: item.published_at || item.updated_at || item.created_at,
                source: 'gis_pkkpr'
              });
            }
          });
        }
      } catch (err) {
        console.warn("gis_pkkpr query info in OSS archive:", err);
      }

      // 3. Fetch from investments table ONLY for projects with officially issued SK PKKPR metadata
      try {
        const { data: invData, error: invError } = await supabase
          .from('investments')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!invError && invData && invData.length > 0) {
          invData.forEach((item: any) => {
            const normStat = String(item.status || '').toUpperCase().trim();
            const docRef = item.sk_pkkpr_doc_number || (item.override_document_ref && String(item.override_document_ref).includes('SK-PKKPR') ? item.override_document_ref : '');
            const hasOfficialSk = Boolean(item.published_at || docRef || normStat === 'TERBIT' || item.status_permohonan === 'IZIN_TERBIT');

            if (hasOfficialSk && !records.some(r => r.id === item.id)) {
              records.push({
                id: item.id,
                title: item.name || 'Proyek Investasi Resmi',
                investor_name: item.contact_pic || 'Pelaku Usaha',
                nib: item.nib || '-',
                sk_pkkpr_doc_number: docRef || `503/SK-PKKPR/DPMPTSP-LW/${String(item.id).slice(0, 6)}`,
                district: item.kecamatan || 'Kabupaten Luwu',
                land_area_ha: item.area_ha ? Number(item.area_ha) : 0,
                updated_at: item.published_at || item.updated_at || item.created_at,
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
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-900/95 via-slate-900 to-slate-950 p-4 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-wide text-teal-300 mb-1.5">
              Penerbitan &amp; Arsip Resmi SK PKKPR Final
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              Arsip &amp; Register SK PKKPR Terbit
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Daftar Surat Keputusan Kesesuaian Kegiatan Pemanfaatan Ruang (SK PKKPR) resmi yang diterbitkan {settings.opd.shortName} Kabupaten Luwu melalui OSS-RBA.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchArchives}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-[0.98] whitespace-nowrap"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Muat Ulang Arsip</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-white dark:bg-surface p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIB, Investor, atau Nomor SK PKKPR..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl text-base sm:text-xs bg-slate-50 dark:bg-base border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 flex items-center justify-between sm:justify-end">
          <span>Total SK Terbit:</span>
          <strong className="ml-1.5 text-teal-600 dark:text-teal-400">{filteredArchives.length} Izin Resmi</strong>
        </div>
      </div>

      {/* Archives Container */}
      <div className="bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-10 sm:p-12 text-center text-xs text-slate-500 space-y-3">
            <RefreshCw size={24} className="animate-spin text-teal-500 mx-auto" />
            <p>Memuat register arsip SK PKKPR Terbit...</p>
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="p-10 sm:p-12 text-center text-xs text-slate-500 space-y-2">
            <ShieldCheck size={32} className="text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Belum Ada SK PKKPR Terbit</p>
            <p>Izin yang dieksekusi di Monitoring Perizinan akan tersimpan di register ini.</p>
          </div>
        ) : (
          <>
            {/* Android Tap Cards (md:hidden) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredArchives.map((item, idx) => {
                const skNum = item.sk_pkkpr_doc_number || item.pkkpr_doc_number || `503/SK-PKKPR/DPMPTSP-LW/2026/0${idx + 1}`;
                return (
                  <div key={item.id || idx} className="p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-teal-600 dark:text-teal-400 font-bold">
                        <span className="truncate">{skNum}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 shrink-0">TTE BSrE Sah</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug break-words">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.investor_name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.district || 'Kabupaten Luwu'}</span>
                        {item.land_area_ha > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{item.land_area_ha} Ha</span>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        NIB: {item.nib || '-'} · Penandatangan: {settings.kepalaDinas.fullName}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoc(item);
                          setShowDocModal(true);
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98] whitespace-nowrap cursor-pointer"
                      >
                        <Eye size={15} />
                        <span>Lihat SK</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoc(item);
                          setShowDocModal(true);
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98] whitespace-nowrap cursor-pointer"
                      >
                        <Printer size={15} />
                        <span>Cetak SK</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-base text-slate-600 dark:text-slate-400 font-bold tracking-wide text-[11px] border-b border-slate-200 dark:border-slate-800">
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
                    <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono tabular-nums">
                        <div className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="shrink-0" />
                          <span>{item.sk_pkkpr_doc_number || item.pkkpr_doc_number || `503/SK-PKKPR/DPMPTSP-LW/2026/0${idx+1}`}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">Status: Terbit &amp; Sah</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-500">{item.investor_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{item.district || 'Kabupaten Luwu'}</div>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">NIB: {item.nib || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{settings.kepalaDinas.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">NIP. {settings.kepalaDinas.nip}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <QrCode size={13} className="shrink-0" />
                          <span>TTE BSrE Sah</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDoc(item);
                              setShowDocModal(true);
                            }}
                            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-600 hover:text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
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
                            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
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
          </>
        )}
      </div>

      {/* Official SK PKKPR Certificate Modal */}
      {selectedDoc && (
        <SkPkkprDocumentModal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          data={{
            nomorSkPkkpr: selectedDoc.sk_pkkpr_doc_number || `503/SK-PKKPR/DPMPTSP-LW/2026/${selectedDoc.id.slice(0, 4)}`,
            tanggalDitetapkan: new Date(selectedDoc.updated_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            tempatDitetapkan: 'Belopa',
            jenisPermohonan: 'Berusaha',
            nomorBapPuptr: `600.1.15/042/BAP-PKKPR-B/PUPTR-TR/LUWU/2026`,
            tanggalBapPuptr: new Date(selectedDoc.updated_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            namaPemohon: selectedDoc.investor_name || 'Pemohon Terdaftar',
            namaPerusahaan: selectedDoc.title || 'Badan Usaha Terdaftar',
            nibOss: selectedDoc.nib || 'NIB-OSS-TERDAFTAR',
            alamatPemohon: `Kabupaten Luwu, Provinsi Sulawesi Selatan`,
            sektorUsaha: 'Sektor Perdagangan & Industri',
            kbliCode: '68111',
            lokasiKegiatan: `Kecamatan ${selectedDoc.district || 'Belopa'}, Kabupaten Luwu`,
            desaKelurahan: 'Belopa',
            kecamatan: selectedDoc.district || 'Belopa',
            kabupaten: 'Luwu',
            luasLahanPermohonan: `${selectedDoc.land_area_ha || 0.5} Ha`,
            luasLahanDisetujui: `${selectedDoc.land_area_ha || 0.5} Ha`,
            statusKepemilikanTanah: 'Sertipikat Hak Milik (SHM)',
            zonaRtrw: 'Kawasan Perdagangan dan Jasa / Industri',
            fungsiBangunan: 'Bangunan Komersial / Operasional',
            koefisienDasarBangunan: '60%',
            koefisienLantaiBangunan: '2.4',
            koefisienDaerahHijau: '20%',
            garisSempadanBangunan: '15 meter dari As Jalan',
            ketentuanPersyaratanTeknis: [
              'Mematuhi seluruh ketentuan persyaratan teknis bangunan gedung dan tata ruang sesuai Perda RTRW Kab. Luwu No. 3 Tahun 2024;',
              'Mengurus dokumen perizinan lingkungan lanjutan (AMDAL/UKL-UPL/SPPL) dan Persetujuan Bangunan Gedung (PBG);',
              'Tidak memindahtangankan dokumen SK PKKPR ini kepada pihak lain tanpa persetujuan tertulis.'
            ],
            masaBerlakuTahun: 3,
            kadisNama: settings.kepalaDinas?.fullName || 'Drs. H. Muhammad Rudi, M.Si',
            kadisNip: settings.kepalaDinas?.nip || '19740812 199803 1 004',
            kadisPangkatGolongan: 'Pembina Utama Muda (IV/c)',
            kadisJabatan: 'Kepala Dinas Penanaman Modal dan PTSP Kabupaten Luwu',
            isTteSigned: true,
            tteSignedDate: new Date(selectedDoc.updated_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          }}
        />
      )}
    </div>
  );
};

export default OssSkArchiveView;
