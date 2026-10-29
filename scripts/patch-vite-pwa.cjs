const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'vite-plugin-pwa', 'dist', 'index.js');
if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  let modified = false;

  if (content.includes('const _dirname2 = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));')) {
    content = content.replace(
      'function createContext(userOptions) {\n  const _dirname2 = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));\n  const { version } = JSON.parse(\n    readFileSync(resolve(_dirname2, "../package.json"), "utf-8")\n  );',
      'function createContext(userOptions) {\n  let version = "0.21.1";\n  try {\n    const _dirname2 = dirname(fileURLToPath(import.meta.url));\n    version = JSON.parse(readFileSync(resolve(_dirname2, "../package.json"), "utf-8")).version || version;\n  } catch (e) {}'
    );
    modified = true;
  }

  if (content.includes('var _dirname = typeof __dirname !== "undefined" ? __dirname : dirname2(fileURLToPath2(import.meta.url));\nvar require2 = createRequire(_dirname);')) {
    content = content.replace(
      'var _dirname = typeof __dirname !== "undefined" ? __dirname : dirname2(fileURLToPath2(import.meta.url));\nvar require2 = createRequire(_dirname);',
      'var _dirname = typeof __dirname !== "undefined" && typeof __dirname === "string" && !__dirname.startsWith(".") ? resolve2(__dirname) : dirname2(fileURLToPath2(import.meta.url));\nvar require2 = createRequire(resolve2(_dirname));'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-vite-pwa] Successfully patched vite-plugin-pwa for Node 22/Vite 6.');
  }
}
