import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — SendMusic.io',
  description: 'Terms of Service for SendMusic.io — CPM marketplace for music promotion.',
};

export default function TosPage() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <a href="/" className="text-text-muted text-sm hover:text-text mb-8 inline-block">← Back</a>
        <h1 className="font-display text-3xl text-text mb-8">Terms of Service</h1>
        
        <div className="prose prose-sm text-text-secondary space-y-6">
          <p><strong>Last updated:</strong> May 2026</p>

          <h2 className="text-text font-semibold text-lg mt-8">1. Overview</h2>
          <p>SendMusic.io is a marketplace connecting artists with content creators for music promotion on TikTok, Instagram Reels, and YouTube Shorts. By using our platform, you agree to these terms.</p>

          <h2 className="text-text font-semibold text-lg mt-8">2. Accounts</h2>
          <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account. You must be at least 13 years old to use SendMusic.io.</p>

          <h2 className="text-text font-semibold text-lg mt-8">3. Campaigns & Payments</h2>
          <p>Artists deposit funds into campaigns via Stripe. Creators submit content for review. Artists approve or reject submissions. Approved content earns CPM-based payouts for verified views only. Platform fees are deducted per our fee schedule. Payouts to creators are processed on a net-7 basis after view verification.</p>

          <h2 className="text-text font-semibold text-lg mt-8">4. Content</h2>
          <p>Creators retain rights to their content. Artists grant creators a limited license to use their music in promotional content on approved platforms. Content must comply with platform (TikTok, Instagram, YouTube) terms of service.</p>

          <h2 className="text-text font-semibold text-lg mt-8">5. Prohibited Conduct</h2>
          <p>No fake views, bots, or artificial engagement. No spam or harassment. No infringing content. We reserve the right to suspend accounts that violate these terms.</p>

          <h2 className="text-text font-semibold text-lg mt-8">6. Limitation of Liability</h2>
          <p>SendMusic.io is provided "as is." We are not liable for indirect damages. Our maximum liability is limited to the amount you have deposited in the past 12 months.</p>

          <h2 className="text-text font-semibold text-lg mt-8">7. Contact</h2>
          <p>Questions: contact@sendmusic.io</p>
        </div>
      </div>
    </main>
  );
}
