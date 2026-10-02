# 🗺️ SPATIAL ARCHITECTURE & GOLDEN STANDARD RULES
## Pemerintah Kabupaten Luwu — Web GIS & Spatial Intelligence Platform

> **STATUS: TERKUNCI (IMMUTABLE STANDARD)**  
> Dokumen ini adalah spesifikasi arsitektur resmi tingkat enterprise untuk modul Geospasial, Digitasi, Import KMZ/KML/SHP, dan Sinkronisasi PostGIS di Portal Investasi Kabupaten Luwu.  
> **SEMUA AI ASSISTANT / DEVELOPER DILARANG MENGUBAH, MENGHAPUS, ATAU MEREDUKSI POLA ARSITEKTUR INI.**

---

### 🏛️ 1. DOKTRIN GOLDEN STANDARD ARSITEKTUR SPASIAL

Seluruh pipeline geospasial Kabupaten Luwu wajib mematuhi 4 pilar berikut:
1. **Single Source of Truth**: Data spasial bersumber 100% dari PostgreSQL + PostGIS Supabase (11 Tabel Resmi: `gis_zonasi`, `gis_sawah`, `gis_jalan`, `gis_sungai`, `gis_mangrove`, `gis_tambak`, `gis_lahankeringprimer`, `gis_lahankeringsekunder`, `gis_infrastruktur`, `gis_pkkpr`, `gis_potensi_investasi`).
2. **Zero Dummy & Anti-Halusinasi**: Dilarang keras menyuntikkan *mock data*, nama proyek fiktif, atau koordinat rekayasa.
3. **Presisi Proyeksi WGS84 (EPSG:4326)**: Semua geometri OGC (Polygon, MultiPolygon, LineString, Point) wajib berkoordinat bujur/lintang standar WGS84 dengan validasi batas Kabupaten Luwu (`119.4° – 120.9° BT, -3.9° – -2.3° LS`).
4. **Safe Chunked Pipeline**: Mengingat data spasial vector dapat memuat ratusan/ribuan vertex dan fitur, pengiriman ke database WAJIB dipecah ke dalam potongan batch aman (50–100 baris) untuk mencegah kegagalan *HTTP 413 Payload Too Large* atau *PostgREST Timeout*.

---

### 📦 2. MODUL IMPORT SPASIAL VECTOR & KMZ ENGINE (`SpatialImportModal.tsx`)

Modul `src/components/Dashboard/SpatialImportModal.tsx` merupakan pintu gerbang utama untuk memasukkan data hasil digitasi Google Earth Pro, QGIS, ArcGIS, dan Drone Survey ke dalam database PostGIS.

#### **A. Ekstraksi KMZ Menggunakan JSZip & @tmcw/togeojson**
* File `.kmz` adalah arsip ZIP yang memuat satu atau lebih file KML.
* **Prosedur Wajib:**
  1. Baca file `.kmz` sebagai `ArrayBuffer`.
  2. Buka arsip dengan `JSZip.loadAsync(arrayBuffer)`.
  3. Pindai nama file dengan regex dinamis `/.*\.kml$/i` (memprioritaskan `doc.kml` atau berkas `.kml` pertama yang ditemukan, tidak boleh hardcode nama file tunggal).
  4. Ambil teks XML KML via `zip.files[name].async('text')`.
  5. Parsing DOM XML dengan `new DOMParser().parseFromString(kmlText, 'text/xml')`.
  6. Konversi ke GeoJSON FeatureCollection menggunakan `kml(kmlDom)` dari `@tmcw/togeojson`.

#### **B. Ekstraksi Atribut Kaya (ExtendedData & HTML Tables)**
* KML Google Earth menyimpan metadata pada tag khusus yang wajib diekstrak ke `feature.properties` melalui helper `enrichKmlProperties`:
  * `<SimpleData name="...">`: Atribut terstruktur per kolom.
  * `<Data name="...">`: Pasangan kunci dan `<value>`.
  * Tabel HTML di dalam `<description>`: Di-parse untuk mengekstrak baris `<tr><td>Kunci</td><td>Nilai</td></tr>`.
* Atribut yang wajib dipetakan: `nama`, `kategori`, `luas_ha`, `panjang_km`, `kecamatan`, `desa`, `keterangan`.

#### **C. Staging Area & Visual Preview**
* Sebelum data dikirim ke database, data wajib ditampilkan pada **Staging Map Canvas** (MapLibre GL) dengan styling *High-Contrast Neon Yellow / Amber* (`#facc15`), lengkap dengan metrik analitik Turf.js (Jumlah Poligon, Garis, Titik, Luas Ha, Panjang km).

---

### ⚡ 3. LOGIKA BATCH SINKRONISASI POSTGIS (`batchSyncSpatialDataToSupabase`)

