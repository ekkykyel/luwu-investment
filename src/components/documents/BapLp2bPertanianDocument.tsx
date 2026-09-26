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
  Maximize2,
  Sprout,
  Wheat
} from "lucide-react";

/**
 * Coordinate Point for BAP-LP2B Document
 */
export interface BapLp2bCoordinatePoint {
  id: number | string;
  pointName: string;
  latitudeDms: string;
  longitudeDms: string;
  latitudeDd: number;
  longitudeDd: number;
  description?: string;
}

export interface BapLp2bDocumentData {
  // Tipe Permohonan: Berusaha vs Non-Berusaha
  jenisPermohonan?: "Berusaha" | "Non-Berusaha";
  kategoriPermohonan?: string;
  fungsiBangunan?: string;
  namaLembagaOrganisasi?: string;
  luasBangunanRencana?: string;

  // Nomor & Identitas Surat
  nomorSurat: string;
  nomorSuratRekomendasi?: string;
  tentangSurat: string;
  tanggalDokumen: string;
  hariTanggalPemeriksaan: string;

  // Data Pemohon
  nibNik: string;
  namaPemohon: string;
  namaPerusahaan: string;
  alamatPemohon: string;
  sektorUsaha: string;
  kbliCode?: string;
  lokasiInvestasi: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupaten: string;
  luasLahanPermohonan: string;
  luasLahanDisetujui: string;
  buktiHakTanah: string;

  // Hasil Audit Teknis Agraria, LP2B & Irigasi
  klasifikasiLahan: string;
  indeksPertanaman: string;
  kondisiIrigasi: string;
  statusLp2b: "LP2B_AKTIF" | "LP2B_CADANGAN" | "NON_LP2B";
  keteranganLp2b: string;
  tumpangTindihLp2bPersen: number;
  luasTumpangTindihHa: number;
  rasioLahanPengganti: string;
  luasWajibLahanPenggantiHa: number;
  lokasiUsulanLahanPengganti: string;
  validasiTopologi: string;
  sistemKoordinat: string;

  // Keputusan & Rekomendasi
  statusKeputusan: "APPROVED" | "APPROVED_WITH_CONDITIONS" | "REJECTED";
  catatanRekomendasiTeknis: string[];
  rejectionReason?: string;

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
  koordinatPoligon: BapLp2bCoordinatePoint[];
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
export function extractCoordinatesFromGeometryPertanian(geometry: any): BapLp2bCoordinatePoint[] {
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
      description: "Titik Pusat Koordinat Lahan Pertanian"
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
    description: idx === 0 ? "Patok Sudut Batas Usulan Lahan" : `Patok Batas Poligon Titik ${idx + 1}`
  }));
}

export const DEFAULT_BAP_LP2B_DATA: BapLp2bDocumentData = {
  jenisPermohonan: "Berusaha",
  fungsiBangunan: "Pembangunan Fasilitas Industri Terpadu & Gudang Hasil Bumi",
  namaLembagaOrganisasi: "PT. LUWU AGRO INDUSTRI NUSANTARA",
  luasBangunanRencana: "12.500 m²",

  nomorSurat: "520.1/042/BA-LP2B/DISTAN-LW/2026",
  nomorSuratRekomendasi: "520.1/042/SKR-LP2B/DISTAN-LW/2026",
  tentangSurat: "PENILAIAN KELAYAKAN TEKNIS AGRARIA, KETERSEDIAAN AIR IRIGASI DAN REKOMENDASI ALIH FUNGSI LAHAN PERTANIAN PANGAN BERKELANJUTAN (LP2B) KABUPATEN LUWU",
  tanggalDokumen: "24 September 2026",
  hariTanggalPemeriksaan: "Rabu, 24 September 2026",

  nibNik: "0220108392182 / 7317011909890001",
  namaPemohon: "Ir. Muhammad Arsyad Al-Fatih, M.T.",
  namaPerusahaan: "PT. LUWU AGRO INDUSTRI NUSANTARA",
  alamatPemohon: "Jl. Jenderal Sudirman No. 45, Belopa, Kab. Luwu",
  sektorUsaha: "Industri Pengolahan Kakao Terpadu & Pergudangan Modern",
  kbliCode: "10732 (Industri Pengolahan Kakao dan Cokelat)",
  lokasiInvestasi: "Jl. Poros Trans Sulawesi KM 14, Desa Karang-Karangan, Kec. Bua, Kab. Luwu",
  desaKelurahan: "Desa Karang-Karangan",
  kecamatan: "Kecamatan Bua",
  kabupaten: "Kabupaten Luwu, Provinsi Sulawesi Selatan",
  luasLahanPermohonan: "254.800 m² (25,48 Hektar)",
  luasLahanDisetujui: "254.800 m² (25,48 Hektar) - Sesuai Delineasi Poligon",
  buktiHakTanah: "Sertipikat Hak Milik (SHM) No. 00412/Karang-Karangan & Surat Keterangan Penguasaan Fisik Tanah",

  klasifikasiLahan: "Lahan Pertanian Basah / Sawah Irigasi Semi Teknis",
  indeksPertanaman: "Kelas II (Indeks Pertanaman IP200 / Produksi Padi-Palawija)",
  kondisiIrigasi: "Tersedia Saluran Irigasi Sekunder dan Tersier Aktif Pengairan Musim Tanam",
  statusLp2b: "LP2B_AKTIF",
  keteranganLp2b: "LOKASI BERSINGGUNGAN SEBAGIAN DENGAN ZONA LP2B (Telah Memenuhi Syarat Kompensasi Lahan Pengganti)",
  tumpangTindihLp2bPersen: 35,
  luasTumpangTindihHa: 8.91,
  rasioLahanPengganti: "1:1 (Setara Luasan Bersinggungan LP2B)",
  luasWajibLahanPenggantiHa: 8.91,
  lokasiUsulanLahanPengganti: "Kecamatan Bua / Kecamatan Ponrang, Kabupaten Luwu",
  validasiTopologi: "Valid (Zero Self-Intersection, Zero Sliver Polygons, Kesesuaian Sistem Koordinat WGS84 UTM Zone 51S)",
  sistemKoordinat: "Universal Transverse Mercator (UTM) Zone 51S - Datum WGS 1984",

  statusKeputusan: "APPROVED",
  catatanRekomendasiTeknis: [
    "Berdasarkan hasil telaah spasial SIG dan verifikasi lapangan, lokasi permohonan bersinggungan dengan sebagian Kawasan Pertanian Pangan Berkelanjutan (LP2B) Kabupaten Luwu.",
    "Berdasarkan Undang-Undang Nomor 41 Tahun 2009 dan Peraturan Daerah Kabupaten Luwu tentang Perlindungan LP2B, usulan pemanfaatan ruang DIREKOMENDASIKAN DAPAT DISETUJUI DENGAN PERSYARATAN KHUSUS.",
    "Pemohon diwajibkan menyediakan Lahan Pengganti LP2B seluas 8,91 Hektar (Rasio 1:1) dengan tingkat kesuburan dan ketersediaan air irigasi yang setara sebelum pelaksanaan konstruksi fisik.",
    "Pemohon wajib menjamin tidak memutus atau merusak jaringan saluran irigasi pertanian di sekitar persil lokasi, serta membangun sudetan drainase jika melintasi saluran irigasi tersier.",
    "Direkomendasikan kepada Tim Teknis Dinas PUPTR dan Kepala DPMPTSP Kabupaten Luwu sebagai dokumen pertimbangan teknis dalam penerbitan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)."
  ],

  kabidNama: "IR. SYAMSUL BAHRI, S.P., M.Si.",
  kabidNip: "19750614 200212 1 004",
  kabidJabatan: "Kepala Bidang Prasarana, Sarana dan Perlindungan Lahan (LP2B)",

  kadisNama: "IR. H. JUMADI, M.Si.",
  kadisNip: "19710324 199603 1 002",
  kadisJabatan: "Kepala Dinas Pertanian",
  kadisPangkat: "Pembina Utama Muda (IV/c)",

  kasiNama: "ANDI TENRI SENO, S.P.",
  kasiNip: "19890518 201202 1 006",
  kasiJabatan: "Kepala Seksi Lahan dan Irigasi Pertanian",

  petaImageUrl: undefined,
  analisGisNama: "MUHAMMAD FACHRI, S.P.",
  analisGisNip: "19930412 201903 1 005",
  analisGisJabatan: "Analis Spasial Lahan & Irigasi Pertanian",
  catatanSurveyor: "Hasil survei spasial dan verifikasi lapangan menunjukkan batas permohonan telah ditumpangsusunkan (overlay) langsung pada Layer Peta Digital LP2B & Jaringan Irigasi Pertanian Kabupaten Luwu.",

  koordinatPoligon: [
    { id: 1, pointName: "P.01", latitudeDms: "2° 58' 42.12\" LS", longitudeDms: "120° 18' 24.35\" BT", latitudeDd: -2.978367, longitudeDd: 120.306764, description: "Patok Batas Sudut Barat Daya (Batas Saluran Irigasi)" },
    { id: 2, pointName: "P.02", latitudeDms: "2° 58' 38.45\" LS", longitudeDms: "120° 18' 32.18\" BT", latitudeDd: -2.977347, longitudeDd: 120.308939, description: "Patok Batas Sisi Barat (Jalan Akses Tani)" },
    { id: 3, pointName: "P.03", latitudeDms: "2° 58' 29.80\" LS", longitudeDms: "120° 18' 35.60\" BT", latitudeDd: -2.974944, longitudeDd: 120.309889, description: "Patok Sudut Utara (Batas Sawah Produktif)" },
    { id: 4, pointName: "P.04", latitudeDms: "2° 58' 25.10\" LS", longitudeDms: "120° 18' 48.90\" BT", latitudeDd: -2.973639, longitudeDd: 120.313583, description: "Patok Sudut Timur Laut (Batas Hamparan LP2B)" },
    { id: 5, pointName: "P.05", latitudeDms: "2° 58' 36.70\" LS", longitudeDms: "120° 18' 54.20\" BT", latitudeDd: -2.976861, longitudeDd: 120.315056, description: "Patok Sudut Tenggara (Zona Logistik)" },
    { id: 6, pointName: "P.06", latitudeDms: "2° 58' 45.90\" LS", longitudeDms: "120° 18' 40.50\" BT", latitudeDd: -2.979417, longitudeDd: 120.311250, description: "Patok Sudut Selatan (Kembali ke Perimeter Awal)" }
  ]
};

