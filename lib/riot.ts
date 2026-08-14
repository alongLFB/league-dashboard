/**
 * Riot Games API Service for League of Legends Summoner & Ranked Information
 */

export interface RankDetail {
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
}

export interface SummonerRankResult {
  success: boolean;
  error?: string;
  solo?: RankDetail;
  flex?: RankDetail;
  updatedAt?: string;
}

interface RegionRoute {
  platform: string;
  regional: string;
}

const REGION_ROUTING: Record<string, RegionRoute> = {
  // NA
  na: { platform: 'na1', regional: 'americas' },
  'north america': { platform: 'na1', regional: 'americas' },
  na1: { platform: 'na1', regional: 'americas' },
  // EUW
  euw: { platform: 'euw1', regional: 'europe' },
  'europe west': { platform: 'euw1', regional: 'europe' },
  euw1: { platform: 'euw1', regional: 'europe' },
  // EUNE
  eune: { platform: 'eun1', regional: 'europe' },
  'europe nordic & east': { platform: 'eun1', regional: 'europe' },
  eun1: { platform: 'eun1', regional: 'europe' },
  // KR
  kr: { platform: 'kr', regional: 'asia' },
  korea: { platform: 'kr', regional: 'asia' },
  // JP
  jp: { platform: 'jp1', regional: 'asia' },
  japan: { platform: 'jp1', regional: 'asia' },
  jp1: { platform: 'jp1', regional: 'asia' },
  // BR
  br: { platform: 'br1', regional: 'americas' },
  brazil: { platform: 'br1', regional: 'americas' },
  br1: { platform: 'br1', regional: 'americas' },
  // LAN
  lan: { platform: 'la1', regional: 'americas' },
  la1: { platform: 'la1', regional: 'americas' },
  // LAS
  las: { platform: 'la2', regional: 'americas' },
  la2: { platform: 'la2', regional: 'americas' },
  // OCE
  oce: { platform: 'oc1', regional: 'sea' },
  oceania: { platform: 'oc1', regional: 'sea' },
  oc1: { platform: 'oc1', regional: 'sea' },
  // RU
  ru: { platform: 'ru', regional: 'europe' },
  russia: { platform: 'ru', regional: 'europe' },
  // TR
  tr: { platform: 'tr1', regional: 'europe' },
  türkiye: { platform: 'tr1', regional: 'europe' },
  turkey: { platform: 'tr1', regional: 'europe' },
  tr1: { platform: 'tr1', regional: 'europe' },
  // ME
  me: { platform: 'me1', regional: 'europe' },
  'middle east': { platform: 'me1', regional: 'europe' },
  me1: { platform: 'me1', regional: 'europe' },
  // TW
  tw: { platform: 'tw2', regional: 'sea' },
  taiwan: { platform: 'tw2', regional: 'sea' },
  tw2: { platform: 'tw2', regional: 'sea' },
  // VN
  vn: { platform: 'vn2', regional: 'sea' },
  vietnam: { platform: 'vn2', regional: 'sea' },
  vn2: { platform: 'vn2', regional: 'sea' },
  // SEA
  sea: { platform: 'sg2', regional: 'sea' },
  'southeast asia': { platform: 'sg2', regional: 'sea' },
  sg2: { platform: 'sg2', regional: 'sea' },
  // PBE
  pbe: { platform: 'pbe1', regional: 'americas' },
  'public beta': { platform: 'pbe1', regional: 'americas' },
  pbe1: { platform: 'pbe1', regional: 'americas' },
};

function getRouting(regionStr: string): RegionRoute {
  const key = (regionStr || '').trim().toLowerCase();
  return REGION_ROUTING[key] || { platform: 'na1', regional: 'americas' };
}

interface AccountDto {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface SummonerDto {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

interface LeagueEntryDto {
  leagueId?: string;
  summonerId?: string;
  puuid?: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran?: boolean;
  inactive?: boolean;
  freshBlood?: boolean;
  hotStreak?: boolean;
}

/**
 * Fetch rank info from Riot Games API by Riot ID (GameName#TagLine) and Region.
 */
export async function fetchSummonerRank(
  region: string,
  summonerRiotId: string
): Promise<SummonerRankResult> {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'RIOT_API_KEY_MISSING',
    };
  }

