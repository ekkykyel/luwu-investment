import { requestSmartFullscreen } from "../../utils/fullscreen.js";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, User, Building2, Mail, FileText, Lock, CheckCircle2, ChevronRight, AlertCircle, Phone, MapPin, Upload, ArrowLeft, Maximize2, Minimize2, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient.js';
import { isMobileOrAndroidDevice } from '../../hooks/useDeviceAutomation.js';

const daftarNegara = [
  "Indonesia", "Amerika Serikat", "Inggris Raya", "Jepang", "China", "Singapura", "Malaysia", "Korea Selatan", 
  "Australia", "Belanda", "Jerman", "Prancis", "Uni Emirat Arab", "Arab Saudi", "Taiwan", "Hong Kong",
  "Afghanistan", "Afrika Selatan", "Albania", "Aljazair", "Andorra", "Angola", "Antigua dan Barbuda", "Argentina", "Armenia", "Austria", "Azerbaijan",
  "Bahama", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgia", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia dan Herzegovina", "Botswana", "Brasil", "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi",
  "Ceko", "Chad", "Chili", "Denmark", "Djibouti", "Dominika", "Ekuador", "El Salvador", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Filipina", "Finlandia", "Gabon", "Gambia", "Georgia", "Ghana", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guinea Khatulistiwa", "Guyana",
  "Haiti", "Honduras", "Hungaria", "India", "Irak", "Iran", "Irlandia", "Islandia", "Israel", "Italia",
  "Jamaika", "Kamboja", "Kamerun", "Kanada", "Kazakhstan", "Kenya", "Kepulauan Marshall", "Kepulauan Solomon", "Kirgizstan", "Kiribati", "Kolombia", "Komoro", "Republik Kongo", "Kosta Rika", "Kroasia", "Kuba", "Kuwait",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lituania", "Luksemburg",
  "Madagaskar", "Makedonia Utara", "Maladewa", "Malawi", "Mali", "Malta", "Maroko", "Mauritania", "Mauritius", "Meksiko", "Mesir", "Mikronesia", "Moldova", "Monako", "Mongolia", "Montenegro", "Mozambik", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Niger", "Nigeria", "Nikaragua", "Norwegia", "Oman",
  "Pakistan", "Palau", "Panama", "Pantai Gading", "Papua Nugini", "Paraguay", "Peru", "Polandia", "Portugal", "Qatar",
  "Republik Afrika Tengah", "Republik Demokratik Kongo", "Republik Dominika", "Rumania", "Rusia", "Rwanda",
  "Saint Kitts dan Nevis", "Saint Lucia", "Saint Vincent dan Grenadines", "Samoa", "San Marino", "Sao Tome dan Principe", "Selandia Baru", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Siprus", "Slovakia", "Slovenia", "Somalia", "Spanyol", "Sri Lanka", "Sudan", "Sudan Selatan", "Suriah", "Suriname", "Swedia", "Swiss",
  "Tajikistan", "Tanjung Verde", "Tanzania", "Thailand", "Timor Leste", "Togo", "Tonga", "Trinidad dan Tobago", "Tunisia", "Turki", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraina", "Uruguay", "Uzbekistan", "Vanuatu", "Vatikan", "Venezuela", "Vietnam", "Yaman", "Yordania", "Yunani", "Zambia", "Zimbabwe"
];

