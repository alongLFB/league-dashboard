'use client';

import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, Trash2, Globe, Tag, UserCircle, User, Lock, Pencil, X, Loader2, ChevronDown, AlertTriangle, Share2, ShieldCheck } from 'lucide-react';
import { deleteAccount, updateAccount } from '@/app/actions/accounts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ShareModal } from './ShareModal';

const REGIONS = [
  { value: 'NA', label: 'North America' },
  { value: 'ME', label: 'Middle East' },
  { value: 'EUW', label: 'Europe West' },
  { value: 'EUNE', label: 'Europe Nordic & East' },
  { value: 'OCE', label: 'Oceania' },
  { value: 'KR', label: 'Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'BR', label: 'Brazil' },
  { value: 'LAS', label: 'LAS' },
  { value: 'LAN', label: 'LAN' },
  { value: 'RU', label: 'Russia' },
  { value: 'TR', label: 'Türkiye' },
  { value: 'SEA', label: 'Southeast Asia' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'PBE', label: 'Public Beta' }
];

interface AccountCardProps {
  id: string;
  region: string;
  alias: string;
  summonerId: string;
  username: string;
  password?: string;
  isOwner?: boolean;
  ownerNickname?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function AccountCard({ 
  id, region, alias, summonerId, username, password, isOwner = true, ownerNickname,
  isSelectionMode = false, isSelected = false, onToggleSelect
}: AccountCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const tCard = useTranslations('Card');
  const tForm = useTranslations('Form');
  const tToast = useTranslations('Toast');
  const tVal = useTranslations('Validation');

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    region, alias, summonerId, username, password: password || ''
  });

  // Share State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await deleteAccount(id);
    toast.success(tToast('deleted'));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.summonerId.includes('#')) {
      setError(tVal('missingTag'));
      return;
    }

    setEditLoading(true);
    await updateAccount(id, formData);
    setEditLoading(false);
    toast.success(tToast('updated'));
    setIsEditing(false);
    setError(null);
    setEditShowPassword(false);
  };

  const openEdit = () => {
    setFormData({ region, alias, summonerId, username, password: password || '' });
    setIsEditing(true);
  };

  return (
    <>
      <div className={cn("group relative", isSelectionMode && "cursor-pointer")} onClick={() => {
        if (isSelectionMode && onToggleSelect) onToggleSelect();
      }}>
        <div className={cn(
          "absolute -inset-1 rounded-2xl blur-md transition duration-1000 animate-pulse pointer-events-none",
          isSelected 
            ? "bg-gradient-to-r from-blue-600 to-purple-600 opacity-60" 
            : "bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 opacity-20 group-hover:opacity-40"
        )} />
        
        <div className={cn(
          "relative rounded-2xl border bg-[#0d1117] p-6 shadow-2xl h-full flex flex-col transition-colors",
          isSelected ? "border-blue-500/50" : "border-gray-800"
        )}>
          {isSelectionMode && (
            <div className="absolute top-4 left-4 z-10">
              <div className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                isSelected ? "bg-blue-600 border-blue-500" : "bg-gray-900 border-gray-700 group-hover:border-gray-500"
              )}>
                {isSelected && <Check size={12} className="text-white" />}
              </div>
            </div>
          )}
          
          <div className={cn("flex flex-col gap-3 mb-6 relative", isSelectionMode ? "pl-8" : "")}>
            <div className="flex justify-between items-start">
              <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full inline-flex items-center gap-1.5">
                <Globe size={10} className="text-blue-400" />
                <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold whitespace-nowrap">
                  {region}
                </span>
              </div>
              
              {isOwner ? (
                <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 transition-opacity group-hover:opacity-100 shrink-0 -mt-2 -mr-2">
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2.5 rounded-full text-gray-500 hover:text-green-400 hover:bg-green-400/10 focus:outline-none transition-all"
                    title="Share"
                  >
                    <Share2 size={16} />
                  </button>
                  <button 
                    onClick={openEdit}
                    className="p-2.5 rounded-full text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 focus:outline-none transition-all"
                    title={tForm('editAccount')}
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-400/10 focus:outline-none transition-all"
                    title={tForm('deleteTitle')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-full inline-flex items-center gap-1.5 shrink-0">
                  <ShieldCheck size={12} className="text-green-400" />
                  <span className="text-[10px] text-green-300 font-bold">Shared by {ownerNickname}</span>
                </div>
              )}
            </div>

            <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400 flex items-center gap-2">
              <Tag size={16} className="text-gray-500 shrink-0" />
              <span className="truncate">{alias}</span>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
                <UserCircle size={12} /> {tCard('summonerId')}
              </span>
              <div 
                className="flex items-center justify-between cursor-pointer group/item p-2 -mx-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                onClick={() => handleCopy(summonerId, 'summonerId')}
              >
                <span className="text-sm text-gray-300 font-mono tracking-wide">{summonerId}</span>
                <div className="text-gray-600 transition-colors group-hover/item:text-purple-400">
                  {copiedField === 'summonerId' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
                <User size={12} /> {tCard('username')}
              </span>
              <div 
                className="flex items-center justify-between cursor-pointer group/item p-2 -mx-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                onClick={() => handleCopy(username, 'username')}
              >
                <span className="text-sm text-gray-300 font-mono tracking-wide">{username}</span>
                <div className="text-gray-600 transition-colors group-hover/item:text-purple-400">
                  {copiedField === 'username' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-800/80 mt-2">
              <div className="flex items-center justify-between px-2 -mx-2">
                <span className="text-[10px] font-bold text-gray-500 tracking-widest flex items-center gap-1.5">
                  <Lock size={12} /> {tCard('password')}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                  className="text-gray-600 hover:text-purple-400 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer group/item p-2 -mx-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                onClick={() => handleCopy(password || '', 'password')}
              >
                <span className={cn("text-sm font-mono tracking-widest", showPassword ? "text-gray-200" : "text-gray-600")}>
                  {showPassword ? password : '••••••••'}
                </span>
                <div className="text-gray-600 transition-colors group-hover/item:text-purple-400">
                  {copiedField === 'password' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isShareModalOpen && (
        <ShareModal 
          accountIds={[id]}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c]/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm">
            <div className="absolute -inset-1 bg-red-600/30 rounded-3xl blur-lg animate-pulse pointer-events-none" />
            
            <div className="bg-[#0d1117] border border-red-900/50 rounded-3xl p-8 relative shadow-2xl text-center">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              
              <h3 className="text-lg font-bold mb-2 tracking-wide text-white">{tForm('deleteTitle')}</h3>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                {tForm('deleteConfirm', { alias })}
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none"
                >
                  {tForm('cancel')}
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-red-600/80 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none"
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : tForm('delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c]/80 backdrop-blur-md">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-3xl blur-lg opacity-30 animate-pulse pointer-events-none" />
            
            <div className="bg-[#0d1117] border border-gray-800 rounded-3xl p-8 relative shadow-2xl">
              <button 
                onClick={() => { setIsEditing(false); setError(null); }}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors focus:outline-none bg-gray-900 p-2 rounded-full border border-gray-800"
              >
                <X size={16} />
              </button>
              <h3 className="text-xl font-bold mb-6 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                {tForm('editAccount')}
              </h3>
              
              {error && (
                <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-xs font-medium flex items-center gap-2">
                  <X size={14} className="shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="relative group">
                  <Globe size={14} className="absolute left-0 bottom-2.5 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                  <select 
                    required 
                    value={formData.region} 
                    onChange={e => setFormData({...formData, region: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 pb-2 pl-6 pr-6 text-sm tracking-wider text-gray-200 outline-none focus:border-purple-500 transition-colors cursor-pointer font-medium appearance-none"
                  >
                    {REGIONS.map(r => (
                      <option key={r.label} value={r.label} className="bg-gray-900 text-gray-200">{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 bottom-2.5 text-gray-500 pointer-events-none" />
                </div>
                
                <div className="relative group">
                  <Tag size={14} className="absolute left-0 bottom-2.5 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                  <input 
                    required placeholder={tForm('alias')} 
                    value={formData.alias} onChange={e => setFormData({...formData, alias: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 pb-2 pl-6 text-sm tracking-wider text-gray-200 outline-none focus:border-purple-500 transition-colors placeholder:text-gray-700 font-medium" 
                  />
                </div>
                
                <div className="relative group">
                  <UserCircle size={14} className="absolute left-0 bottom-2.5 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                  <input 
                    required placeholder={tForm('summonerId')} 
                    value={formData.summonerId} onChange={e => {
                      setFormData({...formData, summonerId: e.target.value});
                      if (error) setError(null);
                    }}
                    className="w-full bg-transparent border-b border-gray-800 pb-2 pl-6 text-sm tracking-wider text-gray-200 outline-none focus:border-purple-500 transition-colors placeholder:text-gray-700 font-mono" 
                  />
                </div>
                
                <div className="relative group">
                  <User size={14} className="absolute left-0 bottom-2.5 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                  <input 
                    required placeholder={tForm('username')} 
                    value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 pb-2 pl-6 text-sm tracking-wider text-gray-200 outline-none focus:border-purple-500 transition-colors placeholder:text-gray-700 font-mono" 
                  />
                </div>
                
                <div className="relative group">
                  <Lock size={14} className="absolute left-0 bottom-2.5 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                  <input 
                    required type={editShowPassword ? "text" : "password"} placeholder={tForm('password')} 
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-transparent border-b border-gray-800 pb-2 pl-6 pr-8 text-sm text-gray-200 outline-none focus:border-purple-500 transition-colors placeholder:text-gray-700 font-mono tracking-wider" 
                  />
                  <button 
                    type="button"
                    onClick={() => setEditShowPassword(!editShowPassword)}
                    className="absolute right-0 top-0 bottom-2 flex items-center text-gray-500 hover:text-purple-400 transition-colors focus:outline-none"
                  >
                    {editShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <div className="pt-8 flex justify-end">
                  <button 
                    disabled={editLoading}
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20 focus:outline-none"
                  >
                    {editLoading ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                    {tForm('update')}
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
