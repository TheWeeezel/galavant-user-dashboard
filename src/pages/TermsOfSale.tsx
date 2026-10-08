import { Link } from 'react-router';
import { Receipt } from 'pixelarticons/react';
import { LEGAL_UPDATED, SELLER } from '../config/legal';

const mail = <a href={`mailto:${SELLER.email}`} className="text-m2e-accent hover:underline">{SELLER.email}</a>;
const refunds = <Link to="/refunds" className="text-m2e-accent hover:underline">Refund Policy</Link>;

export function TermsOfSale() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Receipt className="w-10 h-10 text-m2e-accent" />
          <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Terms of Sale</h1>
        </div>
        <p className="text-m2e-text-secondary text-xl">Last updated: {LEGAL_UPDATED}</p>
      </div>

      <div className="pixel-card p-6 md:p-8 space-y-8 text-lg leading-relaxed text-m2e-text-secondary">
        <section className="space-y-3">
          <p>
            These terms apply when you buy something from Galavant on galavant.run. If anything here is
            unclear, write to {mail}.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">1. Who sells to you</h2>
          <p>
            {SELLER.name} is run from {SELLER.country} ("Galavant", "we"). Email: {mail}.
          </p>
          <p>
            Card purchases are sold through Link, Stripe's merchant of record. Link is the seller of the
            payment: it charges any VAT or sales tax that applies, sends the receipt and handles payment
            support. Galavant provides the bike and the game. We never see your full card number.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">2. What you buy</h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Bikes for the Galavant game, sold in the Bike Shop on galavant.run. A bike is a digital item:
              it lives in your Galavant account and you use it in the game.
            </li>
            <li>Every shop bike is Common quality. Its type decides the pace it rewards, and each bike in the shop shows its speed band.</li>
            <li>
              A bike is a game item, not money and not an investment. Bikes and WATTS have no cash value,
              and we do not promise any earnings, resale price or future value.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">3. Price and payment</h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Prices are in US dollars and shown before you pay. Shop prices rise in steps as bikes sell;
              the price shown at checkout is the price you pay.
            </li>
            <li>Card checkout may show the price in your local currency and adds any tax that applies before you pay.</li>
            <li>
              You can pay by card through Stripe, or in ENJ from your own Enjin Wallet. An ENJ payment
              counts once the exact amount shown arrives at the shop address on the Enjin blockchain.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">4. Delivery</h2>
          <p>
            The bike is added to the Galavant account you are signed in with, normally within a minute of
            payment. If it has not arrived after an hour, write to {mail} with your account email and the
            payment date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">5. Your right to cancel</h2>
          <p>
            Bikes are delivered right away. For card purchases, Link applies the cancellation rules of your
            country as part of checkout. For ENJ purchases, you agree before you send that delivery starts
            immediately and that your 14-day right to cancel ends once the bike is in your account; the ENJ
            payment screen says so.
          </p>
          <p>
            Our {refunds} lists when we refund anyway. Nothing in these terms limits rights you have under
            the consumer law of the country you live in.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">6. Your own wallet</h2>
          <p>
            Where the game allows it, you can export a bike to your own Enjin Wallet as an NFT. The wallet
            and its keys are yours, and so is the responsibility for them. Blockchain transfers cannot be
            undone, and we cannot recover an item sent to a wrong address.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">7. Fair play</h2>
          <p>
            Rewards depend on real movement outdoors. If an account cheats, for example with spoofed GPS
            or several accounts for one person, we can hold its rewards, remove what it gained by cheating,
            or close it, and we tell you why. Purchases are not refunded when an account is closed for
            cheating.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">8. Changes to the game</h2>
          <p>
            Galavant is a live game. We change and rebalance it, and that can change how a bike performs.
            We do not take back a bike you bought, except as described in section 7 and in the {refunds}.
            If we ever shut Galavant down, we will announce it at least 60 days ahead. Items you exported
            stay in your wallet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">9. Liability</h2>
          <p>
            As far as the law allows, our liability for a purchase is limited to the amount you paid for
            it. This does not limit liability for intent or gross negligence, or any right you cannot give
            up under consumer law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">10. Law</h2>
          <p>
            Swiss law applies. If you buy as a consumer, you keep the protection of the mandatory consumer
            law of the country you live in.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">11. Changes to these terms</h2>
          <p>
            If we change these terms, the version shown when you bought something applies to that purchase.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        <section className="space-y-3">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Contact</h2>
          <p>{SELLER.name}, {SELLER.country}</p>
          <p>Email: {mail}</p>
        </section>
      </div>
    </div>
  );
}
