import type { HttpClient } from '../http.js';
import type { ApiPagedResponse } from '../types/common.js';
import type {
  GeneratePassesParams,
  PassGenerationResult,
  ListPassesParams,
  GlobalPassDto,
  LookupPassParams,
  PassLookupResult,
  PassValidationResult,
  UpdatePassParams,
  BulkUpdatePassesParams,
  RedeemPassParams,
  PassRedemptionResult,
  CheckInParams,
  RedeemCouponParams,
  LoyaltyTransactionParams,
  BatchStatusResult,
  GenerateAndWaitOptions,
} from '../types/passes.js';
import { pollUntilComplete } from '../utils/polling.js';
import { autoPaginate } from '../utils/pagination.js';

export class PassesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Generate passes for one or more recipients.
   * For a single recipient, the pass is returned synchronously.
   * For multiple recipients, returns immediately with a batchId — poll with `getBatchStatus()`.
   *
   * @see generateAndWait for an auto-polling helper
   */
  async generate(params: GeneratePassesParams): Promise<PassGenerationResult> {
    return this.http.post<PassGenerationResult>('/api/passes/generate', params);
  }

  /**
   * Generate passes and automatically poll until the batch is complete.
   * This is the recommended method for most use cases.
   *
   * For sync generation (1 recipient), returns immediately.
   * For async batches (>1 recipient), polls `getBatchStatus()` until done.
   */
  async generateAndWait(
    params: GeneratePassesParams,
    options?: GenerateAndWaitOptions,
  ): Promise<PassGenerationResult> {
    const result = await this.generate(params);

    if (!result.isAsyncProcessing) {
      return result;
    }

    const batchId = result.batchId;
    const batchStatus = await pollUntilComplete(
      () => this.getBatchStatus(batchId),
      (status) => status.isCompleted,
      {
        interval: options?.pollInterval ?? 2000,
        maxAttempts: options?.maxAttempts ?? 150,
        onProgress: options?.onProgress,
      },
    );

    // Merge batch status into the original result for a unified return
    return {
      ...result,
      passes: (batchStatus.generatedPasses ?? []).map((p) => ({
        id: p.id,
        customerEmail: p.holderEmail,
        confirmationCode: undefined,
        platforms: {
          apple: { available: p.hasApplePass, features: [] },
          google: { available: p.hasGooglePass, features: [] },
        },
        businessData: {},
        qrCode: undefined,
        status: p.status,
        analytics: undefined,
      })),
    };
  }

  /**
   * List passes (paginated).
   */
  async list(params?: ListPassesParams): Promise<ApiPagedResponse<GlobalPassDto>> {
    return this.http.getPaged<GlobalPassDto>('/api/passes', params as Record<string, string | number | boolean | undefined>);
  }

  /**
   * Auto-paginate through all passes matching the given filters.
   *
   * @example
   * ```ts
   * for await (const pass of livepasses.passes.listAutoPaginate({ templateId: '...' })) {
   *   console.log(pass.id);
   * }
   * ```
   */
  listAutoPaginate(params?: Omit<ListPassesParams, 'page'>): AsyncGenerator<GlobalPassDto, void, undefined> {
    return autoPaginate((page) =>
      this.list({ ...params, page }),
    );
  }

  /**
   * Look up a pass by ID or pass number.
   */
  async lookup(params: LookupPassParams): Promise<PassLookupResult> {
    return this.http.get<PassLookupResult>('/api/passes/lookup', params as Record<string, string | undefined>);
  }

  /**
   * Validate a pass before redemption.
   */
  async validate(passId: string): Promise<PassValidationResult> {
    return this.http.get<PassValidationResult>(`/api/passes/${passId}/validate`);
  }

  /**
   * Update a pass's business data.
   */
  async update(passId: string, params: UpdatePassParams): Promise<void> {
    await this.http.put<unknown>(`/api/passes/${passId}`, params);
  }

  /**
   * Bulk update multiple passes.
   */
  async bulkUpdate(params: BulkUpdatePassesParams): Promise<void> {
    await this.http.post<unknown>('/api/passes/bulk-update', params);
  }

  /**
   * Redeem a pass (generic redemption).
   */
  async redeem(passId: string, params?: RedeemPassParams): Promise<PassRedemptionResult> {
    return this.http.post<PassRedemptionResult>(`/api/passes/${passId}/redeem`, params);
  }

  /**
   * Check in an event pass.
   */
  async checkIn(passId: string, params?: CheckInParams): Promise<PassRedemptionResult> {
    return this.http.post<PassRedemptionResult>(`/api/passes/${passId}/check-in`, params);
  }

  /**
   * Redeem a coupon pass.
   */
  async redeemCoupon(passId: string, params?: RedeemCouponParams): Promise<PassRedemptionResult> {
    return this.http.post<PassRedemptionResult>(`/api/passes/${passId}/redeem-coupon`, params);
  }

  /**
   * Earn or spend loyalty points.
   */
  async loyaltyTransact(passId: string, params: LoyaltyTransactionParams): Promise<PassRedemptionResult> {
    return this.http.post<PassRedemptionResult>(`/api/passes/${passId}/loyalty/transact`, params);
  }

  /**
   * Get the status of a batch pass generation operation.
   */
  async getBatchStatus(batchId: string): Promise<BatchStatusResult> {
    return this.http.get<BatchStatusResult>(`/api/passes/batch/${batchId}/status`);
  }
}
