import { useState, type ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Zap, ExternalLink, Clock } from 'pixelarticons/react';
import {
  enjinLinkStart,
  enjinLinkUnlink,
  enjinLinkStatus,
  enjinStakingStatus,
  enjinBond,
  enjinBondStatus,
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
  const [amount, setAmount] = useState('');
  const [bondJournalId, setBondJournalId] = useState<string | null>(null);
  // The amount that was actually submitted, so the approval steps can tell the
  // player exactly what the pending request in their wallet should say.
  const [submittedAmount, setSubmittedAmount] = useState<string | null>(null);

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
  const [linkInfo, setLinkInfo] = useState<{ url: string; qr: string; code: string } | null>(null);
  const startLink = useMutation({
    mutationFn: enjinLinkStart,
    onSuccess: (data) => {
      setLinkInfo({ url: data.url, qr: data.qr, code: data.code });
      const mobil = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (mobil && data.url) window.open(data.url, '_blank', 'noopener');
      link.refetch();
    },
  });

  // Ohne diesen Weg ist eine Verknuepfung eine Sackgasse: enjin_public_key ist EINDEUTIG, wer also die
  // falsche Wallet verknuepft hat oder mehrere besitzt, kaeme sonst nie an die richtige. Loest nur die
  // Verknuepfung — Guthaben, Bonds und NFTs der Wallet bleiben unberuehrt.
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const unlink = useMutation({
    mutationFn: enjinLinkUnlink,
    onSuccess: () => {
      setConfirmUnlink(false);
      setLinkInfo(null);
      link.refetch();
      staking.refetch();
    },
  });

  const bond = useMutation({
    mutationFn: (enj: number) => enjinBond(enj),
    onSuccess: (data, enj) => {
      setBondJournalId(data.journalId);
      setSubmittedAmount(String(enj));
    },
  });

  const bondStatus = useQuery({
    queryKey: ['enjin-bond-status', bondJournalId],
    queryFn: () => enjinBondStatus(bondJournalId as string),
    enabled: !!bondJournalId,
    refetchInterval: (q) => {
      const s = q.state.data?.state;
      return s === 'FINALIZED' || s === 'FAILED' || s === 'ABANDONED' ? false : 5000;
    },
  });

  const notEnabled =
    (link.error as { message?: string } | undefined)?.message?.includes('not enabled') ||
    (link.error != null && !link.data);

  const boostPercent = staking.data?.earningBoost
    ? Math.round((staking.data.earningBoost - 1) * 100)
    : 0;

  const bondState = bondStatus.data?.state;
  const bondPending = !!bondJournalId && bondState !== 'FINALIZED' && bondState !== 'FAILED' && bondState !== 'ABANDONED';
  const amountNum = Number(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum >= 1;

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
          <button
            className="pixel-btn-primary px-6 py-3"
            onClick={() => startLink.mutate()}
            disabled={startLink.isPending}
          >
            {startLink.isPending ? 'Opening…' : link.data?.pending ? 'Waiting for approval…' : 'Link Enjin Wallet'}
          </button>
          {linkInfo && (
            <div className="space-y-3 border-t border-m2e-border pt-4">
              <p className="text-sm text-m2e-text-secondary">
                Scan this with the Enjin Wallet app on your phone. This page updates itself once you approve.
              </p>
              <img
                src={linkInfo.qr}
                alt="Enjin Wallet linking code"
                className="w-44 h-44 bg-white p-2"
              />
              <p className="text-sm text-m2e-text-muted">
                Or open the app and enter code <span className="text-m2e-accent font-bold">{linkInfo.code}</span>.
              </p>
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
            <h3 className="text-xl uppercase tracking-wide">Stake ENJ</h3>
            <p className="text-m2e-text-secondary text-sm">
              Enter an amount and approve the request in your own Enjin Wallet. Your ENJ never leaves your
              wallet — Galavant only asks; you sign.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1"
                disabled={bondPending || bond.isPending}
                className="flex-1 bg-m2e-bg-alt border-2 border-m2e-border rounded px-4 py-3 text-lg font-bold text-m2e-text focus:border-m2e-accent outline-none"
              />
              <span className="text-m2e-text-secondary font-bold">ENJ</span>
            </div>
            <button
              className="pixel-btn-primary px-6 py-3 w-full disabled:opacity-50"
              onClick={() => amountValid && bond.mutate(amountNum)}
              disabled={!amountValid || bond.isPending || bondPending}
            >
              {bond.isPending ? 'Creating request…' : 'Stake ENJ'}
            </button>

            {bond.isError ? (
              <p className="text-sm text-m2e-danger">
                {(bond.error as Error).message}. In your Enjin Wallet, your ENJ must include a little
                free (unbonded) balance to cover the network fee.
              </p>
            ) : bondPending ? (
              <ApprovalSteps amountEnj={submittedAmount} state={bondState} />
            ) : bondState === 'FINALIZED' ? (
              <p className="text-sm text-m2e-success font-bold">Bond confirmed on-chain. Your boost basis updates within the hour.</p>
            ) : bondState === 'FAILED' || bondState === 'ABANDONED' ? (
              <p className="text-sm text-m2e-danger">
                That bond didn't go through{bondStatus.data?.error ? `: ${bondStatus.data.error}` : ''}. You can try again.
              </p>
            ) : null}

            <a
              className="text-sm text-m2e-text-muted inline-flex items-center gap-2 hover:text-m2e-accent"
              href={POOL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Prefer the web? Open the Galavant Peloton pool <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {staking.data?.slashingRisk && (
            <p className="text-xs text-m2e-text-muted px-1">{staking.data.slashingRisk}</p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * The bond lives as a PENDING request until the player approves it in the Enjin
 * Wallet *mobile app* — there is nothing to click here, and on desktop that is
 * genuinely unobvious. Spell out where to go and what the request looks like.
 */
function ApprovalSteps({ amountEnj, state }: { amountEnj: string | null; state?: string }) {
  return (
    <div className="relative pixel-border border-m2e-warning bg-m2e-warning/10 p-4 space-y-3">
      <div className="flex items-center gap-2 text-m2e-warning font-bold uppercase tracking-wide text-sm">
        <Clock className="w-4 h-4 animate-pulse" />
        Waiting for approval in your Enjin Wallet
      </div>

      <p className="text-sm text-m2e-text-secondary">
        Your stake isn't submitted yet. Galavant created a request — you have to sign it on the phone
        where your Enjin Wallet lives. Nothing happens on this page until you do.
      </p>

      <ol className="text-sm text-m2e-text-secondary space-y-2">
        <Step n={1}>Open the <span className="text-m2e-text font-bold">Enjin Wallet</span> app on your phone.</Step>
        <Step n={2}>
          Go to <span className="text-m2e-text font-bold">Settings → Connected Apps</span>, or tap the
          push notification if you got one.
        </Step>
        <Step n={3}>
          Find the pending request from <span className="text-m2e-text font-bold">Galavant</span>
          {amountEnj ? (
            <> to stake <span className="text-m2e-accent font-bold">{amountEnj} ENJ</span></>
          ) : null}
          {' '}into the Galavant Peloton pool.
        </Step>
        <Step n={4}>Check the amount, then <span className="text-m2e-text font-bold">Approve</span> and sign.</Step>
      </ol>

      <p className="text-xs text-m2e-text-muted">
        Keep this page open — it updates on its own once you approve, usually within a minute.
        {state ? <> Current status: <span className="font-bold">{state}</span>.</> : null}
      </p>

      <p className="text-xs text-m2e-text-muted">
        Don't see the request? Make sure the wallet you linked is the one open on your phone, and that
        it holds a little free (unbonded) ENJ for the network fee. If it never arrives, the request
        expires on its own and you can stake again.
      </p>
    </div>
  );
}

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
