// One-off migration script — populates the `branches` table from the
// distinct `branch` values in the legacy `members_source` table, and links
// each member to their branch (members.branch_id) by matching member_id.
//
// Run the DDL in docs/DATABASE.md ("BRANCH FEATURE" section) first to create
// the branches table and members.branch_id column — this script only
// inserts/updates data, it does not touch schema.
//
// members_source uses collation utf8mb4_0900_ai_ci while members uses
// utf8mb4_general_ci, so the member_id join needs an explicit COLLATE or
// MySQL rejects it ("Illegal mix of collations").
//
// Dry run (default, no DB writes):
//   node scripts/createBranchesFromSource.js
// Apply (writes the data):
//   node scripts/createBranchesFromSource.js --apply
import dotenv from 'dotenv';
import { initializePool, query } from '../src/config/database.js';

dotenv.config();

const DRY_RUN = !process.argv.includes('--apply');

const tableExists = async (tableName) => {
  const [{ cnt }] = await query(
    'SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [tableName]
  );
  return cnt > 0;
};

const columnExists = async (tableName, columnName) => {
  const [{ cnt }] = await query(
    'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [tableName, columnName]
  );
  return cnt > 0;
};

const run = async () => {
  await initializePool();

  const branchesTableExists = await tableExists('branches');
  const branchIdColumnExists = await columnExists('members', 'branch_id');

  const sourceBranches = await query(
    "SELECT DISTINCT TRIM(branch) AS name FROM members_source WHERE branch IS NOT NULL AND TRIM(branch) <> '' ORDER BY name"
  );

  const [{ cnt: matchable }] = await query(`
    SELECT COUNT(*) AS cnt
    FROM members m
    JOIN members_source ms ON ms.member_id COLLATE utf8mb4_general_ci = m.member_id
    WHERE ms.branch IS NOT NULL AND TRIM(ms.branch) <> ''
  `);

  console.log(`branches table exists: ${branchesTableExists}`);
  console.log(`members.branch_id column exists: ${branchIdColumnExists}`);
  console.log(`\n${sourceBranches.length} distinct branch name(s) in members_source:`);
  sourceBranches.forEach((b) => console.log(`  ${b.name}`));
  console.log(`\n${matchable} member(s) would get a branch_id set (the rest have no branch in members_source).`);

  if (!branchesTableExists || !branchIdColumnExists) {
    console.log(
      '\nRun the DDL in docs/DATABASE.md ("BRANCH FEATURE" section) first to create the branches table / members.branch_id column, then re-run this script.'
    );
    process.exit(DRY_RUN ? 0 : 1);
  }

  if (DRY_RUN) {
    console.log('\nThis was a dry run — no changes were written. Re-run with --apply to write changes.');
    process.exit(0);
  }

  await query(
    "INSERT IGNORE INTO branches (name) SELECT DISTINCT TRIM(branch) FROM members_source WHERE branch IS NOT NULL AND TRIM(branch) <> ''"
  );
  console.log('Populated branches with distinct names from members_source.');

  const result = await query(`
    UPDATE members m
    JOIN members_source ms ON ms.member_id COLLATE utf8mb4_general_ci = m.member_id
    JOIN branches b ON b.name = TRIM(ms.branch)
    SET m.branch_id = b.id
    WHERE ms.branch IS NOT NULL AND TRIM(ms.branch) <> ''
  `);
  console.log(`Updated ${result.affectedRows} member row(s) with branch_id.`);

  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
