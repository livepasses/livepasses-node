// Main client
export { Livepasses } from './client.js';
export type { LivepassesOptions } from './client.js';

// Errors
export {
  LivepassesError,
  AuthenticationError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  QuotaExceededError,
  BusinessRuleError,
} from './errors.js';

// Types - re-export everything
export type {
  // Common
  ApiResponse,
  ApiPagedResponse,
  PaginationMetadata,
  ResponseMetadata,
  ApiError,
  PagedParams,
  ApiErrorCode,
  // Passes
  GeneratePassesParams,
  BusinessContext,
  EventContext,
  LoyaltyContext,
  CouponContext,
  PassRecipient,
  CustomerInfo,
  BusinessData,
  PersonalizationData,
  PassGenerationOptions,
  PassGenerationResult,
  BatchOperationInfo,
  GeneratedPass,
  PassPlatforms,
  PassPlatform,
  UnifiedBusinessData,
  PassDeliveryResult,
  DeliveryDetail,
  BusinessMetrics,
  AnalyticsInfo,
  PassLookupResult,
  PassValidationResult,
  PassRedemptionResult,
  RedemptionLocation,
  RedeemPassParams,
  CheckInParams,
  RedeemCouponParams,
  LoyaltyTransactionParams,
  UpdatePassParams,
  BulkUpdatePassesParams,
  BatchStatusResult,
  BatchStatistics,
  GeneratedPassSummary,
  ListPassesParams,
  GlobalPassDto,
  LookupPassParams,
  GenerateAndWaitOptions,
  // Templates
  TemplateListItem,
  TemplateDetail,
  ListTemplatesParams,
  CreateTemplateParams,
  UpdateTemplateParams,
  // Webhooks
  Webhook,
  CreateWebhookParams,
  WebhookEventType,
} from './types/index.js';

export { ApiErrorCodes } from './types/index.js';

// Default export
export { Livepasses as default } from './client.js';
