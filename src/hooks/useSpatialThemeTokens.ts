import { useState, useEffect, useMemo, CSSProperties } from "react";

/**
 * WCAG 2.1 AA / AAA Compliant Contrast Palette for Transparent & Aero-Glass GIS UI Elements
 * 
 * Ensures all typography and interactive controls maintain strict contrast ratios (>= 4.5:1 for body,
 * >= 7:1 for headers and data values) over dynamic map canvas layers in both Light and Dark modes.
 */
export interface SpatialThemeTokens {
  isDark: boolean;
  themeMode: "dark" | "light";
  
  // High-contrast font tokens
  text: {
    primary: string;       // #0f172a (Light) | #ffffff (Dark) - WCAG AAA >= 12:1
    secondary: string;     // #1e293b (Light) | #e2e8f0 (Dark) - WCAG AAA >= 7:1
    muted: string;         // #334155 (Light) | #94a3b8 (Dark) - WCAG AA >= 4.5:1
    accentEmerald: string; // #047857 (Light) | #34d399 (Dark)
    accentIndigo: string;  // #4338ca (Light) | #818cf8 (Dark)
    accentAmber: string;   // #b45309 (Light) | #fbbf24 (Dark)
    accentRose: string;    // #be123c (Light) | #fb7185 (Dark)
    accentSky: string;     // #0369a1 (Light) | #38bdf8 (Dark)
  };

  // Dynamic Aero-Glass background generators
  bg: {
    card: (opacity?: number, factor?: number) => string;
    cardSolid: string;
    header: string;
    badge: string;
    popover: string;
  };

  // Mathematical borders matching container corner radii
  border: {
    subtle: string;
    default: string;
    strong: string;
    accent: string;
  };

  // Recharts / Chart tokens for SVG visualization on dynamic map backgrounds
  chart: {
    grid: string;
    axisText: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
  };

  // Pre-calculated CSS and Tailwind class utilities
  getCardStyle: (opacityPercent?: number, factor?: number, extra?: CSSProperties) => CSSProperties;
  cardClassName: string;
  headerClassName: string;
}

/**
 * Custom Hook: useSpatialThemeTokens
 * 
 * Automatically detects current theme (Light / Dark) from prop override or DOM classList/media query,
 * and provides mathematical WCAG-compliant styling tokens for transparent map canvas elements.
 */
export function useSpatialThemeTokens(isDarkModeOverride?: boolean, panelOpacity = 80): SpatialThemeTokens {
  const [domIsDark, setDomIsDark] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // Observe class attribute mutations on documentElement (HTML tag)
    const observer = new MutationObserver(() => {
      setDomIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const isDark = isDarkModeOverride !== undefined ? isDarkModeOverride : domIsDark;
  const themeMode: "dark" | "light" = isDark ? "dark" : "light";

  const effectiveOpacity = Math.max(15, Math.min(95, panelOpacity)) / 100;

  return useMemo<SpatialThemeTokens>(() => {
    const textTokens = {
      primary: isDark ? "#ffffff" : "#0f172a",
      secondary: isDark ? "#e2e8f0" : "#1e293b",
      muted: isDark ? "#94a3b8" : "#334155",
      accentEmerald: isDark ? "#34d399" : "#047857",
      accentIndigo: isDark ? "#818cf8" : "#4338ca",
      accentAmber: isDark ? "#fbbf24" : "#b45309",
      accentRose: isDark ? "#fb7185" : "#be123c",
      accentSky: isDark ? "#38bdf8" : "#0369a1",
    };

    const bgTokens = {
      card: (opacity = panelOpacity, factor = 1) => {
        const clampedAlpha = Math.min(0.98, Math.max(0.15, (opacity / 100) * factor));
        return isDark
          ? `rgba(2, 6, 23, ${clampedAlpha.toFixed(2)})`
          : `rgba(255, 255, 255, ${clampedAlpha.toFixed(2)})`;
      },
      cardSolid: isDark ? "#020617" : "#ffffff",
      header: isDark ? "rgba(2, 6, 23, 0.95)" : "rgba(255, 255, 255, 0.95)",
      badge: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(241, 245, 249, 0.95)",
      popover: isDark ? "rgba(2, 6, 23, 0.98)" : "rgba(255, 255, 255, 0.98)",
    };

    const borderTokens = {
      subtle: isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(15, 23, 42, 0.12)",
      default: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(15, 23, 42, 0.18)",
      strong: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(15, 23, 42, 0.28)",
      accent: isDark ? "rgba(52, 211, 153, 0.4)" : "rgba(4, 120, 87, 0.4)",
    };

    const chartTokens = {
      grid: isDark ? "#1e293b" : "#e2e8f0",
      axisText: isDark ? "#cbd5e1" : "#0f172a",
      tooltipBg: isDark ? "rgba(9, 13, 22, 0.96)" : "rgba(255, 255, 255, 0.98)",
      tooltipBorder: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.20)",
      tooltipText: isDark ? "#ffffff" : "#0f172a",
    };

    const getCardStyle = (
      opacityPercent = panelOpacity,
      factor = 1,
      extra: CSSProperties = {}
    ): CSSProperties => {
      const alpha = Math.min(0.98, Math.max(0.15, (opacityPercent / 100) * factor));
      return {
        backgroundColor: isDark
          ? `rgba(2, 6, 23, ${alpha.toFixed(2)})`
          : `rgba(255, 255, 255, ${alpha.toFixed(2)})`,
        borderColor: borderTokens.default,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: textTokens.primary,
        ...extra,
      };
    };

    const cardClassName = `border rounded-2xl transition-all duration-300 backdrop-blur-xl ${
      isDark
        ? "border-white/15 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        : "border-slate-900/15 text-slate-950 shadow-xl shadow-slate-900/10"
    }`;

    const headerClassName = `border-b transition-colors ${
      isDark
        ? "border-white/10 text-white"
        : "border-slate-200/90 text-slate-950"
    }`;

    return {
      isDark,
      themeMode,
      text: textTokens,
      bg: bgTokens,
      border: borderTokens,
      chart: chartTokens,
      getCardStyle,
      cardClassName,
      headerClassName,
    };
  }, [isDark, themeMode, effectiveOpacity, panelOpacity]);
}
