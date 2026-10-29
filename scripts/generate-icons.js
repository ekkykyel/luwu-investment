import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

async function generate() {
  const svgPath = path.resolve('public/logo-luwu.svg');
  const svgBuffer = fs.readFileSync(svgPath);
  const img = await loadImage(svgBuffer);

  // Generate 512x512
  const canvas512 = createCanvas(512, 512);
  const ctx512 = canvas512.getContext('2d');
  ctx512.drawImage(img, 0, 0, 512, 512);
  const png512 = canvas512.toBuffer('image/png');

  // Generate 192x192
  const canvas192 = createCanvas(192, 192);
  const ctx192 = canvas192.getContext('2d');
  ctx192.drawImage(img, 0, 0, 192, 192);
  const png192 = canvas192.toBuffer('image/png');

  fs.writeFileSync(path.resolve('public/transparant.png'), png512);
  fs.writeFileSync(path.resolve('public/logo-512.png'), png512);
  fs.writeFileSync(path.resolve('public/logo-192.png'), png192);

  console.log('Successfully generated valid PNG icons: transparant.png, logo-512.png, logo-192.png');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
