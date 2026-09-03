import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEnjPayment, type EnjPayment } from '../api';

/**
 * The ENJ till.
 *
 * Everything a card checkout hides behind a hosted page has to be visible here, because the buyer
 * performs the payment themselves in their own wallet: which chain, which address, exactly how
 * much, and how long the price holds. A transfer is final and there is no chargeback, so every
 * detail that could send the money somewhere else is stated rather than implied.
 *
 * WAS SICH AM 2026-09-01 GEAENDERT HAT, und warum diese Seite davon mehr traegt als vorher:
 * das Geld geht jetzt an EINE Galavant-Adresse statt an eine frische je Kauf. Das war die
 * Bedingung des Eigentuemers — wir unterschreiben nichts und halten nichts, also gibt es keine
 * Einzahlungs-Wallet mehr, deren Schluessel bei uns laegen. Der Preis dafuer: der Empfaenger ist
 * nicht mehr die Zuordnung. Die letzten vier Ziffern des Betrags sind es. Wer sie wegrundet,
 * ueberweist echtes Geld, das dann erst einmal niemandem gehoert — es ist nicht verloren, aber
 * es braucht einen Menschen. Deshalb steht der Betrag hier gross, zerlegt, kopierbar und mit dem
 * Satz daneben, was die letzten Ziffern bedeuten.
 *
 * KEIN QR-CODE, UND DAS IST EINE ENTSCHEIDUNG. Der Scanner der Enjin Wallet kennt belegt drei
 * Dinge: Verknuepfungscodes, Beam-Links und Enjin-Connect-Sitzungen. Ein QR mit einer nackten
 * Adresse oder einer erfundenen Zahlungs-URI ist dort nichts davon — er taete am Telefon
 * schlicht GAR NICHTS, und ein Knopf, der nichts tut, ist schlimmer als kein Knopf. Kopieren
 * funktioniert; also wird kopiert.
 *
 * The panel then polls. There is no webhook on this route — the server reads the relaychain and
 * notices the transfer within about half a minute, and this is the buyer's window onto that.
 */

/**
 * Die Wallet oeffnen. Belegt: dieser Host uebergibt auf Android per assetlinks.json ALLE Pfade an
 * com.enjin.mobile.wallet, und wer sie nicht installiert hat, wird geraeteabhaengig zum Store
 * bzw. zur Produktseite weitergeleitet. Es ist damit der einzige Link hier, der in beiden Faellen
 * etwas Sinnvolles tut — er traegt ausdruecklich KEINE Zahlung, die gibt es als Link nicht.
 */
const WALLET_LINK = 'https://deeplink.wallet.enjin.io/';

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function useCountdown(expiresAt: string): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return new Date(expiresAt).getTime() - now;
}

