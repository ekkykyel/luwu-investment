/**
 * Modul Basis Pengetahuan Respons Suara (Voice Knowledge & Speech Synthesis Engine)
 * Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu
 * 
 * Menghasilkan jawaban komprehensif (Persyaratan Lengkap, Alur Proses Tahapan, Biaya/Retribusi, SLA, Loket)
 * yang diformat khusus untuk dibacakan secara natural oleh Web Speech TTS Bahasa Indonesia
 * dan ditampilkan dalam kartu dialog visual interaktif.
 */

export interface VoiceAssistantResponse {
  matched: boolean;
  serviceTitle: string;
  instansi: string;
  speechText: string;
  query: string;
  persyaratan: string[];
  alurProses: string[];
  biaya: string;
  sla: string;
  lokasiLoket: string;
  targetSectionId?: string;
  category?: string;
}

/**
 * Kalimat sambutan pembuka resmi TTS Suara Asisten Ramah MPP:
 * - ID: "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu."
 * - EN: "Welcome to Mal Pelayanan Publik Simpurusiang Luwu Regency, thank you for your inquiry."
 * - ZH: "欢迎来到鲁武县欣普鲁香公共服务大楼，感谢您的提问与咨询。"
 */
export const OPENING_GREETINGS: Record<'id' | 'en' | 'zh', string> = {
  id: "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu.",
  en: "Welcome to Mal Pelayanan Publik Simpurusiang Luwu, thank you for your inquiry.",
  zh: "欢迎来到鲁武县欣普鲁香公共服务大楼，感谢您的提问与咨询。"
};

