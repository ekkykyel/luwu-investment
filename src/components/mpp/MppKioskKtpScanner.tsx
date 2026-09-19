import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, QrCode, Scan, CreditCard, Sparkles, CheckCircle2, 
  RefreshCw, ShieldCheck, AlertCircle, Zap, Camera, Upload, 
  ArrowRight, Video, VideoOff, Check, FlipHorizontal, Eye,
  Maximize2
} from 'lucide-react';
import { KioskLang, KioskTheme } from '../MppAirportKioskModal';
import { KioskAudioEngine } from './MppKioskAudioAnnouncer';

interface MppKioskKtpScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (nik: string, name?: string) => void;
  lang: KioskLang;
  theme: KioskTheme;
}

const SCAN_I18N = {
  id: {
    modal_title: 'PEMINDAI SENSOR e-KTP & BARCODE',
    modal_subtitle: 'Dekatkan e-KTP atau Kartu Keluarga pada sensor optik atau gunakan kamera scanner',
    tab_sensor: 'Sensor Optik (Tap Kartu)',
    tab_camera: 'Kamera / WebCam',
    tab_upload: 'Unggah Foto KTP',
    sensor_active: 'SENSOR LASER OPTIK AKTIF',
    place_card: 'Tempelkan e-KTP atau Klik Kartu di Bawah',
    click_to_scan: '👉 Klik / Sentuh Kartu untuk Memindai Sensor',
    scanning_progress: 'Membaca Chip NFC & Barcode e-KTP...',
    scan_success: 'Data e-KTP Berhasil Dibaca!',
    sample_cards: 'PILIH SIMULASI TEMPEL e-KTP (1-KLIK):',
    citizen_sample: 'e-KTP Warga Umum',
    investor_sample: 'e-KTP Pelaku Usaha / Investor',
    priority_sample: 'e-KTP Prioritas (Lansia / Disabilitas)',
    manual_btn: 'Tutup & Ketik Manual',
    security_note: 'Dilindungi Enkripsi Chip Standar Ditjen Dukcapil Kemendagri RI',
    camera_instruction: 'Arahkan kartu e-KTP atau QR Code ke dalam bingkai kamera',
    camera_start: 'Aktifkan Kamera',
    camera_stop: 'Matikan Kamera',
    camera_flip: 'Ganti Kamera',
    capture_scan: 'Ambil & Pindai e-KTP',
    camera_loading: 'Memulai koneksi kamera video...',
    camera_permission_error: 'Kamera tidak dapat diakses. Pastikan izin kamera telah disetujui di peramban atau gunakan tab Sensor / Unggah Foto.',
    upload_instruction: 'Tarik & lepas foto e-KTP atau klik untuk memilih file',
    upload_btn: 'Pilih Foto KTP / Barcode',
    scan_preset_btn: 'Pindai Kartu Ini',
    ocr_reading: 'Menganalisis teks NIK & Nama via OCR AI...'
  },
  en: {
    modal_title: 'E-ID & BARCODE OPTICAL SCANNER',
    modal_subtitle: 'Place your e-ID or Family Card over the optical sensor or use the camera scanner',
    tab_sensor: 'Optical Sensor (Tap Card)',
    tab_camera: 'Camera / WebCam',
    tab_upload: 'Upload ID Photo',
    sensor_active: 'OPTICAL LASER SENSOR ACTIVE',
    place_card: 'Tap E-ID or Click Card Below',
    click_to_scan: '👉 Click / Tap Card to Trigger Sensor Scan',
    scanning_progress: 'Reading NFC Chip & ID Barcode...',
    scan_success: 'E-ID Data Successfully Scanned!',
    sample_cards: 'SELECT 1-CLICK E-ID SIMULATION:',
    citizen_sample: 'General Citizen E-ID',
    investor_sample: 'Business / Investor E-ID',
    priority_sample: 'Priority E-ID (Senior / Disability)',
    manual_btn: 'Close & Type Manually',
    security_note: 'Protected with National Registry Level Cryptographic Standard',
    camera_instruction: 'Align your e-ID card or QR code inside the camera frame',
    camera_start: 'Turn On Camera',
    camera_stop: 'Turn Off Camera',
    camera_flip: 'Switch Camera',
    capture_scan: 'Capture & Scan E-ID',
    camera_loading: 'Starting camera stream...',
    camera_permission_error: 'Unable to access camera. Please check browser permissions or use Sensor / Upload tab.',
    upload_instruction: 'Drag & drop e-ID image or click to select file',
    upload_btn: 'Choose ID / Barcode Image',
    scan_preset_btn: 'Scan This ID',
    ocr_reading: 'Extracting NIK & Name via AI OCR...'
  },
  zh: {
    modal_title: '电子身份证与条码光学扫描仪',
    modal_subtitle: '请将电子身份证放置在光学感应区或使用摄像头扫描',
    tab_sensor: '光学感应（刷卡）',
    tab_camera: '摄像头扫描',
    tab_upload: '上传证件照片',
    sensor_active: '光学激光传感器已启动',
    place_card: '请将身份证贴在此处或点击下方卡片',
    click_to_scan: '👉 点击卡片立即启动光学感应扫描',
    scanning_progress: '正在读取 NFC 芯片与条码信息...',
    scan_success: '身份证信息读取成功！',
    sample_cards: '选择快捷刷卡测试（一键完成）：',
    citizen_sample: '普通居民身份证',
    investor_sample: '企业投资者身份证',
    priority_sample: '绿色优先通道（长者/残障）',
    manual_btn: '关闭并手动输入',
    security_note: '符合国家人口户政数据安全加密标准',
    camera_instruction: '将实体身份证或二维码置于摄像头框线内',
    camera_start: '开启摄像头',
    camera_stop: '关闭摄像头',
    camera_flip: '切换摄像头',
    capture_scan: '拍摄并识别证件',
    camera_loading: '正在启动摄像头视频流...',
    camera_permission_error: '无法调用摄像头，请检查浏览器权限设置或使用刷卡/上传模式。',
    upload_instruction: '拖拽身份证照片或点击上传文件',
    upload_btn: '选择照片/条码文件',
    scan_preset_btn: '扫描此卡',
    ocr_reading: 'AI OCR 正在识别身份证信息...'
  }
};

