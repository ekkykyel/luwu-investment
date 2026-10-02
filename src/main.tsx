import { Suspense } from "react";
import LoadingScreen from "./components/LoadingScreen";
import { SectionErrorBoundary } from "./components/ErrorBoundary";
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './lib/cookiePruner';
import './i18n.ts';
import './index.css';


window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || '';
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('AJAXError')
  ) {
    event.preventDefault(); // Prevent the error overlay
  }
});

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault(); // Prevent default browser error overlay / unhandled exception
  const reloadCount = parseInt(sessionStorage.getItem('vite-reload-count') || '0', 10);
  if (reloadCount < 2) {
    sessionStorage.setItem('vite-reload-count', (reloadCount + 1).toString());
    window.location.reload();
  } else {
    sessionStorage.removeItem('vite-reload-count');
    console.info('[Vite] Preload asset reloaded cleanly.');
  }
});
// Reset reload count on successful app initialization
setTimeout(() => sessionStorage.removeItem('vite-reload-count'), 2000);

const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleDir = console.dir;

// Helper to check if any log argument contains sensitive credentials, JWTs, passwords, or tokens
const containsSensitiveData = (args: any[]): boolean => {
  for (const arg of args) {
    if (!arg) continue;
    let str = "";
    if (typeof arg === "string") {
      str = arg;
    } else if (typeof arg === "object") {
      try {
        str = JSON.stringify(arg);
      } catch {
        str = String(arg);
      }
    } else {
      str = String(arg);
    }
    // Check for tokens, JWT, passwords, secret keys, anon keys, session data
    if (
      /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/.test(str) || // JWT pattern
      /Bearer\s+[a-zA-Z0-9_.-]+/i.test(str) || // Bearer Token pattern
      /sb_publishable_[a-zA-Z0-9_-]+/.test(str) || // Supabase Anon Key pattern
      /sb-access-token/i.test(str) ||
      /luwu_session_token/i.test(str) ||
      /"password"\s*:\s*"[^"]+"/i.test(str) ||
      /password\s*[:=]/i.test(str) ||
      /access_token/i.test(str) ||
      /refresh_token/i.test(str) ||
      /supabase_token/i.test(str) ||
      /service_role/i.test(str) ||
      /"user_metadata"/i.test(str) ||
      /"Authorization"\s*:\s*"Bearer/i.test(str)
    ) {
      return true;
    }
  }
  return false;
};

// Clean arguments by masking sensitive values if logged
const sanitizeLogArgs = (args: any[]): any[] => {
  return args.map(arg => {
    if (typeof arg === "string") {
      return arg
        .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]*/g, '[REDACTED_JWT]')
        .replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, 'Bearer [REDACTED_TOKEN]')
        .replace(/sb_publishable_[a-zA-Z0-9_-]+/g, '[REDACTED_KEY]')
        .replace(/("password"\s*:\s*)"[^"]+"/gi, '$1"[REDACTED]"')
        .replace(/(password\s*[:=]\s*)"?[^",\s}]+"??/gi, '$1"[REDACTED]"');
    }
    return arg;
  });
};

console.log = (...args: any[]) => {
  if (containsSensitiveData(args)) return;
  originalConsoleLog(...sanitizeLogArgs(args));
};

console.info = (...args: any[]) => {
  if (containsSensitiveData(args)) return;
  originalConsoleInfo(...sanitizeLogArgs(args));
};

console.debug = (...args: any[]) => {
  if (containsSensitiveData(args)) return;
  originalConsoleDebug(...sanitizeLogArgs(args));
};

console.dir = (...args: any[]) => {
  if (containsSensitiveData(args)) return;
  if (originalConsoleDir) {
    originalConsoleDir(...sanitizeLogArgs(args));
  }
};

console.warn = (...args: any[]) => {
  if (containsSensitiveData(args)) return;
  const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
  if (
    msg.includes('width(0) and height(0) of chart should be greater than 0') ||
    msg.includes('The width(0) and height(0) of chart') ||
    msg.includes('ERR_ABORTED') ||
    msg.includes('google.com/vt')
  ) {
    return;
  }
  originalConsoleWarn(...sanitizeLogArgs(args));
};

