'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, UserCheck, Users, ShieldMinus, ChevronDown, ChevronRight, Gamepad2 } from 'lucide-react';
import { getUsersWithSharedAccounts, revokeShare, revokeAllSharesForUser } from '@/app/actions/share';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface ManageSharedUsersModalProps {
  onClose: () => void;
}

export function ManageSharedUsersModal({ onClose }: ManageSharedUsersModalProps) {
  const [sharedUsers, setSharedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const t = useTranslations('Share');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const res = await getUsersWithSharedAccounts();
    if (res.success && res.users) {
      setSharedUsers(res.users);
    } else {
      toast.error(t('loadFailed'));
    }
    setLoading(false);
  };

  const toggleExpand = (userId: string) => {
    const next = new Set(expandedUsers);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setExpandedUsers(next);
  };

  const handleRevokeAccount = async (targetUserId: string, accountId: string) => {
    setRevokingId(`${targetUserId}-${accountId}`);
    const res = await revokeShare(accountId, targetUserId);
    setRevokingId(null);
    
    if (res.success) {
      toast.success(t('revokeSuccess'));
      setSharedUsers(prev => {
        return prev.map(u => {
          if (u.user.id === targetUserId) {
            return {
              ...u,
              accounts: u.accounts.filter((a: any) => a.id !== accountId)
            };
          }
          return u;
        }).filter(u => u.accounts.length > 0);
      });
    } else {
      toast.error(res.error || t('revokeFailed'));
    }
  };

  const handleRevokeAll = async (targetUserId: string) => {
    if (!confirm(t('revokeAllConfirm'))) return;
    
    setRevokingId(targetUserId);
    const res = await revokeAllSharesForUser(targetUserId);
    setRevokingId(null);
    
    if (res.success) {
      toast.success(t('revokeAllSuccess'));
      setSharedUsers(prev => prev.filter(u => u.user.id !== targetUserId));
    } else {
      toast.error(res.error || t('revokeFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-3xl blur-lg opacity-30 pointer-events-none" />
        
        <div className="bg-[#0d1117] border border-gray-800 rounded-3xl p-8 relative shadow-2xl flex flex-col max-h-[85vh]">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors focus:outline-none bg-gray-900 p-2 rounded-full border border-gray-800 z-10"
          >
            <X size={16} />
          </button>
          
          <h3 className="text-xl font-bold mb-2 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            {t('manageSharesTitle')}
          </h3>
          <p className="text-xs text-gray-400 mb-6 tracking-wide">
            {t('manageSharesDesc')}
          </p>
          
          <div className="overflow-y-auto flex-1 pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {loading ? (
              <div className="flex justify-center items-center py-12 text-gray-500">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : sharedUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                <Users size={32} className="mb-3 opacity-20" />
                <p className="text-sm">{t('noSharedUsers')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedUsers.map(({ user, accounts }) => {
                  const isExpanded = expandedUsers.has(user.id);
                  return (
                    <div key={user.id} className="bg-gray-900/40 border border-gray-800/50 rounded-xl overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/40 transition-colors"
                        onClick={() => toggleExpand(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <UserCheck size={14} className="text-purple-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-200">{user.nickname}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{user.displayInfo}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500 px-2 py-1 bg-gray-900 rounded-md border border-gray-800">
                            {accounts.length} {accounts.length === 1 ? t('account') : t('accounts')}
                          </div>
                          {isExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t border-gray-800/50 p-2 bg-gray-900/20">
                          <div className="space-y-1 mb-2">
                            {accounts.map((account: any) => (
                              <div key={account.id} className="flex items-center justify-between p-2 hover:bg-gray-800/30 rounded-lg transition-colors group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <Gamepad2 size={12} className="text-gray-500 shrink-0" />
                                  <span className="text-xs text-gray-300 truncate">{account.alias || account.summonerId}</span>
                                  <span className="text-[10px] text-gray-600 border border-gray-800 px-1.5 py-0.5 rounded">{account.region}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevokeAccount(user.id, account.id);
                                  }}
                                  disabled={revokingId === `${user.id}-${account.id}`}
                                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                  title={t('revokeThisAccount')}
                                >
                                  {revokingId === `${user.id}-${account.id}` ? <Loader2 size={14} className="animate-spin text-red-400" /> : <ShieldMinus size={14} />}
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevokeAll(user.id);
                            }}
                            disabled={revokingId === user.id}
                            className="w-full py-2 text-xs font-bold uppercase tracking-widest text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {revokingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldMinus size={14} />}
                            {t('revokeAllShares')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
