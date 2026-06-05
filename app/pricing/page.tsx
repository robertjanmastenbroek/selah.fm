import type { Metadata } from 'next';
import Link from 'next/link';
import PricingClient from './PricingClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing — Selah.fm | CPM Music Promotion | No Upfront Cost',
  description: 'Free to join. Set your own CPM rate. Pay only for verified views. Creators earn 80% of every dollar. No hidden fees, no monthly subscriptions.',
  openGraph: {
    title: 'Pricing — Selah.fm | CPM Music Promotion Marketplace',
    description: 'Free to join. Set your own CPM rate. Pay only for verified views. Creators keep 80%. Compare vs TikTok Creator Fund, SoundBetter, BeatStars.',
    url: 'https://selah.fm/pricing',
    type: 'website',
    images: [{ url: 'https://selah.fm/images/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Selah.fm',
    description: 'Free to join. Set your own CPM. Pay only for verified views.',
  },
  alternates: { canonical: 'https://selah.fm/pricing' },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#080817]">
      {/* Navigation */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4">
        <Link href="/" className="font-bold text-lg" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
          Selah<span className="text-primary">.fm</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          <Link href="/login?redirect=/onboarding" className="text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">
            Get started
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* ── Hero ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[11px] font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Free to start · No monthly fees
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading tracking-tight mb-4">
            Fair pricing,<br />
            <span className="bg-gradient-to-r from-[#4338CA] via-[#818CF8] to-[#22C55E] bg-clip-text text-transparent">no middlemen</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Set your own CPM rate. Creators earn per verified view. Selah.fm takes 20%.
            No subscriptions, no minimums, no hidden fees.
          </p>
        </div>

        {/* ── Interactive CPM Calculator ── */}
        <PricingClient />

        {/* ── Pricing Model ── */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-indigo-500/[0.03] border border-indigo-500/10 p-6 md:p-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-heading mb-2">For artists</h2>
            <p className="text-muted-foreground text-sm mb-6">You set the budget. You approve every video. You only pay for verified views.</p>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Platform fee', detail: '20%' },
                { label: 'Setup cost', detail: 'Free' },
                { label: 'Monthly subscription', detail: 'None' },
                { label: 'Withdrawal fee (Stripe)', detail: '2.9% + $0.30' },
                { label: 'Unspent budget', detail: '100% refundable' },
              ].map((item, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.detail}</span>
                </li>
              ))}
            </ul>
            <Link href="/welcome-artists" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all">
              Start promoting music →
            </Link>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-emerald-500/[0.03] border border-emerald-500/10 p-6 md:p-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-heading mb-2">For creators</h2>
            <p className="text-muted-foreground text-sm mb-6">Browse campaigns, make content, earn per verified view. No minimum followers required.</p>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Platform fee', detail: '20% (from gross)' },
                { label: 'Your share', detail: '80% of CPM rate' },
                { label: 'Setup cost', detail: 'Free' },
                { label: 'Payout method', detail: 'Stripe Connect' },
                { label: 'Payout threshold', detail: '$10' },
                { label: 'Payout speed', detail: '2-3 business days' },
              ].map((item, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.detail}</span>
                </li>
              ))}
            </ul>
            <Link href="/welcome-creators" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-all">
              Start earning as a creator →
            </Link>
          </div>
        </div>

        {/* ── Comparison Table ── */}
        <div className="mt-20">
          <h2 className="text-2xl md:text-3xl font-heading text-center mb-2">How we compare</h2>
          <p className="text-muted-foreground text-sm text-center mb-10">See how Selah.fm stacks up against other music promotion platforms.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-4 pr-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-heading text-primary">Selah.fm</th>
                  <th className="text-center py-4 px-4 text-muted-foreground/60">TikTok Creator Fund</th>
                  <th className="text-center py-4 px-4 text-muted-foreground/60">SoundBetter</th>
                  <th className="text-center py-4 px-4 text-muted-foreground/60">BeatStars</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Earnings per 1M views', selah: '$800–$24,000', tiktok: '$20–$40', soundbetter: 'N/A (flat fee)', beatstars: 'N/A (licensing)' },
                  { feature: 'Set your own rate', selah: '✅ Artists set CPM', tiktok: '❌ Fixed by TikTok', soundbetter: '❌ Fixed fee', beatstars: '❌ Fixed license' },
                  { feature: 'Approve every video', selah: '✅ Before it goes live', tiktok: '❌ No approval', soundbetter: '❌ N/A', beatstars: '❌ N/A' },
                  { feature: 'Verified views only', selah: '✅ Third-party verification', tiktok: '✅ Platform native', soundbetter: '❌ N/A', beatstars: '❌ N/A' },
                  { feature: 'Pay only for results', selah: '✅ Per verified view', tiktok: '✅ Per view', soundbetter: '❌ Upfront fee', beatstars: '❌ Upfront fee' },
                  { feature: 'Open source', selah: '✅ MIT license', tiktok: '❌ Proprietary', soundbetter: '❌ Proprietary', beatstars: '❌ Proprietary' },
                  { feature: 'Creator payout threshold', selah: '$10', tiktok: '$10', soundbetter: 'N/A', beatstars: 'N/A' },
                  { feature: 'Platform fee', selah: '20%', tiktok: '100% (takes all)', soundbetter: '15–20%', beatstars: '30–50%' },
                  { feature: 'Free to join', selah: '✅ Yes', tiktok: '✅ Yes', soundbetter: '✅ Yes', beatstars: '✅ Yes' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                    <td className="py-3 pr-4 font-medium">{row.feature}</td>
                    <td className="text-center py-3 px-4 text-primary font-medium">{row.selah}</td>
                    <td className="text-center py-3 px-4 text-muted-foreground/50">{row.tiktok}</td>
                    <td className="text-center py-3 px-4 text-muted-foreground/50">{row.soundbetter}</td>
                    <td className="text-center py-3 px-4 text-muted-foreground/50">{row.beatstars}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-heading text-center mb-2">Pricing FAQ</h2>
          <p className="text-muted-foreground text-sm text-center mb-10">Common questions about how Selah.fm pricing works.</p>

          <div className="space-y-3">
            {[
              { q: 'What is CPM?', a: 'CPM stands for Cost Per Mille (cost per 1,000 views). On Selah.fm, artists set their own CPM rate. When a creator\'s video gets 1,000 verified views, they earn that CPM amount. You only pay for views that are verified as real by our third-party system.' },
              { q: 'Do I need to pay upfront?', a: 'No. You deposit funds to your campaign budget, and payments are deducted per approved view. You can start with as little as $5. Unspent budget is 100% refundable.' },
              { q: 'How much do creators actually earn?', a: 'Creators earn 80% of the CPM rate you set. If you set a $10 CPM, creators earn $8 per 1,000 verified views. Selah.fm takes 20% for payment processing, view verification, and fraud detection.' },
              { q: 'How does this compare to TikTok\'s Creator Fund?', a: 'TikTok\'s Creator Fund pays $0.02–$0.04 per 1,000 views. At Selah.fm, even a $1 CPM pays $0.80 per 1,000 views — 20–40× more. And you\'re making music promotion content, which is what you\'d be doing anyway.' },
              { q: 'Are there any hidden fees?', a: 'None. The only costs are: your CPM rate (you set it), the 20% platform fee, and Stripe\'s payment processing fees (2.9% + $0.30 for deposits). No monthly fees, no listing fees, no cancellation fees.' },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-white/[0.04] bg-white/[0.01] overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium text-white/70 hover:text-white transition-colors">
                  {faq.q}
                  <svg className="w-4 h-4 text-white/20 group-open:rotate-180 transition-transform shrink-0 ml-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9" /></svg>
                </summary>
                <div className="px-5 pb-4 text-xs text-muted-foreground/60 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl md:text-3xl font-heading mb-3">Ready to start?</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">No credit card required. Free to join. Start promoting your music or earning as a creator in 2 minutes.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login?redirect=/onboarding" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all">
              Create free account
            </Link>
            <Link href="/browse" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/[0.08] text-muted-foreground hover:text-foreground transition-all">
              Browse without signing up
            </Link>
          </div>
        </div>
      </main>

      {/* FAQPage schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'What is CPM?', acceptedAnswer: { '@type': 'Answer', text: 'CPM stands for Cost Per Mille. Artists set their own CPM rate. Creators earn that rate per 1,000 verified views.' } },
              { '@type': 'Question', name: 'Do I need to pay upfront?', acceptedAnswer: { '@type': 'Answer', text: 'No. Deposit funds to your campaign budget. Payments are deducted per approved view. Unspent budget is 100% refundable.' } },
              { '@type': 'Question', name: 'How do creator earnings work?', acceptedAnswer: { '@type': 'Answer', text: 'Creators earn 80% of the CPM rate artists set. Selah.fm takes 20% for payment processing, view verification, and fraud detection.' } },
              { '@type': 'Question', name: 'Are there any hidden fees?', acceptedAnswer: { '@type': 'Answer', text: 'None. Only your CPM rate, 20% platform fee, and Stripe processing fees. No monthly or cancellation fees.' } },
            ],
          }),
        }}
      />
    </div>
  );
}
