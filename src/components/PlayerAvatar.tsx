import { resolveAvatarPreset, avatarArtUrl } from '../avatars';

/**
 * A player's avatar, from whichever of the three sources they have: a chosen
 * preset, the Google picture they signed up with, or their initial.
 *
 * Presets are stored as `preset:<id>`, which is not a URL — rendering avatarUrl
 * straight into an img breaks for anyone who has picked one.
 */
export function PlayerAvatar({ avatarUrl, nickname, className = '', textClassName = '' }: {
  avatarUrl?: string | null;
  nickname?: string | null;
  /** Sizing and framing. The component only decides what goes inside. */
  className?: string;
  /** Type size for the initial fallback. */
  textClassName?: string;
}) {
  const preset = resolveAvatarPreset(avatarUrl);

  if (preset) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden ${className}`}
        style={{ backgroundColor: preset.bg }}
      >
        <img
          src={avatarArtUrl(preset)}
          alt={nickname ?? 'Avatar'}
          className="w-[78%] h-[78%] object-contain pixel-render"
          loading="lazy"
        />
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={nickname ?? 'Avatar'}
        className={`object-cover pixel-render ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`bg-m2e-bg-alt flex items-center justify-center ${className}`}>
      <span className={`text-m2e-accent text-chroma-soft ${textClassName}`}>
        {(nickname ?? '?')[0].toUpperCase()}
      </span>
    </div>
  );
}
