export const dynamic = 'force-dynamic';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Role selection
  const [role, setRole] = useState<'artist' | 'creator' | null>(null);

  // Step 2: Profile details
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState('');

  // Step 3: Social connections
  const [tiktok, setTikTok] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYouTube] = useState('');
  const [cpm, setCpm] = useState('2');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName,
          bio,
          genres,
          tiktok_handle: tiktok || null,
          instagram_handle: instagram || null,
          youtube_handle: youtube || null,
          preferredCpm: cpm,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push(role === 'artist' ? '/dashboard' : '/browse');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const connectedCount = [tiktok, instagram, youtube].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="text-center mb-4">
          <a href="/" className="font-semibold text-2xl">Selah<span className="text-accent-foreground">.fm</span></a>
          <p className="text-muted-foreground text-sm mt-2">Let&apos;s set up your profile</p>
        </div>
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-accent-foreground' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Step 1: Role */}
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold text-center">What brings you here?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setRole('artist'); setStep(2); }}
                className={`p-5 rounded-2xl border-2 transition-all text-left space-y-2 ${role === 'artist' ? 'border-accent-foreground bg-accent/5' : 'border-border hover:border-muted-foreground'}`}>
                <div className="text-3xl">🎵</div>
                <div className="font-semibold">I&apos;m an artist</div>
                <div className="text-xs text-muted-foreground">I want to promote my music</div>
              </button>
              <button onClick={() => { setRole('creator'); setStep(2); }}
                className={`p-5 rounded-2xl border-2 transition-all text-left space-y-2 ${role === 'creator' ? 'border-accent-foreground bg-accent/5' : 'border-border hover:border-muted-foreground'}`}>
                <div className="text-3xl">📱</div>
                <div className="font-semibold">I&apos;m a creator</div>
                <div className="text-xs text-muted-foreground">I want to earn money creating content</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold text-center">Tell us about yourself</h2>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" />
            <Input value={bio} onChange={e => setBio(e.target.value)} placeholder={role === 'artist' ? 'Describe your music style...' : 'Describe your content style...'} />
            <Input value={genres} onChange={e => setGenres(e.target.value)} placeholder="Genres — e.g. pop, electronic, indie" />
            {role === 'creator' && (
              <Input type="number" min="0.1" step="0.1" value={cpm} onChange={e => setCpm(e.target.value)} placeholder="Preferred CPM rate ($)" />
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} disabled={!displayName} className="flex-1">Continue</Button>
            </div>
          </div>
        )}

        {/* Step 3: Social verification */}
        {step === 3 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold text-center">Connect your accounts</h2>
            <p className="text-sm text-muted-foreground text-center">
              Connect your social accounts to get verified. Verified creators and artists get more visibility.
            </p>

            <div className="space-y-3">
              <Card className={tiktok ? 'border-pink-500/30 bg-pink-500/[0.02]' : ''}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ff0050]/10 flex items-center justify-center text-lg">🎵</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">TikTok</span>
                      {tiktok && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Connected</Badge>}
                    </div>
                    <Input value={tiktok} onChange={e => setTikTok(e.target.value)} placeholder="@yourhandle" className="mt-2 h-8 text-xs" />
                  </div>
                </CardContent>
              </Card>

              <Card className={instagram ? 'border-purple-500/30 bg-purple-500/[0.02]' : ''}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E1306C]/10 flex items-center justify-center text-lg">📷</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Instagram</span>
                      {instagram && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Connected</Badge>}
                    </div>
                    <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourhandle" className="mt-2 h-8 text-xs" />
                  </div>
                </CardContent>
              </Card>

              <Card className={youtube ? 'border-red-500/30 bg-red-500/[0.02]' : ''}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-lg">▶</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">YouTube</span>
                      {youtube && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Connected</Badge>}
                    </div>
                    <Input value={youtube} onChange={e => setYouTube(e.target.value)} placeholder="@yourchannel" className="mt-2 h-8 text-xs" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">{error}</div>}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={save} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : `Finish (${connectedCount} connected)`}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              You can always update these later in Settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
