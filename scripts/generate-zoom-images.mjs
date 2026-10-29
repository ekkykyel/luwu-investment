import fs from 'node:fs';
import path from 'node:path';

const routesData = JSON.parse(fs.readFileSync('src/components/mpp/assets/floorplan/evacuationRoutesData.json', 'utf8'));
const fullSvg = fs.readFileSync('public/assets/evac_routes_verification.svg', 'utf8');

// ViewBox per rute untuk zoom 3x
const ZOOM_AREAS = {
  utara: { name: 'Rute Utara (Barat)', vb: '500 500 1600 1000' },
  selatan: { name: 'Rute Selatan (Timur)', vb: '1800 600 1500 1000' },
  utama: { name: 'Rute Utama (Selatan)', vb: '1600 700 800 1400' },
  hub: { name: 'Titik Kumpul & Air Mancur', vb: '1400 600 1100 600' }
};

for (const [key, area] of Object.entries(ZOOM_AREAS)) {
  const zoomSvg = fullSvg.replace(/viewBox="0 0 3646 2497"/, `viewBox="${area.vb}"`);
  const zoomPath = path.resolve(`public/assets/evac_zoom_${key}.svg`);
  fs.writeFileSync(zoomPath, zoomSvg, 'utf8');
  console.log(`Zoom SVG [${area.name}] tersimpan di: ${zoomPath}`);
}
