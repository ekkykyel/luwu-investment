/**
 * AudioNotificationService (Singleton)
 * Arsitektur Terpadu Notifikasi Suara & Pengumuman Antrean MPP Simpurusiang
 * 
 * Menggabungkan:
 * 1. Web Audio API Polyphonic Chime Synthesizer (4-Tone Opening, 3-Tone Kiosk, 3-Tone Closing)
 * 2. Speech Synthesis (SpeechSynthesis API) dengan normalisasi dialek Tana Luwu
 * 3. Pre-loading & AudioContext Wake-up untuk mencegah jeda latensi saat loket memanggil antrean
 */

import { speakCrystalClearText, stopAllSpeech, formatTextForCrystalClearTts } from '../utils/mppAudioEngine';

export type ChimeType = 'airport-4-tone' | 'airport-3-tone' | 'closing';
export type AnnouncementLanguage = 'id' | 'en' | 'zh';

export interface QueueAnnouncementPayload {
  queueNumber: string;
  counterName: string;
  agencyName?: string;
  language?: AnnouncementLanguage;
  speechRate?: number;
}

export class AudioNotificationService {
  private static instance: AudioNotificationService | null = null;
  private audioCtx: AudioContext | null = null;
  private isPreloaded = false;
  private activeWakeLock: any = null;

  private constructor() {
    // Lazy initialisation of audio context
    if (typeof window !== 'undefined') {
      const initAudioOnInteraction = () => {
        this.preload();
        window.removeEventListener('click', initAudioOnInteraction);
        window.removeEventListener('touchstart', initAudioOnInteraction);
      };
      window.addEventListener('click', initAudioOnInteraction, { once: true });
      window.addEventListener('touchstart', initAudioOnInteraction, { once: true });
    }
  }

  public static getInstance(): AudioNotificationService {
    if (!AudioNotificationService.instance) {
      AudioNotificationService.instance = new AudioNotificationService();
    }
    return AudioNotificationService.instance;
  }

  /**
   * Pre-load AudioContext and speech synthesis voices to prevent delay
   */
  public preload(): void {
    if (typeof window === 'undefined') return;
    try {
      this.getAudioContext();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
      this.isPreloaded = true;
    } catch (e) {
      console.warn('[AudioNotificationService] Preload warning:', e);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  /**
   * Play synthesized airport bell chime
   */
  public playChime(type: ChimeType = 'airport-4-tone'): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) {
          resolve();
          return;
        }

        const now = ctx.currentTime;

        if (type === 'airport-4-tone') {
          // Classic 4-note airport boarding tone: F4, A4, C5, G4
          const notes = [
            { freq: 349.23, time: 0.0, duration: 1.1 },
            { freq: 440.00, time: 0.38, duration: 1.1 },
            { freq: 523.25, time: 0.76, duration: 1.2 },
            { freq: 392.00, time: 1.14, duration: 1.6 },
          ];

          const masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(0.65, now);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(3200, now);

          masterGain.connect(filter);
          filter.connect(ctx.destination);

          notes.forEach((note) => {
            const startTime = now + note.time;
            const endTime = startTime + note.duration;

            const osc1 = ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(note.freq, startTime);

            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(note.freq * 2.01, startTime);

            const noteGain = ctx.createGain();
            noteGain.gain.setValueAtTime(0.0001, startTime);
            noteGain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

            const osc2Gain = ctx.createGain();
            osc2Gain.gain.setValueAtTime(0.12, startTime);
            osc2Gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

            osc1.connect(noteGain);
            osc2.connect(osc2Gain);
            noteGain.connect(masterGain);
            osc2Gain.connect(masterGain);

            osc1.start(startTime);
            osc1.stop(endTime);
            osc2.start(startTime);
            osc2.stop(endTime);
          });

          setTimeout(() => resolve(), 2200);
        } else if (type === 'airport-3-tone') {
          // Kiosk 3-tone chime: D5 -> A4 -> E5
          const tones = [
            { freq: 587.33, start: 0.0, dur: 0.35, gain: 0.12 },
            { freq: 440.00, start: 0.32, dur: 0.35, gain: 0.12 },
            { freq: 659.25, start: 0.64, dur: 0.60, gain: 0.14 },
          ];

          tones.forEach(({ freq, start, dur, gain: vol }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + start);

            gain.gain.setValueAtTime(0.001, now + start);
            gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + start);
            osc.stop(now + start + dur);
          });

