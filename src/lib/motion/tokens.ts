/**
 * Centralized Motion Tokens for Pemkab Luwu Apps
 * (Invest Luwu & Portal MPP Simpurusiang)
 * 
 * Strict Budget:
 * - Max 1 ambient animation per viewport
 * - Fast: 150ms | Base: 250ms | Slow: 400ms
 * - Easing: easeOut / easeInOut (No bounce/elastic)
 * - GPU Accelerated only (transform & opacity)
 */

export const MOTION_DURATIONS = {
  fast: 0.15,   // 150ms - Micro-interactions (hover, active, icons)
  base: 0.25,   // 250ms - Component transitions, tab switches, reveals
  slow: 0.40,   // 400ms - Section entrance, modal transitions
  hero: 0.60,   // 600ms - Grand hero entrance (once only)
  ambient: 20,  // 20s - Slow Ken Burns / Aurora blobs
} as const;

export const MOTION_EASINGS = {
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  linear: [0, 0, 1, 1] as [number, number, number, number],
} as const;

export const MOTION_PRESETS = {
  calm: {
    yOffset: 12,
    stagger: 0.06, // 60ms
    duration: MOTION_DURATIONS.base,
    ease: MOTION_EASINGS.easeOut,
  },
  precise: {
    yOffset: 8,
    stagger: 0.05, // 50ms - Sharp & analytical for Invest Luwu
    duration: MOTION_DURATIONS.base,
    ease: MOTION_EASINGS.easeOut,
  },
  dynamic: {
    yOffset: 16,
    stagger: 0.08, // 80ms
    duration: MOTION_DURATIONS.base,
    ease: MOTION_EASINGS.easeOut,
  },
} as const;

export const COUNT_UP_THRESHOLD = 20;
