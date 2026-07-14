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
