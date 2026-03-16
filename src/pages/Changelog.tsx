import { useState, useEffect, useCallback } from 'react';
import { Notes, Zap, Debug, Redo, Download } from 'pixelarticons/react';
import type { ChangeType, ChangelogData, VersionEntry } from '../types/changelog';

const CHANGE_CONFIG: Record<ChangeType, { label: string; color: string; bg: string; Icon: React.ComponentType<any> }> = {
  feature: { label: 'NEW', color: 'text-m2e-success', bg: 'bg-m2e-success/15', Icon: Zap },
  fix: { label: 'FIX', color: 'text-m2e-danger', bg: 'bg-m2e-danger/15', Icon: Debug },
  improvement: { label: 'IMP', color: 'text-m2e-info', bg: 'bg-m2e-info/15', Icon: Redo },
};

const CHANGE_EMOJI: Record<ChangeType, string> = {
  feature: '\u{1F195}',
  fix: '\u{1F6E0}',
  improvement: '\u{1F504}',
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

function buildShareMessage(entry: VersionEntry): string {
  const lines: string[] = [];

  lines.push(`\u{1F680} Galavant Update \u2014 v${entry.version}`);
  lines.push('');
  lines.push(`\u{1F4C5} ${formatDate(entry.date)}`);
  lines.push('');
  lines.push(`${entry.title}`);
  lines.push('https://galavant.run/changelog');

  // Group changes by type
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
      lines.push(`${CHANGE_EMOJI[type]} ${text}`);
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

  return lines.join('\n');
}

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
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(message);
      setCopiedVersion(entry.version);
      setTimeout(() => setCopiedVersion(null), 2000);
    } catch {
      // Fallback for older browsers
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

  return (
 <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-10">
      {/* Header */}
 <div className="space-y-3">
 <div className="flex items-center gap-4">
 <Notes className="w-10 h-10 text-m2e-accent" />
 <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Changelog</h1>
        </div>
 <p className="text-m2e-text-secondary text-xl">
          All notable updates to Galavant. Each version includes new features, improvements, and bug fixes.
        </p>
      </div>

      {loading ? (
 <div className="text-m2e-text-muted text-sm">Loading changelog...</div>
      ) : error ? (
 <div className="text-red-400 text-sm">Failed to load changelog</div>
      ) : data ? (
        <>
          {/* Download Section */}
 <div className="pixel-card p-6 space-y-4">
 <div className="flex items-center gap-3">
 <Download className="w-7 h-7 text-m2e-accent" />
 <h2 className="text-xl tracking-wide">Download Galavant</h2>
            </div>
 <div className="flex flex-wrap gap-3">
              {data.testflightUrl && (
                <a
                  href={data.testflightUrl}
                  target="_blank"
                  rel="noopener noreferrer"
 className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-base px-6 py-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Download on iOS
                </a>
              )}
              {data.versions[0]?.apkUrl && (
                <a
                  href={data.versions[0].apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
 className="pixel-btn inline-flex items-center gap-2 text-base px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Download for Android
                </a>
              )}
            </div>
          </div>

          {/* Timeline */}
 <div className="relative space-y-6">
            {/* Vertical line */}
 <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-m2e-border" />

            {data.versions.map((entry, i) => (
 <div key={entry.version} className="relative pl-12">
                {/* Timeline dot */}
 <div className={`absolute left-2.5 top-5 w-5 h-5 rounded-full border-2 ${
                  i === 0
                    ? 'bg-m2e-accent border-m2e-accent-dark'
                    : 'bg-m2e-card border-m2e-border'
                }`} />

 <div className="pixel-card p-5 space-y-4">
                  {/* Version header */}
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div className="flex items-center gap-3">
 <span className="text-xl text-m2e-accent tracking-wide">
                        v{entry.version}
                      </span>
                      {i === 0 && (
 <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest bg-m2e-accent text-m2e-text-on-accent pixel-border">
                          Latest
                        </span>
                      )}
                    </div>
 <div className="flex items-center gap-2">
                      <span className="text-xs text-m2e-text-muted uppercase tracking-wider">
                        {entry.date}
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
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18 16c-.8 0-1.4.4-2 .8l-7-4v-1.6l7-4c.5.4 1.2.8 2 .8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3v.8l-7 4C7.5 9.4 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.4 2-.8l7 4v.8c0 1.7 1.3 3 3 3s3-1.3 3-3-1.3-3-3-3z"/>
                            </svg>
                            Share
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
 <h3 className="text-lg text-m2e-text">
                    {entry.title}
                  </h3>

                  {/* Divider */}
 <div className="h-[2px] bg-m2e-border" />

                  {/* Changes */}
 <ul className="space-y-2.5">
                    {entry.changes.map((change, j) => {
                      const config = CHANGE_CONFIG[change.type];
                      return (
 <li key={j} className="flex items-start gap-3">
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest pixel-border whitespace-nowrap mt-0.5 ${config.bg} ${config.color} border-current`}>
 <config.Icon className="w-3 h-3" />
                            {config.label}
                          </span>
 <span className="text-lg text-m2e-text-secondary leading-relaxed">
                            {change.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Footer */}
 <p className="text-center text-xs text-m2e-text-muted uppercase tracking-wider pt-4">
        Galavant &mdash; Walk to Earn on Bitcoin via OPNet
      </p>
    </div>
  );
}
