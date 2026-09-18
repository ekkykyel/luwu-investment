import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Bot, VolumeX, Eye, Type, Sparkles, Check, Info, Mic, MicOff, 
  Accessibility, HeartHandshake, PhoneCall, HelpCircle, X, CheckCircle2, 
  ShieldCheck, MapPin, Compass, ArrowRight, UserCheck, AlertCircle,
  FileText, Clock, DollarSign, Building2, Copy, Play, Square, Share2,
  Globe, Radio, RotateCcw, Send, Gauge, Search, ChevronRight, ChevronLeft,
  Minimize2, Maximize2, MessageSquareText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { resolveMppVoiceQuery, VoiceAssistantResponse, appendVoiceClosing, prependVoiceGreeting } from '../../utils/mppVoiceKnowledge';
import { speakCrystalClearText, stopAllSpeech, formatTextForCrystalClearTts } from '../../utils/mppAudioEngine';

/**
 * Phonetically normalizes spoken abbreviations and Indonesian conversational queries
 * into precise administrative search terms.
 */
function normalizeSpokenVoiceQuery(query: string): string {
  if (!query) return '';
  let clean = query.trim();

  // Strip conversational fillers
  clean = clean.replace(/^(halo|hai|tolong|mohon|asisten|tanya|mau tanya|saya mau tanya|bagaimana cara|apa saja syarat|apa syarat|syarat|info|minta info|info tentang)\s+/gi, '');

  // Expand spoken acronyms
  clean = clean.replace(/\bpe\s*be\s*ge\b/gi, 'PBG');
  clean = clean.replace(/\bte\s*be\s*ge\b/gi, 'PBG');
  clean = clean.replace(/\bka\s*te\s*pe\b/gi, 'KTP');
  clean = clean.replace(/\bes\s*i\s*em\b/gi, 'SIM');
  clean = clean.replace(/\bes\s*ka\s*ce\s*ka\b/gi, 'SKCK');
  clean = clean.replace(/\bo\s*es\s*es\b/gi, 'OSS');
  clean = clean.replace(/\ben\s*i\s*be\b/gi, 'NIB');
  clean = clean.replace(/\bbe\s*pe\s*je\s*es\b/gi, 'BPJS');
  clean = clean.replace(/\bbe\s*pe\s*en\b/gi, 'BPN');
  clean = clean.replace(/\bpe\s*ka\s*ka\s*pe\s*er\b/gi, 'PKKPR');
  clean = clean.replace(/\bes\s*el\s*ef\b/gi, 'SLF');
  clean = clean.replace(/\ben\s*pe\s*we\s*pe\b/gi, 'NPWP');
  clean = clean.replace(/\bde\s*pe\s*u\s*pe\s*er\b/gi, 'DPUPR');
  clean = clean.replace(/\bde\s*pe\s*em\s*pe\s*te\s*es\s*pe\b/gi, 'DPMPTSP');
  clean = clean.replace(/\bdok\s*capil\b/gi, 'Disdukcapil');
  clean = clean.replace(/\bduk\s*capil\b/gi, 'Disdukcapil');
  clean = clean.replace(/\bke\s*ka\b/gi, 'Kartu Keluarga');
  clean = clean.replace(/\bka\s*i\s*a\b/gi, 'KIA');
  clean = clean.replace(/\bi\s*ka\s*de\b/gi, 'IKD');

  return clean.trim() || query.trim();
}

interface InclusivityAccessibilityBarProps {
  isDark?: boolean;
  onHighContrastToggle?: (enabled: boolean) => void;
  onFontSizeChange?: (size: 'small' | 'normal' | 'large' | 'xlarge') => void;
  onVoiceSearchQuery?: (query: string) => void;
}

export type ContrastModeType = 'standard' | 'high-contrast-yellow' | 'monochrome';
export type FontSizeType = 'small' | 'normal' | 'large' | 'xlarge';

