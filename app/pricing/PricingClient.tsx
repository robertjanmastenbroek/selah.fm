'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

function formatMoney(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + Math.floor(n / 1000) + 'K';
  return '$' + n.toFixed(0);
}

export default function PricingClient() {
  const t = useTranslations('pricing');
  const th = useTranslations('home');
  const [views, setViews] = useState(10000);
  const [cpmDollars, setCpmDollars] = useState(1);

  const grossEarnings = (views / 1000) * cpmDollars;
  const creatorEarnings = grossEarnings * 0.8;
  const platformFee = grossEarnings * 0.2;

  const presets = [
    { label: '1K', value: 1000 },
    { label: '10K', value: 10000 },
    { label: '100K', value: 100000 },
    { label: '1M', value: 1000000 },
  ];

  const cpmPresets = [0.50, 1, 2, 5, 10, 25];

  const closestPreset = useMemo(() =>
    presets.reduce((prev, curr) =>
      Math.abs(curr.value - views) < Math.abs(prev.value - views) ? curr : prev
    ), [views]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-indigo-500/[0.03] border border-indigo-500/10 p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t('calculatorTitle')}</h3>
          <p className="text-xs text-muted-foreground/60">{t('calculatorDesc')}</p>
        </div>
      </div>

      {/* CPM selector */}
      <div className="mb-6">
        <label className="text-xs text-muted-foreground/60 mb-2 block">{t('yourCpmRate')}</label>
        <div className="flex flex-wrap gap-2">
          {cpmPresets.map(cpm => (
            <button key={cpm} onClick={() => setCpmDollars(cpm)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                cpmDollars === cpm
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
              }`}>
              ${cpm.toFixed(cpm < 1 ? 2 : 0)}
            </button>
          ))}
        </div>
      </div>

      {/* Views slider */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs text-muted-foreground/60">{th('estimatedViews')}</span>
          <span className="text-lg font-bold text-white">
            {views >= 1_000_000 ? `${(views / 1_000_000).toFixed(1)}M` : views >= 1000 ? `${(views / 1000).toFixed(0)}K` : views.toLocaleString()}
          </span>
        </div>
        <input
          type="range" min={100} max={5_000_000} step={100} value={views}
          onChange={(e) => setViews(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-white/[0.08] cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[#4338CA] [&::-webkit-slider-thumb]:to-[#6366F1]
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
          style={{ background: `linear-gradient(to right, rgba(99,102,241,0.6) ${(views / 5_000_000) * 100}%, rgba(255,255,255,0.08) ${(views / 5_000_000) * 100}%)` }}
          aria-label={th('estimatedViews')}
          aria-valuenow={views}
          aria-valuetext={`${views.toLocaleString()} views`}
        />
        <div className="flex justify-between mt-2">
          {presets.map((p) => (
            <button key={p.label} onClick={() => setViews(p.value)}
              className={`text-[10px] px-3 py-1 rounded-full transition-all ${
                closestPreset.value === p.value ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-muted-foreground/30 hover:text-muted-foreground/60'
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-1">{t('gross')}</p>
          <p className="text-lg font-bold text-white">{formatMoney(grossEarnings)}</p>
          <p className="text-[9px] text-muted-foreground/30 mt-1">{t('perThousandViews')}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-1">{t('creatorEarns')}</p>
          <p className="text-lg font-bold text-emerald-400">{formatMoney(creatorEarnings)}</p>
          <p className="text-[9px] text-emerald-400/50 mt-1">80%</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 text-center">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-1">{t('platformFee')}</p>
          <p className="text-lg font-bold text-amber-400">{formatMoney(platformFee)}</p>
          <p className="text-[9px] text-amber-400/50 mt-1">20%</p>
        </div>
      </div>

      {cpmDollars >= 10 && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400/80 text-center">
          💎 {t('atCpm', { cpm: cpmDollars.toFixed(2), cpm80: (cpmDollars * 0.8).toFixed(2), multiplier: ((cpmDollars * 0.8) / 0.03).toFixed(0) })}
        </div>
      )}
    </div>
  );
}
