import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Selah.fm',
  description: 'Privacy Policy for Selah.fm — how we collect, use, and protect your data, including data from TikTok, Instagram, and YouTube APIs.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <Link href="/" className="text-muted-foreground text-sm hover:text-foreground mb-8 inline-block">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="text-muted-foreground text-sm space-y-6">
          <p><strong className="text-foreground">Last updated:</strong> June 2026</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">1. What we collect</h2>
          <p>
            We collect the following information when you use Selah.fm:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email address and display name (when you sign up with Google or email)</li>
            <li>Google account information when using Google sign-in</li>
            <li>Social media account information when you connect TikTok, Instagram, or YouTube accounts for view verification (username, display name, avatar, bio, follower count)</li>
            <li>TikTok video data — view counts, video IDs, and engagement metrics — solely for verifying creator earnings when you connect a TikTok account</li>
            <li>Payment information processed through Stripe (we do not store full payment card details)</li>
            <li>Campaign and submission content you create on the platform</li>
          </ul>
          <p className="mt-2">
            <strong>TikTok API Data:</strong> When you connect your TikTok account, we access your TikTok profile information and video list (via the user.info.profile, user.info.stats, and video.list scopes). This data is used exclusively for identity verification and view verification. We do not access, store, or share your TikTok private messages, drafts, or account settings.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">2. How we use your data</h2>
          <p>
            We use your data to operate the Selah.fm marketplace — showing your campaigns and submissions, processing payouts, verifying view counts, and communicating about your account. Specifically:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>To verify creator identities and link social media accounts</li>
            <li>To verify video view counts for accurate creator payouts</li>
            <li>To display follower counts and creator credibility on the platform</li>
            <li>To process payments and payouts through Stripe</li>
            <li>To communicate important account and platform updates</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">3. TikTok Data Handling</h2>
          <p>
            Selah.fm uses TikTok&rsquo;s Login Kit and video.list API for creator verification. We comply with TikTok&rsquo;s Developer Terms of Service and Platform Policies. Specifically:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>TikTok data is only accessed with your explicit consent via OAuth</li>
            <li>We only request the minimum scopes needed: profile information and video list access</li>
            <li>TikTok data is encrypted in transit and at rest</li>
            <li>We do not share TikTok data with any third parties</li>
            <li>You can disconnect your TikTok account at any time via your dashboard, which revokes our access</li>
            <li>We retain TikTok data only as long as your account is active or until you disconnect</li>
            <li>We do not use TikTok data for advertising, targeting, or training AI models</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg mt-8">4. Third-party services</h2>
          <p>
            We use the following third-party services, each with their own privacy policies:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Stripe</strong> — payment processing and payouts</li>
            <li><strong>Google</strong> — authentication and sign-in</li>
            <li><strong>Railway</strong> — hosting and infrastructure</li>
            <li><strong>TikTok</strong> — creator verification (with your consent)</li>
            <li><strong>YouTube/Google</strong> — creator verification (with your consent)</li>
            <li><strong>Instagram/Meta</strong> — creator verification (with your consent)</li>
            <li><strong>Supabase</strong> — authentication and database</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg mt-8">5. Cookies</h2>
          <p>We use essential cookies for authentication and security. We do not use tracking cookies or analytics cookies. You can disable cookies in your browser settings, but this may affect core platform functionality.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">6. Data retention</h2>
          <p>
            We retain your data as long as your account is active. If you delete your account, we delete or anonymize your personal data within 30 days. TikTok API data is deleted immediately when you disconnect your TikTok account. You can request early deletion by contacting privacy@selah.fm — we will process your request within 14 days.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">7. Your rights</h2>
          <p>
            You have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal data — download a copy via your dashboard</li>
            <li>Correct inaccurate data — edit your profile at any time</li>
            <li>Delete your data — delete your account or disconnect social accounts</li>
            <li>Withdraw consent — disconnect any social platform at any time</li>
            <li>Data portability — export your data in JSON format</li>
          </ul>
          <p className="mt-2">Contact us at privacy@selah.fm to exercise these rights.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">8. Data security</h2>
          <p>
            We implement industry-standard security measures including encryption in transit (TLS), encryption at rest, and secure API authentication. TikTok API tokens are stored encrypted in our database. Access to personal data is restricted to essential personnel only.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">9. International data transfers</h2>
          <p>
            Your data may be processed on servers located in the United States and Europe. By using Selah.fm, you consent to the transfer of your data to these locations. We ensure appropriate safeguards are in place for international data transfers.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">10. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of material changes via email or through the platform. We encourage you to review this policy periodically.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">11. Contact</h2>
          <p>
            Privacy questions: <a href="mailto:privacy@selah.fm" className="underline hover:text-foreground">privacy@selah.fm</a><br />
            General inquiries: <a href="mailto:contact@selah.fm" className="underline hover:text-foreground">contact@selah.fm</a><br />
            Data Protection: <a href="mailto:dpo@selah.fm" className="underline hover:text-foreground">dpo@selah.fm</a>
          </p>
        </div>
      </div>
    </main>
  );
}
