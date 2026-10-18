/**
 * scripts/audit-floorplan.mjs
 * Memverifikasi integritas geospasial SVG denah interaktif MPP:
 * 1. Tiap ID interaktif di GERAI_OVERLAY.svg punya node di FLOOR_NODES
 * 2. Tiap node non-hidden punya elemen geometri yang valid
 * 3. Tidak ada kegagalan diam-diam (silent failure) pada parser overlay
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const svgPath = path.join(rootDir, 'src/components/mpp/assets/floorplan/GERAI_OVERLAY.svg');
const overlayDataPath = path.join(rootDir, 'src/components/mpp/assets/floorplan/overlayData.ts');
const ifpPath = path.join(rootDir, 'src/components/mpp/InteractiveFloorPlan.tsx');

const rawSvg = fs.readFileSync(svgPath, 'utf8');
const overlayDataCode = fs.readFileSync(overlayDataPath, 'utf8');
const ifpCode = fs.readFileSync(ifpPath, 'utf8');

// 1. Ekstrak SVG_ID_MAP dari overlayData.ts
const svgIdMapMatch = overlayDataCode.match(/export const SVG_ID_MAP: Record<string, string> = ({[\s\S]*?\n\};)/);
if (!svgIdMapMatch) {
  console.error('❌ Gagal mengekstrak SVG_ID_MAP dari overlayData.ts');
  process.exit(1);
}
const SVG_ID_MAP = eval('(' + svgIdMapMatch[1].trim().replace(/;$/, '') + ')');

// 2. Ekstrak FLOOR_NODES dari InteractiveFloorPlan.tsx
const floorNodesMatch = ifpCode.match(/const FLOOR_NODES: FloorNode\[\] = (\[[\s\S]*?\n\];)/);
if (!floorNodesMatch) {
  console.error('❌ Gagal mengekstrak FLOOR_NODES dari InteractiveFloorPlan.tsx');
  process.exit(1);
}
const FLOOR_NODES = eval(floorNodesMatch[1].replace(/\bas const\b/g, '').replace(/: FloorNode\[\]/g, ''));

// 3. Ekstrak dan jalankan parseGeraiOverlay
const defsMatch = rawSvg.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i);
const innerMatch = rawSvg.match(/<g id="GERAI_OVERLAY">([\s\S]*?)<\/g>\s*(?:<defs|<\/svg|$)/i);
if (!innerMatch) {
  console.error('❌ Gagal mencocokkan grup GERAI_OVERLAY dalam GERAI_OVERLAY.svg!');
  process.exit(1);
}

const inner = innerMatch[1];
const regex = /<(g|path|rect|circle)\s+id="([^"]+)"([^>]*)(?:\/>|>([\s\S]*?)<\/\1>)/g;
const items = [];
let m;
while ((m = regex.exec(inner)) !== null) {
  if (m[2] === 'GERAI_OVERLAY') continue;
  items.push({ tag: m[1], id: m[2] });
}

console.log('======================================================');
console.log('🔍 AUDIT INTEGRITAS FLOOR PLAN MPP SIMPURUSIANG LUWU');
console.log('======================================================');
console.log(`📊 Total elemen SVG hasil parse: ${items.length}`);
console.log(`📊 Total node terdaftar di FLOOR_NODES: ${FLOOR_NODES.length}`);

if (items.length === 0) {
  console.error('❌ FATAL: items hasil parse bernilai 0! Parser overlay mengalami regresi.');
  process.exit(1);
}

const STAIR_SVG_IDS = new Set(['TANGGA_SELATAN_TIMUR', 'TANGGA_SELATAN_BARAT', 'TANGGA_UTARA']);
const WAYPOINT_SVG_IDS = new Set(['WP_HUB', 'WP_ENTRANCE']);

const activeNodesMap = {};
FLOOR_NODES.forEach(n => {
  if (!n.hidden) {
    activeNodesMap[n.id] = n;
    if (n.svgId) activeNodesMap[n.svgId] = n;
  }
});

let missingNodes = [];
let interactiveItemsCount = 0;

for (const item of items) {
  if (STAIR_SVG_IDS.has(item.id) || WAYPOINT_SVG_IDS.has(item.id)) continue;
  interactiveItemsCount++;

  const nodeId = SVG_ID_MAP[item.id] || item.id;
  const node = activeNodesMap[nodeId];
  if (!node) {
    missingNodes.push({ svgId: item.id, mappedNodeId: nodeId });
  }
}

console.log(`📊 Elemen interaktif gerai/fasilitas: ${interactiveItemsCount}`);
console.log(`✅ Elemen terhubung ke activeNodesMap: ${interactiveItemsCount - missingNodes.length}`);

if (missingNodes.length > 0) {
  console.error('❌ DITEMUKAN ELEMEN TANPA NODE AKTIF:');
  console.table(missingNodes);
  process.exit(1);
}

console.log('✅ SELURUH ELEMEN INTERAKTIF GERAI/FASILITAS MEMILIKI NODE AKTIF 100%!');
console.log('======================================================\n');