const dataWilayahLuwu: Record<string, string[]> = {
  "Bajo": ["Bajo", "Balla", "Bosse", "Rumaju", "Sampa", "Sampeang", "Tallang Bulawang"],
  "Bajo Barat": ["Bonelemo", "Bonelemo Barat", "Bonelemo Utara", "Kadong-Kadong", "Marinding", "Sampeang", "Saronda"],
  "Belopa": ["Belopa", "Balo-Balo", "Sabe", "Tampumia Radda", "Kurrusumange", "Lamunre", "Lamunre Tengah", "Pasar Baru"],
  "Belopa Utara": ["Senga", "Senga Selatan", "Pammanu", "Paccerakkang", "Lebani", "Lamumpatu", "Lauwa"],
  "Bua": ["Bua", "Bukulompong", "Karang-Karangan", "Lare-Lare", "Pabbarasseng", "Padang Kalua", "Pammesakang", "Puti", "Tanarigella", "Tiromanda"],
  "Bua Ponrang": ["Noling", "Balai Dongi", "Buntu Batu", "Malela", "Padang Tuju", "Tampo", "Tampumia"],
  "Kamanre": ["Kamanre", "Bunga Eza", "Cilallang", "Libukang", "Salupikku", "Tabbaja", "Wara"],
  "Lamasi": ["Lamasi", "Awo Gading", "Pongsamelung", "Salujambu", "Se'pon", "Setiarejo", "To'pongo"],
  "Lamasi Timur": ["Bulolondong", "Pelalan", "Pompengan", "Pompengan Pantai", "Pompengan Tengah", "Pompengan Utara", "To'lemo"],
  "Larompong": ["Larompong", "Binturu", "Buntu Matabing", "Buntu Pasik", "Komba", "Komba Selatan", "Rante Belu"],
  "Larompong Selatan": ["Bonepute", "Babang", "Batasu", "Dadeko", "Gandang Batu", "La'loa", "Maleku", "Sampano", "Temboe"],
  "Latimojong": ["Buntu Sarek", "Boneposi", "Kadundung", "Lambanan", "Pajang", "Tabang", "Tibussan", "Tolajuk"],
  "Ponrang": ["Padang Sappa", "Buntu Nanna", "Muladimeng", "Parekaju", "Tirowali", "Tumale"],
  "Ponrang Selatan": ["Pattedong", "Bakti", "Bassiang", "Bassiang Timur", "Buntu Kamiri", "Jala", "Lampuara", "Olang", "Paccerakkang", "Pattedong Selatan", "Tarramatekkeng", "To'balo"],
  "Suli": ["Suli", "Buntu Kunyi", "Cakkeawo", "Kempang", "Lempopacci", "Malela", "Murante", "Padang Lambe"],
  "Suli Barat": ["Lindajang", "Buntu Barana", "Kalisusu", "Muhajirin", "Poringan", "Salubua"],
  "Walenrang": ["Batusitanduk", "Barammamase", "Buntu Kurnia", "Harapan", "Kalibamamase", "Lalong", "Saragi", "Tombang"],
  "Walenrang Barat": ["Ilan Batu", "Ilan Batu Uru", "Lempe", "Lempe Pasang", "Lewandi"],
  "Walenrang Timur": ["Kendekan", "Pangalli", "Rante Damai", "Seba-Seba", "Sukamaju", "Tabah"],
  "Walenrang Utara": ["Bosso", "Bolong", "Buntu Awo", "Lumpang", "Marabuana", "Pongko", "Salulino", "Siteba"]
};

