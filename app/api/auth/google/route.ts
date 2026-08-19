import { NextRequest, NextResponse } from 'next/server';
import { encryptOAuthState, decryptSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('mode') === 'bind' ? 'bind' : 'login';
  const locale = searchParams.get('locale') || 'zh';

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID is not configured in .env' },
      { status: 500 }
    );
  }

  let userId: string | undefined = undefined;

  if (mode === 'bind') {
    const sessionCookie = req.cookies.get('admin_session')?.value;
    const session = await decryptSession(sessionCookie);
    if (!session?.userId) {
      const redirectUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
      return NextResponse.redirect(redirectUrl);
    }
    userId = session.userId as string;
  }

  const state = await encryptOAuthState({
    mode,
    locale,
    userId,
    csrf: crypto.randomUUID(),
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    req.nextUrl.origin;

  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/google/callback`;

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}
