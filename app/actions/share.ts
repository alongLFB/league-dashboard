'use server';

import { db } from '@/lib/db/client';
import { accounts, users, sharedAccounts } from '@/lib/db/schema';
import { eq, and, ne, or, inArray, desc, like } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAuthUserId } from '@/lib/session';
import { maskEmail } from '@/lib/utils';
import { ensureSharedAccountColumns } from '@/lib/db/ensureColumns';

export async function getRegisteredUsersForShare(query?: string) {
  const userId = await requireAuthUserId();
  
  let whereClause = ne(users.id, userId);
  
  if (query && query.trim() !== '') {
    const q = `%${query.trim()}%`;
    whereClause = and(
      ne(users.id, userId),
      or(
        like(users.username, q),
        like(users.email, q),
        like(users.nickname, q)
      )
    ) as any;
  }
  
  const userList = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(whereClause)
    .limit(50);
  
  const formattedUsers = userList.map(u => ({
    id: u.id,
    nickname: u.nickname,
    username: u.username,
    displayInfo: maskEmail(u.email)
  }));
  
  return { success: true, users: formattedUsers };
}

export async function searchUserForShare(query: string) {
  const userId = await requireAuthUserId();
  
  if (!query || query.trim() === '') return null;
  
  const [user] = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        or(eq(users.username, query), eq(users.email, query)),
        ne(users.id, userId) // Cannot share with yourself
      )
    );
  
  if (!user) return null;
  
  return {
    id: user.id,
    nickname: user.nickname,
    username: user.username,
    displayInfo: maskEmail(user.email)
  };
}

export async function shareAccount(accountId: string, targetUserId: string, canReshare: boolean = false) {
  const userId = await requireAuthUserId();
  await ensureSharedAccountColumns();
  
  // Verify ownership or secondary share permission
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));

  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  const isOwner = account.ownerId === userId;
  let hasResharePermission = false;

  if (!isOwner) {
    const [userShare] = await db
      .select()
      .from(sharedAccounts)
      .where(
        and(
          eq(sharedAccounts.accountId, accountId),
          eq(sharedAccounts.userId, userId)
        )
      );
    if (userShare && Number(userShare.canReshare) === 1) {
      hasResharePermission = true;
    }
  }

  if (!isOwner && !hasResharePermission) {
    return { success: false, error: 'Unauthorized to share this account' };
  }
  
  try {
    const [existing] = await db
      .select()
      .from(sharedAccounts)
      .where(
        and(
          eq(sharedAccounts.accountId, accountId),
          eq(sharedAccounts.userId, targetUserId)
        )
      );

    const allowReshareVal = (isOwner && canReshare) ? 1 : 0;

    if (existing) {
      if (isOwner) {
        await db
          .update(sharedAccounts)
          .set({ canReshare: allowReshareVal })
          .where(eq(sharedAccounts.id, existing.id));
        revalidatePath('/');
        return { success: true, updated: true };
      }
      return { success: false, error: 'Already shared with this user' };
    }

    await db.insert(sharedAccounts).values({
      accountId,
      userId: targetUserId,
      canReshare: allowReshareVal,
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: 'Failed to share account' };
  }
}

export async function getAccountShares(accountId: string) {
  const userId = await requireAuthUserId();
  await ensureSharedAccountColumns();
  
  // Verify ownership or secondary share permission
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));

  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  const isOwner = account.ownerId === userId;
  let hasResharePermission = false;

  if (!isOwner) {
    const [userShare] = await db
      .select()
      .from(sharedAccounts)
      .where(
        and(
          eq(sharedAccounts.accountId, accountId),
          eq(sharedAccounts.userId, userId)
        )
      );
    if (userShare && Number(userShare.canReshare) === 1) {
      hasResharePermission = true;
    }
  }

  if (!isOwner && !hasResharePermission) {
    return { success: false, error: 'Unauthorized or account not found' };
  }
  
  const shares = await db
    .select({
      id: sharedAccounts.id,
      userId: sharedAccounts.userId,
      nickname: users.nickname,
      email: users.email,
      canReshare: sharedAccounts.canReshare,
      createdAt: sharedAccounts.createdAt,
    })
    .from(sharedAccounts)
    .innerJoin(users, eq(sharedAccounts.userId, users.id))
    .where(eq(sharedAccounts.accountId, accountId))
    .orderBy(desc(sharedAccounts.createdAt));
  
  const formattedShares = shares.map(share => ({
    id: share.id,
    userId: share.userId,
    nickname: share.nickname,
    displayInfo: maskEmail(share.email),
    canReshare: Number(share.canReshare) === 1,
    isOwner,
    createdAt: share.createdAt
  }));
  
  return { success: true, shares: formattedShares, isOwner };
}

