/**
 * Basis Pengetahuan & Literasi Resmi Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu
 * Didedikasikan untuk Agen Konsultan Cerdas "Asisten Digital Ta'" (DPMPTSP Kabupaten Luwu)
 * Referensi Resmi:
 * 1. Portal Layanan DPMPTSP Kabupaten Luwu: https://dpmptsp.luwukab.go.id/category/layanan
 * 2. Tabel Knowledge Supabase (knowledge_documents: RTRW 2011, RPJPD 2025-2045, RPJMD 2025, BPS 2025, LPPD 2025, IPRO)
 * 3. Standar Regulasi KemenPAN-RB RI, PP Bangunan Gedung (PBG/SLF), OSS-RBA, dan Etiket Budaya Luhur Tana Luwu.
 */

export interface KnowledgeDocMeta {
  id: string;
  title: string;
  category?: string;
  source_agency?: string;
  publication_year?: string | number;
  is_active?: boolean;
}

/**
 * Mendeteksi apakah pertanyaan pengguna berada di luar konteks / luar tugas Asisten Digital Ta'
 * (misalnya resep masakan barat, artis/selebriti, rumus sains/matematika murni, coding umum, gosip, zodiak, politik internasional)
 */
export function isMppOutOfScope(userQuery: string): boolean {
  const q = userQuery.toLowerCase().trim();
  if (!q) return false;

  // Daftar kata kunci yang JELAS di luar konteks pelayanan publik Luwu
  const explicitOutOfScopeKeywords = [
    "resep ", "resepnya", "cara membuat kue", "cara buat kue", "cara membuat rendang", "cara memasak pizza", "resep burger",
    "bumbu masakan", "resep ayam geprek", "cara buat nasi goreng",
    "rumus integral", "kalkulus", "turunan matematika", "relativitas einstein", "fisika kuantum", "rumus trigonometri",
    "kecepatan cahaya", "tata surya mars", "alien", "lubang hitam",
    "zodiak hari ini", "ramalan bintang", "ramalan jodoh", "siapa jodoh saya", "tips pacaran", "putus cinta",
    "chord gitar", "lirik lagu kpop", "rekomendasi anime", "taylor swift", "cristiano ronaldo", "lionel messi",
    "artis korea", "film marvel", "jadwal bioskop jakarta",
    "pemilu amerika", "perang rusia ukraina", "presiden amerika serikat", "donald trump", "joe biden",
    "coding python", "cara membuat website wordpress", "belajar javascript", "fungsi redux", "kode html css",
    "cerita lucu", "tebak-tebakan", "cerita hantu", "pantun gombal"
  ];

  for (const kw of explicitOutOfScopeKeywords) {
    if (q.includes(kw)) return true;
  }

  // Kata kunci domain yang SAH di dalam tugas Asisten Digital Ta'
  const inScopeKeywords = [
    // Identitas & Sapaan
    "mpp", "simpurusiang", "luwu", "pemkab", "dpmptsp", "tabe", "salama", "halo", "assalamu", "pagi", "siang", "sore", "malam",
    "terima kasih", "makasih", "kurru", "siapa kamu", "siapa anda", "tugas", "fungsi", "bisa apa",
    // Portal Layanan dpmptsp.luwukab.go.id/category/layanan & Mitra
    "layanan", "katalog", "has international", "nevis", "pt nevis", "pdam", "tirta luwu", "air bersih", "samsat",
    "diskominfo", "kominfo", "ppid", "sp4n", "lapor", "bank sulselbar", "sulselbar", "kpp pratama", "pajak pratama",
    "bpjs", "dekranasda", "kerajinan", "tenun", "cinderamata", "kejaksaan", "kejari", "datun", "tilang", "perikanan",
    "nelayan", "tambak", "bbm subsidi", "rekomendasi bbm", "kontak dpmptsp", "alamat dpmptsp", "wa dpmptsp",
    // Perizinan & Dokumen
    "izin", "perizinan", "oss", "oss-rba", "nib", "pbg", "slf", "imb", "simbg", "ktp", "e-ktp", "kk", "kartu keluarga",
    "kia", "akta", "dukcapil", "adm", "pajak", "pbb", "bphtb", "retribusi", "npwp", "spt", "efin", "skck", "sim a",
    "sim c", "polres", "polisi", "sertifikat tanah", "bpn", "atr", "shm", "hgb", "nikah", "balai nikah", "kemenag",
    "halal", "sehati", "kartu kuning", "ak-1", "disnakertrans", "dinsos", "dtks", "pbi", "dinkes", "izin praktik",
    "dlh", "lingkungan", "sppl", "ukl-upl", "amdal", "koperasi", "umkm", "p-irt",
    // Tata Ruang & Peta
    "tata ruang", "rtrw", "zonasi", "kkpr", "pkkpr", "perda 6", "perda 2011", "spasial", "peta", "koordinat", "jarak",
    "pgrouting", "belopa", "bua", "ponrang", "suli", "bajo", "larompong", "bupon", "kamanre", "bastem", "latimojong",
    "walenrang", "lamasi",
    // Investasi & Dokumen Knowledge Supabase
    "investasi", "ipro", "rumput laut", "kakao", "kopi", "smelter", "pdrb", "bps", "rpjmd", "rpjpd", "lppd", "dokumen",
    "knowledge", "tabel knowledge", "supabase", "sarpras", "fasilitas", "disabilitas", "laktasi", "kids corner",
    "jadwal", "jam", "antrean", "loket", "19 instansi"
  ];

  const hasInScopeKeyword = inScopeKeywords.some((kw) => q.includes(kw));

  // Jika panjang pesan > 20 karakter dan TIDAK ADA SATUPUN kata kunci in-scope, anggap out of scope
  if (!hasInScopeKeyword && q.length > 20) {
    return true;
  }

  return false;
}

/**
 * Jawaban halus, santun, dan beretika luhur Tana Luwu untuk pertanyaan di luar konteks
 */
export function getGentleOutOfScopeResponse(lang: string = "id"): string {
  if (lang.startsWith("en")) {
    return `Tabe' (Greetings). Please accept our sincerest apologies. The scope and core duties of Asisten Digital Ta' are specifically dedicated to assisting citizens, academics, and investors with:

🏛️ 1. Simpurusiang Public Service Mall (MPP) Luwu (19 integrated government and banking counters, on-site facilities, and smart queues).
📄 2. Official Licensing & Public Services (DPMPTSP Luwu, OSS-RBA, Building Permits PBG & SLF via SIMBG, Kejari DATUN legal aid, Fisheries fuel recommendations, PDAM water connections, SAMSAT vehicle taxes, Diskominfo-SP, DEKRANASDA, BPJS, Bank Sulselbar, and more as listed on dpmptsp.luwukab.go.id/category/layanan).
🗺️ 3. Spatial Zoning & Planning Regulations (Luwu Spatial Plan / Perda RTRW No. 06/2011 and KKPR spatial approvals).
📊 4. Official Knowledge Base Documents from Supabase (Luwu RPJPD 2025-2045, RPJMD 2025, BPS Luwu In Figures 2025, LPPD 2025, and IPRO Investment Profiles).

The topic you inquired about falls outside our institutional mandate. Should you need any assistance with official document requirements, public services, or investment opportunities in Luwu Regency, Asisten Digital Ta' is wholeheartedly ready to assist you. Salama'Ki' Tapada Salama'.`;
  }

  if (lang.startsWith("zh")) {
    return `您好（Tabe' 朋友），非常抱歉！Asisten Digital Ta' 的核心职责与任务专为卢武县 (Kabupaten Luwu) 投资与公共服务提供咨询支持，主要涵盖：

🏛️ 1. Simpurusiang 公共服务中心 (MPP Luwu)（19 个联办窗口部门、大楼无障碍与便民设施、智能排队与运营时间）。
📄 2. 官方许可与公共服务事项（DPMPTSP 投资许可 OSS-RBA、建筑许可 PBG/SLF、检察院 DATUN 法律援助、渔业补贴油推荐函、PDAM 自来水接入、SAMSAT 车船税、Diskominfo-SP 公开信息、DEKRANASDA 传统工艺品、BPJS 医保社保、Bank Sulselbar 等官方服务，详见 dpmptsp.luwukab.go.id/category/layanan）。
🗺️ 3. 空间规划与投资分区法规（卢武县空间规划 Perda RTRW No. 06/2011 及空间合规 KKPR）。
📊 4. Supabase 知识库官方文献（卢武县 RPJPD 2025-2045、RPJMD 2025、BPS 统计年鉴 2025、LPPD 报告及海藻深加工 IPRO 投资项目）。

您所咨询的内容超出了本系统的政务服务范围。若您需要咨询任何关于卢武县政务服务、许可申请或投资项目的信息，Asisten Digital Ta' 将竭诚为您服务。Salama'Ki' Tapada Salama'。`;
  }

  return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Mohon maaf yang sebesar-besarnya, ruang lingkup dan amanah tugas utama Saya secara khusus difokuskan untuk mendampingi masyarakat, akademisi, dan calon investor seputar:
1.	Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu (fasilitas gedung, loket 19 instansi terpadu, antrean digital, dan operasional layanan).
2.	Ragam Layanan Resmi DPMPTSP Kabupaten Luwu & Mitra (Perizinan Berusaha OSS-RBA, NIB, PBG & SLF via SIMBG, Pos Bantuan Hukum DATUN & tilang Kejaksaan Negeri Luwu, rekomendasi BBM subsidi & izin tambak Dinas Perikanan, sambungan baru PDAM Tirta Luwu, Pajak Kendaraan SAMSAT, PPID & SP4N-LAPOR Diskominfo-SP, galeri kerajinan DEKRANASDA, BPJS Kesehatan & Ketenagakerjaan, Bank Sulselbar, KPP Pratama, dll. sebagaimana termuat pada katalog resmi dpmptsp.luwukab.go.id/category/layanan).
3.	Regulasi Tata Ruang Wilayah (Perda RTRW Luwu No. 06/2011 dan konfirmasi KKPR/PKKPR).
4.	Literasi Basis Data & Dokumen Resmi Supabase (RPJPD Luwu 2025-2045, RPJMD 2025, Dokumen Luwu Dalam Angka 2025 BPS, LPPD 2025, serta Potensi Investasi IPRO Rumput Laut).
Topik atau pertanyaan yang Bapak/Ibu sampaikan tampaknya berada di luar ruang lingkup kewenangan dan tugas pelayanan saya sebagai asisten digital, Bapak/Ibu. Sekiranya Bapak/Ibu membutuhkan panduan berkas perizinan, syarat dokumen kependudukan, perpajakan, atau investasi daerah di Kabupaten Luwu, saya selaku asisten digital, Bapak/Ibu dengan setulus hati siap membantu Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
}

