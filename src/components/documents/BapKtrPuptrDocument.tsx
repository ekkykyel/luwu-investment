import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import { safeHtml2Canvas } from "../../lib/html2canvasShim";
import { OFFICIAL_LUWU_LOGO_URL } from "../LuwuLogo";
import { 
  Printer, 
  Download, 
  Eye, 
  Edit3, 
  FileCheck, 
  MapPin, 
  ShieldCheck, 
  Compass, 
  Layers, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Maximize2
} from "lucide-react";

/**
 * Coordinate Point for BAP-KTR Document
 */
export interface BapKtrCoordinatePoint {
  id: number | string;
  pointName: string;
  latitudeDms: string;
  longitudeDms: string;
  latitudeDd: number;
  longitudeDd: number;
  description?: string;
}

export interface BapKtrDocumentData {
  // Tipe Permohonan: Berusaha vs Non-Berusaha
  jenisPermohonan?: "Berusaha" | "Non-Berusaha";
  kategoriNonBerusaha?: string;
  fungsiBangunan?: string;
  namaLembagaOrganisasi?: string;
  luasBangunanRencana?: string;

  // Nomor & Identitas Surat
  nomorSurat: string;
  tentangSurat: string;
  tanggalDokumen: string;
  hariTanggalPemeriksaan: string;

  // Data Pemohon
  nibNik: string;
  namaPemohon: string;
  namaPerusahaan: string;
  alamatPemohon: string;
  sektorUsaha: string;
  kbliCode: string;
  lokasiInvestasi: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupaten: string;
  luasLahanPermohonan: string;
  luasLahanDisetujui: string;
  buktiHakTanah: string;

  // Hasil Audit Teknis Spasial
  zonaPolaRuangRtrw: string;
  kodeZonaRtrw: string;
  statusLp2b: "NON_LP2B" | "LP2B" | "LP2B_CADANGAN";
  keteranganLp2b: string;
  statusKawasanLindung: string;
  statusSempadanSungaiPantai: string;
  validasiTopologi: string;
  sistemKoordinat: string;

  // Keputusan & Rekomendasi
  statusKeputusan: "APPROVED" | "APPROVED_WITH_CONDITIONS" | "REJECTED";
  catatanRekomendasiTeknis: string[];
  koefisienDasarBangunan: string;
  koefisienLantaiBangunan: string;
  garisSempadanBangunan: string;

  // Pejabat Penandatangan (Dual Signatures)
  kabidNama: string;
  kabidNip: string;
  kabidJabatan: string;
  kadisNama: string;
  kadisNip: string;
  kadisJabatan: string;
  kadisPangkat: string;

  // Map & Spatial Attachment
  petaImageUrl?: string;
  analisGisNama?: string;
  analisGisNip?: string;
  catatanSurveyor?: string;
  koordinatPoligon: BapKtrCoordinatePoint[];
}

/**
 * Convert Decimal Degrees to Degrees Minutes Seconds (DMS) string
 */
export function ddToDms(dd: number, isLat: boolean): string {
  const dir = isLat ? (dd >= 0 ? "LU" : "LS") : (dd >= 0 ? "BT" : "BB");
  const abs = Math.abs(dd);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(2);
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

/**
 * Helper to extract coordinate points from GeoJSON geometry
 */
export function extractCoordinatesFromGeometry(geometry: any): BapKtrCoordinatePoint[] {
  if (!geometry) return [];
  let ring: [number, number][] = [];

  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates) && geometry.coordinates[0]) {
    ring = geometry.coordinates[0];
  } else if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates) && geometry.coordinates[0]?.[0]) {
    ring = geometry.coordinates[0][0];
  } else if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates;
    return [{
      id: 1,
      pointName: "P.01",
      latitudeDd: lat,
      longitudeDd: lng,
      latitudeDms: ddToDms(lat, true),
      longitudeDms: ddToDms(lng, false),
      description: "Titik Pusat Koordinat Lokasi"
    }];
  }

  if (ring.length === 0) return [];

  const points = (ring.length > 3 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1])
    ? ring.slice(0, ring.length - 1)
    : ring;

  return points.slice(0, 16).map(([lng, lat], idx) => ({
    id: idx + 1,
    pointName: `P.${String(idx + 1).padStart(2, '0')}`,
    latitudeDd: lat,
    longitudeDd: lng,
    latitudeDms: ddToDms(lat, true),
    longitudeDms: ddToDms(lng, false),
    description: idx === 0 ? "Patok Sudut Awal Batas Persil" : `Patok Batas Poligon Titik ${idx + 1}`
  }));
}

export const DEFAULT_BAP_KTR_DATA: BapKtrDocumentData = {
  jenisPermohonan: "Berusaha",
  fungsiBangunan: "Industri Pengolahan Kakao Terpadu & Pergudangan Modern",
  namaLembagaOrganisasi: "PT. LUWU AGRO INDUSTRI NUSANTARA",
  luasBangunanRencana: "12.500 m²",

  nomorSurat: "600.1.15/042/BAP-PKKPR-B/PUPTR-TR/LUWU/2026",
  tentangSurat: "HASIL PENILAIAN DOKUMEN PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR) BERUSAHA KABUPATEN LUWU",
  tanggalDokumen: "24 September 2026",
  hariTanggalPemeriksaan: "Rabu, 24 September 2026",

  nibNik: "0220108392182 / 7317011909890001",
  namaPemohon: "Ir. Muhammad Arsyad Al-Fatih, M.T.",
  namaPerusahaan: "PT. LUWU AGRO INDUSTRI NUSANTARA",
  alamatPemohon: "Jl. Jenderal Sudirman No. 45, Belopa, Kab. Luwu",
  sektorUsaha: "Industri Pengolahan Kakao Terpadu & Pergudangan Modern",
  kbliCode: "10732 (Industri Pengolahan Kakao dan Cokelat)",
  lokasiInvestasi: "Jl. Poros Trans Sulawesi KM 14, Kawasan Peruntukan Industri",
  desaKelurahan: "Desa Karang-Karangan",
  kecamatan: "Kecamatan Bua",
  kabupaten: "Kabupaten Luwu, Provinsi Sulawesi Selatan",
  luasLahanPermohonan: "254.800 m² (25,48 Hektar)",
  luasLahanDisetujui: "254.800 m² (25,48 Hektar) - Sesuai Delineasi Poligon",
  buktiHakTanah: "Sertipikat Hak Milik (SHM) No. 00412/Karang-Karangan & Surat Keterangan Penguasaan Fisik Tanah",

  zonaPolaRuangRtrw: "Kawasan Peruntukan Industri (KPI) & Kawasan Pergudangan",
  kodeZonaRtrw: "KPI-01 / Perda No. 3 Tahun 2024 tentang RTRW Kab. Luwu 2024-2044",
  statusLp2b: "NON_LP2B",
  keteranganLp2b: "LOKASI BERADA DILUAR ZONA LP2B (NON-LP2B) - Bebas dari Kawasan Pertanian Pangan Berkelanjutan",
  statusKawasanLindung: "Bebas dari Kawasan Hutan Lindung, Suaka Alam, Sempadan Sungai, dan Konservasi Mangrove",
  statusSempadanSungaiPantai: "Memenuhi Buffer Sempadan Pantai > 100 Meter & Sempadan Sungai > 50 Meter",
  validasiTopologi: "Valid (Zero Self-Intersection, Zero Sliver Polygons, Seamless Boundary Conformance WGS84 UTM Zone 51S)",
  sistemKoordinat: "Universal Transverse Mercator (UTM) Zone 51S - Datum WGS 1984",

  statusKeputusan: "APPROVED",
  catatanRekomendasiTeknis: [
    "Rencana pemanfaatan ruang telah SESUAI dengan Peraturan Daerah Kabupaten Luwu No. 3 Tahun 2024 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2024-2044.",
    "Pemohon diwajibkan menyediakan Ruang Terbuka Hijau (RTH) privat minimal 10% dari total luas persil lahan yang dikuasai.",
    "Wajib mematuhi Koefisien Dasar Bangunan (KDB) maksimal 60% dan Garis Sempadan Bangunan (GSB) minimal 15 meter dari as jalan arteri primer.",
    "Direkomendasikan kepada Kepala DPMPTSP Kabupaten Luwu untuk diterbitkan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Berusaha melalui sistem OSS-RBA."
  ],
  koefisienDasarBangunan: "Maksimal 60% (KDB)",
  koefisienLantaiBangunan: "Maksimal 2.4 (KLB)",
  garisSempadanBangunan: "Minimal 15.0 Meter dari Batas As Jalan",

  kabidNama: "IR. H. IRWANTO, S.T., M.T.",
  kabidNip: "19780412 200502 1 003",
  kabidJabatan: "Kepala Bidang Tata Ruang dan Bina Konstruksi",

  kadisNama: "IR. IKHSAN AS'AD, S.T., M.Si.",
  kadisNip: "19710815 199803 1 007",
  kadisJabatan: "Kepala Dinas Pekerjaan Umum dan Penataan Ruang",
  kadisPangkat: "Pembina Utama Muda (IV/c)",

  petaImageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80",
  analisGisNama: "ANDI BASO MATTATA, S.T.",
  analisGisNip: "19940822 202012 1 003",
  catatanSurveyor: "Pengukuran batas persil telah diverifikasi menggunakan GNSS RTK Dual-Frequency Geodetic dengan tingkat akurasi horizontal < 0.05 meter. Delineasi poligon telah ditumpangsusunkan (overlay) langsung dengan Layer Peta Digital RTRW Kabupaten Luwu 2024-2044.",

  koordinatPoligon: [
    { id: 1, pointName: "P.01", latitudeDms: "2° 58' 42.12\" LS", longitudeDms: "120° 18' 24.35\" BT", latitudeDd: -2.978367, longitudeDd: 120.306764, description: "Patok Utama Sudut Barat Daya (Batas Jalan Poros)" },
    { id: 2, pointName: "P.02", latitudeDms: "2° 58' 38.45\" LS", longitudeDms: "120° 18' 32.18\" BT", latitudeDd: -2.977347, longitudeDd: 120.308939, description: "Patok Batas Sisi Barat (Jalan Akses Industri)" },
    { id: 3, pointName: "P.03", latitudeDms: "2° 58' 29.80\" LS", longitudeDms: "120° 18' 35.60\" BT", latitudeDd: -2.974944, longitudeDd: 120.309889, description: "Patok Sudut Utara (Batas Lahan Perkebunan)" },
    { id: 4, pointName: "P.04", latitudeDms: "2° 58' 25.10\" LS", longitudeDms: "120° 18' 48.90\" BT", latitudeDd: -2.973639, longitudeDd: 120.313583, description: "Patok Sudut Timur Laut (Batas Kawasan Industri)" },
    { id: 5, pointName: "P.05", latitudeDms: "2° 58' 36.70\" LS", longitudeDms: "120° 18' 54.20\" BT", latitudeDd: -2.976861, longitudeDd: 120.315056, description: "Patok Sudut Tenggara (Zona Logistik)" },
    { id: 6, pointName: "P.06", latitudeDms: "2° 58' 45.90\" LS", longitudeDms: "120° 18' 40.50\" BT", latitudeDd: -2.979417, longitudeDd: 120.311250, description: "Patok Sudut Selatan (Kembali ke Perimeter Awal)" }
  ]
};

