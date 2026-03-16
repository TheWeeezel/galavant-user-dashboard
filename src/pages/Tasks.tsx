import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Login, Human, Download, Upload,
  Store, ShoppingCart, Coins,
  SpeedFast, Zap, Heart,
  Redo, Fire, Gift, Check,
  ExternalLink, Loader,
} from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { fetchTestingTasks, claimTestingTask, fetchBonusClaimStatus, claimBonusBike } from '../api';
import type { TestingTask } from '../api';
import type { ComponentType, SVGProps } from 'react';

const CATEGORY_LABELS: Record<string, string> = {
  getting_started: 'Getting Started',
  marketplace: 'Marketplace',
  bike_progression: 'Bike Progression',
  economy: 'Economy',
  wallet: 'Wallet',
};

const CATEGORY_ORDER = ['getting_started', 'marketplace', 'bike_progression', 'economy', 'wallet'];

const TASK_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  create_wallet: Login,
  connect_google: Human,
  import_wallet: Upload,
  fund_wallet: Download,
  list_marketplace: Store,
  buy_marketplace: ShoppingCart,
  sell_marketplace: Coins,
  level_up: SpeedFast,
  part_upgrade: Zap,
  breed_bike: Heart,
  convert_points_to_tokens: Redo,
  convert_btc_to_sat: Fire,
  convert_sat_to_points: Gift,
  export_bike_to_wallet: ExternalLink,
  import_bike_from_wallet: Loader,
};

