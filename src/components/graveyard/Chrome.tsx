import type { ReactNode } from 'react';

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
