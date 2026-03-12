import { useState, useEffect } from 'react';
import { Notes, Zap, Debug, Redo, Download, Smartphone } from 'pixelarticons/react';

type ChangeType = 'feature' | 'fix' | 'improvement';

interface ChangeEntry {
  type: ChangeType;
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  title: string;
  apkUrl?: string;
  changes: ChangeEntry[];
}

interface ChangelogData {
  testflightUrl: string;
  versions: VersionEntry[];
}

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
    <div className="mx-auto max-w-3xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Notes className="w-8 h-8 text-m2e-accent" />
        <h1 className="text-3xl font-black tracking-tight">Changelog</h1>
      </div>
      <p className="text-m2e-text-secondary text-sm">
        All notable updates to Galavant. Each version includes new features, improvements, and bug fixes.
      </p>

      {loading ? (
        <div className="text-m2e-text-muted text-sm">Loading changelog...</div>
      ) : error ? (
        <div className="text-red-400 text-sm">Failed to load changelog</div>
      ) : data ? (
        <>
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
                      <span className="text-xl font-black text-m2e-accent tracking-wide">
                        v{entry.version}
                      </span>
                      {i === 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-m2e-accent text-m2e-text-on-accent pixel-border">
                          Latest
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-m2e-text-muted uppercase tracking-wider">
                      {entry.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-m2e-text">
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
                          className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-sm font-bold"
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
                          className="pixel-btn pixel-btn-secondary inline-flex items-center gap-2 text-sm font-bold"
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
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest pixel-border whitespace-nowrap mt-0.5 ${config.bg} ${config.color} border-current`}>
                            <config.Icon className="w-3 h-3" />
                            {config.label}
                          </span>
                          <span className="text-sm text-m2e-text-secondary leading-relaxed">
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
      <p className="text-center text-xs text-m2e-text-muted font-bold uppercase tracking-wider pt-4">
        Galavant &mdash; Walk to Earn on Bitcoin via OPNet
      </p>
    </div>
  );
}
