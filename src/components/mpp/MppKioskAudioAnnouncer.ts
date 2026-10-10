/**
 * Kiosk Audio Engine Facade (Delegated to AudioNotificationService)
 */

import { audioNotificationService } from '../../services/AudioNotificationService';

export type KioskLanguage = 'id' | 'en' | 'zh';

export class KioskAudioEngine {
  public static playAirportChime(): Promise<void> {
    return audioNotificationService.playChime('airport-3-tone');
  }

  public static playSuccessChime(): Promise<void> {
    return audioNotificationService.playChime('airport-3-tone');
  }

  public static playSuccessSound(): Promise<void> {
    return audioNotificationService.playChime('airport-3-tone');
  }

  public static playKeyBeep(): void {
    audioNotificationService.playBeep(880, 0.05);
  }

  public static playAlertSound(): void {
    audioNotificationService.triggerVibration([100, 50, 100]);
  }

  public static playAssistanceAlarm(): void {
    audioNotificationService.playChime('airport-4-tone');
  }

  public static announceTicket(
    ticketNumber: string,
    agencyName: string,
    lang: KioskLanguage = 'id'
  ): void {
    let message = '';
    if (lang === 'en') {
      message = `Attention please. Ticket number ${ticketNumber} for ${agencyName} has been successfully issued. Please proceed to the service counter when your number is called.`;
    } else if (lang === 'zh') {
      message = `请注意。${agencyName} 的服务号票 ${ticketNumber} 已成功出票。请在窗口呼叫时前往办理。`;
    } else {
      message = `Perhatian. Tiket antrean ${ticketNumber} untuk ${agencyName} telah berhasil diterbitkan. Silakan menuju loket saat nomor Anda dipanggil.`;
    }

    audioNotificationService.playChime('airport-3-tone').then(() => {
      audioNotificationService.speak(message, lang);
    });
  }
}
