import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Selah.fm — Real Promotion for Real Artists',
  description: 'Ditch bots and wasted ad spend. Launch a campaign on Selah to have vetted creators share your music in their TikToks, Reels & Shorts.',
};

export default function WelcomeArtistsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════ HERO ═══════ */}
      <section className="relative overflow-hidden py-16 md:py-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-8">
            ✓ No bots ✓ You set the CPM ✓ Approve every video ✓ Pay only for real views
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Real Promotion for<br />
            <span className="bg-gradient-to-r from-primary via-[#8B9FFF] to-primary bg-clip-text text-transparent">
              Real Artists.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3 leading-relaxed">
            Ditch bots and wasted ad spend. Launch a campaign to have vetted creators share your music in their TikToks, Reels &amp; Shorts. You set the budget and only pay for verified views.
          </p>
          <p className="text-sm text-muted-foreground mb-10">Free to start. Takes 2 minutes.</p>

          <Link href="/dashboard" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:opacity-90 transition-all hover:scale-[1.02]">
            Start My Campaign
          </Link>
        </div>
      </section>

      {/* ═══════════ PROBLEM ═══════ */}
      <section className="py-16 md:py-24 bg-muted/10">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Why Is Music Promo Still a Scam in 2026?</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto text-sm">You&apos;ve been burned. We get it. Here&apos;s what the old way looks like.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'Playlist Bots', desc: 'You pay for streams from fake accounts. Your fans are just a spike on a chart — no engagement, no real growth.' },
              { icon: '💸', title: 'Black-Box Ads', desc: 'You pour money into TikTok & Meta ads with no guarantee. You pay for impressions that never lead to a stream.' },
              { icon: '🐌', title: 'Overpriced PR', desc: 'Agencies charge $2k/month retainers for \'exposure.\' No tracking, no verification, no link to real fans.' },
            ].map((item, i) => (
              <div key={i} className="relative p-6 rounded-xl border border-destructive/10 bg-destructive/[0.02]">
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-xs">✕</div>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SOLUTION ═══════ */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Finally, a Marketplace That Makes Sense.</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '🎯', title: 'Create Your Campaign', desc: 'Upload your track, set a CPM, and define your budget. Our system suggests the best rate. You\'re in control.' },
              { step: '2', icon: '🎬', title: 'Creators Make Content', desc: 'Our vetted community browses campaigns. The ones who love your sound will make TikToks, Reels & Shorts.' },
              { step: '3', icon: '✅', title: 'Approve & Pay', desc: 'Watch every submission. Approve what you love. Pay only for verified views. Your budget stays safe.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold">
                  {s.icon}
                </div>
                <div className="inline-flex w-6 h-6 rounded-full bg-background border border-primary/20 text-xs font-bold items-center justify-center mb-3">
                  {s.step}
                </div>
                <h3 className="font-bold text-base mb-2">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF ═══════ */}
      <section className="py-16 md:py-24 bg-muted/10">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Artists Are Finally Getting What They Pay For.</h2>
          <p className="text-muted-foreground text-center mb-12 text-sm">Real results from real creators. No bots. No waste.</p>

          <div className="space-y-4">
            {[
              { name: 'Marcus J.', role: 'Electronic Producer', quote: 'I\'d spent thousands on playlists that just gave me empty streams. With Selah, I paid $200 and got 15 videos that drove real, engaged listeners to my Spotify. It\'s night and day.' },
              { name: 'Sarah K.', role: 'Christian EDM Artist', quote: 'I wasted $1,500 on playlist pitching last year. On Selah, I spent $200 and got 6 great videos from real creators. The approval flow means I never pay for content I don\'t like.' },
            ].map((t, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/30 p-6">
                <div className="text-primary text-sm mb-3">★★★★★</div>
                <p className="text-sm leading-relaxed mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">{t.name[0]}</div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════ */}
      <section className="py-16 md:py-24">
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Clear Pricing. Always.</h2>
          <p className="text-muted-foreground text-center mb-12 text-sm">No monthly fees. No subscription. Only pay when you run a campaign.</p>

          <div className="rounded-xl bg-card border border-border/30 overflow-hidden">
            <div className="text-center p-8 border-b border-border/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Where your $100 goes</p>
              <div className="flex items-end justify-center gap-2">
                <div className="w-32 h-32 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-2xl font-bold">$80</div>
                <div className="w-20 h-16 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm font-medium">$20</div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">80% to creators · 20% platform fee</p>
            </div>
            <div className="px-6 py-4 text-center text-xs text-muted-foreground">
              Stripe processing: 2.9% + $0.30 on deposits. Payouts: $0.25 per transfer.
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════ */}
      <section className="py-16 md:py-24 bg-muted/10">
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Got questions?</h2>
          <div className="space-y-3">
            {[
              { q: 'How do you guarantee the views are real people?', a: 'Views are verified through platform APIs (YouTube) and manual review. No bots, no fake streams. You only pay for verified views.' },
              { q: 'Can I set a total budget cap?', a: 'Yes. You set a total budget and a max payout per submission. Your budget is locked — you never pay more than you set.' },
              { q: 'What if I hate the video?', a: 'You review every video before approving. Reject anything that doesn\'t meet your requirements. You don\'t pay for rejected submissions.' },
              { q: 'What happens if a creator doesn\'t deliver?', a: 'Nothing. You only pay when you approve a submission. There\'s no obligation on either side.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/30 p-5">
                <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════ */}
      <section className="py-20 md:py-28 text-center bg-gradient-to-b from-background via-primary/[0.02] to-primary/[0.04]">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Stop Guessing and Start Growing?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">No credit card required to browse. You only fund your campaign when you&apos;re ready.</p>
        <Link href="/dashboard" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:opacity-90 transition-all">
          Start My First Campaign — Free
        </Link>
        <p className="text-xs text-muted-foreground mt-6">
          <Link href="/artists" className="hover:text-foreground transition-colors">Browse artists</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
