import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Check, Coins, Bug, Clock } from 'pixelarticons/react';
import { AppDownload } from '../components/AppDownload';
import { PLAY_STORE_URL, TESTFLIGHT_URL } from '../config/appLinks';

/**
 * GPS-SPOOF BOUNTY — the player-facing half of the rulebook.
 *
 * Its own route rather than a chapter in the gameplay guide, for two reasons. The guide explains
 * a game that keeps running; this is a programme that ends with the test month. And the owner
 * intends to share it, which wants a short URL somebody can paste into a post, not a path three
 * levels down a sidebar.
 *
 * Two things from the internal rulebook must never reach this page. The first is the list of
 * individual anti-cheat checks with their thresholds — a published threshold is a build manual,
 * and a bounty that hands out the build manual has bought nothing but its own defeat. The second
 * is the grading table with its four amounts, because that table is what we grade against: a
 * finder who can read that the tier above his pays double turns every grading into a haggle, and
 * a test month with a handful of participants can afford that least of all. What goes public is
 * the top amount and the fact that it scales down — which is all anyone needs in order to decide
 * whether we are worth an evening.
 */

/** All three must hold before a report is worth anything. Registration is deliberately first. */
const VALID = [
  'You registered before you started.',
  'The ride was not real — no walk, no human, no motion, or motion that was not your phone\'s.',
  'Detection let it through — the ride was not flagged, and the reward landed in full.',
];

const INVALID = [
  'The ride was flagged, or the reward was cut. Then detection did its job. The bounty pays for a gap, not for an attempt.',
  'The report does not say how it was done. Without something we can rebuild, it is an assertion rather than information.',
  'The same method a second time. The first report of a method is the one that pays. A variation earns anything only if it slips past a different check than the one already reported.',
  'Anything that is not movement detection: servers, the database, other people\'s accounts, payment paths. That is not a bounty, that is an incident. Report it and we will settle it separately — but not through this, and never by trying it on an account that is not yours.',
];

const PAYOUT = [
  'In ENJ or a Genesis item, never in WATTS. Paying you in the currency you have just proved you can print would be absurd.',
  'After the wipe — the reset that closes the test month. ENJ payouts and Genesis items only exist on the far side of it, so the claim is frozen the way your test-month standing is, and survives with it.',
  'Quickly, and in the open, with your name on it if you want it there.',
];

