import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Zap, Debug, Redo, Download, Link as LinkIcon } from 'pixelarticons/react';
import type { ChangeType, ChangelogData, VersionEntry } from '../types/changelog';
import { AndroidWhitelistButton } from '../components/AndroidWhitelistButton';

const CHANGE_CONFIG: Record<ChangeType, { label: string; color: string; bg: string; Icon: React.ComponentType<any> }> = {
  feature: { label: 'NEW', color: 'text-m2e-success', bg: 'bg-m2e-success/15', Icon: Zap },
  fix: { label: 'FIX', color: 'text-m2e-danger', bg: 'bg-m2e-danger/15', Icon: Debug },
  improvement: { label: 'IMP', color: 'text-m2e-info', bg: 'bg-m2e-info/15', Icon: Redo },
};

const SECTION_HEADERS: Record<ChangeType, { emoji: string; title: string }> = {
  feature: { emoji: '\u{1F195}', title: 'New Features' },
  improvement: { emoji: '\u{1F504}', title: 'Improvements' },
  fix: { emoji: '\u{1F6E0}', title: 'Fixes' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }).toUpperCase();
}

function buildShareMessage(entry: VersionEntry): string {
  const lines: string[] = [];
  lines.push(`\u{1F680} Galavant Update — v${entry.version}`);
  lines.push('');
  lines.push(`\u{1F4C5} ${formatDate(entry.date)}`);
  lines.push('');
  lines.push(`${entry.title}`);
  lines.push('https://galavant.run/changelog');

  const grouped: Record<ChangeType, string[]> = { feature: [], improvement: [], fix: [] };
  for (const change of entry.changes) {
    grouped[change.type].push(change.text);
  }

  for (const type of ['feature', 'improvement', 'fix'] as ChangeType[]) {
    if (grouped[type].length === 0) continue;
    const { emoji, title } = SECTION_HEADERS[type];
    lines.push('');
    lines.push(`${emoji} ${title}`);
    lines.push('');
    for (const text of grouped[type]) {
      lines.push(`- ${text}`);
    }
  }

  lines.push('');
  lines.push('\u{1F9EA} Help Us Test the Platform');
  lines.push('');
  lines.push('We are currently testing the ecosystem before Mainnet launch and are tracking which users complete which tasks.');
  lines.push('');
  lines.push('\u{1F449} Use the wallet and complete tasks here:');
  lines.push('https://galavant.run/tasks');
  lines.push('');
  lines.push('\u{1F381} All completed tasks will be rewarded with Bike Parts once we go live on Mainnet.');
  lines.push('');
  lines.push('\u{1F426} Follow us on X: https://x.com/galavantBTC');
  lines.push('\u{1F4AC} Join our Telegram: https://t.me/galavantBTC');

  return lines.join('\n');
}

// ── Animation Variants ──────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardFlyIn: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const dotReveal: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const lineGrow: Variants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

// ── Component ───────────────────────────────────────────────────────────────

