import { isMobileOrAndroidDevice } from "../hooks/useDeviceAutomation";

export async function requestSmartFullscreen(force: boolean = false) {
  if (typeof window === 'undefined') return;
  if (!force && !isMobileOrAndroidDevice()) return;

  const elem = document.documentElement as any;
  if (elem.requestFullscreen) {
    try {
      await elem.requestFullscreen();
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
    }
  } else if (elem.webkitRequestFullscreen) {
    try {
      elem.webkitRequestFullscreen();
    } catch (err) {
      console.warn("webkitRequestFullscreen failed:", err);
    }
  } else if (elem.mozRequestFullScreen) {
    try {
      elem.mozRequestFullScreen();
    } catch (err) {
      console.warn("mozRequestFullScreen failed:", err);
    }
  } else if (elem.msRequestFullscreen) {
    try {
      elem.msRequestFullscreen();
    } catch (err) {
      console.warn("msRequestFullscreen failed:", err);
    }
  }
}

export function exitSmartFullscreen() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  const doc = document as any;
  if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement) {
    if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  }
}
