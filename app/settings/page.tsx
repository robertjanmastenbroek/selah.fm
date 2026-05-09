'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setProfile(d.user); });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container max-w-lg">
        <h1 className="section-title mb-8">Settings</h1>
        <div className="space-y-6">
          <Card><CardContent className="p-6 space-y-4">
            <h2 className="font-medium">Profile</h2>
            <Input defaultValue={profile?.name || ''} placeholder="Display name" />
            <Input defaultValue={profile?.email || ''} disabled />
            <Button size="sm">Save</Button>
          </CardContent></Card>
          <Card><CardContent className="p-6 space-y-3">
            <h2 className="font-medium">Connected accounts</h2>
            {[{ name: 'Google', connected: true }, { name: 'TikTok', connected: false }, { name: 'Instagram', connected: false }].map(p => (
              <div key={p.name} className="flex items-center justify-between py-1">
                <span className="text-sm">{p.name}</span>
                <span className={`text-xs ${p.connected ? 'text-emerald-600' : 'text-muted-foreground'}`}>{p.connected ? 'Connected' : 'Not connected'}</span>
              </div>
            ))}
          </CardContent></Card>
          <Button variant="destructive" className="w-full" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Log out</Button>
        </div>
      </main>
    </div>
  );
}
