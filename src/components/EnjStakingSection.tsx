import { useEffect, useState, type ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Zap, ExternalLink, Clock } from 'pixelarticons/react';
import {
  enjinLinkStart,
  enjinLinkUnlink,
  enjinLinkStatus,
  enjinStakingStatus,
} from '../api';

// Pool 84, "Galavant Peloton". Players stake from their own Enjin Wallet — Galavant never custodies ENJ.
const POOL_URL = 'https://nft.io/staking/pool/84';

/**
 * ENJ staking, embedded inside the account (Wallet page). Link a real Enjin
 * Wallet, stake ENJ into the Galavant pool for a permanent earning boost, and
 * approve the bond in your own wallet — Galavant never holds your ENJ. Assumes
 * the caller is authenticated (it lives inside the account view).
 */
export function EnjStakingSection() {

  const link = useQuery({
    queryKey: ['enjin-link-status'],
    queryFn: enjinLinkStatus,
    retry: false,
    refetchInterval: (q) => (q.state.data?.linked ? false : 5000),
  });

  const staking = useQuery({
    queryKey: ['enjin-staking-status'],
    queryFn: enjinStakingStatus,
    enabled: link.data?.linked === true,
    retry: false,
    refetchInterval: 60_000,
  });

  // Enjins `url` ist ein DEEP LINK fuer die mobile Wallet-App, kein Web-Ablauf:
  //   platform.enjin.io/link/<code> -> deeplink.wallet.enjin.io/scan/<b64> -> enjin.io/products/wallet
  // Im Desktop-Browser gibt es keine App, an die uebergeben werden koennte, also landet der Nutzer auf
  // der Download-Seite und haelt das fuer einen Fehler. Auf dem Desktop ist der QR-Code der richtige
  // Weg — er kommt aus demselben Aufruf und wird mit dem Handy gescannt. Nur auf einem Touch-Geraet,
  // wo die App tatsaechlich da sein kann, wird der Deep Link geoeffnet.
  //
  // `expires` wird mitgefuehrt, weil der Server es liefert und es vorher weggeworfen wurde: ein
  // Code ohne sichtbare Restlaufzeit sieht auch dann noch gueltig aus, wenn er laengst tot ist,
  // und der Spieler haelt das ergebnislose Warten fuer einen Fehler der Wallet.
  const [linkInfo, setLinkInfo] = useState<{ url: string; qr: string; code: string; expires: string } | null>(null);
  // Der Verknuepfungscode ist ein Einmalgeheimnis. Wer ihn abfotografiert — ueber die Schulter, in
  // einem geteilten Bildschirm, auf einem Screenshot — haengt SEINE Wallet an dieses Konto: kein
  // Sitzungsdiebstahl (Login ist Google-only), aber der eine Verknuepfungsplatz ist dann besetzt.
  // Darum liegt er verdeckt. WICHTIG: der QR-Code traegt DASSELBE Geheimnis wie die Ziffern, nur
  // maschinenlesbar — beide gehoeren hinter denselben Schalter, sonst ist es Theater.
  const [codeVisible, setCodeVisible] = useState(false);
  const startLink = useMutation({
    mutationFn: enjinLinkStart,
    onSuccess: (data) => {
      setLinkInfo({ url: data.url, qr: data.qr, code: data.code, expires: data.expires });
      setCodeVisible(false);
      const mobil = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (mobil && data.url) window.open(data.url, '_blank', 'noopener');
      link.refetch();
    },
  });

  // Sekundentakt nur solange ueberhaupt ein Code offen ist — sonst laeuft ein Timer auf jeder
  // Wallet-Seite ohne Anzeige, die er aktualisieren koennte.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!linkInfo) return;
    // Sofort nachziehen: `now` steht sonst noch auf dem Zeitpunkt des Seitenaufbaus, und wer erst
    // nach Minuten auf den Knopf drueckt, saehe eine Sekunde lang eine zu grosse Restlaufzeit.
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [linkInfo]);
  const restlaufzeit = linkInfo ? remainingMmSs(linkInfo.expires, now) : null;

  // Ohne diesen Weg ist eine Verknuepfung eine Sackgasse: enjin_public_key ist EINDEUTIG, wer also die
  // falsche Wallet verknuepft hat oder mehrere besitzt, kaeme sonst nie an die richtige. Loest nur die
  // Verknuepfung — Guthaben, Bonds und NFTs der Wallet bleiben unberuehrt.
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const unlink = useMutation({
    mutationFn: enjinLinkUnlink,
    onSuccess: () => {
      setConfirmUnlink(false);
      setLinkInfo(null);
      setCodeVisible(false);
      link.refetch();
      staking.refetch();
    },
  });



  const notEnabled =
    (link.error as { message?: string } | undefined)?.message?.includes('not enabled') ||
    (link.error != null && !link.data);

  const boostPercent = staking.data?.earningBoost
    ? Math.round((staking.data.earningBoost - 1) * 100)
    : 0;


  if (notEnabled) {
    return (
      <div className="pixel-card p-6 space-y-3">
        <div className="section-label flex items-center gap-2"><Zap className="w-4 h-4 text-m2e-accent" /> ENJ Staking</div>
        <p className="text-m2e-text-secondary">
          Staking is coming online. Soon you'll stake real ENJ in the Galavant Peloton pool from your
          own Enjin Wallet and earn a permanent boost — your ENJ stays in your wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="section-label flex items-center gap-2"><Zap className="w-4 h-4 text-m2e-accent" /> ENJ Staking</div>

      {!link.data?.linked ? (
        <div className="pixel-card p-6 space-y-4">
          <h3 className="text-xl uppercase tracking-wide">Link your Enjin Wallet</h3>
          <p className="text-m2e-text-secondary">
            Link your Enjin Wallet to stake into the <span className="text-m2e-accent">Galavant Peloton</span> pool
            and earn a permanent boost on everything you earn. Linking only reads your public address — it never moves funds.
          </p>
          {/*
            Gesperrt, solange eine Verknuepfung aussteht — jeder Klick erzeugt sonst einen frischen
            Einmalcode und laesst den vorigen, dessen Freigabe der Spieler vielleicht gerade in der
            Wallet antippt, ins Leere laufen. Dasselbe Muster wie in der App
            (packages/app/hooks/useEnjinLink.ts). Der Server raeumt einen abgelaufenen Schluessel
            beim naechsten Status-Poll selbst weg, also gibt `pending` von allein wieder frei.
          */}
          <button
            className="pixel-btn-primary px-6 py-3 disabled:opacity-50"
            onClick={() => startLink.mutate()}
            disabled={startLink.isPending || link.data?.pending === true}
          >
            {startLink.isPending ? 'Opening…' : link.data?.pending ? 'Waiting for approval…' : 'Link Enjin Wallet'}
          </button>
          {linkInfo && (
            <div className="space-y-3 border-t border-m2e-border pt-4">
              <p className="text-sm text-m2e-text-secondary">
                Treat this like a one-time password. The QR square and the digits carry the same
                secret, and anyone who photographs either one can attach their own Enjin Wallet to
                your account. Reveal it only when you are ready to scan, and don't share your screen.
              </p>
              {codeVisible ? (
                <>
                  <img
                    src={linkInfo.qr}
                    alt="Enjin Wallet linking code"
                    className="w-44 h-44 bg-white p-2"
                  />
                  <p className="text-sm text-m2e-text-muted">
                    Scan it with the Enjin Wallet app on your phone, or enter code{' '}
                    <span className="text-m2e-accent font-bold">{linkInfo.code}</span> in the app.
                    This page updates itself once you approve.
                  </p>
                  <button className="pixel-btn px-4 py-2" onClick={() => setCodeVisible(false)}>
                    Hide code
                  </button>
                </>
              ) : (
                <button className="pixel-btn px-4 py-2" onClick={() => setCodeVisible(true)}>
                  Show code
                </button>
              )}
              {restlaufzeit ? (
                <p className="text-sm text-m2e-text-muted inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Expires in {restlaufzeit}
                </p>
              ) : (
                <p className="text-sm text-m2e-text-muted">
                  This code has expired. Start again to get a fresh one.
                </p>
              )}
            </div>
          )}
          {link.data?.pending && !linkInfo && (
            <p className="text-sm text-m2e-text-muted">Approve the request in your Enjin Wallet — this updates automatically.</p>
          )}
        </div>
      ) : (
        <>
          <div className="pixel-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-m2e-accent" />
              <span className="text-4xl text-m2e-accent">+{boostPercent}%</span>
              <span className="text-m2e-text-secondary">earning boost</span>
            </div>
            <div className="border-t border-m2e-border pt-4 space-y-2">
              <Row label="Linked wallet" value={`${(link.data?.publicKey ?? '').slice(0, 10)}…${(link.data?.publicKey ?? '').slice(-6)}`} />
              <Row label="Currently staked" value={`${(staking.data?.currentBondedEnj ?? 0).toLocaleString()} ENJ`} />
              <Row label="Boost basis (14-day avg)" value={`${(staking.data?.timeWeightedBondedEnj ?? 0).toLocaleString()} ENJ`} />
            </div>
            <div className="border-t border-m2e-border pt-4">
              {confirmUnlink ? (
                <div className="space-y-3">
                  <p className="text-sm text-m2e-text-secondary">
                    Unlink this wallet? Your ENJ, your bond and anything in the wallet stay exactly where they
                    are — only the connection to this Galavant account goes. Your boost stops until you link a
                    wallet again.
                  </p>
                  <div className="flex gap-3">
                    <button
                      className="pixel-btn-danger px-4 py-2"
                      onClick={() => unlink.mutate()}
                      disabled={unlink.isPending}
                    >
                      {unlink.isPending ? 'Unlinking…' : 'Yes, unlink'}
                    </button>
                    <button className="pixel-btn px-4 py-2" onClick={() => setConfirmUnlink(false)}>Keep it</button>
                  </div>
                  {unlink.isError && (
                    <p className="text-sm text-m2e-danger">
                      {(unlink.error as Error)?.message ?? 'Could not unlink — try again.'}
                    </p>
                  )}
                </div>
              ) : (
                <button className="pixel-btn px-4 py-2" onClick={() => setConfirmUnlink(true)}>
                  Unlink this wallet
                </button>
              )}
              <Row label="Energy bonus" value={`+${staking.data?.energyBonus ?? 0} min`} />
              <Row label="Tier" value={staking.data?.tier ?? 'None'} />
            </div>
          </div>

          <div className="pixel-card p-6 space-y-4">
            <h3 className="text-xl uppercase tracking-wide">Stake in the pool</h3>
            <p className="text-m2e-text-secondary text-sm">
              Staking happens in the Galavant Peloton pool, and you do it there — pick the amount and
              sign it in your own wallet. Galavant is not part of that step and never holds your ENJ.
            </p>
            <ol className="text-sm text-m2e-text-secondary space-y-2 list-decimal list-inside">
              <li>Open the pool below. On a phone, tap Connect Wallet and your Enjin Wallet comes to the front.</li>
              <li>Enter how much ENJ to stake and approve it in the wallet.</li>
              <li>Come back here. Your stake turns up by itself within the hour — nothing to claim.</li>
            </ol>
            <a
              className="pixel-btn-primary px-6 py-3 w-full inline-flex items-center justify-center gap-2"
              href={POOL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Galavant Peloton pool <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-xs text-m2e-text-muted">
              The pool lives on the Enjin Relaychain — that is where the ENJ you stake has to be, and
              where it stays. Unstaking works the same way, in the same place.
            </p>
          </div>

          {staking.data?.slashingRisk && (
            <p className="text-xs text-m2e-text-muted px-1">{staking.data.slashingRisk}</p>
          )}
        </>
      )}
    </div>
  );
}

// `ApprovalSteps` ist am 2026-09-01 entfallen. Es fuehrte durch eine Freigabe in Connected Apps,
// die es fuer einen Stake nicht mehr gibt — gestaked wird im Pool, in der eigenen Wallet.

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-m2e-warning text-m2e-text-on-accent text-xs font-bold">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-m2e-text-secondary">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

/**
 * Restlaufzeit des Verknuepfungscodes als m:ss, oder null wenn er abgelaufen ist oder der Server
 * ein unlesbares Datum geschickt hat. Beides wird gleich behandelt: ein Code, dessen Ablauf wir
 * nicht kennen, ist fuer die Anzeige tot — der Server verwirft ihn ohnehin beim naechsten Poll,
 * und "abgelaufen, hol dir einen neuen" ist die einzige Auskunft, mit der der Spieler etwas
 * anfangen kann.
 */
function remainingMmSs(expires: string, now: number): string | null {
  const ms = new Date(expires).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
