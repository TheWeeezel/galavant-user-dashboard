import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Wallet, Clock, Heart, Download } from 'pixelarticons/react';
import { phantomBrowseUrl } from '../../lib/wallet';
import { Card, Eyebrow, H2 } from './Chrome';
import { FLOW_STEPS, GraveyardFlow, type FlowStep } from './GraveyardFlow';
import { PixelGlyph, SneakerSprite } from './Pixels';

/**
 * The guide: one rail of seven steps, one step on screen at a time.
 *
 * The first two are help for a player who has never moved a sneaker out of the old game — they
 * can be skipped. The other five are the live flow (GraveyardFlow.tsx), which reads its step off
 * the server; the wizard only frames it. So a player who is already further along — a proven
 * wallet, a burned claim waiting for its bike — lands on the live step the moment the server
 * answers, not on the help.
 */

const HELP_STEPS = [
  { key: 'stepn', label: 'Out of the old game' },
  { key: 'phantom', label: 'Phantom' },
] as const;
type HelpKey = (typeof HELP_STEPS)[number]['key'];
type View = HelpKey | 'live';

const RAIL = [...HELP_STEPS.map((s) => ({ ...s, kind: 'help' as const })), ...FLOW_STEPS.map((s) => ({ ...s, kind: 'live' as const }))];
const TOTAL = RAIL.length;
const liveIndex = (step: FlowStep) => HELP_STEPS.length + FLOW_STEPS.findIndex((s) => s.key === step);
const stepLabel = (step: FlowStep) => `Step ${liveIndex(step) + 1} of ${TOTAL} · ${FLOW_STEPS.find((s) => s.key === step)!.label}`;

const PHANTOM_DOWNLOAD = 'https://phantom.app/download';

