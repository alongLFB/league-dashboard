'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, Share2, UserCheck, Users, ShieldMinus, ShieldCheck, ShieldAlert, ChevronDown, ChevronRight, Gamepad2, Check } from 'lucide-react';
import { 
  searchUserForShare, 
  getRegisteredUsersForShare,
  shareAccount, 
  getAccountShares, 
  revokeShare, 
  batchShareAccounts, 
  getBatchAccountShares, 
  batchRevokeShareForUser,
  toggleShareResharePermission 
} from '@/app/actions/share';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface ShareModalProps {
  accountIds: string[];
  onClose: () => void;
}

export function ShareModal({ accountIds, onClose }: ShareModalProps) {
  const isBatch = accountIds.length > 1;
  const [activeTab, setActiveTab] = useState<'share' | 'manage'>('share');
  const t = useTranslations('Share');
  
  // Share state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [allowReshare, setAllowReshare] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Registered users state
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [loadingRegistered, setLoadingRegistered] = useState(false);

  // Manage state
  const [sharedUsers, setSharedUsers] = useState<any[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeTab === 'manage') {
      loadShares();
    } else if (activeTab === 'share') {
      loadRegisteredUsers();
    }
  }, [activeTab]);

  const loadRegisteredUsers = async () => {
    setLoadingRegistered(true);
    const res = await getRegisteredUsersForShare();
    if (res.success && res.users) {
      setRegisteredUsers(res.users);
    }
    setLoadingRegistered(false);
  };

  const loadShares = async () => {
    setLoadingShares(true);
    const res = isBatch 
      ? await getBatchAccountShares(accountIds)
      : await getAccountShares(accountIds[0]);
    if (res.success && res.shares) {
      setSharedUsers(res.shares);
    }
    setLoadingShares(false);
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if matched in loaded registered users list
    const q = query.trim().toLowerCase();
    const matched = registeredUsers.find(
      u => u.username?.toLowerCase() === q ||
           u.nickname?.toLowerCase() === q ||
           u.displayInfo?.toLowerCase() === q
    );
    if (matched) {
      setTargetUser(matched);
      return;
    }

    setSearching(true);
    try {
      const user = await searchUserForShare(query);
      if (user) {
        setTargetUser(user);
      } else {
        toast.error(t('userNotFound'));
      }
    } catch (error) {
      toast.error(t('searchFailed'));
    } finally {
      setSearching(false);
    }
  };

  const handleShare = async () => {
    if (!targetUser) return;
    
    setSharing(true);
    let res;
    if (isBatch) {
      res = await batchShareAccounts(accountIds, targetUser.id, allowReshare);
    } else {
      res = await shareAccount(accountIds[0], targetUser.id, allowReshare);
    }
    setSharing(false);
    
    if (res.success) {
      toast.success(isBatch ? t('shareBatchSuccess', { count: accountIds.length, nickname: targetUser.nickname }) : t('shareSuccess', { nickname: targetUser.nickname }));
      onClose();
    } else {
      if (res?.error === 'UNAUTHORIZED_ACCOUNTS') {
        toast.error(t('unauthorizedReshare'));
      } else {
        toast.error(res?.error || t('shareFailed'));
      }
    }
  };

  const handleToggleReshare = async (accountId: string, targetUserId: string, currentVal: boolean) => {
    const key = `${targetUserId}-${accountId}`;
    setTogglingId(key);
    const res = await toggleShareResharePermission(accountId, targetUserId, !currentVal);
    setTogglingId(null);

    if (res.success) {
      toast.success(t('toggleReshareSuccess'));
      // Update local state
      setSharedUsers(prev => {
        if (isBatch) {
          return prev.map(u => {
            if (u.userId === targetUserId) {
              return {
                ...u,
                accounts: u.accounts.map((a: any) => a.id === accountId ? { ...a, canReshare: !currentVal } : a)
              };
            }
            return u;
          });
        } else {
          return prev.map(u => u.userId === targetUserId ? { ...u, canReshare: !currentVal } : u);
        }
      });
    } else {
      toast.error(res.error || t('toggleReshareFailed'));
    }
  };

  const handleRevokeSingle = async (targetUserId: string, accountId: string) => {
    const key = `${targetUserId}-${accountId}`;
    setRevokingId(key);
    const res = await revokeShare(accountId, targetUserId);
    setRevokingId(null);
    
    if (res.success) {
      toast.success(t('revokeSuccess'));
      setSharedUsers(prev => {
        if (isBatch) {
          return prev.map(u => {
            if (u.userId === targetUserId) {
              return {
                ...u,
                accounts: u.accounts.filter((a: any) => a.id !== accountId)
              };
            }
            return u;
          }).filter(u => u.accounts.length > 0);
        } else {
          return prev.filter(u => u.userId !== targetUserId);
        }
      });
    } else {
      toast.error(res.error || t('revokeFailed'));
    }
  };

  const handleRevokeBatch = async (targetUserId: string) => {
    setRevokingId(targetUserId);
    const res = isBatch
      ? await batchRevokeShareForUser(accountIds, targetUserId)
      : await revokeShare(accountIds[0], targetUserId);
    setRevokingId(null);
    
    if (res.success) {
      toast.success(isBatch ? t('revokeBatchSuccess') : t('revokeSuccess'));
      setSharedUsers(prev => prev.filter(u => u.userId !== targetUserId));
    } else {
      toast.error(res.error || t('revokeFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-500 rounded-3xl blur-lg opacity-30 animate-pulse pointer-events-none" />
        
        <div className="bg-[#0d1117] border border-gray-800 rounded-3xl p-8 relative shadow-2xl flex flex-col max-h-[85vh]">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors focus:outline-none bg-gray-900 p-2 rounded-full border border-gray-800 z-10"
          >
            <X size={16} />
          </button>
          
          <h3 className="text-xl font-bold mb-2 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
            {isBatch ? t('batchShareTitle', { count: accountIds.length }) : t('shareTitle')}
          </h3>
          <p className="text-xs text-gray-400 mb-6 tracking-wide">
            {isBatch ? t('batchShareDesc') : t('shareDesc')}
          </p>
          
          <div className="flex bg-gray-900/50 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'share' ? 'bg-blue-600/20 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t('tabShare')}
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'manage' ? 'bg-blue-600/20 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t('tabManage')}
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {activeTab === 'share' ? (
              <div className="space-y-4">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative group">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t('searchUserPlaceholder')}
                    className="w-full bg-gray-900/60 border border-gray-800 rounded-xl py-2.5 pl-10 pr-10 text-xs tracking-wide text-gray-200 outline-none focus:border-blue-500 transition-colors"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                    >
                      <X size={13} />
                    </button>
                  )}
                </form>

                {/* Selected Target User & Confirm Card */}
                {targetUser && (
                  <div className="p-4 bg-gradient-to-b from-blue-950/40 to-gray-900/80 border border-blue-500/40 rounded-2xl shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        {t('selectedRecipient')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTargetUser(null)}
                        className="text-[11px] text-gray-400 hover:text-white px-2 py-0.5 bg-gray-800/60 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700/60"
                      >
                        {t('changeRecipient')}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-400/50 flex items-center justify-center font-bold text-sm text-blue-300 shadow-inner">
                        {targetUser.nickname ? targetUser.nickname.slice(0, 1).toUpperCase() : <UserCheck size={18} />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-100 truncate">{targetUser.nickname}</span>
                          {targetUser.username && (
                            <span className="text-xs text-blue-400/80 font-mono truncate">@{targetUser.username}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono truncate">{targetUser.displayInfo}</div>
                      </div>
                    </div>

                    {/* Secondary Sharing Permission Checkbox */}
                    <div 
                      className="flex items-start gap-3 p-3 bg-gray-950/80 border border-gray-800/80 rounded-xl cursor-pointer hover:border-gray-700 transition-colors"
                      onClick={() => setAllowReshare(!allowReshare)}
                    >
                      <input
                        type="checkbox"
                        id="allowReshare"
                        checked={allowReshare}
                        onChange={(e) => setAllowReshare(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-blue-600 bg-gray-900 border-gray-700 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                      />
                      <div className="flex-1 select-none">
                        <label htmlFor="allowReshare" className="text-xs font-bold text-gray-200 cursor-pointer flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-blue-400" />
                          {t('allowReshare')}
                        </label>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                          {t('allowReshareDesc')}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleShare}
                      disabled={sharing}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30 focus:outline-none"
                    >
                      {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                      {t('confirmShare')}
                    </button>
                  </div>
                )}

                {/* Registered Users List */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1 text-[11px] font-bold tracking-wider text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="text-blue-400" />
                      {t('registeredUsers')}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {loadingRegistered ? '...' : `${registeredUsers.filter(u => {
                        if (!query.trim()) return true;
                        const q = query.toLowerCase().trim();
                        return (
                          u.nickname?.toLowerCase().includes(q) ||
                          u.username?.toLowerCase().includes(q) ||
                          u.displayInfo?.toLowerCase().includes(q)
                        );
                      }).length} / ${registeredUsers.length}`}
                    </span>
                  </div>

                  {loadingRegistered ? (
                    <div className="flex justify-center items-center py-8 text-gray-500">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                  ) : (
                    (() => {
                      const filtered = registeredUsers.filter(u => {
                        if (!query.trim()) return true;
                        const q = query.toLowerCase().trim();
                        return (
                          u.nickname?.toLowerCase().includes(q) ||
                          u.username?.toLowerCase().includes(q) ||
                          u.displayInfo?.toLowerCase().includes(q)
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500 text-xs bg-gray-900/30 border border-gray-800/50 rounded-2xl">
                            {query ? t('noMatchingUsers') : t('noOtherUsers')}
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800">
                          {filtered.map(user => {
                            const isSelected = targetUser?.id === user.id;
                            return (
                              <div
                                key={user.id}
                                onClick={() => setTargetUser(user)}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group ${
                                  isSelected 
                                    ? 'bg-blue-600/20 border-blue-500/60 shadow-sm shadow-blue-900/20' 
                                    : 'bg-gray-900/40 border-gray-800/60 hover:bg-gray-800/50 hover:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                    isSelected 
                                      ? 'bg-blue-500 text-white shadow-md' 
                                      : 'bg-gray-800 text-gray-300 border border-gray-700 group-hover:border-gray-600'
                                  }`}>
                                    {user.nickname ? user.nickname.slice(0, 1).toUpperCase() : 'U'}
                                  </div>
                                  <div className="overflow-hidden">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-300' : 'text-gray-200'}`}>
                                        {user.nickname}
                                      </span>
                                      {user.username && (
                                        <span className="text-[10px] text-gray-500 font-mono truncate">@{user.username}</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono truncate">{user.displayInfo}</div>
                                  </div>
                                </div>

                                <div className="shrink-0 ml-2">
                                  {isSelected ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-blue-500 text-white rounded-lg shadow-sm">
                                      <Check size={12} />
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-2 py-1 rounded-lg text-gray-400 bg-gray-900/60 border border-gray-800 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                                      {t('selectRecipient')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {loadingShares ? (
                  <div className="flex justify-center items-center py-8 text-gray-500">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : sharedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                    <Users size={32} className="mb-3 opacity-20" />
                    <p className="text-sm">{t('notSharedYet')}</p>
                  </div>
                ) : isBatch ? (
                  /* Batch mode: Grouped by user, expandable with per-account reshare toggle & revoke */
                  sharedUsers.map(user => {
                    const isExpanded = expandedUsers.has(user.userId);
                    return (
                      <div key={user.userId} className="bg-gray-900/40 border border-gray-800/50 rounded-xl overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-800/40 transition-colors"
                          onClick={() => toggleExpand(user.userId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                              <UserCheck size={14} className="text-blue-400" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-200">{user.nickname}</div>
                              <div className="text-[10px] text-gray-500 font-mono">{user.displayInfo}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-gray-400 px-2 py-0.5 bg-gray-900 rounded-md border border-gray-800">
                              {user.accounts.length} {user.accounts.length === 1 ? t('account') : t('accounts')}
                            </span>
                            {isExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-800/50 p-2 bg-gray-900/20 space-y-2">
                            <div className="space-y-1">
                              {user.accounts.map((account: any) => {
                                const toggleKey = `${user.userId}-${account.id}`;
                                return (
                                  <div key={account.id} className="flex items-center justify-between p-2 hover:bg-gray-800/30 rounded-lg transition-colors group">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <Gamepad2 size={12} className="text-gray-500 shrink-0" />
                                      <span className="text-xs text-gray-300 truncate">{account.alias || account.summonerId}</span>
                                      <span className="text-[10px] text-gray-600 border border-gray-800 px-1.5 py-0.5 rounded">{account.region}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {/* Toggle Reshare button (if owner) */}
                                      {account.isOwner ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleReshare(account.id, user.userId, account.canReshare);
                                          }}
                                          disabled={togglingId === toggleKey}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                                            account.canReshare 
                                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                                              : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'
                                          }`}
                                          title={account.canReshare ? t('reshareEnabled') : t('reshareDisabled')}
                                        >
                                          {togglingId === toggleKey ? (
                                            <Loader2 size={10} className="animate-spin" />
                                          ) : account.canReshare ? (
                                            <ShieldCheck size={10} />
                                          ) : (
                                            <ShieldAlert size={10} />
                                          )}
                                          {account.canReshare ? t('canReshareBadge') : t('resharePermTitle')}
                                        </button>
                                      ) : account.canReshare ? (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                          <ShieldCheck size={10} />
                                          {t('canReshareBadge')}
                                        </span>
                                      ) : null}

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRevokeSingle(user.userId, account.id);
                                        }}
                                        disabled={revokingId === toggleKey}
                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                        title={t('revokeThisAccount')}
                                      >
                                        {revokingId === toggleKey ? <Loader2 size={12} className="animate-spin text-red-400" /> : <ShieldMinus size={12} />}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevokeBatch(user.userId);
                              }}
                              disabled={revokingId === user.userId}
                              className="w-full py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {revokingId === user.userId ? <Loader2 size={12} className="animate-spin" /> : <ShieldMinus size={12} />}
                              {t('revokeAllShares')}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  /* Single mode */
                  sharedUsers.map(user => {
                    const toggleKey = `${user.userId}-${accountIds[0]}`;
                    return (
                      <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-800/50 rounded-xl group hover:border-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <UserCheck size={14} className="text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-200">{user.nickname}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{user.displayInfo}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Reshare toggle button */}
                          {user.isOwner ? (
                            <button
                              onClick={() => handleToggleReshare(accountIds[0], user.userId, user.canReshare)}
                              disabled={togglingId === toggleKey}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                                user.canReshare 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                                  : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'
                              }`}
                              title={user.canReshare ? t('reshareEnabled') : t('reshareDisabled')}
                            >
                              {togglingId === toggleKey ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : user.canReshare ? (
                                <ShieldCheck size={12} />
                              ) : (
                                <ShieldAlert size={12} />
                              )}
                              {user.canReshare ? t('canReshareBadge') : t('resharePermTitle')}
                            </button>
                          ) : user.canReshare ? (
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <ShieldCheck size={12} />
                              {t('canReshareBadge')}
                            </span>
                          ) : null}

                          <button
                            onClick={() => handleRevokeBatch(user.userId)}
                            disabled={revokingId === user.userId}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                            title={t('revokeThisAccount')}
                          >
                            {revokingId === user.userId ? <Loader2 size={16} className="animate-spin text-red-400" /> : <ShieldMinus size={16} />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
