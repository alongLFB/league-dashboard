'use client';

import { useState } from 'react';
import { updateNickname, updateEmail, updatePassword } from '@/app/actions/user';
import { sendVerificationCode, sendPasswordResetCode, resetPasswordWithCode } from '@/app/actions/auth';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';

interface ProfileClientProps {
  user: {
    username: string;
    nickname: string;
    email: string;
  };
}

export function ProfileClient({ user }: ProfileClientProps) {
  const t = useTranslations('Profile');
  
  // Nickname State
  const [nickname, setNickname] = useState(user.nickname);
  const [savingNickname, setSavingNickname] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Password Reset via Email State
  const [passwordMode, setPasswordMode] = useState<'current' | 'email'>('current');
  const [resetCode, setResetCode] = useState('');
  const [sendingResetCode, setSendingResetCode] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(0);

  // Email State
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname === user.nickname || !nickname.trim()) return;
    
    setSavingNickname(true);
    const res = await updateNickname(nickname);
    setSavingNickname(false);
    
    if (res.success) {
      toast.success(t('updateSuccess'));
    } else {
      toast.error(res.error || t('updateFailed'));
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    
    setSavingPassword(true);
    const res = await updatePassword(currentPassword, newPassword);
    setSavingPassword(false);
    
    if (res.success) {
      toast.success(t('updateSuccess'));
      setCurrentPassword('');
      setNewPassword('');
    } else {
      toast.error(res.error || t('updateFailed'));
    }
  };

  const handleSendResetCode = async () => {
    setSendingResetCode(true);
    const res = await sendPasswordResetCode(user.email);
    setSendingResetCode(false);
    
    if (res.success) {
      toast.success(t('codeSent'));
      setResetCountdown(60);
      const timer = setInterval(() => {
        setResetCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      toast.error(res.error || t('sendCodeFailed'));
    }
  };

  const handleResetPasswordWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) return;
    
    setSavingPassword(true);
    const res = await resetPasswordWithCode(user.email, resetCode, newPassword);
    setSavingPassword(false);
    
    if (res.success) {
      toast.success(t('updateSuccess'));
      setResetCode('');
      setNewPassword('');
      setPasswordMode('current');
    } else {
      toast.error(res.error || t('updateFailed'));
    }
  };

  const handleSendCode = async () => {
    if (!newEmail) {
      toast.error(t('enterNewEmail'));
      return;
    }
    
    setSendingCode(true);
    const res = await sendVerificationCode(newEmail);
    setSendingCode(false);
    
    if (res.success) {
      toast.success(t('codeSent'));
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
      toast.error(res.error || t('sendCodeFailed'));
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !code) return;
    
    setSavingEmail(true);
    const res = await updateEmail(newEmail, code);
    setSavingEmail(false);
    
    if (res.success) {
      toast.success(t('updateSuccess'));
      setNewEmail('');
      setCode('');
    } else {
      toast.error(res.error || t('updateFailed'));
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="bg-[#0d1117]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-purple-500/50" />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <UserIcon size={18} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-200">{t('profileInfo')}</h3>
        </div>
        
        <form onSubmit={handleUpdateNickname} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">{t('username')} (Immutable)</label>
            <input 
              type="text" 
              value={user.username} 
              disabled 
              className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">{t('nickname')}</label>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required
                className="flex-1 bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                type="submit"
                disabled={savingNickname || nickname === user.nickname || !nickname.trim()}
                className="px-6 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center"
              >
                {savingNickname ? <Loader2 size={14} className="animate-spin" /> : t('updateNickname')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Email Section */}
      <div className="bg-[#0d1117]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/50 to-emerald-500/50" />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Mail size={18} className="text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-200">{t('emailBinding')}</h3>
        </div>
        
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">{t('currentEmail')}</label>
            <input 
              type="email" 
              value={user.email} 
              disabled 
              className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">{t('newEmail')}</label>
            <div className="flex gap-4">
              <input 
                type="email" 
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                className="flex-1 bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 outline-none focus:border-green-500 transition-colors"
              />
              <button 
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0 || !newEmail || newEmail === user.email}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center"
              >
                {sendingCode ? <Loader2 size={14} className="animate-spin" /> : countdown > 0 ? `${countdown}s` : t('sendCode')}
              </button>
            </div>
          </div>
          {newEmail && (
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">{t('verificationCode')}</label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="123456"
                  className="flex-1 bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 outline-none focus:border-green-500 transition-colors tracking-widest"
                />
                <button 
                  type="submit"
                  disabled={savingEmail || !code || !newEmail}
                  className="px-6 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center"
                >
                  {savingEmail ? <Loader2 size={14} className="animate-spin" /> : t('updateEmail')}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-[#0d1117]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 to-orange-500/50" />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Lock size={18} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-200">{t('security')}</h3>
          </div>
          <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-800">
            <button
              onClick={() => setPasswordMode('current')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${passwordMode === 'current' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t('updateWithCurrent')}
            </button>
            <button
              onClick={() => setPasswordMode('email')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${passwordMode === 'email' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t('resetViaEmail')}
            </button>
          </div>
        </div>
        
        {passwordMode === 'current' ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">{t('currentPassword')}</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">{t('newPassword')}</label>
              <div className="flex gap-4">
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className="flex-1 bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 outline-none focus:border-red-500 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={savingPassword || !currentPassword || !newPassword}
                  className="px-6 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center"
                >
                  {savingPassword ? <Loader2 size={14} className="animate-spin" /> : t('updatePassword')}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPasswordWithEmail} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">{t('verificationCode')}</label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  required
                  placeholder="123456"
                  className="flex-1 bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 outline-none focus:border-red-500 transition-colors tracking-widest"
                />
                <button 
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={sendingResetCode || resetCountdown > 0}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center"
                >
                  {sendingResetCode ? <Loader2 size={14} className="animate-spin" /> : resetCountdown > 0 ? `${resetCountdown}s` : t('sendCode')}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">{t('newPassword')}</label>
              <div className="flex gap-4">
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className="flex-1 bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 outline-none focus:border-red-500 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={savingPassword || !resetCode || !newPassword}
                  className="px-6 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center"
                >
                  {savingPassword ? <Loader2 size={14} className="animate-spin" /> : t('updatePassword')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
