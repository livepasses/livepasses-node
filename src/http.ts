import type { ApiResponse, ApiPagedResponse, ApiError } from './types/common.js';
import { LivepassesError, createTypedError } from './errors.js';

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'PUT', 'DELETE']);

async function readEnvelope<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined; // empty or non-JSON body (a challenge 401, a proxy 502, a 204)
  }
}

function toError(response: Response, err?: ApiError): LivepassesError {
  return createTypedError(
    err?.message ?? `API request failed with status ${response.status}`,
    response.status,
    err?.code ?? 'GENERAL_ERROR',
    err?.details,
    parseRetryAfter(response),
    err?.fields,
  );
}

export interface HttpClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Internal HTTP client that wraps native fetch with:
 * - API key injection
 * - ApiResponse<T> envelope unwrapping
 * - Typed error mapping
 * - Automatic retry with exponential backoff for 429 and 5xx
 */
export class HttpClient {
  private readonly config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /**
   * Like get() but returns the full paginated response instead of unwrapping.
   */
  async getPaged<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiPagedResponse<T>> {
    return this.requestPaged<T>('GET', path, { params });
  }

  private async request<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
    const response = await this.fetchWithRetry(method, path, options);
    const json = await readEnvelope<ApiResponse<T>>(response);

    if (response.status >= 400 || (json !== undefined && !json.success)) {
      throw toError(response, json?.error);
    }

    return json?.data as T;
  }

  private async requestPaged<T>(method: string, path: string, options?: RequestOptions): Promise<ApiPagedResponse<T>> {
    const response = await this.fetchWithRetry(method, path, options);
    const json = await readEnvelope<ApiPagedResponse<T>>(response);

    if (response.status >= 400 || (json !== undefined && !json.success)) {
      throw toError(response, json?.error);
    }

    return json as ApiPagedResponse<T>;
  }

  private async fetchWithRetry(method: string, path: string, options?: RequestOptions): Promise<Response> {
    const url = this.buildUrl(path, options?.params);
    const headers: Record<string, string> = {
      'X-API-Key': this.config.apiKey,
      'Accept': 'application/json',
    };

    if (options?.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let lastError: Error | undefined;
    const maxAttempts = this.config.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: options?.signal ?? controller.signal,
        });

        clearTimeout(timeoutId);

        // Retry on 429 (rate limit)
        if (response.status === 429 && attempt < maxAttempts) {
          const retryAfter = parseRetryAfter(response);
          const delay = retryAfter ? retryAfter * 1000 : getBackoffDelay(attempt);
          await sleep(delay);
          continue;
        }

        // Retry on 5xx (server error) — only for idempotent methods, and fewer retries.
        // No SDK sends an Idempotency-Key, so the gate is the HTTP method alone.
        if (response.status >= 500 && IDEMPOTENT_METHODS.has(method.toUpperCase()) && attempt < Math.min(maxAttempts, 3)) {
          await sleep(getBackoffDelay(attempt));
          continue;
        }

        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err as Error;

        // Abort errors should not be retried
        if (lastError.name === 'AbortError') {
          throw new LivepassesError(
            `Request timed out after ${this.config.timeout}ms`,
            0,
            'TIMEOUT',
          );
        }

        // Network errors: retry
        if (attempt < maxAttempts) {
          await sleep(getBackoffDelay(attempt));
          continue;
        }
      }
    }

    throw new LivepassesError(
      lastError?.message ?? 'Request failed after retries',
      0,
      'NETWORK_ERROR',
    );
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const base = this.config.baseUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${cleanPath}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }
}

function parseRetryAfter(response: Response): number | undefined {
  const header = response.headers.get('Retry-After');
  if (!header) return undefined;
  const seconds = parseInt(header, 10);
  return isNaN(seconds) ? undefined : seconds;
}

function getBackoffDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s... with jitter
  const base = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
  const jitter = Math.random() * 500;
  return base + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
