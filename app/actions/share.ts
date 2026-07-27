'use server';

import { db } from '@/lib/db/client';
import { accounts, users, sharedAccounts } from '@/lib/db/schema';
import { eq, and, ne, or, inArray, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { decryptSession } from '@/lib/session';
import { cookies } from 'next/headers';

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;
  const session = await decryptSession(sessionCookie);
  if (!session?.userId) {
    throw new Error('Unauthorized');
  }
  return session.userId as string;
}

export async function searchUserForShare(query: string) {
  const userId = await requireAuth();
  
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
    displayInfo: user.email.replace(/(.{2})(.*)(?=@)/,
      (_gp1: string, gp2: string, gp3: string) => { 
        let mask = "";
        for (let i = 0; i < gp3.length; i++) mask += "*";
        return gp2 + mask;
      }
    )
  };
}

export async function shareAccount(accountId: string, targetUserId: string) {
  const userId = await requireAuth();
  
  // Verify ownership
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));

  if (!account || account.ownerId !== userId) {
    return { success: false, error: 'Unauthorized or account not found' };
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

    if (existing) {
      return { success: false, error: 'Already shared with this user' };
    }

    await db.insert(sharedAccounts).values({
      accountId,
      userId: targetUserId
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: 'Failed to share account' };
  }
}

export async function getAccountShares(accountId: string) {
  const userId = await requireAuth();
  
  // Verify ownership
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));

  if (!account || account.ownerId !== userId) {
    return { success: false, error: 'Unauthorized or account not found' };
  }
  
  const shares = await db
    .select({
      id: sharedAccounts.id,
      userId: users.id,
      nickname: users.nickname,
      email: users.email,
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
    displayInfo: share.email.replace(/(.{2})(.*)(?=@)/,
      (_gp1: string, gp2: string, gp3: string) => { 
        let mask = "";
        for (let i = 0; i < gp3.length; i++) mask += "*";
        return gp2 + mask;
      }
    ),
    createdAt: share.createdAt
  }));
  
  return { success: true, shares: formattedShares };
}

export async function revokeShare(accountId: string, targetUserId: string) {
  const userId = await requireAuth();
  
  // Verify ownership
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));

  if (!account || account.ownerId !== userId) {
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

export async function batchShareAccounts(accountIds: string[], targetUserId: string) {
  const userId = await requireAuth();
  
  if (accountIds.length === 0) return { success: true };

  // Verify ownership for all accounts
  const userAccounts = await db
    .select()
    .from(accounts)
    .where(and(inArray(accounts.id, accountIds), eq(accounts.ownerId, userId)));
  
  if (userAccounts.length !== accountIds.length) {
    return { success: false, error: 'Some accounts not found or unauthorized' };
  }
  
  try {
    for (const accountId of accountIds) {
      const [existing] = await db
        .select()
        .from(sharedAccounts)
        .where(
          and(
            eq(sharedAccounts.accountId, accountId),
            eq(sharedAccounts.userId, targetUserId)
          )
        );

      if (!existing) {
        await db.insert(sharedAccounts).values({
          accountId,
          userId: targetUserId
        });
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
  const userId = await requireAuth();
  
  if (accountIds.length === 0) return { success: true, shares: [] };

  // Verify ownership for all accounts
  const userAccounts = await db
    .select()
    .from(accounts)
    .where(and(inArray(accounts.id, accountIds), eq(accounts.ownerId, userId)));

  if (userAccounts.length === 0) {
    return { success: false, error: 'No authorized accounts found' };
  }

  const authorizedAccountIds = userAccounts.map(a => a.id);
  
  const shares = await db
    .select({
      userId: users.id,
      nickname: users.nickname,
      email: users.email,
    })
    .from(sharedAccounts)
    .innerJoin(users, eq(sharedAccounts.userId, users.id))
    .where(inArray(sharedAccounts.accountId, authorizedAccountIds))
    .orderBy(desc(sharedAccounts.createdAt));
  
  // Deduplicate users
  const userMap = new Map();
  for (const share of shares) {
    if (!userMap.has(share.userId)) {
      userMap.set(share.userId, share);
    }
  }
  
  const formattedShares = Array.from(userMap.values()).map(user => ({
    userId: user.userId,
    nickname: user.nickname,
    displayInfo: user.email.replace(/(.{2})(.*)(?=@)/,
      (_gp1: string, gp2: string, gp3: string) => { 
        let mask = "";
        for (let i = 0; i < gp3.length; i++) mask += "*";
        return gp2 + mask;
      }
    )
  }));
  
  return { success: true, shares: formattedShares };
}

export async function batchRevokeShareForUser(accountIds: string[], targetUserId: string) {
  const userId = await requireAuth();
  
  if (accountIds.length === 0) return { success: true };

  // Verify ownership
  const userAccounts = await db
    .select()
    .from(accounts)
    .where(and(inArray(accounts.id, accountIds), eq(accounts.ownerId, userId)));

  if (userAccounts.length === 0) {
    return { success: false, error: 'No authorized accounts found' };
  }
  
  const authorizedAccountIds = userAccounts.map(a => a.id);
  
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
  const userId = await requireAuth();

  const shares = await db
    .select({
      userId: users.id,
      userNickname: users.nickname,
      userEmail: users.email,
      accountId: accounts.id,
      accountAlias: accounts.alias,
      accountRegion: accounts.region,
      accountSummonerId: accounts.summonerId,
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
          displayInfo: share.userEmail.replace(/(.{2})(.*)(?=@)/,
            (_gp1: string, gp2: string, gp3: string) => { 
              let mask = "";
              for (let i = 0; i < gp3.length; i++) mask += "*";
              return gp2 + mask;
            }
          )
        },
        accounts: []
      });
    }
    userMap.get(share.userId).accounts.push({
      id: share.accountId,
      alias: share.accountAlias,
      region: share.accountRegion,
      summonerId: share.accountSummonerId,
    });
  }

  return { success: true, users: Array.from(userMap.values()) };
}

export async function revokeAllSharesForUser(targetUserId: string) {
  const userId = await requireAuth();
  
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
