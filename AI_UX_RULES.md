# GOVTECH UI/UX & TYPOGRAPHY STANDARDS (MUST FOLLOW)

Setiap kali Anda (AI) membuat komponen baru, mengedit halaman, atau merombak UI, Anda **WAJIB** mematuhi aturan absolut berikut tanpa pengecualian:

## 1. KUNCI TIPOGRAFI (SINGLE TYPEFACE)
- **Font Utama:** WAJIB hanya menggunakan `font-sans` (Plus Jakarta Sans). 
- **Larangan Keras:** DILARANG KERAS menggunakan `font-sora`, `font-poppins`, `font-inter`, `font-roboto`, atau font kustom lainnya di komponen UI manapun.
- **Pengecualian:** `font-mono` (JetBrains Mono) HANYA boleh digunakan untuk angka jam digital, nomor antrean, dan string kode.

## 2. KUNCI SKALA UKURAN (MOBILE-FIRST ACCESSIBILITY)
- **DILARANG KERAS** menggunakan ukuran teks kustom statis di bawah 12px (seperti `text-[9px]`, `text-[10px]`, `text-[11px]`). 
- Batas ukuran terkecil yang diizinkan adalah `text-xs` (dan ini hanya untuk micro-copy/badge).
- **Teks Body/Paragraf:** Wajib menggunakan `text-base` (16px) dengan `leading-relaxed`.
- **Judul (Headings):** Wajib menggunakan skala responsif (contoh: `text-2xl md:text-3xl font-bold`).

## 3. KUNCI ERGONOMI ANDROID-FIRST (TOUCH TARGET & LAYOUT)
- **Touch Target:** Semua elemen yang bisa diklik (button, tab, input) WAJIB memiliki tinggi minimal sentuh di mobile (gunakan `min-h-[44px]`, `min-h-[48px]`, atau `py-3`), namun boleh dinormalkan di desktop (`md:py-2 md:min-h-0`).
- **Horizontal Scroll:** Untuk daftar kategori atau *chips* yang panjang di *mobile*, gunakan `flex overflow-x-auto flex-nowrap snap-x scrollbar-hide` (jangan ditumpuk vertikal).
- **Sticky Bottom:** Tombol aksi utama pada *modal* atau *form* di mobile wajib menempel di bawah (`sticky bottom-0 z-50 bg-white/90 backdrop-blur-md`), namun normal di desktop (`md:static md:bg-transparent`).
