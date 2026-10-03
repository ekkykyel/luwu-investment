import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Landmark,
  ShieldCheck,
  Upload,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  RefreshCw,
  Sparkles,
  Map,
  X,
  Building,
  Check,
  Send,
  Loader2,
  FileDown,
  Eye,
  AlertCircle,
  XCircle,
  Printer,
  ChevronRight,
  Clock,
  Compass,
  FileCheck2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';
import { getKategoriPengajuan } from '../../utils/pkkprWorkflowService';
import { BapAtrBpnDocument, BapAtrBpnDocumentData } from '../documents/BapAtrBpnDocument';

export interface BpnQueueItem {
  id: string;
  applicantType: string;
  nibNik: string;
  applicantName: string;
  companyName: string;
  sector: string;
  jenisPengajuanPkkpr?: string;
  kategoriPengajuan?: 'BANGUNAN' | 'PARSIL_TANAH';
  jenisAlasHak?: string;
  nomorAlasHak?: string;
  fileAlasHakUrl?: string;
  fileSiteplanUrl?: string;
  districtName: string;
  villageName: string;
  areaHa: number;
  luasM2: number;
  statusPertekBpn: 'PENDING' | 'APPROVED' | 'REJECTED';
  noPertekBpn?: string;
  filePertekBpnUrl?: string;
  catatanPertekBpn?: string;
  statusPkkpr?: string;
  createdAt: string;
  updatedAt: string;
  geometry?: any;
}