console.error = (...args: any[]) => {
  if (containsSensitiveData(args)) return;
  const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
  if (
      msg.includes('width(0) and height(0) of chart should be greater than 0') ||
      msg.includes('The width(0) and height(0) of chart') ||
      msg.includes('AJAXError: Failed to fetch (0)') || 
      msg.includes('error 0: Failed to fetch') ||
      msg.includes('Failed to fetch') ||
      msg.includes('ERR_ABORTED') ||
      msg.includes('abort') ||
      msg.includes('google.com/vt') ||
      msg.includes('Could not create web worker(s)') ||
      msg.includes('Vite preload error') ||
      msg.includes('preload error') ||
      // msg.includes('Error loading testimonials from Supabase') ||
      (typeof args[0] === 'string' && args[0].includes('error 0: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 1: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 2: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 3: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 4: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 5: AJAXError'))
  ) {
    return;
  }
  originalConsoleError(...sanitizeLogArgs(args));
};


// Global Fetch Interceptor to augment API requests with stored authorization tokens
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    value: async (input: RequestInfo | URL, init?: RequestInit) => {
      // Fast path: don't intercept map background tile fetches
      let urlStr = "";
      if (typeof input === "string") {
        urlStr = input;
      } else if (input instanceof URL) {
        urlStr = input.toString();
      } else if (input && typeof input.url === "string") {
        urlStr = input.url;
      }
      
      if (urlStr.includes('/api/tiles/')) {
        return originalFetch(input, init);
      }

      // Do not append authorization headers to external CDNs or external APIs!
      // Only append authorization headers if the URL is a relative path or on our own origin
      const isInternal = urlStr.startsWith('/') || urlStr.startsWith(window.location.origin) || urlStr.startsWith('./') || urlStr.startsWith('../');
      if (!isInternal) {
        return originalFetch(input, init);
      }

      const token = localStorage.getItem("luwu_session_token");
      if (token) {
        init = init || {};
        if (!init.headers) {
          init.headers = {};
        }
        if (init.headers instanceof Headers) {
          if (!init.headers.has("Authorization")) {
            init.headers.set("Authorization", `Bearer ${token}`);
          }
        } else if (Array.isArray(init.headers)) {
          const hasAuth = init.headers.some(([k]) => k.toLowerCase() === 'authorization');
          if (!hasAuth) {
            init.headers.push(['Authorization', `Bearer ${token}`]);
          }
        } else {
          const headersObj = init.headers as Record<string, string>;
          const hasAuth = Object.keys(headersObj).some(k => k.toLowerCase() === 'authorization');
          if (!hasAuth) {
            headersObj["Authorization"] = `Bearer ${token}`;
          }
        }
      }
      return originalFetch(input, init);
    },
    writable: true,
    configurable: true
  });
} catch (e) {
  undefined;
  try {
    (window as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let urlStr = "";
      if (typeof input === "string") {
        urlStr = input;
      } else if (input instanceof URL) {
        urlStr = input.toString();
      } else if (input && typeof input.url === "string") {
        urlStr = input.url;
      }
      
      if (urlStr.includes('/api/tiles/')) {
        return originalFetch(input, init);
      }

      // Do not append authorization headers to external CDNs or external APIs!
      // Only append authorization headers if the URL is a relative path or on our own origin
      const isInternal = urlStr.startsWith('/') || urlStr.startsWith(window.location.origin) || urlStr.startsWith('./') || urlStr.startsWith('../');
      if (!isInternal) {
        return originalFetch(input, init);
      }

      const token = localStorage.getItem("luwu_session_token");
      if (token) {
        init = init || {};
        if (!init.headers) {
          init.headers = {};
        }
        if (init.headers instanceof Headers) {
          if (!init.headers.has("Authorization")) {
            init.headers.set("Authorization", `Bearer ${token}`);
          }
        } else if (Array.isArray(init.headers)) {
          const hasAuth = init.headers.some(([k]) => k.toLowerCase() === 'authorization');
          if (!hasAuth) {
            init.headers.push(['Authorization', `Bearer ${token}`]);
          }
        } else {
          const headersObj = init.headers as Record<string, string>;
          const hasAuth = Object.keys(headersObj).some(k => k.toLowerCase() === 'authorization');
          if (!hasAuth) {
            headersObj["Authorization"] = `Bearer ${token}`;
          }
        }
      }
      return originalFetch(input, init);
    };
  } catch (err) {
    console.error("Failed safety fallback fetch reassignment:", err);
  }
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SectionErrorBoundary sectionName="Aplikasi Utama Simpurusiang">
        <Suspense fallback={<LoadingScreen />}><App /></Suspense>
      </SectionErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);

// Register service worker for PWA support & GeoJSON SWR caching layer
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Service Worker registered successfully with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] Service Worker registration failed (benign in restricted iframes):', err?.message || err);
      });
  });
}

