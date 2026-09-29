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
  PushTemplatePassesParams,
  RedeemPassParams,
  PassRedemptionResult,
  CheckInParams,
  RedeemCouponParams,
  LoyaltyTransactionParams,
  RedeemGiftCardParams,
  MembershipCheckInParams,
  RedeemByScanParams,
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
   * Update fields on a single issued pass and push the change to the holder's wallet.
   *
   * @example
   * ```ts
   * await livepasses.passes.update(passId, {
   *   updatedFields: { points: 150, memberTier: 'Gold' },
   *   reason: 'Purchase reward',
   * });
   * ```
   */
  async update(passId: string, params: UpdatePassParams): Promise<void> {
    await this.http.put<unknown>(`/api/passes/${passId}`, params);
  }

  /**
   * Push a scoped update to all eligible passes of a template.
   */
  async pushTemplate(templateId: string, params: PushTemplatePassesParams): Promise<void> {
    await this.http.post<unknown>(`/api/passes/template/${templateId}/push`, params);
  }

  /**
   * Redeem a single-use pass.
   *
   * Redeeming is terminal, so a pass the holder is meant to keep using must not go through
   * here. Multi-use passes are refused with `422` / `OPERATION_NOT_ALLOWED` instead of being
   * consumed. Use the operation built for the type:
   *
   * - loyalty and stamp cards: {@link stamp} (and {@link unstamp} to undo)
   * - memberships: {@link membershipCheckIn}, which does not consume the pass
   * - coupons that allow multiple redemptions: {@link redeemCoupon}
   * - gift cards: {@link redeemGiftCard}, which takes the amount to deduct
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
   * Deduct an amount from a gift card's balance. Rejected when the amount exceeds the
   * remaining balance; the balance is left untouched in that case.
   */
  async redeemGiftCard(passId: string, params: RedeemGiftCardParams): Promise<PassRedemptionResult> {
    return this.http.post<PassRedemptionResult>(`/api/passes/${passId}/giftcard/redeem`, params);
  }

  /**
   * Check in a membership pass. Unlike an event check-in the pass is NOT consumed — it stays
   * valid for the next visit. On a quota-limited membership the remaining uses decrement and
   * a check-in at zero is denied.
   */
  async membershipCheckIn(
    passId: string,
    params?: MembershipCheckInParams,
  ): Promise<PassRedemptionResult> {
    return this.http.post<PassRedemptionResult>(`/api/passes/${passId}/membership/check-in`, params);
  }

  /**
   * Add one stamp to the stamp card behind this pass. Repeat stamps on the same card are
   * refused inside a short cooldown, so a double scan at the till does not award two stamps.
   */
  async stamp(passId: string): Promise<PassRedemptionResult> {
    // Sends {} deliberately: the endpoint binds a request DTO, and a POST with no body carries
    // no Content-Type, which FastEndpoints answers with 415 rather than treating as empty.
    return this.http.post<PassRedemptionResult>(`/api/passes/${passId}/stamp`, {});
  }

  /**
   * Take back the most recent stamp — the inverse of {@link stamp}, for correcting a mis-scan.
   * Refused when there is nothing to undo, or when the last stamp came from an external order.
   */
  async unstamp(passId: string): Promise<PassRedemptionResult> {
    // See stamp(): {} rather than no body, or the request-DTO endpoint answers 415.
    return this.http.post<PassRedemptionResult>(`/api/passes/${passId}/unstamp`, {});
  }

  /**
   * Resolve a scanned barcode or NFC tap value and redeem it in one call, so a scanner does
   * not need a separate lookup round-trip first.
   */
  async redeemByScan(params: RedeemByScanParams): Promise<PassRedemptionResult> {
    return this.http.post<PassRedemptionResult>('/api/passes/redeem-by-scan', params);
  }

  /**
   * Get the status of a batch pass generation operation.
   */
  async getBatchStatus(batchId: string): Promise<BatchStatusResult> {
    return this.http.get<BatchStatusResult>(`/api/passes/batch/${batchId}/status`);
  }
}
