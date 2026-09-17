# 🚨 SISTEM KENDALI AI: PROTOKOL SINKRONISASI GITHUB & DOKTRIN LUWU INVESTMENT 🚨

## 1. 🔄 PROTOKOL SINKRONISASI DUA ARAH GITHUB (AUTO-PULL & AUTO-PUSH)
- **Auto-Pull saat Mulai Sesi**: Setiap kali sesi baru dimulai atau saat pertama kali menerima instruksi kerja di Google AI Studio, AI **WAJIB melakukan pengecekan dan sinkronisasi (`git pull origin main`) secara otomatis** dari repositori `https://github.com/ekkykyel/luwu-investment.git` untuk mengambil pembaruan kode terbaru dari 4 kolaborator.
- **Auto-Commit & Auto-Push**: Setiap kali AI melakukan modifikasi, penambahan fitur, perbaikan bug, atau perubahan kode pada repositori, AI **WAJIB melakukan commit dan push secara otomatis** ke branch `main` repositori `https://github.com/ekkykyel/luwu-investment.git`.
- **Format Pesan Commit**: Deskriptif mengikuti standar konvensi (contoh: `feat:`, `fix:`, `refactor:`, `sync:`).
- **Keamanan Kredensial**: Pastikan token remote dibersihkan kembali setelah push/pull selesai.

## 2. 🛑 ZERO DUMMY POLICY (ANTI-HALUSINASI)
- **DILARANG KERAS** melakukan hardcode data fiktif atau mock data buatan AI.
- Single Source of Truth untuk seluruh data investasi HANYA dari **Supabase (PostgreSQL + PostGIS)**.

## 3. 🛡️ HONEST FALLBACK
- Jika terjadi database kosong atau error koneksi, fallback yang sah hanyalah array kosong `[]` dan pesan status transparan.

## 4. 🎯 INTEGRITAS UI/UX
- Pertahankan kontrol navigasi 3D, layer base map, dan transisi kamera sinematik.
