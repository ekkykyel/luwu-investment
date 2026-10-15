export interface QueueData {
  ticketCode?: string;
  number?: string;
  agency?: string;
  service?: string;
  estimation?: string;
  session?: string;
  date?: string;
  name?: string;
  nik?: string;
  phone?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  message: string;
  waUrl: string;
  isDemo?: boolean;
}

/**
 * Utility function untuk mengirimkan rincian tiket antrean otomatis via WhatsApp API Gateway.
 * Jika koneksi API gagal, fungsi ini menerapkan Honest Fallback dengan menyediakan waUrl untuk pengiriman manual.
 */
export async function sendQueueWhatsApp(
  phone: string,
  queueData: QueueData
): Promise<SendWhatsAppResult> {
  const cleanPhone = (phone || '').replace(/[^\d]/g, '').replace(/^0/, '62');
  const ticketCode = queueData.number || queueData.ticketCode || 'MPP-000';
  const agencyName = queueData.agency || 'Mal Pelayanan Publik';
  const serviceName = queueData.service || 'Layanan Umum';
  const estTime = queueData.estimation || queueData.session || '09:00 - 11:30 WITA';
  const dateStr = queueData.date || new Date().toISOString().split('T')[0];
  const applicantName = queueData.name || 'Pemohon';

  // Format Pesan WhatsApp Resmi Pemkab Luwu
  const messageText =
    `🎫 *TIKET ANTREAN ONLINE - MPP KABUPATEN LUWU*\n\n` +
    `Yth. *${applicantName}*,\n` +
    `Pendaftaran antrean digital Anda telah berhasil diterbitkan:\n\n` +
    `📌 *KODE TIKET:* *${ticketCode}*\n` +
    `🏢 *INSTANSI:* ${agencyName}\n` +
    `📋 *LAYANAN:* ${serviceName}\n` +
    `⏱️ *ESTIMASI WAKTU:* ${estTime}\n` +
    `📅 *TANGGAL KUNJUNGAN:* ${dateStr}\n\n` +
    `Silakan tunjukkan tiket digital ini kepada petugas resepsionis/loket saat dipanggil.\n\n` +
    `_Pemerintah Kabupaten Luwu - Mal Pelayanan Publik Simpurusiang_`;

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  try {
    const response = await fetch('/api/whatsapp/send-queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: cleanPhone,
        queueData: {
          ticketCode,
          agency: agencyName,
          service: serviceName,
          estimation: estTime,
          date: dateStr,
          name: applicantName,
        },
        message: messageText,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          message: result.message || 'Nomor antrean berhasil dikirim via WhatsApp!',
          waUrl,
          isDemo: result.isDemo,
        };
      } else {
        return {
          success: false,
          message: result.message || 'Pengiriman otomatis via WhatsApp API belum berhasil.',
          waUrl,
        };
      }
    } else {
      return {
        success: false,
        message: 'Tidak dapat terhubung ke server WhatsApp API Gateway.',
        waUrl,
      };
    }
  } catch (error: any) {
    console.warn('[WhatsApp Service] Network API Error:', error);
    return {
      success: false,
      message: 'Pengiriman otomatis gagal (koneksi terputus/offline). Silakan kirim manual via WhatsApp.',
      waUrl,
    };
  }
}
