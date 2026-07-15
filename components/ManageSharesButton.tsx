'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { ManageSharedUsersModal } from './ManageSharedUsersModal';
import { useTranslations } from 'next-intl';

export function ManageSharesButton() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('Dashboard');

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900/50 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-gray-800"
      >
        <Users size={16} className="text-purple-400" />
        {t('manageShares')}
      </button>

      {isOpen && <ManageSharedUsersModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
