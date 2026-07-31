import { isMobileOrAndroidDevice } from "../hooks/useDeviceAutomation.js";

export function requestSmartFullscreen() {
  if (typeof window === 'undefined') return;
  if (!isMobileOrAndroidDevice()) return;

  const elem = document.documentElement as any;
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(() => {});
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
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
