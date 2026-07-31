import { motion } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { X, Send, Bot, Sparkles, MapPin, Building2, HelpCircle, MessageSquare, Compass, ArrowRight } from "lucide-react";
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
      { role: "model" as const, text: "Halo! Saya Asisten Investasi Luwu. Saya siap membantu Anda menganalisis kelayakan lokasi, rincian komoditas, regulasi PKKPR, dan potensi tata ruang Kabupaten Luwu kawan. Silakan ajukan pertanyaan Anda mengenai wilayah strategis investasi!" }
    ],
    en: [
      { role: "model" as const, text: "Hello! I am the Luwu Investment Assistant. I am ready to help you analyze location feasibility, commodity details, PKKPR regulations, and spatial potential of Luwu Regency, my friend. Please ask your questions regarding strategic investment areas!" }
    ],
    zh: [
      { role: "model" as const, text: "您好！我是鲁乌投资助手。我已经准备好帮您分析选址可行性、大宗商品详情、PKKPR法规以及鲁乌县的空间潜力，我的朋友。请随时提出您关于战略投资领域的问题！" }
    ]
  };

  const selectedGreetings = {
    id: (name: string, sector: string) => `Halo! Saya mendeteksi Anda tertarik dengan potensi investasi **${name}** pada sektor **${sector || "Sektor Utama"}**. Saya telah menyesuaikan fokus analisis spasial dan kelayakan ini khusus bagi potensi tersebut. Silakan tanyakan kelayakan lahan, regulasi, akses jalan, rincian komoditas, atau proyeksi tata ruang terkait daerah ini!`,
    en: (name: string, sector: string) => `Hello! I detect you are interested in the **${name}** investment potential in the **${sector || "Main Sector"}** sector. I have tailored my spatial and feasibility analysis focus specifically to this potential. Please ask about land feasibility, regulations, road access, commodity details, or spatial planning projections related to this area!`,
    zh: (name: string, sector: string) => `您好！我检测到您对 **${sector || "主导部门"}** 行业的 **${name}** 投资潜力项目感兴趣。我已经专门针对该项目量身定制了空间和可行性分析重点。请随时提问有关该区域的土地可行性、法律法规、道路交通、大宗商品详情或空间规划预测等问题！`
  };

  // Suggested Prompts
  const suggestedQuestionsList = {
    id: [
      "Bagaimana peluang investasi sektor perikanan di Luwu?",
      "Apa syarat perizinan PKKPR untuk industri kelapa sawit?",
      "Di kecamatan mana potensi perkebunan cengkeh paling melimpah?",
      "Bagaimana infrastruktur pelayaran & logistik di sekitar Teluk Bone?",
    ],
    en: [
      "What are the investment opportunities in the fisheries sector in Luwu?",
      "What are the PKKPR permit requirements for the palm oil industry?",
      "Which district has the most abundant clove plantation potential?",
      "How is the shipping & logistics infrastructure around the Gulf of Bone?",
    ],
    zh: [
      "鲁乌县渔业部门的投资机会如何？",
      "棕榈油行业的 PKKPR 许可证要求是什么？",
      "哪个行政区的丁香种植潜力最丰富？",
      "骨湾（Gulf of Bone）周边的航运与物流基础设施如何？",
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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
        data = { text: "Terjadi kesalahan ketika memproses respon asisten AI." };
      }

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: data.text || data.reply || "Respon asisten selesai kawan." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: `Gagal menganalisis kawan: ${data.error || data.text || "Kesalahan Kode Server"}`,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Koneksi ke asisten AI terganggu karena jaringan. Silakan kirim ulang pertanyaan Anda kawan.",
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
          <h4 key={idx} className="text-base font-bold text-blue-700 dark:text-blue-400 mt-5 mb-2 flex items-center gap-1.5 border-b border-slate-205 dark:border-slate-800 pb-1">
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
      className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        id="luwu-ai-chat-modal-container"
        className={`w-full h-full sm:h-auto sm:max-h-[95vh] md:max-h-[88vh] lg:max-h-[92vh] max-w-5xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 ${
          isDarkMode 
            ? "bg-slate-900 border border-slate-800 text-slate-100" 
            : "bg-white text-slate-800 border border-slate-100"
        }`}
      >
        {/* HEADER */}
        <div className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b shrink-0 ${
          isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md text-white">
                <Bot size={22} className="animate-pulse" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                Platform Konsultasi AI Spasial Luwu
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono flex items-center gap-1">
                {selectedInvestment ? (
                  <>
                    <Building2 size={10} className="text-indigo-500" />
                    Konteks Terkunci: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{selectedInvestment.name}</span>
                  </>
                ) : (
                  <>
                    <Compass size={10} className="text-indigo-500" />
                    Mode Eksplorasi Spasial Regional Bebas
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* LANGUAGE SELECTOR */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setAiLanguage("id")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  aiLanguage === "id"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🇮🇩 ID
              </button>
              <button
                onClick={() => setAiLanguage("en")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  aiLanguage === "en"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                onClick={() => setAiLanguage("zh")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  aiLanguage === "zh"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🇨🇳 中文
              </button>
            </div>

            <button
              id="close-luwu-ai-modal-top"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              }`}
              aria-label="Tutup asisten"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CHAT CHOOSE BANNER */}
        {selectedInvestment && (
          <div className={`px-4 py-2 text-[10px] sm:text-xs font-medium border-b flex justify-between items-center ${
            isDarkMode ? "bg-slate-950/30 text-indigo-400 border-slate-850" : "bg-indigo-50/50 text-indigo-700 border-indigo-100/50"
          }`}>
             <div className="flex items-center gap-2 truncate">
               <MapPin size={12} className="text-indigo-500" />
               <span className="truncate">Analisis dinamis tersinkronisasi dengan rencana tata ruang detail wilayah kawan</span>
             </div>
             <span className="font-mono bg-indigo-500/15 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
               Spasial Aktif
             </span>
          </div>
        )}

        {/* DIALOG MAIN CONTENT SCREEN */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* CHAT FEED AREA */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
            <div 
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto px-4 py-6 sm:p-6 space-y-5 scrollbar-thin ${
                isDarkMode ? "bg-slate-950/50 scrollbar-thumb-slate-800 scrollbar-track-transparent" : "bg-slate-50/30 scrollbar-thumb-slate-200 scrollbar-track-transparent"
              } min-h-0`}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 items-start ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "model" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md text-white">
                      <Bot size={16} />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 sm:p-5 shadow-lg border backdrop-blur-md ${
                      msg.role === "user"
                        ? "bg-indigo-600/90 text-white rounded-tr-sm border-indigo-500/50"
                        : isDarkMode
                          ? "bg-slate-900/80 border-slate-700/50 text-slate-100 rounded-tl-sm"
                          : "bg-white/80 border-white/40 text-slate-900 rounded-tl-sm"
                    } ${msg.role === "model" ? "max-h-[60vh] overflow-y-auto ai-custom-scrollbar pr-2" : ""}`}
                  >
                    <div className="space-y-1">
                      {formatTextToJsx(msg.text)}
                    </div>
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex gap-3 items-start justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 animate-pulse"></div>
                  <div className="px-5 py-4 bg-slate-200 dark:bg-slate-700 rounded-3xl rounded-tl-sm flex items-center justify-center gap-1.5 animate-pulse shadow-sm border border-slate-300/50 dark:border-slate-600/50">
                     <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <ResponsiveChatInput
              value={aiInput}
              onChange={setAiInput}
              onSubmit={handleAiSubmit}
              isTyping={isAiTyping}
              placeholder="Tanyakan kelayakan, zonasi agribisnis, studi komoditas, atau buffer spasial di Luwu..."
              isDarkMode={isDarkMode}
            />
          </div>

          {/* RIGHT SIDEBAR: QUICK INSTRUCTIONS & PROMPTS (HIDDEN ON SMALL MOBILE) */}
          <div className={`hidden md:flex md:w-80 border-l flex-col divide-y shrink-0 ${
            isDarkMode ? "bg-slate-950/20 border-slate-850 divide-slate-850" : "bg-slate-50/50 border-slate-100 divide-slate-150"
          }`}>
            {/* Guide Info */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Kompleksitas Intelijen</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Sistem ini ditenagai integrasi basis data spasial (PostGIS) dan model bahasa Gemini terverifikasi. AI melakukan evaluasi keselarasan tata ruang RTRW Kabupaten Luwu secara dinamis.
              </p>
              
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-555/20 text-orange-600 dark:text-orange-400 text-[11px] leading-relaxed">
                <strong>Honest Fallback:</strong> Sesuai protokol, asisten tidak akan memberikan data rekaan atau fiktif jika tidak tercatat dalam arsip daerah kawan.
              </div>
            </div>

            {/* Quick Prompt Suggesters */}
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Topik Rekomendasi</h4>
              </div>
              <div className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAiSubmit(undefined, q)}
                    disabled={isAiTyping}
                    className={`w-full text-left p-3 rounded-xl border text-[11px] font-medium leading-normal transition-all flex items-start gap-2 ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300"
                        : "bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-sm"
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

        {/* FOOTER */}
        <div className={`p-4 border-t shrink-0 flex items-center justify-between gap-3 ${
          isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"
        }`}>
          <span className="text-[10px] text-slate-400 font-medium">
            *Pemkab Luwu Tata Ruang Vertikal AI
          </span>
          <button
            id="close-luwu-ai-modal-bottom"
            onClick={onClose}
            className={`px-5 py-2.5 font-bold text-xs tracking-wider uppercase rounded-xl transition-all border shadow-sm ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
          >
            Keluar Percakapan
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
