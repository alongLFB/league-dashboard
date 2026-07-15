'use server';

import { cookies } from 'next/headers';
import { encryptSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export async function login(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username },
        { email: username }
      ]
    }
  });
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
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: 'Email already registered' };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.verificationCode.create({
    data: { email, code, expiresAt },
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
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!validCode) {
    return { success: false, error: 'Invalid or expired verification code' };
  }

  // Check username
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return { success: false, error: 'Username already taken' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      nickname,
      email,
    },
  });

  // Login after register
  const session = await encryptSession({ userId: user.id, username: user.username, nickname: user.nickname });
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
