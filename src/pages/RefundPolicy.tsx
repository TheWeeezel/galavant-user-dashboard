import { Link } from 'react-router';
import { Undo } from 'pixelarticons/react';
import { LEGAL_UPDATED, SELLER } from '../config/legal';

const mail = <a href={`mailto:${SELLER.email}`} className="text-m2e-accent hover:underline">{SELLER.email}</a>;

export function RefundPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Undo className="w-10 h-10 text-m2e-accent" />
          <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Refund Policy</h1>
        </div>
        <p className="text-m2e-text-secondary text-xl">Last updated: {LEGAL_UPDATED}</p>
      </div>

      <div className="pixel-card p-6 md:p-8 space-y-8 text-lg leading-relaxed text-m2e-text-secondary">
        <section className="space-y-3">
          <p>
            Bikes are digital items, added to your account right after you pay. This page says when we
            refund. It is part of our <Link to="/terms" className="text-m2e-accent hover:underline">Terms of Sale</Link>.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">We refund in full when</h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>you paid and the bike never arrived;</li>
            <li>you were charged twice for one bike;</li>
            <li>a fault on our side makes the bike unusable and we cannot fix it;</li>
            <li>
              you ask within 14 days of buying and have not used the bike yet: no walk with it, and not
              levelled, bred, sold or exported.
            </li>
          </ul>
          <p>
            Otherwise a purchase is final, because the bike is yours from the moment you pay, as you agreed
            before paying. This does not limit any right the consumer law of your country gives you.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">How to ask</h2>
          <p>
            Write to {mail} from the email address of your Galavant account, with the payment date and
            amount. The receipt from Link is enough. We reply within five working days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">What happens next</h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>We remove the bike from your account.</li>
            <li>A card payment goes back through Link and usually shows on your statement within 5–10 days.</li>
            <li>An ENJ payment goes back to the wallet that paid, as the same amount of ENJ.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Card purchases and Link</h2>
          <p>
            Card purchases are sold through Link, Stripe's merchant of record, so you can also ask Link
            support for a refund at <a href="https://support.link.com" className="text-m2e-accent hover:underline">support.link.com</a>.
            Link can refund within 60 days of the purchase. Whoever refunds, the bike leaves your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Bank disputes</h2>
          <p>
            Please write to us before you dispute a card payment with your bank; it is faster for you. While
            a dispute is open, we may remove the bike it paid for.
          </p>
        </section>
      </div>
    </div>
  );
}
