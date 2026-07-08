'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === 'en' ? 'zh' : 'en';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button 
      onClick={toggleLocale}
      className="flex items-center gap-1.5 text-gray-500 hover:text-purple-400 transition-colors focus:outline-none"
      title="Switch Language"
    >
      <Globe size={16} />
      <span className="text-xs font-bold uppercase tracking-widest">{locale === 'en' ? 'EN' : '中文'}</span>
    </button>
  );
}
