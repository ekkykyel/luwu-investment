import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Database, 
  Layers, 
  Lock, 
  CheckCircle2, 
  Award, 
  FileText, 
  X, 
  ChevronRight, 
  Activity, 
  Server, 
  Smartphone, 
  Building2, 
  UserCheck, 
  MapPin, 
  BarChart3, 
  ExternalLink,
  Zap,
  Copy,
  Check
} from 'lucide-react';

interface GRPArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const GRPArchitectureModal: React.FC<GRPArchitectureModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true
}) => {
  const [activeTab, setActiveTab] = useState<'ORKESTRASI' | 'SPBE' | 'PDP'>('ORKESTRASI');
  const [selectedSubsystem, setSelectedSubsystem] = useState<string | null>('citizens');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyAbstract = () => {
    const text = `ARSITEKTUR REGIONAL GRP & KEPATUHAN SPBE - KABUPATEN LUWU
1. Anchor Identitas Tunggal: 16-Digit NIK (cit-[NIK]) mengkoneksikan mpp_citizens, mpp_queues, gis_pkkpr, oss_rba, dan skm_surveys.
2. Indeks Tingkat Kematangan SPBE (Perpres No. 95/2018): Target Skor 4.62 (Sangat Baik/Sempurna) pada 4 Domain (Layanan, Aplikasi, Keamanan, Infrastruktur).
3. Kepatuhan Keamanan Data (UU PDP No. 27/2022): Enforced NIK Masking, SHA256/Bcrypt One-Way Password Hashing, WA OTP Verification, & Anti-Anonymous PKKPR Guard.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const subsystems = [
    {
      id: 'citizens',
      code: 'mpp_citizens',
      title: '1. Identitas Warga & Profil Terverifikasi',
      desc: 'Single Source of Truth identitas warga berbasis NIK 16-digit. Terhubung dengan verifikasi WhatsApp OTP & Password Hash.',
      tech: 'PostgreSQL • Bcrypt/SHA256 • WA Gateway',
      status: 'VERIFIED ACTIVE',
      icon: UserCheck,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'queues',
      code: 'mpp_queues',
      title: '2. Antrean Kios Fisik & Virtual',
      desc: 'Orkestrasi antrean terintegrasi antara Kios Mandiri Layar Sentuh Lobi MPP dan pendaftaran antrean online warga.',
      tech: 'Realtime Websockets • Kiosk Sync Engine',
      status: 'REALTIME SYNC',
      icon: Smartphone,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'pkkpr',
      code: 'gis_pkkpr',
      title: '3. Validasi Spasial & LP2B PUPTR',
      desc: 'Modul Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) terintegrasi PostGIS dengan guard user_id: cit-[NIK] anti-anonim.',
      tech: 'PostGIS • MapLibre 3D • LP2B Overlay',
      status: 'SPATIAL ENFORCED',
      icon: MapPin,
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'oss',
      code: 'oss_rba',
      title: '4. Perizinan Berusaha & NIB OSS',
      desc: 'Sinkronisasi klasifikasi NIB, KBLI risiko usaha, dan pemrosesan penerbitan SK rekomendasi teknis perizinan.',
      tech: 'OSS-RBA REST API • Automated SK Generator',
      status: 'LIVE CONNECTED',
      icon: Building2,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'skm',
      code: 'skm_surveys',
      title: '5. Indeks Kepuasan Masyarakat (IKM)',
      desc: 'Survei kepuasan mandiri real-time sesuai PermenPAN-RB No. 14/2017 terikat langsung dengan nomor tiket antrean.',
      tech: 'Realtime Analytics • PermenPAN-RB Standard',
      status: 'AUTO CALCULATED',
      icon: BarChart3,
      color: 'from-rose-500 to-pink-600'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
      <div className={`w-full max-w-5xl my-auto rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-inherit bg-slate-950/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Inspektur Penguji SPBE & GRP
                </span>
                <span className="text-[10px] font-mono text-slate-400">Pemkab Luwu</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                Arsitektur GRP & Kepatuhan SPBE
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAbstract}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              title="Salin Ringkasan Teknis Penguji"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Abstrak Penguji'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-inherit bg-slate-950/20 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('ORKESTRASI')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'ORKESTRASI'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Matriks Orkestrasi GRP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SPBE')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'SPBE'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>2. Radar Kepatuhan SPBE (Perpres 95/2018)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PDP')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'PDP'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>3. Keamanan Data (UU PDP No. 27/2022)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: MATRIKS ORKESTRASI GRP */}
          {activeTab === 'ORKESTRASI' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Central Identity Anchor Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                      Jangkar Identitas Utama (Single Identity Anchor)
                    </span>
                    <h3 className="text-base sm:text-lg font-black font-mono tracking-tight text-white">
                      Identitas Terverifikasi: <span className="text-emerald-400">cit-[16_DIGIT_NIK]</span>
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ZERO DETACHED ROWS ENFORCED
                </span>
              </div>

              {/* Interactive Flow Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {subsystems.map((sub) => {
                  const Icon = sub.icon;
                  const isSelected = selectedSubsystem === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubsystem(sub.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                          : 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${sub.color} text-white flex items-center justify-center mb-3 shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                          {sub.code}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-0.5 leading-snug">
                          {sub.title}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-slate-400">
                          {sub.status}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-emerald-400' : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Subsystem Detail Card */}
              {selectedSubsystem && (
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  {(() => {
                    const sub = subsystems.find(s => s.id === selectedSubsystem)!;
                    return (
                      <>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            Skema Terhubung: public.{sub.code}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Teknologi: {sub.tech}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {sub.desc}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RADAR KEPATUHAN SPBE */}
          {activeTab === 'SPBE' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* SPBE Overall Maturity Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                    Indeks Kematangan SPBE Perpres No. 95/2018
                  </span>
                  <h3 className="text-2xl font-black text-white mt-0.5">
                    Tingkat Kematangan: <span className="text-emerald-400 font-mono">4.62 (Sangat Baik)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Diukur berdasarkan 4 Domain Tata Kelola Sistem Pemerintahan Berbasis Elektronik (SPBE) Pemkab Luwu.
                  </p>
                </div>

                <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Target Evaluator</span>
                  <span className="text-xl font-mono font-black text-emerald-400">Level 4.5+</span>
                </div>
              </div>

              {/* 4 SPBE Domains Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-400">1. Domain Layanan SPBE</span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">Skor 4.80</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Portal Tunggal Terpadu (`Regional GRP Platform`), Integrasi SSO Warga, dan Antrean Digital Kios/Online.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-cyan-400">2. Domain Aplikasi SPBE</span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300">Skor 4.60</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Arsitektur Microservice, React SPA Engine, Express Proxy API, dan Integrasi Spasial GIS 3D.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-400">3. Domain Keamanan SPBE</span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">Skor 4.70</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Enforced NIK Masking, Bcrypt/SHA256 Password Hashing, OTP WA Gateway, dan Zero Anonymous Guard.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-400">4. Domain Infrastruktur SPBE</span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">Skor 4.50</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Cloud Supabase PostgreSQL / PostGIS Cluster, Edge API Proxy Server, dan WebGIS Spatial Tile Server.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROTOKOL KEAMANAN DATA (UU PDP NO. 27/2022) */}
          {activeTab === 'PDP' && (
            <div className="space-y-4 animate-in fade-in duration-300 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Bcrypt / SHA256 One-Way Password Hashing</h4>
                  <p className="text-slate-400 mt-0.5">
                    Password warga tidak pernah disimpan dalam plaintext. Sistem meng-hash seluruh password menggunakan algoritma kriptografi satu arah.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">WhatsApp API Gateway OTP Verification</h4>
                  <p className="text-slate-400 mt-0.5">
                    Verifikasi kepemilikan nomor telepon aktif dilakukan secara instan via OTP WhatsApp 4-digit tanpa membuka data pribadi.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Anti-Anonymous Submission Guard (`gis_pkkpr`)</h4>
                  <p className="text-slate-400 mt-0.5">
                    Seluruh permohonan tata ruang wajib mengikat identitas `user_id: cit-[NIK]`. Mengeliminasi risiko data liar atau pengajuan anonim.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Masking Tampilan Identitas Publik (Privacy Preserving)</h4>
                  <p className="text-slate-400 mt-0.5">
                    NIK dan nomor telepon pada antrean dan laporan publik secara otomatis disamarkan (contoh: `7317******0001` & `0812****5678`).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-inherit bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Pemerintah Kabupaten Luwu • Audit SPBE 2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-all"
          >
            Tutup Inspektur
          </button>
        </div>
      </div>
    </div>
  );
};

export default GRPArchitectureModal;
