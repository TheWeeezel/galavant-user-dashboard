import { Link } from 'react-router';
import { Mail } from 'pixelarticons/react';
import { SELLER } from '../config/legal';

/** The Support URL App Store Connect and the app point at (galavant.run/support). */
export function Support() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-10">
      <div className="flex items-center gap-4">
        <Mail className="w-10 h-10 text-m2e-accent" />
        <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Support</h1>
      </div>
      <div className="pixel-card p-6 md:p-8 space-y-6 text-lg leading-relaxed text-m2e-text-secondary">
        <p>
          Questions, a problem with a walk, a purchase or your account? Write to{' '}
          <a href={`mailto:${SELLER.email}`} className="text-m2e-accent hover:underline">{SELLER.email}</a>{' '}
          and we answer personally, usually within a day or two.
        </p>
        <p>
          In the app you can also send a report from the Profile tab. Purchases made through the App Store are
          refunded by Apple at <a href="https://reportaproblem.apple.com" className="text-m2e-accent hover:underline">reportaproblem.apple.com</a>.
        </p>
        <p>
          To delete your account, open Profile, then Account, then Delete account. See also the{' '}
          <Link to="/gameplay" className="text-m2e-accent hover:underline">gameplay guide</Link>,{' '}
          <Link to="/privacy" className="text-m2e-accent hover:underline">privacy policy</Link> and{' '}
          <Link to="/refunds" className="text-m2e-accent hover:underline">refund policy</Link>.
        </p>
      </div>
    </div>
  );
}
