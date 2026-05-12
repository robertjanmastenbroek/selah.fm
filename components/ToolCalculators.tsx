'use client';

import { useState } from 'react';

// ── CPM Calculator ────────────────────────────────────────────────

export function CpmCalculator({ avgCpm }: { avgCpm: number }) {
  const [budget, setBudget] = useState(50);
  const [mode, setMode] = useState<'budget'|'views'>('budget');
  const [desiredViews, setDesiredViews] = useState(10000);

  const cpmCents = Math.round(avgCpm * 100);
  const estimatedViews = cpmCents > 0 ? Math.round((budget * 100) / cpmCents) : 0;
  const estimatedBudget = cpmCents > 0 ? ((desiredViews * cpmCents) / 100) : 0;

  const platformRates = [
    { platform: 'TikTok Creator Fund', cpm: 0.02, note: '~$0.02–0.04 per 1,000 views' },
    { platform: 'YouTube Partner', cpm: 2.50, note: '~$1–5 per 1,000 views (varies by niche)' },
    { platform: 'Instagram Reels Bonus', cpm: 0.50, note: '~$0.10–1.00 per 1,000 views (invite only)' },
    { platform: 'Selah.fm Marketplace', cpm: avgCpm, note: `Artists set rates — current average $${avgCpm.toFixed(2)}`, highlight: true },
  ];

  return (
    <div className="space-y-8">
      {/* Comparison table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="font-semibold">CPM Rate Comparison</h2>
          <p className="text-xs text-muted-foreground mt-1">What platforms pay creators per 1,000 views</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {platformRates.map((p, i) => (
            <div key={i} className={`flex items-center justify-between p-4 ${p.highlight ? 'bg-primary/[0.06]' : ''}`}>
              <div>
                <span className="text-sm font-medium">{p.platform}</span>
                {p.highlight && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">Live data</span>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.note}</p>
              </div>
              <span className={`text-lg font-bold ${p.highlight ? 'text-primary' : 'text-foreground'}`}>
                ${p.cpm.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive calculator */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-6">
        <h2 className="font-semibold">Earnings Calculator</h2>
        
        {/* Mode toggle */}
        <div className="flex rounded-lg bg-white/[0.04] p-0.5">
          <button onClick={() => setMode('budget')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${mode === 'budget' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            Budget → Views
          </button>
          <button onClick={() => setMode('views')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${mode === 'views' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            Views → Budget
          </button>
        </div>

        {mode === 'budget' ? (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Campaign budget</span>
                <span className="font-bold">${budget}</span>
              </div>
              <input type="range" min={5} max={500} step={5} value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>$5</span><span>$500</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary/[0.06] border border-primary/10 text-center">
              <p className="text-2xl font-bold">{estimatedViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">estimated views at ${avgCpm.toFixed(2)} CPM</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Desired views</span>
                <span className="font-bold">{desiredViews.toLocaleString()}</span>
              </div>
              <input type="range" min={1000} max={100000} step={1000} value={desiredViews} onChange={e => setDesiredViews(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1K</span><span>100K</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary/[0.06] border border-primary/10 text-center">
              <p className="text-2xl font-bold">${estimatedBudget.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">estimated budget at ${avgCpm.toFixed(2)} CPM</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Creator Earnings Estimator ────────────────────────────────────

export function CreatorEarningsEstimator({ avgCpm }: { avgCpm: number }) {
  const [viewsPerVideo, setViewsPerVideo] = useState(5000);
  const [videosPerMonth, setVideosPerMonth] = useState(10);

  const totalViews = viewsPerVideo * videosPerMonth;
  const selahEarnings = (totalViews / 1000) * avgCpm;
  const tiktokEarnings = (totalViews / 1000) * 0.03;
  const youtubeEarnings = (totalViews / 1000) * 2.50;

  return (
    <div className="space-y-8">
      {/* Interactive estimator */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-6">
        <h2 className="font-semibold">Monthly Earnings Estimator</h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Avg views per video</span>
              <span className="font-bold">{viewsPerVideo.toLocaleString()}</span>
            </div>
            <input type="range" min={500} max={50000} step={500} value={viewsPerVideo} onChange={e => setViewsPerVideo(Number(e.target.value))} className="w-full accent-primary" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Videos per month</span>
              <span className="font-bold">{videosPerMonth}</span>
            </div>
            <input type="range" min={1} max={30} step={1} value={videosPerMonth} onChange={e => setVideosPerMonth(Number(e.target.value))} className="w-full accent-primary" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.04] text-center space-y-2">
          <p className="text-xs text-muted-foreground">{totalViews.toLocaleString()} total views/month</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-primary/[0.06] border border-primary/10">
              <p className="text-lg font-bold text-primary">${selahEarnings.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Selah.fm</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.04]">
              <p className="text-lg font-bold text-foreground/70">${youtubeEarnings.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">YouTube</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.04]">
              <p className="text-lg font-bold text-foreground/70">${tiktokEarnings.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">TikTok Fund</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            {selahEarnings > youtubeEarnings ? (
              <>Selah.fm pays <span className="text-primary font-medium">{((selahEarnings / Math.max(youtubeEarnings, 0.01)) - 1).toFixed(0)}x more</span> than YouTube for the same views</>
            ) : (
              <>Results vary by campaign CPM. Higher-quality content can earn higher rates.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Promotion Budget Planner ──────────────────────────────────────

export function PromotionBudgetPlanner({ avgCpm }: { avgCpm: number }) {
  const [budget, setBudget] = useState(50);

  const cpmCents = Math.round(avgCpm * 100);
  const estimatedViews = cpmCents > 0 ? Math.round((budget * 100) / cpmCents) : 0;

  const tiers = [
    { budget: 10, views: cpmCents > 0 ? Math.round((10 * 100) / cpmCents) : 0 },
    { budget: 25, views: cpmCents > 0 ? Math.round((25 * 100) / cpmCents) : 0 },
    { budget: 50, views: cpmCents > 0 ? Math.round((50 * 100) / cpmCents) : 0 },
    { budget: 100, views: cpmCents > 0 ? Math.round((100 * 100) / cpmCents) : 0 },
    { budget: 250, views: cpmCents > 0 ? Math.round((250 * 100) / cpmCents) : 0 },
    { budget: 500, views: cpmCents > 0 ? Math.round((500 * 100) / cpmCents) : 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Budget tiers */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="font-semibold">What Your Budget Buys</h2>
          <p className="text-xs text-muted-foreground mt-1">Estimated views at ${avgCpm.toFixed(2)} CPM</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-white/[0.04]">
          {tiers.map((t, i) => (
            <div key={i} className="p-4 text-center">
              <p className="text-xl font-bold">${t.budget}</p>
              <p className="text-lg text-primary font-semibold">{t.views.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">views</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive slider */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-6">
        <h2 className="font-semibold">Custom Budget Calculator</h2>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Your budget</span>
            <span className="font-bold text-lg">${budget}</span>
          </div>
          <input type="range" min={5} max={1000} step={5} value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full accent-primary" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>$5</span><span>$1,000</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-primary/[0.06] border border-primary/10 text-center">
          <p className="text-3xl font-bold">{estimatedViews.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">estimated verified views</p>
          <p className="text-[10px] text-muted-foreground mt-2">
            That's {Math.round(estimatedViews / Math.max(budget, 1)).toLocaleString()} views per dollar spent
          </p>
        </div>
      </div>

      {/* Industry context */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
        <h2 className="font-semibold mb-3">How This Compares</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Facebook Ads (music niche)</span>
            <span>~$0.01–0.05 per click</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TikTok Spark Ads</span>
            <span>~$0.02–0.06 per view</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Playlist pitching services</span>
            <span>$50–500 per placement</span>
          </div>
          <div className="flex justify-between text-primary">
            <span>Selah.fm creators</span>
            <span className="font-semibold">${avgCpm.toFixed(2)} per 1,000 verified views</span>
          </div>
        </div>
      </div>
    </div>
  );
}
