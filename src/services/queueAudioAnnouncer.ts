/**
 * Queue Audio Announcer Facade (Delegated to AudioNotificationService)
 */

import { audioNotificationService } from './AudioNotificationService';

export function playAirportChimeTone(type: 'opening' | 'closing' = 'opening'): Promise<void> {
  return audioNotificationService.playChime(type === 'opening' ? 'airport-4-tone' : 'closing');
}

export function playQueueCallingSound(queueNumber: string, counterName: string): Promise<void> {
  return audioNotificationService.playQueueAnnouncement({
    queueNumber,
    counterName,
    language: 'id'
  });
}
