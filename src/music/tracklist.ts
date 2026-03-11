export interface Track {
  /** Path to audio file in /public/music/ */
  src: string;
  title: string;
  /** Original artist / composer / game */
  artist: string;
  /** Credit line (e.g. YouTube uploader) */
  credit: string;
}

/**
 * Galavant Radio tracklist.
 * Place audio files in public/music/ and reference them as "/music/filename.mp3".
 */
export const tracklist: Track[] = [
  {
    src: '/music/repeated-tragedy.mp3',
    title: 'Repeated Tragedy',
    artist: 'The Raiden Project OST',
    credit: 'YouTube: AlexTheLuffyFan765',
  },
  {
    src: '/music/track-03.mp3',
    title: 'MilkyWay (Battle)',
    artist: 'FTL: Faster Than Light OST — Ben Prunty',
    credit: 'YouTube: Frostythefiremage',
  },
  {
    src: '/music/track-04.mp3',
    title: 'Opening',
    artist: 'Pokemon Red/Blue OST — Junichi Masuda',
    credit: 'YouTube: pokemonmusicmaster',
  },
];
