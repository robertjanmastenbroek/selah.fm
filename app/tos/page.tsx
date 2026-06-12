import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Selah.fm',
  description: 'Terms of Service for Selah.fm — audio usage requirements, CPM rate lock, payment terms, and content ownership. Artists and creators agree to these terms.',
};

export default function TosPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <Link href="/" className="text-muted-foreground text-sm hover:text-foreground mb-8 inline-block">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="text-muted-foreground text-sm space-y-6">
          <p><strong className="text-foreground">Last updated:</strong> June 2, 2026</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">1. Overview</h2>
          <p>
            Selah.fm (&ldquo;Selah.fm,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates a marketplace 
            connecting artists and music rights-holders (&ldquo;Artists&rdquo;) with content creators (&ldquo;Creators&rdquo;) 
            for music promotion on TikTok, Instagram Reels, and YouTube Shorts (&ldquo;Platforms&rdquo;). 
            By accessing or using Selah.fm, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). 
            If you do not agree, do not use our platform.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">2. Accounts</h2>
          <p>
            You must provide accurate and complete information when creating an account. 
            You are responsible for maintaining the security of your account credentials. 
            You must be at least 13 years old to use Selah.fm. 
            You may not share your account or allow others to use your credentials.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">3. Payment Terms</h2>
          <p>
            Artists fund campaigns by depositing money via Stripe, our payment processor. 
            A campaign&rsquo;s cost-per-thousand-views rate (&ldquo;CPM&rdquo;) is set by the Artist at campaign creation. 
            A 20% platform fee is added on top of the CPM (e.g., if an Artist sets a CPM of $1.00/1,000 views, 
            the Artist is charged $1.20 per 1,000 verified views — the Creator receives the full $1.00 CPM). 
            Artists are never charged beyond their deposited campaign budget. 
            Creators are paid via Stripe Connect for verified views only. 
            All payments are denominated in US Dollars (USD).
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">4. Refund Policy</h2>
          <p>
            Unspent campaign budget (funds not yet paid to Creators) is refundable upon request, 
            minus any non-recoverable Stripe processing fees incurred. 
            Spent budget — funds that have been paid to Creators for verified views — is non-refundable. 
            Once a payout to a Creator has been approved and processed, no refund is available for that payout. 
            Refund requests must be submitted in writing to contact@selah.fm.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">5. Content Ownership &amp; License Terms</h2>
          <p>
            Creators retain full ownership of the videos they create and submit. 
            Artists retain full ownership of their music, including the audio tracks used in promotional content. 
            Selah.fm claims no ownership over any Creator content or Artist music. 
            By submitting a video, Creators grant the Artist a limited, non-exclusive license to share 
            the video on social media for promotional purposes. 
            Artists grant Creators a limited, non-exclusive license to use the Artist&rsquo;s music 
            solely for creating promotional content on approved Platforms.
          </p>
          <p className="mt-4">
            <strong>5.1 Audio Usage Requirement.</strong> The licensed song must be clearly audible as a primary audio element 
            in the Creator&rsquo;s video. If any other vocal performance (singing, rapping, spoken word) is present 
            in the video alongside or in place of the licensed song, this license is void unless that vocal 
            performance is explicitly derived from or remixing the licensed song. For the avoidance of doubt, 
            adding an independent vocal, rap, or spoken-word track over the licensed song constitutes a separate 
            use not covered by this license.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">6. CPM Rate Lock</h2>
          <p>
            The CPM rate for a campaign is locked once the campaign receives its first Creator submission. 
            Once locked, the rate cannot be changed for that campaign. 
            If an Artist wishes to offer a different CPM rate, a new campaign must be created. 
            Tracks with zero submissions may have their CPM rate adjusted at any time.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">7. Payout Timing</h2>
          <p>
            Creators are paid through Stripe Connect. 
            Payouts are typically processed within 1–3 business days after the Artist approves a submission 
            and view verification is complete. 
            Actual timing depends on the Creator&rsquo;s bank and Stripe&rsquo;s processing schedule. 
            Selah.fm is not responsible for delays caused by banking institutions or Stripe.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">8. Dispute Resolution</h2>
          <p>
            Artists may reject Creator submissions before payout if the submission does not meet 
            the campaign requirements or violates these Terms. 
            Creators may appeal a rejection by contacting Selah.fm with evidence that their submission 
            complied with the campaign requirements. 
            Selah.fm may, at its sole discretion, mediate disputes between Artists and Creators. 
            Selah.fm does not guarantee any particular outcome in a dispute. 
            All decisions made by Selah.fm in dispute resolution are final.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">9. Platform Liability</h2>
          <p>
            Selah.fm is a marketplace that connects Artists and Creators. 
            We are not a party to any transaction between Artists and Creators except for payment processing 
            through Stripe. We do not guarantee the quality, accuracy, or legality of any content submitted 
            through the platform. Selah.fm is not responsible for the conduct of any Artist or Creator. 
            We provide the platform &ldquo;as is&rdquo; without warranties of any kind, express or implied.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">10. Prohibited Conduct</h2>
          <p>
            The following are strictly prohibited on Selah.fm: fake views, bots, or artificial engagement; 
            spam, harassment, or abusive behavior; infringing content that violates third-party intellectual 
            property rights; fraudulent or misleading activity of any kind; circumventing platform fees or 
            engaging in off-platform payment arrangements. We reserve the right to investigate and take 
            appropriate action against any account that violates these Terms.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">11. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate any account for fraud, abuse, violation of these Terms, 
            or any other reason at our sole discretion. Upon termination, any remaining unspent campaign budget 
            will be refunded in accordance with our Refund Policy (Section 4). 
            You may delete your account at any time by contacting us. Account deletion does not relieve you 
            of any outstanding obligations under these Terms.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">12. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Selah.fm and its officers, directors, employees, 
            and affiliates shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages arising from your use of the platform. Our maximum aggregate liability 
            to you is limited to the greater of (a) the amount you have deposited into campaigns in the 
            12 months preceding the claim, or (b) $100 USD.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">13. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Netherlands. 
            Any disputes arising from these Terms or your use of Selah.fm shall be subject to the 
            exclusive jurisdiction of the courts of Amsterdam, the Netherlands.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">14. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify users of material changes 
            via email or through the platform. Continued use of Selah.fm after changes become effective 
            constitutes acceptance of the updated Terms.
          </p>

          <h2 className="text-foreground font-semibold text-lg mt-8">15. Contact</h2>
          <p>
            Questions about these Terms? Contact us at{' '}
            <a href="mailto:contact@selah.fm" className="underline hover:text-foreground transition-colors">
              contact@selah.fm
            </a>.
          </p>
        </div>
      </div>
    </main>
  );
}
