'use client';

import { useState } from 'react';
import { 
  Check, Copy, Eye, EyeOff, Trash2, Globe, Tag, UserCircle, User, Lock, 
  Pencil, X, Loader2, ChevronDown, AlertTriangle, Share2, ShieldCheck, 
  RotateCw, Trophy 
} from 'lucide-react';
import { deleteAccount, updateAccount, refreshAccountRank } from '@/app/actions/accounts';
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
  isShared?: boolean;
  ownerNickname?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  soloTier?: string | null;
  soloRank?: string | null;
  soloLp?: number | null;
  soloWins?: number | null;
  soloLosses?: number | null;
  flexTier?: string | null;
  flexRank?: string | null;
  flexLp?: number | null;
  flexWins?: number | null;
  flexLosses?: number | null;
  rankUpdatedAt?: string | null;
}

function getTierStyle(tier?: string | null) {
  if (!tier) {
    return {
      badge: 'text-gray-400 bg-gray-900/60 border-gray-800/80',
      dot: 'bg-gray-500',
    };
  }
  const t = tier.toUpperCase();
  switch (t) {
    case 'CHALLENGER':
      return {
        badge: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
        dot: 'bg-amber-400',
      };
    case 'GRANDMASTER':
      return {
        badge: 'text-red-400 bg-red-500/15 border-red-500/40',
        dot: 'bg-red-400',
      };
    case 'MASTER':
      return {
        badge: 'text-purple-400 bg-purple-500/15 border-purple-500/40',
        dot: 'bg-purple-400',
      };
    case 'DIAMOND':
      return {
        badge: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40',
        dot: 'bg-cyan-400',
      };
    case 'EMERALD':
      return {
        badge: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
        dot: 'bg-emerald-400',
      };
    case 'PLATINUM':
      return {
        badge: 'text-teal-300 bg-teal-500/15 border-teal-500/40',
        dot: 'bg-teal-400',
      };
    case 'GOLD':
      return {
        badge: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/40',
        dot: 'bg-yellow-400',
      };
    case 'SILVER':
      return {
        badge: 'text-slate-300 bg-slate-500/15 border-slate-500/40',
        dot: 'bg-slate-400',
      };
    case 'BRONZE':
      return {
        badge: 'text-amber-600 bg-amber-900/20 border-amber-700/40',
        dot: 'bg-amber-600',
      };
    case 'IRON':
      return {
        badge: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40',
        dot: 'bg-zinc-400',
      };
    default:
      return {
        badge: 'text-gray-400 bg-gray-900/60 border-gray-800/80',
        dot: 'bg-gray-500',
      };
  }
}

const VALID_TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER', 'UNRANKED'] as const;

