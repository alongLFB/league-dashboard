import { getAccounts } from '@/app/actions/accounts';
import { AccountCard } from '@/components/AccountCard';
import { AddAccountForm } from '@/components/AddAccountForm';
import { logout } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const accounts = await getAccounts();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#ededed] font-sans selection:bg-purple-500/30 selection:text-white pb-20">
      <header className="border-b border-gray-800 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xs font-bold tracking-widest text-gray-300 uppercase">
            Taste <span className="text-gray-600 font-light mx-1">/</span> League
          </h1>
          <form action={logout}>
            <button className="text-gray-500 hover:text-white transition-colors focus:outline-none">
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-light tracking-widest text-gray-200 uppercase">Accounts</h2>
          <AddAccountForm />
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-32 border border-gray-800 rounded-2xl border-dashed bg-gray-900/20">
            <p className="text-gray-500 text-xs tracking-widest uppercase font-medium">No accounts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map(account => (
              <AccountCard key={account.id} {...account} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
