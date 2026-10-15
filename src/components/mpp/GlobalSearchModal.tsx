import React from 'react';
import { MppCommandPalette } from './MppCommandPalette';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  activePersona?: 'warga' | 'investor' | 'semua';
  onSelectPersona?: (persona: 'warga' | 'investor' | 'semua') => void;
  onOpenQueueBooking?: (serviceName?: string, agencyName?: string) => void;
  onOpenRequirements?: (serviceKey?: string) => void;
  onOpenVoiceAssistant?: () => void;
  onOpenAgenciesCatalog?: () => void;
  onOpenServicesCatalog?: (category?: string, searchQuery?: string) => void;
  initialQuery?: string;
}

/**
 * GlobalSearchModal component alias wrapping the GovTech Command Palette / Global Search
 */
export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isDark = false,
  activePersona = 'warga',
  onSelectPersona = () => {},
  onOpenQueueBooking = () => {},
  onOpenRequirements = () => {},
  onOpenAgenciesCatalog = () => {},
  onOpenServicesCatalog = () => {},
  ...props
}) => {
  return (
    <MppCommandPalette
      isDark={isDark}
      activePersona={activePersona}
      onSelectPersona={onSelectPersona}
      onOpenQueueBooking={onOpenQueueBooking}
      onOpenRequirements={onOpenRequirements}
      onOpenAgenciesCatalog={onOpenAgenciesCatalog}
      onOpenServicesCatalog={onOpenServicesCatalog}
      {...props}
    />
  );
};

export default GlobalSearchModal;
export { MppCommandPalette };