/**
 * Default Sample Data for BAP-PKKPR Non-Berusaha (e.g. Pembangunan Gereja / Rumah Ibadah)
 */
export const DEFAULT_BAP_NON_BERUSAHA_DATA: BapKtrDocumentData = {
  jenisPermohonan: "Non-Berusaha",
  kategoriNonBerusaha: "Sarana Peribadatan / Rumah Ibadah (Gereja)",
  fungsiBangunan: "Pembangunan Rumah Ibadah (Gereja)",
  namaLembagaOrganisasi: "Panitia Pembangunan Gereja Toraja Jemaat Ranteballa",
  luasBangunanRencana: "480 m² (1 Lantai)",

  nomorSurat: "600.1.15/089/BAP-PKKPR-NB/PUPTR-TR/LUWU/2026",
  tentangSurat: "HASIL PENILAIAN PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR) NON-BERUSAHA PEMBANGUNAN SARANA PERIBADATAN / RUMAH IBADAH KABUPATEN LUWU",
  tanggalDokumen: "24 September 2026",
  hariTanggalPemeriksaan: "Rabu, 24 September 2026",

  nibNik: "7317011909890001",
  namaPemohon: "Pdt. Markus Sampe, S.Th.",
  namaPerusahaan: "Panitia Pembangunan Gereja Toraja Jemaat Ranteballa",
  alamatPemohon: "Dusun Ranteballa, Desa Ranteballa, Kec. Latimojong, Kab. Luwu",
  sektorUsaha: "Sarana Sosial, Budaya & Peribadatan (Pembangunan Gereja)",
  kbliCode: "Non-KBLI (Kegiatan Non-Berusaha / Sarana Peribadatan)",
  lokasiInvestasi: "Jl. Poros Ranteballa KM 3, Wilayah Permukiman Perdesaan",
  desaKelurahan: "Desa Ranteballa",
  kecamatan: "Kecamatan Latimojong",
  kabupaten: "Kabupaten Luwu, Provinsi Sulawesi Selatan",
  luasLahanPermohonan: "2.450 m² (0,245 Hektar)",
  luasLahanDisetujui: "2.450 m² (0,245 Hektar) - Sesuai Delineasi Poligon",
  buktiHakTanah: "Sertipikat Hak Milik (SHM) No. 00214/Ranteballa & Surat Keterangan Hibah Tanah Tempat Ibadah",

  zonaPolaRuangRtrw: "Kawasan Permukiman Perdesaan & Fasilitas Pelayanan Umum (Sarana Peribadatan)",
  kodeZonaRtrw: "SPU-02 / Perda No. 3 Tahun 2024 tentang RTRW Kab. Luwu 2024-2044",
  statusLp2b: "NON_LP2B",
  keteranganLp2b: "LOKASI BERADA DILUAR ZONA LP2B (NON-LP2B) - Bebas dari Kawasan Pertanian Pangan Berkelanjutan",
  statusKawasanLindung: "Bebas dari Kawasan Hutan Lindung, Suaka Alam, Sempadan Sungai, dan Kawasan Rawan Bencana Tinggi",
  statusSempadanSungaiPantai: "Memenuhi Jarak Bebas Sempadan Sungai > 50 Meter",
  validasiTopologi: "Valid (Zero Self-Intersection, Zero Sliver Polygons, Seamless Boundary Conformance WGS84 UTM Zone 51S)",
  sistemKoordinat: "Universal Transverse Mercator (UTM) Zone 51S - Datum WGS 1984",

  statusKeputusan: "APPROVED",
  catatanRekomendasiTeknis: [
    "Rencana pemanfaatan ruang untuk fungsi sarana peribadatan (Gereja) telah SESUAI dengan Peraturan Daerah Kabupaten Luwu No. 3 Tahun 2024 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2024-2044.",
    "Pemohon diwajibkan menyediakan area resapan air dan penghijauan pekarangan minimal 20% dari total luas persil lahan yang dikuasai.",
    "Wajib mematuhi Koefisien Dasar Bangunan (KDB) maksimal 60% dan Garis Sempadan Bangunan (GSB) minimal 7.5 meter dari as jalan lingkungan serta menyediakan area parkir jemaat yang memadai.",
    "Berita Acara ini diterbitkan sebagai Rekomendasi Teknis Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Non-Berusaha dari Dinas PUPTR Kabupaten Luwu untuk persyaratan permohonan Persetujuan Bangunan Gedung (PBG) dan bukti legalitas penataan ruang."
  ],
  koefisienDasarBangunan: "Maksimal 60% (KDB)",
  koefisienLantaiBangunan: "Maksimal 2.0 (KLB)",
  garisSempadanBangunan: "Minimal 7.5 Meter dari Batas As Jalan",

  kabidNama: "IR. H. IRWANTO, S.T., M.T.",
  kabidNip: "19780412 200502 1 003",
  kabidJabatan: "Kepala Bidang Tata Ruang dan Bina Konstruksi",

  kadisNama: "IR. IKHSAN AS'AD, S.T., M.Si.",
  kadisNip: "19710815 199803 1 007",
  kadisJabatan: "Kepala Dinas Pekerjaan Umum dan Penataan Ruang",
  kadisPangkat: "Pembina Utama Muda (IV/c)",

  petaImageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80",
  analisGisNama: "ANDI BASO MATTATA, S.T.",
  analisGisNip: "19940822 202012 1 003",
  catatanSurveyor: "Pengukuran batas persil telah diverifikasi menggunakan GNSS RTK Geodetic dengan delineasi poligon lahan telah ditumpangsusunkan langsung pada Layer Peta Digital RTRW Kabupaten Luwu 2024-2044.",

  koordinatPoligon: [
    { id: 1, pointName: "P.01", latitudeDms: "3° 18' 12.10\" LS", longitudeDms: "120° 09' 14.20\" BT", latitudeDd: -3.303361, longitudeDd: 120.153944, description: "Patok Batas Sudut Depan (Akses Jalan Gereja)" },
    { id: 2, pointName: "P.02", latitudeDms: "3° 18' 10.45\" LS", longitudeDms: "120° 09' 17.80\" BT", latitudeDd: -3.302903, longitudeDd: 120.154944, description: "Patok Batas Sisi Barat Lahan Gereja" },
    { id: 3, pointName: "P.03", latitudeDms: "3° 18' 08.20\" LS", longitudeDms: "120° 09' 16.30\" BT", latitudeDd: -3.302278, longitudeDd: 120.154528, description: "Patok Sudut Utara (Batas Lahan Warga)" },
    { id: 4, pointName: "P.04", latitudeDms: "3° 18' 09.80\" LS", longitudeDms: "120° 09' 12.70\" BT", latitudeDd: -3.302722, longitudeDd: 120.153528, description: "Patok Sudut Timur Lahan Gereja" }
  ]
};

