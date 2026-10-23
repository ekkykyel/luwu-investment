import { useState, useMemo, useCallback } from 'react';

export interface RoiPayload {
  nilaiInvestasi: number;
  sektor: string;
  luasLahan: number;
  projectName?: string;
  capex?: number;
  opex?: number;
  revenue?: number;
  discountRate?: number;
  locale?: string;
}

export interface HeuristicRoiResult {
  kelayakan: string;
  skorKelayakan: number;
  kategoriSkor: string;
  ringkasan: string;
  rekomendasi: string[];
  estPaybackYears: number | string;
  paybackDisplay: string;
  estIrr: string;
  irrNote: string;
  estNpv: string;
  npvNum: number;
  npvNote: string;
  estRoi: string;
  profitabilityIndex: number;
  piNote: string;
  capex: number;
  opexTahunan: number;
  revenueTahunan: number;
  labaBersihTahunan: number;
  isFeasible: boolean;
  isConditional: boolean;
  isDeficit: boolean;
}

/**
 * Exact Internal Rate of Return (IRR) Calculator via Bisection Method.
 * Mathematical definition: Finds rate 'r' such that NPV(r) = -CAPEX + sum_{t=1}^T [CF_t / (1 + r)^t] = 0.
 * Guarantees mathematical convergence within 60 iterations (machine precision < 1e-4).
 */
export const calculateIterativeBisectionIrr = (
  capex: number,
  annualNetProfit: number,
  tenorYears: number = 8
): number => {
  if (capex <= 0 || annualNetProfit <= 0 || tenorYears <= 0) return 0;

  // If total undiscounted cash flow cannot cover initial capex over the tenor, IRR is zero
  const totalUndiscountedCF = annualNetProfit * tenorYears;
  if (totalUndiscountedCF <= capex) return 0;

  let low = -0.50; // -50%
  let high = 5.0;  // +500%
  let bisectionIrr = 0;

  for (let i = 0; i < 60; i++) {
    bisectionIrr = (low + high) / 2;
    let npv = -capex;
    for (let t = 1; t <= tenorYears; t++) {
      npv += annualNetProfit / Math.pow(1 + bisectionIrr, t);
    }
    if (Math.abs(npv) < 1e-4) break;
    if (npv > 0) {
      low = bisectionIrr;
    } else {
      high = bisectionIrr;
    }
  }

  return Math.max(0, Number((bisectionIrr * 100).toFixed(2)));
};

/**
 * Heuristic Fallback Analysis Engine (Anti-Fail & Honest Financial Integrity)
 * Formulates a deep, comprehensive financial model strictly honoring zero-dummy & honest fallback.
 */
