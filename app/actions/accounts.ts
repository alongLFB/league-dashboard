'use server';

import { db } from '@/lib/db/client';
import { accounts, users, sharedAccounts } from '@/lib/db/schema';
import { eq, or, inArray, desc } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';
import { requireAuthUserId } from '@/lib/session';
import { fetchSummonerRank } from '@/lib/riot';
import { ensureRankColumns, ensureSharedAccountColumns } from '@/lib/db/ensureColumns';

export async function getAccounts() {
  const userId = await requireAuthUserId();
  await ensureRankColumns();
  await ensureSharedAccountColumns();
  
  const shared = await db
    .select({
      accountId: sharedAccounts.accountId,
      canReshare: sharedAccounts.canReshare,
    })
    .from(sharedAccounts)
    .where(eq(sharedAccounts.userId, userId));
  
  const sharedMap = new Map<string, { canReshare: boolean }>();
  for (const s of shared) {
    sharedMap.set(s.accountId, { canReshare: Number(s.canReshare) === 1 });
  }

  const sharedIds = Array.from(sharedMap.keys());

  const whereClause = sharedIds.length > 0
    ? or(eq(accounts.ownerId, userId), inArray(accounts.id, sharedIds))
    : eq(accounts.ownerId, userId);

  const resultList = await db
    .select({
      id: accounts.id,
      region: accounts.region,
      alias: accounts.alias,
      summonerId: accounts.summonerId,
      username: accounts.username,
      password: accounts.password,
      ownerId: accounts.ownerId,
      soloTier: accounts.soloTier,
      soloRank: accounts.soloRank,
      soloLp: accounts.soloLp,
      soloWins: accounts.soloWins,
      soloLosses: accounts.soloLosses,
      flexTier: accounts.flexTier,
      flexRank: accounts.flexRank,
      flexLp: accounts.flexLp,
      flexWins: accounts.flexWins,
      flexLosses: accounts.flexLosses,
      rankUpdatedAt: accounts.rankUpdatedAt,
      createdAt: accounts.createdAt,
      ownerNickname: users.nickname,
    })
    .from(accounts)
    .leftJoin(users, eq(accounts.ownerId, users.id))
    .where(whereClause)
    .orderBy(desc(accounts.createdAt));

  const allSharedRecords = await db
    .select({ accountId: sharedAccounts.accountId })
    .from(sharedAccounts);
  const allSharedAccountIds = new Set(allSharedRecords.map(s => s.accountId));

  return resultList.map(acc => {
    const isOwner = acc.ownerId === userId;
    const userShareInfo = sharedMap.get(acc.id);
    const canReshare = isOwner ? false : Boolean(userShareInfo?.canReshare);
    const canShare = isOwner || canReshare;
    const isShared = !isOwner || allSharedAccountIds.has(acc.id);

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
  await ensureRankColumns();
  
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
  await ensureRankColumns();

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

