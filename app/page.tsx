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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 to-transparent pointer-events-none" />
        <div className="page-container relative pt-16 md:pt-28 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Now in beta
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                  Your music,<br />
                  <span className="text-amber-600">promoted by real creators.</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Set any budget from $5. Creators make TikToks, Reels, and Shorts with your track. You approve every video. Pay only for verified views.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {loggedIn ? (
                  <Button size="lg" className="text-base h-12 px-8" onClick={() => window.location.href = '/browse'}>
                    Go to Discover
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="text-base h-12 px-8" onClick={() => window.location.href = '/login'}>
                      Get started — it's free
                    </Button>
                    <Button size="lg" variant="outline" className="text-base h-12 px-8" onClick={() => window.location.href = '/browse'}>
                      Browse campaigns
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="text-amber-600">✓</span> No upfront costs</span>
                <span className="flex items-center gap-1.5"><span className="text-amber-600">✓</span> Pay per view</span>
                <span className="flex items-center gap-1.5"><span className="text-amber-600">✓</span> You approve</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <img src="/images/hero-illustration.png" alt="Selah.fm — music promotion marketplace" 
                className="w-full rounded-2xl shadow-2xl shadow-black/5 ring-1 ring-black/5" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="page-container !py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '$0.10', label: 'Minimum CPM' },
              { num: '$5', label: 'Minimum budget' },
              { num: 'CPM', label: 'You set the rate' },
              { num: 'You', label: 'Approve every video' },
            ].map(({ num, label }) => (
              <div key={label} className="space-y-1">
                <p className="text-3xl font-bold text-amber-600 tracking-tight">{num}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="page-container py-20 md:py-28">
        <div className="text-center max-w-lg mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How it works</h2>
          <p className="text-muted-foreground text-lg">Set your terms. Creators post. You approve. They get paid.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { step: '01', title: 'Create a campaign', desc: 'Upload your track, set a CPM rate and budget. Choose platforms, add hashtags, and set creator requirements.' },
            { step: '02', title: 'Creators make content', desc: 'Creators discover your campaign, create TikToks, Reels, or Shorts with your music, and submit their links.' },
            { step: '03', title: 'Review & pay', desc: 'You review every submission. Approve the ones you like. Creators get paid automatically for verified views.' },
          ].map(s => (
            <div key={s.step} className="text-center group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 text-sm font-bold group-hover:bg-amber-100 transition-colors">
                {s.step}
              </div>
              <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiered fees */}
      <section className="bg-muted/30 py-20 md:py-28">
        <div className="page-container">
          <div className="text-center max-w-lg mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">One fee. It shrinks as you grow.</h2>
            <p className="text-muted-foreground text-lg">No subscription. No hidden costs. One platform fee on payouts.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { volume: '$0–$500', fee: '20%', desc: 'Getting started. Test your first campaigns with minimal risk.' },
              { volume: '$500–$2K', fee: '15%', desc: 'Scaling up. Run regular campaigns with more creators.' },
              { volume: '$2,000+', fee: '10%', desc: 'Full scale. Maximum volume at the lowest rate.' },
            ].map((t, i) => (
              <Card key={i} className={`relative overflow-hidden ${i === 1 ? 'ring-2 ring-amber-500 shadow-lg' : ''}`}>
                {i === 1 && <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />}
                <CardContent className="p-8 text-center space-y-4">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Monthly spend</p>
                  <p className="text-2xl font-bold">{t.volume}</p>
                  <p className="text-5xl font-bold text-amber-600 tracking-tight">{t.fee}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="page-container py-20 md:py-28 text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to get your music heard?</h2>
          <p className="text-muted-foreground text-lg">Start with $5. Pay only when you approve content.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {loggedIn ? (
              <Button size="lg" className="text-base h-12 px-8" onClick={() => window.location.href = '/browse'}>
                Go to Discover
              </Button>
            ) : (
              <>
                <Button size="lg" className="text-base h-12 px-8" onClick={() => window.location.href = '/login'}>
                  Get started — it's free
                </Button>
                <Button size="lg" variant="outline" className="text-base h-12 px-8" onClick={() => window.location.href = '/login'}>
                  I'm a creator
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="page-container !py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <p className="font-semibold">Selah<span className="text-amber-600">.fm</span></p>
              <p className="text-sm text-muted-foreground">CPM marketplace for music promotion</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/browse" className="hover:text-foreground transition-colors">Discover</Link>
              <Link href="/tos" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
