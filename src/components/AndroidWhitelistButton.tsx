import { useState, useCallback, useEffect, useRef, useId } from 'react';
import { Cancel, Check } from 'pixelarticons/react';
import { config } from '../config';

/**
 * Galavant on Android is currently in closed testing on Google Play, so the
 * "Get it on Android" button can't link straight to a public download. This
 * component renders a Google-Play-styled button that opens a dialog asking
 * whether the user has already been whitelisted:
 *
 *   - Yes → opens the Play Store listing in a new tab (only works for
 *           whitelisted Google accounts)
 *   - No  → email form that submits to POST /tester-applications, where the
 *           admin can pick it up from the admin dashboard's Testers page and
 *           add the email to Play Console manually
 *
 * Visual variants:
 *   - default: matches the big "Download on iOS" CTA button
 *   - compact: matches the smaller secondary buttons used on inline cards
 */

const PLAY_STORE_LISTING = 'https://play.google.com/store/apps/details?id=com.m2e.opnet';

interface Props {
  /**
   * Override the Play Store listing URL (e.g. from changelog.json's
   * `playStoreUrl` field). Falls back to the standard listing.
   */
  playStoreUrl?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

const ANDROID_SVG = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

type DialogStep = 'choose' | 'apply' | 'submitted';

export function AndroidWhitelistButton({ playStoreUrl, variant = 'default', className }: Props) {
  const [open, setOpen] = useState(false);

  const buttonClass = variant === 'compact'
    ? 'pixel-btn inline-flex items-center gap-2 text-sm px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 no-underline whitespace-nowrap'
    : 'pixel-btn inline-flex items-center gap-2 text-base px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50';
  const label = variant === 'compact' ? 'Android' : 'Get it on Android';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonClass}${className ? ` ${className}` : ''}`}
      >
        {ANDROID_SVG}
        {label}
      </button>
      {open && (
        <AndroidWhitelistDialog
          playStoreUrl={playStoreUrl ?? PLAY_STORE_LISTING}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────

interface DialogProps {
  playStoreUrl: string;
  onClose: () => void;
}

function AndroidWhitelistDialog({ playStoreUrl, onClose }: DialogProps) {
  const [step, setStep] = useState<DialogStep>('choose');
  const [email, setEmail] = useState('');
  // Honeypot field — only bots scraping the form will fill this. It's
  // rendered off-screen via `aria-hidden` + `tabindex=-1` + CSS and never
  // visible to real users. The server silently discards submissions that
  // arrive with a non-empty honeypot value.
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleId = useId();
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape for accessibility.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Autofocus the email field when the user switches into the apply step.
  useEffect(() => {
    if (step === 'apply') {
      // setTimeout so the input exists in the DOM by the time we focus.
      const t = window.setTimeout(() => emailInputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [step]);

  const submit = useCallback(async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${config.apiUrl}/tester-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, honeypot }),
      });
      if (!res.ok) {
        // Intentionally generic — do not echo server error text to the UI.
        // The server's public errors are already vague ("Invalid email"),
        // but even those are hidden behind a friendly message.
        throw new Error('Please check your email and try again');
      }
      setStep('submitted');
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [email, honeypot]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        className="pixel-card relative z-10 w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            id={titleId}
            className="text-xl uppercase tracking-widest text-m2e-accent"
            style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}
          >
            Galavant on Android
          </h2>
          <button
            onClick={onClose}
            className="pixel-icon-btn w-8 h-8 text-m2e-text-muted hover:text-m2e-text"
            aria-label="Close"
          >
            <Cancel className="w-6 h-6" />
          </button>
        </div>

        {step === 'choose' && (
          <div className="space-y-5">
            <p className="text-sm text-m2e-text-secondary">
              Galavant is currently in <strong>closed testing</strong> on Google Play. Only whitelisted Google accounts can install it. Have you already been added to the testers list?
            </p>

            <div className="space-y-3">
              {/* Yes path */}
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn pixel-btn-primary w-full px-4 py-3 text-sm flex items-center justify-center gap-2 no-underline"
              >
                {ANDROID_SVG}
                Yes — open Play Store
              </a>

              <p className="text-xs text-m2e-text-muted text-center">
                Make sure you're signed into Google Play with the same account you registered.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-0.5 bg-m2e-border" />
              <span className="text-xs uppercase tracking-widest text-m2e-text-muted">or</span>
              <div className="flex-1 h-0.5 bg-m2e-border" />
            </div>

            {/* No path */}
            <button
              type="button"
              onClick={() => setStep('apply')}
              className="pixel-btn pixel-btn-outline w-full px-4 py-3 text-sm"
            >
              Not yet — apply for the whitelist
            </button>
          </div>
        )}

        {step === 'apply' && (
          <div className="space-y-4">
            <p className="text-sm text-m2e-text-secondary">
              Enter your <strong>Google Play account email</strong>. We'll add you to the closed testers list manually — you'll get an email from Google when you're approved.
            </p>

            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-m2e-text-secondary">
                Google Play account email
              </label>
              <input
                ref={emailInputRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                className="w-full bg-m2e-bg border-2 border-m2e-border rounded px-3 py-2 text-sm text-m2e-text focus:border-m2e-border-focus focus:outline-none"
              />
            </div>

            {/* Honeypot — invisible to real users, filled by naive bots. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-9999px',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
              }}
            >
              <label htmlFor="contact-preference">
                Leave this field blank
              </label>
              <input
                id="contact-preference"
                name="contact-preference"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-xs text-m2e-danger bg-m2e-danger/10 border border-m2e-danger/30 rounded px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="pixel-btn pixel-btn-primary flex-1 px-4 py-3 text-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Apply'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('choose'); setError(null); }}
                disabled={submitting}
                className="pixel-btn pixel-btn-outline px-4 py-3 text-sm"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === 'submitted' && (
          <div className="space-y-4 text-center py-2">
            <div className="flex justify-center">
              <div className="w-14 h-14 flex items-center justify-center border-2 border-m2e-success bg-m2e-success/10">
                <Check className="w-10 h-10 text-m2e-success" />
              </div>
            </div>
            <h3 className="text-lg uppercase tracking-wide text-m2e-text">Application received!</h3>
            <p className="text-sm text-m2e-text-secondary">
              We'll add <span className="font-mono text-m2e-text">{email.trim()}</span> to the Galavant closed testers list shortly. We'll email you once you've been added — that can take up to a day.
            </p>
            <p className="text-xs text-m2e-text-muted">
              In the meantime, you can also play on iOS via TestFlight or use the marketplace on the web.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="pixel-btn pixel-btn-primary w-full px-4 py-3 text-sm mt-2"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
