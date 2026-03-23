import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Coins, ExternalLink, Copy, Check, Human, Gift, Repeat, Heart } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import type { ChangelogData } from '../types/changelog';
import {
  fetchReferralCode,
  fetchReferralStats,
  fetchSocialStatus,
  fetchSocialTweets,
  linkTwitter,
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
            {changelogData?.versions[0]?.apkUrl && (
              <a
                href={changelogData.versions[0].apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn inline-flex items-center gap-2 text-sm px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 no-underline whitespace-nowrap"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Android
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Social Tasks */}
      <div className="pixel-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-m2e-info/10 flex items-center justify-center">
            <ExternalLink className="w-6 h-6 text-m2e-info" />
          </div>
          <h2 className="text-2xl uppercase tracking-wide text-m2e-text">
            Social Tasks
          </h2>
        </div>
        <p className="text-lg text-m2e-text-secondary">
          Engage with Galavant on X (Twitter) to earn SAP. Link your account, follow <span className="text-m2e-accent">@GalavantBTC</span>, and interact with our posts — each follow, like, and retweet earns you <span className="text-m2e-accent font-bold">10 SAP</span>. New tweets are added regularly, so keep checking back for fresh earning opportunities.
        </p>

        {!isAuthenticated ? (
          <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-4 py-2 text-sm">
            Login to Start Earning
          </button>
        ) : !socialStatus?.twitterLinked ? (
          /* Link Twitter */
          <div className="space-y-2">
            <p className="text-sm text-m2e-text-secondary">Link your X account to claim social rewards:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="@username"
                className="flex-1 pixel-border border-m2e-border bg-m2e-bg-alt px-3 py-2 text-sm text-m2e-text placeholder:text-m2e-text-muted"
              />
              <button
                onClick={() => linkTwitterMutation.mutate(twitterHandle)}
                disabled={!twitterHandle.trim() || linkTwitterMutation.isPending}
                className="pixel-btn pixel-btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                {linkTwitterMutation.isPending ? 'Linking...' : 'Link'}
              </button>
            </div>
            {linkTwitterMutation.isError && (
              <p className="text-xs text-m2e-danger">{(linkTwitterMutation.error as Error).message}</p>
            )}
          </div>
        ) : (
          /* Twitter linked — show tasks */
          <div className="space-y-4">
            <p className="text-sm text-m2e-text-muted">
              Linked as <span className="text-m2e-text font-mono">@{socialStatus.twitterUsername}</span>
            </p>

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

            {/* Tweet Interactions */}
            {socialTweets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-m2e-text-secondary">
                  Like & Retweet to Earn
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {socialTweets.map((tweet) => (
                    <div key={tweet.twitterId} className="pixel-border border-m2e-border p-3 space-y-2">
                      <p className="text-sm text-m2e-text line-clamp-2">{tweet.content}</p>
                      <div className="flex items-center gap-3 text-xs text-m2e-text-muted">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {tweet.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3 h-3" /> {tweet.retweets}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`https://x.com/GalavantBTC/status/${tweet.twitterId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pixel-btn pixel-btn-outline px-2 py-1 text-xs no-underline inline-flex items-center gap-1"
                        >
                          Open on X <ExternalLink className="w-3 h-3" />
                        </a>
                        {tweet.likeClaimed ? (
                          <span className="text-xs text-m2e-success flex items-center gap-1">
                            <Check className="w-3 h-3" /> Like claimed
                          </span>
                        ) : (
                          <button
                            onClick={() => claimLikeMutation.mutate(tweet.twitterId)}
                            disabled={claimLikeMutation.isPending}
                            className="pixel-btn pixel-btn-primary px-2 py-1 text-xs disabled:opacity-50"
                          >
                            Claim Like (10 SAP)
                          </button>
                        )}
                        {tweet.retweetClaimed ? (
                          <span className="text-xs text-m2e-success flex items-center gap-1">
                            <Check className="w-3 h-3" /> Retweet claimed
                          </span>
                        ) : (
                          <button
                            onClick={() => claimRetweetMutation.mutate(tweet.twitterId)}
                            disabled={claimRetweetMutation.isPending}
                            className="pixel-btn pixel-btn-primary px-2 py-1 text-xs disabled:opacity-50"
                          >
                            Claim Retweet (10 SAP)
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {claimLikeMutation.isError && (
                  <p className="text-xs text-m2e-danger">{(claimLikeMutation.error as Error).message}</p>
                )}
                {claimRetweetMutation.isError && (
                  <p className="text-xs text-m2e-danger">{(claimRetweetMutation.error as Error).message}</p>
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
