import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, Award, Send, Sparkles, 
  FileCheck, DollarSign, Smile, Users, 
  Zap, MessageSquareHeart, ShieldCheck,
  AlertCircle, ThumbsUp, KeyRound, Smartphone, Lock, RefreshCw, Ticket
} from 'lucide-react';
import Swal from 'sweetalert2';
import { submitMppSurvey, MppSurveyItem } from '../../services/mppFeedbackService';
import { LOCALIZED_AGENCIES } from '../../data/mppAgenciesData';

interface MppCitizenSurveyMenuProps {
  isInModal?: boolean;
  userType?: 'masyarakat' | 'investor';
  defaultName?: string;
  defaultNik?: string;
  defaultPhone?: string;
  defaultCompany?: string;
  defaultAgency?: string;
  isDarkMode?: boolean;
  isLoggedIn?: boolean;
  onSubmitted?: (survey: MppSurveyItem) => void;
}

const MPP_AGENCIES_DEFAULT = [
  "DPMPTSP (Penanaman Modal & PTSP)",
  "Disdukcapil (Kependudukan & Catatan Sipil)",
  "BPN / ATR Kantor Pertanahan",
  "Dinas PUPTR (Tata Ruang & PBG)",
  "Bapenda (Pajak & Retribusi Daerah)",
  "SAMSAT Belopa (Pajak Kendaraan & STNK)",
  "BPJS Kesehatan",
  "BPJS Ketenagakerjaan",
  "Bank Sulselbar",
  "KPP Pratama Palopo (Pajak & NPWP)",
  "Kejaksaan Negeri Luwu",
  "PT. Taspen",
  "Dinas Sosial",
  "Disnakertrans",
  "Dinas Perikanan",
  "Dinas Kominfo",
  "PDAM Tirta Luwu",
  "DEKRANASDA Luwu (Pojok UMKM)",
  "HAS International Center",
  "Konsultasi Investasi & Tata Ruang"
];

const DEFAULT_POPULAR_SERVICES: Record<string, string[]> = {
  id: [
    "Penerbitan Nomor Induk Berusaha (NIB) Berbasis Risiko",
    "Persetujuan Bangunan Gedung (PBG) & Sertifikat Laik Fungsi (SLF)",
    "Perekaman & Pencetakan KTP Elektronik (KTP-el)",
    "Penerbitan Kartu Keluarga (KK) & Akta Kelahiran",
    "Aktivasi Identitas Kependudukan Digital (IKD)",
    "Pembayaran Pajak Kendaraan & Pengesahan STNK (SAMSAT)",
    "Pencetakan Kartu BPJS Kesehatan & Pendaftaran Peserta",
    "Konfirmasi Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)",
    "Konsultasi & Pendampingan Investasi Terpadu",
    "Pengaduan & Layanan Informasi Umum"
  ],
  en: [
    "Risk-Based Business Identification Number (NIB) Issuance",
    "Building Approval (PBG) & Functional Certificate (SLF)",
    "Electronic ID (KTP-el) Biometric Recording & Printing",
    "Family Card (KK) & Birth Certificate Issuance",
    "Digital Population Identity (IKD) Activation",
    "Vehicle Tax Payment & STNK Validation (SAMSAT)",
    "BPJS Health Card Printing & Member Registration",
    "Spatial Utilization Suitability Confirmation (PKKPR)",
    "Integrated Investment Advisory & Concierge",
    "Complaints & General Public Information Desk"
  ],
  zh: [
    "基于风险等级的企业统一登记编码 (NIB) 审批签发",
    "建筑工程审批许可 (PBG) 与建筑合规合格证书 (SLF)",
    "电子身份证 (KTP-el) 生物特征录入与制证",
    "户口簿 (KK) 与出生证明等民政证件申领",
    "数字居民身份 (IKD) 账号激活与绑定",
    "机动车税费缴纳与行车证 (STNK) 检验",
    "国民健康保险 (BPJS Kesehatan) 参保与卡片印制",
    "空间规划开发利用符合性确认书 (PKKPR)",
    "重点招商引资专属咨询与全流程陪办",
    "公众咨询、建议反馈与综合服务"
  ]
};

