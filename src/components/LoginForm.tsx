import { requestSmartFullscreen } from "../utils/fullscreen.js";
import React, { useState, useEffect } from "react";
import { X, Shield, Lock, User, ArrowRight, Map, Globe, Database, Cpu, CheckCircle2 } from "lucide-react";
import { Role } from "../types.js";
import { LuwuLogo } from "./LuwuLogo.js";
import { supabase } from "../lib/supabaseClient.js";
import { isMobileOrAndroidDevice } from "../hooks/useDeviceAutomation.js";

interface LoginFormProps {
  onLogin: (role: Role) => void;
  onClose: () => void;
}

export default function LoginForm({ onLogin, onClose }: LoginFormProps) {
  useEffect(() => {
    if (!isMobileOrAndroidDevice()) return; // Desktop/Laptop exception

    const handleFirstInteraction = () => {
      if (!document.fullscreenElement) {
        const elem = document.documentElement as any;
        requestSmartFullscreen();
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  const [selectedRole, setSelectedRole] = useState<Role>(Role.OPERATOR);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {

      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: selectedRole })
      });
      const data = await response.json();
      if (!data.success) {

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
      console.error("Login error:", err);

    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-slate-950 text-slate-100 overflow-hidden font-sans animate-fade-in">
      
      {/* LEFT COLUMN - 60% */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        
        {/* Background Map & Grid Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')" }}
        />
        <div className="absolute inset-0 z-0 bg-slate-950/80 backdrop-blur-[2px]" />
        
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
          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]">
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 mb-6 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-300">System Online</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-2xl">
            Government Investment & <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Geospatial Analytics System
            </span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed font-light max-w-xl">
            Sistem Informasi Geospasial Enterprise Kabupaten Luwu. Dirancang untuk memfasilitasi pengambilan keputusan strategis, analisis spasial presisi tinggi, dan pemetaan investasi komprehensif.
          </p>
        </div>

        {/* Bottom Realtime Stats */}
        <div className="relative z-10 grid grid-cols-4 gap-6 mt-8 border-t border-white/10 pt-8 backdrop-blur-sm rounded-3xl">
          {[
            { icon: <Database className="h-5 w-5 text-emerald-400"/>, label: "Sektor Unggulan", value: "12" },
            { icon: <Map className="h-5 w-5 text-teal-400"/>, label: "Zona Investasi", value: "40" },
            { icon: <Globe className="h-5 w-5 text-indigo-400"/>, label: "Layer Spasial", value: "142" },
            { icon: <Cpu className="h-5 w-5 text-purple-400"/>, label: "Akurasi AI", value: "98%" },
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

      {/* RIGHT COLUMN - 40% */}
      <div className="w-full lg:w-[40%] flex flex-col relative justify-center items-center bg-slate-950 p-6 sm:p-12 h-screen overflow-y-auto custom-scrollbar">
        
        {/* Background ambient glow for right column */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Close Button Mobile/Desktop */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 text-slate-400 hover:text-white bg-slate-900 border border-white/10 hover:border-white/20 rounded-xl transition-all shadow-lg z-50"
          title="Tutup / Kembali ke Beranda"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="w-full max-w-[420px] flex flex-col h-full justify-center relative z-10 mt-12 mb-12 lg:my-0">
          
          <div className="mb-10 text-center lg:text-left">
            <div className="mx-auto lg:mx-0 w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/10 relative group">
              <LuwuLogo size="md" />
            </div>
            <h3 className="text-3xl font-sans font-black text-white mb-2 tracking-tight">Secure Gateway</h3>
            <p className="text-sm text-slate-400 font-light">
              Portal Investasi Luwu Enterprise Access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[24px] shadow-2xl shadow-black">
            
            {/* Role Selection */}
            <div className="flex bg-slate-950/60 p-1.5 rounded-2xl mb-8 border border-white/5">
              <button
                type="button"
                onClick={() => setSelectedRole(Role.OPERATOR)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  selectedRole === Role.OPERATOR 
                    ? "bg-slate-800 text-emerald-400 border border-white/10 shadow-md" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole(Role.SUPER_ADMIN)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  selectedRole === Role.SUPER_ADMIN 
                    ? "bg-slate-800 text-emerald-400 border border-white/10 shadow-md" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Super Admin
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email / Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-[14px] h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nama@luwu.go.id"
                    className="w-full bg-slate-950/80 border border-white/10 text-white placeholder-slate-600 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-[14px] h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full bg-slate-950/80 border border-white/10 text-white placeholder-slate-600 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 rounded-2xl py-4 font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 group"
            >
              Masuk ke Dashboard
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Security Badges */}
          <div className="mt-8 grid grid-cols-2 gap-y-3 gap-x-2">
            {[
              "SSL Secured", 
              "Audit Trail Enabled",
              "Role Based Access Control",
              "Spatial Data Protected"
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-500 text-[10px] font-mono tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70" />
                <span>{badge}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center lg:text-left">
             <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5 flex items-center justify-center lg:justify-start gap-2">
                <span className="h-px w-6 bg-slate-700 hidden lg:block"></span>
                PEMERINTAH KABUPATEN LUWU
             </h4>
             <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
               Dinas Penanaman Modal dan PTSP<br/>
               Official Spatial Intelligence Platform © {new Date().getFullYear()}
             </p>
          </div>

        </div>
      </div>
    </div>
  );
}
// ux polish: contextual login routing and hero button text
// hotfix: fix floating navbar, apply light mode to auth, and translate OSS simulator
