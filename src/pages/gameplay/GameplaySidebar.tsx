import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronDown } from 'pixelarticons/react';
import { gameplaySections } from './gameplay-content';

export function GameplaySidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { sectionSlug, pageSlug } = useParams();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-expand current section
  useEffect(() => {
    if (sectionSlug) {
      setExpanded((prev) => ({ ...prev, [sectionSlug]: true }));
    }
  }, [sectionSlug]);

  const toggle = (slug: string) => {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  return (
    <nav className="py-4">
      <div className="px-4 pb-3 text-xs font-black uppercase tracking-widest text-m2e-text-muted">
        Gameplay Guide
      </div>
      {gameplaySections.map((section) => {
        const isExpanded = expanded[section.slug] ?? false;
        const isCurrent = section.slug === sectionSlug;
        const Icon = section.icon;

        return (
          <div key={section.slug}>
            {/* Section header */}
            <button
              onClick={() => toggle(section.slug)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-black uppercase tracking-wider transition-colors hover:bg-m2e-border-light/50 ${
                isCurrent ? 'text-m2e-accent' : 'text-m2e-text-secondary'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{section.title}</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                  isExpanded ? '' : '-rotate-90'
                }`}
              />
            </button>

            {/* Pages */}
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isExpanded ? 'max-h-96' : 'max-h-0'
              }`}
            >
              {section.pages.map((page) => {
                const isActive =
                  section.slug === sectionSlug && page.slug === pageSlug;

                return (
                  <Link
                    key={page.slug}
                    to={`/gameplay/${section.slug}/${page.slug}`}
                    onClick={onNavigate}
                    className={`block pl-11 pr-4 py-2 text-sm font-bold transition-colors ${
                      isActive
                        ? 'text-m2e-accent bg-m2e-accent/10 border-l-2 border-m2e-accent'
                        : 'text-m2e-text-muted hover:text-m2e-text-secondary hover:bg-m2e-border-light/30 border-l-2 border-transparent'
                    }`}
                  >
                    {page.title}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
