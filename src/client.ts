import { HttpClient } from './http.js';
import { PassesResource } from './resources/passes.js';
import { TemplatesResource } from './resources/templates.js';
import { WebhooksResource } from './resources/webhooks.js';

export interface LivepassesOptions {
  /** API base URL. Default: https://api.livepasses.com */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default: 30000 */
  timeout?: number;
  /** Maximum number of retries for failed requests. Default: 3 */
  maxRetries?: number;
}

const DEFAULT_BASE_URL = 'https://api.livepasses.com';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

/**
 * Livepasses API client.
 *
 * @example
 * ```ts
 * import { Livepasses } from 'livepasses';
 *
 * const client = new Livepasses('lp_api_key_...');
 * const result = await client.passes.generate({
 *   templateId: 'template-id',
 *   passes: [{
 *     customer: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
 *     businessData: { sectionInfo: 'A', rowInfo: '12', seatNumber: '5' },
 *   }],
 * });
 * ```
 */
export class Livepasses {
  readonly passes: PassesResource;
  readonly templates: TemplatesResource;
  readonly webhooks: WebhooksResource;

  constructor(apiKey: string, options?: LivepassesOptions) {
    if (!apiKey) {
      throw new Error(
        'An API key is required. Get yours at https://dashboard.livepasses.com/api-keys',
      );
    }

    const http = new HttpClient({
      apiKey,
      baseUrl: options?.baseUrl ?? DEFAULT_BASE_URL,
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: options?.maxRetries ?? DEFAULT_MAX_RETRIES,
    });

    this.passes = new PassesResource(http);
    this.templates = new TemplatesResource(http);
    this.webhooks = new WebhooksResource(http);
  }
}
