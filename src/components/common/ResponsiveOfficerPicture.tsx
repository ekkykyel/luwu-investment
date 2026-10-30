import React, { useState, useEffect, useRef } from 'react';
import { OFFICER_IMAGES_METADATA, getOfficerSrcset } from '../../utils/officerImageMetadata';

export interface ResponsiveOfficerPictureProps {
  officerKey?: 'officer-left' | 'officer-right';
  customSrc?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  requireDatabaseSrc?: boolean;
}

const SILHOUETTE_FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 320' fill='none'%3E%3Crect width='240' height='320' rx='24' fill='%230f172a' fill-opacity='0.08'/%3E%3Ccircle cx='120' cy='95' r='42' fill='%2310b981' fill-opacity='0.25' stroke='%23059669' stroke-width='2'/%3E%3Cpath d='M45 280 C45 200, 80 160, 120 160 C160 160, 195 200, 195 280 Z' fill='%2310b981' fill-opacity='0.2' stroke='%23059669' stroke-width='2'/%3E%3C/svg%3E";

export const ResponsiveOfficerPicture: React.FC<ResponsiveOfficerPictureProps> = ({
  officerKey = 'officer-left',
  customSrc,
  alt,
  className = '',
  containerClassName = '',
  requireDatabaseSrc = true,
}) => {
  const meta = OFFICER_IMAGES_METADATA[officerKey];
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isEager, setIsEager] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check user preference for reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  // 1.4: Preload before visible via requestIdleCallback (respecting saveData)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip if saveData mode is active
    const nav = navigator as any;
    if (nav.connection && nav.connection.saveData) {
      return;
    }

    const idleCallback = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 1500));
    const handle = idleCallback(() => {
      // Decode image in background cache
      if (!customSrc) {
        const testImg = new Image();
        testImg.decoding = 'async';
        testImg.srcset = getOfficerSrcset(officerKey, 'webp');
        testImg.sizes = '(max-width: 640px) 180px, 240px';
        testImg.src = meta.variants[480].webp.path;
        testImg.decode?.().catch(() => {});
      }
    });

    return () => {
      if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, [officerKey, customSrc, meta]);

  // 1.4: IntersectionObserver with rootMargin '1200px 0px' to upgrade loading to eager when approaching
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsEager(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '1200px 0px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 1.5: Error fallback with auto-retry after 3 seconds (max 1 retry)
  const handleError = () => {
    setHasError(true);
    if (retryCount < 1) {
      const timer = setTimeout(() => {
        setRetryCount((c) => c + 1);
        setHasError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  };

  const isCustom = Boolean(customSrc && customSrc.startsWith('http') && !customSrc.includes('placeholder'));
  const avifSrcSet = getOfficerSrcset(officerKey, 'avif');
  const webpSrcSet = getOfficerSrcset(officerKey, 'webp');
  const jpgSrcSet = getOfficerSrcset(officerKey, 'jpg');
  const defaultJpg = meta.variants[480].jpg.path;
  const sizes = '(max-width: 640px) 180px, (max-width: 1024px) 220px, 260px';

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/5] overflow-hidden rounded-2xl flex items-end justify-center select-none ${containerClassName}`}
      style={{ backgroundColor: meta.dominantColor || '#0A2238' }}
    >
      {/* 1.5: LQIP Base64 Blur Placeholder (< 1 KB) */}
      {!hasError && (
        <img
          src={meta.lqip}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover object-center filter blur-md transform scale-105 pointer-events-none transition-opacity duration-300 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Silhouette Fallback when Error */}
      {hasError && (
        <img
          src={SILHOUETTE_FALLBACK_SVG}
          alt={alt}
          className="absolute inset-0 w-full h-full object-contain object-bottom pointer-events-none p-4"
        />
      )}

      {/* Main Responsive Image / Picture */}
      {!hasError && (
        isCustom ? (
          <img
            key={`custom-${retryCount}`}
            src={customSrc!}
            alt={alt}
            width={480}
            height={600}
            loading={isEager ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
            className={`w-full h-full object-cover object-top transition-opacity ${
              prefersReducedMotion ? 'duration-0' : 'duration-300'
            } ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          />
        ) : requireDatabaseSrc ? (
          <img
            src={SILHOUETTE_FALLBACK_SVG}
            alt={alt}
            className="absolute inset-0 w-full h-full object-contain object-bottom pointer-events-none p-4 opacity-70"
          />
        ) : (
          <picture className="w-full h-full flex items-end justify-center">
            <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
            <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
            <source type="image/jpeg" srcSet={jpgSrcSet} sizes={sizes} />
            <img
              key={`local-${retryCount}`}
              src={defaultJpg}
              alt={alt}
              width={480}
              height={600}
              loading={isEager ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              onError={handleError}
              style={{ aspectRatio: '4 / 5' }}
              className={`w-full h-full object-cover object-top transition-opacity ${
                prefersReducedMotion ? 'duration-0' : 'duration-300'
              } ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
            />
          </picture>
        )
      )}
    </div>
  );
};
