# Livepasses Node.js/TypeScript SDK

Official Node.js SDK for the [Livepasses API](https://livepasses.com) - generate, manage, and redeem Apple Wallet and Google Wallet passes.

## Installation

```bash
npm install livepasses
```

Requires **Node.js 18+** (uses native `fetch`). Zero runtime dependencies.

## Quick Start

```typescript
import { Livepasses } from 'livepasses';

const client = new Livepasses('lp_api_key_...');

const result = await client.passes.generate({
  templateId: 'your-template-id',
  passes: [{
    customer: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
    businessData: { sectionInfo: 'A', rowInfo: '12', seatNumber: '5' },
  }],
});

console.log(result.passes[0].platforms.apple.addToWalletUrl);
```

## Authentication

Pass your API key when creating the client. Get your key at [dashboard.livepasses.com/api-keys](https://dashboard.livepasses.com/api-keys).

```typescript
const client = new Livepasses('lp_api_key_...', {
  baseUrl: 'https://api.livepasses.com', // default
  timeout: 30000,  // 30s default
  maxRetries: 3,   // default
});
```

## Pass Generation

### Single pass (synchronous)

```typescript
const result = await client.passes.generate({
  templateId: 'template-id',
  businessContext: {
    event: {
      eventName: 'Summer Concert 2026',
      eventDate: '2026-07-15T18:00:00Z',
    },
  },
  passes: [{
    customer: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
    businessData: {
      sectionInfo: 'VIP', rowInfo: 'A', seatNumber: '12',
      ticketType: 'VIP', price: 150, currency: 'USD',
    },
  }],
  options: { deliveryMethod: 'email' },
});
```

### Batch passes (auto-polling)

For multiple recipients, `generateAndWait` automatically polls until the batch completes:

```typescript
const result = await client.passes.generateAndWait(
  {
    templateId: 'template-id',
    passes: recipients.map(r => ({
      customer: r,
      businessData: { ticketType: 'General' },
    })),
  },
  {
    pollInterval: 2000, // 2s between polls (default)
    onProgress: (status) => {
      console.log(`${status.progressPercentage}% complete`);
    },
  },
);
```

### Batch status (manual polling)

If you need more control over polling, use `generate` + `getBatchStatus`:

```typescript
const initial = await client.passes.generate({
  templateId: 'template-id',
  passes: recipients.map(r => ({
    customer: r,
    businessData: { ticketType: 'General' },
  })),
});

if (initial.batchOperation) {
  let status = await client.passes.getBatchStatus(initial.batchOperation.batchId);
  while (!status.isCompleted) {
    await new Promise(r => setTimeout(r, 2000));
    status = await client.passes.getBatchStatus(initial.batchOperation.batchId);
    console.log(`Progress: ${status.progressPercentage}%`);
  }
  console.log(`Completed: ${status.statistics.successful} successful, ${status.statistics.failed} failed`);
}
```

## Pass Lifecycle

### Lookup

```typescript
const pass = await client.passes.lookup({ passId: 'pass-id' });
// or by pass number
const pass = await client.passes.lookup({ passNumber: 'LP-001' });
```

### Validate

```typescript
const validation = await client.passes.validate('pass-id');
if (validation.canBeRedeemed) {
  // proceed with redemption
}
```

### Redeem

```typescript
// Generic redemption
const result = await client.passes.redeem('pass-id');

// Event check-in
const result = await client.passes.checkIn('pass-id', {
  location: { name: 'Gate 1', latitude: 40.71, longitude: -74.00 },
});

// Coupon redemption
const result = await client.passes.redeemCoupon('pass-id');
```

### Update a pass

Change fields on an issued pass and push the change to the holder's wallet. `updatedFields` is
keyed by the pass type's updatable field names; `messageHeader`/`messageBody` show the holder a
banner, and `notify: false` suppresses the automatic one. Send a non-empty `updatedFields`, a
non-empty `messageBody`, or both.

```typescript
await client.passes.update('pass-id', {
  updatedFields: { points: 750, memberTier: 'Platinum' },
  reason: 'Quarterly tier review',
  messageHeader: 'You reached Platinum',
  messageBody: 'Congratulations on reaching Platinum!',
});
```

The API refuses any body field it does not declare with a `400` naming the field — for example,
there is no `notes` on redeem, check-in or coupon redemption; put free text in `metadata`.

### Push a scoped update

Push field updates to all eligible passes of a template:

```typescript
await client.passes.pushTemplate('template-id', {
  updatedFields: { gate: 'Gate C' },
  reason: 'Event-wide gate change',
});
```

## Pass Types

### Event Passes

```typescript
await client.passes.generate({
  templateId: 'event-template-id',
  businessContext: { event: { eventName: 'Concert', eventDate: '2026-07-15T18:00:00Z' } },
  passes: [{
    customer: { firstName: 'Jane', lastName: 'Doe' },
    businessData: { sectionInfo: 'A', rowInfo: '1', seatNumber: '5', gateInfo: 'North' },
  }],
});
```

### Loyalty Cards

```typescript
await client.passes.generate({
  templateId: 'loyalty-template-id',
  passes: [{
    customer: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
    // Identifies the member — use a distinct number per person.
    businessData: { membershipNumber: 'MEM-001', currentPoints: 500, memberTier: 'Gold' },
  }],
});

// Earn points
await client.passes.loyaltyTransact('pass-id', {
  transactionType: 'earn',
  points: 100,
  description: 'Purchase reward',
});

// Spend points
await client.passes.loyaltyTransact('pass-id', {
  transactionType: 'spend',
  points: 50,
  description: 'Reward redemption',
});
```

### Coupon Passes

```typescript
await client.passes.generate({
  templateId: 'coupon-template-id',
  businessContext: { coupon: { campaignName: 'Summer Sale', specialMessage: '20% off!' } },
  passes: [{
    customer: { firstName: 'Jane', lastName: 'Doe' },
    businessData: { promoCode: 'SUMMER20', maxUsageCount: 1 },
  }],
});
```

## Templates

### List and get

```typescript
// List templates
const templates = await client.templates.list({ status: 'Active' });

// Get template details
const template = await client.templates.get('template-id');
```

### Create a template

```typescript
const template = await client.templates.create({
  name: 'VIP Event Pass',
  description: 'Premium event ticket template',
  // The block you send decides the template type: `event` makes an event ticket.
  businessFeatures: {
    event: {
      eventName: 'Aurora Music Fest',
      eventDate: '2030-06-15T20:00:00Z',
      venueName: 'Aurora Arena',
      showSeatNumbers: true,
    },
  },
});
```

### Update a template

```typescript
const updated = await client.templates.update('template-id', {
  name: 'VIP Event Pass v2',
  description: 'Updated premium event ticket template',
});
```

### Activate / deactivate

```typescript
await client.templates.activate('template-id');
await client.templates.deactivate('template-id');
```

## Webhooks

```typescript
// Register a webhook
const webhook = await client.webhooks.create({
  url: 'https://your-app.com/webhooks/livepasses',
  events: ['pass.generated', 'pass.redeemed', 'pass.sharing_suspected'],
});
console.log(webhook.secret); // use this to verify webhook signatures

// List webhooks
const webhooks = await client.webhooks.list();

// Remove a webhook
await client.webhooks.delete('webhook-id');
```

## Error Handling

Every refusal the API can make answers with a real HTTP status (`400`/`403`/`404`/`409`/`422`/`429`/`500`/`502`/`503`) and the envelope `{success:false,data:null,error:{code,message,details,timestamp,traceId,fields?}}`. The SDK raises a typed error from **any** status or body — including a status-only response it can't parse as JSON, such as a challenge `401` or a proxy error. All errors are typed for precise `catch` handling:

```typescript
import {
  Livepasses,
  LivepassesError,
  AuthenticationError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  QuotaExceededError,
  BusinessRuleError,
  ApiErrorCodes,
} from 'livepasses';

try {
  await client.passes.generate({ ... });
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (err instanceof ValidationError) {
    console.error('Invalid input:', err.message, err.details);
  } else if (err instanceof ForbiddenError) {
    console.error('Insufficient permissions for this operation');
  } else if (err instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${err.retryAfter}s`);
  } else if (err instanceof QuotaExceededError) {
    console.error('Monthly pass quota exceeded — upgrade your plan');
  } else if (err instanceof NotFoundError) {
    console.error('Template or pass not found');
  } else if (err instanceof BusinessRuleError) {
    console.error('Business rule:', err.message);
  } else if (err instanceof LivepassesError) {
    // Catch-all for any other API error
    console.error(`API error [${err.code}]: ${err.message} (HTTP ${err.status})`);
  }
}
```

### Error codes

Use the `ApiErrorCodes` constant for programmatic error code comparisons:

```typescript
import { LivepassesError, ApiErrorCodes } from 'livepasses';

