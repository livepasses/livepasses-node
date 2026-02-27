import { describe, it, expect } from 'vitest';
import { Livepasses } from '../src/client.js';

describe('Livepasses client', () => {
  it('should throw if no API key provided', () => {
    expect(() => new Livepasses('')).toThrow('API key is required');
  });

  it('should create resource instances', () => {
    const client = new Livepasses('test-key');
    expect(client.passes).toBeDefined();
    expect(client.templates).toBeDefined();
    expect(client.webhooks).toBeDefined();
  });

  it('should accept custom options', () => {
    const client = new Livepasses('test-key', {
      baseUrl: 'https://custom.api.com',
      timeout: 10000,
      maxRetries: 5,
    });
    expect(client).toBeDefined();
  });
});
