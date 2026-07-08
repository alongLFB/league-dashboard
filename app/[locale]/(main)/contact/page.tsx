import { getTranslations } from 'next-intl/server';
import { Mail } from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';

export default async function ContactPage() {
  const t = await getTranslations('Contact');
  
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-[#0d1117]/80 backdrop-blur-md border border-gray-800/80 rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-blue-900/10 to-transparent blur-3xl pointer-events-none" />
        
        <Mail className="text-blue-400 w-12 h-12 mb-6" />
        <h1 className="text-3xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
          {t('title')}
        </h1>
        
        <p className="text-gray-300 leading-relaxed font-medium max-w-lg mx-auto mb-10">
          {t('desc')}
        </p>
        
        <a 
          href="https://github.com/alongLFB/league-dashboard/issues" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-purple-900/20 focus:outline-none"
        >
          <GithubIcon size={18} />
          {t('issueBtn')}
        </a>
      </div>
    </main>
  );
}
