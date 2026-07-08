'use client';

import { useState } from 'react';
import { login } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && password) {
      setLoading(true);
      const res = await login(password);
      if (res.success) {
        router.push('/');
      } else {
        setError(true);
        setPassword('');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center font-sans selection:bg-purple-500/30">
      <div className="w-full max-w-sm px-8">
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(false);
          }}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="ENTER KEY"
          className={`w-full bg-transparent border-b outline-none pb-3 text-gray-300 text-center tracking-[0.3em] uppercase text-sm transition-all duration-500 placeholder:text-gray-800 disabled:opacity-50 ${
            error 
              ? 'border-red-900/50 text-red-400 focus:border-red-900/50' 
              : 'border-gray-800 focus:border-gray-500'
          }`}
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
