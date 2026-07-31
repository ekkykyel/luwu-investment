const fs = require('fs');

function updateLocale(file, learnPotential, pengaduan) {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  content.nav.learnPotential = learnPotential;
  content.nav.pengaduan = pengaduan;
  fs.writeFileSync(file, JSON.stringify(content, null, 2));
}

updateLocale('src/locales/id.json', 'Simulasi Potensi', 'Pengaduan Masyarakat');
updateLocale('src/locales/en.json', 'Potential Simulation', 'Public Complaints');
updateLocale('src/locales/zh.json', '潜力模拟', '社会投诉');

console.log('Locales updated');
