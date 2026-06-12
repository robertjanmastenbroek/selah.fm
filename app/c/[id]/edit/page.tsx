'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/TopNav';

export const dynamic = 'force-dynamic';

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [form, setForm] = useState({ title: '', track_title: '', description: '', requirements: '', cpm_rate_cents: 0, total_budget_cents: 0, caption_requirements: '', required_hashtags: '', cover_art_url: '', track_url: '', youtube_video_url: '', spotify_url: '', apple_music_url: '', deezer_url: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.id) {
          setCampaign(d);
          const social = typeof d.social_links === 'string' ? JSON.parse(d.social_links) : (d.social_links || {});
          setForm({
            title: d.title || '',
            track_title: d.track_title || '',
            description: d.description || '',
            requirements: d.requirements || '',
            cpm_rate_cents: d.cpm_rate_cents || 0,
            total_budget_cents: d.total_budget_cents || 0,
            caption_requirements: d.caption_requirements || '',
            required_hashtags: d.required_hashtags || '',
            cover_art_url: d.cover_art_url || '',
            track_url: d.track_url || '',
            youtube_video_url: d.youtube_video_url || '',
            spotify_url: social.spotify || '',
            apple_music_url: social.apple_music || '',
            deezer_url: social.deezer || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          trackTitle: form.track_title,
          description: form.description,
          requirements: form.requirements,
          cpmRate: (form.cpm_rate_cents / 100).toFixed(2),
          captionRequirements: form.caption_requirements,
          hashtags: form.required_hashtags,
          coverArtUrl: form.cover_art_url || null,
          trackUrl: form.track_url || null,
          youtubeVideoUrl: form.youtube_video_url || null,
          socialLinks: JSON.stringify({ spotify: form.spotify_url, apple_music: form.apple_music_url, deezer: form.deezer_url }),
        }),
      });
      if (res.ok) { setMessage('Changes saved successfully'); }
      else { const e = await res.json(); setMessage(e.error || 'Something went wrong'); }
    } catch { setMessage('Network error — check your connection'); }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0F0F23]"><Header /><div className="text-center py-20 text-muted-foreground">Loading...</div></div>;
  if (!campaign) return <div className="min-h-screen bg-[#0F0F23]"><Header /><div className="text-center py-20 text-muted-foreground">Campaign not found</div></div>;

  return (
    <div className="min-h-screen bg-[#0F0F23]">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-12 pb-24">
        <button onClick={() => router.back()} className="text-xs text-muted-foreground/50 hover:text-foreground mb-6 inline-block">← Back</button>
        <h1 className="text-xl font-bold mb-6">Edit Campaign</h1>

        {message && (
          <div className="flex items-center justify-between px-5 py-3 rounded-xl border text-sm font-medium sticky top-0 z-10 shadow-xl"
            style={message.includes('successfully')
              ? { background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.25)', color: '#22C55E' }
              : { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.25)', color: '#EF4444' }}>
            <div className="flex items-center gap-2">
              {message.includes('successfully') ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
              {message}
            </div>
            <button onClick={() => setMessage('')} className="p-1 rounded-lg hover:bg-white/[0.06] transition-all active:scale-90">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Campaign title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground focus:border-primary/30 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Track name</label>
            <input value={form.track_title} onChange={e => setForm(f => ({ ...f, track_title: e.target.value }))}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground focus:border-primary/30 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-medium mb-1 block text-muted-foreground">CPM rate ($ per 1,000 views)</label>
            <input type="number" value={Number(form.cpm_rate_cents / 100).toFixed(2)}
              step="0.01" min="0.01" placeholder="0.10"
              disabled={parseInt(campaign?.approved_submissions || '0') > 0}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed" />
            {parseInt(campaign?.approved_submissions || '0') > 0 && (
              <p className="text-[9px] text-muted-foreground/50 mt-1">Locked — submissions exist for this campaign.</p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Description (shown on campaign page)</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
              placeholder="Tell creators what this campaign is about..."
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none resize-y" />
          </div>
          <div>
            <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Requirements & instructions</label>
            <textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={6}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground focus:border-primary/30 focus:outline-none resize-y" />
          </div>
          <div>
            <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Caption requirements</label>
            <textarea value={form.caption_requirements} onChange={e => setForm(f => ({ ...f, caption_requirements: e.target.value }))} rows={3}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground focus:border-primary/30 focus:outline-none resize-y" />
          </div>
          <div>
            <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Required hashtags <span className="text-amber-400">(read-only)</span></label>
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <span className="text-sm font-semibold whitespace-nowrap" style={{ color: '#D6A85F' }}>#selahfm</span>
              <span className="text-[10px]" style={{ color: '#6B6760' }}>+</span>
              <input value={form.required_hashtags.replace('#selahfm', '').trim()} onChange={e => setForm(f => ({ ...f, required_hashtags: '#selahfm ' + e.target.value }))}
                placeholder="@artist additional tags"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 mt-6">
            <h2 className="text-xs font-semibold mb-3 text-muted-foreground">Media & Links</h2>
            <div className="space-y-3">
              {/* ── Cover Art Editor ── */}
              <div>
                <label className="text-[10px] font-medium mb-2 block text-muted-foreground">Cover art</label>
                {/* Drop zone */}
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) { const r = new FileReader(); r.onload = () => setForm(prev => ({ ...prev, cover_art_url: r.result as string })); r.readAsDataURL(f); } }}
                  className="relative rounded-xl border-2 border-dashed border-white/[0.08] hover:border-primary/30 transition-all cursor-pointer overflow-hidden group"
                  style={{ background: form.cover_art_url ? 'transparent' : 'rgba(255,255,255,0.02)', minHeight: 180 }}>
                  {form.cover_art_url ? (
                    <>
                      <img src={form.cover_art_url} alt="Cover" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer bg-white/10 text-white hover:bg-white/20 transition-all">
                          Change image
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setForm(prev => ({ ...prev, cover_art_url: r.result as string })); r.readAsDataURL(f); } }} />
                        </label>
                        <button onClick={() => setForm(prev => ({ ...prev, cover_art_url: '' }))}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all">Remove</button>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mb-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                        </svg>
                      </div>
                      <p className="text-xs text-muted-foreground/50 mb-1">Drop an image or click to upload</p>
                      <p className="text-[9px] text-muted-foreground/30">JPG, PNG, WebP</p>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setForm(prev => ({ ...prev, cover_art_url: r.result as string })); r.readAsDataURL(f); } }} />
                    </label>
                  )}
                </div>
                {/* URL fallback */}
                <div className="mt-2">
                  <input value={form.cover_art_url || ''} onChange={e => setForm(f => ({ ...f, cover_art_url: e.target.value }))}
                    placeholder="Or paste an image URL..."
                    className="w-full rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/30 focus:border-primary/30 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium mb-1 flex items-center gap-1.5 text-muted-foreground">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    YouTube
                  </label>
                  <input value={form.youtube_video_url} onChange={e => setForm(f => ({ ...f, youtube_video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-medium mb-1 flex items-center gap-1.5 text-muted-foreground">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    Spotify
                  </label>
                  <input value={form.spotify_url} onChange={e => setForm(f => ({ ...f, spotify_url: e.target.value }))}
                    placeholder="https://open.spotify.com/..."
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-medium mb-1 flex items-center gap-1.5 text-muted-foreground">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FA2D48"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    Apple Music
                  </label>
                  <input value={form.apple_music_url} onChange={e => setForm(f => ({ ...f, apple_music_url: e.target.value }))}
                    placeholder="https://music.apple.com/..."
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-medium mb-1 flex items-center gap-1.5 text-muted-foreground">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#A238FF"><path d="M18.81 4.16v3.33H14.8V4.16h4.01zm-4.64 0v3.33H9.35V4.16h4.82zM9.6 4.16v3.33H5.58V4.16H9.6zM5.34 4.16v3.33H1.33V4.16h4.01zm13.47 4.63v3.33h-4.01V8.79h4.01zm-4.64 0v3.33H9.35V8.79h4.82zM9.6 8.79v3.33H5.58V8.79H9.6zM5.34 8.79v3.33H1.33V8.79h4.01zm13.47 4.63v3.33h-4.01v-3.33h4.01zm-4.64 0v3.33H9.35v-3.33h4.82zM9.6 13.42v3.33H5.58v-3.33H9.6zM5.34 13.42v3.33H1.33v-3.33h4.01z"/></svg>
                    Deezer
                  </label>
                  <input value={form.deezer_url} onChange={e => setForm(f => ({ ...f, deezer_url: e.target.value }))}
                    placeholder="https://deezer.com/track/..."
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #D6A85F, #C9974D)' }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </main>
    </div>
  );
}
