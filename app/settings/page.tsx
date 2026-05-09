'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState('');
  const [cpm, setCpm] = useState('');
  const [tiktok, setTikTok] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYouTube] = useState('');
  const [facebook, setFacebook] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) {
        setProfile(d.user);
        setName(d.user.name || '');
      }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, bio, genres,
          preferredCpm: cpm,
          tiktok_handle: tiktok || null,
          instagram_handle: instagram || null,
          youtube_handle: youtube || null,
          facebook_handle: facebook || null,
        }),
      });
      if (res.ok) {
        addToast('Profile saved', 'success');
      } else {
        addToast('Failed to save', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const connectedCount = [tiktok, instagram, youtube, facebook].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container max-w-lg">
        <h1 className="section-title mb-8">Settings</h1>
        <div className="space-y-6">
          {/* Profile */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-medium mb-1">Profile</h3>
                <p className="text-sm text-muted-foreground mb-4">Your public profile information.</p>
              </div>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Display name" />
              <Input value={profile?.email || ''} disabled placeholder="Email" />
              <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio — tell others about yourself" />
              <Input value={genres} onChange={e => setGenres(e.target.value)} placeholder="Genres — e.g. pop, electronic, indie" />
              <Input type="number" value={cpm} onChange={e => setCpm(e.target.value)} placeholder="Preferred CPM ($ per 1K views)" />
            </CardContent>
          </Card>

          {/* Social accounts */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-medium mb-1">Social accounts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your social accounts to get verified. {connectedCount > 0 && `${connectedCount} connected`}
                </p>
              </div>
              <Input value={tiktok} onChange={e => setTikTok(e.target.value)} placeholder="TikTok @handle" />
              <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram @handle" />
              <Input value={youtube} onChange={e => setYouTube(e.target.value)} placeholder="YouTube @channel" />
              <Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Facebook name" />
            </CardContent>
          </Card>

          {/* Connected platforms status */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="font-medium">Connected platforms</h3>
              {[
                { name: 'Google', status: !!profile, color: 'bg-blue-500' },
                { name: 'TikTok', status: !!tiktok, color: 'bg-pink-500' },
                { name: 'Instagram', status: !!instagram, color: 'bg-purple-500' },
                { name: 'YouTube', status: !!youtube, color: 'bg-red-500' },
                { name: 'Facebook', status: !!facebook, color: 'bg-blue-600' },
              ].map(p => (
                <div key={p.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${p.color}`} />
                    <span className="text-sm">{p.name}</span>
                  </div>
                  <Badge variant={p.status ? 'default' : 'outline'} className="text-xs">
                    {p.status ? 'Connected' : 'Not connected'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save changes'}
          </Button>

          <Button variant="destructive" className="w-full" onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
          }}>
            Log out
          </Button>
        </div>
      </main>
    </div>
  );
}
