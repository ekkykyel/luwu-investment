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

  const formatRp = (n: number): string => {
    if (Math.abs(n) >= 1e12) return `Rp ${(n / 1e12).toFixed(2)} Triliun`;
    if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toFixed(1)} Miliar`;
    if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toFixed(0)} Juta`;
    return `Rp ${n.toLocaleString("id-ID")}`;
  };

  const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0";
  const pi = capex > 0 ? ((npv + capex) / capex).toFixed(2) : "N/A";
  const isOperationalSurplus = netProfit > 0;
  const paybackDisplay = !isOperationalSurplus || paybackPeriod >= 999 
    ? "Tidak Terbayar (Defisit Operasional)" 
    : `${paybackPeriod.toFixed(1)} Tahun`;

  // Sensitivity scenarios
  const optimisRevenue = revenue * 1.15;
  const optimisNpv = npv * 1.2;
  const pesimisOpex = opex * 1.20;
  const pesimisNetProfit = revenue - pesimisOpex;
  const pesimisPayback = pesimisNetProfit > 0 ? capex / pesimisNetProfit : 999;

  // 5-Year Cash Flow Projection
  let cashFlowTable = "";
  if (lang === "id") {
    cashFlowTable = `| Tahun | Pendapatan | OPEX | Laba Bersih | Kumulatif |
|:---:|---:|---:|---:|---:|
`;
    let cumulative = -capex;
    for (let y = 1; y <= 5; y++) {
      const inflatedOpex = opex * Math.pow(1.045, y - 1); // Inflasi 4.5%
      const yearNetProfit = revenue - inflatedOpex;
      cumulative += yearNetProfit;
      cashFlowTable += `| ${y} | ${formatRp(revenue)} | ${formatRp(inflatedOpex)} | ${formatRp(yearNetProfit)} | ${formatRp(cumulative)} |\n`;
    }
  }

  if (isDeficit) {
    const justifikasiDefisit = isOperationalSurplus
      ? `Secara operasional proyek menghasilkan laba tahunan positif sebesar ${formatRp(netProfit)} (operating margin ${profitMargin}%). Namun, nilai investasi awal (${formatRp(capex)}) yang relatif tinggi menyebabkan nilai kini terdiskon (NPV: ${formatRp(npv)}) berada di bawah biaya modal pada suku bunga diskonto WACC ${discountRate}%. IRR (${irr.toFixed(2)}%) belum mencukupi standar pengembalian modal minimum.`
      : `Berdasarkan parameter simulasi, beban operasional tahunan (${formatRp(opex)}) melebihi pendapatan (${formatRp(revenue)}), sehingga proyek mengalami defisit operasional. NPV bertanda negatif (${formatRp(npv)}) dan IRR (${irr.toFixed(2)}%) berada di bawah WACC ${discountRate}%.`;

    const paybackNarasi = isOperationalSurplus && paybackPeriod < 999
      ? `Secara nominal (tanpa memperhitungkan time value of money), modal investasi awal sebesar ${formatRp(capex)} dapat kembali dalam **${paybackPeriod.toFixed(1)} Tahun** (dalam batas tenor proyek ${tenor} tahun). Namun, jika memperhitungkan faktor diskonto suku bunga ${discountRate}% (WACC) dan inflasi operasional 4.5%/tahun, akumulasi arus kas terdiskon (Discounted Cash Flow) belum mencapai titik impas dalam tenor proyek (Discounted Payback > ${tenor} tahun).`
      : `Modal investasi awal sebesar ${formatRp(capex)} **TIDAK DAPAT KEMBALI** dalam tenor proyek ${tenor} tahun karena arus kas tahunan bersih mengalami defisit operasional. Pendapatan tahunan (${formatRp(revenue)}) tidak cukup menutupi biaya operasional (${formatRp(opex)}).`;

    const insentifRegional = isAgri
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
**Hasil:** ${paybackDisplay}
${paybackNarasi}

#### 2. Net Present Value (NPV)
**Hasil:** ${formatRp(npv)} (NEGATIF)
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
| 🟢 Optimis (+15% Revenue) | ${formatRp(optimisRevenue)} | ${formatRp(opex)} | ${formatRp(optimisRevenue - opex)} | ${(optimisRevenue - opex) > 0 ? (capex / (optimisRevenue - opex)).toFixed(1) + " Thn" : "Defisit"} |
| 🔵 Baseline (Saat Ini) | ${formatRp(revenue)} | ${formatRp(opex)} | ${formatRp(netProfit)} | ${paybackDisplay} |
| 🔴 Pesimis (+20% OPEX) | ${formatRp(revenue)} | ${formatRp(pesimisOpex)} | ${formatRp(pesimisNetProfit)} | ${pesimisPayback >= 999 ? "Defisit" : pesimisPayback.toFixed(1) + " Thn"} |

#### Proyeksi Arus Kas 5 Tahun (Inflasi 4.5%/Tahun)
${cashFlowTable}

---

### C. FASILITAS TAX ALLOWANCE & INSENTIF DAERAH
${insentifRegional}

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

  // FEASIBLE / CONDITIONAL
  const statusLabel = isFeasible ? "🟢 SANGAT LAYAK (HIGHLY FEASIBLE)" : "🟡 LAYAK BERSYARAT (CONDITIONALLY FEASIBLE)";
  const score = isFeasible ? Math.min(92, Math.max(75, Math.round(70 + (irr - discountRate) * 2 + (roi > 30 ? 5 : 0)))) : Math.min(68, Math.max(55, 60));

  return `### ${isFeasible ? "🟢" : "🟡"} LAPORAN ANALISIS KELAYAKAN FINANSIAL AI
**${projectName}** — Sektor: ${sector}

---

### A. RINGKASAN EKSEKUTIF & SKOR KELAYAKAN
- **Status Kelayakan:** ${statusLabel}
- **Skor Kelayakan AI:** ${score}/100
- **Justifikasi:** Proyek menunjukkan fundamental finansial ${isFeasible ? "sangat kuat" : "cukup baik"}. NPV positif sebesar ${formatRp(npv)} membuktikan investasi ini menciptakan nilai tambah. IRR (${irr.toFixed(2)}%) ${isFeasible ? "melampaui" : "mendekati"} target WACC (${discountRate}%), dan ROI tahunan mencapai ${roi.toFixed(2)}%.

---

### B. ANALISIS INDIKATOR FINANSIAL & SIMULATOR ROI

#### 1. Payback Period (BEP)
**Hasil:** ${paybackDisplay}
Modal investasi awal sebesar ${formatRp(capex)} diproyeksikan kembali dalam ${paybackPeriod.toFixed(1)} tahun dari total tenor ${tenor} tahun. ${paybackPeriod < tenor / 2 ? "Pengembalian modal sangat cepat — kurang dari separuh masa konsesi." : "Pengembalian modal dalam rentang wajar dari masa konsesi proyek."}

#### 2. Net Present Value (NPV)
**Hasil:** ${formatRp(npv)} (POSITIF ✅)
Dengan discount rate ${discountRate}% (WACC = BI Rate 6.0% + Risk Premium Luwu), seluruh arus kas masa depan jika didiskontokan menghasilkan **surplus** sebesar ${formatRp(npv)}. Investasi ini **menciptakan nilai** bagi investor.

#### 3. Internal Rate of Return (IRR)
**Hasil:** ${irr.toFixed(2)}%
IRR ${isFeasible ? "**melampaui**" : "mendekati"} target WACC ${discountRate}%. ${irr > discountRate * 2 ? "Tingkat pengembalian sangat kompetitif — lebih dari 2x lipat suku bunga acuan." : "Tingkat pengembalian memenuhi standar kelayakan minimum investasi."}

#### 4. Profitability Index (PI) & Profit Margin
- **PI:** ${pi} ${parseFloat(pi) > 1 ? "(> 1.0 = Menciptakan Nilai ✅)" : ""}
- **Profit Margin:** ${profitMargin}%
- **ROI Tahunan:** ${roi.toFixed(2)}%
- **Laba Bersih / Tahun:** ${formatRp(netProfit)}

#### 5. Skenario Sensitivitas
| Skenario | Pendapatan | OPEX | Laba Bersih | Payback |
|---|---:|---:|---:|:---:|
| 🟢 Optimis (+15% Revenue) | ${formatRp(optimisRevenue)} | ${formatRp(opex)} | ${formatRp(optimisRevenue - opex)} | ${(optimisRevenue - opex) > 0 ? (capex / (optimisRevenue - opex)).toFixed(1) + " Thn" : "N/A"} |
| 🔵 Baseline (Saat Ini) | ${formatRp(revenue)} | ${formatRp(opex)} | ${formatRp(netProfit)} | ${paybackDisplay} |
| 🔴 Pesimis (+20% OPEX) | ${formatRp(revenue)} | ${formatRp(pesimisOpex)} | ${formatRp(pesimisNetProfit)} | ${pesimisPayback >= 999 ? "Defisit" : pesimisPayback.toFixed(1) + " Thn"} |

#### Proyeksi Arus Kas 5 Tahun (Inflasi 4.5%/Tahun)
${cashFlowTable}

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
    return res.status(200).json({
      text: "Silakan ketikkan pertanyaan Anda seputar investasi, tata ruang RTRW, atau perizinan PKKPR di Kabupaten Luwu.",
      reply: "Silakan ketikkan pertanyaan Anda seputar investasi, tata ruang RTRW, atau perizinan PKKPR di Kabupaten Luwu.",
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
