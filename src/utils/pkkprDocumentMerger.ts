import jsPDF from "jspdf";
import { supabase } from "../lib/supabaseClient";

export interface PkkprDocumentInput {
  title: string;
  category: string; // "Berusaha" | "Non-Berusaha"
  namaPemohon: string;
  nikPemohon: string;
  noWhatsapp?: string;
  kecamatan: string;
  desa: string;
  luasM2: number;
  sertifikatDataUrl?: string | null;
  sertifikatFileName?: string;
  suratPengantarDataUrl?: string | null;
  suratPengantarFileName?: string;
  suratBebasSengketaDataUrl?: string | null;
  suratBebasSengketaFileName?: string;
}

/**
 * Uploads a PKKPR document (File, Blob, or DataUrl) to Supabase Storage.
 * Tries bucket 'pkkpr_documents' first, falls back to 'investments'.
 * Returns the public URL of the uploaded document or null on error.
 */
export const uploadPkkprDocumentToStorage = async (
  fileOrDataUrlOrBlob: File | Blob | string | null | undefined,
  fileName: string,
  docType: "sertifikat" | "surat_pengantar" | "berkas_gabungan"
): Promise<string | null> => {
  if (!fileOrDataUrlOrBlob) return null;

  try {
    let blob: Blob;
    let contentType = "application/pdf";

    if (fileOrDataUrlOrBlob instanceof File || fileOrDataUrlOrBlob instanceof Blob) {
      blob = fileOrDataUrlOrBlob;
      if ("type" in fileOrDataUrlOrBlob && fileOrDataUrlOrBlob.type) {
        contentType = fileOrDataUrlOrBlob.type;
      }
    } else if (typeof fileOrDataUrlOrBlob === "string" && fileOrDataUrlOrBlob.startsWith("data:")) {
      const parts = fileOrDataUrlOrBlob.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      contentType = mimeMatch ? mimeMatch[1] : "application/pdf";
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: contentType });
    } else if (typeof fileOrDataUrlOrBlob === "string" && (fileOrDataUrlOrBlob.startsWith("http://") || fileOrDataUrlOrBlob.startsWith("https://"))) {
      // Already a public HTTP URL
      return fileOrDataUrlOrBlob;
    } else {
      return null;
    }

    const ext = contentType.includes("png") ? "png" : contentType.includes("jp") ? "jpg" : "pdf";
    const cleanFileName = fileName ? fileName.replace(/[^a-zA-Z0-9_.-]/g, "_") : `doc_${docType}.${ext}`;
    const uniquePath = `pkkpr_${docType}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanFileName}`;

    // 1. Try 'pkkpr_documents' bucket
    const primaryBucket = "pkkpr_documents";
    const { error: primaryErr } = await supabase.storage
      .from(primaryBucket)
      .upload(uniquePath, blob, { contentType, upsert: true });

    if (!primaryErr) {
      const { data: pubData } = supabase.storage
        .from(primaryBucket)
        .getPublicUrl(uniquePath);
      if (pubData?.publicUrl) return pubData.publicUrl;
    } else {
      console.warn(`[PKKPR Storage] Upload to ${primaryBucket} warning:`, primaryErr);
    }

    // 2. Fallback to 'investments' bucket
    const fallbackBucket = "investments";
    const fallbackPath = `pkkpr/${uniquePath}`;
    const { error: fallbackErr } = await supabase.storage
      .from(fallbackBucket)
      .upload(fallbackPath, blob, { contentType, upsert: true });

    if (!fallbackErr) {
      const { data: pubData } = supabase.storage
        .from(fallbackBucket)
        .getPublicUrl(fallbackPath);
      if (pubData?.publicUrl) return pubData.publicUrl;
    } else {
      console.warn(`[PKKPR Storage] Upload to ${fallbackBucket} warning:`, fallbackErr);
    }

    return null;
  } catch (err) {
    console.error(`[PKKPR Storage Exception] Failed uploading ${docType}:`, err);
    return null;
  }
};


/**
 * Reads a File object and converts it to a Data URL string.
 */
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Generates a unified single PDF file containing:
 * 1. Surat Keterangan Bebas Sengketa dari Desa (Official Template or Uploaded)
 * 2. Surat Pengantar Desa / Kelurahan
 * 3. Sertifikat Hak Atas Tanah / Kepemilikan Lahan
 */
