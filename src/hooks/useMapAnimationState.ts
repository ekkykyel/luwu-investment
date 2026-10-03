import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Safe helper to retrieve the raw MapLibre GL Map instance from various React ref or instance wrappers.
 * Handles:
 * 1. Direct MapLibre GL map instances (having .on, .flyTo, etc.)
 * 2. React refs (e.g. useRef<MapRef> -> ref.current)
 * 3. react-map-gl wrapper instances (having .getMap())
 * 4. null / undefined safely
 */
export function getMapInstance(mapRefOrInstance: any): any {
  if (!mapRefOrInstance) return null;
  const target = mapRefOrInstance.current !== undefined ? mapRefOrInstance.current : mapRefOrInstance;
  if (!target) return null;
  if (typeof target.getMap === 'function') {
    try {
      const inner = target.getMap();
      return inner || target;
    } catch (e) {
      return target;
    }
  }
  return target;
}

export interface UseMapAnimationStateOptions {
  /**
   * Duration in milliseconds that manualUserInteraction stays active after a mouse or touch event.
   * Defaults to 5000 ms (5 seconds).
   */
  interactionTimeoutMs?: number;
  /**
   * Optional custom callback when an automated animation attempt is blocked.
   */
  onBlockedAnimation?: (method: 'flyTo' | 'easeTo', args: any) => void;
}

export interface UseMapAnimationStateReturn {
  manualUserInteraction: boolean;
  triggerManualInteraction: () => void;
  wrapMapInstance: (map: any) => any;
}

/**
 * useMapAnimationState
 * 
 * Custom hook that monitors MapLibre user interaction events (mouse, touch, wheel, drag).
 * Sets a `manualUserInteraction` flag to `true` for 5 seconds after any interaction.
 * Explicitly intercepts and blocks any automated `flyTo` or `easeTo` calls on the MapLibre
 * instance when `manualUserInteraction` is false.
 */
export function useMapAnimationState(
  mapInstanceOrRef?: any,
  options: UseMapAnimationStateOptions = {}
): UseMapAnimationStateReturn {
  const { interactionTimeoutMs = 5000, onBlockedAnimation } = options;

  const [manualUserInteraction, setManualUserInteraction] = useState<boolean>(false);
  const manualInteractionRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger manual user interaction window for 5 seconds
  const triggerManualInteraction = useCallback(() => {
    manualInteractionRef.current = true;
    setManualUserInteraction(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      manualInteractionRef.current = false;
      setManualUserInteraction(false);
      timerRef.current = null;
    }, interactionTimeoutMs);
  }, [interactionTimeoutMs]);

  // Method to safely wrap and intercept flyTo / easeTo on a map instance
  const wrapMapInstance = useCallback((map: any) => {
    if (!map) return map;

    // Resolve MapLibre instance safely
    const rawMap = getMapInstance(map);
    if (!rawMap || typeof rawMap.on !== 'function') return map;

    // Prevent double-wrapping
    if (rawMap.__animationGuardAttached) {
      return map;
    }
    rawMap.__animationGuardAttached = true;

    // Store original functions
    const originalFlyTo = rawMap.flyTo?.bind(rawMap);
    const originalEaseTo = rawMap.easeTo?.bind(rawMap);

    if (originalFlyTo) {
      rawMap.flyTo = function (...args: any[]) {
        if (!manualInteractionRef.current) {
          console.warn('[useMapAnimationState] 🛑 Blocked automated flyTo: manualUserInteraction is false');
          if (onBlockedAnimation) {
            onBlockedAnimation('flyTo', args);
          }
          return rawMap;
        }
        return originalFlyTo(...args);
      };
    }

    if (originalEaseTo) {
      rawMap.easeTo = function (...args: any[]) {
        if (!manualInteractionRef.current) {
          console.warn('[useMapAnimationState] 🛑 Blocked automated easeTo: manualUserInteraction is false');
          if (onBlockedAnimation) {
            onBlockedAnimation('easeTo', args);
          }
          return rawMap;
        }
        return originalEaseTo(...args);
      };
    }

    return map;
  }, [onBlockedAnimation]);

  // Attach event listeners to the map and its canvas
  useEffect(() => {
    if (!mapInstanceOrRef) return;

    const rawMap = getMapInstance(mapInstanceOrRef);
    if (!rawMap || typeof rawMap.on !== 'function') return;

    // Wrap the map methods
    wrapMapInstance(rawMap);

    const handleUserInteraction = () => {
      triggerManualInteraction();
    };

    // MapLibre interaction events
    const mapEvents = [
      'mousedown',
      'mouseup',
      'click',
      'dblclick',
      'contextmenu',
      'touchstart',
      'touchend',
      'touchmove',
      'dragstart',
      'drag',
      'dragend',
      'wheel',
      'boxzoomstart'
    ];

    mapEvents.forEach((evt) => {
      try {
        rawMap.on(evt as any, handleUserInteraction);
      } catch (e) {
        // Ignore if unsupported event
      }
    });

    // Also attach to canvas DOM element to catch raw pointer/touch events
    let canvasEl: HTMLElement | null = null;
    try {
      canvasEl = rawMap.getCanvas ? rawMap.getCanvas() : null;
    } catch (e) {}

    const domEvents = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'wheel'];
    if (canvasEl) {
      domEvents.forEach((evt) => {
        try {
          canvasEl?.addEventListener(evt, handleUserInteraction, { passive: true });
        } catch (e) {}
      });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      mapEvents.forEach((evt) => {
        try {
          rawMap.off(evt as any, handleUserInteraction);
        } catch (e) {}
      });

      if (canvasEl) {
        domEvents.forEach((evt) => {
          try {
            canvasEl?.removeEventListener(evt, handleUserInteraction);
          } catch (e) {}
        });
      }
    };
  }, [mapInstanceOrRef, triggerManualInteraction, wrapMapInstance]);

  return {
    manualUserInteraction,
    triggerManualInteraction,
    wrapMapInstance
  };
}

export default useMapAnimationState;
