node -e "
const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard/MasyarakatDashboard.tsx', 'utf8');

content = content.replace('{ id: \"Pengaduan\", label: \"Pengaduan\", sub: \"Pelanggaran/Aduan\", color: \"red\" },', '{ id: \"Pengaduan\", label: \"Pengaduan\", color: \"red\" },');
content = content.replace('{ id: \"Aspirasi\", label: \"Aspirasi\", sub: \"Saran & Masukan\", color: \"blue\" },', '{ id: \"Aspirasi\", label: \"Aspirasi\", color: \"blue\" },');
content = content.replace('{ id: \"Permintaan Informasi\", label: \"Informasi\", sub: \"Syarat/RTRW\", color: \"emerald\" },', '{ id: \"Permintaan Informasi\", label: \"Informasi\", color: \"emerald\" },');

fs.writeFileSync('src/components/Dashboard/MasyarakatDashboard.tsx', content);
console.log('patched labels');
"
