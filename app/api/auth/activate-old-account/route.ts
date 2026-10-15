import { createClient } from "@supabase/supabase-js";
import { 
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY, 
  SUPABASE_SECRET_KEY 
} from "@/config/env";

const supabaseAdminKey = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, supabaseAdminKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, otpCode, newPassword } = body;

    const rawIdentifier = String(identifier || "").trim();
    const rawOtp = String(otpCode || "").trim();
    const rawPassword = String(newPassword || "").trim();

    // 1. Validasi Input Dasar
    if (!rawIdentifier) {
      return Response.json(
        { success: false, message: "NIK atau Nomor WhatsApp wajib diisi." },
        { status: 400 }
      );
    }
    if (!rawOtp) {
      return Response.json(
        { success: false, message: "Kode OTP WhatsApp wajib diisi." },
        { status: 400 }
      );
    }
    if (!rawPassword || rawPassword.length < 6) {
      return Response.json(
        { success: false, message: "Kata sandi baru minimal 6 karakter." },
        { status: 400 }
      );
    }

    const cleanDigits = rawIdentifier.replace(/\D/g, "");
    const isNik = cleanDigits.length === 16;

    let phone08 = "";
    let phone62 = "";
    if (cleanDigits.startsWith("08")) {
      phone08 = cleanDigits;
      phone62 = "62" + cleanDigits.slice(1);
    } else if (cleanDigits.startsWith("628")) {
      phone62 = cleanDigits;
      phone08 = "0" + cleanDigits.slice(2);
    } else if (cleanDigits.length >= 9) {
      phone08 = "0" + cleanDigits;
      phone62 = "62" + cleanDigits;
    }

    // 2. Pencarian data pemohon lama di database
    let foundNik: string | null = isNik ? cleanDigits : null;
    let foundPhone: string | null = null;
    let foundName: string | null = null;
    let foundUserId: string | null = null;
    let foundEmail: string | null = null;

    // A. Cari di tabel profiles
    let profileQuery = supabaseAdmin.from("profiles").select("*");
    if (isNik) {
      profileQuery = profileQuery.eq("nik", cleanDigits);
    } else if (phone08 && phone62) {
      profileQuery = profileQuery.or(
        `phone.eq.${phone08},phone.eq.${phone62},phone_number.eq.${phone08},phone_number.eq.${phone62},no_whatsapp.eq.${phone08},no_whatsapp.eq.${phone62},whatsapp.eq.${phone08},whatsapp.eq.${phone62}`
      );
    } else {
      profileQuery = profileQuery.eq("email", rawIdentifier.toLowerCase());
    }

    const { data: profileData } = await profileQuery.maybeSingle();
    if (profileData) {
      foundNik = profileData.nik || foundNik;
      foundPhone = profileData.no_whatsapp || profileData.whatsapp || profileData.phone || profileData.phone_number;
      foundName = profileData.full_name || profileData.name;
      foundUserId = profileData.id;
      foundEmail = profileData.email;
    }

    // B. Cari di tabel pkkpr_permohonan
    if (!foundUserId || !foundName) {
      let pkkprQuery = supabaseAdmin.from("pkkpr_permohonan").select("*");
      if (phone08 && phone62) {
        pkkprQuery = pkkprQuery.or(`pemohon_phone.eq.${phone08},pemohon_phone.eq.${phone62}`);
      } else if (rawIdentifier.includes("@")) {
        pkkprQuery = pkkprQuery.eq("pemohon_email", rawIdentifier.toLowerCase());
      }
      const { data: pkkprData } = await pkkprQuery
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pkkprData) {
        foundPhone = foundPhone || pkkprData.pemohon_phone;
        foundName = foundName || pkkprData.pemohon_name;
        foundUserId = foundUserId || pkkprData.user_id;
        foundEmail = foundEmail || pkkprData.pemohon_email;
      }
    }

    // C. Cari di tabel mpp_citizens
    if (!foundUserId || !foundName) {
      let citQuery = supabaseAdmin.from("mpp_citizens").select("*");
      if (isNik) {
        citQuery = citQuery.eq("nik", cleanDigits);
      } else if (phone08 && phone62) {
        citQuery = citQuery.or(`phone_number.eq.${phone08},phone_number.eq.${phone62}`);
      }
      const { data: citizenData } = await citQuery.maybeSingle();
      if (citizenData) {
        foundNik = citizenData.nik || foundNik;
        foundPhone = foundPhone || citizenData.phone_number;
        foundName = foundName || citizenData.full_name;
        foundUserId = foundUserId || citizenData.user_id;
      }
    }

    const finalNik = foundNik || (cleanDigits.length === 16 ? cleanDigits : "");
    const finalPhone = foundPhone || phone62 || phone08;
    const finalName = foundName || "Masyarakat Pemohon";
    const dummyEmail = finalNik ? `${finalNik}@warga.simpurusiang.go.id` : (foundEmail || `user_${cleanDigits}@warga.simpurusiang.go.id`);
    const finalEmail = foundEmail && foundEmail.includes("@") && !foundEmail.includes("@warga.simpurusiang.go.id") 
      ? foundEmail.toLowerCase() 
      : dummyEmail;

    let targetUserId = foundUserId;

    // 3. Update atau Buat Akun di Supabase Auth via Admin Service Role
    if (targetUserId) {
      try {
        const { data: updatedUser, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          {
            password: rawPassword,
            email_confirm: true,
            user_metadata: {
              nik: finalNik,
              full_name: finalName,
              phone: finalPhone,
              phone_number: finalPhone,
              no_whatsapp: finalPhone,
              role: "masyarakat",
              is_password_activated: true,
              password_activated_at: new Date().toISOString()
            }
          }
        );

        if (updateErr) {
          console.warn("[API ACTIVATE] Update by ID failed, falling back to email:", updateErr.message);
          targetUserId = null;
        } else if (updatedUser?.user) {
          targetUserId = updatedUser.user.id;
        }
      } catch (e: any) {
        targetUserId = null;
      }
    }

    if (!targetUserId) {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = userList?.users?.find(
        u => u.email?.toLowerCase() === finalEmail.toLowerCase() ||
             u.email?.toLowerCase() === dummyEmail.toLowerCase() ||
             u.user_metadata?.nik === finalNik
      );

      if (existingAuthUser) {
        targetUserId = existingAuthUser.id;
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          password: rawPassword,
          email_confirm: true,
          user_metadata: {
            ...existingAuthUser.user_metadata,
            nik: finalNik,
            full_name: finalName,
            phone: finalPhone,
            phone_number: finalPhone,
            no_whatsapp: finalPhone,
            role: "masyarakat",
            is_password_activated: true,
            password_activated_at: new Date().toISOString()
          }
        });
      } else {
        const { data: newAuthUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: finalEmail,
          password: rawPassword,
          email_confirm: true,
          user_metadata: {
            nik: finalNik,
            full_name: finalName,
            phone: finalPhone,
            phone_number: finalPhone,
            no_whatsapp: finalPhone,
            role: "masyarakat",
            is_password_activated: true,
            password_activated_at: new Date().toISOString()
          }
        });

        if (createErr) {
          return Response.json(
            { success: false, message: `Gagal membuat akun autentikasi: ${createErr.message}` },
            { status: 500 }
          );
        }
        targetUserId = newAuthUser.user.id;
      }
    }

    // 4. Sinkronisasi Data Relasional
    if (targetUserId) {
      await supabaseAdmin.from("profiles").upsert({
        id: targetUserId,
        nik: finalNik || null,
        full_name: finalName,
        role: "masyarakat",
        email: finalEmail,
        phone: finalPhone || null,
        phone_number: finalPhone || null,
        no_whatsapp: finalPhone || null,
        whatsapp: finalPhone || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });

      if (finalNik) {
        await supabaseAdmin.from("mpp_citizens").update({ user_id: targetUserId }).eq("nik", finalNik);
      }
      if (finalPhone) {
        await supabaseAdmin.from("pkkpr_permohonan").update({ user_id: targetUserId }).eq("pemohon_phone", finalPhone);
      }
    }

    return Response.json({
      success: true,
      message: "Akun berhasil diaktivasi! Silakan login menggunakan NIK dan Kata Sandi baru Anda.",
      nik: finalNik,
      identifier: finalNik || rawIdentifier,
      email: finalEmail,
      fullName: finalName,
      userId: targetUserId
    });
  } catch (err: any) {
    console.error("[POST /api/auth/activate-old-account] Error:", err);
    return Response.json(
      { success: false, message: err?.message || "Terjadi kesalahan pada server saat aktivasi akun." },
      { status: 500 }
    );
  }
}
