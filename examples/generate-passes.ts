/**
 * Example: Generate and manage passes with the Livepasses SDK
 *
 * Run: npx tsx examples/generate-passes.ts
 * (Requires a valid API key - set LIVEPASSES_API_KEY env var)
 */
import { Livepasses, AuthenticationError, NotFoundError, RateLimitError } from '../src/index.js';

const apiKey = process.env.LIVEPASSES_API_KEY ?? 'lp_test_your_key_here';

async function main() {
  // 1. Initialize client
  const client = new Livepasses(apiKey, {
    baseUrl: process.env.LIVEPASSES_API_URL ?? 'https://api.livepasses.com',
  });

  console.log('--- Livepasses SDK Example ---\n');

  // 2. List templates to find an active one
  console.log('Listing templates...');
  const templates = await client.templates.list({ status: 'Active', pageSize: 5 });
  console.log(`Found ${templates.pagination.totalItems} template(s)`);

  if (templates.items.length === 0) {
    console.log('No active templates found. Create one in the dashboard first.');
    return;
  }

  const template = templates.items[0];
  console.log(`Using template: "${template.name}" (${template.type})\n`);

  // 3. Generate a single event pass with delivery
  console.log('Generating a pass...');
  const result = await client.passes.generateAndWait(
    {
      templateId: template.id,
      businessContext: {
        event: {
          eventName: 'Summer Music Festival 2026',
          eventDate: '2026-07-15T18:00:00Z',
          doorsOpen: '2026-07-15T16:00:00Z',
        },
      },
      passes: [
        {
          customer: {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
          },
          businessData: {
            sectionInfo: 'VIP',
            rowInfo: 'A',
            seatNumber: '12',
            gateInfo: 'Gate 1',
            ticketType: 'VIP',
            price: 150,
            currency: 'USD',
          },
        },
      ],
      options: {
        deliveryMethod: 'email',
        generateForAllPlatforms: true,
      },
    },
    {
      onProgress: (status) => {
        console.log(`  Batch progress: ${status.progressPercentage}%`);
      },
    },
  );

  console.log(`Generated ${result.totalPasses} pass(es)`);
  const pass = result.passes[0];
  console.log(`  Pass ID: ${pass.id}`);
  console.log(`  Apple Wallet: ${pass.platforms.apple.available ? 'Available' : 'N/A'}`);
  console.log(`  Google Wallet: ${pass.platforms.google.available ? 'Available' : 'N/A'}`);
  console.log();

  // 4. Look up the generated pass
  console.log('Looking up pass...');
  const lookup = await client.passes.lookup({ passId: pass.id });
  console.log(`  Pass Number: ${lookup.passNumber}`);
  console.log(`  Holder: ${lookup.holderName}`);
  console.log(`  Status: ${lookup.status}`);
  console.log();

  // 5. Validate it
  console.log('Validating pass...');
  const validation = await client.passes.validate(pass.id);
  console.log(`  Can be redeemed: ${validation.canBeRedeemed}`);
  console.log(`  Message: ${validation.validationMessage}`);
  console.log();

  // 6. Redeem it (check-in for event passes)
  console.log('Checking in...');
  const redemption = await client.passes.checkIn(pass.id, {
    location: { name: 'Main Entrance', latitude: 40.7128, longitude: -74.006 },
  });
  console.log(`  Previous status: ${redemption.previousStatus}`);
  console.log(`  New status: ${redemption.newStatus}`);
  console.log(`  Redeemed at: ${redemption.redeemedAt}`);
  console.log();

  console.log('Done!');
}

// Error handling
main().catch((err) => {
  if (err instanceof AuthenticationError) {
    console.error('Authentication failed. Check your API key.');
  } else if (err instanceof NotFoundError) {
    console.error(`Resource not found: ${err.message}`);
  } else if (err instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${err.retryAfter}s`);
  } else {
    console.error('Error:', err.message);
  }
  process.exit(1);
});
