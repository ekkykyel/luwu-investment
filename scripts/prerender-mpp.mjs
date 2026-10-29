import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('[Prerender] dist/index.html not found, skipping MPP prerender.');
  process.exit(0);
}

const baseHtml = fs.readFileSync(indexPath, 'utf-8');

const mppRoutes = [
  {
    subPath: 'mpp',
    title: 'Portal MPP Simpurusiang - Mal Pelayanan Publik Kabupaten Luwu',
    description: 'Portal Pelayanan Publik Terpadu Satu Pintu Kabupaten Luwu. Akses 20 instansi terpadu, antrean online, konsultasi perizinan, dan dokumen kependudukan di Belopa.',
    canonical: 'https://luwu-investment.vercel.app/mpp'
  },
  {
    subPath: 'mpp/tentang',
    title: 'Tentang MPP Simpurusiang - Mal Pelayanan Publik Kabupaten Luwu',
    description: 'Profil, landasan hukum Perbup Luwu, dan sejarah Mal Pelayanan Publik Simpurusiang Kabupaten Luwu.',
    canonical: 'https://luwu-investment.vercel.app/mpp/tentang'
  },
  {
    subPath: 'mpp/visi-misi',
    title: 'Visi & Misi MPP Simpurusiang - Kabupaten Luwu',
    description: 'Visi dan Misi Pelayanan Publik Modern, Transparan, Cepat, dan Akuntabel di MPP Simpurusiang Kabupaten Luwu.',
    canonical: 'https://luwu-investment.vercel.app/mpp/visi-misi'
  },
  {
    subPath: 'mpp/struktur-organisasi',
    title: 'Struktur Organisasi MPP Simpurusiang - Kabupaten Luwu',
    description: 'Struktur Organisasi Penyelenggara Mal Pelayanan Publik Simpurusiang Kabupaten Luwu.',
    canonical: 'https://luwu-investment.vercel.app/mpp/struktur-organisasi'
  },
  {
    subPath: 'mpp/maklumat-pelayanan',
    title: 'Maklumat Pelayanan & Standar SLA - MPP Simpurusiang Kabupaten Luwu',
    description: 'Maklumat resmi dan komitmen integritas pelayanan terpadu satu atap MPP Simpurusiang Kabupaten Luwu standar KemenPAN-RB.',
    canonical: 'https://luwu-investment.vercel.app/mpp/maklumat-pelayanan'
  }
];

mppRoutes.forEach(route => {
  let modifiedHtml = baseHtml;

  // Replace title
  modifiedHtml = modifiedHtml.replace(
    /<title>.*?<\/title>/i,
    `<title>${route.title}</title>`
  );

  // Replace description
  modifiedHtml = modifiedHtml.replace(
    /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="description" content="${route.description}" />`
  );

  // Replace canonical
  modifiedHtml = modifiedHtml.replace(
    /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i,
    `<link rel="canonical" href="${route.canonical}" />`
  );

  // Replace og:title
  modifiedHtml = modifiedHtml.replace(
    /<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:title" content="${route.title}" />`
  );

  // Replace og:description
  modifiedHtml = modifiedHtml.replace(
    /<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:description" content="${route.description}" />`
  );

  // Replace og:url
  modifiedHtml = modifiedHtml.replace(
    /<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:url" content="${route.canonical}" />`
  );

  // Replace og:site_name
  modifiedHtml = modifiedHtml.replace(
    /<meta\s+property=["']og:site_name["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:site_name" content="MPP Simpurusiang Kab. Luwu" />`
  );

  // Replace twitter tags
  modifiedHtml = modifiedHtml.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="twitter:title" content="${route.title}" />`
  );
  modifiedHtml = modifiedHtml.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="twitter:description" content="${route.description}" />`
  );

  // Target directory
  const targetDir = path.join(distDir, route.subPath);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), modifiedHtml, 'utf-8');
  console.log(`[Prerender] Generated static entry: dist/${route.subPath}/index.html`);
});

console.log('[Prerender] Completed MPP prerender routing successfully.');
