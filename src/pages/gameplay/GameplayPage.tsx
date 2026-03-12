import { useParams, Link, Navigate } from 'react-router';
import { ChevronLeft, ChevronRight } from 'pixelarticons/react';
import { flatPages, type ContentBlock } from './gameplay-content';

function renderBlock(block: ContentBlock, i: number) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={i} className="text-lg text-m2e-text-secondary font-medium leading-relaxed">
          {block.text}
        </p>
      );
    case 'heading':
      return (
        <h2
          key={i}
          className="text-2xl md:text-3xl font-black uppercase tracking-wide text-m2e-text border-b-2 border-m2e-accent/40 pb-2 mt-10 mb-4"
        >
          {block.text}
        </h2>
      );
    case 'list':
      return (
        <ul key={i} className="space-y-3 pl-2">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-lg text-m2e-text-secondary font-medium leading-relaxed">
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
          <span className="font-black text-m2e-accent uppercase tracking-wider text-sm block mb-1">
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
                    className="px-4 py-3 text-left font-black uppercase tracking-wider text-m2e-text text-sm border-b-2 border-m2e-border"
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
        <p className="text-m2e-text-muted font-bold">Page not found.</p>
        <Link to="/gameplay" className="text-m2e-accent font-bold mt-2 inline-block">
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
      <div className="text-xs font-bold text-m2e-text-muted uppercase tracking-wider mb-4">
        <Link to="/gameplay" className="hover:text-m2e-accent transition-colors">
          Guide
        </Link>
        {' / '}
        <span className="text-m2e-text-secondary">{current.sectionTitle}</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-m2e-text mb-8">
        {current.page.title}
      </h1>

      {/* Content */}
      <div className="space-y-6">
        {current.page.content.map((block, i) => renderBlock(block, i))}
      </div>

      {/* Prev / Next */}
      <div className="flex items-stretch gap-4 mt-12 pt-6 border-t-2 border-m2e-border">
        {prev ? (
          <Link
            to={`/gameplay/${prev.sectionSlug}/${prev.page.slug}`}
            className="flex-1 pixel-card px-4 py-3 flex items-center gap-2 hover:border-m2e-accent/60 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 text-m2e-text-muted group-hover:text-m2e-accent transition-colors shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-m2e-text-muted">
                Previous
              </div>
              <div className="text-sm font-bold text-m2e-text-secondary group-hover:text-m2e-accent transition-colors truncate">
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
            className="flex-1 pixel-card px-4 py-3 flex items-center justify-end gap-2 hover:border-m2e-accent/60 transition-colors group text-right"
          >
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-m2e-text-muted">
                Next
              </div>
              <div className="text-sm font-bold text-m2e-text-secondary group-hover:text-m2e-accent transition-colors truncate">
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