export const DEFAULT_BAP_LP2B_NON_BERUSAHA_DATA: BapLp2bDocumentData = {
  jenisPermohonan: "Non-Berusaha",
  kategoriPermohonan: "Sarana Peribadatan / Rumah Ibadah (Gereja)",
  fungsiBangunan: "Pembangunan Rumah Ibadah (Gereja)",
  namaLembagaOrganisasi: "Panitia Pembangunan Gereja Toraja Jemaat Ranteballa",
  luasBangunanRencana: "480 m² (1 Lantai)",

  nomorSurat: "520.1/089/BA-LP2B-NB/DISTAN-LW/2026",
  nomorSuratRekomendasi: "520.1/089/SKR-LP2B-NB/DISTAN-LW/2026",
  tentangSurat: "PENILAIAN KELAYAKAN TEKNIS AGRARIA & PERLINDUNGAN LAHAN PERTANIAN PANGAN BERKELANJUTAN (LP2B) NON-BERUSAHA SARANA PERIBADATAN KABUPATEN LUWU",
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
  buktiHakTanah: "Sertifikat Hak Milik (SHM)",

  klasifikasiLahan: "Bukan Lahan Pertanian / Pekarangan Permukiman",
  indeksPertanaman: "IP 0 (Lahan Bera / Non-Produktif / Pekarangan)",
  kondisiIrigasi: "Tidak Bersinggungan Dengan Jaringan Irigasi Teknis Maupun Tersier",
  statusLp2b: "NON_LP2B",
  keteranganLp2b: "LOKASI BERADA DILUAR ZONA LP2B (NON-LP2B) - Bebas dari Perlindungan Lahan Pertanian Pangan Berkelanjutan",
  tumpangTindihLp2bPersen: 0,
  luasTumpangTindihHa: 0,
  rasioLahanPengganti: "Nihil (Bebas Kewajiban Lahan Pengganti / Lahan Non-LP2B)",
  luasWajibLahanPenggantiHa: 0,
  lokasiUsulanLahanPengganti: "- (Nihil / Bebas Kewajiban)",
  validasiTopologi: "Valid (Zero Self-Intersection, Zero Sliver Polygons, Sistem Koordinat WGS84 UTM Zone 51S)",
  sistemKoordinat: "Universal Transverse Mercator (UTM) Zone 51S - Datum WGS 1984",

  statusKeputusan: "APPROVED",
  catatanRekomendasiTeknis: [
    "Lokasi permohonan berada di luar Kawasan Pertanian Pangan Berkelanjutan (LP2B) dan bukan merupakan sawah beririgasi teknis.",
    "Rencana pembangunan sarana peribadatan tidak mengganggu luasan ketahanan pangan maupun saluran pengairan pertanian sekitar.",
    "Rekomendasi teknis pertanian DISETUJUI TANPA KEWAJIBAN LAHAN PENGGANTI.",
    "Diterbitkan sebagai kelengkapan dokumen pertimbangan teknis untuk penerbitan BAP-PKKPR Dinas PUPTR Kabupaten Luwu."
  ],

  kabidNama: "IR. SYAMSUL BAHRI, S.P., M.Si.",
  kabidNip: "19750614 200212 1 004",
  kabidJabatan: "Kepala Bidang Prasarana, Sarana dan Perlindungan Lahan (LP2B)",

  kadisNama: "IR. H. JUMADI, M.Si.",
  kadisNip: "19710324 199603 1 002",
  kadisJabatan: "Kepala Dinas Pertanian",
  kadisPangkat: "Pembina Utama Muda (IV/c)",

  // Non-Berusaha defaults
  kasiNama: "ANDI TENRI SENO, S.P.",
  kasiNip: "19890518 201202 1 006",
  kasiJabatan: "Kepala Seksi Lahan dan Irigasi Pertanian",

  petaImageUrl: undefined,
  analisGisNama: "MUHAMMAD FACHRI, S.P.",
  analisGisNip: "19930412 201903 1 005",
  analisGisJabatan: "Analis Spasial Lahan & Irigasi Pertanian",
  catatanSurveyor: "Pengukuran spasial membuktikan lokasi berupa pekarangan dan kebun campuran yang bebas dari jaringan irigasi maupun zona LP2B.",

  koordinatPoligon: [
    { id: 1, pointName: "P.01", latitudeDms: "3° 18' 12.10\" LS", longitudeDms: "120° 09' 14.20\" BT", latitudeDd: -3.303361, longitudeDd: 120.153944, description: "Patok Batas Sudut Depan (Akses Jalan Gereja)" },
    { id: 2, pointName: "P.02", latitudeDms: "3° 18' 10.45\" LS", longitudeDms: "120° 09' 17.80\" BT", latitudeDd: -3.302903, longitudeDd: 120.154944, description: "Patok Batas Sisi Barat Lahan Gereja" },
    { id: 3, pointName: "P.03", latitudeDms: "3° 18' 08.20\" LS", longitudeDms: "120° 09' 16.30\" BT", latitudeDd: -3.302278, longitudeDd: 120.154528, description: "Patok Sudut Utara (Batas Lahan Warga)" },
    { id: 4, pointName: "P.04", latitudeDms: "3° 18' 09.80\" LS", longitudeDms: "120° 09' 12.70\" BT", latitudeDd: -3.302722, longitudeDd: 120.153528, description: "Patok Sudut Timur Lahan Gereja" }
  ]
};

