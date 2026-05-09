'use client';

export default function LandingPage() {
  return (
    <>
      {/* ---- Nav ---- */}
      <nav className="border-b border-white/5 sticky top-0 bg-void/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display text-gold text-xl tracking-wide">SendMusic.io</span>
          <a href="/login" className="btn-gold text-sm !py-2 !px-5">Get started</a>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="max-w-6xl mx-auto px-4 pt-16 md:pt-28 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-6xl text-ivory leading-tight mb-4">
              Get your music<br />
              <span className="text-gold">promoted. Get views. Get paid.</span>
            </h1>
            <p className="text-lg text-muted leading-relaxed mb-8 max-w-md">
              The marketplace where artists set the price and creators earn for every view.
              TikTok, Reels, Shorts — your music, their audience.
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
          <div className="hidden md:block">
            <img src="/images/hero-illustration.png" alt="SendMusic.io — music promotion marketplace" className="rounded-2xl w-full h-auto" />
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

      {/* ---- How it works — Vyro-style 3 steps ---- */}
      <section className="border-y border-white/5 bg-void-elevated/30 py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-3xl text-center text-ivory mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Set your price', desc: 'Upload your track. Set CPM rate and max payout. Deposit your budget. Campaign goes live.', icon: '🎯' },
              { step: '02', title: 'Creators post', desc: 'Creators browse, pick your track, and make TikToks and Reels. They submit links for review.', icon: '📱' },
              { step: '03', title: 'Pay for views', desc: 'You approve content you like. Views are verified. Creators get paid automatically.', icon: '💰' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-4xl mb-4">{s.icon}</div>
                <div className="text-gold text-xs font-bold tracking-widest mb-3">{s.step}</div>
                <div className="font-display text-xl text-ivory mb-3">{s.title}</div>
                <div className="text-muted text-sm leading-relaxed">{s.desc}</div>
              </div>
            ))}
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
          <div>
            <img src="/images/dashboard-mockup.png" alt="Artist campaign dashboard" className="rounded-2xl w-full h-auto" />
          </div>
        </div>
      </section>

      {/* ---- Earnings visual ---- */}
      <section className="border-y border-white/5 bg-void-elevated/30 py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <img src="/images/earnings-visual.png" alt="Creator earnings growth" className="rounded-2xl w-full h-auto" />
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

      {/* ---- Creator earnings ---- */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-3xl text-center text-ivory mb-4">Creators earning on SendMusic.io</h2>
          <p className="text-muted text-center mb-12 max-w-md mx-auto">Real payouts. Real views. No bots.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Mia J.', handle: '@creatormia', earned: '$189', vids: '12', platform: 'TikTok' },
              { name: 'Jake M.', handle: '@dancewithjake', earned: '$142', vids: '8', platform: 'Instagram' },
              { name: 'Sarah K.', handle: '@viralqueen', earned: '$257', vids: '15', platform: 'TikTok' },
            ].map((c) => (
              <div key={c.handle} className="card text-center !p-6">
                <div className="text-2xl mb-2">🎬</div>
                <div className="font-display text-xl text-gold mb-1">{c.earned}</div>
                <div className="text-ivory font-semibold text-sm mb-1">{c.name}</div>
                <div className="text-muted text-xs">{c.vids} videos · {c.platform}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Why different ---- */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-3xl text-center text-ivory mb-4">Why SendMusic.io</h2>
          <p className="text-muted text-center mb-12 max-w-md mx-auto">
            Built for music. Not general content promotion.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 pr-4 text-muted font-normal">Other platforms</th>
                  <th className="text-left py-4 px-4 text-gold font-display text-base">SendMusic.io</th>
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
        <p>SendMusic.io · CPM marketplace for music promotion</p>
        <p className="mt-1">Built by artists, for artists and creators.</p>
      </footer>
    </>
  );
}
