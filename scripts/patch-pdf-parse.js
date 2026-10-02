import fs from 'fs';
import path from 'path';

const pdfParsePath = path.resolve('node_modules', 'pdf-parse', 'index.js');
if (fs.existsSync(pdfParsePath)) {
  let content = fs.readFileSync(pdfParsePath, 'utf8');
  content = content.replace('let isDebugMode = !module.parent;', 'let isDebugMode = false;');
  fs.writeFileSync(pdfParsePath, content, 'utf8');
  console.log('Patched pdf-parse to disable debug mode.');
} else {
  console.log('pdf-parse not found, skipping patch.');
}