const getSkmQuestions = (lang: string) => {
  const isEn = lang.startsWith('en');
  const isZh = lang.startsWith('zh');

  return [
    {
      id: 'q1_persyaratan',
      num: 1,
      title: isZh ? '1. 申办服务材料' : isEn ? '1. Service Requirements' : '1. Persyaratan Pelayanan',
      question: isZh 
        ? '您如何评价申办事项所需服务材料与要求的合理性与清晰度？' 
        : isEn 
        ? 'How do you rate the clarity and appropriateness of service requirements for the requested service?' 
        : 'Bagaimana pendapat Anda terhadap kesesuaian persyaratan pelayanan dengan jenis pelayanannya?',
      icon: FileCheck,
      color: 'text-emerald-500'
    },
    {
      id: 'q2_prosedur',
      num: 2,
      title: isZh ? '2. 办事服务流程' : isEn ? '2. Service Procedures' : '2. Prosedur Pelayanan',
      question: isZh 
        ? '您如何评价 Simpurusiang 公共服务中心窗口办理流程的便捷性？' 
        : isEn 
        ? 'How do you rate the ease and efficiency of the service procedure workflow at MPP counters?' 
        : 'Bagaimana pendapat Anda terhadap kemudahan tahapan alur pelayanan yang diberikan di loket MPP?',
      icon: CheckCircle2,
      color: 'text-teal-500'
    },
    {
      id: 'q3_waktu',
      num: 3,
      title: isZh ? '3. 办结时间效率' : isEn ? '3. Service Speed & SLA' : '3. Kecepatan Waktu Pelayanan',
      question: isZh 
        ? '您如何评价窗口服务完成时限与承诺 SLA 标准的高效性与准确性？' 
        : isEn 
        ? 'How do you rate the promptness and speed of service delivery according to SLA standards?' 
        : 'Bagaimana pendapat Anda terhadap ketepatan dan kecepatan waktu pelayanan sesuai standar SLA?',
      icon: Zap,
      color: 'text-amber-500'
    },
    {
      id: 'q4_biaya',
      num: 4,
      title: isZh ? '4. 法定收费标准' : isEn ? '4. Service Fees & Transparency' : '4. Biaya / Tarif Pelayanan',
      question: isZh 
        ? '您如何评价实际收费与官方法定标准的符合度 (100%零乱收费)？' 
        : isEn 
        ? 'How do you rate the compliance of service fees with official published rates (Zero Illegal Fees)?' 
        : 'Bagaimana pendapat Anda terhadap kesesuaian biaya yang dibayarkan dengan tarif resmi (Bebas Pungli)?',
      icon: DollarSign,
      color: 'text-emerald-500'
    },
    {
      id: 'q5_produk',
      num: 5,
      title: isZh ? '5. 政务成果规范' : isEn ? '5. Service Product Quality' : '5. Produk Spesifikasi Pelayanan',
      question: isZh 
        ? '您如何评价最终所获政务成果 (许可证/证件/批文) 的准确性与规范度？' 
        : isEn 
        ? 'How do you rate the accuracy and quality of the final service outputs (permits/cards/certificates) received?' 
        : 'Bagaimana pendapat Anda terhadap kesesuaian hasil pelayanan (dokumen/izin/kartu) yang diterima?',
      icon: Award,
      color: 'text-blue-500'
    },
    {
      id: 'q6_kompetensi',
      num: 6,
      title: isZh ? '6. 窗口人员技能' : isEn ? '6. Staff Competence' : '6. Kompetensi Petugas Pelaksana',
      question: isZh 
        ? '您如何评价窗口服务人员的专业技能、讲解清晰度与业务熟练度？' 
        : isEn 
        ? 'How do you rate the expertise, clarity of explanation, and technical skill of the counter staff?' 
        : 'Bagaimana pendapat Anda terhadap keahlian, kejelasan penjelasan, dan ketangkasan petugas loket?',
      icon: Users,
      color: 'text-indigo-500'
    },
    {
      id: 'q7_perilaku',
      num: 7,
      title: isZh ? '7. 服务态度 (5S)' : isEn ? '7. Staff Conduct & Hospitality' : '7. Perilaku Petugas (5S)',
      question: isZh 
        ? '您如何评价窗口工作人员的服务态度、礼貌程度与沟通热情度？' 
        : isEn 
        ? 'How do you rate the courtesy, friendliness, and responsiveness of the service staff?' 
        : 'Bagaimana pendapat Anda terhadap kesopanan, keramahan, dan ketanggapan petugas menyambut warga?',
      icon: Smile,
      color: 'text-teal-500'
    },
    {
      id: 'q8_sarpras',
      num: 8,
      title: isZh ? '8. 设施与环境质量' : isEn ? '8. Facility & Amenities Quality' : '8. Kualitas Sarana & Prasarana',
      question: isZh 
        ? '您如何评价等候区的舒适度、空调环境、卫生状况及无障碍设施？' 
        : isEn 
        ? 'How do you rate the comfort, cleanliness, air conditioning, and accessibility facilities of the waiting area?' 
        : 'Bagaimana pendapat Anda terhadap kenyamanan ruang tunggu, AC, kebersihan, & fasilitas disabilitas?',
      icon: Sparkles,
      color: 'text-amber-500'
    },
    {
      id: 'q9_pengaduan',
      num: 9,
      title: isZh ? '9. 咨询与投诉响应' : isEn ? '9. Complaint Handling & Support' : '9. Penanganan Pengaduan',
      question: isZh 
        ? '您如何评价中心对公众咨询、建议及投诉反馈的处理效率与满意度？' 
        : isEn 
        ? 'How do you rate the responsiveness and resolution handling for consultations or complaints?' 
        : 'Bagaimana pendapat Anda terhadap ketanggapan penyelesaian saran, keluhan, dan konsultasi?',
      icon: MessageSquareHeart,
      color: 'text-rose-500'
    }
  ];
};

