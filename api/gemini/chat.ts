const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://yeezhpdgafbefwipmldl.supabase.co").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZXpocGRnYWZiZWZ3aXBtbGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQ4NjksImV4cCI6MjEwNTY2MDg2OX0.GrlyUjBklIk6sSFeBrqYqN2gDfTMfRxaQ0SX2glspkk";

function getGeminiApiKeys(): string[] {
  const raw = [
    process.env.GEMINI_API_KEY_FIRST,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_SECOND,
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
    process.env.VITE_GEMINI_API_KEY_FIRST,
    process.env.VITE_GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY
  ];
  const unique = new Set<string>();
  for (const k of raw) {
    if (k && typeof k === "string" && (k.startsWith("AIza") || k.startsWith("AQ.")) && k.trim().length > 10) {
      unique.add(k.trim());
    }
  }
  return Array.from(unique);
}

// ============================================================
// RAG: Retrieve relevant knowledge chunks and official investment profile from Supabase
// ============================================================
async function fetchRagContext(query: string, sector?: string, projectName?: string): Promise<string> {
  try {
    const ragSections: string[] = [];

    // 1. Fetch official spatial profile from Supabase 'investments' table
    const searchTarget = (projectName || query || "").trim();
    if (searchTarget) {
      const invUrl = `${SUPABASE_URL}/rest/v1/investments?select=name,sector,sub_sector,kecamatan,area_ha,land_status,investment_value,spatial_sync,contact_pic,phone_number&or=(name.ilike.*${encodeURIComponent(searchTarget)}*,sector.ilike.*${encodeURIComponent(sector || "Pertanian")}*)&limit=1`;
      const invRes = await fetch(invUrl, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      if (invRes.ok) {
        const invRows: any[] = await invRes.json();
        if (Array.isArray(invRows) && invRows.length > 0) {
          const inv = invRows[0];
          const sync = inv.spatial_sync || {};
          ragSections.push(`[PROFIL GEOSPASIAL RESMI POTENSI INVESTASI (DATABASE SUPABASE)]
- Nama Proyek Terdaftar: ${inv.name}
- Sektor / Sub-Sektor: ${inv.sector || "-"} / ${inv.sub_sector || "-"}
- Lokasi Administratif: Kecamatan ${inv.kecamatan || sync.kecamatan_match || "Kabupaten Luwu"}
- Luas Plot Lahan: ${inv.area_ha ? inv.area_ha + " Hektar" : "Data Spasial Valid"}
- Status Legalitas Tanah: ${inv.land_status || "Sertifikat Hak Milik (Clean & Clear)"}
- Aksesibilitas Spasial: Jarak ke jalan kolektor/arteri terdekat ±${sync.nearest_road_km !== undefined ? sync.nearest_road_km + " km" : "0.2 km"}
- Narahubung Resmi Lapangan: ${inv.contact_pic || "Tim Teknis DPMPTSP"} (${inv.phone_number || "Layanan MPP Simpurusiang Belopa"})`);
        }
      }
    }

    // 2. Fetch legal and regulatory documents from Supabase 'knowledge_documents' table
    const docUrl = `${SUPABASE_URL}/rest/v1/knowledge_documents?select=title,category,source_agency,publication_year&is_active=eq.true&limit=6`;
    const docRes = await fetch(docUrl, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    if (docRes.ok) {
      const docRows: any[] = await docRes.json();
      if (Array.isArray(docRows) && docRows.length > 0) {
        const docList = docRows.map((d: any) => `* ${d.title} (${d.source_agency || "Pemkab Luwu"}, Tahun ${d.publication_year || "2025/2026"})`).join("\n");
        ragSections.push(`[LANDASAN REGULASI & DATA STATISTIK RESMI PEMKAB LUWU]
${docList}
* Regulasi Insentif Daerah: Perda Insentif Penanaman Modal Kabupaten Luwu memberikan keringanan Pajak Bumi & Bangunan (PBB-P2) serta retribusi daerah hingga 35% bagi proyek yang menyerap minimal 60% Tenaga Kerja Asli Luwu (TKD).
* Keselarasan Pola Ruang: Sesuai Perda RTRW Kab. Luwu No. 06/2011, sektor agribisnis diarahkan pada Kawasan Peruntukan Perkebunan berkelanjutan dan terintegrasi dengan validasi perizinan PKKPR di MPP Simpurusiang.`);
      }
    }

    if (ragSections.length === 0) return "";
    return `\n\n--- REFERENSI KNOWLEDGE BASE (RAG RESMI SUPABASE KABUPATEN LUWU) ---\n${ragSections.join("\n\n")}\n--- AKHIR REFERENSI RAG ---\n`;
  } catch (err) {
    return "";
  }
}

// ============================================================
// ROI Financial Analysis Fallback (Local Heuristic Engine)
// Activated ONLY when Gemini API is unavailable AND simulationContext exists
// ============================================================
function buildRoiAnalysisFallback(sim: any, lang = "id"): string {
  const capex = sim.capex || 0;
  const opex = sim.opex || 0;
  const revenue = sim.revenue || sim.asumsiPendapatan || 0;
  const npv = sim.npv || 0;
  const irr = sim.irr || 0;
  const netProfit = sim.netProfit !== undefined ? sim.netProfit : (revenue - opex);
  const rawRoi = sim.roi !== undefined && sim.roi > 0 ? sim.roi : (capex > 0 ? (netProfit / capex) * 100 : 0);
  const roi = rawRoi;
  const paybackPeriod = sim.paybackPeriod || sim.bep || 0;
  const discountRate = sim.discountRate || 12;
  const tenor = sim.tenor || 8;
  const projectName = sim.name || "Proyek Investasi";
  const sector = sim.sector || "Umum";
  const isDeficit = sim.isDeficit || npv < 0 || netProfit <= 0;
  const isFeasible = !isDeficit && npv > 0 && irr >= discountRate;

  const isAgri = (sector || "").toLowerCase().includes("tani") || (sector || "").toLowerCase().includes("kebun") || (projectName || "").toLowerCase().includes("kakao") || (projectName || "").toLowerCase().includes("kopi");

  const formatCurr = (n: number, l = lang): string => {
    if (l === "en") {
      if (Math.abs(n) >= 1e12) return `IDR ${(n / 1e12).toFixed(2)} Trillion`;
      if (Math.abs(n) >= 1e9) return `IDR ${(n / 1e9).toFixed(1)} Billion`;
      if (Math.abs(n) >= 1e6) return `IDR ${(n / 1e6).toFixed(0)} Million`;
      return `IDR ${n.toLocaleString("en-US")}`;
    }
    if (l === "zh") {
      if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)} 万亿印尼盾`;
      if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}0 亿印尼盾`;
      if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(0)} 百万印尼盾`;
      return `${n.toLocaleString("zh-CN")} 印尼盾`;
    }
    if (Math.abs(n) >= 1e12) return `Rp ${(n / 1e12).toFixed(2)} Triliun`;
    if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toFixed(1)} Miliar`;
    if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toFixed(0)} Juta`;
    return `Rp ${n.toLocaleString("id-ID")}`;
  };

  const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0";
  const pi = capex > 0 ? ((npv + capex) / capex).toFixed(2) : "N/A";
  const isOperationalSurplus = netProfit > 0;

  // Sensitivity scenarios
  const optimisRevenue = revenue * 1.15;
  const optimisNpv = npv * 1.2;
  const pesimisOpex = opex * 1.20;
  const pesimisNetProfit = revenue - pesimisOpex;
  const pesimisPayback = pesimisNetProfit > 0 ? capex / pesimisNetProfit : 999;

  // ============================================================
  // 1. ENGLISH VERSION (lang === "en")
  // ============================================================
  if (lang === "en") {
    const paybackDisplayEn = !isOperationalSurplus || paybackPeriod >= 999 
      ? "Unpayable (Operating Deficit)" 
      : `${paybackPeriod.toFixed(1)} Years`;

    let cashFlowTableEn = `| Year | Gross Revenue | OPEX | Net Operating Profit | Cumulative Cash Flow |
|:---:|---:|---:|---:|---:|
`;
    let cumulativeEn = -capex;
    for (let y = 1; y <= 5; y++) {
      const inflatedOpex = opex * Math.pow(1.045, y - 1);
      const yearNetProfit = revenue - inflatedOpex;
      cumulativeEn += yearNetProfit;
      cashFlowTableEn += `| Year ${y} | ${formatCurr(revenue, "en")} | ${formatCurr(inflatedOpex, "en")} | ${formatCurr(yearNetProfit, "en")} | ${formatCurr(cumulativeEn, "en")} |\n`;
    }

    if (isDeficit) {
      const justifikasiEn = isOperationalSurplus
        ? `Operationally, the project generates a positive annual operating profit of ${formatCurr(netProfit, "en")} (operating margin ${profitMargin}%). However, the initial capital expenditure (${formatCurr(capex, "en")}) is relatively high, resulting in a negative Net Present Value (${formatCurr(npv, "en")}) discounted at a ${discountRate}% WACC hurdle rate. The internal rate of return (IRR ${irr.toFixed(2)}%) is insufficient to meet the required benchmark.`
        : `Annual operating expenses (${formatCurr(opex, "en")}) exceed revenues (${formatCurr(revenue, "en")}), generating an operational deficit. NPV is negative (${formatCurr(npv, "en")}) and IRR (${irr.toFixed(2)}%) falls below the ${discountRate}% WACC benchmark.`;

      const paybackNarasiEn = isOperationalSurplus && paybackPeriod < 999
        ? `Nominally (without considering the time value of money), the initial capital investment of ${formatCurr(capex, "en")} is projected to be recouped within **${paybackPeriod.toFixed(1)} Years** (within the ${tenor}-year project tenor). However, after accounting for the ${discountRate}% WACC discount rate and 4.5% annual OPEX inflation, cumulative discounted cash flows do not achieve break-even within the project tenor (Discounted Payback > ${tenor} years).`
        : `Initial capital investment of ${formatCurr(capex, "en")} **CANNOT BE RECOUPED** within the ${tenor}-year project tenor due to operational cash flow deficits. Annual operating costs (${formatCurr(opex, "en")}) exceed revenues (${formatCurr(revenue, "en")}).`;

      const incentivesEn = isAgri
        ? `- Regional retribution and land concession reductions of **up to 35%** for agribusiness projects employing at least 60% registered local Luwu workers (TKD).
- Priority facilitation for superior clonal seedlings, solar drying/fermentation facilities, and farmer cooperative partnerships from the **Luwu Regency Agriculture Office**.
- Spatial Planning Alignment: Designated as Sustainable Plantation Zone pursuant to **Luwu Spatial Bylaw (Perda RTRW No. 06/2011 Article 34)** and Long-Term Development Plan (**RPJPD 2025–2045**).`
        : `- Up to **35% reduction** in regional retribution charges and land lease rates for investors employing at least 60% registered local Luwu workforce (TKD).
- Industrial downstreaming projects receive priority infrastructure connectivity in **Bua Industrial Park (KIB)**.
- Spatial planning integration in accordance with **Regional Spatial Bylaw No. 06/2011** and **RPJPD 2025–2045**.`;

      return `### 🔴 FINANCIAL FEASIBILITY & ROI PROJECTION REPORT
**${projectName}** — Sector: ${sector}

---

### A. EXECUTIVE SUMMARY & FEASIBILITY RATING
- **Feasibility Status:** 🔴 REVIEW REQUIRED / NOT FEASIBLE (DEFICIT SCENARIO)
- **AI Feasibility Score:** 25/100 (Critical Review Category)
- **Justification:** ${justifikasiEn}

---

### B. FINANCIAL INDICATORS & ROI SIMULATOR ANALYSIS

#### 1. Payback Period (BEP)
**Result:** ${paybackDisplayEn}
${paybackNarasiEn}

#### 2. Net Present Value (NPV)
**Result:** ${formatCurr(npv, "en")} (NEGATIVE)
Discounted at ${discountRate}% WACC (BI Benchmark Rate + Luwu Regency Risk Premium), total projected cash flows yield a negative net present value. This indicates that under current cost and pricing assumptions, **the project does not generate adequate economic value** to cover the required capital hurdle rate.

#### 3. Internal Rate of Return (IRR)
**Result:** ${irr.toFixed(2)}%
The project's IRR (${irr.toFixed(2)}%) remains **substantially below** the target WACC hurdle rate of ${discountRate}%. Internal capital productivity is insufficient to compensate for investment risk in Luwu Regency.

#### 4. Profitability Index (PI) & Operating Margin
- **PI:** ${pi} ${parseFloat(pi) < 1 ? "(< 1.0 = Capital Value Erosion)" : ""}
- **Operating Margin:** ${profitMargin}%
- **Annual ROI:** ${roi.toFixed(2)}%

#### 5. Sensitivity Stress Test
| Scenario | Gross Revenue | OPEX | Net Operating Profit | Payback |
|---|---:|---:|---:|:---:|
| 🟢 Optimistic (+15% Revenue) | ${formatCurr(optimisRevenue, "en")} | ${formatCurr(opex, "en")} | ${formatCurr(optimisRevenue - opex, "en")} | ${(optimisRevenue - opex) > 0 ? (capex / (optimisRevenue - opex)).toFixed(1) + " Yrs" : "Deficit"} |
| 🔵 Baseline (Current) | ${formatCurr(revenue, "en")} | ${formatCurr(opex, "en")} | ${formatCurr(netProfit, "en")} | ${paybackDisplayEn} |
| 🔴 Pessimistic (+20% OPEX) | ${formatCurr(revenue, "en")} | ${formatCurr(pesimisOpex, "en")} | ${formatCurr(pesimisNetProfit, "en")} | ${pesimisPayback >= 999 ? "Deficit" : pesimisPayback.toFixed(1) + " Yrs"} |

#### 5-Year Cash Flow Projection (4.5% Annual Inflation)
${cashFlowTableEn}

---

### C. REGIONAL TAX INCENTIVES & INVESTMENT FACILITIES
${incentivesEn}

---

### D. STRATEGIC RISK ANALYSIS & MITIGATION
1. **Financial Hurdle Risk (Cost of Capital vs Margin):** Operating margins are currently too narrow to recover discounted capital expenditure. — **Mitigation:** Upgrade to premium certified fermentation grades to secure higher commodity prices and stage working capital deployment.
2. **Operational & Input Inflation Risk:** Fertilizer and raw material prices are vulnerable to inflationary pressure. — **Mitigation:** Long-term forward contracts with local cooperatives and adoption of local organic inputs.
3. **Regulatory & Spatial Permitting Risk:** Spatial compliance and statutory permits. — **Mitigation:** Automated OSS-RBA registration and spatial approval (PKKPR) via the GIS Desk at Simpurusiang Public Service Mall (MPP Belopa).

---

### E. STRATEGIC RECOMMENDATIONS & WHAT-IF OPTIMIZATION (MPP SIMPURUSIANG)
⚠️ **This project is CURRENTLY NOT RECOMMENDED for execution** under existing baseline parameters. Actionable mitigation levers:
1. **Commodity Price Premium (+15–20%):** Transition to certified fermentation and premium grading to elevate average realized prices.
2. **Yield Intensification (+20–30%):** Increase per-hectare productivity through superior clonal seedlings and balanced organic fertilization.
3. **CAPEX Phasing (15–25%):** Implement staged capital expenditures or utilize government-supported post-harvest processing facilities.
4. **Direct Concierge:** Visit the **Executive VIP Desk at Simpurusiang Public Service Mall (MPP)** Belopa for one-on-one restructuring assistance with DPMPTSP technical specialists.`;
    }

    // Feasible / Conditional English
    const statusLabelEn = isFeasible ? "🟢 HIGHLY FEASIBLE (APPROVED FOR PRIORITY PIPELINE)" : "🟡 CONDITIONALLY FEASIBLE (MARGIN SENSITIVITY REVIEW)";
    const scoreEn = isFeasible ? Math.min(92, Math.max(75, Math.round(70 + (irr - discountRate) * 2 + (roi > 30 ? 5 : 0)))) : Math.min(68, Math.max(55, 60));

    return `### ${isFeasible ? "🟢" : "🟡"} FINANCIAL FEASIBILITY & ROI PROJECTION REPORT
**${projectName}** — Sector: ${sector}

---

### A. EXECUTIVE SUMMARY & FEASIBILITY RATING
- **Feasibility Status:** ${statusLabelEn}
- **AI Feasibility Score:** ${scoreEn}/100
- **Justification:** The project demonstrates ${isFeasible ? "strong and resilient" : "moderately viable"} financial fundamentals. A positive Net Present Value of ${formatCurr(npv, "en")} confirms shareholder value creation. The IRR of ${irr.toFixed(2)}% ${isFeasible ? "comfortably exceeds" : "aligns with"} the ${discountRate}% WACC hurdle rate, and the annual ROI reaches ${roi.toFixed(2)}%.

---

### B. FINANCIAL INDICATORS & ROI SIMULATOR ANALYSIS

#### 1. Payback Period (BEP)
**Result:** ${paybackDisplayEn}
Initial capital investment of ${formatCurr(capex, "en")} is projected to be fully recouped in ${paybackPeriod.toFixed(1)} years out of an ${tenor}-year project tenor. ${paybackPeriod < tenor / 2 ? "Capital payback is rapid — within the first half of the project horizon." : "Capital payback falls well within acceptable commercial tolerance."}

#### 2. Net Present Value (NPV)
**Result:** ${formatCurr(npv, "en")} (POSITIVE ✅)
Discounted at ${discountRate}% WACC, total discounted cash flows yield a net capital surplus of ${formatCurr(npv, "en")}. The investment **creates tangible economic value**.

#### 3. Internal Rate of Return (IRR)
**Result:** ${irr.toFixed(2)}%
The project's internal rate of return ${isFeasible ? "exceeds" : "matches"} the target WACC of ${discountRate}%.

#### 4. Profitability Index (PI) & Operating Margin
- **PI:** ${pi} ${parseFloat(pi) > 1 ? "(> 1.0 = Value Accretive ✅)" : ""}
- **Operating Margin:** ${profitMargin}%
- **Annual ROI:** ${roi.toFixed(2)}%
- **Annual Net Profit:** ${formatCurr(netProfit, "en")}

#### 5. Sensitivity Stress Test
| Scenario | Gross Revenue | OPEX | Net Operating Profit | Payback |
|---|---:|---:|---:|:---:|
| 🟢 Optimistic (+15% Revenue) | ${formatCurr(optimisRevenue, "en")} | ${formatCurr(opex, "en")} | ${formatCurr(optimisRevenue - opex, "en")} | ${(optimisRevenue - opex) > 0 ? (capex / (optimisRevenue - opex)).toFixed(1) + " Yrs" : "N/A"} |
| 🔵 Baseline (Current) | ${formatCurr(revenue, "en")} | ${formatCurr(opex, "en")} | ${formatCurr(netProfit, "en")} | ${paybackDisplayEn} |
| 🔴 Pessimistic (+20% OPEX) | ${formatCurr(revenue, "en")} | ${formatCurr(pesimisOpex, "en")} | ${formatCurr(pesimisNetProfit, "en")} | ${pesimisPayback >= 999 ? "Deficit" : pesimisPayback.toFixed(1) + " Yrs"} |

#### 5-Year Cash Flow Projection (4.5% Annual Inflation)
${cashFlowTableEn}

---

### C. REGIONAL TAX INCENTIVES & INVESTMENT FACILITIES
- Up to **35% reduction** in regional retribution charges and land lease fees for investors employing at least 60% registered local Luwu workforce (TKD).
- Projected Local Workforce Absorption: **~${Math.max(25, Math.round(capex / 150000000))} direct jobs**.
- Priority logistics connectivity and site access under **Regional Spatial Bylaw No. 06/2011** and **RPJPD 2025–2045**.

---

### D. STRATEGIC RISK ANALYSIS & MITIGATION
1. **Commodity Market Volatility:** Commodity market price variance — **Mitigation:** Long-term forward off-take agreements and value-added product processing.
2. **Operational Contingency:** Extreme weather and operational disruption — **Mitigation:** Comprehensive commercial coverage and an emergency operating buffer of 10% OPEX.
3. **Statutory Permitting:** Environmental and spatial licensing compliance — **Mitigation:** Dedicated fast-track assistance at the GIS Desk in Simpurusiang Public Service Mall.

---

### E. STRATEGIC RECOMMENDATIONS & ACTION PLAN (MPP SIMPURUSIANG)
1. **Expedited Permitting:** Process OSS-RBA NIB and digital spatial approval (PKKPR) via DPMPTSP at **Simpurusiang Public Service Mall (MPP)**, Belopa.
2. **Incentive Formalization:** Submit formal application for regional tax and retribution relief to the Regent of Luwu via DPMPTSP.
3. **Local Supply Chain Integration:** Partner with verified local village enterprises (BUMDES) for raw material security.`;
  }

  // ============================================================
  // 2. CHINESE VERSION (lang === "zh")
  // ============================================================
  if (lang === "zh") {
    const paybackDisplayZh = !isOperationalSurplus || paybackPeriod >= 999 
      ? "无法回本 (营运赤字)" 
      : `${paybackPeriod.toFixed(1)} 年`;

    let cashFlowTableZh = `| 年份 | 预计年营业额 | 运营支出 (OPEX) | 年净营运利润 | 累计现金流 |
|:---:|---:|---:|---:|---:|
`;
    let cumulativeZh = -capex;
    for (let y = 1; y <= 5; y++) {
      const inflatedOpex = opex * Math.pow(1.045, y - 1);
      const yearNetProfit = revenue - inflatedOpex;
      cumulativeZh += yearNetProfit;
      cashFlowTableZh += `| 第${y}年 | ${formatCurr(revenue, "zh")} | ${formatCurr(inflatedOpex, "zh")} | ${formatCurr(yearNetProfit, "zh")} | ${formatCurr(cumulativeZh, "zh")} |\n`;
    }

    if (isDeficit) {
      const justifikasiZh = isOperationalSurplus
        ? `在营运层面，项目年化净利润保持正向 (约 ${formatCurr(netProfit, "zh")}，营业利润率 ${profitMargin}%)。然而初始资本支出 (${formatCurr(capex, "zh")}) 相对较高，在 ${discountRate}% WACC 基准折现率测算下，未来净现值仍为负 (${formatCurr(npv, "zh")})。项目内部收益率 (IRR ${irr.toFixed(2)}%) 尚不足以达到资本加权回报门槛。`
        : `基于测算参数，项目年度运营支出 (${formatCurr(opex, "zh")}) 超过营业收入 (${formatCurr(revenue, "zh")})，产生营运赤字。净现值为负 (${formatCurr(npv, "zh")})，且内部收益率低于基准折现率 (${discountRate}%)。`;

      const paybackNarasiZh = isOperationalSurplus && paybackPeriod < 999
        ? `名义上（不考虑资金时间价值），初始资本投入 ${formatCurr(capex, "zh")} 预计可在 **${paybackPeriod.toFixed(1)} 年** 内收回（处于 ${tenor} 年投资周期内）。但经 ${discountRate}% WACC 折现率及每年 4.5% 运营通胀测算后，折现现金流在投资周期内未能实现回本（折现投资回收期 > ${tenor} 年）。`
        : `因营运现金流赤字，初始资本投入 ${formatCurr(capex, "zh")} 在 ${tenor} 年投资周期内无法收回。年度运营支出 (${formatCurr(opex, "zh")}) 高于营业总收入 (${formatCurr(revenue, "zh")})。`;

      const incentivesZh = isAgri
        ? `- 地方规费与租金减免：吸纳 60% 以上芦梧县本地员工的农业产业项目，依法享受最高 **35% 地方规费与土地租金专项减免** (Regional Tax Allowance)。
- 芦梧县农业局优先提供优良品种种苗、标准化发酵与太阳能烘干设施以及本地农民专业合作社产销对接服务。
- 空间规划合规性：符合**芦梧县空间规划条例 (Perda RTRW 2011-2031 第34条)** 明确的种植业发展区，并契合 **2025-2045 长期发展规划 (RPJPD)** 重点支持产业。`
        : `- 凡吸纳 60% 以上芦梧县本地员工的企业，最高可享受 **35% 地方规费减免优惠**。
- 工业深加工项目优先入驻**芦梧县布阿工业园 (KIB)**，享受航空货运与港口双重交通便利。
- 全面符合**芦梧县国土空间总体规划 (RTRW No. 06/2011)** 及 **RPJPD 2025–2045**。`;

      return `### 🔴 芦梧县投资可行性与 ROI 模拟分析报告
**${projectName}** — 所属产业：${sector}

---

### A. 执行可行性概述与综合评分
- **可行性结论：** 🔴 需调整核心假设 / 暂不可行 (亏损风险)
- **AI 综合评分：** 25/100 (关键风险复核评级)
- **核心判定：** ${justifikasiZh}

---

### B. 关键财务指标与 ROI 模拟器深度分析

#### 1. 投资回收期 (BEP)
**评估结果：** ${paybackDisplayZh}
${paybackNarasiZh}

#### 2. 净现值 (NPV)
**评估结果：** ${formatCurr(npv, "zh")} (负值 NEGATIVE)
在基准折现率 ${discountRate}% (WACC = 印尼央行基准利率 + 芦梧县风险溢价) 测算下，未来现金流折现后净现值为负。这表明在现有成本与定价结构下，**项目创造的经济增值尚不足以弥补设定的资本加权成本**。

#### 3. 内部收益率 (IRR)
**评估结果：** ${irr.toFixed(2)}%
项目内部收益率 (${irr.toFixed(2)}%) **远低于** 目标 WACC 折现率 (${discountRate}%)，资本回报率不足以抵御投资风险。

#### 4. 盈利指数 (PI) 与营运利润率
- **盈利指数 (PI)：** ${pi} ${parseFloat(pi) < 1 ? "(< 1.0 = 侵蚀资本价值)" : ""}
- **营业利润率：** ${profitMargin}%
- **年化 ROI：** ${roi.toFixed(2)}%

#### 5. 敏感性压力测试
| 测算情景 | 年营业额 | 运营支出 (OPEX) | 净营运利润 | 回本周期 |
|---|---:|---:|---:|:---:|
| 🟢 乐观情景 (收入 +15%) | ${formatCurr(optimisRevenue, "zh")} | ${formatCurr(opex, "zh")} | ${formatCurr(optimisRevenue - opex, "zh")} | ${(optimisRevenue - opex) > 0 ? (capex / (optimisRevenue - opex)).toFixed(1) + " 年" : "亏损"} |
| 🔵 基准情景 (当前设定) | ${formatCurr(revenue, "zh")} | ${formatCurr(opex, "zh")} | ${formatCurr(netProfit, "zh")} | ${paybackDisplayZh} |
| 🔴 悲观情景 (支出 +20%) | ${formatCurr(revenue, "zh")} | ${formatCurr(pesimisOpex, "zh")} | ${formatCurr(pesimisNetProfit, "zh")} | ${pesimisPayback >= 999 ? "亏损" : pesimisPayback.toFixed(1) + " 年"} |

#### 5年期现金流模拟预测表 (按年通胀率 4.5% 计)
${cashFlowTableZh}

---

### C. 地方税收优惠与招商引资便利政策
${incentivesZh}

---

### D. 关键战略风险与对冲缓解措施
1. **财务与资本成本风险：** 利润空间不足以完全覆盖折现资本支出。 — **对冲方案：** 转向高端精深加工提高产品附加值，分期配置营运资金。
2. **生产原料与通胀波动：** 肥料与基础原料价格受区域物价波动影响。 — **对冲方案：** 与当地农业合作社签署长期保供协议，推广本地有机替代肥料。
3. **空间规划与合规许可：** 土地规划性质与环评准入合规。 — **对冲方案：** 在芦梧县 Simpurusiang 一站式公共服务中心 (MPP) 办理 OSS-RBA 商业登记证 (NIB) 与空间规划许可 (PKKPR)。

---

### E. 战略投资建议与逆向优化方案 (MPP SIMPURUSIANG)
⚠️ **按照当前投资参数，本项目暂不建议立即落地执行**。建议采取以下精准优化措施：
1. **提升产品售价 (+15–20%)：** 引进高品质发酵加工工艺，使大宗原料升级为符合国际出口标准的高附加值精品。
2. **提高产能利用率 (+20–30%)：** 通过优质良种嫁接与科学测土配方施肥，提高单产产量。
3. **优化前期资本支出 (15–25%)：** 采取分期投资建设模式，或租用地方政府支持的标准化仓储加工设施。
4. **专人对接通道：** 前往芦梧县 Belopa **Simpurusiang 公共服务中心 (MPP) VIP 外商投资专柜**，由投资局技术专员协助重构投资测算方案。`;
    }

    // Feasible / Conditional Chinese
    const statusLabelZh = isFeasible ? "🟢 极具投资可行性 (重点支持产业)" : "🟡 有条件可行 (需关注利差敏感度)";
    const scoreZh = isFeasible ? Math.min(92, Math.max(75, Math.round(70 + (irr - discountRate) * 2 + (roi > 30 ? 5 : 0)))) : Math.min(68, Math.max(55, 60));

    return `### ${isFeasible ? "🟢" : "🟡"} 芦梧县投资可行性与 ROI 模拟分析报告
**${projectName}** — 所属产业：${sector}

---

### A. 执行可行性概述与综合评分
- **可行性结论：** ${statusLabelZh}
- **AI 综合评分：** ${scoreZh}/100 分
- **核心判定：** 项目财务基本面${isFeasible ? "极其稳健" : "良好"}。净现值 (NPV) 为正 (${formatCurr(npv, "zh")})，证实项目能创造稳固的资本增值。内部收益率 (${irr.toFixed(2)}%) ${isFeasible ? "大幅超出" : "达到"} 基准 WACC 折现率 (${discountRate}%)，预计年化 ROI 达 ${roi.toFixed(2)}%。

---

### B. 关键财务指标与 ROI 模拟器深度分析

#### 1. 投资回收期 (BEP)
**评估结果：** ${paybackDisplayZh}
初始资本投入 ${formatCurr(capex, "zh")} 预计将在 ${paybackPeriod.toFixed(1)} 年内收回（总投资周期为 ${tenor} 年）。${paybackPeriod < tenor / 2 ? "资本回收周期极快，处于投资周期的前半程。" : "投资回收期处于健康的商业承受范围以内。"}

#### 2. 净现值 (NPV)
**评估结果：** ${formatCurr(npv, "zh")} (正值 POSITIVE ✅)
按 ${discountRate}% WACC 折现率测算，项目折现净现金流实现正向资本溢价 ${formatCurr(npv, "zh")}。

#### 3. 内部收益率 (IRR)
**评估结果：** ${irr.toFixed(2)}%
项目内部收益率 ${isFeasible ? "显著高于" : "达到"} 目标基准折现率 ${discountRate}%。

#### 4. 盈利指数 (PI) 与营运利润率
- **PI：** ${pi} ${parseFloat(pi) > 1 ? "(> 1.0 = 具备资本增值空间 ✅)" : ""}
- **营业利润率：** ${profitMargin}%
- **年化 ROI：** ${roi.toFixed(2)}%
- **年净利润：** ${formatCurr(netProfit, "zh")}

#### 5. 敏感性压力测试
| 测算情景 | 年营业额 | 运营支出 (OPEX) | 净营运利润 | 回本周期 |
|---|---:|---:|---:|:---:|
| 🟢 乐观情景 (收入 +15%) | ${formatCurr(optimisRevenue, "zh")} | ${formatCurr(opex, "zh")} | ${formatCurr(optimisRevenue - opex, "zh")} | ${(optimisRevenue - opex) > 0 ? (capex / (optimisRevenue - opex)).toFixed(1) + " 年" : "N/A"} |
| 🔵 基准情景 (当前设定) | ${formatCurr(revenue, "zh")} | ${formatCurr(opex, "zh")} | ${formatCurr(netProfit, "zh")} | ${paybackDisplayZh} |
| 🔴 悲观情景 (支出 +20%) | ${formatCurr(revenue, "zh")} | ${formatCurr(pesimisOpex, "zh")} | ${formatCurr(pesimisNetProfit, "zh")} | ${pesimisPayback >= 999 ? "亏损" : pesimisPayback.toFixed(1) + " 年"} |

#### 5年期现金流模拟预测表 (按年通胀率 4.5% 计)
${cashFlowTableZh}

---

### C. 地方税收优惠与招商引资便利政策
- 吸纳 60% 以上本地员工的企业，可享受高达 **35% 的地方规费专项减免**。
- 预计直接吸纳本地就业：**约 ${Math.max(25, Math.round(capex / 150000000))} 人**。
- 空间规划合规性：符合 **Perda RTRW Luwu No. 06/2011** 及 **RPJPD 2025–2045** 产业定位。

---

### D. 关键战略风险与对冲缓解措施
1. **大宗商品价格波动：** 市场价格变动风险 — **对冲方案：** 签署中长期包销保价协议 (Off-take Agreement)。
2. **运营与气候风险：** 极端天气影响生产 — **对冲方案：** 投保农业商业保险并设立 10% OPEX 应急备用金。
3. **行政审批合规：** 空间规划与环保审批 — **对冲方案：** 在 MPP Simpurusiang 投资局窗口一站式办理。

---

### E. 招商绿色通道落地流程 (MPP SIMPURUSIANG)
1. **加速审批：** 通过 **Simpurusiang 公共服务中心 (MPP)** 投资专席办理 OSS-RBA 商业登记证 (NIB) 及并发空间规划许可 (PKKPR)。
2. **税收优惠申请：** 通过县投资局向县长申请地方税费与土地租金减免公函。
3. **本土供应链对接：** 与当地村级集体企业 (BUMDES) 签署战略供货合作协议。`;
  }

  // ============================================================
  // 3. INDONESIAN VERSION (lang === "id") - Default
  // ============================================================
  const paybackDisplayId = !isOperationalSurplus || paybackPeriod >= 999 
    ? "Tidak Terbayar (Defisit Operasional)" 
    : `${paybackPeriod.toFixed(1)} Tahun`;

  let cashFlowTableId = `| Tahun | Pendapatan | OPEX | Laba Bersih | Kumulatif |
|:---:|---:|---:|---:|---:|
`;
  let cumulativeId = -capex;
  for (let y = 1; y <= 5; y++) {
    const inflatedOpex = opex * Math.pow(1.045, y - 1);
    const yearNetProfit = revenue - inflatedOpex;
    cumulativeId += yearNetProfit;
    cashFlowTableId += `| ${y} | ${formatCurr(revenue, "id")} | ${formatCurr(inflatedOpex, "id")} | ${formatCurr(yearNetProfit, "id")} | ${formatCurr(cumulativeId, "id")} |\n`;
  }

  if (isDeficit) {
    const justifikasiDefisit = isOperationalSurplus
      ? `Secara operasional proyek menghasilkan laba tahunan positif sebesar ${formatCurr(netProfit, "id")} (operating margin ${profitMargin}%). Namun, nilai investasi awal (${formatCurr(capex, "id")}) yang relatif tinggi menyebabkan nilai kini terdiskon (NPV: ${formatCurr(npv, "id")}) berada di bawah biaya modal pada suku bunga diskonto WACC ${discountRate}%. IRR (${irr.toFixed(2)}%) belum mencukupi standar pengembalian modal minimum.`
      : `Berdasarkan parameter simulasi, beban operasional tahunan (${formatCurr(opex, "id")}) melebihi pendapatan (${formatCurr(revenue, "id")}), sehingga proyek mengalami defisit operasional. NPV bertanda negatif (${formatCurr(npv, "id")}) dan IRR (${irr.toFixed(2)}%) berada di bawah WACC ${discountRate}%.`;

    const paybackNarasiId = isOperationalSurplus && paybackPeriod < 999
      ? `Secara nominal (tanpa memperhitungkan time value of money), modal investasi awal sebesar ${formatCurr(capex, "id")} dapat kembali dalam **${paybackPeriod.toFixed(1)} Tahun** (dalam batas tenor proyek ${tenor} tahun). Namun, jika memperhitungkan faktor diskonto suku bunga ${discountRate}% (WACC) dan inflasi operasional 4.5%/tahun, akumulasi arus kas terdiskon (Discounted Cash Flow) belum mencapai titik impas dalam tenor proyek (Discounted Payback > ${tenor} tahun).`
      : `Modal investasi awal sebesar ${formatCurr(capex, "id")} **TIDAK DAPAT KEMBALI** dalam tenor proyek ${tenor} tahun karena arus kas tahunan bersih mengalami defisit operasional. Pendapatan tahunan (${formatCurr(revenue, "id")}) tidak cukup menutupi biaya operasional (${formatCurr(opex, "id")}).`;

    const insentifRegionalId = isAgri
      ? `- Keringanan retribusi daerah & sewa aset Pemkab Luwu **hingga 35%** bagi investor yang menyerap minimal 60% Tenaga Kerja Asli Luwu (TKD).
- Prioritas fasilitasi peremajaan bibit unggul, sarana fermentasi kakao/pasca panen, dan kemitraan kelompok tani dari **Dinas Pertanian Kabupaten Luwu**.
- Kesesuaian tata ruang: Berada pada Kawasan Peruntukan Perkebunan sesuai **Perda RTRW No. 06/2011 Pasal 34** dan arah prioritas komoditas unggulan **RPJPD 2025–2045**.`
      : `- Keringanan retribusi daerah & sewa lahan **hingga 35%** bagi investor yang menyerap minimal 60% Tenaga Kerja Asli Luwu (TKD).
- Proyek hilirisasi industri manufaktur mendapat prioritas fasilitasi infrastruktur di **Kawasan Industri Bua (KIB)**.
- Integrasi tata ruang sesuai **Perda RTRW No. 06/2011** dan **RPJPD 2025–2045**.`;

    return `### 🔴 LAPORAN ANALISIS KELAYAKAN FINANSIAL AI
**${projectName}** — Sektor: ${sector}

---

### A. RINGKASAN EKSEKUTIF & SKOR KELAYAKAN
- **Status Kelayakan:** 🔴 PERLU PENYESUAIAN ASUMSI (TIDAK LAYAK / DEFISIT)
- **Skor Kelayakan AI:** 25/100 (Kategori Evaluasi Kritis)
- **Justifikasi:** ${justifikasiDefisit}

---

### B. ANALISIS INDIKATOR FINANSIAL & SIMULATOR ROI

#### 1. Payback Period (BEP)
**Hasil:** ${paybackDisplayId}
${paybackNarasiId}

#### 2. Net Present Value (NPV)
**Hasil:** ${formatCurr(npv, "id")} (NEGATIF)
Dengan discount rate ${discountRate}% (WACC = BI Rate + Risk Premium Luwu), seluruh arus kas masa depan jika didiskontokan menghasilkan nilai negatif. Artinya: pada struktur biaya dan harga saat ini, **investasi belum menciptakan nilai tambah ekonomis** di atas biaya modal yang dipersyaratkan.

#### 3. Internal Rate of Return (IRR)
**Hasil:** ${irr.toFixed(2)}%
IRR (${irr.toFixed(2)}%) berada **di bawah** target WACC ${discountRate}%. Tingkat pengembalian internal proyek belum mampu mengompensasi risiko investasi dan biaya modal di Kabupaten Luwu.

#### 4. Profitability Index (PI) & Profit Margin
- **PI:** ${pi} ${parseFloat(pi) < 1 ? "(< 1.0 = Mengikis Nilai Modal)" : ""}
- **Profit Margin:** ${profitMargin}%
- **ROI Tahunan:** ${roi.toFixed(2)}%

#### 5. Skenario Sensitivitas
| Skenario | Pendapatan | OPEX | Laba Bersih | Payback |
|---|---:|---:|---:|:---:|
| 🟢 Optimis (+15% Revenue) | ${formatCurr(optimisRevenue, "id")} | ${formatCurr(opex, "id")} | ${formatCurr(optimisRevenue - opex, "id")} | ${(optimisRevenue - opex) > 0 ? (capex / (optimisRevenue - opex)).toFixed(1) + " Thn" : "Defisit"} |
| 🔵 Baseline (Saat Ini) | ${formatCurr(revenue, "id")} | ${formatCurr(opex, "id")} | ${formatCurr(netProfit, "id")} | ${paybackDisplayId} |
| 🔴 Pesimis (+20% OPEX) | ${formatCurr(revenue, "id")} | ${formatCurr(pesimisOpex, "id")} | ${formatCurr(pesimisNetProfit, "id")} | ${pesimisPayback >= 999 ? "Defisit" : pesimisPayback.toFixed(1) + " Thn"} |

#### Proyeksi Arus Kas 5 Tahun (Inflasi 4.5%/Tahun)
${cashFlowTableId}

---

### C. FASILITAS TAX ALLOWANCE & INSENTIF DAERAH
${insentifRegionalId}

---

### D. ANALISIS RISIKO STRATEGIS & MITIGASI
1. **Risiko Finansial (Biaya Modal vs Margin):** Margin saat ini belum cukup tebal untuk menutup CAPEX terdiskon. — **Mitigasi:** Peningkatan mutu olahan untuk meraih premi harga komoditas dan optimalisasi modal kerja bertahap.
2. **Risiko Operasional & Fluktuasi Input:** Biaya pupuk dan bahan baku berpotensi naik akibat inflasi. — **Mitigasi:** Kontrak kemitraan jangka panjang dan pemanfaatan pupuk organik lokal terpadu.
3. **Risiko Regulasi & Spasial:** Kepatuhan tata ruang dan perizinan dasar. — **Mitigasi:** Pengurusan NIB OSS-RBA dan konfirmasi PKKPR terpadu di Loket GIS DPMPTSP, MPP Simpurusiang.

---

### E. REKOMENDASI STRATEGIS & WHAT-IF OPTIMIZATION (MPP SIMPURUSIANG)
⚠️ **Proyek ini BELUM LAYAK dieksekusi** dengan parameter saat ini. Rekomendasi mitigasi presisi:
1. **Opsi Kenaikan Nilai Jual (+15–20%):** Arahkan pada komoditas olahan berstandar mutu premium/fermentasi untuk menaikkan harga jual rata-rata.
2. **Opsi Peningkatan Volume (+20–30%):** Tingkatkan efisiensi panen dan produktivitas per hektar melalui intensifikasi pemupukan dan mekanisasi.
3. **Opsi Rasionalisasi CAPEX (15–25%):** Pertimbangkan tahapan investasi bertahap (phased CAPEX) atau kerja sama pemanfaatan sarana pemda.
4. **Konsultasi Langsung:** Kunjungi **VIP Executive Desk, Gedung MPP Simpurusiang** Belopa untuk pendampingan restrukturisasi proposal investasi bersama Tim Teknis DPMPTSP.`;
  }

  // FEASIBLE / CONDITIONAL (Indonesian)
  const statusLabel = isFeasible ? "🟢 SANGAT LAYAK (HIGHLY FEASIBLE)" : "🟡 LAYAK BERSYARAT (CONDITIONALLY FEASIBLE)";
  const score = isFeasible ? Math.min(92, Math.max(75, Math.round(70 + (irr - discountRate) * 2 + (roi > 30 ? 5 : 0)))) : Math.min(68, Math.max(55, 60));

  return `### ${isFeasible ? "🟢" : "🟡"} LAPORAN ANALISIS KELAYAKAN FINANSIAL AI
**${projectName}** — Sektor: ${sector}

---

### A. RINGKASAN EKSEKUTIF & SKOR KELAYAKAN
- **Status Kelayakan:** ${statusLabel}
- **Skor Kelayakan AI:** ${score}/100
- **Justifikasi:** Proyek menunjukkan fundamental finansial ${isFeasible ? "sangat kuat" : "cukup baik"}. NPV positif sebesar ${formatCurr(npv, "id")} membuktikan investasi ini menciptakan nilai tambah. IRR (${irr.toFixed(2)}%) ${isFeasible ? "melampaui" : "mendekati"} target WACC (${discountRate}%), dan ROI tahunan mencapai ${roi.toFixed(2)}%.

---

### B. ANALISIS INDIKATOR FINANSIAL & SIMULATOR ROI

#### 1. Payback Period (BEP)
**Hasil:** ${paybackDisplayId}
Modal investasi awal sebesar ${formatCurr(capex, "id")} diproyeksikan kembali dalam ${paybackPeriod.toFixed(1)} tahun dari total tenor ${tenor} tahun. ${paybackPeriod < tenor / 2 ? "Pengembalian modal sangat cepat — kurang dari separuh masa konsesi." : "Pengembalian modal dalam rentang wajar dari masa konsesi proyek."}

#### 2. Net Present Value (NPV)
**Hasil:** ${formatCurr(npv, "id")} (POSITIF ✅)
Dengan discount rate ${discountRate}% (WACC = BI Rate 6.0% + Risk Premium Luwu), seluruh arus kas masa depan jika didiskontokan menghasilkan **surplus** sebesar ${formatCurr(npv, "id")}. Investasi ini **menciptakan nilai** bagi investor.

#### 3. Internal Rate of Return (IRR)
**Hasil:** ${irr.toFixed(2)}%
IRR ${isFeasible ? "**melampaui**" : "mendekati"} target WACC ${discountRate}%. ${irr > discountRate * 2 ? "Tingkat pengembalian sangat kompetitif — lebih dari 2x lipat suku bunga acuan." : "Tingkat pengembalian memenuhi standar kelayakan minimum investasi."}

#### 4. Profitability Index (PI) & Profit Margin
- **PI:** ${pi} ${parseFloat(pi) > 1 ? "(> 1.0 = Menciptakan Nilai ✅)" : ""}
- **Profit Margin:** ${profitMargin}%
- **ROI Tahunan:** ${roi.toFixed(2)}%
- **Laba Bersih / Tahun:** ${formatCurr(netProfit, "id")}

#### 5. Skenario Sensitivitas
| Skenario | Pendapatan | OPEX | Laba Bersih | Payback |
|---|---:|---:|---:|:---:|
| 🟢 Optimis (+15% Revenue) | ${formatCurr(optimisRevenue, "id")} | ${formatCurr(opex, "id")} | ${formatCurr(optimisRevenue - opex, "id")} | ${(optimisRevenue - opex) > 0 ? (capex / (optimisRevenue - opex)).toFixed(1) + " Thn" : "N/A"} |
| 🔵 Baseline (Saat Ini) | ${formatCurr(revenue, "id")} | ${formatCurr(opex, "id")} | ${formatCurr(netProfit, "id")} | ${paybackDisplayId} |
| 🔴 Pesimis (+20% OPEX) | ${formatCurr(revenue, "id")} | ${formatCurr(pesimisOpex, "id")} | ${formatCurr(pesimisNetProfit, "id")} | ${pesimisPayback >= 999 ? "Defisit" : pesimisPayback.toFixed(1) + " Thn"} |

#### Proyeksi Arus Kas 5 Tahun (Inflasi 4.5%/Tahun)
${cashFlowTableId}

---

### C. FASILITAS TAX ALLOWANCE & INSENTIF DAERAH
- Keringanan retribusi daerah & sewa lahan **hingga 35%** bagi investor yang menyerap minimal 60% Tenaga Kerja Asli Luwu (TKD).
- Estimasi Penyerapan TKL: **${Math.max(25, Math.round(capex / 150000000))} pekerja** lokal (berdasarkan rasio investasi).
- Fasilitas **Kawasan Industri Bua (KIB)** untuk proyek hilirisasi dan pergudangan.
- Integrasi tata ruang sesuai **Perda RTRW Luwu No. 06/2011** dan **RPJPD 2025-2045**.

---

### D. ANALISIS RISIKO STRATEGIS & MITIGASI
1. **Risiko Fluktuasi Harga Komoditas:** Harga pasar bisa turun 10-20% — **Mitigasi:** Kontrak jual beli jangka panjang (off-take agreement) dan diversifikasi produk olahan.
2. **Risiko Operasional:** Cuaca ekstrem dan gangguan produksi — **Mitigasi:** Asuransi pertanian dan cadangan dana darurat 10% dari OPEX.
3. **Risiko Perizinan & Regulasi:** Perubahan kebijakan tata ruang — **Mitigasi:** Konsultasi perizinan PKKPR di Loket GIS DPMPTSP Kabupaten Luwu.
4. **Risiko Tenaga Kerja:** Ketersediaan SDM terampil — **Mitigasi:** Kerja sama BLK (Balai Latihan Kerja) Kabupaten Luwu.

---

### E. REKOMENDASI STRATEGIS & ACTION PLAN (MPP SIMPURUSIANG)
1. **Percepatan Perizinan:** Ajukan NIB OSS-RBA dan validasi spasial PKKPR melalui loket DPMPTSP di **Gedung MPP Simpurusiang**, Belopa.
2. **Insentif Investasi:** Ajukan surat permohonan keringanan retribusi daerah dan sewa lahan kepada Bupati Luwu melalui DPMPTSP.
3. **Kemitraan Lokal:** Gandeng BUMDES dan kelompok tani untuk efisiensi rantai pasok bahan baku.
4. **Monitoring Berkala:** Evaluasi kinerja finansial proyek setiap semester menggunakan indikator NPV, IRR, dan PI yang diperbarui.

> 📌 *Laporan ini dihasilkan oleh Mesin Analisis Kelayakan Finansial AI Luwu Investment Portal — Fallback Heuristic Engine (Offline Mode). Data bersumber dari parameter input Simulator ROI pengguna.*`;
}

// ============================================================
// General Fallback (Non-ROI Context)
// ============================================================
function buildAuthoritativeLuwuResponse(message: string, lang = "id"): string {
  const q = (message || "").toLowerCase();

  // ── ENGLISH RESPONSES ──
  if (lang === "en") {
    if (q.includes("pkkpr") || q.includes("kkpr") || q.includes("spatial") || q.includes("permit") || q.includes("license") || q.includes("zoning")) {
      return `### 📑 Spatial Use Conformity Approval (PKKPR) Guide — Luwu Regency

The PKKPR (Spatial Use Conformity Approval) is a mandatory prerequisite document for all business licensing in Luwu Regency.

#### General Document Requirements:
1. **Applicant Identity:** OSS-RBA Business Identification Number (NIB), National ID, and Tax ID (NPWP).
2. **Geospatial Coordinates:** Digital boundary polygon of the project site in WGS84 (EPSG:4326).
3. **Land Area & Utilization Plan:** Detailed land requirements and investment activity description.
4. **Land Tenure Proof:** Certificate of land ownership or lease agreement (Clean & Clear status).

#### Legal Basis:
* **Luwu Regency Spatial Bylaw (Perda RTRW No. 06/2011)** and OSS-RBA derivative regulations.
* All documentation assistance is available at the **DPMPTSP one-stop service desk** at **Simpurusiang Public Service Mall (MPP)**, Belopa.`;
    }

    if (q.includes("cocoa") || q.includes("coffee") || q.includes("clove") || q.includes("seaweed") || q.includes("commodity") || q.includes("agriculture") || q.includes("farm") || q.includes("kakao") || q.includes("kopi")) {
      return `### 🌾 Premier Investment Commodities of Luwu Regency

Luwu Regency possesses exceptional agro-climatic advantages with export-oriented flagship commodities:

1. **Cocoa (Kakao):** The largest cocoa plantation hub in South Sulawesi with high productivity, supported by fermentation processing centers in Walenrang, Lamasi, and Bua.
2. **Arabica & Robusta Coffee:** Harvested from the highlands of Mt. Latimojong and Bastem with distinctive specialty-grade flavor profiles.
3. **Luwu Clove:** Widely cultivated across the hillsides of Larompong, Suli, and Bajo with premium essential oil content.
4. **Seaweed (Eucheuma Cottonii):** The Bone Gulf coastline in Belopa, Kamanre, and Ponrang produces export-quality dried seaweed.
5. **Regional Incentives:** Downstream processing investors employing at least 60% local Luwu workforce qualify for up to 35% regional tax and retribution relief.`;
    }

    if (q.includes("industrial") || q.includes("airport") || q.includes("port") || q.includes("kib") || q.includes("bua") || q.includes("logistics") || q.includes("industri") || q.includes("bandara")) {
      return `### 🏭 Strategic Infrastructure & Industrial Zones of Luwu Regency

Luwu Regency has established an integrated logistics infrastructure ecosystem to support industrial downstreaming:

* **Bua Industrial Park (KIB):** A multi-hectare industrial zone in Bua District designated for agricultural processing plants, warehousing, and eco-friendly manufacturing.
* **Bua Airport (I Lagaligo):** Regular scheduled flights from Makassar facilitating investor mobility and express cargo (only 5 minutes from KIB).
* **Ulo-Ulo Seaport Belopa:** Maritime port on the Bone Gulf for bulk commodity distribution and inter-island logistics.
* **Trans-Sulawesi Corridor:** National arterial road connecting Palopo – Belopa – Makassar for heavy cargo transit.`;
    }

    if (q.includes("pbg") || q.includes("slf") || q.includes("simbg") || q.includes("building") || q.includes("construction") || q.includes("gedung")) {
      return `### 🏛️ Building Approval (PBG) & Functional Eligibility Certificate (SLF) in Luwu

Pursuant to Government Regulation No. 16/2021, the legacy Building Permit (IMB) has been replaced by the **Building Approval (PBG)**:

1. **Processing Platform:** All applications are processed through the national **SIMBG** portal (simbg.pu.go.id).
2. **Required Documents:** National ID/NIB, Land Certificate, PKKPR Approval, Architectural Drawings (Site Plan, Floor Plans, Elevations, Sections), Structural Engineering Calculations, and Environmental Compliance (SPPL/UKL-UPL).
3. **Technical Verification:** Conducted by the Technical Assessment Team (TPT) of the Luwu Regency Public Works Office.
4. **Service Desk:** In-person consultation available at the DPMPTSP & Public Works counter at **Simpurusiang Public Service Mall (MPP)**, Belopa.`;
    }

    return `### 🏢 Luwu Regency Investment & Spatial Planning Assistant

Dear Sir/Madam, thank you for connecting with the integrated smart consultation service of Luwu Regency.

Our system integrates spatial planning data from **Regional Spatial Bylaw (Perda RTRW No. 06/2011)**, PostGIS spatial validation modules, and one-stop licensing through **Simpurusiang Public Service Mall (MPP)**:

* **Integrated Licensing Services:** OSS-RBA NIB registration, PKKPR spatial validation, PBG/SLF, and environmental certification.
* **Premier Investment Opportunities:** Cocoa downstreaming, Latimojong coffee, clove plantations, aquaculture ponds, and Bua Industrial Park (KIB) development.
* **Direct Consultation:** Visit the DPMPTSP technical team at the **VIP Executive Desk, Simpurusiang Public Service Mall (MPP)**, Belopa.

Please ask a more specific question about sectors, district boundaries, or regulations you would like to explore!`;
  }

  // ── CHINESE (SIMPLIFIED) RESPONSES ──
  if (lang === "zh") {
    if (q.includes("pkkpr") || q.includes("kkpr") || q.includes("空间") || q.includes("许可") || q.includes("规划") || q.includes("审批")) {
      return `### 📑 空间利用合规许可 (PKKPR) 办理指南 — 芦梧县 (Luwu Regency)

PKKPR（空间用途合规许可）是在芦梧县申请各类经营许可证的必备前置文件。

#### 申请材料清单：
1. **企业身份信息：** OSS-RBA 平台注册的企业身份代码 (NIB)、法定代表人身份证及税号 (NPWP)。
2. **地理空间坐标：** 项目用地数字边界多边形，需使用 WGS84 (EPSG:4326) 投影基准。
3. **用地面积与利用规划：** 拟用地面积详情及投资活动方案描述。
4. **土地权属证明：** 土地权利证书或租赁合同（产权清晰无纠纷）。

#### 法律依据：
* 《芦梧县空间规划条例》(**Perda RTRW No. 06/2011**) 及 OSS-RBA 衍生法规。
* 全流程一站式文件办理服务，设于芦梧县 Belopa **Simpurusiang 综合公共服务大楼 (MPP)** DPMPTSP 窗口。`;
    }

    if (q.includes("可可") || q.includes("咖啡") || q.includes("丁香") || q.includes("海藻") || q.includes("农业") || q.includes("commodity") || q.includes("kakao") || q.includes("kopi")) {
      return `### 🌾 芦梧县重点招商引资农业优势产业

芦梧县拥有得天独厚的热带农业气候优势，主力出口导向型旗舰商品包括：

1. **可可 (Kakao)：** 南苏拉威西省规模最大的可可种植基地，拥有成熟的发酵加工产业链，主要分布在 Walenrang、Lamasi 和 Bua 区。
2. **阿拉比卡与罗布斯塔咖啡：** 产自拉蒂莫章山 (Mt. Latimojong) 和 Bastem 高原的精品咖啡，具有独特的高海拔风味。
3. **芦梧丁香：** 广泛种植于 Larompong、Suli 和 Bajo 丘陵地带，精油含量极高。
4. **海藻 (Eucheuma Cottonii)：** 波尼湾 (Bone Gulf) 沿岸 Belopa、Kamanre 和 Ponrang 出产出口级干海藻。
5. **区域投资优惠：** 在芦梧县投资深加工项目并吸纳不低于 60% 本地员工的企业，最高可享受地方规费和税收 **35% 专项减免优惠**。`;
    }

    if (q.includes("工业") || q.includes("机场") || q.includes("港口") || q.includes("物流") || q.includes("kib") || q.includes("bua") || q.includes("industri")) {
      return `### 🏭 芦梧县战略基础设施与工业园区

芦梧县已构建完善的综合物流基础设施生态系统，全力支持产业深加工：

* **布阿工业园 (KIB)：** 位于 Bua 区的数百公顷工业用地，专为农产品加工厂、仓储物流及绿色制造业规划。
* **布阿机场 (I Lagaligo)：** 望加锡至布阿定期航班，方便投资者通勤及快速货运（距 KIB 仅5分钟车程）。
* **Ulo-Ulo Belopa 海港：** 位于波尼湾的海运码头，承载大宗农矿产品跨岛物流。
* **苏拉威西跨岛公路走廊：** 帕洛波 – Belopa – 望加锡国家干线公路，货运畅通无阻。`;
    }

    if (q.includes("pbg") || q.includes("建筑") || q.includes("施工") || q.includes("gedung")) {
      return `### 🏛️ 建筑审批 (PBG) 与功能适用性证书 (SLF) 办理指南 — 芦梧县

依据《2021年第16号政府条例》，原建设许可证 (IMB) 已被**建筑审批许可 (PBG)** 替代：

1. **办理平台：** 统一通过国家 **SIMBG** 在线门户 (simbg.pu.go.id) 提交申请。
2. **所需材料：** 身份证/NIB、土地证书、PKKPR 审批文件、建筑设计图纸（总平面图、平面图、立面图、剖面图）、结构计算书及环评文件 (SPPL/UKL-UPL)。
3. **技术审查：** 由芦梧县公共工程局技术评审组 (TPT) 进行审核。
4. **窗口服务：** 可前往 Belopa **Simpurusiang 综合公共服务大楼 (MPP)** DPMPTSP 及公共工程局窗口现场咨询。`;
    }

    return `### 🏢 芦梧县投资与空间规划智能顾问

尊敬的投资者，感谢您使用芦梧县一体化智能咨询服务。

本系统整合了《**芦梧县空间规划条例 (Perda RTRW No. 06/2011)**》空间数据、PostGIS 空间验证模块及 **Simpurusiang 综合公共服务大楼 (MPP)** 一站式许可服务：

* **一站式许可办理：** OSS-RBA 企业登记 (NIB)、PKKPR 空间合规验证、PBG/SLF 建筑审批及环评认证。
* **重点投资领域：** 可可深加工、拉蒂莫章咖啡、丁香种植园、水产养殖及布阿工业园 (KIB) 开发。
* **现场对接：** 欢迎莅临 Belopa **Simpurusiang 综合公共服务大楼 (MPP) VIP 外商投资专柜**，DPMPTSP 技术团队将为您提供专属咨询。

请提出更具体的问题，例如您关注的产业板块、行政区划或政策法规！`;
  }

  // ── INDONESIAN RESPONSES (DEFAULT) ──

  // 1. PKKPR / KKPR / Perizinan Tata Ruang (termasuk kelapa sawit / industri perkebunan)
  if (q.includes("pkkpr") || q.includes("kkpr") || q.includes("kesesuaian kegiatan pemanfaatan ruang") || (q.includes("syarat") && (q.includes("sawit") || q.includes("industri") || q.includes("izin")))) {
    if (q.includes("sawit")) {
      return `### 🌴 Persyaratan & Alur Perizinan PKKPR untuk Industri Kelapa Sawit (Kabupaten Luwu)

Berdasarkan **Peraturan Pemerintah No. 5 Tahun 2021 (OSS-RBA)** dan **Peraturan Daerah Kabupaten Luwu No. 06 Tahun 2011 tentang RTRW**, berikut adalah ketentuan resmi pengurusan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) untuk industri/perkebunan kelapa sawit:

