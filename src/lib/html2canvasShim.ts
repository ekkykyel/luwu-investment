import html2canvas from "html2canvas";

function parseVal(token: string, percentDivisor: number = 100): number {
  if (!token) return 0;
  const lower = token.toLowerCase();
  if (lower === 'none') return 0;
  if (lower.endsWith('%')) {
    return parseFloat(token) / percentDivisor;
  }
  return parseFloat(token);
}

function parseAngle(token: string): number {
  if (!token) return 0;
  const lower = token.toLowerCase();
  if (lower === 'none') return 0;
  if (lower.endsWith('deg')) {
    return parseFloat(token);
  }
  if (lower.endsWith('rad')) {
    return parseFloat(token) * (180 / Math.PI);
  }
  if (lower.endsWith('turn')) {
    return parseFloat(token) * 360;
  }
  return parseFloat(token);
}

function parseOklch(str: string) {
  const matches = str.match(/oklch\s*\(([^)]+)\)/i);
  if (!matches) return null;
  const parts = matches[1].split(/[\s,]+/);
  const tokens = parts.map(p => p.trim()).filter(p => p !== '' && p !== '/');
  if (tokens.length < 3) return null;
  
  // Lightness (0-100% or 0-1)
  const L = parseVal(tokens[0], 100);
  // Chroma (0-100% or 0-0.4+)
  const C = parseVal(tokens[1], 100);
  // Hue (0-360 deg)
  const H = parseAngle(tokens[2]);
  // Alpha
  const A = tokens.length > 3 ? parseVal(tokens[3], 100) : 1;
  
  return { L, C, H, A };
}

function parseOklab(str: string) {
  const matches = str.match(/oklab\s*\(([^)]+)\)/i);
  if (!matches) return null;
  const parts = matches[1].split(/[\s,]+/);
  const tokens = parts.map(p => p.trim()).filter(p => p !== '' && p !== '/');
  if (tokens.length < 3) return null;
  
  // Lightness
  const L = parseVal(tokens[0], 100);
  // a-axis
  const a = parseVal(tokens[1], 100);
  // b-axis
  const b = parseVal(tokens[2], 100);
  // Alpha
  const A = tokens.length > 3 ? parseVal(tokens[3], 100) : 1;
  
  return { L, a, b, A };
}

function oklabToRgb(L: number, a: number, b: number, A: number = 1): string {
  // 1. oklab to LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855414 * b;
  
  // 2. cube back
  const l = l_ >= 0 ? Math.pow(l_, 3) : -Math.pow(-l_, 3);
  const m = m_ >= 0 ? Math.pow(m_, 3) : -Math.pow(-m_, 3);
  const s = s_ >= 0 ? Math.pow(s_, 3) : -Math.pow(-s_, 3);
  
  // 3. LMS to linear sRGB
  const rPart = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gPart = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bPart = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  
  // 4. Linear sRGB to sRGB gamma correction
  const cap = (x: number) => {
    if (x <= 0.0031308) return 12.92 * x;
    return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };
  
  const R = Math.max(0, Math.min(255, Math.round(cap(rPart) * 255)));
  const G = Math.max(0, Math.min(255, Math.round(cap(gPart) * 255)));
  const B = Math.max(0, Math.min(255, Math.round(cap(bPart) * 255)));
  
  if (A < 1) {
    return `rgba(${R}, ${G}, ${B}, ${A})`;
  }
  return `rgb(${R}, ${G}, ${B})`;
}

function oklchToRgb(L: number, C: number, H: number, A: number = 1): string {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  return oklabToRgb(L, a, b, A);
}

function parseColorNative(colorStr: string): string {
  try {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = '#000000';
      tempCtx.fillStyle = colorStr;
      if (tempCtx.fillStyle !== '#000000' || colorStr.includes('black') || colorStr.includes('0 0 0')) {
        return tempCtx.fillStyle;
      }
    }
  } catch (e) {}
  return 'rgb(148, 163, 184)';
}

