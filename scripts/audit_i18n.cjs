const fs = require('fs');
const path = require('path');

const idLocale = JSON.parse(fs.readFileSync('src/locales/id.json', 'utf8'));
const enLocale = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const zhLocale = JSON.parse(fs.readFileSync('src/locales/zh.json', 'utf8'));

function getNested(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function getAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== 'build') {
        res = res.concat(getAllFiles(full, exts));
      }
    } else if (exts.includes(path.extname(f))) {
      res.push(full);
    }
  }
  return res;
}

const files = getAllFiles('src');
// Match t('key' or t("key" or t(`key`
const keyRegex = /\bt\(\s*["'`]?([a-zA-Z0-9_.-]+)["'`]?/g;

const missing = {
  id: new Map(),
  en: new Map(),
  zh: new Map()
};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    if (key.includes('${') || key.length < 2 || key.startsWith('http') || key.endsWith('.')) continue;

    // Check if key has fallback in t(key, "fallback")
    const afterMatch = content.slice(match.index + match[0].length);
    const hasFallback = /^\s*,\s*["'`]/.test(afterMatch);

    const valId = getNested(idLocale, key);
    const valEn = getNested(enLocale, key);
    const valZh = getNested(zhLocale, key);

    if (valId === undefined) {
      if (!missing.id.has(key)) missing.id.set(key, { files: new Set(), hasFallback });
      missing.id.get(key).files.add(file);
    }
    if (valEn === undefined) {
      if (!missing.en.has(key)) missing.en.set(key, { files: new Set(), hasFallback });
      missing.en.get(key).files.add(file);
    }
    if (valZh === undefined) {
      if (!missing.zh.has(key)) missing.zh.set(key, { files: new Set(), hasFallback });
      missing.zh.get(key).files.add(file);
    }
  }
}

console.log('=== MISSING KEYS IN ID.JSON (CRITICAL RAW LEAKS - NO FALLBACK) ===');
for (const [k, v] of missing.id.entries()) {
  if (!v.hasFallback) {
    console.log(`[ID - RAW LEAK]: "${k}" in ${Array.from(v.files).join(', ')}`);
  }
}

console.log('\n=== MISSING KEYS IN ID.JSON (WITH FALLBACK) ===');
for (const [k, v] of missing.id.entries()) {
  if (v.hasFallback) {
    console.log(`[ID - HAS FALLBACK]: "${k}" in ${Array.from(v.files).join(', ')}`);
  }
}

console.log('\n=== MISSING KEYS IN EN.JSON (NO FALLBACK) ===');
for (const [k, v] of missing.en.entries()) {
  if (!v.hasFallback) {
    console.log(`[EN - RAW LEAK]: "${k}" in ${Array.from(v.files).join(', ')}`);
  }
}

console.log('\n=== MISSING KEYS IN ZH.JSON (NO FALLBACK) ===');
for (const [k, v] of missing.zh.entries()) {
  if (!v.hasFallback) {
    console.log(`[ZH - RAW LEAK]: "${k}" in ${Array.from(v.files).join(', ')}`);
  }
}