export function Changelog() {
  const [data, setData] = useState<ChangelogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedVersion, setCopiedVersion] = useState<string | null>(null);

  const handleShare = useCallback(async (entry: VersionEntry) => {
    const message = buildShareMessage(entry);

    if (navigator.share) {
      try {
        await navigator.share({ text: message });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(message);
      setCopiedVersion(entry.version);
      setTimeout(() => setCopiedVersion(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedVersion(entry.version);
      setTimeout(() => setCopiedVersion(null), 2000);
    }
  }, []);

  useEffect(() => {
    fetch('/changelog.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load changelog');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const vp = { once: true, margin: '-60px' };

  // Totals for the top metrics strip
  const totals = useMemo(() => {
    if (!data) return { versions: 0, features: 0, fixes: 0, improvements: 0 };
    let features = 0, fixes = 0, improvements = 0;
    for (const v of data.versions) {
      for (const c of v.changes) {
        if (c.type === 'feature') features++;
        else if (c.type === 'fix') fixes++;
        else improvements++;
      }
    }
    return { versions: data.versions.length, features, fixes, improvements };
  }, [data]);

  const latestVersion = data?.versions[0];

  return (
    <>
      {/* Hero strip */}
      <div className="border-b-2 border-m2e-border bg-m2e-text text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 relative z-10">
          <motion.div
            className="space-y-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div className="section-label">
              08 · Patch Notes
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
              Patch<br />
              <span className="text-m2e-accent">Notes.</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl">
              Every shipped fix, feature, and improvement — in chronological order, freshest first.
            </p>
            {latestVersion && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs md:text-sm uppercase tracking-widest">
                <span className="px-3 py-1.5 pixel-border bg-m2e-accent text-m2e-text-on-accent border-m2e-accent-dark">
                  Now Playing · v{latestVersion.version}
                </span>
                <span className="text-white/60">{formatShortDate(latestVersion.date)}</span>
                <span className="text-white/60">·</span>
                <span className="text-white/80 truncate max-w-[60vw]">{latestVersion.title}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 space-y-12">
        {/* Metrics strip */}
        {!loading && !error && data && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <MetricChip label="Versions" value={totals.versions} color="text-m2e-accent" />
            <MetricChip label="Features" value={totals.features} color="text-m2e-success" />
            <MetricChip label="Fixes" value={totals.fixes} color="text-m2e-danger" />
            <MetricChip label="Improvements" value={totals.improvements} color="text-m2e-info" />
          </motion.div>
        )}

        {loading ? (
          <div className="text-m2e-text-muted text-sm">Loading patch log…</div>
        ) : error ? (
          <div className="text-m2e-danger text-sm">Failed to load changelog</div>
        ) : data ? (
          <>
            {/* Download Section */}
            <motion.div
              className="pixel-card p-6 md:p-8 space-y-4 relative overflow-hidden"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <div className="absolute inset-0 pixel-grid-bg opacity-40 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-m2e-accent/15 border-2 border-m2e-accent/40 flex items-center justify-center pixel-shadow-sm">
                    <Download className="w-7 h-7 text-m2e-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-m2e-text-muted uppercase tracking-widest">Latest Build</div>
                    <h2 className="text-2xl md:text-3xl tracking-wide uppercase">Get the App</h2>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {data.testflightUrl && (
                    <a
                      href={data.testflightUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-sm px-5 py-3"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      iOS
                    </a>
                  )}
                  <AndroidWhitelistButton playStoreUrl={data.playStoreUrl} />
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="space-y-6">
              <div className="section-label">Log · Newest First</div>
              <motion.div
                className="relative space-y-6"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={vp}
              >
                {/* Vertical line */}
                <motion.div
                  className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-m2e-accent via-m2e-border to-m2e-border origin-top"
                  variants={lineGrow}
                />

                {data.versions.map((entry, i) => (
                  <motion.div
                    key={entry.version}
                    className="relative pl-12"
                    variants={cardFlyIn}
                  >
                    {/* Timeline dot */}
                    <motion.div
                      className={`absolute left-2.5 top-5 w-5 h-5 rounded-full border-2 ${
                        i === 0
                          ? 'bg-m2e-accent border-m2e-accent-dark animate-pulse-ring'
                          : 'bg-m2e-card border-m2e-border'
                      }`}
                      variants={dotReveal}
                    />

                    <motion.div
                      className="pixel-card p-5 md:p-6 space-y-4 relative overflow-hidden"
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    >
                      {/* Version number ghost */}
                      <div className="absolute -top-2 -right-2 text-7xl md:text-8xl text-m2e-border/30 leading-none pointer-events-none select-none">
                        {String(i + 1).padStart(2, '0')}
                      </div>

                      {/* Version header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 relative">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl md:text-3xl text-m2e-accent tracking-wide text-chroma-soft leading-none">
                            v{entry.version}
                          </span>
                          {i === 0 && (
                            <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest bg-m2e-accent text-m2e-text-on-accent pixel-border border-m2e-accent-dark flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-blink" />
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-m2e-text-muted uppercase tracking-[0.25em]">
                            {formatShortDate(entry.date)}
                          </span>
                          <button
                            onClick={() => handleShare(entry)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest pixel-border transition-colors ${
                              copiedVersion === entry.version
                                ? 'bg-m2e-success/15 text-m2e-success border-current'
                                : 'bg-m2e-bg-alt text-m2e-text-muted border-m2e-border hover:text-m2e-accent hover:border-m2e-accent'
                            }`}
                            title="Share this update"
                          >
                            {copiedVersion === entry.version ? (
                              <>
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Copied
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-3 h-3" />
                                Share
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg md:text-xl text-m2e-text relative">
                        {entry.title}
                      </h3>

                      {/* Divider */}
                      <div className="h-[2px] bg-gradient-to-r from-m2e-accent via-m2e-border to-transparent" />

                      {/* Changes */}
                      <ul className="space-y-2.5 relative">
                        {entry.changes.map((change, j) => {
                          const config = CHANGE_CONFIG[change.type];
                          return (
                            <li key={j} className="flex items-start gap-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest pixel-border whitespace-nowrap mt-0.5 ${config.bg} ${config.color} border-current`}>
                                <config.Icon className="w-3 h-3" />
                                {config.label}
                              </span>
                              <span className="text-base md:text-lg text-m2e-text-secondary leading-relaxed">
                                {change.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </>
        ) : null}

        <p className="text-center text-xs text-m2e-text-muted uppercase tracking-widest pt-4">
          &gt; END OF LOG · Walk to Earn on Bitcoin via OPNet
        </p>
      </div>
    </>
  );
}

function MetricChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="pixel-card p-4 flex flex-col items-start gap-1"
    >
      <div className={`text-3xl md:text-4xl leading-none ${color}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] text-m2e-text-muted uppercase tracking-[0.3em]">{label}</div>
    </motion.div>
  );
}
