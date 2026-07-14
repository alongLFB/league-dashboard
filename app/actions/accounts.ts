'use server';

import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
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

export async function getAccounts() {
  const userId = await requireAuth();
  
  const accounts = await prisma.account.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { sharedWith: { some: { userId } } }
      ]
    },
    include: {
      owner: { select: { nickname: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return accounts.map(acc => ({
    id: acc.id,
    region: acc.region,
    alias: acc.alias,
    summonerId: acc.summonerId,
    username: acc.username,
    password: decrypt(acc.password),
    isOwner: acc.ownerId === userId,
    ownerNickname: acc.owner.nickname
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
  
  await prisma.account.create({
    data: {
      region: data.region,
      alias: data.alias,
      summonerId: data.summonerId,
      username: data.username,
      password: encryptedPassword,
      ownerId: userId
    }
  });
  
  revalidatePath('/');
}

export async function deleteAccount(id: string) {
  const userId = await requireAuth();
  
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account || account.ownerId !== userId) {
    throw new Error('Unauthorized');
  }
  
  await prisma.account.delete({
    where: { id }
  });
  
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
  
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account || account.ownerId !== userId) {
    throw new Error('Unauthorized');
  }

  const encryptedPassword = encrypt(data.password);
  
  await prisma.account.update({
    where: { id },
    data: {
      region: data.region,
      alias: data.alias,
      summonerId: data.summonerId,
      username: data.username,
      password: encryptedPassword,
    }
  });
  
  revalidatePath('/');
}
