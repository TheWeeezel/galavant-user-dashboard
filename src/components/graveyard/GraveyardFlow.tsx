import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WalletAccount } from '@wallet-standard/base';
import { Check, Lock } from 'pixelarticons/react';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config';
import { materialName } from '../StoreBikeCard';
import {
  ApiError,
  fetchGraveyardMe,
  fetchGraveyardSneakers,
  fetchUserBikes,
  graveyardBindSoul,
  graveyardBurnTransaction,
  graveyardChallenge,
  graveyardReserve,
  graveyardSubmitBurn,
  graveyardVerifyWallet,
  type GraveyardClaim,
  type GraveyardMe,
  type GraveyardSneaker,
  type GraveyardVoucher,
  type UserBike,
} from '../../api';
import {
  connectWallet,
  phantomBrowseUrl,
  shortAddress,
  signAndSendTransaction,
  signMessage,
  useSolanaWallet,
} from '../../lib/wallet';
import {
  FramedBike,
  PixelGlyph,
  SneakerSprite,
  SUGGESTED_BIKE,
  bikeArtUrl,
  capitalize,
  formatDay,
  formatDayTimeUtc,
  qualityTextClass,
  sneakerKey,
  soulDetail,
  soulLine,
} from './Pixels';

/**
 * The sign-in-to-rebirth flow of the Sneaker Graveyard.
 *
 * There is no step state of its own: the step is READ off `/graveyard/me` every time. A burned
 * claim is the rebirth, a handed-in burn is the burning screen, an open reservation is the
 * farewell, a proven wallet is the sneaker list, nothing is the wallet step. So a reload — or a
 * phone that came back from Phantom with the page evicted — lands exactly where the player left,
 * and the server's answer is the only truth about what happened on the chain.
 */

/** Shared with the shop, which reads the same answer for the voucher. */
export const GRAVEYARD_ME_KEY = ['graveyard-me'] as const;

/**
 * Owner rule: a burn never gets more than Steel. The voucher buys one of the shop's Steel bikes,
 * and a soul only goes into a Steel bike the player owns — the server refuses any other with
 * code BIKE_NOT_STEEL, and the list here never offers one.
 */
const SOUL_QUALITY = 'common';
const isSoulBody = (bike: Pick<UserBike, 'quality'>) => bike.quality.toLowerCase() === SOUL_QUALITY;
// The garage's own key (Profile, MarketSellPanel), so a soul given here shows there without a refetch.
const BIKES_KEY = ['userBikes'] as const;

const VOUCHER_PERCENT_TEXT = '15 %';

type Step = 'signin' | 'wallet' | 'sneaker' | 'farewell' | 'rebirth';
const STEPS: { key: Step; label: string }[] = [
  { key: 'signin', label: 'Sign in' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'sneaker', label: 'Sneaker' },
  { key: 'farewell', label: 'Farewell' },
  { key: 'rebirth', label: 'Rebirth' },
];

function errorText(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'Something went wrong. Try again.';
}

function pickClaims(me: GraveyardMe, now: number) {
  const claims = me.claims;
  return {
    burned: claims.find((c) => c.status === 'burned') ?? null,
    pending: claims.find((c) => c.status === 'reserved' && c.burnSignature) ?? null,
    reserved: claims.find((c) => c.status === 'reserved' && !c.burnSignature && Date.parse(c.reservedUntil) > now) ?? null,
  };
}

