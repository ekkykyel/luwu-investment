import { useState, useRef, useCallback } from 'react';

const STORAGE_KEY = 'luwu_map_state';

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: 120.25,
  latitude: -3.15,
  zoom: 9.5,
  pitch: 30,
  bearing: 0
};

function isValidViewState(state: any): state is MapViewState {
  return (
    state &&
    typeof state.longitude === 'number' &&
    state.longitude >= -180 && state.longitude <= 180 &&
    typeof state.latitude === 'number' &&
    state.latitude >= -90 && state.latitude <= 90 &&
    typeof state.zoom === 'number' &&
    state.zoom >= 0 && state.zoom <= 24 &&
    typeof state.pitch === 'number' &&
    typeof state.bearing === 'number'
  );
}

export function useMapState() {
  const [viewState, setViewState] = useState<MapViewState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidViewState(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      undefined;
    }
    return DEFAULT_VIEW_STATE;
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateViewState = useCallback((newState: MapViewState) => {
    setViewState(newState);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        undefined;
      }
    }, 1000); // 1s debounce
  }, []);

  const resetViewState = useCallback(() => {
    setViewState(DEFAULT_VIEW_STATE);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VIEW_STATE));
    } catch (e) {
      // ignore
    }
  }, []);

  return { viewState, updateViewState, resetViewState };
}
