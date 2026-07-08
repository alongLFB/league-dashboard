import { NextRequest, NextResponse } from 'next/server';
import { decryptSession } from '@/lib/session';

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = path === '/' || path.startsWith('/api/');

  if (isProtectedRoute) {
    const cookie = req.cookies.get('admin_session')?.value;
    const session = await decryptSession(cookie);

    if (!session?.isAdmin) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
};
