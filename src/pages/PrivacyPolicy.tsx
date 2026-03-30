import { Shield } from 'pixelarticons/react';

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
          Last updated: March 30, 2026
        </p>
      </div>

      <div className="pixel-card p-6 md:p-8 space-y-8 text-lg leading-relaxed text-m2e-text-secondary">
        {/* Intro */}
        <section className="space-y-3">
          <p>
            Galavant ("we", "us", or "our") operates the Galavant mobile application and web dashboard
            (collectively, the "Service"). This Privacy Policy explains how we collect, use, and protect
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
              <li>Wallet addresses when connecting a Bitcoin/OPNet wallet</li>
              <li>Username or nickname you choose within the app</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl text-m2e-accent">Activity & Location Data</h3>
            <p>
              Galavant is a walk-to-earn application. To provide core gameplay functionality, we collect:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>GPS location data during active walking sessions</li>
              <li>Step count and movement data from device sensors</li>
              <li>Session duration and distance traveled</li>
            </ul>
            <p>
              Location data is only collected while you are actively using the app's walking feature.
              We do not track your location in the background when you are not on an active session.
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
              publicly visible on the Bitcoin/OPNet blockchain by nature of the technology.
            </li>
            <li>
              <strong className="text-m2e-text">Leaderboards:</strong> Your nickname, walking stats, and rankings may be
              displayed publicly within the app.
            </li>
            <li>
              <strong className="text-m2e-text">Service providers:</strong> We may use third-party services (e.g., hosting,
              analytics) that process data on our behalf under strict confidentiality agreements.
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
            Galavant is not intended for children under the age of 13. We do not knowingly collect
            personal information from children under 13. If we become aware that we have collected
            data from a child under 13, we will take steps to delete it promptly.
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
          <p>If you have questions about this Privacy Policy, you can reach us at:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              Email: <a href="mailto:we@galavant.run" className="text-m2e-accent hover:underline">we@galavant.run</a>
            </li>
            <li>
              Telegram: <a href="https://t.me/galavantBTC" target="_blank" rel="noopener noreferrer" className="text-m2e-accent hover:underline">t.me/galavantBTC</a>
            </li>
            <li>
              X / Twitter: <a href="https://x.com/galavantBTC" target="_blank" rel="noopener noreferrer" className="text-m2e-accent hover:underline">x.com/galavantBTC</a>
            </li>
          </ul>
        </section>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-m2e-text-muted uppercase tracking-wider pt-4">
        Galavant &mdash; Walk to Earn on Bitcoin via OPNet
      </p>
    </div>
  );
}
