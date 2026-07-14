import { getAccounts } from '@/app/actions/accounts';
import { AccountListClient } from '@/components/AccountListClient';
import { AddAccountForm } from '@/components/AddAccountForm';
import { logout } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const accounts = await getAccounts();
  const t = await getTranslations('Dashboard');

  return (
    <main className="max-w-6xl mx-auto px-6 mt-16 relative z-10">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500 uppercase">
            {t('accountsTitle')}
          </h2>
          <AddAccountForm />
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-32 border border-gray-800 rounded-3xl border-dashed bg-[#0d1117]/50 shadow-2xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 to-blue-500/10 rounded-3xl blur-md opacity-30 group-hover:opacity-50 transition duration-1000" />
            <p className="text-gray-500 text-xs tracking-widest uppercase font-medium relative z-10">{t('noAccounts')}</p>
          </div>
        ) : (
          <AccountListClient accounts={accounts} />
        )}
      </main>
  );
}
