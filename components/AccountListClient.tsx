'use client';

import { useState, useMemo } from 'react';
import { AccountCard } from './AccountCard';
import { ShareModal } from './ShareModal';
import { Share2, X, CheckSquare, Search, Filter, ArrowUpDown, User, Globe, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface AccountListClientProps {
  accounts: any[];
}

export function AccountListClient({ accounts }: AccountListClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'owned' | 'shared'>('all');
  const [sharedFilter, setSharedFilter] = useState<'all' | 'shared' | 'not_shared'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  const tList = useTranslations('AccountList');

  // Extract unique regions from accounts
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach(a => {
      if (a.region) set.add(a.region);
    });
    return Array.from(set).sort();
  }, [accounts]);

  const hasActiveFilters = searchQuery.trim() !== '' || 
    ownerFilter !== 'all' || 
    sharedFilter !== 'all' || 
    regionFilter !== 'all' || 
    sortBy !== 'default';

  const resetFilters = () => {
    setSearchQuery('');
    setOwnerFilter('all');
    setSharedFilter('all');
    setRegionFilter('all');
    setSortBy('default');
  };

  const filteredAndSortedAccounts = useMemo(() => {
    let result = [...accounts];

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.summonerId?.toLowerCase().includes(q) ||
        a.alias?.toLowerCase().includes(q) ||
        a.username?.toLowerCase().includes(q)
      );
    }

    // Ownership filter
    if (ownerFilter === 'owned') {
      result = result.filter(a => a.isOwner);
    } else if (ownerFilter === 'shared') {
      result = result.filter(a => !a.isOwner);
    }

    // Shared status filter
    if (sharedFilter === 'shared') {
      result = result.filter(a => a.isShared);
    } else if (sharedFilter === 'not_shared') {
      result = result.filter(a => !a.isShared);
    }

    // Region filter
    if (regionFilter !== 'all') {
      result = result.filter(a => a.region === regionFilter);
    }

    // Sorting
    if (sortBy !== 'default') {
      result.sort((a, b) => {
        switch (sortBy) {
          case 'summoner_asc':
            return (a.summonerId || '').localeCompare(b.summonerId || '', undefined, { sensitivity: 'base', numeric: true });
          case 'summoner_desc':
            return (b.summonerId || '').localeCompare(a.summonerId || '', undefined, { sensitivity: 'base', numeric: true });
          case 'alias_asc':
            return (a.alias || '').localeCompare(b.alias || '', undefined, { sensitivity: 'base', numeric: true });
          case 'alias_desc':
            return (b.alias || '').localeCompare(a.alias || '', undefined, { sensitivity: 'base', numeric: true });
          case 'username_asc':
            return (a.username || '').localeCompare(b.username || '', undefined, { sensitivity: 'base', numeric: true });
          case 'username_desc':
            return (b.username || '').localeCompare(a.username || '', undefined, { sensitivity: 'base', numeric: true });
          default:
            return 0;
        }
      });
    }

    return result;
  }, [accounts, searchQuery, ownerFilter, sharedFilter, regionFilter, sortBy]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedAccounts.map(a => a.id)));
    }
  };

  return (
    <>
      {/* Filter and Control Bar */}
      <div className="mb-8 bg-[#0d1117]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
        {/* Top bar: Search input & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tList('searchPlaceholder')}
              className="w-full bg-[#161b22] border border-gray-700/80 rounded-xl pl-10 pr-9 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end shrink-0">
            {!isSelectionMode && accounts.length > 0 && (
              <button 
                onClick={() => setIsSelectionMode(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-bold text-gray-300 hover:text-white uppercase tracking-wider transition-all"
              >
                <CheckSquare size={14} className="text-blue-400" />
                {tList('selectMultiple')}
              </button>
            )}
          </div>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-800/60 text-xs">
          {/* Ownership Filter */}
          <div className="flex items-center gap-1.5 bg-[#161b22] border border-gray-700/80 rounded-xl px-3 py-1.5 text-gray-300">
            <User size={13} className="text-purple-400 shrink-0" />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value as any)}
              className="bg-transparent text-gray-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#161b22] text-gray-300">{tList('allOwnership')}</option>
              <option value="owned" className="bg-[#161b22] text-gray-300">{tList('ownedByMe')}</option>
              <option value="shared" className="bg-[#161b22] text-gray-300">{tList('sharedToMe')}</option>
            </select>
          </div>

          {/* Shared Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#161b22] border border-gray-700/80 rounded-xl px-3 py-1.5 text-gray-300">
            <Share2 size={13} className="text-blue-400 shrink-0" />
            <select
              value={sharedFilter}
              onChange={(e) => setSharedFilter(e.target.value as any)}
              className="bg-transparent text-gray-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#161b22] text-gray-300">{tList('allShared')}</option>
              <option value="shared" className="bg-[#161b22] text-gray-300">{tList('isShared')}</option>
              <option value="not_shared" className="bg-[#161b22] text-gray-300">{tList('isNotShared')}</option>
            </select>
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1.5 bg-[#161b22] border border-gray-700/80 rounded-xl px-3 py-1.5 text-gray-300">
            <Globe size={13} className="text-green-400 shrink-0" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-transparent text-gray-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#161b22] text-gray-300">{tList('allRegions')}</option>
              {availableRegions.map(reg => (
                <option key={reg} value={reg} className="bg-[#161b22] text-gray-300">{reg}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#161b22] border border-gray-700/80 rounded-xl px-3 py-1.5 text-gray-300 ml-auto">
            <ArrowUpDown size={13} className="text-amber-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-gray-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="default" className="bg-[#161b22] text-gray-300">{tList('sortDefault')}</option>
              <option value="summoner_asc" className="bg-[#161b22] text-gray-300">{tList('sortSummonerAsc')}</option>
              <option value="summoner_desc" className="bg-[#161b22] text-gray-300">{tList('sortSummonerDesc')}</option>
              <option value="alias_asc" className="bg-[#161b22] text-gray-300">{tList('sortAliasAsc')}</option>
              <option value="alias_desc" className="bg-[#161b22] text-gray-300">{tList('sortAliasDesc')}</option>
              <option value="username_asc" className="bg-[#161b22] text-gray-300">{tList('sortUsernameAsc')}</option>
              <option value="username_desc" className="bg-[#161b22] text-gray-300">{tList('sortUsernameDesc')}</option>
            </select>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 rounded-xl transition-colors"
              title={tList('resetFilters')}
            >
              <RotateCcw size={13} />
              <span>{tList('resetFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Grid or Empty Filter State */}
      {filteredAndSortedAccounts.length === 0 ? (
        <div className="text-center py-24 border border-gray-800 rounded-3xl border-dashed bg-[#0d1117]/50 shadow-2xl relative group">
          <div className="flex flex-col items-center justify-center gap-3">
            <Filter size={32} className="text-gray-600 mb-1" />
            <p className="text-gray-400 text-sm font-medium">{tList('noFilteredAccounts')}</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-bold transition-colors"
              >
                <RotateCcw size={14} />
                {tList('resetFilters')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
          {filteredAndSortedAccounts.map(account => (
            <AccountCard 
              key={account.id} 
              {...account} 
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(account.id)}
              onToggleSelect={() => toggleSelect(account.id)}
            />
          ))}
        </div>
      )}

      {/* Floating Action Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-gray-700 p-2 rounded-2xl shadow-2xl flex items-center gap-4 shadow-blue-900/20">
            <div className="pl-4 text-sm font-bold text-gray-300 flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md text-xs">{selectedIds.size}</span>
              {tList('selected')}
            </div>
            
            <div className="h-6 w-px bg-gray-700"></div>
            
            <button
              onClick={toggleSelectAll}
              className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              title={selectedIds.size === filteredAndSortedAccounts.length ? tList('unselectAll') : tList('selectAll')}
            >
              <CheckSquare size={16} className={selectedIds.size === filteredAndSortedAccounts.length ? "text-blue-400" : ""} />
            </button>
            
            <button
              onClick={() => {
                if (selectedIds.size === 0) return;
                const selectedList = accounts.filter(a => selectedIds.has(a.id));
                const sharableList = selectedList.filter(a => a.isOwner || a.canReshare);
                const unsharableCount = selectedList.length - sharableList.length;

                if (sharableList.length === 0) {
                  toast.error(tList('noSharableAccounts'));
                  return;
                }

                if (unsharableCount > 0) {
                  toast.info(tList('filteredUnsharable', { count: unsharableCount }));
                  setSelectedIds(new Set(sharableList.map(a => a.id)));
                }

                setIsShareModalOpen(true);
              }}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-500 hover:to-green-400 disabled:opacity-50 disabled:grayscale text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            >
              <Share2 size={16} />
              {tList('shareOrManage')}
            </button>
            
            <button
              onClick={cancelSelection}
              className="p-2.5 mr-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              title={tList('cancelSelection')}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {isShareModalOpen && (
        <ShareModal 
          accountIds={Array.from(selectedIds)}
          onClose={() => {
            setIsShareModalOpen(false);
            cancelSelection();
          }}
        />
      )}
    </>
  );
}
