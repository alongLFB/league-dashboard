import { getTranslations } from 'next-intl/server';
import { Shield } from 'lucide-react';

export default async function PrivacyPage() {
  const t = await getTranslations('Privacy');
  
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-[#0d1117]/80 backdrop-blur-md border border-gray-800/80 rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-green-900/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-8">
          <Shield className="text-green-500 w-8 h-8" />
          <h1 className="text-3xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
            {t('title')}
          </h1>
        </div>
        
        <div className="space-y-8 text-gray-300 leading-relaxed font-medium">
          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">{t('h1')}</h2>
            <p>{t('p1')}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">{t('h2')}</h2>
            <p>{t('p2')}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
