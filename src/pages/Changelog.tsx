import { useState, useEffect } from 'react';
import { Notes, Zap, Debug, Redo, Download, Smartphone } from 'pixelarticons/react';
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
              {data.versions[0]?.apkUrl && (
                <a
                  href={data.versions[0].apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
 className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-sm"
                >
 <Download className="w-4 h-4" />
                  Download for Android
                </a>
              )}
              {data.testflightUrl && (
                <a
                  href={data.testflightUrl}
                  target="_blank"
                  rel="noopener noreferrer"
 className="pixel-btn pixel-btn-secondary inline-flex items-center gap-2 text-sm"
                >
 <Smartphone className="w-4 h-4" />
                  Download for iOS
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

                  {/* Download buttons — latest version only */}
                  {i === 0 && (
 <div className="flex flex-wrap gap-3">
                      {entry.apkUrl && (
                        <a
                          href={entry.apkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
 className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-sm"
                        >
 <Download className="w-4 h-4" />
                          Download APK
                        </a>
                      )}
                      {data.testflightUrl && (
                        <a
                          href={data.testflightUrl}
                          target="_blank"
                          rel="noopener noreferrer"
 className="pixel-btn pixel-btn-secondary inline-flex items-center gap-2 text-sm"
                        >
 <Smartphone className="w-4 h-4" />
                          Join TestFlight
                        </a>
                      )}
                    </div>
                  )}

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
