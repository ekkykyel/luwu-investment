import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Bot, VolumeX, Eye, Type, Sparkles, Check, Info, Mic, MicOff, 
  Accessibility, HeartHandshake, PhoneCall, HelpCircle, X, CheckCircle2, 
  ShieldCheck, MapPin, Compass, ArrowRight, UserCheck, AlertCircle,
  FileText, Clock, DollarSign, Building2, Copy, Play, Square, Share2,
  Globe, Radio, RotateCcw, Send, Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { resolveMppVoiceQuery, VoiceAssistantResponse, appendVoiceClosing } from '../../utils/mppVoiceKnowledge';
import { speakCrystalClearText, stopAllSpeech, formatTextForCrystalClearTts } from '../../utils/mppAudioEngine';

interface InclusivityAccessibilityBarProps {
  isDark?: boolean;
  onHighContrastToggle?: (enabled: boolean) => void;
  onFontSizeChange?: (size: 'normal' | 'large' | 'xlarge') => void;
  onVoiceSearchQuery?: (query: string) => void;
}

export const InclusivityAccessibilityBar: React.FC<InclusivityAccessibilityBarProps> = ({
  isDark = false,
  onHighContrastToggle,
  onFontSizeChange,
  onVoiceSearchQuery,
}) => {
  const { i18n, t } = useTranslation();
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
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
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          const combined = (finalTranscript + interimTranscript).trim();
          if (combined) {
            setRecognizedVoiceText(combined);
            currentTranscriptRef.current = combined;
            
            // Reset silence auto-submit window (2.5s timeout for better responsiveness)
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
              if (currentTranscriptRef.current.trim().length > 2) {
                finalizeVoiceRecording();
              }
            }, 2500);
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
          const finalSpeech = appendVoiceClosing(aiData.speechText, targetLang);
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

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (onHighContrastToggle) onHighContrastToggle(next);
    
    if (next) {
      document.documentElement.classList.add('high-contrast-mode');
      notify(voiceLanguage === 'zh' ? '高对比度模式已启用' : voiceLanguage === 'en' ? 'High Contrast Mode Enabled' : 'Mode Kontras Tinggi Aktif (Standar Ramah Netra & Lansia)');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
      notify(voiceLanguage === 'zh' ? '标准显示模式' : voiceLanguage === 'en' ? 'Standard Display Mode' : 'Mode Tampilan Standar Aktif');
    }
  };

  const changeFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size);
    if (onFontSizeChange) onFontSizeChange(size);

    document.documentElement.classList.remove('text-size-normal', 'text-size-large', 'text-size-xlarge');
    document.documentElement.classList.add(`text-size-${size}`);
    
    const labelMap = { 
      normal: voiceLanguage === 'zh' ? '标准字号 (100%)' : voiceLanguage === 'en' ? 'Normal Font (100%)' : 'Ukuran Normal (100%)', 
      large: voiceLanguage === 'zh' ? '大字号 (120%)' : voiceLanguage === 'en' ? 'Large Font (120%)' : 'Ukuran Besar (120%)', 
      xlarge: voiceLanguage === 'zh' ? '超大字号 (140%)' : voiceLanguage === 'en' ? 'Extra Large Font (140%)' : 'Ukuran Sangat Besar (140%)' 
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

  // Sample query tags for voice assistance
  const sampleVoiceQueries = {
    id: [
      "Syarat izin PBG",
      "Bikin KTP baru",
      "Perpanjang SIM",
      "Izin Usaha NIB",
      "Urus Paspor",
      "Biaya PBG & Retribusi"
    ],
    en: [
      "Requirements for PBG",
      "Business License NIB",
      "Passport & Immigration",
      "Building Approval Process"
    ],
    zh: [
      "办理PBG建筑许可要求",
      "办理企业执照NIB",
      "护照出入境签证",
      "投资优惠政策"
    ]
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
            
            {/* Interactive Voice Search & Smart Response (With Audio Wave indicator) */}
            <button
              onClick={startVoiceListening}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white shadow-lg animate-pulse ring-2 ring-rose-300'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              }`}
              title="Tanya Suara Asisten Cerdas MPP (Bahasa Indonesia, English, 中文)"
            >
              <Mic className="w-3.5 h-3.5 text-white animate-pulse shrink-0" />
              <span className="sm:hidden">
                {voiceLanguage === 'zh' ? '智能问答' : voiceLanguage === 'en' ? 'Voice AI' : 'Tanya Suara'}
              </span>
              <span className="hidden sm:inline">
                {voiceLanguage === 'zh' ? '智能语音助手 MPP' : voiceLanguage === 'en' ? 'Ask Voice Assistant' : 'Tanya Suara Asisten MPP'}
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/25 font-mono uppercase text-emerald-200">
                {voiceLanguage.toUpperCase()}
              </span>
            </button>

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

            {/* High Contrast */}
            <button
              onClick={toggleHighContrast}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-medium transition-all cursor-pointer ${
                highContrast
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Mode Kontras Tinggi Disabilitas Netra"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">
                {voiceLanguage === 'zh' ? '高对比度' : voiceLanguage === 'en' ? 'Contrast' : 'Kontras'}
              </span>
            </button>

            {/* Font Size Adjuster (Desktop/Tablet) */}
            <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
              <span className="px-1 text-[10px] text-slate-400 flex items-center gap-0.5">
                <Type className="w-3 h-3" />
              </span>
              <button
                onClick={() => changeFontSize('normal')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                  fontSize === 'normal' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
                title="Ukuran Font Standar"
              >
                A
              </button>
              <button
                onClick={() => changeFontSize('large')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  fontSize === 'large' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
                title="Ukuran Font Besar (120%)"
              >
                A+
              </button>
              <button
                onClick={() => changeFontSize('xlarge')}
                className={`px-1.5 py-0.5 rounded text-[12px] font-bold cursor-pointer ${
                  fontSize === 'xlarge' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
                title="Ukuran Font Sangat Besar (140%)"
              >
                A++
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DIALOG PEREKAM SUARA INTERAKTIF (DURASI DITINGKATKAN HINGGA 45 DETIK & HIGH PRECISION) --- */}
      <AnimatePresence>
        {isVoiceListeningModalOpen && (
          <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-3.5 sm:p-5 bg-black/80 backdrop-blur-md"
            onClick={stopVoiceListening}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-lg bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl text-white my-auto flex flex-col relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Language Badge & Close */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                  <span className="text-xs font-bold font-mono uppercase text-emerald-400 tracking-wider">
                    {voiceLanguage === 'en' ? 'Trilingual Voice Assistant (English)' : voiceLanguage === 'zh' ? '多语种智能语音助手 (普通话)' : 'Asisten Suara MPP (Bahasa Indonesia)'}
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
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="relative mb-4">
                  {/* Pulsing Aura */}
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping scale-125 pointer-events-none"></div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] border-4 border-emerald-300">
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" />
                  </div>
                </div>

                {/* Animated Equalizer Bars */}
                <div className="flex items-center justify-center gap-1.5 h-8 my-2">
                  {[40, 75, 100, 60, 90, 50, 80, 45, 95, 65].map((height, idx) => (
                    <motion.div
                      key={idx}
                      animate={{ height: [`${height * 0.25}%`, `${height}%`, `${height * 0.3}%`] }}
                      transition={{ repeat: Infinity, duration: 0.6 + (idx % 4) * 0.15, ease: 'easeInOut' }}
                      className="w-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    />
                  ))}
                </div>

                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Durasi Perekaman: <strong className="text-white">00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:45</strong></span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">Santai & Tenang</span>
                </div>

                <p className="text-sm font-semibold text-slate-200 mt-2 max-w-sm">
                  {voiceLanguage === 'en' 
                    ? "Speak comfortably and clearly. The AI Voice Assistant is capturing every word..." 
                    : voiceLanguage === 'zh'
                    ? "请从容、清晰地表达您的问题，AI 助手正在精确识别您的声音..."
                    : "Berbicaralah dengan santai dan tenang. Asisten AI mendengarkan suara Anda dengan presisi..."}
                </p>
              </div>

              {/* Real-Time Live Transcript Preview Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-700/80 min-h-[70px] max-h-[110px] overflow-y-auto mb-4 custom-scrollbar">
                <div className="text-[10.5px] uppercase font-mono text-emerald-400/80 mb-1 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse text-rose-400" />
                  <span>Transkrip Suara Langsung (Real-Time):</span>
                </div>
                {recognizedVoiceText ? (
                  <p className="text-sm text-white font-medium italic leading-relaxed">
                    "{recognizedVoiceText}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    (Menunggu suara pemohon... Contoh: "Apa syarat izin PBG bangunan gedung?")
                  </p>
                )}
              </div>

              {/* Quick Sample Questions Chips */}
              <div className="mb-4">
                <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Contoh Pertanyaan Cepat (Bisa langsung diklik):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sampleVoiceQueries[voiceLanguage].map((sample, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => {
                        setRecognizedVoiceText(sample);
                        currentTranscriptRef.current = sample;
                        finalizeVoiceRecording();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700 text-[11px] transition-all cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Switcher Inside Modal */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-4 text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  {voiceLanguage === 'zh' ? '当前语音语言：' : voiceLanguage === 'en' ? 'Voice Language:' : 'Bahasa Suara:'}
                </span>
                <div className="flex items-center gap-1 font-bold">
                  <button
                    onClick={() => {
                      handleSwitchLanguage('id');
                      resetVoiceRecording();
                    }}
                    className={`px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${voiceLanguage === 'id' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    🇮🇩 Indonesia
                  </button>
                  <button
                    onClick={() => {
                      handleSwitchLanguage('en');
                      resetVoiceRecording();
                    }}
                    className={`px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${voiceLanguage === 'en' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => {
                      handleSwitchLanguage('zh');
                      resetVoiceRecording();
                    }}
                    className={`px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${voiceLanguage === 'zh' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    🇨🇳 中文
                  </button>
                </div>
              </div>

              {/* Action Buttons: Finish & Send, Retry, Cancel */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={resetVoiceRecording}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Hapus rekaman dan ulangi bicara"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi</span>
                </button>

                <button
                  onClick={finalizeVoiceRecording}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Selesai Bicara & Proses Jawaban</span>
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

              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <button
                  onClick={handleCopyVoiceDetails}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{voiceLanguage === 'en' ? 'Copy Requirements' : voiceLanguage === 'zh' ? '复制申请要求' : 'Salin Persyaratan'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      stopSpeaking();
                      setIsVoiceResponseModalOpen(false);
                      const el = document.getElementById('layanan') || document.getElementById('instansi');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span>{voiceLanguage === 'en' ? 'Visit Service Counter' : voiceLanguage === 'zh' ? '前往政务服务窗口' : 'Kunjungi Loket Layanan'}</span>
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
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <Accessibility className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold font-sans">Layanan Ramah Inklusif & Disabilitas</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        UU No. 8/2016
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Standar Fasilitas Khusus, Asistensi Petugas, dan Pendampingan Bebas Retribusi MPP Kab. Luwu
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAssistanceModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 my-4 border-b border-slate-100 dark:border-white/10 pb-2">
                {[
                  { id: 'fasilitas', label: 'Panduan Fasilitas Fisik', icon: ShieldCheck },
                  { id: 'request', label: 'Booking Petugas & Kursi Roda', icon: HeartHandshake },
                  { id: 'jbi', label: 'Juru Bahasa Isyarat (JBI)', icon: PhoneCall },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = assistanceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAssistanceTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: Panduan Fasilitas Fisik */}
              {assistanceTab === 'fasilitas' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        Jalur Ramp Landai Kursi Roda
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
                        Kemiringan landai $\le 6^\circ$ dari area parkir khusus disabilitas langsung menuju lobi utama lantai 1.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Compass className="w-4 h-4 text-amber-500" />
                        Guiding Block Tunanetra
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
                        Ubin pemandu kuning taktil bertekstur garis dan titik mengarahkan langkah dari pintu masuk ke semua loket.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Accessibility className="w-4 h-4 text-blue-500" />
                        Loket Meja Rendah (&le; 80 cm)
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
                        Meja layanan didesain setinggi pengguna kursi roda agar komunikasi tatap muka nyaman dan sejajar.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-rose-500" />
                        Toilet Khusus Difabel + Handrail
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
                        Pintu geser lebar, pegangan besi pengaman (handrail), tombol darurat, dan kloset duduk standar aksesibilitas.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
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

      {/* Floating Action Button (FAB) for Voice Assistant - Always visible & Cool */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", delay: 1 }}
        className="fixed bottom-24 right-4 sm:bottom-12 sm:right-12 z-[60]"
      >
        {/* Animated rings for 'listening' mode */}
        {isListening && (
          <>
            <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-50" style={{ animationDelay: "0.2s" }}></div>
          </>
        )}
        
        <button
          onClick={startVoiceListening}
          className={`relative flex items-center justify-center rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all cursor-pointer ${
            isListening 
              ? 'bg-rose-500 text-white ring-4 ring-rose-500/50' 
              : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white hover:shadow-[0_0_40px_rgba(16,185,129,0.8)] border-2 border-emerald-300/30'
          }`}
          title="Tanya Suara Asisten Cerdas MPP"
        >
          {isListening ? (
            <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
          ) : (
            <div className="relative flex items-center justify-center group">
              <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_5px_rgba(252,211,77,0.8)]" />
              </motion.div>
              {/* Micro badge indicator */}
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-emerald-600 text-white shadow-sm tracking-wider">
                AI
              </span>
            </div>
          )}
        </button>
      </motion.div>
    </>
  );
};

