/**
 * Mirror of AVATAR_PRESETS in @m2e/shared. The dashboard is a separate repo and
 * does not depend on the workspace package, so the catalogue is duplicated here.
 * Ids must stay in step with the app — the server stores one id for both.
 */
export interface AvatarPreset {
  id: string;
  art: string;
  bg: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'rider', art: 'rider', bg: '#671E1E' },
  { id: 'commuter', art: 'commuter', bg: '#672F1E' },
  { id: 'touring', art: 'touring', bg: '#67411E' },
  { id: 'racing', art: 'racing', bg: '#67521E' },
  { id: 'energy', art: 'energy', bg: '#67641E' },
  { id: 'lootbox', art: 'lootbox', bg: '#58671E' },
  { id: 'gem', art: 'gem', bg: '#46671E' },
  { id: 'toolbox', art: 'toolbox', bg: '#35671E' },
  { id: 'sword', art: 'sword', bg: '#23671E' },
  { id: 'lock', art: 'lock', bg: '#1E6729' },
  { id: 'coin', art: 'coin', bg: '#1E673B' },
  { id: 'heart', art: 'heart', bg: '#1E674C' },
  { id: 'shield', art: 'shield', bg: '#1E675E' },
  { id: 'clover', art: 'clover', bg: '#1E5E67' },
  { id: 'star', art: 'star', bg: '#1E4C67' },
  { id: 'helmet', art: 'helmet', bg: '#1E3B67' },
  { id: 'trophy', art: 'trophy', bg: '#1E2967' },
  { id: 'wallet', art: 'wallet', bg: '#231E67' },
  { id: 'cart', art: 'cart', bg: '#351E67' },
  { id: 'backpack', art: 'backpack', bg: '#461E67' },
  { id: 'house', art: 'house', bg: '#581E67' },
  { id: 'crown', art: 'crown', bg: '#671E64' },
  { id: 'flame', art: 'flame', bg: '#671E52' },
  { id: 'skull', art: 'skull', bg: '#671E41' },
  { id: 'joystick', art: 'joystick', bg: '#671E2F' },
];

const PREFIX = 'preset:';

/** `preset:sword` -> the entry. Returns null for a plain URL or an unknown id. */
export function resolveAvatarPreset(avatarUrl: string | null | undefined): AvatarPreset | null {
  if (!avatarUrl || !avatarUrl.startsWith(PREFIX)) return null;
  const id = avatarUrl.slice(PREFIX.length);
  return AVATAR_PRESETS.find((a) => a.id === id) ?? null;
}

export function avatarArtUrl(preset: AvatarPreset): string {
  return `/assets/avatars/${preset.art}.png`;
}
