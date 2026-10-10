import { GoogleGenAI } from "@google/genai";

/**
 * Centralized GeminiService Module
 * Manages an array of Gemini API keys (GEMINI_API_KEY_FIRST, GEMINI_API_KEY_2, etc.)
 * Implements automated load-balancing, rate-limit detection (429), and fail-fast key rotation fallback.
 */
export class GeminiService {
  private static instance: GeminiService | null = null;
  private keyCooldownMap: Map<string, number> = new Map();
  private permanentlyDeniedKeys: Set<string> = new Set();
  private currentKeyIndex: number = 0;

  /**
   * Default model candidate sequence for robust generation fallback
   */
  public readonly defaultModels: string[] = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest"
  ];

  /**
   * Built-in production safety net keys (dynamically empty to prevent leaked keys)
   */
  private readonly BUILTIN_FALLBACK_KEYS: string[] = [];

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
   * Priority: GEMINI_API_KEY_FIRST > GEMINI_API_KEY_2 > GEMINI_API_KEY > API_KEY > GEMINI_API_KEY_1..7
   */
  public getValidApiKeys(): string[] {
    const rawKeys: (string | undefined)[] = [];

    // 1. Check Node process environment
    if (typeof process !== "undefined" && process.env) {
      rawKeys.push(
        process.env.GEMINI_API_KEY_FIRST,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY,
        process.env.API_KEY,
        process.env.VITE_GEMINI_API_KEY,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY,
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
    return allKeys.filter((key) => {
      if (this.permanentlyDeniedKeys.has(key)) return false;
      const cooldownUntil = this.keyCooldownMap.get(key);
      return !cooldownUntil || now > cooldownUntil;
    });
  }

  public hasWorkingKey(): boolean {
    return this.getActiveApiKeys().length > 0;
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
    const key = apiKey || this.getActiveApiKeys()[0] || (typeof process !== "undefined" ? (process.env?.GEMINI_API_KEY || process.env?.API_KEY) : "") || "";
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
      throw new Error("Gemini AI rotational API keys are currently restricted or in standby mode.");
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
          console.log(
            `[GeminiService] Key ${maskedKey} hit quota limit. Activating cooldown & rotating...`
          );
          this.keyCooldownMap.set(currentKey, Date.now() + 60000);
        } else if (
          errMsg.includes("api key not valid") ||
          errMsg.includes("invalid key") ||
          errMsg.includes("api_key_invalid") ||
          errMsg.includes("leaked") ||
          errMsg.includes("reported as leaked") ||
          errMsg.includes("403") ||
          errMsg.includes("denied") ||
          errMsg.includes("permission_denied")
        ) {
          console.log(
            `[GeminiService] Key ${maskedKey} has API access restriction. Activating standby cooldown...`
          );
          this.permanentlyDeniedKeys.add(currentKey);
          this.keyCooldownMap.set(currentKey, Date.now() + 3600000);
        } else {
          console.log(
            `[GeminiService] Key ${maskedKey} request bypassed. Trying next key...`
          );
        }
      }
    }

    throw new Error("Gemini AI rotational API keys are currently restricted or in standby mode.");
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

        // Fail fast across models on quota/rate-limit/permission-denied so we rotate to the next API key immediately!
        if (
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("resource_exhausted") ||
          errMsg.includes("exceeded your current quota") ||
          errMsg.includes("api key not valid") ||
          errMsg.includes("invalid key") ||
          errMsg.includes("api_key_invalid") ||
          errMsg.includes("403") ||
          errMsg.includes("denied") ||
          errMsg.includes("permission_denied") ||
          errMsg.includes("leaked")
        ) {
          throw err;
        }
      }
    }

    throw lastModelError || new Error("All fallback models failed for current key.");
  }
}

export const geminiService = GeminiService.getInstance();
