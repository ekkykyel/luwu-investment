import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Activity, Sparkles, Building } from 'lucide-react';

export default function TickerMarquee() {
  const items = [
    { text: "Potensi Investasi Luwu 2026: Sektor Pertanian & Perkebunan", icon: <TrendingUp className="w-3 h-3 text-emerald-500" /> },
    { text: "Pembaruan Zonasi: Peluang Kawasan Industri Baru", icon: <Building className="w-3 h-3 text-blue-500" /> },
    { text: "Kemudahan Izin Investasi dengan OSS & Spatial Editor", icon: <Sparkles className="w-3 h-3 text-amber-500" /> },
    { text: "Infrastruktur Terkoneksi: Akses Pelabuhan & Bandara Bua", icon: <Activity className="w-3 h-3 text-indigo-500" /> }
  ];

  return (
    <div className="w-full bg-slate-900 text-slate-300 py-1.5 overflow-hidden flex items-center relative z-[100] border-b border-slate-800">
      <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center mx-6">
            <span className="mr-2">{item.icon}</span>
            <span className="text-[11px] font-medium tracking-wide">{item.text}</span>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}} />
    </div>
  );
}
