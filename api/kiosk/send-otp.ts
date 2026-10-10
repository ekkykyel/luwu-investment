export default async function handler(req: any, res: any) {
  // Hanya izinkan HTTP POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { phone, phone_number, nik, otp, full_name, fullName } = req.body || {};

    let targetPhone = phone || phone_number;
    let targetName = fullName || full_name || 'Bapak/Ibu';

    // Jika NIK diberikan tanpa phone, coba cari phone dari Supabase mpp_citizens
    if (!targetPhone && nik) {
      const rawNik = String(nik).replace(/\D/g, '');
      if (rawNik.length === 16) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://yeezhpdgafbefwipmldl.supabase.co";
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_nycP7MydQUR1hT7lOCRD5w_HCdldhgN";
        
        try {
          const citResp = await fetch(`${supabaseUrl}/rest/v1/mpp_citizens?nik=eq.${rawNik}&select=phone_number,full_name`, {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`
            }
          });
          if (citResp.ok) {
            const citizens = await citResp.json();
            if (Array.isArray(citizens) && citizens.length > 0 && citizens[0].phone_number) {
              targetPhone = citizens[0].phone_number;
              if (citizens[0].full_name) targetName = citizens[0].full_name;
            }
          }
        } catch (e) {
          console.warn("[OTP Lookup Note]:", e);
        }
      }
    }

    if (!targetPhone) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp wajib diisi atau NIK terdaftar tidak ditemukan.' });
    }

    // Ambil token dari process.env
    const fonnteToken = process.env.FONNTE_TOKEN || process.env.FONNTE_API_KEY || process.env.VITE_FONNTE_TOKEN;

    if (!fonnteToken) {
      console.error("[OTP Error]: FONNTE_TOKEN tidak ditemukan di process.env");
      return res.status(500).json({
        success: false,
        message: 'Konfigurasi WhatsApp Gateway (FONNTE_TOKEN) belum terpasang di server.'
      });
    }

    // Format nomor HP (pastikan angka murni)
    let formattedPhone = String(targetPhone).replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    const otpCode = otp || Math.floor(100000 + Math.random() * 900000).toString();
    const message = `[INVEST LUWU] Kode OTP Login Anda adalah: *${otpCode}*. Berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`;

    // Kirim request ke Fonnte API
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: '62',
      }),
    });

    const result = await response.json();

    if (!response.ok || result.status === false) {
      console.error("[Fonnte API Error]:", result);
      return res.status(500).json({
        success: false,
        message: result.reason || result.detail || 'Gagal mengirim pesan via WhatsApp Fonnte.'
      });
    }

    // Berhasil
    return res.status(200).json({
      success: true,
      registered: true,
      message: 'Kode OTP berhasil dikirim via WhatsApp',
      otp: process.env.NODE_ENV === 'development' ? otpCode : undefined
    });

  } catch (error: any) {
    console.error("[Kiosk OTP Runtime Crash]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan internal server saat memproses OTP.'
    });
  }
}
