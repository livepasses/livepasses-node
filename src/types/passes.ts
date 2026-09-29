/**
 * Pass type definitions mirroring the Livepasses API DTOs.
 */

// ─── Request Types ───────────────────────────────────────────────

/** Parameters for generating passes via POST /api/passes/generate */
export interface GeneratePassesParams {
  /** Template ID to generate passes from */
  templateId: string;
  /** Business context for pass generation (template-type specific) */
  businessContext?: BusinessContext;
  /** Pass recipients with business data */
  passes: PassRecipient[];
  /** Generation options */
  options?: PassGenerationOptions;
}

/** Business context for pass generation - contains instance-specific data */
export interface BusinessContext {
  event?: EventContext;
  loyalty?: LoyaltyContext;
  coupon?: CouponContext;
}

export interface EventContext {
  eventName?: string;
  eventDate?: string;
  doorsOpen?: string;
  specialAnnouncement?: string;
}

export interface LoyaltyContext {
  programUpdate?: string;
  seasonalMessage?: string;
}

export interface CouponContext {
  campaignName?: string;
  specialMessage?: string;
  promotionStartDate?: string;
  promotionEndDate?: string;
}

/** A single pass recipient */
export interface PassRecipient {
  customer: CustomerInfo;
  businessData: BusinessData;
  personalizations?: PersonalizationData;
}

export interface CustomerInfo {
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredLanguage?: string;
}

/** Business data that adapts based on template type */
export interface BusinessData {
  // Event-specific
  sectionInfo?: string;
  rowInfo?: string;
  seatNumber?: string;
  gateInfo?: string;
  confirmationCode?: string;
  ticketType?: string;
  price?: number;
  currency?: string;

  // Loyalty-specific
  /**
   * Loyalty: identifies the member (max 50 chars, case-insensitive). An existing number links the
   * pass to that member; a new one creates a member; a number belonging to someone whose phone and
   * email both differ is refused with errorCode MEMBERSHIP_NUMBER_CONFLICT. Omit to have one generated.
   */
  membershipNumber?: string;
  currentPoints?: number;
  memberTier?: string;
  lifetimePoints?: number;
  accountBalance?: number;
  memberSince?: string;
  favoriteStore?: string;

  // Coupon-specific
  promoCode?: string;
  campaignId?: string;
  customerSegment?: string;
  maxUsageCount?: number;
  sourceChannel?: string;
}

export interface PersonalizationData {
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  customFields?: Record<string, string>;
}

export interface PassGenerationOptions {
  /** Delivery method: auto | email | sms | whatsapp | webhook | return_urls */
  deliveryMethod?: string;
  /** Generate for all platforms (Apple + Google). Defaults to true. */
  generateForAllPlatforms?: boolean;
}

// ─── Response Types ──────────────────────────────────────────────

/** Result from pass generation */
export interface PassGenerationResult {
  batchId: string;
  templateId: string;
  generatedAt: string;
  totalPasses: number;
  /** When true, poll getBatchStatus() for results */
  isAsyncProcessing: boolean;
  batchOperation?: BatchOperationInfo;
  /** Populated for sync generation, empty for async */
  passes: GeneratedPass[];
  delivery?: PassDeliveryResult;
  businessMetrics?: BusinessMetrics;
}

export interface BatchOperationInfo {
  id: string;
  status: string;
  totalRecipients: number;
  passesGenerated: number;
  generationFailures: number;
  progressPercentage: number;
  estimatedCompletion?: string;
  statusPollUrl: string;
}

export interface GeneratedPass {
  id: string;
  customerEmail?: string;
  confirmationCode?: string;
  platforms: PassPlatforms;
  businessData: UnifiedBusinessData;
  qrCode?: string;
  status: string;
  /** Present when status is "failed", e.g. "MEMBERSHIP_NUMBER_CONFLICT" */
  errorCode?: string;
  /** Present when status is "failed" */
  errorMessage?: string;
  analytics?: AnalyticsInfo;
}

