import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ChevronLeft, Download, Image as ImageIcon, Coins, Human } from 'pixelarticons/react';

/**
 * Press kit. Built because the Enjin ecosystem keeps a shared directory of
 * creator media kits and every entry is a single public URL — so this page is
 * the URL, and everything on it is downloadable without asking anyone.
 */

const BRAND_COLOURS: { name: string; hex: string; note: string }[] = [
  { name: 'Accent', hex: '#7866D5', note: 'Enjin violet — the primary brand colour' },
  { name: 'Accent dark', hex: '#5F4FC0', note: 'Shadows, pressed states, emboss' },
  { name: 'Accent on dark', hex: '#9E92E4', note: 'Violet on dark chrome, contrast-safe' },
  { name: 'Parchment', hex: '#F0EBE0', note: 'Page ground' },
  { name: 'Chrome', hex: '#2C2420', note: 'Header, hero strips, body text' },
  { name: 'WATTS silver', hex: '#BAC5C7', note: 'Currency-flavoured UI' },
  { name: 'Jade', hex: '#2E9E71', note: 'Success' },
  { name: 'Crimson', hex: '#C93B4A', note: 'Danger' },
];

const ASSETS: { icon: React.ComponentType<any>; title: string; body: string; files: { label: string; href: string }[] }[] = [
  {
    icon: ImageIcon,
    title: 'Logo',
    body: 'The winged crest, transparent PNG. The primary mark — gold on purpose, and it stays gold on violet.',
    files: [
      { label: '2048px', href: '/press-kit/logo/galavant-crest-2048.png' },
      { label: '1024px', href: '/press-kit/logo/galavant-crest-1024.png' },
      { label: '512px', href: '/press-kit/logo/galavant-crest-512.png' },
      { label: '256px', href: '/press-kit/logo/galavant-crest-256.png' },
    ],
  },
  {
    icon: Human,
    title: 'App icon / avatar',
    body: 'The crest on violet, laid out to survive a circle crop. Use the 400px for X, the 512px for Telegram.',
    files: [
      { label: '1024px', href: '/press-kit/icon/galavant-icon-1024.png' },
      { label: '512px', href: '/press-kit/icon/galavant-icon-512.png' },
      { label: '400px', href: '/press-kit/icon/galavant-icon-400.png' },
    ],
  },
  {
    icon: ImageIcon,
    title: 'Key art',
    body: 'The landing artwork at 5504×3072, in both day and night lighting. Same scene, same framing.',
    files: [
      { label: 'Night', href: '/press-kit/key-art/galavant-key-art-night.webp' },
      { label: 'Day', href: '/press-kit/key-art/galavant-key-art-day.webp' },
    ],
  },
  {
    icon: Coins,
    title: 'Token marks',
    body: 'WATTS is the in-game currency; ENJ is the chain token used for staking and seasonal payouts.',
    files: [
      { label: 'WATTS', href: '/press-kit/tokens/watts-token.png' },
      { label: 'ENJ', href: '/press-kit/tokens/enj-coin.svg' },
    ],
  },
];

export function PressKit() {
  return (
    <>
      <div className="border-b-2 border-m2e-border bg-m2e-text text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 relative z-10">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-m2e-accent text-xs uppercase tracking-[0.25em]">
                <ChevronLeft className="w-4 h-4" />
                Home
              </Link>
              <span className="text-white/30">/</span>
              <div className="section-label">Media</div>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
              Press<br />
              <span className="text-m2e-accent">Kit.</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl">
              Logos, key art and brand colours. Take what you need — no attribution required,
              no permission to ask for.
            </p>
            <a
              href="/press-kit/galavant-press-kit.zip"
              download
              className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-base px-6 py-3 mt-2"
            >
              <Download className="w-5 h-5" />
              Download everything (4 MB)
            </a>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 md:py-14 space-y-12">
        <section className="space-y-4">
          <div className="section-label">About Galavant</div>
          <p className="text-lg text-m2e-text-secondary max-w-3xl leading-relaxed">
            Galavant is a walk-to-earn game on the Enjin blockchain. Players earn WATTS by walking
            with balance bikes, trade parts and NFT bikes with each other, and redeem earned WATTS
            for real ENJ at the end of each season — out of a budget funded by platform revenue
            rather than by minting a token.
          </p>
        </section>

        <section className="space-y-5">
          <div className="section-label">Assets</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ASSETS.map((a) => (
              <div key={a.title} className="pixel-card p-5 md:p-6 space-y-3">
                <div className="flex items-center gap-2.5">
                  <a.icon className="w-6 h-6 text-m2e-accent" />
                  <h2 className="text-xl uppercase tracking-wide text-m2e-text leading-none">{a.title}</h2>
                </div>
                <p className="text-sm text-m2e-text-secondary leading-relaxed">{a.body}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {a.files.map((f) => (
                    <a
                      key={f.href}
                      href={f.href}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider pixel-border bg-m2e-card border-m2e-border text-m2e-text-secondary hover:border-m2e-accent hover:text-m2e-accent transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {f.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="section-label">Brand colours</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {BRAND_COLOURS.map((c) => (
              <div key={c.hex} className="pixel-card overflow-hidden">
                <div className="h-16" style={{ backgroundColor: c.hex }} />
                <div className="p-3 space-y-0.5">
                  <div className="text-sm uppercase tracking-wide text-m2e-text leading-none">{c.name}</div>
                  <div className="text-xs font-mono text-m2e-text-secondary">{c.hex}</div>
                  <div className="text-[11px] text-m2e-text-muted leading-snug">{c.note}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="section-label">Using these</div>
          <ul className="space-y-2 text-m2e-text-secondary max-w-3xl">
            {[
              'Use the crest or icon as supplied — please do not recolour or redraw them.',
              'The crest is gold on purpose. It stays gold on violet backgrounds.',
              'Do not stretch. Everything here is square or 16:9 and should scale proportionally.',
              'Galavant is one word, capitalised. The currency is WATTS, in caps.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 shrink-0 bg-m2e-accent" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          <p className="text-sm text-m2e-text-secondary">
            Anything missing? Ask on{' '}
            <a href="https://t.me/galavanteer" target="_blank" rel="noopener noreferrer" className="text-m2e-accent hover:underline">
              Telegram
            </a>{' '}
            and we will add it.
          </p>
        </section>
      </div>
    </>
  );
}