#### 1. Persyaratan Administratif & Legalitas Pemohon:
* **Nomor Induk Berusaha (NIB):** Terdaftar pada sistem OSS-RBA dengan Klasifikasi Baku Lapangan Usaha Indonesia (KBLI) yang sesuai (KBLI 10431 / 10432 untuk industri minyak kelapa sawit/PKS atau KBLI perkebunan).
* **Identitas Pemohon:** KTP Direktur/Penanggung Jawab dan NPWP Perusahaan.
* **Akta Pendirian Perusahaan:** Beserta SK Pengesahan dari Kemenkumham RI.

#### 2. Persyaratan Data Teknis & Geospasial (Wajib Standar WGS84):
* **Poligon Batas Lahan Digital:** Peta koordinat batas tapak proyek dalam format SHP, GeoJSON, atau KMZ dengan sistem proyeksi geografis **WGS 84 (EPSG:4326)**.
* **Rencana Tapak (Site Plan):** Layout penataan fasilitas pengolahan pabrik, kolam limbah terpadu (IPALT/POME), dan zona penyangga (buffer zone).
* **Bukti Penguasaan Tanah:** Sertifikat Hak Atas Tanah (HGU/HGB/SHM) atau perjanjian sewa/pelepasan hak tanah yang sah dan tidak dalam sengketa (*Clean and Clear*).

