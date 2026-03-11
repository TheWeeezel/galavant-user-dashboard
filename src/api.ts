import { config } from './config';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${config.apiUrl}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Stats {
  totalUsers: number;
  totalMintedNfts: number;
  totalDistance: number;
  totalSatEarned: number;
  totalActivities: number;
  avgDistancePerActivity: number;
  // Marketplace
  activeListings: number;
  totalSold: number;
  totalVolume: number;
  avgListingPrice: number;
  floorPrice: number;
  // Economy
  economyHealthScore: number;
  economyState: string;
}

export interface PartSocket {
  slot: number;
  type: string;
  unlocked: boolean;
  partId: string | null;
}

export interface MintedNft {
  id: string;
  tokenId: number;
  type: string;
  quality: string;
  level: number;
  baseEarning: number;
  baseLuck: number;
  baseRecovery: number;
  baseDurability: number;
  addedEarning: number;
  addedLuck: number;
  addedRecovery: number;
  addedDurability: number;
  mintCount: number;
  partSockets: PartSocket[];
  imageUrl: string | null;
  ownerId: string;
}

export interface MintedNftDetail extends MintedNft {
  maxMints: number;
  durability: number;
  hp: number;
}

export interface NftsResponse {
  nfts: MintedNft[];
  total: number;
  page: number;
  totalPages: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  value: number;
}

export function fetchStats() {
  return fetchJson<Stats>('/explorer/stats');
}

export function fetchNfts(page = 1, limit = 12, filters?: { quality?: string; type?: string }) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.quality) params.set('quality', filters.quality);
  if (filters?.type) params.set('type', filters.type);
  return fetchJson<NftsResponse>(`/explorer/nfts?${params}`);
}

export function fetchNftDetail(id: string) {
  return fetchJson<MintedNftDetail>(`/explorer/nfts/${id}`);
}

export function fetchLeaderboard(metric: 'distance' | 'earnings' = 'distance', period: 'daily' | 'weekly' | 'all_time' = 'all_time') {
  return fetchJson<LeaderboardEntry[]>(`/explorer/leaderboard?metric=${metric}&period=${period}`);
}

export interface MarketplaceItem {
  type?: string;
  quality?: string;
  level?: number;
  imageUrl?: string | null;
  name?: string;
  baseEarning?: number;
  addedEarning?: number;
  baseLuck?: number;
  addedLuck?: number;
  baseRecovery?: number;
  addedRecovery?: number;
  baseDurability?: number;
  addedDurability?: number;
}

export interface MarketplaceListing {
  id: string;
  itemType: string;
  itemId: string;
  priceSatoshis: number;
  createdAt: string;
  sellerName: string | null;
  item: MarketplaceItem | null;
}

export interface MarketplaceResponse {
  listings: MarketplaceListing[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MarketplaceFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  itemType?: string;
  quality?: string;
  bikeType?: string;
  partType?: string;
  partLevel?: number;
  minPrice?: number;
  maxPrice?: number;
}

export function fetchMarketplace(filters: MarketplaceFilters = {}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 12));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.itemType) params.set('itemType', filters.itemType);
  if (filters.quality) params.set('quality', filters.quality);
  if (filters.bikeType) params.set('bikeType', filters.bikeType);
  if (filters.partType) params.set('partType', filters.partType);
  if (filters.partLevel !== undefined) params.set('partLevel', String(filters.partLevel));
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  return fetchJson<MarketplaceResponse>(`/explorer/marketplace?${params}`);
}
