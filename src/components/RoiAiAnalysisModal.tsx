import { motion } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, TrendingUp, DollarSign, Calculator, RefreshCw, CheckCircle2, AlertTriangle, Bot, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { formatRupiah, formatRupiahSingkat } from "../lib/formatters";
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

    const startTime = Date.now();
    console.info(`[ROI AI Client] 🚀 Starting Financial Feasibility Analysis for "${investmentName}" (${sector})...`, {
      capex,
      revenue,
      opex,
      roi,
      irr,
      npv,
      paybackPeriod,
      discountRate,
      language: aiLanguage
    });

    const userPrompt = `Tolong berikan analisis kelayakan finansial mendalam dan terperinci untuk simulasi potensi investasi "${investmentName}".
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

      const elapsed = Date.now() - startTime;
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { text: "Terjadi kesalahan internal ketika memproses analisis AI." };
      }

      if (res.ok) {
        console.info(`[ROI AI Client] ✅ Analysis received successfully in ${elapsed}ms:`, {
          sourcesCount: (data.sources || []).length,
          replyLength: (data.text || '').length
        });
        const fullReply = data.text || data.reply || "Analisis keuangan investasi selesai, Bapak/Ibu.";
        appendAndAnimateModelMessage(fullReply, []);
      } else {
        console.error(`[ROI AI Client] ❌ Server returned HTTP ${res.status} in ${elapsed}ms:`, data);
        let friendlyErr = data.error || data.details || "Gagal menghubungi AI Assistant.";
        if (res.status === 503) {
          friendlyErr = "Layanan AI sedang dalam beban tinggi atau kunci API belum siap. Silakan klik Coba Ulang Analisis.";
        } else if (res.status === 429) {
          friendlyErr = "Batas kuota harian sementara tercapai. Sistem sedang beralih ke kunci rotasi cadangan, silakan coba beberapa saat lagi.";
        }
        setErrorMsg(friendlyErr);
        setLoading(false);
      }
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      console.error(`[ROI AI Client] 🚨 Network/Fetch Error after ${elapsed}ms:`, err);
      if (err.name === "AbortError") {
        setErrorMsg("Permintaan melebihi batas waktu (timeout 60 detik). Koneksi jaringan lambat atau server sedang memproses dokumen besar. Silakan klik Coba Ulang.");
      } else {
        setErrorMsg("Koneksi gagal atau database sedang sibuk. Silakan periksa jaringan internet Anda, Bapak/Ibu.");
      }
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
        data = { text: "Terjadi kesalahan sistem." };
      }

      if (res.ok) {
        const reply = data.text || data.reply || "Selesai, Bapak/Ibu.";
        appendAndAnimateModelMessage(reply, updatedMessages);
      } else {
        setMessages([
          ...updatedMessages,
          { role: "model" as const, text: "Mohon maaf Bapak/Ibu, terjadi kegagalan sistem menghubungi AI: " + (data.error || "Gagal") }
        ]);
        setSending(false);
      }
    } catch (err) {
      console.error("ROI AI send error:", err);
      setMessages([
        ...updatedMessages,
        { role: "model" as const, text: "Koneksi terganggu, Bapak/Ibu. Silakan coba kirim kembali pesan Anda." }
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
        className={`w-full h-full sm:h-auto sm:max-h-[94vh] max-w-5xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 ${
          isDarkMode 
            ? "bg-slate-900 border border-slate-800 text-slate-100" 
            : "bg-white text-slate-800 border border-slate-100"
        }`}
      >
        {/* MODAL HEADER - Compact Android-First & Desktop Sleek */}
        <div className={`px-3.5 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between border-b shrink-0 gap-2 ${
          isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-slate-50/95 border-slate-200/80"
        }`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md text-white shrink-0">
              <Bot size={16} className="animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-xs sm:text-sm tracking-wide uppercase text-slate-900 dark:text-white truncate leading-tight">
                {t('roiAiModal.title', 'Analisis Kelayakan Finansial AI')}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate leading-tight">
                {investmentName} {sector ? `• ${sector}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* LANGUAGE SELECTOR */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setAiLanguage("id")}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded transition-all ${
                  aiLanguage === "id"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-sm"
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
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-sm"
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
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                中文
              </button>
            </div>

            <button
              type="button"
              id="close-roi-ai-modal-top"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors shrink-0 flex items-center justify-center ${
                isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-200/60 text-slate-500 hover:text-slate-800"
              }`}
              aria-label={t('roiAiModal.closeLabel', 'Tutup form')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* METRICS PREVIEW BAR - Directly below Header with minimal gap */}
        <div className={`px-2.5 sm:px-5 py-1.5 sm:py-2 border-b grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 shrink-0 ${
          isDarkMode ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-100/70 border-slate-200/80"
        }`}>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 min-w-0 shadow-sm">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center shrink-0">
              <DollarSign size={13} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 truncate">Capex</p>
              <p className="text-xs sm:text-sm font-bold font-sans tracking-tight text-slate-800 dark:text-slate-100 truncate leading-none" title={formatRupiah(capex)}>
                {formatRupiahSingkat(capex)}
              </p>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 min-w-0 shadow-sm">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${isNpvPositive ? "bg-emerald-500/10 dark:bg-emerald-400/10" : "bg-rose-500/10 dark:bg-rose-400/10"} flex items-center justify-center shrink-0`}>
              <TrendingUp size={13} className={isNpvPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 truncate">NPV ({discountRate}%)</p>
              <p className={`text-xs sm:text-sm font-bold font-sans tracking-tight truncate leading-none ${isNpvPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`} title={formatRupiah(npv)}>
                {isNpvPositive ? "+" : ""}{formatRupiahSingkat(npv)}
              </p>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 min-w-0 shadow-sm">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${isIrrFeasible ? "bg-emerald-500/10 dark:bg-emerald-400/10" : "bg-amber-500/10 dark:bg-amber-400/10"} flex items-center justify-center shrink-0`}>
              <Calculator size={13} className={isIrrFeasible ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 truncate">IRR Target</p>
              <p className={`text-xs sm:text-sm font-black font-mono truncate leading-none ${isIrrFeasible ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {(Number(irr) || 0).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 min-w-0 shadow-sm">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center shrink-0">
              <RefreshCw size={12} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 truncate">Payback (BEP)</p>
              <p className="text-xs sm:text-sm font-black font-mono text-slate-800 dark:text-slate-100 truncate leading-none">
                {(Number(paybackPeriod) || 0).toFixed(1)} {t('roiAiModal.paybackUnit', 'Thn')}
              </p>
            </div>
          </div>
        </div>

        {/* MODAL MAIN CONTENT - WIDE & LEAN */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3 flex flex-col">
          
          {/* LOADER SKELETON */}
          {loading && (
            <div className="flex gap-2.5 items-start self-start w-full animate-in fade-in slide-in-from-left-2 duration-300">
               <div className="w-7 h-7 rounded-lg bg-indigo-500/20 dark:bg-indigo-500/30 animate-pulse shrink-0"></div>
               <div className="flex flex-col gap-2 w-full">
                 <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                 <div className="h-16 w-full bg-slate-200/70 dark:bg-slate-800 rounded-2xl rounded-tl-sm animate-pulse"></div>
               </div>
            </div>
          )}

          {/* ERROR STATUS */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-3 my-1">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">{t('roiAiModal.errTitle', 'Gagal Menganalisis Kelayakan')}</h4>
                <p className="text-xs mt-1 leading-relaxed">{errorMsg}</p>
                <button
                  onClick={triggerAiAnalysis}
                  className="mt-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
                >
                  {t('roiAiModal.tryAgain', 'Coba Ulang Analisis')}
                </button>
              </div>
            </div>
          )}

          {/* COMPACT STATUS RIBBON */}
          {messages.length > 0 && (
            <div className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 shrink-0 backdrop-blur-sm border shadow-sm ${
              isNpvPositive && isIrrFeasible 
                ? "bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-800 dark:text-emerald-300" 
                : "bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30 text-amber-800 dark:text-amber-300"
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1 rounded-md shrink-0 ${isNpvPositive ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"}`}>
                  {isNpvPositive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-wider truncate">
                    {isNpvPositive && isIrrFeasible ? "Status: Layak & Feasible Secara Finansial" : "Status: Zona Moderat / Perlu Mitigasi"}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    NPV Positif • IRR &gt; WACC ({discountRate}%) • Evaluasi Otomatis AI
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                isNpvPositive && isIrrFeasible
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
              }`}>
                {isNpvPositive && isIrrFeasible ? "Score: A+" : "Score: B"}
              </span>
            </div>
          )}

          {/* CHAT BUBBLES LIST - FULL WIDTH FOR WIDE TEXT DISPLAY */}
          <div className="flex-1 space-y-2.5 flex flex-col w-full">
            {messages.map((msg, index) => {
              if (msg.role === "model") {
                return (
                  <div key={index} className="flex gap-2 items-start w-full self-start animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md mt-0.5">
                      <Bot size={13} />
                    </div>
                    <div className={`flex-1 min-w-0 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl rounded-tl-sm border shadow-sm ${
                      isDarkMode 
                        ? "bg-slate-900/90 border-slate-700/60 text-slate-100 backdrop-blur-md" 
                        : "bg-white border-slate-200/80 text-slate-900 backdrop-blur-md"
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                            {t('roiAiModal.assistantHeader', 'Asisten AI Finansial')}
                          </span>
                          <span className="text-[10px] text-slate-400">• Kab. Luwu</span>
                        </div>
                        <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" /> Terverifikasi
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none w-full space-y-1 overflow-y-auto ai-custom-scrollbar pr-1 leading-relaxed text-xs sm:text-sm">
                        {formatTextToJsx(msg.text)}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={index} className="flex gap-2 items-start max-w-[95%] sm:max-w-[85%] self-end justify-end ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl rounded-tr-sm border text-right shadow-sm ${
                      isDarkMode 
                        ? "bg-indigo-950/80 border-indigo-700/60 text-slate-100" 
                        : "bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/20"
                    }`}>
                      <div className="text-[9px] uppercase font-bold text-indigo-200 mb-0.5 tracking-wider">
                        {t('roiAiModal.investorHeader', 'Investor')}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              }
            })}

            {/* SENDING / TYPING INDICATOR */}
            {sending && (
              <div className="flex gap-2 items-start self-start w-full animate-in fade-in slide-in-from-left-2 duration-300">
                 <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0 mt-0.5"></div>
                 <div className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-2xl rounded-tl-sm flex items-center justify-center gap-1.5 animate-pulse">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
            )}

            {/* Anchor element to stick scroll position to the bottom */}
            <div ref={scrollRef} className="h-1" />
          </div>
        </div>

        {/* STICKY CHAT INPUT & FOOTER */}
        <div className={`p-2.5 sm:p-3.5 border-t shrink-0 ${
          isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-slate-50/95 border-slate-200/80"
        }`}>
          <ResponsiveChatInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSendMessage}
            isTyping={loading || sending}
            placeholder={t('roiAiModal.inputPlaceholder', 'Ajukan pertanyaan atau tanyakan potensi di wilayah Luwu...')}
            isDarkMode={isDarkMode}
            className="p-0 border-0 bg-transparent dark:bg-transparent"
          />
          <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span className="truncate">{t('roiAiModal.disclaimer', 'Dianalisis menggunakan Gemini Enterprise AI Spasial Luwu')}</span>
            <span className="hidden sm:inline-block font-mono">MPP Simpurusiang</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
