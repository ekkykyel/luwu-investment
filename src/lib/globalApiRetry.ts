/**
 * Global Exponential Backoff & Request Deduplication Utility
 * Protects against HTTP 429 Too Many Requests, transient network drops, and dev-server rate limits.
 */

const pendingRequestsCache = new Map<string, Promise<any>>();

export interface FetchRetryOptions extends RequestInit {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  timeoutMs?: number;
  deduplicateKey?: string;
}

/**
 * Universal fetch with exponential backoff, jitter, Retry-After header support, and request deduplication.
 */
export async function safeFetchWithBackoff<T = Response>(
  url: string,
  options: FetchRetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 4,
    initialDelayMs = 400,
    maxDelayMs = 8000,
    backoffFactor = 2,
    timeoutMs = 30000,
    deduplicateKey,
    ...fetchOptions
  } = options;

  const method = (fetchOptions.method || 'GET').toUpperCase();
  const cacheKey = deduplicateKey || (method === 'GET' ? url : null);

  if (cacheKey && pendingRequestsCache.has(cacheKey)) {
    return pendingRequestsCache.get(cacheKey) as Promise<T>;
  }

  const executeFetch = async (attempt = 0, currentDelay = initialDelayMs): Promise<any> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Handle 429 Too Many Requests or 5xx Server Errors
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          let retryDelay = currentDelay;
          const retryAfter = response.headers ? response.headers.get('retry-after') : null;
          if (retryAfter) {
            const parsedSeconds = parseInt(retryAfter, 10);
            if (!isNaN(parsedSeconds)) {
              retryDelay = Math.max(retryDelay, parsedSeconds * 1000);
            }
          } else {
            // Exponential backoff with jitter
            retryDelay = Math.min(
              maxDelayMs,
              retryDelay * Math.pow(backoffFactor, attempt) + Math.random() * 250
            );
          }

          console.warn(
            `[safeFetchWithBackoff] HTTP ${response.status} for ${url}. Retrying attempt ${attempt + 1}/${maxRetries} in ${Math.round(retryDelay)}ms...`
          );

          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return executeFetch(attempt + 1, currentDelay * backoffFactor);
        }
      }

      return response;
    } catch (error: any) {
      clearTimeout(timer);
      if (attempt < maxRetries) {
        const retryDelay = Math.min(
          maxDelayMs,
          currentDelay * Math.pow(backoffFactor, attempt) + Math.random() * 250
        );
        console.warn(
          `[safeFetchWithBackoff] Network error for ${url}. Retrying attempt ${attempt + 1}/${maxRetries} in ${Math.round(retryDelay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return executeFetch(attempt + 1, currentDelay * backoffFactor);
      }

      throw error;
    }
  };

  const promise = executeFetch().finally(() => {
    if (cacheKey) {
      setTimeout(() => pendingRequestsCache.delete(cacheKey), 300);
    }
  });

  if (cacheKey) {
    pendingRequestsCache.set(cacheKey, promise);
  }

  return promise as Promise<T>;
}
