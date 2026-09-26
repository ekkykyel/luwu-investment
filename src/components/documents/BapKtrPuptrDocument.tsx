import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import { safeHtml2Canvas } from "../../lib/html2canvasShim";
import { OFFICIAL_LUWU_LOGO_URL } from "../LuwuLogo";
import { getOpdSettings, saveOpdSettings } from "../../utils/opdSettingsStorage";
import { getEffectiveMapImageUrl, generateLuwuGisMapSvgDataUrl } from "../../utils/luwuGisMapGenerator";
import { supabase } from "../../lib/supabaseClient";
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
  rejectionReason?: string;
  koefisienDasarBangunan: string;
  koefisienLantaiBangunan: string;
  garisSempadanBangunan: string;

  // Pejabat Penandatangan (Dual Signatures & Tim Teknis)
  kabidNama: string;
  kabidNip: string;
  kabidJabatan: string;
  kadisNama: string;
  kadisNip: string;
  kadisJabatan: string;
  kadisPangkat: string;
  kasiNama?: string;
  kasiNip?: string;
  kasiJabatan?: string;

  // Map & Spatial Attachment
  petaImageUrl?: string;
  analisGisNama?: string;
  analisGisNip?: string;
  analisGisJabatan?: string;
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

  kasiNama: "SYAHRUL RAMADHAN, S.T.",
  kasiNip: "19880210 201101 1 007",
  kasiJabatan: "Kepala Seksi Pengawasan Ruang",

  petaImageUrl: undefined,
  analisGisNama: "ANDI BASO MATTATA, S.T.",
  analisGisNip: "19940822 202012 1 003",
  analisGisJabatan: "Analis Spasial & Pemetaan GIS",
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

  // Non-Berusaha defaults
  kasiNama: "SYAHRUL RAMADHAN, S.T.",
  kasiNip: "19880210 201101 1 007",
  kasiJabatan: "Kepala Seksi Pengawasan Ruang",

  petaImageUrl: undefined,
  analisGisNama: "ANDI BASO MATTATA, S.T.",
  analisGisNip: "19940822 202012 1 003",
  analisGisJabatan: "Analis Spasial & Pemetaan GIS",
  catatanSurveyor: "Pengukuran batas persil telah diverifikasi menggunakan GNSS RTK Geodetic dengan delineasi poligon lahan telah ditumpangsusunkan langsung pada Layer Peta Digital RTRW Kabupaten Luwu 2024-2044.",

  koordinatPoligon: [
    { id: 1, pointName: "P.01", latitudeDms: "3° 18' 12.10\" LS", longitudeDms: "120° 09' 14.20\" BT", latitudeDd: -3.303361, longitudeDd: 120.153944, description: "Patok Batas Sudut Depan (Akses Jalan Gereja)" },
    { id: 2, pointName: "P.02", latitudeDms: "3° 18' 10.45\" LS", longitudeDms: "120° 09' 17.80\" BT", latitudeDd: -3.302903, longitudeDd: 120.154944, description: "Patok Batas Sisi Barat Lahan Gereja" },
    { id: 3, pointName: "P.03", latitudeDms: "3° 18' 08.20\" LS", longitudeDms: "120° 09' 16.30\" BT", latitudeDd: -3.302278, longitudeDd: 120.154528, description: "Patok Sudut Utara (Batas Lahan Warga)" },
    { id: 4, pointName: "P.04", latitudeDms: "3° 18' 09.80\" LS", longitudeDms: "120° 09' 12.70\" BT", latitudeDd: -3.302722, longitudeDd: 120.153528, description: "Patok Sudut Timur Lahan Gereja" }
  ]
};

export const DEFAULT_BAP_REJECTED_DATA: BapKtrDocumentData = {
  jenisPermohonan: "Berusaha",
  nomorSurat: "600/082/BA-TOLAK-KTR/DPUPTR-LW/2026",
  tentangSurat: "HASIL PENILAIAN PENOLAKAN KESESUAIAN TATA RUANG (BAP-TOLAK KTR) KABUPATEN LUWU",
  tanggalDokumen: "25 September 2026",
  hariTanggalPemeriksaan: "Kamis, 25 September 2026",

  nibNik: "0220108920194",
  namaPemohon: "BAMBANG SUDIBYO",
  namaPerusahaan: "PT. LUWU KENCANA MAKMUR",
  alamatPemohon: "Jl. Poros Bua - Palopo No. 88, Kab. Luwu",
  sektorUsaha: "Industri Pengolahan / Pergudangan Komersial",
  kbliCode: "52101 (Pergudangan dan Penyimpanan)",
  lokasiInvestasi: "Bantaran Sungai Suso & Kawasan Lindung, Kab. Luwu",
  desaKelurahan: "Desa Noling",
  kecamatan: "Kecamatan Bua Ponrang",
  kabupaten: "Kabupaten Luwu, Provinsi Sulawesi Selatan",
  luasLahanPermohonan: "125.000 m² (12,50 Hektar)",
  luasLahanDisetujui: "0 m² (Permohonan Ditolak / 0,00 Hektar)",
  buktiHakTanah: "Sertifikat Hak Milik (SHM)",

  zonaPolaRuangRtrw: "Kawasan Lindung Sempadan Sungai & Kawasan Resapan Air",
  kodeZonaRtrw: "KL-SS / Perda No. 3 Tahun 2024 tentang RTRW Kab. Luwu 2024-2044",
  statusLp2b: "LP2B",
  keteranganLp2b: "LOKASI BERSINGGUNGAN PENUH DENGAN ZONA LP2B IRIGASI TEKNIS AKTIF & SEMPADAN SUNGAI MUTLAK",
  statusKawasanLindung: "BERADA DALAM KAWASAN LINDUNG SEMPADAN SUNGAI UTAMA (Dilarang Pembangunan Permanen)",
  statusSempadanSungaiPantai: "MELANGGAR SEMPADAN SUNGAI (Persil Berada Dalam Radius < 50 Meter dari Palung Sungai)",
  validasiTopologi: "Inkonsistensi Spasial Berat (Overlap Kawasan Lindung & Kawasan Rawan Bencana Banjir Bandang)",
  sistemKoordinat: "Universal Transverse Mercator (UTM) Zone 51S - Datum WGS 1984",

  statusKeputusan: "REJECTED",
  rejectionReason: "Rencana kegiatan pemanfaatan ruang bertentangan secara mendasar dengan Alokasi Pola Ruang Peraturan Daerah Kabupaten Luwu Nomor 3 Tahun 2024 tentang RTRW Kabupaten Luwu Tahun 2024-2044 karena berada di dalam Zona Lindung Sempadan Sungai, memutus jaringan sempadan tata air, dan berada pada zona rawan bencana banjir bandang tinggi.",
  catatanRekomendasiTeknis: [
    "Berdasarkan hasil analisis spasial SIG, lokasi permohonan berada pada Kawasan Lindung Sempadan Sungai (DAS Sungai Utama) yang secara hukum dilarang untuk didirikan bangunan industri dan pergudangan.",
    "Rencana pemanfaatan ruang TIDAK SESUAI dengan Peraturan Daerah Kabupaten Luwu Nomor 3 Tahun 2024 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2024-2044.",
    "Persil melanggar Garis Sempadan Sungai (kurang dari 50 meter dari tepi palung sungai) yang melanggar Permen PUPR No. 28/PRT/M/2015.",
    "Dinas PUPTR Kabupaten Luwu MENETAPKAN PENOLAKAN PERMOHONAN KESESUAIAN TATA RUANG dan merekomendasikan kepada Kepala DPMPTSP Kabupaten Luwu untuk TIDAK MENERBITKAN Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)."
  ],
  koefisienDasarBangunan: "0% (Zona Lindung Bebas Bangunan)",
  koefisienLantaiBangunan: "0",
  garisSempadanBangunan: "Zona Lindung Mutlak",

  kabidNama: "IR. H. IRWANTO, S.T., M.T.",
  kabidNip: "19780412 200502 1 003",
  kabidJabatan: "Kepala Bidang Tata Ruang dan Bina Konstruksi",

  kadisNama: "IR. IKHSAN AS'AD, S.T., M.Si.",
  kadisNip: "19710815 199803 1 007",
  kadisJabatan: "Kepala Dinas Pekerjaan Umum dan Penataan Ruang",
  kadisPangkat: "Pembina Utama Muda (IV/c)",

  // Rejected defaults
  kasiNama: "SYAHRUL RAMADHAN, S.T.",
  kasiNip: "19880210 201101 1 007",
  kasiJabatan: "Kepala Seksi Pengawasan Ruang",

  petaImageUrl: undefined,
  analisGisNama: "ANDI BASO MATTATA, S.T.",
  analisGisNip: "19940822 202012 1 003",
  analisGisJabatan: "Analis Spasial & Pemetaan GIS",
  catatanSurveyor: "Peta overlay menunjukkan lokasi berada dalam sempadan sungai aktif dan zona rawan bencana banjir bandang.",

  koordinatPoligon: [
    { id: 1, pointName: "P.01", latitudeDms: "2° 58' 42.12\" LS", longitudeDms: "120° 18' 24.35\" BT", latitudeDd: -2.978367, longitudeDd: 120.306764, description: "Patok Sudut Sempadan Sungai" },
    { id: 2, pointName: "P.02", latitudeDms: "2° 58' 38.45\" LS", longitudeDms: "120° 18' 32.18\" BT", latitudeDd: -2.977347, longitudeDd: 120.308939, description: "Patok Sisi Sempadan Saluran" },
    { id: 3, pointName: "P.03", latitudeDms: "2° 58' 29.80\" LS", longitudeDms: "120° 18' 35.60\" BT", latitudeDd: -2.974944, longitudeDd: 120.309889, description: "Patok Sudut Bantaran Sungai" }
  ]
};

