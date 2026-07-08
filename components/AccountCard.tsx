'use client';

import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import { deleteAccount } from '@/app/actions/accounts';
import { cn } from '@/lib/utils';

interface AccountCardProps {
  id: string;
  region: string;
  alias: string;
  summonerId: string;
  username: string;
  password?: string;
}

export function AccountCard({ id, region, alias, summonerId, username, password }: AccountCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteAccount(id);
  };

  return (
    <div className="group relative rounded-xl border border-gray-800 bg-gray-900/40 p-5 backdrop-blur-md transition-all hover:border-gray-700 hover:shadow-[0_0_20px_rgba(168,85,247,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium bg-gray-800/50 px-2 py-0.5 rounded-sm">
            {region}
          </span>
          <span className="text-sm font-semibold text-gray-200">{alias}</span>
        </div>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 disabled:opacity-50 focus:outline-none"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Summoner ID */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-gray-500 tracking-wider">SUMMONER ID</span>
          <div 
            className="flex items-center justify-between cursor-pointer group/item"
            onClick={() => handleCopy(summonerId, 'summonerId')}
          >
            <span className="text-sm text-gray-300 font-mono">{summonerId}</span>
            <div className="text-gray-600 transition-colors group-hover/item:text-gray-300">
              {copiedField === 'summonerId' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-gray-500 tracking-wider">USERNAME</span>
          <div 
            className="flex items-center justify-between cursor-pointer group/item"
            onClick={() => handleCopy(username, 'username')}
          >
            <span className="text-sm text-gray-300 font-mono">{username}</span>
            <div className="text-gray-600 transition-colors group-hover/item:text-gray-300">
              {copiedField === 'username' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-800/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-500 tracking-wider">PASSWORD</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
              className="text-gray-600 hover:text-gray-300 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <div 
            className="flex items-center justify-between cursor-pointer group/item"
            onClick={() => handleCopy(password || '', 'password')}
          >
            <span className={cn("text-sm font-mono tracking-wider", showPassword ? "text-gray-300" : "text-gray-500")}>
              {showPassword ? password : '••••••••'}
            </span>
            <div className="text-gray-600 transition-colors group-hover/item:text-gray-300">
              {copiedField === 'password' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
