# 🚨 SISTEM KENDALI AI: DOKTRIN ZERO DUMMY & HONEST FALLBACK 🚨
**PERINGATAN KERAS UNTUK SEMUA AI ASSISTANT / CODE GENERATOR**

Anda sedang beroperasi di dalam *codebase* berstandar Pemerintahan (Pemerintah Kabupaten Luwu). Kredibilitas, Akuntabilitas, dan Integritas Data adalah HARGA MATI. Saat memodifikasi, menambah fitur, atau melakukan *debugging* pada repositori ini, Anda WAJIB mematuhi doktrin berikut tanpa terkecuali:

## 1. 🛑 ZERO DUMMY POLICY (ANTI-HALUSINASI)
- **DILARANG KERAS** melakukan *hardcode*, menyuntikkan, atau mem- *bypass* sistem dengan data investasi fiktif, proyek buatan AI, atau *mock data*.
- Nama-nama seperti "Logistik Hub Bua", "Kakao Latimojong", "Kopi Bastem", atau proyek karangan AI lainnya adalah **BLACKLIST**. Jangan pernah memunculkannya kembali di komponen mana pun.
- *Single Source of Truth* untuk data investasi HANYA berasal dari **Supabase (PostgreSQL + PostGIS)**.
- Data spasial raksasa (jalan, sungai, batas wilayah, tutupan lahan) WAJIB dimuat langsung dari tabel Supabase terkait.

## 2. 🛡️ HONEST FALLBACK (PENANGANAN ERROR YANG JUJUR)
- Jika terjadi *Koneksi Terputus*, *Database Error*, atau *database* kosong, Anda **DILARANG KERAS** menyuntikkan "Premium Fallback" atau data cadangan buatan.
- *Fallback* yang sah hanyalah *array* kosong `[]`.
- Peta harus dibiarkan KOSONG dan UI harus menampilkan pesan *error* secara jujur (contoh: "Belum ada data" atau "Gagal terhubung ke database").
- Lebih baik aplikasi menampilkan peta kosong daripada menyajikan data kebohongan kepada investor dan pemerintah.

## 3. 🎯 INTEGRITAS UI/UX
- Fitur esensial seperti **Kontrol Navigasi 3D** (`maplibregl.NavigationControl`) dan **Basemap Google Maps** pantang dihapus atau disembunyikan saat Anda melakukan refaktor kode.
- Jaga transisi kamera (`flyTo`, `fitBounds`) tetap sinematik dan pertahankan profesionalisme pada *Auto-Popup* (IPRO format).

*Dengan membaca file ini, Anda mengonfirmasi untuk tunduk pada protokol keamanan Pemkab Luwu.*
