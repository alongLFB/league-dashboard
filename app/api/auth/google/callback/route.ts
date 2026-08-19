import { NextRequest, NextResponse } from 'next/server';
import { decryptOAuthState, encryptSession, decryptSession } from '@/lib/session';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { ensureUserGoogleColumns } from '@/lib/db/ensureColumns';
import bcrypt from 'bcryptjs';

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    req.nextUrl.origin;

  const statePayload = await decryptOAuthState(state || '');
  const mode = (statePayload?.mode as string) || 'login';
  const locale = (statePayload?.locale as string) || 'zh';
  const targetUserId = statePayload?.userId as string | undefined;

  // If user cancelled or OAuth returned an error
  if (error || !code || !statePayload) {
    if (mode === 'bind') {
      return NextResponse.redirect(
        new URL(`/${locale}/profile?error=google_auth_failed`, baseUrl)
      );
    }
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=google_auth_failed`, baseUrl)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    const redirectPath = mode === 'bind' ? `/${locale}/profile` : `/${locale}/login`;
    return NextResponse.redirect(
      new URL(`${redirectPath}?error=server_configuration_error`, baseUrl)
    );
  }

  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Google token exchange error:', errText);
      const redirectPath = mode === 'bind' ? `/${locale}/profile` : `/${locale}/login`;
      return NextResponse.redirect(
        new URL(`${redirectPath}?error=google_token_failed`, baseUrl)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoRes.ok) {
      const errText = await userInfoRes.text();
      console.error('Google userinfo fetch error:', errText);
      const redirectPath = mode === 'bind' ? `/${locale}/profile` : `/${locale}/login`;
      return NextResponse.redirect(
        new URL(`${redirectPath}?error=google_userinfo_failed`, baseUrl)
      );
    }

    const googleUser = (await userInfoRes.json()) as GoogleUserInfo;
    const { sub: googleId, email: googleEmail, name } = googleUser;

    if (!googleId || !googleEmail) {
      const redirectPath = mode === 'bind' ? `/${locale}/profile` : `/${locale}/login`;
      return NextResponse.redirect(
        new URL(`${redirectPath}?error=google_invalid_data`, baseUrl)
      );
    }

    // Ensure database columns exist
    await ensureUserGoogleColumns();

    // ─── Mode: BIND (Link Google account in Profile) ─────────────────────────
    if (mode === 'bind') {
      const sessionCookie = req.cookies.get('admin_session')?.value;
      const session = await decryptSession(sessionCookie);
      const currentUserId = (session?.userId as string) || targetUserId;

      if (!currentUserId) {
        return NextResponse.redirect(new URL(`/${locale}/login`, baseUrl));
      }

      // Check if this Google account is already linked to another user
      const [existingBoundUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.googleId, googleId), ne(users.id, currentUserId)));

      if (existingBoundUser) {
        return NextResponse.redirect(
          new URL(`/${locale}/profile?error=google_already_bound`, baseUrl)
        );
      }

      // Update current user with googleId and googleEmail
      await db
        .update(users)
        .set({
          googleId,
          googleEmail,
        })
        .where(eq(users.id, currentUserId));

      return NextResponse.redirect(
        new URL(`/${locale}/profile?success=google_bound`, baseUrl)
      );
    }

    // ─── Mode: LOGIN (Google Sign In / Register) ─────────────────────────────
    // 1. Search by Google ID
    const [userByGoogle] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));

    if (userByGoogle) {
      const sessionToken = await encryptSession({
        userId: userByGoogle.id,
        username: userByGoogle.username,
        nickname: userByGoogle.nickname,
      });

      const res = NextResponse.redirect(new URL(`/${locale}`, baseUrl));
      res.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

    // 2. Search by matching email
    const [userByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleEmail));

    if (userByEmail) {
      // Auto-bind Google ID to the existing email account
      await db
        .update(users)
        .set({
          googleId,
          googleEmail,
        })
        .where(eq(users.id, userByEmail.id));

      const sessionToken = await encryptSession({
        userId: userByEmail.id,
        username: userByEmail.username,
        nickname: userByEmail.nickname,
      });

      const res = NextResponse.redirect(new URL(`/${locale}`, baseUrl));
      res.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

    // 3. Register new user
    let baseUsername = googleEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    if (!baseUsername) baseUsername = 'user';
    let username = baseUsername;
    let counter = 1;

    // Ensure username uniqueness
    while (true) {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username));
      if (!existingUser) break;
      username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      counter++;
      if (counter > 10) {
        username = `${baseUsername}_${Date.now().toString().slice(-6)}`;
        break;
      }
    }

    const randomPassword = crypto.randomUUID() + crypto.randomUUID();
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    const nickname = name || baseUsername;
    const newUserId = crypto.randomUUID();

    await db.insert(users).values({
      id: newUserId,
      username,
      passwordHash,
      nickname,
      email: googleEmail,
      googleId,
      googleEmail,
    });

    const sessionToken = await encryptSession({
      userId: newUserId,
      username,
      nickname,
    });

    const res = NextResponse.redirect(new URL(`/${locale}`, baseUrl));
    res.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    console.error('Google OAuth callback handler error:', err);
    const redirectPath = mode === 'bind' ? `/${locale}/profile` : `/${locale}/login`;
    return NextResponse.redirect(
      new URL(`${redirectPath}?error=internal_auth_error`, baseUrl)
    );
  }
}