function replaceOklchOklabWithRgb(colorStr: string): string {
  if (!colorStr || (!colorStr.includes('oklch') && !colorStr.includes('oklab') && !colorStr.includes('light-dark'))) {
    return colorStr;
  }
  
  let replaced = colorStr;
  
  // Replace references
  const oklchRegex = /oklch\s*\([^)]+\)/gi;
  replaced = replaced.replace(oklchRegex, (match) => {
    try {
      const parsed = parseOklch(match);
      if (parsed) {
        const rgb = oklchToRgb(parsed.L, parsed.C, parsed.H, parsed.A);
        if (rgb) return rgb;
      }
    } catch (e) {}
    return parseColorNative(match);
  });
  
  const oklabRegex = /oklab\s*\([^)]+\)/gi;
  replaced = replaced.replace(oklabRegex, (match) => {
    try {
      const parsed = parseOklab(match);
      if (parsed) {
        const rgb = oklabToRgb(parsed.L, parsed.a, parsed.b, parsed.A);
        if (rgb) return rgb;
      }
    } catch (e) {}
    return parseColorNative(match);
  });

  replaced = replaced.replace(/light-dark\s*\(([^,]+),[^)]+\)/gi, '$1');
  
  return replaced;
}

/**
 * A safe wrapper around html2canvas to fix crashes with Tailwind CSS v4's 'oklch' color functions.
 * html2canvas fails with "Attempting to parse an unsupported color function 'oklch'" when it parses
 * document stylesheets. This function temporarily replaces oklch colors with fallback rgb colors
 * inside `<style>` and `<link>` elements before running html2canvas, then fully restores them.
 */
export async function safeHtml2Canvas(element: HTMLElement, options: any = {}): Promise<HTMLCanvasElement> {
  const styleElements = Array.from(document.querySelectorAll('style'));
  const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
  
  // 1. Back up style texts
  const styleBackups = styleElements.map(el => ({
    element: el,
    originalText: el.textContent
  }));
  
  // 2. Modify style tags in-place for both oklch and oklab support
  for (const styleEl of styleElements) {
    if (styleEl.textContent && /oklch|oklab|light-dark/i.test(styleEl.textContent)) {
      styleEl.textContent = replaceOklchOklabWithRgb(styleEl.textContent);
    }
  }

  // 3. For link tags, temporarily disable or convert same-origin css, avoiding blocking network fetches
  const temporaryStyles: HTMLStyleElement[] = [];
  const linkBackups: { element: HTMLLinkElement; disabled: boolean }[] = [];

  for (const link of linkElements) {
    try {
      linkBackups.push({ element: link, disabled: link.disabled });
      
      const sheet = link.sheet as CSSStyleSheet;
      let cssText = "";
      
      if (sheet) {
        try {
          cssText = Array.from(sheet.cssRules).map(rule => rule.cssText).join("\n");
        } catch (e) {
          // Cross-origin stylesheet rules are not directly readable; disable temporarily to prevent html2canvas crash
          cssText = "";
        }
      }

      if (cssText && /oklch|oklab|light-dark/i.test(cssText)) {
        const tempStyle = document.createElement('style');
        tempStyle.className = "temp-html2canvas-shim";
        tempStyle.textContent = replaceOklchOklabWithRgb(cssText);
        document.head.appendChild(tempStyle);
        temporaryStyles.push(tempStyle);
        link.disabled = true;
      } else if (!cssText) {
        // Cross-origin external link (e.g. Google Fonts / CDNs) - disable during snapshot to prevent parsing crash
        link.disabled = true;
      }
    } catch (e) {
      try { link.disabled = true; } catch(swallow) {}
    }
  }

  // 3.5 Inject safe Canvas clones inside html2canvas's cloned document
  const originalOnClone = options.onclone;
  options.onclone = (clonedDoc: Document, clonedElement: HTMLElement) => {
    if (originalOnClone) {
      try {
        originalOnClone(clonedDoc, clonedElement);
      } catch (e) {
        console.error("[safeHtml2Canvas] Error in original onclone callback:", e);
      }
    }

    // Purge ignored elements
    try {
      const ignores = Array.from(clonedElement.querySelectorAll('[data-html2canvas-ignore="true"], [data-html2canvas-ignore]'));
      ignores.forEach((ignoredEl) => {
        ignoredEl.remove();
      });
    } catch (ignoreErr) {}

    // Hide map controls
    try {
      const extraStyles = clonedDoc.createElement('style');
      extraStyles.textContent = `
        .maplibregl-ctrl, .maplibregl-ctrl-group, .maplibregl-ctrl-top-right, .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-top-left, .maplibregl-ctrl-attrib,
        .mapboxgl-ctrl, .mapboxgl-ctrl-group, .mapboxgl-ctrl-attrib {
          display: none !important;
        }
      `;
      clonedDoc.head.appendChild(extraStyles);
    } catch (styleErr) {}

    // Convert WebGL canvases to snapshot img tags
    const originalCanvases = Array.from(element.querySelectorAll('canvas'));
    const clonedCanvases = Array.from(clonedElement.querySelectorAll('canvas'));

    originalCanvases.forEach((origCanvas, idx) => {
      const clonedCanvas = clonedCanvases[idx];
      if (clonedCanvas) {
        try {
          const img = clonedDoc.createElement('img');
          let dataUrl = "";
          try {
            const temp = document.createElement("canvas");
            temp.width = origCanvas.width;
            temp.height = origCanvas.height;
            const ctx = temp.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, temp.width, temp.height);
              ctx.drawImage(origCanvas, 0, 0);
              dataUrl = temp.toDataURL("image/jpeg", 0.92);
            }
          } catch (e) {
            dataUrl = origCanvas.toDataURL("image/png");
          }
          img.src = dataUrl || origCanvas.toDataURL("image/png");
          img.style.cssText = clonedCanvas.style.cssText;
          img.className = clonedCanvas.className;
          
          if (clonedCanvas.hasAttribute('width')) img.setAttribute('width', clonedCanvas.getAttribute('width') || '');
          if (clonedCanvas.hasAttribute('height')) img.setAttribute('height', clonedCanvas.getAttribute('height') || '');
          
          if (clonedCanvas.parentNode) {
            clonedCanvas.parentNode.replaceChild(img, clonedCanvas);
          }
        } catch (canvasErr) {}
      }
    });

    // Clean inline styling attributes & styles in the cloned elements
    try {
      const clonedStyles = Array.from(clonedDoc.querySelectorAll('style'));
      clonedStyles.forEach(s => {
        if (s.textContent && /oklch|oklab|light-dark/i.test(s.textContent)) {
          s.textContent = replaceOklchOklabWithRgb(s.textContent);
        }
      });

      const clonedStyledElements = Array.from(clonedDoc.querySelectorAll('[style]'));
      clonedStyledElements.forEach(el => {
        const styleAttr = el.getAttribute('style');
        if (styleAttr && /oklch|oklab|light-dark/i.test(styleAttr)) {
          el.setAttribute('style', replaceOklchOklabWithRgb(styleAttr));
        }
      });
    } catch (cleanInlineErr) {}
  };

  // 4. Run html2canvas
  try {
    const canvas = await html2canvas(element, options);
    return canvas;
  } finally {
    // 5. Restore style tags
    for (const backup of styleBackups) {
      backup.element.textContent = backup.originalText;
    }

    // 6. Restore link tags and remove temporary styles
    for (const backup of linkBackups) {
      backup.element.disabled = backup.disabled;
    }
    for (const tempStyle of temporaryStyles) {
      tempStyle.remove();
    }

    // Clean up temporary style modifications
    try {
      element.removeAttribute('data-html2canvas-id');
    } catch (e) {}
  }
}

