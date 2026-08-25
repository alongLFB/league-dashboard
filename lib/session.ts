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

