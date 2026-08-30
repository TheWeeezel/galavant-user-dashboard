import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bug, Check } from 'pixelarticons/react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from '../components/LoginModal';
import { submitReport } from '../api';

/**
 * REPORT A PROBLEM — the browser half of the test month's return path.
 *
 * A text box and a button on purpose: categories only get picked wrong. Signed in on purpose
 * too — a report nobody can answer cannot be followed up.
 */

/** Must match the server's cap so the box stops before the request does. */
const MAX_LENGTH = 2000;
const MIN_LENGTH = 10;

export function Report() {
  const { isAuthenticated, isRestoring } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const submit = useMutation({
    mutationFn: () => submitReport(text.trim()),
    onSuccess: () => { setText(''); setSent(true); },
  });

  const valid = text.trim().length >= MIN_LENGTH;

  return (
    <>
      {/* Hero strip */}
      <div className="border-b-2 border-m2e-border bg-m2e-chrome text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-3xl px-4 md:px-8 py-10 md:py-14 relative z-10 space-y-4">
          <div className="section-label">Test Month</div>
          <h1 className="text-5xl md:text-7xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
            Something<br />
            <span className="text-m2e-accent">Broke.</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl">
            Tell us what happened. It goes straight to the developers.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-6">
        {isRestoring ? (
          <p className="text-m2e-text-muted uppercase tracking-widest">Loading...</p>
        ) : !isAuthenticated ? (
          <div className="pixel-card p-6 flex flex-col items-center gap-4 text-center">
            <Bug className="w-12 h-12 text-m2e-text-muted" />
            <p className="text-m2e-text-secondary max-w-md">
              Log in before you send a report. We attach your account so a follow-up question has
              somewhere to go — an anonymous report can't be answered.
            </p>
            <button onClick={() => setShowLogin(true)} className="pixel-btn pixel-btn-primary px-6 py-3 text-sm">
              Login
            </button>
          </div>
        ) : sent ? (
          <div className="pixel-card p-6 border-m2e-success space-y-3">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-m2e-success" />
              <h2 className="text-2xl uppercase tracking-wide text-m2e-success">Report sent</h2>
            </div>
            <p className="text-m2e-text-secondary">
              It went straight to the developers, with your account and browser attached. Nothing comes
              back to you here. Hit something else? Send another.
            </p>
            <button onClick={() => setSent(false)} className="pixel-btn pixel-btn-secondary px-5 py-2.5 text-sm">
              Write another
            </button>
          </div>
        ) : (
          <div className="pixel-card p-6 space-y-4">
            <p className="text-m2e-text-secondary">
              Something broken, stuck or just wrong? Write what happened and what you were doing right
              before. Your account and browser are attached automatically — you don't have to describe them.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="What happened?"
              rows={8}
              disabled={submit.isPending}
              className="w-full bg-m2e-bg-alt border-2 border-m2e-border rounded px-4 py-3 text-m2e-text placeholder:text-m2e-text-muted focus:border-m2e-accent outline-none resize-y"
            />
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-m2e-text-muted">{text.trim().length}/{MAX_LENGTH}</span>
              <button
                onClick={() => valid && submit.mutate()}
                disabled={!valid || submit.isPending}
                className="pixel-btn pixel-btn-primary px-6 py-3 text-sm disabled:opacity-50"
              >
                {submit.isPending ? 'Sending…' : 'Send report'}
              </button>
            </div>
            {submit.isError && (
              <p className="text-m2e-danger text-sm">That didn't send: {(submit.error as Error).message}</p>
            )}
          </div>
        )}

        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    </>
  );
}
