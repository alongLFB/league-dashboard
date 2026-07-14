'use client';

import { useState } from 'react';
import { X, Search, Loader2, Share2, UserCheck } from 'lucide-react';
import { searchUserForShare, shareAccount } from '@/app/actions/share';
import { toast } from 'sonner';

interface ShareModalProps {
  accountId: string;
  onClose: () => void;
}

export function ShareModal({ accountId, onClose }: ShareModalProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [sharing, setSharing] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setTargetUser(null);
    try {
      const user = await searchUserForShare(query);
      if (user) {
        setTargetUser(user);
      } else {
        toast.error('User not found. Try another username or email.');
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleShare = async () => {
    if (!targetUser) return;
    
    setSharing(true);
    const res = await shareAccount(accountId, targetUser.id);
    setSharing(false);
    
    if (res.success) {
      toast.success(`Account shared with ${targetUser.nickname}`);
      onClose();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-500 rounded-3xl blur-lg opacity-30 animate-pulse pointer-events-none" />
        
        <div className="bg-[#0d1117] border border-gray-800 rounded-3xl p-8 relative shadow-2xl">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors focus:outline-none bg-gray-900 p-2 rounded-full border border-gray-800"
          >
            <X size={16} />
          </button>
          
          <h3 className="text-xl font-bold mb-2 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
            Share Account
          </h3>
          <p className="text-xs text-gray-400 mb-6 tracking-wide">
            Enter a username or email to share this account with.
          </p>
          
          <form onSubmit={handleSearch} className="relative group mb-6">
            <input 
              required
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setTargetUser(null);
              }}
              placeholder="Username or Email"
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-3 pl-4 pr-12 text-sm tracking-wide text-gray-200 outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="absolute right-2 top-2 bottom-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 hover:text-blue-300 rounded-lg px-3 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </form>

          {targetUser && (
            <div className="mt-4 p-4 bg-gray-900/80 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                  <UserCheck size={18} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-200">{targetUser.nickname}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{targetUser.displayInfo}</div>
                </div>
              </div>
              
              <button 
                onClick={handleShare}
                disabled={sharing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20 focus:outline-none"
              >
                {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                Confirm Share
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
