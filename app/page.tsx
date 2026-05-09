'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setLoggedIn(true);
    });
  }, []);

  if (loggedIn) {
    if (typeof window !== 'undefined') window.location.href = '/browse';
    return null;
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="page-container pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-6xl text-text leading-tight mb-6 tracking-tight">
            Get your music <span className="text-gold">promoted</span> by real creators.
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-lg">
            Set any budget from $5. Creators make TikToks, Reels, and Shorts with your track. 
            You approve every video. Pay only for verified views.
          </p>
          <div className="flex gap-3">
            <a href="/login" className="btn-primary text-base !px-8 !py-3.5">Get started</a>
            <a href="/browse" className="btn-secondary text-base !px-8 !py-3.5">Browse campaigns</a>
          </div>
          <p className="text-text-muted text-sm mt-4">No upfront costs. Fees: 20% → 15% → 10% as you scale.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border-light bg-bg-secondary">
        <div className="page-container !pt-12 !pb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '$0.10', label: 'Minimum CPM' },
              { num: '$5', label: 'Minimum budget' },
              { num: 'CPM', label: 'You set the rate' },
              { num: 'You', label: 'Approve every video' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="font-display text-2xl md:text-3xl text-gold mb-1">{num}</div>
                <div className="text-text-muted text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="page-container py-16 md:py-24">
        <h2 className="section-title text-center mb-4">How it works</h2>
        <p className="text-text-muted text-center mb-12 max-w-md mx-auto">Simple as posting a TikTok. Set your terms. Creators earn for views.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Set your price', desc: 'Upload your track. Set CPM and budget. Campaign goes live.' },
            { step: '02', title: 'Creators post', desc: 'Creators browse, pick your track, make TikToks and Reels. They submit links.' },
            { step: '03', title: 'Pay for views', desc: 'Approve content you like. Views verified. Creators paid automatically.' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="text-gold text-xs font-bold tracking-widest mb-3">{s.step}</div>
              <div className="font-display text-xl text-text mb-3">{s.title}</div>
              <div className="text-text-muted text-sm leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tiered fees */}
      <section className="bg-bg-secondary py-16 md:py-24">
        <div className="page-container !pt-16 !pb-16">
          <h2 className="section-title text-center mb-4">One fee. It shrinks as you grow.</h2>
          <p className="text-text-muted text-center mb-12 max-w-md mx-auto">No subscription. One platform fee on payouts.</p>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { volume: '$0–$500', fee: '20%', desc: 'Getting started. Test campaigns.' },
              { volume: '$500–$2K', fee: '15%', desc: 'Growing. Regular campaigns.' },
              { volume: '$2,000+', fee: '10%', desc: 'Scaling. Lowest fee.' },
            ].map((t, i) => (
              <div key={i} className="card p-6 text-center">
                <div className="text-text-muted text-sm mb-2">Monthly spend</div>
                <div className="text-text font-semibold text-lg mb-1">{t.volume}</div>
                <div className="font-display text-3xl text-gold mb-2">{t.fee}</div>
                <div className="text-text-muted text-sm">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="page-container py-16 md:py-24 text-center">
        <h2 className="section-title mb-4">Ready to get your music heard?</h2>
        <p className="text-text-muted mb-8 max-w-md mx-auto">Start with $5. No upfront costs. Only pay when you approve content.</p>
        <div className="flex gap-3 justify-center">
          <a href="/login" className="btn-primary text-base !px-8 !py-3.5">Get started</a>
          <a href="/login" className="btn-secondary text-base !px-8 !py-3.5">I'm a creator</a>
        </div>
      </section>

      <footer className="border-t border-border-light py-8 text-center text-text-muted text-xs">
        <p>SendMusic.io · CPM marketplace for music promotion</p>
      </footer>
    </main>
  );
}