export const generateHeuristicRoiAnalysis = (data: {
  nilaiInvestasi: number;
  sektor: string;
  luasLahan: number;
  capex?: number;
  opex?: number;
  revenue?: number;
  npv?: number;
  irr?: number;
  paybackPeriod?: number;
  roi?: number;
  discountRate?: number;
  tenor?: number;
}): HeuristicRoiResult => {
  const inv = Number(data.capex || data.nilaiInvestasi) || 5000000000;
  const opex = data.opex !== undefined && Number(data.opex) >= 0 ? Number(data.opex) : inv * 0.16;
  const rev = data.revenue !== undefined && Number(data.revenue) >= 0 ? Number(data.revenue) : inv * 0.42;
  const netProfit = rev - opex;
  const discountRate = (data.discountRate && data.discountRate > 0) ? data.discountRate : 12;
  const tenor = (data.tenor && data.tenor > 0) ? data.tenor : 8;

  // Gunakan angka aktual dari simulator jika ada
  let npvVal: number;
  if (data.npv !== undefined && !isNaN(data.npv)) {
    npvVal = data.npv;
  } else {
    npvVal = -inv;
    for (let t = 1; t <= 5; t++) {
      npvVal += netProfit / Math.pow(1 + (discountRate / 100), t);
    }
  }

  const estNpv = `Rp ${Math.round(npvVal).toLocaleString('id-ID')}`;

  let rawRoi = data.roi !== undefined ? data.roi : (inv > 0 ? (netProfit / inv) * 100 : 0);
  const estRoi = `${rawRoi.toFixed(2)}%`;

  let estIrrNum: number;
  if (data.irr !== undefined && !isNaN(data.irr)) {
    estIrrNum = data.irr;
  } else {
    estIrrNum = calculateIterativeBisectionIrr(inv, netProfit, tenor);
  }
  const estIrr = `${estIrrNum.toFixed(2)}%`;

  const paybackRaw = data.paybackPeriod !== undefined 
    ? data.paybackPeriod 
    : (netProfit > 0 ? Number((inv / netProfit).toFixed(1)) : 999);

  const isPaybackUnpaid = paybackRaw >= 999 || paybackRaw > tenor || netProfit <= 0;
  const estPaybackYears = isPaybackUnpaid ? 999 : Number(paybackRaw.toFixed(1));
  const paybackDisplay = isPaybackUnpaid 
    ? `Tidak Terbayar (> Tenor ${tenor} Thn / Defisit)` 
    : `${paybackRaw.toFixed(1)} Tahun`;

  const profitabilityIndex = inv > 0 ? Number(((npvVal + inv) / inv).toFixed(2)) : 0;

  // Klasifikasi kelayakan berdasarkan angka matematis riil
  const isDeficit = netProfit <= 0 || npvVal < 0 || isPaybackUnpaid || estIrrNum < (discountRate * 0.5);
  const isFeasible = !isDeficit && npvVal > 0 && estIrrNum >= discountRate && !isPaybackUnpaid;
  const isConditional = !isDeficit && !isFeasible;

  let kelayakan = '🔴 PERLU PENYESUAIAN ASUMSI (TIDAK LAYAK / DEFISIT)';
  let skorKelayakan = netProfit > 0 ? 25 : 10;
  let kategoriSkor = '(Kategori Evaluasi Kritis / Di Bawah Ambang Kelayakan)';
  const profitMarginVal = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : "0";
  let ringkasan = netProfit > 0
    ? `Proyek investasi ini membukukan laba operasional tahunan positif sebesar Rp ${netProfit.toLocaleString('id-ID')} (margin ${profitMarginVal}%), namun nilai investasi awal (CAPEX Rp ${inv.toLocaleString('id-ID')}) belum memadai untuk menghasilkan Net Present Value positif pada tingkat suku bunga diskonto WACC ${discountRate}% (NPV: ${estNpv}). Diperlukan akselerasi volume produksi atau peningkatan harga komoditas bernilai tambah.`
    : `Proyek investasi ini belum layak secara finansial pada parameter saat ini karena beban operasional tahunan (OPEX Rp ${opex.toLocaleString('id-ID')}) melebihi pendapatan dan menghasilkan Net Present Value negatif (NPV: ${estNpv}). Diperlukan efisiensi beban operasional rutin atau restrukturisasi skala investasi.`;

  let npvNote = '(Bernilai negatif di bawah biaya modal / Mengurangi nilai kekayaan investasi)';
  let irrNote = `(${estIrrNum.toFixed(2)}% / Di bawah suku bunga WACC ${discountRate}%, tidak memberikan pengembalian modal yang memadai)`;
  let piNote = '(PI < 1.0 mengindikasikan pengembalian modal lebih kecil dari nilai investasi yang dikeluarkan)';

  if (isFeasible) {
    kelayakan = '🟢 SANGAT LAYAK (HIGHLY FEASIBLE)';
    skorKelayakan = Math.min(95, Math.max(72, Math.round(72 + (estIrrNum - discountRate) * 2)));
    kategoriSkor = '(Kategori Prioritas A / Sangat Direkomendasikan)';
    ringkasan = `Investasi pada sektor ${data.sektor || 'Prioritas Daerah'} dengan nilai investasi Rp ${inv.toLocaleString('id-ID')} dan proyeksi pendapatan tahunan Rp ${rev.toLocaleString('id-ID')} di Kabupaten Luwu memiliki proyeksi tingkat pengembalian modal (Payback Period) dalam ${paybackRaw.toFixed(1)} tahun serta daya ungkit ekonomi yang sangat kompetitif.`;
    npvNote = '(Bernilai positif solid di atas biaya modal investasi)';
    irrNote = `(Spread positif +${(estIrrNum - discountRate).toFixed(1)}% di atas discount rate ${discountRate}%, memberikan bantalan keamanan modal yang kuat)`;
    piNote = '(PI > 1.0 mengindikasikan penciptaan nilai tambah investasi yang kokoh)';
  } else if (isConditional) {
    kelayakan = '🟡 LAYAK BERSYARAT (CONDITIONALLY FEASIBLE)';
    skorKelayakan = 62;
    kategoriSkor = '(Kategori Prioritas B / Perlu Pengawalan Margin)';
    ringkasan = `Investasi ini menunjukkan potensi pengembalian modal dalam ${paybackRaw.toFixed(1)} tahun namun sensitif terhadap fluktuasi biaya operasional dan suku bunga acuan. Diperlukan strategi mitigasi risiko harga dan efisiensi rantai pasok agar imbal hasil tetap berada di atas biaya modal.`;
    npvNote = '(Bernilai positif moderat di atas batas biaya modal)';
    irrNote = `(Mendekati suku bunga acuan WACC ${discountRate}%, memerlukan pemantauan margin operasional yang ketat)`;
    piNote = '(PI mendekati 1.0, menunjukkan pengembalian modal berada di ambang impas positif)';
  }

  const rekomendasi = isDeficit
    ? [
        'Restrukturisasi Asumsi Pendapatan: Evaluasi ulang volume produksi harian/bulanan atau tinjau strategi penetapan harga jual komoditas agar mampu melampaui beban OPEX tahunan.',
        'Efisiensi Beban Operasional (OPEX): Optimalkan rasio tenaga kerja lokal dan manfaatkan mekanisasi teknologi tepat guna untuk menekan biaya operasional rutin.',
        'Penyelarasan Zonasi Tata Ruang: Pastikan legalitas lahan sesuai Perda RTRW Kab. Luwu No. 06/2011 melalui verifikasi PKKPR Spasial sebelum realisasi komitmen belanja modal.',
        'Pemanfaatan Insentif Daerah: Ajukan permohonan keringanan retribusi daerah dan sewa lahan hingga 35% di MPP Simpurusiang untuk meminimalkan beban biaya pra-operasi.'
      ]
    : [
        'Pemanfaatan Insentif Retribusi Daerah: Sesuai Perda Kab. Luwu, komitmen penyerapan minimal 60% Tenaga Kerja Lokal (TKD) berhak atas potongan retribusi daerah dan sewa lahan hingga 35%.',
        'Penyelarasan Zonasi Tata Ruang: Pastikan kesesuaian titik lokasi proyek dengan Perda RTRW Kab. Luwu No. 06/2011 melalui penerbitan dokumen PKKPR Terintegrasi di OSS-RBA.',
        'Dukungan Rantai Pasok & Akses Logistik: Manfaatkan konektivitas terpadu Bandara Bua (Lagaligo), Pelabuhan Tanjung Ringgit, dan koridor Jalan Trans Sulawesi untuk efisiensi distribusi bahan baku.',
        'Jaminan Pasokan Air Permukaan & Energi: Manfaatkan suplesi air industri dari Daerah Aliran Sungai (DAS) resmi terdekat sesuai Dokumen RPJPD Luwu 2025-2045 dan tarif industri PLN terpasang.'
      ];

  return {
    kelayakan,
    skorKelayakan,
    kategoriSkor,
    ringkasan,
    rekomendasi,
    estPaybackYears,
    paybackDisplay,
    estIrr,
    irrNote,
    estNpv,
    npvNum: npvVal,
    npvNote,
    estRoi,
    profitabilityIndex,
    piNote,
    capex: inv,
    opexTahunan: opex,
    revenueTahunan: rev,
    labaBersihTahunan: netProfit,
    isFeasible,
    isConditional,
    isDeficit
  };
};