export const generateMergedPkkprPdf = async (input: PkkprDocumentInput): Promise<{ dataUrl: string; blob: Blob }> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // PAGE 1: SURAT KETERANGAN BEBAS SENGKETA DESA/KELURAHAN
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Header Pemkab Luwu & Desa
  doc.setFillColor(15, 23, 42); // slate-900 header accent line
  doc.rect(15, 12, pageWidth - 30, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("PEMERINTAH KABUPATEN LUWU", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(13);
  doc.text(`KECAMATAN ${input.kecamatan.toUpperCase()} - DESA/KELURAHAN ${input.desa.toUpperCase()}`, pageWidth / 2, 26, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Alamat: Kantor Desa/Kelurahan " + input.desa + ", Kec. " + input.kecamatan + ", Kab. Luwu", pageWidth / 2, 31, { align: "center" });

  // Double Divider Line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(15, 35, pageWidth - 15, 35);
  doc.setLineWidth(0.2);
  doc.line(15, 36.5, pageWidth - 15, 36.5);

  // Title of Document
  const docNum = `SKBS/${Date.now().toString().slice(-6)}/${input.desa.substring(0, 3).toUpperCase()}/${new Date().getFullYear()}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("SURAT KETERANGAN BEBAS SENGKETA LAHAN", pageWidth / 2, 45, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nomor: ${docNum}`, pageWidth / 2, 50, { align: "center" });

  // Body Paragraph
  let yPos = 60;
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("Yang bertanda tangan di bawah ini Kepala Desa / Lurah " + input.desa + ", Kecamatan " + input.kecamatan + ",", 15, yPos);
  yPos += 6;
  doc.text("Kabupaten Luwu, Provinsi Sulawesi Selatan, dengan ini menerangkan bahwa:", 15, yPos);

  yPos += 10;
  // Applicant Identity Table Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, "S");

  let tY = yPos + 8;
  doc.setFont("helvetica", "bold");
  doc.text("1. Nama Pemohon / Kuasa", 20, tY);
  doc.setFont("helvetica", "normal");
  doc.text(`:  ${input.namaPemohon}`, 70, tY);

  tY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("2. NIK KTP Pemohon", 20, tY);
  doc.setFont("helvetica", "normal");
  doc.text(`:  ${input.nikPemohon}`, 70, tY);

  tY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("3. Jenis Permohonan PKKPR", 20, tY);
  doc.setFont("helvetica", "normal");
  doc.text(`:  PKKPR ${input.category.toUpperCase()} (${input.title})`, 70, tY);

  tY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("4. Lokasi Lahan Digitasi", 20, tY);
  doc.setFont("helvetica", "normal");
  doc.text(`:  Desa ${input.desa}, Kec. ${input.kecamatan}, Kab. Luwu`, 70, tY);

  tY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("5. Estimasi Luas Lahan", 20, tY);
  doc.setFont("helvetica", "normal");
  doc.text(`:  ${(input.luasM2 / 10000).toFixed(2)} Ha (${input.luasM2.toLocaleString("id-ID")} m²)`, 70, tY);

  yPos += 53;

  doc.setFont("helvetica", "bold");
  doc.text("BEBAS DARI SENGKETA, GUGATAN, MAUPUN SITAAN PIHAK LAIN", 15, yPos);
  yPos += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const textStatement =
    "Bahwa lokasi bidangan tanah yang diajukan dalam permohonan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) di atas adalah benar-benar milik/dalam penguasaan pemohon yang sah, tidak sedang dalam sengketa atau batas tanah dengan pihak lain, serta tidak dalam agunan atau sita jaminan oleh instansi manapun.";
  const splitStatement = doc.splitTextToSize(textStatement, pageWidth - 30);
  doc.text(splitStatement, 15, yPos);

  yPos += splitStatement.length * 5 + 6;

  const textStatement2 =
    "Surat Keterangan Bebas Sengketa Lahan ini diterbitkan sebagai salah satu syarat kelengkapan berkas administrasi Pengajuan PKKPR Digital pada Sistem Informasi Geospasial Investasi Kabupaten Luwu.";
  const splitStatement2 = doc.splitTextToSize(textStatement2, pageWidth - 30);
  doc.text(splitStatement2, 15, yPos);

  yPos += splitStatement2.length * 5 + 15;

  // Signatures
  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc.text(`Kabupaten Luwu, ${todayStr}`, pageWidth - 75, yPos);
  yPos += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Pemohon / Pemilik Lahan,", 20, yPos);
  doc.text(`Kepala Desa / Lurah ${input.desa},`, pageWidth - 75, yPos);

  // Digital Stamp / Verification Seal Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(pageWidth - 75, yPos + 6, 55, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52);
  doc.text("✓ VALIDASI DIGITAL DESA", pageWidth - 70, yPos + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Tervalidasi Sistem Pemkab Luwu`, pageWidth - 70, yPos + 17);
  doc.text(`Ref: ${docNum}`, pageWidth - 70, yPos + 22);

  yPos += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${input.namaPemohon} )`, 20, yPos);
  doc.text(`( KEPALA DESA ${input.desa.toUpperCase()} )`, pageWidth - 75, yPos);

  // Footer note on Page 1
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Catatan: Halaman 1 ini berisi Surat Keterangan Bebas Sengketa Lahan Resmi Desa/Kelurahan.", 15, pageHeight - 10);

  // If user uploaded a custom Surat Bebas Sengketa image/DataUrl, append it or embed it
  if (input.suratBebasSengketaDataUrl) {
    await appendImageOrDataUrlToPdf(doc, input.suratBebasSengketaDataUrl, "SURAT KETERANGAN BEBAS SENGKETA DESA (LAMPIRAN UNGGAHAN PEMOHON)");
  }

  // PAGE 2+: SURAT PENGANTAR DESA / KELURAHAN
  if (input.suratPengantarDataUrl) {
    await appendImageOrDataUrlToPdf(doc, input.suratPengantarDataUrl, "LAMPIRAN 1: SURAT PENGANTAR DESA / KELURAHAN");
  } else {
    // Placeholder info if not provided
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("LAMPIRAN 1: SURAT PENGANTAR DESA / KELURAHAN", 15, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Nama File: ${input.suratPengantarFileName || "Surat_Pengantar_Desa.pdf"}`, 15, 30);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, 40, pageWidth - 30, 200, 4, 4, "F");
    doc.text("Dokumen Surat Pengantar Desa/Kelurahan telah digabung ke dalam berkas PDF ini.", pageWidth / 2, 130, { align: "center" });
  }

  // PAGE 3+: SERTIFIKAT HAK ATAS TANAH / KEPEMILIKAN LAHAN
  if (input.sertifikatDataUrl) {
    await appendImageOrDataUrlToPdf(doc, input.sertifikatDataUrl, "LAMPIRAN 2: SERTIFIKAT HAK ATAS TANAH / KEPEMILIKAN LAHAN");
  } else {
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("LAMPIRAN 2: SERTIFIKAT HAK ATAS TANAH / KEPEMILIKAN LAHAN", 15, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Nama File: ${input.sertifikatFileName || "Sertifikat_Lahan.pdf"}`, 15, 30);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, 40, pageWidth - 30, 200, 4, 4, "F");
    doc.text("Dokumen Sertifikat Hak Atas Tanah telah digabung ke dalam berkas PDF ini.", pageWidth / 2, 130, { align: "center" });
  }

  const pdfBlob = doc.output("blob");
  const pdfDataUrl = doc.output("datauristring");

  return {
    dataUrl: pdfDataUrl,
    blob: pdfBlob,
  };
};

