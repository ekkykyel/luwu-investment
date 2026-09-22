import React from 'react';

function isReactComponent(val: any, keyName?: string): boolean {
  if (!val) return false;
  if (typeof val === 'function') {
    // If a key name is provided and it's not 'default', verify PascalCase (React Component naming convention)
    if (keyName && keyName !== 'default') {
      const firstChar = keyName.charAt(0);
      if (firstChar !== firstChar.toUpperCase() || firstChar === firstChar.toLowerCase()) {
        return false;
      }
    }
    return true;
  }
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
    const pageHasRefreshedKey = 'vite_chunk_reload_attempts';

    while (attempt < maxRetries) {
      try {
        const module = await componentImport();
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(pageHasRefreshedKey);
        }

        if (module) {
          if (isReactComponent(module.default)) {
            return { default: module.default };
          }
          if (isReactComponent(module)) {
            return { default: module };
          }
          if (typeof module === 'object') {
            for (const key of Object.keys(module)) {
              if (isReactComponent(module[key], key)) {
                return { default: module[key] };
              }
            }
          }
        }

        const SafeFallback: React.FC = () => null;
        return { default: SafeFallback as unknown as T };
      } catch (error: any) {
        attempt++;
        console.warn(`[lazyWithRetry] Attempt ${attempt}/${maxRetries} failed to load chunk:`, error?.message || error);

        if (attempt < maxRetries) {
          // Exponential backoff with jitter (300ms, 800ms, 1800ms, 3500ms)
          const backoffDelay = Math.min(5000, Math.pow(2, attempt) * 250 + Math.random() * 200);
          console.log(`[lazyWithRetry] Retrying dynamic module import in ${Math.round(backoffDelay)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        } else {
          // Attempt a single page refresh if it's a hard stale Vite build hash mismatch
          if (typeof window !== 'undefined') {
            const reloads = parseInt(window.sessionStorage.getItem(pageHasRefreshedKey) || '0', 10);
            if (reloads < 2) {
              window.sessionStorage.setItem(pageHasRefreshedKey, String(reloads + 1));
              console.warn('[lazyWithRetry] Reloading page to fetch updated JS bundles...');
              window.location.reload();
              return new Promise(() => {}) as any;
            }
          }

          // Safe, elegant Fallback Component to prevent White Screen crash
          const SafeErrorFallback: React.FC = () => 
            React.createElement(
              'div',
              { className: 'w-full my-2 p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg' },
              React.createElement('span', { className: 'font-sans font-medium' }, 'Modul sedang dimuat ulang (429 Rate-Limit).'),
              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => window.location.reload(),
                  className: 'px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all cursor-pointer shrink-0'
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

