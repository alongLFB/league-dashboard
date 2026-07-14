'use client';

import { useState } from 'react';
import { login } from '@/app/actions/auth';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('Login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setLoading(true);
      const res = await login(username, password);
      if (res.success) {
        router.replace('/');
        router.refresh();
      } else {
        setLoading(false);
        toast.error(res.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white overflow-hidden relative selection:bg-purple-500/30 flex items-center justify-center font-sans">
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-b from-blue-900/20 to-purple-900/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm px-8 relative z-10">
        <h1 className="text-center text-xs font-black tracking-[0.4em] mb-12 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {t('title')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out ${username ? 'w-full' : 'w-0 group-focus-within:w-full'}`} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="USERNAME"
              className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.4em] uppercase text-sm transition-all duration-500 placeholder:text-gray-800 disabled:opacity-50 focus:border-transparent"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <div className="relative group">
            <div className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out ${password ? 'w-full' : 'w-0 group-focus-within:w-full'}`} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="PASSWORD"
              className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.4em] uppercase text-sm transition-all duration-500 placeholder:text-gray-800 disabled:opacity-50 focus:border-transparent"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !username || !password}
            className="w-full flex justify-center py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs tracking-[0.2em] uppercase font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Login'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/register')}
            className="text-xs text-gray-500 hover:text-gray-300 tracking-[0.1em] uppercase transition-colors"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
}
