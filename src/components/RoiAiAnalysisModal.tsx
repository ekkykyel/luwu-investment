import { motion } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, TrendingUp, DollarSign, Calculator, RefreshCw, CheckCircle2, AlertTriangle, Bot, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { formatRupiah, formatRupiahSingkat } from "../lib/formatters";
import ResponsiveChatInput from "./ResponsiveChatInput";
import { useTranslation } from "react-i18next";
import { generateHeuristicRoiAnalysis, formatHeuristicRoiMarkdown } from "../hooks/useRoiCalculation";

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

  // Synchronize active theme with document.documentElement.classList to prevent light/dark desync
  const [effectiveDark, setEffectiveDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return Boolean(isDarkMode);
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const updateTheme = () => {
      setEffectiveDark(document.documentElement.classList.contains('dark'));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [isDarkMode]);
  
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

    const isEn = aiLanguage === "en";
    const isZh = aiLanguage === "zh";

    const netOperatingIncome = revenue - opex;
    const isPaybackUnpaid = paybackPeriod >= 999 || netOperatingIncome <= 0;
    const isDeficit = npv < 0 || isPaybackUnpaid || netOperatingIncome <= 0 || (irr === 0 && npv <= 0);
    const isFeasible = !isDeficit && npv > 0 && irr >= discountRate && !isPaybackUnpaid;
    const isConditional = !isDeficit && !isFeasible;

    let userPrompt = "";
    if (isEn) {
      userPrompt = `Perform an in-depth Investment Feasibility Analysis & ROI Projection for the following parameters:
- Project Name: ${investmentName}
- Sector / Category: ${sector}
- Estimated Investment (CAPEX): IDR ${capex.toLocaleString("en-US")}
- Estimated Operating Cost (OPEX / Year): IDR ${opex.toLocaleString("en-US")}
- Projected Gross Revenue (Revenue / Year): IDR ${revenue.toLocaleString("en-US")}
- Net Operating Income / Profit: IDR ${netOperatingIncome.toLocaleString("en-US")}/year
- Return on Investment (ROI): ${roi.toFixed(2)}%
- Payback Period (BEP): ${isPaybackUnpaid ? 'Unpayable (> Tenor / Operating Deficit)' : `${paybackPeriod.toFixed(1)} Years`}
- Internal Rate of Return (IRR): ${irr.toFixed(2)}%
- Net Present Value (NPV): IDR ${npv.toLocaleString("en-US")}
- Benchmark Discount Rate (WACC): ${discountRate}%

STRICT FINANCIAL INTEGRITY DIRECTIVE:
You MUST cite the EXACT financial figures above in your report (Payback = ${isPaybackUnpaid ? 'Unpayable (> Tenor)' : `${paybackPeriod.toFixed(1)} Years`}, ROI = ${roi.toFixed(2)}%, IRR = ${irr.toFixed(2)}%, NPV = IDR ${npv.toLocaleString("en-US")}). NEVER alter, round contrary to, or recalculate conflicting financial metrics!

MANDATORY EVALUATION RULES BASED ON METRIC TRUTH:
${isDeficit ? `- CURRENT SCENARIO IS DEFICIT / NOT FEASIBLE:
  * Feasibility Status MUST be: 🔴 NOT FEASIBLE / REVIEW REQUIRED (DEFICIT SCENARIO)
  * Executive Feasibility Score MUST be between 5 - 25/100 (Critical Review Category). NEVER assign 70+ or Tier-1 Priority to a deficit project!
  * In Payback analysis, explicitly state that capital investment cannot be recouped within project tenor because annual operating expenses exceed revenues. NEVER state capital is recouped in year 999!
  * In NPV analysis, explicitly state that NPV is NEGATIVE (IDR ${npv.toLocaleString("en-US")}) and destroys shareholder value. NEVER describe negative NPV as positive!
  * Recommend concrete adjustments: increase harvest yield/production volume, increase commodity price, or restructure OPEX.` : isConditional ? `- CURRENT SCENARIO IS CONDITIONALLY FEASIBLE:
  * Feasibility Status: 🟡 CONDITIONALLY FEASIBLE (MARGIN SENSITIVITY REVIEW)
  * Executive Feasibility Score: 55 - 68/100` : `- CURRENT SCENARIO IS HIGHLY FEASIBLE:
  * Feasibility Status: 🟢 HIGHLY FEASIBLE (APPROVED FOR PRIORITY PIPELINE)
  * Executive Feasibility Score: 75 - 92/100`}

Generate an exhaustive, highly structured feasibility study adhering strictly to the 5 blueprints:
### A. EXECUTIVE FEASIBILITY SCORE & SUMMARY
### B. ESTIMATED PAYBACK PERIOD & DETAILED FINANCIAL INDICATORS (ROI, NPV, IRR)
(Include 5-Year Cash Flow Projection Table and Sensitivity Scenarios)
### C. REGIONAL TAX ALLOWANCE & INCENTIVE ELIGIBILITY
### D. KEY STRATEGIC RISKS & MITIGATION
### E. ACTIONABLE NEXT STEPS FOR INVESTOR CONCIERGE (MPP SIMPURUSIANG)`;
    } else if (isZh) {
      userPrompt = `请对以下投资方案数据进行深入的投资可行性分析与 ROI 预测：
- 项目名称: ${investmentName}
- 所属产业 / 行业: ${sector}
- 拟投资金额 (CAPEX): ${capex.toLocaleString("zh-CN")} 印尼盾
- 预计年度运营支出 (OPEX / 年): ${opex.toLocaleString("zh-CN")} 印尼盾
- 预计年营业总收入 (Gross Revenue): ${revenue.toLocaleString("zh-CN")} 印尼盾
- 预计年净营运利润: ${netOperatingIncome.toLocaleString("zh-CN")} 印尼盾
- 投资回报率 (ROI): ${roi.toFixed(2)}%
- 预计投资回收期 (BEP): ${isPaybackUnpaid ? '无法回本 (> 投资周期 / 营运赤字)' : `${paybackPeriod.toFixed(1)} 年`}
- 内部收益率 (IRR): ${irr.toFixed(2)}%
- 净现值 (NPV): ${npv.toLocaleString("zh-CN")} 印尼盾
- 基准折现率 (WACC): ${discountRate}%

严格财务一致性与客观评估指令：
您必须准确引用上述财务指标。
${isDeficit ? `- 当前方案处于亏损/暂不可行状态:
  * 可行性结论必须为: 🔴 需调整核心假设 / 暂不可行 (亏损风险)
  * 综合评分必须介于 5 至 25 分 (严禁对亏损项目给出 80+ 高分或重点支持评级)
  * 投资回收期必须明确说明: 因年营运现金流赤字，资本在设定投资周期内无法回本 (严禁输出在第999年回本的荒谬结论)
  * 净现值必须明确指出为负值 (${npv.toLocaleString("zh-CN")} 印尼盾)，正在损耗资本价值 (严禁将负数描述为显著正向)
  * 提出切实改进方案: 提高产能或售价，或压降运营成本。` : isConditional ? `- 当前方案属于有条件可行:
  * 可行性结论: 🟡 有条件可行 (需关注利差敏感度)
  * 综合评分: 55 至 68 分` : `- 当前方案极具投资可行性:
  * 可行性结论: 🟢 极具投资可行性 (重点支持产业)
  * 综合评分: 75 至 92 分`}

严格按照以下 5 大模块结构生成全面详尽的中文报告：
### A. 执行可行性概述与综合评分 (EXECUTIVE FEASIBILITY SCORE)
### B. 预计投资回收期与详细财务指标 (ROI, NPV, IRR)
(包含完整的5年期现金流模拟预测表与敏感性压力测试)
### C. 区域税收优惠与政策便利资质 (TAX ALLOWANCE & INCENTIVES)
### D. 关键战略风险与缓解措施 (KEY STRATEGIC RISKS & MITIGATION)
### E. 投资绿色通道行动指南 (MPP SIMPURUSIANG VIP CONCIERGE)`;
    } else {
      userPrompt = `Lakukan Analisis Kelayakan Investasi & Proyeksi ROI mendalam untuk data input berikut:
- Nama Rencana Kegiatan / Proyek: ${investmentName}
- Kategori / Sektor: ${sector}
- Estimasi Nilai Investasi (CAPEX): ${formatRupiah(capex)}
- Estimasi Biaya Operasional (OPEX / Tahun): ${formatRupiah(opex)}
- Proyeksi Pendapatan (Revenue / Tahun): ${formatRupiah(revenue)}
- Laba Bersih Operasional: ${formatRupiah(netOperatingIncome)} / tahun
- Return on Investment (ROI): ${roi.toFixed(2)}%
- Payback Period (BEP): ${isPaybackUnpaid ? 'Tidak Terbayar (> Tenor / Defisit)' : `${paybackPeriod.toFixed(1)} Tahun`}
- Internal Rate of Return (IRR): ${irr.toFixed(2)}%
- Net Present Value (NPV): ${formatRupiah(npv)}
- Suku Bunga Acuan (Discount Rate / WACC): ${discountRate}%
${isUsingOSS ? "\nSTANDAR PERHITUNGAN: Menggunakan Standar Rinci OSS-RBA / Odoo (Termasuk estimasi detail kebutuhan Capex, Opex, serta serapan Tenaga Kerja Lokal TKD)." : ""}

🚨 DOKTRIN INTEGRITAS FINANSIAL KABUPATEN LUWU (ANTI-HALUSINASI):
Anda WAJIB mengutip PERSIS angka finansial di atas (Payback Period = ${isPaybackUnpaid ? 'Tidak Terbayar (> Tenor)' : `${paybackPeriod.toFixed(1)} Tahun`}, ROI = ${roi.toFixed(2)}%, IRR = ${irr.toFixed(2)}%, NPV = ${formatRupiah(npv)}). DILARANG KERAS memalsukan kalkulasi!

ATURAN EVALUASI LOGIS WAJIB:
${isDeficit ? `🚨 KONDISI SAAT INI ADALAH PROYEK DEFISIT / BELUM LAYAK:
- Status Kelayakan WAJIB: 🔴 PERLU PENYESUAIAN ASUMSI (TIDAK LAYAK / DEFISIT)
- Skor Kelayakan AI (1 - 100) WAJIB antara 15 - 35/100 (Kategori Evaluasi Kritis / Di Bawah Ambang Kelayakan). DILARANG KERAS memberikan skor 80+ atau status SANGAT LAYAK pada proyek defisit!
- Pada analisis Payback Period (BEP):
  * Jika Laba Bersih Operasional tahunan bernilai POSITIF (${formatRupiah(netOperatingIncome)}/tahun) dengan BEP nominal ${paybackPeriod.toFixed(1)} tahun: Jelaskan secara akurat bahwa secara nominal modal kembali dalam ${paybackPeriod.toFixed(1)} tahun, TETAPI secara terdiskon (Discounted Payback pada WACC ${discountRate}% dan inflasi) akumulasi arus kas terdiskon tidak mampu menutup modal awal dalam batas tenor proyek sehingga NPV menjadi negatif (${formatRupiah(npv)}). DILARANG menyatakan "pendapatan tidak cukup menutupi operasional" jika laba bersih sebenarnya positif!
  * Jika Laba Bersih benar-benar negatif (<= 0): Jelaskan bahwa modal tidak dapat kembali karena pendapatan di bawah beban operasional tahunan.
- Pada analisis NPV, jelaskan secara eksplisit bahwa nilai NPV bertanda NEGATIF (${formatRupiah(npv)}) dan terdiskon di bawah biaya modal investasi jika diukur pada discount rate WACC ${discountRate}%. DILARANG KERAS menyebut angka bertanda minus ini sebagai positif!
- Pada analisis IRR, sebutkan bahwa IRR (${irr.toFixed(2)}%) berada di bawah suku bunga acuan WACC ${discountRate}%. DILARANG mengarang angka IRR yang berbeda!
- Berikan saran koreksi konkret (What-If Inverse Optimization): Hitung rekomendasi kenaikan harga komoditas (Rp/Kg), peningkatan volume panen, atau efisiensi OPEX untuk mencapai titik impas finansial (NPV >= 0).` : isConditional ? `KONDISI SAAT INI ADALAH LAYAK BERSYARAT:
- Status Kelayakan: 🟡 LAYAK BERSYARAT (CONDITIONALLY FEASIBLE)
- Skor Kelayakan: 55 - 68/100` : `KONDISI SAAT INI ADALAH SANGAT LAYAK:
- Status Kelayakan: 🟢 SANGAT LAYAK (HIGHLY FEASIBLE)
- Skor Kelayakan: 75 - 92/100`}

Hasilkan laporan analisis lengkap (minimal 500–800 kata) sesuai format struktur A hingga E berikut tanpa ada bagian yang terlewat:

### A. RINGKASAN EKSEKUTIF & SKOR KELAYAKAN
- Status Kelayakan: [Sesuai aturan di atas]
- Skor Kelayakan AI (1 - 100): [Sesuai aturan di atas]
- Justifikasi Singkat: (2-3 kalimat mengenai evaluasi kelayakan riil)

### B. ANALISIS INDIKATOR FINANSIAL & SIMULATOR ROI DETAILED
Buat analisis rinci berdasarkan parameter input simulator (CAPEX, OPEX, Pendapatan, Masa Konsesi, Discount Rate):
1. Payback Period (BEP): Analisis pengembalian modal.
2. Net Present Value (NPV): Evaluasi nilai bersih investasi terhadap WACC ${discountRate}%.
3. Internal Rate of Return (IRR): Persentase tingkat pengembalian dibanding Discount Rate.
4. Profitability Index (PI) & Profit Margin (%): Estimasi margin keuntungan tahunan.
5. Skenario Sensitivitas:
   - Skenario Optimis (Pendapatan +15%)
   - Skenario Moderat (Baseline)
   - Skenario Pesimis (Biaya Operasional +20%)
Sertakan Tabel Proyeksi Arus Kas 5 Tahun (5-Year Cash Flow Projection Table).

### C. FASILITAS TAX ALLOWANCE & INSENTIF DAERAH
- Keringanan Retribusi Daerah & Sewa Lahan hingga 35% untuk penyerapan minimal 60% Tenaga Kerja Asli Luwu (TKD).
- Penyerapan Tenaga Kerja Lokal (Estimasi jumlah SDM terdisrupsi/terrekrut).
- Integrasi Tata Ruang / PKKPR & Kesesuaian Lahan RTRW Luwu (Perda RTRW No. 06/2011 & RPJPD 2025-2045).

### D. ANALISIS RISIKO STRATEGIS & MITIGASI
- Risiko Finansial & Operasional.
- Risiko Perizinan & Regulasi Spasial.
- Langkah Mitigasi Konkret untuk Investor.

### E. REKOMENDASI STRATEGIS & ACTION PLAN (MPP SIMPURISIANG)
- Langkah percepatan perizinan di DPMPTSP / MPP Simpurusiang.
- Rekomendasi Kemudahan Insentif Investasi Daerah (keringanan retribusi & sewa lahan hingga 35% untuk penyerapan tenaga kerja lokal).`;
    }

    try {
      const controller = new AbortController();
      // Timeout 35 detik untuk memungkinkan AI menyusun telaah komprehensif mendalam
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: userPrompt,
          isFollowUp: false,
          history: [],
          language: aiLanguage,
          locale: aiLanguage,
          investment_amount: capex,
          sector: sector,
          workforce_target: Math.max(25, Math.round(capex / 150000000)),
          location: "Kabupaten Luwu",
          investmentContext: { name: investmentName, sector: sector },
          simulationContext: {
            name: investmentName,
            sector: sector,
            capex,
            revenue,
            asumsiPendapatan: revenue,
            opex,
            netProfit: netOperatingIncome,
            paybackPeriod: isPaybackUnpaid ? 999 : paybackPeriod,
            bep: isPaybackUnpaid ? 999 : paybackPeriod,
            irr,
            npv,
            roi,
            discountRate,
            tenor: 8,
            isDeficit,
            status: isDeficit ? 'NOT_FEASIBLE' : isConditional ? 'MODERATE' : 'FEASIBLE',
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
        data = {};
      }

      if (res.ok) {
        console.info(`[ROI AI Client] ✅ Analysis received successfully in ${elapsed}ms:`, {
          sourcesCount: (data.sources || []).length,
          replyLength: (data.text || '').length
        });
        const fullReply = data.text || data.reply;
        if (fullReply && fullReply.trim().length > 50) {
          appendAndAnimateModelMessage(fullReply, []);
          return;
        }
      }
    } catch (err: any) {
      console.warn(`[ROI AI Client] AI API timed out or unavailable (${Date.now() - startTime}ms), activating Fallback ROI Engine:`, err);
    }

    // Graceful Fallback Analysis (Sistem Anti-Fail)
    const heuristic = generateHeuristicRoiAnalysis({
      nilaiInvestasi: capex,
      sektor: sector,
      luasLahan: 10,
      capex,
      opex,
      revenue,
      npv,
      irr,
      paybackPeriod: isPaybackUnpaid ? 999 : paybackPeriod,
      roi,
      discountRate,
      tenor: 8,
    });

    const fallbackReply = formatHeuristicRoiMarkdown(heuristic, {
      capex,
      opex,
      revenue,
      roi,
      projectName: investmentName,
      sector,
      locale: aiLanguage,
      discountRate,
      tenor: 8,
    });

    appendAndAnimateModelMessage(fallbackReply, []);
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
          isFollowUp: true,
          history: currentHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          language: aiLanguage,
          locale: aiLanguage,
          investment_amount: capex,
          sector: sector,
          workforce_target: Math.max(25, Math.round(capex / 150000000)),
          location: "Kabupaten Luwu",
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
        data = {};
      }

      if (res.ok && (data.text || data.reply)) {
        const reply = data.text || data.reply;
        appendAndAnimateModelMessage(reply, updatedMessages);
      } else {
        const isPaybackUnpaid = paybackPeriod >= 999 || (revenue - opex) <= 0;
        const heuristic = generateHeuristicRoiAnalysis({
          nilaiInvestasi: capex,
          sektor: sector,
          luasLahan: 10,
          capex,
          opex,
          revenue,
          npv,
          irr,
          paybackPeriod: isPaybackUnpaid ? 999 : paybackPeriod,
          roi,
          discountRate
        });
        let fallbackChat = "";
        if (aiLanguage === "en") {
          fallbackChat = `Regarding your investment inquiry on "${investmentName}" in the ${sector} sector:\n\n` +
            `1. Financial Indicator (BEP): ${heuristic.paybackDisplay}.\n` +
            `2. The Luwu Regency Government through DPMPTSP is prepared to facilitate integrated permitting (PKKPR & land technical verification) to ensure optimal and legally secure investment realization.`;
        } else if (aiLanguage === "zh") {
          fallbackChat = `关于您对 "${investmentName}"（所属产业：${sector}）的投资咨询：\n\n` +
            `1. 财务指标评估 (BEP): ${heuristic.paybackDisplay}。\n` +
            `2. 芦梧县政府综合一站式投资服务部门 (DPMPTSP) 将为企业全程提供空间规划许可 (PKKPR) 与环评确权协同，保障投资项目合规高效落地。`;
        } else {
          fallbackChat = `Tabe' Bapak/Ibu. Terkait simulasi "${investmentName}" pada sektor ${sector}:\n\n` +
            `1. Indikator Pengembalian Modal (BEP): ${heuristic.paybackDisplay}.\n` +
            `2. Pemkab Luwu melalui DPMPTSP siap mendampingi kesiapan dokumen perizinan (PKKPR dan Pertek Pertanahan) agar realisasi investasi berjalan aman dan optimal.`;
        }
        appendAndAnimateModelMessage(fallbackChat, updatedMessages);
      }
    } catch (err) {
      console.warn("ROI AI send fallback:", err);
      const isPaybackUnpaid = paybackPeriod >= 999 || (revenue - opex) <= 0;
      const heuristic = generateHeuristicRoiAnalysis({
        nilaiInvestasi: capex,
        sektor: sector,
        luasLahan: 10,
        capex,
        opex,
        revenue,
        npv,
        irr,
        paybackPeriod: isPaybackUnpaid ? 999 : paybackPeriod,
        roi,
        discountRate
      });
      let fallbackChat = "";
      if (aiLanguage === "en") {
        fallbackChat = `Regarding your investment inquiry on "${investmentName}" in the ${sector} sector:\n\n` +
          `1. Financial Indicator (BEP): ${heuristic.paybackDisplay}.\n` +
          `2. The Luwu Regency Government through DPMPTSP is prepared to facilitate integrated permitting (PKKPR & land technical verification) to ensure optimal and legally secure investment realization.`;
      } else if (aiLanguage === "zh") {
        fallbackChat = `关于您对 "${investmentName}"（所属产业：${sector}）的投资咨询：\n\n` +
          `1. 财务指标评估 (BEP): ${heuristic.paybackDisplay}。\n` +
          `2. 芦梧县政府综合一站式投资服务部门 (DPMPTSP) 将为企业全程提供空间规划许可 (PKKPR) 与环评确权协同，保障投资项目合规高效落地。`;
      } else {
        fallbackChat = `Tabe' Bapak/Ibu. Terkait simulasi "${investmentName}" pada sektor ${sector}:\n\n` +
          `1. Indikator Pengembalian Modal (BEP): ${heuristic.paybackDisplay}.\n` +
          `2. Pemkab Luwu melalui DPMPTSP siap mendampingi kesiapan dokumen perizinan (PKKPR dan Pertek Pertanahan) agar realisasi investasi berjalan aman dan optimal.`;
      }
      appendAndAnimateModelMessage(fallbackChat, updatedMessages);
    }
  };

  if (!isOpen) return null;

  // Comprehensive markdown formatter — handles headers, tables, lists, blockquotes, HR
  const formatTextToJsx = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const trimmed = lines[i].trim();

      // Horizontal rule (---)
      if (/^---+$/.test(trimmed)) {
        elements.push(<hr key={i} className="my-4 border-slate-200 dark:border-slate-700/60" />);
        i++;
        continue;
      }

      // Markdown Table: collect consecutive rows starting with |
      if (trimmed.startsWith("|")) {
        const tableRows: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          tableRows.push(lines[i].trim());
          i++;
        }
        // Parse header, separator, body
        const isSeparator = (row: string) => /^\|[\s\-:|]+\|$/.test(row);
        const parseCells = (row: string) =>
          row.split("|").slice(1, -1).map((c) => c.trim());

        const headerRow = tableRows.length > 0 ? parseCells(tableRows[0]) : [];
        const bodyRows = tableRows
          .slice(1)
          .filter((r) => !isSeparator(r))
          .map(parseCells);

        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <table className="w-full text-xs sm:text-sm border-collapse">
              {headerRow.length > 0 && (
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80">
                    {headerRow.map((cell, ci) => (
                      <th key={ci} className="px-2.5 py-2 text-left font-extrabold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        {parseBoldText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className={`${ri % 2 === 0 ? "bg-white dark:bg-slate-900/60" : "bg-slate-50 dark:bg-slate-800/40"} hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors`}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-medium border-b border-slate-100 dark:border-slate-800/60 whitespace-nowrap">
                        {parseBoldText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Sub-sub-headers (####)
      if (trimmed.startsWith("####")) {
        elements.push(
          <h5 key={i} className="text-xs sm:text-sm font-bold text-slate-800 dark:text-sky-300 mt-4 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <Calculator size={14} className="text-sky-600 dark:text-sky-400" />
            {parseBoldText(trimmed.replace(/^#{4,}\s*/, "").trim())}
          </h5>
        );
        i++;
        continue;
      }

      // Headers (### then ## then #)
      if (trimmed.startsWith("###")) {
        elements.push(
          <h4 key={i} className="text-sm font-bold text-slate-950 dark:text-blue-300 mt-5 mb-2 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1 uppercase tracking-wide">
            <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            {trimmed.replace("###", "").trim()}
          </h4>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("##")) {
        elements.push(
          <h3 key={i} className="text-base font-extrabold text-indigo-950 dark:text-indigo-400 mt-6 mb-3 flex items-center gap-2 border-b border-indigo-200 dark:border-indigo-900/40 pb-1">
            <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
            {trimmed.replace("##", "").trim()}
          </h3>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("#")) {
        elements.push(
          <h2 key={i} className="text-lg font-black text-slate-950 dark:text-white mt-7 mb-4">
            {trimmed.replace("#", "").trim()}
          </h2>
        );
        i++;
        continue;
      }

      // Blockquotes (> ...)
      if (trimmed.startsWith(">")) {
        const quoteContent = trimmed.replace(/^>\s*/, "").trim();
        elements.push(
          <blockquote key={i} className="my-3 pl-3.5 border-l-[3px] border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 py-2 pr-3 rounded-r-lg">
            <p className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 leading-relaxed italic">
              {parseBoldText(quoteContent)}
            </p>
          </blockquote>
        );
        i++;
        continue;
      }

      // Numbered lists (1. 2. 3. etc.)
      if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s*/, "").trim();
        elements.push(
          <li key={i} className="ml-4 list-decimal text-sm sm:text-base font-medium text-slate-950 dark:text-slate-100 mb-2.5 leading-relaxed">
            {parseBoldText(content)}
          </li>
        );
        i++;
        continue;
      }

      // Bullet lists (- or *)
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const content = trimmed.substring(1).trim();
        elements.push(
          <li key={i} className="ml-4 list-disc text-sm sm:text-base font-medium text-slate-950 dark:text-slate-100 mb-2.5 leading-relaxed">
            {parseBoldText(content)}
          </li>
        );
        i++;
        continue;
      }

      // Empty line
      if (trimmed === "") {
        elements.push(<div key={i} className="h-2.5" />);
        i++;
        continue;
      }

      // Default paragraph
      elements.push(
        <p key={i} className="text-sm sm:text-base font-medium text-slate-950 dark:text-slate-100 leading-relaxed mb-3.5">
          {parseBoldText(trimmed)}
        </p>
      );
      i++;
    }

    return elements;
  };

  // Helper to parse **bold** text in paragraphs with guaranteed high-contrast styling
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-blue-900 dark:text-cyan-300">{part}</strong>;
      }
      return <span key={i} className="text-slate-950 dark:text-slate-100 font-medium">{part}</span>;
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
      className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 bg-base/70 backdrop-blur-sm transition-opacity font-sans"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        id="roi-ai-modal-container"
        className={`w-[calc(100vw-20px)] sm:w-full h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[94vh] max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 ${
          effectiveDark 
            ? "bg-slate-900 border border-slate-800 text-slate-100" 
            : "bg-white text-slate-900 border border-slate-200 shadow-xl"
        }`}
      >
        {/* MODAL HEADER - Compact Android-First & Desktop Sleek */}
        <div className={`p-2.5 sm:px-5 sm:py-2.5 flex items-center justify-between border-b shrink-0 gap-2 ${
          effectiveDark ? "bg-slate-900/95 border-slate-800" : "bg-slate-50/95 border-slate-200"
        }`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md text-white shrink-0">
              <Bot size={16} className="animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-xs sm:text-sm tracking-wide uppercase text-slate-950 dark:text-white truncate leading-tight">
                {t('roiAiModal.title', 'Analisis Kelayakan Finansial AI')}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-bold truncate leading-tight">
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
                effectiveDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200/80 text-slate-700 hover:text-slate-950"
              }`}
              aria-label={t('roiAiModal.closeLabel', 'Tutup form')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* METRICS PREVIEW BAR - Directly below Header with minimal gap */}
        <div className={`px-2.5 sm:px-5 py-1.5 sm:py-2 border-b grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 shrink-0 ${
          effectiveDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-100/80 border-slate-200"
        }`}>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 flex items-center gap-1.5 sm:gap-2 min-w-0 shadow-sm">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-blue-500/10 dark:bg-blue-400/15 flex items-center justify-center shrink-0">
              <DollarSign size={13} className="text-blue-700 dark:text-blue-400 font-bold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-slate-600 dark:text-slate-400 truncate">{t('roiAiModal.capexLabel', 'CAPEX')}</p>
              <p className="text-xs sm:text-sm font-extrabold font-sans tracking-tight text-slate-950 dark:text-white truncate leading-none" title={formatRupiah(capex)}>
                {formatRupiahSingkat(capex)}
              </p>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 flex items-center gap-1.5 sm:gap-2 min-w-0 shadow-sm">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${isNpvPositive ? "bg-emerald-500/15 dark:bg-emerald-400/15" : "bg-rose-500/15 dark:bg-rose-400/15"} flex items-center justify-center shrink-0`}>
              <TrendingUp size={13} className={isNpvPositive ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-rose-700 dark:text-rose-400 font-bold"} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-slate-600 dark:text-slate-400 truncate">NPV ({discountRate}%)</p>
              <p className={`text-xs sm:text-sm font-extrabold font-sans tracking-tight truncate leading-none ${isNpvPositive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`} title={formatRupiah(npv)}>
                {isNpvPositive ? "+" : ""}{formatRupiahSingkat(npv)}
              </p>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 flex items-center gap-1.5 sm:gap-2 min-w-0 shadow-sm">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${isIrrFeasible ? "bg-emerald-500/15 dark:bg-emerald-400/15" : "bg-amber-500/15 dark:bg-amber-400/15"} flex items-center justify-center shrink-0`}>
              <Calculator size={13} className={isIrrFeasible ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-amber-700 dark:text-amber-400 font-bold"} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-slate-600 dark:text-slate-400 truncate">{t('roiAiModal.irrProjected', 'Proyeksi IRR')}</p>
              <p className={`text-xs sm:text-sm font-black font-mono truncate leading-none ${isIrrFeasible ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                {(Number(irr) || 0).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 flex items-center gap-1.5 sm:gap-2 min-w-0 shadow-sm">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-indigo-500/15 dark:bg-indigo-400/15 flex items-center justify-center shrink-0">
              <RefreshCw size={12} className="text-indigo-700 dark:text-indigo-400 font-bold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-slate-600 dark:text-slate-400 truncate">Payback (BEP)</p>
              <p className="text-xs sm:text-sm font-black font-mono text-slate-950 dark:text-slate-100 truncate leading-none">
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
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200" 
                : isNpvPositive
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-200"
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1 rounded-md shrink-0 ${
                  isNpvPositive && isIrrFeasible 
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                    : isNpvPositive
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    : "bg-rose-500/20 text-rose-700 dark:text-rose-400"
                }`}>
                  {isNpvPositive && isIrrFeasible ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-wider truncate">
                    {isNpvPositive && isIrrFeasible 
                      ? "Status: Layak & Feasible Secara Finansial" 
                      : isNpvPositive
                      ? "Status: Zona Moderat / Layak Bersyarat"
                      : "Status: Perlu Penyesuaian Asumsi (NPV Negatif)"}
                  </div>
                  <div className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold truncate">
                    {isNpvPositive && isIrrFeasible 
                      ? `NPV Positif (${formatRupiahSingkat(npv)}) • IRR (${irr.toFixed(1)}%) ≥ WACC (${discountRate}%) • Evaluasi Otomatis AI`
                      : isNpvPositive
                      ? `NPV Positif (${formatRupiahSingkat(npv)}) • IRR (${irr.toFixed(1)}%) di bawah WACC (${discountRate}%) • Evaluasi Otomatis AI`
                      : `NPV Negatif (${formatRupiahSingkat(npv)}) • IRR (${irr.toFixed(1)}%) < WACC (${discountRate}%) • Evaluasi Otomatis AI`}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border ${
                isNpvPositive && isIrrFeasible
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                  : isNpvPositive
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
                  : "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300 dark:border-rose-500/30"
              }`}>
                {isNpvPositive && isIrrFeasible ? "Score: A" : isNpvPositive ? "Score: B" : "Score: D"}
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
                      effectiveDark 
                        ? "bg-slate-900/90 border-slate-700/60 text-slate-100 backdrop-blur-md" 
                        : "bg-white border-slate-200/90 text-slate-950 shadow-sm"
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 tracking-wider">
                            {t('roiAiModal.assistantHeader', 'Asisten AI Finansial')}
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">• Kab. Luwu</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" /> Terverifikasi
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none w-full space-y-1 overflow-y-auto ai-custom-scrollbar pr-1 leading-relaxed text-xs sm:text-sm text-slate-950 dark:text-slate-100">
                        {formatTextToJsx(msg.text)}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={index} className="flex gap-2 items-start max-w-[95%] sm:max-w-[85%] self-end justify-end ml-auto animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl rounded-tr-sm border text-right shadow-sm ${
                      effectiveDark 
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
          effectiveDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}>
          <ResponsiveChatInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSendMessage}
            isTyping={loading || sending}
            placeholder={t('roiAiModal.inputPlaceholder', 'Ajukan pertanyaan atau tanyakan potensi di wilayah Luwu...')}
            isDarkMode={effectiveDark}
            className="p-0 border-0 bg-transparent dark:bg-transparent"
          />
          <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-medium">
            <span className="truncate">{t('roiAiModal.disclaimer', 'Dianalisis menggunakan Gemini Enterprise AI Spasial Luwu')}</span>
            <span className="hidden sm:inline-block font-mono font-semibold">MPP Simpurusiang</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
