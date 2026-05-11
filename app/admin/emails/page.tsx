'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, RefreshCw, Inbox, ChevronRight } from 'lucide-react';

export default function AdminEmailsPage() {
  const [tab, setTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [inboundEmails, setInboundEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sentRes, inboundRes] = await Promise.all([
        fetch('/api/admin/emails', { credentials: 'include' }),
        fetch('/api/admin/emails?type=inbound', { credentials: 'include' }),
      ]);
      const sentData = await sentRes.json();
      const inboundData = await inboundRes.json();
      if (sentData.emails) setSentEmails(sentData.emails);
      if (Array.isArray(inboundData)) setInboundEmails(inboundData);
    } catch { setError('Network error'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSend = async () => {
    if (!compose.to || !compose.subject || !compose.body) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/emails/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(compose) });
      const data = await res.json();
      if (data.ok) { setCompose({ to: '', subject: '', body: '' }); fetchData(); setTab('sent'); }
      else setError(data.error || 'Failed to send');
    } catch { setError('Network error'); }
    setSending(false);
  };

  const formatDate = (d: string) => { const date = new Date(d); return date.toLocaleString(); };

  const tabs = [
    { id: 'inbox' as const, label: 'Inbox', icon: Inbox, count: inboundEmails.length },
    { id: 'sent' as const, label: 'Sent', icon: Send, count: sentEmails.length },
    { id: 'compose' as const, label: 'Compose', icon: Mail },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Emails</h1>
        <button onClick={fetchData} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white/[0.06] text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} /> {t.label}
              {t.count !== undefined && (
                <span className="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

      {/* Compose tab */}
      {tab === 'compose' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2"><Send size={14} className="text-primary/60" />Compose email</h2>
          <div className="space-y-3">
            <input value={compose.to} onChange={e => setCompose(p => ({ ...p, to: e.target.value }))} placeholder="To: email@example.com"
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30" />
            <input value={compose.subject} onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))} placeholder="Subject"
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30" />
            <textarea value={compose.body} onChange={e => setCompose(p => ({ ...p, body: e.target.value }))} placeholder="Message..." rows={5}
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-none" />
            <button onClick={handleSend} disabled={sending || !compose.to || !compose.subject || !compose.body}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity">
              {sending ? 'Sending...' : 'Send email'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Inbox tab */}
      {tab === 'inbox' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="font-semibold text-sm flex items-center gap-2"><Inbox size={14} className="text-primary/60" /> Received emails</span>
              {inboundEmails.length > 0 && <span className="text-[10px] text-muted-foreground">{inboundEmails.length} emails</span>}
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : inboundEmails.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Inbox size={32} className="mx-auto text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No emails received yet</p>
                <div className="text-[11px] text-muted-foreground/60 max-w-md mx-auto leading-relaxed space-y-2">
                  <p>To receive emails at support@selah.fm, set up Resend inbound:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-left">
                    <li>Resend → <strong>Domains</strong> → verify a subdomain (e.g. <code>mail.selah.fm</code>) with inbound enabled</li>
                    <li>Resend → <strong>Webhooks</strong> → Add Webhook → URL: <code className="text-[10px] bg-white/[0.04] px-1 py-0.5 rounded">https://selah.fm/api/admin/emails/inbound</code></li>
                    <li>Select event <strong>email.received</strong></li>
                    <li>Copy the webhook secret → add <code>RESEND_WEBHOOK_SECRET</code> in Railway</li>
                  </ol>
                  <p className="text-[10px]">Emails will arrive at <code>support@mail.selah.fm</code>. Use a subdomain to avoid MX conflicts with your root domain.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {inboundEmails.map((e: any) => {
                  const isOpen = expandedEmail === e.id;
                  return (
                    <div key={e.id}>
                      <button
                        onClick={() => setExpandedEmail(isOpen ? null : e.id)}
                        className="w-full text-left px-5 py-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm ${e.read ? 'text-muted-foreground' : 'font-semibold'}`}>
                            {e.from_email}
                            {!e.read && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(e.received_at)}</span>
                        </div>
                        <p className={`text-xs truncate ${e.read ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>{e.subject}</p>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 space-y-2 border-t border-white/[0.03] pt-3 mx-5">
                              <div className="text-[10px] text-muted-foreground">
                                <span>To: {e.to_email}</span>
                              </div>
                              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {e.body_text || e.body_html?.replace(/<[^>]*>/g, '') || '(no content)'}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Sent tab */}
      {tab === 'sent' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="font-semibold text-sm flex items-center gap-2"><Send size={14} className="text-primary/60" /> Sent emails</span>
              {sentEmails.length > 0 && <span className="text-[10px] text-muted-foreground">{sentEmails.length} emails</span>}
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : sentEmails.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No emails sent yet</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {sentEmails.map((e: any, i: number) => {
                  const isOpen = expandedEmail === `sent-${i}`;
                  return (
                    <div key={i}>
                      <button
                        onClick={() => setExpandedEmail(isOpen ? null : `sent-${i}`)}
                        className="w-full text-left px-5 py-3 hover:bg-white/[0.02] transition-colors flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{e.to_email || e.to}</p>
                          <p className="text-xs text-muted-foreground truncate">{e.subject}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-3">{formatDate(e.created_at)}</span>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 border-t border-white/[0.03] pt-3 mx-5">
                              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
                                {e.body || e.html_body?.replace(/<[^>]*>/g, '') || '(no content)'}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
