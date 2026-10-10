import { useState, useRef, useEffect, useCallback } from 'react';

// Global weak map cache for Maplibre instances
const mapInstances = new Map<string, any>();

export function registerMapInstance(id: string, instance: any) {
  mapInstances.set(id, instance);
}

export function unregisterMapInstance(id: string) {
  mapInstances.delete(id);
}

export function getMapInstance(idOrRef: any = 'default') {
  if (typeof idOrRef === 'string') {
    return mapInstances.get(idOrRef) || (typeof window !== 'undefined' ? (window as any).globalLuwuMapInstance : null);
  }
  if (idOrRef && idOrRef.current) {
    const curr = idOrRef.current;
    if (typeof curr.getMap === 'function') {
      try {
        const rawMap = curr.getMap();
        if (rawMap) return rawMap;
      } catch (e) {}
    }
    return curr;
  }
  if (idOrRef && typeof idOrRef.getMap === 'function') {
    try {
      const rawMap = idOrRef.getMap();
      if (rawMap) return rawMap;
    } catch (e) {}
    return idOrRef;
  }
  return idOrRef || mapInstances.get('default') || (typeof window !== 'undefined' ? (window as any).globalLuwuMapInstance : null);
}

export function useMapAnimationState(mapRef?: React.RefObject<any>) {
  const [manualUserInteraction, setManualUserInteraction] = useState(false);
  const interactionTimerRef = useRef<any>(null);

  const triggerManualInteraction = useCallback((cooldownMs: number = 8000) => {
    setManualUserInteraction(true);
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = setTimeout(() => {
      setManualUserInteraction(false);
    }, cooldownMs);
  }, []);

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
    };
  }, []);

  return {
    manualUserInteraction,
    triggerManualInteraction,
    setManualUserInteraction
  };
}

export default useMapAnimationState;