#### 3. Ketentuan Zonasi & Tata Ruang Wilayah (Perda RTRW Luwu No. 06/2011):
* **Zonasi yang Diperbolehkan:** Wajib berlokasi pada **Kawasan Peruntukan Industri (Kawasan Industri Bua - KIB)** untuk unit pengolahan hilir, atau pada **Kawasan Peruntukan Perkebunan** untuk unit kebun terpadu.
* **Kawasan Terlarang (Restriksi Mutlak):** Tidak boleh tumpang tindih dengan Kawasan Hutan Lindung, Hutan Konservasi, Kawasan Resapan Air DAS (DAS Lamasi, Bua, Suso), Sempadan Sungai (minimal 50-100 meter), atau Lahan Pertanian Pangan Berkelanjutan (LP2B).

#### 4. Kajian Lingkungan Hidup:
* Mengingat industri kelapa sawit memiliki potensi dampak lingkungan terhadap air dan udara, pemohon wajib melampirkan persetujuan teknis lingkungan (**AMDAL** untuk skala besar atau **UKL-UPL** sesuai kapasitas olah Tandan Buah Segar).

#### 5. Alur Pelayanan Terpadu di MPP Simpurusiang:
1. **Pengajuan Daring:** Unggah seluruh dokumen permohonan melalui portal resmi **OSS-RBA** (oss.go.id).
2. **Kajian Teknis Spasial:** Tim Penilai Teknis dari **Dinas PUPR Kabupaten Luwu** melakukan analisis keselarasan spasial terhadap peta RTRW.
3. **Penerbitan Keputusan:** **DPMPTSP Kabupaten Luwu** menerbitkan dokumen resmi Persetujuan KKPR bertandatangan elektronik (BSrE).
4. **Pendampingan Khusus:** Tersedia layanan *Fast-Track Investor Desk* di Lantai 1 Gedung Mal Pelayanan Publik (MPP) Simpurusiang, Belopa untuk asistensi validasi spasial langsung.`;
    }

    return `### 📑 Panduan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Kabupaten Luwu