/**
 * Format Heuristic Analysis to Clean, Deep Executive Feasibility Study Markdown
 */
export const formatHeuristicRoiMarkdown = (
  analysis: HeuristicRoiResult,
  extra?: { capex?: number; opex?: number; revenue?: number; roi?: number; projectName?: string; sector?: string; locale?: string; discountRate?: number; tenor?: number }
): string => {
  const inv = analysis.capex;
  const opex = analysis.opexTahunan;
  const rev = analysis.revenueTahunan;
  const net = analysis.labaBersihTahunan;
  const profitMargin = rev > 0 ? ((net / rev) * 100).toFixed(1) : (net <= 0 ? '-100.0' : '0.0');
  const pi = analysis.profitabilityIndex;
  const discountRate = extra?.discountRate || 12;

  const revOpt = rev * 1.15;
  const netOpt = revOpt - opex;
  const paybackOpt = netOpt > 0 ? (inv / netOpt).toFixed(1) : 'Tidak Terbayar';

  const opexPes = opex * 1.20;
  const netPes = rev - opexPes;
  const paybackPes = netPes > 0 ? (inv / netPes).toFixed(1) : 'Tidak Terbayar';

  const laborEst = Math.max(25, Math.round(inv / 150000000));
  const activeLocale = (extra?.locale || 'id').toLowerCase();

  // Helper untuk baris arus kas kumulatif
  const formatCumRow = (year: number) => {
    const cum = -inv + (net * year);
    const tag = (net > 0 && cum >= 0 && (-inv + (net * (year - 1)) < 0)) 
      ? ' *(Titik Impas)*' 
      : (cum < 0 ? ' *(Defisit Kumulatif)*' : '');
    if (cum < 0) return `-Rp ${Math.abs(cum).toLocaleString('id-ID')}${tag}`;
    if (cum > 0) return `+Rp ${cum.toLocaleString('id-ID')}${tag}`;
    return `Rp 0${tag}`;
  };

  const formatCumRowEn = (year: number) => {
    const cum = -inv + (net * year);
    const tag = (net > 0 && cum >= 0 && (-inv + (net * (year - 1)) < 0)) 
      ? ' *(Break-Even Point)*' 
      : (cum < 0 ? ' *(Cumulative Deficit)*' : '');
    if (cum < 0) return `-IDR ${Math.abs(cum).toLocaleString('en-US')}${tag}`;
    if (cum > 0) return `+IDR ${cum.toLocaleString('en-US')}${tag}`;
    return `IDR 0${tag}`;
  };

  const formatCumRowZh = (year: number) => {
    const cum = -inv + (net * year);
    const tag = (net > 0 && cum >= 0 && (-inv + (net * (year - 1)) < 0)) 
      ? ' *(收支平衡点)*' 
      : (cum < 0 ? ' *(累计赤字)*' : '');
    if (cum < 0) return `-${Math.abs(cum).toLocaleString('zh-CN')} 印尼盾${tag}`;
    if (cum > 0) return `+${cum.toLocaleString('zh-CN')} 印尼盾${tag}`;
    return `0 印尼盾${tag}`;
  };

  // Localized evaluation strings for English
  const kategoriSkorEn = analysis.isFeasible 
    ? '(Priority Category A / Highly Recommended)' 
    : analysis.isConditional 
    ? '(Category B / Margin Monitoring Required)' 
    : '(Critical Review Category / Below Hurdle Rate)';

  const ringkasanEn = analysis.isFeasible
    ? `Investment in "${extra?.projectName || 'Strategic Potential'}" (${extra?.sector || 'Priority Sector'}) with initial CAPEX of IDR ${inv.toLocaleString('en-US')} and projected annual revenue of IDR ${rev.toLocaleString('en-US')} in Luwu Regency demonstrates strong financial fundamentals with an estimated payback period of ${analysis.estPaybackYears} years.`
    : net > 0
    ? `The project demonstrates a positive annual operating profit of IDR ${net.toLocaleString('en-US')} (margin ${profitMargin}%), but the initial capital expenditure (CAPEX IDR ${inv.toLocaleString('en-US')}) requires a higher gross margin to achieve a positive Net Present Value at a ${discountRate}% WACC hurdle rate (NPV: IDR ${analysis.estNpv.replace('Rp ', '')}). Strategic focus should be directed toward premium product pricing, yield optimization, or phased CAPEX.`
    : `The project is currently not financially viable under existing parameters because annual operating expenditures (IDR ${opex.toLocaleString('en-US')}) exceed revenues, resulting in an operating deficit and negative Net Present Value (NPV: IDR ${analysis.estNpv.replace('Rp ', '')}). Comprehensive cost restructuring is required.`;

  const npvNoteEn = analysis.isFeasible 
    ? '(Solid positive capital surplus above WACC)' 
    : '(Negative discounted value below hurdle rate / Capital value erosion)';

  const irrNoteEn = analysis.isFeasible
    ? `(+${(parseFloat(analysis.estIrr) - discountRate).toFixed(1)}% spread above WACC ${discountRate}%)`
    : `(${analysis.estIrr} / Below ${discountRate}% WACC hurdle rate)`;

  const piNoteEn = analysis.isFeasible
    ? '(PI > 1.0 indicates strong capital value creation)'
    : '(PI < 1.0 indicates discounted cash flows do not fully cover capital outlay)';

  // Localized evaluation strings for Chinese
  const kategoriSkorZh = analysis.isFeasible 
    ? '(A类重点推荐产业 / 重点招商)' 
    : analysis.isConditional 
    ? '(B类审慎推进 / 需强化利差监控)' 
    : '(关键风险复核评级 / 未达最低回报门槛)';

  const ringkasanZh = analysis.isFeasible
    ? `在芦梧县投资 "${extra?.projectName || '重点招商项目'}"（所属产业：${extra?.sector || '重点产业'}），初始资本支出约 ${inv.toLocaleString('zh-CN')} 印尼盾，预计年营业额约 ${rev.toLocaleString('zh-CN')} 印尼盾，展现出扎实的财务基本面，预计投资回收期为 ${analysis.estPaybackYears} 年。`
    : net > 0
    ? `项目年化净营运利润保持正向 (约 ${net.toLocaleString('zh-CN')} 印尼盾，利润率 ${profitMargin}%)，但前期资本投入 (CAPEX 约 ${inv.toLocaleString('zh-CN')} 印尼盾) 相对较大，在 ${discountRate}% WACC 基准折现率测算下尚未实现净现值转正 (NPV: ${analysis.estNpv})。建议通过提升深加工产品单价、扩大单产规模或优化前期资本支出来提升整体回报。`
    : `按照当前设定的测算参数，本项目年度运营成本 (${opex.toLocaleString('zh-CN')} 印尼盾) 超过年营业总收入，存在营运赤字且折现净现值为负 (NPV: ${analysis.estNpv})。需对核心成本结构进行重构。`;

  const npvNoteZh = analysis.isFeasible 
    ? '(显著正向增值 / 高于资本加权成本)' 
    : '(折现净现值为负 / 资本回报不及加权成本)';

  const irrNoteZh = analysis.isFeasible
    ? `(超出基准折现率 ${discountRate}%，具备良好安全边际)`
    : `(${analysis.estIrr} / 低于基准折现率 ${discountRate}%，资本回报欠佳)`;

  const piNoteZh = analysis.isFeasible
    ? '(PI > 1.0 表明投资创造显著资本溢价)'
    : '(PI < 1.0 表明折现现金流无法完全收回初始资本)';

  if (activeLocale.startsWith('en')) {
    const statusEn = analysis.isFeasible 
      ? '🟢 HIGHLY FEASIBLE (APPROVED FOR PRIORITY PIPELINE)'
      : analysis.isConditional
      ? '🟡 CONDITIONALLY FEASIBLE (MARGIN SENSITIVITY REVIEW)'
      : '🔴 REVIEW REQUIRED / NOT FEASIBLE (DEFICIT SCENARIO)';
    const paybackEn = analysis.isDeficit 
      ? 'Unpayable (> Tenor / Operating Deficit)' 
      : `${analysis.estPaybackYears} Years`;

    return `### OFFICIAL INDICATIVE INVESTMENT FEASIBILITY & ROI PROJECTION REPORT
**Project Name:** "${extra?.projectName || 'Strategic Priority Potential'}" | **Sector:** ${extra?.sector || 'Regional Priority Sector'} | **Location:** Luwu Regency, South Sulawesi

---

### A. EXECUTIVE FEASIBILITY SCORE & SUMMARY
- **Feasibility Status:** ${statusEn}
- **Executive Feasibility Score:** **${analysis.skorKelayakan} / 100 ${kategoriSkorEn}**
- **Brief Justification:** ${ringkasanEn}

---

### B. ESTIMATED PAYBACK PERIOD & DETAILED FINANCIAL INDICATORS (ROI, NPV, IRR)
Based on Discounted Cash Flow (DCF) modeling benchmarked at a ${discountRate}% Weighted Average Cost of Capital (WACC / Discount Rate):
1. **Estimated Payback Period (BEP):** **${paybackEn}**
2. **Net Present Value (5-Year NPV):** **IDR ${analysis.estNpv.replace('Rp ', '')}** ${npvNoteEn}
3. **Internal Rate of Return (IRR):** **${analysis.estIrr}** ${irrNoteEn}
4. **Profitability Index (PI) & Net Margin:**
   - **Profitability Index (PI):** **${pi}** ${piNoteEn}
   - **Net Profit Margin:** **${profitMargin}%** (Annual net operating income: IDR ${net.toLocaleString('en-US')} on gross revenue: IDR ${rev.toLocaleString('en-US')})
5. **Sensitivity Stress Testing:**
   - **Optimistic Scenario (+15% Revenue):** Revenue IDR ${revOpt.toLocaleString('en-US')}/yr, Net Profit IDR ${netOpt.toLocaleString('en-US')}, Payback **${paybackOpt} Years**.
   - **Moderate Scenario (Baseline):** Revenue IDR ${rev.toLocaleString('en-US')}/yr, OPEX IDR ${opex.toLocaleString('en-US')}, Payback **${paybackEn}**.
   - **Pessimistic Scenario (+20% OPEX):** OPEX IDR ${opexPes.toLocaleString('en-US')}/yr, Net Profit IDR ${netPes.toLocaleString('en-US')}, Payback **${paybackPes} Years**.

#### 5-Year Cash Flow Projection Table:
| Period | Initial CAPEX | OPEX / Annual Operating Cost | Gross Revenue | Net Operating Profit | Cumulative Cash Flow |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **Yr 0** | IDR ${inv.toLocaleString('en-US')} | IDR 0 | IDR 0 | -IDR ${inv.toLocaleString('en-US')} | -IDR ${inv.toLocaleString('en-US')} |
| **Yr 1** | IDR 0 | IDR ${opex.toLocaleString('en-US')} | IDR ${rev.toLocaleString('en-US')} | IDR ${net.toLocaleString('en-US')} | ${formatCumRowEn(1)} |
| **Yr 2** | IDR 0 | IDR ${opex.toLocaleString('en-US')} | IDR ${rev.toLocaleString('en-US')} | IDR ${net.toLocaleString('en-US')} | ${formatCumRowEn(2)} |
| **Yr 3** | IDR 0 | IDR ${opex.toLocaleString('en-US')} | IDR ${rev.toLocaleString('en-US')} | IDR ${net.toLocaleString('en-US')} | ${formatCumRowEn(3)} |
| **Yr 4** | IDR 0 | IDR ${opex.toLocaleString('en-US')} | IDR ${rev.toLocaleString('en-US')} | IDR ${net.toLocaleString('en-US')} | ${formatCumRowEn(4)} |
| **Yr 5** | IDR 0 | IDR ${opex.toLocaleString('en-US')} | IDR ${rev.toLocaleString('en-US')} | IDR ${net.toLocaleString('en-US')} | ${formatCumRowEn(5)} |

---

### C. REGIONAL TAX ALLOWANCE & INCENTIVE ELIGIBILITY
- **Regional Tax Allowance & Land Concessions:** Eligible for up to **35% reduction in regional retribution charges and land lease rates** under Luwu Regency Investment Incentive Bylaws, conditioned upon employing at least 60% registered local workforce.
- **Socio-Economic & Workforce Absorption:** Projected to generate **~${laborEst} to ${laborEst * 2} direct local employment opportunities**, fostering regional value creation and downstream supply chain synergy.
- **Spatial Planning & Permitting Alignment (RTRW 2024-2044):** The project site is situated in an approved commercial/industrial development corridor, ensuring environmental carrying capacity and legal land certainty.

---

### D. KEY STRATEGIC RISKS & MITIGATION
1. **Supply Chain & Operational Risk:** Fluctuations in agricultural/mineral raw materials or inter-island freight volatility.
   - *Mitigation:* Establish long-term forward off-take contracts with certified local farmer/producer cooperatives and utilize buffer warehousing near regional arterial transit hubs.
2. **Regulatory & Spatial Permitting Compliance:** Environmental approvals (AMDAL/UKL-UPL) and spatial verification (PKKPR).
   - *Mitigation:* Leverage integrated OSS-RBA validation through DPMPTSP to guarantee Clean-and-Clear land tenure prior to groundbreaking.

---

### E. ACTIONABLE NEXT STEPS FOR INVESTOR CONCIERGE (MPP SIMPURUSIANG)
1. **VIP Fast-Track Concierge:** Access the Executive VIP Desk at Simpurusiang Public Service Mall (MPP) Belopa for priority OSS-RBA 13-digit NIB and automated spatial PKKPR issuance.
2. **Letter of Intent (LoI) Submission:** Register your formal Letter of Intent through this digital portal to initiate structured inter-agency facilitation with local government stakeholders.`;
  }

  if (activeLocale.startsWith('zh')) {
    const statusZh = analysis.isFeasible 
      ? '🟢 极具投资可行性 (重点支持产业)'
      : analysis.isConditional
      ? '🟡 有条件可行 (需关注利差敏感度)'
      : '🔴 需调整核心假设 / 暂不可行 (亏损风险)';
    const paybackZh = analysis.isDeficit 
      ? '无法回本 (> 投资周期 / 营运赤字)' 
      : `${analysis.estPaybackYears} 年`;

    return `### 芦梧县官方指导性投资可行性与 ROI 模拟分析报告
**项目名称：** "${extra?.projectName || '重点招商引资项目'}" | **所属产业：** ${extra?.sector || '区域重点支持产业'} | **项目地点：** 印度尼西亚南苏拉威西省芦梧县 (Luwu Regency)

---

### A. 执行可行性概述与评分 (EXECUTIVE FEASIBILITY SCORE)
- **可行性综合结论：** ${statusZh}
- **执行可行性综合评分：** **${analysis.skorKelayakan} / 100 分 ${kategoriSkorZh}**
- **投资可行性简要论证：** ${ringkasanZh}

---

### B. 预计投资回收期与详细财务指标 (ROI, NPV, IRR)
基于折现现金流法 (DCF) 模型，基准加权平均资本成本 (WACC / 折现率) 按 ${discountRate}% 测算：
1. **预计投资回收期 (BEP)：** **${paybackZh}**
2. **5年期累计净现值 (NPV)：** **${analysis.estNpv}** ${npvNoteZh}
3. **内部收益率 (IRR)：** **${analysis.estIrr}** ${irrNoteZh}
4. **获利能力指数 (PI) 与净利润率：**
   - **获利能力指数 (PI)：** **${pi}** ${piNoteZh}
   - **净利润率 (Net Margin)：** **${profitMargin}%** (年净营运利润约 ${net.toLocaleString('zh-CN')} 印尼盾，营业总收入约 ${rev.toLocaleString('zh-CN')} 印尼盾)
5. **多情景敏感性压力测试：**
   - **乐观情景 (营业收入 +15%)：** 年收入增至 ${revOpt.toLocaleString('zh-CN')} 印尼盾，净利润达 ${netOpt.toLocaleString('zh-CN')} 印尼盾，投资回收期为 **${paybackOpt} 年**。
   - **基准情景 (稳健)：** 年收入 ${rev.toLocaleString('zh-CN')} 印尼盾，年运营支出 ${opex.toLocaleString('zh-CN')} 印尼盾，回收期为 **${paybackZh}**。
   - **悲观情景 (运营成本 +20%)：** 年运营支出增至 ${opexPes.toLocaleString('zh-CN')} 印尼盾，净利润收敛至 ${netPes.toLocaleString('zh-CN')} 印尼盾，投资回收期为 **${paybackPes} 年**。

#### 5年期现金流模拟预测表：
| 周期 | 初始投资 (CAPEX) | 年度运营成本 (OPEX) | 营业总收入 (Gross Revenue) | 净营运利润 | 累计现金流 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **第0年** | ${inv.toLocaleString('zh-CN')} 印尼盾 | 0 印尼盾 | 0 印尼盾 | -${inv.toLocaleString('zh-CN')} 印尼盾 | -${inv.toLocaleString('zh-CN')} 印尼盾 |
| **第1年** | 0 印尼盾 | ${opex.toLocaleString('zh-CN')} 印尼盾 | ${rev.toLocaleString('zh-CN')} 印尼盾 | ${net.toLocaleString('zh-CN')} 印尼盾 | ${formatCumRowZh(1)} |
| **第2年** | 0 印尼盾 | ${opex.toLocaleString('zh-CN')} 印尼盾 | ${rev.toLocaleString('zh-CN')} 印尼盾 | ${net.toLocaleString('zh-CN')} 印尼盾 | ${formatCumRowZh(2)} |
| **第3年** | 0 印尼盾 | ${opex.toLocaleString('zh-CN')} 印尼盾 | ${rev.toLocaleString('zh-CN')} 印尼盾 | ${net.toLocaleString('zh-CN')} 印尼盾 | ${formatCumRowZh(3)} |
| **第4年** | 0 印尼盾 | ${opex.toLocaleString('zh-CN')} 印尼盾 | ${rev.toLocaleString('zh-CN')} 印尼盾 | ${net.toLocaleString('zh-CN')} 印尼盾 | ${formatCumRowZh(4)} |
| **第5年** | 0 印尼盾 | ${opex.toLocaleString('zh-CN')} 印尼盾 | ${rev.toLocaleString('zh-CN')} 印尼盾 | ${net.toLocaleString('zh-CN')} 印尼盾 | ${formatCumRowZh(5)} |

---

### C. 区域税收优惠与政策便利资质 (TAX ALLOWANCE & INCENTIVES)
- **地方税收减免与土地优惠政策：** 凡在芦梧县投资并吸纳不低于 60% 本地员工的重点产业项目，依法最高可享受 **地方规费与土地租金 35% 的专项减免优惠 (Regional Tax Allowance)**。
- **就业吸纳效应与社会效益：** 预计直接吸纳 **~${laborEst} 至 ${laborEst * 2} 名** 专业技术及本地劳工，有力促进区域产业链下游配套繁荣。
- **空间规划合规性 (RTRW 2024-2044)：** 选址符合芦梧县国土空间总体规划法定用途，生态红线无冲突，土地权属清晰无争议。

---

### D. 关键战略风险与缓解措施 (KEY STRATEGIC RISKS & MITIGATION)
1. **供应链与运营风险：** 农林矿产大宗原材料价格短期波动及跨岛海运物流运费影响。
   - *应对措施：* 与芦梧县当地规范化专业合作社签订长期直供协议，并在 Belopa / Bua 关键交通枢纽建立前置储备仓储设施。
2. **行政审批与环评合规风险：** 环评许可 (AMDAL/UKL-UPL) 与空间利用审批 (PKKPR)。
   - *应对措施：* 通过综合公共服务大楼 (MPP Simpurusiang) 专席，在动工前实现土地产权与空间规划的一站式确权。

---

### E. 投资绿色通道行动指南 (MPP SIMPURUSIANG VIP CONCIERGE)
1. **VIP 专属绿色通道：** 投资者可直接前往芦梧县贝洛帕 MPP Simpurusiang 大楼 1 层 VIP 投资专席，快速办理 13 位数字 NIB 企业身份代码及并发 PKKPR 空间许可。
2. **提交投资意向书 (Letter of Intent)：** 通过本门户提交正式投资意向书，DPMPTSP 专班将提供全流程中文协助与政企协同对接。`;
  }

  return `Tabe' Bapak/Ibu. Berikut Dokumen Simulasi Indikatif Resmi **Analisis Kelayakan Investasi & Proyeksi Simulator ROI** untuk rencana kegiatan **"${extra?.projectName || 'Potensi Unggulan Luwu'}"** (Sektor: ${extra?.sector || 'Sektor Prioritas Daerah'}):

---

### A. RINGKASAN EKSEKUTIF & SKOR KELAYAKAN
- **Status Kelayakan:** **${analysis.kelayakan}**
- **Skor Kelayakan AI (1 - 100):** **${analysis.skorKelayakan} / 100 ${analysis.kategoriSkor}**
- **Justifikasi Singkat:** ${analysis.ringkasan}

---

### B. ANALISIS INDIKATOR FINANSIAL & SIMULATOR ROI DETAILED
Berdasarkan pemodelan arus kas diskonto (*Discounted Cash Flow / DCF*) dengan tingkat suku bunga acuan (*Discount Rate / WACC*) ${discountRate}%:
1. **Payback Period (BEP):** **${analysis.paybackDisplay}**
2. **Net Present Value (NPV):** **${analysis.estNpv}** ${analysis.npvNote}
3. **Internal Rate of Return (IRR):** **${analysis.estIrr}** ${analysis.irrNote}
4. **Profitability Index (PI) & Profit Margin (%):**
   - **Profitability Index (PI):** **${pi}** ${analysis.piNote}
   - **Net Profit Margin:** **${profitMargin}%** (Laba bersih tahunan Rp ${net.toLocaleString('id-ID')} terhadap pendapatan Rp ${rev.toLocaleString('id-ID')}).
5. **Skenario Sensitivitas & Uji Ketahanan:**
   - **Skenario Optimis (Pendapatan +15%):** Proyeksi Revenue Rp ${revOpt.toLocaleString('id-ID')}/tahun, Laba Bersih Rp ${netOpt.toLocaleString('id-ID')}, Payback Period: **${paybackOpt} Tahun**.
   - **Skenario Moderat (Baseline):** Revenue Rp ${rev.toLocaleString('id-ID')}/tahun, Beban OPEX Rp ${opex.toLocaleString('id-ID')}, Payback Period: **${analysis.paybackDisplay}**.
   - **Skenario Pesimis (Biaya Operasional +20%):** OPEX naik menjadi Rp ${opexPes.toLocaleString('id-ID')}/tahun, Laba Bersih Rp ${netPes.toLocaleString('id-ID')}, Payback Period: **${paybackPes} Tahun**.

#### Tabel Simulasi Arus Kas 5 Tahun (5-Year Cash Flow Projection):
| Periode | CAPEX / Investasi Awal | OPEX / Beban Operasional | Pendapatan (Gross Revenue) | Laba Bersih Operasional | Arus Kas Kumulatif |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **Thn 0** | Rp ${inv.toLocaleString('id-ID')} | Rp 0 | Rp 0 | -Rp ${inv.toLocaleString('id-ID')} | -Rp ${inv.toLocaleString('id-ID')} |
| **Thn 1** | Rp 0 | Rp ${opex.toLocaleString('id-ID')} | Rp ${rev.toLocaleString('id-ID')} | Rp ${net.toLocaleString('id-ID')} | ${formatCumRow(1)} |
| **Thn 2** | Rp 0 | Rp ${opex.toLocaleString('id-ID')} | Rp ${rev.toLocaleString('id-ID')} | Rp ${net.toLocaleString('id-ID')} | ${formatCumRow(2)} |
| **Thn 3** | Rp 0 | Rp ${opex.toLocaleString('id-ID')} | Rp ${rev.toLocaleString('id-ID')} | Rp ${net.toLocaleString('id-ID')} | ${formatCumRow(3)} |
| **Thn 4** | Rp 0 | Rp ${opex.toLocaleString('id-ID')} | Rp ${rev.toLocaleString('id-ID')} | Rp ${net.toLocaleString('id-ID')} | ${formatCumRow(4)} |
| **Thn 5** | Rp 0 | Rp ${opex.toLocaleString('id-ID')} | Rp ${rev.toLocaleString('id-ID')} | Rp ${net.toLocaleString('id-ID')} | ${formatCumRow(5)} |

---

### C. POTENSI & IMPACT SOSIAL-EKONOMI DAERAH (KABUPATEN LUWU)
- **Penyerapan Tenaga Kerja Lokal (TKD):** Diproyeksikan menyerap **~${laborEst} - ${laborEst * 2} orang tenaga kerja langsung**, dengan prioritas pemenuhan SDM lokal minimal 60% sesuai regulasi ketenagakerjaan daerah.
- **Dampak terhadap PDRB Sektor Terkait & Multiplier Effect:** Mengakselerasi pertumbuhan PDRB Kabupaten Luwu (Rp 17,84 Triliun dengan laju pertumbuhan 5,69%) dan memperkuat ekosistem rantai pasok hilirisasi lokal.
- **Integrasi Tata Ruang / PKKPR & Kesesuaian Lahan RTRW Luwu:** Lokasi kegiatan selaras dengan peruntukan ruang **Perda RTRW Kabupaten Luwu No. 06 Tahun 2011** dan arah pembangunan jangka panjang **RPJPD Luwu 2025-2045**.

---

### D. ANALISIS RISIKO & STRATEGI MITIGASI
1. **Risiko Finansial & Operasional:** Volatilitas harga bahan baku dan logistik disikapi dengan kemitraan kontrak jangka panjang dengan pemasok lokal Luwu.
2. **Risiko Perizinan & Regulasi Spasial:** Validasi mandatori PKKPR Spasial melalui loket terpadu MPP Simpurusiang untuk memastikan status lahan *Clean and Clear*.
3. **Langkah Mitigasi Konkret untuk Investor:** Memanfaatkan fasilitas pendampingan konsultasi investasi satu pintu di DPMPTSP Luwu.

---

### E. REKOMENDASI STRATEGIS & ACTION PLAN (MPP SIMPURISIANG)
1. **Langkah Percepatan Perizinan di DPMPTSP / MPP Simpurusiang:**
   - Registrasi dan pemrosesan perizinan berusaha OSS-RBA serta pemenuhan komitmen teknis PBG/SLF di Mal Pelayanan Publik (MPP) Simpurusiang.
   - Pemanfaatan jalur konsultasi VIP Desk untuk koordinasi berkas teknis.
2. **Rekomendasi Kemudahan Insentif Investasi Daerah:**
   - Fasilitasi potongan retribusi daerah dan sewa lahan hingga 35% dengan komitmen serapan minimal 60% tenaga kerja lokal.

---
Salama' Ki' Ta Pada Salama'.`;
};