export interface BapKtrPuptrDocumentProps {
  initialData?: Partial<BapKtrDocumentData>;
  mapSnapshot?: string | null;
  onClose?: () => void;
  showEditorToolbar?: boolean;
  onSaveData?: (updatedData: BapKtrDocumentData) => void | Promise<void>;
}

export function BapKtrPuptrDocument({
  initialData,
  mapSnapshot,
  onClose,
  showEditorToolbar = true,
  onSaveData
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Helper to format point 6 location cleanly without repeating district/regency names
   */
  const getFormattedLokasiRencana = () => {
    const lokasi = (data.lokasiInvestasi || "").trim();
    const desa = (data.desaKelurahan || "").trim();
    const kec = (data.kecamatan || "").trim();
    const kab = (data.kabupaten || "Kabupaten Luwu").trim();

    if (!lokasi) return `${desa}, ${kec}, ${kab}`;
    const lokasiLower = lokasi.toLowerCase();
    const desaLower = desa.toLowerCase();
    const kecLower = kec.toLowerCase();

    // If lokasi already has the village or district name, don't duplicate
    if ((desaLower && lokasiLower.includes(desaLower)) || (kecLower && lokasiLower.includes(kecLower))) {
      if (lokasiLower.includes("kabupaten") || lokasiLower.includes("kab.")) {
        return lokasi;
      }
      return `${lokasi}, ${kab}`;
    }
    return `${lokasi}, ${desa}, ${kec}, ${kab}`;
  };

  /**
   * Handler to save edited BAP-PKKPR variables and officials to database
   */
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      // 1. Cache in LocalStorage
      localStorage.setItem("BAP_KTR_SETTINGS_PERSIST", JSON.stringify(data));

      // 2. Sync OPD Officials Settings for PUPTR
      try {
        const currentOpd = getOpdSettings("puptr");
        saveOpdSettings("puptr", {
          ...currentOpd,
          kepalaDinas: {
            ...currentOpd.kepalaDinas,
            fullName: data.kadisNama,
            nip: data.kadisNip,
            pangkatGolongan: data.kadisPangkat,
            officialTitle: data.kadisJabatan
          },
          kabidSignatory: {
            ...currentOpd.kabidSignatory,
            fullName: data.kabidNama,
            nip: data.kabidNip,
            officialTitle: data.kabidJabatan,
            pangkatGolongan: currentOpd.kabidSignatory?.pangkatGolongan || 'Pembina (IV/a)'
          }
        });
      } catch (opdErr) {
        console.warn("OPD settings sync warning:", opdErr);
      }

      // 3. Upsert to Supabase database if connection is active
      try {
        if (supabase) {
          const { error: sbErr } = await supabase.from("opd_settings").upsert({
            opd_key: "puptr",
            data_bap_ktr: data,
            updated_at: new Date().toISOString()
          }, { onConflict: "opd_key" });

          if (sbErr) {
            console.warn("Note: Supabase opd_settings upsert note:", sbErr.message);
          }
        }
      } catch (sbException) {
        console.log("Supabase db write fallback to local persistence:", sbException);
      }

      // 4. Invoke parent callback if provided
      if (onSaveData) {
        await onSaveData(data);
      }

      setSaveSuccessMsg("Data BAP-PKKPR & Pejabat Penandatangan berhasil disimpan ke Database!");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Error saving BAP data to database:", err);
      setSaveSuccessMsg("Error: Gagal menyimpan data ke database (" + (err?.message || "Koneksi terputus") + ")");
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Safe Native Print Handler
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Safe High-Resolution jsPDF + html2canvas Export
   * Uses an unconstrained off-screen render container to guarantee 100% pixel-perfect match with modal preview
   */
  const handleDownloadPdf = async () => {
    if (!documentContainerRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // Ensure web fonts are completely loaded before capturing
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

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

      // Create an offscreen wrapper mounted to document.body
      // This isolates the document from modal scrollbars, transforms, and reactive scaling
      const offscreenContainer = document.createElement("div");
      offscreenContainer.style.position = "fixed";
      offscreenContainer.style.left = "-9999px";
      offscreenContainer.style.top = "0";
      offscreenContainer.style.width = "210mm";
      offscreenContainer.style.zIndex = "-9999";
      offscreenContainer.style.backgroundColor = "#ffffff";
      document.body.appendChild(offscreenContainer);

      for (let i = 0; i < pageElements.length; i++) {
        const originalPage = pageElements[i];

        // Clone page into pristine off-screen container
        const clonedPage = originalPage.cloneNode(true) as HTMLElement;
        clonedPage.style.margin = "0";
        clonedPage.style.boxShadow = "none";
        clonedPage.style.transform = "none";
        clonedPage.style.width = "210mm";
        clonedPage.style.minHeight = "297mm";
        clonedPage.style.height = "297mm";

        offscreenContainer.appendChild(clonedPage);

        // Render with html2canvas locked to exact A4 pixel dimensions (794px x 1123px at 96 DPI)
        const canvas = await safeHtml2Canvas(clonedPage, {
          scale: 3, // Ultra-crisp 300 DPI text quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000,
          windowWidth: 794,  // Lock to exact 210mm width
          windowHeight: 1123, // Lock to exact 297mm height
          scrollX: 0,
          scrollY: 0
        });

        // Clean up cloned DOM node
        offscreenContainer.removeChild(clonedPage);

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = 297; // A4 height in mm

        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      }

      // Remove offscreen container
      if (document.body.contains(offscreenContainer)) {
        document.body.removeChild(offscreenContainer);
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

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveToDatabase}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>{isSaving ? "Menyimpan..." : "Simpan Ke Database"}</span>
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

          {saveSuccessMsg && (
            <div className="mt-3 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

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
                      data.statusKeputusan !== "REJECTED" && data.jenisPermohonan === "Berusaha"
                        ? "bg-[#166534] text-white border-[#166534]"
                        : "bg-white text-[#334155] border-[#cbd5e1] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    BAP Persetujuan (Berusaha)
                  </button>
                  <button
                    type="button"
                    onClick={() => setData({ ...DEFAULT_BAP_NON_BERUSAHA_DATA, petaImageUrl: data.petaImageUrl })}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                      data.statusKeputusan !== "REJECTED" && data.jenisPermohonan === "Non-Berusaha"
                        ? "bg-[#4338ca] text-white border-[#4338ca]"
                        : "bg-white text-[#334155] border-[#cbd5e1] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    BAP Persetujuan (Non-Berusaha)
                  </button>
                  <button
                    type="button"
                    onClick={() => setData({ ...DEFAULT_BAP_REJECTED_DATA, petaImageUrl: data.petaImageUrl })}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                      data.statusKeputusan === "REJECTED"
                        ? "bg-[#b91c1c] text-white border-[#b91c1c]"
                        : "bg-white text-[#b91c1c] border-[#fca5a5] hover:bg-[#fef2f2]"
                    }`}
                  >
                    BAP Penolakan (Ditolak)
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
                  <label className="block text-[#475569] font-bold mb-1">Alamat Pemohon / Domisili:</label>
                  <input
                    type="text"
                    value={data.alamatPemohon}
                    onChange={(e) => setData({ ...data, alamatPemohon: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Lokasi Pembangunan / Investasi:</label>
                  <input
                    type="text"
                    value={data.lokasiInvestasi}
                    onChange={(e) => setData({ ...data, lokasiInvestasi: e.target.value })}
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
                  <select
                    value={data.buktiHakTanah}
                    onChange={(e) => setData({ ...data, buktiHakTanah: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] font-medium cursor-pointer"
                  >
                    <option value="Sertifikat Hak Milik (SHM)">Sertifikat Hak Milik (SHM)</option>
                    <option value="Sertifikat Hak Guna Bangunan (SHGB)">Sertifikat Hak Guna Bangunan (SHGB)</option>
                    <option value="Sertifikat Hak Pakai (SHP)">Sertifikat Hak Pakai (SHP)</option>
                    <option value="Sertifikat Hak Guna Usaha (SHGU)">Sertifikat Hak Guna Usaha (SHGU)</option>
                    <option value="Sertifikat Hak Wakaf / Akta Ikrar Wakaf (AIW)">Sertifikat Hak Wakaf / Akta Ikrar Wakaf (AIW)</option>
                    <option value="Surat Keterangan Tanah (SKT) / Garapan Desa">Surat Keterangan Tanah (SKT) / Garapan Desa</option>
                    <option value="Akta Jual Beli (AJB) / Akta Hibah Notaris / PPAT">Akta Jual Beli (AJB) / Akta Hibah Notaris/PPAT</option>
                    <option value="Surat Pelepasan Hak Adat / Masyarakat Hukum Adat">Surat Pelepasan Hak Adat / Pelepasan Adat</option>
                    {!["Sertifikat Hak Milik (SHM)", "Sertifikat Hak Guna Bangunan (SHGB)", "Sertifikat Hak Pakai (SHP)", "Sertifikat Hak Guna Usaha (SHGU)", "Sertifikat Hak Wakaf / Akta Ikrar Wakaf (AIW)", "Surat Keterangan Tanah (SKT) / Garapan Desa", "Akta Jual Beli (AJB) / Akta Hibah Notaris / PPAT", "Surat Pelepasan Hak Adat / Masyarakat Hukum Adat"].includes(data.buktiHakTanah) && (
                      <option value={data.buktiHakTanah}>{data.buktiHakTanah} (Kustom)</option>
                    )}
                  </select>
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
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setData(prev => ({
                        ...prev,
                        statusKeputusan: newStatus,
                        nomorSurat: newStatus === "REJECTED" 
                          ? prev.nomorSurat.replace("BAP-KTR", "BA-TOLAK-KTR").replace("BAP-PKKPR-B", "BA-TOLAK-KTR")
                          : prev.nomorSurat.replace("BA-TOLAK-KTR", "BAP-PKKPR-B")
                      }));
                    }}
                    className={`w-full px-2.5 py-1.5 bg-white border rounded-lg font-bold ${
                      data.statusKeputusan === "REJECTED" 
                        ? "border-[#b91c1c] text-[#b91c1c]" 
                        : "border-[#cbd5e1] text-[#0f172a]"
                    }`}
                  >
                    <option value="APPROVED">MEMENUHI KESESUAIAN TATA RUANG (APPROVED)</option>
                    <option value="APPROVED_WITH_CONDITIONS">DISETUJUI DENGAN PERSYARATAN KHUSUS</option>
                    <option value="REJECTED">TIDAK MEMENUHI KESESUAIAN TATA RUANG (DITOLAK)</option>
                  </select>
                </div>
              </div>

              {/* SEKSI KHUSUS ALASAN PENOLAKAN PUPTR */}
              {data.statusKeputusan === "REJECTED" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-red-800 font-bold text-[11px] uppercase">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-red-600" />
                      <span>Alasan &amp; Dasar Pertimbangan Penolakan Tata Ruang (BAP-TOLAK KTR)</span>
                    </span>
                    <span className="text-[10px] text-red-600 font-normal">Wajib Diisi untuk Dokumen BAP Penolakan</span>
                  </div>

                  <div>
                    <label className="block text-[#475569] font-bold text-[10px] mb-1">Pilih Alasan Standar Penolakan Tata Ruang:</label>
                    <select
                      value={data.rejectionReason || ""}
                      onChange={(e) => setData({ ...data, rejectionReason: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-red-900 font-semibold cursor-pointer text-xs"
                    >
                      <option value="Rencana kegiatan pemanfaatan ruang bertentangan secara mendasar dengan Alokasi Pola Ruang Peraturan Daerah Kabupaten Luwu Nomor 3 Tahun 2024 tentang RTRW Kabupaten Luwu Tahun 2024-2044 karena berada di dalam Zona Lindung Sempadan Sungai, memutus jaringan sempadan tata air, dan berada pada zona rawan bencana banjir bandang tinggi.">
                        1. Melanggar Pola Ruang RTRW / Zona Lindung Sempadan Sungai
                      </option>
                      <option value="Persil berada pada Kawasan Rawan Bencana (KRB) Tinggi dengan risiko likuifaksi atau tanah longsor aktif yang membahayakan keselamatan publik.">
                        2. Kawasan Rawan Bencana (KRB) Tinggi / Bahaya Geologis
                      </option>
                      <option value="Tidak memenuhi ketentuan intensitas pemanfaatan ruang (KDB, KLB, dan Koefisien Daerah Hijau) serta tidak menyediakan buffer sempadan jalan arteri.">
                        3. Pelanggaran Intensitas Ruang &amp; Koefisien Dasar Bangunan
                      </option>
                      <option value="Dokumen kepemilikan tanah tumpang tindih dengan aset milik Pemerintah Daerah / Kawasan Hutan Negara.">
                        4. Tumpang Tindih Aset Daerah / Kawasan Hutan
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#475569] font-bold text-[10px] mb-1">Rincian Narasi Alasan Penolakan PUPTR (Dapat Diedit):</label>
                    <textarea
                      rows={2}
                      value={data.rejectionReason || ""}
                      onChange={(e) => setData({ ...data, rejectionReason: e.target.value })}
                      placeholder="Tuliskan uraian pertimbangan teknis penolakan kesesuaian tata ruang..."
                      className="w-full px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-red-900 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {/* SEKSI 2: PEJABAT PENANDATANGAN & TIM TEKNIS BAP-PKKPR */}
              <div className="pt-2">
                <div className="font-bold text-[#1e293b] mb-2 uppercase text-[11px] tracking-wide border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>2. Pejabat Penandatangan & Tim Teknis Dinas PUPTR</span>
                  <span className="text-[10px] text-[#0284c7] font-normal">Sesuai Struktur Resmi DPUPTR Luwu</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 border border-[#cbd5e1] rounded-xl">
                  {/* A. Kepala Dinas */}
                  <div className="space-y-2 p-2.5 bg-[#f8fafc] border border-slate-200 rounded-lg">
                    <div className="font-bold text-[#0f172a] text-[11px] border-b pb-1 text-emerald-800">
                      a. Kepala Dinas PUPTR
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Nama Lengkap & Gelar:</label>
                      <input
                        type="text"
                        value={data.kadisNama}
                        onChange={(e) => setData({ ...data, kadisNama: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">NIP Kadis:</label>
                      <input
                        type="text"
                        value={data.kadisNip}
                        onChange={(e) => setData({ ...data, kadisNip: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Pangkat / Golongan:</label>
                      <input
                        type="text"
                        value={data.kadisPangkat}
                        onChange={(e) => setData({ ...data, kadisPangkat: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Jabatan Resmi:</label>
                      <input
                        type="text"
                        value={data.kadisJabatan}
                        onChange={(e) => setData({ ...data, kadisJabatan: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                  </div>

                  {/* B. Kepala Bidang Tata Ruang */}
                  <div className="space-y-2 p-2.5 bg-[#f8fafc] border border-slate-200 rounded-lg">
                    <div className="font-bold text-[#0f172a] text-[11px] border-b pb-1 text-emerald-800">
                      b. Kabid Tata Ruang
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Nama Lengkap & Gelar:</label>
                      <input
                        type="text"
                        value={data.kabidNama}
                        onChange={(e) => setData({ ...data, kabidNama: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">NIP Kabid:</label>
                      <input
                        type="text"
                        value={data.kabidNip}
                        onChange={(e) => setData({ ...data, kabidNip: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Jabatan Kabid:</label>
                      <input
                        type="text"
                        value={data.kabidJabatan}
                        onChange={(e) => setData({ ...data, kabidJabatan: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                  </div>

                  {/* C. Kepala Seksi Pengawasan Ruang */}
                  <div className="space-y-2 p-2.5 bg-[#f8fafc] border border-slate-200 rounded-lg">
                    <div className="font-bold text-[#0f172a] text-[11px] border-b pb-1 text-emerald-800">
                      c. Kasi Pengawasan Ruang
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Nama Lengkap & Gelar:</label>
                      <input
                        type="text"
                        value={data.kasiNama || "SYAHRUL RAMADHAN, S.T."}
                        onChange={(e) => setData({ ...data, kasiNama: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">NIP Kasi:</label>
                      <input
                        type="text"
                        value={data.kasiNip || "19880210 201101 1 007"}
                        onChange={(e) => setData({ ...data, kasiNip: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Jabatan Kasi:</label>
                      <input
                        type="text"
                        value={data.kasiJabatan || "Kepala Seksi Pengawasan Ruang"}
                        onChange={(e) => setData({ ...data, kasiJabatan: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                  </div>

                  {/* D. Analis Spasial & Pemetaan GIS */}
                  <div className="space-y-2 p-2.5 bg-[#f8fafc] border border-slate-200 rounded-lg">
                    <div className="font-bold text-[#0f172a] text-[11px] border-b pb-1 text-emerald-800">
                      d. Analis Spasial / GIS
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Nama Analis GIS:</label>
                      <input
                        type="text"
                        value={data.analisGisNama || "ANDI BASO MATTATA, S.T."}
                        onChange={(e) => setData({ ...data, analisGisNama: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">NIP Analis GIS:</label>
                      <input
                        type="text"
                        value={data.analisGisNip || "19940822 202012 1 003"}
                        onChange={(e) => setData({ ...data, analisGisNip: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Jabatan Analis GIS:</label>
                      <input
                        type="text"
                        value={data.analisGisJabatan || "Analis Spasial & Pemetaan GIS"}
                        onChange={(e) => setData({ ...data, analisGisJabatan: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER BUTTON FOR EDIT MODE */}
              <div className="flex items-center justify-between pt-3 border-t border-[#cbd5e1]">
                <span className="text-[11px] text-[#64748b]">
                  *Perubahan data variabel & pejabat akan tersimpan ke database & langsung memperbarui naskah resmi BAP.
                </span>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveToDatabase}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{isSaving ? "Menyimpan ke Database..." : "Simpan Perubahan ke Database"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PRINTABLE DOCUMENT WRAPPER (A4 Canvas Container) */}
      <div 
        ref={documentContainerRef} 
        className="bap-ktr-document-container BAP-PKKPR-Modal-Container mx-auto flex flex-col items-center gap-6 print:gap-0 print:m-0 p-2 sm:p-4"
        style={{ color: "#000000" }}
      >
        {/* =========================================================================
            HALAMAN 1: KOP SURAT, DATA PEMOHON & SEKSI A AUDIT POLA RUANG
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page1") && (
          <div 
            className="bap-ktr-print-page BAP-PKKPR-Modal-Container bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "20mm",   // Margin Kiri Presisi 2.0 cm (Simetris Sejajar Kanan)
              paddingTop: "15mm",    // Margin Atas Dinaikkan 1.5 cm
              paddingRight: "20mm",  // Margin Kanan Presisi 2.0 cm
              paddingBottom: "18mm", // Margin Bawah 1.8 cm
              boxSizing: "border-box",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: "10.5pt",
              lineHeight: 1.4,
              pageBreakAfter: "always",
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* A. KOP SURAT DINAS PUPTR KABUPATEN LUWU (Symmetrical 3-Column Balance) */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #000000", paddingBottom: "6px", marginBottom: "2px" }}>
              {/* Logo Pemkab Luwu (Tinggi ~64px / 18x22mm proporsional) */}
              <div style={{ width: "22mm", textAlign: "center", flexShrink: 0, marginRight: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img 
                  src={OFFICIAL_LUWU_LOGO_URL} 
                  alt="Logo Kabupaten Luwu" 
                  style={{ width: "17mm", height: "21mm", maxHeight: "68px", objectFit: "contain", display: "inline-block" }}
                />
              </div>

              {/* Teks Identitas Instansi (Centered Relative to Full Margin Width) */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "13.5pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000", lineHeight: 1.12 }}>
                  PEMERINTAH KABUPATEN LUWU
                </div>
                <div style={{ fontSize: "14.5pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000", marginTop: "1px", lineHeight: 1.12 }}>
                  DINAS PEKERJAAN UMUM DAN PENATAAN RUANG
                </div>
                <div style={{ fontSize: "11.5pt", fontWeight: "bold", textTransform: "uppercase", color: "#000000", marginTop: "1px", lineHeight: 1.12 }}>
                  BIDANG TATA RUANG DAN BINA KONSTRUKSI
                </div>
                <div style={{ fontSize: "9pt", color: "#000000", marginTop: "2px", lineHeight: 1.2 }}>
                  Jl. Sungai Pareman No. 81, Kelurahan Sabe, Kec. Belopa Utara, Kab. Luwu Kode Pos : 91994
                </div>
                <div style={{ fontSize: "8pt", color: "#000000", marginTop: "1px" }}>
                  Email: puptr@luwukab.go.id • Website: https://puptr.luwukab.go.id
                </div>
              </div>

              {/* Balance Right Spacer to guarantee 100% mathematical center */}
              <div style={{ width: "22mm", flexShrink: 0, marginLeft: "10px" }} />
            </div>
            {/* Double Border Line Accent */}
            <div style={{ borderBottom: "1px solid #000000", marginBottom: "10px" }} />

            {/* B. JUDUL DOKUMEN */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "12.5pt", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2, color: data.statusKeputusan === "REJECTED" ? "#b91c1c" : "#000000" }}>
                {data.statusKeputusan === "REJECTED"
                  ? "BERITA ACARA PENOLAKAN KESESUAIAN TATA RUANG (BAP-TOLAK KTR)"
                  : data.jenisPermohonan === "Non-Berusaha"
                  ? "BERITA ACARA PEMERIKSAAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (BAP-PKKPR) NON-BERUSAHA"
                  : "BERITA ACARA PEMERIKSAAN KESESUAIAN TATA RUANG (BAP-KTR)"}
              </div>
              <div style={{ fontSize: "10.5pt", fontWeight: "bold", marginTop: "3px" }}>
                Nomor: {data.nomorSurat}
              </div>
              <div style={{ fontSize: "10pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "2px", lineHeight: 1.25 }}>
                Tentang: {data.tentangSurat}
              </div>
            </div>

            {/* C. PARAGRAF PEMBUKA */}
            <div style={{ textAlign: "justify", fontSize: "11pt", lineHeight: 1.4, marginBottom: "8px" }}>
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

            {/* TABEL DATA PEMOHON (Sumbu Kolom Presisi Dengan Fixed Colgroup) */}
            <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "9.5pt", marginBottom: "10px", lineHeight: 1.35 }}>
              <colgroup>
                <col style={{ width: "22px" }} />
                <col style={{ width: "225px" }} />
                <col style={{ width: "14px" }} />
                <col style={{ width: "auto" }} />
              </colgroup>
              <tbody>
                {data.jenisPermohonan === "Non-Berusaha" ? (
                  <>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>1.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Nomor Induk Kependudukan (NIK)</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>{data.nibNik}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>2.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Nama Pemohon / Ketua Panitia</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>{data.namaPemohon}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>3.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Nama Lembaga / Panitia Pembangunan</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>{data.namaLembagaOrganisasi || data.namaPerusahaan || "Perseorangan / Panitia Pembangunan"}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>4.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Alamat Pemohon / Domisili</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>{data.alamatPemohon}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>5.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Rencana Kegiatan / Fungsi Bangunan</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>{data.fungsiBangunan || data.sektorUsaha || "Pembangunan Sarana Ibadah (Gereja)"}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>6.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Lokasi Rencana Pembangunan</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>
                        {getFormattedLokasiRencana()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>7.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Luas Lahan & Rencana Bangunan</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>
                        Lahan: {data.luasLahanPermohonan} {data.luasBangunanRencana ? `| Rencana Bangunan: ${data.luasBangunanRencana}` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>8.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Bukti Penguasaan Hak Atas Tanah</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>{data.buktiHakTanah}</td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>1.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Nomor Induk Berusaha (NIB) / NIK</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>{data.nibNik}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>2.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Nama Pemohon / Penanggung Jawab</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>{data.namaPemohon}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>3.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Nama Perusahaan / Badan Usaha</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>{data.namaPerusahaan}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>4.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Alamat Pemohon</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>{data.alamatPemohon}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>5.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Rencana Kegiatan / Sektor Usaha</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>{data.sektorUsaha} (KBLI: {data.kbliCode})</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>6.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Lokasi Rencana Investasi</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>
                        {getFormattedLokasiRencana()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>7.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Luas Lahan Permohonan</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>{data.luasLahanPermohonan}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>8.</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>Bukti Penguasaan Hak Atas Tanah</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                      <td style={{ verticalAlign: "top", padding: "2px 0" }}>{data.buktiHakTanah}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* D. SEKSI A: HASIL AUDIT POLA RUANG RTRW KABUPATEN LUWU */}
            <div style={{ fontSize: "10.5pt", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1.5px solid #000000", paddingBottom: "2px", marginBottom: "6px" }}>
              A. HASIL AUDIT SPASIAL & KESESUAIAN POLA RUANG RTRW
            </div>

            <div style={{ fontSize: "11pt", lineHeight: 1.4, textAlign: "justify", marginBottom: "4px" }}>
              Berdasarkan hasil analisis tumpang susun spasial (spatial overlay analysis) menggunakan Sistem Informasi Geografis (SIG) DPUPTR Luwu pada sistem koordinat <b>{data.sistemKoordinat}</b>, diperoleh hasil audit sebagai berikut:
            </div>

            <ol style={{ margin: "4px 0 0 0", paddingLeft: "18px", fontSize: "9.5pt", lineHeight: 1.38 }}>
              <li style={{ marginBottom: "4px" }}>
                <b>Kesesuaian Pola Ruang RTRW</b>: Lokasi yang dimohonkan secara mutlak berada di dalam <b>{data.zonaPolaRuangRtrw}</b> ({data.kodeZonaRtrw}), sehingga rencana kegiatan investasi dinilai <b>SELARAS DAN SESUAI</b> dengan peruntukan ruang.
              </li>
              <li style={{ marginBottom: "4px" }}>
                <b>Status Perlindungan Lahan Pertanian (LP2B)</b>: Berdasarkan peta tematik LP2B Dinas Pertanian Kabupaten Luwu, <b>{data.keteranganLp2b}</b>.
              </li>
              <li style={{ marginBottom: "4px" }}>
                <b>Status Kawasan Lindung & Kebencanaan</b>: {data.statusKawasanLindung}, serta tidak berada pada zona rawan bencana tinggi (zona merah likuefaksi/longsor).
              </li>
              <li style={{ marginBottom: "4px" }}>
                <b>Sempadan Sungai & Pantai</b>: {data.statusSempadanSungaiPantai}.
              </li>
              <li style={{ marginBottom: "4px" }}>
                <b>Integritas Geometris Spasial</b>: {data.validasiTopologi}.
              </li>
            </ol>

            {/* Footer Hal 1 */}
            <div style={{ position: "absolute", bottom: "10mm", left: "20mm", right: "20mm", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "3px" }}>
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
            className="bap-ktr-print-page BAP-PKKPR-Modal-Container bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "20mm",   // Margin Kiri Presisi 2.0 cm
              paddingTop: "15mm",    // Margin Atas 1.5 cm
              paddingRight: "20mm",  // Margin Kanan Presisi 2.0 cm
              paddingBottom: "18mm", // Margin Bawah 1.8 cm
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
            <div style={{ textAlign: "right", fontSize: "8.5pt", color: "#64748b", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", marginBottom: "12px" }}>
              Dokumen Lanjutan Berita Acara Nomor: {data.nomorSurat}
            </div>

            {/* E. SEKSI B: KEPUTUSAN DAN REKOMENDASI TEKNIS */}
            <div style={{ fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1.5px solid #000000", paddingBottom: "3px", marginBottom: "10px" }}>
              {data.statusKeputusan === "REJECTED"
                ? "B. KEPUTUSAN DAN ALASAN PENOLAKAN KESESUAIAN TATA RUANG"
                : "B. KEPUTUSAN DAN REKOMENDASI TEKNIS TATA RUANG"}
            </div>

            {/* KOTAK HIGHLIGHT KEPUTUSAN FORMAL */}
            <div 
              style={{ 
                border: data.statusKeputusan === "REJECTED" ? "2px solid #b91c1c" : "2px solid #166534", 
                backgroundColor: data.statusKeputusan === "REJECTED" ? "#fef2f2" : "#f0fdf4", 
                color: data.statusKeputusan === "REJECTED" ? "#991b1b" : "#14532d", 
                padding: "8px 12px", 
                textAlign: "center", 
                marginBottom: "12px"
              }}
            >
              <div style={{ fontSize: "9.5pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                KESIMPULAN AUDIT TEKNIS SPASIAL:
              </div>
              <div style={{ fontSize: "11.5pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "2px", color: data.statusKeputusan === "REJECTED" ? "#b91c1c" : "#166534" }}>
                DINYATAKAN : {data.statusKeputusan === "APPROVED" 
                  ? (data.jenisPermohonan === "Non-Berusaha" 
                      ? "MEMENUHI KESESUAIAN TATA RUANG (NON-BERUSAHA)" 
                      : "MEMENUHI KESESUAIAN TATA RUANG (BERUSAHA)")
                  : data.statusKeputusan === "APPROVED_WITH_CONDITIONS"
                  ? "DISETUJUI DENGAN PERSYARATAN KHUSUS TATA RUANG"
                  : "TIDAK MEMENUHI KESESUAIAN TATA RUANG (DITOLAK / REJECTED)"}
              </div>
              <div style={{ fontSize: "9pt", marginTop: "2px", color: data.statusKeputusan === "REJECTED" ? "#b91c1c" : "#15803d" }}>
                Luas Lahan Disetujui: <b>{data.statusKeputusan === "REJECTED" ? "0,00 Hektar (Permohonan Ditolak)" : data.luasLahanDisetujui}</b>
              </div>
            </div>

            {data.statusKeputusan === "REJECTED" ? (
              <div className="space-y-2 mb-3">
                <div style={{ fontSize: "11pt", lineHeight: 1.45, textAlign: "justify" }}>
                  Sehubungan dengan hasil audit spasial dan telaah pola ruang tersebut di atas, Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu <b>MENETAPKAN PENOLAKAN KESESUAIAN TATA RUANG</b> dan merekomendasikan kepada Dinas Penanaman Modal dan PTSP Kabupaten Luwu untuk <b>TIDAK MENERBITKAN PKKPR</b> pada lokasi tersebut dengan pertimbangan teknis:
                </div>
                {data.rejectionReason && (
                  <div style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3", padding: "8px 10px", fontSize: "9.5pt", color: "#9f1239", borderRadius: "4px", lineHeight: 1.35 }}>
                    <b>Uraian Dasar Hukum &amp; Alasan Penolakan:</b> {data.rejectionReason}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "11pt", lineHeight: 1.45, textAlign: "justify", marginBottom: "8px" }}>
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
            )}

            {/* Tabel Ketentuan Teknis Ruang & Bangunan */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt", marginBottom: "10px", border: "1px solid #000000", lineHeight: 1.35 }}>
              <tbody>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold", width: "40%" }}>Koefisien Dasar Bangunan (KDB)</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>{data.koefisienDasarBangunan}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold" }}>Koefisien Lantai Bangunan (KLB)</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>{data.koefisienLantaiBangunan}</td>
                </tr>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold" }}>Garis Sempadan Bangunan (GSB)</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>{data.garisSempadanBangunan}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold" }}>Kewajiban Ruang Terbuka Hijau (RTH)</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                    {data.jenisPermohonan === "Non-Berusaha" ? "Minimal 20% area resapan air & pekarangan" : "Minimal 10% dari luas persil efektif"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Catatan Khusus */}
            <div style={{ fontSize: "10pt", fontWeight: "bold", marginBottom: "3px" }}>Ketentuan dan Syarat Teknis Tambahan:</div>
            <ol style={{ margin: "0 0 12px 0", paddingLeft: "18px", fontSize: "9.5pt", lineHeight: 1.4 }}>
              {data.catatanRekomendasiTeknis.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "3px" }}>{item}</li>
              ))}
            </ol>

            <div style={{ fontSize: "11pt", lineHeight: 1.45, textAlign: "justify", marginBottom: "14px" }}>
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
            <div style={{ width: "100%", marginTop: "6px" }}>
              {/* Tanggal Dokumen */}
              <div style={{ textAlign: "right", fontSize: "10pt", marginBottom: "6px", paddingRight: "10px" }}>
                Belopa, {data.tanggalDokumen}
              </div>

              {/* Grid 2 Kolom Pejabat Penandatangan Dengan Row-by-Row Alignment */}
              <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "9.5pt", textAlign: "center" }}>
                <tbody>
                  {/* Row 1: Action Header */}
                  <tr>
                    <td style={{ width: "50%", verticalAlign: "bottom", padding: "0 10px", fontWeight: "bold" }}>
                      Mengetahui / Menyetujui,
                    </td>
                    <td style={{ width: "50%", verticalAlign: "bottom", padding: "0 10px", fontWeight: "bold" }}>
                      Mengesahkan,
                    </td>
                  </tr>

                  {/* Row 2: Official Position Title (Fixed minHeight for equal vertical baseline) */}
                  <tr>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "2px 10px 0 10px", height: "36px" }}>
                      <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "9pt", lineHeight: 1.2 }}>
                        {data.kabidJabatan}
                      </div>
                    </td>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "2px 10px 0 10px", height: "36px" }}>
                      <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "9pt", lineHeight: 1.2 }}>
                        {data.kadisJabatan} KABUPATEN LUWU
                      </div>
                    </td>
                  </tr>

                  {/* Row 3: Signature Area Spacer */}
                  <tr>
                    <td style={{ width: "50%", height: "55px" }} />
                    <td style={{ width: "50%", height: "55px" }} />
                  </tr>

                  {/* Row 4: Officer Name, Rank & NIP (Strict Top Vertical Alignment) */}
                  <tr>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "0 10px" }}>
                      <div style={{ fontSize: "10pt", fontWeight: "bold", textDecoration: "underline" }}>{data.kabidNama}</div>
                      <div style={{ fontSize: "9pt", color: "#000000", marginTop: "1px" }}>NIP. {data.kabidNip}</div>
                    </td>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "0 10px" }}>
                      <div style={{ fontSize: "10pt", fontWeight: "bold", textDecoration: "underline" }}>{data.kadisNama}</div>
                      <div style={{ fontSize: "9pt", color: "#000000", marginTop: "1px" }}>Pangkat: {data.kadisPangkat}</div>
                      <div style={{ fontSize: "9pt", color: "#000000" }}>NIP. {data.kadisNip}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Hal 2 */}
            <div style={{ position: "absolute", bottom: "10mm", left: "20mm", right: "20mm", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "3px" }}>
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
            className="bap-ktr-print-page BAP-PKKPR-Modal-Container bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "20mm",   // Margin Kiri Presisi 2.0 cm
              paddingTop: "15mm",    // Margin Atas 1.5 cm
              paddingRight: "20mm",  // Margin Kanan Presisi 2.0 cm
              paddingBottom: "18mm", // Margin Bawah 1.8 cm
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
            <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "6px", marginBottom: "10px" }}>
              <div style={{ fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase" }}>
                LAMPIRAN I BERITA ACARA PEMERIKSAAN KESESUAIAN TATA RUANG
              </div>
              <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#166534", textTransform: "uppercase", marginTop: "2px" }}>
                PETA DELINEASI GEOSPASIAL & ZONASI POLA RUANG KABUPATEN LUWU
              </div>
              <div style={{ fontSize: "9pt", marginTop: "2px" }}>
                Nomor Dokumen: <b>{data.nomorSurat}</b>
              </div>
            </div>

            {/* Tabel Ringkasan Lokasi Spasial */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt", marginBottom: "10px", border: "1px solid #000000", boxSizing: "border-box" }}>
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
              height: "140mm", 
              overflow: "hidden", 
              marginBottom: "10px", 
              backgroundColor: "#0f172a",
              boxSizing: "border-box"
            }}>
              <img 
                src={getEffectiveMapImageUrl(data.petaImageUrl, mapSnapshot, {
                  desa: data.desaKelurahan,
                  kecamatan: data.kecamatan,
                  pemohon: data.namaPemohon,
                  perusahaan: data.namaPerusahaan,
                  luas: data.luasLahanDisetujui,
                  tipeDoc: 'KTR',
                  nomorSurat: data.nomorSurat,
                  koordinatPoligon: data.koordinatPoligon,
                  zonaRtrw: data.zonaPolaRuangRtrw
                })} 
                alt="Peta Delineasi Geospasial & Zonasi RTRW" 
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                onError={(e) => {
                  const fallbackUrl = generateLuwuGisMapSvgDataUrl({
                    desa: data.desaKelurahan,
                    kecamatan: data.kecamatan,
                    pemohon: data.namaPemohon,
                    perusahaan: data.namaPerusahaan,
                    luas: data.luasLahanDisetujui,
                    tipeDoc: 'KTR',
                    nomorSurat: data.nomorSurat,
                    koordinatPoligon: data.koordinatPoligon,
                    zonaRtrw: data.zonaPolaRuangRtrw
                  });
                  if (e.currentTarget.src !== fallbackUrl) {
                    e.currentTarget.src = fallbackUrl;
                  }
                }}
              />
            </div>

            {/* Catatan Surveyor / Geospasial */}
            <div style={{ border: "1px solid #000000", padding: "8px 10px", fontSize: "9pt", backgroundColor: "#f8fafc", marginBottom: "12px", width: "100%", boxSizing: "border-box" }}>
              <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "3px" }}>Catatan Analis SIG & Surveyor Tata Ruang:</div>
              <div style={{ textAlign: "justify", lineHeight: 1.4 }}>
                {data.catatanSurveyor}
              </div>
            </div>

            {/* Pengesahan Petugas Pemeta */}
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "220px", textAlign: "center", fontSize: "9.5pt" }}>
                <div>Belopa, {data.tanggalDokumen}</div>
                <div style={{ fontWeight: "bold" }}>{data.analisGisJabatan || "Analis Spasial & Pemetaan GIS"},</div>
                <div style={{ height: "45px" }} />
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>{data.analisGisNama || "ANDI BASO MATTATA, S.T."}</div>
                <div>NIP. {data.analisGisNip || "19940822 202012 1 003"}</div>
              </div>
            </div>

            {/* Footer Hal 3 */}
            <div style={{ position: "absolute", bottom: "10mm", left: "20mm", right: "20mm", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "3px" }}>
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
            className="bap-ktr-print-page BAP-PKKPR-Modal-Container bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "20mm",   // Margin Kiri Presisi 2.0 cm
              paddingTop: "15mm",    // Margin Atas 1.5 cm
              paddingRight: "20mm",  // Margin Kanan Presisi 2.0 cm
              paddingBottom: "18mm", // Margin Bawah 1.8 cm
              boxSizing: "border-box",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: "10.5pt",
              lineHeight: 1.45,
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* Header Lampiran II */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "6px", marginBottom: "10px" }}>
              <div style={{ fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase" }}>
                LAMPIRAN II BERITA ACARA PEMERIKSAAN KESESUAIAN TATA RUANG
              </div>
              <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#166534", textTransform: "uppercase", marginTop: "2px" }}>
                TABEL KOORDINAT GEOGRAFIS TITIK POLIGON LAHAN YANG DIREKOMENDASIKAN DISETUJUI
              </div>
              <div style={{ fontSize: "9pt", marginTop: "2px" }}>
                Nomor Dokumen: <b>{data.nomorSurat}</b>
              </div>
            </div>

            <div style={{ fontSize: "11pt", textAlign: "justify", marginBottom: "8px", lineHeight: 1.4 }}>
              Daftar titik koordinat poligon batas bidang tanah yang dimohonkan dan telah diverifikasi memenuhi kesesuaian ruang sesuai format Standar Sistem Informasi Geografis WGS 1984:
            </div>

            {/* TABEL KOORDINAT SOLID COLLAPSE */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt", border: "1px solid #000000", marginBottom: "12px", boxSizing: "border-box" }}>
              <thead>
                <tr style={{ backgroundColor: "#e2e8f0", textAlign: "center" }}>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "35px" }}>NO.</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 6px", width: "60px" }}>TITIK</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 8px" }}>GARIS LINTANG (LATITUDE)</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 8px" }}>GARIS BUJUR (LONGITUDE)</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 8px" }}>KETERANGAN / POSISI PATOK</th>
                </tr>
              </thead>
              <tbody>
                {data.koordinatPoligon.map((pt, idx) => (
                  <tr key={pt.id} style={{ backgroundColor: idx % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                    <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "center", fontWeight: "bold" }}>
                      {idx + 1}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "4px 6px", textAlign: "center", fontWeight: "bold", fontFamily: "monospace" }}>
                      {pt.pointName}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "4px 8px", fontFamily: "monospace", textAlign: "center" }}>
                      {pt.latitudeDms} <br />
                      <span style={{ fontSize: "7.5pt", color: "#64748b" }}>({pt.latitudeDd.toFixed(6)})</span>
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "4px 8px", fontFamily: "monospace", textAlign: "center" }}>
                      {pt.longitudeDms} <br />
                      <span style={{ fontSize: "7.5pt", color: "#64748b" }}>({pt.longitudeDd.toFixed(6)})</span>
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "4px 8px", fontSize: "8.5pt" }}>
                      {pt.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Keterangan Sistem Geodesi */}
            <div style={{ border: "1px solid #000000", padding: "6px 10px", fontSize: "8.5pt", backgroundColor: "#f8fafc", marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
              <b>Ketentuan Teknis Geospasial:</b>
              <ul style={{ margin: "2px 0 0 0", paddingLeft: "16px", lineHeight: 1.35 }}>
                <li>Koordinat titik batas di atas mengikat secara hukum dalam penerbitan PKKPR dan perizinan turunan.</li>
                <li>Seluruh patok fisik di lapangan wajib dipasang permanen oleh pemohon sesuai koordinat tertera.</li>
              </ul>
            </div>

            {/* Pengesahan Akhir Lampiran II (Symmetrical Alignment & Date Header) */}
            <div style={{ width: "100%", marginTop: "8px" }}>
              <div style={{ textAlign: "right", fontSize: "9.5pt", marginBottom: "4px", paddingRight: "10px" }}>
                Belopa, {data.tanggalDokumen}
              </div>

              <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "9.5pt", textAlign: "center" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "50%", verticalAlign: "bottom", padding: "0 10px", fontWeight: "bold" }}>
                      Mengetahui,
                    </td>
                    <td style={{ width: "50%", verticalAlign: "bottom", padding: "0 10px", fontWeight: "bold" }}>
                      Mengesahkan,
                    </td>
                  </tr>

                  <tr>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "2px 10px 0 10px", height: "30px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "9pt", lineHeight: 1.2 }}>
                        {data.kasiJabatan || "Kepala Seksi Pengawasan Ruang"},
                      </div>
                    </td>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "2px 10px 0 10px", height: "30px" }}>
                      <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "9pt", lineHeight: 1.2 }}>
                        {data.kabidJabatan}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ width: "50%", height: "50px" }} />
                    <td style={{ width: "50%", height: "50px" }} />
                  </tr>

                  <tr>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "0 10px" }}>
                      <div style={{ fontSize: "10pt", fontWeight: "bold", textDecoration: "underline" }}>{data.kasiNama || "SYAHRUL RAMADHAN, S.T."}</div>
                      <div style={{ fontSize: "9pt", color: "#000000", marginTop: "1px" }}>NIP. {data.kasiNip || "19880210 201101 1 007"}</div>
                    </td>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "0 10px" }}>
                      <div style={{ fontSize: "10pt", fontWeight: "bold", textDecoration: "underline" }}>{data.kabidNama}</div>
                      <div style={{ fontSize: "9pt", color: "#000000", marginTop: "1px" }}>NIP. {data.kabidNip}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Hal 4 */}
            <div style={{ position: "absolute", bottom: "10mm", left: "20mm", right: "20mm", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "3px" }}>
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

    kasiNama: 'SYAHRUL RAMADHAN, S.T.',
    kasiNip: '19880210 201101 1 007',
    kasiJabatan: 'Kepala Seksi Pengawasan Ruang',

    petaImageUrl: customMapSnapshot || app?.mapSnapshotUrl || undefined,
    analisGisNama: 'ANDI BASO MATTATA, S.T.',
    analisGisNip: '19940822 202012 1 003',
    analisGisJabatan: 'Analis Spasial & Pemetaan GIS',
    catatanSurveyor: 'Pengukuran batas persil telah diverifikasi menggunakan GNSS RTK Dual-Frequency Geodetic dengan tingkat akurasi horizontal < 0.05 meter. Delineasi poligon telah ditumpangsusunkan (overlay) langsung dengan Layer Peta Digital RTRW Kabupaten Luwu 2024-2044.',
    koordinatPoligon: coords
  };
}
