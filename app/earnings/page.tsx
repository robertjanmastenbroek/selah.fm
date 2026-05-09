'use client';

import { useState } from 'react';
import Header from '@/components/TopNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EarningsPage() {
  const [submissions] = useState([
    { id: '1', track: 'Midnight Frequencies', platform: 'tiktok', views: 12400, earned: 37.20, status: 'paid', date: 'May 8' },
    { id: '2', track: 'Desert Prayer', platform: 'instagram', views: 8300, earned: 33.20, status: 'paid', date: 'May 7' },
    { id: '3', track: 'Neon Cathedral', platform: 'tiktok', views: 45100, earned: 90.20, status: 'pending', date: 'May 9' },
  ]);
  const total = submissions.filter(s => s.status === 'paid').reduce((s, e) => s + e.earned, 0);
  const pending = submissions.filter(s => s.status === 'pending').reduce((s, e) => s + e.earned, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <h1 className="section-title mb-8">Earnings</h1>
        <Card className="text-center mb-6 animate-fade-in">
          <CardContent className="p-8">
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Available balance</p>
            <p className="text-5xl font-bold tracking-tight">${total.toFixed(2)}</p>
            <p className="text-muted-foreground text-sm mt-1">+${pending.toFixed(2)} pending</p>
          </CardContent>
        </Card>
        <div className="space-y-2">
          {submissions.map((s, i) => (
            <Card key={s.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{s.track}</p>
                  <p className="text-muted-foreground text-xs">{s.platform} · {s.views.toLocaleString()} views · {s.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${s.earned.toFixed(2)}</p>
                  <Badge variant={s.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                    {s.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