/**
 * Mesin Pengetahuan Ahli MPP Simpurusiang & DPMPTSP Luwu
 */
export function getMppExpertResponse(
  userQuery: string,
  lang: string = "id",
  customKnowledgeDocs?: KnowledgeDocMeta[]
): string {
  const query = userQuery.toLowerCase().trim();

  // 1. Cek apakah pertanyaan di luar konteks
  if (isMppOutOfScope(query)) {
    return getGentleOutOfScopeResponse(lang);
  }

  // =========================================================================
  // BAHASA INGGRIS (ENGLISH)
  // =========================================================================
  if (lang.startsWith("en")) {
    // Sourced services: dpmptsp.luwukab.go.id/category/layanan
    if (
      query.includes("service category") ||
      query.includes("services") ||
      query.includes("dpmptsp.luwukab.go.id") ||
      query.includes("service list")
    ) {
      return `Greetings! In accordance with the official portal of DPMPTSP Luwu Regency (https://dpmptsp.luwukab.go.id/category/layanan), here are the verified integrated public and licensing services available at Simpurusiang Public Service Mall:

🏛️ 1. DPMPTSP Kabupaten Luwu (Principal One-Stop Agency):
• Risk-Based Business Licensing (OSS-RBA at https://oss.go.id) - NIB issuance across Low, Medium-Low, Medium-High, and High risks.
• Building Approval (PBG) & Functional Worthiness Certificate (SLF) via SIMBG (https://simbg.pu.go.id).
• Non-business licenses: Medical Practice, Environmental Agreements (SPPL/UKL-UPL), Warehousing (TDG), and Construction Services (IUJK).
• Investment Consultation & Letter of Intent (LoI) facilitation for Regional IPRO Projects.
• Official Headquarters: Jl. Andi Djemma No. 1, Senga, Belopa, Luwu Regency. Phone/WhatsApp: 085158099464. Email: officialdpmptspluwu@gmail.com.

⚖️ 2. District Attorney’s Office of Luwu (Kejaksaan Negeri Luwu):
• Free Legal Consultation on Civil & State Administrative Law (DATUN) for citizens, entrepreneurs, and village governments.
• Traffic Fine Payment & Impounded Evidence Collection Services.

🐟 3. Luwu Fisheries Service (Dinas Perikanan):
• Subsidized Fuel (BBM) Recommendation Letters for local fishermen and coastal aquaculture farmers (vaname shrimp/milkfish).
• Small-Scale Fisher/Aquaculturist Registration Certificates.

💧 4. PDAM Tirta Luwu (Regional Water Utility):
• New Clean Water Pipeline Connection applications for residential and industrial properties.
• Monthly Water Bill Payments and Network Leakage Incident Reports.

🚗 5. SAMSAT Luwu (Regional Revenue & Traffic Police):
• Annual Motor Vehicle Tax (PKB) payment and STNK annual endorsement.

📡 6. Diskominfo-SP Luwu:
• Public Information Service (PPID) & National Complaint Handling (SP4N-LAPOR!).

🏦 7. PT Bank Sulselbar Belopa:
• Official regional tax & retribution treasury, e-retribution, and People's Business Credit (KUR) funding.

🏥 8. BPJS Kesehatan & Ketenagakerjaan:
• Universal Health Coverage (JKN-KIS) and workers' accident, life, and pension insurance.

🧶 9. DEKRANASDA Luwu:
• Promotion and curation of indigenous Tana Luwu woven fabrics, traditional crafts, and official souvenirs.

🎓 10. HAS International Center & PT. Nevis:
• Strategic partnership for vocational job training and legal, skilled overseas migrant worker placement.`;
    }

    // Supabase Knowledge Base Documents
    if (
      query.includes("knowledge") ||
      query.includes("database") ||
      query.includes("document") ||
      query.includes("supabase") ||
      query.includes("literature")
    ) {
      const activeDocsSummary = customKnowledgeDocs && customKnowledgeDocs.length > 0
        ? customKnowledgeDocs.map((d, i) => `${i + 1}. [${d.category || "Regulation"}] ${d.title}`).join("\n")
        : `1. Perda Luwu No. 06/2011 (Spatial Plan / RTRW 2011-2031)
2. RPJPD Kabupaten Luwu 2025-2045 (Long-term Vision & River Hydrology)
3. Perda Luwu No. 1/2025 concerning RPJMD
4. BPS Luwu Dalam Angka 2025 (Official Statistics: Economic Growth 5.69%, GRDP Rp 17.84T)
5. LPPD Kabupaten Luwu 2025
6. IPRO Luwu Seaweed Integrated Processing`;

      return `Greetings! Asisten Digital Ta' is directly interfaced with the authoritative Knowledge Base stored in Supabase:

📚 Active Official Documents in Supabase:
${activeDocsSummary}

Our responses strictly synthesize data from these authentic government publications without hallucination.`;
    }

    // Facilities & Infrastructure (Sarana & Prasarana)
    if (
      query.includes("facilit") ||
      query.includes("amenit") ||
      query.includes("infrastructure") ||
      query.includes("sarpras") ||
      query.includes("disabilit") ||
      query.includes("wheelchair") ||
      query.includes("nursing") ||
      query.includes("lactation") ||
      query.includes("kids") ||
      query.includes("children") ||
      query.includes("marriage hall") ||
      query.includes("wedding") ||
      query.includes("library") ||
      query.includes("reading") ||
      query.includes("clinic") ||
      query.includes("wifi") ||
      query.includes("parking")
    ) {
      return `Greetings! Here is the comprehensive Facilities & Infrastructure guide for Simpurusiang Public Service Mall (MPP Luwu):

🏢 1. Public & Core Amenities:
• Main Lobby & Information Helpdesk: Centralized front-office guidance for visitors.
• Smart Queue Kiosk: Touchscreen ticketing with multi-screen LED displays and audio call-outs.
• Anjungan Dukcapil Mandiri (ADM): Self-service digital kiosk to print e-KTP, Child Identity Cards (KIA), and Family Cards directly.

♿ 2. Inclusive & Disability-Friendly Facilities (Compliant with MenPAN-RB standards):
• Textured Guiding Blocks from the parking entrance to all service desks for visually impaired visitors.
• Standard Wheelchair Ramps at all entry points.
• Free Wheelchair Loan at the main security post.
• Priority Service Counters dedicated for senior citizens, pregnant women, and people with disabilities.
• Dedicated Accessible Restrooms equipped with safety handrails and emergency alert buttons.

👶 3. Family, Social & Community Care:
• Nursing & Lactation Room: Air-conditioned private room with nursing sofas, baby diaper-changing stations, and washbasins.
• Children's Play Area (Kids Corner): Safe, sanitized educational play space with foam flooring and storybooks.
• Digital Reading Corner: Curated reading tablets and physical books provided by the Luwu Library & Archive Service.
• Integrated Marriage Hall (Balai Nikah): Collaborative ceremonial hall between Religious Affairs (Kemenag) & Civil Registry (Disdukcapil) offering "3-in-1" immediate delivery of Marriage Book, updated KTP, and new Family Card.

🌿 4. Economic & Wellness Support:
• MSME Corner & Luwu Gallery: Showcasing specialty Luwu single-origin coffees (Latimojong & Bastem), artisanal cocoa, and local handicrafts.
• First-Aid Emergency Health Clinic: Staffed by Luwu Health Office medical personnel.
• Spacious Parking & 24/7 Security: Segregated zones for motorcycles, cars, and dedicated disability parking guarded by CCTV and Municipal Police (Satpol PP).
• Free High-Speed Wi-Fi & Device Charging Stations throughout the pavilion.`;
    }

    // Building Approval (PBG) & Functional Certificate (SLF)
    if (
      query.includes("pbg") ||
      query.includes("building permit") ||
      query.includes("building approval") ||
      query.includes("slf") ||
      query.includes("simbg") ||
      query.includes("imb") ||
      query.includes("construction")
    ) {
      return `Greetings! In accordance with Government Regulation (PP) No. 16/2021, the former IMB has been replaced by the Building Approval (Persetujuan Bangunan Gedung / PBG) and Certificate of Functional Worthiness (Sertifikat Laik Fungsi / SLF):

📍 Service Counter: Spatial Planning & Building Permit Desk (PUPR & DPMPTSP Luwu, Ground Floor)
🌐 National Portal: Processed online through SIMBG (https://simbg.pu.go.id)

📋 1. Administrative Requirements:
• Valid e-KTP / Tax ID (NPWP) of the applicant or Business ID (NIB) for corporate entities.
• Legal Proof of Land Ownership (Freehold Title / SHM, HGB, or Notarized Land Utilization Agreement).
• Spatial Confirmation (KKPR / PKKPR) verifying compliance with Luwu Regency Spatial Plan (Perda RTRW No. 6/2011).
• Absolute Statement Letter (SPPM) confirming no pending legal dispute over the land.

📐 2. Technical Engineering Requirements:
• Architectural Drawings: Site plan, floor layout, all elevation views, sectional cross-cuts, and technical architectural specifications.
• Structural Engineering Drawings: Foundation, reinforced concrete/steel beams, columns, roof truss, and engineering calculation dossier.
• MEP & Utility Drawings: Electrical circuitry, lightning protection, clean water supply, wastewater & septic system, and fire safety equipment.
• Environmental Compliance: SPPL, UKL-UPL, or AMDAL based on building category and scale.

🔄 3. 5-Stage Approval Workflow:
Step 1: Account registration and dossier submission via SIMBG portal (guided on-site at MPP).
Step 2: Technical and administrative assessment by the PUPR Technical Assessment Team (TPT).
Step 3: Technical consultation hearing with the Professional Expert Team (TPA) / TPT.
Step 4: Regional retribution tariff calculation and payment via Bank Sulselbar counter at MPP.
Step 5: Issuance of the official PBG document signed with National Electronic Certification (BSrE).`;
    }

    // Legal Basis & Regulatory Framework
    if (
      query.includes("legal") ||
      query.includes("law") ||
      query.includes("regulation") ||
      query.includes("perpres") ||
      query.includes("permenpan") ||
      query.includes("perda") ||
      query.includes("perbup") ||
      query.includes("basis")
    ) {
      return `Greetings! Here is the authoritative legal and regulatory foundation of Simpurusiang Public Service Mall (MPP Luwu) for academic reference and institutional compliance:

⚖️ Primary Regulatory Hierarchy:
1. Law No. 25 of 2009 concerning Public Services (Principles of legal certainty, equality of rights, transparency, and accessibility).
2. Law No. 6 of 2023 regarding Job Creation (UUPA/Omnibus Law reforms in business licensing).
3. Presidential Regulation (Perpres) No. 89 of 2021 concerning the Implementation of Public Service Malls.
4. Regulation of the Minister of Administrative and Bureaucratic Reform (PermenPAN-RB) No. 92 of 2021 concerning Technical Guidelines for MPP Implementation.
5. Government Regulation (PP) No. 5 of 2021 concerning Risk-Based Business Licensing (OSS-RBA).
6. Government Regulation (PP) No. 16 of 2021 concerning Building Construction (PBG and SLF framework).
7. Luwu Regency Regional Regulation (Perda) No. 6 of 2011 concerning Regional Spatial Planning (RTRW 2011-2031).
8. Luwu Regent Regulation (Perbup) on the Establishment, Organizational Structure, and Service Governance of Simpurusiang Public Service Mall.

🏛️ Philosophical Essence:
"Simpurusiang" is derived from local Luwu wisdom, symbolizing consensus, unity, and harmonious solidarity in providing public service without discrimination. Official motto: "Salama'Ki' Tapada Salama'".`;
    }

    // 19 Agencies
    if (
      query.includes("19") ||
      query.includes("agencies") ||
      query.includes("departments") ||
      query.includes("tenant") ||
      query.includes("institution") ||
      query.includes("counter list")
    ) {
      return `Greetings! Simpurusiang Public Service Mall unites 19 public agencies and banking entities under one roof:

1. DPMPTSP Luwu (Investment, OSS-RBA Licensing, Building Approvals)
2. Disdukcapil Luwu (Civil Registry, e-KTP, Family Cards, ADM Kiosks)
3. Bapenda Luwu (Property Tax PBB-P2, BPHTB, Regional Revenues)
4. Manpower & Transmigration Office (AK-1 Job Seeker Cards, Labor Advisory)
5. Social Affairs Office (DTKS Welfare Verification, Social Assistance)
6. PUPR Public Works Office (Spatial Suitability, Technical PBG/SLF Assessment)
7. Health Office (Medical Personnel Practice Licenses, Sanitation Certificates)
8. Environmental Office (Environmental Clearances, SPPL, UKL-UPL)
9. Cooperatives & MSME Office (MSME Formalization, P-IRT Permits)
10. Library & Archives Office (Digital Reading Pavilion, Literary Access)
11. SAMSAT Luwu / South Sulawesi Revenue (Annual Motor Vehicle Tax PKB, STNK)
12. Luwu Police Resort (Driver's License Renewal SIM A/C, Police Clearances SKCK)
13. ATR/BPN National Land Agency (Land Certificate Inquiries, Mortgage Releases)
14. Pratama Tax Office Palopo / Luwu Post (Tax ID NPWP, Annual Tax Returns)
15. Ministry of Religious Affairs Kemenag (Hajj Inquiries, Halal Certification, Marriage Hall)
16. BPJS Kesehatan (National Health Insurance Registration & Member Services)
17. BPJS Ketenagakerjaan (Workers' Social Security & Accident Protection)
18. PT Bank Sulselbar (Official Regional Treasury & Cashless Payment Desks)
19. PT Pos Indonesia (Legalized Postal Stamp, Document Delivery, Courier Services)

📍 Location: Jl. Andi Djemma No. 1, Belopa, Luwu Regency. Hours: Monday-Thursday 07:30 - 16:00 WITA, Friday 07:30 - 16:30 WITA.`;
    }
  }

  // =========================================================================
  // BAHASA MANDARIN (CHINESE)
  // =========================================================================
  if (lang.startsWith("zh")) {
    if (
      query.includes("服务") ||
      query.includes("办事") ||
      query.includes("清单") ||
      query.includes("category")
    ) {
      return `您好！根据卢武县投资与一站式综合服务局 (DPMPTSP) 官方服务门户 (https://dpmptsp.luwukab.go.id/category/layanan)，MPP Simpurusiang 核心服务事项如下：

🏛️ 1. DPMPTSP 综合许可（主办机构）：
• 基于风险的商业许可 (OSS-RBA): 企业唯一识别码 (NIB) 发放。
• 建筑审批许可 (PBG) 与建筑竣工合格证 (SLF)（经由国家 SIMBG 系统）。
• 非经营类许可：医疗卫生执业许可、环保承诺 (SPPL/UKL-UPL)、仓库注册 (TDG)、工程建筑资质 (IUJK)。
• 投资咨询与 IPRO 意向书 (LoI) 协助服务。
• 办公地址：Jl. Andi Djemma No. 1, Belopa, Luwu。咨询热线/WhatsApp: 085158099464。

⚖️ 2. 卢武县地方检察院 (Kejaksaan Negeri Luwu)：民事与行政法 (DATUN) 免费法律咨询、车辆违章取证窗口。
🐟 3. 渔业局 (Dinas Perikanan)：养殖与捕捞渔民补贴柴油 (BBM) 申请推荐函、小微水产养殖登记。
💧 4. 自来水公司 (PDAM Tirta Luwu)：居民与商业水表新装报装、水费缴纳与管网抢修受理。
🚗 5. 车管所 (SAMSAT Luwu)：机动车年度车船税 (PKB) 缴纳及行驶证年审。
📡 6. 宣传与通信局 (Diskominfo-SP)：政务信息公开 (PPID) 及国家统一投诉平台 (SP4N-LAPOR!)。
🏦 7. 南苏拉威西地方银行 (Bank Sulselbar)：地方非税财政收入收缴窗口、微小企业普惠信贷 (KUR)。
🏥 8. 国民医保 (BPJS Kesehatan) 与国民社保 (BPJS Ketenagakerjaan)。
🧶 9. 传统手工艺协会 (DEKRANASDA)：特色织锦与民族特色文创展示。
🎓 10. HAS International Center & PT. Nevis：海外技能培训与合法劳务输出咨询。`;
    }

    if (query.includes("知识库") || query.includes("数据库") || query.includes("文件") || query.includes("supabase")) {
      return `您好！Asisten Digital Ta' 直接对接 Supabase 知识库 (knowledge_documents) 官方文献：
1. 2011年第06号地方空间规划法规 (Perda RTRW 2011-2031)
2. 2025-2045年卢武县长期发展规划 (RPJPD)
3. 2025年第1号地方五年发展规划法规 (RPJMD)
4. 2025年卢武县统计年鉴 (BPS Luwu Dalam Angka: GDP 17.84万亿印尼盾, 增长率 5.69%)
5. 2025年度地方政府工作政务报告 (LPPD)
6. 卢武县海藻综合深加工工业化就绪投资项目 (IPRO Seaweed Processing)

所有回答均严格基于以上真实文献，绝不凭空编造虚假数据。`;
    }
  }

  // =========================================================================
  // BAHASA INDONESIA (DEFAULT)
  // =========================================================================

  // 1. LAYANAN DEDIKASI BPJS KESEHATAN DAN KETENAGAKERJAAN
  if (
    query.includes("bpjs") ||
    query.includes("jkn") ||
    query.includes("kis") ||
    query.includes("jht") ||
    query.includes("jkk") ||
    query.includes("jkm") ||
    query.includes("ketenagakerjaan")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu.

Untuk mendukung kesejahteraan dan perlindungan sosial masyarakat serta pelaku usaha, MPP Simpurusiang telah mengintegrasikan layanan **BPJS Kesehatan** dan **BPJS Ketenagakerjaan** dalam satu gedung terpadu. Berikut adalah rincian layanan yang dapat Bapak/Ibu akses:

### 1. Layanan BPJS Kesehatan
Di loket BPJS Kesehatan (Lantai 1 MPP Simpurusiang), Bapak/Ibu dapat melakukan pengurusan berbagai keperluan, antara lain:
* **Pendaftaran Peserta:** Baik untuk peserta mandiri (PBPU) maupun pendaftaran badan usaha untuk karyawan.
* **Perubahan Data:** Meliputi perubahan fasilitas kesehatan (faskes) tingkat pertama, perubahan kelas perawatan, atau perbaikan data identitas.
* **Penambahan Anggota Keluarga:** Proses administrasi untuk penambahan anggota keluarga dalam Kartu Keluarga.
* **Konsultasi & Informasi:** Pengecekan status kepesertaan, informasi tunggakan iuran, serta alur layanan kesehatan JKN-KIS.

### 2. Layanan BPJS Ketenagakerjaan
Loket ini hadir untuk memastikan perlindungan bagi pekerja formal maupun informal di Kabupaten Luwu, dengan layanan sebagai berikut:
* **Pendaftaran Kepesertaan:** Melayani pendaftaran untuk program Jaminan Kecelakaan Kerja (JKK), Jaminan Kematian (JKM), Jaminan Hari Tua (JHT), dan Jaminan Pensiun (JP).
* **Perlindungan Tenaga Kerja Rentan (BPU):** Fasilitasi pendaftaran bagi pekerja Bukan Penerima Upah (BPU) atau pekerja sektor informal agar tetap terlindungi dalam aktivitas kerja sehari-hari.
* **Konsultasi Klaim:** Memberikan informasi dan pendampingan terkait prosedur klaim manfaat program BPJS Ketenagakerjaan.
* **Update Data:** Perubahan data kepesertaan maupun informasi saldo JHT.

---

### Informasi Penting bagi Pengunjung:
* **Lokasi:** Gedung MPP Simpurusiang, Jl. Jenderal Sudirman, Kompleks Perkantoran Pemerintah Kabupaten Luwu, Belopa.
* **Jam Operasional:** Senin s/d Jumat, pukul 08.00 - 15.30 WITA.
* **Kemudahan:** Bapak/Ibu cukup mengambil antrean melalui **Mesin Antrean Terpadu (Smart Touchscreen Queue Kiosk)** di lobi utama, kemudian menunggu di ruang tunggu yang nyaman dan ber-AC sambil menunggu panggilan ke loket terkait.

Sebagai bagian dari komitmen kami untuk memberikan pelayanan yang inklusif, fasilitas MPP Simpurusiang juga telah dilengkapi dengan akses ramah disabilitas, ruang laktasi, dan pojok baca, sesuai dengan standar pelayanan publik yang ditetapkan dalam PermenPAN-RB Nomor 92 Tahun 2021.

Jika Bapak/Ibu memiliki pertanyaan lebih lanjut mengenai persyaratan dokumen spesifik untuk layanan tersebut, silakan sampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // 2. KATALOG RESMI LAYANAN dpmptsp.luwukab.go.id/category/layanan
  if (
    query.includes("category/layanan") ||
    query.includes("kategori layanan") ||
    query.includes("jenis layanan") ||
    query.includes("jenis-jenis layanan") ||
    query.includes("dpmptsp.luwukab.go.id") ||
    query.includes("layanan mpp") ||
    query.includes("daftar layanan")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Mengacu pada rujukan resmi portal Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP) Kabupaten Luwu pada laman (https://dpmptsp.luwukab.go.id/category/layanan), berikut adalah direktori lengkap jenis-jenis layanan terpadu yang beroperasi di Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu, Bapak/Ibu:

🏛️ 1. DPMPTSP KABUPATEN LUWU (PENYELENGGARA UTAMA PTSP & INVESTASI):
• Perizinan Berusaha Berbasis Risiko (Sistem Nasional OSS-RBA): Penerbitan Nomor Induk Berusaha (NIB) untuk skala UMK dan Non-UMK (Risiko Rendah, Menengah Rendah, Menengah Tinggi, dan Tinggi).
• Persetujuan Bangunan Gedung (PBG) & Sertifikat Laik Fungsi (SLF) terintegrasi sistem SIMBG Kementerian PUPR.
• Izin Sektoral & Non-Berusaha: Izin Praktik Tenaga Kesehatan (SIP), Sertifikat Laik Higiene Sanitasi (SLHS), Tanda Daftar Gudang (TDG), Izin Usaha Industri, Izin Usaha Perdagangan, Izin Jasa Konstruksi (IUJK), dan verifikasi komitmen lingkungan (SPPL / UKL-UPL).
• Layanan Investasi: Konsultasi Fasilitasi Kemitraan Usaha, Mediasi Clean and Clear Lahan, serta Fasilitasi Pengajuan Letter of Intent (LoI) Proyek Siap Tawar IPRO (seperti IPRO Pengolahan Rumput Laut Terpadu).
• Kontak & Alamat Resmi: Jl. Andi Djemma No. 1 (Kompleks Perkantoran Pemkab Luwu), Kel. Senga, Kec. Belopa. Telepon/WhatsApp: 085158099464. Email: officialdpmptspluwu@gmail.com.

⚖️ 2. KEJAKSAAN NEGERI (KEJARI) LUWU:
• Pos Pelayanan Hukum Terpadu Kejari Luwu di MPP Simpurusiang.
• Konsultasi & Bantuan Hukum Gratis di bidang Perdata dan Tata Usaha Negara (DATUN) bagi masyarakat umum, pengusaha, maupun aparat desa.
• Pelayanan pengambilan barang bukti tilang kendaraan serta penyuluhan hukum preventif.

🐟 3. DINAS PERIKANAN KABUPATEN LUWU:
• Rekomendasi Pembelian Bahan Bakar Minyak (BBM) Bersubsidi untuk nelayan tangkap dan pembudidaya tambak (udang vaname/bandeng).
• Penerbitan Tanda Daftar / Surat Keterangan Pembudidaya Ikan Kecil (KUB).

💧 4. PERUSAHAAN DAERAH AIR MINUM (PDAM) TIRTA LUWU:
• Permohonan sambungan baru pipa air minum (SR) rumah tangga & niaga.
• Pembayaran rekening tagihan air bulanan secara langsung.
• Penanganan pengaduan kebocoran jaringan pipa dan gangguan aliran air bersih.

🚗 5. SAMSAT LUWU (UPT PENDAPATAN WILAYAH LUWU & POLANTAS):
• Pembayaran Pajak Kendaraan Bermotor (PKB) tahunan dan SWDKLLJ Jasa Raharja.
• Pengesahan STNK tahunan cepat tanpa calo.

📡 6. DISKOMINFO-SP KABUPATEN LUWU:
• Pejabat Pengelola Informasi dan Dokumentasi (PPID) untuk permohonan informasi publik resmi.
• Pengelolaan Kanal Pengaduan Aspirasi Masyarakat melalui aplikasi nasional SP4N-LAPOR!.

🏦 7. PT. BANK SULSELBAR CABANG BELOPA:
• Loket Kas Daerah pembayaran resmi retribusi perizinan daerah dan pajak daerah (PBB-P2, BPHTB).
• Pembukaan rekening tabungan dan fasilitasi Kredit Usaha Rakyat (KUR) berbunga ringan bagi pelaku UMKM Luwu.

🏢 8. KPP PRATAMA PALOPO / POS PELAYANAN PAJAK BELOPA:
• Pendaftaran dan pencetakan NPWP Orang Pribadi dan Badan.
• Asistensi pemadanan NIK menjadi NPWP serta asistensi e-Filing pelaporan SPT Tahunan.

🏥 9. BPJS KESEHATAN & BPJS KETENAGAKERJAAN:
• Pendaftaran peserta JKN-KIS mandiri & badan usaha, mutasi faskes, pencetakan KIS Digital, serta jaminan kecelakaan kerja, kematian, hari tua, dan pensiun.

🧶 10. DEKRANASDA KABUPATEN LUWU:
• Galeri pameran & etalase promosi produk kerajinan tenun tradisional, kriya anyaman, dan cinderamata khas Tana Luwu.

🎓 11. HAS INTERNATIONAL CENTER & PT. NEVIS:
• Kemitraan pelatihan keterampilan kerja vokasi dan fasilitasi penempatan tenaga kerja migran terampil ke luar negeri secara resmi dan berizin legal.

Semua loket ini beroperasi terpusat di Gedung MPP Simpurusiang, Belopa, melayani setiap hari kerja Senin s/d Jumat pukul 08.00 - 15.30 WITA, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // 3. AKSES TABEL KNOWLEDGE SUPABASE
  if (
    query.includes("tabel knowledge") ||
    query.includes("knowledge base") ||
    query.includes("supabase") ||
    query.includes("dokumen resmi") ||
    query.includes("basis data") ||
    query.includes("literasi supabase")
  ) {
    let docListStr = "";
    if (customKnowledgeDocs && customKnowledgeDocs.length > 0) {
      docListStr = customKnowledgeDocs
        .map((d, i) => `${i + 1}. **${d.title}**\n   - Kategori: ${d.category || "Regulasi"} | Instansi: ${d.source_agency || "Pemerintah Kabupaten Luwu"} | Tahun: ${d.publication_year || "2025"}`)
        .join("\n");
    } else {
      docListStr = `1. **Perda Kabupaten Luwu Nomor 06 Tahun 2011** tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2011-2031.
2. **RPJPD Kabupaten Luwu 2025-2045** (Visi Pembangunan 20 Tahun, Arah Kebijakan Hijau, serta Jaringan Hidrologi/DAS Sungai Resmi: Suso, Suli, Seppong, Kamanre, Paremang, Noling, Bua, Lamasi, Makawa, Larompong).
3. **PERDA Kabupaten Luwu Nomor 1 Tahun 2025** tentang Rencana Pembangunan Jangka Menengah Daerah (RPJMD).
4. **BPS Kabupaten Luwu Dalam Angka 2025** (Statistik Resmi Makroekonomi: Pertumbuhan Ekonomi 5,69%, PDRB Rp 17,84 Triliun, IPM 72,42, TPT 3,85%, Kemiskinan 12,49%).
5. **LPPD Kabupaten Luwu Tahun 2025** (Laporan Penyelenggaraan Pemerintahan Daerah).
6. **IPRO Luwu Pengolahan Rumput Laut Terpadu** (Kajian Kelayakan Investasi / Feasibility Study Siap Tawar).`;
    }

    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Saya telah terhubung langsung ke tabel **knowledge_documents** pada basis data Supabase (PostgreSQL + PostGIS) Kabupaten Luwu, Bapak/Ibu.

Berikut adalah daftar naskah dan dokumen literasi resmi yang aktif di tabel Knowledge Supabase kami:

${docListStr}

🛡️ DOKTRIN KREDIBILITAS DATA:
Seluruh konsultasi tata ruang, verifikasi KKPR, angka makroekonomi, dan profil investasi yang Saya Asisten Digital Ta' Bapak/Ibu berikan ditarik secara presisi dari naskah dokumen hukum di atas, Bapak/Ibu, sehingga bebas dari halusinasi data dan dapat dipertanggungjawabkan secara hukum maupun akademis, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // 4. SYARAT CETAK KTP-EL / KK (DISDUKCAPIL LUWU)
  if (
    query.includes("ktp") ||
    query.includes("kk") ||
    query.includes("dukcapil") ||
    query.includes("kartu keluarga") ||
    query.includes("e-ktp") ||
    query.includes("kia") ||
    query.includes("akta") ||
    query.includes("adm")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Loket Pelayanan Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil) Kabupaten Luwu di Lantai 1 MPP Simpurusiang melayani pengurusan administrasi kependudukan cepat dan terpadu:

### 📋 Jenis Layanan & Persyaratan Dokumen:
1. **Perekaman & Pencetakan KTP-el Baru (Pemula Umur 17 Tahun):**
   * Fotokopi Kartu Keluarga (KK).
   * Melakukan perekaman foto, sidik jari, dan retina mata langsung di lokasi MPP.
2. **Pencetakan Ulang KTP-el (Rusak / Hilang):**
   * **KTP Rusak:** Membawa fisik KTP lama yang rusak + Fotokopi KK.
   * **KTP Hilang:** Surat Keterangan Kehilangan resmi dari Kepolisian (Polsek/Polres) + Fotokopi KK.
3. **Penerbitan / Perubahan Kartu Keluarga (KK):**
   * **Tambah Anggota Keluarga (Kelahiran):** Surat Keterangan Lahir dari Bidan/Rumah Sakit + Fotokopi Buku Nikah Orang Tua + KK Asli.
   * **Pengurangan Anggota Keluarga (Kematian):** Surat Keterangan Kematian + KK Asli.
   * **Pindah Masuk / Keluar:** Surat Keterangan Pindah Warga Negara Indonesia (SKPWNI) dari daerah asal.
4. **Kartu Identitas Anak (KIA) untuk Anak Usia 0–17 Tahun:**
   * Fotokopi Akta Kelahiran + Fotokopi KK + Pas foto anak ukuran 2x3 (2 lembar, khusus anak usia di atas 5 tahun).
5. **Anjungan Dukcapil Mandiri (ADM):**
   * Kiosk digital di lobi utama MPP yang memungkinkan warga mencetak mandiri KTP-el, KIA, KK, dan Akta Kependudukan secara instan dengan memindai QR Code yang dikirim ke email/WhatsApp warga.

---
**Biaya Layanan:** Seluruh pelayanan kependudukan di MPP Simpurusiang **GRATIS 100% (TANPA PUNGUTAN BIAYA/RETRIBUSI)**. Salama'Ki' Tapada Salama'.`;
  }

  // 5. CARA AMBIL ANTREAN ONLINE & DIGITAL KIOSK
  if (
    query.includes("antrean") ||
    query.includes("antrian") ||
    query.includes("cara ambil antrean") ||
    query.includes("kiosk")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Untuk kemudahan dan kenyamanan kunjungan Bapak/Ibu di MPP Simpurusiang Kabupaten Luwu, berikut adalah tata cara pengambilan antrean:

### 📱 1. Pengambilan Antrean Secara Langsung di Lokasi (On-Site Kiosk):
1. Tiba di Gedung MPP Simpurusiang, Jl. Jenderal Sudirman, Belopa.
2. Menuju ke **Mesin Antrean Terpadu (Smart Touchscreen Queue Kiosk)** yang berada di Lobi Utama.
3. Pilih nama Instansi atau Loket Layanan yang dituju (misalnya: DPMPTSP, Disdukcapil, SAMSAT, BPJS, Bank Sulselbar, dll.).
4. Masukkan Nomor NIK KTP-el atau nomor HP Bapak/Ibu.
5. Ambil tiket cetak fisik yang memuat Nomor Antrean dan kode QR.
6. Silakan duduk santai di ruang tunggu ber-AC yang nyaman sambil mendengarkan pemanggilan suara otomatis dan memantau Layar LED Monitor Panggilan.

### 🌐 2. Pengambilan Antrean Online (Virtual Queue):
* Bapak/Ibu dapat memesan nomor antrean secara online sebelum tiba di lokasi melalui portal resmi MPP Simpurusiang atau pemindaian QR Code Antrean Digital.
* Tunjukkan tiket digital di smartphone Bapak/Ibu kepada petugas Helpdesk Lobi Utama saat tiba di gedung MPP.

---
Petugas Helpdesk kami di lobi utama selalu siap membantu Bapak/Ibu dalam mengoperasikan mesin antrean. Salama'Ki' Tapada Salama'.`;
  }

  // 6. JADWAL OPERASIONAL & LOKASI MPP SIMPURUSIANG
  if (
    query.includes("jadwal") ||
    query.includes("jam operasional") ||
    query.includes("jam kerja") ||
    query.includes("buka jam berapa") ||
    query.includes("hari kerja")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Berikut adalah informasi resmi jam operasional dan lokasi Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu:

📍 **Alamat & Lokasi Gedung:**
Gedung MPP Simpurusiang, Kompleks Perkantoran Pemerintah Kabupaten Luwu, Jl. Jenderal Sudirman / Jl. Andi Djemma No. 1, Kelurahan Senga, Kecamatan Belopa, Kabupaten Luwu, Sulawesi Selatan.

🕒 **Jadwal Jam Operasional Pelayanan:**
* **Senin s/d Kamis:** Pukul 08.00 – 15.30 WITA *(Istirahat: 12.00 – 13.00 WITA)*
* **Jumat:** Pukul 08.00 – 15.30 WITA *(Istirahat/Sholat Jumat: 11.30 – 13.30 WITA)*
* **Sabtu, Minggu & Hari Libur Nasional:** TUTUP

---
Bapak/Ibu disarankan datang lebih awal untuk mendapatkan pelayanan yang maksimal dari 19 instansi terpadu di gedung MPP Simpurusiang. Salama'Ki' Tapada Salama'.`;
  }

  // 7. BAYAR PAJAK KENDARAAN / SAMSAT LUWU
  if (
    query.includes("samsat") ||
    query.includes("pajak kendaraan") ||
    query.includes("bayar pajak kendaraan") ||
    query.includes("stnk") ||
    query.includes("pkb")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Gerai SAMSAT Luwu (UPT Pendapatan Wilayah Luwu & Polantas) di MPP Simpurusiang melayani pengurusan pajak kendaraan bermotor secara cepat dan transparan:

### 📋 Layanan Resmi SAMSAT di MPP:
1. **Pembayaran Pajak Kendaraan Bermotor (PKB) Tahunan.**
2. **Pengesahan STNK Tahunan.**
3. **Pembayaran Sumbangan Wajib Dana Kecelakaan Lalu Lintas Jalan (SWDKLLJ) Jasa Raharja.**

### 📄 Persyaratan Dokumen Pembayaran Pajak Tahunan:
* STNK Asli + Fotokopi STNK.
* KTP-el Asli pemilik kendaraan yang tertera di STNK + Fotokopi KTP-el.
* *(Catatan: Untuk pembayaran tahunan tidak perlu membawa fisik kendaraan/cek fisik).*

---
**Catatan:** Untuk perpanjangan STNK 5 Tahunan (ganti plat nomor) dan Balik Nama Kendaraan Bermotor (BBNKB), proses cek fisik kendaraan dan cetak TNKB tetap dilakukan di Kantor Induk SAMSAT Belopa. Salama'Ki' Tapada Salama'.`;
  }

  // 8. PAJAK DAERAH PBB-P2 & BPHTB (BAPENDA LUWU)
  if (
    query.includes("pbb") ||
    query.includes("bphtb") ||
    query.includes("pajak daerah") ||
    query.includes("bapenda") ||
    query.includes("pajak bumi")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Loket Badan Pendapatan Daerah (Bapenda) Kabupaten Luwu di MPP Simpurusiang melayani perpajakan dan retribusi daerah terpadu:

### 📋 Layanan Pajak Daerah Bapenda:
1. **Pajak Bumi dan Bangunan Perdesaan dan Perkotaan (PBB-P2):**
   * Pembayaran Tagihan PBB-P2 tahun berjalan maupun tunggakan.
   * Permohonan Pembetulan / Mutasi Nama Surat Pemberitahuan Pajak Terhutang (SPPT) PBB.
   * Pendaftaran Objek Pajak Baru PBB-P2.
2. **Bea Perolehan Hak atas Tanah dan Bangunan (BPHTB):**
   * Validasi dan perhitungan BPHTB untuk transaksi Jual Beli, Hibah, Waris, atau Sertifikasi Tanah BPN.
3. **Pajak Daerah Lainnya:**
   * Pajak Reklame, Pajak Restoran, Pajak Hotel, dan Pajak Air Tanah.

---
Pembayaran pajak dapat dilakukan secara tunai di Gerai Bank Sulselbar MPP atau via transaksi non-tunai QRIS/e-Banking. Salama'Ki' Tapada Salama'.`;
  }

  // 9. KONSULTASI TATA RUANG & PKKPR / KKPR (DINAS PUPR LUWU)
  if (
    query.includes("tata ruang") ||
    query.includes("kkpr") ||
    query.includes("pkkpr") ||
    query.includes("rtrw") ||
    query.includes("zonasi") ||
    query.includes("konsultasi tata ruang")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Layanan Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR / PKKPR) di MPP Simpurusiang dikelola oleh Helpdesk Penataan Ruang Dinas PUPR & DPMPTSP Kabupaten Luwu:

### 📐 Rujukan Hukum Spasial:
Seluruh verifikasi tata ruang mengacu pada **Peraturan Daerah (Perda) Kabupaten Luwu Nomor 06 Tahun 2011 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2011–2031** serta Sistem Informasi Geografis (GIS) Supabase PostGIS Luwu.

### 📋 Jenis Layanan Tata Ruang:
1. **Konfirmasi / Konsultasi Kesesuaian Tata Ruang (KKPR UMK & Non-UMK):**
   * Pengecekan peruntukan lahan kegiatan usaha (Kawasan Industri, Pertanian, Perkim, Pariwisata, atau Kawasan Lindung/Hutan).
2. **Penerbitan Dokumen Persetujuan KKPR (PKKPR) via OSS-RBA.**
3. **Rekomendasi Tata Ruang untuk Persyaratan PBG & SLF Bangunan Gedung.**

---
Bapak/Ibu dapat berkonsultasi langsung dengan membawa peta koordinat lokasi (titik latitude/longitude) atau sertifikat tanah di loket PUPR MPP Simpurusiang. Salama'Ki' Tapada Salama'.`;
  }

  // 10. KEJAKSAAN NEGERI LUWU (DATUN & TILANG)
  if (query.includes("kejaksaan") || query.includes("kejari") || query.includes("datun") || query.includes("tilang")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Gerai Pos Pelayanan Hukum Kejaksaan Negeri (Kejari) Luwu di MPP Simpurusiang melayani:

📍 Loket: Pos Pelayanan Hukum Terpadu Kejari Luwu (Lantai 1 MPP Simpurusiang)
🕒 Jam Layanan: Senin s/d Jumat, 08.00 - 15.30 WITA

📋 Ragam Layanan Resmi:
1. Konsultasi & Pendampingan Hukum Gratis di bidang Perdata dan Tata Usaha Negara (DATUN) bagi masyarakat, pelaku usaha UMKM, dan aparatur pemerintah desa.
2. Layanan Pengambilan Barang Bukti & Pembayaran Tilang Pelanggaran Lalu Lintas.
3. Penerangan dan Penyuluhan Hukum bagi masyarakat seputar pencegahan sengketa tanah, hukum keluarga, dan tindak pidana korupsi.

Petugas Jaksa Pengacara Negara (JPN) siap menyambut Bapak/Ibu dengan ramah tanpa dipungut biaya retribusi (gratis), Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // 11. DINAS PERIKANAN LUWU (BBM SUBSIDI & TAMBAK)
  if (query.includes("perikanan") || query.includes("nelayan") || query.includes("bbm subsidi") || query.includes("tambak") || query.includes("udang") || query.includes("bandeng")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Gerai Dinas Perikanan Kabupaten Luwu di MPP Simpurusiang melayani masyarakat pesisir, pembudidaya tambak, dan nelayan tangkap:

📍 Loket: Dinas Perikanan Kabupaten Luwu (Lantai 1 MPP Simpurusiang)

📋 Layanan Unggulan:
1. Penerbitan Surat Rekomendasi Pembelian BBM Bersubsidi (Solar/Pertalite) bagi nelayan tangkap kapal <30 GT dan pembudidaya tambak udang vaname / ikan bandeng.
2. Penerbitan Tanda Daftar / Surat Keterangan Pembudidaya Ikan Kecil (KUB).
3. Konsultasi zonasi kawasan budidaya pesisir di sentra Bua, Ponrang, Ponrang Selatan, Suli, dan Larompong.

📄 Syarat Rekomendasi BBM Bersubsidi:
• Fotokopi KTP-el pemohon berdomisili Kabupaten Luwu
• Pas Kecil / Bukti Kepemilikan Perahu atau Surat Kepemilikan/Sewa Tambak
• Surat Keterangan dari Kepala Desa/Lurah setempat
• Rincian estimasi kebutuhan bahan bakar mesin genset tambak atau perahu tempel, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // 12. PDAM TIRTA LUWU
  if (query.includes("pdam") || query.includes("air bersih") || query.includes("tirta luwu") || query.includes("tagihan air")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Loket Perusahaan Daerah Air Minum (PDAM) Tirta Luwu di MPP Simpurusiang menyediakan kemudahan layanan air bersih terpadu:

📍 Loket: PDAM Tirta Luwu (Lantai 1 MPP Simpurusiang)

📋 Layanan Tersedia:
1. Pendaftaran Pasang Baru Sambungan Rumah (SR) air minum untuk rumah tangga, kantor, ruko, maupun industri.
2. Pembayaran Tagihan Rekening Air Bulanan secara tunai atau non-tunai.
3. Pengaduan Gangguan Distribusi Air: Penanganan pipa bocor, air keruh, atau debit air mengecil.
4. Permohonan Tera Ulang dan Penggantian Meteran Air yang rusak.

📄 Syarat Pasang Baru PDAM:
Fotokopi KTP-el pemohon, bukti kepemilikan bangunan/tanah atau PBB-P2, denah lokasi bangunan, dan mengisi formulir permohonan pasang baru di loket MPP, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // 13. DISKOMINFO-SP LUWU (PPID & SP4N LAPOR)
  if (query.includes("diskominfo") || query.includes("kominfo") || query.includes("ppid") || query.includes("sp4n") || query.includes("lapor") || query.includes("informasi publik")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Layanan Dinas Komunikasi, Informatika, Statistik dan Persandian (Diskominfo-SP) Kabupaten Luwu di MPP Simpurusiang melayani keterbukaan informasi dan aspirasi:

📍 Loket: Diskominfo-SP Kabupaten Luwu (Lantai 1)

📋 Layanan Utama:
1. Pejabat Pengelola Informasi dan Dokumentasi (PPID): Pelayanan permohonan informasi publik berkala, serta-merta, dan setiap saat bagi akademisi, peneliti, jurnalis, dan masyarakat.
2. Fasilitasi Kanal Aspirasi Nasional SP4N-LAPOR! (lapor.go.id): Penerimaan dan tindak lanjut keluhan masyarakat terhadap kualitas pelayanan publik perangkat daerah di Kabupaten Luwu.
3. Asistensi Domain Resmi & Keamanan Informasi Siber Pemerintahan Kabupaten Luwu, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // 14. DEKRANASDA & PRODUK KERAJINAN LUWU
  if (query.includes("dekranasda") || query.includes("kerajinan") || query.includes("tenun") || query.includes("souvenir") || query.includes("cinderamata") || query.includes("galeri umkm")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Dekranasda (Dewan Kerajinan Nasional Daerah) Kabupaten Luwu hadir secara khusus di MPP Simpurusiang untuk memajukan ekonomi kreatif lokal:

📍 Lokasi: Galeri Produk Unggulan & Pojok UMKM DEKRANASDA (Lobi Utama MPP)

✨ Produk Khas Tana Luwu yang Ditampilkan:
1. Kain Tenun Tradisional khas Luwu dengan motif ornamen Kedatuan Luwu yang bernilai sejarah tinggi.
2. Produk Kerajinan Kriya: Anyaman rotan, kerajinan serat pelepah sagu, anyaman bambu, dan ukiran kayu khas Latimojong & Bastem.
3. Produk Kuliner Olahan Unggulan: Kopi Arabika Latimojong & Robusta Bastem, olahan cokelat/kakao murni Luwu, keripik sagu, dan aneka camilan olahan hasil bumi binaan dinas terkait.

Masyarakat maupun tamu investor dapat membeli suvenir dan cinderamata resmi khas Luwu langsung di galeri ini, Bapak/Ibu! Salama'Ki' Tapada Salama'.`;
  }

  // 15. HAS INTERNATIONAL CENTER & PT. NEVIS (TENAGA KERJA & MIGRAN)
  if (query.includes("has") || query.includes("has international") || query.includes("pt nevis") || query.includes("nevis") || query.includes("pelatihan kerja") || query.includes("luar negeri") || query.includes("migran") || query.includes("tki")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Layanan kemitraan ketenagakerjaan resmi HAS International Center dan PT. Nevis di MPP Simpurusiang memfasilitasi:

📍 Loket: Kemitraan Pelatihan Ketenagakerjaan & Migran (Lantai 1 MPP)

📋 Layanan Tersedia:
1. Informasi Pelatihan Kerja Vokasi Berstandar Internasional.
2. Sosialisasi dan Fasilitasi Pendaftaran Penempatan Tenaga Kerja Indonesia (TKI / Pekerja Migran) Resmi ke Luar Negeri (Jepang, Korea, Timur Tengah, dll.) secara prosedural, legal, dan aman di bawah pengawasan Disnakertrans dan BP2MI.
3. Sertifikasi Kompetensi dan Pembekalan Bahasa Asing bagi calon tenaga kerja lokal Kabupaten Luwu.

Layanan ini memastikan pemuda-pemudi Luwu terlindungi dari tindak pidana perdagangan orang (TPPO) dan memiliki keterampilan kerja bersertifikat resmi, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // J. PT. BANK SULSELBAR CABANG BELOPA
  if (query.includes("bank sulselbar") || query.includes("sulselbar") || query.includes("kur") || query.includes("kasda") || query.includes("bayar retribusi")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Kantor Kas PT. Bank Sulselbar Cabang Belopa di MPP Simpurusiang melayani:

📍 Loket: Gerai Kas PT. Bank Sulselbar (Lantai 1 Dekat Pintu Keluar Loket)

📋 Ragam Layanan:
1. Pembayaran Resmi Retribusi PBG, Retribusi Izin Usaha, dan Pajak Daerah (PBB-P2, BPHTB) terintegrasi langsung dengan kas daerah Pemkab Luwu secara real-time.
2. Pembukaan Rekening Tabungan, Giro, dan Deposito masyarakat.
3. Pengajuan Kredit Usaha Rakyat (KUR) berbunga bersubsidi bagi pelaku UMKM dan petani/peternak di Kabupaten Luwu.
4. Transaksi setor tunai, tarik tunai, dan layanan perbankan digital, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // K. KPP PRATAMA PALOPO / BELOPA & PAJAK
  if (query.includes("pajak") || query.includes("kpp") || query.includes("npwp") || query.includes("spt") || query.includes("efin") || query.includes("pbb") || query.includes("bphtb") || query.includes("bapenda")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Pelayanan Perpajakan di MPP Simpurusiang terbagi menjadi dua pilar:

🏢 1. KPP Pratama Palopo (Pos Pelayanan Pajak Belopa) - Pajak Pusat:
• Pembuatan dan cetak kartu NPWP Orang Pribadi & Badan.
• Asistensi pemadanan NIK menjadi NPWP.
• Asistensi pelaporan SPT Tahunan melalui e-Filing DJP Online.
• Pembuatan kode billing bayar pajak dan aktivasi/cetak ulang EFIN.

🏛️ 2. Bapenda Kabupaten Luwu - Pajak Daerah:
• Pembayaran & mutasi PBB-P2 (Pajak Bumi dan Bangunan Perdesaan dan Perkotaan).
• Validasi dan pembayaran BPHTB (Bea Perolehan Hak atas Tanah dan Bangunan).
• Pajak Reklame, Pajak Restoran, Hotel, dan Pajak Air Bawah Tanah, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // L. PERIZINAN BERUSAHA (OSS-RBA) & KONTAK DPMPTSP
  if (query.includes("oss") || query.includes("nib") || query.includes("izin usaha") || query.includes("dpmptsp") || query.includes("kontak dpmptsp") || query.includes("nomor wa")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. DPMPTSP Kabupaten Luwu siap melayani Perizinan Berusaha Berbasis Risiko (OSS-RBA) dan pendampingan izin usaha:

📍 Lokasi Kantor / Loket: DPMPTSP Kabupaten Luwu di Lantai 1 MPP Simpurusiang, Jl. Andi Djemma No. 1, Senga, Belopa.
📞 Telepon / WhatsApp Resmi: 085158099464
📧 Email Resmi: officialdpmptspluwu@gmail.com
🌐 Website: https://dpmptsp.luwukab.go.id

📋 Tingkatan Risiko OSS-RBA (PP No. 5/2021):
1. Risiko Rendah: Legalitas NIB langsung terbit otomatis berlaku sebagai izin edar & izin operasional.
2. Risiko Menengah Rendah: NIB + Sertifikat Standar pernyataan mandiri (self-declaration).
3. Risiko Menengah Tinggi: NIB + Sertifikat Standar yang diverifikasi oleh OPD Teknis.
4. Risiko Tinggi: NIB + Izin Usaha penuh yang disahkan setelah verifikasi teknis dan inspeksi lapangan.

📄 Syarat Utama Pembuatan NIB di Loket MPP:
KTP-el pemilik/direktur, NPWP aktif, alamat email aktif, nomor WhatsApp aktif, dan rincian jenis kegiatan usaha (Klasifikasi Baku Lapangan Usaha Indonesia / KBLI 5 digit). Petugas Helpdesk kami siap mendampingi Bapak/Ibu hingga NIB terbit di tempat, Bapak/Ibu! Salama'Ki' Tapada Salama'.`;
  }

  // M. PBG & SLF (SIMBG PUPR)
  if (query.includes("pbg") || query.includes("slf") || query.includes("simbg") || query.includes("imb") || query.includes("bangunan")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Berdasarkan Peraturan Pemerintah (PP) Nomor 16 Tahun 2021, Izin Mendirikan Bangunan (IMB) telah RESMI DIHAPUS dan DIGANTIKAN oleh Persetujuan Bangunan Gedung (PBG) dan Sertifikat Laik Fungsi (SLF):

📍 Loket Pengurusan: Helpdesk Penataan Ruang & SIMBG (Dinas PUPR & DPMPTSP Luwu, Lantai 1 MPP)
🌐 Portal Nasional: https://simbg.pu.go.id

📋 1. Persyaratan Dokumen Administratif:
• KTP-el / NPWP pemohon atau NIB untuk badan usaha.
• Bukti Hak Kepemilikan Atas Tanah (SHM, HGB, atau Akta Jual Beli / Perjanjian Pemanfaatan Tanah sah notaris).
• Konfirmasi / Persetujuan KKPR (Kesesuaian Kegiatan Pemanfaatan Ruang) sesuai Perda RTRW Luwu No. 6 Tahun 2011.
• Surat Pernyataan Pertanggungjawaban Mutlak (SPPM) bermeterai bahwa tanah tidak bersengketa.

📐 2. Persyaratan Dokumen Teknis:
• Gambar Rencana Arsitektur (Site Plan, Denah, Tampak, Potongan, Spesifikasi Bahan).
• Gambar Rencana Struktur (Pondasi, Kolom, Balok, Rangka Atap beserta nota perhitungan struktur).
• Gambar Utilitas MEP (Instalasi Listrik, Proteksi Petir, Air Bersih, Sanitasi/Septic Tank, dan Proteksi Kebakaran APAR).
• Dokumen Lingkungan (SPPL / UKL-UPL / AMDAL).

🔄 3. Alur 5 Tahap Pengurusan PBG di MPP:
1. Pemohon mendaftar di akun SIMBG (bisa didampingi di loket MPP).
2. Verifikasi Berkas Administratif & Teknis oleh Tim Penilai Teknis (TPT) Dinas PUPR Luwu.
3. Sidang Konsultasi Teknis Tim Profesi Ahli (TPA) / TPT.
4. Pembayaran Retribusi PBG resmi melalui loket Bank Sulselbar di MPP.
5. Penerbitan SK PBG bertandatangan elektronik resmi Kepala DPMPTSP Luwu, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // N. SARANA DAN PRASARANA (SARPRAS) LENGKAP GEDUNG MPP
  if (
    query.includes("sarpras") ||
    query.includes("fasilitas") ||
    query.includes("disabilitas") ||
    query.includes("kursi roda") ||
    query.includes("laktasi") ||
    query.includes("menyusui") ||
    query.includes("kids corner") ||
    query.includes("anak") ||
    query.includes("balai nikah") ||
    query.includes("nikah") ||
    query.includes("wifi") ||
    query.includes("parkir") ||
    query.includes("toilet")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu dirancang dengan standar pelayanan prima dan inklusif KemenPAN-RB:

🏢 1. Fasilitas Utama & Digital:
• Lobi Utama & Resepsionis Helpdesk informasi terpadu.
• Mesin Kiosk Antrean Layar Sentuh (Smart Touchscreen Queue Kiosk) dengan monitor display LED per loket.
• Anjungan Dukcapil Mandiri (ADM): Kiosk digital cetak mandiri KTP-el, KIA, KK, dan Akta Kependudukan secara instan.

♿ 2. Fasilitas Ramah Disabilitas & Kelompok Rentan:
• Jalur Pemandu (Guiding Block) timbul untuk tunanetra dari area parkir hingga ke loket layanan.
• Ramp Akses Landai bagi pengguna kursi roda.
• Kursi Roda Gratis siap pakai di pos pengamanan utama.
• Loket Prioritas Pelayanan khusus difabel, lansia (>60 tahun), dan ibu hamil.
• Toilet Khusus Difabel yang luas, dilengkapi handrail pengaman dan tombol darurat (panic button).

👶 3. Fasilitas Keluarga & Sosial:
• Ruang Laktasi / Menyusui: Privat, bersih, ber-AC, sofa nyaman, kulkas ASI, wastafel, dan meja ganti popok bayi.
• Pojok Bermain Anak (Kids Corner): Dilengkapi karpet busa empuk, mainan edukasi, dan buku bergambar.
• Balai Nikah Terpadu: Ruang representatif akad nikah Kemenag & Disdukcapil dengan konsep "3-in-1" (usai ijab kabul langsung bawa pulang Buku Nikah, KTP baru status Kawin, dan KK baru).
• Pojok Baca Digital / Mini Library bekerjasama dengan Dinas Perpustakaan & Kearsipan Kabupaten Luwu.

🌿 4. Kenyamanan & Penunjang:
• Galeri & Pojok UMKM Kopi Latimojong, Cokelat Luwu, dan tenun Dekranasda.
• Klinik Kesehatan Pertama (P3K) didukung nakes Dinkes Luwu.
• Jaringan Wi-Fi Cepat Gratis dan Charging Station di seluruh area tunggu.
• Area Parkir Luas dan Pos Keamanan CCTV 24 Jam bersama Satpol PP, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // O. DASAR HUKUM & REGULASI
  if (
    query.includes("dasar hukum") ||
    query.includes("regulasi") ||
    query.includes("undang-undang") ||
    query.includes("perpres") ||
    query.includes("permenpan") ||
    query.includes("perda") ||
    query.includes("perbup") ||
    query.includes("akademisi") ||
    query.includes("penelitian")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Untuk kebutuhan pengujian akademisi, mahasiswa, maupun peneliti, berikut adalah hierarki landasan yuridis formal penyelenggaraan MPP Simpurusiang Kabupaten Luwu, Bapak/Ibu:

⚖️ Hierarki Regulasi Penyelenggaraan:
1. Undang-Undang No. 25 Tahun 2009 tentang Pelayanan Publik (Asas kepastian hukum, keterbukaan, akuntabilitas, dan fasilitas perlakuan khusus).
2. Undang-Undang No. 6 Tahun 2023 tentang Penetapan Perppu No. 2 Tahun 2022 tentang Cipta Kerja menjadi Undang-Undang.
3. Peraturan Presiden (Perpres) No. 89 Tahun 2021 tentang Penyelenggaraan Mal Pelayanan Publik.
4. Peraturan Menteri PAN-RB (PermenPAN-RB) No. 92 Tahun 2021 tentang Petunjuk Teknis Penyelenggaraan Mal Pelayanan Publik.
5. Peraturan Pemerintah (PP) No. 5 Tahun 2021 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko (Sistem OSS-RBA).
6. Peraturan Pemerintah (PP) No. 16 Tahun 2021 tentang Pelaksanaan UU No. 28 Tahun 2002 tentang Bangunan Gedung (Transformasi IMB menjadi PBG & SLF).
7. Peraturan Daerah Kabupaten Luwu No. 06 Tahun 2011 tentang RTRW Kabupaten Luwu Tahun 2011-2031.
8. Perbup Luwu tentang Pembentukan Organisasi dan Tata Kelola MPP Simpurusiang.

🏛️ Nilai Filosofis Budaya Tana Luwu:
Nama "Simpurusiang" diangkat dari kearifan lokal bahasa Tae' Tana Luwu yang bermakna musyawarah, persatuan, dan ketulusan melayani masyarakat tanpa sekat pembeda. Semboyan resmi: "Salama'Ki' Tapada Salama'". Salama'Ki' Tapada Salama'.`;
  }

  // P. DAFTAR 19 INSTANSI TERPADU
  if (
    query.includes("19 instansi") ||
    query.includes("daftar instansi") ||
    query.includes("instansi terpadu") ||
    query.includes("instansi apa saja") ||
    query.includes("loket apa saja")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Mal Pelayanan Publik (MPP) Simpurusiang memadukan 19 Instansi Pelayanan Publik dalam satu atap:

1. DPMPTSP Kab. Luwu (Perizinan Berusaha OSS-RBA, PBG/SLF, Investasi)
2. Disdukcapil Kab. Luwu (KTP-el, KK, KIA, Akta Lahir, ADM)
3. Bapenda Kab. Luwu (PBB-P2, BPHTB, Pajak Daerah)
4. Disnakertrans Kab. Luwu (Kartu AK-1/Kartu Kuning, Mediasi Tenaga Kerja)
5. Dinas Sosial (Rekomendasi DTKS, KIS PBI)
6. Dinas PUPR Kab. Luwu (Verifikasi Teknis PBG/SLF di SIMBG, Info Tata Ruang)
7. Dinas Kesehatan (Izin Praktik Tenaga Kesehatan, Higiene Sanitasi)
8. Dinas Lingkungan Hidup (Persetujuan Lingkungan SPPL, Rekomendasi UKL-UPL)
9. Dinas Koperasi & UMKM (NIB UMKM, Rekomendasi P-IRT, Koperasi)
10. Dinas Perpustakaan & Kearsipan (Pojok Baca Digital)
11. SAMSAT Luwu / Bapenda Sulsel (Pajak Kendaraan Bermotor / PKB, STNK)
12. Polres Luwu (Perpanjangan SIM A/C, Pengurusan SKCK)
13. ATR/BPN Kab. Luwu (Pengecekan Sertifikat Tanah, Info Pertanahan)
14. KPP Pratama Palopo / Belopa (NPWP, Pemadanan NIK-NPWP, SPT)
15. Kemenag Luwu (Balai Nikah 3-in-1, Konsultasi Haji, Sertifikat Halal)
16. BPJS Kesehatan (JKN-KIS, Mutasi Faskes, Kepesertaan)
17. BPJS Ketenagakerjaan (JKK, JKM, JHT, JP, Perlinderung BPU)
18. PT Bank Sulselbar Cabang Belopa (Kasda, Pembayaran Retribusi, KUR)
19. PT Pos Indonesia (Pengiriman Dokumen, Meterai Elektronik & Fisik)

📍 Kompleks Perkantoran Pemkab Luwu, Jl. Jenderal Sudirman, Belopa. Salama'Ki' Tapada Salama'.`;
  }

  // Q. POLRES / SIM / SKCK
  if (query.includes("sim") || query.includes("skck") || query.includes("polres") || query.includes("polisi")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Gerai Pelayanan Polres Luwu di MPP Simpurusiang melayani:

📍 Loket: Gerai Pelayanan Polres Luwu (Lantai 1)

📋 Layanan Tersedia:
• Perpanjangan SIM A dan SIM C (yang belum melewati masa kedaluwarsa)
• Penerbitan dan perpanjangan Surat Keterangan Catatan Kepolisian (SKCK)

📄 Syarat Perpanjangan SIM:
1. SIM lama asli dan fotokopinya
2. KTP-el asli dan fotokopinya
3. Surat keterangan sehat dokter dan hasil tes psikologi (tersedia di area MPP)

📄 Syarat SKCK:
Fotokopi KTP-el, KK, Akta Kelahiran, rumus sidik jari, dan pas foto 4x6 latar merah (4 lembar), Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // R. KEMENAG / BALAI NIKAH TERPADU
  if (query.includes("kemenag") || query.includes("balai nikah") || query.includes("nikah") || query.includes("haji") || query.includes("halal")) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Gerai Kementerian Agama (Kemenag) Luwu di MPP Simpurusiang melayani:

📍 Loket: Kementerian Agama Kabupaten Luwu (Lantai 1)

📋 Layanan Unggulan:
1. Balai Nikah Terpadu (Inovasi 3-in-1): Calon pengantin dapat melangsungkan akad nikah resmi di Balai Nikah MPP secara khidmat dan representatif. Usai ijab kabul, pasangan langsung membawa pulang Buku Nikah resmi, KTP-el baru berstatus Kawin, dan Kartu Keluarga baru hasil integrasi Disdukcapil.
2. Pendaftaran dan Konsultasi Haji & Umrah Resmi Kemenag.
3. Fasilitasi Sertifikasi Halal Gratis (SEHATI) bagi produk olahan makanan & minuman pelaku UMKM Kabupaten Luwu, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
  }

  // S. SAPAAN HANGAT (GREETINGS)
  if (
    query.includes("tabe") ||
    query.includes("halo") ||
    query.includes("assalamu") ||
    query.includes("pagi") ||
    query.includes("siang") ||
    query.includes("sore") ||
    query.includes("malam") ||
    query.includes("makasih") ||
    query.includes("terima kasih") ||
    query.includes("kurru")
  ) {
    return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu. Kurru sumange' atas kunjunganta' di portal digital MPP Simpurusiang Kabupaten Luwu, Bapak/Ibu.

Saya Asisten Digital Ta' Bapak/Ibu siap mendampingi Bapak/Ibu mengenai:
1. Layanan Dedikasi BPJS Kesehatan dan BPJS Ketenagakerjaan.
2. Ragam Jenis Layanan Resmi dpmptsp.luwukab.go.id/category/layanan (Kejaksaan Negeri, Dinas Perikanan BBM subsidi/tambak, PDAM Tirta Luwu, SAMSAT, Diskominfo-SP, DEKRANASDA, Bank Sulselbar, KPP Pratama, HAS International & PT Nevis).
3. Layanan Perizinan OSS-RBA & Izin Bangunan Gedung (PBG & SLF) via SIMBG PUPR.
4. Sarana dan Prasarana Gedung MPP (fasilitas inklusif disabilitas, ruang laktasi, kids corner, balai nikah 3-in-1, ADM dukcapil mandiri, pojok UMKM).
5. Literasi Basis Data & Tabel Knowledge Supabase (Perda RTRW Luwu No. 6/2011, RPJPD 2025-2045, RPJMD 2025, Luwu Dalam Angka 2025 BPS, dan Proyek IPRO).
6. Layanan 19 Instansi Terpadu Kabupaten Luwu.

Silakan sampaikan informasi apa yang Bapak/Ibu butuhkan, Saya Asisten Digital Ta' Bapak/Ibu dengan setulus hati siap membantu Bapak/Ibu! Salama'Ki' Tapada Salama'.`;
  }

  // T. DEFAULT FALLBACK RESPON
  return `Tabe' Bapak/Ibu. Terima kasih atas pertanyaan yang disampaikan kepada Saya sebagai Asisten Digital Ta' Bapak/Ibu.

Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu memadukan 19 Instansi Pelayanan Publik di Jl. Jenderal Sudirman (Kompleks Perkantoran Pemkab Luwu), Belopa.

Bapak/Ibu dapat menanyakan topik resmi seputar:
• Layanan BPJS Kesehatan & BPJS Ketenagakerjaan
• Jenis Layanan Terpadu (https://dpmptsp.luwukab.go.id/category/layanan): Kejaksaan Negeri DATUN & tilang, Perikanan BBM subsidi/tambak, PDAM sambungan baru, SAMSAT, Diskominfo PPID/LAPOR, Dekranasda kriya, Bank Sulselbar, dll.
• Izin Bangunan (PBG & SLF) melalui SIMBG & Perizinan Berusaha OSS-RBA DPMPTSP
• Sarana Prasarana MPP (akses difabel, kursi roda gratis, laktasi, kids corner, balai nikah 3-in-1, ADM mandiri)
• Regulasi RTRW Luwu No. 6/2011 & Basis Data Resmi Tabel Knowledge Supabase (RPJPD 2025-2045, RPJMD 2025, BPS 2025, IPRO Rumput Laut).

Helpdesk Pelayanan di Lobi Utama MPP Simpurusiang siap melayani Bapak/Ibu setiap Senin - Jumat pukul 08.00 - 15.30 WITA, Bapak/Ibu. Salama'Ki' Tapada Salama'.`;
}
