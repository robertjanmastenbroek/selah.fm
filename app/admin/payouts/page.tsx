'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Check, Pencil } from 'lucide-react';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [editing, setEditing] = useState<{ id: string; values: Record<string, any> } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    fetch('/api/admin/manage?type=payouts').then(r => r.json()).then(d => { if (Array.isArray(d)) setPayouts(d); });
  }, []);

  const saveEdit = async () => {
    if (!editing) return;
    const body: any = {};
    const v = editing.values;
    if (v.payout_status !== undefined) body.payout_status = v.payout_status;
    if (v.payout_amount_cents !== undefined) body.payout_amount_cents = parseInt(v.payout_amount_cents);
    const res = await fetch(`/api/admin/manage?type=submissions&id=${editing.id}`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) { setEditing(null); showToast('Updated'); fetch('/api/admin/manage?type=payouts').then(r => r.json()).then(d => { if (Array.isArray(d)) setPayouts(d); }); }
    else { const e = await res.json(); showToast(e.error || 'Failed', 'error'); }
  };

  const totalPaid = payouts.filter(p => p.payout_status === 'paid').reduce((s, p) => s + (p.payout_amount_cents || 0), 0) / 100;
  const totalPending = payouts.filter(p => p.payout_status === 'pending' || p.payout_status === 'processing').reduce((s, p) => s + (p.payout_amount_cents || 0), 0) / 100;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Payouts</h1>
          <p className="text-muted-foreground text-sm">{payouts.length} payouts · ${totalPaid.toFixed(2)} paid · ${totalPending.toFixed(2)} pending</p>
        </div>
      </div>

      {toast && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`text-sm px-4 py-2 rounded-xl ${toast.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{toast.msg}</motion.div>}

      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-muted-foreground text-xs">
              <th className="text-left py-3 px-4 font-medium">Track</th><th className="text-left py-3 px-4 font-medium">Creator</th><th className="text-left py-3 px-4 font-medium">Amount</th><th className="text-left py-3 px-4 font-medium">Status</th><th className="text-left py-3 px-4 font-medium">Stripe</th><th className="text-left py-3 px-4 font-medium">Date</th><th className="text-right py-3 px-4 font-medium w-20">Edit</th>
            </tr></thead>
            <tbody>
              {payouts.length === 0 ? <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">No payouts found</td></tr> : payouts.map(p => {
                const isEditing = editing?.id === p.id;
                const e = isEditing ? editing!.values : {};
                return (
                  <tr key={p.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${isEditing ? 'bg-primary/[0.03]' : ''}`}>
                    <td className="py-3 px-4 font-medium">{p.track_title}</td>
                    <td className="py-3 px-4 text-xs">{p.creator_name || p.creator_email || '—'}</td>
                    <td className="py-3 px-4 font-semibold">{isEditing ? <input type="number" value={e.payout_amount_cents ?? p.payout_amount_cents ?? ''} onChange={ev => setEditing({ id: p.id, values: { ...e, payout_amount_cents: ev.target.value } })} className="w-20 rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm" /> : `$${((p.payout_amount_cents || 0) / 100).toFixed(2)}`}</td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select value={e.payout_status ?? p.payout_status} onChange={ev => setEditing({ id: p.id, values: { ...e, payout_status: ev.target.value } })} className="rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm">
                          {['pending','processing','paid','failed'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.payout_status === 'paid' ? 'bg-success/10 text-success' : p.payout_status === 'processing' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-400'}`}>{p.payout_status}</span>}
                    </td>
                    <td className="py-3 px-4 text-xs">{p.stripe_connect_id ? '✅' : '—'}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 active:scale-[0.95]"><Check size={14} /></button>
                          <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground active:scale-[0.95]"><X size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setEditing({ id: p.id, values: {} })} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground active:scale-[0.95]"><Pencil size={14} /></button>
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
