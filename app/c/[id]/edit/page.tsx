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
  const [form, setForm] = useState({ title: '', track_title: '', requirements: '', cpm_rate_cents: 0, total_budget_cents: 0, caption_requirements: '', required_hashtags: '', cover_art_url: '', track_url: '', youtube_video_url: '', spotify_url: '', apple_music_url: '', deezer_url: '' });
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
      if (res.ok) { setMessage('Saved!'); setTimeout(() => setMessage(''), 2000); }
      else { const e = await res.json(); setMessage('Error: ' + (e.error || 'Unknown')); }
    } catch { setMessage('Network error'); }
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
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${message === 'Saved!' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {message}
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
            <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Required hashtags</label>
            <input value={form.required_hashtags} onChange={e => setForm(f => ({ ...f, required_hashtags: e.target.value }))}
              placeholder="#selahfm @artist"
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground focus:border-primary/30 focus:outline-none" />
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
              <div>
                <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Track audio URL (where to listen)</label>
                <input value={form.track_url} onChange={e => setForm(f => ({ ...f, track_url: e.target.value }))}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-medium mb-1 block text-muted-foreground">YouTube video (promo or music video)</label>
                <input value={form.youtube_video_url} onChange={e => setForm(f => ({ ...f, youtube_video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Spotify</label>
                  <input value={form.spotify_url} onChange={e => setForm(f => ({ ...f, spotify_url: e.target.value }))}
                    placeholder="https://open.spotify.com/..."
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Apple Music</label>
                  <input value={form.apple_music_url} onChange={e => setForm(f => ({ ...f, apple_music_url: e.target.value }))}
                    placeholder="https://music.apple.com/..."
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-medium mb-1 block text-muted-foreground">Deezer</label>
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
