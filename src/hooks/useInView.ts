import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  // Fallback: paksa visible setelah delay jika IO tidak trigger
  // Berguna untuk Android WebView yang buggy
  fallbackDelay?: number;
}

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
) {
  const {
    threshold = 0.05,           // Lebih rendah dari default Framer (0.1)
    rootMargin = "0px 0px -10% 0px", // Trigger lebih awal
    once = true,
    fallbackDelay = 800,        // ms — paksa visible jika IO tidak jalan
  } = options;

  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Deteksi apakah IntersectionObserver tersedia dan fungsional
    const ioSupported =
      typeof IntersectionObserver !== "undefined" &&
      typeof IntersectionObserver.prototype.observe === "function";

    // Fallback timer — Android WebView kadang punya IO yang tidak firing
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    if (fallbackDelay > 0) {
      fallbackTimer = setTimeout(() => {
        if (!hasTriggered) {
          setIsInView(true);
          setHasTriggered(true);
        }
      }, fallbackDelay);
    }

    if (!ioSupported) {
      // Jika IO tidak tersedia sama sekali, langsung visible
      setIsInView(true);
      setHasTriggered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setHasTriggered(true);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            if (once) observer.unobserve(element);
          } else if (!once) {
            setIsInView(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [threshold, rootMargin, once, fallbackDelay]);

  return { ref, isInView };
}
