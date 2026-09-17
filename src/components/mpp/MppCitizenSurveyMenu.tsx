import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Star, CheckCircle2, Award, Send, Sparkles, 
  Building2, FileCheck, DollarSign, Smile, Users, 
  Zap, MessageSquareHeart, ShieldCheck, HeartHandshake,
  AlertCircle, ThumbsUp
} from 'lucide-react';
import Swal from 'sweetalert2';
import { submitMppSurvey, MppSurveyItem } from '../../services/mppFeedbackService';

interface MppCitizenSurveyMenuProps {
  userType?: 'masyarakat' | 'investor';
  defaultName?: string;
  defaultCompany?: string;
  defaultAgency?: string;
  isDarkMode?: boolean;
  onSubmitted?: (survey: MppSurveyItem) => void;
}

const MPP_AGENCIES = [
  "DPMPTSP (Penanaman Modal & PTSP)",
  "Disdukcapil (Kependudukan & Catatan Sipil)",
  "BPN / ATR Kantor Pertanahan",
  "Dinas PUPTR (Tata Ruang & PBG)",
  "Bapenda (Pajak & Retribusi Daerah)",
  "SAMSAT Belopa (Pajak Kendaraan & STNK)",
  "BPJS Kesehatan",
  "BPJS Ketenagakerjaan",
  "Bank Sulselbar",
  "KPP Pratama Palopo (Pajak & NPWP)",
  "Kejaksaan Negeri Luwu",
  "PT. Taspen",
  "Dinas Sosial",
  "Disnakertrans",
  "Dinas Perikanan",
  "Dinas Kominfo",
  "PDAM Tirta Luwu",
  "DEKRANASDA Luwu (Pojok UMKM)",
  "HAS International Center",
  "Konsultasi Investasi & Tata Ruang"
];

const SKM_QUESTIONS = [
  {
    id: 'q1_persyaratan',
    title: '1. Persyaratan Pelayanan',
    desc: 'Kesesuaian persyaratan pelayanan dengan jenis pelayanannya',
    icon: FileCheck,
    color: 'text-emerald-500'
  },
  {
    id: 'q2_prosedur',
    title: '2. Prosedur Pelayanan',
    desc: 'Kemudahan tahapan alur pelayanan yang diberikan di loket MPP',
    icon: CheckCircle2,
    color: 'text-teal-500'
  },
  {
    id: 'q3_waktu',
    title: '3. Kecepatan Waktu Pelayanan',
    desc: 'Ketepatan dan kecepatan waktu pelayanan sesuai standar SLA',
    icon: Zap,
    color: 'text-amber-500'
  },
  {
    id: 'q4_biaya',
    title: '4. Biaya / Tarif Pelayanan',
    desc: 'Kesesuaian biaya yang dibayarkan dengan tarif resmi (Bebas Pungli)',
    icon: DollarSign,
    color: 'text-emerald-500'
  },
  {
    id: 'q5_produk',
    title: '5. Produk Spesifikasi Pelayanan',
    desc: 'Kesesuaian hasil pelayanan (dokumen/izin/kartu) yang diterima',
    icon: Award,
    color: 'text-blue-500'
  },
  {
    id: 'q6_kompetensi',
    title: '6. Kompetensi Petugas Pelaksana',
    desc: 'Keahlian, kejelasan penjelasan, dan ketangkasan petugas loket',
    icon: Users,
    color: 'text-indigo-500'
  },
  {
    id: 'q7_perilaku',
    title: '7. Perilaku Petugas (5S)',
    desc: 'Kesopanan, keramahan, dan ketanggapan petugas menyambut warga',
    icon: Smile,
    color: 'text-teal-500'
  },
  {
    id: 'q8_sarpras',
    title: '8. Kualitas Sarana & Prasarana',
    desc: 'Kenyamanan ruang tunggu, AC, kebersihan, & fasilitas disabilitas',
    icon: Sparkles,
    color: 'text-amber-500'
  },
  {
    id: 'q9_pengaduan',
    title: '9. Penanganan Pengaduan',
    desc: 'Ketanggapan penyelesaian saran, keluhan, dan konsultasi',
    icon: MessageSquareHeart,
    color: 'text-rose-500'
  }
];

