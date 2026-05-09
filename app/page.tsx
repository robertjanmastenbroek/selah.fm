'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  const [calcViews, setCalcViews] = useState('10000');
  const [calcCpm, setCalcCpm] = useState('2');

  const earnings = Math.round(((parseInt(calcViews) || 0) / 1000) * (parseFloat(calcCpm) || 0) * 0.8);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Hero — dual audience ── */}
      <section className="relative overflow-hidden">
        <div className="page-container py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              Early access — join 200+ artists already running campaigns
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Get your music<br />
              <span className="text-accent-foreground">heard.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-2">
              Real creators. Real views. Real results.
            </p>
            <p className="text-sm text-muted-foreground/60 max-w-md mx-auto mb-8">
              CPM = cost per 1,000 verified views. You set your rate, review every video, and only pay for what actually gets watched.
            </p>
          </div>

          {/* Dual CTA cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
            <Card className="text-center p-8 border-accent/20">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-3">I&apos;m an artist</p>
              <h3 className="text-xl font-bold mb-2">Promote your music</h3>
              <p className="text-sm text-muted-foreground mb-6">Set a budget, pick your CPM rate, and creators will make content for your track. You review and approve every video.</p>
              <Link href="/dashboard"><Button size="lg" className="w-full">Start a campaign</Button></Link>
              <p className="text-xs text-muted-foreground mt-2">Free to start · $5 minimum budget</p>
            </Card>
            <Card className="text-center p-8">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-3">I&apos;m a creator</p>
              <h3 className="text-xl font-bold mb-2">Get paid to post</h3>
              <p className="text-sm text-muted-foreground mb-6">Browse music campaigns, pick tracks you love, create TikToks/Reels/Shorts, and earn money for every verified view.</p>
              <Link href="/browse"><Button size="lg" variant="secondary" className="w-full">Browse campaigns</Button></Link>
              <p className="text-xs text-muted-foreground mt-2">Free to join · 80% of CPM goes to you</p>
            </Card>
          </div>

          {/* Social proof stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
            {[
              { value: '200+', label: 'Artists' },
              { value: '400+', label: 'Creators' },
              { value: '12K+', label: 'Videos created' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold text-accent-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — visual ── */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="page-container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Create a campaign', desc: 'Upload your track, set a CPM rate and budget. Add hashtags and requirements for creators.' },
              { step: '02', title: 'Creators make content', desc: 'Creators browse your campaign, make TikToks, Reels, or Shorts with your track, and submit their links.' },
              { step: '03', title: 'Approve & pay for views', desc: 'Review every submission. Approve the ones you like. Pay only for verified views. Max payout cap keeps your budget safe.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="text-4xl font-bold text-accent-foreground/20 mb-3">{s.step}</div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Creator earnings calculator ── */}
      <section className="py-16 md:py-24">
        <div className="page-container max-w-md mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">What can you earn?</h2>
          <p className="text-muted-foreground text-sm mb-8">Estimate your earnings as a creator.</p>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Views per video</label>
                <Input type="number" value={calcViews} onChange={e => setCalcViews(e.target.value)} min="1000" step="1000" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Campaign CPM ($)</label>
                <Input type="number" value={calcCpm} onChange={e => setCalcCpm(e.target.value)} min="0.1" step="0.5" />
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground">Estimated earnings</div>
                <div className="text-3xl font-bold text-accent-foreground mt-1">${earnings}</div>
                <div className="text-xs text-muted-foreground mt-1">After 20% platform fee</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Post 3 videos averaging {parseInt(calcViews).toLocaleString()} views at ${calcCpm} CPM = <strong>${earnings * 3}</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Fee transparency ── */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="page-container">
          <div className="text-center max-w-lg mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Simple, transparent fees.</h2>
            <p className="text-muted-foreground">20% platform fee on creator payouts. No hidden costs. Like Fiverr — creators build the fee into their rates.</p>
          </div>
          <div className="max-w-md mx-auto">
            <Card className="text-center">
              <CardContent className="p-8 space-y-5">
                <div>
                  <p className="text-sm text-muted-foreground">Artist budget</p>
                  <p className="text-4xl font-bold">$500</p>
                </div>
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm">20% platform fee</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creator earns</p>
                  <p className="text-4xl font-bold text-accent-foreground">$400</p>
                </div>
                <p className="text-xs text-muted-foreground">Stripe processing (2.9% + $0.30) on deposits. Artists pay exactly what they budget.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24">
        <div className="page-container max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How do I know the views are real?', a: 'We verify views through platform APIs (TikTok, Instagram, YouTube). No bots, no fake streams. You can see the view count on every approved submission — and you only pay for verified views.' },
              { q: 'What happens if the submissions are bad?', a: 'You review every video before approving it. You set requirements (minimum length, style, tone) upfront. If a submission doesn\'t meet your standards, reject it — you don\'t pay a cent.' },
              { q: 'How do creators get paid?', a: 'Creators connect their bank account or debit card via Stripe. Payouts process automatically when their submission is approved and views reach the payout threshold.' },
              { q: 'What platforms can creators post on?', a: 'Currently: TikTok, Instagram Reels, and YouTube Shorts. More platforms coming soon. You choose which platforms your campaign runs on.' },
              { q: 'Is there a minimum follower count to join?', a: 'No minimum. We believe small creators can drive big results. Campaign budgets and CPM rates are visible upfront — you decide which campaigns are worth your time.' },
              { q: 'What\'s the minimum budget to start?', a: '$5. That\'s it. Test the platform with a micro-campaign and scale up once you see results.' },
            ].map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="bg-muted/30 py-16 md:py-20 text-center">
        <div className="page-container">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get your music heard?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Join 200+ artists already running campaigns on Selah.fm. Real creators, real views, real results.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/dashboard"><Button size="lg">Start a campaign</Button></Link>
            <Link href="/browse"><Button size="lg" variant="secondary">Browse campaigns</Button></Link>
          </div>
          <div className="mt-12 flex gap-6 justify-center text-xs text-muted-foreground">
            <Link href="/tos" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/creators" className="hover:text-foreground">Creators</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
