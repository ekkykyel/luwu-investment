import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import { safeHtml2Canvas } from "../../lib/html2canvasShim";
import { OFFICIAL_LUWU_LOGO_URL } from "../LuwuLogo";
import { getOpdSettings } from "../../utils/opdSettingsStorage";
import { getEffectiveMapImageUrl } from "../../utils/luwuGisMapGenerator";
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
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  QrCode
} from "lucide-react";

export interface SkPkkprCoordinatePoint {
  id: number | string;
  pointName: string;
  latitudeDms: string;
  longitudeDms: string;
  latitudeDd: number;
  longitudeDd: number;
}

export interface SkPkkprDpmptspData {
  // Nomor & Judul SK
  nomorSkPkkpr: string;
  tanggalDitetapkan: string;
  tempatDitetapkan?: string;
  jenisPermohonan: "Berusaha" | "Non-Berusaha";
  
  // Referensi Berita Acara OPD Terkait
  nomorBapPuptr: string;
  tanggalBapPuptr: string;
  nomorBapPertanian?: string;
  tanggalBapPertanian?: string;

  // Data Pemohon & Perusahaan
  namaPemohon: string;
  nikPemohon?: string;
  namaPerusahaan: string;
  nibOss: string;
  jabatanPemohon?: string;
  alamatPemohon: string;
  teleponPemohon?: string;
  emailPemohon?: string;

  // Data Rencana Usaha & Lokasi
  sektorUsaha: string;
  skalaUsaha?: string;
  kbliCode: string;
  judulKbli?: string;
  lokasiKegiatan: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupaten: string;
  luasLahanPermohonan: string;
  luasLahanDisetujui: string;
  statusKepemilikanTanah: string;
  dokumenLingkungan?: string;
  nomorRekomendasiFpr?: string;
  tanggalRekomendasiFpr?: string;

  // Audit Spasial & Parameter Teknis Bangunan
  zonaRtrw: string;
  kodeZonaRtrw?: string;
  fungsiBangunan: string;
  koefisienDasarBangunan: string; // KDB (%)
  koefisienLantaiBangunan: string; // KLB
  koefisienDaerahHijau: string; // KDH (%)
  garisSempadanBangunan: string; // GSB
  garisSempadanSungaiPantai?: string; // GSS
  ketinggianMaksimalBangunan?: string;

  // Ketentuan Persyaratan & Masa Berlaku
  ketentuanPersyaratanTeknis: string[];
  masaBerlakuTahun: number;

  // Pejabat Penandatangan & TTE
  kadisNama: string;
  kadisNip: string;
  kadisPangkatGolongan: string;
  kadisJabatan: string;
  isTteSigned?: boolean;
  tteSignedDate?: string;
  tteQrCodeUrl?: string;

  // Peta & Koordinat Spasial
  petaImageUrl?: string;
  koordinatPoligon?: SkPkkprCoordinatePoint[];
}

export interface SkPkkprDpmptspDocumentProps {
  data: SkPkkprDpmptspData;
  onEditRequested?: () => void;
  showControlBar?: boolean;
}

