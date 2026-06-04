'use client';

import { useEffect, useState } from 'react';

export default function AuditLogPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch(`/api/admin/audit-log?limit=100${filter ? `&action=${filter}` : ''}`)
      .then(r => r.json())
      .then(d => { setEntries(d.entries || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [filter]);

  const actions = ['', 'payment.donation', 'payment.deposit', 'payment.artist_donation', 'payout.sent'];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>

      <div className="flex gap-2 mb-4">
        {actions.map(a => (
          <button key={a} onClick={() => setFilter(a)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === a ? 'bg-primary/20 text-primary' : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'}`}>
            {a || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-red-400">Error: {error}</p>
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground/50">No audit log entries yet. Donations and deposits will appear here.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e: any) => (
            <div key={e.id} className="flex items-start gap-3 text-xs p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="font-mono text-muted-foreground/40 shrink-0">{new Date(e.created_at).toLocaleString()}</span>
              <span className="font-medium text-primary shrink-0">{e.action}</span>
              <span className="text-muted-foreground">{e.target_type}/{e.target_id?.slice(0, 8)}</span>
              {e.details && <span className="text-muted-foreground/50 truncate">{JSON.stringify(e.details)}</span>}
              {e.actor_name && <span className="text-muted-foreground/40 shrink-0">by {e.actor_name}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
