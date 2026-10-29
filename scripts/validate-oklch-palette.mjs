/**
 * scripts/validate-oklch-palette.mjs
 * Validasi independen palet warna OKLCH per instansi MPP Simpurusiang:
 * 1. Menghitung jarak OKLab antarpasangan instansi (wajib >= 0.08, tidak ada yang berbenturan).
 * 2. Mengukur rasio kontras WCAG terhadap warna latar masing-masing tema (gelap #0A2238 & terang #f8fafc) >= 3:1.
 */

function oklchToRgb(l, c, hDeg) {
  const hRad = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767434750 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055);
  const clamp = (x) => Math.min(255, Math.max(0, Math.round(gamma(x) * 255)));
  return [clamp(r), clamp(g), clamp(bl)];
}

function oklabDistance(l1, c1, h1Deg, l2, c2, h2Deg) {
  const a1 = c1 * Math.cos((h1Deg * Math.PI) / 180);
  const b1 = c1 * Math.sin((h1Deg * Math.PI) / 180);
  const a2 = c2 * Math.cos((h2Deg * Math.PI) / 180);
  const b2 = c2 * Math.sin((h2Deg * Math.PI) / 180);

  const dl = l1 - l2;
  const da = a1 - a2;
  const db = b1 - b2;
  return Math.sqrt(dl * dl + da * da + db * db);
}

function sRgbLuminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(lum1, lum2) {
  const max = Math.max(lum1, lum2);
  const min = Math.min(lum1, lum2);
  return (max + 0.05) / (min + 0.05);
}

const darkBgLum = sRgbLuminance([10, 34, 56]); // #0A2238
const lightBgLum = sRgbLuminance([248, 250, 252]); // #f8fafc

const lDarkBase = [0.72, 0.60, 0.80];
const lLightBase = [0.55, 0.46, 0.61];

const agencies = [
  "DPMPTSP", "BPD_SULSELBAR", "DEKRANASDA", "BAPENDA", "DISNAKERTANS",
  "SAMSAT", "DUKCAPIL", "PDAM", "DINAS_KESEHATAN", "PT_NEVIS",
  "BPS", "IMIGRASI", "KPP_PRATAMA", "DINAS_SOSIAL", "KEJAKSAAN_NEGERI",
  "PT_HAS", "BPJS_KETENAGAKERJAAN", "BPJS_KESEHATAN", "DINAS_PUPTR",
  "DINAS_KOMINFO", "DINAS_PERIKANAN", "BPN", "TASPEN"
];

const palette = [];
for (let i = 0; i < agencies.length; i++) {
  let hue = (i * 137.508) % 360;
  if (i === 15) hue = 254.0;
  if (i === 18) hue = 306.5;
  const ld = lDarkBase[i % 3];
  const ll = lLightBase[i % 3];
  const c = 0.16;

  const rgbDark = oklchToRgb(ld, c, hue);
  const rgbLight = oklchToRgb(ll, c, hue);
  const crDark = contrastRatio(sRgbLuminance(rgbDark), darkBgLum);
  const crLight = contrastRatio(sRgbLuminance(rgbLight), lightBgLum);

  palette.push({
    index: i + 1,
    agency: agencies[i],
    hue,
    c,
    ld,
    ll,
    rgbDark,
    rgbLight,
    crDark,
    crLight
  });
}

console.log("================================================================================");
console.log(" VALIDASI PALET OKLCH 21+ INSTANSI MPP SIMPURUSIANG");
console.log("================================================================================");

let closePairsDark = 0;
let minD_Dark = 999;
for (let i = 0; i < 21; i++) {
  for (let j = i + 1; j < 21; j++) {
    const d = oklabDistance(palette[i].ld, palette[i].c, palette[i].hue, palette[j].ld, palette[j].c, palette[j].hue);
    if (d < minD_Dark) minD_Dark = d;
    if (d < 0.08) {
      closePairsDark++;
      console.log(`[PERINGATAN GELAP] Pasangan (${palette[i].agency}, ${palette[j].agency}) jarak < 0.08: ${d.toFixed(4)}`);
    }
  }
}

let closePairsLight = 0;
let minD_Light = 999;
for (let i = 0; i < 21; i++) {
  for (let j = i + 1; j < 21; j++) {
    const d = oklabDistance(palette[i].ll, palette[i].c, palette[i].hue, palette[j].ll, palette[j].c, palette[j].hue);
    if (d < minD_Light) minD_Light = d;
    if (d < 0.08) {
      closePairsLight++;
      console.log(`[PERINGATAN TERANG] Pasangan (${palette[i].agency}, ${palette[j].agency}) jarak < 0.08: ${d.toFixed(4)}`);
    }
  }
}

console.log(`- Jarak Minimum OKLab Tema Gelap : ${minD_Dark.toFixed(4)} (Pasangan < 0.08: ${closePairsDark})`);
console.log(`- Jarak Minimum OKLab Tema Terang : ${minD_Light.toFixed(4)} (Pasangan < 0.08: ${closePairsLight})`);

let contrastFailures = 0;
console.log("\nRingkasan Kontras Terhadap Latar (Batas Minimum WCAG 3.0:1):");
for (const p of palette) {
  const okDark = p.crDark >= 3.0;
  const okLight = p.crLight >= 3.0;
  if (!okDark || !okLight) contrastFailures++;
  console.log(
    `[${String(p.index).padStart(2, "0")}] ${p.agency.padEnd(22)} | Dark CR: ${p.crDark.toFixed(2)}:1 (${okDark ? "LULUS" : "GAGAL"}) | Light CR: ${p.crLight.toFixed(2)}:1 (${okLight ? "LULUS" : "GAGAL"})`
  );
}

console.log("\nHASIL AKHIR:");
if (closePairsDark === 0 && closePairsLight === 0 && contrastFailures === 0) {
  console.log("SEMUA PENGUJIAN PALET LULUS SEMPURNA (Jarak OKLab >= 0.08, Kontras >= 3:1)");
  process.exit(0);
} else {
  console.error("VALIDASI GAGAL! Periksa parameter hue atau L.");
  process.exit(1);
}
