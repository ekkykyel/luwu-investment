import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Building2, User, Briefcase, QrCode, ShieldCheck, Lock, 
  Smartphone, Clock, RefreshCw, Printer, CheckCircle2, AlertCircle, 
  ArrowLeft, ArrowRight, Volume2, VolumeX, Sparkles, ChevronRight, 
  Search, FileText, Check, Globe, HelpCircle, KeyRound, Radio, Compass,
  Sun, Moon, Languages, Accessibility, BellRing, Share2, Download,
  ExternalLink, Eye, Info, Ticket, CreditCard, Star, MessageSquareHeart,
  MapPin
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { MPPTenant, MPPService, MPPCitizen } from '../types/mpp';
import { LUWU_LOGO_BASE64 } from '../lib/logoBase64';
import { KioskAudioEngine } from './mpp/MppKioskAudioAnnouncer';
import { MppAirportFidsBoard } from './mpp/MppAirportFidsBoard';
import { MppCitizenSurveyMenu } from './mpp/MppCitizenSurveyMenu';
import { MppCitizenTestimonialMenu } from './mpp/MppCitizenTestimonialMenu';
import { getPreciseServicesForAgency } from '../data/mppAgenciesData';

export type KioskLang = 'id' | 'en' | 'zh';
export type KioskTheme = 'dark' | 'light';

// Comprehensive 3-Language Dictionary for International Airport Standard Kiosk
const KIOSK_I18N = {
  id: {
    kiosk_title: 'KIOS MANDIRI',
    mpp_title: 'MPP SIMPURUSIANG',
    regency: 'KABUPATEN LUWU',
    wita_clock: 'Waktu Indonesia Tengah (WITA)',
    auto_reset: 'Auto-Reset',
    sound_label: 'Suara Audio Bandara',
    theme_label: 'Mode Tema',
    exit: 'Keluar',
    accessibility_mode: 'Mode Ramah Disabilitas & Lansia',
    assisted_desk: 'Panggil Petugas Dampingan',
    assisted_calling: 'Petugas Front Office Sedang Menuju ke Kios Anda...',
    assisted_confirmed: 'Sinyal Bantuan Terkirim ke Meja Petugas',
    fids_board_btn: 'Papan Jadwal Loket (FIDS)',
    step1_badge: 'SENTUH MONITOR UNTUK MEMULAI LAYANAN',
    step1_welcome: 'Selamat Datang di',
    step1_self_service: 'Layanan Mandiri',
    step1_desc: 'Silakan tentukan jalur layanan Anda untuk mendapatkan prioritas dan antrean yang tepat.',
    gate1_badge: 'JALUR UMUM (TERMINAL A)',
    gate1_title: 'Warga / Masyarakat',
    gate1_desc: 'Pengurusan KTP-el, Kartu Keluarga, Akta Kelahiran, Pajak Daerah PBB, Samsat, BPJS, dan Surat Rekomendasi.',
    gate1_btn: 'Masuk Jalur Warga',
    gate2_badge: 'JALUR PRIORITAS (TERMINAL B - VIP)',
    gate2_title: 'Investor / Pelaku Usaha',
    gate2_desc: 'Penerbitan NIB OSS-RBA, Kesesuaian Tata Ruang (KKPR), Persetujuan Bangunan Gedung (PBG), dan Konsultasi Insentif Investasi.',
    gate2_btn: 'Masuk Investor Corner',
    util_label: 'UTILITAS BANDARA:',
    fids_btn: 'Lihat Papan Jadwal FIDS',
    track_doc: 'Lacak Status Berkas',
    back_to_lanes: 'Kembali ke Pilihan Jalur',
    pdp_badge: 'PROTOKOL KEAMANAN IDENTITAS UU PDP 27/2022',
    nik_label: 'NOMOR INDUK KEPENDUDUKAN (NIK)',
    digit_unit: 'digit',
    nik_complete: 'VERIFIED · 16 DIGIT LENGKAP',
    tap_to_type: 'Sentuh untuk mengetik (16 digit NIK)',
    remaining_digits: 'Kurang',
    step2_title: 'Identifikasi Pemohon',
    step2_desc: 'Masukkan 16 digit NIK Anda pada keypad di samping atau sentuh kotak input.',
    step2_badge: 'LANGKAH 1 DARI 2 (VERIFIKASI KEAMANAN)',
    verified_16: 'VERIFIED · 16 DIGIT LENGKAP',
    nik_touch_hint: 'Sentuh untuk mengetik (16 digit NIK)',
    nik_less_digits: 'Kurang {n} digit lagi',
    send_otp_btn: 'Kirim Kode OTP ke WhatsApp Pemilik Sah',
    send_otp_btn_mobile: 'Kirim Kode OTP via WhatsApp',
    send_otp_new: 'Kirim OTP ke WhatsApp Baru',
    step2_otp_badge: 'LANGKAH 2 DARI 2 (VERIFIKASI KEAMANAN)',
    step2_otp_title: 'Masukkan 4 Digit Kode OTP',
    step2_otp_desc: 'Demi perlindungan data privasi, sistem telah mengirimkan kode 4 digit ke WhatsApp',
    otp_not_received: 'Belum menerima kode OTP?',
    resend_otp: 'Kirim Ulang OTP',
    confirm_otp_btn: 'Konfirmasi & Buka Layanan Mandiri',
    confirm_otp_btn_mobile: 'Konfirmasi & Buka Layanan',
    change_nik: 'Ganti NIK',
    keypad_title: 'KEYPAD LAYAR SENTUH',
    keypad_hint: 'Mendukung keypad numerik layar sentuh',
    keypad_reset: 'RESET',
    keypad_delete: 'HAPUS',
    first_time_title: 'Pendaftaran Profil Pemohon Baru',
    first_time_desc: 'NIK Anda belum terdaftar di database kependudukan MPP. Silakan lengkapi data profil untuk melanjutkan.',
    fullname_label: 'Nama Lengkap (Sesuai KTP)',
    phone_label: 'Nomor WhatsApp Aktif',
    gender_label: 'Jenis Kelamin',
    male: 'Laki-laki',
    female: 'Perempuan',
    occupation_label: 'Pekerjaan / Profesi',
    investor_profile_title: 'Data Tambahan Investor / Badan Usaha',
    company_label: 'Nama Perusahaan / Usaha',
    npwp_label: 'NPWP Perusahaan (Opsional)',
    sector_label: 'Sektor Investasi',
    scale_label: 'Skala Rencana Investasi',
    step3_verified_session: 'SESI TERVERIFIKASI OTP',
    step3_finish_exit: 'Selesai & Keluar Sesi',
    step3_select_tenant: 'PILIH INSTANSI',
    step3_agencies_count: 'Instansi',
    step3_choose_agency_prompt: 'Silakan Pilih Instansi Tujuan',
    step3_choose_agency_desc: 'Pilih instansi di sebelah kiri untuk melihat daftar layanan mandiri dan tiket antrean yang tersedia.',
    step3_back_to_tenants: 'Kembali ke Instansi',
    step3_selected_counter: 'LOKET INSTANSI TERPILIH',
    step3_no_services: 'Tidak ada layanan aktif saat ini untuk instansi ini.',
    step3_requirements: 'Syarat:',
    step3_minutes: 'Menit',
    step3_take_ticket: 'Ambil Tiket',
    step4_success_badge: 'REGISTRASI KIOS BERHASIL',
    step4_title: 'Boarding Pass Layanan Terbit',
    step4_desc: 'Tiket resmi antrean Anda siap dicetak atau disimpan di WhatsApp.',
    step4_tab_boarding_pass: 'Boarding Pass Digital (E-Pass)',
    step4_tab_thermal_slip: 'Struk Kertas Termal (Thermal Slip)',
    step4_gov_header: 'PEMERINTAH KABUPATEN LUWU',
    step4_your_queue: 'NOMOR ANTREAN ANDA',
    step4_dest_counter: 'LOKET TUJUAN',
    step4_applicant_name: 'NAMA PEMOHON',
    step4_nik_verified: 'NIK (TERVERIFIKASI)',
    step4_est_time: 'ESTIMASI WAKTU',
    step4_visit_date: 'TANGGAL KUNJUNGAN',
    step4_service_type: 'JENIS LAYANAN',
    step4_printed_notice: 'Struk tiket fisik telah berhasil dicetak dari thermal printer Kios.',
    step4_print_btn: 'Cetak Tiket Kios',
    step4_printing_btn: 'Mencetak Struk...',
    step4_voice_announcement: 'Putar Panggilan Suara Bandara',
    step4_done_btn: 'Selesai & Ke Beranda',
    footer_online: 'SISTEM ONLINE',
    footer_db: 'DB POSTGRES KAB. LUWU AKTIF',
    footer_vip: 'Fast Track VIP: Siap Melayani',
    footer_copy: 'DPMPTSP KABUPATEN LUWU © 2026',
    not_registered_warning: 'Anda belum terdaftar, silakan lakukan registrasi pada ambil nomor antrian online.',
  },
  en: {
    kiosk_title: 'SELF-SERVICE KIOSK',
    mpp_title: 'MPP SIMPURUSIANG',
    regency: 'LUWU REGENCY',
    wita_clock: 'Central Indonesia Time (WITA)',
    auto_reset: 'Auto-Reset',
    sound_label: 'Airport Audio Sound',
    theme_label: 'Theme Mode',
    exit: 'Exit',
    accessibility_mode: 'Disability & Senior Accessible Mode',
    assisted_desk: 'Call Assistance Staff',
    assisted_calling: 'Front Office Officer is on the way to your Kiosk...',
    assisted_confirmed: 'Assistance Beacon Signal Sent to Front Desk',
    fids_board_btn: 'Schedule Board (FIDS)',
    step1_badge: 'TOUCH SCREEN TO BEGIN SERVICE',
    step1_welcome: 'Welcome to',
    step1_self_service: 'Self-Service Kiosk',
    step1_desc: 'Please select your service lane to receive proper queue priority and routing.',
    gate1_badge: 'GENERAL LANE (TERMINAL A)',
    gate1_title: 'Citizens / Public',
    gate1_desc: 'E-ID (KTP), Family Cards, Birth Certificates, Property Tax, Vehicle Reg, BPJS Health, and Official Permits.',
    gate1_btn: 'Enter Citizen Lane',
    gate2_badge: 'PRIORITY LANE (TERMINAL B - VIP)',
    gate2_title: 'Investors / Businesses',
    gate2_desc: 'Business Registration (NIB OSS), Spatial Planning (KKPR), Building Approvals (PBG), and Investment Incentives.',
    gate2_btn: 'Enter Investor Corner',
    util_label: 'AIRPORT UTILITIES:',
    fids_btn: 'View FIDS Schedule Board',
    track_doc: 'Track Document Status',
    back_to_lanes: 'Back to Lane Selection',
    pdp_badge: 'DATA PRIVACY SECURITY PROTOCOL LAW 27/2022',
    nik_label: 'NATIONAL IDENTIFICATION NUMBER (NIK)',
    digit_unit: 'digits',
    nik_complete: 'VERIFIED · 16 DIGITS COMPLETE',
    tap_to_type: 'Tap to type (16-digit ID number)',
    remaining_digits: 'Remaining',
    step2_title: 'Applicant Identification',
    step2_desc: 'Enter your 16-digit ID number using the numpad or tap the input box.',
    step2_badge: 'STEP 1 OF 2 (SECURITY VERIFICATION)',
    verified_16: 'VERIFIED · 16 DIGITS COMPLETE',
    nik_touch_hint: 'Tap to type (16-digit ID number)',
    nik_less_digits: '{n} digits remaining',
    send_otp_btn: 'Send OTP Code to Registered WhatsApp',
    send_otp_btn_mobile: 'Send OTP via WhatsApp',
    send_otp_new: 'Send OTP to New WhatsApp',
    step2_otp_badge: 'STEP 2 OF 2 (SECURITY VERIFICATION)',
    step2_otp_title: 'Enter 4-Digit OTP Code',
    step2_otp_desc: 'For privacy protection, the system has sent a 4-digit code to WhatsApp',
    otp_not_received: "Didn't receive the OTP code?",
    resend_otp: 'Resend OTP',
    confirm_otp_btn: 'Confirm & Open Self-Service',
    confirm_otp_btn_mobile: 'Confirm & Continue',
    change_nik: 'Change ID',
    keypad_title: 'TOUCHSCREEN NUMPAD',
    keypad_hint: 'Supports touchscreen numeric keypad',
    keypad_reset: 'RESET',
    keypad_delete: 'DELETE',
    first_time_title: 'New Applicant Profile Registration',
    first_time_desc: 'Your ID is not yet registered in the MPP database. Please complete your profile data to proceed.',
    fullname_label: 'Full Name (as per ID)',
    phone_label: 'Active WhatsApp Number',
    gender_label: 'Gender',
    male: 'Male',
    female: 'Female',
    occupation_label: 'Occupation / Profession',
    investor_profile_title: 'Additional Investor / Corporate Data',
    company_label: 'Company / Enterprise Name',
    npwp_label: 'Company Tax ID (Optional)',
    sector_label: 'Investment Sector',
    scale_label: 'Planned Investment Scale',
    step3_verified_session: 'OTP VERIFIED SESSION',
    step3_finish_exit: 'Finish & Exit Session',
    step3_select_tenant: 'SELECT AGENCY',
    step3_agencies_count: 'Agencies',
    step3_choose_agency_prompt: 'Please Select Destination Agency',
    step3_choose_agency_desc: 'Select an agency on the left to view available self-services and queue tickets.',
    step3_back_to_tenants: 'Back to Agencies',
    step3_selected_counter: 'SELECTED AGENCY COUNTER',
    step3_no_services: 'No active services available currently for this agency.',
    step3_requirements: 'Requirements:',
    step3_minutes: 'Mins',
    step3_take_ticket: 'Get Ticket',
    step4_success_badge: 'KIOSK REGISTRATION SUCCESSFUL',
    step4_title: 'Service Boarding Pass Issued',
    step4_desc: 'Your official queue ticket is ready to print or save via WhatsApp.',
    step4_tab_boarding_pass: 'Digital Boarding Pass (E-Pass)',
    step4_tab_thermal_slip: 'Paper Thermal Slip (Receipt)',
    step4_gov_header: 'LUWU REGENCY GOVERNMENT',
    step4_your_queue: 'YOUR QUEUE NUMBER',
    step4_dest_counter: 'DESTINATION COUNTER',
    step4_applicant_name: 'APPLICANT NAME',
    step4_nik_verified: 'ID NUMBER (VERIFIED)',
    step4_est_time: 'ESTIMATED TIME',
    step4_visit_date: 'VISIT DATE',
    step4_service_type: 'SERVICE TYPE',
    step4_printed_notice: 'Physical ticket receipt has been printed from the Kiosk thermal printer.',
    step4_print_btn: 'Print Kiosk Ticket',
    step4_printing_btn: 'Printing Receipt...',
    step4_voice_announcement: 'Play Airport Voice Chime',
    step4_done_btn: 'Done & Return Home',
    footer_online: 'SYSTEM ONLINE',
    footer_db: 'LUWU REGENCY POSTGRES ACTIVE',
    footer_vip: 'Fast Track VIP: Ready to Serve',
    footer_copy: 'LUWU REGENCY DPMPTSP © 2026',
    not_registered_warning: 'You are not registered yet. Please register via the online queue registration.',
  },
  zh: {
    kiosk_title: '自助服务终端',
    mpp_title: 'MPP SIMPURUSIANG',
    regency: '鲁武县政府',
    wita_clock: '印尼中部时间 (WITA)',
    auto_reset: '自动重置',
    sound_label: '机场提示音',
    theme_label: '切换主题',
    exit: '退出',
    accessibility_mode: '无障碍长者与残障模式',
    assisted_desk: '呼叫现场引导专员',
    assisted_calling: '政务引导专员正在前往您的自助机...',
    assisted_confirmed: '求助信号已成功发送至服务台',
    fids_board_btn: '窗口时刻大屏 (FIDS)',
    step1_badge: '轻触屏幕以开始办理服务',
    step1_welcome: '欢迎使用',
    step1_self_service: '政务自助服务终端',
    step1_desc: '请选择您的服务通道，以便为您提供精准的优先等级与排队取号。',
    gate1_badge: '普通通道 (A航站楼)',
    gate1_title: '居民 / 公众服务',
    gate1_desc: '办理电子身份证、户口簿、出生证明、土地房产税、车辆年审、医保以及各类行政许可。',
    gate1_btn: '进入居民服务通道',
    gate2_badge: '优先通道 (B航站楼 - VIP)',
    gate2_title: '投资者 / 企业专区',
    gate2_desc: '企业注册编号(NIB)、空间规划许可(KKPR)、建筑许可(PBG)及各项投资优惠政策咨询。',
    gate2_btn: '进入投资服务专区',
    util_label: '机场实用工具:',
    fids_btn: '查看 FIDS 窗口大屏',
    track_doc: '查询文件审批进度',
    back_to_lanes: '返回通道选择',
    pdp_badge: '个人数据隐私保护法安全协议 27/2022',
    nik_label: '居民身份证号码 (NIK)',
    digit_unit: '位数',
    nik_complete: '验证成功 · 16位已完成',
    tap_to_type: '点击输入（16位身份证号）',
    remaining_digits: '还剩',
    step2_title: '申请人身份验证',
    step2_desc: '请在旁侧数字键盘输入16位身份证号，或点击输入框。',
    step2_badge: '第 1 步 / 共 2 步 (安全验证)',
    verified_16: '验证成功 · 16位已完成',
    nik_touch_hint: '点击输入（16位身份证号）',
    nik_less_digits: '还剩 {n} 位数字',
    send_otp_btn: '通过 WhatsApp 发送验证码',
    send_otp_btn_mobile: '通过 WhatsApp 发送验证码',
    send_otp_new: '发送验证码至新 WhatsApp 号码',
    step2_otp_badge: '第 2 步 / 共 2 步 (安全验证)',
    step2_otp_title: '请输入 4 位验证码',
    step2_otp_desc: '为保护您的个人隐私，系统已向以下 WhatsApp 发送4位验证码',
    otp_not_received: '未收到验证码？',
    resend_otp: '重新发送验证码',
    confirm_otp_btn: '确认并开启自助服务',
    confirm_otp_btn_mobile: '确认并继续',
    change_nik: '更换身份证号',
    keypad_title: '触屏数字键盘',
    keypad_hint: '支持触屏按键及身份证条码扫描枪',
    keypad_reset: '重置',
    keypad_delete: '删除',
    first_time_title: '新申请人档案登记',
    first_time_desc: '您的身份证号尚未在政务大厅登记。请完善以下基本信息以继续。',
    fullname_label: '真实姓名 (与身份证一致)',
    phone_label: '活跃 WhatsApp 手机号',
    gender_label: '性别',
    male: '男',
    female: '女',
    occupation_label: '职业 / 身份',
    investor_profile_title: '投资者 / 企业附加信息',
    company_label: '公司 / 企业名称',
    npwp_label: '企业税号 (可选)',
    sector_label: '投资领域',
    scale_label: '计划投资规模',
    step3_verified_session: '已通过 OTP 身份验证',
    step3_finish_exit: '完成并退出会话',
    step3_select_tenant: '选择入驻机构',
    step3_agencies_count: '家机构',
    step3_choose_agency_prompt: '请选择目标办理机构',
    step3_choose_agency_desc: '在左侧列表中点击机构，以查看该机构可用的自助服务与排队号码。',
    step3_back_to_tenants: '返回机构列表',
    step3_selected_counter: '已选机构服务窗口',
    step3_no_services: '该机构目前暂无可用服务项目。',
    step3_requirements: '办理条件:',
    step3_minutes: '分钟',
    step3_take_ticket: '立即取号',
    step4_success_badge: '自助取号成功',
    step4_title: '服务登机牌已成功出票',
    step4_desc: '您的正式排队号票已就绪，可打印纸质票据或保存至 WhatsApp。',
    step4_tab_boarding_pass: '电子登机牌 (E-Pass)',
    step4_tab_thermal_slip: '热敏小票纸 (Thermal Slip)',
    step4_gov_header: '鲁武县政府政务服务中心',
    step4_your_queue: '您的排队号码',
    step4_dest_counter: '办理窗口',
    step4_applicant_name: '申请人姓名',
    step4_nik_verified: '身份证号 (已验证)',
    step4_est_time: '预计办理时间',
    step4_visit_date: '到访日期',
    step4_service_type: '服务类型',
    step4_printed_notice: '号票凭证已从自助终端热敏打印机成功打印。',
    step4_print_btn: '打印号票凭证',
    step4_printing_btn: '正在打印凭条...',
    step4_voice_announcement: '播放机场广播语音',
    step4_done_btn: '完成并返回首页',
    footer_online: '系统在线',
    footer_db: '鲁武县政务数据库运行正常',
    footer_vip: '绿色VIP通道：竭诚服务',
    footer_copy: '鲁武县投资与一站式服务局 © 2026',
    not_registered_warning: '您尚未登记注册，请先在网上排队注册系统进行登记。',
  },
};

