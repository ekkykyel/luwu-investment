import React from 'react';

function isReactComponent(val: any): boolean {
  if (!val) return false;
  if (typeof val === 'function') return true;
  if (typeof val === 'object' && (val.$$typeof || typeof val.render === 'function')) return true;
  return false;
}

/**
 * Robust wrapper around React.lazy that catches dynamic import errors,
 * chunk load failures, and Vite HMR hash mismatch errors.
 * Automatically retries loading or reloads the window if asset hashes changed.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const pageHasRefreshedKey = 'vite_chunk_reload_attempts';
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
        // If module is an ES module namespace object with named exports, find component
        if (typeof module === 'object') {
          for (const key of Object.keys(module)) {
            if (isReactComponent(module[key])) {
              return { default: module[key] };
            }
          }
        }
      }

      // Safe fallback component to prevent React invariant #306 / #130
      console.warn("[lazyWithRetry] Module did not export a valid React component, returning safe fallback:", module);
      const SafeFallback: React.FC = () => null;
      return { default: SafeFallback as unknown as T };
    } catch (error: any) {
      console.warn("[lazyWithRetry] Error loading chunk, attempting recovery:", error);
      
      if (typeof window !== 'undefined') {
        const reloads = parseInt(window.sessionStorage.getItem(pageHasRefreshedKey) || '0', 10);
        if (reloads < 2) {
          window.sessionStorage.setItem(pageHasRefreshedKey, String(reloads + 1));
          console.warn("[lazyWithRetry] Reloading page to fetch updated JS bundles...");
          window.location.reload();
          // Return a non-resolving promise while page reloads
          return new Promise(() => {}) as any;
        }
      }
      throw error;
    }
  });
}
