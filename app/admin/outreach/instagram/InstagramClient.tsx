'use client';

import { useEffect, useState } from 'react';

interface Artist {
  artist_id: string;
  artist_name: string;
  track_name: string;
  instagram_handle: string;
  campaign_slug: string;
  campaign_id: string;
  cover_art_url: string;
  cpm_rate_cents: number;
  ig_followers: number;
  genres: any;
}

interface SentLog {
  id: string;
  artist_name: string;
  track_name: string;
  instagram_handle: string;
  campaign_slug: string;
  message_text: string;
  dm_sent_at: string;
  response_type: string;
}

export default function InstagramOutreachDashboard() {
  const [queue, setQueue] = useState<Artist[]>([]);
  const [sent, setSent] = useState<SentLog[]>([]);
  const [tab, setTab] = useState<'queue' | 'sent' | 'replied' | 'claimed'>('queue');
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [dmText, setDmText] = useState('');
  const [caption, setCaption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/instagram?limit=50&status=pending');
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (e: any) {
      console.error(e);
    }
    setLoading(false);
  }

  async function loadHistory(status: string) {
    setLoading(true);
    setTab(status as any);
    try {
      const res = await fetch(`/api/admin/outreach/instagram?limit=50&status=${status}`);
      const data = await res.json();
      setSent(data.history || []);
    } catch (e: any) {
      console.error(e);
    }
    setLoading(false);
  }

  async function generateContent(artist: Artist) {
    setSelectedArtist(artist);
    setGenerating(true);
    setDmText('');
    setCaption('');

    try {
      const [dmRes, captionRes] = await Promise.all([
        fetch('/api/admin/outreach/instagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate_dm', artist_id: artist.artist_id }),
        }),
        fetch('/api/admin/outreach/instagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate_caption', artist_id: artist.artist_id }),
        }),
      ]);

      const dmData = await dmRes.json();
      const captionData = await captionRes.json();

      setDmText(dmData.dm || '');
      setCaption(captionData.caption || '');
    } catch (e: any) {
      console.error(e);
    }
    setGenerating(false);
  }

  async function logSent() {
    if (!selectedArtist) return;
    setSending(true);
    try {
      await fetch('/api/admin/outreach/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_sent',
          artist_id: selectedArtist.artist_id,
          campaign_id: selectedArtist.campaign_id,
          ig_handle: selectedArtist.instagram_handle,
          message: dmText,
        }),
      });
      setQueue(queue.filter(a => a.artist_id !== selectedArtist.artist_id));
      setSelectedArtist(null);
      setDmText('');
      setCaption('');
    } catch (e: any) {
      console.error(e);
    }
    setSending(false);
  }

  async function logResponse(outreachId: string, responseType: string) {
    await fetch('/api/admin/outreach/instagram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log_response', outreach_id: outreachId, response_type: responseType }),
    });
    loadHistory(tab);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(''), 1500);
  }

  if (selectedArtist) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <button onClick={() => setSelectedArtist(null)} className="text-xs text-muted-foreground hover:text-primary mb-4 inline-block">
          ← Back to queue
        </button>

        {/* Artist info */}
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 flex items-center gap-4">
          <img
            src={selectedArtist.cover_art_url || '/images/og-image.jpg'}
            alt=""
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div>
            <h2 className="font-semibold">{selectedArtist.artist_name}</h2>
            <p className="text-sm text-muted-foreground">"{selectedArtist.track_name}"</p>
            <a
              href={`https://instagram.com/${selectedArtist.instagram_handle}`}
              target="_blank"
              className="text-xs text-primary/60 hover:text-primary"
            >
              @{selectedArtist.instagram_handle}
            </a>
            {selectedArtist.ig_followers > 0 && (
              <span className="text-xs text-muted-foreground ml-2">{selectedArtist.ig_followers.toLocaleString()} followers</span>
            )}
          </div>
          <div className="ml-auto text-right">
            <a
              href={`https://selah.fm/c/${selectedArtist.campaign_slug}`}
              target="_blank"
              className="text-xs text-primary hover:underline"
            >
              View campaign →
            </a>
          </div>
        </div>

        {/* Generate button */}
        {!dmText && (
          <button
            onClick={() => generateContent(selectedArtist)}
            disabled={generating}
            className="w-full py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate IG Post + DM Template'}
          </button>
        )}

        {/* DM message */}
        {dmText && (
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">DM Message</h3>
              <button
                onClick={() => copyToClipboard(dmText)}
                className="text-xs px-3 py-1 bg-white/[0.04] rounded-lg hover:bg-white/[0.08] transition-colors"
              >
                {copyFeedback || 'Copy'}
              </button>
            </div>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-black/10 rounded-lg p-3">{dmText}</pre>
          </section>
        )}

        {/* IG caption */}
        {caption && (
          <section className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">IG Post Caption</h3>
              <button
                onClick={() => copyToClipboard(caption)}
                className="text-xs px-3 py-1 bg-white/[0.04] rounded-lg hover:bg-white/[0.08] transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-black/10 rounded-lg p-3">{caption}</pre>
          </section>
        )}

        {/* Log sent button */}
        {dmText && (
          <button
            onClick={logSent}
            disabled={sending}
            className="w-full py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm font-medium text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            {sending ? 'Saving...' : '✅ Mark as Sent (DM + Post done)'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Instagram Outreach</h1>
        <p className="text-sm text-muted-foreground mt-1">
          1,196 artists ready · DM from @selahfm · Content-first loop
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['queue', 'sent', 'replied', 'claimed'] as const).map(t => (
          <button
            key={t}
            onClick={() => t === 'queue' ? loadQueue() : loadHistory(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-primary/20 text-primary'
                : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {/* Queue */}
      {tab === 'queue' && !loading && (
        <div className="space-y-2">
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Queue empty — all artists reached!</p>
          ) : (
            queue.map(artist => (
              <div
                key={artist.artist_id}
                onClick={() => generateContent(artist)}
                className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-white/[0.08] transition-colors"
              >
                <img
                  src={artist.cover_art_url || '/images/og-image.jpg'}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{artist.artist_name}</p>
                  <p className="text-xs text-muted-foreground truncate">"{artist.track_name}" — @{artist.instagram_handle}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/40 flex-shrink-0">
                  /c/{artist.campaign_slug?.slice(0, 20)}...
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* History */}
      {tab !== 'queue' && !loading && (
        <div className="space-y-2">
          {sent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet</p>
          ) : (
            sent.map(log => (
              <div
                key={log.id}
                className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{log.artist_name}</p>
                    <p className="text-xs text-muted-foreground">@{log.instagram_handle} · {log.dm_sent_at ? new Date(log.dm_sent_at).toLocaleDateString() : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    {log.response_type === 'sent' && (
                      <>
                        <button
                          onClick={() => logResponse(log.id, 'replied')}
                          className="text-[10px] px-2 py-1 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
                        >
                          Replied
                        </button>
                        <button
                          onClick={() => logResponse(log.id, 'claimed')}
                          className="text-[10px] px-2 py-1 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-colors"
                        >
                          Claimed
                        </button>
                      </>
                    )}
                    {log.response_type !== 'sent' && (
                      <span className="text-[10px] px-2 py-1 bg-white/[0.04] rounded-md capitalize">
                        {log.response_type}
                      </span>
                    )}
                  </div>
                </div>
                {log.message_text && (
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-black/10 rounded-lg p-2 max-h-24 overflow-y-auto">
                    {log.message_text}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