try {
  await client.passes.redeem('pass-id');
} catch (err) {
  if (err instanceof LivepassesError) {
    switch (err.code) {
      case ApiErrorCodes.PASS_ALREADY_USED:
        console.error('This pass has already been redeemed');
        break;
      case ApiErrorCodes.PASS_EXPIRED:
        console.error('This pass has expired');
        break;
      case ApiErrorCodes.TEMPLATE_INACTIVE:
        console.error('The template for this pass is inactive');
        break;
      default:
        console.error(`Unhandled error: ${err.code}`);
    }
  }
}
```

### Exception hierarchy

| Error Class | Typical status | When |
|-------------|------------|------|
| `AuthenticationError` | 401 | Invalid, expired, or revoked API key |
| `ValidationError` | 400 | Request validation failed — carries `fields?: Record<string, string[]>`, the field name -> validation messages map |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource not found |
| `RateLimitError` | 429 | Rate limit exceeded |
| `QuotaExceededError` | 422 | API quota or subscription limit exceeded |

The status column is the one each class usually carries; the error's `.status` is always the response's real HTTP status. A `401` is always the authentication error and a `403` always the forbidden error, whatever `error.code` says. A `409` without a mapped code, and every `5xx`, raise the base `LivepassesError`.
| `BusinessRuleError` | 422 | Business rule violation (pass expired, already used, etc.) |

## Pagination

### Manual pagination

```typescript
const page1 = await client.passes.list({ page: 1, pageSize: 50 });
console.log(`Page 1 of ${page1.pagination.totalPages} (${page1.pagination.totalItems} total)`);

