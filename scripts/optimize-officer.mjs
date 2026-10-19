import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'public', 'images', 'mpp');

// Source & License Attribution:
// Sumber: Dokumentasi Visual Petugas Front Office DPMPTSP MPP Simpurusiang Kab. Luwu (Self-Hosted Pemkab Luwu, Hak Cipta DPMPTSP Kab. Luwu 2026, Lisensi Internal Pemkab Luwu).

const OFFICERS = [
  {
    key: 'officer-left',
    src: path.join(outputDir, 'officer-left-raw.jpg'),
    baseName: 'officer-left',
    title: 'Petugas Front Office DPMPTSP MPP Simpurusiang (Kiri)',
  },
  {
    key: 'officer-right',
    src: path.join(outputDir, 'officer-right-raw.jpg'),
    baseName: 'officer-right',
    title: 'Petugas Front Office DPMPTSP MPP Simpurusiang (Kanan)',
  },
];

const TARGET_WIDTHS = [320, 480, 640, 800];

async function run() {
  console.log('====================================================');
  console.log('🚀 OPTIMIZING FRONT OFFICE STAFF PHOTOS (4:5 RATIO)');
  console.log('====================================================');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const metadataOutput = {};

  for (const officer of OFFICERS) {
    if (!fs.existsSync(officer.src)) {
      console.warn(`[WARN] Source file not found: ${officer.src}`);
      continue;
    }

    const originalStats = fs.statSync(officer.src);
    const meta = await sharp(officer.src).metadata();

    console.log(`\n📸 Processing: ${officer.baseName} (${(originalStats.size / 1024).toFixed(1)} KB, ${meta.width}x${meta.height})`);

    // Target 4:5 aspect ratio master crop: 800w x 1000h
    // Center-crop on face/upper body
    const cropWidth = 800;
    const cropHeight = 1000;
    const leftOffset = Math.max(0, Math.floor((meta.width - cropWidth) / 2));
    const topOffset = Math.max(0, Math.floor((meta.height - cropHeight) * 0.35)); // slightly prioritize upper body/face

    const masterBuffer = await sharp(officer.src)
      .extract({ left: leftOffset, top: topOffset, width: cropWidth, height: cropHeight })
      .toBuffer();

    // 1. Dominant Color & LQIP (<= 1.5 KB base64)
    const masterImage = sharp(masterBuffer);
    const stats = await masterImage.stats();
    const dominantRgb = stats.dominant;
    const dominantHex = `#${((1 << 24) + (dominantRgb.r << 16) + (dominantRgb.g << 8) + dominantRgb.b).toString(16).slice(1)}`;

    const lqipBuffer = await sharp(masterBuffer)
      .resize(24, 30, { fit: 'cover' })
      .webp({ quality: 20 })
      .toBuffer();
    const lqipBase64 = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

    console.log(`  - Dominant color: ${dominantHex}`);
    console.log(`  - LQIP size: ${lqipBuffer.length} bytes (Base64 length: ${lqipBase64.length})`);

    metadataOutput[officer.key] = {
      key: officer.key,
      title: officer.title,
      dominantColor: dominantHex,
      lqip: lqipBase64,
      aspectRatio: '0.8000',
      width: 480,
      height: 600,
      variants: {},
    };

    // 2. Generate variants for 320, 480, 640, 800
    for (const width of TARGET_WIDTHS) {
      const height = Math.round(width * 1.25); // 4:5 ratio
      metadataOutput[officer.key].variants[width] = {};

      // AVIF
      const avifFileName = `${officer.baseName}-${width}.avif`;
      const avifPath = path.join(outputDir, avifFileName);
      await sharp(masterBuffer)
        .resize(width, height, { fit: 'cover' })
        .avif({ quality: 70, effort: 4 })
        .withMetadata(false)
        .toFile(avifPath);
      const avifSize = fs.statSync(avifPath).size;
      metadataOutput[officer.key].variants[width].avif = {
        path: `/images/mpp/${avifFileName}`,
        sizeKB: (avifSize / 1024).toFixed(1),
        sizeBytes: avifSize,
      };

      // WEBP
      const webpFileName = `${officer.baseName}-${width}.webp`;
      const webpPath = path.join(outputDir, webpFileName);
      await sharp(masterBuffer)
        .resize(width, height, { fit: 'cover' })
        .webp({ quality: 72, effort: 4 })
        .withMetadata(false)
        .toFile(webpPath);
      const webpSize = fs.statSync(webpPath).size;
      metadataOutput[officer.key].variants[width].webp = {
        path: `/images/mpp/${webpFileName}`,
        sizeKB: (webpSize / 1024).toFixed(1),
        sizeBytes: webpSize,
      };

      // JPG Fallback
      const jpgFileName = `${officer.baseName}-${width}.jpg`;
      const jpgPath = path.join(outputDir, jpgFileName);
      await sharp(masterBuffer)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality: 72, mozjpeg: true })
        .withMetadata(false)
        .toFile(jpgPath);
      const jpgSize = fs.statSync(jpgPath).size;
      metadataOutput[officer.key].variants[width].jpg = {
        path: `/images/mpp/${jpgFileName}`,
        sizeKB: (jpgSize / 1024).toFixed(1),
        sizeBytes: jpgSize,
      };

      console.log(`  [${width}w x ${height}h] AVIF: ${(avifSize / 1024).toFixed(1)} KB | WebP: ${(webpSize / 1024).toFixed(1)} KB | JPG: ${(jpgSize / 1024).toFixed(1)} KB`);
    }

    // Default un-suffixed fallbacks for standard compatibility
    fs.copyFileSync(path.join(outputDir, `${officer.baseName}-480.webp`), path.join(outputDir, `${officer.baseName}.webp`));
    fs.copyFileSync(path.join(outputDir, `${officer.baseName}-480.jpg`), path.join(outputDir, `${officer.baseName}.jpg`));
  }

  // 3. Write metadata to src/utils/officerImageMetadata.ts
  const tsContent = `// Auto-generated by scripts/optimize-officer.mjs
// Sumber/Lisensi: Dokumentasi Visual Petugas Front Office DPMPTSP MPP Simpurusiang Kab. Luwu (Hak Cipta Pemkab Luwu 2026, Self-Hosted Asset).

export interface OfficerImageVariant {
  path: string;
  sizeKB: string;
  sizeBytes: number;
}

export interface OfficerMetadata {
  key: string;
  title: string;
  dominantColor: string;
  lqip: string;
  aspectRatio: string;
  width: number;
  height: number;
  variants: {
    [width: number]: {
      avif: OfficerImageVariant;
      webp: OfficerImageVariant;
      jpg: OfficerImageVariant;
    };
  };
}

export const OFFICER_IMAGES_METADATA: Record<'officer-left' | 'officer-right', OfficerMetadata> = ${JSON.stringify(metadataOutput, null, 2)};

export function getOfficerSrcset(key: 'officer-left' | 'officer-right', format: 'avif' | 'webp' | 'jpg'): string {
  const meta = OFFICER_IMAGES_METADATA[key];
  if (!meta) return '';
  return Object.entries(meta.variants)
    .map(([w, formats]) => \`\${formats[format].path} \${w}w\`)
    .join(', ');
}
`;

  const tsPath = path.join(rootDir, 'src', 'utils', 'officerImageMetadata.ts');
  fs.writeFileSync(tsPath, tsContent, 'utf8');
  console.log(`\n✅ Generated TypeScript metadata: ${tsPath}`);

  // 4. Write attribution file in public/images/mpp/ATTRIBUTION.md
  const attributionContent = `# Lisensi & Sumber Aset Foto Petugas Front Office
Sumber: Dokumentasi Visual Resmi Petugas Front Office DPMPTSP MPP Simpurusiang Kabupaten Luwu (Self-Hosted Pemkab Luwu, Hak Cipta 2026 DPMPTSP Kab. Luwu, Lisensi Publik Pemkab Luwu).
`;
  fs.writeFileSync(path.join(outputDir, 'ATTRIBUTION.md'), attributionContent, 'utf8');

  console.log('\n====================================================');
  console.log('🎉 OFFICER IMAGE OPTIMIZATION COMPLETED SUCCESSFULLY');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Fatal error optimizing officer images:', err);
  process.exit(1);
});
