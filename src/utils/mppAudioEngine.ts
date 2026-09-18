/**
 * Crystal Clear High-Fidelity Anti-Stutter Audio Engine
 * Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu
 * 
 * Features:
 * 1. Anti-Garbage Collection (GC) Protection via global window.__activeSpeechUtterances cache.
 * 2. Chromium Audio Keep-Alive Interval (prevents Chrome audio freeze after 10-15s).
 * 3. Phonetic Normalization for Public Service Acronyms & Tana Luwu Local Greetings.
 * 4. Micro-paused sentence chunking for natural, articulate human cadence.
 */

declare global {
  interface Window {
    __activeSpeechUtterances?: SpeechSynthesisUtterance[];
    __speechKeepAliveInterval?: any;
    __speechSessionId?: number;
  }
}

if (typeof window !== 'undefined') {
  if (!window.__activeSpeechUtterances) {
    window.__activeSpeechUtterances = [];
  }
  if (typeof window.__speechSessionId !== 'number') {
    window.__speechSessionId = 0;
  }
}

/**
 * Phonetically transforms raw technical text into crystal clear, human-like speech string.
 * Expands acronyms (e.g. "MPP" -> "M P P", "PBG" -> "P B G") and cleans glottal apostrophes.
 */
export function formatTextForCrystalClearTts(text: string, lang: 'id' | 'en' | 'zh' = 'id'): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Strip Markdown formatting
  cleaned = cleaned.replace(/[\*\_~`#]+/g, '');
  cleaned = cleaned.replace(/^\s*[\-\•\*\+]\s+/gm, ''); // Bullet markers
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ''); // Numbered markers

  // 2. Remove URLs, HTML tags, and bracket noise
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  cleaned = cleaned.replace(/[\(\)\[\]\{\}]/g, ', ');

  if (lang === 'id') {
    // 3. Normalize Local Greetings & Glottal Stop Apostrophes in Tana Luwu dialect
    cleaned = cleaned.replace(/salama['’`]\s*ki['’`]\s*(ta['’`]\s*)?pada\s*salama['’`]?/gi, 'Salama Ki ta Pada Salama');
    cleaned = cleaned.replace(/salama['’`]/gi, 'Salama');
    cleaned = cleaned.replace(/ki['’`]/gi, 'Ki');
    cleaned = cleaned.replace(/ta['’`]/gi, 'ta');
    cleaned = cleaned.replace(/tabe['’`]/gi, 'Tabe');

    // 4. Phonetic Expansion for Official Public Service Acronyms
    // Spacing out letters forces browser speech engines to pronounce letter-by-letter clearly
    cleaned = cleaned.replace(/\bMPP\b/g, 'M P P');
    cleaned = cleaned.replace(/\bPBG\b/g, 'P B G');
    cleaned = cleaned.replace(/\bNIB\b/g, 'N I B');
    cleaned = cleaned.replace(/\bOSS-RBA\b/gi, 'O S S R B A');
    cleaned = cleaned.replace(/\bOSS\b/g, 'O S S');
    cleaned = cleaned.replace(/\bKTP-el\b/gi, 'K T P elektronik');
    cleaned = cleaned.replace(/\bKTP\b/g, 'K T P');
    cleaned = cleaned.replace(/\bSIMBG\b/gi, 'Sim B G');
    cleaned = cleaned.replace(/\bSIM\b/g, 'S I M');
    cleaned = cleaned.replace(/\bSKCK\b/g, 'S K C K');
    cleaned = cleaned.replace(/\bSLA\b/g, 'S L A');
    cleaned = cleaned.replace(/\bBPN\b/g, 'B P N');
    cleaned = cleaned.replace(/\bBUMN\b/g, 'B U M N');
    cleaned = cleaned.replace(/\bNPWP\b/g, 'N P W P');
    cleaned = cleaned.replace(/\bDPUPR\b/g, 'D P U P R');
    cleaned = cleaned.replace(/\bDPMPTSP\b/g, 'D P M P T S P');
    cleaned = cleaned.replace(/\bDISDUKCAPIL\b/gi, 'Disdukcapil');
    cleaned = cleaned.replace(/\bKPP\b/g, 'K P P');
    cleaned = cleaned.replace(/\bBPJS\b/g, 'B P J S');
    cleaned = cleaned.replace(/\bPKKPR\b/g, 'P K K P R');
    cleaned = cleaned.replace(/\bSPPL\b/g, 'S P P L');
    cleaned = cleaned.replace(/\bSLF\b/g, 'S L F');
    cleaned = cleaned.replace(/\bPNBP\b/g, 'P N B P');
    cleaned = cleaned.replace(/\bPTSP\b/g, 'P T S P');

    // 5. Currency & Abbreviations
    cleaned = cleaned.replace(/\bRp\.?\s*0\b/gi, 'gratis tanpa biaya');
    cleaned = cleaned.replace(/\bRp\.?\s*/gi, 'Rupiah ');
    cleaned = cleaned.replace(/\bNo\.?\s*(\d+)/gi, 'Nomor $1');
    cleaned = cleaned.replace(/\bKab\.?\s*/gi, 'Kabupaten ');
    cleaned = cleaned.replace(/\bKec\.?\s*/gi, 'Kecamatan ');
    cleaned = cleaned.replace(/\bGed\.?\s*/gi, 'Gedung ');
    cleaned = cleaned.replace(/\bLt\.?\s*(\d+)/gi, 'Lantai $1');
    cleaned = cleaned.replace(/\bJln\.?\s*/gi, 'Jalan ');
    cleaned = cleaned.replace(/\bJl\.?\s*/gi, 'Jalan ');
  } else if (lang === 'en') {
    cleaned = cleaned.replace(/\bMPP\b/g, 'M P P');
    cleaned = cleaned.replace(/\bPBG\b/g, 'P B G');
    cleaned = cleaned.replace(/\bNIB\b/g, 'N I B');
    cleaned = cleaned.replace(/\bOSS\b/g, 'O S S');
    cleaned = cleaned.replace(/\bSLA\b/g, 'S L A');
    cleaned = cleaned.replace(/\bNo\.\s*(\d+)/gi, 'Number $1');
  } else if (lang === 'zh') {
    cleaned = cleaned.replace(/MPP/g, '公共服务大楼');
    cleaned = cleaned.replace(/PBG/g, '建筑许可');
    cleaned = cleaned.replace(/NIB/g, '企业注册号');
    cleaned = cleaned.replace(/OSS/g, '在线企业注册系统');
    cleaned = cleaned.replace(/SLA/g, '办理时限');
  }

  // 6. Slashes & Punctuation
  cleaned = cleaned.replace(/\s*\/\s*/g, lang === 'en' ? ' or ' : lang === 'zh' ? '或' : ' atau ');
  cleaned = cleaned.replace(/[\:\;]/g, ', ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Stops all active speech synthesis playback and clears keep-alive timers.
 */
export function stopAllSpeech(): void {
  if (typeof window === 'undefined') return;

  if (window.__speechKeepAliveInterval) {
    clearInterval(window.__speechKeepAliveInterval);
    window.__speechKeepAliveInterval = null;
  }

  if (window.__activeSpeechUtterances) {
    window.__activeSpeechUtterances = [];
  }

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

export interface SpeakOptions {
  lang?: 'id' | 'en' | 'zh';
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  availableVoices?: SpeechSynthesisVoice[];
}

/**
 * Plays speech audio with crystal clear anti-stutter quality and natural human pacing.
 */
export function speakCrystalClearText(text: string, options: SpeakOptions = {}): number {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 0;

  const {
    lang = 'id',
    rate = 0.93,
    pitch = 1.0,
    volume = 1.0,
    onStart,
    onEnd,
    onError,
    availableVoices = []
  } = options;

  stopAllSpeech();

  if (!text || !text.trim()) return 0;

  window.__speechSessionId = (window.__speechSessionId || 0) + 1;
  const currentSessionId = window.__speechSessionId;

  // 1. Phonetically normalize text
  const normalizedText = formatTextForCrystalClearTts(text, lang);
  if (!normalizedText.trim()) return 0;

  // 2. Intelligent Sentence & Clause Chunking
  const rawChunks = normalizedText
    .split(/(?<=[.?!;。\n！？])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const sentenceChunks: string[] = [];
  for (const chunk of rawChunks) {
    if (chunk.length > 140) {
      const subParts = chunk.split(/(?<=[,，])\s+/);
      for (const part of subParts) {
        if (part.trim()) sentenceChunks.push(part.trim());
      }
    } else {
      sentenceChunks.push(chunk);
    }
  }

  if (sentenceChunks.length === 0) return 0;

  if (onStart) onStart();

  // 3. Voice Selection Strategy
  const voiceList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
  let targetVoice: SpeechSynthesisVoice | null = null;

  if (lang === 'en') {
    targetVoice = voiceList.find(v => (v.lang.includes('en-US') || v.lang.includes('en_US')) && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Samantha') || v.name.includes('Jenny'))) ||
                  voiceList.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural'))) ||
                  voiceList.find(v => v.lang.startsWith('en')) || null;
  } else if (lang === 'zh') {
    targetVoice = voiceList.find(v => (v.lang.includes('zh-CN') || v.lang.includes('zh_CN')) && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Xiaoxiao') || v.name.includes('Yunxi') || v.name.includes('Tingting'))) ||
                  voiceList.find(v => (v.lang.startsWith('zh') || v.lang.includes('cmn'))) || null;
  } else {
    targetVoice = voiceList.find(v => v.lang.includes('id') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Damayanti') || v.name.includes('Gadis') || v.name.includes('Indonesian'))) ||
                  voiceList.find(v => v.lang.startsWith('id') || v.lang.includes('id_ID') || v.lang.includes('id-ID')) || null;
  }

  // 4. Start Chromium Keep-Alive Interval
  window.__speechKeepAliveInterval = setInterval(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }
  }, 3200);

  let currentIdx = 0;

  const playNextChunk = () => {
    if (window.__speechSessionId !== currentSessionId) {
      stopAllSpeech();
      if (onEnd) onEnd();
      return;
    }

    if (currentIdx >= sentenceChunks.length) {
      stopAllSpeech();
      if (onEnd) onEnd();
      return;
    }

    const chunkText = sentenceChunks[currentIdx];
    const utterance = new SpeechSynthesisUtterance(chunkText);

    // CRITICAL: Retain in global window array to prevent V8 Garbage Collector from destroying utterance mid-speech!
    if (!window.__activeSpeechUtterances) window.__activeSpeechUtterances = [];
    window.__activeSpeechUtterances.push(utterance);

    if (lang === 'en') {
      utterance.lang = 'en-US';
    } else if (lang === 'zh') {
      utterance.lang = 'zh-CN';
    } else {
      utterance.lang = 'id-ID';
    }

    if (targetVoice) utterance.voice = targetVoice;

    utterance.rate = Math.min(Math.max(rate, 0.75), 1.1);
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onend = () => {
      if (window.__activeSpeechUtterances) {
        window.__activeSpeechUtterances = window.__activeSpeechUtterances.filter(u => u !== utterance);
      }
      if (window.__speechSessionId !== currentSessionId) return;

      currentIdx++;
      // Micro-pause (60ms) between clauses for natural breathing cadence
      setTimeout(() => {
        playNextChunk();
      }, 60);
    };

    utterance.onerror = (e) => {
      if (window.__activeSpeechUtterances) {
        window.__activeSpeechUtterances = window.__activeSpeechUtterances.filter(u => u !== utterance);
      }
      if (window.__speechSessionId !== currentSessionId) return;
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      if (onError) onError(e);
      currentIdx++;
      playNextChunk();
    };

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
  };

  playNextChunk();
  return currentSessionId;
}
