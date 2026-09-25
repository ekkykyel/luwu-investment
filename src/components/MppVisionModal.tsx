import { useTranslation } from "react-i18next";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Mic, CheckCircle, ShieldCheck, Zap, Bot, Send, Sparkles } from "lucide-react";
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
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocMeta[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasHandledInitialQuery = useRef(false);

  const welcomeText = t(
    "mppVision.welcome",
    "Selamat datang di Mal Pelayanan Publik Simpurisiang Kabupaten Luwu. Tabe', saya konsultan digital ta', Bapak/Ibu. Ada yang bisa saya bantukan ki' hari ini? Jika ada pertanyaan ta' mengenai jenis-jenis layanan, alur pelayanan, maupun persyaratan, silahkan ki' bertanya langsung di sini, atau dengan klik beberapa pertanyaan singkat dibawah. Kami hadir untuk memudahkan urusan ta’ Bapak/Ibu. Semoga puas ki’ dengan pelayanan kami, dan terima kasih atas kunjungan ta’."
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

  // Typing Effect for Initial Welcome Message & Auto-send initialQuery if provided
  useEffect(() => {
    if (!isOpen) {
      setTypedWelcome("");
      setMessages([]);
      setInputValue("");
      hasHandledInitialQuery.current = false;
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i <= welcomeText.length) {
        setTypedWelcome(welcomeText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 25);

    if (initialQuery && !hasHandledInitialQuery.current) {
      hasHandledInitialQuery.current = true;
      setTimeout(() => {
        handleSendMessage(initialQuery);
      }, 300);
    }

    return () => clearInterval(interval);
  }, [isOpen, initialQuery]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typedWelcome, isTyping]);

  const quickPrompts = [
    t("mppVision.quickLayananCategory", "Layanan dpmptsp.luwukab.go.id"),
    t("mppVision.quickKejariPdamIkan", "Layanan Kejaksaan, PDAM & Perikanan"),
    t("mppVision.quickKnowledgeTable", "Dokumen Tabel Knowledge Supabase"),
    t("mppVision.quickSarpras", "Sarana & Prasarana MPP"),
    t("mppVision.quickPbg", "Syarat Izin Bangunan (PBG & SLF)"),
    t("mppVision.quickHukum", "Dasar Hukum & Regulasi MPP"),
    t("mppVision.quickInstansi", "Daftar 19 Instansi Terpadu"),
    t("mppVision.quick1", "Syarat cetak KTP-el / KK"),
    t("mppVision.quick2", "Pengurusan izin usaha OSS-RBA"),
    t("mppVision.quick3", "Cara ambil antrean online"),
    t("mppVision.quick4", "Jadwal operasional MPP"),
    t("mppVision.quick5", "Layanan BPJS Kesehatan & Ketenagakerjaan"),
    t("mppVision.quick6", "Bayar Pajak Kendaraan / Samsat"),
    t("mppVision.quick7", "Pajak Daerah PBB & BPHTB"),
    t("mppVision.quick8", "Konsultasi Tata Ruang & PKKPR"),
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

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
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: data.text,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          return;
        }
      }
    } catch (apiErr) {
      console.warn("Live Gemini AI chat fetch skipped or timed out, activating dedicated MPP knowledge engine:", apiErr);
    }

    // Instantaneous expert offline response engine from official literature and Supabase knowledge
    const replyText = getMppExpertResponse(text, lang, knowledgeDocs);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: "ai",
      text: replyText,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="mpp-vision-modal-root"
          className="fixed inset-0 z-[99999] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 overflow-hidden font-sans"
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

          {/* Android-First Bottom-Sheet on mobile (<640px) / Centered Dialog on Desktop */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative z-10 w-full sm:max-w-xl md:max-w-2xl bg-[#00162B] text-slate-100 border-t sm:border border-[#00FF99]/30 rounded-none sm:rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-[0_0_50px_rgba(0,255,153,0.2)] flex flex-col h-dvh sm:h-[650px] sm:max-h-[85vh] overflow-hidden"
          >
            {/* Visual Drag Handle for Android Bottom-Sheet gesture affordance */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-[#00162B] shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto" />
            </div>

            {/* Sticky Header Bar with 44px Touch Target Close Button */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-[#00162B]/95 backdrop-blur-md border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#00FF99] via-emerald-400 to-teal-500 flex items-center justify-center text-[#000B14] shadow-[0_0_15px_rgba(0,255,153,0.4)]">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#00162B] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-sans">Asisten Digital Ta'</h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-[#00FF99] border border-[#00FF99]/30 rounded-full">
                      MPP Simpurusiang
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF99]" />
                    {t("mppVision.ready247", "Siap melayani 24/7")}
                  </p>
                </div>
              </div>

              {/* Close Button: Meets accessibility standard min 44x44px touch target */}
              <button
                type="button"
                id="close-mpp-ai-modal"
                onClick={onClose}
                aria-label={t("mppVision.closeAssistant", "Tutup Asisten Digital Ta'")}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fixed Greeting Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-[#00162B]/50 shrink-0">
              {/* Initial Greeting Bubble */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#00FF99]" />
                </div>
                <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl rounded-tl-xs p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-900/20 text-slate-800 dark:text-emerald-50 border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
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
                  <span className="block text-[10px] text-slate-400 mt-2 text-right">
                    {t("mppVision.centerName", "MPP Simpurusiang Luwu")}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4">
              {/* Quick Prompt Suggestion Pills */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#00FF99]" />
                    {t("mppVision.popularQuestions", "Pertanyaan Populer:")}
                  </p>
                  <span className="text-[10px] text-emerald-400/90 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {quickPrompts.length} Opsi Layanan
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-xs text-left bg-emerald-950/45 hover:bg-emerald-900/70 hover:text-white hover:border-[#00FF99]/60 active:scale-95 border border-[#00FF99]/30 text-emerald-300 rounded-lg px-3 py-1.5 transition-all cursor-pointer leading-snug shadow-xs flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF99] shrink-0" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Chat Messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "ai" && (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-[#00FF99]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed text-pretty ${
                      msg.sender === "user"
                        ? "rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs shadow-md"
                        : "rounded-2xl rounded-tl-xs p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-900/20 text-slate-800 dark:text-emerald-50 border border-emerald-100 dark:border-emerald-800/30 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span
                      className={`block text-[10px] mt-1.5 text-right ${
                        msg.sender === "user" ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
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

              {/* 3 Core Pillars (Compact responsive info cards) */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("mppVision.threePillars", "3 Pilar Utama Pelayanan Publik")}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <Zap className="text-amber-400 w-4 h-4 mb-1" />
                    <span className="text-[11px] font-semibold text-white">{t("mppPortal.ai.fast")}</span>
                    <span className="text-[9px] text-slate-400 hidden sm:inline">{t("mppPortal.ai.noQueue")}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <ShieldCheck className="text-[#00FF99] w-4 h-4 mb-1" />
                    <span className="text-[11px] font-semibold text-white">{t("mppPortal.ai.transparent")}</span>
                    <span className="text-[9px] text-slate-400 hidden sm:inline">{t("mppPortal.ai.realtime")}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <CheckCircle className="text-blue-400 w-4 h-4 mb-1" />
                    <span className="text-[11px] font-semibold text-white">{t("mppPortal.ai.integrated")}</span>
                    <span className="text-[9px] text-slate-400 hidden sm:inline">{t("mppPortal.ai.oneRoof")}</span>
                  </div>
                </div>
              </div>

              <div ref={chatEndRef} />
            </div>

            {/* Sticky Bottom Input Bar (Safe area for Android virtual keyboards) */}
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
                    className="w-full bg-slate-900/90 border border-white/15 text-white text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-3.5 pr-10 focus:outline-none focus:border-[#00FF99] focus:ring-1 focus:ring-[#00FF99]/50 transition-all placeholder:text-slate-500"
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

