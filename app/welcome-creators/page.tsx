import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Selah.fm — Make Content. Get Paid.',
  description: 'Turn your creativity into cash. Use TikTok, Instagram & YouTube Shorts to promote music you love, and earn based on the real views your content generates.',
};

export default function WelcomeCreatorsPage() {
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
            ✓ No upfront costs ✓ Earn per 1,000 views ✓ Choose tracks you love ✓ Fast, secure payouts
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Make Content.<br />
            <span className="bg-gradient-to-r from-primary via-[#8B9FFF] to-primary bg-clip-text text-transparent">
              Get Paid.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3 leading-relaxed">
            Turn your creativity into cash. Use TikTok, Instagram &amp; YouTube Shorts to promote music you love, and earn based on the real views your content generates.
          </p>
          <p className="text-sm text-muted-foreground mb-10">Free to join. No weird contracts.</p>

          <Link href="/browse" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:opacity-90 transition-all hover:scale-[1.02]">
            Start Earning Today
          </Link>
        </div>
      </section>

      {/* ═══════════ OPPORTUNITY ═══════ */}
      <section className="py-16 md:py-24 bg-muted/10">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">You&apos;re Already Making Content. Now Get Paid Fairly for It.</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto text-sm">The creator hustle is real. Here&apos;s what you&apos;re up against.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🏃', title: 'Unpredictable Brand Deals', desc: 'Hunting for sponsors is a full-time job. You shouldn\'t have to DM 50 brands just to get a $50 offer.' },
              { icon: '📉', title: 'Algorithm-Dependent Income', desc: 'Platform monetization programs keep changing the rules. You deserve a stable, transparent way to earn.' },
              { icon: '💪', title: '"Exposure" Doesn\'t Pay Rent', desc: 'You\'ve been asked to work for \'exposure\' too many times. On Selah, every view has a dollar value.' },
            ].map((item, i) => (
              <div key={i} className="relative p-6 rounded-xl border border-success/20 bg-success/[0.02]">
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-xs text-success">✓</div>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW YOU EARN ═══════ */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">It&apos;s Simple: Create, Post, and Earn.</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '🎵', title: 'Pick a Track You Love', desc: 'Browse new music from independent artists. Connect your TikTok, Instagram, or YouTube Shorts account instantly.' },
              { step: '2', icon: '📱', title: 'Create Authentic Content', desc: 'Use the track in your short-form videos in a way that feels natural to your style. No cheesy scripts.' },
              { step: '3', icon: '💰', title: 'Get Paid for Real Views', desc: 'Artists approve your video. Once it\'s live, every 1,000 verified views earns you cash. See your earnings grow.' },
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Join Hundreds of Creators Already Earning.</h2>
          <p className="text-muted-foreground text-center mb-12 text-sm">Real creators. Real payouts. Real stories.</p>

          <div className="space-y-4">
            {[
              { name: 'Chloe B.', role: 'TikTok Creator', quote: 'I saw a track I loved, posted a 30-second Reel, and got paid $85 three days later. Selah is the most straightforward platform I\'ve ever used.' },
              { name: 'Mia J.', role: 'Lifestyle Creator · 28K', quote: 'I love that I can browse campaigns and pick tracks that fit my style. Made $340 last month from 3 videos. Way better than brand deals.' },
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

      {/* ═══════════ FEES ═══════ */}
      <section className="py-16 md:py-24">
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Creators Keep the Lion&apos;s Share.</h2>
          <p className="text-muted-foreground text-center mb-12 text-sm">You keep 80% of every payout. We take 20% to run the platform.</p>

          <div className="rounded-xl bg-card border border-border/30 overflow-hidden text-center p-8">
            <div className="flex items-end justify-center gap-2 mb-4">
              <div className="w-32 h-32 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-2xl font-bold">80%</div>
              <div className="w-20 h-16 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm font-medium">20%</div>
            </div>
            <p className="text-sm">You get 80% of the CPM rate. Platform fee covers Stripe, support, and operations.</p>
            <p className="text-xs text-muted-foreground mt-3">Connect your Stripe account in under 2 minutes. Payouts process automatically.</p>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════ */}
      <section className="py-16 md:py-24 bg-muted/10">
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Got questions?</h2>
          <div className="space-y-3">
            {[
              { q: 'How do I know I\'ll actually get paid?', a: 'Payments are processed through Stripe. Once an artist approves your video and views are verified, your payout is automatically sent to your connected bank account.' },
              { q: 'What if an artist doesn\'t approve my video?', a: 'That\'s ok. Not every submission gets approved. Artists review each video against their requirements. You can always try again with a different campaign.' },
              { q: 'Do I have to be a huge influencer?', a: 'No minimum followers required. We believe small creators can drive big results. Your content quality matters more than your follower count.' },
              { q: 'How and when do I get my money?', a: 'Connect Stripe in under 2 minutes. Payouts happen when artists approve your submission. You\'ll see earnings in your dashboard.' },
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
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Your Content is Worth More.</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">Connect your accounts in under 2 minutes. No cost to join.</p>
        <Link href="/browse" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:opacity-90 transition-all">
          Join Selah &amp; Start Earning
        </Link>
        <p className="text-xs text-muted-foreground mt-6">
          <Link href="/creators" className="hover:text-foreground transition-colors">Browse creators</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
