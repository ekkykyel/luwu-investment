// Airport Kiosk Audio Announcer & Chime Synthesizer
// Uses Web Audio API for authentic 3-tone polyphonic airport chimes & Web Speech API for multilingual voice announcements

import { speakCrystalClearText } from '../../utils/mppAudioEngine';

export type KioskLanguage = 'id' | 'en' | 'zh';

export class KioskAudioEngine {
  private static audioCtx: AudioContext | null = null;

  private static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Authentic 3-Tone Airport Ding-Dong-Ding Chime
  // Notes: D5 (587.33 Hz) -> A4 (440.00 Hz) -> F#5 (739.99 Hz) / E5 (659.25 Hz)
  public static playAirportChime(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) {
          resolve();
          return;
        }

        const now = ctx.currentTime;
        const tones = [
          { freq: 587.33, start: 0.0, dur: 0.35, gain: 0.12 }, // D5
          { freq: 440.00, start: 0.32, dur: 0.35, gain: 0.12 }, // A4
          { freq: 659.25, start: 0.64, dur: 0.60, gain: 0.14 }, // E5
        ];

        tones.forEach(({ freq, start, dur, gain: vol }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);

          // Natural acoustic bell decay
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + start);
          osc.stop(now + start + dur);
        });

        setTimeout(() => {
          resolve();
        }, 1200);
      } catch {
        resolve();
      }
    });
  }

  // Tactile Keypad Click / Beep
  public static playKeyBeep(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }

  // Success Confirmation Sound
  public static playSuccessSound(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.15);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch {}
  }

  // Alert / Error Buzzer
  public static playAlertSound(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {}
  }

  // Assistance / Staff Calling Bell
  public static playAssistanceAlarm(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [0, 0.25, 0.5].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now + offset); // C6
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.1, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      });
    } catch {}
  }

  // Multilingual Airport Announcement Voice Synthesizer
  public static announceTicket(
    ticketNumber: string,
    agencyName: string,
    lang: KioskLanguage = 'id'
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.playAirportChime();
      return;
    }

    // First play chime, then voice
    this.playAirportChime().then(() => {
      try {
        let message = '';

        if (lang === 'en') {
          message = `Attention please. Boarding pass ticket ${ticketNumber} for ${agencyName} has been successfully issued. Please proceed to the service counter when your number is called.`;
        } else if (lang === 'zh') {
          message = `请注意。${agencyName} 的服务号票 ${ticketNumber} 已成功出票。请在窗口呼叫时前往办理。`;
        } else {
          message = `Perhatian. Tiket antrean ${ticketNumber} untuk ${agencyName} telah berhasil diterbitkan. Silakan menuju loket saat nomor Anda dipanggil.`;
        }

        speakCrystalClearText(message, {
          lang,
          rate: 0.93,
          pitch: 1.0,
          volume: 1.0
        });
      } catch {
        // Fallback gracefully
      }
    });
  }
}
