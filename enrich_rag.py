import re

with open('server.ts', 'r') as f:
    content = f.read()

knowledge_base = """
[KNOWLEDGE BASE - KABUPATEN LUWU 2026]
Anda adalah Konsultan Investasi Resmi DPMPTSP Kabupaten Luwu. Gunakan data berikut sebagai referensi utama:
1. INFRASTRUKTUR UTAMA: Bandara Bua (Lagaligo) untuk logistik udara, Pelabuhan Tanjung Ringgit untuk kargo laut/ekspor, dan Jalan Trans Sulawesi.
2. SEKTOR UNGGULAN: 
   - Pertanian/Perkebunan: Kakao (Sentra di Noling, Bua Ponrang), Cengkeh, Sagu, dan Padi.
   - Perikanan: Tambak Udang Vaname dan Bandeng di wilayah pesisir (Bua, Ponrang, Suli).
   - Pertambangan & Smelter: Zona industri smelter difokuskan di wilayah tertentu dengan regulasi ketat AMDAL.
3. REGULASI TATA RUANG (RTRW): Pembangunan pabrik/industri besar wajib berada di Zona Industri yang telah ditetapkan Perda. Kawasan pesisir memiliki sempadan pantai yang harus dilindungi.
4. INSENTIF PEMDA: Pemkab Luwu memberikan kemudahan perizinan (Fast-track OSS-RBA), pendampingan mediasi lahan (Clean and Clear), dan potensi keringanan retribusi daerah untuk investasi padat karya (menyerap >500 tenaga kerja lokal).
5. DEMOGRAFI: Tenaga kerja lokal tersedia dengan UMK yang kompetitif dibandingkan ibu kota provinsi, cocok untuk industri manufaktur dan agro-industri.

"""

if "[KNOWLEDGE BASE - KABUPATEN LUWU 2026]" not in content:
    content = content.replace("[PANDUAN NAVIGASI SPASIAL INTERAKTIF]", knowledge_base + "[PANDUAN NAVIGASI SPASIAL INTERAKTIF]")

if "// ai upgrade: enriched luwu rag knowledge base" not in content:
    content += "\n// ai upgrade: enriched luwu rag knowledge base\n"

with open('server.ts', 'w') as f:
    f.write(content)
