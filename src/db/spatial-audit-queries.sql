-- ====================================================================================
-- FASE 6: SPATIAL AUDIT & TOPOLOGICAL CLEANUP (POSTGIS)
-- Kumpulan Skrip Kueri Keamanan dan Pembersihan Topologi Peta
-- ====================================================================================

-- PANDUAN PENGGUNAAN:
-- 1. Skrip ini dibagi menjadi 3 bagian berdasarkan jenis penyakit spasial (Repeated, Redundant, Gaps).
-- 2. Setiap bagian memiliki kueri DETEKSI (SELECT) untuk melihat seberapa banyak data yang terdampak
--    tanpa mengubah apapun. Eksekusi ini terlebih dahulu!
-- 3. Setelah yakin, Anda bisa mengeksekusi blok EKSEKUSI (UPDATE) yang sudah dibungkus dengan 
--    BEGIN; dan COMMIT;. Jika ragu saat mengeksekusi, gunakan ROLLBACK; sebelum COMMIT;.
-- 4. Skrip ini dirancang untuk dieksekusi di konsol SQL Supabase / PostgreSQL.

-- ====================================================================================
-- 1. PENYAKIT: REPEATED VERTICES (TITIK KEMBAR SIAM)
-- Gejala: Vertex yang lokasinya benar-benar identik berurutan. Bikin ukuran data membengkak.
-- ====================================================================================

-- [A] DETEKSI (Jalankan ini duluan)
-- Menggunakan toleransi jarak 0.000001 derajat (sekitar 11 sentimeter).
SELECT 
    id, 
    properties->>'name' as nama_lokasi,
    properties->>'category' as kategori,
    ST_NPoints(geometry) as total_vertex_asli,
    ST_NPoints(ST_RemoveRepeatedPoints(geometry, 0.000001)) as total_vertex_bersih,
    (ST_NPoints(geometry) - ST_NPoints(ST_RemoveRepeatedPoints(geometry, 0.000001))) as jumlah_titik_kembar
FROM gis_infrastruktur
WHERE 
    (ST_NPoints(geometry) - ST_NPoints(ST_RemoveRepeatedPoints(geometry, 0.000001))) > 0;

-- [B] EKSEKUSI (Jalankan blok blok ini bersamaan jika hasil deteksi rasional)
BEGIN;
    UPDATE gis_infrastruktur 
    SET geometry = ST_RemoveRepeatedPoints(geometry, 0.000001) 
    WHERE (ST_NPoints(geometry) - ST_NPoints(ST_RemoveRepeatedPoints(geometry, 0.000001))) > 0;
COMMIT;
-- ROLLBACK; -- (Gunakan jalankan ini jika terjadi kesalahan sebelum COMMIT dijalankan)


-- ====================================================================================
-- 2. PENYAKIT: REDUNDANT VERTICES (COLINEAR) PADA POLIGON
-- Gejala: Terlalu banyak vertex di garis lurus yang membuat render MapLibre berat.
-- ====================================================================================

-- [A] DETEKSI
-- Menggunakan ST_SimplifyPreserveTopology. 
-- Toleransi aman: 0.00005 derajat (sekitar 5 meter).
-- Angka ini cukup kecil sehingga batas pulau atau jalan tidak akan berubah wujud menjadi kotak/patah-patah (hancur),
-- namun cukup besar untuk membersihkan titik-titik yang redundan di satu garis lurus.
SELECT 
    id, 
    properties->>'name' as nama_zona,
    ST_GeometryType(geometry) as tipe_geom,
    ST_NPoints(geometry) as total_vertex_awal,
    ST_NPoints(ST_SimplifyPreserveTopology(geometry, 0.00005)) as total_vertex_disimplifikasi,
    (ST_NPoints(geometry) - ST_NPoints(ST_SimplifyPreserveTopology(geometry, 0.00005))) as vertex_berhasil_dihapus
FROM gis_potensi_investasi
WHERE 
    ST_GeometryType(geometry) IN ('ST_Polygon', 'ST_MultiPolygon')
ORDER BY vertex_berhasil_dihapus DESC;

-- [B] EKSEKUSI
-- Fungsi PreserveTopology memastikan poligon yang bersebelahan tidak tiba-tiba overlap atau bolong.
BEGIN;
    UPDATE gis_potensi_investasi
    SET geometry = ST_SimplifyPreserveTopology(geometry, 0.00005)
    WHERE ST_GeometryType(geometry) IN ('ST_Polygon', 'ST_MultiPolygon');
COMMIT;
-- ROLLBACK;


-- ====================================================================================
-- 3. PENYAKIT: DANGLING LINES & GAPS (JALAN TERPUTUS)
-- Gejala: Ujung garis jalan (node) tidak menyentuh (snapping) dengan tepat ke garis jalan persimpangan lainnya
--         Hal ini bikin routing / rute navigasi terputus secara logika meski terlihat bersatu secara visual.
-- ====================================================================================

-- [A] DETEKSI
-- Deteksi endpoint (ujung jalan) yang berjarak kurang dari 0.00005 derajat (~5 meter) ke jalan lainnya,
-- TAPI secara matematis tidak bersentuhan (ST_Intersects adalah FALSE).
WITH endpoints AS (
    SELECT 
        id, 
        properties->>'name' as nama_jalan, 
        geometry as line_geom,
        ST_StartPoint(geometry) as start_pt,
        ST_EndPoint(geometry) as end_pt
    FROM gis_infrastruktur
    WHERE properties->>'category' = 'Jalan' 
      AND ST_GeometryType(geometry) IN ('ST_LineString')
)
SELECT 
    e1.nama_jalan as jalan_terputus,
    e2.id as jalan_utama_id,
    ST_Distance(e1.end_pt, e2.line_geom) * 111320 as jarak_gap_meter 
    -- Catatan: * 111320 digunakan sebagai estimasi pengkali derajat longitude ke meter di area ekuator.
FROM endpoints e1
JOIN endpoints e2 ON e1.id != e2.id
WHERE 
    ST_DWithin(e1.end_pt, e2.line_geom, 0.00005)
    AND NOT ST_Intersects(e1.end_pt, e2.line_geom);

-- [B] EKSEKUSI PENGUNCIAN (SNAPPING)
-- Hati-hati dengan ST_Snap, ia butuh parameter geom asal, geom referensi, dan radius.
-- Kita set radius snap di 0.00005 derajat (~5 meter).
-- Disarankan memakai pendekatan relasional CTE UPDATE.
BEGIN;
    WITH master_lines AS (
        SELECT ST_Union(geometry) as all_roads
        FROM gis_infrastruktur
        WHERE properties->>'category' = 'Jalan'
    )
    UPDATE gis_infrastruktur 
    SET geometry = ST_Snap(geometry, (SELECT all_roads FROM master_lines), 0.00005)
    WHERE properties->>'category' = 'Jalan';
COMMIT;
-- ROLLBACK;
