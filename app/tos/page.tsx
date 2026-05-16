import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Selah.fm',
  description: 'Terms of Service for Selah.fm — CPM marketplace for music promotion.',
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
          <p><strong className="text-foreground">Last updated:</strong> May 2026</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">1. Overview</h2>
          <p>Selah.fm is a marketplace connecting artists with content creators for music promotion on TikTok, Instagram Reels, and YouTube Shorts. By using our platform, you agree to these terms.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">2. Accounts</h2>
          <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account. You must be at least 13 years old to use Selah.fm.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">3. Campaigns & Payments</h2>
          <p>Artists deposit funds into campaigns via Stripe. Creators submit content for review. Artists approve or reject submissions. Approved content earns CPM-based payouts for verified views only. A 20% platform fee is added to the artist's CPM rate (e.g., $1.00 CPM → artist pays $1.20, creator receives full $1.00). Artists are never charged above their campaign budget. Example: $500 campaign at $1 CPM → creator earns full CPM, platform fee of $100 added to artist cost. Payouts to creators are processed on a net-7 basis after view verification.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">4. Content</h2>
          <p>Creators retain rights to their content. Artists grant creators a limited license to use their music in promotional content on approved platforms. Content must comply with platform (TikTok, Instagram, YouTube) terms of service.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">5. Prohibited Conduct</h2>
          <p>No fake views, bots, or artificial engagement. No spam or harassment. No infringing content. We reserve the right to suspend accounts that violate these terms.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">6. Limitation of Liability</h2>
          <p>Selah.fm is provided &quot;as is.&quot; We are not liable for indirect damages. Our maximum liability is limited to the amount you have deposited in the past 12 months.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">7. Contact</h2>
          <p>Questions: contact@selah.fm</p>
        </div>
      </div>
    </main>
  );
}
