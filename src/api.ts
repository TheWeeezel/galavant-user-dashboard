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
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `API error: ${res.status}`);
  }
  return res.json();
}

export interface Stats {
  totalUsers: number;
  totalMintedNfts: number;
  totalDistance: number;
  totalSapEarned: number;
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
  totalSapEarned: number;
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
  sap: number;
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

// --- Bonus Claims ---

export interface BonusClaimStatus {
  eligible: boolean;
  claimed: boolean;
  bikeId?: string;
}

export function fetchBonusClaimStatus() {
  return fetchAuthJson<BonusClaimStatus>('/tasks/bonus-claim/status');
}

export function claimBonusBike(bikeType: string) {
  return fetchAuthJson<UserBike>('/tasks/bonus-claim', {
    method: 'POST',
    body: JSON.stringify({ bikeType }),
  });
}

// --- Social Rewards ---

export interface SocialRewardStatus {
  twitterLinked: boolean;
  twitterUsername?: string;
  followClaimed: boolean;
}

export interface SocialTweet {
  twitterId: string;
  content: string;
  postedAt: string;
  likes: number;
  retweets: number;
  likeClaimed: boolean;
  retweetClaimed: boolean;
}

export function fetchSocialStatus() {
  return fetchAuthJson<SocialRewardStatus>('/social/status');
}

export function linkTwitter(username: string) {
  return fetchAuthJson<{ success: boolean }>('/social/link-twitter', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export function fetchSocialTweets() {
  return fetchAuthJson<{ tweets: SocialTweet[] }>('/social/tweets');
}

export function claimFollow() {
  return fetchAuthJson<{ reward: number }>('/social/claim/follow', { method: 'POST' });
}

export function claimLike(twitterTweetId: string) {
  return fetchAuthJson<{ reward: number }>('/social/claim/like', {
    method: 'POST',
    body: JSON.stringify({ twitterTweetId }),
  });
}

export function claimRetweet(twitterTweetId: string) {
  return fetchAuthJson<{ reward: number }>('/social/claim/retweet', {
    method: 'POST',
    body: JSON.stringify({ twitterTweetId }),
  });
}

// --- Daily Missions ---

export interface MissionStreakData {
  streak: {
    currentStreak: number;
    longestStreak: number;
    currentTier: string;
    shieldsAvailable: number;
    totalMissionsCompleted: number;
    totalChestsClaimed: number;
  };
  currentTierConfig: { tier: string; label: string; minDays: number };
  nextTierConfig: { tier: string; label: string; minDays: number } | null;
  daysUntilNextTier: number | null;
}

export interface MissionsTodayData {
  date: string;
  missions: Array<{
    id: string;
    slot: number;
    template: string;
    category: string;
    featured: boolean;
    targetValue: number;
    description: string;
    progress: number;
    completed: boolean;
  }>;
  chestClaimed: boolean;
  resetAtUtc: string;
}

export function fetchMissionStreak(): Promise<MissionStreakData> {
  return fetchAuthJson<MissionStreakData>('/missions/streak');
}

export function fetchMissionsToday(): Promise<MissionsTodayData> {
  return fetchAuthJson<MissionsTodayData>('/missions/today');
}

// --- Wallet (on-chain) ---

export interface MainWallet {
  address: string;
  satTokenBalance: string;
  btcBalance: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  currency: string;
  amount: number;
  direction: string;
  onChainTxId: string | null;
  createdAt: string;
}

export function fetchMainWallet() {
  return fetchAuthJson<MainWallet>('/wallet/main');
}

export function fetchWalletNfts() {
  return fetchAuthJson<{ bikes: UserBike[] }>('/wallet/nfts');
}

export function fetchWalletTransactions() {
  return fetchAuthJson<WalletTransaction[]>('/wallet/transactions');
}

// --- Swap (BTC <-> SAT) ---

export interface SignedTx {
  fundingTx: string | null;
  interactionTx: string;
}

export interface SwapQuote {
  poolAvailable: boolean;
  tokensOut?: string;
  requiredSatoshis?: string;
  price?: string;
  scale?: string;
  minimumReceived?: string;
  reservationBaseFee?: string;
}

export interface SwapLiquidity {
  satReserve: string;
  btcReserve: string;
  totalLP: string;
  reservedLiquidity?: string;
  reservationFee?: string;
  btcPriceUsd?: number | null;
}

export interface SwapOrder {
  id: string;
  userId: string;
  status: string;
  satoshisIn: string;
  expectedTokensOut: string;
  minimumTokensOut: string;
  reserveTxHash: string | null;
  swapTxHash: string | null;
  error?: string;
  createdAt: number;
}

export interface SellOrder {
  id: string;
  userId: string;
  status: string;
  tokensListed: string;
  btcReceiver: string;
  approveTxHash: string | null;
  listTxHash: string | null;
  cancelTxHash: string | null;
  error?: string;
  createdAt: number;
}

export interface PrepareResponse {
  prepareId: string;
  offlineBuffer: string;
  maxSatToSpend: string;
  feeRate: number;
  refundAddress: string;
  extraOutputs?: Array<{ address: string; value: string }>;
}

export function swapPreflight() {
  return fetchAuthJson<{ ready: boolean; reason?: string }>('/swap/preflight');
}

export function getSwapQuote(satoshisIn: string, slippageBps?: number) {
  const params = new URLSearchParams({ satoshisIn });
  if (slippageBps !== undefined) params.set('slippageBps', String(slippageBps));
  return fetchAuthJson<SwapQuote>(`/swap/quote?${params}`);
}

export function getSwapLiquidity() {
  return fetchAuthJson<SwapLiquidity>('/swap/liquidity');
}

export function getSwapOrders() {
  return fetchAuthJson<SwapOrder[]>('/swap/orders');
}

export function getSwapOrder(id: string) {
  return fetchAuthJson<SwapOrder>(`/swap/orders/${id}`);
}

export function reserveSwapPrepare(satoshisIn: string, slippageBps?: number) {
  return fetchAuthJson<PrepareResponse>('/swap/reserve/prepare', {
    method: 'POST',
    body: JSON.stringify({ satoshisIn, slippageBps }),
  });
}

export function reserveSwapSubmit(prepareId: string, signedTx: SignedTx) {
  return fetchAuthJson<{ orderId: string; status: string; reserveTxHash: string }>('/swap/reserve/submit', {
    method: 'POST',
    body: JSON.stringify({ prepareId, signedTx }),
  });
}

export function executeSwapPrepare(orderId: string) {
  return fetchAuthJson<PrepareResponse>('/swap/execute/prepare', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export function executeSwapSubmit(prepareId: string, signedTx: SignedTx) {
  return fetchAuthJson<{ swapTxHash: string; tokensReceived: string }>('/swap/execute/submit', {
    method: 'POST',
    body: JSON.stringify({ prepareId, signedTx }),
  });
}

// Sell (SAT -> BTC)

export function getSellOrders() {
  return fetchAuthJson<SellOrder[]>('/swap/sell/orders');
}

export function getSellOrder(id: string) {
  return fetchAuthJson<SellOrder>(`/swap/sell/orders/${id}`);
}

export function getSellListingStatus() {
  return fetchAuthJson<{ hasListing: boolean; liquidity?: string; reserved?: string; btcReceiver?: string; isActive?: boolean }>('/swap/sell/status');
}

export function sellSatPrepare(tokenAmount: string) {
  return fetchAuthJson<PrepareResponse & { sellOrderId: string; phase: 'approve' | 'list' }>('/swap/sell/prepare', {
    method: 'POST',
    body: JSON.stringify({ tokenAmount }),
  });
}

export function sellSatSubmit(prepareId: string, signedTx: SignedTx) {
  return fetchAuthJson<{ sellOrderId: string; status: string; listTxHash: string | null; approveTxHash: string | null }>('/swap/sell/submit', {
    method: 'POST',
    body: JSON.stringify({ prepareId, signedTx }),
  });
}

export function retrySellPrepare(sellOrderId: string) {
  return fetchAuthJson<PrepareResponse>('/swap/sell/retry/prepare', {
    method: 'POST',
    body: JSON.stringify({ sellOrderId }),
  });
}

export function retrySellSubmit(prepareId: string, signedTx: SignedTx) {
  return fetchAuthJson<{ status: string; listTxHash: string }>('/swap/sell/retry/submit', {
    method: 'POST',
    body: JSON.stringify({ prepareId, signedTx }),
  });
}

export function cancelSellPrepare(sellOrderId: string) {
  return fetchAuthJson<PrepareResponse>('/swap/sell/cancel/prepare', {
    method: 'POST',
    body: JSON.stringify({ sellOrderId }),
  });
}

export function cancelSellSubmit(prepareId: string, signedTx: SignedTx) {
  return fetchAuthJson<{ cancelTxHash: string }>('/swap/sell/cancel/submit', {
    method: 'POST',
    body: JSON.stringify({ prepareId, signedTx }),
  });
}

// --- Convert (SAP <-> SAT) ---

export interface ConversionPreview {
  pointsAmount: number;
  expectedTokens: string;
  difficultyMultiplier: number;
  conversionRate: number;
  poolUsedPercent: number;
}

export interface ConversionResult {
  pointsDebited: number;
  tokensReceived: string;
  txHash: string;
}

export interface ConversionPool {
  totalConverted: string;
  maxConvertible: string;
  remaining: string;
  usedPercent: number;
}

export interface ConversionTransaction {
  id: string;
  type: string;
  currency: string;
  amount: number;
  direction: string;
  onChainTxId: string | null;
  createdAt: string;
}

export function previewConversion(pointsAmount: number) {
  return fetchAuthJson<ConversionPreview>('/convert/preview', {
    method: 'POST',
    body: JSON.stringify({ pointsAmount }),
  });
}

export function executeConversion(pointsAmount: number) {
  return fetchAuthJson<ConversionResult>('/convert/execute', {
    method: 'POST',
    body: JSON.stringify({ pointsAmount }),
  });
}

export function fetchConversionPool() {
  return fetchAuthJson<ConversionPool>('/convert/pool');
}

export function fetchConversionHistory() {
  return fetchAuthJson<ConversionTransaction[]>('/convert/history');
}

export function depositTokensPrepare(amount: string) {
  return fetchAuthJson<PrepareResponse>('/convert/deposit/prepare', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export function depositTokensSubmit(prepareId: string, signedTx: SignedTx) {
  return fetchAuthJson<{ pointsCredited: number; tokensDeposited: string; txHash: string }>('/convert/deposit/submit', {
    method: 'POST',
    body: JSON.stringify({ prepareId, signedTx }),
  });
}

// --- Staking ---

export interface StakeInfo {
  id: string;
  type: string;
  amount: number;
  lockPeriod: number;
  status: string;
  startedAt: string;
  endsAt: string;
}

export interface StakingData {
  stakes: StakeInfo[];
  totalPower: number;
  effectivePower: number;
  earningBoost: number;
  earningBoostPercent: number;
  energyBonus: number;
}

export function fetchStaking() {
  return fetchAuthJson<StakingData>('/staking');
}

export function createStake(type: string, amount: number, lockPeriod: number) {
  return fetchAuthJson<{ stakeId: string }>('/staking/create', {
    method: 'POST',
    body: JSON.stringify({ type, amount, lockPeriod }),
  });
}

export function unstake(stakeId: string) {
  return fetchAuthJson<{ returned: number; penalty: number }>(`/staking/${stakeId}/unstake`, {
    method: 'POST',
  });
}

// --- Blockchain / NFT ---

export function mintBikeNft(bikeId: string) {
  return fetchAuthJson<{ tokenId: string; txHash: string; imageUrl: string }>('/blockchain/mint-bike', {
    method: 'POST',
    body: JSON.stringify({ bikeId }),
  });
}

export function importBikeNft(tokenId: number) {
  return fetchAuthJson<{ bike: UserBike; txHash: string }>('/blockchain/import-bike', {
    method: 'POST',
    body: JSON.stringify({ tokenId }),
  });
}

// --- Marketplace mutations ---

export function createListing(itemType: string, itemId: string, priceSatoshis: number) {
  return fetchAuthJson<MarketplaceListing>('/marketplace', {
    method: 'POST',
    body: JSON.stringify({ itemType, itemId, priceSatoshis }),
  });
}

export function buyListing(id: string) {
  return fetchAuthJson<{ success: boolean }>(`/marketplace/${id}/buy`, {
    method: 'POST',
  });
}

export function cancelListing(id: string) {
  return fetchAuthJson<{ success: boolean }>(`/marketplace/${id}/cancel`, {
    method: 'POST',
  });
}

export function getMyListings() {
  return fetchAuthJson<MarketplaceListing[]>('/marketplace/my');
}

export function getListingDetail(id: string) {
  return fetchAuthJson<MarketplaceListing>(`/marketplace/${id}`);
}
