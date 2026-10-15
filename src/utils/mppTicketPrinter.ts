/**
 * Utility Cetak Tiket Antrean Mal Pelayanan Publik (MPP) Simpurusiang Kabupaten Luwu
 * Mendukung Thermal Printer (58mm & 80mm) serta Format PDF Standard A4/Letter.
 */

export interface MppTicketData {
  id?: string;
  ticket_code?: string;
  number?: string;
  queue_number?: string | number;
  agency?: string;
  agency_name?: string;
  instansi_name?: string;
  counter?: string;
  counter_name?: string;
  service?: string;
  service_name?: string;
  name?: string;
  nama_pemohon?: string;
  citizen_name?: string;
  nik?: string;
  date?: string;
  session?: string;
  is_priority?: boolean;
  priority_type?: string;
}

export function printMppQueueTicket(ticket: MppTicketData): void {
  if (typeof window === 'undefined') return;

  const rawCode = ticket.ticket_code || ticket.number || 'MPP-QUE';
  const displayNum = ticket.number || ticket.queue_number || rawCode.split('-').pop() || rawCode;
  const agencyName = ticket.agency || ticket.agency_name || ticket.instansi_name || 'DPMPTSP Kab. Luwu';
  const counterName = ticket.counter || ticket.counter_name || 'Loket Pelayanan';
  const serviceName = ticket.service || ticket.service_name || 'Layanan Publik Terpadu';
  const applicantName = ticket.name || ticket.nama_pemohon || ticket.citizen_name || 'Masyarakat Pemohon';
  const nik = ticket.nik || '-';
  const maskedNik = nik.length >= 16 ? `${nik.substring(0, 6)}******${nik.substring(12)}` : nik;
  const isPriority = Boolean(ticket.is_priority);
  const priorityType = ticket.priority_type ? ticket.priority_type.toUpperCase() : 'LANSIA / DISABILITAS / IBU HAMIL';

  const now = new Date();
  const printDateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const printTimeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' WITA';

  const printHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Tiket Antrean MPP Simpurusiang - ${rawCode}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm 4mm;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: #fff;
        color: #000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      .no-print {
        display: none !important;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background: #f3f4f6;
      padding: 12px;
      margin: 0;
      display: flex;
      justify-content: center;
    }
    .ticket-container {
      width: 100%;
      max-width: 320px;
      background: #fff;
      padding: 16px 14px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      border-radius: 8px;
      box-sizing: border-box;
      text-align: center;
    }
    .header-logo {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1.25;
      margin-bottom: 2px;
    }
    .sub-header {
      font-size: 11px;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .address {
      font-size: 8.5px;
      color: #4b5563;
      line-height: 1.3;
      margin-bottom: 8px;
      border-bottom: 1.5px dashed #000;
      padding-bottom: 8px;
    }
    .title-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      background: #000;
      color: #fff;
      padding: 3px 8px;
      border-radius: 4px;
      margin: 4px 0 6px 0;
    }
    .priority-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      border: 1px solid #000;
      padding: 2px 6px;
      border-radius: 3px;
      margin-bottom: 6px;
    }
    .agency-name {
      font-size: 11px;
      font-weight: 800;
      color: #111827;
      margin: 4px 0;
      text-transform: uppercase;
    }
    .counter-name {
      font-size: 10px;
      font-weight: 700;
      color: #4b5563;
      margin-bottom: 4px;
    }
    .queue-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: 8px 4px;
      margin: 8px 0;
      background: #fafafa;
    }
    .queue-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #4b5563;
    }
    .queue-number {
      font-size: 40px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #000;
      line-height: 1.1;
      margin: 2px 0;
      font-family: monospace, Courier, sans-serif;
    }
    .queue-code {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      font-family: monospace;
      color: #111827;
    }
    .info-table {
      width: 100%;
      margin: 10px 0;
      border-collapse: collapse;
      font-size: 9.5px;
      text-align: left;
    }
    .info-table td {
      padding: 2.5px 0;
      vertical-align: top;
    }
    .info-table .label {
      color: #4b5563;
      width: 32%;
      font-weight: 600;
    }
    .info-table .sep {
      width: 4%;
      text-align: center;
    }
    .info-table .val {
      color: #000;
      font-weight: 700;
      width: 64%;
    }
    .cut-line {
      border-top: 1.5px dashed #000;
      margin: 10px 0 8px 0;
    }
    .footer-note {
      font-size: 8.5px;
      color: #374151;
      line-height: 1.35;
      margin-bottom: 6px;
    }
    .barcode-mock {
      font-family: monospace;
      font-size: 14px;
      letter-spacing: 4px;
      margin: 6px 0 2px 0;
      font-weight: 900;
    }
    .print-actions {
      margin-top: 14px;
      display: flex;
      gap: 8px;
      justify-content: center;
    }
    .btn {
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: #000;
      color: #fff;
    }
    .btn-secondary {
      background: #e5e7eb;
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="header-logo">PEMERINTAH KABUPATEN LUWU</div>
    <div class="sub-header">MAL PELAYANAN PUBLIK (MPP) SIMPURUSIANG</div>
    <div class="address">
      Jl. Jenderal Sudirman No. 1 Kompleks Perkantoran Pemkab Luwu, Belopa<br/>
      Layanan Terpadu Satu Pintu Kabupaten Luwu
    </div>

    <div class="title-badge">TIKET ANTREAN ONLINE</div>
    ${isPriority ? `<br/><div class="priority-badge">⭐ JALUR PRIORITAS KHUSUS (${priorityType})</div>` : ''}

    <div class="agency-name">${agencyName}</div>
    <div class="counter-name">${counterName}</div>

    <div class="queue-box">
      <div class="queue-label">NOMOR ANTREAN</div>
      <div class="queue-number">${displayNum}</div>
      <div class="queue-code">${rawCode}</div>
    </div>

    <table class="info-table">
      <tr>
        <td class="label">Layanan</td>
        <td class="sep">:</td>
        <td class="val">${serviceName}</td>
      </tr>
      <tr>
        <td class="label">Pemohon</td>
        <td class="sep">:</td>
        <td class="val">${applicantName}</td>
      </tr>
      <tr>
        <td class="label">NIK</td>
        <td class="sep">:</td>
        <td class="val">${maskedNik}</td>
      </tr>
      <tr>
        <td class="label">Tanggal</td>
        <td class="sep">:</td>
        <td class="val">${printDateStr}</td>
      </tr>
      <tr>
        <td class="label">Waktu Ambil</td>
        <td class="sep">:</td>
        <td class="val">${printTimeStr}</td>
      </tr>
    </table>

    <div class="cut-line"></div>

    <div class="barcode-mock">||| |||| || ||||| |||</div>
    <div style="font-size: 8px; font-family: monospace; color: #4b5563; margin-bottom: 6px;">
      ${rawCode}
    </div>

    <div class="footer-note">
      Harap perhatikan layar panggilan dan pengeras suara di ruang tunggu MPP Simpurusiang.<br/>
      <strong>Simpan tiket ini hingga pelayanan Anda selesai.</strong><br/>
      Terima kasih telah memanfaatkan Layanan Digital MPP Simpurusiang.
    </div>

    <div class="print-actions no-print">
      <button class="btn btn-primary" onclick="window.print()">Cetak Tiket</button>
      <button class="btn btn-secondary" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

  // Buka jendela cetak atau buat iframe
  try {
    const printWindow = window.open('', '_blank', 'width=420,height=600,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
      return;
    }
  } catch (e) {
    console.warn('Popup window blocked, fallback to iframe print', e);
  }

  // Fallback: gunakan iframe tersembunyi
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(printHtml);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Iframe print error', err);
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1500);
      }
    }, 400);
  }
}
