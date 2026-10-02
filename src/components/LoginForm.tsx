import { requestSmartFullscreen } from "../utils/fullscreen";
import React, { useState, useEffect } from "react";
import { X, Shield, Lock, User, ArrowRight, Map, Globe, Database, Cpu, CheckCircle2, Eye, EyeOff, AlertCircle, Sparkles, UserCheck, Building2, Trees, HeartHandshake, Briefcase, FileCheck } from "lucide-react";
import { Role } from "../types";
import { LuwuLogo } from "./LuwuLogo";
import { supabase } from "../lib/supabaseClient";
import { isMobileOrAndroidDevice } from "../hooks/useDeviceAutomation";

interface LoginFormProps {
  onLogin: (role: Role) => void;
  onClose: () => void;
}

const ROLE_PRESETS = [
  { 
    role: Role.ADMIN_PUPTR, 
    roleKey: "admin_puptr",
    label: "Admin PUPTR", 
    email: "puptr@luwukab.go.id", 
    pass: "Puptr123!",
    icon: Building2, 
    badge: "Tata Ruang & GIS",
    targetUrl: "/dashboard?tab=verifikasi_pkkpr"
  },
  { 
    role: Role.ADMIN_PERTANIAN, 
    roleKey: "admin_pertanian",
    label: "Admin Pertanian", 
    email: "pertanian@luwukab.go.id", 
    pass: "Pertanian123!",
    icon: Trees, 
    badge: "Lahan LP2B",
    targetUrl: "/dashboard?tab=verifikasi_pertanian"
  },
  { 
    role: Role.INVESTOR, 
    roleKey: "investor",
    label: "Investor", 
    email: "investor@luwu.go.id", 
    pass: "Investor123!",
    icon: Briefcase, 
    badge: "Portal Investor & ROI",
    targetUrl: "/investor-dashboard"
  },
  { 
    role: Role.PUBLIC_USER, 
    roleKey: "masyarakat",
    label: "Masyarakat", 
    email: "masyarakat@luwu.go.id", 
    pass: "Masyarakat123!",
    icon: HeartHandshake, 
    badge: "Permohonan Warga & SKM",
    targetUrl: "/masyarakat-dashboard"
  },
  { 
    role: Role.ADMIN_DALAK, 
    roleKey: "admin_dalak",
    label: "Admin Dalak", 
    email: "dalakluwu@gmail.com", 
    pass: "Dalak123!",
    icon: FileCheck, 
    badge: "Pengawasan & Mediasi",
    targetUrl: "/dashboard?tab=pengaduan"
  },
  { 
    role: Role.SUPER_ADMIN, 
    roleKey: "superadmin",
    label: "Super Admin", 
    email: "superadmin@luwu.go.id", 
    pass: "SuperAdmin123!",
    icon: Shield, 
    badge: "Akses Penuh Semua Bidang",
    targetUrl: "/dashboard?tab=overview"
  }
];

