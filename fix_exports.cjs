const fs = require('fs');
let code = fs.readFileSync('src/components/PortalMPP.tsx', 'utf8');

code = code.replace(
  /\/\/ --- Data Instansi Tergabung \(19 Instansi Resmi MPP Simpurusiang - Multi-Bahasa\) ---\nexport const liveAgencies: InstansiItem\[\] = LOCALIZED_AGENCIES;\nexport const instansiTergabung = liveAgencies;\n\/\/ --- Data Ulasan Masyarakat \(MPP Simpurusiang Kab\. Luwu - Multi-Bahasa\) ---\nexport const liveReviews = LOCALIZED_REVIEWS;\nexport const liveReviews = liveReviews;\n\/\/ --- Data Berita & Pengumuman \(Kosong jika belum ada data dari DB\) ---\nexport const dummyDataBerita: any\[\] = \[\];/,
  `// --- Data Berita & Pengumuman (Kosong jika belum ada data dari DB) ---\nexport const dummyDataBerita: any[] = [];`
);

fs.writeFileSync('src/components/PortalMPP.tsx', code);
console.log('fixed exports');
