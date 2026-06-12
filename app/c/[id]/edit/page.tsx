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
  const [form, setForm] = useState({ title: '', track_title: '', requirements: '', cpm_rate_cents: 0, total_budget_cents: 0, caption_requirements: '', required_hashtags: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.id) {
          setCampaign(d);
          setForm({
            title: d.title || '',
            track_title: d.track_title || '',
            requirements: d.requirements || '',
            cpm_rate_cents: d.cpm_rate_cents || 0,
            total_budget_cents: d.total_budget_cents || 0,
            caption_requirements: d.caption_requirements || '',
            required_hashtags: d.required_hashtags || '',
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