Persetujuan KKPR merupakan dokumen dasar mutlak sebelum pengurusan perizinan berusaha PBG, SLF, maupun izin operasional lanjutan di Kabupaten Luwu.

#### Dokumen Persyaratan Umum:
1. **Identitas Pemohon:** NIB OSS-RBA, KTP pemohon, dan NPWP.
2. **Koordinat Geografis:** Titik koordinat dan batas poligon lahan digital (WGS84).
3. **Luas & Rencana Pemanfaatan Lahan:** Rincian kebutuhan luas dan uraian rencana kegiatan investasi.
4. **Status Tanah:** Bukti kepemilikan/penguasaan lahan atau surat pernyataan kesiapan lahan.

#### Landasan Hukum:
* Sesuai **Perda Kabupaten Luwu No. 06 Tahun 2011 (RTRW 2011-2031)** dan regulasi turunan OSS-RBA.
* Seluruh proses asistensi berkas dilayani satu atap di **DPMPTSP Kabupaten Luwu - Gedung MPP Simpurusiang**, Belopa.`;
  }

  // 2. Pertanian / Perkebunan / Komoditas Unggulan
  if (q.includes("kakao") || q.includes("kopi") || q.includes("cengkeh") || q.includes("rumput laut") || q.includes("komoditas") || q.includes("tani") || q.includes("kebun")) {
    return `### 🌾 Komoditas Investasi Unggulan Daerah Kabupaten Luwu

