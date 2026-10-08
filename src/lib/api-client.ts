import { z } from "zod";
import { getEnv } from "@/config/env";

/**
 * API Error Model
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown,
    public correlationId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  schema?: z.ZodSchema<unknown>;
  retries?: number;
}

/**
 * API Client Boundary
 * 
 * Formal interface for all external data requests.
 * Handles timeouts, retries, correlation IDs, and Zod validation.
 */
export async function apiClient<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  options: ApiRequestOptions = {}
): Promise<T> {
  const env = getEnv();
  const { 
    timeout = env.API_TIMEOUT, 
    retries = env.API_RETRY_COUNT, 
    ...fetchOptions 
  } = options;
  
  const API_BASE_URL = env.NEXT_PUBLIC_API_URL;
  const correlationId = crypto.randomUUID();
  
  let attempt = 0;
  
  const execute = async (): Promise<T> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const url = `${API_BASE_URL}/${env.API_VERSION}${endpoint}`;
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-ID": correlationId,
          "X-API-Version": env.API_VERSION,
          ...fetchOptions.headers,
        },
      });
      clearTimeout(id);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new ApiError(
          (errorData.message as string) || `Request failed with status ${response.status}`,
          response.status,
          errorData,
          correlationId
        );
      }

      const data = await response.json();
      
      // Runtime data validation
      const validation = schema.safeParse(data);
      if (!validation.success) {
        // Phase 8.2: `.format()` → `.issues` — see the identical
        // reasoning in config/env.ts's Phase 8.2 comment.
        console.error(`API Validation Error [${correlationId}]:`, validation.error.issues);
        throw new ApiError("Invalid response format from server", response.status, data, correlationId);
      }

      return validation.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      const isTimeout = error instanceof Error && error.name === "AbortError";
      
      if (attempt < retries && !isTimeout) {
        attempt++;
        return execute();
      }

      throw new ApiError(
        isTimeout ? "Request timed out" : (error instanceof Error ? error.message : "Unknown network error"),
        undefined,
        undefined,
        correlationId
      );
    }
  };

  return execute();
}
