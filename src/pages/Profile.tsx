import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Human, Coins, Zap, Redo, Check, Logout,
  ChevronLeft, Trophy, Mail, Bookmark, Download,
} from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { LoginModal } from '../components/LoginModal';
import { NftDetailModal } from '../components/NftDetailModal';
import { PartNftModal } from '../components/PartNftModal';
import type { PartNftRow } from '../components/PartNftModal';
import {
  enjinLinkStatus, fetchClaimableNfts, fetchSpendingWallet, fetchUserBikes,
  fetchUserParts, fetchWalletNfts,
} from '../api';
import { importNft } from '../hooks/useNftImport';
import type { ClaimableNft, UserBike } from '../api';
import { MissionProfileCard } from '../components/MissionProfileCard';
import { config } from '../config';

const PART_TYPE_LABELS: Record<string, string> = {
  earning: 'Earning',
  luck: 'Luck',
  recovery: 'Recovery',
  durability: 'Durability',
};

const PART_TYPE_COLORS: Record<string, string> = {
  earning: 'border-m2e-earning',
  luck: 'border-m2e-luck',
  recovery: 'border-m2e-recovery',
  durability: 'border-m2e-durability',
};

function getPartImageUrl(type: string, level: number): string {
  return `/parts/part-${type.toLowerCase()}-lv${level}.png`;
}

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function Profile() {
  const { isAuthenticated, isRestoring, user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<PartNftRow | null>(null);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const { data: spending } = useQuery({
    queryKey: ['spending'],
    queryFn: fetchSpendingWallet,
    enabled: isAuthenticated,
  });

  const { data: bikes } = useQuery({
    queryKey: ['userBikes'],
    queryFn: fetchUserBikes,
    enabled: isAuthenticated,
  });

  const { data: nftBikes } = useQuery({
    queryKey: ['walletNfts'],
    queryFn: fetchWalletNfts,
    enabled: isAuthenticated,
  });

  const { data: parts } = useQuery({
    queryKey: ['userParts'],
    queryFn: () => fetchUserParts(),
    enabled: isAuthenticated,
  });

  const selectedBike: UserBike | null =
    (bikes?.find((b) => b.id === selectedBikeId) ?? nftBikes?.bikes?.find((b) => b.id === selectedBikeId)) ?? null;

  // /parts/inventory only returns free, unlisted parts — exported ones (which may be
  // socketed or listed) come from /wallet/nfts, so merge both into one list.
  const partRows: PartNftRow[] = useMemo(() => {
    const rows = new Map<string, PartNftRow>();
    for (const p of parts ?? []) {
      rows.set(p.id, { id: p.id, type: p.type, level: p.level, socketedInBike: p.socketedInBike, tokenId: null, isListed: false });
    }
    for (const p of nftBikes?.parts ?? []) {
      rows.set(p.id, { id: p.id, type: p.type, level: p.level, socketedInBike: p.socketedInBike, tokenId: p.tokenId, isListed: p.isListed });
    }
    return [...rows.values()];
  }, [parts, nftBikes]);

  if (isRestoring) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-m2e-text-muted uppercase tracking-[0.3em] animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 px-4">
        <Human className="w-20 h-20 text-m2e-text-muted" />
        <h2 className="text-3xl uppercase tracking-wide text-center">Signed Out</h2>
        <p className="text-lg uppercase tracking-wider text-m2e-text-secondary text-center">
          Login to view your profile
        </p>
        <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-6 py-3 text-sm animate-glow-pulse">
          Login
        </button>
        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  return (
    <>
      {/* Hero strip — player card */}
      <div className="border-b-2 border-m2e-border bg-m2e-chrome text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-10 md:py-14 relative z-10">
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-m2e-accent text-xs uppercase tracking-[0.25em]">
                <ChevronLeft className="w-4 h-4" />
                Home
              </Link>
              <span className="text-white/30">/</span>
              <div className="section-label">13 · Player Card</div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <PlayerAvatar
                  avatarUrl={user.avatarUrl}
                  nickname={user.nickname}
                  className="w-28 h-28 md:w-40 md:h-40 pixel-border border-m2e-accent pixel-shadow"
                  textClassName="text-5xl md:text-7xl"
                />
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 text-[10px] uppercase tracking-widest bg-m2e-accent text-m2e-text-on-accent pixel-border border-m2e-accent-dark flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-blink" />
                  Player 1
                </span>
              </div>

              {/* Name & meta */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className="text-xs uppercase tracking-[0.3em] text-white/60">Nickname</div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl uppercase tracking-wide text-chroma-hero leading-[0.9] truncate">
                  {user.nickname}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm uppercase tracking-[0.2em] text-white/70">
                  <span className="pixel-border border-white/30 bg-white/10 px-2 py-1 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    Google Auth
                  </span>
                  {user.hasGoogleLinked && user.linkedEmail && (
                    <span className="pixel-border border-m2e-success/50 bg-m2e-success/10 text-m2e-success px-2 py-1 flex items-center gap-1.5 max-w-[240px] truncate">
                      <Check className="w-3 h-3 shrink-0" />
                      <span className="truncate normal-case tracking-normal">{user.linkedEmail}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-8 py-10 md:py-14 space-y-10">
        {/* Lifetime stats */}
        <motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label">Lifetime Stats</div>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <LifeStat icon={Zap} label="Distance" value={formatDistance(user.totalDistance)} />
            <LifeStat icon={Coins} label="WATTS Earned" value={formatNumber(user.totalSapEarned ?? 0)} accent />
            <LifeStat icon={Redo} label="Activities" value={(user.totalActivities ?? 0).toLocaleString()} />
          </div>
        </motion.section>

        {/* WATTS balance hero */}
        <motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label">Wallet · WATTS</div>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="pixel-card p-5 md:p-6 flex items-center gap-4 md:gap-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-m2e-accent/10 to-transparent pointer-events-none" />
            <img src="/assets/token-silver.png" alt="WATTS" className="w-16 h-16 md:w-20 md:h-20 pixel-render shrink-0 relative animate-float-y" />
            <div className="flex-1 min-w-0 relative">
              <div className="text-[10px] uppercase tracking-[0.3em] text-m2e-text-muted">Balance</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-6xl leading-none text-m2e-accent text-chroma-soft">
                  {spending?.sap?.toLocaleString() ?? '—'}
                </span>
                <span className="text-sm md:text-base text-m2e-text-muted uppercase tracking-[0.2em]">WATTS</span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col gap-2 shrink-0">
              <Link to="/tasks" className="pixel-btn pixel-btn-outline px-4 py-2 text-xs no-underline text-center">
                Tasks
              </Link>
              <Link to="/earn" className="pixel-btn pixel-btn-primary px-4 py-2 text-xs no-underline text-center animate-glow-pulse">
                Earn More
              </Link>
            </div>
          </motion.div>
          <div className="flex gap-2 sm:hidden">
            <Link to="/tasks" className="flex-1 pixel-btn pixel-btn-outline px-4 py-2 text-xs no-underline text-center">
              Tasks
            </Link>
            <Link to="/earn" className="flex-1 pixel-btn pixel-btn-primary px-4 py-2 text-xs no-underline text-center animate-glow-pulse">
              Earn More
            </Link>
          </div>
        </motion.section>

        {/* Daily missions */}
        <motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label">Daily Missions</div>
          <MissionProfileCard />
        </motion.section>

        {/* Bikes inventory */}
        <motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="section-label">Inventory · Bikes</div>
            {bikes && <span className="text-xs uppercase tracking-[0.25em] text-m2e-text-muted">{bikes.length} total</span>}
          </div>

          {bikes && bikes.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="visible"
            >
              {bikes.map((bike: UserBike) => {
                const imageUrl = bike.imageUrl
                  ? (bike.imageUrl.startsWith('/') ? `${config.apiUrl}${bike.imageUrl}` : bike.imageUrl)
                  : `${config.apiUrl}/art/bases/bike-${bike.type.toLowerCase()}.png`;
                const qualityBadge = `pixel-badge-${bike.quality}`;
                return (
                  <motion.div
                    key={bike.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="pixel-card overflow-hidden hover:border-m2e-accent-dark transition-colors cursor-pointer"
                    onClick={() => setSelectedBikeId(bike.id)}
                  >
                    <div className="relative aspect-[16/9] bg-m2e-bg-alt border-b-2 border-m2e-border flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt={`${bike.type} bike`}
                        className="w-full h-full object-cover pixel-render"
                        loading="lazy"
                      />
                      {bike.isEquipped && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] bg-m2e-success text-m2e-text-on-accent pixel-border shadow-sm tracking-wide border-green-800 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Equipped
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wide text-m2e-text">{bike.type}</span>
                        <span className={`px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide border-opacity-50 ${qualityBadge}`}>
                          {bike.quality}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-m2e-text-muted tracking-[0.25em] uppercase">
                        <span>Balance Bike</span>
                        <span>Lv. {bike.level}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <EmptyState icon={Trophy} label="No bikes yet" />
          )}
        </motion.section>

        {/* NFTs (exported bikes on-chain) */}
        {nftBikes && nftBikes.bikes.length > 0 && (
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="section-label">Inventory · NFTs</div>
              <span className="text-xs uppercase tracking-[0.25em] text-m2e-text-muted">{nftBikes.bikes.length} on-chain</span>
            </div>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="visible"
            >
              {nftBikes.bikes.map((bike: UserBike) => {
                const imageUrl = bike.imageUrl
                  ? (bike.imageUrl.startsWith('/') ? `${config.apiUrl}${bike.imageUrl}` : bike.imageUrl)
                  : `${config.apiUrl}/art/bases/bike-${bike.type.toLowerCase()}.png`;
                const qualityBadge = `pixel-badge-${bike.quality}`;
                return (
                  <motion.div
                    key={bike.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="pixel-card overflow-hidden hover:border-m2e-accent-dark transition-colors cursor-pointer"
                    onClick={() => setSelectedBikeId(bike.id)}
                  >
                    <div className="relative aspect-[16/9] bg-m2e-bg-alt border-b-2 border-m2e-border flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt={`${bike.type} bike`}
                        className="w-full h-full object-cover pixel-render"
                        loading="lazy"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] bg-m2e-info/20 text-m2e-info pixel-border shadow-sm tracking-wide border-m2e-info/50">
                        On-chain
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wide text-m2e-text">{bike.type}</span>
                        <span className={`px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide border-opacity-50 ${qualityBadge}`}>
                          {bike.quality}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-m2e-text-muted tracking-[0.25em] uppercase">
                        <span>#{bike.tokenId}</span>
                        <span>Lv. {bike.level}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        )}

        {/* Enjin-Wallet: Einzahlungsadresse + beanspruchbare Token */}
        <EnjinWalletSection />

        {/* Parts inventory */}
        <motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="section-label">Inventory · Parts</div>
            <span className="text-xs uppercase tracking-[0.25em] text-m2e-text-muted">{partRows.length} total</span>
          </div>

          {partRows.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {partRows.map((part: PartNftRow) => (
                <motion.div
                  key={part.id}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className={`pixel-card overflow-hidden cursor-pointer ${PART_TYPE_COLORS[part.type] ?? ''}`}
                  onClick={() => setSelectedPart(part)}
                >
                  <div className="relative bg-m2e-bg-alt p-2 flex items-center justify-center">
                    <img
                      src={getPartImageUrl(part.type, part.level)}
                      alt={`${part.type} Lv.${part.level}`}
                      className="w-16 h-16 object-contain pixel-render"
                      loading="lazy"
                    />
                    {part.tokenId != null && (
                      <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] bg-m2e-info/20 text-m2e-info pixel-border shadow-sm tracking-wide border-m2e-info/50">
                        On-chain
                      </span>
                    )}
                  </div>
                  <div className="px-2 py-2 text-center border-t border-m2e-border">
                    <p className="text-xs uppercase text-m2e-text">
                      {PART_TYPE_LABELS[part.type] ?? part.type}
                    </p>
                    <p className="text-[10px] text-m2e-text-muted uppercase tracking-widest">
                      Lv. {part.level}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest mt-0.5">
                      {part.socketedInBike ? (
                        <span className="text-m2e-success">In Use</span>
                      ) : (
                        <span className="text-m2e-text-muted">Free</span>
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Bookmark} label="No parts yet" />
          )}
        </motion.section>

        {/* Logout — styled as Game Over */}
        <motion.section
          className="pt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={handleLogout}
            className="pixel-btn pixel-btn-danger w-full px-4 py-4 text-sm inline-flex items-center justify-center gap-2"
          >
            <Logout className="w-5 h-5" />
            Logout · Game Over
          </button>
        </motion.section>

        {selectedBikeId && (
          <NftDetailModal
            nftId={selectedBikeId}
            onClose={() => setSelectedBikeId(null)}
            ownerBike={selectedBike}
          />
        )}

        {selectedPart && (
          <PartNftModal part={selectedPart} onClose={() => setSelectedPart(null)} />
        )}
      </div>
    </>
  );
}

function LifeStat({ icon: Icon, label, value, accent }: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="pixel-card p-4 md:p-5 flex flex-col gap-2 relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${accent ? 'text-m2e-accent' : 'text-m2e-text-secondary'}`} />
        <span className="text-[9px] text-m2e-text-muted uppercase tracking-[0.3em]">{label}</span>
      </div>
      <div className={`text-2xl md:text-4xl leading-none tracking-wide ${accent ? 'text-m2e-accent' : 'text-m2e-text'}`}>
        {value}
      </div>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <div className="pixel-card p-10 text-center">
      <Icon className="w-10 h-10 text-m2e-text-muted mx-auto mb-3" />
      <p className="text-sm text-m2e-text-muted uppercase tracking-[0.25em]">{label}</p>
    </div>
  );
}

/**
 * NFTs that are in the player's own Enjin Wallet but not (or no longer) in the game — bought on
 * the Enjin marketplace, received from someone, or exported by another account. One tap asks
 * the chain who holds the token, then asks the player's wallet to burn it; the row is credited
 * once the burn lands. There is no deposit address any more (2026-09-02): the linked wallet IS
 * the wallet, and a token that arrives there is already where it has to be.
 *
 * The section stands even when nothing is waiting: it is the answer to "I bought a Galavant
 * NFT — now what", and that question comes before the purchase, not after.
 */
function EnjinWalletSection() {
  const link = useQuery({ queryKey: ['enjin-link-status'], queryFn: enjinLinkStatus, retry: false });
  const linked = link.data?.linked === true;
  // Nothing to look for without a wallet to look in.
  const { data: claimable, error: claimableError, isLoading: claimableLoading } = useQuery({
    queryKey: ['claimableNfts'],
    queryFn: fetchClaimableNfts,
    enabled: linked,
  });

  const items = claimable?.items ?? [];

  return (
    <motion.section
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-label">NFTs in your wallet</div>

      <div className="pixel-card p-4 md:p-6 space-y-2">
        <p className="text-xs md:text-sm text-m2e-text-secondary leading-relaxed">
          Bought a Galavant NFT, or been sent one? It is in your Enjin Wallet, and anything from our
          collections that is not in the game yet shows up here. Claim it and approve the burn in your
          wallet — the item lands in your inventory once the chain confirms.
        </p>
        {link.isSuccess && !linked && (
          <p className="text-xs text-m2e-warning uppercase tracking-widest">
            Link your Enjin Wallet under ENJ Staking on your wallet page first.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="section-label">Ready to claim</div>
        {/* Nur die zaehlen, deren Knopf auch klickbar ist. */}
        {items.filter((i) => !i.settling).length > 0 && (
          <span className="text-xs uppercase tracking-[0.25em] text-m2e-text-muted">
            {items.filter((i) => !i.settling).length} waiting
          </span>
        )}
      </div>

      {claimableError ? (
        /*
         * Ein Lesefehler der Kette darf NICHT wie "nichts angekommen" aussehen. Genau diese
         * Verwechslung laesst einen Kaeufer glauben, sein NFT sei verloren.
         */
        <div className="pixel-card p-4 text-xs text-m2e-warning uppercase tracking-wider">
          {(claimableError as Error).message}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <ClaimCard key={`${item.kind}-${item.tokenId}`} item={item} />
          ))}
        </div>
      ) : claimableLoading || link.isLoading ? (
        <div className="pixel-card p-6 text-center text-xs text-m2e-text-muted uppercase tracking-[0.25em]">
          Checking your wallet…
        </div>
      ) : link.isError ? (
        /* "Nothing waiting" ist eine ENDGUELTIGE Aussage und darf nur fallen, wenn wirklich
           nachgesehen wurde. */
        <div className="pixel-card p-6 text-center text-xs text-m2e-text-muted uppercase tracking-[0.25em]">
          Could not check right now — reload in a moment
        </div>
      ) : (
        <EmptyState icon={Download} label={linked ? 'Nothing waiting' : 'No wallet linked'} />
      )}
    </motion.section>
  );
}

/**
 * Ein Token in der eigenen Wallet des Spielers, das noch nicht im Spiel ist — ein Klick und eine
 * Freigabe von der Uebernahme entfernt. Der Anspruch laeuft ueber genau die vorhandenen
 * Import-Endpunkte; sie finden die Zeile ueber die Token-Id, fragen die Kette, wer das Token
 * haelt, und schicken den Burn zur Unterschrift in die Wallet.
 */
function ClaimCard({ item }: { item: ClaimableNft }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [awaitingWallet, setAwaitingWallet] = useState(false);

  const claim = useMutation({
    mutationFn: () => importNft(item.kind, item.tokenId, () => setAwaitingWallet(true)),
    onSettled: () => setAwaitingWallet(false),
    onSuccess: (outcome) => {
      setError(null);
      if (outcome.status === 'still-pending') {
        setError('Still waiting for your approval in the Enjin Wallet — the item lands on its own once you approve.');
        return;
      }
      // Der Gegenstand wandert aus dieser Liste in das eigene Inventar, und ein Fahrrad zaehlt
      // wieder zur maximalen Energie.
      queryClient.invalidateQueries({ queryKey: ['claimableNfts'] });
      queryClient.invalidateQueries({ queryKey: ['userBikes'] });
      queryClient.invalidateQueries({ queryKey: ['userParts'] });
      queryClient.invalidateQueries({ queryKey: ['walletNfts'] });
      queryClient.invalidateQueries({ queryKey: ['energy'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const imageUrl = item.kind === 'bike'
    ? (item.imageUrl
        ? (item.imageUrl.startsWith('/') ? `${config.apiUrl}${item.imageUrl}` : item.imageUrl)
        : `${config.apiUrl}/art/bases/bike-${item.type.toLowerCase()}.png`)
    : getPartImageUrl(item.type, item.level);
  const label = item.kind === 'bike' ? item.type : (PART_TYPE_LABELS[item.type] ?? item.type);

  return (
    <div className="pixel-card overflow-hidden flex flex-col">
      <div className="relative aspect-[16/9] bg-m2e-bg-alt border-b-2 border-m2e-border flex items-center justify-center">
        <img
          src={imageUrl}
          alt={`${label} #${item.tokenId}`}
          className={item.kind === 'bike' ? 'w-full h-full object-cover pixel-render' : 'h-20 object-contain pixel-render'}
          loading="lazy"
        />
        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] bg-m2e-info/20 text-m2e-info pixel-border shadow-sm tracking-wide border-m2e-info/50">
          In wallet
        </span>
      </div>
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-wide text-m2e-text">{label}</span>
          {item.quality && (
            <span className={`px-2 py-0.5 text-[10px] uppercase pixel-border shadow-sm tracking-wide border-opacity-50 pixel-badge-${item.quality}`}>
              {item.quality}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-m2e-text-muted tracking-[0.25em] uppercase">
          <span>#{item.tokenId}</span>
          <span>Lv. {item.level}</span>
        </div>

        {error && <p className="text-[10px] text-m2e-danger uppercase tracking-wider">{error}</p>}
        {item.settling && (
          /*
           * Die Zeile haengt noch in einem ENJ-Angebot: der Abgleich-Worker hat den Verkauf
           * noch nicht gebucht, und bis dahin weist der Import ab. Anzeigen statt verschweigen —
           * wer gerade gekauft hat, sucht sein NFT sofort.
           */
          <p className="text-[10px] text-m2e-warning uppercase tracking-wider">
            Still settling — try again in a minute
          </p>
        )}

        <button
          onClick={() => claim.mutate()}
          disabled={claim.isPending || item.settling}
          className="mt-auto pixel-btn pixel-btn-primary w-full px-3 py-2 text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {awaitingWallet ? 'Approve in your wallet…' : claim.isPending ? 'Claiming…' : 'Claim'}
        </button>
      </div>
    </div>
  );
}