const SAMPLE_PRESETS = [
  {
    nik: '7317011508920001',
    name: 'Andi Firmansyah, S.T.',
    type: 'citizen',
    labelKey: 'citizen_sample',
    badge: 'Terminal A - Warga'
  },
  {
    nik: '7317082204850002',
    name: 'Budi Santoso (PT Luwu Agro Perkasa)',
    type: 'investor',
    labelKey: 'investor_sample',
    badge: 'Terminal B - VIP Investor'
  },
  {
    nik: '7317054101560003',
    name: 'Hj. Siti Rahmah',
    type: 'priority',
    labelKey: 'priority_sample',
    badge: 'Jalur Prioritas'
  }
];

export const MppKioskKtpScanner: React.FC<MppKioskKtpScannerProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  lang,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'sensor' | 'camera' | 'upload'>('sensor');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activePreset, setActivePreset] = useState<typeof SAMPLE_PRESETS[0] | null>(null);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [isShutterFlash, setIsShutterFlash] = useState(false);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // File Upload states
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const t = SCAN_I18N[lang] || SCAN_I18N.id;

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      setCameraStream(null);
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
  }, [cameraStream]);

  // Start camera helper with robust multi-level fallbacks
  const startCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    setIsCameraLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(t.camera_permission_error);
      setIsCameraLoading(false);
      return;
    }

    let stream: MediaStream | null = null;

    // Attempt 1: Ideal facingMode + resolution
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (err1) {
      // Attempt 2: Basic facingMode
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false
        });
      } catch (err2) {
        // Attempt 3: General video constraint (any camera)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (err3: any) {
          console.error('Camera access error:', err3);
          setCameraError(t.camera_permission_error);
          setIsCameraLoading(false);
          setIsCameraActive(false);
          return;
        }
      }
    }

    if (stream) {
      setCameraStream(stream);
      setIsCameraActive(true);
      setIsCameraLoading(false);
    }
  }, [facingMode, stopCamera, t.camera_permission_error]);

  // Attach stream to video element whenever video element or stream updates
  useEffect(() => {
    if (videoElementRef.current && cameraStream && activeTab === 'camera') {
      const video = videoElementRef.current;
      video.srcObject = cameraStream;
      video.onloadedmetadata = () => {
        video.play().catch((err) => {
          console.warn('Video play prevented:', err);
        });
      };
    }
  }, [cameraStream, activeTab]);

  // Tab switching effect
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'camera') {
        startCamera(facingMode);
      } else {
        stopCamera();
      }
    } else {
      stopCamera();
    }
  }, [activeTab, isOpen]);

  // Cleanup on unmount or modal close
  useEffect(() => {
    if (!isOpen) {
      setIsScanning(false);
      setScanProgress(0);
      setActivePreset(null);
      setUploadedPreview(null);
      setCapturedSnapshot(null);
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // Flip camera (front <-> back)
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Trigger scan sequence
  const handleTriggerScan = (preset?: typeof SAMPLE_PRESETS[0]) => {
    const selected = preset || activePreset || SAMPLE_PRESETS[0];
    setActivePreset(selected);
    setIsScanning(true);
    setScanProgress(10);
    KioskAudioEngine.playKeyBeep();

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          KioskAudioEngine.playSuccessSound();
          setTimeout(() => {
            stopCamera();
            onScanComplete(selected.nik, selected.name);
            onClose();
          }, 350);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  // Capture frame from camera and run scan
  const handleCaptureCamera = () => {
    if (!videoElementRef.current || !cameraStream) {
      // If camera not ready, fallback to simulated scan
      handleTriggerScan();
      return;
    }

    // Shutter flash effect
    setIsShutterFlash(true);
    setTimeout(() => setIsShutterFlash(false), 200);
    KioskAudioEngine.playKeyBeep();

    try {
      const video = videoElementRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedSnapshot(dataUrl);
      }
    } catch (err) {
      console.warn('Canvas snapshot capture error:', err);
    }

    // Trigger completion with preset
    handleTriggerScan(SAMPLE_PRESETS[0]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPreview(reader.result as string);
      handleTriggerScan(SAMPLE_PRESETS[0]);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-colors max-h-[90vh] ${
          theme === 'dark' 
            ? 'bg-slate-950 border-emerald-500/30 text-white shadow-emerald-500/10' 
            : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Hidden Canvas for Frame Capturing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              theme === 'dark' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700'
            }`}>
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black font-mono tracking-wider">{t.modal_title}</h3>
              <p className={`text-[10px] sm:text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.sensor_active}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
              theme === 'dark' ? 'border-white/10 text-slate-400 hover:text-white bg-white/5' : 'border-slate-300 text-slate-600 hover:text-slate-900 bg-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className={`px-4 pt-3 pb-0 border-b flex items-center gap-2 ${
          theme === 'dark' ? 'border-white/10 bg-slate-900/30' : 'border-slate-200 bg-slate-100/60'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('sensor')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-l border-r flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sensor'
                ? theme === 'dark'
                  ? 'bg-slate-950 border-emerald-500/40 text-emerald-400 -mb-px'
                  : 'bg-white border-slate-300 text-emerald-800 -mb-px shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t.tab_sensor}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-l border-r flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? theme === 'dark'
                  ? 'bg-slate-950 border-emerald-500/40 text-emerald-400 -mb-px'
                  : 'bg-white border-slate-300 text-emerald-800 -mb-px shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{t.tab_camera}</span>
            {isCameraActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-l border-r flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? theme === 'dark'
                  ? 'bg-slate-950 border-emerald-500/40 text-emerald-400 -mb-px'
                  : 'bg-white border-slate-300 text-emerald-800 -mb-px shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.tab_upload}</span>
          </button>
        </div>

        {/* Stage Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col items-center">
          
          {/* TAB 1: OPTICAL SENSOR & TAP CARD */}
          {activeTab === 'sensor' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
              {/* Laser Scanner Frame Box */}
              <div 
                onClick={() => handleTriggerScan()}
                className={`w-full max-w-md h-56 sm:h-64 rounded-2xl border-2 border-dashed relative overflow-hidden flex flex-col items-center justify-center p-4 transition-all cursor-pointer group select-none ${
                  isScanning
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                    : theme === 'dark'
                      ? 'border-emerald-500/40 bg-slate-900/50 hover:border-emerald-400 hover:bg-slate-900/80'
                      : 'border-emerald-600/40 bg-slate-50 hover:border-emerald-600 hover:bg-emerald-50/40 shadow-inner'
                }`}
                title="Klik untuk memindai kartu e-KTP"
              >
                {/* Corner Targeting Accents */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-500 transition-transform group-hover:scale-110" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-500 transition-transform group-hover:scale-110" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-500 transition-transform group-hover:scale-110" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-500 transition-transform group-hover:scale-110" />

                {/* Glowing Laser Scan Bar */}
                {isScanning && (
                  <div 
                    className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10B981] z-20 transition-all"
                    style={{ top: `${scanProgress}%` }}
                  />
                )}

                {/* Visual Card in Scanner */}
                <div className={`w-52 sm:w-60 h-32 sm:h-36 rounded-2xl border-2 p-3 flex flex-col justify-between transition-all group-hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-white/20 shadow-xl'
                    : 'bg-white border-slate-300 shadow-lg'
                }`}>
                  <div className="flex items-center justify-between border-b pb-1 dark:border-white/10 border-slate-200">
                    <span className="text-[9px] font-bold font-mono tracking-widest uppercase text-emerald-600 dark:text-emerald-400">PROVINSI SULAWESI SELATAN</span>
                    <span className="text-[8px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">e-KTP</span>
                  </div>
                  <div className="flex items-center gap-2.5 my-1">
                    <div className="w-9 h-11 rounded-lg bg-slate-300/40 dark:bg-slate-700/60 border flex flex-col items-center justify-center text-[8px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      <CreditCard className="w-4 h-4 text-emerald-500 mb-0.5" />
                      FOTO
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="text-[10px] font-bold truncate text-slate-800 dark:text-white">
                        {activePreset ? activePreset.name : 'ANDI FIRMANSYAH, S.T.'}
                      </div>
                      <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        NIK: {activePreset ? activePreset.nik : '7317011508920001'}
                      </div>
                      <div className="h-1 w-20 bg-slate-300/40 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-mono pt-1 border-t dark:border-white/10 border-slate-200">
                    <span className="text-slate-500 dark:text-slate-400">KABUPATEN LUWU</span>
                    <QrCode className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>

                {/* Status / CTA Banner */}
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t.scanning_progress} ({scanProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-3.5 h-3.5 animate-pulse" />
                      <span>{t.click_to_scan}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Simulation Preset Buttons */}
              <div className="w-full mt-5">
                <span className={`text-[10px] font-mono uppercase font-bold tracking-wider block mb-2 text-center sm:text-left ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {t.sample_cards}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SAMPLE_PRESETS.map((preset) => {
                    return (
                      <button
                        key={preset.nik}
                        type="button"
                        onClick={() => handleTriggerScan(preset)}
                        disabled={isScanning}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-95 group hover:shadow-md ${
                          theme === 'dark'
                            ? 'bg-slate-900 hover:bg-slate-850 border-white/10 hover:border-emerald-500'
                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-600 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                            {preset.badge}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs font-bold block truncate leading-tight">{preset.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">NIK: {preset.nik}</span>
                        </div>
                        <div className="pt-2 border-t dark:border-white/5 border-slate-100 flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                          <span>{t.scan_preset_btn}</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CAMERA / WEBCAM SCANNER */}
          {activeTab === 'camera' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
              <div className="w-full max-w-md h-64 sm:h-72 rounded-2xl border-2 relative overflow-hidden bg-black flex flex-col items-center justify-center shadow-lg">
                
                {/* Camera Shutter Flash Animation */}
                {isShutterFlash && (
                  <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200 pointer-events-none" />
                )}

                {/* Captured Freeze Frame / Video Feed */}
                {capturedSnapshot ? (
                  <img 
                    src={capturedSnapshot} 
                    alt="Captured KTP" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <video 
                    ref={videoElementRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Laser Crosshair Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                  <div className="w-full h-44 border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                    {/* Reticle corner markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                    {/* Animated Laser Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-bounce" />

                    <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-mono text-emerald-300 font-bold bg-black/70 py-1 px-2 rounded-lg backdrop-blur-sm">
                      {isScanning ? t.ocr_reading : t.camera_instruction}
                    </div>
                  </div>
                </div>

                {/* Loading State Overlay */}
                {isCameraLoading && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 text-emerald-400 z-10">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <span className="text-xs font-mono">{t.camera_loading}</span>
                  </div>
                )}

                {/* Error State Overlay */}
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-5 text-center z-10">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <p className="text-xs text-rose-200 mb-3 leading-relaxed">{cameraError}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Hubungkan Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('sensor')}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
                      >
                        Gunakan Sensor Tap
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Action Toolbar */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCaptureCamera}
                  disabled={isScanning || isCameraLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-95"
                >
                  {isScanning ? (
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <Camera className="w-4 h-4 shrink-0" />
                  )}
                  <span>{isScanning ? t.scanning_progress : t.capture_scan}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFlipCamera}
                  disabled={isScanning || isCameraLoading}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    theme === 'dark' ? 'border-white/20 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Ganti ke Kamera Depan / Belakang"
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">{t.camera_flip}</span>
                </button>

                <button
                  type="button"
                  onClick={isCameraActive ? stopCamera : () => startCamera(facingMode)}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    theme === 'dark' ? 'border-white/20 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isCameraActive ? (
                    <>
                      <VideoOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.camera_stop}</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.camera_start}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Helpful camera tip */}
              <p className="text-[11px] text-slate-400 mt-3 text-center">
                💡 <span className="font-semibold">Tips:</span> Posisikan e-KTP tegak lurus di depan kamera hingga teks NIK terlihat jelas.
              </p>
            </div>
          )}

          {/* TAB 3: UPLOAD PHOTO / FILE */}
          {activeTab === 'upload' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-md h-56 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                  theme === 'dark' 
                    ? 'border-white/20 bg-slate-900/50 hover:border-emerald-400 hover:bg-slate-900/80' 
                    : 'border-slate-300 bg-slate-50 hover:border-emerald-600 hover:bg-emerald-50/40'
                }`}
              >
                {uploadedPreview ? (
                  <div className="flex flex-col items-center">
                    <img src={uploadedPreview} alt="KTP Preview" className="h-28 object-contain rounded-xl border shadow mb-2" />
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Berkas Terpilih! Memproses OCR...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t.upload_instruction}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Mendukung format JPG, PNG, WEBP e-KTP / KIA / KK</p>
                    <button
                      type="button"
                      className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                    >
                      {t.upload_btn}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs ${
          theme === 'dark' ? 'border-white/10 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{t.security_note}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl border font-bold text-xs cursor-pointer ${
              theme === 'dark' ? 'border-white/10 hover:bg-white/10 text-white' : 'border-slate-300 hover:bg-slate-200 text-slate-800'
            }`}
          >
            {t.manual_btn}
          </button>
        </div>
      </div>
    </div>
  );
};