export interface PassPlatforms {
  apple: PassPlatform;
  google: PassPlatform;
}

export interface PassPlatform {
  available: boolean;
  addToWalletUrl?: string;
  passUrl?: string;
  jwtToken?: string;
  features: string[];
}

export interface UnifiedBusinessData {
  // Event
  section?: string;
  row?: string;
  seat?: string;
  gate?: string;
  ticketType?: string;
  formattedPrice?: string;
  // Loyalty
  /**
   * Loyalty: identifies the member (max 50 chars, case-insensitive). An existing number links the
   * pass to that member; a new one creates a member; a number belonging to someone whose phone and
   * email both differ is refused with errorCode MEMBERSHIP_NUMBER_CONFLICT. Omit to have one generated.
   */
  membershipNumber?: string;
  currentPoints?: number;
  memberTier?: string;
  formattedBalance?: string;
  // Coupon
  promoCode?: string;
  discountDescription?: string;
  validityDescription?: string;
}

export interface PassDeliveryResult {
  method: string;
  status: string;
  sentAt: string;
  details: DeliveryDetail[];
}

export interface DeliveryDetail {
  recipient?: string;
  status: string;
}

export interface BusinessMetrics {
  totalRevenue?: number;
  averageTicketPrice?: number;
  seatDistribution?: Record<string, number>;
  tierDistribution?: Record<string, number>;
  revenueByCategory?: Record<string, number>;
}

export interface AnalyticsInfo {
  trackingId: string;
  engagementUrl: string;
}

// ─── Lookup & Validation ─────────────────────────────────────────

export interface PassLookupResult {
  passId: string;
  passNumber: string;
  templateId: string;
  templateName: string;
  templateType: string;
  holderName?: string;
  holderEmail?: string;
  status: string;
  isValid: boolean;
  canBeRedeemed: boolean;
  isExpired: boolean;
  validFrom?: string;
  validUntil?: string;
  redeemedAt?: string;
  generatedAt: string;
}

export interface PassValidationResult {
  passId: string;
  passNumber: string;
  status: string;
  canBeRedeemed: boolean;
  isExpired: boolean;
  validationMessage: string;
  templateType: string;
  holderName?: string;
  holderEmail?: string;
  validFrom?: string;
  validUntil?: string;
  verificationMethods: string[];
}

// ─── Redemption ──────────────────────────────────────────────────

export interface PassRedemptionResult {
  passId: string;
  passNumber: string;
  redeemedAt: string;
  redemptionMethod: string;
  previousStatus: string;
  newStatus: string;
  alreadyRedeemed: boolean;
}

export interface RedemptionLocation {
  name?: string;
  latitude?: number;
  longitude?: number;
}

// The redeem-family bodies below mirror the API's request DTOs exactly: the API answers 400 for
// any field it does not declare. There is no free-text `notes` field — put free text in
// `metadata`, which is recorded with the redemption.

export interface RedeemPassParams {
  /** Pass types this call may redeem; anything else is refused. */
  acceptedTypes?: string[];
  /** How the pass was presented. Defaults to `manual`. */
  redemptionMethod?: string;
  redemptionChannel?: string;
  location?: RedemptionLocation;
  confirmationCode?: string;
  /** Free-form string key/values recorded with the redemption. */
  metadata?: Record<string, string>;
}

export interface CheckInParams {
  /** Pass types this call may check in; anything else is refused. */
  acceptedTypes?: string[];
  gate?: string;
  section?: string;
  /** How the pass was presented. Defaults to `barcode_scan`. */
  redemptionMethod?: string;
  location?: RedemptionLocation;
  /** Free-form string key/values recorded with the check-in. */
  metadata?: Record<string, string>;
}

