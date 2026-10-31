import React, { useState } from 'react';
import { getImageUrl } from '../../utils/imageFallbacks';

export type AgencyLogoSize = 'card' | 'modal' | 'list' | number;

export interface AgencyLogoProps {
  name: string;
  logo?: string | null;
  size?: AgencyLogoSize;
  className?: string;
  alt?: string;
  rounded?: 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Extract an acronym or initials (2-3 chars) from agency name
 */
export function getAgencyInitials(name: string): string {
  if (!name) return 'MPP';
  const clean = name.trim();
  
  // Direct acronym check
  if (clean.length <= 5 && !clean.includes(' ')) {
    return clean.toUpperCase();
  }

  // Word-based initial extraction
  const words = clean
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => !['dan', 'kab', 'kabupaten', 'provinsi', 'unit', 'upt', 'pt', 'cv'].includes(w.toLowerCase()));

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Unified Agency Logo Component (Standardized Token Architecture)
 * - Strict Square aspect-ratio (1:1)
 * - 10% inner padding (p-[10%])
 * - object-fit: contain
 * - Pure white background (#FFFFFF) in both light and dark themes
 * - Crisp subtle border/ring
 * - Monogram initials fallback when logo fails to load
 * - alt = agency name
 */
export const AgencyLogo: React.FC<AgencyLogoProps> = ({
  name,
  logo,
  size = 'card',
  className = '',
  alt,
  rounded = 'xl',
}) => {
  const [hasError, setHasError] = useState(false);

  // Size styling mapping based on CSS Tokens
  let sizeClasses = 'w-[var(--logo-card,112px)] h-[var(--logo-card,112px)]';
  let initialFontSize = 'text-base sm:text-lg';

  if (size === 'card') {
    sizeClasses = 'w-[var(--logo-card,112px)] h-[var(--logo-card,112px)] min-w-[112px] min-h-[112px]';
    initialFontSize = 'text-lg sm:text-xl';
  } else if (size === 'modal') {
    sizeClasses = 'w-[var(--logo-modal,72px)] h-[var(--logo-modal,72px)] min-w-[72px] min-h-[72px]';
    initialFontSize = 'text-sm sm:text-base';
  } else if (size === 'list') {
    sizeClasses = 'w-[var(--logo-list,56px)] h-[var(--logo-list,56px)] min-w-[56px] min-h-[56px]';
    initialFontSize = 'text-xs sm:text-sm';
  } else if (typeof size === 'number') {
    sizeClasses = `w-[${size}px] h-[${size}px] min-w-[${size}px] min-h-[${size}px]`;
    initialFontSize = size >= 96 ? 'text-lg' : size >= 64 ? 'text-sm' : 'text-xs';
  }

  const roundedClasses = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  }[rounded] || 'rounded-xl';

  const resolvedUrl = logo ? getImageUrl(logo, 'agency') : null;
  const isImageValid = Boolean(resolvedUrl && !hasError && !resolvedUrl.endsWith('default-agency.svg') && !resolvedUrl.includes('has.png'));

  const initials = getAgencyInitials(name);

  return (
    <div
      className={`relative aspect-square shrink-0 flex items-center justify-center p-[10%] bg-[#FFFFFF] dark:bg-[#FFFFFF] text-slate-800 border border-[#E2DACB] dark:border-white/20 shadow-xs overflow-hidden select-none transition-transform duration-200 ${roundedClasses} ${sizeClasses} ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
      }}
    >
      {isImageValid ? (
        <img
          src={resolvedUrl!}
          alt={alt || name}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-contain pointer-events-none"
        />
      ) : (
        /* Monogram / Initials Fallback */
        <div 
          className="w-full h-full rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex flex-col items-center justify-center font-black tracking-wider shadow-inner"
          title={name}
        >
          <span className={`${initialFontSize} font-black drop-shadow-xs font-mono uppercase`}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};

export default AgencyLogo;
