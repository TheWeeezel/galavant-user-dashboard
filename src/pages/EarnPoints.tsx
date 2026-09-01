import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  ExternalLink, Copy, Check, Human, Gift, Repeat, Heart, ChevronLeft,
  Zap, Users,
} from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { AppDownload } from '../components/AppDownload';
import type { ChangelogData } from '../types/changelog';
import {
  fetchReferralCode,
  fetchReferralStats,
  fetchSocialStatus,
  fetchSocialTweets,
  twitterLinkStart,
  unlinkTwitter,
  claimFollow,
  claimLike,
  claimRetweet,
} from '../api';

export function EarnPoints() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followClicked, setFollowClicked] = useState(false);
  const [visitedTweets, setVisitedTweets] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: referralData } = useQuery({
    queryKey: ['referralCode'],
    queryFn: fetchReferralCode,
    enabled: isAuthenticated,
  });

  const { data: referralStats } = useQuery({
    queryKey: ['referralStats'],
    queryFn: fetchReferralStats,
    enabled: isAuthenticated,
  });

  const { data: socialStatus } = useQuery({
    queryKey: ['socialStatus'],
    queryFn: fetchSocialStatus,
    enabled: isAuthenticated,
  });

  const { data: socialTweetsData } = useQuery({
    queryKey: ['socialTweets'],
    queryFn: fetchSocialTweets,
    enabled: isAuthenticated && !!socialStatus?.twitterLinked,
  });

  const { data: changelogData } = useQuery<ChangelogData>({
    queryKey: ['changelog'],
    queryFn: () => fetch('/changelog.json').then(r => {
      if (!r.ok) throw new Error('Failed to load changelog');
      return r.json();
    }),
  });

  // The OAuth callback bounces back to /earn with the outcome in the query.
  const [linkNotice, setLinkNotice] = useState<{ kind: 'ok' | 'fail'; text: string } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const x = q.get('x');
    if (!x) return;
    if (x === 'linked') setLinkNotice({ kind: 'ok', text: `Connected as @${q.get('handle') ?? 'your account'}` });
    else if (x === 'denied') setLinkNotice({ kind: 'fail', text: 'You declined the X permission request.' });
    else setLinkNotice({ kind: 'fail', text: q.get('reason') ?? 'Could not link your X account.' });
    queryClient.invalidateQueries({ queryKey: ['social-status'] });
    window.history.replaceState({}, '', window.location.pathname);
  }, [queryClient]);

  const linkTwitterMutation = useMutation({
    mutationFn: twitterLinkStart,
    // Full redirect, not a popup: X blocks its authorize page in many embedded
    // and popup contexts, and the callback returns to /earn anyway.
    onSuccess: ({ url }) => { window.location.href = url; },
  });


  const claimFollowMutation = useMutation({
    mutationFn: claimFollow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialStatus'] });
    },
  });

  const claimLikeMutation = useMutation({
    mutationFn: (twitterTweetId: string) => claimLike(twitterTweetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialTweets'] });
    },
  });

  const claimRetweetMutation = useMutation({
    mutationFn: (twitterTweetId: string) => claimRetweet(twitterTweetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialTweets'] });
    },
  });

  const unlinkTwitterMutation = useMutation({
    mutationFn: unlinkTwitter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialStatus'] });
      queryClient.invalidateQueries({ queryKey: ['socialTweets'] });
    },
  });

  const referralLink = referralData?.referralCode
    ? `${window.location.origin}?ref=${referralData.referralCode}`
    : null;

  const handleCopyReferral = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const socialTweets = socialTweetsData?.tweets ?? [];
  const TWEETS_PER_PAGE = 16;
  const [tweetPage, setTweetPage] = useState(0);
  const totalTweetPages = Math.max(1, Math.ceil(socialTweets.length / TWEETS_PER_PAGE));
  const visibleTweets = socialTweets.slice(tweetPage * TWEETS_PER_PAGE, (tweetPage + 1) * TWEETS_PER_PAGE);

  return (
    <>
      {/* Hero strip */}
      <div className="border-b-2 border-m2e-border bg-m2e-chrome text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-10 md:py-14 relative z-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <motion.div
              className="space-y-4 flex-1 min-w-0"
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
                <div className="section-label">12 · Earn</div>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
                Earn More<br />
                <span className="text-m2e-accent">WATTS.</span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl max-w-2xl">
                Four ways to stack WATTS. Walk, engage, refer, complete tasks. Your WATTS counts toward the mainnet airdrop.
              </p>
            </motion.div>

            <motion.img
              src="/assets/token-silver.png"
              alt="WATTS"
              className="w-28 h-28 md:w-40 md:h-40 pixel-render shrink-0 animate-float-y"
              initial={{ opacity: 0, rotate: -20, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-8 py-10 md:py-14 space-y-12">
        {/* Top Tier — Testing Tasks & Walk to Earn */}
        <motion.section
          className="space-y-5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label">Primary Missions</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Testing Tasks */}
            <MissionCard
              kicker="Mission 01"
              reward="Up to 2,200 WATTS"
              icon={Gift}
              iconTint="accent"
              title="Testing Tasks"
              description={
                <>Complete 15 testnet tasks. Your points count toward the <span className="text-m2e-accent">mainnet airdrop allocation</span>.</>
              }
            >
              <Link to="/tasks" className="pixel-btn pixel-btn-primary px-5 py-2.5 text-sm">
                View Tasks
              </Link>
            </MissionCard>

            {/* Walk to Earn */}
            <MissionCard
              kicker="Mission 02"
              reward="WATTS / minute"
              icon={Zap}
              iconTint="accent"
              title="Walk to Earn"
              description={
                <>Equip a bike in the app and <span className="text-m2e-accent">move</span>. WATTS flows every minute of activity.</>
              }
            >
              <div className="flex items-center gap-2">
                <AppDownload
                  testflightUrl={changelogData?.testflightUrl}
                  playStoreUrl={changelogData?.playStoreUrl}
                  variant="compact"
                />
              </div>
            </MissionCard>
          </div>
        </motion.section>

        {/* Social Tasks */}
        <motion.section
          className="space-y-5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-2">
              <div className="section-label">Mission 03 · Social</div>
              <h2 className="text-3xl md:text-4xl uppercase tracking-wide text-m2e-text leading-none">
                Engage<span className="text-m2e-accent">.</span>
              </h2>
            </div>
            {!isAuthenticated ? (
              <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-5 py-2.5 text-sm">
                Login to Link X
              </button>
            ) : !socialStatus?.twitterLinked ? (
              <button
                onClick={() => linkTwitterMutation.mutate()}
                disabled={linkTwitterMutation.isPending}
                className="pixel-btn pixel-btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {linkTwitterMutation.isPending ? 'Opening X…' : 'Connect X'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-m2e-text font-mono pixel-border border-m2e-success bg-m2e-success/10 px-3 py-2 text-m2e-success">
                  @{socialStatus.twitterUsername}
                </span>
                <button
                  onClick={() => { if (confirm('Unlink your X account?')) unlinkTwitterMutation.mutate(); }}
                  disabled={unlinkTwitterMutation.isPending}
                  className="pixel-btn pixel-btn-secondary px-3 py-2 text-xs disabled:opacity-50"
                >
                  Unlink
                </button>
              </div>
            )}
          </div>

          {linkTwitterMutation.isError && (
            <p className="text-xs text-m2e-danger">{(linkTwitterMutation.error as Error).message}</p>
          )}

          <p className="text-base md:text-lg text-m2e-text-secondary">
            Follow <span className="text-m2e-accent">@galavanteer</span>. Like and retweet our posts. Each action earns you <span className="text-m2e-accent">10 WATTS</span>.
          </p>

          {isAuthenticated && socialStatus?.twitterLinked && (
            <div className="space-y-5">
              {/* Follow Task */}
              <div className="pixel-card p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-m2e-info/15 border border-m2e-info/30 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-m2e-info" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base text-m2e-text truncate">Follow @galavanteer</p>
                    <p className="text-[10px] text-m2e-text-muted uppercase tracking-[0.25em]">10 WATTS reward</p>
                  </div>
                </div>
                {socialStatus.followClaimed ? (
                  <span className="pixel-border border-m2e-success bg-m2e-success/10 px-3 py-1.5 text-xs uppercase tracking-wide text-m2e-success flex items-center gap-1 shrink-0">
                    <Check className="w-3 h-3" /> Claimed
                  </span>
                ) : !followClicked ? (
                  <a
                    href="https://x.com/intent/follow?screen_name=galavanteer"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setFollowClicked(true)}
                    className="pixel-btn pixel-btn-primary px-4 py-2 text-xs no-underline shrink-0"
                  >
                    Follow on X
                  </a>
                ) : (
                  <button
                    onClick={() => claimFollowMutation.mutate()}
                    disabled={claimFollowMutation.isPending}
                    className="pixel-btn pixel-btn-primary px-4 py-2 text-xs disabled:opacity-50 shrink-0"
                  >
                    {claimFollowMutation.isPending ? 'Claiming…' : 'Claim 10 WATTS'}
                  </button>
                )}
              </div>
              {claimFollowMutation.isError && (
                <p className="text-xs text-m2e-danger">{(claimFollowMutation.error as Error).message}</p>
              )}

              {/* Tweet Interactions */}
              {socialTweets.length === 0 && socialStatus?.twitterLinked && (
                <p className="text-sm text-m2e-text-muted">
                  No posts to engage right now — new ones land here as soon as @galavanteer posts.
                </p>
              )}
              {socialTweets.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-m2e-text-muted">
                    Like & Retweet
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {visibleTweets.map((tweet) => {
                      const visited = visitedTweets.has(tweet.twitterId);
                      return (
                        <motion.div
                          key={tweet.twitterId}
                          whileHover={{ y: -3, transition: { duration: 0.2 } }}
                          className="pixel-card p-3 flex flex-col gap-2"
                        >
                          <p className="text-xs text-m2e-text line-clamp-3 flex-1 leading-relaxed">
                            {tweet.content}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-m2e-text-muted font-mono">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {tweet.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <Repeat className="w-3 h-3" /> {tweet.retweets}
                            </span>
                          </div>

                          <a
                            href={`https://x.com/galavanteer/status/${tweet.twitterId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setVisitedTweets((prev) => new Set(prev).add(tweet.twitterId))}
                            className="pixel-btn pixel-btn-outline px-2 py-1 text-xs no-underline inline-flex items-center gap-1 justify-center"
                          >
                            Open on X <ExternalLink className="w-3 h-3" />
                          </a>

                          <div className="flex gap-2">
                            {tweet.likeClaimed ? (
                              <span className="flex-1 text-center text-xs text-m2e-success flex items-center justify-center gap-1">
                                <Check className="w-3 h-3" /> Liked
                              </span>
                            ) : visited ? (
                              <button
                                onClick={() => claimLikeMutation.mutate(tweet.twitterId)}
                                disabled={claimLikeMutation.isPending}
                                className="flex-1 pixel-btn pixel-btn-primary px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <Heart className="w-3 h-3 inline mr-1" />10
                              </button>
                            ) : (
                              <span className="flex-1 text-center text-xs text-m2e-text-muted italic">
                                Like
                              </span>
                            )}

                            {tweet.retweetClaimed ? (
                              <span className="flex-1 text-center text-xs text-m2e-success flex items-center justify-center gap-1">
                                <Check className="w-3 h-3" /> RT'd
                              </span>
                            ) : visited ? (
                              <button
                                onClick={() => claimRetweetMutation.mutate(tweet.twitterId)}
                                disabled={claimRetweetMutation.isPending}
                                className="flex-1 pixel-btn pixel-btn-primary px-2 py-1 text-xs disabled:opacity-50"
                              >
                                <Repeat className="w-3 h-3 inline mr-1" />10
                              </button>
                            ) : (
                              <span className="flex-1 text-center text-xs text-m2e-text-muted italic">
                                RT
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {totalTweetPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setTweetPage((p) => Math.max(0, p - 1))}
                        disabled={tweetPage === 0}
                        className="pixel-btn pixel-btn-secondary px-4 py-2 text-xs disabled:opacity-40"
                      >
                        <ChevronLeft className="w-3 h-3 inline mr-1" />
                        Prev
                      </button>
                      <div className="px-3 py-1.5 pixel-border bg-m2e-card-alt border-m2e-border text-xs uppercase tracking-widest text-m2e-text-secondary">
                        <span className="text-m2e-accent">{tweetPage + 1}</span>
                        <span className="text-m2e-border mx-1">/</span>
                        {totalTweetPages}
                      </div>
                      <button
                        onClick={() => setTweetPage((p) => Math.min(totalTweetPages - 1, p + 1))}
                        disabled={tweetPage >= totalTweetPages - 1}
                        className="pixel-btn pixel-btn-secondary px-4 py-2 text-xs disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}

                  {(claimLikeMutation.isError || claimRetweetMutation.isError) && (
                    <p className="text-xs text-m2e-danger text-center">
                      {(claimLikeMutation.error as Error)?.message ?? (claimRetweetMutation.error as Error)?.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.section>

        {/* Referral Program */}
        <motion.section
          className="space-y-5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="space-y-2">
              <div className="section-label">Mission 04 · Referral</div>
              <h2 className="text-3xl md:text-4xl uppercase tracking-wide text-m2e-text leading-none">
                Bring<br className="md:hidden" /> <span className="text-m2e-accent">Friends.</span>
              </h2>
            </div>
            <p className="text-base text-m2e-text-secondary max-w-md">
              Share your link. Earn <span className="text-m2e-accent">50 WATTS</span> when a friend signs up with Google and links their wallet.
            </p>
          </div>

          <div className="pixel-card p-5 md:p-6 space-y-5 relative overflow-hidden">
            <div className="absolute inset-0 pixel-grid-bg opacity-30 pointer-events-none" />
            {isAuthenticated ? (
              <div className="relative space-y-5">
                {referralLink && (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-m2e-text-muted flex items-center gap-2">
                      <Human className="w-3.5 h-3.5 text-m2e-accent" />
                      Your Referral Link
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 pixel-border border-m2e-border bg-m2e-card-alt px-3 py-2.5 text-xs font-mono text-m2e-text truncate">
                        {referralLink}
                      </div>
                      <button
                        onClick={handleCopyReferral}
                        className="pixel-btn pixel-btn-primary px-4 py-2.5 text-sm inline-flex items-center gap-1.5"
                      >
                        {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                      </button>
                    </div>
                    <p className="text-[10px] text-m2e-text-muted uppercase tracking-[0.25em]">
                      Code: <span className="font-mono text-m2e-accent">{referralData?.referralCode}</span>
                    </p>
                  </div>
                )}

                {referralStats && (
                  <div className="grid grid-cols-3 gap-3">
                    <ReferralStat label="Successful" value={referralStats.completed} color="text-m2e-success" />
                    <ReferralStat label="Pending" value={referralStats.pending} color="text-m2e-warning" />
                    <ReferralStat label="WATTS Earned" value={referralStats.totalEarned} color="text-m2e-accent" highlight />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative text-center py-4 space-y-3">
                <p className="text-m2e-text-secondary">Sign in to see your referral code.</p>
                <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-5 py-2.5 text-sm">
                  Login to See Your Code
                </button>
              </div>
            )}
          </div>
        </motion.section>

        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    </>
  );
}

function MissionCard({ kicker, reward, icon: Icon, iconTint, title, description, children }: {
  kicker: string;
  reward: string;
  icon: React.ComponentType<any>;
  iconTint: 'accent';
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  void iconTint;
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="pixel-card p-5 md:p-6 space-y-4 border-2 border-m2e-accent/50 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-m2e-accent/5 to-transparent pointer-events-none" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-m2e-accent/15 border border-m2e-accent/40 flex items-center justify-center shrink-0 pixel-shadow-sm">
            <Icon className="w-6 h-6 text-m2e-accent" />
          </div>
          <div>
            <div className="text-[10px] text-m2e-text-muted uppercase tracking-[0.3em]">{kicker}</div>
            <h3 className="text-xl md:text-2xl uppercase tracking-wide text-m2e-text leading-tight">{title}</h3>
          </div>
        </div>
        <span className="pixel-border bg-m2e-accent/15 text-m2e-accent border-current px-2 py-1 text-[10px] uppercase tracking-widest whitespace-nowrap shrink-0">
          {reward}
        </span>
      </div>
      <p className="relative text-base md:text-lg text-m2e-text-secondary leading-relaxed">
        {description}
      </p>
      <div className="relative pt-1">
        {children}
      </div>
    </motion.div>
  );
}

function ReferralStat({ label, value, color, highlight }: {
  label: string;
  value: number | string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`pixel-card p-3 text-center ${highlight ? 'ring-2 ring-m2e-accent/30' : ''}`}>
      <div className={`text-3xl md:text-4xl leading-none ${color}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-m2e-text-muted mt-1.5">
        {label}
      </div>
    </div>
  );
}
