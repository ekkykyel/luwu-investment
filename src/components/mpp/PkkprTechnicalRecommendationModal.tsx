import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, CheckCircle2, ShieldCheck, Printer, Download, Copy, ExternalLink,
  MapPin, Send, Building2, Layers, AlertCircle, ArrowRight, X, Sparkles, Check,
  QrCode, Compass, RefreshCw, Eye, Edit3, Share2, HelpCircle
} from 'lucide-react';
import { LUWU_LOGO_BASE64 } from '../../lib/logoBase64';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  initialData?: Partial<PkkprRecommendationData>;
}

export interface PkkprRecommendationData {
  nomorBa: string;
  tanggalBa: string;
  hariTanggalLengkap: string;
  pemohon: {
    nama: string;
    npwp: string;
    alamat: string;
    dusun: string;
    desaKel: string;
    kecamatan: string;
    kabupaten: string;
    provinsi: string;
    noTelp: string;
    email: string;
  };
  kegiatan: {
    jenisUsaha: string;
    kategori: 'Non Berusaha' | 'Berusaha';
    statusPenanamanModal: string;
    luasTanahDimohon: number;
    luasBangunanRencana: number;
    alasHak: string;
  };
  tataRuang: {
    kesesuaian: 'Sesuai' | 'Sesuai Bersyarat' | 'Ditolak';
    dasarPerda: string;
    polaRuangEksisting: string;
    jenisPeruntukanDisetujui: string;
    luasTanahDisetujui: number;
    kbli: string;
    judulKbli: string;
  };
  intensitas: {
    kdbMax: string;
    klbMax: string;
    kdhMin: string;
    gsbMin: string;
    ktbMax: string;
  };
  pejabat: {
    jabatan: string;
    nama: string;
    nip: string;
  };
  koordinat: Array<{
    no: number;
    lintangDdm: string;
    bujurDdm: string;
    latDd: number;
    lngDd: number;
  }>;
}

export const DEFAULT_PKKPR_DATA: PkkprRecommendationData = {
  nomorBa: '120/BA-FPR/NB/IX/2026',
  tanggalBa: '08 September 2026',
  hariTanggalLengkap: 'Selasa tanggal Delapan bulan September tahun Dua Ribu Dua Puluh Enam',
  pemohon: {
    nama: 'ERMON AMBING',
    npwp: '-',
    alamat: 'Dusun Pongsamelung RT/RW 001/001, Kel. Pongsamelung, Kec. Lamasi',
    dusun: 'Dusun Pongsamelung',
    desaKel: 'Pongsamelung',
    kecamatan: 'Lamasi',
    kabupaten: 'Luwu',
    provinsi: 'Sulawesi Selatan',
    noTelp: '-',
    email: '-'
  },
  kegiatan: {
    jenisUsaha: 'Pembangunan Gereja',
    kategori: 'Non Berusaha',
    statusPenanamanModal: '-',
    luasTanahDimohon: 816,
    luasBangunanRencana: 256,
    alasHak: 'Sertifikat Hak Milik No. 488 dengan Luas tanah 816 m² sebidang tanah Gereja'
  },
  tataRuang: {
    kesesuaian: 'Sesuai',
    dasarPerda: 'Peraturan Daerah Kabupaten Luwu Nomor 6 Tahun 2011 Tentang Rencana Tata Ruang Wilayah (RTRW)',
    polaRuangEksisting: 'Kawasan Pertanian Lahan Basah',
    jenisPeruntukanDisetujui: 'Non Pertanian (Gereja)',
    luasTanahDisetujui: 816,
    kbli: '-',
    judulKbli: '-'
  },
  intensitas: {
    kdbMax: '60 - 80%',
    klbMax: '0,6 – 3',
    kdhMin: '10 sampai 40',
    gsbMin: '7 m',
    ktbMax: '-'
  },
  pejabat: {
    jabatan: 'Sekretaris Forum Penataan Ruang',
    nama: 'Ir. IKHSAN ASAAD., ST., MT., CCMS',
    nip: '19770912 200604 1 009'
  },
  koordinat: [
    { no: 1, lintangDdm: "2° 47.554'S", bujurDdm: "120° 10.144'E", latDd: -2.7925667, lngDd: 120.1690667 },
    { no: 2, lintangDdm: "2° 47.539'S", bujurDdm: "120° 10.138'E", latDd: -2.7923167, lngDd: 120.1689667 },
    { no: 3, lintangDdm: "2° 47.541'S", bujurDdm: "120° 10.135'E", latDd: -2.7923500, lngDd: 120.1689167 },
    { no: 4, lintangDdm: "2° 47.537'S", bujurDdm: "120° 10.134'E", latDd: -2.7922833, lngDd: 120.1689000 },
    { no: 5, lintangDdm: "2° 47.540'S", bujurDdm: "120° 10.125'E", latDd: -2.7923333, lngDd: 120.1687500 },
    { no: 6, lintangDdm: "2° 47.557'S", bujurDdm: "120° 10.130'E", latDd: -2.7926167, lngDd: 120.1688333 }
  ]
};

