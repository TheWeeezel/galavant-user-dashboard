import { AndroidPlayStoreButton } from './AndroidPlayStoreButton';

/**
 * App download buttons, in one place so they can be turned off in one place.
 *
 * Flip this to true to bring the real store links back. The markup below is
 * intact — nothing was deleted, so restoring is this line and nothing else.
 */
// Test month September is live (2026-09-05): the buttons are real links now.
const APP_LIVE = true;

type Variant = 'hero' | 'default' | 'compact';

const IOS_BUTTON_CLASS: Record<Variant, string> = {
  hero: 'pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-base px-6 py-3 animate-glow-pulse',
  default: 'pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-sm px-5 py-3',
  compact: 'pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-sm px-4 py-2.5 no-underline whitespace-nowrap',
};

const SOON_CLASS: Record<Variant, string> = {
  hero: 'inline-flex items-center gap-2 text-base px-6 py-3',
  default: 'inline-flex items-center gap-2 text-sm px-5 py-3',
  compact: 'inline-flex items-center gap-2 text-sm px-4 py-2.5 whitespace-nowrap',
};

const ICON_SIZE: Record<Variant, string> = {
  hero: 'w-5 h-5',
  default: 'w-4 h-4',
  compact: 'w-4 h-4 shrink-0',
};

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export function AppDownload({ testflightUrl, playStoreUrl, variant = 'default', iosLabel }: {
  testflightUrl?: string | null;
  playStoreUrl?: string | null;
  variant?: Variant;
  /** The hero says "Download on iOS"; the tighter spots just say "iOS". */
  iosLabel?: string;
}) {
  if (!APP_LIVE) {
    return (
      <span
        className={`${SOON_CLASS[variant]} pixel-border border-m2e-border bg-m2e-card-alt text-m2e-text-muted uppercase tracking-[0.2em] cursor-default select-none`}
        aria-label="App coming soon"
      >
        Soon
      </span>
    );
  }

  return (
    <>
      {testflightUrl && (
        <a
          href={testflightUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={IOS_BUTTON_CLASS[variant]}
        >
          <AppleIcon className={ICON_SIZE[variant]} />
          {iosLabel ?? 'iOS'}
        </a>
      )}
      <AndroidPlayStoreButton
        playStoreUrl={playStoreUrl ?? undefined}
        variant={variant === 'compact' ? 'compact' : 'default'}
      />
    </>
  );
}