export const TENANT_CATEGORIES = [
  { id: 'all', label: 'Semua Instansi' },
  { id: 'kependudukan', label: 'Kependudukan & Capil' },
  { id: 'pertanahan', label: 'Pertanahan & ATR' },
  { id: 'pajak', label: 'Pajak & Keuangan' },
  { id: 'kesehatan', label: 'Jamsostek & BPJS' },
  { id: 'perizinan', label: 'Perizinan & UMKM' },
  { id: 'hukum', label: 'Hukum & Kepolisian' },
];

export const getTenantCategory = (tenantName: string): string => {
  const name = (tenantName || '').toLowerCase();
  if (name.includes('kependudukan') || name.includes('dukcapil') || name.includes('kemenag') || name.includes('agama')) {
    return 'kependudukan';
  }
  if (name.includes('pertanahan') || name.includes('bpn') || name.includes('agraria') || name.includes('tata ruang') || name.includes('pupr')) {
    return 'pertanahan';
  }
  if (name.includes('bapenda') || name.includes('pajak') || name.includes('samsat') || name.includes('bank') || name.includes('keuangan')) {
    return 'pajak';
  }
  if (name.includes('bpjs') || name.includes('kesehatan') || name.includes('ketenagakerjaan') || name.includes('sosial')) {
    return 'kesehatan';
  }
  if (name.includes('dpmptsp') || name.includes('penanaman modal') || name.includes('perizinan') || name.includes('dekranasda') || name.includes('koperasi') || name.includes('umkm')) {
    return 'perizinan';
  }
  if (name.includes('polres') || name.includes('polisi') || name.includes('kejaksaan') || name.includes('pengadilan') || name.includes('hukum')) {
    return 'hukum';
  }
  return 'lainnya';
};

export const POPULAR_SERVICES_SHORTCUTS = [
  {
    agencyKeyword: 'kependudukan',
    serviceName: 'Pencetakan & Penggantian KTP-el',
    agencyName: 'Dinas Kependudukan & Pencatatan Sipil',
    badge: 'Disdukcapil',
    estTime: '10 Menit',
  },
  {
    agencyKeyword: 'pertanahan',
    serviceName: 'Pengecekan Sertifikat & Roya',
    agencyName: 'Badan Pertanahan Nasional (BPN)',
    badge: 'BPN Luwu',
    estTime: '15 Menit',
  },
  {
    agencyKeyword: 'bapenda',
    serviceName: 'Pembayaran Pajak Daerah & PBB-P2',
    agencyName: 'Badan Pendapatan Daerah',
    badge: 'Bapenda',
    estTime: '10 Menit',
  },
  {
    agencyKeyword: 'bpjs kesehatan',
    serviceName: 'Pendaftaran Peserta & Pindah Faskes',
    agencyName: 'BPJS Kesehatan Kantor Luwu',
    badge: 'BPJS Kes',
    estTime: '15 Menit',
  },
  {
    agencyKeyword: 'polres',
    serviceName: 'Perpanjangan SIM & Penerbitan SKCK',
    agencyName: 'Kepolisian Resor (Polres) Luwu',
    badge: 'Polres Luwu',
    estTime: '20 Menit',
  },
  {
    agencyKeyword: 'dpmptsp',
    serviceName: 'Penerbitan Nomor Induk Berusaha (NIB) OSS',
    agencyName: 'Dinas Penanaman Modal & PTSP Luwu',
    badge: 'DPMPTSP',
    estTime: '15 Menit',
  },
];

interface MppAirportKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'citizen' | 'investor';
}

