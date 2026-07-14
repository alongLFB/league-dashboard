'use client';

import { useState } from 'react';
import { AccountCard } from './AccountCard';
import { ShareModal } from './ShareModal';
import { Share2, X, CheckSquare } from 'lucide-react';

interface AccountListClientProps {
  accounts: any[];
}

export function AccountListClient({ accounts }: AccountListClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

  return (
    <>
      <div className="mb-6 flex justify-end">
        {!isSelectionMode && accounts.length > 0 && (
          <button 
            onClick={() => setIsSelectionMode(true)}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-300 uppercase tracking-widest transition-colors"
          >
            <CheckSquare size={14} />
            Select Multiple
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
        {accounts.map(account => (
          <AccountCard 
            key={account.id} 
            {...account} 
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.has(account.id)}
            onToggleSelect={() => toggleSelect(account.id)}
          />
        ))}
      </div>

      {/* Floating Action Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-gray-700 p-2 rounded-2xl shadow-2xl flex items-center gap-4 shadow-blue-900/20">
            <div className="pl-4 text-sm font-bold text-gray-300 flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md text-xs">{selectedIds.size}</span>
              Selected
            </div>
            
            <div className="h-6 w-px bg-gray-700"></div>
            
            <button
              onClick={() => {
                if (selectedIds.size > 0) {
                  setIsShareModalOpen(true);
                }
              }}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-500 hover:to-green-400 disabled:opacity-50 disabled:grayscale text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            >
              <Share2 size={16} />
              Batch Share
            </button>
            
            <button
              onClick={cancelSelection}
              className="p-2.5 mr-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              title="Cancel Selection"
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