Fungsi `batchSyncSpatialDataToSupabase` di `src/services/spatialSyncService.ts` adalah **standar tunggal untuk operasi bulk-insert/upsert ke Supabase PostGIS**.

```typescript
export async function batchSyncSpatialDataToSupabase(
  tableName: string,
  features: any[],
  options?: {
    mode?: 'REPLACE' | 'APPEND';
    layerId?: string;
    onProgress?: (pct: number, processed: number, total: number) => void;
  }
): Promise<{ success: boolean; count: number; message: string; errors?: string[] }>;
```

#### **A. Opsi Penanganan Data (Database Strategy)**
1. **OPSI REPLACE (Timpa Total)**:
   - Menghapus bersih seluruh data lama pada tabel target PostGIS via `supabase.from(tableName).delete().neq('id', -999999)` (atau UUID non-zero).
   - Menghapus cache lokal browser: `localStorage.removeItem('luwu_spatial_layer_' + layerId)`.
   - Mengisi tabel dengan seluruh poligon baru dari berkas.
2. **OPSI APPEND (Tambahkan)**:
   - Mempertahankan seluruh data eksisting di Supabase.
   - Menghasilkan ID Primary Key baru yang unik untuk setiap poligon baru yang di-insert.

#### **B. Sanitasi Skema & Whitelist Kolom PostgreSQL**
* Setiap baris wajib diformat menggunakan `formatRowForSpatialTable(tableName, feat, properties)`.
* Dilarang mengirim kolom fiktif atau kolom yang tidak ada pada tabel tujuan (contoh: `gis_zonasi` hanya menerima kolom terdaftar seperti `rpluwu2009`, `keterangan`, `geom`, dengan nilai opasitas integer murni).

#### **C. Safe Batch Chunking (50 Baris per Iterasi)**
* Fitur dipecah menjadi *array chunks* berukuran 50 baris (`CHUNK_SIZE = 50`).
* Dikirim secara sekuensial menggunakan `await` dengan pelaporan *progress callback* `onProgress(pct, processed, total)`.
* **Dual-Path Fallback**: Jika Direct Supabase Client menghadapi restriksi RLS, sistem secara otomatis beralih ke Backend Service Role Proxy (`/api/spatial-tables/${tableName}/upsert`).

#### **D. Invalidation Cache Server Otomatis**
* Setiap kali *batch sync* selesai, sistem wajib memanggil `clearLayerDataCache(tableName)` dan mengeksekusi `POST /api/spatial/purge-cache?table=${tableName}` untuk membersihkan in-memory server cache seketika.

---

### 🎯 4. INTEGRITAS EDITOR SPASIAL (`PuptrSpatialEditorDashboard.tsx`)

1. **Resolusi ID Kanonik Database**:
   - Gunakan fungsi `resolveFeatureId(rawId, tableName, properties)` yang selalu mengutamakan `properties.original_id` atau `properties.id` (ID database integer asli) di atas `feature.id` (string UUID MapboxDraw).
2. **Active State Locking**:
   - Variabel `activeEditingIdRef.current` wajib mengunci ID database saat poligon diklik.
   - Tombol "Simpan Perubahan" wajib mengeksekusi operasi `UPDATE` pada baris asli, bukan `INSERT` baris ganda (*phantom insert*).
3. **Auto-Camera Transitions**:
   - Setelah modal import berhasil, sistem wajib memicu `loadLayerData(activeLayerId)` dan menjalankan `mapRef.current.fitBounds(bbox)` ke batas poligon hasil import.

---

### 🔒 5. PANDUAN KETAT UNTUK PENGEMBANG & AGEN AI DI MASA DEPAN

| Tindakan | Status | Konsekuensi Pelanggaran |
|---|---|---|
| **Menghapus JSZip / Handler KMZ** | 🚫 **DILARANG KERAS** | Mengakibatkan kegagalan import data dari Google Earth & QGIS. |
| **Menghapus Batch Chunking (50 Baris)** | 🚫 **DILARANG KERAS** | Menyebabkan error HTTP 413 dan koneksi PostgREST putus saat file besar diunggah. |
| **Mengirim Payload Tanpa Whitelist Kolom** | 🚫 **DILARANG KERAS** | Menyebabkan error PostgREST *column not found in schema cache*. |
| **Menggunakan Data Dummy / Mock Data** | 🚫 **DILARANG KERAS** | Melanggar Doktrin Zero Dummy Pemerintah Kabupaten Luwu. |
| **Mempertahankan `batchSyncSpatialDataToSupabase`** | ✅ **WAJIB** | Menjamin integritas data spasial dan sinkronisasi realtime antara Editor PUPTR dan Peta Investor. |

---

*Dokumen ini diterbitkan oleh Tim Pengembang Sistem Informasi Geospasial Kabupaten Luwu sebagai Acuan Standar Mutlak.*