export const MppAirportKioskModal: React.FC<MppAirportKioskModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'citizen'
}) => {
  // Step state: 
  // 1 = Welcome & Mode Selector
  // 2 = Security Identification & 4-Digit WhatsApp OTP
  // 3 = Service Catalog Selection
  // 4 = Digital Boarding Pass Ticket
  const [step, setStep] = useState<number>(1);
  const [userMode, setUserMode] = useState<'citizen' | 'investor'>(initialMode);
  const [lang, setLang] = useState<KioskLang>('id');
  const [theme, setTheme] = useState<KioskTheme>('dark');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAccessibleMode, setIsAccessibleMode] = useState<boolean>(false);
  const [isAssistanceAlerting, setIsAssistanceAlerting] = useState<boolean>(false);

  // Sub-modal dialogs
  const [isFidsOpen, setIsFidsOpen] = useState(false);
  const [boardingPassTab, setBoardingPassTab] = useState<'digital' | 'thermal'>('digital');

  const t = KIOSK_I18N[lang];

  // Inactivity countdown (90s timer for kiosk security)
  const [inactivityTimer, setInactivityTimer] = useState<number>(90);
  const timerRef = useRef<any>(null);

  // Data states
  const [tenants, setTenants] = useState<MPPTenant[]>([]);
  const [services, setServices] = useState<MPPService[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<MPPTenant | null>(null);
  const [selectedService, setSelectedService] = useState<MPPService | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeCitizenTickets, setActiveCitizenTickets] = useState<any[]>([]);

  // NIK & Security OTP states
  const [nik, setNik] = useState('');
  const nikInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingNik, setIsSubmittingNik] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [maskedName, setMaskedName] = useState('');
  const [demoOtpPreview, setDemoOtpPreview] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [verifiedCitizen, setVerifiedCitizen] = useState<Partial<MPPCitizen> | null>(null);

  // Real-time lookup states for Layanan Mandiri
  const [detectedCitizen, setDetectedCitizen] = useState<{ full_name: string; phone_number: string } | null>(null);
  const [isSearchingCitizen, setIsSearchingCitizen] = useState(false);

  // First time citizen registration if NIK not yet found
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [firstTimeData, setFirstTimeData] = useState({
    full_name: '',
    phone_number: '',
    gender: 'Laki-laki',
    occupation: 'Wiraswasta / Pelaku Usaha'
  });

  // Investor specific fields (if mode === 'investor')
  const [investorIdentifier, setInvestorIdentifier] = useState('');
  const [detectedInvestor, setDetectedInvestor] = useState<any>(null);
  const [isSearchingInvestor, setIsSearchingInvestor] = useState(false);
  const [investorOtpKey, setInvestorOtpKey] = useState<string | null>(null);
  const [investorData, setInvestorData] = useState({
    company_name: '',
    npwp: '',
    investment_sector: 'Pertanian & Perkebunan',
    investment_scale: 'Menengah (Rp 5 Miliar - Rp 10 Miliar)'
  });

  // Ticket Result
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  const playBeep = (type: 'beep' | 'success' | 'alert' = 'beep') => {
    if (!soundEnabled) return;
    if (type === 'beep') KioskAudioEngine.playKeyBeep();
    else if (type === 'success') KioskAudioEngine.playSuccessSound();
    else if (type === 'alert') KioskAudioEngine.playAlertSound();
  };

  // Reset inactivity timer on user interaction
  const resetInactivity = () => {
    setInactivityTimer(90);
  };

  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Inactivity countdown effect
  useEffect(() => {
    if (!isOpen) return;
    timerRef.current = setInterval(() => {
      setInactivityTimer((prev) => {
        if (prev <= 1) {
          handleResetKiosk();
          return 90;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isOpen, step]);

  // Cooldown countdown
  useEffect(() => {
    if (otpCooldown > 0) {
      const cdInterval = setInterval(() => {
        setOtpCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(cdInterval);
    }
  }, [otpCooldown]);

  // Real-time lookup for NIK on the self-service kiosk
  useEffect(() => {
    if (nik.length === 16) {
      const lookupNik = async () => {
        setIsSearchingCitizen(true);
        setOtpError(null);
        setDetectedCitizen(null);
        try {
          const { data: citizenData, error } = await supabase
            .from('mpp_citizens')
            .select('*')
            .eq('nik', nik)
            .maybeSingle();

          if (error) throw error;

          if (citizenData) {
            setDetectedCitizen({
              full_name: citizenData.full_name,
              phone_number: citizenData.phone_number
            });
            setOtpError(null);
          } else {
            setDetectedCitizen(null);
            setOtpError(KIOSK_I18N[lang]?.not_registered_warning || 'Anda belum terdaftar, silakan lakukan registrasi pada ambil nomor antrian online.');
            playBeep('alert');
          }
        } catch (err) {
          console.error('Error looking up NIK on kiosk:', err);
        } finally {
          setIsSearchingCitizen(false);
        }
      };
      lookupNik();
    } else {
      setDetectedCitizen(null);
      if (nik.length > 0 && nik.length < 16) {
        setOtpError(null);
      }
    }
  }, [nik, lang]);

  // Real-time lookup for registered investor
  useEffect(() => {
    if (userMode === 'investor' && investorIdentifier.trim().length >= 8) {
      const timer = setTimeout(async () => {
        setIsSearchingInvestor(true);
        setOtpError(null);
        try {
          const res = await fetch('/api/kiosk/investor/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: investorIdentifier.trim() })
          });
          const data = await res.json();
          if (data.registered && data.investor) {
            setDetectedInvestor(data.investor);
            setOtpError(null);
          } else {
            setDetectedInvestor(null);
            if (investorIdentifier.trim().length >= 10) {
              setOtpError(data.message || 'Nomor WhatsApp atau identitas belum terdaftar sebagai Investor resmi.');
            }
          }
        } catch (err: any) {
          console.error('Investor lookup error:', err);
        } finally {
          setIsSearchingInvestor(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    } else if (userMode === 'investor' && investorIdentifier.trim().length < 8) {
      setDetectedInvestor(null);
    }
  }, [investorIdentifier, userMode]);

  // Fetch Tenants & Services on open
  useEffect(() => {
    if (isOpen) {
      fetchTenants();
      resetInactivity();
    }
  }, [isOpen]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('mpp_tenants')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (data && !error) {
        setTenants(data);
      }
    } catch (e) {
      console.error('Error fetching tenants:', e);
    }
  };

  const fetchServices = async (tenantId: string) => {
    try {
      const currentTenant = tenants.find(t => t.id === tenantId) || selectedTenant;
      const tenantName = currentTenant?.name || (currentTenant as any)?.agency_name || '';

      const { data, error } = await supabase
        .from('mpp_services')
        .select('*')
        .eq('tenant_id', tenantId);

      if (data && !error && data.length > 0) {
        // Validate if database services don't contain mismatched cross-agency fallback rows
        const isMismatched = data.some(s => {
          const sName = (s.service_name || s.name || '').toLowerCase();
          const tName = tenantName.toLowerCase();
          if (tName.includes('dpmptsp') && (sName.includes('sertifikat hak milik') || sName.includes('pertanahan'))) return true;
          if (tName.includes('disdukcapil') && sName.includes('sertifikat hak milik')) return true;
          if (tName.includes('bpjs') && sName.includes('sertifikat hak milik')) return true;
          if (tName.includes('bank') && sName.includes('sertifikat hak milik')) return true;
          return false;
        });

        if (!isMismatched) {
          const normalized = data.map((s: any) => ({
            ...s,
            name: s.service_name || s.name || 'Pelayanan',
            service_name: s.service_name || s.name || 'Pelayanan',
            estimated_time_minutes: s.estimated_time_minutes || 15
          }));
          setServices(normalized);
          return;
        }
      }

      // Generate precise services for the exact selected agency
      const precise = getPreciseServicesForAgency(tenantName || tenantId, tenantId, lang);
      setServices(precise as MPPService[]);
    } catch (e) {
      console.error('Error fetching services:', e);
      const currentTenant = tenants.find(t => t.id === tenantId) || selectedTenant;
      const tenantName = currentTenant?.name || (currentTenant as any)?.agency_name || '';
      const precise = getPreciseServicesForAgency(tenantName || tenantId, tenantId, lang);
      setServices(precise as MPPService[]);
    }
  };

  const handleResetKiosk = () => {
    setStep(1);
    setUserMode(initialMode);
    setNik('');
    setIsOtpSent(false);
    setOtpCode('');
    setOtpError(null);
    setDemoOtpPreview(null);
    setSessionToken(null);
    setVerifiedCitizen(null);
    setIsFirstTimeUser(false);
    setDetectedCitizen(null);
    setIsSearchingCitizen(false);
    setSelectedTenant(null);
    setSelectedService(null);
    setSelectedCategory('all');
    setActiveCitizenTickets([]);
    setTicketResult(null);
    setPrintSuccess(false);
    setInactivityTimer(90);
    setIsAssistanceAlerting(false);
  };

  // Fetch active citizen tickets (for verified citizen)
  const fetchCitizenActiveTickets = async (citizenNik: string) => {
    if (!citizenNik) return;
    try {
      const { data, error } = await supabase
        .from('mpp_queues')
        .select('*, tenant:mpp_tenants(name, code, floor), service:mpp_services(service_name, name, estimated_time_minutes)')
        .eq('citizen_nik', citizenNik)
        .in('status', ['menunggu', 'dipanggil', 'dilayani'])
        .order('created_at', { ascending: false });

      if (data && !error) {
        setActiveCitizenTickets(data);
      }
    } catch (err) {
      console.error('Error fetching citizen active tickets:', err);
    }
  };

  const handleSelectShortcut = (shortcut: typeof POPULAR_SERVICES_SHORTCUTS[0]) => {
    resetInactivity();
    playBeep('beep');
    const targetTenant = tenants.find(t => 
      t.name.toLowerCase().includes(shortcut.agencyKeyword.toLowerCase()) ||
      (t.code && t.code.toLowerCase().includes(shortcut.agencyKeyword.toLowerCase()))
    );
    if (targetTenant) {
      handleSelectTenant(targetTenant);
    }
  };

  // Virtual numpad key press
  const handleNumpadPress = (char: string) => {
    resetInactivity();
    playBeep('beep');
    if (step === 2 && !isOtpSent) {
      if (userMode === 'investor') {
        if (char === 'backspace') {
          setInvestorIdentifier(prev => prev.slice(0, -1));
        } else if (char === 'clear') {
          setInvestorIdentifier('');
        } else if (/^\d$/.test(char)) {
          setInvestorIdentifier(prev => prev + char);
        }
      } else {
        if (char === 'backspace') {
          setNik(prev => prev.slice(0, -1));
        } else if (char === 'clear') {
          setNik('');
        } else if (nik.length < 16 && /^\d$/.test(char)) {
          setNik(prev => prev + char);
        }
      }
    } else if (step === 2 && isOtpSent) {
      if (char === 'backspace') {
        setOtpCode(prev => prev.slice(0, -1));
      } else if (char === 'clear') {
        setOtpCode('');
      } else if (otpCode.length < 4 && /^\d$/.test(char)) {
        const nextCode = otpCode + char;
        setOtpCode(nextCode);
        if (nextCode.length === 4) {
          if (userMode === 'investor') {
            handleVerifyInvestorOtp(nextCode);
          } else {
            handleVerifyOtp(nextCode);
          }
        }
      }
    }
  };

  // Send OTP (Citizen Mode)
  const handleSendOtp = async () => {
    resetInactivity();
    if (nik.length !== 16) {
      setOtpError('NIK harus tepat 16 digit angka.');
      playBeep('alert');
      return;
    }

    setIsSubmittingNik(true);
    setOtpError(null);

    // If citizen is already detected in DB
    if (detectedCitizen) {
      try {
        const res = await fetch('/api/kiosk/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nik })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Gagal memeriksa NIK.');
        }

        if (!data.registered) {
          setOtpError(KIOSK_I18N[lang]?.not_registered_warning || 'Anda belum terdaftar, silakan lengkapi nama & nomor WhatsApp di bawah.');
          playBeep('alert');
        } else {
          setIsOtpSent(true);
          setMaskedPhone(data.maskedPhone);
          setMaskedName(data.maskedName);
          setOtpCooldown(data.cooldownSeconds || 45);
          if (data.devOtp) setDemoOtpPreview(data.devOtp);
          playBeep('success');
        }
      } catch (err: any) {
        setOtpError(err?.message || 'Terjadi gangguan pengiriman OTP. Silakan coba lagi.');
        playBeep('alert');
      } finally {
        setIsSubmittingNik(false);
      }
    } else {
      // First time / un-registered citizen quick kiosk registration
      const fullName = firstTimeData.full_name.trim() || 'Pemohon Layanan Mandiri';
      const rawPhone = firstTimeData.phone_number.trim();

      if (rawPhone.length < 10) {
        setOtpError('Masukkan Nomor WhatsApp aktif (minimal 10 digit) untuk menerima kode OTP verifikasi.');
        setIsSubmittingNik(false);
        playBeep('alert');
        return;
      }

      try {
        setIsFirstTimeUser(true);
        const res = await fetch('/api/kiosk/send-otp-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nik,
            phone: rawPhone,
            full_name: fullName
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Gagal mengirim kode OTP registrasi.');
        }

        setIsOtpSent(true);
        setMaskedPhone(data.maskedPhone || rawPhone);
        setMaskedName(data.maskedName || fullName);
        setOtpCooldown(data.cooldownSeconds || 45);
        if (data.devOtp) setDemoOtpPreview(data.devOtp);
        playBeep('success');
      } catch (err: any) {
        setOtpError(err?.message || 'Terjadi gangguan pengiriman OTP registrasi.');
        playBeep('alert');
      } finally {
        setIsSubmittingNik(false);
      }
    }
  };

  // Send OTP (Investor Mode - Strict Verification against registered landing page accounts)
  const handleSendInvestorOtp = async () => {
    resetInactivity();
    if (!investorIdentifier || investorIdentifier.trim().length < 8) {
      setOtpError('Masukkan Nomor WhatsApp aktif atau NIB (minimal 8 karakter).');
      playBeep('alert');
      return;
    }

    setIsSubmittingNik(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/kiosk/investor/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: investorIdentifier.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirimkan kode OTP investor.');
      }

      setIsOtpSent(true);
      setInvestorOtpKey(data.storeKey);
      setMaskedPhone(data.maskedPhone);
      setMaskedName(data.maskedName);
      setOtpCooldown(data.cooldownSeconds || 45);
      if (data.devOtp) setDemoOtpPreview(data.devOtp);
      if (data.investor) {
        setDetectedInvestor(data.investor);
      }
      playBeep('success');
    } catch (err: any) {
      setOtpError(err?.message || 'Gagal mengirimkan kode OTP ke WhatsApp Investor.');
      playBeep('alert');
    } finally {
      setIsSubmittingNik(false);
    }
  };

  // Verify OTP (Investor Mode)
  const handleVerifyInvestorOtp = async (codeToVerify?: string) => {
    resetInactivity();
    const code = codeToVerify || otpCode;
    if (code.length !== 4) {
      setOtpError('Masukkan 4 digit kode OTP yang diterima via WhatsApp.');
      playBeep('alert');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/kiosk/investor/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeKey: investorOtpKey,
          identifier: investorIdentifier.trim(),
          otp: code
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Kode OTP investor tidak valid.');
      }

      setSessionToken(data.sessionToken);
      setVerifiedCitizen({
        full_name: data.investor.full_name,
        phone_number: data.investor.no_whatsapp || data.investor.phone,
        company_name: data.investor.company_name,
        nib: data.investor.nib
      });
      setInvestorData({
        company_name: data.investor.company_name || 'Badan Usaha / Investor',
        npwp: data.investor.nib || '',
        investment_sector: data.investor.status_modal || 'PMDN',
        investment_scale: data.investor.nib || ''
      });
      playBeep('success');
      setStep(3);
      fetchCitizenActiveTickets(data.investor.nib || data.investor.no_whatsapp || 'INVESTOR');
    } catch (err: any) {
      setOtpError(err?.message || 'Verifikasi gagal. Pastikan kode 4 digit OTP sudah benar.');
      playBeep('alert');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Verify OTP (Citizen Mode)
  const handleVerifyOtp = async (codeToVerify?: string) => {
    resetInactivity();
    const code = codeToVerify || otpCode;
    if (code.length !== 4) {
      setOtpError('Masukkan 4 digit kode OTP yang diterima via WhatsApp.');
      playBeep('alert');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/kiosk/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik,
          otp: code,
          citizenData: isFirstTimeUser ? firstTimeData : undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Kode OTP tidak valid.');
      }

      setSessionToken(data.sessionToken);
      setVerifiedCitizen(data.citizen);
      playBeep('success');
      setStep(3);
      fetchCitizenActiveTickets(nik);
    } catch (err: any) {
      setOtpError(err?.message || 'Verifikasi gagal. Pastikan kode 4 digit sudah benar.');
      playBeep('alert');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Select Tenant & Load Services
  const handleSelectTenant = (tenant: MPPTenant) => {
    resetInactivity();
    playBeep('beep');
    setSelectedTenant(tenant);
    setSelectedService(null);
    setTicketError(null);
    fetchServices(tenant.id);
  };

  // Submit Ticket Request & Dashboard Redirection
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [submittingServiceId, setSubmittingServiceId] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const handleRedirectToMasyarakatDashboard = (targetTab: 'pkkpr' | 'survey_skm' | 'pengaduan') => {
    playBeep('beep');
    const citizenNik = (nik || verifiedCitizen?.nik || '').trim();
    const citizenName = verifiedCitizen?.full_name || (userMode === 'investor' ? investorData.company_name : 'Pemohon Layanan Mandiri');
    const citizenPhone = verifiedCitizen?.phone_number || '';
    const companyName = investorData.company_name || verifiedCitizen?.company_name || '';
    const nibValue = investorData.npwp || verifiedCitizen?.nib || '';

    if (typeof window !== 'undefined') {
      const isInv = userMode === 'investor';
      localStorage.setItem('luwu_user_role', isInv ? 'investor' : 'masyarakat');
      if (citizenNik) {
        localStorage.setItem('luwu_user_nik', citizenNik);
        localStorage.setItem(`mpp_verified_otp_${citizenNik}`, 'true');
        if (citizenPhone) {
          localStorage.setItem(`mpp_verified_otp_phone_${citizenNik}`, citizenPhone);
        }
        localStorage.setItem(`mpp_citizen_name_${citizenNik}`, citizenName);
      }
      localStorage.setItem('luwu_user_name', isInv && companyName ? companyName : citizenName);
      if (isInv && companyName) {
        localStorage.setItem('luwu_user_company', companyName);
      }
      if (isInv && nibValue) {
        localStorage.setItem('luwu_user_nib', nibValue);
      }
      if (citizenPhone) {
        localStorage.setItem('luwu_user_phone', citizenPhone);
      }
      localStorage.setItem('luwu_citizen_data', JSON.stringify({
        nik: citizenNik,
        full_name: citizenName,
        phone_number: citizenPhone,
        company_name: companyName,
        nib: nibValue,
        gender: verifiedCitizen?.gender || 'Laki-laki',
        occupation: isInv ? 'Investor / Pelaku Usaha' : (verifiedCitizen?.occupation || 'Masyarakat Luwu'),
        address: verifiedCitizen?.address || ''
      }));

      if (targetTab === 'pkkpr') {
        localStorage.setItem('luwu_open_pkkpr_modal', 'true');
      }

      sessionStorage.removeItem('luwu_cached_profile_data');
    }

    if (onClose) onClose();
    window.location.href = `/masyarakat-dashboard?tab=${targetTab}${targetTab === 'pkkpr' ? '&open_pkkpr=true' : ''}`;
  };

  const handleSubmitTicket = async (srv: MPPService) => {
    resetInactivity();
    playBeep('beep');
    setSelectedService(srv);
    setIsSubmittingTicket(true);
    setSubmittingServiceId(srv.id);
    setTicketError(null);

    try {
      const res = await fetch('/api/kiosk/submit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: selectedTenant?.id,
          service_id: srv.id,
          service_name: srv.name || srv.service_name,
          citizen_nik: nik,
          citizen_name: citizenFullName,
          phone: verifiedCitizen?.phone_number || '',
          session_token: sessionToken
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menerbitkan tiket antrean.');
      }

      setTicketResult(data);
      playBeep('success');
      setStep(4);

      // Trigger automatic airport announcement chime + voice
      if (soundEnabled) {
        const queueCode = `${data.tenant?.code || 'A'}-${data.ticket.queue_number.toString().padStart(3, '0')}`;
        KioskAudioEngine.announceTicket(queueCode, data.tenant?.name || 'Pelayanan MPP', lang);
      }
    } catch (err: any) {
      setTicketError(err?.message || 'Terjadi kendala saat menerbitkan nomor antrean.');
      playBeep('alert');
    } finally {
      setIsSubmittingTicket(false);
      setSubmittingServiceId(null);
    }
  };

  // Simulate Print Ticket
  const handlePrintTicket = () => {
    resetInactivity();
    playBeep('success');
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      setPrintSuccess(true);
    }, 1800);
  };

  // Trigger assistance call for seniors / disabilities
  const handleTriggerAssistance = () => {
    KioskAudioEngine.playAssistanceAlarm();
    setIsAssistanceAlerting(true);
    setTimeout(() => {
      setIsAssistanceAlerting(false);
    }, 8000);
  };

  const filteredTenants = tenants.filter(tItem => {
    if (selectedCategory !== 'all') {
      const cat = getTenantCategory(tItem.name);
      if (cat !== selectedCategory) return false;
    }
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const matchTenant = (tItem.name || '').toLowerCase().includes(q) || 
                        (tItem.code || '').toLowerCase().includes(q) || 
                        (tItem.floor || '').toLowerCase().includes(q);
    return matchTenant;
  });

  const citizenFullName = verifiedCitizen?.full_name || 'Pemohon Layanan Mandiri';
  const citizenInitials = citizenFullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || 'W';
  const maskedNik = nik ? `${nik.slice(0, 4)}••••${nik.slice(-4)}` : '7317••••0001';

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 h-[100dvh] w-full z-[9999] flex flex-col select-none font-sans overflow-hidden overscroll-none transition-colors duration-300 ${
        isAccessibleMode ? 'text-lg' : ''
      } ${
        theme === 'dark' 
          ? 'dark bg-[#060D1A] text-white' 
          : 'bg-slate-100 text-slate-900'
      }`}
      onClick={resetInactivity}
      onTouchStart={resetInactivity}
    >
      {/* BACKGROUND AMBIENT GLOW */}
      <div className={`absolute top-0 left-1/4 w-[600px] h-[350px] blur-[130px] pointer-events-none rounded-full transition-opacity ${
        theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-500/10'
      }`} />
      <div className={`absolute bottom-0 right-1/4 w-[600px] h-[350px] blur-[130px] pointer-events-none rounded-full transition-opacity ${
        theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-500/10'
      }`} />

      {/* TOP AIRPORT KIOSK HEADER */}
      <header className={`h-16 sm:h-20 border-b backdrop-blur-xl px-3 sm:px-8 flex items-center justify-between shrink-0 z-20 transition-colors ${
        theme === 'dark'
          ? 'border-white/10 bg-slate-950/90 text-white'
          : 'border-slate-300 bg-white/95 text-slate-900 shadow-sm'
      }`}>
        {/* Brand & Kiosk Station with Official Luwu Logo */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 shadow-lg backdrop-blur-md border flex items-center justify-center shrink-0 ${
            theme === 'dark'
              ? 'bg-gradient-to-tr from-amber-500/30 via-emerald-500/20 to-teal-400/30 border-white/10 shadow-black/40'
              : 'bg-gradient-to-tr from-amber-500/20 via-emerald-500/15 to-teal-400/20 border-slate-300 shadow-slate-200'
          }`}>
            <img 
              src={LUWU_LOGO_BASE64} 
              alt="Lambang Daerah Kabupaten Luwu" 
              className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" 
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                {t.kiosk_title}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`hidden sm:inline text-[10px] font-mono ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>GATE-01</span>
            </div>
            <h1 className={`text-xs sm:text-base md:text-lg font-black tracking-tight leading-tight truncate ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <span>MPP SIMPURUSIANG</span>{' '}
              <span className={theme === 'dark' ? 'text-amber-400 font-bold' : 'text-amber-700 font-bold'}>
                KAB. LUWU
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Live Airport Clock & FIDS Quick Link */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            type="button"
            onClick={() => { playBeep('beep'); setIsFidsOpen(true); }}
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-400 text-amber-900 shadow-sm'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-500" />
            <span>{t.fids_board_btn}</span>
          </button>

          <div className={`flex flex-col items-center justify-center px-4 py-1.5 border rounded-xl ${
            theme === 'dark' 
               ? 'bg-slate-900/90 border-white/10 text-white' 
              : 'bg-slate-50 border-slate-300 text-slate-800'
          }`}>
            <div className={`flex items-center gap-1 text-[10px] uppercase tracking-widest font-mono ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Clock className={`w-3 h-3 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>WITA</span>
            </div>
            <div className={`text-sm font-black font-mono tracking-wider ${
              theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'
            }`}>
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Right Controls: Accessibility Mode, Inactivity Timer, Sound, Theme Switcher, Lang & Exit */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Accessibility Toggle (Disability & Senior Support) */}
          <button
            type="button"
            onClick={() => {
              playBeep('beep');
              setIsAccessibleMode(!isAccessibleMode);
            }}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isAccessibleMode
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                : theme === 'dark'
                  ? 'bg-slate-900 border-white/10 hover:border-blue-400/50 text-slate-300 hover:text-blue-300'
                  : 'bg-slate-100 border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-700'
            }`}
            title={t.accessibility_mode}
          >
            <Accessibility className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Inactivity Security Badge */}
          <div className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-mono transition-colors ${
            inactivityTimer < 20 
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-bounce' 
              : theme === 'dark' 
                ? 'bg-slate-900 border-white/10 text-slate-300' 
                : 'bg-slate-100 border-slate-300 text-slate-700'
          }`}>
            <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-emerald-500" />
            <span className="hidden md:inline">{t.auto_reset}: </span><strong>{inactivityTimer}s</strong>
          </div>

          {/* Theme Toggle (Sun / Moon) */}
          <button 
            type="button"
            onClick={() => {
              playBeep('beep');
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 border-white/10 hover:border-amber-400/50 text-amber-300 hover:text-amber-200'
                : 'bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900'
            }`}
            title={theme === 'dark' ? `${t.theme_label} (Light)` : `${t.theme_label} (Dark)`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />}
          </button>

          {/* Sound Toggle (desktop only) */}
          <button 
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) KioskAudioEngine.playAirportChime();
            }}
            className={`hidden sm:flex w-10 h-10 rounded-xl border items-center justify-center transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900'
            }`}
            title={t.sound_label}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-500" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Multilingual Toggle: 3 buttons on tablet/desktop, compact 1-tap pill on mobile */}
          <div className={`hidden sm:flex items-center border rounded-xl p-0.5 sm:p-1 text-[10px] sm:text-xs font-bold ${
            theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-slate-100 border-slate-300'
          }`}>
            {(['id', 'en', 'zh'] as KioskLang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => { setLang(l); playBeep('beep'); }}
                className={`px-1.5 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer uppercase ${
                  lang === l 
                    ? 'bg-emerald-600 text-white shadow font-black' 
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const nextLang: KioskLang = lang === 'id' ? 'en' : lang === 'en' ? 'zh' : 'id';
              setLang(nextLang);
              playBeep('beep');
            }}
            className={`sm:hidden h-8 px-2 rounded-xl border text-[11px] font-mono font-black uppercase flex items-center justify-center transition-all cursor-pointer ${
              theme === 'dark' ? 'bg-slate-900 border-white/10 text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-700'
            }`}
            title="Ganti Bahasa (ID / EN / ZH)"
          >
            {lang.toUpperCase()}
          </button>

          {/* Close Kiosk Modal Button */}
          <button 
            type="button"
            onClick={() => { playBeep('alert'); onClose(); }}
            className="h-8 sm:h-10 px-2 sm:px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">{t.exit}</span>
          </button>
        </div>
      </header>

      {/* ASSISTANCE ALERT BANNER (IF CALLING STAFF) */}
      {isAssistanceAlerting && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold shadow-lg animate-in slide-in-from-top duration-300 shrink-0 z-30">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 animate-bounce text-amber-300" />
            <span>{t.assisted_calling}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono uppercase">{t.assisted_confirmed}</span>
        </div>
      )}

      {/* KIOSK MAIN SCREEN AREA */}
      <main className="flex-1 overflow-y-auto max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)] p-4 sm:p-6 md:p-8 custom-scrollbar flex flex-col justify-start md:justify-center items-center z-10 relative">

        {/* ========================================================= */}
        {/* STEP 1: WELCOME & PERSONA SELECTOR (CHEVRON AIRPORT GATES) */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-4 sm:mb-8">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-2 sm:mb-3 ${
                theme === 'dark'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                <Sparkles className="w-3.5 h-3.5" /> {t.step1_badge}
              </span>
              <h2 className={`text-xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {t.step1_welcome} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">{t.step1_self_service}</span>
              </h2>
              <p className={`text-xs sm:text-base mt-1.5 max-w-xl mx-auto px-2 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {t.step1_desc}
              </p>
            </div>

            {/* TWO MAIN AIRPORT GATES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full px-2 sm:px-0">
              {/* GATE 1: WARGA / MASYARAKAT */}
              <button
                type="button"
                onClick={() => {
                  playBeep('success');
                  setUserMode('citizen');
                  setStep(2);
                }}
                className={`group p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border-2 active:scale-98 transition-all duration-300 shadow-2xl flex flex-col justify-between text-left relative overflow-hidden cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900/80 hover:bg-slate-800/90 border-white/10 hover:border-emerald-500/80 hover:shadow-emerald-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-500 shadow-slate-200/80 hover:shadow-emerald-500/10'
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-36 sm:h-36 bg-emerald-500/10 rounded-bl-[80px] pointer-events-none group-hover:scale-110 transition-transform" />
                <div>
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform ${
                    theme === 'dark'
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  }`}>
                    <User className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    {t.gate1_badge}
                  </span>
                  <h3 className={`text-lg sm:text-2xl md:text-3xl font-black mt-1 group-hover:text-emerald-600 transition-colors ${
                    theme === 'dark' ? 'text-white group-hover:text-emerald-300' : 'text-slate-900'
                  }`}>
                    {t.gate1_title}
                  </h3>
                  <p className={`text-[11px] sm:text-sm mt-1.5 sm:mt-2 leading-relaxed ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {t.gate1_desc}
                  </p>
                </div>
                <div className={`mt-5 sm:mt-8 pt-4 sm:pt-6 border-t flex items-center justify-between font-bold text-xs sm:text-sm ${
                  theme === 'dark'
                    ? 'border-white/10 text-emerald-400'
                    : 'border-slate-200 text-emerald-700'
                }`}>
                  <span>{t.gate1_btn}</span>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:translate-x-2 transition-transform ${
                    theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </button>

              {/* GATE 2: INVESTOR & PELAKU USAHA */}
              <button
                type="button"
                onClick={() => {
                  playBeep('success');
                  setUserMode('investor');
                  setStep(2);
                }}
                className={`group p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border-2 active:scale-98 transition-all duration-300 shadow-2xl flex flex-col justify-between text-left relative overflow-hidden cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900/80 hover:bg-slate-800/90 border-white/10 hover:border-amber-500/80 hover:shadow-amber-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-500 shadow-slate-200/80 hover:shadow-amber-500/10'
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-36 sm:h-36 bg-amber-500/10 rounded-bl-[80px] pointer-events-none group-hover:scale-110 transition-transform" />
                <div>
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform ${
                    theme === 'dark'
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                      : 'bg-amber-50 border-amber-300 text-amber-700'
                  }`}>
                    <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest ${
                    theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                  }`}>
                    {t.gate2_badge}
                  </span>
                  <h3 className={`text-lg sm:text-2xl md:text-3xl font-black mt-1 transition-colors ${
                    theme === 'dark' ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-700'
                  }`}>
                    {t.gate2_title}
                  </h3>
                  <p className={`text-[11px] sm:text-sm mt-1.5 sm:mt-2 leading-relaxed ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {t.gate2_desc}
                  </p>
                </div>
                <div className={`mt-5 sm:mt-8 pt-4 sm:pt-6 border-t flex items-center justify-between font-bold text-xs sm:text-sm ${
                  theme === 'dark'
                    ? 'border-white/10 text-amber-400'
                    : 'border-slate-200 text-amber-700'
                }`}>
                  <span>{t.gate2_btn}</span>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:translate-x-2 transition-transform ${
                    theme === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </button>
            </div>

            {/* QUICK UTILITY FOOTER */}
            <div className={`mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <span className={`font-mono text-[10px] sm:text-xs ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>{t.util_label}</span>

              {/* FIDS Departure Board Button */}
              <button 
                type="button" 
                onClick={() => { playBeep('beep'); setIsFidsOpen(true); }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer text-[11px] sm:text-xs font-bold ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-amber-500/30 hover:border-amber-500 text-amber-300 hover:text-amber-200'
                    : 'bg-white border-amber-300 hover:border-amber-600 text-amber-900 shadow-sm'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.fids_btn}</span>
              </button>

              {/* Assistance Desk Button */}
              <button 
                type="button" 
                onClick={handleTriggerAssistance}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer text-[11px] sm:text-xs font-bold ${
                  theme === 'dark'
                    ? 'bg-blue-950/40 border-blue-500/30 hover:border-blue-400 text-blue-300 hover:text-white'
                    : 'bg-blue-50 border-blue-300 hover:border-blue-500 text-blue-800 shadow-sm'
                }`}
              >
                <BellRing className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.assisted_desk}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: SECURITY IDENTIFICATION & 4-DIGIT WHATSAPP OTP    */}
        {/* ========================================================= */}
        {step === 2 && (
          <div className="w-full max-w-5xl max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col items-center pb-6 animate-in fade-in duration-300">
            {/* Nav Back Header */}
            <div className="w-full flex items-center justify-between mb-4 sm:mb-6">
              <button
                type="button"
                onClick={() => { playBeep('beep'); handleResetKiosk(); }}
                className={`flex items-center gap-1.5 sm:gap-2 text-xs font-bold uppercase tracking-wider px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  theme === 'dark'
                    ? 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-300 shadow-sm'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.back_to_lanes}
              </button>

              <div className="flex items-center gap-2">
                <div className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold font-mono ${
                  theme === 'dark'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> {t.pdp_badge}
                </div>
              </div>
            </div>

            {/* TWO COLUMN WORKSPACE: LEFT = INPUT & FLOW, RIGHT = AIRPORT TOUCHPAD KEYPAD */}
            <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-4 sm:gap-6">
              {/* LEFT COLUMN: NIK / INVESTOR DISPLAY & OTP CONFIRMATION */}
              <div className={`flex-1 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border shadow-2xl flex flex-col justify-between transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900/90 border-white/10'
                  : 'bg-white border-slate-200 shadow-slate-200'
              }`}>
                {!isOtpSent ? (
                  <div>
                    {userMode === 'investor' ? (
                      /* INVESTOR MODE STEP 2 */
                      <div>
                        <div className="mb-4 sm:mb-5">
                          <span className={`text-[11px] font-bold uppercase tracking-widest font-mono flex items-center gap-1.5 ${
                            theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                          }`}>
                            <Sparkles className="w-3.5 h-3.5" /> JALUR INVESTOR TERDAFTAR (VIP)
                          </span>
                          <h3 className={`text-xl sm:text-2xl md:text-3xl font-black mt-0.5 tracking-tight ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>
                            Identifikasi Akun Investor
                          </h3>
                          <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            Masukkan Nomor WhatsApp resmi atau NIB perusahaan yang telah didaftarkan pada Portal Registrasi Investor Pemkab Luwu.
                          </p>
                        </div>

                        {/* INVESTOR IDENTIFIER INPUT BOX */}
                        <div className="mb-4 sm:mb-6">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={`text-xs font-mono uppercase font-bold tracking-wider ${
                              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              Nomor WhatsApp / NIB Investor
                            </label>
                            <span className={`text-xs font-mono font-bold ${
                              detectedInvestor ? 'text-emerald-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {investorIdentifier.length} Karakter
                            </span>
                          </div>

                          <div 
                            onClick={() => {
                              if (nikInputRef.current) {
                                nikInputRef.current.focus();
                              }
                            }}
                            className={`relative p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-text lg:cursor-default ${
                              detectedInvestor 
                                ? theme === 'dark' 
                                  ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' 
                                  : 'border-amber-600 bg-amber-50 shadow-md'
                                : theme === 'dark' 
                                  ? 'border-white/15 bg-slate-950/80 focus-within:border-amber-500/80' 
                                  : 'border-slate-300 bg-slate-50 focus-within:border-amber-600 shadow-inner'
                            }`}
                          >
                            <input 
                              ref={nikInputRef}
                              type="text"
                              value={investorIdentifier}
                              onChange={(e) => {
                                setInvestorIdentifier(e.target.value);
                                playBeep('beep');
                              }}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 lg:pointer-events-none"
                              aria-label="Input Nomor WhatsApp atau NIB Investor"
                            />

                            <div className="font-mono text-base sm:text-xl md:text-2xl font-black tracking-wider flex items-center gap-1">
                              {investorIdentifier ? (
                                <span className={detectedInvestor ? (theme === 'dark' ? 'text-amber-400 font-mono' : 'text-amber-800 font-mono') : (theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                                  {investorIdentifier}
                                </span>
                              ) : (
                                <span className={`text-xs sm:text-base font-sans font-normal ${
                                  theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                  Ketik Nomor WA (cth: 08123456789) atau NIB...
                                </span>
                              )}
                            </div>

                            {detectedInvestor ? (
                              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                            ) : isSearchingInvestor ? (
                              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-amber-500 shrink-0" />
                            ) : null}
                          </div>
                        </div>

                        {/* Real-time DB lookup status */}
                        {isSearchingInvestor && (
                          <div className={`p-4 rounded-2xl border mb-4 flex items-center justify-center gap-2.5 text-xs animate-pulse ${
                            theme === 'dark' ? 'bg-slate-800/40 border-amber-500/30 text-amber-400' : 'bg-slate-100 border-amber-300 text-amber-800'
                          }`}>
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                            <span>Memeriksa database pendaftaran Investor resmi...</span>
                          </div>
                        )}

                        {detectedInvestor && (
                          <div className={`p-4 sm:p-5 rounded-2xl border mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            theme === 'dark'
                              ? 'bg-amber-500/10 border-amber-500/30 text-white'
                              : 'bg-amber-50 border-amber-200 text-slate-900'
                          }`}>
                            <div className={`flex items-center gap-2 font-bold text-xs uppercase mb-3 ${
                              theme === 'dark' ? 'text-amber-400' : 'text-amber-800'
                            }`}>
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              <span>Profil Investor Terdaftar & Terverifikasi</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                              <div>
                                <span className="text-slate-400 block font-medium mb-0.5">Nama Perusahaan / Entitas</span>
                                <strong className="text-sm font-bold tracking-tight text-amber-500">{detectedInvestor.company_name}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium mb-0.5">Penanggung Jawab</span>
                                <strong className="text-sm font-bold tracking-tight">{detectedInvestor.full_name}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium mb-0.5">Nomor WhatsApp Terdaftar</span>
                                <strong className="text-sm font-bold font-mono tracking-tight">{detectedInvestor.maskedPhone}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium mb-0.5">NIB / Status Modal</span>
                                <strong className="text-sm font-bold font-mono tracking-tight">{detectedInvestor.nib || detectedInvestor.status_modal || 'PMDN'}</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {!detectedInvestor && investorIdentifier.trim().length >= 8 && !isSearchingInvestor && (
                          <div className={`p-4 sm:p-5 rounded-2xl border mb-4 sm:mb-5 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            theme === 'dark'
                              ? 'bg-rose-950/40 border-rose-500/30 text-white'
                              : 'bg-rose-50 border-rose-200 text-slate-900'
                          }`}>
                            <div className="flex items-center gap-2 mb-2 text-rose-500 font-bold text-xs">
                              <AlertCircle className="w-4 h-4" />
                              <span>Investor Belum Terdaftar</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                              Nomor WhatsApp / Identitas ini belum ditemukan pada database akun investor resmi. Hanya investor yang telah melakukan registrasi pada Landing Page yang dapat mengakses modul ini.
                            </p>
                            <a
                              href="/login?role=investor"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Registrasi Akun Investor di Sini
                            </a>
                          </div>
                        )}

                        {otpError && (
                          <div className={`mb-4 p-4 border rounded-2xl flex items-start gap-2.5 text-xs font-medium animate-in fade-in ${
                            theme === 'dark'
                              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}>
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                            <span>{otpError}</span>
                          </div>
                        )}

                        {/* Action Send OTP Button for Investor */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleSendInvestorOtp}
                            disabled={!detectedInvestor || isSubmittingNik}
                            className="w-full min-h-[48px] sm:min-h-[56px] py-3.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm md:text-base rounded-2xl flex items-center justify-center gap-2 sm:gap-3 transition-all cursor-pointer shadow-lg shadow-amber-600/25 active:scale-98 whitespace-normal text-center leading-snug"
                          >
                            {isSubmittingNik ? (
                              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                            ) : (
                              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 shrink-0" />
                            )}
                            <span>Kirim Kode OTP ke WhatsApp Investor</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* CITIZEN MODE STEP 2 */
                      <div>
                        <div className="mb-4 sm:mb-5">
                          <span className={`text-[11px] font-bold uppercase tracking-widest font-mono ${
                            theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>{t.step2_badge}</span>
                          <h3 className={`text-xl sm:text-2xl md:text-3xl font-black mt-0.5 tracking-tight ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>{t.step2_title}</h3>
                          <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {t.step2_desc}
                          </p>
                        </div>

                        {/* 16 DIGIT NIK INPUT BOX */}
                        <div className="mb-4 sm:mb-6">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={`text-xs font-mono uppercase font-bold tracking-wider ${
                              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              {t.nik_label}
                            </label>
                            <span className={`text-xs font-mono font-bold ${
                              nik.length === 16 ? 'text-emerald-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {nik.length}/16 {t.digit_unit}
                            </span>
                          </div>

                          {/* Interactive Display with Hidden Native Mobile Input Overlay */}
                          <div 
                            onClick={() => {
                              if (nikInputRef.current) {
                                nikInputRef.current.focus();
                              }
                            }}
                            className={`relative p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-text lg:cursor-default ${
                              nik.length === 16 
                                ? theme === 'dark' 
                                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10' 
                                  : 'border-emerald-600 bg-emerald-50 shadow-md'
                                : theme === 'dark' 
                                  ? 'border-white/15 bg-slate-950/80 focus-within:border-emerald-500/80' 
                                  : 'border-slate-300 bg-slate-50 focus-within:border-emerald-600 shadow-inner'
                            }`}
                          >
                            {/* Hidden Native Numeric Input for Mobile/Android Keyboard */}
                            <input 
                              ref={nikInputRef}
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={16}
                              value={nik}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, '').slice(0, 16);
                                setNik(clean);
                                playBeep('beep');
                              }}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 lg:pointer-events-none"
                              aria-label="Input 16 Digit NIK"
                            />

                            <div className="font-mono text-lg sm:text-2xl md:text-3xl font-black tracking-wider flex items-center gap-1">
                              {nik ? (
                                <span className={nik.length === 16 ? (theme === 'dark' ? 'text-emerald-400 font-mono' : 'text-emerald-800 font-mono') : (theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                                  {nik.replace(/(\d{4})/g, '$1 ').trim()}
                                </span>
                              ) : (
                                <span className={`text-xs sm:text-base font-sans font-normal ${
                                  theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                  {t.tap_to_type}
                                </span>
                              )}
                            </div>

                            {nik.length === 16 ? (
                              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                            ) : (
                              <div className={`text-[11px] font-mono shrink-0 px-2 py-1 rounded ${
                                theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {t.remaining_digits} {16 - nik.length}
                              </div>
                            )}
                          </div>

                          {/* Progress Bar for NIK */}
                          <div className="w-full bg-slate-800/40 h-1.5 rounded-full overflow-hidden mt-2">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                              style={{ width: `${(nik.length / 16) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Real-time DB lookup status */}
                        {isSearchingCitizen && (
                          <div className={`p-4 rounded-2xl border mb-4 flex items-center justify-center gap-2.5 text-xs animate-pulse ${
                            theme === 'dark' ? 'bg-slate-800/40 border-emerald-500/30 text-emerald-400' : 'bg-slate-100 border-emerald-300 text-emerald-800'
                          }`}>
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                            <span>Memeriksa database pendaftaran NIK...</span>
                          </div>
                        )}

                        {detectedCitizen && (
                          <div className={`p-4 sm:p-5 rounded-2xl border mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            theme === 'dark'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                              : 'bg-emerald-50 border-emerald-200 text-slate-900'
                          }`}>
                            <div className={`flex items-center gap-2 font-bold text-xs uppercase mb-3 ${
                              theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'
                            }`}>
                              <Check className="w-4 h-4" />
                              <span>Identitas Terdaftar</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                              <div>
                                <span className="text-slate-400 block font-medium mb-0.5">Nama Lengkap</span>
                                <strong className="text-sm font-bold tracking-tight">{detectedCitizen.full_name}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium mb-0.5">Nomor WhatsApp</span>
                                <strong className="text-sm font-bold font-mono tracking-tight">{detectedCitizen.phone_number}</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {!detectedCitizen && nik.length === 16 && !isSearchingCitizen && (
                          <div className={`p-4 sm:p-5 rounded-2xl border mb-4 sm:mb-5 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            theme === 'dark'
                              ? 'bg-amber-500/10 border-amber-500/30 text-white'
                              : 'bg-amber-50 border-amber-300 text-slate-900'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[11px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${
                                theme === 'dark' ? 'text-amber-400' : 'text-amber-800'
                              }`}>
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Registrasi Cepat Kios Mandiri
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                Langsung di Tempat
                              </span>
                            </div>
                            <p className={`text-xs mb-3.5 leading-relaxed ${
                              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                              NIK berhasil dipindai/dimasukkan. Masukkan Nama & Nomor WhatsApp untuk menerima kode verifikasi OTP:
                            </p>
                            <div className="space-y-3 text-xs">
                              <div>
                                <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                                  Nama Lengkap Pemohon
                                </label>
                                <input
                                  type="text"
                                  value={firstTimeData.full_name}
                                  onChange={(e) => setFirstTimeData(prev => ({ ...prev, full_name: e.target.value }))}
                                  placeholder="Nama lengkap sesuai e-KTP"
                                  className={`w-full p-2.5 sm:p-3 text-xs sm:text-sm rounded-xl border outline-none transition-all ${
                                    theme === 'dark'
                                      ? 'bg-slate-900 border-white/20 focus:border-amber-400 text-white'
                                      : 'bg-white border-slate-300 focus:border-amber-600 text-slate-900'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                                  Nomor WhatsApp Aktif (untuk OTP)
                                </label>
                                <input
                                  type="tel"
                                  value={firstTimeData.phone_number}
                                  onChange={(e) => setFirstTimeData(prev => ({ ...prev, phone_number: e.target.value.replace(/[^\d+]/g, '') }))}
                                  placeholder="Contoh: 081234567890"
                                  className={`w-full p-2.5 sm:p-3 text-xs sm:text-sm font-mono rounded-xl border outline-none transition-all ${
                                    theme === 'dark'
                                      ? 'bg-slate-900 border-white/20 focus:border-amber-400 text-white'
                                      : 'bg-white border-slate-300 focus:border-amber-600 text-slate-900'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {otpError && (
                          <div className={`mb-4 p-4 border rounded-2xl flex items-start gap-2.5 text-xs font-medium animate-in fade-in ${
                            theme === 'dark'
                              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}>
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                            <span>{otpError}</span>
                          </div>
                        )}

                        {/* Action Send OTP Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={
                              nik.length !== 16 || 
                              isSubmittingNik || 
                              (!detectedCitizen && (!firstTimeData.full_name || firstTimeData.phone_number.length < 10))
                            }
                            className="w-full min-h-[48px] sm:min-h-[56px] py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm md:text-base rounded-2xl flex items-center justify-center gap-2 sm:gap-3 transition-all cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-98 whitespace-normal text-center leading-snug"
                          >
                            {isSubmittingNik ? (
                              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                            ) : (
                              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200 shrink-0" />
                            )}
                            <span>{t.send_otp_btn}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* OTP VERIFICATION STEP */
                  <div className="animate-in fade-in duration-300">
                    <div>
                      <span className={`text-[11px] font-bold uppercase tracking-widest font-mono ${
                        theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                      }`}>{t.step2_otp_badge}</span>
                      <h3 className={`text-xl sm:text-2xl md:text-3xl font-black mt-0.5 sm:mt-1 tracking-tight ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{t.step2_otp_title}</h3>
                      <p className={`text-xs sm:text-sm mt-1 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {t.step2_otp_desc}: <strong className={`font-mono ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{maskedPhone}</strong> ({maskedName}).
                      </p>
                    </div>

                    {demoOtpPreview && (
                      <div className={`my-3 sm:my-4 p-3 rounded-xl border flex items-center gap-2 text-xs ${
                        theme === 'dark'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}>
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <strong>Simulasi SMS WhatsApp Kiosk:</strong>
                          <p className={`mt-0.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            Kode keamanan Anda: <span className="font-mono text-amber-600 font-black text-sm tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20">{demoOtpPreview}</span>. Masukkan kode tersebut untuk melanjutkan.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 4 Digit Boxes Display with Mobile Native Input Overlay */}
                    <div 
                      onClick={() => {
                        if (otpInputRef.current) {
                          otpInputRef.current.focus();
                        }
                      }}
                      className="relative flex justify-center gap-2.5 sm:gap-4 my-3 sm:my-4 cursor-text lg:cursor-default"
                    >
                      <input 
                        ref={otpInputRef}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setOtpCode(clean);
                          playBeep('beep');
                          if (clean.length === 4) {
                            if (userMode === 'investor') {
                              handleVerifyInvestorOtp(clean);
                            } else {
                              handleVerifyOtp(clean);
                            }
                          }
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 lg:pointer-events-none"
                        aria-label="Input 4 Digit OTP"
                      />
                      {[0, 1, 2, 3].map((idx) => {
                        const digit = otpCode[idx];
                        return (
                          <div 
                            key={idx}
                            className={`w-12 h-14 sm:w-16 sm:h-20 rounded-2xl border-2 flex items-center justify-center font-mono text-xl sm:text-3xl font-black transition-all ${
                              digit 
                                ? theme === 'dark' 
                                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20' 
                                  : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md'
                                : theme === 'dark' 
                                  ? 'bg-slate-950 border-white/15 text-slate-600' 
                                  : 'bg-slate-100 border-slate-300 text-slate-400'
                            }`}
                          >
                            {digit || '•'}
                          </div>
                        );
                      })}
                    </div>

                    {otpError && (
                      <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl flex items-center gap-2 text-xs text-rose-300 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{otpError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 sm:pt-2">
                      <button
                        type="button"
                        onClick={() => { playBeep('beep'); setIsOtpSent(false); setOtpCode(''); }}
                        className={`text-xs underline cursor-pointer ${
                          theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {userMode === 'investor' ? 'Ganti Nomor WA/NIB' : t.change_nik}
                      </button>

                      <button
                        type="button"
                        disabled={otpCooldown > 0 || isSubmittingNik}
                        onClick={userMode === 'investor' ? handleSendInvestorOtp : handleSendOtp}
                        className={`text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 font-bold cursor-pointer ${
                          theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-800'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingNik ? 'animate-spin' : ''}`} />
                        <span>{t.resend_otp} {otpCooldown > 0 ? `(${otpCooldown}s)` : ''}</span>
                      </button>
                    </div>

                    <div className="pt-2 pb-2 mb-2 sm:mb-4">
                      <button
                        type="button"
                        onClick={() => userMode === 'investor' ? handleVerifyInvestorOtp() : handleVerifyOtp()}
                        disabled={otpCode.length !== 4 || isVerifyingOtp}
                        className="w-full min-h-[48px] sm:min-h-[56px] py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm md:text-base rounded-2xl flex items-center justify-center gap-2 sm:gap-3 transition-all cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-98 whitespace-normal text-center leading-snug"
                      >
                        {isVerifyingOtp ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" /> : <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />}
                        <span>{t.confirm_otp_btn}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: AIRPORT TOUCHSCREEN VIRTUAL NUMPAD */}
              <div className={`hidden lg:flex lg:w-[380px] shrink-0 p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-2xl flex-col items-center justify-center border transition-colors ${
                theme === 'dark'
                  ? 'bg-white/5 backdrop-blur-md border-white/10'
                  : 'bg-white border-slate-200 shadow-slate-200'
              }`}>
                <div className={`w-full flex items-center justify-between pb-3.5 mb-4 border-b text-xs font-mono ${
                  theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                }`}>
                  <span className={`flex items-center gap-2 font-bold tracking-wider ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    <KeyRound className="w-4 h-4" /> {t.keypad_title}
                  </span>
                  <span className={`text-[11px] font-medium tracking-wider ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>16 {t.digit_unit}</span>
                </div>

                {/* NUMPAD GRID WITH GENEROUS GAPS & TACTILE PRESS ANIMATION */}
                <div className="grid grid-cols-3 gap-3.5 sm:gap-4 w-full max-w-[340px]">
                  {[
                    { n: '1', sub: '' },
                    { n: '2', sub: 'ABC' },
                    { n: '3', sub: 'DEF' },
                    { n: '4', sub: 'GHI' },
                    { n: '5', sub: 'JKL' },
                    { n: '6', sub: 'MNO' },
                    { n: '7', sub: 'PQRS' },
                    { n: '8', sub: 'TUV' },
                    { n: '9', sub: 'WXYZ' },
                  ].map((item) => (
                    <button
                      key={item.n}
                      type="button"
                      onClick={() => handleNumpadPress(item.n)}
                      className={`h-16 sm:h-20 rounded-2xl border active:scale-90 flex flex-col items-center justify-center shadow-md transition-all duration-150 cursor-pointer select-none group ${
                        theme === 'dark'
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 active:bg-emerald-500/10 active:border-emerald-500/40 text-white'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 active:bg-emerald-50 active:border-emerald-500 text-slate-900'
                      }`}
                    >
                      <span className={`text-2xl sm:text-3xl font-black font-mono transition-transform group-hover:scale-110 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{item.n}</span>
                      {item.sub && (
                        <span className={`text-[9px] font-mono tracking-widest ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>{item.sub}</span>
                      )}
                    </button>
                  ))}

                  {/* CLEAR BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleNumpadPress('clear')}
                    className="h-16 sm:h-20 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 border border-amber-500/30 text-amber-500 font-bold text-xs sm:text-sm font-mono flex items-center justify-center cursor-pointer transition-all active:scale-90"
                  >
                    {t.keypad_reset}
                  </button>

                  {/* 0 BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleNumpadPress('0')}
                    className={`h-16 sm:h-20 rounded-2xl border active:scale-90 flex flex-col items-center justify-center shadow-md transition-all duration-150 cursor-pointer select-none group ${
                      theme === 'dark'
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 active:bg-emerald-500/10 active:border-emerald-500/40 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 active:bg-emerald-50 active:border-emerald-500 text-slate-900'
                    }`}
                  >
                    <span className={`text-2xl sm:text-3xl font-black font-mono transition-transform group-hover:scale-110 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>0</span>
                    <span className={`text-[9px] font-mono tracking-widest ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>+</span>
                  </button>

                  {/* BACKSPACE BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleNumpadPress('backspace')}
                    className="h-16 sm:h-20 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/30 text-rose-500 font-bold text-xs sm:text-sm font-mono flex items-center justify-center cursor-pointer transition-all active:scale-90"
                  >
                    {t.keypad_delete}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SERVICE CATALOG & COUNTER SELECTION               */}
        {/* ========================================================= */}
        {step === 3 && (
          <div className="w-full max-w-6xl flex-1 flex flex-col animate-in fade-in duration-300 min-h-0">
            {/* EXECUTIVE CITIZEN IDENTITY RIBBON */}
            <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border mb-3 sm:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs shrink-0 transition-colors ${
              theme === 'dark' ? 'bg-slate-900/90 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                  {citizenInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xs sm:text-sm font-black truncate text-slate-900 dark:text-white">
                      {citizenFullName}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold font-mono shrink-0">
                      <ShieldCheck className="w-3 h-3" /> OTP Terverifikasi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                    NIK: {maskedNik} • Sesi Kios Mandiri Terpadu
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end shrink-0 flex-wrap">
                {activeCitizenTickets.length > 0 && (
                  <span className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{activeCitizenTickets.length} Tiket Aktif</span>
                  </span>
                )}
                {/* Tombol Ajukan Izin PKKPR - Direct Redirect with OTP Session */}
                <button
                  type="button"
                  onClick={() => handleRedirectToMasyarakatDashboard('pkkpr')}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  title="Ajukan Izin Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) di Dashboard Masyarakat"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Ajukan Izin PKKPR</span>
                </button>

                {/* Tombol Survei Kepuasan Masyarakat (SKM) - Direct Redirect with OTP Session */}
                <button
                  type="button"
                  onClick={() => handleRedirectToMasyarakatDashboard('survey_skm')}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Isi Survei Kepuasan Masyarakat (SKM) di Dashboard Masyarakat"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                  <span className="hidden sm:inline">Survei Kepuasan (SKM)</span>
                  <span className="sm:hidden">SKM</span>
                </button>

                {/* Tombol Kanal Pengaduan - Direct Redirect with OTP Session */}
                <button
                  type="button"
                  onClick={() => handleRedirectToMasyarakatDashboard('pengaduan')}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Kirim Laporan Pengaduan & Aspirasi di Dashboard Masyarakat"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Kanal Pengaduan</span>
                  <span className="sm:hidden">Pengaduan</span>
                </button>

                <button
                  type="button"
                  onClick={() => { playBeep('alert'); handleResetKiosk(); }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/10 active:scale-95 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ml-auto sm:ml-0"
                >
                  <Lock className="w-3.5 h-3.5 text-red-500" />
                  <span>{t.step3_finish_exit}</span>
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* MOBILE VIEW: NATIVE MASTER-DETAIL FLOW (md:hidden)       */}
            {/* ========================================================= */}
            <div className="md:hidden flex flex-col w-full flex-1 min-h-0">
              {!selectedTenant ? (
                /* MASTER: LIST OF AGENCIES (MOBILE) */
                <div className="flex flex-col flex-1 min-h-0 space-y-3 pb-8">
                  {/* Active Ticket Alert (Mobile) */}
                  {activeCitizenTickets.length > 0 && (
                    <div className={`p-3.5 rounded-2xl border ${
                      theme === 'dark' ? 'bg-amber-950/30 border-amber-500/40 text-white' : 'bg-amber-50 border-amber-300 text-slate-900'
                    } shadow-xs`}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5" /> Tiket Antrean Aktif Hari Ini
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold uppercase">
                          {activeCitizenTickets[0].status}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                          {activeCitizenTickets[0].ticket_code || `${activeCitizenTickets[0].tenant?.code || 'A'}-${String(activeCitizenTickets[0].queue_number).padStart(3, '0')}`}
                        </div>
                        <div className="text-xs font-bold text-right truncate">
                          {activeCitizenTickets[0].tenant?.name || 'Pelayanan MPP'}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {activeCitizenTickets[0].service?.service_name || activeCitizenTickets[0].service?.name || 'Layanan Terpadu'} • {activeCitizenTickets[0].tenant?.floor || 'Lantai 1'}
                      </p>
                    </div>
                  )}

                  {/* Horizontal Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                    {TENANT_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { resetInactivity(); setSelectedCategory(cat.id); }}
                        className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          selectedCategory === cat.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : theme === 'dark' ? 'bg-slate-900 text-slate-400 border border-white/10' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative shrink-0">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari instansi atau nama layanan..."
                      value={searchFilter}
                      onChange={(e) => { resetInactivity(); setSearchFilter(e.target.value); }}
                      className={`w-full pl-10 pr-9 py-2.5 rounded-2xl border text-xs outline-none transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-900 border-white/10 text-white focus:border-emerald-500'
                          : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-600 shadow-xs'
                      }`}
                    />
                    {searchFilter && (
                      <button 
                        type="button"
                        onClick={() => setSearchFilter('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1 shrink-0">
                    <span>PILIH INSTANSI TUJUAN</span>
                    <span>{filteredTenants.length} Instansi</span>
                  </div>

                  {/* Full-Height Agency List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
                    {filteredTenants.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-xs font-bold">Tidak ada instansi yang cocok</p>
                        <button 
                          type="button" 
                          onClick={() => { setSearchFilter(''); setSelectedCategory('all'); }} 
                          className="mt-2 text-xs text-emerald-500 font-bold underline"
                        >
                          Reset Filter
                        </button>
                      </div>
                    ) : (
                      filteredTenants.map((tItem) => (
                        <button
                          key={tItem.id}
                          type="button"
                          onClick={() => handleSelectTenant(tItem)}
                          className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                            theme === 'dark'
                              ? 'bg-slate-900/90 hover:bg-slate-850 border-white/10 text-slate-100 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs block truncate text-slate-900 dark:text-white">{tItem.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400">{tItem.floor || 'Lantai 1'}</span>
                                <span className="text-[10px] text-slate-400">•</span>
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Kode: {tItem.code}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 shrink-0 text-slate-400" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* DETAIL: SERVICES LIST FOR SELECTED TENANT (MOBILE) */
                <div className="flex flex-col flex-1 min-h-0 space-y-3 pb-8">
                  {/* Sticky Back Header */}
                  <div className={`p-3 rounded-2xl border flex items-center justify-between shrink-0 ${
                    theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <button
                      type="button"
                      onClick={() => { setSelectedTenant(null); setTicketError(null); }}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Ganti Instansi</span>
                    </button>
                    <div className="text-right min-w-0 pl-2">
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase block">{selectedTenant.code} • {selectedTenant.floor || 'Lantai 1'}</span>
                      <span className="text-xs font-bold truncate max-w-[170px] block">{selectedTenant.name}</span>
                    </div>
                  </div>

                  {/* Inline Error Alert */}
                  {ticketError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{ticketError}</span>
                      </div>
                      <button type="button" onClick={() => setTicketError(null)} className="text-slate-400 p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Quick Action Shortcuts: SKM & Pengaduan */}
                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRedirectToMasyarakatDashboard('survey_skm')}
                      className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                      <span>Survei SKM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRedirectToMasyarakatDashboard('pengaduan')}
                      className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <MessageSquareHeart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Buat Aduan</span>
                    </button>
                  </div>

                  {/* Services List */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 custom-scrollbar">
                    {services.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center text-center p-4">
                        <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
                        <p className="text-xs text-slate-400">Belum ada layanan aktif untuk instansi ini.</p>
                      </div>
                    ) : (
                      services.map((srv) => (
                        <div
                          key={srv.id}
                          className={`p-4 rounded-2xl border ${
                            theme === 'dark' ? 'bg-slate-900/90 border-white/10' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                              {srv.name || srv.service_name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                              {srv.estimated_time_minutes || 15} Menit
                            </span>
                          </div>
                          {srv.requirements ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                              <strong className="text-amber-500">Syarat:</strong> {srv.requirements}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              Persyaratan: KTP-el, KK, dan berkas permohonan terkait.
                            </p>
                          )}
                          <button
                            type="button"
                            disabled={isSubmittingTicket}
                            onClick={() => handleSubmitTicket(srv)}
                            className={`mt-3 w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                              isSubmittingTicket && submittingServiceId === srv.id
                                ? 'bg-emerald-700 text-white cursor-wait opacity-80'
                                : isSubmittingTicket
                                ? 'bg-slate-500 text-white cursor-not-allowed opacity-50'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-emerald-600/25 cursor-pointer'
                            }`}
                          >
                            {isSubmittingTicket && submittingServiceId === srv.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Menerbitkan Tiket...</span>
                              </>
                            ) : (
                              <>
                                <span>Ambil Tiket Antrean</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* DESKTOP VIEW: TWO-COLUMN ARCHITECTURE (hidden md:grid)   */}
            {/* ========================================================= */}
            <div className="hidden md:grid md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden pb-4">
              {/* LEFT COLUMN: AGENCY CATALOG */}
              <div className={`md:col-span-5 p-5 rounded-3xl border flex flex-col min-h-0 ${
                theme === 'dark' ? 'bg-slate-900/85 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {/* Search Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-sm">{t.step3_select_tenant}</h3>
                    <span className={`text-xs font-mono ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>{filteredTenants.length} Instansi</span>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Cari instansi atau layanan..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className={`w-full pl-9 pr-8 py-2 rounded-xl border text-xs outline-none transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-950 border-white/10 text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                    {searchFilter && (
                      <button 
                        type="button" 
                        onClick={() => setSearchFilter('')} 
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills (Desktop) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar shrink-0">
                  {TENANT_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { resetInactivity(); setSelectedCategory(cat.id); }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Agencies Scroll List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 pb-4 mt-1">
                  {filteredTenants.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-xs font-bold">Tidak ada instansi yang cocok</p>
                      <button 
                        type="button" 
                        onClick={() => { setSearchFilter(''); setSelectedCategory('all'); }} 
                        className="mt-2 text-xs text-emerald-500 font-bold underline cursor-pointer"
                      >
                        Tampilkan Semua Instansi
                      </button>
                    </div>
                  ) : (
                    filteredTenants.map((tItem) => (
                      <button
                        key={tItem.id}
                        type="button"
                        onClick={() => handleSelectTenant(tItem)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          selectedTenant?.id === tItem.id
                            ? theme === 'dark'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                              : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : theme === 'dark'
                              ? 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-200'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            selectedTenant?.id === tItem.id
                              ? 'bg-white/20 text-white'
                              : theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm block truncate">{tItem.name}</span>
                            <span className={`text-[10px] font-mono block ${
                              selectedTenant?.id === tItem.id ? 'text-emerald-100' : 'text-slate-400'
                            }`}>{tItem.floor || 'Lantai 1'} · Kode: {tItem.code}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: SERVICE DETAIL OR CITIZEN SERVICE HUB */}
              <div className={`md:col-span-7 p-6 rounded-3xl border flex flex-col min-h-0 ${
                theme === 'dark' ? 'bg-slate-900/85 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {selectedTenant ? (
                  /* SELECTED TENANT SERVICES VIEW */
                  <>
                    <div className="mb-4 pb-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0">
                      <div>
                        <span className={`text-[10px] font-mono uppercase font-bold ${
                          theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                        }`}>{t.step3_selected_counter}</span>
                        <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">{selectedTenant.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* SKM & Pengaduan Quick Buttons for this Agency */}
                        <button
                          type="button"
                          onClick={() => handleRedirectToMasyarakatDashboard('survey_skm')}
                          className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          title="Isi Survei SKM untuk instansi ini"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                          <span>Survei SKM</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRedirectToMasyarakatDashboard('pengaduan')}
                          className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          title="Buat Pengaduan untuk instansi ini"
                        >
                          <MessageSquareHeart className="w-3.5 h-3.5 text-rose-500" />
                          <span>Pengaduan</span>
                        </button>
                        <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                          theme === 'dark' ? 'bg-slate-950 border-white/10 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-700'
                        }`}>
                          {services.length} Layanan
                        </span>
                        <button
                          type="button"
                          onClick={() => { setSelectedTenant(null); setTicketError(null); }}
                          className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer ml-1"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>

                    {/* Inline Error Alert */}
                    {ticketError && (
                      <div className="mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>{ticketError}</span>
                        </div>
                        <button type="button" onClick={() => setTicketError(null)} className="text-slate-400 p-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
                      {services.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                          <AlertCircle className="w-10 h-10 text-slate-500 mb-2" />
                          <p className="text-xs text-slate-400">{t.step3_no_services}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                          {services.map((srv) => (
                            <div
                              key={srv.id}
                              className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 flex flex-col justify-between hover:scale-[1.01] ${
                                theme === 'dark'
                                  ? 'bg-slate-900/60 hover:bg-slate-850/80 border-white/10 hover:border-emerald-500/50 shadow-md'
                                  : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-emerald-500/60 shadow-sm'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4 className="font-bold text-xs sm:text-sm leading-snug text-slate-900 dark:text-white">{srv.name || srv.service_name}</h4>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    theme === 'dark' 
                                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                                      : 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                                  }`}>
                                    {srv.estimated_time_minutes || 15} {t.step3_minutes}
                                  </span>
                                </div>
                                {srv.requirements ? (
                                  <p className={`text-[10px] sm:text-xs line-clamp-2 mt-1 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                                  }`}>
                                    <strong className="text-amber-500">{t.step3_requirements}</strong> {srv.requirements}
                                  </p>
                                ) : (
                                  <p className={`text-[10px] sm:text-xs line-clamp-2 mt-1 ${
                                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                                  }`}>
                                    Persyaratan: Membawa identitas resmi (KTP-el/KK) dan berkas terkait.
                                  </p>
                                )}
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                                <button
                                  type="button"
                                  disabled={isSubmittingTicket}
                                  onClick={() => handleSubmitTicket(srv)}
                                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
                                    isSubmittingTicket && submittingServiceId === srv.id
                                      ? 'bg-emerald-700 text-white cursor-wait opacity-80'
                                      : isSubmittingTicket
                                      ? 'bg-slate-500 text-white cursor-not-allowed opacity-50'
                                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white cursor-pointer shadow-emerald-600/25'
                                  }`}
                                >
                                  {isSubmittingTicket && submittingServiceId === srv.id ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      <span>Menerbitkan Tiket...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Ambil Tiket Antrean</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* RICH CITIZEN SERVICE HUB (INSTEAD OF EMPTY STATE) */
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4 flex flex-col space-y-4">
                    {/* ACTIVE TICKET BANNER (IF ANY) */}
                    {activeCitizenTickets.length > 0 && (
                      <div className={`p-4 rounded-3xl border ${
                        theme === 'dark' ? 'bg-amber-950/20 border-amber-500/40 text-white' : 'bg-amber-50 border-amber-300 text-slate-900'
                      } shadow-sm`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <Ticket className="w-4 h-4 animate-pulse" /> Tiket Antrean Aktif Anda Hari Ini
                          </span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold uppercase font-mono">
                            Status: {activeCitizenTickets[0].status}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                              {activeCitizenTickets[0].ticket_code || `${activeCitizenTickets[0].tenant?.code || 'A'}-${String(activeCitizenTickets[0].queue_number).padStart(3, '0')}`}
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                              {activeCitizenTickets[0].tenant?.name || 'Instansi Terpadu'} • {activeCitizenTickets[0].tenant?.floor || 'Lantai 1'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">Layanan:</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {activeCitizenTickets[0].service?.service_name || activeCitizenTickets[0].service?.name || 'Pelayanan'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PORTAL MASYARAKAT ACTION CARDS (SKM & PENGADUAN) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Survei Kepuasan Masyarakat Card */}
                      <div className={`p-4 rounded-3xl border flex flex-col justify-between transition-all ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30 shadow-md'
                          : 'bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border-amber-200 shadow-sm'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              PermenPAN-RB No. 14/2017
                            </span>
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500/30" />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                            Survei Kepuasan Masyarakat (SKM)
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            Berikan penilaian mutu pelayanan publik terpadu di MPP Luwu dengan profil NIK yang telah terverifikasi via OTP.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRedirectToMasyarakatDashboard('survey_skm')}
                          className="mt-3.5 w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-amber-500/30"
                        >
                          <Star className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Isi Survei SKM Sekarang</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Kanal Pengaduan & Aspirasi Card */}
                      <div className={`p-4 rounded-3xl border flex flex-col justify-between transition-all ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border-rose-500/30 shadow-md'
                          : 'bg-gradient-to-br from-rose-50 via-white to-rose-50/30 border-rose-200 shadow-sm'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                              Layanan Aspirasi & Pengaduan
                            </span>
                            <MessageSquareHeart className="w-4 h-4 text-rose-500" />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                            Kanal Pengaduan & Aspirasi Warga
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            Sampaikan keluhan, hambatan pelayanan, atau saran perbaikan langsung ke Tim Pemkab Luwu secara transparan.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRedirectToMasyarakatDashboard('pengaduan')}
                          className="mt-3.5 w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-rose-600/30"
                        >
                          <MessageSquareHeart className="w-3.5 h-3.5" />
                          <span>Buka Kanal Pengaduan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* POPULAR SERVICE SHORTCUTS */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Pintasan Layanan Populer (Paling Sering Diakses)
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Pilih instansi di kiri atau klik langsung di bawah</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {POPULAR_SERVICES_SHORTCUTS.map((sc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectShortcut(sc)}
                            className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.01] cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-slate-800/60 hover:bg-slate-800 border-white/5 hover:border-emerald-500/40 text-slate-200'
                                : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-emerald-500/50 text-slate-800 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                {sc.badge}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">{sc.estTime}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{sc.serviceName}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{sc.agencyName}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3-STEP GUIDE INFOGRAPHIC */}
                    <div className={`p-4 rounded-3xl border ${
                      theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200/80'
                    }`}>
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                        Alur 3 Langkah Pelayanan Mandiri MPP Simpurusiang
                      </h5>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 rounded-xl bg-white/40 dark:bg-white/5">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-1.5 font-mono">1</span>
                          <span className="text-xs font-bold block text-slate-900 dark:text-white">Pilih Layanan</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Tentukan instansi & jenis permohonan</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-white/40 dark:bg-white/5">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-1.5 font-mono">2</span>
                          <span className="text-xs font-bold block text-slate-900 dark:text-white">Cetak Tiket</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Dapatkan slip atau e-boarding pass</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-white/40 dark:bg-white/5">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-1.5 font-mono">3</span>
                          <span className="text-xs font-bold block text-slate-900 dark:text-white">Tunggu Panggilan</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Pantau layar FIDS & suara pengumuman</p>
                        </div>
                      </div>
                    </div>

                    {/* ASSISTANCE TRIGGER CARD */}
                    <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      theme === 'dark' ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Butuh Bantuan Fisik atau Pendampingan?</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Petugas Duta Layanan siap mendampingi Anda di depan kios ini.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerAssistance}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs shrink-0"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Panggil Petugas</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: FIRST-CLASS DIGITAL BOARDING PASS & THERMAL SLIP  */}
        {/* ========================================================= */}
        {step === 4 && ticketResult && (
          <div className="w-full max-w-3xl flex flex-col items-center animate-in zoom-in-95 duration-300">
            {/* Success Header */}
            <div className="text-center mb-4 sm:mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-xs font-mono font-bold uppercase mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t.step4_success_badge}
              </span>
              <h2 className="text-xl sm:text-3xl font-black">{t.step4_title}</h2>
              <p className={`text-xs sm:text-sm mt-1 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {t.step4_desc}
              </p>
            </div>

            {/* DUAL TAB SELECTOR (DIGITAL PASS VS THERMAL SLIP) */}
            <div className={`flex items-center border rounded-2xl p-1 mb-4 text-xs font-bold ${
              theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-slate-200 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => { playBeep('beep'); setBoardingPassTab('digital'); }}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  boardingPassTab === 'digital'
                    ? 'bg-emerald-600 text-white shadow font-black'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t.step4_tab_boarding_pass}</span>
              </button>
              <button
                type="button"
                onClick={() => { playBeep('beep'); setBoardingPassTab('thermal'); }}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  boardingPassTab === 'thermal'
                    ? 'bg-emerald-600 text-white shadow font-black'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.step4_tab_thermal_slip}</span>
              </button>
            </div>

            {/* TAB 1: DIGITAL AIRLINE BOARDING PASS WITH HOLOGRAPHIC SEAL */}
            {boardingPassTab === 'digital' ? (
              <div className={`w-full rounded-3xl border-2 shadow-2xl overflow-hidden relative transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900 border-emerald-500/40 text-white'
                  : 'bg-white border-emerald-600/40 text-slate-900 shadow-slate-300'
              }`}>
                {/* Hologram Iridescent Watermark Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Boarding Pass Top Header */}
                <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 p-4 sm:p-6 text-white flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 p-1 border border-white/20">
                      <img 
                        src={LUWU_LOGO_BASE64} 
                        alt="Luwu Logo" 
                        className="w-full h-full object-contain filter drop-shadow" 
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono tracking-widest uppercase text-emerald-200 font-bold">{t.step4_gov_header}</div>
                      <div className="text-base font-black tracking-wide">{t.mpp_title}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase text-emerald-200">FIRST CLASS PASS</div>
                    <div className="text-xs font-mono font-bold text-amber-300">{ticketResult.ticket.ticket_code}</div>
                  </div>
                </div>

                {/* Main Ticket Info */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Big Queue Number */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border gap-4 ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-white/10'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className={`text-xs font-mono uppercase font-bold ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>{t.step4_your_queue}</span>
                      <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600 font-mono tracking-wider">
                        {ticketResult.tenant?.code || 'A'}-{ticketResult.ticket.queue_number.toString().padStart(3, '0')}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className={`text-xs font-mono uppercase font-bold ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>{t.step4_dest_counter}</span>
                      <div className={`text-lg font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{ticketResult.tenant?.name}</div>
                      <div className={`text-xs font-medium ${
                        theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                      }`}>{ticketResult.tenant?.floor || 'Lantai 1'}</div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className={`font-mono uppercase text-[10px] block ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                      }`}>{t.step4_applicant_name}</span>
                      <span className={`font-bold truncate block ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{ticketResult.citizen?.full_name || verifiedCitizen?.full_name || 'Pemohon'}</span>
                    </div>
                    <div>
                      <span className={`font-mono uppercase text-[10px] block ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                      }`}>{t.step4_nik_verified}</span>
                      <span className={`font-mono font-bold block ${
                        theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                      }`}>{nik.slice(0, 4)}••••••••{nik.slice(-4)}</span>
                    </div>
                    <div>
                      <span className={`font-mono uppercase text-[10px] block ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                      }`}>{t.step4_est_time}</span>
                      <span className={`font-bold block ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{ticketResult.service?.estimated_time_minutes || 15} {t.step3_minutes}</span>
                    </div>
                    <div>
                      <span className={`font-mono uppercase text-[10px] block ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                      }`}>{t.step4_visit_date}</span>
                      <span className={`font-mono font-bold block ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{ticketResult.ticket.queue_date}</span>
                    </div>
                  </div>

                  {/* Layanan Title */}
                  <div className={`p-3.5 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-slate-950/60 border-white/5'
                      : 'bg-slate-100 border-slate-200'
                  }`}>
                    <span className={`text-[10px] font-mono uppercase block ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                    }`}>{t.step4_service_type}</span>
                    <span className={`text-sm font-bold block ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>{ticketResult.service?.name}</span>
                  </div>

                  {/* Simulated Barcode & QR at bottom of boarding pass */}
                  <div className={`pt-4 border-t border-dashed flex flex-col items-center ${
                    theme === 'dark' ? 'border-white/20' : 'border-slate-300'
                  }`}>
                    <div className={`w-full h-12 rounded-lg flex items-center justify-center p-2 font-mono text-[10px] tracking-[8px] ${
                      theme === 'dark' ? 'bg-slate-950 text-slate-500' : 'bg-slate-100 text-slate-700'
                    }`}>
                      ||||| | |||| |||||| | ||||| |||| |||||| |||||
                    </div>
                    <span className={`text-[10px] font-mono mt-1 ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                    }`}>{ticketResult.ticket.ticket_code}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: AUTHENTIC THERMAL PAPER RECEIPT SLIP */
              <div className="w-full max-w-md bg-white text-slate-950 p-6 sm:p-8 rounded-2xl shadow-2xl font-mono text-xs border border-slate-300 relative overflow-hidden">
                {/* Serrated Top Edge */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-200 [mask-image:radial-gradient(circle,transparent_4px,black_4px)] [mask-size:12px_12px]" />

                <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-400">
                  <div className="font-bold text-sm tracking-wider uppercase">PEMERINTAH KABUPATEN LUWU</div>
                  <div className="font-black text-base">MPP SIMPURUSIANG</div>
                  <div className="text-[10px] text-slate-600">Jl. Jenderal Sudirman No. 1, Belopa</div>
                  <div className="text-[10px] text-slate-600">Thermal Kiosk Station #01</div>
                </div>

                <div className="py-4 text-center space-y-1 border-b border-dashed border-slate-400">
                  <div className="text-[10px] uppercase tracking-widest text-slate-600">NOMOR ANTREAN</div>
                  <div className="text-4xl font-black tracking-widest text-emerald-800">
                    {ticketResult.tenant?.code || 'A'}-{ticketResult.ticket.queue_number.toString().padStart(3, '0')}
                  </div>
                  <div className="text-xs font-bold">{ticketResult.tenant?.name}</div>
                  <div className="text-[11px] text-slate-600">{ticketResult.service?.name}</div>
                </div>

                <div className="py-3 space-y-1 text-[11px] border-b border-dashed border-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nama:</span>
                    <span className="font-bold">{ticketResult.citizen?.full_name || verifiedCitizen?.full_name || 'Pemohon'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">NIK:</span>
                    <span>{nik.slice(0, 4)}••••••••{nik.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Waktu Cetak:</span>
                    <span>{currentTime.toLocaleTimeString('id-ID')} WITA</span>
                  </div>
                </div>

                <div className="pt-4 text-center space-y-2">
                  <div className="text-[10px] tracking-[6px] font-bold">|||| | ||||| |||| ||||</div>
                  <div className="text-[9px] text-slate-500">Simpan struk ini untuk verifikasi panggilan loket.</div>
                  <div className="text-[9px] text-emerald-700 font-bold uppercase">Terima kasih atas kunjungan Anda</div>
                </div>
              </div>
            )}

            {/* Thermal Print Notification */}
            {printSuccess && (
              <div className={`w-full mt-4 p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
                theme === 'dark'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-400 text-emerald-900'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.step4_printed_notice}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`w-full mt-4 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              theme === 'dark'
                ? 'bg-slate-900 border-white/10'
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrintTicket}
                  disabled={isPrinting}
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/25"
                >
                  <Printer className={`w-4 h-4 ${isPrinting ? 'animate-bounce' : ''}`} />
                  <span>{isPrinting ? t.step4_printing_btn : t.step4_print_btn}</span>
                </button>

                {/* Voice Announcement Button */}
                <button
                  type="button"
                  onClick={() => {
                    const queueCode = `${ticketResult.tenant?.code || 'A'}-${ticketResult.ticket.queue_number.toString().padStart(3, '0')}`;
                    KioskAudioEngine.announceTicket(queueCode, ticketResult.tenant?.name || 'Pelayanan MPP', lang);
                  }}
                  className={`px-3.5 py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-white/10' : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                  title={t.step4_voice_announcement}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => { playBeep('success'); handleResetKiosk(); }}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                }`}
              >
                <span>{t.step4_done_btn}</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: INTEGRATED SURVEI KEPUASAN MASYARAKAT (SKM) KIOSK  */}
        {/* ========================================================= */}
        {step === 5 && (
          <div className="w-full max-w-5xl animate-in fade-in duration-300 pb-8 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 sm:mb-6">
              <button
                type="button"
                onClick={() => { playBeep('beep'); setStep(1); }}
                className={`flex items-center gap-1.5 sm:gap-2 text-xs font-bold uppercase tracking-wider px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  theme === 'dark'
                    ? 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-300 shadow-sm'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.back_to_lanes}
              </button>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] sm:text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                  theme === 'dark'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>SURVEI SKM · PERMENPAN-RB NO. 14/2017</span>
                </span>
              </div>
            </div>

            <div className="w-full">
              <MppCitizenSurveyMenu
                userType={userMode === 'investor' ? 'investor' : 'masyarakat'}
                defaultName={verifiedCitizen?.full_name || (userMode === 'investor' ? (investorData.company_name || 'Investor Luwu') : 'Masyarakat Luwu')}
                defaultCompany={userMode === 'investor' ? investorData.company_name : undefined}
                isDarkMode={theme === 'dark'}
                onSubmitted={() => {
                  playBeep('success');
                }}
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: INTEGRATED TESTIMONI & ULASAN PENGGUNA KIOSK       */}
        {/* ========================================================= */}
        {step === 6 && (
          <div className="w-full max-w-5xl animate-in fade-in duration-300 pb-8 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 sm:mb-6">
              <button
                type="button"
                onClick={() => { playBeep('beep'); setStep(1); }}
                className={`flex items-center gap-1.5 sm:gap-2 text-xs font-bold uppercase tracking-wider px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  theme === 'dark'
                    ? 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-300 shadow-sm'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.back_to_lanes}
              </button>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] sm:text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                  theme === 'dark'
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                    : 'bg-teal-50 border-teal-300 text-teal-800'
                }`}>
                  <MessageSquareHeart className="w-3.5 h-3.5 text-teal-400" />
                  <span>TESTIMONI & ULASAN MPP SIMPURUSIANG</span>
                </span>
              </div>
            </div>

            <div className="w-full">
              <MppCitizenTestimonialMenu
                userType={userMode === 'investor' ? 'investor' : 'masyarakat'}
                defaultName={verifiedCitizen?.full_name || (userMode === 'investor' ? (investorData.company_name || 'Investor Luwu') : 'Masyarakat Luwu')}
                defaultCompany={userMode === 'investor' ? investorData.company_name : undefined}
                isDarkMode={theme === 'dark'}
                onSubmitted={() => {
                  playBeep('success');
                }}
              />
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM AIRPORT TICKER STATUS BAR */}
      <footer className={`h-12 border-t px-4 sm:px-8 flex items-center justify-between text-xs font-mono shrink-0 z-20 transition-colors ${
        theme === 'dark'
          ? 'border-white/10 bg-slate-950/90 text-slate-400'
          : 'border-slate-300 bg-white/90 text-slate-600'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 font-bold ${
            theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
          }`}>
            <Radio className="w-3.5 h-3.5 animate-pulse" /> {t.footer_online}
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">{t.footer_db}</span>
          <span className="hidden sm:inline">|</span>
          <span className={`hidden sm:inline ${theme === 'dark' ? 'text-amber-300' : 'text-amber-600 font-medium'}`}>
            {t.footer_vip}
          </span>
        </div>
        <div>
          <span>{t.footer_copy}</span>
        </div>
      </footer>

      {/* SUB-MODAL: FIDS AIRPORT DEPARTURE BOARD */}
      <MppAirportFidsBoard
        isOpen={isFidsOpen}
        onClose={() => setIsFidsOpen(false)}
        tenants={tenants}
        onSelectTenant={(tItem) => {
          setSelectedTenant(tItem);
          fetchServices(tItem.id);
          setStep(3);
        }}
        lang={lang}
        theme={theme}
      />
    </div>
  );
};
export default MppAirportKioskModal;