export function GraveyardWizard({ onSignIn }: { onSignIn: () => void }) {
  const [view, setView] = useState<View>('stepn');
  const [live, setLive] = useState<{ step: FlowStep; done: boolean }>({ step: 'signin', done: false });
  const jumped = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // Focus moves to the step's heading only after the reader pressed Next or Back — never on the
  // first paint, and never when the server moved the live step underneath them.
  const moveFocus = useRef(false);

  const onStepChange = useCallback((step: FlowStep, done: boolean) => {
    setLive({ step, done });
    // Past the sign-in, the help is behind them: open on the live step, once.
    if (!jumped.current && step !== 'signin') {
      jumped.current = true;
      setView('live');
    }
  }, []);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    panelRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [view]);

  const go = (next: View) => {
    moveFocus.current = true;
    setView(next);
  };

  const current = view === 'live' ? liveIndex(live.step) : HELP_STEPS.findIndex((s) => s.key === view);
  const allDone = view === 'live' && live.done;

  return (
    <div className="space-y-6">
      <Rail current={current} allDone={allDone} onPick={(i) => { if (RAIL[i].kind === 'help') go(RAIL[i].key as HelpKey); }} />

      <div ref={panelRef}>
        {view === 'stepn' && (
          <HelpFrame onNext={() => go('phantom')} onSkip={() => go('live')}>
            <StepnStep />
          </HelpFrame>
        )}
        {view === 'phantom' && (
          <HelpFrame onBack={() => go('stepn')} onNext={() => go('live')} onSkip={() => go('live')}>
            <PhantomStep />
          </HelpFrame>
        )}
        {/* The live flow stays mounted behind the help so it can report where the player really is. */}
        <div hidden={view !== 'live'} className="space-y-4">
          <GraveyardFlow onSignIn={onSignIn} frame={{ embedded: true, stepLabel, onStepChange }} />
          {(live.step === 'signin' || live.step === 'wallet') && (
            <div className="mx-auto max-w-[680px] flex flex-wrap items-center justify-between gap-3 text-sm text-m2e-text-secondary">
              <button type="button" className="inline-flex items-center gap-1 text-m2e-accent-dark underline cursor-pointer" onClick={() => go('phantom')}>
                <ChevronLeft className="w-4 h-4" /> Back to the guide
              </button>
              <span>The next step opens when this one is done.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── The rail ─────────────────────────────────────────────────────────────────

function Rail({ current, allDone, onPick }: { current: number; allDone: boolean; onPick: (i: number) => void }) {
  return (
    <ol className="flex flex-wrap gap-2 md:gap-2.5" aria-label="Steps">
      {RAIL.map((s, i) => {
        const state = allDone || i < current ? 'done' : i === current ? 'now' : 'todo';
        const tone = state === 'done'
          ? 'border-m2e-success text-m2e-success-deep bg-m2e-card'
          : state === 'now'
            ? 'border-m2e-accent bg-m2e-accent text-m2e-text-on-accent'
            : 'border-m2e-border text-m2e-text-secondary bg-m2e-card';
        // A help step can always be reopened; a live step is where the server says it is.
        const pickable = s.kind === 'help' && state !== 'now';
        const inner = (
          <>
            <span className="tabular-nums">{i + 1}</span>
            <span className={state === 'now' ? '' : 'max-sm:sr-only'}>{s.label}</span>
            {s.kind === 'help' && <span className="sr-only">(help)</span>}
          </>
        );
        const chip = `border-2 px-2.5 py-1 text-sm inline-flex items-center gap-1.5 ${tone}`;
        return (
          <li key={s.key} aria-current={state === 'now' ? 'step' : undefined}>
            {pickable ? (
              <button type="button" onClick={() => onPick(i)} className={`${chip} cursor-pointer hover:border-m2e-accent`}>{inner}</button>
            ) : (
              <span className={chip}>{inner}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ── The help frame ──────────────────────────────────────────────────────────

function HelpFrame({ onBack, onNext, onSkip, children }: { onBack?: () => void; onNext: () => void; onSkip: () => void; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[680px] space-y-4">
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="pixel-btn pixel-btn-secondary px-4 py-3 text-sm gap-1 disabled:opacity-40 disabled:cursor-not-allowed" onClick={onBack} disabled={!onBack}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button type="button" className="pixel-btn pixel-btn-primary px-5 py-3 text-sm gap-1" onClick={onNext}>
          Next <ChevronRight className="w-4 h-4" />
        </button>
        <button type="button" className="text-sm text-m2e-accent-dark underline cursor-pointer sm:ml-auto" onClick={onSkip}>
          I already have my sneaker in Phantom
        </button>
      </div>
    </div>
  );
}

function Todo({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-3 items-start">
      <div className="w-8 h-8 grid place-items-center bg-m2e-accent text-m2e-text-on-accent text-xl shadow-[3px_3px_0_var(--color-m2e-chrome)]">{n}</div>
      <div>
        <h3 className="text-xl leading-tight">{title}</h3>
        <p className="text-base text-m2e-text-secondary leading-snug">{children}</p>
      </div>
    </li>
  );
}

// ── Help step 1: out of the old game ────────────────────────────────────────

function StepnStep() {
  return (
    <Card>
      <Eyebrow>Step 1 of {TOTAL} · Help</Eyebrow>
      <H2>Get your sneaker out of STEPN</H2>
      <p className="text-lg">
        The sneaker has to be in a wallet you hold the keys to. Inside STEPN it sits in the app's own Spending account; four moves bring it over.
      </p>

      <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-start">
        <div className="hidden sm:grid gap-2 justify-items-center w-[96px] pt-1 text-m2e-text-secondary">
          <div className="w-[80px]"><SneakerSprite type="runner" quality="common" /></div>
          <PixelGlyph name="arrow" className="w-5 h-5 rotate-90" />
          <Wallet className="w-9 h-9 text-m2e-accent" />
          <span className="text-xs uppercase tracking-wider text-center leading-tight">your wallet</span>
        </div>
        <ol className="grid gap-4">
          <Todo n={1} title="Repair it to 100 % HP">A sneaker with less than full HP cannot leave the app. Repair first, then move.</Todo>
          <Todo n={2} title="Move it from Spending to Wallet">In STEPN, open the sneaker and choose <b className="font-normal text-m2e-accent-dark">Transfer</b> to the in-app Wallet.</Todo>
          <Todo n={3} title="Send it to your Phantom address">In the in-app Wallet, open the sneaker and choose <b className="font-normal text-m2e-accent-dark">Send</b>. Paste your Phantom wallet's Solana address — copy it from Phantom and check the first and last four characters before you confirm.</Todo>
          <Todo n={4} title="Give it a day if it is locked">STEPN may keep a sneaker locked in a new wallet for up to a day. Nothing is lost; it shows up here once the lock lifts.</Todo>
        </ol>
      </div>

      <div className="pixel-border border-m2e-border bg-m2e-bg px-4 py-3 grid sm:grid-cols-2 gap-3 text-base leading-snug">
        <div className="flex items-start gap-2"><Heart className="w-5 h-5 shrink-0 text-m2e-accent" /><span>Keep a little SOL in the Phantom wallet: the network fee for the burn is under a cent, but it cannot be zero.</span></div>
        <div className="flex items-start gap-2"><Clock className="w-5 h-5 shrink-0 text-m2e-accent" /><span>Bring the sneaker, not the tokens. Only the sneaker is laid to rest here; your other balances are your own business.</span></div>
      </div>
    </Card>
  );
}

// ── Help step 2: Phantom ────────────────────────────────────────────────────

function PhantomStep() {
  const here = typeof window === 'undefined' ? '' : window.location.href;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return (
    <Card>
      <Eyebrow>Step 2 of {TOTAL} · Help</Eyebrow>
      <H2>Install Phantom</H2>
      <p className="text-lg">
        Phantom is the wallet the burn happens in. You sign; we never hold the sneaker. Any Solana wallet that can sign a message works, but Phantom is the one we tested.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="pixel-border border-m2e-border bg-m2e-bg p-4 space-y-2">
          <h3 className="text-xl leading-tight">On a phone</h3>
          <p className="text-base text-m2e-text-secondary leading-snug">
            Get Phantom from the App Store or Google Play, then open this page <em>inside</em> Phantom's own browser — that is where the wallet can talk to the page.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a href={PHANTOM_DOWNLOAD} target="_blank" rel="noopener noreferrer" className="pixel-btn pixel-btn-secondary px-4 py-2.5 text-xs gap-1.5"><Download className="w-4 h-4" /> phantom.app</a>
            <a href={phantomBrowseUrl(here, origin)} className="pixel-btn pixel-btn-primary px-4 py-2.5 text-xs">Open this page in Phantom</a>
          </div>
        </div>
        <div className="pixel-border border-m2e-border bg-m2e-bg p-4 space-y-2">
          <h3 className="text-xl leading-tight">On a computer</h3>
          <p className="text-base text-m2e-text-secondary leading-snug">
            Install the Phantom browser extension, then reload this page. The wallet step finds it on its own.
          </p>
          <div className="pt-1">
            <a href={PHANTOM_DOWNLOAD} target="_blank" rel="noopener noreferrer" className="pixel-btn pixel-btn-secondary px-4 py-2.5 text-xs gap-1.5"><Download className="w-4 h-4" /> Get the extension</a>
          </div>
        </div>
      </div>

      <p className="text-sm text-m2e-text-secondary">
        Already have Phantom? Make sure the wallet that holds the sneaker is the one you connect in the next step — Phantom can hold several.
      </p>
    </Card>
  );
}