export default function LoginForm({ onLogin, onClose }: LoginFormProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(Role.ADMIN_PUPTR);
  const [username, setUsername] = useState("puptr@luwukab.go.id");
  const [password, setPassword] = useState("Puptr123!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSelectPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setSelectedRole(preset.role);
    setUsername(preset.email);
    setPassword(preset.pass);
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!username.trim() || !password) {
      setErrorMsg("Harap masukkan username/email dan kata sandi.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, role: selectedRole })
      });
      const data = await response.json();
      if (!data.success) {
        setErrorMsg(data.message || "Kredensial tidak valid. Silakan periksa kembali akun Anda.");
        setIsLoading(false);
        return;
      }

      // Map backend role to roleKey and token
      const currentRoleObj = ROLE_PRESETS.find(p => p.role === selectedRole || p.email.toLowerCase() === username.trim().toLowerCase());
      const effectiveRoleKey = currentRoleObj?.roleKey || (data.role ? String(data.role).toLowerCase().replace(/[\s-]+/g, "_") : "admin_puptr");

      // Invalidate old session profile cache to prevent stale role override
      sessionStorage.removeItem("luwu_cached_profile_data");

      if (effectiveRoleKey !== 'masyarakat') {
        // Clean up lingering citizen OTP keys when logging in as an OPD admin or investor
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('mpp_verified_otp_') || key.startsWith('mpp_citizen_name_'))) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {}
      }

      if (data.token) {
        localStorage.setItem("luwu_session_token", data.token);
      }
      localStorage.setItem("luwu_user_role", effectiveRoleKey);
      localStorage.setItem("luwu_user_email", username.trim().toLowerCase());

      // Warm up fresh profile cache immediately
      const initialProfile = {
        id: data.user?.id || (effectiveRoleKey === 'masyarakat' ? 'citizen-user' : 'admin-user'),
        email: username.trim().toLowerCase(),
        role: effectiveRoleKey,
        full_name: currentRoleObj?.label || 'Pengguna Terverifikasi',
      };
      try {
        sessionStorage.setItem("luwu_cached_profile_data", JSON.stringify(initialProfile));
      } catch (e) {}
      
      // Explicitly set the session on the frontend client if provided
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        
        // Save as cookie for Server-Side Middleware
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=None; Secure`;
      }

      const targetUrl = currentRoleObj?.targetUrl || (effectiveRoleKey === "masyarakat" ? "/masyarakat-dashboard" : effectiveRoleKey === "investor" ? "/investor-dashboard" : "/dashboard");
      
      onLogin(data.role as Role || selectedRole);
      
      // Navigate to respective dashboard
      setTimeout(() => {
        window.location.replace(targetUrl);
      }, 300);
    } catch (err) {
      setErrorMsg("Gagal terhubung ke server autentikasi. Pastikan koneksi internet stabil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-slate-950 text-slate-100 overflow-hidden font-sans animate-fade-in">
      
      {/* LEFT COLUMN - 55% (Desktop Showcase) */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800">
        
        {/* Background Map & Grid Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')" }}
        />
        <div className="absolute inset-0 z-0 bg-slate-950/85 backdrop-blur-[2px]" />
        
        {/* Animated Grid / Spatial Network Lines */}
        <div className="absolute inset-0 z-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-full h-full opacity-30 pointer-events-none flex justify-center items-center">
            <div className="w-[600px] h-[600px] border border-emerald-500/30 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            <div className="absolute w-[400px] h-[400px] border border-emerald-500/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        </div>

        {/* Top Header Left */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-white shadow-lg border border-slate-700">
            <LuwuLogo size="sm" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-emerald-400 uppercase">
              PORTAL INVESTASI LUWU
            </h1>
            <p className="text-xs font-mono tracking-wider font-semibold text-slate-400">
              Smart Spatial Intelligence & E-Office Platform
            </p>
          </div>
        </div>

        {/* Center Title Content */}
        <div className="relative z-10 max-w-2xl mt-auto mb-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 mb-6 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-300">Multi-Role RBAC Active</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] mb-4 drop-shadow-2xl">
            Sistem Terpadu Lintas OPD & <br />
            <span className="text-emerald-400">
              Dashboard Spesifik Peran
            </span>
          </h2>
          <p className="text-base text-slate-300 leading-relaxed font-normal max-w-xl">
            Akses langsung menuju dashboard sesuai kewenangan: Dinas PUPTR (Tata Ruang & GIS), Dinas Pertanian (Lahan LP2B), DPMPTSP (OSS & Dalak), Investor, dan Layanan Publik Masyarakat.
          </p>
        </div>

        {/* Bottom Realtime Stats */}
        <div className="relative z-10 grid grid-cols-4 gap-4 mt-6 border-t border-slate-800 pt-6 backdrop-blur-sm rounded-3xl">
          {[
            { icon: <Database className="h-5 w-5 text-emerald-400"/>, label: "Sektor Unggulan", value: "12" },
            { icon: <Map className="h-5 w-5 text-emerald-400"/>, label: "Zona Investasi", value: "40" },
            { icon: <Globe className="h-5 w-5 text-emerald-400"/>, label: "Layer Spasial", value: "142" },
            { icon: <Cpu className="h-5 w-5 text-emerald-500"/>, label: "Akurasi AI", value: "98%" },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-2xl font-black text-white">{stat.value}</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN - 45% (Login Gateway & Role Presets) */}
      <div className="w-full lg:w-[45%] flex flex-col relative justify-between items-center bg-slate-950 p-4 sm:p-8 min-h-[100dvh] overflow-y-auto custom-scrollbar">
        
        {/* Background ambient glow for right column */}
        <div className="absolute top-0 right-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Close Button Mobile/Desktop */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-slate-400 hover:text-white bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 rounded-xl transition-all shadow-lg z-50 active:scale-95 cursor-pointer"
          title="Tutup / Kembali ke Beranda"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Center Card Content Container */}
        <div className="w-full max-w-[440px] flex flex-col my-auto relative z-10 pt-4 pb-4">
          
          {/* Header & Logo */}
          <div className="mb-4 text-center">
            <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-slate-900/90 rounded-2xl flex items-center justify-center mb-2 shadow-xl border border-emerald-500/30 relative group backdrop-blur-md">
              <LuwuLogo size="sm" />
            </div>
            <h3 className="text-xl sm:text-2xl font-sans font-black text-white mb-0.5 tracking-tight">Login Portal Peran</h3>
            <p className="text-xs text-slate-400 font-medium">
              Pilih peran Anda untuk masuk langsung ke dashboard terkait
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 p-4 sm:p-6 rounded-3xl shadow-2xl shadow-black">
            
            {/* MULTI-ROLE SELECTOR TILES */}
            <div className="mb-4">
              <label className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest mb-1.5 ml-1">
                Pilih Peran / OPD:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-inner">
                {ROLE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedRole === preset.role;
                  return (
                    <button
                      key={preset.roleKey}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all active:scale-95 cursor-pointer border ${
                        isSelected 
                          ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/60 shadow-md scale-[1.02]" 
                          : "bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} />
                      <span className="text-[11px] font-bold leading-tight block">{preset.label}</span>
                      <span className="text-[8.5px] opacity-75 font-mono truncate max-w-full block">{preset.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="login-username" className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest mb-1 ml-1">
                  Email / Akun Dinas
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nama@luwukab.go.id"
                    className="w-full bg-slate-950/70 border border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest mb-1 ml-1">
                  Kata Sandi
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/70 border border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs sm:text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Ergonomic Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[46px] bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 active:scale-[0.98] text-white rounded-xl py-2.5 px-4 font-bold uppercase tracking-wider text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 group cursor-pointer border border-emerald-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akses Role...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard {ROLE_PRESETS.find(p => p.role === selectedRole)?.label || "Role"}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Micro Security Pills */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              "SSL 256-Bit Secured", 
              "Pertek PUPTR Ready",
              "BAP Pertanian LP2B",
              "Role-Based Access Control"
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono tracking-tight bg-slate-900/40 border border-slate-800/60 py-1 px-2 rounded-lg">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="truncate">{badge}</span>
              </div>
            ))}
          </div>

          {/* Footer Signature */}
          <div className="mt-3 text-center">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                PEMERINTAH KABUPATEN LUWU
             </h4>
             <p className="text-[9px] text-slate-500 font-mono">
               Sistem Informasi Spasial & Pelayanan Perizinan Terpadu
             </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ux polish: contextual login routing and hero button text
// hotfix: fix floating navbar, apply light mode to auth, and translate OSS simulator