export function GraveyardFlow({ onSignIn }: { onSignIn: () => void }) {
  const { isAuthenticated, isRestoring } = useAuth();
  const queryClient = useQueryClient();
  // Bumped when a hold runs out, so the step is derived again from a clock that has moved on.
  const [, setTick] = useState(0);
  const [wantAnotherWallet, setWantAnotherWallet] = useState(false);
  // "Not today" on the farewell: the reservation stays on the server for its half hour, the page
  // just shows the list again. The sneaker is marked as waiting there and re-enters the farewell.
  const [dismissedClaim, setDismissedClaim] = useState<string | null>(null);
  const [burnNotice, setBurnNotice] = useState<string | null>(null);

  const me = useQuery({
    queryKey: GRAVEYARD_ME_KEY,
    queryFn: fetchGraveyardMe,
    enabled: isAuthenticated,
    retry: false,
    // The server looks a handed-in burn up on every read; poll while one is pending
    // (finalisation takes 15–30 seconds).
    refetchInterval: (query) =>
      query.state.data?.claims.some((c) => c.status === 'reserved' && c.burnSignature) ? 2_000 : false,
  });

  // A burn the chain refused or dropped comes back as the reservation without its signature — or
  // no reservation at all once the half hour is over. Say so rather than silently show the list.
  const pendingRef = useRef<string | null>(null);
  useEffect(() => {
    const data = me.data;
    if (!data) return;
    const pending = data.claims.find((c) => c.status === 'reserved' && c.burnSignature);
    if (pending) {
      pendingRef.current = pending.id;
      return;
    }
    const was = pendingRef.current;
    if (!was) return;
    pendingRef.current = null;
    if (!data.claims.some((c) => c.id === was && c.status === 'burned')) {
      setBurnNotice('The burn did not go through — the chain never confirmed it. Your sneaker is still in your wallet, and nothing but the network fee was spent. Try again.');
    }
  }, [me.data]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: GRAVEYARD_ME_KEY });

  if (isRestoring || (isAuthenticated && me.isPending)) {
    return (
      <Shell step="signin">
        <div className="pixel-card h-56 animate-pulse" />
      </Shell>
    );
  }

  if (!isAuthenticated) {
    return (
      <Shell step="signin">
        <SignInCard onSignIn={onSignIn} />
      </Shell>
    );
  }

  if (me.isError) {
    const err = me.error;
    if (err instanceof ApiError && err.status === 404) return <Shell step="signin"><ClosedCard /></Shell>;
    if (err instanceof ApiError && err.status === 403 && err.code === 'GENESIS_BETA') return <Shell step="signin"><GenesisBetaCard /></Shell>;
    return (
      <Shell step="signin">
        <Card>
          <div className="section-label">Sneaker Graveyard</div>
          <h2 className="text-3xl uppercase tracking-wide leading-none">Could not load your graveyard</h2>
          <p className="text-m2e-danger-deep">&gt; {errorText(err)}</p>
          <button className="pixel-btn pixel-btn-secondary px-4 py-3 text-sm" onClick={() => me.refetch()}>Try again</button>
        </Card>
      </Shell>
    );
  }

  const data = me.data!;
  const { burned, pending, reserved } = pickClaims(data, Date.now());

  if (burned) {
    return burned.body ? (
      <Shell step="rebirth" done>
        <SoulGiven claim={burned} body={burned.body} />
      </Shell>
    ) : (
      <Shell step="rebirth">
        <Rebirth claim={burned} onBound={refresh} />
      </Shell>
    );
  }
  if (pending) {
    return (
      <Shell step="farewell">
        <Burning claim={pending} />
      </Shell>
    );
  }
  if (reserved && dismissedClaim !== reserved.id) {
    return (
      <Shell step="farewell">
        <Farewell
          claim={reserved}
          wallets={data.wallets}
          notice={burnNotice}
          onExpired={() => { setTick((t) => t + 1); refresh(); }}
          onNotToday={() => setDismissedClaim(reserved.id)}
        />
      </Shell>
    );
  }
  if (data.wallets.length === 0 || wantAnotherWallet) {
    return (
      <Shell step="wallet">
        <WalletStep
          proven={data.wallets}
          onProven={() => { setWantAnotherWallet(false); refresh(); }}
          onBack={data.wallets.length ? () => setWantAnotherWallet(false) : null}
        />
      </Shell>
    );
  }
  return (
    <Shell step="sneaker" wide>
      <SneakerStep
        me={data}
        notice={burnNotice}
        onDismissNotice={() => setBurnNotice(null)}
        onReserved={() => { setDismissedClaim(null); refresh(); }}
        onAnotherWallet={() => setWantAnotherWallet(true)}
      />
    </Shell>
  );
}

// ── Chrome ───────────────────────────────────────────────────────────────────

function Shell({ step, done = false, wide = false, children }: { step: Step; done?: boolean; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`mx-auto ${wide ? 'max-w-6xl' : 'max-w-[680px]'} space-y-5`}>
      <Stepper current={step} allDone={done} />
      {children}
    </div>
  );
}

function Stepper({ current, allDone }: { current: Step; allDone: boolean }) {
  const at = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Steps">
      {STEPS.map((s, i) => {
        const state = allDone || i < at ? 'done' : i === at ? 'now' : 'todo';
        const tone = state === 'done'
          ? 'border-m2e-success text-m2e-success-deep bg-m2e-card'
          : state === 'now'
            ? 'border-m2e-accent bg-m2e-accent text-m2e-text-on-accent'
            : 'border-m2e-border text-m2e-text-secondary bg-m2e-card';
        return (
          <li key={s.key} aria-current={state === 'now' ? 'step' : undefined} className={`border-2 px-2.5 py-0.5 text-sm ${tone}`}>
            {i + 1} {s.label}
          </li>
        );
      })}
    </ol>
  );
}

function Card({ tone, children }: { tone?: 'accent' | 'danger' | 'soft'; children: ReactNode }) {
  const border = tone === 'accent' ? 'border-m2e-accent' : tone === 'danger' ? 'border-m2e-danger' : '';
  return <div className={`pixel-card p-5 md:p-7 space-y-4 ${border}`}>{children}</div>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="section-label">{children}</div>;
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-3xl md:text-4xl uppercase tracking-wide leading-none">{children}</h2>;
}

