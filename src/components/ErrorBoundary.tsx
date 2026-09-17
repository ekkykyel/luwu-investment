import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  sectionName: string;
  isDark?: boolean;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log ke console dengan konteks yang jelas untuk debugging Android
    console.error(
      `[SectionErrorBoundary] Section "${this.props.sectionName}" gagal render:\n`,
      error,
      "\nComponent Stack:\n",
      errorInfo.componentStack
    );

    // Kirim ke error monitoring jika tersedia (Sentry, dsb)
    if (typeof window !== "undefined" && (window as any).__errorReporter) {
      (window as any).__errorReporter({
        section: this.props.sectionName,
        error: error.message,
        stack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleRetry = () => {
    const isModuleError = 
      this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
      this.state.error?.message?.includes("Importing a module script failed") ||
      this.state.error?.message?.includes("dynamically imported module");
      
    if (isModuleError && typeof window !== "undefined") {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  render() {
    if (this.state.hasError) {
      // Gunakan custom fallback jika disediakan
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isDark = this.props.isDark ?? true;

      // Fallback UI default — tidak mengganggu layout
      return (
        <div
          className={`w-full py-8 px-4 flex flex-col items-center justify-center gap-3 rounded-2xl border
            ${isDark
              ? "bg-slate-900/40 border-slate-800 text-slate-400"
              : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
        >
          <div className={`p-3 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 2L2 17h16L10 2z"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinejoin="round" fill="none"
              />
              <path d="M10 8v4M10 14v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium mb-1">
              Bagian ini tidak dapat dimuat
            </p>
            <p className="text-xs opacity-70">
              {this.props.sectionName}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className={`mt-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors
              ${isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
              }`}
          >
            Coba lagi
          </button>

          {/* Debug info — hanya tampil di development */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-2 w-full max-w-md">
              <summary className="text-xs cursor-pointer opacity-60 hover:opacity-100">
                Debug info (dev only)
              </summary>
              <pre className={`mt-2 p-3 rounded-lg text-[10px] overflow-auto max-h-32
                ${isDark ? "bg-slate-950 text-red-400" : "bg-slate-100 text-red-600"}`}>
                {this.state.error.message}
                {"\n\n"}
                {this.state.errorInfo?.componentStack?.slice(0, 500)}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC wrapper untuk convenience
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  sectionName: string
) {
  return function WithErrorBoundaryWrapper(props: P & { isDark?: boolean }) {
    return (
      <SectionErrorBoundary sectionName={sectionName} isDark={props.isDark}>
        <WrappedComponent {...props} />
      </SectionErrorBoundary>
    );
  };
}
