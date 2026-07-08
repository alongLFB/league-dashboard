import { Link } from '@/i18n/routing';
import { GithubIcon } from '@/components/GithubIcon';
import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('Footer');
  
  return (
    <footer className="mt-auto border-t border-gray-800/60 bg-[#0a0a0c] relative z-10">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 text-sm text-gray-500 font-medium tracking-wide">
          <Link href="/about" className="hover:text-purple-400 transition-colors focus:outline-none">{t('about')}</Link>
          <Link href="/privacy" className="hover:text-purple-400 transition-colors focus:outline-none">{t('privacy')}</Link>
          <Link href="/terms" className="hover:text-purple-400 transition-colors focus:outline-none">{t('terms')}</Link>
          <Link href="/contact" className="hover:text-purple-400 transition-colors focus:outline-none">{t('contact')}</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-700 font-mono">
            &copy; {new Date().getFullYear()} Taste League
          </span>
          <a 
            href="https://github.com/alongLFB/league-dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-white transition-colors focus:outline-none"
            title="GitHub Repository"
          >
            <GithubIcon size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
