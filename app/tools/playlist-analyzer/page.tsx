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
      {/* FAQ Schema — Google "People Also Ask" rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'How does the Spotify playlist analyzer work?', acceptedAnswer: { '@type': 'Answer', text: 'The analyzer scans a Spotify playlist in real time. It checks the playlist follower count, owner follower count, track popularity distribution, and follower-to-track ratios. Bot playlists typically have inflated follower counts but tracks with very low popularity.' } },
              { '@type': 'Question', name: 'What are bot playlists on Spotify?', acceptedAnswer: { '@type': 'Answer', text: 'Bot playlists artificially inflate follower counts using fake accounts or paid services. They prey on artists desperate for streams — charging money to add songs, then delivering streams from bots instead of real listeners.' } },
              { '@type': 'Question', name: 'Is playlist pitching worth it for independent artists?', acceptedAnswer: { '@type': 'Answer', text: 'Editorial playlist pitching (Spotify for Artists) is free and worth doing. But paying third-party services for playlist placement is risky — many use bot-driven playlists. A better approach: short-form video promotion through platforms like Selah.fm.' } },
              { '@type': 'Question', name: "What's better for music promotion — playlists or content creators?", acceptedAnswer: { '@type': 'Answer', text: 'Playlists give passive streams but you don\'t own the audience. Creator promotion builds your own fanbase. When a creator\'s video takes off, people search for your music and follow you. Most artists combine both for the best results.' } },
            ],
          }),
        }}
      />
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

            {/* Playlist Info */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Playlist Name</span>
                <span className="font-medium">{result.playlistName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium">{result.owner || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Track Count</span>
                <span className="font-medium">{result.trackCount?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Playlist Followers</span>
                <span className="font-medium">{result.followers?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Owner Followers</span>
                <span className="font-medium">{result.ownerFollowers?.toLocaleString() || '0'}</span>
              </div>
              {result.medianPopularity > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Median Popularity</span>
                  <span className="font-medium">{result.medianPopularity}</span>
                </div>
              )}
              {result.earliestTrack && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Earliest Track</span>
                  <span className="font-medium">{result.earliestTrack}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Scan Time</span>
                <span className="font-mono text-[10px]">{new Date(result.analyzedAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Bot Score', value: `${result.botScore || 0}/100`, icon: BarChart3 },
                { label: 'Tracks', value: result.trackCount || '0', icon: Music },
                { label: 'Followers', value: result.followers?.toLocaleString() || '0', icon: Users },
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

        {/* FAQ Section — answers what people search for after using the tool */}
        <section className="mt-16 pt-12 border-t border-white/[0.06]">
          <h2 className="text-2xl font-bold mb-8">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              { q: 'How does the Spotify playlist analyzer work?', a: 'The analyzer scans a Spotify playlist in real time. It checks the playlist follower count, owner follower count, track popularity distribution, and follower-to-track ratios. Bot playlists typically have inflated follower counts but tracks with very low popularity. The analyzer gives a bot score from 0–100 and flags suspicious patterns like sudden follower spikes or mismatched ratios.' },
              { q: 'What are bot playlists on Spotify?', a: "Bot playlists are playlists that artificially inflate their follower counts using fake accounts or paid services. They prey on artists desperate for streams — charging money to add songs, then delivering streams from bots instead of real listeners. Spotify actively removes these, and getting caught in one can hurt your artist profile. That's why verification tools like this analyzer matter." },
              { q: 'Is playlist pitching worth it for independent artists?', a: "It depends. Editorial playlist pitching (Spotify for Artists) is free and worth doing. But paying third-party services for playlist placement is risky — many use bot-driven playlists that can get your music removed. A better approach in 2025: short-form video promotion. 80% of new music is discovered through TikTok, Reels, and Shorts. Creator promotion gives you real fans, not fake streams." },
              { q: 'How do I know if a playlist has real followers?', a: "Look at the ratio of playlist followers to track popularity. A playlist with 100,000 followers but tracks with 0–20 popularity scores is suspicious — real followers correlate with real streams. Also check the growth pattern: organic playlists grow gradually. Sudden 50,000 follower jumps in a week are a red flag. This analyzer checks all these signals automatically." },
              { q: "What's better for music promotion — playlists or content creators?", a: "Both serve different purposes. Playlists can give you passive streams, but you don't own the audience — the playlist curator does. Creator promotion (paying TikTok/Reels/Shorts creators to use your song) builds your own fanbase. When a creator's video takes off, people search for your music, follow you, and add you to their personal playlists. That's organic growth that compounds. Most artists using Selah.fm combine creator promotion with organic playlist growth for the best results." },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
                <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Read more on the blog */}
        <div className="mt-8 pt-8 border-t border-white/[0.06]">
          <h2 className="text-sm font-semibold text-muted-foreground/60 mb-4">Read more on our blog</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/blog" className="text-sm text-primary hover:underline">Playlist pitching vs creator promotion →</a>
            <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How to promote music without bots →</a>
          </div>
        </div>
      </main>
    </div>
  );
}
