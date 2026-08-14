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

  for (const col of columns) {
    try {
      await fetch(url, {
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
      });
    } catch {
      // Column may already exist or network error; safely ignore
    }
  }
}
