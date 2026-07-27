'use server';

import { db } from '@/lib/db/client';
import { users, verificationCodes } from '@/lib/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { decryptSession, encryptSession } from '@/lib/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;
  const session = await decryptSession(sessionCookie);
  if (!session?.userId) {
    redirect('/login');
  }
  return session;
}

export async function getUserProfile() {
  const session = await requireAuth();
  const [user] = await db
    .select({
      username: users.username,
      nickname: users.nickname,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId as string));
  
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
    await db
      .update(users)
      .set({ nickname: newNickname })
      .where(eq(users.id, userId));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return { success: false, error: 'User not found' };
    }

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
  const [validCode] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, newEmail),
        eq(verificationCodes.code, code),
        gt(verificationCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(verificationCodes.createdAt));

  if (!validCode) {
    return { success: false, error: 'Invalid or expired verification code' };
  }

  // Check if email already in use
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, newEmail));

  if (existingUser && existingUser.id !== userId) {
    return { success: false, error: 'Email already registered to another account' };
  }

  try {
    await db
      .update(users)
      .set({ email: newEmail })
      .where(eq(users.id, userId));
    
    // Invalidate the code
    await db
      .delete(verificationCodes)
      .where(eq(verificationCodes.id, validCode.id));

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

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Incorrect current password' };
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  try {
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to update password' };
  }
}