export function Bounty() {
  return (
    <>
      <div className="border-b-2 border-m2e-border bg-m2e-chrome text-white relative overflow-hidden scanlines-light">
        <div className="mx-auto max-w-4xl px-4 md:px-8 py-10 md:py-14 relative z-10">
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
              <div className="section-label">Test Month</div>
            </div>
            <h1 className="text-5xl md:text-7xl uppercase tracking-wide text-chroma-hero leading-[0.9]">
              Break Our<br />
              <span className="text-m2e-accent">GPS.</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl">
              Galavant pays for walking, which makes movement detection the single place the whole
              economy hangs. For the test month we will pay you to get a faked ride past it — up to
              500 ENJ. One condition, and it is not negotiable: tell us before you start.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <AppDownload testflightUrl={TESTFLIGHT_URL} playStoreUrl={PLAY_STORE_URL} variant="compact" />
              <Link to="/report" className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-base px-6 py-3">
                <Shield className="w-5 h-5" />
                Register your attempt
              </Link>
              <span className="inline-flex items-center gap-2 text-white/50 text-xs uppercase tracking-[0.2em]">
                <Clock className="w-4 h-4" />
                Runs through September · closes 30 September
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 md:px-8 py-10 md:py-14 space-y-12">
        <section className="space-y-4">
          <div className="section-label">Why we pay for this</div>
          <p className="text-lg text-m2e-text-secondary leading-relaxed">
            Galavant pays real value for real movement. That makes the detection behind it not one
            feature among many but the place everything else rests on: whoever can fake a ride can
            print WATTS. In the test month a faked ride costs us nothing, because the month is
            wiped anyway. After it, every gap we missed costs money that does not come back.
          </p>
          <p className="text-lg text-m2e-text-secondary leading-relaxed">
            The second reason is the uncomfortable one. We do not know how good our detection is.
            It runs, it flags, nobody has ever seriously attacked it — and a defence that was never
            attacked is not a measured defence, it is a hope. This is us buying the measurement
            while it is still cheap.
          </p>
        </section>

        <section className="space-y-4">
          <div className="section-label">The rule everything else hangs on</div>
          <div className="pixel-card p-6 md:p-8 border-m2e-accent space-y-4">
            <h2 className="text-3xl md:text-4xl uppercase tracking-wide text-m2e-text leading-none">
              Register <span className="text-m2e-accent">first.</span>
            </h2>
            <p className="text-m2e-text-secondary leading-relaxed">
              A faked ride marks your account, and a mark costs you standing when the test month is
              scored. Nobody should have to burn their own standing to help us, so we take the marks
              off the table before you start rather than argue about them afterwards.
            </p>
            <p className="text-m2e-text-secondary leading-relaxed">
              Send us your account and the window you intend to test in, before the first faked
              ride. Rides from that window come out of the scoring entirely: not credited, not
              counted — and not penalised.
            </p>
            <p className="text-m2e-text leading-relaxed">
              This is also the line between a researcher and a cheat, and a line like that only
              works drawn beforehand. An unregistered faked ride is cheating and is treated as
              cheating. Saying afterwards that it was research changes nothing about it.
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <div className="section-label">What counts</div>
          <p className="text-m2e-text-secondary max-w-3xl leading-relaxed">
            A report is valid when all three of these hold.
          </p>
          <ul className="space-y-3">
            {VALID.map((line) => (
              <li key={line} className="flex items-start gap-3 text-m2e-text-secondary leading-relaxed">
                <Check className="w-5 h-5 shrink-0 mt-0.5 text-m2e-success" />
                {line}
              </li>
            ))}
          </ul>
          <p className="text-m2e-text-secondary max-w-3xl leading-relaxed">
            The third we can check against the ride itself. The second only you can show, which is
            why we ask for a description somebody else could rebuild from. &ldquo;I spoofed
            it&rdquo; is not a report. &ldquo;Fake-GPS app X, route along the river road, phone flat
            on the table, played back at 0.7× speed&rdquo; is.
          </p>
        </section>

        <section className="space-y-5">
          <div className="section-label">What does not</div>
          <ul className="space-y-3">
            {INVALID.map((line) => (
              <li key={line} className="flex items-start gap-3 text-m2e-text-secondary leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 shrink-0 bg-m2e-danger" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          <p className="text-m2e-text-secondary max-w-3xl leading-relaxed">
            And the faked rides themselves earn nothing and count for nothing. Forty of them to lift
            your own share is not a bounty run, it is abuse of the programme — those rides come out
            at scoring time, and the sender comes out with them.
          </p>
        </section>

        <section className="space-y-5">
          <div className="section-label">What it pays</div>
          <div className="pixel-card p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
            <Coins className="w-12 h-12 shrink-0 text-m2e-accent" />
            <div className="space-y-1">
              <div className="text-4xl md:text-5xl uppercase tracking-wide text-m2e-text leading-none">
                Up to 500 ENJ
              </div>
              <div className="text-[11px] tracking-[0.25em] uppercase text-m2e-text-muted">
                per finding · scaled down from there · capped across the programme
              </div>
            </div>
          </div>
          <p className="text-m2e-text-secondary max-w-3xl leading-relaxed">
            What sets the amount is scalability, not cleverness. The question is never how clever
            the route was, but how many accounts could walk it tomorrow at the same time. A trick
            anyone can repeat on an ordinary phone is worth more to us than a fortnight of work on a
            rooted one, however impressive the second is to watch.
          </p>
          <ul className="space-y-3">
            {PAYOUT.map((line) => (
              <li key={line} className="flex items-start gap-3 text-m2e-text-secondary leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 shrink-0 bg-m2e-accent" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-5">
          <div className="section-label">How to report</div>
          <p className="text-m2e-text-secondary max-w-3xl leading-relaxed">
            The same path as a bug report. In the app: the You tab → Report a Problem. On the web:{' '}
            <Link to="/report" className="text-m2e-accent hover:underline">Report a Problem</Link>.
            There is no separate portal and no form to fill in — at this size it is handled by hand,
            and by hand beats a machine nobody would maintain.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="pixel-card p-5 md:p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <Shield className="w-6 h-6 text-m2e-accent" />
                <h2 className="text-xl uppercase tracking-wide text-m2e-text leading-none">Before you start</h2>
              </div>
              <p className="text-sm text-m2e-text-secondary leading-relaxed">
                Open the report and begin the text with{' '}
                <span className="font-mono text-m2e-text">BOUNTY REGISTRATION</span>. Say which
                account you will be testing on and roughly which days. That is the whole
                registration.
              </p>
            </div>
            <div className="pixel-card p-5 md:p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <Bug className="w-6 h-6 text-m2e-accent" />
                <h2 className="text-xl uppercase tracking-wide text-m2e-text leading-none">When it works</h2>
              </div>
              <p className="text-sm text-m2e-text-secondary leading-relaxed">
                Begin the text with <span className="font-mono text-m2e-text">BOUNTY</span>. Then
                which ride — date and rough time is enough, we will match it up. Then how it went:
                the tool, the method, where the phone was, what you varied, how reliably it
                repeated, and what it would have earned per hour.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Link to="/report" className="pixel-btn pixel-btn-primary inline-flex items-center gap-2 text-base px-6 py-3">
              <Shield className="w-5 h-5" />
              Register your attempt
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
