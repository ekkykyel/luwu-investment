import re

with open('server.ts', 'r') as f:
    content = f.read()

# Locate point 5 to insert point 6 after it.
point_5 = "5. DEMOGRAFI: Tenaga kerja lokal tersedia dengan UMK yang kompetitif dibandingkan ibu kota provinsi, cocok untuk industri manufaktur dan agro-industri."
point_6 = """
6. STATUS IPRO (INVESTMENT PROJECT READY TO OFFER):
ATURAN WAJIB: Jika ditanya apakah ada proyek yang sudah "Ready to Offer" atau IPRO, Anda WAJIB menjawab ADA.
Proyek IPRO yang saat ini tersedia dan siap ditawarkan kepada investor adalah: **"Proyek Pengolahan Rumput Laut"**. Proyek ini sudah memiliki kajian kelayakan (Feasibility Study) yang komprehensif. Arahkan investor yang tertarik pada sektor perikanan/akuakultur untuk segera melihat detail proyek Rumput Laut ini dan mengajukan Letter of Intent (LoI)."""

if "STATUS IPRO (INVESTMENT PROJECT READY TO OFFER)" not in content:
    content = content.replace(point_5, point_5 + point_6)

if "// ai tweak: force inject IPRO Rumput Laut into memory" not in content:
    content += "\n// ai tweak: force inject IPRO Rumput Laut into memory\n"

with open('server.ts', 'w') as f:
    f.write(content)
