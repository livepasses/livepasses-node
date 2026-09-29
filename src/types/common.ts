/**
 * Standard API response envelope.
 * All Livepasses API endpoints return this structure.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: ResponseMetadata;
}

/**
 * Paginated API response envelope.
 */
export interface ApiPagedResponse<T> {
  success: boolean;
  items: T[];
  pagination: PaginationMetadata;
  error?: ApiError;
  message?: string;
  meta?: ResponseMetadata;
}

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface ResponseMetadata {
  traceId?: string;
  processingTimeMs?: number;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: string;
  timestamp?: string;
  traceId?: string;
  /** Present only on VALIDATION_ERROR: field name -> validation messages. */
  fields?: Record<string, string[]>;
}

/**
 * Base parameters for paginated list queries.
 */
export interface PagedParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * All API error codes returned by the Livepasses API.
 * Mirrors ApiErrorCodes.cs 1:1.
 */
export const ApiErrorCodes = {
  // General Errors
  GENERAL_ERROR: 'GENERAL_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_API_KEY: 'INVALID_API_KEY',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  API_KEY_REVOKED: 'API_KEY_REVOKED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',
  INVALID_FIELD_FORMAT: 'INVALID_FIELD_FORMAT',
  FIELD_TOO_LONG: 'FIELD_TOO_LONG',
  FIELD_TOO_SHORT: 'FIELD_TOO_SHORT',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  RESOURCE_EXPIRED: 'RESOURCE_EXPIRED',

  // Business Rules
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

  // Subscription
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',

  // Tenant & Partnership
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  PARTNERSHIP_NOT_FOUND: 'PARTNERSHIP_NOT_FOUND',
  PARTNERSHIP_INACTIVE: 'PARTNERSHIP_INACTIVE',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',
  PARTNERSHIP_TIER_LIMIT_REACHED: 'PARTNERSHIP_TIER_LIMIT_REACHED',

  // Pass & Template
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  PASS_NOT_FOUND: 'PASS_NOT_FOUND',
  PASS_EXPIRED: 'PASS_EXPIRED',
  PASS_ALREADY_USED: 'PASS_ALREADY_USED',
  INVALID_PASS_FORMAT: 'INVALID_PASS_FORMAT',
  TEMPLATE_INACTIVE: 'TEMPLATE_INACTIVE',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_SERVICE_ERROR: 'PAYMENT_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR: 'SMS_SERVICE_ERROR',
  APPLE_WALLET_ERROR: 'APPLE_WALLET_ERROR',
  GOOGLE_WALLET_ERROR: 'GOOGLE_WALLET_ERROR',
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];