export const InclusivityAccessibilityBar: React.FC<InclusivityAccessibilityBarProps> = ({
  isDark = false,
  onHighContrastToggle,
  onFontSizeChange,
  onVoiceSearchQuery,
}) => {
  const { i18n, t } = useTranslation();
  
  // Persistent accessibility states
  const [contrastMode, setContrastMode] = useState<ContrastModeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luwu_accessibility_contrast');
      if (saved === 'high-contrast-yellow' || saved === 'monochrome' || saved === 'standard') {
        return saved;
      }
      if (localStorage.getItem('luwu_high_contrast') === 'true') {
        return 'high-contrast-yellow';
      }
    }
    return 'standard';
  });

  const [fontSize, setFontSize] = useState<FontSizeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luwu_accessibility_font_size');
      if (saved === 'small' || saved === 'normal' || saved === 'large' || saved === 'xlarge') {
        return saved;
      }
    }
    return 'normal';
  });

  const [isContrastMenuOpen, setIsContrastMenuOpen] = useState(false);
  const contrastMenuRef = useRef<HTMLDivElement>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  
  // State for Accessibility Assistance Hub Modal
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);
  const [assistanceTab, setAssistanceTab] = useState<'fasilitas' | 'request' | 'jbi'>('fasilitas');
  
  // Trilingual Voice Assistant State (ID: Bahasa Indonesia, EN: English, ZH: 中文/Mandarin)
  const [voiceLanguage, setVoiceLanguage] = useState<'id' | 'en' | 'zh'>(() => {
    const raw = typeof window !== 'undefined' ? (localStorage.getItem('i18nextLng') || navigator.language || 'id') : 'id';
    return raw.startsWith('zh') ? 'zh' : raw.startsWith('en') ? 'en' : 'id';
  });
  const [speechRate, setSpeechRate] = useState<number>(0.92);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceListeningModalOpen, setIsVoiceListeningModalOpen] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recognizedVoiceText, setRecognizedVoiceText] = useState('');
  const [voiceResponse, setVoiceResponse] = useState<VoiceAssistantResponse | null>(null);
  const [isVoiceResponseModalOpen, setIsVoiceResponseModalOpen] = useState(false);
  const [isProcessingVoiceAi, setIsProcessingVoiceAi] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [quickQuestionCategory, setQuickQuestionCategory] = useState<string>('populer');
  const [quickQuestionSearch, setQuickQuestionSearch] = useState<string>('');
  
  // Floating Voice Assistant Capsule State (Collapsible / Expandable for Android comfort)
  const [isFabCollapsed, setIsFabCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mpp_assistant_fab_collapsed') === 'true';
    }
    return false;
  });

  const toggleFabCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFabCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('mpp_assistant_fab_collapsed', String(next)); } catch {}
      return next;
    });
  };
  
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const recordingSecondsRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    recordingSecondsRef.current = recordingSeconds;
  }, [recordingSeconds]);
  const currentTranscriptRef = useRef<string>('');
  const speechSessionRef = useRef<number>(0);

  // Synchronize voiceLanguage dynamically whenever global portal i18n language changes
  useEffect(() => {
    const rawLang = i18n.language || 'id';
    const targetLang: 'id' | 'en' | 'zh' = rawLang.startsWith('zh') ? 'zh' : rawLang.startsWith('en') ? 'en' : 'id';
    if (targetLang !== voiceLanguage) {
      setVoiceLanguage(targetLang);
    }
  }, [i18n.language]);

  // Load and cache browser speech synthesis voices reactively
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const updateVoiceList = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoiceList();
    window.speechSynthesis.onvoiceschanged = updateVoiceList;
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleSwitchLanguage = (lang: 'id' | 'en' | 'zh') => {
    setVoiceLanguage(lang);
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
      try {
        localStorage.setItem('i18nextLng', lang);
      } catch (e) {}
    }
    if (lang === 'en') {
      notify('Switched to English Voice Assistant & Portal');
    } else if (lang === 'zh') {
      notify('已切换至中文政务语音与全站门户');
    } else {
      notify('Beralih ke Bahasa Indonesia (MPP Simpurusiang)');
    }
  };

  // State for Wheelchair & Assistance Request Form
  const [requestForm, setRequestForm] = useState({
    nama: '',
    phone: '',
    jenisKebutuhan: 'Kursi Roda & Petugas Pendamping',
    jamKedatangan: '09:00',
    tanggal: new Date().toISOString().split('T')[0],
    catatan: ''
  });
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);

  // Sync ref with state
  useEffect(() => {
    currentTranscriptRef.current = recognizedVoiceText;
  }, [recognizedVoiceText]);
  // Initialize Speech Recognition on language change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Stay active even when user pauses
        recognition.interimResults = true; // Real-time preview for Android
        recognition.maxAlternatives = 3;
        
        // Dynamic BCP 47 language code
        if (voiceLanguage === 'en') {
          recognition.lang = 'en-US';
        } else if (voiceLanguage === 'zh') {
          recognition.lang = 'zh-CN';
        } else {
          recognition.lang = 'id-ID';
        }

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          const rawCombined = (finalTranscript + interimTranscript).trim();
          const normalized = normalizeSpokenVoiceQuery(rawCombined);

          if (normalized) {
            setRecognizedVoiceText(normalized);
            currentTranscriptRef.current = normalized;
            
            // Reset silence auto-submit window (2.6s timeout for smooth sentence completion)
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
              if (currentTranscriptRef.current.trim().length > 2) {
                finalizeVoiceRecording();
              }
            }, 2600);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition warning/error:', event.error);
          if (event.error === 'not-allowed') {
            notify('Izin mikrofon ditolak. Mohon izinkan akses mikrofon di peramban Anda.');
            stopVoiceListening();
          }
        };

        recognition.onend = () => {
          // If still marked listening (e.g. system timeout on mobile), auto-restart unless max time reached
          if (isListeningRef.current && recordingSecondsRef.current < 44) {
            try {
              recognition.start();
            } catch (e) {
              // Ignore
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [voiceLanguage]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSessionRef.current += 1;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startVoiceListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition && !recognitionRef.current) {
      notify('Fitur input suara belum didukung di peramban ini. Anda dapat mendengarkan audio melalui tombol TTS Suara.');
      return;
    }

    // Stop existing TTS
    if ('speechSynthesis' in window) {
      speechSessionRef.current += 1;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setRecognizedVoiceText('');
    currentTranscriptRef.current = '';
    setRecordingSeconds(0);
    setIsListening(true);
    setIsVoiceListeningModalOpen(true);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 44) { // Max 45 seconds duration
          finalizeVoiceRecording();
          return 45;
        }
        return prev + 1;
      });
    }, 1000);

    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.warn("Recognition start attempt:", err);
    }
  };

  const stopVoiceListening = () => {
    setIsListening(false);
    setIsVoiceListeningModalOpen(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    try {
      recognitionRef.current?.stop();
    } catch (err) {}
  };

  const finalizeVoiceRecording = () => {
    const textToProcess = (currentTranscriptRef.current || recognizedVoiceText).trim();
    stopVoiceListening();
    if (textToProcess && textToProcess.length > 1) {
      handleVoiceCommand(textToProcess);
    } else {
      notify('Belum ada suara terdeteksi. Silakan coba lagi dan berbicara di dekat mikrofon.');
    }
  };

  const resetVoiceRecording = () => {
    setRecognizedVoiceText('');
    currentTranscriptRef.current = '';
    setRecordingSeconds(0);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    try {
      recognitionRef.current?.stop();
      setTimeout(() => {
        try { recognitionRef.current?.start(); } catch (e) {}
      }, 200);
    } catch (e) {}
  };
  const handleCloseVoiceResponse = () => {
    speechSessionRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopSpeaking();
    setIsVoiceResponseModalOpen(false);
    setIsProcessingVoiceAi(false);
    setRecognizedVoiceText('');
    setVoiceResponse(null);
    currentTranscriptRef.current = '';
    stopVoiceListening();
  };

  const handleVoiceCommand = async (cmd: string) => {
    const clean = cmd.trim();
    if (!clean) return;
    const currentSessionId = ++speechSessionRef.current;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    // Respect the user's explicit language preference (voiceLanguage synced with i18n).
    // Do NOT guess or override based on keywords like 'PBG' or 'NIB' which are Indonesian official acronyms!
    let targetLang = voiceLanguage;
    
    // Only safely switch to Chinese if user explicitly spoke Chinese Hanzi characters while in other modes
    if (/[\u4e00-\u9fa5]/.test(clean) && voiceLanguage !== 'zh') {
      targetLang = 'zh';
      setVoiceLanguage('zh');
      if (i18n.language !== 'zh') {
        i18n.changeLanguage('zh');
        try { localStorage.setItem('i18nextLng', 'zh'); } catch (e) {}
      }
    }

    notify(
      targetLang === 'zh'
        ? `正在处理您的语音提问: "${clean}"...`
        : targetLang === 'en'
        ? `Processing inquiry: "${clean}"...`
        : `Memproses pertanyaan: "${clean}"...`
    );
    
    // 1. Trigger parent search filter if provided
    if (onVoiceSearchQuery) {
      onVoiceSearchQuery(clean);
    }

    // 2. Evaluate Instant Multilingual Voice Knowledge Engine (0ms structured answer)
    const localRes = resolveMppVoiceQuery(clean, targetLang);

    if (localRes.matched) {
      setVoiceResponse(localRes);
      setIsVoiceResponseModalOpen(true);
      speakMessage(localRes.speechText, targetLang);

      if (localRes.targetSectionId) {
        const targetEl = document.getElementById(localRes.targetSectionId);
        if (targetEl) {
          setTimeout(() => {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }, 600);
        }
      }
      return;
    }

    // 3. Contact Gemini AI Backend endpoint with verified language parameter
    setIsProcessingVoiceAi(true);
    setVoiceResponse(localRes); // Immediate fallback UI
    setIsVoiceResponseModalOpen(true);

    try {
      const res = await fetch('/api/mpp/voice-assistant', {
        method: 'POST', signal: abortControllerRef.current?.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean, language: targetLang })
      });

      if (res.ok) {
        if (speechSessionRef.current !== currentSessionId) return;
        const aiData = await res.json();
        if (aiData && aiData.speechText) {
          const finalSpeech = appendVoiceClosing(prependVoiceGreeting(aiData.speechText, targetLang), targetLang);
          const aiResponse: VoiceAssistantResponse = {
            matched: true,
            serviceTitle: aiData.serviceTitle || (targetLang === 'zh' ? `政务咨询: ${clean}` : targetLang === 'en' ? `Inquiry: ${clean}` : `Layanan: ${clean}`),
            instansi: aiData.instansi || (targetLang === 'zh' ? "鲁武县公共服务大楼 (MPP Simpurusiang)" : targetLang === 'en' ? "MPP Simpurusiang Luwu Regency" : "Mal Pelayanan Publik (MPP) Simpurusiang Luwu"),
            speechText: finalSpeech,
            query: clean,
            persyaratan: Array.isArray(aiData.persyaratan) ? aiData.persyaratan : [targetLang === 'zh' ? "完整申请资料" : targetLang === 'en' ? "Complete application documents" : "Dokumen permohonan lengkap"],
            alurProses: Array.isArray(aiData.alurProses) ? aiData.alurProses : [targetLang === 'zh' ? "大堂取号并前往窗口" : targetLang === 'en' ? "Take queue number and proceed to counter" : "Ambil nomor antrean di lobi utama"],
            biaya: aiData.biaya || (targetLang === 'zh' ? "大部分政务免费（法定规费除外）" : targetLang === 'en' ? "Most services free of charge" : "Sebagian besar layanan gratis"),
            sla: aiData.sla || (targetLang === 'zh' ? "依据法定标准时限" : targetLang === 'en' ? "According to standard procedure" : "Sesuai standar operasional instansi"),
            lokasiLoket: aiData.lokasiLoket || (targetLang === 'zh' ? "MPP Simpurusiang 大楼一楼" : targetLang === 'en' ? "Ground Floor, MPP Simpurusiang" : "Lantai 1 Gedung MPP Simpurusiang"),
            targetSectionId: "layanan"
          };
          setVoiceResponse(aiResponse);
          speakMessage(finalSpeech, targetLang);
          setIsProcessingVoiceAi(false);
          return;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.warn("AI Voice endpoint fallback to local knowledge:", err);
    }
    if (speechSessionRef.current !== currentSessionId) return;
    setIsProcessingVoiceAi(false);
    speakMessage(localRes.speechText, targetLang);
  };

  /**
   * Crystal Clear High-Fidelity Anti-Stutter Speech Engine:
   * 1. Phonetically converts acronyms (MPP -> M P P, PBG -> P B G) & removes local apostrophes.
   * 2. Retains persistent global SpeechSynthesisUtterance references to block JavaScript V8 Garbage Collector mid-speech.
   * 3. Runs active Chromium audio keep-alive interval to prevent Chrome freeze on long sentences.
   * 4. Smart sentence chunking with 60ms micro-pauses for natural human breathing cadence.
   */
  const speakMessage = (text: string, lang = voiceLanguage, customRate = speechRate) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    speechSessionRef.current += 1;
    setIsSpeaking(true);

    speakCrystalClearText(text, {
      lang,
      rate: customRate,
      pitch: 1.0,
      volume: 1.0,
      availableVoices,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const stopSpeaking = () => {
    speechSessionRef.current += 1;
    stopAllSpeech();
    setIsSpeaking(false);
    notify(voiceLanguage === 'zh' ? '已停止语音朗读。' : voiceLanguage === 'en' ? 'Voice guide stopped.' : 'Suara panduan dihentikan.');
  };

  // Sync contrast mode and font size to DOM on mount and changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Apply contrast
      document.documentElement.classList.remove('high-contrast-mode', 'contrast-yellow-black', 'contrast-monochrome');
      if (contrastMode === 'high-contrast-yellow') {
        document.documentElement.classList.add('high-contrast-mode', 'contrast-yellow-black');
      } else if (contrastMode === 'monochrome') {
        document.documentElement.classList.add('contrast-monochrome');
      }

      // Apply font size
      document.documentElement.classList.remove('text-size-small', 'text-size-normal', 'text-size-large', 'text-size-xlarge');
      document.documentElement.classList.add(`text-size-${fontSize}`);
    }
  }, [contrastMode, fontSize]);

  // Outside click listener for Contrast dropdown menu
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (contrastMenuRef.current && !contrastMenuRef.current.contains(event.target as Node)) {
        setIsContrastMenuOpen(false);
      }
    };
    if (isContrastMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isContrastMenuOpen]);

  const setAndSaveContrastMode = (mode: ContrastModeType) => {
    setContrastMode(mode);
    setIsContrastMenuOpen(false);
    try {
      localStorage.setItem('luwu_accessibility_contrast', mode);
      localStorage.setItem('luwu_high_contrast', mode === 'high-contrast-yellow' ? 'true' : 'false');
    } catch (e) {}

    if (onHighContrastToggle) {
      onHighContrastToggle(mode !== 'standard');
    }

    if (mode === 'high-contrast-yellow') {
      notify(voiceLanguage === 'zh' ? '🟡 已启用黑黄高对比度模式 (WCAG AAA)' : voiceLanguage === 'en' ? '🟡 High Contrast Yellow-Black Mode Enabled (WCAG AAA)' : '🟡 Mode Kontras Tinggi Hitam-Kuning Aktif (Standar Ramah Netra & Lansia - WCAG AAA)');
    } else if (mode === 'monochrome') {
      notify(voiceLanguage === 'zh' ? '⚪ 已启用黑白单色模式 (无障碍色盲友好)' : voiceLanguage === 'en' ? '⚪ Monochrome Grayscale Mode Enabled (CVD Friendly)' : '⚪ Mode Monokrom Hitam-Putih Aktif (Bebas Distraksi & Ramah Buta Warna)');
    } else {
      notify(voiceLanguage === 'zh' ? '🔘 已恢复标准色彩显示模式' : voiceLanguage === 'en' ? '🔘 Standard Display Mode Restored' : '🔘 Mode Tampilan Standar (Normal) Aktif');
    }
  };

  const cycleContrastMode = () => {
    if (contrastMode === 'standard') {
      setAndSaveContrastMode('high-contrast-yellow');
    } else if (contrastMode === 'high-contrast-yellow') {
      setAndSaveContrastMode('monochrome');
    } else {
      setAndSaveContrastMode('standard');
    }
  };

  const changeFontSize = (size: FontSizeType) => {
    setFontSize(size);
    try {
      localStorage.setItem('luwu_accessibility_font_size', size);
    } catch (e) {}

    if (onFontSizeChange) onFontSizeChange(size);

    const labelMap = { 
      small: voiceLanguage === 'zh' ? '较小字号 (90%)' : voiceLanguage === 'en' ? 'Small Font (90%)' : 'Ukuran Kompak A- (90%)',
      normal: voiceLanguage === 'zh' ? '标准字号 (100%)' : voiceLanguage === 'en' ? 'Normal Font (100%)' : 'Ukuran Standar A (100%)', 
      large: voiceLanguage === 'zh' ? '大字号 (120%)' : voiceLanguage === 'en' ? 'Large Font (120%)' : 'Ukuran Besar A+ (120%)', 
      xlarge: voiceLanguage === 'zh' ? '超大字号 (140%)' : voiceLanguage === 'en' ? 'Extra Large Font (140%)' : 'Ukuran Sangat Besar A++ (140%)' 
    };
    notify(voiceLanguage === 'zh' ? `字体已调整为 ${labelMap[size]}` : voiceLanguage === 'en' ? `Text set to ${labelMap[size]}` : `Teks diubah ke ${labelMap[size]}`);
  };

  const handleSpeakOverview = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeaking) {
        stopSpeaking();
      } else {
        const activeLang = voiceLanguage;
        let text = "";
        if (activeLang === 'en') {
          text = "Welcome to MPP Simpurusiang Luwu Regency. We provide 19 official government agencies with more than 120 public and business licensing services, priority lanes for seniors and people with disabilities, and digital queuing. Tap the microphone button to ask any service questions. Thank You.";
        } else if (activeLang === 'zh') {
          text = "您好，欢迎来到印度尼西亚鲁武县公共服务大楼。我们入驻了19个官方政府机构，提供120多项综合政务与外商投资许可、无障碍绿色通道及数字化智能取号。点击麦克风按钮即可通过语音咨询办理事项。谢谢。";
        } else {
          text = "Tabe', Selamat datang di Portal Mal Pelayanan Publik Simpurusiang Kabupaten Luwu. Kami menyediakan 19 instansi resmi pemerintah dan BUMN, lebih dari 120 layanan perizinan dan non perizinan, antrean digital langsung, jalur prioritas disabilitas, dan pendampingan petugas bebas retribusi. Tekan tombol mikrofon untuk bertanya persyaratan izin apa pun. Terima Kasih, Salama'Ki' Tapada Salama'.";
        }
        speakMessage(text, activeLang);
        notify(activeLang === 'en' ? 'Reading MPP overview in English...' : activeLang === 'zh' ? '正在用普通话朗读综合政务导览...' : 'Membacakan ringkasan layanan inklusif MPP...');
      }
    } else {
      notify(voiceLanguage === 'zh' ? '当前浏览器不支持语音合成' : voiceLanguage === 'en' ? 'Voice reader not supported on this browser' : 'Fitur Pembaca Suara tidak didukung di peramban ini');
    }
  };

  const handleCopyVoiceDetails = () => {
    if (!voiceResponse) return;
    const textToCopy = `🏛️ LAYANAN / SERVICE: ${voiceResponse.serviceTitle}\n🏢 INSTANSI: ${voiceResponse.instansi}\n📍 LOKASI LOKET: ${voiceResponse.lokasiLoket}\n⏱️ WAKTU (SLA): ${voiceResponse.sla}\n💰 BIAYA / FEES: ${voiceResponse.biaya}\n\n📋 PERSYARATAN / REQUIREMENTS:\n${voiceResponse.persyaratan.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n🔄 ALUR / WORKFLOW:\n${voiceResponse.alurProses.map((a) => a).join('\n')}\n\n(Mal Pelayanan Publik Simpurusiang Kab. Luwu - Tana Luwu)`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      notify('Rincian persyaratan dan alur proses berhasil disalin ke clipboard.');
    }).catch(() => {
      notify('Gagal menyalin teks.');
    });
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.nama || !requestForm.phone) {
      notify('Mohon lengkapi nama dan nomor WhatsApp Anda.');
      return;
    }
    setIsRequestSubmitted(true);
    speakMessage(`Tabe' ${requestForm.nama}, permohonan pendampingan disabilitas telah diterima. Petugas Front Office MPP Simpurusiang akan siap menyambut di gerbang utama. Terima Kasih, Salama'Ki' Tapada Salama'.`, 'id');
    setTimeout(() => {
      setIsRequestSubmitted(false);
      setIsAssistanceModalOpen(false);
      notify('Permohonan bantuan disabilitas berhasil dikirimkan ke Front Office MPP.');
    }, 4000);
  };

  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3800);
  };

  // Comprehensive categorized collection of quick questions
  const quickQuestionCategories = [
    { id: 'populer', label: '🌟 Populer', labelEn: '🌟 Popular', labelZh: '🌟 热门' },
    { id: 'dukcapil', label: '🪪 Disdukcapil (KTP/KK)', labelEn: '🪪 Civil Registry', labelZh: '🪪 户政身份' },
    { id: 'pbg', label: '🏗️ PBG & Tata Ruang', labelEn: '🏗️ Building & Spatial', labelZh: '🏗️ 建筑与规划' },
    { id: 'usaha', label: '💼 Usaha NIB & Investasi', labelEn: '💼 Business & Investment', labelZh: '💼 投资与执照' },
    { id: 'polres', label: '🚗 SIM, SKCK & SAMSAT', labelEn: '🚗 Police & Vehicle', labelZh: '🚗 驾照与警务' },
    { id: 'bpjs', label: '🏥 BPJS & Pajak Daerah', labelEn: '🏥 BPJS & Tax', labelZh: '🏥 医保与税务' },
    { id: 'paspor', label: '🛂 Paspor, Nikah & BBM', labelEn: '🛂 Passport & Marriage', labelZh: '🛂 护照与婚姻' },
    { id: 'fasilitas', label: '♿ Jam Buka & Inklusif', labelEn: '♿ Hours & Accessibility', labelZh: '♿ 时间与设施' },
  ];

  const quickQuestionsData: Record<string, { id: string; en: string; zh: string }[]> = {
    populer: [
      { id: "Syarat izin PBG bangunan gedung", en: "Building Approval PBG Requirements", zh: "办理PBG建筑许可要求" },
      { id: "Cara membuat KTP baru & ganti KTP rusak", en: "New E-KTP and Card Replacement", zh: "申领新身份证及补换领" },
      { id: "Perpanjang SIM A dan SIM C", en: "Driver License SIM Renewal", zh: "换领机动车驾驶执照SIM" },
      { id: "Pembuatan NIB izin usaha OSS", en: "Business License NIB via OSS", zh: "办理企业营业执照NIB" },
      { id: "Biaya dan syarat pengurusan Paspor", en: "Passport Application & Fees", zh: "护照申请办理与法定规费" },
      { id: "Jam operasional pelayanan MPP", en: "MPP Opening Hours & Schedule", zh: "MPP公共服务大楼开放时间" }
    ],
    dukcapil: [
      { id: "Syarat buat KTP baru pemula usia 17 tahun", en: "Requirements for 17yo first-time KTP", zh: "年满17周岁首次申办身份证" },
      { id: "Cara urus KTP hilang atau rusak", en: "Lost or damaged KTP replacement", zh: "身份证遗失或破损补办" },
      { id: "Penerbitan dan perubahan Kartu Keluarga (KK)", en: "Family Card KK update and issuance", zh: "户口本Kartu Keluarga变更申领" },
      { id: "Aktivasi KTP Digital IKD di HP", en: "Digital ID IKD Mobile Activation", zh: "手机端激活数字身份证IKD" },
      { id: "Syarat pembuatan Kartu Identitas Anak (KIA)", en: "Child Identity Card KIA requirements", zh: "申领少儿身份证KIA要求" },
      { id: "Cara mengurus Akta Kelahiran baru", en: "Birth Certificate Registration", zh: "申办新生儿出生证明Akta" },
      { id: "Syarat penerbitan Akta Kematian", en: "Death Certificate Issuance", zh: "申办死亡证明Akta" }
    ],
    pbg: [
      { id: "Syarat izin PBG bangunan gedung", en: "Building Approval PBG Requirements", zh: "办理PBG建筑工程许可要求" },
      { id: "Berapa biaya retribusi PBG gedung?", en: "Building Retribution Fee calculation", zh: "建筑许可规费计算标准" },
      { id: "Cara mengurus izin tata ruang PKKPR", en: "PKKPR Spatial Confirmation", zh: "办理空间规划合规证明PKKPR" },
      { id: "Syarat Sertifikat Laik Fungsi (SLF)", en: "Certificate of Building Fitness SLF", zh: "申办建筑物适航许可SLF" },
      { id: "Cara konsultasi teknis PBG SIMBG", en: "SIMBG Technical Consultation", zh: "SIMBG国家建筑系统技术咨询" }
    ],
    usaha: [
      { id: "Pembuatan NIB izin usaha OSS", en: "Business License NIB via OSS", zh: "通过OSS系统申领NIB营业执照" },
      { id: "Syarat izin usaha PT dan CV di OSS", en: "Company PT and CV OSS License", zh: "企业法人PT/CV营业许可注册" },
      { id: "Peluang investasi hilirisasi di Luwu", en: "Investment & Downstreaming in Luwu", zh: "鲁武县下游产业与投资优惠政策" },
      { id: "Panduan pelaporan LKPM investasi", en: "LKPM Investment Report guide", zh: "企业投资进度LKPM申报指引" }
    ],
    polres: [
      { id: "Perpanjang SIM A dan SIM C", en: "Driver License SIM Renewal", zh: "换领机动车驾驶执照SIM" },
      { id: "Berapa biaya resmi pembuatan SKCK?", en: "Police Certificate SKCK fee and terms", zh: "办理无犯罪记录证明SKCK规费" },
      { id: "Syarat bayar pajak motor dan mobil SAMSAT", en: "SAMSAT Vehicle Tax Payment", zh: "缴纳机动车年检税费SAMSAT" },
      { id: "Syarat tes kesehatan dan psikologi SIM", en: "Medical & Psychological SIM test", zh: "驾驶证体检与心理测试" }
    ],
    bpjs: [
      { id: "Cara daftar BPJS Kesehatan mandiri", en: "BPJS Health Insurance Registration", zh: "办理印尼国家医保BPJS" },
      { id: "Syarat pindah faskes tingkat 1 BPJS", en: "Change BPJS Primary Clinic Faskes", zh: "医保指定定点门诊变更" },
      { id: "Cara membuat NPWP pribadi online", en: "Individual Tax Number NPWP online", zh: "线上申领个人税号NPWP" },
      { id: "Cara bayar PBB-P2 dan validasi BPHTB", en: "PBB Property Tax & BPHTB validation", zh: "缴纳土地房产税PBB及契税验证" }
    ],
    paspor: [
      { id: "Biaya dan syarat pengurusan Paspor", en: "Passport Application & Fees", zh: "护照申请办理与法定规费" },
      { id: "Cara nikah gratis di Balai Nikah MPP", en: "Free Wedding at MPP Marriage Hall", zh: "在MPP公共礼堂免费登记结婚" },
      { id: "Syarat rekomendasi BBM subsidi nelayan", en: "Subsidized Fuel permit for fishermen", zh: "申请渔民及养殖柴油补贴许可" }
    ],
    fasilitas: [
      { id: "Jam operasional pelayanan MPP", en: "MPP Opening Hours & Schedule", zh: "MPP公共服务大楼开放时间" },
      { id: "Fasilitas kursi roda & pendampingan disabilitas", en: "Wheelchair and Disability support", zh: "轮椅及无障碍助残绿色通道" },
      { id: "Cara ambil nomor antrean di mesin Kiosk", en: "Taking Queue Ticket from Touchscreen", zh: "大堂触屏取号机使用方法" }
    ]
  };

  // Filtered quick questions
  const currentCategoryQuestions = quickQuestionsData[quickQuestionCategory] || quickQuestionsData.populer;
  const filteredQuestions = quickQuestionSearch.trim()
    ? Object.values(quickQuestionsData).flat().filter(q => {
        const queryTerm = quickQuestionSearch.toLowerCase();
        return q.id.toLowerCase().includes(queryTerm) || 
               q.en.toLowerCase().includes(queryTerm) || 
               q.zh.includes(queryTerm);
      })
    : currentCategoryQuestions;

  const handleQuickQuestionClick = (qText: string) => {
    setRecognizedVoiceText(qText);
    currentTranscriptRef.current = qText;
    finalizeVoiceRecording();
  };

  const handleDirectAskInResponse = (qText: string) => {
    handleVoiceCommand(qText);
  };

  return (
    <>
      {/* --- INCLUSIVITY BAR UTAMA (RESPONSIF MOBILE / ANDROID, TANPA TERPOTONG) --- */}
      <div className="w-full bg-slate-900/95 text-white backdrop-blur-md border-b border-emerald-500/20 py-1 px-2 sm:px-4 relative z-20 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Disabilitas & Aksesibilitas Indicator & Hub Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsAssistanceModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold tracking-wide transition-all group cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              title="Buka Pusat Bantuan Disabilitas & Fasilitas Inklusif MPP"
            >
              <Accessibility className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="sm:hidden text-[10.5px]">
                {voiceLanguage === 'zh' ? '无障碍助残' : voiceLanguage === 'en' ? 'Accessibility' : 'Ramah Inklusif'}
              </span>
              <span className="hidden sm:inline">
                {voiceLanguage === 'zh' ? '无障碍助残与绿色通道' : voiceLanguage === 'en' ? 'Inclusivity & Accessibility Portal' : 'Portal Ramah Inklusif & Disabilitas'}
              </span>
              <span className="hidden lg:inline-flex bg-emerald-400/20 text-[9px] px-1.5 py-0.2 rounded font-mono uppercase">
                {voiceLanguage === 'zh' ? '绿色通道' : voiceLanguage === 'en' ? 'Services' : 'Info Fasilitas'}
              </span>
            </button>
          </div>

          {/* Action Controls (Clean, Compact & Adaptive on Android) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Audio Reader / TTS */}
            <button
              onClick={handleSpeakOverview}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-medium transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Dengarkan Suara Ringkasan Layanan MPP"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden md:inline">
                {isSpeaking
                  ? (voiceLanguage === 'zh' ? '停止播放' : voiceLanguage === 'en' ? 'Stop' : 'Hentikan')
                  : (voiceLanguage === 'zh' ? '语音朗读' : voiceLanguage === 'en' ? 'Voice TTS' : 'TTS Suara')}
              </span>
            </button>

            {/* High Contrast Dropdown & Cycler */}
            <div className="relative" ref={contrastMenuRef}>
              <button
                onClick={() => setIsContrastMenuOpen(prev => !prev)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-medium transition-all cursor-pointer ${
                  contrastMode === 'high-contrast-yellow'
                    ? 'bg-yellow-400 text-slate-950 font-extrabold shadow-lg ring-2 ring-yellow-400/50'
                    : contrastMode === 'monochrome'
                    ? 'bg-slate-200 text-slate-950 font-bold shadow-md ring-2 ring-white/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title="Pilihan Mode Kontras Tinggi & Aksesibilitas Netra"
                aria-label="Pilihan Mode Kontras Tinggi"
              >
                <Eye className={`w-3.5 h-3.5 ${contrastMode === 'high-contrast-yellow' ? 'text-slate-950' : contrastMode === 'monochrome' ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span className="hidden lg:inline">
                  {contrastMode === 'high-contrast-yellow' 
                    ? (voiceLanguage === 'zh' ? '黑黄高对比' : voiceLanguage === 'en' ? 'Contrast: Yellow' : 'Kontras: Kuning')
                    : contrastMode === 'monochrome'
                    ? (voiceLanguage === 'zh' ? '单色黑白' : voiceLanguage === 'en' ? 'Contrast: Mono' : 'Kontras: Mono')
                    : (voiceLanguage === 'zh' ? '高对比度' : voiceLanguage === 'en' ? 'Contrast' : 'Kontras')}
                </span>
                {contrastMode !== 'standard' && (
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {contrastMode === 'high-contrast-yellow' ? 'AAA' : 'BW'}
                  </span>
                )}
              </button>

              {/* Contrast Mode Selector Popover */}
              {isContrastMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 sm:w-64 bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-2 shadow-2xl z-50 text-white animate-fade-in">
                  <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-slate-800 flex items-center justify-between">
                    <span>{voiceLanguage === 'zh' ? '对比度模式选择' : voiceLanguage === 'en' ? 'Contrast Modes' : 'Mode Kontras Ramah Netra'}</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">WCAG 2.1</span>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => setAndSaveContrastMode('high-contrast-yellow')}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        contrastMode === 'high-contrast-yellow'
                          ? 'bg-yellow-400 text-slate-950 shadow-md'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-yellow-300 hover:text-yellow-200 border border-yellow-400/30'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-400 border border-slate-950 shrink-0"></span>
                        <span>{voiceLanguage === 'zh' ? '黑黄高对比 (WCAG AAA)' : voiceLanguage === 'en' ? 'Yellow-Black (WCAG AAA)' : 'Hitam-Kuning (WCAG AAA)'}</span>
                      </span>
                      {contrastMode === 'high-contrast-yellow' && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </button>

                    <button
                      onClick={() => setAndSaveContrastMode('monochrome')}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        contrastMode === 'monochrome'
                          ? 'bg-slate-200 text-slate-950 shadow-md'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-950 shrink-0"></span>
                        <span>{voiceLanguage === 'zh' ? '黑白单色 (色盲友好)' : voiceLanguage === 'en' ? 'Monochrome (CVD Friendly)' : 'Monokrom (Hitam-Putih)'}</span>
                      </span>
                      {contrastMode === 'monochrome' && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </button>

                    <button
                      onClick={() => setAndSaveContrastMode('standard')}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                        contrastMode === 'standard'
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 border border-slate-950 shrink-0"></span>
                        <span>{voiceLanguage === 'zh' ? '标准彩色模式 (默认)' : voiceLanguage === 'en' ? 'Standard Display Mode' : 'Mode Normal (Standar)'}</span>
                      </span>
                      {contrastMode === 'standard' && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Font Size Adjuster (A- / A / A+ / A++) */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
              <span className="px-1 text-[10px] text-slate-400 flex items-center gap-0.5" title="Skala Ukuran Teks">
                <Type className="w-3 h-3" />
              </span>
              <button
                onClick={() => changeFontSize('small')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  fontSize === 'small' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Ukuran Font Kompak A- (90%)"
              >
                A-
              </button>
              <button
                onClick={() => changeFontSize('normal')}
                className={`px-1.5 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                  fontSize === 'normal' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Ukuran Font Standar A (100%)"
              >
                A
              </button>
              <button
                onClick={() => changeFontSize('large')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  fontSize === 'large' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Ukuran Font Besar A+ (120%)"
              >
                A+
              </button>
              <button
                onClick={() => changeFontSize('xlarge')}
                className={`px-1.5 py-0.5 rounded text-[12px] font-extrabold transition-all cursor-pointer ${
                  fontSize === 'xlarge' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Ukuran Font Sangat Besar A++ (140%)"
              >
                A++
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DIALOG PEREKAM SUARA & KATALOG PERTANYAAN CEPAT INTERAKTIF --- */}
      <AnimatePresence>
        {isVoiceListeningModalOpen && (
          <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={stopVoiceListening}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 25 }}
              className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-4 sm:p-6 shadow-2xl text-white my-auto flex flex-col relative overflow-hidden max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Language Badge & Close */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                  <span className="text-xs font-bold font-mono uppercase text-emerald-400 tracking-wider">
                    {voiceLanguage === 'en' ? 'Trilingual Voice Assistant (English)' : voiceLanguage === 'zh' ? '多语种智能语音助手 (普通话)' : 'Tanya Suara Asisten Cerdas MPP'}
                  </span>
                </div>
                <button
                  onClick={stopVoiceListening}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Central Voice Equalizer & Timer */}
              <div className="py-3 flex flex-col items-center justify-center text-center shrink-0">
                <div className="relative mb-2">
                  {/* Pulsing Aura */}
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping scale-125 pointer-events-none"></div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] border-3 border-emerald-300">
                    <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-bounce" />
                  </div>
                </div>

                {/* Animated Equalizer Bars */}
                <div className="flex items-center justify-center gap-1.5 h-6 my-1">
                  {[40, 75, 100, 60, 90, 50, 80, 45, 95, 65].map((height, idx) => (
                    <motion.div
                      key={idx}
                      animate={{ height: [`${height * 0.25}%`, `${height}%`, `${height * 0.3}%`] }}
                      transition={{ repeat: Infinity, duration: 0.6 + (idx % 4) * 0.15, ease: 'easeInOut' }}
                      className="w-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    />
                  ))}
                </div>

                <div className="mt-1 text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Durasi Perekaman: <strong className="text-white">00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:45</strong></span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">Anti Terputus</span>
                </div>
              </div>

              {/* Real-Time Live Transcript Preview & Manual Input */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 mb-3 shrink-0">
                <div className="text-[10.5px] uppercase font-mono text-emerald-400/80 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse text-rose-400" />
                    Transkrip Suara / Ketik Pertanyaan:
                  </span>
                  {recognizedVoiceText && (
                    <button 
                      onClick={() => { setRecognizedVoiceText(''); currentTranscriptRef.current = ''; }}
                      className="text-slate-400 hover:text-white text-[10px] underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={recognizedVoiceText}
                    onChange={(e) => {
                      setRecognizedVoiceText(e.target.value);
                      currentTranscriptRef.current = e.target.value;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finalizeVoiceRecording();
                    }}
                    placeholder={
                      voiceLanguage === 'en'
                        ? "Listening... (or type your question here and press Enter)"
                        : voiceLanguage === 'zh'
                        ? "正在聆听语音... (或在此输入问题并回车)"
                        : "Sedang mendengarkan... (atau ketik langsung pertanyaan di sini)"
                    }
                    className="w-full bg-transparent text-white text-xs sm:text-sm font-medium outline-none placeholder:text-slate-500"
                  />
                  {recognizedVoiceText && (
                    <button
                      onClick={finalizeVoiceRecording}
                      className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shrink-0"
                      title="Kirim Pertanyaan"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Quick Questions Catalog Hub (Banyak Pilihan Pertanyaan Singkat) */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-[160px] max-h-[220px] mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] text-slate-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Klik Pertanyaan Cepat (Jawaban Suara Otomatis):</span>
                  </div>
                  
                  {/* Mini search input */}
                  <div className="relative w-36 sm:w-44">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Cari topik..."
                      value={quickQuestionSearch}
                      onChange={(e) => setQuickQuestionSearch(e.target.value)}
                      className="w-full pl-6 pr-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-slate-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Category Pills */}
                {!quickQuestionSearch && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1.5 custom-scrollbar shrink-0 mb-1.5">
                    {quickQuestionCategories.map((cat) => {
                      const isActive = quickQuestionCategory === cat.id;
                      const label = voiceLanguage === 'zh' ? cat.labelZh : voiceLanguage === 'en' ? cat.labelEn : cat.label;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setQuickQuestionCategory(cat.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Questions Grid/Chips */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  <div className="flex flex-wrap gap-1.5">
                    {filteredQuestions.map((qObj, qIdx) => {
                      const questionText = voiceLanguage === 'zh' ? qObj.zh : voiceLanguage === 'en' ? qObj.en : qObj.id;
                      return (
                        <button
                          key={qIdx}
                          onClick={() => handleQuickQuestionClick(questionText)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-emerald-500/25 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-[11px] font-medium transition-all text-left flex items-center gap-1.5 group cursor-pointer"
                        >
                          <MessageSquareText className="w-3 h-3 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <span>{questionText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Language Switcher Inside Modal */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-3 text-xs shrink-0">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  {voiceLanguage === 'zh' ? '语音语言：' : voiceLanguage === 'en' ? 'Voice Language:' : 'Bahasa Asisten:'}
                </span>
                <div className="flex items-center gap-1 font-bold">
                  <button
                    onClick={() => {
                      handleSwitchLanguage('id');
                      resetVoiceRecording();
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs transition-all cursor-pointer ${voiceLanguage === 'id' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    🇮🇩 Indonesia
                  </button>
                  <button
                    onClick={() => {
                      handleSwitchLanguage('en');
                      resetVoiceRecording();
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs transition-all cursor-pointer ${voiceLanguage === 'en' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => {
                      handleSwitchLanguage('zh');
                      resetVoiceRecording();
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs transition-all cursor-pointer ${voiceLanguage === 'zh' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    🇨🇳 中文
                  </button>
                </div>
              </div>

              {/* Action Buttons: Finish & Send, Retry, Cancel */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 shrink-0">
                <button
                  onClick={resetVoiceRecording}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Hapus rekaman dan ulangi bicara"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi Bicara</span>
                </button>

                <button
                  onClick={finalizeVoiceRecording}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Selesai Bicara & Jawab Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL DIALOG JAWABAN ASISTEN SUARA CERDAS (PERSYARATAN LENGKAP & AUDIO TTS JERNIH) --- */}
      <AnimatePresence>
        {isVoiceResponseModalOpen && voiceResponse && (
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto"
            onClick={handleCloseVoiceResponse}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 25 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden text-slate-900 dark:text-white my-auto max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${
                    isSpeaking 
                      ? 'bg-amber-500/20 text-amber-500 border-amber-400 animate-pulse shadow-[0_0_16px_rgba(245,158,11,0.3)]' 
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isSpeaking ? <Volume2 className="w-6 h-6 animate-bounce" /> : <Sparkles className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono uppercase">
                        {voiceLanguage === 'en' ? 'AI Voice Response' : voiceLanguage === 'zh' ? '智能语音政务答复' : 'Jawaban Asisten Suara MPP'}
                      </span>
                      {voiceResponse.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400">
                          {voiceResponse.category}
                        </span>
                      )}
                      {isSpeaking && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                          Sedang Membacakan Audio Suara Jernih...
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold font-sans text-slate-900 dark:text-white mt-1">
                      {voiceResponse.serviceTitle}
                    </h2>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {voiceResponse.instansi}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseVoiceResponse}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Spoken Query Transcript Badge & High-Clarity Audio Controller */}
              <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-2 truncate flex-1">
                  <Mic className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Pertanyaan: <strong className="text-slate-900 dark:text-white font-semibold">"{voiceResponse.query}"</strong>
                  </span>
                </div>
                
                {/* Audio Playback Controls & Speed Selector */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-0.5 text-[10px] font-bold">
                    <span className="px-1 text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                      <Gauge className="w-3 h-3" />
                    </span>
                    <button
                      onClick={() => {
                        setSpeechRate(0.85);
                        speakMessage(voiceResponse.speechText, voiceLanguage, 0.85);
                        notify('Kecepatan Suara: 0.85x (Lambat & Jernih)');
                      }}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${speechRate === 0.85 ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}
                      title="Kecepatan Lambat & Sangat Jelas"
                    >
                      0.85x
                    </button>
                    <button
                      onClick={() => {
                        setSpeechRate(0.92);
                        speakMessage(voiceResponse.speechText, voiceLanguage, 0.92);
                        notify('Kecepatan Suara: 0.92x (Standar Jernih)');
                      }}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${speechRate === 0.92 ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}
                      title="Kecepatan Standar Natural"
                    >
                      1.0x
                    </button>
                  </div>

                  {isSpeaking ? (
                    <button
                      onClick={stopSpeaking}
                      className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer transition-all"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Hentikan</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => speakMessage(voiceResponse.speechText, voiceLanguage, speechRate)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Dengarkan Ulang</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Content: Requirements, Process Workflow, SLA, Cost & Counter Location */}
              <div className="overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm custom-scrollbar flex-1">
                
                {/* 1. Persyaratan Dokumen Lengkap */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                    <FileText className="w-4 h-4" />
                    <span>
                      {voiceLanguage === 'en' ? 'Complete Document Requirements:' : voiceLanguage === 'zh' ? '完整申请材料清单：' : 'Persyaratan Dokumen Lengkap:'}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-200">
                    {voiceResponse.persyaratan.map((syarat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{syarat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Alur & Prosedur Tahapan */}
                <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold">
                    <Compass className="w-4 h-4" />
                    <span>
                      {voiceLanguage === 'en' ? 'Step-by-Step Procedure & Workflow:' : voiceLanguage === 'zh' ? '大楼全流程办理步骤：' : 'Alur Proses & Tahapan Pelayanan:'}
                    </span>
                  </div>
                  <div className="space-y-2 text-slate-700 dark:text-slate-200">
                    {voiceResponse.alurProses.map((alur, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5 border border-blue-500/30">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed flex-1">{alur.replace(/^\d+\.\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Ringkasan Biaya, Waktu & Lokasi Loket */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                      <span>{voiceLanguage === 'en' ? 'Fees / Retribution:' : voiceLanguage === 'zh' ? '法定规费：' : 'Biaya / Retribusi:'}</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                      {voiceResponse.biaya}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{voiceLanguage === 'en' ? 'Estimated SLA:' : voiceLanguage === 'zh' ? '办理时限 (SLA)：' : 'Estimasi Waktu (SLA):'}</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                      {voiceResponse.sla}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{voiceLanguage === 'en' ? 'Counter Location:' : voiceLanguage === 'zh' ? '办理窗口位置：' : 'Lokasi Loket:'}</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                      {voiceResponse.lokasiLoket}
                    </div>
                  </div>
                </div>

                {/* 4. Rekomendasi Pertanyaan Lainnya (Quick Clickable Chips) */}
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{voiceLanguage === 'en' ? 'Ask Other Quick Questions:' : voiceLanguage === 'zh' ? '点击咨询其他热门政务问题：' : 'Ingin Mengetahui Hal Lain? Klik Pertanyaan Cepat:'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickQuestionsData.populer.slice(0, 5).map((qObj, idx) => {
                      const qText = voiceLanguage === 'zh' ? qObj.zh : voiceLanguage === 'en' ? qObj.en : qObj.id;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleDirectAskInResponse(qText)}
                          className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                        >
                          {qText}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <button
                  onClick={handleCopyVoiceDetails}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{voiceLanguage === 'en' ? 'Copy Requirements' : voiceLanguage === 'zh' ? '复制申请要求' : 'Salin Persyaratan'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      stopSpeaking();
                      setIsVoiceResponseModalOpen(false);
                      startVoiceListening();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{voiceLanguage === 'en' ? 'Ask Another Question' : voiceLanguage === 'zh' ? '继续语音提问' : 'Tanya Suara Lagi'}</span>
                  </button>

                  <button
                    onClick={() => {
                      stopSpeaking();
                      setIsVoiceResponseModalOpen(false);
                      const el = document.getElementById('layanan') || document.getElementById('instansi');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span>{voiceLanguage === 'en' ? 'Visit Service Counter' : voiceLanguage === 'zh' ? '前往政务服务窗口' : 'Kunjungi Loket'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL PUSAT LAYANAN INKLUSIF & DISABILITAS --- */}
      <AnimatePresence>
        {isAssistanceModalOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setIsAssistanceModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10 gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                    <Accessibility className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                        Layanan Ramah Inklusif & Disabilitas
                      </h2>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-['Plus_Jakarta_Sans',sans-serif]">
                        UU No. 8/2016
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-['Plus_Jakarta_Sans',sans-serif]">
                      Standar Fasilitas Khusus, Asistensi Petugas, dan Pendampingan Bebas Retribusi MPP Kab. Luwu
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAssistanceModalOpen(false)}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs Segmented Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-4 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80">
                {[
                  { id: 'fasilitas', label: 'Panduan Fasilitas', icon: ShieldCheck },
                  { id: 'request', label: 'Booking Kursi Roda', icon: HeartHandshake },
                  { id: 'jbi', label: 'Juru Bahasa Isyarat', icon: PhoneCall },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = assistanceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAssistanceTab(tab.id as any)}
                      className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer font-['Plus_Jakarta_Sans',sans-serif] ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: Panduan Fasilitas Fisik */}
              {assistanceTab === 'fasilitas' && (
                <div className="space-y-4 text-xs sm:text-sm font-['Plus_Jakarta_Sans',sans-serif]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                        Jalur Ramp Landai Kursi Roda
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-xs leading-relaxed">
                        Kemiringan landai ≤ 6° (maksimal 6 derajat) dari area parkir khusus disabilitas langsung menuju lobi utama lantai 1.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
                        <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                        Guiding Block Tunanetra
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-xs leading-relaxed">
                        Ubin pemandu kuning taktil bertekstur garis dan titik mengarahkan langkah dari pintu masuk ke semua loket layanan.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
                        <Accessibility className="w-4 h-4 text-blue-500 shrink-0" />
                        Loket Meja Rendah (≤ 80 cm)
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-xs leading-relaxed">
                        Meja layanan didesain setinggi pengguna kursi roda agar komunikasi tatap muka nyaman, ramah, dan sejajar.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
                        <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                        Toilet Khusus Difabel + Handrail
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-xs leading-relaxed">
                        Pintu geser lebar, pegangan besi pengaman (handrail), tombol darurat, dan kloset duduk standar aksesibilitas.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <strong>Jalur Antrean Prioritas Khusus:</strong> Bagi penyandang disabilitas, lansia di atas 60 tahun, dan ibu hamil, silakan langsung menuju meja Front Office untuk mendapatkan nomor tiket jalur prioritas tanpa antre umum.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Form Booking Kursi Roda & Pendamping */}
              {assistanceTab === 'request' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  {isRequestSubmitted ? (
                    <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-3">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                      <h3 className="font-bold text-base text-emerald-700 dark:text-emerald-400">Permohonan Asistensi Berhasil Dikirim</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                        Petugas Front Office MPP Simpurusiang telah menerima jadwal kedatangan Anda. Kami siap menyambut Anda dengan fasilitas kursi roda di lobi utama.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleRequestSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Nama Pemohon / Pendamping</label>
                        <input
                          type="text"
                          required
                          placeholder="Masukkan nama lengkap..."
                          value={requestForm.nama}
                          onChange={(e) => setRequestForm({ ...requestForm, nama: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Nomor WhatsApp</label>
                          <input
                            type="tel"
                            required
                            placeholder="0812xxxxxxx"
                            value={requestForm.phone}
                            onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1">Kebutuhan Fasilitas</label>
                          <select
                            value={requestForm.jenisKebutuhan}
                            onChange={(e) => setRequestForm({ ...requestForm, jenisKebutuhan: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="Kursi Roda & Petugas Pendamping">Kursi Roda & Petugas Pendamping</option>
                            <option value="Juru Bahasa Isyarat (Tunarungu)">Juru Bahasa Isyarat (Tunarungu)</option>
                            <option value="Pendamping Netra (Guiding Assistance)">Pendamping Netra (Guiding Assistance)</option>
                            <option value="Layanan Prioritas Lansia">Layanan Prioritas Lansia (&gt;60 Tahun)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Tanggal Kedatangan</label>
                          <input
                            type="date"
                            value={requestForm.tanggal}
                            onChange={(e) => setRequestForm({ ...requestForm, tanggal: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1">Estimasi Jam Tiba</label>
                          <input
                            type="time"
                            value={requestForm.jamKedatangan}
                            onChange={(e) => setRequestForm({ ...requestForm, jamKedatangan: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Catatan Tambahan (Opsional)</label>
                        <textarea
                          rows={2}
                          placeholder="Contoh: Mengurus KTP di loket Disdukcapil..."
                          value={requestForm.catatan}
                          onChange={(e) => setRequestForm({ ...requestForm, catatan: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mt-2"
                      >
                        <HeartHandshake className="w-4 h-4" />
                        <span>Kirim Permohonan Asistensi Bebas Retribusi</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: Juru Bahasa Isyarat */}
              {assistanceTab === 'jbi' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <PhoneCall className="w-4 h-4 text-emerald-500" />
                      Layanan Juru Bahasa Isyarat (BISINDO)
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                      MPP Simpurusiang bekerja sama dengan Gerakan untuk Kesejahteraan Tunarungu Indonesia (GERKATIN) dan Dinsos Luwu menyediakan pendampingan komunikasi bahasa isyarat di lobi dan loket perizinan.
                    </p>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
                      <strong>Hotline Video Call Bahasa Isyarat:</strong><br />
                      WhatsApp Front Office MPP: <strong>0812-4268-2024</strong> (Senin - Jumat 08.00 - 15.30 WITA)
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FLOATING TOAST NOTIFICATION --- */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 z-[130] px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs border border-emerald-500/40 shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{showNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) Asisten MPP - Collapsible ("Buka-Tutup") & Ultra Nyaman di Layar Android */}
      <motion.div
        layout
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280, delay: 0.3 }}
        className="fixed bottom-20 right-3 sm:bottom-24 sm:right-6 z-40 select-none"
      >
        {/* Animated Sonar Rings saat mendengarkan */}
        {isListening && (
          <>
            <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-75 pointer-events-none"></div>
            <div className="absolute -inset-1.5 bg-rose-400 rounded-full animate-ping opacity-40 pointer-events-none" style={{ animationDelay: "0.2s" }}></div>
          </>
        )}

        <AnimatePresence mode="wait">
          {isFabCollapsed ? (
            /* ========================================================================= */
            /* 1. MODE TERTUTUP (COMPACT FLOATING ORB) - NYAMAN & BEBAS HALANGAN ANDROID  */
            /* ========================================================================= */
            <motion.div
              key="collapsed-fab"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative flex items-center group"
            >
              {/* Expand Trigger Mini Tab */}
              <button
                type="button"
                onClick={toggleFabCollapse}
                title="Buka Label Asisten MPP"
                aria-label="Buka Label Asisten MPP"
                className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900/90 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-md hover:bg-emerald-600 hover:text-white transition-all cursor-pointer z-10 opacity-70 group-hover:opacity-100"
              >
                <ChevronLeft size={12} />
              </button>

              <motion.button
                id="mpp-floating-voice-assistant-button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={startVoiceListening}
                className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer backdrop-blur-xl border-2 ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.8)] ring-4 ring-rose-500/40 animate-pulse'
                    : 'bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950/80 text-white border-emerald-400/80 shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:border-emerald-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.7)]'
                }`}
                title="Asisten MPP (Klik untuk Bicara atau Buka Pertanyaan Cepat)"
                aria-label="Asisten MPP"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-[#00FF99] flex items-center justify-center text-slate-950 shadow-md">
                  <Mic className="w-4.5 h-4.5 text-slate-950" />
                </div>
                {/* Rotating Sparkle Badge */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.95)]" />
                </motion.div>
                {/* Language Tag Indicator */}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded-full bg-slate-900/90 text-[7.5px] font-mono font-bold text-emerald-400 border border-emerald-500/40 shadow-xs">
                  {voiceLanguage.toUpperCase()}
                </span>
              </motion.button>
            </motion.div>
          ) : (
            /* ========================================================================= */
            /* 2. MODE TERBUKA (STREAMLINED CAPSULE PILL) - SINGKAT & JELAS              */
            /* ========================================================================= */
            <motion.div
              key="expanded-fab"
              initial={{ scale: 0.85, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.85, opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="relative flex items-center gap-1 bg-slate-950/90 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-400/80 hover:border-emerald-300 p-1.5 pl-2 pr-1.5 rounded-full shadow-[0_10px_35px_rgba(16,185,129,0.35)] transition-all group"
            >
              {/* Main Button (Voice Trigger) */}
              <button
                type="button"
                id="mpp-floating-voice-assistant-button"
                onClick={startVoiceListening}
                className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none text-left"
                title="Asisten MPP (Klik untuk Bicara)"
                aria-label="Asisten MPP"
              >
                {/* Icon Mic with Pulsing Aura */}
                <div className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-md shrink-0 transition-transform group-hover:scale-105 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-[#00FF99] text-slate-950 shadow-[0_0_14px_rgba(0,255,153,0.6)]'
                }`}>
                  {isListening ? (
                    <Mic className="w-4.5 h-4.5 text-white animate-pulse" />
                  ) : (
                    <>
                      <Mic className="w-4.5 h-4.5 text-slate-950" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300 drop-shadow-[0_0_5px_rgba(252,211,77,0.95)]" />
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Short Clean Label (Asisten MPP) */}
                <div className="flex flex-col items-start leading-tight pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] sm:text-[13px] font-black tracking-tight font-sans text-white group-hover:text-emerald-300 transition-colors">
                      {isListening
                        ? (voiceLanguage === 'zh' ? '正在倾听...' : voiceLanguage === 'en' ? 'Listening...' : 'Mendengarkan...')
                        : (voiceLanguage === 'zh' ? 'MPP 助手' : voiceLanguage === 'en' ? 'MPP Assistant' : 'Asisten MPP')}
                    </span>
                    <span className="text-[8px] font-mono font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      {voiceLanguage.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-emerald-400/90 font-sans tracking-tight">
                    {isListening
                      ? 'Bicara sekarang...'
                      : (voiceLanguage === 'zh' ? '智能问答' : voiceLanguage === 'en' ? 'Voice AI' : 'Tanya Suara')}
                  </span>
                </div>
              </button>

              {/* Minimize / Collapse Toggle Button ("Tutup Label") */}
              <button
                type="button"
                onClick={toggleFabCollapse}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer ml-0.5"
                title="Tutup / Perkecil Ikon Asisten"
                aria-label="Tutup / Perkecil Ikon Asisten"
              >
                <ChevronRight size={14} className="text-emerald-400/80 hover:text-emerald-300" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

