/**
 * Example: Register, list, and manage webhooks
 *
 * Run: npx tsx examples/webhook-setup.ts
 * (Requires a valid API key - set LIVEPASSES_API_KEY env var)
 */
import { Livepasses, LivepassesError } from '../src/index.js';

const apiKey = process.env.LIVEPASSES_API_KEY ?? 'lp_test_your_key_here';

async function main() {
  const client = new Livepasses(apiKey);
  console.log('--- Webhook Setup ---\n');

  // 1. Create a webhook for pass events
  console.log('Registering webhook...');
  const webhook = await client.webhooks.create({
    url: 'https://your-app.com/webhooks/livepasses',
    events: ['pass.generated', 'pass.redeemed', 'pass.checked_in', 'batch.completed'],
  });
  console.log(`  Webhook ID: ${webhook.id}`);
  console.log(`  URL: ${webhook.url}`);
  console.log(`  Events: ${webhook.events.join(', ')}`);
  console.log(`  Secret: ${webhook.secret}`);
  console.log('  (Store this secret to verify incoming webhook signatures)\n');

  // 2. List all registered webhooks
  console.log('Listing all webhooks...');
  const webhooks = await client.webhooks.list();
  for (const wh of webhooks) {
    console.log(`  - ${wh.id}: ${wh.url} (active: ${wh.isActive})`);
    console.log(`    Events: ${wh.events.join(', ')}`);
  }
  console.log();

  // 3. Clean up — delete the webhook
  console.log('Deleting webhook...');
  await client.webhooks.delete(webhook.id);
  console.log('  Webhook deleted\n');

  console.log('Done!');
}

main().catch((err) => {
  if (err instanceof LivepassesError) {
    console.error(`API error [${err.code}]: ${err.message}`);
  } else {
    console.error('Error:', err);
  }
  process.exit(1);
});