export async function toggleShareResharePermission(accountId: string, targetUserId: string, canReshare: boolean) {
  const userId = await requireAuthUserId();
  await ensureSharedAccountColumns();

  // Only the original account owner can change secondary sharing permissions
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));

  if (!account || account.ownerId !== userId) {
    return { success: false, error: 'Only the account owner can change reshare permissions' };
  }

  try {
    await db
      .update(sharedAccounts)
      .set({ canReshare: canReshare ? 1 : 0 })
      .where(
        and(
          eq(sharedAccounts.accountId, accountId),
          eq(sharedAccounts.userId, targetUserId)
        )
      );

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to update reshare permission' };
  }
}

export async function revokeShare(accountId: string, targetUserId: string) {
  const userId = await requireAuthUserId();
  
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));

  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  const isOwner = account.ownerId === userId;
  let hasResharePermission = false;

  if (!isOwner) {
    const [userShare] = await db
      .select()
      .from(sharedAccounts)
      .where(
        and(
          eq(sharedAccounts.accountId, accountId),
          eq(sharedAccounts.userId, userId)
        )
      );
    if (userShare && Number(userShare.canReshare) === 1) {
      hasResharePermission = true;
    }
  }

  if (!isOwner && !hasResharePermission) {
    return { success: false, error: 'Unauthorized or account not found' };
  }
  
  try {
    await db
      .delete(sharedAccounts)
      .where(
        and(
          eq(sharedAccounts.accountId, accountId),
          eq(sharedAccounts.userId, targetUserId)
        )
      );
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to revoke share' };
  }
}

export async function batchShareAccounts(accountIds: string[], targetUserId: string, canReshare: boolean = false) {
  const userId = await requireAuthUserId();
  await ensureSharedAccountColumns();
  
  if (accountIds.length === 0) return { success: true };

  // Fetch all accounts
  const allAccounts = await db
    .select()
    .from(accounts)
    .where(inArray(accounts.id, accountIds));
  
  if (allAccounts.length !== accountIds.length) {
    return { success: false, error: 'Some accounts not found' };
  }

  // Fetch caller's shared records with canReshare=1
  const callerShares = await db
    .select()
    .from(sharedAccounts)
    .where(
      and(
        inArray(sharedAccounts.accountId, accountIds),
        eq(sharedAccounts.userId, userId),
        eq(sharedAccounts.canReshare, 1)
      )
    );
  
  const allowedSecondaryAccountIds = new Set(callerShares.map(s => s.accountId));

  // Verify that for every account, caller is owner OR has secondary share permission
  for (const acc of allAccounts) {
    const isOwner = acc.ownerId === userId;
    const isAuthorizedSecondary = allowedSecondaryAccountIds.has(acc.id);
    if (!isOwner && !isAuthorizedSecondary) {
      return { success: false, error: 'UNAUTHORIZED_ACCOUNTS' };
    }
  }
  
  try {
    for (const account of allAccounts) {
      const isOwner = account.ownerId === userId;
      const allowReshareVal = (isOwner && canReshare) ? 1 : 0;

      const [existing] = await db
        .select()
        .from(sharedAccounts)
        .where(
          and(
            eq(sharedAccounts.accountId, account.id),
            eq(sharedAccounts.userId, targetUserId)
          )
        );

      if (!existing) {
        await db.insert(sharedAccounts).values({
          accountId: account.id,
          userId: targetUserId,
          canReshare: allowReshareVal,
        });
      } else if (isOwner) {
        await db
          .update(sharedAccounts)
          .set({ canReshare: allowReshareVal })
          .where(eq(sharedAccounts.id, existing.id));
      }
    }
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to batch share accounts' };
  }
}

