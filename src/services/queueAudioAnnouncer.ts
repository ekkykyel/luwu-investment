/**
 * Service Pemutar Pengumuman Antrean Otomatis Standar Bandara / Public Address (PA) System
 * Menggabungkan Web Audio API 4-Tone Airport Chime Synthesizer & Web Speech API (id-ID)
 * 
 * Flow berurutan (Sequential Flow):
 * 1. Chime Bandara Awal (4-Tone Airport Bell: F4 - A4 - C5 - G4 dengan akustik reverb & overtones)
 * 2. Voice Announcement khas Bandara ("Panggilan antrean, Mall Pelayanan Publik Simpurusiang. Nomor antrean: A, kosong, satu, dua. Silakan menuju ke, Loket Dukcapil. Terima kasih.")
 * 3. Chime Bandara Penutup (3-Tone Airport Bell: C5 - A4 - F4)
 */

import { speakCrystalClearText } from '../utils/mppAudioEngine';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Pemutar Chime Bandara Menggunakan Web Audio API (Akurat, Jernih & Bebas Blokir File)
 */
export function playAirportChimeTone(type: 'opening' | 'closing' = 'opening'): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        resolve();
        return;
      }

      const now = ctx.currentTime;

      // Opening: 4-Note Classic Airport Chime (F4, A4, C5, G4)
      // Closing: 3-Note Airport Exit Chime (C5, A4, F4)
      const notes = type === 'opening'
        ? [
            { freq: 349.23, time: 0.0, duration: 1.1 }, // F4
            { freq: 440.00, time: 0.36, duration: 1.1 }, // A4
            { freq: 523.25, time: 0.72, duration: 1.2 }, // C5
            { freq: 392.00, time: 1.08, duration: 1.6 }, // G4
          ]
        : [
            { freq: 523.25, time: 0.0, duration: 0.9 },  // C5
            { freq: 440.00, time: 0.32, duration: 0.9 }, // A4
            { freq: 349.23, time: 0.64, duration: 1.4 }, // F4
          ];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.65, now);

      // Lowpass Filter untuk simulasi akustik ruang akustik akustik terminal bandara
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      notes.forEach((note) => {
        const startTime = now + note.time;
        const endTime = startTime + note.duration;

        // Fundamental oscillator (Pure Sine)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(note.freq, startTime);

        // Overtone 1 (Harmonic brightness)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(note.freq * 2.01, startTime);

        // Overtone 2 (Metallic bell resonance)
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(note.freq * 3.02, startTime);

        // Envelope
        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0.0001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.38, startTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.12, startTime);
        osc2Gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

        const osc3Gain = ctx.createGain();
        osc3Gain.gain.setValueAtTime(0.05, startTime);
        osc3Gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

        osc1.connect(noteGain);
        osc2.connect(osc2Gain);
        osc2Gain.connect(noteGain);
        osc3.connect(osc3Gain);
        osc3Gain.connect(noteGain);

        noteGain.connect(masterGain);

        osc1.start(startTime);
        osc1.stop(endTime);
        osc2.start(startTime);
        osc2.stop(startTime + 0.5);
        osc3.start(startTime);
        osc3.stop(startTime + 0.35);
      });

      const totalDuration = type === 'opening' ? 2600 : 2000;
      setTimeout(() => {
        resolve();
      }, totalDuration);
    } catch (e) {
      console.warn('Airport chime synthesizer error:', e);
      resolve();
    }
  });
}

/**
 * Format nomor tiket agar diucapkan fasih dan jelas oleh mesin TTS khas bandara
 * Contoh: "A-012" -> "A, kosong, satu, dua"
 * Contoh: "DPM-005" -> "D, P, M, nomor, kosong, kosong, lima"
 */
