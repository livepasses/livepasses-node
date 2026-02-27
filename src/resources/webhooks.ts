import type { HttpClient } from '../http.js';
import type { Webhook, CreateWebhookParams } from '../types/webhooks.js';

export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a webhook endpoint.
   */
  async create(params: CreateWebhookParams): Promise<Webhook> {
    return this.http.post<Webhook>('/api/webhooks', params);
  }

  /**
   * List all registered webhooks.
   */
  async list(): Promise<Webhook[]> {
    return this.http.get<Webhook[]>('/api/webhooks');
  }

  /**
   * Delete a webhook by ID.
   */
  async delete(webhookId: string): Promise<void> {
    await this.http.delete<unknown>(`/api/webhooks/${webhookId}`);
  }
}
