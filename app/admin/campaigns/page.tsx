'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Check, Pencil, Trash2, Play, Pause } from 'lucide-react';

const STATUSES = ['active', 'paused', 'completed', 'cancelled'];

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const fetchCampaigns = (s = '') => {
    const url = s ? `/api/admin/manage?type=campaigns&search=${encodeURIComponent(s)}` : '/api/campaigns';
    fetch(url).then(r => r.json()).then(d => {
      const list = s ? (Array.isArray(d) ? d : []) : (d.campaigns || []);
      setCampaigns(list);
    });
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setEditValues({
      track_title: c.track_title || '',
      cpm_rate_cents: c.cpm_rate_cents || 0,
      total_budget_cents: c.total_budget_cents || 0,
      budget_remaining_cents: c.budget_remaining_cents || 0,
      status: c.status || 'active',
    });
  };

  const handleSave = async (id: string) => {
    const body: any = {};
    if (editValues.track_title !== undefined) body.track_title = editValues.track_title;
    if (editValues.cpm_rate_cents !== undefined) body.cpm_rate_cents = parseInt(editValues.cpm_rate_cents);
    if (editValues.total_budget_cents !== undefined) body.total_budget_cents = parseInt(editValues.total_budget_cents);
    if (editValues.budget_remaining_cents !== undefined) body.budget_remaining_cents = parseInt(editValues.budget_remaining_cents);
    if (editValues.status !== undefined) body.status = editValues.status;

    const res = await fetch(`/api/admin/manage?type=campaigns&id=${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) { setEditingId(null); fetchCampaigns(search); showToast('Campaign updated'); }
    else { const e = await res.json(); showToast(e.error || 'Failed', 'error'); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete campaign "${title}"?`)) return;
    const res = await fetch(`/api/admin/manage?type=campaigns&id=${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { fetchCampaigns(search); showToast('Campaign deleted', 'info'); }
    else { const e = await res.json(); showToast(e.error || 'Failed', 'error'); }
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'active' ? 'paused' : 'active';
    const res = await fetch(`/api/admin/manage?type=campaigns&id=${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }),
    });
    if (res.ok) { fetchCampaigns(search); showToast(`Campaign ${next}`); }
    else { const e = await res.json(); showToast(e.error || 'Failed', 'error'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold mb-1">Campaigns</h1><p className="text-muted-foreground text-sm">{campaigns.length} campaigns</p></div>
        <form onSubmit={e => { e.preventDefault(); fetchCampaigns(search); }} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-48 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none" />
          <button type="submit" className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors active:scale-[0.97]"><Search size={14} /></button>
        </form>
      </div>

      {toast && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`text-sm px-4 py-2 rounded-xl ${toast.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {toast.msg}
        </motion.div>
      )}

      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-muted-foreground text-xs">
              <th className="text-left py-3 px-4 font-medium">Track</th>
              <th className="text-left py-3 px-4 font-medium">CPM</th>
              <th className="text-left py-3 px-4 font-medium">Budget</th>
              <th className="text-left py-3 px-4 font-medium">Remaining</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-right py-3 px-4 font-medium w-28">Actions</th>
            </tr></thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">No campaigns found</td></tr>
              ) : campaigns.map(c => {
                const isEditing = editingId === c.id;
                return (
                  <tr key={c.id} className={`border-b border-white/[0.03] ${isEditing ? 'bg-primary/[0.03]' : 'hover:bg-white/[0.02]'}`}>
                    <td className="py-3 px-4">{isEditing ? <input value={editValues.track_title || ''} onChange={e => setEditValues({ ...editValues, track_title: e.target.value })} className="w-full rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm" /> : c.track_title}</td>
                    <td className="py-3 px-4">{isEditing ? <input type="number" value={editValues.cpm_rate_cents || ''} onChange={e => setEditValues({ ...editValues, cpm_rate_cents: e.target.value })} className="w-20 rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm" /> : `$${((c.cpm_rate_cents || 0) / 100).toFixed(2)}`}</td>
                    <td className="py-3 px-4">{isEditing ? <input type="number" value={editValues.total_budget_cents || ''} onChange={e => setEditValues({ ...editValues, total_budget_cents: e.target.value })} className="w-20 rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm" /> : `$${((c.total_budget_cents || 0) / 100).toFixed(0)}`}</td>
                    <td className="py-3 px-4">{isEditing ? <input type="number" value={editValues.budget_remaining_cents || ''} onChange={e => setEditValues({ ...editValues, budget_remaining_cents: e.target.value })} className="w-20 rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm" /> : `$${((c.budget_remaining_cents || 0) / 100).toFixed(0)}`}</td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select value={editValues.status || ''} onChange={e => setEditValues({ ...editValues, status: e.target.value })} className="rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm">
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-success/10 text-success' : c.status === 'paused' ? 'bg-amber-500/10 text-amber-400' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSave(c.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 active:scale-[0.95]"><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground active:scale-[0.95]"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => toggleStatus(c.id, c.status)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground active:scale-[0.95]" title={c.status === 'active' ? 'Pause' : 'Activate'}>{c.status === 'active' ? <Pause size={14} /> : <Play size={14} />}</button>
                            <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground active:scale-[0.95]"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(c.id, c.track_title)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:scale-[0.95]"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
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
