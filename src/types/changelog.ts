export type ChangeType = 'feature' | 'fix' | 'improvement';

export interface ChangeEntry {
  type: ChangeType;
  text: string;
}

export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: ChangeEntry[];
}

export interface ChangelogData {
  testflightUrl: string;
  /**
   * Google Play Store listing URL for the closed testing track. Optional —
   * the AndroidWhitelistButton has a hardcoded fallback.
   */
  playStoreUrl?: string;
  versions: VersionEntry[];
}