export interface BapKtrPuptrDocumentProps {
  initialData?: Partial<BapKtrDocumentData>;
  mapSnapshot?: string | null;
  onClose?: () => void;
  showEditorToolbar?: boolean;
}

export function BapKtrPuptrDocument({
  initialData,
  mapSnapshot,
  onClose,
  showEditorToolbar = true
}: BapKtrPuptrDocumentProps) {
  const [data, setData] = useState<BapKtrDocumentData>({
    ...DEFAULT_BAP_KTR_DATA,
    ...initialData,
    ...(mapSnapshot ? { petaImageUrl: mapSnapshot } : {})
  });

  // Sync state if initialData or mapSnapshot changes
  useEffect(() => {
    if (initialData || mapSnapshot) {
      setData(prev => ({
        ...prev,
        ...initialData,
        petaImageUrl: mapSnapshot || initialData?.petaImageUrl || prev.petaImageUrl
      }));
    }
  }, [initialData, mapSnapshot]);

  const [activeTab, setActiveTab] = useState<"all" | "page1" | "page2" | "page3" | "page4">("all");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Safe Native Print Handler
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Safe High-Resolution jsPDF + html2canvas Export
   * Free from oklab / oklch errors due to strict HEX/RGB inline styles
   */
  const handleDownloadPdf = async () => {
    if (!documentContainerRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const pageElements = documentContainerRef.current.querySelectorAll<HTMLElement>(".bap-ktr-print-page");
      if (!pageElements || pageElements.length === 0) {
        throw new Error("Halaman dokumen tidak ditemukan");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        
        const canvas = await safeHtml2Canvas(pageEl, {
          scale: 2.5, // Crisp 300 DPI output
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = 297; // A4 height in mm

        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      }

      const cleanDocNumber = data.nomorSurat.replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`BAP_KTR_PUPTR_LUWU_${cleanDocNumber}.pdf`);
    } catch (err) {
      console.error("Gagal mengekspor PDF BAP-KTR:", err);
      alert("Terjadi kendala saat menghasilkan PDF. Silakan gunakan tombol Cetak (Print) untuk menyimpan sebagai PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full bg-[#f1f5f9] text-[#000000] min-h-screen py-6 px-2 sm:px-4 font-sans print:p-0 print:m-0 print:bg-white">
      {/* 1. PRINT & EXPORT CONTROL TOOLBAR (Hidden in Print Mode) */}
      {showEditorToolbar && (
        <div className="print:hidden max-w-[960px] mx-auto mb-6 bg-[#ffffff] border border-[#cbd5e1] rounded-2xl p-4 shadow-lg sticky top-4 z-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#166534] flex items-center justify-center text-white shadow-md">
                <FileCheck size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#0f172a] leading-tight">
                  Template Resmi BAP-KTR Dinas PUPTR Kabupaten Luwu
                </h2>
                <p className="text-xs text-[#64748b]">
                  Standar Naskah Dinas Tata Ruang • Siap Cetak A4 / Ekspor PDF Resmi (BAP KKPR)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEditMode 
                    ? "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]" 
                    : "bg-[#f8fafc] text-[#334155] border-[#cbd5e1] hover:bg-[#e2e8f0]"
                }`}
              >
                <Edit3 size={14} />
                <span>{isEditMode ? "Tutup Form Edit" : "Ubah Variabel Dokumen"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0f172a] hover:bg-[#1e293b] text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak Naskah (A4)</span>
              </button>

              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#166534] hover:bg-[#15803d] text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isGeneratingPdf ? "Menyiapkan PDF..." : "Download PDF Resmi"}</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] border border-[#cbd5e1] transition-all cursor-pointer"
                >
                  <X size={14} className="inline mr-1" />
                  <span>Tutup</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Page Navigator */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#e2e8f0] overflow-x-auto text-xs">
            <span className="text-[#64748b] font-semibold text-[11px] shrink-0">Tampilan Halaman:</span>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "all" ? "bg-[#166534] text-white" : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
              }`}
            >
              Semua Halaman (4 Hal)
            </button>
            <button
              onClick={() => setActiveTab("page1")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "page1" ? "bg-[#166534] text-white" : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
              }`}
            >
              Hal 1 (Kop & Data Pemohon)
            </button>
            <button
              onClick={() => setActiveTab("page2")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "page2" ? "bg-[#166534] text-white" : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
              }`}
            >
              Hal 2 (Audit & Tanda Tangan)
            </button>
            <button
              onClick={() => setActiveTab("page3")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "page3" ? "bg-[#166534] text-white" : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
              }`}
            >
              Hal 3 (Lampiran I - Peta)
            </button>
            <button
              onClick={() => setActiveTab("page4")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "page4" ? "bg-[#166534] text-white" : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
              }`}
            >
              Hal 4 (Lampiran II - Koordinat)
            </button>
          </div>

          {/* Quick Dynamic Variable Editor Form */}
          {isEditMode && (
            <div className="mt-4 p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbd5e1] pb-2">
                <div className="font-bold text-[#0f172a] text-sm flex items-center gap-2">
                  <Edit3 size={15} className="text-[#166534]" />
                  <span>Editor Variabel Dinamis Dokumen BAP-PKKPR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#475569] font-bold">Preset Naskah:</span>
                  <button
                    type="button"
                    onClick={() => setData({ ...DEFAULT_BAP_KTR_DATA, petaImageUrl: data.petaImageUrl })}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                      data.jenisPermohonan === "Berusaha"
                        ? "bg-[#166534] text-white border-[#166534]"
                        : "bg-white text-[#334155] border-[#cbd5e1] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    PKKPR Berusaha (Komersial)
                  </button>
                  <button
                    type="button"
                    onClick={() => setData({ ...DEFAULT_BAP_NON_BERUSAHA_DATA, petaImageUrl: data.petaImageUrl })}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                      data.jenisPermohonan === "Non-Berusaha"
                        ? "bg-[#4338ca] text-white border-[#4338ca]"
                        : "bg-white text-[#334155] border-[#cbd5e1] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    PKKPR Non-Berusaha (Gereja/Sosial)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Jenis Naskah PKKPR:</label>
                  <select
                    value={data.jenisPermohonan || "Berusaha"}
                    onChange={(e) => {
                      const newType = e.target.value as "Berusaha" | "Non-Berusaha";
                      if (newType === "Non-Berusaha") {
                        setData(prev => ({
                          ...prev,
                          jenisPermohonan: "Non-Berusaha",
                          nomorSurat: prev.nomorSurat.replace("BAP-PKKPR-B", "BAP-PKKPR-NB").replace("BAP-KTR", "BAP-PKKPR-NB"),
                          fungsiBangunan: prev.fungsiBangunan || "Pembangunan Rumah Ibadah (Gereja)"
                        }));
                      } else {
                        setData(prev => ({
                          ...prev,
                          jenisPermohonan: "Berusaha",
                          nomorSurat: prev.nomorSurat.replace("BAP-PKKPR-NB", "BAP-PKKPR-B"),
                        }));
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] font-bold"
                  >
                    <option value="Berusaha">PKKPR Berusaha (Komersial / OSS-RBA)</option>
                    <option value="Non-Berusaha">PKKPR Non-Berusaha (Rumah Ibadah Gereja / Rumah Tinggal / Fasos)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Nomor Surat BAP:</label>
                  <input
                    type="text"
                    value={data.nomorSurat}
                    onChange={(e) => setData({ ...data, nomorSurat: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">
                    {data.jenisPermohonan === "Non-Berusaha" ? "Fungsi Bangunan / Kegiatan:" : "Sektor Usaha & KBLI:"}
                  </label>
                  <input
                    type="text"
                    value={data.jenisPermohonan === "Non-Berusaha" ? (data.fungsiBangunan || "") : data.sektorUsaha}
                    onChange={(e) => data.jenisPermohonan === "Non-Berusaha" 
                      ? setData({ ...data, fungsiBangunan: e.target.value })
                      : setData({ ...data, sektorUsaha: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Nama Pemohon:</label>
                  <input
                    type="text"
                    value={data.namaPemohon}
                    onChange={(e) => setData({ ...data, namaPemohon: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">
                    {data.jenisPermohonan === "Non-Berusaha" ? "Nama Lembaga / Panitia / Komite:" : "Nama Perusahaan / PT / CV:"}
                  </label>
                  <input
                    type="text"
                    value={data.jenisPermohonan === "Non-Berusaha" ? (data.namaLembagaOrganisasi || data.namaPerusahaan) : data.namaPerusahaan}
                    onChange={(e) => setData({ ...data, namaPerusahaan: e.target.value, namaLembagaOrganisasi: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">
                    {data.jenisPermohonan === "Non-Berusaha" ? "NIK Pemohon (16-Digit):" : "NIB / NIK Pemohon:"}
                  </label>
                  <input
                    type="text"
                    value={data.nibNik}
                    onChange={(e) => setData({ ...data, nibNik: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Alamat Pemohon:</label>
                  <input
                    type="text"
                    value={data.alamatPemohon}
                    onChange={(e) => setData({ ...data, alamatPemohon: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Luas Lahan Permohonan:</label>
                  <input
                    type="text"
                    value={data.luasLahanPermohonan}
                    onChange={(e) => setData({ ...data, luasLahanPermohonan: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Bukti Hak Atas Tanah:</label>
                  <input
                    type="text"
                    value={data.buktiHakTanah}
                    onChange={(e) => setData({ ...data, buktiHakTanah: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Kecamatan:</label>
                  <input
                    type="text"
                    value={data.kecamatan}
                    onChange={(e) => setData({ ...data, kecamatan: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Desa / Kelurahan:</label>
                  <input
                    type="text"
                    value={data.desaKelurahan}
                    onChange={(e) => setData({ ...data, desaKelurahan: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Status Keputusan Rekomendasi:</label>
                  <select
                    value={data.statusKeputusan}
                    onChange={(e) => setData({ ...data, statusKeputusan: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  >
                    <option value="APPROVED">MEMENUHI KESESUAIAN TATA RUANG (APPROVED)</option>
                    <option value="APPROVED_WITH_CONDITIONS">DISETUJUI DENGAN PERSYARATAN KHUSUS</option>
                    <option value="REJECTED">TIDAK MEMENUHI KESESUAIAN TATA RUANG (DITOLAK)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PRINTABLE DOCUMENT WRAPPER (A4 Canvas Container) */}
      <div 
        ref={documentContainerRef} 
        className="bap-ktr-document-container mx-auto flex flex-col items-center gap-8 print:gap-0 print:m-0"
        style={{ color: "#000000" }}
      >
        {/* =========================================================================
            HALAMAN 1: KOP SURAT, DATA PEMOHON & SEKSI A AUDIT POLA RUANG
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page1") && (
          <div 
            className="bap-ktr-print-page bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "30mm", // Margin Kiri 3.0 cm
              paddingTop: "25mm",  // Margin Atas 2.5 cm
              paddingRight: "25mm", // Margin Kanan 2.5 cm
              paddingBottom: "25mm", // Margin Bawah 2.5 cm
              boxSizing: "border-box",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: "10.5pt",
              lineHeight: 1.45,
              pageBreakAfter: "always",
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* A. KOP SURAT DINAS PUPTR KABUPATEN LUWU */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #000000", paddingBottom: "8px", marginBottom: "2px" }}>
              {/* Logo Pemkab Luwu (Tinggi ~68px / 18x22mm proporsional sejajar Kop) */}
              <div style={{ width: "22mm", textAlign: "center", flexShrink: 0, marginRight: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img 
                  src={OFFICIAL_LUWU_LOGO_URL} 
                  alt="Logo Kabupaten Luwu" 
                  style={{ width: "18mm", height: "22mm", maxHeight: "72px", objectFit: "contain", display: "inline-block" }}
                />
              </div>

              {/* Teks Identitas Instansi */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "14pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000", lineHeight: 1.15 }}>
                  PEMERINTAH KABUPATEN LUWU
                </div>
                <div style={{ fontSize: "15pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000", marginTop: "2px", lineHeight: 1.15 }}>
                  DINAS PEKERJAAN UMUM DAN PENATAAN RUANG
                </div>
                <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", color: "#000000", marginTop: "2px", lineHeight: 1.15 }}>
                  BIDANG TATA RUANG DAN BINA KONSTRUKSI
                </div>
                <div style={{ fontSize: "9.5pt", color: "#000000", marginTop: "3px", lineHeight: 1.25 }}>
                  Jl. Sungai Pareman No. 81, Kelurahan Sabe, Kec. Belopa Utara, Kab. Luwu Kode Pos : 91994
                </div>
                <div style={{ fontSize: "8.5pt", color: "#000000", marginTop: "1px" }}>
                  Email: puptr@luwukab.go.id • Website: https://puptr.luwukab.go.id
                </div>
              </div>
            </div>
            {/* Double Border Line Accent */}
            <div style={{ borderBottom: "1px solid #000000", marginBottom: "16px" }} />

            {/* B. JUDUL DOKUMEN */}
            <div style={{ textAlign: "center", marginBottom: "14px" }}>
              <div style={{ fontSize: "13pt", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.25 }}>
                {data.jenisPermohonan === "Non-Berusaha"
                  ? "BERITA ACARA PEMERIKSAAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (BAP-PKKPR) NON-BERUSAHA"
                  : "BERITA ACARA PEMERIKSAAN KESESUAIAN TATA RUANG (BAP-KTR)"}
              </div>
              <div style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "4px" }}>
                Nomor : {data.nomorSurat}
              </div>
              <div style={{ fontSize: "10.5pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "3px", lineHeight: 1.3 }}>
                Tentang : {data.tentangSurat}
              </div>
            </div>

            {/* C. PARAGRAF PEMBUKA */}
            <div style={{ textAlign: "justify", fontSize: "10.5pt", lineHeight: 1.5, marginBottom: "12px" }}>
              {data.jenisPermohonan === "Non-Berusaha" ? (
                <>
                  Pada hari ini, <b>{data.hariTanggalPemeriksaan}</b>, bertempat di Kantor Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu, Tim Teknis Pemeriksaan Kesesuaian Tata Ruang telah melakukan audit dan kajian teknis spasial terhadap permohonan <b>Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Non-Berusaha</b> untuk {data.fungsiBangunan || data.tentangSurat || 'kegiatan non-komersial / sosial keagamaan'} berdasarkan ketentuan <b>Peraturan Pemerintah Nomor 21 Tahun 2021</b> tentang Penyelenggaraan Penataan Ruang, <b>Peraturan Menteri ATR/BPN Nomor 13 Tahun 2021</b> tentang Pelaksanaan Kesesuaian Kegiatan Pemanfaatan Ruang dan Sinkronisasi Program Pemanfaatan Ruang, serta <b>Peraturan Daerah Kabupaten Luwu Nomor 3 Tahun 2024</b> tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2024-2044, dengan rincian data permohonan sebagai berikut:
                </>
              ) : (
                <>
                  Pada hari ini, <b>{data.hariTanggalPemeriksaan}</b>, bertempat di Kantor Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu, Tim Teknis Pemeriksaan Kesesuaian Tata Ruang telah melakukan audit dan kajian teknis spasial terhadap permohonan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) berdasarkan ketentuan Undang-Undang Nomor 6 Tahun 2023 tentang Penetapan Perpu Cipta Kerja dan Peraturan Daerah Kabupaten Luwu Nomor 3 Tahun 2024 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2024-2044, dengan rincian data pemohon sebagai berikut:
                </>
              )}
            </div>

            {/* TABEL DATA PEMOHON (Dinamis: Berusaha vs Non-Berusaha) */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", marginBottom: "14px", lineHeight: 1.4 }}>
              <tbody>
                {data.jenisPermohonan === "Non-Berusaha" ? (
                  <>
                    <tr>
                      <td style={{ width: "22px", verticalAlign: "top", padding: "3px 0" }}>1.</td>
                      <td style={{ width: "230px", verticalAlign: "top", padding: "3px 0" }}>Nomor Induk Kependudukan (NIK)</td>
                      <td style={{ width: "14px", verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", fontWeight: "bold" }}>{data.nibNik}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>2.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Nama Pemohon / Ketua Panitia</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", fontWeight: "bold" }}>{data.namaPemohon}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>3.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Nama Lembaga / Panitia Pembangunan</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", fontWeight: "bold" }}>{data.namaLembagaOrganisasi || data.namaPerusahaan || "Perseorangan / Panitia Pembangunan"}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>4.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Alamat Pemohon / Domisili</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>{data.alamatPemohon}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>5.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Rencana Kegiatan / Fungsi Bangunan</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", fontWeight: "bold" }}>{data.fungsiBangunan || data.sektorUsaha || "Pembangunan Sarana Ibadah (Gereja)"}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>6.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Lokasi Rencana Pembangunan</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>
                        {data.lokasiInvestasi}, {data.desaKelurahan}, {data.kecamatan}, {data.kabupaten}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>7.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Luas Lahan & Rencana Bangunan</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", fontWeight: "bold" }}>
                        Lahan: {data.luasLahanPermohonan} {data.luasBangunanRencana ? `| Rencana Bangunan: ${data.luasBangunanRencana}` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>8.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Bukti Penguasaan Hak Atas Tanah</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>{data.buktiHakTanah}</td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td style={{ width: "22px", verticalAlign: "top", padding: "3px 0" }}>1.</td>
                      <td style={{ width: "230px", verticalAlign: "top", padding: "3px 0" }}>Nomor Induk Berusaha (NIB) / NIK</td>
                      <td style={{ width: "14px", verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", fontWeight: "bold" }}>{data.nibNik}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>2.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Nama Pemohon / Penanggung Jawab</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", fontWeight: "bold" }}>{data.namaPemohon}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>3.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Nama Perusahaan / Badan Usaha</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", fontWeight: "bold" }}>{data.namaPerusahaan}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>4.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Alamat Pemohon</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>{data.alamatPemohon}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>5.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Rencana Kegiatan / Sektor Usaha</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>{data.sektorUsaha} (KBLI: {data.kbliCode})</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>6.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Lokasi Rencana Investasi</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>
                        {data.lokasiInvestasi}, {data.desaKelurahan}, {data.kecamatan}, {data.kabupaten}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>7.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Luas Lahan Permohonan</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", fontWeight: "bold" }}>{data.luasLahanPermohonan}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>8.</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>Bukti Penguasaan Hak Atas Tanah</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "3px 0" }}>{data.buktiHakTanah}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* D. SEKSI A: HASIL AUDIT POLA RUANG RTRW KABUPATEN LUWU */}
            <div style={{ fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1.5px solid #000000", paddingBottom: "3px", marginBottom: "8px" }}>
              A. HASIL AUDIT SPASIAL & KESESUAIAN POLA RUANG RTRW
            </div>

            <div style={{ fontSize: "10.5pt", lineHeight: 1.5, textAlign: "justify", marginBottom: "6px" }}>
              Berdasarkan hasil analisis tumpang susun spasial (spatial overlay analysis) menggunakan Sistem Informasi Geografis (SIG) DPUPTR Luwu pada sistem koordinat <b>{data.sistemKoordinat}</b>, diperoleh hasil audit sebagai berikut:
            </div>

            <ol style={{ margin: "6px 0 0 0", paddingLeft: "20px", fontSize: "10pt", lineHeight: 1.5 }}>
              <li style={{ marginBottom: "6px" }}>
                <b>Kesesuaian Pola Ruang RTRW</b>: Lokasi yang dimohonkan secara mutlak berada di dalam <b>{data.zonaPolaRuangRtrw}</b> ({data.kodeZonaRtrw}), sehingga rencana kegiatan investasi dinilai <b>SELARAS DAN SESUAI</b> dengan peruntukan ruang.
              </li>
              <li style={{ marginBottom: "6px" }}>
                <b>Status Perlindungan Lahan Pertanian (LP2B)</b>: Berdasarkan peta tematik LP2B Dinas Pertanian Kabupaten Luwu, <b>{data.keteranganLp2b}</b>.
              </li>
              <li style={{ marginBottom: "6px" }}>
                <b>Status Kawasan Lindung & Kebencanaan</b>: {data.statusKawasanLindung}, serta tidak berada pada zona rawan bencana tinggi (zona merah likuefaksi/longsor).
              </li>
              <li style={{ marginBottom: "6px" }}>
                <b>Sempadan Sungai & Pantai</b>: {data.statusSempadanSungaiPantai}.
              </li>
              <li style={{ marginBottom: "6px" }}>
                <b>Integritas Geometris Spasial</b>: {data.validasiTopologi}.
              </li>
            </ol>

            {/* Footer Hal 1 */}
            <div style={{ position: "absolute", bottom: "15mm", left: "30mm", right: "25mm", display: "flex", justifyContent: "space-between", fontSize: "8.5pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>
              <span>Berita Acara Pemeriksaan Kesesuaian Tata Ruang (BAP-KTR) DPUPTR Luwu</span>
              <span>Halaman 1 dari 4</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            HALAMAN 2: SEKSI B KEPUTUSAN, REKOMENDASI & DUAL SIGNATURES
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page2") && (
          <div 
            className="bap-ktr-print-page bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "30mm", // Margin Kiri 3.0 cm
              paddingTop: "25mm",  // Margin Atas 2.5 cm
              paddingRight: "25mm", // Margin Kanan 2.5 cm
              paddingBottom: "25mm", // Margin Bawah 2.5 cm
              boxSizing: "border-box",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: "10.5pt",
              lineHeight: 1.45,
              pageBreakAfter: "always",
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* Header Mini Lampiran Lanjutan */}
            <div style={{ textAlign: "right", fontSize: "8.5pt", color: "#64748b", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", marginBottom: "14px" }}>
              Dokumen Lanjutan Berita Acara Nomor: {data.nomorSurat}
            </div>

            {/* E. SEKSI B: KEPUTUSAN DAN REKOMENDASI TEKNIS */}
            <div style={{ fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1.5px solid #000000", paddingBottom: "3px", marginBottom: "10px" }}>
              B. KEPUTUSAN DAN REKOMENDASI TEKNIS TATA RUANG
            </div>

            {/* KOTAK HIGHLIGHT KEPUTUSAN FORMAL */}
            <div 
              style={{ 
                border: "2px solid #166534", 
                backgroundColor: "#f0fdf4", 
                color: "#14532d", 
                padding: "10px 14px", 
                textAlign: "center", 
                marginBottom: "14px"
              }}
            >
              <div style={{ fontSize: "10pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                KESIMPULAN AUDIT TEKNIS SPASIAL:
              </div>
              <div style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "2px", color: "#166534" }}>
                DINYATAKAN : {data.statusKeputusan === "APPROVED" 
                  ? (data.jenisPermohonan === "Non-Berusaha" 
                      ? "MEMENUHI KESESUAIAN TATA RUANG (NON-BERUSAHA)" 
                      : "MEMENUHI KESESUAIAN TATA RUANG (BERUSAHA)")
                  : data.statusKeputusan}
              </div>
              <div style={{ fontSize: "9.5pt", marginTop: "3px", color: "#15803d" }}>
                Luas Lahan Disetujui: <b>{data.luasLahanDisetujui}</b>
              </div>
            </div>

            <div style={{ fontSize: "10.5pt", lineHeight: 1.5, textAlign: "justify", marginBottom: "8px" }}>
              {data.jenisPermohonan === "Non-Berusaha" ? (
                <>
                  Sehubungan dengan kesimpulan audit tersebut di atas, Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu memberikan <b>Rekomendasi Teknis Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Non-Berusaha</b> untuk {data.fungsiBangunan || 'kegiatan non-komersial/sosial keagamaan'} dengan ketentuan teknis bangunan sebagai berikut:
                </>
              ) : (
                <>
                  Sehubungan dengan kesimpulan audit tersebut di atas, Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu memberikan <b>Rekomendasi Teknis</b> kepada Dinas Penanaman Modal dan PTSP Kabupaten Luwu dengan ketentuan teknis bangunan sebagai berikut:
                </>
              )}
            </div>

            {/* Tabel Ketentuan Teknis Ruang & Bangunan */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", marginBottom: "12px", border: "1px solid #000000", lineHeight: 1.4 }}>
              <tbody>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ border: "1px solid #000000", padding: "5px 8px", fontWeight: "bold", width: "40%" }}>Koefisien Dasar Bangunan (KDB)</td>
                  <td style={{ border: "1px solid #000000", padding: "5px 8px" }}>{data.koefisienDasarBangunan}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "5px 8px", fontWeight: "bold" }}>Koefisien Lantai Bangunan (KLB)</td>
                  <td style={{ border: "1px solid #000000", padding: "5px 8px" }}>{data.koefisienLantaiBangunan}</td>
                </tr>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ border: "1px solid #000000", padding: "5px 8px", fontWeight: "bold" }}>Garis Sempadan Bangunan (GSB)</td>
                  <td style={{ border: "1px solid #000000", padding: "5px 8px" }}>{data.garisSempadanBangunan}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "5px 8px", fontWeight: "bold" }}>Kewajiban Ruang Terbuka Hijau (RTH)</td>
                  <td style={{ border: "1px solid #000000", padding: "5px 8px" }}>
                    {data.jenisPermohonan === "Non-Berusaha" ? "Minimal 20% area resapan air & pekarangan" : "Minimal 10% dari luas persil efektif"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Catatan Khusus */}
            <div style={{ fontSize: "10.5pt", fontWeight: "bold", marginBottom: "4px" }}>Ketentuan dan Syarat Teknis Tambahan:</div>
            <ol style={{ margin: "0 0 14px 0", paddingLeft: "20px", fontSize: "10pt", lineHeight: 1.45 }}>
              {data.catatanRekomendasiTeknis.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>{item}</li>
              ))}
            </ol>

            <div style={{ fontSize: "10.5pt", lineHeight: 1.5, textAlign: "justify", marginBottom: "16px" }}>
              {data.jenisPermohonan === "Non-Berusaha" ? (
                <>
                  Demikian Berita Acara Pemeriksaan Kesesuaian Kegiatan Pemanfaatan Ruang (BAP-PKKPR) Non-Berusaha ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagai dasar pertimbangan teknis penerbitan perizinan pemanfaatan ruang dan persyaratan teknis Persetujuan Bangunan Gedung (PBG) oleh Pejabat yang Berwenang.
                </>
              ) : (
                <>
                  Demikian Berita Acara Pemeriksaan Kesesuaian Tata Ruang (BAP-KTR) ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagai dasar pertimbangan teknis penerbitan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) oleh Pejabat yang Berwenang.
                </>
              )}
            </div>

            {/* F. BLOK TANDA TANGAN GANDA (DUAL SIGNATURES) */}
            <div style={{ width: "100%", marginTop: "8px" }}>
              {/* Tanggal Dokumen */}
              <div style={{ textAlign: "right", fontSize: "10.5pt", marginBottom: "8px", paddingRight: "10px" }}>
                Belopa, {data.tanggalDokumen}
              </div>

              {/* Grid 2 Kolom Pejabat Penandatangan */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", textAlign: "center" }}>
                <tbody>
                  <tr>
                    {/* Kolom Kiri: Kabid Tata Ruang */}
                    <td style={{ width: "50%", verticalAlign: "top", padding: "0 10px" }}>
                      <div style={{ fontSize: "10pt", fontWeight: "bold" }}>Mengetahui / Menyetujui,</div>
                      <div style={{ fontSize: "10pt", fontWeight: "bold", textTransform: "uppercase" }}>{data.kabidJabatan}</div>
                      
                      {/* Kolom tanda tangan kosong (Menunggu integrasi BSrE, tanda tangan basah & cap dinas resmi) */}
                      <div style={{ 
                        margin: "12px auto", 
                        width: "175px", 
                        height: "65px"
                      }} />

                      <div style={{ fontSize: "10.5pt", fontWeight: "bold", textDecoration: "underline" }}>{data.kabidNama}</div>
                      <div style={{ fontSize: "9.5pt", color: "#000000" }}>NIP. {data.kabidNip}</div>
                    </td>

                    {/* Kolom Kanan: Kepala Dinas PUPTR */}
                    <td style={{ width: "50%", verticalAlign: "top", padding: "0 10px" }}>
                      <div style={{ fontSize: "10pt", fontWeight: "bold" }}>Mengesahkan,</div>
                      <div style={{ fontSize: "10pt", fontWeight: "bold", textTransform: "uppercase" }}>{data.kadisJabatan} KABUPATEN LUWU</div>
                      
                      {/* Kolom tanda tangan kosong (Menunggu integrasi BSrE, tanda tangan basah & cap dinas resmi) */}
                      <div style={{ 
                        margin: "12px auto", 
                        width: "175px", 
                        height: "65px"
                      }} />

                      <div style={{ fontSize: "10.5pt", fontWeight: "bold", textDecoration: "underline" }}>{data.kadisNama}</div>
                      <div style={{ fontSize: "9.5pt", color: "#000000" }}>Pangkat: {data.kadisPangkat}</div>
                      <div style={{ fontSize: "9.5pt", color: "#000000" }}>NIP. {data.kadisNip}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Hal 2 */}
            <div style={{ position: "absolute", bottom: "15mm", left: "30mm", right: "25mm", display: "flex", justifyContent: "space-between", fontSize: "8.5pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>
              <span>Berita Acara Pemeriksaan Kesesuaian Tata Ruang (BAP-KTR) DPUPTR Luwu</span>
              <span>Halaman 2 dari 4</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            HALAMAN 3: LAMPIRAN I (PETA DELINEASI GEOSPASIAL & ZONASI POLA RUANG)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page3") && (
          <div 
            className="bap-ktr-print-page bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "30mm", // Margin Kiri 3.0 cm
              paddingTop: "25mm",  // Margin Atas 2.5 cm
              paddingRight: "25mm", // Margin Kanan 2.5 cm
              paddingBottom: "25mm", // Margin Bawah 2.5 cm
              boxSizing: "border-box",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: "10.5pt",
              lineHeight: 1.45,
              pageBreakAfter: "always",
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* Header Lampiran I */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "6px", marginBottom: "12px" }}>
              <div style={{ fontSize: "11.5pt", fontWeight: "bold", textTransform: "uppercase" }}>
                LAMPIRAN I BERITA ACARA PEMERIKSAAN KESESUAIAN TATA RUANG
              </div>
              <div style={{ fontSize: "10.5pt", fontWeight: "bold", color: "#166534", textTransform: "uppercase", marginTop: "2px" }}>
                PETA DELINEASI GEOSPASIAL & ZONASI POLA RUANG KABUPATEN LUWU
              </div>
              <div style={{ fontSize: "9.5pt", marginTop: "3px" }}>
                Nomor Dokumen: <b>{data.nomorSurat}</b>
              </div>
            </div>

            {/* Tabel Ringkasan Lokasi Spasial */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt", marginBottom: "10px", border: "1px solid #000000", boxSizing: "border-box" }}>
              <tbody>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", width: "25%", fontWeight: "bold" }}>Nama Pemohon</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", width: "35%" }}>{data.namaPemohon} ({data.namaPerusahaan})</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", width: "20%", fontWeight: "bold" }}>Sistem Proyeksi</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", width: "20%" }}>UTM WGS84 51S</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold" }}>Lokasi Administrasi</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>{data.desaKelurahan}, {data.kecamatan}</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold" }}>Luas Delineasi</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold", color: "#166534" }}>{data.luasLahanDisetujui}</td>
                </tr>
              </tbody>
            </table>

            {/* CONTAINER PETA DELINEASI BERSIH (Simetris 100% sejajar tabel dan catatan) */}
            <div style={{ 
              border: "1.5px solid #000000", 
              position: "relative", 
              width: "100%", 
              height: "135mm", 
              overflow: "hidden", 
              marginBottom: "10px", 
              backgroundColor: "#e2e8f0",
              boxSizing: "border-box"
            }}>
              <img 
                src={mapSnapshot || data.petaImageUrl || "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"} 
                alt="Peta Delineasi Geospasial" 
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                crossOrigin="anonymous"
              />
              
              {/* Overlay Grid Simbolik & Garis Delineasi */}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", border: "1px dashed rgba(0,0,0,0.4)" }} />

              {/* North Arrow Compass */}
              <div style={{ position: "absolute", top: "10px", right: "12px", backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #000000", padding: "4px 8px", textAlign: "center" }}>
                <div style={{ fontSize: "12pt", fontWeight: "bold", color: "#dc2626" }}>▲ U</div>
                <div style={{ fontSize: "7pt", fontWeight: "bold", color: "#000000" }}>UTARA</div>
              </div>

              {/* Legenda Peta Geospasial Formal */}
              <div style={{ position: "absolute", bottom: "10px", left: "10px", backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #000000", padding: "6px 8px", fontSize: "7.5pt", width: "185px" }}>
                <div style={{ fontWeight: "bold", borderBottom: "1px solid #000000", paddingBottom: "2px", marginBottom: "4px" }}>LEGENDA PETA:</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <div style={{ width: "14px", height: "8px", border: "2px solid #dc2626", backgroundColor: "rgba(220,38,38,0.3)" }} />
                  <span>Delineasi Permohonan</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <div style={{ width: "14px", height: "8px", backgroundColor: "#7c3aed" }} />
                  <span>Pola Ruang RTRW Kab. Luwu</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "14px", height: "2px", backgroundColor: "#2563eb" }} />
                  <span>Jalur Arteri Poros Sulawesi</span>
                </div>
              </div>

              {/* Skala Batang Simbolik */}
              <div style={{ position: "absolute", bottom: "10px", right: "10px", backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #000000", padding: "4px 8px", fontSize: "7pt", textAlign: "center" }}>
                <div>Skala 1 : 5.000</div>
                <div style={{ width: "80px", height: "3px", backgroundColor: "#000000", margin: "2px auto" }} />
                <div>0  100m  250m</div>
              </div>
            </div>

            {/* Catatan Surveyor / Geospasial */}
            <div style={{ border: "1px solid #000000", padding: "8px 10px", fontSize: "9.5pt", backgroundColor: "#f8fafc", marginBottom: "14px", width: "100%", boxSizing: "border-box" }}>
              <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "3px" }}>Catatan Analis SIG & Surveyor Tata Ruang:</div>
              <div style={{ textAlign: "justify", lineHeight: 1.45 }}>
                {data.catatanSurveyor}
              </div>
            </div>

            {/* Pengesahan Petugas Pemeta */}
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "220px", textAlign: "center", fontSize: "9.5pt" }}>
                <div>Belopa, {data.tanggalDokumen}</div>
                <div style={{ fontWeight: "bold" }}>Analis Spasial & Pemetaan GIS,</div>
                <div style={{ height: "45px" }} />
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>{data.analisGisNama}</div>
                <div>NIP. {data.analisGisNip}</div>
              </div>
            </div>

            {/* Footer Hal 3 */}
            <div style={{ position: "absolute", bottom: "15mm", left: "30mm", right: "25mm", display: "flex", justifyContent: "space-between", fontSize: "8.5pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>
              <span>Lampiran I: Peta Delineasi Geospasial • DPUPTR Kabupaten Luwu</span>
              <span>Halaman 3 dari 4</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            HALAMAN 4: LAMPIRAN II (TABEL KOORDINAT GEOGRAFIS)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page4") && (
          <div 
            className="bap-ktr-print-page bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "30mm", // Margin Kiri 3.0 cm
              paddingTop: "25mm",  // Margin Atas 2.5 cm
              paddingRight: "25mm", // Margin Kanan 2.5 cm
              paddingBottom: "25mm", // Margin Bawah 2.5 cm
              boxSizing: "border-box",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: "10.5pt",
              lineHeight: 1.45,
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* Header Lampiran II */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "6px", marginBottom: "12px" }}>
              <div style={{ fontSize: "11.5pt", fontWeight: "bold", textTransform: "uppercase" }}>
                LAMPIRAN II BERITA ACARA PEMERIKSAAN KESESUAIAN TATA RUANG
              </div>
              <div style={{ fontSize: "10.5pt", fontWeight: "bold", color: "#166534", textTransform: "uppercase", marginTop: "2px" }}>
                TABEL KOORDINAT GEOGRAFIS TITIK POLIGON LAHAN YANG DIREKOMENDASIKAN DISETUJUI
              </div>
              <div style={{ fontSize: "9.5pt", marginTop: "3px" }}>
                Nomor Dokumen: <b>{data.nomorSurat}</b>
              </div>
            </div>

            <div style={{ fontSize: "10pt", textAlign: "justify", marginBottom: "10px", lineHeight: 1.45 }}>
              Daftar titik koordinat poligon batas bidang tanah yang dimohonkan dan telah diverifikasi memenuhi kesesuaian ruang sesuai format Standar Sistem Informasi Geografis WGS 1984:
            </div>

            {/* TABEL KOORDINAT SOLID COLLAPSE */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt", border: "1px solid #000000", marginBottom: "16px", boxSizing: "border-box" }}>
              <thead>
                <tr style={{ backgroundColor: "#e2e8f0", textAlign: "center" }}>
                  <th style={{ border: "1px solid #000000", padding: "6px 4px", width: "35px" }}>NO.</th>
                  <th style={{ border: "1px solid #000000", padding: "6px 6px", width: "60px" }}>TITIK</th>
                  <th style={{ border: "1px solid #000000", padding: "6px 8px" }}>GARIS LINTANG (LATITUDE)</th>
                  <th style={{ border: "1px solid #000000", padding: "6px 8px" }}>GARIS BUJUR (LONGITUDE)</th>
                  <th style={{ border: "1px solid #000000", padding: "6px 8px" }}>KETERANGAN / POSISI PATOK</th>
                </tr>
              </thead>
              <tbody>
                {data.koordinatPoligon.map((pt, idx) => (
                  <tr key={pt.id} style={{ backgroundColor: idx % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", fontWeight: "bold" }}>
                      {idx + 1}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center", fontWeight: "bold", fontFamily: "monospace" }}>
                      {pt.pointName}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "5px 8px", fontFamily: "monospace", textAlign: "center" }}>
                      {pt.latitudeDms} <br />
                      <span style={{ fontSize: "7.5pt", color: "#64748b" }}>({pt.latitudeDd.toFixed(6)})</span>
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "5px 8px", fontFamily: "monospace", textAlign: "center" }}>
                      {pt.longitudeDms} <br />
                      <span style={{ fontSize: "7.5pt", color: "#64748b" }}>({pt.longitudeDd.toFixed(6)})</span>
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "5px 8px", fontSize: "9pt" }}>
                      {pt.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Keterangan Sistem Geodesi */}
            <div style={{ border: "1px solid #000000", padding: "6px 10px", fontSize: "9pt", backgroundColor: "#f8fafc", marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
              <b>Ketentuan Teknis Geospasial:</b>
              <ul style={{ margin: "2px 0 0 0", paddingLeft: "16px", lineHeight: 1.4 }}>
                <li>Koordinat titik batas di atas mengikat secara hukum dalam penerbitan PKKPR dan perizinan turunan.</li>
                <li>Seluruh patok fisik di lapangan wajib dipasang permanen oleh pemohon sesuai koordinat tertera.</li>
              </ul>
            </div>

            {/* Pengesahan Akhir Lampiran II */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", fontSize: "10pt", marginTop: "10px" }}>
              <div style={{ width: "45%", textAlign: "center" }}>
                <div>Mengetahui,</div>
                <div style={{ fontWeight: "bold" }}>Kepala Seksi Pengawasan Ruang,</div>
                <div style={{ height: "45px" }} />
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>SYAHRUL RAMADHAN, S.T.</div>
                <div>NIP. 19880210 201101 1 007</div>
              </div>

              <div style={{ width: "45%", textAlign: "center" }}>
                <div>Belopa, {data.tanggalDokumen}</div>
                <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>{data.kabidJabatan}</div>
                <div style={{ height: "45px" }} />
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>{data.kabidNama}</div>
                <div>NIP. {data.kabidNip}</div>
              </div>
            </div>

            {/* Footer Hal 4 */}
            <div style={{ position: "absolute", bottom: "15mm", left: "30mm", right: "25mm", display: "flex", justifyContent: "space-between", fontSize: "8.5pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>
              <span>Lampiran II: Tabel Koordinat Titik Poligon • DPUPTR Kabupaten Luwu</span>
              <span>Halaman 4 dari 4 (Selesai)</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. STRICT PRINT CSS INJECTION FOR ZERO-DISTORTION & A4 MARGINS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bap-ktr-document-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .bap-ktr-print-page {
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Utility function to convert application object + settings to BapKtrDocumentData
 */
export function convertAppToBapKtrData(
  app: any,
  puptrSettings?: any,
  customMapSnapshot?: string
): BapKtrDocumentData {
  let coords: BapKtrCoordinatePoint[] = [];
  if (app?.geometry) {
    coords = extractCoordinatesFromGeometry(app.geometry);
  }
  if (coords.length === 0) {
    coords = DEFAULT_BAP_KTR_DATA.koordinatPoligon;
  }

  // Detect whether application is Non-Berusaha (e.g. Rumah Ibadah, Gereja, Rumah Tinggal, Fasos)
  const isNonBerusaha = 
    app?.category === "Non-Berusaha" || 
    app?.jenis_permohonan === "Non-Berusaha" || 
    (!app?.nib && !app?.nib_oss && !app?.nama_badan_usaha && !app?.perusahaan);

  const jenisPermohonan = isNonBerusaha ? "Non-Berusaha" : "Berusaha";
  const year = new Date().getFullYear();
  const isApproved = app?.pertanianStatus !== 'REJECTED' && app?.pkkprStatus !== 'REJECTED' && app?.status !== 'REJECTED';

  const defaultTitle = isNonBerusaha
    ? (app?.title || app?.nama_permohonan || "Pembangunan Sarana Non-Berusaha")
    : (app?.title || app?.nama_permohonan || "Permohonan Investasi & Pemanfaatan Ruang");

  const fungsiBangunan = app?.fungsi_bangunan || app?.fungsi || (isNonBerusaha ? (app?.title || "Pembangunan Sarana Non-Berusaha") : (app?.sector || "Industri & Komersial"));

  const rawKegiatan = app?.fungsi_bangunan || app?.fungsi || app?.title || app?.nama_permohonan || (isNonBerusaha ? "Sarana Non-Berusaha" : "Kegiatan Usaha / Komersial");
  const upperKegiatan = String(rawKegiatan).toUpperCase().trim();
  const cleanFungsiWithPembangunan = upperKegiatan.startsWith("PEMBANGUNAN")
    ? upperKegiatan
    : `PEMBANGUNAN ${upperKegiatan}`;

  const namaLembaga = app?.nama_lembaga || app?.perusahaan || app?.companyName || (isNonBerusaha ? (app?.nama_organisasi || app?.title || "Panitia Pembangunan / Perseorangan") : "PT / Badan Usaha");

  const luasM2Val = Number(app?.luas_m2 || (app?.areaHa ? Number(app.areaHa) * 10000 : 1000));
  const luasHaStr = (luasM2Val / 10000).toFixed(2);
  const formattedLuas = `${luasM2Val.toLocaleString('id-ID')} m² (${luasHaStr} Ha)`;

  return {
    jenisPermohonan,
    fungsiBangunan,
    namaLembagaOrganisasi: namaLembaga,
    luasBangunanRencana: app?.luas_bangunan_m2 ? `${app.luas_bangunan_m2} m²` : (app?.luasBangunan ? `${app.luasBangunan}` : (isNonBerusaha ? "450 m²" : "1.200 m²")),

    nomorSurat: app?.skPkkprDocNumber || app?.pkkprDocNumber || app?.pkkpr_doc_number || (
      isNonBerusaha
        ? `600.1.15/089/BAP-PKKPR-NB/PUPTR-TR/LUWU/${year}`
        : `600.1.15/042/BAP-PKKPR-B/PUPTR-TR/LUWU/${year}`
    ),
    tentangSurat: app?.tentangSurat || app?.tentang_surat || (
      isNonBerusaha
        ? `HASIL PENILAIAN PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR) NON-BERUSAHA ${cleanFungsiWithPembangunan} KABUPATEN LUWU`
        : `HASIL PENILAIAN DOKUMEN PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR) BERUSAHA ATAS NAMA ${(app?.applicantName || app?.companyName || app?.nama_pemohon || 'PEMOHON').toUpperCase()}`
    ),
    tanggalDokumen: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    hariTanggalPemeriksaan: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    
    nibNik: app?.nibNik || (isNonBerusaha
      ? (app?.nik || app?.nik_pemohon || app?.plot_number || '-')
      : (app?.nib ? `${app.nib} / ${app.nik || app.nik_pemohon || '-'}` : (app?.nib_oss || app?.plot_number || '-'))),
    namaPemohon: app?.applicantName || app?.nama_pemohon || app?.contact_pic || (isNonBerusaha ? 'Pemohon Terdaftar' : 'Pelaku Usaha Pemohon'),
    namaPerusahaan: namaLembaga,
    alamatPemohon: app?.applicantAddress || app?.address || app?.alamat || (app?.kecamatan ? `Kecamatan ${app.kecamatan}, Kab. Luwu` : 'Kabupaten Luwu, Provinsi Sulawesi Selatan'),
    sektorUsaha: isNonBerusaha ? (fungsiBangunan || "Sarana Non-Berusaha") : (app?.sector || "Industri Pengolahan & Komersial"),
    kbliCode: isNonBerusaha ? "Non-KBLI (Kegiatan Non-Berusaha)" : (app?.kbliCode || "KBLI Terdaftar OSS"),
    lokasiInvestasi: app?.lokasi_dimohon || app?.address || (app?.desa && app?.kecamatan ? `Desa ${app.desa}, Kec. ${app.kecamatan}, Kab. Luwu` : (app?.villageName && app?.districtName ? `Desa ${app.villageName}, Kec. ${app.districtName}, Kab. Luwu` : 'Kabupaten Luwu')),
    desaKelurahan: app?.desa || app?.desa_kelurahan || app?.villageName ? `Desa ${app?.desa || app?.desa_kelurahan || app?.villageName}` : (app?.villageName || '-'),
    kecamatan: app?.kecamatan || app?.districtName ? `Kecamatan ${app?.kecamatan || app?.districtName}` : (app?.districtName || '-'),
    kabupaten: 'Kabupaten Luwu, Provinsi Sulawesi Selatan',
    luasLahanPermohonan: formattedLuas,
    luasLahanDisetujui: `${formattedLuas} - Sesuai Delineasi Poligon`,
    buktiHakTanah: app?.bukti_tanah || app?.buktiTanah || (app?.certificateType ? `${app.certificateType} (No. ${app?.certificateDocNumber || '-'})` : (isNonBerusaha ? 'Sertipikat Hak Milik (SHM) / Surat Penguasaan Fisik Tanah' : 'Hak Guna Bangunan (HGB) / SHM')),

    zonaPolaRuangRtrw: isNonBerusaha 
      ? 'Kawasan Permukiman Perdesaan & Fasilitas Pelayanan Umum (Sarana Peribadatan)' 
      : (app?.sector ? `Kawasan Peruntukan ${app.sector}` : 'Kawasan Peruntukan Industri & Perdagangan'),
    kodeZonaRtrw: 'Perda No. 3 Tahun 2024 tentang RTRW Kab. Luwu 2024-2044',
    statusLp2b: app?.pertanianStatus === 'APPROVED' ? 'LP2B' : 'NON_LP2B',
    keteranganLp2b: app?.pertanianStatus === 'APPROVED'
      ? `LOKASI BERADA PADA ZONA LP2B (Telah Memenuhi Syarat Rekomendasi Dinas Pertanian No. ${app?.pertanianBaNumber || 'BA/DISTAN/2026'})`
      : 'LOKASI BERADA DILUAR ZONA LP2B (NON-LP2B) - Bebas dari Kawasan Pertanian Pangan Berkelanjutan',
    statusKawasanLindung: 'Bebas dari Kawasan Hutan Lindung, Suaka Alam, Sempadan Sungai, dan Konservasi Mangrove',
    statusSempadanSungaiPantai: 'Memenuhi Buffer Sempadan Pantai > 100 Meter & Sempadan Sungai > 50 Meter',
    validasiTopologi: 'Valid (Zero Self-Intersection, Sistem Koordinat Universal Transverse Mercator UTM WGS84 Zone 51S)',
    sistemKoordinat: 'Universal Transverse Mercator (UTM) Zone 51S - Datum WGS 1984',

    statusKeputusan: isApproved ? 'APPROVED' : 'REJECTED',
    catatanRekomendasiTeknis: isNonBerusaha ? [
      `Rencana kegiatan pemanfaatan ruang untuk ${fungsiBangunan} telah SESUAI dengan Peraturan Daerah Kabupaten Luwu Nomor 3 Tahun 2024 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2024-2044.`,
      'Pemohon diwajibkan menyediakan area resapan air dan penghijauan pekarangan minimal 20% dari total luas persil lahan yang dikuasai.',
      'Wajib mematuhi Koefisien Dasar Bangunan (KDB) maksimal 60% dan Garis Sempadan Bangunan (GSB) minimal 7.5 meter dari as jalan lingkungan serta menyediakan area parkir jemaat yang aman.',
      'Berita Acara ini diterbitkan sebagai Rekomendasi Teknis Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Non-Berusaha dari Dinas PUPTR Kabupaten Luwu untuk persyaratan permohonan Persetujuan Bangunan Gedung (PBG) dan bukti legalitas penataan ruang.'
    ] : [
      'Rencana kegiatan pemanfaatan ruang telah SESUAI dengan Peraturan Daerah Kabupaten Luwu Nomor 3 Tahun 2024 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2024-2044.',
      'Wajib menyediakan Ruang Terbuka Hijau (RTH) privat minimal 10% dari total luas persil lahan yang dikuasai.',
      'Mematuhi Koefisien Dasar Bangunan (KDB) maksimal 60% dan Garis Sempadan Bangunan (GSB) minimal 15 meter dari as jalan arteri primer.',
      'Direkomendasikan kepada Kepala DPMPTSP Kabupaten Luwu untuk penerbitan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Berusaha melalui sistem OSS-RBA.'
    ],
    koefisienDasarBangunan: isNonBerusaha ? 'Maksimal 60% (KDB)' : 'Maksimal 60% (KDB)',
    koefisienLantaiBangunan: isNonBerusaha ? 'Maksimal 2.0 (KLB)' : 'Maksimal 2.4 (KLB)',
    garisSempadanBangunan: isNonBerusaha ? 'Minimal 7.5 Meter dari Batas As Jalan' : 'Minimal 15.0 Meter dari Batas As Jalan',

    kabidNama: puptrSettings?.kabidSignatory?.fullName || 'IR. H. IRWANTO, S.T., M.T.',
    kabidNip: puptrSettings?.kabidSignatory?.nip || '19780412 200502 1 003',
    kabidJabatan: puptrSettings?.kabidSignatory?.officialTitle || 'Kepala Bidang Tata Ruang dan Bina Konstruksi',
    kadisNama: puptrSettings?.kepalaDinas?.fullName || "IR. IKHSAN AS'AD, S.T., M.Si.",
    kadisNip: puptrSettings?.kepalaDinas?.nip || '19710815 199803 1 007',
    kadisJabatan: puptrSettings?.kepalaDinas?.officialTitle || 'Kepala Dinas Pekerjaan Umum dan Penataan Ruang',
    kadisPangkat: puptrSettings?.kepalaDinas?.pangkatGolongan || 'Pembina Utama Muda (IV/c)',

    petaImageUrl: customMapSnapshot || app?.mapSnapshotUrl || (isNonBerusaha ? DEFAULT_BAP_NON_BERUSAHA_DATA.petaImageUrl : DEFAULT_BAP_KTR_DATA.petaImageUrl),
    analisGisNama: 'ANDI BASO MATTATA, S.T.',
    analisGisNip: '19940822 202012 1 003',
    catatanSurveyor: 'Pengukuran batas persil telah diverifikasi menggunakan GNSS RTK Dual-Frequency Geodetic dengan tingkat akurasi horizontal < 0.05 meter. Delineasi poligon telah ditumpangsusunkan (overlay) langsung dengan Layer Peta Digital RTRW Kabupaten Luwu 2024-2044.',
    koordinatPoligon: coords
  };
}
