import { useParams, Link, Navigate } from 'react-router';
import { ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { flatPages, type ContentBlock, type ChartBar } from './gameplay-content';

function BarChart({ title, bars, unit = '' }: { title: string; bars: ChartBar[]; unit?: string }) {
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <div className="my-6 pixel-card px-5 py-5">
      <div className="text-sm uppercase tracking-wider text-m2e-text mb-4">{title}</div>
      <div className="space-y-2.5">
        {bars.map((bar, i) => {
          const pct = max > 0 ? (bar.value / max) * 100 : 0;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-right text-sm text-m2e-text-secondary font-medium truncate">
                {bar.label}
              </span>
              <div className="flex-1 h-6 bg-m2e-card-alt/60 border border-m2e-border/50 relative overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${bar.accent ? 'bg-m2e-accent' : 'bg-m2e-accent/60'}`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-sm text-m2e-text-secondary font-medium tabular-nums">
                {bar.value}{unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderBlock(block: ContentBlock, i: number) {
  switch (block.type) {
    case 'paragraph':
      return (
 <p key={i} className="text-xl text-m2e-text-secondary leading-relaxed">
          {block.text}
        </p>
      );
    case 'heading':
      return (
        <h2
          key={i}
 className="text-2xl md:text-3xl uppercase tracking-wide text-m2e-text border-b-2 border-m2e-accent/40 pb-2 mt-10 mb-4"
        >
          {block.text}
        </h2>
      );
    case 'list':
      return (
 <ul key={i} className="space-y-3 pl-2">
          {block.items.map((item, j) => (
 <li key={j} className="flex gap-3 text-xl text-m2e-text-secondary leading-relaxed">
 <span className="text-m2e-accent shrink-0 mt-1">&#9656;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'tip':
      return (
        <div
          key={i}
 className="pixel-card border-m2e-accent/60 bg-m2e-accent/5 px-6 py-4 my-6 text-base"
        >
 <span className="text-m2e-accent uppercase tracking-wider text-sm block mb-1">
            Tip:
          </span>
 <span className="text-m2e-text-secondary font-medium leading-relaxed">{block.text}</span>
        </div>
      );
    case 'table':
      return (
 <div key={i} className="overflow-x-auto my-6">
 <table className="w-full text-base border-2 border-m2e-border">
            <thead>
 <tr className="bg-m2e-card-alt">
                {block.headers.map((h, j) => (
                  <th
                    key={j}
 className="px-4 py-3 text-left uppercase tracking-wider text-m2e-text text-sm border-b-2 border-m2e-border"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
 <tr key={ri} className={ri % 2 === 0 ? 'bg-m2e-card/50' : 'bg-m2e-card-alt/30'}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
 className="px-4 py-3 text-m2e-text-secondary font-medium border-b border-m2e-border/50"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'divider':
 return <hr key={i} className="border-t-2 border-m2e-border my-4" />;
    case 'chart':
      return <BarChart key={i} title={block.title} bars={block.bars} unit={block.unit} />;
  }
}

export function GameplayPage() {
  const { sectionSlug, pageSlug } = useParams();

  // Redirect /gameplay to first page
  if (!sectionSlug || !pageSlug) {
    const first = flatPages[0];
    if (first) {
      return <Navigate to={`/gameplay/${first.sectionSlug}/${first.page.slug}`} replace />;
    }
    return null;
  }

  const currentIndex = flatPages.findIndex(
    (fp) => fp.sectionSlug === sectionSlug && fp.page.slug === pageSlug,
  );

  if (currentIndex === -1) {
    return (
 <div className="py-12 text-center">
 <p className="text-m2e-text-muted">Page not found.</p>
 <Link to="/gameplay" className="text-m2e-accent mt-2 inline-block">
          Back to Guide
        </Link>
      </div>
    );
  }

  const current = flatPages[currentIndex];
  const prev = currentIndex > 0 ? flatPages[currentIndex - 1] : null;
  const next = currentIndex < flatPages.length - 1 ? flatPages[currentIndex + 1] : null;

  return (
    <article>
      {/* Breadcrumb */}
 <div className="text-xs text-m2e-text-muted uppercase tracking-wider mb-4">
 <Link to="/gameplay" className="hover:text-m2e-accent transition-colors">
          Guide
        </Link>
        {' / '}
 <span className="text-m2e-text-secondary">{current.sectionTitle}</span>
      </div>

      {/* Title */}
 <h1 className="text-4xl md:text-5xl tracking-wide text-m2e-text mb-8">
        {current.page.title}
      </h1>

      {/* Content */}
 <div className="space-y-6">
        {current.page.content.map((block, i) => renderBlock(block, i))}
      </div>

      {/* Prev / Next */}
 <div className="flex items-stretch gap-4 mt-12 pt-6 border-t-2 border-m2e-border overflow-hidden">
        {prev ? (
          <Link
            to={`/gameplay/${prev.sectionSlug}/${prev.page.slug}`}
 className="flex-1 min-w-0 pixel-card px-4 py-3 flex items-center gap-2 hover:border-m2e-accent/60 transition-colors group overflow-hidden"
          >
 <ChevronLeft className="w-5 h-5 text-m2e-text-muted group-hover:text-m2e-accent transition-colors shrink-0" />
 <div className="min-w-0">
 <div className="text-[10px] uppercase tracking-widest text-m2e-text-muted">
                Previous
              </div>
 <div className="text-sm text-m2e-text-secondary group-hover:text-m2e-accent transition-colors truncate">
                {prev.page.title}
              </div>
            </div>
          </Link>
        ) : (
 <div className="flex-1" />
        )}
        {next ? (
          <Link
            to={`/gameplay/${next.sectionSlug}/${next.page.slug}`}
 className="flex-1 min-w-0 pixel-card px-4 py-3 flex items-center justify-end gap-2 hover:border-m2e-accent/60 transition-colors group text-right overflow-hidden"
          >
 <div className="min-w-0">
 <div className="text-[10px] uppercase tracking-widest text-m2e-text-muted">
                Next
              </div>
 <div className="text-sm text-m2e-text-secondary group-hover:text-m2e-accent transition-colors truncate">
                {next.page.title}
              </div>
            </div>
 <ChevronRight className="w-5 h-5 text-m2e-text-muted group-hover:text-m2e-accent transition-colors shrink-0" />
          </Link>
        ) : (
 <div className="flex-1" />
        )}
      </div>
    </article>
  );
}
