'use client';

import { useState } from 'react';
import { login, sendPasswordResetCode, resetPasswordWithCode } from '@/app/actions/auth';
import { useRouter, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'forgot-password'>('login');

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const router = useRouter();
  const t = useTranslations('Login');

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handleSendResetCode = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }
    setSendingCode(true);
    const res = await sendPasswordResetCode(resetEmail);
    setSendingCode(false);
    
    if (res.success) {
      toast.success('Code sent to your email');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      toast.error(res.error || 'Failed to send code');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetEmail && resetCode && newPassword) {
      setLoading(true);
      const res = await resetPasswordWithCode(resetEmail, resetCode, newPassword);
      setLoading(false);
      
      if (res.success) {
        toast.success('Password reset successful');
        setUsername(resetEmail);
        setPassword('');
        setView('login');
      } else {
        toast.error(res.error || 'Failed to reset password');
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
        {view === 'login' ? (
          <>
            <h1 className="text-center text-xs font-black tracking-[0.4em] mb-12 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {t('title')}
            </h1>
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="relative group">
                <div className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out ${username ? 'w-full' : 'w-0 group-focus-within:w-full'}`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  placeholder={t('usernamePlaceholder')}
                  className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-sm transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-transparent"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div className="relative group">
                <div className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out ${password ? 'w-full' : 'w-0 group-focus-within:w-full'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-sm transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-transparent"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-0 text-gray-500 hover:text-purple-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setView('forgot-password')}
                  className="text-xs text-gray-500 hover:text-purple-400 transition-colors tracking-widest uppercase font-bold"
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <button 
                type="submit" 
                disabled={loading || !username || !password}
                className="w-full flex justify-center py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs tracking-[0.2em] uppercase font-bold disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : t('loginBtn')}
              </button>
            </form>
            <div className="mt-8 text-center flex flex-col items-center gap-3">
              <span className="text-xs text-gray-500 tracking-[0.1em]">{t('noAccount')}</span>
              <Link 
                href="/register"
                className="text-xs text-purple-400 hover:text-purple-300 font-bold tracking-[0.1em] uppercase transition-colors inline-block border border-purple-500/30 px-6 py-2 rounded-full hover:bg-purple-500/10"
              >
                {t('createAccount')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-center text-xs font-black tracking-[0.4em] mb-12 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {t('resetPasswordTitle')}
            </h1>
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div className="relative group flex gap-4">
                <div className="flex-1 relative">
                  <div className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out ${resetEmail ? 'w-full' : 'w-0 group-focus-within:w-full'}`} />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={loading}
                    placeholder={t('emailPlaceholder')}
                    className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-sm transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-transparent"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={sendingCode || countdown > 0 || !resetEmail}
                  className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 min-w-[90px] flex items-center justify-center border border-purple-500/20"
                >
                  {sendingCode ? <Loader2 size={14} className="animate-spin" /> : countdown > 0 ? `${countdown}s` : t('sendCode')}
                </button>
              </div>
              <div className="relative group">
                <div className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out ${resetCode ? 'w-full' : 'w-0 group-focus-within:w-full'}`} />
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  disabled={loading}
                  placeholder={t('codePlaceholder')}
                  className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-sm transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-transparent"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div className="relative group">
                <div className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out ${newPassword ? 'w-full' : 'w-0 group-focus-within:w-full'}`} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-sm transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-transparent"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-0 text-gray-500 hover:text-purple-400 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button 
                type="submit" 
                disabled={loading || !resetEmail || !resetCode || !newPassword}
                className="w-full flex justify-center py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs tracking-[0.2em] uppercase font-bold disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : t('resetBtn')}
              </button>
            </form>
            <div className="mt-8 text-center flex justify-center">
              <button 
                onClick={() => setView('login')}
                className="text-xs text-gray-500 hover:text-gray-300 font-bold tracking-[0.1em] uppercase transition-colors"
              >
                {t('backToLogin')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