// Get next page
if (page1.pagination.currentPage < page1.pagination.totalPages) {
  const page2 = await client.passes.list({ page: 2, pageSize: 50 });
}
```

### Auto-pagination

```typescript
for await (const pass of client.passes.listAutoPaginate({ templateId: 'tpl-id' })) {
  console.log(pass.id);
}
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `baseUrl` | `https://api.livepasses.com` | API base URL |
| `timeout` | `30000` | Request timeout in ms |
| `maxRetries` | `3` | Max retries for failed requests (429, 5xx) |

### Automatic retries

The SDK automatically retries on:
- **429 Too Many Requests** — honors `Retry-After` header
- **5xx Server Errors** — exponential backoff with jitter, **only for idempotent methods** (`GET`, `HEAD`, `PUT`, `DELETE`). A `POST` or `PATCH` that hits a `5xx` is not retried — no SDK sends an `Idempotency-Key`, so a retry could re-run a non-idempotent operation.

## TypeScript

The SDK is written in TypeScript and ships with full type declarations. All request params and response types are exported:

```typescript
import type { GeneratePassesParams, PassGenerationResult, BatchStatusResult } from 'livepasses';
```

## Examples

See the [`examples/`](./examples/) directory for runnable scripts:

- **[generate-passes.ts](./examples/generate-passes.ts)** — End-to-end pass generation, lookup, validation, and check-in
- **[loyalty-workflow.ts](./examples/loyalty-workflow.ts)** — Loyalty card lifecycle: generate, earn points, spend points, update tier
- **[coupon-workflow.ts](./examples/coupon-workflow.ts)** — Coupon pass generation and redemption
- **[template-management.ts](./examples/template-management.ts)** — CRUD operations on pass templates
- **[webhook-setup.ts](./examples/webhook-setup.ts)** — Register, list, and manage webhooks

Run any example with:
```bash
export LIVEPASSES_API_KEY="your-api-key"
npx tsx examples/generate-passes.ts
```

## License

MIT
