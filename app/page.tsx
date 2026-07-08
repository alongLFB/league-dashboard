import { getAccounts } from '@/app/actions/accounts';
import { AccountCard } from '@/components/AccountCard';
import { AddAccountForm } from '@/components/AddAccountForm';
import { logout } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const accounts = await getAccounts();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white overflow-hidden relative selection:bg-purple-500/30 pb-20 font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-blue-900/20 to-purple-900/10 blur-[100px] rounded-full pointer-events-none" />

      <header className="border-b border-gray-800/60 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-sm font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            TASTE <span className="text-gray-600 font-light mx-2">/</span> LEAGUE
          </h1>
          <form action={logout}>
            <button className="text-gray-500 hover:text-purple-400 transition-colors focus:outline-none">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-16 relative z-10">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500 uppercase">
            Accounts
          </h2>
          <AddAccountForm />
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-32 border border-gray-800 rounded-3xl border-dashed bg-[#0d1117]/50 shadow-2xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 to-blue-500/10 rounded-3xl blur-md opacity-30 group-hover:opacity-50 transition duration-1000" />
            <p className="text-gray-500 text-xs tracking-widest uppercase font-medium relative z-10">No accounts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {accounts.map(account => (
              <AccountCard key={account.id} {...account} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
