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

export interface RedeemPassParams {
  location?: RedemptionLocation;
  notes?: string;
}

export interface CheckInParams {
  location?: RedemptionLocation;
  notes?: string;
}

export interface RedeemCouponParams {
  location?: RedemptionLocation;
  notes?: string;
}

export interface LoyaltyTransactionParams {
  /** Transaction type: earn | spend */
  transactionType: 'earn' | 'spend';
  points: number;
  description?: string;
}

// ─── Update ──────────────────────────────────────────────────────

export interface UpdatePassParams {
  businessData?: Partial<BusinessData>;
  businessContext?: BusinessContext;
}

export interface BulkUpdatePassesParams {
  passIds: string[];
  businessData?: Partial<BusinessData>;
  businessContext?: BusinessContext;
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
