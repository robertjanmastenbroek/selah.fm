import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Selah.fm vs TikTok Creator Fund, SoundBetter, BeatStars — Comparison',
  description: 'How Selah.fm compares to TikTok Creator Fund, SoundBetter, and BeatStars for music promotion. See CPM rates, fees, and features side by side.',
  openGraph: {
    title: 'Selah.fm vs Competitors — Music Promotion Comparison',
    description: 'See how Selah.fm compares to TikTok Creator Fund, SoundBetter, and BeatStars. Artists pay per verified view, creators earn 80% CPM.',
    url: 'https://selah.fm/compare',
    type: 'website',
  },
  alternates: { canonical: 'https://selah.fm/compare' },
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#080817]">
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4">
        <Link href="/" className="font-bold text-lg" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
          Selah<span className="text-primary">.fm</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/login?redirect=/onboarding" className="text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">
            Get started
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading tracking-tight mb-4">
            How Selah.fm compares
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See why independent artists and creators choose Selah.fm over traditional music promotion platforms.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left py-4 px-5 font-semibold w-[30%]">Feature</th>
                <th className="text-center py-4 px-3 font-heading text-primary w-[17.5%]">Selah.fm</th>
                <th className="text-center py-4 px-3 text-muted-foreground/60 w-[17.5%]">TikTok Creator Fund</th>
                <th className="text-center py-4 px-3 text-muted-foreground/60 w-[17.5%]">SoundBetter</th>
                <th className="text-center py-4 px-3 text-muted-foreground/60 w-[17.5%]">BeatStars</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Pricing model', selah: 'CPM (per 1K views)', tiktok: 'Platform-set CPM', soundbetter: 'Flat fee per project', beatstars: 'License fee' },
                { feature: 'Earnings per 1M views', selah: '<strong>$800–$24,000</strong>', tiktok: '$20–$40', soundbetter: 'N/A (flat fee)', beatstars: 'N/A (licensing)' },
                { feature: 'vs TikTok Fund', selah: '<strong>20–40× more</strong>', tiktok: 'Baseline', soundbetter: 'N/A', beatstars: 'N/A' },
                { feature: 'Set your own rate', selah: '<span class="text-emerald-400">✅</span> Artists set CPM', tiktok: '<span class="text-red-400">❌</span> Fixed by TikTok', soundbetter: '<span class="text-red-400">❌</span> Fixed fee', beatstars: '<span class="text-red-400">❌</span> Fixed license' },
                { feature: 'Approve every video', selah: '<span class="text-emerald-400">✅</span> Before it goes live', tiktok: '<span class="text-red-400">❌</span> No approval', soundbetter: '<span class="text-muted-foreground/40">—</span>', beatstars: '<span class="text-muted-foreground/40">—</span>' },
                { feature: 'Verified views only', selah: '<span class="text-emerald-400">✅</span> Third-party verification', tiktok: '<span class="text-emerald-400">✅</span> Platform native', soundbetter: '<span class="text-muted-foreground/40">—</span>', beatstars: '<span class="text-muted-foreground/40">—</span>' },
                { feature: 'Pay only for results', selah: '<span class="text-emerald-400">✅</span> Per verified view', tiktok: '<span class="text-emerald-400">✅</span> Per view', soundbetter: '<span class="text-red-400">❌</span> Upfront fee', beatstars: '<span class="text-red-400">❌</span> Upfront fee' },
                { feature: 'Open source', selah: '<span class="text-emerald-400">✅</span> MIT license', tiktok: '<span class="text-red-400">❌</span> Proprietary', soundbetter: '<span class="text-red-400">❌</span> Proprietary', beatstars: '<span class="text-red-400">❌</span> Proprietary' },
                { feature: 'Creator payout threshold', selah: '<strong>$10</strong>', tiktok: '$10', soundbetter: '<span class="text-muted-foreground/40">N/A</span>', beatstars: '<span class="text-muted-foreground/40">N/A</span>' },
                { feature: 'Platform fee', selah: '<strong>20%</strong>', tiktok: '100% (takes all)', soundbetter: '15–20%', beatstars: '30–50%' },
                { feature: 'Free to join', selah: '<span class="text-emerald-400">✅</span> Yes', tiktok: '<span class="text-emerald-400">✅</span> Yes', soundbetter: '<span class="text-emerald-400">✅</span> Yes', beatstars: '<span class="text-emerald-400">✅</span> Yes' },
                { feature: 'Artist control', selah: '<strong>Full</strong>', tiktok: 'None', soundbetter: 'Medium', beatstars: 'Medium' },
              ].map((row, i) => (
                <tr key={i} className={`border-b border-white/[0.03] hover:bg-white/[0.01] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="py-3.5 px-5 font-medium">{row.feature}</td>
                  <td className="text-center py-3.5 px-3 text-primary font-medium text-xs" dangerouslySetInnerHTML={{ __html: row.selah }} />
                  <td className="text-center py-3.5 px-3 text-muted-foreground/50 text-xs" dangerouslySetInnerHTML={{ __html: row.tiktok }} />
                  <td className="text-center py-3.5 px-3 text-muted-foreground/50 text-xs" dangerouslySetInnerHTML={{ __html: row.soundbetter }} />
                  <td className="text-center py-3.5 px-3 text-muted-foreground/50 text-xs" dangerouslySetInnerHTML={{ __html: row.beatstars }} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Creator earnings deep dive */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-emerald-500/[0.03] border border-emerald-500/10 p-6 md:p-8">
            <h2 className="text-lg font-heading mb-3 text-emerald-400">Creator earnings comparison</h2>
            <p className="text-sm text-muted-foreground mb-4">What a creator earns per 1 million views on each platform:</p>
            <div className="space-y-3">
              {[
                { label: 'Selah.fm (at $1 CPM)', earn: '$800', color: 'text-emerald-400' },
                { label: 'Selah.fm (at $5 CPM)', earn: '$4,000', color: 'text-emerald-400' },
                { label: 'Selah.fm (at $10 CPM)', earn: '$8,000', color: 'text-emerald-400' },
                { label: 'Selah.fm (at $30 CPM)', earn: '$24,000', color: 'text-emerald-400' },
                { label: 'TikTok Creator Fund', earn: '$20–$40', color: 'text-muted-foreground/60' },
                { label: 'YouTube Shorts Fund', earn: '$100–$300', color: 'text-muted-foreground/60' },
                { label: 'Instagram Reels Bonus', earn: '$0 (invite only)', color: 'text-muted-foreground/60' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.earn}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-indigo-500/[0.03] border border-indigo-500/10 p-6 md:p-8">
            <h2 className="text-lg font-heading mb-3 text-indigo-400">Artist value comparison</h2>
            <p className="text-sm text-muted-foreground mb-4">What an artist gets for a $100 budget on each platform:</p>
            <div className="space-y-3">
              {[
                { label: 'Selah.fm (at $5 CPM)', earn: '~16,000 verified views', color: 'text-emerald-400' },
                { label: 'Selah.fm (at $10 CPM)', earn: '~8,000 verified views', color: 'text-emerald-400' },
                { label: 'Facebook/IG Ads', earn: '~2,000–5,000 impressions', color: 'text-muted-foreground/60' },
                { label: 'TikTok Ads', earn: '~1,000–3,000 impressions', color: 'text-muted-foreground/60' },
                { label: 'SoundBetter', earn: '1 producer session', color: 'text-muted-foreground/60' },
                { label: 'Playlist pitching service', earn: '1 playlist submission', color: 'text-muted-foreground/60' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.earn}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why Selah wins */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 mb-12">
          <h2 className="text-xl font-heading mb-4 text-center">Why creators and artists choose Selah.fm</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'CPM beats funds', desc: 'Even at $1 CPM, Selah.fm pays 20× more than TikTok Creator Fund. At $30 CPM — 600× more. Creators earn what they\'re worth.' },
              { title: 'Artist controls quality', desc: 'You approve every video before it goes live. No random content using your music. You decide what represents your brand.' },
              { title: 'Pay for real results', desc: 'Only pay for verified views. No wasted budget on bots, fake engagement, or algorithm guesses. Every dollar buys real human attention.' },
              { title: 'Open source trust', desc: 'Every line of code is public. Anyone can verify there are no hidden fees, backdoors, or data exploitation. MIT licensed.' },
              { title: 'No lock-in', desc: 'No monthly subscriptions. No annual contracts. No cancellation fees. Your unspent budget is 100% refundable.' },
              { title: 'Dual-sided marketplace', desc: 'Get discovered by creators AND find artists to create for. The platform works for both sides of the music promotion equation.' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="text-xl font-heading text-center mb-6">Common comparison questions</h2>
          <div className="space-y-3">
            {[
              { q: 'How does Selah.fm compare to TikTok\'s Creator Fund?', a: 'TikTok\'s Creator Fund pays $0.02–$0.04 per 1,000 views. Selah.fm pays $0.80–$24.00 per 1,000 views depending on the CPM rate artists set. That\'s 20–600× more. Creators also keep 80% of the CPM vs TikTok keeping 100% of ad revenue.' },
              { q: 'Is Selah.fm better than SoundBetter for promotion?', a: 'SoundBetter connects artists with producers and session musicians — it\'s for making music, not promoting it. Selah.fm is for getting your finished music in front of audiences through creator content. They serve different needs.' },
              { q: 'How does Selah.fm compare to BeatStars?', a: 'BeatStars is a beat marketplace where producers sell licenses to artists. Selah.fm is a promotion marketplace where artists pay creators to make content with their music. Artists keep 100% of their rights on Selah.fm.' },
              { q: 'Can I use both Selah.fm and other platforms?', a: 'Absolutely. Selah.fm works alongside your existing promotion strategy. Use it for creator-driven content while running ads or pursuing playlist placements. There\'s no exclusivity.' },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-white/[0.04] bg-white/[0.01] overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium text-white/70 hover:text-white transition-colors">
                  {faq.q}
                  <svg className="w-4 h-4 text-white/20 group-open:rotate-180 transition-transform shrink-0 ml-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9" /></svg>
                </summary>
                <div className="px-5 pb-4 text-xs text-muted-foreground/60 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-heading mb-3">Ready to experience the difference?</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">No credit card required. Free to join. See why creators and artists are switching to CPM-based promotion.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login?redirect=/onboarding" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all">
              Create free account
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/[0.08] text-muted-foreground hover:text-foreground transition-all">
              View pricing
            </Link>
          </div>
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'How does Selah.fm compare to TikTok\'s Creator Fund?', acceptedAnswer: { '@type': 'Answer', text: 'Selah.fm pays $0.80-$24.00 per 1,000 views vs TikTok\'s $0.02-$0.04. That is 20-600x more for creators.' } },
            { '@type': 'Question', name: 'Is Selah.fm better than SoundBetter for promotion?', acceptedAnswer: { '@type': 'Answer', text: 'SoundBetter is for making music with producers. Selah.fm is for promoting finished music through creator content.' } },
            { '@type': 'Question', name: 'How does Selah.fm compare to BeatStars?', acceptedAnswer: { '@type': 'Answer', text: 'BeatStars sells beat licenses. Selah.fm is a promotion marketplace. Artists keep 100% of their rights on Selah.fm.' } },
          ],
        }),
      }} />
    </div>
  );
}
