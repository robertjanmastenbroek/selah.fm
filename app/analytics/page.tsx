'use client';

import { useState } from 'react';
import Header from '@/components/TopNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  const [connected, setConnected] = useState<Set<string>>(new Set(['google']));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="section-title mb-1">Analytics</h1>
          <p className="text-muted-foreground text-sm">Track your content performance and earnings.</p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total views', value: '0', sub: 'Across all platforms' },
            { label: 'Posts', value: '0', sub: 'Submitted content' },
            { label: 'Earned', value: '$0', sub: 'Lifetime earnings' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <div className="text-accent-foreground font-bold text-xl mb-0.5">{s.value}</div>
                <div className="text-foreground text-[11px] font-medium">{s.label}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">{s.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform connections */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-medium text-sm mb-4">Platforms</h2>
            <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
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
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
                        style={{ backgroundColor: p.color + '15', color: p.color }}
                      >
                        {p.name[0]}
                      </div>
                      <span className="text-sm">{p.name}</span>
                    </div>
                    {isConn ? (
                      <Badge variant="default" className="text-[11px]">Connected</Badge>
                    ) : (
                      <button
                        onClick={() => setConnected(prev => new Set([...prev, p.name.toLowerCase()]))}
                        className="text-accent-foreground text-[11px] font-medium hover:underline transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Coming soon */}
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-muted-foreground text-4xl mb-3 font-light">↗</div>
            <p className="font-medium text-sm mb-1">Detailed analytics coming soon</p>
            <p className="text-muted-foreground text-xs">View tracking, engagement data, and payout history in real time.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
