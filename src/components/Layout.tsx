import { useState } from 'react';
import { Outlet } from 'react-router';
import { Home, ShoppingCart, BookOpen, Menu, Cancel } from 'pixelarticons/react';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/gameplay', label: 'Guide', icon: BookOpen },
    { href: '/market', label: 'Market', icon: ShoppingCart },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-m2e-bg text-m2e-text font-bold">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b-2 border-m2e-border bg-m2e-card shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-16">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Galavant" className="h-14 w-14" />
            <span className="hidden sm:inline text-m2e-accent font-black text-2xl tracking-widest uppercase" style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}>Galavant</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-3 text-sm font-bold uppercase tracking-wider">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className="flex items-center gap-2 bg-m2e-card-alt border-2 border-m2e-border text-m2e-text-secondary px-3 py-2 rounded-md hover:bg-m2e-border-light hover:text-m2e-text transition-colors">
                <Icon className="w-5 h-5" />
                {label}
              </a>
            ))}
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
          <nav className="md:hidden bg-m2e-card border-b-2 border-m2e-border px-4 py-3 flex flex-col gap-2 text-sm font-bold uppercase tracking-wider">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 bg-m2e-card-alt border-2 border-m2e-border text-m2e-text-secondary px-4 py-3 rounded-md hover:bg-m2e-border-light hover:text-m2e-text transition-colors w-full"
              >
                <Icon className="w-5 h-5" />
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-m2e-border bg-m2e-card py-6 mt-8">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-m2e-text-muted font-bold uppercase tracking-wide">
          <span>Powered by OPNet on Bitcoin</span>
          <span>Walk to Earn &mdash; Walk. Earn. Own.</span>
        </div>
      </footer>
    </div>
  );
}