export function Tasks() {
  const { isAuthenticated, isRestoring } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTestingTasks,
    enabled: isAuthenticated,
  });

  const claimMutation = useMutation({
    mutationFn: claimTestingTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['spending'] });
    },
  });

  if (isRestoring) {
    return (
 <div className="flex items-center justify-center py-20">
 <p className="text-m2e-text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
 <div className="flex flex-col items-center justify-center py-20 gap-6">
 <Human className="w-16 h-16 text-m2e-text-muted" />
 <p className="text-lg uppercase tracking-wider text-m2e-text-secondary">
          Login to view testing tasks
        </p>
 <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-6 py-3 text-sm">
          Login
        </button>
        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  const tasks = data?.tasks ?? [];
  const completedCount = tasks.filter((t) => t.status === 'completed' || t.status === 'claimed').length;
  const claimedCount = tasks.filter((t) => t.status === 'claimed').length;
  const earnedPoints = tasks
    .filter((t) => t.status === 'claimed')
    .reduce((sum, t) => sum + t.reward, 0);
  const totalPoints = tasks.reduce((sum, t) => sum + t.reward, 0);

  // Group by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    tasks: tasks.filter((t) => t.category === cat),
  })).filter((g) => g.tasks.length > 0);

  return (
 <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <h1
 className="text-2xl md:text-3xl uppercase tracking-widest text-m2e-accent"
        style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}
      >
        Testing Tasks
      </h1>

      {/* Progress card */}
 <div className="pixel-card p-5 space-y-4">
 <div className="flex items-center justify-between">
          <div>
 <span className="text-3xl text-m2e-text">{completedCount}</span>
 <span className="text-sm text-m2e-text-muted ml-1">/ {tasks.length} Tasks</span>
          </div>
 <div className="text-right">
            <span
 className="text-3xl text-m2e-accent"
              style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}
            >
              {earnedPoints.toLocaleString()}
            </span>
 <span className="text-sm text-m2e-text-muted ml-1">/ {totalPoints.toLocaleString()} SAT</span>
          </div>
        </div>
        {/* Progress bar */}
 <div className="w-full h-4 pixel-border border-m2e-border bg-m2e-bg-alt overflow-hidden">
          <div
 className="h-full bg-m2e-accent transition-all duration-500"
            style={{ width: tasks.length > 0 ? `${(claimedCount / tasks.length) * 100}%` : '0%' }}
          />
        </div>
 <p className="text-xs uppercase tracking-wide text-m2e-text-muted text-center">
          Complete all tasks to maximize your testnet airdrop allocation
        </p>
      </div>

      <BonusClaims />

      {isLoading ? (
 <div className="flex items-center justify-center py-12">
 <p className="text-m2e-text-muted uppercase tracking-widest">Loading tasks...</p>
        </div>
      ) : (
        grouped.map((group) => (
 <div key={group.key} className="space-y-3">
 <h2 className="text-sm uppercase tracking-widest text-m2e-text-secondary">
              {group.label}
            </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClaim={() => claimMutation.mutate(task.id)}
                  isClaiming={claimMutation.isPending && claimMutation.variables === task.id}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function TaskCard({
  task,
  onClaim,
  isClaiming,
}: {
  task: TestingTask;
  onClaim: () => void;
  isClaiming: boolean;
}) {
  const Icon = TASK_ICONS[task.id] ?? Coins;
  const isClaimed = task.status === 'claimed';
  const isCompleted = task.status === 'completed';

  const borderClass = isClaimed
    ? 'border-m2e-success'
    : isCompleted
      ? 'border-m2e-accent'
      : '';

  return (
 <div className={`pixel-card p-4 space-y-3 ${borderClass}`}>
 <div className="flex items-start gap-3">
        <div
 className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isClaimed
              ? 'bg-m2e-success/10'
              : isCompleted
                ? 'bg-m2e-accent/10'
                : 'bg-m2e-bg-alt'
          }`}
        >
          {isClaimed ? (
 <Check className="w-6 h-6 text-m2e-success" />
          ) : (
            <Icon
 className={`w-6 h-6 ${isCompleted ? 'text-m2e-accent' : 'text-m2e-text-muted'}`}
            />
          )}
        </div>
 <div className="flex-1 min-w-0">
          <p
 className={`text-sm uppercase tracking-wide ${
              isClaimed ? 'text-m2e-success' : 'text-m2e-text'
            }`}
          >
            {task.title}
          </p>
 <p className="text-xs text-m2e-text-muted mt-0.5">{task.description}</p>
        </div>
      </div>
 <div className="flex items-center justify-between">
        <span
 className={`text-sm ${
            isClaimed
              ? 'text-m2e-success'
              : isCompleted
                ? 'text-m2e-accent'
                : 'text-m2e-text-muted'
          }`}
        >
          +{task.reward} SAT
        </span>
        {isCompleted && (
          <button
            onClick={onClaim}
            disabled={isClaiming}
 className="pixel-btn pixel-btn-primary px-3 py-1.5 text-xs"
          >
            {isClaiming ? 'Claiming...' : 'Claim'}
          </button>
        )}
        {isClaimed && (
 <span className="text-xs uppercase tracking-wide text-m2e-success flex items-center gap-1">
 <Check className="w-4 h-4" /> Claimed
          </span>
        )}
      </div>
    </div>
  );
}

const BONUS_BIKE_TYPES = ['commuter', 'touring', 'racing'] as const;
const BONUS_BIKE_LABELS: Record<string, string> = {
  commuter: 'Commuter',
  touring: 'Touring',
  racing: 'Racing',
};

function BonusClaims() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ['bonus-claim-status'],
    queryFn: fetchBonusClaimStatus,
    enabled: isAuthenticated,
  });

  const claimMutation = useMutation({
    mutationFn: claimBonusBike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-claim-status'] });
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
    },
  });

  if (!isAuthenticated) return null;

  // Loading state — show placeholder so the section is always visible
  if (!status) {
    return (
 <div className="pixel-card p-5 space-y-2">
 <h2 className="text-sm uppercase tracking-widest text-m2e-text-secondary">Bonus Claims</h2>
 <p className="text-xs text-m2e-text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  // Already claimed
  if (status.claimed) {
    return (
 <div className="pixel-card p-5 border-m2e-success space-y-2">
 <h2 className="text-sm uppercase tracking-widest text-m2e-text-secondary">Bonus Claims</h2>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-m2e-success/10">
 <Check className="w-6 h-6 text-m2e-success" />
          </div>
 <div>
 <p className="text-sm uppercase tracking-wide text-m2e-success">Bonus bike claimed!</p>
 <p className="text-xs text-m2e-text-muted mt-0.5">Your Uncommon bike has been added to your inventory.</p>
          </div>
        </div>
      </div>
    );
  }

  // Eligible — show bike type choices
  if (status.eligible) {
    return (
 <div className="pixel-card p-5 border-m2e-accent space-y-3">
 <h2 className="text-sm uppercase tracking-widest text-m2e-text-secondary">Bonus Claims</h2>
 <p className="text-xs text-m2e-text-muted">
          Choose an Uncommon bike as your bonus reward!
        </p>
 <div className="grid grid-cols-3 gap-3">
          {BONUS_BIKE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => claimMutation.mutate(type)}
              disabled={claimMutation.isPending}
 className="pixel-btn pixel-btn-primary py-3 text-xs uppercase tracking-wide disabled:opacity-50"
            >
              {claimMutation.isPending && claimMutation.variables === type
                ? 'Claiming...'
                : BONUS_BIKE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Not eligible — locked state
  return (
 <div className="pixel-card p-5 space-y-2">
 <h2 className="text-sm uppercase tracking-widest text-m2e-text-secondary">Bonus Claims</h2>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-m2e-bg-alt">
 <Gift className="w-6 h-6 text-m2e-text-muted" />
        </div>
 <div>
 <p className="text-sm uppercase tracking-wide text-m2e-text-muted">Bonus Bike Locked</p>
 <p className="text-xs text-m2e-text-muted mt-0.5">Complete any task to unlock a free Uncommon bike of your choice.</p>
        </div>
      </div>
    </div>
  );
}
