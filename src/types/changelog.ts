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
   * Google Play open-testing opt-in URL. Optional — the AndroidPlayStoreButton
   * has a hardcoded fallback to https://play.google.com/apps/testing/com.m2e.opnet.
   */
  playStoreUrl?: string;
  versions: VersionEntry[];
}
