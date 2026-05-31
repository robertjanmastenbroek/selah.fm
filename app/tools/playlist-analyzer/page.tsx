'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, Check, ExternalLink, Music, Users, BarChart3 } from 'lucide-react';
import Header from '@/components/TopNav';

export default function PlaylistAnalyzerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!url.includes('spotify.com/playlist/')) {
      setError('Paste a Spotify playlist URL (e.g. https://open.spotify.com/playlist/...)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tools/playlist-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch { setError('Could not analyze this playlist. Try another one.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Spotify Playlist Analyzer</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Check if a Spotify playlist uses bots or fake streams. Free. No sign-up.
          </p>
        </motion.div>

        <div className="flex gap-2 mb-8">
          <input
            value={url}
            onChange={e => { setUrl(e.target.value); setResult(null); setError(''); }}
            placeholder="https://open.spotify.com/playlist/37i9dQZF1DX..."
            className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm focus:outline-none focus:border-primary/30"
          />
          <button
            onClick={analyze}
            disabled={loading || !url}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 text-sm text-amber-400/80 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Score card */}
            <div className={`rounded-2xl p-6 text-center ${result.risk === 'low' ? 'bg-[#22C55E]/5 border border-[#22C55E]/10' : result.risk === 'medium' ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
              <div className={`text-4xl font-bold mb-2 ${result.risk === 'low' ? 'text-[#22C55E]' : result.risk === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>
                {result.risk === 'low' ? '✅ Clean' : result.risk === 'medium' ? '⚠️ Suspicious' : '🚫 Likely Bots'}
              </div>
              <p className="text-sm text-muted-foreground">
                {result.risk === 'low'
                  ? 'This playlist appears to have genuine, organic followers and engagement.'
                  : result.risk === 'medium'
                  ? 'Some metrics look unusual. Proceed with caution.'
                  : 'Multiple red flags detected. This playlist likely uses artificial streams.'}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Followers', value: result.followers?.toLocaleString() || '?', icon: Users },
                { label: 'Tracks', value: result.trackCount || '?', icon: Music },
                { label: 'Bot Score', value: `${result.botScore || 0}/100`, icon: BarChart3 },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                  <m.icon size={16} className="mx-auto mb-1 text-muted-foreground/40" />
                  <div className="font-bold text-lg">{m.value}</div>
                  <div className="text-[10px] text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Red flags */}
            {result.flags?.length > 0 && (
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                <h3 className="font-semibold text-sm mb-3">Red Flags Detected</h3>
                <div className="space-y-2">
                  {result.flags.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-400" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-5 text-center">
              <p className="text-sm mb-3">Want real promotion from real creators?</p>
              <a href="/browse" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all">
                Browse campaigns on Selah.fm <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
