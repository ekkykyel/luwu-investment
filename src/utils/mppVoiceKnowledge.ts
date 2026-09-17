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
  result.speechText = appendVoiceClosing(result.speechText, lang);
  return result;
}

function internalResolveMppVoiceQuery(query: string, lang: 'id' | 'en' | 'zh' = 'id'): VoiceAssistantResponse {
  const clean = query.toLowerCase().trim();

  // --- ENGLISH VOICE KNOWLEDGE ENGINE ---
  if (lang === 'en') {
    // 1. PBG (Building Approval) / Building Permit
    if (clean.includes('pbg') || clean.includes('building') || clean.includes('permit') || clean.includes('construction') || clean.includes('architecture') || clean.includes('imb')) {
      return {
        matched: true,
        serviceTitle: "Building Approval (PBG) & SLF Permit",
        instansi: "Public Works & Spatial Planning (DPUPR) & DPMPTSP Luwu",
        speechText: "Welcome to MPP Simpurusiang Luwu. To apply for a Building Approval or PBG, here are the complete requirements: First, Applicant's ID or Passport, Tax ID (NPWP), or Business Registration (NIB) for companies. Second, Valid proof of land ownership (SHM or HGB land certificate). Third, Technical architectural design drawings, structural calculations, and mechanical-electrical-plumbing (MEP) schematics. Fourth, Spatial Planning Conformity confirmation (PKKPR) and environmental document (SPPL). The procedure involves online registration via the national SIMBG portal or assisted at Counter 04 DPUPR at MPP Simpurusiang, followed by technical assessment, regional retribution calculation at Bank Sulselbar, and electronic signing by DPMPTSP Luwu. Estimated processing time is 3 to 14 working days.",
        query,
        persyaratan: [
          "Applicant's valid ID Card / Passport and Tax Identification Number (NPWP), or NIB for enterprises.",
          "Valid Land Title / Ownership Certificate (SHM / HGB) or notarized land utilization agreement.",
          "Architectural design drawings (site plan, floor plans, elevations, cross-sections, specifications).",
          "Structural engineering calculations and foundation/reinforced concrete drawings.",
          "Mechanical, Electrical, and Plumbing (MEP) plans (sanitation, electrical layout, lightning rod, fire safety).",
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

    // 2. Business Licensing (NIB OSS-RBA)
    if (clean.includes('nib') || clean.includes('business') || clean.includes('company') || clean.includes('investment') || clean.includes('oss') || clean.includes('investor')) {
      return {
        matched: true,
        serviceTitle: "Single Business Number (NIB OSS-RBA) & Investor Services",
        instansi: "DPMPTSP (Investment & One-Stop Integrated Services) Luwu",
        speechText: "Welcome to Luwu Investment Corner at MPP Simpurusiang. To register your business and obtain a Single Business Number (NIB) through OSS-RBA: Requirements include applicant's ID or Passport, NPWP, and Company Deed of Establishment for legal entities. Low and medium-low risk businesses obtain instant electronic issuance on the same day free of charge at Counter 01 & 02.",
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

    // 3. Passport & Immigration
    if (clean.includes('passport') || clean.includes('imigrasi') || clean.includes('immigration') || clean.includes('visa')) {
      return {
        matched: true,
        serviceTitle: "Electronic & Standard Passport Issuance",
        instansi: "Directorate General of Immigration Counter at MPP Luwu",
        speechText: "Welcome to Immigration Services at MPP Simpurusiang. Passport requirements include original ID Card, Family Card, Birth Certificate or Marriage Certificate, and queue booking via the M-Paspor application. Biometric photos and interview are conducted at Immigration Counter 14.",
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

    // English generic fallback
    return {
      matched: false,
      serviceTitle: `Service Inquiry: ${query}`,
      instansi: "Mal Pelayanan Publik (MPP) Simpurusiang Luwu Regency",
      speechText: `Welcome to MPP Simpurusiang Luwu. Regarding your question on "${query}", our integrated service center hosts 19 government and public agencies with over 120 services. Our customer service desk at the Ground Floor Lobby is ready to guide you Monday through Friday from 08:00 to 15:30 local time.`,
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
      sla: "Monday to Friday: 08:00 - 15:30 WITA",
      lokasiLoket: "MPP Simpurusiang Building, Belopa, Luwu Regency",
      targetSectionId: "layanan",
      category: "Integrated Public Services"
    };
  }

  // --- MANDARIN CHINESE (中文) VOICE KNOWLEDGE ENGINE ---
  if (lang === 'zh' || /[\u4e00-\u9fa5]/.test(clean)) {
    // 1. PBG (建筑审批许可)
    if (clean.includes('建筑') || clean.includes('许可') || clean.includes('pbg') || clean.includes('施工') || clean.includes('工程') || clean.includes('房屋') || clean.includes('图纸') || clean.includes('安全')) {
      return {
        matched: true,
        serviceTitle: "建筑工程施工批准书 (PBG) 与竣工合格证 (SLF)",
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

    // 2. 企业执照 NIB (外商投资与企业注册)
    if (clean.includes('企业') || clean.includes('执照') || clean.includes('商业') || clean.includes('投资') || clean.includes('nib') || clean.includes('外资') || clean.includes('公司') || clean.includes('商事')) {
      return {
        matched: true,
        serviceTitle: "企业统一商业编号 (NIB OSS-RBA) 与外商投资绿色通道",
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

    // 3. 护照与移民签证
    if (clean.includes('护照') || clean.includes('签证') || clean.includes('移民') || clean.includes('居留') || clean.includes('出入境')) {
      return {
        matched: true,
        serviceTitle: "出入境移民与护照签证服务",
        instansi: "鲁武县公共服务大楼·印度尼西亚移民局专柜",
        speechText: "您好，MPP Simpurusiang 设有移民局常设专柜。办理出入境护照或签证咨询，请携带有效身份证件、家庭卡或在印合法居留文件。大楼一楼 14 号窗口提供生物特征采集、指纹录入及面谈服务。",
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
        biaya: "按印尼国家移民局非税规费标准收取",
        sla: "采集生物信息后 3 至 4 个工作日",
        lokasiLoket: "MPP 一楼 14 号窗口（移民出入境服务台）",
        targetSectionId: "layanan",
        category: "出入境与外事"
      };
    }

    // Chinese generic fallback
    return {
      matched: false,
      serviceTitle: `政务服务咨询: ${query}`,
      instansi: "印度尼西亚鲁武县公共服务大楼 (MPP Simpurusiang)",
      speechText: `您好，感谢您咨询关于 "${query}" 的事项。鲁武县公共服务大楼入驻了 19 个官方政府部门与国有企事业单位，提供 120 余项综合政务服务。我们一楼大厅综合咨询台的工作人员在周一至周五 08:00 至 15:30 随时为您提供竭诚服务。`,
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
      sla: "周一至周五: 08:00 - 15:30 (印尼中部时间 WITA)",
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
      "5. Penerbitan Izin PBG: DPMPTSP Kabupaten Luwu menerbitkan dokumen resmi PBG dengan Tanda Tangan Elektronik (BSrE)."
    ];

    const speechText = 
      "Tabe', untuk mengurus izin Persetujuan Bangunan Gedung atau PBG di MPP Simpurusiang Luwu, berikut persyaratan lengkapnya: " +
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
    clean.includes('perekaman')
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
      "Tabe', untuk pengurusan KTP elektronik di Loket Disdukcapil MPP Simpurusiang Luwu: " +
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
      "Tabe', untuk perpanjangan SIM A atau SIM C di Gerai Satlantas Polres Luwu di MPP Simpurusiang: " +
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
      "Tabe', untuk pembuatan atau perpanjangan SKCK di Gerai Polres Luwu MPP Simpurusiang: " +
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
      "1. Tiba di Loket Helpdesk OSS DPMPTSP Kabupaten Luwu Lantai 1 MPP.",
      "2. Pembuatan hak akses akun OSS (oss.go.id) didampingi petugas.",
      "3. Pengisian formulir data pelaku usaha, pemilihan KBLI 5 digit, dan validasi tata ruang PKKPR otomatis.",
      "4. Validasi komitmen lingkungan (SPPL) secara sistemik.",
      "5. Penerbitan instan dokumen Nomor Induk Berusaha (NIB) bersertifikat elektronik BSrE."
    ];

    const speechText = 
      "Tabe', untuk pengurusan NIB atau Nomor Induk Berusaha melalui sistem OSS di DPMPTSP MPP Luwu: " +
      "Persyaratannya sangat mudah, yaitu KTP elektronik, NPWP, nomor WhatsApp dan email aktif, serta rincian jenis usaha dan modal usaha Anda. " +
      "Alur prosesnya: Petugas Helpdesk kami di MPP akan mendampingi pembuatan akun OSS, pengisian data usaha KBLI, validasi tata ruang, hingga NIB dan izin edar resmi langsung terbit di tempat. " +
      "Layanan penerbitan NIB ini adalah gratis seratus persen bebas biaya retribusi, dengan waktu pengerjaan hanya sekitar sepuluh sampai lima belas menit.";

    return {
      matched: true,
      serviceTitle: "Penerbitan Nomor Induk Berusaha (NIB) OSS-RBA",
      instansi: "DPMPTSP Kabupaten Luwu (Penyelenggara Perizinan Berusaha)",
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
      "Tabe', untuk pengurusan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang atau PKKPR di MPP Luwu: " +
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
      "Tabe', untuk layanan pertanahan dan sertifikat di Gerai BPN ATR MPP Simpurusiang: " +
      "Persyaratannya adalah KTP dan KK pemohon, sertifikat tanah asli, akta jual beli atau waris dari PPAT, serta bukti lunas PBB dan validasi BPHTB dari Bapenda. " +
      "Alur prosesnya: Ambil antrean, verifikasi berkas di loket BPN MPP, pembayaran biaya PNBP resmi di Bank Sulselbar, dan proses pencatatan di buku tanah hingga sertifikat diserahkan. " +
      "Biaya dihitung resmi sesuai tarif PNBP Kementerian ATR BPN.";

    return {
      matched: true,
      serviceTitle: "Layanan Pertanahan & Sertifikasi Tanah",
      instansi: "Kantor Pertanahan (ATR/BPN) Kabupaten Luwu",
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
      "Tabe', untuk pengurusan paspor di Unit Layanan Imigrasi MPP Simpurusiang Luwu: " +
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
      "Tabe', untuk pengurusan BPJS Kesehatan dan BPJS Ketenagakerjaan di MPP Simpurusiang Luwu: " +
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
      "Tabe', untuk pembayaran pajak kendaraan bermotor tahunan di Gerai SAMSAT MPP Simpurusiang: " +
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
    clean.includes('pajak bumi')
  ) {
    const persyaratan = [
      "Surat Pemberitahuan Pajak Terhutang (SPPT) PBB tahun berjalan atau tahun sebelumnya.",
      "KTP-el Wajib Pajak / Pemilik Objek Pajak.",
      "Untuk BPHTB: Fotokopi Sertifikat Tanah, Bukti Transaksi Jual Beli / Hibah / Waris dari Notaris PPAT, dan Bukti SSPD BPHTB."
    ];

    const alurProses = [
      "1. Ambil tiket antrean Loket Bapenda di Kiosk Lobi Utama MPP.",
      "2. Pengecekan data Nilai Jual Objek Pajak (NJOP) dan tagihan PBB.",
      "3. Validasi SSPD BPHTB oleh petugas Bapenda.",
      "4. Pembayaran langsung di loket Bank Sulselbar atau melalui QRIS Bapenda.",
      "5. Penerbitan Bukti Lunas Pembayaran Pajak Daerah resmi."
    ];

    const speechText = 
      "Tabe', untuk pembayaran PBB-P2 dan validasi BPHTB di Loket Bapenda MPP Simpurusiang: " +
      "Persyaratannya adalah membawa lembar SPPT PBB dan KTP wajib pajak, serta bukti akta jual beli notaris untuk validasi BPHTB. " +
      "Alur prosesnya: Ambil antrean, pengecekan data NJOP di loket Bapenda, pembayaran di loket Bank Sulselbar, dan bukti lunas resmi langsung diterbitkan. " +
      "Estimasi waktu pelayanan lima sampai sepuluh menit.";

    return {
      matched: true,
      serviceTitle: "Pajak Daerah PBB-P2 & Validasi BPHTB",
      instansi: "Badan Pendapatan Daerah (Bapenda) Kabupaten Luwu",
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
      "Tabe', untuk pendaftaran nikah dan layanan Balai Nikah Terpadu di MPP Simpurusiang Luwu: " +
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
      "Fotokopi KTP-el pemohon berdomisili di Kabupaten Luwu.",
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
      "Tabe', untuk penerbitan Surat Rekomendasi BBM Bersubsidi bagi nelayan dan pembudidaya tambak di MPP Luwu: " +
      "Persyaratannya adalah membawa fotokopi KTP Luwu, bukti kepemilikan perahu atau surat tambak, surat pengantar dari kepala desa, serta data mesin kapal atau pompa tambak. " +
      "Alur prosesnya: Ambil antrean, verifikasi data di loket Dinas Perikanan MPP, dan Surat Rekomendasi BBM langsung dicetak tanpa biaya retribusi. " +
      "Waktu pelayanan sekitar sepuluh sampai lima belas menit selesai.";

    return {
      matched: true,
      serviceTitle: "Rekomendasi BBM Bersubsidi Nelayan & Tambak",
      instansi: "Dinas Perikanan Kabupaten Luwu (Lantai 1 MPP)",
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

  // 14. BANTUAN DISABILITAS, KURSI RODA, JURU BAHASA ISYARAT
  if (
    clean.includes('bantuan') || 
    clean.includes('kursi roda') || 
    clean.includes('disabilitas') || 
    clean.includes('tuli') || 
    clean.includes('netra') || 
    clean.includes('lansia') || 
    clean.includes('pendamping')
  ) {
    const persyaratan = [
      "Tidak ada syarat dokumen khusus untuk pemanfaatan sarana kursi roda dan pendampingan di lokasi.",
      "Bagi permohonan pendampingan terjadwal: Cukup menginput nama, nomor WhatsApp, dan jam kedatangan di portal atau menghubungi Front Office MPP."
    ];

    const alurProses = [
      "1. Setibanya di gerbang utama MPP, pemohon dapat langsung menuju Pos Pengamanan atau Front Office untuk peminjaman kursi roda gratis.",
      "2. Petugas Front Office ramah disabilitas akan mendampingi langsung dari lobi, membantu pengambilan antrean jalur prioritas khusus.",
      "3. Mengarahkan ke loket layanan berketinggian rendah (<80 cm) dengan fasilitas pendukung bahasa isyarat BISINDO."
    ];

    const speechText = 
      "Tabe', MPP Simpurusiang Kabupaten Luwu menyediakan fasilitas inklusif lengkap ramah disabilitas dan lansia. " +
      "Tersedia kursi roda gratis di pintu masuk utama, jalur pemandu ubin taktil kuning untuk tunanetra, loket prioritas tanpa antre panjang, toilet difabel dengan handrail pengaman, serta pendampingan petugas Front Office dan Juru Bahasa Isyarat. " +
      "Semua fasilitas ini disediakan gratis untuk melayani seluruh warga Luwu dengan setara.";

    return {
      matched: true,
      serviceTitle: "Pusat Layanan Asistensi & Inklusif Disabilitas",
      instansi: "Sekretariat Pengelola MPP Simpurusiang & Front Office",
      speechText,
      query,
      persyaratan,
      alurProses,
      biaya: "GRATIS 100%",
      sla: "Layanan Langsung Seketika di Lobi Utama",
      lokasiLoket: "Lobi Utama, Jalur Pemandu Taktil & Pos Pengamanan MPP",
      targetSectionId: "fasilitas",
      category: "Aksesibilitas & Inklusif"
    };
  }

  // 15. DEFAULT SMART KNOWLEDGE FALLBACK
  const genericSpeechText = 
    `Tabe', terima kasih atas pertanyaan Anda mengenai "${query}". ` +
    "Mal Pelayanan Publik Simpurusiang Kabupaten Luwu menyediakan 19 instansi resmi pemerintah dan BUMN dengan lebih dari 120 layanan terpadu. " +
    "Anda dapat mengunjungi loket terkait di Lantai 1 Gedung MPP Simpurusiang Belopa pada hari Senin hingga Jumat mulai pukul 07.30 sampai pukul 16.00 WITA. " +
    "Petugas Helpdesk kami di lobi utama siap membantu pengecekan berkas dan pendampingan layanan secara langsung.";

  return {
    matched: false,
    serviceTitle: `Informasi Layanan: ${query}`,
    instansi: "Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu",
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
