import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { X, Send, Bot, Sparkles, MapPin, Building2, HelpCircle, MessageSquare, Compass, ArrowRight, ArrowDown, ShieldCheck, Zap } from "lucide-react";
import ResponsiveChatInput from "./ResponsiveChatInput";
import { useTranslation } from "react-i18next";

interface Message {
  role: "user" | "model";
  text: string;
}

interface LuwuInvestmentAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  selectedInvestment?: any;
}

export default function LuwuInvestmentAiModal({
  isOpen,
  onClose,
  isDarkMode = false,
  selectedInvestment = null,
}: LuwuInvestmentAiModalProps) {
  const { i18n } = useTranslation();
  const [aiLanguage, setAiLanguage] = useState<"id" | "en" | "zh">("id");
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeGreetings = {
    id: [
      { role: "model" as const, text: "Tabe' Bapak/Ibu. Saya adalah **Asisten AI Validasi Data Spasial Kabupaten Luwu**. Tugas khusus saya adalah memvalidasi data geospasial pada peta GIS Luwu berbasis database PostGIS Supabase. Anda dapat menanyakan validasi koordinat lokasi, status tumpang tindih kawasan LP2B (Lahan Sawah Dilindungi), kesesuaian Pola Ruang RTRW Perda No. 06/2011, batas kawasan hutan (KPHP Latimojong), jarak tempuh jaringan jalan darat riil (PgRouting) ke simpul logistik, maupun analisis Daerah Aliran Sungai (DAS). Silakan tentukan titik koordinat atau pilih potensi pada peta spasial!" }
    ],
    en: [
      { role: "model" as const, text: "Greetings! I am the **Luwu Regency Spatial Data Validation AI Assistant**. My dedicated mandate is to validate GIS geospatial data directly from Luwu's Supabase PostGIS spatial database. You can query coordinate boundaries, LP2B (Protected Farmland) spatial overlap, Regional Spatial Plan (RTRW Perda 06/2011) zoning compliance, forest conservancy zones, real road distances (PgRouting) to strategic logistics hubs, and river basin (DAS) hydrology. Please specify coordinates or select a project on the spatial map!" }
    ],
    zh: [
      { role: "model" as const, text: "您好！我是**印度尼西亚芦梧县 GIS 空间数据合规验证 AI 助手**。我的专属职责是基于芦梧县 Supabase PostGIS 地理数据库，实时验证空间地理数据。您可以咨询坐标行政边界归属、永久基本农田 (LP2B) 重叠检测、国土空间规划 (RTRW Perda 06/2011) 分区合规性、生态防护林红线、实际公路路网里程 (PgRouting) 到关键物流枢纽的测算，以及地表河流流域 (DAS) 水文分析。请在空间地图上指定坐标或选择投资标的！" }
    ]
  };

  const selectedGreetings = {
    id: (name: string, sector: string) => `Tabe' Bapak/Ibu. Terdeteksi titik potensi **${name}** pada sektor **${sector || "Sektor Utama"}**. Saya telah memuat data spasial resmi PostGIS untuk titik ini. Silakan tanyakan validasi koordinat geografis, kesesuaian Pola Ruang RTRW Luwu, uji tumpang tindih kawasan LP2B / Hutan Lindung, jarak jalan darat riil (PgRouting), atau ketersediaan sumber air baku DAS sungai terdekat!`,
    en: (name: string, sector: string) => `Greetings! Selected spatial investment point **${name}** in the **${sector || "Main Sector"}** sector. I have retrieved official PostGIS spatial records for this coordinate. Feel free to validate geographic coordinates, RTRW spatial zoning conformity, LP2B / protected forest overlap checks, PgRouting road connectivity, or river basin hydrology!`,
    zh: (name: string, sector: string) => `您好！已锁定投资项目 **${name}**（所属产业：**${sector || "主导产业"}**）。我已调取该坐标的 PostGIS 官方空间属性数据。欢迎咨询地理坐标核验、国土空间总体规划 (RTRW) 分区符合性、永久基本农田 (LP2B)/防护林重叠排查、PgRouting 公路实际通达里程，或邻近地表水文供给评估！`
  };

  // Suggested Prompts strictly for Spatial Data Validation
  const suggestedQuestionsList = {
    id: [
      "Validasi apakah koordinat lokasi ini bebas dari tumpang tindih LP2B / Sawah Dilindungi?",
      "Apakah kawasan ini sesuai dengan peruntukan industri dalam Pola Ruang RTRW Luwu?",
      "Berapa jarak riil jalan darat (PgRouting) dari lokasi ini ke Pelabuhan Belopa dan Bandara Bua?",
      "Cek ketersediaan sumber air baku DAS sungai terdekat untuk lokasi investasi ini.",
    ],
    en: [
      "Validate if these coordinates are clear of LP2B / Protected Farmland overlap?",
      "Does this location comply with industrial zoning in Luwu's Spatial Plan (RTRW)?",
      "What is the real road distance (PgRouting) from this site to Belopa Port and Bua Airport?",
      "Check surface water supply availability from the nearest river basin (DAS).",
    ],
    zh: [
      "验证该坐标是否避开永久基本农田 (LP2B) 生态保护红线？",
      "该选址是否符合芦梧县国土空间规划 (RTRW) 的产业分区标准？",
      "根据实际路网 (PgRouting)，该地点到贝洛帕港与布阿机场的精确行车距离是多少？",
      "查询该投资选址临近河流流域 (DAS) 的地表工业水资源供给能力。",
    ]
  };

  const suggestedQuestions = suggestedQuestionsList[aiLanguage] || suggestedQuestionsList.id;

  // Sync global i18n language
  useEffect(() => {
    if (i18n.language === "en" || i18n.language === "zh" || i18n.language === "id") {
      setAiLanguage(i18n.language as any);
    }
  }, [i18n.language, isOpen]);

  // Set context model greeting if investment selected
  useEffect(() => {
    if (isOpen) {
      if (selectedInvestment) {
        setMessages([
          {
            role: "model" as const,
            text: selectedGreetings[aiLanguage](selectedInvestment.name, selectedInvestment.sector),
          },
        ]);
      } else {
        setMessages(welcomeGreetings[aiLanguage]);
      }
    }
  }, [isOpen, selectedInvestment, aiLanguage]);

  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
      setShowScrollBottom(!isNearBottom);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    // Only auto-scroll when new messages arrive or when AI is typing
    scrollToBottom(true);
  }, [messages, isAiTyping]);

  const handleAiSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customText || aiInput;
    if (!promptToSend.trim() || isAiTyping) return;

    setMessages((prev) => [...prev, { role: "user", text: promptToSend }]);
    setAiInput("");
    setIsAiTyping(true);

    try {
      const formattedHistory = messages.map((m) => {
        const textVal = typeof m.text === "string" ? m.text.trim() : String(m.text || "");
        return {
          role: m.role || "user",
          parts: [{ text: textVal || " " }],
        };
      });

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptToSend,
          history: formattedHistory,
          language: aiLanguage,
          assistantMode: "SPATIAL_VALIDATION",
          isSpatialValidation: true,
          investmentContext: selectedInvestment ? {
            id: selectedInvestment.id,
            name: selectedInvestment.name,
            sector: selectedInvestment.sector,
            subSector: selectedInvestment.subSector || "",
            areaHa: selectedInvestment.areaHa || 0,
            investmentValue: selectedInvestment.investmentValue || 0,
            latitude: selectedInvestment.latitude,
            longitude: selectedInvestment.longitude,
            geometry: selectedInvestment.geometry,
          } : null,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        data = { text: text || "" };
      }

      if (res.ok && (data.text || data.reply) && !String(data.text || "").includes("FUNCTION_INVOCATION_FAILED")) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: data.text || data.reply },
        ]);
      } else if (res.ok && !text.includes("A server error has occurred")) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: "Respon asisten selesai, Bapak/Ibu. Silakan ajukan pertanyaan berikutnya seputar potensi dan perizinan investasi Luwu." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: (data.error && typeof data.error === "string")
              ? `Mohon maaf Bapak/Ibu: ${data.error}`
              : "Sistem Asisten AI Luwu sedang melakukan sinkronisasi berkala. Silakan ajukan kembali pertanyaan Anda atau hubungi Meja Konsultasi VIP MPP Simpurusiang Belopa.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Koneksi ke asisten AI terganggu karena jaringan. Silakan kirim ulang pertanyaan Anda, Bapak/Ibu.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (!isOpen) return null;

  // Render text helper to format bold text and paragraphs elegantly
  const formatTextToJsx = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-base font-bold text-blue-700 dark:text-blue-400 mt-5 mb-2 flex items-center gap-1.5 border-b border-[#E2DACB] dark:border-slate-800 pb-1">
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-lg font-extrabold text-indigo-700 dark:text-indigo-400 mt-6 mb-3 flex items-center gap-2">
            {trimmed.replace("##", "").trim()}
          </h3>
        );
      }

      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const content = trimmed.substring(1).trim();
        return (
          <li key={idx} className="ml-4 list-disc text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 mb-2 leading-relaxed">
            {parseBoldText(content)}
          </li>
        );
      }

      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed mb-3">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-blue-700 dark:text-cyan-300">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      id="luwu-ai-chat-modal"
      className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 bg-base/75 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        id="luwu-ai-chat-modal-container"
        className={`w-full h-[100dvh] sm:w-[95vw] sm:max-w-5xl sm:h-[88vh] sm:max-h-[88vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 ${
          isDarkMode 
            ? "bg-slate-900 border border-slate-800 text-slate-100" 
            : "bg-[#FAF7F0] text-slate-900 border border-[#E2DACB]"
        }`}
      >
        {/* COMPACT INTEGRATED HEADER */}
        <div className={`px-3.5 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b shrink-0 gap-2 ${
          isDarkMode ? "bg-surface/95 border-slate-800" : "bg-[#F4F0E6] border-[#E2DACB]"
        }`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md text-white">
                <Bot size={16} className="animate-pulse" />
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#F4F0E6] dark:border-slate-900"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white truncate leading-tight">
                  {aiLanguage === "en" ? "AI Spatial & GIS Validation Assistant" : aiLanguage === "zh" ? "AI 空间数据合规验证助手" : "Asisten AI Validasi Data Spasial & Peta GIS"}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold tracking-wider bg-[#FAF7F0] dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-[#E2DACB] dark:border-sky-400/30">
                  PostGIS • RTRW & LP2B
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate leading-tight flex items-center gap-1 mt-0.5">
                {selectedInvestment ? (
                  <>
                    <Building2 size={11} className="text-indigo-500 shrink-0" />
                    <span className="truncate">{selectedInvestment.name} {selectedInvestment.sector ? `• ${selectedInvestment.sector}` : ''}</span>
                  </>
                ) : (
                  <>
                    <Compass size={11} className="text-sky-500 shrink-0" />
                    <span>{aiLanguage === "en" ? "PostGIS Spatial Validation & RTRW/LP2B Compliance" : aiLanguage === "zh" ? "PostGIS 空间规划合规性与生态红线检测" : "Validasi Koordinat, RTRW, LP2B, & Rute PgRouting"}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* LANGUAGE SELECTOR */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#FAF7F0] dark:bg-slate-800 border border-[#E2DACB] dark:border-slate-700">
              <button
                type="button"
                onClick={() => setAiLanguage("id")}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded transition-all ${
                  aiLanguage === "id"
                    ? "bg-[#F4F0E6] dark:bg-slate-700 text-blue-700 dark:text-cyan-400 border border-[#E2DACB] dark:border-transparent shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setAiLanguage("en")}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded transition-all ${
                  aiLanguage === "en"
                    ? "bg-[#F4F0E6] dark:bg-slate-700 text-blue-700 dark:text-cyan-400 border border-[#E2DACB] dark:border-transparent shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setAiLanguage("zh")}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded transition-all ${
                  aiLanguage === "zh"
                    ? "bg-[#F4F0E6] dark:bg-slate-700 text-blue-700 dark:text-cyan-400 border border-[#E2DACB] dark:border-transparent shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                中文
              </button>
            </div>

            <button
              type="button"
              id="close-luwu-ai-modal-top"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors shrink-0 flex items-center justify-center ${
                isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "bg-[#FAF7F0] hover:bg-[#ECE5D6] text-slate-600 hover:text-slate-900 border border-[#E2DACB]"
              }`}
              aria-label="Tutup asisten"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MICRO SPATIAL STATUS BAR */}
        <div className={`px-3 py-1.5 text-[10px] sm:text-xs font-semibold border-b flex justify-between items-center shrink-0 ${
          isDarkMode ? "bg-base/60 text-indigo-300 border-slate-800/80" : "bg-[#F4F0E6]/80 text-indigo-900 border-[#E2DACB]"
        }`}>
           <div className="flex items-center gap-1.5 truncate">
             <MapPin size={12} className="text-indigo-500 shrink-0" />
             <span className="truncate">RTRW Spasial PostGIS Aktif • Evaluasi Zonasi & Regulasi Luwu</span>
           </div>
           <span className="font-mono bg-[#FAF7F0] dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-[#E2DACB] dark:border-transparent px-2 py-0.5 rounded text-[9px] uppercase font-bold shrink-0">
             Terverifikasi
           </span>
        </div>

        {/* DIALOG MAIN CONTENT SCREEN */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 h-full">
          
          {/* CHAT FEED AREA */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full relative">
            <div 
              ref={chatContainerRef}
              onScroll={handleScroll}
              className={`flex-1 overflow-y-auto overscroll-contain touch-pan-y ai-custom-scrollbar px-3 sm:px-5 py-3 space-y-3 min-h-0 ${
                isDarkMode ? "bg-base/40" : "bg-[#FAF7F0]"
              }`}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 items-start w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "model" && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md text-white mt-0.5">
                      <Bot size={13} />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-3 sm:p-3.5 shadow-sm border backdrop-blur-md ${
                      msg.role === "user"
                        ? "max-w-[92%] sm:max-w-[85%] bg-indigo-600 text-white rounded-tr-sm border-indigo-500 shadow-indigo-600/20"
                        : isDarkMode
                          ? "w-full bg-surface/90 border-slate-700/60 text-slate-100 rounded-tl-sm"
                          : "w-full bg-[#F4F0E6] border-[#E2DACB] text-slate-900 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "model" && (
                      <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-[#E2DACB] dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                            Asisten Spasial Luwu
                          </span>
                          <span className="text-[10px] text-slate-400">• Tata Ruang</span>
                        </div>
                        <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" /> PostGIS
                        </span>
                      </div>
                    )}
                    <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
                      {formatTextToJsx(msg.text)}
                    </div>
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex gap-2 items-start justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#F4F0E6] border border-[#E2DACB] dark:border-transparent dark:bg-slate-700 flex items-center justify-center shrink-0 animate-pulse mt-0.5"></div>
                  <div className="px-3.5 py-2.5 bg-[#F4F0E6] dark:bg-slate-700 rounded-2xl rounded-tl-sm flex items-center justify-center gap-1.5 animate-pulse shadow-sm border border-[#E2DACB] dark:border-slate-600/50">
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* FLOATING SCROLL TO BOTTOM BUTTON */}
            <AnimatePresence>
              {showScrollBottom && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 10 }}
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-16 right-4 sm:right-6 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl border border-indigo-400/80 active:scale-95 transition-all z-20 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  aria-label="Scroll ke pesan terbaru"
                >
                  <ArrowDown size={14} />
                  <span className="text-[11px]">Ke Bawah</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* QUICK SUGGESTION CHIPS (HORIZONTALLY SCROLLABLE ON MOBILE) */}
            <div className={`px-2.5 py-1.5 border-t flex items-center gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 ${
              isDarkMode ? "bg-surface/90 border-slate-800" : "bg-[#F4F0E6] border-[#E2DACB]"
            }`}>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 flex items-center gap-1 shrink-0 px-1">
                <Zap size={11} className="text-amber-500" /> Cepat:
              </span>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAiSubmit(undefined, q)}
                  disabled={isAiTyping}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-full border whitespace-nowrap transition-all shrink-0 bg-[#FAF7F0] dark:bg-slate-800 border-[#E2DACB] dark:border-slate-700 hover:bg-[#ECE5D6] dark:hover:bg-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 shadow-2xs active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* STICKY CHAT INPUT & FOOTER */}
            <div className={`p-2.5 sm:p-3 border-t shrink-0 ${
              isDarkMode ? "bg-surface/95 border-slate-800" : "bg-[#F4F0E6] border-[#E2DACB]"
            }`}>
              <ResponsiveChatInput
                value={aiInput}
                onChange={setAiInput}
                onSubmit={handleAiSubmit}
                isTyping={isAiTyping}
                placeholder="Tanyakan zonasi, tata ruang, syarat PKKPR, atau buffer spasial di Luwu..."
                isDarkMode={isDarkMode}
                className="p-0 border-0 bg-transparent dark:bg-transparent"
              />
              <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-500">
                <span className="truncate">*Pemkab Luwu Tata Ruang Vertikal AI • Basis Data Spasial RTRW Resmi</span>
                <span className="hidden sm:inline-block font-mono">MPP Simpurusiang</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: QUICK INSTRUCTIONS & PROMPTS (DESKTOP ONLY) */}
          <div className={`hidden md:flex md:w-72 border-l flex-col divide-y shrink-0 ${
            isDarkMode ? "bg-base/20 border-slate-800 divide-slate-800" : "bg-[#F4F0E6]/60 border-[#E2DACB] divide-[#E2DACB]"
          }`}>
            {/* Guide Info */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Intelijen Spasial</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                Sistem ini ditenagai basis data spasial PostGIS dan AI Spasial Terpadu Pemkab Luwu. Evaluasi keselarasan tata ruang RTRW Kabupaten Luwu dilakukan secara dinamis.
              </p>
              
              <div className="p-2.5 rounded-xl bg-[#FAF7F0] dark:bg-orange-500/10 border border-[#E2DACB] dark:border-orange-500/20 text-amber-900 dark:text-orange-300 text-[10px] leading-relaxed">
                <strong>Zero Dummy Policy:</strong> Asisten menyajikan data riil resmi arsip tata ruang daerah Luwu.
              </div>
            </div>

            {/* Quick Prompt Suggesters */}
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2.5">
                <MessageSquare size={13} className="text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Topik Strategis</h4>
              </div>
              <div className="space-y-1.5">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAiSubmit(undefined, q)}
                    disabled={isAiTyping}
                    className={`w-full text-left p-2.5 rounded-xl border text-[11px] font-medium leading-normal transition-all flex items-start gap-2 ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300"
                        : "bg-[#F4F0E6] border-[#E2DACB] hover:bg-[#ECE5D6]/80 text-slate-800 shadow-2xs"
                    }`}
                  >
                    <ArrowRight size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