export const SkPkkprDpmptspDocument: React.FC<SkPkkprDpmptspDocumentProps> = ({
  data,
  onEditRequested,
  showControlBar = true
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "page1" | "page2">("all");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);

  const dpmptspSettings = getOpdSettings('dpmptsp');

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export PDF function
  const handleExportPdf = async () => {
    if (!documentContainerRef.current) return;
    setIsExportingPdf(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

      // Create pristine offscreen container mounted to document.body
      // This isolates rendering from scrollbars, responsive flex/grid compression, and CSS transforms
      const offscreenContainer = document.createElement("div");
      offscreenContainer.style.position = "fixed";
      offscreenContainer.style.left = "-9999px";
      offscreenContainer.style.top = "0";
      offscreenContainer.style.width = "210mm";
      offscreenContainer.style.zIndex = "-9999";
      offscreenContainer.style.backgroundColor = "#ffffff";
      document.body.appendChild(offscreenContainer);

      const pages = documentContainerRef.current.querySelectorAll(".sk-pkkpr-print-page");
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;

        // Clone page into pristine off-screen container
        const clonedPage = page.cloneNode(true) as HTMLElement;
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
        if (i > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }

      // Remove offscreen container
      if (document.body.contains(offscreenContainer)) {
        document.body.removeChild(offscreenContainer);
      }

      const cleanFileName = `SK-PKKPR_${data.namaPerusahaan.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      pdf.save(cleanFileName);
    } catch (error) {
      console.error("Gagal mengunduh PDF SK PKKPR:", error);
      alert("Terjadi kendala saat menghasilkan PDF. Silakan gunakan tombol Cetak Dokumen untuk menyimpan sebagai PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. CONTROL TOOLBAR */}
      {showControlBar && (
        <div className="w-full max-w-5xl mb-6 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-700 shadow-2xl flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-100 flex items-center gap-2">
                Surat Keputusan Izin PKKPR DPMPTSP Kab. Luwu
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono border border-teal-500/30 uppercase">
                  {data.jenisPermohonan}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                No: {data.nomorSkPkkpr}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Tabs */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === "all" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Semua Halaman
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("page1")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === "page1" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Hal 1: SK Keputusan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("page2")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === "page2" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Hal 2: Lampiran Spasial
              </button>
            </div>

            {/* Smart Form Trigger */}
            {onEditRequested && (
              <button
                type="button"
                onClick={onEditRequested}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow"
              >
                <Edit3 className="w-4 h-4" />
                Smart Form / Edit SK
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExportingPdf ? "Mengunduh..." : "Unduh PDF (A4)"}
            </button>
          </div>
        </div>
      )}

      {/* 2. PRINTABLE DOCUMENT WRAPPER */}
      <div
        ref={documentContainerRef}
        className="sk-pkkpr-document-container mx-auto flex flex-col items-center gap-8 print:gap-0 print:m-0 p-2 sm:p-4"
        style={{ color: "#000000" }}
      >
        {/* =========================================================================
            HALAMAN 1: KOP SURAT DPMPTSP, KONSIDERAN & DIKTUM MEMUTUSKAN
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page1") && (
          <div
            className="sk-pkkpr-print-page bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "20mm",
              paddingTop: "15mm",
              paddingRight: "20mm",
              paddingBottom: "18mm",
              boxSizing: "border-box",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: "10.5pt",
              lineHeight: 1.35,
              pageBreakAfter: "always",
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* A. KOP SURAT RESMI DPMPTSP KABUPATEN LUWU */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #000000", paddingBottom: "6px", marginBottom: "2px" }}>
              <div style={{ width: "22mm", textAlign: "center", flexShrink: 0, marginRight: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={OFFICIAL_LUWU_LOGO_URL}
                  alt="Logo Kabupaten Luwu"
                  style={{ width: "17mm", height: "21mm", maxHeight: "68px", objectFit: "contain", display: "inline-block" }}
                />
              </div>

              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "13pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000", lineHeight: 1.1 }}>
                  PEMERINTAH KABUPATEN LUWU
                </div>
                <div style={{ fontSize: "14pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000", marginTop: "1px", lineHeight: 1.1 }}>
                  DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU
                </div>
                <div style={{ fontSize: "10pt", fontWeight: "bold", textTransform: "uppercase", color: "#000000", marginTop: "2px", lineHeight: 1.1 }}>
                  BIDANG PENYELENGGARAAN PERIZINAN DAN NONPERIZINAN (OSS-RBA)
                </div>
                <div style={{ fontSize: "8.5pt", color: "#000000", marginTop: "2px", lineHeight: 1.2 }}>
                  Kompleks Perkantoran Pemerintah Kabupaten Luwu, Jl. Jendral Sudirman No. 1 Belopa
                </div>
                <div style={{ fontSize: "8pt", color: "#000000", marginTop: "1px" }}>
                  Email: dpmptsp@luwukab.go.id • Website: https://dpmptsp.luwukab.go.id
                </div>
              </div>

              <div style={{ width: "22mm", flexShrink: 0, marginLeft: "10px" }} />
            </div>
            <div style={{ borderBottom: "1px solid #000000", marginBottom: "12px" }} />

            {/* B. JUDUL SURAT KEPUTUSAN */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "11.5pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2 }}>
                KEPUTUSAN KEPALA DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU
                <br />
                KABUPATEN LUWU
              </div>
              <div style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "3px" }}>
                NOMOR: {data.nomorSkPkkpr}
              </div>
              <div style={{ fontSize: "10.5pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "4px", lineHeight: 1.2 }}>
                TENTANG
                <br />
                PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR)
                <br />
                UNUK KEGIATAN {data.jenisPermohonan === "Non-Berusaha" ? "NON-BERUSAHA" : "BERUSAHA"} ATAS NAMA {data.namaPerusahaan.toUpperCase()}
              </div>
            </div>

            {/* C. MUKADIMAH & KONSIDERAN */}
            <div style={{ fontSize: "10pt", lineHeight: 1.35, marginBottom: "8px" }}>
              <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "6px" }}>
                KEPALA DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU KABUPATEN LUWU,
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "15px" }} />
                  <col style={{ width: "auto" }} />
                </colgroup>
                <tbody>
                  {/* MENIMBANG */}
                  <tr style={{ verticalAlign: "top" }}>
                    <td style={{ fontWeight: "bold" }}>Menimbang</td>
                    <td style={{ fontWeight: "bold" }}>:</td>
                    <td>
                      <ol style={{ paddingLeft: "16px", margin: 0, listStyleType: "lower-alpha" }}>
                        <li style={{ marginBottom: "3px", textAlign: "justify" }}>
                          bahwa berdasarkan hasil verifikasi administrasi dan kajian teknis tata ruang atas permohonan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) yang diajukan oleh <b>{data.namaPerusahaan}</b>, telah memenuhi kriteria kesesuaian lokasi dan tata ruang;
                        </li>
                        <li style={{ marginBottom: "3px", textAlign: "justify" }}>
                          bahwa berdasarkan Berita Acara Pemeriksaan Kesesuaian Tata Ruang (BAP-KTR) Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Luwu Nomor: <b>{data.nomorBapPuptr}</b> tanggal <b>{data.tanggalBapPuptr}</b>;
                        </li>
                        {data.nomorBapPertanian && (
                          <li style={{ marginBottom: "3px", textAlign: "justify" }}>
                            bahwa berdasarkan Berita Acara Pertimbangan Teknis Lahan Pertanian Dinas Pertanian Kabupaten Luwu Nomor: <b>{data.nomorBapPertanian}</b> tanggal <b>{data.tanggalBapPertanian || '-'}</b>;
                          </li>
                        )}
                        <li style={{ marginBottom: "3px", textAlign: "justify" }}>
                          bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a, b, dan c, perlu menetapkan Keputusan Kepala Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu Kabupaten Luwu tentang Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR).
                        </li>
                      </ol>
                    </td>
                  </tr>

                  {/* MENGINGAT */}
                  <tr style={{ verticalAlign: "top" }}>
                    <td style={{ fontWeight: "bold", paddingTop: "4px" }}>Mengingat</td>
                    <td style={{ fontWeight: "bold", paddingTop: "4px" }}>:</td>
                    <td style={{ paddingTop: "4px" }}>
                      <ol style={{ paddingLeft: "16px", margin: 0, listStyleType: "decimal" }}>
                        <li style={{ marginBottom: "2px", textAlign: "justify" }}>
                          Undang-Undang Nomor 6 Tahun 2023 tentang Penetapan Peraturan Pemerintah Pengganti Undang-Undang Nomor 2 Tahun 2022 tentang Cipta Kerja Menjadi Undang-Undang;
                        </li>
                        <li style={{ marginBottom: "2px", textAlign: "justify" }}>
                          Peraturan Pemerintah Nomor 5 Tahun 2021 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko;
                        </li>
                        <li style={{ marginBottom: "2px", textAlign: "justify" }}>
                          Peraturan Pemerintah Nomor 21 Tahun 2021 tentang Penyelenggaraan Penataan Ruang;
                        </li>
                        <li style={{ marginBottom: "2px", textAlign: "justify" }}>
                          Peraturan Menteri ATR/BPN Nomor 13 Tahun 2021 tentang Pelaksanaan Kesesuaian Kegiatan Pemanfaatan Ruang dan Sinkronisasi Program Pemanfaatan Ruang;
                        </li>
                        <li style={{ marginBottom: "2px", textAlign: "justify" }}>
                          Peraturan Daerah Kabupaten Luwu Nomor 3 Tahun 2024 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu Tahun 2024-2044.
                        </li>
                      </ol>
                    </td>
                  </tr>

                  {/* MEMPERHATIKAN */}
                  <tr style={{ verticalAlign: "top" }}>
                    <td style={{ fontWeight: "bold", paddingTop: "4px" }}>Memperhatikan</td>
                    <td style={{ fontWeight: "bold", paddingTop: "4px" }}>:</td>
                    <td style={{ paddingTop: "4px", textAlign: "justify" }}>
                      Hasil Rekomendasi Teknis Forum Penataan Ruang Daerah Kabupaten Luwu dan Hasil Audit Integrasi Pelayanan Perizinan Terpadu Kabupaten Luwu.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* D. DIKTUM MEMUTUSKAN */}
            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "11pt", marginTop: "10px", marginBottom: "6px" }}>
              MEMUTUSKAN:
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt", lineHeight: 1.35 }}>
              <colgroup>
                <col style={{ width: "95px" }} />
                <col style={{ width: "15px" }} />
                <col style={{ width: "auto" }} />
              </colgroup>
              <tbody>
                {/* MENETAPKAN */}
                <tr style={{ verticalAlign: "top" }}>
                  <td style={{ fontWeight: "bold" }}>MENETAPKAN</td>
                  <td style={{ fontWeight: "bold" }}>:</td>
                  <td style={{ fontWeight: "bold", textTransform: "uppercase" }}>
                    KEPUTUSAN KEPALA DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU KABUPATEN LUWU TENTANG PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR).
                  </td>
                </tr>

                {/* KESATU */}
                <tr style={{ verticalAlign: "top" }}>
                  <td style={{ fontWeight: "bold", paddingTop: "6px" }}>KESATU</td>
                  <td style={{ fontWeight: "bold", paddingTop: "6px" }}>:</td>
                  <td style={{ paddingTop: "6px" }}>
                    <div style={{ textAlign: "justify", marginBottom: "4px" }}>
                      Memberikan <b>Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)</b> untuk kegiatan {data.jenisPermohonan} kepada:
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000000", fontSize: "9pt", marginBottom: "6px" }}>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                          <td style={{ width: "170px", padding: "3px 6px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>Nama Pemohon / Penanggung Jawab</td>
                          <td style={{ padding: "3px 6px" }}>: {data.namaPemohon}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                          <td style={{ padding: "3px 6px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>NIB / NIK Pemohon</td>
                          <td style={{ padding: "3px 6px" }}>: {data.nibOss} {data.nikPemohon ? `(NIK: ${data.nikPemohon})` : ''}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                          <td style={{ padding: "3px 6px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>Nama Perusahaan / Perorangan</td>
                          <td style={{ padding: "3px 6px" }}>: <b>{data.namaPerusahaan}</b></td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                          <td style={{ padding: "3px 6px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>Sektor & Skala Usaha</td>
                          <td style={{ padding: "3px 6px" }}>: {data.sektorUsaha} {data.skalaUsaha ? `[${data.skalaUsaha}]` : ''} (KBLI: {data.kbliCode})</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                          <td style={{ padding: "3px 6px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>Lokasi Kegiatan / Investasi</td>
                          <td style={{ padding: "3px 6px" }}>: {data.lokasiKegiatan}, Desa/Kel. {data.desaKelurahan}, Kec. {data.kecamatan}, Kab. Luwu</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                          <td style={{ padding: "3px 6px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>Luas Lahan Disetujui</td>
                          <td style={{ padding: "3px 6px" }}>: <b>{data.luasLahanDisetujui}</b> (Permohonan Awal: {data.luasLahanPermohonan})</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                          <td style={{ padding: "3px 6px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>Status Kepemilikan Lahan</td>
                          <td style={{ padding: "3px 6px" }}>: {data.statusKepemilikanTanah || 'Sertipikat / Bukti Kepemilikan Hak Atas Tanah Sah'}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                          <td style={{ padding: "3px 6px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>Rencana Pola Ruang RTRW</td>
                          <td style={{ padding: "3px 6px" }}>: <b>{data.zonaRtrw}</b></td>
                        </tr>
                        {data.dokumenLingkungan && (
                          <tr>
                            <td style={{ padding: "3px 6px", fontWeight: "bold", backgroundColor: "#f9fafb" }}>Kewajiban Dokumen Lingkungan</td>
                            <td style={{ padding: "3px 6px" }}>: <b>{data.dokumenLingkungan}</b></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* KEDUA */}
                <tr style={{ verticalAlign: "top" }}>
                  <td style={{ fontWeight: "bold", paddingTop: "4px" }}>KEDUA</td>
                  <td style={{ fontWeight: "bold", paddingTop: "4px" }}>:</td>
                  <td style={{ paddingTop: "4px" }}>
                    <div style={{ textAlign: "justify", marginBottom: "4px" }}>
                      Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang sebagaimana dimaksud pada Diktum KESATU diterbitkan dengan ketentuan persyaratan teknis bangunan gedung dan tata ruang sebagai berikut:
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000000", fontSize: "8.5pt", textAlign: "center" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid #000000" }}>
                          <th style={{ borderRight: "1px solid #000000", padding: "3px" }}>Koefisien Dasar (KDB)</th>
                          <th style={{ borderRight: "1px solid #000000", padding: "3px" }}>Koefisien Lantai (KLB)</th>
                          <th style={{ borderRight: "1px solid #000000", padding: "3px" }}>Koefisien Hijau (KDH)</th>
                          <th style={{ borderRight: "1px solid #000000", padding: "3px" }}>Garis Sempadan (GSB)</th>
                          <th style={{ padding: "3px" }}>Ketinggian Bangunan</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ borderRight: "1px solid #000000", padding: "4px", fontWeight: "bold" }}>Maks {data.koefisienDasarBangunan}</td>
                          <td style={{ borderRight: "1px solid #000000", padding: "4px", fontWeight: "bold" }}>Maks {data.koefisienLantaiBangunan}</td>
                          <td style={{ borderRight: "1px solid #000000", padding: "4px", fontWeight: "bold" }}>Min {data.koefisienDaerahHijau}</td>
                          <td style={{ borderRight: "1px solid #000000", padding: "4px", fontWeight: "bold" }}>{data.garisSempadanBangunan}</td>
                          <td style={{ padding: "4px", fontWeight: "bold" }}>{data.ketinggianMaksimalBangunan || 'Maksimal 2 Lantai (≤ 9m)'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* KETIGA */}
                <tr style={{ verticalAlign: "top" }}>
                  <td style={{ fontWeight: "bold", paddingTop: "6px" }}>KETIGA</td>
                  <td style={{ fontWeight: "bold", paddingTop: "6px" }}>:</td>
                  <td style={{ paddingTop: "6px", textAlign: "justify" }}>
                    Pemegang Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang berkewajiban:
                    <ol style={{ paddingLeft: "16px", margin: 0, listStyleType: "decimal" }}>
                      <li style={{ marginBottom: "2px" }}>Mematuhi seluruh ketentuan tata ruang dan intensitas pemanfaatan ruang sesuai perundang-undangan;</li>
                      <li style={{ marginBottom: "2px" }}>Mengurus dokumen perizinan lanjutan mencakup Dokumen Lingkungan (AMDAL/UKL-UPL/SPPL) dan Persetujuan Bangunan Gedung (PBG);</li>
                      <li style={{ marginBottom: "2px" }}>Tidak mengubah fungsi ruang dan tidak memindahtangankan SK PKKPR ini tanpa izin tertulis dari Pemkab Luwu.</li>
                    </ol>
                  </td>
                </tr>

                {/* KEEMPAT */}
                <tr style={{ verticalAlign: "top" }}>
                  <td style={{ fontWeight: "bold", paddingTop: "4px" }}>KEEMPAT</td>
                  <td style={{ fontWeight: "bold", paddingTop: "4px" }}>:</td>
                  <td style={{ paddingTop: "4px", textAlign: "justify" }}>
                    Keputusan ini berlaku selama <b>{data.masaBerlakuTahun} ({data.masaBerlakuTahun === 3 ? 'tiga' : data.masaBerlakuTahun}) tahun</b> terhitung sejak tanggal ditetapkan. Apabila dalam jangka waktu tersebut kegiatan pemanfaatan ruang belum dilaksanakan, maka dokumen ini dinyatakan gugur demi hukum.
                  </td>
                </tr>

                {/* KELIMA */}
                <tr style={{ verticalAlign: "top" }}>
                  <td style={{ fontWeight: "bold", paddingTop: "4px" }}>KELIMA</td>
                  <td style={{ fontWeight: "bold", paddingTop: "4px" }}>:</td>
                  <td style={{ paddingTop: "4px", textAlign: "justify" }}>
                    Keputusan ini mulai berlaku pada tanggal ditetapkan.
                  </td>
                </tr>
              </tbody>
            </table>

            {/* E. BLOK TANDA TANGAN KEPALA DPMPTSP (TTE DIGITAL & BSRE) */}
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "260px", fontSize: "9.5pt", textAlign: "left" }}>
                <div>Ditetapkan di : {data.tempatDitetapkan || 'Belopa'}</div>
                <div>Pada tanggal : {data.tanggalDitetapkan}</div>
                <div style={{ borderBottom: "1px solid #000000", margin: "3px 0 6px 0" }} />
                
                <div style={{ fontWeight: "bold", textTransform: "uppercase", lineHeight: 1.2 }}>
                  KEPALA DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU KABUPATEN LUWU,
                </div>

                {/* Box TTE / QR Certification */}
                <div style={{ margin: "8px 0", padding: "6px", border: "1px dashed #059669", borderRadius: "6px", backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "50px", height: "50px", flexShrink: 0, border: "1px solid #059669", backgroundColor: "#ffffff", padding: "2px", borderRadius: "4px" }}>
                    <img
                      src={data.tteQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VALID_TTE_BSRE_DPMPTSP_LUWU_${data.nomorSkPkkpr.replace(/[^a-zA-Z0-9]/g, '_')}`}
                      alt="TTE QR Code BSRE"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: "7.5pt", fontWeight: "bold", color: "#047857" }}>
                      Tersertifikasi Elektronik BSRE BSSN
                    </div>
                    <div style={{ fontSize: "7pt", color: "#065f46", lineHeight: 1.1 }}>
                      Dokumen ini telah ditandatangani secara digital oleh Kepala DPMPTSP Kab. Luwu.
                    </div>
                  </div>
                </div>

                <div style={{ fontWeight: "bold", textDecoration: "underline", fontSize: "10pt" }}>
                  {data.kadisNama}
                </div>
                <div>{data.kadisPangkatGolongan}</div>
                <div>NIP. {data.kadisNip}</div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            HALAMAN 2: LAMPIRAN I (PETA SPASIAL) & LAMPIRAN II (TABEL KOORDINAT)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "page2") && (
          <div
            className="sk-pkkpr-print-page bg-[#ffffff] text-[#000000] relative box-border shadow-xl print:shadow-none print:border-none"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingLeft: "20mm",
              paddingTop: "15mm",
              paddingRight: "20mm",
              paddingBottom: "18mm",
              boxSizing: "border-box",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: "10.5pt",
              lineHeight: 1.35,
              pageBreakAfter: "always",
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* Header Lampiran */}
            <div style={{ borderBottom: "2px solid #000000", paddingBottom: "4px", marginBottom: "10px", fontSize: "9pt" }}>
              <div style={{ fontWeight: "bold" }}>LAMPIRAN I KEPUTUSAN KEPALA DPMPTSP KABUPATEN LUWU</div>
              <div>NOMOR : {data.nomorSkPkkpr}</div>
              <div>TANGGAL : {data.tanggalDitetapkan}</div>
              <div>TENTANG : PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG ({data.namaPerusahaan.toUpperCase()})</div>
            </div>

            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "11pt", textTransform: "uppercase", marginBottom: "10px" }}>
              PETA PLOTTING LOKASI KESESUAIAN TATA RUANG (PKKPR)
            </div>

            {/* Container Peta */}
            <div style={{ width: "100%", height: "135mm", border: "2px solid #000000", borderRadius: "4px", overflow: "hidden", position: "relative", marginBottom: "12px", backgroundColor: "#f8fafc" }}>
              <img
                src={getEffectiveMapImageUrl(data.petaImageUrl, null, {
                  desa: data.desaKelurahan,
                  kecamatan: data.kecamatan,
                  pemohon: data.namaPemohon,
                  perusahaan: data.namaPerusahaan,
                  luas: data.luasLahanDisetujui,
                  tipeDoc: 'PKKPR'
                })}
                alt="Peta Spasial PKKPR"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>

            {/* Tabel Koordinat Titik Batas Lahan */}
            <div style={{ fontWeight: "bold", fontSize: "10pt", marginBottom: "4px" }}>
              TABEL KOORDINAT GEOGRAFIS BATAS LAHAN:
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000000", fontSize: "8.5pt", textAlign: "center" }}>
              <thead>
                <tr style={{ backgroundColor: "#e5e7eb", borderBottom: "1px solid #000000", fontWeight: "bold" }}>
                  <th style={{ borderRight: "1px solid #000000", padding: "3px", width: "35px" }}>No</th>
                  <th style={{ borderRight: "1px solid #000000", padding: "3px", width: "80px" }}>Titik Batas</th>
                  <th style={{ borderRight: "1px solid #000000", padding: "3px" }}>Garut Lintang (Latitude / LS)</th>
                  <th style={{ borderRight: "1px solid #000000", padding: "3px" }}>Garis Bujur (Longitude / BT)</th>
                  <th style={{ padding: "3px" }}>Keterangan Batas</th>
                </tr>
              </thead>
              <tbody>
                {data.koordinatPoligon && data.koordinatPoligon.length > 0 ? (
                  data.koordinatPoligon.map((pt, idx) => (
                    <tr key={pt.id || idx} style={{ borderBottom: "1px solid #d1d5db" }}>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px" }}>{idx + 1}</td>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px", fontWeight: "bold" }}>{pt.pointName || `P-${idx + 1}`}</td>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px", fontFamily: "monospace" }}>{pt.latitudeDms || `${pt.latitudeDd}° LS`}</td>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px", fontFamily: "monospace" }}>{pt.longitudeDms || `${pt.longitudeDd}° BT`}</td>
                      <td style={{ padding: "3px" }}>Pilar Batas Lahan PKKPR</td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px" }}>1</td>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px", fontWeight: "bold" }}>P-1</td>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px", fontFamily: "monospace" }}>3° 21' 14.20" LS</td>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px", fontFamily: "monospace" }}>120° 20' 45.10" BT</td>
                      <td style={{ padding: "3px" }}>Pilar Utama Utara</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px" }}>2</td>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px", fontWeight: "bold" }}>P-2</td>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px", fontFamily: "monospace" }}>3° 21' 18.50" LS</td>
                      <td style={{ borderRight: "1px solid #000000", padding: "3px", fontFamily: "monospace" }}>120° 20' 49.30" BT</td>
                      <td style={{ padding: "3px" }}>Pilar Timur</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* Pengesahan Halaman 2 */}
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "260px", fontSize: "9pt", textAlign: "center" }}>
                <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>
                  KEPALA DINAS PENANAMAN MODAL DAN PTSP KABUPATEN LUWU
                </div>
                <div style={{ height: "45px" }} />
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
                  {data.kadisNama}
                </div>
                <div>NIP. {data.kadisNip}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
