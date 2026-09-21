import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Layers, ShieldAlert } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  componentName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GisErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GIS Analytic / Spatial Component Error Caught by Boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        console.error("Error in onReset callback:", err);
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || "Komponen bermasalah";
      const message =
        this.props.fallbackMessage ||
        "Gagal memuat analitik spasial: Data tidak tersedia atau koneksi terputus. Sistem telah mengamankan tampilan agar tidak terjadi crash layar.";
      const componentName = this.props.componentName || "Modul GIS / Analitik";

      return (
        <div
          id="gis-error-boundary-fallback"
          className="w-full my-4 p-6 sm:p-8 rounded-3xl bg-slate-900/90 dark:bg-slate-950/95 border border-rose-500/30 text-slate-100 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-in fade-in duration-300"
        >
          {/* Subtle ambient light */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner shrink-0">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                  {componentName}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Perlindungan Error Spasial Aktif
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {message}
              </p>
              {this.state.error?.message && (
                <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-rose-300/90 break-all">
                  Detail: {this.state.error.message}
                </div>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Muat Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GisErrorBoundary;
