'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setLoggedIn(true);
    });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="page-container pt-12 md:pt-20 pb-12 md:pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Get your music<br /><span className="text-amber-600">promoted</span> by real creators.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
              Set any budget from $5. Creators make TikToks, Reels, and Shorts with your track.
              You approve every video. Pay only for verified views.
            </p>
            <div className="flex gap-3 pt-2">
              {loggedIn ? (
                <Button size="lg" onClick={() => window.location.href = '/browse'}>Go to Discover</Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => window.location.href = '/login'}>Get started</Button>
                  <Button size="lg" variant="outline" onClick={() => window.location.href = '/browse'}>Browse campaigns</Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">No upfront costs. Fees: 20% → 15% → 10% as you scale.</p>
          </div>
          <div className="hidden md:block">
            <img src="/images/hero-illustration.png" alt="SendMusic.io" className="w-full rounded-2xl shadow-sm" />
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="page-container !pt-10 !pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[ { num: '$0.10', label: 'Minimum CPM' }, { num: '$5', label: 'Minimum budget' }, { num: 'CPM', label: 'You set the rate' }, { num: 'You', label: 'Approve every video' } ].map(({ num, label }) => (
              <div key={label}><p className="text-2xl font-bold text-amber-600">{num}</p><p className="text-sm text-muted-foreground mt-1">{label}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">Simple as posting a TikTok.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[ { step: '01', title: 'Set your price', desc: 'Upload your track. Set CPM and budget. Campaign goes live.' }, { step: '02', title: 'Creators post', desc: 'Creators browse, pick your track, make TikToks and Reels.' }, { step: '03', title: 'Pay for views', desc: 'Approve content. Views verified. Creators paid automatically.' } ].map(s => (
            <div key={s.step} className="text-center">
              <p className="text-amber-600 text-xs font-bold tracking-widest mb-3">{s.step}</p>
              <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 py-16 md:py-24">
        <div className="page-container !pt-16 !pb-16">
          <h2 className="text-3xl font-bold text-center mb-4">One fee. It shrinks as you grow.</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">No subscription. One platform fee on payouts.</p>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[ { volume: '$0–$500', fee: '20%', desc: 'Getting started.' }, { volume: '$500–$2K', fee: '15%', desc: 'Growing.' }, { volume: '$2,000+', fee: '10%', desc: 'Scaling.' } ].map((t, i) => (
              <Card key={i} className="text-center"><CardContent className="p-6">
                <p className="text-muted-foreground text-sm mb-2">Monthly spend</p>
                <p className="font-semibold text-lg mb-1">{t.volume}</p>
                <p className="text-4xl font-bold text-amber-600 mb-2">{t.fee}</p>
                <p className="text-muted-foreground text-sm">{t.desc}</p>
              </CardContent></Card>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-16 md:py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get your music heard?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Start with $5. No upfront costs.</p>
        <div className="flex gap-3 justify-center">
          {loggedIn ? (
            <Button size="lg" onClick={() => window.location.href = '/browse'}>Go to Discover</Button>
          ) : (
            <>
              <Button size="lg" onClick={() => window.location.href = '/login'}>Get started</Button>
              <Button size="lg" variant="outline" onClick={() => window.location.href = '/login'}>I&apos;m a creator</Button>
            </>
          )}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-muted-foreground text-xs">
        <p>SendMusic.io · CPM marketplace for music promotion</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/tos" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        </div>
      </footer>
    </main>
  );
}
