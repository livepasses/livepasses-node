import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Livepasses } from '../../src/client.js';
import {
  mockApiResponse,
  mockPagedResponse,
  mockPassGenerationResult,
  mockBatchGenerationResult,
  mockBatchStatusProcessing,
  mockBatchStatusCompleted,
  mockPassLookup,
  mockPassValidation,
  mockRedemptionResult,
  mockGlobalPass,
} from '../mocks/responses.js';

describe('PassesResource', () => {
  let client: Livepasses;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new Livepasses('test-key', { baseUrl: 'https://test.api.com', maxRetries: 0 });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockFetchResponse(body: unknown, status = 200) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status,
      json: () => Promise.resolve(body),
      headers: new Headers(),
    });
  }

  describe('generate', () => {
    it('should generate a single pass synchronously', async () => {
      mockFetchResponse(mockApiResponse(mockPassGenerationResult));

      const result = await client.passes.generate({
        templateId: 'template-001',
        passes: [{
          customer: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
          businessData: { sectionInfo: 'A', rowInfo: '12', seatNumber: '5' },
        }],
      });

      expect(result.isAsyncProcessing).toBe(false);
      expect(result.passes).toHaveLength(1);
      expect(result.passes[0].id).toBe('pass-001');
    });
  });

  describe('generateAndWait', () => {
    it('should return immediately for sync generation', async () => {
      mockFetchResponse(mockApiResponse(mockPassGenerationResult));

      const result = await client.passes.generateAndWait({
        templateId: 'template-001',
        passes: [{
          customer: { firstName: 'Jane', lastName: 'Doe' },
          businessData: {},
        }],
      });

      expect(result.isAsyncProcessing).toBe(false);
      expect(result.passes).toHaveLength(1);
    });

    it('should poll until batch is complete for async generation', async () => {
      const fetchMock = vi.fn()
        // First call: generate returns async
        .mockResolvedValueOnce({
          status: 200,
          json: () => Promise.resolve(mockApiResponse(mockBatchGenerationResult)),
          headers: new Headers(),
        })
        // Second call: polling - still processing
        .mockResolvedValueOnce({
          status: 200,
          json: () => Promise.resolve(mockApiResponse(mockBatchStatusProcessing)),
          headers: new Headers(),
        })
        // Third call: polling - completed
        .mockResolvedValueOnce({
          status: 200,
          json: () => Promise.resolve(mockApiResponse(mockBatchStatusCompleted)),
          headers: new Headers(),
        });

      globalThis.fetch = fetchMock;

      const progressCalls: number[] = [];
      const result = await client.passes.generateAndWait(
        {
          templateId: 'template-001',
          passes: Array.from({ length: 5 }, () => ({
            customer: { firstName: 'Test', lastName: 'User' },
            businessData: {},
          })),
        },
        {
          pollInterval: 10, // Fast polling for tests
          onProgress: (status) => progressCalls.push(status.progressPercentage),
        },
      );

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.batchId).toBe('batch-002');
      expect(result.passes).toHaveLength(2); // from mockBatchStatusCompleted.generatedPasses
      expect(progressCalls).toEqual([40, 100]);
    });
  });

  describe('list', () => {
    it('should list passes with pagination', async () => {
      mockFetchResponse(mockPagedResponse([mockGlobalPass], 1));

      const result = await client.passes.list({ page: 1, pageSize: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
    });
  });

  describe('lookup', () => {
    it('should look up a pass by ID', async () => {
      mockFetchResponse(mockApiResponse(mockPassLookup));

      const result = await client.passes.lookup({ passId: 'pass-001' });
      expect(result.passId).toBe('pass-001');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validate', () => {
    it('should validate a pass', async () => {
      mockFetchResponse(mockApiResponse(mockPassValidation));

      const result = await client.passes.validate('pass-001');
      expect(result.canBeRedeemed).toBe(true);
      expect(result.verificationMethods).toContain('qr');
    });
  });

  describe('redeem', () => {
    it('should redeem a pass', async () => {
      mockFetchResponse(mockApiResponse(mockRedemptionResult));

      const result = await client.passes.redeem('pass-001');
      expect(result.newStatus).toBe('Redeemed');
      expect(result.alreadyRedeemed).toBe(false);
    });
  });

  describe('checkIn', () => {
    it('should check in an event pass', async () => {
      mockFetchResponse(mockApiResponse(mockRedemptionResult));

      const result = await client.passes.checkIn('pass-001', {
        location: { name: 'Main Gate', latitude: 4.6, longitude: -74.0 },
      });
      expect(result.passId).toBe('pass-001');
    });
  });

  describe('loyaltyTransact', () => {
    it('should earn loyalty points', async () => {
      mockFetchResponse(mockApiResponse(mockRedemptionResult));

      const result = await client.passes.loyaltyTransact('pass-001', {
        transactionType: 'earn',
        points: 100,
        description: 'Purchase reward',
      });
      expect(result.passId).toBe('pass-001');
    });
  });

  describe('getBatchStatus', () => {
    it('should get batch status', async () => {
      mockFetchResponse(mockApiResponse(mockBatchStatusCompleted));

      const result = await client.passes.getBatchStatus('batch-002');
      expect(result.isCompleted).toBe(true);
      expect(result.passesGenerated).toBe(5);
    });
  });

  describe('redeemGiftCard', () => {
    it('should post the deduction to the giftcard redeem route', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(mockApiResponse(mockRedemptionResult)),
        headers: new Headers(),
      });
      globalThis.fetch = fetchMock;

      const result = await client.passes.redeemGiftCard('pass-001', { amount: 25, reason: 'Purchase' });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/api/passes/pass-001/giftcard/redeem');
      expect(JSON.parse(init.body)).toEqual({ amount: 25, reason: 'Purchase' });
      expect(result.passId).toBe('pass-001');
    });
  });

  describe('membershipCheckIn', () => {
    it('should check in a membership pass', async () => {
      mockFetchResponse(mockApiResponse(mockRedemptionResult));

      const result = await client.passes.membershipCheckIn('pass-001', { gate: 'Main Entrance' });
      expect(result.passId).toBe('pass-001');
    });
  });

  describe('stamp / unstamp', () => {
    // The endpoints bind a request DTO. A POST with no body carries no Content-Type, which
    // FastEndpoints answers with 415 — so both must send an empty object, not nothing.
    it('should send an empty body rather than none', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(mockApiResponse(mockRedemptionResult)),
        headers: new Headers(),
      });
      globalThis.fetch = fetchMock;

      await client.passes.stamp('pass-001');
      const [stampUrl, stampInit] = fetchMock.mock.calls[0];
      expect(stampUrl).toContain('/api/passes/pass-001/stamp');
      expect(stampInit.body).toBe('{}');
      expect(stampInit.headers['Content-Type']).toBe('application/json');

      await client.passes.unstamp('pass-001');
      const [unstampUrl, unstampInit] = fetchMock.mock.calls[1];
      expect(unstampUrl).toContain('/api/passes/pass-001/unstamp');
      expect(unstampInit.body).toBe('{}');
    });
  });

  describe('redeemByScan', () => {
    it('should post the scanned value to the resolve-and-redeem route', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(mockApiResponse(mockRedemptionResult)),
        headers: new Headers(),
      });
      globalThis.fetch = fetchMock;

      await client.passes.redeemByScan({ scannedValue: 'LP:abc', redemptionMethod: 'nfc' });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/api/passes/redeem-by-scan');
      expect(JSON.parse(init.body).scannedValue).toBe('LP:abc');
    });
  });
});
