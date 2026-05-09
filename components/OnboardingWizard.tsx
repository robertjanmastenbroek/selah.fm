'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'artist' | 'creator' | null>(null);
  const [cpm, setCpm] = useState('2');
  const [platform, setPlatform] = useState('tiktok');

  return (
    <Card className="max-w-md mx-auto animate-slide-up">
      <CardContent className="p-6 space-y-5">
        {/* Progress */}
        <div className="flex gap-1.5">
          {[1,2,3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-accent-foreground' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Step 1: Role */}
        {step === 1 && (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold">Welcome to Selah.fm</h2>
            <p className="text-sm text-muted-foreground">Let&apos;s get you set up in 3 steps.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setRole('artist'); setStep(2); }}
                className={`p-4 rounded-xl border-2 transition-all text-left space-y-2 ${role === 'artist' ? 'border-accent-foreground bg-accent/5' : 'border-border hover:border-muted-foreground'}`}>
                <div className="text-2xl">🎵</div>
                <div className="font-semibold text-sm">I&apos;m an artist</div>
                <div className="text-xs text-muted-foreground">I want to promote my music</div>
              </button>
              <button onClick={() => { setRole('creator'); setStep(2); }}
                className={`p-4 rounded-xl border-2 transition-all text-left space-y-2 ${role === 'creator' ? 'border-accent-foreground bg-accent/5' : 'border-border hover:border-muted-foreground'}`}>
                <div className="text-2xl">📱</div>
                <div className="font-semibold text-sm">I&apos;m a creator</div>
                <div className="text-xs text-muted-foreground">I want to earn money posting</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center">Almost there</h2>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your display name" />
            {role === 'artist' ? (
              <>
                <Input type="number" value={cpm} onChange={e => setCpm(e.target.value)} placeholder="Default CPM rate ($)" />
                <p className="text-xs text-muted-foreground text-center">You can change this for each campaign.</p>
              </>
            ) : (
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram Reels</option>
                <option value="youtube">YouTube Shorts</option>
              </select>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} disabled={!name} className="flex-1">Continue</Button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold">You&apos;re all set</h2>
            <p className="text-sm text-muted-foreground">
              {role === 'artist' ? 'Create your first campaign and start getting real content.' : 'Browse campaigns and start earning from your content.'}
            </p>
            <Button onClick={onComplete} className="w-full">
              {role === 'artist' ? 'Start a campaign' : 'Browse campaigns'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
