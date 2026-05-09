'use client';

export default function LandingPage() {
  return (
    <>
      {/* ---- Nav ---- */}
      <nav className="border-b border-white/5 sticky top-0 bg-void/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display text-gold text-xl tracking-wide">sendmusic.io</span>
          <a href="/login" className="btn-gold text-sm !py-2 !px-5">Get started</a>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="max-w-6xl mx-auto px-4 pt-16 md:pt-28 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-6xl text-ivory leading-tight mb-6">
              Your music,<br />
              <span className="text-gold">promoted by real creators.</span>
            </h1>
            <p className="text-lg text-muted leading-relaxed mb-8 max-w-md">
              Set your budget. Creators make TikToks and Reels with your track.
              You review, approve, and pay only for verified views.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href="/login" className="btn-gold text-base !px-8 !py-3.5">Start as an artist</a>
              <a href="/login" className="btn-outline text-base !px-8 !py-3.5">Start as a creator</a>
            </div>
            <div className="flex gap-6 mt-8 text-sm text-muted">
              <span>✓ No upfront fees</span>
              <span>✓ 5% platform fee only</span>
            </div>
          </div>
          {/* Hero image placeholder — replace with generated image */}
          <div className="hidden md:block">
            <div className="bg-gradient-to-br from-void-card via-gold/5 to-void-card rounded-2xl h-80 flex items-center justify-center border border-white/5">
              <div className="text-center">
                <div className="text-5xl mb-4">🎵</div>
                <div className="text-muted text-sm">Hero illustration</div>
                <div className="text-muted/50 text-xs mt-1">Generated with Higgsfield</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { num: 'CPM', label: 'You set the rate' },
            { num: '5%', label: 'Platform fee' },
            { num: 'Cap', label: 'Max payout per video' },
            { num: 'You', label: 'Approve every video' },
          ].map(({ num, label }) => (
            <div key={label} className="card-elevated !p-5">
              <div className="font-display text-2xl text-gold mb-1">{num}</div>
              <div className="text-muted text-xs">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- How it works (3 steps each) ---- */}
      <section className="border-y border-white/5 bg-void-elevated/30 py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-3xl text-center text-ivory mb-4">How it works</h2>
          <p className="text-muted text-center mb-16 max-w-md mx-auto">
            Simple as posting a TikTok. Artists set the terms. Creators earn for views.
          </p>

          {/* Artist flow */}
          <div className="mb-16">
            <h3 className="text-gold text-xs font-semibold uppercase tracking-widest mb-8 text-center">For artists</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { step: '1', title: 'Create campaign', desc: 'Set CPM rate, max payout, and upload your track. Funds held in escrow.' },
                { step: '2', title: 'Review submissions', desc: 'Creators submit their TikToks and Reels. You watch and approve the ones you like.' },
                { step: '3', title: 'Pay for views', desc: 'Approved content earns as views grow. Auto-capped so your budget stays safe.' },
              ].map((s) => (
                <div key={s.step} className="card text-center !p-6">
                  <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mx-auto mb-4 font-bold">
                    {s.step}
                  </div>
                  <div className="font-semibold text-ivory mb-2">{s.title}</div>
                  <div className="text-muted text-sm leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Creator flow */}
          <div>
            <h3 className="text-gold text-xs font-semibold uppercase tracking-widest mb-8 text-center">For creators</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { step: '1', title: 'Pick a track', desc: 'Browse campaigns with visible CPM rates and budgets. Find music you love.' },
                { step: '2', title: 'Create & submit', desc: 'Post your TikTok or Reel with the track. Paste the link. That\'s it.' },
                { step: '3', title: 'Get paid', desc: 'Artist approves your content. Views are verified. You earn CPM automatically.' },
              ].map((s) => (
                <div key={s.step} className="card text-center !p-6">
                  <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mx-auto mb-4 font-bold">
                    {s.step}
                  </div>
                  <div className="font-semibold text-ivory mb-2">{s.title}</div>
                  <div className="text-muted text-sm leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Dashboard preview ---- */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-gold text-xs font-semibold uppercase tracking-widest mb-3">For artists</div>
            <h2 className="font-display text-3xl text-ivory mb-4">Full control over your budget</h2>
            <p className="text-muted leading-relaxed mb-6">
              Set CPM rate, max payout per video, and minimum view threshold.
              Only quality content reaches your review queue. One viral clip never drains your budget.
            </p>
            <ul className="space-y-3 text-muted text-sm">
              {[
                'Real-time dashboard: views, spend, submissions',
                'Review content before paying — you have final say',
                'Auto-capped payouts protect your campaign',
              ].map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <span className="text-gold flex-shrink-0">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-void-card via-gold/5 to-void-card rounded-2xl h-64 flex items-center justify-center border border-white/5">
            <div className="text-center"><div className="text-3xl mb-2">📊</div><div className="text-muted text-sm">Dashboard preview</div></div>
          </div>
        </div>
      </section>

      {/* ---- Earnings visual ---- */}
      <section className="border-y border-white/5 bg-void-elevated/30 py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-gradient-to-br from-void-card via-gold/5 to-void-card rounded-2xl h-64 flex items-center justify-center border border-white/5">
            <div className="text-center"><div className="text-3xl mb-2">📈</div><div className="text-muted text-sm">Earnings growth</div></div>
          </div>
          <div className="order-1 md:order-2">
            <div className="text-gold text-xs font-semibold uppercase tracking-widest mb-3">For creators</div>
            <h2 className="font-display text-3xl text-ivory mb-4">Get paid for the content you already make</h2>
            <p className="text-muted leading-relaxed mb-6">
              Browse campaigns from artists who want their music promoted.
              Create TikToks and Reels with tracks you love. Earn CPM on verified views.
            </p>
            <ul className="space-y-3 text-muted text-sm">
              {[
                'See CPM rates and remaining budgets before you start',
                'Submit your link — simple as pasting a URL',
                'Automatic payouts when views hit thresholds',
              ].map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <span className="text-gold flex-shrink-0">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- Why different ---- */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-3xl text-center text-ivory mb-4">Why sendmusic.io</h2>
          <p className="text-muted text-center mb-12 max-w-md mx-auto">
            Built for music. Not general content promotion.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 pr-4 text-muted font-normal">Other platforms</th>
                  <th className="text-left py-4 px-4 text-gold font-display text-base">sendmusic.io</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Pay per submission — no guarantee', 'Pay per verified view — only when it works'],
                  ['General content — not music-focused', 'Built exclusively for music promotion'],
                  ['No budget protection', 'Max payout cap + minimum view threshold'],
                  ['Automated — no quality check', 'You review and approve every video'],
                  ['Fixed pricing — no control', 'You set CPM, budget, and per-video cap'],
                ].map(([old, nw]) => (
                  <tr key={old}>
                    <td className="py-4 pr-4 text-muted">{old}</td>
                    <td className="py-4 px-4 text-ivory">{nw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="border-y border-white/5 bg-void-elevated/30 py-20 md:py-28 text-center">
        <div className="max-w-lg mx-auto px-4">
          <h2 className="font-display text-3xl text-ivory mb-4">Ready to get your music heard?</h2>
          <p className="text-muted mb-8">
            First cohort launching soon. Artists and creators — claim your spot.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/login" className="btn-gold text-base !px-8 !py-3.5">Start as an artist</a>
            <a href="/login" className="btn-outline text-base !px-8 !py-3.5">Start as a creator</a>
          </div>
          <p className="text-muted text-xs mt-4">5% platform fee. No upfront costs.</p>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="py-10 text-center text-muted text-sm border-t border-white/5">
        <p>sendmusic.io · CPM marketplace for music promotion</p>
        <p className="mt-1">Built by artists, for artists and creators.</p>
      </footer>
    </>
  );
}
