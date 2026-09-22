import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  UserCheck, 
  FileText, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  QrCode, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Award,
  Stamp,
  Users,
  Eye,
  Check,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  X,
  Printer,
  Trash2,
  FileUp
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  getOpdSettings, 
  saveOpdSettings, 
  OpdFullSettings, 
  JABATAN_OPTIONS_BY_OPD, 
  PANGKAT_GOLONGAN_OPTIONS 
} from '../../utils/opdSettingsStorage.js';

interface OpdSettingsViewProps {
  opdKey: 'puptr' | 'pertanian' | 'dpmptsp';
  title?: string;
}

export const OpdSettingsView: React.FC<OpdSettingsViewProps> = ({ opdKey, title }) => {
  const [settings, setSettings] = useState<OpdFullSettings>(() => getOpdSettings(opdKey));
  const [activeTab, setActiveTab] = useState<'profile' | 'admin' | 'kadin' | 'preview'>('kadin');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setSettings(getOpdSettings(opdKey));
  }, [opdKey]);

  const handleSave = () => {
    saveOpdSettings(opdKey, settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    Swal.fire({
      icon: 'success',
      title: 'Pengaturan OPD Berhasil Disimpan! 💾',
      html: `
        <div className="text-left text-xs space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 font-sans">
          <p className="text-slate-900 dark:text-emerald-100"><strong>Dinas:</strong> ${settings.opd.officialName}</p>
          <p className="text-slate-900 dark:text-emerald-100"><strong>Kepala Dinas:</strong> ${settings.kepalaDinas.fullName}</p>
          <p className="text-slate-900 dark:text-emerald-100"><strong>NIP Kadin:</strong> <code className="font-mono font-bold text-emerald-600">${settings.kepalaDinas.nip}</code></p>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1 border-t border-emerald-200 dark:border-emerald-800">
            ⚡ Nama, Pangkat, Kop Surat, dan NIP Kepala Dinas ini secara otomatis dijadikan penandatangan resmi pada dokumen Berita Acara / Pertek / SK PKKPR A4.
          </p>
        </div>
      `,
      confirmButtonColor: '#10b981'
    });
  };

  const handleKopSuratUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Format File Tidak Sesuai!',
        text: 'Mohon upload foto/gambar Kop Surat dengan format JPG, JPEG, atau PNG.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Ukuran File Terlalu Besar!',
        text: 'Maksimal ukuran file Kop Surat adalah 5 MB.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSettings(prev => ({
        ...prev,
        opd: {
          ...prev.opd,
          kopSuratUrl: dataUrl
        }
      }));
      Swal.fire({
        icon: 'success',
        title: 'Kop Surat Berhasil Diunggah! 🖼️',
        text: 'Kop surat akan otomatis ditempatkan pada bagian atas Berita Acara Pertimbangan Teknis A4.',
        timer: 2000,
        showConfirmButton: false
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveKopSurat = () => {
    setSettings(prev => ({
      ...prev,
      opd: {
        ...prev.opd,
        kopSuratUrl: undefined
      }
    }));
  };

  const getOpdTheme = () => {
    if (opdKey === 'puptr') return {
      badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
      primaryBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/20',
      headerGradient: 'from-indigo-900/90 via-slate-900 to-slate-950',
      accentBorder: 'border-indigo-500/30'
    };
    if (opdKey === 'pertanian') return {
      badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      primaryBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20',
      headerGradient: 'from-emerald-900/90 via-slate-900 to-slate-950',
      accentBorder: 'border-emerald-500/30'
    };
    return {
      badgeBg: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
      primaryBtn: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/20',
      headerGradient: 'from-teal-900/90 via-slate-900 to-slate-950',
      accentBorder: 'border-teal-500/30'
    };
  };

  const theme = getOpdTheme();
  const jabatanList = JABATAN_OPTIONS_BY_OPD[opdKey] || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ══════════════════════════════════════════════════════════
          HERO BANNER PENGATURAN OPD
         ══════════════════════════════════════════════════════════ */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.headerGradient} p-6 sm:p-8 text-white shadow-2xl border border-slate-800/80`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${theme.badgeBg} font-mono backdrop-blur-md`}>
                SISTEM MANAJEMEN OPINATOR &amp; PROFIL OPD
              </span>
              <span className="text-[10px] font-mono text-slate-400">Terintegrasi BSrE &amp; Supabase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {title || `Pengaturan &amp; Profil ${settings.opd.shortName}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola atribut kelembagaan, identitas admin verifikator, serta data Kepala Dinas sebagai penandatangan resmi naskah dinas (Pertek, BAP, &amp; SK PKKPR).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSettings(getOpdSettings(opdKey))}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Reset ke data awal"
            >
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>

            <button
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl ${theme.primaryBtn} text-xs font-extrabold shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95`}
            >
              {isSaved ? <CheckCircle2 size={16} className="text-white animate-bounce" /> : <Save size={16} />}
              <span>{isSaved ? 'Tersimpan!' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB NAVIGATION
         ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('kadin')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'kadin'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Award size={16} />
          <span>Kepala Dinas &amp; Penandatangan</span>
          <span className="ml-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-extrabold">UTAMA</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <UserCheck size={16} />
          <span>Profil Admin &amp; Verifikator</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Building2 size={16} />
          <span>Atribut Kelembagaan &amp; Kop Surat</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Eye size={16} />
          <span>Pratinjau Berita Acara A4</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: KEPALA DINAS & PENANDATANGAN NASKAH DINAS
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'kadin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Form Kepala Dinas */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data Kepala Dinas (Penandatangan Utama)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Informasi ini dicetak otomatis pada dokumen Pertek/BAP/SK Resmi.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap Kepala Dinas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.kepalaDinas.fullName}
                    onChange={(e) => setSettings({
                      ...settings,
                      kepalaDinas: { ...settings.kepalaDinas, fullName: e.target.value }
                    })}
                    placeholder="Contoh: IR. IKHSAN AS'AD, S.T., M.Si."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Sertakan gelar akademik lengkap sesuai SK Jabatan.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pangkat / Golongan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={settings.kepalaDinas.pangkatGolongan}
                      onChange={(e) => setSettings({
                        ...settings,
                        kepalaDinas: { ...settings.kepalaDinas, pangkatGolongan: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      {PANGKAT_GOLONGAN_OPTIONS.map((p, idx) => (
                        <option key={idx} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      NIP Kepala Dinas (18 Digit) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings.kepalaDinas.nip}
                      onChange={(e) => setSettings({
                        ...settings,
                        kepalaDinas: { ...settings.kepalaDinas, nip: e.target.value }
                      })}
                      placeholder="Contoh: 19710815 199803 1 007"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomenklatur Jabatan Resmi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.kepalaDinas.officialTitle}
                    onChange={(e) => setSettings({
                      ...settings,
                      kepalaDinas: { ...settings.kepalaDinas, officialTitle: e.target.value }
                    })}
                    placeholder="Contoh: Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Kabid / Penandatangan Pendamping */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kepala Bidang / Penandatangan Teknis Pendamping</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Penandatangan pendamping pada lembar klarifikasi/pemeriksaan fisik.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap Kabid / Pejabat Teknis
                  </label>
                  <input
                    type="text"
                    value={settings.kabidSignatory?.fullName || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      kabidSignatory: {
                        fullName: e.target.value,
                        pangkatGolongan: settings.kabidSignatory?.pangkatGolongan || 'Pembina (IV/a)',
                        nip: settings.kabidSignatory?.nip || '',
                        officialTitle: settings.kabidSignatory?.officialTitle || 'Kepala Bidang'
                      }
                    })}
                    placeholder="Contoh: IR. H. IRWANTO, S.T., M.T."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pangkat / Golongan Kabid
                    </label>
                    <select
                      value={settings.kabidSignatory?.pangkatGolongan || 'Pembina (IV/a)'}
                      onChange={(e) => setSettings({
                        ...settings,
                        kabidSignatory: {
                          ...(settings.kabidSignatory || { fullName: '', nip: '', officialTitle: '' }),
                          pangkatGolongan: e.target.value
                        }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      {PANGKAT_GOLONGAN_OPTIONS.map((p, idx) => (
                        <option key={idx} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      NIP Kabid
                    </label>
                    <input
                      type="text"
                      value={settings.kabidSignatory?.nip || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        kabidSignatory: {
                          ...(settings.kabidSignatory || { fullName: '', pangkatGolongan: 'Pembina (IV/a)', officialTitle: '' }),
                          nip: e.target.value
                        }
                      })}
                      placeholder="Contoh: 19780412 200502 1 003"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jabatan Kabid
                  </label>
                  <input
                    type="text"
                    value={settings.kabidSignatory?.officialTitle || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      kabidSignatory: {
                        ...(settings.kabidSignatory || { fullName: '', pangkatGolongan: 'Pembina (IV/a)', nip: '' }),
                        officialTitle: e.target.value
                      }
                    })}
                    placeholder="Contoh: Kepala Bidang Tata Ruang & Geospasial"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Specimen Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Sparkles size={16} />
                  <span>SIMULASI LIVE SPECIMEN DOKUMEN</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  TTE BSrE Active
                </span>
              </div>

              {/* Specimen Box */}
              <div className="bg-white text-slate-900 p-5 rounded-xl shadow-inner font-serif text-[11px] space-y-4 border border-slate-200">
                {settings.opd.kopSuratUrl ? (
                  <div className="text-center pb-2 border-b-2 border-slate-900">
                    <img 
                      src={settings.opd.kopSuratUrl} 
                      alt={`Kop Surat ${settings.opd.officialName}`} 
                      className="w-full max-h-20 object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <div className="text-center pb-2 border-b-2 border-slate-900">
                    <p className="font-sans font-bold text-[9px] uppercase tracking-wider text-slate-600">PEMERINTAH KABUPATEN LUWU</p>
                    <p className="font-sans font-black text-[11px] uppercase text-slate-950">{settings.opd.officialName}</p>
                    <p className="font-sans text-[8px] text-slate-500 italic mt-0.5">{settings.opd.address}</p>
                  </div>
                )}

                <div className="text-center font-bold underline font-sans text-xs">
                  BERITA ACARA PERTIMBANGAN TEKNIS
                </div>

                <div className="space-y-1 text-[10px] font-sans">
                  <p><span className="font-semibold text-slate-600">Nomor Dokumen:</span> <code className="font-mono font-bold text-slate-900">{settings.opd.skFormat.replace('{year}', '2026').replace('{seq}', '089')}</code></p>
                  <p><span className="font-semibold text-slate-600">Status Validasi:</span> <span className="text-emerald-700 font-bold">Lolos Uji Spasial (Approved)</span></p>
                </div>

                {/* Signatory Grid */}
                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-center text-[9px] font-sans">
                  <div>
                    <p className="text-slate-500">Penandatangan Teknis,</p>
                    <p className="font-bold text-slate-900 truncate">{settings.kabidSignatory?.officialTitle || 'Kepala Bidang'}</p>
                    <div className="my-2 p-1.5 bg-indigo-50 border border-indigo-200 rounded text-[8px] text-indigo-700 font-mono">
                      [ TTE BSrE Verified ]
                    </div>
                    <p className="font-bold underline text-slate-950 truncate">{settings.kabidSignatory?.fullName || 'IR. H. IRWANTO, S.T., M.T.'}</p>
                    <p className="text-[8px] text-slate-500 font-mono">NIP. {settings.kabidSignatory?.nip || '19780412 200502 1 003'}</p>
                  </div>

                  <div>
                    <p className="text-slate-500">Mengetahui &amp; Menyetujui,</p>
                    <p className="font-bold text-slate-900 truncate">{settings.opd.shortName}</p>
                    <div className="my-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded text-[8px] text-emerald-700 font-mono flex items-center justify-center gap-1">
                      <QrCode size={12} className="shrink-0" />
                      <span>[ Specimen TTD Sah ]</span>
                    </div>
                    <p className="font-bold underline text-slate-950 truncate">{settings.kepalaDinas.fullName || 'NAMA KEPALA DINAS'}</p>
                    <p className="text-[8px] text-slate-600 font-semibold">{settings.kepalaDinas.pangkatGolongan}</p>
                    <p className="text-[8px] text-slate-500 font-mono">NIP. {settings.kepalaDinas.nip || '19710815 199803 1 007'}</p>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 size={13} /> Integrasi Lintas OPD Aktif
                </p>
                <p className="text-slate-400 leading-normal">
                  Perubahan data Kepala Dinas di atas akan langsung tercermin secara instan di lembar cetak dokumen Berita Acara PUPTR, BAP Pertanian LP2B, dan SK Izin PKKPR DPMPTSP.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: PROFIL ADMIN & VERIFIKATOR OPERATOR
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'admin' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profil Petugas Admin / Operator Verifikator</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Identitas petugas operator yang berwenang melakukan entri dan validasi berkas.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap Admin / Operator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.admin.fullName}
                  onChange={(e) => setSettings({
                    ...settings,
                    admin: { ...settings.admin, fullName: e.target.value }
                  })}
                  placeholder="Contoh: Ahmad Fauzi, S.T."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    NIP Admin / Pegawai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.admin.nip}
                    onChange={(e) => setSettings({
                      ...settings,
                      admin: { ...settings.admin, nip: e.target.value }
                    })}
                    placeholder="Contoh: 19850612 201001 1 012"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jabatan Operasional (Pilihan Dropdown) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={settings.admin.position}
                    onChange={(e) => setSettings({
                      ...settings,
                      admin: { ...settings.admin, position: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    {jabatanList.map((j, idx) => (
                      <option key={idx} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Resmi Admin
                  </label>
                  <input
                    type="email"
                    value={settings.admin.email || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      admin: { ...settings.admin, email: e.target.value }
                    })}
                    placeholder="email@luwukab.go.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor WhatsApp / Telp
                  </label>
                  <input
                    type="text"
                    value={settings.admin.phone || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      admin: { ...settings.admin, phone: e.target.value }
                    })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3: ATRIBUT KELEMBAGAAN OPD, KOP SURAT & PENOMORAN
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="max-w-4xl space-y-6">
          {/* UPLOAD KOP SURAT DINAS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Kop Surat Dinas Resmi</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Unggah foto/gambar Kop Surat instansi dalam format JPG/PNG untuk dicetak di bagian atas Berita Acara Pertimbangan Teknis A4.</p>
                </div>
              </div>

              {settings.opd.kopSuratUrl && (
                <button
                  type="button"
                  onClick={handleRemoveKopSurat}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Hapus Kop Surat</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {settings.opd.kopSuratUrl ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Kop Surat Terpasang
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Siap Cetak pada Kertas A4</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200 flex justify-center items-center overflow-hidden">
                    <img 
                      src={settings.opd.kopSuratUrl} 
                      alt="Preview Kop Surat Dinas" 
                      className="max-h-28 w-auto object-contain mx-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative group border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-950/50 transition-all">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleKopSuratUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-3 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold">
                      <FileUp size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Klik atau seret file gambar Kop Surat Dinas ke sini
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Format yang didukung: <span className="font-mono font-bold text-emerald-600">JPG, JPEG, PNG</span> (Maksimal 5 MB)
                      </p>
                    </div>
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow-sm">
                      Pilih Gambar Kop Surat
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Atribut Kelembagaan &amp; Kontak Dinas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Identitas fisik kantor, alamat, dan format penomoran naskah dinas resmi.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Resmi Instansi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.opd.officialName}
                    onChange={(e) => setSettings({
                      ...settings,
                      opd: { ...settings.opd, officialName: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomenklatur Singkat OPD <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.opd.shortName}
                    onChange={(e) => setSettings({
                      ...settings,
                      opd: { ...settings.opd, shortName: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alamat Kantor &amp; Sekretariat Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={settings.opd.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    opd: { ...settings.opd, address: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Telepon Hotline / Call Center
                  </label>
                  <input
                    type="text"
                    value={settings.opd.phone}
                    onChange={(e) => setSettings({
                      ...settings,
                      opd: { ...settings.opd, phone: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Resmi Dinas
                  </label>
                  <input
                    type="email"
                    value={settings.opd.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      opd: { ...settings.opd, email: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Portal Web Resmi
                  </label>
                  <input
                    type="text"
                    value={settings.opd.website}
                    onChange={(e) => setSettings({
                      ...settings,
                      opd: { ...settings.opd, website: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Format Penomoran Dokumen / Naskah Dinas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.opd.skFormat}
                  onChange={(e) => setSettings({
                    ...settings,
                    opd: { ...settings.opd, skFormat: e.target.value }
                  })}
                  placeholder="503/PERTEK-PUPTR/LUWU/{year}/{seq}"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Gunakan variabel <code className="font-bold text-emerald-600">{'{year}'}</code> untuk tahun dan <code className="font-bold text-emerald-600">{'{seq}'}</code> untuk nomor urut otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 4: PREVIEW DOKUMEN UKURAN KERTAS A4 (BERITA ACARA PERTIMBANGAN TEKNIS)
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Action Bar Print */}
          <div className="max-w-[210mm] mx-auto bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Printer size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Pratinjau Kertas A4 Berita Acara Pertimbangan Teknis</h4>
                <p className="text-[11px] text-slate-400">Layout presisi ukuran standar A4 (210mm x 297mm) terintegrasi Kop Surat &amp; TTE BSrE.</p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <Printer size={16} />
              <span>Cetak / Export PDF A4</span>
            </button>
          </div>

          {/* Printable A4 Canvas Container */}
          <div className="overflow-x-auto pb-8">
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #a4-berita-acara-print, #a4-berita-acara-print * {
                  visibility: visible;
                }
                #a4-berita-acara-print {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 210mm !important;
                  min-height: 297mm !important;
                  margin: 0 !important;
                  padding: 15mm !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
              }
            `}</style>

            <div 
              id="a4-berita-acara-print"
              className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[15mm] sm:p-[20mm] shadow-2xl border border-slate-300 mx-auto font-serif text-[11pt] leading-relaxed relative rounded-sm"
            >
              {/* KOP SURAT DINAS (Uploaded Image or High-Def Text Kop) */}
              {settings.opd.kopSuratUrl ? (
                <div className="w-full text-center pb-3 border-b-4 border-double border-slate-950 mb-5">
                  <img 
                    src={settings.opd.kopSuratUrl} 
                    alt={`Kop Surat ${settings.opd.officialName}`} 
                    className="w-full max-h-[35mm] object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="text-center pb-3 border-b-4 border-double border-slate-950 mb-5 space-y-1">
                  <h3 className="font-sans font-bold text-[10pt] uppercase tracking-widest text-slate-700">PEMERINTAH KABUPATEN LUWU</h3>
                  <h1 className="font-sans font-black text-[14pt] uppercase text-slate-950 tracking-tight">{settings.opd.officialName}</h1>
                  <p className="font-sans text-[9pt] text-slate-600 italic">{settings.opd.address}</p>
                  <p className="font-sans text-[8pt] text-slate-500 font-mono">
                    Telp: {settings.opd.phone} | Email: {settings.opd.email} | Web: {settings.opd.website}
                  </p>
                </div>
              )}

              {/* JUDUL NASKAH BERITA ACARA */}
              <div className="text-center space-y-1 mb-6">
                <h2 className="font-sans text-[12pt] font-black uppercase underline decoration-2 underline-offset-4 tracking-wide text-slate-950">
                  BERITA ACARA PERTIMBANGAN TEKNIS KESESUAIAN TATA RUANG
                </h2>
                <p className="font-sans text-[10pt] font-mono font-bold text-slate-800">
                  Nomor: {settings.opd.skFormat.replace('{year}', '2026').replace('{seq}', '089/BA-PUPTR')}
                </p>
                <p className="font-sans text-[9pt] text-slate-600 italic">
                  Tentang Hasil Evaluasi Geospasial &amp; Auditing Pola Ruang RTRW Kabupaten Luwu
                </p>
              </div>

              {/* PARAGRAF PEMBUKA */}
              <div className="space-y-4 text-[10.5pt] text-justify text-slate-900">
                <p>
                  Pada hari ini, <span className="font-bold">Senin, tanggal Dua Puluh Satu bulan September tahun Dua Ribu Dua Puluh Enam</span> (21-09-2026), bertempat di Kantor {settings.opd.officialName}, Tim Teknis Penataan Ruang telah melaksanakan kajian teknis, audit spasial, dan verifikasi lapangan atas permohonan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) dari pemohon:
                </p>

                {/* TABEL IDENTITAS PEMOHON */}
                <table className="w-full border-collapse my-3 text-[10pt] font-sans">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 font-bold text-slate-700 w-2/5">1. Nomor Induk Berusaha (NIB)</td>
                      <td className="py-1.5 font-mono font-bold text-slate-900">: 9120401882312</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 font-bold text-slate-700">2. Nama Pemohon / Badan Usaha</td>
                      <td className="py-1.5 font-bold text-slate-900">: PT. LUWU AGRO PERDANA</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 font-bold text-slate-700">3. Sektor / Rencana Kegiatan</td>
                      <td className="py-1.5 text-slate-900">: Perkebunan &amp; Industri Pengolahan Komoditas Unggulan</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 font-bold text-slate-700">4. Lokasi Rencana Kegiatan</td>
                      <td className="py-1.5 text-slate-900">: Desa Bua, Kecamatan Bua, Kabupaten Luwu</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 font-bold text-slate-700">5. Luas Lahan Permohonan</td>
                      <td className="py-1.5 font-mono font-bold text-emerald-800">: 12.5 Hektar (Ha)</td>
                    </tr>
                  </tbody>
                </table>

                {/* HASIL KAJIAN TEKNIS */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-sans font-bold text-[10.5pt] uppercase text-slate-950">HASIL KAJIAN &amp; KESIMPULAN TEKNIS:</h4>
                  <ol className="list-decimal list-inside space-y-1.5 pl-2 text-[10pt] text-slate-800">
                    <li>
                      Lahan yang dimohonkan secara spasial berada pada <strong>Kawasan Peruntukan Industri / Perkebunan</strong> berdasarkan Perda RTRW Kabupaten Luwu.
                    </li>
                    <li>
                      <strong>Status LP2B:</strong> Berada di luar Zona Lahan Pertanian Pangan Berkelanjutan (Non-LP2B).
                    </li>
                    <li>
                      <strong>Ketentuan Tata Bangunan:</strong> Koefisien Dasar Bangunan (KDB) maksimal 60%, Koefisien Daerah Hijau (KDH) minimal 20%.
                    </li>
                  </ol>
                </div>

                <div className="p-3 bg-emerald-50/80 border-l-4 border-emerald-700 rounded-r-xl font-sans my-4">
                  <p className="font-extrabold text-emerald-950 text-[10pt] uppercase">
                    KESIMPULAN: MEMENUHI KESESUAIAN TATA RUANG (DISETUJUI)
                  </p>
                  <p className="text-[9pt] text-slate-700 mt-0.5">
                    Rekomendasi teknis diterbitkan untuk proses penerbitan Dokumen SK PKKPR oleh DPMPTSP Kabupaten Luwu.
                  </p>
                </div>
              </div>

              {/* BLOK TANDA TANGAN RESMI A4 */}
              <div className="grid grid-cols-2 gap-8 pt-8 mt-6 font-sans text-[10pt] text-center border-t border-slate-300">
                <div>
                  <p className="text-slate-600">Diverifikasi Oleh Pejabat Teknis,</p>
                  <p className="font-bold text-slate-900 uppercase">{settings.kabidSignatory?.officialTitle || 'Kepala Bidang'}</p>
                  <div className="my-3 h-20 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-center font-mono text-[9pt] text-indigo-700 font-bold">
                    [ Terverifikasi BSrE ]
                  </div>
                  <p className="font-bold underline text-slate-950">{settings.kabidSignatory?.fullName || 'IR. H. IRWANTO, S.T., M.T.'}</p>
                  <p className="text-[9pt] text-slate-700 font-medium">{settings.kabidSignatory?.pangkatGolongan || 'Pembina (IV/a)'}</p>
                  <p className="text-[9pt] text-slate-500 font-mono">NIP. {settings.kabidSignatory?.nip || '19780412 200502 1 003'}</p>
                </div>

                <div>
                  <p className="text-slate-600">Belopa, 21 September 2026</p>
                  <p className="font-bold text-slate-900 uppercase">Menyetujui &amp; Menandatangani,</p>
                  <p className="font-extrabold text-slate-950 uppercase">{settings.kepalaDinas.officialTitle}</p>
                  <div className="my-3 h-20 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-center font-mono text-[9pt] text-emerald-700 font-bold gap-2">
                    <QrCode size={18} />
                    <span>[ TTE BSrE KEPALA DINAS SAH ]</span>
                  </div>
                  <p className="font-bold underline text-slate-950 text-[10.5pt]">{settings.kepalaDinas.fullName || 'IR. IKHSAN AS\'AD, S.T., M.Si.'}</p>
                  <p className="text-[9pt] text-slate-700 font-bold">{settings.kepalaDinas.pangkatGolongan}</p>
                  <p className="text-[9pt] text-slate-500 font-mono">NIP. {settings.kepalaDinas.nip || '19710815 199803 1 007'}</p>
                </div>
              </div>

              {/* FOOTER TEMBUSAN */}
              <div className="pt-6 mt-6 border-t border-slate-200 font-sans text-[8.5pt] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 uppercase">Tembusan Kepada Yth:</p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  <li>Bupati Luwu di Belopa (sebagai laporan)</li>
                  <li>Kepala DPMPTSP Kabupaten Luwu</li>
                  <li>Kepala Kantor Pertanahan / BPN Kabupaten Luwu</li>
                  <li>Pertinggal / Arsip Dokumen Pertek</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpdSettingsView;