function ErrorLine({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="text-sm text-m2e-danger-deep">&gt; {errorText(error)}</p>;
}

function Chip({ tone = 'plain', children }: { tone?: 'plain' | 'ok' | 'warn' | 'accent'; children: ReactNode }) {
  const cls = tone === 'ok'
    ? 'border-m2e-success text-m2e-success-deep'
    : tone === 'warn'
      ? 'border-m2e-warning text-m2e-warning-deep'
      : tone === 'accent'
        ? 'border-m2e-accent text-m2e-accent-dark'
        : 'border-m2e-border text-m2e-text-secondary';
  return <span className={`inline-block border-2 bg-m2e-card px-2 py-0.5 text-xs uppercase tracking-wider whitespace-nowrap ${cls}`}>{children}</span>;
}

// ── Gate states ──────────────────────────────────────────────────────────────

function SignInCard({ onSignIn }: { onSignIn: () => void }) {
  return (
    <Card>
      <Eyebrow>Step 1 of 5</Eyebrow>
      <H2>Sign in with your Galavant account</H2>
      <p className="text-lg text-m2e-text">
        The same Google account you use in the app. The voucher and the frame are delivered there, so the soul needs somewhere to land.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="pixel-btn pixel-btn-primary px-5 py-3 text-sm" onClick={onSignIn}>Sign in with Google</button>
        <span className="text-sm text-m2e-text-secondary">We never see your password.</span>
      </div>
      <hr className="border-t-2 border-m2e-border" />
      <p className="text-sm text-m2e-text-secondary">
        No Galavant account yet? Get the app and ride once first. A bike needs a rider before it can carry a soul.
      </p>
    </Card>
  );
}

function ClosedCard() {
  return (
    <Card>
      <Eyebrow>Sneaker Graveyard</Eyebrow>
      <H2>The graveyard opens soon</H2>
      <p className="text-lg">The gate is still closed. The wall below is open to everyone; come back for the rest.</p>
    </Card>
  );
}

/** The Genesis pass, as every new feature has it: a placeholder with the badge, never a silence. */
function GenesisBetaCard() {
  return (
    <Card tone="accent">
      <div className="flex flex-wrap items-center gap-3">
        <Eyebrow>Sneaker Graveyard</Eyebrow>
        <span className="pixel-border border-m2e-accent bg-m2e-accent text-m2e-text-on-accent px-2 py-0.5 text-xs uppercase tracking-[0.2em]">
          Genesis Beta
        </span>
      </div>
      <H2>Genesis holders go first</H2>
      <p className="text-lg">
        The graveyard is open to Genesis holders for now. Everyone else is next — your sneakers stay safely in your wallet until then.
      </p>
      <div className="flex items-center gap-2 text-sm text-m2e-text-secondary">
        <Lock className="w-5 h-5" />
        Opens for everyone after the Genesis pass.
      </div>
    </Card>
  );
}

// ── Step 2: wallet ───────────────────────────────────────────────────────────

function WalletStep({ proven, onProven, onBack }: { proven: string[]; onProven: () => void; onBack: (() => void) | null }) {
  const wallet = useSolanaWallet();
  const [account, setAccount] = useState<WalletAccount | null>(null);
  // The text Phantom will show, fetched on connect so the player reads it before they sign.
  const [challenge, setChallenge] = useState<{ message: string; at: number } | null>(null);
  const [busy, setBusy] = useState<'connect' | 'sign' | null>(null);
  const [error, setError] = useState<unknown>(null);

  const connect = async () => {
    if (!wallet) return;
    setError(null);
    setBusy('connect');
    try {
      const acc = await connectWallet(wallet);
      setAccount(acc);
      if (proven.includes(acc.address)) {
        // Already confirmed on an earlier visit: nothing to sign.
        onProven();
        return;
      }
      const { message } = await graveyardChallenge(acc.address);
      setChallenge({ message, at: Date.now() });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  };

  const sign = async () => {
    if (!wallet || !account) return;
    setError(null);
    setBusy('sign');
    try {
      // The challenge is good for ten minutes; past eight, ask for a fresh one rather than risk
      // a signature over an expired text.
      let c = challenge;
      if (!c || Date.now() - c.at > 8 * 60_000) {
        const { message } = await graveyardChallenge(account.address);
        c = { message, at: Date.now() };
        setChallenge(c);
      }
      const signature = await signMessage(wallet, account, c.message);
      await graveyardVerifyWallet(account.address, c.message, signature);
      onProven();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  };

  if (!wallet) {
    const here = typeof window === 'undefined' ? '' : window.location.href;
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    return (
      <Card>
        <Eyebrow>Step 2 of 5</Eyebrow>
        <H2>Open this page in Phantom</H2>
        <p className="text-lg">
          No Solana wallet is reachable from this browser. On a phone, the easiest way is Phantom's own browser: the button below opens this page there, with your wallet ready.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a className="pixel-btn pixel-btn-primary px-5 py-3 text-sm" href={phantomBrowseUrl(here, origin)}>Open this page in Phantom</a>
          <span className="text-sm text-m2e-text-secondary">On a computer: install the Phantom extension, then reload.</span>
        </div>
        <ErrorLine error={error} />
        {onBack && <button type="button" className="text-sm text-m2e-accent-dark underline cursor-pointer" onClick={onBack}>back to my sneakers</button>}
      </Card>
    );
  }

  return (
    <Card>
      <Eyebrow>Step 2 of 5</Eyebrow>
      <H2>Connect {wallet.name} and sign a message</H2>
      <p className="text-lg">Signing proves the wallet is yours. It is not a transaction. Nothing moves and nothing is charged.</p>

      {account ? (
        <div className="flex flex-wrap items-center gap-3">
          <Chip tone="ok">Connected</Chip>
          <span className="tabular-nums tracking-wider">{shortAddress(account.address)}</span>
          <button type="button" className="text-sm text-m2e-accent-dark underline cursor-pointer" onClick={connect} disabled={busy !== null}>
            use another wallet
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="pixel-btn pixel-btn-primary px-5 py-3 text-sm disabled:opacity-50" onClick={connect} disabled={busy !== null}>
            {busy === 'connect' ? 'Waiting for the wallet…' : `Connect ${wallet.name}`}
          </button>
          <span className="text-sm text-m2e-text-secondary">{wallet.name} will ask you to approve this site.</span>
        </div>
      )}

      {challenge && (
        <pre className="pixel-border border-m2e-border bg-m2e-bg px-4 py-3 text-base leading-snug whitespace-pre-wrap font-[inherit] tracking-normal">
          {challenge.message}
        </pre>
      )}

      {account && (
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="pixel-btn pixel-btn-primary px-5 py-3 text-sm disabled:opacity-50" onClick={sign} disabled={busy !== null}>
            {busy === 'sign' ? 'Waiting for your signature…' : 'Sign message'}
          </button>
          <span className="text-sm text-m2e-text-secondary">{wallet.name} will show "Sign message". No fee.</span>
        </div>
      )}

      <ErrorLine error={error} />
      {onBack && <button type="button" className="text-sm text-m2e-accent-dark underline cursor-pointer" onClick={onBack}>back to my sneakers</button>}
    </Card>
  );
}

// ── Step 3: the sneakers ─────────────────────────────────────────────────────

function SneakerStep({ me, notice, onDismissNotice, onReserved, onAnotherWallet }: {
  me: GraveyardMe;
  notice: string | null;
  onDismissNotice: () => void;
  onReserved: () => void;
  onAnotherWallet: () => void;
}) {
  const sneakers = useQuery({
    queryKey: ['graveyard-sneakers', me.wallets.join(',')],
    queryFn: fetchGraveyardSneakers,
    retry: false,
    staleTime: 15_000,
  });
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const reserve = useMutation({ mutationFn: graveyardReserve, onSuccess: onReserved });

  const list = sneakers.data?.sneakers ?? [];
  const selected = list.find((s) => s.mint === selectedMint) ?? null;
  const walletsText = me.wallets.map(shortAddress).join(', ');

  const offReason = (s: GraveyardSneaker): string | null => {
    if (s.state === 'laid_to_rest') return 'Already laid to rest';
    if (s.state === 'reserved_by_you') return null;
    if (!me.spotsLeft) return 'Spots taken this month';
    return null;
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Eyebrow>Step 3 of 5</Eyebrow>
        <H2>Your sneakers</H2>
        <p className="text-lg text-m2e-text-secondary">
          {list.length > 0
            ? `${list.length === 1 ? 'One sneaker' : `${list.length} sneakers`} in ${walletsText}. Pick the one you want to retire. Its soul is captured before the burn.`
            : `Sneakers in ${walletsText}.`}
        </p>
      </div>

      {notice && (
        <div className="pixel-border border-m2e-danger bg-m2e-danger-soft p-3 text-base flex flex-wrap items-start justify-between gap-3">
          <span>{notice}</span>
          <button type="button" className="text-sm underline cursor-pointer" onClick={onDismissNotice}>dismiss</button>
        </div>
      )}

      {!me.spotsLeft && (
        <div className="pixel-border border-m2e-warning bg-m2e-warning-soft p-3 flex flex-wrap items-center gap-3 text-base">
          <Chip tone="warn">Spots taken</Chip>
          <span>This month's spots are taken. New spots open next month. Your sneakers stay yours until then.</span>
        </div>
      )}

      {sneakers.isPending ? (
        <div className="space-y-3">
          <p className="text-m2e-text-secondary">Reading your wallet on Solana…</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="pixel-card h-40 animate-pulse" />)}
          </div>
        </div>
      ) : sneakers.isError ? (
        <Card>
          <H2>Could not read your wallet</H2>
          <ErrorLine error={sneakers.error} />
          <button className="pixel-btn pixel-btn-secondary px-4 py-3 text-sm" onClick={() => sneakers.refetch()}>Try again</button>
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <H2>No sneakers here yet</H2>
          <p className="text-lg">Nothing in {walletsText} looks like a sneaker. To bring one over:</p>
          <ul className="list-disc pl-5 space-y-1 text-base">
            <li>In the old game, move the sneaker from <b className="font-normal text-m2e-accent-dark">Spending</b> to <b className="font-normal text-m2e-accent-dark">Wallet</b>, then send it to this Phantom wallet.</li>
            <li>It needs 100 % HP first — repair it before you send it.</li>
            <li>A sneaker that has just moved can stay locked for up to a day. Check back then.</li>
          </ul>
          <div className="flex flex-wrap items-center gap-4">
            <button className="pixel-btn pixel-btn-secondary px-4 py-3 text-sm" onClick={() => sneakers.refetch()}>Check again</button>
            <button type="button" className="text-sm text-m2e-accent-dark underline cursor-pointer" onClick={onAnotherWallet}>use another wallet</button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] items-start">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {list.map((s) => {
              const off = offReason(s);
              const isSelected = !off && s.mint === selectedMint;
              return (
                <button
                  key={s.mint}
                  type="button"
                  aria-disabled={off ? true : undefined}
                  aria-pressed={isSelected || undefined}
                  onClick={() => { if (!off) setSelectedMint(s.mint); }}
                  className={`pixel-card p-3 text-left flex flex-col gap-1 transition-all ${
                    off
                      ? 'cursor-not-allowed bg-m2e-bg'
                      : isSelected
                        ? 'cursor-pointer border-m2e-accent bg-m2e-accent-soft'
                        : 'cursor-pointer hover:border-m2e-accent motion-safe:hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`px-2 py-1 ${off ? 'grayscale opacity-40' : ''}`}>
                    <SneakerSprite type={s.soul.type} quality={s.soul.quality} />
                  </div>
                  <div className="text-xl leading-tight">
                    {capitalize(s.soul.type)} <small className="text-base text-m2e-text-secondary tabular-nums">#{s.soul.number}</small>
                  </div>
                  <div className="text-base text-m2e-text-secondary">
                    <span className={qualityTextClass(s.soul.quality)}>{capitalize(s.soul.quality)}</span> · {soulDetail(s.soul)}
                  </div>
                  {off && <div className="text-sm text-m2e-text-secondary border-t-2 border-dotted border-m2e-border pt-1 mt-1">{off}</div>}
                  {!off && s.state === 'reserved_by_you' && (
                    <div className="text-sm text-m2e-accent-dark border-t-2 border-dotted border-m2e-border pt-1 mt-1">Waiting for you — your spot is held</div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="lg:sticky lg:top-20">
            {selected ? (
              <Card tone="accent">
                <Eyebrow>Selected</Eyebrow>
                <h3 className="text-2xl uppercase tracking-wide leading-none">{capitalize(selected.soul.type)} #{selected.soul.number}</h3>
                <p className="text-sm text-m2e-text-secondary">
                  <span className={qualityTextClass(selected.soul.quality)}>{capitalize(selected.soul.quality)}</span>
                  {' · '}{soulDetail(selected.soul)}
                </p>
                <div className="grid grid-cols-[auto_auto_1fr] items-center gap-3">
                  <div className="w-14"><SneakerSprite type={selected.soul.type} quality={selected.soul.quality} /></div>
                  <PixelGlyph name="arrow" className="w-5 h-5 text-m2e-text-secondary" />
                  <div>
                    <div>Its soul goes into a new Steel <b className="font-normal text-m2e-accent-dark">{SUGGESTED_BIKE[sneakerKey(selected.soul.type)]}</b> bike.</div>
                    <div className="text-sm text-m2e-text-secondary">
                      {capitalize(selected.soul.type)} suggests {SUGGESTED_BIKE[sneakerKey(selected.soul.type)]}. You can pick any body in the shop.
                    </div>
                  </div>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-base">
                  <dt className="text-m2e-text-secondary">You get</dt><dd>{VOUCHER_PERCENT_TEXT} off that Steel bike, valid 30 days</dd>
                  <dt className="text-m2e-text-secondary">And</dt><dd>the Retired Runner frame, with the number engraved</dd>
                  <dt className="text-m2e-text-secondary">Stats</dt><dd>unchanged. The soul is cosmetic.</dd>
                </dl>
                <button
                  type="button"
                  className="pixel-btn pixel-btn-primary px-5 py-3 text-sm disabled:opacity-50"
                  disabled={reserve.isPending || (!me.spotsLeft && selected.state !== 'reserved_by_you')}
                  onClick={() => reserve.mutate(selected.mint)}
                >
                  {reserve.isPending ? 'Holding your spot…' : 'Continue to the farewell'}
                </button>
                <ErrorLine error={reserve.error} />
              </Card>
            ) : (
              <Card>
                <Eyebrow>Selected</Eyebrow>
                <p className="text-lg text-m2e-text-secondary">Pick a sneaker on the left. Its soul is captured before the burn, and nothing happens until the farewell.</p>
                <button type="button" className="text-sm text-m2e-accent-dark underline cursor-pointer" onClick={onAnotherWallet}>use another wallet</button>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 4: the farewell ─────────────────────────────────────────────────────

/** Seconds left on a hold, ticking once a second; `onZero` fires once when it runs out. */
function useCountdown(untilIso: string, onZero: () => void): number {
  const until = Date.parse(untilIso);
  const left = () => Math.max(0, Math.ceil((until - Date.now()) / 1000));
  const [seconds, setSeconds] = useState(left);
  const onZeroRef = useRef(onZero);
  onZeroRef.current = onZero;
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = left();
      setSeconds(s);
      if (s === 0) {
        window.clearInterval(id);
        onZeroRef.current();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [until]);
  return seconds;
}

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function Farewell({ claim, wallets, notice, onExpired, onNotToday }: {
  claim: GraveyardClaim;
  wallets: string[];
  notice: string | null;
  onExpired: () => void;
  onNotToday: () => void;
}) {
  const queryClient = useQueryClient();
  const wallet = useSolanaWallet();
  const seconds = useCountdown(claim.reservedUntil, onExpired);
  const [understood, setUnderstood] = useState(false);
  const name = `${capitalize(claim.soul.type)} #${claim.soul.number}`;

  const burn = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error('No Solana wallet is reachable from this browser. Open this page in Phantom.');
      // The burn is signed by the wallet that holds the sneaker — one of the proven addresses.
      const account = await connectWallet(wallet, wallets);
      // Asked for right before the wallet opens: the blockhash inside lives about a minute.
      const { transaction } = await graveyardBurnTransaction(claim.id);
      const signature = await signAndSendTransaction(wallet, account, transaction);
      await graveyardSubmitBurn(claim.id, signature);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GRAVEYARD_ME_KEY }),
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'RESERVATION_EXPIRED') onExpired();
    },
  });

  return (
    <Card tone="danger">
      <Eyebrow>Step 4 of 5</Eyebrow>
      <H2>Say goodbye to {name}</H2>

      {notice && <div className="pixel-border border-m2e-danger bg-m2e-danger-soft p-3 text-base">{notice}</div>}

      <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-center">
        <div className="w-[120px]"><SneakerSprite type={claim.soul.type} quality={claim.soul.quality} /></div>
        <div className="space-y-3">
          <p className="text-lg">{soulLine(claim.soul)}. It carried you through a lot of mornings. Thank it, then let it go.</p>
          <div className="flex items-center gap-3 text-lg">
            <span>Your spot is held for</span>
            <b className="font-normal text-3xl tabular-nums text-m2e-warning-deep">{mmss(seconds)}</b>
          </div>
        </div>
      </div>

      <div className="pixel-border border-m2e-danger bg-m2e-danger-soft px-4 py-3 text-lg leading-snug">
        This is final. Burning destroys the sneaker on Solana. Nobody can bring it back, not you and not us. Its soul is already recorded, so the rebirth does not depend on anything after this point.
      </div>

      <label className="flex items-start gap-3 text-lg cursor-pointer">
        <input
          type="checkbox"
          className="mt-1 w-5 h-5 shrink-0 accent-m2e-accent"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
        />
        <span>I understand this sneaker is destroyed for good.</span>
      </label>

      <div className="pixel-border border-m2e-chrome bg-m2e-bg px-4 py-3 space-y-1.5">
        <div className="text-xs uppercase tracking-[0.2em] text-m2e-text-secondary">What {wallet?.name ?? 'Phantom'} will show</div>
        <div className="flex justify-between gap-4 text-lg border-t-2 border-dotted border-m2e-border pt-1"><span>Burn 1 NFT</span><span>{name}</span></div>
        <div className="flex justify-between gap-4 text-lg border-t-2 border-dotted border-m2e-border pt-1"><span>Returned to you</span><span className="tabular-nums">a little SOL (storage deposit)</span></div>
        <div className="flex justify-between gap-4 text-lg border-t-2 border-dotted border-m2e-border pt-1"><span>Network fee</span><span>under a cent</span></div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="pixel-btn pixel-btn-danger px-5 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!understood || burn.isPending || seconds === 0}
          onClick={() => burn.mutate()}
        >
          {burn.isPending ? `Waiting for ${wallet?.name ?? 'Phantom'}…` : `Burn it in ${wallet?.name ?? 'Phantom'}`}
        </button>
        <button type="button" className="text-sm text-m2e-accent-dark underline cursor-pointer" onClick={onNotToday}>Not today</button>
      </div>
      <ErrorLine error={burn.error} />
    </Card>
  );
}

