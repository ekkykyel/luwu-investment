import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon } from "lucide-react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  isDark?: boolean;
}

export default function LazyImage({ 
  src, 
  alt, 
  className = "", 
  imgClassName = "", 
  isDark = true, 
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setShouldLoad(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin: "250px" } // trigger 250px before entering viewport
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    } else {
      setShouldLoad(true);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden w-full h-full ${className}`}
    >
      {/* Pulse placeholder while loading */}
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 animate-pulse flex items-center justify-center ${
          isDark ? 'bg-slate-850/80 text-slate-500' : 'bg-slate-100 text-slate-400'
        }`}>
          <div className="flex flex-col items-center gap-1.5">
            <ImageIcon className="w-6 h-6 animate-bounce" />
            <span className="text-[9px] uppercase font-bold tracking-widest">Memuat...</span>
          </div>
        </div>
      )}

      {/* Fallback boundary when error loading */}
      {hasError ? (
        <div className={`absolute inset-0 flex flex-col items-center justify-center text-center p-3 ${
          isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'
        }`}>
          <ImageIcon className="w-7 h-7 text-slate-500 mb-1" />
          <span className="text-[10px] text-slate-500 font-semibold">Tautan tidak valid</span>
        </div>
      ) : (
        shouldLoad && (
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-all duration-700 ease-out ${
              isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
            } ${imgClassName}`}
            {...props}
          />
        )
      )}
    </div>
  );
}
