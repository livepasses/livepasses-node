/**
 * Example: Coupon pass generation and redemption
 *
 * Run: npx tsx examples/coupon-workflow.ts
 * (Requires a valid API key - set LIVEPASSES_API_KEY env var)
 */
import {
  Livepasses,
  LivepassesError,
  BusinessRuleError,
} from '../src/index.js';

const apiKey = process.env.LIVEPASSES_API_KEY ?? 'lp_test_your_key_here';

async function main() {
  const client = new Livepasses(apiKey);
  console.log('--- Coupon Workflow ---\n');

  // 1. Generate coupon passes for a campaign
  console.log('Generating coupon passes...');
  const result = await client.passes.generateAndWait(
    {
      templateId: process.env.COUPON_TEMPLATE_ID ?? 'coupon-template-id',
      businessContext: {
        coupon: {
          campaignName: 'Summer Sale 2026',
          specialMessage: 'Enjoy 20% off your next purchase!',
          promotionStartDate: '2026-06-01',
          promotionEndDate: '2026-08-31',
        },
      },
      passes: [
        {
          customer: { firstName: 'Maria', lastName: 'Garcia', email: 'maria@example.com' },
          businessData: { promoCode: 'SUMMER20-001', maxUsageCount: 1 },
        },
        {
          customer: { firstName: 'Pedro', lastName: 'Lopez', email: 'pedro@example.com' },
          businessData: { promoCode: 'SUMMER20-002', maxUsageCount: 1 },
        },
      ],
      options: { deliveryMethod: 'email' },
    },
    {
      onProgress: (status) => console.log(`  Progress: ${status.progressPercentage}%`),
    },
  );

  console.log(`Generated ${result.totalPasses} coupon(s)\n`);

  // 2. Look up a coupon
  const passId = result.passes[0].id;
  console.log('Looking up coupon...');
  const lookup = await client.passes.lookup({ passId });
  console.log(`  Holder: ${lookup.holderName}`);
  console.log(`  Status: ${lookup.status}\n`);

  // 3. Validate before redemption
  console.log('Validating coupon...');
  const validation = await client.passes.validate(passId);
  console.log(`  Can redeem: ${validation.canBeRedeemed}\n`);

  // 4. Redeem the coupon at a store
  if (validation.canBeRedeemed) {
    console.log('Redeeming coupon...');
    try {
      const redemption = await client.passes.redeemCoupon(passId, {
        location: { name: 'Store #42', latitude: 4.6097, longitude: -74.0817 },
        notes: 'Applied to order #12345',
      });
      console.log(`  Previous status: ${redemption.previousStatus}`);
      console.log(`  New status: ${redemption.newStatus}`);
      console.log(`  Redeemed at: ${redemption.redeemedAt}\n`);
    } catch (err) {
      if (err instanceof BusinessRuleError) {
        console.error(`Cannot redeem: ${err.message}`);
      } else {
        throw err;
      }
    }
  }

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
