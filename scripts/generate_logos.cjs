const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function createLogoPNG(size) {
  const png = new PNG({
    width: size,
    height: size,
    filterType: -1
  });

  const center = size / 2;
  const outerRadius = size * 0.42;
  const innerRadius = size * 0.22;

  // Background color #0f172a -> R: 15, G: 23, B: 42
  // Accent emerald color #10b981 -> R: 16, G: 185, B: 129
  // Accent gold/amber color #f59e0b -> R: 245, G: 158, B: 11
  // White #ffffff -> R: 255, G: 255, B: 255

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded rect background for app icon style
      const rx = Math.abs(dx);
      const ry = Math.abs(dy);
      const cornerRadius = size * 0.2;
      const rectLimit = size * 0.48;

      let isInsideBg = true;
      if (rx > rectLimit - cornerRadius && ry > rectLimit - cornerRadius) {
        const cdx = rx - (rectLimit - cornerRadius);
        const cdy = ry - (rectLimit - cornerRadius);
        if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerRadius) {
          isInsideBg = false;
        }
      } else if (rx > rectLimit || ry > rectLimit) {
        isInsideBg = false;
      }

      if (!isInsideBg) {
        // Transparent
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      // Inside app icon container (#0f172a)
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      // Outer ring / map pin shape
      if (dist <= outerRadius && dist >= outerRadius * 0.85) {
        // Gold accent border
        r = 245; g = 158; b = 11;
      } else if (dist <= innerRadius) {
        // Emerald core
        r = 16; g = 185; b = 129;
      } else if (dist < outerRadius * 0.85 && dist > innerRadius) {
        // Map pin triangle pointing down or stylized emblem
        if (dy > 0 && Math.abs(dx) < (outerRadius * 0.5 - (dy * 0.4))) {
          r = 255; g = 255; b = 255;
        } else if (dy <= 0 && dist < outerRadius * 0.6) {
          r = 255; g = 255; b = 255;
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

const logo192 = createLogoPNG(192);
const logo512 = createLogoPNG(512);

fs.writeFileSync(path.join(__dirname, '../public/logo-192.png'), logo192);
fs.writeFileSync(path.join(__dirname, '../public/logo-512.png'), logo512);

if (fs.existsSync(path.join(__dirname, '../dist'))) {
  fs.writeFileSync(path.join(__dirname, '../dist/logo-192.png'), logo192);
  fs.writeFileSync(path.join(__dirname, '../dist/logo-512.png'), logo512);
}

console.log('Successfully generated valid logo-192.png and logo-512.png!');
