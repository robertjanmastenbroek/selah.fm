import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Selah.fm',
  description: 'Privacy Policy for Selah.fm — CPM marketplace for music promotion. GDPR-compliant. DPO contact, international transfers, data portability.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <Link href="/" className="text-muted-foreground text-sm hover:text-foreground mb-8 inline-block">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="text-muted-foreground text-sm space-y-6 leading-relaxed">
          <p><strong className="text-foreground">Last updated:</strong> June 2026</p>

          <h2 className="text-foreground font-semibold text-lg mt-10">1. Who we are</h2>
          <p>Selah.fm (operated by Robert-Jan Mastenbroek, NL) is an open-source music promotion marketplace. We connect artists with content creators who make TikToks, Reels, and Shorts featuring their music. Our platform is free to join; we earn revenue through a 20% platform fee on verified view payouts.</p>
          <p><strong>Data Controller:</strong> Robert-Jan Mastenbroek, Tenerife, Spain. <strong>Email:</strong> contact@selah.fm</p>
          <p><strong>Data Protection Officer (DPO):</strong> You can reach our DPO at dpo@selah.fm for all privacy-related inquiries. We respond within 72 hours.</p>

          <h2 className="text-foreground font-semibold text-lg mt-10">2. What we collect and why (legal basis)</h2>
          <p>We collect only the data necessary to operate the marketplace. We process your data based on the following legal grounds:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Contract performance (GDPR Art. 6(1)(b))</strong> — Your email, display name, role (artist/creator), Stripe Connect ID, social handles, campaign data, submissions, and earnings. Required to provide our service.</li>
            <li><strong>Consent (GDPR Art. 6(1)(a))</strong> — Google account data when you sign in with Google, and any optional profile information you provide (bio, genres, profile image).</li>
            <li><strong>Legitimate interest (GDPR Art. 6(1)(f))</strong> — Analytics events (page views, feature usage) to improve the platform. We anonymize after 30 days.</li>
            <li><strong>Legal obligation (GDPR Art. 6(1)(c))</strong> — Transaction records for tax reporting (Dutch and IRS requirements).</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg mt-10">3. What we collect (detailed)</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Account data:</strong> Email, display name, password hash (if using email signup), Google account ID (if using Google OAuth), role (artist/creator), profile image, bio, genres</li>
            <li><strong>Social handles:</strong> TikTok, Instagram, YouTube, Facebook handles you connect</li>
            <li><strong>Payment data:</strong> Stripe Connect account ID (we do not store credit card numbers — Stripe handles all payment processing)</li>
            <li><strong>Campaign data:</strong> Track titles, URLs, cover art, CPM rates, budgets, submission links</li>
            <li><strong>Usage data:</strong> Page views, feature interactions (anonymized after 30 days), session duration</li>
            <li><strong>Communication data:</strong> Messages sent through our platform, support inquiries, bug reports</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg mt-10">4. International data transfers</h2>
          <p>Your data is stored on Supabase servers (Google Cloud, US West). By using Selah.fm, you acknowledge that your data may be transferred to and processed in the United States, which may have different data protection laws than your jurisdiction. We rely on the following safeguards for international transfers:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Supabase</strong> — Data stored in US West (Google Cloud). Supabase is SOC 2 compliant and processes data under GDPR-compliant Data Processing Addendum (DPA).</li>
            <li><strong>Stripe</strong> — Payment data processed in the US and EU. Stripe is certified under the EU-US Data Privacy Framework.</li>
            <li><strong>Google (OAuth)</strong> — Google authentication data processed in the US. Google is certified under the EU-US Data Privacy Framework.</li>
            <li><strong>Resend</strong> — Email delivery processed in the US and EU. Resend has a GDPR-compliant DPA.</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg mt-10">5. Third-party services</h2>
          <p>We use the following third-party services. Each has its own privacy policy and data processing terms:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Supabase</strong> — Database, authentication, file storage</li>
            <li><strong>Stripe</strong> — Payment processing, payouts, fraud detection</li>
            <li><strong>Google (OAuth)</strong> — Authentication</li>
            <li><strong>Railway</strong> — Hosting and deployment</li>
            <li><strong>Resend</strong> — Transactional emails</li>
            <li><strong>DeepSeek</strong> — AI-powered blog content generation and outreach</li>
            <li><strong>Sentry</strong> — Error monitoring (no PII collected)</li>
            <li><strong>TikTok, Instagram, YouTube APIs</strong> — View verification when you submit content</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg mt-10">6. Cookies</h2>
          <p>We use essential cookies for authentication and security (Supabase session cookies). We do not use tracking cookies, advertising cookies, or third-party analytics cookies. Our cookie banner allows you to accept or reject non-essential cookies.</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Session cookie:</strong> Supabase SSR session — required for authentication. Expires when you close your browser or after 7 days.</li>
            <li><strong>Local storage:</strong> We store your cookie consent preference locally. No tracking data is stored.</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg mt-10">7. Data retention</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Active accounts:</strong> Data retained as long as your account is active</li>
            <li><strong>Deleted accounts:</strong> PII is anonymized within 24 hours of deletion request. Anonymized records (submissions, transactions) retained for platform integrity and tax compliance</li>
            <li><strong>Analytics events:</strong> Anonymized after 30 days, deleted after 12 months</li>
            <li><strong>Tax records:</strong> Transaction data retained for 7 years (Dutch legal requirement)</li>
            <li><strong>Inactive accounts:</strong> Accounts inactive for 2+ years may be anonymized after notification</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg mt-10">8. Your rights (GDPR)</h2>
          <p>Under the General Data Protection Regulation (GDPR), you have the following rights. All requests are processed within 30 days, free of charge:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Right of access (Art. 15):</strong> Request a copy of all data we hold about you. Use our self-service endpoint: <code className="text-[11px] bg-white/[0.04] px-1 py-0.5 rounded">GET /api/me/export</code></li>
            <li><strong>Right to rectification (Art. 16):</strong> Correct inaccurate data through your dashboard settings</li>
            <li><strong>Right to erasure (Art. 17):</strong> Request deletion of your account and PII. Use our self-service endpoint: <code className="text-[11px] bg-white/[0.04] px-1 py-0.5 rounded">POST /api/me/delete</code></li>
            <li><strong>Right to restrict processing (Art. 18):</strong> Request limitation of data processing</li>
            <li><strong>Right to data portability (Art. 20):</strong> Receive your data in a structured, machine-readable format via <code className="text-[11px] bg-white/[0.04] px-1 py-0.5 rounded">GET /api/me/export</code></li>
            <li><strong>Right to object (Art. 21):</strong> Object to processing based on legitimate interest</li>
            <li><strong>Right to lodge a complaint (Art. 77):</strong> File a complaint with your local Data Protection Authority. In the Netherlands: Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl)</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg mt-10">9. Automated decision-making</h2>
          <p>We do not use automated decision-making or profiling that produces legal effects. Our blog content generation (powered by DeepSeek) produces editorial content only and does not make decisions about users.</p>

          <h2 className="text-foreground font-semibold text-lg mt-10">10. Children's privacy (COPPA)</h2>
          <p>Selah.fm is not intended for users under the age of 13. We do not knowingly collect personal data from children under 13. If you believe a child under 13 has provided us with personal data, contact dpo@selah.fm and we will delete it.</p>

          <h2 className="text-foreground font-semibold text-lg mt-10">11. Open source transparency</h2>
          <p>Selah.fm is fully open source under the MIT license. You can inspect every line of code that processes your data at <Link href="https://github.com/robertjanmastenbroek/selah.fm" className="text-primary hover:underline">github.com/robertjanmastenbroek/selah.fm</Link>. This means anyone can verify exactly how your data is handled, stored, and protected.</p>

          <h2 className="text-foreground font-semibold text-lg mt-10">12. Changes to this policy</h2>
          <p>We will notify you of material changes via email and a notice on the platform. Continued use after changes constitutes acceptance of the updated policy.</p>

          <h2 className="text-foreground font-semibold text-lg mt-10">13. Contact</h2>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-1">
            <p><strong>Data Controller:</strong> Robert-Jan Mastenbroek</p>
            <p><strong>DPO:</strong> dpo@selah.fm (72-hour response time)</p>
            <p><strong>General inquiries:</strong> contact@selah.fm</p>
            <p><strong>Data export/deletion:</strong> Use self-service endpoints or email dpo@selah.fm</p>
            <p><strong>Supervisory Authority:</strong> Autoriteit Persoonsgegevens, PO Box 93374, 2509 AJ Den Haag, Netherlands</p>
          </div>
        </div>
      </div>
    </main>
  );
}
