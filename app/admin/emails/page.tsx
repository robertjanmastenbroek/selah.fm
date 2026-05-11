'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Search, RefreshCw } from 'lucide-react';

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/emails');
      const data = await res.json();
      if (data.emails) setEmails(data.emails);
      else setError(data.error || 'Failed to load');
    } catch { setError('Network error'); }
    setLoading(false);
  };

  useEffect(() => { fetchEmails(); }, []);

  const handleSend = async () => {
    if (!compose.to || !compose.subject || !compose.body) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compose),
      });
      const data = await res.json();
      if (data.ok) {
        setCompose({ to: '', subject: '', body: '' });
        fetchEmails();
      } else {
        setError(data.error || 'Failed to send');
      }
    } catch { setError('Network error'); }
    setSending(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Emails</h1>
        <button onClick={fetchEmails} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Compose */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 mb-6">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2"><Send size={14} className="text-primary/60" />Compose email</h2>
        <div className="space-y-3">
          <input
            value={compose.to}
            onChange={e => setCompose(p => ({ ...p, to: e.target.value }))}
            placeholder="To: email@example.com"
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
          />
          <input
            value={compose.subject}
            onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))}
            placeholder="Subject"
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
          />
          <textarea
            value={compose.body}
            onChange={e => setCompose(p => ({ ...p, body: e.target.value }))}
            placeholder="Message..."
            rows={4}
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !compose.to || !compose.subject || !compose.body}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {sending ? 'Sending...' : 'Send email'}
          </button>
        </div>
        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      </motion.div>

      {/* Email log */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <Mail size={14} className="text-primary/60" />
          <span className="font-semibold text-sm">Email log</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No emails sent yet</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {emails.map((e: any, i: number) => (
              <div key={i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{e.to_email || e.to}</span>
                  <span className="text-[10px] text-muted-foreground">{e.created_at ? new Date(e.created_at).toLocaleString() : ''}</span>
                </div>
                <p className="text-xs text-muted-foreground">{e.subject}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
