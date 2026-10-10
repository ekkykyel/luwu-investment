/**
 * Cookie Bloat & Header Overflow Prevention Utility
 * Automatically monitors and sanitizes browser cookies to prevent Google Frontend (GFE) 413 Request Entity Too Large errors.
 */

const MAX_SAFE_COOKIE_BYTES = 1024; // Keep total cookie payload strictly under 1KB

export function pruneCookieBloat(): void {
  if (typeof document === 'undefined') return;

  try {
    const rawCookies = document.cookie;
    if (!rawCookies) return;

    const cookieByteLength = new Blob([rawCookies]).size;
    const cookieList = rawCookies.split(';').map(c => c.trim()).filter(Boolean);

    // If cookies are bloated or duplicate keys exist
    if (cookieByteLength > MAX_SAFE_COOKIE_BYTES || cookieList.length > 5) {
      console.warn(`[CookiePruner] Detected cookie bloat (${cookieByteLength} bytes, ${cookieList.length} items). Sanitizing...`);

      const paths = ['/', '/api', '/dashboard', '/admin', window.location.pathname];
      const host = window.location.hostname;
      const domains = [host, `.${host}`];

      cookieList.forEach(cookieStr => {
        const eqIdx = cookieStr.indexOf('=');
        const name = eqIdx > -1 ? cookieStr.substring(0, eqIdx).trim() : cookieStr.trim();
        if (!name) return;

        // If it's a large token cookie, backup to localStorage before removing from cookie
        if (name === 'sb-access-token' || name.startsWith('sb-')) {
          const val = eqIdx > -1 ? cookieStr.substring(eqIdx + 1).trim() : '';
          if (val && typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem('sb-access-token', val);
            } catch {}
          }
        }

        // Clean cookie across various path and domain variations
        paths.forEach(p => {
          document.cookie = `${name}=; path=${p}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure;`;
          document.cookie = `${name}=; path=${p}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`;
          document.cookie = `${name}=; path=${p}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
          
          domains.forEach(d => {
            document.cookie = `${name}=; domain=${d}; path=${p}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure;`;
            document.cookie = `${name}=; domain=${d}; path=${p}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`;
          });
        });
      });

      console.info('[CookiePruner] Cookie storage successfully pruned to prevent 413 Header Overflow.');
    }
  } catch (err) {
    console.warn('[CookiePruner] Error pruning cookies:', err);
  }
}

export function forceResetSessionAndCookies(): void {
  if (typeof document === 'undefined') return;

  try {
    const rawCookies = document.cookie.split(';');
    const paths = ['/', '/api', '/dashboard', '/admin', window.location.pathname];

    rawCookies.forEach(c => {
      const eqIdx = c.indexOf('=');
      const name = eqIdx > -1 ? c.substring(0, eqIdx).trim() : c.trim();
      if (!name) return;

      paths.forEach(p => {
        document.cookie = `${name}=; path=${p}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure;`;
        document.cookie = `${name}=; path=${p}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`;
      });
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('luwu_session_token');
      localStorage.removeItem('luwu_user_role');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    console.info('[CookiePruner] Session & cookies force reset complete.');
  } catch (err) {
    console.error('[CookiePruner] Failed to force reset cookies:', err);
  }
}

// Auto-run on module load to guarantee clean state before initial app fetch calls
if (typeof window !== 'undefined') {
  pruneCookieBloat();
}
