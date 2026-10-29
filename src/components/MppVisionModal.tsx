import { useTranslation } from "react-i18next";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Mic, CheckCircle, ShieldCheck, Zap, Bot, Send, Sparkles, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { getMppExpertResponse, KnowledgeDocMeta } from "../utils/mppKnowledgeBase";
import { supabase } from "../lib/supabaseClient";

interface MppVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  time: string;
}

export const MppVisionModal: React.FC<MppVisionModalProps> = ({ isOpen, onClose, initialQuery }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typedWelcome, setTypedWelcome] = useState("");
  const [isWelcomeCollapsed, setIsWelcomeCollapsed] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState<Record<string, boolean>>({});
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocMeta[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const promptsScrollRef = useRef<HTMLDivElement>(null);
  const hasHandledInitialQuery = useRef(false);
  const welcomeCollapseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const welcomeText = t(
    "mppVision.welcome",
    "Selamat datang di Mal Pelayanan Publik Simpurusiang Kabupaten Luwu. Tabe', saya konsultan digital ta', Bapak/Ibu. Ada yang bisa saya bantukan ki' hari ini? Jika ada pertanyaan ta' mengenai jenis-jenis layanan, alur pelayanan, maupun persyaratan, silahkan ki' bertanya langsung di sini, atau dengan klik beberapa pertanyaan singkat dibawah. Kami hadir untuk memudahkan urusan ta’ Bapak/Ibu. Semoga puas ki’ dengan pelayanan kami, dan terima kasih atas kunjungan ta’."
  );

  // Load knowledge documents from Supabase to enrich literacy and references
  useEffect(() => {
    if (!isOpen) return;
    const fetchKnowledgeFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("knowledge_documents")
          .select("id, title, category, publication_year, source_agency, is_active")
          .eq("is_active", true);

        if (!error && data && data.length > 0) {
          setKnowledgeDocs(data);
        }
      } catch (err) {
        console.warn("Could not fetch knowledge_documents from Supabase:", err);
      }
    };
    fetchKnowledgeFromSupabase();
  }, [isOpen]);

  // Scroll Lock & Escape Key Handler
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Typing Effect for Initial Welcome Message & Auto-collapse trigger with 1-second delay
  useEffect(() => {
    if (!isOpen) {
      setTypedWelcome("");
      setIsWelcomeCollapsed(false);
      setCollapsedMessages({});
      setMessages([]);
      setInputValue("");
      hasHandledInitialQuery.current = false;
      if (welcomeCollapseTimerRef.current) {
        clearTimeout(welcomeCollapseTimerRef.current);
      }
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i <= welcomeText.length) {
        setTypedWelcome(welcomeText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        // Auto-collapse Welcome Message 1 second after typing effect animation completes
        welcomeCollapseTimerRef.current = setTimeout(() => {
          setIsWelcomeCollapsed(true);
        }, 1000);
      }
    }, 25);

    if (initialQuery && !hasHandledInitialQuery.current) {
      hasHandledInitialQuery.current = true;
      setTimeout(() => {
        handleSendMessage(initialQuery);
      }, 300);
    }

    return () => {
      clearInterval(interval);
      if (welcomeCollapseTimerRef.current) {
        clearTimeout(welcomeCollapseTimerRef.current);
      }
    };
  }, [isOpen, initialQuery, welcomeText]);

  // Auto scroll to bottom when new messages arrive or typing status changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typedWelcome, isTyping, isWelcomeCollapsed]);

  const quickPrompts = [
    t("mppVision.quick1", "Syarat cetak KTP-el, KK & Akta"),
    t("mppVision.quick2", "Pengurusan izin usaha OSS-RBA & NIB"),
    t("mppVision.quickPbg", "Syarat Izin Bangunan Gedung (PBG & SLF)"),
    t("mppVision.quickSim", "Perpanjang SIM A & SIM C di MPP"),
    t("mppVision.quickSamsat", "Bayar Pajak Motor / Mobil SAMSAT"),
    t("mppVision.quickBpjs", "Layanan BPJS Kesehatan & Ketenagakerjaan"),
    t("mppVision.quickPaspor", "Biaya & Syarat Paspor Imigrasi"),
    t("mppVision.quickAntrean", "Cara ambil nomor antrean online"),
    t("mppVision.quickJamOps", "Jadwal operasional & Lokasi MPP"),
    t("mppVision.quickPkkpr", "Konsultasi Tata Ruang & PKKPR GIS"),
    t("mppVision.quickSkck", "Syarat SKCK Baru & Perpanjang Polres"),
    t("mppVision.quickBpn", "Layanan Sertifikat Tanah BPN Kantah"),
    t("mppVision.quickKemenag", "Cara Nikah Gratis Balai Nikah MPP"),
    t("mppVision.quickInklusif", "Fasilitas Kursi Roda & Disabilitas"),
    t("mppVision.quickWbs", "Pengaduan Bebas Pungli & WBS"),
  ];

  // Helper to schedule auto-collapse on an AI response after a 2-second grace period
  const scheduleAiMessageCollapse = (msgId: string) => {
    setTimeout(() => {
      setCollapsedMessages((prev) => ({
        ...prev,
        [msgId]: true,
      }));
    }, 2000);
  };

  const toggleMessageCollapse = (msgId: string) => {
    setCollapsedMessages((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    // Immediately collapse welcome message if still open when user interacts
    setIsWelcomeCollapsed(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    const lang = i18n.language || "id";

    // Attempt Live AI response via backend Gemini endpoint with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9500);

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: `[Konteks Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu]\nPertanyaan Pengguna/Akademisi:\n${text}`,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            text: m.text,
          })),
          language: lang,
          knowledgeDocs: knowledgeDocs,
        }),
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.text && typeof data.text === "string" && data.text.trim().length > 15) {
          const aiMsgId = (Date.now() + 1).toString();
          const aiMsg: Message = {
            id: aiMsgId,
            sender: "ai",
            text: data.text,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          scheduleAiMessageCollapse(aiMsgId);
          return;
        }
      }
    } catch (apiErr) {
      console.warn("Live Gemini AI chat fetch skipped or timed out, activating dedicated MPP knowledge engine:", apiErr);
    }

    // Instantaneous expert offline response engine from official literature and Supabase knowledge
    const replyText = getMppExpertResponse(text, lang, knowledgeDocs);
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      sender: "ai",
      text: replyText,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
    scheduleAiMessageCollapse(aiMsgId);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="mpp-vision-modal-root"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-hidden font-sans"
        >
          {/* Solid Backdrop: High contrast dark overlay to prevent bleed-through */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/85 sm:bg-[#000814]/90 backdrop-blur-md cursor-pointer"
            onClick={onClose}
            aria-label="Tutup Dialog"
          />

          {/* Android-First Floating Card Modal with clear safety margins and visible rounded-3xl corners */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="relative z-10 w-full sm:max-w-xl md:max-w-2xl bg-[#00162B] text-slate-100 border border-[#00FF99]/30 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] sm:shadow-[0_0_50px_rgba(0,255,153,0.2)] flex flex-col h-[90vh] sm:h-[650px] sm:max-h-[85vh] overflow-hidden"
          >
            {/* Visual Drag / Indicator bar for mobile affordance */}
            <div className="sm:hidden pt-2.5 pb-0.5 flex justify-center bg-[#00162B] shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />
            </div>

            {/* Header: Clean, uncrowded layout on mobile screens */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4 bg-[#00162B]/95 backdrop-blur-md border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="relative">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#00FF99] via-emerald-400 to-teal-500 flex items-center justify-center text-[#000B14] shadow-[0_0_15px_rgba(0,255,153,0.4)]">
                    <Bot className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 ring-2 ring-[#00162B] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight font-sans">
                      Asisten Digital Ta'
                    </h3>
                    {/* Hide or shrink MPP badge on mobile to prevent header crowding */}
                    <span className="hidden xs:inline-block sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-[#00FF99] border border-[#00FF99]/30 rounded-full">
                      MPP SIMPURUSIANG
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF99]" />
                    {t("mppVision.ready247", "• Siap melayani 24/7")}
                  </p>
                </div>
              </div>

              {/* Close Button: Min 44x44px touch target */}
              <button
                type="button"
                id="close-mpp-ai-modal"
                onClick={onClose}
                aria-label={t("mppVision.closeAssistant", "Tutup Asisten Digital Ta'")}
                className="w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto-Collapsing Welcome Greeting (Kata Sambutan) */}
            <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-white/10 bg-[#00162B]/70 shrink-0 transition-all duration-500 ease-in-out">
              {isWelcomeCollapsed ? (
                <button
                  type="button"
                  onClick={() => setIsWelcomeCollapsed(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs transition-all duration-300 cursor-pointer group"
                >
                  <span className="flex items-center gap-2 truncate font-medium">
                    <span className="text-sm">💡</span>
                    <span className="truncate">Sambutan Asisten Digital</span>
                  </span>
                  <span className="text-[11px] text-[#00FF99] font-semibold flex items-center gap-0.5 group-hover:underline shrink-0 ml-2">
                    Buka kembali <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </button>
              ) : (
                <div className="flex items-start gap-2.5 transition-all duration-500 ease-in-out">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#00FF99]" />
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 bg-emerald-900/20 text-emerald-50 border border-emerald-800/30 shadow-sm">
                    <p className="text-xs sm:text-sm leading-relaxed text-pretty">
                      {typedWelcome}
                      {typedWelcome.length < welcomeText.length && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6 }}
                          className="inline-block w-1.5 h-3.5 bg-[#00FF99] ml-1 align-middle"
                        />
                      )}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-emerald-500/10">
                      <button
                        type="button"
                        onClick={() => setIsWelcomeCollapsed(true)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5 cursor-pointer"
                      >
                        Tutup <ChevronUp className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {t("mppVision.centerName", "MPP Simpurusiang Luwu")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips (Tanya Cepat AI): Scrollable with Desktop Navigation Controls */}
            <div className="px-3 sm:px-6 pt-2 pb-2 border-b border-white/5 bg-[#00162B]/40 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00FF99]" />
                  {t("mppVision.popularQuestions", "Pertanyaan Populer:")}
                </p>
                <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  {quickPrompts.length} Opsi Layanan
                </span>
              </div>

              {/* Scroll Container with Desktop Left & Right Arrow Buttons */}
              <div className="relative flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => promptsScrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                  className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-emerald-950/90 hover:bg-[#00FF99] text-emerald-300 hover:text-[#000B14] border border-[#00FF99]/40 transition-all cursor-pointer shrink-0 shadow-md active:scale-90"
                  title="Geser Pertanyaan ke Kiri"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div 
                  ref={promptsScrollRef}
                  className="flex overflow-x-auto gap-2 no-scrollbar py-1.5 overscroll-x-contain scroll-smooth flex-1"
                >
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="whitespace-nowrap shrink-0 text-xs text-left bg-emerald-950/60 hover:bg-emerald-800/90 text-emerald-200 hover:text-white hover:border-[#00FF99] active:scale-95 border border-[#00FF99]/35 rounded-xl px-3 py-1.5 transition-all cursor-pointer leading-snug shadow-xs flex items-center gap-1.5 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF99] shrink-0 animate-pulse" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => promptsScrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                  className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-emerald-950/90 hover:bg-[#00FF99] text-emerald-300 hover:text-[#000B14] border border-[#00FF99]/40 transition-all cursor-pointer shrink-0 shadow-md active:scale-90"
                  title="Geser Pertanyaan ke Kanan"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Main Chat Area with controlled max height */}
            <div className="flex-1 overflow-y-auto max-h-[60vh] sm:max-h-[500px] overscroll-contain px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
              {/* Dynamic Chat Messages with Auto-Collapse for AI Answers */}
              {messages.map((msg) => {
                const isAi = msg.sender === "ai";
                const isCollapsed = isAi && !!collapsedMessages[msg.id];
                const isLongMessage = msg.text.length > 120;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 sm:gap-2.5 ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {isAi && (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-[#00FF99]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed text-pretty transition-all duration-500 ease-in-out ${
                        msg.sender === "user"
                          ? "rounded-2xl p-3 sm:p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs shadow-md"
                          : "rounded-2xl rounded-tl-xs p-3.5 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 text-slate-800 dark:text-emerald-50 border border-emerald-100 dark:border-emerald-800/30 shadow-sm"
                      }`}
                    >
                      {/* Collapsible Content */}
                      <div
                        className={`transition-all duration-500 ease-in-out ${
                          isCollapsed ? "line-clamp-2 overflow-hidden" : ""
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>

                      {/* Expand / Collapse Toggle for Long AI Messages */}
                      {isAi && isLongMessage && (
                        <button
                          type="button"
                          onClick={() => toggleMessageCollapse(msg.id)}
                          className="mt-2 text-[11px] font-semibold text-[#00FF99] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {isCollapsed ? (
                            <>
                              <span>Baca Selengkapnya (Expand)</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>Tutup</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}

                      <span
                        className={`block text-[10px] mt-1.5 text-right ${
                          msg.sender === "user" ? "text-emerald-200" : "text-slate-400"
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-[#00FF99]" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-xs p-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00FF99] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#00FF99] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#00FF99] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              {/* 3 Core Pillars: Hidden on mobile screens to preserve vertical space, prominent on desktop */}
              <div className="hidden sm:block pt-3 border-t border-white/10 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("mppVision.threePillars", "3 Pilar Utama Pelayanan Publik")}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <Zap className="text-amber-400 w-4 h-4 mb-1" />
                    <span className="text-[11px] font-semibold text-white">{t("mppPortal.ai.fast")}</span>
                    <span className="text-[9px] text-slate-400">{t("mppPortal.ai.noQueue")}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <ShieldCheck className="text-[#00FF99] w-4 h-4 mb-1" />
                    <span className="text-[11px] font-semibold text-white">{t("mppPortal.ai.transparent")}</span>
                    <span className="text-[9px] text-slate-400">{t("mppPortal.ai.realtime")}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <CheckCircle className="text-blue-400 w-4 h-4 mb-1" />
                    <span className="text-[11px] font-semibold text-white">{t("mppPortal.ai.integrated")}</span>
                    <span className="text-[9px] text-slate-400">{t("mppPortal.ai.oneRoof")}</span>
                  </div>
                </div>
              </div>

              <div ref={chatEndRef} />
            </div>

            {/* Sticky Bottom Input Bar: Safe area for Android virtual keyboards */}
            <div className="sticky bottom-0 z-20 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-[#00162B]/98 backdrop-blur-xl border-t border-white/10 shrink-0 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t("mppPortal.ai.placeholder")}
                    className="w-full bg-surface/90 border border-white/15 text-white text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-3.5 pr-10 focus:outline-none focus:border-[#00FF99] focus:ring-1 focus:ring-[#00FF99]/50 transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    title={t("mppPortal.ai.voiceInput")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] min-h-[40px] rounded-xl bg-gradient-to-tr from-[#00FF99] to-emerald-400 text-[#000B14] font-bold flex items-center justify-center hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 shadow-[0_0_15px_rgba(0,255,153,0.3)]"
                  aria-label={t("mppVision.sendQuestion", "Kirim Pertanyaan")}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

