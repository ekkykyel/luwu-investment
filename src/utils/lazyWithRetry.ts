import React from 'react';

function isReactComponent(val: any): boolean {
  if (!val) return false;
  if (typeof val === 'function') return true;
  if (typeof val === 'object' && (val.$$typeof || typeof val.render === 'function')) return true;
  return false;
}

/**
 * Robust wrapper around React.lazy that catches dynamic import errors,
 * 429 rate limits, chunk load failures, and Vite HMR hash mismatch errors.
 * Automatically retries loading with exponential backoff before falling back cleanly.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>,
  maxRetries = 4
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const module = await componentImport();

        if (module) {
          if (isReactComponent(module.default)) {
            return { default: module.default };
          }
          if (isReactComponent(module)) {
            return { default: module };
          }
          if (typeof module === 'object') {
            for (const key of Object.keys(module)) {
              if (isReactComponent(module[key])) {
                return { default: module[key] };
              }
            }
          }
        }

        const SafeFallback: React.FC = () => null;
        return { default: SafeFallback as unknown as T };
      } catch (error: any) {
        attempt++;
        console.warn(`[lazyWithRetry] Attempt ${attempt}/${maxRetries} failed to load module chunk:`, error?.message || error);

        if (attempt < maxRetries) {
          // Fast backoff with jitter (100ms, 250ms, 500ms, 1000ms) for seamless recovery
          const backoffDelay = Math.min(1500, Math.pow(2, attempt) * 80 + Math.random() * 100);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        } else {
          // Render elegant, non-intrusive Fallback Component instead of forcing window.location.reload()
          const SafeErrorFallback: React.FC = () => 
            React.createElement(
              'div',
              { className: 'w-full my-2 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg' },
              React.createElement('span', { className: 'font-sans font-medium' }, 'Komponen sedang disinkronkan dengan server.'),
              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => window.location.reload(),
                  className: 'px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all cursor-pointer shrink-0'
                },
                'Muat Ulang'
              )
            );
          return { default: SafeErrorFallback as unknown as T };
        }
      }
    }

    const SafeFallback: React.FC = () => null;
    return { default: SafeFallback as unknown as T };
  });
}