const getRatingOptions = (lang: string) => {
  const isEn = lang.startsWith('en');
  const isZh = lang.startsWith('zh');

  return [
    { value: 1, label: isZh ? '不符合 / 较差' : isEn ? 'Dissatisfied / Poor' : 'Tidak Sesuai / Buruk' },
    { value: 2, label: isZh ? '基本符合 / 一般' : isEn ? 'Fair / Average' : 'Kurang Sesuai / Cukup' },
    { value: 3, label: isZh ? '符合 / 良好' : isEn ? 'Satisfied / Good' : 'Sesuai / Baik' },
    { value: 4, label: isZh ? '非常符合 / 卓越' : isEn ? 'Highly Satisfied / Excellent' : 'Sangat Sesuai / Prima' }
  ];
};

// Helper to sanitize name (never show admin names for citizen / investor)
const sanitizeSurveyName = (raw?: string, userType: 'masyarakat' | 'investor' = 'masyarakat') => {
  if (!raw) return '';
  const isAdmin = /admin|dinas|puptr|pertanian|lp2b|dalak|promosi|oss|mpp|bidang|superadmin|operator|administrator/i.test(raw);
  if (isAdmin) {
    return userType === 'investor' ? 'Investor Luwu' : 'Masyarakat Luwu';
  }
  return raw;
};

