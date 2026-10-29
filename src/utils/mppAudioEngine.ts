/**
 * Crystal Clear High-Fidelity Anti-Stutter Audio Engine
 * Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu
 * 
 * Features:
 * 1. High-Fidelity Voice Selection: Prioritizes Microsoft Neural, Google Natural, and Apple native voices.
 * 2. Phonetic & Dialect Normalization: Optimizes intonation, acronyms, currencies, and numbers for ID, EN, and ZH.
 * 3. Human-like Breath Cadence: Language-aware semantic clause chunking (Latin vs CJK).
 * 4. Anti-Garbage Collection (GC) Protection & Active Keep-Alive Watchdog.
 */

declare global {
  interface Window {
    __activeSpeechUtterances?: SpeechSynthesisUtterance[];
    __speechKeepAliveInterval?: any;
    __speechSessionId?: number;
    __speechWatchdogTimer?: any;
  }
}

if (typeof window !== 'undefined') {
  if (!window.__activeSpeechUtterances) {
    window.__activeSpeechUtterances = [];
  }
  if (typeof window.__speechSessionId !== 'number') {
    window.__speechSessionId = 0;
  }
}

/**
 * Phonetically transforms raw technical text into crystal clear, human-like speech string.
 * Optimizes intonation, expands acronyms, converts currency & numbers into natural words,
 * eliminates stutter-inducing punctuation, and normalizes Tana Luwu dialect and government terms.
 */
