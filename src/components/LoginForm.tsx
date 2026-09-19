import { requestSmartFullscreen } from "../utils/fullscreen";
import React, { useState, useEffect } from "react";
import { X, Shield, Lock, User, ArrowRight, Map, Globe, Database, Cpu, CheckCircle2, Eye, EyeOff, AlertCircle, Sparkles, UserCheck } from "lucide-react";
import { Role } from "../types";
import { LuwuLogo } from "./LuwuLogo";
import { supabase } from "../lib/supabaseClient";
import { isMobileOrAndroidDevice } from "../hooks/useDeviceAutomation";

interface LoginFormProps {
  onLogin: (role: Role) => void;
  onClose: () => void;
}

export default function LoginForm({ onLogin, onClose }: LoginFormProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(Role.OPERATOR);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
      if (data.token) {
        localStorage.setItem("luwu_session_token", data.token);
      }
      
      // Explicitly set the session on the frontend client if provided
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        
        // Save as cookie for Server-Side Middleware
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=None; Secure`;
      }

      onLogin(data.role as Role || selectedRole);
    } catch (err) {
      setErrorMsg("Gagal terhubung ke server autentikasi. Pastikan koneksi internet stabil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-slate-950 text-slate-100 overflow-hidden font-sans animate-fade-in">
      
      {/* LEFT COLUMN - 60% (Desktop Showcase) */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800">
        
        {/* Background Map & Grid Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')" }}
        />
        <div className="absolute inset-0 z-0 bg-slate-950/85 backdrop-blur-[2px]" />
        
        {/* Animated Grid / Spacial Network Lines */}
        <div className="absolute inset-0 z-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-full h-full opacity-30 pointer-events-none flex justify-center items-center">
            <div className="w-[600px] h-[600px] border border-emerald-500/30 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            <div className="absolute w-[400px] h-[400px] border border-emerald-500/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            
            {/* Animated network lines SVG */}
            <svg className="absolute inset-0 w-full h-full rotate-45 opacity-50" viewBox="0 0 100 100" preserveAspectRatio="none">
               <line x1="20" y1="20" x2="80" y2="80" stroke="rgba(16,185,129,0.2)" strokeWidth="0.2" className="animate-pulse" />
               <line x1="80" y1="20" x2="20" y2="80" stroke="rgba(16,185,129,0.2)" strokeWidth="0.2" className="animate-pulse" style={{ animationDelay: '1s' }} />
               <circle cx="50" cy="50" r="1" fill="#10b981" className="animate-ping" />
            </svg>
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
              Smart Spatial Intelligence Platform
            </p>
          </div>
        </div>

        {/* Center Title Content */}
        <div className="relative z-10 max-w-2xl mt-auto mb-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 mb-6 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-300">System Online</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-6 drop-shadow-2xl">
            Government Investment & <br className="hidden md:block" />
            <span className="text-emerald-400">
              Geospatial Analytics System
            </span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed font-normal max-w-xl">
            Sistem Informasi Geospasial Enterprise Kabupaten Luwu. Dirancang untuk memfasilitasi pengambilan keputusan strategis, analisis spasial presisi tinggi, dan pemetaan investasi komprehensif.
          </p>
        </div>

        {/* Bottom Realtime Stats */}
        <div className="relative z-10 grid grid-cols-4 gap-6 mt-8 border-t border-slate-800 pt-8 backdrop-blur-sm rounded-3xl">
          {[
            { icon: <Database className="h-5 w-5 text-emerald-400"/>, label: "Sektor Unggulan", value: "12" },
            { icon: <Map className="h-5 w-5 text-emerald-400"/>, label: "Zona Investasi", value: "40" },
            { icon: <Globe className="h-5 w-5 text-emerald-400"/>, label: "Layer Spasial", value: "142" },
            { icon: <Cpu className="h-5 w-5 text-emerald-500"/>, label: "Akurasi AI", value: "98%" },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-3xl font-black text-white">{stat.value}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN - 40% (Mobile/Android Optimized Gateway) */}
      <div className="w-full lg:w-[40%] flex flex-col relative justify-between items-center bg-slate-950 p-4 sm:p-8 min-h-[100dvh] overflow-y-auto custom-scrollbar">
        
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
        <div className="w-full max-w-[390px] sm:max-w-[420px] flex flex-col my-auto relative z-10 pt-6 pb-4">
          
          {/* Header & Logo */}
          <div className="mb-4 sm:mb-6 text-center">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-slate-900/90 rounded-2xl flex items-center justify-center mb-3 shadow-xl border border-emerald-500/30 relative group backdrop-blur-md">
              <LuwuLogo size="md" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-sans font-black text-white mb-1 tracking-tight">Secure Gateway</h3>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Portal Investasi Luwu Enterprise Access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 p-5 sm:p-7 rounded-3xl shadow-2xl shadow-black">
            
            {/* SEGMENTED ROLE SELECTION */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/90 rounded-2xl mb-5 border border-slate-800 gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(Role.OPERATOR);
                  setErrorMsg("");
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer ${
                  selectedRole === Role.OPERATOR 
                    ? "bg-slate-800/90 text-emerald-400 border border-emerald-500/30 shadow-md" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Operator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(Role.SUPER_ADMIN);
                  setErrorMsg("");
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer ${
                  selectedRole === Role.SUPER_ADMIN 
                    ? "bg-slate-800/90 text-amber-300 border border-amber-500/30 shadow-md" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Fields with Android-Friendly Keyboard Attributes */}
            <div className="space-y-3.5 mb-5">
              <div>
                <label htmlFor="login-username" className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest mb-1.5 ml-1">
                  Email / Username
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
                    placeholder="nama@luwu.go.id"
                    className="w-full bg-slate-950/70 border border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl pl-10 pr-3.5 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest mb-1.5 ml-1">
                  Password
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
                    className="w-full bg-slate-950/70 border border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs sm:text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Ergonomic 48px Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 active:scale-[0.98] text-white rounded-xl py-3 px-4 font-bold uppercase tracking-wider text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 group cursor-pointer border border-emerald-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Micro Security Pills */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              "SSL 256-Bit Secured", 
              "Audit Trail Active",
              "Role-Based Access Control",
              "Spatial Data Protected"
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono tracking-tight bg-slate-900/40 border border-slate-800/60 py-1 px-2 rounded-lg">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="truncate">{badge}</span>
              </div>
            ))}
          </div>

          {/* Footer Signature */}
          <div className="mt-4 sm:mt-6 text-center">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                PEMERINTAH KABUPATEN LUWU
             </h4>
             <p className="text-[9px] text-slate-500 font-mono">
               Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP)
             </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ux polish: contextual login routing and hero button text
// hotfix: fix floating navbar, apply light mode to auth, and translate OSS simulator