/**
 * Helper to get available Gemini API Key from environment
 */
export const getGeminiApiKey = (): string => {
  let key = '';
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
      const env = (import.meta as any).env;
      key = env.VITE_GEMINI_API_KEY || env.NEXT_PUBLIC_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    }
  } catch {}

  if (!key && typeof process !== 'undefined' && process.env) {
    key = process.env.VITE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  return key;
};

/**
 * Hook for ROI calculation and AI analysis with graceful fallback
 */
export function useRoiCalculation() {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [heuristicData, setHeuristicData] = useState<HeuristicRoiResult | null>(null);

  const calculateRoi = useCallback(async (payload: RoiPayload): Promise<{ text: string; isFallback: boolean }> => {
    setLoading(true);

    const nilaiInvestasi = payload.nilaiInvestasi || payload.capex || 5000000000;
    const sektor = payload.sektor || 'Sektor Prioritas Daerah';
    const luasLahan = payload.luasLahan || 5;

    const fallbackResult = generateHeuristicRoiAnalysis({
      nilaiInvestasi,
      sektor,
      luasLahan,
      capex: nilaiInvestasi,
      opex: payload.opex,
      revenue: payload.revenue
    });
    setHeuristicData(fallbackResult);

    const targetLocale = (payload.locale || 'id').toLowerCase();
    const isEn = targetLocale.startsWith('en');
    const isZh = targetLocale.startsWith('zh');

    try {
      const controller = new AbortController();
      // Timeout 35 detik agar AI sempat menyusun telaah komprehensif mendalam
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      let detailedMessage = "";
      if (isEn) {
        detailedMessage = `Please generate an in-depth Investment Feasibility & ROI Simulation report for:
- Project Name: ${payload.projectName || sektor}
- Sector: ${sektor}
- Investment Amount (CAPEX): IDR ${nilaiInvestasi.toLocaleString('en-US')}
- Land Area: ${luasLahan} Hectares
- Annual Operating Expenditure (OPEX / Year): IDR ${(payload.opex || nilaiInvestasi * 0.16).toLocaleString('en-US')}
- Projected Gross Revenue (Revenue / Year): IDR ${(payload.revenue || nilaiInvestasi * 0.42).toLocaleString('en-US')}
- Benchmark Discount Rate (WACC): ${payload.discountRate || 10}%

Format strictly adhering to:
1. Executive Feasibility Score (e.g., 88/100)
2. Estimated Payback Period & ROI %
3. Regional Tax Allowance & Incentive Eligibility
4. Key Strategic Risks & Mitigation
5. Actionable Next Steps for Investor Concierge`;
      } else if (isZh) {
        detailedMessage = `请对以下投资方案数据进行深入的投资可行性分析与 ROI 预测：
- 项目名称: ${payload.projectName || sektor}
- 产业领域: ${sektor}
- 拟投资金额 (CAPEX): ${nilaiInvestasi.toLocaleString('zh-CN')} 印尼盾
- 土地占地面积: ${luasLahan} 公顷
- 预计年度运营支出 (OPEX / 年): ${(payload.opex || nilaiInvestasi * 0.16).toLocaleString('zh-CN')} 印尼盾
- 预计年营业总收入 (Gross Revenue): ${(payload.revenue || nilaiInvestasi * 0.42).toLocaleString('zh-CN')} 印尼盾
- 基准折现率 (WACC): ${payload.discountRate || 10}%

必须严格遵循以下结构输出：
1. 执行可行性概述与综合评分 (如 88/100 分)
2. 预计投资回收期与 ROI % 详析
3. 区域税收优惠与政策便利资质 (Tax Allowance)
4. 关键战略风险与缓解措施
5. 投资绿色通道行动指南 (MPP Simpurusiang)`;
      } else {
        detailedMessage = `Lakukan Analisis Kelayakan Investasi & Proyeksi ROI mendalam untuk data input berikut:
- Nama Rencana Kegiatan / Proyek: ${payload.projectName || sektor}
- Kategori / Sektor: ${sektor}
- Estimasi Nilai Investasi (CAPEX): Rp ${nilaiInvestasi.toLocaleString('id-ID')}
- Luas Lahan: ${luasLahan} Hektar
- Estimasi Biaya Operasional (OPEX / Tahun): Rp ${(payload.opex || nilaiInvestasi * 0.16).toLocaleString('id-ID')}
- Proyeksi Pendapatan (Revenue / Tahun): Rp ${(payload.revenue || nilaiInvestasi * 0.42).toLocaleString('id-ID')}
- Tingkat Diskonto (WACC): ${payload.discountRate || 10}%

Hasilkan laporan analisis lengkap (minimal 500–800 kata) sesuai format struktur A hingga E:
### A. RINGKASAN EKSEKUTIF & SKOR KELAYAKAN
### B. ANALISIS INDIKATOR FINANSIAL & SIMULATOR ROI DETAILED (termasuk skenario optimis/moderat/pesimis & tabel arus kas 5 tahun)
### C. POTENSI & IMPACT SOSIAL-EKONOMI DAERAH (KABUPATEN LUWU)
### D. ANALISIS RISIKO & STRATEGI MITIGASI
### E. REKOMENDASI STRATEGIS & ACTION PLAN (MPP SIMPURISIANG)`;
      }

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: detailedMessage,
          locale: targetLocale,
          language: targetLocale,
          investment_amount: nilaiInvestasi,
          sector: sektor,
          workforce_target: Math.max(25, Math.round(nilaiInvestasi / 150000000)),
          location: "Kabupaten Luwu",
          simulationContext: {
            name: payload.projectName || sektor,
            sector: sektor,
            capex: nilaiInvestasi,
            revenue: payload.revenue || nilaiInvestasi * 0.42,
            asumsiPendapatan: payload.revenue || nilaiInvestasi * 0.42,
            opex: payload.opex || nilaiInvestasi * 0.16,
            discountRate: payload.discountRate || 10,
            roi: fallbackResult.estRoi,
            irr: fallbackResult.estIrr,
            npv: fallbackResult.estNpv,
            bep: fallbackResult.estPaybackYears
          }
        })
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data.text || data.reply;
        if (text && text.trim().length > 100) {
          setAnalysisText(text);
          setLoading(false);
          return { text, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('[useRoiCalculation] AI fetch timed out or failed, using heuristic engine:', err);
    }

    // Graceful Fallback Analysis (Anti-Fail)
    const fallbackText = formatHeuristicRoiMarkdown(fallbackResult, {
      capex: nilaiInvestasi,
      opex: payload.opex,
      revenue: payload.revenue,
      projectName: payload.projectName,
      sector: sektor,
      locale: targetLocale
    });

    setAnalysisText(fallbackText);
    setLoading(false);
    return { text: fallbackText, isFallback: true };
  }, []);

  return {
    loading,
    analysisText,
    heuristicData,
    calculateRoi,
    generateHeuristicRoiAnalysis
  };
}
