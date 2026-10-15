import React, { useState, useEffect } from 'react';
import { Map, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface GisTransitionLoaderProps {
  onComplete?: () => void;
}

const LAYER_MESSAGES = [
  "INITIALIZING SPATIAL ENGINE v3.0...",
  "ESTABLISHING SECURE SATELLITE UPLINK...",
  "CALIBRATING GEOSPATIAL COORDINATES...",
  "RENDERING TOPOLOGICAL MESH...",
  "EXTRACTING INVESTMENT DATA NODES...",
  "APPLYING NEURAL NETWORK FILTERS...",
  "SYSTEM OPTIMAL. ENTERING WORKSPACE."
];

// Helper to generate random hex strings for the data stream
const generateHex = () => Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');

const GisTransitionLoader: React.FC<GisTransitionLoaderProps> = ({ onComplete }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hexStream, setHexStream] = useState<string[]>(Array(5).fill('000000'));

  useEffect(() => {
    const totalDuration = 1600; // Snappy 1.6 seconds for responsive UX
    const intervalTime = totalDuration / LAYER_MESSAGES.length;

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev < LAYER_MESSAGES.length - 1 ? prev + 1 : prev));
    }, intervalTime);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + (100 / (totalDuration / 40))));
    }, 40);

    const hexInterval = setInterval(() => {
      setHexStream(Array(5).fill(0).map(generateHex));
    }, 120);

    const completionTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, totalDuration + 150);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearInterval(hexInterval);
      clearTimeout(completionTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#030712] overflow-hidden font-mono selection:bg-cyan-500/30"
    >
      {/* Skip button for instant entry */}
      <button
        type="button"
        onClick={() => onComplete && onComplete()}
        className="absolute top-6 right-6 z-30 px-3.5 py-1.5 rounded-full text-xs font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900/90 hover:border-cyan-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.25)]"
      >
        <span>Lewati</span>
        <ArrowRight size={12} />
      </button>

      {/* 1. Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

      {/* 2. Ambient Deep Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 3. Corner Data Streams (Futuristic detail) */}
      <div className="absolute top-8 left-8 text-[10px] text-cyan-500/50 leading-relaxed hidden md:block">
        <p className="font-bold text-cyan-400 mb-2">SYS.OP.DATA</p>
        {hexStream.map((hex, i) => <p key={i}>0x{hex} : MESH_NODE_{i}</p>)}
      </div>
      <div className="absolute bottom-8 right-8 text-[10px] text-cyan-500/50 text-right leading-relaxed hidden md:block">
        <p className="font-bold text-cyan-400 mb-2">SPATIAL.UPLINK</p>
        <p>LAT: -3.3402&deg; S</p>
        <p>LNG: 120.2521&deg; E</p>
        <p>ALT: 24m MSL</p>
        <p>STS: <span className="text-emerald-700 dark:text-emerald-400 animate-pulse">ACTIVE</span></p>
      </div>

      {/* MAIN HUD SCANNER */}
      <div className="relative w-64 h-64 md:w-72 md:h-72 mb-16 flex items-center justify-center">
        
        {/* Outer Hairline Rings */}
        <div className="absolute inset-0 border border-cyan-500/20 rounded-full" />
        <div className="absolute inset-2 border border-cyan-500/10 rounded-full" />

        {/* The Conical Radar Sweep */}
        <div 
            className="absolute inset-0 rounded-full [background:conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(34,211,238,0.3)_360deg)]"
            style={{ animation: 'spin 2s linear infinite' }}
        />
        
        {/* Rotating Dash Ring (Outer) */}
        <div 
            className="absolute inset-6 border-[2px] border-dashed border-cyan-400/40 rounded-full"
            style={{ animation: 'spin 10s linear infinite' }}
        />

        {/* Counter-Rotating Dot Ring (Inner) */}
        <div 
            className="absolute inset-12 border-[2px] border-dotted border-blue-400/60 rounded-full"
            style={{ animation: 'spin 7s linear infinite reverse' }}
        />

        {/* Center Geometric Container & Icon */}
        <div className="relative z-10 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-cyan-950/60 rounded-2xl border border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-sm overflow-hidden" style={{ animation: 'pulse-slow 3s infinite' }}>
            <div className="absolute inset-0 bg-cyan-400/20" style={{ animation: 'scan-vertical 1.5s ease-in-out infinite' }} />
            <Map className="w-8 h-8 md:w-10 md:h-10 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" strokeWidth={1.5} />
        </div>

        {/* Crosshair Bracket Corners */}
        <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t-2 border-l-2 border-cyan-400/70 -translate-x-2 -translate-y-2 md:-translate-x-4 md:-translate-y-4" />
        <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-t-2 border-r-2 border-cyan-400/70 translate-x-2 -translate-y-2 md:translate-x-4 md:-translate-y-4" />
        <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-b-2 border-l-2 border-cyan-400/70 -translate-x-2 translate-y-2 md:-translate-x-4 md:translate-y-4" />
        <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b-2 border-r-2 border-cyan-400/70 translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4" />
      </div>

      {/* TEXT & PROGRESS BARS */}
      <div className="relative z-10 w-full max-w-xs md:max-w-lg text-center px-4">
        
        <div className="flex justify-between items-end mb-2">
            <span className="text-[9px] md:text-[10px] text-cyan-500/60 font-bold tracking-widest uppercase">Sys.Boot</span>
            <span className="text-[9px] md:text-[10px] text-cyan-400 font-bold tracking-widest">{Math.round(progress)}%</span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="w-full h-1.5 flex gap-1 bg-transparent">
            {Array.from({ length: 20 }).map((_, i) => {
                const isActive = (i / 20) * 100 <= progress;
                return (
                    <div 
                        key={i} 
                        className={`flex-1 h-full rounded-sm transition-colors duration-75 ${
                            isActive ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-800'
                        }`}
                    />
                );
            })}
        </div>

        {/* Typewriter Dynamic Text */}
        <div className="mt-6 h-6 flex items-center justify-center">
          <p className="text-[10px] md:text-xs text-cyan-300/80 font-mono tracking-widest uppercase relative inline-block">
            {LAYER_MESSAGES[messageIndex]}
            <span className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 animate-pulse align-middle" />
          </p>
        </div>

      </div>

      <style>{`
        @keyframes scan-vertical {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes pulse-slow {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
      `}</style>
    </motion.div>
  );
};

export default GisTransitionLoader;
