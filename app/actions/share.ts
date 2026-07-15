'use server';

import { prisma } from '@/lib/prisma';
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
  
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: query },
        { email: query }
      ],
      NOT: {
        id: userId // Cannot share with yourself
      }
    },
    select: {
      id: true,
      nickname: true,
      username: true,
      email: true
    }
  });
  
  if (!user) return null;
  
  return {
    id: user.id,
    nickname: user.nickname,
    // Mask email for privacy (e.g. a***@gmail.com)
    displayInfo: user.email.replace(/(.{2})(.*)(?=@)/,
      (gp1, gp2, gp3) => { 
        let mask = "";
        for(let i=0; i<gp3.length; i++) mask += "*";
        return gp2 + mask;
      }
    )
  };
}

export async function shareAccount(accountId: string, targetUserId: string) {
  const userId = await requireAuth();
  
  // Verify ownership
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.ownerId !== userId) {
    return { success: false, error: 'Unauthorized or account not found' };
  }
  
  try {
    await prisma.sharedAccount.create({
      data: {
        accountId,
        userId: targetUserId
      }
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    // Unique constraint violation (already shared)
    if (error.code === 'P2002') {
      return { success: false, error: 'Already shared with this user' };
    }
    console.error(error);
    return { success: false, error: 'Failed to share account' };
  }
}

export async function getAccountShares(accountId: string) {
  const userId = await requireAuth();
  
  // Verify ownership
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.ownerId !== userId) {
    return { success: false, error: 'Unauthorized or account not found' };
  }
  
  const shares = await prisma.sharedAccount.findMany({
    where: { accountId },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          email: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const formattedShares = shares.map(share => ({
    id: share.id,
    userId: share.user.id,
    nickname: share.user.nickname,
    displayInfo: share.user.email.replace(/(.{2})(.*)(?=@)/,
      (gp1, gp2, gp3) => { 
        let mask = "";
        for(let i=0; i<gp3.length; i++) mask += "*";
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
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.ownerId !== userId) {
    return { success: false, error: 'Unauthorized or account not found' };
  }
  
  try {
    await prisma.sharedAccount.delete({
      where: {
        accountId_userId: {
          accountId,
          userId: targetUserId
        }
      }
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to revoke share' };
  }
}

export async function batchShareAccounts(accountIds: string[], targetUserId: string) {
  const userId = await requireAuth();
  
  // Verify ownership for all accounts
  const accounts = await prisma.account.findMany({ 
    where: { 
      id: { in: accountIds },
      ownerId: userId
    } 
  });
  
  if (accounts.length !== accountIds.length) {
    return { success: false, error: 'Some accounts not found or unauthorized' };
  }
  
  try {
    await prisma.sharedAccount.createMany({
      data: accountIds.map(accountId => ({
        accountId,
        userId: targetUserId
      })),
      skipDuplicates: true
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to batch share accounts' };
  }
}

export async function getBatchAccountShares(accountIds: string[]) {
  const userId = await requireAuth();
  
  // Verify ownership for all accounts
  const accounts = await prisma.account.findMany({ 
    where: { 
      id: { in: accountIds },
      ownerId: userId
    } 
  });
  
  if (accounts.length === 0) {
    return { success: false, error: 'No authorized accounts found' };
  }

  const authorizedAccountIds = accounts.map(a => a.id);
  
  const shares = await prisma.sharedAccount.findMany({
    where: { accountId: { in: authorizedAccountIds } },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          email: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Deduplicate users
  const userMap = new Map();
  for (const share of shares) {
    if (!userMap.has(share.userId)) {
      userMap.set(share.userId, share.user);
    }
  }
  
  const formattedShares = Array.from(userMap.values()).map(user => ({
    userId: user.id,
    nickname: user.nickname,
    displayInfo: user.email.replace(/(.{2})(.*)(?=@)/,
      (gp1: string, gp2: string, gp3: string) => { 
        let mask = "";
        for(let i=0; i<gp3.length; i++) mask += "*";
        return gp2 + mask;
      }
    )
  }));
  
  return { success: true, shares: formattedShares };
}

export async function batchRevokeShareForUser(accountIds: string[], targetUserId: string) {
  const userId = await requireAuth();
  
  // Verify ownership
  const accounts = await prisma.account.findMany({ 
    where: { 
      id: { in: accountIds },
      ownerId: userId
    } 
  });
  
  if (accounts.length === 0) {
    return { success: false, error: 'No authorized accounts found' };
  }
  
  const authorizedAccountIds = accounts.map(a => a.id);
  
  try {
    await prisma.sharedAccount.deleteMany({
      where: {
        accountId: { in: authorizedAccountIds },
        userId: targetUserId
      }
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to batch revoke shares for user' };
  }
}

export async function getUsersWithSharedAccounts() {
  const userId = await requireAuth();

  const shares = await prisma.sharedAccount.findMany({
    where: {
      account: {
        ownerId: userId
      }
    },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          email: true,
        }
      },
      account: {
        select: {
          id: true,
          alias: true,
          region: true,
          summonerId: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const userMap = new Map();
  for (const share of shares) {
    if (!userMap.has(share.userId)) {
      userMap.set(share.userId, {
        user: {
          id: share.user.id,
          nickname: share.user.nickname,
          displayInfo: share.user.email.replace(/(.{2})(.*)(?=@)/,
            (gp1, gp2, gp3) => { 
              let mask = "";
              for(let i=0; i<gp3.length; i++) mask += "*";
              return gp2 + mask;
            }
          )
        },
        accounts: []
      });
    }
    userMap.get(share.userId).accounts.push(share.account);
  }

  return { success: true, users: Array.from(userMap.values()) };
}

export async function revokeAllSharesForUser(targetUserId: string) {
  const userId = await requireAuth();
  
  const accounts = await prisma.account.findMany({ where: { ownerId: userId } });
  const authorizedAccountIds = accounts.map(a => a.id);

  try {
    await prisma.sharedAccount.deleteMany({
      where: {
        userId: targetUserId,
        accountId: { in: authorizedAccountIds }
      }
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to revoke shares for user' };
  }
}

