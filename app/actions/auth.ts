'use server';

import { cookies } from 'next/headers';
import { encryptSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function login(password: string) {
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'admin';
  
  if (password === adminSecret) {
    const session = await encryptSession({ isAdmin: true });
    
    const cookieStore = await cookies();
    cookieStore.set('admin_session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return { success: true };
  } else {
    return { success: false, error: 'Invalid password' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/login');
}
