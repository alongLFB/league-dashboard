'use client';

import { useState, useEffect } from 'react';
import { register, sendVerificationCode } from '@/app/actions/auth';
import { useRouter, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    email: '',
    password: '',
    code: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const t = useTranslations('Register');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!formData.email) {
      toast.error('Please enter your email first');
      return;
    }
    
    setSendingCode(true);
    const res = await sendVerificationCode(formData.email);
    setSendingCode(false);
    
    if (res.success) {
      toast.success('Verification code sent to your email');
      setCountdown(60);
    } else {
      toast.error(res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await register(formData);
    if (res.success) {
      toast.success('Registration successful!');
      router.replace('/');
      router.refresh();
    } else {
      setLoading(false);
      toast.error(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white overflow-hidden relative selection:bg-purple-500/30 flex items-center justify-center font-sans">
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-b from-blue-900/20 to-green-900/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm px-8 relative z-10">
        <h1 className="text-center text-xs font-black tracking-[0.4em] mb-12 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
          {t('title')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={loading}
              placeholder={t('email')}
              className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-xs transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-green-500"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="relative group flex-1">
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                disabled={loading}
                placeholder={t('code')}
                className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-xs transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-green-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendingCode || countdown > 0 || !formData.email}
              className="px-4 py-2 border border-gray-800 rounded-lg text-xs uppercase tracking-widest text-gray-400 hover:text-green-400 hover:border-green-900 transition-colors disabled:opacity-50"
            >
              {sendingCode ? <Loader2 size={14} className="animate-spin mx-auto" /> : (countdown > 0 ? `${countdown}s` : t('sendCode'))}
            </button>
          </div>

          <div className="relative group">
            <input
              type="text"
              required
              value={formData.nickname}
              onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              disabled={loading}
              placeholder={t('nickname')}
              className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-xs transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-green-500"
            />
          </div>

          <div className="relative group">
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              disabled={loading}
              placeholder={t('username')}
              className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-xs transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-green-500"
            />
          </div>

          <div className="relative group">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              disabled={loading}
              placeholder={t('password')}
              className="w-full bg-transparent border-b border-gray-800 outline-none pb-3 text-gray-200 text-center tracking-[0.1em] text-xs transition-all duration-500 placeholder:text-gray-500 disabled:opacity-50 focus:border-green-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-0 text-gray-500 hover:text-green-400 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !formData.username || !formData.password || !formData.code}
            className="w-full flex justify-center py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs tracking-[0.2em] uppercase font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : t('registerBtn')}
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link 
            href="/login"
            className="text-xs text-gray-500 hover:text-gray-300 tracking-[0.1em] uppercase transition-colors inline-block"
          >
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
