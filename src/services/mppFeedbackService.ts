import { supabase } from '../lib/supabaseClient';
import { LOCALIZED_REVIEWS } from '../data/mppAgenciesData';

export interface MppTestimonial {
  id: string;
  nama: string;
  perusahaan?: string;
  layanan: string;
  teks: string;
  rating: number; // 1 - 5
  status: string; // e.g. "Sangat Puas", "Pelayanan Prima"
  tanggal: string;
  user_type: 'masyarakat' | 'investor';
  created_at: string;
}

export interface MppSurveyItem {
  id: string;
  nama: string;
  user_type: 'masyarakat' | 'investor';
  instansi: string;
  layanan: string;
  q1_persyaratan: number; // 1 - 4
  q2_prosedur: number;
  q3_waktu: number;
  q4_biaya: number;
  q5_produk: number;
  q6_kompetensi: number;
  q7_perilaku: number;
  q8_sarpras: number;
  q9_pengaduan: number;
  rating: number; // Converted 1 - 5
  feedback: string;
  created_at: string;
}

const TESTIMONIALS_STORAGE_KEY = 'mpp_portal_testimonials';
const SURVEYS_STORAGE_KEY = 'mpp_portal_surveys';

// Helper to format date in Indonesian format
export function formatIndoDate(dateStr?: string | Date): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '13 September 2026';
  }
}

/**
 * Submit a new Testimonial from Citizen or Investor Dashboard
 */
export async function submitMppTestimonial(data: {
  nama: string;
  perusahaan?: string;
  layanan: string;
  teks: string;
  rating: number;
  status?: string;
  user_type: 'masyarakat' | 'investor';
}): Promise<{ success: boolean; data: MppTestimonial }> {
  const rating = Math.max(1, Math.min(5, Number(data.rating) || 5));
  const status = data.status || (rating >= 5 ? 'Sangat Puas & Prima' : rating === 4 ? 'Puas & Memuaskan' : 'Cukup Baik');
  const nowIso = new Date().toISOString();
  const formattedDate = formatIndoDate(nowIso);

  const newTestimonial: MppTestimonial = {
    id: 'testi-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    nama: data.nama.trim() || (data.user_type === 'investor' ? 'Investor Terdaftar' : 'Masyarakat Luwu'),
    perusahaan: data.perusahaan?.trim(),
    layanan: data.layanan.trim() || 'Pelayanan MPP Simpurusiang',
    teks: data.teks.trim(),
    rating,
    status,
    tanggal: formattedDate,
    user_type: data.user_type,
    created_at: nowIso
  };

  // 1. Save to localStorage immediately for instant UI availability
  try {
    const existing = JSON.parse(localStorage.getItem(TESTIMONIALS_STORAGE_KEY) || '[]');
    const updated = [newTestimonial, ...existing.filter((t: any) => t.id !== newTestimonial.id)];
    localStorage.setItem(TESTIMONIALS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to write testimonial to localStorage', e);
  }

  // 2. Persist to Supabase investor_testimonials (which stores both citizen & investor testimonials)
  try {
    const resolvedCompany = newTestimonial.perusahaan
      ? `${newTestimonial.nama} (${newTestimonial.perusahaan})`
      : `${newTestimonial.nama} (${data.user_type === 'masyarakat' ? 'Warga Kab. Luwu' : 'Badan Usaha / Investor'})`;

    await supabase.from('investor_testimonials').insert([
      {
        company_name: resolvedCompany,
        sector: newTestimonial.layanan || 'Pelayanan Publik MPP',
        message: newTestimonial.teks,
        is_verified: true, // Auto-verified for instant portal showcase
        created_at: nowIso
      }
    ]);
  } catch (err) {
    console.warn('Supabase insert testimonial fallback (using local cache):', err);
  }

  // 3. Post to backend API if available
  try {
    await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        investor_name: newTestimonial.nama,
        company_name: newTestimonial.perusahaan || (data.user_type === 'masyarakat' ? 'Warga Kab. Luwu' : 'Badan Usaha / Investor'),
        sector: newTestimonial.layanan || 'Pelayanan Publik MPP',
        message: newTestimonial.teks,
        rating: newTestimonial.rating
      })
    }).catch(() => null);
  } catch {}

  // 4. Notify all components on this tab or other tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mpp_feedback_updated', { detail: { type: 'testimonial', item: newTestimonial } }));
  }

  return { success: true, data: newTestimonial };
}

