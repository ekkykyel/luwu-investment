import { motion } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { MoveRight, MapPin, X, Bot, Map, Calculator, RefreshCw, Send, Target, Sparkles, Navigation } from "lucide-react";
import * as turf from "@turf/turf";
import { District, Village } from "../types";
import ResponsiveChatInput from "./ResponsiveChatInput";
import { useTranslation } from "react-i18next";

interface Message {
  role: "user" | "model";
  text: string;
  sources?: string[];
}

interface SpatialBufferAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  districts: District[];
  villages: Village[];
  onFocusCoordinate: (lat: number, lng: number) => void;
  isDarkMode: boolean;
  selectedInvestment: any | null;
}

export default function SpatialBufferAiModal({ isOpen, onClose, districts, villages, onFocusCoordinate, isDarkMode, selectedInvestment }: SpatialBufferAiModalProps) {
  const { t, i18n } = useTranslation();
  const [aiLanguage, setAiLanguage] = useState<"id" | "en" | "zh">("id");
  const [activeTab, setActiveTab] = useState<"ai" | "buffer">("buffer");
  
  // Buffer State
  const [bufferLat, setBufferLat] = useState("-3.0766");
  const [bufferLng, setBufferLng] = useState("120.1916");
  const [bufferRadius, setBufferRadius] = useState(5); // km
  const [bufferResults, setBufferResults] = useState<{
    impactedVillages: Village[];
    impactedDistricts: District[];
    score: number;
    hasRun: boolean;
  }>({ impactedVillages: [], impactedDistricts: [], score: 0, hasRun: false });

  // Greetings Localisation
  const welcomeGreetings = {
    id: [
      { role: "model" as const, text: "Halo! Saya Asisten Konsultan Spasial Kabupaten Luwu. Saya dapat membantu menganalisis kelayakan lokasi, memberikan rekomendasi, dan mendiskusikan wilayah strategis untuk investasi Anda. Ada yang bisa saya bantu hari ini?" }
    ],
    en: [
      { role: "model" as const, text: "Hello! I am the Spatial Consultant Assistant of Luwu Regency. I can help analyze location feasibility, provide recommendations, and discuss strategic areas for your investment. How can I help you today?" }
    ],
    zh: [
      { role: "model" as const, text: "您好！我是印尼鲁乌县空间规划投资助手。我可以帮您分析选址可行性，提供投资建议，以及讨论区域战略规划。今天有什么我可以帮您的吗？" }
    ]
  };

  const selectedGreetings = {
    id: (name: string, sector: string) => `Halo! Anda sedang melihat informasi potensi investasi **${name}** pada sektor **${sector}**. Saya telah membatasi fokus analisis saya hanya pada potensi investasi ini. Apa yang ingin Anda diskusikan mengenai kelayakan atau strategi investasi di area ini?`,
    en: (name: string, sector: string) => `Hello! You are viewing the investment potential information for **${name}** in the **${sector}** sector. I have restricted my analysis focus to this specific potential. What would you like to discuss regarding feasibility or strategies in this area?`,
    zh: (name: string, sector: string) => `您好！您正在查看有关 **${sector}** 行业 **${name}** 项目的投资潜力信息。我已经将分析重点限制在此特定项目。您想就该区域的可行性或投资策略讨论些什么？`
  };

  // AI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [greeting, setGreeting] = useState<Message | null>(null);
  const [inputMsg, setInputMsg] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync global i18n language
  useEffect(() => {
    if (i18n.language === "en" || i18n.language === "zh" || i18n.language === "id") {
      setAiLanguage(i18n.language as any);
    }
  }, [i18n.language, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (selectedInvestment) {
        setGreeting({ role: "model", text: selectedGreetings[aiLanguage](selectedInvestment.name, selectedInvestment.sector) });
        setMessages([]);
        setActiveTab("ai");
      } else {
        const welcome = welcomeGreetings[aiLanguage][0];
        setGreeting(welcome);
        setMessages([]);
      }
    }
  }, [isOpen, aiLanguage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiTyping]);

  if (!isOpen) return null;

  // Render text with interactive coordinate cards
  const MarkdownWithCoords = ({ text }: { text: string }) => {
    const regex = /\[COORD:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?):([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    
    const parseBoldHtml = (rawText: string) => {
      const segments = rawText.split(/\*\*([\s\S]*?)\*\*/g);
      return segments.map((seg, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="font-extrabold text-blue-700 dark:text-cyan-300">{seg}</strong>;
        }
        return seg;
      });
    };

    let match;
    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      parts.push(<span key={lastIndex}>{parseBoldHtml(text.substring(lastIndex, match.index))}</span>);
      
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      const name = match[3];
      
      // Add glowing coordinate card
      parts.push(
        <span 
          key={`coord-${match.index}`} 
          className={`inline-flex items-center gap-1 sm:gap-1.5 align-middle mx-1 px-2 py-0.5 sm:px-2.5 sm:py-1 border rounded-lg font-mono text-[9px] sm:text-[10px] cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md group ${
            isDarkMode 
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-900/60 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
              : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/80 shadow-[0_2px_5px_rgba(16,185,129,0.1)]"
          }`}
          onClick={() => {
            onFocusCoordinate(lat, lng);
          }}
          title="Klik untuk panning otomatis ke lokasi ini"
        >
          <Navigation className="h-2.5 w-2.5 sm:h-3 sm:w-3 group-hover:animate-pulse" />
          <span className="font-bold tracking-wide uppercase">{name}</span>
          <span className="opacity-60 text-[8px] sm:text-[9px]">[{lat.toFixed(2)}, {lng.toFixed(2)}]</span>
        </span>
      );
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    parts.push(<span key={lastIndex}>{parseBoldHtml(text.substring(lastIndex))}</span>);
    
    return <div className="whitespace-pre-wrap leading-relaxed space-y-1.5">{parts}</div>;
  };

  const handleRunBuffer = () => {
    const lat = parseFloat(bufferLat);
    const lng = parseFloat(bufferLng);
    
    if (isNaN(lat) || isNaN(lng)) {

      return;
    }

    const centerPoint = turf.point([lng, lat]); // Turf uses [lng, lat]
    const bufferResult = turf.buffer(centerPoint, bufferRadius, { units: 'kilometers' });
    if (!bufferResult) return;

    // Normalize to array of polygons (Feature<Polygon> or Feature<MultiPolygon>)
    const polygonsToCheck = bufferResult.geometry.type === "MultiPolygon"
      ? bufferResult.geometry.coordinates.map((coords: any) => turf.polygon(coords))
      : [bufferResult as any];

    // Detect impacted villages
    const impactedVs: Village[] = [];
    let populationSum = 0;
    
    villages.forEach(v => {
      const vPoint = turf.point([v.coordinates[1], v.coordinates[0]]);
      const isInside = polygonsToCheck.some(poly => turf.booleanPointInPolygon(vPoint, poly));
      if (isInside) {
        impactedVs.push(v);
        populationSum += v.population;
      }
    });

    const impactedDs = Array.from(new Set(impactedVs.map(v => v.districtId)))
      .map(dId => districts.find(d => d.id === dId))
      .filter(Boolean) as District[];

    let score = Math.min(100, Math.max(10, 100 - (bufferRadius * 2) + Math.min(30, populationSum / 100)));
    
    setBufferResults({
      impactedVillages: impactedVs,
      impactedDistricts: impactedDs,
      score: Math.round(score),
      hasRun: true
    });
    
    onFocusCoordinate(lat, lng);
  };

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    
    const userMsg = inputMsg.trim();
    // Keep internal UI messages unlimited
    const nextMessages = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(nextMessages);
    setInputMsg("");
    setIsAiTyping(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

    try {
      const HISTORY_LIMIT = 10;
      
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-HISTORY_LIMIT).map(m => ({
            role: m.role || 'user',
            parts: [{ text: (typeof m.text === 'string' ? m.text.trim() : String(m.text || "")) || " " }]
          })),
          language: aiLanguage,
          investmentContext: selectedInvestment
        }),
        signal: controller.signal
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", text: data.text || "No response" }]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { role: "model", text: "Koneksi ke server AI terlalu lama (timeout). Mohon coba lagi." }]);
      } else {
        setMessages(prev => [...prev, { role: "model", text: "Terjadi kesalahan saat menghubungi server AI." }]);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsAiTyping(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 md:p-6 transition-all">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className={`shadow-xl w-full h-full sm:h-[85vh] sm:max-w-5xl sm:rounded-2xl flex flex-col overflow-hidden transition-all duration-300 border backdrop-blur-lg ${
        isDarkMode 
          ? "bg-slate-800/70 border-slate-600/30 text-white" 
          : "bg-white/70 border-white/30 text-slate-900"
      }`}>
        
        {/* Responsive, Clean Header */}
        <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b shrink-0 ${
          isDarkMode 
            ? "bg-black/20 border-white/10" 
            : "bg-white/40 border-slate-200/50 text-slate-900"
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className={`p-1.5 sm:p-2 border rounded-xl shrink-0 ${
              isDarkMode 
                ? "bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                : "bg-blue-50 border-blue-200 shadow-sm"
            }`}>
              <Sparkles className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${isDarkMode ? "text-blue-700 dark:text-blue-400" : "text-blue-600"}`} />
            </div>
            <div className="overflow-hidden">
              <h2 className={`font-display font-bold text-xs sm:text-sm md:text-base tracking-wide flex flex-wrap items-center gap-1.5 leading-tight ${
                isDarkMode ? "text-white" : "text-slate-850"
              }`}>
                Gemini Spatial Intelligence Engine
                <span className={`px-1.5 py-0.5 border rounded text-[8px] sm:text-[9px] uppercase font-mono tracking-wider flex items-center gap-1 ${
                  isDarkMode 
                    ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/20" 
                    : "bg-blue-100 text-blue-700 border-blue-200"
                } shrink-0`}>
                  <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 bg-blue-500 rounded-full animate-pulse"></div> ENTERPRISE
                </span>
              </h2>
              <p className={`text-[8px] sm:text-[10px] font-sans truncate ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>AI Investment Site Recommendation & Spatial Analytics</p>
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
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🇮🇩 ID
              </button>
              <button
                onClick={() => setAiLanguage("en")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  aiLanguage === "en"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                onClick={() => setAiLanguage("zh")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  aiLanguage === "zh"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🇨🇳 中文
              </button>
            </div>

            <button onClick={onClose} className={`p-1.5 sm:p-2 rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0 ${
              isDarkMode 
                ? "text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200"
            }`}>
              <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector (Mobile/Small Desktop) */}
        <div className={`flex border-b shrink-0 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
        } lg:hidden`}>
          <button 
            onClick={() => setActiveTab("buffer")} 
            className={`flex-1 py-3 text-[10px] sm:text-xs font-bold font-display uppercase tracking-wider flex justify-center items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "buffer" 
                ? (isDarkMode ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-slate-800/50" : "border-emerald-600 text-emerald-700 bg-white") 
                : (isDarkMode ? "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-300" : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200")
            }`}
          >
            <Target className="h-4 w-4 text-emerald-500" /> AI Site Evaluator
          </button>
          <button 
            onClick={() => setActiveTab("ai")} 
            className={`flex-1 py-3 text-[10px] sm:text-xs font-bold font-display uppercase tracking-wider flex justify-center items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "ai" 
                ? (isDarkMode ? "border-blue-500 text-blue-700 dark:text-blue-400 bg-slate-800/50" : "border-blue-600 text-blue-700 bg-white") 
                : (isDarkMode ? "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-300" : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200")
            }`}
          >
            <Bot className="h-4 w-4 text-blue-500" /> Gemini Consultant
          </button>
        </div>

        {/* Content Splitter with Proper Mobile Box Sizing & Scroll Behaviors */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 relative">
          
          {/* LEFT/TOP: Buffer Analysis */}
          <div className={`flex-[1.1] lg:flex flex-col border-r overflow-y-auto ${
            activeTab === "buffer" ? "flex" : "hidden"
          } relative min-h-0 ${
            isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"
          }`}>
            
            {isDarkMode && <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>}

            <div className="p-4 sm:p-5 flex flex-col gap-4 relative z-10">
              
              <div className="flex flex-col gap-1">
                <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-2 tracking-wide ${
                  isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-700"
                }`}>
                  <MapPin className="h-4 w-4" /> AI Site Evaluator
                </h3>
                <p className={`text-[10px] sm:text-[11px] leading-relaxed font-sans ${
                  isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600"
                }`}>
                  Simulasi kelayakan investasi menggunakan spatial engine on-device dengan buffer kustom, evaluasi infrastruktur, dan scoring algoritmik instan.
                </p>
              </div>

              <div className={`border rounded-[20px] p-4 sm:p-5 flex flex-col gap-4 shadow-xl transition-all ${
                isDarkMode 
                  ? "bg-slate-950/60 border-slate-800/80" 
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5 relative">
                    <label className={`text-[8px] sm:text-[9px] font-mono uppercase tracking-widest pl-1 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>Latitude (Y)</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={bufferLat} 
                      onChange={(e) => setBufferLat(e.target.value)} 
                      className={`border rounded-xl px-3 py-2 text-[11px] sm:text-xs focus:outline-none focus:ring-1 transition-all font-mono bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white z-[60] focus:border-emerald-500 focus:ring-emerald-500/50 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50`} 
                      placeholder="-3.0766" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 relative">
                    <label className={`text-[8px] sm:text-[9px] font-mono uppercase tracking-widest pl-1 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>Longitude (X)</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={bufferLng} 
                      onChange={(e) => setBufferLng(e.target.value)} 
                      className={`border rounded-xl px-3 py-2 text-[11px] sm:text-xs focus:outline-none focus:ring-1 transition-all font-mono bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white z-[60] focus:border-emerald-500 focus:ring-emerald-500/50 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/50`} 
                      placeholder="120.1916" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mt-1">
                  <div className="flex items-center justify-between">
                    <label className={`text-[8px] sm:text-[9px] font-mono uppercase tracking-widest pl-1 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>{t('spatial.buffer')}</label>
                    <span className={`font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border ${
                      isDarkMode 
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-950/50 border-emerald-900/80" 
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}>{bufferRadius} KM</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    step="1" 
                    value={bufferRadius} 
                    onChange={(e) => setBufferRadius(parseInt(e.target.value))} 
                    className="w-full accent-emerald-500 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full appearance-none cursor-pointer" 
                  />
                  <div className="flex justify-between text-[8px] text-slate-600 dark:text-slate-400 font-mono font-bold px-1">
                    <span>1 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                <button 
                  onClick={handleRunBuffer} 
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 sm:py-3.5 rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all text-[10px] sm:text-[11px] font-display tracking-wider border border-emerald-500 group relative overflow-hidden"
                >
                  <Target className="h-4 w-4 shrink-0" />
                  <span>EKSEKUSI ENGINE EVALUATOR</span>
                </button>
              </div>

              {/* Realtime Results Output Panel with beautiful design */}
              <div className="flex flex-col gap-2 flex-1 mt-1">
                <h4 className={`text-[8px] sm:text-[10px] font-bold font-mono uppercase tracking-widest border-b pb-1.5 flex items-center gap-2 ${
                  isDarkMode ? "text-slate-600 dark:text-slate-400 border-slate-800" : "text-slate-600 dark:text-slate-400 border-slate-200"
                }`}>
                  <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Output Intelligence
                </h4>
                
                {bufferResults.hasRun ? (
                  <div className={`border rounded-2xl p-4 flex flex-col gap-4 animate-fade-in flex-1 shadow-lg relative overflow-hidden ${
                    isDarkMode 
                      ? "bg-slate-900/50 border-emerald-500/20" 
                      : "bg-emerald-50/15 border-emerald-600/10 text-slate-800"
                  }`}>
                     <div className="flex items-center justify-between border-b pb-3 relative z-10 border-slate-500/10">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[8px] font-mono uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-700"}`}><Sparkles className="h-2.5 w-2.5" /> AI Readiness Score</span>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl sm:text-3.5xl font-display font-black tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>{bufferResults.score}</span>
                            <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">/ 100 PTS</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="h-8 w-8 text-emerald-500">
                            <svg viewBox="0 0 36 36" className="circular-chart emerald">
                              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="3" />
                              <path className="circle" strokeDasharray={`${bufferResults.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={isDarkMode ? "#34d399" : "#059669"} strokeWidth="3" strokeLinecap="round" />
                            </svg>
                          </div>
                          <span className={`text-[7px] font-mono uppercase font-bold tracking-widest ${isDarkMode ? "text-emerald-500/65" : "text-emerald-700"}`}>Confidence</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className={`border rounded-xl p-2.5 shadow-sm ${isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white border-slate-200"}`}>
                          <span className="text-[8px] text-slate-600 dark:text-slate-400 font-mono uppercase tracking-widest block">Populasi Target</span>
                          <span className={`text-sm sm:text-base font-bold font-mono block tracking-tight ${isDarkMode ? "text-indigo-700 dark:text-indigo-400" : "text-indigo-700"}`}>
                            {bufferResults.impactedVillages.reduce((sum, v) => sum + v.population, 0).toLocaleString()} <span className="text-[8px] font-sans text-slate-600 dark:text-slate-400 font-normal">Jiwa</span>
                          </span>
                        </div>
                        <div className={`border rounded-xl p-2.5 shadow-sm ${isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white border-slate-200"}`}>
                          <span className="text-[8px] text-slate-600 dark:text-slate-400 font-mono uppercase tracking-widest block">Covered Areas</span>
                          <span className={`text-sm sm:text-base font-bold font-mono block tracking-tight ${isDarkMode ? "text-amber-700 dark:text-amber-400" : "text-amber-700"}`}>
                            {bufferResults.impactedDistricts.length} <span className="text-[8px] font-sans text-slate-600 dark:text-slate-400 font-normal">Kec.</span>
                          </span>
                        </div>
                     </div>

                     <div className="flex flex-col gap-1 relative z-10">
                        <span className={`text-[8px] font-mono uppercase tracking-widest pl-1 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>Spasial Terdampak ({bufferResults.impactedVillages.length} Desa)</span>
                        <div className={`max-h-28 overflow-y-auto custom-scrollbar p-1 rounded-xl border ${
                          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-250"
                        } space-y-0.5`}>
                          {bufferResults.impactedVillages.slice(0, 10).map((v, idx) => (
                            <div 
                              key={`${v.id}-${idx}`} 
                              className={`flex justify-between items-center py-1.5 px-2 bg-transparent rounded-lg cursor-pointer transition-colors group ${
                                isDarkMode ? "hover:bg-slate-800/80" : "hover:bg-slate-100"
                              }`} 
                              onClick={() => onFocusCoordinate(v.coordinates[0], v.coordinates[1])}
                            >
                              <span className={`text-[11px] font-semibold transition-colors ${isDarkMode ? "text-slate-300 group-hover:text-white" : "text-slate-800 dark:text-slate-200 group-hover:text-slate-950"}`}>{v.name}</span>
                              <span className={`text-[8px] font-mono transition-colors px-1 py-0.5 rounded border ${
                                isDarkMode ? "text-slate-600 dark:text-slate-400 group-hover:text-emerald-400 bg-slate-900 border-slate-700" : "text-slate-600 group-hover:text-emerald-700 bg-slate-50 border-slate-200"
                              }`}>Pop: {(v.population / 1000).toFixed(1)}k</span>
                            </div>
                          ))}
                          {bufferResults.impactedVillages.length > 10 && (
                            <div className={`text-center text-[9px] py-1.5 italic font-mono rounded-lg mt-1 border border-dashed ${
                              isDarkMode ? "bg-slate-900/40 border-slate-800 text-slate-600 dark:text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600 dark:text-slate-400"
                            }`}>
                              + {bufferResults.impactedVillages.length - 10} area lainnya
                            </div>
                          )}
                          {bufferResults.impactedVillages.length === 0 && (
                            <div className="text-center text-slate-600 dark:text-slate-400 py-3 italic font-sans text-[10px]">Tidak ada pemukiman terdeteksi.</div>
                          )}
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-2xl p-5 sm:p-8 min-h-[160px] text-center ${
                    isDarkMode ? "border-slate-700/60 bg-slate-900/10 text-slate-600" : "border-slate-300 bg-slate-50 text-slate-600 dark:text-slate-400"
                  }`}>
                    <div className="h-10 w-10 rounded-full bg-slate-500/10 flex items-center justify-center mb-2">
                      <Target className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="text-[9px] font-mono max-w-[200px] leading-relaxed uppercase tracking-wider block">Awaiting parameters untuk evaluasi spasial.</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT/BOTTOM: AI Consultant (Gemini) with scrollable layout fixed for Android */}
          <div className={`flex-[1.5] lg:flex flex-col relative border-l shadow-[-20px_0_30px_-10px_rgba(0,0,0,0.15)] ${
            activeTab === "ai" ? "flex" : "hidden lg:flex"
          } min-h-0 ${
            isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-slate-50/50 border-slate-250"
          }`}>
            
            {/* AI Info Bar inside the panel */}
            <div className={`px-4 py-2 sm:px-5 sm:py-3 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            }`}>
               <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className={`h-7 w-7 rounded-full border flex items-center justify-center z-10 relative ${
                      isDarkMode ? "bg-blue-600/20 border-blue-500/40" : "bg-blue-50 border-blue-300"
                    }`}>
                      <Bot className={`h-3.5 sm:h-4 sm:w-4 ${isDarkMode ? "text-blue-700 dark:text-blue-400" : "text-blue-600"}`} />
                    </div>
                    <div className="absolute top-0 left-0 w-7 h-7 rounded-full bg-blue-500/20 animate-ping"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[11px] sm:text-xs font-bold font-display tracking-wide flex items-center gap-1 ${
                      isDarkMode ? "text-white" : "text-slate-800"
                    }`}>
                      Gemini Spasial Consultant
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className={`text-[8px] sm:text-[9px] font-mono ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>Gemini 3.5-Flash Spatial Engine</span>
                  </div>
               </div>
            </div>

            {/* Fixed Greeting Header */}
            {greeting && (
              <div className="px-4 sm:px-6 py-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-[#00FF99]" />
                  </div>
                  <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl rounded-tl-xs p-4 sm:p-5 bg-white dark:bg-slate-800 text-slate-800 dark:text-emerald-50 border border-slate-200 dark:border-emerald-800/30 shadow-sm">
                    <p className="text-xs sm:text-sm leading-relaxed text-pretty">
                      {greeting.text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat History with correct scroll bounds */}
            <div 
              ref={chatContainerRef}
              className={`flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col gap-3.5 custom-scrollbar min-h-0 ${
                isDarkMode 
                  ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-950 via-slate-900/40 to-slate-950" 
                  : "bg-white text-slate-800"
              }`}
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 sm:gap-3 max-w-[92%] sm:max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in ${m.role === 'user' ? 'slide-in-from-right-2' : 'slide-in-from-left-2'} duration-300`}>
                    
                    <div className={`shrink-0 h-6.5 w-6.5 rounded-full flex items-center justify-center flex-none mt-0.5 shadow-md ${
                      m.role === 'user' 
                        ? 'bg-slate-655 text-white' 
                        : (isDarkMode ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 border-none' : 'bg-gradient-to-tr from-sky-500 to-indigo-600 border-none text-white')
                    }`}>
                      {m.role === 'user' ? <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div> : <Bot className="h-3 w-3 text-white" />}
                    </div>
                    
                    <div className={`px-4 py-3 rounded-3xl text-sm sm:text-base font-medium leading-relaxed shadow-lg backdrop-blur-md border ${
                      m.role === 'user' 
                        ? 'bg-indigo-600/90 text-white rounded-tr-sm border-indigo-500/50 shadow-md font-semibold' 
                        : (isDarkMode 
                            ? 'bg-slate-900/80 text-white border-slate-700/50 rounded-tl-sm max-h-[60vh] overflow-y-auto pr-4 ai-custom-scrollbar tracking-wide' 
                            : 'bg-white/80 text-slate-950 border-white/40 rounded-tl-sm max-h-[60vh] overflow-y-auto pr-4 ai-custom-scrollbar tracking-wide')
                    }`}>
                      {m.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <MarkdownWithCoords text={m.text} />
                          {m.sources && m.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-300/30 dark:border-slate-700/50">
                              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" /> Referensi Dokumen IPRO (RAG)
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {m.sources.map((src, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium border border-indigo-200/50 dark:border-indigo-800/50">
                                    <Target className="w-2.5 h-2.5" />
                                    {src}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isAiTyping && (
                <div className="flex w-full justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex gap-2 sm:gap-3 max-w-[85%] flex-row">
                    <div className="w-6.5 h-6.5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mt-0.5 shrink-0 animate-pulse"></div>
                    <div className="px-5 py-3 bg-slate-200 dark:bg-slate-700 rounded-3xl rounded-tl-sm flex items-center justify-center gap-1.5 animate-pulse shadow-sm border border-slate-300/50 dark:border-slate-600/50">
                       <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                       <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                       <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <ResponsiveChatInput
              value={inputMsg}
              onChange={setInputMsg}
              onSubmit={handleSendChat}
              isTyping={isAiTyping}
              placeholder="Tanyakan kelayakan 200Ha tambak di selatan, atau skor..."
              isDarkMode={isDarkMode}
            />

          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
