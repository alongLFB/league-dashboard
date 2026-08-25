import { executeD1Sql } from './client';

/**
 * Utility to ensure rank-related columns exist in Cloudflare D1 database.
 */
let rankMigrationAttempted = false;

export async function ensureRankColumns() {
  if (rankMigrationAttempted) return;
  rankMigrationAttempted = true;

  const columns = [
    'solo_tier TEXT',
    'solo_rank TEXT',
    'solo_lp INTEGER',
    'solo_wins INTEGER',
    'solo_losses INTEGER',
    'flex_tier TEXT',
    'flex_rank TEXT',
    'flex_lp INTEGER',
    'flex_wins INTEGER',
    'flex_losses INTEGER',
    'rank_updated_at TEXT',
  ];

  await Promise.allSettled(
    columns.map((col) => executeD1Sql(`ALTER TABLE accounts ADD COLUMN ${col};`))
  );
}

let userGoogleMigrationAttempted = false;

export async function ensureUserGoogleColumns() {
  if (userGoogleMigrationAttempted) return;
  userGoogleMigrationAttempted = true;

  const statements = [
    'ALTER TABLE users ADD COLUMN google_id TEXT;',
    'ALTER TABLE users ADD COLUMN google_email TEXT;',
    'CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users(google_id);',
  ];

  await Promise.allSettled(
    statements.map((sql) => executeD1Sql(sql))
  );
}

let sharedAccountMigrationAttempted = false;

export async function ensureSharedAccountColumns() {
  if (sharedAccountMigrationAttempted) return;
  sharedAccountMigrationAttempted = true;

  const statements = [
    'ALTER TABLE shared_accounts ADD COLUMN can_reshare INTEGER DEFAULT 0;',
  ];

  await Promise.allSettled(
    statements.map((sql) => executeD1Sql(sql))
  );
}
