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
      className={className} 
      isDark={isDark} 
    />
  );
}

export default AntiCorruptionBanner;