export function prependVoiceGreeting(speechText: string, lang: 'id' | 'en' | 'zh' = 'id'): string {
  const trimmed = (speechText || '').trim();
  if (lang === 'id') {
    const idOpening = "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu.";
    if (
      trimmed.startsWith("Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu") ||
      trimmed.startsWith("Selamat Datang di Mal Pelayanan Publik Simpurusiang Kabupaten Luwu, Terima kasih atas pertanyaan Bapak/Ibu")
    ) {
      return trimmed.replace("Selamat Datang di Mal Pelayanan Publik Simpurusiang Kabupaten Luwu", "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu");
    }
    const cleanBody = trimmed
      .replace(/^(Tabe['’`]?[\,\.]?\s*)+/gi, '')
      .replace(/^(Selamat\s+datang[^\.\!\?]*[\.\!\?]\s*)/gi, '')
      .trim();
    return `${idOpening} ${cleanBody}`;
  }
  return trimmed;
}

/**
 * Kalimat penutup resmi TTS Suara sesuai kearifan lokal Tana Luwu dan standar multibahasa:
 * - ID: "Terima Kasih, Salama'Ki' Tapada Salama'."
 * - EN: "Thank You."
 * - ZH: "谢谢。" (Terjemahan resmi Terima Kasih)
 */
export const CLOSING_SALUTATIONS: Record<'id' | 'en' | 'zh', string> = {
  id: "Terima Kasih, Salama'Ki' Tapada Salama'.",
  en: "Thank You.",
  zh: "谢谢。"
};

export function appendVoiceClosing(speechText: string, lang: 'id' | 'en' | 'zh' = 'id'): string {
  const trimmed = (speechText || '').trim();
  const closing = CLOSING_SALUTATIONS[lang] || CLOSING_SALUTATIONS.id;

  if (
    trimmed.includes("Salama'Ki' Tapada Salama'") ||
    trimmed.includes("Salama' Ki' ta Pada Salama'") ||
    trimmed.includes("Salama' Ki' ta Pada Salam'") || 
    trimmed.endsWith("Thank You.") || 
    trimmed.endsWith("Thank you.") ||
    trimmed.endsWith("谢谢。") ||
    trimmed.endsWith("谢谢您。")
  ) {
    return trimmed;
  }

  return `${trimmed} ${closing}`;
}

export function resolveMppVoiceQuery(query: string, lang: 'id' | 'en' | 'zh' = 'id'): VoiceAssistantResponse {
  const result = internalResolveMppVoiceQuery(query, lang);
  result.speechText = prependVoiceGreeting(result.speechText, lang);
  result.speechText = appendVoiceClosing(result.speechText, lang);
  return result;
}

function internalResolveMppVoiceQuery(query: string, lang: 'id' | 'en' | 'zh' = 'id'): VoiceAssistantResponse {
  const clean = query.toLowerCase().trim();

  // --- ENGLISH VOICE KNOWLEDGE ENGINE ---
  if (lang === 'en') {
    // 1. Dukcapil: Electronic ID Card (KTP-el), Family Card (KK), Birth Certificate & Data Change
    if (
      clean.includes('ktp') || 
      clean.includes('id card') || 
      clean.includes('civil') || 
      clean.includes('family card') || 
      clean.includes('birth certificate') || 
      clean.includes('death certificate') || 
      clean.includes('dukcapil') || 
      clean.includes('disdukcapil') || 
      clean.includes('kia') || 
      clean.includes('ikd') || 
      clean.includes('data change') || 
      clean.includes('address change') ||
      clean.includes('population')
    ) {
      return {
        matched: true,
        serviceTitle: "Civil Registration, Electronic ID Card (KTP-el) & Family Card (KK)",
        instansi: "Civil Registry & Population Office (Disdukcapil) Luwu Regency",
        speechText: "Welcome to MPP Simpurusiang Luwu. For Civil Registration and Electronic ID card services at Disdukcapil: First-time applicants aged seventeen need a copy of their Family Card for biometric photo and fingerprint capture. For lost or damaged cards, bring your police loss report or damaged card plus Family Card. Birth certificates require a hospital birth notice, parents' ID cards, marriage certificate, and Family Card. All civil registration services at Disdukcapil are one hundred percent free of charge, with an estimated processing time of fifteen to thirty minutes at Counters 01, 02, and 03 on the Ground Floor.",
        query,
        persyaratan: [
          "New KTP (17yo): Recent Family Card (KK) copy, in-person appearance for biometric photo and fingerprinting.",
          "Damaged KTP: Original damaged physical ID card and Family Card copy.",
          "Lost KTP: Police Loss Report Certificate and Family Card copy.",
          "Family Card (KK) Update: Original old KK, birth/death/marriage certificate or proof of domicile transfer.",
          "Birth Certificate: Hospital/midwife birth report, parents' KTP-el and marriage book, and Family Card."
        ],
        alurProses: [
          "1. Take a digital queue ticket for Disdukcapil at the Main Lobby Touchscreen Kiosk.",
          "2. Submit documents for identity verification at Disdukcapil Front Office Counter.",
          "3. Perform biometric capture (photo, fingerprint, iris scan) or centralized national database validation.",
          "4. Immediate physical ID card printing or self-service printing via the ADM kiosk in the lobby.",
          "5. Officers will also activate your Digital Citizen ID (IKD) on your smartphone."
        ],
        biaya: "100% FREE OF CHARGE (Zero retribution)",
        sla: "15 to 30 Minutes",
        lokasiLoket: "Counters 01, 02, 03 & ADM Self-Service Kiosk, Ground Floor MPP",
        targetSectionId: "layanan",
        category: "Civil Registry & Identification"
      };
    }

    // 2. Building Approval (PBG) & Spatial Planning (DPUPR & DPMPTSP)
    if (
      clean.includes('pbg') || 
      clean.includes('building') || 
      clean.includes('permit') || 
      clean.includes('construction') || 
      clean.includes('architecture') || 
      clean.includes('imb') ||
      clean.includes('slf') ||
      clean.includes('simbg') ||
      clean.includes('pkkpr') ||
      clean.includes('spatial')
    ) {
      return {
        matched: true,
        serviceTitle: "Building Approval (PBG) & Spatial Planning (PKKPR)",
        instansi: "Public Works & Spatial Planning (DPUPR) & DPMPTSP Luwu",
        speechText: "Welcome to MPP Simpurusiang Luwu. To apply for a Building Approval or PBG: Required documents include applicant's ID or Passport, Tax ID, proof of land ownership such as an SHM land title, architectural and structural engineering drawings, spatial planning conformity confirmation, and an environmental commitment statement. Applications are processed through the national SIMBG portal or assisted at Counters 04 and 05 on the Ground Floor. Official regional building retribution is paid at Bank Sulselbar, with an estimated processing time of three to fourteen working days.",
        query,
        persyaratan: [
          "Applicant's valid ID Card / Passport and Tax Identification Number (NPWP), or NIB for enterprises.",
          "Valid Land Title / Ownership Certificate (SHM / HGB) or notarized land utilization agreement.",
          "Architectural design drawings (site plan, floor plans, elevations, cross-sections, specifications).",
          "Structural engineering calculations and foundation/reinforced concrete drawings.",
          "Mechanical, Electrical, and Plumbing (MEP) schematics (sanitation, electrical layout, lightning rod, fire safety).",
          "Spatial Planning Conformity statement (PKKPR) issued by Luwu Regency.",
          "Environmental commitment statement (SPPL / UKL-UPL)."
        ],
        alurProses: [
          "1. Application Submission: Submit application on the national SIMBG portal (simbg.pu.go.id) or assisted by DPUPR officers at Ground Floor MPP Luwu.",
          "2. Technical Verification: The DPUPR Technical Assessment Team reviews engineering blueprints and administrative files.",
          "3. Technical Consultation: Consultation session with certified professional architects and structural engineers.",
          "4. Retribution Payment: Pay official regional building retribution at Bank Sulselbar counter in MPP.",
          "5. License Issuance: Official electronic PBG certificate issued with National Cyber & Crypto Agency (BSrE) digital signature."
        ],
        biaya: "Calculated according to Regional Building Retribution By-law based on building area, complexity, and function, paid via Bank Sulselbar.",
        sla: "3 to 14 Working Days",
        lokasiLoket: "Counters 04 & 05 (SIMBG & Spatial Planning Desk) Ground Floor, MPP Simpurusiang",
        targetSectionId: "layanan",
        category: "Licensing & Spatial Planning"
      };
    }

    // 3. Business Licensing: NIB OSS-RBA (DPMPTSP)
    if (
      clean.includes('nib') || 
      clean.includes('business license') || 
      clean.includes('company registration') || 
      clean.includes('oss') || 
      clean.includes('oss-rba') || 
      clean.includes('incorporation')
    ) {
      return {
        matched: true,
        serviceTitle: "Single Business Number (NIB OSS-RBA) & Enterprise Licensing",
        instansi: "DPMPTSP (Investment & One-Stop Integrated Services) Luwu",
        speechText: "Welcome to Luwu Investment Corner at MPP Simpurusiang. To register your business and obtain a Single Business Number or NIB through OSS-RBA: Requirements include applicant's ID or Passport, Tax Number, and Company Deed of Establishment for legal entities. Low and medium-low risk businesses obtain instant electronic issuance on the same day free of charge at Counters 01 and 02.",
        query,
        persyaratan: [
          "Applicant's ID Card (KTP) or Passport and Personal/Corporate Tax Number (NPWP).",
          "Deed of Establishment & Ministry of Law and Human Rights (Kemenkumham) decree for PT/CV/Cooperatives.",
          "Valid email address and active WhatsApp contact.",
          "Geographic coordinates and business premise location details in Luwu Regency."
        ],
        alurProses: [
          "1. Visit Luwu Investor Corner at Counter 01 & 02 MPP Simpurusiang.",
          "2. System verification and Indonesian Standard Industrial Classification (KBLI 2020) determination.",
          "3. Direct electronic issuance of NIB OSS-RBA with QR Code."
        ],
        biaya: "100% FREE OF CHARGE",
        sla: "Instant (15 to 30 Minutes for Low-Risk businesses)",
        lokasiLoket: "Counters 01 & 02 (Investor Corner & OSS-RBA) Ground Floor, MPP",
        targetSectionId: "layanan",
        category: "Investment & Business"
      };
    }

    // 4. Investor VIP Concierge & ROI / Tax Incentives Simulation
    if (
      clean.includes('investor') || 
      clean.includes('investment') || 
      clean.includes('concierge') || 
      clean.includes('roi') || 
      clean.includes('incentive') || 
      clean.includes('tax allowance') || 
      clean.includes('downstreaming') || 
      clean.includes('smelter') || 
      clean.includes('vip') ||
      clean.includes('lkpm')
    ) {
      return {
        matched: true,
        serviceTitle: "Investor VIP Concierge & ROI Incentive Simulation Desk",
        instansi: "Investment & Promotion Division (DPMPTSP) Luwu Regency",
        speechText: "Welcome to the Luwu Investor VIP Concierge Desk at MPP Simpurusiang. Luwu Regency offers red-carpet facilitation for domestic and foreign investors across nickel downstreaming, cacao and Arabica coffee processing, modern aquaculture, and logistics hubs near Bua Airport and Tadokkong Seaport. We provide tailored regional tax incentives of up to thirty-five percent reduction on local levies, priority green-channel NIB and spatial licensing, and detailed Return on Investment simulations at Counter 06.",
        query,
        persyaratan: [
          "Corporate profile and proof of legal entity (PMA / PMDN).",
          "Proposed investment plan and CAPEX/OPEX estimates.",
          "Site location requirements and spatial footprint preferences in Luwu Regency.",
          "Workforce absorption commitment and local partnership readiness."
        ],
        alurProses: [
          "1. Meet dedicated Investment Concierge Officers at Counter 06 MPP Simpurusiang.",
          "2. Interactive GIS Spatial Mapping verification for spatial compliance with Luwu 2024-2044 master plan.",
          "3. Regional incentive assessment and customized ROI/payback period simulation.",
          "4. End-to-end green channel assistance from NIB issuance to environmental and building permits."
        ],
        biaya: "100% FREE VIP Concierge & Investment Facilitation",
        sla: "Direct Consultation & Dedicated Account Officer",
        lokasiLoket: "Counter 06 (Investment Clinic & VIP Concierge) Ground Floor, MPP",
        targetSectionId: "layanan",
        category: "Investment & Promotion"
      };
    }

    // 5. Regional Taxes & Retribution: PBB-P2, BPHTB & Market Retribution (Bapenda)
    if (
      clean.includes('tax') || 
      clean.includes('pbb') || 
      clean.includes('bphtb') || 
      clean.includes('property tax') || 
      clean.includes('bapenda') || 
      clean.includes('retribution') || 
      clean.includes('market') || 
      clean.includes('land tax')
    ) {
      return {
        matched: true,
        serviceTitle: "Regional Land & Building Tax (PBB-P2), BPHTB & Market Retribution",
        instansi: "Regional Revenue Agency (Bapenda) Luwu Regency",
        speechText: "Welcome to the Regional Revenue Desk at MPP Simpurusiang. For Land and Building Tax PBB-P2 and land transfer duty BPHTB: Requirements include your latest tax notice SPPT, taxpayer ID card, and land deed or certificate for BPHTB validation. Tax payments can be settled directly via Bank Sulselbar counter or QRIS, with immediate official proof of payment issued in five to ten minutes at Counter 17.",
        query,
        persyaratan: [
          "Current or previous year Tax Assessment Notice (SPPT PBB).",
          "Taxpayer valid ID Card (KTP-el) or corporate Tax ID (NPWP).",
          "For BPHTB: Land title certificate copy, notarized sales/inheritance deed from PPAT, and SSPD BPHTB form.",
          "For Market Retribution: Market merchant kiosk registration card."
        ],
        alurProses: [
          "1. Take queue ticket for Bapenda at Main Lobby Kiosk.",
          "2. Property taxable value (NJOP) verification and assessment at Counter 17.",
          "3. Direct payment via Bank Sulselbar or instant QRIS scan.",
          "4. Immediate issuance of official stamped Regional Tax Receipt."
        ],
        biaya: "Calculated based on official SPPT PBB / BPHTB statutory assessment (5% of taxable land acquisition value)",
        sla: "5 to 10 Minutes",
        lokasiLoket: "Counter 17 (Bapenda Luwu) Ground Floor, MPP Simpurusiang",
        targetSectionId: "layanan",
        category: "Regional Taxation"
      };
    }

    // 6. Passport & Immigration (Ditjen Imigrasi)
    if (clean.includes('passport') || clean.includes('imigrasi') || clean.includes('immigration') || clean.includes('visa')) {
      return {
        matched: true,
        serviceTitle: "Electronic & Standard Passport Issuance",
        instansi: "Directorate General of Immigration Counter at MPP Luwu",
        speechText: "Welcome to Immigration Services at MPP Simpurusiang. Passport requirements include original ID Card, Family Card, Birth Certificate or Marriage Certificate, and queue booking via the M-Paspor application. Biometric photos and interview are conducted at Immigration Counter 14, with passport collection ready in three to four working days.",
        query,
        persyaratan: [
          "Valid ID Card (KTP) and Family Card (KK).",
          "Birth Certificate, Marriage Certificate, or School Diploma indicating name, date of birth, and parents' names.",
          "Old passport (for renewal applicants).",
          "M-Paspor online registration queue barcode."
        ],
        alurProses: [
          "1. Book queue via M-Paspor app and arrive at Counter 14 MPP.",
          "2. Document verification, biometric photo capture, and biometric fingerprinting.",
          "3. Pay PNBP official immigration fee at bank/post office.",
          "4. Passport ready for collection in 3 to 4 working days."
        ],
        biaya: "Official PNBP: Rp 350,000 for regular passport, Rp 650,000 for electronic passport.",
        sla: "3 to 4 Working Days after biometric capture",
        lokasiLoket: "Counter 14 (Immigration Desk), Ground Floor MPP Simpurusiang",
        targetSectionId: "layanan",
        category: "Immigration & Travel"
      };
    }

    // 7. Police Clearance Certificate (SKCK - Polres Luwu)
    if (
      clean.includes('skck') || 
      clean.includes('police clearance') || 
      clean.includes('good conduct') || 
      clean.includes('criminal record')
    ) {
      return {
        matched: true,
        serviceTitle: "Police Clearance Certificate (SKCK)",
        instansi: "Luwu Resort Police (Polres Luwu) Integrated Counter at MPP",
        speechText: "Welcome to Polres Luwu Police Clearance Counter at MPP Simpurusiang. SKCK requirements include: Copies of your ID Card, Family Card, and Birth Certificate, four color passport photos sized four by six with a red background, fingerprint record, and active BPJS Health Insurance membership. The official statutory fee is thirty thousand rupiah, completed in ten to fifteen minutes at Counter 13.",
        query,
        persyaratan: [
          "Copies of valid KTP-el and Family Card (KK).",
          "Copy of Birth Certificate, Marriage Book, or last educational diploma.",
          "Four color passport photos (4x6 cm) with RED background.",
          "Fingerprint record card (can be taken on-site at the counter for first-time applicants).",
          "Proof of active BPJS Health Insurance membership (Perpol No. 6/2023)."
        ],
        alurProses: [
          "1. Take queue ticket for SKCK at MPP Main Lobby Kiosk or pre-register via SuperApp Polri Presisi.",
          "2. Document verification and biometric fingerprint recording at Counter 13.",
          "3. Payment of official government non-tax fee (PNBP) of Rp 30,000.",
          "4. Physical printing and direct official legalization of your SKCK certificate."
        ],
        biaya: "Official Statutory PNBP: Rp 30,000",
        sla: "10 to 15 Minutes",
        lokasiLoket: "Counter 13 (Polres Luwu SKCK Desk) Ground Floor, MPP",
        targetSectionId: "layanan",
        category: "Police Services"
      };
    }

    // 8. Driving License (SIM A & C Renewal - Satlantas Polres Luwu)
    if (
      clean.includes('driving license') || 
      clean.includes('driver license') || 
      clean.includes('driver') || 
      clean.includes('sim a') || 
      clean.includes('sim c') || 
      clean.includes('license renewal')
    ) {
      return {
        matched: true,
        serviceTitle: "Driver License Renewal (SIM A & SIM C)",
        instansi: "Traffic Police Unit (Satlantas Polres Luwu) Counter at MPP",
        speechText: "Welcome to Polres Luwu Driver License Counter at MPP Simpurusiang. To renew your SIM A or SIM C: Bring your valid original physical driver license, two copies of your ID card, a medical fitness certificate, and a psychological test result, both of which can be completed on-site on the Ground Floor. Official statutory fees are eighty thousand rupiah for SIM A and seventy-five thousand rupiah for SIM C at Counters 11 and 12.",
        query,
        persyaratan: [
          "Valid original Driver License (must not be expired).",
          "Two copies of valid KTP-el.",
          "Medical physical fitness certificate from a licensed doctor (available on-site at MPP).",
          "Psychological evaluation pass certificate (available at MPP psychology testing desk)."
        ],
        alurProses: [
          "1. Take queue ticket for Satlantas Polres Luwu at the Main Lobby Kiosk.",
          "2. Complete on-site medical checkup and psychological testing.",
          "3. Submit documents at SIM Registration Counter 11 & 12.",
          "4. Pay official PNBP fee at the Bank counter.",
          "5. Digital biometric photo capture, fingerprint scan, and electronic signature.",
          "6. Immediate printing and handover of your renewed physical SIM card."
        ],
        biaya: "Official PNBP: SIM A Rp 80,000 | SIM C Rp 75,000 (excluding doctor & psychology examination fees)",
        sla: "15 to 25 Minutes",
        lokasiLoket: "Counters 11 & 12 (Satlantas Polres Luwu) Ground Floor, MPP",
        targetSectionId: "layanan",
        category: "Police Services"
      };
    }

    // 9. Motor Vehicle Tax & SAMSAT: STNK & Annual Tax
    if (
      clean.includes('samsat') || 
      clean.includes('vehicle tax') || 
      clean.includes('stnk') || 
      clean.includes('motorcycle tax') || 
      clean.includes('car tax') || 
      clean.includes('pkb')
    ) {
      return {
        matched: true,
        serviceTitle: "Annual Motor Vehicle Tax & Registration Endorsement (SAMSAT)",
        instansi: "Joint SAMSAT Office (Bapenda Sulsel, Jasa Raharja & Police) at MPP",
        speechText: "Welcome to SAMSAT Integrated Vehicle Tax Counter at MPP Simpurusiang. For annual motorcycle and car tax endorsement: Requirements include original vehicle registration document STNK, original national ID card matching vehicle ownership, and tax assessment notice. The service is completed in five to ten minutes at Counter 16.",
        query,
        persyaratan: [
          "Original vehicle registration document (STNK).",
          "Original National ID Card (KTP-el) matching the registered name on the STNK.",
          "Notice of Regional Tax Assessment (SKPD) from previous year.",
          "Official power of attorney and original ID if represented by a third party."
        ],
        alurProses: [
          "1. Take SAMSAT queue ticket at the Main Lobby Kiosk.",
          "2. Hand over original documents for instant barcode validation at Counter 16.",
          "3. Pay vehicle tax and mandatory passenger accident fund (SWDKLLJ) via Bank Sulselbar or QRIS.",
          "4. Immediate printing of the validated tax notice and holographic STNK endorsement."
        ],
        biaya: "According to official regional vehicle tax assessment notice (Zero administration fee)",
        sla: "5 to 10 Minutes",
        lokasiLoket: "Counter 16 (Gerai SAMSAT Belopa) Ground Floor, MPP",
        targetSectionId: "layanan",
        category: "Vehicle Taxation"
      };
    }

    // 10. Health & Social Security: BPJS Kesehatan & BPJS Ketenagakerjaan
    if (
      clean.includes('bpjs') || 
      clean.includes('health insurance') || 
      clean.includes('employment insurance') || 
      clean.includes('jkn') || 
      clean.includes('jamsostek') || 
      clean.includes('social security')
    ) {
      return {
        matched: true,
        serviceTitle: "National Health Insurance (BPJS Kesehatan) & Workers Social Security (BPJS Ketenagakerjaan)",
        instansi: "BPJS Kesehatan & BPJS Ketenagakerjaan Counters at MPP Luwu",
        speechText: "Welcome to BPJS Integrated Services at MPP Simpurusiang. For health insurance and employment social security registration, clinic transfers, or participant data updates: Requirements are your ID Card and Family Card, plus bank account details for independent autodebit enrollment. Administrative consultations are completely free at Counters 08 and 09.",
        query,
        persyaratan: [
          "Valid ID Card (KTP-el) and Family Card (KK).",
          "Savings account book for independent monthly autodebit (BRI, BNI, Mandiri, BCA).",
          "Salary slip or business establishment certificate for employment social security (BPJS Ketenagakerjaan)."
        ],
        alurProses: [
          "1. Take queue ticket for BPJS at Main Lobby Kiosk.",
          "2. Verify participant NIK in the national healthcare database.",
          "3. Select registered primary healthcare clinic (Puskesmas/Doctor) in Luwu Regency.",
          "4. Receive digital participant card via Mobile JKN app or printed verification."
        ],
        biaya: "100% FREE OF CHARGE (Administrative Registration)",
        sla: "10 to 15 Minutes",
        lokasiLoket: "Counters 08 & 09 (BPJS Kesehatan & Ketenagakerjaan) Ground Floor, MPP",
        targetSectionId: "layanan",
        category: "Social Security & Healthcare"
      };
    }

    // 11. Operating Hours, Service Schedule & Days
    if (
      clean.includes('hours') || 
      clean.includes('schedule') || 
      clean.includes('opening') || 
      clean.includes('operating') || 
      clean.includes('open') || 
      clean.includes('close') || 
      clean.includes('when is it open') || 
      clean.includes('working days')
    ) {
      return {
        matched: true,
        serviceTitle: "MPP Simpurusiang Operating Hours & Service Schedule",
        instansi: "Secretariat & Front Office of MPP Simpurusiang Luwu",
        speechText: "Welcome to MPP Simpurusiang Luwu. Our official public service operating hours are Monday through Thursday from 07:30 AM to 04:00 PM, and Friday from 07:30 AM to 04:30 PM Central Indonesia Time. The building is closed on Saturdays, Sundays, and official national holidays. Nineteen government agencies with over one hundred and twenty public services are available under one roof.",
        query,
        persyaratan: [
          "Valid National ID Card (KTP-el) or Passport.",
          "Complete administrative files according to your designated service.",
          "Digital queue ticket issued from the Main Lobby Kiosk."
        ],
        alurProses: [
          "1. Arrive at MPP Simpurusiang Building, Luwu Regency Government Civic Center, Belopa.",
          "2. Touch the screen at the Main Lobby Kiosk to take an agency queue ticket.",
          "3. Relax in the air-conditioned waiting hall with complimentary charging stations and WiFi.",
          "4. Approach your designated agency counter once your ticket number is called on screen."
        ],
        biaya: "Public building access and consultations are 100% Free.",
        sla: "Monday to Thursday: 07:30 - 16:00 WITA | Friday: 07:30 - 16:30 WITA",
        lokasiLoket: "MPP Simpurusiang Building, Belopa, Luwu Regency",
        targetSectionId: "jam-operasional",
        category: "Operational Information"
      };
    }

    // 12. Online Queuing & Touchscreen Kiosk Procedure
    if (
      clean.includes('queue') || 
      clean.includes('kiosk') || 
      clean.includes('ticket') || 
      clean.includes('how to queue') || 
      clean.includes('antrean') || 
      clean.includes('booking')
    ) {
      return {
        matched: true,
        serviceTitle: "Digital Touchscreen Queue System & Online Booking",
        instansi: "Main Lobby Customer Information Center MPP Simpurusiang",
        speechText: "Welcome to MPP Simpurusiang Luwu. To take a queue number: Arrive at the Main Lobby and touch your target department icon on the interactive touchscreen kiosk. Collect your printed ticket with a QR barcode. You can also monitor real-time queue call announcements on our airport-style digital flight information display screens or book in advance via the online portal.",
        query,
        persyaratan: [
          "Valid ID Card or NIK number.",
          "Target agency selection (Disdukcapil, Police, PBG, BPJS, SAMSAT, etc.)."
        ],
        alurProses: [
          "1. Approach the dual-screen Touchscreen Kiosk at the Main Lobby entrance.",
          "2. Touch your desired agency icon or scan your KTP-el barcode.",
          "3. Take your printed ticket containing queue letter, number, and estimated waiting time.",
          "4. Look at the overhead LED FIDS screens and listen to audio chimes for your counter call."
        ],
        biaya: "100% FREE OF CHARGE",
        sla: "Instant Ticket Issuance (<10 Seconds)",
        lokasiLoket: "Main Lobby Central Kiosk, Ground Floor MPP Simpurusiang",
        targetSectionId: "antrean",
        category: "Customer Experience"
      };
    }

    // 13. Disability, Wheelchair, Nursery & Lactation Facilities
    if (
      clean.includes('wheelchair') || 
      clean.includes('disability') || 
      clean.includes('accessible') || 
      clean.includes('lactation') || 
      clean.includes('nursery') || 
      clean.includes('breastfeeding') || 
      clean.includes('facility') || 
      clean.includes('facilities') || 
      clean.includes('elderly')
    ) {
      return {
        matched: true,
        serviceTitle: "Inclusive Accessibility, Free Wheelchairs & Nursery/Lactation Room",
        instansi: "Secretariat & Front Office of MPP Simpurusiang",
        speechText: "Welcome to MPP Simpurusiang Luwu. Our facility is designed with comprehensive accessibility for people with disabilities, seniors, and nursing mothers. We provide complimentary wheelchairs at the main security post, tactile yellow guiding tiles for the visually impaired, priority counters, accessible restrooms with safety handrails, sign language assistance, and a hygienic private Lactation Room equipped with comfortable sofas, a milk refrigerator, and sterilizer.",
        query,
        persyaratan: [
          "No special paperwork required to borrow wheelchairs or access facilities on-site.",
          "Scheduled assistance can be requested via the portal or by notifying Front Office security."
        ],
        alurProses: [
          "1. Upon arrival at the front gate, approach security or Front Office for free wheelchair borrowing.",
          "2. Dedicated accessibility officers will escort you through tactile lanes to priority counters.",
          "3. Nursing mothers can access the comfortable private Lactation Room located on the Ground Floor."
        ],
        biaya: "100% FREE OF CHARGE",
        sla: "Immediate assistance upon arrival",
        lokasiLoket: "Main Entrance, Ground Floor Front Office & Dedicated Lactation Suite",
        targetSectionId: "fasilitas",
        category: "Accessibility & Facilities"
      };
    }

    // English generic fallback
    return {
      matched: false,
      serviceTitle: `Service Inquiry: ${query}`,
      instansi: "Mal Pelayanan Publik (MPP) Simpurusiang Luwu Regency",
      speechText: `Welcome to MPP Simpurusiang Luwu. Regarding your question on "${query}", our integrated service center hosts nineteen government and public agencies with over one hundred and twenty services. Our customer service desk at the Ground Floor Lobby is ready to guide you Monday through Thursday from 07:30 to 16:00, and Friday from 07:30 to 16:30 local time.`,
      query,
      persyaratan: [
        "Valid identification (ID Card or Passport).",
        "Relevant application documents according to the target government department.",
        "Take a digital queue ticket at the Main Lobby Touchscreen Kiosk."
      ],
      alurProses: [
        "1. Arrive at MPP Simpurusiang Building, Luwu Regency Government Complex, Belopa.",
        "2. Select target agency at the digital queue kiosk.",
        "3. Wait in the air-conditioned waiting hall for number call.",
        "4. Process documents at designated department counter."
      ],
      biaya: "Most government consultations are 100% Free of charge.",
      sla: "Monday to Thursday: 07:30 - 16:00 WITA | Friday: 07:30 - 16:30 WITA",
      lokasiLoket: "MPP Simpurusiang Building, Belopa, Luwu Regency",
      targetSectionId: "layanan",
      category: "Integrated Public Services"
    };
  }

  // --- MANDARIN CHINESE (中文) VOICE KNOWLEDGE ENGINE ---
  if (lang === 'zh' || /[\u4e00-\u9fa5]/.test(clean)) {
    // 1. Dukcapil 民政与户籍登记: 印尼居民身份证 (KTP-el)、家庭卡 (KK)、出生证与信息变更
    if (
      clean.includes('身份证') || 
      clean.includes('ktp') || 
      clean.includes('家庭卡') || 
      clean.includes('户口') || 
      clean.includes('出生') || 
      clean.includes('结婚证') || 
      clean.includes('民政') || 
      clean.includes('户籍') || 
      clean.includes('信息变更') ||
      clean.includes('死亡证明')
    ) {
      return {
        matched: true,
        serviceTitle: "印尼居民身份证 (KTP-el)、家庭卡 (KK) 与民政登记",
        instansi: "鲁武县人口与民事登记局 (Disdukcapil)",
        speechText: "您好，欢迎来到鲁武县公共服务大楼 (MPP Simpurusiang)。关于在民政窗口办理身份证与户政业务：年满十七周岁的首次申领者需携带家庭户口卡复印件并亲临现场采集指纹、面部与虹膜生物信息。证件遗失或破损补办需提供警方报失证明或损坏旧卡。办理出生证明需医院出生医学证明、父母身份证及结婚登记证。民政局所有业务一律全程免费，在一楼大厅 01 至 03 号窗口办理，办理时限约为十五至三十分钟。",
        query,
        persyaratan: [
          "年满17岁首领身份证：最新家庭卡(KK)复印件，本人现场采集指纹与照片。",
          "身份证破损补领：携带破损身份证原件及家庭卡复印件。",
          "身份证遗失补领：警方出具的遗失报案证明及家庭卡复印件。",
          "家庭卡(KK)变更：旧家庭卡原件、出生证明、死亡证明或户籍迁移证明(SKPWNI)。",
          "出生证明申领：医院/助产士出生医学证明、父母双方身份证及结婚证原件与复印件。"
        ],
        alurProses: [
          "1. 在大堂触摸屏排队机领取 Disdukcapil 民政窗口业务号。",
          "2. 前往一楼民政局服务前台提交材料并核验身份信息。",
          "3. 现场进行面部高清摄影、指纹采集及虹膜扫描。",
          "4. 现场打印物理芯片卡，或在大厅内的 ADM 自助取证机即时打印。",
          "5. 工作人员同步协助在申请人智能手机上激活数字身份证 (IKD)。"
        ],
        biaya: "100% 全程免费 (无行政收费)",
        sla: "15 至 30 分钟 (国家系统专网正常时)",
        lokasiLoket: "MPP Simpurusiang 一楼 01、02、03号窗口及大厅 ADM 自助制证机",
        targetSectionId: "layanan",
        category: "户籍与民政服务"
      };
    }

    // 2. PBG 建筑工程施工批准书与空间规划 (DPUPR & DPMPTSP)
    if (
      clean.includes('建筑') || 
      clean.includes('许可') || 
      clean.includes('pbg') || 
      clean.includes('施工') || 
      clean.includes('工程') || 
      clean.includes('房屋') || 
      clean.includes('图纸') || 
      clean.includes('安全') ||
      clean.includes('slf') ||
      clean.includes('规划')
    ) {
      return {
        matched: true,
        serviceTitle: "建筑工程施工批准书 (PBG) 与空间规划 (PKKPR)",
        instansi: "鲁武县公共工程与空间规划局 (DPUPR) 与 投资一站式服务局 (DPMPTSP)",
        speechText: "您好，欢迎来到鲁武县公共服务大楼 (MPP Simpurusiang)。关于在鲁武县办理建筑批准书 (PBG)，所需材料如下：第一，申请人有效身份证或护照、税号 (NPWP) 或企业营业执照 (NIB)。第二，法定土地所有权证明（土地权属证 SHM/HGB 或公证租地协议）。第三，完整的建筑设计图、结构计算书及机电工程图纸 (MEP)。第四，空间合规证明 (PKKPR) 及环保承诺文件 (SPPL)。办理流程：通过国家 SIMBG 系统申报或在 MPP 一楼 04 号公共工程窗口由工作人员协助办理，经技术审核委员会评审及南苏尔塞尔巴尔银行窗口缴纳法定规费后，由投资局核发电子签章 PBG 证书。办理周期约为 3 至 14 个工作日。",
        query,
        persyaratan: [
          "申请人身份证/护照、税号(NPWP)，企业需提供统一企业编号(NIB)。",
          "合法土地所有权证(SHM/HGB)或经公证的土地使用权协议书。",
          "建筑设计技术图纸（总平面图、各层平面图、立面图、剖面图及技术规格）。",
          "结构工程计算说明书及基础、梁柱配筋图纸。",
          "机电管线(MEP)工程图纸（供电、防雷、排污化粪池、消防设施）。",
          "鲁武县政府出具的空间规划合规确认书(PKKPR)。",
          "环境保护承诺文件(SPPL / UKL-UPL)。"
        ],
        alurProses: [
          "1. 申报提交：在全国建筑审批门户网站(simbg.pu.go.id)上传资料，或前往 MPP 一楼 04 号窗口现场辅导提交。",
          "2. 技术审核：鲁武县公共工程局技术评估委员会审核图纸与规划标准。",
          "3. 技术咨询会：与认证建筑与结构工程师专家组进行技术评审论证。",
          "4. 缴纳规费：前往 MPP 大厅内的南苏尔塞尔巴尔银行(Bank Sulselbar)窗口缴纳法定建筑规费。",
          "5. 电子发证：由鲁武县投资局局长签发国家密码局(BSrE)认证的法定 PBG 电子执照。"
        ],
        biaya: "按鲁武县建筑工程法定规费标准执行（根据建筑面积、功能及工程复杂系数计算），通过银行窗口缴存国库。",
        sla: "3 至 14 个工作日",
        lokasiLoket: "MPP Simpurusiang 一楼 04与05号窗口（SIMBG建筑与空间规划服务台）",
        targetSectionId: "layanan",
        category: "工程审批与空间规划"
      };
    }

    // 3. 企业执照 NIB (外商投资与企业注册)
    if (
      clean.includes('企业') || 
      clean.includes('执照') || 
      clean.includes('商业') || 
      clean.includes('nib') || 
      clean.includes('公司') || 
      clean.includes('商事') ||
      clean.includes('oss')
    ) {
      return {
        matched: true,
        serviceTitle: "企业统一商业编号 (NIB OSS-RBA) 与企业注册登记",
        instansi: "鲁武县投资与一站式综合行政审批局 (DPMPTSP)",
        speechText: "您好，欢迎来到鲁武县公共服务大楼投资专区。办理企业统一商业登记证 (NIB) 所需材料包括：法定代表人护照或身份证、税号、以及合资公司注册章程与司法部批文。在 MPP 一楼 01与02 号外商投资绿色窗口，低风险行业可享受当天即时免费出证。",
        query,
        persyaratan: [
          "法定代表人护照/身份证及企业税务登记证(NPWP)。",
          "印尼司法部(Kemenkumham)批准的公司章程设立批文。",
          "有效的企业官方邮箱与印尼当地联系方式。",
          "企业在鲁武县境内的投资地址及坐标信息。"
        ],
        alurProses: [
          "1. 前往 MPP Simpurusiang 一楼 01与02 号投资绿色通道窗口。",
          "2. 工作人员协助核验印尼行业分类代码(KBLI 2020)及准入标准。",
          "3. 系统在线即时生成带法定防伪二维码的 NIB 执照并打印交接。"
        ],
        biaya: "100% 全程免费 (无行政收费)",
        sla: "即时办理（低风险行业 15 至 30 分钟）",
        lokasiLoket: "MPP 一楼 01与02号窗口（投资者服务专区）",
        targetSectionId: "layanan",
        category: "投资服务与商业准入"
      };
    }

    // 4. 外商投资贵宾绿色通道与投资回报 (ROI) / 税收优惠测算
    if (
      clean.includes('投资') || 
      clean.includes('外商') || 
      clean.includes('外资') || 
      clean.includes('贵宾') || 
      clean.includes('绿色通道') || 
      clean.includes('激励') || 
      clean.includes('税收优惠') || 
      clean.includes('roi') || 
      clean.includes('测算') ||
      clean.includes('冶炼') ||
      clean.includes('工业园区')
    ) {
      return {
        matched: true,
        serviceTitle: "外商投资贵宾绿色通道与税费优惠测算 (DPMPTSP 投资局)",
        instansi: "鲁武县投资与一站式综合行政审批局·招商引资促进处",
        speechText: "您好，欢迎来到鲁武县投资促进专窗。鲁武县政府为国内外投资者设立了一站式贵宾绿色通道，重点支持红土镍矿下游冶炼、可可与高山阿拉比卡咖啡精深加工、南美白对虾深水养殖及布阿机场与塔多孔深水港临港物流园区。投资企业可享受地方税费减免高达百分之三十五、土地租赁特别优惠及协助办理全程审批。一楼 06 号投资诊所专家将为您进行详尽的投资回报与税惠测算。",
        query,
        persyaratan: [
          "外资(PMA)或内资(PMDN)企业资质证明与公司法定章程。",
          "拟定投资总额预算（固定资产 CAPEX 与运营支出 OPEX 方案）。",
          "在鲁武县境内的用地意向、所需公用工程负荷（水、电、码头）。",
          "吸纳当地劳动力就业计划与环保合规意向书。"
        ],
        alurProses: [
          "1. 预约并前往 MPP Simpurusiang 一楼 06 号外商投资贵宾专窗。",
          "2. 调取鲁武县 2024 至 2044 年总体空间规划 GIS 地理信息数据库比对用地红线。",
          "3. 招商专员协助进行地方税费减免政策匹配与投资回报周期(ROI)仿真测算。",
          "4. 专人全程陪办环保、用地合规(PKKPR)与建筑施工(PBG)全套行政批文。"
        ],
        biaya: "100% 免费招商引资全程专属陪办与咨询",
        sla: "现场专人对接与专项投资跟踪服务",
        lokasiLoket: "MPP 一楼 06 号窗口（投资咨询诊所与重大项目室）",
        targetSectionId: "layanan",
        category: "招商引资与重点项目"
      };
    }

    // 5. 地方税务与规费: 城乡土地建筑税 (PBB-P2)、契税 (BPHTB) 与市场规费 (Bapenda)
    if (
      clean.includes('税') || 
      clean.includes('土地税') || 
      clean.includes('pbb') || 
      clean.includes('bphtb') || 
      clean.includes('地方税') || 
      clean.includes('印花') || 
      clean.includes('市场规费') || 
      clean.includes('税务局')
    ) {
      return {
        matched: true,
        serviceTitle: "城乡土地与建筑税 (PBB-P2)、土地房屋契税 (BPHTB) 与市场规费",
        instansi: "鲁武县地方税务局 (Bapenda)",
        speechText: "您好，欢迎来到地方税务窗口。办理土地与建筑税 PBB-P2 缴费或土地产权转让税 BPHTB 验证：需携带最新缴税通知单 SPPT、纳税人身份证，契税还需提供公证处房屋土地买卖或继承协议原件。现场核验后可通过南苏尔塞尔巴尔银行窗口或印尼国家标准化二维码 QRIS 完成扣款，一楼 17 号税务窗口五至十分钟出具完税凭证。",
        query,
        persyaratan: [
          "当期或上年度土地与建筑税缴纳通知书(SPPT PBB)。",
          "纳税人有效身份证(KTP)或企业税号(NPWP)。",
          "BPHTB契税：土地证复印件、公证处买卖/继承契约及缴款书(SSPD)。",
          "市场规费：市场摊位租约凭据与登记卡。"
        ],
        alurProses: [
          "1. 在大堂触摸屏排队机领取 Bapenda 地税窗口号。",
          "2. 在一楼 17 号地税窗口进行计税价值(NJOP)与应纳税额核定。",
          "3. 通过银行窗口或手机扫码即时转账缴税。",
          "4. 柜台当场盖印颁发正式法定完税证明书。"
        ],
        biaya: "依据法定评税单确定金额（BPHTB为计税转让价减去免征额后的5%）",
        sla: "5 至 10 分钟",
        lokasiLoket: "MPP 一楼 17 号窗口（鲁武县地税局专台）",
        targetSectionId: "layanan",
        category: "地方财税"
      };
    }

    // 6. 出入境移民与护照签证
    if (clean.includes('护照') || clean.includes('签证') || clean.includes('移民') || clean.includes('居留') || clean.includes('出入境')) {
      return {
        matched: true,
        serviceTitle: "出入境移民与护照签证服务",
        instansi: "鲁武县公共服务大楼·印度尼西亚移民局专柜",
        speechText: "您好，MPP Simpurusiang 设有移民局常设专柜。办理出入境护照或签证咨询，请携带有效身份证件、家庭卡或在印合法居留文件。大楼一楼 14 号窗口提供生物特征采集、指纹录入及面谈服务，通常在采集后 3 至 4 个工作日出件。",
        query,
        persyaratan: [
          "申请人有效身份证件或外国护照原件。",
          "相关出入境许可、居留许可(KITAS/KITAP)或公证书。",
          "近期免冠证件照（窗口支持现场生物特征数码摄影）。"
        ],
        alurProses: [
          "1. 前往 MPP 一楼 14 号移民专窗核验预约与申请材料。",
          "2. 现场进行指纹采集、面部生物特征扫描及面谈。",
          "3. 通过银行缴纳国家法定非税收入 (PNBP)。",
          "4. 约 3 至 4 个工作日领取证件。"
        ],
        biaya: "按印尼国家移民局非税规费标准收取 (普通护照35万印尼盾，电子护照65万印尼盾)",
        sla: "采集生物信息后 3 至 4 个工作日",
        lokasiLoket: "MPP 一楼 14 号窗口（移民出入境服务台）",
        targetSectionId: "layanan",
        category: "出入境与外事"
      };
    }

    // 7. 警方无犯罪记录证明 (SKCK - 鲁武县警察局)
    if (
      clean.includes('无犯罪') || 
      clean.includes('skck') || 
      clean.includes('警方证明') || 
      clean.includes('良民证')
    ) {
      return {
        matched: true,
        serviceTitle: "警方无犯罪记录证明书 (SKCK)",
        instansi: "鲁武县警察局 (Polres Luwu) MPP 便民服务窗口",
        speechText: "您好，欢迎来到鲁武县警察局政务专窗。办理无犯罪记录证明 SKCK 所需材料：身份证、家庭卡、出生证明或最高学历证书复印件、四张红底四乘六厘米近期彩色证件照、指纹采集卡以及印尼国民医保有效凭证。法定非税收费为三万印尼盾，在一楼 13 号窗口十至十五分钟即可办理完毕。",
        query,
        persyaratan: [
          "申请人印尼居民身份证(KTP)或外国居留证明及家庭户口卡复印件。",
          "出生证明、结婚证或最后学历毕业证书复印件。",
          "近期红底正面免冠彩色证件照4张（4x6厘米规格）。",
          "印尼刑侦局指纹采集公式卡（首次申领可在现场窗口免费录入）。",
          "国家医保 (BPJS Kesehatan) 参保有效凭证。"
        ],
        alurProses: [
          "1. 在大厅取号机领取 SKCK 警务窗口号，或通过 Polri Presisi 手机端预填资料。",
          "2. 前往一楼 13 号警务窗口核验证件并采集双手指纹。",
          "3. 缴纳法定国家非税收入(PNBP)规费 30,000 印尼盾。",
          "4. 窗口现场打印无犯罪证明书并加盖防伪钢印交割。"
        ],
        biaya: "国家法定非税规费 (PNBP): 30,000 印尼盾",
        sla: "10 至 15 分钟",
        lokasiLoket: "MPP 一楼 13 号窗口（鲁武县警察局 SKCK 专窗）",
        targetSectionId: "layanan",
        category: "警务便民"
      };
    }

    // 8. 驾驶执照换发 (SIM A / C - 鲁武县交警支队)
    if (
      clean.includes('驾照') || 
      clean.includes('驾驶证') || 
      clean.includes('换证') || 
      clean.includes('sim a') || 
      clean.includes('sim c')
    ) {
      return {
        matched: true,
        serviceTitle: "机动车驾驶执照期满换发 (SIM A 与 SIM C)",
        instansi: "鲁武县交警支队 (Satlantas Polres Luwu) MPP 服务窗口",
        speechText: "您好，办理汽车 SIM A 或摩托车 SIM C 驾驶执照到期换证：请携带未过期的原驾驶证原件、身份证复印件两份、身体健康体检合格表及心理测试合格证明，体检与心理测试均可在 MPP 一楼驻点医疗点直接完成。法定非税规费为汽车八万印尼盾，摩托车七万五千印尼盾，在一楼 11 与 12 号窗口约二十分钟换发新证。",
        query,
        persyaratan: [
          "尚在有效期内的机动车驾驶证原件（过期须重新考领）。",
          "申请人身份证(KTP)复印件2份。",
          "执业医师出具的身体健康体检证明（可在 MPP 一楼医务室现场体检）。",
          "驾驶员心理适应性评估合格报告（可在 MPP 心理测试专柜完成）。"
        ],
        alurProses: [
          "1. 在大堂取号机领取交警窗口号，并在驻点医务室完成体检与心理测试。",
          "2. 将材料递交至一楼 11 与 12 号交警换证窗口。",
          "3. 在银行窗口缴纳法定非税规费。",
          "4. 现场数码摄像、采集电子签名及双手指纹。",
          "5. 塑封制证机现场压制新驾照并即时交付。"
        ],
        biaya: "法定规费：汽车驾照 SIM A 八万印尼盾 | 摩托车驾照 SIM C 七万五千印尼盾（体检费另计）",
        sla: "15 至 25 分钟",
        lokasiLoket: "MPP 一楼 11 与 12 号窗口（交警支队服务台）",
        targetSectionId: "layanan",
        category: "交警政务"
      };
    }

    // 9. 车船税与机动车年审 (SAMSAT 窗口)
    if (
      clean.includes('车船税') || 
      clean.includes('年审') || 
      clean.includes('车辆税') || 
      clean.includes('samsat') || 
      clean.includes('行驶证') ||
      clean.includes('stnk')
    ) {
      return {
        matched: true,
        serviceTitle: "机动车年度车船税缴纳与行驶证年审 (SAMSAT)",
        instansi: "南苏省地税局、交警与国家交强险联合机动车窗口 (SAMSAT Belopa)",
        speechText: "您好，欢迎来到机动车税务窗口。办理摩托车与汽车年度车船税缴纳及行驶证年审：所需材料包括机动车行驶证 STNK 原件、车主本人有效身份证件原件及上一年度完税凭单。在一楼 16 号窗口核验后支持银行或二维码缴费，五至十分钟即可完成行驶证签章换发。",
        query,
        persyaratan: [
          "机动车行驶证(STNK)原件。",
          "车主本人身份证(KTP)原件（名字需与行驶证完全一致）。",
          "上一年度完税通知单(SKPD)原件。",
          "如委托他人办理，需出具授权委托书及代办人身份证原件。"
        ],
        alurProses: [
          "1. 在大厅取号机领取 SAMSAT 窗口号。",
          "2. 前往一楼 16 号窗口递交原件核验证件真伪与税额。",
          "3. 缴纳机动车税与法定道路乘客强制意外伤害保险(SWDKLLJ)。",
          "4. 窗口即时打印带防伪全息标识的完税凭单并在行驶证附页盖章。"
        ],
        biaya: "按南苏省机动车法定核定税单收取（无任何窗口代办附加费）",
        sla: "5 至 10 分钟",
        lokasiLoket: "MPP 一楼 16 号窗口（SAMSAT 便民专窗）",
        targetSectionId: "layanan",
        category: "车辆财税"
      };
    }

    // 10. 国民医疗保险与劳工社保 (BPJS Kesehatan & BPJS Ketenagakerjaan)
    if (
      clean.includes('医保') || 
      clean.includes('bpjs') || 
      clean.includes('社保') || 
      clean.includes('劳工保险') || 
      clean.includes('工伤') || 
      clean.includes('养老金') || 
      clean.includes('健康保险')
    ) {
      return {
        matched: true,
        serviceTitle: "印尼国民健康保险 (BPJS Kesehatan) 与劳工工伤社保 (BPJS Ketenagakerjaan)",
        instansi: "印尼国家健康保障局与劳工社保局驻 MPP 窗口",
        speechText: "您好，欢迎来到社会保障综合服务区。办理全民医保或劳工社保个人参保、定点医院门诊变更或缴费账户绑定：所需材料包括身份证与家庭卡原件，个人参保绑定自动扣款需提供印尼主流商业银行账户存折。窗口咨询与业务办理全程免收手续费，在一楼 08 与 09 号窗口十至十五分钟办结。",
        query,
        persyaratan: [
          "有效居民身份证(KTP)与家庭户口卡(KK)复印件。",
          "个人自愿参保扣费绑定的商业银行存折（BRI、BNI、Mandiri、BCA等）。",
          "企业单位劳工参保需提供员工薪资花名册与企业统一商业编号(NIB)。"
        ],
        alurProses: [
          "1. 在大堂取号机领取 BPJS 业务窗口流水号。",
          "2. 在一楼 08 与 09 号窗口完成全国社保数据库信息核查。",
          "3. 选择就近定点基础医疗门诊或诊所。",
          "4. 现场打印纸质核验单，或在手机 Mobile JKN 软件即时获取电子医保卡。"
        ],
        biaya: "100% 免费办理行政入网（按法定档次缴纳每月保费）",
        sla: "10 至 15 分钟",
        lokasiLoket: "MPP 一楼 08 与 09 号窗口（社会保障联合专柜）",
        targetSectionId: "layanan",
        category: "社会保障与民生"
      };
    }

    // 11. 大楼开放时间与作息时间
    if (
      clean.includes('开放时间') || 
      clean.includes('营业时间') || 
      clean.includes('工作时间') || 
      clean.includes('作息') || 
      clean.includes('几点开门') || 
      clean.includes('几点关门') || 
      clean.includes('周末') || 
      clean.includes('上班')
    ) {
      return {
        matched: true,
        serviceTitle: "鲁武县公共服务大楼 (MPP Simpurusiang) 办公作息与开放时间",
        instansi: "鲁武县公共服务大楼运营管理中心",
        speechText: "您好，欢迎来到鲁武县公共服务大楼。我们的官方对外政务办公时间为：周一至周四上午 07:30 至下午 16:00，周五上午 07:30 至下午 16:30（印尼中部时间 WITA）。周六、周日及印尼法定国家节假日闭馆休整。全楼汇集 19 个政府行政与公共服务部门，提供 120 多项一站式服务。",
        query,
        persyaratan: [
          "携带本人有效法定身份证件（身份证或护照）。",
          "携带所办理业务对应的证明与申请文件。",
          "在大堂排队机触摸取号。"
        ],
        alurProses: [
          "1. 前往鲁武县别洛帕 (Belopa) 综合办公园区 MPP Simpurusiang 大楼。",
          "2. 在大堂触摸屏排队机选择对应机构窗口取号。",
          "3. 在空调候迎大厅等候叫号，大厅提供免费饮水机、手机充电桩与高速无线网络。",
          "4. 叫号后前往一楼对应窗口完成业务办理。"
        ],
        biaya: "大厅进出与政务咨询 100% 免费",
        sla: "周一至周四: 07:30 - 16:00 | 周五: 07:30 - 16:30 (WITA)",
        lokasiLoket: "印度尼西亚南苏拉威西省鲁武县别洛帕综合大楼",
        targetSectionId: "jam-operasional",
        category: "大楼运营信息"
      };
    }

    // 12. 大厅排队取号与触屏自助机流程
    if (
      clean.includes('排队') || 
      clean.includes('取号') || 
      clean.includes('预约') || 
      clean.includes('自助终端') || 
      clean.includes('大堂') || 
      clean.includes('怎么取号')
    ) {
      return {
        matched: true,
        serviceTitle: "大厅触屏排队取号机与在线预约使用流程",
        instansi: "MPP Simpurusiang 大堂综合引导服务中心",
        speechText: "您好，在大楼办理业务取号：步入大楼大堂后，点击迎宾排队机屏幕上的目标机构图标，即可打印出带二维码的纸质排队单。候迎大厅吊顶安装有类似国际机场的电子叫号显示屏，大屏翻牌并伴随智能语音提醒前往指定窗口办理，也可通过官方门户网站提前在线预约。",
        query,
        persyaratan: [
          "携带本人身份证或记下身份证号码(NIK)。",
          "明确需要办理业务的对应部门（如民政、交警、规划、医保等）。"
        ],
        alurProses: [
          "1. 步入正门大厅，前往立式双屏触摸排队机前。",
          "2. 在触摸屏上轻触办理机构或扫描身份证二维码条码。",
          "3. 取出打印出的官方排队纸条，纸条印有字母流水号与预计等候人数。",
          "4. 观察大厅吊顶 LED 航显大屏叫号，或聆听中英印三语语音叫号前往相应柜台。"
        ],
        biaya: "100% 全程免费自助服务",
        sla: "即时出票（10秒内完成取号）",
        lokasiLoket: "MPP Simpurusiang 正门大厅中央自助服务区",
        targetSectionId: "antrean",
        category: "大厅便民"
      };
    }

    // 13. 无障碍助残通道、免费轮椅与母婴哺乳室设施
    if (
      clean.includes('轮椅') || 
      clean.includes('残疾') || 
      clean.includes('无障碍') || 
      clean.includes('盲道') || 
      clean.includes('母婴') || 
      clean.includes('哺乳') || 
      clean.includes('设施') || 
      clean.includes('老人')
    ) {
      return {
        matched: true,
        serviceTitle: "无障碍助残绿色通道、免费轮椅与母婴哺乳室设施",
        instansi: "鲁武县公共服务大楼管理处·便民关怀专席",
        speechText: "您好，欢迎来到鲁武县公共服务大楼。本楼全方位遵照无障碍无差别人性化标准建设：主入口门岗备有免费便民轮椅，地面铺设贯通各窗口的黄色盲人触觉导引砖，设有低位轮椅专用爱心窗口、带安全扶手的残疾人专用独立卫生间、手语翻译协助专席，以及配备舒适沙发、母乳冷藏冰箱与奶瓶消毒器的私密母婴哺乳室，全馆设施免费向所有公众开放。",
        query,
        persyaratan: [
          "无需任何特殊审批手续，在门岗或前台登记即可免费借用轮椅。",
          "需要全程陪办协助的特殊群体可通过门户预约或直接向大堂安保示意。"
        ],
        alurProses: [
          "1. 抵达大楼正门，向门岗警卫或前台提出轮椅借用需求。",
          "2. 志愿者或安保人员全程陪护，沿触觉盲道引导致专属低位无障碍窗口优先办理。",
          "3. 哺乳期母亲可直接使用一楼安静卫生的专用母婴哺乳室休息更衣。"
        ],
        biaya: "100% 免费提供公益爱心服务",
        sla: "抵达现场即刻提供贴心响应",
        lokasiLoket: "正门警卫室、一楼大厅无障碍专席及一楼独立母婴哺乳室",
        targetSectionId: "fasilitas",
        category: "无障碍关怀"
      };
    }

    // Chinese generic fallback
    return {
      matched: false,
      serviceTitle: `政务服务咨询: ${query}`,
      instansi: "印度尼西亚鲁武县公共服务大楼 (MPP Simpurusiang)",
      speechText: `您好，感谢您咨询关于 "${query}" 的事项。鲁武县公共服务大楼入驻了 19 个官方政府部门与国有企事业单位，提供 120 余项综合政务服务。我们一楼大厅综合咨询台的工作人员在周一至周四 07:30 至 16:00，周五 07:30 至 16:30 随时为您提供竭诚服务。`,
      query,
      persyaratan: [
        "携带本人有效身份证件（身份证或护照）。",
        "携带所办理业务对应的证明与申请文件。",
        "在大厅自助排队机领取官方业务流水号。"
      ],
      alurProses: [
        "1. 前往鲁武县别洛帕 (Belopa) 综合办公园区 MPP Simpurusiang 大楼。",
        "2. 在大堂触摸屏排队机选择对应机构窗口取号。",
        "3. 在空调候迎大厅等候叫号。",
        "4. 前往对应窗口完成材料审核与业务办理。"
      ],
      biaya: "绝大多数行政审批与民生咨询 100% 免费（法定非税规费除外）。",
      sla: "周一至周四: 07:30 - 16:00 | 周五: 07:30 - 16:30 (WITA)",
      lokasiLoket: "印度尼西亚南苏拉威西省鲁武县别洛帕 MPP 综合大楼",
      targetSectionId: "layanan",
      category: "一站式综合政务"
    };
  }

  // --- BAHASA INDONESIA VOICE KNOWLEDGE ENGINE (DEFAULT) ---
  // 1. PERSYARATAN & ALUR PBG (Persetujuan Bangunan Gedung) / IMB / SLF / SIMBG
  if (
    clean.includes('pbg') || 
    clean.includes('imb') || 
    clean.includes('bangunan') || 
    clean.includes('simbg') || 
    clean.includes('persetujuan bangunan') || 
    clean.includes('izin mendirikan') ||
    clean.includes('gedung')
  ) {
    const persyaratan = [
      "KTP-el dan NPWP Pemohon / Pemilik Tanah, atau NIB bagi Badan Usaha.",
      "Bukti Kepemilikan Hak atas Tanah yang sah (Sertifikat SHM/HGB) atau Surat Perjanjian Pemanfaatan Tanah bermeterai sah Notaris.",
      "Dokumen Rencana Teknis Arsitektur (Site plan, denah tata letak, tampak depan/samping, potongan melintang, spesifikasi bahan).",
      "Dokumen Rencana Teknis Struktur (Gambar pondasi, kolom, balok beton/baja, rangka atap beserta nota perhitungan konstruksi).",
      "Dokumen Gambar Rencana Utilitas Mekanikal & Elektrikal / MEP (Instalasi listrik, penangkal petir, sanitasi septic tank, proteksi kebakaran).",
      "Konfirmasi Kesesuaian Tata Ruang (PKKPR) dari Dinas PUTR / DPMPTSP Luwu.",
      "Dokumen Lingkungan Hidup (SPPL, UKL-UPL, atau AMDAL sesuai skala bangunan)."
    ];

    const alurProses = [
      "1. Pendaftaran Permohonan: Pemohon membuat akun dan mengunggah berkas pada portal nasional SIMBG (simbg.pu.go.id) atau didampingi petugas di Loket Dinas PUPR MPP Luwu.",
      "2. Verifikasi Dokumen: Tim Penilai Teknis (TPT) Dinas PUPR memeriksa kelengkapan administrasi dan dokumen teknis perencanaan.",
      "3. Konsultasi Teknis: Pemohon dan perencana mengikuti sidang konsultasi teknis bersama Tim Profesi Ahli (TPA) / TPT.",
      "4. Penetapan & Pembayaran Retribusi: Dinas PUPR menerbitkan Surat Ketetapan Retribusi Daerah (SKRD), pemohon membayar di loket Bank Sulselbar MPP.",
      "5. Penerbitan Izin PBG: DPMPTSP Luwu menerbitkan dokumen resmi PBG dengan Tanda Tangan Elektronik (BSrE)."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk mengurus izin Persetujuan Bangunan Gedung atau PBG di MPP Simpurusiang Luwu, berikut persyaratan lengkapnya: " +
      "Pertama, KTP dan NPWP pemohon atau NIB untuk badan usaha. " +
      "Kedua, Bukti kepemilikan tanah yang sah seperti sertifikat SHM, HGB, atau surat perjanjian pemanfaatan tanah. " +
      "Ketiga, Dokumen teknis perencanaan arsitektur, gambar struktur, dan utilitas mekanikal elektrikal. " +
      "Keempat, Bukti Kesesuaian Tata Ruang atau PKKPR, serta dokumen lingkungan SPPL. " +
      "Alur prosesnya terdiri dari lima tahapan: " +
      "Satu, Pendaftaran akun dan berkas melalui portal SIMBG, atau didampingi petugas di loket Dinas PUPR MPP Luwu. " +
      "Dua, Verifikasi berkas administrasi dan teknis oleh Tim Penilai Teknis. " +
      "Tiga, Konsultasi teknis perencanaan dan penetapan besaran retribusi daerah. " +
      "Empat, Pembayaran retribusi di loket Bank Sulselbar MPP. " +
      "Lima, Penerbitan dokumen resmi izin PBG bertandatangan elektronik oleh Kepala DPMPTSP Luwu. " +
      "Estimasi waktu proses adalah tiga sampai empat belas hari kerja.";

    return {
      matched: true,
      serviceTitle: "Persetujuan Bangunan Gedung (PBG) & SLF",
      instansi: "Dinas Pekerjaan Umum & Penataan Ruang (PUPR) kolaborasi DPMPTSP Kab. Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "Sesuai Perda Retribusi Bangunan Gedung (Dihitung berdasarkan indeks fungsi, kompleksitas, dan luas lantai bangunan) dibayar via Bank Sulselbar.",
      sla: "3 s.d. 14 Hari Kerja",
      lokasiLoket: "Loket 04 & 05 (Helpdesk SIMBG & Penataan Ruang) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Perizinan & Tata Ruang"
    };
  }

  // 2. KTP-EL / KTP DIGITAL / KIA / KK (DISDUKCAPIL LUWU)
  if (
    clean.includes('ktp') || 
    clean.includes('e-ktp') || 
    clean.includes('identitas') || 
    clean.includes('kartu keluarga') || 
    clean.includes(' kk') || 
    clean.includes('disdukcapil') || 
    clean.includes('dukcapil') ||
    clean.includes('kia') ||
    clean.includes('perekaman') ||
    clean.includes('perubahan data') ||
    clean.includes('pindah') ||
    clean.includes('domisili') ||
    clean.includes('skpwni')
  ) {
    const persyaratan = [
      "KTP Pemula (Usia 17 tahun): Fotokopi Kartu Keluarga (KK) terbaru, hadir langsung untuk perekaman foto, sidik jari, dan iris mata.",
      "KTP Rusak: Membawa fisik KTP-el lama yang rusak dan fotokopi Kartu Keluarga.",
      "KTP Hilang: Surat Keterangan Tanda Lapor Kehilangan dari Polsek/Polres + Fotokopi Kartu Keluarga.",
      "Penerbitan / Perubahan KK: KK lama asli, Surat Keterangan Lahir / Kematian / Surat Nikah / SKPWNI pindah domisili.",
      "Kartu Identitas Anak (KIA): Fotokopi Akta Lahir, Fotokopi KK, dan pasfoto anak 2x3 (2 lembar untuk anak usia di atas 5 tahun)."
    ];

    const alurProses = [
      "1. Ambil nomor antrean Loket Disdukcapil di Kiosk Layar Sentuh Lobi Utama MPP Simpurusiang.",
      "2. Verifikasi berkas identitas di Loket Front Office Disdukcapil.",
      "3. Perekaman biometrik (foto, sidik jari, iris mata) atau proses validasi NIK terpusat.",
      "4. Pencetakan fisik KTP-el atau pencetakan mandiri instan via Mesin Anjungan Dukcapil Mandiri (ADM).",
      "5. Petugas juga memfasilitasi aktivasi Identitas Kependudukan Digital (IKD) di smartphone warga."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pengurusan KTP elektronik di Loket Disdukcapil MPP Simpurusiang Luwu: " +
      "Persyaratannya adalah: Jika pembuatan baru usia tujuh belas tahun, cukup membawa fotokopi Kartu Keluarga dan hadir langsung untuk perekaman foto serta sidik jari. " +
      "Jika KTP rusak, bawa fisik KTP lama dan fotokopi KK. Jika KTP hilang, bawa Surat Kehilangan dari Kepolisian dan fotokopi KK. " +
      "Alur prosesnya: Ambil antrean di lobi utama, verifikasi berkas di loket Disdukcapil, perekaman data, dan KTP langsung dicetak atau bisa dicetak mandiri di mesin ADM. " +
      "Seluruh layanan Disdukcapil adalah gratis seratus persen, tanpa dipungut biaya retribusi, dengan estimasi waktu lima belas sampai tiga puluh menit selesai.";

    return {
      matched: true,
      serviceTitle: "Penerbitan KTP Elektronik & Kartu Keluarga",
      instansi: "Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil) Kab. Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS 100% (Bebas Retribusi)",
      sla: "15 s.d. 30 Menit Selesai (Bila Jaringan SIAK Pusat Normal)",
      lokasiLoket: "Loket 01, 02, 03 & Mesin ADM Mandiri Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Kependudukan & Catatan Sipil"
    };
  }

  // 3. PERPANJANG SIM A & SIM C (GERAI SATLANTAS POLRES LUWU)
  if (
    clean.includes('sim') || 
    clean.includes('perpanjang sim') || 
    clean.includes('sim a') || 
    clean.includes('sim c') || 
    clean.includes('surat izin mengemudi')
  ) {
    const persyaratan = [
      "SIM Asli yang masih berlaku (belum melewati tanggal masa berlaku / batas kadaluarsa).",
      "Fotokopi KTP-el pemohon (2 lembar).",
      "Surat Keterangan Pemeriksaan Kesehatan Jasmani dari Dokter (tersedia di klinik faskes MPP).",
      "Surat Keterangan Lulus Tes Psikologi SIM (dapat dilakukan di loket psikologi MPP Simpurusiang)."
    ];

    const alurProses = [
      "1. Ambil nomor antrean Gerai Polres Luwu di Kiosk MPP.",
      "2. Mengikuti pemeriksaan kesehatan dokter dan tes psikologi di area lantai 1 MPP.",
      "3. Menyerahkan berkas persyaratan di Loket Pendaftaran SIM Satlantas Polres Luwu.",
      "4. Pembayaran biaya PNBP resmi di loket Bank / BRI.",
      "5. Pengambilan foto digital, sidik jari biometrik, dan tanda tangan digital.",
      "6. Pencetakan fisik SIM baru dan penyerahan kepada pemohon."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk perpanjangan SIM A atau SIM C di Gerai Satlantas Polres Luwu di MPP Simpurusiang: " +
      "Persyaratannya adalah membawa fisik SIM lama yang masih berlaku, fotokopi KTP elektronik dua lembar, Surat Keterangan Sehat dari dokter, dan Surat Lulus Tes Psikologi yang keduanya dapat langsung dilakukan di gedung MPP. " +
      "Alur prosesnya: Ambil nomor antrean, lakukan tes kesehatan dan psikologi di tempat, verifikasi berkas, bayar biaya PNBP resmi, foto biometrik, dan SIM baru langsung dicetak. " +
      "Biaya PNBP resmi adalah delapan puluh ribu rupiah untuk SIM A, dan tujuh puluh lima ribu rupiah untuk SIM C. Estimasi waktu sekitar dua puluh menit.";

    return {
      matched: true,
      serviceTitle: "Perpanjangan SIM A & SIM C",
      instansi: "Satlantas Polres Luwu (Gerai Pelayanan Terpadu MPP)",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "PNBP Resmi PP No. 76/2020: SIM A Rp 80.000 | SIM C Rp 75.000 (di luar biaya tes dokter & psikologi)",
      sla: "15 s.d. 25 Menit",
      lokasiLoket: "Loket 11 & 12 (Gerai Satlantas Polres Luwu) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Kepolisian & SIM"
    };
  }

  // 4. PENERBITAN SKCK (POLRES LUWU)
  if (
    clean.includes('skck') || 
    clean.includes('catatan kepolisian') || 
    clean.includes('kelakuan baik')
  ) {
    const persyaratan = [
      "Fotokopi KTP-el dan Kartu Keluarga (KK).",
      "Fotokopi Akta Kelahiran / Surat Kenal Lahir / Ijazah Terakhir.",
      "Pasfoto berwarna ukuran 4x6 latar belakang MERAH (sebanyak 4 lembar).",
      "Rumus Sidik Jari dari Satreskrim (bagi pemohon baru, dapat diambil langsung di loket).",
      "Bukti kepesertaan aktif BPJS Kesehatan (sesuai Perpol No. 6 Tahun 2023)."
    ];

    const alurProses = [
      "1. Ambil nomor antrean loket SKCK di Kiosk MPP atau isi formulir pendaftaran via aplikasi SuperApp Polri Presisi.",
      "2. Verifikasi berkas dokumen dan pengambilan sidik jari (bagi pembuat baru).",
      "3. Pembayaran biaya PNBP resmi sebesar Rp 30.000 di loket kasir / BRI.",
      "4. Pencetakan naskah SKCK resmi, penandatanganan, dan legalisir."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pembuatan atau perpanjangan SKCK di Gerai Polres Luwu MPP Simpurusiang: " +
      "Persyaratannya adalah fotokopi KTP, fotokopi Kartu Keluarga, fotokopi Akta Lahir atau Ijazah terakhir, pasfoto ukuran empat kali enam latar merah empat lembar, dan rumus sidik jari bagi pemohon baru. " +
      "Alur prosesnya: Ambil tiket antrean, verifikasi berkas dan rumus sidik jari, bayar biaya PNBP resmi tiga puluh ribu rupiah, dan SKCK langsung dicetak serta dilegalisir. " +
      "Estimasi waktu proses sekitar lima belas menit.";

    return {
      matched: true,
      serviceTitle: "Penerbitan SKCK (Surat Keterangan Catatan Kepolisian)",
      instansi: "Sat Intelkam Polres Luwu (Gerai Pelayanan Terpadu MPP)",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "PNBP Resmi PP No. 76/2020: Rp 30.000",
      sla: "10 s.d. 15 Menit",
      lokasiLoket: "Loket 13 (Pelayanan SKCK Polres Luwu) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Kepolisian & SKCK"
    };
  }

  // 5. NIB & IZIN USAHA OSS-RBA (DPMPTSP)
  if (
    clean.includes('nib') || 
    clean.includes('oss') || 
    clean.includes('izin usaha') || 
    clean.includes('nomor induk berusaha') || 
    clean.includes('umkm') || 
    clean.includes('izin dagang') ||
    clean.includes('perizinan berusaha')
  ) {
    const persyaratan = [
      "KTP-el Pemilik Usaha / Direktur Perusahaan.",
      "Nomor Pokok Wajib Pajak (NPWP) aktif.",
      "Nomor WhatsApp dan Alamat Email aktif untuk verifikasi akun OSS.",
      "Rincian Data Usaha: Nama usaha, alamat lokasi usaha, besaran modal usaha, dan jenis kegiatan usaha (KBLI 5 digit).",
      "Akta Notaris & SK Kemenkumham (khusus untuk badan usaha PT, CV, atau Koperasi)."
    ];

    const alurProses = [
      "1. Tiba di Loket Helpdesk OSS DPMPTSP Luwu Lantai 1 MPP.",
      "2. Pembuatan hak akses akun OSS (oss.go.id) didampingi petugas.",
      "3. Pengisian formulir data pelaku usaha, pemilihan KBLI 5 digit, dan validasi tata ruang PKKPR otomatis.",
      "4. Validasi komitmen lingkungan (SPPL) secara sistemik.",
      "5. Penerbitan instan dokumen Nomor Induk Berusaha (NIB) bersertifikat elektronik BSrE."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pengurusan NIB atau Nomor Induk Berusaha melalui sistem OSS di DPMPTSP MPP Luwu: " +
      "Persyaratannya sangat mudah, yaitu KTP elektronik, NPWP, nomor WhatsApp dan email aktif, serta rincian jenis usaha dan modal usaha Anda. " +
      "Alur prosesnya: Petugas Helpdesk kami di MPP akan mendampingi pembuatan akun OSS, pengisian data usaha KBLI, validasi tata ruang, hingga NIB dan izin edar resmi langsung terbit di tempat. " +
      "Layanan penerbitan NIB ini adalah gratis seratus persen bebas biaya retribusi, dengan waktu pengerjaan hanya sekitar sepuluh sampai lima belas menit.";

    return {
      matched: true,
      serviceTitle: "Penerbitan Nomor Induk Berusaha (NIB) OSS-RBA",
      instansi: "DPMPTSP Luwu (Penyelenggara Perizinan Berusaha)",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS 100% (Bebas Biaya)",
      sla: "10 s.d. 15 Menit (Langsung Terbit di Loket)",
      lokasiLoket: "Loket 06 & 07 (Helpdesk OSS-RBA & Investasi) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Perizinan Berusaha & Investasi"
    };
  }

  // 6. KESESUAIAN TATA RUANG / PKKPR / KKPR (DINAS PUTR & DPMPTSP)
  if (
    clean.includes('pkkpr') || 
    clean.includes('kkpr') || 
    clean.includes('tata ruang') || 
    clean.includes('kesesuaian ruang') || 
    clean.includes('zonasi') || 
    clean.includes('rtrw')
  ) {
    const persyaratan = [
      "KTP-el Pemohon atau Akta Perusahaan.",
      "Peta Spasial / Titik Koordinat Polygon Lahan (Latitude & Longitude).",
      "Bukti Alas Hak Tanah (Sertifikat SHM/HGB, Akta Jual Beli, atau Surat Penguasaan Fisik Tanah).",
      "Rencana Teknis Pemanfaatan Lahan dan estimasi luas bangunan yang akan didirikan."
    ];

    const alurProses = [
      "1. Pengajuan permohonan via OSS-RBA atau konsultasi spasial di Loket Penataan Ruang MPP.",
      "2. Verifikasi tumpang tindih spasial terhadap Perda RTRW Kab. Luwu No. 6/2011 dan peta RDTR.",
      "3. Analisis teknis fungsi kawasan (Kawasan Pertanian, Industri, Perkim, atau Lindung) oleh Dinas PUTR.",
      "4. Penerbitan Berita Acara Pertimbangan Teknis Pertanahan (PTP BPN) jika diperlukan.",
      "5. Penerbitan Surat Keputusan Konfirmasi / Persetujuan PKKPR resmi."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pengurusan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang atau PKKPR di MPP Luwu: " +
      "Persyaratannya meliputi KTP pemohon, titik koordinat poligon lahan, bukti alas hak sertifikat tanah, dan rencana teknis penggunaan lahan. " +
      "Alur prosesnya: Pendaftaran via OSS atau loket tata ruang MPP, pengecekan spasial GIS terhadap Perda RTRW Luwu, kajian teknis zonasi oleh Dinas PUTR, dan penerbitan Surat Konfirmasi PKKPR resmi sebagai syarat utama izin PBG dan NIB. " +
      "Estimasi waktu penyelesaian tiga sampai tujuh hari kerja.";

    return {
      matched: true,
      serviceTitle: "Persetujuan Kesesuaian Pemanfaatan Ruang (PKKPR)",
      instansi: "Dinas Pekerjaan Umum & Tata Ruang kolaborasi DPMPTSP Kab. Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "Sesuai Ketentuan PP Perizinan Spasial / Bebas Retribusi untuk UMK",
      sla: "3 s.d. 7 Hari Kerja",
      lokasiLoket: "Loket 04 (Penataan Ruang & Tata Kota) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Tata Ruang & Spasial"
    };
  }

  // 7. PERTANAHAN / SERTIFIKAT TANAH / PTSL (KANTOR PERTANAHAN BPN LUWU)
  if (
    clean.includes('tanah') || 
    clean.includes('sertifikat') || 
    clean.includes('bpn') || 
    clean.includes('pertanahan') || 
    clean.includes('ptsl') || 
    clean.includes('balik nama') || 
    clean.includes('roya')
  ) {
    const persyaratan = [
      "KTP-el dan Kartu Keluarga (KK) Pemohon / Ahli Waris.",
      "Sertifikat Tanah Asli (untuk balik nama, roya, atau pemecahan).",
      "Akta Jual Beli (AJB) / Akta Hibah / Surat Keterangan Waris dari PPAT/Notaris.",
      "Bukti lunas pembayaran PBB-P2 tahun berjalan dan bukti setor validasi BPHTB dari Bapenda.",
      "Surat Permohonan dan Surat Kuasa bermeterai (jika dikuasakan)."
    ];

    const alurProses = [
      "1. Ambil nomor antrean Gerai BPN di Kiosk Lobi Utama MPP.",
      "2. Verifikasi berkas fisik dan status sertifikat di Loket ATR/BPN.",
      "3. Penerbitan Surat Perintah Setor (SPS) tarif PNBP BPN.",
      "4. Pembayaran biaya PNBP di loket Bank Sulselbar MPP.",
      "5. Proses pencatatan buku tanah di Kantor Pertanahan dan penyerahan sertifikat resmi."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk layanan pertanahan dan sertifikat di Gerai BPN ATR MPP Simpurusiang: " +
      "Persyaratannya adalah KTP dan KK pemohon, sertifikat tanah asli, akta jual beli atau waris dari PPAT, serta bukti lunas PBB dan validasi BPHTB dari Bapenda. " +
      "Alur prosesnya: Ambil antrean, verifikasi berkas di loket BPN MPP, pembayaran biaya PNBP resmi di Bank Sulselbar, dan proses pencatatan di buku tanah hingga sertifikat diserahkan. " +
      "Biaya dihitung resmi sesuai tarif PNBP Kementerian ATR BPN.";

    return {
      matched: true,
      serviceTitle: "Layanan Pertanahan & Sertifikasi Tanah",
      instansi: "Kantor Pertanahan (ATR/BPN) Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "PNBP Resmi PP No. 128/2015 (Dihitung berdasarkan luas, lokasi, dan jenis hak)",
      sla: "3 s.d. 14 Hari Kerja (Sesuai Jenis Layanan Balik Nama/Roya/Pengecekan)",
      lokasiLoket: "Loket 08 & 09 (Gerai ATR/BPN Luwu) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Pertanahan & Agraria"
    };
  }

  // 8. PASPOR / IMIGRASI
  if (
    clean.includes('paspor') || 
    clean.includes('imigrasi') || 
    clean.includes('visa')
  ) {
    const persyaratan = [
      "KTP-el asli dan fotokopi.",
      "Kartu Keluarga (KK) asli dan fotokopi.",
      "Akta Kelahiran, Buku Nikah, atau Ijazah sekolah yang memuat nama, tanggal lahir, dan nama orang tua.",
      "Paspor lama (khusus untuk permohonan penggantian paspor habis masa berlaku).",
      "Surat rekomendasi instansi / paspor dinas (khusus keperluan kedinasan/umrah/haji)."
    ];

    const alurProses = [
      "1. Pendaftaran antrean online via aplikasi M-Paspor (PlayStore/AppStore).",
      "2. Tiba di Loket Imigrasi MPP Simpurusiang sesuai jam yang dipilih.",
      "3. Pemeriksaan berkas asli dan verifikasi data identitas.",
      "4. Pengambilan foto biometrik wajah, sidik jari, dan wawancara singkat.",
      "5. Pembayaran biaya PNBP paspor melalui Bank / Kantor Pos / M-Banking.",
      "6. Pengambilan paspor jadi setelah 3-4 hari kerja."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pengurusan paspor di Unit Layanan Imigrasi MPP Simpurusiang Luwu: " +
      "Persyaratannya adalah membawa KTP asli, Kartu Keluarga, Akta Lahir atau Buku Nikah atau Ijazah, serta paspor lama bagi yang melakukan perpanjangan. " +
      "Alur prosesnya: Daftar nomor antrean di aplikasi M-Paspor, datang ke loket Imigrasi MPP untuk verifikasi berkas, foto biometrik dan wawancara, bayar kode billing di bank, dan paspor dapat diambil setelah tiga sampai empat hari kerja. " +
      "Biaya PNBP resmi adalah tiga ratus lima puluh ribu rupiah untuk paspor biasa, dan enam ratus lima puluh ribu rupiah untuk paspor elektronik.";

    return {
      matched: true,
      serviceTitle: "Penerbitan & Penggantian Paspor RI",
      instansi: "Kantor Imigrasi (Unit Layanan Paspor MPP Simpurusiang)",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "PNBP Resmi: Paspor Biasa 48 Hal Rp 350.000 | E-Paspor Rp 650.000",
      sla: "3 s.d. 4 Hari Kerja Pasca Foto & Pembayaran",
      lokasiLoket: "Loket 14 (Layanan Keimigrasian) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Keimigrasian & Paspor"
    };
  }

  // 9. BPJS KESEHATAN & KETENAGAKERJAAN
  if (
    clean.includes('bpjs') || 
    clean.includes('jkn') || 
    clean.includes('kis') || 
    clean.includes('jamsostek') || 
    clean.includes('faskes') ||
    clean.includes('ketenagakerjaan')
  ) {
    const persyaratan = [
      "KTP-el dan Kartu Keluarga (KK) seluruh anggota keluarga.",
      "Buku Tabungan Bank (BNI, BRI, Mandiri, BCA, atau BTN) untuk pendaftaran autodebet mandiri.",
      "Surat Keterangan Bekerja / Slip Gaji (khusus segmen Pekerja Penerima Upah / Badan Usaha).",
      "Surat Keterangan Tidak Mampu / Terdaftar DTKS (khusus pengusulan PBI jaminan APBD/APBN)."
    ];

    const alurProses = [
      "1. Ambil nomor antrean Loket BPJS di Kiosk Lobi Utama MPP.",
      "2. Verifikasi data kepesertaan di Loket BPJS Kesehatan / Ketenagakerjaan.",
      "3. Petugas memproses pendaftaran baru, mutasi pindah faskes tingkat 1, atau perbaikan data.",
      "4. Penerbitan kartu digital JKN-KIS melalui aplikasi Mobile JKN."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pengurusan BPJS Kesehatan dan BPJS Ketenagakerjaan di MPP Simpurusiang Luwu: " +
      "Persyaratannya adalah membawa KTP dan Kartu Keluarga, buku rekening bank untuk autodebet iuran, atau surat pengantar kerja bagi karyawan badan usaha. " +
      "Alur prosesnya: Ambil tiket antrean, verifikasi data di loket BPJS, dan petugas akan langsung memproses pendaftaran baru, pindah faskes, atau klaim kepesertaan secara cepat. " +
      "Layanan administrasi di loket adalah gratis, dengan waktu pelayanan sepuluh sampai lima belas menit.";

    return {
      matched: true,
      serviceTitle: "Layanan Terpadu BPJS Kesehatan & Ketenagakerjaan",
      instansi: "BPJS Kesehatan Cabang Palopo & BPJS Ketenagakerjaan Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "Pelayanan Administrasi GRATIS (Iuran bulanan sesuai kelas kepesertaan)",
      sla: "10 s.d. 15 Menit",
      lokasiLoket: "Loket 15 & 16 (BPJS Terpadu) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Jaminan Sosial & Kesehatan"
    };
  }

  // 10. PAJAK KENDARAAN / SAMSAT
  if (
    clean.includes('samsat') || 
    clean.includes('pajak motor') || 
    clean.includes('pajak mobil') || 
    clean.includes('stnk') || 
    clean.includes('pkb')
  ) {
    const persyaratan = [
      "STNK Asli dan fotokopi STNK.",
      "KTP-el Asli pemilik kendaraan yang sesuai dengan nama di STNK + fotokopi.",
      "BPKB Asli (opsional/jika diperlukan pengesahan khusus).",
      "Catatan: Untuk pembayaran tahunan tidak perlu membawa fisik kendaraan / cek fisik."
    ];

    const alurProses = [
      "1. Ambil nomor antrean Gerai SAMSAT di Kiosk MPP.",
      "2. Penyerahan berkas STNK dan KTP di Loket Pendaftaran SAMSAT.",
      "3. Penetapan besaran Pajak Kendaraan Bermotor (PKB) dan SWDKLLJ Jasa Raharja.",
      "4. Pembayaran di Kasir Bank Sulselbar SAMSAT.",
      "5. Pencetakan lembar Surat Ketetapan Kewajiban Pembayaran (SKKP) STNK baru."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pembayaran pajak kendaraan bermotor tahunan di Gerai SAMSAT MPP Simpurusiang: " +
      "Persyaratannya cukup membawa STNK asli dan KTP asli pemilik kendaraan beserta fotokopinya. " +
      "Alur prosesnya: Ambil antrean, serahkan STNK dan KTP di loket SAMSAT, bayar pajak di kasir Bank Sulselbar, dan pengesahan STNK tahunan langsung dicetak di tempat tanpa perlu antre berjam-jam. " +
      "Waktu pelayanan hanya sekitar lima sampai sepuluh menit selesai.";

    return {
      matched: true,
      serviceTitle: "Pembayaran Pajak Kendaraan Bermotor (SAMSAT)",
      instansi: "UPT Pendapatan Wilayah Luwu & Satlantas Polres Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "Sesuai Ketetapan Pajak Kendaraan Bermotor (PKB) + SWDKLLJ pada lembar STNK",
      sla: "5 s.d. 10 Menit",
      lokasiLoket: "Loket 10 (Gerai SAMSAT Luwu) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Pajak Kendaraan & SAMSAT"
    };
  }

  // 11. PAJAK DAERAH PBB-P2 & BPHTB (BAPENDA LUWU)
  if (
    clean.includes('pbb') || 
    clean.includes('bphtb') || 
    clean.includes('pajak daerah') || 
    clean.includes('bapenda') || 
    clean.includes('pajak bumi') ||
    clean.includes('retribusi') ||
    clean.includes('pasar')
  ) {
    const persyaratan = [
      "Surat Pemberitahuan Pajak Terhutang (SPPT) PBB tahun berjalan atau tahun sebelumnya.",
      "KTP-el Wajib Pajak / Pemilik Objek Pajak.",
      "Untuk BPHTB: Fotokopi Sertifikat Tanah, Bukti Transaksi Jual Beli / Hibah / Waris dari Notaris PPAT, dan Bukti SSPD BPHTB.",
      "Untuk Retribusi Pasar: Kartu pendaftaran kios/los pedagang resmi."
    ];

    const alurProses = [
      "1. Ambil tiket antrean Loket Bapenda di Kiosk Lobi Utama MPP.",
      "2. Pengecekan data Nilai Jual Objek Pajak (NJOP) dan tagihan PBB/Retribusi.",
      "3. Validasi SSPD BPHTB oleh petugas Bapenda.",
      "4. Pembayaran langsung di loket Bank Sulselbar atau melalui QRIS Bapenda.",
      "5. Penerbitan Bukti Lunas Pembayaran Pajak Daerah resmi."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pembayaran PBB-P2, validasi BPHTB, dan retribusi pasar di Loket Bapenda MPP Simpurusiang: " +
      "Persyaratannya adalah membawa lembar SPPT PBB dan KTP wajib pajak, serta bukti akta jual beli notaris untuk validasi BPHTB. " +
      "Alur prosesnya: Ambil antrean, pengecekan data NJOP di loket Bapenda, pembayaran di loket Bank Sulselbar atau QRIS, dan bukti lunas resmi langsung diterbitkan. " +
      "Estimasi waktu pelayanan lima sampai sepuluh menit.";

    return {
      matched: true,
      serviceTitle: "Pajak Daerah PBB-P2, Validasi BPHTB & Retribusi Pasar",
      instansi: "Badan Pendapatan Daerah (Bapenda) Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "Sesuai Nilai Ketetapan SPPT PBB / BPHTB (5% dari NPOP dikurangi NPOPTKP)",
      sla: "5 s.d. 10 Menit",
      lokasiLoket: "Loket 17 (Bapenda Kab. Luwu) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Perpajakan Daerah"
    };
  }

  // 12. PERNIKAHAN / KUA / BALAI NIKAH TERPADU (KEMENAG LUWU)
  if (
    clean.includes('nikah') || 
    clean.includes('kua') || 
    clean.includes('kemenag') || 
    clean.includes('balai nikah') || 
    clean.includes('perkawinan')
  ) {
    const persyaratan = [
      "Surat Pengantar Nikah dari Desa / Kelurahan (Formulir N1, N2, N4).",
      "Fotokopi KTP-el, Kartu Keluarga, dan Akta Kelahiran Calon Pengantin (Catin).",
      "Pasfoto Catin ukuran 2x3 (4 lembar) dan 4x6 (2 lembar) berlatar belakang BIRU.",
      "Sertifikat Layak Kawin / Elsimil dari Puskesmas / BKKBN.",
      "Fotokopi KTP Orang Tua / Wali Nikah dan 2 orang saksi."
    ];

    const alurProses = [
      "1. Pendaftaran permohonan kehendak nikah melalui portal SIMKAH (simkah.kemenag.go.id) atau di Loket Kemenag MPP.",
      "2. Pemeriksaan berkas dan bimbingan perkawinan singkat oleh Penghulu.",
      "3. Pelaksanaan akad nikah di Balai Nikah Terpadu MPP Simpurusiang.",
      "4. Layanan Inovasi 3-in-1: Pasca ijab kabul, pasangan pengantin langsung menerima Buku Nikah Kemenag, KTP baru status kawin dari Disdukcapil, dan Kartu Keluarga baru."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pendaftaran nikah dan layanan Balai Nikah Terpadu di MPP Simpurusiang Luwu: " +
      "Persyaratannya adalah surat pengantar N1 dari desa atau kelurahan, fotokopi KTP, KK, Akta Lahir calon pengantin, pasfoto latar biru, dan sertifikat Elsimil kesehatan. " +
      "Alur prosesnya: Pendaftaran di loket Kemenag MPP, pemeriksaan berkas catin, pelaksanaan akad nikah di Balai Nikah MPP, dan langsung menerima layanan tiga in satu yaitu Buku Nikah, KTP status kawin baru, dan KK baru di hari yang sama. " +
      "Biaya gratis seratus persen jika menikah di Balai Nikah MPP pada hari dan jam kerja.";

    return {
      matched: true,
      serviceTitle: "Pendaftaran & Balai Nikah Terpadu 3-in-1",
      instansi: "Kementerian Agama (Kemenag) Kab. Luwu & Disdukcapil",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS di Balai Nikah MPP saat jam kerja | PNBP Rp 600.000 jika di luar kantor / hari libur",
      sla: "Pendaftaran H-10 Hari Kerja Sebelum Akad Nikah",
      lokasiLoket: "Loket 18 & Balai Nikah Terpadu Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Keagamaan & Pernikahan"
    };
  }

  // 13. REKOMENDASI BBM SUBSIDI NELAYAN & TAMBAK (DINAS PERIKANAN)
  if (
    clean.includes('bbm') || 
    clean.includes('solar') || 
    clean.includes('nelayan') || 
    clean.includes('tambak') || 
    clean.includes('perikanan')
  ) {
    const persyaratan = [
      "Fotokopi KTP-el pemohon berdomisili di Luwu.",
      "Pas Kecil / Surat Bukti Kepemilikan Perahu atau Surat Bukti Penguasaan / Sewa Tambak Udang/Bandeng.",
      "Surat Pengantar Rekomendasi dari Kepala Desa / Lurah setempat.",
      "Rincian spesifikasi mesin tempel perahu atau mesin pompa/genset tambak."
    ];

    const alurProses = [
      "1. Ambil nomor antrean Loket Dinas Perikanan di Kiosk MPP.",
      "2. Verifikasi dokumen kepemilikan kapal/tambak dan hitung kuota alokasi BBM subsidi.",
      "3. Penerbitan Surat Rekomendasi Pembelian BBM Bersubsidi bertandatangan elektronik.",
      "4. Penyerahan dokumen rekomendasi untuk dibawa ke SPBU / SPBUN resmi yang ditunjuk."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk penerbitan Surat Rekomendasi BBM Bersubsidi bagi nelayan dan pembudidaya tambak di MPP Luwu: " +
      "Persyaratannya adalah membawa fotokopi KTP Luwu, bukti kepemilikan perahu atau surat tambak, surat pengantar dari kepala desa, serta data mesin kapal atau pompa tambak. " +
      "Alur prosesnya: Ambil antrean, verifikasi data di loket Dinas Perikanan MPP, dan Surat Rekomendasi BBM langsung dicetak tanpa biaya retribusi. " +
      "Waktu pelayanan sekitar sepuluh sampai lima belas menit selesai.";

    return {
      matched: true,
      serviceTitle: "Rekomendasi BBM Bersubsidi Nelayan & Tambak",
      instansi: "Dinas Perikanan Luwu (Lantai 1 MPP)",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS 100% (Bebas Biaya)",
      sla: "10 s.d. 15 Menit",
      lokasiLoket: "Loket 19 (Dinas Perikanan Kab. Luwu) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Perikanan & Kelautan"
    };
  }

  // 14. BANTUAN DISABILITAS, KURSI RODA, JURU BAHASA ISYARAT & RUANG LAKTASI
  if (
    clean.includes('bantuan') || 
    clean.includes('kursi roda') || 
    clean.includes('disabilitas') || 
    clean.includes('tuli') || 
    clean.includes('netra') || 
    clean.includes('lansia') || 
    clean.includes('pendamping') ||
    clean.includes('laktasi') ||
    clean.includes('menyusui') ||
    clean.includes('ibu hamil') ||
    clean.includes('fasilitas')
  ) {
    const persyaratan = [
      "Tidak ada syarat dokumen khusus untuk pemanfaatan sarana kursi roda, ruang laktasi, dan pendampingan di lokasi.",
      "Bagi permohonan pendampingan terjadwal: Cukup menginput nama, nomor WhatsApp, dan jam kedatangan di portal atau menghubungi Front Office MPP."
    ];

    const alurProses = [
      "1. Setibanya di gerbang utama MPP, pemohon dapat langsung menuju Pos Pengamanan atau Front Office untuk peminjaman kursi roda gratis.",
      "2. Petugas Front Office ramah disabilitas akan mendampingi langsung dari lobi, membantu pengambilan antrean jalur prioritas khusus.",
      "3. Mengarahkan ke loket layanan berketinggian rendah (<80 cm) dengan fasilitas pendukung bahasa isyarat BISINDO.",
      "4. Bagi ibu menyusui, dapat langsung memanfaatkan Ruang Laktasi ber-AC yang nyaman di Lantai 1."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "MPP Simpurusiang Luwu menyediakan fasilitas inklusif lengkap ramah disabilitas, lansia, dan ibu menyusui. " +
      "Tersedia kursi roda gratis di pintu masuk utama, jalur pemandu ubin taktil kuning untuk tunanetra, loket prioritas tanpa antre panjang, toilet difabel dengan handrail pengaman, pendampingan petugas Front Office dan Juru Bahasa Isyarat, serta Ruang Laktasi higienis yang dilengkapi sofa, kulkas ASI, dan sterilisator botol. " +
      "Semua fasilitas ini disediakan gratis untuk melayani seluruh warga Luwu dengan setara.";

    return {
      matched: true,
      serviceTitle: "Pusat Layanan Asistensi, Inklusif Disabilitas & Ruang Laktasi",
      instansi: "Sekretariat Pengelola MPP Simpurusiang & Front Office",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS 100%",
      sla: "Layanan Langsung Seketika di Lobi Utama",
      lokasiLoket: "Lobi Utama, Jalur Pemandu Taktil & Ruang Laktasi Lantai 1 MPP",
      targetSectionId: "fasilitas",
      category: "Aksesibilitas & Inklusif"
    };
  }

  // 15. AKTA KELAHIRAN & AKTA KEMATIAN (DISDUKCAPIL)
  if (
    clean.includes('akta') || 
    clean.includes('kelahiran') || 
    clean.includes('kematian') || 
    clean.includes('lahir') || 
    clean.includes('meninggal')
  ) {
    const persyaratan = [
      "Surat Keterangan Kelahiran / Kematian asli dari Rumah Sakit / Puskesmas / Kepala Desa / Kelurahan.",
      "Kartu Keluarga (KK) asli dan KTP-el orang tua / pelapor.",
      "Buku Nikah / Kutipan Akta Perkawinan orang tua yang dilegalisir (untuk Akta Lahir).",
      "KTP-el 2 (dua) orang saksi (fotokopi)."
    ];

    const alurProses = [
      "1. Ambil nomor antrean Loket Pencatatan Sipil di Kiosk Lobi Utama MPP.",
      "2. Petugas memverifikasi kelengkapan berkas surat keterangan dan dokumen keluarga.",
      "3. Perekaman data ke sistem database SIAK Terpusat.",
      "4. Penerbitan Akta Kelahiran / Akta Kematian bertanda tangan elektronik (TTE) BSrE serta pembaruan Kartu Keluarga baru."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk penerbitan Akta Kelahiran atau Akta Kematian di Loket Disdukcapil MPP Simpurusiang: " +
      "Persyaratannya adalah membawa surat keterangan lahir atau kematian dari puskesmas atau desa, Kartu Keluarga asli, KTP orang tua atau pelapor, buku nikah orang tua, dan KTP dua orang saksi. " +
      "Alur prosesnya: Ambil nomor antrean, verifikasi berkas di loket, dan akta resmi langsung diterbitkan beserta pembaharuan Kartu Keluarga secara otomatis. " +
      "Layanan ini seratus persen gratis tanpa dipungut biaya retribusi, dengan estimasi waktu sekitar lima belas menit selesai.";

    return {
      matched: true,
      serviceTitle: "Penerbitan Akta Kelahiran & Akta Kematian",
      instansi: "Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil) Kab. Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS 100% (Bebas Biaya)",
      sla: "10 s.d. 15 Menit",
      lokasiLoket: "Loket 02 (Pencatatan Sipil) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Kependudukan & Catatan Sipil"
    };
  }

  // 16. IDENTITAS KEPENDUDUKAN DIGITAL (IKD) & KARTU IDENTITAS ANAK (KIA)
  if (
    clean.includes('ikd') || 
    clean.includes('digital') || 
    clean.includes('ktp digital') || 
    clean.includes('kia') || 
    clean.includes('kartu anak')
  ) {
    const persyaratan = [
      "Untuk IKD (KTP Digital): Membawa smartphone Android/iOS dengan internet aktif, KTP-el fisik, nomor HP aktif, dan email pribadi.",
      "Untuk KIA (Kartu Identitas Anak): Fotokopi Akta Kelahiran, Fotokopi Kartu Keluarga, dan pasfoto anak 2x3 (2 lembar untuk anak usia di atas 5 tahun)."
    ];

    const alurProses = [
      "1. Unduh aplikasi Identitas Kependudukan Digital (IKD) resmi Kemendagri di PlayStore / AppStore.",
      "2. Mengisi NIK, email, dan nomor ponsel pada aplikasi.",
      "3. Melakukan scan QR Code aktivasi yang dipandu langsung oleh petugas Helpdesk Disdukcapil di MPP.",
      "4. KTP digital langsung aktif dan dapat digunakan di semua instansi pemerintah."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk aktivasi Identitas Kependudukan Digital atau IKD dan pembuatan Kartu Identitas Anak di MPP Luwu: " +
      "Persyaratannya sangat mudah: Cukup membawa smartphone Anda, nomor HP dan email aktif, serta KTP fisik. " +
      "Alur prosesnya: Unduh aplikasi IKD Kemendagri, isi NIK dan email, lalu scan barcode aktivasi bersama petugas Helpdesk Dukcapil di lobi MPP. KTP digital Anda langsung aktif seketika. " +
      "Layanan aktivasi IKD ini gratis seratus persen dan hanya membutuhkan waktu sekitar lima menit.";

    return {
      matched: true,
      serviceTitle: "Aktivasi IKD (KTP Digital) & Penerbitan KIA",
      instansi: "Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil) Kab. Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS 100%",
      sla: "5 s.d. 10 Menit",
      lokasiLoket: "Helpdesk IKD & Loket 03 Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Kependudukan & Catatan Sipil"
    };
  }

  // 17. NPWP PRIBADI & BADAN (KPP PRATAMA / POS PELAYANAN PAJAK)
  if (
    clean.includes('npwp') || 
    clean.includes('pajak pusat') || 
    clean.includes('kpp') || 
    clean.includes('pajak penghasilan') || 
    clean.includes('ebilling')
  ) {
    const persyaratan = [
      "NPWP Orang Pribadi: KTP-el pemohon dan Kartu Keluarga (KK), nomor ponsel dan email aktif.",
      "NPWP Badan Usaha: Akta Notaris & SK Kemenkumham, KTP & NPWP Direktur/Penanggung Jawab, NIB dari OSS.",
      "NPWP Cabang: Surat penunjukan kepala cabang dan NPWP kantor pusat."
    ];

    const alurProses = [
      "1. Ambil nomor antrean Gerai Pajak di Kiosk Lobi Utama MPP.",
      "2. Pendaftaran akun CoreTax DJP / ereg pajak didampingi staf Helpdesk Pajak.",
      "3. Validasi NIK menjadi NPWP 16 digit secara realtime.",
      "4. Penerbitan Surat Keterangan Terdaftar (SKT) dan kartu NPWP digital/fisik."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Untuk pembuatan NPWP pribadi atau badan usaha di Gerai Pajak KPP Pratama MPP Simpurusiang: " +
      "Persyaratannya adalah membawa KTP elektronik, Kartu Keluarga, nomor HP, dan email aktif. " +
      "Alur prosesnya: Petugas gerai pajak kami akan mendampingi validasi NIK Anda menjadi NPWP enam belas digit melalui sistem CoreTax, dan kartu NPWP beserta Surat Keterangan Terdaftar langsung terbit di tempat. " +
      "Layanan ini gratis seratus persen dan selesai dalam waktu sekitar sepuluh menit.";

    return {
      matched: true,
      serviceTitle: "Pendaftaran NPWP & Konsultasi Perpajakan (KPP)",
      instansi: "KPP Pratama Palopo (Pos Pelayanan Pajak MPP Simpurusiang Luwu)",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS 100% (Bebas Biaya)",
      sla: "5 s.d. 10 Menit",
      lokasiLoket: "Loket 20 (Pos Pelayanan Pajak KPP) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Perpajakan Nasional"
    };
  }

  // 18. JAM BUKA, OPERASIONAL & JADWAL PELAYANAN MPP
  if (
    clean.includes('jam buka') || 
    clean.includes('jam operasional') || 
    clean.includes('jadwal') || 
    clean.includes('hari kerja') || 
    clean.includes('buka hari apa') || 
    clean.includes('tutup')
  ) {
    const persyaratan = [
      "Tidak ada syarat khusus. Warga dapat datang langsung pada hari kerja dengan membawa kartu identitas."
    ];

    const alurProses = [
      "1. Hari Pelayanan: Senin sampai dengan Jumat.",
      "2. Jam Operasional: Pukul 07.30 WITA sampai 16.00 WITA (Istirahat Sholat 12.00 - 13.00 WITA, loket tetap melayani secara bergantian).",
      "3. Hari Sabtu, Minggu, dan Hari Libur Nasional: Pelayanan tatap muka tutup, layanan portal online tetap aktif 24 jam."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Jam operasional pelayanan Mal Pelayanan Publik Simpurusiang Luwu adalah: " +
      "Buka setiap hari Senin hingga Jumat, mulai pukul tujuh tiga puluh pagi sampai dengan pukul enam belas nol nol Waktu Indonesia Tengah. " +
      "Untuk hari Sabtu, Minggu, dan hari libur nasional, loket fisik tutup namun Anda tetap dapat mengajukan perizinan secara daring melalui portal ini dua puluh empat jam. " +
      "Kami siap melayani Anda dengan ramah, nyaman, dan bebas calo.";

    return {
      matched: true,
      serviceTitle: "Jadwal & Jam Operasional Pelayanan MPP Simpurusiang",
      instansi: "Sekretariat Pengelola Mal Pelayanan Publik (MPP) Kab. Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS",
      sla: "Senin - Jumat: 07.30 - 16.00 WITA",
      lokasiLoket: "Gedung MPP Simpurusiang, Jl. Jend. Sudirman No. 1, Belopa",
      targetSectionId: "instansi",
      category: "Informasi Operasional"
    };
  }

  // 19. ANTREAN ONLINE & KIOSK LAYAR SENTUH
  if (
    clean.includes('antrean') || 
    clean.includes('antri') || 
    clean.includes('nomor antrean') || 
    clean.includes('kiosk') || 
    clean.includes('ambil nomor')
  ) {
    const persyaratan = [
      "Membawa KTP-el / Nomor Induk Kependudukan (NIK).",
      "Mengetahui instansi atau loket layanan yang dituju."
    ];

    const alurProses = [
      "1. Setibanya di Lobi Utama Lantai 1 MPP, dekati Mesin Kiosk Antrean Layar Sentuh.",
      "2. Sentuh layar dan pilih instansi atau scan barcode KTP jika diminta.",
      "3. Mesin Kiosk akan mencetak struk nomor antrean secara otomatis.",
      "4. Duduk santai di ruang tunggu ber-AC sembari memantau layar display panggilan dan pengeras suara otomatis."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Sistem antrean di MPP Simpurusiang menggunakan Kiosk Digital Cerdas di lobi utama. " +
      "Caranya sangat mudah: Setibanya di gedung MPP, pilih instansi yang dituju pada layar sentuh mesin antrean. Struk nomor antrean akan otomatis tercetak dan panggilan loket disiarkan melalui layar LED serta audio cerdas. " +
      "Bagi lansia dan penyandang disabilitas tersedia Jalur Antrean Prioritas Khusus di meja Front Office tanpa perlu mengantre umum.";

    return {
      matched: true,
      serviceTitle: "Sistem Antrean Digital & Prioritas Khusus",
      instansi: "Pusat Pengendali Sistem Antrean Terintegrasi MPP Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS",
      sla: "Pencetakan Tiket Seketika (<10 Detik)",
      lokasiLoket: "Mesin Kiosk Lobi Utama Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Sistem & Teknologi"
    };
  }

  // 20. INVESTASI & INSENTIF MODAL LUWU (DPMPTSP)
  if (
    clean.includes('investasi') || 
    clean.includes('insentif') || 
    clean.includes('lkpm') || 
    clean.includes('peluang investasi') || 
    clean.includes('pma') || 
    clean.includes('pmdn') ||
    clean.includes('roi') ||
    clean.includes('concierge') ||
    clean.includes('vip') ||
    clean.includes('simulasi')
  ) {
    const persyaratan = [
      "Profil Perusahaan / Investor (PMA/PMDN).",
      "Dokumen NIB dan rencana nilai investasi modal usaha (CAPEX/OPEX).",
      "Proposal lokasi dan kebutuhan luasan lahan (Kecamatan Bua, Belopa, Latimojong, Walenrang, dll).",
      "Rencana penyerapan tenaga kerja lokal Kabupaten Luwu."
    ];

    const alurProses = [
      "1. Konsultasi di Loket Investasi VIP Concierge & Promosi DPMPTSP Lantai 1 MPP Simpurusiang.",
      "2. Pengecekan Peta Potensi Investasi Spasial GIS Luwu (Smelter, Kakao, Kopi, Perikanan, Logistik Pelabuhan Tadokkong).",
      "3. Simulasi insentif penanaman modal daerah (keringanan pajak daerah hingga 35%) dan perhitungan proyeksi ROI.",
      "4. Fasilitasi jalur hijau perizinan terintegrasi (NIB, PKKPR, PBG) hingga pendampingan pelaporan LKPM."
    ];

    const speechText = 
      "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
      "Pemerintah Luwu melalui DPMPTSP menyediakan layanan karpet merah Investor VIP Concierge dan kemudahan insentif bagi para investor dalam dan luar negeri. " +
      "Tersedia fasilitas keringanan pajak dan retribusi daerah hingga tiga puluh lima persen, simulasi perhitungan Return on Investment (ROI) terperinci, serta pendampingan jalur hijau perizinan tata ruang dan NIB OSS. " +
      "Petugas Promosi Investasi di Loket 06 MPP siap mendampingi Anda dari konsultasi awal hingga usaha beroperasi.";

    return {
      matched: true,
      serviceTitle: "Investor VIP Concierge, Fasilitasi Insentif & Simulasi ROI Daerah",
      instansi: "Bidang Penanaman Modal & Promosi DPMPTSP Kab. Luwu",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS 100% (Pendampingan Investasi Terpadu VIP Concierge)",
      sla: "Konsultasi Langsung & Helpdesk LKPM",
      lokasiLoket: "Loket 06 (Klinik Investasi & VIP Concierge) Lantai 1 MPP",
      targetSectionId: "layanan",
      category: "Investasi & Penanaman Modal"
    };
  }

  // 15. DEFAULT SMART KNOWLEDGE FALLBACK
  const genericSpeechText = 
    "Selamat Datang di Mal Pelayanan Publik Simpurusiang Luwu, Terima kasih atas pertanyaan Bapak/Ibu. " +
    `Mengenai pertanyaan Anda seputar "${query}", ` +
    "Mal Pelayanan Publik Simpurusiang Luwu menyediakan 19 instansi resmi pemerintah dan BUMN dengan lebih dari 120 layanan terpadu. " +
    "Anda dapat mengunjungi loket terkait di Lantai 1 Gedung MPP Simpurusiang Belopa pada hari Senin hingga Jumat mulai pukul 07.30 sampai pukul 16.00 WITA. " +
    "Petugas Helpdesk kami di lobi utama siap membantu pengecekan berkas dan pendampingan layanan secara langsung.";

  return {
    matched: false,
    serviceTitle: `Informasi Layanan: ${query}`,
    instansi: "Mal Pelayanan Publik (MPP) Simpurusiang Luwu",
    speechText: genericSpeechText,
    query,
    persyaratan: [
      "Membawa KTP-el / Kartu Identitas Resmi yang masih berlaku.",
      "Membawa dokumen dasar pendukung permohonan sesuai instansi yang dituju.",
      "Mengambil nomor antrean resmi di Mesin Kiosk Layar Sentuh Lobi Utama MPP."
    ],
    alurProses: [
      "1. Datang ke Gedung MPP Simpurusiang di Kompleks Perkantoran Pemkab Luwu, Jl. Jenderal Sudirman No. 1, Belopa.",
      "2. Mengambil nomor antrean sesuai loket instansi di Kiosk Lobi Utama.",
      "3. Menunggu panggilan nomor antrean di ruang tunggu ber-AC yang nyaman.",
      "4. Pemrosesan dokumen dan penyelesaian layanan di loket instansi terkait."
    ],
    biaya: "Sebagian besar layanan perizinan dan kependudukan GRATIS 100% (kecuali PNBP dan Pajak Resmi).",
    sla: "Hari Kerja: Senin - Jumat (07.30 - 16.00 WITA)",
    lokasiLoket: "Gedung MPP Simpurusiang, Belopa, Kab. Luwu",
    targetSectionId: "layanan",
    category: "Layanan Publik Terpadu"
  };
}