export const MppCitizenSurveyMenu: React.FC<MppCitizenSurveyMenuProps> = ({
  userType = 'masyarakat',
  defaultName = '',
  defaultNik = '',
  defaultPhone = '',
  defaultCompany = '',
  defaultAgency = MPP_AGENCIES_DEFAULT[0],
  isDarkMode = false,
  isLoggedIn = false,
  onSubmitted
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const isSessionVerified = isLoggedIn || !!defaultNik;

  const initialCleanName = sanitizeSurveyName(defaultName, userType) || (userType === 'investor' ? (isZh ? '注册投资者' : isEn ? 'Registered Investor' : 'Investor Terdaftar') : (isZh ? '鲁乌县居民' : isEn ? 'Luwu Resident' : 'Masyarakat Luwu'));

  const [nama, setNama] = useState(initialCleanName);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [perusahaan, setPerusahaan] = useState(defaultCompany);
  const [instansi, setInstansi] = useState(defaultAgency);
  const [layanan, setLayanan] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state: NIK & OTP Verification for Ticket Holders
  const [nik, setNik] = useState(defaultNik || '');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifiedTicket, setIsVerifiedTicket] = useState(isSessionVerified);
  const [ticketInfo, setTicketInfo] = useState<{ ticketNo: string; serviceDate: string; counterName: string } | null>(null);

  // Sync props when user auth or citizen profile loads asynchronously
  useEffect(() => {
    if (defaultName) {
      const clean = sanitizeSurveyName(defaultName, userType);
      if (clean && !['masyarakat', 'investor', 'warga'].includes(clean.toLowerCase())) {
        setNama(clean);
      }
    }
  }, [defaultName, userType]);

  useEffect(() => {
    if (defaultNik) {
      setNik(defaultNik);
      setIsVerifiedTicket(true);
    }
  }, [defaultNik]);

  useEffect(() => {
    if (isLoggedIn) {
      setIsVerifiedTicket(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (defaultCompany) {
      setPerusahaan(defaultCompany);
    }
  }, [defaultCompany]);

  // Ratings for 9 questions (Default: 4 - Sangat Sesuai)
  const [ratings, setRatings] = useState<Record<string, number>>({
    q1_persyaratan: 4,
    q2_prosedur: 4,
    q3_waktu: 4,
    q4_biaya: 4,
    q5_produk: 4,
    q6_kompetensi: 4,
    q7_perilaku: 4,
    q8_sarpras: 4,
    q9_pengaduan: 4
  });

  const skmQuestions = useMemo(() => getSkmQuestions(currentLang), [currentLang]);
  const ratingOptions = useMemo(() => getRatingOptions(currentLang), [currentLang]);

  // Extract dynamic service list options based on selected agency
  const availableServices = useMemo(() => {
    if (!instansi) return DEFAULT_POPULAR_SERVICES[isZh ? 'zh' : isEn ? 'en' : 'id'];

    const searchKey = instansi.toLowerCase();
    const matchedAgency = LOCALIZED_AGENCIES.find(ag => {
      return ag.nama.toLowerCase().includes(searchKey) || 
             ag.fullName.toLowerCase().includes(searchKey) ||
             searchKey.includes(ag.nama.toLowerCase());
    });

    if (matchedAgency) {
      if (isZh && matchedAgency.layananList_zh && matchedAgency.layananList_zh.length > 0) {
        return matchedAgency.layananList_zh;
      }
      if (isEn && matchedAgency.layananList_en && matchedAgency.layananList_en.length > 0) {
        return matchedAgency.layananList_en;
      }
      if (matchedAgency.layananList && matchedAgency.layananList.length > 0) {
        return matchedAgency.layananList;
      }
    }

    return DEFAULT_POPULAR_SERVICES[isZh ? 'zh' : isEn ? 'en' : 'id'];
  }, [instansi, isEn, isZh]);

  const handleRatingChange = (questionId: string, val: number) => {
    setRatings(prev => ({ ...prev, [questionId]: val }));
  };

  // Calculate live average score (1-4 scaled to 100%)
  const sumScores = Object.values(ratings).reduce((a, b) => a + b, 0);
  const liveAveragePercent = Math.round((sumScores / 36) * 100);
  const predikat = liveAveragePercent >= 88 
    ? (isZh ? 'A (极佳 / 卓越)' : isEn ? 'A (Excellent / Outstanding)' : 'A (Sangat Baik / Prima)') 
    : liveAveragePercent >= 76 
    ? (isZh ? 'B (良好)' : isEn ? 'B (Good)' : 'B (Baik)') 
    : (isZh ? 'C (一般)' : isEn ? 'C (Fair)' : 'C (Kurang)');

  // Send OTP handler (only needed for unauthenticated guests)
  const handleSendOtp = () => {
    const cleanNik = nik.trim();
    if (cleanNik.length < 8) {
      Swal.fire({
        icon: 'warning',
        title: isZh ? 'NIK 或票号格式无效' : isEn ? 'Invalid NIK or Ticket Number' : 'NIK / Nomor Tiket Tidak Valid',
        text: isZh ? '请输入至少8位数字的 NIK 或有效的服务票号 (例如: T-084 或 731701...)' : isEn ? 'Please enter at least 8 digits NIK or valid ticket number (e.g., T-084 or 731701...)' : 'Silakan masukkan NIK minimal 8 digit atau Nomor Tiket Layanan yang valid (Contoh: T-084 / 731701...).',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setIsOtpSent(true);

    const ticketNo = `TK-MPP-${Math.floor(100 + Math.random() * 900)}`;
    setTicketInfo({
      ticketNo,
      serviceDate: new Date().toLocaleDateString(isZh ? 'zh-CN' : isEn ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      counterName: instansi.split(' ')[0] || 'DPMPTSP'
    });

    Swal.fire({
      icon: 'info',
      title: isZh ? '🔑 OTP 验证码已发送' : isEn ? '🔑 OTP Sent via SMS / WhatsApp' : '🔑 Kode OTP Terkirim!',
      html: `
        <div class="text-left text-xs space-y-2.5 mt-2 font-sans">
          <p class="text-slate-600 dark:text-slate-300">
            ${isZh ? '验证码已发送至与 NIK / 票号关联的手机号：' : isEn ? 'OTP verification code sent to mobile linked with NIK/Ticket:' : 'Kode OTP dikirimkan ke nomor WhatsApp/HP yang terhubung ke NIK / Tiket Layanan Anda:'} 
            <strong class="text-emerald-600 font-mono">0812-****-7890</strong>
          </p>
          <div class="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center">
            <span class="text-2xl font-black font-mono tracking-widest text-emerald-600 dark:text-emerald-400">${randomOtp}</span>
          </div>
          <p class="text-[11px] text-slate-400 text-center">
            ${isZh ? '（系统已自动在输入框中填充此 6 位验证码）' : isEn ? '(System auto-filled this 6-digit code for testing)' : '(Gunakan kode OTP 6 digit di atas untuk memverifikasi tiket layanan Anda)'}
          </p>
        </div>
      `,
      confirmButtonColor: '#10b981',
      confirmButtonText: isZh ? '确认输入验证码' : isEn ? 'Enter OTP Code' : 'Masukkan Kode OTP'
    });

    setOtp(randomOtp);
  };

  // Verify OTP handler
  const handleVerifyOtp = () => {
    if (!otp || otp.trim() !== generatedOtp) {
      Swal.fire({
        icon: 'error',
        title: isZh ? 'OTP 验证码错误' : isEn ? 'Invalid OTP Code' : 'Kode OTP Tidak Sesuai',
        text: isZh ? '请输入正确发送至您手机的 6 位数字 OTP 验证码。' : isEn ? 'Please enter the correct 6-digit OTP code sent to your mobile.' : 'Silakan masukkan 6 digit kode OTP yang benar yang dikirimkan ke perangkat Anda.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    setIsVerifiedTicket(true);
    Swal.fire({
      icon: 'success',
      title: isZh ? '✓ 票号验证成功！' : isEn ? '✓ Ticket Verified Successfully!' : '✓ NIK & Tiket Terverifikasi Valid!',
      text: isZh ? '您的 NIK 已与已办结的服务票号关联，可以提交 SKM 满意度调查。' : isEn ? 'Your NIK is verified against completed service records. You may now submit your survey.' : 'NIK & Tiket Layanan Anda telah terverifikasi dalam database pelayanan MPP. Silakan lanjutkan pengisian survei SKM.',
      confirmButtonColor: '#10b981'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check verification requirement (bypassed if user is logged in or verified)
    if (!isVerifiedTicket && !isLoggedIn && !isSessionVerified) {
      Swal.fire({
        icon: 'warning',
        title: isZh ? '需要 NIK 与 OTP 票号验证！' : isEn ? 'NIK & Ticket OTP Verification Required!' : 'Verifikasi NIK & OTP Tiket Diperlukan!',
        text: isZh ? '为确保 PermenPAN-RB 官方调查的真实性，请先输入 NIK 并完成服务票号 OTP 验证。' : isEn ? 'To ensure official PermenPAN-RB survey integrity, please enter your NIK and verify your ticket OTP code first.' : 'Untuk menjaga validitas survei resmi PermenPAN-RB, silakan masukkan NIK dan lakukan verifikasi OTP tiket layanan Anda terlebih dahulu.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const finalName = isAnonymous 
        ? (isZh ? '鲁乌居民 (匿名)' : isEn ? 'Luwu Resident (Anonymous)' : 'Warga Luwu (Anonim)') 
        : (nama.trim() || (isZh ? '鲁乌居民' : isEn ? 'Luwu Resident' : (userType === 'investor' ? 'Investor Luwu' : 'Masyarakat Luwu')));

      const res = await submitMppSurvey({
        nama: finalName,
        user_type: userType,
        instansi,
        layanan: layanan.trim() || (availableServices[0] || 'Pelayanan Terpadu Satu Pintu'),
        q1_persyaratan: ratings.q1_persyaratan,
        q2_prosedur: ratings.q2_prosedur,
        q3_waktu: ratings.q3_waktu,
        q4_biaya: ratings.q4_biaya,
        q5_produk: ratings.q5_produk,
        q6_kompetensi: ratings.q6_kompetensi,
        q7_perilaku: ratings.q7_perilaku,
        q8_sarpras: ratings.q8_sarpras,
        q9_pengaduan: ratings.q9_pengaduan,
        feedback
      });

      if (onSubmitted) onSubmitted(res.data);

      await Swal.fire({
        icon: 'success',
        title: isZh ? 'SKM 满意度调查提交成功！' : isEn ? 'SKM Survey Successfully Submitted!' : 'Survei SKM Berhasil Terkirim!',
        html: `
          <div class="text-left text-xs space-y-2 mt-2 font-sans">
            <p>${isZh ? '感谢您的参与，' : isEn ? 'Thank you for your participation, ' : 'Terima kasih atas partisipasi Anda, '}<strong>${finalName}</strong>.</p>
            <p class="text-emerald-600 dark:text-emerald-400 font-bold">${isZh ? '您的 IKM 评分：' : isEn ? 'Your IKM Score: ' : 'Skor IKM Anda: '} ${liveAveragePercent}% (${predikat})</p>
            <p class="text-slate-500">${isZh ? '您的评价已自动同步至 Portal 的“满意度调查”与“居民评价”专区。' : isEn ? 'Your evaluation has been automatically synced to the SATISFACTION SURVEY section on the Portal.' : 'Penilaian ini telah disinkronkan secara otomatis ke Seksi SURVEY KEPUASAN pada Portal MPP.'}</p>
          </div>
        `,
        confirmButtonColor: '#10b981',
        confirmButtonText: isZh ? '完成' : isEn ? 'Done' : 'Selesai'
      });

      setFeedback('');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: isZh ? '提交调查失败' : isEn ? 'Failed to Submit Survey' : 'Gagal Mengirim Survei',
        text: err?.message || (isZh ? '提交数据时发生网络错误。' : isEn ? 'Network error while submitting survey data.' : 'Terjadi gangguan jaringan saat mengirim data survei.'),
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`rounded-3xl border p-4 sm:p-8 backdrop-blur-md shadow-xl transition-all ${
      isDarkMode ? 'bg-slate-900/70 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans inline-flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> PermenPAN-RB No. 14 / 2017
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {userType === 'investor' 
                ? (isZh ? '投资者与企业满意度调查' : isEn ? 'Investor & Business Survey' : 'SKM Pelaku Usaha & Investor') 
                : (isZh ? '鲁乌县居民满意度调查' : isEn ? 'Luwu Citizen Survey' : 'SKM Warga Kabupaten Luwu')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            {isZh ? '公众满意度调查 (SKM)' : isEn ? 'Public Satisfaction Survey (SKM)' : 'Survei Kepuasan Masyarakat (SKM)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed font-normal">
            {isZh 
              ? '协助我们在 Simpurusiang 公共服务中心打造卓越且问责的政务服务。您的评价将自动同步至 MPP 门户网站的“满意度调查”专区。' 
              : isEn 
              ? 'Help us achieve excellent and accountable public service at MPP Simpurusiang. Your survey score is automatically synchronized to the SATISFACTION SURVEY section on the MPP Portal.' 
              : 'Bantu kami mewujudkan pelayanan publik prima dan akuntabel di MPP Simpurusiang. Nilai survei Anda otomatis terintegrasi ke Seksi SURVEY KEPUASAN pada Portal MPP.'}
          </p>
        </div>

        {/* Live Score Widget */}
        <div className="px-5 py-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/15 border border-emerald-500/30 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-sans block">
              {isZh ? '您的评分指数' : isEn ? 'Your Score Index' : 'Indeks Penilaian Anda'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-sans">
                {liveAveragePercent}%
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                {predikat.split(' ')[0]}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              {isZh ? '已评估 9 项要素' : isEn ? '9 Elements Evaluated' : '9 Unsur Terpenuhi'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ThumbsUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* SECTION 1: Status Validasi Identitas Responden & Sesi Login */}
        {isSessionVerified ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 font-sans">
                  {userType === 'investor' 
                    ? (isZh ? '投资者官方验证账户' : isEn ? 'Investor Verified Account' : 'Akun Resmi Investor Terverifikasi')
                    : (isZh ? '居民申请人官方验证身份' : isEn ? 'Citizen Official Verified Identity' : 'Identitas Resmi Pemohon Terverifikasi')}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PermenPAN-RB Verified (Sesi Login Aktif)
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {userType === 'investor'
                ? (isZh ? `您已作为 ${perusahaan || nama} 登录。无需再通过 WhatsApp 请求 OTP，可直接提交 SKM 调查。` : isEn ? `You are logged in as ${perusahaan || nama}. You can submit the survey directly without requiring WhatsApp OTP.` : `Anda telah resmi masuk ke sesi Portal Investor (${perusahaan || nama}). Survei SKM dapat langsung diisi dan dikirim tanpa verifikasi OTP WhatsApp.`)
                : (isZh ? `您已作为 ${nama} (${nik ? `NIK: ${nik.slice(0, 6)}******${nik.slice(-4)}` : '已注册'}) 登录。无需再请求 WhatsApp OTP。` : isEn ? `You are officially logged in as ${nama} (${nik ? `NIK: ${nik.slice(0, 6)}******${nik.slice(-4)}` : 'Registered'}). No WhatsApp OTP verification needed.` : `Anda telah resmi masuk ke sesi akun Masyarakat Luwu atas nama ${nama} ${nik ? `(NIK: ${nik.slice(0, 6)}******${nik.slice(-4)})` : ''}. Survei Kepuasan Masyarakat (SKM) dapat langsung diisi dan dikirim tanpa verifikasi ulang OTP WhatsApp.`)}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-sans">
                  {isZh ? '受访者 NIK 与服务票号验证 (必须)' : isEn ? 'Respondent NIK & Ticket Verification (Required)' : 'Validasi NIK Responden & Tiket Layanan (Wajib)'}
                </h3>
              </div>
              {isVerifiedTicket ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isZh ? '✓ NIK 与服务票号验证成功' : isEn ? '✓ NIK & Ticket Verified' : '✓ NIK & Tiket Terverifikasi Valid'}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isZh ? '未验证 (请输入 NIK 并获取 OTP)' : isEn ? 'Unverified (Enter NIK & Get OTP)' : 'Belum Diverifikasi (Isi NIK & Minta OTP)'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Input NIK */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                  {isZh ? '16位身份证号 (NIK) / 办理票号' : isEn ? 'National ID (NIK) / Service Ticket No.' : 'NIK Responden / Nomor Tiket Layanan'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={18}
                    value={nik}
                    onChange={(e) => {
                      setNik(e.target.value);
                      if (isVerifiedTicket) setIsVerifiedTicket(false);
                    }}
                    placeholder={isZh ? '请输入16位 NIK 或票号 (例如: 7317012345670001 / T-084)...' : isEn ? 'Enter 16-digit NIK or Ticket No. (e.g. 7317012345670001 / T-084)...' : 'Masukkan 16 digit NIK atau Nomor Tiket (Contoh: 7317012345670001 / T-084)...'}
                    className="w-full min-h-[44px] px-3.5 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Ticket className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Input OTP & Buttons */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                  {isZh ? 'OTP 验证码 (发送至手机)' : isEn ? 'OTP Verification Code (via Mobile)' : 'Kode OTP Verifikasi Tiket'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder={isZh ? '6位验证码...' : isEn ? '6-digit OTP...' : '6 digit OTP...'}
                      className="w-full min-h-[44px] px-3.5 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>

                  {!isOtpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="min-h-[44px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{isZh ? '发送 OTP' : isEn ? 'Send OTP' : 'Kirim OTP'}</span>
                    </button>
                  ) : !isVerifiedTicket ? (
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="min-h-[44px] px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isZh ? '验证 OTP' : isEn ? 'Verify' : 'Verifikasi'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="min-h-[44px] px-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {ticketInfo && isVerifiedTicket && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold">
                  {isZh ? '已验证已办结服务记录：' : isEn ? 'Verified Completed Service Record: ' : 'Rekam Pelayanan Terlayani: '}
                  <strong>{ticketInfo.ticketNo}</strong> ({ticketInfo.counterName})
                </span>
                <span className="font-mono text-[11px] opacity-80">{ticketInfo.serviceDate}</span>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: Identitas Responden & Select Instansi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Nama Responden */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                {isZh ? '受访人 / 申请人姓名' : isEn ? 'Respondent / Applicant Name' : 'Nama Responden / Pemohon'}
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>{isZh ? '匿名提交' : isEn ? 'Submit Anonymously' : 'Kirim Anonim'}</span>
              </label>
            </div>
            <input
              type="text"
              disabled={isAnonymous}
              value={isAnonymous ? (isZh ? '鲁乌居民 (匿名)' : isEn ? 'Luwu Resident (Anonymous)' : 'Warga Luwu (Anonim)') : nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder={isZh ? '请输入您的全名...' : isEn ? 'Enter your full name...' : 'Masukkan nama lengkap Anda...'}
              className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Instansi Tujuan */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
              {isZh ? '接受评价的政务部门' : isEn ? 'Evaluated Public Agency' : 'Instansi Pelayanan yang Dinilai'}
            </label>
            <select
              value={instansi}
              onChange={(e) => {
                setInstansi(e.target.value);
                setLayanan(''); // reset dynamic service selection
              }}
              className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {MPP_AGENCIES_DEFAULT.map((inst, idx) => (
                <option key={idx} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* SECTION 3: Jenis Layanan yang Diurus (DROPDOWN DINAMIS SESUAI INSTANSI) */}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans flex items-center justify-between">
              <span>{isZh ? '申办的服务事项 (可选)' : isEn ? 'Service Type Managed (Optional)' : 'Jenis Layanan yang Diurus (Opsional)'}</span>
              <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                {isZh ? '• 选项已根据所选部门自动更新' : isEn ? '• Options auto-filtered by selected agency' : '• Pilihan disesuaikan dengan instansi terpilih'}
              </span>
            </label>
            
            <select
              value={layanan}
              onChange={(e) => setLayanan(e.target.value)}
              className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="">
                {isZh 
                  ? `-- 选择 ${instansi.split(' ')[0]} 的具体服务事项 (可选) --` 
                  : isEn 
                  ? `-- Select Service Type from ${instansi.split(' ')[0]} (Optional) --` 
                  : `-- Pilih Jenis Layanan dari ${instansi.split(' ')[0]} (Opsional) --`}
              </option>
              {availableServices.map((item, idx) => (
                <option key={idx} value={item}>
                  {item}
                </option>
              ))}
              <option value={isZh ? '其他服务事项 / 综合咨询' : isEn ? 'Other Service / General Inquiry' : 'Layanan Lainnya / Pertanyaan Umum'}>
                {isZh ? '其他服务事项 / 综合咨询' : isEn ? 'Other Service / General Inquiry' : 'Layanan Lainnya / Pertanyaan Umum'}
              </option>
            </select>
          </div>
        </div>

        {/* SECTION 4: 9 Indikator SKM PermenPAN-RB */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm sm:text-base font-bold font-sans flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              {isZh ? '9项公共服务标准评估' : isEn ? 'Evaluation of 9 Public Service Standards' : 'Penilaian 9 Unsur Standar Pelayanan Publik'}
            </h3>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              {isZh ? '1 - 4 级评分' : isEn ? 'Scale 1 - 4' : 'Skala 1 - 4'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {skmQuestions.map((q) => {
              const currentVal = ratings[q.id] || 4;
              const Icon = q.icon;
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-xl bg-emerald-500/10 ${q.color} shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold font-sans text-slate-900 dark:text-white">
                          {q.title}
                        </h4>
                        {/* PERTANYAAN AWALAN DENGAN WAKTU KONTRAS TINGGI SANGAT JELAS DIBACA */}
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1 leading-snug">
                          {q.question}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono self-end sm:self-start px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                      {isZh ? '得分' : isEn ? 'Score' : 'Nilai'}: {currentVal} / 4
                    </span>
                  </div>

                  {/* 4 Pilihan Tombol (HAPUS UCAPAN '1 Bintang, 2 Bintang...' DIBAGIAN ATASNYA) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {ratingOptions.map((opt) => {
                      const isSelected = currentVal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleRatingChange(q.id, opt.value)}
                          className={`min-h-[46px] py-2.5 px-3 rounded-xl border text-left transition-all flex flex-col justify-center cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 font-bold ring-2 ring-emerald-400/40'
                              : isDarkMode
                              ? 'bg-slate-800 border-slate-700/80 text-slate-300 hover:border-slate-600'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-xs sm:text-sm font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                              {opt.label}
                            </span>
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-1" />
                            ) : (
                              <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0 ml-1">
                                {opt.value}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: Saran & Masukan */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans flex items-center gap-1.5">
            <MessageSquareHeart className="w-4 h-4 text-emerald-500" />
            {isZh ? '意见建议、表扬与服务改进反馈' : isEn ? 'Suggestions, Appreciation & Service Feedback' : 'Saran, Apresiasi & Masukan Perbaikan Pelayanan'}
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={isZh ? '请写下您对窗口舒适度、工作人员态度或排队效率的体验、建议或表扬...' : isEn ? 'Write your experience, feedback, or appreciation regarding counter comfort, staff attitude, or queue speed...' : 'Tuliskan pengalaman, masukan atau apresiasi Anda terhadap kenyamanan loket, sikap petugas, atau kecepatan antrean...'}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isZh ? '* 您提交的反馈将自动转交至 MPP 监督团队，并可能展示于公众 Portal。' : isEn ? '* Your feedback will automatically be forwarded to the MPP supervisory team and displayed on the public portal.' : '* Masukan yang Anda tuliskan akan otomatis diteruskan ke tim pengawas MPP dan dapat ditampilkan di portal masyarakat.'}
          </p>
        </div>

        {/* SECTION 6: Tombol Kirim */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{isZh ? '直连 Simpurusiang 公共服务中心数字监管系统' : isEn ? 'Directly connected to MPP Simpurusiang Monitoring System' : 'Terhubung langsung ke Sistem Monitoring MPP Simpurusiang'}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold font-sans text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>{isZh ? '正在保存调查...' : isEn ? 'Saving Survey...' : 'Menyimpan Survei...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isZh ? '立即提交 SKM 满意度调查' : isEn ? 'Submit SKM Survey Now' : 'Kirim Survei SKM Sekarang'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
