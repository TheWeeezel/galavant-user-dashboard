import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Coins, ExternalLink, Copy, Check, Human, Gift } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { fetchReferralCode, fetchReferralStats } from '../api';

export function EarnPoints() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [copied, setCopied] = useState(false);

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
 Complete 13 testnet tasks to earn up to <span className="text-m2e-accent">1,800 SAP</span>. Your points will count toward the mainnet airdrop allocation.
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
 <div className="pixel-card p-5 space-y-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-m2e-info/10 flex items-center justify-center">
 <ExternalLink className="w-6 h-6 text-m2e-info" />
          </div>
 <h2 className="text-2xl uppercase tracking-wide text-m2e-text">
            Social Tasks
          </h2>
        </div>
 <p className="text-lg text-m2e-text-secondary">
          Follow @Galavant on X, like and retweet posts, and join our Discord community. Task verification and rewards coming soon.
        </p>
 <div className="flex flex-wrap gap-2">
          <a
            href="https://x.com/GalavantBTC"
            target="_blank"
            rel="noopener noreferrer"
 className="pixel-btn pixel-btn-outline px-3 py-2 text-sm no-underline"
          >
            Follow on X
          </a>
          <a
            href="https://discord.gg/galavant"
            target="_blank"
            rel="noopener noreferrer"
 className="pixel-btn pixel-btn-outline px-3 py-2 text-sm no-underline"
          >
            Join Discord
          </a>
        </div>
 <span className="inline-block pixel-border border-m2e-info bg-m2e-info/10 px-2 py-1 text-xs uppercase tracking-wide text-m2e-info">
          Verification Coming Soon
        </span>
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
