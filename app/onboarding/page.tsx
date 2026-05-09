'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<'artist' | 'creator' | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Step data
  const [name, setName] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [budget, setBudget] = useState(100);
  const [cpm, setCpm] = useState(2);

  const totalSteps = role === 'artist' ? 5 : 5;
  const genreOptions = ['Pop', 'Hip-Hop', 'Electronic', 'Rock', 'Indie', 'R&B', 'Jazz', 'Classical', 'Country', 'Metal'];
  const platformOptions = ['TikTok', 'Instagram Reels', 'YouTube Shorts'];
  const budgetPresets = [50, 100, 250, 500];

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          genres: genres.join(', '),
          tiktok_handle: platforms.includes('TikTok') ? '@pending' : null,
          instagram_handle: platforms.includes('Instagram Reels') ? '@pending' : null,
          youtube_handle: platforms.includes('YouTube Shorts') ? '@pending' : null,
          preferredCpm: cpm,
        }),
      });
      setDone(true);
      setTimeout(() => {
        router.push(role === 'artist' ? '/dashboard' : '/browse');
      }, 2000);
    } catch {
      setSaving(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  // Confetti particles
  const particles = done ? Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    size: Math.random() * 6 + 4,
    color: ['#5B7FFF', '#8B9FFF', '#81C784', '#FFD54F'][i % 4],
  })) : [];

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full animate-[float_2s_ease-out_forwards]"
            style={{
              left: `${p.x}%`,
              top: '50%',
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              opacity: 0,
              animation: `confettiFall ${1.5 + p.delay}s ease-out forwards`,
            }}
          />
        ))}
        <div className="text-center space-y-4 animate-fade-in z-10">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold">
            {role === 'artist' ? 'Your campaign is live!' : "You're all set!"}
          </h2>
          <p className="text-muted-foreground">
            {role === 'artist' ? 'Creators can now find your track.' : 'Browse campaigns and start earning.'}
          </p>
        </div>
        <style>{`
          @keyframes confettiFall {
            0% { opacity: 1; transform: translateY(-50vh) rotate(0deg); }
            100% { opacity: 0; transform: translateY(50vh) rotate(720deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Step {step + 1} of {totalSteps}
          </p>
        </div>

        {/* Back button */}
        {step > 0 && (
          <button onClick={prevStep} className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </button>
        )}

        <div className="animate-[slideUp_0.3s_ease-out]">
          {/* Step 0: Role selection */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">What brings you here?</h2>
              <p className="text-muted-foreground text-sm">We&apos;ll tailor your experience.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: 'artist' as const, icon: '🎵', title: "I'm an artist", desc: 'I want to promote my music' },
                  { role: 'creator' as const, icon: '📱', title: "I'm a creator", desc: 'I want to earn money creating content' },
                ].map(r => (
                  <button
                    key={r.role}
                    onClick={() => { setRole(r.role); nextStep(); }}
                    className="p-5 rounded-2xl border-2 border-border hover:border-primary/40 transition-all text-left space-y-2 hover:bg-primary/[0.03]"
                  >
                    <div className="text-3xl">{r.icon}</div>
                    <div className="font-semibold text-sm">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">
                {role === 'artist' ? "What's your artist name?" : "What's your creator name?"}
              </h2>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={role === 'artist' ? 'e.g. Luna Park' : 'e.g. MiaCreates'}
                className="w-full bg-input border border-border rounded-xl px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && name && nextStep()}
              />
              {name && (
                <button onClick={nextStep} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                  Continue →
                </button>
              )}
            </div>
          )}

          {/* Step 2: Genres (artist) or Platforms (creator) */}
          {step === 2 && role === 'artist' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">What genre is your music?</h2>
              <p className="text-muted-foreground text-sm">Pick one or more.</p>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map(g => {
                  const selected = genres.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => setGenres(prev => selected ? prev.filter(x => x !== g) : [...prev, g])}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
              {genres.length > 0 && (
                <button onClick={nextStep} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                  Continue →
                </button>
              )}
            </div>
          )}

          {step === 2 && role === 'creator' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">Where do you create content?</h2>
              <p className="text-muted-foreground text-sm">Pick your platforms.</p>
              <div className="space-y-2">
                {platformOptions.map(p => {
                  const selected = platforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => setPlatforms(prev => selected ? prev.filter(x => x !== p) : [...prev, p])}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selected ? 'border-primary bg-primary/[0.05]' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="font-medium text-sm">{p}</div>
                    </button>
                  );
                })}
              </div>
              {platforms.length > 0 && (
                <button onClick={nextStep} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                  Continue →
                </button>
              )}
            </div>
          )}

          {/* Step 3: Genres (creator) or Budget (artist) */}
          {step === 3 && role === 'artist' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">Set your budget</h2>
              <p className="text-muted-foreground text-sm">You can always add more later.</p>
              <div className="grid grid-cols-2 gap-2">
                {budgetPresets.map(b => (
                  <button
                    key={b}
                    onClick={() => { setBudget(b); nextStep(); }}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      budget === b ? 'border-primary bg-primary/[0.05]' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="text-xl font-bold">${b}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ≈ {Math.floor((b / (cpm || 2)) * 1000).toLocaleString()} views
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => { setBudget(0); nextStep(); }}
                  className="p-4 rounded-xl border-2 border-border hover:border-primary/30 text-center col-span-2"
                >
                  <div className="text-sm font-medium">Custom amount</div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && role === 'creator' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">What&apos;s your style?</h2>
              <p className="text-muted-foreground text-sm">Pick your genres.</p>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map(g => {
                  const selected = genres.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => setGenres(prev => selected ? prev.filter(x => x !== g) : [...prev, g])}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
              {genres.length > 0 && (
                <button onClick={nextStep} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                  Continue →
                </button>
              )}
            </div>
          )}

          {/* Step 4: Platform connect (creator) or CPM (artist) */}
          {step === 4 && role === 'artist' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">Set your CPM rate</h2>
              <p className="text-muted-foreground text-sm">This is how much you pay per 1,000 verified views.</p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={cpm}
                  onChange={e => setCpm(parseFloat(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-2xl font-bold tabular-nums w-16 text-right">${cpm.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Creators earn 80% = ${(cpm * 0.8).toFixed(2)} per 1,000 views</p>
              <button onClick={save} disabled={saving} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                {saving ? 'Launching...' : 'Launch campaign →'}
              </button>
            </div>
          )}

          {step === 4 && role === 'creator' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">Connect your platforms</h2>
              <p className="text-muted-foreground text-sm">This helps artists find you. You can skip for now.</p>
              <div className="space-y-3">
                {platforms.map(p => (
                  <div key={p} className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02] text-center">
                    <p className="text-sm font-medium">{p} — connected</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push('/browse')} className="flex-1 py-3 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Skip for now
                </button>
                <button onClick={save} disabled={saving} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                  {saving ? 'Finishing...' : "I'm ready →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
