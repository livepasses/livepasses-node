# Changelog

All notable changes to the Livepasses Node.js SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-09-28

### Changed (breaking)
- The API now answers every refusal with a real HTTP status (`400`/`403`/`404`/`409`/`422`/`429`/`500`/`502`/`503`) and the `{success:false,data:null,error:{...}}` envelope, instead of sometimes returning `200` with `success:false`. The SDK now raises a typed error from **any** status or body — including a status-only error response with no parseable body (a challenge `401`, a proxy `5xx`) — so an `if (!success)` check on a resolved promise is no longer needed or possible. A `2xx` with an empty body (a `204`) is a success and resolves to `undefined`.
- **5xx responses are now retried only for idempotent methods** (`GET`, `HEAD`, `PUT`, `DELETE`). A `POST` or `PATCH` that hits a `5xx` fails immediately instead of being retried, since no SDK sends an `Idempotency-Key` to make a retry safe. `429` and network-error retry behavior is unchanged.
- Every typed error's `status` is now the response's real HTTP status instead of a fixed number per class — `QuotaExceededError.status` is `422`, not `403`, and a `BusinessRuleError` from a `409` says `409`. A `401` is always an `AuthenticationError` and a `403` always a `ForbiddenError`, whatever the code: a `403` carrying `UNAUTHORIZED` is a permission refusal, not a bad API key. After that the error code decides, then the status (`400`/`404`/`422`/`429`); a `409` with no mapped code is a plain `LivepassesError`. Each subclass constructor gained an optional trailing `status` parameter that defaults to the old fixed value, so code that constructs these errors itself still compiles.
- **Upgrade recommended.** Older SDK versions retry a failed request on any `5xx`, including a `POST`. The API now answers server-side failures with a real `500`, `502` or `503` where it used to answer `200`, so an older SDK can send the same `POST` twice — for example, generate the same passes twice. This version retries a `5xx` only for `GET`, `HEAD`, `PUT` and `DELETE`.
- `ValidationError` gained a `fields?: Record<string, string[]>` property (also added to `ApiError`), populated only for `VALIDATION_ERROR` — the field name -> validation messages map the API now includes on that error.
- **`UpdatePassParams` now matches the API:** `updatedFields`, `reason`, `messageHeader`, `messageBody` and `notify`. The old `businessData` / `businessContext` were never read by the API, so `passes.update()` changed nothing while answering success — and the API now refuses them with a `400` naming the field. Send the changes as `passes.update(id, { updatedFields: { points: 150 }, reason: '...' })`; a non-empty `updatedFields`, a non-empty `messageBody`, or both is required.
- **`notes` removed from `RedeemPassParams`, `CheckInParams` and `RedeemCouponParams`.** The API never read it and now refuses it with a `400`. Put free text in `metadata` (a string-to-string map recorded with the redemption); the SDK does not map `notes` into it for you. The three types now declare the rest of the API's fields: `acceptedTypes`, `redemptionMethod`, `metadata` on all three; `redemptionChannel` and `confirmationCode` on redeem; `gate` and `section` on check-in; `redemptionChannel`, `locationId`, `transactionAmount`, `transactionCurrency` and `promoCode` on coupon redemption.

### Added
- `'pass.installed'` and `'pass.removed'` webhook events: the holder saved a pass to a wallet (first device), or removed its last copy. Holder-initiated removals only.
- Pass operations the API shipped since June: `passes.redeemGiftCard`, `passes.membershipCheckIn`, `passes.stamp`, `passes.unstamp`, `passes.redeemByScan`.
  `stamp` and `unstamp` send an empty JSON body rather than none: both endpoints bind a request
  DTO, and a bodyless POST carries no `Content-Type`, which the API answers with `415`.

### Removed
- **BREAKING:** the `pass.expired`, `pass.checked_in`, `batch.completed` and `batch.failed` members of `WebhookEventType`. The API rejects all four with a `400`, so no
  subscription using them could ever have worked.

### Fixed
- `passes.redeem` documented itself as generic redemption. It is single-use only: multi-use
  passes are refused with a `422`. The doc comment now says so and names `stamp`,
  `membershipCheckIn`, `redeemCoupon` and `redeemGiftCard` as the operations to use instead.
- Webhook event catalogue now mirrors the server allow-list, adding `loyalty.transacted`,
  `coupon.applied`, the five `transfer.*` events and the `*` wildcard. The runnable webhook
  example no longer subscribes to events the API rejects.
- The template example and README put invented flat keys (`passType`, `hasSeating`,
  `hasGateInfo`, `supportedPlatforms`, `hasBackstageAccess`) in `businessFeatures`, which the
  API now refuses with a `400`. They now send a nested `event` block (and `branding`).

## [0.2.0] - 2026-05-23

### Changed
- **BREAKING:** `passes.bulkUpdate(BulkUpdatePassesParams)` replaced by `passes.pushTemplate(templateId, PushTemplatePassesParams)`, targeting `POST /api/passes/template/{templateId}/push` with `{ updatedFields, reason }`. `BulkUpdatePassesParams` renamed to `PushTemplatePassesParams`.

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