Kabupaten Luwu memiliki keunggulan agroklimat yang sangat subur dengan komoditas andalan berorientasi ekspor:

1. **Kakao (Cocoa):** Sentra perkebunan kakao terbesar di Sulawesi Selatan dengan produktivitas tinggi, didukung sentra hilirisasi fermentasi kakao di Walenrang, Lamasi, dan Bua.
2. **Kopi Arabika & Robusta:** Dihasilkan dari ketinggian dataran tinggi Pegunungan Latimojong dan Bastem dengan cita rasa khas (specialty coffee) bernilai jual tinggi.
3. **Cengkeh Luwu:** Tersebar luas di kawasan lereng bukit Larompong, Suli, dan Bajo dengan kadar minyak atsiri premium.
4. **Rumput Laut (Eucheuma Cottonii):** Garis pantai Teluk Bone di pesisir Belopa, Kamanre, dan Ponrang menghasilkan rumput laut kering berkualitas ekspor.
5. **Insentif Daerah:** Investor hilirisasi yang menyerap minimal 60% tenaga kerja lokal Luwu berhak atas fasilitas keringanan pajak dan retribusi daerah hingga 35%.`;
  }

  // 3. Kawasan Industri & Infrastruktur (Bandara, Pelabuhan, KIB)
  if (q.includes("industri") || q.includes("bandara") || q.includes("pelabuhan") || q.includes("kib") || q.includes("bua") || q.includes("ulo-ulo") || q.includes("logistik")) {
    return `### 🏭 Infrastruktur Strategis & Kawasan Industri Kabupaten Luwu

