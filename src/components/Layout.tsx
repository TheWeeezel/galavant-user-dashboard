import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { Home, ShoppingCart, BookOpen, Notes, Menu, Cancel, Human, Login, Globe, Coins } from 'pixelarticons/react';
import { MusicPlayer } from './MusicPlayer';
import { LoginModal } from './LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { useWalletAuth } from '../hooks/useWalletAuth';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, isRestoring, isLoading, user } = useAuth();
  const { pathname } = useLocation();

  console.log('[Layout] render — isAuthenticated:', isAuthenticated, 'isRestoring:', isRestoring, 'isLoading:', isLoading, 'user:', user?.nickname ?? null, 'showLogin:', showLogin);

  useEffect(() => {
    if (isAuthenticated) setShowLogin(false);
  }, [isAuthenticated]);

  useWalletAuth();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home, iconOnly: true },
    { href: '/gameplay', label: 'Guide', icon: BookOpen, iconOnly: true },
    { href: '/market', label: 'Market', icon: ShoppingCart, iconOnly: true },
    { href: '/changelog', label: 'Updates', icon: Notes, iconOnly: false },
    { href: '/roadmap', label: 'Roadmap', icon: Globe, iconOnly: false },
  ] as const;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-m2e-bg text-m2e-text">
      {/* Nav — dark arcade chrome to flow into each page's hero */}
      <header className="sticky top-0 z-50 bg-m2e-text text-white border-b border-white/10 relative overflow-hidden">
        {/* Scanline overlay matching the heroes */}
        <div className="absolute inset-0 pointer-events-none scanlines-light" />

        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-16 relative">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Galavant" className="h-12 w-12 md:h-14 md:w-14 pixel-render" />
            <span
              className="hidden sm:inline text-m2e-accent text-xl md:text-2xl tracking-[0.25em] uppercase group-hover:animate-glitch-shift"
              style={{ textShadow: '2px 2px 0px var(--color-m2e-accent-dark), 4px 4px 0px rgba(0,0,0,0.6)' }}
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
              <NavPill to="/earn" active={isActive('/earn')} accent glow>
                <img src="/assets/token-silver.png" alt="SAP" className="w-5 h-5 pixel-render" />
                Earn SAP
              </NavPill>
            )}

            {isAuthenticated && (
              <NavPill to="/wallet" active={isActive('/wallet')}>
                <Coins className="w-5 h-5" />
                Wallet
              </NavPill>
            )}

            {isAuthenticated ? (
              <NavPill to="/profile" active={isActive('/profile')} accent>
                <Human className="w-5 h-5" />
                You
              </NavPill>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-m2e-accent hover:bg-m2e-accent hover:text-m2e-text-on-accent transition-colors cursor-pointer"
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
          <nav className="md:hidden bg-m2e-text border-t border-white/10 px-4 py-3 flex flex-col gap-1 text-sm uppercase tracking-wider relative">
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
                accent
                onClick={() => setMenuOpen(false)}
              >
                <img src="/assets/token-silver.png" alt="SAP" className="w-5 h-5 pixel-render" />
                Earn SAP
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
                accent
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

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer — matches the dark chrome */}
      <footer className="bg-m2e-text text-white relative overflow-hidden pb-20">
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
              href="https://t.me/galavantBTC"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/5 border-2 border-white/20 text-white/80 px-4 py-2 rounded-md hover:border-m2e-accent hover:text-m2e-accent hover:bg-m2e-accent/10 transition-colors text-sm uppercase tracking-wider"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
              Telegram
            </a>
            <a
              href="https://x.com/galavantBTC"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/5 border-2 border-white/20 text-white/80 px-4 py-2 rounded-md hover:border-m2e-accent hover:text-m2e-accent hover:bg-m2e-accent/10 transition-colors text-sm uppercase tracking-wider"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X / Twitter
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 pt-4 border-t border-white/10 w-full text-xs text-white/50 uppercase tracking-[0.25em]">
            <span>Powered by OPNet on Bitcoin</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span>Galavant · Walk. Earn. Conquer.</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <Link to="/privacy" className="hover:text-m2e-accent transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

      <MusicPlayer />
    </div>
  );
}

function NavPill({ to, active, accent, glow, title, children }: {
  to: string;
  active: boolean;
  accent?: boolean;
  glow?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-colors relative';
  const tone = accent
    ? 'text-m2e-accent hover:text-m2e-accent-dark'
    : active
      ? 'text-m2e-accent'
      : 'text-white/70 hover:text-white';
  const bg = active && !accent ? 'bg-white/10' : 'hover:bg-white/5';
  const glowCls = glow ? 'animate-glitch-flicker hover:animate-none' : '';

  return (
    <Link to={to} title={title} className={`${base} ${tone} ${bg} ${glowCls}`}>
      {children}
      {active && (
        <span className="absolute left-2 right-2 -bottom-0.5 h-[2px] bg-m2e-accent" />
      )}
    </Link>
  );
}

function MobileLink({ to, active, accent, onClick, children }: {
  to: string;
  active: boolean;
  accent?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const tone = accent
    ? 'text-m2e-accent'
    : active
      ? 'text-m2e-accent bg-white/10'
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
