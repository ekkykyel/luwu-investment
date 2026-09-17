import { useState, useEffect } from "react";

/**
 * Utility function to detect if the user is accessing via Smartphone / Android / Mobile device.
 * Used to trigger Auto-Fullscreen exclusively on mobile/Android devices, while strictly disabling
 * auto-fullscreen on Desktop / Laptop / PC browsers to save memory, prevent memory leaks,
 * and maintain proportional desktop layout ratios.
 */
export function isMobileOrAndroidDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || "").toLowerCase();

  // Strict Mobile OS pattern
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

  // Strictly exclude desktop OSes to prevent false positive touch-screen laptops
  if (/windows nt|macintosh|x11|linux x86_64/i.test(ua) && !/android|iphone|ipad|ipod/i.test(ua)) {
    return false;
  }

  return isMobileUA;
}

export function useDeviceAutomation() {
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setIsMobile(isMobileOrAndroidDevice());
    const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || "").toLowerCase();
    if (/android/i.test(ua)) {
      setIsAndroid(true);
    }
  }, []);

  return { isAndroid, isMobile };
}