export interface RedeemCouponParams {
  /** Pass types this call may redeem; anything else is refused. */
  acceptedTypes?: string[];
  /** Defaults to `in_store`. */
  redemptionChannel?: string;
  location?: RedemptionLocation;
  locationId?: string;
  transactionAmount?: number;
  transactionCurrency?: string;
  promoCode?: string;
  redemptionMethod?: string;
  /** Free-form string key/values recorded with the redemption. */
  metadata?: Record<string, string>;
}

/** Deduct an amount from a gift card's balance. */
export interface RedeemGiftCardParams {
  amount: number;
  reason?: string;
  redemptionChannel?: string;
  location?: RedemptionLocation;
}

/** Check in a membership pass. Multi-use: the pass stays valid afterwards. */
export interface MembershipCheckInParams {
  gate?: string;
  redemptionMethod?: string;
  location?: RedemptionLocation;
}

/** Resolve a scanned barcode or NFC tap value and redeem it in one call. */
export interface RedeemByScanParams {
  scannedValue: string;
  redemptionMethod?: string;
  redemptionChannel?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, unknown>;
}

export interface LoyaltyTransactionParams {
  /** Transaction type: earn | spend */
  transactionType: 'earn' | 'spend';
  points: number;
  description?: string;
}

// ─── Update ──────────────────────────────────────────────────────

/**
 * Body of `PUT /api/passes/{id}`. Send a non-empty `updatedFields`, a non-empty `messageBody`,
 * or both — a message-only update pushes a banner without changing any field.
 */
export interface UpdatePassParams {
  /**
   * The field changes, keyed by the pass type's updatable field names
   * (for example `validUntil`, `memberTier`, `points`).
   */
  updatedFields?: Record<string, unknown>;
  /** Why the pass changed, for the audit trail. Up to 500 characters. */
  reason?: string;
  /** Holder-visible banner title. Up to 80 characters. */
  messageHeader?: string;
  /** Holder-visible banner text. Up to 2000 characters. */
  messageBody?: string;
  /** `false` suppresses the automatic change banner. */
  notify?: boolean;
}

export interface PushTemplatePassesParams {
  updatedFields: Record<string, unknown>;
  reason?: string;
}

// ─── Batch Status ────────────────────────────────────────────────

export interface BatchStatusResult {
  id: string;
  status: string;
  totalRecipients: number;
  passesGenerated: number;
  passesDelivered: number;
  generationFailures: number;
  deliveryFailures: number;
  progressPercentage: number;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  errorMessage?: string;
  isCompleted: boolean;
  isActive: boolean;
  statistics?: BatchStatistics;
  generatedPasses?: GeneratedPassSummary[];
}

export interface BatchStatistics {
  averageGenerationTimeSeconds: number;
  generationSuccessRate: number;
  deliverySuccessRate: number;
  mostCommonError?: string;
  totalDuration?: string;
}

export interface GeneratedPassSummary {
  id: string;
  passNumber: string;
  holderEmail?: string;
  holderName?: string;
  status: string;
  hasApplePass: boolean;
  hasGooglePass: boolean;
  generatedAt: string;
}

// ─── List Passes ─────────────────────────────────────────────────

export interface ListPassesParams {
  templateId?: string;
  status?: string;
  platform?: string;
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface GlobalPassDto {
  id: string;
  serialNumber: string;
  platform: string;
  status: string;
  generatedAt: string;
  redeemedAt?: string;
  validUntil?: string;
  holderEmail?: string;
  templateId: string;
  templateName: string;
  templateType: string;
}

// ─── Lookup params ───────────────────────────────────────────────

export interface LookupPassParams {
  passId?: string;
  passNumber?: string;
}

// ─── Generate and Wait ───────────────────────────────────────────

export interface GenerateAndWaitOptions {
  /** Polling interval in milliseconds. Default: 2000 */
  pollInterval?: number;
  /** Maximum number of poll attempts. Default: 150 (5 minutes at 2s interval) */
  maxAttempts?: number;
  /** Callback invoked on each poll with current batch status */
  onProgress?: (status: BatchStatusResult) => void;
}
