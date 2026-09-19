// Airport Chime Synthesizer & Speech Announcement using Web Audio API & Web Speech API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play authentic 4-tone airport announcement chime (Ding-Dong / Changi & Garuda airport style)
 */
export function playAirportChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // 4 Chime Frequencies (F4, A4, C5, G4) - Classic airport boarding tone
      const notes = [
        { freq: 349.23, time: 0.0, duration: 1.1 }, // F4
        { freq: 440.00, time: 0.38, duration: 1.1 }, // A4
        { freq: 523.25, time: 0.76, duration: 1.2 }, // C5
        { freq: 392.00, time: 1.14, duration: 1.6 }, // G4
      ];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.65, now);

      // Warm acoustic lowpass filter (simulates airport hall PA system)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      notes.forEach((note) => {
        const startTime = now + note.time;
        const endTime = startTime + note.duration;

        // Primary fundamental oscillator (sine)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(note.freq, startTime);

        // Overtone 1 (sine at 2x frequency for bell brightness)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(note.freq * 2.01, startTime);

        // Overtone 2 (sine at 3x for tubular resonance)
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(note.freq * 3.02, startTime);

        // Note Envelope
        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0.0001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        // Overtone gains
        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.12, startTime);
        osc2Gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

        const osc3Gain = ctx.createGain();
        osc3Gain.gain.setValueAtTime(0.05, startTime);
        osc3Gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);

        osc1.connect(noteGain);
        osc2.connect(osc2Gain);
        osc2Gain.connect(noteGain);
        osc3.connect(osc3Gain);
        osc3Gain.connect(noteGain);

        noteGain.connect(masterGain);

        osc1.start(startTime);
        osc1.stop(endTime);
        osc2.start(startTime);
        osc2.stop(startTime + 0.6);
        osc3.start(startTime);
        osc3.stop(startTime + 0.4);
      });

      // Total chime duration is ~2.8 seconds
      setTimeout(() => {
        resolve();
      }, 2700);
    } catch (err) {
      console.warn('Web Audio error playing airport chime:', err);
      resolve();
    }
  });
}

/**
 * Format ticket code for natural Indonesian speech announcement
 * e.g. "DPMPTSP-20260912-001" -> "D P M P T S P, nomor 0 0 1"
 * or "A012" -> "A, kosong satu dua"
 */
function formatTicketForSpeech(ticketNumber: string): string {
  if (!ticketNumber) return '';
  
  if (ticketNumber.includes('-')) {
    const parts = ticketNumber.split('-');
    const lastPart = parts[parts.length - 1];
    const prefix = parts[0].split('').join(' ');
    const digits = lastPart.split('').map(d => (d === '0' ? 'kosong' : d)).join(' ');
    return `${prefix}, nomor ${digits}`;
  }

  // e.g. A012 -> A, kosong satu dua
  const match = ticketNumber.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    const letters = match[1].toUpperCase().split('').join(' ');
    const digits = match[2].split('').map(d => (d === '0' ? 'kosong' : d)).join(' ');
    return `${letters}, ${digits}`;
  }

  return ticketNumber;
}

/**
 * Speak voice announcement in Indonesian (PermenPAN-RB / Airport PA style)
 */
export function speakCallingAnnouncement(ticketNumber: string, counterName: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const formattedNumber = formatTicketForSpeech(ticketNumber);
      const text = `Perhatian. Nomor antrean, ${formattedNumber}. Silakan menuju ke ${counterName}. Terima kasih.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.92; // slightly deliberate airport PA pace
      utterance.pitch = 1.05;

      // Find Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);

      // Fallback timeout in case speech engine stalls
      setTimeout(() => resolve(), 6000);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      resolve();
    }
  });
}

/**
 * Trigger physical phone vibration pattern (wake-up alert)
 */
export function triggerVibration(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Distinct airport alert vibration rhythm: Buzz-Buzz... Long-BUZZ
      navigator.vibrate([400, 180, 400, 180, 800, 250, 800]);
    } catch {
      // Ignored if restricted
    }
  }
}

/**
 * Request Screen Wake Lock (keeps phone display awake)
 */
export async function requestScreenWakeLock(): Promise<WakeLockSentinel | null> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      const sentinel = await (navigator as any).wakeLock.request('screen');
      return sentinel;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Trigger full Airport Calling Alert:
 * 1. Screen Wake Lock
 * 2. Phone Vibration
 * 3. Airport Bell / Chime Sound
 * 4. Voice Announcement
 * 5. Web Notification (if permitted)
 */
export async function triggerFullAirportCallingAlert(
  ticketNumber: string,
  counterName: string
): Promise<void> {
  // 1. Wake phone & vibrate
  triggerVibration();
  requestScreenWakeLock();

  // 2. Web Notification (for background tabs or locked screen)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`📢 NOMOR ANDA DIPANGGIL: ${ticketNumber}`, {
        body: `Silakan segera menuju ke ${counterName}. Petugas siap melayani Anda.`,
        icon: '/favicon.ico',
        tag: `queue-call-${ticketNumber}`,
        requireInteraction: true
      });
    } catch {
      // Ignore notification errors
    }
  }

  // 3. Play authentic Airport Chime
  await playAirportChime();

  // 4. Followed by clear Voice Announcement
  await speakCallingAnnouncement(ticketNumber, counterName);
}
