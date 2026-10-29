import fs from 'node:fs';

const content = fs.readFileSync('src/components/mpp/assets/floorplan/DENAH_WALL_LIGHT.svg', 'utf8');

// Ekstrak d attribute
const dMatch = content.match(/d="([^"]+)"/);
if (!dMatch) {
  console.log('No d attribute found');
  process.exit(1);
}

const d = dMatch[1];
console.log('Total d length:', d.length);

// Ekstrak segmen-segmen dan cari koordinat di rentang y: 700-1250, x: 600-850 dan x: 2950-3250
// Mengurai perintah svg path secara numerik sederhana
const tokens = d.match(/([a-df-z]|[-+]?[0-9]*\.?[0-9]+)/gi);
console.log('Total tokens:', tokens ? tokens.length : 0);

// Mari kita cari kemunculan koordinat di teks asli d
console.log('\n--- MENCARI SEGMEN DI SEKITAR DINDING BARAT (x 650-800, y 750-850) ---');
const regexWest = /([MLHVCSQTAZmlhvcsqtaz])?\s*([0-9.]+)\s+([0-9.]+)/g;
// Atau cari koordinat eksplisit
const findCoordinatesNear = (targetX, targetY, toleranceX, toleranceY) => {
  const matches = [];
  let currCmd = '';
  let cx = 0, cy = 0;
  // Mari kita telusuri string untuk pola angka
  const regex = /([0-9.]+)\s+([0-9.]+)/g;
  let m;
  while ((m = regex.exec(d)) !== null) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    if (Math.abs(x - targetX) <= toleranceX && Math.abs(y - targetY) <= toleranceY) {
      matches.push({ x, y, index: m.index, snippet: d.substring(Math.max(0, m.index - 30), Math.min(d.length, m.index + 50)) });
    }
  }
  return matches;
};

console.log('Koordinat sekitar x=718, y=793:');
console.log(findCoordinatesNear(718, 793, 100, 100).slice(0, 5));

console.log('Koordinat sekitar x=3162, y=1143:');
console.log(findCoordinatesNear(3162, 1143, 100, 100).slice(0, 5));

console.log('Koordinat sekitar x=1928, y=1996:');
console.log(findCoordinatesNear(1928, 1996, 100, 100).slice(0, 5));
