import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import { safeHtml2Canvas } from "../../lib/html2canvasShim";
import { OFFICIAL_LUWU_LOGO_URL } from "../LuwuLogo";
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText,
  Building,
  Landmark,
  Compass,
  MapPin
} from "lucide-react";

export interface BapAtrBpnDocumentData {
  id?: string;
  nomorPertekBpn: string;
  tanggalDokumen: string;
  hariTanggalPemeriksaan: string;

  // Data Pemohon & Badan Usaha
  nibNik: string;
  namaPemohon: string;
  namaPerusahaan: string;
  alamatPemohon: string;
  jenisPengajuanPkkpr: string;
  kategoriPengajuan?: 'BANGUNAN' | 'PARSIL_TANAH';

  // Legalitas & Parsil Pertanahan
  jenisAlasHak: string;
  nomorAlasHak: string;
  fileAlasHakUrl?: string;
  fileSiteplanUrl?: string;
  
  // Lokasi & Luas
  lokasiKegiatan: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupaten: string;
  luasMohonM2: number;
  luasMohonHa: number;
  luasDisetujuiM2: number;
  luasDisetujuiHa: number;

  // Aspek P4T (Penguasaan, Pemilikan, Penggunaan, Pemanfaatan Tanah)
  statusPenguasaan: string;
  statusPemilikan: string;
  statusPenggunaanExisting: string;
  statusRencanaPemanfaatan: string;
  statusClearAndClean: boolean;
  sengketaStatus: string;

  // Keputusan & Catatan Rekomendasi
  statusKeputusan: "APPROVED" | "REJECTED";
  catatanPertekBpn: string[];

  // Pejabat ATR/BPN
  kasiNama: string;
  kasiNip: string;
  kasiJabatan: string;
  kakantahNama: string;
  kakantahNip: string;
  kakantahJabatan: string;
  pangkatKakantah: string;

  // Spasial
  koordinatPoligon?: Array<{ id: number; pointName: string; latitudeDd: number; longitudeDd: number }>;
}

export interface BapAtrBpnDocumentProps {
  data: BapAtrBpnDocumentData;
  onEditRequested?: () => void;
  showControlBar?: boolean;
}

