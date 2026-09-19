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

export function isAndroidDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || "").toLowerCase();
  return /android/i.test(ua);
}

export function useDeviceAutomation() {
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const isMob = isMobileOrAndroidDevice();
    const isAndr = isAndroidDevice();
    setIsMobile(isMob);
    setIsAndroid(isAndr);

    // Otomatis suntikkan class 'android-fullscreen-mode' ke root document jika perangkat Android aktif
    // atau jika berjalan di mobile browser / PWA standalone untuk pengalaman edge-to-edge
    if (typeof document !== "undefined") {
      if (isAndr || (isMob && window.innerWidth <= 768)) {
        document.documentElement.classList.add("android-fullscreen-mode");
        document.body.classList.add("android-fullscreen-mode");
      } else {
        document.documentElement.classList.remove("android-fullscreen-mode");
        document.body.classList.remove("android-fullscreen-mode");
      }
    }

    const handleResize = () => {
      const currentMob = isMobileOrAndroidDevice();
      const currentAndr = isAndroidDevice();
      if (typeof document !== "undefined") {
        if (currentAndr || (currentMob && window.innerWidth <= 768)) {
          document.documentElement.classList.add("android-fullscreen-mode");
          document.body.classList.add("android-fullscreen-mode");
        } else {
          document.documentElement.classList.remove("android-fullscreen-mode");
          document.body.classList.remove("android-fullscreen-mode");
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return { isAndroid, isMobile };
}
