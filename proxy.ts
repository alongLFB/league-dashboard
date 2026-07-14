import { NextRequest, NextResponse } from 'next/server';
import { decryptSession } from '@/lib/session';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default async function proxy(req: NextRequest) {
  // 1. Auth Logic
  const path = req.nextUrl.pathname;
  const isAuthRoute = path === '/login' || path === '/register' || path.startsWith('/en/login') || path.startsWith('/zh/login') || path.startsWith('/en/register') || path.startsWith('/zh/register');
  // Protect all routes except auth and api
  const isProtectedRoute = !isAuthRoute && !path.startsWith('/api/');

  if (isProtectedRoute) {
    const cookie = req.cookies.get('admin_session')?.value;
    const session = await decryptSession(cookie);

    if (!session?.isAdmin) {
      const match = path.match(/^\/(en|zh)/);
      const localePrefix = match ? match[0] : '';
      return NextResponse.redirect(new URL(`${localePrefix}/login`, req.nextUrl));
    }
  }

  // 2. Internationalization Logic
  const country = req.headers.get('x-vercel-ip-country');
  let defaultLocale = 'en';
  if (country && ['CN', 'TW', 'HK', 'MO'].includes(country)) {
    defaultLocale = 'zh';
  }

  const handleI18nRouting = createMiddleware({
    ...routing,
    defaultLocale: defaultLocale as 'zh' | 'en'
  });
  
  return handleI18nRouting(req);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
