import { GoogleGenAI } from "@google/genai";

/**
 * Centralized GeminiService Module
 * Manages an array of Gemini API keys (GEMINI_API_KEY_FIRST, GEMINI_API_KEY_2, etc.)
 * Implements automated load-balancing, rate-limit detection (429), and fail-fast key rotation fallback.
 */
export class GeminiService {
  private static instance: GeminiService | null = null;
  private keyCooldownMap: Map<string, number> = new Map();
  private currentKeyIndex: number = 0;

  /**
   * Default model candidate sequence for robust generation fallback
   */
  public readonly defaultModels: string[] = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-3.5-flash"
  ];

  /**
   * Built-in production safety net keys
   */
  private readonly BUILTIN_FALLBACK_KEYS = [
    "AIzaSyCex5xksiwafLPGbf6FJKaNZvSyRShqgTM", // Primary Built-in Fallback
    "AIzaSyDvtN4VPcJEuYJZ2MVdAK0YV8gShz9VH6g"  // Secondary Built-in Fallback
  ];

  private constructor() {}

  /**
   * Singleton instance accessor
   */
  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Retrieves all configured and valid Gemini API keys in priority order.
   * Priority: GEMINI_API_KEY_FIRST > GEMINI_API_KEY_2 > GEMINI_API_KEY > GEMINI_API_KEY_1..7 > Built-in Fallbacks
   */
  public getValidApiKeys(): string[] {
    const rawKeys: (string | undefined)[] = [];

    // 1. Check Node process environment
    if (typeof process !== "undefined" && process.env) {
      rawKeys.push(
        process.env.GEMINI_API_KEY_FIRST,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY_5,
        process.env.GEMINI_API_KEY_6,
        process.env.GEMINI_API_KEY_7
      );
    }

    // 2. Check Vite client-side environment if running in browser context
    try {
      if (typeof import.meta !== "undefined" && (import.meta as any)?.env) {
        const viteEnv = (import.meta as any).env;
        rawKeys.push(
          viteEnv.VITE_GEMINI_API_KEY_FIRST,
          viteEnv.VITE_GEMINI_API_KEY_2,
          viteEnv.VITE_GEMINI_API_KEY,
          viteEnv.VITE_GEMINI_API_KEY_1,
          viteEnv.VITE_GEMINI_API_KEY_3,
          viteEnv.VITE_GEMINI_API_KEY_4,
          viteEnv.VITE_GEMINI_API_KEY_5,
          viteEnv.VITE_GEMINI_API_KEY_6,
          viteEnv.VITE_GEMINI_API_KEY_7
        );
      }
    } catch {
      // Ignore if import.meta is unavailable
    }

    // 3. Built-in Production Fallback Keys
    rawKeys.push(...this.BUILTIN_FALLBACK_KEYS);

    // Filter valid non-empty Google API keys (supporting both AIza and AQ. key prefixes)
    const validKeys = rawKeys.filter((key): key is string =>
      Boolean(
        key &&
        typeof key === "string" &&
        (key.startsWith("AIza") || key.startsWith("AQ.")) &&
        key !== "MY_GEMINI_API_KEY" &&
        key.trim() !== ""
      )
    );

    // Deduplicate preserving priority order
    return Array.from(new Set(validKeys));
  }

  /**
   * Retrieves active API keys that are not currently in cooldown status.
   */
  public getActiveApiKeys(): string[] {
    const allKeys = this.getValidApiKeys();
    const now = Date.now();
    const activeKeys = allKeys.filter((key) => {
      const cooldownUntil = this.keyCooldownMap.get(key);
      return !cooldownUntil || now > cooldownUntil;
    });

    // If all keys are in cooldown, fallback to trying all valid keys
    return activeKeys.length > 0 ? activeKeys : allKeys;
  }

  /**
   * Masks key for secure console logging
   */
  public maskKey(key: string): string {
    if (!key || key.length < 8) return "INVALID_KEY";
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  }

  /**
   * Obtains a GoogleGenAI SDK client initialized with the primary active key
   */
  public getClient(apiKey?: string): GoogleGenAI {
    const key = apiKey || this.getActiveApiKeys()[0] || this.BUILTIN_FALLBACK_KEYS[0];
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build-gemini-service",
        },
      },
    });
  }

  /**
   * Generates content with model candidate fallback and automated API key rotation when a 429 Rate Limit occurs.
   */
  public async generateContent(
    params: { contents: any; config?: any },
    modelsToTry: string[] = this.defaultModels
  ): Promise<any> {
    const activeKeys = this.getActiveApiKeys();

    if (activeKeys.length === 0) {
      throw new Error("🚨 [GeminiService] No valid Gemini API keys configured.");
    }

    let lastError: any = null;
    const attemptsCount = activeKeys.length;

    for (let attempt = 0; attempt < attemptsCount; attempt++) {
      const activeIndex = (this.currentKeyIndex + attempt) % activeKeys.length;
      const currentKey = activeKeys[activeIndex];
      const maskedKey = this.maskKey(currentKey);

      try {
        const client = new GoogleGenAI({
          apiKey: currentKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build-gemini-service",
            },
          },
        });

        const response = await this.runWithModels(client, params, modelsToTry);

        // Advance key rotation index on success for load balancing
        this.currentKeyIndex = (activeIndex + 1) % activeKeys.length;
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();

        // 429 Rate Limit / Quota Exceeded Detection
        if (
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("resource_exhausted") ||
          errMsg.includes("exceeded your current quota") ||
          errMsg.includes("rate_limit_exceeded")
        ) {
          console.warn(
            `⚠️ [GeminiService 429 Rate Limit] Key ${maskedKey} hit quota limit. Activating 60s cooldown & rotating to fallback key...`
          );
          this.keyCooldownMap.set(currentKey, Date.now() + 60000);
        } else if (
          errMsg.includes("api key not valid") ||
          errMsg.includes("invalid key") ||
          errMsg.includes("api_key_invalid") ||
          errMsg.includes("leaked") ||
          errMsg.includes("reported as leaked")
        ) {
          console.warn(
            `⛔ [GeminiService Invalid Key] Key ${maskedKey} is invalid. Activating 1h cooldown & rotating...`
          );
          this.keyCooldownMap.set(currentKey, Date.now() + 3600000);
        } else {
          console.error(
            `🚨 [GeminiService Exception] Key ${maskedKey} failed: ${err?.message || err}. Trying next key...`
          );
        }
      }
    }

    throw (
      lastError ||
      new Error("🚨 [GeminiService] All rotational API keys and fallback models failed.")
    );
  }

  /**
   * Generates text embeddings with automated API key rotation fallback
   */
  public async embedContent(params: { contents: any; model?: string }): Promise<any> {
    const activeKeys = this.getActiveApiKeys();
    const model = params.model || "text-embedding-004";
    let lastError: any = null;

    for (const currentKey of activeKeys) {
      try {
        const client = new GoogleGenAI({
          apiKey: currentKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build-gemini-service",
            },
          },
        });

        const response = await client.models.embedContent({
          model,
          contents: params.contents,
        });

        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();
        const maskedKey = this.maskKey(currentKey);

        if (
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("resource_exhausted")
        ) {
          console.warn(
            `⚠️ [GeminiService Embed 429] Key ${maskedKey} hit rate limit. Rotating...`
          );
          this.keyCooldownMap.set(currentKey, Date.now() + 60000);
        }
      }
    }

    throw lastError || new Error("🚨 [GeminiService] Embeddings generation failed across all API keys.");
  }

  /**
   * Internal model execution loop for a specific SDK client instance
   */
  private async runWithModels(
    client: GoogleGenAI,
    params: { contents: any; config?: any },
    modelsToTry: string[]
  ): Promise<any> {
    let lastModelError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastModelError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();

        // Fail fast across models on quota/rate-limit so we rotate to the next API key immediately!
        if (
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("resource_exhausted") ||
          errMsg.includes("exceeded your current quota") ||
          errMsg.includes("api key not valid") ||
          errMsg.includes("invalid key") ||
          errMsg.includes("api_key_invalid")
        ) {
          throw err;
        }
      }
    }

    throw lastModelError || new Error("All fallback models failed for current key.");
  }
}

export const geminiService = GeminiService.getInstance();
