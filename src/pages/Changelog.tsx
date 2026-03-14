import { useState, useEffect } from 'react';
import { Notes, Zap, Debug, Redo, Download } from 'pixelarticons/react';
import type { ChangeType, ChangelogData } from '../types/changelog';

const CHANGE_CONFIG: Record<ChangeType, { label: string; color: string; bg: string; Icon: React.ComponentType<any> }> = {
  feature: { label: 'NEW', color: 'text-m2e-success', bg: 'bg-m2e-success/15', Icon: Zap },
  fix: { label: 'FIX', color: 'text-m2e-danger', bg: 'bg-m2e-danger/15', Icon: Debug },
  improvement: { label: 'IMP', color: 'text-m2e-info', bg: 'bg-m2e-info/15', Icon: Redo },
};

export function Changelog() {
  const [data, setData] = useState<ChangelogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
 <span className="text-xs text-m2e-text-muted uppercase tracking-wider">
                      {entry.date}
                    </span>
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
