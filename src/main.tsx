import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
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

window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
  if (
    msg.includes('width(0) and height(0) of chart should be greater than 0') ||
    msg.includes('The width(0) and height(0) of chart')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
  if (
      msg.includes('width(0) and height(0) of chart should be greater than 0') ||
      msg.includes('The width(0) and height(0) of chart') ||
      msg.includes('AJAXError: Failed to fetch (0)') || 
      msg.includes('error 0: Failed to fetch') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Could not create web worker(s)') ||
      msg.includes('Error loading testimonials from Supabase') ||
      (typeof args[0] === 'string' && args[0].includes('error 0: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 1: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 2: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 3: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 4: AJAXError')) ||
      (typeof args[0] === 'string' && args[0].includes('error 5: AJAXError'))
  ) {
    return;
  }
  if (false && (
      args[0].includes('AJAXError: Failed to fetch (0)') || 
      args[0].includes('error 0: Failed to fetch') ||
      args[0].includes('Failed to fetch') ||
      args[0].includes('Could not create web worker(s)') ||
      args[0].includes('Error loading testimonials from Supabase')
  )) {
    // Ignore benign Maplibre fetch cancellation and Monaco worker errors
    return;
  }
  originalConsoleError(...args);
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
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// Register service worker for PWA support on Android/iOS
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available, force reload
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error('PWA Service Worker registration failed:', err);
      });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
