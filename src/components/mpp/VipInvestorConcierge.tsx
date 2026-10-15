import React from 'react';
import { VipInvestorSection } from './VipInvestorSection';

export function VipInvestorConcierge({ isDark = false }: { isDark?: boolean }) {
  return <VipInvestorSection isDark={isDark} />;
}

export default VipInvestorConcierge;
