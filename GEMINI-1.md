# 🤖 GEMINI.md — Agent Discipline Protocol
> Luwu Investment Portal | github.com/ekkykyel/luwu-investment

File ini dibaca otomatis oleh Gemini setiap sesi dimulai.
Patuhi semua aturan di bawah ini SEBELUM mengeksekusi instruksi apapun.

---

## ⚠️ PRINSIP UTAMA

> **"Lebih baik bertanya dan lambat, daripada cepat tapi merusak kode yang sudah berjalan."**

---

## 🏗️ STACK & ARSITEKTUR PROJECT

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Vercel Serverless Functions (`/api/**`)
- **Database**: Supabase (PostgreSQL + PostGIS + Realtime)
- **AI**: Google Gemini API (`/api/gemini/chat.ts`)
- **Deploy**: Vercel (branch: main, region: sin1)
- **Build**: `vite build && esbuild server.ts --platform=node --format=cjs --outfile=dist/server.cjs`

---

## 🔴 ATURAN MUTLAK

### 1. ZERO HALLUCINATION
- Jangan asumsikan isi file, variabel, fungsi, atau struktur yang **tidak ditampilkan**.
- Jika tidak tahu isi file → katakan: _"Saya perlu melihat file `X` terlebih dahulu."_
- Dilarang mengarang nama variabel, path file, nama fungsi, atau API endpoint.

### 2. SURGICAL EDIT — HANYA UBAH YANG DIPERINTAHKAN
- Ubah **HANYA** bagian yang secara eksplisit disebutkan dalam instruksi.
- Jangan tambah fitur baru meskipun tampaknya "lebih baik".
- Jangan hapus kode yang tidak disebutkan dalam instruksi.
- Jangan refactor, rename, atau reformat kode di luar scope instruksi.
- Jangan ubah indentasi atau gaya penulisan kode yang tidak diminta.

### 3. NO CREATIVE FREEDOM TANPA IZIN EKSPLISIT
Dilarang melakukan hal berikut kecuali **secara eksplisit diminta**:
- ❌ Menambah `console.log` / `console.error`
- ❌ Menambah `try-catch` atau error handling baru
- ❌ Menambah loading state atau fallback UI
- ❌ Menambah TypeScript type annotation baru
- ❌ Menambah komentar baru
- ❌ Mengganti library/package dengan alternatif lain
- ❌ Menambah import yang tidak dibutuhkan perubahan yang diperintahkan
- ❌ Menghapus komentar yang sudah ada
- ❌ Mengganti hardcoded value dengan variable/constant
- ❌ Mengubah nama variabel atau fungsi
- ❌ Mengubah struktur folder atau nama file

### 4. JANGAN SENTUH CONFIG FILES TANPA PERINTAH EKSPLISIT
File berikut **tidak boleh diubah** kecuali itu yang diperintahkan:
- `vercel.json`
- `tsconfig.json`
- `vite.config.ts`
- `package.json` (termasuk dependency)
- `.env` / `.env.local` / `.env.production`
- `tailwind.config.ts`

### 5. KONFIRMASI SEBELUM EKSEKUSI BESAR
Wajib tanya dan tunggu konfirmasi jika:
- Instruksi ambigu atau bisa ditafsirkan lebih dari satu cara
- Perubahan berdampak ke file lain yang tidak disebutkan
- Kamu harus menghapus kode dalam jumlah signifikan
- Perubahan menyentuh logika bisnis utama (routing, auth, Supabase, Gemini)

---

## 📋 FORMAT OUTPUT WAJIB

Setiap respons perubahan kode HARUS mengikuti format:

```
📍 FILE    : [path file lengkap]
🔍 SCOPE   : [nama fungsi / baris / section yang diubah]
✏️  UBAH    : [deskripsi singkat perubahan]
🚫 TIDAK   : [apa yang sengaja tidak diubah]
```

Tampilkan perubahan sebagai **DIFF** atau **hanya bagian yang berubah** — bukan full rewrite file.

```diff
- baris lama
+ baris baru
```

---

## 🟡 KALIMAT WAJIB KETIKA TIDAK YAKIN

```
"Sebelum saya eksekusi, apakah maksud Anda [A] atau [B]?"
"Saya perlu melihat isi file [X] untuk mengerjakan ini dengan aman."
"Perubahan ini akan berdampak pada [Y]. Apakah saya boleh mengubahnya juga?"
```

---

## ✅ CHECKLIST SEBELUM SUBMIT

- [ ] Hanya mengubah yang disebutkan dalam instruksi
- [ ] Tidak menambah import yang tidak dibutuhkan
- [ ] Tidak mengubah config file tanpa perintah
- [ ] Tidak mengarang nama variabel/fungsi
- [ ] Format output sudah mengikuti template
- [ ] Perubahan ditampilkan sebagai diff / partial — bukan full rewrite
- [ ] Ambiguitas sudah dikonfirmasi sebelum eksekusi

---

## 🚨 PELANGGARAN PROTOKOL

Jika agen menambah kode diluar instruksi, menghapus kode tanpa perintah, atau mengarang asumsi — pengguna berhak meminta **rollback penuh** tanpa penjelasan tambahan.

---

*Protocol v1.0 — Luwu Investment Portal*