export const BapAtrBpnDocument: React.FC<BapAtrBpnDocumentProps> = ({
  data,
  showControlBar = true
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!docRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await safeHtml2Canvas(docRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`BAP-PERTEK-ATR-BPN-${data.nomorPertekBpn.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`);
    } catch (err) {
      console.error("Failed to export BAP ATR/BPN PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {/* Control Bar */}
      {showControlBar && (
        <div className="p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold font-mono">
              BAP Pertimbangan Teknis Pertanahan Kantah ATR/BPN Kab. Luwu
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> {isExporting ? "Mengunduh PDF..." : "Unduh PDF (BPN)"}
            </button>
          </div>
        </div>
      )}

      {/* Document View Sheet (A4 Format Printable) */}
      <div className="overflow-x-auto pb-4">
        <div
          ref={docRef}
          className="w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 p-[15mm] shadow-2xl border border-slate-200 text-[10pt] leading-tight font-serif relative space-y-4"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* Header Kop ATR/BPN */}
          <div className="border-b-4 border-double border-slate-900 pb-3 mb-4 text-center relative">
            <div className="flex items-center justify-center gap-4">
              <img
                src={OFFICIAL_LUWU_LOGO_URL}
                alt="Logo Garuda / ATR BPN"
                className="w-16 h-16 object-contain shrink-0"
              />
              <div>
                <h3 className="text-[11pt] font-bold uppercase tracking-wider">
                  KEMENTERIAN AGRARIA DAN TATA RUANG / BPN
                </h3>
                <h2 className="text-[13pt] font-black uppercase tracking-wide">
                  KANTAH PERTANAHAN KABUPATEN LUWU
                </h2>
                <p className="text-[9pt] italic font-sans text-slate-700">
                  Jl. Pemuda No. 12 Belopa, Kabupaten Luwu, Sulawesi Selatan 91994
                </p>
                <p className="text-[8.5pt] font-sans text-slate-600">
                  Website: kab-luwu.atrbpn.go.id • Email: kantah.luwu@atrbpn.go.id
                </p>
              </div>
            </div>
          </div>

          {/* Judul & Nomor Surat */}
          <div className="text-center space-y-1 mb-4">
            <h4 className="text-[12pt] font-black underline uppercase tracking-wide">
              BERITA ACARA PERTIMBANGAN TEKNIS PERTANAHAN (PERTEK BPN)
            </h4>
            <p className="text-[10pt] font-bold font-mono">
              Nomor: {data.nomorPertekBpn}
            </p>
          </div>

          {/* Pembukaan */}
          <p className="text-justify leading-relaxed">
            Pada hari ini, <span className="font-bold">{data.hariTanggalPemeriksaan}</span>, Tim Penilai Pertimbangan Teknis Pertanahan Kantor Pertanahan Kabupaten Luwu telah melaksanakan verifikasi dokumen legalitas, aspek Penguasaan, Pemilikan, Penggunaan, dan Pemanfaatan Tanah (P4T), serta pemeriksaan spasial persil lokasi permohonan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) dengan rincian sebagai berikut:
          </p>

          {/* Rincian Identitas Pemohon & Legalitas Lahan */}
          <div className="space-y-2">
            <h5 className="font-bold underline text-[10.5pt] uppercase">I. IDENTITAS PEMOHON &amp; LEGALITAS LAHAN</h5>
            <table className="w-full border-collapse text-[9.5pt]">
              <tbody>
                <tr>
                  <td className="w-48 py-1 font-bold">1. Nama Pemohon</td>
                  <td className="py-1">: {data.namaPemohon}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">2. NIK / NIB OSS</td>
                  <td className="py-1">: {data.nibNik}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">3. Badan Usaha / Perusahaan</td>
                  <td className="py-1">: {data.namaPerusahaan}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">4. Alamat Pemohon</td>
                  <td className="py-1">: {data.alamatPemohon}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">5. Jenis Pengajuan PKKPR</td>
                  <td className="py-1">: <b>{data.jenisPengajuanPkkpr}</b> ({data.kategoriPengajuan === 'PARSIL_TANAH' ? 'Parsil Tanah ATR-BPN' : 'Bangunan Fisik/Konstruksi'})</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">6. Bukti Hak Atas Tanah (Alas Hak)</td>
                  <td className="py-1">: <b>{data.jenisAlasHak}</b> (Nomor: {data.nomorAlasHak || '-'})</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">7. Lokasi Persil Lahan</td>
                  <td className="py-1">: Desa/Kel. {data.desaKelurahan}, Kec. {data.kecamatan}, Kab. Luwu</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">8. Luas Lahan Dimohon</td>
                  <td className="py-1">: <b>{data.luasMohonM2.toLocaleString('id-ID')} m²</b> ({data.luasMohonHa} Hektar)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Hasil Audit Aspek P4T */}
          <div className="space-y-2">
            <h5 className="font-bold underline text-[10.5pt] uppercase">II. HASIL EVALUASI ASPEK P4T (PERTANAHAN)</h5>
            <table className="w-full border border-slate-900 border-collapse text-[9pt]">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-slate-900 p-1.5 w-10">No</th>
                  <th className="border border-slate-900 p-1.5">Parameter Evaluasi Pertanahan (P4T)</th>
                  <th className="border border-slate-900 p-1.5">Hasil Pemeriksaan Kantor Pertanahan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-900 p-1.5 text-center">1</td>
                  <td className="border border-slate-900 p-1.5 font-bold">Status Penguasaan Tanah</td>
                  <td className="border border-slate-900 p-1.5">{data.statusPenguasaan}</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-1.5 text-center">2</td>
                  <td className="border border-slate-900 p-1.5 font-bold">Status Pemilikan / Keabsahan Hak</td>
                  <td className="border border-slate-900 p-1.5">{data.statusPemilikan}</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-1.5 text-center">3</td>
                  <td className="border border-slate-900 p-1.5 font-bold">Penggunaan Tanah Eksisting (Fisik)</td>
                  <td className="border border-slate-900 p-1.5">{data.statusPenggunaanExisting}</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-1.5 text-center">4</td>
                  <td className="border border-slate-900 p-1.5 font-bold">Rencana Pemanfaatan Ruang</td>
                  <td className="border border-slate-900 p-1.5">{data.statusRencanaPemanfaatan}</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-1.5 text-center">5</td>
                  <td className="border border-slate-900 p-1.5 font-bold">Status Sengketa &amp; Overlap Spasial</td>
                  <td className="border border-slate-900 p-1.5 font-bold text-emerald-800">{data.sengketaStatus}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kesimpulan & Rekomendasi */}
          <div className="space-y-2">
            <h5 className="font-bold underline text-[10.5pt] uppercase">III. KESIMPULAN &amp; REKOMENDASI TEKNIS PERTANAHAN</h5>
            <div className="p-3 border border-slate-900 bg-slate-50 space-y-1.5 text-[9.5pt]">
              <p className="font-bold">
                KEPUTUSAN KANTAH ATR/BPN:{" "}
                <span className={data.statusKeputusan === 'APPROVED' ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                  {data.statusKeputusan === 'APPROVED' ? 'DISETUJUI (RECOMMENDED CLEAR P4T)' : 'DITOLAK (UNAVAILABLE/CONFLICT)'}
                </span>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[9pt]">
                {data.catatanPertekBpn.map((catatan, i) => (
                  <li key={i}>{catatan}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tanda Tangan Dual Signature ATR/BPN */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-[9.5pt] text-center">
            <div>
              <p>Mengetahui / Memeriksa,</p>
              <p className="font-bold">{data.kasiJabatan}</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[8pt] text-slate-400 font-mono">[TTE Digital BPN Certified]</span>
              </div>
              <p className="font-bold underline uppercase">{data.kasiNama}</p>
              <p className="font-mono text-[8.5pt]">NIP. {data.kasiNip}</p>
            </div>

            <div>
              <p>Belopa, {data.tanggalDokumen}</p>
              <p className="font-bold">{data.kakantahJabatan}</p>
              <div className="h-16 flex items-center justify-center">
                <ShieldCheck className="w-10 h-16 text-blue-700 opacity-80" />
              </div>
              <p className="font-bold underline uppercase">{data.kakantahNama}</p>
              <p className="font-mono text-[8.5pt]">NIP. {data.kakantahNip}</p>
              <p className="text-[8.5pt] italic">{data.pangkatKakantah}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BapAtrBpnDocument;
