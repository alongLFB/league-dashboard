'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { addAccount } from '@/app/actions/accounts';

export function AddAccountForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    region: '', alias: '', summonerId: '', username: '', password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addAccount(formData);
    setLoading(false);
    setIsOpen(false);
    setFormData({ region: '', alias: '', summonerId: '', username: '', password: '' });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-white transition-colors bg-gray-800/30 hover:bg-gray-800/60 px-4 py-2 rounded-full border border-gray-800/50 hover:border-gray-700 focus:outline-none shadow-sm"
      >
        <Plus size={14} /> Add New
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c]/80 backdrop-blur-md">
          <div className="bg-[#0a0a0c] border border-gray-800 rounded-2xl p-8 w-full max-w-md relative shadow-2xl shadow-purple-900/5">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors focus:outline-none"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-light mb-8 tracking-wide text-gray-200">New Account</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <input 
                  required placeholder="REGION (e.g. EUW)" 
                  value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}
                  className="bg-transparent border-b border-gray-800 pb-2 text-xs uppercase tracking-wider text-gray-200 outline-none focus:border-gray-500 transition-colors placeholder:text-gray-700" 
                />
                <input 
                  required placeholder="ALIAS (e.g. SMURF 1)" 
                  value={formData.alias} onChange={e => setFormData({...formData, alias: e.target.value})}
                  className="bg-transparent border-b border-gray-800 pb-2 text-xs uppercase tracking-wider text-gray-200 outline-none focus:border-gray-500 transition-colors placeholder:text-gray-700" 
                />
              </div>
              <input 
                required placeholder="SUMMONER ID" 
                value={formData.summonerId} onChange={e => setFormData({...formData, summonerId: e.target.value})}
                className="w-full bg-transparent border-b border-gray-800 pb-2 text-xs uppercase tracking-wider text-gray-200 outline-none focus:border-gray-500 transition-colors placeholder:text-gray-700 font-mono" 
              />
              <input 
                required placeholder="LOGIN USERNAME" 
                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full bg-transparent border-b border-gray-800 pb-2 text-xs tracking-wider text-gray-200 outline-none focus:border-gray-500 transition-colors placeholder:text-gray-700 font-mono" 
              />
              <input 
                required type="password" placeholder="PASSWORD" 
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-transparent border-b border-gray-800 pb-2 text-sm text-gray-200 outline-none focus:border-gray-500 transition-colors placeholder:text-gray-700 font-mono tracking-wider" 
              />
              <div className="pt-6 flex justify-end">
                <button 
                  disabled={loading}
                  type="submit"
                  className="bg-gray-100 text-[#0a0a0c] px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none shadow-lg shadow-white/5"
                >
                  {loading && <Loader2 size={12} className="animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
