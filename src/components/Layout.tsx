import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router';
import { Home, ShoppingCart, BookOpen, Notes, Menu, Cancel, Human, Login } from 'pixelarticons/react';
import { MusicPlayer } from './MusicPlayer';
import { LoginModal } from './LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { useWalletAuth } from '../hooks/useWalletAuth';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, isRestoring, isLoading, user } = useAuth();

  console.log('[Layout] render — isAuthenticated:', isAuthenticated, 'isRestoring:', isRestoring, 'isLoading:', isLoading, 'user:', user?.nickname ?? null, 'showLogin:', showLogin);

  // Auto-close login modal when auth succeeds (e.g. wallet connect)
  useEffect(() => {
    if (isAuthenticated) setShowLogin(false);
  }, [isAuthenticated]);

  // Bridge wallet connect events to auth (auto-login on refresh, auto-logout on disconnect)
  useWalletAuth();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home, iconOnly: true },
    { href: '/gameplay', label: 'Guide', icon: BookOpen, iconOnly: true },
    { href: '/market', label: 'Market', icon: ShoppingCart, iconOnly: true },
    { href: '/changelog', label: 'Updates', icon: Notes, iconOnly: false },
  ] as const;

  return (
 <div className="min-h-screen flex flex-col bg-m2e-bg text-m2e-text">
      {/* Nav */}
 <header className="sticky top-0 z-50 border-b-2 border-m2e-border bg-m2e-card shadow-sm">
 <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-16">
 <Link to="/" className="flex items-center gap-2">
 <img src="/logo.png" alt="Galavant" className="h-14 w-14" />
 <span className="hidden sm:inline text-m2e-accent text-2xl tracking-widest uppercase" style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}>Galavant</span>
          </Link>

          {/* Desktop nav */}
 <nav className="hidden md:flex items-center gap-3 text-sm uppercase tracking-wider">
            {navLinks.map(({ href, label, icon: Icon, iconOnly }) => (
 <Link key={href} to={href} className="flex items-center gap-2 bg-m2e-card-alt border-2 border-m2e-border text-m2e-text-secondary px-3 py-2 rounded-md hover:bg-m2e-border-light hover:text-m2e-text transition-colors" title={label}>
 <Icon className="w-5 h-5" />
                {!iconOnly && label}
              </Link>
            ))}
            {isAuthenticated && (
 <Link to="/earn" className="flex items-center gap-2 bg-m2e-accent text-m2e-text-on-accent border-2 border-m2e-accent-dark px-3 py-2 rounded-md hover:opacity-90 transition-opacity animate-pulse hover:animate-none font-bold text-sm">
 <img src="/assets/token-silver.png" alt="SAP" className="w-5 h-5" />
                Earn SAP
              </Link>
            )}
            {isAuthenticated ? (
 <Link to="/profile" className="flex items-center gap-2 bg-m2e-accent/10 border-2 border-m2e-accent text-m2e-accent px-3 py-2 rounded-md hover:bg-m2e-accent/20 transition-colors">
 <Human className="w-5 h-5" />
                {user?.nickname ?? 'Profile'}
              </Link>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
 className="flex items-center gap-2 bg-m2e-accent text-m2e-text-on-accent border-2 border-m2e-accent-dark px-3 py-2 rounded-md hover:opacity-90 transition-opacity cursor-pointer"
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
 <nav className="md:hidden bg-m2e-card border-b-2 border-m2e-border px-4 py-3 flex flex-col gap-2 text-sm uppercase tracking-wider">
            {navLinks.map(({ href, label, icon: Icon, iconOnly }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMenuOpen(false)}
 className="flex items-center gap-3 bg-m2e-card-alt border-2 border-m2e-border text-m2e-text-secondary px-4 py-3 rounded-md hover:bg-m2e-border-light hover:text-m2e-text transition-colors w-full"
              >
 <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/earn"
                onClick={() => setMenuOpen(false)}
 className="flex items-center gap-3 bg-m2e-accent text-m2e-text-on-accent border-2 border-m2e-accent-dark px-4 py-3 rounded-md hover:opacity-90 transition-opacity font-bold text-base w-full"
              >
 <img src="/assets/token-silver.png" alt="SAP" className="w-5 h-5" />
                Earn SAP
              </Link>
            )}
            {isAuthenticated ? (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
 className="flex items-center gap-3 bg-m2e-accent/10 border-2 border-m2e-accent text-m2e-accent px-4 py-3 rounded-md hover:bg-m2e-accent/20 transition-colors w-full"
              >
 <Human className="w-5 h-5" />
                {user?.nickname ?? 'Profile'}
              </Link>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); setShowLogin(true); }}
 className="flex items-center gap-3 bg-m2e-accent text-m2e-text-on-accent border-2 border-m2e-accent-dark px-4 py-3 rounded-md hover:opacity-90 transition-opacity cursor-pointer w-full"
              >
 <Login className="w-5 h-5" />
                Login
              </button>
            )}
          </nav>
        )}
      </header>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />

      {/* Content */}
 <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
 <footer className="border-t-2 border-m2e-border bg-m2e-card-alt py-8 pb-20">
 <div className="mx-auto max-w-7xl px-4 flex flex-col items-center gap-4 text-center">
 <h3 className="text-m2e-accent text-lg uppercase tracking-widest" style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}>Join Our Community</h3>
 <p className="text-sm text-m2e-text-muted max-w-md">Stay up to date, share feedback, and connect with fellow Galavant riders.</p>
 <div className="flex items-center gap-4 mt-1">
            <a href="https://t.me/galavantBTC" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-m2e-card border-2 border-m2e-border text-m2e-text-secondary px-4 py-2 rounded-md hover:border-m2e-accent hover:text-m2e-accent transition-colors text-sm uppercase tracking-wider">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
              Telegram
            </a>
            <a href="https://x.com/galavantBTC" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-m2e-card border-2 border-m2e-border text-m2e-text-secondary px-4 py-2 rounded-md hover:border-m2e-accent hover:text-m2e-accent transition-colors text-sm uppercase tracking-wider">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X / Twitter
            </a>
          </div>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 pt-4 border-t border-m2e-border/50 w-full text-sm text-m2e-text-muted uppercase tracking-wide">
            <span>Powered by OPNet on Bitcoin</span>
            <span className="hidden sm:inline text-m2e-border">|</span>
            <span>Galavant &mdash; Walk. Earn. Conquer.</span>
          </div>
        </div>
      </footer>

      {/* Music Player */}
      <MusicPlayer />
    </div>
  );
}