const RATING_OPTIONS = [
  { value: 1, label: 'Tidak Sesuai / Buruk', desc: 'Nilai 1' },
  { value: 2, label: 'Kurang Sesuai / Cukup', desc: 'Nilai 2' },
  { value: 3, label: 'Sesuai / Baik', desc: 'Nilai 3' },
  { value: 4, label: 'Sangat Sesuai / Prima', desc: 'Nilai 4' }
];

export const MppCitizenSurveyMenu: React.FC<MppCitizenSurveyMenuProps> = ({
  userType = 'masyarakat',
  defaultName = '',
  defaultCompany = '',
  defaultAgency = MPP_AGENCIES[0],
  isDarkMode = false,
  onSubmitted
}) => {
  const [nama, setNama] = useState(defaultName || (userType === 'investor' ? 'Investor Terdaftar' : 'Masyarakat Luwu'));
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [perusahaan, setPerusahaan] = useState(defaultCompany);
  const [instansi, setInstansi] = useState(defaultAgency);
  const [layanan, setLayanan] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Ratings for 9 questions (Default: 4 - Sangat Sesuai)
  const [ratings, setRatings] = useState<Record<string, number>>({
    q1_persyaratan: 4,
    q2_prosedur: 4,
    q3_waktu: 4,
    q4_biaya: 4,
    q5_produk: 4,
    q6_kompetensi: 4,
    q7_perilaku: 4,
    q8_sarpras: 4,
    q9_pengaduan: 4
  });

  const handleRatingChange = (questionId: string, val: number) => {
    setRatings(prev => ({ ...prev, [questionId]: val }));
  };

  // Calculate live average score (1-4 scaled to 100%)
  const sumScores = Object.values(ratings).reduce((a, b) => a + b, 0);
  const liveAveragePercent = Math.round((sumScores / 36) * 100);
  const predikat = liveAveragePercent >= 88 ? 'A (Sangat Baik / Prima)' : liveAveragePercent >= 76 ? 'B (Baik)' : 'C (Kurang)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalName = isAnonymous ? 'Warga Luwu (Anonim)' : (nama.trim() || 'Masyarakat Luwu');
      const res = await submitMppSurvey({
        nama: finalName,
        user_type: userType,
        instansi,
        layanan: layanan.trim() || 'Pelayanan Terpadu Satu Pintu',
        q1_persyaratan: ratings.q1_persyaratan,
        q2_prosedur: ratings.q2_prosedur,
        q3_waktu: ratings.q3_waktu,
        q4_biaya: ratings.q4_biaya,
        q5_produk: ratings.q5_produk,
        q6_kompetensi: ratings.q6_kompetensi,
        q7_perilaku: ratings.q7_perilaku,
        q8_sarpras: ratings.q8_sarpras,
        q9_pengaduan: ratings.q9_pengaduan,
        feedback
      });

      setIsSuccess(true);
      if (onSubmitted) onSubmitted(res.data);

      await Swal.fire({
        icon: 'success',
        title: 'Survei SKM Berhasil Terkirim!',
        html: `
          <div class="text-left text-xs space-y-2 mt-2">
            <p>Terima kasih atas partisipasi Anda, <strong>${finalName}</strong>.</p>
            <p class="text-emerald-600 dark:text-emerald-400 font-bold">Skor IKM Anda: ${liveAveragePercent}% (${predikat})</p>
            <p class="text-slate-500">Penilaian ini telah disinkronkan secara otomatis ke <strong>Seksi SURVEY KEPUASAN</strong> dan <strong>TESTIMONI WARGA</strong> di Portal Utama MPP Simpurusiang.</p>
          </div>
        `,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Selesai'
      });

      // Reset feedback
      setFeedback('');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Survei',
        text: err?.message || 'Terjadi gangguan jaringan saat mengirim data survei.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`rounded-3xl border p-4 sm:p-8 backdrop-blur-md shadow-xl transition-all ${
      isDarkMode ? 'bg-slate-900/70 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans inline-flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> PermenPAN-RB No. 14 / 2017
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {userType === 'investor' ? 'SKM Pelaku Usaha & Investor' : 'SKM Warga Kabupaten Luwu'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            Survei Kepuasan Masyarakat (SKM)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Bantu kami mewujudkan pelayanan publik prima dan akuntabel di MPP Simpurusiang. Nilai survei Anda otomatis terintegrasi ke <strong>Seksi SURVEY KEPUASAN</strong> pada Portal MPP.
          </p>
        </div>

        {/* Live Score Widget */}
        <div className="px-5 py-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/15 border border-emerald-500/30 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-sans block">
              Indeks Penilaian Anda
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-sans">
                {liveAveragePercent}%
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                {predikat.split(' ')[0]}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              9 Unsur Terpenuhi
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ThumbsUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Identitas & Instansi Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Nama Responden */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                Nama Responden / Pemohon
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>Kirim Anonim</span>
              </label>
            </div>
            <input
              type="text"
              disabled={isAnonymous}
              value={isAnonymous ? 'Warga Luwu (Anonim)' : nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap Anda..."
              className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Instansi Tujuan */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
              Instansi Pelayanan yang Dinilai
            </label>
            <select
              value={instansi}
              onChange={(e) => setInstansi(e.target.value)}
              className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {MPP_AGENCIES.map((inst, idx) => (
                <option key={idx} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Layanan yang Diurus */}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
              Jenis Layanan yang Diurus (Opsional)
            </label>
            <input
              type="text"
              value={layanan}
              onChange={(e) => setLayanan(e.target.value)}
              placeholder="Contoh: Cetak KTP-el / Izin Usaha OSS / Pajak PBB / Sertifikat Tanah / BPJS"
              className="w-full min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 9 Indikator SKM PermenPAN-RB */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold font-sans flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              Penilaian 9 Unsur Standar Pelayanan Publik
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Skala 1 - 4</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {SKM_QUESTIONS.map((q) => {
              const currentVal = ratings[q.id] || 4;
              const Icon = q.icon;
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-xl bg-emerald-500/10 ${q.color} shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold font-sans text-slate-800 dark:text-slate-100">
                          {q.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {q.desc}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono self-end sm:self-center px-2 py-0.5 rounded-md bg-emerald-500/10">
                      Nilai: {currentVal} / 4
                    </span>
                  </div>

                  {/* 4 Pilihan Tombol */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {RATING_OPTIONS.map((opt) => {
                      const isSelected = currentVal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleRatingChange(q.id, opt.value)}
                          className={`min-h-[44px] py-2.5 px-3 rounded-xl border text-left transition-all flex flex-col justify-center cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 font-bold ring-2 ring-emerald-400/40'
                              : isDarkMode
                              ? 'bg-slate-800 border-slate-700/80 text-slate-300 hover:border-slate-600'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold">{opt.value} Bintang</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span className={`text-[10px] leading-tight truncate mt-0.5 ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saran & Masukan */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans flex items-center gap-1.5">
            <MessageSquareHeart className="w-4 h-4 text-emerald-500" />
            Saran, Apresiasi & Masukan Perbaikan Pelayanan
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tuliskan pengalaman, masukan atau apresiasi Anda terhadap kenyamanan loket, sikap petugas, atau kecepatan antrean..."
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
          />
          <p className="text-[11px] text-slate-500">
            * Masukan yang Anda tuliskan akan otomatis diteruskan ke tim pengawas MPP dan dapat ditampilkan di portal masyarakat.
          </p>
        </div>

        {/* Tombol Kirim */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Terhubung langsung ke Sistem Monitoring MPP Simpurusiang</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold font-sans text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Menyimpan Survei...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Survei SKM Sekarang</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
