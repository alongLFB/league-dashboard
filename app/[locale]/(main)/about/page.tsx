import { getTranslations } from 'next-intl/server';
import { GithubIcon } from '@/components/GithubIcon';

export default async function AboutPage() {
  const t = await getTranslations('About');
  
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-[#0d1117]/80 backdrop-blur-md border border-gray-800/80 rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-900/20 to-transparent blur-3xl pointer-events-none" />
        
        <h1 className="text-3xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8">
          {t('title')}
        </h1>
        
        <div className="space-y-6 text-gray-300 leading-relaxed font-medium">
          <p>{t('p1')}</p>
          <p>{t('p2')}</p>
          <div className="pt-8 border-t border-gray-800/60 mt-8">
            <h2 className="text-xl font-bold tracking-widest text-gray-200 uppercase mb-4">{t('openSource')}</h2>
            <p className="mb-6">{t('p3')}</p>
            <a 
              href="https://github.com/alongLFB/league-dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none"
            >
              <GithubIcon size={16} />
              {t('githubBtn')}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
