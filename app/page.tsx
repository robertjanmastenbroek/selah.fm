'use client';

import { useState } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'musician' | 'creator'>('musician');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      {/* ---- Nav ---- */}
      <nav className="border-b border-white/5 sticky top-0 bg-void/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display text-gold text-xl tracking-wide">sendmusic.io</span>
          <a href="#waitlist" className="btn-gold text-sm !py-2 !px-5">Join early access</a>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="font-display text-4xl md:text-6xl text-ivory leading-tight mb-6">
          Get your music heard.<br />
          <span className="text-gold">Only pay for real views.</span>
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10">
          A performance-based marketplace connecting musicians with creators.
          Upload your track, set a CPM rate, and pay only when verified views happen.
          No bots. No pay-per-submit. No wasted budget.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="#how-it-works" className="btn-outline">How it works</a>
          <a href="#waitlist" className="btn-gold">Get early access</a>
        </div>

        {/* Trust bar */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto text-center text-text-muted text-sm">
          <div>
            <div className="text-gold text-2xl font-bold mb-1">CPM</div>
            <div>Pay per 1,000 verified views</div>
          </div>
          <div>
            <div className="text-gold text-2xl font-bold mb-1">5%</div>
            <div>Platform fee only</div>
          </div>
          <div>
            <div className="text-gold text-2xl font-bold mb-1">Real</div>
            <div>API-verified views only</div>
          </div>
        </div>
      </section>

      {/* ---- Two-column value props ---- */}
      <section className="border-y border-white/5 bg-void-light/50">
        <div className="max-w-5xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12">
          {/* Musician side */}
          <div className="bg-void border border-white/10 rounded-2xl p-8">
            <div className="text-gold text-sm font-semibold uppercase tracking-wider mb-3">For Musicians</div>
            <h2 className="font-display text-2xl text-ivory mb-4">Stop paying for fake streams.</h2>
            <ul className="space-y-4 text-text-muted text-sm mb-8">
              {[
                'Set your own CPM rate — you decide what a view is worth',
                'Upload your track + cover art + 30-second clip',
                'Creators apply to promote your music',
                'Only pay when views are verified via platform APIs',
                'Full analytics dashboard: views, spend, ROI',
              ].map((item) => (
                <li key={item} className="flex gap-3 items-start">
                  <span className="text-gold mt-0.5 flex-shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
            <a href="#waitlist" onClick={() => setType('musician')} className="btn-gold w-full text-center block">
              Join as a musician
            </a>
          </div>

          {/* Creator side */}
          <div className="bg-void border border-white/10 rounded-2xl p-8">
            <div className="text-gold text-sm font-semibold uppercase tracking-wider mb-3">For Creators</div>
            <h2 className="font-display text-2xl text-ivory mb-4">Get paid for the content you already make.</h2>
            <ul className="space-y-4 text-text-muted text-sm mb-8">
              {[
                'Browse available music campaigns',
                'Pick tracks you actually like — authentic content wins',
                'Create TikToks, Reels, Shorts with the music',
                'Submit your content links for verification',
                'Get paid automatically when views hit thresholds',
              ].map((item) => (
                <li key={item} className="flex gap-3 items-start">
                  <span className="text-gold mt-0.5 flex-shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
            <a href="#waitlist" onClick={() => setType('creator')} className="btn-outline w-full text-center block">
              Join as a creator
            </a>
          </div>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="font-display text-3xl text-center text-ivory mb-16">How it works</h2>

        {/* Musician flow */}
        <div className="mb-16">
          <h3 className="text-gold text-sm font-semibold uppercase tracking-wider mb-6 text-center">Musician flow</h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Create campaign', desc: 'Set budget, CPM rate, upload your track' },
              { step: '2', title: 'Deposit funds', desc: 'Secure escrow via Stripe Connect' },
              { step: '3', title: 'Approve creators', desc: 'Review and accept creator applications' },
              { step: '4', title: 'Content goes live', desc: 'Creators post TikToks/Reels with your music' },
              { step: '5', title: 'Pay for views', desc: 'Auto-payout when verified views hit thresholds' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto mb-3 font-bold text-sm">
                  {s.step}
                </div>
                <div className="font-semibold text-ivory text-sm mb-1">{s.title}</div>
                <div className="text-text-muted text-xs leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator flow */}
        <div>
          <h3 className="text-gold text-sm font-semibold uppercase tracking-wider mb-6 text-center">Creator flow</h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Link accounts', desc: 'Connect TikTok, Instagram, YouTube' },
              { step: '2', title: 'Browse campaigns', desc: 'Find tracks that fit your content style' },
              { step: '3', title: 'Create content', desc: 'Make videos with the music you picked' },
              { step: '4', title: 'Submit links', desc: 'Share your content URLs for verification' },
              { step: '5', title: 'Earn CPM', desc: 'Get paid automatically as views accumulate' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto mb-3 font-bold text-sm">
                  {s.step}
                </div>
                <div className="font-semibold text-ivory text-sm mb-1">{s.title}</div>
                <div className="text-text-muted text-xs leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Why different ---- */}
      <section className="border-y border-white/5 bg-void-light/50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-3xl text-center text-ivory mb-12">Why this is different</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 pr-4 text-text-muted font-normal">Existing tools</th>
                  <th className="text-left py-3 px-4 text-gold font-display text-base">sendmusic.io</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Pay per submission — no guarantee', 'Pay per performance — only when views happen'],
                  ['Curators are anonymous', 'Creators have verified social accounts'],
                  ['Bots and fake streams possible', 'Views verified via platform APIs'],
                  ['Fragmented tools', 'All-in-one marketplace'],
                  ['Fixed pricing', 'You set your own CPM rate'],
                ].map(([old, nw]) => (
                  <tr key={old}>
                    <td className="py-4 pr-4 text-text-muted">{old}</td>
                    <td className="py-4 px-4 text-ivory">{nw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---- Waitlist ---- */}
      <section id="waitlist" className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-3xl text-ivory mb-4">Early access</h2>
        <p className="text-text-muted mb-8">
          We're onboarding 10 musicians and 50 creators for the pilot. First come, first served.
        </p>

        {submitted ? (
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-8">
            <div className="text-3xl mb-3">🎵</div>
            <div className="font-display text-xl text-gold mb-2">You're on the list</div>
            <p className="text-text-muted text-sm">
              We'll reach out when early access opens. First cohort starts soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 justify-center mb-4">
              {(['musician', 'creator'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${type === t
                      ? 'bg-gold text-void'
                      : 'bg-white/5 text-text-muted hover:text-ivory'
                    }`}
                >
                  {t === 'musician' ? '🎸 Musician' : '📱 Creator'}
                </button>
              ))}
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-ivory
                         placeholder:text-text-muted focus:outline-none focus:border-gold/50"
            />
            <button type="submit" className="btn-gold w-full">
              Join the waitlist as a {type}
            </button>
            <p className="text-text-muted text-xs">No spam. One email when we launch.</p>
          </form>
        )}
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-white/5 py-8 text-center text-text-muted text-sm">
        <p>sendmusic.io · A CPM marketplace for real music promotion</p>
        <p className="mt-1">Built by a musician, for musicians and creators.</p>
      </footer>
    </>
  );
}
