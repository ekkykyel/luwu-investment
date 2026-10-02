import React from 'react';
import { ZonaIntegritasSection } from './ZonaIntegritasSection';

export interface AntiCorruptionBannerProps {
  isDark?: boolean;
  className?: string;
  variant?: 'full' | 'compact' | 'footer';
  autoCycleInterval?: number;
}

export function AntiCorruptionBanner({ 
  isDark = false, 
  className = ''
}: AntiCorruptionBannerProps) {
  return (
    <ZonaIntegritasSection 
      className={className || "w-full max-w-xl mx-auto px-4 pt-8 pb-24 space-y-4 text-slate-900 dark:text-slate-100"} 
      isDark={isDark} 
    />
  );
}

export default AntiCorruptionBanner;
