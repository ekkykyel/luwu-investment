import { useState, useEffect, useCallback, useRef } from "react";

export interface SpatialLayersData {
  investments: any[];
  districts: any[];
  villages: any[];
  infrastructure: any[];
  layers: any[];
}

export interface SpatialLayersState extends SpatialLayersData {
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  retryCount: number;
  retry: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 10000]; // Exponential backoff in ms
const FETCH_TIMEOUT_MS = 10000;

const EMPTY_SPATIAL_DATA: SpatialLayersData = {
  investments: [],
  districts: [],
  villages: [],
  infrastructure: [],
  layers: [],
};

export function useSpatialLayers(): SpatialLayersState {
  const [data, setData] = useState<SpatialLayersData>(EMPTY_SPATIAL_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  const retryCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const fetchData = useCallback(async (attempt = 0) => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/spatial-layers?format=object", {
        signal: controller.signal,
        headers: { 
          "Accept": "application/json",
          "Cache-Control": "no-cache",
        },
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Response format mismatch (${contentType || 'non-json'}) with status ${res.status}`);
      }

      let json: any = null;
      try {
        json = await res.json();
      } catch (parseErr) {
        throw new Error("Failed to parse spatial layers response as JSON");
      }

      if (!isMountedRef.current) return;

      if (Array.isArray(json)) {
        setData({
          investments: [],
          districts: [],
          villages: [],
          infrastructure: [],
          layers: json,
        });
      } else if (json && typeof json === "object") {
        setData({
          investments: Array.isArray(json.investments) ? json.investments : [],
          districts: Array.isArray(json.districts) ? json.districts : [],
          villages: Array.isArray(json.villages) ? json.villages : [],
          infrastructure: Array.isArray(json.infrastructure) ? json.infrastructure : [],
          layers: Array.isArray(json.layers) ? json.layers : [],
        });
      } else {
        setData(EMPTY_SPATIAL_DATA);
      }

      setIsLoading(false);
      retryCountRef.current = 0;
      setRetryCount(0);

    } catch (err) {
      clearTimeout(timeoutId);
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error(String(err));
      console.warn(`[useSpatialLayers] Attempt ${attempt + 1} failed:`, error.message);

      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt] ?? 10000;
        console.info(`[useSpatialLayers] Auto retrying in ${delay}ms...`);

        setTimeout(() => {
          if (isMountedRef.current) {
            retryCountRef.current = attempt + 1;
            setRetryCount(attempt + 1);
            fetchData(attempt + 1);
          }
        }, delay);
      } else {
        // Retries exhausted — set error state but keep safe empty data arrays
        setIsError(true);
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    }
  }, []);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    setRetryCount(0);
    fetchData(0);
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData(0);
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    ...data,
    isLoading,
    isError,
    errorMessage,
    retryCount,
    retry,
  };
}
