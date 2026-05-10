'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../layout';

export default function EmailsPage() {
  const content = (
    <EmailsContent />
  );

  return <AdminLayout>{content}</AdminLayout>;
}

function EmailsContent() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/emails')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setLogs(d);
        else setError('Failed to load email logs');
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Email Logs</h1>
          <p className="text-muted-foreground text-sm">
            View sent emails and delivery status. Manage your domain at{' '}
            <a href="https://resend.com" target="_blank" rel="noopener" className="text-primary hover:underline">
              resend.com →
            </a>
          </p>
        </div>
      </div>

      {/* Email addresses card */}
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 mb-6">
        <h2 className="font-semibold text-sm mb-3">Email Addresses</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
            <p className="text-sm font-medium">info@selah.fm</p>
            <p className="text-xs text-muted-foreground mt-1">
              Used for transactional emails (welcome, approvals, payouts).
              Sender for all automated platform emails.
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
            <p className="text-sm font-medium">support@selah.fm</p>
            <p className="text-xs text-muted-foreground mt-1">
              Used for support emails and human escalation from the AI chat widget.
              Set up forwarding in Resend to receive replies.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-xs text-muted-foreground">
            <strong>To receive incoming emails:</strong> Set up email forwarding from your domain registrar
            (or use Resend&apos;s inbound webhooks) to forward info@selah.fm and support@selah.fm
            to your personal email. Alternatively, access the Resend dashboard to view sent emails.
          </p>
          <div className="flex gap-3 mt-3">
            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Resend Dashboard →
            </a>
            <a
              href="https://resend.com/docs/send-with-nextjs"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Resend Docs →
            </a>
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="font-semibold text-sm">Recent Emails</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No emails sent yet. Emails will appear here once sent.
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
