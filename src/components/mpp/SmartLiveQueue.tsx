import React from 'react';
import { BentoQueueGrid } from './BentoQueueGrid';

export function SmartLiveQueue({ 
  isDark = false, 
  onRegisterQueue 
}: { 
  isDark?: boolean; 
  onRegisterQueue?: (serviceName?: string) => void 
}) {
  return (
    <BentoQueueGrid 
      isDark={isDark} 
      onRegisterQueue={(serviceName) => onRegisterQueue?.(serviceName)} 
    />
  );
}

export default SmartLiveQueue;