/** Ein Kopierknopf, der sagt, dass er kopiert hat. Betrag und Adresse haben je einen eigenen. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="pixel-btn pixel-btn-secondary px-3 py-2 text-xs"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

interface EnjPaymentPanelProps {
  payment: EnjPayment;
  displayName: string;
  onClose: () => void;
}

export function EnjPaymentPanel({ payment: initial, displayName, onClose }: EnjPaymentPanelProps) {
  const live = useQuery({
    queryKey: ['enj-payment', initial.quoteId],
    queryFn: () => fetchEnjPayment(initial.quoteId),
    initialData: initial,
    // Stops once there is nothing left to wait for — a delivered bike and a held payment are both
    // final as far as this panel is concerned.
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'redeemed' || s === 'held' ? false : 10_000;
    },
  });

  const payment = live.data ?? initial;
  const remaining = useCountdown(payment.expiresAt);
  const waiting = payment.status === 'open';

  // Der Betrag wird zerlegt gezeigt: der Preis, und danach die vier Ziffern, an denen wir diesen
  // Kauf erkennen. Nur der VOLLE String wird kopiert — die Zerlegung ist zum Lesen, nicht zum
  // Abtippen.
  const tagDigits = String(payment.paymentTag).padStart(4, '0');
  const amountHead = payment.amountEnj.slice(0, payment.amountEnj.length - 4);

  // Die einzige Pruefung, die der Kaeufer selbst durchfuehren kann: eine Relaychain-Adresse
  // beginnt mit "en". Eine Matrixchain-Adresse begaenne mit "ef" — dieselben Bytes, andere Kette,
  // und das Geld waere weg.
  const looksRelay = payment.address.startsWith('en');

  return (
    <div className="pixel-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-label">Pay with ENJ</div>
          <h3 className="text-2xl uppercase tracking-wide">{displayName}</h3>
        </div>
        <button className="pixel-btn pixel-btn-secondary px-3 py-2 text-xs" onClick={onClose}>
          Close
        </button>
      </div>

      {payment.status === 'redeemed' ? (
        <p className="text-m2e-success-deep">
          Payment received — your new bike is in your Profile. 🚲
        </p>
      ) : payment.status === 'held' ? (
        <p className="text-m2e-danger-deep">
          {payment.holdReason === 'amount'
            ? 'Your transfer arrived, but for less than the amount quoted. Nothing has been lost — we have it on record and will be in touch.'
            : 'Your transfer arrived after the price had expired. Nothing has been lost — we have it on record and will be in touch.'}
        </p>
      ) : payment.status === 'paid' ? (
        <p className="text-m2e-success-deep">Payment spotted — your bike is being built. This takes a moment.</p>
      ) : (
        <>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-m2e-text-secondary">
              Send exactly this amount
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-3xl text-m2e-accent break-all">
                {amountHead}
                <span className="text-m2e-warning-deep underline decoration-dotted">{tagDigits}</span>
                <span className="text-xl"> ENJ</span>
              </div>
              <CopyButton value={payment.amountEnj} label="Copy amount" />
            </div>
            <p className="text-xs text-m2e-text-secondary">
              Price {payment.priceEnj} ENJ. The last four digits (<span className="text-m2e-warning-deep">{tagDigits}</span>){' '}
              are this order's number — they cost you a fraction of a cent and they are how we recognise
              your transfer. Send the amount exactly as shown; a rounded amount arrives with no order on it.
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-m2e-text-secondary">
              To this address, on the {payment.chain}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs break-all bg-m2e-chrome text-white px-2 py-1 pixel-border">
                {payment.address}
              </code>
              <CopyButton value={payment.address} label="Copy address" />
            </div>
            {looksRelay ? (
              <p className="text-xs text-m2e-text-secondary">
                Check it starts with <strong>en</strong> — that is the Relaychain. An address starting
                with <strong>ef</strong> is the Matrixchain, a different chain, and ENJ sent there
                cannot be seen or returned.
              </p>
            ) : (
              <p className="text-xs text-m2e-danger-deep">
                This address does not start with “en”. Do not send anything — close this and tell us.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              className="pixel-btn px-3 py-2 text-xs"
              href={WALLET_LINK}
              target="_blank"
              rel="noreferrer noopener"
            >
              Open Enjin Wallet
            </a>
            <span className="text-xs text-m2e-text-secondary">
              Opens the app if you have it — the amount and address still have to be pasted in.
            </span>
          </div>

          {/* The price is a promise with an end, and the buyer is the only one who can see the
              clock they are racing. */}
          <p className="text-sm text-m2e-text-secondary">
            {remaining > 0
              ? `This price holds for ${formatRemaining(remaining)}.`
              : 'This price has expired — close this and start again for a fresh quote.'}
          </p>

          <ul className="text-xs text-m2e-text-secondary space-y-1 list-disc pl-4">
            <li>Send from your own Enjin Wallet — we never take custody of your ENJ and never ask you to sign anything here.</li>
            <li>Use the {payment.chain}. A transfer on another chain cannot be seen or returned.</li>
            <li>One transfer, the exact amount. Two part-payments do not add up to one bike.</li>
            <li>
              Do not send your whole balance: the chain deletes an account that drops below 0.1 ENJ,
              so always leave a little behind.
            </li>
            <li>Your bike appears in your Profile within about a minute of the transfer landing.</li>
          </ul>

          {waiting && <p className="text-xs text-m2e-text-secondary">Watching the chain…</p>}
        </>
      )}
    </div>
  );
}