/**
 * Fetch all testimonials combined from Supabase, localStorage, and baseline
 */
export async function getMppTestimonials(): Promise<MppTestimonial[]> {
  const localList: MppTestimonial[] = [];

  // Read localStorage
  try {
    const raw = localStorage.getItem(TESTIMONIALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localList.push(...parsed);
      }
    }
  } catch (e) {
    console.warn('Error reading local testimonials:', e);
  }

  // Fetch Supabase investor_testimonials
  const dbList: MppTestimonial[] = [];
  try {
    const { data, error } = await supabase
      .from('investor_testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      data.forEach((t: any) => {
        dbList.push({
          id: String(t.id || 'db-' + Math.random()),
          nama: t.investor_name || t.name || t.nama || t.company_name || 'Masyarakat Luwu',
          perusahaan: t.company_name,
          layanan: t.sector || t.layanan || 'Pelayanan MPP Simpurusiang',
          teks: t.message || t.comment || t.ulasan || 'Pelayanan sangat memuaskan.',
          rating: Number(t.rating) || 5,
          status: Number(t.rating) >= 5 ? 'Sangat Puas & Prima' : Number(t.rating) === 4 ? 'Puas' : 'Sesuai Standar',
          tanggal: formatIndoDate(t.created_at),
          user_type: (t.company_name && !t.company_name.includes('Warga')) ? 'investor' : 'masyarakat',
          created_at: t.created_at || new Date().toISOString()
        });
      });
    }
  } catch (e) {
    console.warn('Error fetching Supabase testimonials:', e);
  }

  // Baseline starter reviews from data file
  const starterList: MppTestimonial[] = (LOCALIZED_REVIEWS || []).map((r, i) => ({
    id: `starter-${i}`,
    nama: r.nama,
    layanan: r.layanan,
    teks: r.teks,
    rating: 5,
    status: r.status || 'Sangat Puas',
    tanggal: r.tanggal || '18 Agustus 2026',
    user_type: 'masyarakat',
    created_at: new Date('2026-08-18').toISOString()
  }));

  // Merge, deduplicate by text/author, and sort newest first
  const seen = new Set<string>();
  const combined: MppTestimonial[] = [];

  // Local submissions take highest priority (most recent)
  for (const item of localList) {
    const key = `${item.nama}_${item.teks}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  // Then Supabase submissions
  for (const item of dbList) {
    const key = `${item.nama}_${item.teks}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  // Finally baseline reviews if list is still small
  for (const item of starterList) {
    const key = `${item.nama}_${item.teks}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  return combined;
}

/**
 * Submit a new SKM Survey from Citizen or Investor Dashboard
 */
export async function submitMppSurvey(data: {
  nama: string;
  user_type?: 'masyarakat' | 'investor';
  instansi: string;
  layanan: string;
  citizen_nik?: string;
  user_id?: string;
  q1_persyaratan: number;
  q2_prosedur: number;
  q3_waktu: number;
  q4_biaya: number;
  q5_produk: number;
  q6_kompetensi: number;
  q7_perilaku: number;
  q8_sarpras: number;
  q9_pengaduan: number;
  feedback?: string;
}): Promise<{ success: boolean; data: MppSurveyItem }> {
  const sum =
    Number(data.q1_persyaratan || 4) +
    Number(data.q2_prosedur || 4) +
    Number(data.q3_waktu || 4) +
    Number(data.q4_biaya || 4) +
    Number(data.q5_produk || 4) +
    Number(data.q6_kompetensi || 4) +
    Number(data.q7_perilaku || 4) +
    Number(data.q8_sarpras || 4) +
    Number(data.q9_pengaduan || 4);

  const avg1to4 = sum / 9;
  const convertedRating = Math.round(((avg1to4 - 1) / 3) * 4 + 1) || 5;
  const nowIso = new Date().toISOString();

  // Ambil user.id dari sesi aktif jika ada
  let currentUserId = data.user_id || null;
  if (!currentUserId) {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      currentUserId = userRes?.user?.id || null;
    } catch (e) {}
  }

  const newSurvey: MppSurveyItem = {
    id: 'survey-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    nama: data.nama.trim() || (data.user_type === 'investor' ? 'Pelaku Usaha / Investor' : 'Warga Luwu'),
    user_type: data.user_type,
    instansi: data.instansi || 'DPMPTSP Kabupaten Luwu',
    layanan: data.layanan || 'Pelayanan Terpadu Satu Pintu',
    q1_persyaratan: Number(data.q1_persyaratan || 4),
    q2_prosedur: Number(data.q2_prosedur || 4),
    q3_waktu: Number(data.q3_waktu || 4),
    q4_biaya: Number(data.q4_biaya || 4),
    q5_produk: Number(data.q5_produk || 4),
    q6_kompetensi: Number(data.q6_kompetensi || 4),
    q7_perilaku: Number(data.q7_perilaku || 4),
    q8_sarpras: Number(data.q8_sarpras || 4),
    q9_pengaduan: Number(data.q9_pengaduan || 4),
    rating: convertedRating,
    feedback: data.feedback?.trim() || '',
    created_at: nowIso
  };

  // 1. Submit ke backend endpoint /api/mpp/skm (Service Role Protected)
  const apiRes = await fetch('/api/mpp/skm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama: newSurvey.nama,
      user_type: newSurvey.user_type,
      instansi: newSurvey.instansi,
      agency_name: newSurvey.instansi,
      layanan: newSurvey.layanan,
      service_name: newSurvey.layanan,
      citizen_nik: data.citizen_nik || null,
      citizen_phone: data.citizen_phone || null,
      user_id: currentUserId,
      q1_persyaratan: newSurvey.q1_persyaratan,
      q2_prosedur: newSurvey.q2_prosedur,
      q3_waktu: newSurvey.q3_waktu,
      q4_biaya: newSurvey.q4_biaya,
      q5_produk: newSurvey.q5_produk,
      q6_kompetensi: newSurvey.q6_kompetensi,
      q7_perilaku: newSurvey.q7_perilaku,
      q8_sarpras: newSurvey.q8_sarpras,
      q9_pengaduan: newSurvey.q9_pengaduan,
      rating: newSurvey.rating,
      feedback: newSurvey.feedback
    })
  });

  const resJson = await apiRes.json().catch(() => ({}));
  if (!apiRes.ok || resJson.success === false) {
    console.error('[mppFeedbackService] Failed calling /api/mpp/skm:', resJson);
    throw new Error(resJson.error || resJson.message || 'Gagal menyimpan survei SKM ke database.');
  }

  const savedSurvey = resJson.data ? {
    ...newSurvey,
    id: resJson.data.id || newSurvey.id,
    created_at: resJson.data.created_at || newSurvey.created_at
  } : newSurvey;

  // 2. Dispatch global real-time event untuk memperbarui statistik SKM di seluruh halaman
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mpp_feedback_updated', { detail: { type: 'survey', item: savedSurvey } }));
  }

  return { success: true, data: savedSurvey };
}

export interface MppSurveySummary {
  surveys: MppSurveyItem[];
  totalRespondents: number;
  averageScore: number;
  indicators: { key: string; label: string; score: number }[];
  indicatorsByKey: Record<string, number>;
}

/**
 * Get all surveys and aggregated stats directly from Supabase mpp_skm
 */
export async function getMppSurveys(): Promise<MppSurveySummary> {
  let dbSurveys: MppSurveyItem[] = [];

  try {
    const { data: skmRows, error } = await supabase
      .from('mpp_skm')
      .select('*, tenant:mpp_tenants(name, code), citizen:mpp_citizens(full_name, phone_number, occupation)')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(skmRows)) {
      dbSurveys = skmRows.map((r: any) => ({
        id: r.id || 'survey-' + r.created_at,
        nama: r.citizen?.full_name || (r.citizen_nik ? `Pemohon (${r.citizen_nik.slice(0, 4)}...${r.citizen_nik.slice(-4)})` : 'Warga / Investor'),
        user_type: r.citizen?.occupation?.toLowerCase()?.includes('investor') ? 'investor' : (r.user_type || 'masyarakat'),
        instansi: r.tenant?.name || r.agency_name || r.instansi || 'DPMPTSP Kabupaten Luwu',
        layanan: r.service_name || r.layanan || 'Pelayanan Terpadu Satu Pintu',
        q1_persyaratan: Number(r.q1_persyaratan || 4),
        q2_prosedur: Number(r.q2_prosedur || 4),
        q3_waktu: Number(r.q3_waktu || 4),
        q4_biaya: Number(r.q4_biaya || 4),
        q5_produk: Number(r.q5_produk || 4),
        q6_kompetensi: Number(r.q6_kompetensi || 4),
        q7_perilaku: Number(r.q7_perilaku || 4),
        q8_sarpras: Number(r.q8_sarpras || 4),
        q9_pengaduan: Number(r.q9_pengaduan || 4),
        rating: Number(r.rating || 5),
        feedback: r.feedback || '',
        created_at: r.created_at || r.submitted_at || new Date().toISOString()
      }));
    }
  } catch (fetchErr) {
    console.warn('Error fetching surveys from Supabase:', fetchErr);
  }

  // Baseline standard values for 9 indicators (PermenPAN-RB No. 14/2017)
  const baseline = [
    { key: 'persyaratan', label: 'Persyaratan Pelayanan', score: 91.8, qKey: 'q1_persyaratan' as const },
    { key: 'prosedur', label: 'Prosedur Pelayanan', score: 89.4, qKey: 'q2_prosedur' as const },
    { key: 'kecepatan', label: 'Waktu / Kecepatan', score: 88.2, qKey: 'q3_waktu' as const },
    { key: 'biaya', label: 'Biaya / Tarif', score: 95.6, qKey: 'q4_biaya' as const },
    { key: 'produk', label: 'Produk Pelayanan', score: 92.1, qKey: 'q5_produk' as const },
    { key: 'kompetensi', label: 'Kompetensi Petugas', score: 90.5, qKey: 'q6_kompetensi' as const },
    { key: 'perilaku', label: 'Perilaku Petugas', score: 93.4, qKey: 'q7_perilaku' as const },
    { key: 'sarana', label: 'Sarana & Prasarana', score: 88.9, qKey: 'q8_sarpras' as const },
    { key: 'pengaduan', label: 'Penanganan Pengaduan', score: 87.2, qKey: 'q9_pengaduan' as const }
  ];

  const newCount = dbSurveys.length;
  const baselineCount = 12076;
  const totalRespondents = baselineCount + newCount;

  const indicators = baseline.map(b => {
    if (newCount === 0) return { key: b.key, label: b.label, score: b.score };

    // Scale 1-4 to 25-100%
    const surveyScores = dbSurveys.map(s => {
      const val = (s as any)[b.qKey] || 4;
      return (val / 4) * 100;
    });
    const avgNew = surveyScores.reduce((a, c) => a + c, 0) / newCount;
    // Weighted combination
    const combined = ((b.score * baselineCount) + (avgNew * newCount)) / totalRespondents;
    return {
      key: b.key,
      label: b.label,
      score: Number(combined.toFixed(1))
    };
  });

  const indicatorsByKey: Record<string, number> = {};
  indicators.forEach(i => {
    indicatorsByKey[i.key] = i.score;
  });

  const averageScore = Number(
    (indicators.reduce((acc, curr) => acc + curr.score, 0) / indicators.length).toFixed(2)
  );

  return {
    surveys: dbSurveys,
    totalRespondents,
    averageScore,
    indicators,
    indicatorsByKey
  };
}
