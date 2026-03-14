import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Human, Coins, Zap, Redo, Copy, Check, Logout } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { StatCard } from '../components/StatCard';
import { NftDetailModal } from '../components/NftDetailModal';
import { fetchSpendingWallet, fetchUserBikes, fetchUserParts } from '../api';
import type { UserBike, UserPart } from '../api';
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

export function Profile() {
  const { isAuthenticated, isRestoring, isLoading, user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);

  console.log('[Profile] render — isAuthenticated:', isAuthenticated, 'isRestoring:', isRestoring, 'isLoading:', isLoading, 'user:', user?.nickname ?? null);

  const { data: spending, error: spendingErr } = useQuery({
    queryKey: ['spending'],
    queryFn: fetchSpendingWallet,
    enabled: isAuthenticated,
  });

  const { data: bikes, error: bikesErr } = useQuery({
    queryKey: ['userBikes'],
    queryFn: fetchUserBikes,
    enabled: isAuthenticated,
  });

  const { data: parts, error: partsErr } = useQuery({
    queryKey: ['userParts'],
    queryFn: fetchUserParts,
    enabled: isAuthenticated,
  });

  if (spendingErr) console.error('[Profile] spending query error:', spendingErr);
  if (bikesErr) console.error('[Profile] bikes query error:', bikesErr);
  if (partsErr) console.error('[Profile] parts query error:', partsErr);

  if (isRestoring) {
    return (
 <div className="flex items-center justify-center py-20">
 <p className="text-m2e-text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
 <div className="flex flex-col items-center justify-center py-20 gap-6">
 <Human className="w-16 h-16 text-m2e-text-muted" />
 <p className="text-lg uppercase tracking-wider text-m2e-text-secondary">
          Login to view your profile
        </p>
 <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-6 py-3 text-sm">
          Login
        </button>
        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(user.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters} m`;
  };

  return (
 <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <h1
 className="text-2xl md:text-3xl uppercase tracking-widest text-m2e-accent"
        style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}
      >
        Profile
      </h1>

      {/* User Info Card */}
 <div className="pixel-card p-5">
 <div className="flex items-center gap-4 mb-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
 className="w-14 h-14 rounded-lg pixel-border border-m2e-border object-cover"
            />
          ) : (
 <div className="w-14 h-14 rounded-lg pixel-border border-m2e-border bg-m2e-bg-alt flex items-center justify-center">
 <span className="text-2xl text-m2e-text-secondary">
                {user.nickname[0].toUpperCase()}
              </span>
            </div>
          )}
 <div className="flex-1 min-w-0">
 <p className="text-lg text-m2e-accent uppercase tracking-wider truncate">
              {user.nickname}
            </p>
 <p className="text-xs text-m2e-text-muted uppercase tracking-wider">
              {user.authProvider === 'google' ? 'Google Account' : 'Wallet Auth'}
            </p>
          </div>
        </div>

 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <span className="text-xs text-m2e-text-secondary uppercase tracking-wider">
              Wallet
            </span>
 <span className="text-xs text-m2e-text truncate flex-1 font-mono">
              {user.walletAddress.slice(0, 12)}...{user.walletAddress.slice(-8)}
            </span>
 <button onClick={handleCopy} className="pixel-icon-btn w-6 h-6 text-m2e-text-muted hover:text-m2e-accent">
 {copied ? <Check className="w-4 h-4 text-m2e-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {user.hasGoogleLinked && user.linkedEmail && (
 <div className="flex items-center gap-2">
 <span className="text-xs text-m2e-text-secondary uppercase tracking-wider">
                Email
              </span>
 <span className="text-xs text-m2e-text truncate flex-1">
                {user.linkedEmail}
              </span>
 <Check className="w-4 h-4 text-m2e-success" />
            </div>
          )}
        </div>
      </div>

      {/* Lifetime Stats */}
 <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Zap}
          label="Distance"
          value={formatDistance(user.totalDistance)}
        />
        <StatCard
          icon={Coins}
          label="SAP Earned"
          value={user.totalSapEarned.toLocaleString()}
        />
        <StatCard
          icon={Redo}
          label="Activities"
          value={user.totalActivities}
        />
      </div>

      {/* SAP Balance */}
 <div className="pixel-card p-5">
 <h2 className="text-sm uppercase tracking-widest text-m2e-text-secondary mb-3">
          SAP Balance
        </h2>
 <div className="flex items-center justify-between">
          <div>
            <span
 className="text-3xl text-m2e-accent"
              style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}
            >
              {spending?.sapBalance?.toLocaleString() ?? '—'}
            </span>
 <span className="text-sm text-m2e-text-muted ml-2 uppercase">SAP</span>
          </div>
 <div className="flex gap-2">
            <Link
              to="/tasks"
 className="pixel-btn pixel-btn-outline px-4 py-2 text-xs no-underline"
            >
              Tasks
            </Link>
            <Link
              to="/earn"
 className="pixel-btn pixel-btn-primary px-4 py-2 text-xs no-underline"
            >
              Earn More
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory — Bikes */}
 <div className="pixel-card p-5">
 <h2 className="text-sm uppercase tracking-widest text-m2e-text-secondary mb-4">
          Your Bikes
        </h2>
        {bikes && bikes.length > 0 ? (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bikes.map((bike: UserBike) => {
              const imageUrl = bike.imageUrl
                ? (bike.imageUrl.startsWith('/') ? `${config.apiUrl}${bike.imageUrl}` : bike.imageUrl)
                : `${config.apiUrl}/art/bases/bike-${bike.type.toLowerCase()}.png`;
              const qualityBadge = `pixel-badge-${bike.quality}`;
              return (
 <div key={bike.id} className="pixel-card overflow-hidden hover:border-m2e-accent-dark transition-colors cursor-pointer" onClick={() => setSelectedBikeId(bike.id)}>
 <div className="relative aspect-[16/9] bg-m2e-bg-alt border-b-2 border-m2e-border flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt={`${bike.type} bike`}
 className="w-full h-full object-cover pixel-render"
                      loading="lazy"
                    />
                    {bike.isEquipped && (
 <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] bg-m2e-success text-m2e-text-on-accent pixel-border shadow-sm tracking-wide border-green-800">
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
 <div className="flex items-center justify-between text-xs text-m2e-text-muted tracking-wide uppercase">
                      <span>Balance Bike</span>
                      <span>Lv. {bike.level}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
 <p className="text-sm text-m2e-text-muted text-center py-6">No bikes yet</p>
        )}
      </div>

      {/* Inventory — Parts */}
 <div className="pixel-card p-5">
 <h2 className="text-sm uppercase tracking-widest text-m2e-text-secondary mb-4">
          Your Parts
        </h2>
        {parts && parts.length > 0 ? (
 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {parts.map((part: UserPart) => (
 <div key={part.id} className={`pixel-card overflow-hidden ${PART_TYPE_COLORS[part.type] ?? ''}`}>
 <div className="bg-m2e-bg-alt p-2 flex items-center justify-center">
                  <img
                    src={getPartImageUrl(part.type, part.level)}
                    alt={`${part.type} Lv.${part.level}`}
 className="w-16 h-16 object-contain pixel-render"
                    loading="lazy"
                  />
                </div>
 <div className="px-2 py-2 text-center border-t border-m2e-border">
 <p className="text-xs uppercase text-m2e-text">
                    {PART_TYPE_LABELS[part.type] ?? part.type}
                  </p>
 <p className="text-xs text-m2e-text-muted uppercase">
                    Lv. {part.level}
                  </p>
 <p className="text-[10px] uppercase tracking-wider mt-0.5">
                    {part.socketedInBike ? (
 <span className="text-m2e-success">In Use</span>
                    ) : (
 <span className="text-m2e-text-muted">Free</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
 <p className="text-sm text-m2e-text-muted text-center py-6">No parts yet</p>
        )}
      </div>

      {/* Logout */}
 <button onClick={logout} className="pixel-btn pixel-btn-danger w-full px-4 py-3 text-sm">
 <Logout className="w-5 h-5 mr-2" />
        Logout
      </button>

      {/* Bike Detail Modal */}
      {selectedBikeId && (
        <NftDetailModal nftId={selectedBikeId} onClose={() => setSelectedBikeId(null)} />
      )}
    </div>
  );
}
