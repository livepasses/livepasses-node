/**
 * Example: Loyalty card lifecycle — generate, earn points, spend points, update tier
 *
 * Run: npx tsx examples/loyalty-workflow.ts
 * (Requires a valid API key - set LIVEPASSES_API_KEY env var)
 */
import {
  Livepasses,
  LivepassesError,
  BusinessRuleError,
  ApiErrorCodes,
} from '../src/index.js';

const apiKey = process.env.LIVEPASSES_API_KEY ?? 'lp_test_your_key_here';

async function main() {
  const client = new Livepasses(apiKey);
  console.log('--- Loyalty Card Workflow ---\n');

  // 1. Generate a loyalty card
  console.log('Generating loyalty card...');
  const result = await client.passes.generateAndWait(
    {
      templateId: process.env.LOYALTY_TEMPLATE_ID ?? 'loyalty-template-id',
      passes: [
        {
          customer: {
            firstName: 'Carlos',
            lastName: 'Rivera',
            email: 'carlos@example.com',
            phone: '+57300123456',
          },
          businessData: {
            // Identifies the member — use a distinct number per person.
            membershipNumber: 'MEM-2026-001',
            currentPoints: 0,
            memberTier: 'Bronze',
            accountBalance: 0,
          },
        },
      ],
    },
    {
      onProgress: (status) => console.log(`  Progress: ${status.progressPercentage}%`),
    },
  );

  const passId = result.passes[0].id;
  console.log(`  Pass ID: ${passId}`);
  console.log(`  Membership: ${result.passes[0].businessData.membershipNumber}\n`);

  // 2. Earn points from a purchase
  console.log('Earning 500 points from purchase...');
  const earn = await client.passes.loyaltyTransact(passId, {
    transactionType: 'earn',
    points: 500,
    description: 'Purchase at Store #42 - $50.00',
  });
  console.log(`  Status: ${earn.newStatus}\n`);

  // 3. Earn more points
  console.log('Earning 300 more points...');
  await client.passes.loyaltyTransact(passId, {
    transactionType: 'earn',
    points: 300,
    description: 'Purchase at Store #15 - $30.00',
  });

  // 4. Spend points for a reward
  console.log('Spending 200 points on a reward...');
  const spend = await client.passes.loyaltyTransact(passId, {
    transactionType: 'spend',
    points: 200,
    description: 'Redeemed: Free coffee',
  });
  console.log(`  Status: ${spend.newStatus}\n`);

  // 5. Update tier based on accumulated points
  console.log('Upgrading to Gold tier...');
  // The points balance is already kept by loyaltyTransact above; only the tier changes here.
  // memberTier must name a tier defined on the loyalty program.
  await client.passes.update(passId, {
    updatedFields: { memberTier: 'Gold' },
    reason: 'Reached 600 points',
    messageHeader: 'Welcome to Gold',
    messageBody: 'Congratulations! You\'ve been upgraded to Gold tier!',
  });
  console.log('  Tier updated to Gold\n');

  // 6. Validate the pass
  console.log('Validating pass...');
  const validation = await client.passes.validate(passId);
  console.log(`  Valid: ${validation.canBeRedeemed}`);
  console.log(`  Message: ${validation.validationMessage}\n`);

  console.log('Done!');
}

main().catch((err) => {
  if (err instanceof BusinessRuleError) {
    console.error(`Business rule violation: ${err.message}`);
  } else if (err instanceof LivepassesError) {
    if (err.code === ApiErrorCodes.INSUFFICIENT_FUNDS) {
      console.error('Not enough points for this transaction');
    } else {
      console.error(`API error [${err.code}]: ${err.message}`);
    }
  } else {
    console.error('Error:', err);
  }
  process.exit(1);
});
