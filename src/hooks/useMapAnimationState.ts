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
  const extractRealMap = (inst: any) => {
    if (!inst) return null;
    if (typeof inst.flyTo === 'function') return inst;
    if (typeof inst.getMap === 'function') {
      try {
        const raw = inst.getMap();
        if (raw && typeof raw.flyTo === 'function') return raw;
      } catch (e) {}
    }
    return null;
  };

  if (typeof idOrRef === 'string') {
    const inst = mapInstances.get(idOrRef) || (typeof window !== 'undefined' ? (window as any).globalLuwuMapInstance : null);
    return extractRealMap(inst);
  }
  if (idOrRef && idOrRef.current) {
    return extractRealMap(idOrRef.current);
  }
  if (idOrRef) {
    const real = extractRealMap(idOrRef);
    if (real) return real;
  }
  const defaultInst = mapInstances.get('default') || (typeof window !== 'undefined' ? (window as any).globalLuwuMapInstance : null);
  return extractRealMap(defaultInst);
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
