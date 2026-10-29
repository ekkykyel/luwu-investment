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

/**
 * Smart helper to scroll any target section or action result into the top of the Android viewport cleanly
 */
export function scrollElementIntoAndroidView(elementOrId: string | HTMLElement, offset: number = 72) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const targetTop = rect.top + scrollTop - offset;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: "smooth"
  });
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

    // Delegated click listener untuk memastikan setiap tombol navigasi/anchor pada Android
    // menempatkan hasil klik tepat pada posisi paling atas layar penuh
    const handleGlobalAndroidClick = (e: MouseEvent) => {
      if (!isMob && window.innerWidth > 768) return;

      const target = (e.target as HTMLElement)?.closest("a, button, [role='button'], [data-scroll-target]");
      if (!target) return;

      // Handle anchor links
      const href = target.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const targetId = href.substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          scrollElementIntoAndroidView(targetEl, 70);
        }
      }

      // Handle custom data-scroll-target
      const scrollTargetId = target.getAttribute("data-scroll-target");
      if (scrollTargetId) {
        const targetEl = document.getElementById(scrollTargetId);
        if (targetEl) {
          scrollElementIntoAndroidView(targetEl, 70);
        }
      }
    };

    window.addEventListener("click", handleGlobalAndroidClick, { passive: false });

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
      window.removeEventListener("click", handleGlobalAndroidClick);
    };
  }, []);

  return { isAndroid, isMobile, scrollElementIntoAndroidView };
}
