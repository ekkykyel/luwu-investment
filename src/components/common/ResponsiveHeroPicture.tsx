import React, { useState } from 'react';
import { HERO_METADATA, type HeroMetadataItem } from '../../utils/heroImageMetadata';

export interface ResponsiveHeroPictureProps {
  heroKey: 'investasi' | 'mpp';
  alt: string;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
  customSrc?: string;
  objectPositionClass?: string;
}

export const ResponsiveHeroPicture: React.FC<ResponsiveHeroPictureProps> = ({
  heroKey,
  alt,
  className = '',
  priority = true,
  style = {},
  customSrc,
  objectPositionClass = 'object-[center_top]',
}) => {
  const meta: HeroMetadataItem = HERO_METADATA[heroKey];
  const [isLoaded, setIsLoaded] = useState(false);

  // If a custom URL from database is passed and it's not the default fallback, render custom image
  if (customSrc && !customSrc.includes(heroKey === 'investasi' ? 'hero-investasi-luwu' : 'hero-mpp-simpurusiang') && !customSrc.includes('default-hero')) {
    return (
      <div 
        className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
        style={{
          backgroundColor: meta.dominantColor,
          ...style
        }}
      >
        <img
          src={customSrc}
          alt={alt}
          width={meta.originalWidth}
          height={meta.originalHeight}
          loading={priority ? "eager" : "lazy"}
          {...({ fetchpriority: priority ? "high" : "low" } as any)}
          decoding="async"
          className={`w-full h-full object-cover ${objectPositionClass} pointer-events-none filter brightness-[0.98] contrast-[1.02]`}
        />
      </div>
    );
  }

  return (
    <div 
      className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
      style={{
        backgroundColor: meta.dominantColor,
        ...style
      }}
    >
      {/* 1. Low Quality Image Placeholder (LQIP, <= 1KB Base64) with smooth 300ms crossfade */}
      {meta.lqip && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 pointer-events-none ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            backgroundImage: `url(${meta.lqip})`,
            backgroundSize: 'cover',
            backgroundPosition: objectPositionClass === 'object-center' ? 'center center' : 'center top',
            filter: 'blur(16px)',
            transform: 'scale(1.05)',
          }}
        />
      )}

      {/* 2. High-Performance Modern <picture> with AVIF, WebP, and JPG fallback */}
      <picture className="w-full h-full">
        {/* Modern AVIF format */}
        <source
          type="image/avif"
          srcSet={meta.avifSrcset}
          sizes={meta.sizes}
        />
        {/* WebP format */}
        <source
          type="image/webp"
          srcSet={meta.webpSrcset}
          sizes={meta.sizes}
        />
        {/* Progressive JPG Fallback */}
        <source
          type="image/jpeg"
          srcSet={meta.jpgSrcset}
          sizes={meta.sizes}
        />
        {/* Default <img> tag with explicit aspect ratio dimensions */}
        <img
          src={meta.defaultSrc}
          alt={alt}
          width={meta.originalWidth}
          height={meta.originalHeight}
          loading={priority ? "eager" : "lazy"}
          {...({ fetchpriority: priority ? "high" : "low" } as any)}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover ${objectPositionClass} pointer-events-none filter brightness-[0.99] contrast-[1.02] transition-opacity duration-300 motion-reduce:transition-none ${
            isLoaded ? 'opacity-100' : 'opacity-90'
          }`}
        />
      </picture>
    </div>
  );
};

export default ResponsiveHeroPicture;
