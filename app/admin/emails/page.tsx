'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../layout';
import { Mail, RefreshCw, ExternalLink } from 'lucide-react';

export default function EmailsPage() {
  return <AdminLayout><EmailsContent /></AdminLayout>;
}

function EmailsContent() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/emails');
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
      else setError(data.error || 'Failed to load');
    } catch {
      setError('Network error');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Email Logs</h1>
          <p className="text-muted-foreground text-sm">
            Sent emails via Resend.{' '}
            <a href="https://resend.com/emails" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
              Resend dashboard <ExternalLink size={12} />
            </a>
          </p>
        </div>
        <button onClick={loadLogs} className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground transition-colors" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

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
