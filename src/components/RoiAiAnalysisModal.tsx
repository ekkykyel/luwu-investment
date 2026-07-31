import { motion } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, TrendingUp, DollarSign, Calculator, RefreshCw, CheckCircle2, AlertTriangle, Bot, MessageSquareText, Send } from "lucide-react";
import { formatRupiah } from "../lib/formatters.js";
import ResponsiveChatInput from "./ResponsiveChatInput";
import { useTranslation } from "react-i18next";

interface RoiAiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentName: string;
  sector: string;
  capex: number;
  revenue: number;
  opex: number;
  paybackPeriod: number;
  irr: number;
  npv: number;
  discountRate: number;
  roi?: number;
  isDarkMode?: boolean;
  isUsingOSS?: boolean;
}

interface Msg {
  role: "user" | "model";
  text: string;
}

export default function RoiAiAnalysisModal({
  isOpen,
  onClose,
  investmentName,
  sector,
  capex,
  revenue,
  opex,
  paybackPeriod,
  irr,
  npv,
  discountRate,
  roi = 0,
  isDarkMode = false,
  isUsingOSS = false,
}: RoiAiAnalysisModalProps) {
  const { t, i18n } = useTranslation();
  const [aiLanguage, setAiLanguage] = useState<"id" | "en" | "zh">("id");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const stepsList = {
    id: [
      "Membaca parameter simulasi investasi...",
      "Mengevaluasi nilai Net Present Value (NPV)...",
      "Menganalisis Internal Rate of Return (IRR)...",
      "Menilai estimasi Payback Period (BEP)...",
      "Memformulasikan rekomendasi kelayakan jangka panjang...",
    ],
    en: [
      "Reading investment simulation parameters...",
      "Evaluating Net Present Value (NPV)...",
      "Analyzing Internal Rate of Return (IRR)...",
      "Assessing Payback Period (BEP)...",
      "Formulating long-term feasibility recommendations...",
    ],
    zh: [
      "正在读取投资模拟参数...",
      "正在评估净现值 (NPV)...",
      "正在分析内部收益率 (IRR)...",
      "正在评估投资回收期 (BEP)...",
      "正在制定长期可行性建议...",
    ]
  };

  const steps = stepsList[aiLanguage] || stepsList.id;

  // Initialize and sync global language selection
  useEffect(() => {
    if (i18n.language === "en" || i18n.language === "zh" || i18n.language === "id") {
      setAiLanguage(i18n.language as any);
    }
  }, [i18n.language, isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sending]);

  useEffect(() => {
    if (isOpen) {
      triggerAiAnalysis();
    } else {
      // Reset state on close
      setMessages([]);
      setInputText("");
      setErrorMsg("");
      setLoading(false);
      setSending(false);
      setLoadingStep(0);
      if (timerRef.current) clearInterval(timerRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, [isOpen, aiLanguage]);

  // Loading steps animation
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1500);
      timerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [loading]);

  const triggerAiAnalysis = async () => {
    setLoading(true);
    setErrorMsg("");
    setMessages([]);
    setLoadingStep(0);

    const userPrompt = `Tolong berikan analisis kelayakan finansial mendalam dan terperinci untuk simulasi potensi investasi "${investmentName}" kawan.
${isUsingOSS ? "\nSTANDAR PERHITUNGAN: Menggunakan Standar Rinci OSS / Odoo (Termasuk estimasi detail kebutuhan Capex, Opex, serta serapan Tenaga Kerja TKA & TKL)." : ""}
Sektor: ${sector}
Nilai Investasi (CAPEX): ${formatRupiah(capex)}
Pendapatan Tahunan: ${formatRupiah(revenue)}
Biaya Operasional (OPEX): ${formatRupiah(opex)}
Return on Investment (ROI): ${roi.toFixed(2)}%
Payback Period (Amortisasi): ${paybackPeriod.toFixed(1)} Tahun
Internal Rate of Return (IRR): ${irr.toFixed(2)}%
Net Present Value (NPV): ${formatRupiah(npv)}
Suku Bunga Acuan (Discount Rate): ${discountRate}%`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: userPrompt,
          history: [],
          language: aiLanguage,
          investmentContext: { name: investmentName, sector: sector },
          simulationContext: {
            name: investmentName,
            sector: sector,
            capex,
            revenue,
            asumsiPendapatan: revenue,
            opex,
            paybackPeriod,
            bep: paybackPeriod,
            irr,
            npv,
            roi,
            discountRate,
          },
        }),
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { text: "Terjadi kesalahan internal ketika memproses analisis AI." };
      }

      if (res.ok) {
        const fullReply = data.text || data.reply || "Analisis keuangan investasi selesai kawan.";
        appendAndAnimateModelMessage(fullReply, []);
      } else {
        setErrorMsg(data.error || "Gagal menghubungi AI Assistant. Silakan coba kembali.");
        setLoading(false);
      }
    } catch (err) {
      console.error("ROI AI Analysis request failed:", err);
      setErrorMsg("Koneksi gagal atau database sedang sibuk. Silakan periksa jaringan Anda kawan.");
      setLoading(false);
    }
  };

  const appendAndAnimateModelMessage = (fullText: string, baseHistory: Msg[]) => {
    setLoading(false);
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    const words = fullText.split(" ");
    let i = 0;
    let current = "";

    if (words.length > 0) {
      current = words[0];
      setMessages([...baseHistory, { role: "model" as const, text: current }]);
      i = 1;
    }

    const interval = setInterval(() => {
      if (i < words.length) {
        current += " " + words[i];
        setMessages([...baseHistory, { role: "model" as const, text: current }]);
        i++;
      } else {
        clearInterval(interval);
        setSending(false);
      }
    }, 15);
    typingIntervalRef.current = interval;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading || sending) return;

    const userMessageText = inputText.trim();
    setInputText("");

    const currentHistory = [...messages];
    const updatedMessages = [...currentHistory, { role: "user" as const, text: userMessageText }];
    setMessages(updatedMessages);
    setSending(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessageText,
          history: currentHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          language: aiLanguage,
          investmentContext: { name: investmentName, sector: sector },
          simulationContext: {
            name: investmentName,
            sector: sector,
            capex,
            revenue,
            asumsiPendapatan: revenue,
            opex,
            paybackPeriod,
            bep: paybackPeriod,
            irr,
            npv,
            roi,
            discountRate,
          },
        }),
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { text: "Terjadi kesalahan kawan." };
      }

      if (res.ok) {
        const reply = data.text || data.reply || "Selesai kawan.";
        appendAndAnimateModelMessage(reply, updatedMessages);
      } else {
        setMessages([
          ...updatedMessages,
          { role: "model" as const, text: "Mohon maaf kawan, terjadi kegagalan sistem menghubungi AI: " + (data.error || "Gagal") }
        ]);
        setSending(false);
      }
    } catch (err) {
      console.error("ROI AI send error kawan:", err);
      setMessages([
        ...updatedMessages,
        { role: "model" as const, text: "Koneksi terganggu kawan. Sila coba kirim pesan kawan kembali." }
      ]);
      setSending(false);
    }
  };

  if (!isOpen) return null;

  // Simple, elegant custom markdown formatter to turn text into beautiful JSX
  const formatTextToJsx = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-sm font-semibold text-slate-900 dark:text-blue-300 mt-5 mb-2 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1 uppercase tracking-wide">
            <TrendingUp size={16} className="text-blue-500" />
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-6 mb-3 flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-900/40 pb-1">
            <Sparkles size={18} className="text-indigo-500 animate-pulse" />
            {trimmed.replace("##", "").trim()}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-lg font-black text-slate-900 dark:text-white mt-7 mb-4">
            {trimmed.replace("#", "").trim()}
          </h2>
        );
      }

      // Bullets
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const content = trimmed.substring(1).trim();
        return (
          <li key={idx} className="ml-4 list-disc text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 mb-2.5 leading-relaxed">
            {parseBoldText(content)}
          </li>
        );
      }

      // Paragraph
      if (trimmed === "") {
        return <div key={idx} className="h-2.5" />;
      }

      return (
        <p key={idx} className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed mb-3.5">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  // Helper to parse **bold** text in paragraphs
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-blue-700 dark:text-cyan-300">{part}</strong>;
      }
      return part;
    });
  };

  const isNpvPositive = npv >= 0;
  const isIrrFeasible = irr > discountRate;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      id="roi-ai-modal"
      className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        id="roi-ai-modal-container"
        className={`w-full h-full sm:h-auto sm:max-h-[92vh] max-w-4xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 ${
          isDarkMode 
            ? "bg-slate-900 border border-slate-800 text-slate-100" 
            : "bg-white text-slate-800 border border-slate-100"
        }`}
      >
        {/* MODAL HEADER */}
        <div className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b shrink-0 ${
          isDarkMode ? "bg-slate-905 border-slate-850" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg text-white">
              <Bot size={22} className="animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm tracking-wide uppercase text-slate-900 dark:text-white">
                {t('roiAiModal.title', 'Analisis Kelayakan Finansial AI')}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono truncate max-w-[220px] sm:max-w-md">
                {investmentName} ({sector})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* LANGUAGE SELECTOR */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setAiLanguage("id")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  aiLanguage === "id"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🇮🇩 ID
              </button>
              <button
                onClick={() => setAiLanguage("en")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  aiLanguage === "en"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                onClick={() => setAiLanguage("zh")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  aiLanguage === "zh"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🇨🇳 中文
              </button>
            </div>

            <button
              id="close-roi-ai-modal-top"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              }`}
              aria-label={t('roiAiModal.closeLabel', 'Tutup form')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* METRICS PREVIEW BAR */}
        <div className={`px-4 sm:px-6 py-3 border-b grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 ${
          isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-100/50 border-slate-200"
        }`}>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Capex</p>
              <p className="text-xs font-semibold font-mono text-slate-900 dark:text-slate-100 truncate">{formatRupiah(capex)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className={`${isNpvPositive ? "text-emerald-500" : "text-rose-500"} shrink-0`} />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">NPV ({discountRate}%)</p>
              <p className={`text-xs font-semibold font-mono truncate ${isNpvPositive ? "text-emerald-500" : "text-rose-500"}`}>
                {isNpvPositive ? "+" : ""}{formatRupiah(npv)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calculator className={`w-4 h-4 shrink-0 ${isIrrFeasible ? "text-emerald-500" : "text-amber-500"}`} />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">IRR</p>
              <p className={`text-xs font-semibold font-mono truncate ${isIrrFeasible ? "text-emerald-500" : "text-amber-500"}`}>
                {(Number(irr) || 0).toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-indigo-500 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Payback Period</p>
              <p className="text-xs font-semibold font-mono text-slate-900 dark:text-slate-100 truncate">{(Number(paybackPeriod) || 0).toFixed(1)} {t('roiAiModal.paybackUnit', 'Thn')}</p>
            </div>
          </div>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col">
          
          {/* LOADER SKELETON */}
          {loading && (
            <div className="flex gap-3.5 items-start self-start max-w-[90%] animate-in fade-in slide-in-from-left-2 duration-300">
               <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0"></div>
               <div className="flex flex-col gap-2 w-full">
                 <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                 <div className="h-16 w-64 max-w-full bg-slate-200 dark:bg-slate-700 rounded-3xl rounded-tl-sm animate-pulse"></div>
               </div>
            </div>
          )}

          {/* ERROR STATUS */}
          {errorMsg && (
            <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-450 flex items-start gap-3.5 my-4">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">{t('roiAiModal.errTitle', 'Gagal Menganalisis Kelayakan')}</h4>
                <p className="text-xs mt-1 leading-relaxed">{errorMsg}</p>
                <button
                  onClick={triggerAiAnalysis}
                  className="mt-3.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  {t('roiAiModal.tryAgain', 'Coba Ulang Analisis')}
                </button>
              </div>
            </div>
          )}

          {/* EVALUATION STATUS INDICATOR (Shown only when message exists) */}
          {messages.length > 0 && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 shrink-0 ${
              isNpvPositive && isIrrFeasible 
                ? "bg-emerald-555/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450" 
                : "bg-amber-555/10 border border-amber-500/20 text-amber-600 dark:text-amber-450"
            }`}>
              {isNpvPositive ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              )}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">{t('roiAiModal.metricTitle', 'Metrik Evaluasi Finansial')}</h4>
                <p className="text-xs mt-1 leading-relaxed">
                  {isNpvPositive && isIrrFeasible 
                    ? t('roiAiModal.feasibleDesc', 'Berdasarkan parameter yang dimasukkan, investasi dinyatakan LAYAK secara finansial kawan, dengan NPV positif dan tingkat IRR yang melampaui Discount Rate target.')
                    : t('roiAiModal.notFeasibleDesc', 'Parameter simulasi saat ini dinilai kurang optimal atau berada di ambang kelayakan minimum kawan. Simak hasil telaah detail AI di bawah ini.')
                  }
                </p>
              </div>
            </div>
          )}

          {/* CHAT BUBBLES LIST */}
          <div className="flex-1 space-y-4 md:space-y-6 flex flex-col">
            {messages.map((msg, index) => {
              if (msg.role === "model") {
                return (
                  <div key={index} className="flex gap-2.5 md:gap-3.5 items-start w-full md:max-w-[90%] self-start animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot size={16} className="md:w-[18px] md:h-[18px]" />
                    </div>
                    <div className={`flex-1 min-w-0 px-3.5 py-3 md:px-5 md:py-4 rounded-2xl md:rounded-3xl rounded-tl-sm border shadow-lg ${
                      isDarkMode 
                        ? "bg-slate-900/80 border-slate-700/50 text-slate-100 backdrop-blur-md" 
                        : "bg-white/80 border-white/40 text-slate-900 backdrop-blur-md"
                    }`}>
                      <div className="text-[9px] md:text-[10px] uppercase font-black text-indigo-500 dark:text-cyan-400 mb-1.5 md:mb-2 tracking-widest font-mono">
                        {t('roiAiModal.assistantHeader', 'Asisten AI ROI · Kabupaten Luwu')}
                      </div>
                      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-1 max-h-[60vh] overflow-y-auto ai-custom-scrollbar pr-1 md:pr-2 leading-relaxed tracking-wide">
                        {formatTextToJsx(msg.text)}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={index} className="flex gap-2.5 md:gap-3.5 items-start max-w-[95%] md:max-w-[90%] self-end justify-end ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className={`px-4 py-3 md:px-5 md:py-4 rounded-2xl md:rounded-3xl rounded-tr-sm border text-right shadow-lg ${
                      isDarkMode 
                        ? "bg-indigo-900/80 border-indigo-700/50 text-slate-100 backdrop-blur-md" 
                        : "bg-indigo-50/90 border-white/40 text-indigo-950 backdrop-blur-md"
                    }`}>
                      <div className="text-[9px] md:text-[10px] uppercase font-black text-indigo-500 dark:text-indigo-400 mb-1.5 md:mb-2 tracking-widest font-mono">
                        {t('roiAiModal.investorHeader', 'Investor')}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold leading-relaxed tracking-wide whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              }
            })}

            {/* SENDING / TYPING INDICATOR */}
            {sending && (
              <div className="flex gap-2.5 md:gap-3.5 items-start self-start w-full md:max-w-[90%] animate-in fade-in slide-in-from-left-2 duration-300">
                 <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0"></div>
                 <div className="px-4 py-3 md:px-5 md:py-4 bg-slate-200 dark:bg-slate-700 rounded-2xl md:rounded-3xl rounded-tl-sm flex items-center justify-center gap-1.5 animate-pulse">
                   <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
            )}

            {/* Anchor element to stick scroll position to the bottom */}
            <div ref={scrollRef} className="h-2" />
          </div>
        </div>

          <ResponsiveChatInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSendMessage}
            isTyping={loading || sending}
            placeholder={t('roiAiModal.inputPlaceholder', 'Ajukan pertanyaan atau tanyakan potensi di wilayah Luwu...')}
            isDarkMode={isDarkMode}
          />

        {/* MODAL FOOTER */}
        <div className={`p-4 border-t shrink-0 flex items-center justify-between gap-3 ${
          isDarkMode ? "bg-slate-905 border-slate-850" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="hidden md:block text-[11px] text-slate-400 font-medium">
            {t('roiAiModal.disclaimer', '*Dianalisis menggunakan Gemini Enterprise AI spasial Luwu')}
          </div>
          <button
            id="close-roi-ai-modal-bottom"
            onClick={onClose}
            className={`w-full sm:w-auto px-6 py-3 font-semibold text-xs tracking-wider uppercase rounded-xl transition-all border shadow-sm ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
          >
            {t('roiAiModal.closeButton', 'Tutup Kelayakan')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
