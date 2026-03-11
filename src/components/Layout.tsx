import { Outlet } from 'react-router';
import { Home, ShoppingCart, BookOpen } from 'pixelarticons/react';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-m2e-bg text-m2e-text font-bold">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b-2 border-m2e-border bg-m2e-card shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-16">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Galavant" className="h-14 w-14" />
            <span className="text-m2e-accent font-black text-2xl tracking-widest uppercase" style={{ textShadow: '1px 1px 0px var(--color-m2e-accent-dark)' }}>Galavant</span>
          </a>
          <nav className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider">
            <a href="/" className="flex items-center gap-2 bg-m2e-card-alt border-2 border-m2e-border text-m2e-text-secondary px-3 py-2 rounded-md hover:bg-m2e-border-light hover:text-m2e-text transition-colors">
              <Home className="w-5 h-5" />
              Home
            </a>
            <a href="/gameplay" className="flex items-center gap-2 bg-m2e-card-alt border-2 border-m2e-border text-m2e-text-secondary px-3 py-2 rounded-md hover:bg-m2e-border-light hover:text-m2e-text transition-colors">
              <BookOpen className="w-5 h-5" />
              Guide
            </a>
            <a href="/market" className="flex items-center gap-2 bg-m2e-card-alt border-2 border-m2e-border text-m2e-text-secondary px-3 py-2 rounded-md hover:bg-m2e-border-light hover:text-m2e-text transition-colors">
              <ShoppingCart className="w-5 h-5" />
              Market
            </a>
          </nav>
        </div>
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