// ── Between 4 and 5: the burn on its way ─────────────────────────────────────

function Burning({ claim }: { claim: GraveyardClaim }) {
  const name = `${capitalize(claim.soul.type)} #${claim.soul.number}`;
  const steps: { state: 'done' | 'now' | 'todo'; title: string; text: string }[] = [
    { state: 'done', title: 'Sent', text: `Your wallet sent the burn. Signature ${shortAddress(claim.burnSignature ?? '')}.` },
    { state: 'now', title: 'Confirmed on Solana', text: 'Waiting for the chain to finalise it — usually 15 to 30 seconds. The storage deposit comes back to your wallet with it.' },
    { state: 'todo', title: 'Verified by Galavant', text: 'We read the burn and seal the soul. You can close this page; the result waits here when you come back.' },
  ];
  return (
    <Card>
      <Eyebrow>Laying to rest</Eyebrow>
      <H2>{name} is on its way</H2>
      <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-center">
        <div className="relative w-[120px]">
          <SneakerSprite type={claim.soul.type} quality={claim.soul.quality} mono="var(--color-m2e-stone-dark)" />
          <PixelGlyph name="wisp" className="gy-wisp absolute left-[38%] -top-2.5 w-[18px] text-m2e-accent" />
          <PixelGlyph name="wisp" className="gy-wisp absolute left-[52%] -top-2.5 w-[18px] text-m2e-accent [animation-delay:1.3s]" />
        </div>
        <ol className="grid">
          {steps.map((s, i) => (
            <li key={s.title} className={`grid grid-cols-[2rem_1fr] gap-4 items-start py-3 ${i > 0 ? 'border-t-2 border-dotted border-m2e-border' : ''} ${s.state === 'todo' ? 'opacity-50' : ''}`}>
              <div
                className={`w-8 h-8 border-2 grid place-items-center ${
                  s.state === 'done'
                    ? 'bg-m2e-success border-m2e-success text-white'
                    : s.state === 'now'
                      ? 'border-m2e-accent bg-m2e-card animate-blink'
                      : 'border-m2e-chrome bg-m2e-card'
                }`}
              >
                {s.state === 'done' && <Check className="w-5 h-5" />}
                {s.state === 'now' && <span className="w-3.5 h-3.5 bg-m2e-accent" />}
              </div>
              <div>
                <h4 className="text-xl leading-tight">{s.title}</h4>
                <p className="text-base text-m2e-text-secondary">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

// ── Step 5: rebirth ──────────────────────────────────────────────────────────

function SoulCard({ claim }: { claim: GraveyardClaim }) {
  return (
    <Card tone="accent">
      <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-center">
        {/* The soul: the sneaker in accent, with its wisps still rising. */}
        <div className="relative w-[110px]">
          <SneakerSprite type={claim.soul.type} quality={claim.soul.quality} mono="var(--color-m2e-accent)" />
          <PixelGlyph name="wisp" className="gy-wisp absolute left-[36%] -top-2 w-[14px] text-m2e-accent" />
          <PixelGlyph name="wisp" className="gy-wisp absolute left-[54%] -top-2 w-[14px] text-m2e-accent [animation-delay:1.3s]" />
        </div>
        <div className="space-y-1">
          <Eyebrow>Soul of</Eyebrow>
          <h3 className="text-3xl uppercase tracking-wide leading-none">{capitalize(claim.soul.type)} #{claim.soul.number}</h3>
          <p>
            <span className={qualityTextClass(claim.soul.quality)}>{capitalize(claim.soul.quality)}</span>
            {' · '}{soulDetail(claim.soul)}
          </p>
          {claim.burnedAt && <p className="text-sm text-m2e-text-secondary">Laid to rest {formatDayTimeUtc(claim.burnedAt)} · stone on the wall</p>}
        </div>
      </div>
    </Card>
  );
}

function voucherText(v: GraveyardVoucher): string {
  switch (v.status) {
    case 'open': return `Valid until ${formatDay(v.expiresAt)}. Applied at the card till while you are signed in. Any body, one Steel bike.`;
    case 'reserved': return 'Held by a checkout in progress. It comes back if that checkout is cancelled.';
    case 'used': return 'Used — the bike it bought carries the soul.';
    case 'expired': return `Expired on ${formatDay(v.expiresAt)}.`;
  }
}

function Rebirth({ claim, onBound }: { claim: GraveyardClaim; onBound: () => void }) {
  const [picking, setPicking] = useState(false);
  const bikes = useQuery({ queryKey: BIKES_KEY, queryFn: fetchUserBikes, enabled: picking, retry: false });
  const bind = useMutation({ mutationFn: (bikeId: string) => graveyardBindSoul(claim.id, bikeId), onSuccess: onBound });
  const suggested = SUGGESTED_BIKE[sneakerKey(claim.soul.type)];
  const voucher = claim.voucher;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Eyebrow>Step 5 of 5</Eyebrow>
        <H2>Rest well, {capitalize(claim.soul.type)}. Now ride.</H2>
      </div>

      <SoulCard claim={claim} />

      <div className="pixel-card p-5 md:p-6 grid sm:grid-cols-[auto_1fr] gap-5 items-center">
        <div className="text-4xl leading-[0.9] text-m2e-accent-dark sm:border-r-2 sm:border-dashed sm:border-m2e-border sm:pr-5 max-sm:border-b-2 max-sm:border-dashed max-sm:border-m2e-border max-sm:pb-3">
          {voucher ? `${voucher.percent} %` : VOUCHER_PERCENT_TEXT} off<br />one bike
        </div>
        <div className="space-y-1">
          <p className="text-lg">{voucher ? voucherText(voucher) : 'Your voucher is being written. Reload in a moment.'}</p>
          <p className="text-sm text-m2e-text-secondary">The voucher stays yours for 30 days either way — also if the soul goes to a bike you already own.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="pixel-card p-5 flex flex-col gap-3 items-start">
          <h3 className="text-2xl uppercase tracking-wide leading-none">Choose its new bike</h3>
          <p className="text-base text-m2e-text-secondary flex-1">
            Opens the shop with {voucher ? `${voucher.percent} %` : VOUCHER_PERCENT_TEXT} off a Steel bike. {suggested} is suggested for a {capitalize(claim.soul.type)}. The frame goes on at purchase.
          </p>
          <Link to="/market?tab=shop" className="pixel-btn pixel-btn-primary px-5 py-3 text-sm">Open the shop</Link>
        </div>
        <div className="pixel-card p-5 flex flex-col gap-3 items-start">
          <h3 className="text-2xl uppercase tracking-wide leading-none">Give the soul to a bike I already own</h3>
          <p className="text-base text-m2e-text-secondary flex-1">Frame and plate only. Steel bikes only — a burn never gets more than Steel. The voucher stays yours.</p>
          <button type="button" className="pixel-btn pixel-btn-secondary px-5 py-3 text-sm" onClick={() => setPicking((p) => !p)} aria-expanded={picking}>
            {picking ? 'Hide my bikes' : 'Pick one of my bikes'}
          </button>
        </div>
      </div>

      {picking && (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>My Steel bikes</Eyebrow>
            <Chip>Steel bikes only</Chip>
          </div>
          {bikes.isPending ? (
            <p className="text-m2e-text-secondary">Loading your bikes…</p>
          ) : bikes.isError ? (
            <>
              <p className="text-m2e-text-secondary">Your bikes could not be loaded.</p>
              <ErrorLine error={bikes.error} />
              <button className="pixel-btn pixel-btn-secondary px-4 py-3 text-sm" onClick={() => bikes.refetch()}>Try again</button>
            </>
          ) : bikes.data.filter(isSoulBody).length === 0 ? (
            <p className="text-m2e-text-secondary">
              No Steel bike in your garage. A soul only goes into a Steel bike — the shop has one with {VOUCHER_PERCENT_TEXT} off.
            </p>
          ) : (
            <ul className="grid gap-3">
              {bikes.data.filter(isSoulBody).map((b) => (
                <li key={b.id} className="flex items-center gap-4 border-t-2 border-dotted border-m2e-border pt-3 first:border-t-0 first:pt-0">
                  <img src={bikeImage(b)} alt="" className="w-16 h-16 object-contain bg-white pixel-render shrink-0" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xl leading-tight">{capitalize(b.type)} · Lv {b.level}</div>
                    <div className="text-sm text-m2e-text-secondary">
                      <span className={qualityTextClass(b.quality)}>{materialName(b.quality)}</span>
                      {b.isListed ? ' · listed on the market' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-primary px-4 py-2.5 text-xs disabled:opacity-50"
                    disabled={bind.isPending}
                    onClick={() => bind.mutate(b.id)}
                  >
                    {bind.isPending && bind.variables === b.id ? 'Giving…' : 'Give the soul'}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ErrorLine error={bind.error} />
        </Card>
      )}
    </div>
  );
}

function bikeImage(bike: Pick<UserBike, 'imageUrl' | 'type'>): string {
  if (bike.imageUrl) return bike.imageUrl.startsWith('/') ? `${config.apiUrl}${bike.imageUrl}` : bike.imageUrl;
  return bikeArtUrl(bike.type);
}

/** The result: the bike in its frame. The garage is only consulted for the bike's own picture. */
function SoulGiven({ claim, body }: { claim: GraveyardClaim; body: NonNullable<GraveyardClaim['body']> }) {
  const bikes = useQuery({ queryKey: BIKES_KEY, queryFn: fetchUserBikes, retry: false });
  const bike = bikes.data?.find((b) => b.id === body.bikeId) ?? null;
  const src = bike ? bikeImage(bike) : bikeArtUrl(body.type);
  const voucher = claim.voucher;
  const sneaker = `${capitalize(claim.soul.type)} #${claim.soul.number}`;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-[minmax(0,360px)_1fr] gap-8 items-center">
        <FramedBike quality={claim.soul.quality} number={claim.soul.number} src={src} alt={`${capitalize(body.type)} bike in the Retired Runner frame, plate #${claim.soul.number}`} />
        <div className="space-y-3">
          <Eyebrow>Your bike</Eyebrow>
          <H2>{capitalize(body.type)} · Retired Runner</H2>
          <p className="text-lg">
            The frame follows the sneaker's quality. The plate carries its number. Both go into the NFT image when you export the bike, and both show in the app. The bike art underneath is untouched.
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip tone="accent">Retired Runner</Chip>
            <Chip>Soul of {sneaker}</Chip>
            <Chip>Cosmetic only</Chip>
          </div>
          {voucher && voucher.status === 'open' && (
            <p className="text-base text-m2e-text-secondary">
              Your {voucher.percent} % voucher is still open until {formatDay(voucher.expiresAt)} —{' '}
              <Link to="/market?tab=shop" className="text-m2e-accent-dark underline">use it in the shop</Link>.
            </p>
          )}
        </div>
      </div>
      <SoulCard claim={claim} />
    </div>
  );
}
