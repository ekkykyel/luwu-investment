import { requestSmartFullscreen, exitSmartFullscreen } from "../../utils/fullscreen.js";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { 
  X, Send, MapPin, Building2, Phone, User, AlertCircle, Camera, 
  Upload, LogOut, RefreshCw, CheckCircle2, Shield, ShieldCheck, FileText, 
  Loader2, AlertOctagon, HelpCircle, Check, Eye, ChevronRight, Info,
  Sun, Moon, Star, Filter, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Swal from "sweetalert2";
import { supabase } from "../../lib/supabaseClient.js";
import { District } from "../../types.js";

interface MasyarakatDashboardProps {
  isDarkMode: boolean;
  activeProfile: any;
  districts?: District[];
  onToggleTheme?: () => void;
}

export default function MasyarakatDashboard({
  isDarkMode,
  activeProfile,
  districts = [],
  onToggleTheme,
}: MasyarakatDashboardProps) {
  const navigate = useNavigate();
  useEffect(() => { return () => { exitSmartFullscreen(); }; }, []);

  // Helper to extract phone / whatsapp number from various profile structures
  const extractPhone = useCallback((p: any) => {
    if (!p) return "";
    return (
      p.no_whatsapp ||
      p.whatsapp ||
      p.phone ||
      p.telepon ||
      p.no_hp ||
      p.no_telepon ||
      p.contact_info ||
      p.contact ||
      p.user_metadata?.no_whatsapp ||
      p.user_metadata?.whatsapp ||
      p.user_metadata?.phone ||
      p.user_metadata?.telepon ||
      p.user_metadata?.no_hp ||
      p.user_metadata?.no_telepon ||
      ""
    );
  }, []);

  // Form states
  const [nama, setNama] = useState(activeProfile?.full_name || "");
  const [kontak, setKontak] = useState(() => extractPhone(activeProfile));
  const [kecamatan, setKecamatan] = useState(activeProfile?.kecamatan || "");
  const [desa, setDesa] = useState(activeProfile?.desa || "");
  const [lokasi, setLokasi] = useState("");
  const [perusahaan, setPerusahaan] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userNik, setUserNik] = useState<string>(activeProfile?.nik || "");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Aduan category options
  const PENYELENGGARA_ADUAN_OPTIONS = [
    "Penundaan berlarut",
    "Penyimpangan prosedur",
    "Ada permintaan Imbalan",
    "Penyalahgunaan wewenang",
    "Tindakan diskriminatif",
  ];

  const INVESTOR_ADUAN_OPTIONS = [
    "Pencemaran dan Kerusakan Lingkungan",
    "Pelanggaran Hak Sosial dan Ketenagakerjaan",
    "Legalitas dan Perizinan Usaha",
    "Gangguan Ketertiban Umum",
  ];

  // Options for PermenPANRB No. 62/2018 Classifications
  const ASPIRASI_TOPIK_OPTIONS = [
    "Peningkatan Kualitas Pelayanan MPP Simpurusiang",
    "Kemudahan Berusaha & Insentif Investasi Daerah",
    "Penataan Ruang, RTRW, & Konservasi Lingkungan",
    "Pembangunan Infrastruktur & Fasilitas Publik",
    "Lain-lain / Usulan Inovasi Pelayanan",
  ];

  const INFORMASI_KATEGORI_OPTIONS = [
    "Persyaratan & Alur Perizinan Usaha (OSS-RBA)",
    "Pola Ruang & Kesesuaian Tata Ruang (RTRW / KKPR)",
    "Prosedur, Potensi & Insentif Investasi Luwu",
    "Jadwal & Standar Layanan MPP Simpurusiang",
    "Persyaratan Sertifikasi Halal & Standar Teknis",
  ];

  const [targetAduan, setTargetAduan] = useState<string>("Penyelenggara Perizinan (DPMPTSP Kab. Luwu)");
  const [jenisAduan, setJenisAduan] = useState<string>("Penundaan berlarut");
  const [unitMpp, setUnitMpp] = useState<string>("");
  const [tipeLaporan, setTipeLaporan] = useState<"Pengaduan" | "Aspirasi" | "Permintaan Informasi">("Pengaduan");

  const handleSelectTipeLaporan = (tipe: "Pengaduan" | "Aspirasi" | "Permintaan Informasi") => {
    setTipeLaporan(tipe);
    if (tipe === "Pengaduan") {
      setTargetAduan("Penyelenggara Perizinan (DPMPTSP Kab. Luwu)");
      setJenisAduan(PENYELENGGARA_ADUAN_OPTIONS[0]);
    } else if (tipe === "Aspirasi") {
      setTargetAduan("Aspirasi / Masukan Pembangunan");
      setJenisAduan(ASPIRASI_TOPIK_OPTIONS[0]);
    } else if (tipe === "Permintaan Informasi") {
      setTargetAduan("Layanan Informasi Publik DPMPTSP");
      setJenisAduan(INFORMASI_KATEGORI_OPTIONS[0]);
    }
  };

  // Mobile & Navigation Tab state
  const [activeTab, setActiveTab] = useState<"form" | "history" | "sla_info">("form");

  // SKM (Survei Kepuasan Masyarakat) Ratings local state
  const [skmRatings, setSkmRatings] = useState<Record<string, number>>({});
  const [userFeedback, setUserFeedback] = useState<Record<string, string>>({});

  // Registered companies state
  const [companyList, setCompanyList] = useState<string[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);
  const [isManualCompanyInput, setIsManualCompanyInput] = useState<boolean>(false);

  useEffect(() => {
    if (activeProfile) {
      if (activeProfile.full_name) setNama(activeProfile.full_name);
      const phone = extractPhone(activeProfile);
      if (phone) setKontak(phone);
      if (activeProfile.kecamatan) setKecamatan(activeProfile.kecamatan);
      if (activeProfile.desa) setDesa(activeProfile.desa);
      if (activeProfile.nik) setUserNik(activeProfile.nik);
    }
    // Direct check on supabase auth session user metadata if activeProfile is delayed or incomplete
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const uPhone = extractPhone(user) || extractPhone(user.user_metadata);
        if (uPhone) {
          setKontak((prev) => prev || uPhone);
        }
        if (user.user_metadata?.full_name) {
          setNama((prev) => prev || user.user_metadata.full_name);
        }
        const uNik = user.user_metadata?.nik || user.user_metadata?.no_ktp;
        if (uNik) {
          setUserNik((prev) => prev || uNik);
        } else {
          try {
            const { data: prof } = await supabase.from("profiles").select("nik, no_ktp").eq("id", user.id).maybeSingle();
            if (prof?.nik || prof?.no_ktp) {
              setUserNik((prev) => prev || prof.nik || prof.no_ktp);
            }
          } catch (e) {}
        }
      }
    });
  }, [activeProfile, extractPhone]);

  // Fetch registered investors / companies in the selected kecamatan and desa
  const fetchRegisteredCompanies = useCallback(async () => {
    const targetKec = (kecamatan || lokasi || activeProfile?.kecamatan || "").replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
    const targetDesa = (desa || activeProfile?.desa || "").replace(/^(desa|kel\.?|kelurahan)\s*/i, "").trim();

    setLoadingCompanies(true);
    const foundCompanies = new Set<string>();

    try {
      // 1. Fetch from investments API
      try {
        const res = await fetch("/api/investments");
        if (res.ok) {
          const invs = await res.json();
          if (Array.isArray(invs)) {
            invs.forEach((inv: any) => {
              const invKec = (inv.district_name || inv.district || inv.kecamatan || inv.districtId || "").toString().toLowerCase();
              const invDesa = (inv.village_name || inv.desa || inv.villageId || "").toString().toLowerCase();
              const compName = inv.company || inv.perusahaan || inv.contactPic || inv.name;

              if (compName && compName.trim()) {
                const cleanComp = compName.trim();
                if (cleanComp && !cleanComp.toLowerCase().startsWith("potensi")) {
                  if (!targetKec || invKec.includes(targetKec.toLowerCase()) || targetKec.toLowerCase().includes(invKec)) {
                    if (!targetDesa || invDesa.includes(targetDesa.toLowerCase()) || targetDesa.toLowerCase().includes(invDesa)) {
                      foundCompanies.add(cleanComp);
                    }
                  }
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn("Error fetching /api/investments for companies:", e);
      }

      // 2. Fetch directly from Supabase 'investments' table
      try {
        let query = supabase.from("investments").select("*");
        if (targetKec) {
          query = query.ilike("kecamatan", `%${targetKec}%`);
        }
        const { data: invData } = await query;
        if (invData) {
          invData.forEach((inv: any) => {
            const compName = inv.perusahaan || inv.company || inv.nama_perusahaan;
            if (compName && compName.trim()) {
              foundCompanies.add(compName.trim());
            }
          });
        }
      } catch (e) {
        // ignore
      }

      // 3. Fetch from 'profiles' table for role = 'investor' or 'perusahaan'
      try {
        let profQuery = supabase.from("profiles").select("company_name, full_name, kecamatan, desa").or("role.eq.investor,role.eq.perusahaan");
        if (targetKec) {
          profQuery = profQuery.ilike("kecamatan", `%${targetKec}%`);
        }
        const { data: profData } = await profQuery;
        if (profData) {
          profData.forEach((p: any) => {
            const cName = p.company_name || p.full_name;
            if (cName && cName.trim()) {
              if (!targetDesa || (p.desa && p.desa.toLowerCase().includes(targetDesa.toLowerCase()))) {
                foundCompanies.add(cName.trim());
              }
            }
          });
        }
      } catch (e) {
        // ignore
      }

      // 4. Fetch from 'investment_interests' table
      try {
        const { data: loiData } = await supabase.from("investment_interests").select("company_name, investor_name, potensi_name");
        if (loiData) {
          loiData.forEach((loi: any) => {
            if (loi.company_name && loi.company_name.trim() && loi.company_name !== "-") {
              const pot = (loi.potensi_name || "").toLowerCase();
              if (!targetKec || pot.includes(targetKec.toLowerCase())) {
                foundCompanies.add(loi.company_name.trim());
              }
            }
          });
        }
      } catch (e) {
        // ignore
      }

      const uniqueList = Array.from(foundCompanies).filter(Boolean);
      setCompanyList(uniqueList);
    } catch (err) {
      console.error("Error fetching registered companies:", err);
      setCompanyList([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, [kecamatan, desa, lokasi, activeProfile]);

  useEffect(() => {
    fetchRegisteredCompanies();
  }, [fetchRegisteredCompanies]);

  // Tracking table states
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  // Load complaints for this user
  const fetchMyComplaints = useCallback(async () => {
    if (!activeProfile?.id) return;
    setLoadingComplaints(true);
    try {
      const { data, error } = await supabase
        .from("pengaduan")
        .select("*")
        .eq("pelapor_id", activeProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err: any) {
      console.error("Gagal memuat daftar pengaduan:", err);
    } finally {
      setLoadingComplaints(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  // Handle auto geotagging
  const handleGetLocation = () => {
    setIsGettingLocation(true);
    if (!navigator.geolocation) {
      Swal.fire({
        title: "Tidak Didukung",
        text: "Browser Anda tidak mendukung Geolocation.",
        icon: "error"
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsGettingLocation(false);
        Swal.fire({
          title: "Lokasi Terdeteksi",
          text: `Koordinat GPS berhasil dikunci: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`,
          icon: "success",
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
          background: isDarkMode ? "#0f172a" : "#ffffff",
          color: isDarkMode ? "#f8fafc" : "#0f172a"
        });
      },
      (err) => {
        console.error("Geo error", err);
        setIsGettingLocation(false);
        Swal.fire({
          title: "GPS Gagal",
          text: "Gagal mendeteksi lokasi otomatis. Pastikan izin lokasi aktif.",
          icon: "warning",
          confirmButtonColor: "#3b82f6"
        });
      }
    );
  };

  // Trigger geolocation on mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Keluar Sistem?",
      text: "Anda akan keluar dari Portal Pengaduan Masyarakat.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      background: isDarkMode ? "#0f172a" : "#ffffff",
      color: isDarkMode ? "#f8fafc" : "#0f172a"
    });

    if (result.isConfirmed) {
      try {
        if (!document.fullscreenElement) {
          const elem = document.documentElement as any;
          requestSmartFullscreen();
        }
      } catch (err) {}
      await supabase.auth.signOut();
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      localStorage.removeItem("luwu_session_token");
      exitSmartFullscreen();
                navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalNama = nama || activeProfile?.full_name || "Masyarakat";
    const finalKontak = kontak.trim() || extractPhone(activeProfile) || "-";
    const finalLokasi = (kecamatan || activeProfile?.kecamatan) && (desa || activeProfile?.desa)
      ? `Kec. ${kecamatan || activeProfile?.kecamatan}, Desa/Kel. ${desa || activeProfile?.desa}`
      : ((kecamatan || activeProfile?.kecamatan) ? `Kec. ${kecamatan || activeProfile?.kecamatan}` : (lokasi.trim() || "Kabupaten Luwu"));

    if (!deskripsi.trim()) {
      Swal.fire({ title: "Gagal", text: "Uraian laporan pengaduan wajib diisi.", icon: "error", confirmButtonColor: "#3b82f6" });
      return;
    }

    setIsSubmitting(true);
    try {
      let bukti_foto_url = null;
      if (file) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${activeProfile?.id || 'guest'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        let isUploaded = false;

        try {
          const { error: uploadError } = await supabase.storage
            .from("pengaduan_evidence")
            .upload(fileName, file, { upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("pengaduan_evidence")
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              bukti_foto_url = publicUrlData.publicUrl;
              isUploaded = true;
            }
          }
        } catch (e) {
          console.warn("Upload to pengaduan_evidence bucket failed:", e);
        }

        if (!isUploaded) {
          try {
            const { error: fallbackErr } = await supabase.storage
              .from("investments")
              .upload(fileName, file, { upsert: true });

            if (!fallbackErr) {
              const { data: publicUrlData } = supabase.storage
                .from("investments")
                .getPublicUrl(fileName);
              if (publicUrlData?.publicUrl) {
                bukti_foto_url = publicUrlData.publicUrl;
                isUploaded = true;
              }
            }
          } catch (e) {
            console.warn("Upload to investments bucket failed:", e);
          }
        }

        if (!isUploaded) {
          bukti_foto_url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        }
      }

      const currentYear = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const tiketId = `LAPOR-${currentYear}-${randomSuffix}`;

      const targetName = targetAduan.includes("Penyelenggara")
        ? unitMpp
        : perusahaan;

      const fullPayload: any = {
        tipe_pelapor: "masyarakat",
        nama_pelapor: isAnonymous ? `${finalNama} (Anonim)` : finalNama,
        kontak_pelapor: finalKontak,
        lokasi_kejadian: finalLokasi,
        perusahaan_terkait: targetName.trim() || null,
        target_aduan: targetAduan,
        jenis_aduan: jenisAduan,
        kategori_pengaduan: targetAduan.includes("Penyelenggara") && unitMpp ? `[${tipeLaporan}] ${targetAduan} - ${jenisAduan} (${unitMpp})` : `[${tipeLaporan}] ${targetAduan} - ${jenisAduan}`,
        deskripsi_masalah: `[Klasifikasi: ${tipeLaporan}]\n[Diadukan Ke: ${targetAduan}]\n${targetAduan.includes("Penyelenggara") && unitMpp ? `[Unit Layanan MPP: ${unitMpp}]\n` : ''}[Jenis Aduan: ${jenisAduan}]\n[Anonim: ${isAnonymous ? 'Ya (Whistleblower)' : 'Tidak'}]\n\n${deskripsi}`,
        status: "Menunggu Verifikasi",
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        bukti_foto_url,
        pelapor_id: activeProfile?.id || null,
        tiket_id: tiketId,
        is_anonymous: isAnonymous,
      };

      const { error: err1 } = await supabase.from("pengaduan").insert(fullPayload);
      if (err1) {
        delete fullPayload.target_aduan;
        delete fullPayload.jenis_aduan;
        delete fullPayload.is_anonymous;
        const { error: err2 } = await supabase.from("pengaduan").insert(fullPayload);
        if (err2) throw err2;
      }

      await Swal.fire({
        title: "Laporan Terkirim!",
        html: `Laporan Anda berhasil didaftarkan dengan ID Tiket:<br/><strong class="text-emerald-500 font-mono text-lg">${tiketId}</strong><br/><br/>DPMPTSP Luwu akan segera memverifikasi laporan Anda.`,
        icon: "success",
        confirmButtonColor: "#10b981",
        background: isDarkMode ? "#0f172a" : "#ffffff",
        color: isDarkMode ? "#f8fafc" : "#0f172a"
      });

      // Reset form fields
      setLokasi("");
      setPerusahaan("");
      setUnitMpp("");
      setDeskripsi("");
      setFile(null);
      setActiveTab("history");
      fetchMyComplaints();
    } catch (err: any) {
      console.error(err);
      Swal.fire({ title: "Gagal Mengirim", text: err.message, icon: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans pb-12 transition-all duration-300`}>
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${isDarkMode ? "bg-slate-900/85 border-slate-800" : "bg-white/85 border-slate-200"} backdrop-blur-md transition-colors`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5">
          {/* Brand Left */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Logo Luwu */}
            <div className="w-12 h-14 md:w-14 md:h-16 flex items-center justify-center shrink-0">
              <img 
                src="/transparant.png" 
                alt="Logo Pemkab Luwu" 
                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://i.ibb.co.com/KxKKb5d8/transparant.png";
                }}
              />
            </div>
            
            <div className="min-w-0 flex flex-col justify-center">
              {/* Badges - Removed duplicate MPP SIMPURUSIANG badge */}
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 rounded font-mono tracking-tight leading-none">
                  LAPOR LUWU!
                </span>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-mono tracking-tight leading-none">
                  TERVERIFIKASI
                </span>
              </div>

              {/* Title: Android-friendly font, NOT bold, proportional size */}
              <h1 className="text-xs sm:text-base md:text-lg font-medium text-slate-800 dark:text-slate-100 font-sans tracking-normal truncate">
                Kanal Pengaduan Masyarakat
              </h1>

              {/* Subtitle */}
              <h2 className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 leading-tight truncate">
                MPP Simpurusiang Kabupaten Luwu
              </h2>

              <p className="hidden md:block text-[10px] text-slate-500 font-medium truncate">
                Sistem Pengawasan Terpadu Tata Ruang, Investasi, dan Pelayanan Publik
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                if (onToggleTheme) {
                  onToggleTheme();
                } else {
                  const isDark = document.documentElement.classList.contains("dark");
                  if (isDark) {
                    document.documentElement.classList.remove("dark");
                  } else {
                    document.documentElement.classList.add("dark");
                  }
                }
              }}
              title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              aria-label="Toggle Theme"
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDarkMode
                  ? "bg-slate-800/80 hover:bg-slate-700 text-amber-400 border-slate-700/60 shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200/80 shadow-sm"
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* User Profile Card */}
            <div className={`hidden sm:flex flex-col text-right ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              <span className="text-[10px] font-bold font-mono text-emerald-500 uppercase leading-none">MASYARAKAT</span>
              <span className="text-xs sm:text-sm font-semibold truncate max-w-[120px] lg:max-w-[180px]">
                {activeProfile?.full_name || "Masyarakat"}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">NIK: {userNik || "..."}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ANDROID-FIRST NAVIGATION TAB BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        <div className={`p-1.5 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-1 shadow-md ${
          isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
              activeTab === "form"
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-500/20"
                : isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800/50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Buat Laporan Baru</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
              activeTab === "history"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                : isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800/50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Riwayat Aduan Saya</span>
            {complaints.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                activeTab === "history" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400"
              }`}>
                {complaints.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sla_info")}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
              activeTab === "sla_info"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                : isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800/50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Standar SLA & SOP</span>
            <span className="sm:hidden">SLA Ombudsman</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Grievance Form (lg:col-span-6) */}
        <div className={`lg:col-span-6 flex-col gap-6 ${activeTab === "form" ? "flex" : "hidden lg:flex"}`}>
          <div className={`p-6 pb-32 md:pb-6 rounded-3xl border backdrop-blur-md transition-all duration-300 ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center gap-2 mb-4">
              {tipeLaporan === "Pengaduan" ? (
                <FileText className="w-5 h-5 text-red-500" />
              ) : tipeLaporan === "Aspirasi" ? (
                <AlertOctagon className="w-5 h-5 text-blue-500" />
              ) : (
                <HelpCircle className="w-5 h-5 text-emerald-500" />
              )}
              <h2 className={`text-xl md:text-2xl font-bold font-display ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {tipeLaporan === "Pengaduan"
                  ? "Formulir Pengaduan Spasial & Perizinan"
                  : tipeLaporan === "Aspirasi"
                  ? "Formulir Aspirasi & Masukan Masyarakat"
                  : "Formulir Permintaan Informasi Publik"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipe Klasifikasi Laporan (PermenPANRB No. 62/2018 Standard) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-500">
                    Tipe Klasifikasi Laporan
                  </label>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    PermenPANRB No. 62/2018
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "Pengaduan", label: "Pengaduan", color: "red" },
                    { id: "Aspirasi", label: "Aspirasi", color: "blue" },
                    { id: "Permintaan Informasi", label: "Informasi", color: "emerald" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTipeLaporan(item.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[56px] ${
                        tipeLaporan === item.id
                          ? item.color === "red"
                            ? "bg-red-500/15 border-red-500/40 text-red-500 dark:text-red-400 shadow-sm font-bold"
                            : item.color === "blue"
                            ? "bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400 shadow-sm font-bold"
                            : "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold"
                          : isDarkMode
                          ? "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-base font-bold leading-none">{item.label}</span>
                      
                    </button>
                  ))}
                </div>
              </div>

              <div className={`text-base leading-relaxed p-4 rounded-2xl border ${
                isDarkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-300 text-slate-700"
              }`}>
                Laporan Anda dijamin kerahasiaannya dan diikat secara hukum menggunakan identitas NIK Anda (<span className="font-mono font-bold text-emerald-500">{userNik || "..."}</span>) untuk mencegah laporan palsu/spam.
              </div>

              {/* Nama Pelapor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-500">
                    Nama Lengkap (Sesuai KTP)
                  </label>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Terverifikasi KTP
                  </span>
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    readOnly
                    value={nama || activeProfile?.full_name || "Masyarakat"}
                    className={`w-full pl-10 pr-4 py-4.5 rounded-xl border text-base font-semibold transition-all cursor-not-allowed ${
                      isDarkMode
                        ? "bg-slate-900/90 border-slate-800 text-slate-200"
                        : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="anonToggle"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <label htmlFor="anonToggle" className={`text-base cursor-pointer ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Sembunyikan nama saya dari publik (Anonim) - <span className="text-emerald-500 dark:text-emerald-400 font-medium">Identitas tetap dijamin aman oleh sistem Inspektorat.</span>
                  </label>
                </div>
              </div>

              {/* Kontak Pelapor (Nomor WhatsApp) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-500">
                    Nomor WhatsApp Pelapor
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const phone = extractPhone(activeProfile);
                      if (phone) {
                        setKontak(phone);
                      } else {
                        supabase.auth.getUser().then(({ data: { user } }) => {
                          if (user) {
                            const uPhone = extractPhone(user) || extractPhone(user.user_metadata);
                            if (uPhone) setKontak(uPhone);
                          }
                        });
                      }
                    }}
                    className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Shield className="w-3 h-3 text-emerald-400" /> Auto-fill Registrasi
                  </button>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                    placeholder="Ketik nomor WhatsApp aktif (contoh: 08123456789)..."
                    className={`w-full pl-10 pr-4 py-4.5 rounded-xl border text-base font-mono font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-800 text-emerald-400 focus:border-emerald-500"
                        : "bg-slate-50 border-slate-200 text-emerald-700 focus:border-emerald-500 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Wilayah & Geotag Spasial */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-500">
                    Lokasi & Koordinat Spasial (Geotag)
                  </label>
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-400" /> Auto-fill Wilayah
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Cards for Kecamatan & Desa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border flex flex-col justify-center ${
                      isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-slate-100 border-slate-200"
                    }`}>
                      <span className="text-sm uppercase font-bold text-slate-500 tracking-wider mb-0.5">Kecamatan Domisili</span>
                      <span className={`text-xl md:text-2xl font-bold font-display truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                        {kecamatan || activeProfile?.kecamatan ? `Kec. ${kecamatan || activeProfile?.kecamatan}` : (
                          lokasi ? `Kec. ${lokasi}` : "Kabupaten Luwu"
                        )}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border flex flex-col justify-center ${
                      isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-slate-100 border-slate-200"
                    }`}>
                      <span className="text-sm uppercase font-bold text-slate-500 tracking-wider mb-0.5">Desa / Kelurahan</span>
                      <span className={`text-xl md:text-2xl font-bold font-display truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                        {desa || activeProfile?.desa ? `Desa/Kel. ${desa || activeProfile?.desa}` : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Fallback selector if profile has no kecamatan/desa */}
                  {!(kecamatan || activeProfile?.kecamatan) && (
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <select
                        required
                        value={lokasi}
                        onChange={(e) => setLokasi(e.target.value)}
                        className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                          isDarkMode
                            ? "bg-slate-950 border-slate-800 text-white focus:border-blue-500"
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white"
                        }`}
                      >
                        <option value="" disabled>-- Pilih Kecamatan Kejadian --</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.name}>Kecamatan {d.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        ▼
                      </div>
                    </div>
                  )}

                  {/* Geotag Button & GPS Coordinates badge */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isGettingLocation}
                      className={`flex-1 py-2 px-3 border rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-950/80 border-slate-800 hover:bg-slate-800 text-slate-300" 
                          : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isGettingLocation ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span>{coords ? "Dapatkan Ulang GPS" : "Dapatkan GPS Otomatis"}</span>
                    </button>

                    <div className={`px-3 py-2 rounded-xl border text-sm font-mono flex items-center gap-1.5 ${
                      coords ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${coords ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                      {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "GPS tidak terkunci"}
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC FIELD SECTION ACCORDING TO PERMENPANRB CLASSIFICATION */}
              {tipeLaporan === "Pengaduan" ? (
                <div className="space-y-5 pt-1">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    Detail Laporan Pengaduan
                  </label>

                  {/* Pilihan 1: Pihak Diadukan */}
                  <div>
                    <span className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      1. Pihak Yang Diadukan
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetAduan("Penyelenggara Perizinan (DPMPTSP Kab. Luwu)");
                          setJenisAduan(PENYELENGGARA_ADUAN_OPTIONS[0]);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          targetAduan === "Penyelenggara Perizinan (DPMPTSP Kab. Luwu)"
                            ? "bg-blue-500/10 border-blue-500 text-blue-400 ring-1 ring-blue-500"
                            : isDarkMode
                            ? "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                          targetAduan === "Penyelenggara Perizinan (DPMPTSP Kab. Luwu)"
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-500"
                        }`}>
                          {targetAduan === "Penyelenggara Perizinan (DPMPTSP Kab. Luwu)" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className={`text-base font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                            Penyelenggara Perizinan
                          </div>
                          <div className="text-sm text-slate-400 font-medium">
                            DPMPTSP Kab. Luwu
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetAduan("Investor/Perusahaan");
                          setJenisAduan(INVESTOR_ADUAN_OPTIONS[0]);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          targetAduan === "Investor/Perusahaan"
                            ? "bg-amber-500/10 border-amber-500 text-amber-400 ring-1 ring-amber-500"
                            : isDarkMode
                            ? "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                          targetAduan === "Investor/Perusahaan"
                            ? "border-amber-500 bg-amber-500"
                            : "border-slate-500"
                        }`}>
                          {targetAduan === "Investor/Perusahaan" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className={`text-base font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                            Investor / Perusahaan
                          </div>
                          <div className="text-sm text-slate-400 font-medium">
                            Pelanggaran Kegiatan Usaha
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Pilihan 2: Jenis Aduan */}
                  <div>
                    <span className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      2. Jenis Aduan / Pelanggaran
                    </span>
                    <div className="relative">
                      <AlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <select
                        value={jenisAduan}
                        onChange={(e) => setJenisAduan(e.target.value)}
                        className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer ${
                          targetAduan === "Investor/Perusahaan"
                            ? "focus:ring-amber-500"
                            : "focus:ring-blue-500"
                        } ${
                          isDarkMode
                            ? "bg-slate-950 border-slate-800 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      >
                        {(targetAduan === "Penyelenggara Perizinan (DPMPTSP Kab. Luwu)"
                          ? PENYELENGGARA_ADUAN_OPTIONS
                          : INVESTOR_ADUAN_OPTIONS
                        ).map((opt, idx) => (
                          <option key={opt} value={opt}>
                            {idx + 1}. {opt}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-base">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>
              ) : tipeLaporan === "Aspirasi" ? (
                <div className="space-y-5 pt-1">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-blue-500" />
                    Topik & Sektor Aspirasi
                  </label>
                  <div className="relative">
                    <AlertOctagon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                    <select
                      value={jenisAduan}
                      onChange={(e) => setJenisAduan(e.target.value)}
                      className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      {ASPIRASI_TOPIK_OPTIONS.map((opt, idx) => (
                        <option key={opt} value={opt}>
                          {idx + 1}. {opt}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-base">
                      ▼
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 pt-1">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Kategori Informasi Yang Dibutuhkan
                  </label>
                  <div className="relative">
                    <HelpCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                    <select
                      value={jenisAduan}
                      onChange={(e) => setJenisAduan(e.target.value)}
                      className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      {INFORMASI_KATEGORI_OPTIONS.map((opt, idx) => (
                        <option key={opt} value={opt}>
                          {idx + 1}. {opt}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-base">
                      ▼
                    </div>
                  </div>
                </div>
              )}

              {/* Bukti Foto / Dokumen Pendukung */}
              <div className="animate-fade-in-up">
                <label className="block text-base font-semibold uppercase tracking-wider mb-2 text-slate-500">
                  {tipeLaporan === "Pengaduan" ? "Bukti Foto Lapangan / Dokumen Pendukung" : "Lampiran Dokumen / Konsep Gagasan (Opsional)"}
                </label>
                
                <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  isDarkMode 
                    ? "border-slate-800 bg-slate-950/50 hover:border-emerald-500/50" 
                    : "border-slate-300 bg-slate-50 hover:border-emerald-500/50"
                }`}>
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      {file.type.startsWith("image/") && (
                        <div className="w-full h-48 bg-slate-900/80 rounded-xl flex items-center justify-center overflow-hidden mb-1 border border-slate-700/50 p-1">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="object-contain h-full max-w-full rounded-lg" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-emerald-500 font-medium text-base bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 max-w-full truncate">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-base text-rose-500 hover:text-rose-400 font-bold mt-1 cursor-pointer transition-colors"
                      >
                        Hapus Foto & Ganti
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center items-center gap-3 mb-2.5">
                        {/* OPTION 1: LIVE CAMERA */}
                        <label className={`flex flex-col items-center justify-center w-28 sm:w-32 h-22 rounded-xl cursor-pointer transition-all border group p-2 ${
                          isDarkMode 
                            ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-emerald-500/50" 
                            : "bg-white hover:bg-slate-100 border-slate-200 hover:border-emerald-500/50 shadow-sm"
                        }`}>
                          <Camera className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                          <span className={`text-sm font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Buka Kamera</span>
                          <span className="text-sm text-slate-500">Foto Langsung</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </label>

                        {/* OPTION 2: GALLERY */}
                        <label className={`flex flex-col items-center justify-center w-28 sm:w-32 h-22 rounded-xl cursor-pointer transition-all border group p-2 ${
                          isDarkMode 
                            ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-blue-500/50" 
                            : "bg-white hover:bg-slate-100 border-slate-200 hover:border-blue-500/50 shadow-sm"
                        }`}>
                          <ImageIcon className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                          <span className={`text-sm font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Pilih Galeri</span>
                          <span className="text-sm text-slate-500">Foto / File PDF</span>
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            className="hidden" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">Maksimal ukuran file 5MB. Gunakan kamera untuk bukti Real-Time.</p>
                    </>
                  )}
                </div>
              </div>

              {/* CONDITIONAL TARGET FIELD (ONLY FOR PENGADUAN) */}
              {tipeLaporan === "Pengaduan" && (
                <>
                  {targetAduan.includes("Penyelenggara") ? (
                    <div className="animate-fade-in-up">
                      <label className="block text-base font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Unit Layanan MPP Simpurusiang
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none z-10" />
                        <select
                          value={unitMpp}
                          onChange={(e) => setUnitMpp(e.target.value)}
                          className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer ${
                            isDarkMode
                              ? "bg-slate-950 border-slate-800 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                        >
                          <option value="" disabled>-- Pilih Unit Layanan --</option>
                          <option value="Front Office">1. Front Office</option>
                          <option value="Bagian Pengawasan">2. Bagian Pengawasan</option>
                          <option value="Gerai Layanan MPP">3. Gerai Layanan MPP</option>
                          <option value="Lain-lain">4. Lain-lain</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-base">
                          ▼
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in-up">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-base font-semibold uppercase tracking-wider text-slate-500">
                          Nama Perusahaan Terkait (Opsional)
                        </label>
                        {loadingCompanies ? (
                          <span className="text-xs text-blue-400 font-mono animate-pulse flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin text-blue-400" /> Memuat data...
                          </span>
                        ) : companyList.length > 0 ? (
                          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-400" /> {companyList.length} Terdaftar
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                            <Info className="w-3 h-3 text-slate-400" /> 0 Terdaftar
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />

                        {isManualCompanyInput ? (
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={perusahaan}
                              onChange={(e) => setPerusahaan(e.target.value)}
                              placeholder="Ketik nama perusahaan terkait..."
                              className={`w-full pl-10 pr-24 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isDarkMode
                                  ? "bg-slate-950 border-slate-800 text-white focus:border-blue-500"
                                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsManualCompanyInput(false);
                                setPerusahaan("");
                              }}
                              className="absolute right-2 text-base text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded-lg transition-colors font-medium cursor-pointer"
                            >
                              Pilih Daftar
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={perusahaan}
                              onChange={(e) => {
                                if (e.target.value === "__MANUAL__") {
                                  setIsManualCompanyInput(true);
                                  setPerusahaan("");
                                } else {
                                  setPerusahaan(e.target.value);
                                }
                              }}
                              className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${
                                isDarkMode
                                  ? "bg-slate-950 border-slate-800 text-white focus:border-blue-500"
                                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white"
                              }`}
                            >
                              {companyList.length === 0 ? (
                                <option value="">Belum ada data Investor/Perusahaan.</option>
                              ) : (
                                <>
                                  <option value="">-- Pilih Investor / Perusahaan Terdaftar ({companyList.length}) --</option>
                                  {companyList.map((comp) => (
                                    <option key={comp} value={comp}>
                                      {comp}
                                    </option>
                                  ))}
                                </>
                              )}
                              <option value="__MANUAL__">+ Ketik Manual Nama Perusahaan Lainnya...</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-base">
                              ▼
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Deskripsi Masalah / Aspirasi / Pertanyaan */}
              <div>
                <label className="block text-base font-semibold uppercase tracking-wider mb-2 text-slate-500">
                  {tipeLaporan === "Pengaduan"
                    ? "Uraian Kejadian / Detil Pengaduan"
                    : tipeLaporan === "Aspirasi"
                    ? "Uraian Aspirasi & Gagasan Masukan"
                    : "Detail Pertanyaan / Informasi Yang Dibutuhkan"}
                </label>
                <textarea
                  required
                  rows={6}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                  placeholder={
                    tipeLaporan === "Pengaduan"
                      ? "Uraikan laporan pengaduan secara objektif, kronologi kejadian, dan dampak yang ditimbulkan..."
                      : tipeLaporan === "Aspirasi"
                      ? "Tuliskan saran, masukan, atau gagasan inovasi Anda untuk kemajuan pelayanan publik, iklim investasi, dan tata ruang di Kabupaten Luwu..."
                      : "Uraikan secara jelas pertanyaan atau permohonan informasi perizinan, tata ruang RTRW, atau prosedur yang ingin Anda dapatkan..."
                  }
                  className={`w-full p-4 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDarkMode
                      ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
                  }`}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-4 mt-2 rounded-xl text-white font-bold text-base tracking-widest uppercase transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  tipeLaporan === "Pengaduan"
                    ? "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-red-500/20"
                    : tipeLaporan === "Aspirasi"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>MENGIRIM LAPORAN...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {tipeLaporan === "Pengaduan"
                        ? "Kirim Pengaduan Resmi"
                        : tipeLaporan === "Aspirasi"
                        ? "Kirim Aspirasi Masyarakat"
                        : "Ajukan Permintaan Informasi"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Tracking Table & SOP (lg:col-span-6) */}
        <div className={`lg:col-span-6 flex-col gap-6 ${activeTab !== "form" ? "flex" : "hidden lg:flex"}`}>
          <div className={`p-6 rounded-3xl border backdrop-blur-md transition-all duration-300 ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl md:text-2xl font-bold font-display">Status Pemantauan Aduan Anda</h2>
              </div>

              <button
                onClick={fetchMyComplaints}
                className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  isDarkMode ? "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
                title="Muat Ulang Riwayat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan</span>
              </button>
            </div>

            {loadingComplaints ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-xs text-slate-400">Menghubungkan ke pusat data aduan...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-24 px-4">
                <AlertOctagon className="w-12 h-12 text-slate-500 mb-4 stroke-1 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-400 mb-1">Belum Ada Pengaduan</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Semua aduan resmi yang Anda kirim akan otomatis tercantum di sini lengkap dengan status verifikasi terbaru.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800/10">
                <table className="w-full text-left text-xs">
                  <thead className={`${isDarkMode ? "bg-slate-950 text-slate-400" : "bg-slate-50 text-slate-600"} uppercase font-mono font-bold tracking-wider border-b border-slate-800/10`}>
                    <tr>
                      <th className="p-4">ID Tiket</th>
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Kecamatan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/10">
                    {complaints.map((c) => {
                      const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "-";
                      
                      return (
                        <tr key={c.id} className={`transition-all hover:bg-slate-500/5`}>
                          <td className="p-4 font-mono font-bold text-red-400">{c.tiket_id || `LAPOR-${c.id.substring(0,6).toUpperCase()}`}</td>
                          <td className="p-4 text-slate-400 font-mono">{dateStr}</td>
                          <td className="p-4 font-semibold">{c.lokasi_kejadian || "-"}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                              c.status === "Selesai" 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : c.status === "Sedang Ditinjau Dalak" || c.status === "Verifikasi Dalak Berjalan"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>
                              {c.status || "Menunggu Verifikasi"}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1 text-center font-medium">SLA: Maks. 3x24 Jam</p>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedComplaint(c)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Detail Laporan"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SOP Card to balance vertical symmetry */}
          <div className={`rounded-xl p-6 border transition-all duration-300 ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              <ShieldCheck className="w-5 h-5 text-emerald-500"/>
              Alur Tindak Lanjut Pengaduan
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
              {/* Step 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 text-emerald-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_10px_rgba(16,185,129,0.4)] z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>1. Verifikasi (1x24 Jam)</p>
                  <p className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Tim Admin DPMPTSP & Inspektorat mengecek keabsahan KTP, Foto, dan Titik Koordinat GPS.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>2. Tindak Lanjut Lapangan</p>
                  <p className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Satgas Dalak diturunkan ke titik koordinat laporan untuk mediasi atau investigasi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal Pop-up (Interactive Single-view Detail Pane) */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedComplaint(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`relative w-full max-w-2xl rounded-3xl border overflow-hidden z-10 transition-all duration-300 ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-950"
              }`}
            >
              {/* Header */}
              <div className="relative p-6 border-b border-slate-500/10 flex items-center justify-between bg-gradient-to-r from-red-500/5 to-amber-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-red-500 tracking-wider">LAPOR LUWU! TICKET</span>
                    <h3 className={`text-xl md:text-2xl font-bold font-display tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      Detail Tiket {selectedComplaint.tiket_id || `LAPOR-${selectedComplaint.id.substring(0,6).toUpperCase()}`}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="p-1.5 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono block mb-1">Status Verifikasi</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${
                      selectedComplaint.status === "Selesai" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : selectedComplaint.status === "Sedang Ditinjau Dalak" || selectedComplaint.status === "Verifikasi Dalak Berjalan"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {selectedComplaint.status || "Menunggu Verifikasi"}
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono block mb-1">Tanggal Aduan</span>
                    <span className="text-xs font-semibold">
                      {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      }) : "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs uppercase font-mono font-bold text-slate-500 tracking-wider">Lokasi Kejadian</h4>
                    <p className="text-sm font-semibold">{selectedComplaint.lokasi_kejadian || "Kecamatan -"}</p>
                    {selectedComplaint.latitude && selectedComplaint.longitude && (
                      <p className="text-[10px] font-mono text-emerald-400 mt-1">📍 GPS: {selectedComplaint.latitude.toFixed(6)}, {selectedComplaint.longitude.toFixed(6)}</p>
                    )}
                  </div>

                  {selectedComplaint.perusahaan_terkait && (
                    <div>
                      <h4 className="text-xs uppercase font-mono font-bold text-slate-500 tracking-wider">Perusahaan Terkait</h4>
                      <p className="text-sm font-semibold">{selectedComplaint.perusahaan_terkait}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs uppercase font-mono font-bold text-slate-500 tracking-wider">Uraian / Deskripsi Aduan</h4>
                    <p className={`text-xs leading-relaxed p-4 rounded-2xl border mt-1.5 whitespace-pre-wrap ${
                      isDarkMode ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}>
                      {selectedComplaint.deskripsi_masalah}
                    </p>
                  </div>

                  {/* Bukti Foto */}
                  {selectedComplaint.bukti_foto_url && (
                    <div>
                      <h4 className="text-xs uppercase font-mono font-bold text-slate-500 tracking-wider mb-2">Foto Bukti Lapangan</h4>
                      <div className="relative rounded-2xl overflow-hidden border border-slate-800/20 max-h-64">
                        <img 
                          src={selectedComplaint.bukti_foto_url} 
                          alt="Bukti Foto Lapangan" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Feedback / Tindak Lanjut dari Administrator */}
                  <div className={`p-4 rounded-2xl border ${
                    selectedComplaint.status === "Selesai" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                      : "bg-slate-950/50 border-slate-800 text-slate-400"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 shrink-0 text-amber-500" />
                      <span className="text-xs uppercase font-mono font-bold tracking-wider">Tanggapan / Tindak Lanjut Bidang Dalak</span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedComplaint.catatan_admin || selectedComplaint.laporan_dalak || "Belum ada catatan mediasi / tindak lanjut dari Dinas Penanaman Modal. Petugas Dalak akan memperbarui detail ini setelah verifikasi lapangan."}
                    </p>
                  </div>

                  {/* SURVEI KEPUASAN MASYARAKAT (SKM) - OMBUDSMAN RI STANDARD */}
                  {selectedComplaint.status === "Selesai" && (
                    <div className={`p-4 rounded-2xl border ${
                      isDarkMode ? "bg-amber-500/10 border-amber-500/20 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 text-amber-400">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          Survei Kepuasan Pelayanan (SKM)
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                          Ombudsman RI
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Bagaimana tingkat kepuasan Anda terhadap kecepatan dan penyelesaian pengaduan ini oleh DPMPTSP Kabupaten Luwu?
                      </p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => {
                              setSkmRatings((prev) => ({ ...prev, [selectedComplaint.id]: star }));
                              Swal.fire({
                                toast: true,
                                position: "top-end",
                                icon: "success",
                                title: `Terima kasih! Penilaian ${star} Bintang Tersimpan.`,
                                showConfirmButton: false,
                                timer: 2000,
                                background: isDarkMode ? "#0f172a" : "#ffffff",
                                color: isDarkMode ? "#f8fafc" : "#0f172a"
                              });
                            }}
                            className="p-1 cursor-pointer transition-transform hover:scale-125"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                (skmRatings[selectedComplaint.id] || 5) >= star
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-600"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-400 ml-2 font-mono">
                          {skmRatings[selectedComplaint.id] || 5} / 5 Bintang
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-500/10 flex justify-end">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                    isDarkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  Tutup Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// legal fix: replace SP4N-LAPOR trademark with local branding Lapor Luwu
// ux polish: add explicit live camera and gallery split buttons for evidence upload
// bugfix: resolve mobile keyboard overlap on textarea and fix broken header logo
// bugfix: fix logo path in masyarakat dashboard
// branding hotfix: applied transparant.png to PWA manifest and UI components
