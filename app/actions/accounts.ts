'use server';

import { db, queryD1 } from '@/lib/db/client';
import { accounts, sharedAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';
import { requireAuthUserId } from '@/lib/session';
import { fetchSummonerRank } from '@/lib/riot';

interface AccountRow {
  id: string;
  region: string;
  alias: string;
  summonerId: string;
  username: string;
  password: string;
  ownerId: string;
  soloTier: string | null;
  soloRank: string | null;
  soloLp: number | null;
  soloWins: number | null;
  soloLosses: number | null;
  flexTier: string | null;
  flexRank: string | null;
  flexLp: number | null;
  flexWins: number | null;
  flexLosses: number | null;
  rankUpdatedAt: string | null;
  createdAt: string;
  ownerNickname: string | null;
  myCanReshare: number | null;
  isSharedWithAnyone: number;
}

export async function getAccounts() {
  const userId = await requireAuthUserId();

  const sql = `
    SELECT 
      a.id,
      a.region,
      a.alias,
      a.summoner_id AS summonerId,
      a.username,
      a.password,
      a.owner_id AS ownerId,
      a.solo_tier AS soloTier,
      a.solo_rank AS soloRank,
      a.solo_lp AS soloLp,
      a.solo_wins AS soloWins,
      a.solo_losses AS soloLosses,
      a.flex_tier AS flexTier,
      a.flex_rank AS flexRank,
      a.flex_lp AS flexLp,
      a.flex_wins AS flexWins,
      a.flex_losses AS flexLosses,
      a.rank_updated_at AS rankUpdatedAt,
      a.created_at AS createdAt,
      u.nickname AS ownerNickname,
      sa_cur.can_reshare AS myCanReshare,
      EXISTS(SELECT 1 FROM shared_accounts sa_any WHERE sa_any.account_id = a.id) AS isSharedWithAnyone
    FROM accounts a
    LEFT JOIN users u ON a.owner_id = u.id
    LEFT JOIN shared_accounts sa_cur ON (sa_cur.account_id = a.id AND sa_cur.user_id = ?)
    WHERE a.owner_id = ? OR sa_cur.account_id IS NOT NULL
    ORDER BY a.created_at DESC;
  `;

  const resultList = await queryD1<AccountRow>(sql, [userId, userId]);

  return resultList.map(acc => {
    const isOwner = acc.ownerId === userId;
    const canReshare = isOwner ? false : Number(acc.myCanReshare) === 1;
    const canShare = isOwner || canReshare;
    const isShared = !isOwner || Number(acc.isSharedWithAnyone) === 1;

    return {
      id: acc.id,
      region: acc.region,
      alias: acc.alias,
      summonerId: acc.summonerId,
      username: acc.username,
      password: decrypt(acc.password),
      isOwner,
      isShared,
      canReshare,
      canShare,
      ownerNickname: acc.ownerNickname ?? 'Unknown',
      soloTier: acc.soloTier,
      soloRank: acc.soloRank,
      soloLp: acc.soloLp,
      soloWins: acc.soloWins,
      soloLosses: acc.soloLosses,
      flexTier: acc.flexTier,
      flexRank: acc.flexRank,
      flexLp: acc.flexLp,
      flexWins: acc.flexWins,
      flexLosses: acc.flexLosses,
      rankUpdatedAt: acc.rankUpdatedAt,
    };
  });
}

export async function addAccount(data: {
  region: string;
  alias: string;
  summonerId: string;
  username: string;
  password: string;
}) {
  const userId = await requireAuthUserId();
  
  const encryptedPassword = encrypt(data.password);
  
  await db.insert(accounts).values({
    region: data.region,
    alias: data.alias,
    summonerId: data.summonerId,
    username: data.username,
    password: encryptedPassword,
    ownerId: userId
  });
  
  revalidatePath('/');
}

export async function deleteAccount(id: string) {
  const userId = await requireAuthUserId();
  
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id));

  if (!account || account.ownerId !== userId) {
    throw new Error('Unauthorized');
  }
  
  await db
    .delete(accounts)
    .where(eq(accounts.id, id));
  
  revalidatePath('/');
}

export async function updateAccount(id: string, data: {
  region: string;
  alias: string;
  summonerId: string;
  username: string;
  password: string;
}) {
  const userId = await requireAuthUserId();
  
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id));

  if (!account || account.ownerId !== userId) {
    throw new Error('Unauthorized');
  }

  const encryptedPassword = encrypt(data.password);
  
  await db
    .update(accounts)
    .set({
      region: data.region,
      alias: data.alias,
      summonerId: data.summonerId,
      username: data.username,
      password: encryptedPassword,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(accounts.id, id));
  
  revalidatePath('/');
}

export async function refreshAccountRank(id: string) {
  const userId = await requireAuthUserId();

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id));

  if (!account) {
    return { success: false, error: 'ACCOUNT_NOT_FOUND' };
  }

  // Check permission: must be owner or shared with user
  if (account.ownerId !== userId) {
    const [shared] = await db
      .select()
      .from(sharedAccounts)
      .where(eq(sharedAccounts.accountId, id));
    if (!shared || shared.userId !== userId) {
      return { success: false, error: 'UNAUTHORIZED' };
    }
  }

  const rankResult = await fetchSummonerRank(account.region, account.summonerId);

  if (!rankResult.success) {
    return rankResult;
  }

  const nowIso = rankResult.updatedAt || new Date().toISOString();

  await db
    .update(accounts)
    .set({
      soloTier: rankResult.solo?.tier ?? null,
      soloRank: rankResult.solo?.rank ?? null,
      soloLp: rankResult.solo?.lp ?? null,
      soloWins: rankResult.solo?.wins ?? null,
      soloLosses: rankResult.solo?.losses ?? null,
      flexTier: rankResult.flex?.tier ?? null,
      flexRank: rankResult.flex?.rank ?? null,
      flexLp: rankResult.flex?.lp ?? null,
      flexWins: rankResult.flex?.wins ?? null,
      flexLosses: rankResult.flex?.losses ?? null,
      rankUpdatedAt: nowIso,
      updatedAt: nowIso,
    })
    .where(eq(accounts.id, id));

  revalidatePath('/');

  return {
    success: true,
    solo: rankResult.solo,
    flex: rankResult.flex,
    updatedAt: nowIso,
  };
}

