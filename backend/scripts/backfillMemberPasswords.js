// One-off migration script — run after adding members.password, or after a
// data migration that dropped passwords:
//   node scripts/backfillMemberPasswords.js
// Sets every member without a password to their member_id, zero-padded to
// 6 digits (hashed) — e.g. member_id 88 -> 000088. New members get the same
// default automatically going forward via memberModel.createMember.
import dotenv from 'dotenv';
import { initializePool, query } from '../src/config/database.js';
import { hashPassword } from '../src/utils/passwordUtils.js';

dotenv.config();

const run = async () => {
  await initializePool();

  const members = await query(
    "SELECT id, member_id FROM members WHERE password IS NULL AND member_id IS NOT NULL AND member_id != ''"
  );

  console.log(`Found ${members.length} member(s) without a password.`);

  for (const member of members) {
    const defaultPassword = String(member.member_id).padStart(6, '0');
    const hashed = await hashPassword(defaultPassword);
    await query('UPDATE members SET password = ? WHERE id = ?', [hashed, member.id]);
    console.log(`  Member ${member.id} (member_id ${member.member_id}): password set to member_id, zero-padded to 6 digits.`);
  }

  console.log('Done.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