export function formatTextForCrystalClearTts(text: string, lang: 'id' | 'en' | 'zh' = 'id'): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Strip Markdown headings and append period so heading separates cleanly from body
  cleaned = cleaned.replace(/^\s*#{1,6}\s*(.+)$/gm, '$1. ');

  // 2. Strip Markdown bold, italics, strikethrough, backticks
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/[\*\_~`#]+/g, '');

  // 3. Strip Markdown images and links: ![alt](url) -> '', [text](url) -> text
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 4. Strip bullet markers and numbered list prefixes
  cleaned = cleaned.replace(/^\s*[\-\•\*\+]\s+/gm, ''); // Bullet markers
  cleaned = cleaned.replace(/^\s*\d+[\.\)]\s+/gm, ''); // Numbered markers e.g. 1. or 1)

  // 5. Remove raw URLs, HTML tags, horizontal rules, and table delimiters
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, '');
  cleaned = cleaned.replace(/\|/g, ' ');

  // 6. Decode common HTML entities
  cleaned = cleaned.replace(/&amp;/g, lang === 'en' ? ' and ' : lang === 'zh' ? '及' : ' dan ');
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  cleaned = cleaned.replace(/&lt;/g, ' ');
  cleaned = cleaned.replace(/&gt;/g, ' ');

  // 7. Strip unicode emojis to eliminate phonetic reading stutter
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');

  // 8. Convert parenthesized acronyms cleanly in a language-aware manner
  if (lang === 'en') {
    cleaned = cleaned.replace(/\s*\(([A-Za-z0-9\-\s]{2,15})\)\s*/g, ' or $1 ');
  } else if (lang === 'zh') {
    // In Chinese, strip parenthesized acronyms cleanly as Chinese translation precedes it
    cleaned = cleaned.replace(/\s*[\(（][A-Za-z0-9\-\s]{2,15}[\)）]\s*/g, ' ');
  } else {
    cleaned = cleaned.replace(/\s*\(([A-Za-z0-9\-\s]{2,15})\)\s*/g, ' atau $1 ');
  }
  cleaned = cleaned.replace(/[\(\)\[\]\{\}]/g, ' ');

  // ==========================================
  // --- 1. BAHASA INDONESIA & TANA LUWU DIALECT ---
  // ==========================================
  if (lang === 'id') {
    // A. Local Greetings & Glottal Stop Softening dengan pembatas kata ketat \b (mencegah merusak kata umum)
    cleaned = cleaned.replace(/salama['’`]\s*ki['’`]\s*(ta['’`]\s*)?pada\s*salama['’`]?/gi, 'Salama Ki tapada salama');
    cleaned = cleaned.replace(/\bsalama['’`]?\b/gi, 'Salama');
    cleaned = cleaned.replace(/\btabe['’`]?\b/gi, 'Tabe, ');
    cleaned = cleaned.replace(/\bki['’`]\b/gi, 'Ki');
    cleaned = cleaned.replace(/\bta['’`]\b/gi, 'ta');
    // Simpurusiang dilafalkan utuh sebagai satu kata tanpa jeda / spasi di tengah
    cleaned = cleaned.replace(/\bSIMPURUSIANG\b/g, 'Simpurusiang');
    cleaned = cleaned.replace(/\bSimpuru\s*,\s*siang\b/gi, 'Simpurusiang');
    cleaned = cleaned.replace(/\bSimpuru\s+siang\b/gi, 'Simpurusiang');

    // B. Currency & Numbers to spoken words for natural cadence
    cleaned = cleaned.replace(/\bRp\.?\s*0\b/gi, 'gratis tanpa biaya retribusi');
    cleaned = cleaned.replace(/\bRp\.?\s*350\.?000\b/gi, 'tiga ratus lima puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*650\.?000\b/gi, 'enam ratus lima puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*80\.?000\b/gi, 'delapan puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*75\.?000\b/gi, 'tujuh puluh lima ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*50\.?000\b/gi, 'lima puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*30\.?000\b/gi, 'tiga puluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*25\.?000\b/gi, 'dua puluh lima ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*100\.?000\b/gi, 'seratus ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*10\.?000\b/gi, 'sepuluh ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*1\.?000\.?000\b/gi, 'satu juta rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*(\d{1,3})\.000\.000\b/gi, '$1 juta rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*(\d{1,3})\.000\b/gi, '$1 ribu rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*(\d+)\b/gi, '$1 rupiah');

    // C. Operating Hours & Time Expressions (Jadwal Resmi: Senin-Kamis 07:30-16:00, Jumat 07:30-16:30 WITA)
    cleaned = cleaned.replace(/07[\:\.]30\s*(s\.?d\.?|-|sampai|hingga)\s*16[\:\.]00\s*(WITA)?\s*,?\s*(dan\s*)?(hari\s*)?Jumat\s*07[\:\.]30\s*(s\.?d\.?|-|sampai|hingga)\s*16[\:\.]30\s*(WITA)?/gi, 'Senin sampai Kamis pukul tujuh tiga puluh sampai enam belas nol nol, dan hari Jumat pukul tujuh tiga puluh sampai enam belas tiga puluh Waktu Indonesia Tengah');
    cleaned = cleaned.replace(/07[\:\.]30\s*(s\.?d\.?|-|sampai|hingga)\s*16[\:\.]00\s*(WITA)?/gi, 'pukul tujuh tiga puluh sampai enam belas nol nol Waktu Indonesia Tengah');
    cleaned = cleaned.replace(/07[\:\.]30\s*(s\.?d\.?|-|sampai|hingga)\s*16[\:\.]30\s*(WITA)?/gi, 'pukul tujuh tiga puluh sampai enam belas tiga puluh Waktu Indonesia Tengah');
    cleaned = cleaned.replace(/08[\:\.]00\s*(s\.?d\.?|-|sampai|hingga)\s*15[\:\.]30\s*(WITA)?/gi, 'Senin sampai Kamis pukul tujuh tiga puluh sampai enam belas nol nol, dan hari Jumat pukul tujuh tiga puluh sampai enam belas tiga puluh Waktu Indonesia Tengah');
    cleaned = cleaned.replace(/\bWITA\b/g, 'Waktu Indonesia Tengah');

    // D. Common Public Service Abbreviations & Honorifics
    cleaned = cleaned.replace(/\bBapak\/Ibu\b/gi, 'Bapak atau Ibu');
    cleaned = cleaned.replace(/\bBpk\/Ibu\b/gi, 'Bapak atau Ibu');
    cleaned = cleaned.replace(/\bBpk\.?\b/gi, 'Bapak');
    cleaned = cleaned.replace(/\bs\.d\.\b/gi, 'sampai dengan');
    cleaned = cleaned.replace(/\bdll\.\b/gi, 'dan lain-lain');
    cleaned = cleaned.replace(/\bdsb\.\b/gi, 'dan sebagainya');
    cleaned = cleaned.replace(/\bNo\.?\s*(\d+)/gi, 'Nomor $1');
    cleaned = cleaned.replace(/\bLt\.?\s*(\d+)/gi, 'Lantai $1');
    
    // Smooth Geographical & Government terms
    cleaned = cleaned.replace(/\bKabupaten\s+Luwu\b/gi, 'Luwu');
    cleaned = cleaned.replace(/\bKab\.?\s*Luwu\b/gi, 'Luwu');
    cleaned = cleaned.replace(/\bPemkab\s+Luwu\b/gi, 'Pemerintah Luwu');
    cleaned = cleaned.replace(/\bKabupaten\b/gi, '');
    cleaned = cleaned.replace(/\bKab\.?\s*/gi, '');
    cleaned = cleaned.replace(/\bKec\.?\s*/gi, 'Kecamatan ');
    cleaned = cleaned.replace(/\bGed\.?\s*/gi, 'Gedung ');
    cleaned = cleaned.replace(/\bJln\.?\s*/gi, 'Jalan ');
    cleaned = cleaned.replace(/\bJl\.?\s*/gi, 'Jalan ');

    // E. Official Acronyms Phonetically Spaced for Crystal-Clear Indonesian Intonation
    // 1. Kombinasi instansi majemuk dengan jeda koma eksplisit (sesuai instruksi: 'DPMPTSP, MPP LUWU')
    cleaned = cleaned.replace(/\bDPMPTSP\s*[\/\-]\s*MPP\s+Luwu\b/gi, 'DPMPTSP, MPP Luwu');
    cleaned = cleaned.replace(/\bDPMPTSP\s+MPP\s+Luwu\b/gi, 'DPMPTSP, MPP Luwu');
    cleaned = cleaned.replace(/\bDPMPTSP\s*[\/\-]\s*MPP\b/gi, 'DPMPTSP, MPP');
    cleaned = cleaned.replace(/\bDPMPTSP\s+MPP\b/gi, 'DPMPTSP, MPP');
    cleaned = cleaned.replace(/\bDPMPTSP\s+Kabupaten\s+Luwu\b/gi, 'DPMPTSP, Luwu');
    cleaned = cleaned.replace(/\bDPMPTSP\s+Kab\.?\s*Luwu\b/gi, 'DPMPTSP, Luwu');
    cleaned = cleaned.replace(/\bDPMPTSP\s+Luwu\b/gi, 'DPMPTSP, Luwu');
    cleaned = cleaned.replace(/\bDPMPTSP\b/gi, 'DPMPTSP,');
    cleaned = cleaned.replace(/\bD\.?P\.?M\.?P\.?T\.?S\.?P\.?\b/gi, 'DPMPTSP,');

    // 1b. Normalisasi istilah layanan agar dilafalkan sempurna (misal: 'helpdesk' dibaca 'help desk' tanpa sisipan 'e' menjadi 'helpedesk')
    cleaned = cleaned.replace(/\bhelpdesk\b/gi, 'Help desk');
    cleaned = cleaned.replace(/\bHELPDESK\b/g, 'Help desk');
    cleaned = cleaned.replace(/\bcall\s*center\b/gi, 'Kol senter');
    cleaned = cleaned.replace(/\bfront\s*office\b/gi, 'Front ofis');
    cleaned = cleaned.replace(/\bback\s*office\b/gi, 'Bek ofis');
    cleaned = cleaned.replace(/\bwebsite\b/gi, 'websait');
    cleaned = cleaned.replace(/\bonline\b/gi, 'onlain');
    cleaned = cleaned.replace(/\boffline\b/gi, 'oflain');
    cleaned = cleaned.replace(/\bQR\s*Code\b/gi, 'Kiu Ar Kod');
    cleaned = cleaned.replace(/\bBarcode\b/gi, 'Barkod');
    cleaned = cleaned.replace(/\btouchscreen\b/gi, 'layar sentuh');
    cleaned = cleaned.replace(/\bcustomer\s*service\b/gi, 'Kastamer servis');
    cleaned = cleaned.replace(/\bstandby\b/gi, 'stenbai');
    cleaned = cleaned.replace(/\bhotline\b/gi, 'hotlain');
    cleaned = cleaned.replace(/\bVIP\b/g, 'V I P');
    cleaned = cleaned.replace(/\bPTSP\b/gi, 'P T S P');
    cleaned = cleaned.replace(/\bDPUPR\b/gi, 'D P U P R');
    cleaned = cleaned.replace(/\bIMTA\b/gi, 'I M T A');
    cleaned = cleaned.replace(/\bPMA\b/gi, 'P M A');
    cleaned = cleaned.replace(/\bPMDN\b/gi, 'P M D N');
    cleaned = cleaned.replace(/\bRTRW\b/gi, 'R T R W');
    cleaned = cleaned.replace(/\bRDTR\b/gi, 'R D T R');
    cleaned = cleaned.replace(/\bKKPR\b/gi, 'K K P R');
    cleaned = cleaned.replace(/\bPKKPR\b/gi, 'P K K P R');
    cleaned = cleaned.replace(/\bAMDAL\b/gi, 'Amdal');
    cleaned = cleaned.replace(/\bANDALALIN\b/gi, 'Amdallalin');
    cleaned = cleaned.replace(/\bUKL-UPL\b/gi, 'U K L U P L');
    cleaned = cleaned.replace(/\bSPPL\b/gi, 'S P P L');
    cleaned = cleaned.replace(/\bSLF\b/gi, 'S L F');
    cleaned = cleaned.replace(/\bSKCK\b/gi, 'S K C K');
    cleaned = cleaned.replace(/\bNPWP\b/gi, 'N P W P');
    cleaned = cleaned.replace(/\bATR\/BPN\b/gi, 'A T R B P N');
    cleaned = cleaned.replace(/\bATR\s*\/\s*BPN\b/gi, 'A T R B P N');
    cleaned = cleaned.replace(/\bBPN\b/gi, 'B P N');
    cleaned = cleaned.replace(/\bBUMN\b/gi, 'B U M N');
    cleaned = cleaned.replace(/\bPNBP\b/gi, 'P N B P');
    cleaned = cleaned.replace(/\bPBG\b/gi, 'P B G');
    cleaned = cleaned.replace(/\bNIB\b/gi, 'N I B');
    cleaned = cleaned.replace(/\bOSS-RBA\b/gi, 'OSS R B A');
    cleaned = cleaned.replace(/\bOSS\b/gi, 'OSS');
    cleaned = cleaned.replace(/\bSIMBG\b/gi, 'S I M B G');
    cleaned = cleaned.replace(/\bBPOM\b/gi, 'B P O M');
    cleaned = cleaned.replace(/\bBPJS Kesehatan\b/gi, 'B P J S Kesehatan');
    cleaned = cleaned.replace(/\bBPJS Ketenagakerjaan\b/gi, 'B P J S Ketenagakerjaan');
    cleaned = cleaned.replace(/\bBPJS\b/gi, 'B P J S');
    cleaned = cleaned.replace(/\bKTP-el\b/gi, 'K T P elektronik');
    cleaned = cleaned.replace(/\bKTP\b/gi, 'K T P');

    // 2. SIM (Surat Izin Mengemudi) diucapkan normal sebagai kata utuh "Sim", BUKAN dieja "S I M"
    cleaned = cleaned.replace(/\bSIM\s*A\b/gi, 'Sim A');
    cleaned = cleaned.replace(/\bSIM\s*B\s*1\b/gi, 'Sim B satu');
    cleaned = cleaned.replace(/\bSIM\s*B\s*I\b/gi, 'Sim B satu');
    cleaned = cleaned.replace(/\bSIM\s*B\s*2\b/gi, 'Sim B dua');
    cleaned = cleaned.replace(/\bSIM\s*B\s*II\b/gi, 'Sim B dua');
    cleaned = cleaned.replace(/\bSIM\s*B\b/gi, 'Sim B');
    cleaned = cleaned.replace(/\bSIM\s*C\s*1\b/gi, 'Sim C satu');
    cleaned = cleaned.replace(/\bSIM\s*C\s*I\b/gi, 'Sim C satu');
    cleaned = cleaned.replace(/\bSIM\s*C\s*2\b/gi, 'Sim C dua');
    cleaned = cleaned.replace(/\bSIM\s*C\s*II\b/gi, 'Sim C dua');
    cleaned = cleaned.replace(/\bSIM\s*C\b/gi, 'Sim C');
    cleaned = cleaned.replace(/\bSIM\s*D\b/gi, 'Sim D');
    cleaned = cleaned.replace(/\bSIM\s*Internasional\b/gi, 'Sim Internasional');
    cleaned = cleaned.replace(/\bSIM\b/g, 'Sim');

    cleaned = cleaned.replace(/\bPBB-P2\b/gi, 'P B B P dua');
    cleaned = cleaned.replace(/\bPBB\b/gi, 'P B B');
    cleaned = cleaned.replace(/\bBPHTB\b/gi, 'B P H T B');
    cleaned = cleaned.replace(/\bKK\b/gi, 'Kartu Keluarga');
    cleaned = cleaned.replace(/\bKIA\b/gi, 'Kartu Identitas Anak');
    cleaned = cleaned.replace(/\bIKD\b/gi, 'Identitas Kependudukan Digital');
    cleaned = cleaned.replace(/\bADM\b/gi, 'Anjungan Dukcapil Mandiri');
    cleaned = cleaned.replace(/\bSLA\b/gi, 'standar waktu pelayanan');
    cleaned = cleaned.replace(/\bSAMSAT\b/gi, 'Samsat');
    cleaned = cleaned.replace(/\bDISDUKCAPIL\b/gi, 'Disdukcapil');
    cleaned = cleaned.replace(/\bKPP\b/gi, 'KPP Pratama');
    cleaned = cleaned.replace(/\bBSrE\b/gi, 'Badan Siber dan Sandi Negara');
    cleaned = cleaned.replace(/\bBSSN\b/gi, 'Badan Siber dan Sandi Negara');
    cleaned = cleaned.replace(/\bKemenag\b/gi, 'Kementerian Agama');
    cleaned = cleaned.replace(/\bKUA\b/gi, 'K U A');
    cleaned = cleaned.replace(/\bLapas\b/gi, 'Lembaga Pemasyarakatan');
    cleaned = cleaned.replace(/\bKejari\b/gi, 'Kejaksaan Negeri');
    cleaned = cleaned.replace(/\bPengadilan Negeri\b/gi, 'Pengadilan Negeri');
    cleaned = cleaned.replace(/\bPengadilan Agama\b/gi, 'Pengadilan Agama');
    cleaned = cleaned.replace(/\bDinsos\b/gi, 'Dinas Sosial');
    cleaned = cleaned.replace(/\bDinkes\b/gi, 'Dinas Kesehatan');
    cleaned = cleaned.replace(/\bDisnaker\b/gi, 'Dinas Tenaga Kerja');
    cleaned = cleaned.replace(/\bDisdag\b/gi, 'Dinas Perdagangan');
    cleaned = cleaned.replace(/\bDiskan\b/gi, 'Dinas Perikanan');
    cleaned = cleaned.replace(/\bDispora\b/gi, 'Dinas Pemuda dan Olahraga');
    cleaned = cleaned.replace(/\bBSI\b/gi, 'Bank Syariah Indonesia');
    cleaned = cleaned.replace(/\bPT Pos\b/gi, 'P T Pos Indonesia');
    cleaned = cleaned.replace(/\bBank Sulselbar\b/gi, 'Bank Sulselbar');
    cleaned = cleaned.replace(/\bPLN\b/gi, 'P L N');
    cleaned = cleaned.replace(/\bPDAM\b/gi, 'P D A M');
    cleaned = cleaned.replace(/\bBPJPH\b/gi, 'B P J P H');
    cleaned = cleaned.replace(/\bWNA\b/gi, 'Warga Negara Asing');
    cleaned = cleaned.replace(/\bWNI\b/gi, 'Warga Negara Indonesia');
    cleaned = cleaned.replace(/\bM-Paspor\b/gi, 'M Paspor');
    cleaned = cleaned.replace(/\bPasporku\b/gi, 'M Paspor');
    cleaned = cleaned.replace(/\bPT\b/gi, 'P T');
    cleaned = cleaned.replace(/\bCV\b/gi, 'C V');

    // 3. Nama Gedung Mal Pelayanan Publik & MPP Simpurusiang dengan jeda santun dan Simpurusiang tetap utuh
    cleaned = cleaned.replace(/\bMal\s+Pelayanan\s+Publik\s+Simpurusiang\b/gi, 'Mal Pelayanan Publik, Simpurusiang');
    cleaned = cleaned.replace(/\bMal\s+Pelayanan\s+Publik\b/gi, 'Mal Pelayanan Publik,');
    cleaned = cleaned.replace(/\bMPP\s+Simpurusiang\b/gi, 'M P P, Simpurusiang');
    cleaned = cleaned.replace(/\bMPP\s+Luwu\b/gi, 'M P P, Luwu');
    cleaned = cleaned.replace(/\bMPP\b/gi, 'M P P');
  }

  // ==========================================
  // --- 2. ENGLISH (INTERNATIONAL ENUNCIATION) ---
  // ==========================================
  else if (lang === 'en') {
    // A. Currency and numbers with full thousands integrity
    cleaned = cleaned.replace(/\bRp\.?\s*350[\.\,]?000\b/gi, '350 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*650[\.\,]?000\b/gi, '650 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*80[\.\,]?000\b/gi, '80 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*75[\.\,]?000\b/gi, '75 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*50[\.\,]?000\b/gi, '50 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*30[\.\,]?000\b/gi, '30 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*25[\.\,]?000\b/gi, '25 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*10[\.\,]?000\b/gi, '10 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*100[\.\,]?000\b/gi, '100 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*0\b/gi, 'free of charge');
    cleaned = cleaned.replace(/\bRp\.?\s*(\d{1,3})\.000\.000\b/gi, '$1 million Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*(\d{1,3})\.000\b/gi, '$1 thousand Indonesian Rupiah');
    cleaned = cleaned.replace(/\bRp\.?\s*(\d+)/gi, '$1 Indonesian Rupiah');

    // B. Operating Hours & Dates
    cleaned = cleaned.replace(/07:30\s*(to|-)\s*16:00\s*(WITA)?\s*,?\s*Friday\s*07:30\s*(to|-)\s*16:30/gi, 'Monday to Thursday 7:30 AM to 4:00 PM, and Friday 7:30 AM to 4:30 PM Central Indonesia Time');
    cleaned = cleaned.replace(/08:00\s*(to|-)\s*15:30\s*(WITA)?/gi, 'Monday to Thursday 7:30 AM to 4:00 PM, and Friday 7:30 AM to 4:30 PM Central Indonesia Time');
    cleaned = cleaned.replace(/\bWITA\b/g, 'Central Indonesia Time');

    // C. Clarify Indonesian Government Terms for International Investors (Clean natural enunciation without double-acronym fatigue)
    cleaned = cleaned.replace(/\bKabupaten Luwu\b/gi, 'Luwu Regency');
    cleaned = cleaned.replace(/\bMPP Simpurusiang\b/gi, 'Simpurusiang Public Service Mall');
    cleaned = cleaned.replace(/\bMPP\b/g, 'Public Service Mall');
    cleaned = cleaned.replace(/\bDPMPTSP\b/gi, 'Investment and One-Stop Integrated Services Agency');
    cleaned = cleaned.replace(/\bDPUPR\b/gi, 'Public Works and Spatial Planning Agency');
    cleaned = cleaned.replace(/\bDisdukcapil\b/gi, 'Civil Registry and Population Office');
    cleaned = cleaned.replace(/\bBapenda\b/gi, 'Regional Revenue Agency');
    cleaned = cleaned.replace(/\bPBG\b/g, 'Building Approval Permit');
    cleaned = cleaned.replace(/\bSLF\b/g, 'Certificate of Building Fitness');
    cleaned = cleaned.replace(/\bNIB\b/g, 'Business Identification Number');
    cleaned = cleaned.replace(/\bPKKPR\b/gi, 'Spatial Conformity Approval');
    cleaned = cleaned.replace(/\bSPPL\b/gi, 'Environmental Management Statement');
    cleaned = cleaned.replace(/\bOSS-RBA\b/gi, 'Risk-Based Online Single Submission system');
    cleaned = cleaned.replace(/\bOSS\b/g, 'Online Single Submission system');
    cleaned = cleaned.replace(/\bSIMBG\b/gi, 'National Building Management System');
    cleaned = cleaned.replace(/\bNPWP\b/g, 'Tax Identification Number');
    cleaned = cleaned.replace(/\bKTP-el\b/gi, 'Electronic National ID Card');
    cleaned = cleaned.replace(/\bKTP\b/g, 'National ID Card');
    cleaned = cleaned.replace(/\bKK\b/g, 'Family Card');
    cleaned = cleaned.replace(/\bKIA\b/g, 'Child Identity Card');
    cleaned = cleaned.replace(/\bIKD\b/g, 'Digital Citizen ID');
    cleaned = cleaned.replace(/\bSKCK\b/g, 'Police Clearance Certificate');
    cleaned = cleaned.replace(/\bSAMSAT\b/gi, 'SAMSAT Vehicle Registration Office');
    cleaned = cleaned.replace(/\bSTNK\b/g, 'Vehicle Registration Document');
    cleaned = cleaned.replace(/\bSIM A\b/gi, 'Driver License Category A');
    cleaned = cleaned.replace(/\bSIM C\b/gi, 'Motorcycle Driver License Category C');
    cleaned = cleaned.replace(/\bSIM\b/gi, 'Driver License');
    cleaned = cleaned.replace(/\bBPJS Kesehatan\b/gi, 'BPJS National Health Insurance');
    cleaned = cleaned.replace(/\bBPJS Ketenagakerjaan\b/gi, 'BPJS Workers Social Security');
    cleaned = cleaned.replace(/\bBPJS\b/g, 'BPJS Social Security');
    cleaned = cleaned.replace(/\bPBB-P2\b/gi, 'Land and Building Tax');
    cleaned = cleaned.replace(/\bPBB\b/g, 'Land and Building Tax');
    cleaned = cleaned.replace(/\bBPHTB\b/g, 'Land Transfer Duty');
    cleaned = cleaned.replace(/\bBSrE\b/g, 'National Cyber and Crypto Agency');
    cleaned = cleaned.replace(/\bBSSN\b/g, 'National Cyber and Crypto Agency');
    cleaned = cleaned.replace(/\bBPOM\b/g, 'National Agency of Drug and Food Control');
    cleaned = cleaned.replace(/\bRTRW\b/gi, 'Regional Spatial Plan');
    cleaned = cleaned.replace(/\bRDTR\b/gi, 'Detailed Spatial Plan');
    cleaned = cleaned.replace(/\bPMA\b/gi, 'Foreign Direct Investment');
    cleaned = cleaned.replace(/\bPMDN\b/gi, 'Domestic Direct Investment');
    cleaned = cleaned.replace(/\bIMTA\b/gi, 'Foreign Worker Utilization Permit');
    cleaned = cleaned.replace(/\bAMDAL\b/gi, 'Environmental Impact Assessment');
    cleaned = cleaned.replace(/\bUKL-UPL\b/gi, 'Environmental Management and Monitoring Plan');
    cleaned = cleaned.replace(/\bWNA\b/gi, 'Foreign Citizen');
    cleaned = cleaned.replace(/\bWNI\b/gi, 'Indonesian Citizen');
    cleaned = cleaned.replace(/\bKemenag\b/gi, 'Ministry of Religious Affairs');
    cleaned = cleaned.replace(/\bSLA\b/g, 'Service Level Agreement duration');
    cleaned = cleaned.replace(/\bNo\.\s*(\d+)/gi, 'Number $1');
  }

  // ==========================================
  // --- 3. MANDARIN CHINESE (标准普通话与政务术语) ---
  // ==========================================
  else if (lang === 'zh') {
    // A. 币种与费用转换为地道中文发音 (精确匹配各级法定规费与通用千位金额)
    cleaned = cleaned.replace(/Rp\.?\s*350[\.\,]?000/gi, '三十五万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*650[\.\,]?000/gi, '六十五万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*80[\.\,]?000/gi, '八万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*75[\.\,]?000/gi, '七万五千印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*50[\.\,]?000/gi, '五万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*30[\.\,]?000/gi, '三万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*25[\.\,]?000/gi, '两万五千印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*10[\.\,]?000/gi, '一万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*100[\.\,]?000/gi, '十万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*1[\.\,]?000[\.\,]?000/gi, '一百万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*0/gi, '全程免费');
    cleaned = cleaned.replace(/Rp\.?\s*(\d{1,3})\.000\.000/gi, '$1百万印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*(\d{1,3})\.000/gi, '$1千印尼盾');
    cleaned = cleaned.replace(/Rp\.?\s*/gi, '印尼盾 ');

    // B. 时间与作息时间地道转换
    cleaned = cleaned.replace(/07:30\s*(至|-|到)\s*16:00\s*(WITA)?\s*,?\s*周五\s*07:30\s*(至|-|到)\s*16:30/gi, '周一至周四上午七点半至下午四点整，周五上午七点半至下午四点半');
    cleaned = cleaned.replace(/08:00\s*(至|-|到)\s*15:30\s*(WITA)?/gi, '周一至周四上午七点半至下午四点整，周五上午七点半至下午四点半');
    cleaned = cleaned.replace(/\bWITA\b/g, '印尼中部时间');

    // C. 混合英文缩写与外来词汇全面优化为纯正规范普通话 (彻底清除TTS引擎对生僻字母缩写的卡顿停顿)
    cleaned = cleaned.replace(/\bDPMPTSP\b/gi, '投资与一站式综合审批局');
    cleaned = cleaned.replace(/D\s*P\s*M\s*P\s*T\s*S\s*P/gi, '投资与一站式综合审批局');
    cleaned = cleaned.replace(/\bDPUPR\b/gi, '公共工程与空间规划局');
    cleaned = cleaned.replace(/D\s*P\s*U\s*P\s*R/gi, '公共工程与空间规划局');
    cleaned = cleaned.replace(/\bDisdukcapil\b/gi, '民政与户籍登记局');
    cleaned = cleaned.replace(/\bBapenda\b/gi, '地方税务局');
    cleaned = cleaned.replace(/\bPolres\s+Luwu\b/gi, '鲁武县警察局');
    cleaned = cleaned.replace(/\bPolres\b/gi, '警察局');
    cleaned = cleaned.replace(/\bSatlantas\b/gi, '交警支队');
    cleaned = cleaned.replace(/\bSAMSAT\b/gi, '机动车联合税务中心');
    cleaned = cleaned.replace(/\bBank\s+Sulselbar\b/gi, '南苏西苏银行');
    cleaned = cleaned.replace(/\bBSrE\b/gi, '国家密码与网络局');
    cleaned = cleaned.replace(/\bBSSN\b/gi, '国家密码与网络局');
    cleaned = cleaned.replace(/\bBPOM\b/gi, '印尼国家食品药品监督管理局');
    cleaned = cleaned.replace(/\bRTRW\b/gi, '区域空间规划');
    cleaned = cleaned.replace(/\bRDTR\b/gi, '详细空间规划');
    cleaned = cleaned.replace(/\bPMA\b/gi, '外国直接投资');
    cleaned = cleaned.replace(/\bPMDN\b/gi, '国内直接投资');
    cleaned = cleaned.replace(/\bIMTA\b/gi, '外籍劳工使用许可');
    cleaned = cleaned.replace(/\bAMDAL\b/gi, '环境影响评估');
    cleaned = cleaned.replace(/\bUKL-UPL\b/gi, '环境管理与监测承诺书');
    cleaned = cleaned.replace(/\bWNA\b/gi, '外籍公民');
    cleaned = cleaned.replace(/\bWNI\b/gi, '印尼公民');
    cleaned = cleaned.replace(/\bKemenag\b/gi, '印尼宗教事务部');
    cleaned = cleaned.replace(/\bMPP\s+Simpurusiang\b/gi, '鲁武县 Simpurusiang 公共服务大楼');
    cleaned = cleaned.replace(/\bMPP\b/gi, '公共服务大楼');
    cleaned = cleaned.replace(/\bPBG\b/gi, '建筑施工许可');
    cleaned = cleaned.replace(/\bSLF\b/gi, '建筑物竣工合格证');
    cleaned = cleaned.replace(/\bNIB\b/gi, '统一企业商业编号');
    cleaned = cleaned.replace(/\bOSS-RBA\b/gi, '风险分级在线审批系统');
    cleaned = cleaned.replace(/\bOSS\b/gi, '在线企业注册审批系统');
    cleaned = cleaned.replace(/\bNPWP\b/gi, '企业与个人税号');
    cleaned = cleaned.replace(/\bKTP-el\b/gi, '印尼电子居民身份证');
    cleaned = cleaned.replace(/\bKTP\b/gi, '居民身份证');
    cleaned = cleaned.replace(/\bKK\b/gi, '家庭户口卡');
    cleaned = cleaned.replace(/\bKIA\b/gi, '少儿身份证');
    cleaned = cleaned.replace(/\bIKD\b/gi, '手机数字身份证');
    cleaned = cleaned.replace(/\bSIMBG\b/gi, '国家建筑在线审批系统');
    cleaned = cleaned.replace(/\bPKKPR\b/gi, '空间规划合规确认书');
    cleaned = cleaned.replace(/\bSPPL\b/gi, '环保合规承诺书');
    cleaned = cleaned.replace(/\bSLA\b/gi, '法定办理时限');
    cleaned = cleaned.replace(/\bSKCK\b/gi, '无犯罪记录证明');
    cleaned = cleaned.replace(/\bSTNK\b/gi, '机动车行驶证');
    cleaned = cleaned.replace(/\bSIM\s*A\b/gi, '汽车驾驶执照');
    cleaned = cleaned.replace(/\bSIM\s*C\b/gi, '摩托车驾驶执照');
    cleaned = cleaned.replace(/\bSIM\b/gi, '驾驶执照');
    cleaned = cleaned.replace(/\bBPJS\s+Kesehatan\b/gi, '国民健康医保');
    cleaned = cleaned.replace(/\bBPJS\s+Ketenagakerjaan\b/gi, '劳工社会保险');
    cleaned = cleaned.replace(/\bBPJS\b/gi, '国民社会保障');
    cleaned = cleaned.replace(/\bPBB-P2\b/gi, '城乡土地与建筑税');
    cleaned = cleaned.replace(/\bPBB\b/gi, '土地与建筑税');
    cleaned = cleaned.replace(/\bBPHTB\b/gi, '土地房屋产权转让税');
    cleaned = cleaned.replace(/\bPNBP\b/gi, '国家非税收入规费');
    cleaned = cleaned.replace(/\bPTSP\b/gi, '一站式综合行政服务');
    cleaned = cleaned.replace(/\bROI\b/gi, '投资回报率');
    cleaned = cleaned.replace(/\bCAPEX\b/gi, '固定资产投资');
    cleaned = cleaned.replace(/\bOPEX\b/gi, '运营成本');
    cleaned = cleaned.replace(/\bKITAS\b/gi, '临时居留许可');
    cleaned = cleaned.replace(/\bKITAP\b/gi, '永久居留许可');
    cleaned = cleaned.replace(/\bADM\b/gi, '自助制证一体机');
    cleaned = cleaned.replace(/\bKabupaten\s+Luwu\b/gi, '鲁武县');
    cleaned = cleaned.replace(/\bLuwu\s+Regency\b/gi, '鲁武县');
    cleaned = cleaned.replace(/\bLuwu\b/gi, '鲁武县');
    cleaned = cleaned.replace(/\bBelopa\b/gi, '别洛帕');
    cleaned = cleaned.replace(/\bQRIS\b/gi, '国家标准二维码扫码支付');
  }

  // 4. Slashes & Punctuation Cleanup (Pembersihan Tanda Baca Anti-Stutter)
  cleaned = cleaned.replace(/\s*\/\s*/g, lang === 'en' ? ' or ' : lang === 'zh' ? '或' : ' atau ');
  
  // Colons and semicolons separating clauses should become periods for crisp cadence
  cleaned = cleaned.replace(/[\:\;]/g, '. ');

  // Sanitize duplicate or colliding punctuations that cause dead silence in TTS engines
  cleaned = cleaned.replace(/[,，]{2,}/g, ', ');
  cleaned = cleaned.replace(/[.!?。！？]{2,}/g, '. ');
  cleaned = cleaned.replace(/([.!?。！？])\s*[,，]/g, '$1 ');
  cleaned = cleaned.replace(/^\s*[,，.\s]+/gm, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Stops all active speech synthesis playback and clears keep-alive timers.
 */
export function stopAllSpeech(): void {
  if (typeof window === 'undefined') return;

  // Invalidate any ongoing speech playback loop and async timer
  window.__speechSessionId = (window.__speechSessionId || 0) + 1;

  if (window.__speechKeepAliveInterval) {
    clearInterval(window.__speechKeepAliveInterval);
    window.__speechKeepAliveInterval = null;
  }

  if (window.__speechWatchdogTimer) {
    clearTimeout(window.__speechWatchdogTimer);
    window.__speechWatchdogTimer = null;
  }

  if (window.__activeSpeechUtterances) {
    window.__activeSpeechUtterances = [];
  }

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

/**
 * Unlocks browser audio context and speech synthesis on user interaction (tap/click).
 * Essential for mobile browsers (iOS Safari, Android Chrome) where audio is suspended until gesture.
 */
export function unlockAudioContext(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      if (!(window as any).__globalAudioCtx) {
        (window as any).__globalAudioCtx = new AudioCtx();
      }
      if ((window as any).__globalAudioCtx.state === 'suspended') {
        (window as any).__globalAudioCtx.resume().catch(() => {});
      }
    }
  } catch (e) {}

  if ('speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}
  }
}

export interface SpeakOptions {
  lang?: 'id' | 'en' | 'zh';
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onVoiceMissing?: (lang: 'id' | 'en' | 'zh') => void;
  availableVoices?: SpeechSynthesisVoice[];
}

/**
 * Language-aware semantic clause chunking (Latin vs CJK characters).
 * In Chinese (CJK), text is chunked into natural breath clauses (15 to 38 chars max)
 * so that the Web Speech API never hits browser 15s utterance freeze limits or watchdog cutoffs.
 * In Latin languages, text is split by natural punctuation up to 200 chars.
 */
function splitTextIntoSafeChunks(text: string, lang: 'id' | 'en' | 'zh' = 'id'): string[] {
  if (!text || !text.trim()) return [];

  const safeChunks: string[] = [];

  if (lang === 'zh') {
    // Mandarin CJK: split strictly into safe clauses (max 38 characters).
    // In Chinese, each character is a syllable taking ~300-400ms.
    // Keeping chunks under 38 chars ensures speech segments of 7-10 seconds,
    // which completely prevents Chrome/Edge/Safari utterance timeouts and garbage collection pauses.
    
    // 1. First split by major sentence boundaries
    const sentences = text.split(/(?<=[。！？!?\n])\s*/);
    
    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (!sentence) continue;
      
      if (sentence.length <= 38) {
        safeChunks.push(sentence);
      } else {
        // 2. Split by intra-sentence clause punctuation: comma, ideographic comma, semicolon, colon
        const clauses = sentence.split(/(?<=[，、；;：:])\s*/);
        let buffer = '';
        
        for (const rawClause of clauses) {
          const clause = rawClause.trim();
          if (!clause) continue;
          
          if ((buffer + clause).length <= 38) {
            buffer += clause;
          } else {
            if (buffer) {
              safeChunks.push(buffer);
              buffer = '';
            }
            
            // If an individual clause without punctuation is STILL > 38 characters:
            if (clause.length <= 38) {
              buffer = clause;
            } else {
              // Subdivide long run-on clause cleanly at conjunctions or character slices
              let remaining = clause;
              while (remaining.length > 38) {
                const sliceZone = remaining.slice(18, 36);
                const conjMatch = sliceZone.search(/[以及|并且|同时|或者|还有|通过|经由|然后]/);
                let splitAt = 32;
                if (conjMatch !== -1) {
                  splitAt = 18 + conjMatch;
                }
                safeChunks.push(remaining.slice(0, splitAt));
                remaining = remaining.slice(splitAt).trim();
              }
              if (remaining) {
                buffer = remaining;
              }
            }
          }
        }
        if (buffer) {
          safeChunks.push(buffer);
        }
      }
    }
  } else {
    // Latin languages (Indonesian & English)
    // Primary split strictly by Sentence Boundaries (Periods, Question marks, Exclamations, Newlines)
    const sentences = text.split(/(?<=[.?!。\n！？])\s+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if (trimmed.length <= 220) {
        safeChunks.push(trimmed);
      } else {
        // If an individual run-on sentence exceeds 220 characters, split cleanly at punctuation or words
        const subParts = trimmed.split(/(?<=[,;:\-])\s+/);
        let buffer = '';
        for (const part of subParts) {
          if ((buffer + ' ' + part).trim().length <= 200) {
            buffer = (buffer + ' ' + part).trim();
          } else {
            if (buffer) safeChunks.push(buffer);
            buffer = part;
          }
        }
        if (buffer) {
          if (buffer.length <= 220) {
            safeChunks.push(buffer);
          } else {
            const words = buffer.split(/\s+/);
            let wordAcc = '';
            for (const word of words) {
              if ((wordAcc + ' ' + word).trim().length <= 180) {
                wordAcc = (wordAcc + ' ' + word).trim();
              } else {
                if (wordAcc) safeChunks.push(wordAcc);
                wordAcc = word;
              }
            }
            if (wordAcc) safeChunks.push(wordAcc);
          }
        }
      }
    }
  }

  return safeChunks.filter(s => s.trim().length > 0);
}

/**
 * Selects the most natural, human-like voice available in the client system.
 * Prioritizes Microsoft Neural Online, Google Natural, and Apple native voices.
 */
function findOptimalVoice(voices: SpeechSynthesisVoice[], lang: 'id' | 'en' | 'zh'): SpeechSynthesisVoice | null {
  const currentVoices = (voices && voices.length > 0)
    ? voices
    : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
  if (!currentVoices || currentVoices.length === 0) return null;

  if (lang === 'en') {
    // 1. High-fidelity Neural / Natural en-US / en-GB voices
    const neural = currentVoices.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Online'))
    );
    if (neural) return neural;

    // 2. High-quality Google or Apple native English voices
    const natural = currentVoices.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Daniel') || v.name.includes('Karen'))
    );
    if (natural) return natural;

    // 3. Strict match: Any voice starting with 'en'
    return currentVoices.find(v => v.lang.toLowerCase().startsWith('en')) || null;
  }

  if (lang === 'zh') {
    // 1. High-fidelity Neural / Natural zh-CN / cmn voices (Mainland Putonghua priority)
    const neural = currentVoices.find(v => 
      (v.lang.toLowerCase().startsWith('zh') || v.lang.toLowerCase().includes('cmn')) && 
      (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Xiaoxiao') || v.name.includes('Yunxi'))
    );
    if (neural) return neural;

    // 2. High-quality Google or Apple Mandarin voices
    const natural = currentVoices.find(v => 
      (v.lang.toLowerCase().startsWith('zh') || v.lang.toLowerCase().includes('cmn')) && 
      (v.name.includes('Google') || v.name.includes('普通话') || v.name.includes('Ting-Ting') || v.name.includes('Mei-Jia') || v.name.includes('Sin-ji'))
    );
    if (natural) return natural;

    // 3. Any Mandarin Mainland / Taiwanese / Singapore voice
    const anyZh = currentVoices.find(v => 
      v.lang.toLowerCase().startsWith('zh-cn') || 
      v.lang.toLowerCase().startsWith('zh') || 
      v.lang.toLowerCase().includes('cmn')
    );
    if (anyZh) return anyZh;

    return null;
  }

  // Indonesian (default): support 'id', 'id-id', and Android legacy 'in', 'in-id'
  const isIndo = (v: SpeechSynthesisVoice) => {
    const l = v.lang.toLowerCase();
    return l.startsWith('id') || l.startsWith('in') || l.includes('ind');
  };

  const neural = currentVoices.find(v => 
    isIndo(v) && 
    (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Gadis') || v.name.includes('Ardi'))
  );
  if (neural) return neural;

  const natural = currentVoices.find(v => 
    isIndo(v) && 
    (v.name.includes('Google') || v.name.includes('Damayanti') || v.name.includes('Indonesian'))
  );
  if (natural) return natural;

  return currentVoices.find(isIndo) || null;
}

/**
 * Plays speech audio with crystal clear high-fidelity quality, calibrated prosody,
 * watchdog safety timers, and natural human breathing cadence.
 */
export function speakCrystalClearText(text: string, options: SpeakOptions = {}): number {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 0;

  const {
    lang = 'id',
    rate,
    pitch,
    volume = 1.0,
    onStart,
    onEnd,
    onError,
    availableVoices = []
  } = options;

  stopAllSpeech();

  if (!text || !text.trim()) return 0;

  window.__speechSessionId = (window.__speechSessionId || 0) + 1;
  const currentSessionId = window.__speechSessionId;

  // 1. Phonetically normalize and enrich text for chosen language
  const normalizedText = formatTextForCrystalClearTts(text, lang);
  if (!normalizedText.trim()) return 0;

  // 2. Intelligent Sentence & Clause Chunking (Zero-Lag sentences)
  const sentenceChunks = splitTextIntoSafeChunks(normalizedText, lang);
  if (sentenceChunks.length === 0) return 0;

  // 3. Select Highest Quality Available Voice with STRICT Accent Integrity Check
  const voiceList = availableVoices.length > 0 ? availableVoices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
  const targetVoice = findOptimalVoice(voiceList, lang);

  // ACCENT INTEGRITY SAFEGUARD:
  // If user requested Mandarin (zh) or English (en) but the browser lacks matching voice profiles:
  // Strictly prevent an Indonesian voice from pronouncing foreign text into garbled phonetic noise.
  if (lang === 'zh') {
    const hasChineseVoice = voiceList.some(v => v.lang.toLowerCase().startsWith('zh') || v.lang.toLowerCase().includes('cmn'));
    if (!hasChineseVoice && voiceList.length > 0) {
      console.warn('[AudioEngine] No Mandarin TTS voice profile installed in browser/OS. Silencing audio to prevent garbled accent collision.');
      if (options.onVoiceMissing) options.onVoiceMissing('zh');
      if (onEnd) onEnd();
      return 0;
    }
  } else if (lang === 'en') {
    const hasEnglishVoice = voiceList.some(v => v.lang.toLowerCase().startsWith('en'));
    if (!hasEnglishVoice && voiceList.length > 0) {
      console.warn('[AudioEngine] No English TTS voice profile installed in browser/OS. Silencing audio to prevent garbled accent collision.');
      if (options.onVoiceMissing) options.onVoiceMissing('en');
      if (onEnd) onEnd();
      return 0;
    }
  }

  if (onStart) onStart();

  // 4. Default Prosody Tuning per Language (Natural human pitch & speed calibration - calibrated for maximum intelligibility)
  const finalRate = rate !== undefined ? rate : (lang === 'zh' ? 0.88 : lang === 'en' ? 0.91 : 0.93);
  const finalPitch = pitch !== undefined ? pitch : (lang === 'id' ? 1.03 : lang === 'zh' ? 1.05 : 1.01);

  // 5. Chromium Keep-Alive Heartbeat (5000ms ringan + verifikasi status untuk mencegah micro-interruptions & audio bergelombang)
  window.__speechKeepAliveInterval = setInterval(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
        try {
          window.speechSynthesis.resume();
        } catch (e) {}
      }
    }
  }, 5000);

  let currentIdx = 0;

  const playNextChunk = () => {
    if (window.__speechSessionId !== currentSessionId) {
      stopAllSpeech();
      return;
    }

    if (currentIdx >= sentenceChunks.length) {
      stopAllSpeech();
      if (onEnd) onEnd();
      return;
    }

    const chunkText = sentenceChunks[currentIdx];
    const utterance = new SpeechSynthesisUtterance(chunkText);

    // Retain utterance in global array to prevent GC eviction
    if (!window.__activeSpeechUtterances) window.__activeSpeechUtterances = [];
    window.__activeSpeechUtterances.push(utterance);

    if (lang === 'en') {
      utterance.lang = 'en-US';
    } else if (lang === 'zh') {
      utterance.lang = 'zh-CN';
    } else {
      utterance.lang = 'id-ID';
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.rate = Math.min(Math.max(finalRate, 0.75), 1.15);
    utterance.pitch = finalPitch;
    utterance.volume = volume;

    let hasHandledChunk = false;

    const handleChunkCompleted = () => {
      if (hasHandledChunk) return;
      hasHandledChunk = true;

      if (window.__speechWatchdogTimer) {
        clearTimeout(window.__speechWatchdogTimer);
        window.__speechWatchdogTimer = null;
      }

      if (window.__activeSpeechUtterances) {
        window.__activeSpeechUtterances = window.__activeSpeechUtterances.filter(u => u !== utterance);
      }

      if (window.__speechSessionId !== currentSessionId) return;

      currentIdx++;
      // Jeda natural antar-chunk (120ms ID/EN, 180ms ZH) untuk memberi browser audio buffer flush bersih tanpa tumpang tindih
      const interChunkPause = lang === 'zh' ? 180 : 120;
      setTimeout(() => {
        if (window.__speechSessionId === currentSessionId) {
          playNextChunk();
        }
      }, interChunkPause);
    };

    utterance.onend = () => {
      handleChunkCompleted();
    };

    utterance.onerror = (e) => {
      if (window.__speechSessionId !== currentSessionId) return;
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      if (onError) onError(e);
      handleChunkCompleted();
    };

    // 6. Intelligent Utterance Watchdog (Calibrated margins preventing premature cutoffs on long punctuated clauses)
    let estimatedDurationMs: number;
    if (lang === 'zh') {
      estimatedDurationMs = Math.max(chunkText.length * 550, 6000) + 14000;
    } else {
      estimatedDurationMs = Math.max(chunkText.length * 200, 5000) + 10000;
    }

    if (window.__speechWatchdogTimer) clearTimeout(window.__speechWatchdogTimer);
    window.__speechWatchdogTimer = setTimeout(() => {
      if (!hasHandledChunk && window.__speechSessionId === currentSessionId) {
        handleChunkCompleted();
      }
    }, estimatedDurationMs);

    if (window.speechSynthesis.paused) {
      try { window.speechSynthesis.resume(); } catch (e) {}
    }

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('speechSynthesis.speak error:', err);
      handleChunkCompleted();
    }
  };

  // Cancel sebelum speak + 50ms startup delay untuk memastikan audio pipeline browser ter-reset sempurna
  setTimeout(() => {
    if (window.__speechSessionId === currentSessionId) {
      playNextChunk();
    }
  }, 50);

  return currentSessionId;
}

