'use client';

import { useState } from 'react';
import { Plus, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { addAccount } from '@/app/actions/accounts';

const REGIONS = [
  'EUW', 'NA', 'KR', 'EUNE', 'BR', 'JP', 'LAN', 'LAS', 'OCE', 'TR', 'RU', 'PH', 'SG', 'TH', 'TW', 'VN', 'PBE'
];

export function AddAccountForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    region: 'EUW', alias: '', summonerId: '', username: '', password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate Summoner ID contains a '#'
    if (!formData.summonerId.includes('#')) {
      setError('Summoner ID must contain a "#" tag (e.g. Name#1234)');
      return;
    }

    setLoading(true);
    await addAccount(formData);
    setLoading(false);
    setIsOpen(false);
    setFormData({ region: 'EUW', alias: '', summonerId: '', username: '', password: '' });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-500 rounded-full font-bold shadow-lg shadow-purple-900/20 transition-all border border-purple-500/30 text-xs tracking-wider uppercase focus:outline-none"
      >
        <Plus size={16} /> Add New
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c]/80 backdrop-blur-md">
          <div className="relative w-full max-w-md">
            {/* Modal Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-3xl blur-lg opacity-30 animate-pulse pointer-events-none" />
            
            <div className="bg-[#0d1117] border border-gray-800 rounded-3xl p-8 relative shadow-2xl">
              <button 
                onClick={() => { setIsOpen(false); setError(null); }}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors focus:outline-none bg-gray-900 p-2 rounded-full border border-gray-800"
              >
                <X size={16} />
              </button>
              <h3 className="text-xl font-bold mb-6 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                New Account
              </h3>
              
              {error && (
                <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <select 
                    required 
                    value={formData.region} 
                    onChange={e => setFormData({...formData, region: e.target.value})}
                    className="bg-transparent border-b border-gray-800 pb-2 text-sm tracking-wider text-gray-200 outline-none focus:border-purple-500 transition-colors cursor-pointer font-medium"
                  >
                    {REGIONS.map(r => (
                      <option key={r} value={r} className="bg-gray-900 text-gray-200">{r}</option>
                    ))}
                  </select>
                  <input 
                    required placeholder="ALIAS (e.g. Smurf 1)" 
                    value={formData.alias} onChange={e => setFormData({...formData, alias: e.target.value})}
                    className="bg-transparent border-b border-gray-800 pb-2 text-sm tracking-wider text-gray-200 outline-none focus:border-purple-500 transition-colors placeholder:text-gray-700 font-medium" 
                  />
                </div>
                <input 
                  required placeholder="SUMMONER ID (e.g. Name#Tag)" 
                  value={formData.summonerId} onChange={e => {
                    setFormData({...formData, summonerId: e.target.value});
                    if (error) setError(null);
                  }}
                  className="w-full bg-transparent border-b border-gray-800 pb-2 text-sm tracking-wider text-gray-200 outline-none focus:border-purple-500 transition-colors placeholder:text-gray-700 font-mono" 
                />
                <input 
                  required placeholder="LOGIN USERNAME" 
                  value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-transparent border-b border-gray-800 pb-2 text-sm tracking-wider text-gray-200 outline-none focus:border-purple-500 transition-colors placeholder:text-gray-700 font-mono" 
                />
                
                <div className="relative">
                  <input 
                    required type={showPassword ? "text" : "password"} placeholder="PASSWORD" 
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 pb-2 pr-8 text-sm text-gray-200 outline-none focus:border-purple-500 transition-colors placeholder:text-gray-700 font-mono tracking-wider" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 bottom-2 flex items-center text-gray-500 hover:text-purple-400 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <div className="pt-8 flex justify-end">
                  <button 
                    disabled={loading}
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20 focus:outline-none"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
