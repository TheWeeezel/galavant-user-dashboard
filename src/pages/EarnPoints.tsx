import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Coins, ExternalLink, Copy, Check, Human, Gift, Repeat, Heart } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
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

      {/* Testing Tasks */}
      <div className="pixel-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-m2e-accent/10 flex items-center justify-center">
            <Gift className="w-6 h-6 text-m2e-accent" />
          </div>
          <h2 className="text-2xl uppercase tracking-wide text-m2e-text">
            Testing Tasks
          </h2>
        </div>
        <p className="text-lg text-m2e-text-secondary">
          Complete 16 testnet tasks to earn up to <span className="text-m2e-accent">2,300 SAP</span>. Your points will count toward the mainnet airdrop allocation.
        </p>
        <Link
          to="/tasks"
          className="pixel-btn pixel-btn-primary px-4 py-2 text-sm inline-flex items-center gap-2 no-underline"
        >
          View Tasks
        </Link>
      </div>

      {/* Walk to Earn */}
      <div className="pixel-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-m2e-accent/10 flex items-center justify-center">
            <Coins className="w-6 h-6 text-m2e-accent" />
          </div>
          <h2 className="text-2xl uppercase tracking-wide text-m2e-text">
            Walk to Earn
          </h2>
        </div>
        <p className="text-lg text-m2e-text-secondary">
          Equip a bike and walk or run in the Galavant mobile app. Earn SAP every minute of activity based on your bike stats and bonuses.
        </p>
        <a
          href="https://galavant.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="pixel-btn pixel-btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2 no-underline"
        >
          Download the App
          <ExternalLink className="w-4 h-4" />
        </a>
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
          Follow @GalavantBTC on X, like and retweet our posts to earn <span className="text-m2e-accent">10 SAP</span> per action.
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
              ) : (
                <div className="flex items-center gap-2">
                  <a
                    href="https://x.com/intent/follow?screen_name=GalavantBTC"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-btn pixel-btn-outline px-3 py-1 text-xs no-underline"
                  >
                    Follow
                  </a>
                  <button
                    onClick={() => claimFollowMutation.mutate()}
                    disabled={claimFollowMutation.isPending}
                    className="pixel-btn pixel-btn-primary px-3 py-1 text-xs disabled:opacity-50"
                  >
                    {claimFollowMutation.isPending ? 'Claiming...' : 'Claim 10 SAP'}
                  </button>
                </div>
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
              </div>
            )}
          </div>
        )}

        {/* Discord link (always visible) */}
        <a
          href="https://discord.gg/galavant"
          target="_blank"
          rel="noopener noreferrer"
          className="pixel-btn pixel-btn-outline px-3 py-2 text-sm no-underline inline-flex items-center gap-2"
        >
          Join Discord
        </a>
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

      {/* Dashboard Engagement */}
      <div className="pixel-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-m2e-warning/10 flex items-center justify-center">
            <Coins className="w-6 h-6 text-m2e-warning" />
          </div>
          <h2 className="text-2xl uppercase tracking-wide text-m2e-text">
            Dashboard Engagement
          </h2>
        </div>
        <p className="text-lg text-m2e-text-secondary">
          Stay active on the dashboard, check in regularly, and explore the marketplace. More engagement rewards coming soon.
        </p>
        <span className="inline-block pixel-border border-m2e-warning bg-m2e-warning/10 px-2 py-1 text-xs uppercase tracking-wide text-m2e-warning">
          Coming Soon
        </span>
      </div>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
