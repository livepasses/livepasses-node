/**
 * Example: CRUD operations on pass templates
 *
 * Run: npx tsx examples/template-management.ts
 * (Requires a valid API key - set LIVEPASSES_API_KEY env var)
 */
import { Livepasses, LivepassesError, ValidationError } from '../src/index.js';

const apiKey = process.env.LIVEPASSES_API_KEY ?? 'lp_test_your_key_here';

async function main() {
  const client = new Livepasses(apiKey);
  console.log('--- Template Management ---\n');

  // 1. Create a new event template
  console.log('Creating event template...');
  const template = await client.templates.create({
    name: 'VIP Concert Pass',
    description: 'Premium concert ticket with VIP access',
    // The template type is decided by which block is present: an `event` block makes an event ticket.
    businessFeatures: {
      event: {
        eventName: 'Aurora Music Fest',
        eventDate: '2030-06-15T20:00:00Z',
        venueName: 'Aurora Arena',
        showSeatNumbers: true,
        showGateInfo: true,
        sectionTypes: ['VIP'],
      },
      branding: { primaryColor: '#1A1A1D', textColor: '#FFFFFF', brandName: 'AURORA FEST' },
    },
  });
  console.log(`  Created: ${template.id} — "${template.name}"`);
  console.log(`  Status: ${template.status}\n`);

  // 2. Update the template
  console.log('Updating template...');
  const updated = await client.templates.update(template.id, {
    name: 'VIP Concert Pass v2',
    description: 'Updated premium concert ticket with backstage access',
    // PUT merges: send only what changed; omitted event fields keep their values.
    businessFeatures: {
      event: {
        sectionTypes: ['VIP', 'Backstage'],
      },
    },
  });
  console.log(`  Updated: "${updated.name}"\n`);

  // 3. Activate the template
  console.log('Activating template...');
  await client.templates.activate(template.id);
  console.log('  Template is now active\n');

  // 4. List all active templates
  console.log('Listing active templates...');
  const templates = await client.templates.list({ status: 'Active' });
  for (const t of templates.items) {
    console.log(`  - ${t.name} (${t.type}) [${t.status}]`);
  }
  console.log(`  Total: ${templates.pagination.totalItems}\n`);

  // 5. Get template details
  console.log('Getting template details...');
  const detail = await client.templates.get(template.id);
  console.log(`  Name: ${detail.name}`);
  console.log(`  Type: ${detail.type}`);
  console.log(`  Business features:`, JSON.stringify(detail.businessFeatures, null, 2));
  console.log();

  // 6. Deactivate when done
  console.log('Deactivating template...');
  await client.templates.deactivate(template.id);
  console.log('  Template deactivated\n');

  console.log('Done!');
}

main().catch((err) => {
  if (err instanceof ValidationError) {
    console.error(`Validation error: ${err.message}`, err.details);
  } else if (err instanceof LivepassesError) {
    console.error(`API error [${err.code}]: ${err.message}`);
  } else {
    console.error('Error:', err);
  }
  process.exit(1);
});