export const DEFAULT_BAP_LP2B_REJECTED_DATA: BapLp2bDocumentData = {
  jenisPermohonan: "Berusaha",
  nomorSurat: "520.1/042/BA-TOLAK-LP2B/DISTAN-LW/2026",
  nomorSuratRekomendasi: "520.1/042/SKR-TOLAK-LP2B/DISTAN-LW/2026",
  tentangSurat: "PENOLAKAN KELAYAKAN TEKNIS ALIH FUNGSI LAHAN PERTANIAN PANGAN BERKELANJUTAN (LP2B) KABUPATEN LUWU",
  tanggalDokumen: "25 September 2026",
  hariTanggalPemeriksaan: "Kamis, 25 September 2026",

  nibNik: "0220108920194",
  namaPemohon: "BAMBANG SUDIBYO",
  namaPerusahaan: "PT. LUWU KENCANA MAKMUR",
  alamatPemohon: "Jl. Poros Bua - Palopo No. 88, Kab. Luwu",
  sektorUsaha: "Industri Pengolahan / Pergudangan Komersial",
  kbliCode: "52101 (Pergudangan dan Penyimpanan)",
  lokasiInvestasi: "Kawasan Sawah Irigasi Teknis Primer Desa Noling, Kec. Bupon, Kab. Luwu",
  desaKelurahan: "Desa Noling",
  kecamatan: "Kecamatan Bua Ponrang",
  kabupaten: "Kabupaten Luwu, Provinsi Sulawesi Selatan",
  luasLahanPermohonan: "125.000 m² (12,50 Hektar)",
  luasLahanDisetujui: "0 m² (Permohonan Ditolak / 0,00 Hektar)",
  buktiHakTanah: "Sertifikat Hak Milik (SHM)",

  klasifikasiLahan: "Lahan Pertanian Basah / Sawah Irigasi Teknis",
  indeksPertanaman: "Kelas I (Indeks Pertanaman IP300 / Panen Padi 3x Setahun)",
  kondisiIrigasi: "Tersedia Jaringan Irigasi Primer dan Sekunder Aktif (Daerah Irigasi Teknis Kab. Luwu)",
  statusLp2b: "LP2B_AKTIF",
  keteranganLp2b: "LOKASI BERADA 100% PADA ZONA INTI SAWAH BERIRIGASI TEKNIS PRIMER LP2B MUTLAK (DILARANG ALIH FUNGSI)",
  tumpangTindihLp2bPersen: 100,
  luasTumpangTindihHa: 12.50,
  rasioLahanPengganti: "1:3 (Luas Pengganti 3x Lipat - Kawasan Inti Pangan Prioritas)",
  luasWajibLahanPenggantiHa: 37.50,
  lokasiUsulanLahanPengganti: "- (Tidak Bersedia Menyediakan Lahan Pengganti)",
  validasiTopologi: "Valid (Inkonsistensi Spasial: Bersinggungan Penuh Dengan Hamparan Sawah Irigasi Teknis Utama)",
  sistemKoordinat: "Universal Transverse Mercator (UTM) Zone 51S - Datum WGS 1984",

  statusKeputusan: "REJECTED",
  rejectionReason: "Lahan permohonan bersinggungan 100% dengan Zona Inti Lahan Pertanian Pangan Berkelanjutan (LP2B) Aktif Beririgasi Teknis Kelas I (IP300) yang dilindungi secara mutlak oleh UU No. 41/2009 dan Perda Perlindungan LP2B Kabupaten Luwu serta berpotensi memutus saluran irigasi primer pengairan persawahan masyarakat.",
  catatanRekomendasiTeknis: [
    "Berdasarkan hasil analisis spasial tumpangsusun (overlay) SIG, lokasi permohonan 100% (12,50 Ha) berada di dalam Kawasan LP2B Aktif Beririgasi Teknis Primer (D.I. Noling) dengan Indeks Pertanaman IP300.",
    "Berdasarkan Pasal 44 UU No. 41 Tahun 2009 dan Perda Kabupaten Luwu, Lahan Pertanian Pangan Berkelanjutan yang memiliki jaringan irigasi teknis dilarang dialihfungsikan kecuali untuk kepentingan umum strategis nasional.",
    "Rencana kegiatan bukan merupakan proyek infrastruktur strategis nasional yang dikecualikan undang-undang, serta tidak disertai kesanggupan penyediaan lahan pengganti 3 (tiga) kali lipat.",
    "Alih fungsi lahan pada persil tersebut berakibat terputusnya jaringan irigasi sekunder bagi hamparan sawah warga di sekitarnya.",
    "Dinas Pertanian MEREKOMENDASIKAN PENOLAKAN PERMOHONAN kepada Dinas PUPTR dan DPMPTSP Kabupaten Luwu untuk TIDAK MENERBITKAN Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)."
  ],

  kabidNama: "IR. SYAMSUL BAHRI, S.P., M.Si.",
  kabidNip: "19750614 200212 1 004",
  kabidJabatan: "Kepala Bidang Prasarana, Sarana dan Perlindungan Lahan (LP2B)",

  kadisNama: "IR. H. JUMADI, M.Si.",
  kadisNip: "19710324 199603 1 002",
  kadisJabatan: "Kepala Dinas Pertanian",
  kadisPangkat: "Pembina Utama Muda (IV/c)",

  // Rejected defaults
  kasiNama: "ANDI TENRI SENO, S.P.",
  kasiNip: "19890518 201202 1 006",
  kasiJabatan: "Kepala Seksi Lahan dan Irigasi Pertanian",

  petaImageUrl: undefined,
  analisGisNama: "MUHAMMAD FACHRI, S.P.",
  analisGisNip: "19930412 201903 1 005",
  analisGisJabatan: "Analis Spasial Lahan & Irigasi Pertanian",
  catatanSurveyor: "Peta overlay menunjukkan persil memotong langsung saluran primer D.I. Noling dan berada di hamparan sawah aktif produktivitas tinggi.",

  koordinatPoligon: [
    { id: 1, pointName: "P.01", latitudeDms: "2° 58' 42.12\" LS", longitudeDms: "120° 18' 24.35\" BT", latitudeDd: -2.978367, longitudeDd: 120.306764, description: "Patok Sudut Batas Saluran Irigasi Teknis" },
    { id: 2, pointName: "P.02", latitudeDms: "2° 58' 38.45\" LS", longitudeDms: "120° 18' 32.18\" BT", latitudeDd: -2.977347, longitudeDd: 120.308939, description: "Patok Sisi Barat Saluran Primer" },
    { id: 3, pointName: "P.03", latitudeDms: "2° 58' 29.80\" LS", longitudeDms: "120° 18' 35.60\" BT", latitudeDd: -2.974944, longitudeDd: 120.309889, description: "Patok Sudut Utara (Sawah Produktif IP300)" },
    { id: 4, pointName: "P.04", latitudeDms: "2° 58' 25.10\" LS", longitudeDms: "120° 18' 48.90\" BT", latitudeDd: -2.973639, longitudeDd: 120.313583, description: "Patok Sudut Timur Hamparan LP2B" }
  ]
};

export interface BapLp2bPertanianDocumentProps {
  initialData?: Partial<BapLp2bDocumentData>;
  mapSnapshot?: string | null;
  onClose?: () => void;
  showEditorToolbar?: boolean;
  onSaveData?: (updatedData: BapLp2bDocumentData) => void | Promise<void>;
}

