# Changelog

All notable changes to the Livepasses Node.js SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-27

### Added

- Initial release of the Livepasses Node.js/TypeScript SDK
- `Livepasses` client with configurable base URL, timeout, and retry settings
- **Passes resource**: `generate`, `generateAndWait`, `list`, `listAutoPaginate`, `lookup`, `validate`, `update`, `bulkUpdate`, `redeem`, `checkIn`, `redeemCoupon`, `loyaltyTransact`, `getBatchStatus`
- **Templates resource**: `list`, `get`, `create`, `update`, `activate`, `deactivate`
- **Webhooks resource**: `create`, `list`, `delete`
- Typed error hierarchy: `AuthenticationError`, `ValidationError`, `ForbiddenError`, `NotFoundError`, `RateLimitError`, `QuotaExceededError`, `BusinessRuleError`
- `ApiErrorCodes` constant with 40+ error code values
- Automatic retry with exponential backoff for 429 and 5xx responses
- Auto-pagination via async generator (`listAutoPaginate`)
- Full TypeScript type declarations for all request/response types
- Zero runtime dependencies (uses native `fetch`)

[0.1.0]: https://github.com/livepasses/livepasses-node/releases/tag/v0.1.0
