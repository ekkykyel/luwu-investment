import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface SpatialErrorBannerProps {
  message?: string | null;
  retryCount?: number;
  onRetry: () => void;
  isDarkMode?: boolean;
}

export const SpatialErrorBanner: React.FC<SpatialErrorBannerProps> = ({
  message,
  retryCount = 0,
  onRetry,
  isDarkMode = true,
}) => {
  return (
    <div className={`fixed top-20 left-4 right-4 z-50 max-w-xl mx-auto flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md shadow-xl border text-sm transition-all duration-300 ${
      isDarkMode 
        ? "bg-red-950/90 border-red-500/30 text-red-200" 
        : "bg-red-50 border-red-200 text-red-800"
    }`}>
      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-xs sm:text-sm">Gagal Memuat Data Spasial</div>
        <div className="text-[11px] opacity-80 truncate">
          {message || "Sistem menggunakan data cadangan lokal. Silakan coba muat ulang."}
        </div>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-xs font-semibold transition-all border border-red-500/30 shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Coba Lagi</span>
      </button>
    </div>
  );
};

export default SpatialErrorBanner;