export function BapLp2bPertanianDocument({
  initialData,
  mapSnapshot,
  onClose,
  showEditorToolbar = true,
  onSaveData
}: BapLp2bPertanianDocumentProps) {
  const [data, setData] = useState<BapLp2bDocumentData>({
    ...DEFAULT_BAP_LP2B_DATA,
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

    if ((desaLower && lokasiLower.includes(desaLower)) || (kecLower && lokasiLower.includes(kecLower))) {
      if (lokasiLower.includes("kabupaten") || lokasiLower.includes("kab.")) {
        return lokasi;
      }
      return `${lokasi}, ${kab}`;
    }
    return `${lokasi}, ${desa}, ${kec}, ${kab}`;
  };

  /**
   * Handler to save edited BAP-LP2B variables and officials to database
   */
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      // 1. Cache in LocalStorage
      localStorage.setItem("BAP_LP2B_SETTINGS_PERSIST", JSON.stringify(data));

      // 2. Sync OPD Officials Settings for Pertanian
      try {
        const currentOpd = getOpdSettings("pertanian");
        saveOpdSettings("pertanian", {
          ...currentOpd,
          kepalaDinas: {
            ...currentOpd.kepalaDinas,
            fullName: data.kadisNama,
            nip: data.kadisNip,
            pangkatGolongan: data.kadisPangkat,
            officialTitle: data.kadisJabatan
          },
          kabidSignatory: {
            fullName: data.kabidNama,
            nip: data.kabidNip,
            pangkatGolongan: data.kabidJabatan,
            officialTitle: data.kabidJabatan
          }
        });
      } catch (opdErr) {
        console.warn("OPD settings sync warning in Pertanian:", opdErr);
      }

      // 3. Upsert to Supabase database if connection is active
      try {
        if (supabase) {
          const { error: sbErr } = await supabase.from("opd_settings").upsert({
            opd_key: "pertanian",
            data_bap_lp2b: data,
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

      setSaveSuccessMsg("Data BAP-LP2B & Pejabat Dinas Pertanian berhasil disimpan ke Database!");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Error saving BAP LP2B data to database:", err);
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
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const pageElements = documentContainerRef.current.querySelectorAll<HTMLElement>(".bap-lp2b-print-page");
      if (!pageElements || pageElements.length === 0) {
        throw new Error("Halaman dokumen tidak ditemukan");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

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

        const clonedPage = originalPage.cloneNode(true) as HTMLElement;
        clonedPage.style.margin = "0";
        clonedPage.style.boxShadow = "none";
        clonedPage.style.transform = "none";
        clonedPage.style.width = "210mm";
        clonedPage.style.minHeight = "297mm";
        clonedPage.style.height = "297mm";

        offscreenContainer.appendChild(clonedPage);

        const canvas = await safeHtml2Canvas(clonedPage, {
          scale: 3, // 300 DPI high-res crisp text quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000,
          windowWidth: 794,  // Exact 210mm width
          windowHeight: 1123, // Exact 297mm height
          scrollX: 0,
          scrollY: 0
        });

        offscreenContainer.removeChild(clonedPage);

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = 297; // A4 height in mm

        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      }

      if (document.body.contains(offscreenContainer)) {
        document.body.removeChild(offscreenContainer);
      }

      const cleanDocNumber = data.nomorSurat.replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`BAP_LP2B_PERTANIAN_LUWU_${cleanDocNumber}.pdf`);
    } catch (err) {
      console.error("Gagal mengekspor PDF BAP-LP2B:", err);
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
                <Wheat size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#0f172a] leading-tight">
                  Template Resmi BAP-LP2B Dinas Pertanian Kabupaten Luwu
                </h2>
                <p className="text-xs text-[#64748b]">
                  Standar Naskah Dinas Kelayakan Teknis LP2B • Siap Cetak A4 / Ekspor PDF Resmi (Simetris Format BAP)
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
              Hal 1 (Kop & Audit LP2B)
            </button>
            <button
              onClick={() => setActiveTab("page2")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "page2" ? "bg-[#166534] text-white" : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
              }`}
            >
              Hal 2 (Keputusan & Tanda Tangan)
            </button>
            <button
              onClick={() => setActiveTab("page3")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "page3" ? "bg-[#166534] text-white" : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
              }`}
            >
              Hal 3 (Lampiran I - Peta LP2B)
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
                  <span>Editor Variabel Dinamis Dokumen BAP-LP2B Pertanian</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#475569] font-bold">Preset Naskah:</span>
                  <button
                    type="button"
                    onClick={() => setData({ ...DEFAULT_BAP_LP2B_DATA, petaImageUrl: data.petaImageUrl })}
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
                    onClick={() => setData({ ...DEFAULT_BAP_LP2B_NON_BERUSAHA_DATA, petaImageUrl: data.petaImageUrl })}
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
                    onClick={() => setData({ ...DEFAULT_BAP_LP2B_REJECTED_DATA, petaImageUrl: data.petaImageUrl })}
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
                  <label className="block text-[#475569] font-bold mb-1">Nomor Berita Acara (BAP-LP2B):</label>
                  <input
                    type="text"
                    value={data.nomorSurat}
                    onChange={(e) => setData({ ...data, nomorSurat: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Nomor Surat Rekomendasi (SKR):</label>
                  <input
                    type="text"
                    value={data.nomorSuratRekomendasi || ""}
                    onChange={(e) => setData({ ...data, nomorSuratRekomendasi: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Status Keputusan Pertanian:</label>
                  <select
                    value={data.statusKeputusan}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setData(prev => ({
                        ...prev,
                        statusKeputusan: newStatus,
                        nomorSurat: newStatus === "REJECTED" 
                          ? prev.nomorSurat.replace("BA-LP2B", "BA-TOLAK-LP2B")
                          : prev.nomorSurat.replace("BA-TOLAK-LP2B", "BA-LP2B")
                      }));
                    }}
                    className={`w-full px-2.5 py-1.5 bg-white border rounded-lg font-bold ${
                      data.statusKeputusan === "REJECTED" 
                        ? "border-[#b91c1c] text-[#b91c1c]" 
                        : "border-[#cbd5e1] text-[#0f172a]"
                    }`}
                  >
                    <option value="APPROVED">DISETUJUI / MEMENUHI SYARAT (APPROVED)</option>
                    <option value="APPROVED_WITH_CONDITIONS">DISETUJUI BERSYARAT (LAHAN PENGGANTI)</option>
                    <option value="REJECTED">DITOLAK / TIDAK MEMENUHI SYARAT (REJECTED)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#475569] font-bold mb-1">Klasifikasi Vegetasi / Lahan:</label>
                  <select
                    value={data.klasifikasiLahan}
                    onChange={(e) => setData({ ...data, klasifikasiLahan: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] cursor-pointer"
                  >
                    <option value="Lahan Pertanian Basah / Sawah Irigasi Teknis">Lahan Pertanian Basah / Sawah Irigasi Teknis</option>
                    <option value="Lahan Pertanian Basah / Sawah Irigasi Semi Teknis">Lahan Pertanian Basah / Sawah Irigasi Semi Teknis</option>
                    <option value="Lahan Pertanian Basah / Sawah Tadah Hujan">Lahan Pertanian Basah / Sawah Tadah Hujan</option>
                    <option value="Lahan Sawah Cadangan LP2B Potensial">Lahan Sawah Cadangan LP2B Potensial</option>
                    <option value="Lahan Pertanian Kering / Kebun Campuran (Kakao, Cengkeh, Kopi, Kelapa)">Lahan Pertanian Kering / Kebun Campuran (Kakao, Cengkeh, Kopi, Kelapa)</option>
                    <option value="Lahan Perkebunan Rakyat / Kelapa Sawit">Lahan Perkebunan Rakyat / Kelapa Sawit</option>
                    <option value="Lahan Tambak / Budidaya Perikanan Darat">Lahan Tambak / Budidaya Perikanan Darat</option>
                    <option value="Bukan Lahan Pertanian / Pekarangan Permukiman">Bukan Lahan Pertanian / Pekarangan Permukiman</option>
                    <option value="Lahan Kering Bukan Pertanian / Semak Belukar">Lahan Kering Bukan Pertanian / Semak Belukar</option>
                    {!["Lahan Pertanian Basah / Sawah Irigasi Teknis", "Lahan Pertanian Basah / Sawah Irigasi Semi Teknis", "Lahan Pertanian Basah / Sawah Tadah Hujan", "Lahan Sawah Cadangan LP2B Potensial", "Lahan Pertanian Kering / Kebun Campuran (Kakao, Cengkeh, Kopi, Kelapa)", "Lahan Perkebunan Rakyat / Kelapa Sawit", "Lahan Tambak / Budidaya Perikanan Darat", "Bukan Lahan Pertanian / Pekarangan Permukiman", "Lahan Kering Bukan Pertanian / Semak Belukar"].includes(data.klasifikasiLahan) && (
                      <option value={data.klasifikasiLahan}>{data.klasifikasiLahan} (Kustom)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Indeks Pertanaman (IP):</label>
                  <select
                    value={data.indeksPertanaman}
                    onChange={(e) => setData({ ...data, indeksPertanaman: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] cursor-pointer"
                  >
                    <option value="Kelas I (Indeks Pertanaman IP300 / Panen Padi 3x Setahun)">Kelas I (Indeks Pertanaman IP300 / Panen Padi 3x Setahun)</option>
                    <option value="Kelas II (Indeks Pertanaman IP200 / Produksi Padi-Palawija)">Kelas II (Indeks Pertanaman IP200 / Produksi Padi-Palawija)</option>
                    <option value="Kelas III (Indeks Pertanaman IP100 / Panen Padi 1x Setahun)">Kelas III (Indeks Pertanaman IP100 / Panen Padi 1x Setahun)</option>
                    <option value="Non-Padi / Tanaman Tahunan dan Hortikultura Perkebunan">Non-Padi / Tanaman Tahunan dan Hortikultura Perkebunan</option>
                    <option value="IP 0 (Lahan Bera / Non-Produktif / Pekarangan)">IP 0 (Lahan Bera / Non-Produktif / Pekarangan)</option>
                    {!["Kelas I (Indeks Pertanaman IP300 / Panen Padi 3x Setahun)", "Kelas II (Indeks Pertanaman IP200 / Produksi Padi-Palawija)", "Kelas III (Indeks Pertanaman IP100 / Panen Padi 1x Setahun)", "Non-Padi / Tanaman Tahunan dan Hortikultura Perkebunan", "IP 0 (Lahan Bera / Non-Produktif / Pekarangan)"].includes(data.indeksPertanaman) && (
                      <option value={data.indeksPertanaman}>{data.indeksPertanaman} (Kustom)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Kondisi Jaringan Irigasi:</label>
                  <select
                    value={data.kondisiIrigasi}
                    onChange={(e) => setData({ ...data, kondisiIrigasi: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] cursor-pointer"
                  >
                    <option value="Tersedia Jaringan Irigasi Primer dan Sekunder Aktif (Daerah Irigasi Teknis Kab. Luwu)">Tersedia Jaringan Irigasi Primer dan Sekunder Aktif (Daerah Irigasi Teknis Kab. Luwu)</option>
                    <option value="Tersedia Saluran Irigasi Sekunder dan Tersier Aktif Pengairan Musim Tanam">Tersedia Saluran Irigasi Sekunder dan Tersier Aktif Pengairan Musim Tanam</option>
                    <option value="Jaringan Irigasi Pedesaan / Sederhana Berfungsi Baik">Jaringan Irigasi Pedesaan / Sederhana Berfungsi Baik</option>
                    <option value="Sistem Pompanisasi Pertanian / Sumur Bor Air Tanah">Sistem Pompanisasi Pertanian / Sumur Bor Air Tanah</option>
                    <option value="Non-Irigasi / Lahan Tadah Hujan Murni">Non-Irigasi / Lahan Tadah Hujan Murni</option>
                    <option value="Tidak Bersinggungan Dengan Jaringan Irigasi Teknis Maupun Tersier">Tidak Bersinggungan Dengan Jaringan Irigasi Teknis Maupun Tersier</option>
                    <option value="Saluran Irigasi Rusak Berat / Tidak Berfungsi">Saluran Irigasi Rusak Berat / Tidak Berfungsi</option>
                    {!["Tersedia Jaringan Irigasi Primer dan Sekunder Aktif (Daerah Irigasi Teknis Kab. Luwu)", "Tersedia Saluran Irigasi Sekunder dan Tersier Aktif Pengairan Musim Tanam", "Jaringan Irigasi Pedesaan / Sederhana Berfungsi Baik", "Sistem Pompanisasi Pertanian / Sumur Bor Air Tanah", "Non-Irigasi / Lahan Tadah Hujan Murni", "Tidak Bersinggungan Dengan Jaringan Irigasi Teknis Maupun Tersier", "Saluran Irigasi Rusak Berat / Tidak Berfungsi"].includes(data.kondisiIrigasi) && (
                      <option value={data.kondisiIrigasi}>{data.kondisiIrigasi} (Kustom)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[#475569] font-bold mb-1">Rasio Lahan Pengganti:</label>
                  <select
                    value={data.rasioLahanPengganti}
                    onChange={(e) => setData({ ...data, rasioLahanPengganti: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] cursor-pointer"
                  >
                    <option value="1:1 (Setara Luasan Bersinggungan LP2B)">1:1 (Setara Luasan Bersinggungan LP2B)</option>
                    <option value="1:2 (Luas Pengganti 2x Lipat - Sawah Beririgasi Teknis)">1:2 (Luas Pengganti 2x Lipat - Sawah Beririgasi Teknis)</option>
                    <option value="1:3 (Luas Pengganti 3x Lipat - Kawasan Inti Pangan Prioritas)">1:3 (Luas Pengganti 3x Lipat - Kawasan Inti Pangan Prioritas)</option>
                    <option value="Nihil (Bebas Kewajiban Lahan Pengganti / Lahan Non-LP2B)">Nihil (Bebas Kewajiban Lahan Pengganti / Lahan Non-LP2B)</option>
                    <option value="Kompensasi Cetak Sawah Baru di Luwu (Rasio 1:1)">Kompensasi Cetak Sawah Baru di Luwu (Rasio 1:1)</option>
                    {!["1:1 (Setara Luasan Bersinggungan LP2B)", "1:2 (Luas Pengganti 2x Lipat - Sawah Beririgasi Teknis)", "1:3 (Luas Pengganti 3x Lipat - Kawasan Inti Pangan Prioritas)", "Nihil (Bebas Kewajiban Lahan Pengganti / Lahan Non-LP2B)", "Kompensasi Cetak Sawah Baru di Luwu (Rasio 1:1)"].includes(data.rasioLahanPengganti) && (
                      <option value={data.rasioLahanPengganti}>{data.rasioLahanPengganti} (Kustom)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Luas Wajib Pengganti (Ha):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.luasWajibLahanPenggantiHa}
                    onChange={(e) => setData({ ...data, luasWajibLahanPenggantiHa: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-bold mb-1">Lokasi Usulan Pengganti:</label>
                  <select
                    value={data.lokasiUsulanLahanPengganti}
                    onChange={(e) => setData({ ...data, lokasiUsulanLahanPengganti: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] cursor-pointer"
                  >
                    <option value="Kecamatan Bua / Kecamatan Ponrang, Kabupaten Luwu">Kecamatan Bua / Kecamatan Ponrang, Kabupaten Luwu</option>
                    <option value="Kecamatan Walenrang / Kecamatan Lamasi (Walmas), Kabupaten Luwu">Kecamatan Walenrang / Kecamatan Lamasi (Walmas), Kabupaten Luwu</option>
                    <option value="Kecamatan Belopa / Belopa Utara, Kabupaten Luwu">Kecamatan Belopa / Belopa Utara, Kabupaten Luwu</option>
                    <option value="Kecamatan Bajo / Bajo Barat, Kabupaten Luwu">Kecamatan Bajo / Bajo Barat, Kabupaten Luwu</option>
                    <option value="Kecamatan Suli / Suli Barat, Kabupaten Luwu">Kecamatan Suli / Suli Barat, Kabupaten Luwu</option>
                    <option value="Kecamatan Kamanre / Ponrang Selatan, Kabupaten Luwu">Kecamatan Kamanre / Ponrang Selatan, Kabupaten Luwu</option>
                    <option value="Kecamatan Larompong / Larompong Selatan, Kabupaten Luwu">Kecamatan Larompong / Larompong Selatan, Kabupaten Luwu</option>
                    <option value="- (Nihil / Bebas Kewajiban)">- (Nihil / Bebas Kewajiban)</option>
                    <option value="- (Tidak Bersedia Menyediakan Lahan Pengganti)">- (Tidak Bersedia Menyediakan Lahan Pengganti)</option>
                    {!["Kecamatan Bua / Kecamatan Ponrang, Kabupaten Luwu", "Kecamatan Walenrang / Kecamatan Lamasi (Walmas), Kabupaten Luwu", "Kecamatan Belopa / Belopa Utara, Kabupaten Luwu", "Kecamatan Bajo / Bajo Barat, Kabupaten Luwu", "Kecamatan Suli / Suli Barat, Kabupaten Luwu", "Kecamatan Kamanre / Ponrang Selatan, Kabupaten Luwu", "Kecamatan Larompong / Larompong Selatan, Kabupaten Luwu", "- (Nihil / Bebas Kewajiban)", "- (Tidak Bersedia Menyediakan Lahan Pengganti)"].includes(data.lokasiUsulanLahanPengganti) && (
                      <option value={data.lokasiUsulanLahanPengganti}>{data.lokasiUsulanLahanPengganti} (Kustom)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* SEKSI KHUSUS ALASAN PENOLAKAN (JIKA STATUS REJECTED) */}
              {data.statusKeputusan === "REJECTED" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-red-800 font-bold text-[11px] uppercase">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-red-600" />
                      <span>Alasan &amp; Dasar Pertimbangan Penolakan BAP-LP2B</span>
                    </span>
                    <span className="text-[10px] text-red-600 font-normal">Wajib Diisi untuk Dokumen BAP Penolakan</span>
                  </div>

                  <div>
                    <label className="block text-[#475569] font-bold text-[10px] mb-1">Pilih Alasan Standar Penolakan LP2B:</label>
                    <select
                      value={data.rejectionReason || ""}
                      onChange={(e) => setData({ ...data, rejectionReason: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-red-900 font-semibold cursor-pointer text-xs"
                    >
                      <option value="Lahan permohonan bersinggungan 100% dengan Zona Inti Lahan Pertanian Pangan Berkelanjutan (LP2B) Aktif Beririgasi Teknis Kelas I (IP300) yang dilindungi secara mutlak oleh UU No. 41/2009 dan Perda Perlindungan LP2B Kabupaten Luwu serta berpotensi memutus saluran irigasi primer pengairan persawahan masyarakat.">
                        1. Sawah Irigasi Teknis Primer Mutlak (IP300) &amp; Memutus Jaringan Irigasi
                      </option>
                      <option value="Pemohon tidak bersedia memenuhi kewajiban kompensasi penyediaan lahan pengganti LP2B seluas rasio yang diwajibkan peraturan perundang-undangan (Rasio 1:1 hingga 1:3).">
                        2. Tidak Memenuhi Kewajiban Kompensasi Lahan Pengganti
                      </option>
                      <option value="Rencana alih fungsi lahan mengancam kedaulatan pangan wilayah dan berada pada daerah resapan air pertanian kritis Kabupaten Luwu.">
                        3. Mengancam Kedaulatan Pangan &amp; Resapan Air Kritis
                      </option>
                      <option value="Lokasi permohonan berada dalam sengketa kepemilikan agraria dan tidak memiliki bukti hak atas tanah yang sah.">
                        4. Sengketa Kepemilikan Lahan / Legalitas Tidak Sah
                      </option>
                      {data.rejectionReason && ![
                        "Lahan permohonan bersinggungan 100% dengan Zona Inti Lahan Pertanian Pangan Berkelanjutan (LP2B) Aktif Beririgasi Teknis Kelas I (IP300) yang dilindungi secara mutlak oleh UU No. 41/2009 dan Perda Perlindungan LP2B Kabupaten Luwu serta berpotensi memutus saluran irigasi primer pengairan persawahan masyarakat.",
                        "Pemohon tidak bersedia memenuhi kewajiban kompensasi penyediaan lahan pengganti LP2B seluas rasio yang diwajibkan peraturan perundang-undangan (Rasio 1:1 hingga 1:3).",
                        "Rencana alih fungsi lahan mengancam kedaulatan pangan wilayah dan berada pada daerah resapan air pertanian kritis Kabupaten Luwu.",
                        "Lokasi permohonan berada dalam sengketa kepemilikan agraria dan tidak memiliki bukti hak atas tanah yang sah."
                      ].includes(data.rejectionReason) && (
                        <option value={data.rejectionReason}>{data.rejectionReason} (Kustom)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#475569] font-bold text-[10px] mb-1">Rincian Narasi Alasan Penolakan (Dapat Diedit):</label>
                    <textarea
                      rows={2}
                      value={data.rejectionReason || ""}
                      onChange={(e) => setData({ ...data, rejectionReason: e.target.value })}
                      placeholder="Tuliskan uraian pertimbangan teknis penolakan rekomendasi alih fungsi LP2B..."
                      className="w-full px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-red-900 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {/* SEKSI PEJABAT PERTANIAN */}
              <div className="pt-2">
                <div className="font-bold text-[#1e293b] mb-2 uppercase text-[11px] tracking-wide border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>Pejabat Penandatangan Dinas Pertanian Kabupaten Luwu</span>
                  <span className="text-[10px] text-[#0284c7] font-normal">Sesuai Struktur Resmi Dinas Pertanian</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3 border border-[#cbd5e1] rounded-xl">
                  {/* Kadis */}
                  <div className="space-y-2 p-2.5 bg-[#f8fafc] border border-slate-200 rounded-lg">
                    <div className="font-bold text-[#0f172a] text-[11px] border-b pb-1 text-emerald-800">
                      a. Kepala Dinas Pertanian
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
                  </div>

                  {/* Kabid LP2B */}
                  <div className="space-y-2 p-2.5 bg-[#f8fafc] border border-slate-200 rounded-lg">
                    <div className="font-bold text-[#0f172a] text-[11px] border-b pb-1 text-emerald-800">
                      b. Kabid Perlindungan Lahan (LP2B)
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
                  </div>

                  {/* Kasi / Analis GIS */}
                  <div className="space-y-2 p-2.5 bg-[#f8fafc] border border-slate-200 rounded-lg">
                    <div className="font-bold text-[#0f172a] text-[11px] border-b pb-1 text-emerald-800">
                      c. Analis Spasial Lahan & Irigasi
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">Nama Analis GIS:</label>
                      <input
                        type="text"
                        value={data.analisGisNama || ""}
                        onChange={(e) => setData({ ...data, analisGisNama: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold text-[10px] mb-0.5">NIP Analis GIS:</label>
                      <input
                        type="text"
                        value={data.analisGisNip || ""}
                        onChange={(e) => setData({ ...data, analisGisNip: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-[#0f172a]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MAIN 4-PAGE PRINTABLE CONTAINER (Simetris 100% dengan BAP-KTR PUPTR) */}
      <div 
        ref={documentContainerRef} 
        id="pertanian-bap-printable-document" 
        className="bap-lp2b-document-container flex flex-col items-center gap-6 print:gap-0 max-w-[210mm] mx-auto print:max-w-none print:w-[210mm] print:m-0 print:p-0"
      >
        {/* =========================================================================
            HALAMAN 1: KOP SURAT, DATA PEMOHON & SEKSI A AUDIT LP2B
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page1") && (
          <div 
            className="bap-lp2b-print-page BAP-LP2B-Modal-Container bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "20mm",   // Margin Kiri Presisi 2.0 cm (Simetris Sejajar PUPTR)
              paddingTop: "15mm",    // Margin Atas Presisi 1.5 cm
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
            {/* A. KOP SURAT DINAS PERTANIAN KABUPATEN LUWU (Symmetrical 3-Column Balance) */}
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
                  DINAS PERTANIAN
                </div>
                <div style={{ fontSize: "11.5pt", fontWeight: "bold", textTransform: "uppercase", color: "#000000", marginTop: "1px", lineHeight: 1.12 }}>
                  BIDANG PRASARANA, SARANA DAN PERLINDUNGAN LAHAN (LP2B)
                </div>
                <div style={{ fontSize: "9pt", color: "#000000", marginTop: "2px", lineHeight: 1.2 }}>
                  Kompleks Perkantoran Pemerintah Kabupaten Luwu, Jl. Jenderal Sudirman No. 1, Belopa Kode Pos : 91994
                </div>
                <div style={{ fontSize: "8pt", color: "#000000", marginTop: "1px" }}>
                  Email: pertanian@luwukab.go.id • Website: https://pertanian.luwukab.go.id
                </div>
              </div>

              {/* Balance Right Spacer to guarantee 100% mathematical center */}
              <div style={{ width: "22mm", flexShrink: 0, marginLeft: "10px" }} />
            </div>
            {/* Double Border Line Accent */}
            <div style={{ borderBottom: "1px solid #000000", marginBottom: "10px" }} />

            {/* B. JUDUL DOKUMEN */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "12.5pt", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2 }}>
                BERITA ACARA PEMBAHASAN PERTIMBANGAN TEKNIS KELAYAKAN LAHAN &amp; REKOMENDASI ALIH FUNGSI LP2B (BAP-LP2B)
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
              Pada hari ini, <b>{data.hariTanggalPemeriksaan}</b>, bertempat di Kantor Dinas Pertanian Kabupaten Luwu, Tim Teknis Penilai Kelayakan Lahan dan Perlindungan Lahan Pertanian Pangan Berkelanjutan (LP2B) telah melakukan audit teknis spasial, evaluasi ketersediaan jaringan air irigasi, dan survei lapangan terhadap permohonan rekomendasi teknis alih fungsi lahan berdasarkan ketentuan <b>Undang-Undang Nomor 41 Tahun 2009</b> tentang Perlindungan Lahan Pertanian Pangan Berkelanjutan, <b>Peraturan Pemerintah Nomor 1 Tahun 2011</b> tentang Penetapan dan Alih Fungsi Lahan Pertanian Pangan Berkelanjutan, <b>Peraturan Pemerintah Nomor 12 Tahun 2012</b> tentang Insentif Perlindungan LP2B, serta <b>Peraturan Daerah Kabupaten Luwu Nomor 3 Tahun 2024</b> tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2024-2044, dengan rincian data permohonan sebagai berikut:
            </div>

            {/* TABEL DATA PEMOHON (Sumbu Kolom Presisi Sesuai BAP PUPTR) */}
            <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "9.5pt", marginBottom: "10px", lineHeight: 1.35 }}>
              <colgroup>
                <col style={{ width: "22px" }} />
                <col style={{ width: "225px" }} />
                <col style={{ width: "14px" }} />
                <col style={{ width: "auto" }} />
              </colgroup>
              <tbody>
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
                  <td style={{ verticalAlign: "top", padding: "2px 0" }}>Nama Badan Usaha / Lembaga</td>
                  <td style={{ verticalAlign: "top", padding: "2px 0", textAlign: "center" }}>:</td>
                  <td style={{ verticalAlign: "top", padding: "2px 0", fontWeight: "bold" }}>{data.namaPerusahaan}</td>
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
                  <td style={{ verticalAlign: "top", padding: "2px 0" }}>{data.fungsiBangunan || data.sektorUsaha} {data.kbliCode ? `(KBLI: ${data.kbliCode})` : ""}</td>
                </tr>
                <tr>
                  <td style={{ verticalAlign: "top", padding: "2px 0" }}>6.</td>
                  <td style={{ verticalAlign: "top", padding: "2px 0" }}>Lokasi Rencana Permohonan</td>
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
              </tbody>
            </table>

            {/* D. SEKSI A: HASIL AUDIT AGRARIA & STATUS PERLINDUNGAN LP2B */}
            <div style={{ fontSize: "10.5pt", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1.5px solid #000000", paddingBottom: "2px", marginBottom: "6px" }}>
              A. HASIL AUDIT TEKNIS AGRARIA, KONDISI IRIGASI &amp; STATUS LP2B
            </div>

            <div style={{ fontSize: "11pt", lineHeight: 1.4, textAlign: "justify", marginBottom: "4px" }}>
              Berdasarkan hasil analisis tumpang susun spasial (spatial overlay analysis) pada Geoportal Tematik Dinas Pertanian Kabupaten Luwu dengan sistem proyeksi <b>{data.sistemKoordinat}</b>, diperoleh hasil audit teknis sebagai berikut:
            </div>

            <ol style={{ margin: "4px 0 0 0", paddingLeft: "18px", fontSize: "9.5pt", lineHeight: 1.38 }}>
              <li style={{ marginBottom: "4px" }}>
                <b>Klasifikasi &amp; Tipologi Lahan Eksisting</b>: Lokasi lahan teridentifikasi sebagai <b>{data.klasifikasiLahan}</b> dengan tingkat produktivitas <b>{data.indeksPertanaman}</b>.
              </li>
              <li style={{ marginBottom: "4px" }}>
                <b>Ketersediaan Jaringan Air Irigasi</b>: {data.kondisiIrigasi}, serta tidak merusak keandalan debit saluran sekunder bagi petak persawahan di hilir.
              </li>
              <li style={{ marginBottom: "4px" }}>
                <b>Status Perlindungan Lahan (LP2B)</b>: {data.keteranganLp2b}. Persentase luas lahan yang bersinggungan langsung dengan delineasi LP2B adalah sebesar <b>{data.tumpangTindihLp2bPersen}% ({data.luasTumpangTindihHa} Ha)</b>.
              </li>
              <li style={{ marginBottom: "4px" }}>
                <b>Kewajiban Kompensasi Lahan Pengganti</b>: Berdasarkan regulasi PP No. 1/2011, pemohon wajib menyediakan lahan pengganti seluas <b>{data.luasWajibLahanPenggantiHa} Ha ({data.rasioLahanPengganti})</b> di wilayah {data.lokasiUsulanLahanPengganti}.
              </li>
              <li style={{ marginBottom: "4px" }}>
                <b>Integritas Topologi Spasial</b>: {data.validasiTopologi}.
              </li>
            </ol>

            {/* Footer Hal 1 */}
            <div style={{ position: "absolute", bottom: "10mm", left: "20mm", right: "20mm", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "3px" }}>
              <span>Berita Acara Pembahasan Pertimbangan Teknis LP2B (BAP-LP2B) Dinas Pertanian Luwu</span>
              <span>Halaman 1 dari 4</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            HALAMAN 2: SEKSI B KEPUTUSAN, REKOMENDASI & TANDA TANGAN DINAS PERTANIAN
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page2") && (
          <div 
            className="bap-lp2b-print-page BAP-LP2B-Modal-Container bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
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

            {/* E. SEKSI B: KEPUTUSAN DAN REKOMENDASI TEKNIS PERTANIAN */}
            <div style={{ fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1.5px solid #000000", paddingBottom: "3px", marginBottom: "10px" }}>
              B. KEPUTUSAN DAN PERTIMBANGAN TEKNIS REKOMENDASI ALIH FUNGSI LP2B
            </div>

            {/* KOTAK HIGHLIGHT KEPUTUSAN FORMAL PERTANIAN */}
            <div 
              style={{ 
                border: "2px solid #166534", 
                backgroundColor: "#f0fdf4", 
                color: "#14532d", 
                padding: "8px 12px", 
                textAlign: "center", 
                marginBottom: "12px"
              }}
            >
              <div style={{ fontSize: "9.5pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                KESIMPULAN AUDIT TEKNIS AGRARIA &amp; PERLINDUNGAN LP2B:
              </div>
              <div style={{ fontSize: "11.5pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "2px", color: "#166534" }}>
                DINYATAKAN : {data.statusKeputusan === "APPROVED" 
                  ? "MEMENUHI SYARAT REKOMENDASI TEKNIS ALIH FUNGSI LP2B (DISETUJUI)" 
                  : data.statusKeputusan === "APPROVED_WITH_CONDITIONS"
                  ? "DISETUJUI DENGAN PERSYARATAN KHUSUS LAHAN PENGGANTI LP2B"
                  : "TIDAK MEMENUHI SYARAT / DITOLAK (REJECTED)"}
              </div>
              <div style={{ fontSize: "9pt", marginTop: "2px", color: "#15803d" }}>
                Luas Lahan Disetujui: <b>{data.luasLahanDisetujui}</b> | Kewajiban Pengganti: <b>{data.luasWajibLahanPenggantiHa} Ha ({data.rasioLahanPengganti})</b>
              </div>
            </div>

            <div style={{ fontSize: "11pt", lineHeight: 1.45, textAlign: "justify", marginBottom: "8px" }}>
              Sehubungan dengan kesimpulan audit tersebut di atas, Dinas Pertanian Kabupaten Luwu memberikan <b>Pertimbangan Teknis dan Rekomendasi Alih Fungsi Lahan Pertanian Pangan Berkelanjutan (LP2B)</b> kepada Tim Teknis Dinas Pekerjaan Umum dan Penataan Ruang (PUPTR) serta DPMPTSP Kabupaten Luwu dengan parameter teknis sebagai berikut:
            </div>

            {/* Tabel Ketentuan Teknis Pertanian & Kompensasi */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt", marginBottom: "10px", border: "1px solid #000000", lineHeight: 1.35 }}>
              <tbody>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold", width: "42%" }}>Status Kawasan Eksisting</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>{data.klasifikasiLahan} ({data.indeksPertanaman})</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold" }}>Luas Bersinggungan LP2B</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>{data.luasTumpangTindihHa} Ha ({data.tumpangTindihLp2bPersen}%)</td>
                </tr>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold" }}>Kewajiban Lahan Pengganti LP2B</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold", color: "#166534" }}>
                    {data.luasWajibLahanPenggantiHa} Ha (Rasio {data.rasioLahanPengganti})
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold" }}>Lokasi Usulan Lahan Pengganti</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>{data.lokasiUsulanLahanPengganti}</td>
                </tr>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: "bold" }}>Mitigasi Saluran Irigasi Tersier</td>
                  <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>Wajib menjaga kelancaran pengairan sawah sekitar &amp; dilarang memutus saluran air</td>
                </tr>
              </tbody>
            </table>

            {/* Catatan Khusus */}
            <div style={{ fontSize: "10pt", fontWeight: "bold", marginBottom: "3px" }}>Syarat dan Ketentuan Pertimbangan Teknis Tambahan:</div>
            <ol style={{ margin: "0 0 12px 0", paddingLeft: "18px", fontSize: "9.5pt", lineHeight: 1.4 }}>
              {data.catatanRekomendasiTeknis.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "3px" }}>{item}</li>
              ))}
            </ol>

            <div style={{ fontSize: "11pt", lineHeight: 1.45, textAlign: "justify", marginBottom: "14px" }}>
              Demikian Berita Acara Pembahasan Pertimbangan Teknis Kelayakan Lahan dan Rekomendasi Alih Fungsi Lahan Pertanian Pangan Berkelanjutan (BAP-LP2B) ini dibuat dengan sebenarnya untuk dipergunakan sebagai bahan pertimbangan teknis dalam penerbitan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) dan perizinan investasi oleh Pejabat yang Berwenang.
            </div>

            {/* F. BLOK TANDA TANGAN GANDA PEJABAT PERTANIAN */}
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
              <span>Berita Acara Pembahasan Pertimbangan Teknis LP2B (BAP-LP2B) Dinas Pertanian Luwu</span>
              <span>Halaman 2 dari 4</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            HALAMAN 3: LAMPIRAN I (PETA DELINEASI GEOSPASIAL LP2B & JARINGAN IRIGASI)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page3") && (
          <div 
            className="bap-lp2b-print-page BAP-LP2B-Modal-Container bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
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
                LAMPIRAN I BERITA ACARA PEMBAHASAN PERTIMBANGAN TEKNIS LP2B
              </div>
              <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#166534", textTransform: "uppercase", marginTop: "2px" }}>
                PETA DELINEASI GEOSPASIAL LAHAN PERTANIAN PANGAN BERKELANJUTAN (LP2B) &amp; JARINGAN IRIGASI
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
                  tipeDoc: 'LP2B',
                  nomorSurat: data.nomorSurat,
                  koordinatPoligon: data.koordinatPoligon,
                  statusLp2b: data.statusLp2b
                })} 
                alt="Peta Delineasi Geospasial LP2B & Irigasi" 
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                onError={(e) => {
                  const fallbackUrl = generateLuwuGisMapSvgDataUrl({
                    desa: data.desaKelurahan,
                    kecamatan: data.kecamatan,
                    pemohon: data.namaPemohon,
                    perusahaan: data.namaPerusahaan,
                    luas: data.luasLahanDisetujui,
                    tipeDoc: 'LP2B',
                    nomorSurat: data.nomorSurat,
                    koordinatPoligon: data.koordinatPoligon,
                    statusLp2b: data.statusLp2b
                  });
                  if (e.currentTarget.src !== fallbackUrl) {
                    e.currentTarget.src = fallbackUrl;
                  }
                }}
              />
            </div>

            {/* Catatan Analis Spasial Lahan & Irigasi */}
            <div style={{ border: "1px solid #000000", padding: "8px 10px", fontSize: "9pt", backgroundColor: "#f8fafc", marginBottom: "12px", width: "100%", boxSizing: "border-box" }}>
              <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "3px" }}>Catatan Analis Spasial Lahan &amp; Irigasi Pertanian:</div>
              <div style={{ textAlign: "justify", lineHeight: 1.4 }}>
                {data.catatanSurveyor}
              </div>
            </div>

            {/* Pengesahan Petugas Pemeta */}
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "230px", textAlign: "center", fontSize: "9.5pt" }}>
                <div>Belopa, {data.tanggalDokumen}</div>
                <div style={{ fontWeight: "bold" }}>{data.analisGisJabatan || "Analis Spasial Lahan & Irigasi Pertanian"},</div>
                <div style={{ height: "45px" }} />
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>{data.analisGisNama || "MUHAMMAD FACHRI, S.P."}</div>
                <div>NIP. {data.analisGisNip || "19930412 201903 1 005"}</div>
              </div>
            </div>

            {/* Footer Hal 3 */}
            <div style={{ position: "absolute", bottom: "10mm", left: "20mm", right: "20mm", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#64748b", borderTop: "1px solid #cbd5e1", paddingTop: "3px" }}>
              <span>Lampiran I: Peta Delineasi Geospasial LP2B • Dinas Pertanian Kabupaten Luwu</span>
              <span>Halaman 3 dari 4</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            HALAMAN 4: LAMPIRAN II (TABEL KOORDINAT GEOGRAFIS BATAS LAHAN)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page4") && (
          <div 
            className="bap-lp2b-print-page BAP-LP2B-Modal-Container bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
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
                LAMPIRAN II BERITA ACARA PEMBAHASAN PERTIMBANGAN TEKNIS LP2B
              </div>
              <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#166534", textTransform: "uppercase", marginTop: "2px" }}>
                TABEL KOORDINAT GEOGRAFIS TITIK POLIGON PERSIL &amp; SEKITAR SALURAN IRIGASI
              </div>
              <div style={{ fontSize: "9pt", marginTop: "2px" }}>
                Nomor Dokumen: <b>{data.nomorSurat}</b>
              </div>
            </div>

            <div style={{ fontSize: "11pt", textAlign: "justify", marginBottom: "8px", lineHeight: 1.4 }}>
              Daftar titik koordinat poligon batas bidang tanah yang dimohonkan dan telah diverifikasi oleh Tim Teknis Dinas Pertanian sesuai format Standar Sistem Informasi Geografis WGS 1984:
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

            {/* Keterangan Sistem Geodesi & Irigasi */}
            <div style={{ border: "1px solid #000000", padding: "6px 10px", fontSize: "8.5pt", backgroundColor: "#f8fafc", marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
              <b>Ketentuan Teknis Geospasial &amp; Irigasi Pertanian:</b>
              <ul style={{ margin: "2px 0 0 0", paddingLeft: "16px", lineHeight: 1.35 }}>
                <li>Koordinat batas bidang tanah di atas diverifikasi sebagai acuan pertimbangan teknis alih fungsi lahan LP2B.</li>
                <li>Pemohon dilarang melakukan penimbunan atau penutupan saluran air irigasi yang melintasi atau berbatasan langsung dengan koordinat persil tersebut di atas.</li>
              </ul>
            </div>

            {/* Pengesahan Akhir Lampiran II */}
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
                        {data.kasiJabatan || "Kepala Seksi Lahan dan Irigasi Pertanian"},
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
                      <div style={{ fontSize: "10pt", fontWeight: "bold", textDecoration: "underline" }}>{data.kasiNama || "ANDI TENRI SENO, S.P."}</div>
                      <div style={{ fontSize: "9pt", color: "#000000", marginTop: "1px" }}>NIP. {data.kasiNip || "19890518 201202 1 006"}</div>
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
              <span>Lampiran II: Tabel Titik Koordinat Poligon LP2B • Dinas Pertanian Kabupaten Luwu</span>
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
          .bap-lp2b-document-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .bap-lp2b-print-page {
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
 * Utility function to convert application object + settings to BapLp2bDocumentData
 */
export function convertAppToBapLp2bData(
  app: any,
  agriSettings?: any,
  customMapSnapshot?: string
): BapLp2bDocumentData {
  let coords: BapLp2bCoordinatePoint[] = [];
  if (app?.geometry) {
    coords = extractCoordinatesFromGeometryPertanian(app.geometry);
  }
  if (coords.length === 0) {
    coords = DEFAULT_BAP_LP2B_DATA.koordinatPoligon;
  }

  const isNonBerusaha = 
    app?.category === "Non-Berusaha" || 
    app?.jenis_permohonan === "Non-Berusaha" || 
    (!app?.nib && !app?.nib_oss && !app?.nama_badan_usaha && !app?.perusahaan);

  const jenisPermohonan = isNonBerusaha ? "Non-Berusaha" : "Berusaha";
  const year = new Date().getFullYear();
  const isApproved = app?.agriStatus === 'Approved' || app?.pertanianStatus === 'APPROVED';
  const isRejected = app?.agriStatus === 'Rejected' || app?.pertanianStatus === 'REJECTED';

  const namaLembaga = app?.nama_lembaga || app?.perusahaan || app?.companyName || (isNonBerusaha ? (app?.nama_organisasi || app?.title || "Panitia Pembangunan / Perseorangan") : "PT / CV Badan Usaha");
  const fungsiBangunan = app?.fungsi_bangunan || app?.fungsi || (isNonBerusaha ? (app?.title || "Pembangunan Sarana Non-Berusaha") : (app?.sector || "Kegiatan Usaha / Komersial"));

  const luasM2Val = Number(app?.luas_m2 || (app?.areaHa ? Number(app.areaHa) * 10000 : 10000));
  const luasHaVal = (luasM2Val / 10000);
  const formattedLuas = `${luasHaVal.toFixed(2)} Ha (${luasM2Val.toLocaleString('id-ID')} m²)`;

  const overlapPct = app?.overlapPct || 35;
  const overlapHa = Number((luasHaVal * (overlapPct / 100)).toFixed(2));

  return {
    jenisPermohonan,
    kategoriPermohonan: app?.category || (isNonBerusaha ? "Non-Berusaha" : "Berusaha"),
    fungsiBangunan,
    namaLembagaOrganisasi: namaLembaga,
    luasBangunanRencana: app?.luas_bangunan_m2 ? `${app.luas_bangunan_m2} m²` : (app?.luasBangunan ? `${app.luasBangunan}` : "1.200 m²"),

    nomorSurat: app?.beritaAcaraDocNum || app?.pertanianBaNumber || (
      isNonBerusaha
        ? `520.1/089/BA-LP2B-NB/DISTAN-LW/${year}`
        : `520.1/042/BA-LP2B/DISTAN-LW/${year}`
    ),
    nomorSuratRekomendasi: app?.suratRekomendasiNum || (
      isNonBerusaha
        ? `520.1/089/SKR-LP2B-NB/DISTAN-LW/${year}`
        : `520.1/042/SKR-LP2B/DISTAN-LW/${year}`
    ),
    tentangSurat: isNonBerusaha
      ? `PENILAIAN KELAYAKAN TEKNIS AGRARIA & PERLINDUNGAN LAHAN PERTANIAN PANGAN BERKELANJUTAN (LP2B) NON-BERUSAHA ${fungsiBangunan.toUpperCase()} KABUPATEN LUWU`
      : `PENILAIAN KELAYAKAN TEKNIS AGRARIA, KETERSEDIAAN AIR IRIGASI DAN REKOMENDASI ALIH FUNGSI LAHAN PERTANIAN PANGAN BERKELANJUTAN (LP2B) ATAS NAMA ${(app?.applicantName || app?.companyName || 'PEMOHON').toUpperCase()}`,
    
    tanggalDokumen: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    hariTanggalPemeriksaan: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),

    nibNik: app?.nibNik || (isNonBerusaha
      ? (app?.nik || app?.nik_pemohon || app?.plot_number || '-')
      : (app?.nib ? `${app.nib} / ${app.nik || app.nik_pemohon || '-'}` : (app?.nib_oss || app?.plot_number || '-'))),
    namaPemohon: app?.applicantName || app?.nama_pemohon || app?.contact_pic || (isNonBerusaha ? 'Pemohon Terdaftar' : 'Pelaku Usaha Pemohon'),
    namaPerusahaan: namaLembaga,
    alamatPemohon: app?.applicantAddress || app?.address || app?.alamat || (app?.districtName ? `Kecamatan ${app.districtName}, Kab. Luwu` : 'Kabupaten Luwu, Provinsi Sulawesi Selatan'),
    sektorUsaha: isNonBerusaha ? (fungsiBangunan || "Sarana Non-Berusaha") : (app?.sector || "Pertanian & Pengolahan"),
    kbliCode: isNonBerusaha ? "Non-KBLI" : (app?.kbliCode || "10732"),
    lokasiInvestasi: app?.lokasi_dimohon || app?.address || (app?.villageName && app?.districtName ? `Desa ${app.villageName}, Kec. ${app.districtName}, Kab. Luwu` : 'Kabupaten Luwu'),
    desaKelurahan: app?.desa || app?.desa_kelurahan || app?.villageName ? `Desa ${app?.desa || app?.desa_kelurahan || app?.villageName}` : (app?.villageName || '-'),
    kecamatan: app?.kecamatan || app?.districtName ? `Kecamatan ${app?.kecamatan || app?.districtName}` : (app?.districtName || '-'),
    kabupaten: 'Kabupaten Luwu, Provinsi Sulawesi Selatan',
    luasLahanPermohonan: formattedLuas,
    luasLahanDisetujui: `${formattedLuas} - Sesuai Delineasi Poligon`,
    buktiHakTanah: app?.bukti_tanah || app?.buktiTanah || "Sertipikat Hak Milik (SHM)",

    klasifikasiLahan: isNonBerusaha ? "Pekarangan / Bukan Sawah Irigasi" : (app?.existingCrop ? `Lahan Pertanian (${app.existingCrop})` : "Sawah Irigasi Semi Teknis"),
    indeksPertanaman: isNonBerusaha ? "Non-Sawah / Lahan Kering" : "Kelas II (Indeks Pertanaman IP200)",
    kondisiIrigasi: isNonBerusaha ? "Tidak Bersinggungan Langsung Dengan Saluran Irigasi Teknis" : "Tersedia Saluran Irigasi Sekunder dan Tersier Aktif",
    statusLp2b: isNonBerusaha ? "NON_LP2B" : "LP2B_AKTIF",
    keteranganLp2b: isNonBerusaha 
      ? "LOKASI BERADA DILUAR ZONA LP2B (NON-LP2B) - Bebas dari Perlindungan Lahan Pertanian Pangan Berkelanjutan"
      : `LOKASI BERSINGGUNGAN DENGAN ZONA LP2B SEBESAR ${overlapPct}% (${overlapHa} Ha) - Memerlukan Kompensasi Lahan Pengganti`,
    tumpangTindihLp2bPersen: isNonBerusaha ? 0 : overlapPct,
    luasTumpangTindihHa: isNonBerusaha ? 0 : overlapHa,
    rasioLahanPengganti: isNonBerusaha ? "Nihil" : "1:1 (Setara Luasan Bersinggungan)",
    luasWajibLahanPenggantiHa: isNonBerusaha ? 0 : overlapHa,
    lokasiUsulanLahanPengganti: `Kecamatan ${app?.districtName || 'Bua'}, Kabupaten Luwu`,
    validasiTopologi: "Valid (Zero Self-Intersection, Sistem Koordinat WGS84 UTM Zone 51S)",
    sistemKoordinat: "Universal Transverse Mercator (UTM) Zone 51S - Datum WGS 1984",

    statusKeputusan: isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'APPROVED_WITH_CONDITIONS',
    catatanRekomendasiTeknis: isNonBerusaha ? [
      "Lokasi permohonan berada di luar Kawasan Pertanian Pangan Berkelanjutan (LP2B) dan bukan merupakan sawah beririgasi teknis aktif.",
      "Rencana pemanfaatan ruang tidak mengganggu luasan ketahanan pangan maupun saluran pengairan pertanian sekitar.",
      "Rekomendasi teknis pertanian DISETUJUI TANPA KEWAJIBAN LAHAN PENGGANTI.",
      "Diterbitkan sebagai kelengkapan dokumen pertimbangan teknis untuk penerbitan BAP-PKKPR Dinas PUPTR Kabupaten Luwu."
    ] : [
      "Berdasarkan hasil telaah spasial SIG dan verifikasi lapangan, lokasi permohonan bersinggungan dengan sebagian Kawasan Pertanian Pangan Berkelanjutan (LP2B) Kabupaten Luwu.",
      "Berdasarkan Undang-Undang Nomor 41 Tahun 2009 dan Peraturan Daerah Kabupaten Luwu tentang Perlindungan LP2B, usulan alih fungsi lahan DIREKOMENDASIKAN DAPAT DISETUJUI DENGAN PERSYARATAN KHUSUS.",
      `Pemohon diwajibkan menyediakan Lahan Pengganti LP2B seluas ${overlapHa} Ha (Rasio 1:1) dengan tingkat kesuburan dan ketersediaan air irigasi setara sebelum konstruksi fisik.`,
      "Pemohon wajib menjamin tidak merusak atau memutus jaringan saluran irigasi tersier di sekitar persil lokasi.",
      "Direkomendasikan kepada Tim Teknis Dinas PUPTR dan DPMPTSP Kabupaten Luwu sebagai pertimbangan teknis penerbitan SK PKKPR."
    ],
    rejectionReason: app?.rejectionReason,

    kabidNama: agriSettings?.bidangList?.[0]?.nama || "IR. SYAMSUL BAHRI, S.P., M.Si.",
    kabidNip: agriSettings?.bidangList?.[0]?.nip || "19750614 200212 1 004",
    kabidJabatan: "Kepala Bidang Prasarana, Sarana dan Perlindungan Lahan (LP2B)",
    kadisNama: agriSettings?.kepalaDinas?.fullName || "IR. H. JUMADI, M.Si.",
    kadisNip: agriSettings?.kepalaDinas?.nip || "19710324 199603 1 002",
    kadisJabatan: "Kepala Dinas Pertanian",
    kadisPangkat: agriSettings?.kepalaDinas?.pangkatGolongan || "Pembina Utama Muda (IV/c)",

    kasiNama: "ANDI TENRI SENO, S.P.",
    kasiNip: "19890518 201202 1 006",
    kasiJabatan: "Kepala Seksi Lahan dan Irigasi Pertanian",

    petaImageUrl: customMapSnapshot || app?.mapSnapshotUrl || undefined,
    analisGisNama: "MUHAMMAD FACHRI, S.P.",
    analisGisNip: "19930412 201903 1 005",
    analisGisJabatan: "Analis Spasial Lahan & Irigasi Pertanian",
    catatanSurveyor: "Hasil survei spasial dan verifikasi lapangan menunjukkan delineasi permohonan telah ditumpangsusunkan langsung dengan Layer Peta Digital LP2B & Jaringan Irigasi Dinas Pertanian Kabupaten Luwu.",
    koordinatPoligon: coords
  };
}

export default BapLp2bPertanianDocument;
