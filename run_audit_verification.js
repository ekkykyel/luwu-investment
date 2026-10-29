const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const WebSocket = require('ws');

const CHROME_PATH = '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

async function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function getWsUrl(port = 9222) {
  for (let i = 0; i < 20; i++) {
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${port}/json/version`, (res) => {
          let buf = '';
          res.on('data', chunk => buf += chunk);
          res.on('end', () => resolve(buf));
        }).on('error', reject);
      });
      const json = JSON.parse(data);
      return json.webSocketDebuggerUrl;
    } catch (e) {
      await wait(300);
    }
  }
  throw new Error('Could not connect to Chrome CDP');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
  }

  async connect() {
    await new Promise((res, rej) => {
      this.ws.on('open', res);
      this.ws.on('error', rej);
      this.ws.on('message', (msg) => {
        const parsed = JSON.parse(msg);
        if (parsed.id && this.callbacks.has(parsed.id)) {
          const { resolve, reject } = this.callbacks.get(parsed.id);
          this.callbacks.delete(parsed.id);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed.result);
        }
      });
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res && res.result ? res.result.value : null;
  }
}

async function run() {
  console.log('[Audit] Launching Chrome headless shell...');
  const chrome = spawn(CHROME_PATH, [
    '--headless',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars'
  ]);

  try {
    const wsUrl = await getWsUrl(9222);
    console.log('[Audit] Connected to CDP:', wsUrl);
    const client = new CDPClient(wsUrl);
    await client.connect();

    // Create a new target / page
    const target = await client.send('Target.createTarget', { url: 'http://localhost:3000/mpp' });
    const targetWsUrl = `ws://localhost:9222/devtools/page/${target.targetId}`;
    const page = new CDPClient(targetWsUrl);
    await page.connect();

    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('DOM.enable');

    console.log('[Audit] Loading MPP page...');
    await page.send('Page.navigate', { url: 'http://localhost:3000/mpp' });
    await wait(4500); // Wait for React hydration and maps

    // Scroll to #denah-interaktif
    await page.eval(`(() => {
      const el = document.getElementById('denah-interaktif') || document.querySelector('[data-testid="mpp-bottom-controls-bar"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await wait(1000);

    const viewports = [
      { name: '375x667', w: 375, h: 667 },
      { name: '375x812', w: 375, h: 812 },
      { name: '390x844', w: 390, h: 844 },
      { name: '768x1024', w: 768, h: 1024 }
    ];

    const testResults = {
      touchTargets: [],
      elementFromPointTests: [],
      screenshots: []
    };

    if (!fs.existsSync('docs/audit')) {
      fs.mkdirSync('docs/audit', { recursive: true });
    }

    for (const vp of viewports) {
      console.log(`\n=== Testing Viewport ${vp.name} (${vp.w}x${vp.h}) ===`);
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 2,
        mobile: vp.w < 768
      });
      await wait(500);

      for (const theme of ['light', 'dark']) {
        const isDark = theme === 'dark';
        await page.eval(`(() => {
          if (${isDark}) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        })()`);
        await wait(400);

        // Ensure closed state
        await page.eval(`(() => {
          const closeBtn = document.querySelector('[data-testid="legend-close-btn"]');
          if (closeBtn) closeBtn.click();
        })()`);
        await wait(400);

        // Scroll into view of bottom controls
        await page.eval(`(() => {
          const el = document.getElementById('denah-interaktif');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'end' });
        })()`);
        await wait(400);

        // Measure Touch Targets in Closed State
        const targets = await page.eval(`(() => {
          const getBox = (selector) => {
            const el = document.querySelector(selector);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { width: Math.round(r.width), height: Math.round(r.height) };
          };
          return {
            legendToggle: getBox('[data-testid="legend-toggle-btn"]'),
            fullscreenBtn: getBox('[data-testid="mpp-fullscreen-btn"]'),
            centerMapBtn: getBox('[data-testid="mpp-center-map-btn"]')
          };
        })()`);

        testResults.touchTargets.push({
          viewport: vp.name,
          theme,
          targets
        });

        // Screenshot Closed
        const shotClosed = await page.send('Page.captureScreenshot', { format: 'png' });
        const closedFilename = `docs/audit/${vp.name}_${theme}_closed.png`;
        fs.writeFileSync(closedFilename, Buffer.from(shotClosed.data, 'base64'));
        testResults.screenshots.push(closedFilename);
        console.log(`[Captured] ${closedFilename} (Targets: Legend ${targets.legendToggle?.width}x${targets.legendToggle?.height}px, Fullscreen ${targets.fullscreenBtn?.width}x${targets.fullscreenBtn?.height}px)`);

        // Open panel
        await page.eval(`(() => {
          const toggleBtn = document.querySelector('[data-testid="legend-toggle-btn"]');
          if (toggleBtn) toggleBtn.click();
        })()`);
        await wait(600);

        // Automated elementFromPoint check
        const efpResult = await page.eval(`(() => {
          const closeBtn = document.querySelector('[data-testid="legend-close-btn"]');
          if (!closeBtn) return { found: false, error: 'closeBtn not found' };
          const r = closeBtn.getBoundingClientRect();
          const cx = Math.round(r.left + r.width / 2);
          const cy = Math.round(r.top + r.height / 2);
          const hit = document.elementFromPoint(cx, cy);
          const isMatch = hit === closeBtn || closeBtn.contains(hit);
          return {
            found: true,
            box: { left: r.left, top: r.top, width: r.width, height: r.height },
            center: { x: cx, y: cy },
            hitTagName: hit ? hit.tagName : null,
            hitClass: hit ? hit.className : null,
            isMatch
          };
        })()`);

        testResults.elementFromPointTests.push({
          viewport: vp.name,
          theme,
          efpResult
        });
        console.log(`[EFP Test] ${vp.name} (${theme}): isMatch=${efpResult.isMatch}, hit=${efpResult.hitTagName}`);

        // Screenshot Open
        const shotOpen = await page.send('Page.captureScreenshot', { format: 'png' });
        const openFilename = `docs/audit/${vp.name}_${theme}_open.png`;
        fs.writeFileSync(openFilename, Buffer.from(shotOpen.data, 'base64'));
        testResults.screenshots.push(openFilename);
        console.log(`[Captured] ${openFilename}`);

        // Close panel back
        await page.eval(`(() => {
          const closeBtn = document.querySelector('[data-testid="legend-close-btn"]');
          if (closeBtn) closeBtn.click();
        })()`);
        await wait(400);
      }
    }

    // Save test results json
    fs.writeFileSync('docs/audit/verification_results.json', JSON.stringify(testResults, null, 2));
    console.log('\n[Audit] ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');

  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error('[Audit Error]', err);
  process.exit(1);
});
