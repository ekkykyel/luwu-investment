import jsPDF from 'jspdf';
import { safeHtml2Canvas } from '../lib/html2canvasShim';
import { OFFICIAL_LUWU_LOGO_URL } from '../components/LuwuLogo';
import { formatRupiah } from '../lib/formatters';

export interface SkPkkprPdfData {
  applicationId: string;
  applicantName: string;
  companyName: string;
  nibNik: string;
  sector: string;
  districtName: string;
  villageName: string;
  areaHa: number;
  investmentValue: number;
  skPkkprDocNumber: string;
  pertanianBaNumber?: string;
  pertanianSrNumber?: string;
  puptrPertekNumber?: string;
  issueDate?: string;
}

/**
 * Utility to generate and download official SK Izin PKKPR DPMPTSP Kabupaten Luwu in high-resolution A4 PDF.
 */
export async function generateSkPkkprPdf(data: SkPkkprPdfData): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Georgia, serif';
  container.style.padding = '40px 50px';
  container.style.boxSizing = 'border-box';

  const dateStr = data.issueDate || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const skDocNum = data.skPkkprDocNumber || `SK.PKKPR/DPMPTSP-LUWU/2026/${data.applicationId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const pertBaNum = data.pertanianBaNumber || `BAP-PERTANIAN/LUWU/2026/${data.applicationId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const puptrPertekNum = data.puptrPertekNumber || `PERTEK.PKKPR/PUPTR-LUWU/2026/${data.applicationId.replace(/[^a-zA-Z0-9]/g, '')}`;

  container.innerHTML = `
    <div style="width: 100%; font-family: 'Times New Roman', Times, serif; color: #000000; line-height: 1.4;">
      <!-- KOP SURAT OFFICIAL DPMPTSP LUWU -->
      <div style="display: flex; align-items: center; border-bottom: 3px double #000000; padding-bottom: 12px; margin-bottom: 20px;">
        <div style="width: 90px; text-align: center; shrink: 0;">
          <img src="${OFFICIAL_LUWU_LOGO_URL}" style="width: 75px; height: 90px; object-fit: contain;" />
        </div>
        <div style="flex: 1; text-align: center; padding-left: 10px; padding-right: 20px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">PEMERINTAH KABUPATEN LUWU</h3>
          <h2 style="margin: 2px 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">DINAS PENANAMAN MODAL DAN PTSP</h2>
          <p style="margin: 0; font-size: 11px; font-style: italic;">Jl. Jendral Sudirman No. 1 Kompleks Perkantoran Pemkab Luwu, Belopa</p>
          <p style="margin: 0; font-size: 10px;">Website: dpmptsp.luwukab.go.id | Email: dpmptsp@luwukab.go.id | Kode Pos: 91994</p>
        </div>
      </div>

      <!-- HEADER JUDUL SK -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h3 style="margin: 0; font-size: 15px; font-weight: bold; text-decoration: underline; text-transform: uppercase;">SURAT KEPUTUSAN KEPALA DINAS PENANAMAN MODAL DAN PTSP KABUPATEN LUWU</h3>
        <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: bold; font-family: monospace;">NOMOR: ${skDocNum}</p>
        <p style="margin: 12px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">TENTANG</p>
        <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR)</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold; color: #15803d; text-transform: uppercase;">UNTUK KEGIATAN INVESTMENT SEKTOR ${data.sector.toUpperCase()}</p>
      </div>

      <!-- MENIMBANG & MENGINGAT -->
      <div style="font-size: 11px; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 100px; vertical-align: top; font-weight: bold;">Menimbang</td>
            <td style="width: 15px; vertical-align: top;">:</td>
            <td style="vertical-align: top; text-align: justify;">
              Bahwa berdasarkan hasil penelitian administrasi dan pertimbangan teknis spasial lintas OPD, permohonan yang diajukan telah memenuhi syarat kesesuaian tata ruang RTRW dan perlindungan lahan pertanian (LP2B) Kabupaten Luwu.
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; font-weight: bold; padding-top: 6px;">Mengingat</td>
            <td style="vertical-align: top; padding-top: 6px;">:</td>
            <td style="vertical-align: top; padding-top: 6px; text-align: justify;">
              1. Undang-Undang Nomor 6 Tahun 2023 tentang Penetapan Perpu Cipta Kerja.<br/>
              2. Peraturan Daerah Kabupaten Luwu tentang Rencana Tata Ruang Wilayah (RTRW).<br/>
              3. Berita Acara Rekomendasi Teknis LP2B Dinas Pertanian Luwu Nomor: <b>${pertBaNum}</b>.<br/>
              4. Pertimbangan Teknis Kesesuaian Lahan Dinas PUPTR Luwu Nomor: <b>${puptrPertekNum}</b>.
            </td>
          </tr>
        </table>
      </div>

      <!-- MEMUTUSKAN -->
      <div style="text-align: center; font-weight: bold; font-size: 12px; margin: 16px 0 10px 0; letter-spacing: 1px;">MEMUTUSKAN:</div>

      <div style="font-size: 11px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0; font-weight: bold;">MENETAPKAN PERSETUJUAN KESESUAIAN KEGIATAN PEMANFAATAN RUANG (PKKPR) KEPADA:</p>
        <table style="width: 100%; border-collapse: collapse; margin-left: 10px; margin-bottom: 14px;">
          <tr>
            <td style="width: 200px; padding: 3px 0;">1. Nama Pemohon / Penanggung Jawab</td>
            <td style="width: 15px;">:</td>
            <td style="font-weight: bold;">${data.applicantName}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">2. Nama Perusahaan / Perorangan</td>
            <td>:</td>
            <td style="font-weight: bold;">${data.companyName}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">3. NIB / NIK Pemohon</td>
            <td>:</td>
            <td style="font-family: monospace; font-weight: bold;">${data.nibNik}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">4. Sektor Usaha / Rencana Kegiatan</td>
            <td>:</td>
            <td>${data.sector}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">5. Lokasi Pemanfaatan Ruang</td>
            <td>:</td>
            <td style="font-weight: bold;">Desa ${data.villageName}, Kecamatan ${data.districtName}, Kabupaten Luwu</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">6. Luas Lahan Disetujui</td>
            <td>:</td>
            <td style="font-weight: bold; color: #047857;">${data.areaHa} Hektar (Ha)</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">7. Rencana Nilai Investasi</td>
            <td>:</td>
            <td style="font-weight: bold;">${formatRupiah(data.investmentValue)}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">8. Status Evaluasi LP2B & Spatial</td>
            <td>:</td>
            <td style="color: #047857; font-weight: bold;">TERVERIFIKASI AMAN & DISETUJUI LINTAS OPD</td>
          </tr>
        </table>

        <!-- KETENTUAN HUKUM -->
        <div style="border: 1px solid #000000; padding: 10px 14px; background-color: #f8fafc; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase;">DOKUMEN INTEGRASI PERIZINAN BERUSAHA (OSS-RBA LUWU):</p>
          <p style="margin: 4px 0 0 0; font-size: 10px; text-align: justify;">
            Surat Keputusan PKKPR ini berlaku sebagai dokumen persetujuan tata ruang resmi Pemerintah Kabupaten Luwu dan dapat dipergunakan untuk pengurusan perizinan berusaha lanjutan (PBG, SLF, AMDAL/UKL-UPL, dan Hak Atas Tanah).
          </p>
        </div>
      </div>

      <!-- TANDA TANGAN & LEGALITAS DPMPTSP -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; font-size: 11px;">
        <div style="width: 220px; text-align: center; border: 1px dashed #64748b; padding: 8px; border-radius: 6px; background-color: #f8fafc;">
          <div style="font-size: 9px; font-weight: bold; color: #475569; margin-bottom: 4px;">VERIFIKASI DIGITAL DPMPTSP</div>
          <div style="width: 70px; height: 70px; margin: 0 auto; background-color: #ffffff; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 8px; font-weight: bold; text-align: center; padding: 4px;">
            QR CODE<br/>SK PKKPR<br/>DPMPTSP
          </div>
          <div style="font-size: 8px; color: #64748b; margin-top: 4px;">Validasi Resmi Pemkab Luwu</div>
        </div>

        <div style="text-align: right; width: 320px;">
          <p style="margin: 0; font-size: 11px;">Ditetapkan di : <b>Belopa</b></p>
          <p style="margin: 2px 0 16px 0; font-size: 11px;">Pada tanggal : <b>${dateStr}</b></p>
          <p style="margin: 0; font-size: 11px; font-weight: bold; text-transform: uppercase;">KEPALA DINAS PENANAMAN MODAL DAN PTSP</p>
          <p style="margin: 0; font-size: 11px; font-weight: bold; text-transform: uppercase;">KABUPATEN LUWU</p>
          
          <div style="margin: 15px 0 10px 0; text-align: right;">
            <div style="display: inline-block; border: 2px solid #047857; padding: 4px 12px; border-radius: 4px; color: #047857; font-weight: bold; font-size: 10px; transform: rotate(-2deg);">
              TERBIT RESMI DPMPTSP
            </div>
          </div>

          <p style="margin: 0; font-size: 12px; font-weight: bold; text-decoration: underline;">H. MUHAMMAD RUDI, S.Sos., M.Si.</p>
          <p style="margin: 0; font-size: 10px;">Pembina Utama Muda (IV/c)</p>
          <p style="margin: 0; font-size: 10px;">NIP. 19740815 199803 1 004</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await safeHtml2Canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const contentHeightMm = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(contentHeightMm, pdfHeight));

    const cleanFileName = `SK-IZIN-PKKPR-DPMPTSP-LUWU-${data.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    pdf.save(cleanFileName);
  } finally {
    document.body.removeChild(container);
  }
}
