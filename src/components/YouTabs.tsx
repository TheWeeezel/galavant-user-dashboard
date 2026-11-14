import { Link, useLocation } from 'react-router';
import { Human, Coins } from 'pixelarticons/react';

/**
 * The signed-in area is one place, "You" in the nav, with three tabs. The routes stay their own
 * (/profile, /wallet, /earn, all linked from posts and the app), the tab bar is what makes them
 * read as one area. It sits right under the header, above each page's hero strip, so it stays put
 * when the hero below it changes height between tabs.
 */
export const YOU_TABS = [
  { to: '/profile', label: 'Profile', icon: <Human className="w-5 h-5" /> },
  { to: '/wallet', label: 'Wallet', icon: <Coins className="w-5 h-5" /> },
  { to: '/earn', label: 'Earn', icon: <img src="/assets/token-silver.png" alt="" className="w-5 h-5 pixel-render" /> },
] as const;

export function isYouPath(pathname: string): boolean {
  return YOU_TABS.some(({ to }) => pathname === to || pathname.startsWith(`${to}/`));
}

/** `width` matches the page's own container, so the tabs line up with the hero below them. */
export function YouTabs({ width = 'max-w-6xl' }: { width?: string }) {
  const { pathname } = useLocation();
  return (
    <div className="bg-m2e-chrome text-white border-b border-white/10">
      <nav aria-label="You" className={`mx-auto ${width} px-4 md:px-8 py-3 flex flex-wrap gap-2`}>
        {YOU_TABS.map(({ to, label, icon }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 uppercase tracking-wide text-sm md:text-base border-2 transition-colors no-underline ${
                active
                  ? 'border-m2e-accent bg-m2e-accent/15 text-m2e-accent-light'
                  : 'border-white/20 text-white/70 hover:border-white/50 hover:text-white'
              }`}
            >
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
