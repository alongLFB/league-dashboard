'use server';

import { cookies } from 'next/headers';
import { encryptSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { users, verificationCodes } from '@/lib/db/schema';
import { eq, or, and, gt, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export async function login(username: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, username)));

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Invalid password' };
  }

  const session = await encryptSession({ userId: user.id, username: user.username, nickname: user.nickname });
  
  const cookieStore = await cookies();
  cookieStore.set('admin_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/login');
}

export async function sendVerificationCode(email: string) {
  // Check if user exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    return { success: false, error: 'Email already registered' };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(verificationCodes).values({
    email,
    code,
    expiresAt,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });

  try {
    await transporter.sendMail({
      from: `"League Dashboard" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}. It is valid for 10 minutes.`,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'Failed to send verification code email' };
  }
}

export async function register(data: any) {
  const { username, password, nickname, email, code } = data;

  // Verify code
  const [validCode] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code),
        gt(verificationCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(verificationCodes.createdAt));

  if (!validCode) {
    return { success: false, error: 'Invalid or expired verification code' };
  }

  // Check username
  const [existingUsername] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));

  if (existingUsername) {
    return { success: false, error: 'Username already taken' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    username,
    passwordHash,
    nickname,
    email,
  });

  // Login after register
  const session = await encryptSession({ userId, username, nickname });
  const cookieStore = await cookies();
  cookieStore.set('admin_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true };
}

export async function sendPasswordResetCode(email: string) {
  // Check if user exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (!existing) {
    return { success: false, error: 'User not found with this email' };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(verificationCodes).values({
    email,
    code,
    expiresAt,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });

  try {
    await transporter.sendMail({
      from: `"League Dashboard" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Verification Code',
      text: `Your password reset verification code is: ${code}. It is valid for 10 minutes.`,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'Failed to send verification code email' };
  }
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
  // Verify code
  const [validCode] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code),
        gt(verificationCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(verificationCodes.createdAt));

  if (!validCode) {
    return { success: false, error: 'Invalid or expired verification code' };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  try {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    // Invalidate the code
    await db
      .delete(verificationCodes)
      .where(eq(verificationCodes.id, validCode.id));

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to reset password' };
  }
}
