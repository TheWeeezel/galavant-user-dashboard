export type ChangeType = 'feature' | 'fix' | 'improvement';

export interface ChangeEntry {
  type: ChangeType;
  text: string;
}

export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  apkUrl?: string;
  changes: ChangeEntry[];
}

export interface ChangelogData {
  testflightUrl: string;
  versions: VersionEntry[];
}
