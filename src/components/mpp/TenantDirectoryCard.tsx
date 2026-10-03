import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface TenantInfo {
  id?: string | number;
  name: string;
  description: string;
  logo: string;
  category?: string;
  counter?: string;
  rawItem?: any;
}

export interface TenantDirectoryCardProps {
  tenant: TenantInfo;
  onSelect?: (tenant: TenantInfo) => void;
  className?: string;
}

const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='24' fill='%2310b981' fill-opacity='0.15'/%3E%3Cpath d='M60 30L35 48V90H85V48L60 30Z' stroke='%23059669' stroke-width='6' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E";

export const TenantDirectoryCard: React.FC<TenantDirectoryCardProps> = ({
  tenant,
  onSelect,
  className = ''
}) => {
  return (
    <div 
      className={`relative p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col items-center text-center overflow-hidden ${className}`}
    >
      {/* Status Badge (Pojok Kanan Atas Kartu) */}
      <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Aktif
      </div>

      {/* Logo Container (Wadah Logo Clean & Glassmorphism) */}
      <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 flex items-center justify-center p-3 shadow-inner mt-2">
        <img 
          src={tenant.logo} 
          alt={tenant.name} 
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_LOGO;
          }}
        />
      </div>

      {/* Tenant Details */}
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">{tenant.name}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug max-w-[250px] mx-auto line-clamp-2">{tenant.description}</p>
      </div>

      {/* Card Action Button (Tombol Masuk Detail) */}
      <button 
        type="button"
        onClick={() => onSelect?.(tenant)}
        className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
      >
        <span>Lihat Layanan</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TenantDirectoryCard;