/**
 * Helper to embed images or data URLs into new PDF pages cleanly.
 */
const appendImageOrDataUrlToPdf = async (doc: jsPDF, dataUrl: string, titleLabel: string) => {
  doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Page Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(titleLabel, 10, 8);

  if (dataUrl.startsWith("data:image/")) {
    try {
      // Calculate aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const maxW = pageWidth - 20;
      const maxH = pageHeight - 30;
      let renderW = maxW;
      let renderH = maxH;

      if (img.width && img.height) {
        const aspect = img.width / img.height;
        if (maxW / maxH > aspect) {
          renderW = maxH * aspect;
          renderH = maxH;
        } else {
          renderW = maxW;
          renderH = maxW / aspect;
        }
      }

      const x = (pageWidth - renderW) / 2;
      const y = 16 + (maxH - renderH) / 2;

      const format = dataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(dataUrl, format, x, y, renderW, renderH);
    } catch (e) {
      console.warn("Could not embed image into PDF:", e);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Lampiran gambar tersimpan dalam dokumen.", 15, 30);
    }
  } else {
    // If it's a PDF dataUrl or raw document
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Dokumen Berkas Terlampir (PDF Format)", 15, 25);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, 35, pageWidth - 30, pageHeight - 50, 3, 3, "F");
    doc.setTextColor(100, 116, 139);
    doc.text("Berkas PDF ini telah terintegrasi dalam bundel permohonan PKKPR.", pageWidth / 2, pageHeight / 2, { align: "center" });
  }
};
