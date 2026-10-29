/**
 * scripts/investigate-doors.mjs
 * Menganalisis bukaan pintu dan dinding pada denah vektor MPP Luwu
 */

import fs from 'node:fs';
import path from 'node:path';

const wallSvgPath = 'src/components/mpp/assets/floorplan/DENAH_WALL_LIGHT.svg';
const geraiSvgPath = 'src/components/mpp/assets/floorplan/GERAI_OVERLAY.svg';

const wallContent = fs.readFileSync(wallSvgPath, 'utf8');
const geraiContent = fs.readFileSync(geraiSvgPath, 'utf8');

console.log('=== INVESTIGASI BUKAAN PINTU DENAH MPP ===');

// Cari elemen gerai di GERAI_OVERLAY.svg
const geraiMatches = [...geraiContent.matchAll(/<(g|path|rect|circle)\s+id="([^"]+)"([^>]*)/g)];
console.log(`Total gerai/fasilitas di overlay: ${geraiMatches.length}`);

// Periksa elemen PINTU_MASUK
const pintuMasukMatch = geraiContent.match(/<rect\s+id="PINTU_MASUK"\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"/);
if (pintuMasukMatch) {
  const x = parseFloat(pintuMasukMatch[1]);
  const y = parseFloat(pintuMasukMatch[2]);
  const w = parseFloat(pintuMasukMatch[3]);
  const h = parseFloat(pintuMasukMatch[4]);
  console.log(`[PINTU UTAMA - SELATAN TENGAH]`);
  console.log(`- ID: PINTU_MASUK`);
  console.log(`- x: ${x} .. ${x + w} (lebar: ${w})`);
  console.log(`- y: ${y} .. ${y + h}`);
  console.log(`- Titik tengah usulan: (${x + w / 2}, ${y})`);
}

// Cari gerai atau elemen dekat dinding barat (x < 900, y antara 700 - 1300)
console.log('\n--- ELEMEN DI SEKITAR DINDING BARAT (SISI UTARA/KIRI) ---');
for (const m of geraiMatches) {
  const id = m[2];
  const tag = m[1];
  const attrs = m[3];
  if (id.includes('TANGGA_UTARA') || id.includes('TOILET') || id.includes('SMOKING') || id.includes('GUDANG')) {
    console.log(`ID: ${id} (${tag}) -> ${attrs.slice(0, 100)}...`);
  }
}

// Cari gerai atau elemen dekat dinding timur (x > 2900, y antara 700 - 1500)
console.log('\n--- ELEMEN DI SEKITAR DINDING TIMUR (SISI SELATAN/KANAN) ---');
for (const m of geraiMatches) {
  const id = m[2];
  const tag = m[1];
  const attrs = m[3];
  if (id.includes('TANGGA_SELATAN') || id.includes('MUSHALLA') || id.includes('RUANG_BACA') || id.includes('RUANG_RAPAT')) {
    console.log(`ID: ${id} (${tag}) -> ${attrs.slice(0, 100)}...`);
  }
}
