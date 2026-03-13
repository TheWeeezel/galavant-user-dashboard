import { config } from './config';

// --- Auth token management ---
let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${config.apiUrl}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchAuthJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }
  const res = await fetch(`${config.apiUrl}${path}`, { ...options, headers });
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
  nickname: string | null;
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

// --- Authenticated API types & functions ---

export interface UserProfile {
  id: string;
  walletAddress: string;
  nickname: string;
  avatarUrl: string | null;
  email: string | null;
  authProvider: string;
  displayName: string | null;
  totalDistance: number;
  totalSatEarned: number;
  totalActivities: number;
  hasGoogleLinked: boolean;
  linkedEmail: string | null;
  createdAt: string;
}

export interface AuthConnectResult {
  token: string;
  user: UserProfile;
}

export type GoogleAuthResult =
  | { status: 'authenticated'; token: string; user: UserProfile; walletAddress: string }
  | { status: 'needs_wallet'; googleClaimToken: string; googleEmail: string; googleDisplayName: string };

export interface SpendingWallet {
  pointsBalance: number;
  totalConverted: number;
}

export interface UserBike {
  id: string;
  tokenId: number | null;
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
  partSockets: PartSocket[];
  imageUrl: string | null;
  isEquipped: boolean;
  durability: number;
  hp: number;
}

export interface UserPart {
  id: string;
  type: string;
  level: number;
  socketedInBike: string | null;
  socketSlot: number | null;
}

export interface ReferralStats {
  referralCode: string;
  pending: number;
  completed: number;
  totalEarned: number;
}

export function connectWallet(walletAddress: string, publicKey?: string, mldsaPublicKey?: string) {
  return fetchAuthJson<AuthConnectResult>('/auth/connect', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, publicKey, mldsaPublicKey }),
  });
}

export function googleAuth(code: string) {
  return fetchAuthJson<GoogleAuthResult>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function fetchMe() {
  return fetchAuthJson<UserProfile>('/auth/me');
}

export function fetchSpendingWallet() {
  return fetchAuthJson<SpendingWallet>('/wallet/spending');
}

export function fetchUserBikes() {
  return fetchAuthJson<UserBike[]>('/bikes');
}

export function fetchUserParts() {
  return fetchAuthJson<UserPart[]>('/parts/inventory');
}

export function fetchReferralCode() {
  return fetchAuthJson<{ referralCode: string }>('/referrals/code');
}

export function fetchReferralStats() {
  return fetchAuthJson<ReferralStats>('/referrals/stats');
}

// --- Testing Tasks ---

export interface TestingTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  category: string;
  sortOrder: number;
  status: 'locked' | 'completed' | 'claimed';
}

export interface TestingTasksResponse {
  tasks: TestingTask[];
}

export function fetchTestingTasks() {
  return fetchAuthJson<TestingTasksResponse>('/tasks');
}

export function claimTestingTask(taskId: string) {
  return fetchAuthJson<{ reward: number }>(`/tasks/${taskId}/claim`, { method: 'POST' });
}
