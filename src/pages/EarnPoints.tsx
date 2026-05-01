import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Coins, ExternalLink, Copy, Check, Human, Gift, Repeat, Heart } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { AndroidPlayStoreButton } from '../components/AndroidPlayStoreButton';
import type { ChangelogData } from '../types/changelog';
import {
  fetchReferralCode,
  fetchReferralStats,
  fetchSocialStatus,
  fetchSocialTweets,
  linkTwitter,
  unlinkTwitter,
  claimFollow,
  claimLike,
  claimRetweet,
} from '../api';
export function EarnPoints() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState('');
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

  const linkTwitterMutation = useMutation({
    mutationFn: (username: string) => linkTwitter(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialStatus'] });
      setTwitterHandle('');
    },
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Hero */}
      <div className="text-center py-6">
        <h1
          className="text-4xl md:text-5xl uppercase tracking-widest text-m2e-accent"
          style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}
        >
          Earn More SAP
        </h1>
        <p className="text-xl text-m2e-text-secondary mt-2 max-w-lg mx-auto">
          Multiple ways to earn SAP in the Galavant ecosystem — walk, engage, and refer friends.
        </p>
      </div>

      {/* Top Tier — Testing Tasks & Walk to Earn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Testing Tasks */}
        <div className="pixel-card p-6 space-y-4 border-2 border-m2e-accent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-m2e-accent/10 flex items-center justify-center">
              <Gift className="w-7 h-7 text-m2e-accent" />
            </div>
            <h2 className="text-2xl uppercase tracking-wide text-m2e-text">
              Testing Tasks
            </h2>
          </div>
          <p className="text-lg text-m2e-text-secondary">
            Complete 16 testnet tasks to earn up to <span className="text-m2e-accent font-bold">2,300 SAP</span>. Your points will count toward the mainnet airdrop allocation.
          </p>
          <Link
            to="/tasks"
            className="pixel-btn pixel-btn-primary px-4 py-2 text-sm inline-flex items-center gap-2 no-underline font-bold"
          >
            View Tasks
          </Link>
        </div>

        {/* Walk to Earn */}
        <div className="pixel-card p-6 space-y-4 border-2 border-m2e-accent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-m2e-accent/10 flex items-center justify-center">
              <Coins className="w-7 h-7 text-m2e-accent" />
            </div>
            <h2 className="text-2xl uppercase tracking-wide text-m2e-text">
              Walk to Earn
            </h2>
          </div>
          <p className="text-lg text-m2e-text-secondary">
            Equip a bike and walk or run in the Galavant mobile app. Earn SAP every minute of activity based on your bike stats and bonuses.
          </p>
          <div className="flex items-center gap-3">
            {changelogData?.testflightUrl && (
              <a
                href={changelogData.testflightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-sm px-4 py-2 no-underline whitespace-nowrap"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                iOS
              </a>
            )}
            <AndroidPlayStoreButton playStoreUrl={changelogData?.playStoreUrl} variant="compact" />

          </div>
        </div>
      </div>

      {/* Social Tasks */}
      <div className="pixel-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-m2e-info/10 flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-m2e-info" />
            </div>
            <h2 className="text-2xl uppercase tracking-wide text-m2e-text">
              Social Tasks
            </h2>
          </div>

          {/* X account connection — top right of card header */}
          {!isAuthenticated ? (
            <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-3 py-1 text-xs shrink-0">
              Login
            </button>
          ) : !socialStatus?.twitterLinked ? (
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="@username"
                className="w-32 pixel-border border-m2e-border bg-m2e-bg-alt px-2 py-1 text-xs text-m2e-text placeholder:text-m2e-text-muted"
              />
              <button
                onClick={() => linkTwitterMutation.mutate(twitterHandle)}
                disabled={!twitterHandle.trim() || linkTwitterMutation.isPending}
                className="pixel-btn pixel-btn-primary px-3 py-1 text-xs disabled:opacity-50"
              >
                {linkTwitterMutation.isPending ? '...' : 'Link'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-m2e-text font-mono">@{socialStatus.twitterUsername}</span>
              <button
                onClick={() => { if (confirm('Unlink your X account?')) unlinkTwitterMutation.mutate(); }}
                disabled={unlinkTwitterMutation.isPending}
                className="pixel-btn pixel-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
              >
                Unlink
              </button>
            </div>
          )}
        </div>

        {linkTwitterMutation.isError && (
          <p className="text-xs text-m2e-danger">{(linkTwitterMutation.error as Error).message}</p>
        )}

        <p className="text-lg text-m2e-text-secondary">
          Engage with Galavant on X (Twitter) to earn SAP. Follow <span className="text-m2e-accent">@GalavantBTC</span> and interact with our posts — each follow, like, and retweet earns you <span className="text-m2e-accent font-bold">10 SAP</span>.
        </p>

        {isAuthenticated && socialStatus?.twitterLinked && (
          <div className="space-y-4">
            {/* Follow Task */}
            <div className="pixel-border border-m2e-border p-3 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm text-m2e-text">Follow @GalavantBTC</p>
                <p className="text-xs text-m2e-text-muted">10 SAP reward</p>
              </div>
              {socialStatus.followClaimed ? (
                <span className="pixel-border border-m2e-success bg-m2e-success/10 px-3 py-1 text-xs uppercase tracking-wide text-m2e-success flex items-center gap-1">
                  <Check className="w-3 h-3" /> Claimed
                </span>
              ) : !followClicked ? (
                <a
                  href="https://x.com/intent/follow?screen_name=GalavantBTC"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setFollowClicked(true)}
                  className="pixel-btn pixel-btn-primary px-3 py-1 text-xs no-underline"
                >
                  Follow on X
                </a>
              ) : (
                <button
                  onClick={() => claimFollowMutation.mutate()}
                  disabled={claimFollowMutation.isPending}
                  className="pixel-btn pixel-btn-primary px-3 py-1 text-xs disabled:opacity-50"
                >
                  {claimFollowMutation.isPending ? 'Claiming...' : 'Claim 10 SAP'}
                </button>
              )}
            </div>
            {claimFollowMutation.isError && (
              <p className="text-xs text-m2e-danger">{(claimFollowMutation.error as Error).message}</p>
            )}

            {/* Tweet Interactions — Card Grid + Pagination */}
            {socialTweets.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-wide text-m2e-text-secondary">
                  Like & Retweet to Earn
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {visibleTweets.map((tweet) => {
                    const visited = visitedTweets.has(tweet.twitterId);
                    return (
                      <div
                        key={tweet.twitterId}
                        className="pixel-card p-3 flex flex-col gap-2"
                      >
                        {/* Tweet body — 3 lines max */}
                        <p className="text-xs text-m2e-text line-clamp-3 flex-1 leading-relaxed">
                          {tweet.content}
                        </p>

                        {/* Metrics row */}
                        <div className="flex items-center gap-3 text-xs text-m2e-text-muted">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {tweet.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat className="w-3 h-3" /> {tweet.retweets}
                          </span>
                        </div>

                        {/* Open on X link */}
                        <a
                          href={`https://x.com/GalavantBTC/status/${tweet.twitterId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setVisitedTweets((prev) => new Set(prev).add(tweet.twitterId))}
                          className="pixel-btn pixel-btn-outline px-2 py-1 text-xs no-underline inline-flex items-center gap-1 justify-center"
                        >
                          Open on X <ExternalLink className="w-3 h-3" />
                        </a>

                        {/* Claim buttons */}
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
                              <Heart className="w-3 h-3 inline mr-1" />10 SAP
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
                              <Repeat className="w-3 h-3 inline mr-1" />10 SAP
                            </button>
                          ) : (
                            <span className="flex-1 text-center text-xs text-m2e-text-muted italic">
                              RT
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalTweetPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      onClick={() => setTweetPage((p) => Math.max(0, p - 1))}
                      disabled={tweetPage === 0}
                      className="pixel-btn pixel-btn-secondary px-3 py-1 text-xs disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="text-xs text-m2e-text-muted">
                      Page {tweetPage + 1} of {totalTweetPages}
                    </span>
                    <button
                      onClick={() => setTweetPage((p) => Math.min(totalTweetPages - 1, p + 1))}
                      disabled={tweetPage >= totalTweetPages - 1}
                      className="pixel-btn pixel-btn-secondary px-3 py-1 text-xs disabled:opacity-40"
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

      </div>

      {/* Referral Program */}
      <div className="pixel-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-m2e-success/10 flex items-center justify-center">
            <Human className="w-6 h-6 text-m2e-success" />
          </div>
          <h2 className="text-2xl uppercase tracking-wide text-m2e-text">
            Referral Program
          </h2>
        </div>
        <p className="text-lg text-m2e-text-secondary">
          Share your referral link. Earn <span className="text-m2e-accent">50 SAP</span> when a friend signs up with Google and links their wallet.
        </p>

        {isAuthenticated ? (
          <div className="space-y-4">
            {/* Referral Link */}
            {referralLink && (
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-m2e-text-secondary">
                  Your Referral Link
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 pixel-border border-m2e-border bg-m2e-bg-alt px-3 py-2 text-xs font-mono text-m2e-text truncate">
                    {referralLink}
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="pixel-btn pixel-btn-primary px-3 py-2 text-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-m2e-text-muted">
                  Code: <span className="font-mono text-m2e-text">{referralData?.referralCode}</span>
                </p>
              </div>
            )}

            {/* Referral Stats */}
            {referralStats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="pixel-card p-3 text-center">
                  <span className="text-2xl text-m2e-text">{referralStats.completed}</span>
                  <p className="text-xs uppercase tracking-wide text-m2e-text-muted mt-1">
                    Successful
                  </p>
                </div>
                <div className="pixel-card p-3 text-center">
                  <span className="text-2xl text-m2e-text">{referralStats.pending}</span>
                  <p className="text-xs uppercase tracking-wide text-m2e-text-muted mt-1">
                    Pending
                  </p>
                </div>
                <div className="pixel-card p-3 text-center">
                  <span className="text-2xl text-m2e-accent">{referralStats.totalEarned}</span>
                  <p className="text-xs uppercase tracking-wide text-m2e-text-muted mt-1">
                    SAP Earned
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-4 py-2 text-sm">
            Login to See Your Referral Code
          </button>
        )}
      </div>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