  if (!summonerRiotId || !summonerRiotId.includes('#')) {
    return {
      success: false,
      error: 'INVALID_RIOT_ID',
    };
  }

  const [gameName, ...tagParts] = summonerRiotId.split('#');
  const tagLine = tagParts.join('#');

  if (!gameName || !tagLine) {
    return {
      success: false,
      error: 'INVALID_RIOT_ID',
    };
  }

  const route = getRouting(region);
  const regionalClusters = Array.from(
    new Set([route.regional, 'americas', 'europe', 'asia', 'sea'])
  );

  let puuid: string | null = null;

  // Step 1: Query Account-v1 to find PUUID
  for (const cluster of regionalClusters) {
    try {
      const url = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        gameName.trim()
      )}/${encodeURIComponent(tagLine.trim())}`;

      const res = await fetch(url, {
        headers: { 'X-Riot-Token': apiKey },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = (await res.json()) as AccountDto;
        if (data && data.puuid) {
          puuid = data.puuid;
          break;
        }
      } else if (res.status === 403 || res.status === 401) {
        return {
          success: false,
          error: 'RIOT_API_KEY_INVALID',
        };
      }
    } catch {
      // Continue trying other clusters
    }
  }

  if (!puuid) {
    return {
      success: false,
      error: 'SUMMONER_NOT_FOUND',
    };
  }

  // Step 2: Fetch Summoner ID via Summoner-v4
  let summonerId: string | null = null;
  try {
    const summonerUrl = `https://${route.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const sumRes = await fetch(summonerUrl, {
      headers: { 'X-Riot-Token': apiKey },
      cache: 'no-store',
    });

    if (sumRes.ok) {
      const sumData = (await sumRes.json()) as SummonerDto;
      summonerId = sumData.id;
    }
  } catch {
    // Summoner-v4 error
  }

  // Step 3: Fetch League Entries via League-v4
  let entries: LeagueEntryDto[] = [];

  // Try by-summoner if summonerId was found
  if (summonerId) {
    try {
      const leagueUrl = `https://${route.platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(
        summonerId
      )}`;
      const leagueRes = await fetch(leagueUrl, {
        headers: { 'X-Riot-Token': apiKey },
        cache: 'no-store',
      });

      if (leagueRes.ok) {
        entries = (await leagueRes.json()) as LeagueEntryDto[];
      }
    } catch {
      // Ignore and fallback to by-puuid
    }
  }

  // Fallback: try /lol/league/v4/entries/by-puuid/{puuid} if entries are still empty
  if (!entries || entries.length === 0) {
    try {
      const leaguePuuidUrl = `https://${route.platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
      const leagueRes = await fetch(leaguePuuidUrl, {
        headers: { 'X-Riot-Token': apiKey },
        cache: 'no-store',
      });
      if (leagueRes.ok) {
        entries = (await leagueRes.json()) as LeagueEntryDto[];
      }
    } catch {
      // League entries query failed
    }
  }

  let solo: RankDetail | undefined = undefined;
  let flex: RankDetail | undefined = undefined;

  if (Array.isArray(entries)) {
    for (const entry of entries) {
      if (entry.queueType === 'RANKED_SOLO_5x5') {
        solo = {
          tier: entry.tier,
          rank: entry.rank,
          lp: entry.leaguePoints,
          wins: entry.wins,
          losses: entry.losses,
        };
      } else if (entry.queueType === 'RANKED_FLEX_SR') {
        flex = {
          tier: entry.tier,
          rank: entry.rank,
          lp: entry.leaguePoints,
          wins: entry.wins,
          losses: entry.losses,
        };
      }
    }
  }

  return {
    success: true,
    solo,
    flex,
    updatedAt: new Date().toISOString(),
  };
}
