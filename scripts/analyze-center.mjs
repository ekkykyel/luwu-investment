import fs from 'node:fs';

const geraiSvg = fs.readFileSync('src/components/mpp/assets/floorplan/GERAI_OVERLAY.svg', 'utf8');
const wallSvg = fs.readFileSync('src/components/mpp/assets/floorplan/DENAH_WALL_LIGHT.svg', 'utf8');

console.log('=== ANALISIS ELEMEN TENGAH DENAH ===');

// Cari semua path atau elemen di GERAI_OVERLAY
const matches = [...geraiSvg.matchAll(/<(g|path|rect|circle)\s+id="([^"]+)"([^>]*)/g)];
console.log('Elemen gerai dengan koordinat di area tengah (x: 1600-2200, y: 600-1500):');
for (const m of matches) {
  const id = m[2];
  const str = m[0];
  // Cari angka-angka
  const nums = str.match(/[0-9.]+/g);
  if (nums) {
    // cek apakah ada koordinat relevan
  }
}

// Mari kita periksa wayfindingRoute calculation di InteractiveFloorPlan.tsx
const ifp = fs.readFileSync('src/components/mpp/InteractiveFloorPlan.tsx', 'utf8');
const spineMatch = ifp.match(/mainSpine = `([^`]+)`/);
if (spineMatch) {
  console.log('Existing mainSpine:', spineMatch[1]);
}