          setTimeout(() => resolve(), 1300);
        } else {
          // Closing 3-tone: C5 -> A4 -> F4
          const notes = [
            { freq: 523.25, time: 0.0, duration: 0.9 },
            { freq: 440.00, time: 0.32, duration: 0.9 },
            { freq: 349.23, time: 0.64, duration: 1.4 },
          ];

          const masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(0.55, now);
          masterGain.connect(ctx.destination);

          notes.forEach((note) => {
            const startTime = now + note.time;
            const endTime = startTime + note.duration;

            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, startTime);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(startTime);
            osc.stop(endTime);
          });

          setTimeout(() => resolve(), 1800);
        }
      } catch (err) {
        console.error('[AudioNotificationService] playChime failed:', err);
        resolve();
      }
    });
  }

  /**
   * Play short key feedback beep
   */
  public playBeep(freq: number = 880, duration: number = 0.06): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  /**
   * Speak clear text through TTS
   */
  public speak(text: string, lang: AnnouncementLanguage = 'id'): Promise<void> {
    return new Promise((resolve) => {
      try {
        speakCrystalClearText(text, {
          lang,
          onEnd: () => resolve(),
          onError: () => resolve()
        });
      } catch {
        resolve();
      }
    });
  }

  /**
   * Complete Queue Calling Flow:
   * 1. 4-Tone Airport Chime
   * 2. Crystal Clear Speech Calling
   * 3. 3-Tone Exit Chime
   */
  public async playQueueAnnouncement(payload: QueueAnnouncementPayload): Promise<void> {
    this.stop();

    // 1. Play Opening Chime
    await this.playChime('airport-4-tone');

    // 2. Intelligent Counter & Agency Resolution (Autodetect if swapped)
    let rawCounter = (payload.counterName || '').trim();
    let rawAgency = (payload.agencyName || '').trim();

    // If caller accidentally swapped agency into counterName (e.g., counterName="Dinas Sosial", agencyName="Loket 2")
    if (
      rawCounter &&
      (rawCounter.toLowerCase().includes('dinas') ||
        rawCounter.toLowerCase().includes('badan') ||
        rawCounter.toLowerCase().includes('kementerian') ||
        rawCounter.toLowerCase().includes('bpjs') ||
        rawCounter.toLowerCase().includes('bank') ||
        rawCounter.toLowerCase().includes('ptsp')) &&
      (!rawAgency || rawAgency.toLowerCase().includes('loket') || rawAgency.toLowerCase().includes('meja'))
    ) {
      const temp = rawCounter;
      rawCounter = rawAgency || 'Loket Pelayanan';
      rawAgency = temp;
    }

    if (!rawCounter) rawCounter = 'Loket Pelayanan';

    // 3. Format Queue Number Phonetically for Natural Human Pronunciation
    const lang = payload.language || 'id';
    const rawQueue = (payload.queueNumber || '').trim();

    // Extract core ticket digits or short code (e.g. "DPMPTSP-20251009-001" -> "001", "A-001" -> "A 001", "P-001-DPMPTSP" -> "P 001")
    let displayCode = rawQueue;
    if (rawQueue.includes('-')) {
      const parts = rawQueue.split('-');
      if (parts[0] === 'P') {
        // Priority lane e.g. P-001-DPMPTSP
        displayCode = `P ${parts[1] || ''}`;
      } else if (parts.length >= 3 && parts[1].length >= 6) {
        // e.g. DPMPTSP-20251009-001 -> take the last part
        displayCode = parts[parts.length - 1];
      } else if (/^[A-Za-z]+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
        // e.g. A-001
        displayCode = `${parts[0]} ${parts[1]}`;
      } else if (/^\d+$/.test(parts[0])) {
        displayCode = parts[0];
      }
    }

    let spokenQueue = '';
    if (lang === 'id') {
      const digitMap: Record<string, string> = {
        '0': 'kosong',
        '1': 'satu',
        '2': 'dua',
        '3': 'tiga',
        '4': 'empat',
        '5': 'lima',
        '6': 'enam',
        '7': 'tujuh',
        '8': 'delapan',
        '9': 'sembilan'
      };
      spokenQueue = displayCode
        .toUpperCase()
        .split('')
        .map(ch => {
          if (ch === 'P') return 'P';
          if (ch === '-') return ' ';
          if (digitMap[ch]) return digitMap[ch];
          return ch;
        })
        .filter(Boolean)
        .join(', ');
    } else {
      spokenQueue = displayCode.split('').join(' ');
    }

    let announcementText = '';
    const agencyPrefix = rawAgency ? `${rawAgency}, ` : '';

    if (lang === 'en') {
      announcementText = `Calling ticket number ${spokenQueue}. Please proceed to ${agencyPrefix}${rawCounter}. Thank you.`;
    } else if (lang === 'zh') {
      announcementText = `请 ${spokenQueue} 号到 ${agencyPrefix}${rawCounter} 办理业务。`;
    } else {
      announcementText = `Panggilan antrean, Mal Pelayanan Publik Simpurusiang. Nomor antrean: ${spokenQueue}. Silakan menuju ke ${agencyPrefix}${rawCounter}. Terima kasih.`;
    }

    // 4. Speak the announcement
    await this.speak(announcementText, lang);

    // 5. Play Closing Exit Chime
    await this.playChime('closing');
  }

  /**
   * Stop all ongoing speech and audio immediately
   */
  public stop(): void {
    try {
      stopAllSpeech();
      if (this.audioCtx && this.audioCtx.state === 'running') {
        // Suspend temporarily
        this.audioCtx.suspend().catch(() => {});
      }
    } catch (e) {
      console.warn('[AudioNotificationService] stop error:', e);
    }
  }

  /**
   * Haptic vibration feedback for mobile kiosks
   */
  public triggerVibration(pattern: number[] = [200, 100, 200, 100, 400]): void {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  /**
   * Request screen wake lock during calling alert
   */
  public async requestWakeLock(): Promise<any> {
    if (typeof window !== 'undefined' && 'navigator' in window && 'wakeLock' in navigator) {
      try {
        this.activeWakeLock = await (navigator as any).wakeLock.request('screen');
        return this.activeWakeLock;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const audioNotificationService = AudioNotificationService.getInstance();