export function AccountCard({ 
  id, region, alias, summonerId, username, password, isOwner = true, isShared = false, ownerNickname,
  isSelectionMode = false, isSelected = false, onToggleSelect,
  soloTier, soloRank, soloLp, soloWins, soloLosses,
  flexTier, flexRank, flexLp, flexWins, flexLosses,
  rankUpdatedAt
}: AccountCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const tCard = useTranslations('Card');
  const tTier = useTranslations('Tiers');
  const tForm = useTranslations('Form');
  const tToast = useTranslations('Toast');
  const tVal = useTranslations('Validation');

  const formatRankDisplay = (
    tier?: string | null,
    rank?: string | null,
    lp?: number | null,
  ) => {
    if (!tier) return tTier('UNRANKED');
    const t = tier.toUpperCase();
    const localizedTier = (VALID_TIERS as readonly string[]).includes(t) ? tTier(t as any) : tier;
    if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(t)) {
      return `${localizedTier} ${lp !== null && lp !== undefined ? `${lp} LP` : ''}`.trim();
    }
    return `${localizedTier} ${rank || ''} ${lp !== null && lp !== undefined ? `${lp} LP` : ''}`.trim();
  };

  // Rank States
  const [soloTierState, setSoloTierState] = useState(soloTier);
  const [soloRankState, setSoloRankState] = useState(soloRank);
  const [soloLpState, setSoloLpState] = useState(soloLp);
  const [soloWinsState, setSoloWinsState] = useState(soloWins);
  const [soloLossesState, setSoloLossesState] = useState(soloLosses);

  const [flexTierState, setFlexTierState] = useState(flexTier);
  const [flexRankState, setFlexRankState] = useState(flexRank);
  const [flexLpState, setFlexLpState] = useState(flexLp);
  const [flexWinsState, setFlexWinsState] = useState(flexWins);
  const [flexLossesState, setFlexLossesState] = useState(flexLosses);

  const [rankUpdatedAtState, setRankUpdatedAtState] = useState(rankUpdatedAt);
  const [isRefreshingRank, setIsRefreshingRank] = useState(false);

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

  const handleCopy = async (e: React.MouseEvent, text: string, field: string, label?: string) => {
    e.stopPropagation();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(label ? tCard('fieldCopied', { field: label }) : tToast('copied'));
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleCopyAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = tCard('shareText', {
      region,
      summonerId,
      username,
      password: password || tCard('decryptError')
    });
    await navigator.clipboard.writeText(text);
    setCopiedField('all');
    toast.success(tToast('copied'));
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleRefreshRank = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshingRank(true);
    try {
      const res = await refreshAccountRank(id);
      if (res.success) {
        setSoloTierState(res.solo?.tier ?? null);
        setSoloRankState(res.solo?.rank ?? null);
        setSoloLpState(res.solo?.lp ?? null);
        setSoloWinsState(res.solo?.wins ?? null);
        setSoloLossesState(res.solo?.losses ?? null);

        setFlexTierState(res.flex?.tier ?? null);
        setFlexRankState(res.flex?.rank ?? null);
        setFlexLpState(res.flex?.lp ?? null);
        setFlexWinsState(res.flex?.wins ?? null);
        setFlexLossesState(res.flex?.losses ?? null);

        setRankUpdatedAtState(res.updatedAt || new Date().toISOString());
        toast.success(tCard('rankUpdateSuccess'));
      } else {
        if (res.error === 'RIOT_API_KEY_MISSING') {
          toast.error(tCard('apiKeyMissing'));
        } else if (res.error === 'RIOT_API_KEY_INVALID') {
          toast.error(tCard('apiKeyInvalid'));
        } else if (res.error === 'SUMMONER_NOT_FOUND') {
          toast.error(tCard('summonerNotFound'));
        } else {
          toast.error(tCard('rankUpdateFailed'));
        }
      }
    } catch {
      toast.error(tCard('rankUpdateFailed'));
    } finally {
      setIsRefreshingRank(false);
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return tCard('neverUpdated');
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return tCard('neverUpdated');
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return tCard('justNow');
      if (diffMinutes < 60) return `${diffMinutes}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch {
      return tCard('neverUpdated');
    }
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

  const soloColor = getTierStyle(soloTierState);
  const flexColor = getTierStyle(flexTierState);

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
          "relative rounded-2xl border bg-[#0d1117] p-6 shadow-2xl h-full flex flex-col justify-between transition-colors",
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
          
          {/* Header Bar: Region & Action Buttons */}
          <div className={cn("flex flex-col gap-3 mb-5 relative", isSelectionMode ? "pl-8" : "")}>
            <div className="flex justify-between items-start">
              <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full inline-flex items-center gap-1.5">
                <Globe size={10} className="text-blue-400" />
                <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold whitespace-nowrap">
                  {region}
                </span>
              </div>
              
              <div className="flex items-center gap-0.5 shrink-0 -mt-2 -mr-2">
                <button 
                  onClick={handleCopyAll}
                  className="p-2.5 rounded-full text-gray-500 hover:text-purple-400 hover:bg-purple-400/10 focus:outline-none transition-all"
                  title={tCard('copyAllTitle')}
                >
                  {copiedField === 'all' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
                
                {isOwner ? (
                  <>
                    <button 
                      onClick={() => setIsShareModalOpen(true)}
                      className="p-2.5 rounded-full text-gray-500 hover:text-green-400 hover:bg-green-400/10 focus:outline-none transition-all lg:opacity-0 group-hover:opacity-100"
                      title={tCard('shareBtn')}
                    >
                      <Share2 size={16} />
                    </button>
                    <button 
                      onClick={openEdit}
                      className="p-2.5 rounded-full text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 focus:outline-none transition-all lg:opacity-0 group-hover:opacity-100"
                      title={tForm('editAccount')}
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-400/10 focus:outline-none transition-all lg:opacity-0 group-hover:opacity-100"
                      title={tForm('deleteTitle')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <div className="px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-full inline-flex items-center gap-1.5 shrink-0 ml-1">
                    <ShieldCheck size={12} className="text-green-400" />
                    <span className="text-[10px] text-green-300 font-bold">{tCard('sharedBy', { nickname: ownerNickname || '' })}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400 flex items-center gap-2">
              <Tag size={16} className="text-gray-500 shrink-0" />
              <span className="truncate">{alias}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            {/* 上半部分 (横线上方): 用户名 与 密码 */}
            <div className="space-y-3">
              {/* 用户名 */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-500 tracking-widest flex items-center gap-1.5 uppercase">
                  <User size={12} /> {tCard('username')}
                </span>
                <div 
                  className="flex items-center justify-between cursor-pointer group/item p-2 -mx-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                  onClick={(e) => handleCopy(e, username, 'username', tCard('username'))}
                >
                  <span className="text-sm text-gray-300 font-mono tracking-wide">{username}</span>
                  <div className="text-gray-600 transition-colors group-hover/item:text-purple-400">
                    {copiedField === 'username' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </div>
                </div>
              </div>

              {/* 密码 */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-2 -mx-2">
                  <span className="text-[10px] font-bold text-gray-500 tracking-widest flex items-center gap-1.5 uppercase">
                    <Lock size={12} /> {tCard('password')}
                  </span>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                    className="text-gray-600 hover:text-purple-400 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer group/item p-2 -mx-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                  onClick={(e) => handleCopy(e, password || tCard('decryptError'), 'password', tCard('password'))}
                >
                  <span className={cn("text-sm font-mono tracking-widest", showPassword ? "text-gray-200" : "text-gray-600")}>
                    {showPassword ? (password || tCard('decryptError')) : '••••••••'}
                  </span>
                  <div className="text-gray-600 transition-colors group-hover/item:text-purple-400">
                    {copiedField === 'password' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </div>
                </div>
              </div>
            </div>

            {/* 分割线 */}
            <div className="border-t border-gray-800/80 my-3.5" />

            {/* 下半部分 (横线下方): 召唤师名称 与 段位信息 */}
            <div className="space-y-3.5">
              {/* 召唤师名称 */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-500 tracking-widest flex items-center gap-1.5 uppercase">
                  <UserCircle size={12} /> {tCard('summonerId')}
                </span>
                <div 
                  className="flex items-center justify-between cursor-pointer group/item p-2 -mx-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                  onClick={(e) => handleCopy(e, summonerId, 'summonerId', tCard('summonerId'))}
                >
                  <span className="text-sm text-purple-300 font-mono font-medium tracking-wide">{summonerId}</span>
                  <div className="text-gray-600 transition-colors group-hover/item:text-purple-400">
                    {copiedField === 'summonerId' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </div>
                </div>
              </div>

              {/* 段位信息卡片 */}
              <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-2.5 flex flex-col gap-2">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                    <Trophy size={12} className="text-purple-400" />
                    <span>{tCard('rankTitle')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span>{tCard('lastUpdated')}</span>
                      <span className="font-mono text-gray-400">
                        {formatTime(rankUpdatedAtState)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshRank}
                      disabled={isRefreshingRank}
                      title={tCard('refreshRank')}
                      className="p-1 rounded-md text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                    >
                      <RotateCw size={12} className={cn(isRefreshingRank && "animate-spin text-purple-400")} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* 单双排 */}
                  <div className={cn("p-2 rounded-lg border flex flex-col gap-0.5", soloColor.badge)}>
                    <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-wider opacity-75">
                      <span>{tCard('soloDuo')}</span>
                      <span className={cn("w-1.5 h-1.5 rounded-full", soloColor.dot)} />
                    </div>
                    <div className="text-xs font-bold font-mono truncate">
                      {formatRankDisplay(soloTierState, soloRankState, soloLpState)}
                    </div>
                    {soloWinsState !== null && soloWinsState !== undefined && (
                      <div className="text-[9px] opacity-60 font-mono">
                        {soloWinsState}W {soloLossesState || 0}L
                      </div>
                    )}
                  </div>

                  {/* 灵活组排 */}
                  <div className={cn("p-2 rounded-lg border flex flex-col gap-0.5", flexColor.badge)}>
                    <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-wider opacity-75">
                      <span>{tCard('flex')}</span>
                      <span className={cn("w-1.5 h-1.5 rounded-full", flexColor.dot)} />
                    </div>
                    <div className="text-xs font-bold font-mono truncate">
                      {formatRankDisplay(flexTierState, flexRankState, flexLpState)}
                    </div>
                    {flexWinsState !== null && flexWinsState !== undefined && (
                      <div className="text-[9px] opacity-60 font-mono">
                        {flexWinsState}W {flexLossesState || 0}L
                      </div>
                    )}
                  </div>
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
