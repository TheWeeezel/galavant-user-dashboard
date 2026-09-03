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
    throw new Error(body?.message ?? body?.error ?? `API error: ${res.status}`);
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

export interface MintedNftDetail extends Omit<MintedNft, 'tokenId'> {
  tokenId: number | null;
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

// --- Guide params (public, for gameplay guide) ---

/**
 * Mirrors what `/economy/guide-params` actually returns. Four fields were removed from the
 * server's response on 2026-08-30 by owner decision — verbatim: "no gameplay metrics publishing
 * which helps player perfect against the algorithm." They were baseEarningRateCommon,
 * hpDecayPerMinute, durabilityDecayPerMinute and toolboxBaseDropChance, and each was the exact
 * exchange rate for one attribute, which is what lets a player optimise a build on paper instead
 * of playing. Declaring them here again would be worse than useless: the fetch would type-check
 * while handing every reader `undefined`, so keep this shape honest to the endpoint.
 */
export interface GuideParams {
  maxEnergyCap: number;
  energyRegenPercent: number;
  energyRegenIntervalHours: number;
  fullRechargeHours: number;
  platformTaxPercent: number;
}

export function fetchGuideParams() {
  return fetchJson<GuideParams>('/economy/guide-params');
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
  /** True while the bike sits on the market — in either shop; both share `bikes.isListed`. */
  isListed: boolean;
  durability: number;
  hp: number;
  /**
   * True for the ~2h a fresh mint needs to finalise on chain. The server owns this rule; do not
   * recompute it here from a timestamp, or this panel will disagree with the server that
   * actually accepts the listing.
   */
  settling: boolean;
}

export interface UserPart {
  id: string;
  type: string;
  level: number;
  socketedInBike: string | null;
  socketSlot: number | null;
  /** Non-null = the part is its own NFT, and frozen out of gameplay until imported. */
  tokenId: number | null;
  isListed: boolean;
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

/** Sync wallet public keys to the server (called when the extension provides keys after login). */
export function syncWalletKeys(publicKey: string, mldsaPublicKey: string) {
  return fetchAuthJson<{ synced: boolean }>('/auth/sync-wallet-keys', {
    method: 'POST',
    body: JSON.stringify({ publicKey, mldsaPublicKey }),
  });
}

export function googleAuth(code: string) {
  return fetchAuthJson<GoogleAuthResult>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

/**
 * Second half of Google sign-up. `/auth/google` returns `needs_wallet` with a short-lived
 * claim token for an account it has never seen; this exchanges that token for a real user.
 *
 * The website used to receive the claim token and throw it away, so a first-time visitor was
 * told to "create a user in the app first" — the web could sign people IN but never sign them
 * UP. No wallet fields are sent: the server generates the address itself when none is supplied.
 */
export function completeGoogleSignup(googleClaimToken: string) {
  return fetchAuthJson<{ token: string; user: UserProfile; walletAddress: string }>(
    '/auth/google/complete-wallet',
    { method: 'POST', body: JSON.stringify({ googleClaimToken }) },
  );
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

export function fetchUserParts(includeListed = false) {
  return fetchAuthJson<UserPart[]>(`/parts/inventory${includeListed ? '?includeListed=true' : ''}`);
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

// --- Problem Reports ---

/**
 * Send a problem report. `platform` is stamped here so the owner can tell a browser report
 * apart from a phone one without the player having to say so.
 */
export function submitReport(description: string) {
  return fetchAuthJson<{ reportId: string }>('/reports', {
    method: 'POST',
    body: JSON.stringify({ description, screen: 'dashboard', platform: 'web' }),
  });
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

/** Start X account linking. The caller sends the player to `url`. */
export function twitterLinkStart() {
  return fetchAuthJson<{ url: string }>('/social/twitter/start', { method: 'POST', body: JSON.stringify({}) });
}



export function unlinkTwitter() {
  return fetchAuthJson<{ success: boolean }>('/social/unlink-twitter', { method: 'POST' });
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

// --- Wallet ---

export interface WalletTransaction {
  id: string;
  type: string;
  currency: string;
  amount: number;
  direction: string;
  onChainTxId: string | null;
  createdAt: string;
}

/** Exported NFTs the player owns — bikes and, since §12e, parts. */
export interface ExportedPart { id: string; type: string; level: number; tokenId: number | null; nftSettledAt: string | null; isListed: boolean; socketedInBike: string | null }

export function fetchWalletNfts() {
  return fetchAuthJson<{ bikes: UserBike[]; parts: ExportedPart[] }>('/wallet/nfts');
}

export function fetchWalletTransactions() {
  return fetchAuthJson<WalletTransaction[]>('/wallet/transactions');
}

// --- Enjin: link a real wallet + stake ENJ for an earning boost ---
export function enjinLinkStart() {
  return fetchAuthJson<{ url: string; qr: string; code: string; expires: string }>(
    '/enjin/link/start',
    { method: 'POST', body: JSON.stringify({}) },
  );
}

/**
 * Loest die verknuepfte Enjin-Wallet vom Konto. Noetig, weil enjin_public_key EINDEUTIG ist: wer
 * mehrere Wallets hat oder versehentlich die falsche verknuepft hat, kaeme sonst nie an die richtige.
 * Loescht nur die Verknuepfung — Guthaben, Bonds und NFTs der Wallet bleiben unberuehrt.
 */
export function enjinLinkUnlink() {
  return fetchAuthJson<{ linked: boolean }>('/enjin/link/unlink', { method: 'POST', body: JSON.stringify({}) });
}

/**
 * The player's linked Enjin Wallet — the only wallet they have with us (2026-09-02). `address`
 * is the Matrixchain form (where NFTs and ENJ live), `relayAddress` the Relaychain form shown
 * next to the stake; `publicKey` is the raw hex the app compares.
 */
export function enjinLinkStatus() {
  return fetchAuthJson<{ linked: boolean; pending?: boolean; publicKey?: string; address?: string; relayAddress?: string }>(
    '/enjin/link/status',
  );
}

export function enjinStakingStatus() {
  return fetchAuthJson<{
    linked: boolean;
    poolId: number;
    staked?: boolean;
    currentBondedEnj?: number;
    /** Spendable ENJ in the player's own wallet; null when the RPC read failed. */
    walletEnj?: string | null;
    avgBondedEnj30d?: number;
    earningBoost?: number;
    energyBonus?: number;
    tier?: string;
    timeWeightedBondedEnj?: number;
    snapshotCount30d?: number;
    lastSnapshotAt?: string | null;
    slashingRisk?: string;
  }>('/enjin/staking/status');
}

// `enjinBond` und `enjinBondStatus` sind am 2026-09-01 entfallen: der Endpunkt dahinter ist weg.
// Gestaked wird im Galavant-Peloton-Pool, in der eigenen Wallet des Spielers, und der Boost kommt
// aus der Kette — es gibt nichts mehr anzustossen und nichts mehr abzufragen.

// --- Seasonal WATTS → ENJ redemption ---
export interface RedemptionStatus {
  open: boolean;
  season?: { id: string; name: string; budgetEnj: number; totalWatts: number; closesAt: string | null };
  entry?: { watts: number; estimatedEnj: number } | null;
  minWatts?: number;
}

export function redemptionCurrent() {
  return fetchAuthJson<RedemptionStatus>('/redemption/current');
}

export interface RedemptionStanding {
  rank: number;
  isMe: boolean;
  nickname: string;
  watts: number;
  sharePct: number;
  estimatedEnj: number;
}

export interface RedemptionLeaderboard {
  open: boolean;
  season?: {
    id: string;
    name: string;
    budgetEnj: number;
    totalWatts: number;
    totalWeight: number;
    entrants: number;
    closesAt: string | null;
  };
  me?: { rank: number | null; watts: number; sharePct: number; estimatedEnj: number } | null;
  top?: RedemptionStanding[];
}

export function redemptionLeaderboard(limit = 25) {
  return fetchAuthJson<RedemptionLeaderboard>(`/redemption/leaderboard?limit=${limit}`);
}

export function redemptionSubmit(watts: number) {
  return fetchAuthJson<{ ok: boolean; watts: number; weight: number }>(
    '/redemption/submit',
    { method: 'POST', body: JSON.stringify({ watts }) },
  );
}

// --- Web shop (card checkout, and ENJ once the server quotes it) ---
export interface StoreProduct {
  type: string;
  displayName: string;
  quality: string;
  priceUsdCents: number;
  available: boolean;
  /**
   * Indicative ENJ price as a decimal string, the same shape the marketplace already uses.
   *
   * This one field is the shop's whole switch for the ENJ way. The server sends it exactly when it
   * can both quote a rate and take the money, so an unfinished ENJ path leaves the player with no
   * ENJ price and no ENJ button at all — never with a button that answers with an error. The page
   * therefore asks for this instead of carrying a rate or a feature flag of its own.
   */
  priceEnj?: string | null;
  /**
   * Whether the CARD button may be pressed. Separate from `available` because the shop now has two
   * tills and they open independently: with no Stripe key but a live ENJ rate the bike is on sale,
   * `available` is true, and a card button that leads to a 503 would be the only thing the buyer
   * ever sees. Absent on an older server, and then the card is as available as the bike is.
   */
  cardAvailable?: boolean;
}
export interface StoreCatalog { enabled: boolean; currency: string; products: StoreProduct[] }

/**
 * Stock side of the shop. It carries no usable price — the satoshi lever behind `priceSats` died
 * with the BTC purchase path — but its caps say whether a bike is gone for good or only for today,
 * which is the difference between "sold out" and "come back tomorrow".
 */
export interface StoreStockListing { type: string; displayName: string; quality: string; available: boolean }
export interface StoreStock {
  enabled: boolean;
  listings: StoreStockListing[];
  totalSold: number;
  totalCap: number;
  soldToday: number;
  dailyCap: number;
}

export function fetchStoreProducts() {
  return fetchJson<StoreCatalog>('/store/products');
}

export function fetchStoreStock() {
  return fetchJson<StoreStock>('/store/bikes');
}

export function storeCheckout(bikeType: string) {
  return fetchAuthJson<{ url: string }>('/store/checkout', { method: 'POST', body: JSON.stringify({ bikeType }) });
}

/**
 * What the shop hands a buyer who pays in ENJ: an address, an amount and a deadline.
 *
 * Deliberately NOT a checkout URL, which is what this used to expect. There is no hosted page to
 * send anyone to, because nobody but the buyer ever touches their ENJ — they sign the transfer in
 * their own wallet, and the server reads the result off the chain. `chain` is spelled out for the
 * same reason the amount is: sending on the wrong chain loses the money, and no refund exists.
 */
export interface EnjPayment {
  quoteId: string;
  product: string;
  /**
   * DER BETRAG, DER ZU SENDEN IST — Preis plus die Kennung dieses Kaufs, auf acht Nachkommastellen.
   *
   * Seit dem 2026-09-01 geht das Geld an EINE Galavant-Adresse statt an eine eigene je Kauf (der
   * Eigentuemer haelt keine Zahlungen und wir unterschreiben nichts). Damit ist der Empfaenger
   * keine Zuordnung mehr, und ein Verwendungszweck existiert auf der Relaychain nicht — also
   * traegt der Betrag die Kennung, in den Nachkommastellen fuenf bis acht. Wer sie wegrundet,
   * hat bezahlt, ohne dass jemand weiss wofuer; deshalb sagt die Oberflaeche es ausdruecklich.
   */
  amountEnj: string;
  /** Der Preis ohne Kennung — damit sichtbar ist, dass nichts aufgeschlagen wird. */
  priceEnj: string;
  /** Die vier Ziffern selbst, damit sie hervorgehoben werden koennen. */
  paymentTag: number;
  address: string;
  chain: string;
  expiresAt: string;
  /** open (waiting for the transfer) → paid → redeemed; or held. */
  status: string;
  /** True once the fifteen-minute promise has run out and nothing was paid against it. */
  expired: boolean;
  /** 'late' or 'amount' — money arrived that cannot be honoured as-is and a human has to look. */
  holdReason: string | null;
  redeemed: boolean;
}

/**
 * Open (or re-open) an ENJ payment. The server hands back the SAME payment while one is still
 * running for this bike, so a reload cannot leave the buyer looking at one address while their
 * wallet is aimed at another.
 */
export function storeCheckoutEnj(bikeType: string) {
  return fetchAuthJson<EnjPayment>('/store/checkout/enj', { method: 'POST', body: JSON.stringify({ bikeType }) });
}

/** Poll one payment while the transfer travels. */
export function fetchEnjPayment(quoteId: string) {
  return fetchAuthJson<EnjPayment>(`/store/checkout/enj/${quoteId}`);
}

// --- Blockchain / NFT ---

export interface BlockchainFees {
  nftExportFeeSap: number;
  /** WATTS fee to export a PART as its own NFT (§12e). */
  partExportFeeSap: number;
}

export function fetchBlockchainFees() {
  return fetchJson<BlockchainFees>('/blockchain/fees');
}

export function mintBikeNft(bikeId: string) {
  return fetchAuthJson<{ tokenId: string; txHash: string; imageUrl: string }>('/blockchain/mint-bike', {
    method: 'POST',
    body: JSON.stringify({ bikeId }),
  });
}

/**
 * Ein Token, das die verwaltete Wallet haelt, dessen Gegenstand aber noch nicht im Spiel ist —
 * also ein gekauftes NFT, das nur noch beansprucht werden muss. Die eigenen exportierten NFTs
 * stehen hier NICHT drin, die kommen aus fetchWalletNfts.
 */
export interface ClaimableNft {
  kind: 'bike' | 'part';
  tokenId: number;
  type: string;
  /** Nur Fahrraeder haben eine Qualitaet. */
  quality: string | null;
  level: number;
  imageUrl: string | null;
  /** Der Verkauf wird noch abgerechnet — der Import weist bis dahin ab. */
  settling: boolean;
}

export function fetchClaimableNfts() {
  return fetchAuthJson<{ items: ClaimableNft[] }>('/blockchain/claimable');
}

/**
 * What an import answers. The burn is signed by the player in their own Enjin Wallet
 * (2026-09-02), so the usual answer is `pending` plus the journal to poll — the item comes
 * home once the chain has finalized the burn. `done` is the owner's rescue: the token was
 * already gone from the chain and the row was credited on the spot.
 */
export interface ImportStart {
  success: boolean;
  status: 'pending' | 'done';
  journalId?: string;
  uuid?: string | null;
  bikeId?: string;
  partId?: string;
}

export interface ImportStatus {
  state: string;
  result: string | null;
  extrinsicHash: string | null;
  error: string | null;
  /** True once the burn is finalized and the row is credited. */
  imported: boolean;
  tokenId: number;
}

export function importBikeNft(tokenId: number) {
  return fetchAuthJson<ImportStart>('/blockchain/import-bike', {
    method: 'POST',
    body: JSON.stringify({ tokenId }),
  });
}

export function fetchImportStatus(journalId: string) {
  return fetchAuthJson<ImportStatus>(`/blockchain/import/${journalId}`);
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

// --- THE market (task 7dc61fc3): one feed over both shops -------------------
// The in-game WATTS marketplace and the NFT Trading Post used to be two separate shop
// windows for what is, to a player, one item. `/market` merges the PRESENTATION and the
// entry points; the two services behind it are still separate.

/** One card in the merged feed — an ordinary in-game item or an NFT, priced in WATTS or ENJ. */
export interface MarketListing {
  /** Namespaced: `game~<uuid>` or `nft~<uuid>`. The same id works for detail, buy and cancel. */
  id: string;
  source: 'game' | 'nft';
  itemType: string;
  itemId: string;
  isNft: boolean;
  tokenId: number | null;
  currency: 'watts' | 'enj';
  priceWatts: number | null;
  priceEnj: string | null;
  /** The three outcomes a buyer must tell apart. */
  buyerOutcome: 'in_game_item' | 'nft_burned_to_item' | 'nft_transferred';
  buyerLabel: string;
  buyerNote: string;
  /** False when we cannot take the money here; `blockedLabel`/`blockedNote` say why. */
  canBuyHere: boolean;
  blockedLabel: string | null;
  blockedNote: string | null;
  /** An ENJ listing sent to the chain — or waiting for the seller's signature — but not standing yet. */
  chainPending: boolean;
  status: string;
  sellerId: string;
  sellerName: string | null;
  createdAt: string;
  item: MarketplaceItem | null;
}

export interface MarketResponse {
  listings: MarketListing[];
  total: number;
  page: number;
  totalPages: number;
}

/** The live cut per route, plus the two warnings a listing screen has to print. */
export interface MarketPolicy {
  rates: { taxRate: number; royaltyRate: number };
  cuts: Record<'item_watts' | 'nft_watts' | 'nft_enj', { taxRate: number; royaltyRate: number; totalRate: number }>;
  currencyCopy: Record<'watts' | 'enj', string>;
  outcomeCopy: Record<string, { label: string; detail: string }>;
  enj: {
    buyEnabled: boolean;
    buyLabel: string;
    buyNote: string;
    listingDepositWarning: string;
    /** After list / cancel: the request waits in the seller's Enjin Wallet. */
    listingSubmittedTitle: string;
    listingSubmittedNote: string;
    cancelSubmittedTitle: string;
    cancelSubmittedNote: string;
  };
  offChainEnjRefusal: string;
  /** Why an NFT cannot be priced in WATTS (import first). */
  nftWattsRefusal: string;
}

export function fetchMarket(filters: MarketplaceFilters = {}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 24));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.itemType) params.set('itemType', filters.itemType);
  if (filters.quality) params.set('quality', filters.quality);
  if (filters.bikeType) params.set('bikeType', filters.bikeType);
  if (filters.partType) params.set('partType', filters.partType);
  if (filters.partLevel !== undefined) params.set('partLevel', String(filters.partLevel));
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  return fetchJson<MarketResponse>(`/market?${params}`);
}

export function fetchMarketPolicy() {
  return fetchJson<MarketPolicy>('/market/policy');
}

export function fetchMyMarketListings() {
  return fetchAuthJson<{ listings: MarketListing[] }>('/market/mine');
}

export function marketList(body: {
  itemType: string;
  itemId: string;
  currency: 'watts' | 'enj';
  priceWatts?: number;
  priceEnj?: string;
}) {
  return fetchAuthJson<{ success: boolean; id: string; netProceedsWatts?: number; netProceedsEnj?: string }>(
    '/market/list',
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function marketBuy(id: string) {
  // `pending`: an ENJ purchase the buyer still has to approve in their Enjin Wallet.
  return fetchAuthJson<{ success: boolean; status?: string; pending?: boolean }>(`/market/${id}/buy`, { method: 'POST' });
}

export function marketCancel(id: string) {
  // `pending`: an ENJ cancel the seller still has to approve in their Enjin Wallet.
  return fetchAuthJson<{ success: boolean; pending?: boolean }>(`/market/${id}/cancel`, { method: 'POST' });
}

// --- Part NFTs: export a part as its own token, or burn it back into the game ---
export function mintPartNft(partId: string) {
  return fetchAuthJson<{ success: boolean; tokenId: number; txHash: string | null }>(
    '/blockchain/mint-part',
    { method: 'POST', body: JSON.stringify({ partId }) },
  );
}

export function importPartNft(tokenId: number) {
  return fetchAuthJson<ImportStart>(
    '/blockchain/import-part',
    { method: 'POST', body: JSON.stringify({ tokenId }) },
  );
}
