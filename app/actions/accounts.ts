'use server';

import { db } from '@/lib/db/client';
import { accounts, users, sharedAccounts } from '@/lib/db/schema';
import { eq, or, inArray, desc } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';
import { decryptSession } from '@/lib/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;
  const session = await decryptSession(sessionCookie);
  if (!session?.userId) {
    redirect('/login');
  }
  return session.userId as string;
}

export async function getAccounts() {
  const userId = await requireAuth();
  
  const shared = await db
    .select({ accountId: sharedAccounts.accountId })
    .from(sharedAccounts)
    .where(eq(sharedAccounts.userId, userId));
  
  const sharedIds = shared.map(s => s.accountId);

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
      createdAt: accounts.createdAt,
      ownerNickname: users.nickname,
    })
    .from(accounts)
    .leftJoin(users, eq(accounts.ownerId, users.id))
    .where(whereClause)
    .orderBy(desc(accounts.createdAt));

  return resultList.map(acc => ({
    id: acc.id,
    region: acc.region,
    alias: acc.alias,
    summonerId: acc.summonerId,
    username: acc.username,
    password: decrypt(acc.password),
    isOwner: acc.ownerId === userId,
    ownerNickname: acc.ownerNickname ?? 'Unknown'
  }));
}

export async function addAccount(data: {
  region: string;
  alias: string;
  summonerId: string;
  username: string;
  password: string;
}) {
  const userId = await requireAuth();
  
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
  const userId = await requireAuth();
  
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
  const userId = await requireAuth();
  
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
