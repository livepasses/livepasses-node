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

// Every typed error carries the response's real HTTP status in `status`. The trailing `status`
// constructor parameter is optional and defaults to the class's historical status, so code that
// constructs these errors itself (tests, wrappers) keeps compiling unchanged.

/** Thrown for 401 responses - invalid or missing API key */
export class AuthenticationError extends LivepassesError {
  constructor(message: string, code: string, details?: string, status = 401) {
    super(message, status, code, details);
    this.name = 'AuthenticationError';
  }
}

/** Thrown for validation errors (usually 400) - invalid input data */
export class ValidationError extends LivepassesError {
  /**
   * Field path -> validation messages. Present only for VALIDATION_ERROR. Keys are the API's
   * camelCase field paths, e.g. `operations[0].path`.
   */
  readonly fields?: Record<string, string[]>;

  constructor(message: string, code: string, details?: string, fields?: Record<string, string[]>, status = 400) {
    super(message, status, code, details);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/** Thrown for 403 responses - insufficient permissions */
export class ForbiddenError extends LivepassesError {
  constructor(message: string, code: string, details?: string, status = 403) {
    super(message, status, code, details);
    this.name = 'ForbiddenError';
  }
}

/** Thrown for 404 responses - resource not found */
export class NotFoundError extends LivepassesError {
  constructor(message: string, code: string, details?: string, status = 404) {
    super(message, status, code, details);
    this.name = 'NotFoundError';
  }
}

/** Thrown for 429 responses - rate limit exceeded */
export class RateLimitError extends LivepassesError {
  /** Seconds to wait before retrying, from Retry-After header */
  readonly retryAfter?: number;

  constructor(message: string, code: string, retryAfter?: number, details?: string, status = 429) {
    super(message, status, code, details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/** Thrown when subscription quota is exceeded (the API answers 422) */
export class QuotaExceededError extends LivepassesError {
  constructor(message: string, code: string, details?: string, status = 403) {
    super(message, status, code, details);
    this.name = 'QuotaExceededError';
  }
}

/** Thrown for business rule violations (usually 422) */
export class BusinessRuleError extends LivepassesError {
  constructor(message: string, code: string, details?: string, status = 422) {
    super(message, status, code, details);
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
 * Creates a typed error from an API error code and HTTP status. The status decides first for 401
 * and 403 (a 403 carrying UNAUTHORIZED is a permission refusal, not a bad key), then the code,
 * then the remaining statuses. Every error carries the real status.
 * @internal
 */
export function createTypedError(
  message: string,
  status: number,
  code: string,
  details?: string,
  retryAfter?: number,
  fields?: Record<string, string[]>,
): LivepassesError {
  if (status === 401) return new AuthenticationError(message, code, details, status);
  if (status === 403) return new ForbiddenError(message, code, details, status);

  if (AUTH_CODES.has(code)) return new AuthenticationError(message, code, details, status);
  if (FORBIDDEN_CODES.has(code)) return new ForbiddenError(message, code, details, status);
  if (VALIDATION_CODES.has(code)) return new ValidationError(message, code, details, fields, status);
  if (NOT_FOUND_CODES.has(code)) return new NotFoundError(message, code, details, status);
  if (RATE_LIMIT_CODES.has(code)) return new RateLimitError(message, code, retryAfter, details, status);
  if (QUOTA_CODES.has(code)) return new QuotaExceededError(message, code, details, status);
  if (BUSINESS_RULE_CODES.has(code)) return new BusinessRuleError(message, code, details, status);

  // Fallback: map by HTTP status. A 409 conflict has no class of its own and stays a
  // LivepassesError carrying status 409 and the envelope's code.
  if (status === 400) return new ValidationError(message, code, details, fields, status);
  if (status === 404) return new NotFoundError(message, code, details, status);
  if (status === 422) return new BusinessRuleError(message, code, details, status);
  if (status === 429) return new RateLimitError(message, code, retryAfter, details, status);

  return new LivepassesError(message, status, code, details);
}
