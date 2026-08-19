export interface Webhook {
  id: string;
  url: string;
  events: WebhookEventType[];
  isActive: boolean;
  createdAt: string;
  secret?: string;
}

export interface CreateWebhookParams {
  url: string;
  events: WebhookEventType[];
}

/**
 * Events the API accepts on a webhook subscription.
 *
 * This list mirrors the server's allow-list exactly. Subscribing to anything outside it is
 * rejected with a 400, so a value that is not here is not a "not yet supported" event — it is
 * a request that always fails.
 */
export type WebhookEventType =
  | 'pass.generated'
  | 'pass.redeemed'
  | 'pass.updated'
  | 'loyalty.transacted'
  | 'coupon.applied'
  | 'transfer.initiated'
  | 'transfer.accepted'
  | 'transfer.declined'
  | 'transfer.revoked'
  | 'transfer.expired'
  /** Every event above. */
  | '*';
