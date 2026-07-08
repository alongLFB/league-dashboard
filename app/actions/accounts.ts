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
  if (!session?.isAdmin) {
    throw new Error('Unauthorized');
  }
}

export async function getAccounts() {
  await requireAuth();
  
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  return accounts.map(acc => ({
    id: acc.id,
    region: acc.region,
    alias: acc.alias,
    summonerId: acc.summonerId,
    username: acc.username,
    password: decrypt(acc.password),
  }));
}

export async function addAccount(data: {
  region: string;
  alias: string;
  summonerId: string;
  username: string;
  password: string;
}) {
  await requireAuth();
  
  const encryptedPassword = encrypt(data.password);
  
  await prisma.account.create({
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

export async function deleteAccount(id: string) {
  await requireAuth();
  
  await prisma.account.delete({
    where: { id }
  });
  
  revalidatePath('/');
}
