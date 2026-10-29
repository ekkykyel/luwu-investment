import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Building2, 
  Award, 
  Users, 
  FileCheck2, 
  ArrowLeft, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  Scale, 
  ExternalLink,
  Phone,
  Mail,
  HeartHandshake
} from 'lucide-react';
import { MPP_CARD_SURFACE, MPP_TYPOGRAPHY } from '../common/MppCard';
import { LUWU_LOGO_BASE64 } from '../../lib/logoBase64';

type TabKey = 'tentang' | 'visi-misi' | 'struktur-organisasi' | 'maklumat-pelayanan';

interface MppProfileHubViewProps {
  initialTab?: TabKey;
}

export const MppProfileHubView: React.FC<MppProfileHubViewProps> = ({ initialTab }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const activeTab: TabKey = ((): TabKey => {
    if (initialTab) return initialTab;
    const path = location.pathname;
    if (path.includes('visi-misi')) return 'visi-misi';
    if (path.includes('struktur-organisasi')) return 'struktur-organisasi';
    if (path.includes('maklumat-pelayanan')) return 'maklumat-pelayanan';
    return 'tentang';
  })();

  useEffect(() => {
    // Dynamic document title update based on subpage
    const titles: Record<TabKey, string> = {
      'tentang': 'Tentang MPP Simpurusiang - Mal Pelayanan Publik Kabupaten Luwu',
      'visi-misi': 'Visi & Misi MPP Simpurusiang - Kabupaten Luwu',
      'struktur-organisasi': 'Struktur Organisasi MPP Simpurusiang - Kabupaten Luwu',
      'maklumat-pelayanan': 'Maklumat Pelayanan & Komitmen Integritas - MPP Simpurusiang Luwu'
    };
    document.title = titles[activeTab] || 'Profil MPP Simpurusiang - Kabupaten Luwu';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleTabChange = (tab: TabKey) => {
    navigate(`/mpp/${tab}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] dark:bg-[#071624] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F3]/90 dark:bg-[#071624]/90 backdrop-blur-md border-b border-[#E5DFD3] dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/mpp')}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-[#EAE4D7] dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold"
              aria-label="Kembali ke Beranda MPP"
            >
              <ArrowLeft className="w-4 h-4 text-[#0F6B4F] dark:text-emerald-400" />
              <span>Beranda MPP</span>
            </button>
            <div className="h-5 w-px bg-slate-300 dark:bg-white/15 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2">
              <img 
                src={LUWU_LOGO_BASE64} 
                alt="Logo Pemkab Luwu" 
                className="w-7 h-7 object-contain"
              />
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                MPP Simpurusiang <span className="text-[#0F6B4F] dark:text-emerald-400 font-medium">Kab. Luwu</span>
              </span>
            </div>
          </div>

          <Link
            to="/mpp#smart-live-queue"
            className="px-3.5 py-1.5 rounded-lg bg-[#0F6B4F] hover:bg-[#0B543E] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            Ambil Antrean
          </Link>
        </div>
      </header>

      {/* Hero Banner Header */}
      <div className="bg-gradient-to-b from-[#0F6B4F]/10 via-[#FAF8F3] to-[#FAF8F3] dark:from-[#0A2438] dark:via-[#071624] dark:to-[#071624] py-8 sm:py-12 border-b border-[#E5DFD3] dark:border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F6B4F]/10 dark:bg-emerald-500/10 text-[#0F6B4F] dark:text-emerald-400 border border-[#0F6B4F]/20 text-xs font-bold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PORTAL RESMI PEMERINTAH KABUPATEN LUWU</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight">
            Profil Mal Pelayanan Publik Simpurusiang
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Pusat pelayanan terpadu satu atap yang mengintegrasikan 20 instansi kementerian/lembaga, BUMN, perbankan, dan Organisasi Perangkat Daerah Kabupaten Luwu.
          </p>

          {/* Tab Navigation Pill Bar */}
          <div className="pt-4 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleTabChange('tentang')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'tentang'
                  ? 'bg-[#0F6B4F] text-white shadow-md'
                  : 'bg-white dark:bg-[#0D2338] text-slate-700 dark:text-slate-300 border border-[#E5DFD3] dark:border-white/10 hover:border-[#0F6B4F]/40'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Tentang MPP</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('visi-misi')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'visi-misi'
                  ? 'bg-[#0F6B4F] text-white shadow-md'
                  : 'bg-white dark:bg-[#0D2338] text-slate-700 dark:text-slate-300 border border-[#E5DFD3] dark:border-white/10 hover:border-[#0F6B4F]/40'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Visi &amp; Misi</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('struktur-organisasi')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'struktur-organisasi'
                  ? 'bg-[#0F6B4F] text-white shadow-md'
                  : 'bg-white dark:bg-[#0D2338] text-slate-700 dark:text-slate-300 border border-[#E5DFD3] dark:border-white/10 hover:border-[#0F6B4F]/40'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Struktur Organisasi</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('maklumat-pelayanan')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'maklumat-pelayanan'
                  ? 'bg-[#0F6B4F] text-white shadow-md'
                  : 'bg-white dark:bg-[#0D2338] text-slate-700 dark:text-slate-300 border border-[#E5DFD3] dark:border-white/10 hover:border-[#0F6B4F]/40'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Maklumat Pelayanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ============================================================== */}
        {/* TAB 1: TENTANG MPP                                             */}
        {/* ============================================================== */}
        {activeTab === 'tentang' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className={`${MPP_CARD_SURFACE.default} ${MPP_CARD_SURFACE.paddingLg} rounded-2xl space-y-5`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0F6B4F]/10 dark:bg-emerald-500/10 text-[#0F6B4F] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Gambaran Umum &amp; Landasan Hukum
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Penyelenggaraan Mal Pelayanan Publik Berdasarkan Regulasi Nasional &amp; Daerah
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu didirikan sebagai wujud nyata reformasi birokrasi dan peningkatan kualitas pelayanan publik terpadu di Bumi Sawerigading. Menyatukan seluruh instansi vertikal (Kementerian/Lembaga), Badan Usaha Milik Negara (BUMN), Perbankan, serta Perangkat Daerah Kabupaten Luwu dalam satu gedung modern di ibukota Belopa.
              </p>

              <div className="bg-[#F4EFE6] dark:bg-[#0D2338] p-4 rounded-xl border border-[#DFD7C7] dark:border-white/10 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F6B4F] dark:text-emerald-400 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>Landasan Hukum Penyelenggaraan</span>
                </h3>
                <ul className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Undang-Undang Nomor 25 Tahun 2009 tentang Pelayanan Publik.</li>
                  <li>Peraturan Presiden Republik Indonesia Nomor 89 Tahun 2021 tentang Penyelenggaraan Mal Pelayanan Publik.</li>
                  <li>Peraturan Menteri PAN-RB Republik Indonesia Nomor 23 Tahun 2017 tentang Penetapan Petunjuk Teknis Penyelenggaraan Mal Pelayanan Publik.</li>
                  <li>Peraturan Bupati Luwu tentang Penyelenggaraan Mal Pelayanan Publik Simpurusiang Kabupaten Luwu.</li>
                </ul>
              </div>
            </div>

            {/* Profil Fasilitas & Lokasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${MPP_CARD_SURFACE.default} p-6 rounded-2xl space-y-4`}>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#0F6B4F] dark:text-emerald-400" />
                  <span>Lokasi &amp; Jam Operasional</span>
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>Alamat:</strong> Gedung Mal Pelayanan Publik Simpurusiang, Jl. Jenderal Sudirman (Kompleks Perkantoran Pemkab Luwu), Belopa, Kabupaten Luwu, Sulawesi Selatan.
                  </p>
                  <p>
                    <strong>Jam Pelayanan:</strong>
                    <br />• Senin – Kamis: 07.30 – 16.00 WITA
                    <br />• Jumat: 07.30 – 16.30 WITA
                    <br />• Sabtu, Minggu &amp; Libur Nasional: Tutup
                  </p>
                  <p>
                    <strong>Telepon / Helpdesk:</strong> (0471) 3314068 / WhatsApp: 0821-9488-3391
                  </p>
                </div>
              </div>

              <div className={`${MPP_CARD_SURFACE.default} p-6 rounded-2xl space-y-4`}>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#0F6B4F] dark:text-emerald-400" />
                  <span>Fasilitas Penunjang Publik</span>
                </h3>
                <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
                  <li>✓ 20 Gerai Instansi Terintegrasi Sistem Antrean Digital</li>
                  <li>✓ Jalur &amp; Loket Prioritas Ramah Disabilitas, Lansia, dan Ibu Hamil</li>
                  <li>✓ Ruang Laktasi &amp; Ruang Bermain Anak (Kids Corner)</li>
                  <li>✓ Pojok Baca Digital &amp; Galeri Produk UMKM Luwu</li>
                  <li>✓ Musholla &amp; Toilet Bersih Berstandar Aksesibilitas</li>
                  <li>✓ Parkir Kendaraan Luas, Aman, dan Bebas Biaya Retribusi</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: VISI & MISI                                             */}
        {/* ============================================================== */}
        {activeTab === 'visi-misi' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Kartu Visi */}
            <div className={`${MPP_CARD_SURFACE.default} ${MPP_CARD_SURFACE.paddingLg} rounded-2xl border-l-4 border-l-[#0F6B4F] dark:border-l-emerald-500 space-y-3`}>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F6B4F] dark:text-emerald-400">
                Visi Penyelenggaraan
              </span>
              <blockquote className="text-lg sm:text-2xl font-serif font-bold text-slate-900 dark:text-white italic leading-snug">
                “Terwujudnya Pelayanan Publik Kabupaten Luwu yang Terintegrasi, Cepat, Mudah, Transparan, Inklusif, dan Bebas Pungli.”
              </blockquote>
            </div>

            {/* Kartu Misi */}
            <div className={`${MPP_CARD_SURFACE.default} ${MPP_CARD_SURFACE.paddingLg} rounded-2xl space-y-5`}>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Misi Penyelenggaraan MPP Simpurusiang
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#0D2338] border border-[#E5DFD3] dark:border-white/10 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0F6B4F] text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Integrasi Layanan Satu Atap
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Menyatukan seluruh perizinan dan dokumen administrasi dari 20 instansi pemerintah, vertikal, BUMN, dan perbankan tanpa hambatan sekat sektoral.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#0D2338] border border-[#E5DFD3] dark:border-white/10 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0F6B4F] text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Digitalisasi &amp; Transparansi Antrean
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Menerapkan teknologi antrean digital terpusat, estimasi waktu pelayanan yang pasti, dan publikasi persyaratan berkas terbuka.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#0D2338] border border-[#E5DFD3] dark:border-white/10 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0F6B4F] text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Inklusivitas &amp; Kesetaraan Akses
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Menjamin kenyamanan dan aksesibilitas ramah bagi lansia, penyandang disabilitas, serta kelompok rentan lainnya.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#0D2338] border border-[#E5DFD3] dark:border-white/10 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0F6B4F] text-white flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Akuntabilitas &amp; Zona Integritas
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Menegakkan budaya anti-korupsi, bebas gratifikasi, dan nol pungli melalui kanal pengaduan aktif serta evaluasi Survei Kepuasan Masyarakat (SKM).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: STRUKTUR ORGANISASI                                     */}
        {/* ============================================================== */}
        {activeTab === 'struktur-organisasi' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className={`${MPP_CARD_SURFACE.default} ${MPP_CARD_SURFACE.paddingLg} rounded-2xl space-y-6`}>
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Bagan Pengelola MPP Simpurusiang
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Keputusan Bupati Luwu tentang Tim Penyelenggara Mal Pelayanan Publik
                </p>
              </div>

              {/* Hierarchy Tree Visual */}
              <div className="space-y-4 max-w-2xl mx-auto">
                {/* Level 1: Pembina */}
                <div className="p-4 rounded-xl bg-[#0F6B4F] text-white text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[#F5DFA0]">
                    Pembina Utama
                  </div>
                  <div className="text-base font-extrabold mt-0.5">
                    Bupati Luwu
                  </div>
                  <div className="text-xs text-emerald-100 font-medium">
                    Pemerintah Kabupaten Luwu
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-300 dark:bg-white/20 mx-auto" />

                {/* Level 2: Pengarah */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#0D2338] border-2 border-[#0F6B4F]/40 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[#0F6B4F] dark:text-emerald-400">
                    Pengarah Teknis
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Sekretaris Daerah Kabupaten Luwu
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-300 dark:bg-white/20 mx-auto" />

                {/* Level 3: Penyelenggara / Pengelola */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#0D2338] border border-[#E5DFD3] dark:border-white/10 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">
                    Penyelenggara / Kepala Pengelola
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    Kepala Dinas Penanaman Modal &amp; PTSP Kab. Luwu
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Sekretaris Pengelola: Sekretaris DPMPTSP Kab. Luwu
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-300 dark:bg-white/20 mx-auto" />

                {/* Level 4: Koordinator Bidang */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F3] dark:bg-[#132E48] border border-[#E5DFD3] dark:border-white/10 text-center text-xs">
                    <span className="font-bold text-[#0F6B4F] dark:text-emerald-400 block mb-0.5">
                      Koordinator Pelayanan &amp; Pengaduan
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Tim Front Office &amp; Helpdesk Pelayanan Terpadu
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF8F3] dark:bg-[#132E48] border border-[#E5DFD3] dark:border-white/10 text-center text-xs">
                    <span className="font-bold text-[#0F6B4F] dark:text-emerald-400 block mb-0.5">
                      Koordinator Sarana &amp; IT
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Pengelola Sistem Antrean Digital &amp; Sarana Gedung
                    </span>
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-300 dark:bg-white/20 mx-auto" />

                {/* Level 5: 20 Gerai Instansi */}
                <div className="p-4 rounded-xl bg-[#F4EFE6] dark:bg-[#0A1D2E] border border-[#DFD7C7] dark:border-white/10 text-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    20 Gerai Instansi Terpadu (Vertikal, Perbankan, BUMN &amp; OPD Luwu)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Petugas loket ditugaskan langsung oleh pimpinan instansi masing-masing berdasarkan Nota Kesepakatan (MoU).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: MAKLUMAT PELAYANAN                                      */}
        {/* ============================================================== */}
        {activeTab === 'maklumat-pelayanan' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Maklumat Card */}
            <div className={`${MPP_CARD_SURFACE.default} p-6 sm:p-10 rounded-2xl border-2 border-[#C9A24B] text-center space-y-6 relative overflow-hidden bg-gradient-to-b from-white to-[#FAF8F3] dark:from-[#0D2338] dark:to-[#071624]`}>
              <div className="flex flex-col items-center space-y-2">
                <img 
                  src={LUWU_LOGO_BASE64} 
                  alt="Lambang Kabupaten Luwu" 
                  className="w-16 h-16 object-contain drop-shadow"
                />
                <div className="text-xs font-bold uppercase tracking-widest text-[#0F6B4F] dark:text-emerald-400">
                  Pemerintah Kabupaten Luwu · Dinas Penanaman Modal &amp; PTSP
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Maklumat Pelayanan
                </h2>
              </div>

              <div className="w-24 h-1 bg-[#C9A24B] mx-auto rounded-full" />

              <blockquote className="text-base sm:text-xl font-serif text-slate-800 dark:text-slate-100 italic leading-relaxed max-w-2xl mx-auto px-4">
                “Dengan ini, kami seluruh pimpinan dan staf pengelola Mal Pelayanan Publik Simpurusiang Kabupaten Luwu menyatakan sanggup menyelenggarakan pelayanan sesuai standar pelayanan yang telah ditetapkan, dan apabila tidak menepati janji ini, kami siap menerima sanksi sesuai dengan peraturan perundang-undangan yang berlaku.”
              </blockquote>

              <div className="pt-4 border-t border-[#E5DFD3] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
                <span>Ditetapkan di: Belopa, Kabupaten Luwu</span>
                <span className="font-bold text-[#0F6B4F] dark:text-emerald-400">Kepala DPMPTSP Kabupaten Luwu</span>
              </div>
            </div>

            {/* Standar Komitmen Integritas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${MPP_CARD_SURFACE.default} p-5 rounded-xl space-y-2`}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Bebas Biaya (Rp 0)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Semua konsultasi, pendaftaran antrean, dan layanan perizinan non-retribusi tidak dipungut biaya apapun. Nol pungutan liar.
                </p>
              </div>

              <div className={`${MPP_CARD_SURFACE.default} p-5 rounded-xl space-y-2`}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Kepastian Waktu (SLA)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Layanan front-office berstandar SLA terukur. Proses penerbitan izin dan dokumen kependudukan dipantau langsung dalam sistem.
                </p>
              </div>

              <div className={`${MPP_CARD_SURFACE.default} p-5 rounded-xl space-y-2`}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Kanal Pengaduan Aktif</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tersedia Pos Pengaduan Langsung, Integrasi SP4N-LAPOR!, serta Helpdesk Digital untuk merespons keluhan dalam 1×24 jam kerja.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 bg-[#F4EFE6] dark:bg-[#06121E] border-t border-[#E5DFD3] dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} Mal Pelayanan Publik Simpurusiang · Pemerintah Kabupaten Luwu</p>
          <div className="flex items-center justify-center gap-4 text-xs font-medium">
            <Link to="/mpp" className="hover:text-[#0F6B4F] dark:hover:text-emerald-400 transition-colors">Beranda MPP</Link>
            <span>•</span>
            <Link to="/mpp/tentang" className="hover:text-[#0F6B4F] dark:hover:text-emerald-400 transition-colors">Tentang</Link>
            <span>•</span>
            <Link to="/mpp/visi-misi" className="hover:text-[#0F6B4F] dark:hover:text-emerald-400 transition-colors">Visi &amp; Misi</Link>
            <span>•</span>
            <Link to="/mpp/maklumat-pelayanan" className="hover:text-[#0F6B4F] dark:hover:text-emerald-400 transition-colors">Maklumat</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MppProfileHubView;
