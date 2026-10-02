import React from 'react';
import { SmartLiveQueueSection } from './SmartLiveQueueSection';

export function SmartLiveQueue({ 
  isDark = false, 
  onRegisterQueue 
}: { 
  isDark?: boolean; 
  onRegisterQueue?: (serviceName?: string) => void 
}) {
  return (
    <SmartLiveQueueSection 
      isDark={isDark} 
      onRegisterQueue={onRegisterQueue} 
    />
  );
}

export default SmartLiveQueue;