export default function AtrBpnLandClearanceDashboard() {
  const [items, setItems] = useState<BpnQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedItem, setSelectedItem] = useState<BpnQueueItem | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Form State
  const [nomorPertekBpn, setNomorPertekBpn] = useState('');
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [statusPenguasaan, setStatusPenguasaan] = useState('Dikuasai Langsung Pemohon Sesuai Alas Hak');
  const [statusPemilikan, setStatusPemilikan] = useState('Sah Menurut Hukum Pertanahan (Clear & Clean)');
  const [statusPenggunaanExisting, setStatusPenggunaanExisting] = useState('Lahan Kosong / Semak Belukar / Perkebunan');
  const [statusRencanaPemanfaatan, setStatusRencanaPemanfaatan] = useState('Sesuai Peruntukan Ruang & Bebas Sengketa');
  const [catatanPertek, setCatatanPertek] = useState('Hasil evaluasi P4T menunjukkan persil tanah bebas sengketa dan direkomendasikan diterbitkan Pertek Pertanahan BPN.');
  const [filePertekPdfUrl, setFilePertekPdfUrl] = useState('');

  // Fetch queue from Supabase (gis_pkkpr)
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gis_pkkpr')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: BpnQueueItem[] = data.map((item: any) => {
          const isBerusaha = item.jenis_permohonan === 'Berusaha' || Boolean(item.nib_oss);
          const luasM2 = item.luas_m2 ? Number(item.luas_m2) : (item.luas_ha ? Number(item.luas_ha) * 10000 : 5000);
          const areaHa = item.luas_ha ? Number(item.luas_ha) : Number((luasM2 / 10000).toFixed(4));
          const jPengajuan = item.jenis_pengajuan_pkkpr || item.sektor || (isBerusaha ? 'Kawasan Industri / Gudang / Pabrik' : 'Rumah Tinggal / Hunian Perorangan');
          const kPengajuan = item.kategori_pengajuan || getKategoriPengajuan(jPengajuan);

          let bpnStat: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
          if (item.status_pertek_bpn === 'APPROVED' || item.no_pertek_bpn) {
            bpnStat = 'APPROVED';
          } else if (item.status_pertek_bpn === 'REJECTED') {
            bpnStat = 'REJECTED';
          }

          return {
            id: item.id,
            applicantType: isBerusaha ? 'Pelaku Usaha (NIB)' : 'Perseorangan (NIK)',
            nibNik: item.nib_oss || item.nik_pemohon || item.nomor_permohonan || '-',
            applicantName: item.nama_pemohon || 'Pemohon Terdaftar',
            companyName: item.nama_badan_usaha || item.nama_permohonan || (isBerusaha ? 'Pelaku Usaha' : 'Perseorangan'),
            sector: item.sektor || (isBerusaha ? 'Usaha Komersial' : 'Non-Komersial'),
            jenisPengajuanPkkpr: jPengajuan,
            kategoriPengajuan: kPengajuan,
            jenisAlasHak: item.jenis_alas_hak || item.land_status || item.bukti_tanah || 'Sertipikat Hak Milik (SHM)',
            nomorAlasHak: item.nomor_alas_hak || item.no_sertifikat || `SHM-${item.id.slice(0, 5)}`,
            fileAlasHakUrl: item.file_alas_hak_url || item.sertifikat_tanah_url || undefined,
            fileSiteplanUrl: item.file_siteplan_url || undefined,
            districtName: item.kecamatan || 'Kecamatan Luwu',
            villageName: item.desa_kelurahan || 'Desa/Kelurahan',
            areaHa,
            luasM2,
            statusPertekBpn: bpnStat,
            noPertekBpn: item.no_pertek_bpn || undefined,
            filePertekBpnUrl: item.file_pertek_bpn_url || undefined,
            catatanPertekBpn: item.catatan_pertek_bpn || undefined,
            statusPkkpr: item.status_pkkpr || 'In Review',
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
            geometry: item.geometry_json || item.geom
          };
        });
        setItems(mapped);
      }
    } catch (err) {
      console.warn('Error fetching ATR/BPN queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Filtered queue
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch =
        item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nibNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.districtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.noPertekBpn && item.noPertekBpn.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || item.statusPertekBpn === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter(i => i.statusPertekBpn === 'PENDING').length,
      approved: items.filter(i => i.statusPertekBpn === 'APPROVED').length,
      rejected: items.filter(i => i.statusPertekBpn === 'REJECTED').length
    };
  }, [items]);

  // Open Process Modal
  const handleOpenProcessModal = (item: BpnQueueItem) => {
    setSelectedItem(item);
    const yr = new Date().getFullYear();
    const generatedNo = item.noPertekBpn || `500.1/BAP-PERTEK-BPN/KANTAH-LW/${yr}/${item.id.slice(0, 4).toUpperCase()}`;
    setNomorPertekBpn(generatedNo);
    setDecision(item.statusPertekBpn === 'REJECTED' ? 'REJECTED' : 'APPROVED');
    setCatatanPertek(item.catatanPertekBpn || 'Hasil evaluasi P4T menunjukkan persil tanah bebas sengketa dan direkomendasikan diterbitkan Pertek Pertanahan BPN.');
    setFilePertekPdfUrl(item.filePertekBpnUrl || '');
    setIsProcessModalOpen(true);
  };

  // Submit Approval
  const handleSubmitVerification = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const timestamp = new Date().toISOString();

      const { error } = await supabase
        .from('gis_pkkpr')
        .update({
          status_pertek_bpn: decision,
          no_pertek_bpn: nomorPertekBpn,
          file_pertek_bpn_url: filePertekPdfUrl || undefined,
          catatan_pertek_bpn: catatanPertek,
          updated_at: timestamp
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      // Update local state
      setItems(prev =>
        prev.map(i => {
          if (i.id === selectedItem.id) {
            return {
              ...i,
              statusPertekBpn: decision,
              noPertekBpn: nomorPertekBpn,
              filePertekBpnUrl: filePertekPdfUrl || undefined,
              catatanPertekBpn: catatanPertek,
              updatedAt: timestamp
            };
          }
          return i;
        })
      );

      setIsProcessModalOpen(false);

      Swal.fire({
        icon: 'success',
        title: decision === 'APPROVED' ? 'Pertek BPN Disahkan! 🏛️' : 'Pertek BPN Ditolak',
        html: `
          <div class="text-left text-xs space-y-2 p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-300 dark:border-blue-800 font-sans">
            <p><strong>Nomor Pertek BPN:</strong> <code class="font-mono text-blue-600 font-bold">${nomorPertekBpn}</code></p>
            <p><strong>Pemohon:</strong> ${selectedItem.applicantName} (${selectedItem.companyName})</p>
            <p><strong>Status P4T:</strong> <span class="font-bold ${decision === 'APPROVED' ? 'text-emerald-600' : 'text-rose-600'}">${decision}</span></p>
          </div>
        `,
        confirmButtonColor: '#2563eb'
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memproses',
        text: err?.message || 'Terjadi kesalahan saat menyimpan BAP Pertek BPN.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build Document Data object for BAP PDF
  const bpnDocData: BapAtrBpnDocumentData | null = useMemo(() => {
    if (!selectedItem) return null;
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const dayDateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return {
      id: selectedItem.id,
      nomorPertekBpn: nomorPertekBpn || selectedItem.noPertekBpn || `500.1/BAP-PERTEK-BPN/KANTAH-LW/2026/${selectedItem.id.slice(0, 4)}`,
      tanggalDokumen: dateStr,
      hariTanggalPemeriksaan: dayDateStr,
      nibNik: selectedItem.nibNik,
      namaPemohon: selectedItem.applicantName,
      namaPerusahaan: selectedItem.companyName,
      alamatPemohon: `Kec. ${selectedItem.districtName}, Kab. Luwu`,
      jenisPengajuanPkkpr: selectedItem.jenisPengajuanPkkpr || selectedItem.sector,
      kategoriPengajuan: selectedItem.kategoriPengajuan,
      jenisAlasHak: selectedItem.jenisAlasHak || 'Sertipikat Hak Milik (SHM)',
      nomorAlasHak: selectedItem.nomorAlasHak || '-',
      fileAlasHakUrl: selectedItem.fileAlasHakUrl,
      fileSiteplanUrl: selectedItem.fileSiteplanUrl,
      lokasiKegiatan: `Desa/Kel. ${selectedItem.villageName}, Kec. ${selectedItem.districtName}`,
      desaKelurahan: selectedItem.villageName,
      kecamatan: selectedItem.districtName,
      kabupaten: 'Kabupaten Luwu',
      luasMohonM2: selectedItem.luasM2,
      luasMohonHa: selectedItem.areaHa,
      luasDisetujuiM2: selectedItem.luasM2,
      luasDisetujuiHa: selectedItem.areaHa,
      statusPenguasaan: statusPenguasaan,
      statusPemilikan: statusPemilikan,
      statusPenggunaanExisting: statusPenggunaanExisting,
      statusRencanaPemanfaatan: statusRencanaPemanfaatan,
      statusClearAndClean: true,
      sengketaStatus: 'Clear & Clean (Bebas dari Sengketa Pertanahan)',
      statusKeputusan: decision,
      catatanPertekBpn: [catatanPertek],
      kasiNama: 'Drs. H. M. YUSUF, M.H.',
      kasiNip: '19760512 200112 1 003',
      kasiJabatan: 'Kepala Seksi Penataan & Pemberdayaan Pertanahan',
      kakantahNama: 'HERMANTO, S.SiT., M.Si.',
      kakantahNip: '19720814 199403 1 002',
      kakantahJabatan: 'Kepala Kantor Pertanahan Kabupaten Luwu',
      pangkatKakantah: 'Pembina Tingkat I (IV/b)'
    };
  }, [selectedItem, nomorPertekBpn, decision, statusPenguasaan, statusPemilikan, statusPenggunaanExisting, statusRencanaPemanfaatan, catatanPertek]);

  return (
    <div className="space-y-6">
      {/* Header Banner BPN */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-blue-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Landmark className="w-64 h-64 text-blue-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold font-mono">
              <Landmark className="w-3.5 h-3.5" />
              <span>Kantor Pertanahan (Kantah) ATR/BPN Kabupaten Luwu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
              Pertimbangan Teknis Pertanahan (Pertek P4T)
            </h2>
            <p className="text-xs text-blue-200/80 max-w-2xl">
              Verifikasi aspek Penguasaan, Pemilikan, Penggunaan, dan Pemanfaatan Tanah (P4T) serta penerbitan Berita Acara Pertek BPN untuk kelengkapan SK Izin PKKPR OSS.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchQueue}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer self-start md:self-auto shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang Data</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-blue-500/20 font-sans">
          <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/20">
            <span className="text-[10px] text-blue-300 font-bold block">Total Antrean Masuk</span>
            <span className="text-xl font-black font-mono text-white">{stats.total}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/20">
            <span className="text-[10px] text-amber-300 font-bold block">Pertek Pending P4T</span>
            <span className="text-xl font-black font-mono text-amber-400">{stats.pending}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-300 font-bold block">Pertek BPN Approved</span>
            <span className="text-xl font-black font-mono text-emerald-400">{stats.approved}</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/20">
            <span className="text-[10px] text-rose-300 font-bold block">Pertek BPN Ditolak</span>
            <span className="text-xl font-black font-mono text-rose-400">{stats.rejected}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">Status Pertek:</span>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'Semua Status' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pemohon, NIB, pertek..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            <span>Daftar Permohonan Verifikasi Pertanahan (ATR/BPN)</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Menampilkan {filteredItems.length} berkas</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span>Memuat data antrean pertanahan Kantah Luwu...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-1">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-60" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada permohonan dalam kategori ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-mono text-[10px]">
                  <th className="py-3 px-3">Pemohon / Perusahaan</th>
                  <th className="py-3 px-3">Kategori &amp; Peruntukan</th>
                  <th className="py-3 px-3">Status Alas Hak Lahan</th>
                  <th className="py-3 px-3">Lokasi &amp; Luas</th>
                  <th className="py-3 px-3">Status Pertek BPN</th>
                  <th className="py-3 px-3 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{item.companyName}</div>
                      <div className="text-[11px] text-slate-500">{item.applicantName} • <code className="font-mono">{item.nibNik}</code></div>
                    </td>
                    <td className="py-3.5 px-3">
                      {item.kategoriPengajuan === 'PARSIL_TANAH' ? (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-[10px] inline-block mb-0.5">
                          🗺️ PARSIL TANAH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px] inline-block mb-0.5">
                          🏗️ KONSTRUKSI
                        </span>
                      )}
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{item.jenisPengajuanPkkpr}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.jenisAlasHak}</div>
                      <div className="text-[10px] text-slate-500 font-mono">No. {item.nomorAlasHak}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">Kec. {item.districtName}</div>
                      <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{item.areaHa} Ha ({item.luasM2.toLocaleString('id-ID')} m²)</div>
                    </td>
                    <td className="py-3.5 px-3">
                      {item.statusPertekBpn === 'APPROVED' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Approved BPN</span>
                        </span>
                      ) : item.statusPertekBpn === 'REJECTED' ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold text-[10px] inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          <span>Ditolak BPN</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                          <span>Pending P4T</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenProcessModal(item)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 ml-auto transition shadow-sm cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verifikasi BPN</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROCESS / VERIFICATION MODAL */}
      <AnimatePresence>
        {isProcessModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto p-6 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Verifikasi Pertimbangan Teknis Pertanahan (P4T ATR/BPN)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pelaku Usaha: <strong>{selectedItem.companyName}</strong> ({selectedItem.applicantName})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProcessModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Panel Legalitas Lahan & Peruntukan */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-500" /> Profil Legalitas Lahan Pemohon
                  </h4>
                  {selectedItem.kategoriPengajuan === 'PARSIL_TANAH' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      MAP PARSIL TANAH (ATR/BPN)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      MAP BANGUNAN FISIK
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Jenis Pengajuan PKKPR:</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{selectedItem.jenisPengajuanPkkpr}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block">Jenis &amp; Nomor Alas Hak:</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{selectedItem.jenisAlasHak} (No. {selectedItem.nomorAlasHak})</span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block">Luas Parsil Lahan:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block mt-0.5">{selectedItem.areaHa} Ha ({selectedItem.luasM2.toLocaleString('id-ID')} m²)</span>
                  </div>
                </div>

                {/* Tautan Berkas Terunggah */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                  {selectedItem.fileAlasHakUrl ? (
                    <a
                      href={selectedItem.fileAlasHakUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> 📄 Buka Berkas Sertifikat / Alas Hak
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Sertifikat/Alas Hak fisik telah diverifikasi petugas.</span>
                  )}

                  {selectedItem.kategoriPengajuan !== 'PARSIL_TANAH' && selectedItem.fileSiteplanUrl && (
                    <a
                      href={selectedItem.fileSiteplanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 rounded-xl text-xs font-bold hover:bg-teal-100 flex items-center gap-1.5 transition"
                    >
                      <Building className="w-3.5 h-3.5" /> 📐 Lihat Berkas Siteplan Bangunan
                    </a>
                  )}
                </div>
              </div>

              {/* Form Evaluasi P4T ATR/BPN */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Formulir Evaluasi P4T (Penguasaan, Pemilikan, Penggunaan &amp; Pemanfaatan Tanah)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nomor BAP Pertek Pertanahan BPN</label>
                    <input
                      type="text"
                      value={nomorPertekBpn}
                      onChange={e => setNomorPertekBpn(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Keputusan Pertek Pertanahan</label>
                    <select
                      value={decision}
                      onChange={e => setDecision(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="APPROVED">DISETUJUI (APPROVED P4T CLEAR)</option>
                      <option value="REJECTED">DITOLAK (REJECTED / SENGKETA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Status Penguasaan Tanah</label>
                    <input
                      type="text"
                      value={statusPenguasaan}
                      onChange={e => setStatusPenguasaan(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Status Pemilikan Hak</label>
                    <input
                      type="text"
                      value={statusPemilikan}
                      onChange={e => setStatusPemilikan(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Catatan / Rekomendasi Pertanahan BPN</label>
                  <textarea
                    rows={3}
                    value={catatanPertek}
                    onChange={e => setCatatanPertek(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsPdfPreviewOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" /> Preview Draft BAP Pertek BPN
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProcessModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-300 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitVerification}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>Sahkan BAP Pertek BPN</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF PREVIEW MODAL */}
      <AnimatePresence>
        {isPdfPreviewOpen && bpnDocData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl max-h-[90vh] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-y-auto p-4 space-y-4"
            >
              <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
                <span className="text-xs font-bold font-mono">Draf Pratinjau Naskah BAP Pertek BPN</span>
                <button
                  type="button"
                  onClick={() => setIsPdfPreviewOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <BapAtrBpnDocument data={bpnDocData} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