export function formatQueueNumberForSpeech(queueNum: string): string {
  if (!queueNum) return '';
  const trimmed = queueNum.trim();

  // Pemisahan dengan tanda hubung (misal: A-012, DPMPTSP-005)
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    const prefixStr = parts[0];
    const numberStr = parts[parts.length - 1];

    const prefixSpoken = prefixStr.length > 4 
      ? prefixStr 
      : prefixStr.split('').join(', ');

    const digitsSpoken = numberStr
      .split('')
      .map(d => (d === '0' ? 'kosong' : d))
      .join(', ');

    return `${prefixSpoken}, ${digitsSpoken}`;
  }

  // Format gabungan tanpa strip (misal: A012, B005)
  const match = trimmed.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    const prefixSpoken = match[1].length > 4 
      ? match[1] 
      : match[1].split('').join(', ');

    const digitsSpoken = match[2]
      .split('')
      .map(d => (d === '0' ? 'kosong' : d))
      .join(', ');

    return `${prefixSpoken}, ${digitsSpoken}`;
  }

  return trimmed;
}

interface QueueItem {
  queueNumber: string;
  counterName: string;
  resolve: () => void;
}

const announcementQueue: QueueItem[] = [];
let isProcessingQueue = false;

async function executeSingleAnnouncement(queueNumber: string, counterName: string): Promise<void> {
  return new Promise((resolve) => {
    let hasResolved = false;
    const finish = () => {
      if (!hasResolved) {
        hasResolved = true;
        resolve();
      }
    };

    // Timeout pengaman (maksimal 14 detik per panggilan antrean)
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout pemanggilan antrean FIDS tercapai.');
      finish();
    }, 14000);

    const speechFormattedNum = formatQueueNumberForSpeech(queueNumber);
    // Naskah resmi pemanggilan khas Bandara & MPP
    const announcementText = `Panggilan antrean, Mall Pelayanan Publik Simpurusiang. Nomor antrean: ${speechFormattedNum}. Silakan menuju ke, ${counterName}. Terima kasih.`;

    // --- TAHAP 3: Chime Penutup Bandara ---
    const playClosingChime = async () => {
      try {
        await playAirportChimeTone('closing');
      } catch {
        // Fallback jika audio error
      } finally {
        clearTimeout(safetyTimeout);
        finish();
      }
    };

    // --- TAHAP 2: Text-to-Speech (TTS) Voice Bandara ---
    const triggerTTS = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        playClosingChime();
        return;
      }

      try {
        speakCrystalClearText(announcementText, {
          lang: 'id',
          rate: 0.88,
          pitch: 1.02,
          volume: 1.0,
          onEnd: () => playClosingChime(),
          onError: () => playClosingChime()
        });
      } catch (e) {
        console.warn('Speech synthesis execution error:', e);
        playClosingChime();
      }
    };

    // --- TAHAP 1: Chime Awal Bandara (Web Audio Synthesizer + File Audio) ---
    playAirportChimeTone('opening')
      .then(() => {
        triggerTTS();
      })
      .catch((err) => {
        console.warn('Gagal memutar chime synthesizer awal:', err);
        triggerTTS();
      });
  });
}

async function processNextAnnouncementQueue() {
  if (isProcessingQueue || announcementQueue.length === 0) return;
  isProcessingQueue = true;

  const currentItem = announcementQueue.shift();
  if (currentItem) {
    try {
      await executeSingleAnnouncement(currentItem.queueNumber, currentItem.counterName);
    } catch (err) {
      console.warn('Error saat memanggil antrean:', err);
    } finally {
      currentItem.resolve();
    }
  }

  isProcessingQueue = false;

  if (announcementQueue.length > 0) {
    // Jeda 600ms antarpanggilan beruntun
    setTimeout(() => {
      processNextAnnouncementQueue();
    }, 600);
  }
}

export function playQueueCallingSound(queueNumber: string, counterName: string): Promise<void> {
  return new Promise((resolve) => {
    announcementQueue.push({ queueNumber, counterName, resolve });
    processNextAnnouncementQueue();
  });
}