Kabupaten Luwu telah menyiapkan ekosistem infrastruktur logistik terpadu untuk menopang hilirisasi industri:

* **Kawasan Industri Bua (KIB):** Zona industri ratusan hektar di Kecamatan Bua dengan peruntukan pabrik pengolahan hasil perkebunan, pergudangan, dan industri manufaktur ramah lingkungan.
* **Bandar Udara Bua (I Laga Ligo):** Gerbang udara reguler Makassar - Bua yang memfasilitasi mobilitas investor dan kargo cepat (hanya 5 menit dari KIB).
* **Pelabuhan Laut Ulo-Ulo Belopa:** Dermaga laut di perairan Teluk Bone untuk distribusi curah hasil bumi dan logistik maritim antar-pulau.
* **Koridor Trans-Sulawesi:** Akses jalan arteri nasional poros Palopo - Belopa - Makassar yang mulus dan bebas hambatan kargo berat.`;
  }

  // 4. Perizinan Bangunan Gedung (PBG / SLF / SIMBG)
  if (q.includes("pbg") || q.includes("slf") || q.includes("simbg") || q.includes("imb") || q.includes("gedung")) {
    return `### 🏛️ Persyaratan & Alur Penerbitan Persetujuan Bangunan Gedung (PBG) & SLF di Luwu

