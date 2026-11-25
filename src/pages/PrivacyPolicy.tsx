import { Shield } from 'pixelarticons/react';
import { LEGAL_UPDATED, OPERATOR } from '../config/legal';

export function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Shield className="w-10 h-10 text-m2e-accent" />
          <h1 className="text-4xl md:text-5xl tracking-wide uppercase">Privacy Policy</h1>
        </div>
        <p className="text-m2e-text-secondary text-xl">
          Last updated: {LEGAL_UPDATED}
        </p>
      </div>

      <div className="pixel-card p-6 md:p-8 space-y-8 text-lg leading-relaxed text-m2e-text-secondary">
        {/* Intro */}
        <section className="space-y-3">
          <p>
            Galavant ("we", "us", or "our") operates the Galavant mobile application and web dashboard
            (collectively, the "Service"). Galavant is run by {OPERATOR.name}, {OPERATOR.country}{' '}
            (<a href={OPERATOR.url} target="_blank" rel="noopener noreferrer" className="text-m2e-accent hover:underline">vedea.ch</a>),
            who is responsible for your data under this policy. This Privacy Policy explains how we collect, use, and protect
            your information when you use our Service.
          </p>
          <p>
            By using Galavant, you agree to the collection and use of information as described in this policy.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Information We Collect</h2>

          <div className="space-y-3">
            <h3 className="text-xl text-m2e-accent">Account Information</h3>
            <p>When you create an account or sign in, we may collect:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Google account profile information (name, email, profile picture) when using Google Sign-In</li>
              <li>Wallet addresses when connecting an Enjin wallet</li>
              <li>Username or nickname you choose within the app</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl text-m2e-accent">Activity & Location Data</h3>
            <p>
              Galavant is a walk-to-earn application. To provide core gameplay functionality, we collect:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Precise GPS location data during active walking, jogging, or riding sessions</li>
              <li>Step count and movement data from device sensors</li>
              <li>Session duration and distance traveled</li>
            </ul>
            <p>
              Location data is only collected while you have an active session in progress. You start
              a session by tapping the START button in the app, and end it by tapping STOP. Outside of
              an active session — including when you are simply browsing the app, the marketplace,
              your wallet, or any non-activity feature — your location is not collected at any time.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl text-m2e-accent">Background Location</h3>
            <p>
              While a session is active, Galavant continues to collect GPS location data when the app
              is in the background — for example, when your screen is off or you switch to another
              app. This is necessary so that your walk, jog, or ride keeps earning rewards without
              requiring you to keep the app open and visible the entire time. A persistent
              notification is shown for the duration of the session to make this clearly visible to
              you.
            </p>
            <p>
              Background location collection automatically stops as soon as you end the session, or
              if the session is otherwise terminated (energy depleted, server stop, app fully closed
              after a session ends). We never use background location for advertising, profiling, or
              any purpose other than verifying and rewarding your in-session activity.
            </p>
            <p>
              You can revoke location and background location permission at any time in your device
              settings. If revoked, you will not be able to start new sessions until the permission
              is restored.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl text-m2e-accent">Device Information</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Device type, operating system, and version</li>
              <li>App version</li>
              <li>Unique device identifiers for anti-cheat purposes</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl text-m2e-accent">Usage Data</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>In-app actions such as marketplace transactions, task completions, and gameplay events</li>
              <li>Interaction with the web dashboard</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl text-m2e-accent">Crew Chat Messages</h3>
            <p>
              If you write in your crew's chat, we store your messages with your account. Only the current members
              of that crew can read them. Messages are deleted after 30 days, and at once when you delete your
              account. If someone reports a message, we keep a copy of it with the report so our team can review it.
            </p>
          </div>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* How We Use Your Information */}
        <section className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>To provide, maintain, and improve the Service</li>
            <li>To verify walking activity and calculate rewards</li>
            <li>To prevent fraud, cheating, and abuse</li>
            <li>To process in-app transactions and marketplace activity</li>
            <li>To display leaderboards and community features</li>
            <li>To communicate updates, changes, and support</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* Data Sharing */}
        <section className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Data Sharing & Disclosure</h2>
          <p>We do not sell your personal information. We may share data in the following cases:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-m2e-text">Blockchain transactions:</strong> Wallet addresses and transaction data are
              publicly visible on the Enjin blockchain by nature of the technology.
            </li>
            <li>
              <strong className="text-m2e-text">Leaderboards:</strong> Your nickname, walking stats, and rankings may be
              displayed publicly within the app.
            </li>
            <li>
              <strong className="text-m2e-text">Service providers:</strong> We use the third-party services below. Each
              one processes data on our behalf, only for the purpose named:
              <ul className="list-disc list-inside space-y-2 pl-6 mt-2">
                <li>
                  <strong className="text-m2e-text">Google (sign-in):</strong> Google Sign-In on the website and in the app.
                  Google confirms who you are and gives us your name, email address and profile picture. On the
                  website, Google's sign-in script (accounts.google.com) loads only when you open the login window.
                  Profile pictures are shown straight from Google's servers (googleusercontent.com), so your browser
                  or device fetches them from Google.
                </li>
                <li>
                  <strong className="text-m2e-text">Apple (sign-in and in-app purchases):</strong> Sign in with Apple in
                  the iOS app, which gives us your email address (or Apple's private relay address) and, on first
                  sign-in, your name. Purchases in the iOS app are processed by Apple; we receive a record of the
                  purchase, never your payment details.
                </li>
                <li>
                  <strong className="text-m2e-text">Stripe and Link (card payments on the website):</strong> Card
                  purchases on galavant.run are sold through Link, Stripe's merchant of record. You enter your card
                  details with Stripe, never with us; we pass your account email and account ID to the checkout
                  (the account ID also goes on the payment, so a refund or dispute can be matched to you) and
                  receive the order and its payment status.
                </li>
                <li>
                  <strong className="text-m2e-text">Expo (push notifications and app updates):</strong> Push
                  notifications go through Expo's push service (exp.host), which receives your device's push
                  token and the message text and passes them to Apple or Google for delivery. The app downloads
                  its updates from Expo (u.expo.dev), which processes your IP address and app version for that.
                </li>
                <li>
                  <strong className="text-m2e-text">Google Maps (ride map):</strong> The map of a finished ride is
                  drawn with Google Maps, so the map area around that route is requested from Google.
                </li>
                <li>
                  <strong className="text-m2e-text">Google Play Integrity (Android, anti-cheat):</strong> The Android
                  app asks Google Play for an integrity token, and our server has Google check it, to confirm
                  that the app and device are genuine.
                </li>
                <li>
                  <strong className="text-m2e-text">Enjin Platform (wallets):</strong> Enjin's platform
                  (platform.enjin.io) keeps the managed wallet that belongs to your account, identified by our
                  account ID, and carries out its blockchain transactions.
                </li>
                <li>
                  <strong className="text-m2e-text">X (optional):</strong> If you link your X account, X confirms
                  your X user ID and handle to us through its sign-in.
                </li>
                <li>
                  <strong className="text-m2e-text">Discord (optional):</strong> If you link Discord, we store your
                  Discord user ID, and our bot sets your roles on the Galavant Discord server and may set your
                  server nickname to show your crew tag.
                </li>
                <li>
                  <strong className="text-m2e-text">Netlify (website hosting):</strong> Serves the galavant.run website and
                  processes your IP address and request data to deliver it.
                </li>
                <li>
                  <strong className="text-m2e-text">Cloudflare (network):</strong> Sits in front of galavant.run to deliver
                  it quickly and protect it against attacks, and processes your IP address and request data for that.
                </li>
                <li>
                  <strong className="text-m2e-text">Cloudflare Web Analytics (website visits):</strong> For visitors
                  outside the EU, Cloudflare counts page views on galavant.run, without cookies and without an
                  identifier that follows you across sites. It sees your IP address, the page, the referring page,
                  your browser and your country. Run by Cloudflare, Inc. (USA).
                </li>
                <li>
                  <strong className="text-m2e-text">Hetzner (servers):</strong> Our game server and database run at Hetzner
                  in Helsinki, Finland; encrypted backups are kept at Hetzner in Germany.
                </li>
                <li>
                  <strong className="text-m2e-text">Sentry (error reports):</strong> When the app or our server hits an
                  error, a technical report (what failed, app version, device type and operating system) goes to
                  Sentry, stored in the EU (Germany, de.sentry.io). It is set not to send IP addresses or cookies.
                </li>
              </ul>
              <p className="mt-2">
                These providers may in turn rely on their own infrastructure subprocessors (for example cloud
                hosting) to provide their service, under their own privacy terms.
              </p>
            </li>
            <li>
              <strong className="text-m2e-text">Legal requirements:</strong> We may disclose information if required by law
              or to protect the rights and safety of our users.
            </li>
          </ul>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* Data Security */}
        <section className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data. However, no method
            of electronic transmission or storage is 100% secure. We cannot guarantee absolute security
            but strive to use commercially acceptable means to protect your information.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* Data Retention */}
        <section className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide the Service.
            You may request deletion of your account and associated data by contacting us. Note that
            blockchain transactions are permanent and cannot be deleted.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* Children */}
        <section className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Children's Privacy</h2>
          <p>
            Galavant is for adults — you must be at least 18 to use it (see our Terms). We do not
            knowingly collect personal information from anyone under 18, and if we learn that we
            have, we delete it promptly.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* Your Rights */}
        <section className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us using the information below.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* Delete Account */}
        <section id="delete-account" className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Delete Your Account</h2>
          <p>
            You may request deletion of your Galavant account and all associated personal data at any time.
            To do so, send an email to{' '}
            <a href="mailto:we@galavant.run" className="text-m2e-accent hover:underline">we@galavant.run</a>{' '}
            with the subject line "Account Deletion Request" and include the email address or wallet address
            associated with your account.
          </p>
          <p>Upon receiving your request, we will:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Verify your identity to prevent unauthorized deletions</li>
            <li>Delete your account and personal data within 30 days</li>
            <li>Send you a confirmation once the deletion is complete</li>
          </ul>
          <p>
            Please note that blockchain transactions (e.g., NFT transfers, on-chain activity) are permanent
            and cannot be deleted due to the nature of the technology.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* Changes */}
        <section className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant
            changes by posting the new policy on this page and updating the "Last updated" date.
            Continued use of the Service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <div className="h-[2px] bg-m2e-border" />

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="text-2xl text-m2e-text tracking-wide uppercase">Contact Us</h2>
          <p>
            Responsible for your data: {OPERATOR.name}, {OPERATOR.country}.
          </p>
          <p>If you have questions about this Privacy Policy, you can reach us at:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              Email: <a href="mailto:we@galavant.run" className="text-m2e-accent hover:underline">we@galavant.run</a>
            </li>
            <li>
              Discord: <a href="https://discord.gg/E3Ba89X7w8" target="_blank" rel="noopener noreferrer" className="text-m2e-accent hover:underline">discord.gg/E3Ba89X7w8</a>
            </li>
            <li>
              Telegram: <a href="https://t.me/galavanteer" target="_blank" rel="noopener noreferrer" className="text-m2e-accent hover:underline">t.me/galavanteer</a>
            </li>
            <li>
              X / Twitter: <a href="https://x.com/galavanteer" target="_blank" rel="noopener noreferrer" className="text-m2e-accent hover:underline">x.com/galavanteer</a>
            </li>
          </ul>
        </section>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-m2e-text-muted uppercase tracking-wider pt-4">
        Galavant &mdash; Walk to Earn on Enjin
      </p>
    </div>
  );
}
