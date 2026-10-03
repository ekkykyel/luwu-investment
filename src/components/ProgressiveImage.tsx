import React, { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  loading?: "lazy" | "eager";
  fallbackIcon?: React.ReactNode;
  objectFit?: "cover" | "contain" | "fill";
}

/**
 * ProgressiveImage - High Performance Lazy Loading & Shimmer Placeholder Component
 * Optimized for Mobile Devices and Slow Networks
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-full relative overflow-hidden",
  loading = "lazy",
  fallbackIcon,
  objectFit = "cover"
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className={containerClassName}>
      {/* SHIMMER PROGRESSIVE SKELETON PLACEHOLDER */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200/80 dark:bg-slate-800/80 animate-pulse flex items-center justify-center z-10">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-shimmer" />
        </div>
      )}

      {/* ERROR FALLBACK STATE */}
      {hasError ? (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/60 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 p-2 z-10">
          {fallbackIcon || <ImageOff className="w-6 h-6 opacity-40 mb-1" />}
          <span className="text-[10px] opacity-60 text-center font-mono">Gambar tidak tersedia</span>
        </div>
      ) : (
        /* ACTUAL IMAGE WITH LAZY LOADING & BLUR-TO-CLEAR TRANSITION */
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-all duration-700 ease-out ${
            isLoaded
              ? "opacity-100 blur-0 scale-100"
              : "opacity-0 blur-md scale-105"
          }`}
          style={{ objectFit }}
        />
      )}
    </div>
  );
};

export default ProgressiveImage;