export function PkkprTechnicalRecommendationModal({ isOpen, onClose, isDark = false, initialData }: Props) {
  const [data, setData] = useState<PkkprRecommendationData>(() => ({
    ...DEFAULT_PKKPR_DATA,
    ...(initialData || {})
  }));

  // Update data if initialData changes
  React.useEffect(() => {
    if (initialData) {
      setData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);
  const [activeTab, setActiveTab] = useState<'dokumen' | 'alur' | 'spasial' | 'oss'>('dokumen');
  const [selectedPage, setSelectedPage] = useState<1 | 2 | 3 | 4>(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [transmissionStatus, setTransmissionStatus] = useState<'idle' | 'transmitting' | 'sent'>('sent');
  const [ossGenerated, setOssGenerated] = useState<boolean>(true);

  if (!isOpen) return null;

  const kdbActualPercent = ((data.kegiatan.luasBangunanRencana / data.kegiatan.luasTanahDimohon) * 100).toFixed(2);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generateGeoJson = () => {
    const coords = data.koordinat.map(c => [c.lngDd, c.latDd]);
    if (coords.length > 0) {
      coords.push(coords[0]); // close polygon
    }
    return JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            nomorBa: data.nomorBa,
            pemohon: data.pemohon.nama,
            kegiatan: data.kegiatan.jenisUsaha,
            luas_m2: data.kegiatan.luasTanahDimohon,
            desa: data.pemohon.desaKel,
            kecamatan: data.pemohon.kecamatan,
            kabupaten: data.pemohon.kabupaten,
            kesesuaian_rtrw: data.tataRuang.kesesuaian,
            pola_ruang: data.tataRuang.polaRuangEksisting,
            kdb_max: data.intensitas.kdbMax,
            klb_max: data.intensitas.klbMax,
            gsb_min: data.intensitas.gsbMin
          },
          geometry: {
            type: "Polygon",
            coordinates: [coords]
          }
        }
      ]
    }, null, 2);
  };

  const generateWkt = () => {
    const coords = data.koordinat.map(c => `${c.lngDd} ${c.latDd}`);
    if (coords.length > 0) {
      coords.push(coords[0]);
    }
    return `POLYGON((${coords.join(', ')}))`;
  };

  const handleSimulateTransmission = () => {
    setTransmissionStatus('transmitting');
    setTimeout(() => {
      setTransmissionStatus('sent');
      setOssGenerated(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col my-auto border max-h-[94vh] overflow-hidden ${
          isDark ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Modal Top Header Bar */}
        <div className="px-5 py-4 border-b border-inherit flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Resmi PUPTR & FPR
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                  No: {data.nomorBa}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Rekomendasi Teknis PKKPR (Forum Penataan Ruang Dinas PUPTR)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cetak Dokumen Rekomendasi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak BA</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-2 border-b border-inherit flex items-center justify-between gap-2 overflow-x-auto shrink-0 bg-slate-100/60 dark:bg-slate-900/60">
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('dokumen')}
              className={`px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
                activeTab === 'dokumen'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dokumen 4 Halaman Asli</span>
            </button>
            <button
              onClick={() => setActiveTab('alur')}
              className={`px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
                activeTab === 'alur'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Alur PUPTR → DPMPTSP (OSS)</span>
            </button>
            <button
              onClick={() => setActiveTab('spasial')}
              className={`px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
                activeTab === 'spasial'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Spasial & Ekspor GeoJSON</span>
            </button>
            <button
              onClick={() => setActiveTab('oss')}
              className={`px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
                activeTab === 'oss'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Hasil Cetak Izin PKKPR DPMPTSP</span>
            </button>
          </div>

          {activeTab === 'dokumen' && (
            <div className="hidden sm:flex items-center gap-1 pb-1">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Halaman:</span>
              {[1, 2, 3, 4].map(pg => (
                <button
                  key={pg}
                  onClick={() => setSelectedPage(pg as any)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    selectedPage === pg
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ========================================================= */}
          {/* TAB 1: DOKUMEN ASLI 4 HALAMAN (REPLIKA PRESISI) */}
          {/* ========================================================= */}
          {activeTab === 'dokumen' && (
            <div className="space-y-4">
              {/* Pagination Controls on Mobile */}
              <div className="sm:hidden flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                <span className="font-bold">Pilih Halaman Lembar Rekomendasi:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(pg => (
                    <button
                      key={pg}
                      onClick={() => setSelectedPage(pg as any)}
                      className={`w-7 h-7 rounded-lg font-bold ${
                        selectedPage === pg ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-700'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Paper Container (A4 Proportions) */}
              <div className="max-w-3xl mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-300 font-serif leading-relaxed text-xs sm:text-sm">
                
                {/* ----------------- HALAMAN 1 ----------------- */}
                {selectedPage === 1 && (
                  <div className="space-y-4">
                    {/* Kop Surat Resmi */}
                    <div className="flex items-center gap-4 pb-3 border-b-2 border-black text-center">
                      <img 
                        src={LUWU_LOGO_BASE64} 
                        alt="Lambang Kabupaten Luwu" 
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0" 
                      />
                      <div className="flex-1 font-sans">
                        <h3 className="font-bold text-base sm:text-lg uppercase tracking-wide">Pemerintah Kabupaten Luwu</h3>
                        <h4 className="font-extrabold text-sm sm:text-base uppercase tracking-wider">Dinas Pekerjaan Umum & Tata Ruang</h4>
                        <p className="text-[10px] sm:text-xs text-slate-700 italic">
                          Jl. Sungai Pareman No. 81, Kelurahan Sabe, Kec. Belopa Utara, Kab. Luwu Kode Pos: 91994
                        </p>
                      </div>
                    </div>

                    {/* Judul Berita Acara */}
                    <div className="text-center pt-2 font-sans">
                      <h4 className="font-bold text-sm sm:text-base tracking-wide uppercase">Berita Acara</h4>
                      <h5 className="font-extrabold text-xs sm:text-sm uppercase tracking-wide">
                        Penilaian Dokumen Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang Non Berusaha
                      </h5>
                      <div className="text-xs mt-1 space-y-0.5 font-medium">
                        <div className="flex justify-center gap-2">
                          <span className="w-20 text-left">Nomor</span>
                          <span>: {data.nomorBa}</span>
                        </div>
                        <div className="flex justify-center gap-2">
                          <span className="w-20 text-left">Tanggal</span>
                          <span>: {data.tanggalBa}</span>
                        </div>
                      </div>
                    </div>

                    {/* Paragraf Pembuka Hukum */}
                    <p className="text-justify indent-8 text-[11px] sm:text-xs leading-relaxed font-sans">
                      Berdasarkan Undang-Undang Nomor 6 Tahun 2023 tentang Penetapan Peraturan Pemerintah Pengganti Undang-Undang Nomor 2 Tahun 2022 tentang Cipta Kerja Menjadi Undang-Undang maka pada hari ini <b>{data.hariTanggalLengkap}</b> telah dilaksanakan penilaian dokumen usulan kegiatan Pemanfaatan Ruang terhadap RTR dalam rangka membahas permohonan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Non Berusaha, berdasarkan permohonan yang bersangkutan yang bertempat di Ruang Rapat Dinas Pekerjaan Umum dan Tata Ruang Kab. Luwu dengan hasil sebagai berikut :
                    </p>

                    {/* Data Permohonan */}
                    <div className="space-y-1 text-[11px] sm:text-xs font-sans pl-2">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">1.</span>
                        <span className="col-span-4">Nama Pemohon</span>
                        <span className="col-span-7 font-bold">: {data.pemohon.nama}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">2.</span>
                        <span className="col-span-4">NPWP</span>
                        <span className="col-span-7">: {data.pemohon.npwp}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">3.</span>
                        <span className="col-span-4">Alamat</span>
                        <span className="col-span-7">: {data.pemohon.alamat}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-700">
                        <span className="col-span-1">a.</span>
                        <span className="col-span-4">No Telepon</span>
                        <span className="col-span-7">: {data.pemohon.noTelp}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-700">
                        <span className="col-span-1">b.</span>
                        <span className="col-span-4">Email</span>
                        <span className="col-span-7">: {data.pemohon.email}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">4.</span>
                        <span className="col-span-4">Status Penanaman Modal</span>
                        <span className="col-span-7">: {data.kegiatan.statusPenanamanModal}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">5.</span>
                        <span className="col-span-4">Jenis usaha/kegiatan</span>
                        <span className="col-span-7 font-bold text-emerald-800">: {data.kegiatan.jenisUsaha}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">6.</span>
                        <span className="col-span-4">Lokasi Usaha</span>
                        <span className="col-span-7">:</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-700">
                        <span className="col-span-1">b.</span>
                        <span className="col-span-4">Desa/Kelurahan</span>
                        <span className="col-span-7">: {data.pemohon.desaKel}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-700">
                        <span className="col-span-1">c.</span>
                        <span className="col-span-4">Kecamatan</span>
                        <span className="col-span-7">: {data.pemohon.kecamatan}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-700">
                        <span className="col-span-1">d.</span>
                        <span className="col-span-4">Kab/Kota</span>
                        <span className="col-span-7">: {data.pemohon.kabupaten}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-700">
                        <span className="col-span-1">e.</span>
                        <span className="col-span-4">Provinsi</span>
                        <span className="col-span-7">: {data.pemohon.provinsi}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">7.</span>
                        <span className="col-span-4">Luas tanah yang dimohon</span>
                        <span className="col-span-7 font-bold">: {data.kegiatan.luasTanahDimohon} m²</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">8.</span>
                        <span className="col-span-4">Luas bangunan</span>
                        <span className="col-span-7 font-bold">: {data.kegiatan.luasBangunanRencana} m²</span>
                      </div>
                    </div>

                    {/* Pendapat Forum Penataan Ruang */}
                    <div className="pt-2">
                      <p className="text-[11px] sm:text-xs font-sans mb-2 font-medium">
                        Setelah mengadakan pembahasan penilaian dokumen usulan kegiatan Pemanfaatan Ruang terhadap RTR, kami Forum Penataan Ruang Kabupaten Luwu berpendapat :
                      </p>
                      <div className="space-y-1 text-[11px] sm:text-xs font-sans pl-2">
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1">1.</span>
                          <span className="col-span-4">Kesesuaian dengan dokumen rencana tata ruang</span>
                          <span className="col-span-7 font-bold text-emerald-800">: {data.tataRuang.kesesuaian}</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1">2.</span>
                          <span className="col-span-4">Koordinat Geografis</span>
                          <span className="col-span-7">: Terlampir</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1">3.</span>
                          <span className="col-span-4">No Pertek</span>
                          <span className="col-span-7">: -</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1">4.</span>
                          <span className="col-span-4">No Perda</span>
                          <span className="col-span-7">: {data.tataRuang.dasarPerda} <b>termasuk dalam {data.tataRuang.polaRuangEksisting}</b>.</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1">5.</span>
                          <span className="col-span-4">Luas tanah yang disetujui</span>
                          <span className="col-span-7 font-bold">: {data.tataRuang.luasTanahDisetujui} m²</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1">6.</span>
                          <span className="col-span-4">Jenis peruntukan Pemanfaatan Ruang</span>
                          <span className="col-span-7 font-bold text-indigo-900">: {data.tataRuang.jenisPeruntukanDisetujui}</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1">7.</span>
                          <span className="col-span-4">Kode KBLI</span>
                          <span className="col-span-7">: -</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400 font-mono pt-4">
                      Halaman 1 dari 4 (Berita Acara FPR No. 120/BA-FPR/NB/IX/2026)
                    </div>
                  </div>
                )}

                {/* ----------------- HALAMAN 2 ----------------- */}
                {selectedPage === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5 text-[11px] sm:text-xs font-sans pl-2">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">8.</span>
                        <span className="col-span-5">Judul KBLI</span>
                        <span className="col-span-6">: -</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">9.</span>
                        <span className="col-span-5">Koefisien Dasar Bangunan maksimum</span>
                        <span className="col-span-6 font-bold text-emerald-800">: {data.intensitas.kdbMax}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">10.</span>
                        <span className="col-span-5">Koefisien Lantai Bangunan maksimum</span>
                        <span className="col-span-6 font-bold">: {data.intensitas.klbMax}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">11.</span>
                        <span className="col-span-5">Indikasi Program Pemanfaatan Ruang</span>
                        <span className="col-span-6">: -</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">12.</span>
                        <span className="col-span-5">Persyaratan Pelaksanaan kegiatan Pemanfaatan Ruang</span>
                        <span className="col-span-6 font-medium">: - {data.kegiatan.alasHak}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pt-1">
                        <span className="col-span-1">13.</span>
                        <span className="col-span-11 font-bold">Informasi Tambahan</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-800">
                        <span className="col-span-1">a.</span>
                        <span className="col-span-5">Garis Sempadan Bangunan minimum</span>
                        <span className="col-span-6 font-bold text-red-800">: {data.intensitas.gsbMin}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-800">
                        <span className="col-span-1">b.</span>
                        <span className="col-span-5">Jarak Bebas Bangunan minimum</span>
                        <span className="col-span-6">: -</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-800">
                        <span className="col-span-1">c.</span>
                        <span className="col-span-5">Koefisien Dasar Hijau Minimum</span>
                        <span className="col-span-6 font-bold text-emerald-800">: {data.intensitas.kdhMin}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-800">
                        <span className="col-span-1">d.</span>
                        <span className="col-span-5">Koefisien Tapak Basement Maksimum</span>
                        <span className="col-span-6">: -</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 pl-4 text-slate-800">
                        <span className="col-span-1">e.</span>
                        <span className="col-span-5">Jaringan Utilitas Kota</span>
                        <span className="col-span-6">: -</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-1">14.</span>
                        <span className="col-span-5">Peta</span>
                        <span className="col-span-6 font-bold">: Terlampir</span>
                      </div>
                    </div>

                    {/* Klausul Kesimpulan */}
                    <div className="pt-2 text-[11px] sm:text-xs leading-relaxed font-sans space-y-2">
                      <p className="text-justify">
                        Berdasarkan pertimbangan tersebut di atas, maka Forum Penataan Ruang Daerah Kabupaten Luwu berkesimpulan memberikan rekomendasi <b>Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Non Berusaha</b> sebagaimana yang dimohonkan.
                      </p>
                      <p className="text-justify">
                        Demikian Berita Acara Rapat Pemberian Pertimbangan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang Non Berusaha ini dibuat untuk dipergunakan sebagai bahan pertimbangan dalam penerbitan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang.
                      </p>
                    </div>

                    {/* Tanda Tangan & Stempel Resmi */}
                    <div className="pt-6 flex justify-end">
                      <div className="w-72 text-center font-sans space-y-1">
                        <div className="text-xs">Ditandatangani oleh :</div>
                        <div className="text-xs font-bold">{data.pejabat.jabatan}</div>
                        
                        {/* Area Tanda Tangan & Cap Stempel Basah Digital */}
                        <div className="relative py-4 my-1 flex items-center justify-center">
                          {/* Stempel Dinas PUPTR */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-85 pointer-events-none">
                            <div className="w-32 h-32 rounded-full border-2 border-indigo-700/80 flex flex-col items-center justify-center p-1 text-[8px] font-black text-indigo-800 tracking-tighter uppercase text-center rotate-[-12deg]">
                              <div className="border-b border-indigo-700/60 pb-0.5 w-full">PEMKAB LUWU</div>
                              <div className="py-1 text-[7px] leading-tight">DINAS PEKERJAAN UMUM & TATA RUANG</div>
                              <div className="border-t border-indigo-700/60 pt-0.5 w-full">KABUPATEN LUWU</div>
                            </div>
                          </div>
                          {/* Garis Goresan TTD Digital */}
                          <div className="relative z-10 font-serif italic text-2xl text-slate-800 tracking-widest select-none py-3">
                            <span className="font-extrabold text-blue-950 underline decoration-blue-900">IkhsanAsaad</span>
                          </div>
                        </div>

                        <div className="font-bold text-xs underline uppercase">{data.pejabat.nama}</div>
                        <div className="text-[11px] font-mono">NIP. {data.pejabat.nip}</div>
                      </div>
                    </div>

                    {/* Security Footer */}
                    <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-[9px] font-sans text-slate-500">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-8 h-8 text-slate-800" />
                        <div>
                          <div className="font-bold text-slate-800">Dokumen Sah Terverifikasi BSrE BSSN</div>
                          <div>Kode Hash: 8f92-ba74-luwu-puptr-fpr-2026</div>
                        </div>
                      </div>
                      <div className="font-mono text-right">
                        Halaman 2 dari 4 (Berita Acara FPR No. 120/BA-FPR/NB/IX/2026)
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------- HALAMAN 3 (LAMPIRAN I - PETA) ----------------- */}
                {selectedPage === 3 && (
                  <div className="space-y-3 font-sans">
                    <div className="text-center pb-2 border-b border-black">
                      <h4 className="font-extrabold text-xs sm:text-sm tracking-wide uppercase">LAMPIRAN I</h4>
                      <h5 className="font-bold text-xs uppercase tracking-wide">BERITA ACARA</h5>
                      <h6 className="font-extrabold text-[11px] uppercase">
                        RAPAT KOORDINASI FORUM PENATAAN RUANG UNTUK PENILAIAN DOKUMEN PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG NON BERUSAHA
                      </h6>
                      <div className="text-[11px] flex justify-center gap-4 mt-1 font-mono">
                        <span>Nomor : {data.nomorBa}</span>
                        <span>Tanggal : {data.tanggalBa}</span>
                      </div>
                    </div>

                    <div className="text-[11px] leading-snug space-y-1">
                      <p className="text-justify">
                        Peta Rekomendasi Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang untuk Kegiatan Non Berusaha <b>{data.kegiatan.jenisUsaha}</b> di Desa/Kel. {data.pemohon.desaKel}, Kec. {data.pemohon.kecamatan}, Kabupaten Luwu atas nama <b>{data.pemohon.nama}</b>.
                      </p>
                      <p className="font-bold">
                        PKKPR untuk Kegiatan Non Berusaha direkomendasikan disetujui seluruhnya dengan pertimbangan :
                      </p>
                      <ol className="list-decimal list-inside pl-2 space-y-0.5 text-slate-800">
                        <li>{data.tataRuang.dasarPerda}</li>
                        <li>{data.kegiatan.alasHak}</li>
                      </ol>
                    </div>

                    {/* Visualisasi Peta Satelit Citra Orthophoto */}
                    <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-md">
                      <div className="relative h-64 sm:h-80 w-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center overflow-hidden">
                        {/* Background Satellite imagery texture */}
                        <div className="absolute inset-0 bg-emerald-950/70" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-800/40 via-slate-900/80 to-slate-950" />
                        
                        {/* Google Earth Watermark badge */}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[9px] font-sans text-white font-mono z-20">
                          Google Earth Citra Satelit Tegak WGS84
                        </div>
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white font-bold text-[10px] z-20 shadow">
                          Luas Bidang: {data.kegiatan.luasTanahDimohon} m²
                        </div>

                        {/* Poligon Delineasi Kuning Terang (Yellow Boundary Polygon) */}
                        <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 500 320">
                          {/* Surrounding Context Roads / Settlements */}
                          <path d="M 50 280 L 450 180" stroke="rgba(255,255,255,0.3)" strokeWidth="8" strokeLinecap="round" />
                          <path d="M 230 40 L 260 300" stroke="rgba(255,255,255,0.25)" strokeWidth="6" strokeLinecap="round" />
                          
                          {/* Poligon Kuning Gereja Pongsamelung */}
                          <polygon 
                            points="220,130 260,120 280,140 270,175 235,185 210,165" 
                            fill="rgba(234, 179, 8, 0.45)" 
                            stroke="#eab308" 
                            strokeWidth="3.5"
                            className="animate-pulse"
                          />

                          {/* Building Footprint (Tapak Bangunan 256 m²) */}
                          <rect x="230" y="140" width="30" height="25" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />

                          {/* Coordinate Points */}
                          <circle cx="220" cy="130" r="4" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
                          <text x="210" y="125" fill="#ffffff" fontSize="9" fontWeight="bold">1</text>

                          <circle cx="260" cy="120" r="4" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
                          <text x="265" y="115" fill="#ffffff" fontSize="9" fontWeight="bold">2</text>

                          <circle cx="280" cy="140" r="4" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
                          <text x="285" y="140" fill="#ffffff" fontSize="9" fontWeight="bold">3</text>

                          <circle cx="270" cy="175" r="4" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
                          <text x="275" y="185" fill="#ffffff" fontSize="9" fontWeight="bold">4</text>

                          <circle cx="235" cy="185" r="4" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
                          <text x="235" y="200" fill="#ffffff" fontSize="9" fontWeight="bold">5</text>

                          <circle cx="210" cy="165" r="4" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
                          <text x="198" y="170" fill="#ffffff" fontSize="9" fontWeight="bold">6</text>
                        </svg>
                      </div>
                    </div>

                    {/* Tabel Keterangan Letak Peta */}
                    <div className="pt-1">
                      <div className="text-[11px] font-bold mb-1">Keterangan letak peta:</div>
                      <div className="border border-slate-400 text-[10px] sm:text-[11px]">
                        <div className="grid grid-cols-12 border-b border-slate-300 p-1">
                          <span className="col-span-4 font-semibold">Dusun</span>
                          <span className="col-span-8">: {data.pemohon.dusun}</span>
                        </div>
                        <div className="grid grid-cols-12 border-b border-slate-300 p-1 bg-slate-50">
                          <span className="col-span-4 font-semibold">Desa/Kelurahan</span>
                          <span className="col-span-8 font-bold">: {data.pemohon.desaKel}</span>
                        </div>
                        <div className="grid grid-cols-12 border-b border-slate-300 p-1">
                          <span className="col-span-4 font-semibold">Kecamatan</span>
                          <span className="col-span-8 font-bold">: {data.pemohon.kecamatan}</span>
                        </div>
                        <div className="grid grid-cols-12 border-b border-slate-300 p-1 bg-slate-50">
                          <span className="col-span-4 font-semibold">Kabupaten</span>
                          <span className="col-span-8">: {data.pemohon.kabupaten}</span>
                        </div>
                        <div className="grid grid-cols-12 p-1">
                          <span className="col-span-4 font-semibold">Provinsi</span>
                          <span className="col-span-8">: {data.pemohon.provinsi}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400 font-mono pt-2">
                      Halaman 3 dari 4 (Lampiran I Peta Deliniasi Spasial)
                    </div>
                  </div>
                )}

                {/* ----------------- HALAMAN 4 (LAMPIRAN II - TABEL KOORDINAT) ----------------- */}
                {selectedPage === 4 && (
                  <div className="space-y-4 font-sans">
                    <div className="text-center pb-2 border-b border-black">
                      <h4 className="font-extrabold text-xs sm:text-sm tracking-wide uppercase">LAMPIRAN II</h4>
                      <h5 className="font-bold text-xs uppercase tracking-wide">BERITA ACARA</h5>
                      <h6 className="font-extrabold text-[11px] uppercase">
                        RAPAT KOORDINASI FORUM PENATAAN RUANG UNTUK PENILAIAN DOKUMEN PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG NON BERUSAHA
                      </h6>
                      <div className="text-[11px] flex justify-center gap-4 mt-1 font-mono">
                        <span>Nomor : {data.nomorBa}</span>
                        <span>Tanggal : {data.tanggalBa}</span>
                      </div>
                    </div>

                    <div className="text-[11px] sm:text-xs font-bold text-center pt-2">
                      Tabel Koordinat Geografis Yang Direkomendasikan Disetujui
                    </div>

                    {/* Tabel Koordinat Geografis Presisi */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-800 text-[11px] sm:text-xs text-center">
                        <thead>
                          <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-800">
                            <th className="border border-slate-800 py-2 px-3 w-16">NO.</th>
                            <th className="border border-slate-800 py-2 px-4">Garis Lintang (Latitude)</th>
                            <th className="border border-slate-800 py-2 px-4">Garis Bujur (Longitude)</th>
                            <th className="border border-slate-800 py-2 px-4 bg-slate-300">Format Desimal (DD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.koordinat.map((c) => (
                            <tr key={c.no} className="hover:bg-slate-50">
                              <td className="border border-slate-800 py-2 px-3 font-bold">{c.no}</td>
                              <td className="border border-slate-800 py-2 px-4 font-mono font-bold text-slate-800">{c.lintangDdm}</td>
                              <td className="border border-slate-800 py-2 px-4 font-mono font-bold text-slate-800">{c.bujurDdm}</td>
                              <td className="border border-slate-800 py-2 px-4 font-mono text-[10px] text-slate-600 bg-slate-50">
                                {c.latDd.toFixed(6)}, {c.lngDd.toFixed(6)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Catatan Validasi Geometri */}
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-[10px] sm:text-[11px] space-y-1 text-slate-700">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Validasi Topologi Geometri Selesai
                      </div>
                      <p>
                        Delineasi 6 titik koordinat di atas membentuk poligon tertutup (*closed polygon*) seluas tepat <b>{data.kegiatan.luasTanahDimohon} m²</b> di Desa Pongsamelung, Kecamatan Lamasi, Kabupaten Luwu. Koordinat ini siap ditransmisikan ke sistem SIMBG dan sistem OSS-RBA.
                      </p>
                    </div>

                    <div className="text-right text-[10px] text-slate-400 font-mono pt-4">
                      Halaman 4 dari 4 (Lampiran II Tabel Koordinat Geografis WGS84)
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ALUR TRANSMISI DARI PUPTR KE DPMPTSP (OSS) */}
          {/* ========================================================= */}
          {activeTab === 'alur' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      Interoperabilitas SPBE Antar Instansi
                    </span>
                    <h3 className="text-base sm:text-lg font-black mt-1">
                      Integrasi Otomatis Berita Acara PUPTR ke Modul Cetak Izin DPMPTSP
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Berita Acara No. {data.nomorBa} menjadi landasan yuridis tanpa perlu entri manual ulang.
                    </p>
                  </div>

                  <button
                    onClick={handleSimulateTransmission}
                    disabled={transmissionStatus === 'transmitting'}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {transmissionStatus === 'transmitting' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mentransmisikan Data...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Ulang ke DPMPTSP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 4 Tahapan Integrasi */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 font-black text-xs flex items-center justify-center mb-2">
                    01
                  </div>
                  <h4 className="font-bold text-sm">Telaah Tata Ruang Dinas PUPTR</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Verifikator PUPTR menguji koordinat lokasi pemohon terhadap Perda RTRW Kab. Luwu No. 6/2011.
                  </p>
                  <div className="mt-3 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selesai Disidangkan
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 font-black text-xs flex items-center justify-center mb-2">
                    02
                  </div>
                  <h4 className="font-bold text-sm">Penetapan Berita Acara FPR</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Sekretaris Forum Penataan Ruang menerbitkan BA No. 120/BA-FPR/NB/IX/2026 disertai 6 titik koordinat.
                  </p>
                  <div className="mt-3 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ditandatangani TTE
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 font-black text-xs flex items-center justify-center mb-2">
                    03
                  </div>
                  <h4 className="font-bold text-sm">Transmisi Data ke DPMPTSP</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Data KDB ({data.intensitas.kdbMax}), KLB, GSB (7m), dan koordinat masuk ke inbox sistem perizinan.
                  </p>
                  <div className="mt-3 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung Otomatis
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 font-black text-xs flex items-center justify-center mb-2">
                    04
                  </div>
                  <h4 className="font-bold text-sm">Penerbitan SK PKKPR Final</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Kepala Dinas PMPTSP menandatangani SK Izin PKKPR ber-barcode BSrE, pemohon dapat mengunduh langsung.
                  </p>
                  <div className="mt-3 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Siap Cetak
                  </div>
                </div>
              </div>

              {/* Komparasi Nilai Parameter Otomatis */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h4 className="font-extrabold text-sm mb-3">Tabel Ekstraksi Parameter Teknis Otomatis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">KDB Maksimum vs Realisasi</span>
                    <span className="font-black text-sm text-emerald-600">{kdbActualPercent}%</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Batas Maksimun: {data.intensitas.kdbMax} (Aman)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Garis Sempadan (GSB)</span>
                    <span className="font-black text-sm text-blue-600">Min. {data.intensitas.gsbMin}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Wajib diterapkan di gambar PBG</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Koefisien Lantai (KLB)</span>
                    <span className="font-black text-sm text-indigo-600">{data.intensitas.klbMax}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Ketinggian bangunan 1–3 lantai</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Ruang Terbuka Hijau (KDH)</span>
                    <span className="font-black text-sm text-teal-600">{data.intensitas.kdhMin}%</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Resapan air lingkungan terjaga</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SPASIAL & EKSPOR GEOJSON / WKT */}
          {/* ========================================================= */}
          {activeTab === 'spasial' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-black text-sm sm:text-base">Delineasi Geospasial Bidang Tanah Lamasi</h4>
                  <p className="text-xs text-slate-500">
                    Koordinat WGS84 diekstraksi ke format baku GIS untuk diintegrasikan ke sistem WebGIS Luwu / GISTARU ATR BPN.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generateGeoJson(), 'geojson')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {copiedKey === 'geojson' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'geojson' ? 'Tersalin!' : 'Salin GeoJSON'}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(generateWkt(), 'wkt')}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'wkt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'wkt' ? 'Tersalin!' : 'Salin WKT'}</span>
                  </button>
                </div>
              </div>

              {/* JSON Viewer */}
              <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800">
                <pre>{generateGeoJson()}</pre>
              </div>

              {/* Ringkasan Konversi Titik */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2">
                <h5 className="font-bold">Konversi Format Koordinat (WGS84) :</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[11px]">
                  {data.koordinat.map((c) => (
                    <div key={c.no} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 font-bold">Titik Batas #{c.no}</div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">{c.lintangDdm}, {c.bujurDdm}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">DD: {c.latDd.toFixed(6)}, {c.lngDd.toFixed(6)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: HASIL CETAK SK IZIN PKKPR FINAL (DPMPTSP) */}
          {/* ========================================================= */}
          {activeTab === 'oss' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm sm:text-base text-emerald-950 dark:text-emerald-200">
                    Hasil Penerbitan Dokumen Final: Persetujuan KKPR Non Berusaha
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Diterbitkan oleh Kepala Dinas Penanaman Modal dan PTSP Kabupaten Luwu berdasarkan rekomendasi teknis PUPTR No. {data.nomorBa}.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak SK Izin Final</span>
                </button>
              </div>

              {/* Simulated Final PKKPR Approval Certificate */}
              <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-white text-slate-900 border-2 border-slate-300 shadow-xl font-sans text-xs space-y-4">
                <div className="text-center pb-3 border-b-2 border-slate-800">
                  <img src={LUWU_LOGO_BASE64} alt="" className="w-14 h-14 mx-auto mb-1 object-contain" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">PEMERINTAH KABUPATEN LUWU</h3>
                  <h4 className="font-extrabold text-sm uppercase">DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU</h4>
                  <p className="text-[10px] text-slate-600">Pusat Pelayanan Publik Terpadu MPP Simpurusiang Belopa</p>
                </div>

                <div className="text-center pt-1">
                  <h5 className="font-black text-sm uppercase tracking-wide">
                    SURAT KEPUTUSAN KEPALA DINAS PMPTSP KABUPATEN LUWU
                  </h5>
                  <div className="text-xs font-bold mt-0.5">
                    NOMOR: 503/PKKPR-NB/DPMPTSP/09/2026
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                    TENTANG PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR) NON BERUSAHA
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5">
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 font-semibold text-slate-600">Nama Pemohon</span>
                    <span className="col-span-8 font-bold text-slate-900">: {data.pemohon.nama}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 font-semibold text-slate-600">Peruntukan Ruang</span>
                    <span className="col-span-8 font-bold text-emerald-800">: {data.kegiatan.jenisUsaha}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 font-semibold text-slate-600">Lokasi Bidang</span>
                    <span className="col-span-8">: Desa {data.pemohon.desaKel}, Kec. {data.pemohon.kecamatan}, Luwu</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 font-semibold text-slate-600">Luas Disetujui</span>
                    <span className="col-span-8 font-bold">: {data.tataRuang.luasTanahDisetujui} m²</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 font-semibold text-slate-600">Dasar Rekomendasi</span>
                    <span className="col-span-8 font-mono">: BA PUPTR No. {data.nomorBa} tgl {data.tanggalBa}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-12 h-12 text-slate-900" />
                    <div className="text-[9px] text-slate-500">
                      <div className="font-bold text-slate-800">TTE Tersertifikasi BSrE BSSN</div>
                      <div>Dapat diverifikasi pada portal resmi MPP</div>
                    </div>
                  </div>

                  <div className="text-right text-[11px]">
                    <div>Ditetapkan di Belopa, Luwu</div>
                    <div className="font-bold">Kepala Dinas PMPTSP Kabupaten Luwu</div>
                    <div className="font-serif italic font-bold text-indigo-900 my-2 text-base select-none">
                      (Telah Ditandatangani Elektronik)
                    </div>
                    <div className="font-bold uppercase underline">H. RAHMAT KASJIM, ST., M.Si</div>
                    <div className="text-[10px] text-slate-500 font-mono">NIP. 19710314 199803 1 005</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 border-t border-inherit flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950/60 text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Dokumen Terintegrasi MPP Simpurusiang & Dinas PUPTR Kab. Luwu</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
}