export default function InvestorRegistrationForm() {
  const { t } = useTranslation();
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-fullscreen on first interaction when registration page opens (Mobile/Android ONLY)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleFirstInteraction = () => {
      if (!isMobileOrAndroidDevice()) return; // Desktop/Laptop exception

      if (!document.fullscreenElement) {
        const elem = document.documentElement as any;
        requestSmartFullscreen();
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState<'investor' | 'masyarakat'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'masyarakat') return 'masyarakat';
    } catch (e) {}
    return 'investor';
  });

  // Form states
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [negara, setNegara] = useState('Indonesia');
  const [email, setEmail] = useState('');
  const [nib, setNib] = useState('');
  const [nik, setNik] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  
  // KTP Specific States
  const [kecamatan, setKecamatan] = useState('');
  const [desa, setDesa] = useState('');
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string>('');
  const [dbDistricts, setDbDistricts] = useState<any[]>([]);
  const [dbVillages, setDbVillages] = useState<any[]>([]);

  useEffect(() => {
    async function fetchWilayah() {
      try {
        const [distRes, vilRes] = await Promise.all([
          fetch('/api/districts'),
          fetch('/api/villages')
        ]);
        if (distRes.ok) {
          const dData = await distRes.json();
          if (Array.isArray(dData) && dData.length > 0) setDbDistricts(dData);
        }
        if (vilRes.ok) {
          const vData = await vilRes.json();
          if (Array.isArray(vData) && vData.length > 0) setDbVillages(vData);
        }
      } catch (e) {
        // Fallback to static master dataset
      }
    }
    fetchWilayah();
  }, []);

  const selectedDistrictObj = useMemo(() => {
    if (!kecamatan) return null;
    return dbDistricts.find(d => d.name === kecamatan || d.id === kecamatan) || null;
  }, [kecamatan, dbDistricts]);

  const availableDesaOptions = useMemo(() => {
    if (!kecamatan) return [];
    
    if (selectedDistrictObj && dbVillages.length > 0) {
      const filtered = dbVillages.filter(v => 
        v.districtId === selectedDistrictObj.id || 
        v.district_id === selectedDistrictObj.id ||
        v.districtName === selectedDistrictObj.name
      );
      if (filtered.length > 0) {
        return filtered.map(v => v.name || v.nama_desa);
      }
    }

    const key = selectedDistrictObj ? selectedDistrictObj.name : kecamatan;
    return dataWilayahLuwu[key] || dataWilayahLuwu[kecamatan] || [];
  }, [kecamatan, selectedDistrictObj, dbVillages]);
  
  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const statusModal = negara === 'Indonesia' ? 'PMDN' : 'PMA';

  const handleKtpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setKtpFile(file);
      const objectUrl = URL.createObjectURL(file);
      setKtpPreview(objectUrl);
    }
  };

  const handleValidateNib = (val: string) => {
    // Only allow numbers
    const cleanVal = val.replace(/\D/g, '');
    setNib(cleanVal);
    if (cleanVal.length > 0 && cleanVal.length < 13) {
      setError(t('nibVerification.errorNibLength', 'NIB must be exactly 13 digits.'));
    } else {
      setError('');
    }
  };

  const handleValidateNik = (val: string) => {
    // Only allow numbers
    const cleanVal = val.replace(/\D/g, '');
    setNik(cleanVal);
    if (cleanVal.length > 0 && cleanVal.length !== 16) {
      setError(t('register.errorNikLength', 'NIK harus tepat 16 digit sesuai KTP.'));
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations based on tab
    if (activeTab === 'investor') {
      if (nib.length < 13) {
        setError(t('nibVerification.errorNibLength', 'NIB must be exactly 13 digits.'));
        return;
      }
    } else {
      if (!ktpFile) {
        setError('Harap unggah foto KTP Anda untuk keperluan verifikasi.');
        return;
      }
      if (nik.length !== 16) {
        setError(t('register.errorNikLength', 'NIK harus tepat 16 digit sesuai KTP.'));
        return;
      }
      if (!whatsapp.trim()) {
        setError(t('register.errorWhatsapp', 'Nomor WhatsApp wajib diisi.'));
        return;
      }
      if (!kecamatan || !desa) {
        setError('Kecamatan dan Desa/Kelurahan wajib diisi.');
        return;
      }
    }
    
    if (password.length < 6) {
      setError(t('register.errorPassword', 'Password minimal 6 karakter'));
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    try {
      const metaData: any = {
        full_name: fullName,
        role: activeTab,
      };

      if (activeTab === 'investor') {
        metaData.company_name = companyName;
        metaData.nib = nib;
        metaData.negara_asal = negara;
        metaData.status_modal = statusModal;
      } else {
        let ktpUrl = '';
        if (ktpFile) {
          // Compress KTP image instantly in-memory (<20ms) without blocking network storage calls
          ktpUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const maxDim = 800;
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL('image/jpeg', 0.65));
                } else {
                  resolve((e.target?.result as string) || '');
                }
              };
              img.onerror = () => resolve((e.target?.result as string) || '');
              img.src = e.target?.result as string;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(ktpFile);
          });
        }

        metaData.nik = nik;
        metaData.no_whatsapp = whatsapp;
        metaData.kecamatan = kecamatan;
        metaData.desa = desa;
        metaData.ktp_url = ktpUrl;
      }

      const finalEmail = activeTab === 'masyarakat'
        ? `${nik.trim()}@warga.luwukab.go.id`
        : email.trim();

      const { data, error } = await supabase.auth.signUp({
        email: finalEmail,
        password: password,
        options: {
          data: metaData
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=None; Secure`;
        localStorage.setItem("luwu_session_token", data.session.access_token);
      }
      
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || t('register.errorDefault', 'Gagal melakukan registrasi, periksa kembali koneksi Anda.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div id="investor-registration-page" className="min-h-screen bg-slate-950 flex flex-col justify-center py-6 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambience Accent */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header Controls: Back to Landing Page & Fullscreen Toggle */}
      <div className="w-full max-w-md mx-auto px-4 mb-4 flex items-center justify-between relative z-20">
        
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-3.5 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/5"
            id="secure-shield-icon-container"
          >
            <ShieldCheck size={36} id="shield-icon" />
          </motion.div>
        </div>
        <h2 id="registration-title" className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {activeTab === 'investor' 
            ? t('register.title', 'Investor Account Registration')
            : t('register.titleMasyarakat', 'Registrasi Akun Masyarakat (Lapor!)')
          }
        </h2>
        <p id="registration-subtitle" className="text-center text-sm text-slate-400 max-w-xs sm:max-w-sm mx-auto px-4">
          {activeTab === 'investor'
            ? t('register.subtitle', 'Join the MPP Simpurusiang digital ecosystem to access private contact data and investment documents.')
            : t('register.subtitleMasyarakat', 'Registrasi akun publik untuk menyampaikan aduan tata ruang, lingkungan, dan perizinan Kabupaten Luwu.')
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-slate-900/80 border border-slate-800/80 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 backdrop-blur-md"
          id="registration-card"
        >
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('investor');
                setError('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'investor'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-400'
              }`}
            >
              {t('register.tabInvestor', 'Investor / Mitra')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('masyarakat');
                setError('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'masyarakat'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-400'
              }`}
            >
              {t('register.tabMasyarakat', 'Masyarakat Publik')}
            </button>
          </div>

          {isSuccess ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6"
              id="success-state-container"
            >
              <div className="flex justify-center mb-4">
                <CheckCircle2 size={56} className="text-emerald-400 animate-bounce" id="success-check-icon" />
              </div>
              <h3 id="success-title" className="text-xl font-bold text-white mb-2">
                {t('register.successTitle', 'Registrasi Berhasil!')}
              </h3>
              <p id="success-desc" className="text-sm text-slate-400 mb-6">
                {activeTab === 'investor'
                  ? t('register.successDescInvestor', 'Akun investor Anda telah aktif. Masuk ke portal untuk melanjutkan.')
                  : t('register.successDescMasyarakat', 'Akun masyarakat Anda telah aktif. Laporkan aduan resmi sekarang.')
                }
              </p>
              <button
                id="btn-go-to-portal"
                onClick={() => {
                  navigate('/dashboard');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <span>{t('register.btnGoDashboard', 'Masuk Dashboard')}</span>
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ) : (
            <form id="investor-registration-form" className="space-y-5" onSubmit={handleSubmit}>
              
              {/* KTP Upload for Masyarakat */}
              {activeTab === 'masyarakat' && (
                <div className="mb-4 animate-fade-in-up">
                   <label className="block text-sm font-medium text-slate-300 mb-2">
                     Unggah Foto KTP Asli
                   </label>
                   <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-5 text-center hover:border-emerald-500/50 transition-colors">
                     {ktpPreview || ktpFile ? (
                       <div className="flex flex-col items-center">
                          <div className="w-full max-h-36 bg-slate-950/80 rounded-lg flex items-center justify-center overflow-hidden mb-3 border border-slate-800 p-1">
                            <img src={ktpPreview || (ktpFile ? URL.createObjectURL(ktpFile) : '')} alt="KTP Preview" className="max-h-32 object-contain rounded-md" />
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setKtpFile(null);
                              setKtpPreview('');
                            }}
                            className="text-xs text-rose-500 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                          >
                            Hapus & Ganti KTP
                          </button>
                       </div>
                     ) : (
                       <>
                         <div className="flex justify-center gap-4 mb-3">
                           {/* OPTION 1: LIVE CAMERA */}
                           <label className="flex flex-col items-center justify-center w-28 h-24 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all group p-2">
                             <Camera className="w-6 h-6 text-emerald-500 mb-1.5 group-hover:scale-110 transition-transform" />
                             <span className="text-[10px] font-bold text-slate-300">Buka Kamera</span>
                             <span className="text-[9px] text-slate-500">Foto Langsung</span>
                             <input 
                               type="file" 
                               accept="image/*" 
                               capture="environment" 
                               className="hidden" 
                               onChange={handleKtpFileChange}
                             />
                           </label>

                           {/* OPTION 2: GALLERY */}
                           <label className="flex flex-col items-center justify-center w-28 h-24 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all group p-2">
                             <ImageIcon className="w-6 h-6 text-blue-500 mb-1.5 group-hover:scale-110 transition-transform" />
                             <span className="text-[10px] font-bold text-slate-300">Pilih Galeri</span>
                             <span className="text-[9px] text-slate-500">Pilih File Foto</span>
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={handleKtpFileChange}
                             />
                           </label>
                         </div>
                         <p className="text-[10px] text-slate-500">PNG, JPG up to 5MB. Pastikan foto terang agar mudah dibaca sistem.</p>
                       </>
                     )}
                   </div>
                </div>
              )}

              {/* Show remaining form only if investor OR masyarakat */}
              {(activeTab === 'investor' || activeTab === 'masyarakat') && (
                <>
                  {/* Full Name */}
                  <div>
                    <label htmlFor="reg-full-name" className="block text-sm font-medium text-slate-300">
                      {activeTab === 'investor' ? t('register.fullName', 'Full Name') : t('register.fullNameMasyarakat', 'Nama Lengkap (Sesuai KTP)')}
                    </label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        id="reg-full-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm`}
                        placeholder="Nama Sesuai KTP"
                      />
                    </div>
                  </div>

                  {/* Company Name (only for investor) */}
                  {activeTab === 'investor' && (
                    <div>
                      <label htmlFor="reg-company-name" className="block text-sm font-medium text-slate-300">
                        {t('register.companyName', 'Company / Institution Name')}
                      </label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          id="reg-company-name"
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                          placeholder="PT. Luwu Maju Sejahtera"
                        />
                      </div>
                    </div>
                  )}

                  {/* Field Negara Asal */}
                  {activeTab === 'investor' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300">{t('investor_origin')}</label>
                      <select
                        value={negara}
                        onChange={(e) => setNegara(e.target.value)}
                        className="mt-1.5 block w-full py-2.5 px-3 border border-slate-800 rounded-xl bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                      >
                        {daftarNegara.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Field Status PMA/PMDN (Auto-filled & Disabled) */}
                  {activeTab === 'investor' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300">{t('pma_pmdn_status')}</label>
                      <input
                        type="text"
                        value={statusModal === 'PMDN' ? 'PMDN (Penanaman Modal Dalam Negeri)' : 'PMA (Penanaman Modal Asing)'}
                        disabled
                        className="mt-1.5 block w-full py-2.5 px-3 border border-slate-800 rounded-xl bg-slate-800/60 text-emerald-400 font-bold cursor-not-allowed opacity-90 sm:text-sm"
                      />
                    </div>
                  )}

                  {/* Email */}
                  {activeTab === 'investor' && (
                    <div>
                      <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300">
                        {t('register.email', 'Corporate Email')}
                      </label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                          placeholder="email@domain.com"
                        />
                      </div>
                    </div>
                  )}

                  {/* NIB (only for investor) */}
                  {activeTab === 'investor' && (
                    <div>
                      <label htmlFor="reg-nib" className="block text-sm font-medium text-slate-300">
                        {t('register.nib', 'Business Registration Number (NIB) / Corporate ID')}
                      </label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          id="reg-nib"
                          type="text"
                          required
                          maxLength={13}
                          value={nib}
                          onChange={(e) => handleValidateNib(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                          placeholder="1234567890123"
                        />
                      </div>
                      <p id="nib-help-text" className="mt-1 text-xs text-slate-500">
                        {t('nibVerification.nibHelpText', 'Enter the 13-digit NIB issued by the National OSS system.')}
                      </p>
                    </div>
                  )}

                  {/* NIK (only for masyarakat) */}
                  {activeTab === 'masyarakat' && (
                    <div>
                      <label htmlFor="reg-nik" className="block text-sm font-medium text-slate-300">
                        {t('register.nik', 'Nomor Induk Kependudukan (NIK)')}
                      </label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          id="reg-nik"
                          type="text"
                          required
                          maxLength={16}
                          value={nik}
                          onChange={(e) => handleValidateNik(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                          placeholder="7317xxxxxxxxxxxx"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Pastikan NIK terdiri dari 16 digit angka.
                      </p>
                    </div>
                  )}

                  {/* Kecamatan & Desa (only for masyarakat) */}
                  {activeTab === 'masyarakat' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="reg-kecamatan" className="block text-sm font-medium text-slate-300">
                          Kecamatan
                        </label>
                        <div className="mt-1.5 relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-slate-500" />
                          </div>
                          <select
                            id="reg-kecamatan"
                            required
                            value={kecamatan}
                            onChange={(e) => {
                              setKecamatan(e.target.value);
                              setDesa('');
                            }}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-xl bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                          >
                             <option value="" disabled>Pilih Kecamatan</option>
                             {Object.keys(dataWilayahLuwu).map((kec) => (
                               <option key={kec} value={kec}>{kec}</option>
                             ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="reg-desa" className="block text-sm font-medium text-slate-300">
                          Desa / Kelurahan
                        </label>
                        <div className="mt-1.5 relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-slate-500" />
                          </div>
                          <select
                            id="reg-desa"
                            required
                            disabled={!kecamatan}
                            value={desa}
                            onChange={(e) => setDesa(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-xl bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled>Pilih Desa/Kelurahan</option>
                            {availableDesaOptions.map((desaName: string) => (
                              <option key={desaName} value={desaName}>{desaName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp (only for masyarakat) */}
                  {activeTab === 'masyarakat' && (
                    <div>
                      <label htmlFor="reg-whatsapp" className="block text-sm font-medium text-slate-300">
                        {t('register.whatsapp', 'Nomor WhatsApp (Aktif)')}
                      </label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          id="reg-whatsapp"
                          type="text"
                          required
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                          placeholder="Contoh: 081234567xxx"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {t('register.whatsappHelp', 'Wajib diisi untuk konfirmasi dan koordinasi laporan lapangan.')}
                      </p>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300">
                      {t('register.password', 'Password')}
                    </label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        id="reg-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Error messages */}
                  {error && (
                    <div id="registration-error-container" className="flex items-start gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      id="reg-submit-btn"
                      type="submit"
                      disabled={
                        isSubmitting || 
                        !fullName || 
                        !password || 
                        !!error ||
                        (activeTab === 'investor' && (!email || !companyName || !nib)) ||
                        (activeTab === 'masyarakat' && (!nik || !whatsapp || !kecamatan || !desa || !ktpFile))
                      }
                      className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-emerald-400/30 rounded-xl shadow-lg shadow-emerald-900/30 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer group"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" id="submit-spinner" />
                          <span>{t('register.btnLoading', 'Verifying Data...')}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={18} />
                          <span>{activeTab === 'investor' ? t('register.btnSubmit', 'Create Investor Account') : t('register.btnSubmitMasyarakat', 'Daftar Akun Masyarakat')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              <div className="mt-4 text-center">
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  {t('register.alreadyHaveAccount', 'Sudah punya akun? Masuk Portal Investor / Masyarakat')}
                </button>
              </div>
              {/* feat: ktp upload refactored */}
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// feat: implement dynamic dependent dropdown for wilayah
// ux polish: dual-option camera and gallery for ktp registration

