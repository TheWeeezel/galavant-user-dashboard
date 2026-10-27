import { useEffect, useState, type ReactNode } from 'react';

/**
 * The graveyard's small chrome — one card, one eyebrow, one heading — shared by the live flow
 * (GraveyardFlow.tsx) and the help steps of the wizard (Wizard.tsx), so a help step and a live
 * step are the same card to the eye.
 */

export function errorText(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'Something went wrong. Try again.';
}

export function Card({ tone, children }: { tone?: 'accent' | 'danger' | 'soft'; children: ReactNode }) {
  const border = tone === 'accent' ? 'border-m2e-accent' : tone === 'danger' ? 'border-m2e-danger' : '';
  return <div className={`pixel-card p-5 md:p-7 space-y-4 ${border}`}>{children}</div>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="section-label">{children}</div>;
}

/** The step's heading. Focusable so the wizard can move the reader here on Next and Back. */
export function H2({ children }: { children: ReactNode }) {
  return <h2 tabIndex={-1} className="text-3xl md:text-4xl uppercase tracking-wide leading-none focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-m2e-accent">{children}</h2>;
}

/** A server error, verbatim — the text is the server's and is never rewritten here. */
export function ErrorLine({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="text-sm text-m2e-danger-deep">&gt; {errorText(error)}</p>;
}

export function Chip({ tone = 'plain', children }: { tone?: 'plain' | 'ok' | 'warn' | 'accent'; children: ReactNode }) {
  const cls = tone === 'ok'
    ? 'border-m2e-success text-m2e-success-deep'
    : tone === 'warn'
      ? 'border-m2e-warning text-m2e-warning-deep'
      : tone === 'accent'
        ? 'border-m2e-accent text-m2e-accent-dark'
        : 'border-m2e-border text-m2e-text-secondary';
  return <span className={`inline-block border-2 bg-m2e-card px-2 py-0.5 text-xs uppercase tracking-wider whitespace-nowrap ${cls}`}>{children}</span>;
}

/** How long a wallet prompt may stay silent before the page suggests a reload. */
export const WALLET_SILENT_MS = 20_000;

/**
 * Shown under a button that waits on the wallet, once the wallet has been silent for a while.
 * It never cancels the wait: the wallet's window may still be open somewhere, and giving up on it
 * would lose a signature the player then approves. A reload is the cure for the common case, an
 * extension that updated itself while the tab was open ("Extension context invalidated"), whose
 * old connection in this tab no longer reaches the wallet.
 */
export function WalletSilentHint({ waiting, walletName, children }: { waiting: boolean; walletName: string; children?: ReactNode }) {
  const [silent, setSilent] = useState(false);
  useEffect(() => {
    setSilent(false);
    if (!waiting) return;
    const t = setTimeout(() => setSilent(true), WALLET_SILENT_MS);
    return () => clearTimeout(t);
  }, [waiting]);
  if (!waiting || !silent) return null;
  return (
    <div role="status" className="pixel-border border-m2e-warning bg-m2e-bg px-4 py-3 space-y-2 text-base leading-snug">
      <p>
        {walletName} has not opened? Look for its window behind the browser, or click its icon in the toolbar.
        If nothing is waiting there, {walletName} probably updated itself while this tab was open: reload the page and try again.
      </p>
      {children && <p className="text-m2e-text-secondary">{children}</p>}
      <button type="button" className="pixel-btn px-4 py-2 text-sm" onClick={() => window.location.reload()}>Reload the page</button>
    </div>
  );
}
