import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseGeraiOverlay, SVG_ID_MAP } from '../src/components/mpp/assets/floorplan/overlayData';

describe('GERAI_OVERLAY Parser & Integrity Suite (Gate 1.3)', () => {
  const svgPath = path.resolve(__dirname, '../src/components/mpp/assets/floorplan/GERAI_OVERLAY.svg');
  const rawSvg = fs.readFileSync(svgPath, 'utf8');
  const { defs, items } = parseGeraiOverlay(rawSvg);

  const STAIR_IDS = new Set(['TANGGA_SELATAN_TIMUR', 'TANGGA_SELATAN_BARAT', 'TANGGA_UTARA']);
  const WAYPOINT_IDS = new Set(['WP_HUB', 'WP_ENTRANCE']);

  const interactiveItems = items.filter(
    item => !STAIR_IDS.has(item.id) && !WAYPOINT_IDS.has(item.id)
  );

  it('(i) jumlah grup interaktif = jumlah id yang diharapkan (41 gerai/fasilitas + 5 sistem = 46 total)', () => {
    expect(items.length).toBe(46);
    expect(interactiveItems.length).toBe(41);
  });

  it('(ii) tidak ada anak interaktif dengan fill none efektif', () => {
    interactiveItems.forEach(item => {
      // Elemen mandiri (path / rect / circle) tidak boleh memiliki fill="none"
      if (item.tag === 'path' || item.tag === 'rect' || item.tag === 'circle') {
        expect(item.innerHtml).not.toMatch(/fill\s*=\s*["']none["']/i);
      }
      // Konten SVG child tidak boleh mengandung fill="none"
      if (item.innerHtml) {
        const matches = item.innerHtml.match(/<path[^>]*fill\s*=\s*["']none["'][^>]*>/gi);
        expect(matches).toBeNull();
      }
    });
  });

  it('(iii) tidak ada opacity 0.4 / filter / mix-blend-mode tersisa pada innerHtml', () => {
    items.forEach(item => {
      expect(item.innerHtml).not.toMatch(/\bopacity\s*=\s*["']0\.4["']/i);
      expect(item.innerHtml).not.toMatch(/\bfilter\s*=\s*["']url\(#filter/i);
      expect(item.innerHtml).not.toMatch(/mix-blend-mode/i);
    });
  });

  it('(iv) data-overlay-id tetap sama dengan id asli SVG', () => {
    items.forEach(item => {
      expect(item.id).toBeDefined();
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      
      const isRecognized =
        SVG_ID_MAP[item.id] !== undefined ||
        STAIR_IDS.has(item.id) ||
        WAYPOINT_IDS.has(item.id);
      expect(isRecognized).toBe(true);
    });
  });
});
