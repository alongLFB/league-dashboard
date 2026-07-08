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
    <div className="group relative">
      {/* Background Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse pointer-events-none" />
      
      <div className="relative rounded-2xl border border-gray-800 bg-[#0d1117] p-6 shadow-2xl h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">
                {region}
              </span>
            </div>
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">{alias}</span>
          </div>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 disabled:opacity-50 focus:outline-none"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="space-y-4 flex-1">
          {/* Summoner ID */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-500 tracking-widest">SUMMONER ID</span>
            <div 
              className="flex items-center justify-between cursor-pointer group/item p-2 -mx-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              onClick={() => handleCopy(summonerId, 'summonerId')}
            >
              <span className="text-sm text-gray-300 font-mono tracking-wide">{summonerId}</span>
              <div className="text-gray-600 transition-colors group-hover/item:text-purple-400">
                {copiedField === 'summonerId' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-500 tracking-widest">USERNAME</span>
            <div 
              className="flex items-center justify-between cursor-pointer group/item p-2 -mx-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              onClick={() => handleCopy(username, 'username')}
            >
              <span className="text-sm text-gray-300 font-mono tracking-wide">{username}</span>
              <div className="text-gray-600 transition-colors group-hover/item:text-purple-400">
                {copiedField === 'username' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-800/80 mt-2">
            <div className="flex items-center justify-between px-2 -mx-2">
              <span className="text-[10px] font-bold text-gray-500 tracking-widest">PASSWORD</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                className="text-gray-600 hover:text-purple-400 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer group/item p-2 -mx-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              onClick={() => handleCopy(password || '', 'password')}
            >
              <span className={cn("text-sm font-mono tracking-widest", showPassword ? "text-gray-200" : "text-gray-600")}>
                {showPassword ? password : '••••••••'}
              </span>
              <div className="text-gray-600 transition-colors group-hover/item:text-purple-400">
                {copiedField === 'password' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
