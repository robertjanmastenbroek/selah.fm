'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Check, Pencil } from 'lucide-react';

const REVIEW_STATUSES = ['pending', 'approved', 'rejected'];
const PAYOUT_STATUSES = ['pending', 'processing', 'paid', 'failed'];

export default function AdminSubmissionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; values: Record<string, any> } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const fetchSubs = (s = '') => {
    fetch(`/api/admin/manage?type=submissions&search=${encodeURIComponent(s)}`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setSubs(d); });
  };

  useEffect(() => { fetchSubs(); }, []);

  const saveEdit = async () => {
    if (!editing) return;
    const body: any = {};
    const v = editing.values;
    if (v.review_status !== undefined) body.review_status = v.review_status;
    if (v.payout_status !== undefined) body.payout_status = v.payout_status;
    if (v.payout_amount_cents !== undefined) body.payout_amount_cents = parseInt(v.payout_amount_cents);
    if (v.views_verified !== undefined) body.views_verified = parseInt(v.views_verified);
    const res = await fetch(`/api/admin/manage?type=submissions&id=${editing.id}`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) { setEditing(null); fetchSubs(search); showToast('Updated'); }
    else { const e = await res.json(); showToast(e.error || 'Failed', 'error'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold mb-1">Submissions</h1><p className="text-muted-foreground text-sm">{subs.length} submissions</p></div>
        <form onSubmit={e => { e.preventDefault(); fetchSubs(search); }} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search track or creator..." className="w-56 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none" />
          <button type="submit" className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 active:scale-[0.97]"><Search size={14} /></button>
        </form>
      </div>

      {toast && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`text-sm px-4 py-2 rounded-xl ${toast.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{toast.msg}</motion.div>}

      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-muted-foreground text-xs">
              <th className="text-left py-3 px-4 font-medium">Track</th><th className="text-left py-3 px-4 font-medium">Creator</th><th className="text-left py-3 px-4 font-medium">Platform</th><th className="text-left py-3 px-4 font-medium">Views</th><th className="text-left py-3 px-4 font-medium">Review</th><th className="text-left py-3 px-4 font-medium">Payout</th><th className="text-left py-3 px-4 font-medium">Amount</th><th className="text-right py-3 px-4 font-medium w-20">Edit</th>
            </tr></thead>
            <tbody>
              {subs.length === 0 ? <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">No submissions found</td></tr> : subs.map(s => {
                const isEditing = editing?.id === s.id;
                const e = isEditing ? editing!.values : {};
                return (
                  <tr key={s.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer ${isEditing ? 'bg-primary/[0.03]' : ''}`} onClick={() => !isEditing && setExpanded(expanded === s.id ? null : s.id)}>
                    <td className="py-3 px-4 font-medium">{s.track_title}</td>
                    <td className="py-3 px-4 text-xs">{s.creator_name || s.creator_email || '—'}</td>
                    <td className="py-3 px-4"><span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04]">{s.platform}</span></td>
                    <td className="py-3 px-4">{isEditing ? <input type="number" value={e.views_verified ?? s.views_verified ?? ''} onChange={ev => setEditing({ id: s.id, values: { ...e, views_verified: ev.target.value } })} className="w-20 rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm" /> : (s.views_verified || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">{isEditing ? <select value={e.review_status ?? s.review_status} onChange={ev => setEditing({ id: s.id, values: { ...e, review_status: ev.target.value } })} className="rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm">{REVIEW_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}</select> : <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.review_status === 'approved' ? 'bg-success/10 text-success' : s.review_status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-400'}`}>{s.review_status}</span>}</td>
                    <td className="py-3 px-4">{isEditing ? <select value={e.payout_status ?? s.payout_status} onChange={ev => setEditing({ id: s.id, values: { ...e, payout_status: ev.target.value } })} className="rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm">{PAYOUT_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}</select> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04]">{s.payout_status}</span>}</td>
                    <td className="py-3 px-4">{isEditing ? <input type="number" value={e.payout_amount_cents ?? s.payout_amount_cents ?? ''} onChange={ev => setEditing({ id: s.id, values: { ...e, payout_amount_cents: ev.target.value } })} className="w-20 rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm" /> : `${((s.payout_amount_cents || 0) / 100).toFixed(2)}`}</td>
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 active:scale-[0.95]"><Check size={14} /></button>
                          <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground active:scale-[0.95]"><X size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setEditing({ id: s.id, values: {} })} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground active:scale-[0.95]"><Pencil size={14} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
