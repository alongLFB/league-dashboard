'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { decryptSession, encryptSession } from '@/lib/session';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;
  const session = await decryptSession(sessionCookie);
  if (!session?.userId) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getUserProfile() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: {
      username: true,
      nickname: true,
      email: true,
      createdAt: true
    }
  });
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  return { success: true, user };
}

export async function updateNickname(newNickname: string) {
  const session = await requireAuth();
  const userId = session.userId as string;

  if (!newNickname || newNickname.trim().length === 0) {
    return { success: false, error: 'Nickname cannot be empty' };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { nickname: newNickname }
    });

    // Update session with new nickname
    const newSession = await encryptSession({ 
      userId: user.id, 
      username: user.username, 
      nickname: user.nickname 
    });
    
    const cookieStore = await cookies();
    cookieStore.set('admin_session', newSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath('/');
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to update nickname' };
  }
}

export async function updateEmail(newEmail: string, code: string) {
  const session = await requireAuth();
  const userId = session.userId as string;

  // Verify code
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      email: newEmail,
      code,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!validCode) {
    return { success: false, error: 'Invalid or expired verification code' };
  }

  // Check if email already in use
  const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existingUser && existingUser.id !== userId) {
    return { success: false, error: 'Email already registered to another account' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail }
    });
    
    // Invalidate the code
    await prisma.verificationCode.delete({ where: { id: validCode.id } });

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to update email' };
  }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const session = await requireAuth();
  const userId = session.userId as string;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Incorrect current password' };
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to update password' };
  }
}