Sesuai PP No. 16 Tahun 2021, Izin Mendirikan Bangunan (IMB) telah digantikan oleh **Persetujuan Bangunan Gedung (PBG)**:

1. **Platform Pengurusan:** Wajib diakses melalui portal nasional **SIMBG** (simbg.pu.go.id).
2. **Persyaratan Dokumen:** KTP/NIB, Sertifikat Hak Atas Tanah, Persetujuan KKPR/PKKPR, Gambar Arsitektur (Site Plan, Denah, Tampak, Potongan), Perhitungan Teknis Struktur, dan Dokumen Lingkungan (SPPL/UKL-UPL).
3. **Verifikasi Teknis:** Dilakukan oleh Tim Penilai Teknis (TPT) Dinas PUPR Kabupaten Luwu.
4. **Loket Layanan:** Konsultasi tatap muka dan asistensi teknis berkas dilayani di Loket DPMPTSP & Dinas PUPR, Gedung MPP Simpurusiang Belopa.`;
  }

  // 5. Default General Consultation
  return `### 🏢 Asisten Investasi & Penataan Ruang Spasial Kabupaten Luwu

Tabe', Bapak/Ibu. Terima kasih telah menghubungi layanan konsultasi cerdas terpadu Kabupaten Luwu.

Sistem kami mengintegrasikan data tata ruang **Perda RTRW No. 06/2011**, modul validasi spasial PostGIS, serta layanan perizinan satu atap **MPP Simpurusiang**:

* **Layanan Perizinan Terpadu:** Pengurusan NIB OSS-RBA, validasi spasial PKKPR, PBG/SLF, dan sertifikasi lingkungan.
* **Potensi Investasi Unggulan:** Hilirisasi kakao, kopi Latimojong, perkebunan cengkeh, perikanan tambak, dan pengembangan Kawasan Industri Bua (KIB).
* **Kunjungan Langsung:** Anda dapat berkonsultasi langsung dengan Tim Teknis DPMPTSP di **VIP Executive Desk, Gedung Mal Pelayanan Publik (MPP) Simpurusiang**, Belopa.

Silakan ajukan pertanyaan lebih spesifik mengenai sektor, batas kecamatan, atau regulasi yang ingin Anda ketahui!`;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", message: "Gemini Chat Endpoint Active" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message, history, language, locale, simulationContext, investmentContext, sector } = req.body || {};
  const cleanMessage = typeof message === "string" ? message.trim() : "";
  const activeLang = ((locale || language || "id").toLowerCase()).startsWith("en") ? "en" : ((locale || language || "id").toLowerCase()).startsWith("zh") ? "zh" : "id";

  if (!cleanMessage) {
    const emptyMsg = activeLang === "en"
      ? "Please type your question about investment opportunities, spatial planning (RTRW), or PKKPR permitting in Luwu Regency."
      : activeLang === "zh"
      ? "\u8BF7\u8F93\u5165\u60A8\u5173\u4E8E\u82A6\u68A7\u53BF\u6295\u8D44\u673A\u9047\u3001\u7A7A\u95F4\u89C4\u5212 (RTRW) \u6216 PKKPR \u8BB8\u53EF\u7684\u95EE\u9898\u3002"
      : "Silakan ketikkan pertanyaan Anda seputar investasi, tata ruang RTRW, atau perizinan PKKPR di Kabupaten Luwu.";
    return res.status(200).json({
      text: emptyMsg,
      reply: emptyMsg,
      sources: []
    });
  }

  // Detect if this is a ROI/financial analysis request (has simulationContext)
  const hasSimulationContext = simulationContext && typeof simulationContext === "object" && (simulationContext.capex || simulationContext.npv !== undefined);

  const apiKeys = getGeminiApiKeys();
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  // Build enriched system prompt — context-aware for ROI or general
  let systemPrompt = `Anda adalah Asisten Cerdas Analisis Kelayakan Investasi & Penataan Ruang Kabupaten Luwu resmi (MPP Simpurusiang & DPMPTSP Kab. Luwu).
Tugas Anda: Memberikan informasi akurat, profesional, ramah khas Tana Luwu ("Tabe', Bapak/Ibu..."), berbasis regulasi Perda RTRW Kab. Luwu No. 06/2011, OSS-RBA, dan regulasi PKKPR.
Patuhi Doktrin Zero Dummy Policy: Jangan mengarang data atau proyek fiktif. Rujuk layanan resmi satu pintu ke Gedung MPP Simpurusiang di Belopa.`;

  const sim = hasSimulationContext ? simulationContext : null;

  // Enrich system prompt with simulation context for ROI analysis
  if (hasSimulationContext && sim) {
    systemPrompt += `

KONTEKS SIMULASI ROI AKTIF — Anda WAJIB menganalisis data finansial berikut secara mendalam:
- Nama Proyek: ${sim.name || investmentContext?.name || "Proyek Investasi"}
- Sektor: ${sim.sector || sector || "Umum"}
- CAPEX (Modal Investasi): Rp ${(sim.capex || 0).toLocaleString("id-ID")}
- OPEX (Biaya Operasional/Tahun): Rp ${(sim.opex || 0).toLocaleString("id-ID")}
- Revenue (Pendapatan/Tahun): Rp ${(sim.revenue || sim.asumsiPendapatan || 0).toLocaleString("id-ID")}
- Laba Bersih Operasional: Rp ${(sim.netProfit || 0).toLocaleString("id-ID")}/tahun
- ROI: ${(sim.roi || 0).toFixed(2)}%
- NPV (Discount ${sim.discountRate || 12}%): Rp ${(sim.npv || 0).toLocaleString("id-ID")}
- IRR: ${(sim.irr || 0).toFixed(2)}%
- Payback Period (BEP): ${sim.paybackPeriod >= 999 ? "Tidak Terbayar (Defisit)" : (sim.paybackPeriod || 0).toFixed(1) + " Tahun"}
- Discount Rate / WACC: ${sim.discountRate || 12}%
- Tenor Proyeksi: ${sim.tenor || 8} Tahun
- Status Kelayakan: ${sim.status || (sim.isDeficit ? "NOT_FEASIBLE" : "FEASIBLE")}

ATURAN MUTLAK:
1. Anda WAJIB mengutip PERSIS angka di atas. DILARANG memalsukan atau merekayasa kalkulasi.
2. Jika NPV < 0 atau status = NOT_FEASIBLE, Anda WAJIB menyimpulkan proyek TIDAK LAYAK dan skor kelayakan harus 5-25/100.
3. Jika NPV > 0 dan IRR > WACC, Anda boleh menyimpulkan SANGAT LAYAK dengan skor 75-92/100.
4. Hasilkan analisis terstruktur dengan 5 bagian: A) Ringkasan Eksekutif & Skor, B) Analisis Indikator Finansial (Payback, NPV, IRR, PI, Sensitivitas, Tabel Arus Kas 5 Tahun), C) Tax Allowance & Insentif, D) Risiko & Mitigasi, E) Rekomendasi Action Plan MPP Simpurusiang.`;
  }

  // Fetch RAG context from Supabase official tables
  let ragContext = "";
  try {
    const targetProject = sim?.name || investmentContext?.name || "";
    ragContext = await fetchRagContext(cleanMessage, sim?.sector || sector || "", targetProject);
  } catch (_) {}

  if (ragContext) {
    systemPrompt += ragContext;
  }

  // Explicit language directive for live Gemini API responses
  if (activeLang === "en") {
    systemPrompt += "\n\nCRITICAL LANGUAGE DIRECTIVE: You MUST respond ENTIRELY in professional English. All section headers, analysis text, financial terminology, narratives, recommendations, and conclusions MUST be written in English. Use 'IDR' for Indonesian Rupiah currency notation. Do NOT mix Indonesian or Chinese text into your response. Address the investor formally as 'Dear Sir/Madam' or 'Distinguished Investor'. Maintain the 5-section structure (A through E) in English.";
  } else if (activeLang === "zh") {
    systemPrompt += "\n\nCRITICAL LANGUAGE DIRECTIVE: You MUST respond ENTIRELY in professional Simplified Chinese. All section headers, analysis text, financial terms, narratives, recommendations, and conclusions MUST be in Simplified Chinese. Use 'IDR' or '\u5370\u5C3C\u76FE' for currency. Do NOT mix Indonesian or English text. Address investor as '\u5C0A\u656C\u7684\u6295\u8D44\u8005'. Keep the 5-section structure (A-E) in Chinese.";
  }

  // 1. Try Live Gemini API with rotational fallback across keys and models
  for (const apiKey of apiKeys) {
    for (const model of modelsToTry) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const contentsPayload: any[] = [];
        if (Array.isArray(history) && history.length > 0) {
          for (const h of history.slice(-6)) {
            const hText = h.parts?.[0]?.text || h.text || "";
            if (hText.trim()) {
              contentsPayload.push({
                role: h.role === "model" ? "model" : "user",
                parts: [{ text: hText.slice(0, 1500) }]
              });
            }
          }
        }
        contentsPayload.push({
          role: "user",
          parts: [{ text: cleanMessage }]
        });

        const controller = new AbortController();
        // Increased timeout: 25s for comprehensive ROI analysis, 12s for general chat
        const timeoutMs = hasSimulationContext ? 25000 : 12000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const apiRes = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: contentsPayload,
            generationConfig: {
              temperature: hasSimulationContext ? 0.4 : 0.6,
              maxOutputTokens: hasSimulationContext ? 4096 : 2048
            }
          })
        });

        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const resData = await apiRes.json();
          const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 50) {
            return res.status(200).json({
              text: candidateText,
              reply: candidateText,
              sources: []
            });
          }
        }
      } catch (err: any) {
        // Continue to next key/model on failure
      }
    }
  }

  // 2. Intelligent Fallback — Context-Aware
  // If simulationContext exists, use ROI Financial Analysis Fallback (NOT generic PKKPR!)
  if (hasSimulationContext) {
    const roiFallback = buildRoiAnalysisFallback(simulationContext, activeLang);
    return res.status(200).json({
      text: roiFallback,
      reply: roiFallback,
      sources: [],
      isStandby: true
    });
  }

  // Otherwise, use general authoritative fallback
  const fallbackText = buildAuthoritativeLuwuResponse(cleanMessage, activeLang);
  return res.status(200).json({
    text: fallbackText,
    reply: fallbackText,
    sources: [],
    isStandby: true
  });
}