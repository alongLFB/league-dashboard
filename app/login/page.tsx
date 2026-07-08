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
    <div className="min-h-screen bg-[#0a0a0c] text-white overflow-hidden relative selection:bg-purple-500/30 flex items-center justify-center font-sans">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-b from-blue-900/20 to-purple-900/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm px-8 relative z-10">
        <h1 className="text-center text-xs font-black tracking-[0.4em] mb-12 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Taste / League
        </h1>
        <div className="relative group">
          <div className={`absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out ${password ? 'w-full' : 'w-0 group-focus-within:w-full'}`} />
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
            className={`w-full bg-transparent border-b outline-none pb-3 text-gray-200 text-center tracking-[0.4em] uppercase text-sm transition-all duration-500 placeholder:text-gray-800 disabled:opacity-50 relative z-10 ${
              error 
                ? 'border-red-900/50 text-red-400 focus:border-red-900/50' 
                : 'border-gray-800 focus:border-transparent'
            }`}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
