/**
 * Crystal Clear High-Fidelity Anti-Stutter Audio Engine
 * Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu
 * 
 * Features:
 * 1. High-Fidelity Voice Selection: Prioritizes Microsoft Neural, Google Natural, and Apple native voices.
 * 2. Phonetic & Dialect Normalization: Optimizes intonation, acronyms, currencies, and numbers for ID, EN, and ZH.
 * 3. Human-like Breath Cadence: Language-aware semantic clause chunking (Latin vs CJK).
 * 4. Anti-Garbage Collection (GC) Protection & Active Keep-Alive Watchdog.
 */

declare global {
  interface Window {
    __activeSpeechUtterances?: SpeechSynthesisUtterance[];
    __speechKeepAliveInterval?: any;
    __speechSessionId?: number;
    __speechWatchdogTimer?: any;
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
 * Optimizes intonation, expands acronyms, converts currency & numbers into natural words,
 * and inserts semantic punctuation pauses for Indonesian, English, and Mandarin.
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

  // ==========================================
  // --- 1. BAHASA INDONESIA & TANA LUWU DIALECT ---
  // ==========================================
  if (lang === 'id') {
    // A. Local Greetings & Glottal Stop Softening (mencegah suara robotik tersangkut tanda petik)
    cleaned = cleaned.replace(/salama['’`]\s*ki['’`]\s*(ta['’`]\s*)?pada\s*salama['’`]?/gi, 'Salama Ki tapada salama');
    cleaned = cleaned.replace(/salama['’`]/gi, 'Salama');
    cleaned = cleaned.replace(/tabe['’`]/gi, 'Tabe, ');
    cleaned = cleaned.replace(/ki['’`]/gi, 'Ki');
    cleaned = cleaned.replace(/ta['’`]/gi, 'ta');

    // B. Currency & Numbers to spoken words for natural cadence
    cleaned = cleaned.replace(/\bRp\.?\s*0\b/gi, 'gratis tanpa biaya');
    cleaned = cleaned.replace(/\bRp\.?\s*350\.?000\b/gi, 'tiga ratus lima puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*650\.?000\b/gi, 'enam ratus lima puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*80\.?000\b/gi, 'delapan puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*75\.?000\b/gi, 'tujuh puluh lima ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*50\.?000\b/gi, 'lima puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*30\.?000\b/gi, 'tiga puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*100\.?000\b/gi, 'seratus ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*(\d+)\.?(\d+)?\b/gi, '$1 $2 rupiah');

    // C. Operating Hours & Time Expressions
    cleaned = cleaned.replace(/08:00\s*(s\.?d\.?|-|sampai)\s*15:30\s*WITA/gi, 'pukul delapan pagi sampai pukul lima belas tiga puluh Waktu Indonesia Tengah');
    cleaned = cleaned.replace(/08:00\s*(s\.?d\.?|-|sampai)\s*15:30/gi, 'pukul delapan pagi sampai pukul lima belas tiga puluh');
    cleaned = cleaned.replace(/\bWITA\b/g, 'Waktu Indonesia Tengah');

    // D. Common Public Service Abbreviations & Honorifics
    cleaned = cleaned.replace(/\bBapak\/Ibu\b/gi, 'Bapak atau Ibu');
    cleaned = cleaned.replace(/\bBpk\/Ibu\b/gi, 'Bapak atau Ibu');
    cleaned = cleaned.replace(/\bBpk\.?\b/gi, 'Bapak');
    cleaned = cleaned.replace(/\bs\.d\.\b/gi, 'sampai dengan');
    cleaned = cleaned.replace(/\bdll\.\b/gi, 'dan lain-lain');
    cleaned = cleaned.replace(/\bdsb\.\b/gi, 'dan sebagainya');
    cleaned = cleaned.replace(/\bNo\.?\s*(\d+)/gi, 'Nomor $1');
    cleaned = cleaned.replace(/\bLt\.?\s*(\d+)/gi, 'Lantai $1');
    cleaned = cleaned.replace(/\bKab\.?\s*/gi, 'Kabupaten ');
    cleaned = cleaned.replace(/\bKec\.?\s*/gi, 'Kecamatan ');
    cleaned = cleaned.replace(/\bGed\.?\s*/gi, 'Gedung ');
    cleaned = cleaned.replace(/\bJln\.?\s*/gi, 'Jalan ');
    cleaned = cleaned.replace(/\bJl\.?\s*/gi, 'Jalan ');

    // E. Official Acronyms (Spaced out for articulate letter-by-letter enunciation)
    cleaned = cleaned.replace(/\bMPP Simpurusiang\b/gi, 'M P P Simpurusiang');
    cleaned = cleaned.replace(/\bMPP\b/g, 'M P P');
    cleaned = cleaned.replace(/\bPBG\b/g, 'P B G');
    cleaned = cleaned.replace(/\bNIB\b/g, 'N I B');
    cleaned = cleaned.replace(/\bOSS-RBA\b/gi, 'O S S R B A');
    cleaned = cleaned.replace(/\bOSS\b/g, 'O S S');
    cleaned = cleaned.replace(/\bKTP-el\b/gi, 'K T P elektronik');
    cleaned = cleaned.replace(/\bKTP\b/g, 'K T P');
    cleaned = cleaned.replace(/\bSIMBG\b/gi, 'Sim B G');
    cleaned = cleaned.replace(/\bSIM A\b/gi, 'S I M A');
    cleaned = cleaned.replace(/\bSIM C\b/gi, 'S I M C');
    cleaned = cleaned.replace(/\bSIM\b/g, 'S I M');
    cleaned = cleaned.replace(/\bSKCK\b/g, 'S K C K');
    cleaned = cleaned.replace(/\bSLA\b/g, 'standar waktu pelayanan');
    cleaned = cleaned.replace(/\bBPN\b/g, 'B P N');
    cleaned = cleaned.replace(/\bBUMN\b/g, 'B U M N');
    cleaned = cleaned.replace(/\bNPWP\b/g, 'N P W P');
    cleaned = cleaned.replace(/\bDPUPR\b/g, 'D P U P R');
    cleaned = cleaned.replace(/\bDinas PUPR\b/g, 'Dinas P U P R');
    cleaned = cleaned.replace(/\bDPMPTSP\b/g, 'D P M P T S P');
    cleaned = cleaned.replace(/\bDISDUKCAPIL\b/gi, 'Disdukcapil');
    cleaned = cleaned.replace(/\bKPP\b/g, 'K P P');
    cleaned = cleaned.replace(/\bBPJS Kesehatan\b/gi, 'B P J S Kesehatan');
    cleaned = cleaned.replace(/\bBPJS Ketenagakerjaan\b/gi, 'B P J S Ketenagakerjaan');
    cleaned = cleaned.replace(/\bBPJS\b/g, 'B P J S');
    cleaned = cleaned.replace(/\bPKKPR\b/g, 'P K K P R');
    cleaned = cleaned.replace(/\bSPPL\b/g, 'S P P L');
    cleaned = cleaned.replace(/\bSLF\b/g, 'S L F');
    cleaned = cleaned.replace(/\bPNBP\b/g, 'P N B P');
    cleaned = cleaned.replace(/\bPTSP\b/g, 'P T S P');
    cleaned = cleaned.replace(/\bKK\b/g, 'Kartu Keluarga');
    cleaned = cleaned.replace(/\bKIA\b/g, 'Kartu Identitas Anak');
    cleaned = cleaned.replace(/\bIKD\b/g, 'Identitas Kependudukan Digital');
    cleaned = cleaned.replace(/\bADM\b/g, 'Anjungan Dukcapil Mandiri');
    cleaned = cleaned.replace(/\bSAMSAT\b/gi, 'Samsat');
    cleaned = cleaned.replace(/\bBSrE\b/g, 'Badan Siber dan Sandi Negara');
    cleaned = cleaned.replace(/\bPT\b/g, 'P T');
    cleaned = cleaned.replace(/\bCV\b/g, 'C V');
  }

  // ==========================================
  // --- 2. ENGLISH (INTERNATIONAL ENUNCIATION) ---
  // ==========================================
  else if (lang === 'en') {
    // A. Currency and numbers
    cleaned = cleaned.replace(/\bRp\.?\s*350\,?000\b/gi, '350 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*650\,?000\b/gi, '650 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*0\b/gi, 'free of charge');
    cleaned = cleaned.replace(/\bRp\.?\s*(\d+)/gi, '$1 Indonesian Rupiah');

    // B. Operating Hours & Dates
    cleaned = cleaned.replace(/08:00\s*(to|-)\s*15:30\s*(WITA)?/gi, '8:00 AM to 3:30 PM Central Indonesia Time');
    cleaned = cleaned.replace(/\bWITA\b/g, 'Central Indonesia Time');

    // C. Clarify Indonesian Government Acronyms for International Investors
    cleaned = cleaned.replace(/\bMPP Simpurusiang\b/gi, 'M P P Simpurusiang Public Service Center');
    cleaned = cleaned.replace(/\bMPP\b/g, 'M P P Public Service Center');
    cleaned = cleaned.replace(/\bPBG\b/g, 'Building Approval P B G');
    cleaned = cleaned.replace(/\bSLF\b/g, 'Certificate of Building Fitness S L F');
    cleaned = cleaned.replace(/\bNIB\b/g, 'Single Business Number N I B');
    cleaned = cleaned.replace(/\bOSS-RBA\b/gi, 'O S S Risk-Based Approach system');
    cleaned = cleaned.replace(/\bOSS\b/g, 'O S S system');
    cleaned = cleaned.replace(/\bSIMBG\b/gi, 'S I M B G national building portal');
    cleaned = cleaned.replace(/\bDPMPTSP\b/g, 'Investment Agency D P M P T S P');
    cleaned = cleaned.replace(/\bDPUPR\b/g, 'Public Works Agency D P U P R');
    cleaned = cleaned.replace(/\bPKKPR\b/g, 'Spatial Conformity Confirmation P K K P R');
    cleaned = cleaned.replace(/\bSPPL\b/g, 'Environmental Statement S P P L');
    cleaned = cleaned.replace(/\bNPWP\b/g, 'Tax Identification Number N P W P');
    cleaned = cleaned.replace(/\bKTP\b/g, 'National ID Card');
    cleaned = cleaned.replace(/\bBSrE\b/g, 'National Cyber and Crypto Agency');
    cleaned = cleaned.replace(/\bSLA\b/g, 'Service Level Agreement duration');
    cleaned = cleaned.replace(/\bNo\.\s*(\d+)/gi, 'Number $1');
  }

  // ==========================================
  // --- 3. MANDARIN CHINESE (标准普通话与政务术语) ---
  // ==========================================
  else if (lang === 'zh') {
    // A. 币种与费用转换为地道中文发音
    cleaned = cleaned.replace(/Rp\.?\s*350[\.\,]?000/gi, '三十五万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*650[\.\,]?000/gi, '六十五万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*80[\.\,]?000/gi, '八万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*75[\.\,]?000/gi, '七万五千印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*30[\.\,]?000/gi, '三万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*0/gi, '全程免费');
    cleaned = cleaned.replace(/Rp\.?\s*/gi, '印尼盾 ');

    // B. 时间与作息时间地道转换
    cleaned = cleaned.replace(/08:00\s*(至|-)\s*15:30\s*(WITA)?/gi, '周一至周五上午 8 点至下午 3 点半');
    cleaned = cleaned.replace(/\bWITA\b/g, '印尼中部时间');

    // C. 混合英文缩写优化为标准的中文政务用语（让中文语音合成发音标准清晰，不生硬）
    cleaned = cleaned.replace(/MPP Simpurusiang/gi, '鲁武县欣普鲁香公共服务大楼');
    cleaned = cleaned.replace(/MPP/g, '公共服务大楼');
    cleaned = cleaned.replace(/PBG/g, 'PBG 建筑施工许可');
    cleaned = cleaned.replace(/SLF/g, 'SLF 建筑物竣工合格证');
    cleaned = cleaned.replace(/NIB/g, 'NIB 统一企业商业编号');
    cleaned = cleaned.replace(/OSS-RBA/gi, 'OSS 风险分级在线审批系统');
    cleaned = cleaned.replace(/OSS/g, 'OSS 在线企业注册系统');
    cleaned = cleaned.replace(/NPWP/g, 'NPWP 企业与个人税号');
    cleaned = cleaned.replace(/KTP/g, '印尼居民身份证');
    cleaned = cleaned.replace(/KK/g, '家庭户口卡');
    cleaned = cleaned.replace(/KIA/g, '少儿身份证');
    cleaned = cleaned.replace(/SIMBG/g, '国家建筑在线审批系统');
    cleaned = cleaned.replace(/PKKPR/g, '空间规划合规确认书');
    cleaned = cleaned.replace(/SPPL/g, '环保承诺书');
    cleaned = cleaned.replace(/DPMPTSP/g, '投资与一站式综合审批局');
    cleaned = cleaned.replace(/DPUPR/g, '公共工程与空间规划局');
    cleaned = cleaned.replace(/Bank Sulselbar/g, '南苏尔塞尔巴尔银行');
    cleaned = cleaned.replace(/BSrE/g, '印尼国家密码与网络局');
    cleaned = cleaned.replace(/SLA/g, '法定办理时限');
    cleaned = cleaned.replace(/SKCK/g, '无犯罪记录证明');
    cleaned = cleaned.replace(/SAMSAT/g, '机动车税务窗口');
  }

  // 4. Slashes & Punctuation Cleanup
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

  if (window.__speechWatchdogTimer) {
    clearTimeout(window.__speechWatchdogTimer);
    window.__speechWatchdogTimer = null;
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
 * Language-aware semantic clause chunking (Latin vs CJK characters).
 * Splits text into natural breathing clauses so the synthesizer does not rush,
 * clip, or run out of memory.
 */
function splitTextIntoSafeChunks(text: string, lang: 'id' | 'en' | 'zh' = 'id'): string[] {
  if (!text || !text.trim()) return [];

  const safeChunks: string[] = [];

  if (lang === 'zh') {
    // Mandarin CJK: split by Chinese and standard punctuation
    const cjkParts = text.split(/(?<=[。！？；\n!?;])\s*/);
    for (const part of cjkParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.length <= 35) {
        safeChunks.push(trimmed);
      } else {
        // Subdivide by commas or pauses
        const subParts = trimmed.split(/(?<=[，、,])\s*/);
        let acc = '';
        for (const sub of subParts) {
          if ((acc + sub).length <= 35) {
            acc += sub;
          } else {
            if (acc) safeChunks.push(acc);
            acc = sub;
          }
        }
        if (acc) safeChunks.push(acc);
      }
    }
  } else {
    // Latin languages (Indonesian & English)
    const majorParts = text.split(/(?<=[.?!;。\n！？])\s+/);

    for (const part of majorParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.length <= 80) {
        safeChunks.push(trimmed);
      } else {
        const subClauses = trimmed.split(/(?<=[,，])\s+/);
        let accumulator = '';

        for (const clause of subClauses) {
          if ((accumulator + ' ' + clause).trim().length <= 80) {
            accumulator = (accumulator + ' ' + clause).trim();
          } else {
            if (accumulator) safeChunks.push(accumulator);
            if (clause.length > 80) {
              const words = clause.split(/\s+/);
              let wordAcc = '';
              for (const word of words) {
                if ((wordAcc + ' ' + word).trim().length <= 70) {
                  wordAcc = (wordAcc + ' ' + word).trim();
                } else {
                  if (wordAcc) safeChunks.push(wordAcc);
                  wordAcc = word;
                }
              }
              if (wordAcc) accumulator = wordAcc;
            } else {
              accumulator = clause;
            }
          }
        }
        if (accumulator) safeChunks.push(accumulator);
      }
    }
  }

  return safeChunks.filter(s => s.trim().length > 0);
}

/**
 * Selects the most natural, human-like voice available in the client system.
 * Prioritizes Microsoft Neural Online, Google Natural, and Apple native voices.
 */
function findOptimalVoice(voices: SpeechSynthesisVoice[], lang: 'id' | 'en' | 'zh'): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  if (lang === 'en') {
    return (
      voices.find(v => (v.lang === 'en-US' || v.lang === 'en_US') && (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Online'))) ||
      voices.find(v => (v.lang === 'en-US' || v.lang === 'en_US') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Aria'))) ||
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Google'))) ||
      voices.find(v => v.lang.startsWith('en')) ||
      null
    );
  }

  if (lang === 'zh') {
    return (
      voices.find(v => (v.lang === 'zh-CN' || v.lang === 'zh_CN') && (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Xiaoxiao') || v.name.includes('Yunxi'))) ||
      voices.find(v => (v.lang === 'zh-CN' || v.lang === 'zh_CN') && (v.name.includes('Google') || v.name.includes('Ting-Ting') || v.name.includes('Mei-Jia'))) ||
      voices.find(v => (v.lang.startsWith('zh') || v.lang.includes('cmn')) && (v.name.includes('Google') || v.name.includes('Natural'))) ||
      voices.find(v => v.lang.startsWith('zh') || v.lang.includes('cmn')) ||
      null
    );
  }

  // Indonesian (default)
  return (
    voices.find(v => (v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang === 'id') && (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Gadis') || v.name.includes('Ardi'))) ||
    voices.find(v => (v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang === 'id') && (v.name.includes('Google') || v.name.includes('Damayanti') || v.name.includes('Indonesian'))) ||
    voices.find(v => v.lang.startsWith('id') || v.lang.includes('id_ID') || v.lang.includes('id-ID') || v.lang.includes('ind')) ||
    null
  );
}

/**
 * Plays speech audio with crystal clear high-fidelity quality, calibrated prosody,
 * watchdog safety timers, and natural human breathing cadence.
 */
export function speakCrystalClearText(text: string, options: SpeakOptions = {}): number {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 0;

  const {
    lang = 'id',
    rate,
    pitch,
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

  // 1. Phonetically normalize and enrich text for chosen language
  const normalizedText = formatTextForCrystalClearTts(text, lang);
  if (!normalizedText.trim()) return 0;

  // 2. Intelligent Sentence & Clause Chunking
  const sentenceChunks = splitTextIntoSafeChunks(normalizedText, lang);
  if (sentenceChunks.length === 0) return 0;

  if (onStart) onStart();

  // 3. Select Highest Quality Available Voice
  const voiceList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
  const targetVoice = findOptimalVoice(voiceList, lang);

  // 4. Default Prosody Tuning per Language (Natural human pitch & speed calibration)
  const finalRate = rate !== undefined ? rate : (lang === 'zh' ? 0.88 : lang === 'en' ? 0.90 : 0.92);
  const finalPitch = pitch !== undefined ? pitch : (lang === 'id' ? 1.02 : 1.0);

  // 5. Chromium Keep-Alive Heartbeat
  window.__speechKeepAliveInterval = setInterval(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        try {
          window.speechSynthesis.resume();
        } catch (e) {}
      }
    }
  }, 1500);

  let currentIdx = 0;

  const playNextChunk = () => {
    if (window.__speechSessionId !== currentSessionId) {
      stopAllSpeech();
      return;
    }

    if (currentIdx >= sentenceChunks.length) {
      stopAllSpeech();
      if (onEnd) onEnd();
      return;
    }

    const chunkText = sentenceChunks[currentIdx];
    const utterance = new SpeechSynthesisUtterance(chunkText);

    // Retain utterance in global array to prevent GC eviction
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

    utterance.rate = Math.min(Math.max(finalRate, 0.75), 1.15);
    utterance.pitch = finalPitch;
    utterance.volume = volume;

    let hasHandledChunk = false;

    const handleChunkCompleted = () => {
      if (hasHandledChunk) return;
      hasHandledChunk = true;

      if (window.__speechWatchdogTimer) {
        clearTimeout(window.__speechWatchdogTimer);
        window.__speechWatchdogTimer = null;
      }

      if (window.__activeSpeechUtterances) {
        window.__activeSpeechUtterances = window.__activeSpeechUtterances.filter(u => u !== utterance);
      }

      if (window.__speechSessionId !== currentSessionId) return;

      currentIdx++;
      // Natural 35ms micro-pause between clauses
      setTimeout(() => {
        playNextChunk();
      }, 35);
    };

    utterance.onend = () => {
      handleChunkCompleted();
    };

    utterance.onerror = (e) => {
      if (window.__speechSessionId !== currentSessionId) return;
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      if (onError) onError(e);
      handleChunkCompleted();
    };

    // 6. Intelligent Utterance Watchdog
    const estimatedDurationMs = Math.max(chunkText.length * 85, 1800) + 2500;
    if (window.__speechWatchdogTimer) clearTimeout(window.__speechWatchdogTimer);
    window.__speechWatchdogTimer = setTimeout(() => {
      if (!hasHandledChunk && window.__speechSessionId === currentSessionId) {
        handleChunkCompleted();
      }
    }, estimatedDurationMs);

    if (window.speechSynthesis.paused) {
      try { window.speechSynthesis.resume(); } catch (e) {}
    }

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('speechSynthesis.speak error:', err);
      handleChunkCompleted();
    }
  };

  playNextChunk();
  return currentSessionId;
}

