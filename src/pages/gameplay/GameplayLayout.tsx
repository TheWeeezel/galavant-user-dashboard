import { useState } from 'react';
import { Outlet } from 'react-router';
import { Menu, Cancel } from 'pixelarticons/react';
import { GameplaySidebar } from './GameplaySidebar';

export function GameplayLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex gap-0 -mx-4 md:-mx-8 -my-4 md:-my-8 -mb-12 md:-mb-16 min-h-[calc(100vh-4rem)]">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="hidden max-lg:inline-flex fixed bottom-4 right-4 z-[60] items-center justify-center bg-m2e-accent text-m2e-text-on-accent border-2 border-m2e-accent-dark p-4 rounded-full shadow-lg"
        aria-label="Toggle guide menu"
      >
        {sidebarOpen ? <Cancel className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
      </button>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-72 shrink-0 border-l-2 border-r-2 border-m2e-border bg-m2e-card overflow-y-auto
          lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:block
          ${sidebarOpen
            ? 'fixed inset-y-0 left-0 z-50 top-16 h-[calc(100vh-4rem)] block'
            : 'hidden'
          }`}
      >
        <GameplaySidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 lg:py-16">
        <Outlet />
      </div>
    </div>
  );
}