export async function getBatchAccountShares(accountIds: string[]) {
  const userId = await requireAuthUserId();
  await ensureSharedAccountColumns();
  
  if (accountIds.length === 0) return { success: true, shares: [] };

  // Fetch accounts owned by caller or shared with canReshare=1
  const ownedAccounts = await db
    .select()
    .from(accounts)
    .where(and(inArray(accounts.id, accountIds), eq(accounts.ownerId, userId)));

  const callerShares = await db
    .select({ accountId: sharedAccounts.accountId })
    .from(sharedAccounts)
    .where(
      and(
        inArray(sharedAccounts.accountId, accountIds),
        eq(sharedAccounts.userId, userId),
        eq(sharedAccounts.canReshare, 1)
      )
    );

  const authorizedAccountIds = Array.from(
    new Set([...ownedAccounts.map(a => a.id), ...callerShares.map(s => s.accountId)])
  );

  if (authorizedAccountIds.length === 0) {
    return { success: false, error: 'No authorized accounts found', shares: [] };
  }

  const ownedIdSet = new Set(ownedAccounts.map(a => a.id));

  const shares = await db
    .select({
      userId: sharedAccounts.userId,
      nickname: users.nickname,
      email: users.email,
      accountId: sharedAccounts.accountId,
      accountAlias: accounts.alias,
      accountRegion: accounts.region,
      accountSummonerId: accounts.summonerId,
      canReshare: sharedAccounts.canReshare,
      createdAt: sharedAccounts.createdAt,
    })
    .from(sharedAccounts)
    .innerJoin(users, eq(sharedAccounts.userId, users.id))
    .innerJoin(accounts, eq(sharedAccounts.accountId, accounts.id))
    .where(inArray(sharedAccounts.accountId, authorizedAccountIds))
    .orderBy(desc(sharedAccounts.createdAt));
  
  // Group by user
  const userMap = new Map();
  for (const share of shares) {
    if (!userMap.has(share.userId)) {
      userMap.set(share.userId, {
        userId: share.userId,
        nickname: share.nickname,
        displayInfo: maskEmail(share.email),
        accounts: [],
      });
    }
    userMap.get(share.userId).accounts.push({
      id: share.accountId,
      alias: share.accountAlias,
      region: share.accountRegion,
      summonerId: share.accountSummonerId,
      canReshare: Number(share.canReshare) === 1,
      isOwner: ownedIdSet.has(share.accountId),
    });
  }
  
  return { success: true, shares: Array.from(userMap.values()) };
}

export async function batchRevokeShareForUser(accountIds: string[], targetUserId: string) {
  const userId = await requireAuthUserId();
  
  if (accountIds.length === 0) return { success: true };

  // Fetch authorized accounts
  const ownedAccounts = await db
    .select()
    .from(accounts)
    .where(and(inArray(accounts.id, accountIds), eq(accounts.ownerId, userId)));

  const callerShares = await db
    .select({ accountId: sharedAccounts.accountId })
    .from(sharedAccounts)
    .where(
      and(
        inArray(sharedAccounts.accountId, accountIds),
        eq(sharedAccounts.userId, userId),
        eq(sharedAccounts.canReshare, 1)
      )
    );

  const authorizedAccountIds = Array.from(
    new Set([...ownedAccounts.map(a => a.id), ...callerShares.map(s => s.accountId)])
  );

  if (authorizedAccountIds.length === 0) {
    return { success: false, error: 'No authorized accounts found' };
  }
  
  try {
    await db
      .delete(sharedAccounts)
      .where(
        and(
          inArray(sharedAccounts.accountId, authorizedAccountIds),
          eq(sharedAccounts.userId, targetUserId)
        )
      );
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to batch revoke shares for user' };
  }
}

export async function getUsersWithSharedAccounts() {
  const userId = await requireAuthUserId();
  await ensureSharedAccountColumns();

  const shares = await db
    .select({
      userId: sharedAccounts.userId,
      userNickname: users.nickname,
      userEmail: users.email,
      accountId: sharedAccounts.accountId,
      accountAlias: accounts.alias,
      accountRegion: accounts.region,
      accountSummonerId: accounts.summonerId,
      canReshare: sharedAccounts.canReshare,
      createdAt: sharedAccounts.createdAt,
    })
    .from(sharedAccounts)
    .innerJoin(accounts, eq(sharedAccounts.accountId, accounts.id))
    .innerJoin(users, eq(sharedAccounts.userId, users.id))
    .where(eq(accounts.ownerId, userId))
    .orderBy(desc(sharedAccounts.createdAt));

  const userMap = new Map();
  for (const share of shares) {
    if (!userMap.has(share.userId)) {
      userMap.set(share.userId, {
        user: {
          id: share.userId,
          nickname: share.userNickname,
          displayInfo: maskEmail(share.userEmail)
        },
        accounts: []
      });
    }
    userMap.get(share.userId).accounts.push({
      id: share.accountId,
      alias: share.accountAlias,
      region: share.accountRegion,
      summonerId: share.accountSummonerId,
      canReshare: Number(share.canReshare) === 1,
    });
  }

  return { success: true, users: Array.from(userMap.values()) };
}

export async function revokeAllSharesForUser(targetUserId: string) {
  const userId = await requireAuthUserId();
  
  const userAccounts = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.ownerId, userId));

  if (userAccounts.length === 0) {
    return { success: true };
  }

  const authorizedAccountIds = userAccounts.map(a => a.id);

  try {
    await db
      .delete(sharedAccounts)
      .where(
        and(
          eq(sharedAccounts.userId, targetUserId),
          inArray(sharedAccounts.accountId, authorizedAccountIds)
        )
      );
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to revoke shares for user' };
  }
}
