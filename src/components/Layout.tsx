import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { Home, ShoppingCart, BookOpen, Notes, Menu, Cancel, Human, Login, Globe, Coins, Store, Trophy } from 'pixelarticons/react';
import { MusicPlayer } from './MusicPlayer';
import { LoginModal } from './LoginModal';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, isRestoring, isLoading, user } = useAuth();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Only the landing page has a full-bleed hero image behind the bar. There the
  // header is lifted out of flow so the art runs underneath it and the scrim has
  // something to dissolve into. Everywhere else the page opens on a flat
  // bg-m2e-chrome strip that a solid bar continues seamlessly — fading over those
  // just reveals the cream page behind and reads as a muddy seam.
  const blendsIntoHero = pathname === '/';

  // Past the first few pixels the bar stops being part of the artwork and starts
  // being chrome over content, so it swaps from a fading scrim to a blurred pane.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) setShowLogin(false);
  }, [isAuthenticated]);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home, iconOnly: true },
    { href: '/gameplay', label: 'Guide', icon: BookOpen, iconOnly: true },
    { href: '/market', label: 'Market', icon: ShoppingCart, iconOnly: true },
    { href: '/store', label: 'Shop', icon: Store, iconOnly: true },
    { href: '/changelog', label: 'Updates', icon: Notes, iconOnly: false },
    { href: '/roadmap', label: 'Roadmap', icon: Globe, iconOnly: false },
    { href: '/leaderboard', label: 'Scores', icon: Trophy, iconOnly: false },
  ] as const;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-m2e-bg text-m2e-text">
      {/* Nav — melts into each page's hero at rest, becomes a blurred pane on scroll */}
      <header
        className={`sticky top-0 z-50 text-white relative transition-colors duration-300 ${
          scrolled
            ? 'bg-m2e-chrome/75 backdrop-blur-md border-b border-white/10'
            : blendsIntoHero
              ? 'bg-transparent border-b border-transparent'
              : 'bg-m2e-chrome border-b border-white/10'
        }`}
      >
        {/* Blend layer. Taller than the bar so it keeps the nav legible at the top
            and then dissolves into the art below, instead of ending on a hard edge. */}
        <div
          aria-hidden
          className={`absolute inset-x-0 top-0 h-[190%] pointer-events-none bg-gradient-to-b from-m2e-chrome via-m2e-chrome/80 to-transparent transition-opacity duration-300 ${
            scrolled || !blendsIntoHero ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Scanlines, clipped to the bar itself */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 scanlines-light" />
        </div>

        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-16 relative z-10">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Galavant" className="h-12 w-12 md:h-14 md:w-14 pixel-render" />
            <span
              className="hidden sm:inline text-m2e-watts-light text-xl md:text-2xl tracking-[0.25em] uppercase group-hover:animate-glitch-shift"
              style={{ textShadow: '2px 2px 0px var(--color-m2e-watts-deep), 4px 4px 0px rgba(0,0,0,0.7)' }}
            >
              Galavant
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm uppercase tracking-wider">
            {navLinks.map(({ href, label, icon: Icon, iconOnly }) => (
              <NavPill
                key={href}
                to={href}
                active={isActive(href)}
                title={label}
              >
                <Icon className="w-5 h-5" />
                {!iconOnly && label}
              </NavPill>
            ))}

            {isAuthenticated && (
              <NavPill to="/earn" active={isActive('/earn')} watts glow>
                <img src="/assets/token-silver.png" alt="WATTS" className="w-5 h-5 pixel-render" />
                Earn WATTS
              </NavPill>
            )}

            {isAuthenticated && (
              <NavPill to="/wallet" active={isActive('/wallet')}>
                <Coins className="w-5 h-5" />
                Wallet
              </NavPill>
            )}

            {isAuthenticated ? (
              <NavPill to="/profile" active={isActive('/profile')}>
                <Human className="w-5 h-5" />
                You
              </NavPill>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-m2e-accent-light hover:bg-m2e-accent hover:text-m2e-text-on-accent transition-colors cursor-pointer [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]"
              >
                <Login className="w-5 h-5" />
                Login
              </button>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="hidden max-md:inline-flex items-center justify-center bg-m2e-accent text-m2e-text-on-accent border-2 border-m2e-accent-dark rounded-md p-2"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <Cancel className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className="md:hidden bg-m2e-chrome border-t border-white/10 px-4 py-3 flex flex-col gap-1 text-sm uppercase tracking-wider relative">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <MobileLink
                key={href}
                to={href}
                active={isActive(href)}
                onClick={() => setMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {label}
              </MobileLink>
            ))}
            {isAuthenticated && (
              <MobileLink
                to="/earn"
                active={isActive('/earn')}
                watts
                onClick={() => setMenuOpen(false)}
              >
                <img src="/assets/token-silver.png" alt="WATTS" className="w-5 h-5 pixel-render" />
                Earn WATTS
              </MobileLink>
            )}
            {isAuthenticated && (
              <MobileLink
                to="/wallet"
                active={isActive('/wallet')}
                onClick={() => setMenuOpen(false)}
              >
                <Coins className="w-5 h-5" />
                Wallet
              </MobileLink>
            )}
            {isAuthenticated ? (
              <MobileLink
                to="/profile"
                active={isActive('/profile')}
                onClick={() => setMenuOpen(false)}
              >
                <Human className="w-5 h-5" />
                You
              </MobileLink>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); setShowLogin(true); }}
                className="flex items-center gap-3 text-m2e-accent py-2 px-2 cursor-pointer"
              >
                <Login className="w-5 h-5" />
                Login
              </button>
            )}
          </nav>
        )}
      </header>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />

      <main className={`flex-1 w-full ${blendsIntoHero ? '-mt-16' : ''}`}>
        <Outlet />
      </main>

      {/* Footer — matches the dark chrome */}
      <footer className="bg-m2e-chrome text-white relative overflow-hidden pb-20">
        <div className="absolute inset-0 pointer-events-none scanlines-light" />
        <div className="mx-auto max-w-7xl px-4 py-10 flex flex-col items-center gap-5 text-center relative">
          <div className="section-label justify-center w-fit mx-auto">Community</div>
          <h3
            className="text-m2e-accent text-2xl md:text-3xl uppercase tracking-[0.25em]"
            style={{ textShadow: '2px 2px 0px var(--color-m2e-accent-dark), 4px 4px 0px rgba(0,0,0,0.6)' }}
          >
            Join the Crew
          </h3>
          <p className="text-sm text-white/60 max-w-md">
            Stay up to date, share feedback, and connect with fellow Galavant riders.
          </p>
          <div className="flex items-center gap-3 mt-1">
            <a
              href="https://t.me/galavanteer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/5 border-2 border-white/20 text-white/80 px-4 py-2 rounded-md hover:border-m2e-accent hover:text-m2e-accent hover:bg-m2e-accent/10 transition-colors text-sm uppercase tracking-wider"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
              Telegram
            </a>
            <a
              href="https://x.com/galavanteer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/5 border-2 border-white/20 text-white/80 px-4 py-2 rounded-md hover:border-m2e-accent hover:text-m2e-accent hover:bg-m2e-accent/10 transition-colors text-sm uppercase tracking-wider"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X / Twitter
            </a>
          </div>
          {/* The sky clock — the town's five hours */}
          <div className="flex gap-1.5 w-full max-w-md mx-auto mt-2" aria-hidden>
            {([
              ['05', '#9A8FDE', '#CBBCE6'],
              ['09', '#BFD2E8', '#D2DCE6'],
              ['16', '#E9B87F', '#EECFA0'],
              ['18', '#A879B8', '#C39BC4'],
              ['20', '#241D47', '#1C1735'],
            ] as const).map(([h, a, b]) => (
              <div
                key={h}
                className="flex-1 h-5 rounded-sm relative overflow-hidden"
                style={{ background: `linear-gradient(90deg, ${a} 0 50%, ${b} 50% 100%)` }}
              >
                <span className="absolute left-1 top-0 text-[10px] text-white/85" style={{ textShadow: '1px 1px 0 rgba(0,0,0,.6)' }}>{h}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 pt-4 border-t border-white/10 w-full text-xs text-white/50 uppercase tracking-[0.25em]">
            <span>Powered by Enjin</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span>Galavant · Walk. Earn. Conquer.</span>
            <span className="hidden sm:inline text-white/20">|</span>
            {/* On every page, because a stuck player is never on the page you expected. */}
            <Link to="/report" className="hover:text-m2e-accent transition-colors">Report a Problem</Link>
            <span className="hidden sm:inline text-white/20">|</span>
            <Link to="/press-kit" className="hover:text-m2e-accent transition-colors">Press Kit</Link>
            <span className="hidden sm:inline text-white/20">|</span>
            <Link to="/privacy" className="hover:text-m2e-accent transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

      <MusicPlayer />
    </div>
  );
}

/**
 * Nav tone ladder — violet is reserved for "you are here", so exactly one item
 * can ever carry it. `watts` marks the currency action in WATTS silver; every
 * other item stays quiet until it becomes the current page.
 */
function NavPill({ to, active, watts, glow, title, children }: {
  to: string;
  active: boolean;
  watts?: boolean;
  glow?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  const base =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-colors relative ' +
    '[text-shadow:0_1px_2px_rgba(0,0,0,0.75)]';
  const tone = active
    ? 'text-m2e-accent-light'
    : watts
      ? 'text-m2e-watts hover:text-m2e-watts-light'
      : 'text-white/90 hover:text-white';
  const bg = active ? 'bg-white/10' : 'hover:bg-white/5';
  const glowCls = glow ? 'animate-glitch-flicker hover:animate-none' : '';

  return (
    <Link to={to} title={title} className={`${base} ${tone} ${bg} ${glowCls}`}>
      {children}
      {active && (
        <span className="absolute left-2 right-2 -bottom-0.5 h-[2px] bg-m2e-accent-light" />
      )}
    </Link>
  );
}

function MobileLink({ to, active, watts, onClick, children }: {
  to: string;
  active: boolean;
  watts?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const tone = active
    ? 'text-m2e-accent bg-white/10'
    : watts
      ? 'text-m2e-watts'
      : 'text-white/70 hover:text-white hover:bg-white/5';
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 py-2 px-2 rounded-sm transition-colors ${tone}`}
    >
      {children}
    </Link>
  );
}

