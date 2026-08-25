/**
 * Utility to ensure rank-related columns exist in Cloudflare D1 database.
 */

let migrationAttempted = false;

export async function ensureRankColumns() {
  if (migrationAttempted) return;
  migrationAttempted = true;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    return;
  }

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

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  // Run all ALTER TABLE queries concurrently in parallel to avoid sequential network roundtrips
  await Promise.allSettled(
    columns.map((col) =>
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `ALTER TABLE accounts ADD COLUMN ${col};`,
          params: [],
        }),
        cache: 'no-store',
      })
    )
  );
}

let userGoogleMigrationAttempted = false;

export async function ensureUserGoogleColumns() {
  if (userGoogleMigrationAttempted) return;
  userGoogleMigrationAttempted = true;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    return;
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const statements = [
    'ALTER TABLE users ADD COLUMN google_id TEXT;',
    'ALTER TABLE users ADD COLUMN google_email TEXT;',
    'CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users(google_id);',
  ];

  // Run statements concurrently
  await Promise.allSettled(
    statements.map((sql) =>
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params: [],
        }),
        cache: 'no-store',
      })
    )
  );
}

let sharedAccountMigrationAttempted = false;

export async function ensureSharedAccountColumns() {
  if (sharedAccountMigrationAttempted) return;
  sharedAccountMigrationAttempted = true;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    return;
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const statements = [
    'ALTER TABLE shared_accounts ADD COLUMN can_reshare INTEGER DEFAULT 0;',
  ];

  await Promise.allSettled(
    statements.map((sql) =>
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params: [],
        }),
        cache: 'no-store',
      })
    )
  );
}
