import { ensureRankColumns } from '../lib/db/ensureColumns';
import { fetchSummonerRank } from '../lib/riot';

interface AccountRow {
  id: string;
  region: string;
  alias: string;
  summoner_id: string;
}

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const riotKey = process.env.RIOT_API_KEY;

  if (!accountId || !databaseId || !apiToken) {
    console.error('❌ Cloudflare D1 credentials missing in .env');
    process.exit(1);
  }

  if (!riotKey) {
    console.error('❌ RIOT_API_KEY missing in .env');
    process.exit(1);
  }

  console.log('🔄 Checking database columns...');
  await ensureRankColumns();

  console.log('📦 Fetching accounts from database...');
  const queryUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const listRes = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql: 'SELECT id, region, alias, summoner_id FROM accounts;',
      params: [],
    }),
    cache: 'no-store',
  });

  const listJson = await listRes.json() as {
    success: boolean;
    result?: { results: AccountRow[] }[];
  };

  const rows = listJson.result?.[0]?.results || [];
  console.log(`📋 Found ${rows.length} accounts in total.\n`);

  if (rows.length === 0) {
    console.log('No accounts found in database.');
    return;
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const acc = rows[i];
    console.log(`[${i + 1}/${rows.length}] 正在查询: ${acc.alias} | 大区: ${acc.region} | 召唤师: ${acc.summoner_id}`);

    try {
      const rankResult = await fetchSummonerRank(acc.region, acc.summoner_id);

      if (rankResult.success) {
        const nowIso = rankResult.updatedAt || new Date().toISOString();
        const soloText = rankResult.solo 
          ? `${rankResult.solo.tier} ${rankResult.solo.rank} (${rankResult.solo.lp} LP - ${rankResult.solo.wins}W ${rankResult.solo.losses}L)`
          : '未定级 (Unranked)';
        const flexText = rankResult.flex
          ? `${rankResult.flex.tier} ${rankResult.flex.rank} (${rankResult.flex.lp} LP - ${rankResult.flex.wins}W ${rankResult.flex.losses}L)`
          : '未定级 (Unranked)';

        console.log(`   ✅ 查询成功: 单双 [${soloText}] | 灵活 [${flexText}]`);

        // Update in database
        await fetch(queryUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: `UPDATE accounts SET 
              solo_tier = ?, solo_rank = ?, solo_lp = ?, solo_wins = ?, solo_losses = ?,
              flex_tier = ?, flex_rank = ?, flex_lp = ?, flex_wins = ?, flex_losses = ?,
              rank_updated_at = ?, updated_at = ?
              WHERE id = ?;`,
            params: [
              rankResult.solo?.tier ?? null,
              rankResult.solo?.rank ?? null,
              rankResult.solo?.lp ?? null,
              rankResult.solo?.wins ?? null,
              rankResult.solo?.losses ?? null,
              rankResult.flex?.tier ?? null,
              rankResult.flex?.rank ?? null,
              rankResult.flex?.lp ?? null,
              rankResult.flex?.wins ?? null,
              rankResult.flex?.losses ?? null,
              nowIso,
              nowIso,
              acc.id,
            ],
          }),
          cache: 'no-store',
        });

        successCount++;
      } else {
        console.log(`   ⚠️ 查询失败: ${rankResult.error || 'Unknown error'}`);
        failCount++;
      }
    } catch (err: any) {
      console.log(`   ❌ 错误: ${err.message}`);
      failCount++;
    }

    // Rate limiting pause (600ms)
    await sleep(600);
  }

  console.log(`\n🎉 批量查询完成！成功: ${successCount} 个, 失败/未查到: ${failCount} 个。`);
}

main().catch(console.error);
