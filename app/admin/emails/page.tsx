'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../layout';
import { Mail, RefreshCw, ExternalLink, Send, X } from 'lucide-react';

export default function EmailsPage() {
  return <AdminLayout><EmailsContent /></AdminLayout>;
}

function EmailsContent() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [fromAddr, setFromAddr] = useState('info');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/emails');
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
      else setError(data.error || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, []);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    setStatus('');
    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), subject: subject.trim(), body: body.trim(), from: fromAddr }),
      });
      const data = await res.json();
      if (data.sent) {
        setStatus('Sent ✓');
        setCompose(false);
        setTo(''); setSubject(''); setBody('');
        loadLogs();
      } else {
        setStatus(`Failed: ${data.reason || 'Unknown'}`);
      }
    } catch { setStatus('Network error'); }
    setSending(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Email</h1>
          <p className="text-muted-foreground text-sm">
            info@selah.fm · support@selah.fm ·{' '}
            <a href="https://resend.com/emails" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
              Resend <ExternalLink size={12} />
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground transition-colors" title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {!compose && (
            <button onClick={() => setCompose(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]">
              <Send size={14} /> Compose
            </button>
          )}
        </div>
      </div>

      {status && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${status.includes('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {status}
          <button onClick={() => setStatus('')} className="ml-3 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Compose form */}
      {compose && (
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">New message</h2>
            <button onClick={() => setCompose(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0">From:</span>
            <select value={fromAddr} onChange={e => setFromAddr(e.target.value)}
              className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground">
              <option value="info">info@selah.fm</option>
              <option value="support">support@selah.fm</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0">To:</span>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="email@example.com"
              className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0">Subj:</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
              className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30" />
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..."
            className="w-full h-40 rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-none" />
          <button onClick={handleSend} disabled={sending || !to || !subject || !body}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity">
            {sending ? 'Sending...' : 'Send email'}
          </button>
        </div>
      )}

      {/* Email addresses */}
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
            <p className="text-sm font-medium">info@selah.fm</p>
            <p className="text-xs text-muted-foreground mt-1">Transactional emails — welcome, approvals, payouts</p>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
            <p className="text-sm font-medium">support@selah.fm</p>
            <p className="text-xs text-muted-foreground mt-1">Support emails — human escalation from AI chat</p>
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="font-semibold text-sm">Recent Sent Emails</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button onClick={loadLogs} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Retry</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Mail size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">No emails sent yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Emails will appear here once sent via the Resend API.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-muted-foreground">
                  <th className="text-left p-3 font-medium text-xs">Recipient</th>
                  <th className="text-left p-3 font-medium text-xs">Subject</th>
                  <th className="text-left p-3 font-medium text-xs">Status</th>
                  <th className="text-left p-3 font-medium text-xs">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-3 text-xs truncate max-w-[200px]">{log.recipient}</td>
                    <td className="p-3 text-xs truncate max-w-[250px]">{log.subject}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        log.sent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {log.sent ? 'Sent' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
