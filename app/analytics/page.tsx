'use client';

import { useState } from 'react';
import TopNav from '@/components/TopNav';

export default function AnalyticsPage() {
  const [connected, setConnected] = useState<Set<string>>(new Set(['google']));

  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <main className="page-container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="section-title mb-1">Analytics</h1>
          <p className="text-text-muted text-sm">Track your content performance and earnings.</p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total views', value: '0', sub: 'Across all platforms' },
            { label: 'Posts', value: '0', sub: 'Submitted content' },
            { label: 'Earned', value: '$0', sub: 'Lifetime earnings' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-gold font-bold text-xl mb-0.5">{s.value}</div>
              <div className="text-text text-[11px] font-medium">{s.label}</div>
              <div className="text-text-muted text-[10px] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Platform connections */}
        <div className="card p-6 mb-6">
          <h2 className="text-text font-medium text-sm mb-4">Platforms</h2>
          <p className="text-text-muted text-xs mb-4 leading-relaxed">
            Connect your social accounts to track real view counts and verify content performance.
          </p>
          <div className="space-y-3">
            {[
              { name: 'TikTok', color: '#ff0050' },
              { name: 'Instagram', color: '#E1306C' },
              { name: 'YouTube', color: '#FF0000' },
            ].map(p => {
              const isConn = connected.has(p.name.toLowerCase());
              return (
                <div key={p.name} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
                      style={{ backgroundColor: p.color + '15', color: p.color }}>
                      {p.name[0]}
                    </div>
                    <div className="text-text text-sm">{p.name}</div>
                  </div>
                  {isConn ? (
                    <span className="text-emerald-400/60 text-[11px] font-medium">Connected</span>
                  ) : (
                    <button onClick={() => setConnected(prev => new Set([...prev, p.name.toLowerCase()]))}
                      className="text-gold/70 text-[11px] font-medium hover:text-gold transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Coming soon */}
        <div className="card p-6 text-center">
          <div className="text-text-muted text-4xl mb-3 font-light">↗</div>
          <div className="text-text font-medium text-sm mb-1">Detailed analytics coming soon</div>
          <p className="text-text-muted text-xs">View tracking, engagement data, and payout history in real time.</p>
        </div>
      </main>
    </div>
  );
}
