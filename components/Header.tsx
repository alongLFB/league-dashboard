import { logout } from '@/app/actions/auth';
import { LogOut, User } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Link } from '@/i18n/routing';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/session';

export async function Header() {
  const t = await getTranslations('Dashboard');
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;
  const session = await decryptSession(sessionCookie);

  return (
    <header className="border-b border-gray-800/60 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-sm font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:opacity-80 transition-opacity focus:outline-none">
          TASTE <span className="text-gray-600 font-light mx-2">/</span> LEAGUE
        </Link>
        <div className="flex items-center gap-6">
          {(session?.nickname as string) && (
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold tracking-wider">
              <User size={14} className="text-blue-400" />
              {session?.nickname as string}
            </div>
          )}
          <LanguageSwitcher />
          <form action={logout}>
            <button className="text-gray-500 hover:text-purple-400 transition-colors focus:outline-none" title={t('logout')}>
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
