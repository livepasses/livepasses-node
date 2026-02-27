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

export type WebhookEventType =
  | 'pass.generated'
  | 'pass.redeemed'
  | 'pass.updated'
  | 'pass.expired'
  | 'pass.checked_in'
  | 'batch.completed'
  | 'batch.failed';