/**
 * Helper untuk menunggu elemen DOM ter-mount penuh, ter-reflow, ter-paint, 
 * dan browser berada dalam kondisi idle sebelum html2canvas mengambil snapshot.
 */
export function waitForDomAndIdle(elementIdOrRef: string | HTMLElement, timeoutMs = 5000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkAndSchedule = () => {
      const el = typeof elementIdOrRef === 'string' ? document.getElementById(elementIdOrRef) : elementIdOrRef;
      
      if (!el || !document.body.contains(el) || (el.clientHeight === 0 && el.clientWidth === 0)) {
        if (Date.now() - startTime > timeoutMs) {
          return reject(new Error(`Elemen DOM '${typeof elementIdOrRef === 'string' ? elementIdOrRef : 'target'}' belum siap dalam waktu yang ditentukan.`));
        }
        requestAnimationFrame(() => setTimeout(checkAndSchedule, 60));
        return;
      }

      // Tunggu 2 requestAnimationFrame berturut-turut untuk menjamin browser sudah menyelesaikan Reflow & Paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(el);
        });
      });
    };

    checkAndSchedule();
  });
}

/**
 * Antrean (Queue) Serialisasi Render PDF
 * Mencegah bentrokan eksekusi html2canvas / WebGL bersamaan
 */
type PdfTask = () => Promise<any>;
class PdfRenderQueue {
  private queue: Array<{ task: PdfTask; resolve: (val: any) => void; reject: (err: any) => void }> = [];
  private isProcessing = false;

  public enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const item = this.queue.shift();
    if (item) {
      try {
        const result = await item.task();
        item.resolve(result);
      } catch (e) {
        console.error("[PdfRenderQueue] PDF Task execution error:", e);
        item.reject(e);
      } finally {
        this.isProcessing = false;
        setTimeout(() => this.processNext(), 10);
      }
    }
  }
}

export const pdfRenderQueue = new PdfRenderQueue();

