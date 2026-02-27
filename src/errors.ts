import { ApiErrorCodes } from './types/common.js';

/**
 * Base error class for all Livepasses API errors.
 * Contains the HTTP status code, API error code, and optional details.
 */
export class LivepassesError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: string;

  constructor(message: string, status: number, code: string, details?: string) {
    super(message);
    this.name = 'LivepassesError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Thrown for 401 responses - invalid or missing API key */
export class AuthenticationError extends LivepassesError {
  constructor(message: string, code: string, details?: string) {
    super(message, 401, code, details);
    this.name = 'AuthenticationError';
  }
}

/** Thrown for validation errors (400) - invalid input data */
export class ValidationError extends LivepassesError {
  constructor(message: string, code: string, details?: string) {
    super(message, 400, code, details);
    this.name = 'ValidationError';
  }
}

/** Thrown for 403 responses - insufficient permissions */
export class ForbiddenError extends LivepassesError {
  constructor(message: string, code: string, details?: string) {
    super(message, 403, code, details);
    this.name = 'ForbiddenError';
  }
}

/** Thrown for 404 responses - resource not found */
export class NotFoundError extends LivepassesError {
  constructor(message: string, code: string, details?: string) {
    super(message, 404, code, details);
    this.name = 'NotFoundError';
  }
}

/** Thrown for 429 responses - rate limit exceeded */
export class RateLimitError extends LivepassesError {
  /** Seconds to wait before retrying, from Retry-After header */
  readonly retryAfter?: number;

  constructor(message: string, code: string, retryAfter?: number, details?: string) {
    super(message, 429, code, details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/** Thrown when subscription quota is exceeded */
export class QuotaExceededError extends LivepassesError {
  constructor(message: string, code: string, details?: string) {
    super(message, 403, code, details);
    this.name = 'QuotaExceededError';
  }
}

/** Thrown for business rule violations */
export class BusinessRuleError extends LivepassesError {
  constructor(message: string, code: string, details?: string) {
    super(message, 422, code, details);
    this.name = 'BusinessRuleError';
  }
}

// Error codes that map to each error class
const AUTH_CODES: Set<string> = new Set([
  ApiErrorCodes.UNAUTHORIZED,
  ApiErrorCodes.INVALID_API_KEY,
  ApiErrorCodes.API_KEY_EXPIRED,
  ApiErrorCodes.API_KEY_REVOKED,
]);

const FORBIDDEN_CODES: Set<string> = new Set([
  ApiErrorCodes.FORBIDDEN,
  ApiErrorCodes.INSUFFICIENT_PERMISSIONS,
]);

const VALIDATION_CODES: Set<string> = new Set([
  ApiErrorCodes.VALIDATION_ERROR,
  ApiErrorCodes.REQUIRED_FIELD_MISSING,
  ApiErrorCodes.INVALID_FIELD_VALUE,
  ApiErrorCodes.INVALID_FIELD_FORMAT,
  ApiErrorCodes.FIELD_TOO_LONG,
  ApiErrorCodes.FIELD_TOO_SHORT,
]);

const NOT_FOUND_CODES: Set<string> = new Set([
  ApiErrorCodes.NOT_FOUND,
  ApiErrorCodes.PASS_NOT_FOUND,
  ApiErrorCodes.TEMPLATE_NOT_FOUND,
  ApiErrorCodes.TENANT_NOT_FOUND,
  ApiErrorCodes.PARTNERSHIP_NOT_FOUND,
]);

const RATE_LIMIT_CODES: Set<string> = new Set([
  ApiErrorCodes.RATE_LIMIT_EXCEEDED,
  ApiErrorCodes.TOO_MANY_REQUESTS,
]);

const QUOTA_CODES: Set<string> = new Set([
  ApiErrorCodes.QUOTA_EXCEEDED,
  ApiErrorCodes.API_QUOTA_EXCEEDED,
  ApiErrorCodes.SUBSCRIPTION_REQUIRED,
  ApiErrorCodes.FEATURE_NOT_AVAILABLE,
]);

const BUSINESS_RULE_CODES: Set<string> = new Set([
  ApiErrorCodes.BUSINESS_RULE_VIOLATION,
  ApiErrorCodes.OPERATION_NOT_ALLOWED,
  ApiErrorCodes.PASS_EXPIRED,
  ApiErrorCodes.PASS_ALREADY_USED,
  ApiErrorCodes.TEMPLATE_INACTIVE,
  ApiErrorCodes.RESOURCE_LOCKED,
  ApiErrorCodes.RESOURCE_EXPIRED,
]);

/**
 * Creates a typed error from an API error code and HTTP status.
 * @internal
 */
export function createTypedError(
  message: string,
  status: number,
  code: string,
  details?: string,
  retryAfter?: number,
): LivepassesError {
  if (AUTH_CODES.has(code)) return new AuthenticationError(message, code, details);
  if (FORBIDDEN_CODES.has(code)) return new ForbiddenError(message, code, details);
  if (VALIDATION_CODES.has(code)) return new ValidationError(message, code, details);
  if (NOT_FOUND_CODES.has(code)) return new NotFoundError(message, code, details);
  if (RATE_LIMIT_CODES.has(code)) return new RateLimitError(message, code, retryAfter, details);
  if (QUOTA_CODES.has(code)) return new QuotaExceededError(message, code, details);
  if (BUSINESS_RULE_CODES.has(code)) return new BusinessRuleError(message, code, details);

  // Fallback: map by HTTP status
  if (status === 401) return new AuthenticationError(message, code, details);
  if (status === 403) return new ForbiddenError(message, code, details);
  if (status === 404) return new NotFoundError(message, code, details);
  if (status === 429) return new RateLimitError(message, code, retryAfter, details);

  return new LivepassesError(message, status, code, details);
}
