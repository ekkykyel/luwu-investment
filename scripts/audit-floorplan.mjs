#!/usr/bin/env node
/**
 * scripts/audit-floorplan.mjs
 * Dev-only audit script for MPP Simpurusiang interactive floor plan assets & data consistency.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgPathBbox } from 'svg-path-bbox';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DENAH_PATH = path.join(rootDir, 'src/components/mpp/assets/floorplan/DENAH_VEKTOR.min.svg');
const OVERLAY_PATH = path.join(rootDir, 'src/components/mpp/assets/floorplan/GERAI_OVERLAY.svg');
const FLOORPLAN_CODE_PATH = path.join(rootDir, 'src/components/mpp/InteractiveFloorPlan.tsx');
const OVERLAY_DATA_PATH = path.join(rootDir, 'src/components/mpp/assets/floorplan/overlayData.ts');

function runAudit() {
  console.log('='.repeat(80));
  console.log(' AUDIT ASET & GEOMETRI FLOORPLAN MPP SIMPURUSIANG (FASE 0 — SOP-D)');
  console.log('='.repeat(80));

  if (!fs.existsSync(DENAH_PATH) || !fs.existsSync(OVERLAY_PATH)) {
    console.error('FATAL: File denah atau overlay tidak ditemukan!');
    process.exit(1);
  }

  const denahContent = fs.readFileSync(DENAH_PATH, 'utf8');
  const overlayContent = fs.readFileSync(OVERLAY_PATH, 'utf8');
  const floorplanCode = fs.readFileSync(FLOORPLAN_CODE_PATH, 'utf8');

  // =========================================================================
  // a) VIEWBOX KEDUA SVG & SELISIHYA
  // =========================================================================
  console.log('\n[0.2.a] VIEWBOX KEDUA SVG & SELISIHNYA:');
  const denahVbMatch = denahContent.match(/viewBox="([^"]+)"/);
  const overlayVbMatch = overlayContent.match(/viewBox="([^"]+)"/);

  const denahVb = denahVbMatch ? denahVbMatch[1].split(/\s+/).map(Number) : [0, 0, 0, 0];
  const overlayVb = overlayVbMatch ? overlayVbMatch[1].split(/\s+/).map(Number) : [0, 0, 0, 0];

  console.log(`- DENAH_VEKTOR.min.svg : viewBox="${denahVb.join(' ')}" (W: ${denahVb[2]}, H: ${denahVb[3]})`);
  console.log(`- GERAI_OVERLAY.svg    : viewBox="${overlayVb.join(' ')}" (W: ${overlayVb[2]}, H: ${overlayVb[3]})`);

  const deltaW = denahVb[2] - overlayVb[2];
  const deltaH = denahVb[3] - overlayVb[3];
  const pctW = ((deltaW / overlayVb[2]) * 100).toFixed(4);
  const pctH = ((deltaH / overlayVb[3]) * 100).toFixed(4);

  console.log(`- Selisih (Delta)      : ΔWidth = ${deltaW > 0 ? '+' : ''}${deltaW}px (${pctW}%), ΔHeight = ${deltaH > 0 ? '+' : ''}${deltaH}px (${pctH}%)`);
  console.log(`  -> Rekomendasi 2.1: Selaraskan viewBox GERAI_OVERLAY ke "0 0 3646 2497" agar 1:1 identik tanpa distorsi.`);

  // =========================================================================
  // b) SEMUA ID GRUP DI #GERAI_OVERLAY + BBOX + LEBAR/TINGGI
  // =========================================================================
  console.log('\n[0.2.b] SEMUA ELEMEN / GRUP DI #GERAI_OVERLAY + BBOX + LEBAR/TINGGI:');

  const innerMatch = overlayContent.match(/<g id="GERAI_OVERLAY">([\s\S]*?)<\/g>\s*(?:<defs>|$)/);
  if (!innerMatch) {
    console.error('FATAL: <g id="GERAI_OVERLAY"> tidak ditemukan dalam GERAI_OVERLAY.svg');
    process.exit(1);
  }
  const innerSvg = innerMatch[1];

  // Regex top-level elements inside <g id="GERAI_OVERLAY">
  const topElemRegex = /<([a-zA-Z0-9]+)\s+id="([^"]+)"([^>]*)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  let match;
  const overlayElements = [];

  function getElementBBox(tag, attrs, innerBody = '') {
    if (tag === 'rect') {
      const x = Number(attrs.match(/\bx="([^"]+)"/)?.[1] || 0);
      const y = Number(attrs.match(/\by="([^"]+)"/)?.[1] || 0);
      const w = Number(attrs.match(/\bwidth="([^"]+)"/)?.[1] || 0);
      const h = Number(attrs.match(/\bheight="([^"]+)"/)?.[1] || 0);
      return { minX: x, minY: y, maxX: x + w, maxY: y + h, x, y, w, h };
    }
    if (tag === 'circle') {
      const cx = Number(attrs.match(/\bcx="([^"]+)"/)?.[1] || 0);
      const cy = Number(attrs.match(/\bcy="([^"]+)"/)?.[1] || 0);
      const r = Number(attrs.match(/\br="([^"]+)"/)?.[1] || 0);
      return { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r, x: cx - r, y: cy - r, w: 2 * r, h: 2 * r };
    }
    if (tag === 'path') {
      const d = attrs.match(/\bd="([^"]+)"/)?.[1];
      if (d) {
        const [minX, minY, maxX, maxY] = svgPathBbox(d);
        return { minX, minY, maxX, maxY, x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      }
    }
    if (tag === 'g') {
      // Find all child paths, rects, circles inside <g>
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let foundChild = false;

      // Child paths
      const childPaths = [...innerBody.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*>/g)];
      for (const cp of childPaths) {
        const [pMinX, pMinY, pMaxX, pMaxY] = svgPathBbox(cp[1]);
        minX = Math.min(minX, pMinX);
        minY = Math.min(minY, pMinY);
        maxX = Math.max(maxX, pMaxX);
        maxY = Math.max(maxY, pMaxY);
        foundChild = true;
      }

      // Child rects
      const childRects = [...innerBody.matchAll(/<rect\b([^>]*)\/?>/g)];
      for (const cr of childRects) {
        const rAttrs = cr[1];
        const rx = Number(rAttrs.match(/\bx="([^"]+)"/)?.[1] || 0);
        const ry = Number(rAttrs.match(/\by="([^"]+)"/)?.[1] || 0);
        const rw = Number(rAttrs.match(/\bwidth="([^"]+)"/)?.[1] || 0);
        const rh = Number(rAttrs.match(/\bheight="([^"]+)"/)?.[1] || 0);
        minX = Math.min(minX, rx);
        minY = Math.min(minY, ry);
        maxX = Math.max(maxX, rx + rw);
        maxY = Math.max(maxY, ry + rh);
        foundChild = true;
      }

      // Child circles
      const childCircles = [...innerBody.matchAll(/<circle\b([^>]*)\/?>/g)];
      for (const cc of childCircles) {
        const cAttrs = cc[1];
        const cx = Number(cAttrs.match(/\bcx="([^"]+)"/)?.[1] || 0);
        const cy = Number(cAttrs.match(/\bcy="([^"]+)"/)?.[1] || 0);
        const r = Number(cAttrs.match(/\br="([^"]+)"/)?.[1] || 0);
        minX = Math.min(minX, cx - r);
        minY = Math.min(minY, cy - r);
        maxX = Math.max(maxX, cx + r);
        maxY = Math.max(maxY, cy + r);
        foundChild = true;
      }

      if (foundChild) {
        return { minX, minY, maxX, maxY, x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      }
    }
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, x: 0, y: 0, w: 0, h: 0 };
  }

  while ((match = topElemRegex.exec(innerSvg)) !== null) {
    const tag = match[1];
    const id = match[2];
    const attrs = match[3];
    const body = match[4] || '';
    const bbox = getElementBBox(tag, attrs, body);
    overlayElements.push({ id, tag, attrs, body, bbox });
  }

  console.log(`Total elemen top-level di #GERAI_OVERLAY: ${overlayElements.length} elemen\n`);
  console.log('| No | ID Overlay | Tag | X | Y | Width | Height | Centroid (CX, CY) |');
  console.log('|---|---|---|---|---|---|---|---|');
  overlayElements.forEach((el, idx) => {
    const cx = (el.bbox.x + el.bbox.w / 2).toFixed(1);
    const cy = (el.bbox.y + el.bbox.h / 2).toFixed(1);
    console.log(`| ${(idx + 1).toString().padStart(2, ' ')} | ${el.id.padEnd(22, ' ')} | ${el.tag.padEnd(6, ' ')} | ${el.bbox.x.toFixed(1).padStart(7, ' ')} | ${el.bbox.y.toFixed(1).padStart(7, ' ')} | ${el.bbox.w.toFixed(1).padStart(7, ' ')} | ${el.bbox.h.toFixed(1).padStart(7, ' ')} | (${cx}, ${cy}) |`);
  });

  // =========================================================================
  // c) ID OVERLAY YANG TIDAK PUNYA NODE, DAN NODE TANPA OVERLAY (HIDDEN)
  // =========================================================================
  console.log('\n[0.2.c] AUDIT KONSISTENSI DATA & PEMETAAN:');

  // Parse FLOOR_NODES
  const startIdx = floorplanCode.indexOf('const FLOOR_NODES');
  const startBracket = floorplanCode.indexOf('= [', startIdx) + 2;
  const dkesIdx = floorplanCode.indexOf('"DINAS_KESEHATAN"', startIdx);
  const endBracket = floorplanCode.indexOf('\n];', dkesIdx) + 2;
  const nodesJson = floorplanCode.substring(startBracket, endBracket);
  const floorNodes = JSON.parse(nodesJson);

  // Read SVG_ID_MAP from overlayData.ts
  const overlayDataCode = fs.readFileSync(OVERLAY_DATA_PATH, 'utf8');
  const mapStart = overlayDataCode.indexOf('export const SVG_ID_MAP: Record<string, string> = {');
  const mapEnd = overlayDataCode.indexOf('};', mapStart);
  const mapObjStr = overlayDataCode.substring(mapStart + 'export const SVG_ID_MAP: Record<string, string> ='.length, mapEnd + 1);
  const svgIdMap = eval(`(${mapObjStr})`);

  const overlayIdSet = new Set(overlayElements.map(e => e.id));
  const nodeMap = new Map();
  floorNodes.forEach(n => {
    nodeMap.set(n.id, n);
    if (n.svgId) nodeMap.set(n.svgId, n);
  });

  // Overlay IDs not mapped to FLOOR_NODES
  const unmappedOverlayIds = [];
  overlayElements.forEach(el => {
    const mappedNodeId = svgIdMap[el.id];
    const hasNode = mappedNodeId ? nodeMap.has(mappedNodeId) : nodeMap.has(el.id);
    if (!hasNode) {
      unmappedOverlayIds.push(el.id);
    }
  });

  console.log(`\n1. ID Overlay TANPA representasi di FLOOR_NODES (${unmappedOverlayIds.length}):`);
  if (unmappedOverlayIds.length === 0) {
    console.log('   (Nihil - Seluruh ID overlay terpetakan, termasuk elemen non-interaktif GUDANG & DUKCAPIL_SERVER)');
  } else {
    unmappedOverlayIds.forEach(id => console.log(`   - ${id}`));
  }

  // Nodes in FLOOR_NODES without overlay element (hidden)
  const nodesWithoutOverlay = [];
  floorNodes.forEach(n => {
    const directOverlay = overlayIdSet.has(n.id) || (n.svgId && overlayIdSet.has(n.svgId));
    // Check reverse map in svgIdMap
    const reverseMappedSvgId = Object.entries(svgIdMap).find(([sId, nId]) => nId === n.id)?.[0];
    const hasOverlay = directOverlay || (reverseMappedSvgId && overlayIdSet.has(reverseMappedSvgId));
    if (!hasOverlay) {
      nodesWithoutOverlay.push({
        id: n.id,
        name: n.name,
        hidden: !!n.hidden,
        category: n.category
      });
    }
  });

  console.log(`\n2. Node di FLOOR_NODES TANPA elemen di GERAI_OVERLAY (${nodesWithoutOverlay.length}):`);
  nodesWithoutOverlay.forEach(n => {
    console.log(`   - [${n.id}] ${n.name} | category: ${n.category} | hidden: ${n.hidden}`);
  });

  // Check Casing duplicates & inconsistencies
  console.log('\n3. Analisis Konsistensi Penamaan & Huruf Besar/Kecil (Casing Inconsistency):');
  const casingIssues = [];
  floorNodes.forEach(n => {
    const upper = n.id.toUpperCase();
    if (n.id !== upper && /^[A-Z0-9_]+$/.test(n.id) === false) {
      casingIssues.push(`Node id: "${n.id}" menggunakan lower/camel/mixed case -> calon normalisasi: "${upper}"`);
    }
  });
  console.log(`   Ditemukan ${casingIssues.length} id node di kode yang belum UPPER_SNAKE_CASE:`);
  casingIssues.slice(0, 10).forEach(iss => console.log(`   - ${iss}`));
  if (casingIssues.length > 10) console.log(`   - ... dan ${casingIssues.length - 10} lainnya`);

  // =========================================================================
  // d) HITUNGAN TURUNAN: JUMLAH GERAI, JUMLAH INSTANSI UNIK, TERPETAKAN VS BELUM
  // =========================================================================
  console.log('\n[0.2.d] HITUNGAN TURUNAN INSTANSI & GERAI:');

  const counterNodes = floorNodes.filter(n => n.category === 'counter');
  const facilityNodes = floorNodes.filter(n => n.category === 'facility');
  const disabilityNodes = floorNodes.filter(n => n.category === 'disability');

  console.log(`- Total Node di FLOOR_NODES    : ${floorNodes.length}`);
  console.log(`  * Counter (Gerai Layanan)    : ${counterNodes.length}`);
  console.log(`  * Facility (Fasilitas Umum)  : ${facilityNodes.length}`);
  console.log(`  * Disability (Prioritas)     : ${disabilityNodes.length}`);

  // Hitung instansi unik pada gerai:
  // DPMPTSP_1 dan DPMPTSP_2 dihitung 1 instansi (DPMPTSP)
  // DUKCAPIL_1, DUKCAPIL_2, DUKCAPIL_3 dihitung 1 instansi (DUKCAPIL)
  const agencySet = new Set();
  const agencyBreakdown = [];

  counterNodes.forEach(n => {
    let agencyKey = n.id;
    if (agencyKey.startsWith('DPMPTSP')) agencyKey = 'DPMPTSP';
    else if (agencyKey.startsWith('DUKCAPIL')) agencyKey = 'DUKCAPIL';
    else if (agencyKey === 'NAKERTRANS' || agencyKey === 'DISNAKERTANS') agencyKey = 'NAKERTRANS';
    else if (agencyKey === 'SULSELBAR' || agencyKey === 'BPD_SULSELBAR') agencyKey = 'BPD_SULSELBAR';
    else if (agencyKey === 'BPJS_KET' || agencyKey === 'BPJS_KETENAGAKERJAAN') agencyKey = 'BPJS_KETENAGAKERJAAN';
    else if (agencyKey === 'BPJS_KES' || agencyKey === 'BPJS_KESEHATAN') agencyKey = 'BPJS_KESEHATAN';
    else if (agencyKey === 'DINSOS' || agencyKey === 'DINAS_SOSIAL') agencyKey = 'DINAS_SOSIAL';
    else if (agencyKey === 'KEJARI' || agencyKey === 'KEJAKSAAN_NEGERI') agencyKey = 'KEJAKSAAN_NEGERI';
    else if (agencyKey === 'PUPTR' || agencyKey === 'DINAS_PUPTR') agencyKey = 'DINAS_PUPTR';
    else if (agencyKey === 'KOMINFO' || agencyKey === 'DINAS_KOMINFO') agencyKey = 'DINAS_KOMINFO';
    else if (agencyKey === 'PERIKANAN' || agencyKey === 'DINAS_PERIKANAN') agencyKey = 'DINAS_PERIKANAN';

    agencySet.add(agencyKey);
    agencyBreakdown.push({ nodeId: n.id, agencyKey, name: n.name, hidden: !!n.hidden });
  });

  const mappedCounters = counterNodes.filter(n => !n.hidden);
  const unmappedCounters = counterNodes.filter(n => !!n.hidden);

  console.log(`- Jumlah Gerai (Kategori Counter): ${counterNodes.length} gerai`);
  console.log(`  * Terpetakan di denah (memiliki geometri SVG) : ${mappedCounters.length} gerai`);
  console.log(`  * Belum terpetakan di denah (hidden: true)    : ${unmappedCounters.length} gerai (${unmappedCounters.map(c => c.id).join(', ')})`);
  console.log(`- Jumlah Instansi Unik (Counter): ${agencySet.size} instansi unik`);
  console.log(`  Daftar Instansi Unik: ${[...agencySet].sort().join(', ')}`);

  // =========================================================================
  // e) ELEMEN OVERLAY DENGAN OPACITY, FILTER, MIX-BLEND-MODE, ATAU FILL NON-BLACK
  // =========================================================================
  console.log('\n[0.2.e] AUDIT ATRIBUT OVERLAY (opacity, filter, mix-blend-mode, fill non-black):');

  const visualAttributeIssues = [];

  overlayElements.forEach(el => {
    const rawAll = el.attrs + ' ' + el.body;
    const issues = [];

    // opacity
    const opMatch = rawAll.match(/\bopacity="([^"]+)"/) || rawAll.match(/style="[^"]*opacity\s*:\s*([^;"]+)/);
    if (opMatch) issues.push(`opacity="${opMatch[1]}"`);

    // filter
    const filtMatch = rawAll.match(/\bfilter="([^"]+)"/) || rawAll.match(/style="[^"]*filter\s*:\s*([^;"]+)/);
    if (filtMatch) issues.push(`filter="${filtMatch[1]}"`);

    // mix-blend-mode
    const blendMatch = rawAll.match(/\bmix-blend-mode="([^"]+)"/) || rawAll.match(/style="[^"]*mix-blend-mode\s*:\s*([^;"]+)/);
    if (blendMatch) issues.push(`mix-blend-mode="${blendMatch[1]}"`);

    // fill selain black, none, transparent
    const fills = [...rawAll.matchAll(/fill="([^"]+)"/g)].map(m => m[1]);
    const abnormalFills = fills.filter(f => f !== 'black' && f !== 'none' && f !== 'transparent');
    if (abnormalFills.length > 0) {
      issues.push(`abnormal fill: [${[...new Set(abnormalFills)].join(', ')}]`);
    }

    if (issues.length > 0) {
      visualAttributeIssues.push({ id: el.id, tag: el.tag, issues });
    }
  });

  console.log(`Ditemukan ${visualAttributeIssues.length} elemen overlay dengan atribut non-standar:`);
  visualAttributeIssues.forEach((item, i) => {
    console.log(`  ${i + 1}. [${item.id}] (${item.tag}) -> ${item.issues.join('; ')}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(' AUDIT SELESAI (EXIT CODE 0)');
  console.log('='.repeat(80));
}

runAudit();
