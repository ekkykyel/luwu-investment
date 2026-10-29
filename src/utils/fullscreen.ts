import { isAndroidDevice } from '../hooks/useDeviceAutomation';

/**
 * Utility Manager for Re-Entering and Ensuring Fullscreen on Mobile / Android WebApps.
 * Strictly disabled on Desktop / Laptop / PC browsers.
 */
export const ensureFullscreen = () => {
  if (typeof window === 'undefined') return;
  // Fullscreen only applies to Android devices, strictly disabled on Desktop
  if (!isAndroidDevice()) return;

  const doc = document as any;
  const isDocFullscreen = !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );

  if (!isDocFullscreen) {
    const docEl = document.documentElement as any;
    const requestFS =
      docEl.requestFullscreen ||
      docEl.webkitRequestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.msRequestFullscreen;

    if (requestFS) {
      requestFS.call(docEl).catch((err: Error) => {
        console.warn('Fullscreen request bypassed:', err?.message || err);
      });
    }
  }
};

/**
 * Smart fullscreen request strictly for Android devices.
 * Always returns false on Desktop to maintain natural desktop viewport.
 */
export const requestSmartFullscreen = async (_force: boolean = false): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  // Fullscreen strictly applies to Android devices
  if (!isAndroidDevice()) return false;

  const doc = document as any;
  const docEl = document.documentElement as any;

  const isDocFullscreen = !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );

  if (isDocFullscreen) return true;

  const requestFS =
    docEl.requestFullscreen ||
    docEl.webkitRequestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.msRequestFullscreen;

  if (requestFS) {
    try {
      await requestFS.call(docEl);
      return true;
    } catch (err: any) {
      console.warn('Smart fullscreen request bypassed:', err?.message || err);
      return false;
    }
  }

  return false;
};

export const exitSmartFullscreen = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const doc = document as any;
  const isDocFullscreen = !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );

  if (!isDocFullscreen) return true;

  const exitFS =
    doc.exitFullscreen ||
    doc.webkitExitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.msExitFullscreen;

  if (exitFS) {
    try {
      await exitFS.call(doc);
      return true;
    } catch (err: any) {
      console.warn('Smart fullscreen exit bypassed:', err?.message || err);
      return false;
    }
  }

  return false;
};

export const toggleSmartFullscreen = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const doc = document as any;
  const isDocFullscreen = !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );

  if (isDocFullscreen) {
    return exitSmartFullscreen();
  } else {
    return requestSmartFullscreen();
  }
};
