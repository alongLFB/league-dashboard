import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'fallback-secret-for-development-only';
const encodedKey = new TextEncoder().encode(secretKey);

export async function encryptSession(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decryptSession(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function encryptOAuthState(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(encodedKey);
}

export async function decryptOAuthState(token: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<Record<string, unknown>> {
  const { cookies } = await import('next/headers');
  const { redirect } = await import('next/navigation');
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;
  const session = await decryptSession(sessionCookie);
  if (!session?.userId) {
    redirect('/login');
  }
  return session as Record<string, unknown>;
}

export async function requireAuthUserId(): Promise<string> {
  const session = await requireAuth();
  return session.userId as string;
}

import type { NextRequest } from 'next/server';

/**
 * Dynamically and safely resolve base URL for OAuth callbacks and redirects:
 * 1. Localhost / 127.0.0.1 -> Always preserve local origin (for seamless local development).
 * 2. Valid public domain from headers -> Use public domain (e.g. from Nginx reverse proxy).
 * 3. Docker / container internal hosts (0.0.0.0, container IPs) -> Fallback to NEXT_PUBLIC_APP_URL / APP_URL.
 */
export function getOAuthBaseUrl(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const proto = req.headers.get('x-forwarded-proto') || (req.nextUrl.protocol ? req.nextUrl.protocol.replace(':', '') : 'http');

  // 1. Local development: If accessed via localhost or 127.0.0.1, always prioritize local host
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  // 2. Production with valid public domain (not 0.0.0.0, and not internal private IP)
  if (host && !host.includes('0.0.0.0') && !host.startsWith('10.') && !host.startsWith('172.') && !host.startsWith('192.168.') && host.includes('.')) {
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  // 3. Fallback to configured production URL (e.g. NEXT_PUBLIC_APP_URL)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // 4. Ultimate fallback from req.nextUrl.origin, ensuring 0.0.0.0 is cleaned
  let origin = req.nextUrl.origin || 'http://localhost:3021';
  if (origin.includes('0.0.0.0')) {
    origin = origin.replace('0.0.0.0', '127.0.0.1');
  }
  return origin.replace(/\/$/, '');
}


