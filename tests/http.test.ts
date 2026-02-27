import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../src/http.js';
import { LivepassesError, AuthenticationError, NotFoundError, RateLimitError, ValidationError } from '../src/errors.js';

describe('HttpClient', () => {
  let client: HttpClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new HttpClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.livepasses.com',
      timeout: 5000,
      maxRetries: 2,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockFetch(response: { status: number; body: unknown; headers?: Record<string, string> }) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: response.status,
      json: () => Promise.resolve(response.body),
      headers: new Headers(response.headers ?? {}),
    });
  }

  it('should send GET request with API key header', async () => {
    mockFetch({
      status: 200,
      body: { success: true, data: { id: '123' } },
    });

    const result = await client.get<{ id: string }>('/api/test');

    expect(result).toEqual({ id: '123' });
    expect(globalThis.fetch).toHaveBeenCalledOnce();

    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.livepasses.com/api/test');
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>)['X-API-Key']).toBe('test-api-key');
  });

  it('should send POST request with JSON body', async () => {
    mockFetch({
      status: 200,
      body: { success: true, data: { created: true } },
    });

    const result = await client.post<{ created: boolean }>('/api/test', { name: 'Test' });

    expect(result).toEqual({ created: true });
    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"Test"}');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('should serialize query params for GET requests', async () => {
    mockFetch({
      status: 200,
      body: { success: true, data: [] },
    });

    await client.get('/api/test', { page: 1, status: 'active', unused: undefined });

    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get('page')).toBe('1');
    expect(parsedUrl.searchParams.get('status')).toBe('active');
    expect(parsedUrl.searchParams.has('unused')).toBe(false);
  });

  it('should unwrap ApiResponse and return data', async () => {
    mockFetch({
      status: 200,
      body: { success: true, data: { count: 42 }, message: 'OK' },
    });

    const result = await client.get<{ count: number }>('/api/test');
    expect(result).toEqual({ count: 42 });
  });

  it('should throw AuthenticationError for UNAUTHORIZED code', async () => {
    mockFetch({
      status: 401,
      body: { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
    });

    await expect(client.get('/api/test')).rejects.toThrow(AuthenticationError);
    await expect(client.get('/api/test')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });
  });

  it('should throw NotFoundError for NOT_FOUND code', async () => {
    mockFetch({
      status: 404,
      body: { success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } },
    });

    await expect(client.get('/api/test')).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError for VALIDATION_ERROR code', async () => {
    mockFetch({
      status: 400,
      body: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } },
    });

    await expect(client.post('/api/test', {})).rejects.toThrow(ValidationError);
  });

  it('should throw RateLimitError with retryAfter for 429', async () => {
    // Use a client with no retries so the test doesn't wait for backoff
    const noRetryClient = new HttpClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.livepasses.com',
      timeout: 5000,
      maxRetries: 0,
    });

    mockFetch({
      status: 429,
      body: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
      headers: { 'Retry-After': '30' },
    });

    try {
      await noRetryClient.get('/api/test');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfter).toBe(30);
    }
  });

  it('should retry on 5xx and eventually succeed', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        status: 500,
        json: () => Promise.resolve({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'fail' } }),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ success: true, data: { ok: true } }),
        headers: new Headers(),
      });

    globalThis.fetch = fetchMock;

    const result = await client.get<{ ok: boolean }>('/api/test');
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should return paged response for getPaged', async () => {
    mockFetch({
      status: 200,
      body: {
        success: true,
        items: [{ id: '1' }, { id: '2' }],
        pagination: { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 2 },
      },
    });

    const result = await client.getPaged<{ id: string }>('/api/test');
    expect(result.items).toHaveLength(2);
    expect(result.pagination.totalItems).toBe(2);
  });

  it('should throw LivepassesError on timeout', async () => {
    // Create client with very short timeout
    const fastClient = new HttpClient({
      apiKey: 'test',
      baseUrl: 'https://api.livepasses.com',
      timeout: 1, // 1ms
      maxRetries: 0,
    });

    globalThis.fetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init.signal;
        if (signal) {
          signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    });

    await expect(fastClient.get('/api/test')).rejects.toThrow(LivepassesError);
    await expect(fastClient.get('/api/test')).rejects.toMatchObject({ code: 'TIMEOUT' });
  });
});
