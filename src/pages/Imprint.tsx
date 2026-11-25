import { Link } from 'react-router';
import { InfoBox } from 'pixelarticons/react';
import { OPERATOR, SELLER } from '../config/legal';

/** galavant.run/imprint: who runs Galavant (the operator in config/legal.ts). */
export function Imprint() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-10">
      <div className="flex items-center gap-4">
        <InfoBox className="w-10 h-10 text-m2e-accent" />
        <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Imprint</h1>
      </div>
      <div className="pixel-card p-6 md:p-8 space-y-6 text-lg leading-relaxed text-m2e-text-secondary">
        <section className="space-y-1">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Operator</h2>
          <p>{OPERATOR.name}</p>
          <p>{OPERATOR.country}</p>
          <p>
            <a href={OPERATOR.url} target="_blank" rel="noopener noreferrer" className="text-m2e-accent hover:underline">vedea.ch</a>
          </p>
        </section>
        <p>
          Vedea Ventures is a sole proprietorship, not a registered company, and is not entered in the
          commercial register.
        </p>
        <section className="space-y-1">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Contact for Galavant</h2>
          <p>
            Email: <a href={`mailto:${SELLER.email}`} className="text-m2e-accent hover:underline">{SELLER.email}</a>
          </p>
          <p>
            See also the <Link to="/terms" className="text-m2e-accent hover:underline">Terms of Sale</Link> and the{' '}
            <Link to="/privacy" className="text-m2e-accent hover:underline">Privacy Policy</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
