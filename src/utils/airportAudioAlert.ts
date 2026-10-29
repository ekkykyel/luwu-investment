/**
 * Airport Audio Alert Facade (Delegated to AudioNotificationService)
 */

import { audioNotificationService } from '../services/AudioNotificationService';

export function playAirportChime(): Promise<void> {
  return audioNotificationService.playChime('airport-4-tone');
}

export function speakCallingAnnouncement(
  queueNumber: string,
  counterName: string,
  agencyName?: string
): Promise<void> {
  return audioNotificationService.playQueueAnnouncement({
    queueNumber,
    counterName,
    agencyName,
    language: 'id'
  });
}

export function triggerVibration(): void {
  audioNotificationService.triggerVibration();
}

export function requestScreenWakeLock(): Promise<any> {
  return audioNotificationService.requestWakeLock();
}

export async function triggerFullAirportCallingAlert(
  queueNumber: string,
  counterName: string,
  agencyName?: string
): Promise<void> {
  triggerVibration();
  await requestScreenWakeLock();
  await audioNotificationService.playQueueAnnouncement({
    queueNumber,
    counterName,
    agencyName,
    language: 'id'
  });
}
