// One-off migration script — links QR codes that were bulk-uploaded directly
// to Cloudinary (org/qrcode/) to their member, by parsing the member_id out
// of each asset's public_id (expected format: QR_<member_id>_<name>_<random>).
//
// Dry run (default, no DB writes):
//   node scripts/linkCloudinaryQRCodes.js
// Apply the updates:
//   node scripts/linkCloudinaryQRCodes.js --apply
import dotenv from 'dotenv';
import cloudinary from '../src/config/cloudinary.js';
import { initializePool, query } from '../src/config/database.js';

dotenv.config();

const ASSET_FOLDER = 'org/qrcodes';
const PUBLIC_ID_PATTERN = /^QR_(\d+)_/;
const DRY_RUN = !process.argv.includes('--apply');

// This Cloudinary account uses dynamic folders, so the folder lives in the
// separate `asset_folder` field rather than being embedded in public_id —
// the classic prefix-based api.resources() call can't see it, hence Search.
const fetchAllResources = async () => {
  const resources = [];
  let nextCursor;

  do {
    const result = await cloudinary.search
      .expression(`asset_folder:"${ASSET_FOLDER}"`)
      .max_results(500)
      .next_cursor(nextCursor)
      .execute();

    resources.push(...result.resources);
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return resources;
};

const run = async () => {
  await initializePool();

  const resources = await fetchAllResources();
  console.log(`Found ${resources.length} resource(s) under "${ASSET_FOLDER}".`);

  const matched = [];
  const unparsed = [];

  for (const resource of resources) {
    const match = resource.public_id.match(PUBLIC_ID_PATTERN);
    if (!match) {
      unparsed.push(resource.public_id);
      continue;
    }
    matched.push({ memberId: match[1], url: resource.secure_url, publicId: resource.public_id });
  }

  if (unparsed.length) {
    console.log(`\n${unparsed.length} public_id(s) did not match the QR_<id>_ pattern:`);
    unparsed.forEach((id) => console.log(`  ${id}`));
  }

  let updated = 0;
  let notFound = 0;

  for (const { memberId, url, publicId } of matched) {
    const existing = await query('SELECT id FROM members WHERE member_id = ?', [memberId]);
    if (existing.length === 0) {
      notFound++;
      console.log(`  No member found for member_id ${memberId} (public_id ${publicId})`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] member_id ${memberId} -> ${url}`);
    } else {
      await query('UPDATE members SET qr_code = ? WHERE member_id = ?', [url, memberId]);
      console.log(`  member_id ${memberId} -> qr_code updated`);
    }
    updated++;
  }

  console.log(
    `\n${DRY_RUN ? 'Would update' : 'Updated'} ${updated} member(s). ${notFound} member_id(s) not found in DB. ${unparsed.length} unparsed public_id(s).`
  );
  if (DRY_RUN) {
    console.log('\nThis was a dry run — no changes were written. Re-run with --apply to write to the database.');
  }

  process.exit(0);
};

run().catch((err) => {
  console.error('Linking failed:', err);
  process.exit(1);
});
